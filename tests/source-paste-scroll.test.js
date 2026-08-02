"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");

assert(app.includes("function captureEditorScrollPositions()"));
assert(app.includes("function restoreEditorScrollPositions(positions)"));
assert(app.includes('pasteScrollEditors.forEach((editor) => editor.addEventListener("paste", preserveEditorScrollOnPaste));'));
assert(app.includes("[elements.correction, elements.input, elements.output, elements.finalOutput, elements.committedOutput]"), "all text editor frames must preserve their viewport on paste");
assert(app.includes("editor.scrollTop = top;"));
assert(app.includes("editor.scrollLeft = left;"));
assert(app.includes("restoreEditorScrollPositions(scrollPositions);"), "the source paste button must use the same viewport-preserving behavior");
assert(app.includes("if (restoringPasteScroll) return;"), "a correction paste must not auto-scroll while its active slot is refreshed");
assert(!app.includes("scrollInputToTopAfterPaste"));
assert(!app.includes("elements.input.scrollTop = 0;"), "pasting must not force the source frame to the top");

console.log("PASS: paste preserves every editor viewport");
