// প্রতিটি পেজ প্রতিটি ব্রাউজার/ডিভাইসে: ক্লিন লোড, কোনো JS/কনসোল এরর নেই, অনুভূমিক ওভারফ্লো নেই।
const { test, expect } = require('@playwright/test');
const { prepare } = require('./helpers');

const PAGES = [
  'index.html', 'shop.html', 'shop.html?q=cam', 'category.html?cat=security',
  'product.html?id=1',   // simple
  'product.html?id=2',   // variable
  'product.html?id=3',   // grouped
  'product.html?id=4',   // external / affiliate
  'product.html?id=12',  // স্টক আউট
  'cart.html', 'checkout.html', 'order-received.html', 'track-order.html', 'login.html',
  'terms.html', 'returns.html', 'shipping.html', 'contact.html', 'faq.html', 'minicart.html',
  'device-compatibility.html', 'social-compatibility.html',
];

for (const url of PAGES) {
  test(`লোড ও লেআউট: ${url}`, async ({ page }, testInfo) => {
    const problems = await prepare(page);
    await page.goto('/' + url);
    await expect(page.locator('.site-header')).toBeVisible();
    await expect(page.locator('footer.site-footer')).toBeAttached();
    await page.waitForLoadState('networkidle');
    expect(await page.title(), 'পেজের <title> থাকতে হবে').toBeTruthy();

    // অনুভূমিক ওভারফ্লো (মোবাইলে সবচেয়ে সাধারণ ভাঙন)
    const ov = await page.evaluate(() => {
      const de = document.documentElement, vw = de.clientWidth;
      const offenders = [...document.querySelectorAll('body *')].filter(e => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.right > vw + 1 && getComputedStyle(e).position !== 'fixed' &&
          !e.closest('.owl-carousel,.m-slider,.offcanvas,.modal,.nav,.table-responsive,.submenu,.buybar,.float-stack,.toast-wrap,.sugg,.mobile-dock');
      }).slice(0, 5).map(e => e.tagName.toLowerCase() + (e.className && e.className.baseVal === undefined ? '.' + String(e.className).trim().split(/\s+/).join('.') : ''));
      return { sw: de.scrollWidth, vw, offenders };
    });
    expect(ov.sw, `অনুভূমিক স্ক্রল (${ov.sw}px > ${ov.vw}px)। সম্ভাব্য কারণ: ${ov.offenders.join(' | ')}`).toBeLessThanOrEqual(ov.vw + 1);

    expect(problems, 'কনসোল/নেটওয়ার্ক সমস্যা').toEqual([]);
    // স্ক্রিনশট শুধু রিপোর্টের জন্য — এটি ব্যর্থ হলেও লেআউট টেস্ট ফেইল করবে না।
    // scale:'css' → ডিভাইস পিক্সেল রেশিও (iPhone এ ৩x) গুণ হয় না; WebKit এর ৩২৭৬৭px সীমা এড়ায়।
    try {
      await testInfo.attach('screenshot', { body: await page.screenshot({ fullPage: true, type: 'jpeg', quality: 55, scale: 'css' }), contentType: 'image/jpeg' });
    } catch (e) {
      await testInfo.attach('screenshot-viewport', { body: await page.screenshot({ type: 'jpeg', quality: 55, scale: 'css' }), contentType: 'image/jpeg' });
      await testInfo.attach('screenshot-note', { body: `ফুল-পেজ স্ক্রিনশট সম্ভব হয়নি: ${e.message}`, contentType: 'text/plain' });
    }
  });
}
