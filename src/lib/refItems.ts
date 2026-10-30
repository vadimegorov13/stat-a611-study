// Every formula, symbol, distribution, and glossary term as one flat list for the quick-reference dock.
// Item ids are stable (derived from lesson ids, labels, or the TeX itself) so saved stars survive reloads.
import type { CourseBundle, DistributionSummary, NotationSymbol, SourceRef } from '../../shared/types.ts';
import type { Provenance } from '../components/Bits.tsx';
import type { Target } from './targets.ts';

export type RefKind = 'formula' | 'notation' | 'distribution' | 'term';

export interface RefItem {
  id: string;
  kind: RefKind;
  title: string;
  tex?: string;
  /** Markdown with inline math. */
  body?: string;
  lessonId?: string;
  refs?: SourceRef[];
  provenance: Provenance | 'lecture';
  /** Where the item came from, shown as a small caption. */
  from: string;
  target: Target;
  haystack: string;
  notation?: NotationSymbol;
  distribution?: DistributionSummary;
}

/** FNV-1a: short stable ids for formulas that have no label of their own. */
function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** Id of a study-guide key formula; the lesson page and the quick reference share it so a star shows in both. */
export const guideFormulaId = (lessonId: string, label: string) => `f:${lessonId}:${slug(label)}`;

const normTex = (t: string) => t.replace(/\s+/g, '').replace(/\\[,;!]/g, '');

export function buildRefItems(course: CourseBundle): RefItem[] {
  const items: RefItem[] = [];
  const seenTex = new Set<string>();
  const lessonTitle = (id: string) => course.lessons.find((l) => l.id === id)?.title ?? id;

  // 1. Study-guide key formulas (labelled, one per idea).
  for (const l of course.lessons) {
    for (const f of course.guides[l.id]?.key_formulas ?? []) {
      seenTex.add(normTex(f.tex));
      items.push({
        id: guideFormulaId(l.id, f.label),
        kind: 'formula',
        title: f.label,
        tex: f.tex,
        lessonId: l.id,
        provenance: 'supplemental',
        from: 'Study guide',
        target: { kind: 'lesson', id: l.id, anchor: 'Key formulas' },
        haystack: `${f.label} ${f.tex} ${l.title}`,
      });
    }
  }

  // 2. Display formulas in the lesson text that the guide does not already list.
  for (const l of course.lessons) {
    for (const m of l.body_markdown.matchAll(/\$\$([\s\S]+?)\$\$/g)) {
      const tex = m[1].trim();
      if (seenTex.has(normTex(tex))) continue;
      seenTex.add(normTex(tex));
      const before = l.body_markdown.slice(0, m.index).split('\n').filter((x) => x.trim() && !x.startsWith('$$')).pop() ?? '';
      const sentence = before.replace(/\$[^$]*\$/g, '…').split(/(?<=[.:])\s+/).filter(Boolean).pop() ?? '';
      items.push({
        id: `f:${l.id}:t${hash(normTex(tex))}`,
        kind: 'formula',
        title: sentence.replace(/[:.,]\s*$/, '').slice(0, 80) || l.title,
        tex,
        lessonId: l.id,
        provenance: 'pack',
        from: 'Lesson text',
        target: { kind: 'lesson', id: l.id },
        haystack: `${before} ${tex} ${l.title}`,
      });
    }
  }

  // 3. The formula reference sheet, by section.
  const ref = course.docs.find((d) => d.id === 'formula-reference');
  if (ref) {
    let section = 'Formula reference';
    for (const line of ref.markdown.split('\n')) {
      const h = /^##\s+(.+)/.exec(line);
      if (h) section = h[1].trim();
      for (const m of line.matchAll(/\$\$([\s\S]+?)\$\$/g)) {
        const tex = m[1].trim();
        if (seenTex.has(normTex(tex))) continue;
        seenTex.add(normTex(tex));
        items.push({
          id: `f:ref:t${hash(normTex(tex))}`,
          kind: 'formula',
          title: section,
          tex,
          provenance: 'pack',
          from: 'Formula reference',
          target: { kind: 'doc', id: 'formula-reference' },
          haystack: `${section} ${tex}`,
        });
      }
    }
  }

  for (const n of course.notation) {
    items.push({
      id: `n:${n.id}`,
      kind: 'notation',
      title: n.name,
      tex: n.tex,
      body: n.meaning,
      lessonId: n.lesson_id,
      refs: n.refs,
      provenance: n.origin === 'lecture' ? 'lecture' : 'pack',
      from: n.origin === 'lecture' ? 'Lecture notation' : 'Course-notes synthesis notation',
      target: { kind: 'lesson', id: n.lesson_id },
      haystack: `${n.name} ${n.tex} ${n.meaning} ${n.aliases} ${lessonTitle(n.lesson_id)}`,
      notation: n,
    });
  }

  for (const d of course.distributions) {
    items.push({
      id: `d:${d.id}`,
      kind: 'distribution',
      title: d.name,
      tex: `X\\sim ${d.notation}`,
      lessonId: d.lesson_id,
      provenance: d.supplemental ? 'supplemental' : 'pack',
      from: d.supplemental ? 'Formula reference († not developed in lectures)' : 'Formula reference',
      target: { kind: 'lesson', id: d.lesson_id },
      haystack: `${d.name} ${d.notation} ${d.pmf} ${d.type} pmf pdf mean variance distribution ${lessonTitle(d.lesson_id)}`,
      distribution: d,
    });
  }

  for (const t of course.glossary) {
    items.push({
      id: `t:${t.term}`,
      kind: 'term',
      title: t.term,
      body: t.definition,
      lessonId: t.lesson_id,
      provenance: 'pack',
      from: 'Glossary',
      target: { kind: 'glossary', term: t.term },
      haystack: `${t.term} ${t.definition} ${lessonTitle(t.lesson_id)}`,
    });
  }
  return items;
}

/** Lesson → the visualization that shows it. */
export const LESSON_VIZ: Record<string, Target[]> = {
  '01-data': [
    { kind: 'viz', tool: 'describe', opt: 'histogram' },
    { kind: 'viz', tool: 'categorical' },
  ],
  '02-summary': [{ kind: 'viz', tool: 'describe', opt: 'dotplot' }],
  '03-boxplots': [{ kind: 'viz', tool: 'describe', opt: 'boxplot' }],
  '08-geometric': [{ kind: 'viz', tool: 'distributions', opt: 'geometric' }],
  '09-binomial': [
    { kind: 'viz', tool: 'distributions', opt: 'binomial' },
    { kind: 'viz', tool: 'distributions', opt: 'negbin' },
  ],
  '10-hypergeometric': [{ kind: 'viz', tool: 'distributions', opt: 'hypergeometric' }],
  '11-poisson': [{ kind: 'viz', tool: 'distributions', opt: 'poisson' }],
  '12-continuous': [{ kind: 'viz', tool: 'distributions', opt: 'uniform' }],
  '13-gamma': [
    { kind: 'viz', tool: 'distributions', opt: 'gamma' },
    { kind: 'viz', tool: 'distributions', opt: 'exponential' },
  ],
  '14-spread-rules': [{ kind: 'viz', tool: 'distributions', opt: 'normal' }],
  '17-covariance': [{ kind: 'viz', tool: 'scatter' }],
  '18-regression': [{ kind: 'viz', tool: 'scatter' }],
  '19-estimation': [{ kind: 'viz', tool: 'sampling' }],
  '20-sampling': [{ kind: 'viz', tool: 'sampling' }],
};
