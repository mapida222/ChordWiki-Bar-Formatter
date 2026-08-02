"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
const handler = app.match(/elements\.correctionRefreshLine\.addEventListener\("click", \(\) => \{([\s\S]*?)\n  \}\);/);

assert(handler, "the current-row refresh handler must exist");
assert(handler[1].includes("const scrollPositions = captureEditorScrollPositions();"));
assert(handler[1].includes("keepOutputAndRefreshCorrection(lineIndex);"));
assert(handler[1].includes("restoreEditorScrollPositions(scrollPositions);"));
assert(
  handler[1].indexOf("captureEditorScrollPositions()") < handler[1].indexOf("keepOutputAndRefreshCorrection(lineIndex)")
    && handler[1].indexOf("keepOutputAndRefreshCorrection(lineIndex)") < handler[1].indexOf("restoreEditorScrollPositions(scrollPositions)"),
  "all editor scroll positions must be captured before and restored after refreshing the row"
);

console.log("PASS: current-row refresh preserves every editor viewport");
