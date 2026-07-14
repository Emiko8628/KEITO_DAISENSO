# KEITO_DAISENSO Game Site Map

This map is the responsibility-level guide for the current KEITO_DAISENSO site. It is not a search-engine `sitemap.xml`; it is the human-facing map we use before choosing the next game improvement.

## Current Site Map

| Surface | File | Public role | Current behavior |
| --- | --- | --- | --- |
| Entry page | `index.html` | GitHub Pages entrypoint | Shows a small fallback page and immediately redirects to `game.html`. |
| Game page | `game.html` | Primary playable experience | Shows the stage map first, then runs Stage 1 or Stage 2 as playable mini tower-defense stages. |
| Repository overview | `README.md` | Development and gameplay explanation | Describes controls, stage rules, characters, privacy-sensitive behavior, and current implementation notes. |
| Live audience Worker | `workers/live-audience.mjs` | Real-access audience counter backend | Receives anonymous heartbeat signals and returns the current active count. |
| Worker config | `wrangler.toml` | Cloudflare deployment config | Defines Durable Object binding, allowed origins, and TTL for audience counting. |

## Game Responsibility Map

| Responsibility | Current owner | Notes |
| --- | --- | --- |
| Stage data | `STAGES` in `game.html` | Stage 1 and Stage 2 are playable. Stage 3〜4 base images are prepared as local locked-preview assets, but battle data is not expanded yet. |
| Stage map | `STAGE_MAP` in `game.html` | Shows Stage 1 and Stage 2 as playable, and Stage 3〜4 as locked previews. Design basis: [Stage Map And Selection Design](superpowers/specs/2026-06-29-stage-map-selection-design.md). |
| Ally unit data | `UNIT_TYPES` in `game.html` | Four current summon buttons: `まるねこ 50`, `かたいねこ 80`, `こうげきねこ 110`, `あしながうみネコ 140`. The deck is prepared as a 5-column, 2-row team area for a future 10-ally roster. |
| Enemy unit data | `ENEMY_TYPES` and stage spawn table in `game.html` | Stage 1 keeps the approved easy-readable enemy mix with slightly stronger enemy stats. Stage 2 uses three named beach enemy variants with dedicated local sprites and stronger stats. |
| Battle state | `state` in `game.html` | Money, base HP, EXP, defeats, units, enemies, effects, cooldowns, and result state are in memory only. |
| Win condition | `checkResult()` in `game.html` | Destroying the left enemy base clears the selected stage. EXP reaching the stage target is only a progress notice, not a clear condition. |
| Display rendering | Canvas drawing functions in `game.html` | Castle HP appears as `current / max` above bases. Character HP bars, battle floating numbers, and ordinary hit shockwave effects are intentionally hidden. |
| Summon controls | `.battle-controls`, `.summon-deck`, and `.command-row` in `game.html` | The summon deck shows ally unit image, unit name, cost, and cooldown progress. Restart is kept in a separate command row so the ally deck can expand toward 10 team slots. |
| Analytics | `ANALYTICS_CONFIG` and tracking helpers in `game.html` | Google Analytics sends only allowed game events and safe string properties. |
| Live audience | `LIVE_AUDIENCE_CONFIG` in `game.html` plus Worker | Sends only an anonymous page-scoped temporary session signal to the Worker. |
| Visual assets | `GAME_ASSETS` in `game.html` plus `assets/` | Character, base, and background paths are centralized before use. Canvas fallback rendering remains for brittle image loading paths. |

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

1. **Stage 3 playable prep**
   - Prepare the boundary for making `森編 / もりもり迷いのこみち` playable without changing Stage 4 yet.
   - Keep Stage 4 `ふわふわおばけの夜道` locked.
   - Keep existing GA event names, Cloudflare Worker behavior, public URL, and storage-free privacy boundary.

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
