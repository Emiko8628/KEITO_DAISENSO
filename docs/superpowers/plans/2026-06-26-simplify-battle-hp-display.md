# Simplify Battle HP Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide character HP bars and attack-damage numbers, then show only numeric `current / max` HP above each base.

**Architecture:** Keep all battle state and damage calculation unchanged. Change only render/UI responsibilities in `game.html`: fighters keep internal HP, base HP remains in state, and base HP is drawn as text above each castle instead of a bar or HOME/BOSS labels.

**Tech Stack:** Static HTML canvas, inline JavaScript, Node verification scripts, GitHub Pages.

---

### Task 1: Add Display Contract Tests

**Files:**
- Modify: `scripts/verify-game-contract.js`
- Modify: `scripts/verify-game-runtime.js`

- [x] **Step 1: Add contract checks**

Require:
- no `HOME` / `BOSS` base HUD labels in the top stats
- no fighter HP bar draw call in `drawFighter`
- no base HP bar draw call in `drawBase`
- base HP text renderer exists
- attack damage no longer calls `addFloatingText`
- reward and EXP floating text still exist

- [x] **Step 2: Run contract verifier and confirm RED**

Run:

```sh
node scripts/verify-game-contract.js
```

Expected: FAIL before implementation because old HP bars and attack damage numbers are still present.

### Task 2: Implement Display Changes

**Files:**
- Modify: `game.html`

- [x] **Step 1: Simplify HUD base stats**

Remove the visible top HUD HOME/BOSS entries and keep defeat count.

- [x] **Step 2: Replace base HP bar with numeric base HP text**

Add a `drawBaseHpText(x, hp, maxHp)` helper and call it from `drawBase`.

- [x] **Step 3: Hide character HP bars**

Remove the fighter `drawHpBar` call while keeping internal fighter HP and hit flash.

- [x] **Step 4: Hide attack-damage numbers**

Remove `addFloatingText(... -attack ...)` for fighter and base attacks. Keep `addEffect`, rewards, EXP, and experience notices.

### Task 3: Verify And Ship

**Files:**
- All modified files

- [x] **Step 1: Run local verification**

Run:

```sh
node scripts/verify-game-contract.js
node scripts/verify-game-runtime.js
node scripts/verify-live-audience-worker.js
git diff --check
```

- [x] **Step 2: Visual check**

Open or screenshot `game.html` and confirm:
- no character HP bars
- no attack-damage numbers
- base HP appears above castles as `current / max`
- top HUD no longer shows HOME/BOSS labels

- [ ] **Step 3: PR, merge, Pages check**

Create PR, merge after verification, update `main`, and confirm GitHub Pages serves the updated HTML.
