// Personal-note drafts, autosave, and external-change handling.
//
// One draft per note, shared by every editor that shows it. Each save sends the version (content hash) the draft is
// based on; the server refuses stale saves, which become a conflict the learner resolves explicitly. Change events
// from the server (and a polling fallback) bring external edits into clean drafts and turn them into conflicts for
// dirty drafts — an older autosave never silently overwrites newer disk content.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Note, NoteChangeEvent } from '../../shared/types.ts';
import { api, ApiError } from '../lib/api.ts';

export interface NoteContent {
  title: string;
  body: string;
  topics: string[];
  tags: string[];
}

export type SaveStatus = 'saved' | 'dirty' | 'saving' | 'error' | 'conflict' | 'deleted';

export interface Draft extends NoteContent {
  id: string;
  baseVersion: string;
  saved: NoteContent;
  status: SaveStatus;
  error?: string;
  lastSavedAt?: string;
  conflict?: { disk: Note; mine: NoteContent; reason: 'save-rejected' | 'changed-while-editing' };
  external?: { before: NoteContent; after: NoteContent; at: string; source: 'external' | 'other-window' };
}

interface NotesCtx {
  notes: Note[];
  drafts: Record<string, Draft>;
  connection: 'live' | 'polling';
  ensureDraft: (id: string) => Promise<void>;
  edit: (id: string, patch: Partial<NoteContent>) => void;
  flush: (id: string) => Promise<void>;
  create: (init?: Partial<NoteContent>) => Promise<Note>;
  remove: (id: string) => Promise<void>;
  resolveConflict: (id: string, choice: 'mine' | 'disk' | { merged: NoteContent }) => Promise<void>;
  dismissExternal: (id: string) => void;
  restore: (id: string, rev: string) => Promise<void>;
  saveDraftAsNew: (id: string) => Promise<Note>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<NotesCtx | null>(null);

export function useNotes(): NotesCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('NotesProvider missing');
  return c;
}

export const contentOf = (n: Note | Draft | NoteContent): NoteContent => ({
  title: n.title,
  body: n.body,
  topics: [...n.topics],
  tags: [...n.tags],
});

export const sameContent = (a: NoteContent, b: NoteContent) =>
  a.title === b.title && a.body === b.body && a.topics.join('\u0000') === b.topics.join('\u0000') && a.tags.join('\u0000') === b.tags.join('\u0000');

const AUTOSAVE_MS = 700;

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [connection, setConnection] = useState<'live' | 'polling'>('polling');
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;
  const timers = useRef(new Map<string, number>());
  const inFlight = useRef(new Set<string>());
  const deferred = useRef(new Map<string, NoteChangeEvent[]>());

  const setDraft = useCallback((id: string, fn: (d: Draft) => Draft | undefined) => {
    setDrafts((all) => {
      const cur = all[id];
      if (!cur) return all;
      const next = fn(cur);
      if (!next) {
        const { [id]: _, ...rest } = all;
        return rest;
      }
      const updated = { ...all, [id]: next };
      draftsRef.current = updated;
      return updated;
    });
  }, []);

  const upsertNote = useCallback((n: Note) => {
    setNotes((list) => {
      const i = list.findIndex((x) => x.id === n.id);
      const next = i < 0 ? [n, ...list] : list.map((x) => (x.id === n.id ? n : x));
      return next.sort((a, b) => b.updated.localeCompare(a.updated));
    });
  }, []);

  const refresh = useCallback(async () => {
    // Snapshot draft versions first: a list fetched while a save or create is completing must not be mistaken
    // for an external change (or a deletion) when it arrives.
    const before = Object.fromEntries(Object.entries(draftsRef.current).map(([id, d]) => [id, d.baseVersion]));
    const busy = inFlight.current.size > 0;
    const list = await api.notes();
    setNotes(list);
    if (busy || inFlight.current.size > 0) return;
    // Polling fallback: detect versions that changed without an event reaching us.
    for (const n of list) {
      const d = draftsRef.current[n.id];
      if (d && before[n.id] === d.baseVersion && d.baseVersion !== n.version) applyRemoteChange(n, 'external');
    }
    for (const [id, base] of Object.entries(before)) {
      const d = draftsRef.current[id];
      if (d && d.baseVersion === base && !list.some((n) => n.id === id)) setDraft(id, (x) => ({ ...x, status: 'deleted' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Bring a newer disk version into a draft: adopt it if clean, otherwise raise a conflict. */
  const applyRemoteChange = useCallback(
    (n: Note, origin: 'external' | 'app') => {
      upsertNote(n);
      const d = draftsRef.current[n.id];
      if (!d || d.baseVersion === n.version) return;
      const mine = contentOf(d);
      const dirty = !sameContent(mine, d.saved);
      if (dirty || d.status === 'conflict') {
        window.clearTimeout(timers.current.get(n.id));
        setDraft(n.id, (x) => ({
          ...x,
          status: 'conflict',
          conflict: { disk: n, mine: contentOf(x), reason: x.conflict?.reason ?? 'changed-while-editing' },
        }));
        return;
      }
      setDraft(n.id, (x) => ({
        ...x,
        ...contentOf(n),
        saved: contentOf(n),
        baseVersion: n.version,
        status: 'saved',
        external: { before: x.saved, after: contentOf(n), at: new Date().toISOString(), source: origin === 'external' ? 'external' : 'other-window' },
      }));
    },
    [setDraft, upsertNote],
  );

  const handleEvent = useCallback(
    async (ev: NoteChangeEvent) => {
      if (inFlight.current.has(ev.id)) {
        // Our own save may not have returned yet; decide once it does.
        deferred.current.set(ev.id, [...(deferred.current.get(ev.id) ?? []), ev]);
        return;
      }
      if (ev.type === 'note-deleted') {
        setNotes((l) => l.filter((x) => x.id !== ev.id));
        setDraft(ev.id, (d) => ({ ...d, status: 'deleted' }));
        return;
      }
      // Our own completed saves already moved the draft to this version.
      if (ev.version && ev.version === draftsRef.current[ev.id]?.baseVersion) return;
      try {
        const n = await api.note(ev.id);
        applyRemoteChange(n, ev.origin);
      } catch {
        /* note vanished between event and fetch; the delete event will follow */
      }
    },
    [applyRemoteChange, setDraft, upsertNote],
  );

  useEffect(() => {
    refresh().catch(() => undefined);
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/events');
      es.onopen = () => setConnection('live');
      es.onerror = () => setConnection('polling');
      es.addEventListener('note', (e) => handleEvent(JSON.parse((e as MessageEvent).data)));
    } catch {
      setConnection('polling');
    }
    const poll = window.setInterval(() => refresh().catch(() => undefined), 4000);
    return () => {
      es?.close();
      window.clearInterval(poll);
    };
  }, [refresh, handleEvent]);

  const save = useCallback(
    async (id: string): Promise<void> => {
      const d = draftsRef.current[id];
      if (!d || d.status === 'conflict' || d.status === 'deleted') return;
      const sending = contentOf(d);
      if (sameContent(sending, d.saved)) {
        setDraft(id, (x) => ({ ...x, status: 'saved' }));
        return;
      }
      if (inFlight.current.has(id)) return; // the completion handler reschedules
      inFlight.current.add(id);
      setDraft(id, (x) => ({ ...x, status: 'saving' }));
      try {
        const n = await api.updateNote(id, { baseVersion: d.baseVersion, ...sending });
        upsertNote(n);
        setDraft(id, (x) => {
          const stillDirty = !sameContent(contentOf(x), sending);
          return { ...x, baseVersion: n.version, saved: sending, status: stillDirty ? 'dirty' : 'saved', error: undefined, lastSavedAt: n.updated };
        });
      } catch (e) {
        if (e instanceof ApiError && e.status === 409 && e.body?.current) {
          const disk = e.body.current as Note;
          upsertNote(disk);
          setDraft(id, (x) => ({ ...x, status: 'conflict', conflict: { disk, mine: contentOf(x), reason: 'save-rejected' } }));
        } else if (e instanceof ApiError && e.status === 404) {
          setDraft(id, (x) => ({ ...x, status: 'deleted' }));
        } else {
          setDraft(id, (x) => ({ ...x, status: 'error', error: (e as Error).message || 'Network error' }));
          window.clearTimeout(timers.current.get(id));
          timers.current.set(id, window.setTimeout(() => save(id), 3000));
        }
      } finally {
        inFlight.current.delete(id);
        const queued = deferred.current.get(id) ?? [];
        deferred.current.delete(id);
        for (const ev of queued) await handleEvent(ev);
        const after = draftsRef.current[id];
        if (after && after.status === 'dirty') {
          window.clearTimeout(timers.current.get(id));
          timers.current.set(id, window.setTimeout(() => save(id), AUTOSAVE_MS));
        }
      }
    },
    [handleEvent, setDraft, upsertNote],
  );

  const ensureDraft = useCallback(async (id: string) => {
    if (draftsRef.current[id]) return;
    const n = await api.note(id);
    upsertNote(n);
    setDrafts((all) => {
      if (all[id]) return all;
      const next = { ...all, [id]: { id, ...contentOf(n), saved: contentOf(n), baseVersion: n.version, status: 'saved' as const } };
      draftsRef.current = next;
      return next;
    });
  }, [upsertNote]);

  const edit = useCallback(
    (id: string, patch: Partial<NoteContent>) => {
      setDraft(id, (d) => {
        const next = { ...d, ...patch };
        const dirty = !sameContent(contentOf(next), d.saved);
        const status = d.status === 'conflict' || d.status === 'deleted' ? d.status : dirty ? 'dirty' : 'saved';
        return { ...next, status };
      });
      window.clearTimeout(timers.current.get(id));
      timers.current.set(id, window.setTimeout(() => save(id), AUTOSAVE_MS));
    },
    [save, setDraft],
  );

  const flush = useCallback(
    async (id: string) => {
      window.clearTimeout(timers.current.get(id));
      await save(id);
    },
    [save],
  );

  // Flush every pending draft when the tab is hidden, so closing the window does not drop the last keystrokes.
  useEffect(() => {
    const onHide = () => {
      for (const id of timers.current.keys()) flush(id);
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
    };
  }, [flush]);

  const create = useCallback(
    async (init?: Partial<NoteContent>) => {
      const n = await api.createNote(init ?? {});
      upsertNote(n);
      setDrafts((all) => {
        const next = { ...all, [n.id]: { id: n.id, ...contentOf(n), saved: contentOf(n), baseVersion: n.version, status: 'saved' as const } };
        draftsRef.current = next;
        return next;
      });
      return n;
    },
    [upsertNote],
  );

  const remove = useCallback(async (id: string) => {
    window.clearTimeout(timers.current.get(id));
    const d = draftsRef.current[id];
    await api.deleteNote(id, d?.baseVersion);
    setNotes((l) => l.filter((x) => x.id !== id));
    setDrafts((all) => {
      const { [id]: _, ...rest } = all;
      draftsRef.current = rest;
      return rest;
    });
  }, []);

  const resolveConflict = useCallback(
    async (id: string, choice: 'mine' | 'disk' | { merged: NoteContent }) => {
      const d = draftsRef.current[id];
      if (!d?.conflict) return;
      const disk = d.conflict.disk;
      if (choice === 'disk') {
        // Keep the discarded draft as a revision first, so choosing the disk version never loses work.
        if (!sameContent(contentOf(d), contentOf(disk))) await api.saveDraftRevision(id, contentOf(d));
        setDraft(id, (x) => ({ ...x, ...contentOf(disk), saved: contentOf(disk), baseVersion: disk.version, status: 'saved', conflict: undefined }));
        return;
      }
      const content = choice === 'mine' ? contentOf(d) : choice.merged;
      // Base the save on the disk version we showed; if the disk changed again, the server raises a new conflict.
      const next: Draft = { ...d, ...content, saved: contentOf(disk), baseVersion: disk.version, status: 'dirty', conflict: undefined };
      draftsRef.current = { ...draftsRef.current, [id]: next };
      setDrafts((all) => ({ ...all, [id]: next }));
      await flush(id);
    },
    [flush, setDraft],
  );

  const dismissExternal = useCallback((id: string) => setDraft(id, (d) => ({ ...d, external: undefined })), [setDraft]);

  const restore = useCallback(
    async (id: string, rev: string) => {
      await flush(id);
      const d = draftsRef.current[id];
      if (!d) return;
      try {
        const n = await api.restore(id, rev, d.baseVersion);
        upsertNote(n);
        setDraft(id, (x) => ({ ...x, ...contentOf(n), saved: contentOf(n), baseVersion: n.version, status: 'saved', external: undefined }));
      } catch (e) {
        if (e instanceof ApiError && e.status === 409 && e.body?.current) {
          applyRemoteChange(e.body.current as Note, 'external');
          throw new Error('The note changed on disk just before the restore. Review the update, then try again.');
        }
        throw e;
      }
    },
    [applyRemoteChange, flush, setDraft, upsertNote],
  );

  const saveDraftAsNew = useCallback(
    async (id: string) => {
      const d = draftsRef.current[id];
      if (!d) throw new Error('No draft');
      const n = await create({ ...contentOf(d), title: `${d.title} (recovered)` });
      setDrafts((all) => {
        const { [id]: _, ...rest } = all;
        draftsRef.current = rest;
        return rest;
      });
      return n;
    },
    [create],
  );

  const value = useMemo<NotesCtx>(
    () => ({ notes, drafts, connection, ensureDraft, edit, flush, create, remove, resolveConflict, dismissExternal, restore, saveDraftAsNew, refresh }),
    [notes, drafts, connection, ensureDraft, edit, flush, create, remove, resolveConflict, dismissExternal, restore, saveDraftAsNew, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
