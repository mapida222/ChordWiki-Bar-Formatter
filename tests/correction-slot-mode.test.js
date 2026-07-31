"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert(app.includes("function selectCorrectionSlot(lineIndex, slotIndex)"));
assert(app.includes("function moveCorrectionSlot(key)"));
assert(app.includes("function replaceActiveCorrectionBeat(inputCharacter)"));
assert(app.includes("textarea.selectionEnd - textarea.selectionStart <= 1"));
assert(app.includes('["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)'));
assert(app.includes("updateActivePosition(elements.correction, elements.correctionLines, true);"));
assert(app.includes('replaceCorrectionText(end, end, "s", end + 1);'));
assert(app.includes('event.key.toLowerCase() === "x" ? start + selectedBeat + 1 : start + selectedBeat'));
assert(app.includes('if (event.key === "|")'));
assert(css.includes(".correction-card .editor-text-layer textarea { caret-color: transparent !important; }"));
assert(html.includes('js/correction-input.js?v=20260731-4'));
assert(html.includes('js/app.js?v=20260731-9'));

console.log("PASS: ROW-009 correction slot selection replaces without a visible text caret");
