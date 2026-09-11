# Love Letter 2.1 — QA Report

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
