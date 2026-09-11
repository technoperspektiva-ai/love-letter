# Love Letter 1.15.1 — Story Scroll Fix

Причина:
базовий `.app` мав `overflow:hidden`, тому recipient story фізично обрізався по висоті viewport, навіть коли внутрішні екрани вже були переведені на `height:auto`.

Виправлення:
- recipient mode отримує class `story-open`;
- `.app`, `#storyView`, `.phone`, `.phone-stage`, letter/choice/final screens у story mode мають `height:auto` і `overflow:visible`;
- body у story mode має нормальний `overflow-y:auto`;
- touch scroll примусово дозволено через `touch-action:pan-y`;
- scroll unlock запускається при вході в recipient route;
- при поверненні в editor story-mode class прибирається.

Cache: love-letter-1.15.1
