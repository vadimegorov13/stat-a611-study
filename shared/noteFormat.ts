// Markdown-with-frontmatter format for personal notes.
// The file on disk is the source of truth; this module only parses and serializes it.
import YAML from 'yaml';

export interface NoteFrontmatter {
  id: string;
  title: string;
  topics: string[];
  tags: string[];
  created: string;
  updated: string;
}

export interface ParsedNote {
  front: NoteFrontmatter;
  body: string;
  /** Frontmatter keys this app does not manage; preserved on save. */
  extra: Record<string, unknown>;
  warning?: string;
}

const KNOWN_KEYS = new Set(['id', 'title', 'topics', 'tags', 'created', 'updated']);

const FRONT_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export const NOTE_ID_RE = /^n-[a-z0-9-]{4,80}$/;

function asStringList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map((x) => x.trim()).filter(Boolean);
  return [];
}

/** Parse a note file. `fallbackId` comes from the filename and wins if frontmatter lacks an ID. */
export function parseNote(text: string, fallbackId: string): ParsedNote {
  const m = FRONT_RE.exec(text);
  let data: Record<string, unknown> = {};
  let warning: string | undefined;
  let body = text;
  if (m) {
    // serializeNote writes one blank line after the closing fence; drop it so round trips are stable.
    body = text.slice(m[0].length).replace(/^\r?\n/, '');
    try {
      const parsed = YAML.parse(m[1]);
      if (parsed && typeof parsed === 'object') data = parsed as Record<string, unknown>;
      else warning = 'Frontmatter is not a key/value block.';
    } catch (e) {
      warning = `Frontmatter could not be parsed: ${(e as Error).message.split('\n')[0]}`;
    }
  } else {
    warning = 'No frontmatter found; using the filename as the note ID.';
  }
  const fmId = typeof data.id === 'string' ? data.id : undefined;
  if (fmId && fmId !== fallbackId) {
    warning = `Frontmatter id "${fmId}" differs from filename id "${fallbackId}"; the filename id is used.`;
  }
  const now = new Date().toISOString();
  const front: NoteFrontmatter = {
    id: fallbackId,
    title: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : 'Untitled note',
    topics: asStringList(data.topics),
    tags: asStringList(data.tags),
    created: data.created ? String(data.created) : now,
    updated: data.updated ? String(data.updated) : now,
  };
  const extra: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) if (!KNOWN_KEYS.has(k)) extra[k] = v;
  return { front, body, extra, warning };
}

export function serializeNote(front: NoteFrontmatter, body: string, extra: Record<string, unknown> = {}): string {
  const yaml = YAML.stringify(
    {
      id: front.id,
      title: front.title,
      topics: front.topics,
      tags: front.tags,
      created: front.created,
      updated: front.updated,
      ...extra,
    },
    { lineWidth: 0 },
  );
  const cleanBody = body.replace(/^\r?\n/, '');
  return `---\n${yaml}---\n\n${cleanBody}`;
}

export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40)
      .replace(/-$/, '') || 'note'
  );
}
