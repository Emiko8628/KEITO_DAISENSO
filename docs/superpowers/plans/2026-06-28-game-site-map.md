# Game Site Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a responsibility-level site map for KEITO_DAISENSO so future improvements can be chosen without confusing game, site, analytics, audience, and asset boundaries.

**Architecture:** Add one human-readable design map under `docs/` and one small Node verifier under `scripts/`. Link the map from `README.md` so the repository entrypoint points to the current game/site structure.

**Tech Stack:** Markdown documentation, Node.js verification script, existing static HTML/Canvas game, GitHub Pages.

---

### Task 1: Add The Game Site Map

**Files:**
- Create: `docs/game-site-map.md`
- Modify: `README.md`

- [x] **Step 1: Create `docs/game-site-map.md`**

Document the current site surfaces, game responsibilities, external communication boundaries, local asset ownership, safety gates, and next improvement queue.

- [x] **Step 2: Link the map from `README.md`**

Add a short "設計マップ" section that points to `docs/game-site-map.md`.

### Task 2: Add Drift Verification

**Files:**
- Create: `scripts/verify-game-site-map.js`

- [x] **Step 1: Add a Node verifier**

Verify that the site map exists, has the required sections, links from README, references existing files, and does not contain placeholder text.

- [x] **Step 2: Run the verifier**

Run:

```sh
node scripts/verify-game-site-map.js
```

Expected: `game site map verification passed`

### Task 3: Cross-Check Existing Game Gates

**Files:**
- Existing verification scripts only

- [x] **Step 1: Run local verification**

Run:

```sh
node scripts/verify-game-site-map.js
node scripts/verify-game-contract.js
node scripts/verify-game-runtime.js
node scripts/verify-live-audience-worker.js
git diff --check
```

Expected: all commands pass. This is a documentation-only change; no game behavior, GA, Cloudflare Worker, public URL, credential, or VPS surface should change.
