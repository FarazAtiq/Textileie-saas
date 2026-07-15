import { useEffect, useState } from 'react';
import { MailPlus, Save, UserCheck, UserX } from 'lucide-react';
import {
  createUserInvitation,
  getCompanyFactoriesAndDepartments,
  getCompanyRoles,
  getCompanyUsers,
  updateCompanyUserAccess,
} from '../lib/db.js';
import { useToast } from '../hooks/useToast.jsx';

export default function UserManagement() {
  const { toast, ToastContainer } = useToast();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [factories, setFactories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [invite, setInvite] = useState({ email: '', role_id: '', factory_id: '', department_id: '' });
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [userRows, roleRows, masters] = await Promise.all([
        getCompanyUsers(),
        getCompanyRoles(),
        getCompanyFactoriesAndDepartments(),
      ]);
      setUsers(userRows);
      setRoles(roleRows);
      setFactories(masters.factories);
      setDepartments(masters.departments);
      if (!invite.role_id && roleRows[0]?.id) setInvite(previous => ({ ...previous, role_id: roleRows[0].id }));
    } catch (error) {
      toast('Failed to load users: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sendInvitation = async () => {
    if (!invite.email.trim()) return toast('Email is required', 'error');
    if (!invite.role_id) return toast('Role is required', 'error');

    setInviting(true);
    try {
      await createUserInvitation(invite);
      setInvite(previous => ({ ...previous, email: '' }));
      toast('Invitation record created');
    } catch (error) {
      toast('Failed: ' + error.message, 'error');
    } finally {
      setInviting(false);
    }
  };

  const update = async (row, patch) => {
    try {
      const saved = await updateCompanyUserAccess(row.id, { ...row, ...patch });
      setUsers(previous => previous.map(item => item.id === row.id ? { ...item, ...saved } : item));
      toast('User access updated');
    } catch (error) {
      toast('Failed: ' + error.message, 'error');
    }
  };

  return (
    <div>
      <ToastContainer />
      <h3>User Management</h3>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, marginBottom: 16 }}>
        Assign roles, departments and factories. Invitation email delivery requires the included Supabase Edge Function or your preferred email provider.
      </p>

      <div className="card" style={{ padding: 14, background: 'var(--bg)', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px,1.4fr) repeat(3,minmax(130px,1fr)) auto', gap: 8 }}>
          <input type="email" value={invite.email} onChange={event => setInvite(previous => ({ ...previous, email: event.target.value }))} placeholder="user@factory.com" />
          <select value={invite.role_id} onChange={event => setInvite(previous => ({ ...previous, role_id: event.target.value }))}>
            <option value="">Role</option>{roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
          <select value={invite.factory_id} onChange={event => setInvite(previous => ({ ...previous, factory_id: event.target.value }))}>
            <option value="">All factories</option>{factories.map(factory => <option key={factory.id} value={factory.id}>{factory.name}</option>)}
          </select>
          <select value={invite.department_id} onChange={event => setInvite(previous => ({ ...previous, department_id: event.target.value }))}>
            <option value="">All departments</option>{departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}
          </select>
          <button className="btn btn-primary" onClick={sendInvitation} disabled={inviting}><MailPlus size={14} />{inviting ? 'Saving...' : 'Invite'}</button>
        </div>
      </div>

      {loading ? <div className="empty-state"><p>Loading users...</p></div> : (
        <div className="data-table-wrap">
          <table className="data-table" style={{ minWidth: 900 }}>
            <thead><tr><th>User</th><th>Role</th><th>Factory</th><th>Department</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {users.map(row => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.profiles?.full_name || row.invited_email || 'User'}</strong>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.invited_email || ''}</div>
                  </td>
                  <td>
                    <select value={row.role_id || ''} onChange={event => update(row, { role_id: event.target.value })}>
                      {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={row.factory_id || ''} onChange={event => update(row, { factory_id: event.target.value || null })}>
                      <option value="">All</option>{factories.map(factory => <option key={factory.id} value={factory.id}>{factory.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={row.department_id || ''} onChange={event => update(row, { department_id: event.target.value || null })}>
                      <option value="">All</option>{departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}
                    </select>
                  </td>
                  <td>{row.status}</td>
                  <td>
                    <button className={row.status === 'Active' ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm'}
                      onClick={() => update(row, { status: row.status === 'Active' ? 'Inactive' : 'Active' })}>
                      {row.status === 'Active' ? <UserX size={12} /> : <UserCheck size={12} />}
                      {row.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 28 }}>No configured company users yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
