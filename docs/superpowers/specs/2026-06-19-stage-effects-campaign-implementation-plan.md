# Stage Effects Campaign Implementation Plan

> Historical note: this plan was stored under `docs/superpowers/specs/` because the local workspace repeatedly removed the same file under `docs/superpowers/plans/` after content writes. Do not treat it as the active implementation plan for clear-condition rules.
>
> Superseded note: the experience-based clear tasks in this plan have been replaced by `docs/superpowers/specs/2026-06-23-victory-objective-readability-design.md`. Experience now gives a notice only; destroying the enemy base clears the stage.

**Goal:** Implement `大地編 / 大地をゆるがすワンワンステージ` with stage data, experience-to-clear progress, summon cooldowns, hit effects, and start/clear presentation.

**Architecture:** Keep the game as static `game.html`, but move first-stage constants into `STAGES`. Add one dependency-free runtime verifier so future changes can be checked automatically without build tooling.

**Tech Stack:** HTML, CSS, JavaScript, Canvas 2D, Node.js scripts, GitHub Pages.

## Preserve

- Right side is the player base; left side is the enemy base.
- Ally names stay `まるねこ`, `かたいねこ`, `こうげきねこ`.
- Enemy names stay `ぴょこネコ`, `にょろゴースト`, `わちゃわちゃトリオ`.
- Local image assets and image fallback stay in place.
- No network calls, storage APIs, external scripts, save data, or VPS requirement.

## Tasks

1. Add failing contract checks in `scripts/verify-game-contract.js` for `STAGES`, `大地編`, exact stage name, target experience, cooldowns, effects, intro timer, and experience clear text.
2. Add `STAGES`, stage/chapter UI, and `経験値 0 / 100` HUD to `game.html`.
3. Add `scripts/verify-game-runtime.js` with a mock DOM checking initial experience, summon spending, cooldown blocking, and restart reset.
4. Historical task: add `addExperience`, enemy defeat experience, enemy-base damage experience, and the original clear rule. This clear-rule part is superseded.
5. Add per-unit summon cooldowns and ally role tuning.
6. Add `effects`, `addEffect`, `updateEffects`, and `drawEffects` for slash, impact, spark, base hit, and clear burst.
7. Add stage intro overlay and improved clear overlay.
8. Update `README.md` with current chapter, stage, and experience rules.
9. Run static, runtime, safety, and visual QA.
10. PR, merge, main sync, and GitHub Pages verification.

## Required Verification

```bash
node scripts/verify-game-contract.js
node scripts/verify-game-runtime.js
git diff --check
rg -n "fetch\\(|XMLHttpRequest|localStorage|sessionStorage|eval\\(|https?://|<script src" game.html index.html README.md scripts assets docs
```

Expected safety result:

- no forbidden API hits in `game.html`
- README may contain the GitHub repository URL

## Visual QA

Use a temporary copy of `game.html`, force `addExperience(100, WIDTH / 2, 120); checkResult(); draw();`, capture Chrome at `1120x760`, and inspect with `view_image`.

Confirm:

- chapter and stage are visible
- HUD includes experience
- summon buttons fit
- clear text fits
- effects do not cover controls
- base margins remain mirrored

## Done Definition

- Tests pass.
- Visual QA passes.
- Worktree is clean on `main`.
- GitHub Pages serves HTML containing `大地編`, exact stage name, `経験値`, `summonCooldowns`, and `drawEffects`. The old experience-fill clear copy requirement is superseded.
- VPS is not used because the deployment target is GitHub Pages.
