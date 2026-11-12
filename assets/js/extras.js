/* v1.9.2 — কেনাকাটার অভিজ্ঞতা: কুপন ওয়ালেট, পরে কিনব, আবার অর্ডার, কর্মঘণ্টা, দাম কমলে অ্যালার্ট।
   app.js এর পরে লোড হয়; app.js এর API (HC.*) ব্যবহার করে। */
(function ($) {
  'use strict';
  const HC = window.HC; if (!HC) return;
  const store = HC.store, B = HC.BDT;

  /* ---------- ১. কুপন ওয়ালেট + সেরা কুপন ---------- */
  const saving = (c, sub) => sub < (c.min || 0) ? 0 : (c.type === 'pct' ? Math.round(sub * c.v / 100) : Math.min(c.v, sub));
  HC.bestCoupon = () => {
    const sub = HC.totals().sub; let best = null;
    Object.keys(HC.COUPONS).forEach(k => { const s = saving(HC.COUPONS[k], sub); if (s > 0 && (!best || s > best.s)) best = { code: k, s }; });
    return best;
  };
  HC.walletHtml = () => {
    const t = HC.totals(), sub = t.sub; if (!sub) return '';
    const cur = HC.coupon(), best = HC.bestCoupon();
    const rows = Object.keys(HC.COUPONS).map(k => {
      const c = HC.COUPONS[k], s = saving(c, sub), ok = s > 0, on = cur === k && ok;
      return `<div class="wal-item ${on ? 'on' : ''} ${ok ? '' : 'dis'}"><div><b>${k}</b> <small>${c.label}</small>${best && best.code === k ? ' <span class="badge bg-success">সেরা</span>' : ''}
        <div class="small text-muted">${ok ? 'সাশ্রয় ' + B(s) : 'আরও ' + B((c.min || 0) - sub) + ' এর পণ্য লাগবে'}</div></div>
        <button type="button" class="btn btn-sm ${on ? 'btn-soft' : 'btn-brand'} wal-use" data-code="${k}" ${ok ? '' : 'disabled'}>${on ? 'বাদ দিন' : 'ব্যবহার'}</button></div>`;
    }).join('');
    return `<div class="wallet" id="couponWallet"><div class="small fw-semibold mb-1"><i class="bi bi-ticket-perforated text-brand"></i> আপনার কুপন</div>${rows}
      <label class="form-check small mt-1"><input type="checkbox" class="form-check-input" id="walAuto" ${store.get('hc_autocoupon', false) ? 'checked' : ''}> <span class="form-check-label">সেরা কুপন নিজে বসান</span></label></div>`;
  };
  const baseCoupon = HC.couponHtml;
  HC.couponHtml = () => baseCoupon() + HC.walletHtml();
  let autoBusy = false;
  function autoApply() {
    if (autoBusy || !store.get('hc_autocoupon', false)) return;
    const b = HC.bestCoupon(), cur = HC.coupon();
    if (b && cur !== b.code && (!cur || saving(HC.COUPONS[cur] || { type: 'flat', v: 0 }, HC.totals().sub) < b.s)) { autoBusy = true; store.set('hc_coupon', b.code); $(document).trigger('cartchange'); autoBusy = false; }
  }
  $(document).on('click', '.wal-use', function () {
    const code = $(this).data('code');
    if (HC.coupon() === code) { store.set('hc_coupon', null); store.set('hc_autocoupon', false); } else { store.set('hc_coupon', code); HC.toast('কুপন প্রয়োগ হয়েছে: ' + HC.COUPONS[code].label); }
    $(document).trigger('cartchange');
  });
  $(document).on('change', '#walAuto', function () { store.set('hc_autocoupon', this.checked); if (this.checked) autoApply(); $(document).trigger('cartchange'); });
  $(document).on('cartchange', autoApply);

  /* ---------- ২. পরে কিনব + উইশলিস্টে রাখুন ---------- */
  const later = () => store.get('hc_later', []);
  const parseKey = k => { const a = String(k).split('|'); return { id: +a[0], oi: +a[1] || 0 }; };
  $(document).on('click', '.later-btn', function () {
    const key = $(this).data('key'), it = HC.cart().find(i => i.key === key); if (!it) return;
    store.set('hc_later', later().filter(x => x.key !== key).concat(it)); HC.setQty(key, 0); HC.toast('"পরে কিনব" তালিকায় রাখা হয়েছে');
  });
  $(document).on('click', '.wish-move', function () {
    const key = $(this).data('key'), it = HC.cart().find(i => i.key === key); if (!it) return;
    const w = HC.wish(); if (!w.includes(it.id)) store.set('hc_wish', w.concat(it.id)); HC.setQty(key, 0); $(document).trigger('wishchange'); HC.toast('উইশলিস্টে সরানো হয়েছে');
  });
  function laterHtml() {
    const l = later(); if (!l.length) return '';
    return `<div class="panel mb-3" id="laterBox"><h5 class="fw-bold mb-2"><i class="bi bi-clock-history text-brand"></i> পরে কিনব (${l.length})</h5>` + l.map(i => `<div class="cart-line later-line">
      <img src="${i.img}" alt=""><div class="flex-grow-1"><div class="nm">${i.name}${i.label ? ' <small class="text-muted">(' + i.label + ')</small>' : ''}</div>
      <div class="pr"><b>${B(i.sale)}</b> <small class="text-muted">এখনকার দাম অনুযায়ী কার্টে যোগ হবে</small></div>
      <div class="line-acts"><button type="button" class="btn btn-sm btn-brand later-back" data-key="${i.key}"><i class="bi bi-cart-plus"></i> কার্টে নিন</button>
      <button type="button" class="lnk-btn later-wish" data-key="${i.key}"><i class="bi bi-heart"></i> উইশলিস্টে</button><button type="button" class="lnk-btn later-del" data-key="${i.key}"><i class="bi bi-trash3"></i> মুছুন</button></div></div></div>`).join('') + '</div>';
  }
  const drawLater = () => { if (!$('#cartList').length) return; $('#laterBox').remove(); const h = laterHtml(); if (h) $('#cartList').after(h); };
  $(document).on('click', '.later-back', function () {
    const key = $(this).data('key'), it = later().find(x => x.key === key); if (!it) return; const k = parseKey(key);
    store.set('hc_later', later().filter(x => x.key !== key)); if (HC.find(k.id)) HC.add(k.id, k.oi, it.qty || 1); else $(document).trigger('cartchange'); HC.toast('কার্টে যোগ হয়েছে ✓');
  });
  $(document).on('click', '.later-del', function () { store.set('hc_later', later().filter(x => x.key !== $(this).data('key'))); drawLater(); });
  $(document).on('click', '.later-wish', function () {
    const key = $(this).data('key'), it = later().find(x => x.key === key); if (!it) return; const w = HC.wish();
    if (!w.includes(it.id)) store.set('hc_wish', w.concat(it.id)); store.set('hc_later', later().filter(x => x.key !== key)); $(document).trigger('wishchange'); drawLater(); HC.toast('উইশলিস্টে সরানো হয়েছে');
  });
  $(document).on('cartchange', drawLater); $(drawLater);

  /* ---------- ৩. আবার অর্ডার ---------- */
  HC.reorder = o => {
    let n = 0;
    (o.items || []).forEach(i => { const k = parseKey(i.key || ''); let id = k.id, oi = k.oi; if (!HC.find(id)) { const p = HC.D.products.find(x => x.name === i.name); if (!p) return; id = p.id; oi = HC.lowest(p); } HC.add(id, oi, i.qty || 1); n++; });
    if (!n) { const p = HC.D.products[0]; HC.add(p.id, HC.lowest(p), 1); n = 1; }
    location.href = 'cart.html';
  };
  $(document).on('click', '.reorder-btn', function () {
    const id = +$(this).data('id'), o = HC.orders().find(x => x.id === id) || store.get('hc_last_order', null);
    if (o) HC.reorder(o);
  });

  /* ---------- ৪. কর্মঘণ্টা (অনলাইন/অফলাইন) ---------- */
  HC.HOURS = { open: 10, close: 22, tz: 'Asia/Dhaka' };      // সকাল ১০টা – রাত ১০টা
  HC.shopOpen = (now) => {
    const h = +new Intl.DateTimeFormat('en-GB', { timeZone: HC.HOURS.tz, hour: 'numeric', hourCycle: 'h23' }).format(now || new Date());
    return h >= HC.HOURS.open && h < HC.HOURS.close;
  };
  function hoursUi() {
    const on = HC.shopOpen(), txt = on ? 'এখন অনলাইনে' : 'এখন অফলাইন', sub = 'সকাল ১০টা – রাত ১০টা';
    if (!$('.hrs-badge').length) $('.topbar .container').first().find('> span').first().after(`<span class="hrs-badge" role="status"></span>`);
    $('.hrs-badge').toggleClass('on', on).html(`<i class="hrs-dot"></i> ${txt} <small>(${sub})</small>`);
    $('#waChat').toggleClass('is-online', on).attr('title', on ? 'আমরা এখন অনলাইনে — মেসেজ করুন' : 'এখন অফলাইন — মেসেজ রাখুন, ১০টায় উত্তর দেব');
  }
  $(hoursUi); setInterval(hoursUi, 60000);

  /* ---------- ৫. প্রোডাক্ট পেজ: দাম কমলে জানান + WhatsApp কনফার্ম ---------- */
  const PH = /^(?:\+?88)?01[3-9]\d{8}$/;
  const alerts = () => store.get('hc_alerts', []);
  const waConfirm = (p, kind, extra) => `<a href="#" class="btn btn-wa btn-sm mt-2 wa-confirm" data-t="${encodeURIComponent('আসসালামু আলাইকুম, ' + kind + ': ' + p.name + (extra || '') + ' — লিংক: ' + location.href.split('#')[0])}"><i class="bi bi-whatsapp"></i> WhatsApp এ কনফার্ম করুন</a>`;
  $(document).on('click', '.wa-confirm', function (e) { e.preventDefault(); HC.waOpen(decodeURIComponent($(this).data('t'))); });
  function productAlert() {
    const m = location.pathname.match(/product\.html$/), id = +new URLSearchParams(location.search).get('id'); if (!m || !id) return;
    const p = HC.find(id); if (!p || p.stock <= 0 || p.type === 'external' || !$('#pBuy').length) return;
    const cur = HC.minPrice(p).sale, mine = alerts().find(a => a.id === id);
    $('#pBuy').after(`<div class="alert-box" id="pAlert"><div class="fw-semibold"><i class="bi bi-bell text-brand"></i> দাম কমলে জানান</div>
      <div class="small text-muted mb-2">এখনকার দাম ${B(cur)}। কমলে আপনার নাম্বারে WhatsApp/SMS এ জানানো হবে।</div>
      <form class="row g-2" id="alertForm" novalidate><div class="col-7"><input class="form-control form-control-sm" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="01XXXXXXXXX" aria-label="ফোন নাম্বার" required></div>
      <div class="col-5"><input class="form-control form-control-sm" name="target" type="number" min="1" max="${cur - 1}" inputmode="numeric" placeholder="কাঙ্ক্ষিত দাম ৳" aria-label="কাঙ্ক্ষিত দাম (ঐচ্ছিক)"></div>
      <div class="col-12"><button class="btn btn-sm btn-brand w-100" type="submit">অ্যালার্ট চালু করুন</button></div></form><div id="alertOk" class="small text-success mt-1" style="display:none"></div></div>`);
    const done = a => { $('#alertForm').hide(); $('#alertOk').html('✓ ' + (a.target ? B(a.target) + ' বা তার কমে নামলে' : 'দাম কমলে') + ' ' + a.phone + ' নাম্বারে জানানো হবে। <a href="#" class="text-brand" id="alertOff">বন্ধ করুন</a>' + waConfirm(p, 'দাম কমলে জানাতে চাই', a.target ? ' (কাঙ্ক্ষিত ৳' + a.target + ')' : '')).show(); };
    if (mine) done(mine);
    $(document).on('click', '#alertOff', function (e) { e.preventDefault(); store.set('hc_alerts', alerts().filter(a => a.id !== id)); $('#alertOk').hide().empty(); $('#alertForm').show(); });
    $('#alertForm').on('submit', function (e) {
      e.preventDefault(); const ph = $.trim(this.phone.value).replace(/[\s-]/g, ''), tg = +this.target.value || 0;
      if (!PH.test(ph)) { $(this.phone).addClass('is-invalid'); HC.toast('সঠিক বাংলাদেশি নাম্বার দিন'); return; }
      if (tg && tg >= cur) { $(this.target).addClass('is-invalid'); HC.toast('কাঙ্ক্ষিত দাম এখনকার দামের চেয়ে কম হতে হবে'); return; }
      const a = { id, phone: ph, price: cur, target: tg, ts: Date.now() }; store.set('hc_alerts', alerts().filter(x => x.id !== id).concat(a)); done(a);
    });
  }
  // স্টকে-এলে-জানান সফল হলে WhatsApp কনফার্ম বাটন
  $(document).on('submit', '#notifyForm', function () { setTimeout(() => { const id = +new URLSearchParams(location.search).get('id'), p = HC.find(id); if (p && $('#notifyOk').is(':visible') && !$('#notifyOk .wa-confirm').length) $('#notifyOk').append('<br>' + waConfirm(p, 'স্টকে এলে জানাতে চাই')); }, 50); });
  $(productAlert);

  // সব পেজে: সেভ করা দাম থেকে কমে থাকলে ব্যানার (একবার দেখালে সেভ করা দাম হালনাগাদ হয়)
  HC.checkAlerts = () => {
    const hit = alerts().map(a => ({ a, p: HC.find(a.id) })).find(x => x.p && (x.a.target ? HC.minPrice(x.p).sale <= x.a.target : HC.minPrice(x.p).sale < x.a.price));
    if (!hit || $('.drop-bar').length) return;
    const now = HC.minPrice(hit.p).sale;
    $('.main-nav').first().after(`<div class="remind-bar drop-bar show" role="status"><span><i class="bi bi-graph-down-arrow text-success"></i> দাম কমেছে! <b>${hit.p.name}</b> এখন <b>${B(now)}</b> <del class="text-muted">${B(hit.a.price)}</del></span>
      <span class="d-flex gap-2 align-items-center"><a class="btn btn-sm btn-brand rounded-pill" href="product.html?id=${hit.p.id}">দেখুন</a><button type="button" class="btn-close drop-x" aria-label="বন্ধ করুন"></button></span></div>`);
    store.set('hc_alerts', alerts().map(x => x.id === hit.a.id ? Object.assign({}, x, { price: now, target: x.target && now <= x.target ? 0 : x.target }) : x));
  };
  $(document).on('click', '.drop-x', function () { $(this).closest('.drop-bar').remove(); });
  $(HC.checkAlerts);
})(jQuery);
