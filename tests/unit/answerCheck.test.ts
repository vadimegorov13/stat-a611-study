import { describe, expect, it } from 'vitest';
import { checkNumeric, parseNumericInput } from '../../shared/answerCheck.ts';

const spec = (answer: number, expect?: 'decimal' | 'percent' | 'count' | 'value') => ({
  answer,
  absolute_tolerance: 1e-4,
  relative_tolerance: 1e-3,
  expect,
});

describe('parseNumericInput', () => {
  it('parses plain numbers, fractions and expressions', () => {
    expect(parseNumericInput('0.25').value).toBe(0.25);
    expect(parseNumericInput('3/16').value).toBeCloseTo(0.1875);
    expect(parseNumericInput('exp(-2)').value).toBeCloseTo(Math.exp(-2));
    expect(parseNumericInput('15/sqrt(25)').value).toBe(3);
    expect(parseNumericInput('0.75^2*0.25').value).toBeCloseTo(0.140625);
    expect(parseNumericInput('2^-1').value).toBe(0.5);
    expect(parseNumericInput('−1.25').value).toBe(-1.25);
    expect(parseNumericInput('1,200').value).toBe(1200);
    expect(parseNumericInput('≈ 0.135').value).toBe(0.135);
  });
  it('recognizes percents and units', () => {
    expect(parseNumericInput('25%')).toMatchObject({ value: 25, percent: true });
    expect(parseNumericInput('64 percent')).toMatchObject({ value: 64, percent: true });
    expect(parseNumericInput('3 minutes').value).toBe(3);
  });
  it('rejects junk and ambiguous decimal commas', () => {
    expect(() => parseNumericInput('')).toThrow();
    expect(() => parseNumericInput('abc')).toThrow();
    expect(() => parseNumericInput('0,25')).toThrow(/period/);
    expect(() => parseNumericInput('alert(1)')).toThrow();
  });
});

describe('checkNumeric', () => {
  it('accepts the exact key and expressions', () => {
    expect(checkNumeric('0.140625', spec(0.140625)).status).toBe('correct');
    expect(checkNumeric('9/64', spec(0.140625)).status).toBe('correct');
    expect(checkNumeric('exp(-2)', spec(Math.exp(-2))).status).toBe('correct');
  });
  it('accepts sensible rounding but not wrong digits', () => {
    expect(checkNumeric('0.1353', spec(Math.exp(-2))).status).toBe('correct');
    expect(checkNumeric('0.135', spec(Math.exp(-2))).status).toBe('correct-rounded');
    expect(checkNumeric('0.14', spec(0.140625)).status).toBe('correct-rounded');
    expect(checkNumeric('0.33', spec(1 / 3)).status).toBe('correct-rounded');
    expect(checkNumeric('0.3', spec(1 / 3)).status).toBe('incorrect'); // one significant figure
    expect(checkNumeric('0.15', spec(0.140625)).status).toBe('incorrect');
    expect(checkNumeric('3.16', spec(Math.sqrt(10))).status).toBe('correct');
    expect(checkNumeric('3.2', spec(Math.sqrt(10))).status).toBe('correct-rounded');
    expect(checkNumeric('3.17', spec(Math.sqrt(10))).status).toBe('incorrect');
    expect(checkNumeric('1', spec(1.2)).status).toBe('incorrect');
    expect(checkNumeric('2.4', spec(2)).status).toBe('incorrect');
  });
  it('converts % to a decimal when a decimal is expected', () => {
    expect(checkNumeric('25%', spec(0.25)).status).toBe('correct');
    expect(checkNumeric('14.06%', spec(0.140625)).status).toBe('correct');
    expect(checkNumeric('14%', spec(0.140625)).status).toBe('correct-rounded');
  });
  it('flags percent/decimal confusion without grading it', () => {
    expect(checkNumeric('25', spec(0.25)).status).toBe('needs-format');
    expect(checkNumeric('0.64', spec(64, 'percent')).status).toBe('needs-format');
    expect(checkNumeric('64', spec(64, 'percent')).status).toBe('correct');
    expect(checkNumeric('64%', spec(64, 'percent')).status).toBe('correct');
  });
  it('handles negative keys and counts', () => {
    expect(checkNumeric('-4', spec(-4, 'value')).status).toBe('correct');
    expect(checkNumeric('4', spec(-4, 'value')).status).toBe('incorrect');
    expect(checkNumeric('50400', spec(50400, 'count')).status).toBe('correct');
    expect(checkNumeric('50,400', spec(50400, 'count')).status).toBe('correct');
  });
  it('reports invalid input', () => {
    expect(checkNumeric('half', spec(0.5)).status).toBe('invalid');
  });
});
