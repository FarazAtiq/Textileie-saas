import { useState } from 'react';
import { calcSMV, formatNum } from '../utils/calculations.js';
import { PageHeader } from '../components/ResultCard.jsx';
import { createReport, createSMVTemplate, upsertStyleCostModule } from '../lib/db.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { Plus, Trash2, Save, Download, BookOpen, FileText } from 'lucide-react';
import { ArticleSelector } from '../components/ArticleSelector.jsx';

const PROCESS_TYPES = [
  { group: 'Sewing',        options: [{ value: 'sewing', label: 'Sewing' }] },
  { group: 'Cutting Room',  options: [{ value: 'lapping', label: 'Lapping' }, { value: 'cutting', label: 'Cutting' }, { value: 'bundling', label: 'Bundling' }] },
  { group: 'Embellishment', options: [{ value: 'embroidery', label: 'Embroidery' }, { value: 'printing', label: 'Printing' }, { value: 'heat_transfer', label: 'Heat Transfer' }, { value: 'applique', label: 'Applique' }, { value: 'rhinestone', label: 'Rhinestone' }, { value: 'smocking', label: 'Smocking' }] },
  { group: 'Finishing',     options: [{ value: 'pressing', label: 'Pressing/Iron' }, { value: 'folding', label: 'Folding' }, { value: 'packing', label: 'Packing' }, { value: 'tagging', label: 'Tagging' }] },
  { group: 'Quality',       options: [{ value: 'inline_qc', label: 'Inline QC' }, { value: 'final_qc', label: 'Final QC' }, { value: 'measurement', label: 'Measurement' }] },
];

const PROCESS_LABEL = {};
PROCESS_TYPES.forEach(g => g.options.forEach(o => { PROCESS_LABEL[o.value] = g.group + ' — ' + o.label; }));

const PROCESS_BG = {
  sewing: 'transparent',
  lapping: '#FFF3E0', cutting: '#FCE4EC', bundling: '#F3E5F5',
  embroidery: '#E8F5E9', printing: '#E8F5E9', heat_transfer: '#E8F5E9', applique: '#E8F5E9', rhinestone: '#E8F5E9', smocking: '#E8F5E9',
  pressing: '#E3F2FD', folding: '#E3F2FD', packing: '#E3F2FD', tagging: '#E3F2FD',
  inline_qc: '#FFF8E1', final_qc: '#FFF8E1', measurement: '#FFF8E1',
};

const MACHINES_BY_PROCESS = {
  sewing:       ['SNL','DNL','Overlock 3T','Overlock 4T','Overlock 5T','Flatseam','Bartack','Buttonhole','Button Attach','Kansai','Feed Off Arm','Zigzag','Manual'],
  lapping:      ['Spreading Machine','Auto Spreader','Manual Spreading'],
  cutting:      ['Straight Knife','Band Knife','Round Knife','Die Cutter','Laser Cutter','Notcher','Drill Machine','Manual Cutting'],
  bundling:     ['Manual Bundling','Ticket Machine','Sticker Machine'],
  embroidery:   ['Embroidery Machine (Single)','Embroidery Machine (Multi)','Manual Embroidery'],
  printing:     ['Screen Printing','Digital Printing','Rotary Printing'],
  heat_transfer:['Heat Press Machine'],
  applique:     ['Applique Machine','Manual Applique'],
  rhinestone:   ['Rhinestone Machine','Manual Rhinestone'],
  smocking:     ['Smocking Machine','Manual Smocking'],
  pressing:     ['Steam Iron','Pressing Machine','Tunnel Finisher'],
  folding:      ['Folding Machine','Manual Folding'],
  packing:      ['Poly Bag Machine','Carton Line','Manual Packing'],
  tagging:      ['Tag Gun','Manual Tagging'],
  inline_qc:    ['Manual QC'],
  final_qc:     ['Manual QC','Measurement Table'],
  measurement:  ['Measurement Table','Manual'],
};

const GARMENTS = ['T-Shirt','Polo Shirt','Trousers','Jacket','Jeans','Shorts','Dress','Skirt','Formal Shirt','Hoodie','Sweatshirt','Pajama','Sportswear','Denim Jacket','Abaya'];

const PROCESS_DEPARTMENT = {
  lapping: 'cutting', cutting: 'cutting', bundling: 'cutting',
  sewing: 'sewing',
  embroidery: 'embellishment', printing: 'embellishment', heat_transfer: 'embellishment', applique: 'embellishment', rhinestone: 'embellishment', smocking: 'embellishment',
  pressing: 'finishing', folding: 'finishing', packing: 'finishing', tagging: 'finishing',
  inline_qc: 'qc', final_qc: 'qc', measurement: 'qc',
};
const DEPARTMENT_LABEL = { cutting: 'Cutting', sewing: 'Sewing', embellishment: 'Embellishment', finishing: 'Finishing', qc: 'QC' };
const DEPARTMENTS = ['combined', 'cutting', 'sewing', 'embellishment', 'finishing', 'qc'];

function makeSMVSummary(operations) {
  const init = { combined: { label: 'Combined', count: 0, basicTime: 0, allowance: 0, smv: 0 } };
  operations.forEach(op => {
    const dept = PROCESS_DEPARTMENT[op.processType] || 'sewing';
    if (!init[dept]) init[dept] = { label: DEPARTMENT_LABEL[dept] || dept, count: 0, basicTime: 0, allowance: 0, smv: 0 };
    const basic = parseFloat(op.basicTime) || 0;
    const smv = basic * (1 + ((parseFloat(op.allowancePct) || 0) / 100));
    const allowance = smv - basic;
    [init.combined, init[dept]].forEach(row => {
      row.count += 1; row.basicTime += basic; row.allowance += allowance; row.smv += smv;
    });
  });
  return init;
}


const newOp = () => ({
  id: Date.now() + Math.random(),
  name: '',
  processType: 'sewing',
  machine: 'SNL',
  basicTime: 1.0,
  allowancePct: 15,
});

export default function SMVPage() {
  const [ops, setOps] = useState([
    { id: 1, name: 'Fabric spreading', processType: 'lapping',  machine: 'Manual Spreading',  basicTime: 0.8,  allowancePct: 10 },
    { id: 2, name: 'Cut front & back', processType: 'cutting',  machine: 'Straight Knife',     basicTime: 0.5,  allowancePct: 10 },
    { id: 3, name: 'Bundle by size',   processType: 'bundling', machine: 'Manual Bundling',    basicTime: 0.4,  allowancePct: 10 },
    { id: 4, name: 'Attach collar',    processType: 'sewing',   machine: 'DNL',                basicTime: 1.2,  allowancePct: 15 },
    { id: 5, name: 'Sew side seam',    processType: 'sewing',   machine: 'Overlock 5T',        basicTime: 0.9,  allowancePct: 15 },
    { id: 6, name: 'Attach sleeve',    processType: 'sewing',   machine: 'SNL',                basicTime: 1.5,  allowancePct: 15 },
    { id: 7, name: 'Bottom hem',       processType: 'sewing',   machine: 'SNL',                basicTime: 0.7,  allowancePct: 12 },
    { id: 8, name: 'Steam press',      processType: 'pressing', machine: 'Steam Iron',         basicTime: 0.6,  allowancePct: 10 },
    { id: 9, name: 'Final QC check',   processType: 'final_qc', machine: 'Manual QC',          basicTime: 0.4,  allowancePct: 10 },
  ]);

  const [garmentType, setGarmentType]   = useState('T-Shirt');
  const [articleNumber, setArticleNumber] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [templateName, setTemplateName]   = useState('');
  const [saving, setSaving]               = useState(false);
  const [savingTpl, setSavingTpl]         = useState(false);
  const [smvView, setSmvView]               = useState('combined');
  const { profile } = useAuth();
  const { toast, ToastContainer } = useToast();

  const setOp = (id, k, v) => setOps(ops.map(o => {
    if (o.id !== id) return o;
    if (k === 'processType') {
      const machines = MACHINES_BY_PROCESS[v] || ['Manual'];
      return { ...o, processType: v, machine: machines[0] };
    }
    return { ...o, [k]: v };
  }));

  const smvSummary = makeSMVSummary(ops);
  const activeOps = smvView === 'combined' ? ops : ops.filter(o => (PROCESS_DEPARTMENT[o.processType] || 'sewing') === smvView);
  const r = calcSMV(activeOps);
  const combined = calcSMV(ops);

  const handleArticleChange = (val) => {
    setArticleNumber(val);
    if (val && garmentType) setTemplateName(val + ' — ' + garmentType);
  };

  const handleGarmentChange = (val) => {
    setGarmentType(val);
    if (articleNumber && val) setTemplateName(articleNumber + ' — ' + val);
  };

  const handleStyleSelect = ({ style, color }) => {
    setSelectedStyle(style || null);
    setSelectedColor(color || null);
    if (style?.article_number) setArticleNumber(style.article_number);
    if (style?.garment_type) setGarmentType(style.garment_type);
    if (style?.article_number) setTemplateName(style.article_number + ' — ' + (style.style_name || style.garment_type || 'Style'));
  };

  const save = async () => {
    setSaving(true);
    try {
      const styleMeta = {
        style_id: selectedStyle?.id || null,
        color_id: selectedColor?.id || null,
        articleNumber,
        styleName: selectedStyle?.style_name || templateName || '',
        buyer: selectedStyle?.buyer || '',
        colorName: selectedColor?.color_name || '',
        baseSize: selectedStyle?.base_size || '',
        season: selectedStyle?.season || '',
        garmentType,
      };
      await createReport({
        type: 'smv',
        title: 'SMV — ' + (articleNumber ? 'Art#' + articleNumber + ' · ' : '') + (selectedStyle?.style_name || garmentType) + ' — ' + new Date().toLocaleDateString(),
        inputs: { ...styleMeta, smvView, totalOperations: activeOps.length, combinedOperations: ops.length },
        results: { totalSMV: r.totalSMV, combinedSMV: combined.totalSMV, departmentBreakdown: smvSummary, basicTime: r.totalBasicTime, allowance: r.totalAllowanceTime, dailyOutput: r.dailyOutputPerOperator, opsFor500: r.operatorsFor500pcs, operations: activeOps }
      });
      if (selectedStyle?.id) {
        await upsertStyleCostModule({
          style_id: selectedStyle.id,
          color_id: selectedColor?.id || null,
          module_type: 'smv',
          data: { operations: ops, styleMeta },
          summary: { total_smv: combined.totalSMV, department_breakdown: smvSummary, article_number: articleNumber, garment_type: garmentType }
        });
      }
      toast('SMV report saved and linked to Style Master');
    } catch (err) { toast('Failed: ' + err.message, 'error'); }
    finally { setSaving(false); }
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) { toast('Enter a template name', 'error'); return; }
    if (!articleNumber.trim()) { toast('Enter an article number', 'error'); return; }
    setSavingTpl(true);
    try {
      await createSMVTemplate({ name: templateName, garment_type: garmentType, article_number: articleNumber, operations: ops, total_smv: combined.totalSMV, department_breakdown: smvSummary });
      if (selectedStyle?.id) {
        await upsertStyleCostModule({
          style_id: selectedStyle.id,
          color_id: selectedColor?.id || null,
          module_type: 'smv',
          data: { operations: ops },
          summary: { total_smv: combined.totalSMV, department_breakdown: smvSummary, article_number: articleNumber, garment_type: garmentType }
        });
      }
      toast('Art#' + articleNumber + ' saved to Style Master / SMV library');
      setTemplateName(''); setArticleNumber('');
    } catch (err) { toast('Failed: ' + err.message, 'error'); }
    finally { setSavingTpl(false); }
  };

  const exportPDF = () => {
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        const doc = new jsPDF();
        const now = new Date().toLocaleDateString('en-PK');

        doc.setFillColor(15, 41, 66);
        doc.rect(0, 0, 210, 28, 'F');
        doc.setFillColor(13, 122, 107);
        doc.rect(0, 26, 210, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14); doc.setFont('helvetica', 'bold');
        doc.text('Operation Breakdown Sheet — SMV', 14, 13);
        doc.setFontSize(8); doc.setFont('helvetica', 'normal');
        doc.text(profile?.company_name || '', 140, 10);
        doc.text(now, 140, 16);

        doc.setFillColor(228, 244, 241);
        doc.rect(14, 33, 182, 14, 'F');
        doc.setTextColor(15, 41, 66);
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.text('Article#: ' + (articleNumber || '—'), 18, 41);
        doc.text('Garment: ' + garmentType, 70, 41);
        doc.text('Total SMV: ' + r.totalSMV.toFixed(3) + ' min', 130, 41);
        doc.text('Ops: ' + ops.length, 180, 41);

        autoTable(doc, {
          startY: 52,
          head: [['Sr#', 'Operation Name', 'Process', 'Machine', 'Basic Time', 'Allow %', 'SMV']],
          body: activeOps.map((op, i) => [
            i + 1,
            op.name || 'Operation ' + (i + 1),
            PROCESS_LABEL[op.processType] || 'Sewing',
            op.machine || 'SNL',
            (parseFloat(op.basicTime) || 0).toFixed(3),
            (parseFloat(op.allowancePct) || 0) + '%',
            ((op.basicTime || 0) * (1 + (op.allowancePct || 0) / 100)).toFixed(3)
          ]),
          foot: [['', 'TOTAL', '', '', r.totalBasicTime.toFixed(3), '', r.totalSMV.toFixed(3)]],
          theme: 'striped',
          headStyles: { fillColor: [15, 41, 66], textColor: 255, fontSize: 8, fontStyle: 'bold' },
          footStyles: { fillColor: [13, 122, 107], textColor: 255, fontSize: 9, fontStyle: 'bold' },
          bodyStyles: { fontSize: 8 },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 52 },
            2: { cellWidth: 32 },
            3: { cellWidth: 32 },
            4: { cellWidth: 20, halign: 'right' },
            5: { cellWidth: 16, halign: 'center' },
            6: { cellWidth: 20, halign: 'right', fontStyle: 'bold' }
          },
          margin: { left: 14, right: 14 }
        });

        const finalY = doc.lastAutoTable.finalY + 8;
        doc.setFillColor(228, 244, 241);
        doc.rect(14, finalY, 182, 20, 'F');
        doc.setFontSize(9); doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 41, 66);
        doc.text('Basic time: ' + r.totalBasicTime.toFixed(3) + ' min', 18, finalY + 8);
        doc.text('Allowance: ' + r.totalAllowanceTime.toFixed(3) + ' min', 70, finalY + 8);
        doc.text('SMV: ' + r.totalSMV.toFixed(3) + ' min', 130, finalY + 8);
        doc.text('Daily output: ' + r.dailyOutputPerOperator + ' pcs', 18, finalY + 16);
        doc.text('Ops for 500 pcs: ' + r.operatorsFor500pcs, 70, finalY + 16);

        doc.setFontSize(7); doc.setTextColor(150);
        doc.text('TextileIE — ' + (profile?.company_name || '') + ' | SMV Operation Breakdown', 14, 290);
        doc.save('SMV-Art' + (articleNumber || garmentType) + '-' + Date.now() + '.pdf');
      });
    });
  };

  const exportExcel = () => {
    const rows = activeOps.map((op, i) => {
      const smv = ((op.basicTime || 0) * (1 + (op.allowancePct || 0) / 100)).toFixed(3);
      return `<tr class="${i % 2 === 0 ? 'even' : 'odd'}">
        <td style="text-align:center">${i + 1}</td>
        <td>${op.name || 'Operation ' + (i + 1)}</td>
        <td>${PROCESS_LABEL[op.processType] || 'Sewing'}</td>
        <td>${op.machine || 'SNL'}</td>
        <td style="text-align:right">${(parseFloat(op.basicTime) || 0).toFixed(3)}</td>
        <td style="text-align:center">${op.allowancePct}%</td>
        <td style="text-align:right;font-weight:bold;color:#0D7A6B">${smv}</td>
      </tr>`;
    }).join('');

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8"><style>
body{font-family:Arial;font-size:10pt}
.header{background:#0F2942;color:white;font-weight:bold;font-size:13pt;padding:8px}
.info{background:#E4F4F1;color:#0F2942;font-weight:bold;padding:6px}
.foot{background:#0D7A6B;color:white;font-weight:bold;padding:6px}
.col-header{background:#0F2942;color:white;font-weight:bold;padding:5px 8px}
.even{background:#F4F7FA}.odd{background:white}
td,th{padding:5px 8px;border:1px solid #D8E4EE}
</style></head><body><table>
<tr><td colspan="7" class="header">Operation Breakdown Sheet — TextileIE</td></tr>
<tr>
  <td colspan="2" class="info">Article#: ${articleNumber || '—'}</td>
  <td colspan="2" class="info">Garment: ${garmentType}</td>
  <td colspan="3" class="info">Total SMV: ${r.totalSMV.toFixed(3)} min</td>
</tr>
<tr>
  <th class="col-header">Sr#</th>
  <th class="col-header">Operation Name</th>
  <th class="col-header">Process</th>
  <th class="col-header">Machine</th>
  <th class="col-header">Basic Time (min)</th>
  <th class="col-header">Allowance %</th>
  <th class="col-header">SMV (min)</th>
</tr>
${rows}
<tr>
  <td colspan="4" class="foot" style="text-align:right">TOTAL</td>
  <td class="foot" style="text-align:right">${r.totalBasicTime.toFixed(3)}</td>
  <td class="foot"></td>
  <td class="foot" style="text-align:right">${r.totalSMV.toFixed(3)}</td>
</tr>
<tr><td colspan="7" style="color:#666;font-size:9pt;padding:6px">Daily output: ${r.dailyOutputPerOperator} pcs | Operators for 500 pcs: ${r.operatorsFor500pcs} | Generated: ${new Date().toLocaleString('en-PK')}</td></tr>
</table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SMV-Art' + (articleNumber || garmentType) + '-' + Date.now() + '.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Group ops by process for summary
  const processSummary = ops.reduce((acc, op) => {
    const group = op.processType || 'sewing';
    if (!acc[group]) acc[group] = { count: 0, smv: 0 };
    acc[group].count++;
    acc[group].smv += (op.basicTime || 0) * (1 + (op.allowancePct || 0) / 100);
    return acc;
  }, {});

  return (
    <div>
      <ToastContainer />
      <PageHeader title="SMV / SAM Calculator" subtitle="Operation breakdown — Cutting, Sewing, Embellishment, Finishing, QC" badge={{ text: 'IE Formula' }} />

      <ArticleSelector
        value={selectedStyle?.id}
        colorId={selectedColor?.id}
        label="Select from Style Master"
        onSelect={handleStyleSelect}
      />

      {/* Article info */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 20px', background: 'var(--navy)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Article Number</label>
            <input value={articleNumber} onChange={e => handleArticleChange(e.target.value)} placeholder="e.g. 5400"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 6, padding: '7px 10px', width: '100%', fontSize: 15, fontFamily: 'JetBrains Mono', fontWeight: 700 }} />
          </div>
          <div>
            <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Garment Type</label>
            <select value={garmentType} onChange={e => handleGarmentChange(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 6, padding: '7px 10px', width: '100%', fontSize: 13 }}>
              {GARMENTS.map(g => <option key={g} value={g} style={{ color: 'black' }}>{g}</option>)}
            </select>
          </div>
        </div>
        {/* SMV summary bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[['Basic Time', r.totalBasicTime.toFixed(3) + ' min'], ['Allowance', r.totalAllowanceTime.toFixed(3) + ' min'], ['SMV / SAM', r.totalSMV.toFixed(3) + ' min']].map(([l, v], i) => (
            <div key={l} style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: 8 }}>
              <div style={{ fontSize: i === 2 ? 18 : 14, fontWeight: 700, color: i === 2 ? '#4EECD8' : 'white', fontFamily: 'JetBrains Mono' }}>{v}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, padding: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: 13 }}>SMV view</strong>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {DEPARTMENTS.map(d => (
              <button key={d} className={smvView === d ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'} onClick={() => setSmvView(d)}>
                {d === 'combined' ? 'Combined all departments' : DEPARTMENT_LABEL[d]}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginTop: 12 }}>
          {Object.entries(smvSummary).map(([dept, data]) => (
            <div key={dept} style={{ padding: '8px 10px', borderRadius: 8, background: dept === smvView ? 'var(--teal-light)' : 'var(--bg)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{data.label}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--teal)' }}>{data.smv.toFixed(3)} min</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{data.count} ops</div>
            </div>
          ))}
        </div>
      </div>

      {/* Process legend */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {[['Lapping', '#FFF3E0', '#E65100'], ['Cutting', '#FCE4EC', '#C62828'], ['Bundling', '#F3E5F5', '#6A1B9A'], ['Sewing', '#F4F7FA', '#0F2942'], ['Embellishment', '#E8F5E9', '#1B5E20'], ['Finishing', '#E3F2FD', '#0D47A1'], ['QC', '#FFF8E1', '#F57F17']].map(([l, bg, c]) => (
          <div key={l} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: bg, color: c, fontWeight: 500 }}>{l}</div>
        ))}
      </div>

      {/* Operations */}
      <div className="card" style={{ padding: '16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3>{activeOps.length} operations {smvView !== 'combined' ? '— ' + (DEPARTMENT_LABEL[smvView] || smvView) : ''}</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setOps([...ops, newOp()])}><Plus size={13} /> Add operation</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {activeOps.map((op, idx) => {
            const smv = ((op.basicTime || 0) * (1 + (op.allowancePct || 0) / 100)).toFixed(3);
            const machines = MACHINES_BY_PROCESS[op.processType] || ['Manual'];
            const bg = PROCESS_BG[op.processType] || 'transparent';

            return (
              <div key={op.id} style={{ padding: '12px', borderRadius: 10, background: bg || 'var(--bg)', border: '1px solid var(--border-light)' }}>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 26, height: 26, background: 'var(--navy)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{idx + 1}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Operation {idx + 1}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 17, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--teal)' }}>{smv} min</span>
                    <button onClick={() => setOps(ops.filter(o => o.id !== op.id))} style={{ background: 'var(--red-light)', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: '4px 8px', borderRadius: 6 }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Operation name */}
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Operation name</label>
                  <input value={op.name} onChange={e => setOp(op.id, 'name', e.target.value)} placeholder="e.g. Shoulder join, Cut front panel..." />
                </div>

                {/* Process type */}
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Process type</label>
                  <select value={op.processType || 'sewing'} onChange={e => setOp(op.id, 'processType', e.target.value)}>
                    {PROCESS_TYPES.map(g => (
                      <optgroup key={g.group} label={g.group}>
                        {g.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {/* Machine */}
                <div className="field" style={{ marginBottom: 10 }}>
                  <label>Machine</label>
                  <select value={op.machine} onChange={e => setOp(op.id, 'machine', e.target.value)}>
                    {machines.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>

                {/* Basic time + allowance + result */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Basic time (min)</label>
                    <input type="number" step="0.01" value={op.basicTime} onChange={e => setOp(op.id, 'basicTime', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Allowance %</label>
                    <input type="number" step="1" value={op.allowancePct} onChange={e => setOp(op.id, 'allowancePct', parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>SMV (min)</label>
                    <div style={{ padding: '7px 10px', background: 'white', border: '1px solid var(--border)', borderRadius: 6, fontSize: 14, fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--teal)', textAlign: 'center' }}>{smv}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Process summary */}
      {Object.keys(processSummary).length > 1 && (
        <div className="card" style={{ marginBottom: 16, padding: 16 }}>
          <h3 style={{ marginBottom: 12 }}>Process breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(processSummary).map(([proc, data]) => {
              const pct = r.totalSMV > 0 ? (data.smv / r.totalSMV * 100).toFixed(1) : 0;
              return (
                <div key={proc}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{PROCESS_LABEL[proc] || proc} ({data.count} ops)</span>
                    <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--teal)', fontWeight: 600 }}>{data.smv.toFixed(3)} min ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--border-light)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: pct + '%', background: 'var(--teal)', borderRadius: 4 }} />
                  </div>
                </div>
              );
          
      {/* Output estimates + actions */}
      <div className="card" style={{ marginBottom: 16, padding: 16 }}>
        <h3 style={{ marginBottom: 14 }}>Output estimates</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[['Daily output / operator', r.dailyOutputPerOperator + ' pcs', '480 min @ 80% eff'], ['Operators for 500 pcs/day', r.operatorsFor500pcs + ' operators', '@ 80% efficiency']].map(s => (
            <div key={s[0]} style={{ padding: '10px 12px', background: 'var(--teal-light)', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--teal)', fontFamily: 'JetBrains Mono' }}>{s[1]}</div>
              <div style={{ fontSize: 12, color: 'var(--teal)', marginTop: 2 }}>{s[0]}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s[2]}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button className="btn btn-primary btn-full" onClick={save} disabled={saving}><Save size={14} />{saving ? 'Saving...' : 'Save report'}</button>
          <button className="btn btn-secondary btn-full" onClick={exportPDF}><Download size={14} /> Export PDF</button>
        </div>
        <button className="btn btn-sm btn-full" onClick={exportExcel} style={{ background: '#217346', color: 'white', border: 'none', marginTop: 8 }}><FileText size={13} /> Export Excel</button>
      </div>

      {/* Save template */}
        <div className="field">
          <label>Article number *</label>
          <input value={articleNumber} onChange={e => handleArticleChange(e.target.value)} placeholder="e.g. 5400" style={{ fontFamily: 'JetBrains Mono', fontWeight: 700 }} />
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Template name</label>
          <input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g. 5400 — T-Shirt" />
        </div>
        <div style={{ padding: '10px 14px', background: 'var(--teal-light)', borderRadius: 8, marginBottom: 12, fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Article</span>
            <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--teal)' }}>{articleNumber || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Garment</span>
            <span style={{ fontWeight: 500, color: 'var(--teal)' }}>{garmentType}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>SMV</span>
            <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--teal)' }}>{r.totalSMV.toFixed(3)} min</span>
          </div>
        </div>
        <button className="btn btn-primary btn-full" onClick={saveTemplate} disabled={savingTpl}>
          <Save size={13} />{savingTpl ? 'Saving...' : 'Save to article library'}
        </button>
      </div>
    </div>
  );
}


