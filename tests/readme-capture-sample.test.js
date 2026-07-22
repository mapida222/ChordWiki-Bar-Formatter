"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "js/app.js"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
const captureGuide = fs.readFileSync(path.join(root, "docs/README_CAPTURE_SAMPLE.md"), "utf8");

for (const expected of [
  "{comment:コード・小節線・行修正・譜面プレビューの確認用です}",
  "[C]コード譜を[G]貼り付けると",
  "[Dm]曲に合わない[G]部分は",
  "[F]アクセントや[G]細かな長さも",
  "[F]変換結果を[G]確認して",
  'const INITIAL_CORRECTION = ["", "", "", "", "4444", "43^4a", "44^*4a", "", "4433"].join("\\n");'
]) {
  assert(app.includes(expected), `missing app sample: ${expected}`);
}

assert(captureGuide.includes("管理番号：`PUBLIC-002`"));
assert(captureGuide.includes("個人情報や実在曲の歌詞を使用せず"));
assert(readme.includes("[ChordWiki公式サイト](https://ja.chordwiki.org/)　非公式ツールです。"));
assert(!readme.includes("運営元とは関係ありません"));

console.log("PASS: README capture sample is reproducible and contains no real song lyrics");
