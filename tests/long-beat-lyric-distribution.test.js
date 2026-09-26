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

const syncopatedLongBeat = CBFConverter.convertChordText(
  "[C]あいう[D]かき",
  { ...settings, measureCapacity: 8, hyphenSpacing: 4, longBeatLyricPlacement: 2 },
  ["s8"]
).output;
assert.strictEqual(
  syncopatedLongBeat,
  "[C][-]あ[|][----]い[----]う[|][D][----]かき[|]",
  "s8 should distribute a dense lyric phrase across the visible long-beat markers"
);

const measureCompletingFourBeatSource = "嗚[|][Dm]呼　バ[Am]カ野郎何[|][Bb][--]死んでん[C][--]だ　お別[F][-]れすらし[---]ないで[|]";
const measureCompletingFourBeatSettings = {
  ...settings, hyphenUnit: 4, measureCapacity: 8, hyphenSpacing: 4, longBeatLyricPlacement: 2
};
const measureCompletingFourBeatRender = CBFConverter.renderWithBeatCode(
  measureCompletingFourBeatSource,
  "44224",
  measureCompletingFourBeatSettings,
  measureCompletingFourBeatSource
);
const measureCompletingFourBeat = CBFConverter.mergeCorrectionScope(
  measureCompletingFourBeatSource,
  measureCompletingFourBeatRender.body,
  "44223",
  "44224",
  measureCompletingFourBeatSettings
);
assert.strictEqual(
  measureCompletingFourBeat,
  "嗚[|][Dm]呼　バ[Am]カ野郎何[|][Bb][--]死んでん[C][--]だ　お別[F][----]れすらしないで[|]",
  "editing the final duration to four should preserve other measures and keep this complete bar on one marker"
);

const measureCompletingFourBeatWithRubySource = "昨日(きの[|][D#m]う)まであ[A#m]りがとう最期(さい[|][B][--]ご)に君[C#][--]の笑顔[A#/D][-]見れてよ[---]かった[|]";
const measureCompletingFourBeatWithRubyRender = CBFConverter.renderWithBeatCode(
  measureCompletingFourBeatWithRubySource,
  "44224",
  measureCompletingFourBeatSettings,
  measureCompletingFourBeatWithRubySource
);
const measureCompletingFourBeatWithRuby = CBFConverter.mergeCorrectionScope(
  measureCompletingFourBeatWithRubySource,
  measureCompletingFourBeatWithRubyRender.body,
  "44223",
  "44224",
  measureCompletingFourBeatSettings
);
assert.strictEqual(
  measureCompletingFourBeatWithRuby,
  "昨日(きの[|][D#m]う)まであ[A#m]りがとう最期(さい[|][B][--]ご)に君[C#][--]の笑顔[A#/D][----]見れてよかった[|]",
  "partial correction should preserve ruby lyrics and avoid splitting a measure-completing four-beat lyric"
);
const sameAsAutomaticMeasureCompletingEdit = CBFConverter.convertChordText(
  measureCompletingFourBeatWithRubySource,
  measureCompletingFourBeatSettings,
  ["44224"],
  [],
  ["44223"],
  ["edit"]
);
assert.strictEqual(
  sameAsAutomaticMeasureCompletingEdit.output,
  "昨日(きの[|][D#m]う)まであ[A#m]りがとう最期(さい[|][B][--]ご)に君[C#][--]の笑顔[A#/D][----]見れてよかった[|]",
  "a partial row edit must rerender the changed measure even when its new code equals the automatically detected code"
);
const sameAsAutomaticSpacedEdit = CBFConverter.convertChordText(
  measureCompletingFourBeatSource,
  measureCompletingFourBeatSettings,
  ["44224"],
  [],
  ["44223"],
  ["edit"]
);
assert.strictEqual(
  sameAsAutomaticSpacedEdit.output,
  "嗚[|][Dm]呼　バ[Am]カ野郎何[|][Bb][--]死んでん[C][--]だ　お別[F][----]れすらしないで[|]",
  "a partial row edit must preserve authored full-width lyric spaces around the changed measure"
);

const nineBeatAfterPickup = CBFConverter.convertChordText(
  "[C]前[D]舌打　た",
  { ...settings, measureCapacity: 8, hyphenSpacing: 4, shortFractionPrepose: 1, longBeatLyricPlacement: 2 },
  ["79"]
).output;
assert.strictEqual(
  nineBeatAfterPickup,
  "[|][C][----]前[---][D][-]舌[|][----]打　[----]た[|]",
  "a one-beat pickup must leave the following two long markers paired with their lyrics"
);

const pickupMarkerExamples = [
  [
    "[F#m7][-]な[|][----][---]んぴと)",
    "[F#m7][-]な[|][----]ん[---]ぴと)",
    "parenthesized reading text should still follow the two visible pickup-tail markers"
  ],
  [
    "[G#aug][-]た[|][----][---]りとも",
    "[G#aug][-]た[|][----]り[---]とも",
    "plain lyric text should be distributed after a short pickup"
  ],
  [
    "[C#m7][-]け[|][----][---]が)せな",
    "[C#m7][-]け[|][----]が)[---]せな",
    "a closing parenthesis should stay with the lyric before the next marker"
  ],
  [
    "[C#m7][-]舌[|][----][----]打　た",
    "[C#m7][-]舌[|][----]打　[----]た",
    "a full-width lyric boundary should stay with the first marker"
  ]
];
pickupMarkerExamples.forEach(([sourceLine, expectedLine, message]) => {
  assert.strictEqual(
    CBFConverter.distributePickupMarkerLyrics(sourceLine, { longBeatLyricPlacement: 2, hyphenSpacing: 4 }),
    expectedLine,
    message
  );
});

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

const syncopatedLyricBoundaryNg = "[|][Eb][----]寝癖[---]の[Cm7][-]ま[|][----][----]まで散[|][Ab][----][---]歩しちゃうん[Abm][-]だ[|][----][|]";
const syncopatedLyricBoundaryOk = "[|][Eb][----]寝癖[---]の[Cm7][-]ま[|][----]ま[----]で散[|][Ab][----]歩しちゃ[---]うん[Abm][-]だ[|][----][|]";
assert.strictEqual(
  CBFConverter.distributePickupMarkerLyrics(syncopatedLyricBoundaryNg, { longBeatLyricPlacement: 2, hyphenSpacing: 4 }),
  syncopatedLyricBoundaryOk,
  "8s88s8 should distribute adjacent lyric text across both rhythm-marker runs"
);

const symbolBoundarySource = "[|][EM7]ねぇ！見(み)覚(おぼ)[|][D#m7-5]えの[|][G#7]ある[|][Bm7]この海(うみ)[|][C#7]に　[|]";
const symbolBoundaryOutput = CBFConverter.convertChordText(symbolBoundarySource, { ...settings, measureCapacity: 8, hyphenSpacing: 4, longBeatLyricPlacement: 2 }, ["53547"]).output;
assert(
  !/\[-+\][)）\]］}｝〉》」『』【】〔〕〗〙〛、。，．・：；！？!?.,:;…]/u.test(symbolBoundaryOutput),
  "lyric distribution must never put a rhythm hyphen immediately before a closing symbol"
);
assert(
  symbolBoundaryOutput.includes("この海([|][-]うみ)"),
  "a rhythm marker after an opening parenthesis remains allowed"
);

console.log("PASS: ROW-007 selectable long-beat lyric placement");
