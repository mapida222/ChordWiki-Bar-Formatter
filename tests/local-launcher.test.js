"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const launcherPath = path.join(__dirname, "..", "start-local.bat");
const launcher = fs.readFileSync(launcherPath, "utf8");

assert.match(launcher, /cd \/d "%~dp0"/i, "the launcher works independently of the shortcut working directory");
assert.match(launcher, /http:\/\/127\.0\.0\.1:5173\//, "the readiness check and browser use the fixed local address");
assert.match(launcher, /Invoke-WebRequest/i, "the launcher waits for an HTTP response before opening the browser");
assert.match(launcher, /npm\.cmd run dev -- --host 127\.0\.0\.1 --port 5173 --strictPort/i, "Vite uses the checked address and refuses silent port changes");
assert.ok(
  launcher.indexOf("Invoke-WebRequest") < launcher.indexOf("npm.cmd run dev"),
  "the readiness watcher must start before the foreground Vite process"
);

console.log("PASS: local launcher waits for Vite and uses a stable address");
