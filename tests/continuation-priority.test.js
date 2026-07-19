"use strict";

const assert = require("assert");
global.window = global;
require("../js/converter.js");

const base = { hyphenUnit: 4, measureCapacity: 8, hyphenSpacing: 4, shortFractionPrepose: 1 };
const convert = (input, enabled, corrections = [], manual = []) => CBFConverter.convertChordText(
  input,
  { ...base, showContinuationChord: enabled ? 1 : 0 },
  corrections,
  manual
).output;

const manualRhythm = "|[C]---- ----|---- ----|---- ----|";
assert.strictEqual(
  convert(manualRhythm, false),
  "[|][C][----] [----][|][----] [----][|][----] [----][|]",
  "disabled continuation preserves every manual rhythm measure"
);
assert.strictEqual(
  convert(manualRhythm, true),
  "[|][C][----] [----][|][C][----] [----][|][C][----] [----][|]",
  "enabled continuation adds only the carried chord to chordless manual measures"
);
assert.strictEqual(
  convert("|[C]---- ----|[G]---- ----|---- ----|", true),
  "[|][C][----] [----][|][G][----] [----][|][G][----] [----][|]",
  "an authored chord replaces the chord being carried"
);
assert.strictEqual(
  convert("|[C]---- ----|[N.C.]---- ----|---- ----|", true),
  "[|][C][----] [----][|][N.C.][----] [----][|][----] [----][|]",
  "N.C. stops continuation into following chordless measures"
);
assert.strictEqual(
  convert("|[C]---- ----||---- ----|", true),
  "[|][C][----] [----][|][|][C][----] [----][|]",
  "an empty measure or double bar receives no phantom chord"
);

const directManual = "|[C]MANUAL---- ----|---- ----|";
assert.strictEqual(
  convert("|[C]---- ----|---- ----|", true, [], [directManual]),
  directManual,
  "direct result editing has priority over the continuation display setting"
);

const rowOff = convert("[C]lyric", false, ["h"]);
const rowOn = convert("[C]lyric", true, ["h"]);
assert.strictEqual(rowOff, "[|][C][----][----][|][----][----][|][----][----]lyric[|]", "row correction keeps blank continuation measures when disabled");
assert.strictEqual(rowOn, "[|][C][----][----][|][C][----][----][|][C][----][----]lyric[|]", "row correction remains stronger while the display setting adds carried chords");

console.log("PASS: continuation setting respects direct edits, row corrections, manual rhythm, N.C. and double bars");
