# Love Letter 💌

Бесплатный сервис цифровых писем/капсул времени. Получатель получает одну секретную ссылку, видит анимированный конверт и может открыть письмо сразу или после заданного времени.

## Уже внутри

- пошаговый мобильный редактор;
- 4 бесплатные темы;
- имя получателя и текст на конверте;
- длинное письмо и подпись;
- загрузка фото;
- локальная стилизация портрета в браузере — без платного AI API;
- хранение портрета в Cloudflare R2;
- письмо в Cloudflare D1;
- таймер открытия;
- случайная секретная ссылка;
- сервер не отдаёт текст письма до наступления unlock time;
- отметка первого открытия;
- кнопка Telegram Share;
- адаптивный дизайн;
- GitHub Actions для Cloudflare.

## Стек

React + Vite + TypeScript + Cloudflare Workers + D1 + R2.

Проект намеренно не использует платные внешние API. Для небольшого проекта он может работать в бесплатных лимитах Cloudflare (проверяйте актуальные лимиты вашего аккаунта).

## Быстрый запуск локально

```bash
npm install
npx wrangler d1 migrations apply love-letter-db --local
npm run dev
```

> Для локальной D1 можно временно заменить `REPLACE_AFTER_CF_SETUP` на любой валидный UUID либо сначала пройти Cloudflare setup ниже.

## Первый деплой в Cloudflare

1. Установите зависимости:

```bash
npm install
```

2. Авторизуйтесь:

```bash
npx wrangler login
```

3. Автоматически создайте D1 + R2 и примените миграцию:

```bash
npm run cf:setup
```

Скрипт создаёт:
- D1: `love-letter-db`
- R2: `love-letter-images`
- подставляет D1 `database_id` в `wrangler.jsonc`
- применяет SQL-миграции.

4. Разверните:

```bash
npm run deploy
```

Worker называется **love-letter**.

## GitHub

Рекомендуемое имя репозитория: **love-letter**.

```bash
git init
git add .
git commit -m "Initial Love Letter"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/love-letter.git
git push -u origin main
```

### Автодеплой из GitHub

В репозитории уже есть `.github/workflows/deploy.yml`.

Добавьте в GitHub → Settings → Secrets and variables → Actions:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

После каждого push в `main` GitHub Actions выполнит `wrangler deploy`.

## Структура

- `src/` — пользовательский интерфейс.
- `worker/` — API Cloudflare Worker.
- `migrations/` — схема D1.
- `scripts/cloudflare-setup.mjs` — первичная подготовка Cloudflare.
- `.github/workflows/deploy.yml` — CI/CD.

## Что логично добавить дальше

Следующая версия может получить Telegram Login, список «Мои письма», одноразовые письма, реакцию получателя, аудиосообщение и собственный домен.

## Build note

`@cloudflare/workers-types` intentionally isn't pinned: the project ships a minimal local type shim so Cloudflare/Bun builds don't fail on unavailable dated type-package versions.
