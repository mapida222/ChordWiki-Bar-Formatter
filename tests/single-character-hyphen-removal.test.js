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
  assert.strictEqual(result.removedHyphens, 0, `${name}の小節はハイフンを削除しない`);
  assert.ok(result.output.includes("[----][----]"));
});

const twoCharacters = CBFConverter.renderCompletedOutput("[|][C][----][----]AB[|]", [4], 4);
assert.strictEqual(twoCharacters.removedHyphens, 8);
assert.ok(!twoCharacters.output.includes("[----]"));

console.log("PASS: a single lyric character protects its measure hyphens");
