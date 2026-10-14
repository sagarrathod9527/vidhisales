/* VIDHI SALES — shared UI: quotation basket, toasts, card renderers, motion + effects.
   Loaded on every page (after data.js). */
(function () {
    'use strict';
    var VS = window.VS = window.VS || {};
    var D = VS.data;
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var PAGE = document.body.getAttribute('data-page') || '';
    VS.util = { $: $, $$: $$, esc: esc, reduceMotion: reduceMotion };

    var ICON = {
        plus: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
        check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
        x: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
        list: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/></svg>'
    };
    VS.icons = ICON;

    /* ======================= Quotation basket =======================
       One entry per product/service (key = "type:id"). Duplicates are refused.
       Saved in localStorage so the list follows the visitor from page to page. */
    var STORE_KEY = 'vidhisales.quote.v1';
    var MAX_ITEMS = VS.MAX_ITEMS = 50;
    var memory = null; // fallback when storage is blocked

    function readStore() {
        var raw = null;
        try { raw = window.localStorage.getItem(STORE_KEY); } catch (e) { return memory || []; }
        if (!raw) return [];
        try { var arr = JSON.parse(raw); return Array.isArray(arr) ? arr : []; } catch (e) { return []; }
    }
    function writeStore(list) {
        memory = list;
        try { window.localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) { /* private mode */ }
    }
    function hydrate(list) {
        var seen = {}, out = [];
        list.forEach(function (r) {
            if (!r || (r.type !== 'product' && r.type !== 'service')) return;
            var item = D.find(r.type, r.id);
            var key = r.type + ':' + r.id;
            if (!item || seen[key]) return;
            seen[key] = 1;
            var q = parseInt(r.qty, 10);
            out.push({ key: key, type: r.type, id: r.id, name: item.name, img: item.img, qty: r.type === 'service' ? 1 : (q >= 1 && q <= 100000 ? q : 1) });
        });
        return out.slice(0, MAX_ITEMS);
    }
    var items = hydrate(readStore());

    function persist() {
        writeStore(items.map(function (i) { return { type: i.type, id: i.id, qty: i.qty }; }));
        document.dispatchEvent(new CustomEvent('basket:change'));
    }
    var basket = VS.basket = {
        list: function () { return items.slice(); },
        count: function () { return items.length; },
        has: function (key) { return items.some(function (i) { return i.key === key; }); },
        get: function (key) { for (var i = 0; i < items.length; i++) { if (items[i].key === key) return items[i]; } return null; },
        /* returns { ok:true } or { ok:false, reason:'duplicate'|'full'|'unknown' } */
        add: function (type, id, qty) {
            var item = D.find(type, id);
            if (!item) return { ok: false, reason: 'unknown' };
            var key = type + ':' + id;
            if (basket.has(key)) return { ok: false, reason: 'duplicate', name: item.name };
            if (items.length >= MAX_ITEMS) return { ok: false, reason: 'full' };
            var n = type === 'service' ? 1 : (parseInt(qty, 10) || 1);
            items.push({ key: key, type: type, id: id, name: item.name, img: item.img, qty: n });
            persist();
            return { ok: true, name: item.name };
        },
        remove: function (key) {
            var before = items.length;
            items = items.filter(function (i) { return i.key !== key; });
            if (items.length !== before) persist();
        },
        setQty: function (key, qty) {
            var it = basket.get(key);
            if (!it || it.type === 'service') return;
            it.qty = qty;
            writeStore(items.map(function (i) { return { type: i.type, id: i.id, qty: i.qty }; })); // no re-render while typing
        },
        clear: function () { items = []; persist(); }
    };
    window.addEventListener('storage', function (e) { // keep other open tabs in sync
        if (e.key === STORE_KEY) { items = hydrate(readStore()); document.dispatchEvent(new CustomEvent('basket:change')); }
    });

    /* ======================= Toasts ======================= */
    var toastWrap = document.createElement('div');
    toastWrap.className = 'toasts';
    toastWrap.setAttribute('role', 'status');
    toastWrap.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastWrap);
    VS.toast = function (msg, kind) {
        var t = document.createElement('div');
        t.className = 'toast ' + (kind || '');
        t.innerHTML = '<span class="toast-ic">' + (kind === 'warn' ? '!' : ICON.check) + '</span><span>' + esc(msg) + '</span>';
        toastWrap.appendChild(t);
        while (toastWrap.children.length > 3) toastWrap.removeChild(toastWrap.firstChild);
        requestAnimationFrame(function () { t.classList.add('show'); });
        setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 400); }, 2800);
    };

    /* ======================= Card renderers ======================= */
    function addControls(type, id) {
        var key = type + ':' + id;
        return '<div class="add-wrap" data-key="' + key + '">' +
            '<button type="button" class="btn btn-add" data-add="' + key + '"><span class="ic-plus">' + ICON.plus + '</span><span class="ic-check">' + ICON.check + '</span><span class="add-label">Add to quote</span></button>' +
            '<button type="button" class="icon-btn remove-mini" data-remove="' + key + '" aria-label="Remove from quotation list" title="Remove from quotation list">' + ICON.x + '</button></div>';
    }
    VS.ui = {
        productCard: function (p) {
            return '<article class="card product-card spot tilt" data-reveal>' +
                '<div class="p-stage"><img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async"><span class="chip chip-' + p.cat + '">' + esc(p.catLabel) + '</span></div>' +
                '<div class="p-body"><h3>' + esc(p.name) + '</h3><p>' + esc(p.desc) + '</p>' + addControls('product', p.id) + '</div></article>';
        },
        serviceCard: function (s, extra) {
            return '<article class="card service-card spot ' + (extra || '') + '" data-reveal>' +
                '<div class="s-icon"><img src="' + esc(s.img) + '" alt="" width="56" height="56" loading="lazy"></div>' +
                '<h3>' + esc(s.name) + '</h3><p>' + esc(s.desc) + '</p>' + addControls('service', s.id) + '</article>';
        },
        observe: function (root) { observeReveals(root || document); syncButtons(); }
    };

    function syncButtons() {
        $$('.add-wrap').forEach(function (w) {
            var added = basket.has(w.getAttribute('data-key'));
            w.classList.toggle('is-added', added);
            var b = $('.btn-add', w);
            b.setAttribute('aria-disabled', added ? 'true' : 'false');
            b.querySelector('.add-label').textContent = added ? 'Added to quote' : 'Add to quote';
            b.tabIndex = added ? -1 : 0;
        });
    }

    document.addEventListener('click', function (e) {
        var add = e.target.closest && e.target.closest('[data-add]');
        if (add) {
            var parts = add.getAttribute('data-add').split(':');
            var res = basket.add(parts[0], parts.slice(1).join(':'), 1);
            if (res.ok) { VS.toast(res.name + ' added to your quotation list.'); pulseFab(); }
            else if (res.reason === 'duplicate') VS.toast(res.name + ' is already in your quotation list.', 'warn');
            else if (res.reason === 'full') VS.toast('Your list is full (' + MAX_ITEMS + ' items). Send this quotation first.', 'warn');
            return;
        }
        var rm = e.target.closest && e.target.closest('[data-remove]');
        if (rm) { basket.remove(rm.getAttribute('data-remove')); VS.toast('Removed from your quotation list.'); }
    });

    /* ======================= Basket FAB + drawer + header badge ======================= */
    var fab, drawer, scrim;
    function buildBasketUI() {
        if (PAGE === 'quote') return;
        fab = document.createElement('button');
        fab.type = 'button';
        fab.className = 'fab';
        fab.id = 'basketFab';
        fab.setAttribute('aria-haspopup', 'dialog');
        fab.innerHTML = '<span class="fab-ic">' + ICON.list + '</span><span class="fab-text">Request quote</span><span class="fab-count" data-basket-count>0</span>';
        document.body.appendChild(fab);

        scrim = document.createElement('div');
        scrim.className = 'scrim';
        document.body.appendChild(scrim);

        drawer = document.createElement('aside');
        drawer.className = 'drawer';
        drawer.setAttribute('role', 'dialog');
        drawer.setAttribute('aria-modal', 'true');
        drawer.setAttribute('aria-label', 'Your quotation list');
        drawer.innerHTML = '<div class="drawer-head"><h2>Your quotation list</h2><button type="button" class="icon-btn" data-close aria-label="Close">' + ICON.x + '</button></div>' +
            '<div class="drawer-body" id="drawerBody"></div>' +
            '<div class="drawer-foot"><a class="btn btn-primary" href="quote.html">Review &amp; send quotation</a><button type="button" class="link-btn" data-clear>Clear list</button></div>';
        document.body.appendChild(drawer);

        fab.addEventListener('click', function () {
            if (basket.count() === 0) { window.location.href = 'quote.html'; return; }
            openDrawer();
        });
        scrim.addEventListener('click', closeDrawer);
        drawer.addEventListener('click', function (e) {
            if (e.target.closest('[data-close]')) closeDrawer();
            if (e.target.closest('[data-clear]')) { basket.clear(); }
            var r = e.target.closest('[data-drawer-remove]');
            if (r) basket.remove(r.getAttribute('data-drawer-remove'));
        });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer(); });
    }
    function openDrawer() { renderDrawer(); drawer.classList.add('open'); scrim.classList.add('open'); fab.setAttribute('aria-expanded', 'true'); var c = $('[data-close]', drawer); if (c) c.focus(); }
    function closeDrawer() { drawer.classList.remove('open'); scrim.classList.remove('open'); fab.setAttribute('aria-expanded', 'false'); fab.focus(); }
    function renderDrawer() {
        var body = $('#drawerBody');
        if (!body) return;
        var list = basket.list();
        if (!list.length) { body.innerHTML = '<p class="muted pad">Nothing added yet. Use “Add to quote” on any product or service.</p>'; return; }
        body.innerHTML = '<ul class="mini-list">' + list.map(function (i) {
            return '<li><span class="mini-img"><img src="' + esc(i.img) + '" alt=""></span><span class="mini-txt"><b>' + esc(i.name) + '</b><small>' + (i.type === 'service' ? 'Service' : 'Product, qty ' + i.qty) + '</small></span>' +
                '<button type="button" class="icon-btn" data-drawer-remove="' + i.key + '" aria-label="Remove ' + esc(i.name) + '">' + ICON.x + '</button></li>';
        }).join('') + '</ul>';
    }
    function pulseFab() { if (!fab) return; fab.classList.remove('bump'); void fab.offsetWidth; fab.classList.add('bump'); }
    function syncCounts() {
        var n = basket.count();
        $$('[data-basket-count]').forEach(function (el) { el.textContent = n; el.classList.toggle('has', n > 0); });
        if (fab) {
            fab.classList.toggle('filled', n > 0);
            var t = $('.fab-text', fab); if (t) t.textContent = n > 0 ? 'Quote list' : 'Request quote';
        }
        if (drawer && drawer.classList.contains('open')) { if (n === 0) closeDrawer(); else renderDrawer(); }
        syncButtons();
    }
    document.addEventListener('basket:change', syncCounts);

    /* ======================= Header / menu ======================= */
    var header = $('.site-header');
    var progress = $('.progress');
    function onScroll() {
        var y = window.scrollY || 0;
        if (header) header.classList.toggle('scrolled', y > 16);
        if (progress) {
            var h = document.documentElement.scrollHeight - window.innerHeight;
            progress.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var menuBtn = $('.menu-btn'), nav = $('#primaryNav');
    function closeMenu() { if (!nav) return; nav.classList.remove('open'); menuBtn.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
    if (menuBtn && nav) {
        menuBtn.addEventListener('click', function () {
            var open = nav.classList.toggle('open');
            menuBtn.classList.toggle('open', open);
            menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    }

    /* ======================= Scroll reveal + counters ======================= */
    var revealIO = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            en.target.classList.add('in');
            revealIO.unobserve(en.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) : null;

    function observeReveals(root) {
        $$('[data-reveal]', root).forEach(function (el) {
            if (el.__obs) return;
            el.__obs = true;
            el.classList.add('reveal');
            var idx = 0, s = el;
            while ((s = s.previousElementSibling)) { if (s.hasAttribute('data-reveal')) idx++; }
            el.style.setProperty('--d', Math.min(idx, 8) * 60 + 'ms');
            if (revealIO) revealIO.observe(el); else el.classList.add('in');
        });
    }
    var countIO = ('IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
            if (!en.isIntersecting) return;
            countIO.unobserve(en.target);
            runCounter(en.target);
        });
    }, { threshold: 0.6 }) : null;
    function runCounter(el) {
        var target = parseInt(el.getAttribute('data-count'), 10), suffix = el.getAttribute('data-suffix') || '';
        if (reduceMotion || !target) { el.textContent = target + suffix; return; }
        var start = null, dur = 1400;
        function step(ts) {
            if (start === null) start = ts;
            var p = Math.min(1, (ts - start) / dur), e = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * e) + suffix;
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }
    $$('[data-count]').forEach(function (el) { if (countIO) countIO.observe(el); else runCounter(el); });

    /* ======================= Pointer effects (spotlight, tilt, magnetic, glow) ======================= */
    document.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var spot = e.target.closest && e.target.closest('.spot');
        if (spot) {
            var r = spot.getBoundingClientRect();
            spot.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            spot.style.setProperty('--my', (e.clientY - r.top) + 'px');
        }
    }, { passive: true });

    if (finePointer && !reduceMotion) {
        var tilted = null;
        document.addEventListener('pointermove', function (e) {
            var el = e.target.closest && e.target.closest('.tilt');
            if (tilted && tilted !== el) { tilted.style.transform = ''; tilted = null; }
            if (!el) return;
            var r = el.getBoundingClientRect();
            var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
            el.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * 6).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 8).toFixed(2) + 'deg) translateY(-4px)';
            tilted = el;
        }, { passive: true });
        document.addEventListener('mouseleave', function () { if (tilted) { tilted.style.transform = ''; tilted = null; } });

        var mag = null;
        document.addEventListener('pointermove', function (e) {
            var el = e.target.closest && e.target.closest('.magnetic');
            if (mag && mag !== el) { mag.style.translate = ''; mag = null; }
            if (!el) return;
            var r = el.getBoundingClientRect();
            el.style.translate = ((e.clientX - (r.left + r.width / 2)) * 0.16).toFixed(1) + 'px ' + ((e.clientY - (r.top + r.height / 2)) * 0.26).toFixed(1) + 'px';
            mag = el;
        }, { passive: true });

        var glow = document.createElement('div');
        glow.className = 'cursor-glow';
        document.body.appendChild(glow);
        var gx = -400, gy = -400, tx = -400, ty = -400, running = false;
        var loop = function () {
            gx += (tx - gx) * 0.14; gy += (ty - gy) * 0.14;
            glow.style.transform = 'translate3d(' + (gx - 240) + 'px,' + (gy - 240) + 'px,0)';
            if (Math.abs(tx - gx) > 0.5 || Math.abs(ty - gy) > 0.5) requestAnimationFrame(loop); else running = false;
        };
        document.addEventListener('pointermove', function (e) {
            tx = e.clientX; ty = e.clientY; glow.classList.add('on');
            if (!running) { running = true; requestAnimationFrame(loop); }
        }, { passive: true });
    }

    /* ======================= Page transitions ======================= */
    document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href]');
        if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (a.target && a.target !== '_self') return;
        if (a.hasAttribute('download')) return;
        var href = a.getAttribute('href');
        if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) return;
        var url;
        try { url = new URL(a.href, window.location.href); } catch (err) { return; }
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
        if (reduceMotion) return;
        e.preventDefault();
        document.documentElement.classList.add('leaving');
        setTimeout(function () { window.location.href = a.href; }, 280);
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) document.documentElement.classList.remove('leaving'); });

    /* ======================= Boot ======================= */
    var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
    buildBasketUI();
    observeReveals(document);
    syncCounts();
})();
