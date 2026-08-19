"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const backupApi = require("../js/backup-data.js");
const reportApi = require("../js/issue-report.js");

const snapshot = {
  title: "song-001",
  inputText: "{title: song-001}\n[C]入力",
  correctionText: "4",
  rowAdoptionModes: ["adopt"],
  sourceLineIds: ["line-1", "line-2"],
  outputOverrides: { "line-2": "手動調整" },
  committedOutputText: "[|][C]確定[|]",
  historyText: "[|][C]入力[|]",
  initialOutputText: "[|][C][----]入力[|]",
  idealOutputText: "[|][C]入力[|]",
  settings: {
    converter: {
      hyphenUnit: 4,
      measureCapacity: 8,
      hyphenSpacing: 4,
      shortFractionPrepose: 1,
      showContinuationChord: 0
    },
    finalBarsThrough: true
  }
};

const report = reportApi.create(snapshot);
assert(report.includes("ChordWiki Bar Formatter 不具合報告"));
assert(report.includes("[変換前]"));
assert(report.includes(snapshot.inputText));
assert(report.includes(snapshot.idealOutputText));

const backup = backupApi.create(snapshot);
assert.strictEqual(backup.format, backupApi.FORMAT);
assert.strictEqual(backup.version, 1);
assert.strictEqual(backup.state.inputText, snapshot.inputText);
assert.deepStrictEqual(backup.state.outputOverrides, snapshot.outputOverrides);
assert.strictEqual(backupApi.titleForFileName("Sign （ドラマ『オレンジデイズ』主題歌）"), "Sign");
assert.strictEqual(backupApi.dateForFileName(new Date(2026, 7, 20, 12, 34, 56)), "20260820");
const parsedBackup = backupApi.parse(JSON.stringify(backup));
const restored = backupApi.toSnapshot(parsedBackup);
assert.strictEqual(restored.title, snapshot.title);
assert.strictEqual(restored.historyText, snapshot.historyText);
assert.deepStrictEqual(restored.settings, snapshot.settings);
assert.throws(() => backupApi.parse("{"), /JSON/);
assert.throws(
  () => backupApi.parse(JSON.stringify({ format: backupApi.FORMAT, version: 2 })),
  /対応していない/
);

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const entry = fs.readFileSync(path.join(root, "js", "entries", "main.js"), "utf8");
assert(html.includes('id="history-copy-report"'));
assert(html.includes('history-title-help'));
assert(html.includes('class="history-footer-actions"'));
assert(!html.includes('id="history-export-report"'));
assert(!html.includes('id="history-import-report"'));
assert(!html.includes('id="history-report-file"'));
assert(html.includes('id="history-export-backup"'));
assert(html.includes('id="history-import-backup"'));
assert(!html.includes("テストデータ"));
assert(!app.includes("CBFTestData"));
assert(!app.includes("テストデータ"));
assert(entry.includes('import "../backup-data.js"'));
assert(entry.includes('import "../issue-report.js"'));
assert(entry.indexOf('import "../history.js"') < entry.indexOf('import "../backup-data.js"'));
assert(entry.indexOf('import "../issue-report.js"') < entry.indexOf('await import("../app.js")'));
assert(css.includes(".history-header-action"));
assert(app.includes("CBFIssueReport.create(currentFileSnapshot())"));
assert(app.includes("downloadBackup(currentFileSnapshot())"));
assert(!app.includes("downloadIssueReport"));
assert(!app.includes("importIssueReportFile"));
assert(app.includes("importBackupFile(file)"));
assert(app.includes("const result = historyStore.saveHistory(snapshot);"));
assert(app.includes("内容を確認してから復元できます。"));

console.log("PASS: issue-report text and JSON backup import/export");
