document.addEventListener('DOMContentLoaded', function () {
  if (!FakeAPI.isAdmin()) {
    location.href = 'login.html';
    return;
  }

  // Контейнер под карточки: первый .d-flex.justify-content-around внутри main
  const box = document.querySelector('main .d-flex.justify-content-around');
  if (!box) return;

  let currentStatus = '';

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function render() {
    let list = FakeAPI.getAll();
    if (currentStatus) list = list.filter(b => b.status === currentStatus);

    if (!list.length) {
      box.innerHTML = '<div class="alert alert-info w-100">Заявок нет.</div>';
      return;
    }

    box.innerHTML = list.map(b => {
      const room = FakeAPI.getRoom(b.room_id) || {};
      return `
        <div class="card">
          <div class="card-body">
            <h5>№${b.id} — ${escapeHtml(room.category || '')} (ID ${b.room_id})</h5>
            <h5>Фамилия: ${escapeHtml(b.last_name)}</h5>
            <h5>Имя: ${escapeHtml(b.first_name)}</h5>
            <h5>Телефон: ${escapeHtml(b.phone)}</h5>
            <p class="mb-1">Email: ${escapeHtml(b.email)}</p>
            <ul class="list-group">
              <li class="list-group-item">Дата заезда: ${escapeHtml(b.check_in)}</li>
              <li class="list-group-item">Дата выезда: ${escapeHtml(b.check_out)}</li>
              <li class="list-group-item">Статус: <strong>${b.status}</strong></li>
            </ul>
          </div>
          <div class="d-grid gap-2 p-2">
            ${b.status !== 'approved'
              ? `<button class="btn btn-success" data-action="approve" data-id="${b.id}">Одобрить</button>`
              : ''}
            ${b.status !== 'rejected'
              ? `<button class="btn btn-warning" data-action="reject" data-id="${b.id}">Отклонить</button>`
              : ''}
            <button class="btn btn-danger" data-action="delete" data-id="${b.id}">Удалить</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Панель фильтров + кнопка «Выйти» (добавляем динамически)
  const toolbar = document.createElement('div');
  toolbar.className = 'my-3 d-flex gap-2 flex-wrap';
  toolbar.innerHTML = `
    <button class="btn btn-outline-secondary filter-btn active" data-status="">Все</button>
    <button class="btn btn-outline-primary filter-btn" data-status="new">Новые</button>
    <button class="btn btn-outline-success filter-btn" data-status="approved">Одобренные</button>
    <button class="btn btn-outline-danger filter-btn" data-status="rejected">Отклонённые</button>
    <button class="btn btn-dark ms-auto" id="logoutBtn">Выйти</button>
  `;
  box.parentNode.insertBefore(toolbar, box);

  toolbar.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      toolbar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentStatus = this.dataset.status;
      render();
    });
  });

  toolbar.querySelector('#logoutBtn').addEventListener('click', function () {
    FakeAPI.logout();
    location.href = 'index.html';
  });

  // Делегирование кликов по карточкам
  box.addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'approve') FakeAPI.setStatus(id, 'approved');
    else if (action === 'reject') FakeAPI.setStatus(id, 'rejected');
    else if (action === 'delete' && confirm('Удалить заявку?')) FakeAPI.remove(id);

    render();
  });

  render();
});
