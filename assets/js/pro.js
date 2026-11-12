/* v1.9.4 — পারফরম্যান্স ও PWA: লেজি ছবি + শিমার স্কেলিটন, অফলাইন ব্যানার, অর্ডার নোটিফিকেশন (পুশ)
   ▸ আসল ছবির জন্য responsive srcset: window.HC_IMG_SRCSET = src => '...-400.webp 400w, ...-800.webp 800w' (ফাঁকা/undefined হলে বাদ)
   ▸ আসল ওয়েব-পুশের জন্য: window.HC_PUSH = { vapidKey: 'BN...' } — সাবস্ক্রিপশন hc_push_sub এ সেভ হয় (আপনার সার্ভারে পাঠাবেন) */
(function ($) {
  'use strict';
  const HC = window.HC; if (!HC) return;
  const store = HC.store;

  /* ---------- ১. লেজি লোড + শিমার স্কেলিটন ---------- */
  const SKIP = 'img[data-eager], .brand img, .hc-lb img, .site-header img';
  function tune(img) {
    if (img.dataset.tuned || img.matches(SKIP)) return; img.dataset.tuned = '1';
    if (!img.hasAttribute('loading')) img.loading = 'lazy';
    img.decoding = 'async';
    if (typeof window.HC_IMG_SRCSET === 'function' && !img.srcset) { const s = window.HC_IMG_SRCSET(img.getAttribute('src')); if (s) { img.srcset = s; if (!img.sizes) img.sizes = img.closest('.pc-img') ? '(min-width:992px) 25vw, 50vw' : '100vw'; } }
    const box = img.closest('.pc-img, .zoom-box, .qv-img-wrap, .post-card, .cart-line');
    if (box && !img.complete) {
      box.classList.add('sk');
      const done = () => box.classList.remove('sk');
      img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true });
    }
  }
  const sweep = root => (root.querySelectorAll ? root.querySelectorAll('img') : []).forEach(tune);
  sweep(document);
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) { if (n.tagName === 'IMG') tune(n); else sweep(n); } }))).observe(document.documentElement, { childList: true, subtree: true });
  // স্কেলিটন কার্ড (ডাটা আসতে দেরি হলে গ্রিডে দেখানোর জন্য): HC.skeleton('#productList', 8)
  HC.skeleton = (sel, n) => $(sel).html(Array.from({ length: n || 8 }, () => '<div class="col-6 col-md-4 col-lg-3"><div class="sk-card" aria-hidden="true"><div class="sk-img sk"></div><div class="sk-line sk"></div><div class="sk-line sk w60"></div></div></div>').join(''));

  /* ---------- ২. অফলাইন ব্যানার ---------- */
  const offBar = () => $('#offlineBar');
  function setOffline(off) {
    if (off) {
      if (offBar().length) return;
      $('body').prepend('<div class="offline-bar" id="offlineBar" role="status"><i class="bi bi-wifi-off"></i> আপনি অফলাইনে আছেন — আগে দেখা পেজ ক্যাশ থেকে দেখাচ্ছে। অর্ডার করতে ইন্টারনেট লাগবে।</div>');
    } else if (offBar().length) { offBar().remove(); HC.toast('আবার অনলাইনে ✓'); }
  }
  window.addEventListener('offline', () => setOffline(true));
  window.addEventListener('online', () => setOffline(false));
  $(function () { if (navigator.onLine === false) setOffline(true); });

  /* ---------- ৩. অর্ডার আপডেট নোটিফিকেশন ---------- */
  const NS = () => store.get('hc_notif', null);                            // { state: 'on'|'denied', ts }
  const b64 = s => { const p = '='.repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, c => c.charCodeAt(0)); };
  HC.notifyLocal = async function (title, body, url) {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return false;
      const reg = 'serviceWorker' in navigator && navigator.serviceWorker.controller ? await navigator.serviceWorker.ready : null;
      if (reg && reg.showNotification) await reg.showNotification(title, { body, icon: 'assets/icons/icon-192.png', badge: 'assets/icons/icon-192.png', data: { url: url || 'track-order.html' } });
      else new Notification(title, { body, icon: 'assets/icons/icon-192.png' });
      return true;
    } catch (e) { return false; }
  };
  HC.enableOrderNotifications = async function () {
    if (!('Notification' in window)) { HC.toast('এই ব্রাউজারে নোটিফিকেশন সাপোর্ট নেই'); return 'unsupported'; }
    const res = await Notification.requestPermission();
    if (res !== 'granted') { store.set('hc_notif', { state: 'denied', ts: Date.now() }); return res; }
    store.set('hc_notif', { state: 'on', ts: Date.now() });
    const key = window.HC_PUSH && window.HC_PUSH.vapidKey;
    if (key && 'serviceWorker' in navigator && 'PushManager' in window) {
      try { const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) }); store.set('hc_push_sub', sub.toJSON()); } catch (e) {}
    }
    HC.notifyLocal('নোটিফিকেশন চালু হয়েছে ✓', 'অর্ডারের আপডেট এখান থেকে জানানো হবে।');
    return 'granted';
  };
  function orderPageBox() {
    if (!/order-received\.html$/.test(location.pathname) || $('#notifBox').length || !('Notification' in window)) return;
    const st = NS(), on = st && st.state === 'on' && Notification.permission === 'granted';
    $('main').first().append(`<div class="notif-box no-print" id="notifBox"><div><b><i class="bi bi-bell-fill text-brand"></i> অর্ডারের আপডেট নোটিফিকেশনে পান</b><div class="small text-muted" id="notifTxt">${on ? '✓ চালু আছে — কনফার্মেশন, শিপমেন্ট ও ডেলিভারির আপডেট এই ডিভাইসে আসবে।' : 'কনফার্ম, কুরিয়ারে হস্তান্তর ও ডেলিভারির খবর সরাসরি ফোনে/ব্রাউজারে।'}</div></div>
      <button type="button" class="btn btn-sm ${on ? 'btn-soft' : 'btn-brand'}" id="notifBtn" ${on ? 'disabled' : ''}>${on ? 'চালু আছে' : 'চালু করুন'}</button></div>`);
  }
  $(document).on('click', '#notifBtn', async function () {
    const r = await HC.enableOrderNotifications();
    $('#notifTxt').text(r === 'granted' ? '✓ চালু হয়েছে — কনফার্মেশন, শিপমেন্ট ও ডেলিভারির আপডেট এই ডিভাইসে আসবে।' : r === 'unsupported' ? 'এই ব্রাউজারে নোটিফিকেশন সাপোর্ট নেই।' : 'অনুমতি দেওয়া হয়নি। ব্রাউজারের সাইট সেটিংস থেকে অনুমতি দিতে পারেন।');
    if (r === 'granted') $(this).text('চালু আছে').removeClass('btn-brand').addClass('btn-soft').prop('disabled', true);
  });
  $(orderPageBox);
})(jQuery);
