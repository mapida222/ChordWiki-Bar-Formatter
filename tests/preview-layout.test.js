"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const preview = require("../js/chordwiki-preview.js");

const html = preview.render("|[F#]----|[G#m]----|[E#m-5][(Fm-5)]----|");

assert(html.startsWith('<div class="cw-score-line"><span class="cw-segment cw-segment-has-trailing-bar"><span class="cw-body"><span class="cw-body-bar-token"'));
assert(html.includes('<span class="cw-body">----<span class="cw-body-bar-token" data-token-type="bar">|</span></span>'));
assert(!html.includes("cw-leading-bar-token"));
assert(!html.includes("cw-body-bar-trailing"));
assert.strictEqual((html.match(/cw-body-bar-token/g) || []).length, 4);
assert.strictEqual((html.match(/cw-code-token/g) || []).length, 4);

const mixedRhythm = preview.render("|[GM7]---=[GM7]=|----|[Am7]---=[D7]=|----|[GM7]---=[GM7]=|----|[Am7]---=[D7]=|----|");
assert.strictEqual((mixedRhythm.match(/cw-code-token/g) || []).length, 8);
assert.strictEqual((mixedRhythm.match(/cw-body-bar-token/g) || []).length, 9);
assert(mixedRhythm.includes('<span class="cw-body">=<span class="cw-body-bar-token" data-token-type="bar">|</span>----<span class="cw-body-bar-token" data-token-type="bar">|</span></span>'));

const finalAccent = preview.render("|[F]----|[F]-[C]-[F]--|[N.C.]----|[F]>|");
assert(finalAccent.includes('<span class="cw-body">&gt;<span class="cw-body-bar-token" data-token-type="bar">|</span></span>'));

const css = fs.readFileSync(path.join(__dirname, "..", "style.css"), "utf8");
assert(css.includes("top: -1.5em"));
assert(css.includes("font-family: sans-serif"));
assert(css.includes("font-size: 100%"));
assert(!css.includes("font-size: smaller"));
assert(css.includes(".cw-body { position: relative; left: -.5em; display: inline;"));
assert(css.includes(".bars-through .cw-boundary { color: transparent; }"));
assert(css.includes(".cw-boundary-upper { top: -1.5em;"));
assert(css.includes(".cw-boundary-leading { margin-right: .28em; }"));
assert(css.includes(".cw-boundary-trailing { margin-right: .28em; margin-left: .28em; }"));
assert(css.includes(".bars-through .cw-boundary-upper { top: 0; }"));
assert(css.includes(".bold-chords .cw-code-token { font-weight: 700; -webkit-text-stroke: 0; }"));
assert(!css.includes(".bold-chords .cw-code-token { font-weight: 400; -webkit-text-stroke: .35px"));
assert(!css.includes("cw-segment-short-rhythm-before-plain"));

console.log("PASS: preview follows ChordWiki's inline chord/word layout without pattern-specific spacing hacks");
