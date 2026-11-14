// v1.10.2 — axe-core অ্যাক্সেসিবিলিটি অডিট (WCAG 2 A/AA): critical ও serious সমস্যা থাকলে ফেইল।
// শুধু Chromium প্রজেক্টে চলে (axe ব্রাউজার-নিরপেক্ষ; বাকিতে সময় নষ্ট)।
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { prepare } = require('./helpers');

const CART = [{ key: '1|0', id: 1, name: '4G PTZ Camera', label: '', img: 'https://placehold.co/600x600', regular: 6500, sale: 5500, qty: 1 }];
const PAGES = [
  ['/index.html'], ['/shop.html'], ['/product.html?id=2'], ['/product.html?id=5'], ['/cart.html', true], ['/checkout.html', true], ['/compare.html'],
  ['/help.html'], ['/rma.html'], ['/stores.html'], ['/track-order.html'], ['/login.html'], ['/faq.html'], ['/finder.html'], ['/bundles.html'], ['/warranty.html'], ['/dealer.html'], ['/admin.html'],
];
// জানা ও নথিভুক্ত ব্যতিক্রম: কিছু নেই (নতুন ব্যতিক্রম যোগ করলে কারণসহ এখানে লিখুন)
const DISABLED = [];

test.describe('axe অ্যাক্সেসিবিলিটি', () => {
  test.beforeEach(({}, ti) => { test.skip(ti.project.name !== 'chromium', 'শুধু Chromium এ'); });
  for (const [url, seeded] of PAGES) {
    test(`কোনো critical/serious নেই: ${url}`, async ({ page }) => {
      await prepare(page);
      if (seeded) await page.addInitScript(c => localStorage.setItem('hc_cart', JSON.stringify(c)), CART);
      await page.goto(url); await page.waitForTimeout(700);                    // JS রেন্ডার ও অ্যানিমেশন
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).disableRules(DISABLED).analyze();
      const bad = r.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
      expect(bad.map(v => `${v.id} (${v.impact}): ${v.nodes.length} টি — ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`), url).toEqual([]);
    });
  }
});
