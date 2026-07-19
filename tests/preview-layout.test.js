"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const preview = require("../js/chordwiki-preview.js");

const html = preview.render("|[F#]----|[G#m]----|[E#m-5][(Fm-5)]----|");

assert(html.startsWith('<div class="cw-score-line"><span class="cw-boundary cw-boundary-leading cw-boundary-body cw-boundary-line-start"'));
assert(html.includes('</span><span class="cw-boundary cw-boundary-trailing cw-boundary-body" data-token-type="bar"><span>|</span></span><span class="cw-segment'));
assert(!html.includes("cw-leading-bar-token"));
assert(!html.includes("cw-body-bar-trailing"));
assert.strictEqual((html.match(/cw-boundary-trailing/g) || []).length, 3);
assert.strictEqual((html.match(/cw-code-token/g) || []).length, 4);

const mixedRhythm = preview.render("|[GM7]---=[GM7]=|----|[Am7]---=[D7]=|----|[GM7]---=[GM7]=|----|[Am7]---=[D7]=|----|");
assert.strictEqual((mixedRhythm.match(/cw-segment-rhythm-spacing/g) || []).length, 8);
assert.strictEqual((mixedRhythm.match(/cw-code-token/g) || []).length, 8);
assert.strictEqual((mixedRhythm.match(/cw-boundary-trailing/g) || []).length, 8);
assert.strictEqual((mixedRhythm.match(/cw-segment-short-rhythm/g) || []).length, 4);
assert.strictEqual((mixedRhythm.match(/cw-segment-plain-rhythm/g) || []).length, 4);
assert.strictEqual((mixedRhythm.match(/cw-boundary-after-short-rhythm/g) || []).length, 4);
assert.strictEqual((mixedRhythm.match(/cw-boundary-after-plain-rhythm/g) || []).length, 4);

const css = fs.readFileSync(path.join(__dirname, "..", "style.css"), "utf8");
assert(css.includes("--cw-chord-row: 1.2em"));
assert(css.includes("--cw-lyrics-row: 1.35em"));
assert(css.includes("--cw-row-gap: .05em"));
assert(css.includes("flex: 0 0 .25em"));
assert(css.includes("transform: translateX(-.8em)"));
assert(css.includes(".cw-boundary-after-short-rhythm { transform: translateX(-1em); }"));
assert(css.includes(".cw-segment-plain-rhythm .cw-body { transform: translateX(-1.15em); }"));
assert(css.includes(".cw-boundary-after-plain-rhythm { transform: translateX(-.55em); }"));
assert(css.includes(".bars-through .cw-boundary { color: transparent; }"));
assert(!css.includes(".bars-through .cw-boundary { flex-basis:"));

console.log("PASS: preview measure boundaries stay separate from chords and compact row metrics are fixed");
