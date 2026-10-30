import { useEffect, useRef, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from 'react-resizable-panels';
import { DataProvider, useData } from './state/data.tsx';
import { NavProvider, useNav } from './state/nav.tsx';
import { NotesProvider, useNotes } from './state/notes.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { RefPane } from './components/RefPane.tsx';
import { TargetView } from './components/TargetView.tsx';
import { SearchPalette } from './components/SearchPalette.tsx';
import { QuickDock } from './components/QuickRef.tsx';
import { targetKey, targetTitle, toHash } from './lib/targets.ts';
import { useScrollMemory } from './lib/scrollMemory.ts';

function useMedia(query: string) {
  const [m, setM] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return m;
}

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);

function Shortcuts({ onClose }: { onClose: () => void }) {
  const rows: [string, string][] = [
    ['⌘/Ctrl + K', 'Search everything'],
    ['⌘/Ctrl + J', 'Quick reference: formulas, notation, saved items, notes, charts'],
    ['⌘/Ctrl + B', 'Show / hide the left sidebar'],
    ['⌘/Ctrl + Alt + B', 'Show / hide the reference pane'],
    ['⌘/Ctrl + Shift + F', 'Distraction-free study mode (Esc to leave)'],
    ['Alt + [  /  Alt + ]', 'Back / forward in the reference pane'],
    ['⌘/Ctrl/Alt + click a link', 'Open it in the other location (main vs. side pane)'],
    ['Enter (in an answer box)', 'Check the answer'],
    ['Arrow keys on a divider', 'Resize panes from the keyboard'],
    ['?', 'This list'],
  ];
  return (
    <div className="palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <h2>Keyboard shortcuts</h2>
        <table>
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k}>
                <td>
                  <kbd>{k}</kbd>
                </td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button autoFocus onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function MainArea({ mobile, onMobileDrawer }: { mobile: boolean; onMobileDrawer?: (d: 'left' | 'right') => void }) {
  const nav = useNav();
  const { course, progressError } = useData();
  const { notes } = useNotes();
  const scrollRef = useRef<HTMLDivElement>(null);
  const onScroll = useScrollMemory(scrollRef, toHash(nav.route), 'layout.mainScroll');
  const title = targetTitle(nav.route, course, notes);

  useEffect(() => {
    document.title = `${title} · STAT A611 Study`;
  }, [title]);

  return (
    <div className="main">
      {!nav.studyMode && (
        <header className="topbar">
          <button
            onClick={() => (mobile ? onMobileDrawer?.('left') : nav.setLeftOpen(!nav.leftOpen))}
            aria-label={mobile ? 'Show navigation' : nav.leftOpen ? 'Hide navigation' : 'Show navigation'}
            title="Navigation (⌘/Ctrl+B)"
          >
            ☰
          </button>
          <button onClick={() => history.back()} aria-label="Back">
            ‹
          </button>
          <button onClick={() => history.forward()} aria-label="Forward">
            ›
          </button>
          <h2 className="crumb">{title}</h2>
          <span className="spacer" />
          <select
            className="linkmode"
            value={nav.settings.linkMode}
            onChange={(e) => nav.setSettings({ linkMode: e.target.value as 'pane' | 'main' })}
            aria-label="Where internal links open"
            title="Where internal links open by default. ⌘/Ctrl/Alt-click does the opposite."
          >
            <option value="pane">Links → side pane</option>
            <option value="main">Links → main view</option>
          </select>
          <button onClick={() => nav.setSearchOpen(true)} aria-label="Search" title="Search (⌘/Ctrl+K)">
            ⌕
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-quickref', { detail: 'tips' }))}
            title="Study tips: how to learn statistics, course traps, exam strategy"
            aria-label="Study tips"
          >
            💡<span className="hide-narrow"> Tips</span>
          </button>
          <button onClick={() => nav.setStudyMode(true)} title="Study mode (⌘/Ctrl+Shift+F)">
            Focus
          </button>
          <details className="menu-wrap">
            <summary aria-label="View settings">⋯</summary>
            <div className="menu">
              <label className="menu-linkmode">
                Links open{' '}
                <select value={nav.settings.linkMode} onChange={(e) => nav.setSettings({ linkMode: e.target.value as 'pane' | 'main' })}>
                  <option value="pane">in the side pane</option>
                  <option value="main">in the main view</option>
                </select>
              </label>
              <label>
                Theme{' '}
                <select value={nav.settings.theme === 'dark' ? 'dark' : 'light'} onChange={(e) => nav.setSettings({ theme: e.target.value as 'light' | 'dark' })}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <button onClick={nav.resetLayout}>Reset layout</button>
              <button onClick={() => window.dispatchEvent(new CustomEvent('show-shortcuts'))}>Keyboard shortcuts</button>
            </div>
          </details>
          {!mobile && (
            <button onClick={() => nav.setRightOpen(!nav.rightOpen)} aria-label={nav.rightOpen ? 'Hide reference pane' : 'Show reference pane'} title="Reference pane (⌘/Ctrl+Alt+B)">
              ⇤
            </button>
          )}
          {mobile && (
            <button onClick={() => onMobileDrawer?.('right')} aria-label="Show reference pane">
              ⇤
            </button>
          )}
        </header>
      )}
      {nav.studyMode && (
        <button className="exit-study" onClick={() => nav.setStudyMode(false)}>
          Exit study mode (Esc)
        </button>
      )}
      {progressError && (
        <div className="banner error" role="alert">
          {progressError}
        </div>
      )}
      <div className={`main-scroll ${nav.studyMode ? 'study' : ''}`} ref={scrollRef} onScroll={onScroll} id="main-content">
        <TargetView key={targetKey(nav.route)} target={nav.route} from="main" />
      </div>
    </div>
  );
}

function Workspace() {
  const nav = useNav();
  const mobile = useMedia('(max-width: 899px)');
  const leftRef = useRef<ImperativePanelHandle>(null);
  const rightRef = useRef<ImperativePanelHandle>(null);
  const [help, setHelp] = useState(false);
  // Small screens: drawers start closed and are not persisted; opening a reference shows the right drawer.
  const [drawer, setDrawer] = useState<null | 'left' | 'right'>(null);
  const paneSeen = useRef(nav.pane);
  useEffect(() => {
    if (paneSeen.current === nav.pane) return;
    paneSeen.current = nav.pane;
    if (mobile) setDrawer('right');
  }, [nav.pane, mobile]);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer]);
  const studyRef = useRef(nav.studyMode);
  studyRef.current = nav.studyMode;
  // The panel library restores its own saved sizes shortly after mount; until then our flags are authoritative.
  const settleUntil = useRef(Date.now() + 500);
  useEffect(() => {
    settleUntil.current = Date.now() + 500;
  }, [nav.layoutVersion, mobile]);
  const ignorePanelEvent = () => studyRef.current || Date.now() < settleUntil.current;

  // Keep the panels in sync with the open/closed flags (and study mode, which hides both without forgetting them).
  useEffect(() => {
    if (mobile) return;
    const sync = (ref: React.RefObject<ImperativePanelHandle>, open: boolean) => {
      const p = ref.current;
      if (!p) return;
      if (open && p.isCollapsed()) p.expand();
      if (!open && !p.isCollapsed()) p.collapse();
    };
    const run = () => {
      sync(leftRef, nav.leftOpen && !nav.studyMode);
      sync(rightRef, nav.rightOpen && !nav.studyMode);
    };
    run();
    const timers = [60, 250, 600].map((ms) => window.setTimeout(run, ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [nav.leftOpen, nav.rightOpen, nav.studyMode, mobile, nav.layoutVersion]);

  useEffect(() => {
    const onShow = () => setHelp(true);
    window.addEventListener('show-shortcuts', onShow);
    return () => window.removeEventListener('show-shortcuts', onShow);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.code === 'KeyK') {
        e.preventDefault();
        nav.setSearchOpen(!nav.searchOpen);
      } else if (mod && e.altKey && e.code === 'KeyB') {
        e.preventDefault();
        nav.setRightOpen(!nav.rightOpen);
      } else if (mod && !e.altKey && e.code === 'KeyB') {
        e.preventDefault();
        nav.setLeftOpen(!nav.leftOpen);
      } else if (mod && e.shiftKey && e.code === 'KeyF') {
        e.preventDefault();
        nav.setStudyMode(!nav.studyMode);
      } else if (e.key === 'Escape' && nav.studyMode && !nav.searchOpen) {
        nav.setStudyMode(false);
      } else if (e.altKey && !mod && e.code === 'BracketLeft') {
        e.preventDefault();
        nav.paneBack();
      } else if (e.altKey && !mod && e.code === 'BracketRight') {
        e.preventDefault();
        nav.paneForward();
      } else if (e.key === '?' && !isTyping(e.target)) {
        setHelp(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nav]);

  const shellClass = `shell ${nav.studyMode ? 'study-mode' : ''}`;

  if (mobile) {
    return (
      <div className={`${shellClass} mobile`}>
        <MainArea mobile onMobileDrawer={setDrawer} />
        {drawer === 'left' && !nav.studyMode && (
          <div className="drawer-backdrop" onClick={() => setDrawer(null)}>
            <div className="drawer left" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Navigation">
              <Sidebar onNavigate={() => setDrawer(null)} />
            </div>
          </div>
        )}
        {drawer === 'right' && !nav.studyMode && (
          <div className="drawer-backdrop" onClick={() => setDrawer(null)}>
            <div className="drawer right" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Reference pane">
              <RefPane onClose={() => setDrawer(null)} />
            </div>
          </div>
        )}
        <SearchPalette />
        <QuickDock mobile />
        {help && <Shortcuts onClose={() => setHelp(false)} />}
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <a className="skip" href="#main-content">
        Skip to content
      </a>
      <PanelGroup key={nav.layoutVersion} direction="horizontal" autoSaveId="stat611-layout" className="panels">
        <Panel
          ref={leftRef}
          id="left"
          order={1}
          collapsible
          collapsedSize={0}
          defaultSize={19}
          minSize={13}
          maxSize={34}
          onCollapse={() => !ignorePanelEvent() && nav.setLeftOpen(false)}
          onExpand={() => !ignorePanelEvent() && nav.setLeftOpen(true)}
          className="panel-left"
        >
          <Sidebar />
        </Panel>
        <PanelResizeHandle className="resize-handle" aria-label="Resize navigation" />
        <Panel id="center" order={2} minSize={30} className="panel-center">
          <MainArea mobile={false} />
        </Panel>
        <PanelResizeHandle className="resize-handle" aria-label="Resize reference pane" />
        <Panel
          ref={rightRef}
          id="right"
          order={3}
          collapsible
          collapsedSize={0}
          defaultSize={34}
          minSize={20}
          maxSize={62}
          onCollapse={() => !ignorePanelEvent() && nav.setRightOpen(false)}
          onExpand={() => !ignorePanelEvent() && nav.setRightOpen(true)}
          className="panel-right"
        >
          <RefPane onClose={() => nav.setRightOpen(false)} />
        </Panel>
      </PanelGroup>
      <SearchPalette />
      <QuickDock mobile={false} />
      {help && <Shortcuts onClose={() => setHelp(false)} />}
    </div>
  );
}

export function App() {
  return (
    <DataProvider>
      <NavProvider>
        <NotesProvider>
          <Workspace />
        </NotesProvider>
      </NavProvider>
    </DataProvider>
  );
}
