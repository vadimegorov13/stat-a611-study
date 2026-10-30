import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { E2E_DATA } from '../../playwright.config.ts';

test.describe.configure({ mode: 'serial' });

const notesDir = path.join(E2E_DATA, 'notes');
const progressFile = () => JSON.parse(fs.readFileSync(path.join(E2E_DATA, 'progress.json'), 'utf8'));
const noteFiles = () => fs.readdirSync(notesDir).filter((f) => f.endsWith('.md'));
const main = (page: Page) => page.locator('.main-scroll');
const pane = (page: Page) => page.locator('.refpane-body');

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => {
    throw e;
  });
});

test('lessons render their mathematics without KaTeX errors', async ({ page }) => {
  await page.goto('/#/lesson/12-continuous');
  await expect(page.getByRole('heading', { level: 1, name: 'Continuous densities, CDFs, and expected values' })).toBeVisible();
  expect(await main(page).locator('.katex').count()).toBeGreaterThan(15);
  const course = await (await page.request.get('/api/course')).json();
  for (const l of course.lessons) {
    await page.goto(`/#/lesson/${l.id}`);
    await expect(page.getByRole('heading', { level: 1, name: l.title })).toBeVisible();
    await expect(main(page).locator('.katex').first()).toBeVisible();
    expect(await main(page).locator('.katex-error').count(), l.id).toBe(0);
  }
});

test('search finds lessons via synonyms and symbols, with keyboard navigation', async ({ page }) => {
  await page.goto('/#/');
  await page.keyboard.press('ControlOrMeta+k');
  const input = page.getByRole('textbox', { name: 'Search' });
  await expect(input).toBeFocused();
  await input.fill('sd');
  await expect(page.locator('.palette-results')).toContainText('Mean, median, variance, and standard deviation');
  await input.fill('σ');
  await expect(page.locator('.palette-results li[role=option]').first()).toBeVisible();
  await input.fill('mgf');
  await expect(page.locator('.palette-results')).toContainText('Moment-generating functions');
  await input.fill('hypergeometric');
  await expect(page.locator('.palette-results .rtype-source').first()).toBeVisible(); // extracted lecture text, with page reference
  await expect(page.locator('.palette-results')).toContainText('PDF p.');
  await input.fill('chebyshev');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect(page.locator('.palette')).toBeHidden();
  await expect(pane(page)).toContainText(/Chebyshev/i);
  await expect(page.getByRole('heading', { level: 1, name: 'Your course path' })).toBeVisible(); // main view unchanged
});

test('an internal link opens beside the lesson without losing scroll position or draft work', async ({ page }) => {
  await page.goto('/#/lesson/03-boxplots');
  await expect(page.getByRole('heading', { level: 1, name: /Z-scores, quartiles/ })).toBeVisible();
  const link = main(page).getByRole('link', { name: 'Chebyshev and the empirical rule' });
  await link.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const before = await main(page).evaluate((el) => el.scrollTop);
  expect(before).toBeGreaterThan(100);
  await link.click();
  await expect(pane(page).getByRole('heading', { level: 1 })).toHaveText('Normal probabilities, percentiles, and spread rules');
  await expect(page.getByRole('heading', { level: 1, name: /Z-scores, quartiles/ })).toBeVisible();
  expect(Math.abs((await main(page).evaluate((el) => el.scrollTop)) - before)).toBeLessThan(5);
  // Leaving and returning to the lesson restores the saved position.
  await page.goto('/#/lesson/01-data');
  await page.goto('/#/lesson/03-boxplots');
  await expect.poll(() => main(page).evaluate((el) => el.scrollTop)).toBeGreaterThan(before - 5);

  // Unsubmitted answer survives opening references and navigating away and back.
  await page.goto('/#/question/q08-02');
  await main(page).getByLabel('Your answer').fill('0.14');
  await main(page).locator('.qtopic .lesson-chip').click();
  await expect(pane(page).getByRole('heading', { level: 1 })).toHaveText('Discrete uniform and geometric distributions');
  await expect(main(page).getByLabel('Your answer')).toHaveValue('0.14');
  await page.goto('/#/lesson/01-data');
  await page.goto('/#/question/q08-02');
  await expect(main(page).getByLabel('Your answer')).toHaveValue('0.14');
  await main(page).getByLabel('Your answer').fill('');
});

test('a cited PDF page opens in the side pane at the right page', async ({ page }) => {
  await page.goto('/#/lesson/12-continuous');
  await main(page).locator('.sources-line').getByRole('link', { name: /Sep 28 lecture PDF at page 4/ }).click();
  const viewer = pane(page).locator('.pdf-viewer');
  await expect(viewer.getByLabel('Page number')).toHaveValue('4');
  await expect(viewer).toContainText('/ 11');
  await expect(viewer.locator('.pdf-loading')).toBeHidden({ timeout: 15_000 });
  expect(await viewer.locator('canvas').evaluate((c: HTMLCanvasElement) => c.width)).toBeGreaterThan(300);
  await viewer.getByRole('button', { name: 'Next page' }).click();
  await expect(viewer.getByLabel('Page number')).toHaveValue('5');
  // Navigate within the pane, then go back.
  await viewer.locator('.pdf-citing .lesson-chip').first().click();
  await expect(pane(page).getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Back in this tab' }).click();
  await expect(pane(page).getByLabel('Page number')).toHaveValue('5');
});

test('numeric, multiple-choice, and free-response exercises record honest outcomes', async ({ page }) => {
  await page.goto('/#/question/q08-02');
  await main(page).getByLabel('Your answer').fill('9/64');
  await main(page).getByRole('button', { name: 'Check answer' }).click();
  await expect(main(page).locator('.feedback')).toContainText('Correct.');
  await expect(main(page).locator('.feedback')).toContainText('Correct, no help · first attempt');
  await expect(main(page).locator('.solution')).toBeVisible();

  await page.goto('/#/question/q14-01');
  await expect(main(page).locator('.solution')).toHaveCount(0); // hidden before answering
  await main(page).locator('label.option', { hasText: /^C/ }).click();
  await main(page).getByRole('button', { name: 'Check answer' }).click();
  await expect(main(page).locator('.feedback')).toContainText('Correct.');

  await page.goto('/#/question/q11-03');
  await main(page).getByLabel('Your answer').fill('0.5');
  await main(page).getByRole('button', { name: 'Check answer' }).click();
  await expect(main(page).locator('.feedback')).toContainText('Not correct.');

  await page.goto('/#/question/q09-02');
  await main(page).getByRole('button', { name: /Show a hint/ }).click();
  await expect(main(page).locator('.hints')).toContainText('Hint 1');
  await main(page).getByLabel('Your answer').fill('0.375');
  await main(page).getByRole('button', { name: 'Check answer' }).click();
  await expect(main(page).locator('.feedback')).toContainText('Correct with hints');

  await page.goto('/#/question/q18-03');
  await main(page).getByLabel(/Your answer/).fill('0.64');
  await main(page).getByRole('button', { name: 'Check answer' }).click();
  await expect(main(page).locator('.format-msg')).toContainText('asks for a percent');
  await main(page).getByLabel(/Your answer/).fill('64');
  await main(page).getByRole('button', { name: 'Check answer' }).click();
  await expect(main(page).locator('.feedback')).toContainText('Correct.');

  await page.goto('/#/question/q03-03');
  await main(page).getByLabel('Your answer and reasoning').fill('IQR 8, inner fence 30, outer 42; equality counts so 30 is a mild outlier.');
  await main(page).getByRole('button', { name: 'Check answer' }).click();
  await expect(main(page).locator('.rubric input[type=checkbox]')).toHaveCount(3);
  for (const box of await main(page).locator('.rubric input[type=checkbox]').all()) await box.check();
  await main(page).getByRole('button', { name: /Save self-assessment \(3\/3\)/ }).click();
  await expect(main(page).locator('.rubric')).toContainText('recorded as correct');

  // Saved to disk and restored after reload.
  const p = progressFile();
  const byQ = (id: string) => p.attempts.filter((a: any) => a.questionId === id);
  expect(byQ('q08-02')[0]).toMatchObject({ correct: true, hintsUsed: 0, firstAttempt: true, revealedBeforeSubmit: false });
  expect(byQ('q11-03')[0]).toMatchObject({ correct: false });
  expect(byQ('q09-02')[0]).toMatchObject({ correct: true, hintsUsed: 1 });
  expect(byQ('q18-03')).toHaveLength(1); // the mis-formatted 0.64 was not graded
  expect(byQ('q03-03')[0]).toMatchObject({ correct: true, rubricMet: 3, rubricTotal: 3 });
  await page.reload();
  await page.goto('/#/question/q08-02');
  await expect(main(page).locator('.qhistory')).toContainText('1 earlier attempt · latest: Correct, no help');
  await expect(page.locator('.nav-main')).toContainText('Review queue 2'); // q11-03 incorrect + q09-02 solved only with a hint
});

test('flagging, the review queue, and progress views reflect attempts', async ({ page }) => {
  await page.goto('/#/question/q12-01');
  await main(page).getByRole('button', { name: '⚐ Flag' }).click();
  await main(page).getByLabel('Flag reason').fill('density vs probability');
  await main(page).getByRole('button', { name: 'Flag', exact: true }).click();
  await expect(main(page).getByRole('button', { name: '⚑ Flagged' })).toBeVisible();
  await page.goto('/#/practice/review');
  await expect(main(page).locator('.review-list')).toContainText('q11-03');
  await expect(main(page).locator('.review-list')).toContainText('Flagged: density vs probability');
  await page.goto('/#/');
  await expect(main(page).locator('.recs')).toContainText('incorrect latest attempt');
  await page.goto('/#/progress');
  await expect(main(page).locator('.progress-table')).toContainText('Poisson counts and time intervals');
  expect(progressFile().flags['q12-01'].reason).toBe('density vs probability');
});

test('exam practice hides feedback until the end and supports timing', async ({ page }) => {
  await page.goto('/#/practice/exam');
  await main(page).getByRole('button', { name: 'None' }).click();
  await main(page).locator('.topic-checks label', { hasText: 'Poisson counts' }).locator('input').check();
  await main(page).getByLabel('Number of questions').fill('2');
  await main(page).getByLabel('Timed').check();
  await main(page).getByRole('button', { name: 'Start exam practice' }).click();
  await expect(main(page).locator('.countdown')).toContainText('left');
  await expect(main(page).getByRole('button', { name: 'Reveal solution' })).toHaveCount(0);
  await main(page).getByRole('button', { name: 'Record answer' }).click(); // empty MC / numeric shows a format message instead
  await expect(main(page).locator('.format-msg')).toBeVisible();
  await main(page).getByRole('button', { name: 'Finish exam' }).click();
  await expect(main(page).getByRole('heading', { name: 'Exam practice results' })).toBeVisible();
  await expect(main(page).locator('.stat-row')).toContainText('0/2 answered');
});

test('notes: create, autosave to Markdown, preview math, follow links, and search', async ({ page }) => {
  await page.goto('/#/notes');
  await main(page).getByLabel('New note title').fill('Variance qs');
  await main(page).getByRole('button', { name: '+ New' }).click();
  await main(page).getByLabel('Note title', { exact: true }).fill('Variance questions'); // renaming keeps the id and file name
  await main(page).getByLabel('Note text (Markdown)').fill('Why divide by $n-1$? See [the estimation lesson](study://lesson/19-estimation).\n');
  await expect(main(page).locator('.save-ind')).toContainText('Saved', { timeout: 10_000 });
  const files = noteFiles();
  expect(files).toHaveLength(1);
  const text = fs.readFileSync(path.join(notesDir, files[0]), 'utf8');
  expect(text).toMatch(/^---\nid: n-\d{8}-variance-qs-[0-9a-f]{4}\ntitle: Variance questions\n/);
  expect(text).toContain('Why divide by $n-1$?');
  await expect(main(page).locator('.note-preview .katex')).toBeVisible();
  await main(page).locator('.note-preview').getByRole('link', { name: 'the estimation lesson' }).click();
  await expect(pane(page).getByRole('heading', { level: 1 })).toHaveText('Point estimation, bias, and standard error');
  await page.keyboard.press('ControlOrMeta+k');
  await page.getByRole('textbox', { name: 'Search' }).fill('variance questions');
  await expect(page.locator('.palette-results li[role=option]').first()).toContainText('My note');
  await page.keyboard.press('Escape');
});

test('an external edit appears live, with a before/after diff', async ({ page }) => {
  await page.goto('/#/notes');
  await main(page).locator('.notes-list li a').first().click();
  const ta = main(page).getByLabel('Note text (Markdown)');
  await expect(ta).toHaveValue(/Why divide by/);
  const file = path.join(notesDir, noteFiles()[0]);
  const before = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, before.replace(/\n\n[\s\S]*$/, '\n\nEdited by an assistant: dividing by n−1 removes the bias.\n'));
  await expect(ta).toHaveValue(/Edited by an assistant/, { timeout: 10_000 });
  await expect(main(page).locator('.banner.info')).toContainText('the file was changed outside this app');
  await main(page).getByRole('button', { name: 'View changes' }).click();
  await expect(main(page).locator('.diff pre .add')).toContainText('Edited by an assistant');
  await expect(main(page).locator('.diff pre .del')).toContainText('Why divide by');
});

test('simultaneous edits raise a conflict instead of overwriting, and nothing is lost', async ({ page }) => {
  await page.goto('/#/notes');
  await main(page).locator('.notes-list li a').first().click();
  const ta = main(page).getByLabel('Note text (Markdown)');
  await expect(ta).toHaveValue(/Edited by an assistant/);
  const file = path.join(notesDir, noteFiles()[0]);
  const disk = fs.readFileSync(file, 'utf8');
  await ta.press('End');
  await ta.pressSequentially(' My local draft.');
  fs.writeFileSync(file, disk.replace('Edited by an assistant', 'External v2'));
  await expect(main(page).locator('.banner.conflict')).toContainText('changed on disk while you had unsaved edits', { timeout: 10_000 });
  await page.waitForTimeout(1500);
  expect(fs.readFileSync(file, 'utf8')).toContain('External v2'); // not overwritten by the stale autosave
  expect(fs.readFileSync(file, 'utf8')).not.toContain('My local draft');
  await main(page).getByRole('button', { name: 'Keep my draft' }).click();
  await expect(main(page).locator('.save-ind')).toContainText('Saved', { timeout: 10_000 });
  expect(fs.readFileSync(file, 'utf8')).toContain('My local draft');
  const id = path.basename(file, '.md');
  const revDir = path.join(E2E_DATA, 'note-revisions', id);
  const revs = fs.readdirSync(revDir).map((f) => fs.readFileSync(path.join(revDir, f), 'utf8'));
  expect(revs.some((r) => r.includes('External v2'))).toBe(true); // the external version is recoverable
});

test('note history shows revisions and restores an earlier version', async ({ page }) => {
  await page.goto('/#/notes');
  await main(page).locator('.notes-list li a').first().click();
  await main(page).getByRole('button', { name: 'History' }).click();
  const list = main(page).locator('.rev-list');
  await expect(list).toContainText('External change detected');
  await list.locator('li button', { hasText: 'External change detected' }).first().click();
  await expect(main(page).locator('.rev-detail .diff')).toBeVisible();
  await main(page).getByRole('button', { name: 'Restore this version' }).click();
  await expect(main(page).getByLabel('Note text (Markdown)')).toHaveValue(/External v2/);
  await expect(main(page).getByLabel('Note text (Markdown)')).not.toHaveValue(/My local draft/);
  const file = path.join(notesDir, noteFiles()[0]);
  expect(fs.readFileSync(file, 'utf8')).toContain('External v2');
  expect(fs.readFileSync(file, 'utf8')).not.toContain('My local draft');
});

test('panes resize by dragging, collapse, and the layout is restored after reload', async ({ page }) => {
  await page.goto('/#/lesson/01-data');
  const right = page.locator('.panel-right');
  const w0 = (await right.boundingBox())!.width;
  const handle = page.locator('.resize-handle').nth(1);
  const hb = (await handle.boundingBox())!;
  await page.mouse.move(hb.x + hb.width / 2, hb.y + 300);
  await page.mouse.down();
  await page.mouse.move(hb.x - 160, hb.y + 300, { steps: 8 });
  await page.mouse.up();
  const w1 = (await right.boundingBox())!.width;
  expect(w1 - w0).toBeGreaterThan(120);
  const tabs = await page.locator('.refpane .tab').count();
  await page.waitForTimeout(600); // the panel library debounces saving the layout
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: /Populations, samples/ })).toBeVisible();
  expect(Math.abs((await right.boundingBox())!.width - w1)).toBeLessThan(4);
  expect(await page.locator('.refpane .tab').count()).toBe(tabs);

  await page.keyboard.press('ControlOrMeta+b');
  await expect.poll(async () => (await page.locator('.panel-left').boundingBox())?.width ?? 0).toBeLessThan(2);
  await page.reload();
  await expect.poll(async () => (await page.locator('.panel-left').boundingBox())?.width ?? 0).toBeLessThan(2);
  await page.getByLabel('Show navigation').click();
  await expect.poll(async () => (await page.locator('.panel-left').boundingBox())?.width ?? 0).toBeGreaterThan(150);

  // Study mode hides both sidebars; Esc brings them back.
  await page.keyboard.press('ControlOrMeta+Shift+F');
  await expect(page.locator('.topbar')).toBeHidden();
  await expect.poll(async () => (await page.locator('.panel-right').boundingBox())?.width ?? 0).toBeLessThan(2);
  await page.keyboard.press('Escape');
  await expect(page.locator('.topbar')).toBeVisible();
  await expect.poll(async () => (await page.locator('.panel-right').boundingBox())?.width ?? 0).toBeGreaterThan(150);

  // Reset layout restores the defaults.
  await page.locator('.menu-wrap summary').click();
  await page.getByRole('button', { name: 'Reset layout' }).click();
  await expect.poll(async () => Math.round((await right.boundingBox())!.width)).toBeLessThan(Math.round(w1) - 100);
});

test('reference tabs can be opened, switched, and closed', async ({ page }) => {
  await page.goto('/#/lesson/09-binomial');
  await main(page).locator('.prereqs .lesson-chip').first().click();
  await main(page).locator('.sources-line .page-chip').first().click();
  const tabs = page.locator('.refpane .tab');
  const n = await tabs.count();
  expect(n).toBeGreaterThanOrEqual(2);
  await tabs.nth(n - 2).getByRole('tab').click();
  await expect(tabs.nth(n - 2)).toHaveClass(/on/);
  await tabs.nth(n - 1).getByRole('button', { name: /Close tab/ }).click();
  await expect(tabs).toHaveCount(n - 1);
});

test('small screens use drawers', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto('/#/lesson/04-events');
  await expect(page.getByRole('heading', { level: 1, name: 'Sample spaces, events, and set operations' })).toBeVisible();
  await expect(page.locator('.drawer')).toHaveCount(0);
  await page.getByLabel(/navigation/).click();
  await page.locator('.drawer.left').getByRole('link', { name: /Counting: products/ }).click();
  await expect(page.locator('.drawer.left')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: /Counting: products/ })).toBeVisible();
  await page.locator('.sources-line .page-chip').first().click();
  await expect(page.locator('.drawer.right .pdf-viewer')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await ctx.close();
});

test('the quick-reference dock searches formulas and notation, and stars persist on disk', async ({ page }) => {
  await page.goto('/#/lesson/03-boxplots');
  const fab = page.getByRole('button', { name: /Formulas & notes/ });
  await expect(fab).toBeVisible();
  await page.keyboard.press('ControlOrMeta+j');
  const dock = page.getByRole('dialog', { name: /Quick reference/ });
  await expect(dock).toBeVisible();
  const search = dock.getByRole('searchbox', { name: 'Search the quick reference' });
  await expect(search).toBeFocused();
  await search.fill('IQR');
  await expect(dock.locator('.qr-item').first()).toContainText('IQR'); // the term titled “IQR” ranks first
  await expect(dock.locator('.qr-item', { hasText: 'Interquartile range' }).first()).toBeVisible();
  // Notation entries cite the lecture page where the symbol appears.
  await dock.getByRole('tab', { name: 'Notation' }).click();
  await search.fill('whisker');
  const whiskers = dock.locator('.qr-item', { hasText: 'Whisker endpoints' });
  await expect(whiskers).toContainText('Aug 31');
  await whiskers.getByRole('button', { name: /Save “Whisker endpoints”/ }).click();
  await expect.poll(() => Object.keys(progressFile().saved ?? {})).toContain('n:whiskers');
  // Starring from the lesson's key formulas uses the same list.
  await main(page).getByRole('button', { name: 'Save “Interquartile range”' }).click();
  await page.reload();
  await expect(page.locator('.qdock')).toBeVisible(); // the dock stays open across reloads
  await page.getByRole('tab', { name: /Saved/ }).click();
  await expect(page.locator('.qdock .qr-item')).toHaveCount(2);
  await expect(page.locator('.qdock')).toContainText('Whisker endpoints');
  await page.keyboard.press('Escape');
  await expect(page.locator('.qdock')).toHaveCount(0);
  await expect(fab).toBeFocused();
});

test('the dock lists notes and opens one; Tips open from the top bar', async ({ page }) => {
  await page.goto('/#/');
  await page.getByRole('button', { name: 'Study tips' }).click();
  const dock = page.getByRole('dialog', { name: /Quick reference/ });
  await expect(dock.getByRole('tab', { name: /Tips/ })).toHaveAttribute('aria-selected', 'true');
  await expect(dock.locator('.tip').first()).toBeVisible();
  await dock.getByRole('button', { name: 'Course conventions that cost points' }).click();
  await expect(dock.locator('.tip')).toContainText(['Quartiles: for odd n the median goes in both halves']);
  await dock.getByRole('tab', { name: 'My notes' }).click();
  const first = dock.locator('.qr-note').first();
  await expect(first).toBeVisible();
  await first.locator('a').click();
  await expect(pane(page).locator('.note-editor, textarea').first()).toBeVisible();
});

test('the exam countdown shows the syllabus date', async ({ page }) => {
  await page.goto('/#/');
  const cd = page.locator('.exam-countdown');
  await expect(cd).toContainText('Final exam');
  await expect(cd).toContainText(/Dec 9/);
  await expect(cd).toContainText(/days|until the exam|Done|Now/);
});

test('box plot builder reproduces the Site II lecture example, and the histogram uses left-closed classes', async ({ page }) => {
  await page.goto('/#/viz/describe/boxplot');
  await page.getByLabel('Data', { exact: true }).selectOption('site-ii');
  const steps = main(page).locator('.box-steps');
  await expect(steps).toContainText('Q₁ = 13');
  await expect(steps).toContainText('Q₃ = 21');
  await expect(steps).toContainText('Low: 1 (mild)');
  await expect(steps).toContainText('P₁ = 9, P₂ = 25');
  await expect(steps).toContainText('{1, 13, 17.5, 21, 25}');
  await expect(main(page).locator('.chart .outlier.mild')).toHaveCount(1);
  // Odd n: Site I puts the median in both halves.
  await page.getByLabel('Data', { exact: true }).selectOption('site-i');
  await expect(steps).toContainText('median goes in both halves');
  await expect(steps).toContainText('Q₁ = 13.5');
  // Histogram of the Aug 24 values with the lecture's classes.
  await main(page).getByRole('tab', { name: 'Histogram & ogive' }).click();
  await expect(page).toHaveURL(/#\/viz\/describe\/histogram/);
  await page.getByLabel('Data', { exact: true }).selectOption('aug24-stem');
  await page.getByLabel('First class starts at').fill('0.02');
  await page.getByLabel('Class width').fill('0.01');
  const rows = main(page).locator('.num-table tbody tr');
  await expect(rows.nth(0)).toContainText('[0.02, 0.03)');
  await expect(rows.nth(1)).toContainText('6');
  // Generated data is labelled as such and re-draws on demand.
  await page.getByLabel('Data', { exact: true }).selectOption('generated');
  await expect(main(page)).toContainText('Generated data');
  await main(page).getByRole('button', { name: /New sample/ }).click();
  await expect(main(page)).toContainText('seed');
});

test('distribution explorer computes probabilities with the course parameterisations', async ({ page }) => {
  await page.goto('/#/viz/distributions/normal');
  await page.getByLabel('μ (mean) value').fill('5');
  await page.getByLabel('σ² (variance — not σ) value').fill('4');
  await page.getByLabel('Probability of').selectOption('le');
  await page.getByLabel('a', { exact: true }).fill('6');
  await expect(main(page).locator('.prob-result')).toContainText('0.691462');
  await page.getByLabel('Distribution').selectOption('binomial');
  await expect(page).toHaveURL(/distributions\/binomial/);
  await expect(main(page).locator('.chart .vm.bar').first()).toBeVisible();
  await expect(main(page).locator('.katex-error')).toHaveCount(0);
});

test('scatterplot, sampling and categorical tools render without errors', async ({ page }) => {
  await page.goto('/#/viz/scatter');
  await expect(main(page).locator('.chart circle').first()).toBeVisible();
  await expect(main(page)).toContainText('Line of best fit');
  await page.goto('/#/viz/sampling');
  await expect(main(page)).toContainText('theory σ/√n = 3');
  await page.goto('/#/viz/categorical');
  await expect(main(page).locator('.cat-table')).toContainText('117°');
  await expect(main(page).locator('.chart path.slice')).toHaveCount(3);
});
