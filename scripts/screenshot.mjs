// Dev helper: node scripts/screenshot.mjs <url> <out.png> [width] [height]
import { chromium } from '@playwright/test';
const [,, url, out, w='1440', h='900'] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h } });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await p.goto(url);
await p.waitForTimeout(2500);
await p.screenshot({ path: out });
console.log(errs.join('\n') || 'no errors');
await b.close();
