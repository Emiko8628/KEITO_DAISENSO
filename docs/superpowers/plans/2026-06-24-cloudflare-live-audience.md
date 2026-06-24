# Cloudflare Live Audience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real anonymous current-player count using a Cloudflare Worker while keeping gameplay, analytics, and privacy boundaries separate.

**Architecture:** A Cloudflare Worker routes `POST /heartbeat` to one Durable Object that keeps an in-memory session map with a 60-second TTL. The static game page sends a page-scoped heartbeat, displays the returned count, and falls back to `--` if the Worker is unavailable.

**Tech Stack:** Static HTML, inline JavaScript, Cloudflare Worker module syntax, Durable Objects, Node verification scripts.

---

## File Structure

- Modify: `game.html`
  - Replace the local `estimateRealtimeAudience()` display with a real heartbeat client behind `LIVE_AUDIENCE_CONFIG`.
  - Keep the game playable if the live audience endpoint fails.
- Create: `workers/live-audience.mjs`
  - Export a Worker default handler and `LiveAudienceRoom` Durable Object class.
  - Implement strict CORS, payload validation, heartbeat counting, and stale cleanup.
- Create: `scripts/verify-live-audience-worker.js`
  - Unit-test Worker routing and Durable Object behavior with local fakes.
- Modify: `scripts/verify-game-contract.js`
  - Enforce the live audience config, Worker file, public copy, and external URL allowlist.
- Modify: `scripts/verify-game-runtime.js`
  - Verify game-side heartbeat success/failure behavior with fake `fetch`.
- Modify: `README.md`
  - Replace the old local-presentation wording with real anonymous heartbeat disclosure.
- Create: `wrangler.toml`
  - Document the Worker name and Durable Object binding for deployment.

## Task 1: Worker Contract Tests

- [ ] Add `scripts/verify-live-audience-worker.js` with local fake Durable Object state and requests.
- [ ] Verify it fails because `workers/live-audience.mjs` does not exist.
- [ ] Implement `workers/live-audience.mjs`.
- [ ] Verify Worker tests pass.

## Task 2: Browser Contract Tests

- [ ] Update contract/runtime tests to require `LIVE_AUDIENCE_CONFIG`, `initializeLiveAudience`, `trackLiveAudienceHeartbeat`, and no `estimateRealtimeAudience`.
- [ ] Verify they fail against the current local estimator.
- [ ] Replace the local estimator with the heartbeat client.
- [ ] Verify contract/runtime tests pass.

## Task 3: Docs and Deployment Config

- [ ] Update README and footer copy for the anonymous temporary signal.
- [ ] Add `wrangler.toml` with Durable Object binding.
- [ ] Verify safety scans show only the Google tag URL and the approved Worker URL in `game.html`.

## Task 4: Verification and Release

- [ ] Run `node scripts/verify-live-audience-worker.js`.
- [ ] Run `node scripts/verify-game-contract.js`.
- [ ] Run `node scripts/verify-game-runtime.js`.
- [ ] Run `git diff --check`.
- [ ] Run a safety scan for `fetch`, storage, cookies, sendBeacon, and external URLs.
- [ ] If Wrangler authentication is available, deploy the Worker and enable the endpoint in `game.html`.
- [ ] If deployment is blocked by missing Cloudflare authentication, keep the game fallback-safe and report the exact deploy command needed.
