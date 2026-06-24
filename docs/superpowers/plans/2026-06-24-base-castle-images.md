# Base Castle Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the canvas-drawn ally and first-stage enemy bases with local castle images while preparing second- and third-stage enemy castle assets.

**Architecture:** Keep `game.html` as the single runtime file. Add a tiny base-image asset pipeline parallel to the existing character sprite and stage background loaders, then fall back to the current canvas base renderer whenever an image is missing. Stage data owns enemy base images; the ally base image is shared.

**Tech Stack:** Static HTML canvas, local PNG assets, Node verification scripts, GitHub Pages.

---

### Task 1: Add Base Image Contract

**Files:**
- Modify: `scripts/verify-game-contract.js`

- [x] **Step 1: Add expected base image asset checks**

Add constants for the four new base image files:

```js
const requiredBaseSprites = [
  "assets/base-ally-blue-castle.png",
  "assets/base-enemy-stage-1-gold-castle.png",
  "assets/base-enemy-stage-2-green-castle.png",
  "assets/base-enemy-stage-3-red-black-castle.png"
];
```

Assert each file exists, `game.html` references each file, `ALLY_BASE_SPRITE` exists, `enemyBaseSprite` exists in stage data, and base images are preloaded by a `loadBaseImages()` function.

- [x] **Step 2: Run contract verifier and confirm RED**

Run:

```sh
node scripts/verify-game-contract.js
```

Expected: FAIL because the new base files and loader do not exist yet.

### Task 2: Add Processed Castle Assets

**Files:**
- Create: `assets/base-ally-blue-castle.png`
- Create: `assets/base-enemy-stage-1-gold-castle.png`
- Create: `assets/base-enemy-stage-2-green-castle.png`
- Create: `assets/base-enemy-stage-3-red-black-castle.png`

- [x] **Step 1: Convert supplied images into transparent, cropped local PNG assets**

Use a local image-processing script or tool to remove the white/gray background, crop transparent margins, and keep the castle art centered.

- [x] **Step 2: Inspect generated assets**

Run:

```sh
file assets/base-ally-blue-castle.png assets/base-enemy-stage-1-gold-castle.png assets/base-enemy-stage-2-green-castle.png assets/base-enemy-stage-3-red-black-castle.png
```

Expected: all four are PNG images.

### Task 3: Wire Base Image Loading And Drawing

**Files:**
- Modify: `game.html`

- [x] **Step 1: Add base image metadata**

Add:

```js
const ALLY_BASE_SPRITE = "assets/base-ally-blue-castle.png";
```

Add `enemyBaseSprite: "assets/base-enemy-stage-1-gold-castle.png"` to the first stage and keep references to the second- and third-stage enemy base sprites in a future asset list.

- [x] **Step 2: Add base image cache and loader**

Add a `baseImageCache` map and `loadBaseImages()` function that preloads the ally base sprite, the active stage enemy base sprite, and the future enemy base sprites.

- [x] **Step 3: Draw image bases with fallback**

Update `drawBaseStructure(x, hp, team)` so it tries `drawBaseImage(x, team)` first. If no image is loaded, keep the existing canvas base renderer.

- [x] **Step 4: Call the loader during startup**

Call `loadBaseImages()` next to the existing character sprite and background preload calls.

### Task 4: Update Docs And Verification

**Files:**
- Modify: `README.md`
- Modify: `scripts/verify-game-runtime.js`

- [x] **Step 1: Document image-based base art**

Add a short README note that the current ally base and first enemy base use local image assets, and that stage 2/3 enemy castle images are prepared.

- [x] **Step 2: Add runtime smoke checks**

Extend the runtime verifier to confirm `__keitoRuntimeProbe` or script text exposes image-base drawing with fallback, without requiring real browser image loading.

- [x] **Step 3: Run verifiers**

Run:

```sh
node scripts/verify-game-contract.js
node scripts/verify-game-runtime.js
node scripts/verify-live-audience-worker.js
git diff --check
```

Expected: all pass with exit code 0.

### Task 5: Finish Branch

**Files:**
- All modified files

- [x] **Step 1: Review diff**

Run:

```sh
git diff --stat
git diff -- game.html README.md scripts/verify-game-contract.js scripts/verify-game-runtime.js
```

- [ ] **Step 2: Commit and open PR**

Commit only this feature's files and open a PR after tests pass.
