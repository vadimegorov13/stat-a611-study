// Local PDF viewer (pdf.js) that opens a lecture PDF at a given page. Works offline.
import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import { useData } from '../state/data.tsx';
import { formatDate } from '../lib/targets.ts';
import { LessonChip } from './Bits.tsx';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const docCache = new Map<string, Promise<PDFDocumentProxy>>();
function loadDoc(sourceId: string) {
  let p = docCache.get(sourceId);
  if (!p) {
    p = pdfjs.getDocument({ url: `/api/sources/${sourceId}/pdf` }).promise;
    p.catch(() => docCache.delete(sourceId));
    docCache.set(sourceId, p);
  }
  return p;
}

export function PdfViewer({ sourceId, page, onPage }: { sourceId: string; page: number; onPage: (p: number) => void }) {
  const { course, sourcePages } = useData();
  const source = course.sources.find((s) => s.id === sourceId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  const [showText, setShowText] = useState(false);
  const [pageInput, setPageInput] = useState(String(page));
  const [rendering, setRendering] = useState(false);

  useEffect(() => setPageInput(String(page)), [page]);

  useEffect(() => {
    let alive = true;
    setDoc(null);
    setError(null);
    loadDoc(sourceId)
      .then((d) => alive && setDoc(d))
      .catch((e) => alive && setError(String(e?.message ?? e)));
    return () => {
      alive = false;
    };
  }, [sourceId]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!doc || !canvasRef.current || width < 50) return;
    let task: RenderTask | null = null;
    let cancelled = false;
    const n = Math.min(Math.max(1, page), doc.numPages);
    setRendering(true);
    doc
      .getPage(n)
      .then((pg) => {
        if (cancelled || !canvasRef.current) return;
        const base = pg.getViewport({ scale: 1 });
        const scale = ((width - 24) / base.width) * zoom;
        const dpr = window.devicePixelRatio || 1;
        const vp = pg.getViewport({ scale: scale * dpr });
        const canvas = canvasRef.current;
        canvas.width = vp.width;
        canvas.height = vp.height;
        canvas.style.width = `${vp.width / dpr}px`;
        canvas.style.height = `${vp.height / dpr}px`;
        task = pg.render({ canvasContext: canvas.getContext('2d')!, viewport: vp });
        return task.promise;
      })
      .catch((e) => {
        if (!cancelled && e?.name !== 'RenderingCancelledException') setError(String(e?.message ?? e));
      })
      .finally(() => !cancelled && setRendering(false));
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, page, width, zoom]);

  if (!source) return <div className="empty">Unknown source “{sourceId}”.</div>;
  const pageCount = doc?.numPages ?? source.page_count;
  const go = (p: number) => onPage(Math.min(Math.max(1, p), pageCount));
  const citing = course.lessons.filter((l) => l.sources.some((r) => r.source_id === sourceId && r.pages.includes(page)));
  const text = sourcePages?.find((p) => p.source_id === sourceId && p.page === page)?.text;

  return (
    <div className="pdf-viewer">
      <div className="pdf-toolbar" role="toolbar" aria-label="PDF controls">
        <button onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Previous page">
          ‹
        </button>
        <label className="page-input">
          <span className="sr-only">Page</span>
          <input
            value={pageInput}
            inputMode="numeric"
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && go(Number(pageInput) || 1)}
            onBlur={() => go(Number(pageInput) || page)}
            aria-label="Page number"
          />
          <span>/ {pageCount}</span>
        </label>
        <button onClick={() => go(page + 1)} disabled={page >= pageCount} aria-label="Next page">
          ›
        </button>
        <span className="sep" />
        <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))} aria-label="Zoom out">
          −
        </button>
        <button onClick={() => setZoom(1)} title="Fit width">
          {Math.round(zoom * 100)}%
        </button>
        <button onClick={() => setZoom((z) => Math.min(3, z + 0.15))} aria-label="Zoom in">
          +
        </button>
        <span className="sep" />
        <button className={showText ? 'on' : ''} onClick={() => setShowText((v) => !v)} aria-pressed={showText}>
          Text
        </button>
        <a className="btn-link" href={`/api/sources/${sourceId}/pdf#page=${page}`} target="_blank" rel="noreferrer" title="Open in the browser's PDF viewer">
          Open ↗
        </a>
      </div>
      <div className="pdf-meta">
        <span className="badge badge-instructor">Instructor PDF</span> Lecture {formatDate(source.date)} · {source.path.split('/').pop()}
        {citing.length > 0 && (
          <div className="pdf-citing">
            Cited by: {citing.map((l) => <LessonChip key={l.id} id={l.id} from="pane" />)}
          </div>
        )}
      </div>
      {showText && (
        <div className="pdf-text">
          <p className="muted small">Extracted text — mathematical glyphs may be garbled; the rendered page is authoritative.</p>
          <pre>{text ?? 'No extracted text for this page.'}</pre>
        </div>
      )}
      <div className="pdf-canvas-wrap" ref={wrapRef}>
        {error ? (
          <div className="empty">
            <strong>Could not display this PDF.</strong>
            <div>{error}</div>
            <a href={`/api/sources/${sourceId}/pdf#page=${page}`} target="_blank" rel="noreferrer">
              Open it in the browser instead ↗
            </a>
          </div>
        ) : (
          <>
            {(!doc || rendering) && <div className="pdf-loading">Rendering page {page}…</div>}
            <canvas ref={canvasRef} aria-label={`Lecture ${source.date}, page ${page}`} role="img" />
          </>
        )}
      </div>
    </div>
  );
}
