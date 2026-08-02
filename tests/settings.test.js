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
assert.strictEqual(settings.definitions.find((item) => item.key === "shortFractionPrepose").label, "端数の歌詞前置き");
assert.strictEqual(settings.definitions.find((item) => item.key === "longBeatLyricPlacement").label, "長い拍の歌詞配置");
assert.strictEqual(settings.definitions.find((item) => item.key === "singleCharacterHyphens").label, "1文字歌詞のハイフン有無");
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
assert.strictEqual(settings.load().longBeatLyricPlacement, 1);
assert.strictEqual(settings.load().singleCharacterHyphens, 0);

const zeroSpacing = settings.validate({ ...settings.defaults(), hyphenSpacing: 0 });
assert.strictEqual(zeroSpacing.valid, true);
assert.strictEqual(zeroSpacing.values.hyphenSpacing, 0);
settings.save({ ...settings.defaults(), hyphenUnit: 5 });
assert.strictEqual(settings.load("fourFour").hyphenUnit, 5);

let values = settings.setActiveProfile("sixEight");
assert.strictEqual(values.hyphenUnit, 3);
assert.strictEqual(values.measureCapacity, 6);
assert.strictEqual(values.hyphenSpacing, 3);
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
console.log("settings profile tests passed");
