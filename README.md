# Love Letter 2.1 — Cross-platform Stabilized Redesign

Built from the uploaded 1.15.5 stable base rather than the broken 2.0 branch.

Highlights:
- reference-aligned burgundy/ivory visual system without replacing backend/business logic;
- desktop home, library, ideas and settings polished as one ecosystem;
- recent-letter cards behave like real envelopes with hover/open affordance;
- mobile wizard gets quick recipient/contact presets plus manual recipient entry;
- existing scenarios, writing suggestions, font selector, media modes, word portrait, short links, edit/copy/delete and D1 flow preserved;
- recipient screen keeps cream paper / burgundy mood;
- iPhone/Android safe-area, keyboard and scrolling rules consolidated;
- media remains explicit-only (no stale portrait auto-attachment).

Version 2.1.0.

## Creation and motion update

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
