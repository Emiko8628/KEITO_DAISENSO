const fs = require("fs");
const assert = require("assert");

const specPath = "docs/superpowers/specs/2026-06-29-stage-map-selection-design.md";
const siteMapPath = "docs/game-site-map.md";
const gamePath = "game.html";

assert(fs.existsSync(specPath), `${specPath} must exist`);

const spec = fs.readFileSync(specPath, "utf8");
const siteMap = fs.readFileSync(siteMapPath, "utf8");
const game = fs.readFileSync(gamePath, "utf8");

const requiredSections = [
  "# Stage Map And Selection Design",
  "## Purpose",
  "## Already Implemented",
  "## Not Implemented Yet",
  "## Recommended Approach",
  "## UX Requirements",
  "## Data Model Requirements",
  "## Runtime Boundary",
  "## Safety Requirements",
  "## Verification Requirements",
  "## Defer",
  "## Recommended Next Implementation"
];

for (const section of requiredSections) {
  assert(spec.includes(section), `stage-map design must include section: ${section}`);
}

const implementedEvidence = [
  "STAGES[0]",
  "state.stageIndex",
  "currentStage()",
  "assets/base-enemy-stage-2-beach-castle.png",
  "assets/base-enemy-stage-3-forest-castle.png",
  "assets/base-enemy-stage-4-ghost-castle.png",
  "beach-defense-01",
  "forest-preview-01",
  "ghost-night-preview-01",
  "assets/stage-beach-background.png",
  "game_open` remains once per page session",
  "scripts/verify-game-contract.js",
  "scripts/verify-game-runtime.js",
  "scripts/verify-live-audience-worker.js",
  "scripts/verify-game-site-map.js"
];

for (const evidence of implementedEvidence) {
  assert(spec.includes(evidence), `stage-map design must reference implemented evidence: ${evidence}`);
}

const safetyBoundaries = [
  "Do not change the public URL",
  "Do not add a new external provider",
  "Do not add cookies, localStorage, sessionStorage, profile data, account data, or IP storage",
  "Do not expand Google Analytics payloads",
  "Do not create a VPS deployment path",
  "Do not make locked stages playable without battle data and tests"
];

for (const boundary of safetyBoundaries) {
  assert(spec.includes(boundary), `stage-map design must include safety boundary: ${boundary}`);
}

assert(
  siteMap.includes("[Stage Map And Selection Design](superpowers/specs/2026-06-29-stage-map-selection-design.md)"),
  "game site map must link to the stage-map selection design"
);

assert(game.includes("const STAGES = ["), "game must still define STAGES");
assert(game.includes("stageIndex: 0"), "game must keep the Stage 1 playable map node");
assert(game.includes("stageIndex: 1"), "game must keep the Stage 2 playable map node");
assert(game.includes("const FUTURE_ENEMY_BASE_SPRITES = Object.freeze"), "game must still keep future enemy base sprites prepared");
assert(game.includes('id: "beach-defense-01"'), "game must expose the stage 2 beach playable node");
assert(game.includes('id: "forest-preview-01"'), "game must expose the stage 3 forest preview node");
assert(game.includes('id: "ghost-night-preview-01"'), "game must expose the stage 4 ghost-night preview node");

assert(fs.existsSync("assets/stage-beach-background.png"), "stage 2 beach background asset must exist");
assert(fs.existsSync("assets/base-enemy-stage-2-beach-castle.png"), "stage 2 beach preview base asset must exist");
assert(fs.existsSync("assets/base-enemy-stage-3-forest-castle.png"), "stage 3 forest preview base asset must exist");
assert(fs.existsSync("assets/base-enemy-stage-4-ghost-castle.png"), "stage 4 ghost-night preview base asset must exist");

const stage2PlayableImplementation = [
  "Stage 2 Playable Implementation",
  "assets/stage-beach-background.png",
  "GAME_ASSETS.backgrounds.beach",
  "STAGES[1]",
  "beach-defense-01",
  "ざぶざぶビーチ防衛戦",
  "Stage 3 and Stage 4 must remain locked"
];

for (const implemented of stage2PlayableImplementation) {
  assert(spec.includes(implemented), `stage-map design must document Stage 2 playable implementation: ${implemented}`);
}

assert(
  !/\b(TBD|TODO|FIXME|later)\b/i.test(spec),
  "stage-map design must not contain placeholders"
);

console.log("stage map design verification passed");
