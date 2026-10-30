// Progress, flags, exam checklist, and scratch work, stored as JSON in user-data/.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Attempt, ExamSettings, Progress, ScratchStore } from '../shared/types.ts';
import { atomicWriteSync, timestampId, ensureDir } from './fsutil.ts';

export function emptyProgress(): Progress {
  return {
    schema: 1,
    attempts: [],
    flags: {},
    studied: {},
    visits: {},
    examChecklist: {},
    saved: {},
    examSettings: { topics: [], questionCount: 15, timed: false, minutes: 45, includeTypes: ['multiple_choice', 'numeric', 'free_response'] },
  };
}

export class ProgressStore {
  readonly progressFile: string;
  readonly scratchFile: string;
  progress: Progress;
  scratch: ScratchStore;

  constructor(userDataDir: string) {
    ensureDir(userDataDir);
    this.progressFile = path.join(userDataDir, 'progress.json');
    this.scratchFile = path.join(userDataDir, 'scratch.json');
    this.progress = { ...emptyProgress(), ...this.loadSafely<Partial<Progress>>(this.progressFile, {}) } as Progress;
    this.scratch = this.loadSafely<ScratchStore>(this.scratchFile, {});
  }

  /** Read a JSON file; if it is unreadable, move it aside instead of letting the next save overwrite it. */
  private loadSafely<T>(file: string, fallback: T): T {
    if (!fs.existsSync(file)) return fallback;
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
    } catch {
      const aside = file.replace(/\.json$/, `.corrupt-${timestampId()}.json`);
      fs.renameSync(file, aside);
      console.warn(`Could not parse ${file}; moved it to ${aside} and started fresh.`);
      return fallback;
    }
  }

  private saveProgress(): void {
    atomicWriteSync(this.progressFile, JSON.stringify(this.progress, null, 2));
  }

  private saveScratch(): void {
    atomicWriteSync(this.scratchFile, JSON.stringify(this.scratch, null, 2));
  }

  addAttempt(a: Omit<Attempt, 'id' | 'at' | 'firstAttempt'> & { at?: string }): Attempt {
    const firstAttempt = !this.progress.attempts.some((x) => x.questionId === a.questionId);
    const attempt: Attempt = {
      ...a,
      id: crypto.randomBytes(6).toString('hex'),
      at: a.at ?? new Date().toISOString(),
      firstAttempt,
    };
    this.progress.attempts.push(attempt);
    this.saveProgress();
    return attempt;
  }

  /** Free-response attempts are recorded first, then completed by self-assessment. */
  updateAttempt(id: string, patch: Pick<Attempt, 'correct' | 'rubricMet' | 'rubricTotal'>): Attempt | null {
    const a = this.progress.attempts.find((x) => x.id === id);
    if (!a) return null;
    Object.assign(a, patch);
    this.saveProgress();
    return a;
  }

  setFlag(questionId: string, flagged: boolean, reason?: string): void {
    if (flagged) this.progress.flags[questionId] = { at: new Date().toISOString(), reason };
    else delete this.progress.flags[questionId];
    this.saveProgress();
  }

  setStudied(lessonId: string, studied: boolean): void {
    if (studied) this.progress.studied[lessonId] = { at: new Date().toISOString() };
    else delete this.progress.studied[lessonId];
    this.saveProgress();
  }

  visit(lessonId: string): void {
    const now = new Date().toISOString();
    const v = this.progress.visits[lessonId];
    this.progress.visits[lessonId] = v ? { ...v, last: now, count: v.count + 1 } : { first: now, last: now, count: 1 };
    this.saveProgress();
  }

  setExam(checklist: Record<string, boolean> | undefined, settings: ExamSettings | undefined): void {
    if (checklist) this.progress.examChecklist = checklist;
    if (settings) this.progress.examSettings = settings;
    this.saveProgress();
  }

  setSaved(itemId: string, saved: boolean): void {
    if (saved) this.progress.saved[itemId] = { at: new Date().toISOString() };
    else delete this.progress.saved[itemId];
    this.saveProgress();
  }

  setPosition(route: string): void {
    this.progress.lastPosition = { route, at: new Date().toISOString() };
    this.saveProgress();
  }

  setScratch(questionId: string, text: string): void {
    if (text) this.scratch[questionId] = { text, updated: new Date().toISOString() };
    else delete this.scratch[questionId];
    this.saveScratch();
  }

  /** Reset selected progress categories. Notes are never touched here. Returns the backup folder used. */
  reset(parts: { attempts?: boolean; flags?: boolean; saved?: boolean; studied?: boolean; scratch?: boolean; exam?: boolean }, backupDir: string): void {
    ensureDir(backupDir);
    if (fs.existsSync(this.progressFile)) fs.copyFileSync(this.progressFile, path.join(backupDir, 'progress.json'));
    if (fs.existsSync(this.scratchFile)) fs.copyFileSync(this.scratchFile, path.join(backupDir, 'scratch.json'));
    const fresh = emptyProgress();
    if (parts.attempts) {
      this.progress.attempts = [];
      this.progress.visits = {};
    }
    if (parts.flags) this.progress.flags = {};
    if (parts.saved) this.progress.saved = {};
    if (parts.studied) this.progress.studied = {};
    if (parts.exam) {
      this.progress.examChecklist = fresh.examChecklist;
      this.progress.examSettings = fresh.examSettings;
    }
    this.saveProgress();
    if (parts.scratch) {
      this.scratch = {};
      this.saveScratch();
    }
  }
}

/** Copy notes, revisions, progress, and scratch work into user-data/backups/<timestamp>/. */
export function createBackup(userDataDir: string, label = 'manual'): string {
  const dest = path.join(userDataDir, 'backups', `${timestampId()}-${label}`);
  ensureDir(dest);
  for (const name of ['notes', 'note-revisions']) {
    const src = path.join(userDataDir, name);
    if (fs.existsSync(src)) fs.cpSync(src, path.join(dest, name), { recursive: true });
  }
  for (const name of ['progress.json', 'scratch.json']) {
    const src = path.join(userDataDir, name);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dest, name));
  }
  return dest;
}

export function listBackups(userDataDir: string): { name: string; path: string }[] {
  const dir = path.join(userDataDir, 'backups');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => fs.statSync(path.join(dir, f)).isDirectory())
    .sort()
    .reverse()
    .map((name) => ({ name, path: path.join(dir, name) }));
}
