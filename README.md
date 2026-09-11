# Love Letter 2.1.2 — Recipient Stability Patch

Цей update створений **під поточний `main`**, де вже є `magic.css`, `magic.js`
та новий creation flow.

Він навмисно НЕ замінює `public/index.html`, тому актуальний лист і всі поточні
фічі з main залишаються. Update лише додає фінальний recipient override поверх
поточного CSS.

## Причина проблеми
У current main `magic.css` анімував:
- `.letter-enter`
- `.title`
- `.msg`
- `.sign`
- заголовки story
через translate/`backwards` animations.

Разом зі старими recipient rules на iOS/WebView це могло давати:
- текст тимчасово `opacity:0`;
- текст за межами paper card;
- clipping під час transform;
- «літаючі» заголовки.

## 2.1.2
- translate-animation для recipient text замінено на короткий fade;
- `to/title/msg/sign` жорстко повернуті в normal flow;
- letter card отримав `height:auto`, коректний wrap і containment;
- intro/secret/choice/final теж повернуті в normal flow;
- envelope animation залишена;
- current-main markup і `previewLetter()` не замінюються;
- iPhone / Android / desktop rules окремі;
- cream recipient header + burgundy story surface збережені.

## Файли
Скопіювати поверх поточного репозиторію:
- `public/recipient.css`
- `worker/index.js`

Після deploy:
`/api/health` → `version: "2.1.2"`.
