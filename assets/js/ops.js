/* v1.10.2 — অপারেশন (দোকান মালিকের জন্য) ও বাল্ক/ডিলার প্রাইসিং:
   ১. বাল্ক/ডিলার প্রাইস: পরিমাণ অনুযায়ী ধাপে ছাড় (সবার জন্য) + ডিলার কোডে অতিরিক্ত ছাড় (dealer.html)
   ২. অ্যাডমিন: WhatsApp স্ট্যাটাস টেমপ্লেট (কনফার্ম / কুরিয়ারে পাঠানো / ডেলিভারি / বাকি টাকা) ও CSV এক্সপোর্ট (অর্ডার, কম স্টক, ফেলে-যাওয়া কার্ট)
   সব মান HC.BULK এ। ⚠ ডিলার কোড ডেমো — আসল প্রজেক্টে সার্ভারে যাচাই করা ডিলার অ্যাকাউন্ট ব্যবহার করুন। */
(function ($) {
  'use strict';
  const HC = window.HC; if (!HC) return;
  const store = HC.store, B = HC.BDT;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ===== ১. বাল্ক / ডিলার প্রাইস ===== */
  HC.BULK = { tiers: [{ min: 5, pct: 3 }, { min: 10, pct: 6 }, { min: 20, pct: 10 }], dealerExtra: 4, dealerCode: 'DEALER2026' };
  HC.isDealer = () => !!store.get('hc_dealer', false);
  HC.bulkPct = qty => { let p = 0; HC.BULK.tiers.forEach(t => { if (qty >= t.min) p = t.pct; }); return p + (HC.isDealer() ? HC.BULK.dealerExtra : 0); };
  HC.nextTier = qty => HC.BULK.tiers.find(t => qty < t.min) || null;
  const baseTotals = HC.totals;
  HC.totals = function () {
    const t = baseTotals(); t.bulk = HC.cart().reduce((s, i) => s + Math.round(i.sale * i.qty * HC.bulkPct(i.qty) / 100), 0);
    if (t.bulk) { t.bulk = Math.min(t.bulk, t.total); t.total -= t.bulk; }
    return t;
  };
  const baseHtml = HC.totalsHtml;
  HC.totalsHtml = function () {
    const t = HC.totals(), html = baseHtml.apply(this, arguments), key = '<div class="totals-row"><span>Shipping</span>';
    if (!t.bulk || html.indexOf(key) < 0) return html;
    return html.replace(key, `<div class="totals-row text-success"><span>${HC.isDealer() ? 'ডিলার / বাল্ক ছাড়' : 'বাল্ক ছাড়'}</span><b>-${B(t.bulk)}</b></div>` + key);
  };
  const baseFinal = HC.finalizeOrder;
  HC.finalizeOrder = function (order) { if ((order.totals || {}).bulk) order.bulk = { amount: order.totals.bulk, dealer: HC.isDealer() }; return baseFinal.call(this, order); };

  // প্রোডাক্ট পেজ: "বেশি কিনলে সাশ্রয়" টেবিল
  function productBulk() {
    if (!/product\.html/.test(location.pathname) || $('#pBulk').length) return;
    const p = HC.find(+new URLSearchParams(location.search).get('id')); if (!p || p.type === 'external' || p.stock <= 0) return;
    const d = HC.isDealer(), rows = HC.BULK.tiers.map(t => `<span class="bulk-chip"><b>${t.min}+ পিস</b> ${t.pct + (d ? HC.BULK.dealerExtra : 0)}% ছাড়</span>`).join('');
    $('#pPrice').after(`<div class="bulk-box" id="pBulk"><i class="bi bi-boxes text-brand"></i> <b>বেশি কিনলে সাশ্রয়:</b> ${rows}${d ? ' <span class="badge bg-dark">ডিলার মোড</span>' : ' <a href="dealer.html" class="small ms-1">ডিলার?</a>'}</div>`);
  }
  // কার্ট পেজ: পরের ধাপের ইঙ্গিত
  function cartBulkNote() {
    if (!$('[data-cart-page]').length) return;
    if (!$('#bulkNote').length) $('#cartList').after('<div id="bulkNote" class="bulk-note" role="status"></div>');
    const hints = HC.cart().map(i => { const n = HC.nextTier(i.qty); return n ? `<div><i class="bi bi-tag-fill text-brand"></i> <b>${esc(i.name.slice(0, 30))}</b> — আরও ${n.min - i.qty}টি নিলে <b>${n.pct + (HC.isDealer() ? HC.BULK.dealerExtra : 0)}%</b> ছাড়</div>` : ''; }).filter(Boolean).slice(0, 2);
    $('#bulkNote').html(hints.join('')).toggle(hints.length > 0);
  }
  $(document).on('cartchange', cartBulkNote);
  function dealerPage() {
    if (!$('[data-dealer-page]').length) return;
    const draw = () => { const on = HC.isDealer(); $('#dealerState').html(on ? '<div class="alert alert-success mb-3"><i class="bi bi-patch-check-fill"></i> ডিলার মোড <b>চালু</b> — প্রতিটি পণ্যে অতিরিক্ত ' + HC.BULK.dealerExtra + '% ছাড়।</div>' : '<div class="alert alert-secondary mb-3">ডিলার মোড বন্ধ।</div>'); $('#dealerOff').toggle(on); $('#dealerForm').toggle(!on); };
    $('#dealerForm').on('submit', function (e) { e.preventDefault(); const c = $.trim(this.elements.code.value).toUpperCase(); if (c === HC.BULK.dealerCode) { store.set('hc_dealer', true); $('#dealerMsg').text(''); HC.toast('ডিলার মোড চালু ✓'); $(document).trigger('cartchange'); } else $('#dealerMsg').text('ডিলার কোড সঠিক নয়'); draw(); });
    $('#dealerOff').on('click', () => { store.set('hc_dealer', false); $(document).trigger('cartchange'); draw(); });
    draw();
  }

  /* ===== ২. অ্যাডমিন টুলস ===== */
  HC.csv = (rows, name) => {
    const cell = v => { v = v == null ? '' : String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };      // CSV/Excel ফর্মুলা ইনজেকশন ঠেকাতে ' বসে
    const text = '﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    return text;
  };
  HC.csvOrders = () => [['অর্ডার', 'তারিখ', 'নাম', 'ফোন', 'ঠিকানা', 'পেমেন্ট', 'মোট', 'বাকি', 'স্ট্যাটাস', 'পণ্য']].concat(HC.orders().map(o => [o.id, o.date, o.name, o.phone, o.address, o.pay, (o.totals || {}).total, o.due || 0, o.status || (o.reconfirmed ? 'confirmed' : 'new'), (o.items || []).map(i => i.name + ' ×' + i.qty).join('; ')]));
  HC.csvLowStock = () => [['আইডি', 'পণ্য', 'SKU', 'স্টক']].concat(HC.D.products.filter(p => p.type !== 'external' && p.stock <= HC.LOW_STOCK).sort((a, b) => a.stock - b.stock).map(p => [p.id, p.name, p.sku, p.stock]));
  HC.abandoned = () => {                                                  // এই ব্রাউজারের ফেলে-যাওয়া কার্ট (৩০+ মিনিট পুরোনো); আসল সাইটে সার্ভার থেকে
    const c = HC.cart(), ts = +store.get('hc_cart_ts', 0) || 0, d = store.get('hc_draft', null) || {};
    if (!c.length || !ts || Date.now() - ts < 30 * 60000) return [];
    return [{ name: d.name || '', phone: d.phone || '', email: d.email || '', items: c.map(i => i.name + ' ×' + i.qty).join('; '), value: c.reduce((s, i) => s + i.sale * i.qty, 0), last: new Date(ts).toISOString() }];
  };
  HC.csvAbandoned = () => [['নাম', 'ফোন', 'ই-মেইল', 'পণ্য', 'মূল্য', 'শেষ কার্যকলাপ']].concat(HC.abandoned().map(a => [a.name, a.phone, a.email, a.items, a.value, a.last]));
  const tpl = {
    confirm: o => `আসসালামু আলাইকুম ${o.name}, HitsCam থেকে আপনার অর্ডার #${o.id} কনফার্ম হয়েছে। মোট ${B((o.totals || {}).total || 0)}${o.due ? ', ডেলিভারিতে দিতে হবে ' + B(o.due) : ''}। ধন্যবাদ!`,
    packed: o => `${o.name}, আপনার অর্ডার #${o.id} প্যাকেজিং সম্পন্ন — আজই কুরিয়ারে হস্তান্তর হবে।`,
    shipped: o => { const c = o.courier && HC.COURIERS && HC.COURIERS[o.courier.key]; return `${o.name}, আপনার অর্ডার #${o.id} কুরিয়ারে পাঠানো হয়েছে${c ? ' (' + c.name + ', ট্র্যাকিং ' + o.courier.cn + ')' : ''}। অর্ডার ট্র্যাক: ${location.origin}/track-order.html`; },
    delivered: o => `${o.name}, অর্ডার #${o.id} ডেলিভারি সম্পন্ন। পণ্য কেমন লাগল জানালে ভালো লাগবে — রিভিউ দিলে লয়ালটি পয়েন্ট পাবেন। কোনো সমস্যা হলে ${location.origin}/rma.html`,
    due: o => `${o.name}, অর্ডার #${o.id} এর বাকি ${B(o.due || (o.totals || {}).total || 0)} ডেলিভারির সময় পরিশোধ করতে হবে। ধন্যবাদ।`
  };
  HC.waTemplate = (key, o) => (tpl[key] || tpl.confirm)(o);
  HC.waCustomerUrl = (o, text) => 'https://wa.me/88' + String(o.phone || '').replace(/\D/g, '').replace(/^88/, '') + '?text=' + encodeURIComponent(text);
  function adminTools() {
    if (!$('#adOrders').length || $('#opsTools').length) return;
    const orders = HC.orders();
    const html = `<div class="panel mb-4" id="opsTools"><h2 class="h6 fw-bold mb-3"><i class="bi bi-tools text-brand"></i> অপারেশন টুলস</h2>
      <div class="row g-3"><div class="col-lg-6"><div class="small fw-semibold mb-1">CSV এক্সপোর্ট</div><div class="d-flex flex-wrap gap-2">
        <button class="btn btn-soft btn-sm" id="csvOrders" type="button"><i class="bi bi-download"></i> অর্ডার</button><button class="btn btn-soft btn-sm" id="csvLow" type="button"><i class="bi bi-download"></i> কম স্টক</button><button class="btn btn-soft btn-sm" id="csvAband" type="button"><i class="bi bi-download"></i> ফেলে-যাওয়া কার্ট</button></div>
        <div class="small text-muted mt-1">ডেমোতে শুধু এই ব্রাউজারের ডাটা; আসল সাইটে সার্ভার থেকে।</div></div>
      <div class="col-lg-6"><div class="small fw-semibold mb-1">WhatsApp স্ট্যাটাস বার্তা</div>
        ${orders.length ? `<div class="row g-2"><div class="col-6"><select class="form-select form-select-sm" id="waOrder" aria-label="অর্ডার">${orders.map(o => `<option value="${o.id}">#${o.id} · ${esc(o.name)}</option>`).join('')}</select></div>
        <div class="col-6"><select class="form-select form-select-sm" id="waTpl" aria-label="বার্তার ধরন"><option value="confirm">অর্ডার কনফার্ম</option><option value="packed">প্যাকেজিং সম্পন্ন</option><option value="shipped">কুরিয়ারে পাঠানো</option><option value="delivered">ডেলিভারি সম্পন্ন</option><option value="due">বাকি টাকার অনুস্মারক</option></select></div>
        <div class="col-12"><textarea class="form-control form-control-sm" id="waPreview" rows="3" aria-label="বার্তা"></textarea></div><div class="col-12"><button class="btn btn-wa btn-sm" id="waSend" type="button"><i class="bi bi-whatsapp"></i> কাস্টমারকে পাঠান</button></div></div>` : '<div class="small text-muted">কোনো আসল অর্ডার নেই — একটি অর্ডার দিলে এখানে বার্তা তৈরি হবে।</div>'}</div></div></div>`;
    $('#adKpi').before(html);
    const prev = () => { const o = orders.find(x => String(x.id) === $('#waOrder').val()); if (o) $('#waPreview').val(HC.waTemplate($('#waTpl').val(), o)); };
    $(document).on('change', '#waOrder, #waTpl', prev); prev();
    $('#waSend').on('click', () => { const o = orders.find(x => String(x.id) === $('#waOrder').val()); if (o) window.open(HC.waCustomerUrl(o, $('#waPreview').val()), '_blank', 'noopener'); });
    $('#csvOrders').on('click', () => HC.csv(HC.csvOrders(), 'orders.csv'));
    $('#csvLow').on('click', () => HC.csv(HC.csvLowStock(), 'low-stock.csv'));
    $('#csvAband').on('click', () => HC.csv(HC.csvAbandoned(), 'abandoned-carts.csv'));
  }
  $(function () { productBulk(); cartBulkNote(); dealerPage(); adminTools(); });
})(jQuery);

/* v1.10.2 — Owl ক্যারোসেলের ডটে স্ক্রিন-রিডারের নাম (axe: button-name) */
(function(){
  function label(){ $('.owl-dots').each(function(){ $(this).children('.owl-dot').each(function(i){ if(!this.getAttribute('aria-label')) this.setAttribute('aria-label','স্লাইড '+(i+1)); }); }); }
  $(function(){ label(); if(window.MutationObserver) new MutationObserver(label).observe(document.body,{childList:true,subtree:true}); });
})();
