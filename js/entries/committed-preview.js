import * as chordWikiParser from "@chordwiki/chordpro-parser";
import "../parser/formatter-notation.js";
import "../parser/chordwiki-adapter.js";
import "../renderer/old-chordwiki-renderer.js";
import "../chordwiki-preview.js";
import "../transposer.js";

globalThis.ChordWikiPreview.configureParser(chordWikiParser);
await import("../committed-preview-window.js");
