// Local full-text search over lessons, sections, formulas, glossary, questions, notes, docs, and PDF text.
import MiniSearch, { type Query, type SearchResult } from 'minisearch';
import type { CourseBundle, Note, SourcePageText } from '../../shared/types.ts';
import type { Target, VizTool } from './targets.ts';
import { formatDate } from './targets.ts';

export type ResultType = 'lesson' | 'section' | 'formula' | 'term' | 'notation' | 'tool' | 'question' | 'note' | 'source' | 'doc';

export const TYPE_LABEL: Record<ResultType, string> = {
  lesson: 'Lesson',
  section: 'Section',
  formula: 'Formula',
  term: 'Definition',
  notation: 'Notation',
  tool: 'Visualize',
  question: 'Practice',
  note: 'My note',
  source: 'Lecture PDF',
  doc: 'Reference',
};

export interface SearchDoc {
  id: string;
  type: ResultType;
  title: string;
  text: string;
  /** Readable text used for snippets. */
  display?: string;
  keywords: string;
  context: string;
  target: Target;
  tex?: string;
}

export interface Hit {
  doc: SearchDoc;
  score: number;
  snippet: string;
  terms: string[];
}

// Symbols and LaTeX commands → searchable words.
const SYMBOLS: [RegExp, string][] = [
  [/\\bar\s*\{?x\}?|x̄|¯x|¯𝑥/g, ' xbar sample mean '],
  [/\\hat\s*\{?\\?theta\}?|θ̂/g, ' thetahat estimator '],
  [/\\sigma|σ/g, ' sigma '],
  [/\\mu|μ/g, ' mu '],
  [/\\lambda|λ/g, ' lambda '],
  [/\\alpha|α/g, ' alpha '],
  [/\\beta|β/g, ' beta '],
  [/\\Gamma|Γ/g, ' gamma '],
  [/\\chi|χ/g, ' chi '],
  [/\\rho|ρ/g, ' rho '],
  [/\\Phi|Φ/g, ' phi '],
  [/\\theta|θ/g, ' theta '],
  [/\\nu|ν/g, ' nu '],
  [/\\binom|\\choose/g, ' choose binom '],
  [/\\operatorname\{Cov\}|\bCov\b/g, ' cov covariance '],
  [/R\^2|R²/g, ' rsquared '],
  [/\\sum|Σ|∑/g, ' sum '],
  [/\\int|∫/g, ' integral '],
  [/\\sqrt|√/g, ' sqrt '],
  [/\\cup|∪/g, ' union '],
  [/\\cap|∩/g, ' intersection '],
  [/\\mid/g, ' given '],
  [/\\varnothing|∅/g, ' empty '],
];

export function plainText(s: string): string {
  let t = s.normalize('NFKC');
  for (const [re, w] of SYMBOLS) t = t.replace(re, w);
  return t
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}$^_\\]/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*#>|`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Readable snippet text: LaTeX → Unicode where common, markup removed. Not used for indexing. */
const DISPLAY: [RegExp, string][] = [
  [/\\bar\s*\{?\s*([A-Za-z])\s*\}?/g, '$1\u0304'],
  [/\\hat\s*\{?\s*\\?([A-Za-z]+)\s*\}?/g, '$1\u0302'],
  [/\\sigma/g, 'σ'], [/\\mu/g, 'μ'], [/\\lambda/g, 'λ'], [/\\alpha/g, 'α'], [/\\beta/g, 'β'], [/\\Gamma/g, 'Γ'],
  [/\\chi/g, 'χ'], [/\\rho/g, 'ρ'], [/\\Phi/g, 'Φ'], [/\\theta/g, 'θ'], [/\\nu/g, 'ν'], [/\\infty/g, '∞'],
  [/\\sum/g, 'Σ'], [/\\int/g, '∫'], [/\\sqrt/g, '√'], [/\\le(q)?\b/g, '≤'], [/\\ge(q)?\b/g, '≥'], [/\\ne(q)?\b/g, '≠'],
  [/\\cdot/g, '·'], [/\\times/g, '×'], [/\\cup/g, '∪'], [/\\cap/g, '∩'], [/\\mid/g, '|'], [/\\varnothing/g, '∅'],
  [/\^2/g, '²'], [/\^\{2\}/g, '²'], [/\\operatorname\{([^}]*)\}/g, '$1'], [/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)'],
];
export function displayText(s: string): string {
  let t = s.normalize('NFKC');
  for (const [re, w] of DISPLAY) t = t.replace(re, w);
  return t
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}$\\]/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*#>`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Visualization tools, findable from ⌘K ("box plot", "histogram", "binomial chart"…). */
const VIZ_SEARCH: { tool: VizTool; opt?: string; title: string; text: string; keywords: string }[] = [
  { tool: 'describe', opt: 'histogram', title: 'Histogram & ogive (interactive)', text: 'draw a histogram frequency table classes bins ogive cumulative relative frequency', keywords: 'histogram ogive chart graph plot visualize' },
  { tool: 'describe', opt: 'boxplot', title: 'Box plot builder (course quartiles and fences)', text: 'boxplot box and whisker quartiles outliers fences whiskers five number summary', keywords: 'boxplot box plot whisker outlier chart visualize' },
  { tool: 'describe', opt: 'dotplot', title: 'Dot plot', text: 'dotplot dot plot individual observations', keywords: 'dotplot chart visualize' },
  { tool: 'describe', opt: 'stem', title: 'Stem-and-leaf plot', text: 'stem and leaf display place value key', keywords: 'stem leaf chart visualize' },
  { tool: 'distributions', title: 'Distribution explorer: PMF, PDF and probabilities', text: 'binomial geometric negative binomial hypergeometric poisson uniform normal exponential gamma chi squared pmf pdf cdf probability area', keywords: 'distribution chart graph visualize shade probability' },
  { tool: 'scatter', title: 'Scatterplot, correlation and least-squares line', text: 'scatterplot scatter plot correlation coefficient regression line of best fit r squared quadrants', keywords: 'scatter correlation regression chart visualize' },
  { tool: 'sampling', title: 'Sampling distribution of the sample mean (simulation)', text: 'sampling distribution sample mean xbar standard error simulation central limit theorem', keywords: 'sampling simulation xbar chart visualize' },
  { tool: 'categorical', title: 'Bar graph and pie chart', text: 'bar graph pie chart categorical relative frequency slices degrees', keywords: 'bar pie chart categorical visualize' },
];

const STOPWORDS = new Set(['a', 'an', 'the', 'of', 'to', 'in', 'for', 'and', 'or', 'is', 'are', 'what', 'how', 'with', 'on', 'by', 'when', 'do', 'does', 'i']);

// Groups of equivalent search terms. Single tokens only; multi-word phrases are matched as AND groups.
const SYNONYM_GROUPS: string[][] = [
  ['sd', 'stdev', 'std', 'standard deviation'],
  ['var', 'variance'],
  ['mean', 'average', 'expectation', 'expected value', 'mu'],
  ['xbar', 'sample mean'],
  ['pmf', 'probability mass function', 'mass function'],
  ['pdf', 'density', 'probability density function'],
  ['cdf', 'cumulative distribution function', 'distribution function'],
  ['mgf', 'moment generating function'],
  ['iqr', 'interquartile range'],
  ['rv', 'random variable'],
  ['iid', 'independent identically distributed'],
  ['se', 'standard error'],
  ['rsquared', 'r2', 'r squared', 'coefficient of determination'],
  ['corr', 'correlation', 'rho'],
  ['cov', 'covariance'],
  ['nb', 'negative binomial'],
  ['hg', 'hypergeometric'],
  ['binom', 'binomial'],
  ['geom', 'geometric'],
  ['expo', 'exponential'],
  ['chi', 'chisq', 'chi squared', 'chi square'],
  ['lambda', 'poisson rate'],
  ['phi', 'standard normal cdf'],
  ['zscore', 'z score', 'standardize', 'standardized'],
  ['boxplot', 'box plot', 'whisker', 'fence', 'outlier'],
  ['ncr', 'choose', 'combination', 'combinations'],
  ['npr', 'permutation', 'permutations', 'arrangement'],
  ['regression', 'least squares', 'ols', 'fitted line'],
  ['disjoint', 'mutually exclusive'],
  ['chebyshev', 'tchebysheff', 'chebychev'],
  ['empirical rule', '68 95 99.7'],
  ['ogive', 'cumulative frequency'],
  ['estimator', 'thetahat', 'point estimate'],
  ['unbiased', 'bias'],
  ['conditional', 'given'],
  ['normal', 'gaussian', 'bell curve'],
];

const SYN = new Map<string, string[]>();
for (const g of SYNONYM_GROUPS) for (const t of g) SYN.set(t, g);

/**
 * A simple matcher for small in-memory lists (the quick-reference dock): every query word, or one of its synonyms,
 * must start a word in the haystack. Returns null for an empty query.
 */
export function makeMatcher(raw: string, synonyms = true): ((haystack: string) => boolean) | null {
  const words = plainText(raw).toLowerCase().split(/[\s,;:()=+\-*/]+/).filter((t) => t && !STOPWORDS.has(t));
  if (!words.length) return null;
  const groups = words.map((w) => ((synonyms && SYN.get(w)) || [w]).map((alt) => alt.split(' ')));
  return (haystack: string) => {
    const hay = ` ${plainText(haystack).toLowerCase().replace(/[^\p{L}\p{N}.]+/gu, ' ')}`;
    return groups.every((alts) => alts.some((alt) => alt.every((w) => hay.includes(` ${w}`))));
  };
}

function expandQuery(raw: string): Query {
  const text = plainText(raw).toLowerCase();
  const tokens = text.split(/[\s,;:()=+\-*/]+/).filter((t) => t.length > 0);
  const content = tokens.filter((t) => !STOPWORDS.has(t));
  if (content.length) tokens.splice(0, tokens.length, ...content);
  if (!tokens.length) return '';
  const used = new Set<number>();
  const groups: Query[] = [];
  // Match two- and three-word phrases against synonym groups first.
  for (let i = 0; i < tokens.length; i++) {
    if (used.has(i)) continue;
    let matched = false;
    for (const len of [3, 2]) {
      const phrase = tokens.slice(i, i + len).join(' ');
      if (len > 1 && i + len <= tokens.length && SYN.has(phrase)) {
        groups.push({ combineWith: 'OR', queries: SYN.get(phrase)!.map((s) => ({ combineWith: 'AND', queries: s.split(' ') })) });
        for (let k = i; k < i + len; k++) used.add(k);
        matched = true;
        break;
      }
    }
    if (matched) continue;
    const t = tokens[i];
    used.add(i);
    const syn = SYN.get(t);
    if (syn) groups.push({ combineWith: 'OR', queries: syn.map((s) => ({ combineWith: 'AND', queries: s.split(' ') })) });
    else groups.push(t);
  }
  return { combineWith: 'AND', queries: groups };
}

export function buildDocs(course: CourseBundle, notes: Note[], pages: SourcePageText[]): SearchDoc[] {
  const docs: SearchDoc[] = [];
  const lessonTitle = new Map(course.lessons.map((l) => [l.id, l.title]));
  for (const l of course.lessons) {
    const g = course.guides[l.id];
    docs.push({
      id: `lesson:${l.id}`,
      type: 'lesson',
      title: l.title,
      text: plainText(l.body_markdown),
      display: displayText(l.body_markdown),
      keywords: `${l.id} ${l.course_section} ${g ? plainText([...g.objectives, ...g.recognize, ...g.mistakes].join(' ')) : ''}`,
      context: `Section ${l.course_section}`,
      target: { kind: 'lesson', id: l.id },
    });
    // Sections (split on headings) so headings are directly findable.
    const parts = l.body_markdown.split(/^##+\s+/m).slice(1);
    parts.forEach((p, i) => {
      const [head, ...rest] = p.split('\n');
      docs.push({
        id: `section:${l.id}:${i}`,
        type: 'section',
        title: head.trim(),
        text: plainText(rest.join('\n')),
        display: displayText(rest.join('\n')),
        keywords: '',
        context: l.title,
        target: { kind: 'lesson', id: l.id, anchor: head.trim() },
      });
    });
    // Display formulas in the lesson body.
    const displays = [...l.body_markdown.matchAll(/\$\$([\s\S]+?)\$\$/g)];
    displays.forEach((m, i) => {
      const before = l.body_markdown.slice(0, m.index).split('\n').filter((x) => x.trim() && !x.startsWith('$$')).pop() ?? '';
      docs.push({
        id: `formula:${l.id}:body:${i}`,
        type: 'formula',
        title: plainText(before).slice(0, 90) || l.title,
        text: plainText(m[1]),
        keywords: '',
        context: l.title,
        target: { kind: 'lesson', id: l.id },
        tex: m[1].trim(),
      });
    });
    g?.key_formulas.forEach((f, i) =>
      docs.push({
        id: `formula:${l.id}:guide:${i}`,
        type: 'formula',
        title: f.label,
        text: plainText(f.tex),
        keywords: plainText(f.label),
        context: l.title,
        target: { kind: 'lesson', id: l.id, anchor: 'Key formulas' },
        tex: f.tex,
      }),
    );
  }
  for (const t of course.glossary) {
    docs.push({
      id: `term:${t.term}`,
      type: 'term',
      title: t.term,
      text: plainText(t.definition),
      keywords: '',
      context: lessonTitle.get(t.lesson_id) ?? '',
      target: { kind: 'glossary', term: t.term },
    });
  }
  for (const q of course.questions) {
    docs.push({
      id: `question:${q.id}`,
      type: 'question',
      title: plainText(q.prompt).slice(0, 110),
      // Prompts and options only — solutions are never searchable, so search can't spoil an answer.
      text: plainText(`${q.prompt} ${(q.options ?? []).join(' ')}`),
      display: displayText(q.prompt),
      keywords: `${q.id} ${q.type.replace('_', ' ')} ${q.difficulty}`,
      context: `${q.id} · ${lessonTitle.get(q.lesson_id) ?? ''}`,
      target: { kind: 'question', id: q.id },
    });
  }
  for (const d of course.docs) {
    const sections = d.markdown.split(/^##\s+/m);
    sections.forEach((s, i) => {
      const [head, ...rest] = s.split('\n');
      docs.push({
        id: `doc:${d.id}:${i}`,
        type: 'doc',
        title: i === 0 ? d.title : head.trim(),
        text: plainText(i === 0 ? s : rest.join('\n')),
        display: displayText(i === 0 ? s : rest.join('\n')),
        keywords: '',
        context: d.title,
        target: { kind: 'doc', id: d.id },
      });
    });
  }
  for (const n of course.notation) {
    docs.push({
      id: `notation:${n.id}`,
      type: 'notation',
      title: n.name,
      text: plainText(`${n.tex} ${n.meaning}`),
      display: displayText(n.meaning),
      keywords: `${n.aliases} ${plainText(n.tex)}`,
      context: lessonTitle.get(n.lesson_id) ?? '',
      target: { kind: 'reference', tab: 'notation' },
      tex: n.tex,
    });
  }
  for (const t of VIZ_SEARCH) {
    docs.push({ id: `tool:${t.tool}:${t.opt ?? ''}`, type: 'tool', title: t.title, text: t.text, keywords: t.keywords, context: 'Visualize', target: { kind: 'viz', tool: t.tool, opt: t.opt } });
  }
  const srcDate = new Map(course.sources.map((s) => [s.id, s.date]));
  for (const p of pages) {
    docs.push({
      id: `source:${p.source_id}:${p.page}`,
      type: 'source',
      title: `Lecture ${formatDate(srcDate.get(p.source_id) ?? '')}, PDF p. ${p.page}`,
      text: plainText(p.text),
      display: p.text.replace(/\s+/g, ' '),
      keywords: p.source_id,
      context: 'Extracted text (may contain PDF artifacts)',
      target: { kind: 'pdf', sourceId: p.source_id, page: p.page },
    });
  }
  for (const n of notes) docs.push(noteDoc(n, lessonTitle));
  return docs;
}

export function noteDoc(n: Note, lessonTitle: Map<string, string>): SearchDoc {
  return {
    id: `note:${n.id}`,
    type: 'note',
    title: n.title,
    text: plainText(n.body),
    display: displayText(n.body),
    keywords: `${n.tags.join(' ')} ${n.topics.join(' ')} ${n.topics.map((t) => lessonTitle.get(t) ?? '').join(' ')}`,
    context: n.tags.length ? `Tags: ${n.tags.join(', ')}` : 'Personal note',
    target: { kind: 'note', id: n.id },
  };
}

export class SearchIndex {
  private ms = new MiniSearch<SearchDoc>({
    idField: 'id',
    fields: ['title', 'text', 'keywords'],
    storeFields: ['id'],
    processTerm: (term) => {
      const t = term.toLowerCase();
      return t.length > 0 ? t : null;
    },
    tokenize: (s) => s.split(/[\s\-–—,.;:!?()[\]{}"“”'’/=+<>|]+/).filter(Boolean),
  });
  private docs = new Map<string, SearchDoc>();

  constructor(docs: SearchDoc[]) {
    this.addAll(docs);
  }

  addAll(docs: SearchDoc[]): void {
    for (const d of docs) this.docs.set(d.id, d);
    this.ms.addAll(docs);
  }

  replaceNotes(notes: SearchDoc[]): void {
    for (const id of [...this.docs.keys()]) {
      if (id.startsWith('note:')) {
        this.ms.discard(id);
        this.docs.delete(id);
      }
    }
    this.addAll(notes);
  }

  get size(): number {
    return this.docs.size;
  }

  search(raw: string, types?: ResultType[], limit = 60): Hit[] {
    const q = expandQuery(raw);
    if (!q) return [];
    const opts = {
      prefix: (t: string) => t.length >= 2,
      fuzzy: (t: string) => (t.length >= 5 ? 0.2 : false),
      boost: { title: 3, keywords: 1.5, text: 1 },
      filter: types && types.length ? (r: SearchResult) => types.includes(this.docs.get(r.id as string)!.type) : undefined,
    } as const;
    let results = this.ms.search(q, opts as any);
    if (results.length < 3 && typeof q === 'object' && 'queries' in q && q.queries.length > 1) {
      // Fall back to OR so long queries still return something useful.
      const loose = this.ms.search({ ...q, combineWith: 'OR' }, opts as any);
      const seen = new Set(results.map((r) => r.id));
      results = [...results, ...loose.filter((r) => !seen.has(r.id))];
    }
    const typeWeight: Record<ResultType, number> = { lesson: 1.3, section: 1.2, formula: 1.15, term: 1.25, notation: 1.2, tool: 1.1, question: 1, note: 1.2, doc: 0.9, source: 0.75 };
    return results
      .map((r) => {
        const doc = this.docs.get(r.id as string)!;
        return { doc, score: r.score * typeWeight[doc.type], snippet: makeSnippet(doc.display ?? doc.text, r.terms), terms: r.terms };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

function makeSnippet(text: string, terms: string[]): string {
  const lower = text.toLowerCase();
  let pos = -1;
  for (const t of terms) {
    const i = lower.indexOf(t.toLowerCase());
    if (i >= 0 && (pos < 0 || i < pos)) pos = i;
  }
  if (pos < 0) return text.slice(0, 160);
  const start = Math.max(0, pos - 60);
  const end = Math.min(text.length, pos + 120);
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}
