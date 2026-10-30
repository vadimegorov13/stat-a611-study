import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useData } from '../state/data.tsx';
import { useNav } from '../state/nav.tsx';
import { useNotes } from '../state/notes.tsx';
import { buildDocs, noteDoc, SearchIndex, TYPE_LABEL, type Hit, type ResultType } from '../lib/search.ts';
import { TeX } from './Markdown.tsx';

const FILTERS: { label: string; types?: ResultType[] }[] = [
  { label: 'All' },
  { label: 'Lessons', types: ['lesson', 'section'] },
  { label: 'Formulas & terms', types: ['formula', 'term', 'notation'] },
  { label: 'Visualize', types: ['tool'] },
  { label: 'Practice', types: ['question'] },
  { label: 'My notes', types: ['note'] },
  { label: 'Lecture PDFs', types: ['source'] },
  { label: 'Reference', types: ['doc'] },
];

/** Highlight matched terms at word starts only, so short terms don't light up every letter. */
function highlight(text: string, terms: string[]) {
  const useful = terms.filter((t) => t.length >= 2);
  if (!useful.length) return text;
  const esc = useful.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length);
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(${esc.join('|')})`, 'giu');
  return text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part));
}

export function SearchPalette() {
  const { course, sourcePages } = useData();
  const { notes } = useNotes();
  const { searchOpen, setSearchOpen, openLink, settings } = useNav();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState(0);
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const index = useMemo(() => (sourcePages ? new SearchIndex(buildDocs(course, [], sourcePages)) : null), [course, sourcePages]);
  useEffect(() => {
    if (!index) return;
    const titles = new Map(course.lessons.map((l) => [l.id, l.title]));
    index.replaceNotes(notes.map((n) => noteDoc(n, titles)));
  }, [index, notes, course]);

  const hits: Hit[] = useMemo(() => (index && q.trim() ? index.search(q, FILTERS[filter].types) : []), [index, q, filter, notes]);

  useEffect(() => {
    if (searchOpen) {
      setSel(0);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  }, [searchOpen]);
  useEffect(() => setSel(0), [q, filter]);
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  if (!searchOpen) return null;

  const choose = (h: Hit, invert: boolean) => {
    setSearchOpen(false);
    openLink(h.doc.target, { from: 'main', invert });
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setSearchOpen(false);
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(hits.length - 1, s + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === 'Enter' && hits[sel]) {
      e.preventDefault();
      choose(hits[sel], e.metaKey || e.ctrlKey || e.altKey);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setFilter((f) => (f + (e.shiftKey ? FILTERS.length - 1 : 1)) % FILTERS.length);
    }
  };

  return (
    <div className="palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSearchOpen(false)}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Search course content" onKeyDown={onKey}>
        <div className="palette-input">
          <span aria-hidden>⌕</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search lessons, formulas, practice, notes, lecture PDFs…  (try “sd”, “σ”, “mgf”, “F(b)−F(a−1)”)"
            aria-label="Search"
            aria-controls="search-results"
            aria-activedescendant={hits[sel] ? `hit-${sel}` : undefined}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="palette-filters" role="tablist" aria-label="Result type">
          {FILTERS.map((f, i) => (
            <button key={f.label} role="tab" aria-selected={i === filter} className={i === filter ? 'on' : ''} onClick={() => setFilter(i)}>
              {f.label}
            </button>
          ))}
        </div>
        <ul className="palette-results" id="search-results" role="listbox" ref={listRef}>
          {!index && <li className="muted pad">Building the search index…</li>}
          {index && q.trim() && hits.length === 0 && (
            <li className="muted pad">No matches. Try a synonym (e.g. “standard deviation” / “sd”), a symbol, or fewer words.</li>
          )}
          {index && !q.trim() && (
            <li className="muted pad">
              {index.size} items indexed. ↑↓ to move, Enter to open {settings.linkMode === 'pane' ? 'beside the current view' : 'in the main view'}, ⌘/Ctrl+Enter for the other location, Tab to switch type.
            </li>
          )}
          {hits.map((h, i) => (
            <li
              key={h.doc.id}
              id={`hit-${i}`}
              role="option"
              aria-selected={i === sel}
              className={i === sel ? 'sel' : ''}
              onMouseEnter={() => setSel(i)}
              onClick={(e) => choose(h, e.metaKey || e.ctrlKey || e.altKey)}
            >
              <span className={`rtype rtype-${h.doc.type}`}>{TYPE_LABEL[h.doc.type]}</span>
              <div className="rbody">
                <div className="rtitle">{highlight(h.doc.title, h.terms)}</div>
                {h.doc.tex ? (
                  <div className="rformula">
                    <TeX tex={h.doc.tex} />
                  </div>
                ) : (
                  <div className="rsnippet">{highlight(h.snippet, h.terms)}</div>
                )}
                <div className="rcontext">{h.doc.context}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
