"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(path.resolve(__dirname, ".."), "js", "app.js"), "utf8").replace(/\r\n?/gu, "\n");
const scrollHandler = app.match(/editor\.addEventListener\("scroll", \(\) => \{[\s\S]*?requestAnimationFrame\(\(\) => \{ syncingScroll = false; \}\);/);
assert(scrollHandler, "editor scroll handler must remain present");
const handler = scrollHandler[0];
const positionHandler = app.match(/positionEvents\.forEach\(\(eventName\) => editor\.addEventListener\(eventName, \(event\) => \{[\s\S]*?\}\)\);/);
assert(positionHandler, "editor position handler must be present");
const activePositionFunction = app.match(/function updateActivePosition\([\s\S]*?\n  function updateEditorHighlight/);
assert(activePositionFunction, "active position update function must be present");

assert(handler.includes("correctionResultPair.includes(editor) ? correctionResultPair : [editor]"), "scroll sync OFF must keep the result and row-edit panes aligned while leaving the source independent");
assert(handler.includes('scrollProgress(editor, "top")'), "linked vertical scroll must use normalized progress");
assert(handler.includes('scrollPositionForProgress(other, "top", topProgress)'), "linked panes with different heights must receive proportional scroll positions");
assert(app.includes("const AUTO_SCROLL_EDGE_ROWS = 2;"), "vertical auto-scroll must use a two-row edge threshold");
assert(app.includes("function lineIsNearVerticalEdge(lineTop, lineHeight, scrollTop, clientHeight)"), "vertical auto-scroll must be limited to rows near the viewport edges");
assert(app.includes("if (!lineIsNearVerticalEdge(lineTop, lineHeight, elements.correction.scrollTop, elements.correction.clientHeight)) return false;"), "central correction rows must not recenter the row editor");
assert(app.includes("if (!lineIsNearVerticalEdge(lineTop, lineHeight, textarea.scrollTop, textarea.clientHeight)) return false;"), "central output rows must not recenter the result editor");
assert(app.includes("if (!lineIsNearVerticalEdge(lineTop, lineHeight, preview.scrollTop, preview.clientHeight)) return;"), "central preview rows must not recenter the score preview");
assert(app.includes("const AUTO_SCROLL_MAX_ROWS = 2;") && app.includes("function edgeScrollTopForLine(element, lineTop, lineHeight)"), "edge follow must move by at most two rows instead of centering the active row");
assert(app.includes("const maxDelta = lineHeight * AUTO_SCROLL_MAX_ROWS;"), "edge follow must cap each automatic scroll step");
assert(app.includes("function keepLinkedTextLineInView(lineIndex, preferredEditor = null)"), "one linked text editor must drive edge follow at a time");
assert(app.includes("if (moved) return true;"), "the second linked editor must only be considered when the preferred editor needs no scroll");
assert(app.includes('behavior: prefersReducedMotion ? "auto" : "smooth"'), "edge follow must animate smoothly and respect reduced-motion preferences");
assert(activePositionFunction[0].includes('const shouldAutoFollowActiveLine = eventType === "keyup" || eventType === "input";'), "click and focus updates must not move linked editor viewports");
assert(activePositionFunction[0].includes("keepLinkedTextLineInView(linkedLineIndex, textarea);"), "the active editor must drive linked edge follow so smooth scrolling does not fight scroll sync");
assert(positionHandler[0].includes("isEditorScrollbarClick(event, editor)"), "clicking an editor scrollbar must not change the linked active row");
assert(app.includes('if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)') && app.includes("event.shiftKey) return;") && app.includes("event.preventDefault();\n    moveOutputCursor("), "output arrow navigation must preserve the current vertical viewport without overriding Shift selection");
assert(app.includes("const preservedScrollTop = elements.output.scrollTop;") && app.includes("if (!lineIsNearVerticalEdge(lineTop, lineHeight, elements.output.scrollTop, elements.output.clientHeight))") && app.includes("elements.output.scrollTop = preservedScrollTop;"), "output cursor movement must restore the captured vertical scroll position away from the viewport edge");
assert(app.includes('value[lineStart - 2] === "\\r" && value[lineStart - 1] === "\\n"'), "output cursor movement must treat CRLF as one preceding line break");
assert(app.includes("const previousEnd = previousBreakStart;"), "upward output cursor movement must stop before the complete preceding line break");

console.log("PASS: scroll sync OFF keeps the source independent and the result/row-edit pair aligned");
