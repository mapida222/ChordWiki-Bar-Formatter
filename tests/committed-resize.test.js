"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");

assert(html.includes('data-row="committed" data-column="inverse"'));
assert(html.includes('aria-label="確定譜面テキスト枠の幅と高さを調整"'));
assert(css.includes("--committed-editor-height"));
assert(css.includes(".committed-card .editor-shell.committed-collapsed + .frame-resize-corner { display: none; }"));
assert(app.includes('row === "committed"'));
assert(app.includes("committedHeight:"));
assert(app.includes('setRowHeight("committed", layout.committedHeight)'));

console.log("PASS: LAYOUT-002 committed score frame resize and persistence");
