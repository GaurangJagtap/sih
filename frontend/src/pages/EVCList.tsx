import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  CalendarCheck, Clock, CheckCircle2, UserCheck, AlertTriangle, Plus
} from 'lucide-react';

export const EVCList: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Scheduling modal state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [chairmanName, setChairmanName] = useState('Prof. R. C. Mathur (IIT Bombay)');
  const [expertName, setExpertName] = useState('Dr. Sunita Deshmukh (COEP Pune)');

  // Complete inspection modal state
  const [selectedEvcId, setSelectedEvcId] = useState<string | null>(null);
  const [reportSummary, setReportSummary] = useState('');
  const [recommendation, setRecommendation] = useState('RECOMMENDED');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get('/evc');
      setRecords(res.data);
    } catch (err) {
      console.error('Failed to load EVC records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/evc/schedule', {
        application_id: selectedAppId,
        scheduled_date: new Date(scheduledDate).toISOString(),
        committee_members: [
          { name: chairmanName, role: 'Committee Chairman' },
          { name: expertName, role: 'Subject Expert' },
        ],
      });
      setShowScheduleModal(false);
      fetchRecords();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Scheduling error');
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvcId) return;
    try {
      await api.post(`/evc/${selectedEvcId}/complete`, {
        report_summary: reportSummary,
        recommendation,
      });
      setSelectedEvcId(null);
      setReportSummary('');
      fetchRecords();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Completion error');
    }
  };

  const isOfficer = user?.role === 'REGIONAL_OFFICER' || user?.role === 'EVC_COMMITTEE' || user?.role === 'ADMIN';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div className="animate-in" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 className="page-title">EVC Scheduling & Operations</h1>
          <p className="page-desc">Expert Visit Committee campus inspection scheduling, panel constitution, and inspection reporting.</p>
        </div>
        {isOfficer && (
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="btn btn-primary btn-md flex items-center gap-2"
            style={{ flexShrink: 0 }}
          >
            <Plus size={15} /> Schedule EVC Inspection
          </button>
        )}
      </div>

      {/* EVC Register Table */}
      <div className="surface-card animate-in-d1" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton skeleton-text" style={{ height: 38, marginBottom: 10 }} />
            ))}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Institution & Region</th>
                  <th>Inspection Date</th>
                  <th>EVC Panel</th>
                  <th>Status</th>
                  <th>Findings</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td><span className="app-id">{r.application_number}</span></td>
                    <td>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>{r.institution_name}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>Region: {r.region}</div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {r.scheduled_date ? (
                        new Date(r.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Not scheduled</span>
                      )}
                    </td>
                    <td>
                      {r.committee_members?.map((m: any, idx: number) => (
                        <div key={idx} style={{ fontSize: 11, color: 'var(--text-secondary)' }}>• {m.name || m.designation}</div>
                      )) || <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Panel assigned</span>}
                    </td>
                    <td>
                      <span className={`badge ${
                          r.status === 'COMPLETED' ? 'badge-green'
                          : r.is_overdue ? 'badge-red'
                          : r.status === 'SCHEDULED' ? 'badge-blue'
                          : 'badge-amber'
                        }`}>
                        {r.status?.replace(/_/g, ' ')} {r.is_overdue && '· Overdue'}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs text-[11px]">
                      {r.recommendation && (
                        <span className="font-bold text-emerald-700 block mb-0.5">
                          {r.recommendation}
                        </span>
                      )}
                      <span className="text-slate-600 truncate block">{r.report_summary || 'Inspection pending'}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isOfficer && r.status !== 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => setSelectedEvcId(r.id)}
                          className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded font-semibold text-[11px]"
                        >
                          Submit Report
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Schedule Physical EVC Inspection</h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter target application ID and appoint senior academic inspection committee.
            </p>

            <form onSubmit={handleSchedule} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Application ID (UUID or Number)</label>
                <input
                  type="text"
                  required
                  placeholder="Paste Application ID (e.g. from register)"
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inspection Scheduled Date</label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">EVC Chairman</label>
                <input
                  type="text"
                  required
                  value={chairmanName}
                  onChange={(e) => setChairmanName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Expert</label>
                <input
                  type="text"
                  required
                  value={expertName}
                  onChange={(e) => setExpertName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-purple-600 text-white rounded-lg font-semibold"
                >
                  Schedule EVC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Report Modal */}
      {selectedEvcId && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Submit Official EVC Report</h2>
            <p className="text-xs text-slate-500 mb-4">
              Record physical infrastructure and faculty verification findings.
            </p>

            <form onSubmit={handleComplete} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Committee Recommendation</label>
                <select
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                >
                  <option value="RECOMMENDED">RECOMMENDED — Norms Satisfied</option>
                  <option value="DEFICIENT">DEFICIENT — Infrastructure Shortfalls Found</option>
                  <option value="REJECTED">NOT RECOMMENDED — Critical Deficiencies</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Physical Inspection Summary</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Record classroom counts, laboratories, library volumes, and built-up area findings..."
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEvcId(null)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-purple-600 text-white rounded-lg font-semibold"
                >
                  Submit Final Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
