"use strict";

const assert = require("assert");
global.window = global;
require("../js/correction-input.js");

assert.deepStrictEqual(
  CBFCorrectionInput.redistributeForLineBreaks(["26"], [2], [1, 1]),
  { lines: ["2", "6"], preserved: [true, true] },
  "splitting a source row must split its correction by chord order"
);

assert.deepStrictEqual(
  CBFCorrectionInput.redistributeForLineBreaks(["2", "6"], [1, 1], [2]),
  { lines: ["26"], preserved: [true] },
  "joining source rows must join their corrections by chord order"
);

assert.deepStrictEqual(
  CBFCorrectionInput.redistributeForLineBreaks(["4s4|26"], [4], [2, 2]),
  { lines: ["4s4", "26"], preserved: [true, true] },
  "markers inside each new row must survive while markers at the new row boundary are dropped"
);

assert.deepStrictEqual(
  CBFCorrectionInput.redistributeForLineBreaks(["n"], [2], [1, 1]),
  { lines: ["n", "n"], preserved: [true, true] },
  "the no-edit command must remain usable after a row split"
);

console.log("PASS: source-only line breaks redistribute row corrections without losing edits");
