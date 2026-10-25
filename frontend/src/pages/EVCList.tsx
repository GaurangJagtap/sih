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
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Expert Visit Committee (EVC) Operations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical campus inspection scheduling, committee constitution, deadline monitoring, and inspection reports.
          </p>
        </div>

        {isOfficer && (
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" /> Schedule New EVC Inspection
          </button>
        )}
      </div>

      {/* EVC Register Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading EVC schedule...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
                <tr>
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Institution & Region</th>
                  <th className="py-3 px-4">Inspection Date</th>
                  <th className="py-3 px-4">EVC Panel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Findings & Recommendation</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">
                      {r.application_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{r.institution_name}</div>
                      <div className="text-[10px] text-slate-500">Region: {r.region}</div>
                    </td>
                    <td className="py-3 px-4">
                      {r.scheduled_date ? (
                        <div className="font-medium text-slate-800">
                          {new Date(r.scheduled_date).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-slate-400">Not scheduled</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {r.committee_members?.map((m: any, idx: number) => (
                        <div key={idx} className="text-[11px] text-slate-600">
                          • {m.name || m.designation}
                        </div>
                      )) || 'Panel assigned'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.is_overdue
                            ? 'bg-red-100 text-red-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {r.status} {r.is_overdue && '(OVERDUE)'}
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
