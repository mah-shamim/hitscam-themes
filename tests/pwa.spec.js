// PWA, SEO ও অ্যাক্সেসিবিলিটি বেসিক — সার্ভিস ওয়ার্কার এখানেই শুধু চালু।
const { test, expect } = require('@playwright/test');
const { prepare } = require('./helpers');

test.beforeEach(async ({ page }, ti) => { ti.problems = await prepare(page); });
test.afterEach(async ({}, ti) => { expect(ti.problems, 'কনসোল/নেটওয়ার্ক সমস্যা').toEqual([]); });

test('ম্যানিফেস্ট বৈধ ও আইকন ফাইলগুলো লোড হয়', async ({ page, request, baseURL }) => {
  await page.goto('/index.html');
  const href = await page.locator('link[rel=manifest]').getAttribute('href');
  const m = await (await request.get(new URL(href, baseURL).href)).json();
  expect(m.name && m.short_name && m.start_url && m.display).toBeTruthy();
  expect(m.icons.some(i => i.sizes === '192x192') && m.icons.some(i => i.sizes === '512x512')).toBeTruthy();
  for (const i of m.icons) expect((await request.get(new URL(i.src, baseURL).href)).ok(), i.src).toBeTruthy();
});

test('robots.txt ও sitemap.xml আছে', async ({ request }) => {
  expect((await request.get('/robots.txt')).ok()).toBeTruthy();
  const x = await (await request.get('/sitemap.xml')).text(); expect(x).toContain('<urlset'); expect(x).toContain('product.html?id=1');
});

test('প্রতিটি পেজে description ও Open Graph আছে; প্রোডাক্টে JSON-LD', async ({ page }) => {
  for (const u of ['/index.html', '/shop.html', '/contact.html']) {
    await page.goto(u);
    expect(await page.locator('meta[name=description]').getAttribute('content'), u).toBeTruthy();
    expect(await page.locator('meta[property="og:title"]').count(), u).toBe(1);
  }
  await page.goto('/product.html?id=2');
  const ld = JSON.parse(await page.locator('#ldProduct').textContent());
  const prod = ld['@graph'].find(x => x['@type'] === 'Product');
  expect(prod.offers.priceCurrency).toBe('BDT'); expect(prod.offers.price).toBeGreaterThan(0); expect(prod.name).toBeTruthy();
  await page.goto('/index.html');
  expect(JSON.parse(await page.locator('script[type="application/ld+json"]').first().textContent())['@graph'].length).toBeGreaterThan(1);
});

test('স্কিপ লিংক ফোকাস পেলে মূল কনটেন্টে যায়', async ({ page, browserName }) => {
  await page.goto('/shop.html');
  const skip = page.locator('.skip-link');
  await expect(skip).toHaveCount(1);
  await skip.focus(); await skip.press('Enter');
  expect(await page.evaluate(() => document.activeElement && document.activeElement.tagName)).toBe('MAIN');
});

test('অজানা পেজে 404 পেজ + জনপ্রিয় পণ্য', async ({ page }, ti) => {
  ti.problems.length = 0;
  const res = await page.goto('/no-such-page.html');
  expect(res.status()).toBe(404);
  await expect(page.locator('.nf-code')).toBeVisible();
  await expect(page.locator('#nfPop .product-card')).toHaveCount(4);
  ti.problems.length = 0;   // 404 রেসপন্সটাই প্রত্যাশিত
});

test.describe('সার্ভিস ওয়ার্কার', () => {
  test.use({ serviceWorkers: 'allow' });
  test('রেজিস্টার হয় ও অফলাইনে ক্যাশ করা পেজ খোলে', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'অফলাইন সিমুলেশন Chromium এ নির্ভরযোগ্য');
    await page.goto('/index.html');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBeTruthy();
    await page.goto('/shop.html');                      // ক্যাশে তুলতে একবার ভিজিট
    await context.setOffline(true);
    await page.goto('/shop.html');
    await expect(page.locator('.site-header')).toBeVisible();
    await context.setOffline(false);
  });
});

test('ইনভয়েস প্রিন্ট: প্রিন্ট মিডিয়ায় হেডার/ফুটার লুকানো, প্রিন্ট বাটন screen এ দৃশ্যমান', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hc_last_order', JSON.stringify({ id: 538, date: new Date().toISOString(), name: 'টেস্ট', phone: '01712345678', pay: 'ক্যাশ অন ডেলিভারি', items: [{ name: 'X', img: '', regular: 100, sale: 90, qty: 1, label: '' }], totals: { sub: 90, disc: 0, ship: 70, total: 160 } })));
  await page.goto('/order-received.html');
  await expect(page.locator('#printBtn')).toBeVisible();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.site-header')).toBeHidden();
  await expect(page.locator('.site-footer')).toBeHidden();
  await expect(page.locator('.print-only')).toBeVisible();
  await expect(page.locator('#oItems')).toBeVisible();
});
