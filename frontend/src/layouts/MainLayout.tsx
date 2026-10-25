import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import {
  ShieldCheck, LayoutDashboard, FileText, ClipboardCheck,
  CalendarCheck, Clock, PhoneCall, Bell, LogOut, AlertTriangle, Layers
} from 'lucide-react';
import type { NotificationItem } from '../types';

export const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

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

  const isInstitution = user?.role === 'INSTITUTION';
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header Banner */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-base tracking-wide flex items-center gap-2">
                <span>AICTE APPROVAL & COMPLIANCE PLATFORM</span>
                <span className="text-[10px] bg-blue-800 text-blue-200 px-2 py-0.5 rounded-full font-semibold uppercase">
                  SIH26262 Prototype
                </span>
              </div>
              <div className="text-xs text-slate-400">
                All India Council for Technical Education (Ministry of Education, GoI)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 relative transition-colors"
                title="Notifications & Alerts"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 shadow-2xl rounded-xl z-50 text-slate-900 overflow-hidden">
                  <div className="p-3 bg-slate-100 border-b border-slate-200 font-semibold text-xs flex justify-between items-center text-slate-700">
                    <span>Regulatory Alerts & Notifications ({notifications.length})</span>
                    <span className="text-[10px] text-blue-600 font-normal">Auto-monitoring</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">No active notifications</div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div key={n.id} className="p-3 hover:bg-slate-50 text-xs">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                            {n.title}
                          </div>
                          <div className="text-slate-600 mt-1 leading-relaxed">{n.message}</div>
                          <div className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
                            <span>Channel: {n.channel}</span>
                            <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Badge */}
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white">{user?.full_name}</div>
              <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                <span>{user?.role.replace('_', ' ')}</span>
                {user?.region && <span>({user.region})</span>}
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main App Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isInstitution ? 'Institution Portal' : 'Regulatory Operations'}
            </div>

            <NavLink
              to={isInstitution ? '/institution/dashboard' : '/admin/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 text-blue-600" />
              <span>{isInstitution ? 'Institution Dashboard' : 'Consolidated Overview'}</span>
            </NavLink>

            <NavLink
              to="/applications"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Applications & Cases</span>
            </NavLink>

            <NavLink
              to="/compliance"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-600" />
              <span>Undertakings & Compliance</span>
            </NavLink>

            <NavLink
              to="/evc"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <CalendarCheck className="w-4 h-4 text-amber-600" />
              <span>EVC Scheduling & Visits</span>
            </NavLink>

            <NavLink
              to="/documents"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Prescribed Documents & Leases</span>
            </NavLink>

            <div className="pt-3 border-t border-slate-100 px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Innovation & Oversight
            </div>

            <NavLink
              to="/voice-agent"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <PhoneCall className="w-4 h-4 text-rose-600" />
              <div className="flex items-center justify-between w-full">
                <span>AI Voice Reminder Agent</span>
                <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">KEY</span>
              </div>
            </NavLink>

            {!isInstitution && (
              <>
                <NavLink
                  to="/escalations"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Escalations & Overdue</span>
                </NavLink>

                <NavLink
                  to="/routes-config"
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Layers className="w-4 h-4 text-slate-600" />
                  <span>Workflow Route Engine</span>
                </NavLink>
              </>
            )}
          </nav>

          {/* Regulatory Safeguard Notice */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed shadow-sm">
            <span className="font-semibold block mb-0.5">⚠️ Regulatory Safeguard:</span>
            This automated system provides administrative workflow support only. Statutory approvals, scrutiny, and extensions remain with authorized AICTE officials.
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
