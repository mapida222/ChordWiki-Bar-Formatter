"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
global.window = global;
require("../js/converter.js");

const settings = { hyphenUnit: 4, measureCapacity: 8, hyphenSpacing: 4, shortFractionPrepose: 1, showContinuationChord: 0 };
const converted = CBFConverter.convertChordText("[C][D]", settings, ["4444"]);
assert.strictEqual(converted.correctionErrors.length, 1);
assert.strictEqual(converted.correctionErrors[0].line, 1);
assert.ok(converted.correctionErrors[0].message.includes("2個多い"));

const app = fs.readFileSync(path.join(__dirname, "../js/app.js"), "utf8");
assert.ok(app.includes("行目を確認"));
assert.ok(app.includes("変換前から作り直す"));
assert.ok(app.includes("変換後を残して行修正を合わせる"));
assert.ok(app.includes("変換前の行へ移動"));
assert.ok(app.includes("manualOutputLines.delete(lineIndex)"));
assert.ok(app.includes("manualOutputLines.add(lineIndex)"));

console.log("PASS: row correction mismatch exposes per-line recovery actions");
