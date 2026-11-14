// v1.10.2 — বাল্ক/ডিলার প্রাইস, অ্যাডমিন WhatsApp টেমপ্লেট ও CSV
const { test, expect } = require('@playwright/test');
const { prepare } = require('./helpers');

test.beforeEach(async ({ page }, ti) => { ti.problems = await prepare(page); });
test.afterEach(async ({}, ti) => { expect(ti.problems, 'কনসোল/নেটওয়ার্ক সমস্যা').toEqual([]); });

const line = (qty, id = 5, sale = 800) => [{ key: id + '|0', id, name: 'পণ্য', label: '', img: '', regular: sale + 100, sale, qty }];
const seed = (page, cart, extra = {}) => page.addInitScript(([c, x]) => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', '1'); localStorage.setItem('hc_cart', JSON.stringify(c)); localStorage.setItem('hc_ship', '70'); Object.keys(x).forEach(k => localStorage.setItem(k, JSON.stringify(x[k]))); }, [cart, extra]);
const T = page => page.evaluate(() => HC.totals());

test('বাল্ক ছাড়: ৫+/১০+/২০+ পিসে ৩/৬/১০%; ১–৪ পিসে নেই', async ({ page }) => {
  await seed(page, line(4)); await page.goto('/cart.html');
  expect((await T(page)).bulk).toBe(0);
  await page.evaluate(() => HC.setQty('5|0', 5)); expect((await T(page)).bulk).toBe(Math.round(800 * 5 * 0.03));
  await page.evaluate(() => HC.setQty('5|0', 12)); expect((await T(page)).bulk).toBe(Math.round(800 * 12 * 0.06));
  await page.evaluate(() => HC.setQty('5|0', 25)); const t = await T(page); expect(t.bulk).toBe(Math.round(800 * 25 * 0.10));
  await expect(page.locator('#cartTotals')).toContainText('বাল্ক ছাড়');
  expect(t.total).toBe(t.sub - t.disc + t.ship - t.bulk + (t.svc || 0) - (t.loy || 0) - (t.refd || 0));   // মোটের হিসাব মেলে
});

test('কার্টে পরের ধাপের ইঙ্গিত ও প্রোডাক্ট পেজে বাল্ক টেবিল', async ({ page }) => {
  await seed(page, line(3)); await page.goto('/cart.html');
  await expect(page.locator('#bulkNote')).toContainText('আরও 2টি');
  await page.goto('/product.html?id=5'); await expect(page.locator('#pBulk')).toContainText('5+ পিস');
  await page.goto('/product.html?id=12'); await expect(page.locator('#pBulk')).toHaveCount(0);   // স্টক আউট/এক্সটার্নাল
});

test('ডিলার মোড: ভুল কোড বাতিল, সঠিক কোডে অতিরিক্ত ৪%, বন্ধ করলে ফেরে', async ({ page }) => {
  await seed(page, line(2)); await page.goto('/dealer.html');
  await page.locator('#dealerForm [name=code]').fill('WRONG'); await page.locator('#dealerForm button').dispatchEvent('click');
  await expect(page.locator('#dealerMsg')).toContainText('সঠিক নয়');
  expect((await T(page)).bulk).toBe(0);
  await page.locator('#dealerForm [name=code]').fill('dealer2026'); await page.locator('#dealerForm button').dispatchEvent('click');
  await expect(page.locator('#dealerState')).toContainText('চালু');
  expect((await T(page)).bulk).toBe(Math.round(800 * 2 * 0.04));
  await page.locator('#dealerOff').dispatchEvent('click'); expect((await T(page)).bulk).toBe(0);
});

test('অর্ডারে বাল্ক ছাড় সেভ হয়', async ({ page }) => {
  await seed(page, line(10)); await page.goto('/checkout.html');
  await page.locator('[name=name]').fill('রাকিব'); await page.locator('[name=road]').fill('বাসা ১'); await page.locator('[name=thana]').fill('মিরপুর');
  await page.locator('[name=district]').selectOption('ঢাকা'); await page.locator('[name=phone]').fill('01712345678');
  await page.locator('.place-order').first().dispatchEvent('click'); await page.waitForURL(/order-received/);
  const o = await page.evaluate(() => JSON.parse(localStorage.getItem('hc_last_order')));
  expect(o.bulk.amount).toBe(Math.round(800 * 10 * 0.06)); expect(o.bulk.dealer).toBe(false);
});

test('অ্যাডমিন: WhatsApp টেমপ্লেট বার্তা ও লিংক, CSV সুরক্ষিত ও সঠিক', async ({ page }) => {
  const o = { id: 901, date: new Date().toISOString(), name: 'রাকিব', phone: '01712345678', address: 'মিরপুর', pay: 'ক্যাশ অন ডেলিভারি', due: 1500, totals: { total: 5570 }, items: [{ name: '=HYPERLINK("x")', qty: 1 }], courier: { key: 'pathao', cn: 'HC901-00001' } };
  await page.addInitScript(x => { if (sessionStorage.getItem('s')) return; sessionStorage.setItem('s', '1'); localStorage.setItem('hc_orders', JSON.stringify([x])); }, o);
  await page.goto('/admin.html');
  await expect(page.locator('#opsTools')).toBeVisible();
  await expect(page.locator('#waPreview')).toHaveValue(/অর্ডার #901 কনফার্ম/);
  await page.locator('#waTpl').selectOption('shipped'); await expect(page.locator('#waPreview')).toHaveValue(/HC901-00001/);
  await page.locator('#waTpl').selectOption('due'); await expect(page.locator('#waPreview')).toHaveValue(/1,500/);
  expect(await page.evaluate(() => HC.waCustomerUrl({ phone: '01712345678' }, 'হ্যালো'))).toBe('https://wa.me/8801712345678?text=' + encodeURIComponent('হ্যালো'));
  const csv = await page.evaluate(() => HC.csv(HC.csvOrders(), 'o.csv'));
  expect(csv).toContain("'=HYPERLINK");                              // ফর্মুলা ইনজেকশন ঠেকানো
  expect(csv.split('\r\n').length).toBe(2); expect(csv).toContain('901');
  const low = await page.evaluate(() => HC.csvLowStock()); expect(low.length).toBeGreaterThan(1);
  const ab = await page.evaluate(() => { localStorage.setItem('hc_cart', JSON.stringify([{ id: 5, name: 'কার্ড', qty: 2, sale: 800, regular: 900 }])); localStorage.setItem('hc_cart_ts', String(Date.now() - 3600e3)); return HC.abandoned(); });
  expect(ab.length).toBe(1); expect(ab[0].value).toBe(1600);
  const dl = page.waitForEvent('download'); await page.locator('#csvLow').dispatchEvent('click'); expect((await dl).suggestedFilename()).toBe('low-stock.csv');
});
