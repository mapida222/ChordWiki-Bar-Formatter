"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert(app.includes("const HISTORY_DELAY_MS = 1 * 60 * 1000;"));
assert.strictEqual((app.match(/saveCurrentHistory\(false, true\)/g) || []).length, 3);
assert(app.includes('$("#copy-output").addEventListener'));
assert(app.includes('$("#copy-final-output").addEventListener'));
assert(app.includes('$("#copy-committed-output").addEventListener'));
assert(html.includes("入力停止から1分後"));
assert(html.includes("コピー成功時"));
assert(html.includes("自動保存します"));
assert(!html.includes("入力停止から10分後"));

console.log("PASS: editing-idle and successful-copy history triggers");
