"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const testsDirectory = path.join(root, "tests");
const tests = fs.readdirSync(testsDirectory)
  .filter((name) => name.endsWith(".test.js"))
  .sort();

let failures = 0;
for (const test of tests) {
  const result = spawnSync(process.execPath, [path.join(testsDirectory, test)], {
    cwd: root,
    encoding: "utf8"
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) failures += 1;
}

for (const file of ["js/app.js", "js/converter.js", "js/numeric-entry.js"]) {
  const result = spawnSync(process.execPath, ["--check", path.join(root, file)], {
    cwd: root,
    encoding: "utf8"
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) failures += 1;
}

if (failures) {
  console.error(`FAIL: ${failures}件のテストまたは構文検査が失敗しました。`);
  process.exit(1);
}

console.log(`PASS: ${tests.length}件のテストとJavaScript構文検査に成功しました。`);
