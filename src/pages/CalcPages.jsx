import { useState } from 'react';
import { calcEfficiency, calcCapacity, calcFabricYards, calcFabricGSM, calcThread, calcCosting, calcYarnCount, formatNum, efficiencyColor } from '../utils/calculations.js';
import { ResultCard, PageHeader, CalcGrid, FormulaNote } from '../components/ResultCard.jsx';
import { SMVSelector } from '../components/SMVSelector.jsx';
import { AIAnalysis } from '../components/AIAnalysis.jsx';
import { createReport } from '../lib/db.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { exportReportPDF } from '../utils/pdfExport.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Save, Download, Plus, Trash2, FileText } from 'lucide-react';
import { PremiumDownload } from '../components/PremiumDownload.jsx';
import { Crown } from 'lucide-react';

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

function exportAllLinesPDF({ lines, type, companyName, userName }) {
  import('jspdf').then(({ default: jsPDF }) => {
    import('jspdf-autotable').then(({ default: autoTable }) => {
      const doc = new jsPDF('landscape');
      const now = new Date().toLocaleDateString('en-PK');

      doc.setFillColor(15, 41, 66);
      doc.rect(0, 0, 297, 22, 'F');
      doc.setFillColor(13, 122, 107);
      doc.rect(0, 20, 297, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text('TextileIE — ' + (type === 'efficiency' ? 'All Lines Efficiency Report' : 'All Lines Capacity Report'), 14, 13);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.text(companyName || '', 200, 10);
      doc.text('Date: ' + now, 200, 16);

      if (type === 'efficiency') {
        const rows = lines.map((l, i) => {
          const eff = l.operators > 0 && l.smv > 0
            ? ((l.unitsProduced * l.smv) / (l.shiftMinutes * l.operators) * 100).toFixed(1)
            : 0;
          return [
            'Line ' + (l.lineNumber || (i + 1)),
            l.articleNumber || '—',
            l.smv + ' min',
            l.operators,
            l.unitsProduced,
            ((l.unitsProduced * l.smv)).toFixed(1) + ' min',
            (l.shiftMinutes * l.operators) + ' min',
            eff + '%'
          ];
        });

        autoTable(doc, {
          startY: 28,
          head: [['Line', 'Article#', 'SMV', 'Operators', 'Units Produced', 'Earned Min', 'Available Min', 'Efficiency']],
          body: rows,
          theme: 'striped',
          headStyles: { fillColor: [15, 41, 66], textColor: 255, fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          didParseCell: (data) => {
            if (data.column.index === 7 && data.section === 'body') {
              const val = parseFloat(data.cell.raw);
              if (val >= 75) data.cell.styles.textColor = [5, 150, 105];
              else if (val >= 55) data.cell.styles.textColor = [217, 119, 6];
              else data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = 'bold';
            }
          },
          margin: { left: 14, right: 14 }
        });

        const allEff = lines.map(l => l.operators > 0 && l.smv > 0 ? ((l.unitsProduced * l.smv) / (l.shiftMinutes * l.operators) * 100) : 0);
        const avgEff = allEff.reduce((a, b) => a + b, 0) / allEff.length;
        const finalY = doc.lastAutoTable.finalY + 8;
        doc.setFillColor(228, 244, 241);
        doc.rect(14, finalY, 269, 16, 'F');
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.setTextColor(13, 122, 107);
        doc.text('Total lines: ' + lines.length, 18, finalY + 10);
        doc.text('Average efficiency: ' + avgEff.toFixed(1) + '%', 80, finalY + 10);
        doc.text('Best: Line ' + (lines[allEff.indexOf(Math.max(...allEff))]?.lineNumber || '—') + ' (' + Math.max(...allEff).toFixed(1) + '%)', 180, finalY + 10);

      } else {
        const rows = lines.map((l, i) => {
          const daily = l.smv > 0 ? Math.floor((l.machines * l.shiftsPerDay * l.shiftMinutes * (l.efficiencyPct / 100)) / l.smv) : 0;
          return [
            'Line ' + (l.lineNumber || (i + 1)),
            l.articleNumber || '—',
            l.smv + ' min',
            l.machines,
            l.shiftsPerDay,
            l.efficiencyPct + '%',
            daily.toLocaleString() + ' pcs',
            (daily * 6).toLocaleString() + ' pcs',
            (daily * l.workingDaysPerMonth).toLocaleString() + ' pcs'
          ];
        });

        autoTable(doc, {
          startY: 28,
          head: [['Line', 'Article#', 'SMV', 'Machines', 'Shifts', 'Efficiency', 'Daily', 'Weekly', 'Monthly']],
          body: rows,
          theme: 'striped',
          headStyles: { fillColor: [15, 41, 66], textColor: 255, fontSize: 8 },
          bodyStyles: { fontSize: 8 },
          margin: { left: 14, right: 14 }
        });

        const totalDaily = lines.reduce((sum, l) => sum + (l.smv > 0 ? Math.floor((l.machines * l.shiftsPerDay * l.shiftMinutes * (l.efficiencyPct / 100)) / l.smv) : 0), 0);
        const totalMonthly = lines.reduce((sum, l) => sum + (l.smv > 0 ? Math.floor((l.machines * l.shiftsPerDay * l.shiftMinutes * (l.efficiencyPct / 100)) / l.smv) * l.workingDaysPerMonth : 0), 0);
        const finalY = doc.lastAutoTable.finalY + 8;
        doc.setFillColor(228, 244, 241);
        doc.rect(14, finalY, 269, 16, 'F');
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.setTextColor(13, 122, 107);
        doc.text('Total lines: ' + lines.length, 18, finalY + 10);
        doc.text('Total daily: ' + totalDaily.toLocaleString() + ' pcs', 80, finalY + 10);
        doc.text('Total monthly: ' + totalMonthly.toLocaleString() + ' pcs', 180, finalY + 10);
      }

      doc.setFontSize(7); doc.setTextColor(150);
      doc.text('TextileIE — ' + (companyName || '') + ' | Generated by ' + (userName || ''), 14, 200);
      doc.save('All-Lines-' + type + '-Report.pdf');
    });
  });
}

// ════════════════════════════════════════════════════════════
// EFFICIENCY
// ════════════════════════════════════════════════════════════
const newEffLine = (num) => ({
  id: Date.now() + num,
  lineNumber: num,
  articleNumber: '',
  shiftMinutes: 480,
  operators: 40,
  unitsProduced: 320,
  smv: 18
});

export function EfficiencyPage() {
  const [lines, setLines] = useState([newEffLine(1)]);
  const [activeIdx, setActiveIdx] = useState(0);
  const { toast, ToastContainer } = useToast();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showPremium, setShowPremium] = useState(false);

  const setLine = (id, k, v) => setLines(lines.map(l => l.id === id ? { ...l, [k]: v } : l));
  const addLine = () => { const n = newEffLine(lines.length + 1); setLines([...lines, n]); setActiveIdx(lines.length); };
  const removeLine = (id) => { if (lines.length === 1) return; const idx = lines.findIndex(l => l.id === id); setLines(lines.filter(l => l.id !== id)); setActiveIdx(Math.max(0, idx - 1)); };

  const active = lines[activeIdx] || lines[0];
  const r = calcEfficiency(active);

  const save = async () => {
    setSaving(true);
    try {
      await createReport({
        type: 'efficiency',
        title: 'Efficiency — Line ' + active.lineNumber + (active.articleNumber ? ' Art#' + active.articleNumber : '') + ' — ' + new Date().toLocaleDateString(),
        inputs: active, results: r
      });
      toast('Line ' + active.lineNumber + ' efficiency saved');
    } catch (err) { toast('Failed: ' + err.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <ToastContainer />
      <PageHeader title="Efficiency Calculator" subtitle="Calculate efficiency for each production line" badge={{ text: 'IE Formula' }} />

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {lines.map((l, i) => (
          <div key={l.id} style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => setActiveIdx(i)} style={{
              padding: '6px 14px', border: 'none', borderRadius: '6px 0 0 6px',
              background: activeIdx === i ? 'var(--navy)' : 'var(--bg)',
              color: activeIdx === i ? 'white' : 'var(--text-secondary)',
              fontWeight: activeIdx === i ? 600 : 400,
              cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
              borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)'
            }}>
              Line {l.lineNumber}
              {l.articleNumber && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>#{l.articleNumber}</span>}
            </button>
            {lines.length > 1 && (
              <button onClick={() => removeLine(l.id)} style={{
                padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '0 6px 6px 0', borderLeft: 'none',
                background: activeIdx === i ? 'var(--navy)' : 'var(--bg)',
                color: activeIdx === i ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)', cursor: 'pointer'
              }}>
                <Trash2 size={11} />
              </button>
            )}
          </div>
        ))}
        <button className="btn btn-secondary btn-sm" onClick={addLine}><Plus size={13} /> Add line</button>
        {lines.length > 1 && (
          <button className="btn btn-sm" onClick={() => exportAllLinesPDF({ lines, type: 'efficiency', companyName: profile?.company_name, userName: profile?.full_name })}
            style={{ background: 'var(--teal)', color: 'white', border: 'none', marginLeft: 'auto' }}>
            <FileText size={13} /> All lines PDF
          </button>
        )}
      </div>

      <CalcGrid>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 14px', background: 'var(--navy)', borderRadius: 8 }}>
            <div style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Line {active.lineNumber}</div>
            <input value={active.articleNumber || ''} onChange={e => setLine(active.id, 'articleNumber', e.target.value)}
              placeholder="Article# (e.g. 4233)"
              style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 6, padding: '5px 10px', fontSize: 13, fontFamily: 'JetBrains Mono', fontWeight: 600 }} />
          </div>
          <SMVSelector onSelect={t => setLine(active.id, 'smv', t.total_smv)} />
          <div className="field"><label>Shift duration (minutes)</label><input type="number" value={active.shiftMinutes} onChange={e => setLine(active.id, 'shiftMinutes', parseFloat(e.target.value) || 0)} /></div>
          <div className="field"><label>Number of operators</label><input type="number" value={active.operators} onChange={e => setLine(active.id, 'operators', parseFloat(e.target.value) || 0)} /></div>
          <div className="field"><label>Units produced</label><input type="number" value={active.unitsProduced} onChange={e => setLine(active.id, 'unitsProduced', parseFloat(e.target.value) || 0)} /></div>
          <div className="field"><label>SMV per unit (minutes)</label><input type="number" step="0.01" value={active.smv} onChange={e => setLine(active.id, 'smv', parseFloat(e.target.value) || 0)} /></div>
          <FormulaNote>Efficiency = (Earned min / Available min) x 100</FormulaNote>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ResultCard
            title={'Line ' + active.lineNumber + ' Results'}
            mainValue={<span style={{ color: efficiencyColor(r.efficiency) }}>{formatNum(r.efficiency, 1)}%</span>}
            mainLabel="Line efficiency"
            rows={[
              { label: 'Available minutes', value: formatNum(r.availableMinutes, 0) + ' min' },
              { label: 'Earned minutes', value: formatNum(r.earnedMinutes, 1) + ' min', highlight: true },
              { label: 'Lost minutes', value: formatNum(r.lostMinutes, 1) + ' min' },
              { label: 'Output per operator', value: formatNum(r.outputPerOperator, 1) + ' pcs' },
              { label: 'Target output (100%)', value: formatNum(r.targetOutput, 0) + ' pcs' },
            ]}
            onSave={save}
            saving={saving}
          />
          <AIAnalysis type="efficiency" data={active} results={r} lines={lines} />
          {showPremium && <PremiumDownload type="efficiency" data={active} onClose={() => setShowPremium(false)} />}
          <button onClick={() => setShowPremium(true)} style={{ width: '100%', padding: '10px', border: '2px solid #7C3AED', borderRadius: 8, background: 'white', color: '#7C3AED', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', marginTop: 8 }}>
            <Crown size={15} /> Download Premium Report — $5
          </button>

          {lines.length > 1 && (
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>All lines summary</h3>
              {lines.map((l, i) => {
                const lr = calcEfficiency(l);
                return (
                  <div key={l.id} onClick={() => setActiveIdx(i)} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 10px', marginBottom: 6, borderRadius: 8, cursor: 'pointer',
                    background: activeIdx === i ? 'var(--navy)' : 'var(--bg)',
                    color: activeIdx === i ? 'white' : 'var(--text-primary)'
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>Line {l.lineNumber}</span>
                      {l.articleNumber && <span style={{ fontSize: 11, marginLeft: 6, opacity: 0.7 }}>#{l.articleNumber}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, opacity: 0.7 }}>{l.operators} ops</span>
                      <span style={{ fontWeight: 700, fontSize: 14, fontFamily: 'JetBrains Mono', color: activeIdx === i ? 'white' : efficiencyColor(lr.efficiency) }}>
                        {lr.efficiency.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CalcGrid>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 14 }}>Benchmark</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[['< 55%', 'Below target', 'var(--red)', 'var(--red-light)'], ['55-75%', 'Acceptable', 'var(--amber)', 'var(--amber-light)'], ['> 75%', 'World class', 'var(--green)', 'var(--green-light)']].map(([range, lbl, c, bg]) => (
            <div key={lbl} style={{ padding: 14, background: bg, borderRadius: 9, textAlign: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: c, fontFamily: 'JetBrains Mono' }}>{range}</div>
              <div style={{ fontSize: 12, color: c, marginTop: 4 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CAPACITY
// ════════════════════════════════════════════════════════════
const newCapLine = (num) => ({
  id: Date.now() + num,
  lineNumber: num,
  articleNumber: '',
  machines: 50,
  shiftsPerDay: 2,
  shiftMinutes: 480,
  smv: 15,
  efficiencyPct: 75,
  workingDaysPerMonth: 26
});

export function CapacityPage() {
  const [lines, setLines] = useState([newCapLine(1)]);
  const [activeIdx, setActiveIdx] = useState(0);
  const { toast, ToastContainer } = useToast();
  const { profile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showPremium, setShowPremium] = useState(false);

  const setLine = (id, k, v) => setLines(lines.map(l => l.id === id ? { ...l, [k]: v } : l));
  const addLine = () => { const n = newCapLine(lines.length + 1); setLines([...lines, n]); setActiveIdx(lines.length); };
  const removeLine = (id) => { if (lines.length === 1) return; const idx = lines.findIndex(l => l.id === id); setLines(lines.filter(l => l.id !== id)); setActiveIdx(Math.max(0, idx - 1)); };

  const active = lines[activeIdx] || lines[0];
  const r = calcCapacity(active);
  const totalDaily = lines.reduce((sum, l) => sum + (l.smv > 0 ? Math.floor((l.machines * l.shiftsPerDay * l.shiftMinutes * (l.efficiencyPct / 100)) / l.smv) : 0), 0);
  const totalMonthly = lines.reduce((sum, l) => sum + (l.smv > 0 ? Math.floor((l.machines * l.shiftsPerDay * l.shiftMinutes * (l.efficiencyPct / 100)) / l.smv) * l.workingDaysPerMonth : 0), 0);

  const save = async () => {
    setSaving(true);
    try {
      await createReport({
        type: 'capacity',
        title: 'Capacity — Line ' + active.lineNumber + (active.articleNumber ? ' Art#' + active.articleNumber : '') + ' — ' + new Date().toLocaleDateString(),
        inputs: active, results: r
      });
      toast('Line ' + active.lineNumber + ' capacity saved');
    } catch (err) { toast('Failed: ' + err.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <ToastContainer />
      <PageHeader title="Capacity Planning" subtitle="Calculate capacity for each production line" badge={{ text: 'IE Formula' }} />

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {lines.map((l, i) => (
          <div key={l.id} style={{ display: 'flex', alignItems: 'center' }}>
            <button onClick={() => setActiveIdx(i)} style={{
              padding: '6px 14px', border: 'none', borderRadius: '6px 0 0 6px',
              background: activeIdx === i ? 'var(--navy)' : 'var(--bg)',
              color: activeIdx === i ? 'white' : 'var(--text-secondary)',
              fontWeight: activeIdx === i ? 600 : 400,
              cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
              borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderLeft: '1px solid var(--border)'
            }}>
              Line {l.lineNumber}
              {l.articleNumber && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>#{l.articleNumber}</span>}
            </button>
            {lines.length > 1 && (
              <button onClick={() => removeLine(l.id)} style={{
                padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '0 6px 6px 0', borderLeft: 'none',
                background: activeIdx === i ? 'var(--navy)' : 'var(--bg)',
                color: activeIdx === i ? 'rgba(255,255,255,0.5)' : 'var(--text-muted)', cursor: 'pointer'
              }}>
                <Trash2 size={11} />
              </button>
            )}
          </div>
        ))}
        <button className="btn btn-secondary btn-sm" onClick={addLine}><Plus size={13} /> Add line</button>
        {lines.length > 1 && (
          <button className="btn btn-sm" onClick={() => exportAllLinesPDF({ lines, type: 'capacity', companyName: profile?.company_name, userName: profile?.full_name })}
            style={{ background: 'var(--teal)', color: 'white', border: 'none', marginLeft: 'auto' }}>
            <FileText size={13} /> All lines PDF
          </button>
        )}
      </div>

      <CalcGrid>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 14px', background: 'var(--navy)', borderRadius: 8 }}>
            <div style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Line {active.lineNumber}</div>
            <input value={active.articleNumber || ''} onChange={e => setLine(active.id, 'articleNumber', e.target.value)}
              placeholder="Article# (e.g. 4233)"
              style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 6, padding: '5px 10px', fontSize: 13, fontFamily: 'JetBrains Mono', fontWeight: 600 }} />
          </div>
          <SMVSelector onSelect={t => setLine(active.id, 'smv', t.total_smv)} />
          <div className="field"><label>Machines / operators</label><input type="number" value={active.machines} onChange={e => setLine(active.id, 'machines', parseFloat(e.target.value) || 0)} /></div>
          <div className="field"><label>Shifts per day</label><input type="number" value={active.shiftsPerDay} onChange={e => setLine(active.id, 'shiftsPerDay', parseFloat(e.target.value) || 0)} /></div>
          <div className="field"><label>Shift duration (minutes)</label><input type="number" value={active.shiftMinutes} onChange={e => setLine(active.id, 'shiftMinutes', parseFloat(e.target.value) || 0)} /></div>
          <div className="field"><label>SMV per unit (minutes)</label><input type="number" step="0.01" value={active.smv} onChange={e => setLine(active.id, 'smv', parseFloat(e.target.value) || 0)} /></div>
          <div className="field"><label>Target efficiency (%)</label><input type="number" value={active.efficiencyPct} onChange={e => setLine(active.id, 'efficiencyPct', parseFloat(e.target.value) || 0)} /></div>
          <div className="field"><label>Working days per month</label><input type="number" value={active.workingDaysPerMonth} onChange={e => setLine(active.id, 'workingDaysPerMonth', parseFloat(e.target.value) || 0)} /></div>
          <FormulaNote>Capacity = (Machines x Shifts x Minutes x Eff%) / SMV</FormulaNote>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ResultCard
            title={'Line ' + active.lineNumber + ' Results'}
            mainValue={r.dailyCapacity.toLocaleString() + ' pcs'}
            mainLabel="Daily capacity"
            rows={[
              { label: 'Effective minutes', value: r.effectiveMinutes.toLocaleString() + ' min', highlight: true },
              { label: 'Daily capacity', value: r.dailyCapacity.toLocaleString() + ' pcs' },
              { label: 'Weekly capacity', value: r.weeklyCapacity.toLocaleString() + ' pcs' },
              { label: 'Monthly capacity', value: r.monthlyCapacity.toLocaleString() + ' pcs', highlight: true },
              { label: 'Minutes per piece', value: formatNum(r.minutesPerPiece) + ' min' },
            ]}
            onSave={save}
            saving={saving}
          />
          <AIAnalysis type="capacity" data={active} results={r} lines={lines} />
          {showPremium && <PremiumDownload type="capacity" data={active} onClose={() => setShowPremium(false)} />}
          <button onClick={() => setShowPremium(true)} style={{ width: '100%', padding: '10px', border: '2px solid #7C3AED', borderRadius: 8, background: 'white', color: '#7C3AED', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', marginTop: 8 }}>
            <Crown size={15} /> Download Premium Report — $5
          </button>

          {lines.length > 1 && (
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>All lines summary</h3>
              {lines.map((l, i) => {
                const lr = calcCapacity(l);
                return (
                  <div key={l.id} onClick={() => setActiveIdx(i)} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 10px', marginBottom: 6, borderRadius: 8, cursor: 'pointer',
                    background: activeIdx === i ? 'var(--navy)' : 'var(--bg)',
                    color: activeIdx === i ? 'white' : 'var(--text-primary)'
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>Line {l.lineNumber}</span>
                      {l.articleNumber && <span style={{ fontSize: 11, marginLeft: 6, opacity: 0.7 }}>#{l.articleNumber}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, opacity: 0.7 }}>{l.efficiencyPct}% eff</span>
                      <span style={{ fontWeight: 700, fontSize: 13, fontFamily: 'JetBrains Mono', color: activeIdx === i ? 'white' : 'var(--teal)' }}>
                        {lr.dailyCapacity.toLocaleString()} pcs
                      </span>
                    </div>
                  </div>
                );
              })}
              <div style={{ borderTop: '1px solid var(--border-light)', marginTop: 8, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>TOTAL ({lines.length} lines)</span>
                <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--teal)' }}>{totalDaily.toLocaleString()} pcs/day</span>
              </div>
            </div>
          )}
        </div>
      </CalcGrid>

      {lines.length > 1 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 16 }}>Factory total capacity</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[['Total daily', totalDaily.toLocaleString() + ' pcs', 'var(--teal)'], ['Total weekly', (totalDaily * 6).toLocaleString() + ' pcs', 'var(--blue)'], ['Total monthly', totalMonthly.toLocaleString() + ' pcs', 'var(--green)']].map(([l, v, c]) => (
              <div key={l} style={{ padding: 16, background: 'var(--bg)', borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: c, fontFamily: 'JetBrains Mono' }}>{v}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 16 }}>Line {active.lineNumber} — capacity by period</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={[{ p: 'Daily', v: r.dailyCapacity }, { p: 'Weekly', v: r.weeklyCapacity }, { p: 'Monthly', v: r.monthlyCapacity }]}>
            <XAxis dataKey="p" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v.toLocaleString()} />
            <Tooltip formatter={v => [v.toLocaleString() + ' pcs', 'Capacity']} />
            <Bar dataKey="v" fill="var(--teal)" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
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
// THREAD — FULL OPERATION WISE LIKE COATS FORMAT
// ════════════════════════════════════════════════════════════
const STITCH_OPTIONS = [
  { code: '301', name: 'Lock Stitch',           ratio: 2.5  },
  { code: '101', name: 'Chain Stitch (1T)',      ratio: 4.0  },
  { code: '401', name: 'Chain Stitch (2T)',      ratio: 5.5  },
  { code: '503', name: 'Overlock 2T',            ratio: 12.0 },
  { code: '504', name: 'Overlock 3T',            ratio: 14.0 },
  { code: '512', name: 'Safety Stitch 4T',       ratio: 18.0 },
  { code: '516', name: 'Safety Stitch 5T',       ratio: 20.0 },
  { code: '304', name: 'Zigzag Lockstitch',      ratio: 7.0  },
  { code: '406', name: 'Coverstitch 3T',         ratio: 18.0 },
  { code: '602', name: 'Coverstitch 4T',         ratio: 25.0 },
  { code: '605', name: 'Flatseam 5T',            ratio: 28.0 },
];

const DEFAULT_OPS = [
  { id: 1, operationName: 'Shoulder join',     seamLength: 28,  stitchCode: '504' },
  { id: 2, operationName: 'Neck rib overlock', seamLength: 60,  stitchCode: '504' },
  { id: 3, operationName: 'Neck T/S',          seamLength: 60,  stitchCode: '401' },
  { id: 4, operationName: 'Sleeve attach',     seamLength: 48,  stitchCode: '504' },
  { id: 5, operationName: 'Sleeve T/S',        seamLength: 48,  stitchCode: '301' },
  { id: 6, operationName: 'Side seam',         seamLength: 128, stitchCode: '504' },
  { id: 7, operationName: 'Sleeve hem',        seamLength: 76,  stitchCode: '406' },
  { id: 8, operationName: 'Bottom hem',        seamLength: 102, stitchCode: '406' },
];

function getRatio(code) {
  const found = STITCH_OPTIONS.find(s => s.code === code);
  return found ? found.ratio : 2.5;
}

function getStitchName(code) {
  const found = STITCH_OPTIONS.find(s => s.code === code);
  return found ? found.code + ' ' + found.name : code;
}

function calcOp(op, wastePct) {
  const ratio = getRatio(op.stitchCode);
  const consumption = (op.seamLength || 0) * ratio;
  const estimated   = consumption * (1 + (wastePct || 0) / 100);
  return {
    ratio,
    consumption: +consumption.toFixed(1),
    estimated:   +estimated.toFixed(1),
  };
}

export default function ThreadPage() {
  const [style,     setStyle]     = useState('T-Shirt');
  const [buyer,     setBuyer]     = useState('');
  const [articleNo, setArticleNo] = useState('');
  const [wastePct,  setWastePct]  = useState(10);
  const [ops,       setOps]       = useState(DEFAULT_OPS);
  const [saving,    setSaving]    = useState(false);

  const { profile } = useAuth();
  const { toast, ToastContainer } = useToast();

  // ── helpers ────────────────────────────────────────────
  const setOp = (id, key, val) =>
    setOps(prev => prev.map(o => o.id === id ? { ...o, [key]: val } : o));

  const addOp = () =>
    setOps(prev => [
      ...prev,
      { id: Date.now(), operationName: '', seamLength: 30, stitchCode: '504' },
    ]);

  const removeOp = (id) =>
    setOps(prev => prev.filter(o => o.id !== id));

  // ── totals ─────────────────────────────────────────────
  const totalConsumption = ops.reduce((s, op) => s + calcOp(op, wastePct).consumption, 0);
  const totalEstimated   = ops.reduce((s, op) => s + calcOp(op, wastePct).estimated,   0);
  const totalMeters      = +(totalEstimated / 100).toFixed(3);

  // ── save ───────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await createReport({
        type:    'thread',
        title:   'Thread Consumption — ' + (articleNo ? 'Art#' + articleNo + ' ' : '') + style + ' — ' + new Date().toLocaleDateString(),
        inputs:  { style, buyer, articleNo, wastePct, totalOperations: ops.length },
        results: {
          totalConsumptionCm: totalConsumption.toFixed(1),
          totalEstimatedCm:   totalEstimated.toFixed(1),
          totalMeters,
          wastePct,
        },
      });
      toast('Thread report saved');
    } catch (err) {
      toast('Failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── PDF export ─────────────────────────────────────────
  const handleExportPDF = async () => {
    try {
      const { default: jsPDF }     = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF('landscape');
      const now = new Date().toLocaleDateString('en-PK');

      // Header bar
      doc.setFillColor(15, 41, 66);
      doc.rect(0, 0, 297, 22, 'F');
      doc.setFillColor(13, 122, 107);
      doc.rect(0, 20, 297, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Thread Consumption Calculation Template', 14, 13);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text((profile?.company_name || '') + '  |  ' + now, 220, 13);

      // Info row
      doc.setFillColor(228, 244, 241);
      doc.rect(14, 27, 269, 12, 'F');
      doc.setTextColor(15, 41, 66);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Style: ' + style,                  18,  35);
      doc.text('Buyer: ' + (buyer || '—'),          80,  35);
      doc.text('Article#: ' + (articleNo || '—'),  140,  35);
      doc.text('Wastage: ' + wastePct + '%',        195,  35);
      doc.setTextColor(13, 122, 107);
      doc.setFontSize(11);
      doc.text('Total: ' + totalMeters + ' m',      245,  35);

      // Table
      autoTable(doc, {
        startY: 44,
        head: [['Seq', 'Operation Name', 'Seam Length (cm)', 'Stitch Type', 'Ratio', 'Consumption (cm)', 'Est. Thread (cm)']],
        body: ops.map((op, i) => {
          const c = calcOp(op, wastePct);
          return [
            i + 1,
            op.operationName || 'Operation ' + (i + 1),
            op.seamLength,
            getStitchName(op.stitchCode),
            c.ratio,
            c.consumption,
            c.estimated,
          ];
        }),
        foot: [['', 'TOTAL THREAD CONSUMPTION', '', '', '', totalConsumption.toFixed(1), totalEstimated.toFixed(1)]],
        theme: 'striped',
        headStyles: { fillColor: [15, 41, 66], textColor: 255, fontSize: 8, fontStyle: 'bold' },
        footStyles: { fillColor: [255, 193, 7],  textColor: [0, 0, 0], fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 12,  halign: 'center' },
          1: { cellWidth: 68 },
          2: { cellWidth: 28,  halign: 'right' },
          3: { cellWidth: 52 },
          4: { cellWidth: 14,  halign: 'center' },
          5: { cellWidth: 30,  halign: 'right' },
          6: { cellWidth: 35,  halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: 14, right: 14 },
      });

      // Summary highlight
      const finalY = doc.lastAutoTable.finalY + 6;
      doc.setFillColor(13, 122, 107);
      doc.rect(14, finalY, 269, 14, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(
        'Total thread consumption (with ' + wastePct + '% wastage): ' + totalEstimated.toFixed(1) + ' cm   =   ' + totalMeters + ' meters',
        18, finalY + 9,
      );

      // Footer
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(
        'TextileIE — ' + (profile?.company_name || '') + '  |  Thread Consumption Report  |  Generated: ' + now,
        14, 200,
      );

      doc.save('Thread-' + (articleNo || style) + '-' + Date.now() + '.pdf');
      toast('PDF downloaded');
    } catch (err) {
      console.error('PDF error:', err);
      toast('PDF failed: ' + err.message, 'error');
    }
  };

  // ── Excel export ───────────────────────────────────────
  const handleExportExcel = () => {
    try {
      const rows = ops.map((op, i) => {
        const c = calcOp(op, wastePct);
        const even = i % 2 === 0;
        return `<tr style="background:${even ? '#F4F7FA' : '#FFFFFF'}">
          <td style="text-align:center;border:1px solid #D8E4EE;padding:5px 8px">${i + 1}</td>
          <td style="border:1px solid #D8E4EE;padding:5px 8px">${op.operationName || 'Operation ' + (i + 1)}</td>
          <td style="text-align:right;border:1px solid #D8E4EE;padding:5px 8px">${op.seamLength}</td>
          <td style="border:1px solid #D8E4EE;padding:5px 8px">${getStitchName(op.stitchCode)}</td>
          <td style="text-align:center;border:1px solid #D8E4EE;padding:5px 8px">${c.ratio}</td>
          <td style="text-align:right;border:1px solid #D8E4EE;padding:5px 8px">${c.consumption}</td>
          <td style="text-align:right;font-weight:bold;color:#0D7A6B;border:1px solid #D8E4EE;padding:5px 8px">${c.estimated}</td>
        </tr>`;
      }).join('');

      const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"></head>
<body>
<table>
  <tr><td colspan="7" style="background:#0F2942;color:white;font-weight:bold;font-size:14pt;padding:8px;border:1px solid #0F2942">Thread Consumption Calculation Template — TextileIE</td></tr>
  <tr>
    <td colspan="2" style="background:#E4F4F1;color:#0F2942;font-weight:bold;padding:6px;border:1px solid #D8E4EE">Style: ${style}</td>
    <td colspan="2" style="background:#E4F4F1;color:#0F2942;font-weight:bold;padding:6px;border:1px solid #D8E4EE">Buyer: ${buyer || '—'}</td>
    <td style="background:#E4F4F1;color:#0F2942;font-weight:bold;padding:6px;border:1px solid #D8E4EE">Article#: ${articleNo || '—'}</td>
    <td style="background:#E4F4F1;color:#0F2942;font-weight:bold;padding:6px;border:1px solid #D8E4EE">Wastage: ${wastePct}%</td>
    <td style="background:#E4F4F1;color:#0D7A6B;font-weight:bold;font-size:12pt;padding:6px;border:1px solid #D8E4EE">Total: ${totalMeters} m</td>
  </tr>
  <tr>
    <th style="background:#0F2942;color:white;font-weight:bold;padding:5px 8px;border:1px solid #0F2942">Seq No.</th>
    <th style="background:#0F2942;color:white;font-weight:bold;padding:5px 8px;border:1px solid #0F2942">Operations name</th>
    <th style="background:#0F2942;color:white;font-weight:bold;padding:5px 8px;border:1px solid #0F2942">Seam length (cm)</th>
    <th style="background:#0F2942;color:white;font-weight:bold;padding:5px 8px;border:1px solid #0F2942">Stitch type</th>
    <th style="background:#0F2942;color:white;font-weight:bold;padding:5px 8px;border:1px solid #0F2942">Ratio</th>
    <th style="background:#0F2942;color:white;font-weight:bold;padding:5px 8px;border:1px solid #0F2942">Consumption (cm)</th>
    <th style="background:#0F2942;color:white;font-weight:bold;padding:5px 8px;border:1px solid #0F2942">Estimated thread consumption (cm)</th>
  </tr>
  ${rows}
  <tr>
    <td colspan="5" style="background:#FFC107;color:#0F2942;font-weight:bold;text-align:right;padding:6px 8px;border:1px solid #D8E4EE">Total Thread consumption (in cm)</td>
    <td style="background:#FFC107;color:#0F2942;font-weight:bold;text-align:right;padding:6px 8px;border:1px solid #D8E4EE">${totalConsumption.toFixed(1)}</td>
    <td style="background:#FFC107;color:#0F2942;font-weight:bold;text-align:right;font-size:12pt;padding:6px 8px;border:1px solid #D8E4EE">${totalEstimated.toFixed(1)}</td>
  </tr>
  <tr>
    <td colspan="7" style="background:#0D7A6B;color:white;font-weight:bold;text-align:center;padding:8px;border:1px solid #0D7A6B;font-size:11pt">
      Total in meters (with ${wastePct}% wastage): ${totalMeters} meters
    </td>
  </tr>
  <tr><td colspan="7" style="color:#666;font-size:9pt;padding:6px;border:1px solid #D8E4EE">Generated: ${new Date().toLocaleString('en-PK')} | TextileIE © ${new Date().getFullYear()}</td></tr>
</table>
</body></html>`;

      const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'Thread-' + (articleNo || style) + '-' + Date.now() + '.xls';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast('Excel downloaded');
    } catch (err) {
      toast('Excel failed: ' + err.message, 'error');
    }
  };

  // ── render ─────────────────────────────────────────────
  return (
    <div>
      <ToastContainer />
      <PageHeader
        title="Thread Consumption"
        subtitle="Operation-wise thread calculation — Coats standard format"
        badge={{ text: 'IE Formula' }}
      />

      {/* ── Style / buyer / article header ── */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 16px', background: 'var(--navy)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Style</label>
            <input
              value={style}
              onChange={e => setStyle(e.target.value)}
              placeholder="T-Shirt"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 6, padding: '7px 10px', width: '100%', fontSize: 14, fontWeight: 600 }}
            />
          </div>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Buyer</label>
            <input
              value={buyer}
              onChange={e => setBuyer(e.target.value)}
              placeholder="XYZ"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 6, padding: '7px 10px', width: '100%', fontSize: 14 }}
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Article #</label>
            <input
              value={articleNo}
              onChange={e => setArticleNo(e.target.value)}
              placeholder="4233"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 6, padding: '7px 10px', width: '100%', fontSize: 15, fontFamily: 'JetBrains Mono', fontWeight: 700 }}
            />
          </div>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Wastage %</label>
            <input
              type="number"
              value={wastePct}
              onChange={e => setWastePct(parseFloat(e.target.value) || 0)}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 6, padding: '7px 10px', width: '100%', fontSize: 15, fontFamily: 'JetBrains Mono' }}
            />
          </div>
        </div>
      </div>

      {/* ── Total summary bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--teal)', borderRadius: 10, marginBottom: 16, color: 'white' }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>TOTAL THREAD CONSUMPTION</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Net: {totalConsumption.toFixed(1)} cm &nbsp;|&nbsp; Est: {totalEstimated.toFixed(1)} cm</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'JetBrains Mono', lineHeight: 1 }}>{totalMeters}</div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>meters</div>
        </div>
      </div>

      {/* ── Operations cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {ops.map((op, idx) => {
          const c = calcOp(op, wastePct);
          return (
            <div key={op.id} className="card" style={{ padding: '14px 16px' }}>

              {/* Card header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 28, height: 28, background: 'var(--navy)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Operation {idx + 1}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--teal)', lineHeight: 1 }}>{c.estimated}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>est. cm</div>
                  </div>
                  <button
                    onClick={() => removeOp(op.id)}
                    style={{ background: 'var(--red-light)', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: '6px 10px', borderRadius: 8 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Operation name */}
              <div className="field" style={{ marginBottom: 10 }}>
                <label>Operation name</label>
                <input
                  value={op.operationName}
                  onChange={e => setOp(op.id, 'operationName', e.target.value)}
                  placeholder="e.g. Shoulder join, Side seam, Bottom hem..."
                />
              </div>

              {/* Stitch type */}
              <div className="field" style={{ marginBottom: 10 }}>
                <label>Stitch type</label>
                <select value={op.stitchCode} onChange={e => setOp(op.id, 'stitchCode', e.target.value)}>
                  {STITCH_OPTIONS.map(s => (
                    <option key={s.code} value={s.code}>{s.code} — {s.name} (ratio {s.ratio}x)</option>
                  ))}
                </select>
              </div>

              {/* Seam + Ratio + Consumption */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Seam length (cm)</label>
                  <input
                    type="number"
                    value={op.seamLength}
                    onChange={e => setOp(op.id, 'seamLength', parseFloat(e.target.value) || 0)}
                    style={{ textAlign: 'center' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Ratio</label>
                  <div style={{ padding: '7px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, fontFamily: 'JetBrains Mono', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {c.ratio}x
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Net (cm)</label>
                  <div style={{ padding: '7px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, fontFamily: 'JetBrains Mono', textAlign: 'center', color: 'var(--text-primary)' }}>
                    {c.consumption}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Add operation button ── */}
      <button className="btn btn-secondary btn-full" onClick={addOp} style={{ marginBottom: 16 }}>
        <Plus size={14} /> Add operation
      </button>

      {/* ── Total yellow row ── */}
      <div style={{ padding: '14px 16px', background: '#FFF9C4', border: '2px solid #F9A825', borderRadius: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>TOTAL THREAD CONSUMPTION (in cm)</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Net: {totalConsumption.toFixed(1)}</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--navy)' }}>{totalEstimated.toFixed(1)} cm</div>
          </div>
          </div>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        <button className="btn btn-primary btn-full" onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? 'Saving...' : 'Save report'}
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button className="btn btn-secondary btn-full" onClick={handleExportPDF}>
            <Download size={14} /> Download PDF
          </button>
          <button
            className="btn btn-full"
            onClick={handleExportExcel}
            style={{ background: '#217346', color: 'white', border: 'none' }}
          >
            <FileText size={14} /> Download Excel
          </button>
        </div>
      </div>

      {/* ── Stitch reference table ── */}
      <div className="card">
        <h3 style={{ marginBottom: 14 }}>Stitch type reference — Coats standard</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['301', 'Lock Stitch',         '2.5x',  'Shirt seams, pocket, label'],
            ['401', 'Chain Stitch 2T',     '5.5x',  'Denim seams, heavy fabric'],
            ['504', 'Overlock 3T',         '14.0x', 'Edge finishing, knitwear'],
            ['503', 'Overlock 2T',         '12.0x', 'Edge finishing'],
            ['512', 'Safety Stitch 4T',    '18.0x', 'Trouser inseam, heavy seams'],
            ['516', 'Safety Stitch 5T',    '20.0x', 'Sportswear, heavy duty'],
            ['406', 'Coverstitch 3T',      '18.0x', 'Hem, sleeve hem, T-shirt hem'],
            ['605', 'Flatseam 5T',         '28.0x', 'Sportswear, seamless joins'],
          ].map(([code, name, ratio, use]) => (
            <div key={code} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 50px 1fr', gap: 8, alignItems: 'center', padding: '8px 12px', background: 'var(--bg)', borderRadius: 8 }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, background: 'var(--navy)', color: 'white', padding: '3px 8px', borderRadius: 4, fontSize: 12, textAlign: 'center' }}>{code}</span>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{name}</span>
              <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--teal)', fontWeight: 700, fontSize: 13, textAlign: 'center' }}>{ratio}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{use}</span>
            </div>
          ))}
        </div>
      </div>
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
