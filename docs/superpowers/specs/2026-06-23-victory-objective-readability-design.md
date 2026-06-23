# KEITO_DAISENSO Victory Objective And Readability Design

Date: 2026-06-23
Status: implementation-ready design
Scope: `game.html`, `README.md`, and verification scripts for the first stage

This design supersedes the experience-based clear rule in:

- `docs/superpowers/specs/2026-06-19-stage-effects-campaign-design.md`
- `docs/superpowers/specs/2026-06-19-stage-effects-campaign-implementation-plan.md`

## Goal

Make the first stage rules match the intended tower-defense loop:

1. the player starts on the right side
2. enemies start on the left side
3. units fight automatically
4. experience can fill up and notify the player
5. the stage is cleared only when the enemy base is destroyed

The visual upgrade for this pass is focused on readability, not decoration:

- add character ground shadows
- strengthen the enemy and ally base designs
- keep the background simple until the silhouettes are easier to read

## Non-Goals

Do not add these in this pass:

- stage select screen
- save data
- account-level experience
- sound effects or music
- external scripts
- external libraries
- network communication
- server or VPS deployment
- new generated image assets
- multiple playable stages

GitHub Pages remains the deployment target for this phase.

## Responsibility Boundary

This repository is responsible for the browser game only.

The uncommitted `discord-bot` daily-template work is a separate responsibility:

- `gameDevDailyTemplate.js`
- `test/gameDevDailyTemplate.test.js`
- `.env.example`
- `docs/operations.md`
- `index.js`

Those files must not be staged, committed, or merged together with this KEITO game change. They belong to the Discord scheduler lane, not this game lane.

## Current Cross-Check

The current game already has:

- first-stage data in `STAGES`
- right-side player base and left-side enemy base
- three ally types
- three enemy types
- summon cooldowns without visible countdown seconds
- attack effects
- stage intro and clear overlay
- static contract verification
- VM-based runtime verification

The current game still has these outdated assumptions:

- `checkResult()` clears the stage when `state.experience >= state.targetExperience`
- `attackBase()` fills the remaining experience when the enemy base reaches 0 HP
- `README.md` says experience is the clear objective
- `scripts/verify-game-contract.js` asserts the experience-based clear condition
- `scripts/verify-game-runtime.js` asserts that adding 100 experience wins the stage
- older design docs describe experience as the clear controller

The implementation must update all of those together. Changing only `game.html` would leave the automated checks and documentation lying about the real rule.

## Product Rules

### Stage Direction

Preserve the current direction:

- player base: right side, label `HOME`
- enemy base: left side, label `BOSS`
- player units move left
- enemies move right

The base label margins must stay mirrored.

### Clear Condition

The only win condition for the first stage is:

```js
state.enemyBaseHp <= 0
```

When this happens:

- set `state.gameOver = true`
- set `state.result = "win"`
- apply `stage.clearBonus` once
- show a clear burst
- show a clear message focused on destroying the enemy base

Recommended message:

```text
BOSS撃破! 大地をゆるがすワンワンステージ クリア。勝利ボーナス +120！
```

### Lose Condition

The lose condition stays:

```js
state.allyBaseHp <= 0
```

When this happens:

- set `state.gameOver = true`
- set `state.result = "lose"`
- keep the current restart path

### Experience Condition

Experience is no longer a clear condition.

The purpose of experience in this pass is:

- reward visible progress
- create a small "filled up" moment
- support future growth systems

When experience reaches the target:

- do not set `state.gameOver`
- do not set `state.result = "win"`
- do not apply `stage.clearBonus`
- do not disable summon buttons
- show one notification only

Recommended notification:

```text
経験値がたまったよ！
```

The HUD can still show:

```text
100 / 100
```

Experience should remain clamped at the target for this first-stage UI.

## State Design

Keep the existing `targetExperience` value, but change its meaning:

```js
targetExperience: stage.targetExperience,
experience: 0,
experienceNoticeShown: false
```

`targetExperience` means "notice threshold", not "clear target".

The stage data can keep:

```js
targetExperience: 100,
clearBonus: 120
```

`clearBonus` is paid only when the enemy base is destroyed.

## Function Responsibility Design

### `resetGame()`

Add or reset:

```js
experienceNoticeShown: false
```

The opening message should teach the correct objective.

Recommended message:

```text
大地編、大地をゆるがすワンワンステージ。右の陣地からユニットを召喚して、左の敵拠点をこわそう。
```

### `addExperience(amount, x, y)`

Responsibilities:

- ignore non-positive amounts
- ignore if the game is over
- clamp experience to `state.targetExperience`
- show `EXP +n` only when actual experience increased
- call `maybeShowExperienceNotice(x, y)` after the value changes

It must not directly win the game.

### `maybeShowExperienceNotice(x, y)`

New helper.

Responsibilities:

- run only once per reset
- check `state.experience >= state.targetExperience`
- set `state.experienceNoticeShown = true`
- add a floating text such as `経験値がたまったよ！`
- add a small non-blocking effect
- set `state.message` to the same notice only if the game is still running

It must not set `gameOver`.

### `attackBase(actor)`

When an ally attacks the enemy base:

- damage `state.enemyBaseHp`
- add base-hit visual feedback
- add experience from base damage using `baseHitExperienceRate`
- do not add remaining experience just because the base reached 0

The clear result is handled by `checkResult()`.

### `checkResult()`

New order:

```js
if (state.gameOver) return;

if (state.enemyBaseHp <= 0) {
  // win
} else if (state.allyBaseHp <= 0) {
  // lose
}
```

Do not check `state.experience >= state.targetExperience` here.

This function is responsible for terminal outcomes only.

## Visual Design

### Character Shadows

Add a helper:

```js
function drawFighterShadow(fighter) {
  // Draw an ellipse at the ground contact point.
}
```

Rules:

- draw before `drawCharacterSprite()`
- do not affect collision, HP, or movement
- use a translucent dark fill
- scale width from `fighter.spriteWidth || fighter.width`
- keep shadows subtle enough that HP bars and sprites stay readable

Suggested visual:

```js
ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
ctx.ellipse(0, 2, shadowWidth, 7, 0, 0, Math.PI * 2);
```

### Base Design

Replace the simple rectangles inside `drawBase()` with a structured helper:

```js
function drawBaseStructure(x, hp, team) {
  // Draws HOME or BOSS with team-specific shapes.
}
```

Enemy base design:

- keep label `BOSS`
- use red/pink enemy colors
- make it read as a small enemy tower or fortress
- keep the hit point bar above it
- stay within the mirrored margin contract

Ally base design:

- keep label `HOME`
- use cyan/blue ally colors
- make it read as a small home base or cannon base
- keep the hit point bar above it
- stay within the mirrored margin contract

Do not add new sprite files. Use Canvas primitives only.

### Background

Do not do a major background redesign in this pass.

Allowed:

- tiny contrast tweaks if shadows or base silhouettes need them
- no busy texture behind fighters
- no darkening that hides white character sprites

The next visual pass can focus on stage-specific backgrounds after the rule and silhouette pass is stable.

## UI Copy

Update visible copy that currently teaches the wrong objective.

Stage intro should say:

```text
左の敵拠点をこわそう
```

Clear overlay should say:

```text
BOSS撃破!
大地をゆるがすワンワンステージ クリア
勝利ボーナス +120
```

Experience notice should say:

```text
経験値がたまったよ！
```

Avoid copy that says experience itself clears the stage.

## Documentation Updates

Update `README.md` so it says:

- attacking the enemy base clears the stage
- experience is a progress notification
- experience is not saved
- the current clear goal is `敵拠点HPを0にする`
- clear bonus still comes from stage clear

Keep the character settings and first-stage roster unchanged.

## Verification Updates

### Static Contract Verification

Update `scripts/verify-game-contract.js` to assert the new contract:

- includes `experienceNoticeShown`
- includes `function maybeShowExperienceNotice`
- includes `function drawFighterShadow`
- includes `function drawBaseStructure`
- includes `state.enemyBaseHp <= 0`
- does not include experience-based clear inside `checkResult()`
- does not include forced remaining-experience grant on base destruction
- still confirms mirrored base margins
- still confirms three ally buttons
- still confirms three enemy sprites
- still confirms cooldown labels do not show waiting seconds

The old assertion for:

```js
state.experience >= state.targetExperience
```

must be removed or converted into a negative assertion for the terminal result logic.

### Runtime Verification

Update `scripts/verify-game-runtime.js` to prove:

1. initial state still starts at `0 / 100`
2. summoning still spends money and triggers cooldown
3. adding 100 experience does not set `result = "win"`
4. adding 100 experience shows the notice once
5. destroying the enemy base sets `result = "win"`
6. destroying the ally base sets `result = "lose"`
7. restart resets result, money, experience, cooldowns, and `experienceNoticeShown`

Expose enough probe helpers for the test:

```js
globalThis.__keitoRuntimeProbe = {
  addExperience,
  checkResult,
  getState: () => state
};
```

If direct state mutation is needed in the test, prefer small test-only helpers added through the VM probe replacement, not production globals.

### Safety Verification

Run:

```bash
node scripts/verify-game-contract.js
node scripts/verify-game-runtime.js
git diff --check
rg -n "fetch\\(|XMLHttpRequest|localStorage|sessionStorage|eval\\(|https?://|<script src" game.html index.html scripts assets
rg -n "https?://" README.md docs
```

Expected result:

- no forbidden runtime API in `game.html`
- README may still contain the GitHub repository URL
- docs may contain explanatory URLs only if intentionally added
- the runtime safety scan must not search `docs`, because design docs can contain the safety regex as text

## Implementation Order

1. Update contract tests for the new objective and expected helpers.
2. Update runtime tests so experience fill does not win and enemy-base destruction does win.
3. Update `game.html` state and rule functions.
4. Add the experience notice helper and effect.
5. Add fighter shadows.
6. Replace base drawing internals with structured base drawing.
7. Update stage intro, clear overlay, and README copy.
8. Run all verification commands.
9. Review diff for accidental external communication, storage, or unrelated changes.
10. Commit the KEITO-only change.
11. Open PR.
12. After review and tests, merge to `main`.
13. Verify GitHub Pages, not VPS.

## Done Definition

This task is done only when:

- stage clear happens from enemy base destruction
- experience reaching 100 only notifies
- shadows render under characters
- base designs are more readable
- README matches the game
- contract and runtime verifiers match the new rules
- safety scan has no new runtime communication or storage APIs
- the KEITO branch does not include `discord-bot` files
- GitHub Pages is verified after merge

VPS reflection is explicitly out of scope for this repository phase.

## Final Hole Check

Before implementation is called complete, re-check:

- old docs are marked as superseded where they conflict
- no button label shows waiting seconds
- right side remains `HOME`
- left side remains `BOSS`
- first stage remains easy and readable
- enemy count remains low enough for the first course
- local sprite fallback behavior remains intact
- the clear overlay cannot be triggered by experience alone
- the experience notice cannot repeat every frame
- clear bonus cannot be applied twice
- no unrelated repo changes are staged
