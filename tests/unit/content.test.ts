import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadCourse } from '../../server/content.ts';
import { checkNumeric } from '../../shared/answerCheck.ts';
import { parseStudyUrl, resolveHref } from '../../src/lib/links.ts';
import type { NumericGrading } from '../../shared/types.ts';

const appRoot = path.resolve(__dirname, '../..');
const courseRoot = path.join(appRoot, 'course');
const { bundle: course, problems } = loadCourse(
  { courseRoot, contentDir: path.join(courseRoot, 'study-content'), supplementDir: path.join(appRoot, 'content') },
  { notesDir: '', userDataDir: '' },
);

describe('imported content', () => {
  it('loads every lesson and question with no integrity problems', () => {
    expect(problems).toEqual([]);
    expect(course.lessons).toHaveLength(20);
    expect(course.questions.filter((q) => q.bank === 'pack')).toHaveLength(60);
    for (const l of course.lessons) {
      const qs = course.questions.filter((q) => q.lesson_id === l.id);
      expect(qs.filter((q) => q.kind === 'conceptual').length, l.id).toBeGreaterThanOrEqual(3);
      expect(qs.filter((q) => q.kind === 'calculation').length, l.id).toBeGreaterThanOrEqual(3);
      expect(course.guides[l.id], l.id).toBeTruthy();
    }
  });

  it('every numeric key passes its own checker, exactly and at 4 significant figures', () => {
    for (const q of course.questions.filter((x) => x.type === 'numeric')) {
      const g = q.grading as NumericGrading;
      const spec = { answer: q.answer as number, absolute_tolerance: g.absolute_tolerance, relative_tolerance: g.relative_tolerance, expect: g.expect };
      expect(checkNumeric(String(q.answer), spec).status, q.id).toBe('correct');
      const rounded = Number((q.answer as number).toPrecision(4)).toString();
      expect(['correct', 'correct-rounded'], `${q.id} ${rounded}`).toContain(checkNumeric(rounded, spec).status);
    }
  });

  it('only the R² question expects a percent', () => {
    const pct = course.questions.filter((q) => q.type === 'numeric' && (q.grading as NumericGrading).expect === 'percent').map((q) => q.id);
    expect(pct).toEqual(['q18-03']);
  });

  it('solutions are present and hints are progressive (at least two) for every question', () => {
    for (const q of course.questions) {
      expect(q.solution, q.id).toBeTruthy();
      expect(q.hints.length, q.id).toBeGreaterThanOrEqual(2);
      expect(q.steps?.length ?? 0, q.id).toBeGreaterThan(0);
    }
  });

  it('every link in lessons and pack documents resolves to an internal target or the web', () => {
    const docs = [...course.lessons.map((l) => ({ base: l.path, md: l.body_markdown })), ...course.docs.map((d) => ({ base: d.path, md: d.markdown }))];
    let n = 0;
    for (const { base, md } of docs) {
      for (const m of md.matchAll(/\]\(([^)]+)\)/g)) {
        const t = resolveHref(m[1], base, course);
        expect(t, `${base}: ${m[1]}`).not.toBeNull();
        if (m[1].includes('.pdf#page=')) {
          expect(t!.kind).toBe('pdf');
          expect((t as any).page).toBe(Number(/page=(\d+)/.exec(m[1])![1]));
        }
        n++;
      }
    }
    expect(n).toBeGreaterThan(50);
  });

  it('study:// links used in personal notes resolve', () => {
    expect(resolveHref('study://lesson/09-binomial', '', course)).toEqual({ kind: 'lesson', id: '09-binomial' });
    expect(resolveHref('study://source/lecture-09-23/4', '', course)).toEqual({ kind: 'pdf', sourceId: 'lecture-09-23', page: 4 });
    expect(resolveHref('study://question/q09-02', '', course)).toEqual({ kind: 'question', id: 'q09-02' });
  });
});

describe('study tips', () => {
  it('every tip has a known category, source and working in-app link', () => {
    expect(course.tips.tips.length).toBeGreaterThan(15);
    for (const t of course.tips.tips) {
      if (t.action) expect(parseStudyUrl(t.action.target), `${t.id} ${t.action.target}`).not.toBeNull();
    }
    // Every cited source is used, and every general study tip cites at least one source.
    const used = new Set(course.tips.tips.flatMap((t) => t.sources));
    for (const s of course.tips.sources) expect(used.has(s.id), s.id).toBe(true);
    for (const t of course.tips.tips.filter((x) => x.category === 'study')) expect(t.sources.length, t.id).toBeGreaterThan(0);
  });
});
