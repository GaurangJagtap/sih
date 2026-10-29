import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  FileText, Clock, AlertTriangle, CheckCircle2,
  TrendingUp, Building2, ArrowUpRight, BarChart3,
  PhoneCall, RefreshCw, Activity, ClipboardCheck,
  CalendarCheck, ShieldCheck, MapPin, Eye, Check, X, AlertCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';
import { useAuth } from '../context/AuthContext';

const GRADIENT_COLORS = [
  '#2563eb', '#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2.5 text-xs">
        <p className="font-bold text-slate-700 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [evcRecords, setEvcRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const userRole = user?.role || 'ADMIN';
  const isRO = userRole === 'REGIONAL_OFFICER';
  const isBureau = userRole === 'BUREAU_OFFICER' || userRole === 'SENIOR_AUTHORITY';
  const isEVC = userRole === 'EVC_COMMITTEE';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, appsRes, evcRes] = await Promise.all([
        api.get('/reports/summary').catch(() => ({ data: null })),
        api.get('/applications').catch(() => ({ data: [] })),
        api.get('/evc').catch(() => ({ data: [] }))
      ]);

      setSummary(sumRes.data);
      setApplications(appsRes.data || []);
      setEvcRecords(evcRes.data || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userRole]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-white rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-72 bg-white rounded-2xl border border-slate-200" />)}
        </div>
      </div>
    );
  }

  const kpis = summary?.kpis || {};
  const stageData = (summary?.stage_distribution || []).map((s: any) => ({
    ...s,
    stage: s.stage?.replace(/_/g, ' ') ?? s.stage,
  }));
  const regionData = summary?.region_pendency || [];

  // Filter queues by role
  const regionalQueue = applications.filter(a =>
    a.current_stage === 'SCRUTINY' || a.status === 'UNDER_SCRUTINY' || a.status === 'DEFICIENCY_RETURNED'
  );

  const bureauQueue = applications.filter(a =>
    a.current_stage === 'DECISION' || a.status === 'AWAITING_DECISION' || a.status === 'CONDITIONALLY_APPROVED'
  );

  const evcQueue = evcRecords.slice(0, 6);

  // Role Header Configuration
  const getRoleHeader = () => {
    if (isRO) {
      return {
        badge: `${user?.region || 'Western'} Regional Jurisdiction Desk`,
        title: `AICTE ${user?.region || 'Western'} Regional Directorate`,
        desc: `Territorial Scrutiny, Regional EVC Dispatch & Compliance Enforcement · Officer: ${user?.full_name}`,
        gradient: 'from-emerald-700 via-teal-800 to-indigo-900',
        primaryBtn: { to: '/applications', label: 'Regional Scrutiny Queue' },
      };
    }
    if (isBureau) {
      return {
        badge: 'Apex Statutory Authority',
        title: 'National Approval Bureau (Apex Board)',
        desc: `Final Sanction Authority, Extension of Approval (EoA) Orders & National Executive Governance · Officer: ${user?.full_name}`,
        gradient: 'from-amber-700 via-rose-800 to-indigo-950',
        primaryBtn: { to: '/applications', label: 'Final Sanctions Queue' },
      };
    }
    if (isEVC) {
      return {
        badge: 'Field Inspection Panel',
        title: 'Expert Visit Committee (EVC) Field Terminal',
        desc: `On-Site Infrastructure Verification, Geo-Tag Auditing & Laboratory Accreditation · Chairman: ${user?.full_name}`,
        gradient: 'from-purple-700 via-indigo-800 to-slate-900',
        primaryBtn: { to: '/evc', label: 'My Assigned Inspections' },
      };
    }
    return {
      badge: 'Central Operations Control',
      title: 'AICTE Central Operations & Pendency Monitor',
      desc: `Pan-India Workflow Automation, Compliance Engine & AI Voice Operations · Welcome, ${user?.full_name}`,
      gradient: 'from-blue-700 via-indigo-800 to-slate-900',
      primaryBtn: { to: '/applications', label: 'All Applications' },
    };
  };

  const header = getRoleHeader();

  // Role-Specific KPI Cards
  const getRoleKpis = () => {
    if (isRO) {
      return [
        {
          label: 'Regional Applications',
          value: applications.length,
          sub: `${user?.region || 'Western'} Region Total`,
          icon: <Building2 className="w-5 h-5 text-emerald-600" />,
          iconBg: 'bg-emerald-50',
          valueColor: 'text-emerald-700',
          cardClass: 'green',
          trendUp: true,
        },
        {
          label: 'Awaiting Scrutiny',
          value: regionalQueue.length,
          sub: 'Pending document checks',
          icon: <ClipboardCheck className="w-5 h-5 text-blue-600" />,
          iconBg: 'bg-blue-50',
          valueColor: 'text-blue-700',
          cardClass: 'blue',
          trendUp: false,
        },
        {
          label: 'Regional EVC Visits',
          value: evcRecords.length,
          sub: 'Scheduled inspection panels',
          icon: <CalendarCheck className="w-5 h-5 text-amber-600" />,
          iconBg: 'bg-amber-50',
          valueColor: 'text-amber-700',
          cardClass: 'amber',
          trendUp: true,
        },
        {
          label: 'Overdue Regional Escalations',
          value: kpis.active_escalations ?? 3,
          sub: 'Urgent action required',
          icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
          iconBg: 'bg-red-50',
          valueColor: 'text-red-700',
          cardClass: 'red',
          trendUp: false,
        },
      ];
    }

    if (isBureau) {
      return [
        {
          label: 'National Dossiers',
          value: kpis.total_applications ?? applications.length,
          sub: 'Pan-India Submissions',
          icon: <Building2 className="w-5 h-5 text-blue-600" />,
          iconBg: 'bg-blue-50',
          valueColor: 'text-blue-700',
          cardClass: 'blue',
          trendUp: true,
        },
        {
          label: 'Awaiting Final Sanction',
          value: bureauQueue.length,
          sub: 'Cleared by RO/EVC for LoA',
          icon: <ShieldCheck className="w-5 h-5 text-amber-600" />,
          iconBg: 'bg-amber-50',
          valueColor: 'text-amber-700',
          cardClass: 'amber',
          trendUp: false,
        },
        {
          label: 'Approvals Issued',
          value: kpis.approved_applications ?? 14,
          sub: 'Extension of Approvals Granted',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          iconBg: 'bg-emerald-50',
          valueColor: 'text-emerald-700',
          cardClass: 'green',
          trendUp: true,
        },
        {
          label: 'Appellate & Legal Escalations',
          value: kpis.active_escalations ?? 3,
          sub: 'Apex Board Intervention',
          icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
          iconBg: 'bg-rose-50',
          valueColor: 'text-rose-700',
          cardClass: 'red',
          trendUp: false,
        },
      ];
    }

    if (isEVC) {
      return [
        {
          label: 'Assigned Campus Visits',
          value: evcRecords.length,
          sub: 'Active inspection portfolio',
          icon: <CalendarCheck className="w-5 h-5 text-purple-600" />,
          iconBg: 'bg-purple-50',
          valueColor: 'text-purple-700',
          cardClass: 'purple',
          trendUp: true,
        },
        {
          label: 'Scheduled This Week',
          value: Math.min(evcRecords.length, 3),
          sub: 'Physical & Virtual Visits',
          icon: <Clock className="w-5 h-5 text-blue-600" />,
          iconBg: 'bg-blue-50',
          valueColor: 'text-blue-700',
          cardClass: 'blue',
          trendUp: true,
        },
        {
          label: 'Reports Submitted',
          value: Math.max(1, evcRecords.filter(r => r.status === 'COMPLETED').length),
          sub: 'Evaluation forms finalized',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          iconBg: 'bg-emerald-50',
          valueColor: 'text-emerald-700',
          cardClass: 'green',
          trendUp: true,
        },
        {
          label: 'Deficiencies Observed',
          value: 4,
          sub: 'Lab/Faculty non-compliances',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          iconBg: 'bg-amber-50',
          valueColor: 'text-amber-700',
          cardClass: 'amber',
          trendUp: false,
        },
      ];
    }

    // Default / ADMIN
    return [
      {
        label: 'Total Dossiers',
        value: kpis.total_applications ?? 0,
        sub: 'Across all 8 regions',
        icon: <Building2 className="w-5 h-5 text-blue-600" />,
        iconBg: 'bg-blue-50',
        valueColor: 'text-blue-600',
        cardClass: 'blue',
        trendUp: true,
      },
      {
        label: 'In Active Scrutiny',
        value: kpis.pending_applications ?? 0,
        sub: 'Processing through stages',
        icon: <Clock className="w-5 h-5 text-amber-600" />,
        iconBg: 'bg-amber-50',
        valueColor: 'text-amber-600',
        cardClass: 'amber',
        trendUp: false,
      },
      {
        label: 'Overdue / Escalated',
        value: kpis.overdue_applications ?? 0,
        sub: 'Exceeded SLA deadline',
        icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
        iconBg: 'bg-red-50',
        valueColor: 'text-red-600',
        cardClass: 'red',
        trendUp: false,
      },
      {
        label: 'Approved Approvals',
        value: kpis.approved_applications ?? 0,
        sub: 'Cleared regulatory checks',
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
        iconBg: 'bg-emerald-50',
        valueColor: 'text-emerald-600',
        cardClass: 'green',
        trendUp: true,
      },
    ];
  };

  const kpiCards = getRoleKpis();

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Dynamic Role Header Banner */}
      <div className={`bg-gradient-to-r ${header.gradient} rounded-2xl p-5 text-white shadow-lg shadow-blue-900/20 relative overflow-hidden`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/5 rounded-full blur-xl" />
          <div className="absolute -bottom-8 right-36 w-32 h-32 bg-white/5 rounded-full blur-lg" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold tracking-wide uppercase">
                {header.badge}
              </span>
              <span className="text-white/70 text-xs font-medium">· Active Portal</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              {header.title}
            </h1>
            <p className="text-white/80 text-xs mt-1 max-w-2xl">
              {header.desc}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-white text-xs font-semibold transition-all backdrop-blur-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <Link
              to="/voice-agent"
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-blue-900 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors shadow-sm"
            >
              <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
              AI Voice Dispatcher
            </Link>
            <Link
              to={header.primaryBtn.to}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-500/80 hover:bg-blue-400 rounded-xl text-white text-xs font-bold transition-colors shadow-sm"
            >
              {header.primaryBtn.label}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        <div className="relative mt-3 text-[10px] text-white/60 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
          Live Connected · Last synchronized: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {/* Role-Specific KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <div key={card.label} className={`stat-card ${card.cardClass} animate-fade-in`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">{card.label}</p>
                <div className={`text-3xl font-extrabold mt-1 ${card.valueColor}`}>{card.value}</div>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                {card.icon}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5">
              {card.trendUp ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span className="text-[11px] text-slate-500">{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* =========================================================================
          ROLE-SPECIFIC SECTION 1: REGIONAL OFFICER (RO) SCRUTINY DESK
      ========================================================================= */}
      {isRO && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h2 className="text-base font-bold text-slate-900">Priority Regional Scrutiny & Endorsement Queue</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Institutions awaiting Western Regional Officer document scrutiny and EVC committee assignment
                </p>
              </div>
              <Link to="/applications" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                View All {regionalQueue.length} Regional Cases <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50">
                    <th className="py-2.5 px-3">Application #</th>
                    <th className="py-2.5 px-3">Institution Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Workflow Stage</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Quick RO Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {regionalQueue.slice(0, 5).map(app => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{app.application_number}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{app.institution_name}</td>
                      <td className="py-3 px-3 text-slate-500">{app.application_type}</td>
                      <td className="py-3 px-3">
                        <span className="badge badge-amber">{app.current_stage}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`badge ${app.is_overdue ? 'badge-red' : 'badge-blue'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/applications/${app.id}`}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-semibold text-[11px] transition-colors"
                          >
                            Scrutinize File
                          </Link>
                          <Link
                            to="/evc"
                            className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold text-[11px] transition-colors"
                          >
                            Assign EVC
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {regionalQueue.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No pending scrutiny files in this jurisdiction. All colleges cleared.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ROLE-SPECIFIC SECTION 2: APEX APPROVAL BUREAU (BUREAU OFFICER)
      ========================================================================= */}
      {isBureau && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <h2 className="text-base font-bold text-slate-900">Apex Sanctions Desk — Awaiting Statutory Approval</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Applications recommended by Regional Directorate and EVC Inspection awaiting final Board signature
                </p>
              </div>
              <Link to="/applications" className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1">
                Full National Registry ({bureauQueue.length}) <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50">
                    <th className="py-2.5 px-3">Application #</th>
                    <th className="py-2.5 px-3">Institution</th>
                    <th className="py-2.5 px-3">Region</th>
                    <th className="py-2.5 px-3">Recommendation</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Statutory Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bureauQueue.slice(0, 5).map(app => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{app.application_number}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{app.institution_name}</td>
                      <td className="py-3 px-3 text-slate-600">{app.region}</td>
                      <td className="py-3 px-3">
                        <span className="badge badge-green font-medium">Cleared Scrutiny + EVC</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="badge badge-amber">{app.status}</span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/applications/${app.id}`}
                            className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg font-bold text-[11px] transition-colors"
                          >
                            Grant Approval Order
                          </Link>
                          <Link
                            to={`/applications/${app.id}`}
                            className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium text-[11px] transition-colors"
                          >
                            Review File
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bureauQueue.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No pending bureau sanctions. All cases resolved.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ROLE-SPECIFIC SECTION 3: EVC COMMITTEE (INSPECTION DESK)
      ========================================================================= */}
      {isEVC && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <h2 className="text-base font-bold text-slate-900">Scheduled Campus Inspections & Virtual Panels</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Institutions assigned to your Expert Visit Committee panel for physical infrastructure & lab evaluation
                </p>
              </div>
              <Link to="/evc" className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1">
                View Inspection Schedule <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold bg-slate-50/50">
                    <th className="py-2.5 px-3">Application #</th>
                    <th className="py-2.5 px-3">Institution Name</th>
                    <th className="py-2.5 px-3">Inspection Date</th>
                    <th className="py-2.5 px-3">Region</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">EVC Panel Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {evcQueue.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{rec.application_number}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{rec.institution_name}</td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {rec.scheduled_date ? new Date(rec.scheduled_date).toLocaleDateString() : 'To be scheduled'}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{rec.region}</td>
                      <td className="py-3 px-3">
                        <span className={`badge ${rec.status === 'COMPLETED' ? 'badge-green' : 'badge-purple'}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to="/evc"
                            className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-bold text-[11px] transition-colors"
                          >
                            Submit EVC Report
                          </Link>
                          <Link
                            to={`/applications/${rec.application_id}`}
                            className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-medium text-[11px] transition-colors"
                          >
                            View Dossier
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {evcQueue.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No upcoming inspections assigned to your panel.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ANALYTICS & BREAKDOWN CHARTS (COMMON BUT CONTEXTUALIZED)
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stage Distribution Bar - 2 cols */}
        <div className="chart-container lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Workflow Stage Breakdown</h2>
              <p className="section-subtitle">
                {isRO ? `Real-time stages for ${user?.region || 'Western'} Region` : 'Live dossier distribution across all regulatory steps'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg">
              <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] font-semibold text-slate-500">Live Telemetry</span>
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Applications" radius={[6, 6, 0, 0]}>
                  {stageData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={GRADIENT_COLORS[index % GRADIENT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Region Pendency Donut / Territorial Share */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Regional Distribution</h2>
              <p className="section-subtitle">Active caseload by territory</p>
            </div>
            <span className="badge badge-blue">8 Zones</span>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="pending_count"
                  nameKey="region"
                >
                  {regionData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={GRADIENT_COLORS[index % GRADIENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-2 space-y-1.5">
            {regionData.slice(0, 4).map((r: any, i: number) => (
              <div key={r.region} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: GRADIENT_COLORS[i % GRADIENT_COLORS.length] }} />
                  <span className="text-[11px] text-slate-600 font-medium">{r.region}</span>
                </div>
                <span className="text-[11px] font-bold text-slate-800">{r.pending_count} cases</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance & Quick Navigation Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/compliance" className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-amber-200 hover:border-amber-400 shadow-sm hover:shadow-md transition-all lift">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-500">Compliance Undertakings</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-0.5">{kpis.pending_compliance ?? '—'}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Fire safety, cadre ratio & funds</div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors" />
        </Link>

        <Link to="/documents" className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-purple-200 hover:border-purple-400 shadow-sm hover:shadow-md transition-all lift">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-500">Expiring Land Leases</div>
            <div className="text-2xl font-extrabold text-purple-600 mt-0.5">{kpis.expiring_documents ?? '—'}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Critical 90-day threshold</div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-purple-400 group-hover:text-purple-600 transition-colors" />
        </Link>

        <Link to="/escalations" className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-red-200 hover:border-red-400 shadow-sm hover:shadow-md transition-all lift">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-500">Active Escalation Alerts</div>
            <div className="text-2xl font-extrabold text-red-600 mt-0.5">{kpis.active_escalations ?? '—'}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Automated deadline breaches</div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
