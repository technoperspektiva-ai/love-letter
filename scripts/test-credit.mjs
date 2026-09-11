// Run against `npm run dev`: node --test scripts/test-credit.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:8787";

for (const path of ["/", "/index.html", "/l/Test1234", "/edit/Test1234"]) {
  test(`injects exactly one credit into ${path} without redirecting`, async () => {
    const response = await fetch(base + path, { redirect: "manual" });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.equal(html.split("Developed by Hodynnyk 2026").length - 1, 1);
    assert.equal(html.split('id="developer-credit-styles"').length - 1, 1);
    assert.ok(html.indexOf('id="developer-credit-styles"') < html.indexOf("</head>"));
    assert.ok(html.indexOf('<footer class="developer-credit-footer">') < html.indexOf("</body>"));
  });
}

test("leaves static assets byte-for-byte unchanged", async () => {
  for (const path of ["/sw.js", "/manifest.webmanifest", "/icons/icon-192.png"]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(new URL(`../public${path}`, import.meta.url)));
  }
});

test("preserves HEAD and API responses", async () => {
  const head = await fetch(base + "/", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  const missing = await fetch(base + "/api/unknown");
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: "not_found" });
  const options = await fetch(base + "/api/story", { method: "OPTIONS" });
  assert.equal(options.headers.get("access-control-allow-origin"), "*");
  assert.equal(await options.text(), "");
});
