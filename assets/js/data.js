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

  const products = [
    { id: 1, type: 'simple', name: '4G PTZ Camera – সিম সাপোর্ট আউটডোর ক্যামেরা', cat: 'ip-camera', sku: 'HC-PTZ-4G',
      regular: 6500, sale: 5500, rating: 4.8, reviews: 126, tags: ['trending', 'best', 'flash'], img: ph('4G PTZ Camera'), desc: lorem },

    { id: 2, type: 'variable', name: '4 Lens Solar Security Camera – 4G SIM ও WiFi স্মার্ট সিকিউরিটি ক্যামেরা', cat: 'security', sku: 'HC-SOLAR-4L',
      rating: 4.9, reviews: 212, tags: ['trending', 'new', 'best'], img: ph('Solar 4 Lens'), desc: lorem,
      variations: [
        { label: '4G SIM + WiFi',          regular: 14500, sale: 12900 },
        { label: 'শুধু WiFi',               regular: 12500, sale: 11500 },
        { label: '4G SIM + 128GB কার্ড',   regular: 16000, sale: 14200 }
      ] },

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
  products.forEach(p => { p.info = p.info || infoById[p.id] || infoByCat[p.cat] || []; });

  window.HC_DATA = { categories, products, addons, ph };
})();
