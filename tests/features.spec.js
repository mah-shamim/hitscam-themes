// কাস্টমার-আচরণ ভিত্তিক ফিচার: WhatsApp অর্ডার, ডেলিভারি এস্টিমেট, EMI, ড্রাফট/রিমাইন্ডার, স্টক-আউট নোটিফাই।
const { test, expect } = require('@playwright/test');
const { prepare } = require('./helpers');

test.beforeEach(async ({ page }, ti) => {
  ti.problems = await prepare(page);
  await page.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
});
test.afterEach(async ({}, ti) => { expect(ti.problems, 'কনসোল/নেটওয়ার্ক সমস্যা').toEqual([]); });
const opened = page => page.evaluate(() => window.__opened.map(decodeURIComponent));

test('WhatsApp অর্ডার (প্রোডাক্ট পেজ): নির্বাচিত অপশন, পরিমাণ, মোট ও লিংকসহ মেসেজ', async ({ page }) => {
  await page.goto('/product.html?id=2');
  await page.locator('#pOptions .swatch input[value="সাদা"]').check();
  await page.locator('#pQty').fill('2');
  await page.locator('#pWa').click();
  const [url] = await opened(page);
  expect(url).toContain('https://wa.me/8801614747054?text=');
  expect(url).toContain('সাদা / শুধু WiFi');
  expect(url).toContain('× 2');
  expect(url).toContain('23,000');                       // 11,500 × 2
  expect(url).toContain('product.html?id=2');
});

test('WhatsApp অর্ডার (কার্ট পেজ ও মিনি কার্ট)', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hc_cart', JSON.stringify([{ key: '1|0', id: 1, name: '4G PTZ Camera', label: '', img: '', regular: 6500, sale: 5500, qty: 3 }])));
  await page.goto('/cart.html');
  await page.locator('#cartTotals .wa-cart').click();
  const [u] = await opened(page);
  expect(u).toContain('4G PTZ Camera × 3 = ৳16,500'); expect(u).toContain('মোট');
  await page.goto('/index.html');
  await page.locator('[data-bs-target="#miniCart"]:visible').first().click();
  await expect(page.locator('#miniCartBody .wa-cart')).toBeVisible();
});

test('ডেলিভারি এস্টিমেট: এলাকা বদলালে তারিখ/চার্জ বদলায়, চেকআউটের শিপিং মেলে', async ({ page }) => {
  await page.goto('/product.html?id=5');                       // ৳800 (৳5,000 এর নিচে, তাই চার্জ দেখায়)
  await expect(page.locator('#delivText')).toContainText('৳70');
  await page.locator('#pDeliv .zone-btn[data-z="130"]').click();
  await expect(page.locator('#delivText')).toContainText('৳130');
  await expect(page.locator('#pDeliv .zone-btn[data-z="130"]')).toHaveClass(/active/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hc_ship')))).toBe(130);
  await page.locator('.p-add').first().click();
  await page.goto('/checkout.html');
  await expect(page.locator('.ship-radio[value="130"]')).toBeChecked();
});

test('EMI: ৳৫,০০০+ পণ্যে দেখায়, কিস্তির হিসাব মেলে; কম দামে লুকানো', async ({ page }) => {
  await page.goto('/product.html?id=2');                       // ৳11,500
  await expect(page.locator('#pEmi')).toBeVisible();
  await page.locator('#pEmi summary').click();
  const rows = page.locator('#emiRows tr');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('3 মাস');
  await expect(rows.nth(0)).toContainText('3,834');            // ceil(11500/3)
  await expect(rows.nth(1)).toContainText('1,917');            // ceil(11500/6)
  await expect(rows.nth(2)).toContainText('1,016');            // ceil(11500*1.06/12)
  await page.goto('/product.html?id=5');                       // ৳800
  await expect(page.locator('#pEmi')).toBeHidden();
});

test('চেকআউট ড্রাফট: লিখে রাখা তথ্য রিলোডে ফেরে, অর্ডারের পর মুছে যায়', async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('hc_cart')) localStorage.setItem('hc_cart', JSON.stringify([{ key: '1|0', id: 1, name: 'X', label: '', img: '', regular: 100, sale: 90, qty: 1 }])); });
  await page.goto('/checkout.html');
  await page.locator('[name=name]').fill('রাকিব হাসান');
  await page.locator('[name=phone]').fill('01712345678');
  await page.locator('[name=address]').fill('মিরপুর ১০, ঢাকা');
  await page.reload();
  await expect(page.locator('[name=name]')).toHaveValue('রাকিব হাসান');
  await expect(page.locator('[name=phone]')).toHaveValue('01712345678');
  await expect(page.locator('[name=address]')).toHaveValue('মিরপুর ১০, ঢাকা');
  await page.locator('.place-order').click();
  await expect(page).toHaveURL(/order-received/);
  expect(await page.evaluate(() => localStorage.getItem('hc_draft'))).toBe('null');
});

test('ফেলে যাওয়া কার্ট রিমাইন্ডার: পুরোনো কার্ডে ব্যানার, বন্ধ করলে আর আসে না', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('seed')) { sessionStorage.setItem('seed', '1');
      localStorage.setItem('hc_cart', JSON.stringify([{ key: '1|0', id: 1, name: 'X', label: '', img: '', regular: 100, sale: 90, qty: 2 }]));
      localStorage.setItem('hc_cart_ts', String(Date.now() - 2 * 3600 * 1000)); }
  });
  await page.goto('/shop.html');
  const bar = page.locator('.remind-bar');
  await expect(bar).toBeVisible();
  await expect(bar).toContainText('2টি');
  await bar.locator('.remind-x').click();
  await expect(bar).toHaveCount(0);
  await page.goto('/index.html');
  await expect(page.locator('.remind-bar')).toHaveCount(0);
});

test('তাজা কার্টে (এইমাত্র যোগ) রিমাইন্ডার আসে না', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#secTrending .product-card[data-id="1"] .btn-add').click();
  await page.goto('/shop.html');
  await expect(page.locator('.remind-bar')).toHaveCount(0);
});

test('স্টক আউট: "স্টকে এলে জানান" ফোন সেভ করে, রিলোডে মনে রাখে', async ({ page }) => {
  await page.goto('/product.html?id=12');
  await expect(page.locator('#pNotify')).toBeVisible();
  await expect(page.locator('#pDeliv')).toBeHidden();
  await page.locator('#notifyForm [name=phone]').fill('123');
  await page.locator('#notifyForm button').click();
  await expect(page.locator('#notifyOk')).toBeHidden();         // ভুল নাম্বার
  await page.locator('#notifyForm [name=phone]').fill('01712345678');
  await page.locator('#notifyForm button').click();
  await expect(page.locator('#notifyOk')).toContainText('01712345678');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hc_notify'))[0].id)).toBe(12);
  await page.reload();
  await expect(page.locator('#notifyOk')).toContainText('01712345678');
  await page.goto('/product.html?id=1');
  await expect(page.locator('#pNotify')).toBeHidden();
});
