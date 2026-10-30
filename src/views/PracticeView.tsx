import { useEffect, useMemo, useState } from 'react';
import type { Attempt, ExamSettings, Question, QuestionType } from '../../shared/types.ts';
import { useData } from '../state/data.tsx';
import { useNav } from '../state/nav.tsx';
import { QuestionCard } from '../components/QuestionCard.tsx';
import { Empty, LessonChip } from '../components/Bits.tsx';
import { InlineMd } from '../components/Markdown.tsx';
import { lessonQuestions, lessonStats, outcomeOf, reviewQueue, shuffle } from '../lib/practice.ts';
import { load, save, remove } from '../lib/persist.ts';
import type { PracticeMode } from '../lib/targets.ts';

interface Session {
  key: string;
  mode: PracticeMode;
  lessonId?: string;
  questionIds: string[];
  index: number;
  startedAt: number;
  timed: boolean;
  deadline?: number;
  finished?: boolean;
  timedOut?: boolean;
  attempts: Record<string, string>;
}

const sessionKey = (mode: PracticeMode, lessonId?: string) => `session.${mode}${lessonId ? `.${lessonId}` : ''}`;
const ALL_TYPES: QuestionType[] = ['multiple_choice', 'numeric', 'free_response'];
const TYPE_NAMES: Record<QuestionType, string> = { multiple_choice: 'Multiple choice', numeric: 'Numeric', free_response: 'Free response' };

export function PracticeView({ mode, lessonId }: { mode: PracticeMode; lessonId?: string }) {
  const { course } = useData();
  const key = sessionKey(mode, lessonId);
  const [session, setSessionState] = useState<Session | null>(() => load<Session | null>(key, null));
  useEffect(() => setSessionState(load<Session | null>(key, null)), [key]);
  const setSession = (s: Session | null) => {
    setSessionState(s);
    if (s) save(key, s);
    else remove(key);
  };

  const start = (ids: string[], opts?: { timed?: boolean; minutes?: number }) => {
    if (!ids.length) return;
    setSession({
      key,
      mode,
      lessonId,
      questionIds: ids,
      index: 0,
      startedAt: Date.now(),
      timed: !!opts?.timed,
      deadline: opts?.timed ? Date.now() + (opts.minutes ?? 30) * 60_000 : undefined,
      attempts: {},
    });
  };

  if (mode === 'topic' && lessonId && !course.lessons.some((l) => l.id === lessonId)) return <Empty title={`Unknown topic ${lessonId}`} />;

  return (
    <div className="practice">
      <PracticeHeader mode={mode} lessonId={lessonId} />
      {session ? (
        <SessionRunner session={session} setSession={setSession} />
      ) : mode === 'topic' ? (
        lessonId ? (
          <TopicStart lessonId={lessonId} onStart={start} />
        ) : (
          <TopicPicker />
        )
      ) : mode === 'review' ? (
        <ReviewStart onStart={start} />
      ) : (
        <ConfigStart mode={mode} onStart={start} />
      )}
    </div>
  );
}

function PracticeHeader({ mode, lessonId }: { mode: PracticeMode; lessonId?: string }) {
  const { navigate } = useNav();
  const { course, progress } = useData();
  const queue = reviewQueue(course, progress).length;
  const tabs: { mode: PracticeMode; label: string }[] = [
    { mode: 'topic', label: 'Topic quiz' },
    { mode: 'mixed', label: 'Mixed practice' },
    { mode: 'exam', label: 'Exam practice' },
    { mode: 'review', label: `Review queue (${queue})` },
  ];
  return (
    <header className="practice-head">
      <h1>{mode === 'topic' && lessonId ? `Quiz: ${course.lessons.find((l) => l.id === lessonId)?.title}` : tabs.find((t) => t.mode === mode)!.label}</h1>
      <nav className="seg" aria-label="Practice modes">
        {tabs.map((t) => (
          <button key={t.mode} className={t.mode === mode ? 'on' : ''} aria-current={t.mode === mode ? 'page' : undefined} onClick={() => navigate({ kind: 'practice', mode: t.mode })}>
            {t.label}
          </button>
        ))}
      </nav>
      <p className="muted small">
        All questions are newly authored practice based on your notes — not assigned course exercises. Results distinguish first-try answers from answers given with
        hints or after viewing a solution.
      </p>
    </header>
  );
}

function TopicPicker() {
  const { course, progress } = useData();
  const { navigate } = useNav();
  return (
    <div className="topic-grid">
      {course.lessons.map((l, i) => {
        const st = lessonStats(course, progress, l.id);
        return (
          <button key={l.id} className="topic-card" onClick={() => navigate({ kind: 'practice', mode: 'topic', lessonId: l.id })}>
            <span className="muted small">
              {i + 1}. {l.course_section}
            </span>
            <strong>{l.title}</strong>
            <span className="small">
              {st.attempted}/{st.total} attempted{st.latest.incorrect ? ` · ${st.latest.incorrect} to retry` : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TopicStart({ lessonId, onStart }: { lessonId: string; onStart: (ids: string[]) => void }) {
  const { course } = useData();
  const qs = lessonQuestions(course, lessonId);
  return (
    <div className="start-card">
      <p>
        {qs.length} questions on <LessonChip id={lessonId} />: {qs.filter((q) => q.kind === 'conceptual').length} conceptual,{' '}
        {qs.filter((q) => q.kind === 'calculation').length} calculation/interpretation. Hints and solutions are available; using them is recorded.
      </p>
      <button className="primary" onClick={() => onStart(qs.map((q) => q.id))}>
        Start quiz
      </button>
    </div>
  );
}

function TopicSelector({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const { course, progress } = useData();
  const checklist = Object.entries(progress.examChecklist)
    .filter(([, v]) => v)
    .map(([k]) => k);
  return (
    <fieldset className="topic-select">
      <legend>Topics</legend>
      <div className="row small">
        <button type="button" onClick={() => onChange(course.lessons.map((l) => l.id))}>
          All
        </button>
        <button type="button" onClick={() => onChange([])}>
          None
        </button>
        <button type="button" disabled={!checklist.length} onClick={() => onChange(checklist)} title="Use the topics checked in your exam checklist (Progress page)">
          Exam checklist ({checklist.length})
        </button>
      </div>
      <div className="topic-checks">
        {course.lessons.map((l) => (
          <label key={l.id}>
            <input
              type="checkbox"
              checked={selected.includes(l.id)}
              onChange={(e) => onChange(e.target.checked ? [...selected, l.id] : selected.filter((x) => x !== l.id))}
            />
            {l.title}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ConfigStart({ mode, onStart }: { mode: 'mixed' | 'exam'; onStart: (ids: string[], opts?: { timed?: boolean; minutes?: number }) => void }) {
  const { course, progress, setExam } = useData();
  const checklist = Object.entries(progress.examChecklist)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const saved = progress.examSettings;
  const [topics, setTopics] = useState<string[]>(() =>
    mode === 'exam' && saved.topics.length ? saved.topics : checklist.length ? checklist : course.lessons.map((l) => l.id),
  );
  const [count, setCount] = useState(mode === 'exam' ? saved.questionCount : 10);
  const [types, setTypes] = useState<QuestionType[]>(mode === 'exam' ? saved.includeTypes : ALL_TYPES);
  const [timed, setTimed] = useState(mode === 'exam' ? saved.timed : false);
  const [minutes, setMinutes] = useState(saved.minutes);
  const pool = course.questions.filter((q) => topics.includes(q.lesson_id) && types.includes(q.type));

  const begin = async () => {
    // Spread questions across topics: round-robin over shuffled per-topic lists.
    const seed = Date.now();
    const byTopic = topics.map((t) => shuffle(pool.filter((q) => q.lesson_id === t), seed + t.length));
    const picked: Question[] = [];
    for (let round = 0; picked.length < Math.min(count, pool.length); round++) {
      for (const list of shuffle(byTopic, seed + round)) if (list[round] && picked.length < count) picked.push(list[round]);
    }
    if (mode === 'exam') {
      const s: ExamSettings = { topics, questionCount: count, timed, minutes, includeTypes: types };
      setExam(undefined, s).catch(() => undefined);
    }
    onStart(shuffle(picked, seed).map((q) => q.id), { timed, minutes });
  };

  return (
    <div className="start-card config">
      {mode === 'exam' ? (
        <p>
          Exam practice hides feedback until you finish, so it shows what you can do unaided. Your answers are recorded as you go; solutions and a summary appear at
          the end. Optional timing uses a countdown.
        </p>
      ) : (
        <p>Mixed practice draws questions from several topics with immediate feedback, which helps with choosing the right method.</p>
      )}
      <TopicSelector selected={topics} onChange={setTopics} />
      <fieldset>
        <legend>Question types</legend>
        {ALL_TYPES.map((t) => (
          <label key={t}>
            <input type="checkbox" checked={types.includes(t)} onChange={(e) => setTypes(e.target.checked ? [...types, t] : types.filter((x) => x !== t))} />{' '}
            {TYPE_NAMES[t]}
          </label>
        ))}
      </fieldset>
      <div className="row">
        <label>
          Number of questions <input type="number" min={1} max={pool.length || 1} value={count} onChange={(e) => setCount(Math.max(1, Number(e.target.value)))} />
        </label>
        {mode === 'exam' && (
          <>
            <label>
              <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} /> Timed
            </label>
            {timed && (
              <label>
                Minutes <input type="number" min={1} max={300} value={minutes} onChange={(e) => setMinutes(Math.max(1, Number(e.target.value)))} />
              </label>
            )}
          </>
        )}
      </div>
      <p className="muted small">
        {pool.length} matching questions{count > pool.length ? `; the session will use all ${pool.length}` : ''}.
      </p>
      <button className="primary" disabled={!pool.length} onClick={begin}>
        Start {mode === 'exam' ? 'exam practice' : 'mixed practice'}
      </button>
    </div>
  );
}

function ReviewStart({ onStart }: { onStart: (ids: string[]) => void }) {
  const { course, progress } = useData();
  const queue = reviewQueue(course, progress);
  if (!queue.length)
    return (
      <Empty title="Your review queue is empty.">
        Questions appear here when you answer incorrectly, need hints or the solution, leave a free response unassessed, or flag something as confusing.
      </Empty>
    );
  return (
    <div className="start-card">
      <button className="primary" onClick={() => onStart(queue.map((e) => e.question.id))}>
        Retry all {queue.length}
      </button>
      <ul className="review-list">
        {queue.map((e) => (
          <li key={e.question.id}>
            <button onClick={() => onStart([e.question.id])} className="linklike">
              <code>{e.question.id}</code> <InlineMd source={e.question.prompt.slice(0, 120)} />
            </button>
            <div className="small muted">
              <LessonChip id={e.question.lesson_id} /> · {e.reasons.join(' · ')}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Countdown({ deadline, onExpire }: { deadline: number; onExpire: () => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const left = Math.max(0, deadline - now);
  useEffect(() => {
    if (left === 0) onExpire();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left === 0]);
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return (
    <span className={`countdown ${left < 120000 ? 'low' : ''}`} role="timer" aria-live={left < 60000 ? 'polite' : 'off'}>
      ⏱ {m}:{String(s).padStart(2, '0')} left
    </span>
  );
}

function SessionRunner({ session, setSession }: { session: Session; setSession: (s: Session | null) => void }) {
  const { course, progress } = useData();
  const questions = useMemo(
    () => session.questionIds.map((id) => course.questions.find((q) => q.id === id)).filter((q): q is Question => !!q),
    [session.questionIds, course.questions],
  );
  const isExam = session.mode === 'exam';
  const attemptsById = new Map(progress.attempts.map((a) => [a.id, a]));
  const sessionAttempt = (qid: string): Attempt | undefined => {
    const id = session.attempts[qid];
    return id ? attemptsById.get(id) : undefined;
  };
  const answered = questions.filter((q) => session.attempts[q.id]).length;
  const go = (i: number) => setSession({ ...session, index: Math.max(0, Math.min(questions.length - 1, i)) });
  const finish = (timedOut = false) => setSession({ ...session, finished: true, timedOut });
  const q = questions[session.index];

  if (session.finished) return <SessionResults session={session} questions={questions} sessionAttempt={sessionAttempt} onClose={() => setSession(null)} />;

  return (
    <div className="session">
      <div className="session-bar">
        <span>
          Question {session.index + 1} of {questions.length} · {answered} answered
        </span>
        {session.timed && session.deadline && <Countdown deadline={session.deadline} onExpire={() => finish(true)} />}
        <span className="spacer" />
        <button onClick={() => finish()} className={answered === questions.length ? 'primary' : ''}>
          {isExam ? 'Finish exam' : 'End session'}
        </button>
        <button onClick={() => setSession(null)} title="Discard this session (recorded attempts are kept)">
          Quit
        </button>
      </div>
      <ol className="qdots" aria-label="Questions in this session">
        {questions.map((x, i) => {
          const a = sessionAttempt(x.id);
          const st = !a ? 'none' : isExam ? 'answered' : outcomeOf(a);
          return (
            <li key={x.id}>
              <button className={`dot dot-${st} ${i === session.index ? 'current' : ''}`} onClick={() => go(i)} aria-label={`Question ${i + 1}${a ? ', answered' : ''}`} aria-current={i === session.index}>
                {i + 1}
              </button>
            </li>
          );
        })}
      </ol>
      {q && (
        <QuestionCard
          key={`${session.startedAt}-${q.id}`}
          q={q}
          index={session.index}
          mode={isExam ? 'exam' : 'practice'}
          sessionMode={session.mode}
          reviewAttempt={undefined}
          onAnswered={(a) => setSession({ ...session, attempts: { ...session.attempts, [q.id]: a.id } })}
        />
      )}
      <div className="session-nav">
        <button onClick={() => go(session.index - 1)} disabled={session.index === 0}>
          ← Previous
        </button>
        <button onClick={() => go(session.index + 1)} disabled={session.index >= questions.length - 1}>
          Next →
        </button>
      </div>
    </div>
  );
}

function SessionResults({
  session,
  questions,
  sessionAttempt,
  onClose,
}: {
  session: Session;
  questions: Question[];
  sessionAttempt: (qid: string) => Attempt | undefined;
  onClose: () => void;
}) {
  const { navigate } = useNav();
  const rows = questions.map((q) => ({ q, a: sessionAttempt(q.id) }));
  const answered = rows.filter((r) => r.a);
  const count = (o: string) => answered.filter((r) => outcomeOf(r.a!) === o).length;
  const elapsed = Math.round((Date.now() - session.startedAt) / 60000);
  return (
    <div className="results">
      <h2>{session.mode === 'exam' ? 'Exam practice results' : 'Session summary'}</h2>
      {session.timedOut && <p className="banner warn">Time ran out. Unanswered questions were left blank and are not counted as attempts.</p>}
      <div className="stat-row">
        <div className="stat">
          <strong>{answered.length}</strong>/{questions.length} answered
        </div>
        <div className="stat good">
          <strong>{count('unaided')}</strong> correct without help
        </div>
        <div className="stat">
          <strong>{count('with-hints')}</strong> correct with hints
        </div>
        <div className="stat bad">
          <strong>{count('incorrect')}</strong> incorrect
        </div>
        <div className="stat">
          <strong>{count('revealed')}</strong> viewed solution
        </div>
        {count('pending') > 0 && (
          <div className="stat">
            <strong>{count('pending')}</strong> to self-assess
          </div>
        )}
      </div>
      <p className="muted small">
        About {elapsed} min. One session is a small sample — treat this as feedback on these questions, not a mastery score.
      </p>
      <div className="row">
        <button className="primary" onClick={onClose}>
          New session
        </button>
        <button onClick={() => navigate({ kind: 'practice', mode: 'review' })}>Go to review queue</button>
        <button onClick={() => navigate({ kind: 'progress' })}>See progress</button>
      </div>
      <h3>Review each question</h3>
      {rows.map(({ q, a }, i) =>
        a ? (
          <QuestionCard key={q.id} q={q} index={i} mode="review" reviewAttempt={a} sessionMode={session.mode} />
        ) : (
          <div key={q.id} className="qcard unanswered">
            <strong>Q{i + 1} ({q.id})</strong> — not answered. <InlineMd source={q.prompt} />
            <div className="small muted">Practise it later from the topic quiz.</div>
          </div>
        ),
      )}
    </div>
  );
}

export function QuestionView({ id, from = 'main' }: { id: string; from?: 'main' | 'pane' }) {
  const { course } = useData();
  const q = course.questions.find((x) => x.id === id);
  if (!q) return <Empty title={`No question “${id}”.`} />;
  return (
    <div className="question-view">
      <QuestionCard key={q.id} q={q} from={from} sessionMode="single" />
    </div>
  );
}
