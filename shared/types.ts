// Types shared by the server and the browser client.

export interface SourceRef {
  source_id: string;
  pages: number[];
}

export interface Lesson {
  id: string;
  title: string;
  course_section: string;
  prerequisites: string[];
  sources: SourceRef[];
  body_markdown: string;
  origin: string;
  search_url: string;
  path: string;
}

export interface LessonGuide {
  objectives: string[];
  recognize: string[];
  key_formulas: { label: string; tex: string }[];
  mistakes: string[];
  related: string[];
}

export type QuestionType = 'multiple_choice' | 'numeric' | 'free_response';

export interface NumericGrading {
  absolute_tolerance: number;
  relative_tolerance: number;
  input: string;
  /** 'decimal' (default) or 'percent' when the prompt asks for a percent. */
  expect?: 'decimal' | 'percent' | 'count' | 'value';
  units?: string;
}

export interface Question {
  id: string;
  lesson_id: string;
  type: QuestionType;
  prompt: string;
  /** MC: zero-based index. Numeric: number. Free response: rubric items. */
  answer: number | string[];
  options?: string[];
  hints: string[];
  solution: string;
  /** Supplemental step list and reasoning layered on top of the pack solution. */
  steps?: string[];
  reasoning?: string;
  source_refs: SourceRef[];
  origin: string;
  difficulty: string;
  related_lessons: string[];
  grading?: NumericGrading | { mode: 'self_assessment'; rubric: string[] };
  /** Which bank the question came from. */
  bank: 'pack' | 'supplemental';
  /** conceptual vs calculation/interpretation, used for coverage summaries. */
  kind: 'conceptual' | 'calculation';
}

export interface SourceInfo {
  id: string;
  date: string;
  path: string;
  page_count: number;
  sha256: string;
  extracted_text: string;
  reading_status: string;
  /** From COVERAGE.md. */
  main_content?: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  lesson_id: string;
}

export interface PackDoc {
  id: string;
  title: string;
  /** Path relative to the study-content directory. */
  path: string;
  markdown: string;
}

export interface ReviewItem {
  id: string;
  title: string;
  status: 'source-error' | 'ambiguity' | 'convention' | 'scope' | 'extraction';
  detail: string;
  refs: SourceRef[];
  lessons: string[];
}

export interface ExternalResource {
  id: string;
  title: string;
  url: string;
  description: string;
  verified: string;
  embeddable: boolean | null;
  topics: string[];
}

export interface NotationSymbol {
  id: string;
  tex: string;
  name: string;
  /** Markdown with inline math. */
  meaning: string;
  lesson_id: string;
  /** lecture = the symbol appears in the cited lecture page; pack = used by the course-notes synthesis. */
  origin: 'lecture' | 'pack';
  refs: SourceRef[];
  /** Regex that must match the cited page's extracted text (checked by tests). */
  evidence?: string;
  aliases: string;
}

export interface DistributionSummary {
  id: string;
  name: string;
  notation: string;
  support: string;
  pmf: string;
  mean: string;
  variance: string;
  lesson_id: string;
  /** Flagged † in FORMULA-REFERENCE.md: not explicitly developed in the supplied lectures. */
  supplemental: boolean;
  type: 'discrete' | 'continuous';
}

export interface Dataset {
  id: string;
  title: string;
  values: number[];
  refs: SourceRef[];
  lesson_id: string;
  note: string;
  /** The source itself has a flagged discrepancy for this data. */
  caution?: boolean;
}

export interface GroupedDataset {
  id: string;
  title: string;
  start: number;
  width: number;
  counts: number[];
  refs: SourceRef[];
  lesson_id: string;
  note: string;
}

export interface CategoricalDataset {
  id: string;
  title: string;
  categories: string[];
  labels: string[];
  counts: number[];
  refs: SourceRef[];
  lesson_id: string;
  note: string;
}

export interface StudyTips {
  sources: { id: string; label: string; url: string }[];
  categories: { id: string; title: string }[];
  tips: {
    id: string;
    category: string;
    title: string;
    /** Markdown. */
    body: string;
    /** Optional "try it" link, as a study:// URL. */
    action?: { label: string; target: string };
    lesson?: string;
    sources: string[];
  }[];
}

export interface CourseBundle {
  title: string;
  scope: string;
  lessons: Lesson[];
  guides: Record<string, LessonGuide>;
  questions: Question[];
  sources: SourceInfo[];
  glossary: GlossaryTerm[];
  docs: PackDoc[];
  reviewItems: ReviewItem[];
  resources: ExternalResource[];
  exam: ExamInfo;
  notation: NotationSymbol[];
  distributions: DistributionSummary[];
  tips: StudyTips;
  datasets: { datasets: Dataset[]; grouped: GroupedDataset[]; categorical: CategoricalDataset[] };
  paths: { courseRoot: string; contentDir: string; notesDir: string; userDataDir: string };
}

export interface ExamInfo {
  summary: string;
  /** Scheduled final, as local date-times without a time zone (interpreted in the browser's time zone). */
  final?: { label: string; start: string; end: string; note: string };
  details: string[];
  syllabusSource: string;
}

export interface SourcePageText {
  source_id: string;
  page: number;
  text: string;
}

// ---------- Notes ----------

export interface NoteMeta {
  id: string;
  title: string;
  topics: string[];
  tags: string[];
  created: string;
  updated: string;
  /** File name inside user-data/notes. */
  file: string;
  /** Absolute path on disk. */
  absPath: string;
  /** Content hash of the full file; used for optimistic concurrency. */
  version: string;
  mtimeMs: number;
  /** Set when frontmatter could not be parsed cleanly. */
  warning?: string;
}

export interface Note extends NoteMeta {
  body: string;
}

export interface NoteRevision {
  rev: string;
  noteId: string;
  savedAt: string;
  /** app = autosave from this app; external = change detected on disk; others are workflow markers. */
  origin: 'app' | 'external' | 'conflict-draft' | 'pre-restore' | 'restore' | 'created' | 'pre-delete';
  version: string;
  size: number;
}

export interface NoteChangeEvent {
  type: 'note-changed' | 'note-deleted' | 'note-created';
  id: string;
  version?: string;
  previousVersion?: string;
  origin: 'app' | 'external';
  at: string;
}

// ---------- Progress ----------

export interface Attempt {
  id: string;
  questionId: string;
  at: string;
  mode: 'topic' | 'mixed' | 'exam' | 'review' | 'single';
  response: string;
  /** null for free-response until self-assessed. */
  correct: boolean | null;
  /** Free response: number of rubric items self-assessed as met. */
  rubricMet?: number;
  rubricTotal?: number;
  hintsUsed: number;
  revealedBeforeSubmit: boolean;
  /** True when this was the learner's first recorded attempt on the question. */
  firstAttempt: boolean;
  durationMs?: number;
}

export interface ExamSettings {
  topics: string[];
  questionCount: number;
  timed: boolean;
  minutes: number;
  includeTypes: QuestionType[];
}

export interface Progress {
  schema: 1;
  attempts: Attempt[];
  flags: Record<string, { at: string; reason?: string }>;
  studied: Record<string, { at: string }>;
  visits: Record<string, { first: string; last: string; count: number }>;
  examChecklist: Record<string, boolean>;
  examSettings: ExamSettings;
  /** Starred quick-reference items (formulas, notation, terms), keyed by stable item id. */
  saved: Record<string, { at: string }>;
  lastPosition?: { route: string; at: string };
}

export interface ScratchStore {
  [questionId: string]: { text: string; updated: string };
}
