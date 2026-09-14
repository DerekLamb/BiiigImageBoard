#!/usr/bin/env node
/**
 * BiiigImageBoard dev harness browser driver.
 *
 * Drives the running app with Playwright, captures screenshots plus console /
 * page / network errors, and writes a JSON report. The screenshots are intended
 * to be read back by a vision-capable agent (via the `read` tool) so it can see
 * the app's current state.
 *
 * Usage:
 *   node dev/harness/drive.mjs --preset smoke
 *   node dev/harness/drive.mjs --scenario dev/harness/scenarios/my.json
 *   node dev/harness/drive.mjs --url https://localhost:5173/posts --out shot.png
 *   node dev/harness/drive.mjs --preset smoke --fresh        # ignore saved login
 *
 * Scenario JSON:
 * {
 *   "name": "smoke",
 *   "baseUrl": "https://localhost:5173",
 *   "viewport": { "width": 1440, "height": 900 },
 *   "theme": "dark",
 *   "login": { "email": "...", "password": "..." },   // optional; env fallback
 *   "steps": [ ... ]
 * }
 *
 * Supported steps:
 *   { "goto": "/posts", "screenshot": "posts", "fullPage": true }
 *   { "click": "selector" }                  { "fill": ["sel", "value"] }
 *   { "setFiles": ["sel", ["/tmp/a.jpg"]] }  { "press": ["sel", "Enter"] }
 *   { "wait": 800 }                          { "waitFor": "sel" }
 *   { "screenshot": "name", "fullPage": true, "selector": "#grid" }
 *   { "text": true }                         { "snapshot": true }
 *   { "eval": "document.title" }             { "expect": { "selector": "x", "text": "y" } }
 *   { "route": "/posts" }  // alias for goto with default screenshot
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HARNESS_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HARNESS_DIR, '..', '..');
const APP_DIR = path.join(REPO_ROOT, 'app');
// Playwright lives in app/node_modules; resolve it from the app package.
const require = createRequire(path.join(APP_DIR, 'package.json'));
const { chromium } = require('playwright');
const RUN_DIR = path.join(HARNESS_DIR, '.run');
const SHOTS_DIR = path.join(HARNESS_DIR, 'shots');
const DEFAULT_BASE = 'https://localhost:5173';

// ---------------------------------------------------------------------------
// args
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
function argValue(flag) {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
}
function has(flag) {
  return argv.includes(flag);
}

const outFlag = argValue('--out');
const scenarioFlag = argValue('--scenario');
const presetFlag = argValue('--preset');
const urlFlag = argValue('--url');
const fresh = has('--fresh');

// ---------------------------------------------------------------------------
// env + scenarios
// ---------------------------------------------------------------------------
function loadDotEnv() {
  const env = {};
  const file = path.join(APP_DIR, '.env');
  if (!fs.existsSync(file)) return env;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[m[1]] = v;
  }
  return env;
}

const dotenv = loadDotEnv();

const smokeScenario = {
  name: 'smoke',
  baseUrl: process.env.HARNESS_BASE_URL || DEFAULT_BASE,
  viewport: { width: 1440, height: 900 },
  theme: 'dark',
  login: {
    email: dotenv.ADMIN_EMAIL || 'admin@example.com',
    password: dotenv.ADMIN_PASSWORD || 'admin1234',
  },
  steps: [
    { route: '/', screenshot: '01-home' },
    { route: '/posts', screenshot: '02-posts' },
    { route: '/postsByDate', screenshot: '03-postsByDate' },
    { route: '/postGroups', screenshot: '04-postGroups' },
    { route: '/review', screenshot: '05-review' },
    { route: '/tags', screenshot: '06-tags' },
    { route: '/upload', screenshot: '07-upload' },
    { route: '/config', screenshot: '08-config' },
    { route: '/admin/users', screenshot: '09-admin-users' },
    // First post detail, if any posts exist.
    {
      evalSetup: true,
      goto: '/posts',
    },
    {
      conditional: "a[href^='/posts/']",
      steps: [
        { click: "a[href^='/posts/']" },
        { waitFor: 'main', wait: 1200 },
        { screenshot: '10-post-detail' },
      ],
    },
  ],
};

function loadScenario() {
  if (urlFlag) {
    return {
      name: 'single',
      baseUrl: DEFAULT_BASE,
      viewport: { width: 1440, height: 900 },
      login: {
        email: dotenv.ADMIN_EMAIL || 'admin@example.com',
        password: dotenv.ADMIN_PASSWORD || 'admin1234',
      },
      steps: [{ goto: urlFlag, screenshot: outFlag, fullPage: true }],
    };
  }
  if (presetFlag === 'smoke' || (!scenarioFlag && !urlFlag)) return smokeScenario;
  if (scenarioFlag) {
    const p = path.resolve(process.cwd(), scenarioFlag);
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  throw new Error(`Unknown preset: ${presetFlag}`);
}

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------
const scenario = loadScenario();
const baseUrl = scenario.baseUrl || DEFAULT_BASE;
const outDir = scenario.outDir
  ? path.resolve(REPO_ROOT, scenario.outDir)
  : SHOTS_DIR;
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(RUN_DIR, { recursive: true });

const statePath = path.join(RUN_DIR, 'state.json');
const report = {
  name: scenario.name || 'scenario',
  baseUrl,
  startedAt: new Date().toISOString(),
  steps: [],
  screenshots: [],
  consoleErrors: [],
  pageErrors: [],
  requestFailures: [],
  httpErrors: [],
  login: { attempted: false, ok: null },
};

function resolveUrl(u) {
  if (!u) return baseUrl;
  if (/^https?:\/\//i.test(u)) return u;
  return baseUrl.replace(/\/$/, '') + (u.startsWith('/') ? u : '/' + u);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: scenario.viewport || { width: 1440, height: 900 },
  ignoreHTTPSErrors: true,
  storageState: fs.existsSync(statePath) && !fresh ? statePath : undefined,
  colorScheme: scenario.theme === 'light' ? 'light' : 'dark',
});

const page = await context.newPage();

page.on('console', (m) => {
  if (m.type() === 'error') report.consoleErrors.push(m.text());
});
page.on('pageerror', (e) => report.pageErrors.push(e.message));
page.on('requestfailed', (r) => {
  report.requestFailures.push(`${r.method()} ${r.url()} :: ${r.failure()?.errorText}`);
});
page.on('response', (r) => {
  if (r.status() >= 400) report.httpErrors.push(`${r.status()} ${r.request().method()} ${r.url()}`);
});

async function waitReady() {
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
}

async function doLogin() {
  const creds = scenario.login || {};
  if (!creds.email || !creds.password) return;
  report.login.attempted = true;
  await page.goto(resolveUrl('/login'), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitReady();
  // Already authenticated? /login redirects away.
  if (!/\/login/.test(page.url())) {
    report.login.ok = true;
    return;
  }
  await page.fill('input[type=email]', creds.email);
  await page.fill('input[type=password]', creds.password);
  await page.click('button[type=submit], form button');
  await page.waitForURL((u) => !/\/login/.test(u.pathname), { timeout: 15000 }).catch(() => {});
  await waitReady();
  report.login.ok = !/\/login/.test(new URL(page.url()).pathname);
  await context.storageState({ path: statePath });
}

async function takeScreenshot(name, opts = {}) {
  const safe = String(name || `step-${report.steps.length}`).replace(/[^\w.-]+/g, '_');
  const file = path.join(outDir, safe.endsWith('.png') ? safe : `${safe}.png`);
  const shotOpts = { path: file, fullPage: !!opts.fullPage };
  if (opts.selector) {
    await page.locator(opts.selector).first().screenshot(shotOpts);
  } else {
    await page.screenshot(shotOpts);
  }
  report.screenshots.push(file);
  return file;
}

async function runStep(step, index) {
  const label = step.screenshot || step.route || step.goto || `step-${index}`;
  const entry = { index, label, ok: true };
  try {
    if (step.goto || step.route) {
      const target = step.goto || step.route;
      await page.goto(resolveUrl(target), { waitUntil: 'domcontentloaded', timeout: 30000 });
      await waitReady();
      entry.url = page.url();
      if (step.route && !step.screenshot) {
        await takeScreenshot(`route-${target.replace(/\W+/g, '_')}`, { fullPage: true });
      }
    }
    if (step.click) {
      await page.locator(step.click).first().click({ timeout: 15000 });
      await waitReady();
    }
    if (step.fill) {
      const [sel, val] = Array.isArray(step.fill) ? step.fill : [step.fill.selector, step.fill.value];
      await page.locator(sel).first().fill(String(val));
    }
    if (step.setFiles) {
      const [sel, files] = step.setFiles;
      await page.locator(sel).first().setInputFiles(files);
    }
    if (step.press) {
      const [sel, key] = step.press;
      await page.locator(sel).first().press(key);
    }
    if (step.wait) await page.waitForTimeout(step.wait);
    if (step.waitFor) {
      await page.locator(step.waitFor).first().waitFor({ timeout: step.timeout || 15000 });
    }
    if (step.screenshot) {
      entry.screenshot = await takeScreenshot(step.screenshot, step);
    }
    if (step.text) {
      entry.text = (await page.locator('body').innerText().catch(() => '')).slice(0, 4000);
    }
    if (step.snapshot) {
      const snap = await page.locator('body').ariaSnapshot().catch(() => null);
      entry.snapshot = snap ? snap.slice(0, 12000) : null;
    }
    if (step.eval) {
      entry.eval = await page.evaluate(step.eval);
    }
    if (step.expect) {
      const sel = step.expect.selector;
      const loc = page.locator(sel).first();
      await loc.waitFor({ timeout: 10000 });
      if (step.expect.text) {
        const body = await loc.innerText();
        if (!body.includes(step.expect.text)) {
          throw new Error(`Expected "${step.expect.text}" in ${sel}, got "${body.slice(0, 200)}"`);
        }
      }
      entry.expect = 'ok';
    }
  } catch (err) {
    entry.ok = false;
    entry.error = err?.message || String(err);
  }
  report.steps.push(entry);
  return entry;
}

await doLogin();

for (let i = 0; i < (scenario.steps || []).length; i++) {
  const step = scenario.steps[i];
  if (step.conditional) {
    const present = await page.locator(step.conditional).count().catch(() => 0);
    if (!present) continue;
    for (const sub of step.steps || []) await runStep(sub, i);
    continue;
  }
  await runStep(step, i);
}

report.finishedAt = new Date().toISOString();
report.ok =
  report.steps.every((s) => s.ok) &&
  report.pageErrors.length === 0 &&
  report.requestFailures.length === 0;

const reportPath = path.join(RUN_DIR, 'last-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

await browser.close();

// Human/agent summary
console.log(`Harness: ${report.name} — ${report.ok ? 'OK' : 'ISSUES'}`);
console.log(`Login: ${report.login.attempted ? (report.login.ok ? 'ok' : 'FAILED') : 'skipped'}`);
console.log(`Steps: ${report.steps.filter((s) => s.ok).length}/${report.steps.length} ok`);
for (const s of report.steps.filter((s) => !s.ok)) {
  console.log(`  FAIL ${s.label}: ${s.error}`);
}
console.log(`Screenshots (${report.screenshots.length}):`);
for (const s of report.screenshots) console.log(`  ${s}`);
if (report.consoleErrors.length) {
  console.log(`Console errors (${report.consoleErrors.length}):`);
  for (const e of report.consoleErrors.slice(0, 10)) console.log(`  ${e}`);
}
if (report.pageErrors.length) {
  console.log(`Page errors (${report.pageErrors.length}):`);
  for (const e of report.pageErrors.slice(0, 10)) console.log(`  ${e}`);
}
if (report.requestFailures.length) {
  console.log(`Request failures (${report.requestFailures.length}):`);
  for (const e of report.requestFailures.slice(0, 10)) console.log(`  ${e}`);
}
if (report.httpErrors.length) {
  console.log(`HTTP >=400 (${report.httpErrors.length}):`);
  for (const e of report.httpErrors.slice(0, 10)) console.log(`  ${e}`);
}
console.log(`Report: ${reportPath}`);

process.exit(report.ok ? 0 : 1);
