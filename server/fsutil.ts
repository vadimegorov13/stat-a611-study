import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function sha256(text: string | Buffer): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * Write a file atomically: write a temp file in the same directory, fsync it, then rename over the target.
 * A reader (or an external editor) never sees a half-written file.
 */
export function atomicWriteSync(file: string, data: string): void {
  const dir = path.dirname(file);
  ensureDir(dir);
  const tmp = path.join(dir, `.${path.basename(file)}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`);
  const fd = fs.openSync(tmp, 'w');
  try {
    fs.writeSync(fd, data);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, file);
}

/** Resolve `rel` inside `root`, refusing anything that escapes it. */
export function safeJoin(root: string, rel: string): string {
  const resolved = path.resolve(root, rel);
  const rootResolved = path.resolve(root);
  if (resolved !== rootResolved && !resolved.startsWith(rootResolved + path.sep)) {
    throw new Error(`Path escapes allowed directory: ${rel}`);
  }
  return resolved;
}

export function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

export function timestampId(d = new Date()): string {
  return d.toISOString().replace(/[-:]/g, '').replace('.', '');
}
