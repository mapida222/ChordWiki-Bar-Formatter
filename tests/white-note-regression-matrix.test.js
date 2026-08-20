"use strict";

const assert = require("assert");
const commonFixture = require("./fixtures/converter-common.json");
global.window = global;
require("../js/converter.js");
require("../js/correction-input.js");

const settings = { ...commonFixture.settings };

const matrix = commonFixture.whiteNoteCases.map(({ name, input, correction, whiteNoteCount }) => [name, input, correction, whiteNoteCount]);

matrix.forEach(([label, source, correction, whiteNoteCount]) => {
  const result = CBFConverter.convertChordText(source, settings, [correction]);
  assert.strictEqual(result.corrections, correction, `${label}: correction must be retained`);
  assert.deepStrictEqual(result.correctionErrors, [], `${label}: correction must be accepted`);
  assert.strictEqual((result.output.match(/\[○\]/g) || []).length, whiteNoteCount, `${label}: white-note count`);
});
const replacementWhiteNote = CBFConverter.convertChordText("[C][D][E][F]", settings, ["3@21"]);
assert.strictEqual(replacementWhiteNote.output, "[|][C][---][D][○][----][E][-][|][-][F][-][|]", "replacing 4 with @ keeps a default white-note hyphen without adding a visible duration value");

function replaceWithWhiteNote(line, start, end, duration) {
  const edit = CBFCorrectionInput.whiteNoteEdit(line, start, end);
  assert(edit, `white-note edit must be available for ${line}`);
  const withMarker = `${line.slice(0, edit.start)}${edit.replacement}${line.slice(edit.end)}`;
  return `${withMarker.slice(0, edit.caret)}${duration}${withMarker.slice(edit.caret)}`;
}

[
  ["sync first", "4s4", 0, 1, "@44"],
  ["sync last", "4s4", 2, 3, "4@4"],
  ["accent", "^44", 1, 2, "@44"],
  ["half duration", "*44", 1, 2, "@44"],
  ["trailing no-bar", "4x4", 0, 1, "@44"],
  ["measure head", "4|4", 0, 1, "@4|4"]
].forEach(([label, line, start, end, expected]) => {
  assert.strictEqual(replaceWithWhiteNote(line, start, end, "4"), expected, label);
});

assert.strictEqual(CBFCorrectionInput.normalizeBeatInputSequence("＠８"), "@8");
assert.strictEqual(CBFCorrectionInput.normalizeLine("＠８", 1), "@8");
assert.strictEqual(CBFCorrectionInput.fullWidthCharacters("ｚ＠８"), "ｚ＠８");
assert.strictEqual(CBFCorrectionInput.fullWidthCharacters("z@8"), "");
assert.deepStrictEqual(CBFCorrectionInput.clearBeatEdit("@844", 1, 2), { start: 1, end: 2, replacement: "", caret: 1 });

const multipleLines = CBFConverter.convertChordText("[C]a[G]b\n[Am]c[F]d", settings, ["44", "@44"]);
assert.strictEqual(multipleLines.corrections, "44\n@44");
assert.deepStrictEqual(multipleLines.correctionErrors, []);
assert.strictEqual((multipleLines.output.match(/\[○\]/g) || []).length, 1);

const sampleSource = "[F]a[G]b[E7]c[E7/G#]d[Am7]e";
const sampleCorrection = "4*s433a";
const sampleSlots = CBFCorrectionInput.beatCharacters(sampleCorrection);
sampleSlots.forEach((slot, index) => {
  const selection = CBFCorrectionInput.slotSelection(sampleCorrection, index);
  const edited = replaceWithWhiteNote(sampleCorrection, selection.start, selection.end, slot[0]);
  const result = CBFConverter.convertChordText(sampleSource, settings, [edited]);
  assert.deepStrictEqual(result.correctionErrors, [], `sample slot ${index + 1}: ${edited}`);
  const expectedWhiteNotes = index === sampleSlots.length - 1 ? 2 : 1;
  assert.strictEqual((result.output.match(/\[○\]/g) || []).length, expectedWhiteNotes, `sample slot ${index + 1}: white note`);
});

console.log(`PASS: ${matrix.length} white-note conversions, ${sampleSlots.length} sample positions, 6 modifier replacements, IME, deletion and multiple rows`);
