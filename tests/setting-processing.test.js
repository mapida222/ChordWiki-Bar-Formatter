"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(path.join(__dirname, "..", "js", "app.js"), "utf8");

// 変換設定は変換を行うが、hyphenSpacingは補正値を全再生成する必要がない。
assert(app.includes('"setting-hyphenSpacing", "setting-shortFractionPrepose"'));
assert(app.includes("schedulePrioritySettingConversion();"));

// 表示設定は変換イベントへ接続せず、必要な表示・保存処理だけを行う。
[
  'elements.theme.addEventListener("change", () => { applyTheme(elements.theme.value); publishScoreWindow(); markActivity(); });',
  'elements.fontSelect.addEventListener("change", () => { applyEditorFont(elements.fontSelect.value); updateFontCycleButtons(); publishScoreWindow(); markActivity(); });',
  'elements.plainEditBars.addEventListener("change", () => { persistFeatureSettings(); updateRenderedOutputs(); markActivity(); });',
  'elements.finalBarsThrough.addEventListener("change", () => { persistFeatureSettings(); renderFinalPreview(); markActivity(); });',
  'elements.previewTranspose.addEventListener("change", () => { syncPreviewControlMirrors(); updatePreviewTransposeButtons(); refreshGlobalKeySettings(); });',
  'elements.previewSpelling.addEventListener("change", () => { syncPreviewControlMirrors(); refreshGlobalKeySettings(); });'
].forEach((handler) => assert(app.includes(handler), `表示設定の処理経路が変わっています: ${handler}`));

// 手動出力がある場合も、設定変更でoverride層を消さない既存経路を維持する。
assert(app.includes("if (outputManuallyEdited && !force)"));
assert(app.includes("const layeredOutput = CBFOutputOverrides.apply(nextOutput, sourceLineIds, outputOverrides);"));

console.log("PASS: settings are separated into conversion, display, and persistence paths");
