// v1.9.4 — লেজি ছবি/শিমার, অফলাইন ব্যানার, অর্ডার নোটিফিকেশন, অ্যাডমিন ড্যাশবোর্ড ডেমো
const { test, expect } = require('@playwright/test');
const { prepare } = require('./helpers');
test.beforeEach(async ({ page }, ti) => { ti.problems = await prepare(page); });
test.afterEach(async ({}, ti) => { expect(ti.problems, 'কনসোল/নেটওয়ার্ক সমস্যা').toEqual([]); });

test('ছবি: লেজি + async ডিকোড (ডাইনামিক কার্ডেও); হেডার/লাইটবক্স বাদ', async ({ page }) => {
  await page.goto('/shop.html');
  await expect(page.locator('#productList .product-card').first()).toBeVisible();
  const r = await page.evaluate(() => [...document.querySelectorAll('#productList img')].map(i => [i.loading, i.decoding]));
  expect(r.length).toBeGreaterThan(3);
  expect(r.every(x => x[0] === 'lazy' && x[1] === 'async')).toBe(true);
});

test('শিমার: ছবি লোড/এরর হলে স্কেলিটন ক্লাস সরে যায়; HC.skeleton কার্ড দেয়', async ({ page }) => {
  await page.goto('/shop.html');
  await expect(page.locator('#productList .pc-img').first()).toBeVisible();
  await page.waitForFunction(() => !document.querySelector('#productList .pc-img').classList.contains('sk'), null, { timeout: 8000 });   // প্রথম (দৃশ্যমান) কার্ড; নিচের লেজি ছবি স্ক্রলে লোড হয়
  await page.evaluate(() => HC.skeleton('#productList', 4));
  await expect(page.locator('#productList .sk-card')).toHaveCount(4);
});

test('HC_IMG_SRCSET হুক: srcset বসে', async ({ page }) => {
  await page.addInitScript(() => { window.HC_IMG_SRCSET = s => s ? s + ' 400w, ' + s + ' 800w' : ''; });
  await page.goto('/index.html');
  await expect(page.locator('.product-card img').first()).toHaveAttribute('srcset', /400w/);
});

test('অফলাইন ব্যানার: offline ইভেন্টে আসে, online এ চলে যায়', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('#offlineBar')).toHaveCount(0);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.locator('#offlineBar')).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.locator('#offlineBar')).toHaveCount(0);
});

test('অর্ডার নোটিফিকেশন: অনুমতি দিলে চালু ও মনে রাখে; না দিলে "denied"', async ({ page }) => {
  const order = { id: 9100, date: new Date().toISOString(), name: 'টেস্ট', phone: '01712345678', pay: 'ক্যাশ অন ডেলিভারি', items: [{ name: 'X', img: '', regular: 100, sale: 90, qty: 1, label: '' }], totals: { sub: 90, disc: 0, ship: 70, total: 160 } };
  await page.addInitScript(o => {
    localStorage.setItem('hc_last_order', JSON.stringify(o));
    window.__notes = []; window.__ans = 'granted';
    window.Notification = function (t, opt) { window.__notes.push([t, opt && opt.body]); };
    Notification.permission = 'default'; Notification.requestPermission = async () => { Notification.permission = window.__ans; return window.__ans; };
  }, order);
  await page.goto('/order-received.html');
  await expect(page.locator('#notifBox')).toBeVisible();
  await page.locator('#notifBtn').dispatchEvent('click');
  await expect(page.locator('#notifBtn')).toHaveText('চালু আছে');
  expect(await page.evaluate(() => HC.store.get('hc_notif', null).state)).toBe('on');
  expect(await page.evaluate(() => window.__notes.length)).toBe(1);
  // অস্বীকার
  await page.evaluate(() => { localStorage.removeItem('hc_notif'); window.__ans = 'denied'; });
  await page.reload();
  await page.evaluate(() => { window.__ans = 'denied'; });
  await page.locator('#notifBtn').dispatchEvent('click');
  await expect(page.locator('#notifTxt')).toContainText('অনুমতি দেওয়া হয়নি');
  expect(await page.evaluate(() => HC.store.get('hc_notif', null).state)).toBe('denied');
});

test('অ্যাডমিন ডেমো: KPI, ৭-বারের চার্ট, কম স্টক, অর্ডার টেবিল; আসল অর্ডার "আসল" ব্যাজসহ; noindex', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hc_orders', JSON.stringify([{ id: 9200, date: new Date().toISOString(), name: 'আসল গ্রাহক', pay: 'বিকাশ', items: [{ id: 5, name: 'মেমোরি কার্ড', qty: 2 }], totals: { total: 1670 }, risk: [] }])));
  await page.goto('/admin.html');
  expect(await page.locator('meta[name=robots]').getAttribute('content')).toContain('noindex');
  await expect(page.locator('[data-kpi]')).toHaveCount(4);
  expect(await page.locator('#adChart svg rect').count()).toBe(7);
  await expect(page.locator('#adLow')).not.toBeEmpty();
  await expect(page.locator('#adOrders tbody tr').first()).toContainText('#9200');
  await expect(page.locator('#adOrders .badge.bg-success').first()).toHaveText('আসল');
  expect(await page.locator('#adOrders tbody tr').count()).toBeGreaterThan(5);
});
