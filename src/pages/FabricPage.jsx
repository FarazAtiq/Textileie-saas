import { useState } from 'react';
import { calcFabricYards, calcFabricGSM, formatNum } from '../utils/calculations.js';
import { calcBomConsumption, defaultRatioForSize } from '../utils/fabricBomCalc.js';
import { calcKgToMeter, calcMeterToKg, metersToYards, inchToCm } from '../utils/kgMeterCalc.js';
import { ResultCard, PageHeader, CalcGrid } from '../components/ResultCard.jsx';
import { createReport } from '../lib/db.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { exportReportPDF } from '../utils/pdfExport.js';
import { Plus, Trash2, Save, Download, FileText, ChevronDown, ChevronUp } from 'lucide-react';

function useSave(type, titleFn, inputs, results) {
  const [saving, setSaving] = useState(false);
  const { toast, ToastContainer } = useToast();
  const { profile } = useAuth();
  const save = async () => {
    setSaving(true);
    try {
      await createReport({ type, title: titleFn(), inputs, results });
      toast('Report saved');
    } catch (err) { toast('Failed: ' + err.message, 'error'); }
    finally { setSaving(false); }
  };
  const doExport = (title) => exportReportPDF({ type, title, inputs, results, companyName: profile?.company_name, userName: profile?.full_name });
  return { save, doExport, saving, ToastContainer, profile };
}

const TABS = [
  { id: 'quick', label: 'Quick Consumption' },
  { id: 'bom',   label: 'BOM Sheet' },
  { id: 'conv',  label: 'Kg \u21C4 Meter Converter' },
];

export default function FabricPage() {
  const [activeTab, setActiveTab] = useState('quick');
  return (
    <div>
      <PageHeader title="Fabric Consumption" subtitle="Quick calculator, full BOM sheet, and unit converter" badge={{ text: 'IE Formula' }} />
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-light)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 500, fontFamily: 'inherit', whiteSpace: 'nowrap',
            color: activeTab === t.id ? 'var(--teal)' : 'var(--text-muted)',
            borderBottom: activeTab === t.id ? '2px solid var(--teal)' : '2px solid transparent',
            marginBottom: -1
          }}>{t.label}</button>
        ))}
      </div>
      {activeTab === 'quick' && <QuickConsumptionTab />}
      {activeTab === 'bom'   && <BomSheetTab />}
      {activeTab === 'conv'  && <ConverterTab />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 1 — QUICK CONSUMPTION (existing calculator, unchanged logic)
// ════════════════════════════════════════════════════════════
function QuickConsumptionTab() {
  const [tab, setTab] = useState('yards');
  const [yds, setYds] = useState({ widthInches: 58, garmentLengthCm: 70, wastePct: 12, orderQty: 1000, pricePerYard: 2.5 });
  const [gsm, setGsm] = useState({ lengthCm: 70, widthCm: 120, gsm: 180, patternPieces: 4, wastePct: 10, orderQty: 1000 });
  const ry = calcFabricYards(yds);
  const rg = calcFabricGSM(gsm);
  const setY = k => e => setYds(p => ({ ...p, [k]: parseFloat(e.target.value) || 0 }));
  const setG = k => e => setGsm(p => ({ ...p, [k]: parseFloat(e.target.value) || 0 }));
  const { save: saveY, doExport: expY, saving: savingY, ToastContainer } = useSave('fabric', () => 'Fabric (Yds) \u2014 ' + new Date().toLocaleDateString(), yds, ry);
  const { save: saveG, doExport: expG, saving: savingG } = useSave('fabric', () => 'Fabric (GSM) \u2014 ' + new Date().toLocaleDateString(), gsm, rg);

  return (
    <div>
      <ToastContainer />
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[['yards', 'Yards method'], ['gsm', 'GSM / Weight method']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} className={'btn btn-sm ' + (tab === t ? 'btn-primary' : 'btn-secondary')}>{l}</button>
        ))}
      </div>
      {tab === 'yards' && (
        <CalcGrid>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Inputs</h3>
            {[['widthInches', 'Fabric width (inches)'], ['garmentLengthCm', 'Garment length (cm)'], ['wastePct', 'Wastage %'], ['orderQty', 'Order quantity (pcs)'], ['pricePerYard', 'Price per yard (USD)']].map(([k, l]) => (
              <div className="field" key={k}><label>{l}</label><input type="number" step={k === 'pricePerYard' ? '0.01' : '1'} value={yds[k]} onChange={setY(k)} /></div>
            ))}
          </div>
          <ResultCard title="Consumption Results" mainValue={formatNum(ry.grossYards, 3) + ' yds'} mainLabel="Gross yards per unit"
            rows={[
              { label: 'Net yards per unit', value: formatNum(ry.netYards, 4) + ' yds' },
              { label: 'Waste per unit', value: formatNum(ry.wasteYardsPerUnit, 4) + ' yds' },
              { label: 'Total yards (order)', value: formatNum(ry.totalYards, 1) + ' yds', highlight: true },
              { label: 'Cost per unit', value: '$' + formatNum(ry.costPerUnit) },
              { label: 'Total fabric cost', value: '$' + formatNum(ry.totalCost), highlight: true },
            ]}
            onSave={saveY} onExport={() => expY('Fabric Consumption (Yards)')} saving={savingY}
          />
        </CalcGrid>
      )}
      {tab === 'gsm' && (
        <CalcGrid>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>GSM Inputs</h3>
            {[['lengthCm', 'Length (cm)'], ['widthCm', 'Width (cm)'], ['gsm', 'GSM value'], ['patternPieces', 'Pattern pieces'], ['wastePct', 'Wastage %'], ['orderQty', 'Order qty (pcs)']].map(([k, l]) => (
              <div className="field" key={k}><label>{l}</label><input type="number" value={gsm[k]} onChange={setG(k)} /></div>
            ))}
          </div>
          <ResultCard title="Weight Results" mainValue={formatNum(rg.grossWeightKg, 3) + ' kg'} mainLabel="Gross weight per unit"
            rows={[
              { label: 'Net fabric area', value: formatNum(rg.totalNetArea, 4) + ' m2' },
              { label: 'Net weight per unit', value: formatNum(rg.netWeightKg, 4) + ' kg' },
              { label: 'Waste per unit', value: formatNum(rg.wasteKgPerUnit, 4) + ' kg' },
              { label: 'Total weight (order)', value: formatNum(rg.totalWeightKg) + ' kg', highlight: true },
            ]}
            onSave={saveG} onExport={() => expG('Fabric Consumption (GSM)')} saving={savingG}
          />
        </CalcGrid>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 2 — BOM SHEET (dynamic components x dynamic sizes)
// ════════════════════════════════════════════════════════════
const newComponent = (num) => ({
  id: Date.now() + num,
  compNo: num,
  usageAt: '',
  fabricDescription: '',
  fabricCode: '',
  supplier: '',
  gsm: '',
  cuttableWidth: '',
  kgsPerMtr: '',
  uom: 'KG',
  allowancePct: 4,
  markerSavingPct: '',
  sizeData: {}, // { sizeId: { mode: 'manual'|'auto', layLength, noOfPcs, efficiency, ratio } }
});

const newSize = (label) => ({ id: Date.now() + Math.random(), label });

export function BomSheetTab() {
  const { profile } = useAuth();
  const { toast, ToastContainer } = useToast();
  const [saving, setSaving] = useState(false);

  // Header info
  const [artNo, setArtNo]       = useState('');
  const [styleName, setStyleName] = useState('');
  const [customer, setCustomer] = useState('');
  const [techPackRef, setTechPackRef] = useState('');
  const [consumptionNo, setConsumptionNo] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [docType, setDocType] = useState('costing'); // costing | firstBom | finalReview | trialRun

  // Sizes (dynamic)
  const [sizes, setSizes] = useState([
    newSize('S'), newSize('M'), newSize('L'), newSize('XL'), newSize('2XL')
  ]);
  const [baseSizeId, setBaseSizeId] = useState(null); // for auto-scale reference

  // Components (dynamic)
  const [components, setComponents] = useState([
    { ...newComponent(1), usageAt: 'Main fabric', fabricDescription: '', uom: 'KG', allowancePct: 4 },
  ]);

  const [signOff, setSignOff] = useState({ providedBy: '', approvedBy: '', receivedBy: '' });

  // ── size helpers ──
  const addSize = () => setSizes([...sizes, newSize('Size ' + (sizes.length + 1))]);
  const removeSize = (id) => {
    setSizes(sizes.filter(s => s.id !== id));
    setComponents(components.map(c => {
      const sd = { ...c.sizeData };
      delete sd[id];
      return { ...c, sizeData: sd };
    }));
  };
  const renameSize = (id, label) => setSizes(sizes.map(s => s.id === id ? { ...s, label } : s));

  // ── component helpers ──
  const addComponent = () => setComponents([...components, newComponent(components.length + 1)]);
  const removeComponent = (id) => setComponents(components.filter(c => c.id !== id).map((c, i) => ({ ...c, compNo: i + 1 })));
  const setComp = (id, key, val) => setComponents(components.map(c => c.id === id ? { ...c, [key]: val } : c));

  const getSizeData = (comp, sizeId) => comp.sizeData[sizeId] || { mode: 'manual', layLength: 0, noOfPcs: 4, efficiency: 70, ratio: 1.0 };

  const setSizeData = (compId, sizeId, key, val) => {
    setComponents(components.map(c => {
      if (c.id !== compId) return c;
      const current = getSizeData(c, sizeId);
      return { ...c, sizeData: { ...c.sizeData, [sizeId]: { ...current, [key]: val } } };
    }));
  };

  // ── calculation per component per size ──
  const calcForSize = (comp, sizeId) => {
    const sd = getSizeData(comp, sizeId);
    let layLength = sd.layLength || 0;

    if (sd.mode === 'auto' && baseSizeId && sizeId !== baseSizeId) {
      const baseSd = getSizeData(comp, baseSizeId);
      const ratio = sd.ratio || defaultRatioForSize(sizes.find(s => s.id === sizeId)?.label);
      layLength = (baseSd.layLength || 0) * ratio;
    }

    const consumption = calcBomConsumption({
      layLength,
      noOfPcs: sd.noOfPcs || 1,
      kgsPerMtr: parseFloat(comp.kgsPerMtr) || 1,
      allowancePct: parseFloat(comp.allowancePct) || 0,
    });

    return { ...sd, layLength: +layLength.toFixed(3), consumption };
  };

  // ── totals per size (sum across all components) ──
  const totalsBySize = sizes.reduce((acc, s) => {
    acc[s.id] = components.reduce((sum, c) => sum + calcForSize(c, s.id).consumption, 0);
    return acc;
  }, {});

  // ── save ──
  const handleSave = async () => {
    setSaving(true);
    try {
      const inputs = {
        articleNumber: artNo, styleName, customer, techPackRef, consumptionNo, issueDate, docType,
        components: components.length, sizes: sizes.map(s => s.label).join(', '),
      };
      const results = {};
      sizes.forEach(s => { results['Total ' + s.label] = totalsBySize[s.id]?.toFixed(3) + ' kg/yd'; });

      await createReport({
        type: 'fabric',
        title: 'Fabric BOM \u2014 ' + (artNo ? 'Art#' + artNo + ' ' : '') + styleName + ' \u2014 ' + new Date().toLocaleDateString(),
        inputs, results,
      });
      toast('Fabric BOM saved');
    } catch (err) { toast('Failed: ' + err.message, 'error'); }
    finally { setSaving(false); }
  };

  // ── PDF export (landscape, visually matching the sheet) ──
  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF('landscape', 'mm', 'a4');

      doc.setFillColor(15, 41, 66);
      doc.rect(0, 0, 297, 16, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text('FABRIC Consumption', 14, 10);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.text((profile?.company_name || ''), 240, 10);

      doc.setTextColor(15, 41, 66);
      doc.setFontSize(8);
      let hy = 22;
      doc.text('Art#: ' + (artNo || '\u2014'), 14, hy);
      doc.text('Style Name: ' + (styleName || '\u2014'), 70, hy);
      doc.text('Customer: ' + (customer || '\u2014'), 140, hy);
      doc.text('Issue Date: ' + issueDate, 220, hy);
      hy += 5;
      doc.text('Tech Pack Ref#: ' + (techPackRef || '\u2014'), 14, hy);
      doc.text('Consumption #: ' + (consumptionNo || '\u2014'), 100, hy);
      doc.text('Doc type: ' + docType, 200, hy);
      hy += 6;

      const sizeLabels = sizes.map(s => s.label);
      const head = [['Comp#', 'Usage at', 'Fabric Desc.', 'Fabric Code', 'Supplier', 'GSM', 'Width', 'Kgs/Mtr', 'UOM', 'Allow%',
        ...sizeLabels.flatMap(s => [s + ' Lay(m)', s + ' Pcs', s + ' Cons.'])]];

      const body = components.map(c => {
        const row = [c.compNo, c.usageAt, c.fabricDescription, c.fabricCode, c.supplier, c.gsm, c.cuttableWidth, c.kgsPerMtr, c.uom, c.allowancePct + '%'];
        sizes.forEach(s => {
          const r = calcForSize(c, s.id);
          row.push(r.layLength || 0, r.noOfPcs || 0, r.consumption.toFixed(3));
        });
        return row;
      });

      const totalsRow = ['', '', '', '', '', '', '', '', 'TOTAL', ''];
      sizes.forEach(s => { totalsRow.push('', '', totalsBySize[s.id]?.toFixed(3) || '0'); });
      body.push(totalsRow);

      autoTable(doc, {
        startY: hy,
        head, body,
        theme: 'grid',
        headStyles: { fillColor: [15, 41, 66], textColor: 255, fontSize: 6 },
        bodyStyles: { fontSize: 6 },
        margin: { left: 14, right: 14 },
      });

      let fy = doc.lastAutoTable.finalY + 14;
      if (fy > 180) { doc.addPage('a4', 'landscape'); fy = 20; }
      doc.setFontSize(8); doc.setTextColor(15, 41, 66);
      doc.text('Provided by \u2014 GGT: ' + (signOff.providedBy || '________________'), 14, fy);
      doc.text('Approved by \u2014 PD Manager: ' + (signOff.approvedBy || '________________'), 120, fy);
      doc.text('Received by: ' + (signOff.receivedBy || '________________'), 220, fy);

      doc.save('Fabric-BOM-' + (artNo || styleName || 'sheet') + '-' + Date.now() + '.pdf');
      toast('PDF downloaded');
    } catch (err) { toast('PDF failed: ' + err.message, 'error'); }
  };

  const handleExportExcel = () => {
    const sizeLabels = sizes.map(s => s.label);
    const headerCells = ['Comp#', 'Usage at', 'Fabric Description', 'Fabric Code', 'Supplier', 'GSM', 'Cuttable Width', 'Kgs/Mtr', 'UOM', 'Allowance%']
      .concat(sizeLabels.flatMap(s => [s + ' Lay(m)', s + ' Pcs', s + ' Consumption']));

    const rows = components.map(c => {
      const cells = [c.compNo, c.usageAt, c.fabricDescription, c.fabricCode, c.supplier, c.gsm, c.cuttableWidth, c.kgsPerMtr, c.uom, c.allowancePct + '%'];
      sizes.forEach(s => {
        const r = calcForSize(c, s.id);
        cells.push(r.layLength || 0, r.noOfPcs || 0, r.consumption.toFixed(3));
      });
      return '<tr>' + cells.map(v => '<td style="border:1px solid #D8E4EE;padding:4px 6px">' + v + '</td>').join('') + '</tr>';
    }).join('');

    const totalCells = ['', '', '', '', '', '', '', '', 'TOTAL', ''];
    sizes.forEach(s => totalCells.push('', '', totalsBySize[s.id]?.toFixed(3) || '0'));
    const totalRow = '<tr style="background:#FFC107;font-weight:bold">' + totalCells.map(v => '<td style="border:1px solid #D8E4EE;padding:4px 6px">' + v + '</td>').join('') + '</tr>';

    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="UTF-8"></head><body><table>' +
      '<tr><td colspan="' + headerCells.length + '" style="background:#0F2942;color:white;font-weight:bold;font-size:13pt;padding:8px">FABRIC Consumption \u2014 TextileIE</td></tr>' +
      '<tr><td colspan="3" style="background:#E4F4F1;padding:6px">Art#: ' + (artNo || '\u2014') + '</td><td colspan="3" style="background:#E4F4F1;padding:6px">Style: ' + (styleName || '\u2014') + '</td><td colspan="2" style="background:#E4F4F1;padding:6px">Customer: ' + (customer || '\u2014') + '</td><td colspan="2" style="background:#E4F4F1;padding:6px">Date: ' + issueDate + '</td></tr>' +
      '<tr>' + headerCells.map(h => '<th style="background:#0F2942;color:white;padding:5px 6px">' + h + '</th>').join('') + '</tr>' +
      rows + totalRow +
      '<tr><td colspan="' + headerCells.length + '" style="padding:6px;color:#666;font-size:9pt">Provided by: ' + (signOff.providedBy || '') + ' | Approved by: ' + (signOff.approvedBy || '') + ' | Received by: ' + (signOff.receivedBy || '') + '</td></tr>' +
      '</table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Fabric-BOM-' + (artNo || styleName || 'sheet') + '-' + Date.now() + '.xls';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <ToastContainer />

      {/* Header info card */}
      <div className="card" style={{ marginBottom: 16, padding: '16px 18px' }}>
        <h3 style={{ marginBottom: 12 }}>Document info</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div className="field"><label>Art#</label><input value={artNo} onChange={e => setArtNo(e.target.value)} placeholder="8935" style={{ fontFamily: 'JetBrains Mono', fontWeight: 700 }} /></div>
          <div className="field"><label>Style Name</label><input value={styleName} onChange={e => setStyleName(e.target.value)} placeholder="GK-Pant" /></div>
          <div className="field"><label>Customer</label><input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Jako" /></div>
          <div className="field"><label>Issue Date</label><input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} /></div>
          <div className="field"><label>Tech Pack Ref#</label><input value={techPackRef} onChange={e => setTechPackRef(e.target.value)} /></div>
          <div className="field"><label>Consumption #</label><input value={consumptionNo} onChange={e => setConsumptionNo(e.target.value)} /></div>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Document type</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['costing', 'Costing'], ['firstBom', 'First BOM'], ['finalReview', 'Final Review after Trial Run']].map(([v, l]) => (
              <button key={v} onClick={() => setDocType(v)} className={'btn btn-sm ' + (docType === v ? 'btn-primary' : 'btn-secondary')}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Sizes manager */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3>Sizes ({sizes.length})</h3>
          <button className="btn btn-secondary btn-sm" onClick={addSize}><Plus size={13} /> Add size</button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {sizes.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 4px 4px 10px', background: baseSizeId === s.id ? 'var(--teal-light)' : 'var(--bg)', borderRadius: 8, border: baseSizeId === s.id ? '1px solid var(--teal)' : '1px solid var(--border-light)' }}>
              <input value={s.label} onChange={e => renameSize(s.id, e.target.value)} style={{ width: 70, fontSize: 12, border: 'none', background: 'transparent', padding: '4px 2px' }} />
              <button onClick={() => setBaseSizeId(s.id)} title="Set as base size for auto-scale"
                style={{ fontSize: 10, padding: '3px 6px', borderRadius: 4, border: 'none', cursor: 'pointer', background: baseSizeId === s.id ? 'var(--teal)' : 'var(--border-light)', color: baseSizeId === s.id ? 'white' : 'var(--text-muted)' }}>
                {baseSizeId === s.id ? 'BASE' : 'Set base'}
              </button>
              <button onClick={() => removeSize(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
        {!baseSizeId && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Tip: set a base size to enable auto-scale for other sizes.</p>}
      </div>

      {/* Components */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3>Components ({components.length})</h3>
        <button className="btn btn-primary btn-sm" onClick={addComponent}><Plus size={13} /> Add component</button>
      </div>

      {components.map((comp) => (
        <ComponentCard
          key={comp.id}
          comp={comp}
          sizes={sizes}
          baseSizeId={baseSizeId}
          getSizeData={getSizeData}
          setSizeData={setSizeData}
          calcForSize={calcForSize}
          setComp={setComp}
          removeComponent={removeComponent}
          canRemove={components.length > 1}
        />
      ))}

      {/* Totals by size */}
      <div className="card" style={{ marginTop: 16, padding: '16px 18px', background: '#FFF9C4', border: '2px solid #F9A825' }}>
        <h3 style={{ marginBottom: 12, color: 'var(--navy)' }}>Total consumption by size</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + Math.min(sizes.length, 5) + ', 1fr)', gap: 10 }}>
          {sizes.map(s => (
            <div key={s.id} style={{ textAlign: 'center', padding: '10px 6px', background: 'white', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--navy)' }}>{(totalsBySize[s.id] || 0).toFixed(3)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sign-off */}
      <div className="card" style={{ marginTop: 16, padding: '16px 18px' }}>
        <h3 style={{ marginBottom: 12 }}>Sign-off</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div className="field"><label>Provided by \u2014 GGT</label><input value={signOff.providedBy} onChange={e => setSignOff({ ...signOff, providedBy: e.target.value })} /></div>
          <div className="field"><label>Approved by \u2014 PD Manager</label><input value={signOff.approvedBy} onChange={e => setSignOff({ ...signOff, approvedBy: e.target.value })} /></div>
          <div className="field"><label>Received by</label><input value={signOff.receivedBy} onChange={e => setSignOff({ ...signOff, receivedBy: e.target.value })} /></div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
        <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}><Save size={14} /> {saving ? 'Saving...' : 'Save BOM report'}</button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button className="btn btn-secondary btn-full" onClick={handleExportPDF}><Download size={14} /> Download PDF</button>
          <button className="btn btn-full" onClick={handleExportExcel} style={{ background: '#217346', color: 'white', border: 'none' }}><FileText size={14} /> Download Excel</button>
        </div>
      </div>
    </div>
  );
}

// ── Single component card with size sub-table ──
function ComponentCard({ comp, sizes, baseSizeId, getSizeData, setSizeData, calcForSize, setComp, removeComponent, canRemove }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="card" style={{ marginBottom: 14, padding: 0, overflow: 'hidden' }}>
      {/* Component header */}
      <div style={{ padding: '12px 16px', background: 'var(--navy)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--teal)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{comp.compNo}</span>
          <span style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>{comp.usageAt || comp.fabricDescription || 'Component ' + comp.compNo}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {canRemove && (
            <button onClick={(e) => { e.stopPropagation(); removeComponent(comp.id); }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer', padding: 6 }}>
              <Trash2 size={13} />
            </button>
          )}
          {expanded ? <ChevronUp size={16} color="white" /> : <ChevronDown size={16} color="white" />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '16px' }}>
          {/* Component meta fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div className="field"><label>Usage at (body part)</label><input value={comp.usageAt} onChange={e => setComp(comp.id, 'usageAt', e.target.value)} placeholder="e.g. Main fabric, hip and knee pad" /></div>
            <div className="field"><label>Fabric Description</label><input value={comp.fabricDescription} onChange={e => setComp(comp.id, 'fabricDescription', e.target.value)} placeholder="e.g. 100% Polyester Double Speedo" /></div>
            <div className="field"><label>Fabric Code</label><input value={comp.fabricCode} onChange={e => setComp(comp.id, 'fabricCode', e.target.value)} /></div>
            <div className="field"><label>Supplier</label><input value={comp.supplier} onChange={e => setComp(comp.id, 'supplier', e.target.value)} /></div>
            <div className="field"><label>GSM</label><input type="number" value={comp.gsm} onChange={e => setComp(comp.id, 'gsm', e.target.value)} /></div>
            <div className="field"><label>Cuttable Width</label><input type="number" value={comp.cuttableWidth} onChange={e => setComp(comp.id, 'cuttableWidth', e.target.value)} /></div>
            <div className="field"><label>Kgs / Mtr</label><input type="number" step="0.01" value={comp.kgsPerMtr} onChange={e => setComp(comp.id, 'kgsPerMtr', e.target.value)} /></div>
            <div className="field"><label>UOM</label>
              <select value={comp.uom} onChange={e => setComp(comp.id, 'uom', e.target.value)}>
                <option value="KG">KG</option><option value="YARD">YARD</option><option value="METER">METER</option>
              </select>
            </div>
            <div className="field"><label>Allowance % (shrinkage, roll etc.)</label><input type="number" step="0.1" value={comp.allowancePct} onChange={e => setComp(comp.id, 'allowancePct', e.target.value)} /></div>
            <div className="field"><label>Marker Saving % (reference only)</label><input type="number" step="0.01" value={comp.markerSavingPct} onChange={e => setComp(comp.id, 'markerSavingPct', e.target.value)} placeholder="e.g. -4.12" /></div>
          </div>

          {/* Per-size sub table */}
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Per-size consumption</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sizes.map(s => {
              const sd = getSizeData(comp, s.id);
              const calc = calcForSize(comp, s.id);
              const isBase = baseSizeId === s.id;
              const isAuto = sd.mode === 'auto' && baseSizeId && !isBase;
              return (
                <div key={s.id} style={{ padding: '10px 12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{s.label}{isBase && <span style={{ fontSize: 10, color: 'var(--teal)', marginLeft: 6 }}>(BASE)</span>}</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {!isBase && baseSizeId && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => setSizeData(comp.id, s.id, 'mode', 'manual')} className={'btn btn-sm ' + (sd.mode !== 'auto' ? 'btn-primary' : 'btn-secondary')} style={{ padding: '3px 8px', fontSize: 10 }}>Manual</button>
                          <button onClick={() => setSizeData(comp.id, s.id, 'mode', 'auto')} className={'btn btn-sm ' + (sd.mode === 'auto' ? 'btn-primary' : 'btn-secondary')} style={{ padding: '3px 8px', fontSize: 10 }}>Auto-scale</button>
                        </div>
                      )}
                      <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--teal)', fontSize: 14 }}>{calc.consumption.toFixed(3)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: isAuto ? '1fr 1fr 1fr' : '1fr 1fr 1fr', gap: 8 }}>
                    {isAuto ? (
                      <>
                        <div>
                          <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Ratio vs base</label>
                          <input type="number" step="0.01" value={sd.ratio ?? 1.0} onChange={e => setSizeData(comp.id, s.id, 'ratio', parseFloat(e.target.value) || 1)} style={{ fontSize: 12, padding: '6px 8px' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Lay (auto)</label>
                          <div style={{ padding: '6px 8px', background: 'white', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, fontFamily: 'JetBrains Mono', textAlign: 'center' }}>{calc.layLength}</div>
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>No of Pcs</label>
                          <input type="number" value={sd.noOfPcs ?? 4} onChange={e => setSizeData(comp.id, s.id, 'noOfPcs', parseFloat(e.target.value) || 0)} style={{ fontSize: 12, padding: '6px 8px' }} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Lay Length (m)</label>
                          <input type="number" step="0.01" value={sd.layLength ?? 0} onChange={e => setSizeData(comp.id, s.id, 'layLength', parseFloat(e.target.value) || 0)} style={{ fontSize: 12, padding: '6px 8px' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>No of Pcs</label>
                          <input type="number" value={sd.noOfPcs ?? 4} onChange={e => setSizeData(comp.id, s.id, 'noOfPcs', parseFloat(e.target.value) || 0)} style={{ fontSize: 12, padding: '6px 8px' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Efficiency %</label>
                          <input type="number" value={sd.efficiency ?? 70} onChange={e => setSizeData(comp.id, s.id, 'efficiency', parseFloat(e.target.value) || 0)} style={{ fontSize: 12, padding: '6px 8px' }} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// TAB 3 — KG <-> METER CONVERTER
// ════════════════════════════════════════════════════════════
function ConverterTab() {
  const [mode, setMode] = useState('kg'); // 'kg' = weight input | 'm' = length input
  const [weightOrLength, setWeightOrLength] = useState('');
  const [gsmVal, setGsmVal] = useState('');
  const [width, setWidth] = useState('');
  const [widthUnit, setWidthUnit] = useState('cm');
  const [outputUnit, setOutputUnit] = useState('M');
  const [result, setResult] = useState(null);
  const [showHow, setShowHow] = useState(false);

  const calculate = () => {
    const w = parseFloat(weightOrLength) || 0;
    const g = parseFloat(gsmVal) || 0;
    const widthInches = widthUnit === 'cm' ? cmToInch(parseFloat(width) || 0) : (parseFloat(width) || 0);
    if (!g || !widthCm || !w) { setResult(null); return; }

    if (mode === 'kg') {
      // input is weight in kg -> compute length
      const meters = calcKgToMeter({ weightKg: w, gsm: g, widthInches });
      if (outputUnit === 'M') setResult({ value: meters, unit: 'meters' });
      else if (outputUnit === 'Y') setResult({ value: metersToYards(meters), unit: 'yards' });
      else setResult({ value: w, unit: 'kg (input)' });
    } else {
      // input is length in meters -> compute weight
      const kg = calcMeterToKg({ lengthM: w, gsm: g, widthInches });
      if (outputUnit === 'K') setResult({ value: kg, unit: 'kg' });
      else if (outputUnit === 'Y') setResult({ value: metersToYards(w), unit: 'yards (input converted)' });
      else setResult({ value: w, unit: 'meters (input)' });
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Weight / Length</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input type="number" value={weightOrLength} onChange={e => setWeightOrLength(e.target.value)} placeholder={mode === 'kg' ? 'Enter weight in kg' : 'Enter length in meters'} style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
              <input type="radio" checked={mode === 'kg'} onChange={() => setMode('kg')} /> kg
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
              <input type="radio" checked={mode === 'm'} onChange={() => setMode('m')} /> m
            </label>
          </div>
        </div>

        <div className="field"><label>GSM (g/m\u00B2)</label><input type="number" value={gsmVal} onChange={e => setGsmVal(e.target.value)} placeholder="Enter GSM" /></div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Width</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" value={width} onChange={e => setWidth(e.target.value)} placeholder="Enter width" style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
                <input type="radio" checked={widthUnit === 'cm'} onChange={() => setWidthUnit('cm')} /> cm
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
                <input type="radio" checked={widthUnit === 'inch'} onChange={() => setWidthUnit('inch')} /> inch
              </label>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>Output Unit</label>
          <div style={{ display: 'flex', gap: 20 }}>
            {[['M', 'Meters'], ['K', 'Kilograms'], ['Y', 'Yards']].map(([v, l]) => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <input type="radio" checked={outputUnit === v} onChange={() => setOutputUnit(v)} />
                <strong>{v}</strong> ({l})
              </label>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-full" onClick={calculate} style={{ padding: '12px', fontSize: 15 }}>Calculate</button>

        {result && (
          <div style={{ marginTop: 18, textAlign: 'center', padding: '18px', background: 'var(--teal-light)', borderRadius: 10 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--teal)', fontFamily: 'JetBrains Mono' }}>{result.value}</div>
            <div style={{ fontSize: 12, color: 'var(--teal)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{result.unit}</div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div onClick={() => setShowHow(!showHow)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
          <h3>How to use</h3>
          {showHow ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
        {showHow && (
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <ul style={{ paddingLeft: 18, marginBottom: 12 }}>
              <li>Enter your Weight (kg) or Length (m) value</li>
              <li>Enter the GSM of the fabric</li>
              <li>Enter the fabric width (cm or inch)</li>
              <li>Select M, K, or Y as your output unit</li>
              <li>Tap Calculate to get the result</li>
            </ul>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 12, background: 'var(--bg)', padding: 12, borderRadius: 8 }}>
              <div><strong>M:</strong> (100000 \u00F7 2.54 \u00D7 value) \u00F7 (GSM \u00D7 width)</div>
              <div><strong>K:</strong> (2.54 \u00F7 100000 \u00D7 value \u00D7 GSM \u00D7 width)</div>
              <div><strong>Y:</strong> Same as M \u00D7 1.1</div>
            </div>
            <p style={{ marginTop: 10 }}>Width in cm is divided by 2.54 to get inches. Width in inches is used directly. (1 inch = 2.54 cm)</p>
          </div>
        )}
      </div>
    </div>
  );
}
