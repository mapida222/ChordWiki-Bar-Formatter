"use strict";

const assert = require("assert");
const fs = require("fs");
global.window = global;
require("../js/converter.js");

const analyze = CBFConverter.analyzeAuthoredMeasureCapacity;
const source = "[C]---- ----|[G]---- ----|";
assert.deepStrictEqual(analyze(source, 4, "4/4"), { configured: 4, detected: 8, measureCount: 2, candidateCount: 2, percentage: 100, lineNumbers: [1] });
assert.strictEqual(analyze(source, 8, "4/4"), null);
assert.deepStrictEqual(analyze(source, 8, "4/4", true), { configured: 8, detected: 8, measureCount: 2, candidateCount: 2, percentage: 100, lineNumbers: [1] });
assert.strictEqual(analyze("[C]---- ----|[G]---- ----|[F]----|", 4, "4/4"), null, "a single changed line must not trigger a song-wide warning");
assert.strictEqual(
  analyze("[C]---- ----|[G]---- ----|\n[Am]---- ----|[F]---- ----|\n[Bm]---- ----|[Em]---- ----|", 4, "4/4").percentage,
  100,
  "a matching format across the whole song should trigger a warning"
);
assert.strictEqual(
  analyze("[C]---- ----|[G]---- ----|\n[Am]---- ----|[F]---- ----|\n[Bm]----|[Em]----|", 4, "4/4"),
  null,
  "a local outlier in a longer song should not trigger a warning"
);
assert.strictEqual(analyze("[C]---- ----|", 4, "4/4").detected, 8, "a selected block with one measure must remain analyzable");
assert.strictEqual(analyze("[C]---- ----|\n[G]---- ----|", 4, "4/4").detected, 8);
assert.strictEqual(analyze("[C]歌詞[G]---- ----|", 4, "4/4"), null);
assert.strictEqual(analyze("[C]========|", 4, "4/4"), null);
const authoredIntervals = CBFConverter.analyzeAuthoredFormatting("[C]----[G]----[Am]\n[F]---- ----[Dm]---- ----[C]", { hyphenUnit: 8, hyphenSpacing: 4 });
assert.deepStrictEqual(authoredIntervals.hyphenUnit, { configured: 8, detected: 4, count: 4, candidateCount: 4, percentage: 100, lineNumbers: [1, 2] });
assert(!Object.hasOwn(authoredIntervals, "hyphenSpacing"), "空白区切り後のグループは設定差の解析対象にしない");
assert.strictEqual(CBFConverter.analyzeAuthoredFormatting("[C]--------[G]--------[Am]", { hyphenUnit: 4 }).hyphenUnit.detected, 8);
assert.strictEqual(CBFConverter.analyzeAuthoredFormatting("[C]----", { hyphenUnit: 2 }).hyphenUnit.detected, 4, "a partial block with one rhythm value must remain analyzable");
assert.strictEqual(CBFConverter.extractAuthoredLyrics("{title:前の曲}\n[C]花が咲く[----]日"), "花が咲く日", "lyrics are compared without titles or chord notation");
assert.strictEqual(CBFConverter.authoredLyricChangePercent("花が咲く", "花が咲く"), 0);
assert(CBFConverter.authoredLyricChangePercent("花が咲く日", "海を渡る舟") >= 90, "different short lyrics must cross the song-change threshold");
assert(CBFConverter.authoredLyricChangePercent("春の風が吹く丘を歩く", "夏の風が吹く丘を歩く") < 90, "small lyric edits must stay below the song-change threshold");
assert.strictEqual(analyze("{c:3/4拍子}\n[C]---|[F]---|", 4, "4/4"), null);
assert.strictEqual(analyze("{c:3/4拍子}\n[C]---|[F]---|", 4).detected, 3);
assert.strictEqual(analyze("{c:6/8拍子}\n[C]------|[F]------|", 8).detected, 6);
assert.strictEqual(analyze("{c:3+4+3+3/4拍子}\n[E]---|[G#m7]----|", 4, "4/4"), null);
assert.strictEqual(analyze("(2/4)[N.C.]----|[C]---- ----|", 8, "4/4"), null);

const index = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8");
assert(index.includes('id="measure-capacity-warning"'));
const app = fs.readFileSync(require("path").join(__dirname, "..", "js", "app.js"), "utf8");
assert(app.includes("analyzeAuthoredMeasureCapacity(elements.input.value, values.measureCapacity"));
assert(!app.includes("analyzeAuthoredMeasureCapacity(elements.input.value, values.measureCapacity, targetMeter)"));
assert(app.includes("判定できた小節の約${mismatch.percentage}%"));
assert(app.includes("6/8拍子タブへ切り替え、合計${suggestedCapacity}を適用しますか？"));
assert(app.includes('[3, 6, 9, 12].includes(mismatch.detected)'));
assert(app.includes("changed >= 90"), "warning eligibility must require a 90 percent lyric change");
assert(app.includes("hasExplicitSixEightMeter"), "an explicit 6/8 mark must determine the settings profile");
assert(app.includes('elements.measureCapacityWarningOpen.dataset.profile = useSixEightProfile ? "sixEight" : ""'));
assert(app.includes('`6/8・${suggestedCapacity}を適用`'));
assert(app.includes('CBFSettings.setActiveProfile("sixEight")'));
assert(app.includes('input.value = String(detected)'));
assert(app.includes('input.dispatchEvent(new Event("input", { bubbles: true }))'));
assert(app.includes("updateMeasureCapacityWarning(settings.values);"));
assert(index.includes('id="measure-capacity-warning-dismiss"'));
assert(app.includes('formattingDetails.push(detail("コード間のハイフン数", formatting.hyphenUnit, values.hyphenUnit));'));
assert(app.includes('formattingDetails.push(`空白区切り後のグループ：拍子標準の${standardHyphenSpacing}ハイフンごとに変更します`);'));
const warningTextBlock = app.match(/function updateMeasureCapacityWarning[\s\S]*?\n  \/\/ A terminal newline/);
assert(warningTextBlock && !warningTextBlock[0].includes("formatting.hyphenSpacing"), "spacing groups must not be inferred from authored text");
assert(app.includes('、${result.count}/${result.candidateCount}'));
assert(app.includes('、${measureDetails.measureCount}/${measureDetails.candidateCount}'));
assert(app.includes('`1小節：${detectedCapacity}ハイフン（${measureEvidence}）`'));
assert(index.includes("変更しない"));
assert(app.includes("elements.outputHeading, elements.measureCapacityWarning, elements.removalControls"));
const warningUpdater = app.match(/function updateMeasureCapacityWarning[\s\S]*?\n  function lineCount/);
assert(warningUpdater && (warningUpdater[0].match(/syncResultRowAlignment\(\)/g) || []).length >= 3);

console.log("PASS: clear authored-measure mismatches produce a settings warning");
