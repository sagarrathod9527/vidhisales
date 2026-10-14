/* VIDHI SALES — page scripts: hero slider, featured items, product + service listings. */
(function () {
    'use strict';
    var VS = window.VS, D = VS.data, UI = VS.ui, $ = VS.util.$, $$ = VS.util.$$, esc = VS.util.esc;
    var PAGE = document.body.getAttribute('data-page');

    function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
    function lev(a, b) { var m = [], i, j; for (i = 0; i <= a.length; i++) m[i] = [i]; for (j = 1; j <= b.length; j++) m[0][j] = j; for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return m[a.length][b.length]; }
    function matches(it, q) {
        if (!q) return true;
        var text = norm([it.name, it.desc, it.catLabel, (it.kw || []).join(' ')].join(' ')), words = text.split(' ');
        return norm(q).split(' ').every(function (t) { return text.indexOf(t) >= 0 || words.some(function (w) { return t.length >= 4 && lev(w, t) <= 1; }); });
    }

    /* Hero slider */
    var slidesEl = $('#slides');
    if (slidesEl) {
        var slides = [['assets/hero-reference/hero-1.jpg', 'Professional cleaning in action'], ['assets/hero-reference/hero-2.jpg', 'Professional floor care'], ['assets/hero-reference/hero-3.jpg', 'Scrubber-dryer equipment'], ['assets/hero-reference/hero-4.jpg', 'Carpet deep cleaning'], ['assets/hero-reference/hero-5.jpg', 'Professional scrubbing machine'], ['assets/hero-reference/hero-6.jpg', 'Cleaning equipment & solutions']];
        var cur = 0, dots = $('#dots'), timer;
        slidesEl.innerHTML = slides.map(function (s, i) { return '<div class="slide' + (i ? '' : ' active') + '"><img src="' + s[0] + '" alt="' + esc(s[1]) + '"' + (i ? ' loading="lazy"' : '') + '><span class="slide-label">' + esc(s[1]) + '</span></div>'; }).join('');
        dots.innerHTML = slides.map(function (s, i) { return '<button type="button" class="dot' + (i ? '' : ' active') + '" data-go="' + i + '" aria-label="Show slide ' + (i + 1) + '"></button>'; }).join('');
        var go = function (i) { cur = (i + slides.length) % slides.length; $$('.slide', slidesEl).forEach(function (e, n) { e.classList.toggle('active', n === cur); }); $$('.dot', dots).forEach(function (e, n) { e.classList.toggle('active', n === cur); }); };
        var auto = function () { clearInterval(timer); if (!VS.util.reduceMotion) timer = setInterval(function () { go(cur + 1); }, 5000); };
        dots.addEventListener('click', function (e) { var b = e.target.closest('[data-go]'); if (b) { go(+b.getAttribute('data-go')); auto(); } });
        $$('[data-slide]').forEach(function (b) { b.addEventListener('click', function () { go(cur + (+b.getAttribute('data-slide'))); auto(); }); });
        auto();
    }

    /* Home */
    if (PAGE === 'home') {
        var fp = $('#featuredProducts');
        if (fp) fp.innerHTML = ['s2-all-klean-floor-cleaner', 'vac-301-wet-dry-vacuum-cleaner', 'single-disc-machine', 'high-pressure-machine', 'carpet-extractor', 'microfiber-floor-mop'].map(function (id) { var p = D.find('product', id); return p ? UI.productCard(p) : ''; }).join('');
        var fs = $('#featuredServices');
        if (fs) fs.innerHTML = D.services.slice(0, 6).map(function (s) { return UI.serviceCard(s); }).join('');
        var ig = $('#industryGrid');
        if (ig) ig.innerHTML = D.industries.map(function (x, i) { return '<div class="industry spot" data-reveal><span class="ind-no">' + String(i + 1).padStart(2, '0') + '</span>' + esc(x) + '</div>'; }).join('');
        UI.observe();
    }

    /* Products page */
    if (PAGE === 'products') {
        var grid = $('#productGrid'), search = $('#search'), cat = 'all', count = $('#resultCount');
        var render = function () {
            var q = search.value.trim();
            var list = D.products.filter(function (p) { return (cat === 'all' || p.cat === cat) && matches(p, q); });
            count.textContent = list.length + (list.length === 1 ? ' product' : ' products');
            grid.innerHTML = list.length ? list.map(UI.productCard).join('') : '<div class="empty-state wide"><p><b>No match.</b><br>Try <i>floor</i>, <i>vacuum</i>, <i>glass</i> or <i>machine</i>.</p></div>';
            UI.observe(grid);
        };
        search.addEventListener('input', render);
        $$('[data-cat]').forEach(function (b) { b.addEventListener('click', function () { cat = b.getAttribute('data-cat'); $$('[data-cat]').forEach(function (x) { x.classList.toggle('on', x === b); }); render(); }); });
        var qs = new URLSearchParams(location.search).get('q'); if (qs) search.value = qs;
        render();
    }

    /* Services page */
    if (PAGE === 'services') {
        var sg = $('#serviceGrid');
        sg.innerHTML = D.services.map(function (s) { return UI.serviceCard(s); }).join('');
        UI.observe(sg);
    }
})();
