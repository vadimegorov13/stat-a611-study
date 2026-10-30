// Small shared UI pieces: provenance badges, source-page chips, lesson chips, status pills.
import type { MouseEvent, ReactNode } from 'react';
import type { SourceRef } from '../../shared/types.ts';
import { useData } from '../state/data.tsx';
import { useNav } from '../state/nav.tsx';
import { formatDate, type Target } from '../lib/targets.ts';

export type Provenance = 'instructor' | 'pack' | 'supplemental' | 'practice' | 'external' | 'personal';

const PROV: Record<Provenance, { label: string; title: string }> = {
  instructor: { label: 'Instructor PDF', title: 'Original lecture notes from the course' },
  pack: { label: 'Course-notes synthesis', title: 'AI-authored synthesis of your lecture notes (study-content pack); lecture examples are labelled in the text. Not instructor-approved.' },
  supplemental: { label: 'Study aid (supplemental)', title: 'AI-authored summary added by this app; not instructor material' },
  practice: { label: 'Generated practice', title: 'Newly authored practice question, not an assigned course exercise' },
  external: { label: 'External', title: 'Outside resource; supplements the course notes' },
  personal: { label: 'My note', title: 'Your personal note stored as Markdown on disk' },
};

export function Badge({ kind, children }: { kind: Provenance; children?: ReactNode }) {
  return (
    <span className={`badge badge-${kind}`} title={PROV[kind].title}>
      {children ?? PROV[kind].label}
    </span>
  );
}

/** Follow an internal target from a click, honouring the link-mode setting and modifier keys. */
export function useOpen(from: 'main' | 'pane' = 'main') {
  const { openLink } = useNav();
  return (t: Target) => (e?: MouseEvent) => {
    e?.preventDefault();
    openLink(t, { from, invert: !!(e && (e.metaKey || e.ctrlKey || e.altKey)) });
  };
}

export function SourceChips({ refs, from = 'main', compact = false }: { refs: SourceRef[]; from?: 'main' | 'pane'; compact?: boolean }) {
  const { course } = useData();
  const open = useOpen(from);
  if (!refs.length) return <span className="muted">No source pages</span>;
  return (
    <div className={`source-chips ${compact ? 'compact' : ''}`}>
      {refs.map((r) => {
        const s = course.sources.find((x) => x.id === r.source_id);
        return (
          <div className="source-group" key={r.source_id}>
            <span className="source-date" title={s?.path}>
              {s ? formatDate(s.date) : r.source_id}
            </span>
            {r.pages.map((p) => (
              <a
                key={p}
                href={`#/pdf/${r.source_id}/${p}`}
                className="chip page-chip"
                onClick={open({ kind: 'pdf', sourceId: r.source_id, page: p })}
                aria-label={`Open ${s ? formatDate(s.date) : r.source_id} lecture PDF at page ${p}`}
              >
                p.{p}
              </a>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function LessonChip({ id, from = 'main' }: { id: string; from?: 'main' | 'pane' }) {
  const { course } = useData();
  const open = useOpen(from);
  const l = course.lessons.find((x) => x.id === id);
  return (
    <a href={`#/lesson/${id}`} className="chip lesson-chip" onClick={open({ kind: 'lesson', id })}>
      {l?.title ?? id}
    </a>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children && <div>{children}</div>}
    </div>
  );
}
