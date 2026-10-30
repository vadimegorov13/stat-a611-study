import { useState } from 'react';
import { useData } from '../state/data.tsx';
import { useNav } from '../state/nav.tsx';
import { useNotes } from '../state/notes.tsx';
import { formatDate, type Target } from '../lib/targets.ts';
import { lessonStats, reviewQueue } from '../lib/practice.ts';
import { load, save } from '../lib/persist.ts';
import { ExamCountdown } from './ExamCountdown.tsx';
import { courseUnits } from '../lib/units.ts';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { course, progress } = useData();
  const { route, navigate, setSearchOpen, openLink } = useNav();
  const { notes } = useNotes();
  const [tab, setTabState] = useState<'topics' | 'lectures'>(() => load('layout.sidebarTab', 'topics'));
  const setTab = (t: 'topics' | 'lectures') => (setTabState(t), save('layout.sidebarTab', t));
  const queue = reviewQueue(course, progress).length;
  const go = (t: Target) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(t);
    onNavigate?.();
  };
  const active = (pred: boolean) => (pred ? 'on' : '');
  const units = courseUnits(course);

  return (
    <nav className="sidebar" aria-label="Course navigation">
      <div className="brand">
        <span className="logo" aria-hidden>
          σ
        </span>
        <div>
          <strong>STAT A611</strong>
          <div className="muted small">Study workspace</div>
        </div>
      </div>
      <ExamCountdown onNavigate={onNavigate} />
      <button className="search-btn" onClick={() => setSearchOpen(true)}>
        <span>⌕ Search</span>
        <kbd>⌘K</kbd>
      </button>
      <ul className="nav-main">
        <li>
          <a href="#/" className={active(route.kind === 'home')} onClick={go({ kind: 'home' })}>
            Home
          </a>
        </li>
        <li>
          <a href="#/practice/mixed" className={active(route.kind === 'practice' || route.kind === 'question')} onClick={go({ kind: 'practice', mode: 'mixed' })}>
            Practice
          </a>
          <a href="#/practice/review" className="sub" onClick={go({ kind: 'practice', mode: 'review' })}>
            Review queue <span className="count">{queue}</span>
          </a>
        </li>
        <li>
          <a href="#/notes" className={active(route.kind === 'notes' || route.kind === 'note')} onClick={go({ kind: 'notes' })}>
            My notes <span className="count">{notes.length}</span>
          </a>
        </li>
        <li>
          <a href="#/viz" className={active(route.kind === 'viz')} onClick={go({ kind: 'viz' })}>
            Visualize
          </a>
          <a href="#/viz/describe/boxplot" className="sub" onClick={go({ kind: 'viz', tool: 'describe', opt: 'boxplot' })}>
            Box plots, histograms…
          </a>
          <a href="#/viz/distributions" className="sub" onClick={go({ kind: 'viz', tool: 'distributions' })}>
            Distributions
          </a>
        </li>
        <li>
          <a href="#/reference" className={active(route.kind === 'reference')} onClick={go({ kind: 'reference' })}>
            Formulas & notation
            {Object.keys(progress.saved ?? {}).length > 0 && (
              <span className="count" title="Saved items">
                ★ {Object.keys(progress.saved ?? {}).length}
              </span>
            )}
          </a>
        </li>
        <li>
          <a href="#/progress" className={active(route.kind === 'progress')} onClick={go({ kind: 'progress' })}>
            Progress & exam checklist
          </a>
        </li>
      </ul>
      <div className="seg sidebar-tabs" role="tablist" aria-label="Browse by">
        <button role="tab" aria-selected={tab === 'topics'} className={tab === 'topics' ? 'on' : ''} onClick={() => setTab('topics')}>
          Topics
        </button>
        <button role="tab" aria-selected={tab === 'lectures'} className={tab === 'lectures' ? 'on' : ''} onClick={() => setTab('lectures')}>
          Lecture dates
        </button>
      </div>
      {tab === 'topics' ? (
        <div className="toc">
          {units.map((u) => (
            <div key={u.title} className="unit">
              <div className="unit-title">{u.title}</div>
              <ol>
                {u.ids.map((id) => {
                  const l = course.lessons.find((x) => x.id === id);
                  if (!l) return null;
                  const st = lessonStats(course, progress, id);
                  const perf = st.latest.incorrect + st.latest.revealed > 0 ? 'weak' : st.attempted === st.total && st.total > 0 ? 'done' : st.attempted ? 'some' : 'none';
                  return (
                    <li key={id}>
                      <a
                        href={`#/lesson/${id}`}
                        className={active(route.kind === 'lesson' && route.id === id)}
                        aria-current={route.kind === 'lesson' && route.id === id ? 'page' : undefined}
                        onClick={go({ kind: 'lesson', id })}
                      >
                        <span className={`mark ${st.studied ? 'studied' : ''}`} title={st.studied ? 'Marked studied' : 'Not marked studied'} aria-hidden>
                          {st.studied ? '✓' : ''}
                        </span>
                        <span className="toc-title">{l.title}</span>
                        <span className={`perf perf-${perf}`} title={`${st.attempted}/${st.total} questions attempted${st.latest.incorrect ? `, ${st.latest.incorrect} incorrect` : ''}`} />
                      </a>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      ) : (
        <ol className="toc lectures-toc">
          {course.sources.map((s) => (
            <li key={s.id}>
              <a href={`#/lecture/${s.id}`} className={active(route.kind === 'lecture' && route.id === s.id)} onClick={go({ kind: 'lecture', id: s.id })}>
                <strong>{formatDate(s.date)}</strong> <span className="muted small">{s.main_content}</span>
              </a>
            </li>
          ))}
          <li>
            <a href="#/lectures" onClick={go({ kind: 'lectures' })}>
              All lectures →
            </a>
          </li>
        </ol>
      )}
      <div className="refs-nav">
        <div className="unit-title">Reference</div>
        <a href="#/doc/formula-reference" onClick={(e) => (e.preventDefault(), openLink({ kind: 'doc', id: 'formula-reference' }, { invert: e.metaKey || e.ctrlKey }))}>
          Formula reference
        </a>
        <a href="#/issues" onClick={(e) => (e.preventDefault(), openLink({ kind: 'issues' }, { invert: e.metaKey || e.ctrlKey }))}>
          Source issues & review
        </a>
        <a href="#/doc/coverage" onClick={(e) => (e.preventDefault(), openLink({ kind: 'doc', id: 'coverage' }, { invert: e.metaKey || e.ctrlKey }))}>
          Coverage map
        </a>
        <a href="#/resources" onClick={(e) => (e.preventDefault(), openLink({ kind: 'resources' }, { invert: e.metaKey || e.ctrlKey }))}>
          External resources
        </a>
      </div>
    </nav>
  );
}
