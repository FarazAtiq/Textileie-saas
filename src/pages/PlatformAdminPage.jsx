import { useEffect, useMemo, useState } from 'react';
import { Building2, Save, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import {
  MODULE_KEYS,
  getPlatformCompanies,
  setPlatformCompanyModule,
  updatePlatformCompanySubscription,
} from '../lib/db.js';
import { useToast } from '../hooks/useToast.jsx';
import { PageHeader } from '../components/ResultCard.jsx';

export default function PlatformAdminPage() {
  const { access } = useAuth();
  const { toast, ToastContainer } = useToast();
  const [companies, setCompanies] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const rows = await getPlatformCompanies();
      setCompanies(rows);
      if (!selectedId && rows[0]?.id) setSelectedId(rows[0].id);
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  useEffect(() => { if (access?.isPlatformAdmin) load(); }, [access?.isPlatformAdmin]);

  const selected = useMemo(
    () => companies.find(company => company.id === selectedId) || null,
    [companies, selectedId]
  );

  useEffect(() => {
    if (!selected) return;
    setForm({
      subscription_plan: selected.subscription_plan || 'Starter',
      subscription_status: selected.subscription_status || 'Active',
      licensed_users: Number(selected.licensed_users || 1),
      subscription_starts_at: selected.subscription_starts_at?.slice(0, 10) || '',
      subscription_expires_at: selected.subscription_expires_at?.slice(0, 10) || '',
      trial_ends_at: selected.trial_ends_at?.slice(0, 10) || '',
      suspension_reason: '',
    });
  }, [selected]);

  if (!access?.isPlatformAdmin) {
    return <div className="empty-state"><p>TextileIE Platform Administrator access is required.</p></div>;
  }

  const save = async () => {
    setSaving(true);
    try {
      await updatePlatformCompanySubscription(selectedId, form);
      toast('Company subscription updated');
      await load();
    } catch (error) {
      toast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = async (moduleKey, enabled) => {
    try {
      await setPlatformCompanyModule(selectedId, moduleKey, enabled);
      setCompanies(previous => previous.map(company => {
        if (company.id !== selectedId) return company;
        const existing = company.company_modules || [];
        const found = existing.find(row => row.module_key === moduleKey);
        return {
          ...company,
          company_modules: found
            ? existing.map(row => row.module_key === moduleKey ? { ...row, enabled } : row)
            : [...existing, { module_key: moduleKey, enabled }],
        };
      }));
    } catch (error) {
      toast(error.message, 'error');
    }
  };

  const moduleMap = Object.fromEntries(
    (selected?.company_modules || []).map(row => [row.module_key, Boolean(row.enabled)])
  );

  return (
    <div>
      <ToastContainer />
      <PageHeader
        title="TextileIE Platform Administration"
        subtitle="Control customer subscriptions, licensed seats and enabled modules"
        badge={{ text: 'Platform Admin' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0,1fr)', gap: 16 }}>
        <aside className="card" style={{ padding: 10 }}>
          {companies.map(company => (
            <button key={company.id} onClick={() => setSelectedId(company.id)} style={{
              width: '100%', border: 'none', borderRadius: 8, padding: 10,
              textAlign: 'left', marginBottom: 5, cursor: 'pointer',
              background: selectedId === company.id ? 'var(--teal-light)' : 'transparent',
            }}>
              <strong>{company.name}</strong>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {company.subscription_plan} · {company.subscription_status}
              </div>
            </button>
          ))}
        </aside>

        {selected && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <Building2 size={16} /> {selected.name}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
                <div className="field"><label>Plan</label><input value={form.subscription_plan || ''} onChange={e => setForm(p => ({ ...p, subscription_plan: e.target.value }))} /></div>
                <div className="field"><label>Status</label><select value={form.subscription_status || 'Active'} onChange={e => setForm(p => ({ ...p, subscription_status: e.target.value }))}><option>Trial</option><option>Active</option><option>Suspended</option><option>Expired</option><option>Cancelled</option></select></div>
                <div className="field"><label>Licensed users</label><input type="number" min="1" value={form.licensed_users || 1} onChange={e => setForm(p => ({ ...p, licensed_users: Number(e.target.value || 1) }))} /></div>
                <div className="field"><label>Starts</label><input type="date" value={form.subscription_starts_at || ''} onChange={e => setForm(p => ({ ...p, subscription_starts_at: e.target.value }))} /></div>
                <div className="field"><label>Expires</label><input type="date" value={form.subscription_expires_at || ''} onChange={e => setForm(p => ({ ...p, subscription_expires_at: e.target.value }))} /></div>
                <div className="field"><label>Trial ends</label><input type="date" value={form.trial_ends_at || ''} onChange={e => setForm(p => ({ ...p, trial_ends_at: e.target.value }))} /></div>
              </div>
              <button className="btn btn-primary" onClick={save} disabled={saving}><Save size={14} />{saving ? 'Saving...' : 'Save Subscription'}</button>
            </div>

            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                <ShieldCheck size={16} /> Licensed Modules
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 9 }}>
                {MODULE_KEYS.map(moduleKey => (
                  <label key={moduleKey} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    border: '1px solid var(--border-light)', borderRadius: 9, padding: '10px 12px'
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{moduleKey.replaceAll('_', ' ')}</span>
                    <input type="checkbox" checked={Boolean(moduleMap[moduleKey])} onChange={e => toggleModule(moduleKey, e.target.checked)} />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
