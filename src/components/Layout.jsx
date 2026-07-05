import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard, FolderOpen, TrendingUp, Factory, Clock, Layers,
  Scissors, DollarSign, FileText, LogOut, Hash, Settings, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const NAV = [
  { section: 'Overview' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/styles', icon: FolderOpen, label: 'Style Master' },
  { to: '/fabric-master', icon: Layers, label: 'Fabric Master' },
  { to: '/reports',   icon: FileText,        label: 'Reports' },
  { section: 'IE Calculators' },
  { to: '/efficiency', icon: TrendingUp, label: 'Efficiency' },
  { to: '/capacity',   icon: Factory,    label: 'Capacity' },
  { to: '/smv',        icon: Clock,      label: 'SMV / SAM' },
  { to: '/fabric',     icon: Layers,     label: 'Fabric' },
  { to: '/thread',     icon: Scissors,   label: 'Thread' },
  { to: '/costing',    icon: DollarSign, label: 'Costing' },
  { section: 'Account' },
  { to: '/settings',   icon: Settings,   label: 'Settings' },
];

const BOTTOM_NAV = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Home' },
  { to: '/efficiency', icon: TrendingUp,      label: 'Efficiency' },
  { to: '/capacity',   icon: Factory,         label: 'Capacity' },
  { to: '/smv',        icon: Clock,           label: 'SMV' },
  { to: '/reports',    icon: FileText,        label: 'Reports' },
];

export function Layout({ children }) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside style={{
        width: 220, background: 'var(--navy)', color: 'white',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        overflowY: 'auto',
        // Hide on mobile
        '@media (max-width: 768px)': { display: 'none' }
      }}
        className="desktop-sidebar"
      >
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, background: 'var(--teal)', borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, flexShrink: 0
            }}>🧵</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>TextileIE</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>IE Suite v2</div>
            </div>
          </div>
        </div>

        {/* Company */}
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
                borderLeft: '3px solid ' + (isActive ? 'var(--teal)' : 'transparent'),
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
          <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,0.4)', width: '100%', justifyContent: 'flex-start' }}>
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile overlay menu ──────────────────────────── */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex'
        }}>
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }}
          />
          {/* Drawer */}
          <div style={{
            position: 'relative', width: 260, background: 'var(--navy)',
            color: 'white', display: 'flex', flexDirection: 'column',
            overflowY: 'auto', zIndex: 1001
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 30, height: 30, background: 'var(--teal)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🧵</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>TextileIE</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{profile?.company_name}</div>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <nav style={{ flex: 1, padding: '6px 0' }}>
              {NAV.map((item, i) => {
                if (item.section) return (
                  <div key={i} style={{ padding: '12px 16px 4px', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {item.section}
                  </div>
                );
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 16px', textDecoration: 'none', fontSize: 14,
                      color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
                      background: isActive ? 'rgba(13,122,107,0.32)' : 'transparent',
                      borderLeft: '3px solid ' + (isActive ? 'var(--teal)' : 'transparent'),
                    })}>
                    <Icon size={16} />{item.label}
                  </NavLink>
                );
              })}
            </nav>

            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{profile?.full_name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>{user?.email}</div>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ color: 'rgba(255,255,255,0.5)', width: '100%', justifyContent: 'flex-start' }}>
                <LogOut size={13} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Mobile top bar */}
        <div className="mobile-topbar" style={{
          display: 'none',
          background: 'var(--navy)', color: 'white',
          padding: '12px 16px',
          alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <button onClick={() => setMobileMenuOpen(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}>
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🧵</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>TextileIE</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{profile?.company_name?.split(' ')[0]}</div>
        </div>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: 'var(--bg)' }}
          className="main-content">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <div className="mobile-bottom-nav" style={{
          display: 'none',
          background: 'var(--navy)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex' }}>
            {BOTTOM_NAV.map(item => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '10px 4px 8px', textDecoration: 'none',
                  color: isActive ? 'var(--teal)' : 'rgba(255,255,255,0.45)',
                  fontSize: 10, gap: 4, fontWeight: isActive ? 600 : 400,
                  borderTop: isActive ? '2px solid var(--teal)' : '2px solid transparent'
                })}>
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile CSS */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-topbar { display: flex !important; }
          .mobile-bottom-nav { display: block !important; }
          .main-content { padding: 16px !important; }
        }
        @media (min-width: 769px) {
          .mobile-topbar { display: none !important; }
          .mobile-bottom-nav { display: none !important; }
          .desktop-sidebar { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
