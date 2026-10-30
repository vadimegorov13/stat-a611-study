// Small hand-built SVG charts for the Visualize tools. Colours come from the --viz-* tokens in styles.css.
// Every mark has a hover/focus tooltip; each chart is paired with a table in its view for exact values.
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { fmt, type Bin, type BoxSummary } from '../../shared/stats.ts';

export function useWidth<T extends HTMLElement>(fallback = 560): [React.RefObject<T>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.floor(e.contentRect.width))));
    ro.observe(el);
    setW(Math.max(260, Math.floor(el.getBoundingClientRect().width)));
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!(max > min)) return [min];
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag);
  // Ticks enclose the data: the first is at or below min, the last at or above max.
  const out: number[] = [];
  const last = Math.ceil(max / step - 1e-9) * step;
  for (let v = Math.floor(min / step + 1e-9) * step; v <= last + step * 1e-9; v += step) out.push(Number(v.toFixed(10)));
  return out;
}

const within = (ticks: number[], lo: number, hi: number) => ticks.filter((t) => t >= lo - 1e-9 && t <= hi + 1e-9);

const scale = (d0: number, d1: number, r0: number, r1: number) => (v: number) => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);

interface Tip {
  x: number;
  y: number;
  content: ReactNode;
}

/** Wrapper with a positioned tooltip layer. */
function Frame({ children, tip, height, label }: { children: (w: number) => ReactNode; tip: Tip | null; height: number; label: string }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  return (
    <div className="chart" ref={ref}>
      <svg width={w} height={height} role="img" aria-label={label}>
        {children(w)}
      </svg>
      {tip && (
        <div className="chart-tip" style={{ left: Math.min(Math.max(tip.x, 70), w - 70), top: tip.y }} role="status">
          {tip.content}
        </div>
      )}
    </div>
  );
}

function useTip() {
  const [tip, setTip] = useState<Tip | null>(null);
  /** Props that show `content` above (x, y) on hover or keyboard focus. */
  const hover = (x: number, y: number, content: ReactNode, label: string) => ({
    onMouseEnter: () => setTip({ x, y, content }),
    onMouseLeave: () => setTip(null),
    onFocus: () => setTip({ x, y, content }),
    onBlur: () => setTip(null),
    tabIndex: 0,
    'aria-label': label,
  });
  return { tip, hover };
}

function XAxis({ ticks, x, y, label, w, format = fmt }: { ticks: number[]; x: (v: number) => number; y: number; label?: string; w: number; format?: (v: number) => string }) {
  return (
    <g className="axis">
      <line x1={x(ticks[0])} x2={x(ticks[ticks.length - 1])} y1={y} y2={y} />
      {ticks.map((t) => (
        <g key={t} transform={`translate(${x(t)},${y})`}>
          <line y2={4} />
          <text y={16} textAnchor="middle">
            {format(t)}
          </text>
        </g>
      ))}
      {label && (
        <text className="axis-label" x={w / 2} y={y + 32} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}

function YAxis({ ticks, y, x0, x1, label, format = fmt }: { ticks: number[]; y: (v: number) => number; x0: number; x1: number; label?: string; format?: (v: number) => string }) {
  return (
    <g className="axis">
      {ticks.map((t) => (
        <g key={t}>
          <line className="grid" x1={x0} x2={x1} y1={y(t)} y2={y(t)} />
          <text x={x0 - 6} y={y(t) + 4} textAnchor="end">
            {format(t)}
          </text>
        </g>
      ))}
      {label && (
        <text className="axis-label" transform={`translate(12,${(y(ticks[0]) + y(ticks[ticks.length - 1])) / 2}) rotate(-90)`} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}

/** Column with a 4px rounded data end and a square base. */
function colPath(x: number, w: number, yTop: number, yBase: number, r = 4): string {
  const h = yBase - yTop;
  if (h <= 0 || w <= 0) return '';
  const rr = Math.min(r, w / 2, h);
  return `M${x},${yBase}V${yTop + rr}Q${x},${yTop} ${x + rr},${yTop}H${x + w - rr}Q${x + w},${yTop} ${x + w},${yTop + rr}V${yBase}Z`;
}

const M = { l: 52, r: 16, t: 14, b: 44 };

// ---------- histogram ----------

export type HistMode = 'freq' | 'rel' | 'density';

export function HistogramChart({
  bins,
  n,
  mode,
  xLabel,
  curve,
  height = 260,
}: {
  bins: Bin[];
  n: number;
  mode: HistMode;
  xLabel: string;
  /** Optional density curve drawn over a density-scaled histogram. */
  curve?: { f: (x: number) => number; label: string };
  height?: number;
}) {
  const { tip, hover } = useTip();
  const val = (b: Bin) => (mode === 'freq' ? b.count : mode === 'rel' ? b.count / n : b.count / n / (b.hi - b.lo));
  const lo = bins[0]?.lo ?? 0;
  const hi = bins[bins.length - 1]?.hi ?? 1;
  let ymax = Math.max(...bins.map(val), 0);
  if (curve) for (let i = 0; i <= 100; i++) ymax = Math.max(ymax, curve.f(lo + ((hi - lo) * i) / 100));
  const yt = niceTicks(0, ymax * 1.08 || 1, 4);
  const yLabel = mode === 'freq' ? 'Frequency' : mode === 'rel' ? 'Relative frequency' : 'Density';
  return (
    <Frame tip={tip} height={height} label={`Histogram of ${xLabel}: ${bins.map((b) => `[${fmt(b.lo)}, ${fmt(b.hi)}) ${b.count}`).join('; ')}`}>
      {(w) => {
        const x = scale(lo, hi, M.l, w - M.r);
        const y = scale(0, yt[yt.length - 1], height - M.b, M.t);
        const xt = bins.length <= 12 ? [...bins.map((b) => b.lo), hi] : within(niceTicks(lo, hi, 6), lo, hi);
        const path = curve
          ? Array.from({ length: 161 }, (_, i) => {
              const xv = lo + ((hi - lo) * i) / 160;
              return `${i ? 'L' : 'M'}${x(xv).toFixed(1)},${y(curve.f(xv)).toFixed(1)}`;
            }).join('')
          : '';
        return (
          <>
            <YAxis ticks={yt} y={y} x0={M.l} x1={w - M.r} label={yLabel} format={(v) => (mode === 'freq' ? fmt(v, 0) : fmt(v, 3))} />
            {bins.map((b) => {
              const x0 = x(b.lo) + 1;
              const bw = x(b.hi) - x(b.lo) - 2; // 2px surface gap between touching classes
              const v = val(b);
              return (
                <path
                  key={b.lo}
                  className="vm bar"
                  d={colPath(x0, bw, y(v), y(0))}
                  {...hover(
                    x0 + bw / 2,
                    y(v) - 8,
                    <>
                      <strong>
                        [{fmt(b.lo)}, {fmt(b.hi)})
                      </strong>
                      <br />
                      Frequency {b.count} · relative {fmt(b.count / n, 4)}
                      {mode === 'density' && <> · density {fmt(v, 4)}</>}
                    </>,
                    `Class from ${fmt(b.lo)} up to but not including ${fmt(b.hi)}: ${b.count} observations`,
                  )}
                />
              );
            })}
            {/* Invisible hit areas for empty classes so their counts are still inspectable. */}
            {bins
              .filter((b) => b.count === 0)
              .map((b) => (
                <rect key={`e${b.lo}`} x={x(b.lo)} width={x(b.hi) - x(b.lo)} y={y(0) - 12} height={12} fill="transparent" {...hover(x((b.lo + b.hi) / 2), y(0) - 14, <>[{fmt(b.lo)}, {fmt(b.hi)}): 0</>, `Empty class ${fmt(b.lo)} to ${fmt(b.hi)}`)} />
              ))}
            {curve && <path className="vm curve" d={path} />}
            <XAxis ticks={xt} x={x} y={height - M.b} label={xLabel} w={w} />
          </>
        );
      }}
    </Frame>
  );
}

/** Ogive: cumulative relative frequency at each upper class boundary. */
export function OgiveChart({ bins, n, xLabel, height = 220 }: { bins: Bin[]; n: number; xLabel: string; height?: number }) {
  const { tip, hover } = useTip();
  const pts: [number, number][] = [[bins[0].lo, 0]];
  let c = 0;
  for (const b of bins) {
    c += b.count;
    pts.push([b.hi, c / n]);
  }
  return (
    <Frame tip={tip} height={height} label={`Ogive: ${pts.map(([b, r]) => `${fmt(b)} → ${fmt(r, 3)}`).join(', ')}`}>
      {(w) => {
        const x = scale(pts[0][0], pts[pts.length - 1][0], M.l, w - M.r);
        const y = scale(0, 1, height - M.b, M.t);
        const xt = bins.length <= 12 ? pts.map((p) => p[0]) : within(niceTicks(pts[0][0], pts[pts.length - 1][0], 6), pts[0][0], pts[pts.length - 1][0]);
        return (
          <>
            <YAxis ticks={[0, 0.25, 0.5, 0.75, 1]} y={y} x0={M.l} x1={w - M.r} label="Cumulative rel. freq." format={(v) => fmt(v, 2)} />
            <path className="vm line" d={pts.map(([a, b], i) => `${i ? 'L' : 'M'}${x(a)},${y(b)}`).join('')} />
            {pts.map(([a, b], i) => (
              <circle
                key={i}
                className="vm dot"
                cx={x(a)}
                cy={y(b)}
                r={4}
                {...hover(x(a), y(b) - 10, <>At {fmt(a)}: {fmt(b * n, 0)} of {n} = {fmt(b, 4)}</>, `${fmt(b, 4)} of observations are below ${fmt(a)}`)}
              />
            ))}
            <XAxis ticks={xt} x={x} y={height - M.b} label={xLabel} w={w} />
          </>
        );
      }}
    </Frame>
  );
}

// ---------- box plot ----------

export function BoxPlotChart({ box, values, showFences, showPoints, xLabel }: { box: BoxSummary; values: number[]; showFences: boolean; showPoints: boolean; xLabel: string }) {
  const { tip, hover } = useTip();
  const height = showPoints ? 230 : 190;
  let lo = box.min;
  let hi = box.max;
  if (showFences && box.iqr > 0) {
    lo = Math.min(lo, box.inner[0]);
    hi = Math.max(hi, box.inner[1]);
    if (box.outliers.some((o) => o.kind === 'extreme' && o.side === 'low')) lo = Math.min(lo, box.outer[0]);
    if (box.outliers.some((o) => o.kind === 'extreme' && o.side === 'high')) hi = Math.max(hi, box.outer[1]);
  }
  const pad = (hi - lo) * 0.05 || 1;
  const xt = niceTicks(lo - pad, hi + pad, 7);
  const cy = showPoints ? 120 : 80;
  const bh = 44;
  return (
    <Frame
      tip={tip}
      height={height}
      label={`Box plot: whiskers ${fmt(box.p1)} to ${fmt(box.p2)}, box ${fmt(box.q1)} to ${fmt(box.q3)}, median ${fmt(box.q2)}, ${box.outliers.length} outliers`}
    >
      {(w) => {
        const x = scale(xt[0], xt[xt.length - 1], 24, w - 24);
        const fence = (v: number, name: string, key: string) => (
          <g key={key} className="fence">
            <line x1={x(v)} x2={x(v)} y1={cy - bh / 2 - 22} y2={cy + bh / 2 + 6} />
            <text x={x(v)} y={cy - bh / 2 - 26} textAnchor={x(v) > w - 80 ? 'end' : x(v) < 80 ? 'start' : 'middle'}>
              {name} fence {fmt(v)}
            </text>
          </g>
        );
        // Value labels under P1, Q1, Q2, Q3, P2 (as in the lecture figures); alternate rows when they would collide.
        const marks: [string, number][] = [
          ['P₁', box.p1],
          ['Q₁', box.q1],
          ['Q₂', box.q2],
          ['Q₃', box.q3],
          ['P₂', box.p2],
        ];
        let lastX = -Infinity;
        let row = 0;
        const labels = marks.map(([name, v]) => {
          const px = x(v);
          row = px - lastX < 46 ? 1 - row : 0;
          lastX = px;
          return { name, v, px, row };
        });
        return (
          <>
            {showFences && box.iqr > 0 && (
              <>
                {fence(box.inner[0], 'inner', 'il')}
                {fence(box.inner[1], 'inner', 'ih')}
                {box.outliers.some((o) => o.kind === 'extreme' && o.side === 'low') && fence(box.outer[0], 'outer', 'ol')}
                {box.outliers.some((o) => o.kind === 'extreme' && o.side === 'high') && fence(box.outer[1], 'outer', 'oh')}
              </>
            )}
            {showPoints &&
              values.map((v, i) => (
                <circle key={i} className="vm dot faint" cx={x(v)} cy={34 + ((i * 7919) % 23)} r={3.5} {...hover(x(v), 24, <>{fmt(v)}</>, `Observation ${fmt(v)}`)} />
              ))}
            {/* whiskers */}
            <line className="whisker" x1={x(box.p1)} x2={x(box.q1)} y1={cy} y2={cy} />
            <line className="whisker" x1={x(box.q3)} x2={x(box.p2)} y1={cy} y2={cy} />
            <line className="whisker" x1={x(box.p1)} x2={x(box.p1)} y1={cy - 10} y2={cy + 10} />
            <line className="whisker" x1={x(box.p2)} x2={x(box.p2)} y1={cy - 10} y2={cy + 10} />
            <rect
              className="vm box"
              x={x(box.q1)}
              y={cy - bh / 2}
              width={Math.max(1, x(box.q3) - x(box.q1))}
              height={bh}
              rx={4}
              {...hover(x((box.q1 + box.q3) / 2), cy - bh / 2 - 8, <>Box: Q₁ {fmt(box.q1)} to Q₃ {fmt(box.q3)} (IQR {fmt(box.iqr)})</>, `Box from Q1 ${fmt(box.q1)} to Q3 ${fmt(box.q3)}`)}
            />
            <line className="median" x1={x(box.q2)} x2={x(box.q2)} y1={cy - bh / 2} y2={cy + bh / 2} />
            {box.outliers.map((o, i) =>
              o.kind === 'mild' ? (
                <circle
                  key={i}
                  className="outlier mild"
                  cx={x(o.value)}
                  cy={cy}
                  r={5}
                  {...hover(x(o.value), cy - 14, <>Mild outlier {fmt(o.value)}</>, `Mild outlier ${fmt(o.value)}`)}
                />
              ) : (
                <g key={i} className="outlier extreme" {...hover(x(o.value), cy - 14, <>Extreme outlier {fmt(o.value)}</>, `Extreme outlier ${fmt(o.value)}`)}>
                  <circle cx={x(o.value)} cy={cy} r={8} fill="transparent" stroke="none" />
                  {[0, 60, 120].map((a) => (
                    <line key={a} x1={x(o.value)} x2={x(o.value)} y1={cy - 6} y2={cy + 6} transform={`rotate(${a} ${x(o.value)} ${cy})`} />
                  ))}
                </g>
              ),
            )}
            {labels.map((l) => (
              <text key={l.name} className="box-label" x={l.px} y={cy + bh / 2 + 16 + l.row * 14} textAnchor="middle">
                {l.name} {fmt(l.v)}
              </text>
            ))}
            <XAxis ticks={xt} x={x} y={height - 40} label={xLabel} w={w} />
          </>
        );
      }}
    </Frame>
  );
}

// ---------- dot plot ----------

export function DotPlotChart({ values, xLabel }: { values: number[]; xLabel: string }) {
  const { tip, hover } = useTip();
  const [ref, w] = useWidth<HTMLDivElement>();
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo) * 0.04 || 1;
  const xt = niceTicks(lo - pad, hi + pad, 7);
  const x = scale(xt[0], xt[xt.length - 1], 24, w - 24);
  const sorted = [...values].sort((a, b) => a - b);
  // Stack values that land in the same 9px column on top of each other.
  const col = new Map<number, number>();
  const dots = sorted.map((v) => {
    const key = Math.round(x(v) / 9);
    const k = col.get(key) ?? 0;
    col.set(key, k + 1);
    return { v, px: key * 9, k };
  });
  const maxStack = Math.max(...col.values());
  const height = Math.min(360, 70 + maxStack * 9);
  const base = height - 50;
  return (
    <div className="chart" ref={ref}>
      <svg width={w} height={height} role="img" aria-label={`Dot plot of ${values.length} values from ${fmt(sorted[0])} to ${fmt(sorted[sorted.length - 1])}`}>
        {dots.map((d, i) => (
          <circle key={i} className="vm dot" cx={d.px} cy={base - 6 - d.k * 9} r={4} {...hover(d.px, base - 14 - d.k * 9, <>{fmt(d.v)}</>, `Value ${fmt(d.v)}`)} />
        ))}
        <XAxis ticks={xt} x={x} y={base} label={xLabel} w={w} />
      </svg>
      {tip && (
        <div className="chart-tip" style={{ left: Math.min(Math.max(tip.x, 70), w - 70), top: tip.y }} role="status">
          {tip.content}
        </div>
      )}
    </div>
  );
}

// ---------- PMF / PDF ----------

export function PmfChart({
  xs,
  ps,
  inEvent,
  mu,
  sigma,
  height = 260,
}: {
  xs: number[];
  ps: number[];
  inEvent: (x: number) => boolean;
  mu: number;
  sigma: number;
  height?: number;
}) {
  const { tip, hover } = useTip();
  const ymax = Math.max(...ps, 0.01);
  const yt = niceTicks(0, ymax * 1.1, 4);
  return (
    <Frame tip={tip} height={height} label={`Probability mass function on ${xs[0]} to ${xs[xs.length - 1]}`}>
      {(w) => {
        const lo = xs[0] - 0.5;
        const hi = xs[xs.length - 1] + 0.5;
        const x = scale(lo, hi, M.l, w - M.r);
        const y = scale(0, yt[yt.length - 1], height - M.b, M.t);
        const slot = x(1) - x(0);
        const bw = Math.max(1, Math.min(24, slot - 2));
        const step = Math.max(1, Math.ceil(xs.length / Math.max(4, Math.floor((w - M.l - M.r) / 34))));
        const xt = xs.filter((v) => (v - xs[0]) % step === 0);
        return (
          <>
            <YAxis ticks={yt} y={y} x0={M.l} x1={w - M.r} label="P(X = x)" format={(v) => fmt(v, 3)} />
            <MeanBand x={x} mu={mu} sigma={sigma} top={M.t} bottom={height - M.b} />
            {xs.map((v, i) => (
              <path
                key={v}
                className={`vm bar ${inEvent(v) ? '' : 'off'}`}
                d={colPath(x(v) - bw / 2, bw, y(ps[i]), y(0), Math.min(4, bw / 2))}
                {...hover(x(v), y(ps[i]) - 8, <>P(X = {v}) = {fmt(ps[i], 6)}</>, `P of X equals ${v} is ${fmt(ps[i], 6)}`)}
              />
            ))}
            <XAxis ticks={xt} x={x} y={height - M.b} label="x" w={w} format={(v) => fmt(v, 0)} />
          </>
        );
      }}
    </Frame>
  );
}

export function PdfChart({
  f,
  range,
  shade,
  mu,
  sigma,
  height = 260,
}: {
  f: (x: number) => number;
  range: [number, number];
  shade: [number, number] | null;
  mu: number;
  sigma: number;
  height?: number;
}) {
  const { tip, hover } = useTip();
  const [lo, hi] = range;
  const N = 240;
  const pts = Array.from({ length: N + 1 }, (_, i) => {
    const xv = lo + ((hi - lo) * i) / N;
    return [xv, f(xv)] as [number, number];
  });
  const ymax = Math.max(...pts.map((p) => (Number.isFinite(p[1]) ? p[1] : 0)), 1e-6);
  const cap = Math.min(ymax, Math.max(...pts.slice(3).map((p) => p[1])) * 1.6 || ymax); // tame a density spike at 0 (gamma α < 1)
  const yt = niceTicks(0, cap * 1.1, 4);
  return (
    <Frame tip={tip} height={height} label="Probability density curve with the event shaded">
      {(w) => {
        const x = scale(lo, hi, M.l, w - M.r);
        const y = scale(0, yt[yt.length - 1], height - M.b, M.t);
        const yc = (v: number) => Math.max(M.t, y(Math.min(v, yt[yt.length - 1])));
        const line = pts.map(([a, b], i) => `${i ? 'L' : 'M'}${x(a).toFixed(1)},${yc(b).toFixed(1)}`).join('');
        let area = '';
        if (shade) {
          const a = Math.max(lo, shade[0]);
          const b = Math.min(hi, shade[1]);
          if (b > a) {
            const k = 120;
            const seg = Array.from({ length: k + 1 }, (_, i) => a + ((b - a) * i) / k);
            area = `M${x(a)},${y(0)}${seg.map((v) => `L${x(v).toFixed(1)},${yc(f(v)).toFixed(1)}`).join('')}L${x(b)},${y(0)}Z`;
          }
        }
        return (
          <>
            <YAxis ticks={yt} y={y} x0={M.l} x1={w - M.r} label="f(x)" format={(v) => fmt(v, 3)} />
            <MeanBand x={x} mu={mu} sigma={sigma} top={M.t} bottom={height - M.b} />
            {area && <path className="vm area-event" d={area} />}
            <path className="vm curve" d={line} />
            {/* hover strip: density value under the pointer */}
            {Array.from({ length: 40 }, (_, i) => {
              const a = lo + ((hi - lo) * i) / 40;
              const b = lo + ((hi - lo) * (i + 1)) / 40;
              const m = (a + b) / 2;
              return (
                <rect
                  key={i}
                  x={x(a)}
                  width={x(b) - x(a)}
                  y={M.t}
                  height={height - M.b - M.t}
                  fill="transparent"
                  onMouseEnter={hover(x(m), yc(f(m)) - 10, <>f({fmt(m, 3)}) = {fmt(f(m), 4)}</>, '').onMouseEnter}
                  onMouseLeave={hover(0, 0, null, '').onMouseLeave}
                />
              );
            })}
            <XAxis ticks={within(niceTicks(lo, hi, 7), lo, hi)} x={x} y={height - M.b} label="x" w={w} />
          </>
        );
      }}
    </Frame>
  );
}

function MeanBand({ x, mu, sigma, top, bottom }: { x: (v: number) => number; mu: number; sigma: number; top: number; bottom: number }) {
  if (!Number.isFinite(mu)) return null;
  return (
    <g className="mean-band">
      {Number.isFinite(sigma) && sigma > 0 && <rect x={x(mu - sigma)} width={x(mu + sigma) - x(mu - sigma)} y={top} height={bottom - top} />}
      <line x1={x(mu)} x2={x(mu)} y1={top} y2={bottom} />
      <text x={x(mu) + 4} y={top + 10}>
        μ = {fmt(mu, 3)}
      </text>
    </g>
  );
}

// ---------- scatterplot ----------

export function ScatterChart({
  xs,
  ys,
  line,
  quadrants,
  height = 320,
}: {
  xs: number[];
  ys: number[];
  line: { a: number; b: number } | null;
  quadrants: boolean;
  height?: number;
}) {
  const { tip, hover } = useTip();
  const mx = xs.reduce((s, v) => s + v, 0) / xs.length;
  const my = ys.reduce((s, v) => s + v, 0) / ys.length;
  const padX = (Math.max(...xs) - Math.min(...xs)) * 0.06 || 1;
  const padY = (Math.max(...ys) - Math.min(...ys)) * 0.08 || 1;
  const xt = niceTicks(Math.min(...xs) - padX, Math.max(...xs) + padX, 6);
  const yt = niceTicks(Math.min(...ys) - padY, Math.max(...ys) + padY, 5);
  return (
    <Frame tip={tip} height={height} label={`Scatterplot of ${xs.length} points`}>
      {(w) => {
        const x = scale(xt[0], xt[xt.length - 1], M.l, w - M.r);
        const y = scale(yt[0], yt[yt.length - 1], height - M.b, M.t);
        return (
          <>
            <YAxis ticks={yt} y={y} x0={M.l} x1={w - M.r} label="y" />
            {quadrants && (
              <g className="quadrants">
                <line x1={x(mx)} x2={x(mx)} y1={M.t} y2={height - M.b} />
                <line x1={M.l} x2={w - M.r} y1={y(my)} y2={y(my)} />
                <text x={x(mx) + 4} y={M.t + 10}>
                  x̄
                </text>
                <text x={w - M.r - 4} y={y(my) - 4} textAnchor="end">
                  ȳ
                </text>
              </g>
            )}
            {line && (
              <line
                className="fit"
                x1={x(xt[0])}
                x2={x(xt[xt.length - 1])}
                y1={y(line.a + line.b * xt[0])}
                y2={y(line.a + line.b * xt[xt.length - 1])}
                clipPath="url(#plot)"
              />
            )}
            <clipPath id="plot">
              <rect x={M.l} y={M.t} width={w - M.l - M.r} height={height - M.t - M.b} />
            </clipPath>
            {xs.map((xv, i) => {
              const pos = (xv - mx) * (ys[i] - my) >= 0;
              return (
                <circle
                  key={i}
                  className={`vm dot ${quadrants ? (pos ? 'pos' : 'neg') : ''}`}
                  cx={x(xv)}
                  cy={y(ys[i])}
                  r={4}
                  {...hover(
                    x(xv),
                    y(ys[i]) - 10,
                    <>
                      ({fmt(xv, 2)}, {fmt(ys[i], 2)})
                      {quadrants && <> · product of deviations {pos ? '≥ 0' : '< 0'}</>}
                    </>,
                    `Point ${fmt(xv, 2)}, ${fmt(ys[i], 2)}`,
                  )}
                />
              );
            })}
            <XAxis ticks={xt} x={x} y={height - M.b} label="x" w={w} />
          </>
        );
      }}
    </Frame>
  );
}

// ---------- categorical ----------

export function BarChart({ labels, counts, rel, height = 240 }: { labels: string[]; counts: number[]; rel: boolean; height?: number }) {
  const { tip, hover } = useTip();
  const n = counts.reduce((s, v) => s + v, 0) || 1;
  const vals = counts.map((c) => (rel ? c / n : c));
  const yt = niceTicks(0, Math.max(...vals, rel ? 0.1 : 1) * 1.12, 4);
  return (
    <Frame tip={tip} height={height} label={`Bar graph: ${labels.map((l, i) => `${l} ${counts[i]}`).join(', ')}`}>
      {(w) => {
        const y = scale(0, yt[yt.length - 1], height - M.b, M.t);
        const slot = (w - M.l - M.r) / labels.length;
        const bw = Math.min(24, slot * 0.6);
        return (
          <>
            <YAxis ticks={yt} y={y} x0={M.l} x1={w - M.r} label={rel ? 'Relative frequency' : 'Frequency'} format={(v) => (rel ? fmt(v, 2) : fmt(v, 0))} />
            {labels.map((l, i) => {
              const cx = M.l + slot * (i + 0.5);
              return (
                <g key={l}>
                  <path
                    className="vm bar"
                    d={colPath(cx - bw / 2, bw, y(vals[i]), y(0))}
                    {...hover(cx, y(vals[i]) - 8, <>{l}: {counts[i]} ({fmt(counts[i] / n, 4)})</>, `${l}: ${counts[i]}`)}
                  />
                  <text className="value-label" x={cx} y={y(vals[i]) - 6} textAnchor="middle">
                    {rel ? fmt(vals[i], 3) : counts[i]}
                  </text>
                  <text className="cat-label" x={cx} y={height - M.b + 16} textAnchor="middle">
                    {l}
                  </text>
                </g>
              );
            })}
            <line className="axis-line" x1={M.l} x2={w - M.r} y1={y(0)} y2={y(0)} />
          </>
        );
      }}
    </Frame>
  );
}

export function PieChart({ labels, counts, height = 240 }: { labels: string[]; counts: number[]; height?: number }) {
  const { tip, hover } = useTip();
  const n = counts.reduce((s, v) => s + v, 0) || 1;
  return (
    <Frame tip={tip} height={height} label={`Pie chart: ${labels.map((l, i) => `${l} ${fmt((counts[i] / n) * 360, 1)} degrees`).join(', ')}`}>
      {(w) => {
        const r = Math.min(height / 2 - 16, w / 4);
        const cx = Math.min(w / 2, r + 24);
        const cy = height / 2;
        let a0 = -Math.PI / 2;
        return (
          <>
            {counts.map((c, i) => {
              const a1 = a0 + (c / n) * 2 * Math.PI;
              const large = a1 - a0 > Math.PI ? 1 : 0;
              const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)];
              const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
              const mid = (a0 + a1) / 2;
              const d = c === n ? `M${cx - r},${cy}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0` : `M${cx},${cy}L${p0[0]},${p0[1]}A${r},${r} 0 ${large} 1 ${p1[0]},${p1[1]}Z`;
              a0 = a1;
              return c > 0 ? (
                <path
                  key={labels[i]}
                  className={`vm slice s${i + 1}`}
                  d={d}
                  {...hover(cx + r * 0.6 * Math.cos(mid), cy + r * 0.6 * Math.sin(mid) - 10, <>{labels[i]}: {fmt((c / n) * 360, 1)}°</>, `${labels[i]}: ${fmt((c / n) * 360, 1)} degrees`)}
                />
              ) : null;
            })}
            {/* Legend with direct values: identity never relies on colour alone. */}
            {labels.map((l, i) => (
              <g key={l} transform={`translate(${cx + r + 24},${cy - (labels.length * 22) / 2 + i * 22})`}>
                <rect className={`slice s${i + 1}`} width={12} height={12} rx={3} y={-10} />
                <text className="legend-text" x={18}>
                  {l} — {counts[i]} ({fmt((counts[i] / n) * 360, 1)}°)
                </text>
              </g>
            ))}
          </>
        );
      }}
    </Frame>
  );
}
