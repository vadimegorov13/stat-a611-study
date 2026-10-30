import { useEffect, useRef, useState } from 'react';
import type { NoteRevision } from '../../shared/types.ts';
import { useData } from '../state/data.tsx';
import { useNav } from '../state/nav.tsx';
import { contentOf, useNotes, type Draft, type NoteContent } from '../state/notes.tsx';
import { api } from '../lib/api.ts';
import { load, save } from '../lib/persist.ts';
import { formatDate } from '../lib/targets.ts';
import { Markdown } from './Markdown.tsx';
import { contentText, DiffView } from './DiffView.tsx';
import { Badge, Empty } from './Bits.tsx';

type ViewMode = 'write' | 'split' | 'preview';

const ORIGIN_LABEL: Record<NoteRevision['origin'], string> = {
  app: 'Saved in app',
  external: 'External change detected',
  'conflict-draft': 'Unsaved draft kept during a conflict',
  'pre-restore': 'Before a restore',
  restore: 'Restored version',
  created: 'Created',
  'pre-delete': 'Before deletion',
};

export function SaveIndicator({ d }: { d: Draft }) {
  const text: Record<Draft['status'], string> = {
    saved: d.lastSavedAt ? `Saved ${new Date(d.lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Saved',
    dirty: 'Unsaved changes…',
    saving: 'Saving…',
    error: `Save failed — retrying (${d.error ?? 'error'})`,
    conflict: 'Conflict — choose a version',
    deleted: 'File missing on disk',
  };
  return (
    <span className={`save-ind save-${d.status}`} role="status" aria-live="polite">
      {text[d.status]}
    </span>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

export function NoteEditor({ id, from = 'main' }: { id: string; from?: 'main' | 'pane' }) {
  const { course } = useData();
  const { notes, drafts, ensureDraft, edit, remove, resolveConflict, dismissExternal, restore, saveDraftAsNew, connection } = useNotes();
  const { navigate, openInPane } = useNav();
  const [mode, setMode] = useState<ViewMode>(() => load(`noteview.${from}`, from === 'pane' ? 'write' : 'split'));
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [showRevs, setShowRevs] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [picker, setPicker] = useState<null | 'lesson' | 'question' | 'source'>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const selection = useRef('');

  useEffect(() => save(`noteview.${from}`, mode), [mode, from]);
  useEffect(() => {
    setLoadErr(null);
    ensureDraft(id).catch((e) => setLoadErr(e.message));
  }, [id, ensureDraft]);

  const d = drafts[id];
  const note = notes.find((n) => n.id === id);
  if (loadErr && !d) return <Empty title="This note could not be opened.">{loadErr} It may have been deleted or renamed on disk.</Empty>;
  if (!d) return <div className="loading">Opening note…</div>;

  const set = (patch: Partial<NoteContent>) => edit(id, patch);

  const rememberSelection = () => {
    const ta = taRef.current;
    const domSel = window.getSelection()?.toString() ?? '';
    if (ta && document.activeElement === ta && ta.selectionEnd > ta.selectionStart) selection.current = ta.value.slice(ta.selectionStart, ta.selectionEnd);
    else if (domSel) selection.current = domSel;
  };

  const copyContext = async () => {
    const topics = d.topics.map((t) => `${t} (${course.lessons.find((l) => l.id === t)?.title ?? 'unknown lesson'})`);
    const sel = selection.current.trim();
    const text = [
      'Personal note from my STAT A611 study app',
      `Note ID: ${id}`,
      `Title: ${d.title}`,
      `File: ${note?.absPath ?? '(unknown path)'}`,
      `Linked topics: ${topics.length ? topics.join('; ') : 'none'}`,
      d.tags.length ? `Tags: ${d.tags.join(', ')}` : '',
      sel ? `Selected text:\n${sel.split('\n').map((l) => `> ${l}`).join('\n')}` : 'Selected text: (none)',
      '',
      'If you can access my files: edit that Markdown file directly. Keep the YAML frontmatter and its `id` unchanged and do not rename the file. See study-app/AGENTS.md for the note format and study:// link syntax.',
    ]
      .filter((l) => l !== '')
      .join('\n');
    const ok = await copyText(text);
    setCopied(ok ? (sel ? 'Copied context with selection' : 'Copied context') : 'Copy failed');
    window.setTimeout(() => setCopied(null), 2500);
  };

  const insertAtCursor = (snippet: string) => {
    const ta = taRef.current;
    const body = d.body;
    const start = ta?.selectionStart ?? body.length;
    const end = ta?.selectionEnd ?? body.length;
    set({ body: body.slice(0, start) + snippet + body.slice(end) });
    setPicker(null);
    requestAnimationFrame(() => {
      if (ta) {
        ta.focus();
        ta.selectionStart = ta.selectionEnd = start + snippet.length;
      }
    });
  };

  const availableTopics = course.lessons.filter((l) => !d.topics.includes(l.id));

  return (
    <div className={`note-editor mode-${mode}`}>
      <div className="note-head">
        <input className="note-title" value={d.title} onChange={(e) => set({ title: e.target.value })} aria-label="Note title" placeholder="Note title" />
        <div className="note-toolbar">
          <SaveIndicator d={d} />
          <span className="seg" role="group" aria-label="Editor view">
            {(['write', 'split', 'preview'] as ViewMode[]).map((m) => (
              <button key={m} className={mode === m ? 'on' : ''} aria-pressed={mode === m} onClick={() => setMode(m)}>
                {m === 'write' ? 'Edit' : m === 'split' ? 'Split' : 'Preview'}
              </button>
            ))}
          </span>
          <button onMouseDown={rememberSelection} onClick={copyContext} title="Copy note ID, file path, linked topics, and any selected text for ChatGPT/Codex">
            Copy context
          </button>
          <button className={showRevs ? 'on' : ''} onClick={() => setShowRevs((v) => !v)} aria-expanded={showRevs}>
            History
          </button>
          {from === 'pane' ? (
            <button onClick={() => navigate({ kind: 'note', id })} title="Open in the main view">
              ⤢
            </button>
          ) : (
            <button onClick={() => openInPane({ kind: 'note', id })} title="Open beside (reference pane)">
              ⇥
            </button>
          )}
          <button className="danger-quiet" onClick={() => setConfirmDelete(true)} aria-label="Delete note">
            Delete
          </button>
        </div>
        {copied && <div className="toast" role="status">{copied}</div>}
      </div>

      {confirmDelete && (
        <div className="banner warn">
          Delete “{d.title}”? The file moves to <code>user-data/trash/</code> and its revision history is kept.
          <button
            className="danger"
            onClick={async () => {
              await remove(id);
              navigate({ kind: 'notes' });
            }}
          >
            Delete
          </button>
          <button onClick={() => setConfirmDelete(false)}>Cancel</button>
        </div>
      )}

      {d.status === 'conflict' && d.conflict && <ConflictPanel d={d} onResolve={(c) => resolveConflict(id, c)} />}

      {d.status === 'deleted' && (
        <div className="banner error" role="alert">
          This note's file is no longer on disk (deleted or renamed outside the app). Your text is still here.
          <button
            onClick={async () => {
              const n = await saveDraftAsNew(id);
              navigate({ kind: 'note', id: n.id });
            }}
          >
            Save as a new note
          </button>
        </div>
      )}

      {d.external && d.status !== 'conflict' && (
        <div className="banner info" role="status">
          <strong>Updated from disk</strong> —{' '}
          {d.external.source === 'external' ? 'the file was changed outside this app' : 'saved from another app window'} at{' '}
          {new Date(d.external.at).toLocaleTimeString()}. The editor now shows the new version; the previous one is in History.
          <button onClick={() => setShowDiff((v) => !v)} aria-expanded={showDiff}>
            {showDiff ? 'Hide changes' : 'View changes'}
          </button>
          <button onClick={() => dismissExternal(id)}>Dismiss</button>
          {showDiff && <DiffView before={contentText(d.external.before)} after={contentText(d.external.after)} beforeLabel="Previous version" afterLabel="External version" />}
        </div>
      )}

      {note?.warning && <div className="banner warn small">{note.warning}</div>}

      <div className="note-meta">
        <div className="topics">
          <span className="muted small">Topics:</span>
          {d.topics.map((t) => (
            <span key={t} className="chip removable">
              {course.lessons.find((l) => l.id === t)?.title ?? t}
              <button aria-label={`Remove topic ${t}`} onClick={() => set({ topics: d.topics.filter((x) => x !== t) })}>
                ×
              </button>
            </span>
          ))}
          <select
            value=""
            onChange={(e) => e.target.value && set({ topics: [...d.topics, e.target.value] })}
            aria-label="Add a linked topic"
          >
            <option value="">+ topic</option>
            {availableTopics.map((l) => (
              <option key={l.id} value={l.id}>
                {l.id} — {l.title}
              </option>
            ))}
          </select>
        </div>
        <label className="tags">
          <span className="muted small">Tags:</span>
          <TagInput value={d.tags} onChange={(tags) => set({ tags })} />
        </label>
      </div>

      {showRevs && <RevisionsPanel id={id} draft={d} onRestore={(rev) => restore(id, rev)} />}

      <div className="note-body">
        {mode !== 'preview' && (
          <div className="note-write">
            <div className="insert-bar">
              <span className="muted small">Insert link:</span>
              <button onClick={() => setPicker(picker === 'lesson' ? null : 'lesson')}>Lesson</button>
              <button onClick={() => setPicker(picker === 'question' ? null : 'question')}>Question</button>
              <button onClick={() => setPicker(picker === 'source' ? null : 'source')}>Lecture page</button>
              <span className="muted small math-hint">{'Math: $x^2$ inline, $$…$$ on its own line'}</span>
            </div>
            {picker && <LinkPicker kind={picker} onPick={insertAtCursor} onClose={() => setPicker(null)} />}
            <textarea
              ref={taRef}
              className="note-text"
              value={d.body}
              onChange={(e) => set({ body: e.target.value })}
              onSelect={rememberSelection}
              aria-label="Note text (Markdown)"
              placeholder={'Write in Markdown. Math with $…$ and $$…$$.\nLink course content: [binomial](study://lesson/09-binomial), [p. 4](study://source/lecture-09-23/4)'}
              spellCheck
            />
          </div>
        )}
        {mode !== 'write' && (
          <div className="note-preview" onMouseUp={rememberSelection}>
            {d.body.trim() ? <Markdown source={d.body} from={from} /> : <p className="muted">Nothing to preview yet.</p>}
          </div>
        )}
      </div>
      <footer className="note-foot small muted">
        <Badge kind="personal" /> ID <code>{id}</code> · file{' '}
        <code className="path" title={note?.absPath}>
          user-data/notes/{id}.md
        </code>{' '}
        <button
          className="linklike small"
          onClick={async () => {
            const ok = await copyText(note?.absPath ?? '');
            setCopied(ok ? 'Copied file path' : 'Copy failed');
            window.setTimeout(() => setCopied(null), 2000);
          }}
        >
          copy full path
        </button>{' '}
        ·{' '}
        {connection === 'live' ? 'watching for external edits' : 'checking for external edits every few seconds'}
      </footer>
    </div>
  );
}

function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(value.join(', '));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setText(value.join(', '));
  }, [value]);
  return (
    <input
      value={text}
      placeholder="comma, separated"
      onFocus={() => (focused.current = true)}
      onBlur={() => {
        focused.current = false;
        setText(value.join(', '));
      }}
      onChange={(e) => {
        setText(e.target.value);
        onChange(
          e.target.value
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        );
      }}
      aria-label="Tags"
    />
  );
}

function LinkPicker({ kind, onPick, onClose }: { kind: 'lesson' | 'question' | 'source'; onPick: (s: string) => void; onClose: () => void }) {
  const { course } = useData();
  const [lessonId, setLessonId] = useState(course.lessons[0].id);
  const [sourceId, setSourceId] = useState(course.sources[0].id);
  const [page, setPage] = useState(1);
  const src = course.sources.find((s) => s.id === sourceId)!;
  return (
    <div className="link-picker" role="dialog" aria-label={`Insert ${kind} link`}>
      {kind === 'lesson' && (
        <select autoFocus onChange={(e) => e.target.value && onPick(`[${course.lessons.find((l) => l.id === e.target.value)!.title}](study://lesson/${e.target.value})`)} defaultValue="">
          <option value="">Choose a lesson…</option>
          {course.lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.id} — {l.title}
            </option>
          ))}
        </select>
      )}
      {kind === 'question' && (
        <>
          <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} aria-label="Topic">
            {course.lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
          <select autoFocus onChange={(e) => e.target.value && onPick(`[question ${e.target.value}](study://question/${e.target.value})`)} defaultValue="">
            <option value="">Choose a question…</option>
            {course.questions
              .filter((q) => q.lesson_id === lessonId)
              .map((q) => (
                <option key={q.id} value={q.id}>
                  {q.id}: {q.prompt.replace(/\$/g, '').slice(0, 70)}
                </option>
              ))}
          </select>
        </>
      )}
      {kind === 'source' && (
        <>
          <select value={sourceId} onChange={(e) => (setSourceId(e.target.value), setPage(1))} aria-label="Lecture">
            {course.sources.map((s) => (
              <option key={s.id} value={s.id}>
                {formatDate(s.date)} ({s.page_count} pages)
              </option>
            ))}
          </select>
          <label>
            page <input type="number" min={1} max={src.page_count} value={page} onChange={(e) => setPage(Number(e.target.value))} style={{ width: '4em' }} />
          </label>
          <button onClick={() => onPick(`[${formatDate(src.date)} notes p. ${page}](study://source/${sourceId}/${page})`)}>Insert</button>
        </>
      )}
      <button onClick={onClose} aria-label="Close">
        ×
      </button>
    </div>
  );
}

function ConflictPanel({ d, onResolve }: { d: Draft; onResolve: (c: 'mine' | 'disk' | { merged: NoteContent }) => Promise<void> }) {
  const c = d.conflict!;
  const disk = contentOf(c.disk);
  const mine = contentOf(d);
  const [merging, setMerging] = useState(false);
  const [merged, setMerged] = useState(mine.body);
  const [busy, setBusy] = useState(false);
  const run = async (choice: 'mine' | 'disk' | { merged: NoteContent }) => {
    setBusy(true);
    try {
      await onResolve(choice);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="banner conflict" role="alert">
      <h4>This note changed on disk while you had unsaved edits</h4>
      <p className="small">
        {c.reason === 'save-rejected'
          ? 'Your last autosave was refused because the file on disk is newer.'
          : 'The file changed (outside this app or in another window) while you were typing.'}{' '}
        Nothing has been overwritten. Your draft was also kept in History. Choose how to continue:
      </p>
      <DiffView before={contentText(disk)} after={contentText(mine)} beforeLabel="Version on disk" afterLabel="Your unsaved draft" />
      {merging ? (
        <div className="merge">
          <div className="merge-cols">
            <div>
              <div className="muted small">On disk (read-only)</div>
              <textarea readOnly value={disk.body} aria-label="Version on disk" />
            </div>
            <div>
              <div className="muted small">Merged result (editable)</div>
              <textarea value={merged} onChange={(e) => setMerged(e.target.value)} aria-label="Merged result" />
            </div>
          </div>
          <button className="primary" disabled={busy} onClick={() => run({ merged: { ...mine, body: merged } })}>
            Save merged version
          </button>
          <button onClick={() => setMerging(false)}>Back</button>
        </div>
      ) : (
        <div className="conflict-actions">
          <button className="primary" disabled={busy} onClick={() => run('mine')}>
            Keep my draft
          </button>
          <button disabled={busy} onClick={() => run('disk')}>
            Use the disk version
          </button>
          <button disabled={busy} onClick={() => setMerging(true)}>
            Merge by hand…
          </button>
        </div>
      )}
    </div>
  );
}

function RevisionsPanel({ id, draft, onRestore }: { id: string; draft: Draft; onRestore: (rev: string) => Promise<void> }) {
  const [revs, setRevs] = useState<NoteRevision[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [selText, setSelText] = useState<{ title: string; body: string } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    api.revisions(id).then(setRevs).catch((e) => setMsg(e.message));
  }, [id, draft.baseVersion]);
  useEffect(() => {
    if (!sel) return setSelText(null);
    api.revision(id, sel).then((r) => setSelText({ title: r.title, body: r.body }));
  }, [id, sel]);
  return (
    <div className="revisions">
      <div className="rev-list">
        <h4>History</h4>
        <p className="muted small">Kept in user-data/note-revisions/{id}/. Autosaves within 10 minutes are combined.</p>
        {!revs && !msg && <p className="muted">Loading…</p>}
        {msg && <p className="error">{msg}</p>}
        <ul>
          {revs?.map((r, i) => (
            <li key={r.rev}>
              <button className={sel === r.rev ? 'on' : ''} onClick={() => setSel(r.rev)}>
                <span>{new Date(r.savedAt).toLocaleString()}</span>
                <span className={`rev-origin rev-${r.origin}`}>{i === 0 && r.version === draft.baseVersion ? 'Current · ' : ''}{ORIGIN_LABEL[r.origin]}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="rev-detail">
        {selText ? (
          <>
            <DiffView
              before={contentText({ ...selText, topics: [], tags: [] }).replace(/\[topics.*\n/, '')}
              after={contentText({ title: draft.title, body: draft.body, topics: [], tags: [] }).replace(/\[topics.*\n/, '')}
              beforeLabel="Selected revision"
              afterLabel="Current text"
            />
            <button
              className="primary"
              onClick={async () => {
                setMsg(null);
                try {
                  await onRestore(sel!);
                  setMsg('Restored. The previous text is kept in History.');
                  setSel(null);
                } catch (e) {
                  setMsg((e as Error).message);
                }
              }}
            >
              Restore this version
            </button>
          </>
        ) : (
          <p className="muted small">Select a revision to compare it with the current text.</p>
        )}
        {msg && <p className="small">{msg}</p>}
      </div>
    </div>
  );
}
