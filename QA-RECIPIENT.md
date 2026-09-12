# Love Letter 2.1.5 — Recipient Full Fix

## Що реально ламало recipient

1. `public/index.html` має старі recipient rules для `.preview-env`, `.stage-center`, `.paper`,
   `.phone-stage` та fixed/min-height композиції.
2. `public/magic.css` поверх них анімує `.letter-enter`, `.title`, `.msg`, `.sign`
   через `transform + backwards opacity`.
3. Попередні recipient patches додавали ще один шар правил на ті самі селектори.
   У Safari / WebView каскад ставав нестабільним: текст міг мати старий translate,
   а новий position/width — звідси «літаючі» написи.
4. Старий `.preview-env .recipient` мав `left:50% + translateX(-50%) + width:78%`.
   При підміні тексту через pseudo-element це буквально виносило «Для тебе» за конверт.
5. Попередній safety reset прибрав transform-анімації занадто широко — текст перестав літати,
   але разом з цим зникло відчуття відкриття листа.
6. `developer-credit-footer` додавався глобально Worker-ом і з'являвся одразу під recipient,
   руйнуючи емоційну композицію.
7. Letter / choice / final використовували різні візуальні системи й зайві min-height,
   тому після красивого preview recipient виглядав як інший продукт.

## Що зроблено

- одна фінальна recipient stylesheet, яка завантажується ПІСЛЯ current main + magic.css;
- старі recipient-demo CSS/JS більше не підключаються;
- envelope відтворює preview/demo: cream card, pink paper, heart wax, «Для тебе»;
- envelope idle animation + wax glow;
- click: flap open -> paper peek rises -> seal disappears -> envelope exits;
- actual `previewLetter()` з current main НЕ замінюється;
- actual paper отримав окрему unfold animation;
- title/message/sign анімуються тільки opacity, не вилітають за paper;
- intro / secret / choices / final приведені до тієї ж cream-paper системи;
- text containment reset: no inherited translate/absolute offsets;
- content-heavy steps size to content, без великих мертвих зон;
- developer footer приховано тільки у recipient mode;
- iPhone / Android / desktop мають окремі responsive rules;
- service worker cache bumped, recipient.css додано до cache list.

## Browser QA

Побудований окремий harness із markup поточного `renderStory()`:
- 320 × 740
- 390 × 844
- 430 × 932
- 1440 × 900

Перевірено steps 0–5:
- horizontal overflow: 0 px;
- elements outside viewport: 0;
- console errors: 0;
- body scroll: enabled;
- envelope opening animation: active;
- paper unfold animation: active;
- all `to/title/msg/sign` bounds stay inside `.paper`.

## Deploy

Overlay current main with:
- `public/recipient.css`
- `public/sw.js`
- `worker/index.js`
- `package.json`

After deploy:
`/api/health` -> `version: "2.1.5"`
