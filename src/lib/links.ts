// Resolve hrefs found in authored Markdown (lessons, pack docs) and personal notes into app Targets.
import type { CourseBundle } from '../../shared/types.ts';
import { VIZ_TOOLS, type RefTab, type Target } from './targets.ts';

/** Normalize a POSIX-style path, keeping leading "../" segments. */
function normalize(p: string): string {
  const out: string[] = [];
  for (const seg of p.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..' && out.length && out[out.length - 1] !== '..') out.pop();
    else out.push(seg);
  }
  return out.join('/');
}

function dirname(p: string): string {
  const i = p.lastIndexOf('/');
  return i < 0 ? '' : p.slice(0, i);
}

/**
 * @param href   link target as written
 * @param base   path of the containing document relative to study-content/ (e.g. "lessons/03-boxplots.md");
 *               empty for personal notes
 */
export function resolveHref(href: string, base: string, course: CourseBundle): Target | null {
  if (!href) return null;
  if (/^https?:\/\//i.test(href)) {
    return { kind: 'web', url: href, label: 'link' };
  }
  if (href.startsWith('study://')) return parseStudyUrl(href);
  if (href.startsWith('#')) return null;

  const [pathPart, frag = ''] = href.split('#');
  const rel = normalize(`${dirname(base)}/${decodeURIComponent(pathPart)}`);

  const lesson = course.lessons.find((l) => normalize(l.path) === rel);
  if (lesson) return { kind: 'lesson', id: lesson.id };

  const doc = course.docs.find((d) => normalize(d.path) === rel);
  if (doc) return { kind: 'doc', id: doc.id };

  // PDFs are referenced relative to study-content/, e.g. ../Notes/X.pdf; the manifest stores Notes/X.pdf.
  if (rel.toLowerCase().endsWith('.pdf')) {
    const fromRoot = rel.replace(/^\.\.\//, '');
    const src = course.sources.find((s) => s.path === fromRoot);
    if (src) {
      const page = Number(/page=(\d+)/.exec(frag)?.[1] ?? 1);
      return { kind: 'pdf', sourceId: src.id, page };
    }
  }
  if (/STUDY-GUIDE\.md$/.test(rel)) return { kind: 'home' };
  if (/PRACTICE-WORKBOOK\.md$/.test(rel)) return { kind: 'practice', mode: 'mixed' };
  return null;
}

/**
 * Personal notes link to course content with readable study:// URLs:
 *   study://lesson/09-binomial   study://question/q09-02   study://source/lecture-09-23/4
 *   study://note/<note-id>       study://doc/formula-reference   study://glossary/variance
 */
export function parseStudyUrl(href: string): Target | null {
  const parts = href.replace(/^study:\/\//, '').split('/').map(decodeURIComponent);
  const [kind, a, b] = parts;
  switch (kind) {
    case 'lesson':
      return a ? { kind: 'lesson', id: a } : null;
    case 'question':
      return a ? { kind: 'question', id: a } : null;
    case 'source':
    case 'pdf':
      return a ? { kind: 'pdf', sourceId: a, page: Math.max(1, Number(b) || 1) } : null;
    case 'note':
      return a ? { kind: 'note', id: a } : null;
    case 'doc':
      return a ? { kind: 'doc', id: a } : null;
    case 'lecture':
      return a ? { kind: 'lecture', id: a } : null;
    case 'glossary':
      return a ? { kind: 'glossary', term: a } : null;
    case 'viz':
      return { kind: 'viz', tool: VIZ_TOOLS.find((x) => x === a), opt: b };
    case 'reference': {
      const tabs: RefTab[] = ['all', 'formulas', 'notation', 'distributions', 'terms', 'saved', 'notes', 'visualize', 'tips'];
      return { kind: 'reference', tab: tabs.find((x) => x === a) ?? 'all' };
    }
    case 'practice': {
      const mode = (['topic', 'mixed', 'exam', 'review'] as const).find((m) => m === a) ?? 'mixed';
      return { kind: 'practice', mode, lessonId: b };
    }
    case 'notes':
      return { kind: 'notes' };
    default:
      return null;
  }
}

export function studyUrl(t: Target): string | null {
  switch (t.kind) {
    case 'lesson':
      return `study://lesson/${t.id}`;
    case 'question':
      return `study://question/${t.id}`;
    case 'pdf':
      return `study://source/${t.sourceId}/${t.page}`;
    case 'note':
      return `study://note/${t.id}`;
    case 'doc':
      return `study://doc/${t.id}`;
    case 'lecture':
      return `study://lecture/${t.id}`;
    case 'glossary':
      return `study://glossary/${encodeURIComponent(t.term)}`;
    case 'viz':
      return `study://viz${t.tool ? `/${t.tool}${t.opt ? `/${t.opt}` : ''}` : ''}`;
    default:
      return null;
  }
}
