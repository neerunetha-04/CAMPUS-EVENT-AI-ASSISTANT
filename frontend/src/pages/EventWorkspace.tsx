import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Printer, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  FileText, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { EventData, ChecklistGrouped, ChecklistItem, MissingField } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { CitationDrawer } from '../components/CitationDrawer';

interface EventWorkspaceProps {
  eventId: string;
  onBack: () => void;
  onOpenExport: (eventId: string) => void;
}

export const EventWorkspace: React.FC<EventWorkspaceProps> = ({ eventId, onBack, onOpenExport }) => {
  const [event, setEvent] = useState<EventData | null>(null);
  const [checklist, setChecklist] = useState<ChecklistGrouped | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activeCitation, setActiveCitation] = useState<any>(null);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const [evData, clData] = await Promise.all([
        api.getEvent(eventId),
        api.getChecklist(eventId)
      ]);
      setEvent(evData);
      setChecklist(clData);
    } catch (err) {
      console.error('Failed to load event data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const handleToggleItemStatus = async (item: ChecklistItem) => {
    const newStatus = item.status === 'complete' ? 'pending' : 'complete';
    try {
      const updatedItem = await api.updateChecklistItem(eventId, item.id, newStatus);
      // Reload event to get updated readiness score
      const updatedEv = await api.getEvent(eventId);
      setEvent(updatedEv);

      // Update local checklist state
      if (checklist) {
        const updateList = (list: ChecklistItem[]) => 
          list.map(i => i.id === item.id ? { ...i, status: newStatus as any } : i);
        
        setChecklist({
          mandatory: updateList(checklist.mandatory),
          conditional: updateList(checklist.conditional),
          optional: updateList(checklist.optional),
          unknown: updateList(checklist.unknown),
          missing_information: checklist.missing_information
        });
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  if (loading || !event) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-slate-400">
        Loading event workspace...
      </div>
    );
  }

  // Combine items according to active filter
  const allItems: ChecklistItem[] = checklist ? [
    ...checklist.mandatory,
    ...checklist.conditional,
    ...checklist.optional,
    ...checklist.unknown
  ] : [];

  const filteredItems = allItems.filter(item => {
    if (filterType === 'all') return true;
    if (filterType === 'incomplete') return item.status !== 'complete';
    return item.requirement_type === filterType;
  });

  const mandatoryCount = checklist?.mandatory.length || 0;
  const completedMandatory = checklist?.mandatory.filter(i => i.status === 'complete').length || 0;
  const conditionalCount = checklist?.conditional.length || 0;
  const missingFields: MissingField[] = event.missing_fields_cache || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      
      {/* Top Navigation Strip */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={loadEventData}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors"
            title="Refresh Analysis"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenExport(event.id)}
            className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white text-xs font-semibold rounded-lg shadow-md shadow-cyan-950/40 flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4" />
            Export Planning Dossier
          </button>
        </div>
      </div>

      {/* Event Header Banner */}
      <div className="p-6 bg-gradient-to-r from-[#111a2e] via-[#131f37] to-[#111a2e] border border-[#1e2c47] rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white tracking-tight">{event.name}</h1>
              <StatusBadge status={event.planning_status} />
            </div>
            <p className="text-xs text-slate-400">
              Organized by <strong>{event.organizing_department || 'Student Organization'}</strong> • Category: {event.category || 'General'}
            </p>
          </div>

          {/* Readiness Score Badge */}
          <div className="flex items-center gap-4 bg-[#0a0f1d]/80 border border-[#1e2c47] p-3 rounded-xl">
            <div>
              <span className="text-[11px] text-slate-400 block">Readiness Score</span>
              <span className="text-2xl font-black text-cyan-300">{event.readiness_score}%</span>
            </div>
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  event.readiness_score >= 80 ? 'bg-emerald-400' :
                  event.readiness_score >= 50 ? 'bg-cyan-400' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.max(5, event.readiness_score)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Parameters Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#1e2c47]/80 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{event.event_date || 'Date Pending'} ({event.start_time || '10:00'} - {event.end_time || '16:00'})</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="truncate">{event.preferred_venue || 'Venue Unassigned'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{event.expected_attendance || 0} Expected Attendees</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>${event.estimated_budget || 0} ({event.funding_source || 'Unspecified'})</span>
          </div>
        </div>
      </div>

      {/* Missing Information Alerts */}
      {missingFields.length > 0 && (
        <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Planning Cannot Be Finalized — {missingFields.length} Critical Fields Missing</span>
            </div>
            <span className="text-[11px] text-amber-400/80">Governed by Institutional Policy</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {missingFields.map((m, idx) => (
              <div key={idx} className="p-2.5 bg-[#0a0f1d] border border-amber-500/20 rounded-lg text-xs space-y-0.5">
                <span className="font-semibold text-amber-300 block">{m.label}</span>
                <p className="text-[11px] text-slate-400 leading-snug">{m.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checklist Filter Tabs & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e2c47] pb-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'all', label: `All Requirements (${allItems.length})` },
            { id: 'mandatory', label: `Mandatory (${mandatoryCount})` },
            { id: 'conditional', label: `Conditional (${conditionalCount})` },
            { id: 'optional', label: `Optional (${checklist?.optional.length || 0})` },
            { id: 'incomplete', label: 'Incomplete' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filterType === tab.id
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Mandatory Progress:</span>
          <span className="font-semibold text-emerald-400">{completedMandatory} of {mandatoryCount}</span>
        </div>
      </div>

      {/* Checklist Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-[#111a2e] border border-[#1e2c47] rounded-xl">
            No requirements match this filter.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isComplete = item.status === 'complete';
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  isComplete
                    ? 'bg-[#0f172a]/60 border-emerald-900/30 text-slate-400'
                    : 'bg-[#111a2e] border-[#1e2c47] hover:border-cyan-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isComplete}
                    onChange={() => handleToggleItemStatus(item)}
                    className="mt-1 w-4 h-4 rounded text-cyan-500 focus:ring-0 cursor-pointer"
                  />

                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className={`text-sm font-semibold ${isComplete ? 'line-through text-slate-400' : 'text-white'}`}>
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.requirement_type} size="sm" />
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          isComplete ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isComplete ? 'Completed' : 'Action Required'}
                        </span>
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {/* Metadata Strip */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-[11px] text-slate-400 border-t border-[#1e2c47]/60">
                      {item.trigger && (
                        <span><strong>Trigger:</strong> {item.trigger}</span>
                      )}
                      {item.authority && (
                        <span><strong>Authority:</strong> {item.authority}</span>
                      )}
                      {item.deadline_if_documented && (
                        <span className="text-rose-300 font-medium">
                          <strong>Deadline:</strong> {item.deadline_if_documented}
                        </span>
                      )}
                      {item.owner_if_documented && (
                        <span><strong>Owner:</strong> {item.owner_if_documented}</span>
                      )}

                      {item.source && (
                        <button
                          onClick={() => setActiveCitation({
                            document_title: item.source,
                            version: item.source_version || 'v1.0',
                            authority: item.authority || 'University Administration',
                            section: 'Procedure',
                            excerpt: item.excerpt || 'Excerpt archived in institutional registry.'
                          })}
                          className="ml-auto text-cyan-400 hover:text-cyan-300 underline font-medium flex items-center gap-1"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          View Source Citation ({item.source_version || 'v1.0'})
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Citation Drawer */}
      <CitationDrawer
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />

    </div>
  );
};
