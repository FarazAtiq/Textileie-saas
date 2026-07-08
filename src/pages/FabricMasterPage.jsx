import FabricForm from '../components/fabric/FabricForm.jsx';
import FabricForm from '../components/fabric/FabricCard.jsx';
import MasterStats from '../components/master/MasterStats.jsx';
import MasterSearchBar from '../components/master/MasterSearchBar.jsx';
import StatusBadge from '../components/master/StatusBadge.jsx';
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
          {filtered.map(f => (
  <FabricCard
    key={f.id}
    fabric={f}
    onEdit={(fabric) => {
      setEditing(fabric);
      setShowForm(true);
    }}
    onDelete={remove}
  />
))}
    </div>
  );
}
