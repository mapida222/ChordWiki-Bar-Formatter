"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const launcher = fs.readFileSync(path.join(root, "row-edit-test.html"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style-row-edit-test.css"), "utf8");
const script = fs.readFileSync(path.join(root, "js", "row-edit-test.js"), "utf8");

assert(launcher.includes("index.html?rowEditTest=1"), "the standalone test launcher must open the opt-in experiment");
assert(html.includes("style-row-edit-test.css?v=20260801-3"));
assert(html.includes("js/row-edit-test.js?v=20260801-8"));
assert(script.includes('get("rowEditTest") !== "1"'), "the normal app must remain unaffected unless the experiment is requested");
assert(script.includes('correction.dataset.rowEditTextMode = "true"'));
assert(script.includes('addEventListener("beforeinput"'));
assert(script.includes('addEventListener("keydown"'));
assert(script.includes('["keyup", "click", "focus"]'), "native caret placement must not be converted back into a slot selection");
assert(script.includes("function moveToAdjacentRow(direction)"), "Enter must move between existing rows instead of adding a correction row");
assert(script.includes("event.stopImmediatePropagation()"), "slot-editor handlers must not change plain text input");
assert(script.includes("function overwriteNextValue(value)"), "digits and a-i must overwrite the following duration");
assert(script.includes("function insertSymbol(value)"), "special symbols must be inserted at the caret");
assert(script.includes("function moveDuration(direction)"), "arrow keys must move between durations while skipping symbols");
assert(script.includes("function removeAttachedSymbol()"), "Delete must remove an attached symbol before clearing a duration");
assert(script.includes("/[x^*@s|]/i"), "x, accent, half note, white note, sync and bar markers must share deletion handling");
assert(script.includes("行修正で使えない文字です"), "unsupported input must leave the correction text intact and explain why");
assert(script.includes("event.preventDefault()"), "the custom text rule must replace the native character insertion");
assert(!script.includes("activeBoundary"), "the experiment must not add a second artificial cursor");
assert(!css.includes("row-edit-test-panel"), "the experiment must not add a separate editing column");
assert(css.includes("caret-color"));

console.log("PASS: ROW-017 opt-in plain-text row editing");
