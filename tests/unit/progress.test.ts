import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ProgressStore } from '../../server/progress.ts';

describe('ProgressStore', () => {
  it('moves an unreadable progress file aside instead of overwriting it', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'progress-test-'));
    fs.writeFileSync(path.join(dir, 'progress.json'), '{ not json');
    const store = new ProgressStore(dir);
    store.setStudied('01-data', true);
    const aside = fs.readdirSync(dir).find((f) => f.startsWith('progress.corrupt-'));
    expect(aside).toBeTruthy();
    expect(fs.readFileSync(path.join(dir, aside!), 'utf8')).toBe('{ not json');
    expect(JSON.parse(fs.readFileSync(path.join(dir, 'progress.json'), 'utf8')).studied['01-data']).toBeTruthy();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('marks only the first attempt on a question as firstAttempt', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'progress-test-'));
    const store = new ProgressStore(dir);
    const base = { mode: 'single' as const, response: '1', correct: true, hintsUsed: 0, revealedBeforeSubmit: false };
    expect(store.addAttempt({ ...base, questionId: 'q01-02' }).firstAttempt).toBe(true);
    expect(store.addAttempt({ ...base, questionId: 'q01-02' }).firstAttempt).toBe(false);
    expect(new ProgressStore(dir).progress.attempts).toHaveLength(2);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
