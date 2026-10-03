import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCw, 
  Trash2, 
  ShieldCheck, 
  Layers, 
  X,
  FileCheck2,
  Calendar,
  Building,
  Archive
} from 'lucide-react';
import { DocumentItem } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

interface DocumentCenterProps {
  onInspectDocument: (docId: string) => void;
}

export const DocumentCenter: React.FC<DocumentCenterProps> = ({ onInspectDocument }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upload Form State
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Facilities Management Division');
  const [documentType, setDocumentType] = useState('Policy');
  const [authorityLevel, setAuthorityLevel] = useState('Institutional Policy');
  const [versionNumber, setVersionNumber] = useState('v1.0');
  const [effectiveDate, setEffectiveDate] = useState('2025-01-01');

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      alert('Please select a file and enter a title.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('department', department);
      formData.append('document_type', documentType);
      formData.append('authority_level', authorityLevel);
      formData.append('version_number', versionNumber);
      if (effectiveDate) formData.append('effective_date', effectiveDate);

      await api.uploadDocument(formData);
      setUploadModalOpen(false);
      // Reset form
      setFile(null);
      setTitle('');
      await loadDocuments();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleStatusChange = async (docId: string, newStatus: string) => {
    try {
      await api.updateDocumentStatus(docId, newStatus);
      await loadDocuments();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    }
  };

  const handleReindex = async (docId: string) => {
    try {
      await api.reindexDocument(docId);
      alert('Document re-indexed successfully.');
      await loadDocuments();
    } catch (err: any) {
      alert(`Re-indexing failed: ${err.message}`);
    }
  };

  const handleDelete = async (docId: string) => {
    if (window.confirm('Delete this document and its extracted procedural chunks?')) {
      try {
        await api.deleteDocument(docId);
        await loadDocuments();
      } catch (err: any) {
        alert(`Delete failed: ${err.message}`);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Admin Document Repository & Corpus Control</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Institutional Document Center
          </h1>
          <p className="text-xs text-slate-400">
            Upload and manage official campus regulations, venue guidelines, and safety policies.
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white text-xs font-semibold rounded-lg shadow-md shadow-cyan-950/40 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Institutional Document</span>
        </button>
      </div>

      {/* Document List Table */}
      <div className="bg-[#111a2e] border border-[#1e2c47] rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-[#1e2c47] flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Active Institutional Corpus ({documents.length})
          </span>
          <span className="text-[11px] text-slate-400">
            PDF • DOCX • TXT • Markdown Supported
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No documents uploaded yet.</div>
        ) : (
          <div className="divide-y divide-[#1e2c47]">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 sm:p-5 hover:bg-[#14213d] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {doc.is_demo && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                        DEMO DOCUMENT
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-white">{doc.title}</h3>
                    <StatusBadge status={doc.status} size="sm" />
                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-[10px] rounded font-mono">
                      {doc.active_version}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      {doc.department || 'Administration'}
                    </span>
                    <span><strong>Authority:</strong> {doc.authority_level}</span>
                    <span><strong>Type:</strong> {doc.document_type}</span>
                    <span className="text-cyan-300 font-semibold">{doc.chunks_count} procedural chunks</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onInspectDocument(doc.id)}
                    className="px-3 py-1.5 bg-[#131f37] hover:bg-[#1c2e52] border border-[#1e2d4d] text-cyan-300 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Inspect Chunks
                  </button>

                  {doc.status === 'Active' ? (
                    <button
                      onClick={() => handleStatusChange(doc.id, 'Superseded')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                      title="Mark as Superseded by a newer policy"
                    >
                      Supersede
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(doc.id, 'Active')}
                      className="px-3 py-1.5 bg-teal-950 hover:bg-teal-900 border border-teal-800 text-teal-300 text-xs font-medium rounded-lg transition-colors"
                    >
                      Activate
                    </button>
                  )}

                  <button
                    onClick={() => handleReindex(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title="Re-extract and Re-chunk"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#131d33]">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Upload Official Document</h3>
              </div>
              <button onClick={() => setUploadModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Document Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Campus Fire Safety & Electrical Equipment Regulations"
                  className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-xs text-white focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-xs text-white focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Authority Level</label>
                  <select
                    value={authorityLevel}
                    onChange={(e) => setAuthorityLevel(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-xs text-white focus:border-cyan-500 focus:outline-hidden"
                  >
                    <option value="Institutional Policy">Institutional Policy</option>
                    <option value="Official Regulation">Official Regulation</option>
                    <option value="Department Policy">Department Policy</option>
                    <option value="Official Circular">Official Circular</option>
                    <option value="Procedure">Procedure</option>
                    <option value="Guideline">Guideline</option>
                    <option value="Form">Form</option>
                    <option value="Reference">Reference</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Version Number</label>
                  <input
                    type="text"
                    value={versionNumber}
                    onChange={(e) => setVersionNumber(e.target.value)}
                    placeholder="e.g. v2.1"
                    className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-xs text-white focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-xs text-white focus:border-cyan-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  File Upload (.pdf, .docx, .txt, .md) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.doc,.txt,.md,.markdown"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1e293b]">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-teal-500 text-white text-xs font-bold rounded-lg shadow-md shadow-cyan-950/40"
                >
                  {uploading ? 'Processing & Chunking...' : 'Upload & Process'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
