"use strict";

const assert = require("assert");
const overridesApi = require("../js/output-overrides.js");
global.window = global;
require("../js/converter.js");

let sequence = 0;
const createId = () => `line-${++sequence}`;
const ids = overridesApi.normalizeIds(3, [], createId);
assert.deepStrictEqual(ids, ["line-1", "line-2", "line-3"]);

const remapped = overridesApi.remapIds([0, -1, 1, 2], ids, createId);
assert.deepStrictEqual(remapped, ["line-1", "line-4", "line-2", "line-3"], "inserted lines get a new ID while existing lines retain theirs");

const base = "[C]first\n[G]second\n[Am]third";
const edited = "[C]first\n[G]manual\ncontinued\n[Am]third";
const captured = overridesApi.capture(base, edited, ids, CBFConverter.alignLineIndices);
assert.strictEqual(captured["line-2"].text, "[G]manual\ncontinued", "a manual line break belongs to the stable source line");
assert.strictEqual(overridesApi.apply(base, ids, captured), edited);

const regenerated = "[C]first changed\n[G]second regenerated\n[Am]third";
assert.strictEqual(
  overridesApi.apply(regenerated, ids, captured),
  "[C]first changed\n[G]manual\ncontinued\n[Am]third",
  "automatic regeneration changes untouched IDs but keeps the manual override layer"
);

const deleted = overridesApi.capture(base, "[C]first\n[Am]third", ids, CBFConverter.alignLineIndices);
assert.strictEqual(deleted["line-2"].suppressed, true);
assert.strictEqual(overridesApi.apply(base, ids, deleted), "[C]first\n[Am]third");

console.log("PASS: stable output IDs preserve manual text and line-break overrides across regeneration");
