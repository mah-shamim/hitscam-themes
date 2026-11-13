// v1.10.0 — ইনস্টলেশন, ওয়ারেন্টি, কম্প্যাটিবিলিটি, পয়েন্ট/রেফারেল, অর্ডার-পরবর্তী আপসেল
const { test, expect } = require('@playwright/test');
const { prepare } = require('./helpers');

test.beforeEach(async ({ page }, ti) => { ti.problems = await prepare(page); });
test.afterEach(async ({}, ti) => { expect(ti.problems, 'কনসোল/নেটওয়ার্ক সমস্যা').toEqual([]); });

const camCart = [{ key: '1|0', id: 1, name: '4G PTZ Camera', label: '', img: '', regular: 6500, sale: 5500, qty: 1 }];
const cardCart = [{ key: '5|0', id: 5, name: '64GB কার্ড', label: '', img: '', regular: 900, sale: 800, qty: 1 }];
const seed = (page, cart, extra = {}) => page.addInitScript(([c, x]) => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.setItem('hc_cart', JSON.stringify(c)); localStorage.setItem('hc_ship', '70'); Object.keys(x).forEach(k => localStorage.setItem(k, JSON.stringify(x[k]))); }, [cart, extra]);
const total = async page => +(await page.evaluate(() => HC.totals().total));

test('ইনস্টলেশন: ক্যামেরা থাকলে বক্স আসে, টিক দিলে ঢাকায় ৳৫০০ যোগ, স্লট বদলায়', async ({ page }) => {
  await seed(page, camCart); await page.goto('/cart.html');
  const base = await total(page);
  await expect(page.locator('#svcInstall')).toBeVisible();
  await page.locator('#svcInstall').check({ force: true });
  expect(await total(page)).toBe(base + 500);
  await expect(page.locator('#cartTotals')).toContainText('ইনস্টলেশন সেবা');
  await page.locator('#svcSlot').selectOption({ index: 2 });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hc_svc')).slot)).toContain('বিকাল');
  await page.evaluate(() => { localStorage.setItem('hc_ship', '130'); $(document).trigger('cartchange'); });
  expect(await total(page)).toBe(base + 900);                       // ঢাকার বাইরে
});

test('ওয়ারেন্টি কভার: ৮% ও ১৪% ক্যামেরার সাবটোটালের উপর', async ({ page }) => {
  await seed(page, camCart); await page.goto('/cart.html');
  const base = await total(page);
  await page.locator('.svc-w[value=ext]').check({ force: true });
  expect(await total(page)).toBe(base + 440);                       // ৫৫০০ × ৮%
  await page.locator('.svc-w[value=acc]').check({ force: true });
  expect(await total(page)).toBe(base + 770);                       // ৫৫০০ × ১৪%
});

test('ক্যামেরা ছাড়া কার্টে ইনস্টলেশন/ওয়ারেন্টি লুকানো', async ({ page }) => {
  await seed(page, cardCart); await page.goto('/cart.html');
  await expect(page.locator('#svcPanel')).toBeVisible();
  await expect(page.locator('#svcInstall')).toHaveCount(0);
  await expect(page.locator('.svc-w')).toHaveCount(0);
});

test('লয়ালটি পয়েন্ট: ব্যালেন্স থাকলে ব্যবহার করা যায় (সর্বোচ্চ ২০%), না থাকলে বন্ধ', async ({ page }) => {
  await seed(page, camCart, { hc_points: 5000 }); await page.goto('/cart.html');
  const base = await total(page);
  await page.locator('#svcPts').check({ force: true });
  expect(await total(page)).toBe(base - 1100);                      // ৫৫০০ এর ২০%
  const page2 = await page.context().newPage(); await prepare(page2);
  await page2.addInitScript(c => { localStorage.setItem('hc_cart', JSON.stringify(c)); localStorage.setItem('hc_points', '10'); }, camCart);
  await page2.goto('/cart.html'); await expect(page2.locator('#svcPts')).toBeDisabled(); await page2.close();
});

test('রেফারেল: বৈধ কোডে ৳২০০ ছাড়, নিজের/ভুল কোড বাতিল, পুরোনো গ্রাহকে নয়', async ({ page }) => {
  await seed(page, camCart); await page.goto('/cart.html');
  const base = await total(page);
  await page.locator('#refInput').fill('XYZ'); await page.locator('#refApply').click();
  await expect(page.locator('#refMsg')).toContainText('ফরম্যাট');
  const mine = await page.locator('#myRef').innerText();
  await page.locator('#refInput').fill(mine); await page.locator('#refApply').click();
  await expect(page.locator('#refMsg')).toContainText('নিজের কোড');
  await page.locator('#refInput').fill('HC-AB12CD'); await page.locator('#refApply').click();
  await expect(page.locator('#refClear')).toBeVisible();
  expect(await total(page)).toBe(base - 200);
  await page.evaluate(() => localStorage.setItem('hc_orders', JSON.stringify([{ id: 1, phone: '01700000000', date: new Date().toISOString() }])));
  expect(await total(page)).toBe(base);                             // আগে অর্ডার আছে → ছাড় নেই
});

test('কম্প্যাটিবিলিটি চেকার: মেমোরি কার্ড DVR এ ✗, ক্যামেরায় ✓; PTZ তে WiFi ✗', async ({ page }) => {
  await page.goto('/product.html?id=5');
  await page.locator('#cp-dev').selectOption('dvr');
  await expect(page.locator('#cpRes')).toHaveClass(/bad/); await expect(page.locator('#cpRes')).toContainText('হার্ডডিস্ক');
  await page.locator('#cp-dev').selectOption('solar');
  await expect(page.locator('#cpRes')).toHaveClass(/ok/);
  await page.goto('/product.html?id=1');
  await page.locator('#cp-power').selectOption('220'); await page.locator('#cp-net').selectOption('wifi');
  await expect(page.locator('#cpRes')).toHaveClass(/bad/); await expect(page.locator('#cpRes')).toContainText('SIM');
  await page.locator('#cp-net').selectOption('sim'); await expect(page.locator('#cpRes')).toHaveClass(/ok/);
  await page.goto('/product.html?id=3'); await expect(page.locator('#pCompat')).toHaveCount(0);   // নিয়ম নেই এমন পণ্যে বক্স নেই
});

test('অর্ডার: সেবা + পয়েন্ট অর্ডারে সেভ, পয়েন্ট ব্যালেন্স বাড়ে, আপসেল অর্ডারে যোগ হয়', async ({ page }) => {
  await seed(page, camCart, { hc_points: 100 }); await page.goto('/cart.html');
  await page.locator('#svcInstall').check({ force: true });
  const t = await page.evaluate(() => HC.totals());
  expect(t.earn).toBeGreaterThan(0);
  await page.goto('/checkout.html');
  await page.locator('[name=name]').fill('রাকিব হাসান'); await page.locator('[name=road]').fill('বাসা ১২');
  await page.locator('[name=thana]').fill('মিরপুর'); await page.locator('[name=district]').selectOption('ঢাকা'); await page.locator('[name=phone]').fill('01712345678');
  await page.locator('.place-order').dispatchEvent('click');
  await page.waitForURL(/order-received/);
  const o = await page.evaluate(() => JSON.parse(localStorage.getItem('hc_last_order')));
  expect(o.services.install.fee).toBe(500); expect(o.points.earned).toBe(t.earn);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hc_points')))).toBe(100 + t.earn);
  await expect(page.locator('#oDiscRow ~ .totals-row, .totals-row').filter({ hasText: 'ইনস্টলেশন সেবা' }).first()).toBeVisible();
  // আপসেল
  await expect(page.locator('#postUpsell')).toBeVisible();
  const before = o.totals.total;
  await page.locator('#upsellAdd').dispatchEvent('click');
  await page.waitForLoadState('load'); await expect(page.locator('#postUpsell')).toHaveCount(0);
  const o2 = await page.evaluate(() => JSON.parse(localStorage.getItem('hc_last_order')));
  expect(o2.items.length).toBe(o.items.length + 1); expect(o2.totals.total).toBeGreaterThan(before); expect(o2.upsold).toBe(true);
  await expect(page.locator('#refCard')).toBeVisible();
});
