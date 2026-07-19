"use strict";

const assert = require("assert");
global.window = global;
require("../js/converter.js");

const settings = {
  hyphenUnit: 4,
  measureCapacity: 4,
  hyphenSpacing: 4,
  shortFractionPrepose: 1,
  showContinuationChord: 0
};

const source = [
  "{c:3+4+3+3/4拍子}",
  "[E]---|[G#m7]----|[A]---|[A]-[B]--|",
  "[E]---|[G#m7]----|[A]---|[A]-[B]--|",
  "{c:3/4拍子}",
  "[CM7]---|[FM7]---|[BbM7]---|[EbM7]---|[F#m7]---|",
  "{c:4/4拍子}",
  "[F#m7]----|[B]----|[B]-[N.C.]---|"
].join("\n");

const expected = [
  "{c:3+4+3+3/4拍子}",
  "[|][E][---][|][G#m7][----][|][A][---][|][A][-][B][--][|]",
  "[|][E][---][|][G#m7][----][|][A][---][|][A][-][B][--][|]",
  "{c:3/4拍子}",
  "[|][CM7][---][|][FM7][---][|][BbM7][---][|][EbM7][---][|][F#m7][---][|]",
  "{c:4/4拍子}",
  "[|][F#m7][----][|][B][----][|][B][-][N.C.][---][|]"
].join("\n");

const first = CBFConverter.convertChordText(source, settings, []);
assert.strictEqual(first.output, expected, "authored mixed-meter bars must be preserved");
assert.strictEqual(first.corrections, "\n34312\n34312\n\n33333\n\n4413");

const second = CBFConverter.convertChordText(source, settings, first.corrections.split("\n"));
assert.strictEqual(second.output, expected, "automatic correction values must not re-split authored bars");

const manual = CBFConverter.convertChordText(source.split("\n")[1], settings, ["44412"]);
assert.strictEqual(manual.output, "[|][E][----][|][G#m7][----][|][A][----][|][A][-][B][--][|]");
assert.strictEqual(manual.corrections, "44412");

console.log("PASS: authored mixed-meter bars survive automatic correction refresh");
