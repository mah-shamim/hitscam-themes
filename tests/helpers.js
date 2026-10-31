// CDN রিসোর্স npm প্যাকেজ থেকে সার্ভ করা হয় → টেস্ট অফলাইনেও চলে ও ফ্ল্যাকি হয় না।
// LIVE_CDN=1 দিলে আসল CDN ব্যবহার হয় (সাপ্তাহিক শিডিউল রানে CDN ভাঙছে কিনা ধরতে)।
const fs = require('fs'), path = require('path');
const NM = path.resolve(__dirname, '..', 'node_modules');
const LIVE = !!process.env.LIVE_CDN;

const PLACEHOLDER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="100%" height="100%" fill="#f1f5f9"/><text x="50%" y="50%" fill="#e03131" font-size="40" text-anchor="middle" dy=".3em">IMG</text></svg>';

const MAP = [
  [/cdn\.jsdelivr\.net\/npm\/bootstrap@5\.3\.3\/dist\/(.+)$/, m => path.join(NM, 'bootstrap/dist', m[1])],
  [/cdn\.jsdelivr\.net\/npm\/bootstrap-icons@1\.11\.3\/font\/(.+)$/, m => path.join(NM, 'bootstrap-icons/font', m[1])],
  [/code\.jquery\.com\/jquery-3\.7\.1\.min\.js/, () => path.join(NM, 'jquery/dist/jquery.min.js')],
  [/cdnjs\.cloudflare\.com\/ajax\/libs\/OwlCarousel2\/2\.3\.4\/owl\.carousel\.min\.js/, () => path.join(NM, 'owl.carousel/dist/owl.carousel.min.js')],
  [/cdnjs\.cloudflare\.com\/ajax\/libs\/OwlCarousel2\/2\.3\.4\/assets\/(.+)$/, m => path.join(NM, 'owl.carousel/dist/assets', m[1])],
];
const CT = { '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.woff': 'font/woff', '.map': 'application/json', '.gif': 'image/gif', '.png': 'image/png' };

/** প্রতিটি টেস্টের আগে ডাকুন: CDN স্টাব + কনসোল/পেজ এরর সংগ্রহ। */
async function prepare(page) {
  const problems = [];
  page.on('pageerror', e => problems.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon/i.test(m.text() + (m.location().url || ''))) problems.push('console.error: ' + m.text() + ' @ ' + (m.location().url || '')); });
  const ours = u => u.startsWith('http://127.0.0.1') && !/\/favicon\.ico(\?|$)/.test(u);   // WebKit/Firefox অনুরোধ করে; আইকন নিজেই inline দেওয়া আছে
  page.on('requestfailed', r => { if (ours(r.url())) problems.push('request failed: ' + r.url()); });
  page.on('response', r => { if (ours(r.url()) && r.status() >= 400) problems.push(r.status() + ' ' + r.url()); });

  if (!LIVE) {
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, async route => {
      const url = route.request().url();
      for (const [re, toFile] of MAP) {
        const m = url.match(re);
        if (m) {
          const f = toFile(m).split('?')[0];
          if (fs.existsSync(f)) return route.fulfill({ body: fs.readFileSync(f), contentType: CT[path.extname(f)] || 'application/octet-stream' });
        }
      }
      if (/fonts\.(googleapis|gstatic)\.com/.test(url)) return route.fulfill({ body: '', contentType: 'text/css' });
      if (/placehold\.co/.test(url)) return route.fulfill({ body: PLACEHOLDER_SVG, contentType: 'image/svg+xml' });
      if (/facebook\.com|wa\.me|example\.com/.test(url)) return route.fulfill({ body: 'external', contentType: 'text/html' });
      return route.abort('blockedbyclient');
    });
  }
  return problems;
}

const isMobileViewport = page => page.viewportSize().width < 768;
module.exports = { prepare, isMobileViewport, LIVE };
