import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, TrendingUp, Factory, Clock, Layers,
  Scissors, DollarSign, FileText, LogOut, Hash, Settings
} from 'lucide-react';

const NAV = [
  { section: 'Overview' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/reports',   icon: FileText,        label: 'Reports' },
  { section: 'IE Calculators' },
  { to: '/efficiency', icon: TrendingUp, label: 'Efficiency' },
  { to: '/capacity',   icon: Factory,    label: 'Capacity' },
  { to: '/smv',        icon: Clock,      label: 'SMV / SAM' },
  { to: '/fabric',     icon: Layers,     label: 'Fabric' },
  { to: '/thread',     icon: Scissors,   label: 'Thread' },
  { to: '/costing',    icon: DollarSign, label: 'Costing' },
  { to: '/yarn',       icon: Hash,       label: 'Yarn Count' },
  { section: 'Account' },
  { to: '/settings',   icon: Settings,   label: 'Settings' },
];

export function Layout({ children }) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{
        width: 220, background: 'var(--navy)', color: 'white',
        display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, background: 'var(--teal)', borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0
            }}>🧵</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>TextileIE</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>IE Suite v2</div>
            </div>
          </div>
        </div>

        {/* Company pill */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Company</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{profile?.company_name || '—'}</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '6px 0' }}>
          {NAV.map((item, i) => {
            if (item.section) return (
              <div key={i} style={{ padding: '12px 16px 4px', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {item.section}
              </div>
            );
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '7px 16px', textDecoration: 'none', fontSize: 13,
                color: isActive ? 'white' : 'rgba(255,255,255,0.52)',
                background: isActive ? 'rgba(13,122,107,0.32)' : 'transparent',
                borderLeft: `3px solid ${isActive ? 'var(--teal)' : 'transparent'}`,
                transition: 'all 0.12s'
              })}>
                <Icon size={14} />{item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{profile?.full_name || user?.email}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 10, marginTop: 1 }}>{user?.email}</div>
          <button onClick={async () => { await logout(); navigate('/login'); }}
            className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,0.4)', width: '100%', justifyContent: 'flex-start' }}>
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  );
}
