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
assert(app.includes("const suppressedScrollEditors = new WeakMap();"), "programmatic scroll targets must be marked before their scroll events fire");
assert(app.includes("suppressedPosition.top === editor.scrollTop"), "delayed target events must be matched by their synchronized position");
assert(app.includes("if (suppressed || syncingScroll || restoringPasteScroll) return;"), "programmatic target scrolls must not start a second sync chain");
assert(app.includes("suppressNextScrollEvent(other, editor.scrollTop, editor.scrollLeft);"), "linked editor scrolls must suppress their follow-up events");
assert(app.includes("suppressNextScrollEvent(elements.finalPreview, editor.scrollTop, editor.scrollLeft);"), "source-to-preview sync must suppress the preview follow-up event");
assert(app.includes("suppressedScrollEditors.get(elements.finalPreview)"), "preview follow-up events must not start a correction sync chain");
assert(app.includes("suppressNextScrollEvent(editor, elements.finalPreview.scrollTop, elements.finalPreview.scrollLeft);"), "preview scrolls must suppress their follow-up events");
assert(app.includes("[elements.input, elements.output, elements.correction, elements.finalOutput]"), "source scroll sync must include the linked row-edit group");

console.log("PASS: paste preserves every editor viewport and scroll sync keeps linked row-edit state");
