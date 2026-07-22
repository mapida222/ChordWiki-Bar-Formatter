"use strict";

const assert = require("assert");
global.window = global;
require("../js/converter.js");

const hide = (source) => CBFConverter.renderCompletedOutput(source, [0], 4, true);
const hideAll = (source) => CBFConverter.renderCompletedOutput(source, [0], 4, "all");

const twoChord = hide("[|][C][---]あ[D][-]い[----]ろは[|]");
assert.strictEqual(twoChord.output, "[|][C]あ[D]いろは[|]");
assert.strictEqual(twoChord.hiddenLyricHyphens, 8);

const threeChord = "[|][C][--]あ[D][--]い[E][----]ろは[|]";
assert.strictEqual(hide(threeChord).output, threeChord);
assert.strictEqual(hideAll(threeChord).output, "[|][C]あ[D]い[E]ろは　[|]");
assert.strictEqual(hideAll(threeChord).hiddenLyricHyphens, 8);

const expressive = "[|][C][>---]強く[D][====]続くよ[|]";
assert.strictEqual(hide(expressive).output, expressive);
assert.strictEqual(hideAll(expressive).output, expressive);

const codeOnly = CBFConverter.renderCompletedOutput("[|][C][----][|]", [0], 4, true);
assert.strictEqual(codeOnly.output, "|[C]----|");

const disabled = CBFConverter.renderCompletedOutput("[|][C][----]歌詞続く[|]", [0], 4, false);
assert.strictEqual(disabled.output, "[|][C][----]歌詞続く[|]");

console.log("PASS: lyric-only hyphen visibility preserves timing-sensitive measures and symbols");
