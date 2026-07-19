"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
global.window = global;
require("../js/converter.js");

const source = "[GM7][GM7][Am7][D7][GM7][GM7][Am7][D7]";
const base = {
  hyphenUnit: 4,
  measureCapacity: 8,
  hyphenSpacing: 4,
  shortFractionPrepose: 1,
  showContinuationChord: 0
};

function completed(code, settings) {
  const converted = CBFConverter.convertChordText(source, settings, [code]);
  return CBFConverter.renderCompletedOutput(converted.output, [], settings.hyphenSpacing).output;
}

assert.strictEqual(
  completed("4s44s44s44s4", { ...base, measureCapacity: 4 }),
  "|[GM7]---=[GM7]=|----|[Am7]---=[D7]=|----|[GM7]---=[GM7]=|----|[Am7]---=[D7]=|----|"
);
assert.strictEqual(
  completed("79797979", base),
  "|[GM7]---- ---[GM7]-|---- ----|[Am7]---- ---[D7]-|---- ----|[GM7]---- ---[GM7]-|---- ----|[Am7]---- ---[D7]-|---- ----|"
);
assert.strictEqual(
  completed("4s44s44s44s4", base),
  "|[GM7]---=[GM7]= ----|[Am7]---=[D7]= ----|[GM7]---=[GM7]= ----|[Am7]---=[D7]= ----|"
);
assert.strictEqual(
  completed("*7*9*7*9*7*9*7*9", { ...base, measureCapacity: 16 }),
  "|[GM7]==== ===[GM7]= ==== ====|[Am7]==== ===[D7]= ==== ====|[GM7]==== ===[GM7]= ==== ====|[Am7]==== ===[D7]= ==== ====|"
);

const allSync = CBFConverter.convertChordText("[GM7][GM7][Am7][D7]", { ...base, measureCapacity: 4 }, ["s"]);
assert.strictEqual(CBFConverter.renderCompletedOutput(allSync.output, [], 4).output, "|[GM7]---=[GM7]=|----|[Am7]---=[D7]=|----|");
assert.strictEqual(allSync.corrections, "s");

const automatic = CBFConverter.convertChordText("[C][G]", base, []);
const noEdit = CBFConverter.convertChordText("[C][G]", base, ["n"]);
assert.strictEqual(noEdit.output, automatic.output);
assert.strictEqual(noEdit.corrections, "n");

assert.strictEqual(
  CBFConverter.inferBeatCodeFromRenderedLine("[|][GM7][---=][GM7][=][----][|]", "44", base),
  "4s4"
);
assert.strictEqual(CBFConverter.renderWithBeatCode("[C]", "h", base).body.match(/-/g).length, 24);
assert.strictEqual(CBFConverter.renderWithBeatCode("[C]", "i", base).body.match(/-/g).length, 32);

const syncLyricSource = "[G#m7]怒らせちゃうの[C#m7]なんで？";
const syncLyricConverted = CBFConverter.convertChordText(syncLyricSource, { ...base, measureCapacity: 4, shortFractionPrepose: 1 }, ["4s4"]);
assert.strictEqual(syncLyricConverted.corrections, "4s4", "the visible correction keeps the user-entered syncopation");
assert.strictEqual(syncLyricConverted.automaticCorrections, "44", "the automatic baseline remains separate from the user-entered syncopation");
assert.strictEqual(
  syncLyricConverted.output,
  "[|][G#m7][---=]怒らせちゃうの[C#m7][=]な[|][----]んで？[|]",
  "syncopation preposes the first lyric character across the measure boundary when enabled"
);
assert.strictEqual(
  CBFConverter.convertChordText(syncLyricSource, { ...base, measureCapacity: 4, shortFractionPrepose: 0 }, ["4s4"]).output,
  "[|][G#m7][---=]怒らせちゃうの[C#m7][=][|][----]なんで？[|]",
  "syncopation leaves the lyric after the boundary when prepose is disabled"
);

const authoredSyncSource = "だって[|][AM7]笑われてるから　[|][AM7]笑ってみたけど　[|][G#m7][---=]怒らせちゃうの[C#m7][=]な[|][----]んで？[|]";
const authoredSync = CBFConverter.convertChordText(authoredSyncSource, { ...base, measureCapacity: 4 });
assert.strictEqual(authoredSync.corrections, "444s4", "authored syncopation is inferred into the automatic row correction");
assert.strictEqual(
  authoredSync.output,
  authoredSyncSource,
  "authored syncopation does not gain a bar before its second chord"
);

const authoredCodeOnlySyncSource = "|[GM7]---=[GM7]=|----|[Am7]---=[D7]=|----|[GM7]---=[GM7]=|----|[Am7]---=[D7]=|----|";
const authoredCodeOnlySync = CBFConverter.convertChordText(authoredCodeOnlySyncSource, { ...base, measureCapacity: 4 });
assert.strictEqual(authoredCodeOnlySync.corrections, "4s44s44s44s4", "code-only authored syncopation is inferred into row correction");
assert.strictEqual(
  CBFConverter.renderCompletedOutput(authoredCodeOnlySync.output, [], 4).output,
  authoredCodeOnlySyncSource,
  "code-only authored syncopation keeps paired chords inside the same measure"
);

const guideText = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8")
  .replace(/<[^>]+>/g, "")
  .replace(/\s+/g, " ");
assert(guideText.includes("すべて「入力→何をする→結果」の順です。"));
assert(guideText.includes("入力できる文字：数字0～9、長さa～i、記号^・*・@・x・s、行修正しないnです。"));
assert(guideText.includes("a=10、b=11、c=12、d=13、e=14、f=15、g=16、h=24、i=32"));
assert(guideText.includes("4s44s4は4コード分です。"));
assert(guideText.includes("n→この行を変更しない→行修正を触る前の結果を使う"));

console.log("PASS: 4 syncopation notations, all-sync, no-edit, inference, compact length codes and readable guide");
