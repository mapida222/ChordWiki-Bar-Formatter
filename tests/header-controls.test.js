"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

assert(html.includes('<span>小節線[|]にカッコをつけない</span>'));
assert(!html.includes("編集時の小節線[|]にカッコをつけない"));
assert(html.includes('id="add-input-brackets" class="sample-header-button bracket-header-button"'));
assert(html.includes('<span>コードに[]を追加</span></button>'));
assert(css.includes(".bracket-header-button { justify-content: center; padding-inline: 7px; white-space: nowrap; }"));
assert(css.includes(".sample-header-button:not(.bracket-header-button) > span:last-child"));

console.log("PASS: header wording and bracket-button text layout");
