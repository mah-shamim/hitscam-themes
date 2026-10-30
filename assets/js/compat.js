/* ব্রাউজার / ডিভাইস / সোশ্যাল ইন-অ্যাপ ব্রাউজার ডিটেকশন (কম্পেটিবিলিটি পেজের জন্য) */
(function ($) {
  'use strict';
  function detect() {
    const ua = navigator.userAgent || '';
    const r = { ua };
    r.os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : /Mac OS X/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'অজানা';
    r.device = /iPad|Tablet/i.test(ua) ? 'ট্যাবলেট' : /Mobi|Android|iPhone/i.test(ua) ? 'মোবাইল' : 'ডেস্কটপ';
    const apps = [[/FBAN|FBAV|FB_IAB/i, 'Facebook'], [/Instagram/i, 'Instagram'], [/Messenger|FBAN\/Messenger/i, 'Messenger'], [/WhatsApp/i, 'WhatsApp'],
      [/TikTok|musical_ly|BytedanceWebview/i, 'TikTok'], [/Snapchat/i, 'Snapchat'], [/Line\//i, 'LINE'], [/Telegram/i, 'Telegram'], [/Twitter/i, 'X/Twitter'], [/LinkedInApp/i, 'LinkedIn']];
    r.inApp = (apps.find(a => a[0].test(ua)) || [])[1] || null;
    const b = [[/Edg\/([\d.]+)/, 'Edge'], [/OPR\/([\d.]+)/, 'Opera'], [/SamsungBrowser\/([\d.]+)/, 'Samsung Internet'], [/Firefox\/([\d.]+)/, 'Firefox'],
      [/(?:Chrome|CriOS)\/([\d.]+)/, 'Chrome'], [/Version\/([\d.]+).*Safari/, 'Safari']];
    for (const x of b) { const m = ua.match(x[0]); if (m) { r.browser = x[1]; r.version = m[1].split('.')[0]; break; } }
    r.browser = r.browser || 'অজানা';
    r.width = window.innerWidth; r.dpr = window.devicePixelRatio || 1;
    return r;
  }
  function features() {
    let ls = false; try { localStorage.setItem('_t', '1'); localStorage.removeItem('_t'); ls = true; } catch (e) {}
    const css = (a, b) => !!(window.CSS && CSS.supports && CSS.supports(a, b));
    return [['localStorage (কার্ট সংরক্ষণ)', ls], ['CSS Flexbox', css('display', 'flex')], ['CSS Grid', css('display', 'grid')], ['CSS Variables', css('--a', '0')],
      ['fetch API', typeof fetch === 'function'], ['IntersectionObserver (lazy load)', 'IntersectionObserver' in window], ['Touch ইভেন্ট', 'ontouchstart' in window || navigator.maxTouchPoints > 0], ['tel: লিংক সাপোর্ট (মোবাইল)', /Mobi|Android|iPhone/i.test(navigator.userAgent)]];
  }
  window.renderEnv = function (sel) {
    const e = detect(), f = features();
    $(sel).html(`<div class="panel mb-4"><h5 class="fw-bold mb-3"><i class="bi bi-search text-brand"></i> আপনার বর্তমান পরিবেশ (লাইভ ডিটেক্ট)</h5>
      <div class="row g-3 mb-3">
        <div class="col-6 col-md-3"><div class="or-stat"><small>ব্রাউজার</small><b>${e.browser} ${e.version || ''}</b></div></div>
        <div class="col-6 col-md-3"><div class="or-stat"><small>অপারেটিং সিস্টেম</small><b>${e.os}</b></div></div>
        <div class="col-6 col-md-3"><div class="or-stat"><small>ডিভাইস / স্ক্রিন</small><b>${e.device} · ${e.width}px</b></div></div>
        <div class="col-6 col-md-3"><div class="or-stat"><small>ইন-অ্যাপ ব্রাউজার</small><b>${e.inApp ? e.inApp : 'না (সাধারণ ব্রাউজার)'}</b></div></div></div>
      ${e.inApp ? `<div class="alert alert-warning py-2">আপনি <b>${e.inApp}</b> এর ভিতরের ব্রাউজারে আছেন। পেমেন্ট/ফর্মে সমস্যা হলে মেনু থেকে "Open in Browser" ব্যবহার করুন।</div>` : ''}
      <div class="row g-2">${f.map(x => `<div class="col-md-6"><span class="${x[1] ? 'text-success' : 'text-danger'}"><i class="bi bi-${x[1] ? 'check-circle-fill' : 'x-circle-fill'}"></i></span> ${x[0]}</div>`).join('')}</div></div>`);
  };
})(jQuery);
