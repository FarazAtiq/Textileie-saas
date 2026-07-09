import { Edit3, Trash2 } from 'lucide-react';
import StatusBadge from '../master/StatusBadge.jsx';

export default function threadCard({ thread, onEdit, onDelete }) {
  const f = thread;

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>thread CODE</div>
          <div style={{ fontWeight: 900, fontFamily: 'JetBrains Mono', color: 'var(--navy)', fontSize: 18 }}>
            {f.thread_code}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 700 }}>
            {f.thread_name || f.description || 'thread'}
          </div>
        </div>

        <StatusBadge status={f.status || 'Active'} />
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
        <div><b>Type:</b> {f._type || '—'}</div>
        <div><b>Category:</b> {f._category || '—'}</div>
        <div><b>Supplier Code:</b> {f.supplier__code || '—'}</div>
        <div><b>Form:</b> {f._form || 'Open Width'}</div>
        <div><b>Color Type:</b> {f.color_type || 'Solid'}</div>
        <div><b>Shrinkage:</b> L {f.shrinkage_length_pct || 0}% / W {f.shrinkage_width_pct || 0}%</div>
      </div>

      <div style={{
        padding: '10px 12px',
        borderRadius: 10,
        background: 'var(--teal-light)',
        marginBottom: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 700 }}>Price</span>
        <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 900, color: 'var(--teal)' }}>
          {f.currency || 'USD'} {Number(f.price || 0).toFixed(2)} / {f.price_unit || 'KG'}
        </span>
      </div>

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => onEdit(f)}>
          <Edit3 size={12} /> Edit
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(f.id)}>
          <Trash2 size={12} /> Delete
        </button>
      </div>
    </div>
  );
}
