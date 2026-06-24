const assert = require("assert");

async function main() {
  const workerModule = await import("../workers/live-audience.mjs");
  const { LiveAudienceRoom, default: worker } = workerModule;

  class FakeObjectNamespace {
    constructor(room) {
      this.room = room;
    }

    idFromName(name) {
      assert.strictEqual(name, "keito-daisenso-live-audience");
      return name;
    }

    get() {
      return {
        fetch: (request) => this.room.fetch(request)
      };
    }
  }

  let now = 100000;
  const roomEnv = {
    AUDIENCE_TTL_SECONDS: "60",
    __now: () => now
  };
  const room = new LiveAudienceRoom({}, roomEnv);
  const env = {
    ALLOWED_ORIGINS: "https://emiko8628.github.io,http://127.0.0.1:8765",
    AUDIENCE_TTL_SECONDS: "60",
    LIVE_AUDIENCE_ROOM: new FakeObjectNamespace(room),
    __now: () => now
  };

  function heartbeat(sessionId, origin = "https://emiko8628.github.io") {
    return worker.fetch(new Request("https://live.example/heartbeat", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin
      },
      body: JSON.stringify({ sessionId })
    }), env);
  }

  const first = await heartbeat("session-a");
  assert.strictEqual(first.status, 200);
  assert.strictEqual(first.headers.get("access-control-allow-origin"), "https://emiko8628.github.io");
  assert.deepStrictEqual(await first.json(), { count: 1, ttlSeconds: 60 });

  const second = await heartbeat("session-b");
  assert.strictEqual(second.status, 200);
  assert.deepStrictEqual(await second.json(), { count: 2, ttlSeconds: 60 });

  now += 61000;
  const third = await heartbeat("session-c");
  assert.strictEqual(third.status, 200);
  assert.deepStrictEqual(await third.json(), { count: 1, ttlSeconds: 60 });

  const invalidPayload = await worker.fetch(new Request("https://live.example/heartbeat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://emiko8628.github.io"
    },
    body: JSON.stringify({ sessionId: "" })
  }), env);
  assert.strictEqual(invalidPayload.status, 400);
  assert.deepStrictEqual(await invalidPayload.json(), { error: "invalid_session" });

  const blockedOrigin = await heartbeat("session-d", "https://example.com");
  assert.strictEqual(blockedOrigin.status, 403);
  assert.deepStrictEqual(await blockedOrigin.json(), { error: "origin_not_allowed" });

  const preflight = await worker.fetch(new Request("https://live.example/heartbeat", {
    method: "OPTIONS",
    headers: {
      origin: "https://emiko8628.github.io",
      "access-control-request-method": "POST"
    }
  }), env);
  assert.strictEqual(preflight.status, 204);
  assert.strictEqual(preflight.headers.get("access-control-allow-origin"), "https://emiko8628.github.io");
  assert.match(preflight.headers.get("access-control-allow-methods"), /POST/);

  const health = await worker.fetch(new Request("https://live.example/health", {
    method: "GET",
    headers: {
      origin: "https://emiko8628.github.io"
    }
  }), env);
  assert.strictEqual(health.status, 200);
  assert.deepStrictEqual(await health.json(), { ok: true });

  console.log("live audience worker verification passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
