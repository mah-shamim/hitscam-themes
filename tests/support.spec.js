// v1.10.1 — সেলফ-সার্ভিস, RMA, হেল্প সেন্টার, Banglish সার্চ, সম্প্রতি তুলনা, স্টোর/পিকআপ, সংরক্ষিত ফিল্টার
const { test, expect } = require('@playwright/test');
const { prepare } = require('./helpers');

test.beforeEach(async ({ page }, ti) => { ti.problems = await prepare(page); });
test.afterEach(async ({}, ti) => { expect(ti.problems, 'কনসোল/নেটওয়ার্ক সমস্যা').toEqual([]); });

const order = (extra = {}) => Object.assign({ id: 777, date: new Date().toISOString(), name: 'রাকিব', road: 'বাসা ১২', thana: 'মিরপুর', district: 'ঢাকা', address: 'বাসা ১২, মিরপুর, ঢাকা', phone: '01712345678', pay: 'ক্যাশ অন ডেলিভারি',
  items: [{ key: '1|0', id: 1, name: '4G PTZ Camera', label: '', img: '', regular: 6500, sale: 5500, qty: 1 }], totals: { sub: 5500, disc: 0, ship: 0, total: 5500 }, points: { used: 30, earned: 100 } }, extra);
const seedOrder = (page, o) => page.addInitScript(x => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', '1'); localStorage.setItem('hc_last_order', JSON.stringify(x)); localStorage.setItem('hc_orders', JSON.stringify([x])); localStorage.setItem('hc_points', '500'); }, o);
const lsGet = (page, k) => page.evaluate(k => JSON.parse(localStorage.getItem(k)), k);

test('অর্ডার সেলফ-সার্ভিস: ঠিকানা বদল ও বাতিল (পয়েন্ট ফেরত)', async ({ page }) => {
  await seedOrder(page, order()); await page.goto('/order-received.html');
  await expect(page.locator('#ssCancelBtn')).toBeVisible();
  await page.locator('#ssEditBtn').dispatchEvent('click');
  await page.locator('#ssEdit [name=road]').fill('ফ্ল্যাট ৫, সেক্টর ৭'); await page.locator('#ssEdit [name=phone]').fill('01811112222');
  await page.locator('#ssEdit button[type=submit]').dispatchEvent('click');
  await expect(page.locator('#oAddr')).toContainText('সেক্টর ৭');
  expect((await lsGet(page, 'hc_last_order')).phone).toBe('01811112222');
  await page.locator('#ssEditBtn').dispatchEvent('click');
  await page.locator('#ssEdit [name=phone]').fill('123'); await page.locator('#ssEdit button[type=submit]').dispatchEvent('click');
  await expect(page.locator('#ssEditMsg')).toContainText('মোবাইল');
  await page.locator('#ssCancelBtn').dispatchEvent('click');
  await page.locator('#ssCancel button[type=submit]').dispatchEvent('click');
  await expect(page.locator('#selfServ')).toContainText('বাতিল হয়েছে');
  const o = await lsGet(page, 'hc_last_order'); expect(o.status).toBe('cancelled');
  expect(await lsGet(page, 'hc_points')).toBe(500 - 100 + 30);       // অর্জিত বাদ, ব্যবহৃত ফেরত
});

test('সেলফ-সার্ভিস: সময় পেরোলে বাতিল বাটন নেই, রিটার্ন লিংক আছে', async ({ page }) => {
  await seedOrder(page, order({ date: new Date(Date.now() - 3 * 3600e3).toISOString() })); await page.goto('/order-received.html');
  await expect(page.locator('#ssCancelBtn')).toHaveCount(0);
  await expect(page.locator('#selfServ a[href^="rma.html"]')).toBeVisible();
});

test('ট্র্যাক পেজে সংরক্ষিত অর্ডার দেখালে সেলফ-সার্ভিস আসে', async ({ page }) => {
  await seedOrder(page, order()); await page.goto('/track-order.html');
  await page.locator('[name=orderId]').fill('777'); await page.locator('[name=phone]').fill('01712345678');
  await page.locator('#trackForm button').first().dispatchEvent('click');
  await expect(page.locator('#selfServ #ssCancelBtn')).toBeVisible();
});

test('RMA: ফর্ম যাচাই → জমা → ট্র্যাকার ধাপ এগোয় → নম্বর+ফোনে খোঁজা', async ({ page }) => {
  await seedOrder(page, order()); await page.goto('/rma.html?o=777');
  await expect(page.locator('#rmaOrder')).toHaveValue('777');
  await page.locator('#rmaForm button[type=submit]').dispatchEvent('click');
  await expect(page.locator('#rmaDesc')).toHaveClass(/is-invalid/);
  await page.locator('#rmaForm [value=রিপেয়ার]').check({ force: true });
  await page.locator('#rmaDesc').fill('ক্যামেরা চালু হচ্ছে না, লাইট জ্বলছে না');
  await page.locator('#rmaForm button[type=submit]').dispatchEvent('click');
  await expect(page.locator('.rma-card').first()).toContainText('রিপেয়ার');
  const id = (await page.locator('.rma-card b.text-brand').first().innerText()).trim(); expect(id).toMatch(/^RMA-\d{5}$/);
  await page.locator('.rma-next').first().dispatchEvent('click');
  await expect(page.locator('.rma-card').first().locator('li.done')).toHaveCount(1);
  await page.locator('#rmaFind [name=rid]').fill(id); await page.locator('#rmaFind [name=rphone]').fill('01712345678');
  await page.locator('#rmaFind button[type=submit]').dispatchEvent('click');
  await expect(page.locator('#rmaFound .rma-card')).toBeVisible();
  await page.locator('#rmaFind [name=rphone]').fill('01999999999'); await page.locator('#rmaFind button[type=submit]').dispatchEvent('click');
  await expect(page.locator('#rmaFound')).toContainText('পাওয়া যায়নি');
});

test('হেল্প সেন্টার: Banglish সার্চ ও ক্যাটাগরি ফিল্টার; প্রোডাক্ট পেজে সাধারণ প্রশ্ন', async ({ page }) => {
  await page.goto('/help.html');
  const n0 = await page.locator('#helpList .accordion-item').count(); expect(n0).toBeGreaterThan(8);
  await page.locator('#helpQ').fill('cancel'); await expect(page.locator('#helpList')).toContainText('বাতিল');
  await page.locator('#helpQ').fill('kamera install'); await expect(page.locator('#helpList')).toContainText('ইনস্টল');
  await page.locator('#helpQ').fill('warrenty');                         // বানান-ভুল
  await expect(page.locator('#helpList')).toContainText('ওয়ারেন্টি');
  await page.locator('#helpQ').fill('zzzzzz'); await expect(page.locator('#helpList')).toContainText('কোনো উত্তর');
  await page.locator('#helpQ').fill(''); await page.locator('#helpCats .chip-btn', { hasText: 'পেমেন্ট' }).dispatchEvent('click');
  expect(await page.locator('#helpList .accordion-item').count()).toBeLessThan(n0);
  await page.goto('/product.html?id=1'); await expect(page.locator('#pHelp .accordion-item').first()).toBeVisible();
});

test('Banglish/বানান-ভুল সার্চ: kamera, camra, memori kard খুঁজে পায়', async ({ page }) => {
  await page.goto('/index.html');
  const m = (q, id) => page.evaluate(([q, id]) => HC.searchMatch(HC.find(id), q), [q, id]);
  expect(await m('kamera', 1)).toBe(true); expect(await m('camra', 1)).toBe(true); expect(await m('memori kard', 5)).toBe(true);
  expect(await m('sola camera', 2)).toBe(true); expect(await m('laptop', 1)).toBe(false);
  expect(await page.evaluate(() => HC.searchHint('kamera'))).toBe('ক্যামেরা');
  const box = page.locator('.search-box input[name=q]:visible').first();
  await box.fill('kamera'); await expect(page.locator('.sugg .sugg-item').first()).toBeVisible();
  await expect(page.locator('.sugg .sugg-hint').first()).toContainText('ক্যামেরা');
  await box.fill(''); await box.dispatchEvent('focus'); await expect(page.locator('.sugg .chip-link').first()).toBeVisible();
});

test('সংরক্ষিত ফিল্টার: পরের ভিজিটে ফিরে আসে, মুছলে রিসেট', async ({ page, viewport }) => {
  await page.goto('/shop.html');
  if (viewport.width < 992) { await page.locator('[data-bs-target="#filters"]').dispatchEvent('click'); await expect(page.locator('#fReset')).toBeVisible(); }
  await page.locator('#fRate').evaluate(e => { e.value = 4.8; e.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.locator('.f-cat').first().evaluate(e => e.click());
  const n = await page.locator('#resultCount').innerText();
  await page.goto('/shop.html');
  await expect(page.locator('#filtersRestored')).toBeVisible();
  expect(await page.locator('#fRate').inputValue()).toBe('4.8');
  expect(await page.locator('#resultCount').innerText()).toBe(n);
  await page.locator('#filtersRestoredClear').dispatchEvent('click');
  await expect(page.locator('#fRate')).toHaveValue('0');
});

test('সম্প্রতি তুলনা ও "অন্য ক্রেতারা দেখেছেন"', async ({ page }) => {
  await page.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', '1'); localStorage.setItem('hc_cmp', JSON.stringify([1, 2])); });
  await page.goto('/compare.html');
  await page.evaluate(() => { localStorage.setItem('hc_cmp', JSON.stringify([5])); });
  await page.goto('/compare.html');
  await expect(page.locator('#cmpHist .cmp-readd').first()).toBeVisible();
  await page.goto('/product.html?id=1'); await page.goto('/product.html?id=2');
  await expect(page.locator('#alsoViewed .product-card').first()).toBeVisible();
  expect(await page.locator('#alsoViewed .product-card').count()).toBeGreaterThan(0);
  expect(await lsGet(page, 'hc_coview')).toBeTruthy();
});

test('স্টোর লোকেটার: তালিকা ও ম্যাপ লিংক; চেকআউটে স্টোর থেকে সংগ্রহে শিপিং ফ্রি', async ({ page }) => {
  await page.goto('/stores.html');
  await expect(page.locator('.store-card')).toHaveCount(3);
  await expect(page.locator('.store-card a[href*="google.com/maps"]').first()).toBeVisible();
  await page.addInitScript(() => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', '1'); localStorage.setItem('hc_cart', JSON.stringify([{ key: '5|0', id: 5, name: 'কার্ড', label: '', img: '', regular: 900, sale: 800, qty: 1 }])); localStorage.setItem('hc_ship', '70'); });
  await page.goto('/checkout.html');
  const before = await page.evaluate(() => HC.totals());
  expect(before.ship).toBe(70);
  await page.locator('#pickupChk').check({ force: true });
  const after = await page.evaluate(() => HC.totals());
  expect(after.ship).toBe(0); expect(after.total).toBe(before.total - 70);
  await page.locator('#pickupStore').selectOption('ctg');
  await page.locator('[name=name]').fill('রাকিব'); await page.locator('[name=road]').fill('বাসা ১'); await page.locator('[name=thana]').fill('মিরপুর');
  await page.locator('[name=district]').selectOption('ঢাকা'); await page.locator('[name=phone]').fill('01712345678');
  await page.locator('.place-order').first().dispatchEvent('click');
  await page.waitForURL(/order-received/);
  const o = await lsGet(page, 'hc_last_order'); expect(o.pickup).toBe('ctg'); expect(o.totals.ship).toBe(0); expect(o.address).toContain('চট্টগ্রাম');
});
