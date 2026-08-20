"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const npmCommand = "npm";

function run(label, command, args) {
  console.log(`\n[Release Gate] ${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32"
  });
  if (result.error) {
    console.error(`FAIL: ${result.error.message}`);
    return false;
  }
  if (result.status !== 0) {
    console.error(`FAIL: ${label} (exit ${result.status ?? "unknown"})`);
    return false;
  }
  console.log(`PASS: ${label}`);
  return true;
}

function checkStaticReleasePolicy() {
  const htmlFiles = ["index.html", "chordwiki-preview.html", "committed-preview.html", "privacy.html"];
  const requiredCspDirectives = ["object-src 'none'", "base-uri 'none'", "form-action 'none'"];
  const failures = [];

  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    if (!html.includes('http-equiv="Content-Security-Policy"')) failures.push(`${file}: CSPがない`);
    for (const directive of requiredCspDirectives) {
      if (!html.includes(directive)) failures.push(`${file}: CSPに${directive}がない`);
    }
    if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html)) {
      failures.push(`${file}: インラインscriptを検出`);
    }
    if (/<script[^>]+src=["']javascript:/i.test(html)) {
      failures.push(`${file}: javascript: script URLを検出`);
    }
  }

  const sourceFiles = ["index.html", "chordwiki-preview.html", "committed-preview.html", "privacy.html"];
  for (const file of sourceFiles) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    if (/href=["']javascript:/i.test(html)) failures.push(`${file}: javascript:リンクを検出`);
  }

  if (failures.length) {
    failures.forEach((failure) => console.error(`FAIL: ${failure}`));
    return false;
  }
  console.log("PASS: 公開HTMLのCSP・script URL・javascript:リンク静的検査");
  console.log("INFO: lint設定は未導入のため、既存のNode構文検査を静的チェックとして実行");
  return true;
}

function checkBuildOutput() {
  const required = ["index.html", "chordwiki-preview.html", "committed-preview.html", "privacy.html"];
  const missing = required.filter((file) => !fs.existsSync(path.join(root, "dist", file)));
  if (missing.length) {
    missing.forEach((file) => console.error(`FAIL: dist/${file} が生成されていない`));
    return false;
  }
  console.log(`PASS: build成果物（${required.length}入口）を確認`);
  return true;
}

const steps = [
  ["unit / regression / syntax", npmCommand, ["test"]],
  ["公開HTMLの静的・セキュリティ検査", null, null],
  ["production build", npmCommand, ["run", "build"]]
];

let passed = true;
let buildPassed = false;
for (const [label, command, args] of steps) {
  if (command) {
    const stepPassed = run(label, command, args);
    if (label === "production build") buildPassed = stepPassed;
    passed = stepPassed && passed;
  }
  else passed = checkStaticReleasePolicy() && passed;
}
if (buildPassed) passed = checkBuildOutput() && passed;

if (!passed) {
  console.error("\nRELEASE GATE: FAIL — 公開を止めてください。");
  process.exit(1);
}
console.log("\nRELEASE GATE: PASS — 自動チェックはすべて成功しました。");
