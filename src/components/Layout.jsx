import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Bell, Building2, ChevronDown, CircleHelp, Clock3, DollarSign,
  Factory, FileBarChart2, FolderKanban, Gauge, LayoutDashboard,
  Layers3, LogOut, Menu, PackageSearch, Scissors, Search, Settings,
  ShieldCheck, Sparkles, TrendingUp, UserRound, X, ClipboardList
} from 'lucide-react';
import { useMemo, useState } from 'react';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Command Center', module: 'dashboard' }],
  },
  {
    label: 'Product Engineering',
    items: [
      { to: '/styles', icon: FolderKanban, label: 'Style Master', module: 'styles' },
      { to: '/fabric-master', icon: Layers3, label: 'Fabric Master', module: 'fabric_master' },
      { to: '/stitch-master', icon: Scissors, label: 'Stitch Master', module: 'stitch_master' },
      { to: '/thread-master', icon: PackageSearch, label: 'Thread Master', module: 'thread_master' },
    ],
  },
  {
    label: 'Industrial Engineering',
    items: [
      { to: '/smv', icon: Clock3, label: 'SMV / SAM', module: 'smv' },
      { to: '/efficiency', icon: TrendingUp, label: 'Efficiency', module: 'efficiency' },
      { to: '/capacity', icon: Factory, label: 'Capacity Planning', module: 'capacity' },
      { to: '/thread', icon: Scissors, label: 'Thread Engineering', module: 'thread_engineering' },
      { to: '/fabric', icon: Layers3, label: 'Fabric Engineering', module: 'fabric_engineering' },
    ],
  },
  {
    label: 'Planning',
    items: [
      { to: '/export-orders', icon: ClipboardList, label: 'Export Orders', module: 'export_orders' },
    ],
  },
  {
    label: 'Commercial',
    items: [
      { to: '/costing', icon: DollarSign, label: 'Garment Costing', module: 'costing' },
      { to: '/reports', icon: FileBarChart2, label: 'Reports & Analytics', module: 'reports' },
    ],
  },
  {
    label: 'Administration',
    items: [{ to: '/settings', icon: Settings, label: 'Administration', module: 'administration' }],
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
  '/export-orders': 'Export Orders',
  '/export-order': 'Export Orders',
  '/reports': 'Reports & Analytics',
  '/settings': 'Administration',
};

function SidebarContent({ profile, user, role, can, onNavigate, onLogout }) {
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
        {NAV_GROUPS.map(group => {
          const visibleItems = group.items.filter(item => !item.module || can(item.module, 'view'));
          if (!visibleItems.length) return null;
          return (
          <div className="nav-group" key={group.label}>
            <div className="nav-group-label">{group.label}</div>
            {visibleItems.map(item => {
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
        )})}
      </nav>

      <div className="sidebar-footer">
        <div className="user-panel">
          <div className="user-avatar">{(profile?.full_name || user?.email || 'U').slice(0, 1).toUpperCase()}</div>
          <div className="user-panel-copy">
            <strong>{profile?.full_name || 'TextileIE User'}</strong>
            <span>{user?.email || ''}</span>
            <span>{role?.name || 'Owner'}</span>
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
  const { user, profile, role, logout, can } = useAuth();
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
        <SidebarContent profile={profile} user={user} role={role} can={can} onLogout={handleLogout} />
      </aside>

      {mobileOpen && (
        <div className="mobile-drawer-shell">
          <button className="mobile-drawer-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
          <aside className="mobile-drawer">
            <button className="mobile-drawer-close" onClick={() => setMobileOpen(false)}><X size={20} /></button>
            <SidebarContent
              profile={profile}
              user={user}
              role={role}
              can={can}
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
