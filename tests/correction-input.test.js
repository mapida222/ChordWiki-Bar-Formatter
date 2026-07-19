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

assert.deepStrictEqual(CBFCorrectionInput.smartBeatEdit("4444", 4, 4, "8"), { start: 3, end: 4, replacement: "8", caret: 4 }, "typing at line end overwrites the final beat");
assert.deepStrictEqual(CBFCorrectionInput.smartBeatEdit("4^444", 1, 1, "8"), { start: 2, end: 3, replacement: "8", caret: 3 }, "typing before an accented beat changes its value without removing the accent");
assert.deepStrictEqual(CBFCorrectionInput.smartBeatEdit("4444", 1, 3, "8"), { start: 1, end: 3, replacement: "8", caret: 2 }, "a selection is replaced explicitly");
assert.deepStrictEqual(CBFCorrectionInput.whiteNoteEdit("4444", 4, 4), { start: 3, end: 4, replacement: "@", caret: 4 }, "white note overwrites the final selected beat instead of adding a slot");
assert.deepStrictEqual(CBFCorrectionInput.whiteNoteEdit("444^*4", 6, 6), { start: 3, end: 6, replacement: "@", caret: 4 }, "white note replaces existing modifiers and their beat without adding a slot");
assert.deepStrictEqual(CBFCorrectionInput.appendBeatSlot("4444"), { text: "44440", selectionStart: 4, selectionEnd: 5 }, "explicit append adds one selected placeholder");
assert.deepStrictEqual(CBFCorrectionInput.appendBeatSlot("n"), { text: "0", selectionStart: 0, selectionEnd: 1 }, "explicit append replaces a line command with one selected placeholder");
["s4", "4s", "*4s4", "4s^4", "@s4", "0s4"].forEach((code) => {
  assert.strictEqual(CBFConverter.renderWithBeatCode("[C][G]", code, settings).ok, false, `${code} must fail safely`);
});
assert.strictEqual(CBFCorrectionInput.migrateLegacyText("o\nw\nh\n4o4\n"), "h\ni\nn\n4h4\n", "legacy 24 and 32 values migrate while removed widths become no-edit rows");

console.log(`PASS: ${beatCodes.length} length values, ${syntaxCases.length} row-edit forms and sync commands`);
