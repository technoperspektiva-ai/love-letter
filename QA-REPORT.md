# Love Letter — QA Report

## Оновлення створення листа й анімацій — 2026-09-12

Перевірено в установленому Microsoft Edge, в окремих тимчасових профілях.
Ширини: 320, 390, 430 і 1440 px. Це перевірка адаптивних розмірів у Edge,
а не тестування на фізичних iPhone чи в Safari.

- Головна, демонстраційний конверт, закриття через Escape й повернення фокусу.
- Три кроки створення; перевірка обов’язкових полів.
- Відновлення тексту, кроку та шрифту після перезавантаження.
- Додаткові налаштування й повернення до перегляду; валідація секретного слова.
- Створення листа через локальний Worker/D1, читання в окремому профілі,
  відкриття конверта, показ тексту, вибір і фінал. Тестові листи видаляються.
- Помилка публікації залишає чернетку й можливість повторної спроби.
- Помилка localStorage відображається користувачу.
- Старе посилання редагування коректно зберігає ключ і переходить до листа.
- HTML у тексті залишається текстом; JavaScript із нього не виконується.
- Режим зменшеного руху вимикає анімації та частинки.
- Головна, стилі й демонстрація відкриваються офлайн після кешування PWA.
- Горизонтальне переповнення на перевірених екранах відсутнє;
  JavaScript-помилок у перевірених сценаріях немає.
- Шість інтеграційних перевірок HTMLRewriter пройшли; статичні ресурси,
  HEAD і відповіді API збережені. Перевірки синтаксису й git diff --check пройшли.

Команди та вимоги: див. README.md. Скріншоти перевірено перед очищенням
тимчасових артефактів; постійні сценарії тестів залишаються в scripts/.

## Попередній звіт версії 2.1

База: завантажений користувачем `love-letter-1.15.5-media-gap-fix`, а не нестабільний 2.0.

## Перевірено автоматично в Chromium

Viewport matrix:
- Android compact: 320 × 740
- iPhone: 390 × 844
- Large phone: 430 × 932
- Desktop: 1440 × 900
- Wide desktop: 1920 × 1080

Перевірені екрани:
- Home
- Library / recent letters
- Ideas
- Settings
- Mobile wizard, усі 7 кроків
- Recipient story, усі основні story states
- Final choice/share state

Результат:
- horizontal overflow: 0 px на всіх перевірених viewport;
- JavaScript page errors: 0;
- console errors у тестованих product flows: 0;
- contact presets: 6, вибір синхронізується з полем отримувача;
- wizard та recipient screens скроляться вертикально, коли контент довший за viewport;
- PWA safe-area правила збережені;
- `mediaEnabled` лишився explicit-only: старий word portrait не повинен автоматично переходити до нового листа;
- backend / D1 / short-link business logic не переписувалися.

## Візуальні зміни 2.1
- cream/ivory creator canvas + burgundy hero;
- один дизайн-системний стиль для desktop, iPhone та Android;
- recent letter cards оформлені як конверти;
- hover на desktop піднімає картку, відкриває flap та витягує paper layer;
- Ideas / Settings / Library приведені до тієї ж системи;
- у першому кроці wizard є quick contacts: Кохана, Коханий, Мама, Тато, Подруга, Друг;
- готові сценарії, готові тексти, font switcher, word portrait, photo mode та 36 activity ideas збережені;
- recipient final отримав контрастнішу typography.

## Static checks
- `public/index.html` inline JS: Node syntax check OK
- `worker/index.js`: Node syntax check OK
- `public/sw.js`: Node syntax check OK
- `package.json`: valid JSON
- `manifest.webmanifest`: valid JSON
