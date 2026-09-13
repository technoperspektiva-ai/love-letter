# Love Letter 2.2.0

A personal letter, a wax-sealed envelope, and a small shared moment. Cream paper,
wine accents, editorial letter typography, and restrained, accessible motion.

## Architecture

- `public/index.html`: existing application, local drafts/library, three-step
  creator (recipient → message → review), optional story details, sharing and media.
- `public/app.css`: shared tokens, navigation, creator, archive, ideas, settings,
  dialogs, empty/error states, and developer credit.
- `public/magic.css` / `public/magic.js`: Home composition and lightweight motion,
  preview dialog, bounded sparkles, pointer tilt, visibility/reduced-motion handling.
- `public/recipient.css`: the **only recipient styling layer**. The same escaped
  paper renderer serves creator review, demo and recipient. Text stays in normal flow.
- `public/legacy.css`: isolated helpers under `#legacyEditor`; hidden legacy fields
  remain the existing data bridge, not a second consumer UI.
- `worker/index.js`: Cloudflare Worker, existing D1/API/short-link/edit-token logic.
  HTMLRewriter injects recipient CSS and the Developed by Hodynnyk 2026 credit.
- `public/sw.js`: versioned `love-letter-2.2.0` app-shell cache. Published letters
  previously opened on this device can be read offline; new sharing needs a connection.

Unused `recipient-demo.css` and `recipient-demo.js` were removed. There is no
animation library and no external font dependency. System sans is used for controls;
letters use local serif families. iPhone safe areas and landscape/tablet layouts are supported.

## Development and verification

```sh
npm ci
npm run dev
# In another terminal, against the local instance:
npm test
npm run test:browser
```

Tests use **installed Microsoft Edge**, headless with isolated temporary profiles.
They never use personal browser profiles or download another browser. Set
`TEST_BASE_URL` to change the local endpoint or `PLAYWRIGHT_MODULE` to use an existing
Playwright installation. Use a disposable local database: browser tests create,
edit and delete their own test letters.

Browser QA covers seven phone/tablet/desktop viewports, the creator and recipient
journeys, draft restore, service states and a separate real-animation motion pass.
Screenshots are generated in `test-results/`; assertions also check behavior,
layout and errors. See `QA-REPORT.md` for the actual verification scope and limits.

After a successful push, stop the local server and remove task-generated
`test-results/`, `.wrangler/` and `node_modules/`. Keep source, lockfile and `.git`.
This removes only the local test database, never deployed D1 data.
