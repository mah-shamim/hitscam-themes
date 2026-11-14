// v1.10.2 — ভিজ্যুয়াল রিগ্রেশন (স্ক্রিনশট তুলনা)। ডিফল্টে বন্ধ; চালাতে: VISUAL=1 npx playwright test tests/visual.spec.js
// বেসলাইন প্রথমবার/ইচ্ছাকৃত ডিজাইন বদলের পরে তৈরি: VISUAL=1 npx playwright test tests/visual.spec.js --update-snapshots
// ⚠ ফন্ট/OS ভেদে পিক্সেল আলাদা হয় — বেসলাইন সবসময় CI রানার (GitHub Actions "visual" জব, update_visual=true) থেকে বানান, নিজের পিসি থেকে নয়।
const { test, expect } = require('@playwright/test');
const { prepare } = require('./helpers');

const CART = [{ key: '1|0', id: 1, name: '4G PTZ Camera', label: '', img: 'https://placehold.co/600x600', regular: 6500, sale: 5500, qty: 1 }];
const PAGES = [['shop', '/shop.html'], ['product-variable', '/product.html?id=2'], ['cart', '/cart.html', true], ['checkout', '/checkout.html', true], ['help', '/help.html'], ['stores', '/stores.html'], ['rma', '/rma.html'], ['compare', '/compare.html']];

test.describe('ভিজ্যুয়াল রিগ্রেশন', () => {
  test.beforeEach(({}, ti) => { test.skip(!process.env.VISUAL, 'VISUAL=1 দিলে চলে'); test.skip(!['chromium', 'pixel-7', 'ipad'].includes(ti.project.name), 'chromium / pixel-7 / ipad'); });
  for (const [name, url, seeded] of PAGES) {
    test(`স্ক্রিনশট: ${name}`, async ({ page }) => {
      await prepare(page);
      await page.addInitScript(c => { try { localStorage.setItem('hc_remind_dismissed', '1'); localStorage.setItem('hc_consent', '{"a":false}'); } catch (e) {} }, null);
      if (seeded) await page.addInitScript(c => localStorage.setItem('hc_cart', JSON.stringify(c)), CART);
      await page.goto(url); await page.waitForTimeout(900);
      await expect(page).toHaveScreenshot(name + '.png', { animations: 'disabled', maxDiffPixelRatio: 0.03, mask: [page.locator('.badge.bg-success, .badge.bg-secondary, .toast-wrap, .consent-bar, .owl-carousel, .remind-bar')] });
    });
  }
});
