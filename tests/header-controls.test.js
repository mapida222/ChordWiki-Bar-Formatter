"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");

assert(html.includes('<span>小節線[|]にカッコをつけない</span>'));
assert.strictEqual((html.match(/id="added-background"/g) || []).length, 1);
assert(html.includes('<label class="output-diff-setting"><input id="added-background" type="checkbox" checked> <span>差分背景</span></label>'));
const resultSettingOrder = [
  html.indexOf('<label class="output-diff-setting">'),
  html.indexOf('<label class="output-bar-setting">'),
  html.indexOf('<span class="diff-legend"')
];
assert(resultSettingOrder.every((position, index) => position >= 0 && (index === 0 || position > resultSettingOrder[index - 1])), "04. 変換後設定 must order diff, bar bracket, then auto-added legend");
assert(!html.includes("自動追加の背景に色付ける"));
const diffBackgroundHandler = app.match(/elements\.addedBackground\.addEventListener\("change", \(\) => \{([\s\S]*?)\n  \}\);/);
assert(diffBackgroundHandler);
assert(diffBackgroundHandler[1].includes("updateEditorHighlight(elements.output)"));
assert(!/scheduleConversion|positionSettingsPanel|syncResultRowAlignment/.test(diffBackgroundHandler[1]));
assert(html.includes('<button id="correction-refresh-line" type="button"'));
assert(html.includes("↻ この行を更新"));
assert(html.includes('<button id="correction-rebuild-all" class="correction-rebuild-button" type="button"'));
assert(html.includes("↻ 変換後から行修正を復元"));
assert(html.includes("「?」は自動変換できなかった位置です。手動で変換・調整をしてください。"));
assert(html.includes('aria-label="この行を更新と行修正を復元の説明"'));
assert(html.includes("<b>変換後から行修正を復元</b>：変換後の全行から行修正値を推論し直します。"));
assert(html.includes('id="correction-position" class="correction-position" aria-live="polite" hidden'));
assert.strictEqual((html.match(/class="correction-action-divider"/g) || []).length, 0, "the restored support frame must use button spacing instead of pipe separators");
assert(!html.includes('id="correction-support-toggle"'), "row-edit support must stay visible without a redundant collapse button");
assert(css.includes(".correction-position[hidden] { display: none !important; }"));
assert.strictEqual((html.match(/data-correction-symbol=/g) || []).length, 6);
assert(css.includes(".correction-rebuild-button {"));
assert(!css.includes(".correction-refresh-help { position: absolute;"));
assert(app.includes('correctionRefreshLine: $("#correction-refresh-line")'));
assert(app.includes('correctionRebuildAll: $("#correction-rebuild-all")'));
assert(app.includes("function rebuildCorrectionsFromOutput()"));
assert(app.includes('elements.correctionRefreshLine.addEventListener("click"'));
assert(app.includes("keepOutputAndRefreshCorrection(lineIndex)"));
assert(css.includes(".correction-context-bar { position: relative; margin-bottom: 4px;"));
assert(css.includes(".correction-history-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));"));
assert(css.includes(".correction-history-actions .correction-rebuild-button { grid-column: 1 / 3; }"));
assert(css.includes("border: 1px solid var(--line); border-radius: 4px;"), "row-edit actions must remain bordered buttons");
assert(html.includes('aria-label="この行を更新と行修正を復元の説明"'));
assert(html.includes('<strong class="context-help-title">03. 行修正の操作</strong>'));
assert(html.includes('<b>この行を更新</b>') && html.includes('<b>変換後から行修正を復元</b>'));
assert(css.includes(".correction-card { z-index: 10; grid-column: 1; grid-row: 2; transform: translateY(var(--correction-controls-offset, 0px)); }"), "row-edit help must be above the result column");
assert(css.includes(".correction-history-actions > .context-help { display: grid; place-items: center; align-self: center; justify-self: center; }"));
assert(css.includes(".correction-history-actions .context-help-button { flex: 0 0 18px; width: 18px; height: 18px; min-height: 18px; padding: 0; border-radius: 50%; place-items: center; }"), "row-edit help must remain a centered circular question button");
assert(html.includes('class="column-resize-edge guide-column-resize-edge"'));
assert(!html.includes('data-panel="guide"'));
assert(css.includes(".correction-input-guide { position: relative; min-width: 0; min-height: 72px; height: auto;"));
assert(css.includes("overflow: visible;"));
assert(css.includes(".guide-column-resize-edge { top: 0; bottom: 0; }"));
assert(!app.includes("guideHeight:"));
assert(!app.includes("layout.guideHeight"));
assert(!html.includes('id="correction-append"'));
assert(!html.includes("＋ 末尾に追加"));
assert(!html.includes("編集時の小節線[|]にカッコをつけない"));
assert(html.includes('id="add-input-brackets" class="sample-header-button bracket-header-button"'));
assert(html.includes('<span>コードに[]を追加</span></button>'));
assert(css.includes(".bracket-header-button { justify-content: center; padding-inline: 7px; white-space: nowrap; }"));
assert(css.includes(".sample-header-button:not(.bracket-header-button) > span:last-child"));
assert(html.includes('id="hyphen-removal-linked" type="checkbox" checked'));
assert(html.includes("初期設定値を使う"));
assert(!html.includes("コード直後のハイフン数と連動"));
assert(app.includes('elements.removalLinked.addEventListener("change"'));
assert(app.includes("elements.removalLinked.checked = false"));
assert(html.includes('id="lyric-hyphen-mode"'));
assert(html.indexOf('id="removal-summary"') > html.indexOf('id="output-shell"'));
assert(css.includes("#removal-summary { z-index: 1; grid-column: 2; grid-row: 1;"));
assert(!css.includes("#removal-summary { grid-column: 1 / -1;"));
const showOption = html.indexOf('<option value="show">省略しない</option>');
const targetOption = html.indexOf('<option value="target" selected>指定数だけ省略（カスタム・おすすめ）</option>');
const minimizeOption = html.indexOf('<option value="minimize">できるだけ省略</option>');
const allOption = html.indexOf('<option value="all">すべて省略</option>');
assert(showOption >= 0 && showOption < targetOption && targetOption < minimizeOption && minimizeOption < allOption);
assert.strictEqual((html.match(/class="context-help-button"/g) || []).length, 5);
assert.strictEqual((html.match(/class="context-help-title"/g) || []).length, 5);
[
  "02. 初期設定",
  "03. 行修正",
  "03. 行修正の操作",
  "04. 変換後：歌詞行のハイフン",
  "05. 譜面プレビュー"
].forEach((title) => assert(html.includes(`class="context-help-title">${title}</strong>`), `${title} help title`));
assert(css.includes(".context-help-title { display: block;"));
assert(html.includes("表示方法を選びます。<br>「省略しない」：すべてのハイフンを表示します。"));
assert(html.includes("複数指定はカンマ区切りで入力します（例：4,8）。"));
assert(html.includes("「できるだけ省略」：コードチェンジの位置が必要な箇所を残して省略します。"));
assert(html.includes("小節位置を調整します。<br>入力例と記号の意味"));
assert(html.includes("譜面に近い形で確認します。<br>移調、音名表記"));
assert(html.includes("初期設定値を使う"));
assert(app.includes("LYRIC_HYPHEN_MODE_STORAGE_KEY"));
assert(app.includes('elements.lyricHyphenMode.addEventListener("change"'));
assert(app.includes('elements.finalPreview.classList.remove("omit-long-rhythm");'), "譜面プレビューは最終出力の省略結果をそのまま表示する");
assert(app.includes("updateLyricHyphenControls"));
assert(!html.includes('id="hide-lyric-hyphens"'));
assert(css.includes("gap: 0 10px; align-items: start;"));
assert(css.includes(".input-card { grid-column: 2; grid-row: 1; align-self: end; }"));
assert(html.includes('<h2 id="settings-title" class="compact-editor-title">02. 初期設定'));
assert(html.includes('<label for="input-text">01. 変換前'));
assert(html.includes('id="display-settings-toggle" class="help-open-button display-settings-trigger"'));
assert(html.includes('aria-controls="display-settings-shell">表示設定▼</button>'));
assert(html.indexOf('id="display-settings-toggle"') > html.indexOf('id="help-open"'));
assert(app.includes('elements.displaySettingsToggle.insertAdjacentElement("afterend", elements.fontPanel);'));
assert(app.includes('!event.target.closest(".font-panel") && !event.target.closest("#display-settings-toggle")'));
assert(app.includes('if (!elements.displaySettingsShell.classList.contains("display-collapsed")) setDisplaySettingsOpen(false);'));
assert(html.indexOf('id="reset-layout"') > html.indexOf('id="display-settings-body"'));
assert(css.includes(".settings-panel { position: relative; z-index: 30; grid-column: 1; grid-row: 1;"));
assert(css.includes(".font-panel { position: absolute; z-index: 60; top: calc(100% + 7px); right: 0;"));
assert(css.includes(".display-settings-shell.display-collapsed { display: none; }"));
assert(css.includes(".display-settings-trigger { min-height: 34px;") && css.includes("font-size: inherit;"), "top-right display settings text must match its sibling header buttons");
assert(css.includes(".settings-panel { position: relative; z-index: 30; grid-column: 1; grid-row: 1; align-self: start; overflow: visible; min-width: 0; height: 78px;"));
assert(html.includes('id="output-settings-toggle" class="mobile-heading-toggle" type="button" aria-expanded="true"'));
assert(css.includes(".mobile-heading-toggle { display: inline-flex;"));
assert(html.includes('class="output-settings-row"'));
assert(html.includes('<p class="output-edit-guidance">改行・ふりがな・コードの編集は、変換前で行うことをおすすめします。</p>'));
assert(css.includes(".output-edit-guidance { margin: 0 2px 4px;"));
assert(html.includes('class="output-quick-settings"'));
assert(css.includes(".output-settings-row { display: grid; grid-template-columns: max-content minmax(0, 1fr);"));
assert(css.includes(".output-settings-mobile:not([open]) { display: none; }"), "closed result settings must hide the complete settings frame");
assert(css.includes("@container (max-width: 720px)"), "result settings must respond to the resized result frame width");
assert(css.includes(".output-settings-row { grid-template-columns: minmax(0, 1fr); }"), "narrow result settings must stack without horizontal overflow");
assert(css.includes(".auxiliary-panel-heading { margin: -9px -12px 9px -10px;"));
assert(html.includes('<div class="output-column-headings" aria-hidden="true"><span>No.</span><span>変換後テキスト</span></div>'));
assert(css.includes(".output-column-headings { grid-column: 1 / -1; grid-row: 1; display: grid; grid-template-columns: subgrid;"));
assert(css.includes(".output-column-headings span:last-child { justify-items: start; padding-left: 1em; border-left: 1px solid var(--line); }"));
assert(html.includes('<div class="left-lower-stack">'));
assert(css.includes(".left-lower-stack { grid-column: 1; grid-row: 3; align-self: start; display: grid; gap: 12px;"));
assert(html.includes('<div class="right-lower-stack">'));
assert(css.includes(".right-lower-stack { grid-column: 2; grid-row: 3; align-self: start; display: grid; gap: 12px;"));
assert(css.includes(".final-card, .committed-card { min-width: 0; margin-top: 0; }"));
assert(css.includes(".status-support-panel { min-width: 0; margin: 0;"));
assert(css.includes(".correction-card { z-index: 10; grid-column: 1; grid-row: 2; transform: translateY(var(--correction-controls-offset, 0px)); }"));
assert(css.includes(".output-card .editor-shell { grid-template-rows: 1.45em minmax(0, 1fr); height: var(--result-editor-height); border-color: var(--result-line); }"));
assert(css.includes(".output-card { container-type: inline-size; grid-column: 2; grid-row: 2; }"));
assert(!css.includes(".committed-card { grid-column: 2; grid-row: 4;"));
assert(!app.includes("--settings-clearance"));

console.log("PASS: header wording and bracket-button text layout");
