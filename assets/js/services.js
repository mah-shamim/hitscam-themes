/* v1.10.0 — বিক্রি বাড়ানোর সেবা:
   ১. ইনস্টলেশন সেবা (এলাকা অনুযায়ী দাম + সময়ের স্লট)   ২. এক্সটেন্ডেড ওয়ারেন্টি / দুর্ঘটনাজনিত ক্ষতি কভার
   ৩. "আমার সেটআপে চলবে?" কম্প্যাটিবিলিটি চেকার (প্রোডাক্ট পেজ)
   ৪. লয়ালটি পয়েন্ট ও রেফারেল কোড                      ৫. অর্ডারের পরে এক-ক্লিক আপসেল
   app.js এর পরে লোড হয়। HC.totals / HC.totalsHtml / HC.waCartText / HC.finalizeOrder মুড়ে (wrap) কাজ করে,
   তাই app.js বদলাতে হয় না। সব মান নিচের HC.SVC / HC.LOYALTY / HC.REF এ বদলানো যায়।
   ⚠ রেফারেল/পয়েন্ট ডেমোতে ব্রাউজারেই থাকে; আসল প্রজেক্টে সার্ভারে যাচাই করুন (একজনের একাধিক অ্যাকাউন্ট ঠেকাতে)। */
(function ($) {
  'use strict';
  const HC = window.HC; if (!HC) return;
  const store = HC.store, B = HC.BDT;

  HC.SVC = {
    cats: ['ip-camera', 'cc-camera', 'security'],                       // যেসব ক্যাটাগরিতে ইনস্টলেশন/ওয়ারেন্টি প্রযোজ্য
    install: { dhaka: 500, out: 900 },                                   // ঢাকার ভিতরে / বাইরে (এলাকা চেকআউটের শিপিং জোন থেকে)
    slots: ['সকাল ১০টা – দুপুর ১২টা', 'দুপুর ১২টা – ৩টা', 'বিকাল ৩টা – ৬টা'],
    warranty: [{ id: 'none', label: 'কোনোটি নয়', pct: 0 }, { id: 'ext', label: '+১ বছর এক্সটেন্ডেড ওয়ারেন্টি', pct: 8 }, { id: 'acc', label: '+১ বছর ওয়ারেন্টি + দুর্ঘটনাজনিত ক্ষতি কভার', pct: 14 }]
  };
  HC.LOYALTY = { earnPer100: 2, pointValue: 1, minRedeem: 50, maxPct: 20 };   // ৳১০০ এ ২ পয়েন্ট; ১ পয়েন্ট = ৳১; সর্বোচ্চ সাবটোটালের ২০%
  HC.REF = { discount: 200, min: 2000, pattern: /^HC-[A-Z0-9]{6}$/ };

  const get = () => Object.assign({ install: false, slot: HC.SVC.slots[0], warranty: 'none', pts: false }, store.get('hc_svc', {}) || {});
  const put = s => store.set('hc_svc', s);
  const camLines = () => HC.cart().filter(i => { const p = HC.find(i.id); return p && HC.SVC.cats.indexOf(p.cat) > -1; });
  const camSub = () => camLines().reduce((s, i) => s + i.sale * i.qty, 0);
  const zone = () => (+HC.ship() === 70 ? 'dhaka' : 'out');
  HC.points = () => Math.max(0, +store.get('hc_points', 0) || 0);

  /* ---------- রেফারেল কোড ---------- */
  HC.refCode = () => {
    let c = store.get('hc_ref_code', null);
    if (!c) { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; c = 'HC-'; for (let i = 0; i < 6; i++) c += a[Math.floor(Math.random() * a.length)]; store.set('hc_ref_code', c); }
    return c;
  };
  const refApplied = () => store.get('hc_ref_applied', null);
  HC.applyRef = raw => {
    const code = String(raw || '').trim().toUpperCase();
    if (!HC.REF.pattern.test(code)) return { ok: false, msg: 'কোডের ফরম্যাট ঠিক নয় (যেমন HC-AB12CD)' };
    if (code === HC.refCode()) return { ok: false, msg: 'নিজের কোড নিজে ব্যবহার করা যায় না' };
    if (HC.orders().length) return { ok: false, msg: 'রেফারেল ছাড় শুধু প্রথম অর্ডারে' };
    store.set('hc_ref_applied', code); $(document).trigger('cartchange');
    return { ok: true, msg: 'কোড যুক্ত হয়েছে ✓' };
  };

  /* ---------- totals মুড়ে সেবা/পয়েন্ট/রেফারেল যোগ ---------- */
  const baseTotals = HC.totals;
  HC.totals = function () {
    const t = baseTotals(), s = get(), cams = camSub();
    t.inst = s.install && cams ? HC.SVC.install[zone()] : 0;
    const w = HC.SVC.warranty.find(x => x.id === s.warranty) || HC.SVC.warranty[0];
    t.warr = cams ? Math.round(cams * w.pct / 100 / 10) * 10 : 0;
    t.svc = t.inst + t.warr;
    const room = Math.max(0, Math.floor((t.sub - t.disc) * HC.LOYALTY.maxPct / 100));
    t.pts = s.pts && HC.points() >= HC.LOYALTY.minRedeem ? Math.min(HC.points(), Math.floor(room / HC.LOYALTY.pointValue)) : 0;
    t.loy = t.pts * HC.LOYALTY.pointValue;
    t.refd = refApplied() && t.sub - t.disc >= HC.REF.min && !HC.orders().length ? HC.REF.discount : 0;
    t.total = Math.max(0, t.total + t.svc - t.loy - t.refd);
    t.earn = Math.floor(Math.max(0, t.total - t.ship) / 100) * HC.LOYALTY.earnPer100;
    return t;
  };
  const baseHtml = HC.totalsHtml;
  HC.totalsHtml = function () {
    const t = HC.totals(); let rows = '';
    if (t.inst) rows += `<div class="totals-row"><span>ইনস্টলেশন সেবা</span><b>${B(t.inst)}</b></div>`;
    if (t.warr) rows += `<div class="totals-row"><span>এক্সটেন্ডেড ওয়ারেন্টি</span><b>${B(t.warr)}</b></div>`;
    if (t.loy) rows += `<div class="totals-row text-success"><span>পয়েন্ট ব্যবহার (${t.pts})</span><b>-${B(t.loy)}</b></div>`;
    if (t.refd) rows += `<div class="totals-row text-success"><span>রেফারেল ছাড়</span><b>-${B(t.refd)}</b></div>`;
    if (t.earn && HC.cart().length) rows += `<div class="totals-row small text-muted"><span><i class="bi bi-stars text-warning"></i> এই অর্ডারে পাবেন</span><b>${t.earn} পয়েন্ট</b></div>`;
    const html = baseHtml.apply(this, arguments), key = '<div class="totals-row"><span>Shipping</span>';
    return rows && html.indexOf(key) > -1 ? html.replace(key, rows + key) : html;
  };
  if (HC.waCartText) {
    const baseWa = HC.waCartText;
    HC.waCartText = function () {
      const t = HC.totals(), s = get(); let extra = '';
      if (t.inst) extra += `\nইনস্টলেশন: ${B(t.inst)} (${s.slot})`;
      if (t.warr) extra += `\nএক্সটেন্ডেড ওয়ারেন্টি: ${B(t.warr)}`;
      return baseWa.apply(this, arguments) + extra;
    };
  }
  // অর্ডার চূড়ান্ত হলে সেবা/পয়েন্ট অর্ডারে সেভ, পয়েন্ট ব্যালেন্স হালনাগাদ
  const baseFinal = HC.finalizeOrder;
  HC.finalizeOrder = function (order) {
    const t = order.totals || {}, s = get();
    if (t.inst || t.warr) order.services = { install: t.inst ? { fee: t.inst, slot: s.slot, area: zone() } : null, warranty: t.warr ? { id: s.warranty, fee: t.warr } : null };
    order.points = { used: t.pts || 0, earned: t.earn || 0 };
    order.refUsed = t.refd ? refApplied() : null;
    store.set('hc_points', Math.max(0, HC.points() - (t.pts || 0)) + (t.earn || 0));
    store.set('hc_svc', null); if (t.refd) store.set('hc_ref_applied', null);
    return baseFinal.call(this, order);
  };

  /* ---------- কার্ট পেজ: "অতিরিক্ত সেবা" প্যানেল ---------- */
  function svcPanel() {
    if (!$('[data-cart-page]').length) return;
    if (!$('#svcPanel').length) $('#cartList').after('<div class="panel mb-3" id="svcPanel"></div>');
    const c = HC.cart(); if (!c.length) { $('#svcPanel').empty().hide(); return; }
    const s = get(), t = HC.totals(), cams = camSub(), bal = HC.points(), ref = refApplied();
    let h = '<h2 class="h6 fw-bold mb-3"><i class="bi bi-stars text-brand"></i> অতিরিক্ত সেবা ও পুরস্কার</h2>';
    if (cams) {
      h += `<div class="svc-block"><label class="svc-row"><input type="checkbox" class="form-check-input" id="svcInstall" ${s.install ? 'checked' : ''}><span><b>প্রফেশনাল ইনস্টলেশন</b> <small class="text-muted">— টেকনিশিয়ান গিয়ে সেটআপ করে দেবেন</small></span><b class="ms-auto text-brand">${B(HC.SVC.install[zone()])}</b></label>
        <div class="svc-sub" id="svcSlotWrap" ${s.install ? '' : 'hidden'}><label class="small text-muted" for="svcSlot">পছন্দের সময়</label><select class="form-select form-select-sm" id="svcSlot">${HC.SVC.slots.map(x => `<option ${x === s.slot ? 'selected' : ''}>${x}</option>`).join('')}</select></div></div>`;
      h += '<div class="svc-block"><div class="small fw-semibold mb-1">ওয়ারেন্টি কভার</div>' + HC.SVC.warranty.map(w => `<label class="svc-row"><input type="radio" class="form-check-input svc-w" name="svcW" value="${w.id}" ${s.warranty === w.id ? 'checked' : ''}><span>${w.label}</span><b class="ms-auto">${w.pct ? '+' + B(Math.round(cams * w.pct / 100 / 10) * 10) : ''}</b></label>`).join('') + '</div>';
    }
    h += `<div class="svc-block"><label class="svc-row ${bal >= HC.LOYALTY.minRedeem ? '' : 'text-muted'}"><input type="checkbox" class="form-check-input" id="svcPts" ${s.pts ? 'checked' : ''} ${bal >= HC.LOYALTY.minRedeem ? '' : 'disabled'}><span><b>লয়ালটি পয়েন্ট</b> — আপনার ব্যালেন্স: <b>${bal}</b> পয়েন্ট ${bal >= HC.LOYALTY.minRedeem ? '' : `<small>(কমপক্ষে ${HC.LOYALTY.minRedeem} পয়েন্ট লাগে)`}</small></span><b class="ms-auto text-success">${t.loy ? '-' + B(t.loy) : ''}</b></label>
      <div class="small text-muted ps-4">এই অর্ডারে পাবেন <b>${t.earn}</b> পয়েন্ট · ১ পয়েন্ট = ${B(HC.LOYALTY.pointValue)}, সর্বোচ্চ ${HC.LOYALTY.maxPct}% পর্যন্ত ব্যবহার করা যায়।</div></div>`;
    h += `<div class="svc-block"><div class="small fw-semibold mb-1">রেফারেল</div>
      ${ref ? `<div class="small text-success mb-1"><i class="bi bi-check-circle-fill"></i> কোড <b>${ref}</b> যুক্ত${t.refd ? ' — ' + B(t.refd) + ' ছাড়' : ` (ছাড় পেতে অর্ডার কমপক্ষে ${B(HC.REF.min)}${HC.orders().length ? ', শুধু প্রথম অর্ডারে' : ''})`} <button class="btn btn-link btn-sm p-0 ms-1" id="refClear" type="button">সরান</button></div>` :
        `<div class="input-group input-group-sm"><input class="form-control" id="refInput" placeholder="বন্ধুর কোড (HC-XXXXXX)" maxlength="9" autocapitalize="characters" aria-label="রেফারেল কোড"><button class="btn btn-brand" id="refApply" type="button">যুক্ত করুন</button></div><div class="small text-danger mt-1" id="refMsg"></div>`}
      <div class="small text-muted mt-2">আপনার কোড: <b class="text-brand" id="myRef">${HC.refCode()}</b> — বন্ধু প্রথম অর্ডারে ${B(HC.REF.discount)} ছাড় পাবেন (অর্ডার ${B(HC.REF.min)}+)। <a href="#" id="refShare">WhatsApp এ শেয়ার</a></div></div>`;
    $('#svcPanel').html(h).show();
  }
  $(document).on('change', '#svcInstall', function () { const s = get(); s.install = this.checked; put(s); $(document).trigger('cartchange'); });
  $(document).on('change', '#svcSlot', function () { const s = get(); s.slot = this.value; put(s); });
  $(document).on('change', '.svc-w', function () { const s = get(); s.warranty = this.value; put(s); $(document).trigger('cartchange'); });
  $(document).on('change', '#svcPts', function () { const s = get(); s.pts = this.checked; put(s); $(document).trigger('cartchange'); });
  $(document).on('click', '#refApply', function () { const r = HC.applyRef($('#refInput').val()); if (!r.ok) $('#refMsg').text(r.msg); else HC.toast(r.msg); });
  $(document).on('keydown', '#refInput', e => { if (e.key === 'Enter') { e.preventDefault(); $('#refApply').trigger('click'); } });
  $(document).on('click', '#refClear', () => { store.set('hc_ref_applied', null); $(document).trigger('cartchange'); });
  $(document).on('click', '#refShare, .ref-share', function (e) { e.preventDefault(); HC.waOpen ? HC.waOpen(`HitsCam থেকে কিনলে প্রথম অর্ডারে ${B(HC.REF.discount)} ছাড়! আমার কোড: ${HC.refCode()} (অর্ডার ${B(HC.REF.min)}+) — ${location.origin}`) : null; });
  $(function () { svcPanel(); });
  $(document).on('cartchange', function () { if ($('#svcPanel').length || $('[data-cart-page]').length) svcPanel(); });

  /* ---------- প্রোডাক্ট পেজ: কম্প্যাটিবিলিটি চেকার ---------- */
  const OPT = { power: [['220', '২২০V সকেট আছে'], ['solar', 'সোলার/ব্যাটারি'], ['usb', 'USB পাওয়ার ব্যাংক/অ্যাডাপ্টার'], ['none', 'কোনো পাওয়ার নেই']], net: [['wifi', 'WiFi রাউটার আছে'], ['sim', '4G SIM (ডাটা) আছে'], ['none', 'ইন্টারনেট নেই']] };
  const F = { power: { k: 'power', label: 'পাওয়ার কী আছে?', opts: OPT.power }, net: { k: 'net', label: 'ইন্টারনেট কী?', opts: OPT.net } };
  const verdict = (checks) => { const bad = checks.filter(c => !c.ok); return bad.length ? { ok: false, msg: bad.map(b => b.msg).join(' ') } : { ok: true, msg: checks.map(c => c.msg).join(' ') }; };
  HC.COMPAT = {
    1: { title: '4G PTZ ক্যামেরা', fields: [F.power, F.net], rule: s => verdict([
      { ok: s.power === '220', msg: s.power === '220' ? '২২০V অ্যাডাপ্টারে চলবে।' : 'এই মডেলে ২২০V অ্যাডাপ্টার লাগে (সোলার প্যানেল আলাদা কিনলে দিনে চলে)।' },
      { ok: s.net === 'sim', msg: s.net === 'sim' ? '4G SIM এ সরাসরি চলবে।' : 'এটি SIM-ভিত্তিক মডেল; WiFi/ইন্টারনেট ছাড়া চলবে না — WiFi মডেল দেখুন।' }]) },
    2: { title: 'সোলার ৪ লেন্স ক্যামেরা', fields: [F.power, F.net], rule: s => verdict([
      { ok: true, msg: 'বিল্ট-ইন সোলার, তাই বিদ্যুৎ ছাড়াই চলে।' },
      { ok: s.net === 'sim' || s.net === 'wifi', msg: s.net === 'none' ? 'ইন্টারনেট ছাড়া লাইভ দেখা যাবে না — SIM বা WiFi লাগবে (SD কার্ডে রেকর্ড হবে)।' : 'কানেকশন অপশন (SIM/WiFi) বেছে নিন, দুটোতেই চলে।' }]) },
    8: { title: 'WiFi ইনডোর ক্যামেরা', fields: [F.power, F.net], rule: s => verdict([
      { ok: s.power === '220' || s.power === 'usb', msg: s.power === 'none' || s.power === 'solar' ? 'ইনডোর মডেলে ৫V USB/২২০V লাগে।' : 'USB/২২০V এ চলবে।' },
      { ok: s.net === 'wifi', msg: s.net === 'wifi' ? '২.৪GHz WiFi এ চলবে।' : 'এটি শুধু WiFi মডেল; রাউটার লাগবে।' }]) },
    11: { title: 'Mini WiFi ক্যামেরা', fields: [F.power, F.net], rule: s => verdict([
      { ok: s.power === '220' || s.power === 'usb', msg: s.power === 'none' || s.power === 'solar' ? '৫V USB পাওয়ার লাগে (পাওয়ার ব্যাংকেও চলে)।' : 'USB/পাওয়ার ব্যাংকে চলবে।' },
      { ok: s.net === 'wifi', msg: s.net === 'wifi' ? 'WiFi এ চলবে।' : 'WiFi রাউটার লাগবে।' }]) },
    9: { title: '৮ চ্যানেল DVR', fields: [{ k: 'cam', label: 'আপনার ক্যামেরা কোন ধরনের?', opts: [['analog', 'অ্যানালগ/HD CCTV (BNC)'], ['ip', 'IP/PoE ক্যামেরা'], ['wifi', 'WiFi ক্যামেরা']] }, { k: 'disp', label: 'ডিসপ্লে?', opts: [['hdmi', 'HDMI মনিটর/টিভি আছে'], ['none', 'নেই']] }], rule: s => verdict([
      { ok: s.cam === 'analog', msg: s.cam === 'analog' ? 'অ্যানালগ/HD ক্যামেরা (BNC) সরাসরি লাগবে।' : 'এই DVR শুধু অ্যানালগ/HD (BNC) ক্যামেরার; IP/WiFi ক্যামেরার জন্য NVR লাগে।' },
      { ok: s.disp === 'hdmi', msg: s.disp === 'hdmi' ? 'HDMI তে সরাসরি দেখা যাবে।' : 'লোকাল দেখতে HDMI মনিটর/টিভি লাগবে (মোবাইলে দেখা যাবে)।' }]) },
    5: { title: '৬৪GB মেমোরি কার্ড', fields: [{ k: 'dev', label: 'কোন ডিভাইসে লাগাবেন?', opts: [['solar', 'সোলার ৪ লেন্স ক্যামেরা'], ['ptz', '4G PTZ ক্যামেরা'], ['wifi', 'WiFi/Mini ক্যামেরা'], ['phone', 'স্মার্টফোন'], ['dvr', 'DVR/NVR']] }], rule: s => s.dev === 'dvr' ? { ok: false, msg: 'DVR/NVR এ মেমোরি কার্ড নয়, হার্ডডিস্ক (HDD) লাগে।' } : s.dev === 'phone' ? { ok: true, msg: 'মাইক্রোSD স্লট থাকলে চলবে (ডুয়াল-সিম ফোনে স্লট শেয়ার্ড হতে পারে)।' } : { ok: true, msg: '৬৪GB Class 10 কার্ড এই ডিভাইসে সাপোর্টেড — রেকর্ডিং চলবে।' } },
    4: { title: 'মিনি UPS 12V', fields: [{ k: 'dev', label: 'কী চালাবেন?', opts: [['router', 'WiFi রাউটার (১২V)'], ['cam', '১২V ক্যামেরা'], ['dvr', 'DVR'], ['phone', 'মোবাইল চার্জ']] }], rule: s => s.dev === 'router' || s.dev === 'cam' ? { ok: true, msg: '১২V ডিভাইসে চলবে — লোড লিখে দেওয়া ব্যাকআপ সময় দেখুন।' } : { ok: false, msg: s.dev === 'dvr' ? 'DVR এর লোড বেশি; বড় UPS লাগবে।' : 'এটি ১২V ডিসি আউটপুট; ফোন চার্জের জন্য USB পাওয়ার ব্যাংক ভালো।' } },
    7: { title: '১০W সোলার প্যানেল', fields: [{ k: 'dev', label: 'কোন ক্যামেরার সাথে?', opts: [['ptz', '4G PTZ ক্যামেরা'], ['solar', 'সোলার ৪ লেন্স (বিল্ট-ইন আছে)'], ['indoor', 'ইনডোর ক্যামেরা']] }], rule: s => s.dev === 'ptz' ? { ok: true, msg: 'দিনের বেলা চার্জ হবে, রাতে ব্যাটারি চলবে।' } : { ok: false, msg: s.dev === 'solar' ? 'এই ক্যামেরায় সোলার আগে থেকেই আছে, আলাদা লাগবে না।' : 'ইনডোর ক্যামেরায় সোলার কাজে লাগে না।' } }
  };
  function compatBox() {
    const m = /product\.html/.test(location.pathname) && new URLSearchParams(location.search).get('id'); if (!m) return;
    const r = HC.COMPAT[+m]; if (!r || $('#pCompat').length) return;
    const sel = r.fields.map(f => `<div class="col-12 col-sm"><label class="small text-muted" for="cp-${f.k}">${f.label}</label><select class="form-select form-select-sm cp-sel" id="cp-${f.k}" data-k="${f.k}"><option value="">— বেছে নিন —</option>${f.opts.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('')}</select></div>`).join('');
    const box = `<div class="compat-box" id="pCompat"><div class="fw-semibold mb-2"><i class="bi bi-patch-check text-brand"></i> আমার সেটআপে চলবে?</div><div class="row g-2">${sel}</div><div class="compat-res mt-2" id="cpRes" role="status" aria-live="polite"></div></div>`;
    ($('#pDeliv').length ? $('#pDeliv').before(box) : $('#pBuy').after(box));
  }
  $(document).on('change', '.cp-sel', function () {
    const id = +new URLSearchParams(location.search).get('id'), r = HC.COMPAT[id], v = {}; let all = true;
    $('.cp-sel').each(function () { v[$(this).data('k')] = this.value; if (!this.value) all = false; });
    if (!all) { $('#cpRes').empty(); return; }
    const res = r.rule(v), wa = res.ok ? '' : ` <a href="#" class="wa-ask" data-q="${encodeURIComponent(r.title + ' সম্পর্কে জানতে চাই: ' + res.msg)}">বিশেষজ্ঞকে জিজ্ঞাসা করুন</a>`;
    $('#cpRes').attr('class', 'compat-res mt-2 ' + (res.ok ? 'ok' : 'bad')).html(`<i class="bi ${res.ok ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i> <b>${res.ok ? 'চলবে।' : 'মিলছে না।'}</b> ${res.msg}${wa}`);
  });
  $(document).on('click', '.wa-ask', function (e) { e.preventDefault(); HC.waOpen && HC.waOpen(decodeURIComponent($(this).data('q'))); });
  $(function () { compatBox(); });

  /* ---------- অর্ডার-পরবর্তী আপসেল (order-received) ---------- */
  const UPSELL_MS = 30 * 60 * 1000;
  function postUpsell() {
    if (!$('#oItems').length) return;
    const o = store.get('hc_last_order', null); if (!o || o.upsold || !o.items) return;
    if (Date.now() - new Date(o.date).getTime() > UPSELL_MS) return;
    const has = id => o.items.some(i => i.id === id), hasCam = o.items.some(i => { const p = HC.find(i.id); return p && HC.SVC.cats.indexOf(p.cat) > -1; });
    const pick = [5, 7, 6, 4].find(id => !has(id) && (id === 5 || id === 4 ? hasCam : hasCam)); if (!pick) return;
    const p = HC.find(pick), opt = HC.options(p)[HC.lowest(p)], left = Math.max(0, Math.ceil((UPSELL_MS - (Date.now() - new Date(o.date).getTime())) / 60000));
    $('#oItems').after(`<div class="panel post-upsell my-3" id="postUpsell"><div class="d-flex gap-3 align-items-center"><img src="${p.img}" width="64" height="64" class="rounded-3" alt=""><div class="flex-grow-1"><div class="small text-brand fw-semibold"><i class="bi bi-plus-circle-fill"></i> অর্ডারের সাথে যোগ করুন · আর ${left} মিনিট</div><div class="fw-semibold">${p.name}</div><div class="small text-muted">একই ঠিকানায় একই প্যাকেজে যাবে, ডেলিভারিতে পরিশোধ</div></div><div class="text-end"><div class="fw-bold text-brand">${B(opt.sale)}</div><button class="btn btn-brand btn-sm rounded-pill mt-1" id="upsellAdd" type="button" data-id="${p.id}">যোগ করুন</button></div></div></div>`);
  }
  $(document).on('click', '#upsellAdd', function () {
    const o = store.get('hc_last_order', null); if (!o || o.upsold) return;
    const p = HC.find(+$(this).data('id')), oi = HC.lowest(p), opt = HC.options(p)[oi];
    o.items.push({ key: p.id + '|' + oi, id: p.id, name: p.name, label: opt.label || '', img: p.img, regular: opt.regular, sale: opt.sale, qty: 1, late: true });
    o.totals.sub += opt.sale; o.totals.total += opt.sale; if (o.due) o.due += opt.sale; o.upsold = true;
    store.set('hc_last_order', o); store.set('hc_orders', HC.orders().map(x => x.id === o.id ? o : x));
    HC.toast('অর্ডারে যোগ হয়েছে ✓'); setTimeout(() => location.reload(), 500);
  });
  // order-received এ সেবা/পয়েন্ট সারি (মূল ইনলাইন স্ক্রিপ্ট শুধু Subtotal/Discount/Shipping দেখায়)
  function orderRows() {
    if (!$('#oDiscRow').length) return;
    const o = store.get('hc_last_order', null); if (!o || !o.totals) return; const t = o.totals; let r = '';
    if (t.inst) r += `<div class="totals-row"><span>ইনস্টলেশন সেবা${o.services && o.services.install ? ' (' + o.services.install.slot + ')' : ''}:</span><span>${B(t.inst)}</span></div>`;
    if (t.warr) r += `<div class="totals-row"><span>এক্সটেন্ডেড ওয়ারেন্টি:</span><span>${B(t.warr)}</span></div>`;
    if (t.loy) r += `<div class="totals-row text-success"><span>পয়েন্ট ব্যবহার (${t.pts}):</span><span>-${B(t.loy)}</span></div>`;
    if (t.refd) r += `<div class="totals-row text-success"><span>রেফারেল ছাড়:</span><span>-${B(t.refd)}</span></div>`;
    $('#oDiscRow').after(r);
    if (o.points && o.points.earned) $('#oDiscRow').before(`<div class="totals-row"><span><i class="bi bi-stars text-warning"></i> অর্জিত পয়েন্ট:</span><b>${o.points.earned} <small class="text-muted">(ব্যালেন্স ${HC.points()})</small></b></div>`);
    if ($('#oItems').length && !$('#refCard').length) $('#oItems').after(`<div class="panel my-3 ref-card" id="refCard"><div class="d-flex flex-wrap align-items-center gap-2"><div class="flex-grow-1"><b><i class="bi bi-gift-fill text-brand"></i> বন্ধুকে ${B(HC.REF.discount)} ছাড় দিন</b><div class="small text-muted">আপনার কোড <b class="text-brand">${HC.refCode()}</b></div></div><a href="#" class="btn btn-wa btn-sm ref-share"><i class="bi bi-whatsapp"></i> শেয়ার করুন</a></div></div>`);
  }
  $(function () { orderRows(); postUpsell(); });
})(jQuery);
