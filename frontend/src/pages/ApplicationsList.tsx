import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  FileText, Search, Plus, Clock, AlertTriangle, CheckCircle2,
  Eye, X, ChevronDown, Filter, RefreshCw, Building2
} from 'lucide-react';
import type { ApplicationItem } from '../types';

/* ── Status badge mapping ── */
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  UNDER_SCRUTINY:        { label: 'Under Scrutiny',       cls: 'badge-blue' },
  DEFICIENCY_RETURNED:   { label: 'Deficiency Returned',  cls: 'badge-amber' },
  RESUBMITTED:           { label: 'Resubmitted',          cls: 'badge-navy' },
  AWAITING_EVC:          { label: 'Awaiting EVC',         cls: 'badge-blue' },
  EVC_SCHEDULED:         { label: 'EVC Scheduled',        cls: 'badge-blue' },
  EVC_COMPLETED:         { label: 'EVC Completed',        cls: 'badge-green' },
  AWAITING_DECISION:     { label: 'Awaiting Decision',    cls: 'badge-amber' },
  CONDITIONALLY_APPROVED:{ label: 'Cond. Approved',      cls: 'badge-navy' },
  APPROVED:              { label: 'Approved',             cls: 'badge-green' },
  REJECTED:              { label: 'Rejected',             cls: 'badge-red' },
};

const STAGE_OPTS = [
  { value: '', label: 'All Stages' },
  { value: 'INTAKE', label: 'Intake' },
  { value: 'SCRUTINY', label: 'Scrutiny' },
  { value: 'DEFICIENCY_REVIEW', label: 'Deficiency Review' },
  { value: 'EVC', label: 'EVC' },
  { value: 'DECISION', label: 'Decision' },
  { value: 'AWAITING_COMPLIANCE', label: 'Awaiting Compliance' },
  { value: 'CLOSED', label: 'Closed' },
];

const ROUTE_OPTS = ['ROUTE_A', 'ROUTE_B', 'ROUTE_C'];
const APP_TYPES = [
  'Extension of Approval (EoA)',
  'New Institute Establishment',
  'Increase of Intake',
  'New Course / Programme',
];
const COURSE_OPTS = [
  'B.Tech Artificial Intelligence & Data Science',
  'B.Tech Computer Science & Engineering',
  'MBA Business Analytics',
  'MCA (Master of Computer Applications)',
  'B.Tech Electronics & Communication',
];

function daysAgo(dateStr: string | null): string {
  if (!dateStr) return '—';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1 day';
  return `${diff} days`;
}

/* ─── Modal ─── */
const CreateModal: React.FC<{
  onClose: () => void;
  onCreated: () => void;
}> = ({ onClose, onCreated }) => {
  const [routeCode, setRouteCode] = useState('ROUTE_A');
  const [appType,   setAppType]   = useState(APP_TYPES[0]);
  const [course,    setCourse]    = useState(COURSE_OPTS[0]);
  const [intake,    setIntake]    = useState(120);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setSubmitting(true);
      await api.post('/applications', {
        workflow_route_code: routeCode,
        application_type:    appType,
        academic_year:       '2026-2027',
        course_name:         course,
        intake_capacity:     intake,
        faculty_count:       24,
        campus_area_acres:   10.5,
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(23,43,77,0.42)',
        backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="animate-scale"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: 'var(--shadow-xl)',
          width: '100%',
          maxWidth: 520,
        }}
      >
        {/* Modal header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy-text)' }}>Submit New Application</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>AICTE Approval & Permission for 2026-27</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="form-label">Workflow Route</label>
              <select className="form-select" value={routeCode} onChange={e => setRouteCode(e.target.value)}>
                {ROUTE_OPTS.map(r => <option key={r} value={r}>{r} — {r === 'ROUTE_A' ? 'Standard Scrutiny' : r === 'ROUTE_B' ? 'Scrutiny + EVC' : 'Complex'}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Application Type</label>
              <select className="form-select" value={appType} onChange={e => setAppType(e.target.value)}>
                {APP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Programme / Course</label>
            <select className="form-select" value={course} onChange={e => setCourse(e.target.value)}>
              {COURSE_OPTS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Proposed Intake Capacity</label>
            <input
              type="number"
              className="form-input"
              value={intake}
              onChange={e => setIntake(Number(e.target.value))}
              min={30} max={300} step={30}
            />
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 14 }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-md">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-md" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ═══════════════════════════
   APPLICATIONS LIST
   ═══════════════════════════ */
export const ApplicationsList: React.FC = () => {
  const { user } = useAuth();
  const isInstitution = user?.role === 'INSTITUTION';

  const [apps, setApps]           = useState<ApplicationItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [showCreate, setShowCreate]   = useState(false);

  const fetchApps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/applications', {
        params: { stage: stageFilter || undefined },
      });
      setApps(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [stageFilter]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const filtered = apps.filter(a =>
    a.application_number.toLowerCase().includes(search.toLowerCase()) ||
    a.institution_name.toLowerCase().includes(search.toLowerCase()) ||
    (a.region || '').toLowerCase().includes(search.toLowerCase())
  );

  /* Stage filter counts */
  const stageCounts = STAGE_OPTS.slice(1).reduce((acc, s) => {
    acc[s.value] = apps.filter(a => a.current_stage === s.value).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Page header ── */}
      <div className="animate-in flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Application Management</h1>
          <p className="page-desc">Stage-wise tracking, deficiency management and authorised scrutiny of AICTE applications.</p>
        </div>
        <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
          <button onClick={fetchApps} className="btn btn-ghost btn-sm flex items-center gap-1.5">
            <RefreshCw size={13} /> Refresh
          </button>
          {isInstitution && (
            <button
              onClick={() => setShowCreate(true)}
              className="btn btn-primary btn-md flex items-center gap-2"
            >
              <Plus size={14} /> New Application
            </button>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="surface-card animate-in-d1" style={{ padding: '14px 18px' }}>
        <div className="flex items-center gap-10 flex-wrap">
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 360 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="form-input"
              placeholder="Search by ID, institution or region…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32, width: '100%' }}
            />
          </div>

          {/* Stage filter pills */}
          <div className="filter-toolbar" style={{ flex: 1 }}>
            {STAGE_OPTS.map(s => (
              <button
                key={s.value}
                className={`filter-pill ${stageFilter === s.value ? 'active' : ''}`}
                onClick={() => setStageFilter(s.value)}
              >
                {s.label}
                {s.value && stageCounts[s.value] > 0 && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    padding: '0 5px', borderRadius: 99,
                    background: stageFilter === s.value ? 'var(--blue-primary)' : 'var(--border-strong)',
                    color: stageFilter === s.value ? '#fff' : 'var(--text-secondary)',
                    marginLeft: 2,
                  }}>
                    {stageCounts[s.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="surface-card animate-in-d2" style={{ overflow: 'hidden' }}>
        {/* Summary row */}
        <div style={{
          padding: '11px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-surface-2)',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> of {apps.length} applications
          </span>
          <div className="flex items-center gap-3" style={{ fontSize: 11.5 }}>
            <span className="badge badge-red"><span className="badge-dot" style={{ background: 'var(--red)' }} />{apps.filter(a => a.is_overdue).length} Overdue</span>
            <span className="badge badge-green">{apps.filter(a => ['APPROVED'].includes(a.status)).length} Approved</span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 24 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton skeleton-text" style={{ height: 40, marginBottom: 10 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 20px' }}>
            <div className="empty-icon"><FileText size={22} color="var(--text-muted)" /></div>
            <div className="empty-title">No applications found</div>
            <div className="empty-desc">
              {search ? `No results for "${search}". Try a different search term.` : 'No applications match the selected filters.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Institution</th>
                  {!isInstitution && <th>Region</th>}
                  <th>Type</th>
                  <th>Route</th>
                  <th>Stage</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Pending</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(app => {
                  const sm = STATUS_MAP[app.status] ?? { label: app.status?.replace(/_/g, ' '), cls: 'badge-gray' };
                  return (
                    <tr key={app.id}>
                      <td>
                        <span className="app-id">{app.application_number}</span>
                      </td>
                      <td>
                        <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>
                          {app.institution_name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {app.permanent_id}
                        </div>
                      </td>
                      {!isInstitution && (
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {app.region || '—'}
                        </td>
                      )}
                      <td style={{ fontSize: 11.5, color: 'var(--text-secondary)', maxWidth: 160 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {app.application_type}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-navy" style={{ fontSize: 10 }}>
                          {app.route_code}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-blue" style={{ fontSize: 10.5 }}>
                          {app.current_stage?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${sm.cls}`}>{sm.label}</span>
                      </td>
                      <td style={{ fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {app.submitted_at
                          ? new Date(app.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                          : '—'}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {app.is_overdue ? (
                          <span className="badge badge-red" style={{ fontSize: 10.5 }}>
                            <AlertTriangle size={10} /> Overdue
                          </span>
                        ) : (
                          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                            {daysAgo(app.submitted_at)}
                          </span>
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/applications/${app.id}`}
                          className="btn btn-ghost btn-sm flex items-center gap-1"
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          <Eye size={12} /> Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Create Modal ── */}
      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreated={fetchApps} />
      )}
    </div>
  );
};
