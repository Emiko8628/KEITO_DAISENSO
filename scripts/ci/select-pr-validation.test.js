#!/usr/bin/env node

"use strict";

const assert = require("assert");
const { FULL_REGRESSION, TESTS, buildPlan, normalizeChangedFile } = require("./select-pr-validation");

function sameMembers(actual, expected, message) {
  assert.deepStrictEqual([...actual].sort(), [...expected].sort(), message);
}

const docsOnly = buildPlan(["docs/superpowers/plans/example.md"]);
assert.strictEqual(docsOnly.documentationOnly, true);
assert.strictEqual(docsOnly.legacyFixtureOnly, false);
assert.deepStrictEqual(docsOnly.tests, []);
assert.strictEqual(docsOnly.installCount, 0);

const contractDocs = buildPlan(["README.md"]);
assert.strictEqual(contractDocs.documentationOnly, true);
sameMembers(contractDocs.tests, [TESTS.contract, TESTS.siteMap], "README should run only its lightweight contract owners");

const fixtureOnly = buildPlan(["fixtures/legacy/runtime-case.json"]);
assert.strictEqual(fixtureOnly.legacyFixtureOnly, true);
assert.deepStrictEqual(fixtureOnly.tests, []);
assert.deepStrictEqual(fixtureOnly.syntaxFiles, ["fixtures/legacy/runtime-case.json"]);

const application = buildPlan(["game.html"]);
sameMembers(application.tests, [TESTS.contract, TESTS.runtime], "game changes should select the game dependency owners");
assert.deepStrictEqual(application.syntaxFiles, ["game.html"]);

const worker = buildPlan(["workers/live-audience.mjs"]);
sameMembers(worker.tests, [TESTS.contract, TESTS.worker], "worker changes should select worker contracts");

const lockfile = buildPlan(["package-lock.json"]);
sameMembers(lockfile.tests, FULL_REGRESSION, "lockfile changes should select the broadest local regression");
assert.strictEqual(lockfile.dependencyManifestChanged, true);
assert.strictEqual(lockfile.installCount, 0, "a lockfile name must not introduce a package install owner into this repository");

const ciOwner = buildPlan([".github/workflows/pr-validation.yml"]);
sameMembers(ciOwner.tests, [TESTS.selector, TESTS.actionsContract], "workflow changes should test the CI owner and its contract");

const deduplicated = buildPlan(["game.html", "scripts/verify-game-runtime.js"]);
assert.strictEqual(deduplicated.tests.filter((test) => test === TESTS.runtime).length, 1);

assert.throws(() => normalizeChangedFile("../outside.js"), /escapes the repository/);
assert.throws(() => normalizeChangedFile("bad\nname.js"), /single-line/);

console.log("PR validation selector tests passed: 10 cases");
