import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  PhoneCall, ShieldCheck, CheckCircle2, AlertTriangle, Play,
  Clock, Mic, UserCheck, Calendar, Sparkles, MessageSquare
} from 'lucide-react';
import type { CallLogItem } from '../types';

export const VoiceAgentPage: React.FC = () => {
  const { user } = useAuth();
  const [callLogs, setCallLogs] = useState<CallLogItem[]>([]);
  const [followUpTasks, setFollowUpTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Trigger call modal state
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [selectedInstId, setSelectedInstId] = useState('');
  const [pendingRequirement, setPendingRequirement] = useState('Certified Fire Safety NOC Renewal');
  const [selectedLang, setSelectedLang] = useState('English');
  const [activeCallSession, setActiveCallSession] = useState<any | null>(null);

  // Simulation interaction state
  const [customResponse, setCustomResponse] = useState('We will submit the document on Friday');
  const [simulating, setSimulating] = useState(false);
  const [callResult, setCallResult] = useState<any | null>(null);

  const fetchVoiceData = async () => {
    try {
      setLoading(true);
      const [callsRes, tasksRes] = await Promise.all([
        api.get('/voice/calls'),
        api.get('/voice/follow-up-tasks'),
      ]);
      setCallLogs(callsRes.data);
      setFollowUpTasks(tasksRes.data);
      if (callsRes.data.length > 0 && !selectedInstId) {
        setSelectedInstId(callsRes.data[0].institution_id);
      }
    } catch (err) {
      console.error('Failed to load voice call data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoiceData();
  }, []);

  const handleInitiateCall = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/voice/initiate-call', {
        institution_id: selectedInstId,
        pending_item_description: pendingRequirement,
        language: selectedLang,
      });
      setActiveCallSession(res.data);
      setCallResult(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to initiate simulated voice call');
    }
  };

  const handleSimulateResponse = async (spokenText: string) => {
    if (!activeCallSession) return;
    try {
      setSimulating(true);
      const res = await api.post(`/voice/calls/${activeCallSession.call_id}/simulate-response`, {
        user_spoken_response: spokenText,
      });
      setCallResult(res.data);
      fetchVoiceData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to process voice simulation');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feature Innovation Header */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-rose-900/40 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-rose-400" /> SIH26262 Standout Innovation
            </span>
            <span className="text-xs text-slate-400">
              Provider Mode: <b>SIMULATED AGENT</b>
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-2">
            AI Multilingual Voice Call Reminder Agent
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            When institutions fail to respond to SMS/email alerts, this autonomous AI voice agent calls registered
            representatives in English, Hindi, or Marathi, parses 9 regulatory intents, generates case-linked summaries,
            and schedules follow-up tasks without bypassing statutory officer verification.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowInitiateModal(true);
            setActiveCallSession(null);
            setCallResult(null);
          }}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 flex-shrink-0 transition-colors"
        >
          <PhoneCall className="w-4 h-4" /> Trigger Automated Call
        </button>
      </div>

      {/* Interactive Simulation Sandbox */}
      {showInitiateModal && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Mic className="w-4 h-4 text-rose-600" /> Interactive Voice Call Simulation Console
              </h2>
              <p className="text-xs text-slate-500">
                Transparent test sandbox for Smart India Hackathon jury demonstration.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowInitiateModal(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
            >
              Close Console ✕
            </button>
          </div>

          {!activeCallSession ? (
            <form onSubmit={handleInitiateCall} className="space-y-4 text-xs max-w-xl">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Institution</label>
                <select
                  value={selectedInstId}
                  onChange={(e) => setSelectedInstId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                >
                  {callLogs.map((c) => (
                    <option key={c.institution_id} value={c.institution_id}>
                      {c.institution_name} ({c.contact_person})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pending Regulatory Requirement</label>
                <input
                  type="text"
                  required
                  value={pendingRequirement}
                  onChange={(e) => setPendingRequirement(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Language Model / Voice Engine</label>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="English">English (Indian Accent - AICTE Compliance Model)</option>
                  <option value="Hindi">Hindi (हिंदी - Bhashini Speech Pipeline)</option>
                  <option value="Marathi">Marathi (मराठी - Regional West Pipeline)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900">
                <b>Regulatory Safeguard & Consent:</b> Call begins with mandatory disclosure of automated assistant. No statutory authority to approve or grant extensions.
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold flex items-center gap-2"
              >
                <Play className="w-4 h-4" /> Connect AI Voice Session
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Call Connected Visualizer */}
              <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-bold text-emerald-400">CALL ACTIVE & RECORDING</span>
                  </div>
                  <span className="text-slate-400 font-mono">
                    Representative: {activeCallSession.contact_person} ({activeCallSession.contact_phone})
                  </span>
                </div>

                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-xs">
                  <span className="text-[10px] text-blue-400 font-bold block mb-1">
                    AI AUTOMATED ASSISTANT (TTS PROMPT):
                  </span>
                  <p className="text-slate-200 italic leading-relaxed">
                    "{activeCallSession.opening_prompt}"
                  </p>
                </div>
              </div>

              {/* Simulation Response Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Select or Speak Representative's Response to Test AI Intent & Date Extraction:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSimulateResponse("I will submit the document on Friday")}
                    disabled={simulating}
                    className="p-2.5 text-left border border-slate-200 hover:border-blue-500 rounded-lg bg-slate-50 hover:bg-blue-50/50 transition-colors"
                  >
                    <div className="font-semibold text-slate-800">"I will submit on Friday"</div>
                    <div className="text-[10px] text-blue-600">Tests: NEEDS_MORE_TIME + Promised Date</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulateResponse("We have already submitted the certificate yesterday on the portal")}
                    disabled={simulating}
                    className="p-2.5 text-left border border-slate-200 hover:border-emerald-500 rounded-lg bg-slate-50 hover:bg-emerald-50/50 transition-colors"
                  >
                    <div className="font-semibold text-slate-800">"Already submitted on portal"</div>
                    <div className="text-[10px] text-emerald-600">Tests: SUBMITTED (Retains officer check)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulateResponse("You have dialed the wrong person, I left the college")}
                    disabled={simulating}
                    className="p-2.5 text-left border border-slate-200 hover:border-red-500 rounded-lg bg-slate-50 hover:bg-red-50/50 transition-colors"
                  >
                    <div className="font-semibold text-slate-800">"Wrong person / Left institution"</div>
                    <div className="text-[10px] text-red-600">Tests: WRONG_PERSON + Flag contact</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulateResponse("I need to speak directly to the Regional Officer")}
                    disabled={simulating}
                    className="p-2.5 text-left border border-slate-200 hover:border-purple-500 rounded-lg bg-slate-50 hover:bg-purple-50/50 transition-colors"
                  >
                    <div className="font-semibold text-slate-800">"Speak to regional officer"</div>
                    <div className="text-[10px] text-purple-600">Tests: REQUESTS_HUMAN escalation</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulateResponse("We are facing technical portal errors while uploading")}
                    disabled={simulating}
                    className="p-2.5 text-left border border-slate-200 hover:border-amber-500 rounded-lg bg-slate-50 hover:bg-amber-50/50 transition-colors"
                  >
                    <div className="font-semibold text-slate-800">"Facing technical portal error"</div>
                    <div className="text-[10px] text-amber-600">Tests: NEEDS_HELP (Helpdesk task)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulateResponse("Hmm yeah maybe something like that")}
                    disabled={simulating}
                    className="p-2.5 text-left border border-slate-200 hover:border-slate-500 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="font-semibold text-slate-800">"Ambiguous unclear voice"</div>
                    <div className="text-[10px] text-slate-600">Tests: UNCLEAR_RESPONSE fallback</div>
                  </button>
                </div>
              </div>

              {/* Custom Speech Box */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Or type custom institutional voice response..."
                  value={customResponse}
                  onChange={(e) => setCustomResponse(e.target.value)}
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
                <button
                  type="button"
                  disabled={simulating || !customResponse}
                  onClick={() => handleSimulateResponse(customResponse)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
                >
                  {simulating ? 'Analyzing...' : 'Send Voice Input'}
                </button>
              </div>

              {/* Outcome Display */}
              {callResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      AI Call Parsed & Logged to Case Record
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-800">
                      Recognized Intent: {callResult.recognized_intent}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-emerald-200 text-slate-700 leading-relaxed font-sans whitespace-pre-wrap text-[11px]">
                    {callResult.ai_summary}
                  </div>

                  <div className="flex flex-wrap gap-4 text-[11px] text-slate-600 pt-1">
                    <span>
                      <b>Extracted Promised Date:</b> {callResult.promised_date ? new Date(callResult.promised_date).toLocaleDateString() : 'None extracted'}
                    </span>
                    <span>
                      <b>Follow-up Task Created:</b> {callResult.follow_up_task_created ? 'Yes (Officer Queue)' : 'No'}
                    </span>
                    <span>
                      <b>Human Escalation Required:</b> {callResult.human_escalation_required ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Real Historical Voice Calls Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800">AI Voice Reminder Interaction Registry</h2>
          <span className="text-xs text-slate-500">{callLogs.length} Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
              <tr>
                <th className="py-3 px-4">Institution & Contact</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Recognized Intent</th>
                <th className="py-3 px-4">Promised Submission Date</th>
                <th className="py-3 px-4">AI Generated Case Summary</th>
                <th className="py-3 px-4">Follow-Up Task</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {callLogs.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{c.institution_name}</div>
                    <div className="text-[10px] text-slate-400">
                      {c.contact_person} ({c.contact_phone})
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">{c.language}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.recognized_intent === 'NEEDS_MORE_TIME'
                          ? 'bg-amber-100 text-amber-800'
                          : c.recognized_intent === 'SUBMITTED'
                          ? 'bg-blue-100 text-blue-800'
                          : c.recognized_intent === 'REQUESTS_HUMAN' || c.recognized_intent === 'WRONG_PERSON'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {c.recognized_intent}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {c.promised_date ? new Date(c.promised_date).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 px-4 max-w-xs text-[11px] truncate" title={c.ai_summary}>
                    {c.ai_summary.slice(0, 80)}...
                  </td>
                  <td className="py-3 px-4">
                    {c.follow_up_task_created ? (
                      <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Created
                      </span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[10px]">
                    {new Date(c.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Follow-up Tasks Queue */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          Automated Officer Follow-Up Tasks Generated from AI Calls ({followUpTasks.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {followUpTasks.map((t) => (
            <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Task: {t.task_type}</span>
                <span className="text-blue-600">Assigned: {t.assigned_role}</span>
              </div>
              <p className="text-slate-600 text-[11px]">{t.task_description}</p>
              <div className="text-[10px] text-slate-400 flex justify-between pt-1">
                <span>Due Date: {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'Immediate'}</span>
                <span className="font-semibold text-amber-700">Status: {t.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
