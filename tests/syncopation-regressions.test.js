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
  completed("4*s44*s44*s44*s4", { ...base, measureCapacity: 4 }),
  "|[GM7]---=[GM7]=|----|[Am7]---=[D7]=|----|[GM7]---=[GM7]=|----|[Am7]---=[D7]=|----|"
);
assert.strictEqual(
  completed("79797979", base),
  "|[GM7]---- ---[GM7]-|---- ----|[Am7]---- ---[D7]-|---- ----|[GM7]---- ---[GM7]-|---- ----|[Am7]---- ---[D7]-|---- ----|"
);
assert.strictEqual(
  completed("4*s44*s44*s44*s4", base),
  "|[GM7]---=[GM7]= ----|[Am7]---=[D7]= ----|[GM7]---=[GM7]= ----|[Am7]---=[D7]= ----|"
);
assert.strictEqual(
  completed("*7*9*7*9*7*9*7*9", { ...base, measureCapacity: 16 }),
  "|[GM7]==== ===[GM7]= ==== ====|[Am7]==== ===[D7]= ==== ====|[GM7]==== ===[GM7]= ==== ====|[Am7]==== ===[D7]= ==== ====|"
);

const incompleteLeadingSync = CBFConverter.convertChordText("[GM7][GM7][Am7][D7]", { ...base, measureCapacity: 4 }, ["s"]);
assert.strictEqual(CBFConverter.renderCompletedOutput(incompleteLeadingSync.output, [], 4).output, "|[GM7]----|[GM7]----|[Am7]----|[D7]----|");
assert.strictEqual(incompleteLeadingSync.corrections, "s");
assert.strictEqual(incompleteLeadingSync.correctionErrors.length, 1, "s alone is an incomplete leading-sync expression, not an all-row command");

const automatic = CBFConverter.convertChordText("[C][G]", base, []);
const noEdit = CBFConverter.convertChordText("[C][G]", base, ["n"]);
assert.strictEqual(noEdit.output, automatic.output);
assert.strictEqual(noEdit.corrections, "n");

assert.strictEqual(
  CBFConverter.inferBeatCodeFromRenderedLine("[|][GM7][---=][GM7][=][----][|]", "44", base),
  "4*s4"
);
assert.strictEqual(CBFConverter.renderWithBeatCode("[C]", "h", base).body.match(/-/g).length, 24);
assert.strictEqual(CBFConverter.renderWithBeatCode("[C]", "i", base).body.match(/-/g).length, 32);

const syncLyricSource = "[G#m7]怒らせちゃうの[C#m7]なんで？";
const syncLyricConverted = CBFConverter.convertChordText(syncLyricSource, { ...base, measureCapacity: 4, shortFractionPrepose: 1 }, ["4*s4"]);
assert.strictEqual(syncLyricConverted.corrections, "4*s4", "the visible correction keeps the user-entered half-hyphen syncopation");
assert.strictEqual(syncLyricConverted.automaticCorrections, "44", "the automatic baseline remains separate from the user-entered syncopation");
assert.strictEqual(
  syncLyricConverted.output,
  "[|][G#m7][---=]怒らせちゃうの[C#m7][=]な[|][----]んで？[|]",
  "syncopation preposes the first lyric character across the measure boundary when enabled"
);
assert.strictEqual(
  CBFConverter.convertChordText(syncLyricSource, { ...base, measureCapacity: 4, shortFractionPrepose: 0 }, ["4*s4"]).output,
  "[|][G#m7][---=]怒らせちゃうの[C#m7][=][|][----]なんで？[|]",
  "syncopation leaves the lyric after the boundary when prepose is disabled"
);

const authoredSyncSource = "だって[|][AM7]笑われてるから　[|][AM7]笑ってみたけど　[|][G#m7][---=]怒らせちゃうの[C#m7][=]な[|][----]んで？[|]";
const authoredSync = CBFConverter.convertChordText(authoredSyncSource, { ...base, measureCapacity: 4 });
assert.strictEqual(authoredSync.corrections, "444*s4", "authored half-hyphen syncopation is inferred into the automatic row correction");
assert.strictEqual(
  authoredSync.output,
  authoredSyncSource,
  "authored syncopation does not gain a bar before its second chord"
);

const authoredCodeOnlySyncSource = "|[GM7]---=[GM7]=|----|[Am7]---=[D7]=|----|[GM7]---=[GM7]=|----|[Am7]---=[D7]=|----|";
const authoredCodeOnlySync = CBFConverter.convertChordText(authoredCodeOnlySyncSource, { ...base, measureCapacity: 4 });
assert.strictEqual(authoredCodeOnlySync.corrections, "4*s44*s44*s44*s4", "code-only authored half-hyphen syncopation is inferred into row correction");
assert.strictEqual(
  CBFConverter.renderCompletedOutput(authoredCodeOnlySync.output, [], 4).output,
  authoredCodeOnlySyncSource,
  "code-only authored syncopation keeps paired chords inside the same measure"
);

const guideText = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8")
  .replace(/<[^>]+>/g, "")
  .replace(/\s+/g, " ");
const guideMarkup = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
assert(!guideText.includes("簡易版"));
assert.strictEqual((guideMarkup.match(/<details class="guide-item">/g) || []).length, 9);
assert(!/<details class="guide-item"\s+open/.test(guideMarkup));
const guideDetails = [...guideMarkup.matchAll(/<div class="guide-item-detail">([\s\S]*?)<\/div>/g)].map((match) => match[1]);
assert.strictEqual(guideDetails.length, 9);
guideDetails.forEach((detail) => {
  assert(detail.includes("guide-detail-label\">意味"));
  assert(/入力(?:→|⇒)結果/.test(detail));
});
assert(guideText.includes("詳細を全て表示▼"));
assert(guideText.includes("0～9ハイフン数"));
assert(guideText.includes("*=：ハイフンの半分音価"));
assert(guideText.includes("^&gt;：アクセント"));
assert(guideText.includes("@○：白玉"));
assert(guideText.includes("s-：ハイフンシンコペーション"));
assert(guideText.includes("*s=：イコールシンコペーション"));
assert(guideText.includes("| /小節頭を指定"));
assert(guideText.includes("a=10、b=11、c=12、d=13、e=14、f=15、g=16、h=24、i=32"));
assert(guideText.includes("次のコードをハイフン1個分早く鳴らします。小節線の位置は動かしません。行頭にも入力できます。"));
assert(guideText.includes("4s4→[C][---][G][-][----]"));
assert(guideText.includes("*s44*s44→[A]=|----[Bm7]---=[C#m7]=|----[D]----|"));
assert(guideText.includes("不足した右端は自動値を使います。1文字だけでも全コードへ繰り返しません。"));
assert(guideText.includes("入力⇒結果②4444⇒[C][----][G][----][Am][----][F][----]"));
assert(guideText.includes("4⇒[----]"));
assert(!guideText.includes("[----] or ----"));
assert(!guideText.includes("0はハイフンなしです。"));
assert(!guideText.includes("数字の4は、イコールの個数です。"));
const guideOrder = [...guideMarkup.matchAll(/<summary><code class="guide-input">([^<]+)<\/code>/g)].map((match) => match[1]);
assert.deepStrictEqual(guideOrder, ["0～9", "a～i", "*", "^", "@", "s", "*s", "| /", "x"]);
const deletedBar = window.CBFConverter.convertChordText("[G][C]", base, ["42x"]);
assert.strictEqual(deletedBar.output, "[|][G][----][C][--]");
const anchoredBar = window.CBFConverter.convertChordText("[G][G#dim][C][G/B]", base, ["22|44"]);
assert.strictEqual(anchoredBar.output, "[G][--][G#dim][--][|][C][----][G/B][----][|]");
assert(!anchoredBar.output.includes("[C][----][|][G/B]"));
const guideApp = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
assert(guideApp.includes("すべてを閉じる▲"));
assert(guideApp.includes("correctionGuideItems.forEach"));

const fullHyphenSync = CBFConverter.convertChordText("[A][Bm7][C#m7][D]", { ...base, measureCapacity: 8 }, ["4s44s4"]);
assert.strictEqual(CBFConverter.renderCompletedOutput(fullHyphenSync.output, [], 4).output, "|[A]---[Bm7]---- -|[C#m7]---[D]---- -|");
const leadingHalfSync = CBFConverter.convertChordText("[A][Bm7][C#m7][D]", { ...base, measureCapacity: 8 }, ["*s44*s44"]);
assert.strictEqual(CBFConverter.renderCompletedOutput(leadingHalfSync.output, [], 4).output, "[A]=|----[Bm7]---=[C#m7]=|----[D]----|");
const leadingFullSync = CBFConverter.convertChordText("[A][Bm7][C#m7][D]", { ...base, measureCapacity: 8 }, ["s44s44"]);
assert.strictEqual(CBFConverter.renderCompletedOutput(leadingFullSync.output, [], 4).output, "[A]-|----[Bm7]---[C#m7]-|----[D]----|");
assert.strictEqual(CBFConverter.inferBeatCodeFromRenderedLine("[A][=][|][----][Bm7][---=][C#m7][=][|][----][D][----][|]", "4444", base), "*s44*s44");
assert.strictEqual(CBFConverter.inferBeatCodeFromRenderedLine("[A][-][|][----][Bm7][---][C#m7][-][|][----][D][----][|]", "4444", base), "s44s44");

console.log("PASS: full/half/leading syncopation, no-edit, inference, compact length codes and readable guide");
