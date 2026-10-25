import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Clock, AlertTriangle, CheckCircle2, Upload, FileText,
  Calendar, RotateCcw
} from 'lucide-react';
import type { DocumentItem } from '../types';

export const DocumentsList: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Renewal Modal
  const [renewDoc, setRenewDoc] = useState<DocumentItem | null>(null);
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [renewFile, setRenewFile] = useState<File | null>(null);
  const [renewing, setRenewing] = useState(false);

  // Upload New Prescribed Document Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docType, setDocType] = useState('Registered Land Lease Deed');
  const [displayName, setDisplayName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewDoc || !renewFile) return;
    try {
      setRenewing(true);
      const formData = new FormData();
      formData.append('new_expiry_date_str', new Date(newExpiryDate).toISOString());
      formData.append('file', renewFile);

      await api.post(`/documents/${renewDoc.id}/renew`, formData);
      setRenewDoc(null);
      setRenewFile(null);
      fetchDocuments();
      alert('Document renewal submitted. Previous historical document preserved.');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Renewal error');
    } finally {
      setRenewing(false);
    }
  };

  const handleUploadNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('document_type', docType);
      formData.append('display_name', displayName);
      if (expiryDate) {
        formData.append('expiry_date_str', new Date(expiryDate).toISOString());
      }
      formData.append('file', uploadFile);

      await api.post('/documents/upload', formData);
      setShowUploadModal(false);
      setDisplayName('');
      setUploadFile(null);
      fetchDocuments();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Upload error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Prescribed Documents & Lease Validity Tracking</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated advance expiry alerts (90, 60, and 30 days), renewal verification, and audit chain.
          </p>
        </div>

        {user?.role === 'INSTITUTION' && (
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-4 h-4" /> Upload Prescribed Document
          </button>
        )}
      </div>

      {/* Expiry Alerts Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold">
            30d
          </div>
          <div>
            <div className="font-bold text-red-900">Critical Expiry (≤ 30 Days)</div>
            <div className="text-[11px] text-red-700">Immediate renewal submission required</div>
          </div>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
            60d
          </div>
          <div>
            <div className="font-bold text-amber-900">Upcoming Expiry (≤ 60 Days)</div>
            <div className="text-[11px] text-amber-700">Advance institution notification triggered</div>
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
            90d
          </div>
          <div>
            <div className="font-bold text-blue-900">Early Expiry Alert (≤ 90 Days)</div>
            <div className="text-[11px] text-blue-700">Scheduled for automated compliance checks</div>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading document registry...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
                <tr>
                  <th className="py-3 px-4">Document Title & Type</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Validity Status</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Historical Chain</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900">{doc.display_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{doc.document_type}</div>
                    </td>
                    <td className="py-3 px-4 font-medium">{doc.institution_name}</td>
                    <td className="py-3 px-4">
                      {doc.expiry_date ? (
                        <span className="font-medium text-slate-800">
                          {new Date(doc.expiry_date).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-400">Perpetual / No Expiry</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.validity_status === 'EXPIRING_SOON_30' || doc.validity_status === 'EXPIRED'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : doc.validity_status === 'EXPIRING_SOON_60'
                            ? 'bg-amber-100 text-amber-800'
                            : doc.validity_status === 'EXPIRING_SOON_90'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {doc.validity_status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-medium text-slate-700">
                        {doc.verification_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[10px] font-mono text-slate-500">
                      {doc.previous_document_id ? `Linked (Prev: ${doc.previous_document_id.slice(0, 8)}...)` : 'Original Record'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {user?.role === 'INSTITUTION' && (
                        <button
                          type="button"
                          onClick={() => setRenewDoc(doc)}
                          className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded font-semibold text-[11px] flex items-center gap-1 ml-auto"
                        >
                          <RotateCcw className="w-3 h-3" /> Renew Document
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

      {/* Renew Modal */}
      {renewDoc && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Upload Document Renewal</h2>
            <p className="text-xs text-slate-500 mb-4">
              Renewing: <b>{renewDoc.display_name}</b>. The historical expired/expiring record will be safely archived.
            </p>

            <form onSubmit={handleRenew} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Extended Expiry Date</label>
                <input
                  type="date"
                  required
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Renewed Document PDF</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setRenewFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenewDoc(null)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renewing || !renewFile}
                  className="px-3.5 py-1.5 bg-purple-600 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {renewing ? 'Renewing...' : 'Submit Renewal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload New Prescribed Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 mb-1">Upload Prescribed Institutional Document</h2>
            <p className="text-xs text-slate-500 mb-4">
              Statutory documents required for AICTE approval under Chapter I/II of APH.
            </p>

            <form onSubmit={handleUploadNew} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Category</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                >
                  <option value="Registered Land Lease Deed">Registered Land Lease Deed (30+ Years)</option>
                  <option value="Fire Safety Certificate / NOC">Fire Safety Certificate / Municipal NOC</option>
                  <option value="Occupancy Certificate">Building Occupancy Certificate</option>
                  <option value="AICTE Trust / Society Registration">Trust / Society Registration Deed</option>
                  <option value="Approved Building Plan">Municipal Approved Architectural Plan</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Campus Plot 4 Registered Lease Deed"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expiry Date (Leave blank if perpetual)</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document File (PDF)</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-3.5 py-1.5 bg-purple-600 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Save Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
