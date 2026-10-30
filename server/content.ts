// Loads the authored course content: the study-content pack plus this app's supplemental files in content/.
// Course content is read-only for the app; nothing here writes to disk.
import fs from 'node:fs';
import path from 'node:path';
import type {
  CourseBundle,
  ExamInfo,
  ExternalResource,
  GlossaryTerm,
  Lesson,
  LessonGuide,
  NotationSymbol,
  Dataset,
  StudyTips,
  GroupedDataset,
  CategoricalDataset,
  DistributionSummary,
  PackDoc,
  Question,
  ReviewItem,
  SourceInfo,
  SourcePageText,
} from '../shared/types.ts';

export interface ContentPaths {
  courseRoot: string;
  contentDir: string;
  supplementDir: string;
}

const PACK_DOCS: { id: string; title: string; path: string }[] = [
  { id: 'formula-reference', title: 'Formula reference and method chooser', path: 'FORMULA-REFERENCE.md' },
  { id: 'source-issues', title: 'Source issues, conventions, and coverage limits', path: 'SOURCE-ISSUES.md' },
  { id: 'coverage', title: 'Lecture coverage map', path: 'COVERAGE.md' },
  { id: 'validation', title: 'Content validation report', path: 'VALIDATION.md' },
  { id: 'pack-readme', title: 'About the content pack', path: 'README.md' },
  { id: 'pack-handoff', title: 'Content-pack import notes', path: 'CLAUDE-HANDOFF.md' },
];

type QuestionExtra = Partial<Pick<Question, 'steps' | 'reasoning' | 'kind'>> & {
  extra_hints?: string[];
  expect?: 'decimal' | 'percent' | 'count' | 'value';
  units?: string;
};

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function readOptional<T>(file: string, fallback: T): T {
  return fs.existsSync(file) ? readJson<T>(file) : fallback;
}

/** Parse "| [2026-08-24](...) | 6 | Main content | ..." rows of COVERAGE.md. */
function coverageByDate(md: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of md.split('\n')) {
    const m = /^\|\s*\[(\d{4}-\d{2}-\d{2})\][^|]*\|\s*\d+\s*\|\s*([^|]+)\|/.exec(line);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

export function loadCourse(paths: ContentPaths, extra: { notesDir: string; userDataDir: string }): { bundle: CourseBundle; problems: string[] } {
  const { contentDir, supplementDir, courseRoot } = paths;
  const problems: string[] = [];

  const course = readJson<{ title: string; scope: string; lessons: Lesson[] }>(path.join(contentDir, 'course.json'));
  const bank = readJson<{ questions: Omit<Question, 'bank' | 'kind'>[] }>(path.join(contentDir, 'question-bank.json'));
  const glossary = readJson<{ terms: GlossaryTerm[] }>(path.join(contentDir, 'glossary.json')).terms;
  const manifest = readJson<{ sources: SourceInfo[] }>(path.join(contentDir, 'source-manifest.json'));

  const docs: PackDoc[] = PACK_DOCS.filter((d) => fs.existsSync(path.join(contentDir, d.path))).map((d) => ({
    ...d,
    markdown: fs.readFileSync(path.join(contentDir, d.path), 'utf8'),
  }));
  const coverage = coverageByDate(docs.find((d) => d.id === 'coverage')?.markdown ?? '');
  const sources = manifest.sources.map((s) => ({ ...s, main_content: coverage[s.date] }));

  const guides = readOptional<Record<string, LessonGuide>>(path.join(supplementDir, 'lesson-guides.json'), {});
  const extras = readOptional<Record<string, QuestionExtra>>(path.join(supplementDir, 'question-extras.json'), {});
  const supplemental = readOptional<{ questions: Omit<Question, 'bank'>[] }>(path.join(supplementDir, 'supplemental-questions.json'), {
    questions: [],
  }).questions;
  const reviewItems = readOptional<{ items: ReviewItem[] }>(path.join(supplementDir, 'review-items.json'), { items: [] }).items;
  const resources = readOptional<{ resources: ExternalResource[] }>(path.join(supplementDir, 'resources.json'), { resources: [] }).resources;
  const exam = readOptional<ExamInfo>(path.join(supplementDir, 'exam.json'), {
    summary: 'No exam information found.',
    details: [],
    syllabusSource: 'Syllabus STAT A611.docx',
  });

  const notation = readOptional<{ symbols: NotationSymbol[]; distributions: DistributionSummary[] }>(path.join(supplementDir, 'notation.json'), {
    symbols: [],
    distributions: [],
  });

  const datasets = {
    datasets: [],
    grouped: [],
    categorical: [],
    ...readOptional<Partial<{ datasets: Dataset[]; grouped: GroupedDataset[]; categorical: CategoricalDataset[] }>>(path.join(supplementDir, 'datasets.json'), {}),
  };

  const tips = readOptional<StudyTips>(path.join(supplementDir, 'tips.json'), { sources: [], categories: [], tips: [] });

  const questions: Question[] = [
    ...bank.questions.map((q) => {
      const x = extras[q.id] ?? {};
      const grading =
        q.type === 'numeric' && q.grading ? { ...q.grading, expect: x.expect ?? 'decimal', units: x.units } : q.grading;
      return {
        ...q,
        grading,
        hints: [...q.hints, ...(x.extra_hints ?? [])],
        steps: x.steps,
        reasoning: x.reasoning,
        bank: 'pack' as const,
        kind: x.kind ?? (q.type === 'multiple_choice' ? 'conceptual' : 'calculation'),
      } as Question;
    }),
    ...supplemental.map((q) => ({ ...q, bank: 'supplemental' as const }) as Question),
  ];

  // ---- integrity checks (reported, not fatal) ----
  const lessonIds = new Set(course.lessons.map((l) => l.id));
  const sourceMap = new Map(sources.map((s) => [s.id, s]));
  const checkRefs = (owner: string, refs: { source_id: string; pages: number[] }[]) => {
    for (const r of refs) {
      const s = sourceMap.get(r.source_id);
      if (!s) problems.push(`${owner}: unknown source ${r.source_id}`);
      else for (const p of r.pages) if (p < 1 || p > s.page_count) problems.push(`${owner}: page ${p} outside ${r.source_id}`);
    }
  };
  for (const l of course.lessons) {
    for (const p of l.prerequisites) if (!lessonIds.has(p)) problems.push(`${l.id}: unknown prerequisite ${p}`);
    checkRefs(l.id, l.sources);
    if (!guides[l.id]) problems.push(`${l.id}: no supplemental lesson guide`);
  }
  const qids = new Set<string>();
  for (const q of questions) {
    if (qids.has(q.id)) problems.push(`duplicate question id ${q.id}`);
    qids.add(q.id);
    if (!lessonIds.has(q.lesson_id)) problems.push(`${q.id}: unknown lesson ${q.lesson_id}`);
    for (const r of q.related_lessons) if (!lessonIds.has(r)) problems.push(`${q.id}: unknown related lesson ${r}`);
    checkRefs(q.id, q.source_refs);
    if (q.type === 'multiple_choice' && (typeof q.answer !== 'number' || !q.options || q.answer < 0 || q.answer >= q.options.length))
      problems.push(`${q.id}: bad multiple-choice key`);
    if (q.type === 'numeric' && typeof q.answer !== 'number') problems.push(`${q.id}: numeric key is not a number`);
  }
  for (const id of Object.keys(extras)) if (!qids.has(id)) problems.push(`question-extras: unknown question ${id}`);
  for (const [id, g] of Object.entries(guides)) {
    if (!lessonIds.has(id)) problems.push(`lesson-guides: unknown lesson ${id}`);
    for (const r of g.related) if (!lessonIds.has(r)) problems.push(`lesson-guides ${id}: unknown related ${r}`);
  }
  for (const item of reviewItems) {
    checkRefs(`review ${item.id}`, item.refs);
    for (const l of item.lessons) if (!lessonIds.has(l)) problems.push(`review ${item.id}: unknown lesson ${l}`);
  }
  for (const n of notation.symbols) {
    if (!lessonIds.has(n.lesson_id)) problems.push(`notation ${n.id}: unknown lesson ${n.lesson_id}`);
    checkRefs(`notation ${n.id}`, n.refs);
  }
  for (const d of notation.distributions) if (!lessonIds.has(d.lesson_id)) problems.push(`distribution ${d.id}: unknown lesson ${d.lesson_id}`);
  for (const d of [...datasets.datasets, ...datasets.grouped, ...datasets.categorical]) {
    if (!lessonIds.has(d.lesson_id)) problems.push(`dataset ${d.id}: unknown lesson ${d.lesson_id}`);
    checkRefs(`dataset ${d.id}`, d.refs);
  }
  {
    const srcIds = new Set(tips.sources.map((x) => x.id));
    const catIds = new Set(tips.categories.map((x) => x.id));
    for (const t of tips.tips) {
      if (!catIds.has(t.category)) problems.push(`tip ${t.id}: unknown category ${t.category}`);
      for (const sid of t.sources) if (!srcIds.has(sid)) problems.push(`tip ${t.id}: unknown source ${sid}`);
      if (t.lesson && !lessonIds.has(t.lesson)) problems.push(`tip ${t.id}: unknown lesson ${t.lesson}`);
    }
  }
  for (const t of glossary) if (!lessonIds.has(t.lesson_id)) problems.push(`glossary ${t.term}: unknown lesson`);
  for (const s of sources) if (!fs.existsSync(path.join(courseRoot, s.path))) problems.push(`missing PDF ${s.path}`);

  return {
    bundle: {
      title: course.title,
      scope: course.scope,
      lessons: course.lessons,
      guides,
      questions,
      sources,
      glossary,
      docs,
      reviewItems,
      resources,
      exam,
      notation: notation.symbols,
      distributions: notation.distributions,
      datasets,
      tips,
      paths: { courseRoot, contentDir, notesDir: extra.notesDir, userDataDir: extra.userDataDir },
    },
    problems,
  };
}

export function loadSourcePages(contentDir: string, sources: SourceInfo[]): SourcePageText[] {
  const out: SourcePageText[] = [];
  for (const s of sources) {
    const file = path.join(contentDir, s.extracted_text);
    if (!fs.existsSync(file)) continue;
    const parts = fs.readFileSync(file, 'utf8').split(/^=== PDF PAGE (\d+) ===$/m);
    for (let i = 1; i < parts.length; i += 2) {
      out.push({ source_id: s.id, page: Number(parts[i]), text: parts[i + 1].trim().normalize('NFKC') });
    }
  }
  return out;
}
