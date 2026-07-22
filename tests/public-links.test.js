"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

assert(html.includes("https://mapida222.booth.pm/items/8642112"));
assert(html.includes("https://mapida2.fanbox.cc/plans"));
assert(html.includes("https://docs.google.com/forms/d/e/1FAIpQLScYAHIEEOtuk8MoQR_1sNN7SVgCFFRtKCeUkm23sqTIGqg-cQ/viewform"));
assert(html.includes("https://ja.chordwiki.org/"));
assert(html.includes("制作："));
assert(html.includes("© 2026 mapida"));
assert(html.includes("ChordWikiの非公式ツールです。運営元とは関係ありません。"));
assert(!html.includes("fanbox.cc/manage/plans"));
assert(!html.includes("1Rm8bOSxlRNkhEa3l8eVPsWUr_OXVBuDFqnoHwc1BMZg/edit"));
assert.strictEqual((html.match(/class="community-link /g) || []).length, 3);
assert(css.includes(".community-links { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));"));
assert(css.includes(".community-heading h2 { color: var(--muted); font-size: .78rem;"));
assert(css.includes("min-height: 68px;"));
assert(!css.includes("transform: translateY(-2px)"));

console.log("PASS: public feedback, support and credit links");
