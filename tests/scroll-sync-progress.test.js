"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(path.resolve(__dirname, ".."), "js", "app.js"), "utf8");
const scrollHandler = app.match(/editor\.addEventListener\("scroll", \(\) => \{[\s\S]*?requestAnimationFrame\(\(\) => \{ syncingScroll = false; \}\);/);
assert(scrollHandler, "editor scroll handler must remain present");
const handler = scrollHandler[0];

assert(handler.includes("correctionResultPair.includes(editor) ? correctionResultPair : [editor]"), "scroll sync OFF must keep the result and row-edit panes aligned while leaving the source independent");
assert(handler.includes('scrollProgress(editor, "top")'), "linked vertical scroll must use normalized progress");
assert(handler.includes('scrollPositionForProgress(other, "top", topProgress)'), "linked panes with different heights must receive proportional scroll positions");

console.log("PASS: scroll sync OFF keeps the source independent and the result/row-edit pair aligned");
