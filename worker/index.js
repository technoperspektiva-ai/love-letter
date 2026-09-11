const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,OPTIONS",
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

async function createStory(request, env) {
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    try {
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

      if (/^\/l\/[A-Za-z0-9_-]{4,32}$/.test(url.pathname) ||
          /^\/edit\/[A-Za-z0-9_-]{4,32}$/.test(url.pathname)) {
        const assetUrl = new URL("/index.html", url.origin);
        return env.ASSETS.fetch(new Request(assetUrl, request));
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
