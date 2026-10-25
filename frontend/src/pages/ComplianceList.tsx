import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardCheck, Upload, CheckCircle2, AlertTriangle, Clock,
  FileCheck, ShieldAlert
} from 'lucide-react';
import type { UndertakingItem } from '../types';

export const ComplianceList: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<UndertakingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Verification modal state
  const [selectedItem, setSelectedItem] = useState<UndertakingItem | null>(null);
  const [verifyAction, setVerifyAction] = useState('ACCEPT');
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Upload modal state
  const [uploadItem, setUploadItem] = useState<UndertakingItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Extension request state
  const [extItem, setExtItem] = useState<UndertakingItem | null>(null);
  const [extDays, setExtDays] = useState(15);
  const [extReason, setExtReason] = useState('');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/compliance');
      setItems(res.data);
    } catch (err) {
      console.error('Failed to load compliance records', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      setVerifying(true);
      const formData = new FormData();
      formData.append('action', verifyAction);
      formData.append('remarks', verifyRemarks);

      await api.post(`/compliance/${selectedItem.id}/verify`, formData);
      setSelectedItem(null);
      setVerifyRemarks('');
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Verification error');
    } finally {
      setVerifying(false);
    }
  };

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadItem || !selectedFile) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      await api.post(`/compliance/${uploadItem.id}/submit-evidence`, formData);
      setUploadItem(null);
      setSelectedFile(null);
      fetchItems();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  const handleRequestExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extItem) return;
    try {
      const formData = new FormData();
      formData.append('days', String(extDays));
      formData.append('reason', extReason);

      await api.post(`/compliance/${extItem.id}/request-extension`, formData);
      setExtItem(null);
      setExtReason('');
      fetchItems();
      alert('Extension request submitted. Subject to authorized regulatory review.');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Extension error');
    }
  };

  const isOfficer = user?.role !== 'INSTITUTION';
  const isInstitution = user?.role === 'INSTITUTION';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Time-Bound Undertakings & Compliance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional conditions, evidence verification, extension review, and statutory closure.
          </p>
        </div>
      </div>

      {/* Compliance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading compliance register...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
                <tr>
                  <th className="py-3 px-4">Undertaking ID</th>
                  <th className="py-3 px-4">Condition & Requirement</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Evidence Status</th>
                  <th className="py-3 px-4">Remarks</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {item.undertaking_code}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900">{item.condition_title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{item.condition_description}</div>
                    </td>
                    <td className="py-3 px-4 font-medium">{item.institution_name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(item.due_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'SUBMITTED'
                            ? 'bg-blue-100 text-blue-800'
                            : item.status === 'RETURNED_FOR_CORRECTION'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.evidence_filename && (
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          📎 {item.evidence_filename}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 max-w-xs truncate">
                      {item.verification_remarks || '—'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {isInstitution && (
                        <>
                          <button
                            type="button"
                            onClick={() => setUploadItem(item)}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-semibold text-[11px]"
                          >
                            Upload Proof
                          </button>
                          <button
                            type="button"
                            onClick={() => setExtItem(item)}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded font-semibold text-[11px]"
                          >
                            Ask Extension
                          </button>
                        </>
                      )}

                      {isOfficer && item.status === 'SUBMITTED' && (
                        <button
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded font-semibold text-[11px]"
                        >
                          Verify Evidence
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

      {/* Verify Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Verify Compliance Evidence</h2>
            <p className="text-xs text-slate-500 mb-4">
              Condition: <b>{selectedItem.condition_title}</b> ({selectedItem.undertaking_code})
            </p>

            <form onSubmit={handleVerify} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Officer Action</label>
                <select
                  value={verifyAction}
                  onChange={(e) => setVerifyAction(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-medium"
                >
                  <option value="ACCEPT">ACCEPT — Mark Condition Verified</option>
                  <option value="RETURN">RETURN — Mark Inadequate / Returned for Correction</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mandatory Officer Remarks</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record verification inspection notes or deficiency grounds..."
                  value={verifyRemarks}
                  onChange={(e) => setVerifyRemarks(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying}
                  className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg font-semibold"
                >
                  {verifying ? 'Submitting...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadItem && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Upload Compliance Evidence</h2>
            <p className="text-xs text-slate-500 mb-4">
              Upload certified PDF proof for: <b>{uploadItem.condition_title}</b>
            </p>

            <form onSubmit={handleUploadEvidence} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Document (PDF/Scanned Copy)</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadItem(null)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Submit to AICTE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extension Modal */}
      {extItem && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Request Time Extension</h2>
            <p className="text-xs text-slate-500 mb-4">
              Extension request creates an officer review task. It is NOT automatically granted.
            </p>

            <form onSubmit={handleRequestExtension} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Days Requested</label>
                <input
                  type="number"
                  min="5"
                  max="45"
                  value={extDays}
                  onChange={(e) => setExtDays(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Substantiated Ground for Extension</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain delays (e.g. pending government municipal department signoff)..."
                  value={extReason}
                  onChange={(e) => setExtReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExtItem(null)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
