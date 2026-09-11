export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
  ASSETS: Fetcher;
  APP_NAME: string;
}

const json = (data: unknown, status = 200, extra: HeadersInit = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...extra },
  });

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET,POST,OPTIONS",
};

const clean = (v: unknown, max: number) =>
  String(v ?? "").replace(/\0/g, "").trim().slice(0, max);

const makeId = () => crypto.randomUUID().replaceAll("-", "").slice(0, 18);
const makeSecret = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
};

async function createLetter(req: Request, env: Env) {
  const body = await req.json<any>();
  const recipient = clean(body.recipient, 60);
  const opener = clean(body.opener, 80) || "Нажми на конверт";
  const title = clean(body.title, 120);
  const message = clean(body.message, 6000);
  const signature = clean(body.signature, 80);
  const theme = ["starry", "rose", "ocean", "golden"].includes(body.theme) ? body.theme : "starry";
  const unlockAt = Number(body.unlockAt || 0) || null;

  if (!recipient || !message) return json({ error: "recipient_and_message_required" }, 400, cors);
  if (unlockAt && unlockAt > Date.now() + 1000 * 60 * 60 * 24 * 365 * 5) {
    return json({ error: "unlock_too_far" }, 400, cors);
  }

  const id = makeId();
  const secret = makeSecret();
  const createdAt = Date.now();

  await env.DB.prepare(`
    INSERT INTO letters (id, secret, recipient, opener, title, message, signature, theme, unlock_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, secret, recipient, opener, title, message, signature, theme, unlockAt, createdAt).run();

  return json({ id, secret, sharePath: `/l/${secret}` }, 201, cors);
}

async function getLetter(secret: string, env: Env) {
  const row = await env.DB.prepare(`
    SELECT id, recipient, opener, title, message, signature, theme, portrait_key, unlock_at, created_at, opened_at
    FROM letters WHERE secret = ?
  `).bind(secret).first<any>();

  if (!row) return json({ error: "not_found" }, 404, cors);

  const now = Date.now();
  const locked = row.unlock_at && row.unlock_at > now;

  return json({
    id: row.id,
    recipient: row.recipient,
    opener: row.opener,
    title: locked ? "" : row.title,
    message: locked ? "" : row.message,
    signature: locked ? "" : row.signature,
    theme: row.theme,
    unlockAt: row.unlock_at,
    createdAt: row.created_at,
    openedAt: row.opened_at,
    locked,
    portraitUrl: row.portrait_key ? `/api/image/${encodeURIComponent(row.portrait_key)}` : null,
  }, 200, cors);
}

async function markOpened(secret: string, env: Env) {
  const row = await env.DB.prepare(`SELECT unlock_at, opened_at FROM letters WHERE secret = ?`)
    .bind(secret).first<any>();
  if (!row) return json({ error: "not_found" }, 404, cors);
  if (row.unlock_at && row.unlock_at > Date.now()) return json({ error: "locked" }, 423, cors);

  if (!row.opened_at) {
    await env.DB.prepare(`UPDATE letters SET opened_at = ? WHERE secret = ?`)
      .bind(Date.now(), secret).run();
  }
  return json({ ok: true }, 200, cors);
}

async function uploadPortrait(req: Request, secret: string, env: Env) {
  const row = await env.DB.prepare(`SELECT id FROM letters WHERE secret = ?`).bind(secret).first<any>();
  if (!row) return json({ error: "not_found" }, 404, cors);

  const type = req.headers.get("content-type") || "";
  if (!["image/png", "image/jpeg", "image/webp"].some(x => type.startsWith(x))) {
    return json({ error: "bad_image_type" }, 415, cors);
  }
  const bytes = await req.arrayBuffer();
  if (bytes.byteLength > 1_500_000) return json({ error: "image_too_large" }, 413, cors);

  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
  const key = `${row.id}.${ext}`;
  await env.IMAGES.put(key, bytes, { httpMetadata: { contentType: type } });
  await env.DB.prepare(`UPDATE letters SET portrait_key = ? WHERE secret = ?`).bind(key, secret).run();

  return json({ ok: true, portraitUrl: `/api/image/${key}` }, 200, cors);
}

async function getImage(key: string, env: Env) {
  const obj = await env.IMAGES.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    try {
      if (url.pathname === "/api/letters" && request.method === "POST") {
        return await createLetter(request, env);
      }

      const letterMatch = url.pathname.match(/^\/api\/letters\/([^/]+)$/);
      if (letterMatch && request.method === "GET") {
        return await getLetter(decodeURIComponent(letterMatch[1]), env);
      }

      const openMatch = url.pathname.match(/^\/api\/letters\/([^/]+)\/open$/);
      if (openMatch && request.method === "POST") {
        return await markOpened(decodeURIComponent(openMatch[1]), env);
      }

      const portraitMatch = url.pathname.match(/^\/api\/letters\/([^/]+)\/portrait$/);
      if (portraitMatch && request.method === "POST") {
        return await uploadPortrait(request, decodeURIComponent(portraitMatch[1]), env);
      }

      const imageMatch = url.pathname.match(/^\/api\/image\/(.+)$/);
      if (imageMatch && request.method === "GET") {
        return await getImage(decodeURIComponent(imageMatch[1]), env);
      }

      if (url.pathname.startsWith("/api/")) {
        return json({ error: "not_found" }, 404, cors);
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error(error);
      return json({ error: "server_error" }, 500, cors);
    }
  },
};
