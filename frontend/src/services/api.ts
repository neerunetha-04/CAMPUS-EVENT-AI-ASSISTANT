import { 
  EventData, 
  ChecklistGrouped, 
  ChecklistItem, 
  DocumentItem, 
  DocumentChunk, 
  ConflictItem, 
  GroundedAnswer, 
  SystemStats 
} from '../types';

const API_BASE = '/api';

export const api = {
  // Stats
  async getStats(): Promise<SystemStats> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // Events
  async getEvents(): Promise<EventData[]> {
    const res = await fetch(`${API_BASE}/events`);
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  async getEvent(id: string): Promise<EventData> {
    const res = await fetch(`${API_BASE}/events/${id}`);
    if (!res.ok) throw new Error('Failed to fetch event');
    return res.json();
  },

  async createEvent(data: Partial<EventData>): Promise<EventData> {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create event' }));
      throw new Error(err.detail || 'Failed to create event');
    }
    return res.json();
  },

  async updateEvent(id: string, data: Partial<EventData>): Promise<EventData> {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update event' }));
      throw new Error(err.detail || 'Failed to update event');
    }
    return res.json();
  },

  async deleteEvent(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete event');
  },

  async getChecklist(eventId: string): Promise<ChecklistGrouped> {
    const res = await fetch(`${API_BASE}/events/${eventId}/checklist`);
    if (!res.ok) throw new Error('Failed to fetch checklist');
    return res.json();
  },

  async updateChecklistItem(eventId: string, itemId: string, status: string): Promise<ChecklistItem> {
    const res = await fetch(`${API_BASE}/events/${eventId}/checklist/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update checklist item');
    return res.json();
  },

  async getExportDossier(eventId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/events/${eventId}/export`);
    if (!res.ok) throw new Error('Failed to fetch export dossier');
    return res.json();
  },

  // Questions / Procedural QA
  async askQuestion(question: string, eventId?: string): Promise<GroundedAnswer> {
    const res = await fetch(`${API_BASE}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, event_id: eventId || null }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to retrieve answer' }));
      throw new Error(err.detail || 'Failed to retrieve answer');
    }
    return res.json();
  },

  // Documents
  async getDocuments(): Promise<DocumentItem[]> {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async getDocument(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/${id}`);
    if (!res.ok) throw new Error('Failed to fetch document');
    return res.json();
  },

  async uploadDocument(formData: FormData): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Document processing failed' }));
      throw new Error(err.detail || 'Document processing failed');
    }
    return res.json();
  },

  async updateDocumentStatus(id: string, status: string): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/${id}/status?status_val=${encodeURIComponent(status)}`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to update document status');
    return res.json();
  },

  async reindexDocument(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/documents/${id}/reindex`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reindex document');
    return res.json();
  },

  async getDocumentChunks(id: string): Promise<DocumentChunk[]> {
    const res = await fetch(`${API_BASE}/documents/${id}/chunks`);
    if (!res.ok) throw new Error('Failed to fetch document chunks');
    return res.json();
  },

  async deleteDocument(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete document');
  },

  // Conflicts
  async getConflicts(): Promise<ConflictItem[]> {
    const res = await fetch(`${API_BASE}/conflicts`);
    if (!res.ok) throw new Error('Failed to fetch conflicts');
    return res.json();
  }
};
