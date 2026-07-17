import { useEffect, useMemo, useState } from 'react';
import { createReport, getStitches, getThreads, getStyleCostSummary, upsertStyleCostModule } from '../lib/db.js';
import { ArticleSelector } from '../components/ArticleSelector.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import {
  AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Info, LockKeyhole,
  PackageCheck, Plus, Save, Scissors, Trash2, WalletCards, ListChecks, ChevronDown, ChevronUp
} from 'lucide-react';


function cleanDisplayText(value) {
  return String(value || '')
    .replace(/鈥[^\s]*/g, '')
    .replace(/針|路|锟|�/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function threadOptionLabel(thread) {
  const code = cleanDisplayText(thread?.thread_code);
  const name = cleanDisplayText(thread?.thread_name);
  const use = cleanDisplayText(thread?.thread_use);
  return [code, name, use].filter(Boolean).join(' | ');
}

const makeOperation = () => ({
  id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  operationName: '',
  seamLengthCm: 0,
  stitchId: '',
  spi: 0,
  needleRatio: 0,
  looperRatio: 0,
  coverRatio: 0,
  needleThreadId: '',
  looperThreadId: '',
  coverThreadId: '',
});

function round(value, decimals = 4) {
  const factor = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

function threadRatePerMeter(thread) {
  if (!thread) return 0;
  const price = Number(thread.price || 0);
  const unit = String(thread.price_unit || 'Meter').toLowerCase();
  const coneLength = Number(thread.cone_length || 0);
  const coneWeight = Number(thread.cone_weight || 0);

  if (unit === 'meter') return price;
  if (unit === 'cone') return coneLength > 0 ? price / coneLength : 0;
  if (unit === 'kg') {
    if (coneLength > 0 && coneWeight > 0) return (price * coneWeight) / coneLength;
    return 0;
  }
  return 0;
}

function calculateOperation(op, wastePct, threadMap) {
  const seamMeters = Number(op.seamLengthCm || 0) / 100;
  const wasteFactor = 1 + Number(wastePct || 0) / 100;

  const needleMeters = seamMeters * Number(op.needleRatio || 0) * wasteFactor;
  const looperMeters = seamMeters * Number(op.looperRatio || 0) * wasteFactor;
  const coverMeters = seamMeters * Number(op.coverRatio || 0) * wasteFactor;

  const needleCost = needleMeters * threadRatePerMeter(threadMap.get(String(op.needleThreadId)));
  const looperCost = looperMeters * threadRatePerMeter(threadMap.get(String(op.looperThreadId)));
  const coverCost = coverMeters * threadRatePerMeter(threadMap.get(String(op.coverThreadId)));

  return {
    needleMeters: round(needleMeters),
    looperMeters: round(looperMeters),
    coverMeters: round(coverMeters),
    totalMeters: round(needleMeters + looperMeters + coverMeters),
    needleCost: round(needleCost),
    looperCost: round(looperCost),
    coverCost: round(coverCost),
    totalCost: round(needleCost + looperCost + coverCost),
  };
}

function SummaryCard({ icon: Icon, label, value, helper, tone = 'teal' }) {
  return (
    <div className={`thread-kpi thread-kpi-${tone}`}>
      <div className="thread-kpi-icon"><Icon size={18} /></div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </div>
  );
}

function LockedValue({ label, value, suffix }) {
  return (
    <div className="locked-field">
      <div className="locked-field-label"><LockKeyhole size={12} /> {label}</div>
      <div className="locked-field-value">{value || 0}{suffix || ''}</div>
      <small>Controlled by Stitch Master</small>
    </div>
  );
}

export default function ThreadPage() {
  const { profile } = useAuth();
  const { toast, ToastContainer } = useToast();

  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [threads, setThreads] = useState([]);
  const [stitches, setStitches] = useState([]);
  const [operations, setOperations] = useState([makeOperation()]);
  const [wastePct, setWastePct] = useState(10);
  const [saving, setSaving] = useState(false);
  const [loadingMasters, setLoadingMasters] = useState(true);
  const [loadingSavedEngineering, setLoadingSavedEngineering] = useState(false);
  const [engineeringView, setEngineeringView] = useState('breakdown');
  const [expandedSummaryRows, setExpandedSummaryRows] = useState({});

  useEffect(() => {
    let active = true;
    Promise.all([getThreads({ limit: 500 }), getStitches({ limit: 500 })])
      .then(([threadRows, stitchRows]) => {
        if (!active) return;
        setThreads(threadRows.filter(t => t.status === 'Active' || !t.status));
        setStitches(stitchRows.filter(s => s.status === 'Active' || !s.status));
      })
      .catch(err => toast(`Failed to load masters: ${err.message}`, 'error'))
      .finally(() => active && setLoadingMasters(false));
    return () => { active = false; };
  }, [toast]);

  const threadMap = useMemo(() => new Map(threads.map(t => [String(t.id), t])), [threads]);
  const stitchMap = useMemo(() => new Map(stitches.map(s => [String(s.id), s])), [stitches]);

  const calculated = useMemo(
    () => operations.map(op => ({ ...op, calculation: calculateOperation(op, wastePct, threadMap) })),
    [operations, wastePct, threadMap]
  );


  const threadSummary = useMemo(() => {
    const grouped = new Map();

    const addUsage = (operation, threadId, meters, cost, usagePosition) => {
      if (!threadId || Number(meters || 0) <= 0) return;

      const threadItem = threadMap.get(String(threadId));
      if (!threadItem) return;

      const key = String(threadItem.id);
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          thread_id: threadItem.id,
          thread_code: cleanDisplayText(threadItem.thread_code),
          thread_name: cleanDisplayText(threadItem.thread_name),
          ticket_no: cleanDisplayText(
            threadItem.ticket_no ||
            threadItem.ticket_number ||
            threadItem.ticket ||
            ''
          ),
          supplier: cleanDisplayText(threadItem.supplier),
          brand: cleanDisplayText(threadItem.brand),
          currency: threadItem.currency || 'USD',
          cone_length: Number(threadItem.cone_length || 0),
          consumption_per_garment: 0,
          total_cost: 0,
          used_in: [],
          operations: [],
        });
      }

      const row = grouped.get(key);
      row.consumption_per_garment += Number(meters || 0);
      row.total_cost += Number(cost || 0);

      if (!row.used_in.includes(usagePosition)) {
        row.used_in.push(usagePosition);
      }

      row.operations.push({
        operation_name: operation.operationName || 'Unnamed operation',
        usage_position: usagePosition,
        meters: Number(meters || 0),
        cost: Number(cost || 0),
      });
    };

    for (const operation of calculated) {
      addUsage(
        operation,
        operation.needleThreadId,
        operation.calculation.needleMeters,
        operation.calculation.needleCost,
        'Needle'
      );
      addUsage(
        operation,
        operation.looperThreadId,
        operation.calculation.looperMeters,
        operation.calculation.looperCost,
        'Looper'
      );
      addUsage(
        operation,
        operation.coverThreadId,
        operation.calculation.coverMeters,
        operation.calculation.coverCost,
        'Cover'
      );
    }

    return [...grouped.values()]
      .map(row => ({
        ...row,
        consumption_per_garment: round(row.consumption_per_garment, 4),
        total_cost: round(row.total_cost, 6),
        estimated_cones:
          row.cone_length > 0
            ? round(row.consumption_per_garment / row.cone_length, 6)
            : 0,
      }))
      .sort((a, b) =>
        String(a.thread_code).localeCompare(String(b.thread_code))
      );
  }, [calculated, threadMap]);

  const totals = useMemo(() => calculated.reduce((acc, op) => ({
    needleMeters: acc.needleMeters + op.calculation.needleMeters,
    looperMeters: acc.looperMeters + op.calculation.looperMeters,
    coverMeters: acc.coverMeters + op.calculation.coverMeters,
    totalMeters: acc.totalMeters + op.calculation.totalMeters,
    totalCost: acc.totalCost + op.calculation.totalCost,
  }), { needleMeters: 0, looperMeters: 0, coverMeters: 0, totalMeters: 0, totalCost: 0 }), [calculated]);

  const currency = useMemo(() => {
    const selected = operations
      .flatMap(op => [op.needleThreadId, op.looperThreadId, op.coverThreadId])
      .map(id => threadMap.get(String(id)))
      .find(Boolean);
    return selected?.currency || 'USD';
  }, [operations, threadMap]);

  const estimatedCones = useMemo(() => {
    const usageByThread = new Map();
    calculated.forEach(op => {
      [
        [op.needleThreadId, op.calculation.needleMeters],
        [op.looperThreadId, op.calculation.looperMeters],
        [op.coverThreadId, op.calculation.coverMeters],
      ].forEach(([id, meters]) => {
        if (!id || !meters) return;
        usageByThread.set(String(id), (usageByThread.get(String(id)) || 0) + meters);
      });
    });
    return Array.from(usageByThread.entries()).reduce((sum, [id, meters]) => {
      const coneLength = Number(threadMap.get(id)?.cone_length || 0);
      return sum + (coneLength > 0 ? meters / coneLength : 0);
    }, 0);
  }, [calculated, threadMap]);

  const setOperation = (id, key, value) => {
    setOperations(prev => prev.map(op => op.id === id ? { ...op, [key]: value } : op));
  };

  const applyStitch = (operationId, stitchId) => {
    const stitch = stitchMap.get(String(stitchId));
    setOperations(prev => prev.map(op => op.id !== operationId ? op : {
      ...op,
      stitchId,
      spi: Number(stitch?.default_spi || 0),
      needleRatio: Number(stitch?.needle_ratio || 0),
      looperRatio: Number(stitch?.looper_ratio || 0),
      coverRatio: Number(stitch?.cover_ratio || 0),
    }));
  };

  const addOperation = () => setOperations(prev => [...prev, makeOperation()]);
  const removeOperation = id => setOperations(prev => prev.length === 1 ? prev : prev.filter(op => op.id !== id));

  const handleStyleSelect = async ({ style, color }) => {
    setSelectedStyle(style || null);
    setSelectedColor(color || null);
    setEngineeringView('breakdown');

    if (!style?.id) {
      setOperations([makeOperation()]);
      return;
    }

    setLoadingSavedEngineering(true);
    try {
      const modules = await getStyleCostSummary({
        style_id: style.id,
        color_id: null,
      });

      const savedThread = modules?.thread;
      const savedData = savedThread?.data || {};
      const savedOperations = savedData.operations || [];

      if (Array.isArray(savedOperations) && savedOperations.length) {
        setOperations(savedOperations.map(operation => ({
          ...makeOperation(),
          id: operation.id || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
          operationName: operation.operationName || operation.operation_name || '',
          seamLengthCm: Number(operation.seamLengthCm || operation.seam_length_cm || 0),
          stitchId: String(operation.stitchId || operation.stitch_id || operation.stitch?.id || ''),
          spi: Number(operation.spi || operation.stitch?.spi || 0),
          needleRatio: Number(operation.needleRatio ?? operation.needle_ratio ?? operation.stitch?.needle_ratio ?? 0),
          looperRatio: Number(operation.looperRatio ?? operation.looper_ratio ?? operation.stitch?.looper_ratio ?? 0),
          coverRatio: Number(operation.coverRatio ?? operation.cover_ratio ?? operation.stitch?.cover_ratio ?? 0),
          needleThreadId: String(operation.needleThreadId || operation.needle_thread_id || operation.needleThread?.id || operation.needle_thread?.id || ''),
          looperThreadId: String(operation.looperThreadId || operation.looper_thread_id || operation.looperThread?.id || operation.looper_thread?.id || ''),
          coverThreadId: String(operation.coverThreadId || operation.cover_thread_id || operation.coverThread?.id || operation.cover_thread?.id || ''),
        })));
        setWastePct(Number(savedData.wastePct ?? savedThread?.summary?.wastePct ?? 10));
        toast(`${savedOperations.length} saved sewing operation(s) loaded`);
      } else {
        setOperations([makeOperation()]);
        setWastePct(10);
        toast('No saved Thread Engineering found for this style', 'info');
      }
    } catch (error) {
      setOperations([makeOperation()]);
      toast(`Could not load saved Thread Engineering: ${error.message}`, 'error');
    } finally {
      setLoadingSavedEngineering(false);
    }
  };

  const validate = () => {
    if (!selectedStyle?.id) return 'Select a style before saving.';
    if (!operations.length) return 'Add at least one operation.';
    const invalid = operations.find(op => !op.operationName.trim() || Number(op.seamLengthCm) <= 0 || !op.stitchId);
    if (invalid) return 'Each operation needs a name, seam length and stitch type.';
    return '';
  };

  const handleSave = async () => {
    const error = validate();
    if (error) return toast(error, 'error');

    setSaving(true);
    try {
      const articleNo = selectedStyle.article_number || '';
      const styleName = selectedStyle.style_name || selectedStyle.garment_type || '';
      const colorName = selectedColor?.color_name || '';
      const operationPayload = calculated.map(op => ({
        ...op,
        stitch: stitchMap.get(String(op.stitchId)) || null,
        needleThread: threadMap.get(String(op.needleThreadId)) || null,
        looperThread: threadMap.get(String(op.looperThreadId)) || null,
        coverThread: threadMap.get(String(op.coverThreadId)) || null,
      }));

      const summary = {
        totalMeters: round(totals.totalMeters),
        totalCost: round(totals.totalCost),
        needleMeters: round(totals.needleMeters),
        looperMeters: round(totals.looperMeters),
        coverMeters: round(totals.coverMeters),
        estimatedCones: round(estimatedCones, 3),
        currency,
        wastePct: Number(wastePct || 0),
        operationCount: operations.length,
        threadItems: threadSummary,
        threadItemCount: threadSummary.length,
      };

      await createReport({
        type: 'thread',
        title: `Thread Engineering - Art#${articleNo}${colorName ? ` | ${colorName}` : ''}`,
        inputs: {
          style_id: selectedStyle.id,
          color_id: selectedColor?.id || null,
          articleNo,
          styleName,
          buyer: selectedStyle.buyer || '',
          colorName,
          wastePct: Number(wastePct || 0),
        },
        results: { operations: operationPayload, summary },
      });

      await upsertStyleCostModule({
        style_id: selectedStyle.id,
        color_id: selectedColor?.id || null,
        module_type: 'thread',
        data: {
          operations: operationPayload,
          wastePct: Number(wastePct || 0),
          threadSummary,
        },
        summary,
      });

      toast('Thread Engineering saved and linked to Garment Costing');
    } catch (err) {
      toast(`Save failed: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const exportCsv = () => {
    const headers = ['Seq', 'Operation', 'Seam Length (cm)', 'Stitch', 'SPI', 'Needle Ratio', 'Looper Ratio', 'Cover Ratio', 'Needle m', 'Looper m', 'Cover m', 'Total m', 'Cost'];
    const rows = calculated.map((op, index) => {
      const stitch = stitchMap.get(String(op.stitchId));
      return [
        index + 1, op.operationName, op.seamLengthCm,
        stitch ? `${stitch.stitch_code} - ${stitch.stitch_name}` : '',
        op.spi, op.needleRatio, op.looperRatio, op.coverRatio,
        op.calculation.needleMeters, op.calculation.looperMeters,
        op.calculation.coverMeters, op.calculation.totalMeters, op.calculation.totalCost,
      ];
    });
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Thread-Engineering-${selectedStyle?.article_number || 'Style'}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast('Excel-compatible CSV downloaded');
  };

  const exportPdf = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF('landscape');
      doc.setFillColor(15, 41, 66);
      doc.rect(0, 0, 297, 24, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.text('TextileIE - Thread Engineering Report', 14, 15);
      doc.setFontSize(8);
      doc.text(`${profile?.company_name || ''} | ${new Date().toLocaleDateString('en-PK')}`, 215, 15);
      doc.setTextColor(15, 41, 66);
      doc.setFontSize(9);
      doc.text(`Article: ${selectedStyle?.article_number || '-'}   Style: ${selectedStyle?.style_name || selectedStyle?.garment_type || '-'}   Buyer: ${selectedStyle?.buyer || '-'}   Color: ${selectedColor?.color_name || 'Common'}`, 14, 33);
      doc.text(`Waste: ${wastePct}%   Total thread: ${round(totals.totalMeters, 2)} m   Cost: ${currency} ${round(totals.totalCost, 4)}`, 14, 40);
      autoTable(doc, {
        startY: 48,
        head: [['#', 'Operation', 'Seam cm', 'Stitch', 'SPI', 'N Ratio', 'L Ratio', 'C Ratio', 'Needle m', 'Looper m', 'Cover m', 'Total m', 'Cost']],
        body: calculated.map((op, index) => {
          const stitch = stitchMap.get(String(op.stitchId));
          return [index + 1, op.operationName, op.seamLengthCm, stitch?.stitch_code || '-', op.spi, op.needleRatio, op.looperRatio, op.coverRatio, op.calculation.needleMeters, op.calculation.looperMeters, op.calculation.coverMeters, op.calculation.totalMeters, `${currency} ${op.calculation.totalCost}`];
        }),
        theme: 'striped',
        headStyles: { fillColor: [15, 41, 66] },
        foot: [['', 'TOTAL', '', '', '', '', '', '', round(totals.needleMeters, 2), round(totals.looperMeters, 2), round(totals.coverMeters, 2), round(totals.totalMeters, 2), `${currency} ${round(totals.totalCost, 4)}`]],
        footStyles: { fillColor: [13, 122, 107], textColor: 255 },
      });
      doc.save(`Thread-Engineering-${selectedStyle?.article_number || 'Style'}.pdf`);
      toast('PDF downloaded');
    } catch (err) {
      toast(`PDF failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="thread-engineering-page">
      <ToastContainer />

      <div className="module-hero">
        <div>
          <div className="eyebrow">INDUSTRIAL ENGINEERING WORKSPACE</div>
          <h1>Thread Engineering</h1>
          <p>Calculate operation-wise sewing thread, cone requirement and garment cost using controlled Stitch Master ratios.</p>
        </div>
        <div className="module-hero-actions">
          <span className="status-pill status-pill-success"><CheckCircle2 size={13} /> Costing connected</span>
          <button className="btn btn-secondary" onClick={exportCsv}><FileSpreadsheet size={15} /> Excel</button>
          <button className="btn btn-secondary" onClick={exportPdf}><Download size={15} /> PDF</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || loadingMasters}>
            <Save size={15} /> {saving ? 'Saving...' : 'Save engineering'}
          </button>
        </div>
      </div>

      <div className="thread-context-grid">
        <ArticleSelector
          value={selectedStyle?.id}
          colorId={selectedColor?.id}
          label="Article / Style"
          onSelect={handleStyleSelect}
        />
        <div className="card thread-settings-card">
          <div className="section-heading">
            <div><strong>Calculation controls</strong><span>Production-specific inputs</span></div>
            <Info size={17} />
          </div>
          <div className="field">
            <label>Process waste allowance (%)</label>
            <input type="number" min="0" max="100" step="0.1" value={wastePct} onChange={e => setWastePct(e.target.value)} />
          </div>
          <div className="info-banner"><LockKeyhole size={15} /> Stitch ratios and SPI are locked here and maintained only in Stitch Master.</div>
        </div>
      </div>

      <div className="thread-kpi-grid">
        <SummaryCard icon={Scissors} label="Total thread" value={`${round(totals.totalMeters, 2)} m`} helper="Per garment / selected color" tone="teal" />
        <SummaryCard icon={WalletCards} label="Thread cost" value={`${currency} ${round(totals.totalCost, 4)}`} helper="Feeds Garment Costing" tone="blue" />
        <SummaryCard icon={PackageCheck} label="Estimated cones" value={round(estimatedCones, 3)} helper="Based on Thread Master cone length" tone="amber" />
        <SummaryCard icon={Scissors} label="Operations" value={operations.length} helper={`${stitches.length} active stitches available`} tone="purple" />
      </div>


      <div className="card" style={{ padding: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={engineeringView === 'breakdown' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            onClick={() => setEngineeringView('breakdown')}
          >
            <Scissors size={14} /> Operation Breakdown
          </button>
          <button
            type="button"
            className={engineeringView === 'summary' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
            onClick={() => setEngineeringView('summary')}
          >
            <ListChecks size={14} /> Thread Summary
          </button>
        </div>
      </div>

      {loadingSavedEngineering && (
        <div className="card" style={{ padding: 12, marginBottom: 14, color: 'var(--text-muted)', fontSize: 12 }}>
          Loading saved sewing operations and Thread Summary...
        </div>
      )}

      {!selectedStyle && (
        <div className="warning-banner"><AlertTriangle size={17} /> Select an article before saving. Calculations can still be prepared first.</div>
      )}

      {engineeringView === 'breakdown' ? (
      <section className="card operations-workspace">
        <div className="section-toolbar">
          <div>
            <div className="eyebrow">OPERATION BREAKDOWN</div>
            <h2>Sewing operations</h2>
            <p>Select the stitch and threads. Engineering ratios remain controlled by the master.</p>
          </div>
          <button className="btn btn-secondary" onClick={addOperation}><Plus size={15} /> Add operation</button>
        </div>

        <div className="operation-list">
          {calculated.map((op, index) => {
            const stitch = stitchMap.get(String(op.stitchId));
            return (
              <article className="operation-panel" key={op.id}>
                <div className="operation-panel-header">
                  <div className="operation-number">{String(index + 1).padStart(2, '0')}</div>
                  <div>
                    <strong>{op.operationName || `Operation ${index + 1}`}</strong>
                    <span>{stitch ? `${stitch.stitch_code} | ${stitch.stitch_name}` : 'Stitch not selected'}</span>
                  </div>
                  <div className="operation-result">
                    <span>Total</span><strong>{op.calculation.totalMeters} m</strong>
                    <small>{currency} {op.calculation.totalCost}</small>
                  </div>
                  <button className="icon-button danger" onClick={() => removeOperation(op.id)} disabled={operations.length === 1} title="Delete operation">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="operation-edit-grid">
                  <div className="field">
                    <label>Operation name *</label>
                    <input value={op.operationName} onChange={e => setOperation(op.id, 'operationName', e.target.value)} placeholder="e.g. Side seam join" />
                  </div>
                  <div className="field">
                    <label>Seam length (cm) *</label>
                    <input type="number" min="0" step="0.1" value={op.seamLengthCm} onChange={e => setOperation(op.id, 'seamLengthCm', e.target.value)} />
                  </div>
                  <div className="field operation-stitch-field">
                    <label>Stitch type *</label>
                    <select value={op.stitchId} onChange={e => applyStitch(op.id, e.target.value)} disabled={loadingMasters}>
                      <option value="">{loadingMasters ? 'Loading Stitch Master...' : 'Select stitch'}</option>
                      {stitches.map(s => <option key={s.id} value={s.id}>{s.stitch_code} - {s.stitch_name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="locked-values-grid">
                  <LockedValue label="SPI" value={op.spi} />
                  <LockedValue label="Needle ratio" value={op.needleRatio} />
                  <LockedValue label="Looper ratio" value={op.looperRatio} />
                  <LockedValue label="Cover ratio" value={op.coverRatio} />
                </div>

                <div className="thread-selection-grid">
                  <div className="field">
                    <label>Needle thread</label>
                    <select value={op.needleThreadId} onChange={e => setOperation(op.id, 'needleThreadId', e.target.value)}>
                      <option value="">Not required / select thread</option>
                      {threads.filter(t => ['Needle', 'General'].includes(t.thread_use)).map(t => <option key={t.id} value={t.id}>{threadOptionLabel(t)}</option>)}
                    </select>
                    <small>{op.calculation.needleMeters} m | {currency} {op.calculation.needleCost}</small>
                  </div>
                  <div className="field">
                    <label>Looper thread</label>
                    <select value={op.looperThreadId} onChange={e => setOperation(op.id, 'looperThreadId', e.target.value)}>
                      <option value="">Not required / select thread</option>
                      {threads.filter(t => ['Looper', 'General'].includes(t.thread_use)).map(t => <option key={t.id} value={t.id}>{threadOptionLabel(t)}</option>)}
                    </select>
                    <small>{op.calculation.looperMeters} m | {currency} {op.calculation.looperCost}</small>
                  </div>
                  <div className="field">
                    <label>Cover thread</label>
                    <select value={op.coverThreadId} onChange={e => setOperation(op.id, 'coverThreadId', e.target.value)}>
                      <option value="">Not required / select thread</option>
                      {threads.filter(t => ['Cover', 'General'].includes(t.thread_use)).map(t => <option key={t.id} value={t.id}>{threadOptionLabel(t)}</option>)}
                    </select>
                    <small>{op.calculation.coverMeters} m | {currency} {op.calculation.coverCost}</small>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      ) : (
        <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="section-toolbar" style={{ padding: 16 }}>
            <div>
              <div className="eyebrow">THREAD SUMMARY</div>
              <h2>Thread items per garment</h2>
              <p>
                Identical Thread Master items are combined across all operations.
                Needle, Looper and Cover remain visible only as usage traceability.
              </p>
            </div>
            <span className="status-pill status-pill-success">
              <CheckCircle2 size={13} /> Auto-calculated
            </span>
          </div>

          {threadSummary.length ? (
            <div className="data-table-wrap">
              <table className="data-table" style={{ minWidth: 980 }}>
                <thead>
                  <tr>
                    <th>Thread Code</th>
                    <th>Thread</th>
                    <th>Ticket</th>
                    <th>Used In</th>
                    <th>Consumption / Garment</th>
                    <th>Cost / Garment</th>
                    <th>Operations</th>
                  </tr>
                </thead>
                <tbody>
                  {threadSummary.map(row => {
                    const open = Boolean(expandedSummaryRows[row.key]);
                    return (
                      <>
                        <tr key={row.key}>
                          <td><strong>{row.thread_code || '-'}</strong></td>
                          <td>
                            {row.thread_name || '-'}
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {[row.brand, row.supplier].filter(Boolean).join(' | ')}
                            </div>
                          </td>
                          <td>{row.ticket_no || '-'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                              {row.used_in.map(item => (
                                <span
                                  key={item}
                                  style={{
                                    padding: '3px 7px',
                                    borderRadius: 20,
                                    background: 'var(--teal-light)',
                                    color: 'var(--teal)',
                                    fontSize: 10,
                                    fontWeight: 800,
                                  }}
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color: 'var(--teal)' }}>
                            {row.consumption_per_garment.toFixed(4)} m
                          </td>
                          <td style={{ fontFamily: 'JetBrains Mono' }}>
                            {row.currency} {row.total_cost.toFixed(6)}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() =>
                                setExpandedSummaryRows(previous => ({
                                  ...previous,
                                  [row.key]: !open,
                                }))
                              }
                            >
                              {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              {row.operations.length} usage(s)
                            </button>
                          </td>
                        </tr>
                        {open && (
                          <tr key={`${row.key}-details`}>
                            <td colSpan="7" style={{ background: 'var(--bg)' }}>
                              <div style={{ display: 'grid', gap: 6, padding: 6 }}>
                                {row.operations.map((usage, index) => (
                                  <div
                                    key={`${row.key}-${index}`}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      gap: 10,
                                      padding: '7px 9px',
                                      borderRadius: 8,
                                      background: 'white',
                                      border: '1px solid var(--border-light)',
                                      fontSize: 11,
                                    }}
                                  >
                                    <span>
                                      <strong>{usage.operation_name}</strong> | {usage.usage_position}
                                    </span>
                                    <span style={{ fontFamily: 'JetBrains Mono' }}>
                                      {usage.meters.toFixed(4)} m
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>Select threads in the operation breakdown to generate the summary.</p>
            </div>
          )}
        </section>
      )}

      <section className="card thread-total-panel">
        <div>
          <div className="eyebrow">COSTING OUTPUT</div>
          <h2>Thread cost contribution</h2>
          <p>This amount is saved to the selected style and becomes available in Garment Costing.</p>
        </div>
        <div className="thread-total-breakdown">
          <span>Needle <strong>{round(totals.needleMeters, 2)} m</strong></span>
          <span>Looper <strong>{round(totals.looperMeters, 2)} m</strong></span>
          <span>Cover <strong>{round(totals.coverMeters, 2)} m</strong></span>
          <span className="grand-total">Total cost <strong>{currency} {round(totals.totalCost, 4)}</strong></span>
        </div>
      </section>
    </div>
  );
}
