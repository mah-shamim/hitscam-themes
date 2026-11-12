/* ভাষা বদল (বাংলা ⇄ English) ও বাংলা/ইংরেজি অঙ্ক।
   কৌশল: ডিফল্ট বাংলা। English বাছলে পেজের টেক্সট নোড/প্লেসহোল্ডার একটি অভিধান (EN) ও কিছু প্যাটার্ন দিয়ে অনুবাদ হয়,
   MutationObserver দিয়ে পরে যোগ হওয়া অংশও (কার্ড, কার্ট) অনুবাদ হয়। বাংলায় ফিরতে পেজ রিলোড হয়।
   অভিধানে না থাকা লেখা বাংলাতেই থাকে — নতুন লেখা পেলে নিচের EN তে যোগ করুন। */
(function ($) {
  'use strict';
  const S = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const lang = S.get('hc_lang') === 'en' ? 'en' : 'bn', dig = S.get('hc_dig') === 'bn' ? 'bn' : 'en';
  const EN = {
    'হোম': 'Home', 'সব প্রোডাক্ট': 'All products', 'ক্যামেরা বাছাই': 'Camera finder', 'বান্ডেল অফার': 'Bundle offers', 'অর্ডার ট্র্যাক': 'Track order', 'যোগাযোগ': 'Contact', 'শপ': 'Shop',
    '৳5,000+ অর্ডারে ফ্রি ডেলিভারি': 'Free delivery on ৳5,000+ orders', 'সকল ক্যাটাগরি': 'All categories', 'সব দেখুন': 'View all', 'সব প্রোডাক্ট দেখুন': 'View all products',
    'আইপি ক্যামেরা': 'IP cameras', 'সিসি ক্যামেরা': 'CC cameras', 'সিকিউরিটি ক্যামেরা': 'Security cameras', 'মেমোরি কার্ড': 'Memory cards', 'মিনি ইউপিএস': 'Mini UPS', 'স্মার্টফোন': 'Smartphones', 'ল্যাপটপ': 'Laptops', 'অ্যাক্সেসরিজ': 'Accessories',
    'অ্যাড টু কার্ট': 'Add to cart', 'অর্ডার নাউ': 'Order now', 'ভিউ কার্ট': 'View cart', 'কার্ট দেখুন': 'View cart', 'WhatsApp এ অর্ডার করুন': 'Order on WhatsApp', 'স্টক আউট': 'Out of stock', 'স্টকে আছে': 'In stock',
    'আপনার কার্ট': 'Your cart', 'কার্ট লিস্ট': 'Cart items', 'প্রসেস টু চেকআউট': 'Proceed to checkout', 'কেনাকাটা চালিয়ে যান': 'Continue shopping', 'কুপন কোড': 'Coupon code', 'অ্যাপ্লাই': 'Apply',
    'ফিল্টার': 'Filters', 'রিসেট': 'Reset', 'সার্চ': 'Search', 'ক্যাটাগরি': 'Category', 'প্রোডাক্ট টাইপ': 'Product type', 'মূল্য (৳)': 'Price (৳)', 'রেটিং': 'Rating', 'সব': 'All', 'পণ্য তুলনা': 'Compare products',
    'কোম্পানি': 'Company', 'পলিসি': 'Policy', 'কম্পেটিবিলিটি': 'Compatibility', 'শর্তাবলী': 'Terms', 'রিটার্ন, রিফান্ড ও ওয়ারেন্টি': 'Returns, refund & warranty', 'শিপিং তথ্য': 'Shipping info', 'ওয়ারেন্টি চেক': 'Warranty check',
    'আপনার ঠিকানা *': 'Your address *', 'নাম *': 'Name *', 'ফোন *': 'Phone *', 'জেলা': 'District', 'থানা / উপজেলা': 'Thana / Upazila', 'বাসা / রোড / এলাকা': 'House / road / area', 'ই-মেইল (ঐচ্ছিক)': 'Email (optional)',
    'ক্যাশ অন ডেলিভারি': 'Cash on delivery', 'অনলাইন পেমেন্ট': 'Online payment', 'ঢাকার ভিতরে': 'Inside Dhaka', 'ঢাকার বাইরে': 'Outside Dhaka', 'আনুমানিক ডেলিভারি': 'Estimated delivery',
    'ফ্রি শিপিং': 'Free shipping', 'ইন্সট্যান্ট অর্ডার': 'Instant order', 'ওভারভিউ': 'Overview', 'ডিটেলস': 'Details', 'শেয়ার করুন:': 'Share:', 'সম্পর্কিত পণ্য': 'Related products', 'সম্প্রতি দেখা': 'Recently viewed',
    'লগইন': 'Login', 'নতুন অ্যাকাউন্ট': 'New account', 'লগইন করুন': 'Log in', 'OTP পাঠান': 'Send OTP', 'যাচাই করে লগইন': 'Verify & log in', 'পাসওয়ার্ড ভুলে গেছেন?': 'Forgot password?', 'মনে রাখুন': 'Remember me',
    'ওয়ারেন্টি দেখুন': 'Check warranty', 'বান্ডেল কার্টে যোগ করুন': 'Add bundle to cart', 'আবার শুরু করুন': 'Start again', 'পিছনে': 'Back', 'বিস্তারিত দেখুন': 'View details',
    'অর্ডার ট্র্যাক করুন': 'Track your order', 'ট্র্যাক': 'Track', 'অর্ডার নম্বর *': 'Order number *', 'ফোন নাম্বার *': 'Phone number *', 'রিভিউ জমা দিন': 'Submit review', 'সহায়ক': 'Helpful',
    'সর্বস্বত্ব সংরক্ষিত।': 'All rights reserved.', 'কার্টে যোগ হয়েছে ✓': 'Added to cart ✓', 'পণ্য খুঁজুন': 'Search products'
  };
  const RULES = [
    [/^(\d+)টি পণ্য পাওয়া গেছে$/, '$1 products found'], [/^(\d+)টি পণ্য$/, '$1 products'], [/^মাত্র (\d+)টি বাকি!?$/, 'Only $1 left!'], [/^আজ (\d+) জন দেখেছেন · সর্বশেষ অর্ডার (.*)$/, '$1 people viewed today'],
    [/^এই পণ্য কার্টে আছে \((\d+)টি\)$/, 'In your cart ($1)'], [/^(\d+) রিভিউ$/, '$1 reviews'], [/^আরও ৳([\d,]+) এর পণ্য কার্টে যোগ করুন এবং পান ফ্রি শিপিং!$/, 'Add ৳$1 more to get free shipping!']
  ];
  const ATTR = ['placeholder', 'title', 'aria-label', 'alt'];
  const BN2EN = d => '০১২৩৪৫৬৭৮৯'.indexOf(d);
  const EN2BN = d => '০১২৩৪৫৬৭৮৯'[d];
  const skip = n => { const p = n.parentNode; if (!p) return true; const t = p.nodeName; return t === 'SCRIPT' || t === 'STYLE' || t === 'TEXTAREA' || t === 'CODE' || t === 'NOSCRIPT' || (p.closest && p.closest('[data-nolang],.lang-sw,#pSku')); };
  function tr(str) {
    const m = str.match(/^(\s*)([\s\S]*?)(\s*)$/), core = m[2];
    if (!core) return str;
    let out = EN[core];
    if (out == null) for (const r of RULES) if (r[0].test(core)) { out = core.replace(r[0], r[1]); break; }
    return out == null ? str : m[1] + out + m[3];
  }
  function fixNode(n) {
    if (n.nodeType === 3) {
      if (skip(n)) return; let v = n.nodeValue, o = v;
      if (lang === 'en') v = tr(v);
      if (dig === 'bn') v = v.replace(/[0-9]/g, d => EN2BN(+d));
      if (v !== o) n.nodeValue = v;
    } else if (n.nodeType === 1 && !/^(SCRIPT|STYLE)$/.test(n.nodeName)) {
      if (lang === 'en') ATTR.forEach(a => { const v = n.getAttribute && n.getAttribute(a); if (v) { const t = tr(v); if (t !== v) n.setAttribute(a, t); } });
      for (let c = n.firstChild; c; c = c.nextSibling) fixNode(c);
    }
  }
  $(document).on('click', '.lang-sw button', function () {
    const l = $(this).data('l'), d = $(this).data('d');
    if (l) S.set('hc_lang', l); if (d) S.set('hc_dig', dig === 'bn' ? 'en' : 'bn');
    location.reload();
  });
  if (lang === 'bn' && dig === 'en') { $(function () { addSwitch(); }); return; }
  let busy = false;
  function run(root) { if (busy) return; busy = true; try { fixNode(root); } finally { busy = false; } }
  function addSwitch() {
    const $t = $('.topbar .container').first(); if (!$t.length || $('.lang-sw').length) return;
    $t.append(`<span class="lang-sw" data-nolang role="group" aria-label="ভাষা"><button type="button" data-l="bn" class="${lang === 'bn' ? 'on' : ''}" aria-pressed="${lang === 'bn'}">বাং</button><button type="button" data-l="en" class="${lang === 'en' ? 'on' : ''}" aria-pressed="${lang === 'en'}">EN</button><button type="button" data-d="1" class="${dig === 'bn' ? 'on' : ''}" aria-pressed="${dig === 'bn'}" title="অঙ্ক / Digits">০১২</button></span>`);
  }

  $(function () {
    addSwitch();
    if (lang === 'en') document.documentElement.lang = 'en';
    run(document.body);
    new MutationObserver(ms => { if (busy) return; ms.forEach(m => { m.addedNodes.forEach(n => run(n)); if (m.type === 'characterData') run(m.target); }); }).observe(document.body, { childList: true, subtree: true, characterData: true });
  });
})(jQuery);
