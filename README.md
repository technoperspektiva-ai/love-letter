# Love Letter 2.1.1 — Recipient Polish Patch

Цей ZIP зроблений як **overlay саме поверх поточного GitHub `technoperspektiva-ai/love-letter` 2.1**.

Замінює / додає тільки:
- `public/recipient.css`
- `worker/index.js`

Тому поточні `magic.css`, `magic.js`, новий creation flow, browser tests та інші GitHub-фічі не відкочуються.

## Що виправляє recipient view
- cream header з читабельним логотипом;
- desktop recipient живе на cream canvas, story — у premium burgundy surface;
- intro / secret / envelope / letter / choices / final зведені в одну систему;
- конверт має hover/open lift, paper peek і wax animation;
- лист отримав адекватну serif typography, рамку, line-height та responsive density;
- choice cards більше не виглядають як випадкові темні блоки;
- final/share zone має чітку ієрархію;
- iPhone/Android — fullscreen layout із safe-area;
- desktop — центрований 760px story surface без мертвих пустот;
- скрол не блокується.

## Версія
`/api/health` → `version: "2.1.1"`.
