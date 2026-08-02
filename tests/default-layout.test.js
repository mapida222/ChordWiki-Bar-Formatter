"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

assert(html.includes('id="display-settings-shell" class="display-settings-shell display-collapsed"'), "01 must render collapsed before JavaScript starts");
assert(html.includes('id="settings-panel" class="settings-panel settings-closed"'), "03 must render collapsed by default");
assert(app.includes('setDisplaySettingsOpen(savedDisplayPanel === "true", false);'), "01 must stay collapsed when no preference has been saved");
assert(app.includes('const LAYOUT_STORAGE_KEY = "chordWikiBarFormatter.editorLayout.v2";'), "the new compact layout must not inherit incompatible saved dimensions");
assert(app.includes('const DISPLAY_PANEL_STORAGE_KEY = "chordWikiBarFormatter.displayPanelOpen.v3";'), "01 must start collapsed once when adopting the new default layout");
assert(app.includes('setDisplaySettingsOpen(false);') && app.includes('setSettingsMode("closed");'), "layout reset must restore both control panels to the collapsed state");
assert(css.includes("--top-editor-height: clamp(210px, 24vh, 230px)"), "the source editor must use the compact default height");
assert(css.includes("border: 2px solid color-mix(in srgb, var(--correction-line) 78%, var(--line))"), "the row-edit context frame must have a clear solid outline");
assert(css.includes("border-radius: 8px"), "the row-edit context frame must have rounded corners");
assert(css.includes(".settings-column-resize-edge { display: none; }"), "the redundant settings resize line must not cross the settings panel");
assert(html.includes("style.css?v=20260802-16"));
assert(html.includes("js/app.js?v=20260802-35"));

console.log("PASS: LAYOUT-003 compact default layout and clear row-edit context frame");
