"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const style = fs.readFileSync(path.join(root, "style.css"), "utf8");

assert(app.includes('highlight.classList.toggle("active-line-visible", visible)'));
assert(app.includes('highlight.style.setProperty("--active-line-top"'));
assert(style.includes(".editor-highlight.active-line-visible"));
assert(style.includes("background-size: 100% var(--active-line-height"));

console.log("PASS: linked current-line background spans the editor width");
