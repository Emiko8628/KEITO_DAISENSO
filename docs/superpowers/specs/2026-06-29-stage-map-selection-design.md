# Stage Map And Selection Design

Date: 2026-06-29
Updated: 2026-07-14
Scope: KEITO_DAISENSO stage-map, locked-preview, and Stage 2 playable design.

## Purpose

The game has two playable stages, a `STAGES` data structure, `state.stageIndex`, a stage-map surface, and local castle assets for the next preview nodes. The responsibility boundary is:

- `STAGES` is the battle source of truth.
- `STAGE_MAP` is the map, navigation, and locked-preview source of truth.
- `GAME_ASSETS` is the local asset registry for bases, backgrounds, allies, and enemies.

This spec records the current stage-map state after making Stage 2 `ざぶざぶビーチ防衛戦` playable without opening unrelated analytics, Worker, storage, URL, or VPS surfaces.

## Already Implemented

| Responsibility | Existing evidence | Status |
| --- | --- | --- |
| First playable stage | `STAGES[0]` in `game.html` | Complete |
| Second playable stage | `STAGES[1]` with `beach-defense-01`, `海辺編`, `ざぶざぶビーチ防衛戦`, and `assets/stage-beach-background.png` | Complete |
| Stage runtime pointer | `state.stageIndex`, `selectedStageIndex`, and `currentStage()` in `game.html` | Present |
| First stage UI labels | `stageChapter`, `stageName`, stage intro overlay | Complete |
| Stage map visual surface | `stageMap`, `battleView`, `renderStageMap()`, `showStageMap()`, `showBattleView()` in `game.html` | Complete |
| Stage 1 playable node | `earth-wanwan-01` in `STAGE_MAP` with `status: "playable"` and `stageIndex: 0` | Complete |
| Stage 2 playable node | `beach-defense-01` in `STAGE_MAP` with `status: "playable"`, `stageIndex: 1`, and `assets/base-enemy-stage-2-beach-castle.png` | Complete |
| Stage 3 locked preview | `forest-preview-01`, `森編`, `もりもり迷いのこみちは準備中`, `assets/base-enemy-stage-3-forest-castle.png` | Complete |
| Stage 4 locked preview | `ghost-night-preview-01`, `おばけ屋敷編`, `ふわふわおばけの夜道は準備中`, `assets/base-enemy-stage-4-ghost-castle.png` | Complete |
| Shared ally base art | `assets/base-ally-blue-castle-v2.png` through `GAME_ASSETS.bases.ally` | Complete |
| Analytics counting decision | `game_open` remains once per page session. `first_summon` and `stage_clear` use the selected stage props. No new event names or payload keys are added. | Complete |
| Safety gates | `scripts/verify-game-contract.js`, `scripts/verify-game-runtime.js`, `scripts/verify-live-audience-worker.js`, `scripts/verify-game-site-map.js` | Present |

## Not Implemented Yet

| Responsibility | Required next owner |
| --- | --- |
| Stage 3 battle data | Future `STAGES[2]` in `game.html` |
| Stage 3 background asset | Future forest background referenced by `GAME_ASSETS.backgrounds.forest` |
| Stage 3 playable map node | Future `STAGE_MAP` update from `locked` to `playable` with `stageIndex: 2` |
| Stage 3 runtime and contract tests | Future tests should prove Stage 3 starts, restarts, and uses Stage 3 values |
| Stage 4 locked-state tests | Runtime tests should continue proving Stage 4 remains non-playable |
| Persistence | No save data |

## Recommended Approach

Keep the single-page stage map inside `game.html`. Do not create a separate route, new app, or new deployment target.

Current player flow:

1. Player lands on `game.html`.
2. The stage map appears first.
3. Stage 1 and Stage 2 are playable.
4. Stage 3 and Stage 4 appear as `準備中` locked previews.
5. Pressing Stage 1 or Stage 2 starts the selected battle.
6. Restart remains scoped to the selected playable stage.

Current player flow after the Stage 2 playable PR:

1. Stage 1 remains playable.
2. Stage 2 is playable as `海辺編 / ざぶざぶビーチ防衛戦`.
3. Stage 3 and Stage 4 must remain locked.
4. Restart on Stage 2 restarts Stage 2, not Stage 1.
5. Existing public URL remains `game.html`.

## UX Requirements

- The first screen should still make the game immediately understandable.
- Stage 1 and Stage 2 must be one click away once Stage 2 becomes playable.
- Locked stages must not look like broken buttons.
- Locked stages should explain why they cannot be played yet: `準備中`.
- The stage map should not use large marketing copy or a landing-page hero.
- The design should remain game-focused, not site-focused.
- Stage 2 should feel slightly more advanced than Stage 1, but still readable and short.
- Stage 3 and Stage 4 must remain visually exciting previews without implying they can be played.

## Data Model Requirements

Current shape:

```js
const STAGE_MAP = [
  {
    id: "earth-wanwan-01",
    chapter: "大地編",
    name: "大地をゆるがすワンワンステージ",
    status: "playable",
    stageIndex: 0,
    baseSprite: GAME_ASSETS.bases.enemyStage1
  },
  {
    id: "beach-defense-01",
    chapter: "海辺編",
    name: "ざぶざぶビーチ防衛戦",
    status: "playable",
    stageIndex: 1,
    baseSprite: GAME_ASSETS.bases.enemyStage2
  },
  {
    id: "forest-preview-01",
    chapter: "森編",
    name: "もりもり迷いのこみちは準備中",
    status: "locked",
    baseSprite: GAME_ASSETS.bases.enemyStage3
  },
  {
    id: "ghost-night-preview-01",
    chapter: "おばけ屋敷編",
    name: "ふわふわおばけの夜道は準備中",
    status: "locked",
    baseSprite: GAME_ASSETS.bases.enemyStage4
  }
];
```

Rules:

- `status: "playable"` nodes must point to a real `STAGES` index.
- `status: "locked"` nodes must not require battle-balance fields.
- Locked nodes may reference visual assets, but they must not be passed into `resetGame()` as playable stages.
- `STAGES` remains the battle source of truth.
- `STAGE_MAP` remains the map and navigation source of truth.
- `GAME_ASSETS` remains the asset source of truth.

## Stage 2 Playable Implementation

The Stage 2 playable PR makes only Stage 2 playable. It does not make Stage 3 or Stage 4 playable.

Implemented data:

- Add `assets/stage-beach-background.png`.
- Add `GAME_ASSETS.backgrounds.beach`.
- Add `STAGES[1]` with id `beach-defense-01`.
- Use chapter `海辺編`.
- Use stage name `ざぶざぶビーチ防衛戦`.
- Use enemy base sprite `GAME_ASSETS.bases.enemyStage2`.
- Keep the existing three ally unit types.
- Keep the existing three enemy types.
- Keep no save data.

Recommended Stage 2 balance:

```js
{
  id: "beach-defense-01",
  chapter: "海辺編",
  name: "ざぶざぶビーチ防衛戦",
  startMoney: 180,
  allyBaseHp: 100,
  enemyBaseHp: 95,
  targetExperience: 120,
  clearBonus: 150,
  background: GAME_ASSETS.backgrounds.beach,
  enemyBaseSprite: GAME_ASSETS.bases.enemyStage2,
  enemyDefeatExperience: {
    pyoko: 18,
    nyoro: 30,
    trio: 26
  },
  baseHitExperienceRate: 1,
  enemySpawnFirstMs: 2300,
  enemySpawnBaseMs: 4700,
  enemySpawnMinMs: 3400,
  enemySpawnTable: [
    { kind: "pyoko", weight: 55 },
    { kind: "nyoro", weight: 30 },
    { kind: "trio", weight: 15 }
  ]
}
```

Required map update:

```js
{
  id: "beach-defense-01",
  chapter: "海辺編",
  name: "ざぶざぶビーチ防衛戦",
  status: "playable",
  stageIndex: 1,
  baseSprite: GAME_ASSETS.bases.enemyStage2,
  buttonId: "lockedStage1"
}
```

Stage 3 and Stage 4 remain locked.

## Runtime Boundary

Use the existing runtime boundary:

```js
function startStage(stageIndex) {
  const mapNode = STAGE_MAP.find((node) => node.stageIndex === stageIndex && node.status === "playable");
  if (!mapNode || !STAGES[stageIndex]) {
    updateStageMapStatus("このステージはまだ準備中です。");
    showStageMap();
    return;
  }
  selectedStageIndex = stageIndex;
  resetGame();
}
```

`resetGame()` should continue to restart `selectedStageIndex`.

## Safety Requirements

- Do not change the public URL.
- Do not add a new external provider.
- Do not add cookies, localStorage, sessionStorage, profile data, account data, or IP storage.
- Do not expand Google Analytics payloads.
- Do not create a VPS deployment path.
- Do not make locked stages playable without battle data and tests.
- Do not make Stage 3 or Stage 4 playable without battle data and tests.
- Do not split `game.html` into multiple runtime files in the Stage 2 playable PR.
- Do not change Cloudflare Worker behavior.
- Do not change `wrangler.toml`.

## Verification Requirements

The Stage 2 playable PR verifies:

- Stage map metadata contains two playable stages and two locked preview nodes.
- Every playable node points to an existing `STAGES` index.
- Every locked node is non-playable in runtime.
- Stage 1 still initializes the current first battle correctly.
- Stage 2 initializes `STAGES[1]` and shows `海辺編 / ざぶざぶビーチ防衛戦`.
- Stage 2 uses `assets/stage-beach-background.png`.
- Stage 2 uses `GAME_ASSETS.bases.enemyStage2`.
- Stage 2 starts with money `180`.
- Stage 2 enemy base HP is `95`.
- Stage 2 target experience is `120`.
- Stage 2 clear bonus is `150`.
- Stage 2 enemy spawn weights are `55 / 30 / 15`.
- Restart restarts the selected playable stage.
- Stage 3 and Stage 4 remain locked.
- Existing analytics event names remain `game_open`, `first_summon`, and `stage_clear`.
- Existing live audience heartbeat remains unchanged.
- Existing game runtime tests continue to pass.

## Defer

- Search-engine `sitemap.xml`
- Persistent progress
- New analytics events
- Separate stage-map route
- Stage 3 playable battle data
- Stage 4 playable battle data
- VPS deployment

## Recommended Next Implementation

The next code PR should prepare Stage 3 `もりもり迷いのこみち` safely. It should keep Stage 4 `ふわふわおばけの夜道` locked until Stage 4 has its own battle data and tests.
