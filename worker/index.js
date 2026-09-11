const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
  "access-control-allow-headers": "content-type,x-edit-token"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...cors }
  });
}

function randomId(len = 8) {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

function randomToken(len = 28) {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2,"0")).join("");
}

function validatePayload(payload) {
  if (!payload || typeof payload !== "object") return "invalid_payload";
  const raw = JSON.stringify(payload);
  if (raw.length > 400000) return "payload_too_large";
  return "";
}

async function ensureSchema(env) {
  if (!env.DB) {
    throw new Error("D1 binding DB is not available");
  }

  // Execute each statement separately. D1 can reject a multi-statement exec()
  // with "incomplete input" depending on the runtime/parser.
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS stories (" +
    "id TEXT PRIMARY KEY, " +
    "payload TEXT NOT NULL, " +
    "created_at INTEGER NOT NULL, " +
    "edit_token TEXT" +
    ")"
  ).run();

  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at)"
  ).run();

  await env.DB.prepare(
    "CREATE INDEX IF NOT EXISTS idx_stories_edit_token ON stories(edit_token)"
  ).run();
}

async function health(env) {
  try {
    await ensureSchema(env);
    const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM stories").first();
    return json({
      ok: true,
      db: true,
      stories: Number(row?.count || 0),
      version: "1.11"
    });
  } catch (error) {
    return json({
      ok: false,
      db: false,
      error: String(error?.message || error)
    }, 500);
  }
}

async function createStory(request, env) {
  await ensureSchema(env);
  const body = await request.json();
  const payload = body?.payload;
  const invalid = validatePayload(payload);
  if (invalid) {
    return json({
      error: invalid,
      message: invalid === "payload_too_large"
        ? "Фото слишком большое. Выбери другое фото или убери его."
        : "Некорректные данные письма."
    }, invalid === "payload_too_large" ? 413 : 400);
  }

  let id = "";
  for (let i = 0; i < 6; i++) {
    const candidate = randomId(8);
    const exists = await env.DB.prepare("SELECT id FROM stories WHERE id = ?").bind(candidate).first();
    if (!exists) { id = candidate; break; }
  }
  if (!id) return json({ error: "id_generation_failed" }, 500);

  const editKey = randomToken(30);
  const editHash = await sha256(editKey);
  const raw = JSON.stringify(payload);

  await env.DB.prepare(
    "INSERT INTO stories (id, payload, created_at, edit_token) VALUES (?, ?, ?, ?)"
  ).bind(id, raw, Date.now(), editHash).run();

  return json({
    ok: true,
    id,
    path: `/l/${id}`,
    editPath: `/edit/${id}#key=${editKey}`,
    editKey
  }, 201);
}

async function getStory(id, env) {
  await ensureSchema(env);
  const row = await env.DB.prepare(
    "SELECT payload FROM stories WHERE id = ?"
  ).bind(id).first();

  if (!row) return json({ error: "not_found" }, 404);

  try {
    return json({ ok: true, payload: JSON.parse(row.payload) });
  } catch {
    return json({ error: "corrupt_story" }, 500);
  }
}

async function updateStory(request, id, env) {
  await ensureSchema(env);
  const editKey = request.headers.get("x-edit-token") || "";
  if (!editKey) return json({ error: "missing_edit_token" }, 401);

  const row = await env.DB.prepare(
    "SELECT edit_token FROM stories WHERE id = ?"
  ).bind(id).first();

  if (!row) return json({ error: "not_found" }, 404);
  if (!row.edit_token) return json({ error: "not_editable" }, 403);

  const hash = await sha256(editKey);
  if (hash !== row.edit_token) return json({ error: "invalid_edit_token" }, 403);

  const body = await request.json();
  const payload = body?.payload;
  const invalid = validatePayload(payload);
  if (invalid) {
    return json({
      error: invalid,
      message: invalid === "payload_too_large"
        ? "Фото слишком большое. Выбери другое фото или убери его."
        : "Некорректные данные письма."
    }, invalid === "payload_too_large" ? 413 : 400);
  }

  await env.DB.prepare(
    "UPDATE stories SET payload = ? WHERE id = ?"
  ).bind(JSON.stringify(payload), id).run();

  return json({ ok: true, id, path: `/l/${id}` });
}


async function authorizeEdit(id, editKey, env) {
  await ensureSchema(env);
  if (!editKey) return { ok: false, status: 401, error: "missing_edit_token" };

  const row = await env.DB.prepare(
    "SELECT edit_token, payload FROM stories WHERE id = ?"
  ).bind(id).first();

  if (!row) return { ok: false, status: 404, error: "not_found" };
  if (!row.edit_token) return { ok: false, status: 403, error: "not_editable" };

  const hash = await sha256(editKey);
  if (hash !== row.edit_token) {
    return { ok: false, status: 403, error: "invalid_edit_token" };
  }

  return { ok: true, row };
}

async function deleteStory(request, id, env) {
  const editKey = request.headers.get("x-edit-token") || "";
  const auth = await authorizeEdit(id, editKey, env);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  await env.DB.prepare("DELETE FROM stories WHERE id = ?").bind(id).run();
  return json({ ok: true, deleted: id });
}

async function regenerateStoryUrl(request, id, env) {
  const editKey = request.headers.get("x-edit-token") || "";
  const auth = await authorizeEdit(id, editKey, env);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  let newId = "";
  for (let i = 0; i < 6; i++) {
    const candidate = randomId(8);
    const exists = await env.DB.prepare("SELECT id FROM stories WHERE id = ?").bind(candidate).first();
    if (!exists) { newId = candidate; break; }
  }
  if (!newId) return json({ error: "id_generation_failed" }, 500);

  // Move the story to a new id. Old recipient URL stops working immediately.
  await env.DB.prepare(
    "UPDATE stories SET id = ? WHERE id = ?"
  ).bind(newId, id).run();

  return json({
    ok: true,
    oldId: id,
    id: newId,
    path: `/l/${newId}`,
    editPath: `/edit/${newId}#key=${editKey}`
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    try {
      if (url.pathname === "/api/health" && request.method === "GET") {
        return await health(env);
      }

      if (url.pathname === "/api/story" && request.method === "POST") {
        return await createStory(request, env);
      }

      const apiMatch = url.pathname.match(/^\/api\/story\/([A-Za-z0-9_-]{4,32})$/);
      if (apiMatch && request.method === "GET") {
        return await getStory(apiMatch[1], env);
      }
      if (apiMatch && request.method === "PUT") {
        return await updateStory(request, apiMatch[1], env);
      }

      if (apiMatch && request.method === "DELETE") {
        return await deleteStory(request, apiMatch[1], env);
      }

      const regenerateMatch = url.pathname.match(/^\/api\/story\/([A-Za-z0-9_-]{4,32})\/regenerate$/);
      if (regenerateMatch && request.method === "POST") {
        return await regenerateStoryUrl(request, regenerateMatch[1], env);
      }

      if (/^\/l\/[A-Za-z0-9_-]{4,32}\/?$/.test(url.pathname) ||
          /^\/edit\/[A-Za-z0-9_-]{4,32}\/?$/.test(url.pathname)) {
        // IMPORTANT:
        // Pass the ORIGINAL navigation request to the Assets binding.
        // With `not_found_handling: "single-page-application"` Cloudflare
        // serves index.html internally while the browser keeps /l/<id>.
        //
        // Do NOT fetch "/index.html" directly: Cloudflare canonical HTML
        // handling redirects /index.html -> /, which was exactly why
        // recipient links kept landing on the creator page.
        return env.ASSETS.fetch(request);
      }

      if (url.pathname.startsWith("/api/")) {
        return json({ error: "not_found" }, 404);
      }

      return env.ASSETS.fetch(request);
    } catch (err) {
      console.error(err);
      return json({ error: "server_error" }, 500);
    }
  }
};
