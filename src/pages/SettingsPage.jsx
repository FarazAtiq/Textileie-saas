import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { updateProfile } from '../lib/db.js';
import { supabase } from '../lib/supabase.js';
import { useToast } from '../hooks/useToast.jsx';
import { PageHeader } from '../components/ResultCard.jsx';
import { User, Building2, Lock, Info } from 'lucide-react';

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast, ToastContainer } = useToast();

  const [profileForm, setProfileForm] = useState({
    full_name:    profile?.full_name    || '',
    company_name: profile?.company_name || '',
  });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw]           = useState(false);

  const setP = k => e => setProfileForm(f => ({ ...f, [k]: e.target.value }));
  const setPw = k => e => setPwForm(f => ({ ...f, [k]: e.target.value }));

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.full_name.trim() || !profileForm.company_name.trim()) {
      toast('Name and company are required', 'error'); return;
    }
    setSavingProfile(true);
    try {
      await updateProfile(user.id, profileForm);
      await refreshProfile();
      toast('Profile updated successfully');
    } catch (err) { toast(err.message || 'Failed to update', 'error'); }
    finally { setSavingProfile(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPw.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
    if (pwForm.newPw !== pwForm.confirm) { toast('Passwords do not match', 'error'); return; }
    setSavingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.newPw });
      if (error) throw error;
      toast('Password changed successfully');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) { toast(err.message || 'Failed to change password', 'error'); }
    finally { setSavingPw(false); }
  };

  return (
    <div>
      <ToastContainer />
      <PageHeader title="Settings" subtitle="Manage your account and company details" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 860 }}>

        {/* Profile */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, background: 'var(--teal-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} color="var(--teal)" />
            </div>
            <h3>Profile information</h3>
          </div>
          <form onSubmit={saveProfile}>
            <div className="field">
              <label>Full name</label>
              <input value={profileForm.full_name} onChange={setP('full_name')} placeholder="Your full name" required />
            </div>
            <div className="field">
              <label>Email address</label>
              <input value={user?.email || ''} disabled style={{ background: 'var(--bg)', color: 'var(--text-muted)' }} />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Email cannot be changed here</p>
            </div>
            <div className="field" style={{ marginBottom: 20 }}>
              <label>Member since</label>
              <input value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} disabled style={{ background: 'var(--bg)', color: 'var(--text-muted)' }} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </div>

        {/* Company */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, background: 'var(--blue-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={16} color="var(--blue)" />
            </div>
            <h3>Company details</h3>
          </div>
          <form onSubmit={saveProfile}>
            <div className="field" style={{ marginBottom: 20 }}>
              <label>Company / factory name</label>
              <input value={profileForm.company_name} onChange={setP('company_name')} placeholder="Al-Karam Textiles" required />
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>This appears on your PDF reports</p>
            </div>
            <div className="field" style={{ marginBottom: 20 }}>
              <label>Plan</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--teal-light)', borderRadius: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--teal)' }}>Free plan</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>· Unlimited calculations & reports</span>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save company details'}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, background: 'var(--amber-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={16} color="var(--amber)" />
            </div>
            <h3>Change password</h3>
          </div>
          <form onSubmit={changePassword}>
            <div className="field">
              <label>New password</label>
              <input type="password" value={pwForm.newPw} onChange={setPw('newPw')} placeholder="Min. 6 characters" required minLength={6} />
            </div>
            <div className="field" style={{ marginBottom: 20 }}>
              <label>Confirm new password</label>
              <input type="password" value={pwForm.confirm} onChange={setPw('confirm')} placeholder="Repeat new password" required />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={savingPw}>
              {savingPw ? 'Changing...' : 'Change password'}
            </button>
          </form>
        </div>

        {/* App info */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, background: 'var(--green-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Info size={16} color="var(--green)" />
            </div>
            <h3>App information</h3>
          </div>
          {[
            ['App name',    'TextileIE — IE Suite v2'],
            ['Version',     '2.0.0'],
            ['Backend',     'Supabase (PostgreSQL)'],
            ['Hosting',     'Vercel'],
            ['Calculators', '7 IE formulas'],
            ['Export',      'PDF reports (jsPDF)'],
            ['Support',     'textileie@yourcompany.com'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{v}</span>
            </div>
          ))}
        </div>

      </div>

      {/* Danger zone */}
      <div className="card" style={{ marginTop: 24, maxWidth: 860, border: '1px solid var(--red-light)' }}>
        <h3 style={{ color: 'var(--red)', marginBottom: 8 }}>Danger zone</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
          Deleting your account will permanently remove all your reports, SMV templates, and data. This cannot be undone.
        </p>
        <button className="btn btn-danger" onClick={() => toast('To delete your account, please contact support.', 'error')}>
          Delete my account
        </button>
      </div>
    </div>
  );
}
