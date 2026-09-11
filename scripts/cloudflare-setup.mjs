import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const run = (cmd) => {
  console.log(`\n> ${cmd}`);
  try { return execSync(cmd, { encoding: "utf8", stdio: ["inherit", "pipe", "inherit"] }); }
  catch (e) { throw new Error(`Команда не выполнена: ${cmd}`); }
};

console.log("Love Letter — автоматическая подготовка Cloudflare");
console.log("Перед запуском выполните: npx wrangler login");

let out = "";
try {
  out = run("npx wrangler d1 create love-letter-db");
} catch {
  console.log("База, возможно, уже существует. Получаю список...");
  out = run("npx wrangler d1 list");
}

const uuid = out.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i)?.[0];
if (!uuid) {
  console.error(out);
  throw new Error("Не смог определить database_id автоматически. Вставьте ID love-letter-db в wrangler.jsonc вручную.");
}

let cfg = readFileSync("wrangler.jsonc", "utf8");
cfg = cfg.replace(/"database_id":\s*"[^"]+"/, `"database_id": "${uuid}"`);
writeFileSync("wrangler.jsonc", cfg);

try { run("npx wrangler r2 bucket create love-letter-images"); }
catch { console.log("R2 bucket уже существует или был создан ранее — продолжаю."); }

run("npx wrangler d1 migrations apply love-letter-db --remote");
console.log("\nГотово. Теперь: npm run deploy");
