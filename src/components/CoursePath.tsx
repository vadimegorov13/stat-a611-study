// The home page's course path: every lesson as a node on a winding trail, grouped by unit.
// Nodes never lock; the path only suggests an order and shows what is done.
import type { ReactNode } from 'react';
import { useData } from '../state/data.tsx';
import { useNav } from '../state/nav.tsx';
import { lessonStats, type LessonStats } from '../lib/practice.ts';
import { courseUnits } from '../lib/units.ts';
import { useWidth } from './charts.tsx';

/** Small line drawings, one per lesson, in a 32×32 box drawn with currentColor. */
const GLYPHS: Record<string, ReactNode> = {
  '01-data': <path d="M5 27V17h5v10M11 27V9h5v18M17 27V13h5v14M23 27v-6h4v6M4 27h24" />,
  '02-summary': (
    <>
      <path d="M4 22h24" />
      <circle cx="8" cy="18" r="2" />
      <circle cx="14" cy="18" r="2" />
      <circle cx="14" cy="13" r="2" />
      <circle cx="20" cy="18" r="2" />
      <path d="M16 23l-3 4h6z" />
    </>
  ),
  '03-boxplots': <path d="M4 16h6M22 16h6M4 12v8M28 12v8M10 10h12v12H10zM16 10v12" />,
  '04-events': (
    <>
      <circle cx="12" cy="16" r="8" />
      <circle cx="20" cy="16" r="8" />
    </>
  ),
  '05-counting': (
    <>
      <circle cx="8" cy="9" r="2.5" />
      <circle cx="16" cy="9" r="2.5" />
      <circle cx="24" cy="9" r="2.5" />
      <path d="M8 13v4M16 13v4M24 13v4M5 24h22M8 20l8 4M24 20l-8 4" />
    </>
  ),
  '06-rules': <path d="M5 16l9-8M5 16l9 8M14 8l9-3M14 8l9 4M14 24l9-4M14 24l9 3" />,
  '07-expectation': <path d="M7 24V14M13 24V8M19 24V12M25 24V18M4 24h24M16 24l-3 4h6z" />,
  '08-geometric': <path d="M6 26V6M12 26V14M18 26V19M24 26v-4M4 26h24" />,
  '09-binomial': <path d="M6 26v-5M11 26V13M16 26V7M21 26V13M26 26v-5M4 26h24" />,
  '10-hypergeometric': (
    <>
      <path d="M9 8h14l-2 19H11z" />
      <circle cx="14" cy="21" r="2" />
      <circle cx="18.5" cy="16" r="2" />
      <circle cx="14" cy="13" r="2" />
    </>
  ),
  '11-poisson': (
    <>
      <path d="M4 20h24" />
      <circle cx="7" cy="20" r="1.8" />
      <circle cx="11" cy="20" r="1.8" />
      <circle cx="19" cy="20" r="1.8" />
      <circle cx="26" cy="20" r="1.8" />
      <path d="M16 6a5 5 0 1 0 0.01 0M16 8v3l2 1" />
    </>
  ),
  '12-continuous': <path d="M4 26h24M4 26c4 0 5-16 12-16s8 16 12 16M12 26V15M20 26V15" />,
  '13-gamma': <path d="M4 26h24M4 26c2-14 5-18 8-18s6 10 16 17" />,
  '14-spread-rules': <path d="M4 26h24M4 25c5 0 6-17 12-17s7 17 12 17M16 8v18M10 26v-9M22 26v-9" />,
  '15-mgf': <path d="M5 27c8 0 14-4 22-21M4 27h24M5 4v23" />,
  '16-joint': <path d="M6 6h20v20H6zM6 16h20M16 6v20M6 6l10 10" />,
  '17-covariance': (
    <>
      <path d="M4 28h24M4 4v24" />
      <circle cx="9" cy="22" r="1.8" />
      <circle cx="13" cy="19" r="1.8" />
      <circle cx="15" cy="23" r="1.8" />
      <circle cx="19" cy="14" r="1.8" />
      <circle cx="22" cy="16" r="1.8" />
      <circle cx="25" cy="9" r="1.8" />
    </>
  ),
  '18-regression': (
    <>
      <path d="M4 28h24M4 4v24M6 25L28 7" />
      <circle cx="10" cy="18" r="1.8" />
      <circle cx="15" cy="20" r="1.8" />
      <circle cx="19" cy="11" r="1.8" />
      <circle cx="24" cy="14" r="1.8" />
    </>
  ),
  '19-estimation': (
    <>
      <circle cx="16" cy="16" r="11" />
      <circle cx="16" cy="16" r="6" />
      <circle cx="16" cy="16" r="1.5" />
    </>
  ),
  '20-sampling': <path d="M4 26h24M4 26c5 0 6-6 12-6s7 6 12 6M10 26c3 0 3-18 6-18s3 18 6 18" />,
};

const FALLBACK_GLYPH = <path d="M8 26V6h12l4 4v16zM12 14h8M12 19h8" />;

/** Gentle zigzag, in node-widths from the centre line. */
const SWAY = [0, 1, 0, -1];
const ROW = 190; // vertical distance between node centres; leaves room for a two-line title below each node
const NODE_Y = 50; // first node centre below the top of the trail
const MAX_WIDTH = 440;

type NodeState = 'done' | 'next' | 'started' | 'todo';

function stateOf(st: LessonStats, isNext: boolean): NodeState {
  if (st.studied) return 'done';
  if (isNext) return 'next';
  return st.attempted || st.visits ? 'started' : 'todo';
}

export function CoursePath() {
  const { course, progress } = useData();
  const { navigate } = useNav();
  const units = courseUnits(course);
  const stats = Object.fromEntries(course.lessons.map((l) => [l.id, lessonStats(course, progress, l.id)]));
  const order = units.flatMap((u) => u.ids).filter((id) => stats[id]);
  const nextId = order.find((id) => !stats[id].studied);
  const allDone = !nextId;
  const [ref, measured] = useWidth<HTMLDivElement>(MAX_WIDTH);
  const width = Math.min(MAX_WIDTH, measured);
  const step = width * 0.2;
  let n = 0;

  return (
    <div className="course-path" ref={ref}>
      {units.map((u, ui) => {
        const ids = u.ids.filter((id) => stats[id]);
        const done = ids.filter((id) => stats[id].studied).length;
        const xs = ids.map((_, i) => width / 2 + SWAY[(n + i) % SWAY.length] * step);
        // One smooth curve through the node centres, drawn behind the nodes.
        const d = xs
          .map((x, i) => {
            const y = i * ROW + NODE_Y;
            if (i === 0) return `M${x} ${y}`;
            const py = (i - 1) * ROW + NODE_Y;
            return `C${xs[i - 1]} ${py + ROW / 2} ${x} ${y - ROW / 2} ${x} ${y}`;
          })
          .join(' ');
        const height = (ids.length - 1) * ROW + NODE_Y + 130;
        return (
          <section key={u.title} className="cp-unit" style={{ ['--unit' as string]: `var(--unit-${(ui % 5) + 1})` }} aria-label={`Unit ${ui + 1}: ${u.title}`}>
            <header className="cp-unit-head">
              <div>
                <div className="cp-unit-num">Unit {ui + 1}</div>
                <h2>{u.title}</h2>
              </div>
              <div className="cp-unit-meter" title={`${done} of ${ids.length} lessons marked studied`}>
                <span>
                  {done}/{ids.length}
                </span>
                <div className="cp-bar">
                  <i style={{ width: `${(done / ids.length) * 100}%` }} />
                </div>
              </div>
            </header>
            <ol className="cp-trail" style={{ height, width }}>
              <svg className="cp-line" width={width} height={height} aria-hidden>
                <path d={d} />
              </svg>
              {ids.map((id, i) => {
                const l = course.lessons.find((x) => x.id === id)!;
                const st = stats[id];
                const state = stateOf(st, id === nextId);
                const num = ++n;
                const answered = st.total ? st.attempted / st.total : 0;
                const weak = st.latest.incorrect + st.latest.revealed > 0;
                const status =
                  state === 'done' ? 'studied' : state === 'next' ? 'up next' : state === 'started' ? 'in progress' : 'not started';
                return (
                  <li key={id} className={`cp-node is-${state}`} style={{ left: xs[i], top: i * ROW + NODE_Y }}>
                    {state === 'next' && (
                      <span className="cp-bubble" aria-hidden>
                        {st.attempted || st.visits ? 'Continue' : 'Start'}
                      </span>
                    )}
                    <a
                      href={`#/lesson/${id}`}
                      className="cp-ring"
                      style={{ ['--answered' as string]: `${answered * 100}%` }}
                      aria-label={`Lesson ${num}: ${l.title}. ${status}. ${st.attempted} of ${st.total} questions attempted.`}
                      onClick={(e) => (e.preventDefault(), navigate({ kind: 'lesson', id }))}
                    >
                      <span className="cp-disc">
                        <svg viewBox="0 0 32 32" aria-hidden>
                          {GLYPHS[id] ?? FALLBACK_GLYPH}
                        </svg>
                      </span>
                      {state === 'done' && (
                        <span className="cp-badge done" aria-hidden>
                          ✓
                        </span>
                      )}
                      {weak && state !== 'done' && (
                        <span className="cp-badge weak" title="A latest answer was wrong or revealed" aria-hidden>
                          !
                        </span>
                      )}
                    </a>
                    <span className="cp-label">
                      <span className="cp-num">{num}</span> {l.title}
                    </span>
                    <span className="cp-meta">
                      {st.attempted}/{st.total} questions
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
      <section className={`cp-finish ${allDone ? 'is-ready' : ''}`} aria-label="Final exam">
        <a
          href="#/practice/exam"
          className="cp-ring"
          aria-label="Final exam: open exam practice"
          onClick={(e) => (e.preventDefault(), navigate({ kind: 'practice', mode: 'exam' }))}
        >
          <span className="cp-disc">
            <svg viewBox="0 0 32 32" aria-hidden>
              <path d="M8 28V4M8 5h16l-4 5 4 5H8" />
            </svg>
          </span>
        </a>
        <div className="cp-label">
          <strong>{course.exam.final?.label ?? 'Final exam'}</strong>
          {course.exam.final && (
            <span className="cp-meta">
              {new Date(course.exam.final.start).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · from the syllabus
            </span>
          )}
          <button className="primary" onClick={() => navigate({ kind: 'practice', mode: 'exam' })}>
            Exam practice
          </button>
        </div>
      </section>
    </div>
  );
}

/** The lesson the path suggests next: the first one, in unit order, not yet marked studied. */
export function useNextLesson() {
  const { course, progress } = useData();
  const order = courseUnits(course).flatMap((u) => u.ids);
  const id = order.find((x) => course.lessons.some((l) => l.id === x) && !progress.studied[x]);
  return id ? course.lessons.find((l) => l.id === id)! : null;
}

export function LessonGlyph({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className="cp-glyph">
      {GLYPHS[id] ?? FALLBACK_GLYPH}
    </svg>
  );
}
