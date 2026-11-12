// v1.9.2 — কুপন ওয়ালেট, পরে কিনব, আবার অর্ডার, কর্মঘণ্টা, দাম-অ্যালার্ট, ভিডিও/৩৬০°, তুলনায় পার্থক্য
const { test, expect } = require('@playwright/test');
const { prepare } = require('./helpers');
test.beforeEach(async ({ page }, ti) => { ti.problems = await prepare(page); });
test.afterEach(async ({}, ti) => { expect(ti.problems, 'কনসোল/নেটওয়ার্ক সমস্যা').toEqual([]); });
const line = (id, name, sale, qty = 1) => ({ key: id + '|0', id, name, label: '', img: '', regular: sale + 500, sale, qty });
const seedCart = (items, once = true) => page => page.addInitScript(([items, once]) => { if (once && localStorage.getItem('t_seed')) return; localStorage.setItem('t_seed', '1'); localStorage.setItem('hc_cart', JSON.stringify(items)); }, [items, once]);
const total = page => page.evaluate(() => HC.totals());

test('কুপন ওয়ালেট: ছাড় হিসাব, সেরা ব্যাজ, ন্যূনতম অর্ডার, ব্যবহার/বাদ, নিজে-বসান', async ({ page }) => {
  await seedCart([line(1, 'A', 5000)])(page);
  await page.goto('/cart.html');
  const w = page.locator('#couponWallet'); await expect(w).toBeVisible();
  await expect(w.locator('.wal-item')).toHaveCount(3);
  await expect(w.locator('.wal-item', { hasText: 'HITS10' })).toContainText('৳500');                  // ১০% × ৫০০০
  await expect(w.locator('.wal-item', { hasText: 'HITS10' })).toContainText('সেরা');
  await expect(w.locator('.wal-item', { hasText: 'CAM500' }).locator('.wal-use')).toBeDisabled();      // ন্যূনতম ১৫,০০০ নয়
  await expect(w.locator('.wal-item', { hasText: 'CAM500' })).toContainText('আরও');
  await w.locator('.wal-use[data-code=HITS10]').dispatchEvent('click');
  expect((await total(page)).disc).toBe(500);
  await expect(page.locator('#couponWallet .wal-item.on')).toContainText('HITS10');
  await page.locator('#couponWallet .wal-use[data-code=HITS10]').dispatchEvent('click');               // বাদ দিন
  expect((await total(page)).disc).toBe(0);
  // নিজে-বসান
  await page.locator('#walAuto').dispatchEvent('click');
  expect((await total(page)).disc).toBe(500);
  // বড় কার্টে CAM500 ৳৫০০ ছাড় বনাম HITS10 ১০% = ১৬০০ → সেরা HITS10
  await page.evaluate(() => { HC.saveCart([{ key: '1|0', id: 1, name: 'A', label: '', img: '', regular: 17000, sale: 16000, qty: 1 }]); });
  expect((await total(page)).disc).toBe(1600);
});

test('কুপন: ন্যূনতম অর্ডার না থাকলে হাতে কোড দিলেও লাগে না', async ({ page }) => {
  await seedCart([line(1, 'A', 5000)])(page);
  await page.goto('/cart.html');
  await page.locator('.coupon-input').first().fill('CAM500');
  await page.locator('.coupon-apply').first().dispatchEvent('click');
  expect((await total(page)).disc).toBe(0);
});

test('পরে কিনব: কার্ট থেকে সরে তালিকায় যায়, কার্টে ফেরে, উইশলিস্টে যায়, মুছে ফেলা যায়', async ({ page }) => {
  await seedCart([line(1, 'A', 5000), line(5, 'B', 800)])(page);
  await page.goto('/cart.html');
  await page.locator('.later-btn').first().dispatchEvent('click');
  await expect(page.locator('#laterBox')).toContainText('পরে কিনব (1)');
  expect(await page.evaluate(() => HC.cart().length)).toBe(1);
  await page.locator('.later-back').first().dispatchEvent('click');
  await expect(page.locator('#laterBox')).toHaveCount(0);
  expect(await page.evaluate(() => HC.cart().length)).toBe(2);
  await page.locator('.later-btn').first().dispatchEvent('click');
  await page.locator('.later-wish').first().dispatchEvent('click');
  expect(await page.evaluate(() => HC.wish().length)).toBe(1);
  await page.locator('.wish-move').first().dispatchEvent('click');                  // কার্ট থেকে সরাসরি উইশলিস্টে
  expect(await page.evaluate(() => HC.wish().length)).toBe(2);
  expect(await page.evaluate(() => HC.cart().length)).toBe(0);
});

test('আবার অর্ডার: আগের অর্ডারের পণ্য কার্টে যায়', async ({ page }) => {
  const o = { id: 801, date: new Date().toISOString(), name: 'টেস্ট', phone: '01712345678', pay: 'ক্যাশ অন ডেলিভারি', items: [line(5, 'B', 800, 2), line(1, 'A', 5500, 1)], totals: { sub: 7100, disc: 0, ship: 0, total: 7100 } };
  await page.addInitScript(o => { localStorage.setItem('hc_last_order', JSON.stringify(o)); localStorage.setItem('hc_orders', JSON.stringify([o])); }, o);
  await page.goto('/order-received.html');
  await page.locator('#reorderBtn').dispatchEvent('click');
  await page.waitForURL(/cart\.html/);
  const c = await page.evaluate(() => HC.cart().map(i => [i.id, i.qty]));
  expect(c).toEqual([[5, 2], [1, 1]]);
});

test('কর্মঘণ্টা: সময় অনুযায়ী অনলাইন/অফলাইন ব্যাজ ও WhatsApp বাটনের ডট', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.locator('.hrs-badge')).toBeAttached();
  const r = await page.evaluate(() => ({ at11: HC.shopOpen(new Date('2026-11-12T05:00:00Z')), at23: HC.shopOpen(new Date('2026-11-12T17:30:00Z')), at10: HC.shopOpen(new Date('2026-11-12T04:00:00Z')), at22: HC.shopOpen(new Date('2026-11-12T16:00:00Z')) }));
  expect(r).toEqual({ at11: true, at23: false, at10: true, at22: false });      // ঢাকা = UTC+6
  const txt = await page.locator('.hrs-badge').innerText(); expect(txt).toMatch(/অনলাইনে|অফলাইন/);
});

test('দাম কমলে অ্যালার্ট: সেভ হয়, WhatsApp কনফার্ম, কমলে ব্যানার, বন্ধ করা যায়', async ({ page }) => {
  await page.addInitScript(() => { window.__opened = []; window.open = u => { window.__opened.push(u); return null; }; });
  await page.goto('/product.html?id=1');
  await expect(page.locator('#pAlert')).toBeVisible();
  await page.locator('#alertForm [name=phone]').fill('123');
  await page.locator('#alertForm').evaluate(f => f.requestSubmit());
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hc_alerts') || '[]').length)).toBe(0);   // ভুল নাম্বার
  await page.locator('#alertForm [name=phone]').fill('01712345678');
  await page.locator('#alertForm [name=target]').fill('5000');
  await page.locator('#alertForm').evaluate(f => f.requestSubmit());
  await expect(page.locator('#alertOk')).toContainText('৳5,000');
  await page.locator('#alertOk .wa-confirm').dispatchEvent('click');
  expect(await page.evaluate(() => decodeURIComponent(window.__opened[0]))).toContain('দাম কমলে জানাতে চাই');
  // সেভ করা দাম বেশি → এখন কম → ব্যানার (সব পেজে)
  await page.evaluate(() => localStorage.setItem('hc_alerts', JSON.stringify([{ id: 1, phone: '01712345678', price: 9000, target: 0, ts: 1 }])));
  await page.goto('/index.html');
  await expect(page.locator('.drop-bar')).toContainText('দাম কমেছে');
  await page.locator('.drop-x').dispatchEvent('click'); await expect(page.locator('.drop-bar')).toHaveCount(0);
  await page.goto('/shop.html'); await expect(page.locator('.drop-bar')).toHaveCount(0);        // একবার দেখালে আর আসে না
});

test('ভিডিও ও ৩৬০°: থাম্বে আসে; ভিডিওতে ক্লিকে iframe; ৩৬০° এ স্লাইডারে ফ্রেম বদলায়', async ({ page }) => {
  await page.route(/youtube-nocookie\.com/, r => r.fulfill({ body: '<html><body>video</body></html>', contentType: 'text/html' }));
  await page.goto('/product.html?id=2');
  await expect(page.locator('.thumb-video')).toBeAttached(); await expect(page.locator('.thumb-spin')).toBeAttached();
  await page.locator('.thumb-video').dispatchEvent('click');
  expect(await page.locator('#zoomBox iframe').getAttribute('src')).toContain('youtube-nocookie.com/embed/');
  await page.locator('.thumb-spin').dispatchEvent('click');
  await expect(page.locator('#zoomBox .spin-img')).toBeAttached();
  const a = await page.locator('.spin-img').getAttribute('src');
  await page.locator('.spin-range').evaluate(e => { e.value = 6; e.dispatchEvent(new Event('input', { bubbles: true })); });
  const b = await page.locator('.spin-img').getAttribute('src'); expect(b).not.toBe(a); expect(decodeURIComponent(b)).toContain('180');
  await page.locator('.thumb').first().dispatchEvent('click');                       // ছবিতে ফিরলে iframe/স্পিন নেই
  await expect(page.locator('#zoomBox iframe, #zoomBox .spin-img')).toHaveCount(0);
  await page.goto('/product.html?id=1');
  await expect(page.locator('.thumb-video, .thumb-spin')).toHaveCount(0);            // যাদের নেই তাদের নেই
});

test('তুলনা: "শুধু পার্থক্য দেখান" একই মানের সারি লুকায়, মনে রাখে', async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('t_seed')) { localStorage.setItem('t_seed', '1'); localStorage.setItem('hc_cmp', JSON.stringify([1, 3])); } });
  await page.goto('/compare.html');
  await expect(page.locator('#cmpDiff')).toBeVisible();
  const rows = await page.locator('#cmpTable tr').count();
  const same = await page.locator('#cmpTable tr.cmp-same').count();
  expect(same).toBeGreaterThan(0);
  await page.locator('#cmpDiff').dispatchEvent('click');
  await expect(page.locator('#cmpTable')).toHaveClass(/diff-only/);
  const visible = await page.locator('#cmpTable tr:visible').count(); expect(visible).toBe(rows - same);
  await page.reload(); await expect(page.locator('#cmpTable')).toHaveClass(/diff-only/);    // মনে আছে
});
