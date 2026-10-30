// A Target is anything the app can show: in the main view (via the URL hash) or in a reference-pane tab.
import type { CourseBundle, Note } from '../../shared/types.ts';

export type PracticeMode = 'topic' | 'mixed' | 'exam' | 'review';

export type VizTool = 'describe' | 'distributions' | 'scatter' | 'sampling' | 'categorical';
export const VIZ_TOOLS: VizTool[] = ['describe', 'distributions', 'scatter', 'sampling', 'categorical'];
export type RefTab = 'all' | 'formulas' | 'notation' | 'distributions' | 'terms' | 'saved' | 'notes' | 'visualize' | 'tips';

export type Target =
  | { kind: 'home' }
  | { kind: 'lesson'; id: string; anchor?: string }
  | { kind: 'lectures' }
  | { kind: 'lecture'; id: string }
  | { kind: 'practice'; mode: PracticeMode; lessonId?: string }
  | { kind: 'question'; id: string }
  | { kind: 'notes' }
  | { kind: 'note'; id: string }
  | { kind: 'progress' }
  | { kind: 'doc'; id: string }
  | { kind: 'issues' }
  | { kind: 'resources' }
  | { kind: 'reference'; tab?: RefTab }
  | { kind: 'viz'; tool?: VizTool; opt?: string }
  | { kind: 'pdf'; sourceId: string; page: number }
  | { kind: 'glossary'; term: string }
  | { kind: 'web'; url: string; title?: string; label?: 'search' | 'curated' | 'link' };

/** Targets that are whole workspaces and always open in the main view. */
export function mainOnly(t: Target): boolean {
  return t.kind === 'home' || t.kind === 'practice' || t.kind === 'progress' || t.kind === 'notes';
}

export function targetKey(t: Target): string {
  switch (t.kind) {
    case 'lesson':
    case 'lecture':
    case 'question':
    case 'note':
    case 'doc':
      return `${t.kind}:${t.id}`;
    case 'pdf':
      return `pdf:${t.sourceId}`; // one tab per PDF; the page is navigation state within it
    case 'glossary':
      return `glossary:${t.term}`;
    case 'web':
      return `web:${t.url}`;
    case 'practice':
      return `practice:${t.mode}:${t.lessonId ?? ''}`;
    case 'reference':
      return 'reference';
    case 'viz':
      return `viz:${t.tool ?? ''}`; // the option (chart or family) is navigation state within the tool
    default:
      return t.kind;
  }
}

export function toHash(t: Target): string {
  const e = encodeURIComponent;
  switch (t.kind) {
    case 'home':
      return '#/';
    case 'lesson':
      return `#/lesson/${e(t.id)}`;
    case 'lectures':
      return '#/lectures';
    case 'lecture':
      return `#/lecture/${e(t.id)}`;
    case 'practice':
      return `#/practice/${t.mode}${t.lessonId ? `/${e(t.lessonId)}` : ''}`;
    case 'question':
      return `#/question/${e(t.id)}`;
    case 'notes':
      return '#/notes';
    case 'note':
      return `#/note/${e(t.id)}`;
    case 'progress':
      return '#/progress';
    case 'doc':
      return `#/doc/${e(t.id)}`;
    case 'issues':
      return '#/issues';
    case 'resources':
      return '#/resources';
    case 'reference':
      return `#/reference${t.tab && t.tab !== 'all' ? `/${t.tab}` : ''}`;
    case 'viz':
      return `#/viz${t.tool ? `/${t.tool}${t.opt ? `/${e(t.opt)}` : ''}` : ''}`;
    case 'pdf':
      return `#/pdf/${e(t.sourceId)}/${t.page}`;
    case 'glossary':
      return `#/glossary/${e(t.term)}`;
    case 'web':
      return `#/web?url=${e(t.url)}`;
  }
}

export function fromHash(hash: string): Target {
  const h = hash.replace(/^#\/?/, '');
  const [pathPart, query = ''] = h.split('?');
  const parts = pathPart.split('/').filter(Boolean).map(decodeURIComponent);
  const [kind, a, b] = parts;
  switch (kind) {
    case 'lesson':
      return a ? { kind: 'lesson', id: a } : { kind: 'home' };
    case 'lectures':
      return { kind: 'lectures' };
    case 'lecture':
      return a ? { kind: 'lecture', id: a } : { kind: 'lectures' };
    case 'practice': {
      const mode = (['topic', 'mixed', 'exam', 'review'] as const).find((m) => m === a) ?? 'mixed';
      return { kind: 'practice', mode, lessonId: b };
    }
    case 'question':
      return a ? { kind: 'question', id: a } : { kind: 'practice', mode: 'mixed' };
    case 'notes':
      return { kind: 'notes' };
    case 'note':
      return a ? { kind: 'note', id: a } : { kind: 'notes' };
    case 'progress':
      return { kind: 'progress' };
    case 'doc':
      return a ? { kind: 'doc', id: a } : { kind: 'home' };
    case 'issues':
      return { kind: 'issues' };
    case 'resources':
      return { kind: 'resources' };
    case 'reference': {
      const tabs: RefTab[] = ['all', 'formulas', 'notation', 'distributions', 'terms', 'saved', 'notes', 'visualize', 'tips'];
      return { kind: 'reference', tab: tabs.find((x) => x === a) ?? 'all' };
    }
    case 'viz':
      return { kind: 'viz', tool: VIZ_TOOLS.find((x) => x === a), opt: b };
    case 'pdf':
      return a ? { kind: 'pdf', sourceId: a, page: Math.max(1, Number(b) || 1) } : { kind: 'lectures' };
    case 'glossary':
      return a ? { kind: 'glossary', term: a } : { kind: 'home' };
    case 'web': {
      const url = new URLSearchParams(query).get('url');
      return url ? { kind: 'web', url } : { kind: 'home' };
    }
    default:
      return { kind: 'home' };
  }
}

export function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function targetTitle(t: Target, course: CourseBundle | null, notes: Note[] = []): string {
  const lesson = (id: string) => course?.lessons.find((l) => l.id === id);
  switch (t.kind) {
    case 'home':
      return 'Home';
    case 'lesson':
      return lesson(t.id)?.title ?? t.id;
    case 'lectures':
      return 'Lectures by date';
    case 'lecture': {
      const s = course?.sources.find((x) => x.id === t.id);
      return s ? `Lecture ${formatDate(s.date)}` : t.id;
    }
    case 'practice':
      return t.mode === 'topic'
        ? `Quiz: ${t.lessonId ? (lesson(t.lessonId)?.title ?? t.lessonId) : 'choose a topic'}`
        : t.mode === 'mixed'
          ? 'Mixed practice'
          : t.mode === 'exam'
            ? 'Exam practice'
            : 'Review queue';
    case 'question':
      return `Question ${t.id}`;
    case 'notes':
      return 'Notes';
    case 'note':
      return notes.find((n) => n.id === t.id)?.title ?? 'Note';
    case 'progress':
      return 'Progress';
    case 'doc':
      return course?.docs.find((d) => d.id === t.id)?.title ?? t.id;
    case 'issues':
      return 'Source issues & review';
    case 'resources':
      return 'External resources';
    case 'reference':
      return 'Formulas, notation & notes';
    case 'viz':
      return t.tool ? `Visualize: ${VIZ_TITLES[t.tool]}` : 'Visualize';
    case 'pdf': {
      const s = course?.sources.find((x) => x.id === t.sourceId);
      return s ? `${formatDate(s.date)} PDF · p. ${t.page}` : `PDF p. ${t.page}`;
    }
    case 'glossary':
      return `Term: ${t.term}`;
    case 'web':
      return t.title ?? new URL(t.url).hostname;
  }
}

export const VIZ_TITLES: Record<VizTool, string> = {
  describe: 'Describe a dataset',
  distributions: 'Distribution explorer',
  scatter: 'Scatterplot & correlation',
  sampling: 'Sampling distribution of x̄',
  categorical: 'Bar graph & pie chart',
};
