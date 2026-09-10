"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const check = require(path.join(__dirname, "..", "js", "measure-check.js"));
const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures", "meter-patterns.json"), "utf8"));

const meters = fixture.ranges.flatMap(({ numerators, denominators }) => (
  numerators.flatMap((numerator) => denominators.map((denominator) => `${numerator}/${denominator}`))
));

function rhythmForCapacity(capacity) {
  const units = Math.round(Number(capacity) * 2);
  return "-".repeat(Math.floor(units / 2)) + (units % 2 ? "=" : "");
}

assert.strictEqual(meters.length, 68, "全拍子パターンを登録する");
assert.strictEqual(new Set(meters).size, meters.length, "拍子パターンを重複登録しない");
assert.strictEqual(fixture.priority.length, 20, "実用優先度の高い拍子を登録する");

const parseResults = meters.map((text) => {
  const [numerator, denominator] = text.split("/").map(Number);
  const parsed = check.parseMeterText(text);
  assert(parsed, `${text}を入力値として保持できる`);
  assert.deepStrictEqual(
    { numerator: parsed.numerator, denominator: parsed.denominator, text: parsed.text },
    { numerator, denominator, text },
    `${text}の分子・分母を保持する`
  );
  assert.strictEqual(parsed.capacity, numerator * 8 / denominator, `${text}の小節容量を計算する`);

  const source = `|[C]${rhythmForCapacity(parsed.capacity)}|`;
  const result = check.validate(source, { defaultMeter: text });
  assert.strictEqual(result.ok, true, `${text}の容量に一致する小節を処理する`);
  assert.strictEqual(result.rhythmMeasures[0].beats, parsed.capacity, `${text}の実測値を一致させる`);
  return { text, parsed, inferred: check.inferredMeterForBeats(parsed.capacity) };
});

const inferredExact = parseResults.filter(({ text, inferred }) => inferred?.text === text).map(({ text }) => text);
const inferredAsOtherNotation = parseResults.filter(({ text, inferred }) => inferred && inferred.text !== text).map(({ text, inferred }) => `${text}->${inferred.text}`);
const inferredUnsupported = parseResults.filter(({ inferred }) => !inferred).map(({ text }) => text);
assert.deepStrictEqual(inferredUnsupported, ["1/16", "3/16", "5/16", "7/16", "9/16", "11/16", "13/16", "15/16"]);
assert(inferredAsOtherNotation.includes("3/4->6/8"), "3/4相当を自動推定すると6/8表記へ寄る現状を記録する");
assert(inferredAsOtherNotation.includes("5/4->10/8"), "5/4相当を自動推定すると10/8表記へ寄る現状を記録する");
assert(inferredExact.includes("4/4"));
assert(inferredExact.includes("6/8"));

const groupingResults = fixture.groupings.map(({ meter, grouping }) => {
  const parsed = check.parseMeterText(`${meter}(${grouping})`);
  const values = grouping.split("+").map(Number);
  const isValid = values.length >= 2 && values.every((value) => Number.isInteger(value) && value > 0)
    && values.reduce((sum, value) => sum + value, 0) === Number(meter.split("/")[0]);
  assert.strictEqual(Boolean(parsed.grouping), isValid, `${meter}(${grouping})のグルーピング妥当性を判定する`);
  if (isValid) assert.deepStrictEqual(parsed.grouping, values, `${meter}(${grouping})のまとまりを保持する`);
  return { meter, grouping, parsed, isValid };
});
const invalidGroupings = groupingResults.filter(({ isValid }) => !isValid);
assert.deepStrictEqual(invalidGroupings.map(({ meter, grouping }) => `${meter}(${grouping})`), ["15/8(2+3+3+3+2)"]);

const groupedA = check.validate("{ci:7/8(2+2+3)}\n|[C]-------|");
const groupedB = check.validate("{ci:7/8(2+3+2)}\n|[C]-------|");
assert.deepStrictEqual(groupedA.rhythmMeasures[0].meter.grouping, [2, 2, 3]);
assert.deepStrictEqual(groupedB.rhythmMeasures[0].meter.grouping, [2, 3, 2]);
assert.notDeepStrictEqual(groupedA.rhythmMeasures[0].meter.grouping, groupedB.rhythmMeasures[0].meter.grouping);
const proposal = check.proposeMeterAnnotation("|[C]-------|", {
  scope: "line",
  lineStart: 0,
  line: 1,
  meter: check.parseMeterText("7/8(2+2+3)")
});
assert.strictEqual(proposal.after, "{ci:7/8(2+2+3)拍子}\n|[C]-------|", "注釈生成でもグルーピングを保持する");
assert.deepStrictEqual(check.validate(proposal.after).rhythmMeasures[0].meter.grouping, [2, 2, 3], "生成した注釈を再解析してもグルーピングを保持する");

const legacyMixedDirective = check.parseDirectiveMeter("{ci:3+4+3+3/4拍子}");
assert.strictEqual(legacyMixedDirective.text, "3/4");
assert.strictEqual(legacyMixedDirective.grouping, null, "分子側の混合拍子表記はグルーピングとして保持されない現状を記録する");

for (const meter of ["2/4", "3/4", "4/4", "6/8"]) {
  const parsed = check.parseMeterText(meter);
  const result = check.validate(`|[C]${rhythmForCapacity(parsed.capacity)}|`, { defaultMeter: meter });
  assert.strictEqual(result.ok, true, `${meter}の既存回帰がない`);
  assert.strictEqual(result.issues.length, 0, `${meter}で拍子判定エラーを出さない`);
}

console.log(JSON.stringify({
  meters: meters.length,
  parseAndCapacity: meters.length,
  directValidation: meters.length,
  inferredExact,
  inferredAsOtherNotation,
  inferredUnsupported,
  groupingCases: groupingResults.length,
  invalidGroupings: invalidGroupings.map(({ meter, grouping }) => `${meter}(${grouping})`),
  groupingPreservedAtParse: true,
  groupingPreservedInProposal: true,
  legacyMixedGrouping: "not-preserved",
  standardRegression: ["2/4", "3/4", "4/4", "6/8"]
}, null, 2));
console.log("PASS: meter pattern inventory covers notation, capacity, inference, grouping, and standard regressions");
