import { useState } from 'react';
import { createReport, upsertStyleCostModule } from '../lib/db.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { PageHeader } from '../components/ResultCard.jsx';
import { Plus, Trash2, Save, Download, FileText } from 'lucide-react';
import { ArticleSelector } from '../components/ArticleSelector.jsx';

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
  const [buyer,     setBuyer]     = useState('Nike');
  const [articleNo, setArticleNo] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [wastePct,  setWastePct]  = useState(10);
  const [threadType, setThreadType] = useState('Polyester 120T');
  const [threadPricePerMeter, setThreadPricePerMeter] = useState(0.0015);
  const [ops,       setOps]       = useState(DEFAULT_OPS);
  const [saving,    setSaving]    = useState(false);

  const { profile } = useAuth();
  const { toast, ToastContainer } = useToast();

  const handleStyleSelect = ({ style: st, color }) => {
    setSelectedStyle(st || null);
    setSelectedColor(color || null);
    if (st?.article_number) setArticleNo(st.article_number);
    if (st?.style_name) setStyle(st.style_name);
    else if (st?.garment_type) setStyle(st.garment_type);
    if (st?.buyer) setBuyer(st.buyer);
  };

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
  const threadCost       = +(totalMeters * (parseFloat(threadPricePerMeter) || 0)).toFixed(4);

  // ── save ───────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await createReport({
        type:    'thread',
        title:   'Thread Consumption — ' + (articleNo ? 'Art#' + articleNo + ' ' : '') + style + ' — ' + new Date().toLocaleDateString(),
        inputs:  { style_id: selectedStyle?.id || null, color_id: selectedColor?.id || null, colorName: selectedColor?.color_name || '', style, buyer, articleNo, wastePct, threadType, threadPricePerMeter, totalOperations: ops.length },
        results: {
          totalConsumptionCm: totalConsumption.toFixed(1),
          totalEstimatedCm:   totalEstimated.toFixed(1),
          totalMeters,
          wastePct,
          threadType,
          threadPricePerMeter,
          threadCost,
        },
      });
      if (selectedStyle?.id) {
        await upsertStyleCostModule({
          style_id: selectedStyle.id,
          color_id: selectedColor?.id || null,
          module_type: 'thread',
          data: { ops, wastePct, threadType, threadPricePerMeter },
          summary: { articleNo, style, buyer, threadType, totalMeters, threadPricePerMeter, threadCost }
        });
      }
      if (articleNo) {
        const key = 'textileie_thread_cost_by_article';
        const existing = JSON.parse(localStorage.getItem(key) || '{}');
        existing[articleNo] = { articleNo, threadType, totalMeters, threadPricePerMeter, threadCost, savedAt: new Date().toISOString() };
        localStorage.setItem(key, JSON.stringify(existing));
      }
      toast('Thread report saved and linked to Style Master / Costing');
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
      doc.text('Thread: ' + threadType, 18, 41);
      doc.text('Cost: $' + threadCost, 80, 41);
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
        'Total thread: ' + totalEstimated.toFixed(1) + ' cm = ' + totalMeters + ' m   |   Cost: $' + threadCost,
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
    <td style="background:#E4F4F1;color:#0D7A6B;font-weight:bold;font-size:12pt;padding:6px;border:1px solid #D8E4EE">Total: ${totalMeters} m | Thread: ${threadType} | Cost: $${threadCost}</td>
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
              placeholder="5400"
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

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}>Thread price link to costing</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div className="field"><label>Thread type</label><input value={threadType} onChange={e => setThreadType(e.target.value)} placeholder="e.g. Polyester 120T" /></div>
          <div className="field"><label>Price / meter ($)</label><input type="number" step="0.0001" value={threadPricePerMeter} onChange={e => setThreadPricePerMeter(parseFloat(e.target.value) || 0)} /></div>
          <div className="field"><label>Thread cost / garment</label><div style={{ padding: '9px 10px', background: 'var(--teal-light)', borderRadius: 8, fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--teal)' }}>${threadCost}</div></div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>When saved with Article #, this cost is stored article-wise and auto-loads in Costing page.</p>
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
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--navy)' }}>TOTAL THREAD CONSUMPTION (in cm)</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Net: {totalConsumption.toFixed(1)}</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--navy)' }}>{totalEstimated.toFixed(1)} cm</div>
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
