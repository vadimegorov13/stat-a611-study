// Visualize: interactive charts on lecture datasets, generated data, or the user's own numbers.
// All statistics follow the course conventions (shared/stats.ts), which the unit tests check against the lecture examples.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useData } from '../state/data.tsx';
import { useNav } from '../state/nav.tsx';
import { load, save } from '../lib/persist.ts';
import { VIZ_TITLES, VIZ_TOOLS, toHash, type Target, type VizTool } from '../lib/targets.ts';
import {
  FAMILIES,
  autoLeafUnit,
  boxSummary,
  correlation,
  decimalsOf,
  fmt,
  generate,
  generatePairs,
  histogram,
  leastSquares,
  mean,
  median,
  modes,
  niceClasses,
  parseNumbers,
  phi,
  probability,
  quantileType7,
  rng,
  roundTo,
  sd,
  sortNum,
  stemAndLeaf,
  strength,
  variance,
  normalDraw,
  gammaDraw,
  type Bin,
  type EventKind,
  type FamilyId,
  type Shape,
} from '../../shared/stats.ts';
import { BarChart, BoxPlotChart, DotPlotChart, HistogramChart, OgiveChart, PdfChart, PieChart, PmfChart, ScatterChart, type HistMode } from '../components/charts.tsx';
import { Badge, LessonChip, SourceChips } from '../components/Bits.tsx';
import { TeX } from '../components/Markdown.tsx';
import { VIZ_BLURB } from '../components/QuickRef.tsx';

/** The display face has no combining macron, so letters like x̄ are set in the body face, which stacks it correctly. */
const withMarks = (s: string) => s.split(/(\S\u0304)/).map((part, i) => (i % 2 ? <span key={i} className="tx">{part}</span> : part));

function usePersisted<T extends object>(key: string, initial: T): [T, (p: Partial<T>) => void] {
  const [v, setV] = useState<T>(() => ({ ...initial, ...load<Partial<T>>(key, {}) }));
  const set = (p: Partial<T>) =>
    setV((old) => {
      const next = { ...old, ...p };
      save(key, next);
      return next;
    });
  return [v, set];
}

/** Keep the tool's option (chart or family) in the URL so links and back/forward work. */
function useOptSync(tool: VizTool, from: 'main' | 'pane') {
  const { navigate, paneReplace } = useNav();
  return (opt: string) => {
    const t: Target = { kind: 'viz', tool, opt };
    if (from === 'pane') paneReplace(t);
    else navigate(t, { replace: true });
  };
}

export function VizView({ tool, opt, from }: { tool?: VizTool; opt?: string; from: 'main' | 'pane' }) {
  const { navigate, paneReplace } = useNav();
  const go = (t: VizTool) => (e: React.MouseEvent) => {
    e.preventDefault();
    const target: Target = { kind: 'viz', tool: t };
    if (from === 'pane') paneReplace(target);
    else navigate(target);
  };
  return (
    <div className="viz-view">
      <header className="viz-head">
        <h1>{withMarks(tool ? VIZ_TITLES[tool] : 'Visualize')}</h1>
        <p className="muted small">
          Charts are computed in your browser with the course conventions (quartiles with the median in both halves for odd n, inclusive fences,
          left-closed classes, total-trial geometric, scale-β gamma, N(μ, σ²) with variance). Generated data is random and labelled as such.
        </p>
        <nav className="seg viz-tools" aria-label="Visualization tools">
          {VIZ_TOOLS.map((t) => (
            <a key={t} href={toHash({ kind: 'viz', tool: t })} className={t === tool ? 'on' : ''} aria-current={t === tool ? 'page' : undefined} onClick={go(t)}>
              {VIZ_TITLES[t]}
            </a>
          ))}
        </nav>
      </header>
      {!tool && (
        <ul className="viz-cards">
          {VIZ_TOOLS.map((t) => (
            <li key={t}>
              <a href={toHash({ kind: 'viz', tool: t })} onClick={go(t)}>
                <strong>📊 {VIZ_TITLES[t]}</strong>
                <span className="muted small">{VIZ_BLURB[t]}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {tool === 'describe' && <DescribeTool opt={opt} from={from} />}
      {tool === 'distributions' && <DistributionTool opt={opt} from={from} />}
      {tool === 'scatter' && <ScatterTool />}
      {tool === 'sampling' && <SamplingTool />}
      {tool === 'categorical' && <CategoricalTool />}
    </div>
  );
}

function Stat({ label, value, tex }: { label: string; value: ReactNode; tex?: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{tex ? <TeX tex={tex} /> : label}</span>
      <span className="stat-value">{value}</span>
      {tex && <span className="sr-only">{label}</span>}
    </div>
  );
}

function CopyButton({ text, label = 'Copy summary' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          window.setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      title="Copy as Markdown, ready to paste into a note"
    >
      {done ? 'Copied ✓' : label}
    </button>
  );
}

// ======================= Describe a dataset =======================

type Chart = 'histogram' | 'boxplot' | 'dotplot' | 'stem';
const CHARTS: { id: Chart; label: string }[] = [
  { id: 'histogram', label: 'Histogram & ogive' },
  { id: 'boxplot', label: 'Box plot' },
  { id: 'dotplot', label: 'Dot plot' },
  { id: 'stem', label: 'Stem-and-leaf' },
];

const SHAPES: { id: Shape; label: string }[] = [
  { id: 'symmetric', label: 'Symmetric (bell-shaped)' },
  { id: 'right-skewed', label: 'Right (+) skewed' },
  { id: 'left-skewed', label: 'Left (−) skewed' },
  { id: 'uniform', label: 'Uniform' },
  { id: 'bimodal', label: 'Bimodal' },
  { id: 'outliers', label: 'Mostly normal, with outliers' },
];

interface DescribeState {
  source: string; // dataset id, 'grouped:<id>', 'generated', or 'custom'
  shape: Shape;
  n: number;
  seed: number;
  custom: string;
  start: string;
  width: string;
  mode: HistMode;
  ogive: boolean;
  fences: boolean;
  points: boolean;
  split: boolean;
  leaf: string;
}

function DescribeTool({ opt, from }: { opt?: string; from: 'main' | 'pane' }) {
  const { course } = useData();
  const setOpt = useOptSync('describe', from);
  const chart: Chart = (CHARTS.find((c) => c.id === opt)?.id ?? 'histogram') as Chart;
  const [st, set] = usePersisted<DescribeState>('viz.describe', {
    source: 'site-ii',
    shape: 'right-skewed',
    n: 40,
    seed: 1,
    custom: '12 15 15 18 21 22 22 22 25 29 31 40',
    start: '',
    width: '',
    mode: 'freq',
    ogive: false,
    fences: true,
    points: false,
    split: false,
    leaf: '',
  });

  const lecture = course.datasets.datasets.find((d) => d.id === st.source);
  const grouped = st.source.startsWith('grouped:') ? course.datasets.grouped.find((g) => `grouped:${g.id}` === st.source) : undefined;
  const parsed = useMemo(() => parseNumbers(st.custom), [st.custom]);
  const values: number[] = useMemo(() => {
    if (lecture) return lecture.values;
    if (st.source === 'generated') return generate(st.shape, st.n, st.seed);
    if (st.source === 'custom') return parsed.values;
    return [];
  }, [lecture, st.source, st.shape, st.n, st.seed, parsed]);

  // Reset the class choice when the data changes, so the defaults fit the new data.
  const dataKey = `${st.source}:${st.shape}:${st.n}:${st.seed}:${st.source === 'custom' ? st.custom : ''}`;
  const [lastKey, setLastKey] = useState(dataKey);
  useEffect(() => {
    if (dataKey !== lastKey) {
      setLastKey(dataKey);
      set({ start: '', width: '', leaf: '' });
    }
  }, [dataKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const sourceLabel = lecture ? lecture.title : grouped ? grouped.title : st.source === 'generated' ? `Generated ${SHAPES.find((s) => s.id === st.shape)?.label.toLowerCase()} data` : 'Your data';
  const enough = grouped ? true : values.length >= 2;

  return (
    <div className="viz-tool">
      <section className="viz-panel viz-source" aria-label="Data source">
        <label className="field">
          <span>Data</span>
          <select aria-label="Data" value={st.source} onChange={(e) => set({ source: e.target.value })}>
            <optgroup label="Real data from your lecture notes">
              {course.datasets.datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
              {course.datasets.grouped.map((g) => (
                <option key={g.id} value={`grouped:${g.id}`}>
                  {g.title}
                </option>
              ))}
            </optgroup>
            <optgroup label="Other">
              <option value="generated">Generated (fake) data — pick a shape</option>
              <option value="custom">My own numbers (paste or type)</option>
            </optgroup>
          </select>
        </label>
        {st.source === 'generated' && (
          <div className="viz-row">
            <label className="field">
              <span>Shape</span>
              <select aria-label="Shape" value={st.shape} onChange={(e) => set({ shape: e.target.value as Shape })}>
                {SHAPES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>n = {st.n}</span>
              <input type="range" min={5} max={400} value={st.n} onChange={(e) => set({ n: Number(e.target.value) })} aria-label="Sample size" />
            </label>
            <button onClick={() => set({ seed: st.seed + 1 })}>🎲 New sample</button>
            <span className="muted small">seed {st.seed}</span>
          </div>
        )}
        {st.source === 'custom' && (
          <label className="field">
            <span>Numbers (spaces, commas or new lines)</span>
            <textarea rows={3} value={st.custom} onChange={(e) => set({ custom: e.target.value })} spellCheck={false} />
            {parsed.bad.length > 0 && <span className="warn-text small">Ignored: {parsed.bad.slice(0, 6).join(', ')}</span>}
          </label>
        )}
        <div className="viz-provenance small">
          {lecture || grouped ? (
            <>
              <Badge kind="instructor">Lecture data</Badge> <SourceChips refs={(lecture ?? grouped)!.refs} compact /> <LessonChip id={(lecture ?? grouped)!.lesson_id} />
              <p>
                {(lecture as { caution?: boolean } | undefined)?.caution && <strong className="warn-text">Source caution: </strong>}
                {(lecture ?? grouped)!.note}
              </p>
            </>
          ) : st.source === 'generated' ? (
            <p>
              <Badge kind="practice">Generated data</Badge> Random values with a {SHAPES.find((s) => s.id === st.shape)?.label.toLowerCase()} shape, rounded to
              one decimal. Not real observations.
            </p>
          ) : (
            <p>
              <Badge kind="personal">Your data</Badge> {values.length} numbers.
            </p>
          )}
        </div>
      </section>

      <div className="seg viz-charts" role="tablist" aria-label="Chart">
        {CHARTS.map((c) => (
          <button key={c.id} role="tab" aria-selected={chart === c.id} className={chart === c.id ? 'on' : ''} onClick={() => setOpt(c.id)} disabled={!!grouped && c.id !== 'histogram'} title={grouped && c.id !== 'histogram' ? 'Needs individual values; this table only has class counts.' : undefined}>
            {c.label}
          </button>
        ))}
      </div>

      {!enough ? (
        <p className="empty">Enter at least two numbers.</p>
      ) : grouped ? (
        <GroupedHistogram st={st} set={set} start={grouped.start} width={grouped.width} counts={grouped.counts} />
      ) : (
        <>
          {chart === 'histogram' && <HistogramPanel values={values} st={st} set={set} />}
          {chart === 'boxplot' && <BoxPanel values={values} st={st} set={set} />}
          {chart === 'dotplot' && (
            <section className="viz-panel">
              <DotPlotChart values={values} xLabel={sourceLabel} />
              <p className="muted small">Each dot is one observation; equal (or nearly equal) values stack.</p>
            </section>
          )}
          {chart === 'stem' && <StemPanel values={values} st={st} set={set} />}
          <SummaryPanel values={values} title={sourceLabel} />
        </>
      )}
    </div>
  );
}

function freqTable(bins: Bin[], n: number) {
  let cum = 0;
  return (
    <div className="table-wrap">
      <table className="num-table">
        <caption className="sr-only">Frequency distribution</caption>
        <thead>
          <tr>
            <th>Class</th>
            <th>Frequency</th>
            <th>Relative freq.</th>
            <th>Cumulative</th>
            <th>Cum. rel. freq.</th>
          </tr>
        </thead>
        <tbody>
          {bins.map((b) => {
            cum += b.count;
            return (
              <tr key={b.lo}>
                <td>
                  [{fmt(b.lo)}, {fmt(b.hi)})
                </td>
                <td>{b.count}</td>
                <td>
                  {b.count}/{n} = {fmt(b.count / n, 4)}
                </td>
                <td>{cum}</td>
                <td>{fmt(cum / n, 4)}</td>
              </tr>
            );
          })}
          <tr className="total">
            <td>Total</td>
            <td>{n}</td>
            <td>1</td>
            <td />
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function HistControls({ st, set, start, width }: { st: DescribeState; set: (p: Partial<DescribeState>) => void; start: number; width: number }) {
  return (
    <div className="viz-row">
      <label className="field narrow">
        <span>First class starts at</span>
        <input type="number" step="any" value={st.start === '' ? start : st.start} onChange={(e) => set({ start: e.target.value })} />
      </label>
      <label className="field narrow">
        <span>Class width</span>
        <input type="number" step="any" min={0} value={st.width === '' ? width : st.width} onChange={(e) => set({ width: e.target.value })} />
      </label>
      <label className="field narrow">
        <span>Bar height</span>
        <select aria-label="Bar height" value={st.mode} onChange={(e) => set({ mode: e.target.value as HistMode })}>
          <option value="freq">Frequency</option>
          <option value="rel">Relative frequency</option>
          <option value="density">Density (area = rel. freq.)</option>
        </select>
      </label>
      <label className="check">
        <input type="checkbox" checked={st.ogive} onChange={(e) => set({ ogive: e.target.checked })} /> Show ogive
      </label>
      {(st.start !== '' || st.width !== '') && (
        <button className="link" onClick={() => set({ start: '', width: '' })}>
          Reset classes
        </button>
      )}
    </div>
  );
}

function HistogramPanel({ values, st, set }: { values: number[]; st: DescribeState; set: (p: Partial<DescribeState>) => void }) {
  const auto = useMemo(() => niceClasses(values), [values]);
  const start = st.start === '' ? auto.start : Number(st.start);
  const width = st.width === '' ? auto.width : Number(st.width);
  const valid = Number.isFinite(start) && width > 0 && (Math.max(...values) - start) / width < 200;
  const bins = valid ? histogram(values, start, width) : [];
  const below = values.filter((v) => v < start).length;
  return (
    <section className="viz-panel">
      <HistControls st={st} set={set} start={auto.start} width={auto.width} />
      {!valid ? (
        <p className="warn-text">Choose a positive class width (and fewer than 200 classes).</p>
      ) : (
        <>
          {below > 0 && <p className="warn-text small">{below} values are below the first class and are not shown. Start the first class at or below {fmt(Math.min(...values))}.</p>}
          <HistogramChart bins={bins} n={values.length} mode={st.mode} xLabel="Value" />
          {st.ogive && <OgiveChart bins={bins} n={values.length} xLabel="Upper class boundary" />}
          <p className="muted small">
            Classes include the left end and exclude the right: a value equal to a boundary goes in the class that starts there. Aim for about 5–10 classes.
          </p>
          {freqTable(bins, values.length)}
        </>
      )}
    </section>
  );
}

function GroupedHistogram({ st, set, start, width, counts }: { st: DescribeState; set: (p: Partial<DescribeState>) => void; start: number; width: number; counts: number[] }) {
  const bins: Bin[] = counts.map((c, i) => ({ lo: roundTo(start + i * width), hi: roundTo(start + (i + 1) * width), count: c }));
  const n = counts.reduce((s, v) => s + v, 0);
  return (
    <section className="viz-panel">
      <div className="viz-row">
        <label className="field narrow">
          <span>Bar height</span>
          <select aria-label="Bar height" value={st.mode} onChange={(e) => set({ mode: e.target.value as HistMode })}>
            <option value="freq">Frequency</option>
            <option value="rel">Relative frequency</option>
            <option value="density">Density</option>
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={st.ogive} onChange={(e) => set({ ogive: e.target.checked })} /> Show ogive
        </label>
      </div>
      <HistogramChart bins={bins} n={n} mode={st.mode} xLabel="Level units" />
      {st.ogive && <OgiveChart bins={bins} n={n} xLabel="Upper class boundary" />}
      {freqTable(bins, n)}
    </section>
  );
}

function BoxPanel({ values, st, set }: { values: number[]; st: DescribeState; set: (p: Partial<DescribeState>) => void }) {
  const b = boxSummary(values);
  const s = sortNum(values);
  const list = (xs: number[]) => (xs.length > 30 ? `${xs.slice(0, 12).map((v) => fmt(v)).join(', ')}, …, ${xs.slice(-6).map((v) => fmt(v)).join(', ')}` : xs.map((v) => fmt(v)).join(', '));
  const low = b.outliers.filter((o) => o.side === 'low');
  const high = b.outliers.filter((o) => o.side === 'high');
  const describeSide = (os: typeof b.outliers, side: string) =>
    os.length ? os.map((o) => `${fmt(o.value)} (${o.kind})`).join(', ') : `none on the ${side}`;
  return (
    <section className="viz-panel">
      <div className="viz-row">
        <label className="check">
          <input type="checkbox" checked={st.fences} onChange={(e) => set({ fences: e.target.checked })} /> Show fences
        </label>
        <label className="check">
          <input type="checkbox" checked={st.points} onChange={(e) => set({ points: e.target.checked })} /> Show every observation
        </label>
        <span className="legend small">
          <span aria-hidden>◦</span> mild outlier · <span aria-hidden>∗</span> extreme outlier (lecture symbols)
        </span>
      </div>
      <BoxPlotChart box={b} values={values} showFences={st.fences} showPoints={st.points} xLabel="Value" />
      {b.iqr === 0 && <p className="warn-text small">IQR = 0: the fence rule is degenerate here, so no outliers are flagged automatically.</p>}
      <ol className="box-steps">
        <li>
          <strong>Order the data</strong> (n = {b.n}): {list(s)}
        </li>
        <li>
          <strong>Quartiles.</strong> Q₂ = median = {fmt(b.q2)}.{' '}
          {b.n % 2 ? 'n is odd, so the median goes in both halves (course convention).' : 'n is even, so the halves split evenly.'} Lower half ({b.lower.length}
          ): {list(b.lower)} → Q₁ = {fmt(b.q1)}. Upper half: {list(b.upper)} → Q₃ = {fmt(b.q3)}. IQR = {fmt(b.q3)} − {fmt(b.q1)} = {fmt(b.iqr)}.
        </li>
        <li>
          <strong>Fences.</strong> Inner: Q₁ − 1.5·IQR = {fmt(b.inner[0])}, Q₃ + 1.5·IQR = {fmt(b.inner[1])}. Outer: Q₁ − 3·IQR = {fmt(b.outer[0])}, Q₃ + 3·IQR ={' '}
          {fmt(b.outer[1])}. A value <em>at or beyond</em> a fence counts.
        </li>
        <li>
          <strong>Outliers.</strong> Low: {describeSide(low, 'left')}. High: {describeSide(high, 'right')}.
        </li>
        <li>
          <strong>Whiskers</strong> go to the most extreme non-outliers: P₁ = {fmt(b.p1)}, P₂ = {fmt(b.p2)}.
        </li>
        <li>
          <strong>Five-number summary</strong> uses the actual extremes: {'{'}
          {fmt(b.min)}, {fmt(b.q1)}, {fmt(b.q2)}, {fmt(b.q3)}, {fmt(b.max)}
          {'}'}.
        </li>
      </ol>
      <details className="small">
        <summary>Why does software give different quartiles?</summary>
        <p>
          R’s default and Excel’s QUARTILE.INC interpolate between values: Q₁ = {fmt(quantileType7(values, 0.25))}, Q₃ = {fmt(quantileType7(values, 0.75))} for these
          data. On the exam, use the course rule above.
        </p>
      </details>
    </section>
  );
}

function StemPanel({ values, st, set }: { values: number[]; st: DescribeState; set: (p: Partial<DescribeState>) => void }) {
  const auto = autoLeafUnit(values);
  const unit = st.leaf ? Number(st.leaf) : auto;
  const units = [0.001, 0.01, 0.1, 1, 10, 100].filter((u) => u >= 10 ** -decimalsOf(values) - 1e-12 && (Math.max(...values) - Math.min(...values)) / (u * 10) <= 60);
  const sl = stemAndLeaf(values, unit, st.split);
  const ex = sl.rows.find((r) => r.leaves.length);
  const exValue = ex ? roundTo((ex.stem * 10 + ex.leaves[0]) * unit) : 0;
  const stemPlace = (u: number) => (u * 10 >= 1 ? `${fmt(u * 10)}s` : `${fmt(u * 10)}`);
  return (
    <section className="viz-panel">
      <div className="viz-row">
        <label className="field narrow">
          <span>Leaf digit is the</span>
          <select aria-label="Leaf digit is the" value={String(unit)} onChange={(e) => set({ leaf: e.target.value })}>
            {(units.includes(unit) ? units : [...units, unit]).map((u) => (
              <option key={u} value={String(u)}>
                {u === 1 ? 'ones' : u === 10 ? 'tens' : u === 100 ? 'hundreds' : u === 0.1 ? 'tenths' : u === 0.01 ? 'hundredths' : 'thousandths'} digit
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input type="checkbox" checked={st.split} onChange={(e) => set({ split: e.target.checked })} /> Two lines per stem (leaves 0–4, 5–9)
        </label>
      </div>
      {sl.rows.length > 40 ? (
        <p className="warn-text">That leaf unit gives {sl.rows.length} stems; choose a larger one.</p>
      ) : (
        <table className="stem-leaf" aria-label="Stem-and-leaf plot">
          <thead>
            <tr>
              <th>Stem</th>
              <th>Leaves</th>
            </tr>
          </thead>
          <tbody>
            {sl.rows.map((r, i) => (
              <tr key={i}>
                <td>{r.label}</td>
                <td>{r.leaves.join(' ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {ex && (
        <p className="small">
          <strong>Key:</strong> {ex.label} | {ex.leaves[0]} = {fmt(exValue, 6)} (stem = {stemPlace(unit)} place, leaf = {fmt(unit, 6)}s). A stem-and-leaf plot must always state its
          place values.
        </p>
      )}
      {values.some((v) => Math.abs(roundTo(Math.round(v / unit) * unit) - v) > 1e-9) && (
        <p className="muted small">Values have more digits than the leaf unit, so they are rounded for this display.</p>
      )}
    </section>
  );
}

function SummaryPanel({ values, title }: { values: number[]; title: string }) {
  const b = boxSummary(values);
  const m = mean(values);
  const s = sd(values);
  const mo = modes(values);
  const [zx, setZx] = useState('');
  const z = zx.trim() === '' ? null : (Number(zx) - m) / s;
  const md = [
    `**${title}** (n = ${values.length})`,
    `- mean x̄ = ${fmt(m)}, median = ${fmt(b.q2)}, s = ${fmt(s)}, s² = ${fmt(variance(values))}`,
    `- Q1 = ${fmt(b.q1)}, Q3 = ${fmt(b.q3)}, IQR = ${fmt(b.iqr)}; fences ${fmt(b.inner[0])} / ${fmt(b.inner[1])}`,
    `- five-number summary {${[b.min, b.q1, b.q2, b.q3, b.max].map((v) => fmt(v)).join(', ')}}; whiskers ${fmt(b.p1)}–${fmt(b.p2)}`,
    `- outliers: ${b.outliers.length ? b.outliers.map((o) => `${fmt(o.value)} (${o.kind})`).join(', ') : 'none'}`,
  ].join('\n');
  return (
    <section className="viz-panel" aria-label="Summary statistics">
      <div className="box-head">
        <h2>Summary</h2>
        <CopyButton text={md} />
      </div>
      <div className="stat-grid">
        <Stat label="n" value={values.length} />
        <Stat label="Mean" tex="\bar x" value={fmt(m)} />
        <Stat label="Median" tex="\tilde x" value={fmt(median(values))} />
        <Stat label="Mode" value={mo.length ? (mo.length > 4 ? `${mo.length} modes` : mo.map((v) => fmt(v)).join(', ')) : 'none'} />
        <Stat label="Sample variance" tex="s^2" value={fmt(variance(values))} />
        <Stat label="Sample sd" tex="s" value={fmt(s)} />
        <Stat label="Range" value={fmt(b.max - b.min)} />
        <Stat label="Q1" tex="Q_1" value={fmt(b.q1)} />
        <Stat label="Q3" tex="Q_3" value={fmt(b.q3)} />
        <Stat label="IQR" value={fmt(b.iqr)} />
      </div>
      <label className="field narrow z-calc">
        <span>
          z-score of a value <TeX tex="z=(x-\bar x)/s" />
        </span>
        <input type="number" step="any" value={zx} onChange={(e) => setZx(e.target.value)} placeholder="x" />
        {z !== null && Number.isFinite(z) && (
          <span>
            z = ({fmt(Number(zx))} − {fmt(m)}) / {fmt(s)} = <strong>{fmt(z, 3)}</strong>
          </span>
        )}
      </label>
      <p className="muted small">
        Mean {m > b.q2 ? '>' : m < b.q2 ? '<' : '='} median{m > b.q2 ? ' — consistent with a longer right tail' : m < b.q2 ? ' — consistent with a longer left tail' : ''}. Look
        at the shape too: the comparison alone does not prove skew.
      </p>
    </section>
  );
}

// ======================= Distribution explorer =======================

const FAMILY_ORDER: FamilyId[] = ['binomial', 'geometric', 'negbin', 'hypergeometric', 'poisson', 'uniform', 'normal', 'exponential', 'gamma', 'chisq'];

interface DistState {
  params: Partial<Record<FamilyId, Record<string, number>>>;
  ev: EventKind;
  a: number;
  b: number;
}

function DistributionTool({ opt, from }: { opt?: string; from: 'main' | 'pane' }) {
  const { course } = useData();
  const setOpt = useOptSync('distributions', from);
  const famId: FamilyId = FAMILY_ORDER.find((f) => f === opt) ?? 'binomial';
  const fam = FAMILIES[famId];
  const summary = course.distributions.find((d) => d.id === famId);
  const [st, set] = usePersisted<DistState>('viz.distributions', { params: {}, ev: 'between', a: 2, b: 4 });
  const p = { ...fam.defaults, ...(st.params[famId] ?? {}) };
  const setParam = (k: string, v: number) => set({ params: { ...st.params, [famId]: { ...p, [k]: v } } });
  const err = fam.check?.(p) ?? null;
  const mu = fam.mean(p);
  const sigma = Math.sqrt(fam.variance(p));
  const ev: EventKind = fam.type === 'continuous' && st.ev === 'eq' ? 'le' : st.ev;
  const [lo, hi] = fam.range(p);
  const prob = err ? NaN : probability(fam, p, ev, st.a, st.b);
  const evTex = (() => {
    const A = fmt(st.a);
    const B = fmt(st.b);
    return ev === 'le' ? `P(X\\le ${A})` : ev === 'ge' ? `P(X\\ge ${A})` : ev === 'eq' ? `P(X=${A})` : `P(${A}\\le X\\le ${B})`;
  })();
  const inEvent = (x: number) => (ev === 'le' ? x <= st.a : ev === 'ge' ? x >= st.a : ev === 'eq' ? x === st.a : x >= st.a && x <= st.b);

  let how: ReactNode = null;
  if (!err && fam.type === 'discrete') {
    const F = (k: number) => probability(fam, p, 'le', k, 0);
    if (ev === 'between') how = <TeX tex={`=F(${Math.floor(st.b)})-F(${Math.ceil(st.a) - 1})=${fmt(F(Math.floor(st.b)), 6)}-${fmt(F(Math.ceil(st.a) - 1), 6)}`} />;
    else if (ev === 'ge') how = <TeX tex={`=1-F(${Math.ceil(st.a) - 1})=1-${fmt(F(Math.ceil(st.a) - 1), 6)}`} />;
    else if (ev === 'le') how = <TeX tex={`=F(${Math.floor(st.a)})`} />;
  } else if (!err && famId === 'normal') {
    const z = (x: number) => fmt((x - mu) / sigma, 4);
    how =
      ev === 'between' ? (
        <TeX tex={`=\\Phi\\!\\left(${z(st.b)}\\right)-\\Phi\\!\\left(${z(st.a)}\\right)\\quad z=\\frac{x-\\mu}{\\sigma},\\ \\sigma=\\sqrt{${fmt(p.var)}}=${fmt(sigma, 4)}`} />
      ) : ev === 'ge' ? (
        <TeX tex={`=1-\\Phi(${z(st.a)})`} />
      ) : (
        <TeX tex={`=\\Phi(${z(st.a)})\\quad z=\\frac{${fmt(st.a)}-${fmt(mu)}}{${fmt(sigma, 4)}}`} />
      );
  } else if (!err && famId === 'exponential') {
    how = ev === 'ge' ? <TeX tex={`=e^{-${fmt(st.a)}/${fmt(p.beta)}}`} /> : null;
  }

  const xs: number[] = [];
  const ps: number[] = [];
  if (!err && fam.type === 'discrete') for (let x = lo; x <= hi; x++) (xs.push(x), ps.push(fam.f(x, p)));
  const shade: [number, number] | null = ev === 'le' ? [lo, st.a] : ev === 'ge' ? [st.a, hi] : ev === 'between' ? [st.a, st.b] : null;

  return (
    <div className="viz-tool">
      <section className="viz-panel">
        <div className="viz-row">
          <label className="field">
            <span>Distribution</span>
            <select aria-label="Distribution" value={famId} onChange={(e) => setOpt(e.target.value)}>
              {FAMILY_ORDER.map((f) => (
                <option key={f} value={f}>
                  {course.distributions.find((d) => d.id === f)?.name ?? f}
                </option>
              ))}
            </select>
          </label>
          {fam.params.map((pr) => (
            <label key={pr.key} className="field param">
              <span>{pr.label}</span>
              <span className="param-inputs">
                <input type="range" min={pr.min} max={pr.max} step={pr.step} value={p[pr.key]} onChange={(e) => setParam(pr.key, Number(e.target.value))} aria-label={pr.label} />
                <input
                  type="number"
                  min={pr.min}
                  max={pr.max}
                  step={pr.step}
                  value={p[pr.key]}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (Number.isFinite(v) && v >= pr.min && v <= pr.max) setParam(pr.key, pr.integer ? Math.round(v) : v);
                  }}
                  aria-label={`${pr.label} value`}
                />
              </span>
            </label>
          ))}
        </div>
        {summary && (
          <div className="dist-formulas">
            <TeX tex={`X\\sim ${summary.notation}:\\quad ${fam.type === 'discrete' ? 'p(x)' : 'f(x)'}=${summary.pmf},\\ ${summary.support}`} />
            <span className="muted small">
              {' '}
              <LessonChip id={summary.lesson_id} /> {summary.supplemental && <Badge kind="supplemental">† not developed in the lectures</Badge>}
            </span>
          </div>
        )}
        {famId === 'geometric' && <p className="small muted">Course convention: X counts total trials up to and including the first success (x = 1, 2, …).</p>}
        {famId === 'negbin' && <p className="small muted">X counts total trials up to and including the r-th success (x = r, r + 1, …).</p>}
        {famId === 'normal' && <p className="small muted">The second parameter is the variance σ². For N(5, 4), σ = 2.</p>}
        {(famId === 'gamma' || famId === 'exponential') && <p className="small muted">β is a scale parameter (mean αβ); a Poisson rate a gives β = 1/a.</p>}
      </section>

      {err ? (
        <p className="warn-text">{err}</p>
      ) : (
        <>
          <section className="viz-panel">
            <div className="viz-row">
              <label className="field narrow">
                <span>Probability of</span>
                <select aria-label="Probability of" value={ev} onChange={(e) => set({ ev: e.target.value as EventKind })}>
                  <option value="le">X ≤ a</option>
                  <option value="ge">X ≥ a</option>
                  <option value="between">a ≤ X ≤ b</option>
                  {fam.type === 'discrete' && <option value="eq">X = a</option>}
                </select>
              </label>
              <label className="field narrow">
                <span>a</span>
                <input type="number" step="any" value={st.a} onChange={(e) => set({ a: Number(e.target.value) })} />
              </label>
              {ev === 'between' && (
                <label className="field narrow">
                  <span>b</span>
                  <input type="number" step="any" value={st.b} onChange={(e) => set({ b: Number(e.target.value) })} />
                </label>
              )}
              <div className="prob-result" aria-live="polite">
                <TeX tex={evTex} /> = <strong>{fmt(prob, 6)}</strong> {how && <span className="prob-how">{how}</span>}
              </div>
            </div>
            {fam.type === 'continuous' && <p className="muted small">For a continuous X, P(X = a) = 0, so ≤ and &lt; give the same probability.</p>}
            {fam.type === 'discrete' ? (
              <PmfChart xs={xs} ps={ps} inEvent={inEvent} mu={mu} sigma={sigma} />
            ) : (
              <PdfChart f={(x) => fam.f(x, p)} range={[lo, hi]} shade={shade} mu={mu} sigma={sigma} />
            )}
            <p className="legend small">
              <span className="swatch on" /> in the event <span className="swatch off" /> outside · line at μ, light band μ ± σ
            </p>
          </section>
          <section className="viz-panel">
            <div className="stat-grid">
              <Stat label="Mean" tex="E[X]" value={fmt(mu, 4)} />
              <Stat label="Variance" tex="V(X)" value={fmt(sigma ** 2, 4)} />
              <Stat label="Standard deviation" tex="sd[X]" value={fmt(sigma, 4)} />
              {summary && (
                <div className="stat wide">
                  <span className="stat-label">Formulas</span>
                  <span>
                    <TeX tex={`E[X]=${summary.mean},\\quad V(X)=${summary.variance}`} />
                  </span>
                </div>
              )}
            </div>
            {fam.type === 'discrete' && xs.length <= 60 && (
              <details>
                <summary>Table of P(X = x) and F(x)</summary>
                <div className="table-wrap">
                  <table className="num-table">
                    <thead>
                      <tr>
                        <th>x</th>
                        <th>P(X = x)</th>
                        <th>F(x) = P(X ≤ x)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        let c = 0;
                        return xs.map((x, i) => {
                          c += ps[i];
                          return (
                            <tr key={x} className={inEvent(x) ? 'hl' : ''}>
                              <td>{x}</td>
                              <td>{fmt(ps[i], 6)}</td>
                              <td>{fmt(Math.min(1, c), 6)}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </section>
        </>
      )}
    </div>
  );
}

// ======================= Scatterplot & correlation =======================

interface ScatterState {
  source: 'generated' | 'curved' | 'custom';
  rho: number;
  n: number;
  seed: number;
  custom: string;
  quadrants: boolean;
  line: boolean;
}

function ScatterTool() {
  const [st, set] = usePersisted<ScatterState>('viz.scatter', {
    source: 'generated',
    rho: 0.7,
    n: 40,
    seed: 1,
    custom: '1 2\n2 4\n3 5\n4 4\n5 6',
    quadrants: true,
    line: true,
  });
  const { x, y, bad } = useMemo(() => {
    if (st.source === 'custom') {
      const xs: number[] = [];
      const ys: number[] = [];
      const badLines: string[] = [];
      for (const line of st.custom.split('\n').filter((l) => l.trim())) {
        const { values } = parseNumbers(line);
        if (values.length === 2) (xs.push(values[0]), ys.push(values[1]));
        else badLines.push(line.trim());
      }
      return { x: xs, y: ys, bad: badLines };
    }
    return { ...generatePairs(st.n, st.rho, st.seed, st.source === 'curved'), bad: [] as string[] };
  }, [st.source, st.rho, st.n, st.seed, st.custom]);

  const ok = x.length >= 3 && sd(x) > 0 && sd(y) > 0;
  const fit = ok ? leastSquares(x, y) : null;
  const r = ok ? correlation(x, y) : NaN;
  return (
    <div className="viz-tool">
      <section className="viz-panel">
        <div className="viz-row">
          <label className="field">
            <span>Data</span>
            <select aria-label="Data" value={st.source} onChange={(e) => set({ source: e.target.value as ScatterState['source'] })}>
              <option value="generated">Generated: linear, choose the correlation</option>
              <option value="curved">Generated: strong curve (R near 0)</option>
              <option value="custom">My own (x, y) pairs</option>
            </select>
          </label>
          {st.source === 'generated' && (
            <label className="field">
              <span>Target ρ = {fmt(st.rho, 2)}</span>
              <input type="range" min={-1} max={1} step={0.05} value={st.rho} onChange={(e) => set({ rho: Number(e.target.value) })} aria-label="Target correlation" />
            </label>
          )}
          {st.source !== 'custom' && (
            <>
              <label className="field">
                <span>n = {st.n}</span>
                <input type="range" min={5} max={300} value={st.n} onChange={(e) => set({ n: Number(e.target.value) })} aria-label="Number of points" />
              </label>
              <button onClick={() => set({ seed: st.seed + 1 })}>🎲 New sample</button>
            </>
          )}
        </div>
        {st.source === 'custom' && (
          <label className="field">
            <span>One pair per line: x y (or x, y)</span>
            <textarea rows={5} value={st.custom} onChange={(e) => set({ custom: e.target.value })} spellCheck={false} />
            {bad.length > 0 && <span className="warn-text small">Ignored lines: {bad.slice(0, 4).join(' | ')}</span>}
          </label>
        )}
        <p className="small">
          {st.source === 'custom' ? <Badge kind="personal">Your data</Badge> : <Badge kind="practice">Generated data</Badge>}{' '}
          <span className="muted">The Oct 12 notes show only schematic scatterplots, so there is no lecture dataset here.</span>
        </p>
      </section>
      {!ok ? (
        <p className="empty">Enter at least three pairs, with x and y each taking more than one value.</p>
      ) : (
        <>
          <section className="viz-panel">
            <div className="viz-row">
              <label className="check">
                <input type="checkbox" checked={st.quadrants} onChange={(e) => set({ quadrants: e.target.checked })} /> Quadrants at (x̄, ȳ)
              </label>
              <label className="check">
                <input type="checkbox" checked={st.line} onChange={(e) => set({ line: e.target.checked })} /> Least-squares line
              </label>
            </div>
            <ScatterChart xs={x} ys={y} line={st.line ? fit : null} quadrants={st.quadrants} />
            {st.quadrants && (
              <p className="legend small">
                <span className="swatch pos" /> quadrants I and III: <TeX tex="z_{x}z_{y}>0" /> pushes R up <span className="swatch neg" /> quadrants II and IV:{' '}
                <TeX tex="z_{x}z_{y}<0" /> pushes R down
              </p>
            )}
          </section>
          <section className="viz-panel">
            <div className="stat-grid">
              <Stat label="n" value={x.length} />
              <Stat label="Sample correlation" tex="R" value={fmt(r, 4)} />
              <Stat label="Strength" value={`${strength(r)} ${r >= 0 ? 'positive' : 'negative'}`} />
              <Stat label="R squared" tex="R^2" value={`${fmt(r * r, 4)} (${fmt(r * r * 100, 1)}%)`} />
              <Stat label="Mean x" tex="\bar x" value={fmt(mean(x), 3)} />
              <Stat label="Mean y" tex="\bar y" value={fmt(mean(y), 3)} />
              <Stat label="sd x" tex="s_x" value={fmt(sd(x), 3)} />
              <Stat label="sd y" tex="s_y" value={fmt(sd(y), 3)} />
              <div className="stat wide">
                <span className="stat-label">Line of best fit</span>
                <span>
                  <TeX tex={`b=R\\frac{s_y}{s_x}=${fmt(fit!.b, 4)},\\quad a=\\bar y-b\\bar x=${fmt(fit!.a, 4)},\\quad \\hat y=${fmt(fit!.a, 3)}${fit!.b < 0 ? '-' : '+'}${fmt(Math.abs(fit!.b), 3)}x`} />
                </span>
              </div>
            </div>
            <p className="muted small">
              Strength uses the lecture’s classroom guide (|R| ≥ 0.8 strong, 0.5–0.8 moderate, below 0.5 weak). R measures <em>linear</em> association only
              {st.source === 'curved' && ': these points follow a clear curve, yet R is close to 0'}. Correlation is not causation.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

// ======================= Sampling distribution of x̄ =======================

type Pop = 'normal' | 'exponential' | 'uniform' | 'skewed';

interface SamplingState {
  pop: Pop;
  mu: number;
  var: number;
  n: number;
  reps: number;
  seed: number;
  c: number;
}

const POP_INFO: Record<Pop, { label: string; normal: boolean }> = {
  normal: { label: 'Normal N(μ, σ²)', normal: true },
  exponential: { label: 'Exponential (right-skewed)', normal: false },
  uniform: { label: 'Uniform (flat)', normal: false },
  skewed: { label: 'Gamma, α = 2 (moderately skewed)', normal: false },
};

function SamplingTool() {
  const [st, set] = usePersisted<SamplingState>('viz.sampling', { pop: 'normal', mu: 61, var: 81, n: 9, reps: 2000, seed: 1, c: 64 });
  const sigma = Math.sqrt(st.var);
  // Each population is parameterised to have mean μ and variance σ², so the comparison is like for like.
  const pop = useMemo(() => {
    const { mu } = st;
    switch (st.pop) {
      case 'normal':
        return { f: (x: number) => FAMILIES.normal.f(x, { mu, var: st.var }), draw: (r: () => number) => mu + sigma * normalDraw(r), range: [mu - 4 * sigma, mu + 4 * sigma] as [number, number] };
      case 'exponential':
        return {
          f: (x: number) => FAMILIES.exponential.f(x - (mu - sigma), { beta: sigma }),
          draw: (r: () => number) => mu - sigma - sigma * Math.log(1 - r()),
          range: [mu - sigma * 1.2, mu + 5 * sigma] as [number, number],
        };
      case 'uniform': {
        const h = sigma * Math.sqrt(3);
        return { f: (x: number) => (Math.abs(x - mu) <= h ? 1 / (2 * h) : 0), draw: (r: () => number) => mu - h + 2 * h * r(), range: [mu - 1.4 * h, mu + 1.4 * h] as [number, number] };
      }
      case 'skewed': {
        const beta = sigma / Math.SQRT2;
        const shift = mu - 2 * beta;
        return {
          f: (x: number) => FAMILIES.gamma.f(x - shift, { alpha: 2, beta }),
          draw: (r: () => number) => shift + beta * gammaDraw(r, 2),
          range: [shift - beta * 0.5, shift + 2 * beta + 6 * Math.SQRT2 * beta] as [number, number],
        };
      }
    }
  }, [st.pop, st.mu, st.var, sigma]);

  const means = useMemo(() => {
    const r = rng(st.seed * 7919 + st.n);
    return Array.from({ length: st.reps }, () => {
      let s = 0;
      for (let i = 0; i < st.n; i++) s += pop.draw(r);
      return s / st.n;
    });
  }, [pop, st.n, st.reps, st.seed]);

  const se = sigma / Math.sqrt(st.n);
  const range: [number, number] = [st.mu - 4.5 * se, st.mu + 4.5 * se];
  const width = niceClasses([range[0], range[1]], 30).width;
  const start = Math.floor(range[0] / width) * width;
  const bins = histogram(
    means.filter((m) => m >= start),
    start,
    width,
    Math.ceil((range[1] - start) / width),
  );
  const simP = means.filter((m) => m <= st.c).length / means.length;
  const theoryP = phi((st.c - st.mu) / se);
  const info = POP_INFO[st.pop];
  return (
    <div className="viz-tool">
      <section className="viz-panel">
        <div className="viz-row">
          <label className="field">
            <span>Population</span>
            <select aria-label="Population" value={st.pop} onChange={(e) => set({ pop: e.target.value as Pop })}>
              {(Object.keys(POP_INFO) as Pop[]).map((k) => (
                <option key={k} value={k}>
                  {POP_INFO[k].label}
                </option>
              ))}
            </select>
          </label>
          <label className="field narrow">
            <span>μ</span>
            <input type="number" step="any" value={st.mu} onChange={(e) => set({ mu: Number(e.target.value) })} />
          </label>
          <label className="field narrow">
            <span>σ² (variance)</span>
            <input type="number" step="any" min={0.0001} value={st.var} onChange={(e) => Number(e.target.value) > 0 && set({ var: Number(e.target.value) })} />
          </label>
          <label className="field">
            <span>Sample size n = {st.n}</span>
            <input type="range" min={1} max={100} value={st.n} onChange={(e) => set({ n: Number(e.target.value) })} aria-label="Sample size" />
          </label>
          <label className="field narrow">
            <span>Samples drawn</span>
            <select aria-label="Samples drawn" value={st.reps} onChange={(e) => set({ reps: Number(e.target.value) })}>
              {[200, 1000, 2000, 5000].map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <button onClick={() => set({ seed: st.seed + 1 })}>🎲 Draw again</button>
        </div>
        <p className="small muted">
          Defaults are the Oct 14 finishing-time model X ∼ N(61, 81) with samples of 9 (lesson <LessonChip id="20-sampling" />
          ). Each population here has mean μ and variance σ², so only the shape differs.
        </p>
      </section>
      <section className="viz-panel">
        <h2 className="viz-sub">Population: one observation X</h2>
        <PdfChart f={pop.f} range={pop.range} shade={null} mu={st.mu} sigma={sigma} height={200} />
      </section>
      <section className="viz-panel">
        <h2 className="viz-sub">
          {st.reps} sample means <span className="tx">x̄</span> (n = {st.n} each)
        </h2>
        <HistogramChart
          bins={bins}
          n={means.length}
          mode="density"
          xLabel="x̄"
          curve={{ f: (x) => FAMILIES.normal.f(x, { mu: st.mu, var: se * se }), label: 'N(μ, σ²/n)' }}
        />
        <p className="legend small">
          Bars: simulated x̄ values (density scale) · curve: <TeX tex={`N\\!\\left(\\mu,\\ \\sigma^2/n\\right)=N(${fmt(st.mu)},\\ ${fmt(se * se, 4)})`} />
        </p>
        <p className={`small ${info.normal ? '' : 'warn-text'}`}>
          {info.normal
            ? 'Normal population: x̄ is exactly normal with variance σ²/n (lesson 20).'
            : 'Non-normal population: the curve is only an approximation that improves as n grows (central limit theorem). The supplied notes have not covered the CLT yet.'}
        </p>
      </section>
      <section className="viz-panel">
        <div className="stat-grid">
          <Stat label="Mean of the x̄ values" value={`${fmt(mean(means), 3)} (theory μ = ${fmt(st.mu)})`} />
          <Stat label="sd of the x̄ values" value={`${fmt(sd(means), 3)} (theory σ/√n = ${fmt(se, 3)})`} />
          <div className="stat wide">
            <label className="z-calc">
              <span className="stat-label">
                Check a probability: P(x̄ ≤{' '}
                <input type="number" step="any" value={st.c} onChange={(e) => set({ c: Number(e.target.value) })} aria-label="Cut-off for the sample mean" className="inline-num" />)
              </span>
              <span>
                simulated {fmt(simP, 4)} · {info.normal ? 'exact' : 'normal approx.'} <TeX tex={`\\Phi\\!\\left(\\frac{${fmt(st.c)}-${fmt(st.mu)}}{${fmt(se, 4)}}\\right)=${fmt(theoryP, 4)}`} />
              </span>
            </label>
          </div>
        </div>
        <p className="muted small">The spread of x̄ shrinks like 1/√n: quadruple n to halve it. A single observation X still has the full variance σ².</p>
      </section>
    </div>
  );
}

// ======================= Bar graph & pie chart =======================

function CategoricalTool() {
  const { course } = useData();
  const base = course.datasets.categorical[0];
  const [st, set] = usePersisted<{ rows: { label: string; count: number }[]; rel: boolean; edited: boolean }>('viz.categorical', {
    rows: base ? base.categories.map((c, i) => ({ label: c, count: base.counts[i] })) : [{ label: 'A', count: 1 }],
    rel: false,
    edited: false,
  });
  const n = st.rows.reduce((s, r) => s + (r.count || 0), 0);
  const setRow = (i: number, p: Partial<{ label: string; count: number }>) => set({ rows: st.rows.map((r, j) => (j === i ? { ...r, ...p } : r)), edited: true });
  const labels = st.rows.map((r) => r.label || '?');
  const counts = st.rows.map((r) => Math.max(0, r.count || 0));
  return (
    <div className="viz-tool">
      <section className="viz-panel">
        <p className="small">
          {st.edited ? (
            <>
              <Badge kind="personal">Edited counts</Badge>{' '}
              <button
                className="link"
                onClick={() => base && set({ rows: base.categories.map((c, i) => ({ label: c, count: base.counts[i] })), edited: false })}
              >
                Restore the lecture data
              </button>
            </>
          ) : (
            base && (
              <>
                <Badge kind="instructor">Lecture data</Badge> {base.title} <SourceChips refs={base.refs} compact /> <LessonChip id={base.lesson_id} /> — {base.note}
              </>
            )
          )}
        </p>
        <div className="table-wrap">
          <table className="num-table cat-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Frequency</th>
                <th>Relative freq.</th>
                <th>Pie slice</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {st.rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <input value={r.label} onChange={(e) => setRow(i, { label: e.target.value })} aria-label={`Category ${i + 1} name`} />
                  </td>
                  <td>
                    <input type="number" min={0} value={r.count} onChange={(e) => setRow(i, { count: Math.max(0, Math.round(Number(e.target.value) || 0)) })} aria-label={`${r.label} frequency`} />
                  </td>
                  <td>
                    {r.count}/{n} = {fmt(n ? r.count / n : 0, 4)}
                  </td>
                  <td>{fmt(n ? (r.count / n) * 360 : 0, 1)}°</td>
                  <td>
                    {st.rows.length > 1 && (
                      <button className="link" onClick={() => set({ rows: st.rows.filter((_, j) => j !== i), edited: true })} aria-label={`Remove ${r.label}`}>
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="total">
                <td>Total</td>
                <td>{n}</td>
                <td>1</td>
                <td>360°</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
        {st.rows.length < 8 && (
          <button onClick={() => set({ rows: [...st.rows, { label: `C${st.rows.length + 1}`, count: 5 }], edited: true })}>+ Add category</button>
        )}
      </section>
      <section className="viz-panel">
        <div className="viz-row">
          <h2 className="viz-sub">Bar graph</h2>
          <label className="check">
            <input type="checkbox" checked={st.rel} onChange={(e) => set({ rel: e.target.checked })} /> Relative frequency
          </label>
        </div>
        <BarChart labels={labels} counts={counts} rel={st.rel} />
      </section>
      <section className="viz-panel">
        <h2 className="viz-sub">Pie chart</h2>
        {st.rows.length > 3 && <p className="muted small">With more than three slices some colours are hard to tell apart; use the labels. A bar graph compares many categories better.</p>}
        <PieChart labels={labels} counts={counts} />
        <p className="muted small">Slice angle = (frequency ÷ n) × 360°.</p>
      </section>
    </div>
  );
}
