import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  FileText, ShieldCheck, ArrowLeft, CheckCircle2, AlertTriangle,
  Clock, RotateCcw, Send, CalendarCheck, PhoneCall, ChevronRight,
  ClipboardList
} from 'lucide-react';

export const ApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'deficiencies' | 'compliance' | 'evc' | 'calls'>('timeline');

  // Transition actions
  const [actionRemarks, setActionRemarks] = useState('');
  const [deficiencyCategory, setDeficiencyCategory] = useState('Land Lease & Encumbrance');
  const [deficiencyDetails, setDeficiencyDetails] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/applications/${id}`);
      setApp(res.data);
    } catch (err: any) {
      console.error('Failed to load application details', err);
      alert(err.response?.data?.detail || 'Failed to load case');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleTransition = async (action: string) => {
    try {
      setSubmittingAction(true);
      await api.post(`/applications/${id}/transition`, {
        action,
        remarks: actionRemarks,
        deficiency_category: action === 'RETURN_DEFICIENCY' ? deficiencyCategory : undefined,
        deficiency_details: action === 'RETURN_DEFICIENCY' ? deficiencyDetails : undefined,
      });
      setActionRemarks('');
      setDeficiencyDetails('');
      fetchDetails();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed transition');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
        Loading case details and workflow timeline...
      </div>
    );
  }

  if (!app) {
    return <div className="text-center p-8 text-xs text-slate-500">Application not found</div>;
  }

  const isRO = user?.role === 'REGIONAL_OFFICER' || user?.role === 'ADMIN';
  const isBureau = user?.role === 'BUREAU_OFFICER' || user?.role === 'SENIOR_AUTHORITY' || user?.role === 'ADMIN';
  const isInstitution = user?.role === 'INSTITUTION';

  return (
    <div className="space-y-6">
      {/* Back button and case header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate('/applications')}
          className="p-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 text-xs flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Register
        </button>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
              {app.application_number}
            </span>
            <span className="text-xs text-slate-500">
              Configured Route: <b>{app.workflow_route?.name}</b> (v{app.workflow_route?.version})
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">{app.institution?.name}</h1>
          <p className="text-xs text-slate-500">
            Region: {app.region} | Application Type: {app.application_type} | Academic Year: {app.academic_year}
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs font-semibold text-slate-500">Current Stage & Status</div>
          <div className="flex items-center gap-2 mt-1 justify-end">
            <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-bold text-xs rounded border border-slate-200">
              {app.current_stage}
            </span>
            <span
              className={`px-2.5 py-1 text-xs font-bold rounded ${
                app.status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : app.status === 'DEFICIENCY_RETURNED'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {app.status}
            </span>
          </div>
        </div>
      </div>

      {/* Regulatory Workflow Transition Actions Panel */}
      <div className="bg-slate-900 text-white p-5 rounded-xl shadow-md border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
              Authorized Workflow Action Bar (Role: {user?.role})
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Strict regulatory engine checks enforced</span>
        </div>

        {/* Action Controls for Regional Officer */}
        {isRO && app.current_stage === 'SCRUTINY' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-xs">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
              <span className="font-semibold text-emerald-400 block">Option A: Pass Scrutiny Verification</span>
              <p className="text-slate-300 text-[11px]">
                Confirm all documentation, land deeds, and cadre requirements meet AICTE norms.
              </p>
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => handleTransition('PASS_SCRUTINY')}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
              >
                Pass Scrutiny → Next Route Stage
              </button>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
              <span className="font-semibold text-amber-400 block">Option B: Return with Deficiency Reason</span>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Deficiency Category</label>
                <select
                  value={deficiencyCategory}
                  onChange={(e) => setDeficiencyCategory(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded text-xs"
                >
                  <option value="Land Lease & Encumbrance">Land Lease & Encumbrance</option>
                  <option value="Fire Safety NOC Missing">Fire Safety NOC Missing</option>
                  <option value="Faculty Cadre Ratio Deficiency">Faculty Cadre Ratio Deficiency</option>
                  <option value="Corpus Fund Guarantee">Corpus Fund Guarantee</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Mandatory Deficiency Reason</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detail exact statutory omission for institution rectification..."
                  value={deficiencyDetails}
                  onChange={(e) => setDeficiencyDetails(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded text-xs"
                />
              </div>
              <button
                type="button"
                disabled={submittingAction || !deficiencyDetails}
                onClick={() => handleTransition('RETURN_DEFICIENCY')}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs disabled:opacity-50"
              >
                Return Application for Deficiency
              </button>
            </div>
          </div>
        )}

        {/* Institution Action: Resubmission */}
        {isInstitution && app.status === 'DEFICIENCY_RETURNED' && (
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3 text-xs">
            <span className="font-semibold text-blue-400 block">Rectification & Resubmission</span>
            <p className="text-slate-300 text-[11px]">
              Upload required rectifications and resubmit application for regional scrutiny review.
            </p>
            <input
              type="text"
              placeholder="Institution rectification statement or reference..."
              value={actionRemarks}
              onChange={(e) => setActionRemarks(e.target.value)}
              className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded text-xs"
            />
            <button
              type="button"
              disabled={submittingAction}
              onClick={() => handleTransition('RESUBMIT')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs"
            >
              Confirm Resubmission to Regional Officer
            </button>
          </div>
        )}

        {/* Bureau / Senior Authority Decision Stage */}
        {isBureau && app.current_stage === 'DECISION' && (
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3 text-xs">
            <span className="font-semibold text-purple-400 block">Regulatory Final Decision Panel</span>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => handleTransition('APPROVE')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs"
              >
                Grant Full Approval (EoA)
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => handleTransition('CONDITIONALLY_APPROVE')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-xs"
              >
                Conditional Approval (Time-bound Undertaking)
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => handleTransition('REJECT')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-xs"
              >
                Reject Application
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Layout */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-3 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'timeline' ? 'border-blue-600 text-blue-700 bg-white font-bold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" /> Workflow Timeline & Audit ({app.stage_history?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deficiencies')}
            className={`px-4 py-3 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'deficiencies' ? 'border-blue-600 text-blue-700 bg-white font-bold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Observations & Deficiencies ({app.observations?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('compliance')}
            className={`px-4 py-3 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'compliance' ? 'border-blue-600 text-blue-700 bg-white font-bold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Undertakings & Compliance ({app.undertakings?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('evc')}
            className={`px-4 py-3 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'evc' ? 'border-blue-600 text-blue-700 bg-white font-bold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4 text-purple-600" /> EVC Records ({app.evc_records?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calls')}
            className={`px-4 py-3 border-b-2 flex items-center gap-1.5 ${
              activeTab === 'calls' ? 'border-blue-600 text-blue-700 bg-white font-bold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <PhoneCall className="w-4 h-4 text-rose-600" /> AI Voice Reminders ({app.call_logs?.length || 0})
          </button>
        </div>

        {/* Tab 1: Stage History & Digital Audit Timeline */}
        {activeTab === 'timeline' && (
          <div className="p-6">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
              Immutable Stage Progression Trail
            </h3>
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
              {app.stage_history?.map((h: any) => (
                <div key={h.id} className="relative pl-6">
                  <div className="absolute -left-2 top-0.5 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white"></div>
                  <div className="text-xs font-bold text-slate-900">
                    {h.action} {h.to_stage ? `→ ${h.to_stage}` : ''}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Actor: {h.actor_name} ({h.actor_role}) | {new Date(h.created_at).toLocaleString()}
                  </div>
                  {h.remarks && (
                    <div className="mt-1 p-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700">
                      {h.remarks}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Observations & Deficiencies */}
        {activeTab === 'deficiencies' && (
          <div className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Formal Officer Deficiencies Raised
            </h3>
            {app.observations?.length === 0 ? (
              <div className="text-xs text-slate-500">No deficiencies recorded on this case.</div>
            ) : (
              app.observations?.map((obs: any) => (
                <div key={obs.id} className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between items-center font-bold text-amber-900">
                    <span>Category: {obs.deficiency_category} (Stage: {obs.stage})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${obs.is_resolved ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {obs.is_resolved ? 'Rectified & Resolved' : 'Action Required'}
                    </span>
                  </div>
                  <div className="text-slate-800 font-medium">{obs.details}</div>
                  {obs.institution_response && (
                    <div className="p-2 bg-white rounded border border-amber-200 text-slate-700 text-[11px]">
                      <b>Institution Rectification:</b> {obs.institution_response}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Undertakings & Compliance */}
        {activeTab === 'compliance' && (
          <div className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Case Undertakings & Proof Documents
            </h3>
            {app.undertakings?.length === 0 ? (
              <div className="text-xs text-slate-500">No time-bound undertakings linked to this application.</div>
            ) : (
              app.undertakings?.map((ut: any) => (
                <div key={ut.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-900">{ut.condition_title}</div>
                    <div className="text-slate-600 text-[11px] mt-0.5">{ut.condition_description}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Due Date: {new Date(ut.due_date).toLocaleDateString()}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded font-bold text-[10px] bg-slate-200 text-slate-800">
                    {ut.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: EVC Records */}
        {activeTab === 'evc' && (
          <div className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Physical Inspection & Committee Details
            </h3>
            {app.evc_records?.length === 0 ? (
              <div className="text-xs text-slate-500">No EVC visit scheduled yet.</div>
            ) : (
              app.evc_records?.map((evc: any) => (
                <div key={evc.id} className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between items-center font-bold text-purple-900">
                    <span>Scheduled Date: {evc.scheduled_date ? new Date(evc.scheduled_date).toLocaleDateString() : 'Pending'}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-purple-200 text-purple-800">{evc.status}</span>
                  </div>
                  <div className="text-slate-700">{evc.report_summary}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 5: AI Voice Reminders */}
        {activeTab === 'calls' && (
          <div className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              AI Voice Call Reminders & Promises
            </h3>
            {app.call_logs?.length === 0 ? (
              <div className="text-xs text-slate-500">No automated voice calls have been initiated for this case.</div>
            ) : (
              app.call_logs?.map((call: any) => (
                <div key={call.id} className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between items-center font-bold text-rose-900">
                    <span>Intent: {call.recognized_intent}</span>
                    <span className="text-[10px] text-slate-500">{new Date(call.created_at).toLocaleDateString()}</span>
                  </div>
                  <pre className="text-[11px] font-sans whitespace-pre-wrap text-slate-700 bg-white p-2.5 rounded border border-rose-100">
                    {call.ai_summary}
                  </pre>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
