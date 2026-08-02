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

const synthManualRows = [
  "(Synth)|[G#m]---- [E]----|[F#]---- [B]--[F#/A#]--|[G#m]---- [E]----|[F#]---- [B]--[F#/A#]--|",
  "　　　　|[G#m]---- [E]----|[F#]---- [B]--[F#/A#]--|[G#m]---- [E]----|[F#]---- [B]----|"
].join("\n");
assert.strictEqual(
  CBFConverter.convertChordText(synthManualRows, settings, []).output,
  synthManualRows,
  "a parenthesized instrumental label and leading full-width spaces must not turn compact manual rhythm into a lyric line"
);
const synthConverted = CBFConverter.convertChordText(synthManualRows, settings, []);
assert.strictEqual(
  CBFConverter.renderCompletedOutput(synthConverted.output, [4], settings.hyphenSpacing).output,
  synthManualRows,
  "the completed-output display pass must also recognize (Synth) as notation and leave both compact rows untouched"
);
const legacyBracketedSynth = "(Synth)[|][G#m][----] [E][----][|][F#][----] [B][--][F#/A#][--][|][G#m][----] [E][----][|][F#][----] [B][--][F#/A#][--][|]";
assert.strictEqual(
  CBFConverter.convertChordText(
    synthManualRows.split("\n")[0],
    settings,
    ["4442244422"],
    [legacyBracketedSynth],
    ["4442244422"],
    ["edit"]
  ).output,
  synthManualRows.split("\n")[0],
  "a stale automatic correction and legacy edit state must not re-bracket a newly recognized instrumental source row"
);
const edgeWhitespaceManualRow = "  (Synth)|[C]---- [G]----|　 ";
assert.strictEqual(
  CBFConverter.convertChordText(edgeWhitespaceManualRow, settings, []).output,
  edgeWhitespaceManualRow,
  "leading and trailing spaces on a preserved instrumental row must remain byte-for-byte intact"
);
const repeatAnnotatedRhythm = "[E]-[E/B]-[E]-[E/B]-|[E]-[E/B]-[E]-[E/B]-|[E]-[E/B]-[E]-[E/B]-|[E]-[E/B]-[E]-[E/B]-|･･･ (Repeat...)";
assert.strictEqual(
  CBFConverter.convertChordText(repeatAnnotatedRhythm, settings, []).output,
  repeatAnnotatedRhythm,
  "a trailing parenthesized repeat note and notation-only marks must not turn a compact rhythm row into lyrics"
);

console.log("PASS: CONVERT-003/004/008 and ROW-008 conversion regressions");
