"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert(app.includes("function outputCodeOffsetAt(lineIndex, slotIndex)"), "the selected correction slot must map to an output code");
assert(app.includes('match[1] === "○" || CBFConverter.isChordSymbol(match[1])'), "bars and rhythm tokens must not be counted as output codes");
assert(app.includes("updateEditorHighlight(elements.output, -1, outputCodeOffsetAt(linkedLineIndex, linkedSlotIndex));"), "moving the correction slot must refresh the output highlight");
assert(app.includes('className = `${className} linked-code-target`.trim();'), "the matching output token must receive a dedicated class");
assert(css.includes(".editor-highlight .linked-code-target"), "the matching output code must have a visible background style");
assert(html.includes("style.css?v=20260731-39"), "the browser must load the current linked-code highlight style");
assert(html.includes("js/app.js?v=20260731-8"), "the browser must load the current linked-code mapping");

console.log("PASS: ROW-011 selected correction slots highlight their matching output codes");
