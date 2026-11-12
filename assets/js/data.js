/* Demo data — WooCommerce এ কনভার্ট করার সময় এগুলো PHP loop/WC_Product থেকে আসবে */
(function () {
  const ph = (t, c) => 'https://placehold.co/600x600/f8f9fa/' + (c || 'e03131') + '?text=' + encodeURIComponent(t);

  const categories = [
    { slug: 'ip-camera',   name: 'আইপি ক্যামেরা',     count: 24, img: ph('IP Cam') },
    { slug: 'cc-camera',   name: 'সিসি ক্যামেরা',     count: 18, img: ph('CC Cam', '0f172a') },
    { slug: 'security',    name: 'সিকিউরিটি ক্যামেরা', count: 31, img: ph('Security') },
    { slug: 'memory-card', name: 'মেমোরি কার্ড',      count: 12, img: ph('Memory', '0f172a') },
    { slug: 'mini-ups',    name: 'মিনি ইউপিএস',       count: 9,  img: ph('Mini UPS') },
    { slug: 'smartphone',  name: 'স্মার্টফোন',        count: 15, img: ph('Phone', '0f172a') },
    { slug: 'laptop',      name: 'ল্যাপটপ',           count: 8,  img: ph('Laptop') },
    { slug: 'accessories', name: 'অ্যাক্সেসরিজ',      count: 40, img: ph('Access.', '0f172a') }
  ];

  const lorem = 'এই পণ্যটি উন্নত প্রযুক্তি ও দীর্ঘস্থায়ী মান নিশ্চিত করে তৈরি। ঘরে, দোকানে বা অফিসে সহজেই ব্যবহার করা যায়। অফিসিয়াল ওয়ারেন্টিসহ সারা বাংলাদেশে ডেলিভারি।';

  // একাধিক অ্যাট্রিবিউট (রং × কানেকশন): variations কম্বিনেশন থেকে তৈরি। কম্বিনেশন বাদ দিতে NA তে যোগ করুন।
  const solar = (() => {
    const colors = [{ v: 'কালো', hex: '#111827' }, { v: 'সাদা', hex: '#f8fafc' }, { v: 'আর্মি গ্রিন', hex: '#4d6b3a' }, { v: 'ধূসর', hex: '#9ca3af' }];
    const conns = ['4G SIM + WiFi', 'শুধু WiFi', 'শুধু SIM', '4G SIM + 128GB কার্ড'];
    const base = { '4G SIM + WiFi': [14500, 12900], 'শুধু WiFi': [12500, 11500], 'শুধু SIM': [13200, 11900], '4G SIM + 128GB কার্ড': [16000, 14200] };
    const extra = { 'কালো': 0, 'সাদা': 0, 'আর্মি গ্রিন': 200, 'ধূসর': 100 };       // রং অনুযায়ী বাড়তি দাম
    const NA = { 'সাদা|শুধু SIM': 1, 'ধূসর|4G SIM + 128GB কার্ড': 1 };               // এই কম্বিনেশন নেই
    const variations = [];
    colors.forEach(c => conns.forEach(n => { if (NA[c.v + '|' + n]) return;
      variations.push({ label: c.v + ' / ' + n, attrs: { color: c.v, conn: n }, regular: base[n][0] + extra[c.v], sale: base[n][1] + extra[c.v] }); }));
    return { attributes: [{ key: 'color', label: 'রং', swatch: true, values: colors }, { key: 'conn', label: 'কানেকশন', values: conns }], variations };
  })();

  const products = [
    { id: 1, type: 'simple', name: '4G PTZ Camera – সিম সাপোর্ট আউটডোর ক্যামেরা', cat: 'ip-camera', sku: 'HC-PTZ-4G',
      regular: 6500, sale: 5500, rating: 4.8, reviews: 126, tags: ['trending', 'best', 'flash'], img: ph('4G PTZ Camera'), desc: lorem },

    { id: 2, video: 'jNQXAC9IVRw', spin: 12, type: 'variable', name: '4 Lens Solar Security Camera – 4G SIM ও WiFi স্মার্ট সিকিউরিটি ক্যামেরা', cat: 'security', sku: 'HC-SOLAR-4L',
      rating: 4.9, reviews: 212, tags: ['trending', 'new', 'best'], img: ph('Solar 4 Lens'), desc: lorem,
      attributes: solar.attributes, variations: solar.variations },

    { id: 3, type: 'grouped', name: 'স্মার্ট হোম সিকিউরিটি কিট (৩ আইটেম)', cat: 'security', sku: 'HC-KIT-3',
      rating: 4.6, reviews: 58, tags: ['trending', 'new'], img: ph('Home Kit', '0f172a'), desc: lorem,
      children: [
        { label: 'মিনি WiFi ক্যামেরা', regular: 2200, sale: 1800 },
        { label: 'ডোর সেন্সর',          regular: 800,  sale: 650 },
        { label: 'ওয়্যারলেস সাইরেন',   regular: 1200, sale: 900 }
      ] },

    { id: 4, type: 'external', name: 'Wireless Mini UPS 12V (পার্টনার স্টোর)', cat: 'mini-ups', sku: 'HC-UPS-12',
      regular: 1800, sale: 1500, rating: 4.4, reviews: 31, tags: ['flash', 'new'], img: ph('Mini UPS'), desc: lorem,
      url: 'https://example.com/affiliate/mini-ups', btn: 'পার্টনার স্টোরে কিনুন' },

    { id: 5, type: 'simple', name: '64GB হাই-স্পিড মেমোরি কার্ড', cat: 'memory-card', sku: 'HC-MC-64',
      regular: 950, sale: 800, rating: 4.7, reviews: 340, tags: ['best', 'flash'], img: ph('64GB Card', '0f172a'), desc: lorem },

    { id: 6, type: 'simple', name: 'ক্যামেরা মাউন্ট (ওয়াল/সিলিং)', cat: 'accessories', sku: 'HC-MNT-1',
      regular: 550, sale: 450, rating: 4.5, reviews: 77, tags: ['trending', 'best'], img: ph('Mount'), desc: lorem },

    { id: 7, type: 'simple', name: '১০W সোলার প্যানেল', cat: 'accessories', sku: 'HC-SP-10',
      regular: 1500, sale: 1200, rating: 4.6, reviews: 49, tags: ['new', 'flash'], img: ph('Solar Panel', '0f172a'), desc: lorem },

    { id: 8, type: 'variable', name: 'Wi-Fi স্মার্ট ইনডোর ক্যামেরা ২MP/৩MP', cat: 'ip-camera', sku: 'HC-IND-W',
      rating: 4.7, reviews: 93, tags: ['trending', 'best'], img: ph('Indoor Cam'), desc: lorem,
      variations: [
        { label: '২MP',  regular: 2300, sale: 1900 },
        { label: '৩MP',  regular: 2900, sale: 2500 },
        { label: '৫MP',  regular: 3600, sale: 3200 }
      ] },

    { id: 9, type: 'simple', name: '৮ চ্যানেল DVR + মোবাইল ভিউ', cat: 'cc-camera', sku: 'HC-DVR-8',
      regular: 7800, sale: 6900, rating: 4.5, reviews: 41, tags: ['trending', 'new', 'flash'], img: ph('DVR 8CH', '0f172a'), desc: lorem },

    { id: 10, type: 'grouped', name: 'আউটডোর সিসি ক্যামেরা প্যাকেজ', cat: 'cc-camera', sku: 'HC-PKG-O',
      rating: 4.8, reviews: 66, tags: ['best', 'new'], img: ph('CC Package'), desc: lorem,
      children: [
        { label: '২ ক্যামেরা প্যাকেজ', regular: 9500,  sale: 8500 },
        { label: '৪ ক্যামেরা প্যাকেজ', regular: 16500, sale: 14900 },
        { label: '৮ ক্যামেরা প্যাকেজ', regular: 29000, sale: 26500 }
      ] },

    { id: 11, type: 'simple', name: 'Mini WiFi Camera 1080p', cat: 'ip-camera', sku: 'HC-MINI-1',
      regular: 2200, sale: 1800, rating: 4.3, reviews: 120, tags: ['best', 'flash', 'trending'], img: ph('Mini Cam', '0f172a'), desc: lorem },

    { id: 12, type: 'external', name: 'স্মার্টফোন গিম্বল স্ট্যাবিলাইজার', cat: 'smartphone', sku: 'HC-GIM-1',
      regular: 4200, sale: 3600, rating: 4.4, reviews: 22, tags: ['new'], img: ph('Gimbal'), desc: lorem,
      url: 'https://example.com/affiliate/gimbal', btn: 'অ্যাফিলিয়েট লিংকে দেখুন' }
  ];

  // কার্টে "Complete Your Purchase" এ দেখানো upsell আইটেম
  const addons = [
    { id: 5, note: 'এই ক্যামেরার জন্য রেকমেন্ডেড' },
    { id: 6, note: 'সহজ আউটডোর ইন্সটলেশন' },
    { id: 7, note: 'ক্যামেরা চালু রাখুন সবসময়' }
  ];

  // ভ্যারিয়েশন/গ্রুপ আইটেম নেই এমন (Simple / External) কার্ডে দেখানোর Additional information (Bootstrap Icons)
  // WooCommerce এ এগুলো ACF/মেটা ফিল্ড বা প্রোডাক্ট অ্যাট্রিবিউট থেকে আসবে। প্রোডাক্ট নিজের `info` দিলে সেটাই, নইলে ক্যাটাগরির ডিফল্ট।
  const infoByCat = {
    'ip-camera':   [['bi-camera-video', '1080p / 2K ভিডিও'], ['bi-wifi', 'WiFi / 4G সাপোর্ট'], ['bi-moon-stars', 'নাইট ভিশন'], ['bi-shield-check', '১ বছর ওয়ারেন্টি']],
    'cc-camera':   [['bi-camera-video', 'HD ভিডিও'], ['bi-hdd-network', 'DVR/NVR সাপোর্ট'], ['bi-moon-stars', 'নাইট ভিশন'], ['bi-shield-check', 'ওয়ারেন্টি সহ']],
    'security':    [['bi-phone', 'মোবাইল লাইভ ভিউ'], ['bi-bell', 'মোশন অ্যালার্ট'], ['bi-moon-stars', 'নাইট ভিশন'], ['bi-shield-check', 'ওয়ারেন্টি সহ']],
    'memory-card': [['bi-sd-card', 'হাই-স্পিড Class 10'], ['bi-camera-video', 'ক্যামেরা রেডি'], ['bi-patch-check', 'আসল পণ্য'], ['bi-shield-check', 'ওয়ারেন্টি সহ']],
    'mini-ups':    [['bi-battery-charging', '12V আউটপুট'], ['bi-lightning-charge', 'অটো ব্যাকআপ'], ['bi-router', 'রাউটার/ক্যামেরা সাপোর্ট'], ['bi-shield-check', 'ওয়ারেন্টি সহ']],
    'smartphone':  [['bi-phone', 'অ্যান্ড্রয়েড / iOS'], ['bi-battery-charging', 'দীর্ঘ ব্যাটারি'], ['bi-patch-check', 'আসল পণ্য'], ['bi-shield-check', 'ওয়ারেন্টি সহ']],
    'laptop':      [['bi-cpu', 'দ্রুত প্রসেসর'], ['bi-memory', 'RAM / SSD'], ['bi-battery-charging', 'ব্যাকআপ ব্যাটারি'], ['bi-shield-check', 'ওয়ারেন্টি সহ']],
    'accessories': [['bi-patch-check', 'আসল পণ্য'], ['bi-tools', 'সহজ ইন্সটলেশন'], ['bi-box-seam', 'সিল প্যাকেজ'], ['bi-shield-check', 'ওয়ারেন্টি সহ']]
  };
  // নির্দিষ্ট প্রোডাক্টের নিজস্ব তথ্য (ক্যাটাগরির ডিফল্ট ওভাররাইড করে)
  const infoById = {
    1: [['bi-camera-video', '4MP Full HD'], ['bi-sim', '4G সিম সাপোর্ট'], ['bi-arrows-move', '৩৬০° PTZ ঘোরে'], ['bi-moon-stars', 'কালার নাইট ভিশন']],
    5: [['bi-sd-card', '64GB'], ['bi-speedometer2', 'Class 10 স্পিড'], ['bi-camera-video', 'ক্যামেরা রেডি'], ['bi-patch-check', 'আসল পণ্য']],
    6: [['bi-house-door', 'ওয়াল / সিলিং'], ['bi-arrows-angle-expand', '৩৬০° অ্যাডজাস্টেবল'], ['bi-tools', 'সহজ ইন্সটলেশন'], ['bi-cloud-rain', 'আউটডোর রেডি']],
    7: [['bi-sun', '১০W সোলার'], ['bi-battery-charging', '5V/12V চার্জ'], ['bi-cloud-rain', 'ওয়াটারপ্রুফ'], ['bi-camera-video', 'ক্যামেরা সাপোর্ট']]
  };
  // টোটাল সোল্ড (WooCommerce এ total_sales মেটা)
  const soldById = { 1: 1240, 2: 2310, 3: 486, 4: 215, 5: 3680, 6: 940, 7: 512, 8: 1175, 9: 398, 10: 604, 11: 1890, 12: 143 };
  // স্টক (WooCommerce এ stock_quantity)। ১০ বা কম হলে "মাত্র N টি বাকি" সতর্কতা
  const stockById = { 1: 24, 2: 7, 3: 15, 4: 40, 5: 120, 6: 5, 7: 3, 8: 18, 9: 9, 10: 12, 11: 60, 12: 0 };
  products.forEach(p => { p.stock = p.stock != null ? p.stock : (stockById[p.id] != null ? stockById[p.id] : 20); });
  products.forEach(p => { p.sold = p.sold != null ? p.sold : (soldById[p.id] || 0); });
  products.forEach(p => { p.info = p.info || infoById[p.id] || infoByCat[p.cat] || []; });
  // কার্ডে ফাঁকা জায়গা থাকলে এই অতিরিক্ত অ্যাট্রিবিউটগুলো দিয়ে ভরা হয় (app.js: HC.fillCards)। WooCommerce এ প্রোডাক্ট অ্যাট্রিবিউট থেকে আসবে।
  const common = [['bi-truck', 'সারা দেশে ডেলিভারি'], ['bi-headset', 'ফ্রি সাপোর্ট'], ['bi-box-seam', 'সিল প্যাকেজ'], ['bi-cash-coin', 'ক্যাশ অন ডেলিভারি'], ['bi-arrow-repeat', '৭ দিনের রিটার্ন'], ['bi-credit-card-2-front', 'বিকাশ / নগদ পেমেন্ট'], ['bi-geo-alt', 'ঢাকায় দ্রুত ডেলিভারি'], ['bi-star', 'টপ রেটেড পণ্য']];
  const moreByCat = {
    'ip-camera':   [['bi-phone', 'মোবাইল লাইভ ভিউ'], ['bi-mic', 'টু-ওয়ে অডিও'], ['bi-bell', 'মোশন অ্যালার্ট'], ['bi-cloud-check', 'মেমোরি কার্ড / ক্লাউড'], ['bi-translate', 'বাংলা সাপোর্ট']].concat(common),
    'cc-camera':   [['bi-brightness-high', 'ওয়াইড অ্যাঙ্গেল'], ['bi-cloud-rain', 'ওয়েদারপ্রুফ'], ['bi-lightning', 'কম বিদ্যুৎ খরচ'], ['bi-tools', 'সহজ ইন্সটলেশন'], ['bi-eye', 'ক্রিস্টাল ক্লিয়ার ছবি']].concat(common),
    'security':    [['bi-wifi', 'WiFi / 4G কানেক্টিভিটি'], ['bi-sun', 'সোলার / DC পাওয়ার'], ['bi-mic', 'টু-ওয়ে অডিও'], ['bi-cloud-rain', 'আউটডোর রেডি'], ['bi-tools', 'সহজ ইন্সটলেশন']].concat(common),
    'memory-card': [['bi-hdd', 'হাই এন্ডুরেন্স'], ['bi-thermometer-half', 'তাপ ও শক রেজিস্ট্যান্ট'], ['bi-arrow-left-right', 'দ্রুত ডাটা ট্রান্সফার'], ['bi-droplet', 'ওয়াটারপ্রুফ'], ['bi-camera-video', 'ক্যামেরা/ফোন সাপোর্ট']].concat(common),
    'mini-ups':    [['bi-shield-lock', 'ওভারলোড প্রোটেকশন'], ['bi-plug', 'মাল্টি পোর্ট'], ['bi-clock-history', 'দীর্ঘ ব্যাকআপ'], ['bi-thermometer-half', 'অটো কুলিং'], ['bi-tools', 'সহজ সেটআপ']].concat(common),
    'smartphone':  [['bi-camera', 'ভালো ক্যামেরা'], ['bi-sd-card', 'এক্সপান্ডেবল স্টোরেজ'], ['bi-lightning-charge', 'ফাস্ট চার্জ'], ['bi-wifi', '4G / WiFi'], ['bi-translate', 'বাংলা সাপোর্ট']].concat(common),
    'laptop':      [['bi-display', 'ফুল HD ডিসপ্লে'], ['bi-keyboard', 'ব্যাকলিট কিবোর্ড'], ['bi-usb-c', 'USB-C পোর্ট'], ['bi-wifi', 'WiFi 6'], ['bi-windows', 'অরিজিনাল OS']].concat(common),
    'accessories': [['bi-plug', 'সব ডিভাইসে মানানসই'], ['bi-arrows-angle-expand', 'অ্যাডজাস্টেবল'], ['bi-cloud-rain', 'টেকসই বিল্ড'], ['bi-camera-video', 'ক্যামেরা সাপোর্ট'], ['bi-gift', 'গিফট রেডি']].concat(common)
  };
  products.forEach(p => { p.more = p.more || moreByCat[p.cat] || common; });

  // ক্যামেরা বাছাই কুইজের জন্য: কোথায় (in/out) · পাওয়ার (mains/solar) · নেটওয়ার্ক (wifi/sim/wired)
  const fitById = {
    1: { place: ['out'], power: ['mains'], net: ['sim'] },
    2: { place: ['out'], power: ['solar'], net: ['sim', 'wifi'] },
    3: { place: ['in'], power: ['mains'], net: ['wifi'] },
    8: { place: ['in'], power: ['mains'], net: ['wifi'] },
    9: { place: ['in', 'out'], power: ['mains'], net: ['wired'] },
    10: { place: ['out'], power: ['mains'], net: ['wired'] },
    11: { place: ['in'], power: ['mains'], net: ['wifi'] }
  };
  products.forEach(p => { if (fitById[p.id]) p.fit = fitById[p.id]; });
  // বান্ডেল: items = [প্রোডাক্ট id, (ঐচ্ছিক) অপশন ইনডেক্স]; off = % ছাড়। অপশন না দিলে সবচেয়ে কম দামেরটি
  const bundles = [
    { id: 'b1', name: 'সোলার ক্যামেরা কমপ্লিট সেটআপ', desc: 'বিদ্যুৎ ছাড়া ২৪/৭ নজরদারি — ক্যামেরা, মেমোরি কার্ড ও মাউন্ট একসাথে।', off: 10, items: [[2], [5], [6]] },
    { id: 'b2', name: 'ইনডোর WiFi স্টার্টার', desc: 'ঘরের জন্য স্মার্ট ক্যামেরা + ৬৪GB কার্ড।', off: 7, items: [[8], [5]] },
    { id: 'b3', name: 'আউটডোর 4G + সোলার ব্যাকআপ', desc: '৪G PTZ ক্যামেরা, কার্ড, সোলার প্যানেল ও মাউন্ট।', off: 12, items: [[1], [5], [7], [6]] }
  ];
  // সোশ্যাল প্রুফ (ডেমো)। আসল সাইটে অ্যানালিটিক্স/অর্ডার ডাটা থেকে বসবে; না দিলে লাইনটি দেখায় না
  const pulseById = { 1: { views: 38, last: '২ ঘণ্টা আগে' }, 2: { views: 64, last: '৪৫ মিনিট আগে' }, 3: { views: 21, last: 'গতকাল' }, 5: { views: 87, last: '২০ মিনিট আগে' }, 6: { views: 19, last: '৩ ঘণ্টা আগে' }, 7: { views: 26, last: '৫ ঘণ্টা আগে' }, 8: { views: 42, last: '১ ঘণ্টা আগে' }, 9: { views: 17, last: 'গতকাল' }, 10: { views: 23, last: '৬ ঘণ্টা আগে' }, 11: { views: 55, last: '৩০ মিনিট আগে' } };
  products.forEach(p => { if (pulseById[p.id]) p.pulse = pulseById[p.id]; });
  // ওয়ারেন্টি চেকের ডেমো রেকর্ড (সিরিয়াল বা ফোন দিয়ে খোঁজা যায়)
  const warranty = [
    { serial: 'HC-PTZ-0001', phone: '01712345678', product: 1, date: '2026-02-10', months: 12 },
    { serial: 'HC-SOL-0420', phone: '01812345678', product: 2, date: '2025-09-01', months: 12 },
    { serial: 'HC-MC-1188', phone: '01912345678', product: 5, date: '2026-08-20', months: 6 }
  ];

  window.HC_DATA = { categories, products, addons, ph, bundles, warranty };
})();
