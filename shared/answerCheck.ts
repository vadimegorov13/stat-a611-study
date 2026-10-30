// Numeric answer parsing and checking.
// Accepts plain numbers, percentages, fractions, and small expressions such as exp(-2) or 15/sqrt(25).

export type NumericStatus = 'correct' | 'correct-rounded' | 'incorrect' | 'needs-format' | 'invalid';

export interface NumericResult {
  status: NumericStatus;
  value?: number;
  message: string;
}

export interface NumericSpec {
  answer: number;
  absolute_tolerance: number;
  relative_tolerance: number;
  expect?: 'decimal' | 'percent' | 'count' | 'value';
}

// ---------- tiny safe expression evaluator ----------

type Tok = { t: 'num'; v: number } | { t: 'op'; v: string } | { t: 'id'; v: string } | { t: 'lp' } | { t: 'rp' };

const FUNCS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  exp: Math.exp,
  ln: Math.log,
  log: Math.log,
  log10: Math.log10,
  abs: Math.abs,
};
const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };

function normalizeInput(raw: string): string {
  return raw
    .normalize('NFKC')
    .replace(/[−–—]/g, '-')
    .replace(/[×·∙]/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'pi')
    .replace(/√\s*\(/g, 'sqrt(')
    .replace(/√\s*([0-9.]+)/g, 'sqrt($1)')
    .replace(/\*\*/g, '^')
    .replace(/^\s*(≈|~|=|approx\.?|about)\s*/i, '')
    .trim();
}

function tokenize(s: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    const num = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/i.exec(s.slice(i));
    if (num) {
      out.push({ t: 'num', v: parseFloat(num[0]) });
      i += num[0].length;
      continue;
    }
    const id = /^[a-z][a-z0-9]*/i.exec(s.slice(i));
    if (id) {
      out.push({ t: 'id', v: id[0].toLowerCase() });
      i += id[0].length;
      continue;
    }
    if ('+-*/^'.includes(c)) out.push({ t: 'op', v: c });
    else if (c === '(') out.push({ t: 'lp' });
    else if (c === ')') out.push({ t: 'rp' });
    else throw new Error(`Unexpected character “${c}”`);
    i++;
  }
  return out;
}

function evaluate(tokens: Tok[]): number {
  let pos = 0;
  const peek = () => tokens[pos];
  function expr(): number {
    let v = term();
    for (let p = peek(); p && p.t === 'op' && (p.v === '+' || p.v === '-'); p = peek()) {
      pos++;
      const r = term();
      v = p.v === '+' ? v + r : v - r;
    }
    return v;
  }
  function term(): number {
    let v = unary();
    for (let p = peek(); p && p.t === 'op' && (p.v === '*' || p.v === '/'); p = peek()) {
      pos++;
      const r = unary();
      v = p.v === '*' ? v * r : v / r;
    }
    return v;
  }
  function unary(): number {
    const p = peek();
    if (p && p.t === 'op' && (p.v === '-' || p.v === '+')) {
      pos++;
      const v = unary();
      return p.v === '-' ? -v : v;
    }
    return power();
  }
  function power(): number {
    const base = atom();
    const p = peek();
    if (p && p.t === 'op' && p.v === '^') {
      pos++;
      return Math.pow(base, unary());
    }
    return base;
  }
  function atom(): number {
    const p = tokens[pos++];
    if (!p) throw new Error('Incomplete expression');
    if (p.t === 'num') return p.v;
    if (p.t === 'lp') {
      const v = expr();
      if (tokens[pos++]?.t !== 'rp') throw new Error('Missing “)”');
      return v;
    }
    if (p.t === 'id') {
      if (p.v in FUNCS) {
        if (tokens[pos++]?.t !== 'lp') throw new Error(`Use ${p.v}( … )`);
        const v = expr();
        if (tokens[pos++]?.t !== 'rp') throw new Error('Missing “)”');
        return FUNCS[p.v](v);
      }
      if (p.v in CONSTS) return CONSTS[p.v];
      throw new Error(`Unknown name “${p.v}”`);
    }
    throw new Error('Unexpected symbol');
  }
  const v = expr();
  if (pos !== tokens.length) throw new Error('Unexpected text after the number');
  return v;
}

export interface ParsedNumber {
  value: number;
  percent: boolean;
  /** Present only when the input was a single literal number (not an expression). */
  literal?: { decimals: number; sigFigs: number };
}

const UNIT_WORDS =
  /\s*(percent|minutes?|mins?|hours?|hrs?|seconds?|secs?|days?|cm|inches|in|kg|g|units?|points?|ways|arrangements|people|tokens|digits|trials)\.?\s*$/i;

export function parseNumericInput(raw: string): ParsedNumber {
  let s = normalizeInput(raw);
  if (!s) throw new Error('Enter a number.');
  let percent = false;
  const unit = UNIT_WORDS.exec(s);
  if (unit) {
    if (/^percent$/i.test(unit[1])) percent = true;
    s = s.slice(0, unit.index).trim();
  }
  if (s.endsWith('%')) {
    percent = true;
    s = s.slice(0, -1).trim();
  }
  // Thousands separators like 1,200 — anything else with a comma is ambiguous.
  if (s.includes(',')) {
    if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
    else throw new Error('Use a period for decimals (e.g. 0.25), not a comma.');
  }
  const lit = /^[-+]?(\d+\.?\d*|\.\d+)$/.exec(s);
  let literal: ParsedNumber['literal'];
  if (lit) {
    const digits = lit[1];
    const decimals = digits.includes('.') ? digits.split('.')[1].length : 0;
    const sig = digits.replace('.', '').replace(/^0+/, '');
    literal = { decimals, sigFigs: Math.max(sig.length, 1) };
  }
  const value = evaluate(tokenize(s));
  if (!Number.isFinite(value)) throw new Error('That expression does not give a finite number.');
  return { value, percent, literal };
}

function within(x: number, a: number, spec: NumericSpec): boolean {
  const d = Math.abs(x - a);
  return d <= spec.absolute_tolerance || d <= spec.relative_tolerance * Math.abs(a);
}

function fmt(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Number(n.toPrecision(8)));
}

export function checkNumeric(raw: string, spec: NumericSpec): NumericResult {
  let parsed: ParsedNumber;
  try {
    parsed = parseNumericInput(raw);
  } catch (e) {
    return { status: 'invalid', message: (e as Error).message };
  }
  const expectPercent = spec.expect === 'percent';
  let value = parsed.value;
  let literal = parsed.literal;
  if (parsed.percent && !expectPercent) {
    // 25% → 0.25 when a decimal is expected.
    value = value / 100;
    if (literal) literal = { decimals: literal.decimals + 2, sigFigs: literal.sigFigs };
  }
  const a = spec.answer;

  if (within(value, a, spec)) {
    return { status: 'correct', value, message: `Correct. Key: ${fmt(a)}${expectPercent ? '%' : ''}.` };
  }
  // Sensible rounding: a literal with ≥2 significant figures that rounds consistently with the key.
  if (literal && literal.sigFigs >= 2) {
    const halfUnit = 0.5 * Math.pow(10, -literal.decimals);
    if (Math.abs(value - a) <= halfUnit * (1 + 1e-9)) {
      return {
        status: 'correct-rounded',
        value,
        message: `Correct after rounding (${literal.sigFigs} significant figures). More precise key: ${fmt(a)}${
          expectPercent ? '%' : ''
        }. Keep 3–4 significant figures on an exam unless told otherwise.`,
      };
    }
  }
  // Format confusions are reported without recording a graded attempt.
  if (expectPercent && !parsed.percent && within(value * 100, a, spec)) {
    return {
      status: 'needs-format',
      value,
      message: `This question asks for a percent. Your value looks like a proportion — enter it as a percent (e.g. ${fmt(
        value * 100,
      )}).`,
    };
  }
  if (!expectPercent && !parsed.percent && a !== 0 && Math.abs(a) <= 1 && within(value / 100, a, spec)) {
    return {
      status: 'needs-format',
      value,
      message: 'Probabilities and proportions are entered as decimals here (or add a % sign). Re-enter your answer.',
    };
  }
  return { status: 'incorrect', value, message: `Not correct. You entered ${fmt(value)}${expectPercent ? '%' : ''}.` };
}
