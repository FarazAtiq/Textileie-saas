import { Edit3, Package, Trash2 } from 'lucide-react';
import StatusBadge from '../master/StatusBadge.jsx';

export default function ThreadCard({ thread, onEdit, onDelete }) {
  const price = Number(thread.price || 0);
  const coneLength = Number(thread.cone_length || 0);

  return (
    <article className="card master-card thread-master-card">
      <div className="master-card-header">
        <div>
          <div className="eyebrow">THREAD CODE</div>
          <div className="master-code">{thread.thread_code || '—'}</div>
          <div className="master-name">{thread.thread_name || 'Unnamed thread'}</div>
        </div>
        <StatusBadge status={thread.status || 'Active'} />
      </div>

      <div className="master-card-grid">
        <div><span>Material</span><strong>{thread.material || '—'}</strong></div>
        <div><span>Application</span><strong>{thread.thread_use || 'General'}</strong></div>
        <div><span>Ticket No.</span><strong>{thread.ticket_no || '—'}</strong></div>
        <div><span>Tex / Denier</span><strong>{thread.tex || '—'} / {thread.denier || '—'}</strong></div>
        <div><span>Supplier</span><strong>{thread.supplier || '—'}</strong></div>
        <div><span>Color</span><strong>{thread.color || '—'}</strong></div>
      </div>

      <div className="commercial-strip">
        <div>
          <span>Commercial rate</span>
          <strong>{thread.currency || 'USD'} {price.toFixed(4)} / {thread.price_unit || 'Meter'}</strong>
        </div>
        <Package size={20} />
      </div>

      <div className="package-strip">
        <span>Cone length: <strong>{coneLength ? `${coneLength.toLocaleString()} m` : '—'}</strong></span>
        <span>Cone weight: <strong>{thread.cone_weight ? `${thread.cone_weight} kg` : '—'}</strong></span>
      </div>

      <div className="master-card-actions">
        <button className="btn btn-secondary btn-sm" onClick={() => onEdit(thread)}>
          <Edit3 size={13} /> Edit
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(thread.id)}>
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </article>
  );
}
