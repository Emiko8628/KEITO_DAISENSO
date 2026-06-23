# Analytics Provider Enablement Handoff

Date: 2026-06-24

## Goal

Next thread goal: enable the anonymous game analytics provider for KEITO大戦争 only after the provider, target domain, script URL, and dashboard goals are confirmed.

This is the follow-up to the disabled analytics boundary work. The next PR should turn live analytics on and update public copy in the same change.

## Current State

Merged work:

- PR #16: designed anonymous game analytics.
- PR #17: hardened the analytics design with provider setup, dashboard goals, restart dedupe, failure handling, and allowlist gates.
- PR #18: implemented the disabled analytics boundary in `game.html`.

Current runtime behavior:

- `ANALYTICS_CONFIG.enabled` is `false`.
- `ANALYTICS_CONFIG.provider` is `"noop"`.
- The public footer still says: `非公式ファン制作｜このページは外部通信・保存処理なしで動きます。`
- `README.md` still says the game is a safe static HTML page with no external communication.
- Therefore the live game still has no analytics external communication enabled.

Implemented analytics boundary:

- `game_open`: page/game start event.
- `first_summon`: first successful unit summon in the page session.
- `stage_clear`: enemy base destroyed and stage cleared.
- `analyticsSession`: page-session dedupe state outside `resetGame`.
- `trackGameEvent`: the only game-code analytics entrypoint.
- `trackPlausibleEvent`: provider-specific adapter.
- `trackNoopEvent`: disabled/fallback adapter.

Implemented safety tests:

- Analytics is disabled by default.
- `provider: "noop"` is the default.
- `analyticsSession` is outside reset state.
- Restart does not duplicate `game_open`.
- Repeated summons do not duplicate `first_summon`.
- Repeated win checks do not duplicate `stage_clear`.
- Unknown events are ignored.
- Non-allowlisted props are dropped.
- Provider failure does not block summoning or gameplay.
- No storage identifiers are introduced.

## Files To Read First

Read these before editing:

1. `docs/superpowers/specs/2026-06-23-anonymous-game-analytics-design.md`
2. `docs/superpowers/plans/2026-06-23-anonymous-game-analytics.md`
3. `game.html`
4. `scripts/verify-game-contract.js`
5. `scripts/verify-game-runtime.js`
6. `README.md`

## Values To Confirm Before Enabling

Do not guess these values.

Required:

- provider: likely `plausible`, but confirm.
- site domain: likely `emiko8628.github.io/KEITO_DAISENSO` unless a custom domain is chosen.
- script URL: provider-approved script URL.
- dashboard goals/events:
  - `game_open`
  - `first_summon`
  - `stage_clear`

For Plausible, matching custom event goals must be created before expecting conversion/event counts to appear in the dashboard.

## Required Same-PR Changes

When analytics is enabled, these must land in the same PR:

1. Update `ANALYTICS_CONFIG` in `game.html`.
2. Add exactly one provider-approved script or tiny guarded loader if the provider requires it.
3. Keep all game logic calling only `trackGameEvent`, `trackFirstSummon`, or `trackStageClear`.
4. Update the footer copy in `game.html`.
5. Update the safety wording in `README.md`.
6. Update `scripts/verify-game-contract.js` so the external communication scan allows only the selected analytics script/endpoint.
7. Keep runtime tests proving gameplay continues if the provider is blocked or throws.

Recommended enabled footer copy:

```html
<p class="note">非公式ファン制作｜匿名の利用状況だけを取得しています。ゲーム内の入力内容や個人情報は保存しません。</p>
```

Recommended README safety wording:

```md
- 静的HTMLで動作します
- 匿名の利用状況計測を有効にする場合のみ、設定した解析サービスへ game_open / first_summon / stage_clear を送信します
- ゲーム内の名前、メール、入力内容、保存データは扱いません
- 解析サービス側の処理は、選んだサービスのプライバシーポリシーに従います
```

## Privacy And Safety Rules

Allowed event names:

- `game_open`
- `first_summon`
- `stage_clear`

Allowed props:

- `stageId`
- `chapter`
- `stageName`
- `unitKind` only for `first_summon`
- `unitLabel` only for `first_summon`

Do not send:

- player name
- email address
- child profile or age
- free text
- money
- HP
- coordinates
- enemy counts
- timestamps
- user agent from game code
- referrer from game code
- cookies created by game code
- localStorage or sessionStorage identifiers
- detailed game-state replay

Do not add:

- tag manager
- arbitrary external scripts
- storage-based visitor IDs
- provider calls from battle/render/unit logic

## Suggested Next PR Flow

1. Create a branch from `main`.
2. Confirm provider/domain/script/dashboard goals.
3. Update contract tests first for the selected provider and exact allowed endpoint/script.
4. Run the contract test and verify the expected red state if needed.
5. Update `game.html`, `README.md`, and tests together.
6. Run all verification commands.
7. Open PR.
8. Merge only after tests pass and public copy matches actual external communication.
9. Verify GitHub Pages after merge.

## Verification Commands

Run these before PR:

```bash
node scripts/verify-game-contract.js
node scripts/verify-game-runtime.js
git diff --check
rg -n "fetch\\(|XMLHttpRequest|localStorage|sessionStorage|document\\.cookie|eval\\(|navigator\\.sendBeacon|sendBeacon|https?://|<script[^>]+src" game.html index.html scripts assets
```

For local static serving:

```bash
python3 -m http.server 8765
curl -sI http://127.0.0.1:8765/
curl -sI http://127.0.0.1:8765/game.html
```

After merge, verify GitHub Pages with a cache-busting URL:

```bash
COMMIT_ID="$(git rev-parse --short HEAD)"
curl -sI "https://emiko8628.github.io/KEITO_DAISENSO/game.html?v=${COMMIT_ID}"
curl -sL "https://emiko8628.github.io/KEITO_DAISENSO/game.html?v=${COMMIT_ID}" | rg -n "ANALYTICS_CONFIG|game_open|first_summon|stage_clear|匿名の利用状況"
```

## Important Current URLs

- GitHub Pages game: `https://emiko8628.github.io/KEITO_DAISENSO/game.html`
- Repository: `https://github.com/Emiko8628/KEITO_DAISENSO`
- Latest analytics boundary PR: `https://github.com/Emiko8628/KEITO_DAISENSO/pull/18`

## Stop Conditions

Stop and ask before merging if:

- provider account or script URL is not confirmed
- dashboard goals are not created/confirmed
- README/footer copy does not match the actual runtime behavior
- contract scan requires broad external URL allowance
- runtime test cannot prove provider failure is safe
- any storage/cookie identifier is introduced

## Recommended Next Thread Prompt

```text
KEITO_DAISENSOで、匿名計測のprovider有効化PRを作りたいです。
まず docs/superpowers/handoffs/2026-06-24-analytics-provider-enablement-handoff.md を読んで、現状と安全ゲートを把握してください。
そのうえで、provider、対象ドメイン、script URL、dashboard goal を確認し、外部通信ONと公開文言更新を同じPRで進めてください。
```
