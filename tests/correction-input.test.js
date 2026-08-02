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
  ["@", "[|][C][○][----][|]"],
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
assert.deepStrictEqual(CBFCorrectionInput.boundarySymbolEdit("88888", 0, "x"), { start: 0, end: 0, replacement: "x", caret: 1 }, "x inserts at the true line-start boundary");
assert.deepStrictEqual(CBFCorrectionInput.boundarySymbolEdit("88888", 5, "x"), { start: 5, end: 5, replacement: "x", caret: 6 }, "x inserts at the true line-end boundary without padding");
assert.deepStrictEqual(CBFCorrectionInput.boundarySymbolEdit("88888", 2, "^"), { start: 2, end: 2, replacement: "^", caret: 3 }, "accent inserts at the clicked text boundary");
assert.deepStrictEqual(CBFCorrectionInput.boundarySymbolEdit("88888", 2, "*"), { start: 2, end: 2, replacement: "*", caret: 3 }, "half-value marker inserts at the clicked text boundary");
assert.deepStrictEqual(CBFCorrectionInput.boundarySymbolEdit("88888", 2, "|"), { start: 2, end: 2, replacement: "|", caret: 3 }, "bar anchor inserts at the clicked text boundary");
assert.deepStrictEqual(CBFCorrectionInput.boundarySymbolEdit("88888", 2, "/"), { start: 2, end: 2, replacement: "|", caret: 3 }, "slash is an alias for the bar anchor");
assert.deepStrictEqual(CBFCorrectionInput.boundarySymbolEdit("88s888", 3, "s"), { start: 2, end: 3, replacement: "", caret: 2 }, "sync marker toggles off from either side of its boundary");
assert.strictEqual(CBFCorrectionInput.needsInsertedWhiteNoteDuration("4@44", 2, 4, 0), true, "a new white note may insert its duration before later slots");
assert.strictEqual(CBFCorrectionInput.needsInsertedWhiteNoteDuration("4@844", 2, 4, 0), false, "a white note with a duration must not add another slot");
assert.strictEqual(CBFCorrectionInput.needsInsertedWhiteNoteDuration("@844", 1, 4, 1), false, "an authored white note must overwrite its existing duration");
assert.deepStrictEqual(CBFCorrectionInput.groups("4s44s4"), ["4", "4", "4", "4"], "sync markers do not consume chord slots");
assert.strictEqual(CBFCorrectionInput.normalizeLine("4s44s4", 4), "4s44s4", "selected sync boundaries survive normalization");
assert.strictEqual(CBFCorrectionInput.normalizeLine("4s", 2), "4s", "a trailing sync marker survives while the next value is being entered");
assert.strictEqual(CBFCorrectionInput.normalizeLine("s", 4), "s", "a leading s survives while its first value is being entered");
assert.deepStrictEqual(CBFCorrectionInput.smartBeatEdit("s", 1, 1, "4"), { start: 1, end: 1, replacement: "4", caret: 2 }, "typing a value after a leading s keeps the sync marker");
assert.deepStrictEqual(CBFCorrectionInput.smartBeatEdit("*s", 2, 2, "4"), { start: 2, end: 2, replacement: "4", caret: 3 }, "typing a value after a leading *s keeps the half-sync marker");
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
assert.strictEqual(CBFCorrectionInput.nextLineWithBeatSlot(["628", "", "4"], 0), 2, "finishing a row skips blank correction rows and finds the next editable beat");
assert.strictEqual(CBFCorrectionInput.nextLineWithBeatSlot(["628", "", ""], 0), -1, "finishing the final editable row does not select an empty row");
assert.strictEqual(CBFCorrectionInput.normalizeBeatInputCharacter("4"), "4", "an ASCII digit remains a beat input");
assert.strictEqual(CBFCorrectionInput.normalizeBeatInputCharacter("４"), "4", "a full-width digit from Japanese input becomes an ASCII beat input");
assert.strictEqual(CBFCorrectionInput.normalizeBeatInputCharacter("Ａ"), "a", "a full-width supported letter becomes a lowercase beat input");
assert.strictEqual(CBFCorrectionInput.normalizeBeatInputCharacter("ｊ"), "", "an unsupported full-width letter is rejected");
assert.strictEqual(CBFCorrectionInput.normalizeBeatInputCharacter("44"), "", "multiple characters are not treated as one beat input");
assert.strictEqual(CBFCorrectionInput.normalizeBeatInputSequence("＠８"), "@8", "a multi-character Japanese IME commit normalizes as a beat sequence");
assert.strictEqual(CBFCorrectionInput.normalizeBeatInputSequence("４４"), "44", "multiple full-width digits normalize in order");
assert.strictEqual(CBFCorrectionInput.isRecentInputCommit("2", 1000, "2", 1250), true, "a delayed composition commit within 500ms is ignored after crossing to the next row");
assert.strictEqual(CBFCorrectionInput.isRecentInputCommit("2", 1000, "2", 1501), false, "a later independent beat is not mistaken for the previous input event");
assert.strictEqual(CBFCorrectionInput.isRecentInputCommit("2", 1000, "8", 1100), false, "a different beat is never suppressed");
assert.strictEqual(CBFCorrectionInput.incrementalCompositionBeatInput("", "4"), "4", "the first IME composition beat is applied");
assert.strictEqual(CBFCorrectionInput.incrementalCompositionBeatInput("4", "44"), "4", "a cumulative IME composition applies only its newly added beat");
assert.strictEqual(CBFCorrectionInput.incrementalCompositionBeatInput("44", "444"), "4", "a later cumulative IME update still advances one slot only");
assert.strictEqual(CBFCorrectionInput.normalizeBoundarySymbolSequence("ｘ＾＊ｓ｜"), "x^*s|", "full-width IME symbols normalize to supported row-edit symbols");
assert.strictEqual(CBFCorrectionInput.normalizeBoundarySymbolSequence("x^*s|"), "x^*s|", "ASCII boundary symbols remain supported");
assert.strictEqual(CBFCorrectionInput.normalizeBoundarySymbolSequence("/"), "|", "slash normalizes to the bar-anchor symbol");
assert.strictEqual(CBFCorrectionInput.normalizeBoundarySymbolSequence("あ"), "", "unrelated IME text is not treated as a row-edit symbol");
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
assert.deepStrictEqual(CBFCorrectionInput.clearBeatEdit("@844", 1, 2), { start: 1, end: 2, replacement: "", caret: 1 }, "deleting the white-note duration removes that character and leaves @");
assert.deepStrictEqual(CBFCorrectionInput.clearBeatEdit("8s44", 0, 1), { start: 0, end: 1, replacement: "", caret: 0 }, "deleting the left beat leaves a leading sync marker and shifts values left");
assert.deepStrictEqual(CBFCorrectionInput.clearBeatEdit("8s44", 2, 3), { start: 2, end: 3, replacement: "", caret: 2 }, "the low-level beat deletion removes only the selected value");
assert.strictEqual(CBFCorrectionInput.syncopationRemovalEdit("8s44", 0, 1), null, "the sync marker is retained when its left beat is selected");
assert.deepStrictEqual(CBFCorrectionInput.syncopationRemovalEdit("8s44", 2, 3), { start: 1, end: 2, replacement: "", caret: 1 }, "either side of a sync boundary can remove s");
assert.deepStrictEqual(CBFCorrectionInput.deletionEdit("4s4", 0, 1), { start: 0, end: 1, replacement: "", caret: 0 }, "deleting the left beat leaves s4 as a valid leading sync expression");
assert.deepStrictEqual(CBFCorrectionInput.deletionEdit("4s4", 2, 3), { start: 1, end: 2, replacement: "", caret: 1 }, "the first deletion removes only the preceding sync marker");
assert.deepStrictEqual(CBFCorrectionInput.deletionEdit("4*s4", 3, 4), { start: 1, end: 3, replacement: "", caret: 1 }, "deleting the right beat removes the complete *s boundary first");
assert.deepStrictEqual(CBFCorrectionInput.deletionEdit("4*s4", 0, 1), { start: 0, end: 1, replacement: "", caret: 0 }, "deleting the left beat leaves *s4 as a leading half-sync expression");
assert.deepStrictEqual(CBFCorrectionInput.deletionEdit("44", 0, 1), { start: 0, end: 1, replacement: "", caret: 0 }, "a plain selected beat is physically removed and later values shift left");
assert.deepStrictEqual(CBFCorrectionInput.appendBeatSlot("4444"), { text: "44440", selectionStart: 4, selectionEnd: 5 }, "explicit append adds one selected placeholder");
assert.deepStrictEqual(CBFCorrectionInput.appendBeatSlot("n"), { text: "0", selectionStart: 0, selectionEnd: 1 }, "explicit append replaces a line command with one selected placeholder");
["s4", "4s", "*4s4", "4s^4", "@s4", "0s4"].forEach((code) => {
  assert.strictEqual(CBFConverter.renderWithBeatCode("[C][G]", code, settings).ok, false, `${code} must fail safely`);
});
assert.strictEqual(CBFCorrectionInput.migrateLegacyText("o\nw\nh\n4o4\n"), "h\ni\nn\n4h4\n", "legacy 24 and 32 values migrate while removed widths become no-edit rows");

console.log(`PASS: ${beatCodes.length} length values, ${syntaxCases.length} row-edit forms and sync commands`);
