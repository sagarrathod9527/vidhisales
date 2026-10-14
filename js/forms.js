/* VIDHI SALES — shared form engine: inline validation UI + submit pipeline.
   Used by the quotation builder (quote.js) and the contact form (contact.js). */
(function () {
    'use strict';
    var VS = window.VS = window.VS || {};
    var $ = VS.util.$, esc = VS.util.esc;

    /* ---------- Inline field validation ----------
       schema = { fieldName: function (rawValue) -> { ok, msg, value, suggestion } }
       Rules: validate on blur; once a field has been touched (or failed), re-check on every keystroke. */
    function Validator(form, schema) {
        var self = this;
        this.form = form;
        this.schema = schema;
        this.touched = {};
        Object.keys(schema).forEach(function (name) {
            var el = form.elements[name];
            if (!el) return;
            el.addEventListener('blur', function () { self.touched[name] = true; self.check(name); });
            el.addEventListener('input', function () { if (self.touched[name]) self.check(name); });
        });
    }
    Validator.prototype.check = function (name) {
        var el = this.form.elements[name];
        var res = this.schema[name](el.value, this.form);
        var wrap = el.closest('.field');
        var err = wrap && $('.err', wrap);
        var sug = wrap && $('.suggest', wrap);
        var empty = String(el.value).trim() === '';
        if (wrap) {
            wrap.classList.toggle('invalid', !res.ok);
            wrap.classList.toggle('valid', !!res.ok && !empty);
        }
        el.setAttribute('aria-invalid', res.ok ? 'false' : 'true');
        if (err) err.textContent = res.ok ? '' : res.msg;
        if (sug) {
            if (res.ok && res.suggestion) {
                sug.innerHTML = 'Did you mean <button type="button" class="link-btn" data-fix="' + esc(res.suggestion) + '">' + esc(res.suggestion) + '</button>?';
                sug.hidden = false;
            } else { sug.hidden = true; sug.innerHTML = ''; }
        }
        return res;
    };
    /* Checks every field. Returns { ok, firstInvalid (element), values }. */
    Validator.prototype.checkAll = function () {
        var self = this, ok = true, first = null, values = {};
        Object.keys(this.schema).forEach(function (name) {
            self.touched[name] = true;
            var r = self.check(name);
            if (r.ok) values[name] = r.value; else { ok = false; if (!first) first = self.form.elements[name]; }
        });
        return { ok: ok, firstInvalid: first, values: values };
    };
    Validator.prototype.reset = function () {
        var self = this;
        this.touched = {};
        Object.keys(this.schema).forEach(function (name) {
            var el = self.form.elements[name]; if (!el) return;
            var wrap = el.closest('.field');
            if (wrap) { wrap.classList.remove('invalid', 'valid'); var e = $('.err', wrap); if (e) e.textContent = ''; var s = $('.suggest', wrap); if (s) { s.hidden = true; s.innerHTML = ''; } }
            el.removeAttribute('aria-invalid');
        });
    };
    // "Did you mean ...?" click handler
    document.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-fix]');
        if (!b) return;
        var wrap = b.closest('.field'), input = wrap && $('input', wrap);
        if (input) { input.value = b.getAttribute('data-fix'); input.dispatchEvent(new Event('input', { bubbles: true })); input.focus(); }
    });

    // Live character counter for textareas ( <span class="count" data-for="message" data-max="1000"> )
    function bindCounters(form) {
        Array.prototype.forEach.call(form.querySelectorAll('.count[data-for]'), function (c) {
            var el = form.elements[c.getAttribute('data-for')], max = parseInt(c.getAttribute('data-max'), 10);
            if (!el) return;
            var upd = function () { c.textContent = el.value.length + ' / ' + max; c.classList.toggle('over', el.value.length > max); };
            el.addEventListener('input', upd); upd();
        });
    }
    // Keep phone box to phone-safe characters while typing
    function bindPhoneFilter(el) {
        if (!el) return;
        el.addEventListener('input', function () {
            var cleaned = el.value.replace(/[^0-9+\s().\-]/g, '');
            if (cleaned !== el.value) el.value = cleaned;
        });
    }

    function scrollToField(el) {
        if (!el) return;
        var r = el.getBoundingClientRect();
        if (r.top < 100 || r.bottom > window.innerHeight - 40) {
            window.scrollTo({ top: window.scrollY + r.top - 140, behavior: VS.util.reduceMotion ? 'auto' : 'smooth' });
        }
        el.focus({ preventScroll: true });
    }

    /* ---------- Submit pipeline ----------
       1) POST to the PHP API (saves into MySQL, returns a reference number).
       2) Email the owner through EmailJS.
       If the PHP server cannot be reached at all (e.g. static hosting), the request is still
       delivered by email so the customer never loses their enquiry. */
    var emailReady = typeof EMAILJS_PUBLIC_KEY !== 'undefined' && String(EMAILJS_PUBLIC_KEY).indexOf('YOUR_') !== 0 && window.emailjs;
    if (emailReady) { try { window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY }); } catch (e) { emailReady = false; } }

    function api(endpoint, formData) {
        var base = typeof API_BASE !== 'undefined' ? API_BASE : 'api/';
        return fetch(base + endpoint, { method: 'POST', body: formData }).then(function (res) {
            return res.text().then(function (txt) {
                var data = null;
                try { data = JSON.parse(txt); } catch (e) { /* not JSON */ }
                if (data && data.success) return data;
                var err = new Error((data && data.message) || 'Could not save your request.');
                err.kind = data ? (res.status === 422 ? 'validation' : 'server') : 'unavailable';
                throw err;
            });
        }, function () {
            var err = new Error('Could not reach the server.');
            err.kind = 'unavailable';
            throw err;
        });
    }
    function sendEmail(templateId, params) {
        if (!emailReady) return Promise.reject(new Error('Email service is not configured.'));
        return window.emailjs.send(EMAILJS_SERVICE_ID, templateId, params);
    }

    /* opts: { endpoint, formData, templateId, params } -> resolves { reference, via } */
    function deliver(opts) {
        return api(opts.endpoint, opts.formData).then(function (data) {
            var p = Object.assign({}, opts.params, { reference: data.reference });
            sendEmail(opts.templateId, p).catch(function () { /* the request is already safely stored */ });
            return { reference: data.reference, via: 'database' };
        }, function (err) {
            if (err.kind !== 'unavailable') throw err;
            return sendEmail(opts.templateId, Object.assign({}, opts.params, { reference: 'Not stored (server offline)' })).then(function () {
                return { reference: null, via: 'email' };
            }, function () {
                throw new Error('We could not send your request right now. Please call 9049007159 or email vidhisalesproducts@gmail.com.');
            });
        });
    }

    VS.forms = { Validator: Validator, bindCounters: bindCounters, bindPhoneFilter: bindPhoneFilter, scrollToField: scrollToField, deliver: deliver };
})();
