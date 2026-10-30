import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NoteStore, ConflictError, NotFoundError } from '../../server/notes.ts';
import { parseNote, serializeNote } from '../../shared/noteFormat.ts';
import { sha256, safeJoin } from '../../server/fsutil.ts';
import type { NoteChangeEvent } from '../../shared/types.ts';

let dir: string;
let store: NoteStore;
const events: NoteChangeEvent[] = [];

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'notes-test-'));
  store = new NoteStore(dir);
  events.length = 0;
  store.on('change', (e) => events.push(e));
});
afterEach(() => {
  store.stopWatching();
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('note format', () => {
  it('round-trips frontmatter and body, preserving unknown keys', () => {
    const text = serializeNote(
      { id: 'n-20261022-x-abcd', title: 'T: colon', topics: ['09-binomial'], tags: ['a', 'b'], created: '2026-10-22T00:00:00.000Z', updated: '2026-10-22T00:00:00.000Z' },
      'Body $x^2$\n',
      { summary: 'added by an assistant' },
    );
    const p = parseNote(text, 'n-20261022-x-abcd');
    expect(p.front.title).toBe('T: colon');
    expect(p.front.topics).toEqual(['09-binomial']);
    expect(p.body).toBe('Body $x^2$\n');
    expect(p.extra).toEqual({ summary: 'added by an assistant' });
    expect(serializeNote(p.front, p.body, p.extra)).toBe(text);
  });
  it('tolerates a missing or broken frontmatter block', () => {
    expect(parseNote('just text', 'n-x-1234').warning).toMatch(/No frontmatter/);
    const broken = parseNote('---\ntitle: [unclosed\n---\nbody', 'n-x-1234');
    expect(broken.warning).toMatch(/could not be parsed/);
    expect(broken.body).toBe('body');
  });
});

describe('NoteStore', () => {
  it('creates a Markdown file with a stable id and frontmatter', () => {
    const n = store.create({ title: 'Binomial questions', topics: ['09-binomial'], body: 'hello' });
    expect(n.id).toMatch(/^n-\d{8}-binomial-questions-[0-9a-f]{4}$/);
    const text = fs.readFileSync(path.join(dir, 'notes', `${n.id}.md`), 'utf8');
    expect(text).toContain(`id: ${n.id}`);
    expect(text).toContain('title: Binomial questions');
    expect(text.trimEnd().endsWith('hello')).toBe(true);
  });

  it('renames by changing the title only; the file name and id stay the same', () => {
    const n = store.create({ title: 'Old' });
    const u = store.update(n.id, { baseVersion: n.version, title: 'New title' });
    expect(u.id).toBe(n.id);
    expect(u.file).toBe(`${n.id}.md`);
    expect(u.title).toBe('New title');
  });

  it('refuses a stale save and keeps the rejected draft as a revision', () => {
    const n = store.create({ title: 'A', body: 'one' });
    const u = store.update(n.id, { baseVersion: n.version, body: 'two' });
    expect(() => store.update(n.id, { baseVersion: n.version, body: 'stale' })).toThrow(ConflictError);
    expect(fs.readFileSync(u.absPath, 'utf8')).toContain('two');
    const revs = store.revisions(n.id);
    expect(revs[0].origin).toBe('conflict-draft');
    expect(store.revision(n.id, revs[0].rev).body).toContain('stale');
  });

  it('detects an external edit, records it as a revision, and emits an external event', () => {
    const n = store.create({ title: 'A', body: 'original' });
    const text = fs.readFileSync(n.absPath, 'utf8').replace('original', 'edited elsewhere');
    fs.writeFileSync(n.absPath, text);
    const changed = store.scan(true);
    expect(changed).toEqual([n.id]);
    const ev = events.find((e) => e.type === 'note-changed');
    expect(ev).toMatchObject({ id: n.id, origin: 'external', previousVersion: n.version, version: sha256(text) });
    const revs = store.revisions(n.id);
    expect(revs[0].origin).toBe('external');
    expect(store.revision(n.id, revs[1].rev).body).toContain('original');
    // A save based on the old version must now conflict instead of overwriting.
    expect(() => store.update(n.id, { baseVersion: n.version, body: 'old autosave' })).toThrow(ConflictError);
    expect(fs.readFileSync(n.absPath, 'utf8')).toContain('edited elsewhere');
  });

  it('does not report its own writes as external', () => {
    const n = store.create({ title: 'A' });
    store.update(n.id, { baseVersion: n.version, body: 'mine' });
    events.length = 0;
    expect(store.scan(true)).toEqual([]);
    expect(events).toEqual([]);
  });

  it('restores an earlier revision without losing the current text', () => {
    const n = store.create({ title: 'A', body: 'v1' });
    const firstRev = store.revisions(n.id)[0].rev;
    const u = store.update(n.id, { baseVersion: n.version, body: 'v2' });
    const r = store.restore(n.id, firstRev, u.version);
    expect(r.body).toBe('v1');
    const bodies = store.revisions(n.id).map((x) => store.revision(n.id, x.rev).body);
    expect(bodies).toContain('v2');
    expect(store.revisions(n.id)[0].origin).toBe('restore');
  });

  it('moves deleted notes to trash and keeps history', () => {
    const n = store.create({ title: 'Gone', body: 'keep me' });
    store.delete(n.id, n.version);
    expect(fs.existsSync(n.absPath)).toBe(false);
    const trash = fs.readdirSync(path.join(dir, 'trash'));
    expect(trash.some((f) => f.startsWith(n.id))).toBe(true);
    expect(store.revisions(n.id)[0].origin).toBe('pre-delete');
  });

  it('rejects ids that could escape the notes directory', () => {
    expect(() => store.get('../progress')).toThrow(NotFoundError);
    expect(() => store.get('n-../../etc')).toThrow(NotFoundError);
    expect(() => safeJoin(dir, '../x')).toThrow();
  });

  it('writes atomically (no temp files left behind)', () => {
    const n = store.create({ title: 'A' });
    for (let i = 0; i < 5; i++) store.update(n.id, { baseVersion: store.get(n.id).version, body: `v${i}` });
    expect(fs.readdirSync(path.join(dir, 'notes')).filter((f) => f.endsWith('.tmp'))).toEqual([]);
  });

  it('finds notes by id or title', () => {
    const n = store.create({ title: 'Poisson process doubts' });
    expect(store.find('poisson').map((x) => x.id)).toEqual([n.id]);
    expect(store.find(n.id).map((x) => x.id)).toEqual([n.id]);
  });
});
