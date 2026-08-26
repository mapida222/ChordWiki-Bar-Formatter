"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const localStorage = new MemoryStorage();
const context = { window: {}, localStorage };
vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, "..", "js", "settings.js"), "utf8"),
  context
);
const settings = context.window.CBFSettings;

assert.strictEqual(settings.definitions.find((item) => item.key === "hyphenUnit").label, "コード直後のハイフン数");
assert.strictEqual(settings.definitions.find((item) => item.key === "measureCapacity").label, "1小節の合計ハイフン数");
assert.strictEqual(settings.definitions.find((item) => item.key === "showContinuationChord").label, "コードなし小節に前コード");
assert.strictEqual(settings.definitions.find((item) => item.key === "shortFractionPrepose").label, "端数があるときの歌詞位置");
assert.strictEqual(settings.definitions.find((item) => item.key === "longBeatLyricPlacement").label, "長い拍の歌詞配置");
assert.strictEqual(settings.definitions.find((item) => item.key === "singleCharacterHyphens").label, "1文字小節にハイフン追記");
assert.strictEqual(
  JSON.stringify(settings.definitions.find((item) => item.key === "showContinuationChord").choices.map((choice) => choice.label)),
  JSON.stringify(["小節線だけ表示", "前のコードを表示"])
);
assert.strictEqual(
  JSON.stringify(settings.definitions.find((item) => item.key === "singleCharacterHyphens").choices.map((choice) => choice.label)),
  JSON.stringify(["ハイフン追記なし", "ハイフン追記あり"])
);
settings.definitions.forEach((item) => {
  assert.ok(item.examples.length >= 2, `${item.label}には比較できる例を表示する`);
  assert.ok(item.examples.some((example) => example.includes("→")), `${item.label}の例は変換結果を示す`);
});
assert.strictEqual(
  JSON.stringify(settings.definitions.find((item) => item.key === "measureCapacity").examples),
  JSON.stringify(["4 → [|][A][----][|][B][----][|][C#m7][----][|]", "6 → [|][A][---][---][|][B][---][C#m7][---][|]", "8 → [|][A][----][----][|][B][----][C#m7][----][|]（デフォルト）"])
);
assert.strictEqual(
  JSON.stringify(settings.definitions.map((item) => item.key)),
  JSON.stringify(["measureCapacity", "hyphenUnit", "hyphenSpacing", "showContinuationChord", "longBeatLyricPlacement", "shortFractionPrepose", "singleCharacterHyphens"])
);
assert.strictEqual(
  JSON.stringify(settings.definitions.find((item) => item.key === "hyphenUnit").examples),
  JSON.stringify(["2 → [A][--][B][--][C#m7][--]", "3 → [A][---][B][---][C#m7][---]", "4 → [A][----][B][----][C#m7][----]（デフォルト）"])
);

assert.strictEqual(settings.activeProfile(), "fourFour");
assert.strictEqual(settings.load().hyphenUnit, 4);
assert.strictEqual(settings.load().measureCapacity, 8);
assert.strictEqual(settings.load().hyphenSpacing, 4);
assert.strictEqual(settings.load().longBeatLyricPlacement, 2);
assert.strictEqual(settings.load().singleCharacterHyphens, 0);
assert.strictEqual(
  JSON.stringify(settings.definitions.find((item) => item.key === "longBeatLyricPlacement").choices.map((choice) => choice.label)),
  JSON.stringify(["通常", "ゆったり"]),
  "long-beat lyric placement should expose only the two beginner-facing choices"
);
assert.ok(
  settings.definitions.find((item) => item.key === "longBeatLyricPlacement").examples.includes("【推奨】通常："),
  "long-beat lyric placement should show the recommended normal example"
);
assert.ok(
  settings.definitions.find((item) => item.key === "longBeatLyricPlacement").examples.includes("【非推奨】ゆったり："),
  "long-beat lyric placement should show the non-recommended relaxed example"
);
localStorage.setItem("chordWikiBarFormatter.settingsProfiles.v1", JSON.stringify({ fourFour: { longBeatLyricPlacement: 0 } }));
assert.strictEqual(settings.load("fourFour").longBeatLyricPlacement, 2, "legacy lyric-placement choices should migrate to normal");
localStorage.removeItem("chordWikiBarFormatter.settingsProfiles.v1");
assert.strictEqual(settings.inferProfileFromValues({ measureCapacity: 8, hyphenUnit: 4, hyphenSpacing: 4 }), "fourFour");
assert.strictEqual(settings.inferProfileFromValues({ measureCapacity: 6, hyphenUnit: 3, hyphenSpacing: 3 }), "sixEight");

const zeroSpacing = settings.validate({ ...settings.defaults(), hyphenSpacing: 0 });
assert.strictEqual(zeroSpacing.valid, true);
assert.strictEqual(zeroSpacing.values.hyphenSpacing, 0);
settings.save({ ...settings.defaults(), hyphenUnit: 5 });
assert.strictEqual(settings.load("fourFour").hyphenUnit, 5);

let values = settings.setActiveProfile("sixEight");
assert.strictEqual(values.hyphenUnit, 3);
assert.strictEqual(values.measureCapacity, 6);
assert.strictEqual(values.hyphenSpacing, 3);
assert.strictEqual(values.longBeatLyricPlacement, 2);
settings.save({ ...values, hyphenUnit: 2 });

settings.setActiveProfile("fourFour");
assert.strictEqual(settings.load().hyphenUnit, 5);
settings.setActiveProfile("sixEight");
assert.strictEqual(settings.load().hyphenUnit, 2);

values = settings.setActiveProfile("custom", { ...settings.defaults(), measureCapacity: 12 });
assert.strictEqual(values.measureCapacity, 12);
settings.save({ ...values, measureCapacity: 16 });
settings.setActiveProfile("fourFour");
settings.setActiveProfile("custom");
assert.strictEqual(settings.load().measureCapacity, 16);

settings.resetActive();
assert.strictEqual(settings.load().measureCapacity, 8);
settings.setActiveProfile("fourFour");
settings.save({ ...settings.load(), measureCapacity: 6, hyphenUnit: 3, hyphenSpacing: 3 });
settings.resetForValues(settings.load());
assert.strictEqual(settings.activeProfile(), "sixEight");
assert.strictEqual(settings.load().measureCapacity, 6);
assert.strictEqual(settings.load().hyphenUnit, 3);
assert.strictEqual(settings.load().hyphenSpacing, 3);
console.log("settings profile tests passed");
