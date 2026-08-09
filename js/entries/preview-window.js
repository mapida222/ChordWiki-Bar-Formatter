import * as chordWikiParser from "@chordwiki/chordpro-parser";
import "../transposer.js";
import "../parser/formatter-notation.js";
import "../parser/chordwiki-adapter.js";
import "../renderer/old-chordwiki-renderer.js";
import "../chordwiki-preview.js";

globalThis.ChordWikiPreview.configureParser(chordWikiParser);
await import("../preview-window.js");
