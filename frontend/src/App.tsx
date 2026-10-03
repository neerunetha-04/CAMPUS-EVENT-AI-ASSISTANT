import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { GuidedEventPlanner } from './pages/GuidedEventPlanner';
import { EventWorkspace } from './pages/EventWorkspace';
import { AskAssistant } from './pages/AskAssistant';
import { DocumentCenter } from './pages/DocumentCenter';
import { DocumentInspector } from './pages/DocumentInspector';
import { ConflictCenter } from './pages/ConflictCenter';
import { ExportDossierModal } from './pages/ExportDossierModal';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [inspectDocId, setInspectDocId] = useState<string | undefined>(undefined);
  const [exportModalEventId, setExportModalEventId] = useState<string | null>(null);

  const handleSelectEvent = (eventId: string) => {
    setActiveEventId(eventId);
    setCurrentTab('workspace');
  };

  const handleInspectDocument = (docId: string) => {
    setInspectDocId(docId);
    setCurrentTab('inspector');
  };

  const handlePlannerComplete = (eventId: string) => {
    setActiveEventId(eventId);
    setCurrentTab('workspace');
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeEventName={activeEventId ? `Event #${activeEventId.slice(0, 6)}` : undefined}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentTab === 'dashboard' && (
          <Dashboard
            onNavigate={(tab, evId) => {
              if (evId) setActiveEventId(evId);
              setCurrentTab(tab);
            }}
            onSelectEvent={handleSelectEvent}
          />
        )}

        {currentTab === 'new_event' && (
          <GuidedEventPlanner
            onComplete={handlePlannerComplete}
            onCancel={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'workspace' && activeEventId && (
          <EventWorkspace
            eventId={activeEventId}
            onBack={() => setCurrentTab('dashboard')}
            onOpenExport={(evId) => setExportModalEventId(evId)}
          />
        )}

        {currentTab === 'assistant' && (
          <AskAssistant initialEventId={activeEventId || undefined} />
        )}

        {currentTab === 'documents' && (
          <DocumentCenter onInspectDocument={handleInspectDocument} />
        )}

        {currentTab === 'inspector' && (
          <DocumentInspector initialDocumentId={inspectDocId} />
        )}

        {currentTab === 'conflicts' && (
          <ConflictCenter />
        )}
      </main>

      {/* Export Dossier Modal */}
      {exportModalEventId && (
        <ExportDossierModal
          eventId={exportModalEventId}
          onClose={() => setExportModalEventId(null)}
        />
      )}

      {/* Footer */}
      <footer className="no-print border-t border-[#1e2c47] bg-[#080c18] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CampusFlow • Campus Event Planning Assistant</span>
          <span className="text-[11px] text-slate-600">Zero Hallucinations • Traceable Citations • Grounded Institutional Policies</span>
        </div>
      </footer>

    </div>
  );
};

export default App;
