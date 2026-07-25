"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const testDataApi = require("../js/test-data.js");

const historyEntry = {
  title: "song-001",
  inputText: "[C]入力",
  correctionText: "4",
  initialOutputText: "[|][C][----]入力[|]",
  idealOutputText: "[|][C]入力[|]",
  historyText: "[|][C]入力[|]",
  settings: {
    converter: {
      hyphenUnit: 4,
      measureCapacity: 8,
      hyphenSpacing: 4,
      shortFractionPrepose: 1,
      showContinuationChord: 0
    }
  }
};

const formatted = [
  "{c:4/4拍子　-：8分音符　>：アクセント　○：白玉}",
  "|[Bm7-5]---- ----|[C#][>--]歌詞[|]",
  "[N.C.][○][--]生き[--]たい[=]よ",
  "[C][----] [----][|]",
  "[C]-[G]歌詞　[Am]--[F]続き",
  "[Bm7-5]-[F#m7-5]",
  "[Am]歌詞　中の空白",
  "[C]English words stay here",
  "[(D)]----|"
].join("\n");
const stripped = [
  "{c:4/4拍子　-：8分音符　>：アクセント　○：白玉}",
  "[Bm7-5][C#]歌詞",
  "[N.C.]生きたいよ",
  "[C]",
  "[C][G]歌詞　[Am][F]続き",
  "[Bm7-5][F#m7-5]",
  "[Am]歌詞　中の空白",
  "[C]English words stay here",
  "[(D)]"
].join("\n");
assert.strictEqual(testDataApi.stripFormatting(formatted), stripped);
assert.strictEqual(
  testDataApi.titleForFileName("旅のゆくえ　(アニメ『狼と香辛料』OPテーマ)"),
  "旅のゆくえ"
);
assert.strictEqual(testDataApi.titleForFileName("曲名（Acoustic Ver.）"), "曲名（Acoustic Ver.）");
assert.strictEqual(testDataApi.titleForFileName("曲名【映画主題歌】"), "曲名");

const exported = testDataApi.create(historyEntry);
assert.strictEqual(exported.format, testDataApi.FORMAT);
assert.strictEqual(exported.version, 1);
assert.strictEqual(exported.input, historyEntry.inputText);
assert.strictEqual(exported.initialOutput, historyEntry.initialOutputText);
assert.strictEqual(exported.idealOutput, historyEntry.idealOutputText);
assert.strictEqual(exported.testInput, "[C]入力");
assert.deepStrictEqual(exported.settings, historyEntry.settings.converter);

const parsed = testDataApi.parse(JSON.stringify(exported));
const snapshot = testDataApi.toHistorySnapshot(parsed);
assert.strictEqual(snapshot.title, "song-001");
assert.strictEqual(snapshot.inputText, historyEntry.inputText);
assert.strictEqual(snapshot.testInputText, exported.testInput);
assert.strictEqual(snapshot.initialOutputText, historyEntry.initialOutputText);
assert.strictEqual(snapshot.idealOutputText, historyEntry.idealOutputText);
assert.deepStrictEqual(snapshot.settings.converter, historyEntry.settings.converter);

assert.throws(() => testDataApi.parse("{"), /JSON/);
assert.throws(
  () => testDataApi.parse(JSON.stringify({ format: testDataApi.FORMAT, version: 2 })),
  /対応していない/
);
assert.throws(
  () => testDataApi.validate({ format: testDataApi.FORMAT, version: 1, input: "", settings: {} }),
  /初期出力/
);

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
assert(html.includes('id="history-export-test"'));
assert(!html.includes('id="history-copy-test-input"'));
assert(html.includes('id="test-output-lock"'));
assert(html.includes('id="test-output-unlock"'));
assert(html.includes('data-history-preview-mode="input"'));
assert(html.includes('data-history-preview-mode="output"'));
assert(html.includes('data-history-preview-mode="score"'));
assert(html.includes('id="history-import-test"'));
assert(html.includes('id="history-import-file"'));
assert(
  html.indexOf("js/history.js") < html.indexOf("js/test-data.js")
  && html.indexOf("js/test-data.js") < html.indexOf("js/app.js"),
  "test data module must load after history and before app"
);
assert(css.includes(".history-footer { display: flex; flex-wrap: wrap;"));
assert(app.includes("downloadTestData(selectedHistoryEntry)"));
assert(app.includes("importTestDataFile(file)"));
assert(app.includes("同じテストデータの日時を更新し、使用履歴の先頭へ移動しました。"));
assert(app.includes('elements.testOutputLock.addEventListener("click", lockOutputAndCreateTestInput)'));
assert(app.includes('elements.testOutputUnlock.addEventListener("click", unlockTestOutput)'));
assert(app.includes("if (restoreTestLockedOutputs()) return;"));
assert(app.includes("elements.input.value = CBFTestData.stripFormatting(testLockedOutputText)"));
assert(!app.includes("function saveCompletedScoreAsTestHistory()"));
assert(app.includes("function setHistoryPreviewMode(mode)"));
assert(app.includes('elements.historyTextPreview.innerHTML = colorizeText(String(selectedHistoryEntry.inputText || ""))'));
assert(app.includes("setHistoryPreviewMode(historyPreviewMode)"));
assert(!app.includes('setHistoryPreviewMode("score")'));
assert(css.includes(".history-text-preview .syntax-bracket, .history-text-preview .syntax-chord"));

console.log("PASS: local test data export, validation and history import");
