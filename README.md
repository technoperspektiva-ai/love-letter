# Love Letter 2.1.3 — Demo Recipient

Цей update навмисно використовує **поточний main story renderer**, але зовнішній вигляд
отримувача приводить до вже реалізованого Demo (`magic-dialog` / `magic-demo-envelope`).

## Що змінено
- recipient envelope тепер має ті самі cream/pink proportions, що й Demo;
- seal = heart, підпис = «Для тебе»;
- підказка = «Торкнись, щоб відкрити»;
- навколо envelope — cream Demo card з `ТАК ПОЧИНАЄТЬСЯ МАЛЕНЬКЕ ДИВО`;
- actual letter використовує той самий cream paper language, що Demo після відкриття;
- прибрано translate-анімації з recipient text, щоб текст не вилітав і не пропадав;
- choice/final теж переведені на light paper cards;
- current main `index.html`, `magic.css`, `magic.js`, creation flow та API не замінюються.

## Overlay
Скопіювати поверх current main:
- `public/recipient-demo.css`
- `public/recipient-demo.js`
- `worker/index.js`

`/api/health` → `version: "2.1.3"`.
