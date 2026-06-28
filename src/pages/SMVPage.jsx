import { useState } from 'react';
import { calcSMV, formatNum } from '../utils/calculations.js';
import { PageHeader } from '../components/ResultCard.jsx';
import { createReport, createSMVTemplate } from '../lib/db.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { exportReportPDF } from '../utils/pdfExport.js';
import { Plus, Trash2, Save, Download, BookOpen } from 'lucide-react';

const MACHINES = ['SNL','DNL','Overlock 3T','Overlock 4T','Overlock 5T','Flatseam','Bartack','Buttonhole','Button Attach','Kansai','Feed Off Arm','Manual',// Lapping
'Spreading Machine','Manual Spreading','Auto Spreader',
// Cutting
'Straight Knife','Band Knife','Round Knife','Die Cutter','Laser Cutter','Notcher','Drill Machine',
// Bundling
'Manual Bundling','Ticket Machine','Sticker Machine',];
const GARMENTS = ['T-Shirt','Polo Shirt','Trousers','Jacket','Jeans','Shorts','Dress','Skirt','Formal Shirt','Hoodie','Sweatshirt','Pajama', 'sports wear', 'denim jacket'];
const newOp = () => ({ id: Date.now(), name: '', machine: 'SNL', basicTime: 1.0, allowancePct: 15, processType: 'sewing' });
export default function SMVPage() {
  const [ops, setOps] = useState([
    { id: 1, name: 'Attach collar',  machine: 'DNL',         basicTime: 1.2, allowancePct: 15 },
    { id: 2, name: 'Sew side seam', machine: 'Overlock 5T', basicTime: 0.9, allowancePct: 15 },
    { id: 3, name: 'Attach sleeve', machine: 'SNL',         basicTime: 1.5, allowancePct: 15 },
    { id: 4, name: 'Bottom hem',    machine: 'SNL',         basicTime: 0.7, allowancePct: 12 },
  ]);
  const [garmentType, setGarmentType] = useState('T-Shirt');
  const [articleNumber, setArticleNumber] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingTpl, setSavingTpl] = useState(false);
  const { profile } = useAuth();
  const { toast, ToastContainer } = useToast();

  const setOp = (id, k, v) => setOps(ops.map(o => o.id === id ? { ...o, [k]: v } : o));
  const r = calcSMV(ops);

  // Auto fill template name when article number or garment type changes
  const handleArticleChange = (val) => {
    setArticleNumber(val);
    if (val && garmentType) setTemplateName(`${val} — ${garmentType}`);
  };

  const handleGarmentChange = (val) => {
    setGarmentType(val);
    if (articleNumber && val) setTemplateName(`${articleNumber} — ${val}`);
  };

  const save = async () => {
    setSaving(true);
    try {
      await createReport({
        type: 'smv',
        title: `SMV — ${articleNumber ? articleNumber + ' · ' : ''}${garmentType} — ${new Date().toLocaleDateString()}`,
        inputs: { articleNumber, garmentType, totalOperations: ops.length },
        results: {
          totalSMV: r.totalSMV,
          basicTime: r.totalBasicTime,
          dailyOutput: r.dailyOutputPerOperator,
          opsFor500: r.operatorsFor500pcs
        }
      });
      toast('SMV report saved');
    } catch (err) {
      toast('Failed to save: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      toast('Enter a template name', 'error'); return;
    }
    if (!articleNumber.trim()) {
      toast('Enter an article number', 'error'); return;
    }
    setSavingTpl(true);
    try {
      await createSMVTemplate({
        name: templateName,
        garment_type: garmentType,
        article_number: articleNumber,
        operations: ops,
        total_smv: r.totalSMV
      });
      toast(`Article ${articleNumber} saved to library`);
      setTemplateName('');
      setArticleNumber('');
    } catch (err) {
      toast('Failed to save: ' + err.message, 'error');
    } finally { setSavingTpl(false); }
  };
const exportPDF = () => {
  import('jspdf').then(({ default: jsPDF }) => {
    import('jspdf-autotable').then(({ default: autoTable }) => {
      const doc = new jsPDF();
      const now = new Date().toLocaleDateString('en-PK');

      // Header
      doc.setFillColor(15, 41, 66);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setFillColor(13, 122, 107);
      doc.rect(0, 26, 210, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('TextileIE', 14, 13);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text('Operation Breakdown Sheet', 14, 21);
      doc.text(profile?.company_name || '', 140, 13);
      doc.text(now, 140, 21);

      // Article info box
      doc.setFillColor(240, 248, 255);
      doc.rect(14, 33, 182, 22, 'F');
      doc.setTextColor(15, 41, 66);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text('Article: ' + (articleNumber || '—'), 18, 42);
      doc.text('Garment: ' + garmentType, 80, 42);
      doc.text('Total SMV: ' + r.totalSMV.toFixed(3) + ' min', 150, 42);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 100, 120);
      doc.text('Daily output / operator: ' + r.dailyOutputPerOperator + ' pcs  |  Operators for 500 pcs: ' + r.operatorsFor500pcs, 18, 50);

      // Operations table
      autoTable(doc, {
        startY: 60,
        head: {['Operation', 'Process', 'Machine', 'Basic (min)', 'Allow %', 'SMV', ''].map((h, i) => (
        body: ops.map((op, i) => {
  const processLabels = {
    sewing: 'Sewing', lapping: 'Lapping', cutting: 'Cutting',
    bundling: 'Bundling', embroidery: 'Embroidery', printing: 'Printing',
    heat_transfer: 'Heat Transfer', applique: 'Applique', rhinestone: 'Rhinestone',
    pressing: 'Pressing', folding: 'Folding', packing: 'Packing',
    tagging: 'Tagging', inline_qc: 'Inline QC', final_qc: 'Final QC',
    measurement: 'Measurement'
  };
  return [
    i + 1,
    op.name || 'Operation ' + (i+1),
    processLabels[op.processType] || 'Sewing',
    op.machine || 'SNL',
          (parseFloat(op.basicTime) || 0).toFixed(3),
          (parseFloat(op.allowancePct) || 0) + '%',
          ((op.basicTime || 0) * (1 + (op.allowancePct || 0) / 100)).toFixed(3)
        ]),
        foot: [['', 'TOTAL', '', r.totalBasicTime.toFixed(3), '', r.totalSMV.toFixed(3)]],
        theme: 'striped',
        headStyles: { fillColor: [15, 41, 66], textColor: 255, fontSize: 9, fontStyle: 'bold' },
        footStyles: { fillColor: [13, 122, 107], textColor: 255, fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
         0: { cellWidth: 10, halign: 'center' },
         1: { cellWidth: 60 },
         2: { cellWidth: 22 },
         3: { cellWidth: 25 },
         4: { cellWidth: 22, halign: 'right' },
         5: { cellWidth: 18, halign: 'center' },
         6: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 14, right: 14 }
      });

      // Summary box at bottom
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFillColor(228, 244, 241);
      doc.rect(14, finalY, 182, 24, 'F');
      doc.setFontSize(10); doc.setFont('helvetica', 'bold');
      doc.setTextColor(13, 122, 107);
      doc.text('Summary', 18, finalY + 8);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 41, 66);
      doc.text('Total operations: ' + ops.length, 18, finalY + 16);
      doc.text('Basic time: ' + r.totalBasicTime.toFixed(3) + ' min', 70, finalY + 16);
      doc.text('Allowance: ' + r.totalAllowanceTime.toFixed(3) + ' min', 120, finalY + 16);
      doc.text('SMV: ' + r.totalSMV.toFixed(3) + ' min', 165, finalY + 16);

      // Footer
      doc.setFontSize(8); doc.setTextColor(150);
      doc.text('TextileIE — ' + (profile?.company_name || '') + ' | Generated by ' + (profile?.full_name || ''), 14, 290);

      doc.save('SMV-Art' + (articleNumber || '') + '-' + garmentType + '.pdf');
    });
  });
};

  return (
    <div>
      <ToastContainer />
      <PageHeader
        title="SMV / SAM Calculator"
        subtitle="Build operation breakdown by article number and garment type"
        badge={{ text: 'IE Formula' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>

        {/* Operations table */}
        <div className="card">

          {/* Article + Garment header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, padding: '14px 16px', background: 'var(--navy)', borderRadius: 10 }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Article Number
              </label>
              <input
                value={articleNumber}
                onChange={e => handleArticleChange(e.target.value)}
                placeholder="e.g. 4233"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 6, padding: '7px 10px', width: '100%', fontSize: 14, fontWeight: 600, fontFamily: 'JetBrains Mono' }}
              />
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Garment Type
              </label>
              <select
                value={garmentType}
                onChange={e => handleGarmentChange(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: 6, padding: '7px 10px', width: '100%', fontSize: 13 }}
              >
                {GARMENTS.map(g => <option key={g} value={g} style={{ color: 'black' }}>{g}</option>)}
              </select>
            </div>
          </div>
          <select
  value={op.processType || 'sewing'}
  onChange={e => setOp(op.id, 'processType', e.target.value)}
  style={{ fontSize: 11 }}
>
  <optgroup label="── Sewing ──">
    <option value="sewing">🧵 Sewing</option>
  </optgroup>
  <optgroup label="── Cutting Room ──">
    <option value="lapping">📐 Lapping</option>
    <option value="cutting">✂️ Cutting</option>
    <option value="bundling">📦 Bundling</option>
  </optgroup>
  <optgroup label="── Embellishment ──">
    <option value="embroidery">🌸 Embroidery</option>
    <option value="printing">🖨️ Printing</option>
    <option value="heat_transfer">🔥 Heat Transfer</option>
    <option value="applique">🎨 Applique</option>
    <option value="rhinestone">💎 Rhinestone</option>
    <option value="smocking">🧶 Smocking</option>
  </optgroup>
  <optgroup label="── Finishing ──">
    <option value="pressing">👕 Pressing / Iron</option>
    <option value="folding">📋 Folding</option>
    <option value="packing">📦 Packing</option>
    <option value="tagging">🏷️ Tagging</option>
  </optgroup>
  <optgroup label="── Quality ──">
    <option value="inline_qc">🔍 Inline QC</option>
    <option value="final_qc">✅ Final QC</option>
    <option value="measurement">📏 Measurement Check</option>
  </optgroup>
</select>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }
           <div>
            <h3>Operation breakdown</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
             Sewing · Cutting · Embellishment · {ops.length} operations · SMV = <strong style={{ color: 'var(--teal)' }}>{r.totalSMV.toFixed(3)} min</strong>
            </p>
           </div>
            <button className="btn btn-primary btn-sm" onClick={() => setOps([...ops, newOp()])}>
              <Plus size={13} /> Add operation
            </button>
          </div>

          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 90px 90px 70px 28px', gap: 8, padding: '4px 0 8px', borderBottom: '1px solid var(--border)' }}>
            {['Operation', 'Machine', 'Basic (min)', 'Allow %', 'SMV', ''].map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
            ))}
          </div>

          <div style={{ marginTop: 8 }}>
            {ops.map((op, idx) => (
              <div key={op.id} style={{
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1.2fr 80px 80px 65px 28px',
  gap: 8, marginBottom: 8, alignItems: 'center',
  padding: '6px 8px', borderRadius: 8,
  background: op.processType === 'lapping' ? '#FFF3E0' :
              op.processType === 'cutting' ? '#FCE4EC' :
              op.processType === 'bundling' ? '#F3E5F5' :
              ['embroidery','printing','heat_transfer','applique','rhinestone','smocking'].includes(op.processType) ? '#E8F5E9' :
              ['pressing','folding','packing','tagging'].includes(op.processType) ? '#E3F2FD' :
              ['inline_qc','final_qc','measurement'].includes(op.processType) ? '#FFF8E1' :
              'transparent',
  border: '1px solid var(--border-light)'
}}>
                <input value={op.name} onChange={e => setOp(op.id, 'name', e.target.value)} placeholder={`Operation ${idx + 1}`} />
                <select value={op.machine} onChange={e => setOp(op.id, 'machine', e.target.value)}>
                  {MACHINES.map(m => <option key={m}>{m}</option>)}
                </select>
                <input type="number" step="0.01" value={op.basicTime} onChange={e => setOp(op.id, 'basicTime', parseFloat(e.target.value) || 0)} />
                <input type="number" step="1" value={op.allowancePct} onChange={e => setOp(op.id, 'allowancePct', parseFloat(e.target.value) || 0)} />
                <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: 'var(--teal)', paddingLeft: 4 }}>
                  {((op.basicTime || 0) * (1 + (op.allowancePct || 0) / 100)).toFixed(3)}
                </span>
                <button onClick={() => setOps(ops.filter(o => o.id !== op.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--bg)', borderRadius: 10, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              ['Basic time', r.totalBasicTime.toFixed(3) + ' min', false],
              ['Allowance', r.totalAllowanceTime.toFixed(3) + ' min', false],
              ['SMV / SAM', r.totalSMV.toFixed(3) + ' min', true]
            ].map(([l, v, bold]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: bold ? 18 : 15, fontWeight: bold ? 600 : 400, color: bold ? 'var(--teal)' : 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>{v}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Output estimates */}
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>Output estimates</h3>
            {[
              { l: 'Daily output / operator', v: r.dailyOutputPerOperator + ' pcs', sub: '480 min @ 80% eff' },
              { l: 'Operators for 500 pcs',   v: r.operatorsFor500pcs + ' ops',     sub: '@ 80% efficiency' },
            ].map(s => (
              <div key={s.l} style={{ marginBottom: 10, padding: '10px 12px', background: 'var(--teal-light)', borderRadius: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--teal)', fontFamily: 'JetBrains Mono' }}>{s.v}</div>
                <div style={{ fontSize: 12, color: 'var(--teal)', marginTop: 2 }}>{s.l}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>
                <Save size={13} />{saving ? 'Saving...' : 'Save report'}
              </button>
              <button className="btn btn-secondary" onClick={exportPDF}>
                <Download size={13} />
              </button>
            </div>
          </div>

          {/* Save template */}
          <div className="card">
            <h3 style={{ marginBottom: 4 }}><BookOpen size={13} style={{ verticalAlign: -2 }} /> Save to article library</h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
              Save this SMV so it can be selected on Efficiency, Capacity and other calculators
            </p>

            <div className="field">
              <label>Article number <span style={{ color: 'var(--red)' }}>*</span></label>
              <input
                value={articleNumber}
                onChange={e => handleArticleChange(e.target.value)}
                placeholder="e.g. 4233"
                style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}
              />
            </div>

            <div className="field">
              <label>Template name</label>
              <input
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="e.g. 4233 — T-Shirt"
              />
            </div>

            <div style={{ padding: '8px 12px', background: 'var(--teal-light)', borderRadius: 8, marginBottom: 12, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Article</span>
                <span style={{ fontWeight: 600, fontFamily: 'JetBrains Mono', color: 'var(--teal)' }}>{articleNumber || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Garment</span>
                <span style={{ fontWeight: 500, color: 'var(--teal)' }}>{garmentType}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>SMV</span>
                <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--teal)' }}>{r.totalSMV.toFixed(3)} min</span>
              </div>
            </div>

            <button className="btn btn-primary btn-full" onClick={saveTemplate} disabled={savingTpl}>
              <Save size={13} />{savingTpl ? 'Saving...' : 'Save to article library'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
