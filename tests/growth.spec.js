// v1.9.3 — গ্রোথ ও SEO: ব্লগ/গাইড + স্ট্রাকচার্ড ডাটা, অ্যানালিটিক্স + সম্মতি, মার্চেন্ট ফিড
const { test, expect } = require('@playwright/test');
const { prepare } = require('./helpers');
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
test.beforeEach(async ({ page }, ti) => { ti.problems = await prepare(page); });
test.afterEach(async ({}, ti) => { expect(ti.problems, 'কনসোল/নেটওয়ার্ক সমস্যা').toEqual([]); });
const cfg = { ga4: 'G-TEST123456', pixel: '99887766', load: false };   // load:false → আসল থার্ড-পার্টি স্ক্রিপ্ট নামে না
const withCfg = page => page.addInitScript(c => { window.HC_ANALYTICS = c; }, cfg);

test('গাইড তালিকা → পোস্ট: Article + BreadcrumbList + FAQPage JSON-LD, FAQ ও সংশ্লিষ্ট পণ্য', async ({ page }) => {
  await page.goto('/blog.html');
  expect(await page.locator('#postList .post-card').count()).toBeGreaterThanOrEqual(4);
  await page.locator('#postList .post-card').first().dispatchEvent('click');
  await expect(page).toHaveURL(/guide\.html\?slug=/);
  await expect(page.locator('#gArticle h1')).toBeVisible();
  const ld = await page.evaluate(() => JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent));
  const types = ld['@graph'].map(x => x['@type']);
  expect(types).toEqual(expect.arrayContaining(['Article', 'BreadcrumbList', 'FAQPage']));
  expect(ld['@graph'].find(x => x['@type'] === 'FAQPage').mainEntity.length).toBeGreaterThan(0);
  await expect(page.locator('#gFaq .accordion-item').first()).toBeVisible();
  expect(await page.locator('#gRel .product-card').count()).toBeGreaterThan(0);
  expect((await page.title())).not.toContain('গাইডটি পাওয়া যায়নি');
});

test('গাইড: অজানা slug এ "পাওয়া যায়নি" বার্তা', async ({ page }) => {
  await page.goto('/guide.html?slug=nope');
  await expect(page.locator('#gArticle')).toContainText('পাওয়া যায়নি');
});

test('অ্যানালিটিক্স: ID না থাকলে ব্যানার/ট্র্যাকিং নেই', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('#consentBar')).toHaveCount(0);
  expect(await page.evaluate(() => HC.track('view_item', {}))).toBe(false);
});

test('সম্মতি: না দেওয়া পর্যন্ত কোনো ইভেন্ট নেই; "অনুমতি দিন" এর পর view_item/add_to_cart/purchase, রিলোডে purchase ডুপ্লিকেট নয়', async ({ page }) => {
  await withCfg(page);
  await page.goto('/product.html?id=1');
  await expect(page.locator('#consentBar')).toBeVisible();
  await page.locator('.p-add').dispatchEvent('click');
  expect(await page.evaluate(() => HC.analyticsLog.length)).toBe(0);          // সম্মতির আগে কিছুই নয়
  await page.locator('#consentYes').dispatchEvent('click');
  await expect(page.locator('#consentBar')).toHaveCount(0);
  let names = await page.evaluate(() => HC.analyticsLog.map(e => e.name));
  expect(names).toContain('view_item');
  await page.locator('.p-add').dispatchEvent('click');
  const add = await page.evaluate(() => HC.analyticsLog.find(e => e.name === 'add_to_cart'));
  expect(add.params.currency).toBe('BDT'); expect(add.params.items[0].item_id).toBe('1'); expect(add.params.value).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.dataLayer.some(a => a[0] === 'event' && a[1] === 'add_to_cart'))).toBe(true);   // GA4
  expect(await page.evaluate(() => window.fbq.queue.some(a => a[0] === 'track' && a[1] === 'AddToCart'))).toBe(true);    // Pixel
  // purchase একবারই
  await page.evaluate(() => localStorage.setItem('hc_last_order', JSON.stringify({ id: 9001, date: new Date().toISOString(), name: 'টেস্ট', phone: '01712345678', pay: 'ক্যাশ অন ডেলিভারি', items: [{ name: 'X', img: '', regular: 100, sale: 90, qty: 1, label: '' }], totals: { sub: 90, disc: 0, ship: 70, total: 160 } })));
  await page.goto('/order-received.html');
  expect(await page.evaluate(() => HC.analyticsLog.filter(e => e.name === 'purchase').length)).toBe(1);
  await page.reload();
  expect(await page.evaluate(() => HC.analyticsLog.filter(e => e.name === 'purchase').length)).toBe(0);
});

test('সম্মতি: "না, ধন্যবাদ" মনে রাখে, ট্র্যাকিং বন্ধ; ফুটারের "কুকি সেটিংস" এ আবার জিজ্ঞাসা', async ({ page }) => {
  await withCfg(page);
  await page.goto('/index.html');
  await page.locator('#consentNo').dispatchEvent('click');
  await page.reload();
  await expect(page.locator('#consentBar')).toHaveCount(0);
  expect(await page.evaluate(() => HC.track('view_item', {}))).toBe(false);
  await page.locator('.cookie-settings').dispatchEvent('click');
  await expect(page.locator('#consentBar')).toBeVisible();
});

test('মার্চেন্ট ফিড: বৈধ XML, সব পণ্য, দাম ও স্টক সঠিক', async () => {
  const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'tools', 'merchant-feed.js')], { encoding: 'utf8', env: Object.assign({}, process.env, { SITE_URL: 'https://shop.test' }) });
  expect(r.status).toBe(0);
  const xml = fs.readFileSync(path.join(__dirname, '..', 'feed', 'google-merchant.xml'), 'utf8');
  expect(xml).toContain('xmlns:g="http://base.google.com/ns/1.0"');
  expect(xml).toContain('<link>https://shop.test/product.html?id=1</link>');
  expect(xml).toMatch(/<g:price>\d+\.00 BDT<\/g:price>/);
  expect(xml).toMatch(/<g:availability>(in_stock|out_of_stock)<\/g:availability>/);
  expect((xml.match(/<item>/g) || []).length).toBeGreaterThanOrEqual(10);
  expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;)/);                         // কাঁচা & নেই
  spawnSync(process.execPath, [path.join(__dirname, '..', 'tools', 'merchant-feed.js')]);   // ডিফল্ট ডোমেইনে ফিরিয়ে রাখা
});

test('প্রোডাক্ট পেজ মেটা: og:title/image পণ্য অনুযায়ী বদলায়', async ({ page }) => {
  await page.goto('/product.html?id=2');
  expect(await page.locator('meta[property="og:title"]').getAttribute('content')).toContain('Solar');
  expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toMatch(/^https?:/);
});
