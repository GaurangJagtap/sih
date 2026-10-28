import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Building2, FileText, CheckCircle2, Clock, AlertTriangle,
  ArrowUpRight, PhoneCall, ShieldCheck, TrendingUp, ChevronRight,
  CalendarDays, Zap, Activity
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell
} from 'recharts';
import type { ApplicationItem, UndertakingItem, DocumentItem } from '../types';

const statusConfig: Record<string, { label: string; badge: string }> = {
  SUBMITTED: { label: 'Submitted', badge: 'badge badge-blue' },
  SCRUTINY_IN_PROGRESS: { label: 'Under Scrutiny', badge: 'badge badge-indigo' },
  DEFICIENCY_COMMUNICATED: { label: 'Deficiency Returned', badge: 'badge badge-amber' },
  DEFICIENCY_RETURNED: { label: 'Deficiency Returned', badge: 'badge badge-amber' },
  EVC_SCHEDULED: { label: 'EVC Scheduled', badge: 'badge badge-purple' },
  EVC_COMPLETED: { label: 'EVC Completed', badge: 'badge badge-green' },
  BUREAU_REVIEW: { label: 'Bureau Review', badge: 'badge badge-indigo' },
  APPROVED: { label: 'Approved', badge: 'badge badge-green' },
  REJECTED: { label: 'Rejected', badge: 'badge badge-red' },
};

const validityConfig: Record<string, { badge: string; dot: string }> = {
  VALID: { badge: 'badge badge-green', dot: 'bg-emerald-500' },
  EXPIRING_90: { badge: 'badge badge-blue', dot: 'bg-blue-500' },
  EXPIRING_60: { badge: 'badge badge-amber', dot: 'bg-amber-500' },
  EXPIRING_30: { badge: 'badge badge-red', dot: 'bg-red-500' },
  EXPIRED: { badge: 'badge badge-red', dot: 'bg-red-700' },
};

const undertakingConfig: Record<string, string> = {
  PENDING: 'badge badge-amber',
  SUBMITTED: 'badge badge-blue',
  VERIFIED: 'badge badge-green',
  REJECTED: 'badge badge-red',
};

const WorkflowStep: React.FC<{
  step: number;
  label: string;
  active: boolean;
  done: boolean;
}> = ({ step, label, active, done }) => (
  <div className="flex flex-col items-center gap-1.5 flex-1">
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
        ${done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-100 text-slate-400'}`}
    >
      {done ? '✓' : step}
    </div>
    <span className={`text-[10px] text-center leading-tight font-medium ${active ? 'text-blue-700' : done ? 'text-emerald-700' : 'text-slate-400'}`}>
      {label}
    </span>
  </div>
);

export const InstitutionDashboard: React.FC = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [undertakings, setUndertakings] = useState<UndertakingItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsRes, utRes, docsRes] = await Promise.all([
          api.get('/applications'),
          api.get('/compliance'),
          api.get('/documents'),
        ]);
        setApps(appsRes.data);
        setUndertakings(utRes.data);
        setDocuments(docsRes.data);
      } catch (err) {
        console.error('Failed to load institution data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-28 bg-white rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200" />)}
        </div>
        <div className="h-64 bg-white rounded-2xl border border-slate-200" />
      </div>
    );
  }

  const primaryApp = apps[0];
  const pendingUndertakings = undertakings.filter(u => u.status !== 'VERIFIED');
  const expiringDocs = documents.filter(d => d.validity_status.includes('EXPIRING') || d.validity_status === 'EXPIRED');
  const verifiedUndertakings = undertakings.filter(u => u.status === 'VERIFIED');

  const workflowStages = ['SUBMITTED', 'SCRUTINY_IN_PROGRESS', 'EVC_SCHEDULED', 'BUREAU_REVIEW', 'APPROVED'];
  const currentStageIndex = primaryApp ? workflowStages.indexOf(primaryApp.status) : -1;

  const complianceRate = undertakings.length > 0
    ? Math.round((verifiedUndertakings.length / undertakings.length) * 100)
    : 0;

  const donutData = [
    { name: 'Verified', value: verifiedUndertakings.length, fill: '#10b981' },
    { name: 'Pending', value: pendingUndertakings.length, fill: '#f59e0b' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Institution Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute bottom-2 right-20 w-20 h-20 bg-white/5 rounded-full" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-blue-200" />
              <span className="text-blue-200 text-xs font-semibold">
                AICTE ID: {primaryApp?.permanent_id || 'AICTE-1-000109'}
              </span>
              <span className="text-blue-300 text-xs">· Western Region</span>
            </div>
            <h1 className="text-xl font-extrabold text-white">
              {primaryApp?.institution_name || 'Sunrise Institute of Technology'}
            </h1>
            <p className="text-blue-200 text-xs mt-1">
              Authorized Signatory: Dr. Rajesh Sharma &nbsp;|&nbsp; +91 98220 11223
            </p>
          </div>
          <Link
            to="/applications"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            View Applications
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Workflow Progress Bar */}
        {primaryApp && (
          <div className="relative mt-5 pt-4 border-t border-white/20">
            <div className="text-[10px] text-blue-200 font-semibold uppercase tracking-widest mb-3">
              Application Workflow Progress
            </div>
            <div className="flex items-start justify-between gap-1 relative">
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-white/20">
                <div
                  className="h-full bg-white/60 transition-all duration-700"
                  style={{ width: `${currentStageIndex >= 0 ? (currentStageIndex / (workflowStages.length - 1)) * 100 : 0}%` }}
                />
              </div>
              {workflowStages.map((stage, i) => (
                <WorkflowStep
                  key={stage}
                  step={i + 1}
                  label={stage.replace(/_/g, ' ')}
                  active={i === currentStageIndex}
                  done={i < currentStageIndex}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card blue">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Active Applications</p>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">{apps.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-blue-600 font-medium flex items-center gap-1">
            <Activity className="w-3 h-3" />
            EoA &amp; Intake Approval 2026-27
          </div>
        </div>

        <div className="stat-card amber">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Pending Undertakings</p>
              <div className="text-3xl font-extrabold text-amber-600 mt-1">{pendingUndertakings.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1">
            Evidence submission required
          </div>
        </div>

        <div className="stat-card red">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500">Documents Expiring</p>
              <div className="text-3xl font-extrabold text-red-600 mt-1">{expiringDocs.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-red-500 font-medium flex items-center gap-1">
            Advance renewal alert active
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Applications Table - 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="section-title">Your Approval Applications</h2>
              <p className="section-subtitle">{apps.length} total records</p>
            </div>
            <Link to="/applications" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application No.</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => {
                  const sc = statusConfig[app.status] || { label: app.status, badge: 'badge badge-gray' };
                  return (
                    <tr key={app.id}>
                      <td>
                        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {app.application_number}
                        </span>
                      </td>
                      <td className="text-slate-600 text-xs">{app.application_type}</td>
                      <td><span className={sc.badge}>{sc.label}</span></td>
                      <td className="text-xs text-slate-500">
                        {app.stage_deadline
                          ? new Date(app.stage_deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="text-right">
                        <Link
                          to={`/applications/${app.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          View <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compliance Donut + Rate */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="section-title mb-1">Compliance Summary</h2>
          <p className="section-subtitle mb-4">Undertaking fulfillment rate</p>

          <div className="h-36 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={62}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <div className="text-2xl font-extrabold text-slate-900">{complianceRate}%</div>
              <div className="text-[10px] text-slate-400 font-medium">Fulfilled</div>
            </div>
          </div>

          <div className="space-y-2 mt-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-slate-600">Verified</span></div>
              <span className="font-bold text-slate-800">{verifiedUndertakings.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /><span className="text-slate-600">Pending</span></div>
              <span className="font-bold text-slate-800">{pendingUndertakings.length}</span>
            </div>
            <div className="progress-bar mt-3">
              <div
                className="progress-fill bg-gradient-to-r from-emerald-500 to-teal-400"
                style={{ width: `${complianceRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Undertakings + Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Undertakings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="section-title">Time-Bound Undertakings</h2>
              <p className="section-subtitle">Conditional compliance items</p>
            </div>
            <Link to="/compliance" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {undertakings.slice(0, 4).map((u) => (
              <div key={u.id} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">{u.condition_title}</div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-1">{u.condition_description}</p>
                  </div>
                  <span className={undertakingConfig[u.status] || 'badge badge-gray'}>{u.status}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <CalendarDays className="w-3 h-3" />
                    Due: {new Date(u.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  <Link to="/compliance" className="text-[11px] font-semibold text-blue-600 hover:underline">
                    Upload Proof →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="section-title">Documents &amp; Leases</h2>
              <p className="section-subtitle">Prescribed validity monitoring</p>
            </div>
            <Link to="/documents" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {documents.slice(0, 4).map((d) => {
              const vc = validityConfig[d.validity_status] || { badge: 'badge badge-gray', dot: 'bg-slate-400' };
              return (
                <div key={d.id} className="px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${vc.dot}`} />
                      <div className="text-xs font-semibold text-slate-800 truncate">{d.display_name}</div>
                    </div>
                    <span className={vc.badge}>{d.validity_status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <CalendarDays className="w-3 h-3" />
                      Expiry: {d.expiry_date ? new Date(d.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No Expiry'}
                    </div>
                    <Link to="/documents" className="text-[11px] font-semibold text-purple-600 hover:underline">
                      Renew →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
