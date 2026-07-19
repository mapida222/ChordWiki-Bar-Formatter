"use strict";

const assert = require("assert");
const fixture = require("./fixtures/temptation-regressions.json");
global.window = global;
require("../js/converter.js");

for (const testCase of fixture.cases) {
  const result = CBFConverter.convertChordText(testCase.input, fixture.settings, []);
  assert.strictEqual(result.output, testCase.output, testCase.name);
  assert.strictEqual(result.corrections, testCase.corrections, `${testCase.name} (corrections)`);
  const completed = CBFConverter.renderCompletedOutput(result.output, [4], fixture.settings.hyphenSpacing);
  assert.strictEqual(completed.output, testCase.completed, `${testCase.name} (completed)`);
}

assert(fixture.manualOnly.length > 0, "manual-only boundaries must remain documented");
console.log(`PASS: ${fixture.cases.length} Temptation regressions; ${fixture.manualOnly.length} manual-only boundaries documented`);
