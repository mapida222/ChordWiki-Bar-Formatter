"use strict";

const assert = require("assert");
global.window = global;
require("../js/converter.js");

const settings = {
  hyphenUnit: 4,
  measureCapacity: 6,
  hyphenSpacing: 3,
  shortFractionPrepose: 1,
  longBeatLyricPlacement: 1,
  showContinuationChord: 0
};

const source = "長（な[Fm]が）い旅（た[Bb]び）の途中　君[DbM7]に出逢い　うつ[Eb]ろう景色";

const frontBack = CBFConverter.convertChordText(source, settings, ["cccc"]);
assert.strictEqual(
  frontBack.output,
  "長（な[|][Fm][---]が）い[---][|][---][---]旅（た[|][Bb][---]び）の途中[---][|][---][---]君[|][DbM7][---]に出逢い[---][|][---][---]うつ[|][Eb][---]ろう[---][|][---][---]景色[|]",
  "recommended mode should put lyric halves on the first and last visible markers"
);

const unchanged = CBFConverter.convertChordText(
  source,
  { ...settings, longBeatLyricPlacement: 0 },
  ["cccc"]
);
assert.strictEqual(
  unchanged.output,
  "長（な[|][Fm][---][---][|][---][---]が）い旅（た[|][Bb][---][---][|][---][---]び）の途中　君[|][DbM7][---][---][|][---][---]に出逢い　うつ[|][Eb][---][---][|][---][---]ろう景色[|]",
  "legacy mode should leave lyrics after the duration markers"
);

const uniform = CBFConverter.convertChordText(
  source,
  { ...settings, longBeatLyricPlacement: 2 },
  ["cccc"]
);
assert.strictEqual(
  uniform.output,
  "長（な[|][Fm][---]が）[---]い旅[|][---]（[---]た[|][Bb][---]び）[---]の途[|][---]中[---]君[|][DbM7][---]に出[---]逢い[|][---]う[---]つ[|][Eb][---]ろ[---]う[|][---]景[---]色[|]",
  "uniform mode should distribute grapheme clusters across every visible marker"
);

const fullWidthBoundary = CBFConverter.convertChordText(
  "[Bbm7]今日も　[Cm7]笑い合え[DbM7]る　居場所　紡ぐ",
  settings,
  ["66c"]
);
assert.strictEqual(
  fullWidthBoundary.output,
  "[|][Bbm7][---]今日[---]も[|][Cm7][---]笑い[---]合え[|][DbM7][---]る[---][|][---][---]居場所　紡ぐ[|]",
  "the first authored full-width space should split front/back placement without removing later spaces"
);

const fiveBeat = CBFConverter.convertChordText(
  "[C]あいうえお",
  { ...settings, measureCapacity: 8 },
  ["5"]
);
assert.strictEqual(
  fiveBeat.output,
  "[|][C][---]あいう[--]えお[|]",
  "odd lyric counts should give the extra grapheme to the front"
);

const completed = CBFConverter.renderCompletedOutput(fullWidthBoundary.output, [6], 3);
assert.strictEqual(
  completed.output,
  "[|][Bbm7]今日も[|][Cm7]笑い合え[|][DbM7][---]る[---][|][---][---]居場所　紡ぐ[|]",
  "selected six-beat markers should still be removable after lyric placement"
);

const overlappingSettingsSource = "[C]前[G]あいうえ";
const longPlacementWithPrepose = CBFConverter.convertChordText(
  overlappingSettingsSource,
  { ...settings, measureCapacity: 8, hyphenSpacing: 4, shortFractionPrepose: 1 },
  ["6c"]
).output;
const longPlacementWithoutPrepose = CBFConverter.convertChordText(
  overlappingSettingsSource,
  { ...settings, measureCapacity: 8, hyphenSpacing: 4, shortFractionPrepose: 0 },
  ["6c"]
).output;
assert.strictEqual(
  longPlacementWithPrepose,
  longPlacementWithoutPrepose,
  "eligible long-beat placement takes priority instead of being repositioned again by fractional prepose"
);
assert.notStrictEqual(
  longPlacementWithPrepose,
  CBFConverter.convertChordText(
    overlappingSettingsSource,
    { ...settings, measureCapacity: 8, hyphenSpacing: 4, shortFractionPrepose: 1, longBeatLyricPlacement: 0 },
    ["6c"]
  ).output,
  "fractional prepose remains active when long-beat placement is disabled"
);

console.log("PASS: ROW-007 selectable long-beat lyric placement");
