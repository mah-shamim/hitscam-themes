/* v1.9.3 — অ্যানালিটিক্স ইভেন্ট (GA4 / Meta Pixel) + কুকি সম্মতি ব্যানার
   ▸ নিচের ID গুলো বসালেই চালু হয়। ID ফাঁকা থাকলে কিছুই লোড/ট্র্যাক হয় না এবং ব্যানার আসে না।
   ▸ ভিজিটর "অনুমতি দিন" না চাপা পর্যন্ত কোনো থার্ড-পার্টি স্ক্রিপ্ট লোড বা ইভেন্ট পাঠানো হয় না।
   ▸ ইভেন্ট: view_item, add_to_cart, begin_checkout, purchase, search (GA4 নাম; Pixel এ ViewContent/AddToCart/InitiateCheckout/Purchase/Search)। */
(function ($) {
  'use strict';
  const HC = window.HC; if (!HC) return;
  const cfg = window.HC_ANALYTICS = Object.assign({ ga4: '', pixel: '', load: true }, window.HC_ANALYTICS);   // ga4: 'G-XXXXXXXXXX', pixel: '1234567890'
  const store = HC.store, enabled = !!(cfg.ga4 || cfg.pixel);
  HC.analyticsLog = [];                                                    // ডিবাগ/টেস্ট: পাঠানো ইভেন্টের তালিকা
  const consent = () => store.get('hc_consent', null);                     // 'granted' | 'denied' | null

  /* ---------- স্ক্রিপ্ট লোড ---------- */
  let loaded = false;
  function boot() {
    if (loaded || !enabled) return; loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    if (cfg.ga4) {
      window.gtag('js', new Date()); window.gtag('config', cfg.ga4, { anonymize_ip: true });
      if (cfg.load) $('head').append('<script async src="https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.ga4) + '"><\/script>');
    }
    if (cfg.pixel) {
      if (!window.fbq) { const q = window.fbq = function () { q.callMethod ? q.callMethod.apply(q, arguments) : q.queue.push(arguments); }; q.queue = []; q.loaded = true; q.version = '2.0'; }
      window.fbq('init', cfg.pixel); window.fbq('track', 'PageView');
      if (cfg.load) $('head').append('<script async src="https://connect.facebook.net/en_US/fbevents.js"><\/script>');
    }
  }

  /* ---------- ইভেন্ট ---------- */
  const item = (p, o, qty) => ({ item_id: String(p.id), item_name: p.name, item_category: (HC.cat(p.cat) || {}).name || p.cat, item_variant: (o && o.label) || undefined, price: o ? o.sale : HC.minPrice(p).sale, quantity: qty || 1 });
  const PIXEL = { view_item: 'ViewContent', add_to_cart: 'AddToCart', begin_checkout: 'InitiateCheckout', purchase: 'Purchase', search: 'Search' };
  HC.track = function (name, params) {
    if (!enabled || consent() !== 'granted') return false;
    boot();
    const ev = { name, params: Object.assign({ currency: 'BDT' }, params), ts: Date.now() }; HC.analyticsLog.push(ev);
    if (cfg.ga4 && window.gtag) window.gtag('event', name, ev.params);
    if (cfg.pixel && window.fbq && PIXEL[name]) {
      const it = ev.params.items || [], px = { currency: 'BDT', value: ev.params.value };
      if (it.length) { px.content_ids = it.map(i => i.item_id); px.content_type = 'product'; px.contents = it.map(i => ({ id: i.item_id, quantity: i.quantity })); }
      if (ev.params.search_term) px.search_string = ev.params.search_term;
      window.fbq('track', PIXEL[name], px);
    }
    return true;
  };

  /* ---------- পেজ-ভিত্তিক ইভেন্ট (সম্মতি পাওয়ার পর/পেজ লোডে) ---------- */
  function pageEvents() {
    const page = location.pathname.split('/').pop() || 'index.html', qs = new URLSearchParams(location.search);
    if (page === 'product.html') { const p = HC.find(+qs.get('id')); if (p) { const o = HC.minPrice(p); HC.track('view_item', { value: o.sale, items: [item(p, o)] }); } }
    if (page === 'checkout.html') { const c = HC.cart(); if (c.length) HC.track('begin_checkout', { value: HC.totals().total, items: c.map(i => ({ item_id: String(i.id), item_name: i.name, item_variant: i.label || undefined, price: i.sale, quantity: i.qty })) }); }
    if (page === 'order-received.html') {
      const o = store.get('hc_last_order', null);
      if (o && !store.get('hc_tracked_' + o.id, false)) {                   // রিলোডে একই অর্ডার দুবার গণনা হবে না
        store.set('hc_tracked_' + o.id, true);
        HC.track('purchase', { transaction_id: String(o.id), value: (o.totals || {}).total, shipping: (o.totals || {}).ship, items: (o.items || []).map(i => ({ item_name: i.name, item_variant: i.label || undefined, price: i.sale, quantity: i.qty })) });
      }
    }
  }
  // add_to_cart: HC.add কে মুড়ে দেওয়া (কার্ড, কুইক ভিউ, প্রোডাক্ট পেজ — সব জায়গা থেকে একই পথ)
  const baseAdd = HC.add;
  HC.add = function (id, oi, qty) {
    const r = baseAdd.apply(this, arguments);
    try { const p = HC.find(id), o = HC.options(p)[oi || 0]; HC.track('add_to_cart', { value: o.sale * (qty || 1), items: [item(p, o, qty)] }); } catch (e) {}
    return r;
  };
  let sTimer; $(document).on('input', '#siteSearch, .site-search input, input[name=q]', function () { const v = $.trim(this.value); clearTimeout(sTimer); if (v.length >= 3) sTimer = setTimeout(() => HC.track('search', { search_term: v }), 900); });

  /* ---------- সম্মতি ব্যানার ---------- */
  function bar() {
    if (!enabled || $('#consentBar').length) return;
    $('body').append(`<div class="consent-bar" id="consentBar" role="dialog" aria-label="কুকি সম্মতি"><div class="in"><span><i class="bi bi-shield-check text-brand"></i> আমরা সাইটের মান ও বিজ্ঞাপন উন্নত করতে কুকি/অ্যানালিটিক্স ব্যবহার করতে চাই। আপনার অনুমতি ছাড়া কিছুই ট্র্যাক হবে না।</span>
      <span class="d-flex gap-2"><button type="button" class="btn btn-sm btn-soft" id="consentNo">না, ধন্যবাদ</button><button type="button" class="btn btn-sm btn-brand" id="consentYes">অনুমতি দিন</button></span></div></div>`);
  }
  $(document).on('click', '#consentYes', function () { store.set('hc_consent', 'granted'); $('#consentBar').remove(); boot(); pageEvents(); });
  $(document).on('click', '#consentNo', function () { store.set('hc_consent', 'denied'); $('#consentBar').remove(); });
  $(document).on('click', '.cookie-settings', function (e) { e.preventDefault(); store.set('hc_consent', null); bar(); });

  $(function () {
    if (!enabled) return;
    $('.footer-bottom span').first().append(' · <a href="#" class="cookie-settings text-reset">কুকি সেটিংস</a>');
    if (consent() === null) bar(); else if (consent() === 'granted') { boot(); pageEvents(); }
  });
})(jQuery);
