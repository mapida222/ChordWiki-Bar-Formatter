"use strict";

const assert = require("assert");
global.window = global;
require("../js/converter.js");
require("../js/correction-input.js");

const settings = {
  hyphenUnit: 4,
  measureCapacity: 8,
  hyphenSpacing: 4,
  shortFractionPrepose: 1,
  showContinuationChord: 0
};

const matrix = [
  ["single chord", "[C]one", "@8", 1],
  ["first of two", "[C]a[G]b", "@44", 1],
  ["last of two", "[C]a[G]b", "4@4", 1],
  ["first of four", "[C]a[D]b[E]c[F]d", "@4444", 1],
  ["middle of four", "[C]a[D]b[E]c[F]d", "44@44", 1],
  ["last of four", "[C]a[D]b[E]c[F]d", "444@4", 1],
  ["slash and no-chord", "[C/E]a[N.C.]b", "4@4", 1],
  ["long duration", "[C]long", "@h", 1],
  ["authored white note", "[C][○]", "@4", 1],
  ["consecutive white notes", "[C]a[G]b", "@4@4", 2],
  ["explicit measure head", "[C]a[G]b", "@4|4", 1]
];

matrix.forEach(([label, source, correction, whiteNoteCount]) => {
  const result = CBFConverter.convertChordText(source, settings, [correction]);
  assert.strictEqual(result.corrections, correction, `${label}: correction must be retained`);
  assert.deepStrictEqual(result.correctionErrors, [], `${label}: correction must be accepted`);
  assert.strictEqual((result.output.match(/\[○\]/g) || []).length, whiteNoteCount, `${label}: white-note count`);
});

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
assert.deepStrictEqual(CBFCorrectionInput.clearBeatEdit("@844", 1, 2), { start: 0, end: 2, replacement: "0", caret: 1 });

const multipleLines = CBFConverter.convertChordText("[C]a[G]b\n[Am]c[F]d", settings, ["44", "@44"]);
assert.strictEqual(multipleLines.corrections, "44\n@44");
assert.deepStrictEqual(multipleLines.correctionErrors, []);
assert.strictEqual((multipleLines.output.match(/\[○\]/g) || []).length, 1);

const sampleSource = "[F]a[G]b[E7]c[E7/G#]d[Am7]e";
const sampleCorrection = "4s433a";
const sampleSlots = CBFCorrectionInput.beatCharacters(sampleCorrection);
sampleSlots.forEach((slot, index) => {
  const selection = CBFCorrectionInput.slotSelection(sampleCorrection, index);
  const edited = replaceWithWhiteNote(sampleCorrection, selection.start, selection.end, slot[0]);
  const result = CBFConverter.convertChordText(sampleSource, settings, [edited]);
  assert.deepStrictEqual(result.correctionErrors, [], `sample slot ${index + 1}: ${edited}`);
  assert.strictEqual((result.output.match(/\[○\]/g) || []).length, 1, `sample slot ${index + 1}: white note`);
});

console.log(`PASS: ${matrix.length} white-note conversions, ${sampleSlots.length} sample positions, 6 modifier replacements, IME, deletion and multiple rows`);
