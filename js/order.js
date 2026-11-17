document.addEventListener('DOMContentLoaded', function () {
  const params = new URLSearchParams(location.search);
  const roomId = params.get('room_id') || '';
  const room = FakeAPI.getRoom(roomId);

  const alertBox = document.querySelector('.alert.alert-success');
  if (alertBox) alertBox.style.display = 'none';

  // Подставляем id номера в скрытое поле (создаём его)
  const form = document.querySelector('form');
  if (form && !form.querySelector('input[name="room_id"]')) {
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = 'room_id';
    hidden.value = roomId;
    form.prepend(hidden);
  }

  // Имена полям — чтобы FormData работал
  const map = {
    'validationCustom01': 'first_name',
    'validationCustom02': 'last_name',
    'validationCustomPhone': 'phone',
    'validationCustom03': 'email',
    'validationCustom04': 'check_in',
    'validationCustom05': 'check_out',
  };
  Object.entries(map).forEach(([id, name]) => {
    const el = document.getElementById(id);
    if (el && !el.name) el.name = name;
  });

  // Маска телефона
  if (window.jQuery && jQuery.fn.inputmask) {
    jQuery('#validationCustomPhone').inputmask({ mask: '+7(999)999-99-99' });
  }

  // Минимальная дата заезда — сегодня
  const inEl  = document.getElementById('validationCustom04');
  const outEl = document.getElementById('validationCustom05');
  const today = new Date().toISOString().slice(0, 10);
  if (inEl) inEl.min = today;

  // Flatpickr с занятыми датами
  if (window.flatpickr && inEl) {
    const booked = FakeAPI.getBookedDates(roomId);
    let outPicker = null;
    flatpickr(inEl, {
      locale: 'ru',
      dateFormat: 'Y-m-d',
      minDate: 'today',
      disable: booked,
      onChange(_, dateStr) {
        const next = new Date(dateStr);
        next.setDate(next.getDate() + 1);
        const minOut = next.toISOString().slice(0, 10);
        if (!outPicker) {
          outPicker = flatpickr(outEl, {
            locale: 'ru', dateFormat: 'Y-m-d',
            minDate: minOut, disable: booked,
          });
        } else {
          outPicker.set('minDate', minOut);
        }
      },
    });
  }

  // Обработка отправки
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const res  = FakeAPI.createBooking(data);

    if (alertBox) {
      alertBox.style.display = 'block';
      alertBox.className = res.success
        ? 'alert alert-success text-center'
        : 'alert alert-danger text-center';
      alertBox.textContent = res.success ? 'Заявка успешно отправлена!' : res.error;
    } else {
      alert(res.success ? 'Заявка успешно отправлена!' : res.error);
    }

    if (res.success) {
      form.reset();
      form.classList.remove('was-validated');
    }
  });
});
