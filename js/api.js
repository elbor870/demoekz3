/* Фейковое API для GitHub Pages.
   Имитирует серверную валидацию, фильтрацию и хранение заявок. */

const DB_KEY   = 'hotel_bookings_v1';
const AUTH_KEY = 'hotel_admin_v1';

const ADMIN_LOGIN = 'hotel123';
const ADMIN_PASS  = 'adminHotel';

/* ---------- Каталог (данные из "Характеристики номеров") ---------- */
const ROOMS = [
  { id: 1, category: 'Стандартный', price: 3400,  capacity: 2, area: 18,
    image: 'img/standart.png',
    amenities: ['полный санузел','двуспальная кровать','телевизор'] },
  { id: 2, category: 'Стандартный', price: 3800,  capacity: 2, area: 20,
    image: 'img/standart.png',
    amenities: ['полный санузел','двуспальная кровать','телевизор'] },
  { id: 3, category: 'Студия',      price: 4600,  capacity: 2, area: 25,
    image: 'img/studio.jpg',
    amenities: ['кухонный уголок','полный санузел','двуспальная кровать','телевизор','холодильник'] },
  { id: 4, category: 'Студия',      price: 6200,  capacity: 2, area: 28,
    image: 'img/studio.jpg',
    amenities: ['кухонный уголок','полный санузел','двуспальная кровать','телевизор','холодильник'] },
  { id: 5, category: 'Люкс',        price: 8500,  capacity: 4, area: 40,
    image: 'img/lux.png',
    amenities: ['двухкомнатный','полный санузел','двуспальная кровать','телевизор','холодильник','кондиционер'] },
  { id: 6, category: 'Люкс',        price: 15000, capacity: 4, area: 55,
    image: 'img/lux.png',
    amenities: ['двухкомнатный','полный санузел','двуспальная кровать','телевизор','холодильник','кондиционер'] },
];

/* ---------- Утилиты ---------- */
function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function isValidISODate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime());
}
function dateAddDays(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function loadBookings() {
  try { return JSON.parse(localStorage.getItem(DB_KEY)) || []; }
  catch { return []; }
}
function saveBookings(list) {
  localStorage.setItem(DB_KEY, JSON.stringify(list));
}
function nextId(list) {
  return list.length ? Math.max(...list.map(b => b.id)) + 1 : 1;
}

/* ---------- Публичное API ---------- */
const FakeAPI = {

  /* --- Каталог с серверной фильтрацией --- */
  findRooms(filter = {}) {
    const { category = '', max_price = '', min_places = '' } = filter;
    return ROOMS.filter(r => {
      if (category && r.category !== category) return false;
      if (max_price !== '' && Number(max_price) < r.price) return false;
      if (min_places !== '' && Number(min_places) > r.capacity) return false;
      return true;
    });
  },

  getRoom(id) {
    return ROOMS.find(r => String(r.id) === String(id)) || null;
  },

  /* --- Занятые даты для календаря --- */
  getBookedDates(roomId) {
    const rows = loadBookings().filter(b =>
      String(b.room_id) === String(roomId) && b.status === 'approved'
    );
    const disabled = new Set();
    rows.forEach(b => {
      let cur = b.check_in;
      while (cur < b.check_out) {
        disabled.add(cur);
        cur = dateAddDays(cur, 1);
      }
    });
    return Array.from(disabled).sort();
  },

  /* --- Создание заявки (серверная валидация) --- */
  createBooking(data) {
    const errors = [];

    const roomId    = parseInt(data.room_id, 10);
    const firstName = (data.first_name || '').trim();
    const lastName  = (data.last_name  || '').trim();
    const phone     = (data.phone      || '').trim();
    const email     = (data.email      || '').trim();
    const checkIn   = data.check_in  || '';
    const checkOut  = data.check_out || '';

    if (!roomId || roomId <= 0) errors.push('Не выбран номер.');
    if (!this.getRoom(roomId))  errors.push('Номер не найден.');

    if (!firstName) errors.push('Укажите имя.');
    if (!lastName)  errors.push('Укажите фамилию.');
    if (!phone)     errors.push('Укажите телефон.');
    if (!email)     errors.push('Укажите email.');
    if (!checkIn)   errors.push('Укажите дату заезда.');
    if (!checkOut)  errors.push('Укажите дату выезда.');

    if (firstName && !/^[А-Яа-яЁё\s.\-]+$/.test(firstName))
      errors.push('Имя: только кириллица, пробелы, точки и тире.');
    if (lastName && !/^[А-Яа-яЁё\s.\-]+$/.test(lastName))
      errors.push('Фамилия: только кириллица, пробелы, точки и тире.');
    if (phone && !/^\+7\(\d{3}\)\d{3}-\d{2}-\d{2}$/.test(phone))
      errors.push('Телефон в формате +7(ХХХ)ХХХ-ХХ-ХХ.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.push('Некорректный email.');

    if (checkIn && !isValidISODate(checkIn))   errors.push('Некорректная дата заезда.');
    if (checkOut && !isValidISODate(checkOut)) errors.push('Некорректная дата выезда.');

    if (isValidISODate(checkIn) && isValidISODate(checkOut)) {
      if (checkIn < todayISO())
        errors.push('Дата заезда не может быть раньше текущей даты.');
      if (checkOut <= checkIn)
        errors.push('Дата выезда должна быть позже даты заезда.');
    }

    if (!errors.length) {
      const list = loadBookings();
      const conflict = list.some(b =>
        String(b.room_id) === String(roomId) &&
        b.status === 'approved' &&
        b.check_in < checkOut &&
        b.check_out > checkIn
      );
      if (conflict) errors.push('На выбранные даты номер уже забронирован.');
    }

    if (errors.length) return { success: false, error: errors.join(' ') };

    const list = loadBookings();
    const booking = {
      id: nextId(list),
      room_id: roomId,
      first_name: firstName,
      last_name: lastName,
      phone, email,
      check_in: checkIn,
      check_out: checkOut,
      status: 'new',
      created_at: new Date().toISOString(),
    };
    list.push(booking);
    saveBookings(list);
    return { success: true, booking };
  },

  /* --- Для админки --- */
  getAll() { return loadBookings(); },
  setStatus(id, status) {
    const list = loadBookings();
    const idx = list.findIndex(b => b.id === Number(id));
    if (idx === -1) return { success: false };
    list[idx].status = status;
    saveBookings(list);
    return { success: true };
  },
  remove(id) {
    saveBookings(loadBookings().filter(b => b.id !== Number(id)));
    return { success: true };
  },

  /* --- Авторизация --- */
  login(login, password) {
    if (login === ADMIN_LOGIN && password === ADMIN_PASS) {
      sessionStorage.setItem(AUTH_KEY, '1');
      return { success: true };
    }
    return { success: false, error: 'Неверный логин или пароль' };
  },
  logout()   { sessionStorage.removeItem(AUTH_KEY); },
  isAdmin()  { return sessionStorage.getItem(AUTH_KEY) === '1'; },
};

window.FakeAPI = FakeAPI;
