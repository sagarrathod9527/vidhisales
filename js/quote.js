/* VIDHI SALES — quotation builder (quote.html)
   - Add many products AND services to one quotation.
   - Each product/service can be added only once (change its quantity instead).
   - Name, phone, email and every quantity are validated before anything is sent. */
(function () {
    'use strict';
    var VS = window.VS, D = VS.data, V = VS.validate, B = VS.basket;
    var $ = VS.util.$, $$ = VS.util.$$, esc = VS.util.esc;
    var form = $('#quoteForm');
    if (!form) return;

    var ICON = VS.icons;
    var mode = 'product';       // which catalogue the picker searches
    var pending = null;         // item chosen in the picker but not yet added
    var activeIdx = -1;         // keyboard highlight inside the dropdown
    var sending = false;
    var justAdded = null;       // row to highlight after the next render

    var input = $('#itemSearch'), listEl = $('#comboList'), comboErr = $('#comboErr');
    var addQty = $('#addQty'), qtyField = $('#qtyField'), qtyErr = $('#qtyErr');
    var addBtn = $('#addBtn'), itemList = $('#itemList'), listErr = $('#listErr'), listCount = $('#listCount');
    var status = $('#quoteStatus'), submitBtn = $('#sendBtn'), clearAll = $('#clearAll');

    /* ---------------- Picker (searchable dropdown) ---------------- */
    function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }
    function matches(item, q) {
        if (!q) return true;
        var text = norm([item.name, item.desc, item.catLabel || '', (item.kw || []).join(' ')].join(' '));
        var words = text.split(' ');
        return norm(q).split(' ').every(function (tok) {
            return words.some(function (w) { return w.indexOf(tok) === 0 || (tok.length >= 4 && lev(w, tok) <= 1); }) || text.indexOf(tok) >= 0;
        });
    }
    function lev(a, b) {
        var m = [], i, j;
        for (i = 0; i <= a.length; i++) m[i] = [i];
        for (j = 1; j <= b.length; j++) m[0][j] = j;
        for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        return m[a.length][b.length];
    }
    function pool() { return mode === 'service' ? D.services : D.products; }
    function candidates() {
        var q = input.value.trim(), nq = norm(q);
        return pool().filter(function (it) { return matches(it, q); }).sort(function (a, b) {
            var as = norm(a.name).indexOf(nq) === 0 ? 0 : 1, bs = norm(b.name).indexOf(nq) === 0 ? 0 : 1;
            return as - bs;
        });
    }
    function renderOptions() {
        var list = candidates();
        activeIdx = -1;
        if (!list.length) {
            listEl.innerHTML = '<li class="opt-empty" role="presentation">No ' + (mode === 'service' ? 'service' : 'product') + ' matches “' + esc(input.value.trim()) + '”. Try a shorter word.</li>';
            return;
        }
        listEl.innerHTML = list.map(function (it, i) {
            var added = B.has(it.type + ':' + it.id);
            return '<li role="option" id="opt-' + i + '" class="opt' + (added ? ' is-added' : '') + '" data-id="' + esc(it.id) + '" aria-disabled="' + added + '">' +
                '<span class="opt-img"><img src="' + esc(it.img) + '" alt="" loading="lazy"></span>' +
                '<span class="opt-name">' + esc(it.name) + '<small>' + esc(it.type === 'product' ? it.catLabel : 'Service') + '</small></span>' +
                (added ? '<span class="opt-badge">' + ICON.check + 'Added</span>' : '') + '</li>';
        }).join('');
    }
    function openList() { renderOptions(); listEl.hidden = false; input.setAttribute('aria-expanded', 'true'); }
    function closeList() { listEl.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); activeIdx = -1; }
    function setActive(idx) {
        var opts = $$('.opt', listEl);
        if (!opts.length) return;
        opts.forEach(function (o) { o.classList.remove('active'); });
        activeIdx = (idx + opts.length) % opts.length;
        var o = opts[activeIdx];
        o.classList.add('active');
        input.setAttribute('aria-activedescendant', o.id);
        o.scrollIntoView({ block: 'nearest' });
    }
    function choose(id) {
        var item = D.find(mode, id);
        if (!item) return;
        if (B.has(item.type + ':' + item.id)) {
            showComboError(item.name + ' is already in your list. Change its quantity in the list below instead.');
            flashRow(item.type + ':' + item.id);
            return;
        }
        pending = item;
        input.value = item.name;
        clearComboError();
        closeList();
        (mode === 'product' ? addQty : addBtn).focus();
    }
    function showComboError(msg) { comboErr.textContent = msg; input.closest('.field').classList.add('invalid'); input.setAttribute('aria-invalid', 'true'); }
    function clearComboError() { comboErr.textContent = ''; input.closest('.field').classList.remove('invalid'); input.removeAttribute('aria-invalid'); }
    function showQtyError(msg) { qtyErr.textContent = msg; qtyField.classList.add('invalid'); addQty.setAttribute('aria-invalid', 'true'); }
    function clearQtyError() { qtyErr.textContent = ''; qtyField.classList.remove('invalid'); addQty.removeAttribute('aria-invalid'); }

    input.addEventListener('focus', openList);
    input.addEventListener('click', function () { if (listEl.hidden) openList(); });
    input.addEventListener('input', function () { pending = null; clearComboError(); openList(); });
    input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); if (listEl.hidden) openList(); setActive(activeIdx + 1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); if (listEl.hidden) openList(); setActive(activeIdx - 1); }
        else if (e.key === 'Escape') { closeList(); }
        else if (e.key === 'Enter') {
            e.preventDefault();
            var act = $('.opt.active', listEl);
            if (!listEl.hidden && act) choose(act.getAttribute('data-id')); else addCurrent();
        }
    });
    listEl.addEventListener('mousedown', function (e) { e.preventDefault(); }); // keep focus in the input
    listEl.addEventListener('click', function (e) {
        var o = e.target.closest('.opt');
        if (o) choose(o.getAttribute('data-id'));
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.combo')) closeList(); });

    /* mode tabs: Products | Services */
    $$('[data-mode]').forEach(function (tab) {
        tab.addEventListener('click', function () { setMode(tab.getAttribute('data-mode')); input.focus(); });
    });
    function setMode(m) {
        mode = m; pending = null; input.value = ''; clearComboError(); clearQtyError();
        $$('[data-mode]').forEach(function (t) { var on = t.getAttribute('data-mode') === m; t.classList.toggle('on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
        $('#comboLabel').textContent = m === 'service' ? 'Service' : 'Product';
        input.placeholder = m === 'service' ? 'Search services: training, deep cleaning, SOP…' : 'Search products: floor cleaner, vacuum, mop…';
        qtyField.hidden = m === 'service';
        addQty.value = '1';
        $('#modeHint').textContent = m === 'service' ? 'Services are quoted per requirement. Describe your site in the details box on the right.' : 'Pick a product, set the quantity, then add it. You can add as many different products as you need.';
        closeList();
    }

    /* ---------------- Add to list ---------------- */
    function exactMatch(text) {
        var n = norm(text);
        if (!n) return null;
        var hit = pool().filter(function (it) { return norm(it.name) === n; });
        return hit[0] || null;
    }
    function addCurrent() {
        clearComboError(); clearQtyError();
        var typed = input.value.trim();
        var label = mode === 'service' ? 'service' : 'product';
        if (!typed) { showComboError('Choose a ' + label + ' from the list first.'); openList(); return; }
        var item = pending || exactMatch(typed);
        if (!item) { showComboError('“' + typed + '” is not in our ' + label + ' list. Pick one of the suggestions.'); openList(); return; }
        var key = item.type + ':' + item.id;
        if (B.has(key)) {
            showComboError(item.name + ' is already in your list. Change its quantity in the list below instead.');
            flashRow(key);
            return;
        }
        var qty = 1;
        if (mode === 'product') {
            var q = V.quantity(addQty.value);
            if (!q.ok) { showQtyError(q.msg); addQty.focus(); return; }
            qty = q.value;
        }
        justAdded = key; // set before add(): the basket event re-renders the list synchronously
        var res = B.add(item.type, item.id, qty);
        if (!res.ok) {
            justAdded = null;
            showComboError(res.reason === 'full' ? 'You can add up to ' + VS.MAX_ITEMS + ' items per quotation. Send this one first.' : 'That item could not be added.');
            return;
        }
        pending = null; input.value = ''; addQty.value = '1';
        listErr.textContent = '';
        VS.toast(item.name + ' added.');
        input.focus();
    }
    addBtn.addEventListener('click', addCurrent);

    // quantity box in the picker
    addQty.addEventListener('input', function () {
        var c = addQty.value.replace(/\D/g, '').slice(0, 6);
        if (c !== addQty.value) addQty.value = c;
        if (qtyField.classList.contains('invalid')) { var q = V.quantity(addQty.value); if (q.ok) clearQtyError(); else showQtyError(q.msg); }
    });
    addQty.addEventListener('blur', function () { if (addQty.value !== '' || qtyErr.textContent) { var q = V.quantity(addQty.value); if (!q.ok) showQtyError(q.msg); } });
    addQty.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addCurrent(); } });
    $$('[data-step-add]').forEach(function (b) {
        b.addEventListener('click', function () {
            var cur = parseInt(addQty.value, 10); if (!(cur >= 1)) cur = 1;
            addQty.value = String(Math.min(100000, Math.max(1, cur + parseInt(b.getAttribute('data-step-add'), 10))));
            clearQtyError();
        });
    });

    /* ---------------- The list ---------------- */
    function typeLabel(i) { return i.type === 'service' ? 'Service' : (D.find('product', i.id) || {}).catLabel || 'Product'; }
    function renderList() {
        var list = B.list();
        listCount.textContent = list.length ? '(' + list.length + ')' : '';
        clearAll.hidden = list.length < 2;
        if (!list.length) {
            itemList.innerHTML = '<div class="empty-state"><div class="empty-ic">' + ICON.list + '</div><p><b>Your list is empty.</b><br>Search above, or browse <a href="products.html">products</a> and <a href="services.html">services</a> and press “Add to quote”.</p></div>';
        } else {
            itemList.innerHTML = '<ul class="q-list">' + list.map(function (i) {
                var qtyHtml = i.type === 'service'
                    ? '<span class="q-tag">No quantity needed</span>'
                    : '<div class="q-qty field"><div class="stepper" role="group" aria-label="Quantity for ' + esc(i.name) + '">' +
                    '<button type="button" class="step" data-q-step="-1" aria-label="Decrease quantity">−</button>' +
                    '<input type="text" inputmode="numeric" autocomplete="off" maxlength="6" value="' + i.qty + '" data-q-input aria-label="Quantity for ' + esc(i.name) + '">' +
                    '<button type="button" class="step" data-q-step="1" aria-label="Increase quantity">+</button></div><p class="err" role="alert"></p></div>';
                return '<li class="q-item" data-key="' + i.key + '"><span class="q-thumb"><img src="' + esc(i.img) + '" alt=""></span>' +
                    '<div class="q-info"><b>' + esc(i.name) + '</b><small>' + esc(typeLabel(i)) + '</small></div>' + qtyHtml +
                    '<button type="button" class="icon-btn q-remove" data-q-remove aria-label="Remove ' + esc(i.name) + ' from list">' + ICON.x + '</button></li>';
            }).join('') + '</ul>';
        }
        updateSummary();
        if (justAdded) { flashRow(justAdded); justAdded = null; }
    }
    function updateSummary() {
        var list = B.list();
        var p = list.filter(function (i) { return i.type === 'product'; }).length, s = list.length - p;
        var units = list.reduce(function (n, i) { return n + (i.type === 'product' ? i.qty : 0); }, 0);
        var parts = [];
        if (p) parts.push(p + (p === 1 ? ' product' : ' products'));
        if (s) parts.push(s + (s === 1 ? ' service' : ' services'));
        $('#sumLine').textContent = parts.length ? parts.join(' and ') : 'No items yet';
        $('#sumUnits').textContent = p ? units + (units === 1 ? ' unit in total' : ' units in total') : '';
    }
    function flashRow(key) {
        var row = $('.q-item[data-key="' + key + '"]', itemList);
        if (!row) return;
        row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash');
        row.scrollIntoView({ block: 'nearest', behavior: VS.util.reduceMotion ? 'auto' : 'smooth' });
    }
    function rowQtyCheck(row, silent) {
        var inp = $('[data-q-input]', row);
        if (!inp) return true;
        var wrap = $('.q-qty', row), err = $('.err', row), r = V.quantity(inp.value);
        wrap.classList.toggle('invalid', !r.ok);
        inp.setAttribute('aria-invalid', r.ok ? 'false' : 'true');
        err.textContent = r.ok ? '' : r.msg;
        if (r.ok) B.setQty(row.getAttribute('data-key'), r.value);
        if (!silent) updateSummary();
        return r.ok;
    }
    itemList.addEventListener('input', function (e) {
        var inp = e.target.closest('[data-q-input]');
        if (!inp) return;
        var c = inp.value.replace(/\D/g, '').slice(0, 6);
        if (c !== inp.value) inp.value = c;
        rowQtyCheck(inp.closest('.q-item'));
        updateSummaryFromDom();
    });
    itemList.addEventListener('blur', function (e) { if (e.target.matches && e.target.matches('[data-q-input]')) rowQtyCheck(e.target.closest('.q-item')); }, true);
    itemList.addEventListener('click', function (e) {
        var rm = e.target.closest('[data-q-remove]');
        if (rm) { B.remove(rm.closest('.q-item').getAttribute('data-key')); return; }
        var st = e.target.closest('[data-q-step]');
        if (st) {
            var row = st.closest('.q-item'), inp = $('[data-q-input]', row);
            var cur = parseInt(inp.value, 10); if (!(cur >= 1)) cur = 1;
            inp.value = String(Math.min(100000, Math.max(1, cur + parseInt(st.getAttribute('data-q-step'), 10))));
            rowQtyCheck(row);
        }
    });
    function updateSummaryFromDom() { updateSummary(); }
    var armed = null;
    clearAll.addEventListener('click', function () {
        if (!armed) { clearAll.textContent = 'Click again to clear all'; armed = setTimeout(function () { armed = null; clearAll.textContent = 'Clear all'; }, 3000); return; }
        clearTimeout(armed); armed = null; clearAll.textContent = 'Clear all'; B.clear();
    });
    document.addEventListener('basket:change', function () { renderList(); if (!listEl.hidden) renderOptions(); if (B.count()) listErr.textContent = ''; });

    /* ---------------- Customer details ---------------- */
    var validator = new VS.forms.Validator(form, {
        customer_name: V.name,
        customer_phone: V.phone,
        customer_email: V.email,
        company: function (v) { return V.text(v, { label: 'Company name', max: 150 }); },
        message: function (v) { return V.text(v, { label: 'Your requirement', max: 1000 }); }
    });
    VS.forms.bindCounters(form);
    VS.forms.bindPhoneFilter(form.elements.customer_phone);

    // Keep what the visitor typed while they browse other pages to add more items.
    var DRAFT = 'vidhisales.quote.draft';
    var fields = ['customer_name', 'customer_phone', 'customer_email', 'company', 'message'];
    function saveDraft() { try { var o = {}; fields.forEach(function (f) { o[f] = form.elements[f].value; }); sessionStorage.setItem(DRAFT, JSON.stringify(o)); } catch (e) { } }
    function loadDraft() { try { var o = JSON.parse(sessionStorage.getItem(DRAFT) || 'null'); if (o) fields.forEach(function (f) { if (typeof o[f] === 'string') form.elements[f].value = o[f]; }); } catch (e) { } }
    function clearDraft() { try { sessionStorage.removeItem(DRAFT); } catch (e) { } }
    form.addEventListener('input', saveDraft);
    loadDraft();

    /* ---------------- Submit ---------------- */
    function setStatus(kind, html) { status.className = 'status ' + (kind || ''); status.innerHTML = html || ''; }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (sending) return;
        setStatus('', '');

        var details = validator.checkAll();
        var rows = $$('.q-item', itemList), badRow = null;
        rows.forEach(function (r) { if (!rowQtyCheck(r, true) && !badRow) badRow = r; });
        updateSummary();

        var listOk = true;
        if (B.count() === 0) { listErr.textContent = 'Add at least one product or service to your list before sending.'; listOk = false; }
        else listErr.textContent = '';

        if (!listOk || badRow || !details.ok) {
            var msgs = [];
            if (!listOk) msgs.push('add at least one product or service');
            if (badRow) msgs.push('fix the quantity');
            if (!details.ok) msgs.push('correct the highlighted details');
            setStatus('error', 'Please ' + msgs.join(', ') + ' and try again. Nothing has been sent yet.');
            if (!listOk) { VS.forms.scrollToField(input); }
            else if (badRow) { VS.forms.scrollToField($('[data-q-input]', badRow)); }
            else { VS.forms.scrollToField(details.firstInvalid); }
            return;
        }

        var list = B.list();
        var v = details.values;
        var lines = list.map(function (i, n) { return (n + 1) + '. ' + i.name + (i.type === 'product' ? ' × ' + i.qty : ' (service)'); });
        var units = list.reduce(function (n, i) { return n + (i.type === 'product' ? i.qty : 0); }, 0);

        var fd = new FormData();
        fd.append('customer_name', v.customer_name);
        fd.append('customer_phone', v.customer_phone);
        fd.append('customer_email', v.customer_email);
        fd.append('company', v.company);
        fd.append('message', v.message);
        fd.append('items', JSON.stringify(list.map(function (i) { return { type: i.type, name: i.name, qty: i.qty }; })));
        fd.append('xq_trap_7f3', form.elements.xq_trap_7f3.value);

        var params = {
            subject: 'VIDHI SALES Quotation Request (' + list.length + (list.length === 1 ? ' item)' : ' items)'),
            to_email: typeof OWNER_EMAIL !== 'undefined' ? OWNER_EMAIL : 'vidhisalesproducts@gmail.com',
            customer_name: v.customer_name, customer_phone: v.customer_phone, customer_email: v.customer_email,
            company: v.company || '-', message: v.message || '-',
            item: lines.join('; '),
            items_list: lines.join('\n'),
            items_html: '<ol>' + list.map(function (i) { return '<li>' + esc(i.name) + (i.type === 'product' ? ' &times; ' + i.qty : ' (service)') + '</li>'; }).join('') + '</ol>',
            quantity: units ? String(units) : 'n/a',
            item_count: String(list.length)
        };

        sending = true;
        submitBtn.classList.add('loading');
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.disabled = true;
        setStatus('info', 'Sending your quotation request…');

        VS.forms.deliver({ endpoint: 'quote', formData: fd, templateId: typeof EMAILJS_QUOTE_TEMPLATE_ID !== 'undefined' ? EMAILJS_QUOTE_TEMPLATE_ID : '', params: params })
            .then(function (out) {
                showSuccess(out, list, v);
                clearDraft();
                B.clear();
            })
            .catch(function (err) { setStatus('error', esc(err.message)); })
            .then(function () { sending = false; submitBtn.classList.remove('loading'); submitBtn.removeAttribute('aria-busy'); submitBtn.disabled = false; });
    });

    function showSuccess(out, list, v) {
        var panel = $('#sidePanel');
        var ref = out.reference
            ? '<p class="ref-label">Your reference number</p><p class="ref-no">' + esc(out.reference) + '</p>'
            : '<p class="ref-label">Your request has been emailed to our team.</p>';
        panel.innerHTML = '<div class="success"><div class="success-ic"><svg viewBox="0 0 52 52" width="64" height="64" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" stroke-width="2.5" class="s-ring"/><path d="M15 27l8 8 15-17" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" class="s-tick"/></svg></div>' +
            '<h2>Quotation request sent</h2>' + ref +
            '<p class="muted">Thank you, ' + esc(v.customer_name.split(' ')[0]) + '. We will contact you on <b>' + esc(v.customer_phone) + '</b> or at <b>' + esc(v.customer_email) + '</b> with your quotation.</p>' +
            '<ul class="sent-list">' + list.map(function (i) { return '<li>' + esc(i.name) + '<small>' + (i.type === 'product' ? '× ' + i.qty : 'Service') + '</small></li>'; }).join('') + '</ul>' +
            '<div class="success-actions"><a class="btn btn-primary" href="products.html">Browse more products</a><button type="button" class="btn btn-ghost" id="newQuote">Start a new quotation</button></div></div>';
        panel.scrollIntoView({ block: 'start', behavior: VS.util.reduceMotion ? 'auto' : 'smooth' });
        $('#newQuote').addEventListener('click', function () { window.location.reload(); });
    }

    /* ---------------- Boot ---------------- */
    // Optional deep link:  quote.html?add=product:high-pressure-machine,service:sop-development
    try {
        var add = new URLSearchParams(window.location.search).get('add');
        if (add) add.split(',').forEach(function (k) { var p = k.split(':'); if (p.length === 2) B.add(p[0], p[1], 1); });
    } catch (e) { }
    renderList();
    setMode('product');
})();
