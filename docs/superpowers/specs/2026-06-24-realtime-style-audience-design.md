# Realtime-Style Audience Display Design

## Goal

Add a small in-game "参戦中" count that makes the battle feel lively without adding any new network, identity, storage, or analytics surface.

## Responsibility Boundary

- `game.html` owns the visual HUD element and local presentation logic.
- Google Analytics remains responsible only for `game_open`, `first_summon`, and `stage_clear`.
- The audience count must not read GA4, call an API, create cookies, use browser storage, or claim to be a real user count.
- README documents that the count is a game presentation layer, not live traffic data.

## UI Design

Place a compact `参戦中 N` line inside the existing right-side HUD board, under `HOME / BOSS / 撃破`. The display should stay secondary to money and base HP, fit in the current mobile HUD stack, and avoid adding another command or input.

The count starts at `3`, rises when the player summons units or the field becomes active, and stays within `3` to `9` so it feels lively without looking like a precise traffic metric.

## Data Flow

`estimateRealtimeAudience()` derives the display value from local game state:

- ally units currently on the field
- enemies currently on the field
- defeat count
- elapsed battle tempo
- clear state

The value is recalculated in `updateUI()` and written to `#viewerCount`.

## Safety Gates

- No external URLs beyond the existing Google tag URL.
- No new analytics events.
- No localStorage, sessionStorage, cookies, or sendBeacon.
- Runtime tests verify initial, summon, and restart behavior.
- Contract tests verify the HUD element and local estimator boundary.
