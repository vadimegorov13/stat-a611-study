import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { loadCourse, loadSourcePages } from './content.ts';
import { NoteStore, ConflictError, NotFoundError } from './notes.ts';
import { ProgressStore, createBackup, listBackups } from './progress.ts';
import type { NoteChangeEvent } from '../shared/types.ts';

export interface AppOptions {
  appRoot: string;
  courseRoot: string;
  contentDir: string;
  userDataDir: string;
  serveStatic: boolean;
  pollMs?: number;
}

export function createApp(opts: AppOptions) {
  const notes = new NoteStore(opts.userDataDir);
  const progress = new ProgressStore(opts.userDataDir);
  const loaded = loadCourse(
    { courseRoot: opts.courseRoot, contentDir: opts.contentDir, supplementDir: path.join(opts.appRoot, 'content') },
    { notesDir: notes.notesDir, userDataDir: opts.userDataDir },
  );
  const course = loaded.bundle;
  const sourcePages = loadSourcePages(opts.contentDir, course.sources);
  if (loaded.problems.length) console.warn(`Content problems:\n  ${loaded.problems.join('\n  ')}`);

  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '5mb' }));

  // Only localhost may talk to this server: reject foreign Host headers (DNS rebinding) and cross-site writes.
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;
  app.use((req: Request, res: Response, next: NextFunction) => {
    const host = req.headers.host ?? '';
    if (!LOCAL.test(host)) return res.status(403).json({ error: 'Host not allowed' });
    const origin = req.headers.origin;
    if (req.method !== 'GET' && req.method !== 'HEAD' && origin) {
      try {
        if (!LOCAL.test(new URL(origin).host)) return res.status(403).json({ error: 'Cross-origin request refused' });
      } catch {
        return res.status(403).json({ error: 'Bad origin' });
      }
    }
    next();
  });

  // ---------- content ----------
  app.get('/api/health', (_req, res) =>
    res.json({ ok: true, lessons: course.lessons.length, questions: course.questions.length, contentProblems: loaded.problems }),
  );
  app.get('/api/course', (_req, res) => res.json(course));
  app.get('/api/source-text', (_req, res) => res.json(sourcePages));

  const sourceById = new Map(course.sources.map((s) => [s.id, s]));
  app.get('/api/sources/:id/pdf', (req, res) => {
    const s = sourceById.get(req.params.id);
    if (!s) return res.status(404).json({ error: 'Unknown source' });
    // Only manifest-listed PDFs are served; the path comes from the manifest, never from the request.
    const file = path.resolve(opts.courseRoot, s.path);
    if (!file.startsWith(path.resolve(opts.courseRoot) + path.sep) || !fs.existsSync(file)) {
      return res.status(404).json({ error: 'PDF not found' });
    }
    res.type('application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(file)}"`);
    fs.createReadStream(file).pipe(res);
  });

  // Checks whether an external page allows framing. Requires internet; returns null when unknown.
  app.get('/api/embed-check', async (req, res) => {
    const url = String(req.query.url ?? '');
    if (!/^https:\/\//.test(url)) return res.json({ embeddable: false, reason: 'Only https pages can be embedded.' });
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const r = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctrl.signal });
      clearTimeout(t);
      const xfo = (r.headers.get('x-frame-options') ?? '').toLowerCase();
      const csp = (r.headers.get('content-security-policy') ?? '').toLowerCase();
      const fa = /frame-ancestors([^;]*)/.exec(csp)?.[1]?.trim() ?? '';
      if (xfo.includes('deny') || xfo.includes('sameorigin')) return res.json({ embeddable: false, reason: `X-Frame-Options: ${xfo}` });
      if (fa && !fa.includes('*')) return res.json({ embeddable: false, reason: `CSP frame-ancestors ${fa}` });
      if (!r.ok) return res.json({ embeddable: false, reason: `HTTP ${r.status}` });
      return res.json({ embeddable: true, reason: 'No framing restrictions detected.' });
    } catch (e) {
      return res.json({ embeddable: null, reason: `Could not reach the site (${(e as Error).name}). You may be offline.` });
    }
  });

  // ---------- notes ----------
  const sseClients = new Set<Response>();
  notes.on('change', (ev: NoteChangeEvent) => {
    const data = `event: note\ndata: ${JSON.stringify(ev)}\n\n`;
    for (const c of sseClients) c.write(data);
  });
  app.get('/api/events', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write('retry: 2000\n\n');
    sseClients.add(res);
    const ping = setInterval(() => res.write(': ping\n\n'), 20000);
    req.on('close', () => {
      clearInterval(ping);
      sseClients.delete(res);
    });
  });

  const handle =
    (fn: (req: Request, res: Response) => unknown) =>
    (req: Request, res: Response) => {
      try {
        const out = fn(req, res);
        if (out !== undefined && !res.headersSent) res.json(out);
      } catch (e) {
        if (e instanceof ConflictError) return res.status(409).json({ error: e.message, current: e.current });
        if (e instanceof NotFoundError) return res.status(404).json({ error: e.message });
        console.error(e);
        res.status(500).json({ error: (e as Error).message });
      }
    };

  app.get('/api/notes', handle(() => notes.list()));
  app.get('/api/notes/find', handle((req) => notes.find(String(req.query.q ?? ''))));
  app.post('/api/notes', handle((req) => notes.create(req.body ?? {})));
  app.get('/api/notes/:id', handle((req) => notes.get(req.params.id)));
  app.put(
    '/api/notes/:id',
    handle((req) => {
      const b = req.body ?? {};
      if (typeof b.baseVersion !== 'string') throw new Error('baseVersion is required');
      return notes.update(req.params.id, b);
    }),
  );
  app.delete(
    '/api/notes/:id',
    handle((req) => {
      notes.delete(req.params.id, typeof req.query.baseVersion === 'string' ? req.query.baseVersion : undefined);
      return { ok: true };
    }),
  );
  app.get('/api/notes/:id/revisions', handle((req) => notes.revisions(req.params.id)));
  app.get('/api/notes/:id/revisions/:rev', handle((req) => notes.revision(req.params.id, req.params.rev)));
  app.post(
    '/api/notes/:id/draft-revision',
    handle((req) => {
      const b = req.body ?? {};
      notes.saveDraftRevision(req.params.id, {
        title: String(b.title ?? 'Untitled note'),
        body: String(b.body ?? ''),
        topics: Array.isArray(b.topics) ? b.topics.map(String) : [],
        tags: Array.isArray(b.tags) ? b.tags.map(String) : [],
      });
      return { ok: true };
    }),
  );
  app.post('/api/notes/:id/restore', handle((req) => notes.restore(req.params.id, String(req.body?.rev), String(req.body?.baseVersion))));

  // ---------- progress ----------
  app.get('/api/progress', handle(() => progress.progress));
  app.post('/api/progress/attempts', handle((req) => progress.addAttempt(req.body)));
  app.patch(
    '/api/progress/attempts/:id',
    handle((req) => {
      const a = progress.updateAttempt(req.params.id, req.body);
      if (!a) throw new NotFoundError('No such attempt');
      return a;
    }),
  );
  app.put('/api/progress/flags/:qid', handle((req) => (progress.setFlag(req.params.qid, !!req.body?.flagged, req.body?.reason), progress.progress)));
  app.put('/api/progress/saved/:item', handle((req) => (progress.setSaved(req.params.item, !!req.body?.saved), progress.progress)));
  app.put('/api/progress/studied/:lid', handle((req) => (progress.setStudied(req.params.lid, !!req.body?.studied), progress.progress)));
  app.post('/api/progress/visit/:lid', handle((req) => (progress.visit(req.params.lid), { ok: true })));
  app.put('/api/progress/exam', handle((req) => (progress.setExam(req.body?.examChecklist, req.body?.examSettings), progress.progress)));
  app.put('/api/progress/position', handle((req) => (progress.setPosition(String(req.body?.route ?? '')), { ok: true })));
  app.post(
    '/api/progress/reset',
    handle((req) => {
      if (req.body?.confirm !== 'RESET PROGRESS') throw new Error('Type RESET PROGRESS to confirm.');
      const backup = createBackup(opts.userDataDir, 'before-reset');
      progress.reset(req.body?.parts ?? {}, backup);
      return { ok: true, backup, progress: progress.progress };
    }),
  );

  app.get('/api/scratch', handle(() => progress.scratch));
  const saveScratch = handle((req) => (progress.setScratch(req.params.qid, String(req.body?.text ?? '')), { ok: true }));
  app.put('/api/scratch/:qid', saveScratch);
  app.post('/api/scratch/:qid', saveScratch); // navigator.sendBeacon on page close can only POST

  // ---------- backup / export ----------
  app.post('/api/backup', handle(() => ({ path: createBackup(opts.userDataDir, 'manual') })));
  app.get('/api/backups', handle(() => listBackups(opts.userDataDir)));
  app.get('/api/export', (_req, res) => {
    const payload = {
      exportedAt: new Date().toISOString(),
      note: 'Personal notes and progress from the STAT A611 study app. Note files are reproduced verbatim.',
      notes: notes.list().map((n) => ({ id: n.id, file: n.file, content: fs.readFileSync(n.absPath, 'utf8') })),
      progress: progress.progress,
      scratch: progress.scratch,
    };
    res.setHeader('Content-Disposition', `attachment; filename="stat-a611-study-export-${new Date().toISOString().slice(0, 10)}.json"`);
    res.json(payload);
  });

  // ---------- static frontend ----------
  if (opts.serveStatic) {
    const dist = path.join(opts.appRoot, 'dist');
    app.use(express.static(dist, { index: false }));
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      const index = path.join(dist, 'index.html');
      if (fs.existsSync(index)) res.sendFile(index);
      else res.status(503).send('Frontend not built. Run "npm start" (builds, then serves).');
    });
  }
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API route' }));

  notes.startWatching(opts.pollMs);
  return { app, notes, progress, course, problems: loaded.problems, close: () => notes.stopWatching() };
}
