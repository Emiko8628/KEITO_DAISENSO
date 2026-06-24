# Cloudflare Live Audience Design

## Goal

Replace the local audience presentation count with a real, anonymous current-player count for KEITO大戦争.

## Responsibility Boundary

- `game.html` owns the HUD display and browser heartbeat client.
- `workers/live-audience.mjs` owns current-session counting.
- Google Analytics remains limited to `game_open`, `first_summon`, and `stage_clear`.
- The live audience feature must not use GA4 readback, cookies, localStorage, sessionStorage, IP storage, user profile data, or gameplay state upload.

## Data Contract

The browser sends a heartbeat to the Worker endpoint:

```json
{ "sessionId": "page-scoped-random-id" }
```

The Worker returns:

```json
{ "count": 1, "ttlSeconds": 60 }
```

`sessionId` is created in memory with `crypto.randomUUID()` when available, or a random in-memory fallback. It is not persisted across reloads.

## Worker Design

Use one Durable Object named `keito-daisenso-live-audience` as the coordination point.

- `POST /heartbeat` validates JSON and `sessionId`.
- The Durable Object keeps an in-memory `Map<sessionId, lastSeenMs>`.
- Entries older than `ttlSeconds` are removed before returning a count.
- CORS allows only configured origins.
- `OPTIONS` supports preflight.
- `GET /health` returns a minimal health response.

The Durable Object deliberately avoids persistent storage. If Cloudflare evicts the object, the count may reset briefly, which is acceptable for a live presence display.

## Browser Design

`LIVE_AUDIENCE_CONFIG` controls the feature:

- `enabled`
- `endpoint`
- `heartbeatMs`
- `staleAfterMs`

When enabled and configured, `initializeLiveAudience()` sends one immediate heartbeat, then repeats every `heartbeatMs`. On success, `#viewerCount` shows the real count. On failure or missing endpoint, it shows `--` and the game continues.

The old `estimateRealtimeAudience()` local presentation estimator is removed so the label cannot be confused with real traffic.

## User-Facing Copy

Footer:

`非公式ファン制作｜Google Analyticsで利用状況を計測し、現在の参戦人数表示のため匿名の一時信号を送信します。個人情報やゲーム内入力内容は保存しません。`

README:

`現在の参戦人数を表示するため、Cloudflare Workerへ匿名の一時セッション信号を送信します。Cookie、localStorage、sessionStorage、IP保存は使いません。`

## Safety Gates

- External URLs in `game.html` are limited to the Google tag URL and the configured Cloudflare Worker heartbeat URL.
- The Worker does not inspect or store IP addresses, user agents, referrers, or gameplay state.
- Browser code does not use localStorage, sessionStorage, cookies, or sendBeacon.
- Tests verify CORS, heartbeat counting, stale-session expiry, invalid payload rejection, browser fallback, and analytics event boundaries.
