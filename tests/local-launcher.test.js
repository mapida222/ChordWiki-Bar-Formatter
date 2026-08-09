"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const launcherPath = path.join(__dirname, "..", "start-local.bat");
const launcher = fs.readFileSync(launcherPath, "utf8");

assert.match(launcher, /cd \/d "%~dp0"/i, "the launcher works independently of the shortcut working directory");
assert.match(
  launcher,
  /npm\.cmd run dev -- --host 127\.0\.0\.1 --port 5173 --strictPort --open/i,
  "Vite uses the fixed address, refuses silent port changes, and opens the browser after startup"
);
assert.doesNotMatch(launcher, /^start\s/m, "the launcher must not race Vite by opening the browser itself");

console.log("PASS: local launcher delegates post-startup browser opening to Vite");
