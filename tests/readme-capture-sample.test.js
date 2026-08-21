"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "js/app.js"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
const captureGuide = fs.readFileSync(path.join(root, "docs/README_CAPTURE_SAMPLE.md"), "utf8");

for (const expected of [
  "{comment:----------【自動変換後】----------}",
  "{c:BPM=100　　4/4拍子",
  "[C]ChordPro形式の[G]テキストを貼ると",
  "[F]細かい部分は[G]手動修正が",
  "[F]編集[G]お疲れ",
  '4*s4*3*3*^24"].join("\\n");',
  "const INITIAL_SETTINGS = { measureCapacity: 8, hyphenUnit: 4, hyphenSpacing: 4, shortFractionPrepose: 1, longBeatLyricPlacement: 3, singleCharacterHyphens: 0, showContinuationChord: 0 };",
  'elements.lyricHyphenMode.value = "target";',
  'elements.removalTargets.value = "4,8";',
  "elements.removalLinked.checked = false;",
  "elements.plainEditBars.checked = false;"
]) {
  assert(app.includes(expected), `missing app sample: ${expected}`);
}

assert(captureGuide.includes("管理番号：`PUBLIC-002`"));
assert(captureGuide.includes("個人情報や実在曲の歌詞を使用せず"));
assert(readme.includes("ChordWikiで使われるChordPro形式に対応した非公式ツールです。"));
assert(!readme.includes("運営元とは関係ありません"));

console.log("PASS: README capture sample is reproducible and contains no real song lyrics");
