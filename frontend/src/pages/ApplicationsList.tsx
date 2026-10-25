import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  FileText, Search, Filter, Plus, Clock, AlertTriangle, CheckCircle2,
  ChevronRight, ArrowUpDown
} from 'lucide-react';
import type { ApplicationItem } from '../types';

export const ApplicationsList: React.FC = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New application state
  const [newRouteCode, setNewRouteCode] = useState('ROUTE_A');
  const [newAppType, setNewAppType] = useState('Extension of Approval (EoA)');
  const [newCourseName, setNewCourseName] = useState('B.Tech Artificial Intelligence & Data Science');
  const [newIntake, setNewIntake] = useState(120);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/applications', {
        params: {
          stage: stageFilter || undefined,
        },
      });
      setApps(res.data);
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [stageFilter]);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/applications', {
        workflow_route_code: newRouteCode,
        application_type: newAppType,
        academic_year: '2026-2027',
        course_name: newCourseName,
        intake_capacity: Number(newIntake),
        faculty_count: 24,
        campus_area_acres: 10.5,
      });
      setShowCreateModal(false);
      fetchApplications();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create application');
    }
  };

  const filteredApps = apps.filter(
    (app) =>
      app.application_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.institution_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">AICTE Approval Applications Register</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Stage-wise tracking, route compliance, deficiency rectification, and authorized scrutiny.
          </p>
        </div>

        {user?.role === 'INSTITUTION' && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Submit New Application
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Application No, Institute, or Region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Stages</option>
            <option value="INTAKE">INTAKE</option>
            <option value="SCRUTINY">SCRUTINY</option>
            <option value="EVC">EVC</option>
            <option value="DECISION">DECISION</option>
            <option value="AWAITING_COMPLIANCE">AWAITING_COMPLIANCE</option>
            <option value="CLOSED">CLOSED</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading application records...</div>
        ) : filteredApps.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">No applications match the search filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
                <tr>
                  <th className="py-3 px-4">Application ID</th>
                  <th className="py-3 px-4">Institution Name</th>
                  <th className="py-3 px-4">Region</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Current Stage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Stage Deadline</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-blue-700 font-mono">
                      {app.application_number}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">{app.institution_name}</div>
                      <div className="text-[10px] text-slate-400">PID: {app.permanent_id}</div>
                    </td>
                    <td className="py-3 px-4">{app.region}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {app.route_code}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-slate-100 text-slate-800 border border-slate-200">
                        {app.current_stage}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          app.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'DEFICIENCY_RETURNED'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : app.status === 'EVC_SCHEDULED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {app.stage_deadline ? (
                        <span className={app.is_overdue ? 'text-red-600 font-semibold' : ''}>
                          {new Date(app.stage_deadline).toLocaleDateString()}
                          {app.is_overdue && ' (Overdue)'}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/applications/${app.id}`}
                        className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5"
                      >
                        View Case <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Application Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-1">Create Approval Application</h2>
            <p className="text-xs text-slate-500 mb-4">
              Submit proposal under AICTE Approval Process Handbook (APH 2026-27).
            </p>

            <form onSubmit={handleCreateApp} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Approval Workflow Route</label>
                <select
                  value={newRouteCode}
                  onChange={(e) => setNewRouteCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ROUTE_A">Route A: Standard Scrutiny Route (No EVC)</option>
                  <option value="ROUTE_B">Route B: Scrutiny with Physical EVC Inspection</option>
                  <option value="ROUTE_C">Route C: EVC with Standing Appeal Committee (SAC/SHC)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Application Type</label>
                <select
                  value={newAppType}
                  onChange={(e) => setNewAppType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Extension of Approval (EoA)">Extension of Approval (EoA)</option>
                  <option value="Increase in Intake">Increase in Intake Capacity</option>
                  <option value="New Technical Institute">Establishment of New Institute</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Proposed Academic Program/Course</label>
                <input
                  type="text"
                  required
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sanctioned Intake Capacity</label>
                <input
                  type="number"
                  required
                  value={newIntake}
                  onChange={(e) => setNewIntake(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
