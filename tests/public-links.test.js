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
assert(html.includes("ChordWiki運営者のmapidaが、個人で制作した非公式ツールです。"));
assert(!html.includes("運営元とは関係ありません"));
assert(!html.includes("fanbox.cc/manage/plans"));
assert(!html.includes("1Rm8bOSxlRNkhEa3l8eVPsWUr_OXVBuDFqnoHwc1BMZg/edit"));
assert(html.includes("ご意見・ご要望（Googleフォーム）"));
assert(html.includes('class="community-feedback-icon" aria-hidden="true">✉</span>'));
assert(html.includes('<details class="support-menu">'));
assert(html.includes("<span>応援する</span>"));
assert.strictEqual((html.match(/class="support-choice /g) || []).length, 2);
assert(css.includes(".community-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));"));
assert(css.includes(".community-panel { width: 100%; min-width: 0;"));
assert(css.includes(".support-menu[open] .support-menu-caret"));
assert(!css.includes("transform: translateY(-2px)"));
assert(html.indexOf('class="status-support-panel"') < html.indexOf('class="community-panel"'));
assert(html.indexOf('class="community-panel"') < html.indexOf('class="editor-card input-card"'));

console.log("PASS: public feedback, support and credit links");
