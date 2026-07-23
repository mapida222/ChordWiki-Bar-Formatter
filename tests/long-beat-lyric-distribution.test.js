"use strict";

const assert = require("assert");
global.window = global;
require("../js/converter.js");

const sixBeatSettings = {
  hyphenUnit: 4,
  measureCapacity: 6,
  hyphenSpacing: 3,
  shortFractionPrepose: 1,
  showContinuationChord: 0
};

const longAcrossMeasures = CBFConverter.convertChordText(
  "[Bbm7]今日も　[Cm7]笑い合え[DbM7]る　居場所　紡ぐ",
  sixBeatSettings,
  ["66c"]
);
assert.strictEqual(
  longAcrossMeasures.output,
  "[|][Bbm7][---]今日[---]も　[|][Cm7][---][---]笑い合え[|][DbM7][---]る[---][|][---][---]　居場所　紡ぐ[|]",
  "row correction lyrics should be distributed across visible long-beat chunks"
);

const completed = CBFConverter.renderCompletedOutput(longAcrossMeasures.output, [6], 3);
assert.strictEqual(
  completed.output,
  "[|][Bbm7]今日も　[|][Cm7]笑い合え[|][DbM7][---]る[---][|][---][---]　居場所　紡ぐ[|]",
  "selected six-beat markers should still be removable after lyric distribution"
);

const fourChunkSettings = {
  ...sixBeatSettings,
  measureCapacity: 12
};
const fourChunks = CBFConverter.convertChordText(
  "[DbM7]あなたをおもう　[DbM7]",
  fourChunkSettings,
  ["cc"]
);
assert.strictEqual(
  fourChunks.output,
  "[|][DbM7][---]あな[---]たを[---]おも[---]う　[|][DbM7][---][---][---][---][|]",
  "seven lyric characters should be split 2, 2, 2 and 1 across four chunks"
);

const fiveBeat = CBFConverter.convertChordText(
  "[C]あいう　",
  { ...sixBeatSettings, measureCapacity: 8 },
  ["5"]
);
assert.strictEqual(
  fiveBeat.output,
  "[|][C][---]あい[--]う　[|]",
  "a five-beat value should distribute its remainder across two visible chunks"
);

const noFullWidthBoundary = CBFConverter.convertChordText(
  "[C]あいう",
  { ...sixBeatSettings, measureCapacity: 8 },
  ["5"]
);
assert.strictEqual(
  noFullWidthBoundary.output,
  "[|][C][---][--]あいう　[|]",
  "lyrics without a full-width-space boundary should keep the existing placement"
);

console.log("PASS: long row-edit beats distribute lyrics by visible chunks without breaking hyphen removal");
