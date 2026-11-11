// v1.9.0 — আস্থা ও কনভার্শন: ক্যামেরা বাছাই, বান্ডেল, রিভিউ (ভেরিফাইড/ছবি/সহায়ক), ওয়ারেন্টি, সোশ্যাল প্রুফ
const { test, expect } = require('@playwright/test');
const { prepare } = require('./helpers');
test.beforeEach(async ({ page }, ti) => { ti.problems = await prepare(page); });
test.afterEach(async ({}, ti) => { expect(ti.problems, 'কনসোল/নেটওয়ার্ক সমস্যা').toEqual([]); });
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

test('ক্যামেরা বাছাই: ৪ প্রশ্ন → সোলার ক্যামেরা ৪/৪ মিলে সবার ওপরে; পিছনে ও আবার শুরু কাজ করে', async ({ page }) => {
  await page.goto('/finder.html');
  const pick = v => page.locator(`.fnd-opt[data-v="${v}"]`).click();
  await pick('out'); await pick('solar'); await pick('sim');
  await page.locator('#fndBack').click();                       // পিছনে → নেটওয়ার্কের প্রশ্ন
  await expect(page.locator('#fnd h2')).toContainText('মোবাইলে');
  await pick('sim'); await pick('any');
  const first = page.locator('#fndRes .panel').first();
  await expect(first).toContainText('Solar');
  await expect(first).toContainText('মিল 4/৪');
  await expect(first.locator('.fnd-why span.no')).toHaveCount(0);   // সবার ওপরেরটিতে কোনো ✗ নেই
  await page.locator('#fndAgain').click();
  await expect(page.locator('#fnd h2')).toContainText('কোথায়');
});

test('ক্যামেরা বাছাই: কোনো মিল না থাকলে বার্তা, ওয়্যার্ড বাছলে DVR/প্যাকেজ আসে', async ({ page }) => {
  await page.goto('/finder.html');
  for (const v of ['in', 'solar', 'wired', 'low']) await page.locator(`.fnd-opt[data-v="${v}"]`).click();
  await expect(page.locator('#fndRes')).toContainText(/DVR|সিসি|প্যাকেজ|পাইনি/);
});

test('বান্ডেল: কার্টে প্রতিটি আইটেমে % ছাড় বসে, লেবেলে বান্ডেল লেখা, মোট মেলে', async ({ page }) => {
  await page.goto('/bundles.html');
  await expect(page.locator('.bnd-card')).toHaveCount(3);
  await page.locator('.bnd-add[data-id="b2"]').dispatchEvent('click');
  const r = await page.evaluate(() => { const c = HC.cart(), b = HC.bundle('b2'); return { n: c.length, labels: c.map(i => i.label), sales: c.map(i => i.sale), expect: HC.bundleItems(b).map(x => x.sale), sum: HC.totals().sub, off: b.off }; });
  expect(r.n).toBe(2); expect(r.labels.every(l => l.includes('বান্ডেল −7%'))).toBe(true);
  expect(r.sales).toEqual(r.expect); expect(r.sum).toBe(r.sales.reduce((a, b) => a + b, 0));
  await page.locator('.bnd-add[data-id="b2"]').dispatchEvent('click');            // আবার দিলে সংখ্যা বাড়ে, নতুন লাইন নয়
  expect(await page.evaluate(() => HC.cart().map(i => i.qty))).toEqual([2, 2]);
});

test('প্রোডাক্ট পেজ: "আজ N জন দেখেছেন" ও বান্ডেল টিজার; ডাটা না থাকলে লুকানো', async ({ page }) => {
  await page.goto('/product.html?id=2');
  await expect(page.locator('#pPulse')).toContainText('জন দেখেছেন');
  await expect(page.locator('#pBundles .bnd-teaser').first()).toBeVisible();
  await page.goto('/product.html?id=12');                         // pulse ডাটা নেই
  await expect(page.locator('#pPulse')).toBeHidden();
});

test('রিভিউ: কেনা পণ্যে ভেরিফাইড ব্যাজ, ছবি আপলোড + লাইটবক্স, সহায়ক ভোট টগল ও মনে থাকে', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hc_orders', JSON.stringify([{ id: 1, date: new Date().toISOString(), phone: '01712345678', items: [{ id: 5 }] }])));
  await page.goto('/product.html?id=5');
  await expect(page.locator('.rv-badge').first()).toBeVisible();                   // সিডেড রিভিউ
  // সহায়ক ভোট
  const help = page.locator('.rv-help').first();
  await expect(help).toContainText('(12)');
  await help.dispatchEvent('click'); await expect(page.locator('.rv-help').first()).toContainText('(13)');
  await page.reload(); await expect(page.locator('.rv-help').first()).toContainText('(13)');
  await page.locator('.rv-help').first().dispatchEvent('click'); await expect(page.locator('.rv-help').first()).toContainText('(12)');   // আবার চাপলে সরে
  // নতুন রিভিউ ছবিসহ
  await page.locator('[for="r5"]').dispatchEvent('click');
  await page.locator('#reviewForm [name=text]').fill('খুব ভালো কার্ড');
  await page.locator('#reviewForm [name=name]').fill('টেস্ট');
  await page.locator('#rvPhotos').setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.locator('#rvPrev img')).toHaveCount(1);
  await page.locator('#reviewForm button.btn-brand').dispatchEvent('click');
  const mine = page.locator('.review-item').first();
  await expect(mine).toContainText('টেস্ট'); await expect(mine.locator('.rv-badge')).toBeVisible(); await expect(mine.locator('.rv-photo')).toHaveCount(1);
  await mine.locator('.rv-photo').dispatchEvent('click');
  await expect(page.locator('.hc-lb img')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.locator('.hc-lb')).toHaveCount(0);
});

test('রিভিউ: না-কেনা পণ্যে নতুন রিভিউতে ভেরিফাইড ব্যাজ নেই', async ({ page }) => {
  await page.goto('/product.html?id=6');
  await page.locator('[for="r4"]').dispatchEvent('click');
  await page.locator('#reviewForm [name=text]').fill('ঠিকঠাক'); await page.locator('#reviewForm [name=name]').fill('অতিথি');
  await page.locator('#reviewForm button.btn-brand').dispatchEvent('click');
  await expect(page.locator('.review-item').first()).toContainText('অতিথি');
  await expect(page.locator('.review-item').first().locator('.rv-badge')).toHaveCount(0);
});

test('ওয়ারেন্টি চেক: সিরিয়ালে সক্রিয়/মেয়াদোত্তীর্ণ, ফোনে খোঁজা, বাংলা অঙ্ক, ভুল হলে বার্তা, কেনা অর্ডারও মেলে', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hc_orders', JSON.stringify([{ id: 777, date: new Date().toISOString(), phone: '01555555555', items: [{ id: 6 }] }])));
  await page.goto('/warranty.html');
  const q = page.locator('#wtyQ'), go = () => page.locator('#wtyForm').evaluate(f => f.requestSubmit());
  await q.fill('hc-ptz-0001'); await go();
  await expect(page.locator('.wty-res')).toContainText('ক্যামেরা'); await expect(page.locator('.wty-res .badge')).toBeVisible();
  await q.fill('HC-SOL-0420'); await go();                       // ২০২৫-০৯ + ১২ মাস → মেয়াদ শেষ
  await expect(page.locator('.wty-res .badge')).toHaveText('মেয়াদোত্তীর্ণ');
  await q.fill('০১৯১২৩৪৫৬৭৮'); await go();                      // বাংলা অঙ্কের ফোন
  await expect(page.locator('.wty-res')).toContainText('মেমোরি');
  await q.fill('01555555555'); await go();                        // এই ব্রাউজারের অর্ডার থেকে
  await expect(page.locator('.wty-res')).toContainText('অর্ডার #777'); await expect(page.locator('.wty-res .badge')).toHaveText('ওয়ারেন্টি সক্রিয়');
  await q.fill('NOPE-000'); await go();
  await expect(page.locator('#wtyRes')).toContainText('রেকর্ড পাওয়া যায়নি');
});

test('অর্ডার দিলে অর্ডার ইতিহাসে (hc_orders) সেভ হয়', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hc_cart', JSON.stringify([{ key: '5|0', id: 5, name: 'X', label: '', img: '', regular: 900, sale: 800, qty: 1 }])));
  await page.goto('/checkout.html');
  await page.locator('#orderForm [name=name]').fill('টেস্ট'); await page.locator('#orderForm [name=road]').fill('বাসা ১');
  await page.locator('#orderForm [name=thana]').fill('মিরপুর'); await page.locator('#orderForm [name=district]').selectOption({ label: 'ঢাকা' });
  await page.locator('#orderForm [name=phone]').fill('01712345678');
  await page.locator('#orderForm').evaluate(f => f.requestSubmit());
  await page.waitForURL(/order-received/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hc_orders')).length)).toBe(1);
});
