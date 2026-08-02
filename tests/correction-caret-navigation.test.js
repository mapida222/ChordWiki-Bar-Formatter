"use strict";

const assert = require("assert");
global.window = global;
require("../js/correction-input.js");

assert.strictEqual(CBFCorrectionInput.nextLineStart("4444\n8888", 4), 5);
assert.strictEqual(CBFCorrectionInput.nextLineStart("4444\r\n8888", 4), 6);
assert.strictEqual(CBFCorrectionInput.nextLineStart("4444", 4), 4);
assert.strictEqual(CBFCorrectionInput.caretAfterLineEdit("44\n88", 2, 2), 3);
assert.strictEqual(CBFCorrectionInput.caretAfterLineEdit("44\n88", 2, 1), 1);
assert.strictEqual(CBFCorrectionInput.caretAfterLineEdit("44\n88", 2, 2, true), 2);
assert.strictEqual(CBFCorrectionInput.scrollTopForLineMargin(0, 69, 23, 2, 10), 23);
assert.strictEqual(CBFCorrectionInput.scrollTopForLineMargin(69, 69, 23, 2, 10), 23);
assert.strictEqual(CBFCorrectionInput.scrollTopForLineMargin(23, 69, 23, 2, 10), 23);
assert.strictEqual(CBFCorrectionInput.scrollTopForLineMargin(0, 69, 23, 2, 10, 1, 0, 2), 46);
assert.strictEqual(CBFCorrectionInput.scrollTopForLineMargin(69, 69, 23, 2, 10, 1, 0, 2), 23);

console.log("PASS: completing a correction row advances to the next row");
