"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert(html.includes('class="frame-resize-edge" data-row="top"'), "the source editor needs a draggable bottom edge");
assert(html.includes('class="frame-resize-edge" data-row="bottom"'), "the result editor needs a draggable bottom edge");
assert(html.match(/class="frame-resize-edge"[^>]+aria-orientation="horizontal"/g)?.length === 2, "both edges must expose horizontal separator semantics");
assert(css.includes(".frame-resize-edge {"));
assert(css.includes("cursor: ns-resize"));
assert(app.includes('document.querySelectorAll(".frame-resize-edge").forEach((edge) => {'));
assert(app.includes("setRowHeight(row, startHeight + event.clientY - startY);"));
assert(app.includes('edge.addEventListener("pointercancel", endDrag);'));
assert(app.includes('if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;'));

console.log("PASS: LAYOUT-004 source and result bottom borders resize vertically");
