"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const launcherPath = path.join(__dirname, "..", "start-local.bat");
const launcher = fs.readFileSync(launcherPath, "utf8");

assert.match(launcher, /cd \/d "%~dp0"/i, "the launcher works independently of the shortcut working directory");
assert.match(launcher, /Invoke-WebRequest[\s\S]+127\.0\.0\.1:5173/i, "the launcher detects an already-running local server");
assert.match(launcher, /if not errorlevel 1[\s\S]+start "" "http:\/\/127\.0\.0\.1:5173\/"/i, "an existing server opens directly instead of failing on the occupied port");
assert.match(
  launcher,
  /npm\.cmd run dev -- --host 127\.0\.0\.1 --port 5173 --strictPort --open/i,
  "Vite uses the fixed address, refuses silent port changes, and opens the browser after startup"
);

console.log("PASS: local launcher reuses an existing server and delegates fresh startup opening to Vite");
