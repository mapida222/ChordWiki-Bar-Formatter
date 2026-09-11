"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(path.resolve(__dirname, ".."), "js", "app.js"), "utf8").replace(/\r\n?/gu, "\n");
const scrollHandler = app.match(/editor\.addEventListener\("scroll", \(\) => \{[\s\S]*?requestAnimationFrame\(\(\) => \{ syncingScroll = false; \}\);/);
assert(scrollHandler, "editor scroll handler must remain present");
const handler = scrollHandler[0];

assert(handler.includes("correctionResultPair.includes(editor) ? correctionResultPair : [editor]"), "scroll sync OFF must keep the result and row-edit panes aligned while leaving the source independent");
assert(handler.includes('scrollProgress(editor, "top")'), "linked vertical scroll must use normalized progress");
assert(handler.includes('scrollPositionForProgress(other, "top", topProgress)'), "linked panes with different heights must receive proportional scroll positions");
assert(app.includes("const AUTO_SCROLL_EDGE_ROWS = 2;"), "vertical auto-scroll must use a two-row edge threshold");
assert(app.includes("function lineIsNearVerticalEdge(lineTop, lineHeight, scrollTop, clientHeight)"), "vertical auto-scroll must be limited to rows near the viewport edges");
assert(app.includes("if (!lineIsNearVerticalEdge(lineTop, lineHeight, elements.correction.scrollTop, elements.correction.clientHeight)) return;"), "central correction rows must not recenter the row editor");
assert(app.includes("if (!lineIsNearVerticalEdge(lineTop, lineHeight, textarea.scrollTop, textarea.clientHeight)) return;"), "central output rows must not recenter the result editor");
assert(app.includes("if (!lineIsNearVerticalEdge(lineTop, lineHeight, preview.scrollTop, preview.clientHeight)) return;"), "central preview rows must not recenter the score preview");
assert(app.includes('if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)') && app.includes("event.shiftKey) return;") && app.includes("event.preventDefault();\n    moveOutputCursor("), "output arrow navigation must preserve the current vertical viewport without overriding Shift selection");
assert(app.includes("const preservedScrollTop = elements.output.scrollTop;") && app.includes("if (!lineIsNearVerticalEdge(lineTop, lineHeight, elements.output.scrollTop, elements.output.clientHeight))") && app.includes("elements.output.scrollTop = preservedScrollTop;"), "output cursor movement must restore the captured vertical scroll position away from the viewport edge");
assert(app.includes('value[lineStart - 2] === "\\r" && value[lineStart - 1] === "\\n"'), "output cursor movement must treat CRLF as one preceding line break");
assert(app.includes("const previousEnd = previousBreakStart;"), "upward output cursor movement must stop before the complete preceding line break");

console.log("PASS: scroll sync OFF keeps the source independent and the result/row-edit pair aligned");
