import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const [mode, setMode]   = useState('login');
  const [form, setForm]   = useState({ email: '', password: '', full_name: '', company_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        navigate('/dashboard');
      } else {
        await register(form);
        setSuccess('Account created! Check your email to confirm, then sign in.');
        setMode('login');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F2942 0%, #1A3A5C 55%, #0D3D35 100%)'
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 16px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 60, height: 60, background: 'var(--teal)', borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(13,122,107,0.4)'
          }}>🧵</div>
          <h1 style={{ color: 'white', fontSize: 24 }}>TextileIE</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 4 }}>Industrial Engineering Suite</p>
        </div>

        <div className="card" style={{ borderRadius: 18, boxShadow: 'var(--shadow-lg)' }}>
          {/* Mode tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: 22, marginTop: -4 }}>
            {[['login', 'Sign in'], ['register', 'Create account']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }} style={{
                flex: 1, padding: '10px 0', border: 'none', background: 'none',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                color: mode === m ? 'var(--teal)' : 'var(--text-muted)',
                borderBottom: mode === m ? '2px solid var(--teal)' : '2px solid transparent',
                marginBottom: -1
              }}>{label}</button>
            ))}
          </div>

          <form onSubmit={submit}>
            {mode === 'register' && (
              <>
                <div className="field"><label>Full name</label><input value={form.full_name} onChange={set('full_name')} placeholder="Muhammad Ali" required /></div>
                <div className="field"><label>Company / factory name</label><input value={form.company_name} onChange={set('company_name')} placeholder="Al-Karam Textiles" required /></div>
              </>
            )}
            <div className="field"><label>Email address</label><input type="email" value={form.email} onChange={set('email')} placeholder="you@factory.com" required /></div>
            <div className="field" style={{ marginBottom: 20 }}>
              <label>Password</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Min. 6 characters" required minLength={6} />
            </div>

            {error   && <div style={{ color: 'var(--red)',   fontSize: 12, marginBottom: 12, padding: '8px 12px', background: 'var(--red-light)',   borderRadius: 8 }}>{error}</div>}
            {success && <div style={{ color: 'var(--green)', fontSize: 12, marginBottom: 12, padding: '8px 12px', background: 'var(--green-light)', borderRadius: 8 }}>{success}</div>}

            <button type="submit" className="btn btn-primary btn-full" style={{ fontSize: 14, padding: '10px' }} disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 20 }}>
          Powered by Supabase + Vercel · Made for Pakistan 🇵🇰 textile industry
        </p>
      </div>
    </div>
  );
}
