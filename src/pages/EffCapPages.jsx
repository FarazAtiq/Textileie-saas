import { useState } from 'react';
import { calcEfficiency, calcCapacity, formatNum, efficiencyColor } from '../utils/calculations.js';
import { ResultCard, PageHeader, CalcGrid, FormulaNote } from '../components/ResultCard.jsx';
import { ArticleSelector } from '../components/ArticleSelector.jsx';
import { AIAnalysis } from '../components/AIAnalysis.jsx';
import { createReport, getStyleCostSummary } from '../lib/db.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, FileText, Save, Download } from 'lucide-react';

// ── Department config ─────────────────────────────────────────
const DEPARTMENTS = [
  { value: 'cutting',        label: 'Cutting',        color: '#FCE4EC', dot: '#C62828' },
  { value: 'sewing',         label: 'Sewing',         color: '#E3F2FD', dot: '#0D47A1' },
  { value: 'embellishment',  label: 'Embellishment',  color: '#E8F5E9', dot: '#1B5E20' },
  { value: 'finishing',      label: 'Finishing',      color: '#FFF3E0', dot: '#E65100' },
  { value: 'qc',             label: 'QC',             color: '#FFF8E1', dot: '#F57F17' },
];
const DEPT_LABEL = Object.fromEntries(DEPARTMENTS.map(d => [d.value, d.label]));
const DEPT_BG    = Object.fromEntries(DEPARTMENTS.map(d => [d.value, d.color]));
const DEPT_DOT   = Object.fromEntries(DEPARTMENTS.map(d => [d.value, d.dot]));
function getDepartmentSMV(template, department) {
  const breakdown = template?.department_breakdown || {};

  if (department === 'combined') {
    return Number(template?.total_smv || breakdown?.combined?.smv || 0);
  }

  return Number(breakdown?.[department]?.smv || 0);
}

function makeStyleSMVTemplate(style, smvModule) {
  if (!style || !smvModule?.summary) return null;

  return {
    id: smvModule.id || style.id,
    article_number: style.article_number,
    name: style.style_name || style.garment_type || 'Style',
    garment_type: style.garment_type || '',
    total_smv: smvModule.summary.total_smv || 0,
    department_breakdown: smvModule.summary.department_breakdown || {}
  };
}
function makeDeptTotals(lines, type) {
  return DEPARTMENTS.map(d => {
    const deptLines = lines.filter(l => (l.department || 'sewing') === d.value);
    if (!deptLines.length) return null;
    if (type === 'efficiency') {
      const effs = deptLines.map(l => calcEfficiency(l).efficiency);
      return { ...d, count: deptLines.length, value: effs.reduce((a,b)=>a+b,0) / effs.length, suffix: '% avg eff' };
    }
    return { ...d, count: deptLines.length, value: deptLines.reduce((sum,l)=>sum + calcCapacity(l).dailyCapacity, 0), suffix: ' pcs/day' };
  }).filter(Boolean);
}


// ── Helpers ───────────────────────────────────────────────────
function exportAllLinesPDF({ lines, type, companyName, userName, calcFn, articleSMV }) {
  import('jspdf').then(({ default: jsPDF }) => {
    import('jspdf-autotable').then(({ default: autoTable }) => {
      const doc = new jsPDF('landscape');
      const now = new Date().toLocaleDateString('en-PK');

      doc.setFillColor(15, 41, 66);
      doc.rect(0, 0, 297, 22, 'F');
      doc.setFillColor(13, 122, 107);
      doc.rect(0, 20, 297, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13); doc.setFont('helvetica', 'bold');
      doc.text('TextileIE — All Lines ' + (type === 'efficiency' ? 'Efficiency' : 'Capacity') + ' Report', 14, 13);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.text((companyName || '') + '  |  ' + now, 220, 13);

      // Group lines by department
      const depts = [...new Set(lines.map(l => l.department || 'sewing'))];

      let startY = 28;
      depts.forEach(dept => {
        const deptLines = lines.filter(l => (l.department || 'sewing') === dept);
        if (!deptLines.length) return;

        // Department header
        doc.setFillColor(15, 41, 66);
        doc.rect(14, startY, 269, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text(DEPT_LABEL[dept] || dept + ' Department', 18, startY + 7);
        startY += 14;

        if (type === 'efficiency') {
          const rows = deptLines.map((l, i) => {
            const r = calcEfficiency(l);
            return [
              'Line ' + (l.lineNumber || i + 1),
              l.articleNumber || '—',
              DEPT_LABEL[l.department] || '—',
              l.smv + ' min',
              l.operators,
              l.unitsProduced,
              r.earnedMinutes.toFixed(1) + ' min',
              r.availableMinutes + ' min',
              r.efficiency.toFixed(1) + '%'
            ];
          });
          autoTable(doc, {
            startY,
            head: [['Line', 'Article#', 'Dept', 'SMV', 'Operators', 'Units', 'Earned Min', 'Available Min', 'Efficiency']],
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [30, 60, 100], textColor: 255, fontSize: 7 },
            bodyStyles: { fontSize: 7 },
            didParseCell: (data) => {
              if (data.column.index === 8 && data.section === 'body') {
                const val = parseFloat(data.cell.raw);
                data.cell.styles.textColor = val >= 75 ? [5, 150, 105] : val >= 55 ? [217, 119, 6] : [220, 38, 38];
                data.cell.styles.fontStyle = 'bold';
              }
            },
            margin: { left: 14, right: 14 }
          });
        } else {
          const rows = deptLines.map((l, i) => {
            const r = calcCapacity(l);
            return [
              'Line ' + (l.lineNumber || i + 1),
              l.articleNumber || '—',
              DEPT_LABEL[l.department] || '—',
              l.smv + ' min',
              l.machines,
              l.shiftsPerDay,
              l.efficiencyPct + '%',
              r.dailyCapacity.toLocaleString() + ' pcs',
              r.weeklyCapacity.toLocaleString() + ' pcs',
              r.monthlyCapacity.toLocaleString() + ' pcs'
            ];
          });
          autoTable(doc, {
            startY,
            head: [['Line', 'Article#', 'Dept', 'SMV', 'Machines', 'Shifts', 'Eff%', 'Daily', 'Weekly', 'Monthly']],
            body: rows,
            theme: 'striped',
            headStyles: { fillColor: [30, 60, 100], textColor: 255, fontSize: 7 },
            bodyStyles: { fontSize: 7 },
            margin: { left: 14, right: 14 }
          });
        }
        startY = doc.lastAutoTable.finalY + 8;
      });

      // Summary totals
      doc.setFillColor(13, 122, 107);
      doc.rect(14, startY, 269, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      if (type === 'efficiency') {
        const allEff = lines.map(l => calcEfficiency(l).efficiency);
        const avg = allEff.reduce((a, b) => a + b, 0) / allEff.length;
        doc.text('Total lines: ' + lines.length + '   |   Average efficiency: ' + avg.toFixed(1) + '%   |   Best: ' + Math.max(...allEff).toFixed(1) + '%', 18, startY + 8);
      } else {
        const totalDaily = lines.reduce((s, l) => s + calcCapacity(l).dailyCapacity, 0);
        const totalMonthly = lines.reduce((s, l) => s + calcCapacity(l).monthlyCapacity, 0);
        doc.text('Total lines: ' + lines.length + '   |   Total daily: ' + totalDaily.toLocaleString() + ' pcs   |   Total monthly: ' + totalMonthly.toLocaleString() + ' pcs', 18, startY + 8);
      }
      startY += 16;

      // Article SMV section at bottom
      if (articleSMV && articleSMV.total_smv) {
        doc.setFillColor(240, 248, 255);
        doc.rect(14, startY, 269, 20, 'F');
        doc.setTextColor(15, 41, 66);
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text('Article SMV Reference: ' + (articleSMV.article_number ? '#' + articleSMV.article_number + ' — ' : '') + (articleSMV.name || '') + '   |   Total SMV: ' + articleSMV.total_smv + ' min   |   Garment: ' + (articleSMV.garment_type || '—'), 18, startY + 8);
        doc.setFont('helvetica', 'normal');
        doc.text('Daily output @ 80% eff: ' + Math.floor(480 * 0.8 / articleSMV.total_smv) + ' pcs/operator   |   Operators for 500 pcs: ' + Math.ceil(500 * articleSMV.total_smv / (480 * 0.8)) + ' operators', 18, startY + 16);
      }

      doc.setFontSize(7); doc.setTextColor(150);
      doc.text('TextileIE — ' + (companyName || '') + '  |  Confidential', 14, 200);
      doc.save('TextileIE-' + type + '-All-Lines-' + Date.now() + '.pdf');
    });
  });
}

// ════════════════════════════════════════════════════════════
// EFFICIENCY PAGE
// ════════════════════════════════════════════════════════════
const newEffLine = (num) => ({
  id: Date.now() + num,
  lineNumber: num,
  department: 'sewing',
  articleNumber: '',
  shiftMinutes: 480,
  operators: 40,
  unitsProduced: 320,
  smv: 18,
  selectedSMV: null,
});

export function EfficiencyPage() {
  const [lines, setLines]       = useState([newEffLine(1)]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [saving, setSaving]     = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [loadingStyleData, setLoadingStyleData] = useState(false);
  const { toast, ToastContainer } = useToast();
  const { profile } = useAuth();

  const setLine = (id, k, v) => {
  setLines(prev =>
    prev.map(l => l.id === id ? { ...l, [k]: v } : l)
  );
};
  const addLine = () => { const n = newEffLine(lines.length + 1); setLines([...lines, n]); setActiveIdx(lines.length); };
  const removeLine = (id) => {
    if (lines.length === 1) return;
    const idx = lines.findIndex(l => l.id === id);
    setLines(lines.filter(l => l.id !== id));
    setActiveIdx(Math.max(0, idx - 1));
  };

  const handleStyleSelect = async ({ style, color }) => {
    setSelectedStyle(style || null);
    setSelectedColor(color || null);
    if (!style) return;
    setLoadingStyleData(true);
    try {
      const summary = await getStyleCostSummary({ style_id: style.id, color_id: color?.id || null });
      const template = makeStyleSMVTemplate(style, summary?.smv);
      const deptSmv = template ? getDepartmentSMV(template, lines[activeIdx]?.department || 'sewing') : (lines[activeIdx]?.smv || 0);
      const line = lines[activeIdx] || lines[0];
      setLine(line.id, 'articleNumber', style.article_number || '');
      setLine(line.id, 'selectedSMV', template);
      if (deptSmv) setLine(line.id, 'smv', deptSmv);
    } catch (err) { toast('Failed to load Style SMV: ' + err.message, 'error'); }
    finally { setLoadingStyleData(false); }
  };

  const active = lines[activeIdx] || lines[0];
  const r = calcEfficiency(active);

  // Group lines by department
  const byDept = DEPARTMENTS.map(d => ({
    ...d,
    lines: lines.filter(l => (l.department || 'sewing') === d.value)
  })).filter(d => d.lines.length > 0);

  const save = async () => {
    setSaving(true);
    try {
      // Save individual line report
      await createReport({
        type: 'efficiency',
        title: 'Efficiency — ' + DEPT_LABEL[active.department] + ' Line ' + active.lineNumber + (active.articleNumber ? ' Art#' + active.articleNumber : '') + ' — ' + new Date().toLocaleDateString(),
        inputs: {
          department: DEPT_LABEL[active.department] || active.department,
          lineNumber: active.lineNumber,
          articleNumber: active.articleNumber,
          shiftMinutes: active.shiftMinutes,
          operators: active.operators,
          unitsProduced: active.unitsProduced,
          smv: active.smv,
        },
        results: {
          allLines: lines,
          departmentTotals: makeDeptTotals(lines, 'efficiency'),
          efficiency: r.efficiency,
          availableMinutes: r.availableMinutes,
          earnedMinutes: r.earnedMinutes,
          lostMinutes: r.lostMinutes,
          outputPerOperator: r.outputPerOperator,
          targetOutput: r.targetOutput,
          // Article SMV at bottom
          articleSMV: active.selectedSMV ? active.selectedSMV.total_smv : active.smv,
          articleName: active.selectedSMV ? (active.selectedSMV.article_number ? '#' + active.selectedSMV.article_number : active.selectedSMV.name) : '',
        }
      });
      toast(DEPT_LABEL[active.department] + ' Line ' + active.lineNumber + ' saved');
    } catch (err) { toast('Failed: ' + err.message, 'error'); }
    finally { setSaving(false); }
  };

  const exportLinePDF = async () => {
    try {
      const { default: jsPDF }     = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();
      const now = new Date().toLocaleDateString('en-PK');
      const eff = r.efficiency;
      const effColor = eff >= 75 ? [5, 150, 105] : eff >= 55 ? [217, 119, 6] : [220, 38, 38];

      doc.setFillColor(15, 41, 66); doc.rect(0, 0, 210, 28, 'F');
      doc.setFillColor(13, 122, 107); doc.rect(0, 26, 210, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text('Efficiency Report — ' + DEPT_LABEL[active.department] + ' Department', 14, 13);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.text((profile?.company_name || '') + '  |  ' + now, 14, 21);

      // Info
      doc.setFillColor(228, 244, 241); doc.rect(14, 33, 182, 14, 'F');
      doc.setTextColor(15, 41, 66); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text('Department: ' + DEPT_LABEL[active.department], 18, 41);
      doc.text('Line: ' + active.lineNumber, 80, 41);
      doc.text('Article#: ' + (active.articleNumber || '—'), 110, 41);
      doc.text('Date: ' + now, 160, 41);

      // Efficiency gauge
      doc.setFillColor(...effColor); doc.circle(175, 58, 16, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text(eff.toFixed(1) + '%', 166, 61);
      doc.setFontSize(7); doc.text('EFFICIENCY', 164, 67);

      let y = 55;
      doc.setTextColor(15, 41, 66); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text('Inputs', 14, y); y += 4;
      autoTable(doc, {
        startY: y, margin: { left: 14, right: 14 },
        head: [['Parameter', 'Value']],
        body: [
          ['Department', DEPT_LABEL[active.department]],
          ['Line number', 'Line ' + active.lineNumber],
          ['Shift duration', active.shiftMinutes + ' min'],
          ['Operators', active.operators],
          ['Units produced', active.unitsProduced],
          ['SMV per unit', active.smv + ' min'],
        ],
        headStyles: { fillColor: [13, 122, 107], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 8 }, theme: 'striped'
      });
      y = doc.lastAutoTable.finalY + 6;
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.text('Results', 14, y); y += 4;
      autoTable(doc, {
        startY: y, margin: { left: 14, right: 14 },
        head: [['Metric', 'Value']],
        body: [
          ['Efficiency',          eff.toFixed(2) + '%'],
          ['Available minutes',   r.availableMinutes + ' min'],
          ['Earned minutes',      r.earnedMinutes.toFixed(1) + ' min'],
          ['Lost minutes',        r.lostMinutes.toFixed(1) + ' min'],
          ['Output per operator', r.outputPerOperator.toFixed(1) + ' pcs'],
          ['Target output (100%)', r.targetOutput + ' pcs'],
        ],
        headStyles: { fillColor: [15, 41, 66], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 8 }, theme: 'striped'
      });

      // Efficiency bar
      y = doc.lastAutoTable.finalY + 8;
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(15, 41, 66);
      doc.text('Efficiency scale', 14, y); y += 4;
      const bW = 182;
      doc.setFillColor(220, 38, 38);  doc.rect(14, y, bW * 0.55, 8, 'F');
      doc.setFillColor(217, 119, 6);  doc.rect(14 + bW * 0.55, y, bW * 0.20, 8, 'F');
      doc.setFillColor(5, 150, 105);  doc.rect(14 + bW * 0.75, y, bW * 0.25, 8, 'F');
      const ptr = 14 + Math.min(eff, 100) / 100 * bW;
      doc.setFillColor(255, 255, 255); doc.triangle(ptr - 2, y - 1, ptr + 2, y - 1, ptr, y + 2, 'F');
      doc.setFontSize(6); doc.setTextColor(255, 255, 255);
      doc.text('< 55% Below', 16, y + 6);
      doc.text('55-75%', 14 + bW * 0.56, y + 6);
      doc.text('> 75% World class', 14 + bW * 0.76, y + 6);
      y += 16;

      // Article SMV at bottom
      if (active.selectedSMV) {
        doc.setFillColor(240, 248, 255); doc.rect(14, y, 182, 18, 'F');
        doc.setTextColor(15, 41, 66); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text('Article SMV Reference', 18, y + 7);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        doc.text('Article: ' + (active.selectedSMV.article_number ? '#' + active.selectedSMV.article_number : '—') + '   Garment: ' + (active.selectedSMV.garment_type || '—') + '   SMV: ' + active.selectedSMV.total_smv + ' min', 18, y + 13);
      }

      doc.setFontSize(7); doc.setTextColor(150);
      doc.text('TextileIE — ' + (profile?.company_name || '') + '  |  Confidential', 14, 290);
      doc.save('Efficiency-' + DEPT_LABEL[active.department] + '-Line' + active.lineNumber + '-' + Date.now() + '.pdf');
    } catch (err) { toast('PDF failed: ' + err.message, 'error'); }
  };

  return (
    <div>
      <ToastContainer />
      <PageHeader title="Efficiency Calculator" subtitle="Department-wise efficiency tracking per production line" badge={{ text: 'IE Formula' }} />

      {/* Line tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {lines.map((l, i) => {
          const dept = DEPARTMENTS.find(d => d.value === (l.department || 'sewing'));
          return (
            <div key={l.id} style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => setActiveIdx(i)} style={{
                padding: '6px 12px',
                borderRadius: lines.length > 1 ? '6px 0 0 6px' : '6px',
                background: activeIdx === i ? (dept?.dot || 'var(--navy)') : 'var(--bg)',
                color: activeIdx === i ? 'white' : 'var(--text-secondary)',
                fontWeight: activeIdx === i ? 600 : 400,
                cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                border: '1px solid var(--border)', borderRight: lines.length > 1 ? 'none' : undefined,
              }}>
                <span style={{ marginRight: 4 }}>{dept?.label || 'Sewing'}</span>
                L{l.lineNumber}
                {l.articleNumber && <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>#{l.articleNumber}</span>}
              </button>
              {lines.length > 1 && (
                <button onClick={() => removeLine(l.id)} style={{
                  padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '0 6px 6px 0',
                  background: activeIdx === i ? (dept?.dot || 'var(--navy)') : 'var(--bg)',
                  color: activeIdx === i ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}>
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          );
        })}
        <button className="btn btn-secondary btn-sm" onClick={addLine}><Plus size={13} /> Add line</button>
        {lines.length > 1 && (
          <button className="btn btn-sm" style={{ background: 'var(--teal)', color: 'white', border: 'none', marginLeft: 'auto' }}
            onClick={() => exportAllLinesPDF({ lines, type: 'efficiency', companyName: profile?.company_name, userName: profile?.full_name, articleSMV: active.selectedSMV })}>
            <FileText size={13} /> All lines PDF
          </button>
        )}
      </div>

      <ArticleSelector
        value={selectedStyle?.id}
        colorId={selectedColor?.id}
        label="Select Style for Efficiency"
        onSelect={handleStyleSelect}
      />
      {loadingStyleData && <div className="card" style={{ padding: 12, fontSize: 12, marginBottom: 14 }}>Loading department SMV from Style Master...</div>}

      <CalcGrid>
        {/* Inputs */}
        <div className="card">
          {/* Department + line header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14, padding: '12px 14px', background: 'var(--navy)', borderRadius: 10 }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Department</label>
              <select
  value={active.department || 'sewing'}
  onChange={e => {
    const dept = e.target.value;

    setLine(active.id, 'department', dept);

    if (active.selectedSMV) {
      const deptSmv = getDepartmentSMV(active.selectedSMV, dept);
      setLine(active.id, 'smv', deptSmv);
    }
  }}
  style={{
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'white',
    borderRadius: 6,
    padding: '6px 8px',
    width: '100%',
    fontSize: 13
  }}
>
  {DEPARTMENTS.map(d => (
    <option key={d.value} value={d.value} style={{ color: 'black' }}>
      {d.label}
    </option>
  ))}
</select>
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Article #</label>
              <input
                value={active.articleNumber || ''}
                readOnly
                placeholder="Auto from Style Master"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: 6,
                  padding: '6px 8px',
                  width: '100%',
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono',
                  fontWeight: 700,
                  cursor: 'not-allowed',
                 }}
              />
          </div>
          </div>
          
          <div className="field"><label>Shift duration (minutes)</label><input type="number" value={active.shiftMinutes} onChange={e => setLine(active.id, 'shiftMinutes', parseFloat(e.target.value) || 0)} /></div>
          <div className="field"><label>Number of operators</label><input type="number" value={active.operators} onChange={e => setLine(active.id, 'operators', parseFloat(e.target.value) || 0)} /></div>
          <div className="field"><label>Units produced</label><input type="number" value={active.unitsProduced} onChange={e => setLine(active.id, 'unitsProduced', parseFloat(e.target.value) || 0)} /></div>
          <div className="field"><label>SMV per unit (minutes)</label><input type="number" step="0.01" value={active.smv} onChange={e => setLine(active.id, 'smv', parseFloat(e.target.value) || 0)} /></div>
        
          <FormulaNote>Efficiency = (Earned min / Available min) x 100</FormulaNote>

          {/* Selected SMV info */}
          {active.selectedSMV && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--teal-light)', borderRadius: 8, fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: 'var(--teal)', marginBottom: 4 }}>Article SMV loaded</div>
              <div style={{ color: 'var(--text-secondary)' }}>
                {active.selectedSMV.article_number ? '#' + active.selectedSMV.article_number + ' — ' : ''}{active.selectedSMV.name} · {active.selectedSMV.garment_type} · <strong>{active.selectedSMV.total_smv} min</strong>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: DEPT_DOT[active.department] || 'var(--teal)' }} />
              <h3>{DEPT_LABEL[active.department] || 'Sewing'} — Line {active.lineNumber} Results</h3>
            </div>
            <div style={{ textAlign: 'center', padding: '12px 0 16px', borderBottom: '1px solid var(--border-light)', marginBottom: 14 }}>
              <div style={{ fontSize: 36, fontWeight: 700, color: efficiencyColor(r.efficiency), fontFamily: 'JetBrains Mono' }}>{formatNum(r.efficiency, 1)}%</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>LINE EFFICIENCY</div>
            </div>
            {[
              { label: 'Available minutes', value: formatNum(r.availableMinutes, 0) + ' min' },
              { label: 'Earned minutes',    value: formatNum(r.earnedMinutes, 1)   + ' min', highlight: true },
              { label: 'Lost minutes',      value: formatNum(r.lostMinutes, 1)     + ' min' },
              { label: 'Output/operator',   value: formatNum(r.outputPerOperator, 1) + ' pcs' },
              { label: 'Target (100%)',     value: formatNum(r.targetOutput, 0)    + ' pcs' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 500, color: row.highlight ? 'var(--teal)' : 'var(--text-primary)' }}>{row.value}</span>
              </div>
            ))}

            {/* Article SMV reference at bottom of card */}
            {active.selectedSMV && (
              <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--navy)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Article SMV Reference</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>{active.selectedSMV.article_number ? '#' + active.selectedSMV.article_number : active.selectedSMV.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{active.selectedSMV.garment_type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#4EECD8', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 18 }}>{active.selectedSMV.total_smv} min</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>SMV / SAM</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}><Save size={14} />{saving ? 'Saving...' : 'Save report'}</button>
              <button className="btn btn-secondary" onClick={exportLinePDF}><Download size={14} /></button>
            </div>
          </div>

          <AIAnalysis type="efficiency" data={active} results={r} lines={lines} />

          {/* Dept summary */}
          {lines.length > 1 && (
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>All lines — by department</h3>
              {byDept.map(d => (
                <div key={d.value} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: d.dot, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.label}</div>
                  {d.lines.map((l, i) => {
                    const lr = calcEfficiency(l);
                    const lIdx = lines.findIndex(x => x.id === l.id);
                    return (
                      <div key={l.id} onClick={() => setActiveIdx(lIdx)} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '7px 10px', marginBottom: 4, borderRadius: 8, cursor: 'pointer',
                        background: activeIdx === lIdx ? d.dot : d.color,
                        color: activeIdx === lIdx ? 'white' : 'var(--text-primary)'
                      }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>Line {l.lineNumber}</span>
                          {l.articleNumber && <span style={{ fontSize: 11, marginLeft: 6, opacity: 0.7 }}>#{l.articleNumber}</span>}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 15, fontFamily: 'JetBrains Mono', color: activeIdx === lIdx ? 'white' : efficiencyColor(lr.efficiency) }}>
                          {lr.efficiency.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </CalcGrid>

      {/* Benchmark */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 14 }}>Efficiency benchmark</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[['< 55%', 'Below target', 'var(--red)', 'var(--red-light)'], ['55-75%', 'Acceptable', 'var(--amber)', 'var(--amber-light)'], ['> 75%', 'World class', 'var(--green)', 'var(--green-light)']].map(([r, l, c, bg]) => (
            <div key={l} style={{ padding: 14, background: bg, borderRadius: 10, textAlign: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: c, fontFamily: 'JetBrains Mono' }}>{r}</div>
              <div style={{ fontSize: 12, color: c, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// CAPACITY PAGE
// ════════════════════════════════════════════════════════════
const newCapLine = (num) => ({
  id: Date.now() + num,
  lineNumber: num,
  department: 'sewing',
  articleNumber: '',
  machines: 50,
  shiftsPerDay: 2,
  shiftMinutes: 480,
  smv: 15,
  efficiencyPct: 75,
  workingDaysPerMonth: 26,
  selectedSMV: null,
});

export function CapacityPage() {
  const [lines, setLines]       = useState([newCapLine(1)]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [saving, setSaving]     = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [loadingStyleData, setLoadingStyleData] = useState(false);
  const { toast, ToastContainer } = useToast();
  const { profile } = useAuth();

  const setLine = (id, k, v) => {
  setLines(prev =>
    prev.map(l => l.id === id ? { ...l, [k]: v } : l)
  );
}; 
  const addLine = () => { const n = newCapLine(lines.length + 1); setLines([...lines, n]); setActiveIdx(lines.length); };
  const removeLine = (id) => {
    if (lines.length === 1) return;
    const idx = lines.findIndex(l => l.id === id);
    setLines(lines.filter(l => l.id !== id));
    setActiveIdx(Math.max(0, idx - 1));
  };

  const handleStyleSelect = async ({ style, color }) => {
    setSelectedStyle(style || null);
    setSelectedColor(color || null);
    if (!style) return;
    setLoadingStyleData(true);
    try {
      const summary = await getStyleCostSummary({ style_id: style.id, color_id: color?.id || null });
      const template = makeStyleSMVTemplate(style, summary?.smv);
      const deptSmv = template ? getDepartmentSMV(template, lines[activeIdx]?.department || 'sewing') : (lines[activeIdx]?.smv || 0);
      const line = lines[activeIdx] || lines[0];
      setLine(line.id, 'articleNumber', style.article_number || '');
      setLine(line.id, 'selectedSMV', template);
      if (deptSmv) setLine(line.id, 'smv', deptSmv);
    } catch (err) { toast('Failed to load Style SMV: ' + err.message, 'error'); }
    finally { setLoadingStyleData(false); }
  };

  const active = lines[activeIdx] || lines[0];
  const r = calcCapacity(active);

  const byDept = DEPARTMENTS.map(d => ({
    ...d,
    lines: lines.filter(l => (l.department || 'sewing') === d.value)
  })).filter(d => d.lines.length > 0);

  const totalDaily   = lines.reduce((s, l) => s + calcCapacity(l).dailyCapacity, 0);
  const totalMonthly = lines.reduce((s, l) => s + calcCapacity(l).monthlyCapacity, 0);

  const save = async () => {
    setSaving(true);
    try {
      await createReport({
        type: 'capacity',
        title: 'Capacity — ' + DEPT_LABEL[active.department] + ' Line ' + active.lineNumber + (active.articleNumber ? ' Art#' + active.articleNumber : '') + ' — ' + new Date().toLocaleDateString(),
        inputs: {
          department: DEPT_LABEL[active.department] || active.department,
          lineNumber: active.lineNumber,
          articleNumber: active.articleNumber,
          machines: active.machines,
          shiftsPerDay: active.shiftsPerDay,
          shiftMinutes: active.shiftMinutes,
          smv: active.smv,
          efficiencyPct: active.efficiencyPct,
          workingDaysPerMonth: active.workingDaysPerMonth,
        },
        results: {
          allLines: lines,
          departmentTotals: makeDeptTotals(lines, 'capacity'),
          dailyCapacity: r.dailyCapacity,
          weeklyCapacity: r.weeklyCapacity,
          monthlyCapacity: r.monthlyCapacity,
          effectiveMinutes: r.effectiveMinutes,
          minutesPerPiece: r.minutesPerPiece,
          // Article SMV
          articleSMV: active.selectedSMV ? active.selectedSMV.total_smv : active.smv,
          articleName: active.selectedSMV ? (active.selectedSMV.article_number ? '#' + active.selectedSMV.article_number : active.selectedSMV.name) : '',
        }
      });
      toast(DEPT_LABEL[active.department] + ' Line ' + active.lineNumber + ' capacity saved');
    } catch (err) { toast('Failed: ' + err.message, 'error'); }
    finally { setSaving(false); }
  };

  const exportLinePDF = async () => {
    try {
      const { default: jsPDF }     = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();
      const now = new Date().toLocaleDateString('en-PK');

      doc.setFillColor(15, 41, 66); doc.rect(0, 0, 210, 28, 'F');
      doc.setFillColor(13, 122, 107); doc.rect(0, 26, 210, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14); doc.setFont('helvetica', 'bold');
      doc.text('Capacity Report — ' + DEPT_LABEL[active.department] + ' Department', 14, 13);
      doc.setFontSize(8); doc.setFont('helvetica', 'normal');
      doc.text((profile?.company_name || '') + '  |  ' + now, 14, 21);

      doc.setFillColor(228, 244, 241); doc.rect(14, 33, 182, 14, 'F');
      doc.setTextColor(15, 41, 66); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text('Dept: ' + DEPT_LABEL[active.department], 18, 41);
      doc.text('Line: ' + active.lineNumber, 70, 41);
      doc.text('Article#: ' + (active.articleNumber || '—'), 100, 41);

      let y = 55;
      autoTable(doc, {
        startY: y, margin: { left: 14, right: 14 },
        head: [['Parameter', 'Value']],
        body: [
          ['Department', DEPT_LABEL[active.department]],
          ['Machines / operators', active.machines],
          ['Shifts per day', active.shiftsPerDay],
          ['Shift duration', active.shiftMinutes + ' min'],
          ['SMV per unit', active.smv + ' min'],
          ['Target efficiency', active.efficiencyPct + '%'],
          ['Working days/month', active.workingDaysPerMonth],
        ],
        headStyles: { fillColor: [13, 122, 107], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 8 }, theme: 'striped'
      });
      y = doc.lastAutoTable.finalY + 6;

      autoTable(doc, {
        startY: y, margin: { left: 14, right: 14 },
        head: [['Period', 'Capacity']],
        body: [
          ['Daily capacity',   r.dailyCapacity.toLocaleString()   + ' pcs'],
          ['Weekly capacity',  r.weeklyCapacity.toLocaleString()  + ' pcs'],
          ['Monthly capacity', r.monthlyCapacity.toLocaleString() + ' pcs'],
          ['Effective minutes', r.effectiveMinutes.toLocaleString() + ' min'],
          ['Minutes per piece', r.minutesPerPiece + ' min'],
        ],
        headStyles: { fillColor: [15, 41, 66], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 8 }, theme: 'striped'
      });

      // Article SMV at bottom
      if (active.selectedSMV) {
        y = doc.lastAutoTable.finalY + 10;
        doc.setFillColor(240, 248, 255); doc.rect(14, y, 182, 20, 'F');
        doc.setTextColor(15, 41, 66); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text('Article SMV Reference', 18, y + 7);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        doc.text('Article: ' + (active.selectedSMV.article_number ? '#' + active.selectedSMV.article_number : '—') + '  Garment: ' + (active.selectedSMV.garment_type || '—') + '  SMV: ' + active.selectedSMV.total_smv + ' min', 18, y + 13);
        doc.text('Daily output @ 80%: ' + Math.floor(480 * 0.8 / active.selectedSMV.total_smv) + ' pcs/op  |  Ops for 500 pcs: ' + Math.ceil(500 * active.selectedSMV.total_smv / (480 * 0.8)), 18, y + 18);
      }

      doc.setFontSize(7); doc.setTextColor(150);
      doc.text('TextileIE — ' + (profile?.company_name || '') + '  |  Confidential', 14, 290);
      doc.save('Capacity-' + DEPT_LABEL[active.department] + '-Line' + active.lineNumber + '-' + Date.now() + '.pdf');
    } catch (err) { toast('PDF failed: ' + err.message, 'error'); }
  };

  return (
    <div>
      <ToastContainer />
      <PageHeader title="Capacity Planning" subtitle="Department-wise capacity tracking per production line" badge={{ text: 'IE Formula' }} />

      {/* Line tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {lines.map((l, i) => {
          const dept = DEPARTMENTS.find(d => d.value === (l.department || 'sewing'));
          return (
            <div key={l.id} style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => setActiveIdx(i)} style={{
                padding: '6px 12px', border: '1px solid var(--border)',
                borderRadius: lines.length > 1 ? '6px 0 0 6px' : '6px',
                borderRight: lines.length > 1 ? 'none' : undefined,
                background: activeIdx === i ? (dept?.dot || 'var(--navy)') : 'var(--bg)',
                color: activeIdx === i ? 'white' : 'var(--text-secondary)',
                fontWeight: activeIdx === i ? 600 : 400,
                cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
              }}>
                {dept?.label || 'Sewing'} L{l.lineNumber}
                {l.articleNumber && <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>#{l.articleNumber}</span>}
              </button>
              {lines.length > 1 && (
                <button onClick={() => removeLine(l.id)} style={{
                  padding: '6px 8px', border: '1px solid var(--border)', borderRadius: '0 6px 6px 0',
                  background: activeIdx === i ? (dept?.dot || 'var(--navy)') : 'var(--bg)',
                  color: activeIdx === i ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', cursor: 'pointer',
                }}>
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          );
        })}
        <button className="btn btn-secondary btn-sm" onClick={addLine}><Plus size={13} /> Add line</button>
        {lines.length > 1 && (
          <button className="btn btn-sm" style={{ background: 'var(--teal)', color: 'white', border: 'none', marginLeft: 'auto' }}
            onClick={() => exportAllLinesPDF({ lines, type: 'capacity', companyName: profile?.company_name, userName: profile?.full_name, articleSMV: active.selectedSMV })}>
            <FileText size={13} /> All lines PDF
          </button>
        )}
      </div>

      <ArticleSelector
        value={selectedStyle?.id}
        colorId={selectedColor?.id}
        label="Select Style for Capacity"
        onSelect={handleStyleSelect}
      />
      {loadingStyleData && <div className="card" style={{ padding: 12, fontSize: 12, marginBottom: 14 }}>Loading department SMV from Style Master...</div>}

      <CalcGrid>
        <div className="card">
          {/* Dept + article header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14, padding: '12px 14px', background: 'var(--navy)', borderRadius: 10 }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Department</label>
             <select
  value={active.department || 'sewing'}
  onChange={e => {
    const dept = e.target.value;

    setLine(active.id, 'department', dept);

    if (active.selectedSMV) {
      const deptSmv = getDepartmentSMV(active.selectedSMV, dept);
      setLine(active.id, 'smv', deptSmv);
    }
  }}
  style={{
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'white',
    borderRadius: 6,
    padding: '6px 8px',
    width: '100%',
    fontSize: 13
  }}
>
  {DEPARTMENTS.map(d => (
    <option key={d.value} value={d.value} style={{ color: 'black' }}>
      {d.label}
    </option>
  ))}
</select>
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Article #</label>
              <input
                value={active.articleNumber || ''}
                readOnly
                placeholder="Auto from Style Master"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: 6,
                  padding: '6px 8px',
                  width: '100%',
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono',
                  fontWeight: 700,
                  cursor: 'not-allowed',
                 }}
              />
          </div>
          </div>
          <div className="field"><label>Machines / operators</label><input type="number" value={active.machines} onChange={e => setLine(active.id, 'machines', parseFloat(e.target.value) || 0)} /></div>
          <div className="field"><label>Shifts per day</label><input type="number" value={active.shiftsPerDay} onChange={e => setLine(active.id, 'shiftsPerDay', parseFloat(e.target.value) || 0)} /></div>
          <div className="field"><label>Shift duration (minutes)</label><input type="number" value={active.shiftMinutes} onChange={e => setLine(active.id, 'shiftMinutes', parseFloat(e.target.value) || 0)} /></div>
          <div className="field"><label>SMV per unit (minutes)</label><input type="number" step="0.01" value={active.smv} onChange={e => setLine(active.id, 'smv', parseFloat(e.target.value) || 0)} /></div>
          <div className="field"><label>Target efficiency (%)</label><input type="number" value={active.efficiencyPct} onChange={e => setLine(active.id, 'efficiencyPct', parseFloat(e.target.value) || 0)} /></div>
          <div className="field"><label>Working days per month</label><input type="number" value={active.workingDaysPerMonth} onChange={e => setLine(active.id, 'workingDaysPerMonth', parseFloat(e.target.value) || 0)} /></div>
        
      
          <FormulaNote>Capacity = (Machines x Shifts x Min x Eff%) / SMV</FormulaNote>

          {active.selectedSMV && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--teal-light)', borderRadius: 8, fontSize: 12 }}>
              <div style={{ fontWeight: 600, color: 'var(--teal)', marginBottom: 2 }}>Article SMV loaded</div>
              <div style={{ color: 'var(--text-secondary)' }}>{active.selectedSMV.article_number ? '#' + active.selectedSMV.article_number + ' — ' : ''}{active.selectedSMV.name} · <strong>{active.selectedSMV.total_smv} min</strong></div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: DEPT_DOT[active.department] || 'var(--teal)' }} />
              <h3>{DEPT_LABEL[active.department] || 'Sewing'} — Line {active.lineNumber}</h3>
            </div>

            <div style={{ textAlign: 'center', padding: '12px 0 16px', borderBottom: '1px solid var(--border-light)', marginBottom: 14 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--teal)', fontFamily: 'JetBrains Mono' }}>{r.dailyCapacity.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>DAILY CAPACITY (pcs)</div>
            </div>

            {[
              { label: 'Effective minutes',  value: r.effectiveMinutes.toLocaleString() + ' min', highlight: true },
              { label: 'Weekly capacity',    value: r.weeklyCapacity.toLocaleString() + ' pcs' },
              { label: 'Monthly capacity',   value: r.monthlyCapacity.toLocaleString() + ' pcs', highlight: true },
              { label: 'Minutes per piece',  value: formatNum(r.minutesPerPiece) + ' min' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 500, color: row.highlight ? 'var(--teal)' : 'var(--text-primary)' }}>{row.value}</span>
              </div>
            ))}

            {/* Article SMV at bottom of results */}
            {active.selectedSMV && (
              <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--navy)', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Article SMV Reference</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ color: 'white', fontWeight: 600, fontSize: 13 }}>{active.selectedSMV.article_number ? '#' + active.selectedSMV.article_number : active.selectedSMV.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{active.selectedSMV.garment_type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#4EECD8', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 18 }}>{active.selectedSMV.total_smv} min</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>SMV / SAM</div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}><Save size={14} />{saving ? 'Saving...' : 'Save report'}</button>
              <button className="btn btn-secondary" onClick={exportLinePDF}><Download size={14} /></button>
            </div>
          </div>

          <AIAnalysis type="capacity" data={active} results={r} lines={lines} />

          {/* Dept summary */}
          {lines.length > 1 && (
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>All lines — by department</h3>
              {byDept.map(d => (
                <div key={d.value} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: d.dot, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.label}</div>
                  {d.lines.map((l) => {
                    const lr = calcCapacity(l);
                    const lIdx = lines.findIndex(x => x.id === l.id);
                    return (
                      <div key={l.id} onClick={() => setActiveIdx(lIdx)} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '7px 10px', marginBottom: 4, borderRadius: 8, cursor: 'pointer',
                        background: activeIdx === lIdx ? d.dot : d.color,
                        color: activeIdx === lIdx ? 'white' : 'var(--text-primary)'
                      }}>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>Line {l.lineNumber}</span>
                          {l.articleNumber && <span style={{ fontSize: 11, marginLeft: 6, opacity: 0.7 }}>#{l.articleNumber}</span>}
                          <span style={{ fontSize: 11, marginLeft: 6, opacity: 0.6 }}>{l.efficiencyPct}% eff</span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 14, fontFamily: 'JetBrains Mono', color: activeIdx === lIdx ? 'white' : 'var(--teal)' }}>
                          {lr.dailyCapacity.toLocaleString()} pcs
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div style={{ borderTop: '2px solid var(--border-light)', marginTop: 8, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>FACTORY TOTAL ({lines.length} lines)</span>
                <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--teal)' }}>{totalDaily.toLocaleString()} pcs/day</span>
              </div>
            </div>
          )}
        </div>
      </CalcGrid>

      {/* Factory totals */}
      {lines.length > 1 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 14 }}>Factory total capacity — all departments</h3>
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

      {/* Bar chart */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 14 }}>Line {active.lineNumber} — capacity by period</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={[{ p: 'Daily', v: r.dailyCapacity }, { p: 'Weekly', v: r.weeklyCapacity }, { p: 'Monthly', v: r.monthlyCapacity }]}>
            <XAxis dataKey="p" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v.toLocaleString()} />
            <Tooltip formatter={v => [v.toLocaleString() + ' pcs', 'Capacity']} />
            <Bar dataKey="v" fill={DEPT_DOT[active.department] || 'var(--teal)'} radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
