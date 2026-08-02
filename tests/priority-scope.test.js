"use strict";

const assert = require("assert");
global.window = global;
require("../js/converter.js");

const settings = {
  hyphenUnit: 4,
  measureCapacity: 8,
  hyphenSpacing: 4,
  shortFractionPrepose: 1,
  showContinuationChord: 0
};

const manualFirstMeasure = "[|][C][>===]前[D][====][|][E][----]後[F][----][|]";

const changedSecondMeasure = CBFConverter.renderWithBeatCode(manualFirstMeasure, "44^44", settings);
assert.strictEqual(changedSecondMeasure.ok, true);
assert.strictEqual(
  CBFConverter.mergeCorrectionScope(manualFirstMeasure, changedSecondMeasure.body, "4444", "44^44", settings),
  "[|][C][>===]前[D][====][|][E][>---]後[F][----][|]",
  "a later row edit changes its measure without rewriting manual rhythm in the previous measure"
);

const shiftedTail = CBFConverter.renderWithBeatCode(manualFirstMeasure, "4448", settings);
assert.strictEqual(shiftedTail.ok, true);
assert.strictEqual(
  CBFConverter.mergeCorrectionScope(manualFirstMeasure, shiftedTail.body, "4444", "4448", settings),
  "[|][C][>===]前[D][====][|][E][----]後[F][----][|][----][|]",
  "a changed duration updates from its measure through the end when boundaries do not realign"
);

[
  ["44*44", "[|][C][>===]前[D][====][|][E][====]後[F][----][|]"],
  ["44x44", "[|][C][>===]前[D][====][E][----]後[F][----][|]"]
].forEach(([code, expected]) => {
  const rendered = CBFConverter.renderWithBeatCode(manualFirstMeasure, code, settings);
  assert.strictEqual(rendered.ok, true);
  assert.strictEqual(CBFConverter.mergeCorrectionScope(manualFirstMeasure, rendered.body, "4444", code, settings), expected, `${code} updates only its affected measure`);
});

const whiteNoteAdded = CBFConverter.convertChordText(
  "[C]元[D]歌[E]後[F]半",
  settings,
  ["44@44"],
  [manualFirstMeasure],
  ["4444"]
);
assert.strictEqual(whiteNoteAdded.output, "[|][C][>===]前[D][====][|][E][○][----]後[F][----][|]");
const whiteNoteRemoved = CBFConverter.convertChordText(
  "[C]元[D]歌[E]後[F]半",
  settings,
  ["4444"],
  [whiteNoteAdded.output],
  ["44@44"]
);
assert.strictEqual(whiteNoteRemoved.output, "[|][C][>===]前[D][====][|][E][----]後[F][----][|]", "a later row edit removes a previously added white note");

const integrated = CBFConverter.convertChordText(
  "[C]元[D]歌[E]後[F]半",
  settings,
  ["44^44"],
  [manualFirstMeasure],
  ["4444"]
);
assert.strictEqual(
  integrated.output,
  "[|][C][>===]前[D][====][|][E][>---]後[F][----][|]",
  "conversion uses measure-scoped latest-edit priority"
);

const incompleteEdit = CBFConverter.convertChordText(
  "[C]元[D]歌[E]後[F]半",
  settings,
  ["44"],
  [manualFirstMeasure],
  ["4444"]
);
assert.strictEqual(incompleteEdit.appliedCorrections, "44", "a partial input is applied from the left and recorded without repeating it");
assert.deepStrictEqual(incompleteEdit.correctionErrors, [], "the missing right tail uses automatic values instead of becoming an error");

const singleValueEdit = CBFConverter.convertChordText("[C][D][E][F]", settings, ["2"]);
assert.strictEqual(singleValueEdit.appliedCorrections, "2", "one entered value remains one explicit value instead of expanding to every chord");
assert.strictEqual(singleValueEdit.automaticCorrections, "8888");
assert.strictEqual(singleValueEdit.output, "[|][C][--][D][--][----][|][--][E][--][----][|][--][F][--][----][|][--][|]", "only the first chord changes and the automatic right tail remains intact");

console.log("PASS: latest edit wins inside the affected measure while other manual measures remain intact");
