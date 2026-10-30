import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../server/app.ts';

const appRoot = path.resolve(__dirname, '../..');
const courseRoot = path.join(appRoot, 'course');
let server: http.Server;
let base: string;
let close: () => void;
let userDataDir: string;

beforeAll(async () => {
  userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'study-app-test-'));
  const made = createApp({ appRoot, courseRoot, contentDir: path.join(courseRoot, 'study-content'), userDataDir, serveStatic: false, pollMs: 200 });
  close = made.close;
  server = made.app.listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => {
  close();
  server.close();
  fs.rmSync(userDataDir, { recursive: true, force: true });
});

const j = (p: string, init?: RequestInit) => fetch(base + p, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });

describe('content API', () => {
  it('serves all 20 lessons and the merged question bank with no content problems', async () => {
    const health = await (await j('/api/health')).json();
    expect(health.contentProblems).toEqual([]);
    const course = await (await j('/api/course')).json();
    expect(course.lessons).toHaveLength(20);
    expect(course.questions.filter((q: any) => q.bank === 'pack')).toHaveLength(60);
    expect(course.questions.length).toBe(120);
    expect(course.sources).toHaveLength(15);
  });
  it('serves source text for all 123 pages', async () => {
    const pages = await (await j('/api/source-text')).json();
    expect(pages).toHaveLength(123);
  });
  it('serves manifest PDFs only', async () => {
    const r = await fetch(`${base}/api/sources/lecture-09-28/pdf`);
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toBe('application/pdf');
    expect((await fetch(`${base}/api/sources/..%2F..%2Fetc%2Fpasswd/pdf`)).status).toBe(404);
  });
});

describe('security', () => {
  it('rejects foreign Host headers', async () => {
    const status = await new Promise<number>((resolve) => {
      const u = new URL(base);
      http.get({ host: u.hostname, port: u.port, path: '/api/health', headers: { Host: 'evil.example' } }, (res) => resolve(res.statusCode!));
    });
    expect(status).toBe(403);
  });
  it('rejects cross-origin writes', async () => {
    const r = await j('/api/notes', { method: 'POST', body: '{}', headers: { Origin: 'https://evil.example' } });
    expect(r.status).toBe(403);
  });
});

describe('notes and progress API', () => {
  it('creates, conflicts, and restores notes over HTTP', async () => {
    const n = await (await j('/api/notes', { method: 'POST', body: JSON.stringify({ title: 'HTTP note', body: 'a' }) })).json();
    const u = await (await j(`/api/notes/${n.id}`, { method: 'PUT', body: JSON.stringify({ baseVersion: n.version, body: 'b' }) })).json();
    expect(u.body).toBe('b');
    const stale = await j(`/api/notes/${n.id}`, { method: 'PUT', body: JSON.stringify({ baseVersion: n.version, body: 'c' }) });
    expect(stale.status).toBe(409);
    expect((await stale.json()).current.body).toBe('b');
    const revs = await (await j(`/api/notes/${n.id}/revisions`)).json();
    expect(revs.length).toBeGreaterThanOrEqual(2);
    expect((await j('/api/notes/..%2Fprogress')).status).toBe(404);
  });
  it('records attempts with first-attempt flags and persists them to disk', async () => {
    const a1 = await (await j('/api/progress/attempts', { method: 'POST', body: JSON.stringify({ questionId: 'q08-02', mode: 'single', response: '0.14', correct: true, hintsUsed: 0, revealedBeforeSubmit: false }) })).json();
    const a2 = await (await j('/api/progress/attempts', { method: 'POST', body: JSON.stringify({ questionId: 'q08-02', mode: 'single', response: '0.2', correct: false, hintsUsed: 1, revealedBeforeSubmit: false }) })).json();
    expect(a1.firstAttempt).toBe(true);
    expect(a2.firstAttempt).toBe(false);
    const disk = JSON.parse(fs.readFileSync(path.join(userDataDir, 'progress.json'), 'utf8'));
    expect(disk.attempts.map((a: any) => a.id)).toEqual([a1.id, a2.id]);
  });
  it('requires typed confirmation to reset, backs up first, and never touches notes', async () => {
    const before = fs.readdirSync(path.join(userDataDir, 'notes'));
    expect((await j('/api/progress/reset', { method: 'POST', body: JSON.stringify({ parts: { attempts: true } }) })).status).toBe(500);
    const r = await (await j('/api/progress/reset', { method: 'POST', body: JSON.stringify({ parts: { attempts: true }, confirm: 'RESET PROGRESS' }) })).json();
    expect(r.progress.attempts).toEqual([]);
    expect(fs.existsSync(path.join(r.backup, 'progress.json'))).toBe(true);
    expect(fs.readdirSync(path.join(r.backup, 'notes')).length).toBe(before.length);
    expect(fs.readdirSync(path.join(userDataDir, 'notes'))).toEqual(before);
  });
});
