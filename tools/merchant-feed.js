#!/usr/bin/env node
// Google Merchant Center ফিড (RSS 2.0 / g: ট্যাগ) তৈরি করে assets/js/data.js এর প্রোডাক্ট থেকে।
// ব্যবহার:  SITE_URL=https://yourshop.com node tools/merchant-feed.js   → feed/google-merchant.xml
// ভ্যারিয়েবল/গ্রুপড পণ্যে সবচেয়ে কম দামের অপশন ও "থেকে" দাম ধরা হয়।
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const SITE = (process.env.SITE_URL || 'https://example.com').replace(/\/$/, '');
const win = {}; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/js/data.js'), 'utf8'), { window: win, console });
const D = win.HC_DATA;
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const opts = p => p.type === 'variable' ? p.variations : p.type === 'grouped' ? p.children : [{ regular: p.regular, sale: p.sale }];
const cat = slug => (D.categories.find(c => c.slug === slug) || {}).name || slug;
const items = D.products.filter(p => p.type !== 'external' || p.url).map(p => {
  const o = opts(p).reduce((m, x) => x.sale < m.sale ? x : m);
  const sale = o.regular > o.sale;
  return `    <item>
      <g:id>${esc(p.sku || 'HC-' + p.id)}</g:id>
      <title>${esc(p.name)}</title>
      <description>${esc((p.desc || p.name).slice(0, 4900))}</description>
      <link>${SITE}/product.html?id=${p.id}</link>
      <g:image_link>${esc(p.img)}</g:image_link>
      <g:availability>${p.stock > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${sale ? o.regular : o.sale}.00 BDT</g:price>${sale ? `\n      <g:sale_price>${o.sale}.00 BDT</g:sale_price>` : ''}
      <g:condition>new</g:condition>
      <g:brand>HitsCam</g:brand>
      <g:product_type>${esc(cat(p.cat))}</g:product_type>${p.type === 'variable' ? `\n      <g:item_group_id>${esc(p.sku || 'HC-' + p.id)}</g:item_group_id>` : ''}
    </item>`;
});
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>HitsCam</title>
    <link>${SITE}</link>
    <description>HitsCam প্রোডাক্ট ফিড</description>
${items.join('\n')}
  </channel>
</rss>
`;
fs.mkdirSync(path.join(ROOT, 'feed'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'feed/google-merchant.xml'), xml);
console.log('✓ feed/google-merchant.xml — ' + items.length + 'টি পণ্য (' + SITE + ')');
