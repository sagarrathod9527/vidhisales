/* VIDHI SALES — field validators. Each returns { ok, msg, value, suggestion }. */
(function () {
    'use strict';
    var VS = window.VS = window.VS || {};
    function res(ok, msg, value, suggestion) { return { ok: ok, msg: msg || '', value: value, suggestion: suggestion || '' }; }

    function name(raw) {
        var v = String(raw).replace(/\s+/g, ' ').trim();
        if (!v) return res(false, 'Please enter your name.');
        if (v.length < 2) return res(false, 'Name is too short.');
        if (v.length > 120) return res(false, 'Name is too long (max 120 characters).');
        if (!/^[A-Za-z\u00C0-\u024F\u0900-\u097F][A-Za-z\u00C0-\u024F\u0900-\u097F .'\-]*$/.test(v)) return res(false, 'Use letters only in your name (no numbers or symbols).');
        if ((v.match(/[A-Za-z\u00C0-\u024F\u0900-\u097F]/g) || []).length < 2) return res(false, 'Please enter your full name.');
        return res(true, '', v);
    }

    /* Indian mobile (10 digits, starts 6-9, optional +91 / 91 / 0) or international (+ then 8-15 digits). */
    function phone(raw, opts) {
        var v = String(raw).trim();
        if (!v) return (opts && opts.optional) ? res(true, '', '') : res(false, 'Please enter your phone number.');
        if (!/^[0-9+\s().\-]+$/.test(v)) return res(false, 'Phone can contain only digits, spaces, + ( ) -');
        if (v.indexOf('+') > 0 || (v.match(/\+/g) || []).length > 1) return res(false, 'The + sign is only allowed at the start (e.g. +91).');
        var digits = v.replace(/\D/g, '');
        if (/^(\d)\1+$/.test(digits)) return res(false, 'That phone number does not look real.');
        if (v.charAt(0) === '+' && digits.indexOf('91') !== 0) {
            if (digits.length < 8 || digits.length > 15) return res(false, 'International numbers need 8 to 15 digits.');
            return res(true, '', '+' + digits);
        }
        var n = digits;
        if (n.length === 12 && n.indexOf('91') === 0) n = n.slice(2);
        else if (n.length === 11 && n.charAt(0) === '0') n = n.slice(1);
        if (n.length < 10) return res(false, 'Mobile number must be 10 digits (you entered ' + n.length + ').');
        if (n.length > 10) return res(false, 'Mobile number has too many digits. Enter 10 digits, with or without +91.');
        if (!/^[6-9]/.test(n)) return res(false, 'Indian mobile numbers start with 6, 7, 8 or 9.');
        if (/^(\d{2})\1{4}$/.test(n)) return res(false, 'That phone number does not look real.');
        return res(true, '', '+91 ' + n.slice(0, 5) + ' ' + n.slice(5));
    }

    var DOMAIN_FIX = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmaill.com': 'gmail.com', 'gnail.com': 'gmail.com', 'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yahoo.con': 'yahoo.com', 'hotmial.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'outlok.com': 'outlook.com', 'outlook.con': 'outlook.com', 'rediffmial.com': 'rediffmail.com' };
    var TLDS = ' academy ae aero af agency ai am app ar asia at au az bd be bg bh biz blog br business by ca care cc center ch cl click clinic cloud club cn co com company coop cy cz de design dev digital dk edu ee eg email es et eu expert fi fr fun ge gg gh gov gr group health hk hr hu id ie il im in inc info int io is it je jobs jp ke kh kr kw kz la life link live lk llc lt ltd lu lv ma me media mil mm mn mobi mt museum mx my name net network news ng nl no np nz om online org page ph pk pl pro pt qa ro ru sa school se services sg shop si site sk solutions space store studio systems team tech tel th tn today tr training travel tv tw tz ua ug uk us uz vn web website works world ws xyz za zone ';
    var TLD_FIX = { con: 'com', cmo: 'com', ocm: 'com', vom: 'com', xom: 'com', comm: 'com', coom: 'com', cim: 'com', cm: 'com', ne: 'net', nrt: 'net', ogr: 'org', orgg: 'org', inn: 'in', ni: 'in', gmail: 'com' };
    function email(raw) {
        var v = String(raw).trim().toLowerCase();
        if (!v) return res(false, 'Please enter your email address.');
        if (v.length > 150) return res(false, 'Email is too long.');
        if (/\s/.test(v)) return res(false, 'Email cannot contain spaces.');
        if (v.indexOf('@') < 0) return res(false, 'Email must contain @ (e.g. name@gmail.com).');
        if ((v.match(/@/g) || []).length > 1) return res(false, 'Email can contain only one @.');
        var p = v.split('@'), local = p[0], dom = p[1];
        if (!local) return res(false, 'Add the part before @ (e.g. name@gmail.com).');
        if (!dom) return res(false, 'Add the domain after @ (e.g. gmail.com).');
        if (local.length > 64 || !/^[a-z0-9._%+\-]+$/.test(local) || local.charAt(0) === '.' || local.slice(-1) === '.' || local.indexOf('..') >= 0) return res(false, 'The part before @ has invalid characters or dots.');
        if (!/^[a-z0-9]([a-z0-9\-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]*[a-z0-9])?)+$/.test(dom)) return res(false, 'The domain looks incomplete (e.g. gmail.com).');
        var tld = dom.slice(dom.lastIndexOf('.') + 1);
        if (TLDS.indexOf(' ' + tld + ' ') < 0) {
            var fix = TLD_FIX[tld];
            return res(false, 'We do not recognise “.' + tld + '” as a real domain ending.' + (fix ? ' Did you mean .' + fix + '?' : ' Use an ending like .com, .in, .me, .store or .org.'));
        }
        return res(true, '', v, DOMAIN_FIX[dom] ? local + '@' + DOMAIN_FIX[dom] : '');
    }

    function quantity(raw) {
        var v = String(raw).trim();
        if (v === '') return res(false, 'Enter a quantity.');
        if (!/^\d+$/.test(v)) return res(false, 'Quantity must be a whole number.');
        var n = parseInt(v, 10);
        if (n < 1) return res(false, 'Quantity must be at least 1.');
        if (n > 100000) return res(false, 'Maximum quantity is 100,000.');
        return res(true, '', n);
    }

    function text(raw, o) {
        o = o || {};
        var v = String(raw).trim(), label = o.label || 'This field';
        if (!v) return o.required ? res(false, 'Please fill in ' + label.toLowerCase() + '.') : res(true, '', '');
        if (o.min && v.length < o.min) return res(false, label + ' must be at least ' + o.min + ' characters.');
        if (v.length > (o.max || 1000)) return res(false, label + ' is too long (max ' + (o.max || 1000) + ' characters).');
        return res(true, '', v);
    }

    VS.validate = { name: name, phone: phone, email: email, quantity: quantity, text: text };
})();
