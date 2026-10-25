import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Building2, FileText, CheckCircle2, Clock, AlertTriangle,
  Upload, ArrowUpRight, PhoneCall, ShieldCheck
} from 'lucide-react';
import type { ApplicationItem, UndertakingItem, DocumentItem } from '../types';

export const InstitutionDashboard: React.FC = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState<ApplicationItem[]>([]);
  const [undertakings, setUndertakings] = useState<UndertakingItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInstitutionData = async () => {
      try {
        const [appsRes, utRes, docsRes] = await Promise.all([
          api.get('/applications'),
          api.get('/compliance'),
          api.get('/documents'),
        ]);
        setApps(appsRes.data);
        setUndertakings(utRes.data);
        setDocuments(docsRes.data);
      } catch (err) {
        console.error('Failed to load institution data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInstitutionData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
        Loading institution profile and regulatory case records...
      </div>
    );
  }

  const primaryApp = apps[0];
  const pendingUndertakings = undertakings.filter(u => u.status !== 'VERIFIED');
  const expiringDocs = documents.filter(d => d.validity_status.includes('EXPIRING') || d.validity_status === 'EXPIRED');

  return (
    <div className="space-y-6">
      {/* Institution Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-0.5 rounded">
              Permanent AICTE ID: {primaryApp?.permanent_id || 'AICTE-1-000109'}
            </span>
            <span className="text-xs text-slate-500">Region: Western (Maharashtra)</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">
            {primaryApp?.institution_name || 'Sunrise Institute of Technology'}
          </h1>
          <p className="text-xs text-slate-500">
            Registered Head: Dr. Rajesh Sharma | Principal Contact: +91 98220 11223
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/applications"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            Create New Application
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Institution Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 flex justify-between">
            <span>Current Active Applications</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{apps.length}</div>
          <div className="text-[11px] text-blue-600 mt-1">EoA & Intake Approval 2026-27</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 flex justify-between">
            <span>Pending Undertakings</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{pendingUndertakings.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Evidence submission required</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500 flex justify-between">
            <span>Documents Expiring</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600 mt-2">{expiringDocs.length}</div>
          <div className="text-[11px] text-red-500 mt-1">Advance renewal alert active</div>
        </div>
      </div>

      {/* Main Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800">Your Submitted Approval Applications</h2>
          <span className="text-xs text-slate-500">{apps.length} Total Records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 font-semibold text-slate-600 text-left">
              <tr>
                <th className="py-3 px-4">Application No.</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {apps.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-blue-700 font-mono">
                    {app.application_number}
                  </td>
                  <td className="py-3 px-4">{app.application_type}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-800 border border-slate-200">
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
                    {app.stage_deadline ? new Date(app.stage_deadline).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/applications/${app.id}`}
                      className="text-blue-600 font-semibold hover:underline"
                    >
                      View Case Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance & Prescribed Documents Attention Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Compliance Undertakings */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-slate-900">Time-Bound Undertakings</h2>
            <Link to="/compliance" className="text-xs text-blue-600 hover:underline font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {undertakings.slice(0, 3).map((u) => (
              <div key={u.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>{u.condition_title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      u.status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {u.status}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] mt-1">{u.condition_description}</p>
                <div className="text-[10px] text-slate-500 mt-2 flex justify-between items-center">
                  <span>Due: {new Date(u.due_date).toLocaleDateString()}</span>
                  <Link to="/compliance" className="text-blue-600 font-medium hover:underline">
                    Upload Proof →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prescribed Documents Validity */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-slate-900">Prescribed Documents & Leases</h2>
            <Link to="/documents" className="text-xs text-blue-600 hover:underline font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {documents.slice(0, 3).map((d) => (
              <div key={d.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>{d.display_name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      d.validity_status.includes('30')
                        ? 'bg-red-100 text-red-800'
                        : d.validity_status.includes('60')
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {d.validity_status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-2 flex justify-between items-center">
                  <span>Expiry: {d.expiry_date ? new Date(d.expiry_date).toLocaleDateString() : 'No Expiry'}</span>
                  <Link to="/documents" className="text-purple-600 font-medium hover:underline">
                    Renew Document →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
