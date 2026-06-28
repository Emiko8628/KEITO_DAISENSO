const fs = require("fs");
const assert = require("assert");

const siteMapPath = "docs/game-site-map.md";
const readmePath = "README.md";

assert(fs.existsSync(siteMapPath), `${siteMapPath} must exist`);

const siteMap = fs.readFileSync(siteMapPath, "utf8");
const readme = fs.readFileSync(readmePath, "utf8");

const requiredSections = [
  "# KEITO_DAISENSO Game Site Map",
  "## Current Site Map",
  "## Game Responsibility Map",
  "## Public Communication And Safety Map",
  "## Verification Map",
  "## Next Improvement Queue",
  "## Change Boundaries"
];

for (const section of requiredSections) {
  assert(siteMap.includes(section), `site map must include section: ${section}`);
}

const requiredReferences = [
  "index.html",
  "game.html",
  "README.md",
  "workers/live-audience.mjs",
  "wrangler.toml",
  "assets/",
  "scripts/verify-game-contract.js",
  "scripts/verify-game-runtime.js",
  "scripts/verify-live-audience-worker.js",
  "scripts/verify-game-site-map.js"
];

for (const reference of requiredReferences) {
  assert(siteMap.includes(reference), `site map must reference: ${reference}`);
}

const requiredExistingFiles = [
  "index.html",
  "game.html",
  "README.md",
  "workers/live-audience.mjs",
  "wrangler.toml",
  "scripts/verify-game-contract.js",
  "scripts/verify-game-runtime.js",
  "scripts/verify-live-audience-worker.js",
  "scripts/verify-game-site-map.js"
];

for (const file of requiredExistingFiles) {
  assert(fs.existsSync(file), `site map referenced file must exist: ${file}`);
}

assert(
  readme.includes("[ゲームサイト設計マップ](docs/game-site-map.md)"),
  "README must link to the game site map"
);

assert(
  siteMap.includes("Public URL remains `https://emiko8628.github.io/KEITO_DAISENSO/game.html`"),
  "site map must preserve the current public URL boundary"
);

assert(
  siteMap.includes("VPS | Not used"),
  "site map must state that this project does not use VPS deployment"
);

assert(
  siteMap.includes("Do not send names, emails, input text, or personal data"),
  "site map must document analytics privacy safety"
);

assert(
  siteMap.includes("Do not add cookies, localStorage, sessionStorage, IP storage, or user profiles"),
  "site map must document live audience privacy safety"
);

assert(
  !/\b(TBD|TODO|FIXME|later)\b/i.test(siteMap),
  "site map must not contain placeholders"
);

console.log("game site map verification passed");
