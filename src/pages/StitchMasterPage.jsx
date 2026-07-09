import MasterStats from '../components/master/MasterStats.jsx';
import MasterSearchBar from '../components/master/MasterSearchBar.jsx';
import StitchForm from '../components/stitch/StitchForm.jsx';
import { useEffect, useMemo, useState } from 'react';
import { Scissors } from 'lucide-react';
import { PageHeader } from '../components/ResultCard.jsx';
import { getStitches, deleteStitch } from '../lib/db.js';
import { useToast } from '../hooks/useToast.jsx';

export default function StitchMasterPage() {
  const [stitches, setStitches] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast, ToastContainer } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      setStitches(await getStitches({ search }));
    } catch (err) {
      toast('Failed to load stitches: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return stitches.filter(s =>
      !q ||
      [
        s.stitch_code,
        s.stitch_name,
        s.seam_class,
        s.status,
      ].join(' ').toLowerCase().includes(q)
    );
  }, [stitches, search]);

  const stats = useMemo(() => ({
    total: stitches.length,
    active: stitches.filter(s => s.status === 'Active').length,
    inactive: stitches.filter(s => s.status !== 'Active').length,
  }), [stitches]);

  const remove = async (id) => {
    if (!confirm('Delete this stitch?')) return;
    try {
      await deleteStitch(id);
      setStitches(prev => prev.filter(s => s.id !== id));
      toast('Stitch deleted');
    } catch (err) {
      toast('Delete failed: ' + err.message, 'error');
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const saved = async () => {
    closeForm();
    await load();
  };

  return (
    <div>
      <ToastContainer />

      <PageHeader
        title="Stitch Master"
        subtitle="Reusable stitch library for ratios, thread consumption and costing"
        badge={{ text: 'Master Data' }}
      />

      <MasterStats
        stats={[
          { label: 'TOTAL STITCHES', value: stats.total },
          { label: 'ACTIVE', value: stats.active, color: 'var(--teal)' },
          { label: 'INACTIVE', value: stats.inactive, color: '#dc2626' },
        ]}
      />

      <MasterSearchBar
        search={search}
        setSearch={setSearch}
        onSearch={load}
        onNew={() => {
          setEditing(null);
          setShowForm(true);
        }}
        newLabel="New Stitch"
      />

      {showForm && (
        <StitchForm
          editing={editing}
          onCancel={closeForm}
          onSaved={saved}
          toast={toast}
        />
      )}

      {loading ? (
        <div className="empty-state"><p>Loading stitches...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Scissors size={32} color="var(--border)" />
          <p>No stitches yet. Create your first stitch master.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
          {filtered.map(s => (
            <div key={s.id} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>STITCH CODE</div>
                  <div style={{ fontWeight: 900, fontFamily: 'JetBrains Mono', color: 'var(--navy)', fontSize: 18 }}>
                    {s.stitch_code}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{s.stitch_name}</div>
                </div>
                <span style={{
                  background: s.status === 'Active' ? '#16a34a' : '#64748b',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  height: 24
                }}>
                  {s.status || 'Active'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, marginBottom: 12 }}>
                <div><b>Class:</b> {s.seam_class || '—'}</div>
                <div><b>SPI:</b> {s.default_spi || 0}</div>
                <div><b>Needle:</b> {s.needle_ratio || 0}</div>
                <div><b>Looper:</b> {s.looper_ratio || 0}</div>
                <div><b>Cover:</b> {s.cover_ratio || 0}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => {
                  setEditing(s);
                  setShowForm(true);
                }}>
                  Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(s.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
