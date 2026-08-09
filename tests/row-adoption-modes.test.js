"use strict";
global.window = global;
if (!Array.prototype.findLastIndex) {
  Array.prototype.findLastIndex = function (predicate) {
    for (let index = this.length - 1; index >= 0; index -= 1) {
      if (predicate(this[index], index, this)) return index;
    }
    return -1;
  };
}
require("../js/converter.js");

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const settings = { hyphenUnit: 4, measureCapacity: 8, hyphenSpacing: 4, shortFractionPrepose: 1, showContinuationChord: 0 };

const automatic = CBFConverter.convertChordText("[C][G]", settings, ["22"], [], [], ["auto"]);
assert.strictEqual(automatic.output, "[|][C][----][G][----][|]");
assert.strictEqual(automatic.corrections, "22");
assert.deepStrictEqual(automatic.correctionStates, ["auto"]);

const edited = CBFConverter.convertChordText("[C][G]", settings, ["22"], [], [], ["edit"]);
assert.strictEqual(edited.output, "[|][C][--][G][--][|]");
assert.deepStrictEqual(edited.correctionStates, ["edit"]);

const source = CBFConverter.convertChordText("[C][G]", settings, ["22"], [], [], ["source"]);
assert.strictEqual(source.output, "[C][G]");
assert.strictEqual(source.corrections, "22");
assert.deepStrictEqual(source.correctionStates, ["source"]);

const mixed = CBFConverter.convertChordText("plain\n[C]lyrics", settings, ["", "4"], [], [], ["", "source"]);
assert.strictEqual(mixed.output, "plain\n[C]lyrics");
assert.deepStrictEqual(mixed.correctionStates, ["none", "source"]);

const twoRows = CBFConverter.convertChordText("[C]first[G]line\n[Am]second[F]line", settings, [], [], [], []);
const twoRowOutput = twoRows.output.split("\n");
const directlyEditedSecondRow = twoRowOutput[1].replace(/\[\|\]$/, "【direct edit】[|]");
const otherRowCorrection = CBFConverter.convertChordText(
  "[C]first[G]line\n[Am]second[F]line",
  settings,
  ["24", "44"],
  [undefined, directlyEditedSecondRow],
  twoRows.corrections.split("\n"),
  ["edit", "edit"]
);
assert.strictEqual(otherRowCorrection.output.split("\n")[1], directlyEditedSecondRow);
assert.strictEqual(otherRowCorrection.correctionStates[1], "edit");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const app = fs.readFileSync(path.join(root, "js/app.js"), "utf8");
assert(html.includes('<div class="correction-column-headings" aria-hidden="true"><span>No.</span><span>修正値</span><span>採用中</span></div>'));
assert(html.includes('<div class="output-column-headings" aria-hidden="true"><span>No.</span><span>変換後テキスト</span></div>'));
assert(css.includes('grid-template-rows: 1.45em minmax(0, 1fr);'));
assert(css.includes('.correction-column-headings { grid-column: 1 / -1; grid-row: 1; display: grid; grid-template-columns: subgrid;'));
assert(css.includes('.correction-card .line-numbers { text-align: center; }'));
assert(css.includes('grid-template-columns: max-content minmax(0, 1fr) var(--correction-mode-width) var(--correction-scrollbar-width);'));
assert(css.includes('.correction-card .editor-text-layer textarea, .correction-card .editor-highlight { padding-right: calc(var(--correction-mode-width) + var(--correction-scrollbar-width)); text-align: left; }'));
assert(css.includes('.correction-modes { z-index: 2; grid-column: 3;'));
assert(css.includes('button.correction-mode-row[data-mode="fixed"]'));
assert(app.includes('const ROW_MODE_LABELS = { auto: "自動", edit: "修正", source: "固定", recovered: "固定", fixed: "固定" };'));
assert(app.includes('const directlyEdited = mode === "edit" && manualOutputLines.has(index);'));
assert(app.includes('if (musicStructureChanged && rowAdoptionModes[index] !== "source") rowAdoptionModes[index] = "auto";'));
assert(app.includes('if (!preserveUserEdits && !changedLineIndices?.size) {'));
assert(app.includes('preserveUserEdits: !refresh,'));

console.log("PASS: automatic, row-edit, cross-row direct-edit and source adoption states");
