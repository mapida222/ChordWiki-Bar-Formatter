"use strict";

const assert = require("assert");
global.window = global;
require("../js/correction-input.js");
require("../js/converter.js");

assert.deepStrictEqual(
  CBFCorrectionInput.redistributeForLineBreaks(["26"], [2], [1, 1]),
  { lines: ["2", "6"], preserved: [true, true] },
  "splitting a source row must split its correction by chord order"
);

assert.deepStrictEqual(
  CBFCorrectionInput.redistributeForLineBreaks(["2", "6"], [1, 1], [2]),
  { lines: ["26"], preserved: [true] },
  "joining source rows must join their corrections by chord order"
);

assert.deepStrictEqual(
  CBFCorrectionInput.redistributeForLineBreaks(["4s4|26"], [4], [2, 2]),
  { lines: ["4s4", "26"], preserved: [true, true] },
  "markers inside each new row must survive while markers at the new row boundary are dropped"
);

assert.deepStrictEqual(
  CBFCorrectionInput.redistributeForLineBreaks(["*s44*s44"], [4], [2, 2]),
  { lines: ["*s44", "*s44"], preserved: [true, true] },
  "a sync pickup moved to a new row must keep its leading *s marker"
);

assert.deepStrictEqual(
  CBFCorrectionInput.redistributeForLineBreaks(["n"], [2], [1, 1]),
  { lines: ["n", "n"], preserved: [true, true] },
  "the no-edit command must remain usable after a row split"
);

assert.deepStrictEqual(
  CBFCorrectionInput.redistributeForLineBreaks(["4", "26"], [1, 2], [1, 1, 1]),
  { lines: ["4", "2", "6"], preserved: [true, true, true] },
  "splitting only a later row must redistribute every row in slot order instead of keeping a stale whole-row correction"
);

assert.deepStrictEqual(
  CBFCorrectionInput.redistributeForLineBreaks(["@8@8", "44"], [4, 2], [2, 2, 2]),
  { lines: ["@8", "@8", "44"], preserved: [true, true, true] },
  "white-note marker and duration slots must stay aligned when a row is split"
);

const originalSource = "[C]あいう[G]えお[Am]あいう[F]えおあ[C]いうえお[Am]かきこふ[G]いこじじ[F]じょ　";
const splitSource = "[C]あいう[G]えお[Am]あいう[F]えおあ\n[C]いうえお[Am]かきこふ[G]いこじじ[F]じょ　";
const synchronized = CBFCorrectionInput.synchronizeLineBreakLayout(
  originalSource,
  splitSource,
  ["44448888"],
  [8],
  [4, 4]
);
assert.deepStrictEqual(
  synchronized,
  { corrections: { lines: ["4444", "8888"], preserved: [true, true] }, lineCount: 2 },
  "the source line break must split 44448888 into the same four-chord boundary"
);

const settings = {
  hyphenUnit: 4,
  measureCapacity: 8,
  hyphenSpacing: 4,
  shortFractionPrepose: 1,
  showContinuationChord: 0
};
const converted = CBFConverter.convertChordText(splitSource, settings, synchronized.corrections.lines);
assert.strictEqual(converted.corrections, "4444\n8888", "the two synchronized correction rows must remain separate");
assert.strictEqual(converted.output.split("\n").length, 2, "the converted output must break at the same boundary");
assert.match(converted.output.split("\n")[0], /\[F\].*\[\|\]$/, "the first output row must end after its fourth chord");
assert.match(converted.output.split("\n")[1], /^\[\|\]\[C\]/, "the second output row must begin from its corresponding chord");

assert.strictEqual(
  CBFCorrectionInput.synchronizeLineBreakLayout(originalSource, `${splitSource}!`, ["44448888"], [8], [4, 4]),
  null,
  "content edits must not be mistaken for a line-break-only synchronization"
);

assert.deepStrictEqual(
  CBFCorrectionInput.synchronizeLineBreakLayout(originalSource, splitSource, ["invalid"], [7], [4, 4]),
  { corrections: null, lineCount: 2 },
  "line-break-only detection must remain true even when a malformed correction cannot be redistributed"
);

const app = require("fs").readFileSync(require("path").join(__dirname, "../js/app.js"), "utf8");
assert.ok(app.includes("Never leave orphan correction rows"), "output row edits need a final correction-row alignment guard");
assert.ok(app.includes("alignedCorrectionLines.length !== currentLines.length"));
assert.ok(app.includes("CBFConverter.alignLineIndices(previousLines, currentLines)"));

console.log("PASS: source-only line breaks redistribute row corrections without losing edits");
