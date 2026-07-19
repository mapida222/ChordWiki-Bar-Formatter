"use strict";

const assert = require("assert");
global.window = global;
require("../js/correction-input.js");

assert.deepStrictEqual(CBFCorrectionInput.whiteNoteEdit("4444", 4, 4), { start: 3, end: 4, replacement: "@", caret: 4 });
assert.deepStrictEqual(CBFCorrectionInput.whiteNoteEdit("444^*4", 6, 6), { start: 3, end: 6, replacement: "@", caret: 4 });
assert.deepStrictEqual(CBFCorrectionInput.whiteNoteEdit("@444", 1, 1), { start: 1, end: 2, replacement: "@", caret: 2 });
assert.deepStrictEqual(CBFCorrectionInput.whiteNoteEdit("@@44", 2, 2), { start: 2, end: 3, replacement: "@", caret: 3 });
assert.deepStrictEqual(CBFCorrectionInput.whiteNoteEdit("@@@4", 3, 3), { start: 3, end: 4, replacement: "@", caret: 4 });
assert.strictEqual(CBFCorrectionInput.needsInsertedWhiteNoteDuration("444@", 4, 4, 0), true);
assert.strictEqual(CBFCorrectionInput.needsInsertedWhiteNoteDuration("444@4", 4, 4, 0), false);

console.log("PASS: consecutive white notes overwrite existing row slots");
