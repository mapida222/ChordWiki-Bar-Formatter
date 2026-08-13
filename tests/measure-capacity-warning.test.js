"use strict";

const assert = require("assert");
const fs = require("fs");
global.window = global;
require("../js/converter.js");

const analyze = CBFConverter.analyzeAuthoredMeasureCapacity;
const source = "[C]---- ----|[G]---- ----|";
assert.deepStrictEqual(analyze(source, 4, "4/4"), { configured: 4, detected: 8, measureCount: 2, candidateCount: 2, percentage: 100, lineNumbers: [1] });
assert.strictEqual(analyze(source, 8, "4/4"), null);
assert.strictEqual(analyze("[C]---- ----|[G]---- ----|[F]----|", 4, "4/4").percentage, 67);
assert.strictEqual(analyze("[C]---- ----|", 4, "4/4").detected, 8);
assert.strictEqual(analyze("[C]歌詞[G]---- ----|", 4, "4/4"), null);
assert.strictEqual(analyze("[C]========|", 4, "4/4"), null);
assert.strictEqual(analyze("{c:3/4拍子}\n[C]---|[F]---|", 4, "4/4"), null);
assert.strictEqual(analyze("{c:3/4拍子}\n[C]---|[F]---|", 4).detected, 3);
assert.strictEqual(analyze("{c:6/8拍子}\n[C]------|[F]------|", 8).detected, 6);
assert.strictEqual(analyze("{c:3+4+3+3/4拍子}\n[E]---|[G#m7]----|", 4, "4/4"), null);
assert.strictEqual(analyze("(2/4)[N.C.]----|[C]---- ----|", 8, "4/4"), null);

const index = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8");
assert(index.includes('id="measure-capacity-warning"'));
const app = fs.readFileSync(require("path").join(__dirname, "..", "js", "app.js"), "utf8");
assert(app.includes("analyzeAuthoredMeasureCapacity(elements.input.value, values.measureCapacity)"));
assert(!app.includes("analyzeAuthoredMeasureCapacity(elements.input.value, values.measureCapacity, targetMeter)"));
assert(app.includes("判定できた小節の約${mismatch.percentage}%"));
assert(app.includes("6/8拍子タブへ切り替え、合計${mismatch.detected}を適用しますか？"));
assert(app.includes('[3, 6, 9, 12].includes(mismatch.detected)'));
assert(app.includes('elements.measureCapacityWarningOpen.dataset.profile = useSixEightProfile ? "sixEight" : ""'));
assert(app.includes('`6/8・${mismatch.detected}を適用`'));
assert(app.includes('CBFSettings.setActiveProfile("sixEight")'));
assert(app.includes('input.value = String(detected)'));
assert(app.includes('input.dispatchEvent(new Event("input", { bubbles: true }))'));
assert(app.includes("updateMeasureCapacityWarning(settings.values);"));
assert(index.includes('id="measure-capacity-warning-dismiss"'));
assert(app.includes('formattingDetails.push(detail("コード直後", formatting.hyphenUnit, values.hyphenUnit));'));
assert(app.includes('formattingDetails.push(detail("区切り間隔", formatting.hyphenSpacing, values.hyphenSpacing));'));
assert(app.includes('`1小節：${Number(values.measureCapacity)}ハイフン（現状と同じ）`'));
assert(index.includes("変更しない"));
assert(app.includes("elements.outputHeading, elements.measureCapacityWarning, elements.removalControls"));
const warningUpdater = app.match(/function updateMeasureCapacityWarning[\s\S]*?\n  function lineCount/);
assert(warningUpdater && (warningUpdater[0].match(/syncResultRowAlignment\(\)/g) || []).length >= 3);

console.log("PASS: clear authored-measure mismatches produce a settings warning");
