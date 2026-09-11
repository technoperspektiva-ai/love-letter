# Love Letter 1.15 — Media Isolation + Recipient Layout

Виправлено три системні проблеми.

## 1. Фото / word portrait більше не переноситься між листами
- новий лист за замовчуванням має `Без зображення`;
- fresh create очищає photoData / portraitData / lastImageFile;
- готовий сценарій з Ideas також очищає медіа попереднього листа;
- payload додає portrait/photo тільки при явному виборі відповідного режиму;
- showPhoto вимкнений за замовчуванням.

## 2. Recipient layout
- усі не-листові екрани мають один UI font;
- заголовки, підзаголовки, кнопки й поля вирівняні по одній ширині;
- Secret / Intro / Envelope / Choice / Final отримали єдиний vertical rhythm;
- choice cards більше не стрибають по ширині;
- короткі iPhone екрани більше не обрізають content.

## 3. Letter fonts
Декоративний шрифт застосовується тільки до самого листа.
Handwritten stack більше не використовує Comic Sans fallback.

Також виправлено share PNG object URL calls.
