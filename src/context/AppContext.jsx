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
    monthlyPayments: "Joriy oy to'lovlar",
    debtors: 'Qarzdorlar',
    frozen: 'Muzlatiganlar',
    archived: 'Arxivdagilar',
    monthlyPaymentsTitle: "Joriy oy uchun to'lovlar",
    annualProfit: 'Yillik Foyda',
    schedule: 'Dars jadvali',
    // Common
    save: 'Saqlash',
    cancel: 'Bekor qilish',
    add: "Qo'shish",
    edit: 'Tahrirlash',
    delete: "O'chirish",
    loading: 'Yuklanmoqda...',
    noData: "Ma'lumot yo'q",
    // Classes
    addGroup: "Guruh qo'shish",
    editGroup: "Guruhni tahrirlash",
    groupName: 'Guruh nomi',
    course: 'Kurs',
    room: 'Xona',
    lessonDays: 'Dars kunlari',
    lessonTime: 'Dars vaqti',
    startDate: 'Boshlanish sanasi',
    active: 'Faol',
    archive: 'Arxiv',
    // Teachers
    addTeacher: "O'qituvchi qo'shish",
    // Students
    addStudent: "Talaba qo'shish",
    // GroupDetail tabs
    info: "Ma'lumotlar",
    lessons: 'Guruh darsliklari',
    attendance: 'Akademik davomati',
    homework: 'Uyga vazifa',
    videos: 'Videolar',
    exams: 'Imtihonlar',
    journal: 'Jurnal',
    addHomework: "Qo'shish",
    newExam: 'Yangi imtihon',
    statistics: 'Statistika',
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
    monthlyPaymentsTitle: 'Оплаты за текущий месяц',
    annualProfit: 'Годовая прибыль',
    schedule: 'Расписание',
    save: 'Сохранить',
    cancel: 'Отмена',
    add: 'Добавить',
    edit: 'Изменить',
    delete: 'Удалить',
    loading: 'Загрузка...',
    noData: 'Нет данных',
    addGroup: 'Добавить группу',
    editGroup: 'Редактировать группу',
    groupName: 'Название группы',
    course: 'Курс',
    room: 'Комната',
    lessonDays: 'Дни занятий',
    lessonTime: 'Время занятий',
    startDate: 'Дата начала',
    active: 'Активный',
    archive: 'Архив',
    addTeacher: 'Добавить учителя',
    addStudent: 'Добавить студента',
    info: 'Информация',
    lessons: 'Уроки группы',
    attendance: 'Академическая посещаемость',
    homework: 'Домашнее задание',
    videos: 'Видео',
    exams: 'Экзамены',
    journal: 'Журнал',
    addHomework: 'Добавить',
    newExam: 'Новый экзамен',
    statistics: 'Статистика',
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
    monthlyPaymentsTitle: 'Current month payments',
    annualProfit: 'Annual Profit',
    schedule: 'Schedule',
    save: 'Save',
    cancel: 'Cancel',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    loading: 'Loading...',
    noData: 'No data',
    addGroup: 'Add group',
    editGroup: 'Edit group',
    groupName: 'Group name',
    course: 'Course',
    room: 'Room',
    lessonDays: 'Lesson days',
    lessonTime: 'Lesson time',
    startDate: 'Start date',
    active: 'Active',
    archive: 'Archive',
    addTeacher: 'Add teacher',
    addStudent: 'Add student',
    info: 'Info',
    lessons: 'Group lessons',
    attendance: 'Academic attendance',
    homework: 'Homework',
    videos: 'Videos',
    exams: 'Exams',
    journal: 'Journal',
    addHomework: 'Add',
    newExam: 'New exam',
    statistics: 'Statistics',
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
