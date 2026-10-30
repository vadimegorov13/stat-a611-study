import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Attempt, CourseBundle, ExamSettings, Progress, ScratchStore, SourcePageText } from '../../shared/types.ts';
import { api } from '../lib/api.ts';

interface DataCtx {
  course: CourseBundle;
  progress: Progress;
  scratch: ScratchStore;
  sourcePages: SourcePageText[] | null;
  progressError: string | null;
  recordAttempt: (a: Omit<Attempt, 'id' | 'at' | 'firstAttempt'>) => Promise<Attempt>;
  updateAttempt: (id: string, patch: Pick<Attempt, 'correct' | 'rubricMet' | 'rubricTotal'>) => Promise<void>;
  setFlag: (qid: string, flagged: boolean, reason?: string) => Promise<void>;
  setStudied: (lid: string, studied: boolean) => Promise<void>;
  setSaved: (item: string, saved: boolean) => Promise<void>;
  visit: (lid: string) => void;
  setExam: (checklist?: Record<string, boolean>, settings?: ExamSettings) => Promise<void>;
  setScratch: (qid: string, text: string) => void;
  reloadProgress: () => Promise<void>;
}

const Ctx = createContext<DataCtx | null>(null);

export function useData(): DataCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('DataProvider missing');
  return c;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [course, setCourse] = useState<CourseBundle | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [scratch, setScratchState] = useState<ScratchStore>({});
  const [sourcePages, setSourcePages] = useState<SourcePageText[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);
  const scratchTimers = useRef(new Map<string, number>());

  useEffect(() => {
    Promise.all([api.course(), api.progress(), api.scratch()])
      .then(([c, p, s]) => {
        setCourse(c);
        setProgress(p);
        setScratchState(s);
      })
      .catch((e) => setError(String(e.message ?? e)));
    api.sourceText().then(setSourcePages).catch(() => setSourcePages([]));
  }, []);

  const guard = useCallback(async <T,>(p: Promise<T>): Promise<T> => {
    try {
      const r = await p;
      setProgressError(null);
      return r;
    } catch (e) {
      setProgressError(`Could not save progress: ${(e as Error).message}`);
      throw e;
    }
  }, []);

  const reloadProgress = useCallback(async () => setProgress(await api.progress()), []);

  const value = useMemo<DataCtx | null>(() => {
    if (!course || !progress) return null;
    return {
      course,
      progress,
      scratch,
      sourcePages,
      progressError,
      reloadProgress,
      recordAttempt: async (a) => {
        const saved = await guard(api.addAttempt(a));
        setProgress((p) => (p ? { ...p, attempts: [...p.attempts, saved] } : p));
        return saved;
      },
      updateAttempt: async (id, patch) => {
        const saved = await guard(api.updateAttempt(id, patch));
        setProgress((p) => (p ? { ...p, attempts: p.attempts.map((x) => (x.id === id ? saved : x)) } : p));
      },
      setFlag: async (qid, flagged, reason) => setProgress(await guard(api.setFlag(qid, flagged, reason))),
      setStudied: async (lid, studied) => setProgress(await guard(api.setStudied(lid, studied))),
      setSaved: async (item, saved) => {
        // Optimistic: the star responds immediately; the server copy then replaces it.
        setProgress((p) => {
          if (!p) return p;
          const next = { ...p.saved };
          if (saved) next[item] = { at: new Date().toISOString() };
          else delete next[item];
          return { ...p, saved: next };
        });
        setProgress(await guard(api.setSaved(item, saved)));
      },
      visit: (lid) => {
        api.visit(lid).catch(() => undefined);
        setProgress((p) => {
          if (!p) return p;
          const now = new Date().toISOString();
          const v = p.visits[lid];
          return { ...p, visits: { ...p.visits, [lid]: v ? { ...v, last: now, count: v.count + 1 } : { first: now, last: now, count: 1 } } };
        });
      },
      setExam: async (checklist, settings) => setProgress(await guard(api.setExam(checklist, settings))),
      setScratch: (qid, text) => {
        setScratchState((s) => ({ ...s, [qid]: { text, updated: new Date().toISOString() } }));
        const timers = scratchTimers.current;
        window.clearTimeout(timers.get(qid));
        timers.set(
          qid,
          window.setTimeout(() => {
            timers.delete(qid);
            guard(api.setScratch(qid, text)).catch(() => undefined);
          }, 500),
        );
      },
    };
  }, [course, progress, scratch, sourcePages, progressError, guard, reloadProgress]);

  // Flush pending scratch saves when the page is hidden or closed.
  useEffect(() => {
    const flush = () => {
      for (const [qid, t] of scratchTimers.current) {
        window.clearTimeout(t);
        const text = scratch[qid]?.text ?? '';
        navigator.sendBeacon?.(`/api/scratch/${qid}`, new Blob([JSON.stringify({ text })], { type: 'application/json' }));
      }
      scratchTimers.current.clear();
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, [scratch]);

  if (error) {
    return (
      <div className="fatal">
        <h1>Could not load the study content</h1>
        <p>{error}</p>
        <p>
          Make sure the server is running (<code>npm start</code> in <code>study-app/</code>) and that <code>study-content/</code> sits next to{' '}
          <code>study-app/</code>.
        </p>
      </div>
    );
  }
  if (!value) return <div className="loading">Loading course content…</div>;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
