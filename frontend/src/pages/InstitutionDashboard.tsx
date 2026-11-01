import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Building2, FileText, CheckCircle2, Clock, AlertTriangle,
  ArrowUpRight, PhoneCall, ShieldCheck, ChevronRight,
  CalendarDays, Activity, ChevronDown
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip
} from 'recharts';
import type { ApplicationItem, UndertakingItem, DocumentItem } from '../types';

/* ─── Status maps ─── */
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  UNDER_SCRUTINY:         { label: 'Under Scrutiny',    cls: 'badge-blue' },
  DEFICIENCY_RETURNED:    { label: 'Deficiency Issued', cls: 'badge-amber' },
  AWAITING_EVC:           { label: 'Awaiting EVC',      cls: 'badge-blue' },
  AWAITING_DECISION:      { label: 'Awaiting Decision', cls: 'badge-amber' },
  CONDITIONALLY_APPROVED: { label: 'Cond. Approved',    cls: 'badge-navy' },
  APPROVED:               { label: 'Approved',          cls: 'badge-green' },
  REJECTED:               { label: 'Rejected',          cls: 'badge-red' },
};

const VALIDITY_MAP: Record<string, { label: string; cls: string; color: string }> = {
  VALID:               { label: 'Valid',              cls: 'badge-green',  color: '#268568' },
  EXPIRING_SOON_90:    { label: 'Expiring (90d)',     cls: 'badge-navy',   color: '#397BB7' },
  EXPIRING_SOON_60:    { label: 'Expiring (60d)',     cls: 'badge-amber',  color: '#D99A32' },
  EXPIRING_SOON_30:    { label: 'Expiring (30d)',     cls: 'badge-red',    color: '#C64C4C' },
  EXPIRED:             { label: 'Expired',            cls: 'badge-red',    color: '#C64C4C' },
};

const UT_MAP: Record<string, string> = {
  PENDING:               'badge-amber',
  NOT_SUBMITTED:         'badge-amber',
  SUBMITTED:             'badge-blue',
  VERIFIED:              'badge-green',
  RETURNED_FOR_CORRECTION: 'badge-red',
  OVERDUE:               'badge-red',
};

/* ─── Workflow stepper ─── */
const WORKFLOW_STEPS = [
  { key: 'INTAKE',              label: 'Submitted' },
  { key: 'SCRUTINY',            label: 'Scrutiny' },
  { key: 'EVC',                 label: 'EVC Visit' },
  { key: 'DECISION',            label: 'Decision' },
  { key: 'CLOSED',              label: 'Closed' },
];

function getStepIndex(stage: string): number {
  const m: Record<string, number> = {
    INTAKE: 0, SCRUTINY: 1, DEFICIENCY_REVIEW: 1,
    EVC: 2, DECISION: 3, AWAITING_COMPLIANCE: 4, CLOSED: 4,
  };
  return m[stage] ?? 0;
}

const WorkflowStepper: React.FC<{ stage: string; status: string }> = ({ stage, status }) => {
  const active = getStepIndex(stage);
  const isDone = ['APPROVED', 'REJECTED', 'CLOSED'].includes(status);

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '6px 0' }}>
      {WORKFLOW_STEPS.map((step, i) => (
        <React.Fragment key={step.key}>
          {/* Step circle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, zIndex: 1 }}>
            <div style={{
              width: 30, height: 30,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11.5, fontWeight: 700,
              background: i < active || (isDone && i <= active)
                ? 'var(--green)'
                : i === active
                  ? 'var(--blue-primary)'
                  : 'var(--border)',
              color: i <= active ? '#fff' : 'var(--text-muted)',
              transition: 'all 250ms',
              border: i === active && !isDone ? '3px solid var(--blue-light)' : '3px solid transparent',
              boxSizing: 'border-box',
            }}>
              {i < active || isDone ? '✓' : i + 1}
            </div>
            <span style={{
              fontSize: 10,
              fontWeight: i === active ? 700 : 500,
              color: i === active ? 'var(--blue-primary)' : i < active ? 'var(--green)' : 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}>
              {step.label}
            </span>
          </div>
          {/* Connector */}
          {i < WORKFLOW_STEPS.length - 1 && (
            <div style={{
              flex: 1,
              height: 2,
              margin: '-18px 2px 0',
              background: i < active ? 'var(--green)' : 'var(--border)',
              transition: 'background 250ms',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/* ─── Custom tooltip ─── */
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#172B4D', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fff',
    }}>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ marginBottom: i < payload.length - 1 ? 3 : 0 }}>
          <span style={{ color: p.fill }}>{p.name}: </span>
          <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════
   INSTITUTION DASHBOARD
   ═══════════════════════════════════ */
export const InstitutionDashboard: React.FC = () => {
  const { user } = useAuth();
  const [apps, setApps]               = useState<ApplicationItem[]>([]);
  const [undertakings, setUndertakings] = useState<UndertakingItem[]>([]);
  const [documents, setDocuments]     = useState<DocumentItem[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [a, u, d] = await Promise.all([
          api.get('/applications'),
          api.get('/compliance'),
          api.get('/documents'),
        ]);
        setApps(a.data || []);
        setUndertakings(u.data || []);
        setDocuments(d.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="skeleton skeleton-card" style={{ height: 80 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 13 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton skeleton-card" style={{ height: 100 }} />)}
        </div>
        <div className="skeleton skeleton-card" style={{ height: 180 }} />
      </div>
    );
  }

  /* ── Derived metrics ── */
  const activeApp   = apps.find(a => !['APPROVED','REJECTED','CLOSED'].includes(a.status)) || apps[0];
  const compScore   = undertakings.length > 0
    ? Math.round((undertakings.filter(u => u.status === 'VERIFIED').length / undertakings.length) * 100)
    : 0;
  const overdueUt   = undertakings.filter(u => u.status === 'OVERDUE' || u.status === 'NOT_SUBMITTED');
  const expDocs     = documents.filter(d => ['EXPIRING_SOON_30','EXPIRED'].includes(d.validity_status));
  const pendingUt   = undertakings.filter(u => ['PENDING','NOT_SUBMITTED'].includes(u.status));

  const compDonut = [
    { name: 'Verified',  value: undertakings.filter(u => u.status === 'VERIFIED').length,  fill: '#268568' },
    { name: 'Submitted', value: undertakings.filter(u => u.status === 'SUBMITTED').length, fill: '#397BB7' },
    { name: 'Pending',   value: pendingUt.length, fill: '#D99A32' },
    { name: 'Overdue',   value: overdueUt.length, fill: '#C64C4C' },
  ].filter(d => d.value > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Welcome Banner ── */}
      <div
        className="animate-in"
        style={{
          background: 'linear-gradient(135deg, #172B4D 0%, #244B73 60%, #2864A5 100%)',
          borderRadius: 14,
          padding: '22px 26px',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Building2 size={18} style={{ opacity: 0.7 }} />
            <span style={{ fontSize: 11.5, fontWeight: 600, opacity: 0.65, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Institution Portal
            </span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2, marginBottom: 5 }}>
            Welcome, {user?.full_name}
          </h1>
          <p style={{ fontSize: 12, opacity: 0.65, lineHeight: 1.5, maxWidth: 500 }}>
            AICTE Approval & Compliance Portal · Academic Year 2026-27 · Regulatory Operations
          </p>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 3 }}>Compliance Score</div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
            {compScore}<span style={{ fontSize: 20 }}>%</span>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 13 }}>
        {[
          {
            label: 'Active Applications',
            value: apps.filter(a => !['APPROVED','REJECTED','CLOSED'].includes(a.status)).length,
            icon: <FileText size={17} />,
            iconBg: 'var(--blue-light)', iconColor: 'var(--blue-primary)',
            sub: 'Currently in workflow',
            delay: '0.04s',
            to: '/applications',
          },
          {
            label: 'Pending Undertakings',
            value: pendingUt.length,
            icon: <Clock size={17} />,
            iconBg: 'var(--amber-light)', iconColor: 'var(--amber)',
            sub: 'Awaiting submission',
            delay: '0.08s',
            to: '/compliance',
          },
          {
            label: 'Overdue Obligations',
            value: overdueUt.length,
            icon: <AlertTriangle size={17} />,
            iconBg: 'var(--red-light)', iconColor: 'var(--red)',
            sub: 'Past due date',
            delay: '0.12s',
            to: '/compliance',
          },
          {
            label: 'Documents Expiring',
            value: expDocs.length,
            icon: <CalendarDays size={17} />,
            iconBg: expDocs.length > 0 ? 'var(--red-light)' : 'var(--green-light)',
            iconColor: expDocs.length > 0 ? 'var(--red)' : 'var(--green)',
            sub: 'Within 30 days',
            delay: '0.16s',
            to: '/documents',
          },
        ].map(k => (
          <Link key={k.label} to={k.to} style={{ textDecoration: 'none' }}>
            <div className="kpi-card animate-in" style={{ animationDelay: k.delay }}>
              <div style={{ marginBottom: 10 }}>
                <div className="kpi-icon-box" style={{ background: k.iconBg }}>
                  <span style={{ color: k.iconColor }}>{k.icon}</span>
                </div>
              </div>
              <div className="kpi-value tabular">{k.value}</div>
              <div className="kpi-label" style={{ marginTop: 4 }}>{k.label}</div>
              <div className="kpi-sub">{k.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Active Application Status ── */}
      {activeApp && (
        <div className="surface-card animate-in-d1">
          <div className="section-header">
            <div>
              <div className="section-title">Application Status</div>
              <div className="section-desc">Live position of your active AICTE application in the regulatory workflow</div>
            </div>
            <Link to={`/applications/${activeApp.id}`} className="btn btn-ghost btn-sm flex items-center gap-1">
              Full Detail <ChevronRight size={13} />
            </Link>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 3 }}>
                  Application Number
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--blue-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {activeApp.application_number}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>
                  {activeApp.application_type} · {activeApp.route_code} · AY {activeApp.academic_year}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Current Status</div>
                <span className={`badge ${STATUS_MAP[activeApp.status]?.cls ?? 'badge-gray'}`}>
                  {STATUS_MAP[activeApp.status]?.label ?? activeApp.status?.replace(/_/g, ' ')}
                </span>
                {activeApp.is_overdue && (
                  <div style={{ marginTop: 6 }}>
                    <span className="badge badge-red">
                      <AlertTriangle size={10} /> Stage Overdue
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stepper */}
            <WorkflowStepper stage={activeApp.current_stage} status={activeApp.status} />

            {/* Deadline */}
            {activeApp.stage_deadline && (
              <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--bg-surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  <Clock size={13} color="var(--text-muted)" />
                  <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    Stage deadline: <strong style={{ color: activeApp.is_overdue ? 'var(--red)' : 'var(--text-primary)' }}>
                      {new Date(activeApp.stage_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Row: Compliance Donut + Undertakings List ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        {/* Compliance Donut */}
        <div className="chart-card animate-in-d2">
          <div className="chart-title">Compliance Health</div>
          <div className="chart-desc">Undertaking obligations by status</div>
          <div style={{ marginTop: 16 }}>
            {undertakings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><ShieldCheck size={20} color="var(--text-muted)" /></div>
                <div className="empty-title">No undertakings</div>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie
                      data={compDonut}
                      cx="50%" cy="50%"
                      innerRadius={52} outerRadius={75}
                      paddingAngle={2}
                      dataKey="value"
                      animationBegin={300}
                      animationDuration={700}
                    >
                      {compDonut.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Pie>
                    <Tooltip content={<DarkTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {compDonut.map(d => (
                    <div key={d.name} className="flex items-center justify-between" style={{ fontSize: 11.5 }}>
                      <div className="flex items-center gap-2">
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: d.fill, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Pending undertakings table */}
        <div className="surface-card animate-in-d2">
          <div className="section-header">
            <div>
              <div className="section-title">Mandatory Undertakings</div>
              <div className="section-desc">Compliance obligations requiring your attention</div>
            </div>
            <Link to="/compliance" className="btn btn-ghost btn-sm flex items-center gap-1">
              All Undertakings <ChevronRight size={13} />
            </Link>
          </div>
          {undertakings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><CheckCircle2 size={20} color="var(--text-muted)" /></div>
              <div className="empty-title">No undertakings found</div>
              <div className="empty-desc">No compliance obligations assigned.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {undertakings.slice(0, 7).map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>{u.condition_title}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{u.undertaking_code}</div>
                      </td>
                      <td style={{ fontSize: 11.5, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(u.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </td>
                      <td>
                        <span className={`badge ${UT_MAP[u.status] ?? 'badge-gray'}`}>
                          {u.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Document validity snapshot ── */}
      <div className="surface-card animate-in-d3">
        <div className="section-header">
          <div>
            <div className="section-title">Document Validity Status</div>
            <div className="section-desc">Institutional documents, lease deeds and regulatory NOCs</div>
          </div>
          <Link to="/documents" className="btn btn-ghost btn-sm flex items-center gap-1">
            All Documents <ChevronRight size={13} />
          </Link>
        </div>
        {documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><FileText size={20} color="var(--text-muted)" /></div>
            <div className="empty-title">No documents on record</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Issue Date</th>
                  <th>Expiry Date</th>
                  <th>Validity</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                {documents.slice(0, 5).map(doc => {
                  const v = VALIDITY_MAP[doc.validity_status] ?? { label: doc.validity_status, cls: 'badge-gray', color: '#697586' };
                  return (
                    <tr key={doc.id}>
                      <td>
                        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{doc.display_name}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{doc.document_type}</div>
                      </td>
                      <td style={{ fontSize: 11.5, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {doc.issue_date ? new Date(doc.issue_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ fontSize: 11.5, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td>
                        <span className={`badge ${v.cls}`}>{v.label}</span>
                      </td>
                      <td>
                        <span className={`badge ${doc.verification_status === 'VERIFIED' ? 'badge-green' : 'badge-gray'}`}>
                          {doc.verification_status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }} className="animate-in-d4">
        {[
          { label: 'New Application', sub: 'Start EoA or new programme approval', to: '/applications', icon: <Plus size={16} />, color: '#2864A5' },
          { label: 'AI Support Agent', sub: 'Automated compliance assistance', to: '/voice-agent', icon: <PhoneCall size={16} />, color: '#C64C4C', badge: 'AI' },
          { label: 'My Applications', sub: 'Track active workflow cases', to: '/applications', icon: <FileText size={16} />, color: '#268568' },
        ].map(q => (
          <Link key={q.label} to={q.to} style={{ textDecoration: 'none' }}>
            <div className="kpi-card flex items-center gap-3" style={{ padding: '13px 16px' }}>
              <div className="kpi-icon-box" style={{ background: q.color + '18', width: 34, height: 34 }}>
                <span style={{ color: q.color }}>{q.icon}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)' }} className="flex items-center gap-1.5">
                  {q.label}
                  {q.badge && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99, background: '#C64C4C', color: '#fff' }}>
                      {q.badge}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{q.sub}</div>
              </div>
              <ChevronRight size={13} color="var(--text-muted)" />
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
};

/* ── local Plus icon (not imported above) ── */
function Plus({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>;
}
