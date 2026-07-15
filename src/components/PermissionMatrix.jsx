import { useEffect, useMemo, useState } from 'react';
import { Plus, Save, ShieldCheck } from 'lucide-react';
import {
  MODULE_KEYS,
  PERMISSION_ACTIONS,
  createCompanyRole,
  getCompanyRoles,
  getRolePermissions,
  saveRolePermissions,
} from '../lib/db.js';
import { useToast } from '../hooks/useToast.jsx';

const MODULE_LABELS = {
  dashboard: 'Dashboard',
  styles: 'Style Master',
  fabric_master: 'Fabric Master',
  thread_master: 'Thread Master',
  stitch_master: 'Stitch Master',
  smv: 'SMV / SAM',
  efficiency: 'Efficiency',
  capacity: 'Capacity',
  fabric_engineering: 'Fabric Engineering',
  thread_engineering: 'Thread Engineering',
  costing: 'Garment Costing',
  reports: 'Report Studio',
  administration: 'Administration',
  inventory: 'Inventory',
};

const ACTION_LABELS = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
  export: 'Export',
  view_cost: 'View Cost',
  design_reports: 'Design Reports',
};

export default function PermissionMatrix() {
  const { toast, ToastContainer } = useToast();
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await getCompanyRoles();
      setRoles(data);
      if (!selectedRoleId && data[0]?.id) setSelectedRoleId(data[0].id);
    } catch (error) {
      toast('Failed to load roles: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoles(); }, []);

  useEffect(() => {
    if (!selectedRoleId) return;
    getRolePermissions(selectedRoleId).then(rows => {
      const next = {};
      MODULE_KEYS.forEach(moduleKey => {
        next[moduleKey] = {};
        PERMISSION_ACTIONS.forEach(actionKey => {
          next[moduleKey][actionKey] = false;
        });
      });
      rows.forEach(row => {
        if (!next[row.module_key]) next[row.module_key] = {};
        next[row.module_key][row.action_key] = Boolean(row.allowed);
      });
      setMatrix(next);
    }).catch(error => toast('Failed to load permissions: ' + error.message, 'error'));
  }, [selectedRoleId]);

  const selectedRole = useMemo(
    () => roles.find(role => role.id === selectedRoleId) || null,
    [roles, selectedRoleId]
  );

  const setPermission = (moduleKey, actionKey, allowed) => {
    setMatrix(previous => ({
      ...previous,
      [moduleKey]: {
        ...(previous[moduleKey] || {}),
        [actionKey]: allowed,
      },
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveRolePermissions(selectedRoleId, matrix);
      toast('Permissions saved');
    } catch (error) {
      toast('Failed: ' + error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const addRole = async () => {
    const name = newRoleName.trim();
    if (!name) return toast('Enter a role name', 'error');
    try {
      const role = await createCompanyRole({ name });
      setRoles(previous => [...previous, role]);
      setSelectedRoleId(role.id);
      setNewRoleName('');
      toast('Role created');
    } catch (error) {
      toast('Failed: ' + error.message, 'error');
    }
  };

  return (
    <div>
      <ToastContainer />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 7 }}><ShieldCheck size={16} /> Roles & Permissions</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Control module actions, costing visibility and Report Designer access.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0,1fr)', gap: 14 }} className="permission-layout">
        <div>
          <div className="field">
            <label>Role</label>
            <select value={selectedRoleId} onChange={event => setSelectedRoleId(event.target.value)} disabled={loading}>
              <option value="">Select role</option>
              {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <input value={newRoleName} onChange={event => setNewRoleName(event.target.value)} placeholder="New role" />
            <button className="btn btn-secondary" onClick={addRole}><Plus size={13} /></button>
          </div>
          {selectedRole?.is_system && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Default system role</p>}
        </div>

        <div className="data-table-wrap">
          <table className="data-table" style={{ minWidth: 920 }}>
            <thead>
              <tr>
                <th>Module</th>
                {PERMISSION_ACTIONS.map(action => <th key={action} style={{ textAlign: 'center' }}>{ACTION_LABELS[action]}</th>)}
              </tr>
            </thead>
            <tbody>
              {MODULE_KEYS.map(moduleKey => (
                <tr key={moduleKey}>
                  <td><strong>{MODULE_LABELS[moduleKey] || moduleKey}</strong></td>
                  {PERMISSION_ACTIONS.map(actionKey => (
                    <td key={actionKey} style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(matrix[moduleKey]?.[actionKey])}
                        onChange={event => setPermission(moduleKey, actionKey, event.target.checked)}
                        disabled={!selectedRoleId || selectedRole?.code === 'OWNER'}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={save} disabled={saving || !selectedRoleId || selectedRole?.code === 'OWNER'}>
        <Save size={14} /> {saving ? 'Saving...' : 'Save Permissions'}
      </button>

      <style>{`
        @media (max-width: 820px) {
          .permission-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
