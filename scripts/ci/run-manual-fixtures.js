#!/usr/bin/env node

"use strict";

const { spawnSync } = require("child_process");

const FIXTURE_GROUPS = {
  "game-runtime": [
    "scripts/verify-game-contract.js",
    "scripts/verify-game-runtime.js"
  ],
  "worker-runtime": [
    "scripts/verify-live-audience-worker.js"
  ],
  "design-evidence": [
    "scripts/verify-game-site-map.js",
    "scripts/verify-stage-map-design.js"
  ]
};

const SUITES = Object.freeze({
  ...FIXTURE_GROUPS,
  all: [...new Set(Object.values(FIXTURE_GROUPS).flat())]
});

function requestedSuite(argv) {
  if (argv.length !== 2 || argv[0] !== "--suite" || !Object.hasOwn(SUITES, argv[1])) {
    throw new Error(`usage: run-manual-fixtures.js --suite <${Object.keys(SUITES).join("|")}>`);
  }
  return argv[1];
}

function main() {
  const suite = requestedSuite(process.argv.slice(2));
  for (const test of SUITES[suite]) {
    const result = spawnSync(process.execPath, [test], { stdio: "inherit" });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`${test} failed with exit code ${result.status}`);
  }
  console.log(`manual fixture suite ${suite} passed: ${SUITES[suite].length} test file(s), 0 installs, 0 external effects`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
