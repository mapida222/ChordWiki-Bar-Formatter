"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const entry = fs.readFileSync(path.join(root, "js", "entries", "main.js"), "utf8");

assert(html.includes('id="display-settings-shell" class="display-settings-shell display-collapsed"'), "01 must render collapsed before JavaScript starts");
assert(html.includes('id="settings-panel" class="settings-panel settings-closed"'), "03 must render collapsed by default");
assert(html.includes('id="settings-example-toggle" class="text-button settings-example-toggle" type="button" aria-expanded="true" hidden'), "the usage-example toggle must be hidden before 03 is opened");
assert(app.includes('setDisplaySettingsOpen(savedDisplayPanel === "true", false);'), "01 must stay collapsed when no preference has been saved");
assert(app.includes('const LAYOUT_STORAGE_KEY = "chordWikiBarFormatter.editorLayout.v3";'), "the wider layout must not inherit incompatible saved dimensions");
assert(app.includes('const DISPLAY_PANEL_STORAGE_KEY = "chordWikiBarFormatter.displayPanelOpen.v4";'), "the display popover must start collapsed once after moving into the 02 heading");
assert(app.includes('setDisplaySettingsOpen(false);') && app.includes('setSettingsMode("closed");'), "layout reset must restore both control panels to the collapsed state");
assert(app.includes('setSettingsExamplesOpen(true);'), "layout reset must reopen compact usage examples");
assert(css.includes("--top-editor-height: clamp(210px, 24vh, 230px)"), "the source editor must use the compact default height");
assert(css.includes("--left-column-width: clamp(220px, 28%, 360px)"), "the left control and row-edit column must stay usable on a narrow screen");
assert(css.includes("grid-template-columns: var(--left-column-width) minmax(0, 1fr)"), "the right column must compress before the left control column does");
assert(app.includes("Math.max(220, Math.min(width, Math.max(220, workspaceWidth - 10)))"), "manual column resizing must preserve the left-column baseline on a narrow screen");
assert(!app.includes('const minimumOffset = settingsBottom + 16 - correctionCardTop;'), "row edit may remain beneath the settings panel");
assert(app.includes('`${outputTop - correctionTop}px`'), "only row 03 may shift to align its editor top with row 04");
assert(css.includes(".correction-history-actions button { width: 100%; min-width: 0; min-height: 25px;"), "row-edit actions must use compact bordered buttons");
assert(css.includes("border: 1px solid var(--line); border-radius: 4px;"), "row-edit action buttons must retain clear rounded outlines");
assert(css.includes(".settings-column-resize-edge { top: 0; bottom: 0; }"), "the settings panel must expose a vertical resize edge");
assert(css.includes(".settings-panel.settings-closed .settings-reset-button, .settings-panel.settings-closed .settings-footer-actions, .settings-panel.settings-closed .settings-example-toggle { display: none; }"), "a closed 03 panel must hide the usage-example control even before JavaScript initializes");
assert(html.includes("style.css?v=20260810-106"));
assert(html.includes('type="module" src="/js/entries/main.js"'));
assert(entry.includes('await import("../app.js")'));

console.log("PASS: LAYOUT-003 compact default layout and clear row-edit context frame");
