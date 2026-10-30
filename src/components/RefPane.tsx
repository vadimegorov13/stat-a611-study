import { useEffect, useRef, useState } from 'react';
import { useNav } from '../state/nav.tsx';
import { useData } from '../state/data.tsx';
import { useNotes } from '../state/notes.tsx';
import { targetKey, targetTitle } from '../lib/targets.ts';
import { TargetView } from './TargetView.tsx';
import { useScrollMemory } from '../lib/scrollMemory.ts';

export function RefPane({ onClose }: { onClose: () => void }) {
  const { pane, activeTab, paneTarget, paneBack, paneForward, closeTab, switchTab, navigate, openInPane, setSearchOpen } = useNav();
  const { course } = useData();
  const { notes, create } = useNotes();
  const [menu, setMenu] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollKey = activeTab && paneTarget ? `${activeTab.id}|${targetKey(paneTarget)}|${activeTab.index}` : '';

  // Remember scroll position per tab entry so switching tabs or going back keeps your place.
  const onScroll = useScrollMemory(bodyRef, scrollKey, 'layout.paneScroll');

  useEffect(() => setMenu(false), [pane.active]);

  return (
    <aside className="refpane" aria-label="Reference pane">
      <div className="tabs" role="tablist" aria-label="Reference tabs">
        {pane.tabs.map((t) => {
          const cur = t.history[t.index];
          const title = targetTitle(cur, course, notes);
          return (
            <div key={t.id} className={`tab ${t.id === pane.active ? 'on' : ''}`} role="presentation">
              <button role="tab" aria-selected={t.id === pane.active} onClick={() => switchTab(t.id)} title={title}>
                <span className={`tab-kind k-${cur.kind}`} aria-hidden />
                {title}
              </button>
              <button className="tab-close" onClick={() => closeTab(t.id)} aria-label={`Close tab ${title}`}>
                ×
              </button>
            </div>
          );
        })}
        <div className="tab-add">
          <button onClick={() => setMenu((m) => !m)} aria-label="Open a new reference tab" aria-expanded={menu}>
            +
          </button>
          {menu && (
            <div className="menu" role="menu">
              <button role="menuitem" onClick={() => openInPane({ kind: 'doc', id: 'formula-reference' }, { newTab: true })}>
                Formula reference
              </button>
              <button role="menuitem" onClick={() => openInPane({ kind: 'issues' }, { newTab: true })}>
                Source issues
              </button>
              <button role="menuitem" onClick={() => openInPane({ kind: 'lectures' }, { newTab: true })}>
                Lectures by date
              </button>
              <button
                role="menuitem"
                onClick={async () => {
                  const n = await create({ title: 'New note' });
                  openInPane({ kind: 'note', id: n.id }, { newTab: true });
                }}
              >
                New note
              </button>
              <button role="menuitem" onClick={() => setSearchOpen(true)}>
                Search… (⌘/Ctrl K)
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="refpane-bar">
        <button onClick={paneBack} disabled={!activeTab || activeTab.index === 0} aria-label="Back in this tab" title="Back (Alt+[)">
          ←
        </button>
        <button
          onClick={paneForward}
          disabled={!activeTab || activeTab.index >= activeTab.history.length - 1}
          aria-label="Forward in this tab"
          title="Forward (Alt+])"
        >
          →
        </button>
        <span className="refpane-title">{paneTarget ? targetTitle(paneTarget, course, notes) : 'Reference pane'}</span>
        {paneTarget && (
          <button onClick={() => navigate(paneTarget)} title="Open this in the main view" aria-label="Open in main view">
            ⤢
          </button>
        )}
        <button onClick={onClose} aria-label="Collapse reference pane" title="Collapse (⌘/Ctrl+Alt+B)">
          ⇥
        </button>
      </div>
      <div className="refpane-body" ref={bodyRef} onScroll={onScroll}>
        {paneTarget ? (
          <TargetView key={activeTab!.id + targetKey(paneTarget)} target={paneTarget} from="pane" />
        ) : (
          <div className="empty">
            <strong>Nothing open here.</strong>
            <div className="small">
              Click a lesson link, a source-page chip, a glossary term, or a search result — it opens here without leaving your place in the main view.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
