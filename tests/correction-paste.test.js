"use strict";

const assert = require("assert");
global.window = global;
require("../js/correction-input.js");

assert.deepStrictEqual(
  CBFCorrectionInput.overwritePastedRows("111\n222\n333", 0, "888", 3),
  { value: "888\n222\n333", caret: 4, truncatedRows: 0 }
);
assert.deepStrictEqual(
  CBFCorrectionInput.overwritePastedRows("111\n222\n333", 4, "888\n444\n", 3),
  { value: "111\n888\n444", caret: 11, truncatedRows: 0 }
);
assert.deepStrictEqual(
  CBFCorrectionInput.overwritePastedRows("111\n222", 0, "8^8\n4@4\n999", 2),
  { value: "8^8\n4@4", caret: 7, truncatedRows: 1 }
);
assert.deepStrictEqual(
  CBFCorrectionInput.overwritePastedRows("8888\n8881\n\n8888\n8881", 0, "3535\n4435\n3535\n4435", 5),
  { value: "3535\n4435\n\n3535\n4435", caret: 20, truncatedRows: 0 }
);
assert.deepStrictEqual(CBFCorrectionInput.overwritePastedLine("88844", 3, 3, "8"), { text: "88884", caret: 4 });
assert.deepStrictEqual(CBFCorrectionInput.overwritePastedLine("88844", 5, 5, "8"), { text: "88848", caret: 5 });
assert.deepStrictEqual(CBFCorrectionInput.overwritePastedLine("88844", 0, 0, "44"), { text: "44844", caret: 2 });
assert.deepStrictEqual(CBFCorrectionInput.overwritePastedLine("88844", 0, 5, "44"), { text: "44", caret: 2 });
assert.deepStrictEqual(CBFCorrectionInput.overwritePastedLine("88844", 5, 5, "88844"), { text: "88844", caret: 5 });

console.log("PASS: row correction paste overwrites values and rows");
