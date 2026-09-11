import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const DB_NAME = "love-letter-db";
const CONFIG = "wrangler.jsonc";

function exec(cmd, allowFail = false) {
  try {
    const out = execSync(cmd, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env
    });
    return out;
  } catch (e) {
    if (allowFail) return "";
    const msg = `${e.stdout || ""}\n${e.stderr || ""}`.trim();
    throw new Error(msg || `Failed: ${cmd}`);
  }
}

function parseJsonLoose(text) {
  const starts = [text.indexOf("["), text.indexOf("{")].filter(x => x >= 0);
  if (!starts.length) return null;
  const start = Math.min(...starts);
  try { return JSON.parse(text.slice(start)); } catch { return null; }
}

function findDbId(obj) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const queue = [obj];
  let fallback = null;

  while (queue.length) {
    const x = queue.shift();
    if (!x || typeof x !== "object") continue;

    const name = String(x.name ?? x.database_name ?? "");
    const candidates = [x.uuid, x.id, x.database_id, x.databaseId]
      .filter(v => typeof v === "string" && uuid.test(v));

    if (candidates.length) {
      if (name === DB_NAME) return candidates[0];
      fallback ??= candidates[0];
    }

    for (const v of Object.values(x)) {
      if (v && typeof v === "object") queue.push(v);
    }
  }
  return fallback;
}

function canUseWrangler() {
  return !!exec("npx wrangler whoami", true);
}

console.log("\nLove Letter: preparing short-link storage...");

if (!canUseWrangler()) {
  console.log("Cloudflare auth is not available during install; skipping provisioning here.");
  console.log("The Cloudflare build environment normally provides it. If not, run npm install once in an authenticated shell.");
  process.exit(0);
}

let list = parseJsonLoose(exec("npx wrangler d1 list --json", true) || "[]");
let id = findDbId(list);

if (!id) {
  console.log(`Creating D1 database "${DB_NAME}"...`);
  exec(`npx wrangler d1 create ${DB_NAME}`, true);
  list = parseJsonLoose(exec("npx wrangler d1 list --json", true) || "[]");
  id = findDbId(list);
}

if (!id) {
  const info = parseJsonLoose(exec(`npx wrangler d1 info ${DB_NAME} --json`, true) || "{}");
  id = findDbId(info);
}

if (!id) {
  console.log("Could not resolve D1 id automatically. Leaving config unchanged.");
  process.exit(0);
}

let cfg = readFileSync(CONFIG, "utf8");
cfg = cfg.replace(
  /"database_id"\s*:\s*"[^"]+"/,
  `"database_id": "${id}"`
);
writeFileSync(CONFIG, cfg);

console.log(`D1 ready: ${DB_NAME} (${id})`);
const migrationOut = exec(`npx wrangler d1 migrations apply ${DB_NAME} --remote`, false);
console.log(migrationOut || "Short-link database migration applied.");
