const assert = require("assert");
const fs = require("fs");
const vm = require("vm");

global.window = {};
vm.runInThisContext(fs.readFileSync("js/converter.js", "utf8"));

const source = "歌詞\n[Fm7]い";
const output = "小節線追加\n歌詞\n[|][Fm7][--][--]い[--][|]";
const added = new Set(window.CBFConverter.addedCharacterIndices(source, output));
assert.strictEqual(added.has(output.indexOf("歌詞")), false, "a moved source line must not be highlighted as generated");
assert.ok([...added].some((index) => output[index] === "小"), "the inserted line must remain highlighted");
assert.ok([...added].some((index) => output[index] === "-"), "generated rhythm characters must remain highlighted");

const settings = { hyphenUnit: 2, measureCapacity: 4, hyphenSpacing: 2 };
assert.deepStrictEqual(
  window.CBFConverter.analyzeAuthoredFormatting("[C]---- ----|[D]---- ----|", settings).hyphenSpacing.detected,
  4,
  "spacing analysis must detect the dominant authored group width"
);
assert.strictEqual(
  window.CBFConverter.analyzeAuthoredFormatting("[C]---- ----|[D]---- ----|", { ...settings, hyphenSpacing: 4 }).hyphenSpacing.detected,
  4,
  "format analysis must retain values that match the current setting for warning details"
);
assert.strictEqual(
  window.CBFConverter.analyzeAuthoredFormatting("[Bm7]>--- ----|[Bm7]---- ----|[Bm]---- ----|[Bm]>>[(break)]-- ----|", settings).hyphenUnit.detected,
  4,
  "rhythm markers such as >--- and >> must not be counted as code-following hyphens"
);
assert.strictEqual(
  window.CBFConverter.analyzeAuthoredFormatting("[Bm]---- ----|-[D5]>-- [C#5]>-[C5]>-|[/A]-[/F#]-[/F]- [/E]-[/D]---|[Bm]---- ----|", settings).hyphenUnit.detected,
  4,
  "slash-chord transitions must not be counted as one-hyphen code-following values"
);
assert.strictEqual(
  window.CBFConverter.convertChordText("[Fm7]い", settings, []).output,
  "[|][Fm7][--]い[--][|]",
  "a one-chord one-character lyric must keep the lyric immediately after the first beat"
);

const app = fs.readFileSync("js/app.js", "utf8");
const css = fs.readFileSync("style.css", "utf8");
assert(app.includes('const PREVIEW_TRANSPOSE_STORAGE_KEY = "chordWikiBarFormatter.previewTranspose.v2"'));
assert(css.includes(".settings-panel.settings-closed { height: auto; min-height: 0; overflow: visible; }"));
assert(css.includes(".final-card .chordwiki-preview { padding-left: calc(14px + .5em); }"));
console.log("PASS: requested regressions for transpose defaults, closed settings layout, and moved-line diff highlighting");
