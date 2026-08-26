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
  "長（な[|][Fm][---]が）い[---][|][---][---]旅（た[|][Bb][---]び）の途中　[---][|][---][---]君[|][DbM7][---]に出逢い　[---][|][---][---]うつ[|][Eb][---]ろう[---][|][---][---]景色[|]",
  "recommended mode should put lyric halves on the first and last visible markers"
);

const unchanged = CBFConverter.convertChordText(
  source,
  { ...settings, longBeatLyricPlacement: -1 },
  ["cccc"]
);
assert.strictEqual(
  unchanged.output,
  "長（な[|][Fm][---][---][|][---][---]が）い旅（た[|][Bb][---][---][|][---][---]び）の途中　君[|][DbM7][---][---][|][---][---]に出逢い　うつ[|][Eb][---][---][|][---][---]ろう景色[|]",
  "disabled mode should leave lyrics after the duration markers"
);

const uniform = CBFConverter.convertChordText(
  source,
  { ...settings, longBeatLyricPlacement: 2 },
  ["cccc"]
);
assert.strictEqual(
  uniform.output,
  "長（な[|][Fm][---]が）[---]い[|][---]旅[---]（た[|][Bb][---]び）[---]の[|][---]途[---]中君[|][DbM7][---]に出[---]逢[|][---]い[---]うつ[|][Eb][---]ろ[---]う[|][---]景[---]色[|]",
  "uniform mode should distribute grapheme clusters across every visible marker"
);

const fullWidthBoundary = CBFConverter.convertChordText(
  "[Bbm7]今日も　[Cm7]笑い合え[DbM7]る　居場所　紡ぐ",
  settings,
  ["66c"]
);
assert.strictEqual(
  fullWidthBoundary.output,
  "[|][Bbm7][---]今日[---]も[|][Cm7][---]笑い[---]合え[|][DbM7][---]る　[---][|][---][---]居場所　紡ぐ[|]",
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
  "[|][Bbm7]今日も[|][Cm7]笑い合え[|][DbM7][---]る　[---][|][---][---]居場所　紡ぐ[|]",
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
const fourBeatFrontBack = CBFConverter.convertChordText(
  "[E]けて[C#m/F]みたい[F#m]の",
  { ...settings, measureCapacity: 8, hyphenSpacing: 4, longBeatLyricPlacement: 1 },
  ["349"]
).output;
assert.ok(fourBeatFrontBack.includes("[E][---]けて[C#m/F][-]み[---]たい[F#m][-]の"), "a four-beat spacing unit should split for front/back lyric placement");
assert.notStrictEqual(
  longPlacementWithPrepose,
  CBFConverter.convertChordText(
    overlappingSettingsSource,
    { ...settings, measureCapacity: 8, hyphenSpacing: 4, shortFractionPrepose: 1, longBeatLyricPlacement: -1 },
    ["6c"]
  ).output,
  "fractional prepose remains active when long-beat placement is disabled"
);
const automaticShortBeat = CBFConverter.convertChordText(
  "[E]けて[C#m/F]みたい[F#m]の",
  { ...settings, measureCapacity: 8, hyphenSpacing: 4, longBeatLyricPlacement: 0 },
  ["349"]
).output;
assert.ok(automaticShortBeat.includes("[E][---]けて[C#m/F][-]み[---]たい[F#m][-]の"), "automatic mode should split a normal four-beat lyric span");
const automaticLongBeat = CBFConverter.convertChordText(
  source,
  { ...settings, longBeatLyricPlacement: 0 },
  ["cccc"]
).output;
const explicitFrontLongBeat = CBFConverter.convertChordText(
  source,
  { ...settings, longBeatLyricPlacement: 3 },
  ["cccc"]
).output;
assert.strictEqual(automaticLongBeat, explicitFrontLongBeat, "automatic mode should keep long-ballad lyrics at the front");

const chordMustLeadLyricWithRhythm = CBFConverter.convertChordText(
  "[C]眠れないまま朝を待って",
  { ...settings, measureCapacity: 8, hyphenSpacing: 4, longBeatLyricPlacement: 0 },
  ["88"]
).output;
assert.ok(
  !/\[C\][^\[\]|]+\[----\]/u.test(chordMustLeadLyricWithRhythm),
  "a chord must not be followed by lyric text before its rhythm hyphens"
);

const twoMeasurePatternA = CBFConverter.convertChordText(
  "[C]そっと[G]",
  { ...settings, measureCapacity: 8, hyphenSpacing: 4, longBeatLyricPlacement: 3 },
  ["88"]
).output;
assert.strictEqual(
  twoMeasurePatternA,
  "[|][C][----]そっと[----][|][G][----][----][|]",
  "pattern A should keep a short poetic lyric together and leave the second measure empty"
);

const twoMeasurePatternB = CBFConverter.convertChordText(
  "[C]ヘッドライト追い越して[G]夜のバイパス駆け抜ける",
  { ...settings, measureCapacity: 8, hyphenSpacing: 4, longBeatLyricPlacement: 2 },
  ["88"]
).output;
assert.strictEqual(
  twoMeasurePatternB,
  "[|][C][----]ヘッドライト[----]追い越して[|][G][----]夜のバイパス[----]駆け抜ける[|]",
  "pattern B should distribute a dense rap lyric across the four visible positions"
);

const sixEightNormal = CBFConverter.convertChordText(
  "[C]ヘッドライト追い越して[G]夜のバイパス駆け抜ける",
  { ...settings, hyphenUnit: 3, measureCapacity: 6, hyphenSpacing: 3, longBeatLyricPlacement: 2 },
  ["66"]
).output;
assert.strictEqual(
  sixEightNormal,
  "[|][C][---]ヘッドライト[---]追い越して[|][G][---]夜のバイパス[---]駆け抜ける[|]",
  "normal placement should evenly distribute lyrics in 6/8 too"
);

const sixEightRelaxed = CBFConverter.convertChordText(
  "[C]そっと[G]",
  { ...settings, hyphenUnit: 3, measureCapacity: 6, hyphenSpacing: 3, longBeatLyricPlacement: 3 },
  ["66"]
).output;
assert.strictEqual(
  sixEightRelaxed,
  "[|][C][---]そっと[---][|][G][---][---][|]",
  "relaxed placement should keep a short lyric near its chord in 6/8 too"
);

console.log("PASS: ROW-007 selectable long-beat lyric placement");
