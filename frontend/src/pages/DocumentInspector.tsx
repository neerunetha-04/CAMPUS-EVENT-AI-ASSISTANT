import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  BookOpen, 
  MapPin, 
  Clock, 
  Shield, 
  CheckCircle2, 
  FileText,
  Search,
  Hash
} from 'lucide-react';
import { DocumentItem, DocumentChunk } from '../types';
import { api } from '../services/api';

interface DocumentInspectorProps {
  initialDocumentId?: string;
}

export const DocumentInspector: React.FC<DocumentInspectorProps> = ({ initialDocumentId }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocumentId || '');
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.getDocuments().then((docs) => {
      setDocuments(docs);
      if (!selectedDocId && docs.length > 0) {
        setSelectedDocId(docs[0].id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedDocId) {
      setLoading(true);
      api.getDocumentChunks(selectedDocId)
        .then(setChunks)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedDocId]);

  const selectedDoc = documents.find(d => d.id === selectedDocId);

  const filteredChunks = chunks.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.section && c.section.toLowerCase().includes(q)) ||
      (c.procedure && c.procedure.toLowerCase().includes(q)) ||
      c.content.toLowerCase().includes(q) ||
      (c.authority && c.authority.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-semibold">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>RAG Pipeline Transparency & Chunker Debugger</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Document Chunk Inspector
        </h1>
        <p className="text-xs text-slate-400">
          Inspect extracted procedural units, semantic preconditions, requirements, and authority tags.
        </p>
      </div>

      {/* Selector & Filter Bar */}
      <div className="p-4 bg-[#111a2e] border border-[#1e2c47] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3 flex-1">
          <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">Selected Document:</span>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="w-full max-w-md px-3 py-1.5 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-xs text-white focus:outline-hidden focus:border-cyan-500"
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title} ({d.active_version}) - {d.chunks_count} chunks
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chunks in document..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Document Metadata Banner */}
      {selectedDoc && (
        <div className="p-4 bg-[#131f37]/70 border border-[#1e2d4d] rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">GOVERNING AUTHORITY</span>
            <span className="font-semibold text-purple-300">{selectedDoc.authority_level}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">VERSION / STATUS</span>
            <span className="font-semibold text-slate-200">{selectedDoc.active_version} ({selectedDoc.status})</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">TOTAL EXTRACTED CHUNKS</span>
            <span className="font-semibold text-cyan-300">{chunks.length} procedural units</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">DEPARTMENT</span>
            <span className="font-semibold text-slate-300">{selectedDoc.department || 'Administration'}</span>
          </div>
        </div>
      )}

      {/* Chunks List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading document chunks...</div>
        ) : filteredChunks.length === 0 ? (
          <div className="p-12 text-center bg-[#111a2e] border border-[#1e2c47] rounded-xl text-slate-400">
            No chunks found matching "{searchQuery}".
          </div>
        ) : (
          filteredChunks.map((chunk, idx) => (
            <div
              key={chunk.id}
              className="p-5 bg-[#111a2e] border border-[#1e2c47] rounded-xl shadow-md space-y-4 hover:border-cyan-500/30 transition-colors"
            >
              {/* Chunk Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e2c47] pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 text-[11px] font-mono">
                    Chunk #{idx + 1}
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    {chunk.section || 'General Provisions'}
                  </h3>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    Page {chunk.page_number || 1}
                  </span>
                  <span className="flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-slate-500" />
                    {chunk.token_count} words
                  </span>
                  {chunk.deadline && (
                    <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {chunk.deadline}
                    </span>
                  )}
                </div>
              </div>

              {/* Procedural Structured Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {chunk.authority && (
                  <div className="p-2.5 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-0.5">
                      Designated Authority
                    </span>
                    <span className="text-slate-200">{chunk.authority}</span>
                  </div>
                )}
                {chunk.procedure && (
                  <div className="p-2.5 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg">
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block mb-0.5">
                      Procedural Unit
                    </span>
                    <span className="text-slate-200">{chunk.procedure}</span>
                  </div>
                )}
              </div>

              {/* Preconditions & Requirements Tags */}
              {(chunk.preconditions.length > 0 || chunk.requirements.length > 0) && (
                <div className="space-y-2 pt-1">
                  {chunk.preconditions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-slate-400 text-[11px] font-semibold">Preconditions:</span>
                      {chunk.preconditions.map((p, pIdx) => (
                        <span key={pIdx} className="px-2 py-0.5 bg-purple-950/60 text-purple-300 border border-purple-800/40 rounded text-[11px]">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {chunk.requirements.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-slate-400 text-[11px] font-semibold">Mandatory Requirements:</span>
                      {chunk.requirements.map((r, rIdx) => (
                        <span key={rIdx} className="px-2 py-0.5 bg-rose-950/60 text-rose-300 border border-rose-800/40 rounded text-[11px]">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Chunk Content Text */}
              <div className="p-3.5 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-slate-300 text-xs font-mono leading-relaxed whitespace-pre-line">
                {chunk.content}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
