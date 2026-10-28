import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  FileText, Clock, AlertTriangle, CheckCircle2,
  TrendingUp, Building2, ArrowUpRight, BarChart3,
  PhoneCall, RefreshCw, Activity, ClipboardCheck
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

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 shadow-lg rounded-xl px-3 py-2.5 text-xs">
        <p className="font-bold" style={{ color: payload[0].payload.fill }}>{payload[0].name}</p>
        <p className="text-slate-600">{payload[0].value} pending cases</p>
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.06) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="700">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchSummary = async () => {
    try {
      const res = await api.get('/reports/summary');
      setSummary(res.data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load dashboard summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-white rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="h-72 bg-white rounded-2xl border border-slate-200" />)}
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

  // Build a mock trend data for the area chart (since we only have one snapshot, we simulate a trend)
  const trendData = [
    { month: 'Jun', submitted: 18, approved: 12, escalated: 3 },
    { month: 'Jul', submitted: 22, approved: 15, escalated: 4 },
    { month: 'Aug', submitted: 19, approved: 13, escalated: 2 },
    { month: 'Sep', submitted: 25, approved: 18, escalated: 5 },
    { month: 'Oct', submitted: kpis.total_applications || 25, approved: kpis.pending_applications || 16, escalated: kpis.overdue_applications || 4 },
  ];

  const kpiCards = [
    {
      label: 'Total Applications',
      value: kpis.total_applications ?? '—',
      sub: 'Active cases this cycle',
      icon: <FileText className="w-5 h-5" />,
      iconBg: 'bg-blue-100 text-blue-600',
      valueColor: 'text-slate-900',
      cardClass: 'blue',
      trend: '+12% vs last month',
      trendUp: true,
    },
    {
      label: 'Pending Scrutiny & EVC',
      value: kpis.pending_applications ?? '—',
      sub: 'Across 8 regional offices',
      icon: <Clock className="w-5 h-5" />,
      iconBg: 'bg-amber-100 text-amber-600',
      valueColor: 'text-amber-600',
      cardClass: 'amber',
      trend: 'Awaiting officer action',
      trendUp: null,
    },
    {
      label: 'Overdue Escalations',
      value: kpis.overdue_applications ?? '—',
      sub: 'Triggered Bureau alerts',
      icon: <AlertTriangle className="w-5 h-5" />,
      iconBg: 'bg-red-100 text-red-600',
      valueColor: 'text-red-600',
      cardClass: 'red',
      trend: 'Requires immediate attention',
      trendUp: false,
    },
    {
      label: 'Compliance Verified',
      value: kpis.verified_compliance ?? '—',
      sub: 'Officer-accepted evidence',
      icon: <CheckCircle2 className="w-5 h-5" />,
      iconBg: 'bg-emerald-100 text-emerald-600',
      valueColor: 'text-emerald-600',
      cardClass: 'green',
      trend: 'Institutional submissions cleared',
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -bottom-6 right-32 w-24 h-24 bg-white/5 rounded-full" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-blue-200" />
              <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Live Operations Dashboard</span>
            </div>
            <h1 className="text-xl font-extrabold text-white">
              AICTE Central Pendency Monitor
            </h1>
            <p className="text-blue-200 text-xs mt-1">
              Welcome, <span className="font-semibold text-white">{user?.full_name}</span> · Real-time workflow oversight across all regions
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={fetchSummary}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-xl text-white text-xs font-semibold transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <Link
              to="/voice-agent"
              className="flex items-center gap-1.5 px-3 py-2 bg-white text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors shadow-sm"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              AI Voice Agent
            </Link>
            <Link
              to="/applications"
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-400 rounded-xl text-white text-xs font-semibold transition-colors"
            >
              All Applications
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        <div className="relative mt-3 text-[10px] text-blue-300 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          Last refreshed: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card, i) => (
          <div key={card.label} className={`stat-card ${card.cardClass} animate-fade-in-delay-${i + 1}`}>
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
              {card.trendUp === true && <TrendingUp className="w-3 h-3 text-emerald-500" />}
              {card.trendUp === false && <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />}
              <span className="text-[11px] text-slate-500">{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stage Distribution Bar - 2 cols */}
        <div className="chart-container lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Application Stage Breakdown</h2>
              <p className="section-subtitle">Live counts across all active workflow stages</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg">
              <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[10px] font-semibold text-slate-500">Live</span>
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
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Cases" radius={[6, 6, 0, 0]}>
                  {stageData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={GRADIENT_COLORS[index % GRADIENT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Region Pendency Pie - 1 col */}
        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Regional Pendency</h2>
              <p className="section-subtitle">By jurisdiction</p>
            </div>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionData}
                  dataKey="pending_count"
                  nameKey="region"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  labelLine={false}
                  label={renderCustomLabel}
                >
                  {regionData.map((_: any, index: number) => (
                    <Cell key={`region-cell-${index}`} fill={GRADIENT_COLORS[index % GRADIENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
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
                <span className="text-[11px] font-bold text-slate-800">{r.pending_count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title">Application Volume Trend</h2>
            <p className="section-subtitle">Monthly submissions, approvals and escalations (current cycle)</p>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-blue-500" /> Submitted</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-emerald-500" /> Approved</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-1.5 rounded-full bg-red-400" /> Escalated</div>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorEscalated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="submitted" name="Submitted" stroke="#2563eb" strokeWidth={2} fill="url(#colorSubmitted)" dot={{ fill: '#2563eb', r: 3 }} />
              <Area type="monotone" dataKey="approved" name="Approved" stroke="#10b981" strokeWidth={2} fill="url(#colorApproved)" dot={{ fill: '#10b981', r: 3 }} />
              <Area type="monotone" dataKey="escalated" name="Escalated" stroke="#ef4444" strokeWidth={2} fill="url(#colorEscalated)" dot={{ fill: '#ef4444', r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Compliance & Alert Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/compliance" className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-amber-200 hover:border-amber-400 shadow-sm hover:shadow-md transition-all lift">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-500">Pending Undertakings</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-0.5">{kpis.pending_compliance ?? '—'}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Fire safety, cadre ratio &amp; funds</div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors" />
        </Link>

        <Link to="/documents" className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-purple-200 hover:border-purple-400 shadow-sm hover:shadow-md transition-all lift">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-500">Leases Expiring Soon</div>
            <div className="text-2xl font-extrabold text-purple-600 mt-0.5">{kpis.expiring_documents ?? '—'}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Within 90-day threshold</div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-purple-400 group-hover:text-purple-600 transition-colors" />
        </Link>

        <Link to="/escalations" className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-red-200 hover:border-red-400 shadow-sm hover:shadow-md transition-all lift">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-500">Active Escalation Flags</div>
            <div className="text-2xl font-extrabold text-red-600 mt-0.5">{kpis.active_escalations ?? '—'}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Bureau &amp; Senior Authority action</div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-red-400 group-hover:text-red-600 transition-colors" />
        </Link>
      </div>
    </div>
  );
};

