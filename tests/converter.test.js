"use strict";
const assert = require("assert");
global.window = global;
require("../js/converter.js");

const settings = {
  hyphenUnit: 4,
  measureCapacity: 8,
  hyphenSpacing: 4,
  shortFractionPrepose: 1,
  showContinuationChord: 0
};

assert.strictEqual(CBFConverter.isChordSymbol("E7(9,11)"), true, "comma-separated tensions must be recognized as one chord");
assert.strictEqual(CBFConverter.isChordSymbol("C7(#9,b13)/E"), true, "comma-separated altered tensions and slash bass must be recognized as one chord");
assert.strictEqual(CBFConverter.parseTokens("[E7(9,11)]")[0]?.kind, "chord", "a bracketed comma-tension chord must not become lyric text");

const cases = [
  ["plain text", "plain text"],
  ["{title:Test}", "{title:Test}"],
  ["[C]", "[|][C][----][|]", "4"],
  ["[C][G]", "[|][C][----][G][----][|]", "44"],
  ["[C][G][Am]", "[|][C][----][G][----][|][Am][----][|]", "444"],
  ["[C]lyrics[G]words", "[|][C][----]lyrics[G][----]words[|]", "44"]
];

let failures = 0;
for (const [input, expected, expectedCorrection = ""] of cases) {
  const result = CBFConverter.convertChordText(input, settings, []);
  const actual = result.output;
  if (actual !== expected || result.corrections !== expectedCorrection) {
    failures += 1;
    console.error(`FAIL\ninput: ${input}\nexpected: ${expected}\nactual: ${actual}\nexpected correction: ${expectedCorrection}\nactual correction: ${result.corrections}`);
  }
}
if (failures) process.exitCode = 1;
const edited = CBFConverter.convertChordText("[C][G]", settings, ["22"]);
if (edited.output !== "[|][C][--][G][--][|]" || edited.corrections !== "22") {
  failures += 1;
  console.error(`FAIL realtime correction\nactual: ${edited.output}\ncorrection: ${edited.corrections}`);
}
const accentedFractionalLyric = CBFConverter.convertChordText("[G]闇[D]になる", settings, ["^3^5"]);
if (accentedFractionalLyric.output !== "[|][G][>--]闇[D][>]に[----]なる[|]" || accentedFractionalLyric.corrections !== "^3^5") {
  failures += 1;
  console.error(`FAIL accented fractional lyric prepose\nactual: ${accentedFractionalLyric.output}\ncorrection: ${accentedFractionalLyric.corrections}`);
}
const longBeatSpacingPatterns = [
  ["79", "[A]あ[B]い", "[|][A][----]あ[---][B][-]い[|][----][----][|]"],
  ["62", "[A]あ[B]い", "[|][A][----]あ[--][B][--]い[|]"],
  ["547", "[A]あ[B]い[C]う", "[|][A][----]あ[-][B][---]い[|][-][C][---]う[----][|]"]
];
const longBeatSettings = { ...settings, longBeatLyricPlacement: 3 };
longBeatSpacingPatterns.forEach(([code, input, expected]) => {
  const actual = CBFConverter.convertChordText(input, longBeatSettings, [code]).output;
  if (actual !== expected) {
    failures += 1;
    console.error(`FAIL long-beat spacing ${code}\nexpected: ${expected}\nactual: ${actual}`);
  }
});
const fractionalLyricPatterns = [
  ["accent-free one-beat fraction", "35", settings, "になる", "[|][G][---]闇[D][-]に[----]なる[|]"],
  ["two-beat fraction with two accents", "^2^^6", settings, "になる", "[|][G][>-]闇[D][>>]に[----]なる[|]"],
  ["accents continuing after the fraction", "^3^^^5", settings, "になる", "[|][G][>--]闇[D][>]に[>>--]なる[|]"],
  ["three-beat fraction is not preposed", "^1^7", settings, "になる", "[|][G][>]闇[D][>--][----]になる[|]"],
  ["prepose disabled", "^3^5", { ...settings, shortFractionPrepose: 0 }, "になる", "[|][G][>--]闇[D][>][----]になる[|]"],
  ["English word prepose", "^3^5", settings, "MY SOUL", "[|][G][>--]闇[D][>]MY[----] SOUL[|]"],
  ["half-note rhythm is not a hyphen fraction", "^3^*5", settings, "になる", "[|][G][>--]闇[D][≧====]になる[|]"]
];
fractionalLyricPatterns.forEach(([name, code, patternSettings, lyric, expected]) => {
  const actual = CBFConverter.convertChordText(`[G]闇[D]${lyric}`, patternSettings, [code]).output;
  if (actual !== expected) {
    failures += 1;
    console.error(`FAIL ${name}\nexpected: ${expected}\nactual: ${actual}`);
  }
});
const expanded = CBFConverter.convertChordText("[C][D][E][F][G][A]", settings, []);
if (expanded.corrections !== "444444") {
  failures += 1;
  console.error(`FAIL expanded uniform correction\nexpected: 444444\nactual: ${expanded.corrections}`);
}
const spacedChordOnly = CBFConverter.renderCompletedOutput(
  CBFConverter.convertChordText("[C][D][Bm7][Em7]", settings, []).output,
  [4],
  4
).output;
if (spacedChordOnly !== "|[C]----[D]----|[Bm7]----[Em7]----|") {
  failures += 1;
  console.error(`FAIL chord-only hyphen spacing\nactual: ${spacedChordOnly}`);
}
const zeroSpacingCases = [
  [16, "|[C]----|----|----|----|[G]----|----|----|----|"],
  [8, "|[C]----|----|[G]----|----|"]
];
const zeroSpacingOutputs = zeroSpacingCases.map(([hyphenUnit, expected]) => {
  const zeroSpacingSettings = { ...settings, measureCapacity: 4, hyphenUnit, hyphenSpacing: 0 };
  const converted = CBFConverter.convertChordText("[C][G]", zeroSpacingSettings, []);
  const output = CBFConverter.renderCompletedOutput(converted.output, [4], zeroSpacingSettings.hyphenSpacing).output;
  return { hyphenUnit, expected, output };
});
if (zeroSpacingOutputs.some(({ expected, output }) => output !== expected)) {
  failures += 1;
  console.error(`FAIL zero disables spacing without limiting chord duration to one measure\n${zeroSpacingOutputs.map(({ hyphenUnit, expected, output }) => `${hyphenUnit}: expected ${expected}, actual ${output}`).join("\n")}`);
}
const manualEightBeatSpacing = CBFConverter.renderCompletedOutput(
  CBFConverter.convertChordText("[Bm]---- ----|[F#m/A]---- ----|[GM7]---- ----|[F#m7]---- ----|", { ...settings, hyphenUnit: 8 }, []).output,
  [4],
  4
).output;
const manualEightBeatSpacingExpected = "|[Bm]---- ----|[F#m/A]---- ----|[GM7]---- ----|[F#m7]---- ----|";
if (manualEightBeatSpacing !== manualEightBeatSpacingExpected) {
  failures += 1;
  console.error(`FAIL eight-beat spacing must not precede a bar\nexpected: ${manualEightBeatSpacingExpected}\nactual: ${manualEightBeatSpacing}`);
}
const rhythmOnlyWithMeter = CBFConverter.convertChordText(
  "(3/4)|[D]-- -- --|[E]-- -- --|[Fdim]-- -- --|[F#m]-- -- --|[D]-- -- --|[E]-- -- --|[A][○]　　　　　|",
  settings,
  []
).output;
const rhythmOnlyWithMeterExpected = "(3/4)[|][D]-- -- --[|][E]-- -- --[|][Fdim]-- -- --[|][F#m]-- -- --[|][D]-- -- --[|][E]-- -- --[|][A][○]　　　　　[|]";
if (rhythmOnlyWithMeter !== rhythmOnlyWithMeterExpected) {
  failures += 1;
  console.error(`FAIL rhythm-only manual rows must not bracket hyphens\nexpected: ${rhythmOnlyWithMeterExpected}\nactual: ${rhythmOnlyWithMeter}`);
}
const trailingSeparatorBeforeBar = CBFConverter.renderCompletedOutput("[|][Bm][----] [----] [|]", [4], 4).output;
const sixteenBeatSpacing = CBFConverter.renderCompletedOutput("[|][C][----------------][|]", [4], 4).output;
if (trailingSeparatorBeforeBar !== "|[Bm]---- ----|" || sixteenBeatSpacing !== "|[C]---- ---- ---- ----|") {
  failures += 1;
  console.error(`FAIL spacing belongs only inside a continuous rhythm run\ntrailing: ${trailingSeparatorBeforeBar}\nsixteen: ${sixteenBeatSpacing}`);
}
const codeOnlyDialogueInput = [
  "[Bm]---- ----|[A]---- ----|[GM7]---- ----|[GM7]---- ----|　　　　　　　　(幻をいつも愛してる)",
  "[F#m7]---- ----|[Em7]---- ----|[F#7sus4]---- ----|[F#7sus4]----[F#7]----|　　　(何もわからずに)"
].join("\n");
const codeOnlyDialogueExpected = [
  "|[Bm]---- ----|[A]---- ----|[GM7]---- ----|[GM7]---- ----|　　　　　　　　(幻をいつも愛してる)",
  "|[F#m7]---- ----|[Em7]---- ----|[F#7sus4]---- ----|[F#7sus4]----[F#7]----|　　　(何もわからずに)"
].join("\n");
const codeOnlyDialogueConverted = CBFConverter.convertChordText(codeOnlyDialogueInput, { ...settings, hyphenUnit: 8 }, []);
const codeOnlyDialogueCompleted = CBFConverter.renderCompletedOutput(codeOnlyDialogueConverted.output, [4], 4).output;
if (codeOnlyDialogueCompleted !== codeOnlyDialogueExpected || /\([^\n]+\)\[\|\]/u.test(codeOnlyDialogueConverted.output)) {
  failures += 1;
  console.error(`FAIL trailing dialogue must stay outside the final bar\nexpected: ${codeOnlyDialogueExpected}\nconverted: ${codeOnlyDialogueConverted.output}\ncompleted: ${codeOnlyDialogueCompleted}`);
}
const directiveSymbols = CBFConverter.renderCompletedOutput("{c:BPM=90　4/4拍子　-：8分音符　>：アクセント}", [4]);
if (directiveSymbols.output !== "{c:BPM=90　4/4拍子　-：8分音符　>：アクセント}") {
  failures += 1;
  console.error(`FAIL directive symbol preservation\nactual: ${directiveSymbols.output}`);
}
const manualRhythm = CBFConverter.convertChordText("[G]歌詞[D]----|", settings, []);
if (manualRhythm.output !== "[|][G]歌詞[D][----][|]") {
  failures += 1;
  console.error(`FAIL manual rhythm bar normalization\nactual: ${manualRhythm.output}`);
}
const fourMeasureManualTailSettings = { ...settings, hyphenUnit: 8, measureCapacity: 8, hyphenSpacing: 4 };
const fourMeasureManualTail = CBFConverter.convertChordText(
  "いら[Bm]ない何も　捨て[GM7]てしまおう　君(き[A]み)を探し彷徨(さまよ)[D]う　MY SOUL　[D]--[D/C#]--|",
  fourMeasureManualTailSettings,
  []
);
const fourMeasureManualTailExpected = "いら[|][Bm]ない何も　捨て[|][GM7]てしまおう　君(き[|][A]み)を探し彷徨(さまよ)[|][D][----]う　MY SOUL　[D][--][D/C#][--][|]";
if (fourMeasureManualTail.output !== fourMeasureManualTailExpected || fourMeasureManualTail.corrections !== "888422") {
  failures += 1;
  console.error(`FAIL four-measure manual-tail completion\nexpected: ${fourMeasureManualTailExpected}\nactual: ${fourMeasureManualTail.output}\ncorrection: ${fourMeasureManualTail.corrections}`);
}
const shortManualTail = CBFConverter.convertChordText("[Bm]歌[D]う[D]--[D/C#]--|", fourMeasureManualTailSettings, []);
if (shortManualTail.output.includes("[D][----]う") || shortManualTail.corrections !== "8822") {
  failures += 1;
  console.error(`FAIL short manual-tail must not be expanded to four measures\nactual: ${shortManualTail.output}\ncorrection: ${shortManualTail.corrections}`);
}
const rowCorrectionBarPosition = CBFConverter.convertChordText(
  "[G]夢に向かい交差[D]点を渡[Bm]る　「途[F#7]中の人」はいいね",
  fourMeasureManualTailSettings,
  ["8448"]
);
const rowCorrectionBarPositionExpected = "[|][G][----][----]夢に向かい交差[|][D][----]点を渡[Bm][----]る　「途[|][F#7][----][----]中の人」はいいね[|]";
if (rowCorrectionBarPosition.output !== rowCorrectionBarPositionExpected || rowCorrectionBarPosition.corrections !== "8448") {
  failures += 1;
  console.error(`FAIL row correction must rebuild bar positions\nexpected: ${rowCorrectionBarPositionExpected}\nactual: ${rowCorrectionBarPosition.output}\ncorrection: ${rowCorrectionBarPosition.corrections}`);
}
const rowCorrectionCompletedExpected = "[|][G]夢に向かい交差[|][D]点を渡[Bm]る　「途[|][F#7]中の人」はいいね[|]";
const rowCorrectionCompleted = CBFConverter.renderCompletedOutput(rowCorrectionBarPosition.output, [4], 4).output;
const rowCorrectionOverManual = CBFConverter.mergeChangedLines(
  "[|][G]夢に向かい交差[|][D]点を渡[|][Bm]る　「途[|][F#7]中の人」は手動編集[|]",
  rowCorrectionCompleted,
  [0]
);
if (rowCorrectionCompleted !== rowCorrectionCompletedExpected || rowCorrectionOverManual !== rowCorrectionCompletedExpected) {
  failures += 1;
  console.error(`FAIL changed row correction must override the manually edited line\nexpected: ${rowCorrectionCompletedExpected}\ncompleted: ${rowCorrectionCompleted}\nmerged: ${rowCorrectionOverManual}`);
}
const manualRhythmLyrics = CBFConverter.convertChordText(
  "[G]---- ----|[G]---- ----|[G]---- ----|[D]>--- ----|\n"
    + "[G]たとえ[D/F#]ば　[Em]どうにか[Bm]して　君[C]の中　あ[D]あ　入ってい[G]って　[D]----|\n"
    + "[G]その瞳(め)か[D/F#]ら僕[Em]をのぞ[Bm]いたら　いろ[C]んなこ[D]とちょっとはわかるか[Esus4]も---- ----|",
  settings,
  []
);
const manualRhythmLyricsExpected = [
  "[|][G][----] [----][|][G][----] [----][|][G][----] [----][|][D][>---] [----][|]",
  "[|][G]たとえ[D/F#]ば　[|][Em]どうにか[Bm]して　君[|][C]の中　あ[D]あ　入ってい[|][G]って　[D][----][|]",
  "[|][G]その瞳(め)か[D/F#]ら僕[|][Em]をのぞ[Bm]いたら　いろ[|][C]んなこ[D]とちょっとはわかるか[|][Esus4]も[----] [----][|]"
].join("\n");
if (manualRhythmLyrics.output !== manualRhythmLyricsExpected) {
  failures += 1;
  console.error(`FAIL manual rhythm lyric measure bars\nexpected: ${manualRhythmLyricsExpected}\nactual: ${manualRhythmLyrics.output}`);
}
const groupedPartialWarning = CBFConverter.convertChordText("[C]----|\nplain text\n[D]----|", settings, []);
if (!groupedPartialWarning.warnings.includes("部分対応：手動ハイフン表記を保持（1,3行目／全2行）")) {
  failures += 1;
  console.error(`FAIL grouped partial warning\nactual: ${groupedPartialWarning.warnings.join(" / ")}`);
}
const manyPartialLines = CBFConverter.convertChordText(Array.from({ length: 10 }, () => "[C]----|").join("\n"), settings, []);
if (!manyPartialLines.warnings.includes("部分対応：手動ハイフン表記を保持（1,2,3,4,5,6,7,8,9,10行目／全10行）")) {
  failures += 1;
  console.error(`FAIL complete partial line list\nactual: ${manyPartialLines.warnings.join(" / ")}`);
}
const groupedCorrectionWarnings = CBFConverter.convertChordText(
  "[C][G]\n[D][A]\nplain text\n[E][F]",
  settings,
  ["888", "888", "", "888"]
);
if (!groupedCorrectionWarnings.warnings.includes("行修正エラー（1,2,4行目）：行修正の指定が1個多いため反映できません（修正対象2か所／指定3個）。")) {
  failures += 1;
  console.error(`FAIL grouped correction warnings\nactual: ${groupedCorrectionWarnings.warnings.join(" / ")}`);
}
const diffSource = "[C]あいうえ[D]お";
const diffOutput = "[|][C][----]あいうえ[D][----]お[|]";
const addedIndices = new Set(CBFConverter.addedCharacterIndices(diffSource, diffOutput));
const unchangedFromDiff = [...diffOutput].filter((_character, index) => !addedIndices.has(index)).join("");
const addedFromDiff = [...diffOutput].filter((_character, index) => addedIndices.has(index)).join("");
if (unchangedFromDiff !== diffSource || addedFromDiff !== "[|][----][----][|]") {
  failures += 1;
  console.error(`FAIL character diff\nexpected unchanged: ${diffSource}\nactual unchanged: ${unchangedFromDiff}\nactual added: ${addedFromDiff}`);
}
const editedDiffOutput = "手動" + diffOutput.replace("あいうえ", "あい・うえ");
const remappedAddedIndices = new Set(CBFConverter.remapTrackedCharacterIndices(diffOutput, editedDiffOutput, addedIndices));
const remappedAddedText = [...editedDiffOutput].filter((_character, index) => remappedAddedIndices.has(index)).join("");
if (remappedAddedText !== "[|][----][----][|]") {
  failures += 1;
  console.error(`FAIL stable automatic-addition highlight after manual edit\nactual: ${remappedAddedText}`);
}
const deletedAutomaticOutput = editedDiffOutput.replace("[----]", "");
const afterAutomaticDeletion = new Set(CBFConverter.remapTrackedCharacterIndices(editedDiffOutput, deletedAutomaticOutput, remappedAddedIndices));
const afterAutomaticDeletionText = [...deletedAutomaticOutput].filter((_character, index) => afterAutomaticDeletion.has(index)).join("");
if (afterAutomaticDeletionText !== "[|][----][|]") {
  failures += 1;
  console.error(`FAIL deleted automatic highlight removal\nactual: ${afterAutomaticDeletionText}`);
}
const zeroBeat = CBFConverter.convertChordText("[C][G]", settings, ["20"]);
if (zeroBeat.output !== "[|][C][--][G][|]" || zeroBeat.corrections !== "20") {
  failures += 1;
  console.error(`FAIL zero beat correction\nactual: ${zeroBeat.output}\ncorrection: ${zeroBeat.corrections}`);
}
const shortFraction = CBFConverter.convertChordText("[C][G]", settings, ["35"]);
if (shortFraction.output !== "[|][C][---][G][-][----][|]" || shortFraction.corrections !== "35") {
  failures += 1;
  console.error(`FAIL short fraction prepose\nexpected: [|][C][---][G][-][----][|]\nactual: ${shortFraction.output}`);
}
const automaticWhiteNote = CBFConverter.convertChordText("[C][○]", settings, []);
const whiteNote = CBFConverter.convertChordText("[C][○]", settings, ["@8"]);
if (automaticWhiteNote.corrections !== "@8" || whiteNote.output !== "[|][C][○][----][----][|]" || whiteNote.corrections !== "@8") {
  failures += 1;
  console.error(`FAIL white-note correction\nexpected: [|][C][○][----][----][|]\nactual: ${whiteNote.output}\nautomatic correction: ${automaticWhiteNote.corrections}\ncorrection: ${whiteNote.corrections}`);
}
const letterHValue = CBFConverter.convertChordText("[C]", settings, ["h"]);
if (letterHValue.output !== "[|][C][----][----][|][----][----][|][----][----][|]" || letterHValue.corrections !== "h") {
  failures += 1;
  console.error(`FAIL letter h value 24\nactual: ${letterHValue.output}\ncorrection: ${letterHValue.corrections}`);
}
const syncSource = "[GM7][GM7][Am7][D7][GM7][GM7][Am7][D7]";
const syncCode = "4*s44*s44*s44*s4";
const eighthSyncSettings = { ...settings, hyphenUnit: 4, measureCapacity: 4, hyphenSpacing: 4 };
const sixteenthSyncSettings = { ...settings, hyphenUnit: 4, measureCapacity: 8, hyphenSpacing: 4 };
const eighthSync = CBFConverter.convertChordText(syncSource, eighthSyncSettings, [syncCode]);
const sixteenthSync = CBFConverter.convertChordText(syncSource, sixteenthSyncSettings, [syncCode]);
const eighthSyncCompleted = CBFConverter.renderCompletedOutput(eighthSync.output, [], 4).output;
const sixteenthSyncCompleted = CBFConverter.renderCompletedOutput(sixteenthSync.output, [], 4).output;
const eighthSyncExpected = "|[GM7]---=[GM7]=|----|[Am7]---=[D7]=|----|[GM7]---=[GM7]=|----|[Am7]---=[D7]=|----|";
const sixteenthSyncExpected = "|[GM7]---=[GM7]= ----|[Am7]---=[D7]= ----|[GM7]---=[GM7]= ----|[Am7]---=[D7]= ----|";
if (eighthSyncCompleted !== eighthSyncExpected || sixteenthSyncCompleted !== sixteenthSyncExpected) {
  failures += 1;
  console.error(`FAIL mixed-value syncopation\n8th expected: ${eighthSyncExpected}\n8th actual: ${eighthSyncCompleted}\n16th expected: ${sixteenthSyncExpected}\n16th actual: ${sixteenthSyncCompleted}`);
}
const normalizedEighthSync = CBFConverter.convertChordText(syncSource, sixteenthSyncSettings, ["79797979"]);
const normalizedSixteenthSync = CBFConverter.convertChordText(syncSource, { ...settings, measureCapacity: 16, hyphenSpacing: 4 }, ["*7*9*7*9*7*9*7*9"]);
const normalizedEighthCompleted = CBFConverter.renderCompletedOutput(normalizedEighthSync.output, [], 4).output;
const normalizedSixteenthCompleted = CBFConverter.renderCompletedOutput(normalizedSixteenthSync.output, [], 4).output;
const normalizedEighthExpected = "|[GM7]---- ---[GM7]-|---- ----|[Am7]---- ---[D7]-|---- ----|[GM7]---- ---[GM7]-|---- ----|[Am7]---- ---[D7]-|---- ----|";
const normalizedSixteenthExpected = "|[GM7]==== ===[GM7]= ==== ====|[Am7]==== ===[D7]= ==== ====|[GM7]==== ===[GM7]= ==== ====|[Am7]==== ===[D7]= ==== ====|";
if (normalizedEighthCompleted !== normalizedEighthExpected || normalizedSixteenthCompleted !== normalizedSixteenthExpected) {
  failures += 1;
  console.error(`FAIL normalized syncopation alternatives\n8th expected: ${normalizedEighthExpected}\n8th actual: ${normalizedEighthCompleted}\n16th expected: ${normalizedSixteenthExpected}\n16th actual: ${normalizedSixteenthCompleted}`);
}
const incompleteLeadingSync = CBFConverter.convertChordText("[GM7][GM7][Am7][D7]", eighthSyncSettings, ["s"]);
const incompleteLeadingSyncCompleted = CBFConverter.renderCompletedOutput(incompleteLeadingSync.output, [], 4).output;
if (incompleteLeadingSyncCompleted !== "|[GM7]----|[GM7]----|[Am7]----|[D7]----|" || !incompleteLeadingSync.correctionErrors.length) {
  failures += 1;
  console.error(`FAIL incomplete leading s\nactual: ${incompleteLeadingSyncCompleted}\nerrors: ${incompleteLeadingSync.correctionErrors.length}`);
}
const noEditAutomatic = CBFConverter.convertChordText("[C][G]", settings, []);
const noEditCommand = CBFConverter.convertChordText("[C][G]", settings, ["n"]);
if (noEditCommand.output !== noEditAutomatic.output || noEditCommand.corrections !== "n") {
  failures += 1;
  console.error(`FAIL standalone n command\nautomatic: ${noEditAutomatic.output}\nactual: ${noEditCommand.output}\ncorrection: ${noEditCommand.corrections}`);
}
const whiteNoteSuffix = CBFConverter.convertChordText("[C][○]", settings, ["@4*"]);
if (whiteNoteSuffix.output !== "[|][C][○][----*][|]" || whiteNoteSuffix.corrections !== "@4*") {
  failures += 1;
  console.error(`FAIL white-note suffix\nactual: ${whiteNoteSuffix.output}\ncorrection: ${whiteNoteSuffix.corrections}`);
}
const insertedWhiteNote = CBFConverter.convertChordText("[G][G][G][D]", settings, ["444@"]);
const insertedWhiteNoteDuration = CBFConverter.convertChordText("[G][G][G][D]", settings, ["444@4"]);
if (insertedWhiteNote.output !== "[|][G][----][G][----][|][G][----][D][○][----][|]" || insertedWhiteNoteDuration.output !== "[|][G][----][G][----][|][G][----][D][○][----][|]") {
  failures += 1;
  console.error(`FAIL inserted white-note default duration\ndefault: ${insertedWhiteNote.output}\nexplicit: ${insertedWhiteNoteDuration.output}`);
}
const noBarBeforeFinalChord = CBFConverter.convertChordText("[C][D][(G)]", settings, ["44x4"]);
const noLeadingBar = CBFConverter.convertChordText("[D][C][D]", settings, ["x444"]);
if (noBarBeforeFinalChord.output !== "[|][C][----][D][----][(G)][----]" || noLeadingBar.output !== "[D][----][C][----][|][D][----][|]") {
  failures += 1;
  console.error(`FAIL no-bar modifier\nfinal chord: ${noBarBeforeFinalChord.output}\nleading chord: ${noLeadingBar.output}`);
}
const parenthesizedFinalChord = CBFConverter.convertChordText("[|][(Gadd9)]す　[|]", settings, ["4"]);
const parenthesizedFinalCompleted = CBFConverter.renderCompletedOutput(parenthesizedFinalChord.output, [4], settings.hyphenSpacing);
if (parenthesizedFinalChord.output !== "[|][(Gadd9)][----]す" || parenthesizedFinalCompleted.output !== "[|][(Gadd9)]す") {
  failures += 1;
  console.error(`FAIL parenthesized final chord trailing bar\nconverted: ${parenthesizedFinalChord.output}\ncompleted: ${parenthesizedFinalCompleted.output}`);
}
const parenthesizedMiddleChord = CBFConverter.convertChordText("[(Gadd9)]す[C]続く", settings, ["44"]);
if (!parenthesizedMiddleChord.output.endsWith("[|]")) {
  failures += 1;
  console.error(`FAIL middle parenthesized chord must keep final bar\nactual: ${parenthesizedMiddleChord.output}`);
}
const meterAnnotationLine = CBFConverter.convertChordText("手を[GM7]振る[A]君[F#m7]の瞳(め)[Bm7]を　帰[G]らぬ儚き蒼き日々を　|(2/4)[N.C.]----|", settings, []);
if (meterAnnotationLine.output.includes("[|](2/4)[|][N.C.]") || !meterAnnotationLine.output.includes("[|](2/4)[N.C.][----][|]")) {
  failures += 1;
  console.error(`FAIL meter annotation must not duplicate bar\nactual: ${meterAnnotationLine.output}`);
}
const manualIntroLine = CBFConverter.convertChordText("[Bm7]----[F#m7]----|[GM7]----[D]----|[GM7]----[F#m7]----|[Em7]----[A7]----|", settings, []);
if (manualIntroLine.output !== "[|][Bm7][----][F#m7][----][|][GM7][----][D][----][|][GM7][----][F#m7][----][|][Em7][----][A7][----][|]" || manualIntroLine.corrections !== "44444444") {
  failures += 1;
  console.error(`FAIL song intro bars/corrections\noutput: ${manualIntroLine.output}\ncorrection: ${manualIntroLine.corrections}`);
}
const xModifierLyrics = "[Am7]み)の気持[Bm7]ち知るま[C]で";
const xModifierCases = [
  ["444", "[|][Am7]み)の気持[Bm7]ち知るま[|][C][----]で[|]"],
  ["444x", "[|][Am7]み)の気持[Bm7]ち知るま[|][C]で"],
  ["44x4", "[|][Am7][----]み)の気持[Bm7][----]ち知るま[C][----]で[|]"]
];
xModifierCases.forEach(([code, expected]) => {
  const converted = CBFConverter.convertChordText(xModifierLyrics, settings, [code]);
  const completed = CBFConverter.renderCompletedOutput(converted.output, [4]).output;
  if (completed !== expected) {
    failures += 1;
    console.error(`FAIL x modifier ${code}\nexpected: ${expected}\nactual: ${completed}`);
  }
});
if (!CBFConverter.renderWithBeatCode("[C]", "i", settings).ok || CBFConverter.renderWithBeatCode("[C]", "j", settings).ok || CBFConverter.renderWithBeatCode("[C]", "o", settings).ok || CBFConverter.renderWithBeatCode("[C]", "w", settings).ok) {
  failures += 1;
  console.error("FAIL length-code range: i must mean 32 while removed letters are rejected");
}
const accentedHalfNotes = CBFConverter.convertChordText("[C][D]", settings, ["^*4^^*4"]);
if (accentedHalfNotes.output !== "[|][C][≧===][D][≧≧==][|]") {
  failures += 1;
  console.error(`FAIL accented half notes\nactual: ${accentedHalfNotes.output}`);
}
const completed = CBFConverter.renderCompletedOutput("[|][C][----]歌詞[D][----]歌詞[|]\n[|][E][----][----]歌詞[|]\n[|][F][----][|]", [4, 8]);
if (completed.output !== "[|][C]歌詞[D]歌詞　[|]\n[|][E]歌詞　[|]\n|[F]----|" || completed.removedHyphens !== 16 || completed.changedMeasures !== 2) {
  failures += 1;
  console.error(`FAIL completed output removal\nactual: ${completed.output}\nremoved: ${completed.removedHyphens}\nmeasures: ${completed.changedMeasures}`);
}
const complexThreeChordRhythm = "[|][Bm7][----]ない[Am/E][--]よ[D/F#][--][|]";
const complexOrphanRhythm = "[|][Bm7][----]ない[--]よ[D/F#][--][|]";
if (CBFConverter.renderCompletedOutput(complexThreeChordRhythm, [4], 4).output !== complexThreeChordRhythm
  || CBFConverter.renderCompletedOutput(complexOrphanRhythm, [4], 4).output !== complexOrphanRhythm) {
  failures += 1;
  console.error("FAIL complex 4+2+2 rhythm must take priority over removal target 4");
}
const lyricSymbolRuns = [
  ["[C]歌詞-->-が続く", "-->-"],
  ["[C]歌詞>==>が続く", ">==>"],
  ["[C]歌詞*=*が続く", "*=*"]
];
lyricSymbolRuns.forEach(([source, symbolRun]) => {
  const actual = CBFConverter.convertChordText(source, settings, []).output;
  if (!actual.includes(symbolRun) || actual.includes(`[${symbolRun}]`)) {
    failures += 1;
    console.error(`FAIL lyric symbols must remain ordinary text\nsource: ${source}\nactual: ${actual}`);
  }
});
const threeChordRemovalCases = [
  ["[|][G]あいう[C][--]え[G][--]お[|]", [4]],
  ["[|][G][--]あいう[C][--]え[G][--]お[|]", [2]]
];
threeChordRemovalCases.forEach(([source, selectedCounts]) => {
  const result = CBFConverter.renderCompletedOutput(source, selectedCounts, 4);
  if (result.output !== source || result.removedHyphens !== 0 || result.changedMeasures !== 0) {
    failures += 1;
    console.error(`FAIL measures with three or more chords must preserve change-timing hyphens\nsource: ${source}\nactual: ${result.output}`);
  }
});
function uniquePermutations(values) {
  if (values.length < 2) return [values];
  const permutations = [];
  values.forEach((value, index) => {
    uniquePermutations(values.filter((_, candidateIndex) => candidateIndex !== index)).forEach((tail) => {
      const candidate = [value, ...tail];
      if (!permutations.some((existing) => existing.join(",") === candidate.join(","))) permutations.push(candidate);
    });
  });
  return permutations;
}
const mixedEightBeatPartitions = [[4, 3, 1], [4, 2, 2], [4, 2, 1, 1], [4, 1, 1, 1, 1]];
const mixedEightBeatCases = mixedEightBeatPartitions.flatMap(uniquePermutations).map((widths) => {
  const chords = ["C", "D", "E", "F", "G"];
  return `[|]${widths.map((width, index) => `[${chords[index]}][${"-".repeat(width)}]歌詞`).join("")}[|]`;
});
const orphanRhythmCases = [
  "[|][--]前[C][----]中[D][--]後[|]",
  "[|][C][----]前[--]中[D][--]後[|]",
  "[|][C][----]前[D][--]中[--]後[|]",
  "[|][C][----]前半[----]後半[|]"
];
const mixedRhythmCases = [...mixedEightBeatCases, ...orphanRhythmCases, "[|][C][>---]強く[D][----]続く[|]"];
mixedRhythmCases.forEach((source) => {
  const actual = CBFConverter.renderCompletedOutput(source, [4], 4).output;
  if (actual !== source) {
    failures += 1;
    console.error(`FAIL mixed eight-beat rhythm must preserve target-4 marker\nsource: ${source}\nactual: ${actual}`);
  }
});
const simpleFourFour = "[|][C][----]あいう[D][----]えおか[|]";
const simpleFourFourExpected = "[|][C]あいう[D]えおか[|]";
if (CBFConverter.renderCompletedOutput(simpleFourFour, [4], 4).output !== simpleFourFourExpected) {
  failures += 1;
  console.error("FAIL simple 4+4 rhythm must still remove target-4 markers");
}
const shortFractionMissingTail = "[|][DbM7][---]に[C7sus4][-]日々の　[|]";
const shortFractionRestoredTail = "[|][DbM7][---]に[C7sus4][-]日[----]々の　[|]";
if (CBFConverter.renderCompletedOutput(shortFractionMissingTail, [4], 4).output !== shortFractionRestoredTail) {
  failures += 1;
  console.error("FAIL a 3+1 two-chord measure must restore its four-beat tail after the preposed lyric character");
}
const oneChordFourFour = "[|][C][----][----]歌詞続く[|]";
const oneChordFourFourExpected = "[|][C]歌詞続く[|]";
const incompleteFour = "[|][C][----]途中だけ[|]";
const incompleteFourExpected = "[|][C]途中だけ[|]";
if (CBFConverter.renderCompletedOutput(oneChordFourFour, [4], 4).output !== oneChordFourFourExpected
  || CBFConverter.renderCompletedOutput(incompleteFour, [4], 4).output !== incompleteFourExpected) {
  failures += 1;
  console.error("FAIL complete mixed eight-beat protection must not change ordinary target-4 removal");
}
const whiteNoteFourFour = "[|][A][----][Bm7][○][----][|]";
if (CBFConverter.renderCompletedOutput(whiteNoteFourFour, [4], 4).output !== whiteNoteFourFour) {
  failures += 1;
  console.error("FAIL white-note measure must preserve rhythm markers");
}
const expressiveRhythmCases = [
  "[|][A][>---]強く[Bm7][----]続ける[|]",
  "[|][A][----]前半[Bm7][>---]強く[|]",
  "[|][A][>>--]強く[Bm7][----]続ける[|]",
  "[|][A][≧≧≧＝]強く[Bm7][----]続ける[|]",
  "[|][A][====]伸ばす[Bm7][----]続ける[|]",
  "[|][A][>---]強く[Bm7][○][----]伸ばす[|]"
];
expressiveRhythmCases.forEach((source) => {
  if (CBFConverter.renderCompletedOutput(source, [4], 4).output !== source) {
    failures += 1;
    console.error(`FAIL expressive rhythm measure must preserve all rhythm markers\nsource: ${source}`);
  }
});
const adjacentMixedAndSimple = "[|][C][----]甲[D][--]乙[E][--]終端[|][F][----]あいう[G][----]えおか[|]";
const adjacentMixedAndSimpleExpected = "[|][C][----]甲[D][--]乙[E][--]終端[|][F]あいう[G]えおか[|]";
if (CBFConverter.renderCompletedOutput(adjacentMixedAndSimple, [4], 4).output !== adjacentMixedAndSimpleExpected) {
  failures += 1;
  console.error("FAIL target-4 removal must be decided independently for each measure");
}
const delayedRhythmSource = "今[Bm7]も忘れ[Am/E]よ--[D/F#]--|";
const delayedRhythmConverted = CBFConverter.convertChordText(delayedRhythmSource, settings, []);
if (!delayedRhythmConverted.output.includes("[Am/E][--]よ[D/F#][--][|]") || delayedRhythmConverted.output.includes("[Am/E]よ[--]")) {
  failures += 1;
  console.error(`FAIL delayed rhythm must move after chord\nactual: ${delayedRhythmConverted.output}`);
}
const shortTrailingLyrics = CBFConverter.renderCompletedOutput([
  "燃[|][D/F#]えるような月(つ[G]き)の輝(かが[|][A7]や)く丘[B]に[|]",
  "[|][B]には[|]",
  "[|][B]にいる[|]",
  "[|][B]に [|]",
  "[|][B]には　[|]"
].join("\n"), [4]);
const shortTrailingLyricsExpected = [
  "燃[|][D/F#]えるような月(つ[G]き)の輝(かが[|][A7]や)く丘[B]に　[|]",
  "[|][B]には　[|]",
  "[|][B]にいる[|]",
  "[|][B]に [|]",
  "[|][B]には　[|]"
].join("\n");
if (shortTrailingLyrics.output !== shortTrailingLyricsExpected) {
  failures += 1;
  console.error(`FAIL short trailing lyric padding\nexpected: ${shortTrailingLyricsExpected}\nactual: ${shortTrailingLyrics.output}`);
}
const inferredManualCodes = [
  ["[|][Am7]み)の気持[Bm7]ち知るま[|][C]で　[|]", "444", "444"],
  ["[|][Am7]み)の気持[Bm7]ち知るま[|][C]で", "444", "444x"],
  ["[|][Am7]み)の気持[Bm7]ち知るま[C]で　[|]", "444", "44x4"],
  ["[C][>---]歌詞[|]", "4", "x^4"],
  ["[|][C][========]歌詞[|]", "4", "*8"],
  ["[|][GM7][---=][GM7][=][----][|]", "44", "4*s4"]
];
inferredManualCodes.forEach(([line, fallback, expected]) => {
  const actual = CBFConverter.inferBeatCodeFromRenderedLine(line, fallback, settings);
  if (actual !== expected) {
    failures += 1;
    console.error(`FAIL infer manual row correction\nline: ${line}\nexpected: ${expected}\nactual: ${actual}`);
  }
});
if (CBFConverter.inferBeatCodeFromRenderedLine("[|][D][-->->-]何かを[|]", "", settings) !== null) {
  failures += 1;
  console.error("FAIL an accent inside a duration must stay manual");
}
if (CBFConverter.recoverBeatCodeFromRenderedLine("[|][D][----]x[|]", "", settings) !== "4") {
  failures += 1;
  console.error("FAIL exact round-trip recovery must keep a reversible row correction");
}
if (CBFConverter.recoverBeatCodeFromRenderedLine("[|][D][-->->-]x[|]", "", settings) !== null) {
  failures += 1;
  console.error("FAIL strict recovery must reject a row that cannot be rendered back identically");
}
const white = String.fromCharCode(0x25CB);
const mixedWhiteNotes = `[|][D][${white}]そん[|][E][${white}][----]な[----]歌が[|][C#m][${white}][----]歌いた[F#m][${white}][----]い[|]`;
if (CBFConverter.inferBeatCodeFromRenderedLine(mixedWhiteNotes, "", settings) !== "@@8@4@4") {
  failures += 1;
  console.error("FAIL white-note recovery must keep the white-note and following duration as separate slots");
}
const terminalWhiteNote = CBFConverter.convertChordText(
  `(3/4)|[D]-- -- --|[E]-- -- --|[Fdim]-- -- --|[F#m]-- -- --|[D]-- -- --|[E]-- -- --|[A][${white}]　　　　　|`,
  { ...settings, hyphenUnit: 2, measureCapacity: 6, hyphenSpacing: 4 },
  []
);
if (terminalWhiteNote.corrections !== "666666@") {
  failures += 1;
  console.error(`FAIL terminal white note without a duration must not add a row-correction slot\nactual: ${terminalWhiteNote.corrections}`);
}
const recoveredRowKeepsOutput = CBFConverter.convertChordText(
  "[D]歌",
  settings,
  ["4"],
  ["[|][D]歌[|]"],
  [],
  ["recovered"]
);
if (recoveredRowKeepsOutput.output !== "[|][D]歌[|]" || recoveredRowKeepsOutput.corrections !== "4" || recoveredRowKeepsOutput.correctionStates[0] !== "recovered") {
  failures += 1;
  console.error("FAIL recovered codes must be displayed without rewriting the direct result");
}
const unsupportedSourceStaysFixed = CBFConverter.convertChordText("[D][-->->-]x", settings, [], [], [], []);
if (unsupportedSourceStaysFixed.output !== "[|][D][-->->-]x[|]" || unsupportedSourceStaysFixed.corrections !== "?" || unsupportedSourceStaysFixed.correctionStates[0] !== "fixed") {
  failures += 1;
  console.error("FAIL unsupported source rhythm must become a fixed row without a correction code");
}
const unsupportedDirectStaysFixed = CBFConverter.convertChordText(
  "[D]x",
  settings,
  [""],
  ["[|][D][-->->-]x[|]"],
  [],
  ["fixed"]
);
if (unsupportedDirectStaysFixed.output !== "[|][D][-->->-]x[|]" || unsupportedDirectStaysFixed.corrections !== "" || unsupportedDirectStaysFixed.correctionStates[0] !== "fixed") {
  failures += 1;
  console.error("FAIL unsupported direct output must become a fixed row without a correction code");
}
const lineMergedOutput = CBFConverter.mergeChangedLines("手動1\n手動2\n手動3", "自動1\n自動2\n自動3", [1]);
if (lineMergedOutput !== "手動1\n自動2\n手動3") {
  failures += 1;
  console.error(`FAIL line-only correction merge\nactual: ${lineMergedOutput}`);
}
const correctionOverManualOutput = CBFConverter.convertChordText(
  "[G]元[D]歌",
  settings,
  ["44"],
  ["[|][G]手動[D]歌詞[|]"]
);
if (correctionOverManualOutput.output !== "[|][G][----]手動[D][----]歌詞[|]") {
  failures += 1;
  console.error(`FAIL row correction must preserve direct output edits\nactual: ${correctionOverManualOutput.output}`);
}
const correctionAfterManualChordInsertion = CBFConverter.convertChordText(
  "[G]元[D]歌",
  settings,
  ["444"],
  ["[|][G]手動[C]追加[D]歌詞[|]"]
);
if (correctionAfterManualChordInsertion.output !== "[|][G][----]手動[C][----]追加[|][D][----]歌詞[|]" || correctionAfterManualChordInsertion.warnings.some((warning) => warning.includes("行修正エラー"))) {
  failures += 1;
  console.error(`FAIL row correction must support a chord inserted in the direct output\nactual: ${correctionAfterManualChordInsertion.output}\nwarnings: ${correctionAfterManualChordInsertion.warnings.join(" / ")}`);
}
const insertedLineMapping = CBFConverter.alignLineIndices(["A", "B", "C"], ["A", "追加", "B", "C"]);
const deletedLineMapping = CBFConverter.alignLineIndices(["A", "削除", "B", "C"], ["A", "B", "C"]);
if (JSON.stringify(insertedLineMapping) !== JSON.stringify([0, -1, 1, 2]) || JSON.stringify(deletedLineMapping) !== JSON.stringify([0, 2, 3])) {
  failures += 1;
  console.error(`FAIL output line alignment\ninserted: ${JSON.stringify(insertedLineMapping)}\ndeleted: ${JSON.stringify(deletedLineMapping)}`);
}
const inferredInsertedLine = CBFConverter.inferBeatCodeFromRenderedLine("[|][Bm7][≧≧≧=]--[--]--[F#m7][≧≧≧=]--[--]--[|]", "", settings);
if (inferredInsertedLine !== "^^^*ax^^^*a") {
  failures += 1;
  console.error(`FAIL inserted output line correction inference\nactual: ${inferredInsertedLine}`);
}
const inferredParenthesizedFinal = CBFConverter.inferBeatCodeFromRenderedLine("[|][(Gadd9)][----]す", "4", settings);
if (inferredParenthesizedFinal !== "4") {
  failures += 1;
  console.error(`FAIL parenthesized final correction must not add x\nactual: ${inferredParenthesizedFinal}`);
}
const partialAccentSource = "[E]もっともっ[C#m7]と--[N.C.]>-|";
const partialAccentResult = CBFConverter.convertChordText(partialAccentSource, settings, []);
if (partialAccentResult.output !== "[|][E][----]もっともっ[C#m7][--]と[N.C.][>-][|]" || CBFConverter.renderCompletedOutput(partialAccentResult.output, [4, 8], 4).output !== partialAccentResult.output) {
  failures += 1;
  console.error(`FAIL partial accent rhythm must retain the generated duration\nactual: ${partialAccentResult.output}`);
}
if (failures) process.exitCode = 1;
else console.log(`PASS: ${cases.length} basic cases + realtime, corrections and completed-output removal`);
