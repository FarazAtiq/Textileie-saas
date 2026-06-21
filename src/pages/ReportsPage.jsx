import { useState, useEffect } from 'react';
import { Trash2, Download, FileText, Search, Star, Filter } from 'lucide-react';
import { getReports, deleteReport, toggleStar } from '../lib/db.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { useToast } from '../hooks/useToast.js';
import { exportReportPDF } from '../utils/pdfExport.js';
import { PageHeader } from '../components/ResultCard.jsx';

const TYPE_BADGE  = { efficiency:'teal', capacity:'navy', smv:'amber', fabric:'green', thread:'purple', costing:'orange', yarn:'red' };
const TYPE_LABEL  = { efficiency:'Efficiency', capacity:'Capacity', smv:'SMV', fabric:'Fabric', thread:'Thread', costing:'Costing', yarn:'Yarn' };
const FILTER_TABS = ['all','efficiency','capacity','smv','fabric','thread','costing','yarn'];

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
      const data = await getReports({ type: filter !== 'all' ? filter : undefined, starred: starOnly || undefined });
      setReports(data);
    } catch { toast('Failed to load reports', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter, starOnly]);

  const del = async (id) => {
    if (!confirm('Delete this report? This cannot be undone.')) return;
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
    companyName: profile?.company_name, userName: profile?.full_name
  });

  const filtered = reports.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (TYPE_LABEL[r.type] || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <ToastContainer />
      <PageHeader title="Reports" subtitle="All your saved calculation reports" />

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 240 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reports..." style={{ paddingLeft: 32 }} />
        </div>
        <button
          className={`btn btn-sm ${starOnly ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setStarOnly(s => !s)}
        >
          <Star size={13} /> Starred
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {filtered.length} report{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Type filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTER_TABS.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`btn btn-sm ${filter === t ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textTransform: 'capitalize' }}>
            {t === 'all' ? 'All types' : TYPE_LABEL[t] || t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state"><p>Loading reports...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <FileText size={32} color="var(--border)" />
            <p>{reports.length === 0
              ? 'No reports yet. Run any calculator and click "Save report".'
              : 'No reports match your search or filter.'}</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>Report title</th>
                <th>Type</th>
                <th>Key result</th>
                <th>Saved on</th>
                <th style={{ width: 90 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <button onClick={() => star(r.id, r.is_starred)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                      <Star size={14}
                        color={r.is_starred ? 'var(--amber)' : 'var(--border)'}
                        fill={r.is_starred ? 'var(--amber)' : 'none'} />
                    </button>
                  </td>
                  <td style={{ fontWeight: 500, maxWidth: 220 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                    {r.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{r.notes}</div>}
                  </td>
                  <td>
                    <span className={`badge badge-${TYPE_BADGE[r.type] || 'teal'}`}>
                      {TYPE_LABEL[r.type] || r.type}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: 'var(--teal)' }}>
                    {getKeyResult(r)}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(r.created_at).toLocaleDateString('en-PK', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => doExport(r)} title="Export PDF">
                        <Download size={13} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(r.id)} title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function getKeyResult(r) {
  const res = r.results || {};
  switch (r.type) {
    case 'efficiency': return res.efficiency != null ? `${res.efficiency}% efficiency` : '—';
    case 'capacity':   return res.dailyCapacity != null ? `${Number(res.dailyCapacity).toLocaleString()} pcs/day` : '—';
    case 'smv':        return res.totalSMV != null ? `SMV ${res.totalSMV} min` : '—';
    case 'fabric':     return res.grossYards != null ? `${res.grossYards} yds/unit` : res.grossWeightKg != null ? `${res.grossWeightKg} kg/unit` : '—';
    case 'thread':     return res.grossMeters != null ? `${res.grossMeters} m` : '—';
    case 'costing':    return res.fobPrice != null ? `$${res.fobPrice} FOB` : '—';
    case 'yarn':       return res.ne != null ? `Ne ${res.ne}` : '—';
    default:           return '—';
  }
}
