"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
const start = source.indexOf("function applyCorrectionHistory(value)");
const end = source.indexOf("function undoCorrection()", start);
const historyRestore = source.slice(start, end);

assert(start >= 0 && end > start);
assert(historyRestore.indexOf("const scrollTop = elements.correction.scrollTop") < historyRestore.indexOf("elements.correction.value = value"));
assert(historyRestore.includes("const scrollLeft = elements.correction.scrollLeft"));
assert(historyRestore.includes("elements.correction.focus({ preventScroll: true })"));
assert(historyRestore.includes("elements.correction.scrollTop = scrollTop"));
assert(historyRestore.includes("elements.correction.scrollLeft = scrollLeft"));
assert(historyRestore.includes("elements.correctionLines.scrollTop = scrollTop"));
assert(historyRestore.includes("requestAnimationFrame(restoreViewport)"));
assert(source.includes('elements.correction.addEventListener("focus", syncCorrectionHistoryOnFocus)'));
assert(source.includes("if (elements.correction.value === correctionHistoryValue) return;"));

console.log("PASS: row-edit undo preserves caret and viewport instead of jumping to the end");
