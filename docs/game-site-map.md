# KEITO_DAISENSO Game Site Map

This map is the responsibility-level guide for the current KEITO_DAISENSO site. It is not a search-engine `sitemap.xml`; it is the human-facing map we use before choosing the next game improvement.

## Current Site Map

| Surface | File | Public role | Current behavior |
| --- | --- | --- | --- |
| Entry page | `index.html` | GitHub Pages entrypoint | Shows a small fallback page and immediately redirects to `game.html`. |
| Game page | `game.html` | Primary playable experience | Runs the one-screen mini tower-defense game. |
| Repository overview | `README.md` | Development and gameplay explanation | Describes controls, stage rules, characters, privacy-sensitive behavior, and current implementation notes. |
| Live audience Worker | `workers/live-audience.mjs` | Real-access audience counter backend | Receives anonymous heartbeat signals and returns the current active count. |
| Worker config | `wrangler.toml` | Cloudflare deployment config | Defines Durable Object binding, allowed origins, and TTL for audience counting. |

## Game Responsibility Map

| Responsibility | Current owner | Notes |
| --- | --- | --- |
| Stage data | `STAGES` in `game.html` | One playable stage exists. Stage 2 and 3 base images are already prepared as local assets, but stage data is not expanded yet. |
| Ally unit data | `UNIT_TYPES` in `game.html` | Three summon buttons: `まるねこ 50`, `かたいねこ 80`, `こうげきねこ 110`. |
| Enemy unit data | `ENEMY_TYPES` and stage spawn table in `game.html` | First stage keeps the approved easy-readable enemy mix: frequent low-HP enemy, slower sturdy enemy, occasional variety enemy. |
| Battle state | `state` in `game.html` | Money, base HP, EXP, defeats, units, enemies, effects, cooldowns, and result state are in memory only. |
| Win condition | `checkResult()` in `game.html` | Destroying the left enemy base clears the stage. EXP reaching 100 is only a progress notice, not a clear condition. |
| Display rendering | Canvas drawing functions in `game.html` | Castle HP appears as `current / max` above bases. Character HP bars and battle floating numbers are intentionally hidden. |
| Summon controls | `.summon-deck` buttons in `game.html` | Buttons show unit name and cost, with cooldown progress in the button bar. |
| Analytics | `ANALYTICS_CONFIG` and tracking helpers in `game.html` | Google Analytics sends only allowed game events and safe string properties. |
| Live audience | `LIVE_AUDIENCE_CONFIG` in `game.html` plus Worker | Sends only an anonymous page-scoped temporary session signal to the Worker. |
| Visual assets | `assets/` | Character, base, and background images are local files. Canvas fallback rendering remains for brittle image loading paths. |

## Public Communication And Safety Map

| Channel | Current status | Safety rule |
| --- | --- | --- |
| GitHub Pages | Active | Public URL remains `https://emiko8628.github.io/KEITO_DAISENSO/game.html` unless explicitly approved. |
| Google Analytics | Active | Keep event names and properties allowlisted. Do not send names, emails, input text, or personal data. |
| Cloudflare Worker | Active for live audience | Keep heartbeat payload limited to the anonymous session ID. Do not add cookies, localStorage, sessionStorage, IP storage, or user profiles. |
| VPS | Not used | This project currently reflects through GitHub Pages, not VPS deployment. |
| Secrets | Not stored in repo | API tokens and credentials stay out of chat, docs, source files, and committed config. |

## Verification Map

| Gate | Command | Protects |
| --- | --- | --- |
| Game contract | `node scripts/verify-game-contract.js` | Stage readability, character setup, local assets, analytics allowlist, live audience config, and display contracts. |
| Runtime behavior | `node scripts/verify-game-runtime.js` | Startup, summon flow, analytics behavior, audience heartbeat, EXP notice, victory, and failure-safe runtime behavior. |
| Worker behavior | `node scripts/verify-live-audience-worker.js` | CORS, health, heartbeat payload, active count, and Durable Object behavior. |
| Site map drift | `node scripts/verify-game-site-map.js` | This document, README link, required sections, and referenced file existence. |
| Whitespace | `git diff --check` | Accidental whitespace errors before commit. |

## Next Improvement Queue

1. **Stage map and stage selection design**
   - Add a visible path from the current first stage toward future stages.
   - Keep the first stage short, readable, and safe for quick play.
   - Design spec: [Stage Map And Selection Design](superpowers/specs/2026-06-29-stage-map-selection-design.md)

2. **Game data extraction**
   - Move stage, unit, enemy, and asset definitions out of the large inline script only when a concrete next feature needs it.
   - Keep `game.html` working directly from GitHub Pages.

3. **Player-facing top page**
   - Consider turning `index.html` from immediate redirect into a small start screen with `ゲームを始める`, `このゲームについて`, and privacy notes.
   - Do this only after the game map is stable enough that the top page will not become marketing noise.

4. **Search-engine sitemap**
   - Add `sitemap.xml` only after there are multiple stable public pages worth indexing.
   - Current priority is lower because `game.html` is still the primary public surface.

5. **Regression screenshots**
   - Add an automated screenshot workflow if visual changes become frequent.
   - For now, local Chrome screenshots remain the manual visual gate for UI changes.

## Change Boundaries

- Safe to change in documentation-only tasks: `README.md`, files under `docs/`, and map verification scripts.
- Safe to change in game-display tasks: `game.html` plus focused verification scripts.
- Requires explicit approval: public URL changes, new external providers, new Cloudflare Worker behavior, credential handling, storage of user data, or any VPS deployment path.
- Avoid for now: splitting the game into many files without a feature need, adding a broad landing page, adding a search-engine sitemap before multiple pages exist, or expanding analytics payloads.
