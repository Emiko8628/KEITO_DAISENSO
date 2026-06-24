const ROOM_NAME = "keito-daisenso-live-audience";
const DEFAULT_TTL_SECONDS = 60;
const MAX_SESSION_ID_LENGTH = 128;

function ttlSeconds(env) {
  const value = Number(env && env.AUDIENCE_TTL_SECONDS);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_TTL_SECONDS;
  return Math.min(300, Math.max(10, Math.floor(value)));
}

function nowMs(env) {
  return typeof env?.__now === "function" ? env.__now() : Date.now();
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {})
    }
  });
}

function allowedOrigins(env) {
  return String(env?.ALLOWED_ORIGINS || "https://emiko8628.github.io")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function corsHeaders(origin, env) {
  if (!origin || !allowedOrigins(env).includes(origin)) return null;
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, GET, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "Origin"
  };
}

function withCors(response, origin, env) {
  const headers = corsHeaders(origin, env);
  if (!headers) return response;
  const nextHeaders = new Headers(response.headers);
  Object.entries(headers).forEach(([key, value]) => nextHeaders.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: nextHeaders
  });
}

function isValidSessionId(sessionId) {
  return typeof sessionId === "string" &&
    sessionId.length >= 8 &&
    sessionId.length <= MAX_SESSION_ID_LENGTH &&
    /^[A-Za-z0-9._:-]+$/.test(sessionId);
}

export class LiveAudienceRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
  }

  async fetch(request) {
    if (request.method !== "POST") {
      return json({ error: "method_not_allowed" }, { status: 405 });
    }

    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return json({ error: "invalid_json" }, { status: 400 });
    }

    if (!isValidSessionId(payload?.sessionId)) {
      return json({ error: "invalid_session" }, { status: 400 });
    }

    const ttl = ttlSeconds(this.env);
    const now = nowMs(this.env);
    this.prune(now, ttl);
    this.sessions.set(payload.sessionId, now);
    this.prune(now, ttl);

    return json({
      count: this.sessions.size,
      ttlSeconds: ttl
    });
  }

  prune(now, ttl) {
    const staleBefore = now - ttl * 1000;
    for (const [sessionId, lastSeen] of this.sessions.entries()) {
      if (lastSeen < staleBefore) this.sessions.delete(sessionId);
    }
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin") || "";
    const headers = corsHeaders(origin, env);

    if (request.method === "OPTIONS") {
      if (!headers) return json({ error: "origin_not_allowed" }, { status: 403 });
      return new Response(null, { status: 204, headers });
    }

    if (!headers) {
      return json({ error: "origin_not_allowed" }, { status: 403 });
    }

    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return withCors(json({ ok: true }), origin, env);
    }

    if (request.method === "POST" && url.pathname === "/heartbeat") {
      const id = env.LIVE_AUDIENCE_ROOM.idFromName(ROOM_NAME);
      const room = env.LIVE_AUDIENCE_ROOM.get(id);
      const response = await room.fetch(request);
      return withCors(response, origin, env);
    }

    return withCors(json({ error: "not_found" }, { status: 404 }), origin, env);
  }
};
