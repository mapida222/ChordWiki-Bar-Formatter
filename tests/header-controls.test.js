"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");

assert(html.includes('<span>小節線[|]にカッコをつけない</span>'));
assert.strictEqual((html.match(/id="added-background"/g) || []).length, 1);
assert(html.includes('<label class="output-diff-setting"><input id="added-background" type="checkbox" checked> <span>差分背景</span></label>'));
assert(!html.includes("自動追加の背景に色付ける"));
const diffBackgroundHandler = app.match(/elements\.addedBackground\.addEventListener\("change", \(\) => \{([\s\S]*?)\n  \}\);/);
assert(diffBackgroundHandler);
assert(diffBackgroundHandler[1].includes("updateEditorHighlight(elements.output)"));
assert(!/scheduleConversion|positionSettingsPanel|syncResultRowAlignment/.test(diffBackgroundHandler[1]));
assert(html.includes('id="correction-refresh-line"'));
assert(html.includes("↻ この行を更新"));
assert(!html.includes('id="correction-append"'));
assert(!html.includes("＋ 末尾に追加"));
assert(!html.includes("編集時の小節線[|]にカッコをつけない"));
assert(html.includes('id="add-input-brackets" class="sample-header-button bracket-header-button"'));
assert(html.includes('<span>コードに[]を追加</span></button>'));
assert(css.includes(".bracket-header-button { justify-content: center; padding-inline: 7px; white-space: nowrap; }"));
assert(css.includes(".sample-header-button:not(.bracket-header-button) > span:last-child"));

console.log("PASS: header wording and bracket-button text layout");
