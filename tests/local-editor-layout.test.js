"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");

const committedCard = html.match(/<article class="editor-card committed-card"[^>]*>/)?.[0] || "";
assert(committedCard.includes("hidden"), "committed score text must stay out of the local editor UI");
assert(!html.includes("別画面で<br>比較・編集"), "duplicate comparison editor link must be removed");
assert(app.includes("if (elements.openCommittedPreview)"), "legacy committed preview wiring must tolerate the removed link");
assert(app.includes("const LINE_NUMBER_TRAILING_ROWS = 2"), "line-number gutters must reserve two visual trailing rows");
assert(app.includes('class="line-number-spacer"'), "line-number padding must not add rows to editor text");
assert(app.includes('span:not(.line-number-spacer)'), "line-number padding must not become an active row");

console.log("PASS: local editor layout keeps redundant panels hidden and adds visual line-number padding only");
