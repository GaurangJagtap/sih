import React, { useEffect, useState } from 'react';
import api from '../api/client';
import {
  AlertTriangle, ShieldAlert, CheckCircle2, Clock, Activity,
  ChevronRight, RefreshCw, Eye, Filter
} from 'lucide-react';
import type { EscalationItem } from '../types';

const TRIGGER_LABELS: Record<string, string> = {
  STAGE_OVERDUE:       'Stage Deadline Exceeded',
  COMPLIANCE_OVERDUE:  'Compliance Obligation Overdue',
  DOCUMENT_EXPIRED:    'Document Expired',
  NO_RESPONSE:         'No Response to Reminder',
  CALL_FAILED:         'Voice Call Unsuccessful',
};

const LEVEL_CONFIG: Record<number, { label: string; cls: string }> = {
  1: { label: 'Level 1 — Initial', cls: 'badge-navy' },
  2: { label: 'Level 2 — Bureau',  cls: 'badge-amber' },
  3: { label: 'Level 3 — Senior',  cls: 'badge-red' },
};

const STATUS_MAP: Record<string, string> = {
  OPEN:        'badge-red',
  IN_REVIEW:   'badge-amber',
  RESOLVED:    'badge-green',
  CLOSED:      'badge-gray',
};

/* ─── Escalation Ladder ─── */
const EscalationLadder = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
    {[
      { level: 1, label: 'Initial Reminder',          sub: 'Automated in-app notification',    color: '#397BB7' },
      { level: 2, label: 'Follow-up Reminder',         sub: 'Second automated notification',    color: '#477FB8' },
      { level: 3, label: 'AI Voice Call',              sub: 'Automated voice agent contact',    color: '#D99A32', highlight: true },
      { level: 4, label: 'Officer Escalation',         sub: 'Assigned to Regional Officer',     color: '#C47C2B' },
      { level: 5, label: 'Senior Authority Review',    sub: 'Escalated to Bureau / Senior',     color: '#C64C4C' },
    ].map((step, i, arr) => (
      <div key={step.level} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
        {/* Line & dot */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
          {i > 0 && <div style={{ width: 2, flex: 1, background: 'var(--border)', minHeight: 10 }} />}
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: step.color + '22',
            border: `2px solid ${step.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: step.color, flexShrink: 0,
          }}>
            {step.level}
          </div>
          {i < arr.length - 1 && <div style={{ width: 2, flex: 1, background: 'var(--border)', minHeight: 10 }} />}
        </div>
        {/* Content */}
        <div style={{ padding: '6px 0 6px 12px', flex: 1 }}>
          <div style={{
            fontSize: 12.5, fontWeight: step.highlight ? 700 : 600,
            color: step.highlight ? step.color : 'var(--text-primary)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {step.label}
            {step.highlight && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99, background: step.color, color: '#fff' }}>
                AI
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{step.sub}</div>
        </div>
      </div>
    ))}
  </div>
);

/* ═══════════════════════════
   ESCALATIONS PAGE
   ═══════════════════════════ */
export const EscalationsPage: React.FC = () => {
  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [levelFilter, setLevelFilter] = useState<number | ''>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [escRes, auditRes] = await Promise.all([
        api.get('/reports/escalations').catch(() => ({ data: [] })),
        api.get('/reports/audit-events').catch(() => ({ data: [] })),
      ]);
      setEscalations(escRes.data || []);
      setAuditEvents(auditRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = levelFilter
    ? escalations.filter(e => e.escalation_level === levelFilter)
    : escalations;

  /* KPIs */
  const openCount     = escalations.filter(e => e.status === 'OPEN').length;
  const level2Count   = escalations.filter(e => e.escalation_level >= 2).length;
  const resolvedCount = escalations.filter(e => e.status === 'RESOLVED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Page header */}
      <div className="animate-in flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Escalation Management</h1>
          <p className="page-desc">Multi-tier automated escalation tracking and regulatory audit trail.</p>
        </div>
        <button onClick={fetchData} className="btn btn-ghost btn-sm flex items-center gap-1.5" style={{ flexShrink: 0 }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 13 }}>
        {[
          { label: 'Total Escalations', value: escalations.length, icon: <AlertTriangle size={17} />, bg: 'var(--red-light)', color: 'var(--red)', sub: 'System-generated' },
          { label: 'Open / Unresolved', value: openCount,          icon: <Activity size={17} />, bg: 'var(--amber-light)', color: 'var(--amber)', sub: 'Requires action' },
          { label: 'Level 2+ Severity',  value: level2Count,        icon: <ShieldAlert size={17} />, bg: 'var(--red-light)', color: 'var(--red)', sub: 'Bureau or above' },
          { label: 'Resolved',           value: resolvedCount,      icon: <CheckCircle2 size={17} />, bg: 'var(--green-light)', color: 'var(--green)', sub: 'Successfully closed' },
        ].map((k, i) => (
          <div key={k.label} className={`kpi-card animate-in`} style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="kpi-icon-box" style={{ background: k.bg, marginBottom: 10 }}>
              <span style={{ color: k.color }}>{k.icon}</span>
            </div>
            <div className="kpi-value tabular">{k.value}</div>
            <div className="kpi-label" style={{ marginTop: 4 }}>{k.label}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Main content row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16 }}>

        {/* Escalations Table */}
        <div className="surface-card animate-in-d1">
          <div className="section-header">
            <div>
              <div className="section-title">Active Regulatory Escalations</div>
              <div className="section-desc">Automatically generated by the deadline monitoring scheduler</div>
            </div>
            <div className="filter-toolbar">
              {[{ v: '', l: 'All' }, { v: 1, l: 'L1' }, { v: 2, l: 'L2' }, { v: 3, l: 'L3' }].map(f => (
                <button
                  key={String(f.v)}
                  className={`filter-pill ${levelFilter === f.v ? 'active' : ''}`}
                  onClick={() => setLevelFilter(f.v as any)}
                >
                  {f.l}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 20 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton skeleton-text" style={{ height: 40, marginBottom: 10 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><CheckCircle2 size={22} color="var(--text-muted)" /></div>
              <div className="empty-title">No escalations</div>
              <div className="empty-desc">All cases are within their prescribed timelines.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Trigger</th>
                    <th>Summary</th>
                    <th>Level</th>
                    <th>Assigned Role</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(esc => {
                    const lc = LEVEL_CONFIG[esc.escalation_level] ?? { label: `Level ${esc.escalation_level}`, cls: 'badge-gray' };
                    return (
                      <tr key={esc.id}>
                        <td>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)' }}>
                            {TRIGGER_LABELS[esc.trigger_type] ?? esc.trigger_type?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ maxWidth: 280 }}>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {esc.summary}
                          </div>
                        </td>
                        <td><span className={`badge ${lc.cls}`}>{lc.label}</span></td>
                        <td style={{ fontSize: 11.5, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {esc.assigned_role?.replace(/_/g, ' ')}
                        </td>
                        <td>
                          <span className={`badge ${STATUS_MAP[esc.status] ?? 'badge-gray'}`}>
                            {esc.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(esc.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Escalation Ladder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="chart-card animate-in-d1">
            <div className="chart-title" style={{ marginBottom: 14 }}>Escalation Process</div>
            <EscalationLadder />
          </div>

          {/* Audit summary */}
          <div className="chart-card animate-in-d2">
            <div className="chart-title" style={{ marginBottom: 12 }}>Recent Audit Events</div>
            {auditEvents.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-title">No audit events</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {auditEvents.slice(0, 5).map((ev: any, i: number) => (
                  <div key={i} style={{
                    padding: '9px 11px',
                    background: 'var(--bg-surface-2)',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {ev.action?.replace(/_/g, ' ') ?? 'System Event'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {ev.user_email ?? 'system'} · {ev.created_at ? new Date(ev.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
