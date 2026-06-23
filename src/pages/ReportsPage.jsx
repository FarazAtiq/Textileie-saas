import { useState, useEffect } from 'react';
import { Trash2, Download, FileText, Search, Star, Sheet } from 'lucide-react';
import { getReports, deleteReport, toggleStar } from '../lib/db.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.jsx';
import { exportReportPDF } from '../utils/pdfExport.js';
import { PageHeader } from '../components/ResultCard.jsx';

const TYPE_BADGE  = { efficiency:'teal', capacity:'navy', smv:'amber', fabric:'green', thread:'purple', costing:'orange', yarn:'red' };
const TYPE_LABEL  = { efficiency:'Efficiency', capacity:'Capacity', smv:'SMV', fabric:'Fabric', thread:'Thread', costing:'Costing', yarn:'Yarn' };
const FILTER_TABS = ['all','efficiency','capacity','smv','fabric','thread','costing','yarn'];

function getKeyResult(r) {
  const res = r.results || {};
  switch (r.type) {
    case 'efficiency': return res.efficiency != null ? res.efficiency + '% eff' : '—';
    case 'capacity':   return res.dailyCapacity != null ? Number(res.dailyCapacity).toLocaleString() + ' pcs/day' : '—';
    case 'smv':        return res.totalSMV != null ? 'SMV ' + res.totalSMV + ' min' : '—';
    case 'fabric':     return res.grossYards != null ? res.grossYards + ' yds' : res.grossWeightKg != null ? res.grossWeightKg + ' kg' : '—';
    case 'thread':     return res.grossMeters != null ? res.grossMeters + ' m' : '—';
    case 'costing':    return res.fobPrice != null ? '$' + res.fobPrice + ' FOB' : '—';
    case 'yarn':       return res.ne != null ? 'Ne ' + res.ne : '—';
    default:           return '—';
  }
}

// ── Excel export function ─────────────────────────────────
function exportReportExcel(r) {
  try {
    const inputs  = r.inputs  || {};
    const results = r.results || {};

    // Build rows
    const inputRows  = Object.entries(inputs).map(([k, v]) => [
      k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()), String(v)
    ]);
    const resultRows = Object.entries(results).map(([k, v]) => [
      k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()), String(v)
    ]);

    // Build HTML table for Excel
    const now = new Date().toLocaleString('en-PK');
    let html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <!--[if gte mso 9]>
  <xml><x:ExcelWorkbook><x:ExcelWorksheets>
    <x:ExcelWorksheet><x:Name>${r.type.toUpperCase()} Report</x:Name>
    <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
    </x:ExcelWorksheet>
  </x:ExcelWorksheets></x:ExcelWorkbook></xml>
  <![endif]-->
  <style>
    body { font-family: Arial; font-size: 11pt; }
    .header { background: #0F2942; color: white; font-weight: bold; font-size: 14pt; padding: 8px; }
    .subheader { background: #0D7A6B; color: white; font-size: 10pt; padding: 4px 8px; }
    .section-title { background: #E4F4F1; color: #0F2942; font-weight: bold; font-size: 11pt; padding: 6px 8px; }
    .col-header { background: #0F2942; color: white; font-weight: bold; padding: 5px 8px; }
    .result-header { background: #0D7A6B; color: white; font-weight: bold; padding: 5px 8px; }
    .even { background: #F4F7FA; }
    .odd  { background: white; }
    .value { font-weight: bold; color: #0D7A6B; }
    td, th { padding: 5px 8px; border: 1px solid #D8E4EE; }
    .meta { color: #4A6080; font-size: 9pt; }
  </style>
</head>
<body>
  <table>
    <!-- Header -->
    <tr><td colspan="2" class="header">🧵 TextileIE — Industrial Engineering Suite</td></tr>
    <tr><td colspan="2" class="subheader">Report: ${r.title}</td></tr>
    <tr><td colspan="2" class="meta">Generated: ${now} | Type: ${r.type.toUpperCase()}</td></tr>
    <tr><td colspan="2"></td></tr>

    <!-- Inputs -->
    <tr><td colspan="2" class="section-title">📥 Inputs</td></tr>
    <tr>
      <th class="col-header">Parameter</th>
      <th class="col-header">Value</th>
    </tr>
    ${inputRows.map((row, i) => `
    <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
      <td>${row[0]}</td>
      <td class="value">${row[1]}</td>
    </tr>`).join('')}

    <tr><td colspan="2"></td></tr>

    <!-- Results -->
    <tr><td colspan="2" class="section-title">📊 Results</td></tr>
    <tr>
      <th class="result-header">Metric</th>
      <th class="result-header">Value</th>
    </tr>
    ${resultRows.map((row, i) => `
    <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
      <td>${row[0]}</td>
      <td class="value">${row[1]}</td>
    </tr>`).join('')}

    <tr><td colspan="2"></td></tr>
    <tr><td colspan="2" class="meta">TextileIE © ${new Date().getFullYear()} — Confidential</td></tr>
  </table>
</body>
</html>`;

    // Download as .xls
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = 'TextileIE-' + r.type + '-' + Date.now() + '.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Excel export error:', err);
    alert('Excel export failed: ' + err.message);
  }
}

// ── Export ALL reports to one Excel file ──────────────────
function exportAllReportsExcel(reports, companyName) {
  try {
    const now = new Date().toLocaleString('en-PK');

    let rows = reports.map((r, i) => {
      const res = r.results || {};
      const inp = r.inputs  || {};
      return `
      <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
        <td>${i + 1}</td>
        <td>${r.title}</td>
        <td>${TYPE_LABEL[r.type] || r.type}</td>
        <td class="value">${getKeyResult(r)}</td>
        <td>${new Date(r.created_at).toLocaleDateString('en-PK')}</td>
        <td>${r.is_starred ? '★' : ''}</td>
      </tr>`;
    }).join('');

    const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial; font-size: 11pt; }
    .header { background: #0F2942; color: white; font-weight: bold; font-size: 14pt; padding: 8px; }
    .subheader { background: #0D7A6B; color: white; font-size: 10pt; padding: 4px 8px; }
    .col-header { background: #0F2942; color: white; font-weight: bold; padding: 6px 8px; }
    .even { background: #F4F7FA; }
    .odd  { background: white; }
    .value { font-weight: bold; color: #0D7A6B; }
    .meta { color: #4A6080; font-size: 9pt; }
    td, th { padding: 5px 8px; border: 1px solid #D8E4EE; }
  </style>
</head>
<body>
  <table>
    <tr><td colspan="6" class="header">🧵 TextileIE — All Reports Export</td></tr>
    <tr><td colspan="6" class="subheader">${companyName || 'Factory'} | Generated: ${now}</td></tr>
    <tr><td colspan="6"></td></tr>
    <tr>
      <th class="col-header">#</th>
      <th class="col-header">Report Title</th>
      <th class="col-header">Type</th>
      <th class="col-header">Key Result</th>
      <th class="col-header">Date</th>
      <th class="col-header">Starred</th>
    </tr>
    ${rows}
    <tr><td colspan="6"></td></tr>
    <tr><td colspan="6" class="meta">Total reports: ${reports.length} | TextileIE © ${new Date().getFullYear()}</td></tr>
  </table>
</body>
</html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = 'TextileIE-All-Reports-' + Date.now() + '.xls';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Excel export error:', err);
  }
}

export default function ReportsPage() {
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [starOnly, setStarOnly] = useState(false);
  const { profile } = useAuth();
  const { toast, ToastContainer } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await getReports({
        type: filter !== 'all' ? filter : undefined,
        starred: starOnly || undefined
      });
      setReports(data);
    } catch { toast('Failed to load reports', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter, starOnly]);

  const del = async (id) => {
    if (!confirm('Delete this report?')) return;
    try {
      await deleteReport(id);
      setReports(r => r.filter(x => x.id !== id));
      toast('Report deleted');
    } catch { toast('Failed to delete', 'error'); }
  };

  const star = async (id, current) => {
    try {
      const updated = await toggleStar(id, current);
      setReports(r => r.map(x => x.id === id ? { ...x, is_starred: updated.is_starred } : x));
    } catch { toast('Failed to update', 'error'); }
  };

  const doExportPDF = (r) => exportReportPDF({
    type: r.type, title: r.title,
    inputs: r.inputs, results: r.results,
    companyName: profile?.company_name,
    userName: profile?.full_name
  });

  const filtered = reports.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (TYPE_LABEL[r.type] || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <ToastContainer />
      <PageHeader title="Reports" subtitle="All your saved calculation reports" />

      {/* Search + starred + export all */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports..." style={{ paddingLeft: 30, width: '100%' }} />
        </div>
        <button className={`btn btn-sm ${starOnly ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStarOnly(s => !s)}>
          <Star size={13} /> Starred
        </button>
        {filtered.length > 0 && (
          <button
            className="btn btn-sm"
            onClick={() => exportAllReportsExcel(filtered, profile?.company_name)}
            style={{ background: '#217346', color: 'white', border: 'none' }}
          >
            <FileText size={13} /> Export all to Excel
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' }}>
        {FILTER_TABS.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`btn btn-sm ${filter === t ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textTransform: 'capitalize', flexShrink: 0 }}>
            {t === 'all' ? 'All' : TYPE_LABEL[t] || t}
          </button>
        ))}
      </div>

      {/* Count */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
        {filtered.length} report{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Reports — card layout works on both mobile and desktop */}
      {loading ? (
        <div className="empty-state"><p>Loading reports...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FileText size={32} color="var(--border)" />
          <p>{reports.length === 0 ? 'No reports yet. Run any calculator and save.' : 'No reports match your search.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((r) => (
            <div key={r.id} className="card" style={{ padding: '14px 16px' }}>

              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ flex: 1, paddingRight: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                    {new Date(r.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <button onClick={() => star(r.id, r.is_starred)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                  <Star size={16} color={r.is_starred ? 'var(--amber)' : 'var(--border)'} fill={r.is_starred ? 'var(--amber)' : 'none'} />
                </button>
              </div>

              {/* Type + result */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span className={`badge badge-${TYPE_BADGE[r.type] || 'teal'}`}>
                  {TYPE_LABEL[r.type] || r.type}
                </span>
                <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono', color: 'var(--teal)', fontWeight: 600 }}>
                  {getKeyResult(r)}
                </span>
              </div>

              {/* Action buttons — 3 buttons full width */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => doExportPDF(r)}
                  style={{ justifyContent: 'center' }}
                >
                  <Download size={12} /> PDF
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => exportReportExcel(r)}
                  style={{ justifyContent: 'center', background: '#217346', color: 'white', border: 'none' }}
                >
                  <FileText size={12} /> Excel
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => del(r.id)}
                  style={{ justifyContent: 'center' }}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
