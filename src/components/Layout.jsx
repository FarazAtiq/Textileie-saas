import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Bell, Building2, ChevronDown, CircleHelp, Clock3, DollarSign,
  Factory, FileBarChart2, FolderKanban, Gauge, LayoutDashboard,
  Layers3, LogOut, Menu, PackageSearch, Scissors, Search, Settings,
  ShieldCheck, Sparkles, TrendingUp, UserRound, X
} from 'lucide-react';
import { useMemo, useState } from 'react';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Command Center' }],
  },
  {
    label: 'Product Engineering',
    items: [
      { to: '/styles', icon: FolderKanban, label: 'Style Master' },
      { to: '/fabric-master', icon: Layers3, label: 'Fabric Master' },
      { to: '/stitch-master', icon: Scissors, label: 'Stitch Master' },
      { to: '/thread-master', icon: PackageSearch, label: 'Thread Master' },
    ],
  },
  {
    label: 'Industrial Engineering',
    items: [
      { to: '/smv', icon: Clock3, label: 'SMV / SAM' },
      { to: '/efficiency', icon: TrendingUp, label: 'Efficiency' },
      { to: '/capacity', icon: Factory, label: 'Capacity Planning' },
      { to: '/thread', icon: Scissors, label: 'Thread Engineering' },
      { to: '/fabric', icon: Layers3, label: 'Fabric Engineering' },
    ],
  },
  {
    label: 'Commercial',
    items: [
      { to: '/costing', icon: DollarSign, label: 'Garment Costing' },
      { to: '/reports', icon: FileBarChart2, label: 'Reports & Analytics' },
    ],
  },
  {
    label: 'Administration',
    items: [{ to: '/settings', icon: Settings, label: 'Admin Settings' }],
  },
];

const PAGE_TITLES = {
  '/dashboard': 'Command Center',
  '/styles': 'Style Master',
  '/fabric-master': 'Fabric Master',
  '/stitch-master': 'Stitch Master',
  '/thread-master': 'Thread Master',
  '/smv': 'SMV / SAM',
  '/efficiency': 'Efficiency',
  '/capacity': 'Capacity Planning',
  '/thread': 'Thread Engineering',
  '/fabric': 'Fabric Engineering',
  '/costing': 'Garment Costing',
  '/reports': 'Reports & Analytics',
  '/settings': 'Admin Settings',
};

function SidebarContent({ profile, user, onNavigate, onLogout }) {
  return (
    <>
      <div className="app-brand">
        <div className="app-brand-mark">T</div>
        <div>
          <div className="app-brand-name">TextileIE</div>
          <div className="app-brand-subtitle">Engineering Intelligence</div>
        </div>
      </div>

      <div className="tenant-card">
        <div className="tenant-icon"><Building2 size={15} /></div>
        <div className="tenant-copy">
          <span>Active company</span>
          <strong>{profile?.company_name || 'Textile Factory'}</strong>
        </div>
        <ChevronDown size={14} className="tenant-chevron" />
      </div>

      <nav className="app-nav">
        {NAV_GROUPS.map(group => (
          <div className="nav-group" key={group.label}>
            <div className="nav-group-label">{group.label}</div>
            {group.items.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-panel">
          <div className="user-avatar">{(profile?.full_name || user?.email || 'U').slice(0, 1).toUpperCase()}</div>
          <div className="user-panel-copy">
            <strong>{profile?.full_name || 'TextileIE User'}</strong>
            <span>{user?.email || ''}</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={onLogout}>
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </>
  );
}

export function Layout({ children }) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const pageTitle = useMemo(() => PAGE_TITLES[location.pathname] || 'TextileIE', [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <SidebarContent profile={profile} user={user} onLogout={handleLogout} />
      </aside>

      {mobileOpen && (
        <div className="mobile-drawer-shell">
          <button className="mobile-drawer-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
          <aside className="mobile-drawer">
            <button className="mobile-drawer-close" onClick={() => setMobileOpen(false)}><X size={20} /></button>
            <SidebarContent
              profile={profile}
              user={user}
              onNavigate={() => setMobileOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}

      <section className="app-workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu-button" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <div>
              <div className="breadcrumb-row">
                <span>TextileIE</span><span>/</span><strong>{pageTitle}</strong>
              </div>
              <div className="topbar-page-title">{pageTitle}</div>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="global-search">
              <Search size={16} />
              <input placeholder="Search styles, reports, modules..." />
              <kbd>鈱� K</kbd>
            </div>
            <button className="icon-button" title="Help"><CircleHelp size={18} /></button>
            <button className="icon-button notification-button" title="Notifications">
              <Bell size={18} /><span className="notification-dot" />
            </button>
            <div className="topbar-user">
              <div className="topbar-user-avatar"><UserRound size={16} /></div>
              <div>
                <strong>{profile?.full_name || 'User'}</strong>
                <span>Factory workspace</span>
              </div>
              <ChevronDown size={14} />
            </div>
          </div>
        </header>

        <main className="app-main">
          <div className="workspace-status">
            <div><ShieldCheck size={15} /> Enterprise workspace</div>
            <div><Sparkles size={15} /> Core platform + customizable modules</div>
          </div>
          {children}
        </main>
      </section>
    </div>
  );
}
