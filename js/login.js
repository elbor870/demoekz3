document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('form');
  if (!form) return;

  const loginEl = document.getElementById('username');
  const passEl  = document.getElementById('password');

  // Дадим полям name для FormData (не обязательно, но удобно)
  if (loginEl) loginEl.name = 'login';
  if (passEl)  passEl.name  = 'password';

  let errBox = document.createElement('div');
  errBox.className = 'alert alert-danger d-none';
  form.parentNode.insertBefore(errBox, form);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const login = (loginEl?.value || '').trim();
    const password = passEl?.value || '';

    const res = FakeAPI.login(login, password);
    if (res.success) {
      location.href = 'admin.html';
    } else {
      errBox.textContent = res.error;
      errBox.classList.remove('d-none');
    }
  });
});
