import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Scale, 
  ArrowRight, 
  FileText,
  HelpCircle,
  Info
} from 'lucide-react';
import { ConflictItem } from '../types';
import { api } from '../services/api';
import { EmptyState } from '../components/EmptyState';

export const ConflictCenter: React.FC = () => {
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getConflicts()
      .then(setConflicts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950 border border-amber-800 text-amber-300 text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Cross-Document Institutional Conflict Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Policy Conflict Resolution Hub
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Institutional documents can contradict each other across versions, circulars, or departments. CampusFlow highlights discrepancies side-by-side and evaluates administrative precedence without fabricating decisions.
        </p>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Scanning repository for policy discrepancies...</div>
      ) : conflicts.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No conflicts detected"
          description="The current active planning requirements do not contain conflicting source information. All active policies, deadlines, and authority rules align consistently."
        />
      ) : (
        <div className="space-y-6">
          {conflicts.map((conflict, idx) => (
            <div
              key={idx}
              className="p-6 bg-[#111a2e] border border-amber-500/30 rounded-2xl shadow-xl space-y-5"
            >
              {/* Conflict Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e2c47] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      Discrepancy Topic: {conflict.topic}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {conflict.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {conflict.is_resolvable ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Precedence Determinable
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Requires Administrative Decision
                    </span>
                  )}
                </div>
              </div>

              {/* Side-by-Side Comparison Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Source A */}
                <div className="p-4 bg-[#0a0f1d] border border-[#1e2c47] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300">SOURCE A</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded">
                      {conflict.source_a.version}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{conflict.source_a.document}</h4>
                    <span className="text-[11px] text-purple-300 block">
                      Authority: {conflict.source_a.authority}
                    </span>
                  </div>
                  <div className="p-3 bg-[#111a2e] border border-cyan-500/20 rounded-lg text-xs text-slate-200 font-mono leading-relaxed">
                    "{conflict.source_a.text}"
                  </div>
                </div>

                {/* Source B */}
                <div className="p-4 bg-[#0a0f1d] border border-[#1e2c47] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">SOURCE B</span>
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded">
                      {conflict.source_b.version}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{conflict.source_b.document}</h4>
                    <span className="text-[11px] text-purple-300 block">
                      Authority: {conflict.source_b.authority}
                    </span>
                  </div>
                  <div className="p-3 bg-[#111a2e] border border-amber-500/20 rounded-lg text-xs text-slate-200 font-mono leading-relaxed">
                    "{conflict.source_b.text}"
                  </div>
                </div>

              </div>

              {/* Resolution Explanation */}
              <div className="p-4 bg-[#131f37] border border-[#1e2d4d] rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Administrative Precedence Analysis</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {conflict.resolution_explanation}
                </p>
                {conflict.higher_authority_source && (
                  <div className="pt-1 flex items-center gap-2 text-xs text-cyan-300 font-medium">
                    <span>Governing Source:</span>
                    <strong className="text-white">{conflict.higher_authority_source}</strong>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
