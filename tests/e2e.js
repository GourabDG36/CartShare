// CartShare end-to-end tests, run in a real (headless) Chromium browser.
//
// Two pages in ONE browser context behave like two tabs of the same
// browser: shared localStorage, separate sessionStorage. That is exactly
// how collaboration is demonstrated, so the tests use the same setup.
//
// Run:  npm test          (from this tests/ folder)
// Output: console, plus test-results/report.txt and a receipt PDF.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { startServer } = require('./serve');

const OUT = path.join(__dirname, 'test-results');
fs.mkdirSync(OUT, { recursive: true });

const log = [];
function say(line) { console.log(line); log.push(line); }

let passed = 0, failed = 0;
function check(name, cond, detail = '') {
  if (cond) { passed++; say(`  PASS  ${name}`); }
  else { failed++; say(`  FAIL  ${name} ${detail}`); }
}

let server;
(async () => {
  const started = await startServer();
  server = started.server;
  const BASE = started.base;
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  const watch = (page, label) => {
    page.on('pageerror', (e) => errors.push(`${label} pageerror: ${e.message}`));
    page.on('console', (m) => {
      // Google Fonts is blocked in this sandbox only; not an app error.
      if (m.type() === 'error' && !/ERR_TUNNEL|fonts\.g/.test(m.text())) errors.push(`${label} console: ${m.text()}`);
    });
    page.on('response', (r) => { if (r.status() >= 400 && !/fonts\.g/.test(r.url())) errors.push(`${label} HTTP ${r.status()} ${r.url()}`); });
  };

  const A = await context.newPage(); watch(A, 'A');
  await A.goto(BASE);

  say('\n[1] Initial load');
  check('landing visible', await A.isVisible('#view-landing'));
  check('dashboard hidden', !(await A.isVisible('#view-dashboard')));
  check('share modal hidden', !(await A.isVisible('#share-modal')));
  check('confirm modal hidden', !(await A.isVisible('#confirm-modal')));
  check('join form hidden', !(await A.isVisible('#form-join')));
  check('favicon linked', (await A.getAttribute('link[rel=icon]', 'href')) === 'assets/favicon.svg');

  say('\n[2] Landing validation');
  await A.click('#form-create button[type=submit]');
  check('empty name rejected', (await A.textContent('#create-name-error')).includes('enter your name'));
  await A.click('#tab-join');
  await A.fill('#join-name', 'Zed'); await A.fill('#join-code', 'AB');
  await A.click('#form-join button[type=submit]');
  check('short code rejected', (await A.textContent('#join-code-error')).includes('6 letters'));
  await A.fill('#join-code', 'ZZZZZZ');
  await A.click('#form-join button[type=submit]');
  check('unknown room rejected', (await A.textContent('#join-code-error')).includes('No room found'));
  await A.click('#tab-create');
  check('switching tab clears join errors', (await A.textContent('#join-code-error')) === '');

  say('\n[3] Create room (tab A = Alice)');
  await A.fill('#create-name', 'Alice');
  await A.click('#form-create button[type=submit]');
  await A.waitForSelector('#view-dashboard:not([hidden])');
  const code = (await A.textContent('#room-code-display')).trim();
  check('room code is 6 chars', /^[A-HJ-NP-Z2-9]{6}$/.test(code), code);
  check('landing hidden after create', !(await A.isVisible('#view-landing')));
  check('cart empty state shown', await A.isVisible('#cart-empty'));

  say('\n[4] Share modal');
  await A.click('#share-room-btn');
  const link = await A.inputValue('#share-link-input');
  check('share modal opens', await A.isVisible('#share-modal'));
  check('link contains room code', link.endsWith(`?room=${code}`), link);
  await A.click('#share-modal-close');
  check('X closes share modal', !(await A.isVisible('#share-modal')));
  await A.click('#share-room-btn'); await A.keyboard.press('Escape');
  check('Escape closes share modal', !(await A.isVisible('#share-modal')));
  await A.click('#share-room-btn'); await A.mouse.click(10, 10);
  check('click outside closes share modal', !(await A.isVisible('#share-modal')));

  say('\n[5] Join via invite link (tab B = Bob)');
  const B = await context.newPage(); watch(B, 'B');
  await B.goto(link);
  check('B lands on join tab', await B.isVisible('#form-join'));
  check('B code pre-filled', (await B.inputValue('#join-code')) === code);
  check('B invite banner says invited', (await B.textContent('#invite-banner')).includes('invited'));
  await B.fill('#join-name', 'Bob');
  await B.click('#form-join button[type=submit]');
  await B.waitForSelector('#view-dashboard:not([hidden])');
  check('B in same room', (await B.textContent('#room-code-display')).trim() === code);
  check('?room= removed from B URL', !B.url().includes('room='), B.url());
  await A.waitForTimeout(300);
  check('A sees Bob join (cross-tab)', (await A.textContent('#participant-list')).includes('Bob'));
  check('A shows 2 people', (await A.textContent('#participant-count')).includes('2 people'));

  say('\n[6] Item validation');
  await A.fill('#item-name', ''); await A.fill('#item-qty', '0'); await A.fill('#item-price', '0');
  await A.click('#item-form-submit');
  check('empty item name rejected', (await A.textContent('#item-name-error')).length > 0);
  check('qty 0 rejected', (await A.textContent('#item-qty-error')).length > 0);
  check('price 0 rejected', (await A.textContent('#item-price-error')).length > 0);
  await A.fill('#item-qty', '2.5');
  await A.click('#item-form-submit');
  check('fractional qty rejected', (await A.textContent('#item-qty-error')).includes('whole'));

  say('\n[7] Add items + cross-tab sync');
  await A.fill('#item-name', 'Paper towels'); await A.fill('#item-qty', '2'); await A.fill('#item-price', '4.25');
  await A.click('#item-form-submit');
  check('A errors cleared after valid add', (await A.textContent('#item-qty-error')) === '');
  await B.waitForTimeout(300);
  check('B sees A\'s item', (await B.locator('#cart-body tr').count()) === 1);
  await B.fill('#item-name', 'Oat milk'); await B.fill('#item-qty', '1'); await B.fill('#item-price', '4.199');
  await B.click('#item-form-submit');
  await A.waitForTimeout(300);
  check('A sees 2 rows', (await A.locator('#cart-body tr').count()) === 2);
  check('price rounded to cents', (await A.textContent('#cart-total-value')) === '$12.70', await A.textContent('#cart-total-value'));
  check('item count = 3', (await A.textContent('#cart-total-count')) === '3');
  check('expense summary has 2 people', (await A.locator('#expense-list li').count()) === 2);
  check('activity log has entries', (await A.locator('#activity-list li').count()) >= 4);

  say('\n[8] HTML-injection safety');
  await A.fill('#item-name', 'Evil" onmouseover="window.__pwned=1'); await A.fill('#item-qty', '1'); await A.fill('#item-price', '1');
  await A.click('#item-form-submit');
  await A.fill('#item-name', '<img src=x onerror="window.__pwned=1">'); await A.fill('#item-qty', '1'); await A.fill('#item-price', '1');
  await A.click('#item-form-submit');
  await A.hover('#cart-body tr:nth-child(3) [data-action=edit]');
  await A.waitForTimeout(200);
  check('no script ran from item names', !(await A.evaluate(() => window.__pwned)));
  check('quote name kept intact in aria-label',
    (await A.getAttribute('#cart-body tr:nth-child(3) [data-action=edit]', 'aria-label')) === 'Edit Evil" onmouseover="window.__pwned=1');
  check('<img> name shown as text', (await A.textContent('#cart-body tr:nth-child(4) .item-name')).startsWith('<img'));
  // clean them up
  await A.click('#cart-body tr:nth-child(4) [data-action=remove]');
  await A.click('#cart-body tr:nth-child(3) [data-action=remove]');

  say('\n[9] Edit (B) → A updates');
  await B.waitForTimeout(300);
  await B.click('#cart-body tr:nth-child(1) [data-action=edit]');
  check('edit mode prefilled', (await B.inputValue('#item-name')) === 'Paper towels');
  check('cancel button visible in edit', await B.isVisible('#cancel-edit-btn'));
  await B.fill('#item-price', '5');
  await B.click('#item-form-submit');
  check('B exits edit mode', (await B.textContent('#item-form-submit')) === 'Add to cart');
  await A.waitForTimeout(300);
  check('A total reflects edit', (await A.textContent('#cart-total-value')) === '$14.20', await A.textContent('#cart-total-value'));
  check('activity shows edit', (await A.textContent('#activity-list')).includes('edited'));

  say('\n[10] Remove (A) → B updates');
  await A.click('#cart-body tr:nth-child(2) [data-action=remove]');
  await B.waitForTimeout(300);
  check('B sees removal', (await B.locator('#cart-body tr').count()) === 1);

  say('\n[11] Refresh persistence');
  await A.reload();
  await A.waitForSelector('#view-dashboard:not([hidden])');
  check('A still in room after reload', (await A.textContent('#room-code-display')).trim() === code);
  check('A items persisted', (await A.locator('#cart-body tr').count()) === 1);

  say('\n[12] Invite link while already in a room');
  await A.goto(BASE + '?room=ZZZZZZ');
  await A.waitForTimeout(200);
  check('still in own room', (await A.textContent('#room-code-display')).trim() === code);
  check('toast explains', (await A.textContent('#toast-container')).includes('already in room'));

  say('\n[13] Theme toggle + persistence');
  const before = await A.getAttribute('html', 'data-theme');
  await A.click('#theme-toggle');
  const after = await A.getAttribute('html', 'data-theme');
  check('theme toggles', before !== after);
  await A.reload();
  check('theme persists after reload', (await A.getAttribute('html', 'data-theme')) === after);
  if (after !== 'dark') { await A.click('#theme-toggle'); }
  check('now in dark mode (for print test)', (await A.getAttribute('html', 'data-theme')) === 'dark');

  say('\n[14] Print receipt (in dark mode)');
  await A.waitForSelector('#view-dashboard:not([hidden])');
  await A.evaluate(() => { window.print = () => {}; });
  await A.click('#print-receipt-btn');
  check('receipt built', (await A.textContent('#receipt-print')).includes('CartShare Receipt'));
  await A.emulateMedia({ media: 'print' });
  check('only receipt visible when printing', await A.evaluate(() =>
    getComputedStyle(document.querySelector('main')).display === 'none' &&
    getComputedStyle(document.querySelector('.app-header')).display === 'none' &&
    getComputedStyle(document.getElementById('receipt-print')).display === 'block'));
  const color = await A.evaluate(() => getComputedStyle(document.querySelector('.receipt-doc h1')).color);
  check('receipt text is black even in dark mode', color === 'rgb(0, 0, 0)', color);
  const pdf = await A.pdf({ format: 'A4' }); // still emulating print media here, as a real print would
  await A.emulateMedia({ media: 'screen' });
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  check('receipt prints on 1 page (no blank pages)', pages === 1, `pages=${pages}`);
  fs.writeFileSync(path.join(OUT, 'receipt.pdf'), pdf);

  say('\n[15] Leave room');
  await B.click('#leave-room-btn');
  check('confirm opens', await B.isVisible('#confirm-modal'));
  check('Cancel has focus by default', await B.evaluate(() => document.activeElement.id === 'confirm-modal-cancel'));
  await B.keyboard.press('Enter');
  check('Enter on Cancel keeps B in room', await B.isVisible('#view-dashboard'));
  check('confirm closed', !(await B.isVisible('#confirm-modal')));
  await B.click('#leave-room-btn'); await B.keyboard.press('Escape');
  check('Escape keeps B in room', await B.isVisible('#view-dashboard'));
  await B.click('#leave-room-btn'); await B.click('#confirm-modal-ok');
  check('B back on landing', await B.isVisible('#view-landing'));
  check('B room badge hidden', !(await B.isVisible('#room-badge')));
  await A.waitForTimeout(300);
  check('A sees Bob left', !(await A.textContent('#participant-list')).includes('Bob'));
  check('activity shows leave', (await A.textContent('#activity-list')).includes('left the room'));

  say('\n[16] Rejoin / new room after leaving');
  await B.click('#tab-create');
  await B.fill('#create-name', 'Bob');
  await B.click('#form-create button[type=submit]');
  await B.waitForSelector('#view-dashboard:not([hidden])');
  const code2 = (await B.textContent('#room-code-display')).trim();
  check('B created a different room', code2 !== code && code2.length === 6);
  check('B new room cart empty', (await B.locator('#cart-body tr').count()) === 0);

  say('\n[17] Mobile layout (375px) — no sideways scrolling');
  await A.setViewportSize({ width: 375, height: 800 });
  await A.waitForTimeout(200);
  const overflowDash = await A.evaluate(() => document.documentElement.scrollWidth);
  check('dashboard fits 375px', overflowDash <= 375, `scrollWidth=${overflowDash}`);
  await A.screenshot({ path: path.join(OUT, 'mobile_dashboard.png'), fullPage: true });
  const M = await context.newPage(); watch(M, 'M');
  await M.setViewportSize({ width: 375, height: 800 });
  await M.goto(BASE); await M.waitForTimeout(800);
  const overflowLand = await M.evaluate(() => document.documentElement.scrollWidth);
  check('landing fits 375px', overflowLand <= 375, `scrollWidth=${overflowLand}`);
  await M.screenshot({ path: path.join(OUT, 'mobile_landing.png'), fullPage: true });

  await A.setViewportSize({ width: 1280, height: 800 });
  await A.screenshot({ path: path.join(OUT, 'desktop_dashboard_dark.png'), fullPage: true });

  say('\n[18] Console / network errors');
  check('no JS or HTTP errors in any tab', errors.length === 0, '\n    ' + errors.join('\n    '));

  say(`\n==== ${passed} passed, ${failed} failed ====`);
  fs.writeFileSync(path.join(OUT, 'report.txt'),
    `CartShare end-to-end test run — ${new Date().toLocaleString()}\n` + log.join('\n') + '\n');
  await browser.close();
  server.close();
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('TEST CRASHED:', e); if (server) server.close(); process.exit(2); });
