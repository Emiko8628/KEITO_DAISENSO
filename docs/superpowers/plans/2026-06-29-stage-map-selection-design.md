# Stage Map Selection Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Document the stage-map and stage-selection boundary so the next gameplay UI pass can add a visible stage path safely.

**Architecture:** Add a focused spec under `docs/superpowers/specs/`, link it from the game site map, and add a Node verifier that checks the spec's safety requirements and existing stage-map prerequisites.

**Tech Stack:** Markdown documentation, Node.js verification script, existing static HTML/Canvas game, GitHub Pages.

---

### Task 1: Add Stage Map Selection Design

**Files:**
- Create: `docs/superpowers/specs/2026-06-29-stage-map-selection-design.md`

- [x] **Step 1: Document implemented and missing responsibilities**

Record that `STAGES`, `state.stageIndex`, current stage labels, and future base art are already present, while the stage-map visual surface and locked-node behavior are not implemented yet.

- [x] **Step 2: Define the next implementation boundary**

Specify that the next code PR should add one playable Stage 1 node and locked previews for Stage 2 and Stage 3 without adding persistence, new providers, or extra playable stages.

### Task 2: Link And Verify The Design

**Files:**
- Modify: `docs/game-site-map.md`
- Create: `scripts/verify-stage-map-design.js`

- [x] **Step 1: Link the stage-map design from the site map**

Add the design spec to the "Next Improvement Queue" entry for stage map and stage selection.

- [x] **Step 2: Add a verifier**

Verify the design exists, references current implemented evidence, includes safety boundaries, and avoids placeholder text.

### Task 3: Run Cross-Repo Gates

**Files:**
- Existing verification scripts only

- [x] **Step 1: Run documentation and game gates**

Run:

```sh
node scripts/verify-stage-map-design.js
node scripts/verify-game-site-map.js
node scripts/verify-game-contract.js
node scripts/verify-game-runtime.js
node scripts/verify-live-audience-worker.js
git diff --check
```

Expected: all commands pass. This is a design-only change; no `game.html`, GA, Cloudflare Worker, public URL, credential, or VPS behavior should change.
