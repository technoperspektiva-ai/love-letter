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
