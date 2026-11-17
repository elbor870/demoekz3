document.addEventListener('DOMContentLoaded', function () {
  const container = document.querySelector('main .d-flex.justify-content-around');
  const applyBtn  = document.querySelector('.dropdown + .btn-primary');
  const resetBtn  = document.querySelector('.dropdown + .btn-primary + .btn-danger');
  const dropdownItems = document.querySelectorAll('.dropdown-menu .dropdown-item');

  let selectedCategory = '';

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function render() {
    const rooms = FakeAPI.findRooms({ category: selectedCategory });
    if (!rooms.length) {
      container.innerHTML = '<div class="alert alert-info w-100">По выбранной категории номера не найдены.</div>';
      return;
    }
    container.innerHTML = rooms.map(r => `
      <div class="card">
        <img src="${escapeHtml(r.image)}" class="card-img-top" alt="${escapeHtml(r.category)}">
        <div class="card-body">
          <h3>Категория: ${escapeHtml(r.category)}</h3>
          <h5>Цена: ${r.price} ₽ / сутки</h5>
          <h5>Мест: ${r.capacity} · Площадь: ${r.area} м²</h5>
          <h5>Характеристики:</h5>
          <ul class="list-group">
            ${r.amenities.map(a => `<li class="list-group-item">${escapeHtml(a)}</li>`).join('')}
          </ul>
        </div>
        <div class="d-grid gap-2">
          <a href="order.html?room_id=${r.id}" class="btn btn-success">Забронировать</a>
        </div>
      </div>
    `).join('');
  }

  dropdownItems.forEach(item => {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      selectedCategory = this.textContent.trim();
      // обновляем подпись кнопки
      const toggle = document.querySelector('.dropdown-toggle');
      toggle.textContent = selectedCategory;
    });
  });

  applyBtn.addEventListener('click', function (e) {
    e.preventDefault();
    render();
  });

  resetBtn.addEventListener('click', function (e) {
    e.preventDefault();
    selectedCategory = '';
    document.querySelector('.dropdown-toggle').textContent = 'Категории';
    render();
  });

  render(); // первоначальная отрисовка
});
