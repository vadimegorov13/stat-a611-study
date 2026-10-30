import { useEffect, useState } from 'react';
import { api } from '../lib/api.ts';
import { useData } from '../state/data.tsx';

/** External page: embed only when the site allows framing; always offer an explicit open-in-browser link. */
export function WebView({ url, title, label }: { url: string; title?: string; label?: 'search' | 'curated' | 'link' }) {
  const { course } = useData();
  const [check, setCheck] = useState<{ embeddable: boolean | null; reason: string } | null>(null);
  const [force, setForce] = useState(false);
  const curated = course.resources.find((r) => r.url === url);
  const isSearch = label === 'search' || /google\.[a-z.]+\/search|[?&](q|search)=/.test(url);
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  })();

  useEffect(() => {
    setCheck(null);
    setForce(false);
    api
      .embedCheck(url)
      .then(setCheck)
      .catch(() => setCheck({ embeddable: null, reason: 'Could not check (server unreachable).' }));
  }, [url]);

  const embed = check?.embeddable === true || force;
  return (
    <div className="webview">
      <div className="web-head">
        <div>
          <span className="badge badge-external">{isSearch ? 'Web search' : curated ? 'Curated resource' : 'External link'}</span> <strong>{title ?? curated?.title ?? host}</strong>
          <div className="muted small">
            {isSearch
              ? 'Topic search link — results are not verified and supplement your course notes.'
              : curated
                ? `URL verified ${curated.verified.split(':')[0]}; supplements your course notes.`
                : 'Outside resource; it supplements your course notes.'}
          </div>
        </div>
        <a className="btn" href={url} target="_blank" rel="noreferrer noopener">
          Open in browser ↗
        </a>
      </div>
      {!check && <div className="muted pad">Checking whether {host} allows embedding…</div>}
      {check && !embed && (
        <div className="empty">
          <strong>{check.embeddable === false ? `${host} does not allow being shown inside other apps.` : 'Embedding status unknown.'}</strong>
          <div className="small muted">{check.reason}</div>
          <div>
            <a className="btn primary" href={url} target="_blank" rel="noreferrer noopener">
              Open {host} in your browser ↗
            </a>
            {check.embeddable === null && <button onClick={() => setForce(true)}>Try embedding anyway</button>}
          </div>
        </div>
      )}
      {embed && (
        <iframe
          className="web-frame"
          src={url}
          title={title ?? host}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          referrerPolicy="no-referrer"
        />
      )}
    </div>
  );
}
