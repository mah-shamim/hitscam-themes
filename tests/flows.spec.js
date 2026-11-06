// ইউজার ফ্লো ও রেসপন্সিভ আচরণ — প্রতিটি ব্রাউজার/ডিভাইস প্রজেক্টে চলে।
const { test, expect } = require('@playwright/test');
const { prepare } = require('./helpers');

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const card = (page, id) => page.locator(`#secTrending .product-card[data-id="${id}"]`);
const vw = page => page.viewportSize().width;
const phone = '01712345678';
// <576px এ হেডারের কার্ট আইকন লুকানো (নিচের ডকে আছে) → যেটা দৃশ্যমান সেটাই ব্যবহার
const cartCount = page => page.locator('.cart-count:visible').first();
const cartBtn = page => page.locator('[data-bs-target="#miniCart"]:visible').first();

test.beforeEach(async ({ page }, ti) => { ti.problems = await prepare(page); });
test.afterEach(async ({}, ti) => { expect(ti.problems, 'কনসোল/নেটওয়ার্ক সমস্যা').toEqual([]); });

async function addFirstToCart(page) {
  await page.goto('/index.html');
  await card(page, 1).locator('.btn-add').click();
  await expect(cartCount(page)).toHaveText('1');
}

test('Variable কার্ড (রং × কানেকশন): সোয়াচ + রেডিও, লোয়েস্ট সিলেক্টেড, দাম ও কার্ট লেবেল মেলে', async ({ page }) => {
  await page.goto('/index.html');
  const v = card(page, 2), sw = v.locator('.swatch input'), conn = v.locator('.attr-radio[data-key=conn]');
  await expect(sw).toHaveCount(4);
  await expect(conn).toHaveCount(4);
  expect(await v.locator('.attr-radio').evaluateAll(els => new Set(els.map(e => e.name)).size), 'রং ও কানেকশন = ২ গ্রুপ').toBe(2);
  await expect(v.locator('.swatch input[value="কালো"]')).toBeChecked();
  await expect(v.locator('.attr-radio[value="শুধু WiFi"]')).toBeChecked();   // সবচেয়ে কম দাম
  await expect(v.locator('.pc-price')).toContainText('11,500');
  await v.locator('.swatch input[value="আর্মি গ্রিন"]').check();               // রং অনুযায়ী +৳200
  await expect(v.locator('.pc-price')).toContainText('11,700');
  await expect(v.locator('.attr-cur')).toHaveText('আর্মি গ্রিন');
  await v.locator('.attr-radio[value="শুধু SIM"]').check();
  await expect(v.locator('.pc-price')).toContainText('12,100');
  await v.locator('.swatch input[value="সাদা"]').check();                      // সাদা + শুধু SIM নেই → সবচেয়ে কম দামের সাদা
  await expect(v.locator('.attr-radio[value="শুধু WiFi"]')).toBeChecked();
  await expect(v.locator('.pc-price')).toContainText('11,500');
  await expect(v.locator('.attr-radio[value="শুধু SIM"]').locator('xpath=ancestor::label')).toHaveClass(/na/);
  const rows = await v.locator('.pc-group label').evaluateAll(l => new Set(l.map(x => Math.round(x.getBoundingClientRect().top))).size);
  expect(rows, '৪টি কানেকশন ২ সারিতে (২×২)').toBe(2);
  await v.locator('.btn-add').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hc_cart'))[0].label)).toBe('সাদা / শুধু WiFi');
});

test('Grouped কার্ড: রেডিও এক গ্রুপে, লোয়েস্ট দাম সিলেক্টেড', async ({ page }) => {
  await page.goto('/index.html');
  const g = card(page, 3).locator('.opt-radio');
  await expect(g.nth(1)).toBeChecked();                            // ডোর সেন্সর ৳650
  await g.nth(0).check();
  await expect(g.nth(1)).not.toBeChecked();
  expect(await g.evaluateAll(els => els.filter(e => e.checked).length)).toBe(1);
});

test('অ্যাড টু কার্ট → ভিউ কার্ট বাটন, মিনি কার্ট ড্রয়ার', async ({ page }) => {
  await page.goto('/index.html');
  const c = card(page, 1);
  await expect(c.locator('.btn-view')).toBeHidden();
  await c.locator('.btn-add').click();
  await expect(c.locator('.btn-view')).toBeVisible();
  const [a, v, o] = await Promise.all(['.btn-add', '.btn-view', '.btn-order'].map(s => c.locator(s).boundingBox()));
  expect(Math.abs(a.y - v.y), 'অ্যাড ও ভিউ কার্ট এক সারিতে').toBeLessThanOrEqual(2);
  expect(o.y, 'অর্ডার নাউ নিচের সারিতে').toBeGreaterThan(a.y + a.height - 2);
  await expect(cartCount(page)).toHaveText('1');
  await cartBtn(page).click();
  await expect(page.locator('#miniCart')).toBeVisible();
  await expect(page.locator('#miniCartBody')).toContainText('4G PTZ');
});

test('অর্ডার নাউ → মোডাল → ভ্যালিডেশন → COD অর্ডার → রিকনফার্ম + SMS', async ({ page }) => {
  await page.goto('/index.html');
  await card(page, 1).locator('.btn-order').click();
  const modal = page.locator('#orderModal');
  await expect(modal).toBeVisible();
  const [d, s] = await Promise.all([modal.getByText('Your details').boundingBox(), modal.getByText('Order Summary').boundingBox()]);
  if (vw(page) >= 992) expect(Math.abs(d.y - s.y), 'ডেস্কটপে দুই কলাম').toBeLessThanOrEqual(4); else expect(s.y, 'মোবাইলে স্ট্যাক').toBeGreaterThan(d.y);

  await modal.locator('.place-order').click();                       // খালি ফর্ম
  await expect(modal.locator('.is-invalid').first()).toBeVisible();
  expect(page.url()).not.toContain('order-received');

  await modal.locator('[name=name]').fill('রাকিব হাসান');
  await modal.locator('[name=address]').fill('গাজীপুর সদর, গাজীপুর');
  await modal.locator('[name=phone]').fill(phone);
  await modal.locator('.place-order').click();
  await page.waitForURL(/order-received/);
  await expect(page.locator('#oId')).toContainText('#');
  await expect(page.locator('#smsPhone')).toHaveText(phone);
  await page.locator('#reconfirmBtn').click();
  await expect(page.locator('#statusPill')).toHaveText('Confirmed');
  await expect(page.locator('#smsThread .sms-bubble')).toHaveCount(2);
});

test('বিকাশ: TrxID বাধ্যতামূলক + স্লিপ আপলোড → অর্ডার পেজে দেখায়', async ({ page }) => {
  await addFirstToCart(page);
  await page.goto('/checkout.html');
  await page.locator('[name=name]').fill('রাকিব হাসান');
  await page.locator('[name=address]').fill('গাজীপুর সদর');
  await page.locator('[name=phone]').fill(phone);
  await expect(page.locator('#payExtra')).toBeHidden();
  await page.locator('input[name=pay][value="বিকাশ"]').check();
  await expect(page.locator('#payExtra')).toBeVisible();
  await page.locator('.place-order').click();
  await expect(page.locator('[name=txn]')).toHaveClass(/is-invalid/);
  await page.locator('[name=txn]').fill('abcd1234xy');
  await page.locator('[name=slip]').setInputFiles({ name: 'slip.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.locator('#slipPreview img')).toBeVisible();
  await page.locator('.place-order').click();
  await page.waitForURL(/order-received/);
  await expect(page.locator('#oTxn')).toHaveText('ABCD1234XY');
  await expect(page.locator('#oSlip')).toContainText('slip.png');
});

test('ডার্ক মোড টগল ও রিলোডে সংরক্ষণ', async ({ page }) => {
  await page.goto('/index.html');
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const light = await bg();
  await page.locator('#themeBtn').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect.poll(bg, { message: 'ডার্ক মোডে ব্যাকগ্রাউন্ড বদলায় (ট্রানজিশন শেষে)' }).not.toBe(light);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('লাইভ সার্চ সাজেশন', async ({ page }) => {
  await page.goto('/index.html');
  const input = page.locator('.search-box input[name=q]:visible').first();
  await input.pressSequentially('solar');
  await expect(page.locator('.sugg .sugg-item').first()).toBeVisible();
  await page.locator('.sugg .sugg-item').first().click();
  await page.waitForURL(/product\.html\?id=/);
});

test('রেসপন্সিভ: কার্ড গ্রিড কলাম ও মোবাইল ডক', async ({ page }) => {
  await page.goto('/index.html');
  const b = await Promise.all([1, 2, 3].map(i => card(page, i).boundingBox()));
  const w = vw(page);
  if (w < 576) expect(b[1].y, 'মোবাইলে এক কলাম').toBeGreaterThan(b[0].y + 50);
  else if (w >= 992) { expect(Math.abs(b[0].y - b[1].y)).toBeLessThanOrEqual(2); expect(Math.abs(b[0].y - b[2].y), 'ডেস্কটপে ৪ কলাম').toBeLessThanOrEqual(2); }
  else { expect(Math.abs(b[0].y - b[1].y), 'ট্যাবলেটে একই সারিতে ২+').toBeLessThanOrEqual(2); }
  if (w < 768) await expect(page.locator('.mobile-dock')).toBeVisible(); else await expect(page.locator('.mobile-dock')).toBeHidden();
  await expect(page.locator('#waChat')).toBeVisible();
});

test('"সব প্রোডাক্ট" সাব মেনু', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('.sub-toggle').click();
  await expect(page.locator('#navSub')).toBeVisible();
  await expect(page.locator('#navSub .sub-item')).toHaveCount(9);
  await page.locator('#navSub .sub-item').first().click();
  await page.waitForURL(/category\.html\?cat=/);
});

test('উইশলিস্ট ড্রয়ার', async ({ page }) => {
  await page.goto('/index.html');
  await card(page, 1).locator('.wish').click();
  await expect(page.locator('.header-icons .wish-count')).toHaveText('1');
  await page.locator('.header-icons [data-bs-target="#miniWish"]').click();
  await expect(page.locator('#miniWish')).toBeVisible();
  await expect(page.locator('#miniWishBody .cart-line')).toHaveCount(1);
});

test('অর্ডার ট্র্যাক: টাইমলাইন ডেস্কটপে অনুভূমিক, মোবাইলে উল্লম্ব', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hc_last_order', JSON.stringify({ id: 538, date: '2026-10-31T10:00:00Z', name: 'MD ARIFUL HAQUE', phone: '01712345678', pay: 'ক্যাশ অন ডেলিভারি',
    items: [{ name: '4 Lens Solar Camera', img: '', regular: 14500, sale: 12900, qty: 2, label: '' }], totals: { sub: 25800, disc: 0, ship: 0, total: 25800 } })));
  await page.goto('/track-order.html');
  await page.locator('[name=orderId]').fill('538');
  await page.locator('[name=phone]').fill(phone);
  await page.locator('#trackForm button').click();
  await expect(page.locator('#tId')).toHaveText('#538');
  await expect(page.locator('#tLine li')).toHaveCount(5);
  // পেজ ফলাফলে স্ক্রল করে → দুই এলিমেন্ট একই মুহূর্তে মাপতে হয় (আলাদা boundingBox() কলে ফ্ল্যাকি)
  const [a, b] = await page.locator('#tLine').evaluate(ul => [...ul.children].slice(0, 2).map(li => { const r = li.getBoundingClientRect(); return { x: r.left, y: r.top }; }));
  if (vw(page) >= 768) { expect(Math.abs(a.y - b.y), 'বাম→ডান (একই সারি)').toBeLessThanOrEqual(2); expect(b.x, 'বাম→ডান').toBeGreaterThan(a.x + 40); }
  else expect(b.y, 'ওপর→নিচ').toBeGreaterThan(a.y + 20);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
  expect(sw, 'ট্র্যাক পেজে অনুভূমিক স্ক্রল নেই').toBe(true);
});

test('প্রোডাক্ট পেজ: কোয়ান্টিটি পুরো প্রস্থ, গোল বাটন পাশাপাশি, মোবাইলে স্টিকি বার', async ({ page }) => {
  await page.goto('/product.html?id=1');
  const [wrap, q, add, ord] = await Promise.all(['#pBuy', '#pQtyWrap', '.p-add', '.p-order'].map(s => page.locator(s).boundingBox()));
  expect(q.width / wrap.width, 'কোয়ান্টিটি পুরো এরিয়া জুড়ে').toBeGreaterThan(0.95);
  expect(Math.abs(add.y - ord.y), 'বাটন পাশাপাশি').toBeLessThanOrEqual(2);
  if (vw(page) < 768) {
    await page.locator('#related').scrollIntoViewIfNeeded();
    await expect(page.locator('#buyBar')).toHaveClass(/show/);
    await page.locator('#bbBtn').click();
    await expect(page.locator('#orderModal')).toBeVisible();
  } else await expect(page.locator('#buyBar')).toBeHidden();
});

test('ইন-অ্যাপ ব্রাউজার: localStorage ব্লক থাকলেও কার্ড/কার্ট কাজ করে', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('denied', 'SecurityError'); } }));
  await page.goto('/index.html');
  await card(page, 1).locator('.btn-add').click();
  await expect(cartCount(page)).toHaveText('1');
  await page.goto('/product.html?id=2');                         // রিভিউ লোডও ক্র্যাশ করবে না
  await expect(page.locator('#reviewList .review-item').first()).toBeVisible();
});

test.describe('সোশ্যাল ইন-অ্যাপ ব্রাউজার ডিটেকশন', () => {
  const UAS = {
    Facebook: 'Mozilla/5.0 (Linux; Android 13; Pixel 7 Build/TQ3A) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/450.0.0.0;]',
    Instagram: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21A329 Instagram 300.0.0.0',
    WhatsApp: 'WhatsApp/2.23.20.0 Mozilla/5.0 (Linux; Android 13) Chrome/120.0.0.0 Mobile Safari/537.36',
  };
  for (const [app, userAgent] of Object.entries(UAS)) {
    test.describe(app, () => {
      test.use({ userAgent });
      test(`${app} ডিটেক্ট হয়`, async ({ page }) => {
        await page.goto('/social-compatibility.html');
        await expect(page.locator('#env')).toContainText(app);
      });
    });
  }
});

test('হেডারে সব আইকন (থিম, উইশ, কার্ট, ট্র্যাক, ইউজার) সব স্ক্রিনে দেখা যায়, ওভারফ্লো নেই', async ({ page }) => {
  for (const url of ['/index.html', '/login.html']) {
    await page.goto(url);
    for (const sel of ['#themeBtn', '[data-bs-target="#miniWish"]', '.header-icons [data-bs-target="#miniCart"]', '.header-icons a[href="track-order.html"]', '.header-icons a[href="login.html"]'])
      await expect(page.locator(sel), `${url} ${sel}`).toBeVisible();
    const r = await page.evaluate(() => { const h = document.querySelector('.header-icons').getBoundingClientRect(); return { right: h.right, w: document.documentElement.clientWidth, sw: document.documentElement.scrollWidth }; });
    expect(r.right, 'আইকন স্ক্রিনের বাইরে').toBeLessThanOrEqual(r.w + 0.5);
    expect(r.sw).toBeLessThanOrEqual(r.w);
  }
});

test('Featured categories: সব কার্ড একই সাইজ', async ({ page }) => {
  await page.goto('/index.html');
  const hs = await page.locator('#featCats .cat-card').evaluateAll(els => els.map(e => [Math.round(e.getBoundingClientRect().height), Math.round(e.getBoundingClientRect().width)]));
  expect(hs.length).toBeGreaterThan(3);
  expect(new Set(hs.map(x => x[0])).size, 'কার্ডের উচ্চতা ভিন্ন: ' + JSON.stringify(hs)).toBe(1);
  expect(new Set(hs.map(x => x[1])).size, 'কার্ডের প্রস্থ ভিন্ন').toBe(1);
});

test('প্রোডাক্ট পেজ: ট্রাস্ট ব্যাজ পুরো প্রস্থে, স্টিকি বারে একটাই দাম', async ({ page }) => {
  await page.goto('/product.html?id=2');
  const t = await page.locator('.trust-row').boundingBox(), c = await page.locator('main .container, .container').first().boundingBox();
  expect(t.x, 'ট্রাস্ট রো ডানে সরে আছে').toBeLessThan(c.x + 40);
  if (vw(page) < 768) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await expect(page.locator('#buyBar')).toHaveClass(/show/);
    const txt = await page.locator('#bbPrice').innerText();
    expect((txt.match(/৳/g) || []).length, 'স্টিকি বারে একাধিক দাম: ' + txt).toBe(1);
  }
});

test('কুইক ভিউ: খোলে, অপশন বদলালে দাম বদলায়, কার্টে যোগ হয়', async ({ page }) => {
  await page.goto('/index.html');
  const c = card(page, 2);
  await c.locator('.qv-btn').dispatchEvent('click');
  const m = page.locator('#qvModal');
  await expect(m).toBeVisible();
  await expect(m.locator('#qvTitle')).toContainText('Solar');
  await m.locator('.attr-radio[value="4G SIM + 128GB কার্ড"]').check();
  await expect(m.locator('#qvPrice')).toContainText('14,200');
  await m.locator('.qv-q[data-d="1"]').click();
  await m.locator('#qvAdd').click();
  await expect(m).toBeHidden();
  await expect(cartCount(page)).toHaveText('2');
});

test('তুলনা: সর্বোচ্চ ৩টি, বার দেখায়, compare পেজে টেবিল ও সরানো', async ({ page }) => {
  await page.goto('/index.html');
  const btn = id => card(page, id).locator('.cmp-btn');
  const ids = await page.locator('#secTrending .product-card').evaluateAll(els => els.map(e => +e.dataset.id));
  expect(ids.length).toBeGreaterThanOrEqual(4);
  for (const id of ids.slice(0, 3)) await btn(id).dispatchEvent('click');
  await expect(page.locator('#cmpBar')).toHaveClass(/show/);
  await btn(ids[3]).dispatchEvent('click');                       // ৪র্থটা যোগ হবে না
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hc_cmp')).length)).toBe(3);
  await page.locator('#cmpBar a').click();
  await expect(page).toHaveURL(/compare\.html/);
  await expect(page.locator('#cmpTable th[scope=row]').first()).toBeVisible();
  await expect(page.locator('#cmpTable .cmp-rm')).toHaveCount(3);
  await page.locator('.cmp-rm').first().click();
  await expect(page.locator('#cmpTable .cmp-rm')).toHaveCount(2);
});

test('প্রোডাক্ট পেজ: রং/কানেকশন বদলালে দাম, স্টিকি বার ও কার্ট লেবেল বদলায়', async ({ page }) => {
  await page.goto('/product.html?id=2');
  await expect(page.locator('#pPrice')).toContainText('11,500');
  await page.locator('#pOptions .swatch input[value="ধূসর"]').check();
  await page.locator('#pOptions .attr-radio[value="শুধু SIM"]').check();
  await expect(page.locator('#pPrice')).toContainText('12,000');                // 11,900 + 100
  await expect(page.locator('#pOptions .attr-cur')).toHaveText('ধূসর');
  await page.locator('.p-add').first().click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hc_cart'))[0].label)).toBe('ধূসর / শুধু SIM');
});
