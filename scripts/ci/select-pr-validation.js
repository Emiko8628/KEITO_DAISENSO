#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const TESTS = Object.freeze({
  contract: "scripts/verify-game-contract.js",
  runtime: "scripts/verify-game-runtime.js",
  worker: "scripts/verify-live-audience-worker.js",
  siteMap: "scripts/verify-game-site-map.js",
  stageDesign: "scripts/verify-stage-map-design.js",
  selector: "scripts/ci/select-pr-validation.test.js",
  actionsContract: "scripts/ci/verify-actions-contract.js"
});

const FULL_REGRESSION = Object.freeze(Object.values(TESTS));
const SAFE_SHA = /^[0-9a-f]{40}$/;

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function normalizeChangedFile(file) {
  if (typeof file !== "string" || file.length === 0 || file.includes("\0") || file.includes("\n")) {
    throw new Error("changed file names must be non-empty single-line strings");
  }

  const normalized = file.replaceAll("\\", "/");
  if (path.posix.isAbsolute(normalized) || normalized === ".." || normalized.startsWith("../") || normalized.includes("/../")) {
    throw new Error(`changed file escapes the repository: ${file}`);
  }
  return normalized.replace(/^\.\//, "");
}

function isLegacyFixture(file) {
  return file.startsWith("fixtures/legacy/") || file.startsWith(".github/workflow-evidence/");
}

function isGenericDocumentation(file) {
  return file.endsWith(".md") || file.endsWith(".txt");
}

function syntaxKind(file) {
  const extension = path.posix.extname(file).toLowerCase();
  if ([".js", ".cjs", ".mjs", ".json", ".sh", ".bash", ".yml", ".yaml", ".html"].includes(extension)) {
    return extension;
  }
  return null;
}

function testsForFile(file) {
  if (file === "package.json" || file.endsWith("-lock.json") || file === "npm-shrinkwrap.json") {
    return FULL_REGRESSION;
  }
  if (file.startsWith(".github/workflows/") || file.startsWith("scripts/ci/")) {
    return [TESTS.selector, TESTS.actionsContract];
  }
  if (file === "game.html") {
    return [TESTS.contract, TESTS.runtime];
  }
  if (file === "README.md") {
    return [TESTS.contract, TESTS.siteMap];
  }
  if (file === "wrangler.toml" || file === "workers/live-audience.mjs") {
    return [TESTS.contract, TESTS.worker];
  }
  if (file.startsWith("assets/")) {
    return [TESTS.contract, TESTS.runtime, TESTS.stageDesign];
  }
  if (file === "docs/game-site-map.md") {
    return [TESTS.siteMap, TESTS.stageDesign];
  }
  if (file === "docs/superpowers/specs/2026-06-29-stage-map-selection-design.md") {
    return [TESTS.stageDesign];
  }
  if (file === TESTS.contract || file === TESTS.runtime || file === TESTS.worker || file === TESTS.siteMap || file === TESTS.stageDesign) {
    return [file];
  }
  if (file === "index.html") {
    return [];
  }
  if (!isGenericDocumentation(file) && !isLegacyFixture(file)) {
    return FULL_REGRESSION;
  }
  return [];
}

function buildPlan(changedFiles) {
  const files = uniqueSorted(changedFiles.map(normalizeChangedFile));
  const tests = [];
  const syntaxFiles = [];

  for (const file of files) {
    if (syntaxKind(file)) syntaxFiles.push(file);
    tests.push(...testsForFile(file));
  }

  const documentationOnly = files.length > 0 && files.every(isGenericDocumentation);
  const legacyFixtureOnly = files.length > 0 && files.every(isLegacyFixture);
  const dependencyManifestChanged = files.some(
    (file) => file === "package.json" || file.endsWith("-lock.json") || file === "npm-shrinkwrap.json"
  );

  return {
    version: 1,
    changedFiles: files,
    documentationOnly,
    legacyFixtureOnly,
    dependencyManifestChanged,
    installCount: 0,
    syntaxFiles: uniqueSorted(syntaxFiles),
    tests: uniqueSorted(tests)
  };
}

function parseArguments(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) throw new Error(`invalid argument near ${key || "<end>"}`);
    result[key.slice(2)] = value;
  }
  return result;
}

function changedFilesBetween(base, head) {
  if (!SAFE_SHA.test(base) || !SAFE_SHA.test(head)) throw new Error("base and head must be exact 40-character lowercase commit SHAs");
  const output = execFileSync("git", ["diff", "--name-only", "-z", "--diff-filter=ACMRD", `${base}...${head}`], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024
  });
  return output.split("\0").filter(Boolean);
}

function writeGithubOutput(file, plan) {
  const lines = [
    `documentation_only=${plan.documentationOnly}`,
    `legacy_fixture_only=${plan.legacyFixtureOnly}`,
    `dependency_manifest_changed=${plan.dependencyManifestChanged}`,
    `install_count=${plan.installCount}`,
    `test_count=${plan.tests.length}`
  ];
  fs.appendFileSync(file, `${lines.join("\n")}\n`, "utf8");
}

function main() {
  const args = parseArguments(process.argv.slice(2));
  if (!args.base || !args.head || !args.plan) {
    throw new Error("usage: select-pr-validation.js --base <sha> --head <sha> --plan <file> [--github-output <file>]");
  }

  const plan = buildPlan(changedFilesBetween(args.base, args.head));
  fs.mkdirSync(path.dirname(args.plan), { recursive: true });
  fs.writeFileSync(args.plan, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  if (args["github-output"]) writeGithubOutput(args["github-output"], plan);
  console.log(`selected ${plan.tests.length} test file(s) for ${plan.changedFiles.length} changed file(s); installs=${plan.installCount}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { FULL_REGRESSION, TESTS, buildPlan, normalizeChangedFile, syntaxKind, testsForFile };
