/* VIDHI SALES — contact form (contact.html) */
(function () {
    'use strict';
    var VS = window.VS, V = VS.validate, $ = VS.util.$, esc = VS.util.esc;
    var form = $('#contactForm');
    if (!form) return;
    var status = $('#contactStatus'), btn = $('button[type="submit"]', form), sending = false;
    var validator = new VS.forms.Validator(form, {
        name: V.name,
        email: V.email,
        phone: function (v) { return V.phone(v, { optional: true }); },
        message: function (v) { return V.text(v, { label: 'Your message', max: 1000, min: 10, required: true }); }
    });
    VS.forms.bindCounters(form);
    VS.forms.bindPhoneFilter(form.elements.phone);
    function setStatus(kind, html) { status.className = 'status ' + (kind || ''); status.innerHTML = html || ''; }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (sending) return;
        var chk = validator.checkAll();
        if (!chk.ok) { setStatus('error', 'Please correct the highlighted fields. Nothing has been sent yet.'); VS.forms.scrollToField(chk.firstInvalid); return; }
        var v = chk.values;
        var fd = new FormData();
        fd.append('name', v.name);
        fd.append('email', v.email);
        fd.append('message', (v.phone ? 'Phone: ' + v.phone + '\n\n' : '') + v.message);
        fd.append('website', form.elements.xq_trap_7f3.value);
        var params = { subject: 'VIDHI SALES Website Contact', to_email: typeof OWNER_EMAIL !== 'undefined' ? OWNER_EMAIL : 'vidhisalesproducts@gmail.com', name: v.name, email: v.email, phone: v.phone || '-', message: v.message };
        sending = true; btn.disabled = true; btn.classList.add('loading');
        setStatus('info', 'Sending your message…');
        VS.forms.deliver({ endpoint: 'contact', formData: fd, templateId: typeof EMAILJS_CONTACT_TEMPLATE_ID !== 'undefined' ? EMAILJS_CONTACT_TEMPLATE_ID : '', params: params })
            .then(function (out) {
                setStatus('success', 'Thank you, ' + esc(v.name.split(' ')[0]) + '! Your message has been sent.' + (out.reference ? ' Reference: <b>' + esc(out.reference) + '</b>.' : ''));
                form.reset(); validator.reset(); VS.forms.bindCounters(form);
                VS.toast('Message sent.');
            })
            .catch(function (err) { setStatus('error', esc(err.message)); })
            .then(function () { sending = false; btn.disabled = false; btn.classList.remove('loading'); });
    });
})();
