/* v1.10.1 — সাপোর্ট ও ডিসকভারি:
   ১. অর্ডার সেলফ-সার্ভিস (সময়সীমার মধ্যে বাতিল / ঠিকানা-ফোন বদল)   ২. রিটার্ন/রিপেয়ার (RMA) অনুরোধ ও ট্র্যাকার (rma.html)
   ৩. হেল্প সেন্টার (help.html) + প্রোডাক্ট পেজে সাধারণ প্রশ্ন        ৪. Banglish / বানান-ভুল সহনশীল সার্চ + জনপ্রিয় সার্চ
   ৫. সম্প্রতি তুলনা ও "অন্য ক্রেতারা এগুলোও দেখেছেন"                ৬. স্টোর লোকেটার (stores.html) + স্টোর থেকে সংগ্রহ (চেকআউট)
   সংরক্ষিত ফিল্টার shop.js এ। services.js এর পরে লোড হয়। ⚠ ডেমোতে সব ডাটা ব্রাউজারে; আসল প্রজেক্টে সার্ভার/অ্যাডমিন লাগবে। */
(function ($) {
  'use strict';
  const HC = window.HC; if (!HC) return;
  const store = HC.store, B = HC.BDT, D = HC.D;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const qsv = k => new URLSearchParams(location.search).get(k);
  const page = (location.pathname.split('/').pop() || 'index.html');

  HC.SUPPORT = { cancelMin: 60, editMin: 60, rmaDays: 7, demoStages: true };

  /* ===== ১. Banglish / বানান-ভুল সহনশীল সার্চ ===== */
  const DICT = { kamera: 'ক্যামেরা', camera: 'ক্যামেরা', camra: 'ক্যামেরা', cam: 'ক্যামেরা', cctv: 'সিসি', sisi: 'সিসি', cc: 'সিসি', ip: 'আইপি', aipi: 'আইপি',
    memory: 'মেমোরি', memori: 'মেমোরি', memry: 'মেমোরি', card: 'কার্ড', kard: 'কার্ড', ups: 'ইউপিএস', mini: 'মিনি', solar: 'সোলার', sola: 'সোলার', phone: 'ফোন', fon: 'ফোন',
    smartphone: 'স্মার্টফোন', laptop: 'ল্যাপটপ', mount: 'মাউন্ট', security: 'সিকিউরিটি', sikiuriti: 'সিকিউরিটি', gimbal: 'গিম্বল', accessories: 'অ্যাক্সেসরিজ', wifi: 'wifi', dvr: 'dvr' };
  const near = (a, b) => {                                              // এডিট-দূরত্ব ≤ ১ (বসানো/বাদ/বদল)
    if (a === b) return true; if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0, j = 0, d = 0; while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; continue; } if (++d > 1) return false; if (a.length > b.length) i++; else if (a.length < b.length) j++; else { i++; j++; } }
    return d + (a.length - i) + (b.length - j) <= 1;
  };
  const words = s => String(s || '').toLowerCase().split(/[^a-z0-9ঀ-৿]+/).filter(Boolean);
  const expand = t => { const c = [t]; if (DICT[t]) c.push(DICT[t]); else if (t.length >= 4 && /^[a-z]+$/.test(t)) Object.keys(DICT).forEach(k => { if (k.length >= 4 && near(t, k)) c.push(DICT[k]); }); return c; };
  const hay = p => { if (!p._hay) { const t = (p.name + ' ' + HC.cat(p.cat).name + ' ' + p.sku + ' ' + p.cat).toLowerCase(); p._hay = { t, w: words(t) }; } return p._hay; };
  HC.searchMatch = (p, q) => {
    const toks = words(q); if (!toks.length) return true; const h = hay(p);
    return toks.every(t => expand(t).some(c => h.t.indexOf(c) > -1) || (t.length >= 4 && /^[a-z0-9]+$/.test(t) && h.w.some(w => near(t, w))));
  };
  HC.searchHint = q => { const m = words(q).map(t => DICT[t] || (t.length >= 4 && /^[a-z]+$/.test(t) && Object.keys(DICT).filter(k => k.length >= 4 && near(t, k)).map(k => DICT[k])[0]) || null); return m.some(Boolean) ? words(q).map((t, i) => m[i] || t).join(' ') : ''; };
  const POP0 = ['সোলার ক্যামেরা', 'মেমোরি কার্ড', 'WiFi ক্যামেরা', 'DVR', 'মিনি UPS'];
  HC.popularSearches = () => { const c = store.get('hc_searches', {}) || {}; const top = Object.keys(c).sort((a, b) => c[b] - c[a]).slice(0, 5); return top.concat(POP0.filter(x => top.indexOf(x) < 0)).slice(0, 5); };
  const recordSearch = q => { q = $.trim(q || ''); if (q.length < 2) return; const c = store.get('hc_searches', {}) || {}; c[q] = (c[q] || 0) + 1; store.set('hc_searches', c); };
  $(document).on('submit', '.search-box form, form.search-box', function () { recordSearch($(this).find('input[name=q]').val()); });
  const suggest2 = $input => {
    const q = $.trim($input.val()), $box = $input.closest('.search-box'); $box.find('.sugg').remove();
    if (q.length < 2) { if (!q.length) $box.append(`<div class="sugg" role="listbox"><div class="sugg-pop"><div class="small text-muted mb-1">জনপ্রিয় সার্চ</div>${HC.popularSearches().map(x => `<a class="chip-link" href="shop.html?q=${encodeURIComponent(x)}">${esc(x)}</a>`).join('')}</div></div>`); return; }
    const cat = $box.find('select').val(), hits = D.products.filter(p => (!cat || p.cat === cat) && HC.searchMatch(p, q)).slice(0, 6), hint = HC.searchHint(q);
    const rows = hits.map(p => `<a class="sugg-item" href="product.html?id=${p.id}"><img src="${p.img}" alt=""><span class="sg-name">${p.name}</span><b class="sg-price">${B(HC.minPrice(p).sale)}</b></a>`).join('');
    $box.append(`<div class="sugg" role="listbox">${hint ? `<div class="sugg-hint small text-muted px-3 pt-2">দেখানো হচ্ছে: <b>${esc(hint)}</b></div>` : ''}${rows || '<div class="sugg-empty">কোনো প্রোডাক্ট পাওয়া যায়নি</div>'}<a class="sugg-all" href="shop.html?q=${encodeURIComponent(q)}">সব ফলাফল দেখুন →</a></div>`);
  };
  // app.js ready-কলব্যাকে নিজের সাজেশন হ্যান্ডলার বসায়; আমাদেরটা তার পরে বসালে (ready এর ভেতরে) পরে চলে ও ফলাফল বদলে দেয়
  $(function () { $(document).on('input focus', '.search-box input[name=q]', function () { suggest2($(this)); }); });

  /* ===== ৩. হেল্প সেন্টার ডাটা ===== */
  HC.HELP = [
    { c: 'অর্ডার', q: 'কীভাবে অর্ডার করব?', a: 'পণ্য পেজে "অর্ডার নাউ" বা কার্টে যোগ করে চেকআউটে নাম, ঠিকানা (রোড/থানা/জেলা) ও ফোন দিন। আমরা ফোনে কনফার্ম করব।', t: 'order অর্ডার kivabe korbo' },
    { c: 'অর্ডার', q: 'অর্ডার বাতিল বা ঠিকানা বদলাতে পারব?', a: 'অর্ডারের পর ৬০ মিনিটের মধ্যে অর্ডার পেজ/ট্র্যাক পেজ থেকে নিজেই বাতিল বা ঠিকানা-ফোন বদলানো যায়। এরপর WhatsApp এ জানান।', t: 'cancel batil bodlano address' },
    { c: 'অর্ডার', q: 'অর্ডারের অবস্থা কীভাবে দেখব?', a: 'অর্ডার ট্র্যাক পেজে অর্ডার নম্বর ও ফোন নাম্বার দিন। কুরিয়ারে হস্তান্তর হলে কুরিয়ারের ট্র্যাকিং লিংকও পাবেন।', t: 'track ট্র্যাক status courier' },
    { c: 'ডেলিভারি', q: 'ডেলিভারি কতদিনে পাব এবং চার্জ কত?', a: 'ঢাকার ভিতরে ১–২ কর্মদিবস (৳70), বাইরে ২–৪ কর্মদিবস (৳130)। ৳5,000+ অর্ডারে ফ্রি ডেলিভারি।', t: 'delivery ডেলিভারি shipping charge' },
    { c: 'ডেলিভারি', q: 'স্টোর থেকে নিজে সংগ্রহ করা যায়?', a: 'হ্যাঁ। চেকআউটে "স্টোর থেকে সংগ্রহ" বেছে নিলে শিপিং ফ্রি। স্টোরের ঠিকানা ও সময় স্টোর পেজে আছে।', t: 'pickup store showroom সংগ্রহ' },
    { c: 'পেমেন্ট', q: 'কী কী পেমেন্ট পদ্ধতি আছে?', a: 'ক্যাশ অন ডেলিভারি, COD + ৳500 অগ্রিম (বিকাশ/নগদ), অনলাইন পেমেন্ট (কার্ড/মোবাইল ব্যাংকিং) এবং বিকাশ/নগদ পার্সোনাল।', t: 'payment bkash nagad পেমেন্ট' },
    { c: 'পেমেন্ট', q: 'EMI বা কিস্তিতে কেনা যায়?', a: '৳5,000+ পণ্যে ক্রেডিট কার্ডে ৩/৬ মাস ০% এবং ১২ মাস ৬% ফি-তে কিস্তি। পণ্য পেজের EMI বক্সে হিসাব দেখুন।', t: 'emi kisti কিস্তি' },
    { c: 'ওয়ারেন্টি', q: 'ওয়ারেন্টি কীভাবে যাচাই করব?', a: 'ওয়ারেন্টি পেজে সিরিয়াল নম্বর বা অর্ডারের ফোন দিলে অবস্থা দেখা যায়। বাড়তি ১ বছরের কভার কার্টে নেওয়া যায়।', t: 'warranty ওয়ারেন্টি serial' },
    { c: 'ওয়ারেন্টি', q: 'পণ্য নষ্ট বা পছন্দ না হলে কী করব?', a: 'ডেলিভারির ৭ দিনের মধ্যে রিটার্ন/রিপ্লেসমেন্ট এবং ওয়ারেন্টির মধ্যে রিপেয়ার অনুরোধ করুন; ছবিসহ ফর্ম পূরণ করলে আমরা যাচাই করে জানাব।', t: 'return rma repair রিটার্ন রিপেয়ার ফেরত' },
    { c: 'ইনস্টলেশন', q: 'ক্যামেরা ইনস্টল করে দেবেন?', a: 'হ্যাঁ। কার্টে "প্রফেশনাল ইনস্টলেশন" বেছে নিন (ঢাকায় ৳500, বাইরে ৳900)। সময়ের স্লট বেছে নিলে টেকনিশিয়ান গিয়ে সেটআপ করবেন।', t: 'install ইনস্টল technician সেটআপ' },
    { c: 'ইনস্টলেশন', q: 'সোলার ক্যামেরা কি বিদ্যুৎ ছাড়া চলে?', a: 'বিল্ট-ইন সোলারে চলে; তবে সবসময় রোদ না পেলে ব্যাটারি কমতে পারে। SIM বা WiFi — যেকোনো একটি কানেকশন লাগবে।', t: 'solar সোলার sim wifi power' },
    { c: 'ইনস্টলেশন', q: 'কোন মেমোরি কার্ড লাগবে?', a: 'ক্যামেরাভেদে ৬৪GB–২৫৬GB Class 10 কার্ড চলে। পণ্য পেজের "আমার সেটআপে চলবে?" দিয়ে মিলিয়ে নিন।', t: 'memory card sd মেমোরি' },
    { c: 'অ্যাকাউন্ট', q: 'ফোন নাম্বার দিয়ে লগইন করব কীভাবে?', a: 'লগইন পেজে "ফোন দিয়ে লগইন" বেছে নিলে OTP যাবে। (ডেমোতে কোড স্ক্রিনে দেখায়।)', t: 'login otp লগইন' },
    { c: 'অ্যাকাউন্ট', q: 'লয়ালটি পয়েন্ট ও রেফারেল কীভাবে কাজ করে?', a: 'প্রতি ৳100 এ ২ পয়েন্ট; ১ পয়েন্ট = ৳1 (সর্বোচ্চ ২০% পর্যন্ত)। বন্ধুকে আপনার কোড দিলে সে প্রথম অর্ডারে ৳200 ছাড় পায়।', t: 'points loyalty referral পয়েন্ট রেফারেল' }
  ];
  const helpNorm = s => words(s).map(t => expand(t)).reduce((a, b) => a.concat(b), []);
  HC.helpFind = (q, cat) => {
    const toks = words(q); return HC.HELP.filter(h => (!cat || h.c === cat) && toks.every(t => { const hs = (h.q + ' ' + h.a + ' ' + h.t + ' ' + h.c).toLowerCase(); return expand(t).some(c => hs.indexOf(c) > -1) || (t.length >= 4 && words(hs).some(w => near(t, w))); }));
  };
  const accItem = (h, i, pre) => `<div class="accordion-item"><h3 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${pre}${i}" aria-expanded="false">${esc(h.q)}</button></h3><div id="${pre}${i}" class="accordion-collapse collapse"><div class="accordion-body">${esc(h.a)}</div></div></div>`;
  function helpPage() {
    if (!$('[data-help-page]').length) return;
    const cats = ['সব'].concat(HC.HELP.map(h => h.c).filter((c, i, a) => a.indexOf(c) === i));
    $('#helpCats').html(cats.map((c, i) => `<button type="button" class="chip-btn ${i ? '' : 'on'}" data-c="${c === 'সব' ? '' : c}">${c}</button>`).join(''));
    const draw = () => { const cat = $('#helpCats .on').data('c') || '', q = $('#helpQ').val(), list = HC.helpFind(q, cat); $('#helpList').html(list.length ? list.map((h, i) => accItem(h, i, 'hp')).join('') : '<div class="p-3 text-muted">কোনো উত্তর পাওয়া যায়নি। নিচে WhatsApp এ জিজ্ঞাসা করুন।</div>'); $('#helpCount').text(list.length + 'টি উত্তর'); };
    $(document).on('input', '#helpQ', draw).on('click', '#helpCats .chip-btn', function () { $('#helpCats .chip-btn').removeClass('on'); $(this).addClass('on'); draw(); });
    $('#helpWa').on('click', function (e) { e.preventDefault(); HC.waOpen && HC.waOpen('সহায়তা লাগবে: ' + ($('#helpQ').val() || '')); });
    draw();
  }
  function productHelp() {
    if (page !== 'product.html' || $('#pHelp').length) return;
    const p = HC.find(+qsv('id')); if (!p) return;
    const want = { 'ip-camera': ['ইনস্টলেশন', 'ওয়ারেন্টি', 'ডেলিভারি'], 'cc-camera': ['ইনস্টলেশন', 'ওয়ারেন্টি', 'ডেলিভারি'], security: ['ইনস্টলেশন', 'ওয়ারেন্টি', 'ডেলিভারি'], 'memory-card': ['ইনস্টলেশন', 'ওয়ারেন্টি'] }[p.cat] || ['ডেলিভারি', 'ওয়ারেন্টি', 'পেমেন্ট'];
    const list = HC.HELP.filter(h => want.indexOf(h.c) > -1).slice(0, 4);
    $('#related').prev('.section-head').before(`<div class="panel my-4" id="pHelp"><div class="d-flex justify-content-between align-items-center mb-2"><h2 class="h5 fw-bold m-0"><i class="bi bi-question-circle text-brand"></i> এই পণ্য নিয়ে সাধারণ প্রশ্ন</h2><a href="help.html" class="small">সব প্রশ্ন →</a></div><div class="accordion accordion-flush" id="pHelpAcc">${list.map((h, i) => accItem(h, i, 'ph')).join('')}</div></div>`);
  }

  /* ===== ১. অর্ডার সেলফ-সার্ভিস ===== */
  const findOrder = id => { const l = store.get('hc_last_order', null); if (l && String(l.id) === String(id)) return l; return HC.orders().find(x => String(x.id) === String(id)) || null; };
  const saveOrder = o => { const l = store.get('hc_last_order', null); if (l && l.id === o.id) store.set('hc_last_order', o); store.set('hc_orders', HC.orders().map(x => x.id === o.id ? o : x)); };
  const minsLeft = (o, w) => Math.ceil((w * 60000 - (Date.now() - new Date(o.date).getTime())) / 60000);
  const REASONS = ['ভুল পণ্য বেছেছি', 'দাম/অন্য জায়গায় কম পেয়েছি', 'ডেলিভারি ঠিকানা ভুল', 'আর দরকার নেই', 'অন্য কারণ'];
  HC.orderActions = function (o, $mount) {
    if (!o || !$mount.length) return;
    const dl = new Set(); let h = '';
    if (o.status === 'cancelled') {
      h = `<div class="alert alert-secondary mb-0"><i class="bi bi-x-octagon-fill text-danger"></i> <b>এই অর্ডার বাতিল হয়েছে</b> — ${esc((o.cancel || {}).reason || '')}${o.points && o.points.used ? ' · ব্যবহৃত ' + o.points.used + ' পয়েন্ট ফেরত দেওয়া হয়েছে' : ''}</div>`;
    } else {
      const cl = minsLeft(o, HC.SUPPORT.cancelMin), ed = minsLeft(o, HC.SUPPORT.editMin);
      if (cl > 0) h += `<div class="d-flex flex-wrap gap-2 align-items-center"><b class="me-auto"><i class="bi bi-sliders text-brand"></i> অর্ডার ম্যানেজ <small class="text-muted fw-normal">(আর ${cl} মিনিট)</small></b><button type="button" class="btn btn-soft btn-sm" id="ssEditBtn">ঠিকানা/ফোন বদলান</button><button type="button" class="btn btn-outline-danger btn-sm" id="ssCancelBtn">অর্ডার বাতিল</button></div>
        <form class="ss-form mt-2" id="ssCancel" hidden><label class="small text-muted" for="ssReason">বাতিলের কারণ</label><select class="form-select form-select-sm mb-2" id="ssReason">${REASONS.map(r => `<option>${r}</option>`).join('')}</select><button class="btn btn-danger btn-sm" type="submit">নিশ্চিত বাতিল করুন</button></form>
        <form class="ss-form mt-2" id="ssEdit" hidden novalidate><div class="row g-2"><div class="col-12"><input class="form-control form-control-sm" name="road" value="${esc(o.road || '')}" placeholder="বাসা / রোড / এলাকা" aria-label="রোড"></div><div class="col-6"><input class="form-control form-control-sm" name="thana" value="${esc(o.thana || '')}" placeholder="থানা / উপজেলা" aria-label="থানা"></div><div class="col-6"><select class="form-select form-select-sm" name="district" aria-label="জেলা">${HC.DISTRICTS.map(d => `<option ${d === o.district ? 'selected' : ''}>${d}</option>`).join('')}</select></div><div class="col-12"><input class="form-control form-control-sm" name="phone" value="${esc(o.phone || '')}" placeholder="01XXXXXXXXX" inputmode="tel" aria-label="ফোন"></div></div><div class="small text-danger mt-1" id="ssEditMsg"></div><button class="btn btn-brand btn-sm mt-2" type="submit">সংরক্ষণ করুন</button></form>`;
      else h += `<div class="small text-muted"><i class="bi bi-clock-history"></i> বাতিল/সম্পাদনার সময় (${HC.SUPPORT.cancelMin} মিনিট) শেষ। প্রয়োজনে <a href="#" class="ss-wa">WhatsApp এ জানান</a>।</div>`;
      h += `<div class="mt-2 small"><a href="rma.html?o=${o.id}"><i class="bi bi-arrow-return-left"></i> রিটার্ন / রিপেয়ার অনুরোধ</a> <span class="text-muted">(ডেলিভারির ${HC.SUPPORT.rmaDays} দিনের মধ্যে)</span></div>`;
    }
    $mount.html(h).data('oid', o.id).show();
  };
  $(document).on('click', '#ssCancelBtn', () => { $('#ssEdit').prop('hidden', true); $('#ssCancel').prop('hidden', false); });
  $(document).on('click', '#ssEditBtn', () => { $('#ssCancel').prop('hidden', true); $('#ssEdit').prop('hidden', false); });
  $(document).on('click', '.ss-wa', e => { e.preventDefault(); HC.waOpen && HC.waOpen('অর্ডার নিয়ে সাহায্য লাগবে'); });
  $(document).on('submit', '#ssCancel', function (e) {
    e.preventDefault(); const o = findOrder($('#selfServ').data('oid')); if (!o || o.status === 'cancelled' || minsLeft(o, HC.SUPPORT.cancelMin) <= 0) return;
    o.status = 'cancelled'; o.cancel = { reason: $('#ssReason').val(), at: new Date().toISOString() };
    if (o.points) store.set('hc_points', Math.max(0, HC.points() - (o.points.earned || 0)) + (o.points.used || 0));
    saveOrder(o); HC.toast('অর্ডার বাতিল হয়েছে'); HC.orderActions(o, $('#selfServ')); $(document).trigger('ordercancel', [o]);
  });
  $(document).on('submit', '#ssEdit', function (e) {
    e.preventDefault(); const o = findOrder($('#selfServ').data('oid')); if (!o || minsLeft(o, HC.SUPPORT.editMin) <= 0) return; const f = this.elements;
    const ph = HC.digits(f.phone.value).replace(/[\s-]/g, '').replace(/^\+?88/, '');
    if (!$.trim(f.road.value) || !$.trim(f.thana.value)) { $('#ssEditMsg').text('রোড ও থানা লিখুন'); return; }
    if (!/^01[3-9]\d{8}$/.test(ph)) { $('#ssEditMsg').text('সঠিক মোবাইল নাম্বার দিন'); return; }
    Object.assign(o, { road: $.trim(f.road.value), thana: $.trim(f.thana.value), district: f.district.value, phone: ph }); o.address = [o.road, o.thana, o.district].join(', ');
    saveOrder(o); $('#oAddr').text(o.address); $('#oPhone').html('<i class="bi bi-telephone"></i> ' + esc(ph)); $('#smsPhone').text(ph);
    HC.toast('ঠিকানা/ফোন হালনাগাদ হয়েছে ✓'); $('#ssEdit').prop('hidden', true);
  });
  function mountActions() {
    if ($('#oItems').length) { const o = store.get('hc_last_order', null); if (o && !$('#selfServ').length) { $('#oItems').after('<div class="panel my-3" id="selfServ"></div>'); HC.orderActions(o, $('#selfServ')); } }
    if ($('#tId').length) {                                                // ট্র্যাক পেজ: অর্ডার দেখানো হলে (আসল সংরক্ষিত অর্ডার হলে) সেলফ-সার্ভিস
      const sync = () => { const id = ($('#tId').text() || '').replace('#', ''), o = id && findOrder(id); $('#selfServ').remove(); if (o && o.items) { $('#tItems').after('<div class="panel my-3" id="selfServ"></div>'); HC.orderActions(o, $('#selfServ')); } };
      new MutationObserver(sync).observe($('#tId')[0], { childList: true, characterData: true, subtree: true }); sync();
    }
  }

  /* ===== ২. RMA (রিটার্ন/রিপেয়ার) ===== */
  HC.rmas = () => store.get('hc_rma', []);
  const STAGES = ['অনুরোধ গৃহীত', 'যাচাই চলছে', 'অনুমোদিত', 'পিকআপ / মেরামত', 'সমাধান সম্পন্ন'];
  const shrink = file => new Promise(res => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, 480 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * s)); c.height = Math.max(1, Math.round(im.height * s)); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .6)); }; im.onerror = () => res(''); im.src = r.result; }; r.onerror = () => res(''); r.readAsDataURL(file); });
  function rmaPage() {
    if (!$('[data-rma-page]').length) return;
    const orders = HC.orders(), pre = qsv('o');
    $('#rmaOrder').html('<option value="">— অর্ডার বেছে নিন —</option>' + orders.map(o => `<option value="${o.id}" ${String(o.id) === String(pre) ? 'selected' : ''}>#${o.id} · ${new Date(o.date).toLocaleDateString('bn-BD')} · ${B((o.totals || {}).total || 0)}</option>`).join('') + '<option value="other">অন্য / পুরোনো অর্ডার</option>');
    const u = store.get('hc_user', null) || {}, last = orders[0] || {}; $('#rmaPhone').val(last.phone || u.phone || '');
    const prods = id => { const o = orders.find(x => String(x.id) === String(id)); return o ? o.items.map(i => i.name + (i.label ? ' (' + i.label + ')' : '')) : D.products.map(p => p.name); };
    const fillProd = () => $('#rmaProd').html(prods($('#rmaOrder').val()).map(n => `<option>${esc(n)}</option>`).join(''));
    $('#rmaOrder').on('change', fillProd); fillProd();
    let photos = [];
    $('#rmaPhotos').on('change', async function () {
      photos = []; $('#rmaThumbs').empty(); const files = [].slice.call(this.files, 0, 3);
      for (const f of files) { if (!/^image\/(jpeg|png|webp)$/.test(f.type) || f.size > 3 * 1048576) { $('#rmaMsg').text('শুধু JPG/PNG/WebP, সর্বোচ্চ ৩MB'); continue; } const d = await shrink(f); if (d) { photos.push(d); $('#rmaThumbs').append(`<img src="${d}" alt="আপলোড করা ছবি" width="64" height="64" class="rounded-3 me-1">`); } }
    });
    $('#rmaForm').on('submit', function (e) {
      e.preventDefault(); const f = this.elements; let ok = true;
      const ph = HC.digits(f.phone.value).replace(/[\s-]/g, '').replace(/^\+?88/, ''); $(f.phone).toggleClass('is-invalid', !/^01[3-9]\d{8}$/.test(ph)); if (!/^01[3-9]\d{8}$/.test(ph)) ok = false;
      $(f.order).toggleClass('is-invalid', !f.order.value); if (!f.order.value) ok = false;
      const bad = $.trim(f.desc.value).length < 10; $(f.desc).toggleClass('is-invalid', bad); if (bad) ok = false;
      if (!ok) { $('#rmaMsg').text('লাল ঘরগুলো ঠিক করুন'); return; }
      const rma = { id: 'RMA-' + String(10000 + Math.floor(Math.random() * 89999)), order: f.order.value, phone: ph, product: f.prod.value, type: $(this).find('[name=type]:checked').val(), reason: f.reason.value, desc: $.trim(f.desc.value), photos, date: new Date().toISOString(), stage: 0 };
      store.set('hc_rma', [rma].concat(HC.rmas()).slice(0, 20)); this.reset(); photos = []; $('#rmaThumbs, #rmaMsg').empty(); fillProd(); HC.toast('অনুরোধ জমা হয়েছে ✓'); drawRma(rma.id);
    });
    function card(r) {
      return `<div class="rma-card panel mb-3" data-id="${r.id}"><div class="d-flex flex-wrap justify-content-between gap-2"><div><b class="text-brand">${r.id}</b> <span class="badge bg-dark">${esc(r.type)}</span></div><small class="text-muted">${new Date(r.date).toLocaleDateString('bn-BD')} · অর্ডার ${r.order === 'other' ? '—' : '#' + esc(r.order)}</small></div>
        <div class="small mt-1">${esc(r.product)} — ${esc(r.reason)}</div><ol class="rma-line mt-3">${STAGES.map((s, i) => `<li class="${i < r.stage ? 'done' : i === r.stage ? 'current' : ''}"><span class="dot">${i < r.stage ? '<i class="bi bi-check-lg"></i>' : i + 1}</span><span class="lbl">${s}</span></li>`).join('')}</ol>
        ${r.photos && r.photos.length ? '<div class="mt-2">' + r.photos.map(p => `<img src="${p}" width="48" height="48" class="rounded-3 me-1" alt="">`).join('') + '</div>' : ''}
        ${HC.SUPPORT.demoStages && r.stage < STAGES.length - 1 ? `<button class="btn btn-soft btn-sm mt-2 rma-next" type="button" data-id="${r.id}">ডেমো: পরের ধাপে যান</button>` : ''}</div>`;
    }
    function drawRma(focus) { const l = HC.rmas(); $('#rmaList').html(l.length ? l.map(card).join('') : '<div class="text-muted">এখনও কোনো অনুরোধ নেই।</div>'); if (focus) $('[data-id="' + focus + '"]')[0] && $('[data-id="' + focus + '"]')[0].scrollIntoView({ block: 'nearest' }); }
    $(document).on('click', '.rma-next', function () { const id = $(this).data('id'); store.set('hc_rma', HC.rmas().map(r => r.id === id ? Object.assign({}, r, { stage: Math.min(STAGES.length - 1, r.stage + 1) }) : r)); drawRma(); });
    $('#rmaFind').on('submit', function (e) {
      e.preventDefault(); const id = $.trim(this.elements.rid.value).toUpperCase(), ph = HC.digits(this.elements.rphone.value).replace(/[\s-]/g, '').replace(/^\+?88/, ''), r = HC.rmas().find(x => x.id === id && x.phone === ph);
      $('#rmaFound').html(r ? card(r) : '<div class="text-danger small">এই নম্বর ও ফোনে কোনো অনুরোধ পাওয়া যায়নি (ডেমোতে শুধু এই ব্রাউজারের অনুরোধ খোঁজা যায়)।</div>');
    });
    drawRma();
  }

  /* ===== ৫. সম্প্রতি তুলনা + অন্য ক্রেতারা দেখেছেন ===== */
  const cmpHist = () => store.get('hc_cmp_hist', []).filter(id => HC.find(id));
  const trackCmp = () => { const cur = HC.cmp(); if (!cur.length) return; store.set('hc_cmp_hist', cur.concat(cmpHist().filter(i => cur.indexOf(i) < 0)).slice(0, 8)); };
  $(document).on('cmpchange', trackCmp); $(trackCmp);
  function cmpHistory() {
    if (page !== 'compare.html') return;
    if (!$('#cmpHist').length) $('main').first().append('<section class="mt-4" id="cmpHist" aria-label="সম্প্রতি তুলনা"></section>');
    const draw = () => { const cur = HC.cmp(), l = cmpHist().filter(i => cur.indexOf(i) < 0).slice(0, 6);
      $('#cmpHist').html(l.length ? `<h2 class="h6 fw-bold mb-2"><i class="bi bi-clock-history text-brand"></i> সম্প্রতি তুলনা করা পণ্য</h2><div class="d-flex flex-wrap gap-2">${l.map(id => { const p = HC.find(id); return `<button type="button" class="chip-btn cmp-readd" data-id="${id}" ${cur.length >= 3 ? 'disabled' : ''}><img src="${p.img}" alt="" width="24" height="24" class="rounded-circle me-1">${esc(p.name.slice(0, 28))} <i class="bi bi-plus-lg"></i></button>`; }).join('')}</div>${cur.length >= 3 ? '<div class="small text-muted mt-1">সর্বোচ্চ ৩টি; আগে একটি সরান।</div>' : ''}` : ''); };
    $(document).on('click', '.cmp-readd', function () { const c = HC.cmp(); if (c.length >= 3) return; store.set('hc_cmp', c.concat(+$(this).data('id'))); $(document).trigger('cmpchange'); HC.renderCmpBar && HC.renderCmpBar(); location.reload(); });
    draw();
  }
  HC.alsoViewed = (id, n) => {
    const co = store.get('hc_coview', {}) || {}, me = HC.find(id), mp = HC.minPrice(me).sale;
    return D.products.filter(p => p.id !== +id).map(p => { const k = [Math.min(id, p.id), Math.max(id, p.id)].join('-'); const pr = HC.minPrice(p).sale; return { p, s: (co[k] || 0) * 10 + (p.cat === me.cat ? 3 : 0) + Math.max(0, 2 - Math.abs(Math.log(pr / mp))) + (p.rating || 0) / 10 }; }).sort((a, b) => b.s - a.s).slice(0, n || 4).map(x => x.p);
  };
  function alsoViewed() {
    if (page !== 'product.html' || $('#alsoViewed').length) return; const id = +qsv('id'); if (!HC.find(id)) return;
    const co = store.get('hc_coview', {}) || {}; HC.recent().filter(r => r !== id).slice(0, 3).forEach(r => { const k = [Math.min(id, r), Math.max(id, r)].join('-'); co[k] = (co[k] || 0) + 1; }); store.set('hc_coview', co);
    const list = HC.alsoViewed(id, 4); if (!list.length) return;
    $('#related').prev('.section-head').before('<div class="section-head"><h2>অন্য ক্রেতারা এগুলোও দেখেছেন</h2></div><div class="row g-3 mb-4" id="alsoViewed"></div>'); HC.grid('#alsoViewed', list);
  }

  /* ===== ৬. স্টোর লোকেটার + স্টোর থেকে সংগ্রহ ===== */
  HC.STORES = [
    { id: 'mirpur', name: 'HitsCam শো-রুম — মিরপুর', addr: 'মিরপুর-১০, ঢাকা (ডেমো ঠিকানা — আসলটি বসান)', phone: '+880 1614-747054', lat: 23.8069, lng: 90.3687, hours: [10, 20] },
    { id: 'gazipur', name: 'HitsCam পিকআপ পয়েন্ট — গাজীপুর', addr: 'গাজীপুর চৌরাস্তা (ডেমো ঠিকানা)', phone: '+880 1614-747054', lat: 23.9999, lng: 90.4203, hours: [10, 19] },
    { id: 'ctg', name: 'HitsCam শো-রুম — চট্টগ্রাম', addr: 'আগ্রাবাদ, চট্টগ্রাম (ডেমো ঠিকানা)', phone: '+880 1614-747054', lat: 22.3249, lng: 91.8125, hours: [10, 20] }
  ];
  const bdNow = () => { const d = new Date(Date.now() + (new Date().getTimezoneOffset() + 360) * 60000); return { day: d.getDay(), h: d.getHours() + d.getMinutes() / 60 }; };
  HC.storeOpen = s => { const n = bdNow(); return n.day !== 5 && n.h >= s.hours[0] && n.h < s.hours[1]; };          // শুক্রবার বন্ধ
  const hav = (a, b, c, d) => { const r = x => x * Math.PI / 180, dl = r(c - a), dg = r(d - b), h = Math.sin(dl / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dg / 2) ** 2; return 6371 * 2 * Math.asin(Math.sqrt(h)); };
  const hr = h => (h < 12 ? 'সকাল ' : h < 16 ? 'দুপুর ' : h < 18 ? 'বিকাল ' : h < 20 ? 'সন্ধ্যা ' : 'রাত ') + (h > 12 ? h - 12 : h) + 'টা';
  function storesPage() {
    if (!$('[data-stores-page]').length) return;
    let pos = null;
    const draw = () => { const l = HC.STORES.map(s => Object.assign({ km: pos ? hav(pos[0], pos[1], s.lat, s.lng) : null }, s)); if (pos) l.sort((a, b) => a.km - b.km);
      $('#storeList').html(l.map(s => `<div class="col-md-6 col-lg-4"><div class="panel h-100 store-card" data-id="${s.id}"><div class="d-flex justify-content-between"><h2 class="h6 fw-bold">${s.name}</h2><span class="badge ${HC.storeOpen(s) ? 'bg-success' : 'bg-secondary'}">${HC.storeOpen(s) ? 'এখন খোলা' : 'বন্ধ'}</span></div>
        <div class="small text-muted mb-2">${s.addr}</div><div class="small"><i class="bi bi-clock"></i> শনি–বৃহস্পতি ${hr(s.hours[0])} – ${hr(s.hours[1])} · শুক্র বন্ধ</div><div class="small"><i class="bi bi-telephone"></i> <a href="tel:${s.phone.replace(/\s|-/g, '')}">${s.phone}</a></div>${s.km != null ? `<div class="small text-brand mt-1"><i class="bi bi-geo-alt-fill"></i> প্রায় ${s.km.toFixed(1)} কিমি দূরে</div>` : ''}
        <div class="d-flex gap-2 mt-3"><a class="btn btn-soft btn-sm" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}"><i class="bi bi-map"></i> ম্যাপে দেখুন</a><a class="btn btn-brand btn-sm" href="checkout.html" data-pick="${s.id}">এখান থেকে সংগ্রহ</a></div></div></div>`).join('')); };
    $('#nearBtn').on('click', function () { if (!navigator.geolocation) { $('#nearMsg').text('আপনার ব্রাউজারে লোকেশন সাপোর্ট নেই'); return; } $('#nearMsg').text('লোকেশন নেওয়া হচ্ছে…'); navigator.geolocation.getCurrentPosition(p => { pos = [p.coords.latitude, p.coords.longitude]; $('#nearMsg').text('কাছের স্টোর আগে দেখানো হচ্ছে'); draw(); }, () => $('#nearMsg').text('লোকেশন পাওয়া যায়নি — অনুমতি দিন বা ম্যানুয়ালি বেছে নিন'), { timeout: 8000 }); });
    $(document).on('click', '[data-pick]', function () { store.set('hc_pickup', $(this).data('pick')); });
    draw();
  }
  const pickupId = () => store.get('hc_pickup', null);
  const baseTotals = HC.totals;
  HC.totals = function () { const t = baseTotals(), p = pickupId(); if (p && HC.cart().length) { t.pickup = p; t.total = Math.max(0, t.total - t.ship); t.ship = 0; } return t; };
  const baseDetails = HC.detailsForm;
  HC.detailsForm = function () {
    const html = baseDetails.apply(this, arguments), p = pickupId();
    const box = `<label class="ship-opt pickup-opt"><input type="checkbox" class="form-check-input" id="pickupChk" ${p ? 'checked' : ''}><span>স্টোর থেকে নিজে সংগ্রহ <small class="text-muted">(শিপিং ফ্রি)</small></span></label><div class="pickup-sel" id="pickupSel" ${p ? '' : 'hidden'}><select class="form-select form-select-sm" id="pickupStore" aria-label="স্টোর">${HC.STORES.map(s => `<option value="${s.id}" ${s.id === p ? 'selected' : ''}>${s.name}</option>`).join('')}</select></div>`;
    const re = /(<input[^>]*ship-radio[^>]*value="130"[\s\S]*?<\/label>)/;
    return re.test(html) ? html.replace(re, '$1' + box) : html;
  };
  $(document).on('change', '#pickupChk', function () { store.set('hc_pickup', this.checked ? $('#pickupStore').val() || HC.STORES[0].id : null); $('#pickupSel').prop('hidden', !this.checked); $(document).trigger('cartchange'); });
  $(document).on('change', '#pickupStore', function () { store.set('hc_pickup', this.value); });
  const baseFin = HC.finalizeOrder;
  HC.finalizeOrder = function (order) { const p = pickupId(); if (p) { const s = HC.STORES.find(x => x.id === p); order.pickup = p; order.address = 'স্টোর থেকে সংগ্রহ: ' + (s ? s.name : p) + ' (' + order.address + ')'; } store.set('hc_pickup', null); return baseFin.call(this, order); };
  $(document).on('cartchange', () => { if ($('#pickupChk').length) { $('#pickupChk').prop('checked', !!pickupId()); $('#pickupSel').prop('hidden', !pickupId()); } });

  $(function () { helpPage(); productHelp(); rmaPage(); storesPage(); cmpHistory(); alsoViewed(); setTimeout(mountActions, 0); });
})(jQuery);
