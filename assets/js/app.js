/* HitsCam template core — jQuery. হেডার/ফুটার/মিনি কার্ট/অর্ডার মোডাল/কার্ড সব এখান থেকে ইনজেক্ট হয়। */
(function ($) {
  'use strict';
  const D = window.HC_DATA;
  const BDT = n => '৳' + Math.round(n).toLocaleString('en-IN');
  const FREE_SHIP = 5000;
  const COUPONS = { HITS10: { type: 'pct', v: 10, label: '১০% ছাড়' }, WELCOME100: { type: 'flat', v: 100, label: '৳১০০ ছাড়' } };
  // মোবাইল ব্যাংকিং নাম্বার — আপনার আসল পার্সোনাল নাম্বার দিয়ে বদলে নিন
  const PAY_NUMBERS = { 'বিকাশ': '01XXXXXXXXX', 'নগদ': '01XXXXXXXXX' };
  const TYPE_LABEL = { simple: 'Simple', variable: 'Variable', grouped: 'Grouped', external: 'Affiliate' };

  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* in-app browser এ storage বন্ধ থাকতে পারে */ } }
  };
  let memCart = null; // storage না চললে fallback

  const HC = window.HC = { BDT, FREE_SHIP, store, D, PAY_NUMBERS };

  HC.find = id => D.products.find(p => p.id === +id);
  HC.cat = slug => D.categories.find(c => c.slug === slug) || { name: slug, slug };
  HC.options = p => p.type === 'variable' ? p.variations : p.type === 'grouped' ? p.children : [{ label: '', regular: p.regular, sale: p.sale }];
  HC.lowest = p => { const o = HC.options(p); let b = 0; o.forEach((x, i) => { if (x.sale < o[b].sale) b = i; }); return b; };
  HC.minPrice = p => HC.options(p)[HC.lowest(p)];
  HC.soldFmt = n => n >= 1000 ? (Math.round(n / 100) / 10).toString().replace(/\.0$/, '') + 'k' : String(n);
  HC.stars = r => { let s = ''; for (let i = 1; i <= 5; i++) s += i <= Math.round(r) ? '★' : '☆'; return '<span class="stars">' + s + '</span>'; };

  /* ---------- Cart ---------- */
  HC.cart = () => memCart || store.get('hc_cart', []);
  HC.saveCart = c => { memCart = c; store.set('hc_cart', c); $(document).trigger('cartchange'); };
  HC.add = (id, oi, qty) => {
    const p = HC.find(id), o = HC.options(p)[oi || 0], c = HC.cart().slice(), key = id + '|' + (oi || 0);
    const ex = c.find(i => i.key === key);
    if (ex) ex.qty += (qty || 1);
    else c.push({ key, id: +id, name: p.name, label: o.label, img: p.img, regular: o.regular, sale: o.sale, qty: qty || 1 });
    HC.saveCart(c);
  };
  HC.setQty = (key, q) => HC.saveCart(HC.cart().map(i => i.key === key ? Object.assign({}, i, { qty: q }) : i).filter(i => i.qty > 0));
  HC.inCart = id => HC.cart().some(i => i.id === +id);
  HC.removeProduct = id => HC.saveCart(HC.cart().filter(i => i.id !== +id));
  HC.coupon = () => store.get('hc_coupon', null);
  HC.ship = () => store.get('hc_ship', 70);
  HC.totals = () => {
    const c = HC.cart();
    const sub = c.reduce((s, i) => s + i.sale * i.qty, 0);
    const reg = c.reduce((s, i) => s + i.regular * i.qty, 0);
    const cp = HC.coupon() && COUPONS[HC.coupon()];
    const disc = cp ? (cp.type === 'pct' ? Math.round(sub * cp.v / 100) : Math.min(cp.v, sub)) : 0;
    const ship = (!c.length || sub >= FREE_SHIP) ? 0 : HC.ship();
    return { sub, reg, disc, ship, total: sub - disc + ship, count: c.reduce((s, i) => s + i.qty, 0), saved: reg - sub };
  };

  HC.toast = msg => {
    const $w = $('.toast-wrap'); const $t = $('<div class="hc-toast"></div>').text(msg).appendTo($w);
    setTimeout(() => $t.fadeOut(300, () => $t.remove()), 2200);
  };

  /* ---------- Product card ---------- */
  const priceHtml = (o, p) => {
    return (o.regular > o.sale ? '<del>' + BDT(o.regular) + '</del>' : '') + BDT(o.sale);
  };
  HC.card = p => {
    const lo = HC.lowest(p), o = HC.options(p)[lo];
    const disc = o.regular > o.sale ? Math.round((1 - o.sale / o.regular) * 100) : 0;
    let opts = '';
    if (p.type === 'variable' || p.type === 'grouped') {
      // একই কার্ডের সব রেডিওর name এক হতে হবে (না হলে একসাথে একটাই সিলেক্ট হয় না); প্রতিটি কার্ডের জন্য ইউনিক নাম
      const gname = 'opt-' + p.id + '-' + Math.random().toString(36).slice(2, 8);
      const list = p.type === 'variable' ? p.variations : p.children;
      opts = `<div class="pc-group" style="--n:${Math.min(list.length, 3)}">` + list.map((v, i) =>
        `<label><span><input type="radio" class="form-check-input opt-radio me-1" name="${gname}" value="${i}" ${i === lo ? 'checked' : ''}>${v.label}</span><b>${BDT(v.sale)}</b></label>`).join('') + '</div>';
    }
    // ভ্যারিয়েশন/গ্রুপ না থাকলে ইম্পর্টেন্ট Additional information আইকনসহ
    if (!opts && p.info && p.info.length) {
      opts = '<ul class="pc-info">' + p.info.slice(0, 4).map(x => `<li><i class="bi ${x[0]}"></i><span>${x[1]}</span></li>`).join('') + '</ul>';
    }
    const actions = p.type === 'external'
      ? `<a class="btn btn-brand btn-ext" href="${p.url}" target="_blank" rel="sponsored noopener"><i class="bi bi-box-arrow-up-right"></i> ${p.btn}</a>`
      : `<button class="btn btn-brand btn-add" type="button">অ্যাড টু কার্ট</button>
         <button class="btn btn-brand-outline btn-order" type="button">অর্ডার নাউ</button>
         <a class="btn btn-brand btn-view" href="cart.html">ভিউ কার্ট</a>`;
    return `<div class="product-card" data-id="${p.id}" data-opt="${lo}">
      ${disc ? `<span class="pc-badge">-${disc}%</span>` : ''}
      <button class="wish ${store.get('hc_wish', []).includes(p.id) ? 'on' : ''}" type="button" aria-label="উইশলিস্ট"><i class="bi bi-heart-fill"></i></button>
      <a class="pc-img" href="product.html?id=${p.id}"><img loading="lazy" src="${p.img}" alt="${p.name}"></a>
      <div class="pc-body">
        <div class="pc-cat">${HC.cat(p.cat).name} · <span class="text-muted">${TYPE_LABEL[p.type]}</span></div>
        <a class="pc-title" href="product.html?id=${p.id}">${p.name}</a>
        <div class="pc-rate">${HC.stars(p.rating)} <span class="text-muted">(${p.reviews})</span>${p.sold ? `<span class="pc-sold" title="টোটাল সোল্ড"><i class="bi bi-bag-check-fill"></i> ${HC.soldFmt(p.sold)} বিক্রি</span>` : ''}</div>
        ${opts}
        <div class="pc-price">${priceHtml(o, p)}</div>
        <div class="pc-actions ${p.type !== 'external' && HC.inCart(p.id) ? 'three' : ''}">${actions}</div>
      </div></div>`;
  };
  HC.grid = (sel, list, cols) => {
    const c = cols || 'col-12 col-sm-6 col-md-4 col-lg-3';
    $(sel).html(list.length ? list.map(p => `<div class="${c}">${HC.card(p)}</div>`).join('') : '<div class="col-12 text-center text-muted py-5">কোনো প্রোডাক্ট পাওয়া যায়নি।</div>');
  };
  HC.section = (sel, tag, n) => HC.grid(sel, D.products.filter(p => p.tags.includes(tag)).slice(0, n || 4));

  /* ---------- Qty / cart line ---------- */
  HC.qty = (key, q) => `<div class="qty"><button type="button" class="qty-btn" data-key="${key}" data-d="-1" aria-label="কমান">−</button><span>${q}</span><button type="button" class="qty-btn" data-key="${key}" data-d="1" aria-label="বাড়ান">+</button></div>`;
  HC.line = (i, opts) => `<div class="cart-line">
      <img src="${i.img}" alt="">
      <div class="flex-grow-1">
        <div class="nm">${i.name}${i.label ? ' <small class="text-muted">(' + i.label + ')</small>' : ''}</div>
        <div class="pr">${i.regular > i.sale ? '<del>' + BDT(i.regular) + '</del>' : ''}<b>${BDT(i.sale)}</b></div>
        <div class="mt-1 d-flex align-items-center gap-2">${HC.qty(i.key, i.qty)}<button class="rm-btn" data-key="${i.key}" type="button" aria-label="মুছুন"><i class="bi bi-trash3"></i></button></div>
      </div>
      <div class="fw-bold text-end">${BDT(i.sale * i.qty)}</div></div>`;
  HC.emptyCart = '<div class="text-center text-muted py-5"><i class="bi bi-bag-x fs-1"></i><p class="mt-2">আপনার কার্ট খালি</p><a href="shop.html" class="btn btn-brand">কেনাকাটা শুরু করুন</a></div>';

  HC.addonsHtml = () => {
    const base = HC.cart()[0];
    return `<div class="addon-box"><h6><i class="bi bi-stars text-brand"></i> Complete Your Purchase</h6>` +
      D.addons.map(a => { const p = HC.find(a.id); const on = HC.inCart(p.id); return `<label class="addon-item"><input type="checkbox" class="form-check-input addon-chk" data-id="${p.id}" ${on ? 'checked' : ''}>
        <span class="grow">${p.name}<small>${a.note}</small></span><b>${BDT(p.sale)}</b></label>`; }).join('') + '</div>';
  };
  HC.couponHtml = () => {
    const cp = HC.coupon();
    return `<div class="input-group input-group-sm mb-2"><input type="text" class="form-control coupon-input" placeholder="কুপন কোড (HITS10)" value="${cp || ''}"><button class="btn btn-brand coupon-apply" type="button">${cp ? 'আপডেট' : 'অ্যাপ্লাই'}</button></div>`;
  };
  HC.totalsHtml = () => {
    const t = HC.totals();
    return `<div class="totals-row"><span>Subtotal</span><b>${BDT(t.sub)}</b></div>
      ${t.disc ? `<div class="totals-row text-success"><span>কুপন (${HC.coupon()})</span><b>-${BDT(t.disc)}</b></div>` : ''}
      <div class="totals-row"><span>Shipping</span><b>${t.ship ? BDT(t.ship) : 'Free shipping'}</b></div>
      <div class="totals-row total"><span>Total</span><span class="text-brand">${BDT(t.total)}</span></div>`;
  };
  HC.freeShipHtml = () => {
    const t = HC.totals(); const left = Math.max(0, FREE_SHIP - t.sub); const pct = Math.min(100, t.sub / FREE_SHIP * 100);
    return `<div class="free-ship mb-3"><div class="mb-2">${left > 0 ? `আরও <b>${BDT(left)}</b> এর পণ্য কার্টে যোগ করুন এবং পান <b class="text-brand">ফ্রি শিপিং!</b>` : '🎉 অভিনন্দন! আপনি <b>ফ্রি শিপিং</b> পাচ্ছেন।'}</div><div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div></div>`;
  };

  /* ---------- Checkout (page + modal) ---------- */
  HC.detailsForm = () => `<form id="orderForm" novalidate>
    <div class="mb-3"><label class="form-label">আপনার নাম *</label><input class="form-control" name="name" required placeholder="পুরো নাম"><div class="invalid-feedback">নাম লিখুন</div></div>
    <div class="mb-3"><label class="form-label">আপনার ঠিকানা *</label><textarea class="form-control" name="address" rows="2" required placeholder="বাসা/রোড, থানা, জেলা"></textarea><div class="invalid-feedback">ঠিকানা লিখুন</div></div>
    <div class="row g-3 mb-3">
      <div class="col-md-6"><label class="form-label">ফোন নাম্বার *</label><input class="form-control" name="phone" type="tel" inputmode="tel" required placeholder="01XXXXXXXXX"><div class="invalid-feedback">সঠিক বাংলাদেশি নাম্বার দিন</div></div>
      <div class="col-md-6"><label class="form-label">ই-মেইল (ঐচ্ছিক)</label><input class="form-control" name="email" type="email" placeholder="you@example.com"></div>
    </div>
    <div class="mb-3"><label class="form-label">Order notes (ঐচ্ছিক)</label><textarea class="form-control" name="notes" rows="2" placeholder="ডেলিভারি সম্পর্কে বিশেষ নির্দেশনা"></textarea></div>
    <div class="mb-3"><label class="form-label fw-bold">Shipping method</label>
      <label class="ship-opt"><input type="radio" class="form-check-input ship-radio" name="ship" value="70" ${HC.ship() == 70 ? 'checked' : ''}><span>ঢাকার ভিতরে <small class="text-muted">(১-২ দিন)</small></span><b>৳70</b></label>
      <label class="ship-opt"><input type="radio" class="form-check-input ship-radio" name="ship" value="130" ${HC.ship() == 130 ? 'checked' : ''}><span>ঢাকার বাইরে <small class="text-muted">(২-৪ দিন)</small></span><b>৳130</b></label>
      <small class="text-muted">৳${FREE_SHIP.toLocaleString('en-IN')}+ অর্ডারে শিপিং ফ্রি</small></div>
    <div class="mb-1"><label class="form-label fw-bold">Payment method</label>
      <label class="pay-opt"><input type="radio" class="form-check-input" name="pay" value="ক্যাশ অন ডেলিভারি" checked><span><i class="bi bi-cash-coin text-success"></i> ক্যাশ অন ডেলিভারি</span></label>
      <label class="pay-opt"><input type="radio" class="form-check-input" name="pay" value="বিকাশ"><span><i class="bi bi-wallet2 text-danger"></i> বিকাশ (পার্সোনাল)</span></label>
      <label class="pay-opt"><input type="radio" class="form-check-input" name="pay" value="নগদ"><span><i class="bi bi-wallet2 text-warning"></i> নগদ (পার্সোনাল)</span></label>
      <div class="pay-extra" id="payExtra" style="display:none">
        <div class="small mb-2" id="payHint"></div>
        <div class="mb-2"><label class="form-label mb-1">ট্রানজেকশন আইডি (TrxID) *</label>
          <input class="form-control" name="txn" autocomplete="off" autocapitalize="characters" placeholder="যেমন: 8N7A6B5C4D"><div class="invalid-feedback">সঠিক TrxID দিন (৬–২০ অক্ষর/সংখ্যা)</div></div>
        <div><label class="form-label mb-1">ট্রানজেকশন স্লিপ / স্ক্রিনশট আপলোড *</label>
          <input class="form-control" type="file" name="slip" accept="image/*,application/pdf"><div class="invalid-feedback" id="slipErr">স্লিপের ছবি বা PDF আপলোড করুন (সর্বোচ্চ ৫MB)</div>
          <div id="slipPreview" class="mt-2"></div></div>
      </div>
    </div></form>`;

  HC.renderSummary = el => {
    const $el = $(el), c = HC.cart();
    if (!c.length) { $el.html(HC.emptyCart); return; }
    $el.html(`<h5 class="fw-bold mb-3">Order Summary</h5>
      <div class="small text-muted d-flex justify-content-between border-bottom pb-1"><span>Product</span><span>Qty / Price</span></div>
      ${c.map(HC.line).join('')}
      ${HC.addonsHtml()}
      <div class="mb-3">${HC.couponHtml()}</div>
      ${HC.totalsHtml()}
      <button type="submit" form="orderForm" class="btn btn-brand w-100 btn-lg mt-3 place-order"><i class="bi bi-bag-check"></i> অর্ডার কনফার্ম করুন</button>
      <p class="small text-muted text-center mt-2 mb-0"><i class="bi bi-shield-lock"></i> আপনার তথ্য সুরক্ষিত</p>`);
  };
  HC.renderCheckout = el => {
    $(el).html(`<div class="row g-4"><div class="col-lg-6"><div class="panel h-100"><h5 class="fw-bold mb-3">Your details</h5>${HC.detailsForm()}</div></div>
      <div class="col-lg-6"><div class="panel" data-summary></div></div></div>`);
    HC.renderSummary($(el).find('[data-summary]'));
  };
  // স্লিপ ফাইল যাচাই: ছবি/PDF, সর্বোচ্চ ৫MB (WooCommerce এ ফাইল multipart ফর্মে সার্ভারে যাবে)
  const slipOk = f => (/^image\//.test(f.type) || f.type === 'application/pdf') && f.size <= 5 * 1024 * 1024;
  const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
  HC.placeOrder = form => {
    const f = form, v = n => $.trim($(f).find('[name=' + n + ']').val());
    let ok = true;
    $(f).find('[name=name],[name=address]').each(function () { const bad = !$.trim(this.value); $(this).toggleClass('is-invalid', bad); if (bad) ok = false; });
    const ph = $(f).find('[name=phone]'); const badp = !BD_PHONE.test(ph.val().replace(/[\s-]/g, '')); ph.toggleClass('is-invalid', badp); if (badp) ok = false;
    const pay = $(f).find('[name=pay]:checked').val(), mobile = !!PAY_NUMBERS[pay];
    let txn = '', slipName = '';
    if (mobile) {
      const tx = $(f).find('[name=txn]'); txn = $.trim(tx.val()).toUpperCase();
      const badt = !/^[A-Z0-9]{6,20}$/.test(txn); tx.toggleClass('is-invalid', badt); if (badt) ok = false;
      const fl = $(f).find('[name=slip]')[0].files[0]; const bads = !fl || !slipOk(fl);
      $(f).find('[name=slip]').toggleClass('is-invalid', bads); if (bads) ok = false; else slipName = fl.name;
    }
    if (!HC.cart().length) { HC.toast('কার্ট খালি!'); return; }
    if (!ok) { HC.toast('অনুগ্রহ করে লাল ঘরগুলো ঠিক করুন'); return; }
    const t = HC.totals();
    store.set('hc_last_order', {
      id: 500 + Math.floor(Math.random() * 400), date: new Date().toISOString(), items: HC.cart(), totals: t,
      name: v('name'), address: v('address'), phone: v('phone'), email: v('email'), notes: v('notes'), pay, txn, slipName
    });
    memCart = []; store.set('hc_cart', []); store.set('hc_coupon', null);
    location.href = 'order-received.html';
  };

  /* ---------- Layout injection ---------- */
  const NAV = [['index.html', 'হোম'], ['shop.html', 'সব প্রোডাক্ট', true], ['track-order.html', 'অর্ডার ট্র্যাক'], ['contact.html', 'যোগাযোগ'], ['faq.html', 'FAQ']];
  const catOpts = '<option value="">সকল ক্যাটাগরি</option>' + D.categories.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
  const header = () => {
    const here = location.pathname.split('/').pop() || 'index.html';
    const navItem = n => n[2]
      ? `<li class="nav-item has-sub d-flex align-items-center"><a class="nav-link text-nowrap pe-1 ${here === 'shop.html' || here === 'category.html' ? 'active' : ''}" href="${n[0]}">${n[1]}</a><button class="sub-toggle" type="button" aria-label="সাব মেনু" aria-expanded="false"><i class="bi bi-chevron-down"></i></button></li>`
      : `<li class="nav-item"><a class="nav-link text-nowrap ${here === n[0] ? 'active' : ''}" href="${n[0]}">${n[1]}</a></li>`;
    const sub = D.categories.map(c => `<a class="sub-item" href="category.html?cat=${c.slug}"><img src="${c.img}" alt=""><span>${c.name}<small>${c.count}টি পণ্য</small></span></a>`).join('') +
      '<a class="sub-item sub-all" href="shop.html"><i class="bi bi-grid-fill"></i><span>সব প্রোডাক্ট দেখুন</span></a>';
    return `<div class="topbar"><div class="container d-flex justify-content-between flex-wrap gap-1">
        <span><i class="bi bi-truck"></i> ৳5,000+ অর্ডারে ফ্রি ডেলিভারি</span>
        <span><a href="tel:+8801614747054"><i class="bi bi-telephone"></i> +880 1614-747054</a></span></div></div>
      <header class="site-header sticky-top"><div class="container">
        <div class="header-main d-flex align-items-center gap-3">
          <a class="brand" href="index.html"><span class="brand-mark"><i class="bi bi-camera-video-fill"></i></span><span>HITS<b>Cam</b></span></a>
          <form class="search-box flex-grow-1 d-none d-md-flex" action="shop.html"><select name="cat" aria-label="ক্যাটাগরি">${catOpts}</select>
            <input class="form-control" name="q" placeholder="আইপি ক্যামেরা, সিসি ক্যামেরা, মেমোরি কার্ড, মিনি ইউপিএস খুঁজুন..."><button aria-label="সার্চ"><i class="bi bi-search"></i></button></form>
          <div class="header-icons">
            <button class="icon-btn" type="button" data-bs-toggle="offcanvas" data-bs-target="#miniWish" aria-label="উইশলিস্ট"><i class="bi bi-heart"></i><span class="badge-count wish-count">0</span></button>
            <button class="icon-btn" type="button" data-bs-toggle="offcanvas" data-bs-target="#miniCart" aria-label="কার্ট"><i class="bi bi-cart3"></i><span class="badge-count cart-count">0</span></button>
            <a class="icon-btn" href="track-order.html" aria-label="অর্ডার ট্র্যাক" title="অর্ডার ট্র্যাক"><i class="bi bi-truck"></i></a>
            <a class="icon-btn" href="login.html" aria-label="লগইন / অ্যাকাউন্ট" title="লগইন / অ্যাকাউন্ট"><i class="bi bi-person"></i></a>
          </div></div>
        <form class="search-box d-flex d-md-none mobile-search mb-2" action="shop.html"><input class="form-control" name="q" placeholder="প্রোডাক্ট খুঁজুন..."><button aria-label="সার্চ"><i class="bi bi-search"></i></button></form>
      </div>
      <nav class="main-nav"><div class="container nav-wrap"><ul class="nav flex-nowrap overflow-auto">${NAV.map(navItem).join('')}</ul>
        <div class="submenu" id="navSub">${sub}</div></div></nav></header>`;
  };
  const footer = () => `<footer class="site-footer"><div class="container"><div class="row g-4">
      <div class="col-lg-4"><div class="brand text-white mb-2"><span class="brand-mark"><i class="bi bi-camera-video-fill"></i></span><span>HITS<b>Cam</b></span></div>
        <p>সিসিটিভি, আইপি ক্যামেরা ও স্মার্ট গ্যাজেটের বিশ্বস্ত অনলাইন শপ। অরিজিনাল পণ্য, দ্রুত ডেলিভারি, বিক্রয়োত্তর সাপোর্ট।</p>
        <p class="mb-0"><i class="bi bi-telephone"></i> +880 1614-747054<br><i class="bi bi-envelope"></i> support@hitscam.com</p></div>
      <div class="col-6 col-lg-2"><h6>কোম্পানি</h6><a href="index.html">হোম</a><a href="shop.html">শপ</a><a href="contact.html">যোগাযোগ</a><a href="faq.html">FAQ</a></div>
      <div class="col-6 col-lg-3"><h6>পলিসি</h6><a href="terms.html">শর্তাবলী</a><a href="returns.html">রিটার্ন, রিফান্ড ও ওয়ারেন্টি</a><a href="shipping.html">শিপিং তথ্য</a><a href="track-order.html">অর্ডার ট্র্যাক</a></div>
      <div class="col-lg-3"><h6>কম্পেটিবিলিটি</h6><a href="device-compatibility.html">ডিভাইস ও ব্রাউজার</a><a href="social-compatibility.html">সোশ্যাল মিডিয়া অ্যাপ ব্রাউজার</a><a href="minicart.html">মিনি কার্ট</a></div></div>
      <div class="footer-bottom d-flex justify-content-between flex-wrap gap-2"><span>© 2026 HitsCam. সর্বস্বত্ব সংরক্ষিত।</span><span>পেমেন্ট: ক্যাশ অন ডেলিভারি · বিকাশ · নগদ</span></div></div></footer>`;
  // মোবাইল ভিউতে নিচে ফিক্সড গোল আইকন মেনু (ডেস্কটপে CSS দিয়ে লুকানো)
  const mobileDock = () => {
    const here = location.pathname.split('/').pop() || 'index.html';
    const a = f => (here === f ? 'active' : '');
    return `<nav class="mobile-dock" aria-label="মোবাইল মেনু">
      <a class="dock-btn ${a('index.html')}" href="index.html" aria-label="হোম"><i class="bi bi-house-door-fill"></i></a>
      <a class="dock-btn ${a('shop.html')}" href="shop.html" aria-label="শপ"><i class="bi bi-grid-fill"></i></a>
      <button class="dock-btn ${a('cart.html')}" type="button" data-bs-toggle="offcanvas" data-bs-target="#miniCart" aria-label="কার্ট"><i class="bi bi-cart3"></i><span class="badge-count cart-count">0</span></button>
      <a class="dock-btn ${a('track-order.html')}" href="track-order.html" aria-label="অর্ডার ট্র্যাক"><i class="bi bi-geo-alt-fill"></i></a>
      <a class="dock-btn call" href="tel:+8801614747054" aria-label="কল করুন"><i class="bi bi-telephone-fill"></i></a></nav>`;
  };
  const miniCart = () => `<div class="offcanvas offcanvas-end" tabindex="-1" id="miniCart"><div class="offcanvas-header border-bottom"><h5 class="offcanvas-title fw-bold">Your Cart (<span class="cart-count">0</span>)</h5><button class="btn-close" data-bs-dismiss="offcanvas" aria-label="বন্ধ"></button></div>
      <div class="offcanvas-body d-flex flex-column"><div id="miniCartBody" class="flex-grow-1"></div></div></div>`;
  const miniWish = () => `<div class="offcanvas offcanvas-end" tabindex="-1" id="miniWish"><div class="offcanvas-header border-bottom"><h5 class="offcanvas-title fw-bold"><i class="bi bi-heart-fill text-brand"></i> Wishlist (<span class="wish-count">0</span>)</h5><button class="btn-close" data-bs-dismiss="offcanvas" aria-label="বন্ধ"></button></div>
      <div class="offcanvas-body d-flex flex-column"><div id="miniWishBody" class="flex-grow-1"></div></div></div>`;
  const orderModal = () => `<div class="modal fade" id="orderModal" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-xl modal-dialog-scrollable modal-fullscreen-lg-down"><div class="modal-content">
      <div class="modal-header"><h5 class="modal-title fw-bold"><i class="bi bi-lightning-charge-fill text-brand"></i> ইন্সট্যান্ট অর্ডার</h5><button class="btn-close" data-bs-dismiss="modal" aria-label="বন্ধ"></button></div>
      <div class="modal-body bg-light" id="orderRoot"></div></div></div></div>`;

  HC.renderMini = () => {
    const c = HC.cart(), t = HC.totals();
    $('#miniCartBody').html(c.length ? `${c.map(HC.line).join('')}${HC.addonsHtml()}
      <div class="mt-3">${HC.totalsHtml()}</div>
      <div class="d-grid gap-2 mt-3"><a class="btn btn-brand" href="checkout.html">Proceed to Checkout</a><a class="btn btn-soft" href="cart.html">কার্ট দেখুন</a></div>` : HC.emptyCart);
    $('.cart-count').text(t.count);
  };
  HC.wish = () => store.get('hc_wish', []);
  HC.renderWish = () => {
    const ids = HC.wish().filter(id => HC.find(id));
    $('.wish-count').text(ids.length);
    if (!ids.length) { $('#miniWishBody').html('<div class="text-center text-muted py-5"><i class="bi bi-heart fs-1"></i><p class="mt-2">আপনার উইশলিস্ট খালি</p><a href="shop.html" class="btn btn-brand">প্রোডাক্ট দেখুন</a></div>'); return; }
    $('#miniWishBody').html(ids.map(id => {
      const p = HC.find(id), o = HC.minPrice(p);
      const act = p.type === 'external'
        ? `<a class="btn btn-sm btn-brand" href="${p.url}" target="_blank" rel="sponsored noopener"><i class="bi bi-box-arrow-up-right"></i> ${p.btn}</a>`
        : `<button class="btn btn-sm btn-brand wl-add" type="button" data-id="${p.id}"><i class="bi bi-cart-plus"></i> অ্যাড টু কার্ট</button>`;
      return `<div class="cart-line"><a href="product.html?id=${p.id}"><img src="${p.img}" alt=""></a>
        <div class="flex-grow-1"><a class="nm d-block" href="product.html?id=${p.id}">${p.name}</a>
          <div class="pr">${o.regular > o.sale ? '<del>' + BDT(o.regular) + '</del>' : ''}<b>${BDT(o.sale)}</b></div>
          <div class="mt-1 d-flex align-items-center gap-2">${act}<button class="rm-btn wl-rm" type="button" data-id="${p.id}" aria-label="মুছুন"><i class="bi bi-trash3"></i></button></div></div></div>`;
    }).join('') + `<div class="d-grid gap-2 mt-3"><button class="btn btn-brand wl-add-all" type="button">সব কার্টে যোগ করুন</button><a class="btn btn-soft" href="shop.html">কেনাকাটা চালিয়ে যান</a></div>`);
  };
  HC.openOrder = () => {
    HC.renderCheckout('#orderRoot');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('orderModal')).show();
  };

  $(function () {
    $('body').prepend('<div class="toast-wrap"></div>');
    $('#site-header').replaceWith(header());
    $('#site-footer').replaceWith(footer());
    $('body').append(miniCart()).append(miniWish()).append(mobileDock());
    if (!$('body').is('[data-no-modal]')) $('body').append(orderModal());
    HC.renderMini(); HC.renderWish();

    HC.syncCards = () => $('.product-card').each(function () {
      const $a = $(this).find('.pc-actions');
      $a.toggleClass('three', !$a.find('.btn-ext').length && HC.inCart($(this).data('id')));
    });
    $(document).on('cartchange', function () {
      HC.syncCards();
      HC.renderMini();
      $('[data-summary]').each(function () { HC.renderSummary(this); });
      $('[data-cart-page]').each(function () { if (window.renderCartPage) window.renderCartPage(); });
    });

    // ---- card interactions ----
    const cardOpt = $c => +($c.find('.opt-select').val() ?? $c.find('.opt-radio:checked').val() ?? $c.data('opt') ?? 0);
    $(document).on('change', '.opt-select, .opt-radio', function () {
      const $c = $(this).closest('.product-card'), p = HC.find($c.data('id')), o = HC.options(p)[+$(this).val()];
      $c.find('.pc-price').html(priceHtml(o, p));
    });
    $(document).on('click', '.btn-add', function () {
      const $c = $(this).closest('.product-card'); HC.add($c.data('id'), cardOpt($c), 1); HC.toast('কার্টে যোগ হয়েছে ✓');
    });
    $(document).on('click', '.btn-order', function () {
      const $c = $(this).closest('.product-card'); HC.add($c.data('id'), cardOpt($c), 1);
      if ($('#orderModal').length) HC.openOrder(); else location.href = 'checkout.html';
    });
    $(document).on('click', '.wish', function () {
      const id = +$(this).closest('.product-card').data('id'); let w = HC.wish(); const had = w.includes(id);
      w = had ? w.filter(x => x !== id) : w.concat(id); store.set('hc_wish', w); $(document).trigger('wishchange');
      HC.toast(had ? 'উইশলিস্ট থেকে সরানো হয়েছে' : 'উইশলিস্টে যোগ হয়েছে ♥');
    });
    $(document).on('wishchange', function () {
      HC.renderWish(); const w = HC.wish();
      $('.product-card').each(function () { $(this).find('.wish').toggleClass('on', w.includes(+$(this).data('id'))); });
    });
    $(document).on('click', '.wl-add', function () { const p = HC.find($(this).data('id')); HC.add(p.id, HC.lowest(p), 1); HC.toast('কার্টে যোগ হয়েছে ✓'); });
    $(document).on('click', '.wl-rm', function () { store.set('hc_wish', HC.wish().filter(x => x !== +$(this).data('id'))); $(document).trigger('wishchange'); });
    $(document).on('click', '.wl-add-all', function () { HC.wish().map(HC.find).filter(p => p && p.type !== 'external').forEach(p => HC.add(p.id, HC.lowest(p), 1)); HC.toast('উইশলিস্টের সব পণ্য কার্টে যোগ হয়েছে ✓'); });

    // ---- "সব প্রোডাক্ট" সাব মেনু: ডেস্কটপে হোভার, মোবাইলে ট্যাপ
    const subSet = open => { $('#navSub').toggleClass('open', open); $('.sub-toggle').attr('aria-expanded', open).toggleClass('on', open); };
    $(document).on('click', '.sub-toggle', function (e) { e.stopPropagation(); subSet(!$('#navSub').hasClass('open')); });
    $(document).on('click', function (e) { if (!$(e.target).closest('.nav-wrap').length) subSet(false); });
    $(document).on('keydown', function (e) { if (e.key === 'Escape') subSet(false); });
    if (window.matchMedia && matchMedia('(hover:hover)').matches) {
      $(document).on('mouseenter', '.has-sub', () => subSet(true)).on('mouseleave', '.nav-wrap', () => subSet(false));
    }

    // ---- cart interactions (mini cart, modal, cart page) ----
    $(document).on('click', '.qty-btn', function () {
      const k = $(this).data('key'), it = HC.cart().find(i => i.key === k); if (it) HC.setQty(k, it.qty + (+$(this).data('d')));
    });
    $(document).on('click', '.rm-btn', function () { HC.setQty($(this).data('key'), 0); });
    $(document).on('change', '.addon-chk', function () {
      const id = +$(this).data('id'); this.checked ? HC.add(id, 0, 1) : HC.removeProduct(id);
    });
    $(document).on('click', '.coupon-apply', function () {
      const code = $.trim($(this).closest('.input-group').find('.coupon-input').val()).toUpperCase();
      if (!code) { store.set('hc_coupon', null); } else if (COUPONS[code]) { store.set('hc_coupon', code); HC.toast('কুপন প্রয়োগ হয়েছে: ' + COUPONS[code].label); } else { HC.toast('কুপন কোড সঠিক নয়'); return; }
      $(document).trigger('cartchange');
    });
    $(document).on('change', '.ship-radio', function () { store.set('hc_ship', +this.value); $(document).trigger('cartchange'); });
    // বিকাশ/নগদ বেছে নিলে TrxID ও স্লিপ আপলোড ফিল্ড দেখানো
    $(document).on('change', '#orderForm [name=pay]', function () {
      const v = $('#orderForm [name=pay]:checked').val(), num = PAY_NUMBERS[v];
      $('#payExtra').toggle(!!num);
      if (num) $('#payHint').html(`<b>${v}</b> পার্সোনাল নাম্বার <b class="text-brand user-select-all">${num}</b> এ <b>Send Money</b> করে নিচে TrxID ও স্লিপ দিন। মোট: <b>${BDT(HC.totals().total)}</b>`);
    });
    $(document).on('change', '#orderForm [name=slip]', function () {
      const fl = this.files[0], $p = $('#slipPreview').empty(); $(this).removeClass('is-invalid');
      if (!fl) return;
      if (!slipOk(fl)) { $(this).addClass('is-invalid'); this.value = ''; return; }
      $p.append(/^image\//.test(fl.type) ? $('<img class="rounded-3 border" style="max-height:120px">').attr('src', URL.createObjectURL(fl)) : $('<span class="badge bg-secondary"></span>').text(fl.name));
    });
    $(document).on('submit', '#orderForm', function (e) { e.preventDefault(); HC.placeOrder(this); });
  });
})(jQuery);
