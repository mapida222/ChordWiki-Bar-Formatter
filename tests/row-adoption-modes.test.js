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
assert(html.includes('id="correction-grid" class="correction-grid"'), "row-edit needs a scrollable row grid overlay");
assert(css.includes('.correction-grid { position: absolute;') && css.includes('.correction-grid-row { display: grid;'), "row-edit grid must be made of row-sized grid elements");
assert(css.includes('top: calc(1.45em + 14px)') && css.includes('--correction-row-height: calc(var(--editor-font-size) * 1.65)'), "row-edit grid must share the text row origin and height");
assert(css.includes('--correction-grid-scroll-top: 0px') && css.includes('transform: translateY(calc(-1 * var(--correction-grid-scroll-top)))'), "row-edit grid must move by the exact correction viewport offset");
assert(css.includes('--correction-row-scroll-top: 0px') && css.includes('.correction-card .line-numbers span { transform: translateY(calc(-1 * var(--correction-row-scroll-top)))'), "row-edit columns must share one row scroll offset");
assert(app.includes('syncCorrectionModeScroll(textarea.scrollTop);'), "row-edit grid and columns must follow the correction textarea scroll position");
assert(app.includes('gutterByEditor.get(other).scrollTop = 0;'), "row-edit line numbers must stay in the shared row layer");
assert(app.includes('elements.correctionGrid.style.setProperty("--correction-grid-scroll-top", `${editor.scrollTop}px`);'), "row-edit grid must receive the correction scroll offset");
assert(app.includes('correction-grid-spacer') && app.includes('correction-mode-spacer'), "row-edit side columns must reserve the same trailing visual rows as the line numbers");
assert(css.includes('.correction-card .line-numbers { text-align: center; }'));
assert(css.includes('grid-template-columns: max-content minmax(0, 1fr) var(--correction-mode-width) var(--correction-scrollbar-width);'));
assert(css.includes('.correction-card .editor-text-layer textarea, .correction-card .editor-highlight { padding-right: calc(var(--correction-mode-width) + var(--correction-scrollbar-width)); text-align: left; }'));
assert(css.includes('.correction-modes { z-index: 2; grid-column: 3;'));
assert(css.includes('button.correction-mode-row[data-mode="fixed"]'));
assert(app.includes('const ROW_MODE_LABELS = { auto: "自動", edit: "修正", source: "固定", recovered: "固定", fixed: "固定" };'));
assert(app.includes('convert({ changedLineIndices: new Set([index]), suppressMeasureCapacityWarning: true });'), "row mode clicks must not reopen the whole-measure warning");
assert(app.includes('const directlyEdited = mode === "edit" && manualOutputLines.has(index);'));
assert(app.includes('if (musicStructureChanged && rowAdoptionModes[index] !== "source") rowAdoptionModes[index] = "auto";'));
assert(app.includes("syncManualOutputLinesFromOverrides();"), "manual result ownership must come from the stable override layer");
assert(app.includes('preserveUserEdits: !refresh,'));

console.log("PASS: automatic, row-edit, cross-row direct-edit and source adoption states");
