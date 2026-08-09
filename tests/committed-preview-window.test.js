"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const windowScript = fs.readFileSync(path.join(root, "js", "committed-preview-window.js"), "utf8");
const html = fs.readFileSync(path.join(root, "committed-preview.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const preview = require(path.join(root, "js", "chordwiki-preview.js"));

assert(windowScript.includes('if (!text.value) { try { text.value = localStorage.getItem(TEXT_KEY) || ""; } catch (_error) {} }\n  // A saved draft'));
assert(windowScript.includes("// numbers, syntax layer, or score preview. Always perform an initial render.\n  render();"));
assert(html.includes("js/committed-preview-window.js?v=20260805-23"));
assert(html.includes('id="committed-layout-toggle"'));
assert(html.includes('committed-window-layout committed-window-stacked'));
assert(html.includes('href="index.html" aria-label="ChordWiki Bar Formatter トップページへ"'));
assert(html.includes("リアルタイムエディター｜ChordWiki Bar Formatter"));
assert(html.includes('<details class="score-window-settings">'));
assert(css.includes(".score-window-settings-panel { position: absolute;"));
assert(html.includes('id="committed-line-height"'));
assert(html.includes('id="committed-font-size-value"'));
assert(html.includes('id="committed-bold-code" type="checkbox" checked'));
assert(windowScript.includes("const contentLineTop = paddingTop + activeLine * lineHeight;"));
assert(windowScript.includes('text.style.setProperty("--active-line-top", `${contentLineTop - text.scrollTop}px`);'));
assert(windowScript.includes("if (previewRow) previewRow.dataset.sourceLine = String(sourceLineIndex);"));
assert(windowScript.includes('event.target.closest("[data-source-line]")'));
assert(css.includes("--committed-line-height: 2.75"));
assert(css.includes(".committed-window-editor-wrap .line-numbers span { height: calc(var(--editor-font-size) * var(--committed-line-height)); }"));
assert(css.includes(".committed-window-preview { height: 100%; margin: 0; border: 0; border-radius: 0; font-size: var(--editor-font-size) !important; }"));
assert(css.includes(".committed-window-layout.committed-window-stacked"));
assert(css.includes("--committed-line-height: 1.65"));
assert(windowScript.includes('layoutMode = layoutMode === "side" ? "stacked" : "side"'));
assert(windowScript.includes('let layoutMode = "stacked";'));
assert(windowScript.includes("stackedLineHeight = next; else sideLineHeight = next;"));
assert(windowScript.includes("checkboxDefaultsVersion: 1"));
assert(windowScript.includes("stackedPaneSize, sidePaneSize"));
assert(windowScript.includes("Math.max(6, Math.min(94"));
assert(windowScript.includes("requestAnimationFrame(() => setActiveLine(activeLine));"));
assert(css.includes(".committed-window-editor.active-line-visible"));
assert(css.includes('.committed-window-preview > [data-source-line].compare-active'));

const rendered = preview.render("[|][C][----]テスト[|]");
assert(rendered.includes('class="cw-score-line cw-score-line-has-lyrics"'));
assert(rendered.includes('class="cw-code-token"'));
assert(rendered.includes("テスト"));

console.log("PASS: saved realtime drafts always render line numbers, color text, and score preview");
