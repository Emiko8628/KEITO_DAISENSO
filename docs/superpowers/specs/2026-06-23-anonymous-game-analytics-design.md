# Anonymous Game Analytics Design

## Goal

Add a safe way to understand how many people experience KEITO大戦争 without collecting names, contact details, child information, gameplay input text, or persistent user identifiers.

The first useful metric is not just page views. The game should count:

- `game_open`: the game page loaded
- `first_summon`: a player summoned a unit for the first time in that page session
- `stage_clear`: a player destroyed the enemy base and cleared the stage

`first_summon` is the best first definition of "someone experienced the game" because it means the player interacted with the game, not only opened the page.

## Current State

The current public contract says the game has no external communication:

- `game.html` footer says the page runs without external communication or storage.
- `README.md` says the project is safe static HTML with no external communication.
- Current verification scans for `fetch`, `XMLHttpRequest`, storage APIs, external scripts, and HTTP URLs.

Because analytics requires external communication, adding live analytics changes the safety contract. The implementation must update the user-facing wording before any external tracking request is enabled.

## Recommended Approach

Use a privacy-first analytics provider with custom events. The first implementation should target Plausible-style events because the game only needs three anonymous counters and no player profiles.

Recommended provider order:

1. Plausible-compatible adapter
2. Umami-compatible adapter
3. Page-view-only provider such as Cloudflare Web Analytics

Plausible/Umami are better fits than page-view-only analytics because the game needs gameplay events like `first_summon` and `stage_clear`.

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

If a provider automatically processes IP address or user agent at the edge, that must be disclosed in the README and footer copy as provider-side anonymous analytics, not game-side personal data collection.

## Architecture

Add one small telemetry boundary inside `game.html`.

Responsibilities:

- `ANALYTICS_CONFIG`: controls whether analytics is enabled and which adapter is used.
- `trackGameEvent(eventName, props)`: single public game-code entrypoint for analytics.
- `trackPlausibleEvent(eventName, props)`: provider-specific adapter.
- `trackNoopEvent(eventName, props)`: safe disabled mode.
- `state.analytics`: page-session state that prevents duplicate `first_summon` and duplicate `game_open`.

The game loop, battle logic, rendering, unit logic, and stage logic must not call provider APIs directly. They may only call `trackGameEvent`.

## Data Flow

1. On `resetGame`, initialize analytics session flags.
2. On first page start after `resetGame`, send `game_open` once if analytics is enabled.
3. On the first successful `spawnUnit`, send `first_summon` once per page session.
4. On the first win result in `checkResult`, send `stage_clear` once per page session.
5. If analytics is disabled or unavailable, do nothing and keep the game playable.

## User-Facing Copy

When analytics is disabled:

`非公式ファン制作｜このページは外部通信・保存処理なしで動きます。`

When analytics is enabled:

`非公式ファン制作｜匿名の利用状況だけを取得しています。個人情報や入力内容は保存しません。`

The README must also change from "外部通信なし" to a precise statement:

`ゲーム本体は静的HTMLです。匿名の利用状況計測を有効にする場合のみ、設定した解析サービスへ game_open / first_summon / stage_clear を送信します。`

## Implementation Gate

Do not enable live analytics until all of these are true:

- The provider is chosen.
- The provider site/domain id is known.
- The footer and README copy are updated in the same PR.
- Tests prove analytics is disabled by default unless configured.
- Tests prove only approved event names are sent.
- The external communication scan is updated to allow exactly the chosen analytics endpoint or script.

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
