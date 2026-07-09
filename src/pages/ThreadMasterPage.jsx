import ThreadForm from '../components/thread/ThreadForm.jsx';
import ThreadCard from '../components/thread/ThreadCard.jsx';
import MasterStats from '../components/master/MasterStats.jsx';
import MasterSearchBar from '../components/master/MasterSearchBar.jsx';
import { useEffect, useMemo, useState } from 'react';
import { Layers } from 'lucide-react';
import { PageHeader } from '../components/ResultCard.jsx';
import { getThreads, deleteThread } from '../lib/db.js';
import { useToast } from '../hooks/useToast.jsx';

export default function ThreadMasterPage() {
  const [threads, setThreads] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast, ToastContainer } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      setThreads(await getThreads({ search }));
    } catch (err) {
      toast('Failed to load threads: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return threads.filter(t =>
      !q ||
      [
        t.thread_code,
        t.thread_name,
        t.material,
        t.thread_use,
        t.ticket_no,
        t.supplier,
        t.color,
        t.status,
      ].join(' ').toLowerCase().includes(q)
    );
  }, [threads, search]);

  const stats = useMemo(() => ({
    total: threads.length,
    active: threads.filter(t => t.status === 'Active').length,
    inactive: threads.filter(t => t.status !== 'Active').length,
  }), [threads]);

  const remove = async (id) => {
    if (!confirm('Delete this thread?')) return;
    try {
      await deleteThread(id);
      setThreads(prev => prev.filter(t => t.id !== id));
      toast('Thread deleted');
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
        title="Thread Master"
        subtitle="Reusable thread library for thread BOM, costing, purchase planning and inventory"
        badge={{ text: 'Master Data' }}
      />

      <MasterStats
        stats={[
          { label: 'TOTAL THREADS', value: stats.total },
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
        newLabel="New Thread"
      />

      {showForm && (
  <ThreadForm
    editing={editing}
    onCancel={closeForm}
    onSaved={saved}
    toast={toast}
  />
)}

      {loading ? (
        <div className="empty-state"><p>Loading threads...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Layers size={32} color="var(--border)" />
          <p>No threads yet. Create your first thread master.</p>
        </div>
      ) : (
        <div
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
    gap: 14,
  }}
>
  {filtered.map(t => (
    <ThreadCard
      key={t.id}
      thread={t}
      onEdit={(thread) => {
        setEditing(thread);
        setShowForm(true);
      }}
      onDelete={remove}
    />
  ))}
</div>
)}
    );
      }
