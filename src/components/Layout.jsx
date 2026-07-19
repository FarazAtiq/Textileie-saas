import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Bell, Building2, ChevronDown, CircleHelp, Clock3, DollarSign,
  Factory, FileBarChart2, FolderKanban, Gauge, LayoutDashboard,
  Layers3, LogOut, Menu, PackageSearch, Scissors, Search, Settings,
  ShieldCheck, Sparkles, TrendingUp, UserRound, X, ClipboardList,
  ListChecks, FileText
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const NAV_GROUPS = [
  {
    label: 'TextileIE Platform',
    platformOnly: true,
    items: [
      { to: '/platform', icon: Gauge, label: 'Control Center' },
      { to: '/platform-admin', icon: ShieldCheck, label: 'Company Licensing' },
    ],
  },
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
      { to: '/fabric-requirements', icon: ListChecks, label: 'Fabric Requirements', module: 'fabric_requirements' },
      { to: '/thread-requirements', icon: Scissors, label: 'Thread Requirements', module: 'thread_requirements' },
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
  '/fabric-requirements': 'Fabric Requirements',
  '/thread-requirements': 'Thread Requirements',
  '/reports': 'Reports & Analytics',
  '/settings': 'Administration',
  '/platform': 'TextileIE Control Center',
  '/platform-admin': 'Company Licensing',
};

function SidebarContent({ profile, user, role, access, can, onNavigate, onLogout }) {
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
          if (group.platformOnly && !access?.isPlatformAdmin) return null;
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


const SEARCH_ITEMS = NAV_GROUPS.flatMap(group =>
  group.items.map(item => ({
    ...item,
    group: group.label,
  }))
);

function useOutsideClose(ref, onClose) {
  useEffect(() => {
    const handler = event => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, onClose]);
}

export function Layout({ children }) {
  const { user, profile, role, access, logout, can } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useRef(null);
  const helpRef = useRef(null);
  const notificationRef = useRef(null);
  const profileRef = useRef(null);

  const pageTitle = useMemo(
    () => PAGE_TITLES[location.pathname] || 'TextileIE',
    [location.pathname]
  );

  const filteredSearchItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return SEARCH_ITEMS
      .filter(item => {
        const group = NAV_GROUPS.find(navGroup => navGroup.label === item.group);
        return !group?.platformOnly || access?.isPlatformAdmin;
      })
      .filter(item => !item.module || can(item.module, 'view'))
      .filter(item =>
        !query ||
        `${item.label} ${item.group} ${item.to}`
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 8);
  }, [searchQuery, can, access?.isPlatformAdmin]);

  useOutsideClose(searchRef, () => setSearchOpen(false));
  useOutsideClose(helpRef, () => setHelpOpen(false));
  useOutsideClose(notificationRef, () => setNotificationsOpen(false));
  useOutsideClose(profileRef, () => setProfileOpen(false));

  useEffect(() => {
    const handler = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
        requestAnimationFrame(() => {
          searchRef.current?.querySelector('input')?.focus();
        });
      }

      if (event.key === 'Escape') {
        setSearchOpen(false);
        setHelpOpen(false);
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setHelpOpen(false);
    setNotificationsOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const openSearchItem = item => {
    setSearchQuery('');
    setSearchOpen(false);
    navigate(item.to);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <SidebarContent profile={profile} user={user} role={role} access={access} can={can} onLogout={handleLogout} />
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
              access={access}
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
            <div className="global-search" ref={searchRef}>
              <Search size={16} />
              <input
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={event => {
                  setSearchQuery(event.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search styles, reports, modules..."
                aria-label="Global navigation search"
              />
              <kbd>Ctrl K</kbd>

              {searchOpen && (
                <div className="header-popover global-search-results">
                  <div className="header-popover-title">Quick navigation</div>
                  {filteredSearchItems.length ? (
                    filteredSearchItems.map(item => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.to}
                          type="button"
                          className="header-popover-item"
                          onClick={() => openSearchItem(item)}
                        >
                          <span className="header-popover-icon">
                            <Icon size={15} />
                          </span>
                          <span>
                            <strong>{item.label}</strong>
                            <small>{item.group}</small>
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="header-popover-empty">
                      No matching module found.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="header-action-wrap" ref={helpRef}>
              <button
                className="icon-button"
                title="Help"
                onClick={() => {
                  setHelpOpen(previous => !previous);
                  setNotificationsOpen(false);
                  setProfileOpen(false);
                }}
              >
                <CircleHelp size={18} />
              </button>

              {helpOpen && (
                <div className="header-popover header-small-popover">
                  <div className="header-popover-title">Help & support</div>
                  <button
                    className="header-popover-item"
                    onClick={() => {
                      setHelpOpen(false);
                      navigate('/reports');
                    }}
                  >
                    <span className="header-popover-icon">
                      <FileText size={15} />
                    </span>
                    <span>
                      <strong>Reports & guidance</strong>
                      <small>Open reporting workspace</small>
                    </span>
                  </button>
                  <div className="header-popover-note">
                    TextileIE Engineering Workspace
                  </div>
                </div>
              )}
            </div>

            <div className="header-action-wrap" ref={notificationRef}>
              <button
                className="icon-button notification-button"
                title="Notifications"
                onClick={() => {
                  setNotificationsOpen(previous => !previous);
                  setHelpOpen(false);
                  setProfileOpen(false);
                }}
              >
                <Bell size={18} />
                <span className="notification-dot" />
              </button>

              {notificationsOpen && (
                <div className="header-popover header-small-popover">
                  <div className="header-popover-title">Notifications</div>
                  <div className="header-popover-empty">
                    No new notifications.
                  </div>
                </div>
              )}
            </div>

            <div className="header-action-wrap" ref={profileRef}>
              <button
                type="button"
                className="topbar-user topbar-user-button"
                onClick={() => {
                  setProfileOpen(previous => !previous);
                  setHelpOpen(false);
                  setNotificationsOpen(false);
                }}
              >
                <div className="topbar-user-avatar">
                  <UserRound size={16} />
                </div>
                <div>
                  <strong>{profile?.full_name || 'User'}</strong>
                  <span>{role?.name || 'Factory workspace'}</span>
                </div>
                <ChevronDown size={14} />
              </button>

              {profileOpen && (
                <div className="header-popover header-profile-popover">
                  <div className="profile-popover-head">
                    <div className="topbar-user-avatar">
                      {(profile?.full_name || user?.email || 'U')
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>
                    <div>
                      <strong>{profile?.full_name || 'TextileIE User'}</strong>
                      <small>{user?.email || ''}</small>
                    </div>
                  </div>

                  <button
                    className="header-popover-item"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/settings');
                    }}
                  >
                    <span className="header-popover-icon">
                      <Settings size={15} />
                    </span>
                    <span>
                      <strong>Administration</strong>
                      <small>Profile, company and report settings</small>
                    </span>
                  </button>

                  <button
                    className="header-popover-item danger"
                    onClick={handleLogout}
                  >
                    <span className="header-popover-icon">
                      <LogOut size={15} />
                    </span>
                    <span>
                      <strong>Sign out</strong>
                      <small>End this session</small>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <style>{`
          .header-action-wrap,
          .global-search {
            position: relative;
          }

          .topbar-user-button {
            border: 0;
            background: transparent;
            cursor: pointer;
            text-align: left;
          }

          .header-popover {
            position: absolute;
            top: calc(100% + 10px);
            right: 0;
            z-index: 1200;
            min-width: 290px;
            max-width: min(390px, calc(100vw - 32px));
            padding: 8px;
            border: 1px solid var(--border-light);
            border-radius: 13px;
            background: white;
            box-shadow: 0 18px 45px rgba(15, 39, 66, 0.18);
          }

          .global-search-results {
            left: 0;
            right: auto;
            width: 100%;
            min-width: 330px;
          }

          .header-small-popover,
          .header-profile-popover {
            min-width: 280px;
          }

          .header-popover-title {
            padding: 7px 9px;
            color: var(--text-muted);
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .header-popover-item {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 9px;
            border: 0;
            border-radius: 9px;
            background: transparent;
            color: var(--text);
            cursor: pointer;
            text-align: left;
          }

          .header-popover-item:hover {
            background: var(--bg);
          }

          .header-popover-item.danger {
            color: var(--red);
          }

          .header-popover-icon {
            width: 30px;
            height: 30px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            background: var(--teal-light);
            color: var(--teal);
            flex: 0 0 auto;
          }

          .header-popover-item span:last-child {
            display: grid;
            gap: 2px;
          }

          .header-popover-item strong {
            font-size: 12px;
          }

          .header-popover-item small,
          .profile-popover-head small {
            color: var(--text-muted);
            font-size: 10px;
          }

          .header-popover-empty,
          .header-popover-note {
            padding: 14px 10px;
            color: var(--text-muted);
            font-size: 11px;
          }

          .profile-popover-head {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            margin-bottom: 4px;
            border-bottom: 1px solid var(--border-light);
          }

          .profile-popover-head > div:last-child {
            display: grid;
            gap: 3px;
            min-width: 0;
          }

          @media (max-width: 780px) {
            .global-search {
              display: none;
            }

            .topbar-user-button > div:nth-child(2),
            .topbar-user-button > svg:last-child {
              display: none;
            }

            .header-popover {
              position: fixed;
              top: 74px;
              right: 12px;
              left: 12px;
              width: auto;
              max-width: none;
            }
          }
        `}</style>

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
