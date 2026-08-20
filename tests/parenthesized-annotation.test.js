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
assert.strictEqual(result.output, source, "parenthesized timing annotations must not convert a source line into a chord-only row");

console.log("PASS: parenthesized annotations remain in their authored compact form");
