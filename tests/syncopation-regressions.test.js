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
const guideMarkup = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
assert(guideText.includes("簡易版"));
assert.strictEqual((guideMarkup.match(/<details class="guide-item">/g) || []).length, 8);
assert(!/<details class="guide-item"\s+open/.test(guideMarkup));
const guideDetails = [...guideMarkup.matchAll(/<div class="guide-item-detail">([\s\S]*?)<\/div>/g)].map((match) => match[1]);
assert.strictEqual(guideDetails.length, 8);
guideDetails.forEach((detail) => {
  assert(detail.indexOf("意味：</strong>") < detail.indexOf("入力⇒出力"));
});
assert(guideText.includes("詳細をすべて表示▼"));
assert(guideText.includes("0～9ハイフン数"));
assert(guideText.includes("*=（ハイフンの半分音価）"));
assert(guideText.includes("s半音価のシンコペーション"));
assert(guideText.includes("n行修正なし"));
assert(guideText.includes("a=10、b=11、c=12、d=13、e=14、f=15、g=16、h=24、i=32"));
assert(guideText.includes("4s44s4は4コード分です。"));
assert(guideText.includes("入力⇒出力：n⇒行修正を触る前の変換結果"));
assert(guideText.includes("入力⇒出力②：4444⇒[C][----][G][----][Am][----][F][----]"));
const guideApp = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
assert(guideApp.includes("詳細をすべて閉じる▲"));
assert(guideApp.includes("correctionGuideItems.forEach"));

console.log("PASS: 4 syncopation notations, all-sync, no-edit, inference, compact length codes and readable guide");
