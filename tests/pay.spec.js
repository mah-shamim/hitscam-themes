// v1.9.1 — COD অগ্রিম, অনলাইন পেমেন্ট ডেমো, ভুয়া-অর্ডার গার্ড, কুরিয়ার ট্র্যাকিং, OTP লগইন, বাংলা/ইংরেজি
const { test, expect } = require('@playwright/test');
const { prepare } = require('./helpers');
test.beforeEach(async ({ page }, ti) => { ti.problems = await prepare(page); });
test.afterEach(async ({}, ti) => { expect(ti.problems, 'কনসোল/নেটওয়ার্ক সমস্যা').toEqual([]); });

const cart = (sale, qty = 1) => ({ key: '1|0', id: 1, name: 'X', label: '', img: '', regular: sale + 1000, sale, qty });
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const seed = (c, extra) => page => page.addInitScript(([c, extra]) => { if (localStorage.getItem('t_seeded')) return; localStorage.setItem('t_seeded', '1'); localStorage.setItem('hc_cart', JSON.stringify([c])); (extra || []).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))); }, [c, extra]);
async function fill(page, phone = '01712345678') {
  const f = page.locator('#orderForm');
  await f.locator('[name=name]').fill('টেস্ট ক্রেতা'); await f.locator('[name=road]').fill('বাসা ১২, মিরপুর');
  await f.locator('[name=thana]').fill('মিরপুর'); await f.locator('[name=district]').selectOption('ঢাকা');
  await f.locator('[name=phone]').fill(phone);
}
const submit = page => page.locator('#orderForm').evaluate(f => f.requestSubmit());

test('COD অগ্রিম: ফিল্ড/হিন্ট আসে, TrxID ছাড়া আটকে, দিলে অর্ডারে advance/due সেভ হয়', async ({ page }) => {
  await seed(cart(3000))(page);
  await page.goto('/checkout.html');
  await fill(page);
  await page.locator('[name=pay][value="COD + অগ্রিম"]').check();
  await expect(page.locator('#payExtra')).toBeVisible();
  await expect(page.locator('#advMethod')).toBeVisible();
  await expect(page.locator('#payHint')).toContainText('অগ্রিম');
  await submit(page);
  await expect(page).toHaveURL(/checkout/);                                  // TrxID নেই → যায়নি
  await page.locator('[name=txn]').fill('8N7A6B5C4D');
  await submit(page);
  await expect(page).toHaveURL(/checkout/);                                  // স্লিপ নেই → আটকে
  await page.locator('[name=slip]').setInputFiles({ name: 'slip.png', mimeType: 'image/png', buffer: PNG });
  await submit(page);
  await page.waitForURL(/order-received/);
  const o = await page.evaluate(() => JSON.parse(localStorage.getItem('hc_last_order')));
  expect(o.advance).toBe(500); expect(o.due).toBe(o.totals.total - 500); expect(o.pay).toBe('COD + অগ্রিম');
  await expect(page.locator('#oDue')).toContainText(String(o.due).replace(/\B(?=(\d{3})+$)/g, ','));
});

test('অনলাইন পেমেন্ট: গেটওয়ে ডেমোতে যায়; সফলে কনফার্ম, ব্যর্থে চেকআউটে ফেরে ও কার্ট থাকে', async ({ page }) => {
  await seed(cart(3000))(page);
  await page.goto('/checkout.html'); await fill(page);
  await page.locator('[name=pay][value="অনলাইন পেমেন্ট"]').check();
  await submit(page);
  await page.waitForURL(/pay-demo\.html/);
  await expect(page.locator('#pgAmt')).toContainText('3,070');
  await page.locator('#pgFail').click();
  await page.waitForURL(/checkout\.html\?payfail=1/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hc_cart')).length)).toBe(1);
  await fill(page); await page.locator('[name=pay][value="অনলাইন পেমেন্ট"]').check(); await submit(page);
  await page.waitForURL(/pay-demo/); await page.locator('#pgOk').click();
  await page.waitForURL(/order-received/);
  const o = await page.evaluate(() => JSON.parse(localStorage.getItem('hc_last_order')));
  expect(o.payStatus).toContain('অনলাইনে পরিশোধিত'); expect(o.txn).toMatch(/^SSL/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hc_cart')).length)).toBe(0);
});

test('ভুয়া-অর্ডার গার্ড: ৳১০,০০০+ সাধারণ COD আটকায়; একই ফোনে ২৪ ঘণ্টায় ৩টির পর আটকায়; হানিপট চুপচাপ বাতিল', async ({ page }) => {
  await seed(cart(12000))(page);
  await page.goto('/checkout.html'); await fill(page);
  await expect(page.locator('#codGuard')).toBeVisible();
  await expect(page.locator('#codGuard')).toContainText('অগ্রিম');
  await submit(page); await expect(page).toHaveURL(/checkout/);
  await page.locator('[name=pay][value="COD + অগ্রিম"]').check();
  await expect(page.locator('#codGuard')).toBeHidden();
  // ফোন-সীমা
  const mk = i => ({ id: 600 + i, date: new Date().toISOString(), phone: '01712345678', items: [], totals: { total: 100 } });
  await page.evaluate(m => localStorage.setItem('hc_orders', JSON.stringify(m)), [mk(1), mk(2), mk(3)]);
  await page.locator('[name=pay][value="ক্যাশ অন ডেলিভারি"]').check();
  await page.evaluate(() => localStorage.setItem('hc_cart', JSON.stringify([{ key: '5|0', id: 5, name: 'Y', label: '', img: '', regular: 900, sale: 800, qty: 1 }])));
  await page.reload(); await fill(page); await submit(page);
  await expect(page.locator('#codGuard')).toContainText('২৪ ঘণ্টায়');
  await expect(page).toHaveURL(/checkout/);
  // হানিপট
  await page.evaluate(() => localStorage.setItem('hc_orders', '[]'));
  await page.reload(); await fill(page);
  await page.locator('[name=website]').evaluate(e => { e.value = 'http://spam'; });
  await submit(page); await page.waitForTimeout(400);
  await expect(page).toHaveURL(/checkout/);
});

test('কুরিয়ার ট্র্যাকিং: কনফার্ম হওয়া অর্ডারে কুরিয়ার, কনসাইনমেন্ট, ট্র্যাক লিংক ও ইভেন্ট আসে', async ({ page }) => {
  const o = { id: 701, date: new Date().toISOString(), phone: '01712345678', district: 'ঢাকা', address: 'মিরপুর, ঢাকা', pay: 'ক্যাশ অন ডেলিভারি', reconfirmed: true, items: [{ name: 'X', img: '', regular: 2000, sale: 1500, qty: 1, label: '' }], totals: { sub: 1500, disc: 0, ship: 70, total: 1570 } };
  await page.addInitScript(o => { localStorage.setItem('hc_orders', JSON.stringify([o])); localStorage.setItem('hc_last_order', JSON.stringify(o)); }, o);
  await page.goto('/track-order.html');
  await page.locator('#trackForm [name=orderId]').fill('701');
  await page.locator('#trackForm [name=phone]').fill('01712345678');
  await page.locator('#trackForm').evaluate(f => f.requestSubmit());
  await expect(page.locator('#tCourier')).toBeVisible();
  await expect(page.locator('#tCName')).toHaveText('Pathao');
  await expect(page.locator('#tCCn')).toContainText('HC701-');
  expect(await page.locator('#tCLink').getAttribute('href')).toMatch(/^https:\/\/merchant\.pathao\.com\/tracking\?consignment_id=HC701-/);
  expect(await page.locator('#tCEv li').count()).toBeGreaterThanOrEqual(3);
});

test('OTP লগইন: ভুল কোডে ৩ বারে লক; ঠিক কোডে (123456) লগইন', async ({ page }) => {
  await page.goto('/login.html#otp');
  await expect(page.locator('#tabOtp')).toBeVisible();
  await page.locator('#otpPhoneForm [name=phone]').fill('123');
  await page.locator('#otpPhoneForm').evaluate(f => f.requestSubmit());
  await expect(page.locator('#otpCodeForm')).toBeHidden();                    // ভুল নাম্বার
  await page.locator('#otpPhoneForm [name=phone]').fill('01712345678');
  await page.locator('#otpPhoneForm').evaluate(f => f.requestSubmit());
  await expect(page.locator('#otpCodeForm')).toBeVisible();
  await expect(page.locator('#otpTo')).toHaveText('01712345678');
  const type = async code => { for (let i = 0; i < 6; i++) await page.locator('#otpBox input').nth(i).evaluate((e, d) => { e.value = d; e.dispatchEvent(new Event('input', { bubbles: true })); }, code[i]); };
  for (let i = 0; i < 3; i++) { await type('000000'); await page.locator('#otpCodeForm').evaluate(f => f.requestSubmit()); }
  await expect(page.locator('#otpVerify')).toBeDisabled();
  await page.locator('#otpResend').evaluate(b => { b.disabled = false; b.click(); });
  await type('123456'); await page.locator('#otpCodeForm').evaluate(f => f.requestSubmit());
  await expect.poll(() => page.evaluate(() => (JSON.parse(localStorage.getItem('hc_user') || 'null') || {}).via)).toBe('otp');
});

const click = (page, sel) => Promise.all([page.waitForEvent('load'), page.locator(sel).dispatchEvent('click')]);   // বাটন পেজ রিলোড করে
test('ভাষা: English বাছলে নেভিগেশন/বাটন ইংরেজি হয়, বাংলায় ফেরা যায়; অঙ্ক বাংলা করা যায়', async ({ page, viewport }) => {
  await page.goto('/index.html');
  await expect(page.locator('.lang-sw')).toBeAttached();
  await click(page, '.lang-sw [data-l=en]');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('body')).toContainText('Camera finder');
  await page.goto('/cart.html');
  await expect(page.locator('body')).toContainText('Your cart');
  await click(page, '.lang-sw [data-l=bn]');
  await expect(page.locator('body')).toContainText('ক্যামেরা বাছাই');
  await click(page, '.lang-sw [data-d]');
  await expect(page.locator('.topbar')).toContainText(/[০-৯]/);
});
