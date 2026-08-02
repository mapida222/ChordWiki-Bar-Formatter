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

const source = "Get [Am]wild [G]and [F]tough　|[G]---- [C]----|[Am]---- [F]----|[G]---- [C]----|";
const expected = "Get [|][Am][--]wild [G][--]and [F][----]tough　|[G]---- [C]----|[Am]---- [F]----|[G]---- [C]----|";
const converted = CBFConverter.convertChordText(source, settings, []);
assert.strictEqual(converted.output, expected);
assert.strictEqual(converted.corrections, "224444444");
assert.strictEqual(CBFConverter.renderCompletedOutput(converted.output, [4], 4).output, expected);

const singleCodeOnlyMeasure = CBFConverter.convertChordText("[C]歌詞|[D]----|", settings, []);
assert.strictEqual(singleCodeOnlyMeasure.output, "[|][C]歌詞[|][D][----][|]", "one code-only measure remains in the normal bracketed notation");

const vocalMeasure = "[C]歌詞|[F]----[G]----|(ah...)[Am]----[Em]----|[D]----[A]----|";
const vocalConverted = CBFConverter.convertChordText(vocalMeasure, settings, []);
const vocalCompleted = CBFConverter.renderCompletedOutput(vocalConverted.output, [4], 4).output;
assert(vocalCompleted.includes("[|](ah...)[Am][----][Em][----]|"), "(ah...) must keep its measure in lyric notation");
assert(vocalCompleted.endsWith("|[D]----[A]----|"), "a lyric-free measure must use compact code-only notation");

console.log("PASS: CONVERT-009 mixed lyric/code-only measure notation");
