import { useMemo, useRef, useState } from 'react';
import type { Attempt, NumericGrading, Question } from '../../shared/types.ts';
import { checkNumeric, type NumericResult } from '../../shared/answerCheck.ts';
import { useData } from '../state/data.tsx';
import { InlineMd } from './Markdown.tsx';
import { Badge, LessonChip, SourceChips } from './Bits.tsx';
import { OUTCOME_LABEL, outcomeOf, questionStatus } from '../lib/practice.ts';
import { useAnswerDraft } from '../lib/answerDrafts.ts';

export type CardMode = 'practice' | 'exam' | 'review';

interface Props {
  q: Question;
  mode?: CardMode;
  sessionMode?: Attempt['mode'];
  from?: 'main' | 'pane';
  /** In review mode: the attempt recorded during the exam. */
  reviewAttempt?: Attempt;
  onAnswered?: (a: Attempt) => void;
  index?: number;
}

const TYPE_LABEL = { multiple_choice: 'Multiple choice', numeric: 'Numeric', free_response: 'Free response' };

function inputHelp(g?: NumericGrading): string {
  if (g?.expect === 'percent') return 'Enter a percent, e.g. 64 or 64%. Fractions and expressions (e.g. 100*0.8^2) also work.';
  const base = 'Enter a number. Fractions (3/16) and expressions (exp(-2), 15/sqrt(25)) are accepted.';
  if (g?.expect === 'count') return `${base} Counts are whole numbers.`;
  if (g?.expect === 'value') return `${base} Keep at least 3–4 significant figures for non-integers.`;
  return `${base} Give probabilities as decimals (0.25) or with a % sign (25%). Sensible rounding (≥2 significant figures) is accepted.`;
}

export function QuestionCard({ q, mode = 'practice', sessionMode = 'single', from = 'main', reviewAttempt, onAnswered, index }: Props) {
  const { course, progress, scratch, setScratch, recordAttempt, updateAttempt, setFlag } = useData();
  const [draft, setDraft, clearDraft] = useAnswerDraft(q.id);
  const [response, setResponseState] = useState(reviewAttempt?.response ?? draft);
  const setResponse = (v: string) => {
    setResponseState(v);
    if (mode !== 'review') setDraft(v);
  };
  const [hints, setHints] = useState(reviewAttempt?.hintsUsed ?? 0);
  const [revealed, setRevealed] = useState(mode === 'review');
  const [confirmReveal, setConfirmReveal] = useState(false);
  const [attempt, setAttempt] = useState<Attempt | null>(reviewAttempt ?? null);
  const [numResult, setNumResult] = useState<NumericResult | null>(() =>
    reviewAttempt && q.type === 'numeric' ? checkNumeric(reviewAttempt.response, numSpec(q)) : null,
  );
  const [formatMsg, setFormatMsg] = useState<string | null>(null);
  const [rubric, setRubric] = useState<boolean[]>(() => (Array.isArray(q.answer) ? q.answer.map(() => false) : []));
  const [rubricSaved, setRubricSaved] = useState(reviewAttempt?.correct !== null && reviewAttempt?.correct !== undefined);
  const [flagReason, setFlagReason] = useState('');
  const [showFlag, setShowFlag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const started = useRef(Date.now());
  const status = questionStatus(q, progress);
  const flagged = !!progress.flags[q.id];
  const lesson = course.lessons.find((l) => l.id === q.lesson_id);
  // A reveal-only record is not kept in `attempt`, so the learner can still submit an answer afterwards.
  const submitted = !!attempt;
  const showFeedback = mode === 'practice' && submitted;
  const showSolution = mode !== 'exam' && (revealed || submitted);
  const hintList = q.hints;

  const correctness = useMemo(() => {
    if (!attempt || attempt.response === '') return null;
    if (q.type === 'multiple_choice') return Number(attempt.response) === q.answer;
    if (q.type === 'numeric') return attempt.correct;
    return attempt.correct;
  }, [attempt, q]);

  async function submit() {
    if (busy) return;
    setFormatMsg(null);
    setErr(null);
    let correct: boolean | null = null;
    if (q.type === 'multiple_choice') {
      if (response === '') return setFormatMsg('Choose an option first.');
      correct = Number(response) === q.answer;
    } else if (q.type === 'numeric') {
      const r = checkNumeric(response, numSpec(q));
      if (r.status === 'invalid' || r.status === 'needs-format') {
        setFormatMsg(r.message);
        return; // not graded, not recorded
      }
      setNumResult(r);
      correct = r.status === 'correct' || r.status === 'correct-rounded';
    } else {
      if (!response.trim()) return setFormatMsg('Write your reasoning before submitting (or reveal the solution).');
    }
    setBusy(true);
    try {
      const a = await recordAttempt({
        questionId: q.id,
        mode: sessionMode,
        response,
        correct,
        hintsUsed: hints,
        revealedBeforeSubmit: revealed,
        durationMs: Date.now() - started.current,
        ...(q.type === 'free_response' ? { rubricTotal: rubric.length } : {}),
      });
      setAttempt(a);
      clearDraft();
      onAnswered?.(a);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function reveal() {
    setConfirmReveal(false);
    setRevealed(true);
    if (!attempt) {
      try {
        const a = await recordAttempt({
          questionId: q.id,
          mode: sessionMode,
          response: '',
          correct: null,
          hintsUsed: hints,
          revealedBeforeSubmit: true,
          durationMs: Date.now() - started.current,
        });
        onAnswered?.(a);
      } catch (e) {
        setErr((e as Error).message);
      }
    }
  }

  async function saveRubric() {
    if (!attempt) return;
    const met = rubric.filter(Boolean).length;
    await updateAttempt(attempt.id, { correct: met === rubric.length, rubricMet: met, rubricTotal: rubric.length });
    setAttempt({ ...attempt, correct: met === rubric.length, rubricMet: met, rubricTotal: rubric.length });
    setRubricSaved(true);
  }

  function retry() {
    setAttempt(null);
    setResponse('');
    setHints(0);
    setRevealed(false);
    setNumResult(null);
    setFormatMsg(null);
    setRubric(Array.isArray(q.answer) ? q.answer.map(() => false) : []);
    setRubricSaved(false);
    started.current = Date.now();
  }

  async function toggleFlag() {
    if (flagged) await setFlag(q.id, false);
    else setShowFlag(true);
  }

  const locked = submitted && mode !== 'review';

  return (
    <article className={`qcard ${showFeedback ? (correctness ? 'is-correct' : correctness === false ? 'is-wrong' : '') : ''}`} aria-labelledby={`q-${q.id}-title`}>
      <header className="qcard-head">
        <div className="qmeta">
          {index !== undefined && <span className="qnum">Q{index + 1}</span>}
          <span id={`q-${q.id}-title`} className="qid">
            {q.id}
          </span>
          <span className="pill">{TYPE_LABEL[q.type]}</span>
          <span className="pill">{q.difficulty}</span>
          <span className="pill">{q.kind === 'conceptual' ? 'Conceptual' : 'Calculation / interpretation'}</span>
          <Badge kind="practice">{q.bank === 'pack' ? 'Generated practice (content pack)' : 'Generated practice (supplemental)'}</Badge>
        </div>
        <div className="qtopic">
          Topic: <LessonChip id={q.lesson_id} from={from} />
        </div>
        {status.attempts.length > 0 && mode === 'practice' && !attempt && (
          <div className="qhistory muted small">
            {status.attempts.length} earlier attempt{status.attempts.length > 1 ? 's' : ''} · latest: {OUTCOME_LABEL[status.latestOutcome!]}
          </div>
        )}
      </header>

      <div className="qprompt">
        <InlineMd source={q.prompt} />
      </div>

      <div className="qanswer">
        {q.type === 'multiple_choice' && (
          <fieldset disabled={locked || mode === 'review'}>
            <legend className="sr-only">Options</legend>
            {q.options!.map((o, i) => {
              const isKey = showFeedback && i === q.answer;
              const isPicked = response === String(i);
              return (
                <label key={i} className={`option ${isPicked ? 'picked' : ''} ${isKey ? 'key' : ''} ${showFeedback && isPicked && !isKey ? 'wrong' : ''}`}>
                  <input type="radio" name={`opt-${q.id}`} value={i} checked={isPicked} onChange={() => setResponse(String(i))} />
                  <span className="opt-letter">{String.fromCharCode(65 + i)}</span>
                  <span>
                    <InlineMd source={o} />
                  </span>
                </label>
              );
            })}
          </fieldset>
        )}
        {q.type === 'numeric' && (
          <div className="numeric-input">
            <label htmlFor={`num-${q.id}`}>Your answer{q.grading && 'units' in q.grading && q.grading.units ? ` (${q.grading.units})` : ''}</label>
            <input
              id={`num-${q.id}`}
              value={response}
              disabled={locked || mode === 'review'}
              onChange={(e) => setResponse(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              autoComplete="off"
              spellCheck={false}
              placeholder={(q.grading as NumericGrading)?.expect === 'percent' ? 'e.g. 64%' : 'e.g. 0.25'}
            />
            <p className="help small">{inputHelp(q.grading as NumericGrading)}</p>
          </div>
        )}
        {q.type === 'free_response' && (
          <div className="fr-input">
            <label htmlFor={`fr-${q.id}`}>Your answer and reasoning</label>
            <textarea id={`fr-${q.id}`} rows={4} value={response} disabled={locked || mode === 'review'} onChange={(e) => setResponse(e.target.value)} />
            <p className="help small">Free responses are not graded automatically. After submitting, compare with the rubric and record an honest self-assessment.</p>
          </div>
        )}
        {formatMsg && (
          <p className="format-msg" role="alert">
            {formatMsg}
          </p>
        )}
      </div>

      {mode !== 'review' && (
        <details className="scratch" open={!!scratch[q.id]?.text}>
          <summary>Scratch work {scratch[q.id]?.text ? '· saved' : ''}</summary>
          <textarea
            aria-label="Scratch work"
            rows={4}
            value={scratch[q.id]?.text ?? ''}
            onChange={(e) => setScratch(q.id, e.target.value)}
            placeholder="Work it out here. Saved automatically to user-data/scratch.json."
          />
        </details>
      )}

      {hints > 0 && (
        <ol className="hints" aria-live="polite">
          {hintList.slice(0, hints).map((h, i) => (
            <li key={i}>
              <strong>Hint {i + 1}.</strong> <InlineMd source={h} />
            </li>
          ))}
        </ol>
      )}

      <div className="qactions">
        {!locked && mode !== 'review' && (
          <>
            <button className="primary" onClick={submit} disabled={busy}>
              {mode === 'exam' ? 'Record answer' : 'Check answer'}
            </button>
            {hints < hintList.length && (
              <button onClick={() => setHints((h) => h + 1)}>
                {hints === 0 ? 'Show a hint' : 'Next hint'} ({hints}/{hintList.length})
              </button>
            )}
            {mode === 'practice' && !revealed && !confirmReveal && <button onClick={() => setConfirmReveal(true)}>Reveal solution</button>}
            {confirmReveal && (
              <span className="confirm">
                Reveal before answering? This is recorded as “viewed solution”.
                <button className="danger" onClick={reveal}>
                  Reveal
                </button>
                <button onClick={() => setConfirmReveal(false)}>Cancel</button>
              </span>
            )}
          </>
        )}
        {locked && mode === 'practice' && <button onClick={retry}>Try again</button>}
        {mode === 'exam' && locked && <span className="muted">Answer recorded — feedback appears when you finish the exam.</span>}
        <span className="spacer" />
        <button className={`flag ${flagged ? 'on' : ''}`} onClick={toggleFlag} aria-pressed={flagged} title="Flag as confusing; flagged questions appear in the review queue">
          {flagged ? '⚑ Flagged' : '⚐ Flag'}
        </button>
      </div>
      {showFlag && (
        <div className="flag-form">
          <input value={flagReason} onChange={(e) => setFlagReason(e.target.value)} placeholder="What's confusing? (optional)" aria-label="Flag reason" autoFocus />
          <button
            onClick={async () => {
              await setFlag(q.id, true, flagReason || undefined);
              setShowFlag(false);
              setFlagReason('');
            }}
          >
            Flag
          </button>
          <button onClick={() => setShowFlag(false)}>Cancel</button>
        </div>
      )}
      {err && (
        <p className="error" role="alert">
          {err}
        </p>
      )}

      {showFeedback && (
        <div className="feedback" role="status" aria-live="polite">
          {q.type === 'multiple_choice' && (
            <p>
              <strong>{correctness ? 'Correct.' : 'Not correct.'}</strong> The key is {String.fromCharCode(65 + (q.answer as number))}.
            </p>
          )}
          {q.type === 'numeric' && numResult && (
            <p>
              <strong>{numResult.status === 'incorrect' ? 'Not correct.' : 'Correct.'}</strong> {numResult.message.replace(/^(Correct|Not correct)\.?\s*/, '')}
            </p>
          )}
          {q.type === 'free_response' && <p>Submitted. Compare your answer with the rubric below and assess yourself honestly.</p>}
          {attempt && (
            <p className="muted small">
              Recorded as: {OUTCOME_LABEL[outcomeOf(attempt)]}
              {attempt.firstAttempt ? ' · first attempt' : ''}
              {attempt.hintsUsed ? ` · ${attempt.hintsUsed} hint${attempt.hintsUsed > 1 ? 's' : ''}` : ''}
            </p>
          )}
        </div>
      )}
      {mode === 'review' && reviewAttempt && (
        <div className="feedback">
          <p>
            Your answer: <strong>{q.type === 'multiple_choice' && reviewAttempt.response !== '' ? String.fromCharCode(65 + Number(reviewAttempt.response)) : reviewAttempt.response || '(none)'}</strong> —{' '}
            {OUTCOME_LABEL[outcomeOf(attempt ?? reviewAttempt)]}
          </p>
          {q.type === 'multiple_choice' && <p>Key: {String.fromCharCode(65 + (q.answer as number))}</p>}
          {q.type === 'numeric' && numResult && <p>{numResult.message}</p>}
        </div>
      )}

      {showSolution && (
        <section className="solution" aria-label="Solution">
          <h4>Solution</h4>
          {q.steps && q.steps.length > 0 ? (
            <ol className="steps">
              {q.steps.map((s, i) => (
                <li key={i}>
                  <InlineMd source={s} />
                </li>
              ))}
            </ol>
          ) : (
            <p>
              <InlineMd source={q.solution} />
            </p>
          )}
          {q.steps && (
            <p className="pack-solution">
              <span className="muted small">Answer-key summary:</span> <InlineMd source={q.solution} />
            </p>
          )}
          {q.reasoning && (
            <p className="reasoning">
              <strong>Why this works.</strong> <InlineMd source={q.reasoning} />
            </p>
          )}
          {q.type === 'free_response' && Array.isArray(q.answer) && (
            <div className="rubric">
              <h5>Rubric — tick each point your answer made</h5>
              {q.answer.map((item, i) => (
                <label key={i} className="rubric-item">
                  <input
                    type="checkbox"
                    checked={rubric[i]}
                    disabled={rubricSaved || !attempt || attempt.response === ''}
                    onChange={(e) => setRubric((r) => r.map((x, j) => (j === i ? e.target.checked : x)))}
                  />
                  <InlineMd source={item} />
                </label>
              ))}
              {attempt && attempt.response !== '' && !rubricSaved && (
                <button className="primary" onClick={saveRubric}>
                  Save self-assessment ({rubric.filter(Boolean).length}/{rubric.length})
                </button>
              )}
              {rubricSaved && attempt && (
                <p className="muted small">
                  Self-assessed: {attempt.rubricMet}/{attempt.rubricTotal} rubric points
                  {attempt.correct ? ' — recorded as correct' : ' — recorded as not yet complete'}.
                </p>
              )}
              {(!attempt || attempt.response === '') && <p className="muted small">Self-assessment applies to a submitted answer.</p>}
            </div>
          )}
          <div className="qrefs">
            <span className="muted small">Concepts practised (not a verbatim source):</span>
            <SourceChips refs={q.source_refs} from={from} compact />
            {q.related_lessons.length > 0 && (
              <div>
                Related: {q.related_lessons.map((l) => <LessonChip key={l} id={l} from={from} />)}
              </div>
            )}
            {lesson && <p className="muted small">Review the lesson “{lesson.title}” for the full explanation.</p>}
          </div>
        </section>
      )}
    </article>
  );
}

export function numSpec(q: Question) {
  const g = (q.grading ?? {}) as NumericGrading;
  return {
    answer: q.answer as number,
    absolute_tolerance: g.absolute_tolerance ?? 1e-4,
    relative_tolerance: g.relative_tolerance ?? 1e-3,
    expect: g.expect,
  };
}
