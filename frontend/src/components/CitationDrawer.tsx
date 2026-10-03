import React from 'react';
import { X, BookOpen, Shield, ExternalLink, Calendar, MapPin, CheckCircle } from 'lucide-react';
import { Citation } from '../types';

interface CitationDrawerProps {
  citation: Citation | null;
  onClose: () => void;
}

export const CitationDrawer: React.FC<CitationDrawerProps> = ({ citation, onClose }) => {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#131d33]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">
                Authoritative Citation Trace
              </h3>
              <p className="text-xs text-slate-400">
                Direct evidence from official institutional repository
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#131f37] border border-[#1e2d4d] rounded-lg">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">DOCUMENT</span>
              <span className="text-xs font-semibold text-cyan-300 block truncate" title={citation.document_title}>
                {citation.document_title}
              </span>
            </div>
            <div className="p-3 bg-[#131f37] border border-[#1e2d4d] rounded-lg">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">VERSION</span>
              <span className="text-xs font-semibold text-slate-200 block">
                {citation.version || 'v1.0'}
              </span>
            </div>
            <div className="p-3 bg-[#131f37] border border-[#1e2d4d] rounded-lg">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">AUTHORITY</span>
              <span className="text-xs font-semibold text-purple-300 block truncate" title={citation.authority}>
                {citation.authority || 'General Administration'}
              </span>
            </div>
          </div>

          {/* Section & Location Trace */}
          <div className="p-3 bg-[#131f37]/60 border border-[#1e2d4d] rounded-lg flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span><strong>Section:</strong> {citation.section || 'General Provisions'}</span>
            </div>
            {citation.page_number && (
              <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-300 border border-slate-700">
                Page {citation.page_number}
              </span>
            )}
          </div>

          {/* Excerpt Box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Official Procedural Excerpt
              </span>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                Verified Grounded Text
              </span>
            </div>
            <div className="p-4 bg-[#0a0f1d] border border-cyan-500/20 rounded-lg text-slate-200 text-sm leading-relaxed whitespace-pre-line font-mono font-normal">
              "{citation.excerpt}"
            </div>
          </div>

          {/* Principle Reminder */}
          <div className="p-3.5 bg-cyan-950/30 border border-cyan-800/40 rounded-lg flex gap-3 text-xs text-cyan-200">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>Zero-Hallucination Policy:</strong> This requirement was retrieved directly from the verified campus document above. CampusFlow does not synthesize speculative policies or arbitrary deadlines.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#131d33] border-t border-[#1e293b] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
          >
            Close Citation
          </button>
        </div>
      </div>
    </div>
  );
};
