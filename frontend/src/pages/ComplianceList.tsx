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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div className="animate-in" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 className="page-title">Institutional Undertakings</h1>
          <p className="page-desc">Time-bound compliance obligations, evidence verification, extension review, and statutory closure.</p>
        </div>
      </div>

      {/* Compliance Table */}
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
                  <th>Undertaking ID</th>
                  <th>Condition & Requirement</th>
                  <th>Institution</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td><span className="app-id">{item.undertaking_code}</span></td>
                    <td style={{ maxWidth: 220 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>{item.condition_title}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.condition_description}</div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.institution_name}</td>
                    <td style={{ fontSize: 11.5, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(item.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td>
                      <span className={`badge ${
                            item.status === 'VERIFIED' ? 'badge-green'
                            : item.status === 'SUBMITTED' ? 'badge-blue'
                            : item.status === 'RETURNED_FOR_CORRECTION' ? 'badge-red'
                            : item.status === 'OVERDUE' ? 'badge-red'
                            : 'badge-amber'
                          }`}>
                          {item.status?.replace(/_/g, ' ')}
                        </span>
                        {item.evidence_filename && (
                          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'monospace' }}>
                            📎 {item.evidence_filename}
                          </div>
                        )}
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500 max-w-xs truncate">
                      {item.verification_remarks || '—'}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {isInstitution && (
                          <>
                            <button type="button" onClick={() => setUploadItem(item)} className="btn btn-ghost btn-sm">
                              Upload Proof
                            </button>
                            <button type="button" onClick={() => setExtItem(item)} className="btn btn-secondary btn-sm">
                              Request Extension
                            </button>
                          </>
                        )}
                        {isOfficer && item.status === 'SUBMITTED' && (
                          <button type="button" onClick={() => setSelectedItem(item)} className="btn btn-primary btn-sm">
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
