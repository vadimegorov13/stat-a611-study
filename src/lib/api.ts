import type {
  Attempt,
  CourseBundle,
  ExamSettings,
  Note,
  NoteRevision,
  Progress,
  ScratchStore,
  SourcePageText,
} from '../../shared/types.ts';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body: any,
  ) {
    super(message);
  }
}

async function j<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new ApiError(r.status, body.error ?? r.statusText, body);
  }
  return r.json() as Promise<T>;
}

const body = (x: unknown) => JSON.stringify(x);

export const api = {
  course: () => j<CourseBundle>('/api/course'),
  sourceText: () => j<SourcePageText[]>('/api/source-text'),
  embedCheck: (url: string) => j<{ embeddable: boolean | null; reason: string }>(`/api/embed-check?url=${encodeURIComponent(url)}`),

  notes: () => j<Note[]>('/api/notes'),
  note: (id: string) => j<Note>(`/api/notes/${id}`),
  createNote: (n: { title?: string; topics?: string[]; tags?: string[]; body?: string }) =>
    j<Note>('/api/notes', { method: 'POST', body: body(n) }),
  updateNote: (id: string, u: { baseVersion: string; title?: string; topics?: string[]; tags?: string[]; body?: string }) =>
    j<Note>(`/api/notes/${id}`, { method: 'PUT', body: body(u) }),
  deleteNote: (id: string, baseVersion?: string) =>
    j<{ ok: true }>(`/api/notes/${id}${baseVersion ? `?baseVersion=${baseVersion}` : ''}`, { method: 'DELETE' }),
  revisions: (id: string) => j<NoteRevision[]>(`/api/notes/${id}/revisions`),
  revision: (id: string, rev: string) =>
    j<{ meta: NoteRevision; content: string; title: string; body: string }>(`/api/notes/${id}/revisions/${rev}`),
  restore: (id: string, rev: string, baseVersion: string) =>
    j<Note>(`/api/notes/${id}/restore`, { method: 'POST', body: body({ rev, baseVersion }) }),
  saveDraftRevision: (id: string, d: { title: string; body: string; topics: string[]; tags: string[] }) =>
    j<{ ok: true }>(`/api/notes/${id}/draft-revision`, { method: 'POST', body: body(d) }),

  progress: () => j<Progress>('/api/progress'),
  addAttempt: (a: Omit<Attempt, 'id' | 'at' | 'firstAttempt'>) => j<Attempt>('/api/progress/attempts', { method: 'POST', body: body(a) }),
  updateAttempt: (id: string, patch: Pick<Attempt, 'correct' | 'rubricMet' | 'rubricTotal'>) =>
    j<Attempt>(`/api/progress/attempts/${id}`, { method: 'PATCH', body: body(patch) }),
  setFlag: (qid: string, flagged: boolean, reason?: string) =>
    j<Progress>(`/api/progress/flags/${qid}`, { method: 'PUT', body: body({ flagged, reason }) }),
  setSaved: (item: string, saved: boolean) =>
    j<Progress>(`/api/progress/saved/${encodeURIComponent(item)}`, { method: 'PUT', body: body({ saved }) }),
  setStudied: (lid: string, studied: boolean) => j<Progress>(`/api/progress/studied/${lid}`, { method: 'PUT', body: body({ studied }) }),
  visit: (lid: string) => j<{ ok: true }>(`/api/progress/visit/${lid}`, { method: 'POST' }),
  setExam: (examChecklist?: Record<string, boolean>, examSettings?: ExamSettings) =>
    j<Progress>('/api/progress/exam', { method: 'PUT', body: body({ examChecklist, examSettings }) }),
  setPosition: (route: string) => j<{ ok: true }>('/api/progress/position', { method: 'PUT', body: body({ route }) }),
  reset: (parts: Record<string, boolean>, confirm: string) =>
    j<{ ok: true; backup: string; progress: Progress }>('/api/progress/reset', { method: 'POST', body: body({ parts, confirm }) }),

  scratch: () => j<ScratchStore>('/api/scratch'),
  setScratch: (qid: string, text: string) => j<{ ok: true }>(`/api/scratch/${qid}`, { method: 'PUT', body: body({ text }) }),

  backup: () => j<{ path: string }>('/api/backup', { method: 'POST' }),
  backups: () => j<{ name: string; path: string }[]>('/api/backups'),
};
