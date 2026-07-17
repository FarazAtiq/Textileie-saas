import { useEffect, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { getActivityLogs } from '../lib/db.js';
import { useToast } from '../hooks/useToast.jsx';

function humanize(value) {
  return String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

export default function ActivityTimeline() {
  const { toast, ToastContainer } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await getActivityLogs({ limit: 150 }));
    } catch (error) {
      toast('Failed to load activity: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <ToastContainer />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Activity size={16} /> Activity Timeline
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
            Company administration and workflow changes recorded by the audit system.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading activity...</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 9 }}>
          {rows.map(row => (
            <div key={row.id} style={{
              border: '1px solid var(--border-light)',
              borderRadius: 10,
              padding: '11px 13px',
              display: 'grid',
              gridTemplateColumns: '110px minmax(0,1fr) 170px',
              gap: 12,
              alignItems: 'center',
            }}>
              <strong style={{ fontSize: 12 }}>{humanize(row.action_key)}</strong>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {humanize(row.entity_type)}
                  {row.entity_id ? ` · ${row.entity_id}` : ''}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Module: {humanize(row.module_key)}
                  {row.reason ? ` · ${row.reason}` : ''}
                </div>
              </div>
              <time style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
                {new Date(row.created_at).toLocaleString()}
              </time>
            </div>
          ))}
          {!rows.length && (
            <div className="empty-state"><p>No activity has been recorded yet.</p></div>
          )}
        </div>
      )}
    </div>
  );
}
