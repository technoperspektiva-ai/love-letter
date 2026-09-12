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

<<<<<<< HEAD
/api/health → version 2.1.4
=======
The home screen now leads with a live envelope, an interactive letter example,
and three starters: love, gratitude, and support. New letters use three steps:
recipient, message, and review. Secret words, imagery, opening text, choices,
and the ending remain available from the review's optional details. Font selection
is optional too. Drafts retain the current step and chosen font on this device.

`public/magic.css` and `public/magic.js` provide the motion layer without a runtime
library: floating paper, orbital accents, hover tilt, touch particles, and letter
reveals. Particles are capped and removed, effects pause when the page is hidden,
and reduced-motion preferences disable animations. Demo previews use a native
dialog with keyboard dismissal and focus restoration.

The developer credit is still injected by `worker/index.js` using HTMLRewriter.

Recipient pages now use an isolated `rs-*` layout in `public/recipient.css`.
They no longer use the creator's mock-phone dimensions or nested scroll areas.
Phone layouts use one column and safe-area padding; tablets use a two-column
choice list; desktop reading width is capped. Back navigation, keyboard secret
submission, and empty-choice handling are included. The PWA caches the new CSS.
This recipient follow-up was syntax-checked only; browser reruns were skipped
at the user's request, so the earlier QA report does not validate this revision.

## Local verification

Install dependencies with `npm ci`, then start `npm run dev`. In another terminal:

```sh
npm test
npm run test:browser
```

Browser tests require **Microsoft Edge already installed**. They use isolated
temporary profiles, never a personal browser profile, and do not download a
browser. `TEST_BASE_URL` can override the local URL; `PLAYWRIGHT_MODULE` can point
to an existing Playwright installation. Use a local test instance: these tests
create and delete test letters. Screenshots are written to `test-results/`.

After verification and a successful Git push, stop the local server and remove
`test-results/`, `.wrangler/`, and `node_modules/` if no further local work is needed.
Keep source files, `package-lock.json`, and `.git`. Removing `.wrangler/` removes
the local test database, not the deployed database.
>>>>>>> 0d54dfb (Isolate responsive recipient flow from legacy phone layout)
