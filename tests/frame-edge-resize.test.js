"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert(html.includes('data-row="top" data-edge="top"'), "the source editor needs a draggable top edge");
assert(html.includes('class="frame-resize-corner two-axis" data-panel="settings" data-column="direct" role="separator" aria-label="初期設定枠の幅と高さを調整"'), "settings needs the same bottom-right resize handle as the editor frames");
assert(html.includes('data-row="top" data-edge="bottom"'), "the source editor needs a draggable bottom edge");
assert(html.includes('data-row="bottom" data-edge="top"'), "the result editor needs a draggable top edge");
assert(html.includes('data-row="bottom" data-edge="bottom"'), "the result editor needs a draggable bottom edge");
assert(html.includes('data-row="final" data-edge="top"') && html.includes('data-row="final" data-edge="bottom"'), "the score preview needs both vertical resize edges");
assert(html.includes('class="frame-resize-corner two-axis" data-row="final" data-column="direct" role="separator" aria-label="譜面プレビュー枠の幅と高さを調整"'), "score preview needs a bottom-right resize handle");
assert(html.match(/class="frame-resize-edge[^\"]*"[^>]+aria-orientation="horizontal"/g)?.length >= 10, "all requested panel edges must expose horizontal separator semantics");
assert(html.includes('class="column-resize-edge editor-column-resize-edge" data-column="direct" role="separator" aria-label="変換前枠の左端を左右に調整"'));
assert(html.includes('class="column-resize-edge editor-column-resize-edge" data-column="direct" role="separator" aria-label="変換後枠の左端を左右に調整"'));
assert(html.includes('class="column-resize-edge input-right-resize-edge" data-column="inverse" role="separator" aria-label="変換前枠の右端を左右に調整"'));
assert(html.includes('class="column-resize-edge output-right-resize-edge" data-column="inverse" role="separator" aria-label="変換後枠の右端を左右に調整"'));
assert(html.match(/class="column-resize-edge[^\"]*"[^>]+aria-orientation="vertical"/g)?.length >= 10, "all requested panel edges must expose vertical separator semantics");
assert(css.includes(".frame-resize-edge {"));
assert(css.includes("cursor: ns-resize"));
assert(css.includes(".frame-resize-edge-top { top: -4px; bottom: auto; }"));
assert(css.includes(".editor-column-resize-edge { top: 0; right: auto; bottom: 0; left: -5px; }"));
assert(app.includes('document.querySelectorAll(".frame-resize-edge").forEach((edge) => {'));
assert(app.includes("function positionFrameResizeEdges()"));
assert(app.includes("const edgeY = edge.dataset.edge === \"top\" ? targetRect.top : targetRect.bottom;"));
assert(app.includes("const direction = edge.dataset.edge === \"top\" ? -1 : 1;"));
assert(app.includes("setAuxiliaryPanelHeight(panelName, height);"));
assert(app.includes('edge.addEventListener("pointercancel", endDrag);'));
assert(app.includes('if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;'));

console.log("PASS: LAYOUT-004 source and result bottom borders resize vertically");
