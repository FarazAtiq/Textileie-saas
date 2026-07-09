import { useState } from 'react';
import { createReport, upsertStyleCostModule } from '../lib/db.js';
import { ArticleSelector } from '../components/ArticleSelector.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { PageHeader } from '../components/ResultCard.jsx';
import { Plus, Trash2, Save, Download, FileText } from 'lucide-react';

const STITCH_OPTIONS = [
  { code: '301', name: 'Lock Stitch', ratio: 2.5 },
  { code: '101', name: 'Chain Stitch 1T', ratio: 4.0 },
  { code: '401', name: 'Chain Stitch 2T', ratio: 5.5 },
  { code: '503', name: 'Overlock 2T', ratio: 12.0 },
  { code: '504', name: 'Overlock 3T', ratio: 14.0 },
  { code: '512', name: 'Safety Stitch 4T', ratio: 18.0 },
  { code: '516', name: 'Safety Stitch 5T', ratio: 20.0 },
  { code: '406', name: 'Coverstitch 3T', ratio: 18.0 },
  { code: '602', name: 'Coverstitch 4T', ratio: 25.0 },
  { code: '605', name: 'Flatseam 5T', ratio: 28.0 },
];

const DEFAULT_OPS = [
  {
    id: 1,
    operationName: 'Shoulder join',
    seamLength: 28,
    stitchCode: '504',
    needleThreadType: 'Polyester 120T',
    needleRatio: 4,
    needleRatePerMeter: 0.0015,
    looperThreadType: 'Polyester 150D',
    looperRatio: 10,
    looperRatePerMeter: 0.0012,
  },
  {
    id: 2,
    operationName: 'Side seam',
    seamLength: 128,
    stitchCode: '504',
    needleThreadType: 'Polyester 120T',
    needleRatio: 4,
    needleRatePerMeter: 0.0015,
    looperThreadType: 'Polyester 150D',
    looperRatio: 10,
    looperRatePerMeter: 0.0012,
  },
];
function getRatio(code) {
  return STITCH_OPTIONS.find(s => s.code === code)?.ratio || 2.5;
}

function getStitchName(code) {
  const s = STITCH_OPTIONS.find(x => x.code === code);
  return s ? `${s.code} — ${s.name}` : code;
}

function calcOp(op, wastePct) {
  const seamLength = parseFloat(op.seamLength) || 0;
  const wasteFactor = 1 + ((parseFloat(wastePct) || 0) / 100);

  const needleRatio = parseFloat(op.needleRatio) || 0;
  const looperRatio = parseFloat(op.looperRatio) || 0;

  const needleMeters = (seamLength * needleRatio * wasteFactor) / 100;
  const looperMeters = (seamLength * looperRatio * wasteFactor) / 100;

  const needleCost = needleMeters * (parseFloat(op.needleRatePerMeter) || 0);
  const looperCost = looperMeters * (parseFloat(op.looperRatePerMeter) || 0);

  return {
    needleMeters: +needleMeters.toFixed(4),
    looperMeters: +looperMeters.toFixed(4),
    totalMeters: +(needleMeters + looperMeters).toFixed(4),
    needleCost: +needleCost.toFixed(4),
    looperCost: +looperCost.toFixed(4),
    totalCost: +(needleCost + looperCost).toFixed(4),
  };
}
export default function ThreadPage() {
  const { profile } = useAuth();
  const { toast, ToastContainer } = useToast();

  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  const [articleNo, setArticleNo] = useState('');
  const [style, setStyle] = useState('');
  const [buyer, setBuyer] = useState('');
  const [colorName, setColorName] = useState('');

  const [wastePct, setWastePct] = useState(10);
  const [threadType, setThreadType] = useState('Polyester 120T');
  const [threadPricePerMeter, setThreadPricePerMeter] = useState(0.0015);
  const [ops, setOps] = useState(DEFAULT_OPS);
  const [saving, setSaving] = useState(false);

  const setOp = (id, key, val) => {
    setOps(prev => prev.map(o => o.id === id ? { ...o, [key]: val } : o));
  };

  const addOp = () => {
    setOps(prev => [
      ...prev,{
  id: Date.now(),
  operationName: '',
  seamLength: 30,
  stitchCode: '504',
  needleThreadType: 'Polyester 120T',
  needleRatio: 4,
  needleRatePerMeter: 0.0015,
  looperThreadType: 'Polyester 150D',
  looperRatio: 10,
  looperRatePerMeter: 0.0012,
}
    ]);
  };

  const removeOp = (id) => {
    setOps(prev => prev.filter(o => o.id !== id));
  };

const totalNeedleMeters = ops.reduce((s, op) => s + calcOp(op, wastePct).needleMeters, 0);
const totalLooperMeters = ops.reduce((s, op) => s + calcOp(op, wastePct).looperMeters, 0);
const totalMeters = +(totalNeedleMeters + totalLooperMeters).toFixed(4);
const threadCost = +ops.reduce((s, op) => s + calcOp(op, wastePct).totalCost, 0).toFixed(4);
const totalNeedleCost = +ops.reduce((s, op) => s + calcOp(op, wastePct).needleCost, 0).toFixed(4);
const totalLooperCost = +ops.reduce((s, op) => s + calcOp(op, wastePct).looperCost, 0).toFixed(4);
const totalConsumption = totalMeters * 100;
const totalEstimated = totalMeters * 100;
  const handleStyleSelect = ({ style, color }) => {
    setSelectedStyle(style);
    setSelectedColor(color || null);

    setArticleNo(style?.article_number || '');
    setStyle(style?.style_name || style?.garment_type || '');
    setBuyer(style?.buyer || '');
    setColorName(color?.color_name || '');
  };

  const handleSave = async () => {
    if (!selectedStyle?.id) {
      toast('Please select a style first', 'error');
      return;
    }

    setSaving(true);

    try {
      await createReport({
        type: 'thread',
        title:
          'Thread Consumption — Art#' +
          articleNo +
          (colorName ? ' · ' + colorName : '') +
          ' — ' +
          new Date().toLocaleDateString(),
        inputs: {
          style_id: selectedStyle.id,
          color_id: selectedColor?.id || null,
          articleNo,
          style,
          buyer,
          colorName,
          wastePct,
          threadType,
          threadPricePerMeter,
          totalOperations: ops.length,
        },
        results: {
          operations: ops,
          totalConsumptionCm: totalConsumption.toFixed(1),
          totalEstimatedCm: totalEstimated.toFixed(1),
          totalMeters,
          threadType,
          threadPricePerMeter,
          threadCost,
        },
      });

      await upsertStyleCostModule({
        style_id: selectedStyle.id,
        color_id: selectedColor?.id || null,
        module_type: 'thread',
        data: {
          articleNo,
          style,
          buyer,
          colorName,
          wastePct,
          threadType,
          threadPricePerMeter,
          operations: ops,
        },
        summary: {
          totalMeters,
          threadCost,
          threadType,
          threadPricePerMeter,
        },
      });

      toast('Thread saved and linked to Costing');
    } catch (err) {
      toast('Failed: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF('landscape');
      const now = new Date().toLocaleDateString('en-PK');

      doc.setFillColor(15, 41, 66);
      doc.rect(0, 0, 297, 22, 'F');

      doc.setFillColor(13, 122, 107);
      doc.rect(0, 20, 297, 3, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Thread Consumption Report', 14, 13);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text((profile?.company_name || '') + ' | ' + now, 220, 13);

      doc.setFillColor(228, 244, 241);
      doc.rect(14, 28, 269, 18, 'F');

      doc.setTextColor(15, 41, 66);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');

      doc.text('Article#: ' + (articleNo || '—'), 18, 36);
      doc.text('Style: ' + (style || '—'), 75, 36);
      doc.text('Buyer: ' + (buyer || '—'), 135, 36);
      doc.text('Color: ' + (colorName || '—'), 195, 36);

      doc.text('Thread: ' + threadType, 18, 43);
      doc.text('Wastage: ' + wastePct + '%', 75, 43);
      doc.text('Total: ' + totalMeters + ' m', 135, 43);
      doc.text('Cost: $' + threadCost, 195, 43);

      autoTable(doc, {
        startY: 52,
        head: [['Seq', 'Operation Name', 'Seam Length (cm)', 'Stitch Type', 'Ratio', 'Net Thread (cm)', 'Est. Thread (cm)']],
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
        foot: [['', 'TOTAL', '', '', '', totalConsumption.toFixed(1), totalEstimated.toFixed(1)]],
        theme: 'striped',
        headStyles: { fillColor: [15, 41, 66], textColor: 255, fontSize: 8 },
        footStyles: { fillColor: [13, 122, 107], textColor: 255, fontSize: 9, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        margin: { left: 14, right: 14 },
      });

      doc.save('Thread-Art' + (articleNo || 'style') + '-' + Date.now() + '.pdf');
      toast('PDF downloaded');
    } catch (err) {
      toast('PDF failed: ' + err.message, 'error');
    }
  };

  const handleExportExcel = () => {
    const rows = ops.map((op, i) => {
      const c = calcOp(op, wastePct);
      return `
        <tr>
          <td>${i + 1}</td>
          <td>${op.operationName || 'Operation ' + (i + 1)}</td>
          <td>${op.seamLength}</td>
          <td>${getStitchName(op.stitchCode)}</td>
          <td>${c.ratio}</td>
          <td>${c.consumption}</td>
          <td>${c.estimated}</td>
        </tr>`;
    }).join('');

    const html = `
      <html>
      <head><meta charset="UTF-8"></head>
      <body>
      <table border="1">
        <tr><td colspan="7"><b>Thread Consumption Report — TextileIE</b></td></tr>
        <tr><td colspan="7">Article#: ${articleNo || '—'} | Style: ${style || '—'} | Buyer: ${buyer || '—'} | Color: ${colorName || '—'}</td></tr>
        <tr><td colspan="7">Thread: ${threadType} | Wastage: ${wastePct}% | Total: ${totalMeters} m | Cost: $${threadCost}</td></tr>
        <tr>
          <th>Seq</th>
          <th>Operation</th>
          <th>Seam Length</th>
          <th>Stitch Type</th>
          <th>Ratio</th>
          <th>Net cm</th>
          <th>Estimated cm</th>
        </tr>
        ${rows}
        <tr>
          <td colspan="5"><b>TOTAL</b></td>
          <td><b>${totalConsumption.toFixed(1)}</b></td>
          <td><b>${totalEstimated.toFixed(1)}</b></td>
        </tr>
      </table>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = 'Thread-Art' + (articleNo || 'style') + '-' + Date.now() + '.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    toast('Excel downloaded');
  };

  return (
    <div>
      <ToastContainer />

      <PageHeader
        title="Thread Consumption"
        subtitle="Style-linked operation-wise thread calculation for costing"
        badge={{ text: 'IE Formula' }}
      />

      <ArticleSelector
        value={selectedStyle?.id}
        colorId={selectedColor?.id}
        label="Select Style for Thread"
        onSelect={handleStyleSelect}
      />

      {selectedStyle && (
        <div className="card" style={{ padding: 16, marginBottom: 16, background: 'var(--navy)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>ARTICLE #</label>
              <div style={{ color: 'white', fontWeight: 700 }}>{articleNo || '—'}</div>
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>STYLE</label>
              <div style={{ color: 'white', fontWeight: 700 }}>{style || '—'}</div>
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>BUYER</label>
              <div style={{ color: 'white', fontWeight: 700 }}>{buyer || '—'}</div>
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10 }}>COLOR</label>
              <div style={{ color: 'white', fontWeight: 700 }}>{colorName || 'Common'}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 14 }}>Thread price link to Costing</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div className="field">
            <label>Thread type</label>
            <input
              value={threadType}
              onChange={e => setThreadType(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Price / meter ($)</label>
            <input
              type="number"
              step="0.0001"
              value={threadPricePerMeter}
              onChange={e => setThreadPricePerMeter(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="field">
            <label>Thread cost / garment</label>
            <div style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: 'var(--teal-light)',
              color: 'var(--teal)',
              fontWeight: 700,
              fontFamily: 'JetBrains Mono',
            }}>
              ${threadCost}
            </div>
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          When saved, this thread cost will auto-load into Costing for the selected style.
        </p>
      </div>

      <div style={{
        background: 'var(--teal)',
        color: 'white',
        padding: '16px 18px',
        borderRadius: 10,
        marginBottom: 16,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase' }}>
            Total Thread Consumption
          </div>
          <div style={{ fontSize: 13 }}>
            Net: {totalConsumption.toFixed(1)} cm | Est: {totalEstimated.toFixed(1)} cm
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'JetBrains Mono' }}>
            {totalMeters}
          </div>
          <div style={{ fontSize: 11 }}>meters</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {ops.map((op, i) => {
          const c = calcOp(op, wastePct);

          return (
            <div key={op.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3>Operation {i + 1}</h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ color: 'var(--teal)', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
                    {c.estimated} cm
                  </div>

                  {ops.length > 1 && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => removeOp(op.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div className="field">
                <label>Operation name</label>
                <input
                  value={op.operationName}
                  onChange={e => setOp(op.id, 'operationName', e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label>Seam length (cm)</label>
                  <input
                    type="number"
                    value={op.seamLength}
                    onChange={e => setOp(op.id, 'seamLength', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="field">
                  <label>Stitch type</label>
                  <select
                    value={op.stitchCode}
                    onChange={e => setOp(op.id, 'stitchCode', e.target.value)}
                  >
                    {STITCH_OPTIONS.map(s => (
                      <option key={s.code} value={s.code}>
                        {s.code} — {s.name} ({s.ratio}x)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Ratio</label>
                  <input value={c.ratio} readOnly />
                </div>

                <div className="field">
                  <label>Net thread (cm)</label>
                  <input value={c.consumption} readOnly />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={addOp}>
          <Plus size={14} /> Add operation
        </button>

        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving || !selectedStyle}
        >
          <Save size={14} />
          {saving ? 'Saving...' : 'Save & Link to Costing'}
        </button>

        <button className="btn btn-secondary" onClick={handleExportPDF}>
          <Download size={14} /> PDF
        </button>

        <button className="btn btn-secondary" onClick={handleExportExcel}>
          <FileText size={14} /> Excel
        </button>
      </div>
    </div>
  );
}
