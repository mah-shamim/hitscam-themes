/* শপ ও ক্যাটাগরি পেজের ফিল্টার + সর্টিং */
(function ($) {
  'use strict';
  window.initShopFilters = function (opts) {
    const D = HC.D, qs = new URLSearchParams(location.search);
    const fixedCat = opts && opts.fixedCat;
    const q0 = (qs.get('q') || '').toLowerCase();
    const cat0 = fixedCat || qs.get('cat') || '';

    const prices = D.products.map(p => HC.minPrice(p).sale);
    const PMIN = Math.floor(Math.min.apply(null, prices) / 50) * 50, PMAX = Math.ceil(Math.max.apply(null, prices) / 100) * 100;
    const catBox = fixedCat ? '' : `<div class="mb-4"><h6>ক্যাটাগরি</h6>${D.categories.map(c =>
      `<div class="form-check"><input class="form-check-input f-cat" type="checkbox" value="${c.slug}" id="fc-${c.slug}" ${c.slug === cat0 ? 'checked' : ''}><label class="form-check-label" for="fc-${c.slug}">${c.name}</label></div>`).join('')}</div>`;

    $('#filters').html(`<div class="filter-box">
      <div class="d-flex justify-content-between align-items-center mb-3"><h5 class="fw-bold m-0">ফিল্টার</h5><button class="btn btn-sm btn-link text-brand p-0" id="fReset" type="button">রিসেট</button></div>
      <div class="mb-4"><h6>সার্চ</h6><input class="form-control form-control-sm" id="fQ" value="${q0}" placeholder="প্রোডাক্টের নাম"></div>
      ${catBox}
      <div class="mb-4"><h6>প্রোডাক্ট টাইপ</h6>
        ${[['simple', 'Simple'], ['variable', 'Variable'], ['grouped', 'Grouped'], ['external', 'Affiliate']].map(t =>
          `<div class="form-check"><input class="form-check-input f-type" type="checkbox" value="${t[0]}" id="ft-${t[0]}"><label class="form-check-label" for="ft-${t[0]}">${t[1]}</label></div>`).join('')}</div>
      <div class="mb-4"><h6>মূল্য (৳) <small class="text-muted fw-normal" id="fPriceLbl"></small></h6>
        <div class="range2" id="fPriceRange">
          <div class="r2-track"><div class="r2-fill"></div></div>
          <input type="range" id="fMinR" min="${PMIN}" max="${PMAX}" step="50" value="${PMIN}" aria-label="সর্বনিম্ন মূল্য">
          <input type="range" id="fMaxR" min="${PMIN}" max="${PMAX}" step="50" value="${PMAX}" aria-label="সর্বোচ্চ মূল্য">
        </div>
        <div class="input-group input-group-sm mt-2"><span class="input-group-text">৳</span><input type="number" class="form-control" id="fMin" min="${PMIN}" max="${PMAX}" step="50" value="${PMIN}" aria-label="সর্বনিম্ন"><span class="input-group-text">–</span><input type="number" class="form-control" id="fMax" min="${PMIN}" max="${PMAX}" step="50" value="${PMAX}" aria-label="সর্বোচ্চ"></div></div>
      <div class="mb-4"><h6>রেটিং <small class="text-muted fw-normal" id="fRateLbl">সব</small></h6>
        <input type="range" class="form-range" id="fRate" min="0" max="5" step="0.1" value="0" aria-label="সর্বনিম্ন রেটিং">
        <div class="d-flex justify-content-between small text-muted"><span>০</span><span>★ ২.৫</span><span>★ ৫</span></div></div>
      <a class="btn btn-soft btn-sm w-100" href="compare.html"><i class="bi bi-arrow-left-right"></i> পণ্য তুলনা <span class="badge bg-dark ms-1" id="fCmpCount">0</span></a>
    </div>`);

    // দুই-হাতলের মূল্য রেঞ্জ: সংখ্যা ঘর ও স্লাইডার সিঙ্কে থাকে
    function syncRange(src) {
      let lo = +$('#fMinR').val(), hi = +$('#fMaxR').val();
      if (src === 'num') { lo = Math.max(PMIN, Math.min(+$('#fMin').val() || PMIN, PMAX)); hi = Math.max(PMIN, Math.min(+$('#fMax').val() || PMAX, PMAX)); }
      if (lo > hi) { if (src === 'min' || src === 'num') lo = hi; else hi = lo; }
      $('#fMinR').val(lo); $('#fMaxR').val(hi);
      if (src !== 'num') $('#fMin').val(lo), $('#fMax').val(hi);
      const span = PMAX - PMIN || 1;
      $('#fPriceRange .r2-fill').css({ left: ((lo - PMIN) / span * 100) + '%', right: (100 - (hi - PMIN) / span * 100) + '%' });
      $('#fPriceLbl').text(lo <= PMIN && hi >= PMAX ? '' : HC.BDT(lo) + ' – ' + HC.BDT(hi));
      const r = +$('#fRate').val(); $('#fRate').css('--p', (r / 5 * 100) + '%'); $('#fRateLbl').text(r > 0 ? '★ ' + r.toFixed(1) + '+' : 'সব');
      $('#fCmpCount').text(HC.cmp().length);
    }
    $(document).on('input', '#fMinR', () => syncRange('min')).on('input', '#fMaxR', () => syncRange('max')).on('input change', '#fMin, #fMax', () => syncRange('num')).on('input', '#fRate', () => syncRange('rate')).on('cmpchange', () => syncRange('rate'));
    function apply() {
      const cats = fixedCat ? [fixedCat] : $('.f-cat:checked').map((_, e) => e.value).get();
      const types = $('.f-type:checked').map((_, e) => e.value).get();
      const min = +$('#fMinR').val(), max = +$('#fMaxR').val(), rate = +$('#fRate').val(), q = $.trim($('#fQ').val()).toLowerCase();
      let list = D.products.filter(p => {
        const price = HC.minPrice(p).sale;
        return (!cats.length || cats.includes(p.cat)) && (!types.length || types.includes(p.type)) && price >= min && price <= max && p.rating >= rate && (!q || p.name.toLowerCase().includes(q));
      });
      const s = $('#sortBy').val();
      list.sort((a, b) => s === 'low' ? HC.minPrice(a).sale - HC.minPrice(b).sale : s === 'high' ? HC.minPrice(b).sale - HC.minPrice(a).sale : s === 'rating' ? b.rating - a.rating : b.reviews - a.reviews);
      $('#resultCount').text(list.length + 'টি পণ্য পাওয়া গেছে');
      HC.grid('#productList', list, 'col-12 col-sm-6 col-md-4');
    }
    $(document).on('change input', '#filters input, #filters select, #sortBy', apply);
    $('#fReset').on('click', function () { $('#filters input[type=checkbox]').prop('checked', false); $('#fQ').val(''); $('#fMinR, #fMin').val(PMIN); $('#fMaxR, #fMax').val(PMAX); $('#fRate').val(0); syncRange('rate'); apply(); });
    syncRange('rate'); apply();
  };
})(jQuery);
