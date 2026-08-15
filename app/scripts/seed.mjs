// One-off: sign up admin, upload test images, screenshot browsing routes.
import { chromium } from 'playwright';

const base = 'https://localhost:5173';
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  ignoreHTTPSErrors: true,
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

// 1. Log in as admin (auto-created from .env)
await page.goto(base + '/login', { waitUntil: 'networkidle' });
await page.fill('input[type=email]', 'admin@example.com');
await page.fill('input[type=password]', 'admin1234');
await page.click('button[type=submit], form button');
await page.waitForTimeout(2500);
console.log('after login URL:', page.url());

// 2. Upload page with files
await page.goto(base + '/upload', { waitUntil: 'networkidle' });
await page.setInputFiles('input[type=file]', ['/tmp/testimg1.jpg', '/tmp/testimg2.jpg', '/tmp/testimg3.jpg']);
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/shot-upload-queue.png', fullPage: true });
console.log('saved upload queue shot');

// 3. Click Upload All, wait for results
await page.click('text=Upload All');
await page.waitForTimeout(6000);
await page.screenshot({ path: '/tmp/shot-upload-after.png', fullPage: true });
console.log('saved upload after shot');

// 4. /posts grid
await page.goto(base + '/posts', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/shot-posts-grid.png', fullPage: true });
console.log('saved posts grid shot:', page.url());

// 5. First post detail
const firstLink = await page.$('a[href^="/posts/"]');
if (firstLink) {
  await firstLink.click();
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2500);
  console.log('detail URL:', page.url());
  await page.screenshot({ path: '/tmp/shot-post-detail.png', fullPage: true });
} else {
  console.log('no post links found on /posts');
}

// 6. Dark theme detail (moon toggle in nav)
const toggle = await page.$('nav button, .nav button, [class*=theme] button');
if (toggle) {
  await toggle.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/shot-post-detail-dark.png', fullPage: true });
  console.log('saved dark shot');
}

if (errors.length) {
  console.log('--- browser errors ---');
  errors.slice(0, 20).forEach((e) => console.log(e));
}
await browser.close();
