# Love Letter — short links edition

Теперь сервис создаёт короткие ссылки:

```text
https://your-domain.workers.dev/l/Ab3Xy9Qk
```

Вместо огромной ссылки с данными внутри.

## Как это работает

- сам сайт и интерфейс остаются в Cloudflare Workers Assets;
- письмо сохраняется в бесплатной D1 базе;
- пользователю возвращается короткий ID;
- фото предварительно сжимается браузером и хранится вместе с payload;
- старые длинные `#story=` ссылки всё ещё поддерживаются.

## Деплой

Cloudflare Deploy command можно оставить:

```bash
npx wrangler deploy
```

В `package.json` добавлен `postinstall`, который во время `bun install` пытается:
1. найти `love-letter-db`;
2. если базы нет — создать её;
3. подставить настоящий `database_id` в `wrangler.jsonc`;
4. применить миграцию.

После этого обычный `npx wrangler deploy` публикует Worker.

Если build identity Cloudflare не разрешает создавать D1 во время install, лог прямо это покажет. В таком случае база создаётся один раз через Dashboard, но код и короткие ссылки уже готовы.


## Short-link v2

- Генератор больше **никогда не откатывается к длинной `#story=...` ссылке**.
- Если D1/API не готовы, пользователь увидит ошибку вместо гигантского URL.
- Получатель в самом конце истории теперь имеет кнопку **«Поділитися 💌»**.
- На iPhone/Android используется системное меню Share; если Web Share недоступен, ссылка копируется в буфер.


## Envelope visibility fix

Виправлено мобільний баг, через який конверт міг стискатися до нульової ширини всередині кнопки. Тепер конверт має явну адаптивну ширину, мінімальний розмір і окрему мобільну настройку.


## Draft autosave

Додано автозбереження чернетки в браузері через `localStorage`.

- текст, ім'я, секретне слово, варіанти, дата, підпис і фото зберігаються автоматично;
- після оновлення сторінки редактор відкривається на тому ж кроці;
- чернетка очищається тільки після успішного створення короткого посилання;
- якщо користувач просто закрив вкладку або оновив сторінку — дані не пропадають.


## New letter button

Додано кнопку **«Створити новий лист»** у верхній частині редактора.

- якщо є чернетка або введений текст, з'являється підтвердження;
- після підтвердження локальна чернетка очищається;
- редактор повертається на перший крок;
- це дозволяє не застрягати у старій чернетці.


## Share choice as screenshot

Кнопка отримувача **«Поділитися вибором 💌»** тепер створює PNG-скрін фінального вибору.

- на iPhone/Android відкривається системне меню Share з PNG-файлом;
- якщо браузер не підтримує передачу файлів через Share, PNG завантажується;
- на картинці є вибраний варіант, дата, час, фінальна примітка і ім'я отримувача.


## Editable short links

Тепер новий лист створює два посилання:

- **коротке посилання для отримувача**: `/l/Ab3Xy9Qk`
- **приватне посилання для редагування**: `/edit/Ab3Xy9Qk#key=...`

Редагування змінює вміст того самого листа, тому коротке посилання для отримувача **не змінюється**.

Ключ редагування зберігається локально в браузері автора і також показується після створення листа.


## URL controls

У приватному режимі редагування додано:

- **Створити новий URL** — переносить лист на новий короткий ID; старе посилання `/l/...` одразу перестає працювати.
- **Видалити лист** — повністю видаляє запис із D1; recipient URL та edit URL більше не працюють.
- Звичайне **Зберегти зміни** не змінює коротке посилання.


## Ukrainian UI update

- Увесь користувацький інтерфейс переведено українською.
- Приклади з ім'ям **Даша** замінено на **Настя**.
- Системні повідомлення, кнопки, підказки та тексти помилок також локалізовано українською.


## Прихований вхід у редагування

На вже надісланому листі автор може **тричі швидко натиснути на іконку `L`** у верхній частині екрана.

- кнопка редагування в інтерфейсі не відображається;
- перехід спрацьовує лише якщо в цьому браузері збережений приватний `edit-key`;
- для звичайного отримувача три кліки нічого не роблять;
- секретний ключ не передається у звичайному recipient URL.


## Final card layout update

Перебудовано фінальну картку:
- заголовок і дата тепер стоять в один ряд;
- час, якщо вказаний, іде окремим рядком нижче;
- оновлення застосовано і до живого перегляду, і до екрана отримувача, і до PNG-скріну.


## Recipient route fix

Виправлено відкриття коротких recipient URL:
- підтримуються `/l/ID` і `/l/ID/`;
- `/edit/ID` також обробляється Worker;
- перед завантаженням листа показується екран «Відкриваємо лист…»;
- дані листа завжди запитуються без кешу;
- коротке посилання більше не має випадково відкривати головний конструктор через trailing slash.


## Photo + typography fix

- Фото на фінальному екрані повернуто: якщо фото завантажене, воно тепер завжди показується у фіналі.
- Оновлено типографіку фінальної картки: заголовок лишається акцентним, а дата стала компактнішою та читабельнішою.
- Те саме оновлення застосовано до recipient-екрана, live preview і PNG для кнопки «Поділитися».


## D1 short-link reliability fix (v14)

Ця версія прибирає небезпечний фейковий D1 UUID.

Під час install/bootstrap:
- шукається саме база `love-letter-db`;
- якщо її немає — скрипт намагається її створити;
- реальний `database_id` автоматично підставляється у `wrangler.jsonc`;
- міграції застосовуються до remote D1;
- якщо D1 ID не вдалося отримати, build **зупиняється**, а не деплоїть Worker з поламаними `/l/...` посиланнями.

Для Cloudflare можна залишити Deploy command:
`npx wrangler deploy`

Під час встановлення залежностей `postinstall` виконає bootstrap автоматично.


## v15 — D1 without bootstrap scripts

Ця версія більше не підставляє `database_id` через `postinstall`.

Wrangler 4.131 використовує нативне автоматичне provision:
```json
"d1_databases": [{ "binding": "DB" }]
```

Під час `npx wrangler deploy` Cloudflare сам створює/підключає ресурс D1 і зберігає цей зв'язок для наступних deploy.

Worker сам створює таблицю `stories` при першому API-запиті, тому окремі migrations для запуску сайту більше не потрібні.

Додано:
- `GET /api/health` для перевірки D1;
- після створення листа frontend одразу читає його назад через API;
- recipient URL показується лише якщо запис реально доступний.

Deploy command: `npx wrangler deploy`


## v16 — explicit D1 binding

D1 прив'язано напряму:
- binding: `DB`
- database_name: `love-letter`
- database_id: `fbe0e91b-ca33-40cb-881c-a7f834c46cc8`

Deploy command: `npx wrangler deploy`


## v17 — D1 name correction

Виправлено назву бази:
- binding: `DB`
- database_name: `love-letter-db`
- database_id: `fbe0e91b-ca33-40cb-881c-a7f834c46cc8`


## v18 — D1 schema parser fix

Виправлено помилку:

`D1_EXEC_ERROR: CREATE TABLE ... incomplete input`

Причина була в multi-statement `env.DB.exec(...)`.
Тепер `CREATE TABLE` та обидва `CREATE INDEX` виконуються окремими `prepare(...).run()` викликами.

Після deploy перевір:
`/api/health`

Очікувано:
`{"ok":true,"db":true,"stories":0}`


## v19 — recipient URL + mobile editor

- Прибрано автоматичний `history.replaceState(.../edit/...)` після перевипуску URL.
- Кнопка перевірки recipient link відкриває `/l/...` у новій вкладці, не переводячи редактор на `/edit/...`.
- Recipient URL зроблено головним і візуально виділеним.
- Приватне edit-посилання тепер сховане за «Показати приватне керування».
- Редактор суттєво адаптовано під телефон і планшет: одна колонка, нормальні поля, кнопки на всю ширину, preview без sticky, iOS-safe font-size.


## v20 — one recipient route + real mobile editor

Ключова зміна: для користувача існує тільки один нормальний URL — `/l/ID`.

- `/l/ID` завжди відкриває історію отримувача.
- Потрійний тап по `L` на браузері автора відкриває редактор **на місці**, без переходу на `/edit/...`.
- Старі `/edit/ID#key=...` лише зберігають ключ локально і одразу нормалізуються назад у `/l/ID`.
- Приватне edit-посилання більше не показується в інтерфейсі.
- Після створення посилання frontend робить read-back перевірку з D1.
- `/api/health` повертає `version: "v20"`.

Мобільний редактор:
- hero прибраний на телефоні;
- preview відкривається окремою повноекранною панеллю через «👁 Перегляд»;
- кроки sticky;
- навігація «Назад / Далі» закріплена внизу;
- поля та textarea адаптовані під touch/iOS.


## v21 — force recipient open

- Кнопка «Відкрити лист як отримувач» тепер переходить у цій же вкладці через `location.assign()`.
- Копіювання перевіряє, що URL має формат `/l/ID`.
- `/l/ID` примусово запускає тільки recipient mode.
- Query/hash/trailing slash на recipient URL очищаються без зміни самого `/l/ID`.
- `/api/health` тепер повертає `version: "v21"`.


## v22 — actual recipient routing fix

Знайдено реальну причину редіректу на головну сторінку.

Worker раніше для `/l/ID` робив внутрішній fetch на `/index.html`.
Cloudflare Static Assets за замовчуванням канонізує `/index.html` у `/`, тому браузер
фактично переходив на головну сторінку конструктора.

У v22:
- `/l/ID` передається в `env.ASSETS.fetch(request)` з ОРИГІНАЛЬНИМ URL;
- `single-page-application` сам віддає `index.html`, але адреса `/l/ID` зберігається;
- `html_handling` встановлено в `none`, щоб Cloudflare не робив HTML canonical redirects;
- `/api/health` повертає `version: "v22"`.

Мобільний редактор з v20/v21 збережено.


## v23 — soft mobile + letter typography + real animation

- На реальному телефоні recipient page більше не виглядає як «телефон всередині телефона»:
  рамка прибрана, історія займає екран, верхня панель стала м'якою/скляною.
- Мобільний редактор отримав спокійніші поверхні, нормальні відступи,
  touch-friendly поля та чисту нижню навігацію.
- Лист: заголовок — Cormorant, текст — читабельний serif, рукописний шрифт
  лишився тільки для звернення та підпису.
- Прибрані `overflow-wrap:anywhere` і `hyphens:auto`, які давали дивні переноси.
- Додано автоматичні `letter-normal/compact/dense/ultra` режими.
- Довгий лист не ламає viewport: прокручується тільки область паперу,
  кнопка переходу лишається на екрані.
- Додана анімація відкриття конверта: клапан відкривається, печатка відходить,
  лист виїжджає з конверта, після чого папір м'яко проявляється.
- `/api/health` -> `version: "v23"`.


## v24 — PWA + local word portrait + product redesign

- Додано PWA manifest, service worker, 192/512/maskable/Apple icons та кнопку встановлення.
- У standalone-режимі маркетинговий hero ховається, редактор працює як окремий застосунок.
- Чернетка працює локально; раніше відкриті листи/API-відповіді можуть відкриватися з cache.
- Новий режим «Портрет зі слів»: браузер локально перетворює фото на 40×50 карту світла/тіней, квантує до 4 bit і зберігає лише компактний відбиток + слова.
- Оригінальне фото в portrait mode не відправляється на сервер.
- Залишено звичайний photo mode для сумісності.
- Перероблено product design: system-first typography, premium surfaces, install UX, mobile cards, privacy state.
- Google Fonts прибрані: PWA не залежить від зовнішніх шрифтів.
- `/api/health` повертає `version: "v24"`.


## v25 — premium mobile story wizard

Повний mobile UX redesign без переписування backend/business logic.

- На мобільному legacy form/layout приховано.
- Новий mobile flow — story-like wizard: один екран = одне рішення.
- 6 великих етапів, але кожен показується окремо:
  1. Для кого
  2. Перше враження
  3. Секрет
  4. Сам лист
  5. Образ
  6. Фінальний вибір
- Компактний progress: назва кроку + `1 з 6` + тонка progress bar.
- Bottom CTA з safe-area, blur та VisualViewport keyboard handling.
- Окремий fullscreen live preview sheet.
- UI typography — system/SF-like sans; letter preview — editorial serif.
- Mobile form controls 52–54px, без giant inputs.
- Жодного horizontal stepper / overflow / desktop-card-stack.
- Word portrait та existing business logic залишені й синхронізуються через legacy fields.
- Desktop layout не змінювався.
- `/api/health` -> `version: "v25"`.


# Love Letter 1.0

Це вже не просто mobile editor.

## Product shell
- Home з останніми листами і чернеткою.
- Локальна Library.
- Letter Detail з open/share/edit/regenerate/delete.
- Settings / install / privacy / local storage.
- Ready screen після створення листа.
- PWA shortcuts: «Новий лист» та «Мої листи».
- Авторські edit keys залишаються тільки у localStorage.

## Create
- Story-like wizard з progressive disclosure.
- Fullscreen preview.
- Word portrait / photo / no-image.
- Existing D1 business logic не переписано.
- Після створення користувач не викидається одразу у recipient mode —
  він бачить продуктову success-сцену.

## Existing letters
При першому запуску 1.0 застосунок знаходить локальні `love-letter-edit-*`
ключі старих листів, читає відповідні payload із D1 і додає їх у Library.

`/api/health` -> `version: "1.0"`


## 1.0.1 — clickable desktop stepper

Виправлено desktop stepper:
- усі 7 кроків можна відкривати напряму;
- більше не потрібно проходити `Далі`, щоб розблокувати наступні вкладки;
- перед переходом чернетка автоматично зберігається;
- активний tab автоматично центрується в горизонтальному рядку;
- додано hover/press feedback.


# Love Letter 1.1 — Magic Pass

Цей реліз не додає декоративні ефекти поверх форми. Він додає емоційну
хореографію самому процесу створення.

- Кожен mobile step має власний quiet hero moment:
  - ім'я → живий монограмний знак;
  - перший екран → live editorial typography;
  - секрет → lock/unlock visual;
  - текст → аркуш, що «пишеться»;
  - образ → слова збираються у портрет;
  - вибір → орбіта майбутніх варіантів.
- Live magic реагує на введення імені та headline.
- Перехід між decisions отримав direction-aware slide/fade, haptic і короткий
  success pulse.
- Ready screen тепер не просто «Готово»: лист фізично складається в конверт,
  закривається клапан і ставиться печатка.
- Motion делікатний і повністю поважає `prefers-reduced-motion`.
- Висота magic hero адаптується для коротких екранів.
- Desktop stepper fix 1.0.1 збережено.
- `/api/health` -> `version: "1.1"`.


## 1.1.1 — Clean Home

Головний екран спрощено:
- прибрано дублюючий kicker / рекламний опис / велику promo-картку;
- один hero message + одна головна дія;
- чернетка показується окремим тихим рядком лише якщо вона реально є;
- блок «Останні» існує тільки коли вже є листи;
- empty-state на Home прибраний;
- повна Library лишилася окремою вкладкою.


# Love Letter 1.2 — Unified Ecosystem

Mobile і desktop тепер є одним продуктом, а не двома різними інтерфейсами.

## Shared product model
- Одна Home.
- Одна Library.
- Один Letter Detail.
- Одні Settings.
- Один Create Wizard.
- Одна локальна бібліотека і ті самі edit keys.
- Одна D1 / recipient URL / PWA business logic.

## Desktop composition
Desktop більше не використовує legacy horizontal-pill constructor на `/`.

- ліворуч — тихий app rail;
- по центру — той самий story wizard;
- праворуч — постійний cinematic live preview;
- Library/Home/Settings мають desktop composition, але той самий visual language;
- create flow використовує ті самі дані, кроки, magic moments та transitions,
  що й mobile.

## Mobile composition
Залишається thumb-first:
- bottom navigation;
- fullscreen decisions;
- modal/fullscreen preview;
- safe-area + VisualViewport.

Таким чином adaptive layout різний, але product language, state, navigation,
business logic та visual system — спільні.

`/api/health` -> `version: "1.2"`


# Love Letter 1.3 — Desktop Home Polish

Перероблено desktop Home після реального screenshot review.

Проблеми 1.2:
- надто багато порожнього простору;
- hero і recent list виглядали як дві випадкові області;
- cards мали занадто слабкий contrast;
- sidebar візуально не завершував app shell;
- композиція була «розтягнутим макетом», а не desktop product.

1.3:
- компактніший 220px app rail;
- бренд нормально читається в rail;
- main canvas до 1180px, центрований;
- hero + recent area мають збалансовану двоколонкову композицію;
- recent list отримав єдину світлу surface;
- cards тепер мають нормальний текстовий contrast і hover state;
- на екранах без листів hero автоматично центрується;
- laptop-height polish для низьких viewport.

`/api/health` -> `version: "1.3"`
