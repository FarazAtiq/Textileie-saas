import { useState } from 'react';
import { formatNum } from '../utils/calculations.js';
import { PageHeader } from '../components/ResultCard.jsx';
import { SMVSelector } from '../components/SMVSelector.jsx';
import { ArticleSelector } from '../components/ArticleSelector.jsx';
import { createReport, updateProfile, getStyleCostSummary, upsertStyleCostModule } from '../lib/db.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { exportReportPDF } from '../utils/pdfExport.js';
import { Plus, Trash2, Save, Download, FileText } from 'lucide-react';

const newAccessory = () => ({ id: Date.now() + Math.random(), name: '', qty: 1, unitPrice: 0 });
const newFabric = () => ({ id: Date.now() + Math.random(), type: '', baseSize: 'L', unit: 'meter', consumption: 1, price: 0 });
const newThreadCost = () => ({ id: Date.now() + Math.random(), type: 'Polyester 120T', meters: 0, pricePerMeter: 0 });

export default function CostingPage() {
  const { profile, refreshProfile, user } = useAuth();
  const { toast, ToastContainer } = useToast();
  const [saving, setSaving] = useState(false);

  // Article / SMV pull
  const [articleNumber, setArticleNumber] = useState('');
  const [selectedSMV, setSelectedSMV] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [loadingStyleData, setLoadingStyleData] = useState(false);

  // CMT rate ($/min) — defaults from profile if saved, else 0.05
  const [cmtRate, setCmtRate] = useState(profile?.cmt_rate_per_min ?? 0.05);
  const [savingRate, setSavingRate] = useState(false);

  // Fabric & thread cost — manual entry (or pulled later from saved BOM/thread reports)
  const [fabricRows, setFabricRows] = useState([{ id: 1, type: 'Main fabric', baseSize: 'L', unit: 'meter', consumption: 1.6, price: 2.2 }]);
  const [threadRows, setThreadRows] = useState([{ id: 1, type: 'Polyester 120T', meters: 100, pricePerMeter: 0.0015 }]);

  // Accessories — dynamic list
  const [accessories, setAccessories] = useState([
    { id: 1, name: 'Buttons', qty: 4, unitPrice: 0.02 },
    { id: 2, name: 'Main label', qty: 1, unitPrice: 0.03 },
    { id: 3, name: 'Care label', qty: 1, unitPrice: 0.01 },
    { id: 4, name: 'Poly bag', qty: 1, unitPrice: 0.02 },
  ]);

  // Other costs
  const [overhead, setOverhead]         = useState(0.4);
  const [freightPerUnit, setFreight]    = useState(0.3);
  const [agentCommPct, setAgentComm]    = useState(5);
  const [bankChargePct, setBankCharge]  = useState(1);
  const [dutyPct, setDuty]              = useState(0);
  const [profitPct, setProfit]          = useState(20);

  // ── derived values ──
  const smv = selectedSMV ? selectedSMV.total_smv : 0;
  const cmtCost = +(smv * cmtRate).toFixed(4);

  const fabricCostPerUnit = fabricRows.reduce((sum, f) => sum + (parseFloat(f.consumption) || 0) * (parseFloat(f.price) || 0), 0);
  const threadCostPerUnit = threadRows.reduce((sum, t) => sum + (parseFloat(t.meters) || 0) * (parseFloat(t.pricePerMeter) || 0), 0);
  const accessoriesTotal = accessories.reduce((sum, a) => sum + (a.qty || 0) * (a.unitPrice || 0), 0);

  const baseProductionCost = fabricCostPerUnit + threadCostPerUnit + cmtCost + accessoriesTotal + overhead + freightPerUnit;
  const agentComm  = baseProductionCost * (agentCommPct / 100);
  const bankCharge = baseProductionCost * (bankChargePct / 100);
  const duty        = baseProductionCost * (dutyPct / 100);
  const totalWithExtras = baseProductionCost + agentComm + bankCharge + duty;
  const profitAmount = totalWithExtras * (profitPct / 100);
  const fobPrice = totalWithExtras + profitAmount;

  // ── accessory helpers ──
  const setFabric = (id, key, val) => setFabricRows(fabricRows.map(f => f.id === id ? { ...f, [key]: val } : f));
  const addFabric = () => setFabricRows([...fabricRows, newFabric()]);
  const removeFabric = (id) => setFabricRows(fabricRows.filter(f => f.id !== id));
  const setThread = (id, key, val) => setThreadRows(threadRows.map(t => t.id === id ? { ...t, [key]: val } : t));
  const addThread = () => setThreadRows([...threadRows, newThreadCost()]);
  const removeThread = (id) => setThreadRows(threadRows.filter(t => t.id !== id));

  const setAcc = (id, key, val) => setAccessories(accessories.map(a => a.id === id ? { ...a, [key]: val } : a));
  const addAcc = () => setAccessories([...accessories, newAccessory()]);
  const removeAcc = (id) => setAccessories(accessories.filter(a => a.id !== id));


  const handleStyleSelect = async ({ style, color }) => {
    setSelectedStyle(style || null);
    setSelectedColor(color || null);
    if (!style) return;

    setArticleNumber(style.article_number || '');
    setLoadingStyleData(true);
    try {
      const summary = await getStyleCostSummary({ style_id: style.id, color_id: color?.id || null });

      if (summary?.smv?.summary?.total_smv) {
        setSelectedSMV({
          total_smv: summary.smv.summary.total_smv,
          article_number: style.article_number,
          name: style.style_name,
          garment_type: style.garment_type,
          department_breakdown: summary.smv.summary.department_breakdown
        });
      }

      if (summary?.thread?.summary) {
        const t = summary.thread.summary;
        setThreadRows([{ id: Date.now(), type: t.threadType || 'Thread', meters: t.totalMeters || 0, pricePerMeter: t.threadPricePerMeter || 0 }]);
      }

      if (summary?.fabric_bom?.summary) {
        const bom = summary.fabric_bom.summary;
        // BOM currently stores consumption totals, not price. Keep a clear placeholder row for costing rate entry.
        setFabricRows([{ id: Date.now() + 1, type: 'Fabric BOM total', baseSize: style.base_size || 'L', unit: 'kg/m/yd', consumption: 1, price: 0, source: bom }]);
      }
    } catch (err) {
      toast('Failed to load style costing data: ' + err.message, 'error');
    } finally {
      setLoadingStyleData(false);
    }
  };

  // ── save CMT rate to profile/settings ──
  const saveCmtRate = async () => {
    setSavingRate(true);
    try {
      await updateProfile(user.id, { cmt_rate_per_min: cmtRate });
      await refreshProfile();
      toast('CMT rate saved to settings');
    } catch (err) {
      toast('Failed to save rate: ' + err.message, 'error');
    } finally { setSavingRate(false); }
  };

  // ── save report ──
  const handleSave = async () => {
    setSaving(true);
    try {
      const savedReport = await createReport({
        type: 'costing',
        title: 'Costing \u2014 ' + (articleNumber ? 'Art#' + articleNumber : 'Garment') + ' \u2014 ' + new Date().toLocaleDateString(),
        inputs: {
          style_id: selectedStyle?.id || null,
          color_id: selectedColor?.id || null,
          styleName: selectedStyle?.style_name || '',
          buyer: selectedStyle?.buyer || '',
          colorName: selectedColor?.color_name || '',
          baseSize: selectedStyle?.base_size || '',
          articleNumber,
          smv,
          cmtRatePerMin: cmtRate,
          fabricRows,
          threadRows,
          fabricCostPerUnit,
          threadCostPerUnit,
          accessoriesCount: accessories.length,
          overhead, freightPerUnit, agentCommPct, bankChargePct, dutyPct, profit: profitPct,
        },
        results: {
          cmtCost,
          fabricCostSummary: fabricRows,
          threadCostSummary: threadRows,
          accessoriesTotal: accessoriesTotal.toFixed(4),
          totalProductionCost: baseProductionCost.toFixed(2),
          agentCommission: agentComm.toFixed(2),
          bankCharge: bankCharge.toFixed(2),
          duty: duty.toFixed(2),
          profitAmount: profitAmount.toFixed(2),
          fobPrice: fobPrice.toFixed(2),
        }
      });
      if (selectedStyle?.id) {
        await upsertStyleCostModule({
          style_id: selectedStyle.id,
          color_id: selectedColor?.id || null,
          module_type: 'costing',
          data: { fabricRows, threadRows, accessories, overhead, freightPerUnit, agentCommPct, bankChargePct, dutyPct, profitPct, cmtRate },
          summary: { articleNumber, styleName: selectedStyle.style_name || '', buyer: selectedStyle.buyer || '', smv, cmtCost, fabricCostPerUnit, threadCostPerUnit, accessoriesTotal, fobPrice }
        });
      }
      toast('Costing report saved and linked to Style Master');
    } catch (err) { toast('Failed: ' + err.message, 'error'); }
    finally { setSaving(false); }
  };

  // ── PDF export ──
  const handleExportPDF = () => {
    exportReportPDF({
      type: 'costing',
      title: 'FOB Costing Sheet \u2014 ' + (articleNumber ? 'Art#' + articleNumber : 'Garment'),
      inputs: {
        Article: articleNumber || '\u2014',
        SMV: smv + ' min',
        'CMT rate': '$' + cmtRate + '/min',
        'Fabric cost/unit': '$' + fabricCostPerUnit,
        'Thread cost/unit': '$' + threadCostPerUnit,
        'Accessories total': '$' + accessoriesTotal.toFixed(4),
      },
      results: {
        'CMT cost (SMV x rate)': '$' + cmtCost,
        'Total production cost': '$' + baseProductionCost.toFixed(2),
        'Agent commission': '$' + agentComm.toFixed(2),
        'Bank charge': '$' + bankCharge.toFixed(2),
        'Duty': '$' + duty.toFixed(2),
        [`Profit (${profitPct}%)`]: '$' + profitAmount.toFixed(2),
        'FOB Price': '$' + fobPrice.toFixed(2),
      },
      companyName: profile?.company_name,
      userName: profile?.full_name
    });
  };

  // ── Excel export ──
  const handleExportExcel = () => {
    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="UTF-8"></head><body><table>' +
      '<tr><td colspan="2" style="background:#0F2942;color:white;font-weight:bold;font-size:14pt;padding:8px">FOB Costing Sheet \u2014 TextileIE</td></tr>' +
      '<tr><td colspan="2" style="background:#E4F4F1;padding:6px;font-weight:bold">Article#: ' + (articleNumber || '\u2014') + '   SMV: ' + smv + ' min</td></tr>' +
      '<tr><th style="background:#0F2942;color:white;padding:5px 8px">Cost component</th><th style="background:#0F2942;color:white;padding:5px 8px">Value</th></tr>' +
      [
        ['Fabric cost / unit', '$' + fabricCostPerUnit],
        ['Thread cost / unit', '$' + threadCostPerUnit],
        ['CMT cost (SMV \u00D7 $' + cmtRate + '/min)', '$' + cmtCost],
        ['Accessories total', '$' + accessoriesTotal.toFixed(4)],
        ['Overhead', '$' + overhead],
        ['Freight / unit', '$' + freightPerUnit],
        ['Total production cost', '$' + baseProductionCost.toFixed(2)],
        ['Agent commission (' + agentCommPct + '%)', '$' + agentComm.toFixed(2)],
        ['Bank charge (' + bankChargePct + '%)', '$' + bankCharge.toFixed(2)],
        ['Duty (' + dutyPct + '%)', '$' + duty.toFixed(2)],
        ['Profit (' + profitPct + '%)', '$' + profitAmount.toFixed(2)],
      ].map(([k, v], i) => '<tr style="background:' + (i % 2 === 0 ? '#F4F7FA' : 'white') + '"><td style="border:1px solid #D8E4EE;padding:5px 8px">' + k + '</td><td style="border:1px solid #D8E4EE;padding:5px 8px;font-weight:bold;color:#0D7A6B">' + v + '</td></tr>').join('') +
      '<tr style="background:#FFC107"><td style="border:1px solid #D8E4EE;padding:6px 8px;font-weight:bold">FOB PRICE</td><td style="border:1px solid #D8E4EE;padding:6px 8px;font-weight:bold;font-size:12pt">$' + fobPrice.toFixed(2) + '</td></tr>' +
      '</table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Costing-' + (articleNumber || 'garment') + '-' + Date.now() + '.xls';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const costBars = [
    { label: 'Fabric',      v: fabricCostPerUnit, color: 'var(--teal)' },
    { label: 'Thread',      v: threadCostPerUnit, color: '#7C3AED' },
    { label: 'CMT (SMV)',   v: cmtCost,           color: 'var(--blue)' },
    { label: 'Accessories', v: accessoriesTotal,  color: '#EA580C' },
    { label: 'Overhead',    v: overhead,          color: 'var(--amber)' },
    { label: 'Freight',     v: freightPerUnit,    color: '#9333EA' },
    { label: 'Profit',      v: profitAmount,      color: 'var(--green)' },
  ];

  return (
    <div>
      <ToastContainer />
      <PageHeader title="Costing Sheet" subtitle="Full garment FOB costing — fabric, thread, CMT (from SMV), accessories, overhead" badge={{ text: 'IE Formula' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* LEFT — inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <ArticleSelector
            value={selectedStyle?.id}
            colorId={selectedColor?.id}
            label="Select from Style Master"
            onSelect={handleStyleSelect}
          />
          {loadingStyleData && <div className="card" style={{ padding: 12, fontSize: 12 }}>Loading SMV, Fabric BOM and Thread data from Style Master...</div>}

          {/* Article + SMV pull */}
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Article & CMT (from SMV)</h3>
            <div className="field"><label>Article #</label><input value={articleNumber} onChange={e => setArticleNumber(e.target.value)} placeholder="e.g. 5400" style={{ fontFamily: 'JetBrains Mono', fontWeight: 700 }} /></div>
            <SMVSelector onSelect={t => {
              setSelectedSMV(t);
              const art = t.article_number || articleNumber;
              if (t.article_number) setArticleNumber(t.article_number);
              try {
                const saved = JSON.parse(localStorage.getItem('textileie_thread_cost_by_article') || '{}')[art];
                if (saved) setThreadRows([{ id: Date.now(), type: saved.threadType, meters: saved.totalMeters, pricePerMeter: saved.threadPricePerMeter }]);
              } catch (e) {}
            }} />

            {selectedSMV && (
              <div style={{ padding: '10px 12px', background: 'var(--teal-light)', borderRadius: 8, marginBottom: 12, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>SMV loaded</span>
                  <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--teal)' }}>{smv} min</span>
                </div>
              </div>
            )}

            <div className="field">
              <label>CMT rate ($ per minute)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" step="0.001" value={cmtRate} onChange={e => setCmtRate(parseFloat(e.target.value) || 0)} style={{ flex: 1 }} />
                <button className="btn btn-secondary btn-sm" onClick={saveCmtRate} disabled={savingRate}>{savingRate ? '...' : 'Save default'}</button>
              </div>
            </div>

            <div style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>CMT = SMV \u00D7 rate</span>
              <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--teal)', fontSize: 15 }}>${cmtCost}</span>
            </div>
          </div>

          {/* Fabric & thread */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3>Fabric cost summary</h3>
              <button className="btn btn-secondary btn-sm" onClick={addFabric}><Plus size={13} /> Add fabric</button>
            </div>
            {fabricRows.map(f => (
              <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '1.3fr 70px 80px 80px 80px 28px', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                <input value={f.type} onChange={e => setFabric(f.id, 'type', e.target.value)} placeholder="Fabric type" style={{ fontSize: 12 }} />
                <input value={f.baseSize} onChange={e => setFabric(f.id, 'baseSize', e.target.value)} placeholder="Base size" style={{ fontSize: 12 }} />
                <select value={f.unit} onChange={e => setFabric(f.id, 'unit', e.target.value)} style={{ fontSize: 12 }}><option value="meter">meter</option><option value="yard">yard</option><option value="kg">kg</option></select>
                <input type="number" step="0.001" value={f.consumption} onChange={e => setFabric(f.id, 'consumption', parseFloat(e.target.value) || 0)} style={{ fontSize: 12 }} />
                <input type="number" step="0.01" value={f.price} onChange={e => setFabric(f.id, 'price', parseFloat(e.target.value) || 0)} style={{ fontSize: 12 }} />
                <button onClick={() => removeFabric(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Trash2 size={13} /></button>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border-light)' }}><span>Fabric total / unit</span><strong>${fabricCostPerUnit.toFixed(4)}</strong></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 12px' }}>
              <h3>Thread cost by type</h3>
              <button className="btn btn-secondary btn-sm" onClick={addThread}><Plus size={13} /> Add thread</button>
            </div>
            {threadRows.map(t => (
              <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 90px 90px 28px', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                <input value={t.type} onChange={e => setThread(t.id, 'type', e.target.value)} placeholder="Thread type" style={{ fontSize: 12 }} />
                <input type="number" step="0.001" value={t.meters} onChange={e => setThread(t.id, 'meters', parseFloat(e.target.value) || 0)} style={{ fontSize: 12 }} />
                <input type="number" step="0.0001" value={t.pricePerMeter} onChange={e => setThread(t.id, 'pricePerMeter', parseFloat(e.target.value) || 0)} style={{ fontSize: 12 }} />
                <button onClick={() => removeThread(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Trash2 size={13} /></button>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border-light)' }}><span>Thread total / unit</span><strong>${threadCostPerUnit.toFixed(4)}</strong></div>
          </div>

          {/* Accessories */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3>Accessories</h3>
              <button className="btn btn-secondary btn-sm" onClick={addAcc}><Plus size={13} /> Add</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 70px 80px 70px 28px', gap: 6, marginBottom: 6 }}>
              {['Name', 'Qty', 'Unit $', 'Total', ''].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</div>
              ))}
            </div>
            {accessories.map(a => (
              <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '2fr 70px 80px 70px 28px', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                <input value={a.name} onChange={e => setAcc(a.id, 'name', e.target.value)} placeholder="e.g. Zipper" style={{ fontSize: 12 }} />
                <input type="number" value={a.qty} onChange={e => setAcc(a.id, 'qty', parseFloat(e.target.value) || 0)} style={{ fontSize: 12 }} />
                <input type="number" step="0.01" value={a.unitPrice} onChange={e => setAcc(a.id, 'unitPrice', parseFloat(e.target.value) || 0)} style={{ fontSize: 12 }} />
                <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: 'var(--teal)' }}>${((a.qty || 0) * (a.unitPrice || 0)).toFixed(3)}</span>
                <button onClick={() => removeAcc(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Trash2 size={13} /></button>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border-light)', marginTop: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Accessories total</span>
              <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--teal)' }}>${accessoriesTotal.toFixed(4)}</span>
            </div>
          </div>

          {/* Other costs */}
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Overhead & charges</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                ['overhead', 'Overhead / unit ($)', overhead, setOverhead],
                ['freight', 'Freight / unit ($)', freightPerUnit, setFreight],
                ['agentComm', 'Agent comm (%)', agentCommPct, setAgentComm],
                ['bankCharge', 'Bank charge (%)', bankChargePct, setBankCharge],
                ['duty', 'Duty (%)', dutyPct, setDuty],
                ['profit', 'Profit margin (%)', profitPct, setProfit],
              ].map(([k, l, v, setter]) => (
                <div className="field" key={k}><label>{l}</label><input type="number" step="0.01" value={v} onChange={e => setter(parseFloat(e.target.value) || 0)} /></div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>FOB Price</h3>
            <div style={{ textAlign: 'center', padding: '16px 0 20px', borderBottom: '1px solid var(--border-light)', marginBottom: 16 }}>
              <div style={{ fontSize: 42, fontWeight: 700, color: 'var(--teal)', fontFamily: 'JetBrains Mono' }}>${formatNum(fobPrice)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>FOB PRICE PER UNIT</div>
              {articleNumber && <div style={{ fontSize: 12, color: 'var(--teal)', marginTop: 6, fontWeight: 600 }}>Art# {articleNumber}</div>}
            </div>

            {[
              ['Fabric cost', '$' + formatNum(fabricCostPerUnit)],
              ['Thread cost', '$' + formatNum(threadCostPerUnit)],
              ['CMT cost (SMV \u00D7 rate)', '$' + formatNum(cmtCost)],
              ['Accessories', '$' + formatNum(accessoriesTotal)],
              ['Overhead', '$' + formatNum(overhead)],
              ['Freight', '$' + formatNum(freightPerUnit)],
              ['Total production cost', '$' + formatNum(baseProductionCost)],
              ['Agent commission', '$' + formatNum(agentComm)],
              ['Bank charge', '$' + formatNum(bankCharge)],
              ['Duty', '$' + formatNum(duty)],
              ['Profit (' + profitPct + '%)', '$' + formatNum(profitAmount)],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 500 }}>{v}</span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={saving}><Save size={14} />{saving ? 'Saving...' : 'Save report'}</button>
              <button className="btn btn-secondary" onClick={handleExportPDF}><Download size={14} /></button>
            </div>
            <button className="btn btn-sm btn-full" onClick={handleExportExcel} style={{ background: '#217346', color: 'white', border: 'none', marginTop: 8 }}><FileText size={13} /> Export Excel</button>
          </div>

          {/* Cost breakdown bars */}
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Cost composition</h3>
            {costBars.map(b => (
              <div key={b.label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{b.label}</span>
                  <span style={{ color: b.color, fontFamily: 'JetBrains Mono' }}>{fobPrice > 0 ? ((b.v / fobPrice) * 100).toFixed(1) : 0}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: fobPrice > 0 ? ((b.v / fobPrice) * 100) + '%' : '0%', background: b.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
