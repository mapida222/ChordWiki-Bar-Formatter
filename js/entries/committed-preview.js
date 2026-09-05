import * as chordWikiParser from "@chordwiki/chordpro-parser";
import "../settings.js";
import "../parser/formatter-notation.js";
import "../parser/chordwiki-adapter.js";
import "../renderer/old-chordwiki-renderer.js";
import "../chordwiki-preview.js";
import "../transposer.js";
import "../measure-check.js?v=20260906-003";
import "../committed-measure-check-panel.js?v=20260906-003";

globalThis.ChordWikiPreview.configureParser(chordWikiParser);
await import("../committed-preview-window.js");
