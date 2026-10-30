import { diffLines } from 'diff';

export function DiffView({ before, after, beforeLabel = 'Before', afterLabel = 'After' }: { before: string; after: string; beforeLabel?: string; afterLabel?: string }) {
  const parts = diffLines(before, after);
  const changed = parts.some((p) => p.added || p.removed);
  return (
    <div className="diff" role="region" aria-label={`Changes from ${beforeLabel} to ${afterLabel}`}>
      <div className="diff-legend small">
        <span className="del">− {beforeLabel}</span> <span className="add">+ {afterLabel}</span>
      </div>
      {!changed && <p className="muted small">No differences in the text.</p>}
      <pre>
        {parts.map((p, i) => {
          const lines = p.value.replace(/\n$/, '').split('\n');
          const cls = p.added ? 'add' : p.removed ? 'del' : 'same';
          const mark = p.added ? '+ ' : p.removed ? '− ' : '  ';
          // Collapse long unchanged stretches so the change stays visible.
          if (cls === 'same' && lines.length > 6) {
            return (
              <span key={i} className="same">
                {[...lines.slice(0, 2), `  … ${lines.length - 4} unchanged lines …`, ...lines.slice(-2)].map((l, j) => (
                  <span key={j} className="dline">
                    {j === 2 ? l : `${mark}${l}`}
                    {'\n'}
                  </span>
                ))}
              </span>
            );
          }
          return (
            <span key={i} className={cls}>
              {lines.map((l, j) => (
                <span key={j} className="dline">
                  {mark}
                  {l}
                  {'\n'}
                </span>
              ))}
            </span>
          );
        })}
      </pre>
    </div>
  );
}

export function contentText(c: { title: string; body: string; topics: string[]; tags: string[] }): string {
  return `# ${c.title}\n[topics: ${c.topics.join(', ') || '—'}] [tags: ${c.tags.join(', ') || '—'}]\n\n${c.body}`;
}
