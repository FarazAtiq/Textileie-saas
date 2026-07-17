import { useEffect, useState } from 'react';
import { LockKeyhole, RefreshCw } from 'lucide-react';
import { getCompanyModuleLicenses } from '../lib/db.js';
import { useToast } from '../hooks/useToast.jsx';

const LABELS = {
  dashboard: 'Dashboard',
  styles: 'Style Master',
  fabric_master: 'Fabric Master',
  thread_master: 'Thread Master',
  stitch_master: 'Stitch Master',
  smv: 'SMV / SAM',
  efficiency: 'Efficiency',
  capacity: 'Capacity Planning',
  fabric_engineering: 'Fabric Engineering',
  thread_engineering: 'Thread Engineering',
  costing: 'Garment Costing',
  reports: 'Report Studio',
  administration: 'Administration',
  export_orders: 'Export Orders',
  fabric_requirements: 'Fabric Requirements',
  thread_requirements: 'Thread Requirements',
  inventory: 'Inventory',
  purchase_requisition: 'Purchase Requisition',
  ai: 'AI Advisor',
  ghl: 'GHL Automation',
};

export default function ModuleLicensePanel() {
  const { toast, ToastContainer } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await getCompanyModuleLicenses());
    } catch (error) {
      toast('Failed to load module licenses: ' + error.message, 'error');
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
            <LockKeyhole size={16} /> Enabled Modules
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
            Read-only factory view. TextileIE controls purchased modules from Platform Administration.
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13} /> Refresh</button>
      </div>

      {loading ? <div className="empty-state"><p>Loading modules...</p></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 10 }}>
          {rows.map(row => (
            <div key={row.id} style={{
              border: '1px solid var(--border-light)',
              borderRadius: 10,
              padding: '12px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{LABELS[row.module_key] || row.module_key}</span>
              <span style={{
                borderRadius: 20,
                padding: '3px 8px',
                fontSize: 11,
                fontWeight: 700,
                background: row.enabled ? 'var(--green-light)' : 'var(--bg)',
                color: row.enabled ? 'var(--green)' : 'var(--text-muted)',
              }}>
                {row.enabled ? 'Enabled' : 'Not Licensed'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
