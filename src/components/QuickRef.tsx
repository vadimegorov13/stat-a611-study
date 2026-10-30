// The quick-reference: every formula, symbol, distribution, term, saved star, and personal note in one searchable list.
// Shown in the floating dock (on every screen) and as a full page (#/reference).
import { useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '../state/data.tsx';
import { useNav } from '../state/nav.tsx';
import { useNotes } from '../state/notes.tsx';
import { buildRefItems, LESSON_VIZ, type RefItem, type RefKind } from '../lib/refItems.ts';
import { makeMatcher } from '../lib/search.ts';
import { load, save } from '../lib/persist.ts';
import { VIZ_TITLES, VIZ_TOOLS, mainOnly, targetTitle, toHash, type RefTab, type Target, type VizTool } from '../lib/targets.ts';
import { InlineMd, Markdown, TeX } from './Markdown.tsx';
import { parseStudyUrl } from '../lib/links.ts';
import { Badge, LessonChip, SourceChips } from './Bits.tsx';

const TABS: { id: RefTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'formulas', label: 'Formulas' },
  { id: 'notation', label: 'Notation' },
  { id: 'distributions', label: 'Distributions' },
  { id: 'terms', label: 'Terms' },
  { id: 'saved', label: 'Saved' },
  { id: 'notes', label: 'My notes' },
  { id: 'visualize', label: 'Visualize' },
  { id: 'tips', label: '💡 Tips' },
];

const TAB_KINDS: Partial<Record<RefTab, RefKind[]>> = {
  formulas: ['formula'],
  notation: ['notation'],
  distributions: ['distribution'],
  terms: ['term'],
};

const KIND_LABEL: Record<RefKind, string> = { formula: 'Formula', notation: 'Notation', distribution: 'Distribution', term: 'Term' };

export const VIZ_BLURB: Record<VizTool, string> = {
  describe: 'Histogram, ogive, box plot, dot plot and stem-and-leaf for lecture datasets, generated data, or numbers you paste.',
  distributions: 'Binomial, geometric, Poisson, normal, gamma… Move the parameters and shade any probability.',
  scatter: 'Paired data at any correlation: quadrants, R, R² and the least-squares line.',
  sampling: 'Draw many samples and watch how x̄ varies (σ²/n).',
  categorical: 'Bar graph and pie chart from category counts, with relative frequencies and angles.',
};

const PAGE = 60;

interface DockPrefs {
  tab: RefTab;
  q: string;
  onlyLesson: boolean;
}

export function QuickRef({
  variant,
  initialTab,
  autoFocus,
  request,
}: {
  variant: 'dock' | 'page';
  initialTab?: RefTab;
  autoFocus?: boolean;
  /** A tab requested from outside (e.g. the Tips button); `n` changes on every request. */
  request?: { tab: RefTab; n: number };
}) {
  const { course, progress } = useData();
  const nav = useNav();
  const [prefs, setPrefsState] = useState<DockPrefs>(() => ({ ...load('layout.quickref', { tab: 'all', q: '', onlyLesson: false }), ...(initialTab ? { tab: initialTab } : {}) }));
  const setPrefs = (p: Partial<DockPrefs>) =>
    setPrefsState((old) => {
      const next = { ...old, ...p };
      save('layout.quickref', next);
      return next;
    });
  useEffect(() => {
    if (initialTab) setPrefsState((o) => ({ ...o, tab: initialTab }));
  }, [initialTab]);
  useEffect(() => {
    if (request) setPrefs({ tab: request.tab });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.n]);
  const [limit, setLimit] = useState(PAGE);
  useEffect(() => setLimit(PAGE), [prefs.tab, prefs.q, prefs.onlyLesson]);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) searchRef.current?.focus();
  }, [autoFocus]);

  const items = useMemo(() => buildRefItems(course), [course]);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  // The lesson in view: the main route, or the active pane tab if the main view isn't a lesson.
  const viewLesson = nav.route.kind === 'lesson' ? nav.route.id : nav.paneTarget?.kind === 'lesson' ? nav.paneTarget.id : null;
  const onlyLesson = prefs.onlyLesson && viewLesson ? viewLesson : null;
  const match = makeMatcher(prefs.q);
  const literal = makeMatcher(prefs.q, false);

  const setTab = (tab: RefTab) => {
    setPrefs({ tab });
    if (variant === 'page') nav.navigate({ kind: 'reference', tab }, { replace: true });
  };

  let list: RefItem[] = [];
  let missingSaved: string[] = [];
  if (prefs.tab === 'saved') {
    const ids = Object.entries(progress.saved ?? {})
      .sort((a, b) => b[1].at.localeCompare(a[1].at))
      .map(([id]) => id);
    list = ids.map((id) => byId.get(id)).filter((x): x is RefItem => !!x);
    missingSaved = ids.filter((id) => !byId.has(id));
  } else if (prefs.tab !== 'notes' && prefs.tab !== 'visualize' && prefs.tab !== 'tips') {
    const kinds = TAB_KINDS[prefs.tab];
    list = kinds ? items.filter((i) => kinds.includes(i.kind)) : items;
  }
  if (onlyLesson) list = list.filter((i) => i.lessonId === onlyLesson);
  if (match) {
    // Title matches first (the exact words before synonyms), then the formula or definition, then matches only via the lesson title.
    const own = (i: RefItem) => `${i.tex ?? ''} ${i.body ?? ''} ${i.notation?.aliases ?? ''}`;
    const rank = (i: RefItem) => (literal!(i.title) ? 0 : match(i.title) ? 1 : literal!(own(i)) ? 2 : match(own(i)) ? 3 : 4);
    list = list
      .filter((i) => match(i.haystack))
      .map((i, k) => ({ i, k, r: rank(i) }))
      .sort((x, y) => x.r - y.r || x.k - y.k)
      .map((x) => x.i);
  }
  const savedCount = Object.keys(progress.saved ?? {}).length;

  return (
    <div className={`quickref quickref-${variant}`}>
      <div className="qr-controls">
        <input
          ref={searchRef}
          type="search"
          className="qr-search"
          placeholder={
            prefs.tab === 'notes' ? 'Search my notes…' : prefs.tab === 'tips' ? 'Search tips…' : 'Search formulas, symbols, terms… (try “sd”, “σ”, “binomial”)'
          }
          value={prefs.q}
          onChange={(e) => setPrefs({ q: e.target.value })}
          aria-label="Search the quick reference"
        />
        <div className="qr-tabs" role="tablist" aria-label="Reference sections">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={prefs.tab === t.id} className={prefs.tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
              {t.label}
              {t.id === 'saved' && savedCount > 0 && <span className="count">{savedCount}</span>}
            </button>
          ))}
        </div>
        {viewLesson && !['notes', 'visualize', 'tips'].includes(prefs.tab) && (
          <label className="qr-only small">
            <input type="checkbox" checked={prefs.onlyLesson} onChange={(e) => setPrefs({ onlyLesson: e.target.checked })} /> Only “
            {course.lessons.find((l) => l.id === viewLesson)?.title}”
          </label>
        )}
      </div>
      <div className="qr-body">
        {prefs.tab === 'notes' ? (
          <NotesList q={prefs.q} />
        ) : prefs.tab === 'visualize' ? (
          <VizList q={prefs.q} />
        ) : prefs.tab === 'tips' ? (
          <TipsList q={prefs.q} />
        ) : (
          <>
            <p className="qr-count muted small" aria-live="polite">
              {list.length} {list.length === 1 ? 'item' : 'items'}
              {prefs.tab === 'saved' && !savedCount && ' — star (☆) any formula, symbol or term to keep it here.'}
            </p>
            <ul className="qr-list">
              {list.slice(0, limit).map((i) => (
                <RefCard key={i.id} item={i} showKind={prefs.tab === 'all' || prefs.tab === 'saved'} />
              ))}
            </ul>
            {list.length > limit && (
              <button className="qr-more" onClick={() => setLimit(limit + PAGE)}>
                Show {Math.min(PAGE, list.length - limit)} more
              </button>
            )}
            {missingSaved.length > 0 && <MissingSaved ids={missingSaved} />}
          </>
        )}
      </div>
    </div>
  );
}

function MissingSaved({ ids }: { ids: string[] }) {
  const { setSaved } = useData();
  return (
    <div className="banner small">
      {ids.length} saved {ids.length === 1 ? 'item no longer exists' : 'items no longer exist'} in the course content.{' '}
      <button className="link" onClick={() => ids.forEach((id) => setSaved(id, false).catch(() => undefined))}>
        Remove {ids.length === 1 ? 'it' : 'them'}
      </button>
    </div>
  );
}

function RefCard({ item, showKind }: { item: RefItem; showKind: boolean }) {
  const { progress, setSaved } = useData();
  const { openLink } = useNav();
  const saved = !!progress.saved?.[item.id];
  const [copied, setCopied] = useState(false);
  const d = item.distribution;
  const open = (t: Target) => (e: React.MouseEvent) => {
    e.preventDefault();
    openLink(t, { invert: e.metaKey || e.ctrlKey || e.altKey });
  };
  const copy = async () => {
    const text = d ? `X \\sim ${d.notation}:\\ p(x) = ${d.pmf},\\ E[X] = ${d.mean},\\ V(X) = ${d.variance}` : (item.tex ?? item.body ?? item.title);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable: nothing to do */
    }
  };
  const vizFor = d ? ({ kind: 'viz', tool: 'distributions', opt: d.id } as Target) : null;
  return (
    <li className={`qr-item qr-${item.kind}`}>
      <div className="qr-head">
        {showKind && <span className="qr-kind">{KIND_LABEL[item.kind]}</span>}
        <strong className="qr-title">{item.title}</strong>
        <button
          className={`star ${saved ? 'on' : ''}`}
          aria-pressed={saved}
          aria-label={saved ? `Remove “${item.title}” from saved` : `Save “${item.title}”`}
          title={saved ? 'Saved — click to remove' : 'Save to your quick list'}
          onClick={() => setSaved(item.id, !saved).catch(() => undefined)}
        >
          {saved ? '★' : '☆'}
        </button>
      </div>
      {item.tex && !d && (
        <div className="qr-tex">
          <TeX tex={item.tex} display={item.kind === 'formula'} />
        </div>
      )}
      {item.body && (
        <div className="qr-text">
          <InlineMd source={item.body} />
        </div>
      )}
      {d && (
        <table className="qr-dist">
          <tbody>
            <tr>
              <th scope="row">Model</th>
              <td>
                <TeX tex={`X\\sim ${d.notation}`} />
              </td>
            </tr>
            <tr>
              <th scope="row">Support</th>
              <td>
                <TeX tex={d.support} />
              </td>
            </tr>
            <tr>
              <th scope="row">{d.type === 'discrete' ? 'p(x)' : 'f(x)'}</th>
              <td>
                <TeX tex={d.pmf} />
              </td>
            </tr>
            <tr>
              <th scope="row">E[X]</th>
              <td>
                <TeX tex={d.mean} />
              </td>
            </tr>
            <tr>
              <th scope="row">V(X)</th>
              <td>
                <TeX tex={d.variance} />
              </td>
            </tr>
          </tbody>
        </table>
      )}
      <div className="qr-meta small">
        <span className="muted">{item.from}</span>
        {item.provenance === 'supplemental' && <Badge kind="supplemental" />}
        {item.lessonId && <LessonChip id={item.lessonId} />}
        {item.refs && item.refs.length > 0 && <SourceChips refs={item.refs} compact />}
        {item.kind === 'term' && (
          <a href={toHash(item.target)} className="chip" onClick={open(item.target)}>
            Definition
          </a>
        )}
        {vizFor && (
          <a href={toHash(vizFor)} className="chip viz-chip" onClick={open(vizFor)}>
            📊 Plot it
          </a>
        )}
        {(item.tex || d) && (
          <button className="link copy-tex" onClick={copy} aria-label={`Copy LaTeX for ${item.title}`}>
            {copied ? 'Copied ✓' : 'Copy LaTeX'}
          </button>
        )}
      </div>
    </li>
  );
}

function NotesList({ q }: { q: string }) {
  const { notes, create } = useNotes();
  const { course } = useData();
  const { openLink, route } = useNav();
  const match = makeMatcher(q);
  const lessonTitle = (id: string) => course.lessons.find((l) => l.id === id)?.title ?? id;
  const list = [...notes]
    .filter((n) => !match || match(`${n.title} ${n.body} ${n.tags.join(' ')} ${n.topics.map(lessonTitle).join(' ')}`))
    .sort((a, b) => b.updated.localeCompare(a.updated));
  const newNote = async () => {
    const topic = route.kind === 'lesson' ? route.id : undefined;
    const n = await create({ title: q.trim() || 'Untitled note', topics: topic ? [topic] : [] });
    openLink({ kind: 'note', id: n.id });
  };
  return (
    <div>
      <div className="qr-notes-head">
        <span className="muted small">
          {list.length} of {notes.length} notes
        </span>
        <button onClick={newNote}>+ New note{q.trim() ? ` “${q.trim().slice(0, 30)}”` : ''}</button>
      </div>
      <ul className="qr-list">
        {list.map((n) => (
          <li key={n.id} className="qr-item qr-note">
            <a
              href={`#/note/${n.id}`}
              className="qr-note-link"
              onClick={(e) => {
                e.preventDefault();
                openLink({ kind: 'note', id: n.id }, { invert: e.metaKey || e.ctrlKey || e.altKey });
              }}
            >
              <strong>{n.title}</strong>
              <span className="muted small">
                {new Date(n.updated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                {n.topics.length > 0 && ` · ${n.topics.map(lessonTitle).join(', ')}`}
              </span>
              {n.body.trim() && <span className="qr-preview small">{n.body.replace(/\s+/g, ' ').slice(0, 140)}</span>}
            </a>
          </li>
        ))}
      </ul>
      {!notes.length && <p className="muted small">No notes yet. Notes are Markdown files in study-app/user-data/notes/.</p>}
    </div>
  );
}

function VizList({ q }: { q: string }) {
  const { navigate, openInPane, route } = useNav();
  const { course } = useData();
  const match = makeMatcher(q);
  const forLesson = route.kind === 'lesson' ? (LESSON_VIZ[route.id] ?? []) : [];
  const tools = VIZ_TOOLS.filter((t) => !match || match(`${VIZ_TITLES[t]} ${VIZ_BLURB[t]}`));
  // Charts need room, so they open in the main view unless ⌘/Ctrl/Alt-clicked.
  const openViz = (t: Target) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (e.metaKey || e.ctrlKey || e.altKey) openInPane(t);
    else navigate(t);
  };
  return (
    <div>
      {forLesson.length > 0 && route.kind === 'lesson' && (
        <div className="qr-viz-lesson">
          <div className="muted small">For “{course.lessons.find((l) => l.id === route.id)?.title}”</div>
          {forLesson.map((t) => (
            <a key={toHash(t)} href={toHash(t)} className="chip viz-chip" onClick={openViz(t)}>
              📊 {targetTitle(t, course).replace(/^Visualize: /, '')}
              {t.kind === 'viz' && t.opt ? ` · ${t.opt}` : ''}
            </a>
          ))}
        </div>
      )}
      <ul className="qr-list">
        {tools.map((t) => (
          <li key={t} className="qr-item">
            <a href={toHash({ kind: 'viz', tool: t })} className="qr-note-link" onClick={openViz({ kind: 'viz', tool: t })}>
              <strong>📊 {VIZ_TITLES[t]}</strong>
              <span className="qr-preview small">{VIZ_BLURB[t]}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className="muted small">Opens in the main view; ⌘/Ctrl/Alt-click opens it in the side pane.</p>
    </div>
  );
}

type Tip = ReturnType<typeof useData>['course']['tips']['tips'][number];

/** One study tip: body, a "try it" link into the app, and its research sources. */
export function TipCard({ tip }: { tip: Tip }) {
  const { course } = useData();
  const { navigate, openLink } = useNav();
  const target = tip.action ? parseStudyUrl(tip.action.target) : null;
  const sources = tip.sources.map((id) => course.tips.sources.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s);
  const go = (e: React.MouseEvent) => {
    if (!target) return;
    e.preventDefault();
    // Workspaces (practice, charts, notes list) need the main view; references honour the link setting.
    if (mainOnly(target) || target.kind === 'viz') navigate(target);
    else openLink(target, { invert: e.metaKey || e.ctrlKey || e.altKey });
  };
  return (
    <li className="qr-item tip">
      <div className="qr-head">
        <strong className="qr-title">{tip.title}</strong>
      </div>
      <div className="qr-text">
        <Markdown source={tip.body} />
      </div>
      <div className="qr-meta small">
        {target && tip.action && (
          <a href={toHash(target)} className="chip viz-chip" onClick={go}>
            → {tip.action.label}
          </a>
        )}
        {tip.lesson && <LessonChip id={tip.lesson} />}
        {sources.map((s) => (
          <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="tip-source" title={s.label}>
            {s.label.split(' — ')[0].split(',')[0]} ↗
          </a>
        ))}
        {!sources.length && <span className="muted">From the course conventions</span>}
      </div>
    </li>
  );
}

function TipsList({ q }: { q: string }) {
  const { course } = useData();
  const [cat, setCatState] = useState<string>(() => load('layout.tipsCat', 'all'));
  const setCat = (c: string) => (setCatState(c), save('layout.tipsCat', c));
  const match = makeMatcher(q);
  const { categories, tips, sources } = course.tips;
  const list = tips.filter((t) => (cat === 'all' || t.category === cat) && (!match || match(`${t.title} ${t.body}`)));
  return (
    <div>
      <div className="qr-tabs tip-cats" role="group" aria-label="Tip categories">
        {[{ id: 'all', title: 'All tips' }, ...categories].map((c) => (
          <button key={c.id} className={cat === c.id ? 'on' : ''} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
            {c.title}
          </button>
        ))}
      </div>
      {categories
        .filter((c) => list.some((t) => t.category === c.id))
        .map((c) => (
          <section key={c.id} className="tip-group">
            <h3 className="tip-cat">{c.title}</h3>
            <ul className="qr-list">
              {list
                .filter((t) => t.category === c.id)
                .map((t) => (
                  <TipCard key={t.id} tip={t} />
                ))}
            </ul>
          </section>
        ))}
      {!list.length && <p className="muted small">No tips match.</p>}
      <details className="small tip-sources">
        <summary>Sources and how these tips were chosen</summary>
        <p className="muted">
          General study tips summarise published learning research (links checked {'Oct 23, 2026'}); course tips restate conventions from your lessons. They are study aids
          added by this app, not instructor material.
        </p>
        <ul>
          {sources.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

/** Floating button + panel available on every screen. ⌘/Ctrl+J toggles it. */
export function QuickDock({ mobile }: { mobile: boolean }) {
  const nav = useNav();
  const [open, setOpenState] = useState<boolean>(() => load('layout.dockOpen', false));
  const setOpen = (o: boolean) => (setOpenState(o), save('layout.dockOpen', o));
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [request, setRequest] = useState<{ tab: RefTab; n: number } | undefined>();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.code === 'KeyJ') {
        e.preventDefault();
        setOpenState((o) => {
          save('layout.dockOpen', !o);
          return !o;
        });
      }
    };
    // Other controls (e.g. the Tips button) open the dock on a given tab.
    const onOpen = (e: Event) => {
      const tab = (e as CustomEvent<RefTab>).detail;
      setOpen(true);
      if (tab) setRequest((r) => ({ tab, n: (r?.n ?? 0) + 1 }));
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-quickref', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-quickref', onOpen);
    };
  }, []);

  // The full page already shows everything; the dock would duplicate it.
  if (nav.route.kind === 'reference') return null;

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          className={`qdock ${mobile ? 'mobile' : ''}`}
          role="dialog"
          aria-modal="false"
          aria-label="Quick reference: formulas, notation and notes"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              setOpen(false);
              btnRef.current?.focus();
            }
          }}
        >
          <div className="qdock-head">
            <strong>Quick reference</strong>
            <span className="spacer" />
            <button
              className="link"
              onClick={() => {
                setOpen(false);
                nav.navigate({ kind: 'reference', tab: load<DockPrefs>('layout.quickref', { tab: 'all', q: '', onlyLesson: false }).tab });
              }}
              title="Open as a full page"
            >
              Full page ↗
            </button>
            <button onClick={() => setOpen(false)} aria-label="Close quick reference">
              ✕
            </button>
          </div>
          <QuickRef variant="dock" autoFocus request={request} />
        </div>
      )}
      <button
        ref={btnRef}
        className={`qdock-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        title="Formulas, notation, saved items, notes and charts (⌘/Ctrl+J)"
      >
        <span aria-hidden className="fab-sym">
          ∑
        </span>
        <span className="fab-label">Formulas & notes</span>
        {!mobile && <kbd>⌘J</kbd>}
      </button>
    </>
  );
}
