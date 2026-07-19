"use strict";

const assert = require("assert");
const fixture = require("./fixtures/v45-regressions.json");
global.window = global;
require("../js/converter.js");

for (const testCase of fixture.conversionCases) {
  const result = CBFConverter.convertChordText(testCase.input, fixture.settings, []);
  assert.strictEqual(result.output, testCase.output, testCase.name);
  assert.strictEqual(result.corrections, testCase.corrections, `${testCase.name} (corrections)`);
}

for (const testCase of fixture.correctionCases) {
  const settings = { ...fixture.settings, ...(testCase.settings || {}) };
  const result = CBFConverter.convertChordText(testCase.input, settings, [testCase.code]);
  assert.strictEqual(result.output, testCase.output, testCase.name);
  assert.strictEqual(result.corrections, testCase.code, `${testCase.name} (corrections)`);
}

for (const testCase of fixture.completedCases) {
  const result = CBFConverter.renderCompletedOutput(testCase.input, testCase.selectedCounts);
  assert.strictEqual(result.output, testCase.output, testCase.name);
  assert.strictEqual(result.removedHyphens, testCase.removedHyphens, `${testCase.name} (removed)`);
  assert.strictEqual(result.changedMeasures, testCase.changedMeasures, `${testCase.name} (measures)`);
}

console.log(
  `PASS: ${fixture.conversionCases.length} shared conversions, ` +
  `${fixture.correctionCases.length} corrections and ${fixture.completedCases.length} completed outputs`
);
