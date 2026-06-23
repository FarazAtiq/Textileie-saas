import { useState, useEffect } from 'react';
import { Trash2, Download, FileText, Search, Star } from 'lucide-react';
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

  const doExport = (r) => exportReportPDF({
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

      {/* Search + starred */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports..." style={{ paddingLeft: 30, width: '100%' }} />
        </div>
        <button className={`btn btn-sm ${starOnly ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setStarOnly(s => !s)}>
          <Star size={13} />
        </button>
      </div>

      {/* Filter tabs — scrollable on mobile */}
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

      {/* Reports list — CARD style on mobile instead of table */}
      {loading ? (
        <div className="empty-state"><p>Loading reports...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FileText size={32} color="var(--border)" />
          <p>{reports.length === 0 ? 'No reports yet. Run any calculator and save.' : 'No reports match your search.'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((r, i) => (
            <div key={r.id} className="card" style={{ padding: '14px 16px' }}>
              {/* Top row — title + star */}
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

              {/* Middle row — type badge + key result */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span className={`badge badge-${TYPE_BADGE[r.type] || 'teal'}`}>
                  {TYPE_LABEL[r.type] || r.type}
                </span>
                <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono', color: 'var(--teal)', fontWeight: 600 }}>
                  {getKeyResult(r)}
                </span>
              </div>

              {/* Bottom row — action buttons FULL WIDTH on mobile */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => doExport(r)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Download size={13} /> Export PDF
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => del(r.id)}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
