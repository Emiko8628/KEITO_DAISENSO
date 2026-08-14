#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");
const assert = require("assert");

const workflowDirectory = ".github/workflows";
const workflowFiles = fs.readdirSync(workflowDirectory)
  .filter((file) => /\.ya?ml$/.test(file))
  .sort();

assert.deepStrictEqual(
  workflowFiles,
  ["manual-fixture-validation.yml", "pr-validation.yml"],
  "exactly the two intended repository-authored workflows must be executable"
);

const sources = Object.fromEntries(
  workflowFiles.map((file) => [file, fs.readFileSync(path.join(workflowDirectory, file), "utf8")])
);

for (const [file, source] of Object.entries(sources)) {
  assert(!/^\s*push\s*:/m.test(source), `${file} must not have a push trigger`);
  assert(!/^\s*schedule\s*:/m.test(source), `${file} must not have a schedule trigger`);
  assert.strictEqual((source.match(/\bnpm\s+(?:ci|install)\b/g) || []).length, 0, `${file} must not install dependencies`);
  assert(!/\b(?:ssh|scp|rsync|wrangler\s+deploy)\b/.test(source), `${file} must not contain a deploy or remote-execution command`);
  assert(!/secrets\s*\./.test(source), `${file} must not read repository secrets`);
  assert.match(source, /permissions:\n  contents: read\n/, `${file} must grant only contents read`);
  assert.match(source, /persist-credentials: false/, `${file} must not retain the GitHub token in git config`);
}

const pr = sources["pr-validation.yml"];
assert.match(pr, /^  pull_request:\n    types: \[opened, synchronize, reopened, ready_for_review\]$/m);
assert(!/^\s*workflow_dispatch\s*:/m.test(pr), "PR validation must not be manually dispatched");
assert.match(pr, /group: pr-validation-\$\{\{ github\.event\.pull_request\.number \}\}/);
assert.match(pr, /cancel-in-progress: true/);
assert.match(pr, /ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
assert.match(pr, /fetch-depth: 0/);
assert.strictEqual((pr.match(/^    runs-on:/gm) || []).length, 1, "PR validation must use one job");

const manual = sources["manual-fixture-validation.yml"];
assert.match(manual, /^  workflow_dispatch:\n/m);
assert(!/^\s*pull_request\s*:/m.test(manual), "manual fixtures must not run for pull requests");
assert.strictEqual((manual.match(/^    runs-on:/gm) || []).length, 1, "manual fixture validation must use one job");
assert.match(manual, /FIXTURE_SUITE: \$\{\{ inputs\.suite \}\}/);

console.log("GitHub Actions contract passed: 2 repository workflows, 0 push triggers, 0 installs, read-only permissions");
