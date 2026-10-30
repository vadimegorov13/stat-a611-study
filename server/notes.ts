// Personal notes stored as Markdown files in user-data/notes/<id>.md.
//
// Invariants:
// - The file on disk is the source of truth. The app never caches note bodies across requests.
// - Every version this app writes, and every external change it detects, is also kept as a revision in
//   user-data/note-revisions/<id>/, so the latest revision always matches what was last seen on disk.
// - Updates carry the version (content hash) they were based on. A mismatch returns a conflict instead of
//   overwriting; the rejected draft is saved as a "conflict-draft" revision so nothing is lost.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import { parseNote, serializeNote, slugify, NOTE_ID_RE } from '../shared/noteFormat.ts';
import type { Note, NoteMeta, NoteRevision, NoteChangeEvent } from '../shared/types.ts';
import { atomicWriteSync, ensureDir, sha256, timestampId } from './fsutil.ts';

const COALESCE_MS = 10 * 60 * 1000;
const MAX_REVISIONS = 300;

interface KnownState {
  version: string;
  mtimeMs: number;
  size: number;
}

export class ConflictError extends Error {
  constructor(public current: Note | null) {
    super('The note changed on disk since this draft was loaded.');
  }
}

export class NotFoundError extends Error {}

export interface NoteUpdate {
  baseVersion: string;
  title?: string;
  topics?: string[];
  tags?: string[];
  body?: string;
}

export class NoteStore extends EventEmitter {
  readonly notesDir: string;
  readonly revDir: string;
  readonly trashDir: string;
  private known = new Map<string, KnownState>();
  private watcher: fs.FSWatcher | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private scanTimer: NodeJS.Timeout | null = null;

  constructor(userDataDir: string) {
    super();
    this.notesDir = path.join(userDataDir, 'notes');
    this.revDir = path.join(userDataDir, 'note-revisions');
    this.trashDir = path.join(userDataDir, 'trash');
    ensureDir(this.notesDir);
    ensureDir(this.revDir);
    // Initial scan establishes the baseline; files changed while the app was stopped get a revision too.
    this.scan(false);
  }

  // ---------- paths ----------

  static isValidId(id: string): boolean {
    return NOTE_ID_RE.test(id);
  }

  private fileFor(id: string): string {
    if (!NoteStore.isValidId(id)) throw new NotFoundError(`Invalid note id: ${id}`);
    return path.join(this.notesDir, `${id}.md`);
  }

  private revFolder(id: string): string {
    return path.join(this.revDir, id);
  }

  // ---------- reading ----------

  private readNoteFile(id: string): Note | null {
    const file = this.fileFor(id);
    let text: string;
    let stat: fs.Stats;
    try {
      text = fs.readFileSync(file, 'utf8');
      stat = fs.statSync(file);
    } catch {
      return null;
    }
    const parsed = parseNote(text, id);
    return {
      ...parsed.front,
      body: parsed.body,
      file: path.basename(file),
      absPath: file,
      version: sha256(text),
      mtimeMs: stat.mtimeMs,
      warning: parsed.warning,
    };
  }

  list(): Note[] {
    const out: Note[] = [];
    for (const f of fs.readdirSync(this.notesDir)) {
      if (!f.endsWith('.md')) continue;
      const id = f.slice(0, -3);
      if (!NoteStore.isValidId(id)) continue;
      const n = this.readNoteFile(id);
      if (n) out.push(n);
    }
    return out.sort((a, b) => b.updated.localeCompare(a.updated));
  }

  get(id: string): Note {
    const n = this.readNoteFile(id);
    if (!n) throw new NotFoundError(`No note with id ${id}`);
    return n;
  }

  /** Locate notes for tools: exact ID, then case-insensitive title match. */
  find(query: string): NoteMeta[] {
    const q = query.trim().toLowerCase();
    return this.list().filter((n) => n.id === query || n.title.toLowerCase().includes(q));
  }

  // ---------- writing ----------

  private writeRaw(id: string, text: string, origin: NoteRevision['origin']): Note {
    const file = this.fileFor(id);
    atomicWriteSync(file, text);
    const stat = fs.statSync(file);
    const version = sha256(text);
    // Record the new state synchronously so the watcher does not mistake our own write for an external one.
    this.known.set(id, { version, mtimeMs: stat.mtimeMs, size: stat.size });
    this.addRevision(id, text, origin);
    return this.get(id);
  }

  create(input: { title?: string; topics?: string[]; tags?: string[]; body?: string }): Note {
    const now = new Date();
    const title = (input.title ?? '').trim() || 'Untitled note';
    const day = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    let id: string;
    do {
      id = `n-${day}-${slugify(title)}-${crypto.randomBytes(2).toString('hex')}`;
    } while (fs.existsSync(path.join(this.notesDir, `${id}.md`)));
    const iso = now.toISOString();
    const text = serializeNote(
      { id, title, topics: input.topics ?? [], tags: input.tags ?? [], created: iso, updated: iso },
      input.body ?? '',
    );
    const note = this.writeRaw(id, text, 'created');
    this.emitChange({ type: 'note-created', id, version: note.version, origin: 'app', at: iso });
    return note;
  }

  update(id: string, upd: NoteUpdate): Note {
    // Pick up any external edit first so it is recorded as its own revision before we compare versions.
    this.scanOne(id, true);
    const file = this.fileFor(id);
    if (!fs.existsSync(file)) throw new NotFoundError(`No note with id ${id}`);
    const text = fs.readFileSync(file, 'utf8');
    const currentVersion = sha256(text);
    const parsed = parseNote(text, id);
    const front = {
      ...parsed.front,
      title: upd.title !== undefined ? upd.title.trim() || 'Untitled note' : parsed.front.title,
      topics: upd.topics ?? parsed.front.topics,
      tags: upd.tags ?? parsed.front.tags,
    };
    const body = upd.body ?? parsed.body;
    if (upd.baseVersion !== currentVersion) {
      // Keep the rejected draft so a conflict never loses work.
      const draft = serializeNote({ ...front, updated: new Date().toISOString() }, body, parsed.extra);
      this.addRevision(id, draft, 'conflict-draft');
      throw new ConflictError(this.get(id));
    }
    const unchanged =
      front.title === parsed.front.title &&
      body === parsed.body &&
      front.topics.join('\u0000') === parsed.front.topics.join('\u0000') &&
      front.tags.join('\u0000') === parsed.front.tags.join('\u0000');
    if (unchanged) return this.get(id);
    const prev = currentVersion;
    const next = serializeNote({ ...front, updated: new Date().toISOString() }, body, parsed.extra);
    const note = this.writeRaw(id, next, 'app');
    this.emitChange({ type: 'note-changed', id, version: note.version, previousVersion: prev, origin: 'app', at: new Date().toISOString() });
    return note;
  }

  delete(id: string, baseVersion?: string): void {
    this.scanOne(id, true);
    const file = this.fileFor(id);
    if (!fs.existsSync(file)) throw new NotFoundError(`No note with id ${id}`);
    const text = fs.readFileSync(file, 'utf8');
    if (baseVersion && baseVersion !== sha256(text)) throw new ConflictError(this.get(id));
    this.addRevision(id, text, 'pre-delete');
    ensureDir(this.trashDir);
    fs.renameSync(file, path.join(this.trashDir, `${id}--deleted-${timestampId()}.md`));
    this.known.delete(id);
    this.emitChange({ type: 'note-deleted', id, origin: 'app', at: new Date().toISOString() });
  }

  /** Keep an unsaved browser draft as a revision without touching the note file (used when adopting the disk version). */
  saveDraftRevision(id: string, d: { title: string; body: string; topics: string[]; tags: string[] }): void {
    const current = this.get(id);
    const text = serializeNote(
      { id, title: d.title, topics: d.topics, tags: d.tags, created: current.created, updated: new Date().toISOString() },
      d.body,
    );
    this.addRevision(id, text, 'conflict-draft');
  }

  // ---------- revisions ----------

  private addRevision(id: string, text: string, origin: NoteRevision['origin']): void {
    const dir = this.revFolder(id);
    ensureDir(dir);
    const version = sha256(text);
    const existing = this.revisionFiles(id);
    const last = existing[existing.length - 1];
    if (last) {
      const lastInfo = parseRevName(last);
      // Skip exact duplicates of the latest revision (e.g. a restore of identical content).
      if (lastInfo && lastInfo.hash === version.slice(0, 12) && origin !== 'conflict-draft' && origin !== 'pre-restore' && origin !== 'pre-delete') return;
      // Coalesce rapid autosaves into one revision per 10-minute window.
      if (
        origin === 'app' &&
        lastInfo?.origin === 'app' &&
        Date.now() - lastInfo.time.getTime() < COALESCE_MS
      ) {
        fs.rmSync(path.join(dir, last), { force: true });
      }
    }
    const name = `${timestampId()}--${origin}--${version.slice(0, 12)}.md`;
    atomicWriteSync(path.join(dir, name), text);
    const all = this.revisionFiles(id);
    for (const old of all.slice(0, Math.max(0, all.length - MAX_REVISIONS))) fs.rmSync(path.join(dir, old), { force: true });
  }

  private revisionFiles(id: string): string[] {
    const dir = this.revFolder(id);
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.md') && !f.startsWith('.'))
      .sort();
  }

  revisions(id: string): NoteRevision[] {
    this.fileFor(id);
    const dir = this.revFolder(id);
    return this.revisionFiles(id)
      .map((f) => {
        const info = parseRevName(f);
        if (!info) return null;
        const text = fs.readFileSync(path.join(dir, f), 'utf8');
        return {
          rev: f.slice(0, -3),
          noteId: id,
          savedAt: info.time.toISOString(),
          origin: info.origin,
          version: sha256(text),
          size: text.length,
        } satisfies NoteRevision;
      })
      .filter((x): x is NoteRevision => x !== null)
      .reverse();
  }

  revision(id: string, rev: string): { meta: NoteRevision; content: string; title: string; body: string } {
    if (!/^[0-9TZ]+--[a-z-]+--[0-9a-f]{12}$/.test(rev)) throw new NotFoundError('Invalid revision id');
    const f = path.join(this.revFolder(id), `${rev}.md`);
    if (!fs.existsSync(f)) throw new NotFoundError('No such revision');
    const content = fs.readFileSync(f, 'utf8');
    const info = parseRevName(`${rev}.md`)!;
    const parsed = parseNote(content, id);
    return {
      meta: { rev, noteId: id, savedAt: info.time.toISOString(), origin: info.origin, version: sha256(content), size: content.length },
      content,
      title: parsed.front.title,
      body: parsed.body,
    };
  }

  restore(id: string, rev: string, baseVersion: string): Note {
    this.scanOne(id, true);
    const current = this.get(id);
    if (current.version !== baseVersion) throw new ConflictError(current);
    const { content } = this.revision(id, rev);
    const parsed = parseNote(content, id);
    const text = serializeNote({ ...parsed.front, id, updated: new Date().toISOString() }, parsed.body, parsed.extra);
    // The current content is already the latest revision; this labelled copy makes the restore point obvious.
    this.addRevision(id, fs.readFileSync(this.fileFor(id), 'utf8'), 'pre-restore');
    const note = this.writeRaw(id, text, 'restore');
    this.emitChange({ type: 'note-changed', id, version: note.version, previousVersion: current.version, origin: 'app', at: new Date().toISOString() });
    return note;
  }

  // ---------- change detection ----------

  startWatching(pollMs = 1500): void {
    try {
      this.watcher = fs.watch(this.notesDir, () => this.scheduleScan());
      this.watcher.on('error', () => undefined);
    } catch {
      this.watcher = null;
    }
    // Polling backs up fs.watch, which can miss events (network drives, some editors' save strategies).
    this.pollTimer = setInterval(() => this.scan(true), pollMs);
  }

  stopWatching(): void {
    this.watcher?.close();
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.scanTimer) clearTimeout(this.scanTimer);
  }

  private scheduleScan(): void {
    if (this.scanTimer) clearTimeout(this.scanTimer);
    this.scanTimer = setTimeout(() => this.scan(true), 120);
  }

  /** Compare the notes directory with the last known state. Returns ids that changed externally. */
  scan(emit: boolean): string[] {
    const changed: string[] = [];
    const seen = new Set<string>();
    let files: string[] = [];
    try {
      files = fs.readdirSync(this.notesDir);
    } catch {
      return changed;
    }
    for (const f of files) {
      if (!f.endsWith('.md')) continue;
      const id = f.slice(0, -3);
      if (!NoteStore.isValidId(id)) continue;
      seen.add(id);
      if (this.scanOne(id, emit)) changed.push(id);
    }
    for (const id of [...this.known.keys()]) {
      if (!seen.has(id)) {
        this.known.delete(id);
        if (emit) this.emitChange({ type: 'note-deleted', id, origin: 'external', at: new Date().toISOString() });
        changed.push(id);
      }
    }
    return changed;
  }

  /** Check one note against the known state; record an external revision if its content changed. */
  private scanOne(id: string, emit: boolean): boolean {
    const file = this.fileFor(id);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(file);
    } catch {
      return false;
    }
    const prev = this.known.get(id);
    if (prev && prev.mtimeMs === stat.mtimeMs && prev.size === stat.size) return false;
    let text: string;
    try {
      text = fs.readFileSync(file, 'utf8');
    } catch {
      return false;
    }
    const version = sha256(text);
    this.known.set(id, { version, mtimeMs: stat.mtimeMs, size: stat.size });
    if (prev && prev.version === version) return false;
    // Ensure the revision history ends with exactly what is now on disk.
    const revs = this.revisionFiles(id);
    const lastHash = revs.length ? parseRevName(revs[revs.length - 1])?.hash : undefined;
    if (lastHash !== version.slice(0, 12)) this.addRevision(id, text, 'external');
    if (!prev) {
      if (emit) this.emitChange({ type: 'note-created', id, version, origin: 'external', at: new Date().toISOString() });
      return emit;
    }
    if (emit) {
      this.emitChange({ type: 'note-changed', id, version, previousVersion: prev.version, origin: 'external', at: new Date().toISOString() });
    }
    return true;
  }

  private emitChange(ev: NoteChangeEvent): void {
    this.emit('change', ev);
  }
}

function parseRevName(name: string): { time: Date; origin: NoteRevision['origin']; hash: string } | null {
  const m = /^(\d{8})T(\d{2})(\d{2})(\d{2})(\d{3})Z--([a-z-]+)--([0-9a-f]{12})\.md$/.exec(name);
  if (!m) return null;
  const [, d, hh, mm, ss, ms, origin, hash] = m;
  const time = new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${hh}:${mm}:${ss}.${ms}Z`);
  return { time, origin: origin as NoteRevision['origin'], hash };
}
