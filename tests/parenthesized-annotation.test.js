"use strict";

const assert = require("assert");
global.window = global;
require("../js/converter.js");

const settings = {
  measureCapacity: 8,
  hyphenUnit: 4,
  hyphenSpacing: 4,
  shortFractionPrepose: 1,
  longBeatLyricPlacement: 0,
  showContinuationChord: 0,
  singleCharacterHyphens: 0
};

const source = "|[Cadd9](rit...)　　　　　|　　　　　|";
const result = CBFConverter.convertChordText(source, settings, []);
assert.strictEqual(result.output, source, "(rit...) must remain authored without making the line lyric-bearing");

const unisonSource = "|[C#m]---- [/D#]----|[/E]---- [/G#]----[|](unis)[/A][----][/G#][----]|[/A]-[/G#]-[/E]-[/C#]- -";
const unisonResult = CBFConverter.convertChordText(unisonSource, settings, []);
assert.strictEqual(unisonResult.output, unisonSource, "(unis) must remain notation and must not add lyric brackets to an interlude line");

const ritSource = "[Ab]-|---- ----|[Ab]---- ---[G]-|---- ----|[G]--[N.C.](rit...)-- ----|";
const ritResult = CBFConverter.convertChordText(ritSource, settings, []);
assert.strictEqual(
  ritResult.output,
  ritSource,
  "(rit...) must remain notation while preserving the authored compact rhythm layout"
);

console.log("PASS: parenthesized annotations remain in their authored compact form");
