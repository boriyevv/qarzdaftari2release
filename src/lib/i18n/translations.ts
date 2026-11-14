export type AppLanguage = 'uz' | 'ru' | 'en'

export interface TranslationDictionary {
  common: {
    loading: string
    save: string
    cancel: string
    delete: string
    edit: string
    search: string
    back: string
    close: string
    yes: string
    no: string
    active: string
    inactive: string
    success: string
    error: string
    network_error: string
    copied: string
    offline_banner: string
    online_banner: string
  }
  nav: {
    dashboard: string
    analytics: string
    sms: string
    pricing: string
    profile: string
    add_debt: string
    logout: string
    cashier_role: string
    plan_tag: string
  }
  profile: {
    title: string
    subtitle: string
    store_info: string
    settings: string
    settings_desc: string
    security: string
    security_desc: string
    protected: string
    not_protected: string
    telegram: string
    telegram_desc: string
    daily_report_on: string
    not_connected: string
    cashiers: string
    cashiers_desc: string
    general: string
    general_desc: string
    support: string
    support_desc: string
    share: string
    share_desc: string
    share_text: string
    share_copied: string
    logout: string
    logout_desc: string
    logout_confirm: string
    logout_confirm_desc: string
    logout_action: string
  }
  settings: {
    title: string
    subtitle: string
    back_to_profile: string
    theme_title: string
    theme_desc: string
    theme_light: string
    theme_light_desc: string
    theme_dark: string
    theme_dark_desc: string
    theme_system: string
    theme_system_desc: string
    sounds_title: string
    sounds_desc: string
    sound_chime: string
    sound_chime_desc: string
    test_sound: string
    sound_enabled_toast: string
    sound_disabled_toast: string
    haptics_title: string
    haptics_desc: string
    haptics_enabled_toast: string
    haptics_disabled_toast: string
    currency_title: string
    currency_desc: string
    currency_uzs: string
    currency_uzs_desc: string
    currency_usd: string
    currency_usd_desc: string
    currency_changed_toast: string
    lang_title: string
    lang_desc: string
    lang_uz: string
    lang_uz_sub: string
    lang_ru: string
    lang_ru_sub: string
    lang_en: string
    lang_en_sub: string
    active_badge: string
    lang_changed_toast: string
  }
  lock: {
    title: string
    enter_pin_desc: string
    forgot_pin: string
    logout: string
    biometrics: string
    face_id: string
    code_sending: string
    code_sent: string
    telegram_code_title: string
    telegram_code_desc: string
    resend_code: string
    set_new_pin_title: string
    set_new_pin_desc: string
    confirm_new_pin_title: string
    confirm_new_pin_desc: string
    pin_updated: string
    wrong_pin: string
    wrong_code: string
    pin_mismatch: string
  }
  dashboard: {
    search_placeholder: string
    all_tab: string
    given_tab: string
    taken_tab: string
    overdue_tab: string
    total_debt: string
    given_total: string
    taken_total: string
    add_debt_btn: string
    no_records: string
  }
}

export const translations: Record<AppLanguage, TranslationDictionary> = {
  uz: {
    common: {
      loading: 'Yuklanmoqda...',
      save: 'Saqlash',
      cancel: 'Bekor qilish',
      delete: "O'chirish",
      edit: "Tahrirlash",
      search: 'Qidirish...',
      back: 'Orqaga',
      close: 'Yopish',
      yes: 'Ha',
      no: "Yo'q",
      active: 'Faol',
      inactive: 'Nofaol',
      success: 'Muvaffaqiyatli',
      error: 'Xatolik yuz berdi',
      network_error: 'Tarmoq xatosi',
      copied: 'Nusxalandi',
      offline_banner: 'Oflayn rejim: yangi qarzlar internet kelganda sinxronlashadi',
      online_banner: 'Internet tiklandi: maʼlumotlar sinxronlandi',
    },
    nav: {
      dashboard: 'Bosh sahifa',
      analytics: 'Analitika',
      sms: 'SMS',
      pricing: 'Tariflar',
      profile: 'Profil',
      add_debt: 'Qarz kiritish',
      logout: 'Chiqish',
      cashier_role: 'Kassir',
      plan_tag: 'tarif',
    },
    profile: {
      title: 'Profil',
      subtitle: 'Hisob va ilova boshqaruvi markazi',
      store_info: "Do'kon ma'lumotlari",
      settings: 'Sozlamalar',
      settings_desc: 'Ilova mavzusi, tovushlar, vibratsiya va til',
      security: 'Ilova Xavfsizligi va Qulf',
      security_desc: 'PIN kod, Face ID va Barmoq izi orqali himoyalash',
      protected: 'Himoyalangan',
      not_protected: 'Himoyalanmagan',
      telegram: 'Telegram Bot va Hisobotlar',
      telegram_desc: 'Kunlik hisobot vaqti va Mini App',
      daily_report_on: 'Kunlik hisobot faol',
      not_connected: 'Ulanmagan',
      cashiers: 'Kassirlar va Xodimlar',
      cashiers_desc: "Do'kon sotuvchilariga ruxsatlar berish",
      general: "Umumiy ma'lumotlar",
      general_desc: "Do'kon, oferta va ilova ma'lumotlari",
      support: "Qo'llab-quvvatlash bilan bog'lanish",
      support_desc: 'Telegram admin va texnik yordam',
      share: "Do'stlarni taklif qilish",
      share_desc: "Ilovani boshqa do'kondorlarga ulashish",
      share_text: "Qarz Daftari — savdo va do'kon uchun qarzlar va to'lovlar hisobini yurituvchi eng qulay ilova! 🚀",
      share_copied: 'Ilova havolasi nusxalandi: debtbook.uz',
      logout: 'Chiqish',
      logout_desc: 'Hisobdan xavfsiz chiqish',
      logout_confirm: 'Rostdan ham hisobdan chiqmoqchimisiz?',
      logout_confirm_desc: "Qayta kirish uchun telefon raqamingiz orqali tasdiqlash lozim bo'ladi.",
      logout_action: 'Ha, chiqish',
    },
    settings: {
      title: 'Sozlamalar',
      subtitle: 'Mavzu, tovushlar, vibratsiya va til parametrlari',
      back_to_profile: 'Profilga qaytish',
      theme_title: 'Ilova mavzusi',
      theme_desc: 'Qurilmangizga mos qulay rang rejimini tanlang',
      theme_light: "Yorug'",
      theme_light_desc: 'Kunduzgi rejim',
      theme_dark: "Qorong'i",
      theme_dark_desc: 'Tungi rejim',
      theme_system: 'Tizim (Avto)',
      theme_system_desc: 'Moslashuvchan',
      sounds_title: 'Tovushlar va Haptika',
      sounds_desc: "Amallar va to'lovlar paytidagi mikro-tovush va vibratsiya",
      sound_chime: "To'lov bildirishnoma tovushi",
      sound_chime_desc: "Qarz to'langanda yoqimli mikro-tovush yangraydi",
      test_sound: 'Sinash',
      sound_enabled_toast: "To'lov bildirishnoma tovushi yoqildi",
      sound_disabled_toast: "Bildirishnoma tovushi o'chirildi",
      haptics_title: 'Haptik tebranish (Vibratsiya)',
      haptics_desc: "Tugmalar bosilganda va to'lov qabulida yengil tebranish",
      haptics_enabled_toast: 'Haptik tebranish (vibratsiya) yoqildi',
      haptics_disabled_toast: "Haptik tebranish o'chirildi",
      currency_title: 'Valyuta va Formatlash',
      currency_desc: "Qarzlar va to'lovlar aks ettiriladigan asosiy pul birligi",
      currency_uzs: "O'zbekiston so'mi (UZS)",
      currency_uzs_desc: 'Milliy valyuta',
      currency_usd: 'AQSH dollari (USD)',
      currency_usd_desc: 'Xalqaro valyuta',
      currency_changed_toast: 'Asosiy valyuta yangilandi',
      lang_title: 'Ilova tili',
      lang_desc: 'Qarz Daftari interfeysi va hisobotlar tili',
      lang_uz: "O'zbekcha",
      lang_uz_sub: 'Lotin alifbosida',
      lang_ru: 'Русский',
      lang_ru_sub: 'Интерфейс на русском',
      lang_en: 'English',
      lang_en_sub: 'International version',
      active_badge: 'Tanlangan',
      lang_changed_toast: "O'zbek tili tanlandi",
    },
    lock: {
      title: 'Qarz Daftari',
      enter_pin_desc: 'Ilovani ochish uchun 4 xonali PIN kodni kiriting',
      forgot_pin: 'PIN kodni unutdingizmi?',
      logout: 'Hisobdan chiqish',
      biometrics: 'Biometrika',
      face_id: 'Face ID',
      code_sending: 'Kod yuborilmoqda...',
      code_sent: 'Tasdiq kodi Telegram botingizga yuborildi',
      telegram_code_title: 'Telegram tasdiq kodi',
      telegram_code_desc: 'Telegram botingizga yuborilgan 4 xonali tasdiq kodini kiriting',
      resend_code: 'Kodni qayta yuborish',
      set_new_pin_title: 'Yangi PIN kod',
      set_new_pin_desc: 'Ilovaga kirish uchun yangi 4 xonali PIN kod kiriting',
      confirm_new_pin_title: 'PIN kodni tasdiqlang',
      confirm_new_pin_desc: 'Tasdiqlash uchun yangi PIN kodni qaytadan kiriting',
      pin_updated: 'Yangi PIN kod muvaffaqiyatli saqlandi!',
      wrong_pin: "Noto'g'ri PIN kod",
      wrong_code: "Noto'g'ri tasdiq kodi",
      pin_mismatch: 'PIN kodlar mos kelmadi',
    },
    dashboard: {
      search_placeholder: 'Mijoz ismi yoki telefon raqami...',
      all_tab: 'Barchasi',
      given_tab: 'Berilgan qarzlar',
      taken_tab: 'Olingan qarzlar',
      overdue_tab: "Muddati o'tgan",
      total_debt: 'Jami qarz',
      given_total: 'Berilgan',
      taken_total: 'Olingan',
      add_debt_btn: 'Qarz kiritish',
      no_records: 'Qarz yozuvlari topilmadi',
    },
  },
  ru: {
    common: {
      loading: 'Загрузка...',
      save: 'Сохранить',
      cancel: 'Отмена',
      delete: 'Удалить',
      edit: 'Редактировать',
      search: 'Поиск...',
      back: 'Назад',
      close: 'Закрыть',
      yes: 'Да',
      no: 'Нет',
      active: 'Активен',
      inactive: 'Неактивен',
      success: 'Успешно',
      error: 'Произошла ошибка',
      network_error: 'Ошибка сети',
      copied: 'Скопировано',
      offline_banner: 'Офлайн режим: данные синхронизируются при появлении интернета',
      online_banner: 'Интернет восстановлен: данные успешно синхронизированы',
    },
    nav: {
      dashboard: 'Главная',
      analytics: 'Аналитика',
      sms: 'СМС',
      pricing: 'Тарифы',
      profile: 'Профиль',
      add_debt: 'Добавить долг',
      logout: 'Выйти',
      cashier_role: 'Кассир',
      plan_tag: 'тариф',
    },
    profile: {
      title: 'Профиль',
      subtitle: 'Центр управления аккаунтом и приложением',
      store_info: 'Информация о магазине',
      settings: 'Настройки',
      settings_desc: 'Тема оформления, звуки, вибрация и язык',
      security: 'Безопасность и Замок',
      security_desc: 'Защита PIN-кодом, Face ID и отпечатком пальца',
      protected: 'Защищено',
      not_protected: 'Не защищено',
      telegram: 'Telegram-бот и Отчеты',
      telegram_desc: 'Время ежедневного отчета и Mini App',
      daily_report_on: 'Ежедневный отчет включен',
      not_connected: 'Не подключен',
      cashiers: 'Кассиры и Сотрудники',
      cashiers_desc: 'Управление доступом продавцов магазина',
      general: 'Общая информация',
      general_desc: 'Информация о магазине, оферте и приложении',
      support: 'Служба поддержки',
      support_desc: 'Связь с администратором и техподдержкой',
      share: 'Поделиться приложением',
      share_desc: 'Порекомендовать приложение коллегам и владельцам',
      share_text: 'Qarz Daftari — самое удобное приложение для учета долгов и взаиморасчетов магазина! 🚀',
      share_copied: 'Ссылка на приложение скопирована: debtbook.uz',
      logout: 'Выйти',
      logout_desc: 'Безопасный выход из учетной записи',
      logout_confirm: 'Вы действительно хотите выйти?',
      logout_confirm_desc: 'Для повторного входа потребуется подтверждение по номеру телефона.',
      logout_action: 'Да, выйти',
    },
    settings: {
      title: 'Настройки',
      subtitle: 'Параметры темы, звуков, тактильного отклика и языка',
      back_to_profile: 'Назад в профиль',
      theme_title: 'Тема оформления',
      theme_desc: 'Выберите удобную цветовую тему для вашего устройства',
      theme_light: 'Светлая',
      theme_light_desc: 'Дневной режим',
      theme_dark: 'Темная',
      theme_dark_desc: 'Ночной режим',
      theme_system: 'Системная (Авто)',
      theme_system_desc: 'Адаптивный режим',
      sounds_title: 'Звуки и Вибрация',
      sounds_desc: 'Звуковые сигналы и тактильный отклик при операциях',
      sound_chime: 'Звук уведомления об оплате',
      sound_chime_desc: 'Приятный сигнал при успешном погашении долга',
      test_sound: 'Проверить',
      sound_enabled_toast: 'Звук уведомлений включен',
      sound_disabled_toast: 'Звук уведомлений выключен',
      haptics_title: 'Тактильная отдача (Вибрация)',
      haptics_desc: 'Легкая вибрация при нажатии кнопок и подтверждении',
      haptics_enabled_toast: 'Тактильная вибрация включена',
      haptics_disabled_toast: 'Тактильная вибрация выключена',
      currency_title: 'Валюта и Форматирование',
      currency_desc: 'Основная валюта для отображения долгов и отчетов',
      currency_uzs: 'Узбекский сум (UZS)',
      currency_uzs_desc: 'Национальная валюта',
      currency_usd: 'Доллар США (USD)',
      currency_usd_desc: 'Международная валюта',
      currency_changed_toast: 'Основная валюта обновлена',
      lang_title: 'Язык приложения',
      lang_desc: 'Язык интерфейса и отчетов Долговой Книги',
      lang_uz: "O'zbekcha",
      lang_uz_sub: 'Lotin alifbosida',
      lang_ru: 'Русский',
      lang_ru_sub: 'Интерфейс на русском языке',
      lang_en: 'English',
      lang_en_sub: 'International version',
      active_badge: 'Выбрано',
      lang_changed_toast: 'Русский язык успешно установлен',
    },
    lock: {
      title: 'Долговая Книга',
      enter_pin_desc: 'Введите 4-значный PIN-код для входа в приложение',
      forgot_pin: 'Забыли PIN-код?',
      logout: 'Выйти из аккаунта',
      biometrics: 'Биометрия',
      face_id: 'Face ID',
      code_sending: 'Отправка кода...',
      code_sent: 'Код подтверждения отправлен в ваш Telegram-бот',
      telegram_code_title: 'Код подтверждения Telegram',
      telegram_code_desc: 'Введите 4-значный код, отправленный в ваш Telegram-бот',
      resend_code: 'Отправить код повторно',
      set_new_pin_title: 'Новый PIN-код',
      set_new_pin_desc: 'Введите новый 4-значный PIN-код для защиты',
      confirm_new_pin_title: 'Подтвердите PIN-код',
      confirm_new_pin_desc: 'Повторите новый PIN-код для подтверждения',
      pin_updated: 'Новый PIN-код успешно сохранен!',
      wrong_pin: 'Неверный PIN-код',
      wrong_code: 'Неверный код подтверждения',
      pin_mismatch: 'Введенные PIN-коды не совпадают',
    },
    dashboard: {
      search_placeholder: 'Поиск по имени клиента или телефону...',
      all_tab: 'Все долги',
      given_tab: 'Мне должны',
      taken_tab: 'Я должен',
      overdue_tab: 'Просроченные',
      total_debt: 'Общий долг',
      given_total: 'Выдано',
      taken_total: 'Взято',
      add_debt_btn: 'Добавить долг',
      no_records: 'Записи о долгах не найдены',
    },
  },
  en: {
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search...',
      back: 'Back',
      close: 'Close',
      yes: 'Yes',
      no: 'No',
      active: 'Active',
      inactive: 'Inactive',
      success: 'Success',
      error: 'An error occurred',
      network_error: 'Network error',
      copied: 'Copied',
      offline_banner: 'Offline mode: changes will sync once online',
      online_banner: 'Online restored: all data synchronized',
    },
    nav: {
      dashboard: 'Dashboard',
      analytics: 'Analytics',
      sms: 'SMS',
      pricing: 'Plans',
      profile: 'Profile',
      add_debt: 'Add Debt',
      logout: 'Log out',
      cashier_role: 'Cashier',
      plan_tag: 'plan',
    },
    profile: {
      title: 'Profile',
      subtitle: 'Account and application management center',
      store_info: 'Store details',
      settings: 'Settings',
      settings_desc: 'Theme, sounds, vibration and language',
      security: 'App Security & Lock',
      security_desc: 'Protect with PIN, Face ID and Fingerprint',
      protected: 'Protected',
      not_protected: 'Not protected',
      telegram: 'Telegram Bot & Reports',
      telegram_desc: 'Daily report schedule and Mini App',
      daily_report_on: 'Daily report active',
      not_connected: 'Not connected',
      cashiers: 'Cashiers & Staff',
      cashiers_desc: 'Manage store seller access and permissions',
      general: 'General Information',
      general_desc: 'Store, terms and application details',
      support: 'Contact Support',
      support_desc: 'Telegram admin and technical support',
      share: 'Share App',
      share_desc: 'Recommend the app to fellow business owners',
      share_text: 'Qarz Daftari — the premier debt management and store ledger application! 🚀',
      share_copied: 'App link copied: debtbook.uz',
      logout: 'Log out',
      logout_desc: 'Safely sign out from this account',
      logout_confirm: 'Are you sure you want to log out?',
      logout_confirm_desc: 'You will need to verify via phone number to sign back in.',
      logout_action: 'Yes, log out',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Theme, sound, haptic and language preferences',
      back_to_profile: 'Back to profile',
      theme_title: 'App Theme',
      theme_desc: 'Choose the visual appearance for your device',
      theme_light: 'Light',
      theme_light_desc: 'Day mode',
      theme_dark: 'Dark',
      theme_dark_desc: 'Night mode',
      theme_system: 'System (Auto)',
      theme_system_desc: 'Adaptive mode',
      sounds_title: 'Sounds & Haptics',
      sounds_desc: 'Micro-sound chimes and physical vibration',
      sound_chime: 'Payment notification chime',
      sound_chime_desc: 'Pleasant sound when a payment is marked',
      test_sound: 'Test',
      sound_enabled_toast: 'Payment sound chime enabled',
      sound_disabled_toast: 'Sound chime disabled',
      haptics_title: 'Haptic Feedback (Vibration)',
      haptics_desc: 'Light physical vibration on button taps and actions',
      haptics_enabled_toast: 'Haptic feedback enabled',
      haptics_disabled_toast: 'Haptic feedback disabled',
      currency_title: 'Currency & Formatting',
      currency_desc: 'Primary currency for displaying debt balances and summaries',
      currency_uzs: 'Uzbek Som (UZS)',
      currency_uzs_desc: 'National currency',
      currency_usd: 'US Dollar (USD)',
      currency_usd_desc: 'International currency',
      currency_changed_toast: 'Primary currency updated',
      lang_title: 'App Language',
      lang_desc: 'Language for Qarz Daftari interface and notifications',
      lang_uz: "O'zbekcha",
      lang_uz_sub: 'Lotin alifbosida',
      lang_ru: 'Русский',
      lang_ru_sub: 'Russian interface',
      lang_en: 'English',
      lang_en_sub: 'International version',
      active_badge: 'Selected',
      lang_changed_toast: 'English language selected',
    },
    lock: {
      title: 'Debt Book',
      enter_pin_desc: 'Enter 4-digit PIN code to unlock the application',
      forgot_pin: 'Forgot PIN?',
      logout: 'Log out',
      biometrics: 'Biometrics',
      face_id: 'Face ID',
      code_sending: 'Sending code...',
      code_sent: 'Verification code sent to your Telegram bot',
      telegram_code_title: 'Telegram Verification Code',
      telegram_code_desc: 'Enter the 4-digit code sent to your Telegram bot',
      resend_code: 'Resend code',
      set_new_pin_title: 'New PIN code',
      set_new_pin_desc: 'Enter your new 4-digit PIN to secure access',
      confirm_new_pin_title: 'Confirm PIN code',
      confirm_new_pin_desc: 'Re-enter the 4-digit PIN to confirm',
      pin_updated: 'New PIN code successfully saved!',
      wrong_pin: 'Incorrect PIN code',
      wrong_code: 'Invalid verification code',
      pin_mismatch: 'PIN codes do not match',
    },
    dashboard: {
      search_placeholder: 'Search debtor by name or phone...',
      all_tab: 'All debts',
      given_tab: 'Debts given',
      taken_tab: 'Debts taken',
      overdue_tab: 'Overdue',
      total_debt: 'Total debt',
      given_total: 'Given',
      taken_total: 'Taken',
      add_debt_btn: 'Add Debt',
      no_records: 'No debt records found',
    },
  },
}
