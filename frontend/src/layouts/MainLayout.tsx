import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  ShieldCheck, LayoutDashboard, FileText, ClipboardCheck,
  CalendarCheck, Clock, PhoneCall, Bell, LogOut, AlertTriangle,
  Layers, ChevronDown, X, Menu, Zap
} from 'lucide-react';
import type { NotificationItem } from '../types';

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close notification panel on route change
  useEffect(() => {
    setShowNotifications(false);
    setSidebarOpen(false);
  }, [location.pathname]);

  const isInstitution = user?.role === 'INSTITUTION';
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const roleColorMap: Record<string, string> = {
    INSTITUTION: 'bg-blue-100 text-blue-700',
    REGIONAL_OFFICER: 'bg-emerald-100 text-emerald-700',
    BUREAU_OFFICER: 'bg-amber-100 text-amber-700',
    EVC_COMMITTEE: 'bg-purple-100 text-purple-700',
    SENIOR_AUTHORITY: 'bg-rose-100 text-rose-700',
    ADMIN: 'bg-slate-100 text-slate-700',
  };
  const roleColor = roleColorMap[user?.role ?? ''] || 'bg-slate-100 text-slate-700';

  const navLinks = [
    {
      to: isInstitution ? '/institution/dashboard' : '/admin/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
      label: isInstitution ? 'My Dashboard' : 'Consolidated Overview',
      iconColor: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      to: '/applications',
      icon: <FileText className="w-4 h-4" />,
      label: 'Applications & Cases',
      iconColor: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      to: '/compliance',
      icon: <ClipboardCheck className="w-4 h-4" />,
      label: 'Compliance & Undertakings',
      iconColor: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      to: '/evc',
      icon: <CalendarCheck className="w-4 h-4" />,
      label: 'EVC Scheduling & Visits',
      iconColor: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      to: '/documents',
      icon: <Clock className="w-4 h-4" />,
      label: 'Documents & Leases',
      iconColor: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  const innovationLinks = [
    {
      to: '/voice-agent',
      icon: <PhoneCall className="w-4 h-4" />,
      label: 'AI Voice Reminder Agent',
      iconColor: 'text-rose-600',
      bg: 'bg-rose-50',
      badge: 'AI',
      badgeColor: 'bg-rose-500 text-white',
    },
    ...(!isInstitution
      ? [
          {
            to: '/escalations',
            icon: <AlertTriangle className="w-4 h-4" />,
            label: 'Escalations & Overdue',
            iconColor: 'text-red-600',
            bg: 'bg-red-50',
            badge: undefined,
            badgeColor: '',
          },
          {
            to: '/routes-config',
            icon: <Layers className="w-4 h-4" />,
            label: 'Workflow Route Engine',
            iconColor: 'text-slate-600',
            bg: 'bg-slate-50',
            badge: undefined,
            badgeColor: '',
          },
        ]
      : []),
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 leading-tight">AICTE Portal</div>
            <div className="text-[10px] text-slate-500 font-medium">Workflow & Compliance</div>
          </div>
        </div>
      </div>

      {/* User Card */}
      <div className="mx-3 mb-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {user?.full_name?.[0] ?? '?'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-800 truncate">{user?.full_name}</div>
            <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${roleColor}`}>
              {user?.role?.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
        {user?.region && (
          <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
            {user.region} Region
          </div>
        )}
      </div>

      <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {isInstitution ? 'Institution Portal' : 'Regulatory Operations'}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
        {navLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className={`w-7 h-7 rounded-lg ${link.bg} ${link.iconColor} flex items-center justify-center flex-shrink-0`}>
              {link.icon}
            </span>
            <span className="flex-1 truncate">{link.label}</span>
          </NavLink>
        ))}

        <div className="pt-3 pb-1 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Innovation & Oversight
        </div>

        {innovationLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className={`w-7 h-7 rounded-lg ${link.bg} ${link.iconColor} flex items-center justify-center flex-shrink-0`}>
              {link.icon}
            </span>
            <span className="flex-1 truncate">{link.label}</span>
            {link.badge && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${link.badgeColor}`}>
                {link.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Regulatory Notice */}
      <div className="mx-3 mb-4 mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-[10px] text-amber-800 leading-relaxed">
            <span className="font-bold block">Regulatory Notice</span>
            All statutory approvals remain with authorized AICTE officials. This system provides workflow support only.
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-slate-100 pt-3">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-white border-r border-slate-200 fixed top-0 left-0 h-screen z-40 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 bg-white h-full flex flex-col shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
          <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
            {/* Mobile menu */}
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              {/* Breadcrumb / page title area */}
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-blue-600 font-semibold">AICTE</span>
                  <span className="text-slate-300">/</span>
                  <span>Regulatory Platform</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* SIH Tag */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold rounded-full">
                <Zap className="w-3 h-3" />
                SIH26262
              </div>

              {/* Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center pulse-dot">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 shadow-xl rounded-2xl z-50 overflow-hidden animate-fade-in">
                    <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                      <div>
                        <span className="text-sm font-bold text-slate-900">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="ml-2 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-400">
                          <Bell className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                          No active notifications
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div key={n.id} className={`p-3.5 hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-blue-50/40' : ''}`}>
                            <div className="flex items-start gap-2.5">
                              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? 'bg-blue-500' : 'bg-slate-300'}`} />
                              <div>
                                <div className="text-xs font-semibold text-slate-800">{n.title}</div>
                                <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</div>
                                <div className="text-[10px] text-slate-400 mt-1.5">
                                  {new Date(n.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {user?.full_name?.[0] ?? '?'}
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold text-slate-800">{user?.full_name}</div>
                  <div className="text-[10px] text-slate-500">{user?.role?.replace(/_/g, ' ')}</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="py-3 px-6 border-t border-slate-200 bg-white text-center">
          <p className="text-[11px] text-slate-400">
            AICTE Approval & Compliance Platform · Smart India Hackathon 2026 · Ministry of Education, GoI
          </p>
        </footer>
      </div>
    </div>
  );
};
