document.getElementById('f').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var e = document.getElementById('e'), b = ev.target.querySelector('button'); e.textContent = ''; b.disabled = true;
    fetch('/admin/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch' }, body: JSON.stringify({ username: ev.target.username.value, password: ev.target.password.value }) })
        .then(function (r) { return r.json(); })
        .then(function (d) { if (d.success) location.href = '/admin'; else e.textContent = d.message || 'Sign in failed.'; })
        .catch(function () { e.textContent = 'Cannot reach the server.'; })
        .then(function () { b.disabled = false; });
});
