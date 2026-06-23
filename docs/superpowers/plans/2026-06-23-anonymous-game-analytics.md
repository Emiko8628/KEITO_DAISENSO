# Anonymous Game Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a privacy-safe analytics boundary for counting game opens, first summons, and stage clears without collecting personal data.

**Architecture:** Keep analytics behind one adapter boundary inside `game.html`. Game logic calls `trackGameEvent`, never a provider directly. Analytics stays disabled until a provider is configured and public copy is updated.

**Tech Stack:** Static HTML, inline JavaScript, Node-based verification scripts, GitHub Pages.

---

## File Structure

- Modify: `game.html`
  - Add `ANALYTICS_CONFIG`, event constants, analytics session state, and `trackGameEvent`.
  - Add calls from page start, successful first summon, and stage clear.
  - Keep provider code isolated from battle/rendering logic.
- Modify: `scripts/verify-game-contract.js`
  - Add static checks for config, centralized event names, disabled default, and no storage.
- Modify: `scripts/verify-game-runtime.js`
  - Add runtime checks with a fake analytics sink.
- Modify: `README.md`
  - Only in the provider-enabling PR, update the public privacy copy.

## Task 1: Add Analytics Contract Tests

**Files:**
- Modify: `scripts/verify-game-contract.js`

- [ ] **Step 1: Add failing contract checks**

Add these checks near the existing script contract checks:

```js
contains(
  script,
  "const ANALYTICS_CONFIG = {",
  "analytics config boundary"
);

contains(
  script,
  "enabled: false",
  "analytics must be disabled by default"
);

contains(
  script,
  "const ANALYTICS_EVENTS = Object.freeze",
  "analytics event names should be centralized"
);

contains(
  script,
  "game_open",
  "analytics should support game_open"
);

contains(
  script,
  "first_summon",
  "analytics should support first_summon"
);

contains(
  script,
  "stage_clear",
  "analytics should support stage_clear"
);

contains(
  script,
  "function trackGameEvent",
  "single analytics tracking entrypoint"
);

contains(
  script,
  "function trackNoopEvent",
  "safe analytics disabled adapter"
);

assert(
  !script.includes("localStorage") && !script.includes("sessionStorage"),
  "analytics must not add browser storage identifiers"
);
```

- [ ] **Step 2: Run the contract test and verify it fails**

Run:

```bash
node scripts/verify-game-contract.js
```

Expected: FAIL because `ANALYTICS_CONFIG` does not exist yet.

- [ ] **Step 3: Do not change production code in this task**

Commit only if the project workflow wants RED commits:

```bash
git add scripts/verify-game-contract.js
git commit -m "test: define analytics safety contract"
```

## Task 2: Add Disabled Analytics Boundary

**Files:**
- Modify: `game.html`

- [ ] **Step 1: Add analytics config and event constants**

Add after the base constants:

```js
const ANALYTICS_CONFIG = {
  enabled: false,
  provider: "noop",
  siteDomain: "",
  scriptSrc: ""
};

const ANALYTICS_EVENTS = Object.freeze({
  gameOpen: "game_open",
  firstSummon: "first_summon",
  stageClear: "stage_clear"
});
```

- [ ] **Step 2: Add analytics state to resetGame**

Inside the object assigned to `state` in `resetGame`, add this property next to the other top-level state fields:

```js
analytics: {
  gameOpenSent: false,
  firstSummonSent: false,
  stageClearSent: false
},
```

- [ ] **Step 3: Add tracking functions**

Add near the helper functions:

```js
function analyticsStageProps() {
  const stage = currentStage();
  return {
    stageId: stage.id,
    chapter: stage.chapter,
    stageName: stage.name
  };
}

function trackGameEvent(eventName, props = {}) {
  if (!ANALYTICS_CONFIG.enabled) {
    trackNoopEvent(eventName, props);
    return;
  }
  if (ANALYTICS_CONFIG.provider === "plausible") {
    trackPlausibleEvent(eventName, props);
    return;
  }
  trackNoopEvent(eventName, props);
}

function trackNoopEvent() {}

function trackPlausibleEvent(eventName, props) {
  if (typeof window === "undefined" || typeof window.plausible !== "function") return;
  window.plausible(eventName, { props });
}
```

- [ ] **Step 4: Send game_open once after reset**

Add after `updateUI();` inside `resetGame`:

```js
trackGameOpen();
```

Add helper:

```js
function trackGameOpen() {
  if (state.analytics.gameOpenSent) return;
  state.analytics.gameOpenSent = true;
  trackGameEvent(ANALYTICS_EVENTS.gameOpen, analyticsStageProps());
}
```

- [ ] **Step 5: Run contract test**

Run:

```bash
node scripts/verify-game-contract.js
```

Expected: PASS.

## Task 3: Track First Summon and Stage Clear

**Files:**
- Modify: `game.html`
- Modify: `scripts/verify-game-runtime.js`

- [ ] **Step 1: Add first summon helper**

Add:

```js
function trackFirstSummon(kind, label) {
  if (state.analytics.firstSummonSent) return;
  state.analytics.firstSummonSent = true;
  trackGameEvent(ANALYTICS_EVENTS.firstSummon, {
    ...analyticsStageProps(),
    unitKind: kind,
    unitLabel: label
  });
}
```

- [ ] **Step 2: Call it after successful spend**

In `spawnUnit`, immediately after the existing `state.units.push(createFighter(kind, type, ALLY_BASE_X - 58, "ally"));` line, add:

```js
trackFirstSummon(kind, type.label);
```

- [ ] **Step 3: Add stage clear helper**

Add:

```js
function trackStageClear() {
  if (state.analytics.stageClearSent) return;
  state.analytics.stageClearSent = true;
  trackGameEvent(ANALYTICS_EVENTS.stageClear, analyticsStageProps());
}
```

- [ ] **Step 4: Call it when enemy base is destroyed**

Inside the win branch of `checkResult`, before or after setting the message, add:

```js
trackStageClear();
```

- [ ] **Step 5: Expose telemetry test hook**

In `scripts/verify-game-runtime.js`, before running the script, add this to the sandbox:

```js
const trackedEvents = [];
```

Add `trackedEvents` to the runtime probe:

```js
getTrackedEvents: () => trackedEvents
```

If the implementation uses a window-level fake sink, expose:

```js
window: {
  plausible(eventName, payload) {
    trackedEvents.push({ eventName, payload });
  }
}
```

- [ ] **Step 6: Add runtime assertions for disabled default**

After initial reset assertions:

```js
assert.deepStrictEqual(
  sandbox.__keitoRuntimeProbe.getTrackedEvents(),
  [],
  "analytics should not send events when disabled by default"
);
```

- [ ] **Step 7: Run runtime test**

Run:

```bash
node scripts/verify-game-runtime.js
```

Expected: PASS with no tracked events in disabled mode.

## Task 4: Provider Enablement PR

**Files:**
- Modify: `game.html`
- Modify: `README.md`
- Modify: `scripts/verify-game-contract.js`

- [ ] **Step 1: Confirm provider config outside code**

Required values:

```text
provider = plausible
siteDomain = emiko8628.github.io/KEITO_DAISENSO or the chosen custom domain
scriptSrc = the provider-approved script URL
```

- [ ] **Step 2: Update public copy in the same PR**

Change footer text in `game.html` to:

```html
<p class="note">非公式ファン制作｜匿名の利用状況だけを取得しています。個人情報や入力内容は保存しません。</p>
```

Change README safety wording to:

```md
- 静的HTMLで動作します
- 匿名の利用状況計測を有効にする場合のみ、設定した解析サービスへ game_open / first_summon / stage_clear を送信します
- 名前、メール、入力内容、保存データは扱いません
```

- [ ] **Step 3: Add script/config only after provider is ready**

Set:

```js
const ANALYTICS_CONFIG = {
  enabled: true,
  provider: "plausible",
  siteDomain: "CONFIRMED_DOMAIN",
  scriptSrc: "CONFIRMED_SCRIPT_URL"
};
```

- [ ] **Step 4: Update external communication scan**

The scan must allow only the selected analytics endpoint or script. It must still reject unrelated `fetch`, `XMLHttpRequest`, storage APIs, or arbitrary HTTP URLs.

- [ ] **Step 5: Browser verification**

Run local server:

```bash
python3 -m http.server 8765
```

Open:

```text
http://127.0.0.1:8765/game.html
```

Verify:

- page loads
- footer discloses anonymous analytics
- first summon works
- stage clear still works
- console has no relevant warnings or errors

## Task 5: Final Safety Check

**Files:**
- No code changes unless a gap is found.

- [ ] **Step 1: Run all focused checks**

```bash
node scripts/verify-game-contract.js
node scripts/verify-game-runtime.js
git diff --check
rg -n "localStorage|sessionStorage|eval\\(|XMLHttpRequest" game.html index.html scripts assets docs
```

Expected:

- contract pass
- runtime pass
- no whitespace errors
- no storage/eval/XHR usage

- [ ] **Step 2: Check git status**

```bash
git status --short --branch
```

Expected: only intended files changed before commit; clean after merge.

- [ ] **Step 3: PR and deployment**

```bash
git add game.html README.md scripts/verify-game-contract.js scripts/verify-game-runtime.js
git commit -m "feat: add anonymous game analytics"
git push -u origin codex/add-anonymous-game-analytics
gh pr create --title "匿名のゲーム体験数計測を追加" --body "## 変更内容
- 匿名のゲーム体験数計測の境界を追加しました
- game_open / first_summon / stage_clear の3イベントだけを扱います
- 計測処理は trackGameEvent に集約し、プロバイダー依存をゲームロジックから分離しました
- 個人情報、入力内容、ブラウザ保存、詳細なゲーム状態は扱いません
- 外部通信が有効になる場合のフッターと README の説明を更新しました

## 確認
- node scripts/verify-game-contract.js
- node scripts/verify-game-runtime.js
- git diff --check
- localStorage / sessionStorage / eval / XMLHttpRequest なし
- ブラウザで読み込み、初回召喚、ステージクリア、コンソールエラーなしを確認"
gh pr merge --squash --delete-branch
```

After merge, confirm GitHub Pages:

```bash
COMMIT_ID="$(git rev-parse --short HEAD)"
curl -sI "https://emiko8628.github.io/KEITO_DAISENSO/game.html?v=${COMMIT_ID}"
curl -sL "https://emiko8628.github.io/KEITO_DAISENSO/game.html?v=${COMMIT_ID}" | rg -n "game_open|first_summon|stage_clear|匿名の利用状況"
```

Expected: HTTP 200 and updated public code/copy reflected.

## Self-Review

Spec coverage:

- Counts game open, first summon, and stage clear.
- Keeps analytics disabled until provider setup is ready.
- Keeps provider code behind one adapter.
- Requires footer and README copy updates before external communication is enabled.
- Keeps storage and personal data out of scope.

Placeholder scan:

- The only configurable values are deliberately named `CONFIRMED_DOMAIN` and `CONFIRMED_SCRIPT_URL` in the provider-enabling task because live provider details must not be guessed.

Type consistency:

- Event names are centralized in `ANALYTICS_EVENTS`.
- Game code calls `trackGameEvent`, `trackFirstSummon`, and `trackStageClear`.
- Provider code is limited to `trackPlausibleEvent`.
