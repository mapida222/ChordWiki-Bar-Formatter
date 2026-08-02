"use strict";

const assert = require("assert");
global.window = global;
require("../js/converter.js");

[
  ["全角1文字", "[|][C][----][----]あ[|]"],
  ["半角1文字", "[|][C][----][----]A[|]"],
  ["空白を伴う1文字", "[|][C][----][----] A　[|]"]
].forEach(([name, source]) => {
  const result = CBFConverter.renderCompletedOutput(source, [4], 4);
  assert.strictEqual(result.removedHyphens, 8, `${name}の完全な1小節はハイフンを削除する`);
  assert.ok(!result.output.includes("[----]"));
});

const incompleteSingleCharacter = CBFConverter.renderCompletedOutput("[|][C][----]A[|]", [4], 4);
assert.strictEqual(incompleteSingleCharacter.removedHyphens, 0);
assert.ok(incompleteSingleCharacter.output.includes("[----]"));

const keptSingleCharacter = CBFConverter.renderCompletedOutput("[|][C][----][----]あ[|]", [4], 4, false, true);
assert.strictEqual(keptSingleCharacter.removedHyphens, 0, "残す設定では1文字小節のハイフンを省略しない");
assert.ok(keptSingleCharacter.output.includes("[----]"));

const splitSingleCharacter = "[|][C#m][----]は[----][|]";
const removedSplitSingleCharacter = CBFConverter.renderCompletedOutput(splitSingleCharacter, [4], 4);
assert.strictEqual(removedSplitSingleCharacter.output, "[|][C#m]は　[|]", "省略する設定では1文字の前後にあるハイフンを両方外し、歌詞末尾の空白は保持する");
const keptSplitSingleCharacter = CBFConverter.renderCompletedOutput(splitSingleCharacter, [4], 4, false, true);
assert.strictEqual(keptSplitSingleCharacter.output, splitSingleCharacter, "残す設定では1文字の前後にあるハイフンをそのまま残す");

const twoCharacters = CBFConverter.renderCompletedOutput("[|][C][----][----]AB[|]", [4], 4);
assert.strictEqual(twoCharacters.removedHyphens, 8);
assert.ok(!twoCharacters.output.includes("[----]"));

console.log("PASS: complete single-character measures remove hyphens while incomplete measures stay protected");
