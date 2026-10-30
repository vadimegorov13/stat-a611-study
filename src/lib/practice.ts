// Turning recorded attempts into honest summaries. No mastery score: we report counts and recency.
import type { Attempt, CourseBundle, Progress, Question } from '../../shared/types.ts';

export type Outcome = 'unaided' | 'with-hints' | 'revealed' | 'incorrect' | 'pending';

export function outcomeOf(a: Attempt): Outcome {
  if (a.revealedBeforeSubmit) return 'revealed';
  if (a.correct === true) return a.hintsUsed > 0 ? 'with-hints' : 'unaided';
  if (a.correct === false) return 'incorrect';
  return 'pending';
}

export const OUTCOME_LABEL: Record<Outcome, string> = {
  unaided: 'Correct, no help',
  'with-hints': 'Correct with hints',
  revealed: 'Viewed solution first',
  incorrect: 'Incorrect',
  pending: 'Awaiting self-assessment',
};

export interface QuestionStatus {
  attempts: Attempt[];
  first?: Attempt;
  latest?: Attempt;
  latestOutcome?: Outcome;
  everUnaided: boolean;
  flagged: boolean;
}

export function questionStatus(q: Question, progress: Progress): QuestionStatus {
  const attempts = progress.attempts.filter((a) => a.questionId === q.id);
  const latest = attempts[attempts.length - 1];
  return {
    attempts,
    first: attempts[0],
    latest,
    latestOutcome: latest ? outcomeOf(latest) : undefined,
    everUnaided: attempts.some((a) => outcomeOf(a) === 'unaided'),
    flagged: !!progress.flags[q.id],
  };
}

export interface LessonStats {
  lessonId: string;
  total: number;
  attempted: number;
  attempts: number;
  firstTryUnaided: number;
  latest: Record<Outcome, number>;
  flagged: number;
  studied: boolean;
  visits: number;
}

export function lessonStats(course: CourseBundle, progress: Progress, lessonId: string): LessonStats {
  const qs = course.questions.filter((q) => q.lesson_id === lessonId);
  const latest: Record<Outcome, number> = { unaided: 0, 'with-hints': 0, revealed: 0, incorrect: 0, pending: 0 };
  let attempted = 0;
  let attempts = 0;
  let firstTryUnaided = 0;
  let flagged = 0;
  for (const q of qs) {
    const s = questionStatus(q, progress);
    if (s.flagged) flagged++;
    if (!s.latest) continue;
    attempted++;
    attempts += s.attempts.length;
    if (s.first && outcomeOf(s.first) === 'unaided') firstTryUnaided++;
    latest[s.latestOutcome!]++;
  }
  return {
    lessonId,
    total: qs.length,
    attempted,
    attempts,
    firstTryUnaided,
    latest,
    flagged,
    studied: !!progress.studied[lessonId],
    visits: progress.visits[lessonId]?.count ?? 0,
  };
}

export interface ReviewEntry {
  question: Question;
  reasons: string[];
}

/** Questions worth revisiting: flagged, latest attempt not correct, or never solved without help. */
export function reviewQueue(course: CourseBundle, progress: Progress): ReviewEntry[] {
  const out: ReviewEntry[] = [];
  for (const q of course.questions) {
    const s = questionStatus(q, progress);
    const reasons: string[] = [];
    if (s.flagged) reasons.push(progress.flags[q.id]?.reason ? `Flagged: ${progress.flags[q.id].reason}` : 'Flagged as confusing');
    if (s.latestOutcome === 'incorrect') reasons.push('Latest attempt incorrect');
    if (s.latestOutcome === 'revealed') reasons.push('Solution viewed before answering');
    if (s.latestOutcome === 'pending') reasons.push('Free response not yet self-assessed');
    if (s.latest && !s.everUnaided && (s.latestOutcome === 'with-hints' || reasons.length === 0)) reasons.push('Not yet solved without hints');
    if (reasons.length) out.push({ question: q, reasons });
  }
  return out;
}

export interface Recommendation {
  lessonId: string;
  reasons: string[];
  priority: number;
}

/** Rank lessons for "what to study next" from actual attempts, flags, and study status. */
export function recommendations(course: CourseBundle, progress: Progress, scope?: string[]): Recommendation[] {
  const inScope = scope && scope.length ? new Set(scope) : null;
  const order = new Map(course.lessons.map((l, i) => [l.id, i]));
  const recs: Recommendation[] = [];
  const weak = new Set<string>();
  const statsById = new Map<string, LessonStats>();
  for (const l of course.lessons) {
    const st = lessonStats(course, progress, l.id);
    statsById.set(l.id, st);
    if (st.latest.incorrect + st.latest.revealed > 0) weak.add(l.id);
  }
  for (const l of course.lessons) {
    if (inScope && !inScope.has(l.id)) continue;
    const st = statsById.get(l.id)!;
    const reasons: string[] = [];
    let priority = 0;
    if (st.latest.incorrect) {
      reasons.push(`${st.latest.incorrect} question${st.latest.incorrect > 1 ? 's' : ''} with an incorrect latest attempt`);
      priority += 6 * st.latest.incorrect;
    }
    if (st.latest.revealed) {
      reasons.push(`${st.latest.revealed} answered only after viewing the solution`);
      priority += 4 * st.latest.revealed;
    }
    if (st.flagged) {
      reasons.push(`${st.flagged} flagged as confusing`);
      priority += 3 * st.flagged;
    }
    if (st.latest['with-hints']) {
      reasons.push(`${st.latest['with-hints']} solved only with hints`);
      priority += 2 * st.latest['with-hints'];
    }
    if (st.latest.pending) {
      reasons.push(`${st.latest.pending} free response awaiting self-assessment`);
      priority += 1;
    }
    const dependents = course.lessons.filter((d) => d.prerequisites.includes(l.id) && weak.has(d.id));
    if (dependents.length && !weak.has(l.id)) {
      reasons.push(`Prerequisite for ${dependents.map((d) => d.title).join('; ')}, where you had mistakes`);
      priority += 2;
    }
    if (!st.studied && st.visits === 0) {
      reasons.push('Not opened yet');
      priority += 1.5;
    } else if (!st.studied) {
      reasons.push('Opened but not marked as studied');
      priority += 0.75;
    }
    if (st.attempted < st.total) {
      reasons.push(`${st.total - st.attempted} of ${st.total} practice questions not attempted`);
      priority += 0.5 * ((st.total - st.attempted) / st.total);
    }
    if (reasons.length) recs.push({ lessonId: l.id, reasons, priority: priority - (order.get(l.id)! * 0.001) });
  }
  return recs.sort((a, b) => b.priority - a.priority);
}

/** Deterministic shuffle so a session's order survives reloads. */
export function shuffle<T>(xs: T[], seed: number): T[] {
  const a = [...xs];
  let s = seed >>> 0 || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function lessonQuestions(course: CourseBundle, lessonId: string): Question[] {
  const rank = (q: Question) => (q.difficulty === 'foundational' ? 0 : q.difficulty === 'standard' ? 1 : 2);
  return course.questions.filter((q) => q.lesson_id === lessonId).sort((a, b) => rank(a) - rank(b) || a.id.localeCompare(b.id));
}
