import { useEffect } from 'react';
import { useData } from '../state/data.tsx';
import { useNav } from '../state/nav.tsx';
import { useNotes } from '../state/notes.tsx';
import { Markdown, slug, TeX, InlineMd } from '../components/Markdown.tsx';
import { Badge, Empty, LessonChip, SourceChips, useOpen } from '../components/Bits.tsx';
import { guideFormulaId, LESSON_VIZ } from '../lib/refItems.ts';
import { targetTitle, toHash } from '../lib/targets.ts';
import { lessonQuestions, lessonStats, OUTCOME_LABEL, questionStatus } from '../lib/practice.ts';

export function webSearches(title: string) {
  const q = encodeURIComponent(`${title} statistics`);
  return [
    { label: 'Google', url: `https://www.google.com/search?q=${q}` },
    { label: 'Wikipedia', url: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(title)}` },
    { label: 'Penn State STAT 414 (site search)', url: `https://www.google.com/search?q=${encodeURIComponent(`site:online.stat.psu.edu ${title}`)}` },
  ];
}

export function LessonView({ id, from = 'main', anchor }: { id: string; from?: 'main' | 'pane'; anchor?: string }) {
  const { course, progress, setStudied, visit, setSaved } = useData();
  const { navigate, openInPane } = useNav();
  const { create, notes } = useNotes();
  const open = useOpen(from);
  const lesson = course.lessons.find((l) => l.id === id);
  const guide = course.guides[id];

  useEffect(() => {
    if (lesson && from === 'main') visit(lesson.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, from]);

  useEffect(() => {
    if (!anchor) return;
    const t = window.setTimeout(() => {
      const root = document.querySelector(from === 'pane' ? '.refpane-body' : '.main-scroll');
      const el = root?.querySelector(`#${CSS.escape(slug(anchor))}`) ?? root?.querySelector(`[data-heading="${CSS.escape(anchor)}"]`);
      el?.scrollIntoView({ block: 'start' });
    }, 80);
    return () => window.clearTimeout(t);
  }, [anchor, id, from]);

  if (!lesson) return <Empty title={`No lesson “${id}”.`}>It may have been renamed in the content pack.</Empty>;

  const idx = course.lessons.findIndex((l) => l.id === id);
  const prev = course.lessons[idx - 1];
  const next = course.lessons[idx + 1];
  const st = lessonStats(course, progress, id);
  const studied = !!progress.studied[id];
  const questions = lessonQuestions(course, id);
  const dependents = course.lessons.filter((l) => l.prerequisites.includes(id));
  const terms = course.glossary.filter((t) => t.lesson_id === id);
  const resources = course.resources.filter((r) => r.topics.includes(id));
  const issues = course.reviewItems.filter((r) => r.lessons.includes(id));
  const lessonNotes = notes.filter((n) => n.topics.includes(id));

  const newNote = async () => {
    const n = await create({ title: `Notes: ${lesson.title}`, topics: [id], body: '' });
    openInPane({ kind: 'note', id: n.id });
  };

  return (
    <article className={`lesson ${from === 'pane' ? 'compact' : ''}`}>
      <header className="lesson-head">
        <div className="eyebrow">
          Lesson {idx + 1} of {course.lessons.length} · Section {lesson.course_section} · <code>{lesson.id}</code>
        </div>
        <h1>{lesson.title}</h1>
        <div className="lesson-actions">
          <label className="studied-toggle">
            <input type="checkbox" checked={studied} onChange={(e) => setStudied(id, e.target.checked)} /> Marked as studied
          </label>
          <span className="muted small">
            Practice: {st.attempted}/{st.total} attempted
            {st.attempted > 0 && ` · ${st.firstTryUnaided} right first try without help`}
          </span>
          <button className="primary" onClick={() => navigate({ kind: 'practice', mode: 'topic', lessonId: id })}>Quiz this topic</button>
          <button onClick={newNote}>New note on this topic</button>
          {from === 'pane' && <button onClick={() => navigate({ kind: 'lesson', id })}>Open in main view</button>}
        </div>
        {lesson.prerequisites.length > 0 && (
          <div className="prereqs">
            <span className="muted small">Builds on:</span> {lesson.prerequisites.map((p) => <LessonChip key={p} id={p} from={from} />)}
          </div>
        )}
        <div className="sources-line">
          <span className="muted small">Lecture sources:</span> <SourceChips refs={lesson.sources} from={from} />
        </div>
      </header>

      {guide && (
        <section className="guide-box" aria-labelledby={`obj-${id}`}>
          <div className="box-head">
            <h2 id={`obj-${id}`}>Learning objectives</h2>
            <Badge kind="supplemental" />
          </div>
          <ul>
            {guide.objectives.map((o, i) => (
              <li key={i}>
                <InlineMd source={o} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="lesson-body">
        <div className="box-head">
          <span className="muted small">Explanation and worked examples</span>
          <Badge kind="pack" />
        </div>
        <Markdown source={lesson.body_markdown} base={lesson.path} from={from} />
        {(LESSON_VIZ[id] ?? []).length > 0 && (
          <p className="viz-links">
            <span className="muted small">See it: </span>
            {LESSON_VIZ[id].map((t) => (
              <a
                key={toHash(t)}
                href={toHash(t)}
                className="chip viz-chip"
                onClick={(e) => {
                  // Charts need width: main view by default, side pane with ⌘/Ctrl/Alt.
                  e.preventDefault();
                  if (e.metaKey || e.ctrlKey || e.altKey) openInPane(t);
                  else navigate(t);
                }}
              >
                📊 {targetTitle(t, course).replace(/^Visualize: /, '')}
                {t.kind === 'viz' && t.opt && t.tool === 'distributions' ? ` (${course.distributions.find((d) => d.id === t.opt)?.name ?? t.opt})` : ''}
              </a>
            ))}
          </p>
        )}
      </section>

      {guide && (
        <>
          <section className="guide-box">
            <div className="box-head">
              <h2 id={slug('How to recognize when this applies')}>How to recognize when this applies</h2>
              <Badge kind="supplemental" />
            </div>
            <ul>
              {guide.recognize.map((o, i) => (
                <li key={i}>
                  <InlineMd source={o} />
                </li>
              ))}
            </ul>
          </section>
          <section className="guide-box">
            <div className="box-head">
              <h2 id={slug('Key formulas')}>Key formulas and notation</h2>
              <Badge kind="supplemental" />
            </div>
            <dl className="formulas">
              {guide.key_formulas.map((f, i) => {
                const fid = guideFormulaId(id, f.label);
                const saved = !!progress.saved?.[fid];
                return (
                  <div key={i} className="formula-row">
                    <dt>
                      {f.label}
                      <button
                        className={`star ${saved ? 'on' : ''}`}
                        aria-pressed={saved}
                        aria-label={saved ? `Remove “${f.label}” from saved` : `Save “${f.label}”`}
                        title={saved ? 'Saved — click to remove' : 'Save to your quick reference'}
                        onClick={() => setSaved(fid, !saved).catch(() => undefined)}
                      >
                        {saved ? '★' : '☆'}
                      </button>
                    </dt>
                    <dd>
                      <TeX tex={f.tex} display />
                    </dd>
                  </div>
                );
              })}
            </dl>
            {course.notation.some((n) => n.lesson_id === id) && (
              <div className="lesson-notation">
                <span className="muted small">Notation: </span>
                {course.notation
                  .filter((n) => n.lesson_id === id)
                  .map((n) => (
                    <span key={n.id} className="notation-chip" title={n.name}>
                      <TeX tex={n.tex} /> <span className="small muted">{n.name}</span>
                    </span>
                  ))}
              </div>
            )}
            <p className="muted small">
              Assumptions and conditions are in the explanation above and in the{' '}
              <a href="#/doc/formula-reference" onClick={open({ kind: 'doc', id: 'formula-reference' })}>
                formula reference
              </a>
              .
            </p>
          </section>
          <section className="guide-box mistakes">
            <div className="box-head">
              <h2 id={slug('Common mistakes')}>Common mistakes and how to avoid them</h2>
              <Badge kind="supplemental" />
            </div>
            <ul>
              {guide.mistakes.map((o, i) => (
                <li key={i}>
                  <InlineMd source={o} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {issues.length > 0 && (
        <section className="guide-box issues-box">
          <div className="box-head">
            <h2>Source notes for this topic</h2>
          </div>
          <ul>
            {issues.map((r) => (
              <li key={r.id}>
                <strong>{r.title}.</strong> <span className={`status status-${r.status}`}>{r.status.replace('-', ' ')}</span> {r.detail}{' '}
                <SourceChips refs={r.refs} from={from} compact />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="practice-box">
        <div className="box-head">
          <h2>Practice ({questions.length})</h2>
          <button className="primary" onClick={() => navigate({ kind: 'practice', mode: 'topic', lessonId: id })}>
            Start topic quiz
          </button>
        </div>
        <ul className="qlist">
          {questions.map((q) => {
            const s = questionStatus(q, progress);
            return (
              <li key={q.id}>
                <a href={`#/question/${q.id}`} onClick={open({ kind: 'question', id: q.id })}>
                  <code>{q.id}</code> <InlineMd source={q.prompt.length > 110 ? `${q.prompt.slice(0, 110)}…` : q.prompt} />
                </a>
                <span className={`qstate qs-${s.latestOutcome ?? 'none'}`}>{s.latestOutcome ? OUTCOME_LABEL[s.latestOutcome] : 'Not attempted'}</span>
                {s.flagged && <span className="flag on small">⚑</span>}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="related-box">
        <h2>Related</h2>
        {guide && guide.related.length > 0 && (
          <div>
            <span className="muted small">Related sections:</span> {guide.related.map((r) => <LessonChip key={r} id={r} from={from} />)}
          </div>
        )}
        {dependents.length > 0 && (
          <div>
            <span className="muted small">Used later by:</span> {dependents.map((d) => <LessonChip key={d.id} id={d.id} from={from} />)}
          </div>
        )}
        {terms.length > 0 && (
          <div className="terms">
            <span className="muted small">Glossary:</span>{' '}
            {terms.map((t) => (
              <a key={t.term} href={`#/glossary/${t.term}`} className="chip" onClick={open({ kind: 'glossary', term: t.term })} title={t.definition}>
                {t.term}
              </a>
            ))}
          </div>
        )}
        {lessonNotes.length > 0 && (
          <div>
            <span className="muted small">My notes:</span>{' '}
            {lessonNotes.map((n) => (
              <a key={n.id} href={`#/note/${n.id}`} className="chip note-chip" onClick={open({ kind: 'note', id: n.id })}>
                {n.title}
              </a>
            ))}
          </div>
        )}
        <div className="external">
          <span className="muted small">Outside the course notes:</span>
          {resources.map((r) => (
            <a key={r.id} href={r.url} className="chip ext" onClick={open({ kind: 'web', url: r.url, title: r.title, label: 'curated' })}>
              {r.title} <Badge kind="external">verified URL</Badge>
            </a>
          ))}
          {webSearches(lesson.title).map((w) => (
            <a key={w.label} href={w.url} className="chip ext" onClick={open({ kind: 'web', url: w.url, title: `${w.label}: ${lesson.title}`, label: 'search' })}>
              {w.label} <Badge kind="external">web search</Badge>
            </a>
          ))}
        </div>
      </section>

      <nav className="lesson-nav" aria-label="Lesson sequence">
        {prev ? (
          <a href={`#/lesson/${prev.id}`} onClick={(e) => (e.preventDefault(), navigate({ kind: 'lesson', id: prev.id }))}>
            ← {prev.title}
          </a>
        ) : (
          <span />
        )}
        {next && (
          <a href={`#/lesson/${next.id}`} onClick={(e) => (e.preventDefault(), navigate({ kind: 'lesson', id: next.id }))}>
            {next.title} →
          </a>
        )}
      </nav>
      <p className="provenance small muted">
        Provenance: {lesson.origin}. Learning objectives, recognition cues, key-formula summaries, and common-mistake lists are supplemental study aids added
        by this app. Only the lecture PDFs are instructor material.
      </p>
    </article>
  );
}
