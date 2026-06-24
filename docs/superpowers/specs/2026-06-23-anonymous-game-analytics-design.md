# Anonymous Game Analytics Design

## Goal

Add a safe way to understand how many people experience KEITO大戦争 without collecting names, contact details, child information, gameplay input text, or persistent user identifiers.

The first useful metric is not just page views. The game should count:

- `game_open`: the game page loaded
- `first_summon`: a player summoned a unit for the first time in that page session
- `stage_clear`: a player destroyed the enemy base and cleared the stage

`first_summon` is the best first definition of "someone experienced the game" because it means the player interacted with the game, not only opened the page.

## Current State

The live provider is Google Analytics 4:

- provider: Google Analytics 4
- measurement id: `G-930NR1L6KX`
- script URL: `https://www.googletagmanager.com/gtag/js?id=G-930NR1L6KX`
- automatic `page_view`: disabled with `send_page_view: false`
- sent events: `game_open`, `first_summon`, and `stage_clear`

The public contract now discloses Google Analytics usage in the footer and README. The game still must not add any unrelated external communication, storage identifiers, cookies, or free-form player data.

## Recommended Approach

Keep the Google Analytics integration behind the existing adapter boundary and keep the measured surface intentionally small.

Provider rules:

- Do not add Google Tag Manager.
- Do not enable enhanced measurement unless a later privacy review explicitly changes this design.
- Do not add automatic page views from the game code.
- Do not add new custom events without updating the allowlist, README, and verification scripts.
- Do not read Google Analytics data back into the game. Any real in-game audience display must use a separately reviewed anonymous aggregation service.

## Privacy Contract

The game must not collect or send:

- player name
- email address
- social account
- precise location
- child age or profile
- free-text input
- IP address from game code
- localStorage or sessionStorage identifiers
- cookies created by game code
- raw game state, unit positions, HP, or detailed behavior replay

The game may send only:

- event name: `game_open`, `first_summon`, or `stage_clear`
- stage id: `earth-wanwan-01`
- chapter: `大地編`
- stage name: `大地をゆるがすワンワンステージ`

Optional event properties must also stay on an allowlist. The first implementation may include `unitKind` and `unitLabel` only for `first_summon`. It must not send money, HP, unit coordinates, enemy counts, timestamps, user agent, referrer, or free-form strings from the page.

If a provider automatically processes IP address or user agent at the edge, that must be disclosed in the README and footer copy as provider-side anonymous analytics, not game-side personal data collection.

## Architecture

Add one small telemetry boundary inside `game.html`.

Responsibilities:

- `ANALYTICS_CONFIG`: controls whether analytics is enabled and which adapter is used.
- `trackGameEvent(eventName, props)`: single public game-code entrypoint for analytics.
- `trackGoogleAnalyticsEvent(eventName, props)`: provider-specific adapter.
- `trackNoopEvent(eventName, props)`: safe disabled mode.
- `analyticsSession`: page-session state outside `resetGame` that prevents duplicate `game_open`, duplicate `first_summon`, and duplicate `stage_clear` when the player presses restart.

The game loop, battle logic, rendering, unit logic, and stage logic must not call provider APIs directly. They may only call `trackGameEvent`.

## Data Flow

1. On page load, initialize `analyticsSession` once for the browser tab.
2. On first game start after page load, send `game_open` once if analytics is enabled.
3. On the first successful `spawnUnit`, send `first_summon` once per page session.
4. On the first win result in `checkResult`, send `stage_clear` once per page session.
5. Pressing restart must not reset `analyticsSession`; otherwise one visitor can inflate `game_open` or `first_summon`.
6. If analytics is disabled, blocked, or unavailable, do nothing and keep the game playable.

## User-Facing Copy

When analytics is disabled:

`非公式ファン制作｜このページは外部通信・保存処理なしで動きます。`

When analytics is enabled:

`非公式ファン制作｜Google Analyticsで利用状況を計測しています。ゲーム内の入力内容や個人情報は保存しません。`

The README must also change from "外部通信なし" to a precise statement:

`Google Analyticsを有効にする場合のみ、game_open / first_summon / stage_clear を送信します。`

## Implementation Gate

Do not expand live analytics until all of these are true:

- The provider, measurement id, script URL, and domain are reviewed again.
- Google Analytics enhanced measurement remains off, or a later privacy review explicitly updates this design.
- The footer and README copy are updated in the same PR.
- Tests prove only approved event names and allowlisted props are sent.
- Tests prove restart does not duplicate page-session events.
- Tests prove provider failure or script blocking never stops gameplay.
- The external communication scan is updated to allow exactly the chosen analytics endpoint or script.
- If external scripts are introduced, the exact script URL and CSP implications are reviewed in the PR.

If the provider is not configured, merge only the design/adapter scaffolding in disabled mode, or wait.

## Testing Strategy

Contract tests:

- Analytics config exists.
- Analytics is disabled by default.
- All event names are centralized.
- Runtime copy changes when analytics is enabled.
- No storage APIs are introduced.

Runtime tests:

- `game_open` is sent once when enabled.
- `first_summon` is sent once after the first successful summon.
- restart does not send another `game_open`.
- repeated summons do not duplicate `first_summon`.
- `stage_clear` is sent once after enemy base destruction.
- analytics failure never blocks gameplay.

Manual browser checks:

- game loads with no console errors
- first unit summon still works
- stage clear still works
- footer copy matches analytics enabled or disabled mode

## Risks

The main risk is accidentally changing the privacy promise without updating the UI and README. The second risk is sending too much game state. The third risk is making the game depend on a third-party script and breaking play when that script is blocked.

The safe design is to make analytics optional, adapter-based, and fail-closed to no-op.

## Decision

The next implementation should add the analytics boundary and tests first, with live sending disabled until the provider account/config is ready. After that, a small follow-up PR can enable the selected provider and update the public copy in the same change.
