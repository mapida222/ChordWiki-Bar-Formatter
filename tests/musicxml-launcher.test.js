"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const launcher = fs.readFileSync(path.join(root, "open-musicxml-converter.bat"), "utf8");
const scriptPath = path.join(root, "open-musicxml-converter.ps1");

assert.match(launcher, /open-musicxml-converter\.ps1/i, "the bat must delegate browser opening to the launcher script");
assert.ok(fs.existsSync(scriptPath), "the launcher script must exist");

const script = fs.readFileSync(scriptPath, "utf8");
assert.match(script, /musicxml-converter\.html/i, "the launcher must wait for the MusicXML page");
assert.match(script, /Invoke-WebRequest/i, "the launcher must probe the local page before opening it");
assert.match(script, /Start-Process.*npm\.cmd/is, "the launcher must start Vite when the page is not running");
assert.match(script, /Start-Process.*\$appUrl/is, "the launcher must explicitly open the page in the default browser");
assert.match(script, /Wait-Process.*\$serverProcess/is, "the launcher must keep Vite alive after opening the page");
