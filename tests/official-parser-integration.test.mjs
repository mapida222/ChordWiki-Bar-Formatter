import assert from "node:assert/strict";
import { createRequire } from "node:module";
import * as chordWikiParser from "@chordwiki/chordpro-parser";

const require = createRequire(import.meta.url);
const preview = require("../js/chordwiki-preview.js");
preview.configureParser(chordWikiParser);

const model = preview.parse([
  "#非表示",
  "{title:公式Parser接続}",
  "{key:Db}",
  "[|][C][----]歌詞[G/B][>][○]続き[|]",
  "[N.C.]休み",
  "{安全>javascript:alert(1)}"
].join("\n"));

assert.equal(model.parser, "@chordwiki/chordpro-parser");
assert.equal(model.lines[0].kind, "hidden");
assert.equal(model.lines[1].kind, "title");
assert.equal(model.lines[3].kind, "score");
assert(model.lines[3].tokens.some((token) => token.kind === "rhythm" && token.value === "----"));
assert(model.lines[3].tokens.some((token) => token.kind === "chord" && token.value === "G/B"));
assert(model.lines[4].tokens.some((token) => token.kind === "chord" && token.value === "N.C."));

const html = preview.render("[C]<img src=x onerror=alert(1)>\n{安全>javascript:alert(1)}");
assert(!html.includes("<img"));
assert(html.includes("&lt;img"));
assert(!html.includes('href="javascript:'));

console.log("PASS: PREVIEW-004 official parser adapter and safe old renderer");
