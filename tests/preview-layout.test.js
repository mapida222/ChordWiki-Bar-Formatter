"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const preview = require("../js/chordwiki-preview.js");

const html = preview.render("|[F#]----|[G#m]----|[E#m-5][(Fm-5)]----|");

assert(html.startsWith('<div class="cw-score-line"><span class="cw-segment cw-segment-has-trailing-bar"><span class="cw-body"><span class="cw-body-bar-token cw-bar-token-line-start"'));
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

const barBetweenRhythm = preview.render("|[A]---- ---[Asus4]-|-[A]--[Asus4]- -[A]---|[A]---- ---[Asus4]-|-[A]--[Asus4]- -[A]---|");
assert.strictEqual((barBetweenRhythm.match(/cw-bar-between-hyphens/g) || []).length, 2);
assert(barBetweenRhythm.includes('<span class="cw-body">-<span class="cw-body-bar-token cw-bar-between-hyphens" data-token-type="bar">|</span>-</span>'));

const css = fs.readFileSync(path.join(__dirname, "..", "style.css"), "utf8");
const page = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
assert(css.includes(".cw-score-line { display: block; width: max-content; min-width: 100%; margin: 1em 0;"));
assert(css.includes("top: -1.1em"));
assert(css.includes("font-family: sans-serif"));
assert(css.includes("font-size: 100%"));
assert(css.includes(".cw-segment-has-trailing-upper-bar .cw-chord > .cw-rhythm-token:last-child { margin-right: .3em; }"));
assert(css.includes(".cw-bar-token { position: relative; left: .4em; display: inline-block; }"));
assert(css.includes(".cw-boundary { position: relative; left: .4em; display: inline;"));
assert(css.includes(".cw-body-bar-token { position: relative; left: .4em; display: inline;"));
assert(css.includes(".cw-boundary-line-start, .cw-bar-token-line-start { left: .4em; }"));
assert(css.includes(".cw-score-line-has-lyrics .cw-boundary-line-start,"));
assert(css.includes(".cw-score-line-has-lyrics .cw-bar-token-line-start { left: .4em; }"));
assert(!css.includes("font-size: smaller"));
assert(css.includes(".cw-body { position: relative; left: -.8em; display: inline;"));
assert(css.includes(".cw-score-line-has-lyrics .cw-body-bar-token { top: 0; }"));
assert(css.includes(".cw-score-line-has-lyrics .cw-body-bar-token-before-text { margin-right: .4em; }"));
assert(css.includes(".bars-through .cw-boundary { color: transparent; }"));
assert(css.includes(".cw-bar-between-hyphens { margin-right: .4em; }"));
assert(page.includes("js/chordwiki-preview.js?v=20260731-4"));
assert(css.includes(".cw-boundary-upper { top: -1.1em;"));
assert(css.includes(".cw-boundary-leading { margin-right: .28em; }"));
assert(css.includes(".cw-boundary-leading.cw-boundary-before-chord { margin-right: .08em; }"));
assert(css.includes(".cw-boundary-trailing { left: .6em; margin-right: .28em; margin-left: .18em; }"));
assert(css.includes(".cw-score-line-has-lyrics .cw-boundary-leading.cw-boundary-line-start { margin-right: .78em; }"));
assert(css.includes(".cw-score-line-has-lyrics .cw-boundary-leading.cw-boundary-line-start.cw-boundary-before-chord { margin-right: .58em; }"));
assert(css.includes(".cw-score-line-has-lyrics .cw-boundary-trailing { left: -.2em; }"));
assert(css.includes(".bars-through .cw-boundary-upper { top: 0; }"));
assert(css.includes(".bold-chords .cw-code-token { font-weight: 700; -webkit-text-stroke: 0; }"));
assert(!css.includes(".bold-chords .cw-code-token { font-weight: 400; -webkit-text-stroke: .35px"));
assert(!css.includes("cw-segment-short-rhythm-before-plain"));

console.log("PASS: preview follows ChordWiki's inline chord/word layout without pattern-specific spacing hacks");
