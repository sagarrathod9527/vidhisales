(function () {
    'use strict';
    var $ = function (s) { return document.querySelector(s); };
    var kind = 'quotes', page = 1, limit = 20, total = 0, timer;
    var STATUS = { quotes: ['new', 'contacted', 'quoted', 'closed', 'cancelled'], messages: ['new', 'read', 'replied'] };

    function api(url, opt) {
        opt = opt || {}; opt.headers = Object.assign({ 'X-Requested-With': 'fetch' }, opt.body ? { 'Content-Type': 'application/json' } : {}, opt.headers);
        return fetch(url, opt).then(function (r) { if (r.status === 401) { location.href = '/admin/login'; throw new Error('auth'); } return r.json(); });
    }
    function el(tag, props, kids) {            // safe DOM builder: text is never parsed as HTML
        var n = document.createElement(tag);
        Object.keys(props || {}).forEach(function (k) { if (k === 'class') n.className = props[k]; else if (k === 'text') n.textContent = props[k]; else if (k.indexOf('on') === 0) n.addEventListener(k.slice(2), props[k]); else n.setAttribute(k, props[k]); });
        (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
        return n;
    }
    function toast(m) { var t = el('div', { class: 'toast', text: m }); document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2200); }
    function when(s) { var d = new Date(s); return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    function qs() {
        var p = new URLSearchParams();
        if ($('#q').value.trim()) p.set('q', $('#q').value.trim());
        if ($('#st').value) p.set('status', $('#st').value);
        if ($('#from').value) p.set('from', $('#from').value);
        if ($('#to').value) p.set('to', $('#to').value);
        return p;
    }

    function loadStats() {
        api('/admin/api/stats').then(function (d) {
            var s = d.stats, box = $('#stats'); box.textContent = '';
            [['Quotations', s.quotes.total], ['New quotations', s.quotes.byStatus.new || 0], ['Quotations today', s.quotes.today], ['Messages', s.messages.total], ['New messages', s.messages.byStatus.new || 0]]
                .forEach(function (x) { box.appendChild(el('div', { class: 'stat' }, [el('small', { text: x[0] }), el('b', { text: String(x[1]) })])); });
        });
    }
    function head() {
        var cols = kind === 'quotes' ? ['Reference', 'Customer', 'Items', 'Details', 'Status', ''] : ['Reference', 'From', 'Message', 'Received', 'Status', ''];
        var tr = el('tr'); cols.forEach(function (c) { tr.appendChild(el('th', { text: c })); });
        $('#th').textContent = ''; $('#th').appendChild(tr);
        var sel = $('#st'); sel.textContent = ''; sel.appendChild(el('option', { value: '', text: 'All statuses' }));
        STATUS[kind].forEach(function (s) { sel.appendChild(el('option', { value: s, text: s })); });
    }
    function statusSel(r) {
        var sel = el('select', { class: 'status s-' + r.status, 'aria-label': 'Status' });
        STATUS[kind].forEach(function (s) { var o = el('option', { value: s, text: s }); if (s === r.status) o.selected = true; sel.appendChild(o); });
        sel.addEventListener('change', function () { api('/admin/api/' + kind + '/' + r.id, { method: 'PATCH', body: JSON.stringify({ status: sel.value }) }).then(function (d) { if (d.success) { sel.className = 'status s-' + sel.value; toast('Status updated'); loadStats(); } else toast(d.message || 'Failed'); }); });
        return sel;
    }
    function del(r) {
        return el('button', { class: 'btn danger', text: 'Delete', onclick: function () {
            if (!confirm('Delete ' + r.reference + ' permanently?')) return;
            api('/admin/api/' + kind + '/' + r.id, { method: 'DELETE' }).then(function (d) { if (d.success) { toast('Deleted'); load(); loadStats(); } });
        } });
    }
    function row(r) {
        var tr = el('tr');
        if (kind === 'quotes') {
            var ul = el('ul', { class: 'items' });
            (r.items && r.items.length ? r.items.map(function (i) { return i.item_name + (i.item_type === 'product' ? ' × ' + i.quantity : ' (service)'); }) : [r.item]).forEach(function (t) { ul.appendChild(el('li', { text: t })); });
            tr.appendChild(el('td', {}, [el('div', { class: 'ref', text: r.reference }), el('div', { class: 'sub', text: when(r.created_at) })]));
            tr.appendChild(el('td', {}, [el('b', { text: r.customer_name }), el('div', { class: 'sub', text: r.company || '' }), el('div', {}, [el('a', { href: 'tel:' + r.customer_phone, text: r.customer_phone })]), el('div', {}, [el('a', { href: 'mailto:' + r.customer_email, text: r.customer_email })])]));
            tr.appendChild(el('td', {}, [ul]));
            tr.appendChild(el('td', { class: 'msg', text: r.message || '—' }));
        } else {
            tr.appendChild(el('td', {}, [el('div', { class: 'ref', text: r.reference })]));
            tr.appendChild(el('td', {}, [el('b', { text: r.name }), el('div', {}, [el('a', { href: 'mailto:' + r.email, text: r.email })])]));
            tr.appendChild(el('td', { class: 'msg', text: r.message }));
            tr.appendChild(el('td', { text: when(r.created_at) }));
        }
        tr.appendChild(el('td', {}, [statusSel(r)]));
        tr.appendChild(el('td', {}, [del(r)]));
        return tr;
    }
    function load() {
        var p = qs(); p.set('page', page); p.set('limit', limit);
        api('/admin/api/' + kind + '?' + p).then(function (d) {
            total = d.total; var tb = $('#tb'); tb.textContent = '';
            if (!d.rows.length) { var td = el('td', { colspan: '6', class: 'empty', text: 'Nothing here yet.' }); tb.appendChild(el('tr', {}, [td])); }
            d.rows.forEach(function (r) { tb.appendChild(row(r)); });
            var pages = Math.max(1, Math.ceil(total / limit));
            $('#info').textContent = total + ' result' + (total === 1 ? '' : 's') + ' · page ' + page + ' of ' + pages;
            $('#prev').disabled = page <= 1; $('#next').disabled = page >= pages;
            var e = qs(); $('#csv').href = '/admin/api/' + kind + '/export.csv' + (e.toString() ? '?' + e : '');
        });
    }
    function reset() { page = 1; load(); }

    document.querySelectorAll('.tab').forEach(function (t) { t.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('on', x === t); });
        kind = t.getAttribute('data-k'); $('#q').value = ''; $('#from').value = ''; $('#to').value = ''; head(); reset();
    }); });
    $('#q').addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(reset, 300); });
    ['#st', '#from', '#to'].forEach(function (s) { $(s).addEventListener('change', reset); });
    $('#prev').addEventListener('click', function () { page--; load(); });
    $('#next').addEventListener('click', function () { page++; load(); });
    $('#out').addEventListener('click', function () { api('/admin/api/logout', { method: 'POST' }).then(function () { location.href = '/admin/login'; }); });
    $('#pw').addEventListener('click', function () { $('#pe').textContent = ''; $('#dlg').showModal(); });
    $('#cl').addEventListener('click', function () { $('#dlg').close(); });
    $('#pf').addEventListener('submit', function (ev) {
        ev.preventDefault();
        api('/admin/api/password', { method: 'POST', body: JSON.stringify({ current: $('#cur').value, next: $('#nw').value }) }).then(function (d) {
            if (d.success) { $('#dlg').close(); $('#pf').reset(); toast('Password changed'); } else $('#pe').textContent = d.message || 'Failed';
        });
    });
    api('/admin/api/me').then(function (d) { $('#who').textContent = d.username; });
    head(); load(); loadStats();
})();
