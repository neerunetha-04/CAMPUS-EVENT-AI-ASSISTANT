import React, { useState, useEffect } from 'react';
import { X, Printer, ShieldCheck, CheckCircle2, AlertTriangle, BookOpen, Download } from 'lucide-react';
import { api } from '../services/api';

interface ExportDossierModalProps {
  eventId: string;
  onClose: () => void;
}

export const ExportDossierModal: React.FC<ExportDossierModalProps> = ({ eventId, onClose }) => {
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getExportDossier(eventId)
      .then(setDossier)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [eventId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    if (!dossier) return;
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CampusFlow_Dossier_${dossier.event_summary?.name?.replace(/\s+/g, '_') || 'Event'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
        <div className="p-8 bg-[#0f172a] rounded-xl text-slate-300">Loading export dossier...</div>
      </div>
    );
  }

  if (!dossier) return null;

  const { event_summary, readiness, checklist, missing_information, conflicts } = dossier;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#131d33]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Event Planning Readiness Dossier</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadJSON}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download JSON
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white text-xs font-semibold rounded-lg shadow-md flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-200 font-sans print:p-0 print:text-black">
          
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-700 pb-4 flex justify-between items-start">
            <div>
              <span className="text-xs uppercase tracking-widest text-cyan-400 font-bold block mb-1">
                CAMPUSFLOW • INSTITUTIONAL COMPLIANCE DOSSIER
              </span>
              <h1 className="text-2xl font-black text-white">{event_summary.name}</h1>
              <p className="text-xs text-slate-400 mt-1">
                Department: {event_summary.organizing_department || 'Student Organization'} • Organizer: {event_summary.organizer_name || 'Event Coordinator'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono font-bold block mb-1">
                STATUS: {readiness.planning_status}
              </span>
              <span className="text-[11px] text-slate-400">
                Score: {readiness.readiness_score}% Readiness
              </span>
            </div>
          </div>

          {/* Event Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#111a2e] border border-[#1e2c47] rounded-xl text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">EVENT DATE</span>
              <span className="font-semibold text-white">{event_summary.date || 'Pending'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">DESIGNATED VENUE</span>
              <span className="font-semibold text-white">{event_summary.venue || 'Pending'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">EXPECTED PARTICIPANTS</span>
              <span className="font-semibold text-white">{event_summary.expected_attendance || 0}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">BUDGET & FUNDING</span>
              <span className="font-semibold text-white">${event_summary.estimated_budget || 0} ({event_summary.funding_source || 'General'})</span>
            </div>
          </div>

          {/* Missing Information Section */}
          {missing_information && missing_information.length > 0 && (
            <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-2">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Missing Critical Parameters (Grounded Institutional Blockers)
              </h3>
              <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                {missing_information.map((m: any, idx: number) => (
                  <li key={idx}><strong>{m.label}:</strong> {m.reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Mandatory Requirements */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#1e2c47] pb-2">
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                1. Official Mandatory Requirements ({checklist.mandatory.length})
              </h3>
              <span className="text-[11px] text-slate-400">Direct Institutional Mandates</span>
            </div>
            <div className="space-y-2">
              {checklist.mandatory.map((item: any, idx: number) => (
                <div key={idx} className="p-3 bg-[#111a2e] border border-[#1e2c47] rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{item.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950 text-rose-300 border border-rose-800">
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{item.description}</p>
                  <div className="text-[10px] text-slate-400 pt-1 flex justify-between">
                    <span>Authority: {item.authority}</span>
                    <span>Due: {item.deadline || 'Prior to event'}</span>
                    <span className="text-cyan-300 font-mono">Source: {item.source}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conditional Requirements */}
          {checklist.conditional.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#1e2c47] pb-2">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  2. Conditional Requirements ({checklist.conditional.length})
                </h3>
                <span className="text-[11px] text-slate-400">Triggered by Operational Context</span>
              </div>
              <div className="space-y-2">
                {checklist.conditional.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 bg-[#111a2e] border border-[#1e2c47] rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{item.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{item.description}</p>
                    <div className="text-[10px] text-slate-400 pt-1 flex justify-between">
                      <span>Trigger: {item.trigger}</span>
                      <span>Authority: {item.authority}</span>
                      <span className="text-cyan-300 font-mono">Source: {item.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Suggestions */}
          {checklist.optional.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#1e2c47] pb-2">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  3. Optional Recommendations ({checklist.optional.length})
                </h3>
                <span className="text-[11px] text-slate-400">Non-Mandatory Suggestions</span>
              </div>
              <div className="space-y-2">
                {checklist.optional.map((item: any, idx: number) => (
                  <div key={idx} className="p-3 bg-[#111a2e] border border-[#1e2c47] rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{item.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                        OPTIONAL
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{item.description}</p>
                    <div className="text-[10px] text-slate-400 pt-1 flex justify-between">
                      <span>Authority: {item.authority}</span>
                      <span className="text-cyan-300 font-mono">Source: {item.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verification Footnote */}
          <div className="pt-4 border-t border-slate-700 text-[10px] text-slate-500 flex justify-between">
            <span>Generated via CampusFlow Institutional Compliance Engine</span>
            <span>Traceable SHA256 Verified Policy Corpus</span>
          </div>

        </div>

      </div>
    </div>
  );
};
