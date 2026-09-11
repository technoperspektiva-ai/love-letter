const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type"
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

async function createStory(request, env) {
  const body = await request.json();
  const payload = body?.payload;
  if (!payload || typeof payload !== "object") {
    return json({ error: "invalid_payload" }, 400);
  }

  const raw = JSON.stringify(payload);
  // Enough for compressed photo + text while keeping free-tier usage reasonable.
  if (raw.length > 400000) {
    return json({ error: "payload_too_large", message: "Фото слишком большое. Выбери другое фото или убери его." }, 413);
  }

  let id = "";
  for (let i = 0; i < 5; i++) {
    const candidate = randomId(8);
    const exists = await env.DB.prepare("SELECT id FROM stories WHERE id = ?").bind(candidate).first();
    if (!exists) { id = candidate; break; }
  }
  if (!id) return json({ error: "id_generation_failed" }, 500);

  await env.DB.prepare(
    "INSERT INTO stories (id, payload, created_at) VALUES (?, ?, ?)"
  ).bind(id, raw, Date.now()).run();

  return json({ ok: true, id, path: `/l/${id}` }, 201);
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

      const m = url.pathname.match(/^\/api\/story\/([A-Za-z0-9_-]{4,32})$/);
      if (m && request.method === "GET") {
        return await getStory(m[1], env);
      }

      // /l/<id> serves the same SPA entrypoint; JS fetches the payload.
      if (/^\/l\/[A-Za-z0-9_-]{4,32}$/.test(url.pathname)) {
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
