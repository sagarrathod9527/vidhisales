'use strict';
/* Single source of truth: the server runs the SAME validators and catalogue as the website (js/validate.js, js/data.js). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function load(file) {
    const sandbox = { window: {}, console };
    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8'), sandbox, { filename: file });
    return sandbox.window.VS;
}
const V = load('validate.js').validate;
const D = load('data.js').data;

const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);

/* Returns { errors: [], value: {...} } */
function quote(body) {
    const errors = [];
    const name = V.name(clean(body.customer_name, 120));
    const phone = V.phone(clean(body.customer_phone, 30));
    const email = V.email(clean(body.customer_email, 150));
    const company = V.text(clean(body.company, 150), { label: 'Company name', max: 150 });
    const message = V.text(clean(body.message, 2000), { label: 'Requirement', max: 1000 });
    [name, phone, email, company, message].forEach(r => { if (!r.ok) errors.push(r.msg); });

    let raw = [];
    try { raw = JSON.parse(body.items || '[]'); } catch (e) { raw = []; }
    const items = [], seen = new Set();
    if (!Array.isArray(raw) || raw.length === 0) errors.push('Please add at least one product or service.');
    else if (raw.length > 50) errors.push('You can request up to 50 items per quotation.');
    else for (const r of raw) {
        const type = r && r.type === 'service' ? 'service' : 'product';
        const found = D.products.concat(D.services).find(x => x.type === type && x.name === clean(r && r.name, 200));
        if (!found) { errors.push('Unknown ' + type + ': ' + clean(r && r.name, 60)); break; }
        const key = type + ':' + found.id;
        if (seen.has(key)) { errors.push(found.name + ' is listed more than once.'); break; }
        seen.add(key);
        let qty = 1;
        if (type === 'product') {
            const q = V.quantity(String(r.qty));
            if (!q.ok) { errors.push('Quantity for ' + found.name + ': ' + q.msg); break; }
            qty = q.value;
        }
        items.push({ type, name: found.name, qty });
    }
    return { errors, value: { name: name.value, phone: phone.value, email: email.value, company: company.value, message: message.value, items } };
}

function contact(body) {
    const errors = [];
    const name = V.name(clean(body.name, 120));
    const email = V.email(clean(body.email, 150));
    const message = V.text(clean(body.message, 2000), { label: 'Your message', max: 2000, min: 10, required: true });
    [name, email, message].forEach(r => { if (!r.ok) errors.push(r.msg); });
    return { errors, value: { name: name.value, email: email.value, message: message.value } };
}

module.exports = { quote, contact, clean };
