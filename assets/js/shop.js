/* শপ ও ক্যাটাগরি পেজের ফিল্টার + সর্টিং */
(function ($) {
  'use strict';
  window.initShopFilters = function (opts) {
    const D = HC.D, qs = new URLSearchParams(location.search);
    const fixedCat = opts && opts.fixedCat;
    const q0 = (qs.get('q') || '').toLowerCase();
    const cat0 = fixedCat || qs.get('cat') || '';

    const catBox = fixedCat ? '' : `<div class="mb-4"><h6>ক্যাটাগরি</h6>${D.categories.map(c =>
      `<div class="form-check"><input class="form-check-input f-cat" type="checkbox" value="${c.slug}" id="fc-${c.slug}" ${c.slug === cat0 ? 'checked' : ''}><label class="form-check-label" for="fc-${c.slug}">${c.name}</label></div>`).join('')}</div>`;

    $('#filters').html(`<div class="filter-box">
      <div class="d-flex justify-content-between align-items-center mb-3"><h5 class="fw-bold m-0">ফিল্টার</h5><button class="btn btn-sm btn-link text-brand p-0" id="fReset" type="button">রিসেট</button></div>
      <div class="mb-4"><h6>সার্চ</h6><input class="form-control form-control-sm" id="fQ" value="${q0}" placeholder="প্রোডাক্টের নাম"></div>
      ${catBox}
      <div class="mb-4"><h6>প্রোডাক্ট টাইপ</h6>
        ${[['simple', 'Simple'], ['variable', 'Variable'], ['grouped', 'Grouped'], ['external', 'Affiliate']].map(t =>
          `<div class="form-check"><input class="form-check-input f-type" type="checkbox" value="${t[0]}" id="ft-${t[0]}"><label class="form-check-label" for="ft-${t[0]}">${t[1]}</label></div>`).join('')}</div>
      <div class="mb-4"><h6>মূল্য (৳)</h6><div class="input-group input-group-sm"><input type="number" class="form-control" id="fMin" placeholder="সর্বনিম্ন" min="0"><input type="number" class="form-control" id="fMax" placeholder="সর্বোচ্চ" min="0"></div></div>
      <div><h6>রেটিং</h6><select class="form-select form-select-sm" id="fRate"><option value="0">সব</option><option value="4.5">৪.৫+ ★</option><option value="4">৪+ ★</option></select></div>
    </div>`);

    function apply() {
      const cats = fixedCat ? [fixedCat] : $('.f-cat:checked').map((_, e) => e.value).get();
      const types = $('.f-type:checked').map((_, e) => e.value).get();
      const min = +$('#fMin').val() || 0, max = +$('#fMax').val() || Infinity, rate = +$('#fRate').val(), q = $.trim($('#fQ').val()).toLowerCase();
      let list = D.products.filter(p => {
        const price = HC.minPrice(p).sale;
        return (!cats.length || cats.includes(p.cat)) && (!types.length || types.includes(p.type)) && price >= min && price <= max && p.rating >= rate && (!q || p.name.toLowerCase().includes(q));
      });
      const s = $('#sortBy').val();
      list.sort((a, b) => s === 'low' ? HC.minPrice(a).sale - HC.minPrice(b).sale : s === 'high' ? HC.minPrice(b).sale - HC.minPrice(a).sale : s === 'rating' ? b.rating - a.rating : b.reviews - a.reviews);
      $('#resultCount').text(list.length + 'টি পণ্য পাওয়া গেছে');
      HC.grid('#productList', list, 'col-6 col-md-4');
    }
    $(document).on('change input', '#filters input, #filters select, #sortBy', apply);
    $('#fReset').on('click', function () { $('#filters input[type=checkbox]').prop('checked', false); $('#filters input[type=number], #fQ').val(''); $('#fRate').val(0); apply(); });
    apply();
  };
})(jQuery);
