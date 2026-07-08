import MasterStats from '../components/master/MasterStats.jsx';
import MasterSearchBar from '../components/master/MasterSearchBar.jsx';
import StatusBadge from '../components/master/StatusBadge.jsx';
import FabricForm from '../components/fabric/FabricForm.jsx';
import { useEffect, useMemo, useState } from 'react';
import { Layers } from 'lucide-react';
import { PageHeader } from '../components/ResultCard.jsx';
import { getFabrics, deleteFabric } from '../lib/db.js';
import { useToast } from '../hooks/useToast.jsx';


export default function FabricMasterPage() {
  const [fabrics, setFabrics] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast, ToastContainer } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      setFabrics(await getFabrics({ search }));
    } catch (err) {
      toast('Failed to load fabrics: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return fabrics.filter(f =>
      !q ||
      [
        f.fabric_code,
        f.fabric_name,
        f.description,
        f.composition,
        f.supplier,
        f.status,
      ].join(' ').toLowerCase().includes(q)
    );
  }, [fabrics, search]);

  const stats = useMemo(() => ({
    total: fabrics.length,
    active: fabrics.filter(f => f.status === 'Active').length,
    inactive: fabrics.filter(f => f.status !== 'Active').length,
  }), [fabrics]);

  const remove = async (id) => {
    if (!confirm('Delete this fabric?')) return;
    try {
      await deleteFabric(id);
      setFabrics(prev => prev.filter(f => f.id !== id));
      toast('Fabric deleted');
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
        title="Fabric Master"
        subtitle="Reusable fabric library for BOM, costing, purchase planning and inventory"
        badge={{ text: 'Master Data' }}
      />

      <MasterStats
        stats={[
        { label: 'TOTAL FABRICS', value: stats.total },
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
  newLabel="New Fabric"
/>
          

      {showForm && <FabricForm editing={editing} onCancel={closeForm} onSaved={saved} />}

      {loading ? (
        <div className="empty-state"><p>Loading fabrics...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Layers size={32} color="var(--border)" />
          <p>No fabrics yet. Create your first fabric master.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 14 }}>
          {filtered.map(f => {
            const active = f.status === 'Active';
            return (
              <div key={f.id} className="card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>FABRIC CODE</div>
                    <div style={{ fontWeight: 900, fontFamily: 'JetBrains Mono', color: 'var(--navy)', fontSize: 18 }}>
                      {f.fabric_code}
                    </div>
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 700 }}>
                      {f.fabric_name || f.description || 'Fabric'}
                    </div>
                  </div>

                  <span style={{
                    background: active ? '#16a34a' : '#64748b',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    height: 24
                  }}>
                    <StatusBadge status={f.status || 'Active'} />
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, marginBottom: 14 }}>
                  <div><b>Supplier:</b> {f.supplier || '—'}</div>
                  <div><b>Composition:</b> {f.composition || '—'}</div>
                  <div><b>GSM:</b> {f.gsm || 0}</div>
                  <div><b>Width:</b> {f.cuttable_width || 0} {f.width_unit || 'inch'}</div>
                  <div><b>Finished:</b> {f.finished_width || 0} {f.width_unit || 'inch'}</div>
                  <div><b>MOQ:</b> {f.moq || 0}</div>
                  <div><b>Lead Time:</b> {f.lead_time_days || 0} days</div>
                  <div><b>Store:</b> {f.storage_location || '—'}</div>
                  <div><b>Type:</b> {f.fabric_type || '—'}</div>
                  <div><b>Category:</b> {f.fabric_category || '—'}</div>
                  <div><b>Supplier Code:</b> {f.supplier_fabric_code || '—'}</div>
                  <div><b>Form:</b> {f.fabric_form || 'Open Width'}</div>
                  <div><b>Color Type:</b> {f.color_type || 'Solid'}</div>
                  <div><b>Shrinkage:</b> L {f.shrinkage_length_pct || 0}% / W {f.shrinkage_width_pct || 0}%</div>
                </div>

                <div style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'var(--teal-light)',
                  marginBottom: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 700 }}>Price</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 900, color: 'var(--teal)' }}>
                    {f.currency || 'USD'} {Number(f.price || 0).toFixed(2)} / {f.price_unit || 'KG'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{
                    padding: '9px 11px',
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid var(--border-light)',
                    marginBottom: 12,
                    fontSize: 12
                  }}>
                    <b>Used In:</b> 0 Styles
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(f); setShowForm(true); }}>
                    <Edit3 size={12} /> Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(f.id)}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
