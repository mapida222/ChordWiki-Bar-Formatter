"use strict";

const assert = require("assert");
global.window = global;
require("../js/converter.js");
require("../js/correction-input.js");

const base = {
  hyphenUnit: 4,
  measureCapacity: 8,
  hyphenSpacing: 4,
  shortFractionPrepose: 1,
  longBeatLyricPlacement: 0,
  showContinuationChord: 0
};

const singleChord = CBFConverter.convertChordText("[C]", base, []);
assert.strictEqual(singleChord.output, "[|][C][----][|]", "a code-only chord uses the configured standard width, not a full measure");
assert.strictEqual(singleChord.corrections, "4");

const pairedChords = CBFConverter.convertChordText("[C][G]", base, []);
assert.strictEqual(pairedChords.output, "[|][C][----][G][----][|]", "code-only chords share a measure according to the standard width");
assert.strictEqual(pairedChords.corrections, "44");

assert.strictEqual(
  CBFConverter.convertChordText("[C]---- ----|", base, []).output,
  "[|][C][----] [----][|]",
  "an explicitly authored full-measure interlude remains unchanged"
);

assert.strictEqual(
  CBFCorrectionInput.normalizeLine("@8\\@8", 0),
  "@8|@8",
  "a backslash typed as a measure boundary must retain its parser meaning"
);

const whiteNoteDurationWithFullBeatLyric = CBFConverter.convertChordText(
  "[Gsus4]ハイフン数を[G]合わせます　[G#dim]",
  base,
  [CBFCorrectionInput.normalizeLine("8\\@4@4", 0)]
);
const anchoredFullBeatLyric = CBFConverter.convertChordText(
  "[Gsus4]ハイフン数を[G]合わせます　[G#dim]",
  base,
  [CBFCorrectionInput.normalizeLine("8\\44", 0)]
);
assert.strictEqual(
  anchoredFullBeatLyric.output,
  "[Gsus4][----]ハイフン数を[----][|][G][----]合わせます　[G#dim][----][|]",
  "an anchored full four-beat correction must not split its lyric as a 1+3 fraction"
);
assert.strictEqual(
  whiteNoteDurationWithFullBeatLyric.output,
  "[Gsus4][----]ハイフン数を[----][|][G][○][----]合わせます　[G#dim][○][----][|]",
  "a white-note correction at an anchored full beat must keep its lyric together"
);

assert.strictEqual(
  CBFConverter.convertChordText("[C]", base, ["@a"]).output,
  "[|][C][○][----][----][|][○][--][|]",
  "a white note continues across a measure even when chord continuation is disabled"
);
assert.strictEqual(
  CBFConverter.convertChordText("[C]", { ...base, showContinuationChord: 1 }, ["@a"]).output,
  "[|][C][○][----][----][|][C][○][--][|]",
  "white-note and chord continuation are both shown when chord continuation is enabled"
);

const syncopatedClosingMark = CBFConverter.convertChordText(
  "[G#m7]怒らせちゃうの[C#m7]な）んで？",
  { ...base, measureCapacity: 4 },
  ["4*s4"]
);
assert.strictEqual(
  syncopatedClosingMark.output,
  "[|][G#m7][---=]怒らせちゃうの[C#m7][=]な）[|][----]んで？[|]",
  "a closing mark follows the lyric character moved by syncopation"
);

console.log("PASS: pre-branch chord-only, boundary, white-note and closing-mark regressions");
