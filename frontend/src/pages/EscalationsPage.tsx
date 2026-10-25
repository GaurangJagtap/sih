import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { AlertTriangle, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import type { EscalationItem } from '../types';

export const EscalationsPage: React.FC = () => {
  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEscalations = async () => {
      try {
        setLoading(true);
        const [escRes, auditRes] = await Promise.all([
          api.get('/reports/escalations'),
          api.get('/reports/audit-events'),
        ]);
        setEscalations(escRes.data);
        setAuditEvents(auditRes.data);
      } catch (err) {
        console.error('Failed to load escalations', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEscalations();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Escalations & Statutory Audit Trail</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Automated multi-tier officer escalation rules, overdue task flagging, and append-only regulatory audit log.
        </p>
      </div>

      {/* Escalations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Active Regulatory Escalations ({escalations.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
              <tr>
                <th className="py-3 px-4">Trigger Ground</th>
                <th className="py-3 px-4">Escalation Tier</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Summary</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Triggered Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {escalations.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-red-700">
                    {e.trigger_type}
                  </td>
                  <td className="py-3 px-4 font-semibold">Tier {e.escalation_level}</td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{e.assigned_role}</td>
                  <td className="py-3 px-4 max-w-sm">{e.summary}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-red-100 text-red-800">
                      {e.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[10px]">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Trail Registry */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            Immutable System-Wide Audit Log (Recent 50 Events)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
              {auditEvents.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-bold text-blue-700">{a.action}</td>
                  <td className="py-2.5 px-4 font-sans font-medium text-slate-900">
                    {a.actor_name} ({a.actor_role})
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">{a.target_entity}</td>
                  <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate">
                    {JSON.stringify(a.details)}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">{a.ip_address}</td>
                  <td className="py-2.5 px-4 text-slate-400 font-sans">
                    {new Date(a.created_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
