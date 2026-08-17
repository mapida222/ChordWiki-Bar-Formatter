"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

global.window = global;
require("../js/converter.js");

const app = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");
const inputMatch = app.match(/const INITIAL_INPUT = \[(.*?)\]\.join\("\\n"\);/s);
const correctionMatch = app.match(/const INITIAL_CORRECTION = (\[.*?\])\.join\("\\n"\);/s);
const settingsMatch = app.match(/const INITIAL_SETTINGS = (\{.*?\});/s);

assert(inputMatch && correctionMatch && settingsMatch, "the built-in conversion sample must remain readable by this regression test");

const inputLines = JSON.parse(`[${inputMatch[1]}]`);
const correctionLines = JSON.parse(correctionMatch[1]);
const settings = Function(`return (${settingsMatch[1]});`)();
const result = CBFConverter.convertChordText(inputLines.join("\n"), settings, correctionLines);
const outputLines = result.output.split("\n");

assert.strictEqual(result.correctionErrors.length, 0, "every built-in row correction must convert without an error");
assert.strictEqual(outputLines.length, inputLines.length, "conversion must retain every sample row, including the blank row");
assert.deepStrictEqual(outputLines.slice(0, 5), inputLines.slice(0, 5), "ChordPro directives must be preserved");
assert.strictEqual(result.corrections.split("\n").length, correctionLines.length, "all sample row corrections must stay aligned");
assert(outputLines.some((line) => line.includes("[---=]")), "the sample must keep half-hyphen syncopation output");
assert(outputLines.some((line) => line.includes("[>")), "the sample must keep accent output");
assert(outputLines.some((line) => line.includes("[|]")), "the sample must add measure bars");

console.log("PASS: built-in conversion sample converts every row with directives, syncopation, accents, and bars");
