import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const DB_NAME = "love-letter-db";
const CONFIG = "wrangler.jsonc";

function exec(cmd, allowFail = false) {
  try {
    return execSync(cmd, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env
    });
  } catch (e) {
    const msg = `${e.stdout || ""}\n${e.stderr || ""}`.trim();
    if (allowFail) return "";
    throw new Error(msg || `Failed: ${cmd}`);
  }
}

function parseJsonLoose(text) {
  const starts = [text.indexOf("["), text.indexOf("{")].filter(x => x >= 0);
  if (!starts.length) return null;
  const start = Math.min(...starts);
  try {
    return JSON.parse(text.slice(start));
  } catch {
    return null;
  }
}

function findNamedDbId(obj) {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const queue = [obj];

  while (queue.length) {
    const x = queue.shift();
    if (!x || typeof x !== "object") continue;

    const name = String(x.name ?? x.database_name ?? "");
    const candidates = [x.uuid, x.id, x.database_id, x.databaseId]
      .filter(v => typeof v === "string" && uuid.test(v));

    if (name === DB_NAME && candidates.length) {
      return candidates[0];
    }

    for (const v of Object.values(x)) {
      if (v && typeof v === "object") queue.push(v);
    }
  }

  return null;
}

function listDatabases() {
  const out = exec("npx wrangler d1 list --json", true);
  return parseJsonLoose(out || "[]") || [];
}

console.log("\nLove Letter: preparing D1 short-link storage...");

let databases = listDatabases();
let databaseId = findNamedDbId(databases);

if (!databaseId) {
  console.log(`D1 database "${DB_NAME}" not found. Creating it...`);
  const created = exec(`npx wrangler d1 create ${DB_NAME}`, true);
  if (created) console.log(created);

  databases = listDatabases();
  databaseId = findNamedDbId(databases);
}

if (!databaseId) {
  const info = parseJsonLoose(
    exec(`npx wrangler d1 info ${DB_NAME} --json`, true) || "{}"
  );
  databaseId = findNamedDbId(info);
}

if (!databaseId) {
  throw new Error(
    `Could not resolve D1 database id for "${DB_NAME}". ` +
    `The deploy is stopped intentionally so the Worker cannot go live with a broken short-link database.`
  );
}

let cfg = readFileSync(CONFIG, "utf8");
cfg = cfg.replace(
  /"database_id"\s*:\s*"[^"]+"/,
  `"database_id": "${databaseId}"`
);
writeFileSync(CONFIG, cfg);

console.log(`D1 ready: ${DB_NAME} (${databaseId})`);

const migrationOut = exec(
  `npx wrangler d1 migrations apply ${DB_NAME} --remote`,
  false
);
console.log(migrationOut || "D1 migrations applied.");

console.log("Love Letter D1 provisioning complete.\n");
