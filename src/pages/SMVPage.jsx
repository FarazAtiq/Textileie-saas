import { useState } from 'react';
import { calcSMV, formatNum } from '../utils/calculations.js';
import { PageHeader } from '../components/ResultCard.jsx';
import { createReport, createSMVTemplate } from '../lib/db.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { exportReportPDF } from '../utils/pdfExport.js';
import { Plus, Trash2, Save, Download, BookOpen } from 'lucide-react';

const MACHINES = ['SNL','DNL','Overlock 3T','Overlock 4T','Overlock 5T','Flatseam','Bartack','Buttonhole','Button Attach','Kansai','Feed Off Arm','Manual'];
const GARMENTS = ['T-Shirt','Polo Shirt','Trousers','Jacket','Jeans','Shorts','Dress','Skirt','Formal Shirt','Hoodie','Sweatshirt','Pajama'];
const newOp = () => ({ id: Date.now(), name: '', machine: 'SNL', basicTime: 1.0, allowancePct: 15 });

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

  const exportPDF = () => exportReportPDF({
    type: 'smv',
    title: `SMV Breakdown — Art# ${articleNumber} ${garmentType}`,
    inputs: { articleNumber, garmentType, operations: ops.length },
    results: {
      basicTime: r.totalBasicTime + ' min',
      allowance: r.totalAllowanceTime + ' min',
      SMV: r.totalSMV + ' min',
      dailyOutput: r.dailyOutputPerOperator + ' pcs'
    },
    companyName: profile?.company_name,
    userName: profile?.full_name
  });

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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3>Operation breakdown</h3>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                {ops.length} operations · SMV = <strong style={{ color: 'var(--teal)' }}>{r.totalSMV.toFixed(3)} min</strong>
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
              <div key={op.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 90px 90px 70px 28px', gap: 8, marginBottom: 8, alignItems: 'center' }}>
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
