import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { fromHash, mainOnly, targetKey, toHash, type Target } from '../lib/targets.ts';
import { clearLayoutKeys, load, save } from '../lib/persist.ts';
import { api } from '../lib/api.ts';

export interface PaneTab {
  id: string;
  history: Target[];
  index: number;
}

interface PaneState {
  tabs: PaneTab[];
  active: string | null;
}

export type LinkMode = 'pane' | 'main';
export type Theme = 'system' | 'light' | 'dark';

interface Settings {
  linkMode: LinkMode;
  theme: Theme;
}

interface NavCtx {
  route: Target;
  navigate: (t: Target, opts?: { replace?: boolean }) => void;
  pane: PaneState;
  activeTab: PaneTab | null;
  paneTarget: Target | null;
  openInPane: (t: Target, opts?: { newTab?: boolean; inCurrentTab?: boolean }) => void;
  paneBack: () => void;
  paneForward: () => void;
  /** Update the current pane entry without adding history (e.g. a PDF page change). */
  paneReplace: (t: Target) => void;
  closeTab: (id: string) => void;
  switchTab: (id: string) => void;
  /** Follow an internal link. `from` says where the link was clicked; `invert` flips the link-mode setting. */
  openLink: (t: Target, opts?: { from?: 'main' | 'pane'; invert?: boolean }) => void;
  settings: Settings;
  setSettings: (s: Partial<Settings>) => void;
  leftOpen: boolean;
  rightOpen: boolean;
  studyMode: boolean;
  setLeftOpen: (v: boolean) => void;
  setRightOpen: (v: boolean) => void;
  setStudyMode: (v: boolean) => void;
  layoutVersion: number;
  resetLayout: () => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
}

const Ctx = createContext<NavCtx | null>(null);

export function useNav(): NavCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('NavProvider missing');
  return c;
}

const MAX_TABS = 10;
let tabSeq = Date.now();
const newTabId = () => `t${(tabSeq++).toString(36)}`;

const DEFAULT_PANE: PaneState = {
  tabs: [{ id: 'welcome', history: [{ kind: 'doc', id: 'formula-reference' }], index: 0 }],
  active: 'welcome',
};

export function NavProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Target>(() => fromHash(window.location.hash));
  const [pane, setPane] = useState<PaneState>(() => load('layout.pane', DEFAULT_PANE));
  const [settings, setSettingsState] = useState<Settings>(() => load('settings', { linkMode: 'pane', theme: 'light' }));
  const [leftOpen, setLeftOpenState] = useState<boolean>(() => load('layout.leftOpen', true));
  const [rightOpen, setRightOpenState] = useState<boolean>(() => load('layout.rightOpen', true));
  const [studyMode, setStudyModeState] = useState(false);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const positionTimer = useRef<number>();

  useEffect(() => {
    const onHash = () => setRoute(fromHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Remember the study position on disk so "continue where you left off" survives browsers and reinstalls.
  useEffect(() => {
    if (route.kind === 'home') return;
    window.clearTimeout(positionTimer.current);
    positionTimer.current = window.setTimeout(() => api.setPosition(toHash(route)).catch(() => undefined), 800);
  }, [route]);

  useEffect(() => save('layout.pane', pane), [pane]);
  useEffect(() => save('settings', settings), [settings]);
  useEffect(() => save('layout.leftOpen', leftOpen), [leftOpen]);
  useEffect(() => save('layout.rightOpen', rightOpen), [rightOpen]);

  useEffect(() => {
    const root = document.documentElement;
    // White unless dark is chosen explicitly; the OS appearance is deliberately ignored.
    root.setAttribute('data-theme', settings.theme === 'dark' ? 'dark' : 'light');
  }, [settings.theme]);

  const navigate = useCallback((t: Target, opts?: { replace?: boolean }) => {
    const hash = toHash(t);
    if (opts?.replace) {
      history.replaceState(null, '', hash);
      setRoute(t);
    } else if (window.location.hash !== hash) {
      window.location.hash = hash;
    } else {
      setRoute(t);
    }
  }, []);

  const openInPane = useCallback((t: Target, opts?: { newTab?: boolean; inCurrentTab?: boolean }) => {
    setRightOpenState(true);
    setPane((p) => {
      const key = targetKey(t);
      const active = p.tabs.find((x) => x.id === p.active);
      if (opts?.inCurrentTab && active) {
        const history = [...active.history.slice(0, active.index + 1), t];
        return { ...p, tabs: p.tabs.map((x) => (x.id === active.id ? { ...x, history, index: history.length - 1 } : x)) };
      }
      if (!opts?.newTab) {
        const existing = p.tabs.find((x) => targetKey(x.history[x.index]) === key);
        if (existing) {
          const cur = existing.history[existing.index];
          const same = JSON.stringify(cur) === JSON.stringify(t);
          const history = same ? existing.history : [...existing.history.slice(0, existing.index + 1), t];
          return {
            active: existing.id,
            tabs: p.tabs.map((x) => (x.id === existing.id ? { ...x, history, index: history.length - 1 } : x)),
          };
        }
      }
      const tab: PaneTab = { id: newTabId(), history: [t], index: 0 };
      let tabs = [...p.tabs, tab];
      while (tabs.length > MAX_TABS) {
        const drop = tabs.find((x) => x.id !== tab.id && x.id !== p.active) ?? tabs[0];
        tabs = tabs.filter((x) => x !== drop);
      }
      return { tabs, active: tab.id };
    });
  }, []);

  const updateActive = useCallback((fn: (t: PaneTab) => PaneTab) => {
    setPane((p) => ({ ...p, tabs: p.tabs.map((x) => (x.id === p.active ? fn(x) : x)) }));
  }, []);

  const paneBack = useCallback(() => updateActive((t) => ({ ...t, index: Math.max(0, t.index - 1) })), [updateActive]);
  const paneForward = useCallback(() => updateActive((t) => ({ ...t, index: Math.min(t.history.length - 1, t.index + 1) })), [updateActive]);
  const paneReplace = useCallback(
    (target: Target) => updateActive((t) => ({ ...t, history: t.history.map((h, i) => (i === t.index ? target : h)) })),
    [updateActive],
  );

  const closeTab = useCallback((id: string) => {
    setPane((p) => {
      const idx = p.tabs.findIndex((x) => x.id === id);
      const tabs = p.tabs.filter((x) => x.id !== id);
      const active = p.active === id ? (tabs[Math.min(idx, tabs.length - 1)]?.id ?? null) : p.active;
      return { tabs, active };
    });
  }, []);

  const switchTab = useCallback((id: string) => setPane((p) => ({ ...p, active: id })), []);

  const setSettings = useCallback((s: Partial<Settings>) => setSettingsState((x) => ({ ...x, ...s })), []);

  const openLink = useCallback(
    (t: Target, opts?: { from?: 'main' | 'pane'; invert?: boolean }) => {
      if (mainOnly(t)) return navigate(t);
      let dest: LinkMode = settings.linkMode;
      if (opts?.invert) dest = dest === 'pane' ? 'main' : 'pane';
      if (dest === 'main') return navigate(t);
      openInPane(t, { inCurrentTab: opts?.from === 'pane' });
    },
    [settings.linkMode, navigate, openInPane],
  );

  const resetLayout = useCallback(() => {
    clearLayoutKeys();
    setPane(DEFAULT_PANE);
    setLeftOpenState(true);
    setRightOpenState(true);
    setStudyModeState(false);
    setLayoutVersion((v) => v + 1);
  }, []);

  const activeTab = pane.tabs.find((x) => x.id === pane.active) ?? null;

  const value = useMemo<NavCtx>(
    () => ({
      route,
      navigate,
      pane,
      activeTab,
      paneTarget: activeTab ? activeTab.history[activeTab.index] : null,
      openInPane,
      paneBack,
      paneForward,
      paneReplace,
      closeTab,
      switchTab,
      openLink,
      settings,
      setSettings,
      leftOpen,
      rightOpen,
      studyMode,
      setLeftOpen: setLeftOpenState,
      setRightOpen: setRightOpenState,
      setStudyMode: setStudyModeState,
      layoutVersion,
      resetLayout,
      searchOpen,
      setSearchOpen,
    }),
    [route, navigate, pane, activeTab, openInPane, paneBack, paneForward, paneReplace, closeTab, switchTab, openLink, settings, setSettings, leftOpen, rightOpen, studyMode, layoutVersion, resetLayout, searchOpen],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
