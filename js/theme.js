/* VIDHI SALES — light/dark theme. Light is the default; the choice is remembered. */
(function () {
    'use strict';
    var KEY = 'vidhisales.theme', root = document.documentElement;
    function get() { try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'; } catch (e) { return 'light'; } }
    function apply(t) {
        root.setAttribute('data-theme', t);
        var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'dark' ? '#0a0f16' : '#f4f5f1');
        var b = document.getElementById('themeToggle');
        if (b) { b.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false'); b.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'); b.title = b.getAttribute('aria-label'); }
    }
    apply(get());
    document.addEventListener('DOMContentLoaded', function () {
        apply(get());
        var b = document.getElementById('themeToggle');
        if (b) b.addEventListener('click', function () {
            var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            try { localStorage.setItem(KEY, next); } catch (e) { }
            apply(next);
        });
    });
})();
