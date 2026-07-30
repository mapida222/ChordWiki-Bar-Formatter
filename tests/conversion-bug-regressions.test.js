"use strict";

const assert = require("assert");
global.window = global;
require("../js/converter.js");

const settings = {
  hyphenUnit: 4,
  measureCapacity: 8,
  hyphenSpacing: 4,
  shortFractionPrepose: 1,
  longBeatLyricPlacement: 1,
  showContinuationChord: 0
};

const rhythmOnlySource = "[D]---- ----|[Em7]---- ----|[D/F#]---- ----|[B7sus4]---- ----|[B7]>==>==>=[N.C.]----|";
const rhythmOnly = CBFConverter.convertChordText(rhythmOnlySource, settings, []);
assert.strictEqual(
  rhythmOnly.output,
  "[|][D][----] [----][|][Em7][----] [----][|][D/F#][----] [----][|][B7sus4][----] [----][|][B7][>==>==>=][|][N.C.][----][|]"
);
assert.strictEqual(rhythmOnly.corrections, "888884");
assert(
  CBFConverter.parseTokens(rhythmOnlySource).every((token) => token.kind !== "text" || !token.value.trim()),
  "an interleaved accent rhythm after a chord must not turn the line into a lyric line"
);

const sourceAdoptionInput = `{title:原文採用テスト}\n${rhythmOnlySource}`;
const convertedForSourceAdoption = CBFConverter.convertChordText(
  sourceAdoptionInput,
  settings,
  ["", ""],
  [],
  [],
  ["", "source"]
);
const completedForSourceAdoption = CBFConverter.renderCompletedOutput(convertedForSourceAdoption.output, [4], 4).output;
assert.strictEqual(
  CBFConverter.restoreSourceAdoptedLines(completedForSourceAdoption, sourceAdoptionInput, ["", "source"]),
  sourceAdoptionInput,
  "source adoption must restore the untouched input after completed-output formatting"
);

const duplicateBarsSource = "|[C]---- ----|[D]---- ----||[C]---- ----|[D]---- ----||";
const normalizedBars = CBFConverter.convertChordText(duplicateBarsSource, settings, []).output;
assert.strictEqual(
  normalizedBars,
  "[|][C][----] [----][|][D][----] [----][|][C][----] [----][|][D][----] [----][|]"
);
assert(!normalizedBars.includes("[|][|]"), "adjacent authored bars must collapse to one boundary");
assert.strictEqual(
  CBFConverter.convertChordText(normalizedBars, settings, []).output,
  normalizedBars,
  "converting an already converted line again must not duplicate bars"
);
assert.strictEqual(
  CBFConverter.convertChordText("[C]----||", settings, []).output,
  "[|][C][----][|]",
  "duplicate bars at the end of a line must collapse"
);
assert.strictEqual(
  CBFConverter.convertChordText("{comment:記号||はそのまま}", settings, []).output,
  "{comment:記号||はそのまま}",
  "bar-like text inside metadata must not be normalized"
);

console.log("PASS: CONVERT-003/004 and ROW-008 conversion regressions");
