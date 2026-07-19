"use strict";

const assert = require("assert");
const fs = require("fs");
global.window = global;
require("../js/converter.js");

const analyze = CBFConverter.analyzeAuthoredMeasureCapacity;
const source = "[C]---- ----|[G]---- ----|";
assert.deepStrictEqual(analyze(source, 4, "4/4"), { configured: 4, detected: 8, measureCount: 2, lineNumbers: [1] });
assert.strictEqual(analyze(source, 8, "4/4"), null);
assert.strictEqual(analyze("[C]---- ----|", 4, "4/4").detected, 8);
assert.strictEqual(analyze("[C]歌詞[G]---- ----|", 4, "4/4"), null);
assert.strictEqual(analyze("[C]========|", 4, "4/4"), null);
assert.strictEqual(analyze("{c:3/4拍子}\n[C]---|[F]---|", 4, "4/4"), null);
assert.strictEqual(analyze("{c:3+4+3+3/4拍子}\n[E]---|[G#m7]----|", 4, "4/4"), null);
assert.strictEqual(analyze("(2/4)[N.C.]----|[C]---- ----|", 8, "4/4"), null);

const index = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8");
assert(index.includes('id="measure-capacity-warning"'));
assert(index.includes("03. 初期設定を確認"));

console.log("PASS: clear authored-measure mismatches produce a settings warning");
