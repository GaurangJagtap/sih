import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  ShieldCheck, LayoutDashboard, FileText, ClipboardCheck,
  CalendarCheck, Clock, PhoneCall, Bell, LogOut, AlertTriangle,
  Layers, X, Menu, Activity, TrendingUp, Users, Settings,
  Search, HelpCircle, ChevronDown, MapPin, BookOpen, BarChart2,
  ListChecks, GitBranch, Radio
} from 'lucide-react';
import type { NotificationItem } from '../types';

/* ─── Navigation config by role ─── */
interface NavGroup {
  label: string;
  items: NavItem[];
}
interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  count?: number;
}

function getRoleNavGroups(
  role: string,
  region?: string,
  unreadCount?: number
): NavGroup[] {
  if (role === 'INSTITUTION') {
    return [
      {
        label: 'Overview',
        items: [
          { to: '/institution/dashboard', icon: <LayoutDashboard size={16} />, label: 'Institution Portal' },
        ],
      },
      {
        label: 'Applications',
        items: [
          { to: '/applications', icon: <FileText size={16} />, label: 'My Applications' },
        ],
      },
      {
        label: 'Compliance',
        items: [
          { to: '/compliance', icon: <ClipboardCheck size={16} />, label: 'Mandatory Undertakings' },
          { to: '/documents', icon: <Clock size={16} />, label: 'Document Validity' },
        ],
      },
      {
        label: 'Communication',
        items: [
          { to: '/voice-agent', icon: <PhoneCall size={16} />, label: 'AI Support Agent', badge: 'AI' },
        ],
      },
    ];
  }

  if (role === 'REGIONAL_OFFICER') {
    return [
      {
        label: 'Overview',
        items: [
          { to: '/admin/dashboard', icon: <LayoutDashboard size={16} />, label: `${region || 'Regional'} Dashboard` },
          { to: '/admin/dashboard', icon: <Activity size={16} />, label: 'Real-Time Monitoring' },
        ],
      },
      {
        label: 'Application Management',
        items: [
          { to: '/applications', icon: <FileText size={16} />, label: 'Regional Applications' },
          { to: '/evc', icon: <CalendarCheck size={16} />, label: 'EVC Scheduling' },
        ],
      },
      {
        label: 'Compliance',
        items: [
          { to: '/compliance', icon: <ClipboardCheck size={16} />, label: 'Institutional Undertakings' },
          { to: '/documents', icon: <Clock size={16} />, label: 'Document Validity' },
        ],
      },
      {
        label: 'Communication',
        items: [
          { to: '/escalations', icon: <AlertTriangle size={16} />, label: 'Escalation Management' },
          { to: '/voice-agent', icon: <PhoneCall size={16} />, label: 'AI Voice Dispatcher', badge: 'AI' },
        ],
      },
    ];
  }

  if (role === 'EVC_COMMITTEE') {
    return [
      {
        label: 'Overview',
        items: [
          { to: '/admin/dashboard', icon: <LayoutDashboard size={16} />, label: 'EVC Dashboard' },
        ],
      },
      {
        label: 'Inspections',
        items: [
          { to: '/evc', icon: <CalendarCheck size={16} />, label: 'Assigned Campus Visits' },
          { to: '/applications', icon: <FileText size={16} />, label: 'Inspection Cases' },
          { to: '/documents', icon: <Clock size={16} />, label: 'Site Documents & NOCs' },
        ],
      },
    ];
  }

  if (role === 'BUREAU_OFFICER' || role === 'SENIOR_AUTHORITY') {
    return [
      {
        label: 'Overview',
        items: [
          { to: '/admin/dashboard', icon: <LayoutDashboard size={16} />, label: 'Apex Bureau Dashboard' },
          { to: '/admin/dashboard', icon: <Activity size={16} />, label: 'Real-Time Monitoring' },
        ],
      },
      {
        label: 'Application Management',
        items: [
          { to: '/applications', icon: <FileText size={16} />, label: 'Final Sanctions Queue' },
        ],
      },
      {
        label: 'Compliance',
        items: [
          { to: '/compliance', icon: <ClipboardCheck size={16} />, label: 'National Compliance Registry' },
          { to: '/documents', icon: <Clock size={16} />, label: 'Document Validity' },
        ],
      },
      {
        label: 'Communication',
        items: [
          { to: '/escalations', icon: <AlertTriangle size={16} />, label: 'Appeals & Escalations' },
          { to: '/voice-agent', icon: <PhoneCall size={16} />, label: 'AI Regulatory Broadcast', badge: 'AI' },
        ],
      },
      {
        label: 'Administration',
        items: [
          { to: '/routes-config', icon: <GitBranch size={16} />, label: 'Workflow Route Engine' },
        ],
      },
    ];
  }

  // ADMIN / default
  return [
    {
      label: 'Overview',
      items: [
        { to: '/admin/dashboard', icon: <LayoutDashboard size={16} />, label: 'Executive Dashboard' },
        { to: '/admin/dashboard', icon: <Activity size={16} />, label: 'Real-Time Monitoring' },
      ],
    },
    {
      label: 'Application Management',
      items: [
        { to: '/applications', icon: <FileText size={16} />, label: 'All Applications' },
        { to: '/evc', icon: <CalendarCheck size={16} />, label: 'EVC Scheduling' },
      ],
    },
    {
      label: 'Compliance',
      items: [
        { to: '/compliance', icon: <ClipboardCheck size={16} />, label: 'Institutional Undertakings' },
        { to: '/documents', icon: <Clock size={16} />, label: 'Document Validity' },
      ],
    },
    {
      label: 'Communication',
      items: [
        { to: '/voice-agent', icon: <PhoneCall size={16} />, label: 'AI Voice Reminder Agent', badge: 'AI' },
        { to: '/escalations', icon: <AlertTriangle size={16} />, label: 'Escalation Management' },
      ],
    },
    {
      label: 'Analytics',
      items: [
        { to: '/admin/dashboard', icon: <BarChart2 size={16} />, label: 'Reports & Analytics' },
      ],
    },
    {
      label: 'Administration',
      items: [
        { to: '/routes-config', icon: <GitBranch size={16} />, label: 'Workflow Configuration' },
      ],
    },
  ];
}

/* ─── Role labels ─── */
const ROLE_LABELS: Record<string, string> = {
  INSTITUTION:      'Institution',
  REGIONAL_OFFICER: 'Regional Officer',
  BUREAU_OFFICER:   'Bureau Officer',
  EVC_COMMITTEE:    'EVC Committee',
  SENIOR_AUTHORITY: 'Senior Authority',
  ADMIN:            'Administrator',
};

/* ─── Page title from path ─── */
function getPageMeta(path: string, role: string) {
  const map: Record<string, { title: string; crumb: string }> = {
    '/admin/dashboard':      { title: 'Executive Dashboard', crumb: 'Dashboard' },
    '/institution/dashboard':{ title: 'Institution Portal',  crumb: 'Dashboard' },
    '/applications':         { title: 'Application Management', crumb: 'Applications' },
    '/compliance':           { title: 'Institutional Undertakings', crumb: 'Compliance' },
    '/evc':                  { title: 'EVC Scheduling', crumb: 'EVC' },
    '/documents':            { title: 'Document Validity & Renewal', crumb: 'Documents' },
    '/voice-agent':          { title: 'AI Voice Reminder Agent', crumb: 'Voice Agent' },
    '/escalations':          { title: 'Escalation Management', crumb: 'Escalations' },
    '/routes-config':        { title: 'Workflow Configuration', crumb: 'Config' },
  };
  const key = Object.keys(map).find(k => path.startsWith(k));
  return key ? map[key] : { title: 'AICTE Portal', crumb: 'Portal' };
}

/* ═══════════════════════════════════════
   SIDEBAR COMPONENT
   ═══════════════════════════════════════ */
interface SidebarProps {
  navGroups: NavGroup[];
  user: any;
  unreadCount: number;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ navGroups, user, unreadCount, onClose }) => {
  const { logout } = useAuth();

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--sidebar-bg)' }}
    >
      {/* ── Brand ── */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--sidebar-border)' }}>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 36, height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #2864A5 0%, #477FB8 100%)',
              boxShadow: '0 2px 8px rgba(40,100,165,0.40)',
            }}
          >
            <ShieldCheck size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2 }}>
              Approval Management
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 1, fontWeight: 500 }}>
              Regulatory Operations Portal
            </div>
          </div>
        </div>
      </div>

      {/* ── User Card ── */}
      <div style={{ padding: '12px 12px 6px' }}>
        <div
          className="flex items-center gap-2.5"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 10,
            padding: '10px 12px',
          }}
        >
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 32, height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #2864A5, #477FB8)',
              fontSize: 13, fontWeight: 700, color: '#fff',
            }}
          >
            {user?.full_name?.[0] ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <div style={{ fontSize: 12, fontWeight: 600, color: '#FFFFFF', lineHeight: 1.2 }} className="truncate">
              {user?.full_name ?? '—'}
            </div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.50)', marginTop: 2 }}>
              {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
              {user?.region ? ` · ${user.region}` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto" style={{ padding: '4px 8px' }}>
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="nav-group-label">{group.label}</div>
            {group.items.map((item) => (
              <NavLink
                key={item.to + item.label}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span style={{ flexShrink: 0, opacity: 0.85 }}>{item.icon}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                {item.badge && (
                  <span
                    style={{
                      fontSize: 9, fontWeight: 700,
                      padding: '2px 6px', borderRadius: 99,
                      background: '#477FB8',
                      color: '#fff',
                      letterSpacing: '0.04em',
                      flexShrink: 0,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span
                    style={{
                      fontSize: 10, fontWeight: 700,
                      minWidth: 18, height: 18,
                      padding: '0 5px',
                      borderRadius: 99,
                      background: 'rgba(198,76,76,0.85)',
                      color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* ── Regulatory Notice ── */}
      <div style={{ padding: '0 12px 10px' }}>
        <div
          style={{
            background: 'rgba(217,154,50,0.12)',
            border: '1px solid rgba(217,154,50,0.20)',
            borderRadius: 8,
            padding: '9px 11px',
          }}
        >
          <div className="flex items-start gap-2">
            <AlertTriangle size={12} color="rgba(217,154,50,0.9)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 10, color: 'rgba(217,154,50,0.85)', lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700, display: 'block' }}>Regulatory Notice</span>
              Statutory approvals remain with authorised AICTE officials. This system provides workflow support only.
            </div>
          </div>
        </div>
      </div>

      {/* ── Logout ── */}
      <div style={{ padding: '0 12px 16px', borderTop: '1px solid var(--sidebar-border)' }}>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 w-full"
          style={{
            marginTop: 10,
            padding: '8px 10px',
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            color: 'rgba(255,255,255,0.45)',
            fontSize: 12.5,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 150ms',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(198,76,76,0.15)';
            (e.currentTarget as HTMLElement).style.color = 'rgba(255,160,160,0.9)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)';
          }}
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   NOTIFICATION PANEL
   ═══════════════════════════════════════ */
const NotificationPanel: React.FC<{
  notifications: NotificationItem[];
  onClose: () => void;
}> = ({ notifications, onClose }) => {
  const unread = notifications.filter(n => !n.is_read);
  return (
    <div
      className="animate-scale"
      style={{
        position: 'absolute',
        right: 0,
        top: 'calc(100% + 8px)',
        width: 360,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-xl)',
        zIndex: 50,
        overflow: 'hidden',
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 13, fontWeight: 650, color: 'var(--navy-text)' }}>Notifications</span>
          {unread.length > 0 && (
            <span
              style={{
                fontSize: 10, fontWeight: 700,
                padding: '1px 7px', borderRadius: 99,
                background: 'var(--red)', color: '#fff',
              }}
            >
              {unread.length} new
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
        >
          <X size={15} />
        </button>
      </div>

      <div style={{ maxHeight: 340, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Bell size={20} color="var(--text-muted)" /></div>
            <div className="empty-title">No notifications</div>
            <div className="empty-desc">You're all caught up.</div>
          </div>
        ) : (
          notifications.slice(0, 12).map(n => (
            <div
              key={n.id}
              style={{
                padding: '11px 16px',
                borderBottom: '1px solid var(--bg-surface-2)',
                background: n.is_read ? 'transparent' : 'var(--blue-light)',
                transition: 'background 150ms',
              }}
            >
              <div className="flex items-start gap-2.5">
                <div
                  style={{
                    width: 6, height: 6, borderRadius: '50%',
                    marginTop: 5, flexShrink: 0,
                    background: n.is_read ? 'var(--border-strong)' : 'var(--blue-primary)',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>
                    {new Date(n.created_at).toLocaleString([], {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   MAIN LAYOUT
   ═══════════════════════════════════════ */
export const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, 18000);
    return () => clearInterval(t);
  }, [fetchNotifications]);

  useEffect(() => {
    setShowNotifications(false);
    setMobileSidebar(false);
  }, [location.pathname]);

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const navGroups = getRoleNavGroups(user?.role ?? 'ADMIN', user?.region, unreadCount);
  const pageMeta = getPageMeta(location.pathname, user?.role ?? '');

  // Breadcrumb — derive from path
  const pathParts = location.pathname.split('/').filter(Boolean);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>

      {/* ── Desktop Sidebar (fixed) ── */}
      <aside className="app-sidebar">
        <Sidebar navGroups={navGroups} user={user} unreadCount={unreadCount} />
      </aside>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileSidebar && (
        <div className="md:hidden" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(23,43,77,0.50)', backdropFilter: 'blur(2px)' }}
            onClick={() => setMobileSidebar(false)}
          />
          <aside style={{ position: 'relative', width: 250, height: '100%', boxShadow: 'var(--shadow-xl)' }}>
            <button
              onClick={() => setMobileSidebar(false)}
              style={{
                position: 'absolute', top: 12, right: 12, zIndex: 1,
                background: 'rgba(255,255,255,0.10)', border: 'none',
                borderRadius: 6, padding: 6, cursor: 'pointer', color: '#fff',
              }}
            >
              <X size={14} />
            </button>
            <Sidebar
              navGroups={navGroups}
              user={user}
              unreadCount={unreadCount}
              onClose={() => setMobileSidebar(false)}
            />
          </aside>
        </div>
      )}

      {/* ── Main content area ── */}
      <div className="app-main-wrapper">

        {/* ── Top Header ── */}
        <header className="app-header">
          {/* Mobile menu toggle */}
          <button
            className="md:hidden"
            onClick={() => setMobileSidebar(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 4 }}
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumb / page title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
              <ShieldCheck size={12} style={{ color: 'var(--blue-primary)', flexShrink: 0 }} />
              <span style={{ color: 'var(--blue-primary)', fontWeight: 600 }}>AICTE</span>
              <span>/</span>
              <span>{pageMeta.crumb}</span>
              {location.pathname.includes('/applications/') && (
                <>
                  <span>/</span>
                  <span>Detail</span>
                </>
              )}
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* SIH Tag */}
            <div
              className="hidden sm:flex items-center gap-1"
              style={{
                fontSize: 10, fontWeight: 700,
                padding: '4px 10px', borderRadius: 99,
                background: 'var(--blue-light)',
                color: 'var(--blue-primary)',
                border: '1px solid rgba(40,100,165,0.20)',
                letterSpacing: '0.04em',
              }}
            >
              SIH·2026
            </div>

            {/* Help */}
            <button
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: 6, borderRadius: 8,
                transition: 'all 150ms',
              }}
              title="Help"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <HelpCircle size={16} />
            </button>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifications(v => !v)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: unreadCount > 0 ? 'var(--blue-primary)' : 'var(--text-muted)',
                  padding: 6, borderRadius: 8, position: 'relative',
                  transition: 'all 150ms',
                }}
                title="Notifications"
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-surface-2)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span
                    className="pulse-dot"
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--red)',
                      border: '1.5px solid var(--bg-surface)',
                    }}
                  />
                )}
              </button>
              {showNotifications && (
                <NotificationPanel
                  notifications={notifications}
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </div>

            {/* User avatar */}
            <div
              className="flex items-center gap-2.5"
              style={{
                paddingLeft: 10,
                borderLeft: '1px solid var(--border)',
                marginLeft: 2,
              }}
            >
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: 'linear-gradient(135deg, #2864A5, #477FB8)',
                  fontSize: 12, fontWeight: 700, color: '#fff',
                }}
              >
                {user?.full_name?.[0] ?? '?'}
              </div>
              <div className="hidden sm:block">
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {user?.full_name}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                  {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main style={{ flex: 1, padding: '20px 22px' }}>
          <Outlet />
        </main>

        {/* ── Footer ── */}
        <footer
          style={{
            padding: '10px 22px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            AICTE Approval &amp; Compliance Platform &nbsp;·&nbsp; Smart India Hackathon 2026 &nbsp;·&nbsp; SIH26262 &nbsp;·&nbsp; Ministry of Education, Government of India
          </p>
        </footer>
      </div>
    </div>
  );
};
