#!/usr/bin/env node
// Usage: node scripts/shot.mjs <url> [output.png] [--selector "<css>"] [--full] [--wait <ms>]
// Takes a screenshot of a page for visual debugging.
import { chromium } from 'playwright';
import path from 'node:path';

const args = process.argv.slice(2);
if (!args.length || args.includes('--help')) {
  console.log('Usage: node scripts/shot.mjs <url> [output.png] [--selector <css>] [--full] [--wait <ms>]');
  process.exit(args.length ? 0 : 1);
}

const url = args[0];
let out = args[1] && !args[1].startsWith('--') ? args[1] : 'shot.png';
let selector = null, full = false, wait = 0;
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--selector') selector = args[++i];
  else if (a === '--full') full = true;
  else if (a === '--wait') wait = parseInt(args[++i], 10);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, ignoreHTTPSErrors: true });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) =>
  errors.push(`goto: ${e.message}`),
);
if (selector) await page.waitForSelector(selector, { timeout: 15000 }).catch(() => {});
if (wait) await page.waitForTimeout(wait);

await page.screenshot({ path: out, fullPage: full });
console.log(`Saved: ${path.resolve(out)}`);
if (errors.length) {
  console.log('--- browser errors ---');
  errors.slice(0, 20).forEach((e) => console.log(e));
}
await browser.close();
