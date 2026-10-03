import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  ChevronRight, 
  Sparkles, 
  BookOpen, 
  AlertTriangle, 
  HelpCircle, 
  ShieldCheck, 
  Trash2,
  FileCheck2
} from 'lucide-react';
import { EventData, SystemStats } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';

interface DashboardProps {
  onNavigate: (tab: string, eventId?: string) => void;
  onSelectEvent: (eventId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onSelectEvent }) => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsData, statsData] = await Promise.all([
        api.getEvents(),
        api.getStats().catch(() => null)
      ]);
      setEvents(eventsData);
      if (statsData) setStats(statsData);
    } catch (err) {
      console.error('Error loading dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteEvent = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await api.deleteEvent(id);
        setEvents(events.filter(ev => ev.id !== id));
      } catch (err) {
        alert('Failed to delete event');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d182e] via-[#111f3d] to-[#0d182e] border border-[#1e2f50] p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Evidence-Backed Procedural Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Plan your campus event with grounded confidence.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              CampusFlow synthesizes official university policies, venue guidelines, and safety circulars into an authoritative, traceable event checklist. No speculation. Zero hallucinations.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <button
              onClick={() => onNavigate('new_event')}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white text-sm font-semibold rounded-xl shadow-lg shadow-cyan-950/50 flex items-center gap-2 transition-all transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event Plan</span>
            </button>
            <button
              onClick={() => onNavigate('assistant')}
              className="px-4 py-2.5 bg-[#172544] hover:bg-[#1f325c] border border-[#2b3e69] text-slate-200 text-sm font-medium rounded-xl flex items-center gap-2 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>Ask Procedure</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-[#111a2e] border border-[#1e2c47] rounded-xl shadow-sm">
          <span className="text-xs font-medium text-slate-400 block mb-1">Active Events</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{events.length}</span>
            <span className="text-xs text-slate-400">tracked</span>
          </div>
        </div>
        <div className="p-4 bg-[#111a2e] border border-[#1e2c47] rounded-xl shadow-sm">
          <span className="text-xs font-medium text-slate-400 block mb-1">Institutional Policies</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-cyan-400">{stats?.active_documents || 5}</span>
            <span className="text-xs text-slate-400">active docs</span>
          </div>
        </div>
        <div className="p-4 bg-[#111a2e] border border-[#1e2c47] rounded-xl shadow-sm">
          <span className="text-xs font-medium text-slate-400 block mb-1">Procedural Chunks</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-400">{stats?.procedural_chunks || 21}</span>
            <span className="text-xs text-slate-400">rules indexed</span>
          </div>
        </div>
        <div className="p-4 bg-[#111a2e] border border-[#1e2c47] rounded-xl shadow-sm">
          <span className="text-xs font-medium text-slate-400 block mb-1">Conflicts Monitored</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">1</span>
            <span className="text-xs text-slate-400">precedence resolved</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Strip */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Quick Access:</span>
        <button
          onClick={() => onNavigate('new_event')}
          className="px-3 py-1.5 bg-[#131f37] hover:bg-[#1b2b4d] border border-[#1e2d4d] rounded-lg text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          Guided Event Intake
        </button>
        <button
          onClick={() => onNavigate('assistant')}
          className="px-3 py-1.5 bg-[#131f37] hover:bg-[#1b2b4d] border border-[#1e2d4d] rounded-lg text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          Procedural Q&A
        </button>
        <button
          onClick={() => onNavigate('documents')}
          className="px-3 py-1.5 bg-[#131f37] hover:bg-[#1b2b4d] border border-[#1e2d4d] rounded-lg text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          Document Corpus & Admin
        </button>
        <button
          onClick={() => onNavigate('conflicts')}
          className="px-3 py-1.5 bg-[#131f37] hover:bg-[#1b2b4d] border border-[#1e2d4d] rounded-lg text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Policy Conflicts Hub
        </button>
      </div>

      {/* Active Events List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Active Events</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
              {events.length}
            </span>
          </div>
          {events.length > 0 && (
            <button
              onClick={() => onNavigate('new_event')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Plan Another Event
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading events...</div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No events yet"
            description="Start planning your first campus event. CampusFlow will analyze your inputs against institutional guidelines and generate a grounded, traceable checklist."
            actionText="Start Guided Event Intake"
            onAction={() => onNavigate('new_event')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev) => (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev.id)}
                className="group relative bg-[#111a2e] hover:bg-[#14213d] border border-[#1e2c47] hover:border-cyan-500/40 rounded-xl p-5 transition-all shadow-md cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <StatusBadge status={ev.planning_status} size="sm" />
                    <button
                      onClick={(e) => handleDeleteEvent(e, ev.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 mb-1">
                    {ev.name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 line-clamp-1">
                    {ev.organizing_department || 'Student Organization'} • {ev.event_type || 'Event'}
                  </p>

                  <div className="space-y-2 text-xs text-slate-300 mb-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{ev.event_date || 'Date not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="truncate">{ev.preferred_venue || 'Venue pending'}</span>
                    </div>
                    {ev.expected_attendance && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>{ev.expected_attendance} participants</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Readiness Meter & Action */}
                <div className="pt-3 border-t border-[#1e2c47]/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Readiness Score</span>
                    <span className="font-semibold text-cyan-300">{ev.readiness_score}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        ev.readiness_score >= 80 ? 'bg-emerald-400' :
                        ev.readiness_score >= 50 ? 'bg-cyan-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${Math.max(5, ev.readiness_score)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs font-medium text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                    <span>Open Event Workspace</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
