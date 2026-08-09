"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const windowScript = fs.readFileSync(path.join(root, "js", "committed-preview-window.js"), "utf8");
const html = fs.readFileSync(path.join(root, "committed-preview.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const preview = require(path.join(root, "js", "chordwiki-preview.js"));
const entry = fs.readFileSync(path.join(root, "js", "entries", "committed-preview.js"), "utf8");

assert(windowScript.includes('if (!text.value) { try { text.value = localStorage.getItem(TEXT_KEY) || ""; } catch (_error) {} }\n  // A saved draft'));
assert(windowScript.includes('const keepExistingDraft = new URLSearchParams(window.location.search).get("draft") === "keep";'));
assert(windowScript.includes('if (!keepExistingDraft) { try { applyState(JSON.parse(localStorage.getItem(STATE_KEY) || "null")); } catch (_error) {} }'));
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
assert(app.includes("リアルタイム編集ページには前回の編集内容があります。"));
assert(app.includes('elements.openRealtimeEditor.href = "committed-preview.html?draft=keep";'));
assert(app.includes("event.preventDefault();"), "cancel must prevent opening the realtime editor");
assert(windowScript.includes("// numbers, syntax layer, or score preview. Always perform an initial render.\n  render();"));
assert(html.includes('type="module" src="/js/entries/committed-preview.js"'));
assert(entry.includes('await import("../committed-preview-window.js")'));
assert(html.includes('id="committed-layout-toggle"'));
assert(html.includes('committed-window-layout committed-window-stacked'));
assert(html.includes('href="index.html" aria-label="ChordWiki Bar Formatter トップページへ"'));
assert(html.includes("リアルタイムエディター｜ChordWiki Bar Formatter"));
assert(html.includes('<details class="score-window-settings">'));
assert(css.includes(".score-window-settings-panel { position: absolute;"));
assert(html.includes('id="committed-line-height"'));
assert(html.includes('id="committed-transpose"'));
assert(html.includes('id="committed-transpose-down"'));
assert(html.includes('id="committed-transpose-up"'));
assert(
  html.indexOf('id="committed-transpose"') < html.indexOf('id="committed-transpose-down"')
    && html.indexOf('id="committed-transpose-down"') < html.indexOf('id="committed-transpose-up"'),
  "realtime transpose controls must be ordered as no-transpose select, minus, plus"
);
assert(css.includes("grid-template-columns: minmax(88px, 118px) 28px 28px;"));
assert(css.includes(".cw-upper-token-level-2 { position: relative; top: -1.1em; }"));
assert(entry.includes('import "../transposer.js"'));
assert(windowScript.includes('window.ChordWikiTranspose.transposeText(text.value, transpose.value, "preserve")'));
assert(windowScript.includes('const startedOnBackground = event.target === preview || (sourceLine && event.target === sourceLine);'));
assert(windowScript.includes('if (!startedOnBackground || (event.pointerType === "mouse" && event.button !== 0)) return;'));
assert(windowScript.includes('preview.setPointerCapture(event.pointerId);'));
assert(css.includes('.committed-window-preview.is-panning { cursor: grabbing; user-select: none; }'));
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
assert(rendered.includes('class="line cw-score-line cw-score-line-has-lyrics"'));
assert(rendered.includes('class="cw-code-token"'));
assert(rendered.includes("テスト"));
assert(preview.render("[[C]]上付き").includes("cw-upper-token-level-2"), "realtime preview must share old ChordWiki double-upper rendering");

console.log("PASS: saved realtime drafts always render line numbers, color text, and score preview");
