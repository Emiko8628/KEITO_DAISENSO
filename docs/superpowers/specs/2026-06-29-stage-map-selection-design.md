# Stage Map And Selection Design

Date: 2026-06-29
Scope: KEITO_DAISENSO stage-map and stage-selection design only. This spec does not change `game.html` behavior.

## Purpose

The game already has one playable stage, a `STAGES` data structure, `state.stageIndex`, and local enemy-base images prepared for stage 2 and stage 3. The missing responsibility is the stage-map layer: how a player will see the course path, choose a stage, and understand which stages are playable without confusing that work with battle logic, analytics, live audience, or data persistence.

This spec defines the implementation boundary for the next playable stage-map pass.

## Already Implemented

| Responsibility | Existing evidence | Status |
| --- | --- | --- |
| First playable stage | `STAGES[0]` in `game.html` | Complete |
| Stage runtime pointer | `state.stageIndex` and `currentStage()` in `game.html` | Present, currently fixed to stage 0 on reset |
| First stage UI labels | `stageChapter`, `stageName`, stage intro overlay | Complete |
| Future base art | `assets/base-enemy-stage-2-green-castle.png`, `assets/base-enemy-stage-3-red-black-castle.png` | Prepared |
| Future stage names | README stage-design memo lists `大地編`, `埼玉編`, `東京編`, `海辺編`, `宇宙ごっこ編` | Documented |
| Safety gates | `scripts/verify-game-contract.js`, `scripts/verify-game-runtime.js`, `scripts/verify-live-audience-worker.js`, `scripts/verify-game-site-map.js` | Present |

## Not Implemented Yet

| Responsibility | Required next owner |
| --- | --- |
| Stage map visual surface | A new unframed screen or panel in `game.html`, before battle start or reachable from the battle shell |
| Stage selection state | A small explicit selection state, separate from battle state reset |
| Locked stage copy | UI text that says future stages are coming soon without pretending they are playable |
| Stage definitions for locked nodes | Stage metadata list that may include locked stages without adding battle balance for them |
| Runtime transition | A single `startStage(stageIndex)` boundary that initializes battle state from the selected stage |
| Analytics safety | Existing `game_open`, `first_summon`, and `stage_clear` only, unless a separately approved PR explicitly adds a new allowlisted event |
| Persistence | No save data in the first pass |

## Recommended Approach

Use a **single-page stage map inside `game.html`**, not a separate route and not a new external app. Keep `index.html` as the entrypoint and `game.html` as the only playable page.

The first implementation should add a map view above or before the battle state:

1. Player lands on `game.html`.
2. The stage map shows a short route with stage nodes.
3. Stage 1 is playable.
4. Stage 2 and Stage 3 appear as locked or "coming soon" nodes using the already prepared base art theme.
5. Pressing Stage 1 starts the current battle.
6. Restart remains scoped to the current battle and does not imply account progress.

This keeps the project small while giving players a visible path toward future content.

## UX Requirements

- The first screen should still make the game immediately understandable.
- Stage 1 must remain one click away.
- Locked stages must not look like broken buttons.
- Locked stages should explain why they cannot be played yet: `準備中`.
- The stage map should not use large marketing copy or a landing-page hero.
- The design should remain quiet and game-focused, not site-focused.
- The first stage remains short, readable, and easy.

## Data Model Requirements

Add or derive a stage-map metadata shape that keeps playable battle data separate from future locked nodes.

```js
const STAGE_MAP = [
  {
    id: "earth-wanwan-01",
    chapter: "大地編",
    name: "大地をゆるがすワンワンステージ",
    status: "playable",
    stageIndex: 0,
    baseSprite: "assets/base-enemy-stage-1-gold-castle.png"
  },
  {
    id: "saitama-preview-01",
    chapter: "埼玉編",
    name: "準備中のステージ",
    status: "locked",
    baseSprite: "assets/base-enemy-stage-2-green-castle.png"
  },
  {
    id: "tokyo-preview-01",
    chapter: "東京編",
    name: "準備中のステージ",
    status: "locked",
    baseSprite: "assets/base-enemy-stage-3-red-black-castle.png"
  }
];
```

Rules:

- `status: "playable"` nodes must point to a real `STAGES` index.
- `status: "locked"` nodes must not require battle-balance fields.
- Locked nodes may reference visual assets, but they must not be passed into `resetGame()` as playable stages.
- `STAGES` remains the battle source of truth.
- `STAGE_MAP` is the map/navigation source of truth.

## Runtime Boundary

Introduce one battle start function in the following implementation PR:

```js
function startStage(stageIndex) {
  state = createInitialState(stageIndex);
  updateUI();
}
```

The current `resetGame()` behavior should be preserved by making it restart the selected playable stage:

```js
function resetGame() {
  startStage(selectedStageIndex);
}
```

The first pass can keep `selectedStageIndex = 0` until the stage map button selects a playable node.

## Safety Requirements

- Do not change the public URL.
- Do not add a new external provider.
- Do not add cookies, localStorage, sessionStorage, profile data, account data, or IP storage.
- Do not expand Google Analytics payloads.
- Do not create a VPS deployment path.
- Do not make locked stages playable without battle data and tests.
- Do not split `game.html` into multiple runtime files in the same pass unless the implementation becomes too large to verify safely.

## Verification Requirements

The implementation PR for the actual stage map should add or update verification for:

- Stage map metadata contains one playable stage and at least two locked preview nodes.
- Every playable node points to an existing `STAGES` index.
- Every locked node is non-playable in runtime.
- Stage 1 start still initializes the current battle correctly.
- Restart restarts the selected playable stage.
- Existing analytics events remain allowlisted.
- Existing live audience heartbeat remains unchanged.
- Existing game runtime tests continue to pass.

## Defer

- Search-engine `sitemap.xml`
- Persistent progress
- Multiple playable stages
- New analytics events
- Separate stage-map route
- Asset generation
- VPS deployment

## Recommended Next Implementation

The next code PR should implement only the Stage 1 playable map with locked previews for Stage 2 and Stage 3. It should not add full Stage 2 or Stage 3 battles yet.
