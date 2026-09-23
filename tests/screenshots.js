// Generates clean, presentation-ready screenshots of CartShare into
// ../docs/screenshots. Re-run it after any UI change so the report and
// slides always match the real app.
//
// Run:  npm run screenshots   (from this tests/ folder)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { startServer } = require('./serve');

const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

// Demo data: three flatmates stocking a shared kitchen.
const PEOPLE = ['Priya', 'Rahul', 'Aisha'];
const ITEMS = {
  Priya: [['Basmati rice 5 kg', 1, 12.5], ['Dish soap', 2, 3.1]],
  Rahul: [['Toothpaste', 2, 2.4], ['Milk 1 L', 4, 1.2]],
  Aisha: [['Paper towels', 1, 6.75], ['Coffee beans', 1, 9.9]],
};

const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 390, height: 844 };

async function settle(page) {
  // Clear toasts and hover effects so shots look clean.
  await page.evaluate(() => { document.getElementById('toast-container').innerHTML = ''; });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(700); // let entrance animations finish
}

async function shot(page, name, opts = {}) {
  await settle(page);
  await page.screenshot({ path: path.join(OUT, name), ...opts });
  console.log('  saved', name);
}

async function addItem(page, [name, qty, price]) {
  await page.fill('#item-name', name);
  await page.fill('#item-qty', String(qty));
  await page.fill('#item-price', String(price));
  await page.click('#item-form-submit');
}

(async () => {
  const { server, base } = await startServer();
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: DESKTOP, colorScheme: 'light' });

  console.log('Landing');
  const first = await context.newPage();
  await first.goto(base);
  await shot(first, '01-landing-light.png');
  await first.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await shot(first, '02-landing-dark.png');
  await first.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));

  console.log('Create room + invite');
  const pages = { Priya: first };
  await first.fill('#create-name', 'Priya');
  await first.click('#form-create button[type=submit]');
  await first.waitForSelector('#view-dashboard:not([hidden])');
  await shot(first, '03-new-room-empty.png');

  await first.click('#share-room-btn');
  const link = await first.inputValue('#share-link-input');
  await shot(first, '04-share-modal.png');
  await first.keyboard.press('Escape');

  for (const name of ['Rahul', 'Aisha']) {
    const p = await context.newPage();
    await p.goto(link);
    await p.fill('#join-name', name);
    if (name === 'Rahul') await shot(p, '05-join-via-invite-link.png');
    await p.click('#form-join button[type=submit]');
    await p.waitForSelector('#view-dashboard:not([hidden])');
    pages[name] = p;
  }

  console.log('Fill the cart from all three tabs');
  for (const name of PEOPLE) {
    for (const item of ITEMS[name]) await addItem(pages[name], item);
  }
  // One edit and one removal so the activity log shows every action type.
  const rahul = pages.Rahul;
  await rahul.waitForTimeout(300);
  const milkRow = rahul.locator('#cart-body tr', { hasText: 'Milk 1 L' });
  await milkRow.locator('[data-action=edit]').click();
  await rahul.fill('#item-qty', '6');
  await rahul.click('#item-form-submit');
  const priya = pages.Priya;
  await priya.waitForTimeout(300);
  await priya.locator('#cart-body tr', { hasText: 'Dish soap' }).locator('[data-action=remove]').click();
  await priya.waitForTimeout(300);

  console.log('Dashboards');
  await shot(priya, '06-dashboard-light.png', { fullPage: true });
  await priya.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await shot(priya, '07-dashboard-dark.png', { fullPage: true });
  await priya.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));

  // Two tabs side by side: proves the same cart appears in both.
  // Scroll both to the top and let the theme transition finish first.
  for (const p of [priya, rahul]) {
    await p.evaluate(() => window.scrollTo(0, 0));
    await settle(p);
  }
  const left = (await priya.screenshot()).toString('base64');
  const right = (await rahul.screenshot()).toString('base64');
  const combo = await context.newPage();
  await combo.setViewportSize({ width: 2600, height: 860 });
  await combo.setContent(`
    <body style="margin:0;padding:30px;background:#d9d9d6;display:flex;gap:40px;font-family:sans-serif">
      ${[['Tab 1 — Priya', left], ['Tab 2 — Rahul', right]].map(([label, img]) => `
        <figure style="margin:0">
          <figcaption style="font-size:22px;font-weight:600;margin-bottom:10px">${label}</figcaption>
          <img src="data:image/png;base64,${img}" style="width:1260px;border:1px solid #999;border-radius:8px">
        </figure>`).join('')}
    </body>`);
  await combo.screenshot({ path: path.join(OUT, '08-two-tabs-in-sync.png'), fullPage: true });
  console.log('  saved 08-two-tabs-in-sync.png');
  await combo.close();

  await rahul.click('#leave-room-btn');
  await rahul.waitForTimeout(300);
  await rahul.screenshot({ path: path.join(OUT, '09-leave-confirmation.png') });
  console.log('  saved 09-leave-confirmation.png');
  await rahul.click('#confirm-modal-cancel');

  console.log('Receipt');
  await priya.evaluate(() => { window.print = () => {}; });
  await priya.click('#print-receipt-btn');
  await priya.emulateMedia({ media: 'print' });
  await priya.pdf({ path: path.join(OUT, '10-receipt.pdf'), format: 'A4', margin: { top: '1.5cm', bottom: '1.5cm', left: '1.5cm', right: '1.5cm' } });
  console.log('  saved 10-receipt.pdf');
  await priya.setViewportSize({ width: 800, height: 700 });
  await priya.screenshot({ path: path.join(OUT, '10-receipt.png') });
  console.log('  saved 10-receipt.png');
  await priya.emulateMedia({ media: 'screen' });
  await priya.setViewportSize(DESKTOP);

  console.log('Mobile');
  await priya.setViewportSize(MOBILE);
  await shot(priya, '11-mobile-dashboard.png', { fullPage: true });
  const mobileLanding = await context.newPage();
  await mobileLanding.setViewportSize(MOBILE);
  await mobileLanding.goto(base);
  await shot(mobileLanding, '12-mobile-landing.png', { fullPage: true });

  await browser.close();
  server.close();
  console.log(`\nDone: screenshots are in ${OUT}`);
})().catch((e) => { console.error('SCREENSHOTS FAILED:', e); process.exit(1); });
