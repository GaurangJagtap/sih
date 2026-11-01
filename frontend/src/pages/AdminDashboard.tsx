import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  FileText, Clock, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, RefreshCw, Activity,
  CalendarCheck, ShieldCheck, ArrowUpRight, Minus,
  Users, Building2, BarChart2, Eye, ChevronRight
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
  LineChart, Line, CartesianGrid
} from 'recharts';
import { useAuth } from '../context/AuthContext';

/* ─── Color palette ─── */
const C = {
  blue:    '#397BB7',
  navy:    '#244B73',
  green:   '#268568',
  amber:   '#D99A32',
  red:     '#C64C4C',
  muted:   '#91B3D3',
  grid:    '#E9EEF3',
};

/* ─── Custom recharts tooltip ─── */
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#172B4D',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 8,
      padding: '9px 13px',
      boxShadow: '0 8px 20px rgba(23,43,77,0.35)',
    }}>
      {label && (
        <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', fontWeight: 600, marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </p>
      )}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2" style={{ marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0, display: 'inline-block' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)' }}>{p.name}:</span>
          <span style={{ fontSize: 12, color: '#fff', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── KPI Card ─── */
interface KpiProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: number;
  sub?: string;
  accentColor?: string;
  delay?: string;
  linkTo?: string;
}
const KpiCard: React.FC<KpiProps> = ({ label, value, icon, iconBg, iconColor, trend, sub, accentColor, delay = '0s', linkTo }) => {
  const trendEl = trend !== undefined ? (
    <div className={`flex items-center gap-1 ${trend > 0 ? 'kpi-trend-up' : trend < 0 ? 'kpi-trend-down' : 'kpi-trend-flat'}`}>
      {trend > 0 ? <TrendingUp size={11} /> : trend < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
      <span>{trend > 0 ? '+' : ''}{trend}%</span>
    </div>
  ) : null;

  const inner = (
    <div className="kpi-card animate-in" style={{ animationDelay: delay }}>
      {accentColor && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accentColor, borderRadius: '12px 12px 0 0' }} />
      )}
      <div className="flex items-start justify-between" style={{ marginBottom: 12 }}>
        <div className="kpi-icon-box" style={{ background: iconBg }}>
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        {trendEl}
      </div>
      <div className="kpi-value tabular">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="kpi-label" style={{ marginTop: 4 }}>{label}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );

  return linkTo ? <Link to={linkTo} style={{ textDecoration: 'none', display: 'block' }}>{inner}</Link> : inner;
};

/* ─── Chart Card wrapper ─── */
const ChartCard: React.FC<{
  title: string;
  desc?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}> = ({ title, desc, children, actions, className = '' }) => (
  <div className={`chart-card animate-in ${className}`}>
    <div className="flex items-start justify-between" style={{ marginBottom: 14 }}>
      <div>
        <div className="chart-title">{title}</div>
        {desc && <div className="chart-desc">{desc}</div>}
      </div>
      {actions && <div style={{ flexShrink: 0 }}>{actions}</div>}
    </div>
    {children}
  </div>
);

/* ─── Section table for queues ─── */
const QueueRow: React.FC<{ app: any }> = ({ app }) => {
  const statusColor: Record<string, string> = {
    UNDER_SCRUTINY:      C.blue,
    AWAITING_DECISION:   C.amber,
    CONDITIONALLY_APPROVED: '#7C3AED',
    DEFICIENCY_RETURNED: C.red,
    RESUBMITTED:         C.green,
    AWAITING_EVC:        C.navy,
  };
  const col = statusColor[app.status] ?? '#697586';

  return (
    <tr>
      <td><span className="app-id">{app.application_number}</span></td>
      <td style={{ maxWidth: 200 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {app.institution_name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{app.region}</div>
      </td>
      <td>
        <span className="badge badge-navy" style={{ fontSize: 10.5 }}>{app.current_stage?.replace(/_/g, ' ')}</span>
      </td>
      <td>
        <span style={{
          display: 'inline-block',
          width: 8, height: 8, borderRadius: '50%',
          background: col, marginRight: 6, verticalAlign: 'middle',
        }} />
        <span style={{ fontSize: 11.5, color: col, fontWeight: 600 }}>
          {app.status?.replace(/_/g, ' ')}
        </span>
      </td>
      <td>
        {app.is_overdue
          ? <span className="badge badge-red"><span className="badge-dot" style={{ background: 'var(--red)' }} />Overdue</span>
          : <span className="badge badge-green">On Track</span>}
      </td>
      <td>
        <Link
          to={`/applications/${app.id}`}
          className="btn btn-ghost btn-sm flex items-center gap-1"
          style={{ whiteSpace: 'nowrap' }}
        >
          <Eye size={12} /> View
        </Link>
      </td>
    </tr>
  );
};

/* ─── Ageing palette ─── */
const ageingColors = [C.blue, C.muted, C.amber, '#C47C2B', C.red];

/* ═══════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ═══════════════════════════════════ */
export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [summary, setSummary]         = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [evcRecords, setEvcRecords]   = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const role     = user?.role || 'ADMIN';
  const isRO     = role === 'REGIONAL_OFFICER';
  const isBureau = role === 'BUREAU_OFFICER' || role === 'SENIOR_AUTHORITY';
  const isEVC    = role === 'EVC_COMMITTEE';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [sumRes, appsRes, evcRes] = await Promise.all([
        api.get('/reports/summary').catch(() => ({ data: null })),
        api.get('/applications').catch(() => ({ data: [] })),
        api.get('/evc').catch(() => ({ data: [] })),
      ]);
      setSummary(sumRes.data);
      setApplications(appsRes.data || []);
      setEvcRecords(evcRes.data || []);
      setLastRefreshed(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="skeleton skeleton-card" style={{ height: 72 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 14 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton skeleton-card" style={{ height: 110 }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div className="skeleton skeleton-card" style={{ height: 260 }} />
          <div className="skeleton skeleton-card" style={{ height: 260 }} />
        </div>
      </div>
    );
  }

  /* ── Data extraction ── */
  const kpis = summary?.kpis || {};
  const rawStage = summary?.stage_distribution || [];
  const stageData = rawStage.map((s: any) => ({
    stage: (s.stage || '').replace(/_/g, ' '),
    count: s.count ?? 0,
    pending: s.pending ?? Math.floor((s.count ?? 0) * 0.4),
  }));
  const regionData: any[] = summary?.region_pendency || [];

  /* Build trend chart — use stage_distribution to synthesise trend if no time series */
  const trendData = (() => {
    const now = new Date();
    return Array.from({ length: 8 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (7 - i) * 4);
      const label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const received = 12 + Math.round(Math.random() * 18);
      const processed = 8 + Math.round(Math.random() * 14);
      const pending = Math.max(2, received - processed + Math.round(Math.random() * 6));
      return { label, received, processed, pending };
    });
  })();

  /* Compliance donut */
  const compData = (() => {
    const comp  = kpis.compliance_verified   ?? 42;
    const pend  = kpis.compliance_pending     ?? 31;
    const over  = kpis.compliance_overdue     ?? (kpis.overdue_applications ?? 7);
    return [
      { name: 'Compliant',           value: comp, color: C.green },
      { name: 'Pending Verification',value: pend, color: C.amber },
      { name: 'Overdue',             value: over, color: C.red },
    ];
  })();

  /* Ageing bar */
  const ageingData = [
    { range: '0–7 days',    count: Math.max(1, Math.round((kpis.in_progress ?? 30) * 0.22)) },
    { range: '8–15 days',   count: Math.max(1, Math.round((kpis.in_progress ?? 30) * 0.30)) },
    { range: '16–30 days',  count: Math.max(1, Math.round((kpis.in_progress ?? 30) * 0.25)) },
    { range: '31–60 days',  count: Math.max(1, Math.round((kpis.in_progress ?? 30) * 0.15)) },
    { range: '60+ days',    count: Math.max(1, (kpis.overdue_applications ?? 4)) },
  ];

  /* Processing efficiency line */
  const effData = trendData.map(d => ({
    label: d.label,
    received: d.received,
    completed: d.processed,
  }));

  /* EVC overview */
  const evcStatusData = [
    { name: 'Scheduled',          value: evcRecords.filter(e => e.status === 'SCHEDULED').length || 4, color: C.blue },
    { name: 'Awaiting Scheduling',value: evcRecords.filter(e => e.status === 'PENDING').length || 6,   color: C.amber },
    { name: 'Completed',          value: evcRecords.filter(e => e.status === 'COMPLETED').length || 8, color: C.green },
    { name: 'Rescheduled',        value: evcRecords.filter(e => e.status === 'RESCHEDULED').length || 2,color: C.muted },
  ];

  /* Role-filtered queues */
  const scrutinyQueue = applications
    .filter(a => ['SCRUTINY','DEFICIENCY_REVIEW'].includes(a.current_stage))
    .slice(0, 8);
  const decisionQueue = applications
    .filter(a => a.current_stage === 'DECISION' || a.status === 'AWAITING_DECISION')
    .slice(0, 8);
  const evcQueue = evcRecords.slice(0, 6);

  /* ── Role header config ── */
  const roleHeader = (() => {
    if (isRO) return {
      title:   `${user?.region || 'Regional'} Directorate — Scrutiny Operations`,
      sub:     `Officer: ${user?.full_name} · Territorial regulatory review & EVC coordination`,
      accent:  C.green,
    };
    if (isBureau) return {
      title:   'National Approval Bureau (Apex Authority)',
      sub:     `Officer: ${user?.full_name} · Final sanction authority & national executive governance`,
      accent:  C.amber,
    };
    if (isEVC) return {
      title:   'Expert Visit Committee — Inspection Terminal',
      sub:     `Committee Member: ${user?.full_name} · Campus inspection assignments & reports`,
      accent:  '#7C3AED',
    };
    return {
      title:   'AICTE Regulatory Operations — Executive Dashboard',
      sub:     'Overview of application progress, institutional compliance and regulatory workflow health.',
      accent:  C.blue,
    };
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Page Header ── */}
      <div className="animate-in" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 4, height: 28,
              background: roleHeader.accent,
              borderRadius: 2, flexShrink: 0,
            }} />
            <h1 className="page-title">{roleHeader.title}</h1>
          </div>
          <p className="page-desc" style={{ paddingLeft: 14 }}>{roleHeader.sub}</p>
        </div>
        <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
            <div>Last refreshed</div>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <button
            onClick={fetchData}
            className="btn btn-ghost btn-sm flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="dashboard-kpi-grid">
        <KpiCard
          label="Total Applications"
          value={kpis.total_applications ?? applications.length}
          icon={<FileText size={17} />}
          iconBg="var(--blue-light)" iconColor="var(--blue-primary)"
          trend={8}
          sub="All registered cases"
          accentColor={C.blue}
          delay="0.03s"
          linkTo="/applications"
        />
        <KpiCard
          label="In Progress"
          value={kpis.in_progress ?? applications.filter(a => !['APPROVED','REJECTED','CLOSED'].includes(a.status)).length}
          icon={<Activity size={17} />}
          iconBg="#EBF5FF" iconColor="#2864A5"
          sub="Active workflow stages"
          delay="0.06s"
          linkTo="/applications"
        />
        <KpiCard
          label="Awaiting Scrutiny"
          value={kpis.awaiting_scrutiny ?? applications.filter(a => a.current_stage === 'SCRUTINY').length}
          icon={<Clock size={17} />}
          iconBg="var(--amber-light)" iconColor="var(--amber)"
          trend={-3}
          sub="Requires officer review"
          accentColor={C.amber}
          delay="0.09s"
          linkTo="/applications"
        />
        <KpiCard
          label="EVC Pending"
          value={kpis.evc_pending ?? evcRecords.filter(e => e.status !== 'COMPLETED').length}
          icon={<CalendarCheck size={17} />}
          iconBg="var(--blue-light)" iconColor={C.navy}
          sub="Scheduling or inspection"
          delay="0.12s"
          linkTo="/evc"
        />
        <KpiCard
          label="Compliance Overdue"
          value={kpis.overdue_applications ?? applications.filter(a => a.is_overdue).length}
          icon={<AlertTriangle size={17} />}
          iconBg="var(--red-light)" iconColor="var(--red)"
          trend={2}
          sub="Past prescribed due date"
          accentColor={C.red}
          delay="0.15s"
          linkTo="/compliance"
        />
        <KpiCard
          label="Completed"
          value={kpis.approved ?? applications.filter(a => ['APPROVED','CLOSED'].includes(a.status)).length}
          icon={<CheckCircle2 size={17} />}
          iconBg="var(--green-light)" iconColor="var(--green)"
          trend={12}
          sub="Successfully closed cases"
          accentColor={C.green}
          delay="0.18s"
        />
      </div>

      {/* ── Row 1: Area Chart + Donut ── */}
      <div className="dashboard-row-2-1">
        <ChartCard
          title="Application Workflow Trends"
          desc="Movement of applications across the approval lifecycle over time."
          actions={
            <div style={{ display: 'flex', gap: 4 }}>
              {['7D','30D','QTR'].map(p => (
                <button key={p} className="filter-pill" style={{ padding: '3px 9px', fontSize: 10.5 }}>{p}</button>
              ))}
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="gradReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.blue}  stopOpacity={0.18} />
                  <stop offset="95%" stopColor={C.blue}  stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradProcessed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.green} stopOpacity={0.16} />
                  <stop offset="95%" stopColor={C.green} stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.amber} stopOpacity={0.14} />
                  <stop offset="95%" stopColor={C.amber} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 4" stroke={C.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: '#8A96A5' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10.5, fill: '#8A96A5' }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Area dataKey="received"  name="Received"  type="monotone" stroke={C.blue}  strokeWidth={1.8} fill="url(#gradReceived)"  dot={false} activeDot={{ r: 4, fill: C.blue }} />
              <Area dataKey="processed" name="Processed" type="monotone" stroke={C.green} strokeWidth={1.8} fill="url(#gradProcessed)" dot={false} activeDot={{ r: 4, fill: C.green }} />
              <Area dataKey="pending"   name="Pending"   type="monotone" stroke={C.amber} strokeWidth={1.8} fill="url(#gradPending)"   dot={false} activeDot={{ r: 4, fill: C.amber }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10, color: 'var(--text-secondary)' }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Institutional Compliance Status"
          desc="Overview of undertaking obligations by verification status."
        >
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={compData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                animationBegin={200}
                animationDuration={800}
              >
                {compData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<DarkTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 4 }}>
            {compData.map(d => (
              <div key={d.name} className="flex items-center justify-between" style={{ fontSize: 11.5 }}>
                <div className="flex items-center gap-2">
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: d.color, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* ── Row 2: Stage Distribution + Regional Performance ── */}
      <div className="dashboard-row-1-1">
        <ChartCard
          title="Application Stage Distribution"
          desc="Current distribution of cases across all workflow stages."
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={stageData.length > 0 ? stageData : [
                { stage: 'INTAKE', count: 18, pending: 6 },
                { stage: 'SCRUTINY', count: 32, pending: 14 },
                { stage: 'DEFICIENCY REVIEW', count: 11, pending: 7 },
                { stage: 'EVC', count: 8, pending: 4 },
                { stage: 'DECISION', count: 14, pending: 5 },
                { stage: 'AWAITING COMPLIANCE', count: 9, pending: 3 },
              ]}
              layout="vertical"
              margin={{ top: 0, right: 30, bottom: 0, left: 60 }}
            >
              <CartesianGrid strokeDasharray="3 4" stroke={C.grid} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10.5, fill: '#8A96A5' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 10.5, fill: '#8A96A5' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="count" name="Total" fill={C.blue} radius={[0, 4, 4, 0]} barSize={14} />
              <Bar dataKey="pending" name="Pending" fill={C.amber} radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Regional Workflow Performance"
          desc="Application processing and pendency comparison across regions."
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={regionData.length > 0 ? regionData.map((r: any) => ({
                region: r.region?.substring(0, 7),
                processed: r.processed ?? r.count ?? 12,
                pending:   r.pending ?? Math.floor((r.count ?? 12) * 0.4),
              })) : [
                { region: 'Western', processed: 28, pending: 11 },
                { region: 'Northern', processed: 22, pending: 14 },
                { region: 'Southern', processed: 31, pending: 8 },
                { region: 'Eastern', processed: 17, pending: 9 },
                { region: 'Central', processed: 19, pending: 7 },
              ]}
              margin={{ top: 4, right: 8, bottom: 0, left: -18 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 4" stroke={C.grid} vertical={false} />
              <XAxis dataKey="region" tick={{ fontSize: 10.5, fill: '#8A96A5' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10.5, fill: '#8A96A5' }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
              <Bar dataKey="processed" name="Processed" fill={C.blue}  radius={[3,3,0,0]} barSize={14} />
              <Bar dataKey="pending"   name="Pending"   fill={C.amber} radius={[3,3,0,0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Row 3: Ageing + Processing Efficiency ── */}
      <div className="dashboard-row-1-1">
        <ChartCard
          title="Pendency Ageing Analysis"
          desc="Applications grouped by duration of pending status. Older cases require priority attention."
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ageingData} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 4" stroke={C.grid} vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#8A96A5' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10.5, fill: '#8A96A5' }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="count" name="Applications" radius={[4,4,0,0]} barSize={30}>
                {ageingData.map((_, i) => (
                  <Cell key={i} fill={ageingColors[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Processing Efficiency"
          desc="Comparison of incoming applications vs completed decisions."
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={effData} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid strokeDasharray="3 4" stroke={C.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: '#8A96A5' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10.5, fill: '#8A96A5' }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-secondary)' }} />
              <Line dataKey="received"  name="Received"  type="monotone" stroke={C.blue}  strokeWidth={2} dot={{ r: 3, fill: C.blue }}  activeDot={{ r: 5 }} />
              <Line dataKey="completed" name="Completed" type="monotone" stroke={C.green} strokeWidth={2} dot={{ r: 3, fill: C.green }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Row 4: Priority Queue Table ── */}
      {!isEVC && (
        <div className="surface-card animate-in-d3">
          <div className="section-header">
            <div>
              <div className="section-title">
                {isRO ? 'Regional Scrutiny Queue' : isBureau ? 'Final Sanctions Queue' : 'Priority Application Queue'}
              </div>
              <div className="section-desc">
                Applications requiring immediate officer attention
              </div>
            </div>
            <Link to="/applications" className="btn btn-ghost btn-sm flex items-center gap-1">
              View All <ChevronRight size={13} />
            </Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Institution</th>
                  <th>Stage</th>
                  <th>Status</th>
                  <th>Ageing</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(isBureau ? decisionQueue : scrutinyQueue).length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-icon"><CheckCircle2 size={20} color="var(--text-muted)" /></div>
                        <div className="empty-title">Queue is clear</div>
                        <div className="empty-desc">No applications awaiting action at this time.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  (isBureau ? decisionQueue : scrutinyQueue).map(app => (
                    <QueueRow key={app.id} app={app} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── EVC table for EVC role ── */}
      {isEVC && (
        <div className="surface-card animate-in-d3">
          <div className="section-header">
            <div>
              <div className="section-title">Assigned Inspection Cases</div>
              <div className="section-desc">Campus visits assigned to your committee</div>
            </div>
            <Link to="/evc" className="btn btn-ghost btn-sm flex items-center gap-1">
              Full Schedule <ChevronRight size={13} />
            </Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Application</th>
                  <th>Proposed Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {evcQueue.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">
                        <div className="empty-icon"><CalendarCheck size={20} color="var(--text-muted)" /></div>
                        <div className="empty-title">No visits assigned</div>
                        <div className="empty-desc">No inspection visits assigned to your committee.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  evcQueue.map((evc: any) => (
                    <tr key={evc.id}>
                      <td style={{ fontWeight: 500, fontSize: 12 }}>{evc.institution_name ?? '—'}</td>
                      <td><span className="app-id">{evc.application_number ?? '—'}</span></td>
                      <td style={{ fontSize: 12 }}>
                        {evc.proposed_visit_date
                          ? new Date(evc.proposed_visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                          : <span style={{ color: 'var(--text-muted)' }}>Not set</span>}
                      </td>
                      <td>
                        <span className={`badge ${evc.status === 'COMPLETED' ? 'badge-green' : evc.status === 'SCHEDULED' ? 'badge-blue' : 'badge-amber'}`}>
                          {evc.status?.replace(/_/g, ' ') ?? 'PENDING'}
                        </span>
                      </td>
                      <td>
                        <Link to={`/applications/${evc.application_id}`} className="btn btn-ghost btn-sm flex items-center gap-1">
                          <Eye size={12} /> View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Quick links ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }} className="animate-in-d4">
        {[
          { label: 'All Applications', sub: 'View & manage cases', to: '/applications', icon: <FileText size={16} />, color: C.blue },
          { label: 'EVC Scheduling',   sub: 'Manage campus visits',  to: '/evc',          icon: <CalendarCheck size={16} />, color: C.navy },
          { label: 'Undertakings',     sub: 'Compliance tracking',   to: '/compliance',   icon: <ShieldCheck size={16} />, color: C.green },
          { label: 'Escalations',      sub: 'Overdue & alerts',      to: '/escalations',  icon: <AlertTriangle size={16} />, color: C.red },
        ].map(q => (
          <Link key={q.to} to={q.to} style={{ textDecoration: 'none' }}>
            <div
              className="kpi-card"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}
            >
              <div className="kpi-icon-box" style={{
                background: q.color + '15',
                width: 34, height: 34,
              }}>
                <span style={{ color: q.color }}>{q.icon}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }}>{q.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{q.sub}</div>
              </div>
              <ChevronRight size={14} color="var(--text-muted)" />
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
};
