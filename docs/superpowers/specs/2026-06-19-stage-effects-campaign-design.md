# KEITO_DAISENSO Stage Effects And Campaign Design

Date: 2026-06-19
Status: design review
Scope: `game.html` first-stage upgrade, still static HTML/CSS/JavaScript

## Goal

Make the first playable stage feel more like a real game while keeping the project small, safe, and easy to post as a development log.

This design covers:

- attack feedback
- stronger role differences for the three ally units
- summon cooldowns
- stage start and clear presentation
- a data structure that can later support many stages grouped into named chapters

The first playable stage name is:

`大地をゆるがずワンワンステージ`

The first chapter name is:

`大地編`

## Non-Goals

Do not add these in this pass:

- stage select screen
- save data
- sound effects or music
- external communication
- external libraries
- multiple playable stages
- new sprite generation
- server or VPS deployment

GitHub Pages is enough for this phase.

## Product Direction

The first stage should stay easy and readable. The player should understand the loop within a few seconds:

1. the stage title appears
2. the player summons a unit from the right side
3. units fight automatically
4. hits are visible through effects and damage numbers
5. the player learns that each ally has a different job
6. the enemy base breaks quickly enough to feel successful
7. the clear screen celebrates the win

The game should feel good in a short X video clip. The most important moment is not complexity; it is legibility.

## Architecture

Keep `game.html` as the only runtime file for now, but make the inside more data-driven.

Recommended responsibility boundaries inside the script:

- `STAGES`: stage/chapter data, balance, intro text, rewards
- `UNIT_TYPES`: ally stats, cost, cooldown, role text, effect style
- `ENEMY_TYPES`: enemy stats, reward, sprite info
- `state`: current run data, timers, cooldowns, effects, result
- update functions: money, cooldowns, enemy spawning, fighter movement, combat
- draw functions: background, bases, fighters, effects, overlays, HUD
- UI functions: button state, messages, labels

Do not split files yet. A single file still helps the user open and share the game easily.

## Stage Data Design

Add a `STAGES` constant with one active stage:

```js
const STAGES = [
  {
    id: "earth-wanwan-01",
    chapter: "大地編",
    name: "大地をゆるがずワンワンステージ",
    startMoney: 180,
    allyBaseHp: 100,
    enemyBaseHp: 70,
    clearBonus: 120,
    enemySpawnFirstMs: 2600,
    enemySpawnBaseMs: 5200,
    enemySpawnMinMs: 3800,
    enemySpawnTable: [
      { kind: "pyoko", weight: 70 },
      { kind: "nyoro", weight: 20 },
      { kind: "trio", weight: 10 }
    ]
  }
];
```

`resetGame()` should read from `STAGES[state.stageIndex]` instead of hardcoding first-stage values directly into runtime state.

Future chapters can follow the same shape:

- `埼玉編`
- `東京編`
- `海辺編`
- `宇宙ごっこ編`

Only the first stage should be playable in this pass.

## Ally Role Design

Keep the visible names:

- `まるねこ`
- `かたいねこ`
- `こうげきねこ`

Tune them so the role is felt:

| Unit | Role | Feel | Suggested Stats |
| --- | --- | --- | --- |
| まるねこ | basic | cheap, reliable, easy first summon | cost 50, hp 90, attack 18, speed 0.82, summon cooldown 1400ms |
| かたいねこ | wall | slow, sturdy, holds the front | cost 80, hp 190, attack 7, speed 0.36, summon cooldown 2600ms |
| こうげきねこ | attacker | slower but hits hard | cost 110, hp 105, attack 42, speed 0.58, summon cooldown 3200ms |

The first stage must still be winnable quickly. If cooldowns make the stage too slow, increase passive income slightly rather than lowering enemy readability.

## Summon Cooldown Design

Each ally type gets its own summon cooldown. Money and cooldown must both be valid before summoning.

Add to state:

```js
summonCooldowns: {
  neko: 0,
  tank: 0,
  battle: 0
}
```

Update every frame:

```js
state.summonCooldowns[kind] = Math.max(0, state.summonCooldowns[kind] - deltaMs);
```

Button behavior:

- disabled if the game is over
- disabled if money is too low
- disabled if cooldown is active
- label shows remaining time while cooling down, for example `あと1.2秒`

This adds strategy without adding a new screen.

## Combat Feedback Design

Add a lightweight `effects` array to state.

Effect types:

- `slash`: ally hit on enemy
- `impact`: enemy hit on ally
- `baseHit`: base damage
- `spark`: small hit burst
- `stageTitle`: intro overlay
- `clearBurst`: victory burst

Each effect contains:

```js
{
  type,
  x,
  y,
  life,
  maxLife,
  color,
  team
}
```

Rules:

- Add a slash/spark effect when a fighter damages another fighter.
- Add a base hit effect when a base takes damage.
- Keep damage numbers as `floatingTexts`; effects are visual impact, not text.
- Effects must expire automatically.
- Effects must not change gameplay values.

Rendering:

- ally slash: short gold/cyan diagonal stroke
- enemy impact: red pulse
- base hit: small shock ring around the base
- clear burst: several gold lines around the center banner

Keep effects code-native canvas drawing. No new assets are needed for this pass.

## Stage Presentation Design

Add stage metadata to the visible UI:

- header subtitle should show `大地編`
- message or overlay should show `大地をゆるがずワンワンステージ`

On reset:

- `stageIntroTimer` starts around 2200ms
- canvas displays a centered title overlay
- gameplay is not paused
- summon buttons are available during the intro
- the first enemy spawn timer gives the intro enough room before pressure starts

Recommended intro:

```text
大地編
大地をゆるがずワンワンステージ
```

Clear:

```text
STAGE CLEAR!
大地をゆるがずワンワンステージ クリア
勝利ボーナス +120
```

Lose:

```text
TRY AGAIN
大地編で作戦を立て直そう
```

## UI Design

Keep the current compact layout. Do not add a landing page.

Add only small improvements:

- stage/chapter text near the title or canvas overlay
- cooldown labels inside existing buttons
- no new menus
- no nested cards
- no save prompt

Button label states:

- ready: `まるねこ 50`
- no money: `まるねこ 50`
- cooldown: `まるねこ あと1.2秒`
- game over: disabled original label or `まるねこ 50`

Avoid text overflow on mobile. If the cooldown label is too long, use short wording: `あと1.2秒`.

## Testing Design

Update `scripts/verify-game-contract.js` to protect the new design:

- `STAGES` exists
- first stage includes `chapter: "大地編"`
- first stage includes `name: "大地をゆるがずワンワンステージ"`
- first stage keeps quick-win values
- summon cooldown values exist for all three allies
- state includes `summonCooldowns`
- state includes `effects`
- combat code adds an effect on hit
- UI updates button labels during cooldown
- result banner includes stage clear presentation
- no external communication APIs are introduced

Add or keep a mock-DOM test command for:

- clicking a summon button spends money
- clicking the same button immediately again is blocked by cooldown
- cooldown label changes
- restart resets cooldowns

## Safety Design

Preserve these constraints:

- no `fetch`
- no `XMLHttpRequest`
- no `localStorage`
- no `sessionStorage`
- no `eval`
- no external scripts
- no remote images
- no user input fields
- no save data

Static GitHub Pages remains the only deployment target.

## Cross-Responsibility Audit

### Game Balance

Risk: cooldowns can make the first stage feel slow.

Design answer: keep starting money at 180, keep enemy base HP at 70, and only use short cooldowns. If play feels slow, increase passive income or attack feedback before adding complexity.

### Visual Clarity

Risk: effects can cover characters or HP bars.

Design answer: effects are short-lived, drawn near hit points, and do not cover buttons or HUD. HP bars remain after sprites.

### Future Stages

Risk: adding stage data now could imply a stage select screen too early.

Design answer: `STAGES` supports the future, but only `stageIndex: 0` is playable. No extra UI until at least two real stages exist.

### Naming

Risk: stage name may be accidentally corrected by code or docs.

Design answer: keep the exact user-provided spelling `大地をゆるがずワンワンステージ`.

Risk: older memory notes used the temporary names `ねこ`, `タンクねこ`, and `バトルねこ`.

Design answer: the current canonical visible names are `まるねこ`, `かたいねこ`, and `こうげきねこ`. Implementation must preserve the existing asset paths and internal IDs unless there is a separate rename plan.

### Existing Tests

Risk: moving hardcoded values into `STAGES` can break existing regex-based tests.

Design answer: update contract tests in the same PR as implementation. Preserve the assertions, but point them at the new stage data.

### Single-File Constraint

Risk: `game.html` grows too large.

Design answer: keep one file for this phase. If a second playable stage or stage-select screen is added, revisit file splitting.

### Public Publishing

Risk: GitHub Pages caches old HTML briefly.

Design answer: verify Pages `built` status and fetch `game.html` with a commit query string after merge.

## Acceptance Checklist

The implementation is complete only when all are true:

- `game.html` contains the first stage data in `STAGES`
- the stage name appears in the start overlay
- the clear overlay mentions the stage clear
- all three ally units have summon cooldowns
- immediate double summon of the same unit is blocked
- button labels show cooldown remaining
- ally and enemy hits create visible effects
- base hits create visible effects
- `まるねこ`, `かたいねこ`, and `こうげきねこ` feel meaningfully different
- existing enemy roster and spawn mix are preserved
- first stage remains easy and quick
- no external communication or storage APIs are added
- contract tests pass
- mock summon/cooldown test passes
- browser screenshot confirms visible intro/effects/UI without overlap
- GitHub Pages reflects the merged result

## Implementation Order

1. Add failing contract tests for stage data, cooldowns, and effects.
2. Add `STAGES` and wire `resetGame()` to stage data.
3. Add summon cooldown state and button labels.
4. Add effects state and hit/base effect creation.
5. Add intro and clear overlays using stage data.
6. Tune ally role stats.
7. Update README with stage/chapter plan.
8. Verify locally and visually.
9. PR, merge, and verify GitHub Pages.
