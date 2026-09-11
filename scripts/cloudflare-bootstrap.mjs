import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const DB_NAME = "love-letter-db";
const BUCKET_NAME = "love-letter-images";
const CONFIG = "wrangler.jsonc";

function run(cmd, { allowFail = false } = {}) {
  console.log(`\n> ${cmd}`);
  try {
    return execSync(cmd, {
      encoding: "utf8",
      stdio: ["inherit", "pipe", "pipe"],
      env: process.env,
    });
  } catch (e) {
    const out = `${e.stdout || ""}\n${e.stderr || ""}`.trim();
    if (allowFail) {
      console.log(out);
      return "";
    }
    console.error(out);
    throw e;
  }
}

function extractJson(text) {
  const firstArray = text.indexOf("[");
  const firstObject = text.indexOf("{");
  const startCandidates = [firstArray, firstObject].filter(x => x >= 0);
  if (!startCandidates.length) throw new Error("Wrangler did not return JSON.");
  const start = Math.min(...startCandidates);
  const candidate = text.slice(start).trim();
  return JSON.parse(candidate);
}

function findUuidDeep(value, preferredName = null) {
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const queue = [value];
  let fallback = null;

  while (queue.length) {
    const item = queue.shift();
    if (!item || typeof item !== "object") continue;

    const values = Object.values(item);
    const name = String(item.name ?? item.database_name ?? "");
    const ids = [
      item.uuid, item.id, item.database_id, item.databaseId
    ].filter(v => typeof v === "string" && uuidRe.test(v));

    if (ids.length) {
      if (preferredName && name === preferredName) return ids[0];
      fallback ||= ids[0];
    }

    for (const v of values) {
      if (v && typeof v === "object") queue.push(v);
    }
  }
  return fallback;
}

function getDatabaseId() {
  let listOut = run(`npx wrangler d1 list --json`);
  let list;
  try {
    list = extractJson(listOut);
  } catch {
    list = [];
  }

  let id = findUuidDeep(list, DB_NAME);
  if (id) {
    console.log(`Found D1 ${DB_NAME}: ${id}`);
    return id;
  }

  console.log(`D1 "${DB_NAME}" not found. Creating it...`);
  run(`npx wrangler d1 create ${DB_NAME}`);

  listOut = run(`npx wrangler d1 list --json`);
  list = extractJson(listOut);
  id = findUuidDeep(list, DB_NAME);

  if (!id) {
    // Final fallback: info has a stable JSON shape and supports --json.
    const infoOut = run(`npx wrangler d1 info ${DB_NAME} --json`);
    id = findUuidDeep(extractJson(infoOut), DB_NAME);
  }

  if (!id) throw new Error(`Could not resolve database_id for ${DB_NAME}.`);
  console.log(`Created D1 ${DB_NAME}: ${id}`);
  return id;
}

function patchConfig(databaseId) {
  let cfg = readFileSync(CONFIG, "utf8");

  if (!/"database_id"\s*:/.test(cfg)) {
    throw new Error(`database_id field not found in ${CONFIG}`);
  }

  cfg = cfg.replace(
    /"database_id"\s*:\s*"[^"]*"/,
    `"database_id": "${databaseId}"`
  );

  writeFileSync(CONFIG, cfg);
  console.log(`Patched ${CONFIG} with real D1 database_id.`);
}

function ensureR2() {
  // Creating an already existing bucket exits non-zero; that is harmless.
  const out = run(`npx wrangler r2 bucket create ${BUCKET_NAME}`, { allowFail: true });
  if (out) console.log(out);
  console.log(`R2 bucket check complete: ${BUCKET_NAME}`);
}

function applyMigrations() {
  run(`npx wrangler d1 migrations apply ${DB_NAME} --remote`);
  console.log("D1 migrations applied.");
}

console.log("Love Letter: provisioning Cloudflare resources from the deploy itself.");
const dbId = getDatabaseId();
patchConfig(dbId);
ensureR2();
applyMigrations();
console.log("\nCloudflare provisioning complete. Continuing with Vite build + deploy.");
