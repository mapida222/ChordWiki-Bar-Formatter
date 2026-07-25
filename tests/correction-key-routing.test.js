"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

const correctionKeydownRoutes = app.match(/elements\.correction\.addEventListener\("keydown"/g) || [];
assert.strictEqual(correctionKeydownRoutes.length, 1, "row-edit keyboard input must have exactly one keydown route");
assert.ok(!app.includes('elements.correction.addEventListener("beforeinput"'), "row-edit input must not be replayed by a second beforeinput route");
assert.ok(html.includes('js/app.js?v=20260725-11'), "the row-edit hotfix must use the current app.js cache version");

console.log("PASS: row-edit keys use one input route and the browser loads the hotfix version");
