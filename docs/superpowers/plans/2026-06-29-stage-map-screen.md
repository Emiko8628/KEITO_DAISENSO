# Stage Map Screen Implementation Plan

## Goal

Add the first playable stage-map screen before the battle view while keeping the existing single-page GitHub Pages URL and battle source of truth unchanged.

## Responsibility Boundary

- `STAGES` remains the battle data source.
- `STAGE_MAP` becomes the navigation and preview source.
- Stage 1 starts the existing battle.
- Stage 2 and Stage 3 are locked previews that reuse the prepared local base images.
- No new storage, analytics events, providers, external URLs, or VPS surface.

## Implementation Steps

1. Add contract/runtime checks for the stage-map view, playable node, locked previews, and selected-stage reset.
2. Add the stage-map HTML/CSS inside `game.html` before the battle view.
3. Refactor game initialization into `createInitialState`, `initializeGame`, `startStage`, `selectStageMapNode`, `showStageMap`, and `showBattleView`.
4. Keep battle simulation paused while the map is visible.
5. Verify static contracts, runtime behavior, live-audience boundaries, and public GitHub Pages behavior after merge.

## Safety Gates

- Existing URL remains `game.html`.
- Existing analytics events remain `game_open`, `first_summon`, and `stage_clear`.
- Live audience endpoint remains unchanged.
- Locked stages do not point to missing battle data.
- Restart only restarts the selected playable stage.
