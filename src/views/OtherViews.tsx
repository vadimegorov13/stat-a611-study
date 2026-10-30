import { useEffect, useState } from 'react';
import { useData } from '../state/data.tsx';
import { useNav } from '../state/nav.tsx';
import { useNotes } from '../state/notes.tsx';
import { Markdown } from '../components/Markdown.tsx';
import { Badge, Empty, LessonChip, SourceChips, useOpen } from '../components/Bits.tsx';
import { NoteEditor } from '../components/NoteEditor.tsx';
import { TipCard } from '../components/QuickRef.tsx';
import { CoursePath, LessonGlyph, useNextLesson } from '../components/CoursePath.tsx';
import { fromHash, targetTitle } from '../lib/targets.ts';
import { lessonStats, recommendations, reviewQueue } from '../lib/practice.ts';
import { api } from '../lib/api.ts';

// ---------------- Home ----------------

/** One tip a day (rotates by date), with a link to the full list. */
function TipOfTheDay() {
  const { course } = useData();
  const tips = course.tips.tips;
  const day = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  const [offset, setOffset] = useState(0);
  if (!tips.length) return null;
  const tip = tips[(((day + offset) % tips.length) + tips.length) % tips.length];
  return (
    <section className="card tip-of-day">
      <div className="box-head">
        <h2>💡 Study tip</h2>
        <span>
          <button className="link" onClick={() => setOffset(offset + 1)}>
            Next tip
          </button>{' '}
          ·{' '}
          <button className="link" onClick={() => window.dispatchEvent(new CustomEvent('open-quickref', { detail: 'tips' }))}>
            All {tips.length} tips
          </button>
        </span>
      </div>
      <ul className="qr-list">
        <TipCard tip={tip} />
      </ul>
    </section>
  );
}

export function HomeView() {
  const { course, progress } = useData();
  const { navigate } = useNav();
  const { notes } = useNotes();
  const open = useOpen('main');
  const scope = Object.entries(progress.examChecklist)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const recs = recommendations(course, progress, scope).slice(0, 4);
  const queue = reviewQueue(course, progress).length;
  const last = progress.lastPosition ? fromHash(progress.lastPosition.route) : null;
  const studied = Object.keys(progress.studied).length;
  const attempted = new Set(progress.attempts.map((a) => a.questionId)).size;

  const next = useNextLesson();
  const nextStats = next ? lessonStats(course, progress, next.id) : null;

  return (
    <div className="home">
      <header className="home-head">
        <div className="eyebrow">STAT A611 · course path</div>
        <h1>Your course path</h1>
        <p className="lede">
          {studied} of {course.lessons.length} lessons studied · {attempted} of {course.questions.length} practice questions tried. Built from your{' '}
          {course.sources.length} lecture PDFs (Aug 24 – Oct 14, 2026).
        </p>
      </header>
      <div className="home-layout">
        <section className="rail-block up-next">
            {next ? (
              <>
                <div className="eyebrow">Up next</div>
                <div className="up-next-title">
                  <span className="up-next-icon">
                    <LessonGlyph id={next.id} />
                  </span>
                  <h2>{next.title}</h2>
                </div>
                <div className="quick">
                  <button className="primary" onClick={() => navigate({ kind: 'lesson', id: next.id })}>
                    {nextStats!.visits || nextStats!.attempted ? 'Continue lesson' : 'Start lesson'}
                  </button>
                  <button onClick={() => navigate({ kind: 'practice', mode: 'topic', lessonId: next.id })}>Quiz</button>
                </div>
              </>
            ) : (
              <>
                <div className="eyebrow">Path complete</div>
                <h2>Every lesson is marked studied</h2>
                <div className="quick">
                  <button className="primary" onClick={() => navigate({ kind: 'practice', mode: 'exam' })}>
                    Exam practice
                  </button>
                </div>
              </>
            )}
            {last && last.kind !== 'home' && (
              <p className="small muted">
                Last opened:{' '}
                <a href={progress.lastPosition!.route} onClick={(e) => (e.preventDefault(), navigate(last))}>
                  {targetTitle(last, course, notes)}
                </a>
              </p>
            )}
            <div className="quick">
              <button onClick={() => navigate({ kind: 'practice', mode: 'mixed' })}>Mixed practice</button>
              <button onClick={() => navigate({ kind: 'practice', mode: 'review' })}>Review queue ({queue})</button>
              <button
                onClick={() => {
                  navigate({ kind: 'notes' });
                  window.setTimeout(() => document.getElementById('new-note-title')?.focus(), 100);
                }}
              >
                New note
              </button>
            </div>
          </section>
        <aside className="home-rail">
          <TipOfTheDay />
          <section className="rail-block">
            <h2>What to study next</h2>
            {recs.length === 0 ? (
              <p className="small">Nothing stands out — every topic in scope has been studied and answered without help. Try exam practice to check under timed conditions.</p>
            ) : (
              <ol className="recs">
                {recs.map((r) => (
                  <li key={r.lessonId}>
                    <LessonChip id={r.lessonId} />
                    <span className="small">{r.reasons.join(' · ')}</span>
                  </li>
                ))}
              </ol>
            )}
            <p className="muted small">
              Based on your recorded attempts{scope.length ? ` within your exam checklist (${scope.length} topics)` : ' across all topics'}. A few answers are weak
              evidence; this is a to-do list, not a mastery score.{' '}
              <a href="#/progress" onClick={(e) => (e.preventDefault(), navigate({ kind: 'progress' }))}>
                Full progress →
              </a>
            </p>
          </section>
          <details className="rail-block exam-details">
            <summary>
              <h2>Final exam</h2>
              <span className="small muted">{course.exam.summary}</span>
            </summary>
            <ul className="small">
              {course.exam.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
            <p className="muted small">Source: {course.exam.syllabusSource}.</p>
          </details>
          <details className="rail-block">
            <summary>
              <h2>How content is labelled</h2>
            </summary>
            <p className="small">
              <Badge kind="instructor" /> the original lecture PDFs. <Badge kind="pack" /> lesson explanations synthesized from those notes (lecture examples are
              labelled). <Badge kind="supplemental" /> extra summaries added by this app. <Badge kind="practice" /> newly authored questions.{' '}
              <Badge kind="external" /> outside resources. <Badge kind="personal" /> your Markdown notes on disk.
            </p>
            <p className="small">
              Coverage stops at October 14: confidence intervals, hypothesis testing, the CLT, and full regression are not in these notes.{' '}
              <a href="#/issues" onClick={open({ kind: 'issues' })}>
                Source issues & review list
              </a>{' '}
              ·{' '}
              <a href="#/doc/coverage" onClick={open({ kind: 'doc', id: 'coverage' })}>
                Coverage map
              </a>
            </p>
          </details>
        </aside>
        <div className="home-main">
          <CoursePath />
        </div>
      </div>
    </div>
  );
}

// ---------------- Lectures ----------------

export function LecturesView() {
  const { course } = useData();
  const { navigate } = useNav();
  const open = useOpen('main');
  return (
    <div className="lectures">
      <h1>Lectures by date</h1>
      <p className="muted">Secondary view: the same lessons, organized by the lecture that introduced them.</p>
      <ul className="lecture-list">
        {course.sources.map((s) => {
          const lessons = course.lessons.filter((l) => l.sources.some((r) => r.source_id === s.id));
          return (
            <li key={s.id} className="card">
              <div className="lecture-row">
                <a href={`#/lecture/${s.id}`} onClick={(e) => (e.preventDefault(), navigate({ kind: 'lecture', id: s.id }))}>
                  <strong>{new Date(`${s.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}</strong>
                </a>
                <span className="muted small">{s.page_count} pages</span>
                <button onClick={open({ kind: 'pdf', sourceId: s.id, page: 1 })}>Open PDF</button>
              </div>
              {s.main_content && <p className="small">{s.main_content}</p>}
              <div>
                {lessons.map((l) => (
                  <LessonChip key={l.id} id={l.id} />
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function LectureView({ id, from = 'main' }: { id: string; from?: 'main' | 'pane' }) {
  const { course, sourcePages } = useData();
  const open = useOpen(from);
  const s = course.sources.find((x) => x.id === id);
  if (!s) return <Empty title={`No lecture ${id}`} />;
  const pages = Array.from({ length: s.page_count }, (_, i) => i + 1);
  return (
    <div className="lecture">
      <div className="eyebrow">Lecture notes</div>
      <h1>{new Date(`${s.date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h1>
      {s.main_content && <p className="lede">{s.main_content}</p>}
      <div className="lecture-meta">
        <button className="primary" onClick={open({ kind: 'pdf', sourceId: id, page: 1 })}>
          Open PDF
        </button>
        <Badge kind="instructor" />
        <span>{s.page_count} pages</span>
        <span title={s.reading_status}>· {s.path.split('/').pop()}</span>
      </div>
      <ol className="page-list">
        {pages.map((p) => {
          const citing = course.lessons.filter((l) => l.sources.some((r) => r.source_id === id && r.pages.includes(p)));
          const text = sourcePages?.find((x) => x.source_id === id && x.page === p)?.text ?? '';
          // Every page starts with the same running header ("STAT A411/611 14 October 2026"); skip it in the preview.
          const preview = text
            .replace(/\s+/g, ' ')
            .replace(/^STAT A?\d+\/\d+\s+\d{1,2}\s+[A-Z][a-z]+\s+\d{4}\s*/, '')
            .trim();
          return (
            <li key={p}>
              <a href={`#/pdf/${id}/${p}`} className="page-tile" onClick={open({ kind: 'pdf', sourceId: id, page: p })} aria-label={`Open page ${p} of the PDF`}>
                <small>Page</small>
                {p}
              </a>
              <div>
                <p className="page-preview">{preview ? `${preview.slice(0, 260)}${preview.length > 260 ? '…' : ''}` : 'No extracted text for this page.'}</p>
                {citing.length > 0 && (
                  <div className="page-topics">
                    Used in{' '}
                    {citing.map((l, i) => (
                      <span key={l.id}>
                        {i > 0 && ' · '}
                        <a href={`#/lesson/${l.id}`} onClick={open({ kind: 'lesson', id: l.id })}>
                          {l.title}
                        </a>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ---------------- Notes list ----------------

export function NotesView({ id }: { id?: string }) {
  const { notes, create } = useNotes();
  const { course } = useData();
  const { navigate } = useNav();
  const [filter, setFilter] = useState('');
  const [topic, setTopic] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const shown = notes.filter(
    (n) =>
      (!topic || n.topics.includes(topic)) &&
      (!filter || `${n.title} ${n.body} ${n.tags.join(' ')}`.toLowerCase().includes(filter.toLowerCase())),
  );
  const notesDir = course.paths.notesDir;
  return (
    <div className={`notes-view ${id ? 'with-editor' : ''}`}>
      <aside className="notes-list">
        <h1>Notes</h1>
        <form
          className="new-note-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const n = await create({ title: newTitle.trim() || 'Untitled note', topics: topic ? [topic] : [] });
            setNewTitle('');
            navigate({ kind: 'note', id: n.id });
          }}
        >
          <input id="new-note-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Title for a new note" aria-label="New note title" />
          <button className="primary" type="submit">
            + New
          </button>
        </form>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter notes…" aria-label="Filter notes" />
        <select value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Filter by topic">
          <option value="">All topics</option>
          {course.lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
        {shown.length === 0 && (
          <Empty title={notes.length ? 'No notes match.' : 'No notes yet.'}>
            {notes.length ? '' : 'Create one here, or from any lesson with “New note on this topic”.'}
          </Empty>
        )}
        <ul>
          {shown.map((n) => (
            <li key={n.id} className={n.id === id ? 'on' : ''}>
              <a href={`#/note/${n.id}`} onClick={(e) => (e.preventDefault(), navigate({ kind: 'note', id: n.id }))}>
                <strong>{n.title}</strong>
                <span className="muted small">
                  {new Date(n.updated).toLocaleString()} {n.tags.length ? `· ${n.tags.join(', ')}` : ''}
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="muted small">
          Stored as Markdown in{' '}
          <code className="path" title={notesDir}>
            study-app/user-data/notes/
          </code>
        </p>
      </aside>
      <section className="notes-main">{id ? <NoteEditor key={id} id={id} from="main" /> : <NotesHelp />}</section>
    </div>
  );
}

function NotesHelp() {
  const { course } = useData();
  return (
    <div className="notes-help">
      <h2>Personal notes are real files</h2>
      <p>
        Every note is a Markdown file with YAML frontmatter in <code className="path">{course.paths.notesDir}</code>. Edits autosave. If you or another program edits a
        file while the app runs, the app shows the new version within a few seconds, with a before/after diff — and if you had unsaved typing, it asks you which version
        to keep instead of overwriting anything.
      </p>
      <h3>Asking ChatGPT or Codex to edit a note</h3>
      <ol>
        <li>Open the note and press <strong>Copy context</strong> (select text first to include it).</li>
        <li>Paste into ChatGPT/Codex with your request, e.g. “Clarify the second paragraph and add a worked example.”</li>
        <li>
          An assistant with access to this folder (such as Codex or Claude Code running here) can edit the file directly; see <code>study-app/AGENTS.md</code>. A
          normal ChatGPT chat cannot reach your files — paste its answer into the note yourself.
        </li>
        <li>The app picks up the change, shows what changed, and keeps the previous version in History.</li>
      </ol>
    </div>
  );
}

// ---------------- Progress ----------------

export function ProgressView() {
  const { course, progress, setStudied, setExam, reloadProgress } = useData();
  const { navigate } = useNav();
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [backups, setBackups] = useState<{ name: string; path: string }[]>([]);
  const [resetOpen, setResetOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [parts, setParts] = useState({ attempts: true, flags: true, studied: true, scratch: false, exam: false, saved: false });
  useEffect(() => {
    api.backups().then(setBackups).catch(() => undefined);
  }, [backupMsg]);
  const checklist = progress.examChecklist;
  const anyChecked = Object.values(checklist).some(Boolean);
  const setCheck = (id: string, v: boolean) => setExam({ ...checklist, [id]: v });
  const totalAttempts = progress.attempts.length;
  const ud = course.paths.userDataDir;

  return (
    <div className="progress-view">
      <h1>Progress</h1>
      <p className="muted">
        “Studied” is your own completion mark. Performance columns come from recorded attempts only: first tries without help are counted separately from answers given
        with hints or after viewing a solution. {totalAttempts} attempt{totalAttempts === 1 ? '' : 's'} recorded.
      </p>
      <section className="card">
        <div className="row">
          <h2>Topics and exam checklist</h2>
          <span className="spacer" />
          <button onClick={() => setExam(Object.fromEntries(course.lessons.map((l) => [l.id, true])))}>Include all</button>
          <button onClick={() => setExam({})}>Clear checklist</button>
        </div>
        <p className="muted small">
          The syllabus describes a comprehensive final but the supplied notes stop at October 14. Tick the topics you expect on the exam; exam practice and “what to
          study next” use this list. {anyChecked ? '' : 'Nothing is ticked, so all topics are used.'}
        </p>
        <div className="table-wrap">
          <table className="progress-table">
            <thead>
              <tr>
                <th>On exam</th>
                <th>Topic</th>
                <th>Studied</th>
                <th>Opened</th>
                <th>Attempted</th>
                <th title="Questions whose first attempt was correct with no hints and no solution viewed">First try, no help</th>
                <th title="Latest attempt per question">Latest: ✓ / hints / ✗ / viewed</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {course.lessons.map((l) => {
                const s = lessonStats(course, progress, l.id);
                return (
                  <tr key={l.id}>
                    <td>
                      <input type="checkbox" checked={!!checklist[l.id]} onChange={(e) => setCheck(l.id, e.target.checked)} aria-label={`Include ${l.title} on exam`} />
                    </td>
                    <td>
                      <a href={`#/lesson/${l.id}`} onClick={(e) => (e.preventDefault(), navigate({ kind: 'lesson', id: l.id }))}>
                        {l.title}
                      </a>
                    </td>
                    <td>
                      <input type="checkbox" checked={s.studied} onChange={(e) => setStudied(l.id, e.target.checked)} aria-label={`${l.title} studied`} />
                    </td>
                    <td>{s.visits ? `${s.visits}×` : '—'}</td>
                    <td>
                      {s.attempted}/{s.total}
                    </td>
                    <td>{s.attempted ? `${s.firstTryUnaided}/${s.attempted}` : '—'}</td>
                    <td>
                      {s.attempted ? (
                        <>
                          <span className="good">{s.latest.unaided}</span> / {s.latest['with-hints']} / <span className="bad">{s.latest.incorrect}</span> / {s.latest.revealed}
                          {s.latest.pending ? ` (+${s.latest.pending} to assess)` : ''}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{s.flagged || ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2>Where your data lives</h2>
        <ul className="small paths">
          <li>
            Notes: <code className="path">{course.paths.notesDir}</code>
          </li>
          <li>
            Note history: <code className="path">{ud}/note-revisions/</code>
          </li>
          <li>
            Progress: <code className="path">{ud}/progress.json</code> · scratch work: <code className="path">{ud}/scratch.json</code>
          </li>
          <li>
            Backups: <code className="path">{ud}/backups/</code> · deleted notes: <code className="path">{ud}/trash/</code>
          </li>
        </ul>
        <div className="row">
          <button
            onClick={async () => {
              const r = await api.backup();
              setBackupMsg(`Backup written to ${r.path}`);
            }}
          >
            Back up notes & progress now
          </button>
          <a className="btn" href="/api/export" download>
            Export as JSON
          </a>
        </div>
        {backupMsg && <p className="small">{backupMsg}</p>}
        {backups.length > 0 && <p className="muted small">{backups.length} backups; latest: {backups[0].name}</p>}
      </section>

      <section className="card danger-zone">
        <h2>Reset progress</h2>
        <p className="small">
          Resets the progress categories you choose. <strong>Notes are never deleted by this.</strong> A backup of progress and notes is written first.
        </p>
        {!resetOpen ? (
          <button onClick={() => setResetOpen(true)}>Reset progress…</button>
        ) : (
          <div>
            {(
              [
                ['attempts', 'Attempts and lesson visits'],
                ['flags', 'Flags'],
                ['studied', '“Studied” marks'],
                ['scratch', 'Scratch work'],
                ['exam', 'Exam checklist and settings'],
                ['saved', 'Saved (starred) formulas and notation'],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="block">
                <input type="checkbox" checked={parts[k]} onChange={(e) => setParts({ ...parts, [k]: e.target.checked })} /> {label}
              </label>
            ))}
            <label className="block">
              Type <code>RESET PROGRESS</code> to confirm: <input value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="Confirmation text" />
            </label>
            <button
              className="danger"
              disabled={confirm !== 'RESET PROGRESS'}
              onClick={async () => {
                const r = await api.reset(parts, confirm);
                await reloadProgress();
                setBackupMsg(`Progress reset. Backup: ${r.backup}`);
                setResetOpen(false);
                setConfirm('');
              }}
            >
              Reset selected progress
            </button>
            <button onClick={() => setResetOpen(false)}>Cancel</button>
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------- Pack documents, issues, resources, glossary ----------------

export function DocView({ id, from = 'main' }: { id: string; from?: 'main' | 'pane' }) {
  const { course } = useData();
  const doc = course.docs.find((d) => d.id === id);
  if (!doc) return <Empty title={`No document “${id}”.`} />;
  return (
    <div className="doc-view">
      <div className="box-head">
        <span className="muted small">study-content/{doc.path}</span>
        <Badge kind="pack">Content-pack reference</Badge>
      </div>
      <Markdown source={doc.markdown} base={doc.path} from={from} />
    </div>
  );
}

export function IssuesView({ from = 'main' }: { from?: 'main' | 'pane' }) {
  const { course } = useData();
  const order = ['source-error', 'ambiguity', 'convention', 'scope', 'extraction'];
  const items = [...course.reviewItems].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  return (
    <div className="issues-view">
      <h1>Source issues and content needing review</h1>
      <p className="muted">
        Corrections, ambiguities, course conventions, and coverage limits found while preparing the content pack. Each links to the exact PDF pages so you can check the
        original. Ask your instructor about anything marked ambiguous.
      </p>
      <ul className="issues">
        {items.map((r) => (
          <li key={r.id} className="card">
            <div className="row">
              <span className={`status status-${r.status}`}>{r.status.replace('-', ' ')}</span>
              <strong>{r.title}</strong>
            </div>
            <p className="small">{r.detail}</p>
            {r.refs.length > 0 && <SourceChips refs={r.refs} from={from} compact />}
            {r.lessons.length > 0 && (
              <div>
                {r.lessons.map((l) => (
                  <LessonChip key={l} id={l} from={from} />
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ResourcesView({ from = 'main' }: { from?: 'main' | 'pane' }) {
  const { course } = useData();
  const open = useOpen(from);
  return (
    <div className="resources-view">
      <h1>External resources</h1>
      <p className="muted">
        These supplement your course notes. Each URL was checked on 2026-10-22. Some sites refuse to be shown inside other apps; those open in your browser. Every lesson
        also has topic web-search links, which are searches, not verified references.
      </p>
      <ul>
        {course.resources.map((r) => (
          <li key={r.id} className="card">
            <a href={r.url} onClick={open({ kind: 'web', url: r.url, title: r.title, label: 'curated' })}>
              <strong>{r.title}</strong>
            </a>{' '}
            <a href={r.url} target="_blank" rel="noreferrer" className="small">
              open in browser ↗
            </a>
            <p className="small">{r.description}</p>
            <p className="muted small">{r.verified}</p>
            <div>
              {r.topics.map((t) => (
                <LessonChip key={t} id={t} from={from} />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GlossaryView({ term, from = 'main' }: { term: string; from?: 'main' | 'pane' }) {
  const { course } = useData();
  const open = useOpen(from);
  const t = course.glossary.find((x) => x.term === term);
  if (!t) return <Empty title={`No glossary term “${term}”.`} />;
  const others = course.glossary.filter((x) => x.lesson_id === t.lesson_id && x.term !== term);
  return (
    <div className="glossary-view">
      <div className="box-head">
        <h2>{t.term}</h2>
        <Badge kind="pack">Glossary</Badge>
      </div>
      <p>{t.definition}</p>
      <p>
        Explained in <LessonChip id={t.lesson_id} from={from} />
      </p>
      {others.length > 0 && (
        <p className="small">
          Same lesson:{' '}
          {others.map((o) => (
            <a key={o.term} href={`#/glossary/${o.term}`} className="chip" onClick={open({ kind: 'glossary', term: o.term })}>
              {o.term}
            </a>
          ))}
        </p>
      )}
    </div>
  );
}
