import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  FileText, Clock, AlertTriangle, CheckCircle2,
  TrendingUp, Building2, ArrowUpRight, BarChart3
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get('/reports/summary');
        setSummary(res.data);
      } catch (err) {
        console.error('Failed to load dashboard summary', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
        Loading real-time regulatory metrics and application ageing...
      </div>
    );
  }

  const kpis = summary?.kpis || {};
  const stageData = summary?.stage_distribution || [];
  const regionData = summary?.region_pendency || [];

  const COLORS = ['#1e40af', '#0284c7', '#0d9488', '#16a34a', '#d97706', '#dc2626'];

  return (
    <div className="space-y-6">
      {/* Title & Scope */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">AICTE Central Operations & Pendency Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time monitoring of technical approval applications, EVC scheduling, time-bound compliance, and lease tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/voice-agent"
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            Launch AI Voice Reminder
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            to="/applications"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            All Applications
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Intake Applications</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.total_applications}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> All active institutions
          </div>
        </div>

        {/* Pending In Stages */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Scrutiny & EVC</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{kpis.pending_applications}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across 8 regional offices</div>
        </div>

        {/* Overdue / Critical Flag */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Overdue Case Escalations</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600 mt-2">{kpis.overdue_applications}</div>
          <div className="text-[11px] text-red-500 font-medium mt-1 flex items-center gap-1">
            Triggered automated Bureau alerts
          </div>
        </div>

        {/* Regulatory Verified / Compliance */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Compliance Verified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{kpis.verified_compliance}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            Officer-accepted evidence
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Distribution Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Application Stage Breakdown</h2>
              <p className="text-[11px] text-slate-500">Live counts calculated directly from active cases</p>
            </div>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stageData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Region Pendency Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Regional Pendency & Workload</h2>
              <p className="text-[11px] text-slate-500">Active review cases by geographical jurisdiction</p>
            </div>
            <Building2 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionData}
                  dataKey="pending_count"
                  nameKey="region"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ region, pending_count }: any) => `${region}: ${pending_count}`}
                >
                  {regionData.map((_: any, index: number) => (
                    <Cell key={`region-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Compliance & Document Expiry Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-900">Pending Undertakings</div>
            <div className="text-xl font-bold text-amber-700 mt-1">{kpis.pending_compliance} Conditions</div>
            <div className="text-[10px] text-amber-800 mt-0.5">Fire safety, cadre ratio & funds</div>
          </div>
          <Link to="/compliance" className="text-xs font-semibold text-amber-700 hover:underline">
            Inspect →
          </Link>
        </div>

        <div className="bg-purple-50/60 border border-purple-200 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-purple-900">Leases Expiring Soon</div>
            <div className="text-xl font-bold text-purple-700 mt-1">{kpis.expiring_documents} Deeds</div>
            <div className="text-[10px] text-purple-800 mt-0.5">Within 30/60/90 day threshold</div>
          </div>
          <Link to="/documents" className="text-xs font-semibold text-purple-700 hover:underline">
            Inspect →
          </Link>
        </div>

        <div className="bg-rose-50/60 border border-rose-200 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-rose-900">Active Officer Escalations</div>
            <div className="text-xl font-bold text-rose-700 mt-1">{kpis.active_escalations} Flags</div>
            <div className="text-[10px] text-rose-800 mt-0.5">Bureau & Senior Authority action</div>
          </div>
          <Link to="/escalations" className="text-xs font-semibold text-rose-700 hover:underline">
            Inspect →
          </Link>
        </div>
      </div>
    </div>
  );
};
