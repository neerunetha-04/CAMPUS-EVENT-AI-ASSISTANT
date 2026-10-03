import React, { useState, useEffect } from 'react';
import { 
  Send, 
  HelpCircle, 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { GroundedAnswer, EventData, Citation } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { CitationDrawer } from '../components/CitationDrawer';

interface AskAssistantProps {
  initialEventId?: string;
}

export const AskAssistant: React.FC<AskAssistantProps> = ({ initialEventId }) => {
  const [question, setQuestion] = useState('');
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId || '');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<GroundedAnswer[]>([]);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  useEffect(() => {
    api.getEvents().then(setEvents).catch(console.error);
  }, []);

  const sampleQuestions = [
    "Do I need approval for an external speaker?",
    "What is the venue booking submission deadline?",
    "What crowd safety measures are required for 250 attendees?",
    "Is external catering permitted?",
    "Can I bring a pet elephant to the auditorium?" // Demonstration of zero-hallucination
  ];

  const handleAsk = async (qText?: string) => {
    const q = (qText || question).trim();
    if (!q) return;

    try {
      setLoading(true);
      const answer = await api.askQuestion(q, selectedEventId || undefined);
      setHistory(prev => [answer, ...prev]);
      setQuestion('');
    } catch (err: any) {
      alert(`Error querying assistant: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Strictly Grounded Institutional Procedural QA</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Ask Procedural Compliance Assistant
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Queries are verified against active campus policies, venue regulations, and safety circulars. If no authoritative document establishes a requirement, CampusFlow explicitly confirms the absence of evidence.
        </p>
      </div>

      {/* Query Bar & Event Context Selector */}
      <div className="p-4 bg-[#111a2e] border border-[#1e2c47] rounded-xl shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1e2c47]">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-200">Event Context (Optional):</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-2.5 py-1 bg-[#0a0f1d] border border-[#1e2c47] rounded-md text-xs text-white focus:outline-hidden focus:border-cyan-500"
            >
              <option value="">General Campus Query (No Context)</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.preferred_venue || 'No venue'})
                </option>
              ))}
            </select>
          </div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Zero Speculation Enforced
          </span>
        </div>

        {/* Input box */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="Ask a procedural question (e.g. Do I need approval for an external speaker?)..."
            className="flex-1 px-4 py-2.5 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading || !question.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-md shadow-cyan-950/50 flex items-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Verifying...' : 'Ask'}</span>
          </button>
        </div>

        {/* Sample questions */}
        <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 mr-1">Suggested inquiries:</span>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAsk(q)}
              className="px-2.5 py-1 bg-[#131f37] hover:bg-[#1b2b4d] border border-[#1e2d4d] rounded-md text-[11px] text-cyan-300 hover:text-white transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Answers History Stream */}
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="p-8 text-center bg-[#111a2e]/40 border border-[#1e2c47] rounded-xl text-slate-400 space-y-2">
            <MessageSquare className="w-8 h-8 mx-auto text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-200">No queries submitted yet</h3>
            <p className="text-xs max-w-md mx-auto leading-relaxed">
              Ask a question above or click one of the suggested inquiries to see grounded institutional compliance answers with traceable source citations.
            </p>
          </div>
        ) : (
          history.map((item, idx) => (
            <div
              key={idx}
              className="p-5 bg-[#111a2e] border border-[#1e2c47] rounded-xl shadow-md space-y-4 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* Question & Classification */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#1e2c47] pb-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Procedural Query
                  </span>
                  <h3 className="text-base font-bold text-white">
                    "{item.question}"
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={item.requirement_type} size="sm" />
                </div>
              </div>

              {/* Grounded Answer */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Authoritative Finding
                </span>
                <p className={`text-sm leading-relaxed p-3.5 rounded-lg border ${
                  item.has_authoritative_source 
                    ? 'bg-[#0a0f1d] border-cyan-500/20 text-slate-100 font-medium'
                    : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                }`}>
                  {item.answer}
                </p>
              </div>

              {/* Why & Governing Authority */}
              <div className="space-y-1 text-xs text-slate-300">
                <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[11px]">
                  Governing Principle & Timeline
                </span>
                <p className="text-slate-300 leading-relaxed bg-[#0a0f1d]/60 p-3 rounded-lg border border-[#1e2c47]">
                  {item.why}
                </p>
              </div>

              {/* Citations Strip */}
              {item.citations.length > 0 && (
                <div className="pt-2 border-t border-[#1e2c47] space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Document Citations & Traceability
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {item.citations.map((c, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => setActiveCitation(c)}
                        className="px-3 py-1.5 bg-[#131f37] hover:bg-cyan-950/60 border border-cyan-500/30 rounded-lg text-xs text-cyan-300 flex items-center gap-2 transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{c.document_title} ({c.version})</span>
                        <span className="text-slate-400 font-mono text-[10px]">P.{c.page_number || 1}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Citation Drawer Modal */}
      <CitationDrawer
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />

    </div>
  );
};
