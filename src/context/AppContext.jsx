import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

// Tarjimalar
const translations = {
  uz: {
    // Sidebar
    home: 'Asosiy',
    teachers: "O'qituvchilar",
    classes: 'Guruhlar',
    students: 'Talabalar',
    gifts: "Sovg'alar",
    management: 'Boshqarish',
    subscription: 'Obuna',
    subscriptionExpired: 'Obunangiz tugagan',
    renewSubscription: 'Obunani yangilash',
    // Header
    search: 'Qidirish...',
    logout: 'Chiqish',
    // Dashboard
    activeStudents: 'Faol talabalar',
    groups: 'Guruhlar',
    monthlyPayments: 'Joriy oy to\'lovlar',
    debtors: 'Qarzdorlar',
    frozen: 'Muzlatiganlar',
    archived: 'Arxivdagilar',
    // Common
    save: 'Saqlash',
    cancel: 'Bekor qilish',
    add: "Qo'shish",
    edit: 'Tahrirlash',
    delete: "O'chirish",
    search_placeholder: 'Qidirish...',
    loading: 'Yuklanmoqda...',
    noData: "Ma'lumot yo'q",
    // Classes
    addGroup: "Guruh qo'shish",
    active: 'Faol',
    archive: 'Arxiv',
    // Teachers
    addTeacher: "O'qituvchi qo'shish",
    // Students
    addStudent: "Talaba qo'shish",
    // Lang name
    langName: "O'zbekcha",
  },
  ru: {
    home: 'Главная',
    teachers: 'Учителя',
    classes: 'Группы',
    students: 'Студенты',
    gifts: 'Подарки',
    management: 'Управление',
    subscription: 'Подписка',
    subscriptionExpired: 'Подписка истекла',
    renewSubscription: 'Обновить подписку',
    search: 'Поиск...',
    logout: 'Выйти',
    activeStudents: 'Активные студенты',
    groups: 'Группы',
    monthlyPayments: 'Оплаты за месяц',
    debtors: 'Должники',
    frozen: 'Замороженные',
    archived: 'В архиве',
    save: 'Сохранить',
    cancel: 'Отмена',
    add: 'Добавить',
    edit: 'Изменить',
    delete: 'Удалить',
    search_placeholder: 'Поиск...',
    loading: 'Загрузка...',
    noData: 'Нет данных',
    addGroup: 'Добавить группу',
    active: 'Активный',
    archive: 'Архив',
    addTeacher: 'Добавить учителя',
    addStudent: 'Добавить студента',
    langName: 'Русский',
  },
  en: {
    home: 'Home',
    teachers: 'Teachers',
    classes: 'Groups',
    students: 'Students',
    gifts: 'Gifts',
    management: 'Management',
    subscription: 'Subscription',
    subscriptionExpired: 'Subscription expired',
    renewSubscription: 'Renew subscription',
    search: 'Search...',
    logout: 'Logout',
    activeStudents: 'Active students',
    groups: 'Groups',
    monthlyPayments: 'Monthly payments',
    debtors: 'Debtors',
    frozen: 'Frozen',
    archived: 'Archived',
    save: 'Save',
    cancel: 'Cancel',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    search_placeholder: 'Search...',
    loading: 'Loading...',
    noData: 'No data',
    addGroup: 'Add group',
    active: 'Active',
    archive: 'Archive',
    addTeacher: 'Add teacher',
    addStudent: 'Add student',
    langName: 'English',
  },
};

export const AppProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('lang') || 'uz';
  });

  // Dark mode ni HTML ga apply qilish
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const t = (key) => translations[lang]?.[key] || translations.uz[key] || key;

  return (
    <AppContext.Provider value={{ darkMode, toggleDarkMode, lang, setLang, t, translations }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
