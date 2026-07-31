"use strict";

const assert = require("assert");
global.window = global;
require("../js/converter.js");
require("../js/correction-input.js");

const settings = {
  hyphenUnit: 4,
  measureCapacity: 8,
  hyphenSpacing: 4,
  shortFractionPrepose: 1,
  showContinuationChord: 0
};

const beatCodes = [
  ...Array.from({ length: 10 }, (_, value) => [String(value), value]),
  ...Array.from({ length: 7 }, (_, offset) => [String.fromCharCode("a".charCodeAt(0) + offset), 10 + offset]),
  ["h", 24],
  ["i", 32]
];

beatCodes.forEach(([code, width]) => {
  const rendered = CBFConverter.renderWithBeatCode("[C]", code, settings);
  assert.strictEqual(rendered.ok, true, `${code} must be accepted`);
  assert.strictEqual((rendered.body.match(/-/g) || []).length, width, `${code} must render ${width} beats`);
  assert.strictEqual(CBFCorrectionInput.normalizeLine(code, 1), code, `${code} must survive row normalization`);
});

["j", "k", "m", "o", "r", "t", "w", "y", "z"].forEach((code) => {
  assert.strictEqual(CBFConverter.renderWithBeatCode("[C]", code, settings).ok, false, `${code} must be rejected`);
  assert.strictEqual(CBFCorrectionInput.normalizeLine(code, 1), "", `${code} must be removed from row input`);
});

const syntaxCases = [
  ["0", "[|][C][|]"],
  ["4", "[|][C][----][|]"],
  ["*4", "[|][C][====][|]"],
  ["^4", "[|][C][>---][|]"],
  ["^^4", "[|][C][>>--][|]"],
  ["*^4", "[|][C][≧===][|]"],
  ["^*4", "[|][C][≧===][|]"],
  ["^^*4", "[|][C][≧≧==][|]"],
  ["@", "[|][C][○][|]"],
  ["@4", "[|][C][○][----][|]"],
  ["@4*", "[|][C][○][----*][|]"],
  ["x4", "[C][----][|]"],
  ["4x", "[|][C][----]"],
  ["x^4", "[C][>---][|]"],
  ["^x4", "[C][>---][|]"],
  ["x*4", "[C][====][|]"],
  ["x^*4", "[C][≧===][|]"]
];

syntaxCases.forEach(([code, expected]) => {
  const rendered = CBFConverter.renderWithBeatCode("[C]", code, settings);
  assert.strictEqual(rendered.ok, true, `${code} must be accepted`);
  assert.strictEqual(rendered.body, expected, `${code} output`);
  assert.strictEqual(CBFCorrectionInput.normalizeLine(code, 1, 0), code, `${code} must survive row-input normalization`);
});

function insertFinalModifier(line, key) {
  const edit = CBFCorrectionInput.modifierInsertionAtLineEnd(line, key);
  assert(edit, `${key} must create a final-slot edit for ${line}`);
  return line.slice(0, edit.start) + edit.replacement + line.slice(edit.end);
}

[
  ["^", "444^4"],
  ["*", "444*4"],
  ["x", "4444x"]
].forEach(([key, expected]) => {
  const edited = insertFinalModifier("4444", key);
  assert.strictEqual(edited, expected, `${key} must be inserted before the final beat value`);
  assert.strictEqual(CBFCorrectionInput.normalizeLine(edited, 4), expected, `${key} edit must not trigger slot overflow normalization`);
});

assert.strictEqual(CBFCorrectionInput.normalizeLine("444^^4", 4), "444^^4", "multiple accents must survive normalization");
assert.strictEqual(CBFCorrectionInput.normalizeLine("444^*4", 4), "444^*4", "accented half note must survive normalization");
assert.strictEqual(CBFCorrectionInput.normalizeLine("444*^4", 4), "444*^4", "half note plus accent must survive normalization");
assert.strictEqual(CBFCorrectionInput.normalizeLine("444x", 3), "444x", "suffix x must survive normalization");
assert.strictEqual(CBFCorrectionInput.normalizeLine("44x4", 3), "44x4", "suffix x between beat values must survive normalization");
assert.strictEqual(CBFCorrectionInput.normalizeLine("444@4", 4, 0), "444@4", "inserted white-note duration may add one slot");
assert.strictEqual(CBFCorrectionInput.normalizeLine("@4*", 2, 1), "@4*", "authored white-note suffix must survive normalization");
assert.strictEqual(CBFCorrectionInput.modifierInsertionAtLineEnd("@4", "*"), null, "white-note star remains a suffix");
assert.strictEqual(CBFCorrectionInput.needsInsertedWhiteNoteDuration("4@44", 2, 4, 0), true, "a new white note may insert its duration before later slots");
assert.strictEqual(CBFCorrectionInput.needsInsertedWhiteNoteDuration("4@844", 2, 4, 0), false, "a white note with a duration must not add another slot");
assert.strictEqual(CBFCorrectionInput.needsInsertedWhiteNoteDuration("@844", 1, 4, 1), false, "an authored white note must overwrite its existing duration");
assert.deepStrictEqual(CBFCorrectionInput.groups("4s44s4"), ["4", "4", "4", "4"], "sync markers do not consume chord slots");
assert.strictEqual(CBFCorrectionInput.normalizeLine("4s44s4", 4), "4s44s4", "selected sync boundaries survive normalization");
assert.strictEqual(CBFCorrectionInput.normalizeLine("4s", 2), "4s", "a trailing sync marker survives while the next value is being entered");
assert.strictEqual(CBFCorrectionInput.normalizeLine("s", 4), "s", "standalone s remains the all-sync command");
assert.strictEqual(CBFCorrectionInput.normalizeLine("n", 4), "n", "standalone n remains the no-edit command");
assert.strictEqual(CBFCorrectionInput.normalizeLine("4ss4", 2), "4ss4", "temporarily incomplete sync input is not rewritten while typing");
assert.strictEqual(CBFCorrectionInput.normalizeLine("4s44s44", 4), "4s44s44", "values beyond the automatic chord count remain editable");
assert.strictEqual(CBFCorrectionInput.normalizeLine("88888", 4), "88888", "an extra numeric value must not be deleted while typing");
assert.strictEqual(CBFCorrectionInput.normalizeLine("^8@4*x", 1), "^8@4*x", "all supported modifiers must remain editable regardless of the automatic count");
assert.strictEqual(CBFCorrectionInput.normalizeLine("00|26", 4), "00|26", "the explicit measure-head marker must survive normalization");

const anchoredSource = "[|][C][----]前[D][----][|][E][----]後[F][----][|]";
const anchored = CBFConverter.renderWithBeatCode(anchoredSource, "00|26", settings);
assert.strictEqual(anchored.ok, true, "an anchored row correction must be accepted");
assert.strictEqual(anchored.body, "[C]前[D][|][E][--]後[F][--][----][|]", "all slot widths are applied and the chord following | becomes the measure head");
assert.strictEqual(CBFConverter.renderWithBeatCode(anchoredSource, "0000|", settings).ok, false, "an anchor without a following correction must be rejected");
assert.strictEqual(CBFConverter.renderWithBeatCode(anchoredSource, "0||026", settings).ok, false, "more than one anchor must be rejected");
const anchoredConversion = CBFConverter.convertChordText("[C][D][E][F]", settings, ["00|26"]);
assert.strictEqual(anchoredConversion.output, "[C][D][|][E][--][F][--][----][|]", "the normal conversion path must apply every slot width and emit one bar at the anchor");
assert.strictEqual(anchoredConversion.appliedCorrections, "00|26", "the applied row correction must retain its anchor");

assert.deepStrictEqual(CBFCorrectionInput.smartBeatEdit("4444", 4, 4, "8"), { start: 3, end: 4, replacement: "8", caret: 4 }, "typing at line end overwrites the final beat");
assert.deepStrictEqual(CBFCorrectionInput.smartBeatEdit("4^444", 1, 1, "8"), { start: 2, end: 3, replacement: "8", caret: 3 }, "typing before an accented beat changes its value without removing the accent");
assert.deepStrictEqual(CBFCorrectionInput.smartBeatEdit("4444", 1, 3, "8"), { start: 1, end: 3, replacement: "8", caret: 2 }, "a selection is replaced explicitly");
assert.deepStrictEqual(CBFCorrectionInput.slotSelection("4^4s8", 0), { index: 0, start: 0, end: 1 }, "the first beat slot is selected as one replaceable character");
assert.deepStrictEqual(CBFCorrectionInput.slotSelection("4^4s8", 1), { index: 1, start: 2, end: 3 }, "modifiers do not become selectable beat slots");
assert.deepStrictEqual(CBFCorrectionInput.slotSelection("4^4s8", 99), { index: 2, start: 4, end: 5 }, "slot selection clamps to the final beat");
assert.strictEqual(CBFCorrectionInput.slotSelection("^s|", 0), null, "a row without a beat has no slot selection");
assert.strictEqual(CBFCorrectionInput.normalizeBeatInputCharacter("4"), "4", "an ASCII digit remains a beat input");
assert.strictEqual(CBFCorrectionInput.normalizeBeatInputCharacter("４"), "4", "a full-width digit from Japanese input becomes an ASCII beat input");
assert.strictEqual(CBFCorrectionInput.normalizeBeatInputCharacter("Ａ"), "a", "a full-width supported letter becomes a lowercase beat input");
assert.strictEqual(CBFCorrectionInput.normalizeBeatInputCharacter("ｊ"), "", "an unsupported full-width letter is rejected");
assert.strictEqual(CBFCorrectionInput.normalizeBeatInputCharacter("44"), "", "multiple characters are not treated as one beat input");
assert.strictEqual(CBFCorrectionInput.normalizeBeatInputSequence("＠８"), "@8", "a multi-character Japanese IME commit normalizes as a beat sequence");
assert.strictEqual(CBFCorrectionInput.normalizeBeatInputSequence("４４"), "44", "multiple full-width digits normalize in order");
assert.strictEqual(CBFCorrectionInput.normalizeBeatInputSequence("＠ｊ"), "", "a sequence containing unsupported characters is rejected as a unit");
assert.strictEqual(CBFCorrectionInput.normalizeLine("＠８", 1), "@8", "full-width white-note input survives even when the browser omits input-event character data");
assert.deepStrictEqual(CBFCorrectionInput.singleInsertedBeat("4444", "44344"), { index: 2, character: "3" }, "one natively inserted beat is detected");
assert.deepStrictEqual(CBFCorrectionInput.singleInsertedBeat("44\n44", "44\n４44"), { index: 3, character: "4" }, "a full-width beat insertion is detected across rows");
assert.strictEqual(CBFCorrectionInput.singleInsertedBeat("4444", "4434"), null, "a normal one-for-one replacement is not treated as insertion");
assert.strictEqual(CBFCorrectionInput.singleInsertedBeat("4444", "^4444"), null, "a modifier insertion is not treated as an extra beat");
assert.deepStrictEqual(CBFCorrectionInput.whiteNoteEdit("4444", 4, 4), { start: 3, end: 4, replacement: "@", caret: 4 }, "white note overwrites the final selected beat instead of adding a slot");
assert.deepStrictEqual(CBFCorrectionInput.whiteNoteEdit("444^*4", 6, 6), { start: 3, end: 6, replacement: "@", caret: 4 }, "white note replaces existing modifiers and their beat without adding a slot");
assert.deepStrictEqual(CBFCorrectionInput.whiteNoteEdit("4s4", 0, 1), { start: 0, end: 2, replacement: "@", caret: 1 }, "white note replaces a beat together with its following sync marker");
assert.deepStrictEqual(CBFCorrectionInput.whiteNoteEdit("4s4", 2, 3), { start: 1, end: 3, replacement: "@", caret: 2 }, "white note replaces a beat together with its preceding sync marker");
assert.deepStrictEqual(CBFCorrectionInput.whiteNoteEdit("x^4x4", 2, 3), { start: 0, end: 4, replacement: "@", caret: 1 }, "white note removes prefix and suffix modifiers belonging to the selected beat");
assert.deepStrictEqual(CBFCorrectionInput.clearBeatEdit("@844", 1, 2), { start: 0, end: 2, replacement: "0", caret: 1 }, "@8 clears as one white-note edit unit");
assert.deepStrictEqual(CBFCorrectionInput.clearBeatEdit("8s44", 0, 1), { start: 0, end: 2, replacement: "0", caret: 1 }, "8s clears without leaving an orphan sync marker");
assert.deepStrictEqual(CBFCorrectionInput.clearBeatEdit("8s44", 2, 3), { start: 1, end: 3, replacement: "0", caret: 2 }, "deleting the beat after s also removes the sync marker");
assert.deepStrictEqual(CBFCorrectionInput.syncopationRemovalEdit("8s44", 0, 1), { start: 1, end: 2, replacement: "", caret: 1 }, "pressing s again removes the selected following sync marker");
assert.deepStrictEqual(CBFCorrectionInput.syncopationRemovalEdit("8s44", 2, 3), { start: 1, end: 2, replacement: "", caret: 1 }, "either side of a sync boundary can remove s");
assert.deepStrictEqual(CBFCorrectionInput.appendBeatSlot("4444"), { text: "44440", selectionStart: 4, selectionEnd: 5 }, "explicit append adds one selected placeholder");
assert.deepStrictEqual(CBFCorrectionInput.appendBeatSlot("n"), { text: "0", selectionStart: 0, selectionEnd: 1 }, "explicit append replaces a line command with one selected placeholder");
["s4", "4s", "*4s4", "4s^4", "@s4", "0s4"].forEach((code) => {
  assert.strictEqual(CBFConverter.renderWithBeatCode("[C][G]", code, settings).ok, false, `${code} must fail safely`);
});
assert.strictEqual(CBFCorrectionInput.migrateLegacyText("o\nw\nh\n4o4\n"), "h\ni\nn\n4h4\n", "legacy 24 and 32 values migrate while removed widths become no-edit rows");

console.log(`PASS: ${beatCodes.length} length values, ${syntaxCases.length} row-edit forms and sync commands`);
