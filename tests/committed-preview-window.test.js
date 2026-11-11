"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const windowScript = fs.readFileSync(path.join(root, "js", "committed-preview-window.js"), "utf8").replace(/\r\n/g, "\n");
const html = fs.readFileSync(path.join(root, "committed-preview.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const preview = require(path.join(root, "js", "chordwiki-preview.js"));
const entry = fs.readFileSync(path.join(root, "js", "entries", "committed-preview.js"), "utf8");


assert(windowScript.includes('if (!savedDraft && !text.value) { try { text.value = localStorage.getItem(TEXT_KEY) || ""; } catch (_error) {} }'), "a resumed tab must not fall back to another song even if its own draft is empty");

assert(windowScript.includes('const keepExistingDraft = new URLSearchParams(window.location.search).get("draft") === "keep";'));
assert(windowScript.includes('if (!tabDraft && !keepExistingDraft && !pendingReplace) { try { applyState(JSON.parse(localStorage.getItem(STATE_KEY) || "null")); } catch (_error) {} }'), "tab drafts must win over newer shared score state");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
assert(app.includes('elements.openRealtimeEditor.href = "committed-preview.html?pending=replace";'));
assert(app.includes("event.preventDefault();"), "cancel must prevent opening the realtime editor");
assert(windowScript.includes('const pendingReplace = new URLSearchParams(window.location.search).get("pending") === "replace";'));
assert(windowScript.includes('id="committed-replace-dialog"') === false && html.includes('id="committed-replace-dialog"'), "replacement choice must be shown inside the realtime editor");
assert(windowScript.includes('replaceDialog.returnValue === "yes"') && windowScript.includes("history.replaceState"), "cancel must leave the old draft and close the one-shot replacement prompt");
assert(windowScript.includes("// numbers, syntax layer, or score preview. Always perform an initial render.\n  render();"));
assert(html.includes('type="module" src="/js/entries/committed-preview.js?v=20260919-001"'));
assert(/href="style\.css\?v=\d{8}-\d+"/.test(html), "the realtime editor stylesheet must have a cache version");
assert(css.includes('.committed-window-editor, .committed-window-editor-wrap .editor-highlight { padding: 10px; }'), "realtime editor text and highlight layers must share mobile padding");
assert(css.includes('font-variant-ligatures: none;'), "realtime editor text and highlight layers must use the same glyph shaping");
assert(css.includes('.bold-chords .committed-window-editor-wrap .editor-highlight .syntax-chord { font-weight: 400; text-shadow: 0 0 .35px currentColor; }'), "realtime bold chords must not change the caret measurement width");
assert(entry.includes('await import("../committed-preview-window.js")'));
assert(html.includes('id="committed-layout-toggle"'));
assert(html.includes('id="committed-position-toggle"') && html.includes(">コード位置調整モード(F2)</button>") && html.includes("F2で切替"), "realtime editor must expose chord position adjustment mode and its F2 shortcut");
assert(!html.includes('id="committed-copy"'), "realtime editor must not add a separate copy button");
assert(html.includes('id="committed-position-help"') && html.includes('id="committed-position-help" class="position-adjust-help" hidden') && html.includes("<kbd>F2</kbd> 開閉") && html.includes("<kbd>Shift+F2</kbd> 対象切替") && html.includes("<kbd>Shift+Space</kbd> 前"), "position adjustment guide must be hidden until the mode starts");
assert(html.includes('id="committed-preview-mode-status"') && html.includes('class="preview-position-status" hidden'), "preview header must expose a mode status hidden outside position adjustment");
assert(html.includes('id="committed-position-symbols"') && html.includes("小節線・ハイフンも個別に移動する (Shift+F2)"), "position adjustment must offer an optional individual structural-token target mode");
assert(html.indexOf('id="committed-position-toggle"') > html.indexOf('class="committed-window-editor-pane"'), "position adjustment toggle belongs to the editor pane header");
assert(windowScript.includes('const chordTokenPattern = /\\[\\[([^\\[\\]\\r\\n]*)\\]\\]|\\[([^\\[\\]\\r\\n]*)\\]/g;'), "position adjustment must identify chord tokens");
assert(windowScript.includes('const atStart = ranges.find((range) => position === range.start);') && windowScript.includes('position >= range.start && position < range.end'), "position adjustment clicks at adjacent token boundaries must select the following token");
assert(windowScript.includes('const handlePositionSpace = (event)') && windowScript.includes('event.key === "　"') && windowScript.includes('document.addEventListener("keydown", handlePositionSpace, true)') && windowScript.includes('document.addEventListener("keyup", handlePositionSpace, true)') && windowScript.includes('document.addEventListener("beforeinput", handlePositionBeforeInput, true)') && windowScript.includes('event.data === "　"') && windowScript.includes('event.shiftKey ? -1 : 1'), "half-width and full-width spaces must navigate chord selection without reaching edit or conversion handlers");
assert(windowScript.includes('text.addEventListener("beforeinput"') && windowScript.includes('["historyUndo", "historyRedo"].includes(event.inputType)') && windowScript.includes('event.preventDefault();'), "position adjustment mode must block direct text input while allowing history changes");
assert(windowScript.includes('text.readOnly = true') && windowScript.includes('text.readOnly = false') && windowScript.includes('beforeinput'), "position adjustment mode must block IME and direct text input while restoring editing on exit");
assert(windowScript.includes('text.addEventListener("focus", () => {') && windowScript.includes('if (positionAdjustMode) text.blur();'), "position adjustment mode must immediately remove text focus so the IME cannot handle Space");
assert(windowScript.includes('if ((event.ctrlKey || event.metaKey) && ["a", "c", "z", "y"].includes(event.key.toLowerCase())) return;'), "position adjustment mode must allow select-all, copy, undo and redo shortcuts");
assert(windowScript.includes('const positionUndoStack = []') && windowScript.includes('const undoPositionEdit = (redo = false)') && windowScript.includes('document.addEventListener("keydown", handlePositionUndo, true)'), "position adjustment mode must undo and redo scripted movements");
assert(windowScript.includes('const directiveTokenPattern = /\\{[^{}\\r\\n]*\\}/g') && windowScript.includes('const movementRanges = (source)'), "position adjustment must treat brace directives as indivisible movement units");
assert(windowScript.includes('const handlePositionNavigation = (event)') && windowScript.includes('if (["Tab", "Shift", "Control", "Alt", "Meta"].includes(event.key)) return;') && windowScript.includes('event.stopImmediatePropagation();'), "position adjustment mode must block non-navigation keyboard edits");
assert(windowScript.includes('const handlePositionShortcut = (event)') && windowScript.includes('event.key !== "F2"') && windowScript.includes('event.shiftKey && !positionAdjustMode'), "F2 shortcuts must stay separate from ordinary text input and require position mode for Shift+F2");
assert(windowScript.includes('positionSymbols.checked = !positionSymbols.checked;') && windowScript.includes('positionSymbols.dispatchEvent(new Event("change"));'), "Shift+F2 must toggle structural-token movement targets through the checkbox state");
assert(windowScript.includes('previousCodePointStart') && windowScript.includes('nextCodePointEnd'), "horizontal position adjustment must move by text characters");
assert(windowScript.includes('text.setRangeText(`${range.token}${previousText}`, previousStart, range.end, "select")') && windowScript.includes('text.setRangeText(`${nextText}${range.token}`, range.start, nextEnd, "select")'), "horizontal position adjustment must move the selected token between text characters");
assert(windowScript.includes('const previousToken = positionTokens.find((token) => token.end === range.start)') && windowScript.includes('const nextToken = positionTokens.find((token) => token.start === range.end)'), "horizontal position adjustment must move across one position unit at a time");
assert(windowScript.includes('const tokenSelector = includePositionSymbols') && windowScript.includes('event.target.closest?.(tokenSelector)'), "preview token clicks must select the matching source token");
assert(windowScript.includes('chordRanges(text.value, includePositionSymbols)'), "selection navigation must follow the optional structural-token target mode");
assert(windowScript.includes('positionHelp.hidden = false') && windowScript.includes('positionHelp.hidden = true'), "position adjustment guide must toggle with the mode");
assert(windowScript.includes('previewPane.classList.add("position-adjust-active")') && windowScript.includes('previewModeStatus.hidden = false') && windowScript.includes('previewModeStatus.hidden = true'), "preview header must follow position adjustment mode state");
assert(windowScript.includes('const syncPreviewHeaderHeight = ()') && windowScript.includes('previewTitle.style.height = `${editorTitle.getBoundingClientRect().height}px`'), "preview header must match the editor header height");
assert(css.includes(".editor-highlight .position-adjust-active"), "selected chord must have a position-adjustment highlight");
assert(css.includes(".position-adjust-help[hidden]") && css.includes("display: none !important"), "position adjustment guide must stay hidden outside the mode");
assert(css.includes(".committed-window-preview-pane.position-adjust-active") && css.includes(".preview-position-status[hidden]"), "preview header must expand and hide its mode status outside position adjustment");
assert(css.includes(".position-adjust-option") && css.includes("margin-inline-start: 3em"), "structural-token option must have about three character widths of spacing after the keyboard guide");
assert(css.includes(".committed-window-editor-pane.position-adjust-active") && css.includes(".position-adjust-help kbd"), "position adjustment mode must tint the editor pane and key guide");
assert(!html.includes('id="realtime-draft-dialog"'), "realtime draft choice belongs to the main page, not the editor window");
assert(html.includes('committed-window-layout committed-window-stacked'));
assert(html.includes('href="index.html" aria-label="ChordWiki Bar Formatter トップページへ"'));
assert(html.includes("リアルタイムエディター｜ChordWiki Bar Formatter"));
assert(html.includes('<details class="score-window-settings">'));
assert(windowScript.includes('if (helpPanel?.open && !helpPanel.contains(event.target)) helpPanel.open = false;'), "realtime editor help must close on outside clicks");
assert(windowScript.includes('if (settingsPanel?.open && !settingsPanel.contains(event.target)) settingsPanel.open = false;'), "realtime editor display settings must close on outside clicks");
assert(html.includes('<details class="score-window-help">'));
assert(html.includes('<strong>リアルタイムエディターの使い方</strong>'));
assert(html.includes('右の譜面をクリックすると、対応する左の行を確認できます。'));
assert(html.includes('元の画面の変換前・変換後は自動更新されません。'));
assert(css.includes('.score-window-help-panel { position: absolute;'));
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
assert(css.includes("grid-template-columns: max-content 28px 28px;") && css.includes("select { width: max-content;"), "realtime transpose choices must use their text width instead of a wide fixed column");
assert(css.includes(".cw-upper-token-level-2 { position: relative; top: -1.1em; }"));
assert(entry.includes('import "../transposer.js"'));
assert(windowScript.includes('window.ChordWikiTranspose.transposeText(text.value, previewTranspose, spelling.value)'));
assert(windowScript.includes('const spelling = document.querySelector("#committed-spelling");') && windowScript.includes('const commitSpellingSelection = () => {') && windowScript.includes('spelling.addEventListener("change", commitSpellingSelection);'), "realtime note-name spelling must update the editor text");
assert(windowScript.includes('const converted = window.ChordWikiTranspose?.transposeText(text.value, 0, spelling.value);') && windowScript.includes('text.value = converted;') && windowScript.includes('publishText();'), "realtime note-name spelling changes must publish the converted editor text");
assert(windowScript.includes('spelling: spelling.value'), "realtime note-name spelling must persist with display settings");
assert(windowScript.includes("let appliedTranspose = 0;") && windowScript.includes("let transposeCommitted = false;"), "realtime transpose must track text-applied state separately from the selector");
assert(windowScript.includes("const previewTranspose = transposeCommitted ? 0 : Number(transpose.value) || 0;"), "realtime preview must not apply a transpose twice after the editor text is changed");
assert(windowScript.includes("const commitTransposeSelection = () => {") && windowScript.includes("const delta = transposeCommitted ? target - appliedTranspose : target;"), "realtime transpose changes must apply the selected delta to the editor text");
assert(windowScript.includes("text.value = transposed;") && windowScript.includes("publishText();"), "realtime transpose must publish the transposed editor text");
assert(windowScript.includes("transposeApplied: transposeCommitted") && windowScript.includes("appliedTranspose"), "realtime transpose state must persist without changing the existing draft schema");
assert(windowScript.includes('text.value = next;\n      appliedTranspose = 0;\n      transposeCommitted = false;'), "initial imported text must reset baked transpose tracking");
assert(windowScript.includes('const startedOnBackground = event.target === preview || Boolean(sourceLine);'), "dragging any rendered score line must pan the preview");
assert(windowScript.includes('if (!startedOnBackground || (event.pointerType === "mouse" && event.button !== 0)) return;'));
assert(windowScript.includes('preview.setPointerCapture(event.pointerId);'));
assert(css.includes('.committed-window-preview.is-panning { cursor: grabbing; user-select: none; }'));
assert(css.includes('.committed-window-preview { cursor: grab; touch-action: none; }'), "touch drag must stay available for two-axis preview panning");
assert(html.includes('id="committed-font-size-value"'));
assert(html.includes('id="committed-spelling"') && html.includes('<option value="sharp">#表記</option><option value="preserve">元表記</option><option value="flat">♭表記</option>'), "realtime editor must expose the shared note-name spelling choices in the standard order");
assert(html.indexOf('id="committed-transpose-up"') < html.indexOf('id="committed-spelling"') && html.indexOf('id="committed-spelling"') < html.indexOf('id="committed-layout-toggle"'), "realtime note-name spelling must sit immediately to the right of transpose controls");
assert(html.includes('<span>移調</span><span class="committed-transpose-stepper">') && html.includes('aria-label="プレビューを半音下げる">▼') && html.includes('aria-label="プレビューを半音上げる">▲'), "realtime transpose and note-name controls must stay inline without opening a side settings panel");
assert(css.includes('.committed-transpose-control, .committed-spelling-control { display: flex;') && css.includes('.committed-transpose-stepper { display: grid;'), "realtime transpose and spelling controls must use the compact inline toolbar layout");
assert(html.includes('id="committed-bold-code" type="checkbox" checked'));
assert(windowScript.includes("function alignCurrentLineRule() {"));
assert(windowScript.includes('layer.style.setProperty("--current-line-rule", `${y}px`);'));
assert(windowScript.includes("if (previewRow) previewRow.dataset.sourceLine = String(sourceLineIndex);"));
assert(windowScript.includes('event.target.closest("[data-source-line]")'));
assert(windowScript.includes("const LINE_NUMBER_TRAILING_ROWS = 2"), "realtime editor line numbers must reserve two visual trailing rows");
assert(windowScript.includes('class=\"line-number-spacer\"'), "realtime editor line-number padding must not add text rows");
assert(windowScript.includes('scrollPositionForProgress(element, "top", topProgress)'), "realtime editor must calculate scroll positions from normalized progress");
assert(windowScript.includes('setScrollProgress(preview, scrollSync.checked ? textTopProgress : previewTopProgress'), "realtime editor startup and rerender must restore proportional preview position");
assert(windowScript.includes("scrollPositionWasSuppressed"), "realtime editor linked scroll events must not bounce back and forth");
assert(css.includes("--committed-line-height: 2.75"));
assert(css.includes(".committed-window-editor-wrap .line-numbers span { height: calc(var(--editor-font-size) * var(--committed-line-height)); }"));
assert(css.includes(".committed-window-preview { height: 100%; margin: 0; border: 0; border-radius: 0; font-size: var(--editor-font-size) !important; }"));
assert(css.includes(".committed-window-layout.committed-window-stacked"));
assert(css.includes("--committed-line-height: 1.65"));
assert(css.includes("@media (min-width: 1040px)") && css.includes("grid-template-columns: minmax(330px, .92fr) minmax(0, 1.08fr);"), "realtime editor must keep the toolbar on one row when the CSS viewport has room");
assert(css.includes("@media (min-width: 521px) and (max-width: 1039px)") && css.includes("row-gap: 4px;") && css.includes("justify-content: flex-start; flex-wrap: nowrap; gap: 5px;"), "realtime editor must use the compact two-row toolbar at intermediate widths");
assert(css.includes("@media (min-width: 521px) and (max-width: 820px)") && css.includes(".score-window-controls { justify-content: flex-start; flex-wrap: wrap; gap: 4px; }"), "realtime editor controls must wrap only when the intermediate toolbar becomes too narrow");
assert(css.includes(".score-window-brand-logo { flex-basis: 150px; min-width: 108px; }") && css.includes(".score-window-brand-logo { flex-basis: 112px; min-width: 88px; }"), "realtime editor branding must shrink before the toolbar adds another row");
assert(css.includes("@media (min-width: 480px) and (max-width: 820px)") && css.includes("grid-template-columns: minmax(190px, .72fr) minmax(0, 1.28fr);"), "realtime editor must use empty heading space before adding a third toolbar row");
assert(windowScript.includes('const layoutModes = ["stacked", "side", "side-reverse", "stacked-reverse"]') && windowScript.includes('layoutMode = layoutModes[(currentIndex + 1 + layoutModes.length) % layoutModes.length]'), "realtime comparison layout must cycle through vertical, horizontal, and reversed arrangements");
assert(windowScript.includes('layout.classList.toggle("committed-window-stacked-reverse", stackedReverse)') && windowScript.includes('layout.classList.toggle("committed-window-side-reverse", sideReverse)'), "realtime comparison layout must apply reverse pane order");
assert(html.includes('id="committed-layout-toggle" class="layout-toggle-button" type="button">↕表示入替↔</button>') && windowScript.includes('layoutToggle.textContent = "↕表示入替↔"'), "comparison layout must use one fixed compact button label");
assert(windowScript.includes('layoutToggle.setAttribute("aria-label", `編集とプレビューの配置を切り替え'), "comparison layout button must announce the current arrangement");
assert(css.includes('grid-template-areas: "editor" "divider" "preview";') && css.includes('grid-template-areas: "preview" "divider" "editor";') && css.includes('grid-template-areas: "preview divider editor";'), "realtime comparison layout must define both vertical and horizontal reverse arrangements");
assert(windowScript.includes('let layoutMode = "stacked";'));
assert(windowScript.includes("stackedLineHeight = next; else sideLineHeight = next;"));
assert(windowScript.includes("checkboxDefaultsVersion: 1"));
assert(windowScript.includes("stackedPaneSize, sidePaneSize"));
assert(windowScript.includes("Math.max(6, Math.min(94"));
assert(windowScript.includes("requestAnimationFrame(() => {"));
assert(css.includes(".committed-window-editor-wrap .editor-text-layer::after"));
assert(css.includes('.committed-window-preview > [data-source-line].compare-active'));

const rendered = preview.render("[|][C][----]テスト[|]");
assert(rendered.includes('class="line cw-score-line cw-score-line-has-lyrics"'));
assert(rendered.includes('class="cw-code-token"'));
assert(rendered.includes("テスト"));
assert(preview.render("[[C]]上付き").includes("cw-upper-token-level-2"), "realtime preview must share old ChordWiki double-upper rendering");

console.log("PASS: saved realtime drafts always render line numbers, color text, and score preview");

// Exercise the real range/movement functions without booting the DOM page.
const vm = require("vm");
const historyPreviewStub = { scrollTop: 420, scrollLeft: 80, classList: { toggle() {} } };
const historyContext = {
  historyPreview: historyPreviewStub,
  scoreView: { setAttribute() {} }, sourceView: { setAttribute() {} },
  selectedEntry: { historyText: "曲B" }, showSource: false,
  entryText: entry => entry.historyText,
  window: { ChordWikiPreview: { renderInto(element) { element.scrollTop = element.scrollLeft = 0; } } }
};
vm.createContext(historyContext);
vm.runInContext(windowScript.slice(windowScript.indexOf("  function drawHistoryPreview()"), windowScript.indexOf('  scoreView.addEventListener("click"')), historyContext);
vm.runInContext("drawHistoryPreview();", historyContext);
assert.strictEqual(historyPreviewStub.scrollTop, 420, "switching history songs must retain vertical preview position after rendering");
assert.strictEqual(historyPreviewStub.scrollLeft, 80, "switching history songs must retain horizontal preview position");
historyContext.showSource = true;
vm.runInContext("drawHistoryPreview();", historyContext);
assert.strictEqual(historyPreviewStub.scrollTop, 420, "switching to source must retain preview position");
historyContext.selectedEntry = null;
vm.runInContext("drawHistoryPreview();", historyContext);
assert.strictEqual(historyPreviewStub.scrollTop, 0, "opening a new history browsing session starts at the top");
assert.strictEqual(historyPreviewStub.scrollLeft, 0);
const positionContext = {
  window: { ChordWikiPreview: { isRhythmToken: (token) => /^[\s\-=>≧○]+$/.test(token) } },
  text: {
    value: "", selectionStart: 0, selectionEnd: 0,
    setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; },
    setRangeText(value, start, end) { this.value = this.value.slice(0, start) + value + this.value.slice(end); },
    blur() {}, focus() {}
  },
  render() {}, setActiveLine() {}, publishText() {}, positionStatus() {}, status: {}
};
vm.createContext(positionContext);
const rangeSource = windowScript.slice(windowScript.indexOf("  const chordTokenPattern"), windowScript.indexOf("  const scrollProgress"));
const moveSource = windowScript.slice(windowScript.indexOf("  const lineRanges"), windowScript.indexOf("  const isPositionSpace"));
vm.runInContext(`let activeChordStart = -1, includePositionSymbols = false;
  const positionUndoStack = [], positionRedoStack = [];
  ${rangeSource}\n${moveSource}
  globalThis.positionTest = {
    ranges: (value, symbols = false) => chordRanges(value, symbols),
    reset(value, at, symbols = false) { text.value = value; includePositionSymbols = symbols;
      activeChordStart = -1; text.setSelectionRange(at, at); positionUndoStack.length = 0; positionRedoStack.length = 0; },
    move: moveActiveChord, undo: undoPositionEdit
  };`, positionContext);
const positionTest = positionContext.positionTest;
positionTest.reset("あ[|][F]い", 4);
assert(positionTest.move("right"));
assert.strictEqual(positionContext.text.value, "あい[|][F]", "a directly attached bar must move with its chord by default");
assert(positionTest.undo());
assert.strictEqual(positionContext.text.value, "あ[|][F]い");
assert(positionTest.undo(true));
assert.strictEqual(positionContext.text.value, "あい[|][F]");
const movementCases = [
  ["あ[|][F]い", 4, "left", "[|][F]あい"],
  ["[|][F]あ", 3, "left", "[|][F]あ"],
  ["あ[|][F]", 4, "right", "あ[|][F]"],
  ["あ[F]い", 1, "right", "あい[F]"],
  ["[|] [F]あ", 4, "right", "[|] あ[F]"],
  ["[|]か[F]あ", 4, "right", "[|]かあ[F]"],
  ["[|][F][|][G]", 3, "right", "[|][G][|][F]"],
  ["[|][F][G]", 3, "right", "[G][|][F]"],
  ["[G][|][F]", 6, "left", "[|][F][G]"],
  ["[|][|][F]", 6, "left", "[|][F][|]"],
  ["[|][F][----]あ", 3, "right", "[----][|][F]あ"],
  ["[|][F]\nあ", 3, "right", "[|][F]\nあ"],
  ["[|][F]\nあ", 3, "down", "\n[|][F]あ"],
  ["あ\n[|][F]", 5, "up", "[|][F]あ\n"],
  ["あ[|][F]\n[G]い", 4, "down", "あ\n[|][F][G]い"],
  ["{c:間奏}[|][F]あ", 9, "left", "[|][F]{c:間奏}あ"],
  ["歌(うた)[|][F]続き", 8, "right", "歌(うた)続[|][F]き"]
];
for (const [input, at, direction, expected] of movementCases) {
  positionTest.reset(input, at);
  positionTest.move(direction);
  assert.strictEqual(positionContext.text.value, expected, `${direction}: ${input}`);
}
for (const chord of ["F/A", "Fmaj7(#11)", "G7(b9)/B", "[F]"]) {
  const input = `あ[|][${chord}]い`;
  positionTest.reset(input, 5);
  positionTest.move("right");
  assert.strictEqual(positionContext.text.value, `あい[|][${chord}]`);
  positionTest.undo(); positionTest.move("left");
  assert.strictEqual(positionTest.undo(true), false, "a new edit must discard redo history");
}
positionTest.reset("[|][F]あ", 3, true);
positionTest.move("right");
assert.strictEqual(positionContext.text.value, "[|]あ[F]", "the existing structural-token mode keeps individual movement");
console.log("PASS: PREVIEW-009 grouped bar/chord ranges, adjacent tokens, line moves and undo/redo");

const scrollContext = { WeakMap };
vm.createContext(scrollContext);
const scrollHelpers = windowScript.slice(windowScript.indexOf("  const scrollProgress ="), windowScript.indexOf("  function render()"));
vm.runInContext(`const suppressedScrollPositions = new WeakMap(); ${scrollHelpers}
  globalThis.scrollTest = { setScrollProgress, scrollPositionWasSuppressed };`, scrollContext);
let roundedTop = 0;
let roundedLeft = 0;
const roundedPane = {
  scrollHeight: 2000, clientHeight: 300, scrollWidth: 1000, clientWidth: 400,
  get scrollTop() { return roundedTop; },
  set scrollTop(value) { roundedTop = Math.round(value * 64) / 64; },
  get scrollLeft() { return roundedLeft; },
  set scrollLeft(value) { roundedLeft = Math.round(value * 64) / 64; }
};
scrollContext.scrollTest.setScrollProgress(roundedPane, 1 / 3, 1 / 7);
assert.strictEqual(scrollContext.scrollTest.scrollPositionWasSuppressed(roundedPane), true,
  "browser-rounded programmatic preview scrolling must not feed back into the editor");
assert.strictEqual(Boolean(scrollContext.scrollTest.scrollPositionWasSuppressed(roundedPane)), false,
  "only the matching programmatic scroll event is suppressed");
scrollContext.scrollTest.setScrollProgress(roundedPane, 0.5, 0.5);
roundedPane.scrollTop += 10;
assert.strictEqual(Boolean(scrollContext.scrollTest.scrollPositionWasSuppressed(roundedPane)), false,
  "a real user scroll after synchronization must still propagate");

const draftWrites = new Map();
assert(windowScript.includes("function restoreEditorView("), "restored text must restore its selection and viewport before the next input");
const viewContext = {
  text: { value: "line1\nline2\nline3", selectionStart: 17, selectionEnd: 17, scrollTop: 0, scrollLeft: 0,
    setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; this.scrollTop = 999; } },
  lines: { scrollTop: 0 }, highlight: { style: {} }, scrollSync: { checked: false }, setActiveLine() {}, Number, Math
};
vm.createContext(viewContext);
const restoreViewSource = windowScript.slice(windowScript.indexOf("  function restoreEditorView("), windowScript.indexOf("  const saveWarning"));
vm.runInContext(restoreViewSource, viewContext);
vm.runInContext("restoreEditorView({selectionStart:6,selectionEnd:8,scrollTop:120,scrollLeft:40});", viewContext);
assert.strictEqual(viewContext.text.selectionStart, 6, "resuming a tab must not leave the caret at the end of its restored text");
assert.strictEqual(viewContext.text.selectionEnd, 8);
assert.strictEqual(viewContext.text.scrollTop, 120, "restore viewport after setSelectionRange may scroll the native textarea");
assert.strictEqual(viewContext.lines.scrollTop, 120, "line numbers must follow the restored text viewport");
assert.strictEqual(viewContext.highlight.style.transform, "translate(-40px, -120px)", "syntax layer must follow the restored viewport");
const lifecycleHandlers = {};
const lifecycleCalls = [];
const lifecycleContext = {
  resumeEditorView: null, editorViewInteracted: true,
  captureEditorView: () => ({ selectionStart: 453, selectionEnd: 453, scrollTop: 269.6, scrollLeft: 0 }),
  render: () => lifecycleCalls.push("render"),
  restoreEditorView: (view) => lifecycleCalls.push(view),
  saveTabDraft: () => lifecycleCalls.push("save-tab"),
  window: { addEventListener: (name, handler) => { lifecycleHandlers[name] = handler; } },
  document: { hidden: false, addEventListener: (name, handler) => { lifecycleHandlers[name] = handler; } },
  requestAnimationFrame() {}
};
vm.createContext(lifecycleContext);
vm.runInContext(windowScript.slice(windowScript.indexOf("  const refreshEditorView ="), windowScript.lastIndexOf("}());")), lifecycleContext);
lifecycleHandlers.pagehide();
assert.strictEqual(lifecycleCalls[0], "save-tab", "leaving a tab must save its current cursor and viewport locally");
lifecycleHandlers.pageshow();
assert.strictEqual(lifecycleCalls[1], "render", "restore must rebuild missing line numbers and syntax layers before positioning them");
assert.strictEqual(lifecycleCalls[2].selectionStart, 453);
assert.strictEqual(lifecycleCalls[2].scrollTop, 269.6);
assert.strictEqual(lifecycleCalls.filter((call) => call === "save-tab").length, 1, "showing a restored tab must not publish or resave an old song");
const sharedDraftStorage = { getItem: (key) => draftWrites.get(key) ?? null, setItem: (key, value) => draftWrites.set(key, value) };
const emittedDrafts = [];
const draftContext = {
  text: { value: "曲Aの編集" }, draftUpdatedAt: 0, lastPublishedText: "曲A",
  transpose: { value: "0" }, transposeCommitted: false, appliedTranspose: 0,
  TEXT_KEY: "text", DRAFT_KEY: "draft", localStorage: sharedDraftStorage,
  sessionStorage: { setItem(key, value) { this[key] = value; } },
  channel: { postMessage: (payload) => emittedDrafts.push(payload) },
  window: { opener: { closed: false, postMessage: (payload) => emittedDrafts.push(payload) }, location: { origin: "http://localhost" }, addEventListener() {}, CBFHistoryStore: { titleValueFromText: () => "" } },
  document: { querySelector: () => ({}), addEventListener() {} }, crypto: { randomUUID: () => "test-song" },
  setTimeout: () => 1, clearTimeout() {},
  render() {}, status: {}, Date
};
vm.createContext(draftContext);
const publishSource = windowScript.slice(windowScript.indexOf("  function captureEditorView()"), windowScript.indexOf("  const positionStatus"));
vm.runInContext(publishSource, draftContext);
vm.runInContext("publishText();", draftContext);
assert.strictEqual(JSON.parse(draftContext.sessionStorage.draft || "null")?.text, "曲Aの編集", "each tab must save its own draft before publishing");
assert.strictEqual(emittedDrafts.length, 1, "edited text must go only to its opener, never all song tabs");
assert.strictEqual(emittedDrafts[0].baseText, "曲A", "the opener must be able to reject a stale edit against another song");
assert.strictEqual(draftContext.lastPublishedText, "曲Aの編集");
assert.strictEqual(typeof JSON.parse(draftContext.sessionStorage.draft).historyDueAt, "number", "tab drafts must keep the scheduled song-history checkpoint");
draftWrites.set("draft", JSON.stringify({ text: "新しい曲B", updatedAt: Date.now() + 60_000 }));
vm.runInContext("flushDraft();", draftContext);
assert.strictEqual(JSON.parse(draftWrites.get("draft")).text, "新しい曲B", "a delayed autosave from a resumed old tab must not overwrite a newer shared draft");
assert.strictEqual(draftWrites.has("text"), false, "a rejected stale save must not update the shared committed text either");
assert(!windowScript.includes('event.key === TEXT_KEY'), "storage events from another song must not overwrite a realtime tab");

const restoreTabSource = windowScript.slice(windowScript.indexOf("  let tabDraft = null;"), windowScript.indexOf("  // A saved draft"));
for (const savedText of ["曲A", ""]) {
  const restoreTabContext = {
    sessionStorage: { getItem: () => JSON.stringify({ text: savedText, updatedAt: 10, transpose: "2", transposeApplied: true, appliedTranspose: 2 }) },
    localStorage: { getItem: () => JSON.stringify({ text: "曲B", committedText: "曲B", updatedAt: 20 }) },
    DRAFT_KEY: "draft", TEXT_KEY: "text", STATE_KEY: "state", keepExistingDraft: false, pendingReplace: false,
    loadedDraftText: "", draftUpdatedAt: 0, lastPublishedText: "", text: { value: "" },
    transpose: { value: "-5" }, transposeCommitted: false, appliedTranspose: 0,
    applyState() { throw new Error("shared state must never replace a resumed tab"); }
  };
  vm.createContext(restoreTabContext);
  vm.runInContext(restoreTabSource, restoreTabContext);
  assert.strictEqual(restoreTabContext.text.value, savedText, "a resumed tab must keep its own song, including an intentionally empty draft");
  assert.strictEqual(restoreTabContext.transpose.value, "2", "another song's transpose must not replace the resumed tab's setting");
  assert.strictEqual(restoreTabContext.appliedTranspose, 2);
}
const committedMessageSource = app.slice(app.indexOf('    if (event.data.type === "committed-text")'), app.indexOf('    if (event.data.type !== "score-request"'));
const parentContext = {
  elements: { committedOutput: { value: "曲B" } },
  localStorage: { setItem() { throw new Error("a stale editor must not overwrite the parent song"); } }
};
vm.createContext(parentContext);
vm.runInContext(`function receive(event) { ${committedMessageSource} } receive({data:{type:"committed-text",text:"古い曲A",baseText:"曲A"}});`, parentContext);
assert.strictEqual(parentContext.elements.committedOutput.value, "曲B");
vm.runInContext('receive({data:{type:"committed-text",text:"旧形式の曲A"}});', parentContext);
assert.strictEqual(parentContext.elements.committedOutput.value, "曲B", "legacy messages without a baseline must be rejected");
parentContext.localStorage.setItem = () => {};
Object.assign(parentContext, { COMMITTED_OUTPUT_STORAGE_KEY: "committed", updateCount() {}, updateLineNumbers() {}, publishScoreWindow() {} });
vm.runInContext('receive({data:{type:"committed-text",text:"曲Bの編集",baseText:"曲B"}});', parentContext);
assert.strictEqual(parentContext.elements.committedOutput.value, "曲Bの編集", "edits based on the current parent song must still be accepted");
