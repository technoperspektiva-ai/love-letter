# Love Letter 2.1.4 — Demo Recipient Fixed

Це виправлення зроблено після перевірки реальних mobile screenshots.

## Що було зламано в 2.1.3
1. У старого `.preview-env .recipient` залишалися `transform: translateX(-50%)`
   і `width:78%`. Через це псевдо-текст `Для тебе` фізично вилітав ліворуч.
2. `.phone-stage` продовжував мати старий burgundy background, а 2.1.3
   зробив intro-текст темним — через це він майже зникав.
3. Надто широкий reset анімацій прибрав відчуття Demo.

## 2.1.4
- кожен recipient step живе всередині cream Demo card;
- burgundy використовується як theatre background, а не як фон під темний текст;
- `Для тебе` повністю reset: left/right/width/transform/overflow;
- конверт відтворює Demo geometry;
- повернуто safe animation: card fade+scale, text fade, envelope breathe,
  wax glow, flap opening і envelope exit;
- actual letter залишається current-main `previewLetter()`, тільки стабільно
  оформлений cream paper;
- усі тексти у normal flow і не можуть вилітати за paper/card.

Overlay поверх current main:
- public/recipient-demo.css
- public/recipient-demo.js
- worker/index.js

/api/health → version 2.1.4
