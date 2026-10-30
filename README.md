# HitsCam Themes — WooCommerce HTML Template

WooCommerce শপের জন্য স্ট্যাটিক HTML টেমপ্লেট (Bootstrap 5 + jQuery + Owl Carousel)। ডিজাইন ও ফ্রন্টএন্ড লজিক প্রোটোটাইপ হিসেবে তৈরি; পরে WooCommerce থিমে কনভার্ট করার জন্য।

## চালানোর নিয়ম
`index.html` ব্রাউজারে খুলুন। (Bootstrap, jQuery, Owl Carousel ও ফন্ট CDN থেকে লোড হয়, তাই ইন্টারনেট লাগবে।)

## পেজ
| ফাইল | বিবরণ |
|---|---|
| `index.html` | হোম: স্লাইডার, Featured categories, Trending, Flash sale, Best sellers, New arrivals, রিভিউ, নিউজলেটার |
| `shop.html` | ব্যানার, ক্যাটাগরি লিস্ট, ফিল্টার, প্রোডাক্ট লিস্ট |
| `category.html?cat=<slug>` | ব্যানার, টপ সেলিং ২, ফিল্টার, প্রোডাক্ট লিস্ট |
| `product.html?id=<id>` | জুম গ্যালারি, ভ্যারিয়েশন/গ্রুপ/অ্যাফিলিয়েট, Upsell/Cross-sell, রিভিউ, Related |
| `cart.html`, `checkout.html`, `order-received.html`, `track-order.html` | কার্ট থেকে অর্ডার ট্র্যাকিং পর্যন্ত |
| `terms.html`, `returns.html`, `shipping.html`, `contact.html`, `faq.html` | তথ্য পেজ |
| `minicart.html` | মিনি কার্টের স্ট্যান্ডঅ্যালোন ভার্সন |
| `device-compatibility.html`, `social-compatibility.html` | ব্রাউজার/ডিভাইস/ইন-অ্যাপ ব্রাউজার কম্পেটিবিলিটি |

## প্রোডাক্ট কার্ড
- **Simple / External:** আইকনসহ Additional info (`info` বা ক্যাটাগরি ডিফল্ট)।
- **Variable / Grouped:** রেডিও বাটন (৩ কলাম গ্রিড, ৪–৬টি হলে দুই সারি); সবচেয়ে কম দামের অপশন ডিফল্ট সিলেক্টেড।
- **Add to cart / Order now:** Order now এ ইন্সট্যান্ট অর্ডার মোডাল (Your details + Order Summary)।

## ডেমো ডাটা
`assets/js/data.js` এ প্রোডাক্ট, ক্যাটাগরি ও upsell আইটেম। কার্ট `localStorage` এ থাকে। কুপন ডেমো: `HITS10`, `WELCOME100`।

## নোট
- ব্র্যান্ড রং `assets/css/style.css` এর `:root` এ (`--brand` ইত্যাদি)।
- ছবি placeholder; শর্তাবলী/রিটার্ন/শিপিং পেজের লেখা ড্রাফট।
- মোবাইলে (<768px) নিচে ফিক্সড গোল আইকন মেনু।
