"use strict";

const assert = require("assert");
global.window = global;
require("../js/converter.js");

const settings = {
  hyphenUnit: 4, measureCapacity: 8, hyphenSpacing: 4,
  shortFractionPrepose: 1, longBeatLyricPlacement: 1, showContinuationChord: 0
};
const arrangementLine = "[Aadd9]---- ----|---- ----|[Aadd9](Key)>>=> =>>= >=>= >>>=|>>=> =>>= >=>= >>>=|～　||";
assert.strictEqual(
  CBFConverter.convertChordText(arrangementLine, settings, []).output,
  arrangementLine,
  "(Key) と単独の ～ を含む演奏記号行は、歌詞行にせず入力表記のまま残す"
);
assert.ok(
  CBFConverter.convertChordText("[A]あ|い", settings, []).output.includes("[|]　い"),
  "小節線の直後が歌詞なら全角空白を補う"
);
assert.ok(
  CBFConverter.convertChordText("[A]あ|[B]い", settings, []).output.includes("[|][B]"),
  "小節線の直後がコードなら空白を補わない"
);
assert.strictEqual(
  CBFConverter.convertChordText("[A]～", settings, []).output,
  "[|][A][○][|]",
  "単独の ～ は白玉として変換する"
);
assert.notStrictEqual(
  CBFConverter.convertChordText("[A]ゆ～ふぉ", settings, []).output,
  "[|][A][○][|]",
  "語中の ～ は白玉ではなく歌詞として扱う"
);

const mixedLyricAndRhythm = "|[Fm7]せなんと | か　なるか ら |[Fm7]>==>==>== [Gm7]>==>- |[Abm7]>-- [Ebm/Bb]>-[Bb7/D]>- ||";
assert.strictEqual(
  CBFConverter.convertChordText(mixedLyricAndRhythm, settings, []).output,
  "[|][Fm7]せなんと [|]　か　なるか ら　[|][Fm7]>==>==>== [Gm7]>==>- |[Abm7]>-- [Ebm/Bb]>-[Bb7/D]>- |",
  "歌詞小節と手入力リズム小節の混在行は、歌詞側だけ通常の小節線へ変換する"
);

console.log("PASS: arrangement labels and standalone wave markers preserve rhythm lines and distinguish lyric waves");
