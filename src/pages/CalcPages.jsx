import { useState } from 'react';
import { calcFabricYards, calcFabricGSM, calcCosting, calcYarnCount, formatNum } from '../utils/calculations.js';
import { ResultCard, PageHeader, CalcGrid, FormulaNote } from '../components/ResultCard.jsx';
import { createReport } from '../lib/db.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { exportReportPDF } from '../utils/pdfExport.js';
import { Save, Download } from 'lucide-react';

function useSave(type, titleFn, inputs, results) {
  const [saving, setSaving] = useState(false);
  const { toast, ToastContainer } = useToast();
  const { profile } = useAuth();

  const save = async () => {
    setSaving(true);
    try {
      await createReport({ type, title: titleFn(), inputs, results });
      toast(type.charAt(0).toUpperCase() + type.slice(1) + ' report saved');
    } catch (err) {
      toast('Failed to save: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  const doExport = (title) => exportReportPDF({
    type, title, inputs, results,
    companyName: profile?.company_name,
    userName: profile?.full_name
  });

  return { save, doExport, saving, ToastContainer, profile };
}

// ════════════════════════════════════════════════════════════
// FABRIC
// ════════════════════════════════════════════════════════════
export function FabricPage() {
  const [tab, setTab] = useState('yards');
  const [yds, setYds] = useState({ widthInches: 58, garmentLengthCm: 70, wastePct: 12, orderQty: 1000, pricePerYard: 2.5 });
  const [gsm, setGsm] = useState({ lengthCm: 70, widthCm: 120, gsm: 180, patternPieces: 4, wastePct: 10, orderQty: 1000 });
  const ry = calcFabricYards(yds);
  const rg = calcFabricGSM(gsm);
  const setY = k => e => setYds(p => ({ ...p, [k]: parseFloat(e.target.value) || 0 }));
  const setG = k => e => setGsm(p => ({ ...p, [k]: parseFloat(e.target.value) || 0 }));
  const { save: saveY, doExport: expY, saving: savingY, ToastContainer } = useSave('fabric', () => 'Fabric (Yds) — ' + new Date().toLocaleDateString(), yds, ry);
  const { save: saveG, doExport: expG, saving: savingG } = useSave('fabric', () => 'Fabric (GSM) — ' + new Date().toLocaleDateString(), gsm, rg);

  return (
    <div>
      <ToastContainer />
      <PageHeader title="Fabric Consumption" subtitle="Calculate fabric usage, wastage and total cost" badge={{ text: 'IE Formula' }} />
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-light)' }}>
        {[['yards', 'Yards method'], ['gsm', 'GSM / Weight method']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
            color: tab === t ? 'var(--teal)' : 'var(--text-muted)',
            borderBottom: tab === t ? '2px solid var(--teal)' : '2px solid transparent', marginBottom: -1
          }}>{l}</button>
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
// COSTING
// ════════════════════════════════════════════════════════════
export function CostingPage() {
  const [inp, setInp] = useState({ fabricCostPerUnit: 3.5, cmt: 1.2, overhead: 0.4, profit: 20, agentCommPct: 5, bankChargePct: 1, freightPerUnit: 0.3, dutyPct: 0 });
  const set = k => e => setInp(p => ({ ...p, [k]: parseFloat(e.target.value) || 0 }));
  const r = calcCosting(inp);
  const { save, doExport, saving, ToastContainer } = useSave('costing', () => 'Costing — ' + new Date().toLocaleDateString(), inp, r);

  const bars = [
    { label: 'Fabric', v: inp.fabricCostPerUnit, color: 'var(--teal)' },
    { label: 'CMT', v: inp.cmt, color: 'var(--blue)' },
    { label: 'Overhead', v: inp.overhead, color: 'var(--amber)' },
    { label: 'Freight', v: inp.freightPerUnit, color: 'var(--purple)' },
    { label: 'Profit', v: r.profitAmount, color: 'var(--green)' },
  ];

  return (
    <div>
      <ToastContainer />
      <PageHeader title="Costing Sheet" subtitle="Build FOB price and analyse profit margin" badge={{ text: 'IE Formula' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Cost components</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[['fabricCostPerUnit', 'Fabric / unit ($)'], ['cmt', 'CMT / unit ($)'], ['overhead', 'Overhead / unit ($)'], ['freightPerUnit', 'Freight / unit ($)'], ['agentCommPct', 'Agent comm (%)'], ['bankChargePct', 'Bank charge (%)'], ['dutyPct', 'Duty (%)'], ['profit', 'Profit margin (%)']].map(([k, l]) => (
              <div className="field" key={k}><label>{l}</label><input type="number" step="0.01" value={inp[k]} onChange={set(k)} /></div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>FOB Price</h3>
            <div style={{ textAlign: 'center', padding: '14px 0 18px', borderBottom: '1px solid var(--border-light)', marginBottom: 16 }}>
              <div style={{ fontSize: 38, fontWeight: 600, color: 'var(--teal)', fontFamily: 'JetBrains Mono' }}>${formatNum(r.fobPrice)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>FOB price per unit</div>
            </div>
            {[['Total production cost', '$' + formatNum(r.totalProductionCost)], ['Agent commission', '$' + formatNum(r.agentCommission)], ['Bank charge', '$' + formatNum(r.bankCharge)], ['Duty', '$' + formatNum(r.duty)], ['Profit (' + inp.profit + '%)', '$' + formatNum(r.profitAmount)]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 500 }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}><Save size={14} />{saving ? 'Saving...' : 'Save report'}</button>
              <button className="btn btn-secondary" onClick={() => doExport('FOB Costing Sheet')}><Download size={14} /></button>
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>Cost breakdown</h3>
            {bars.map(b => (
              <div key={b.label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{b.label}</span>
                  <span style={{ color: b.color, fontFamily: 'JetBrains Mono' }}>{r.fobPrice > 0 ? ((b.v / r.fobPrice) * 100).toFixed(1) : 0}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: r.fobPrice > 0 ? ((b.v / r.fobPrice) * 100) + '%' : '0%', background: b.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// YARN COUNT
// ════════════════════════════════════════════════════════════
export function YarnPage() {
  const [inp, setInp] = useState({ weightGrams: 10, lengthMeters: 1270, system: 'ne' });
  const set = k => e => setInp(p => ({ ...p, [k]: e.target.value }));
  const r = calcYarnCount(inp);
  const { save, saving, ToastContainer } = useSave('yarn', () => 'Yarn Count — ' + new Date().toLocaleDateString(), inp, r);

  return (
    <div>
      <ToastContainer />
      <PageHeader title="Yarn Count Calculator" subtitle="Convert between Ne, Tex and Nm yarn count systems" badge={{ text: 'IE Formula' }} />
      <CalcGrid>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Inputs</h3>
          <div className="field"><label>Weight of sample (grams)</label><input type="number" step="0.01" value={inp.weightGrams} onChange={set('weightGrams')} /></div>
          <div className="field"><label>Length of sample (meters)</label><input type="number" value={inp.lengthMeters} onChange={set('lengthMeters')} /></div>
          <div className="field"><label>Primary system</label>
            <select value={inp.system} onChange={set('system')}>
              <option value="ne">Ne - English Cotton Count</option>
              <option value="tex">Tex - Tex system</option>
              <option value="nm">Nm - Metric count</option>
            </select>
          </div>
          <FormulaNote>Ne = (Length yds / 840) / (Weight lbs) | Tex = (g/m) x 1000 | Nm = m/g</FormulaNote>
        </div>
        <ResultCard title="Yarn Count Results" mainValue={formatNum(r.primaryValue, 1)} mainLabel={inp.system.toUpperCase() + ' count'}
          rows={[
            { label: 'Ne (English count)', value: formatNum(r.ne, 2), highlight: inp.system === 'ne' },
            { label: 'Tex', value: formatNum(r.tex, 2), highlight: inp.system === 'tex' },
            { label: 'Nm (Metric count)', value: formatNum(r.nm, 2), highlight: inp.system === 'nm' },
          ]}
          onSave={save} saving={saving}
        />
      </CalcGrid>
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 14 }}>Common yarn counts reference</h3>
        <table className="data-table">
          <thead><tr><th>Yarn type</th><th>Ne</th><th>Tex</th><th>Nm</th><th>Use</th></tr></thead>
          <tbody>
            {[['Coarse', '6-10', '60-100', '10-17', 'Canvas, denim'], ['Medium', '16-30', '20-37', '27-50', 'Shirts, knitwear'], ['Fine', '40-60', '10-15', '67-100', 'Voile, poplin'], ['Very fine', '80-120', '5-7', '135-200', 'Lawn, batiste']].map(([t, ne, tex, nm, use]) => (
              <tr key={t}><td>{t}</td><td style={{ fontFamily: 'JetBrains Mono', color: 'var(--teal)' }}>{ne}</td><td style={{ fontFamily: 'JetBrains Mono' }}>{tex}</td><td style={{ fontFamily: 'JetBrains Mono' }}>{nm}</td><td style={{ color: 'var(--text-muted)' }}>{use}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
