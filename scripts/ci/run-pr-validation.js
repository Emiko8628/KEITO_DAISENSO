#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { spawnSync } = require("child_process");

function parseArguments(argv) {
  if (argv.length !== 2 || argv[0] !== "--plan") {
    throw new Error("usage: run-pr-validation.js --plan <file>");
  }
  return argv[1];
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
}

function validateHtml(file) {
  const html = fs.readFileSync(file, "utf8");
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  for (const [index, match] of scripts.entries()) {
    new vm.Script(match[1], { filename: `${file}#inline-script-${index + 1}` });
  }
}

function validateSyntax(file) {
  if (!fs.existsSync(file)) {
    console.log(`syntax skipped for deleted file: ${file}`);
    return;
  }
  const extension = path.extname(file).toLowerCase();
  if ([".js", ".cjs", ".mjs"].includes(extension)) {
    run(process.execPath, ["--check", file]);
  } else if (extension === ".json") {
    JSON.parse(fs.readFileSync(file, "utf8"));
  } else if ([".sh", ".bash"].includes(extension)) {
    run("bash", ["-n", file]);
  } else if ([".yml", ".yaml"].includes(extension)) {
    run("ruby", ["-rpsych", "-e", "Psych.parse_stream(File.read(ARGV.fetch(0)))", file]);
  } else if (extension === ".html") {
    validateHtml(file);
  }
}

function validatePlan(plan) {
  if (plan?.version !== 1 || !Array.isArray(plan.changedFiles) || !Array.isArray(plan.syntaxFiles) || !Array.isArray(plan.tests)) {
    throw new Error("invalid PR validation plan");
  }
  if (plan.installCount !== 0) throw new Error("this dependency-free repository must not install packages in CI");
  for (const file of [...plan.syntaxFiles, ...plan.tests]) {
    if (typeof file !== "string" || path.isAbsolute(file) || file.startsWith("../") || file.includes("/../")) {
      throw new Error(`unsafe plan path: ${String(file)}`);
    }
  }
}

function main() {
  const planPath = parseArguments(process.argv.slice(2));
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  validatePlan(plan);

  for (const file of plan.syntaxFiles) validateSyntax(file);
  for (const test of plan.tests) {
    if (!fs.existsSync(test)) throw new Error(`selected test does not exist: ${test}`);
    run(process.execPath, [test]);
  }

  console.log(`PR validation passed: ${plan.syntaxFiles.length} syntax file(s), ${plan.tests.length} test file(s), 0 installs`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
