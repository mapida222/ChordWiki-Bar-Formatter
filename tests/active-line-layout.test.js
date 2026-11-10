"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const style = fs.readFileSync(path.join(root, "style.css"), "utf8");

assert(app.includes('classList.toggle("current-line-visible", visible)'));
assert(app.includes('alignEditorRule(textarea, gutterByEditor.get(textarea))'));
assert(style.includes(".editor-shell .editor-text-layer.current-line-visible::after"));
assert(!style.includes(".editor-highlight.active-line-visible"));

console.log("PASS: converter active line uses the shared underline and gutter highlight");
