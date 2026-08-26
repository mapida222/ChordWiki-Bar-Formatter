"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");

assert(html.includes('id="history-restore" class="history-restore-button" type="button" disabled>保存時の状態を復元</button>'));
assert(html.includes("保存時の状態を復元"));
["変換前", "行修正", "設定", "変換後", "確定譜面"].forEach((term) => {
  assert(html.includes(term), `履歴復元の説明に${term}が含まれる`);
});

const restoreStart = app.indexOf("function restoreHistoryWorkState(entry)");
const restoreEnd = app.indexOf("function clearHistoryPreview()", restoreStart);
assert(restoreStart >= 0 && restoreEnd > restoreStart, "history work-state restore function must exist");
const restoreBody = app.slice(restoreStart, restoreEnd);
assert(restoreBody.includes("restoreSnapshot(entry);"), "saved input, corrections, row modes and settings must be restored");
assert(app.includes("History restores work data and conversion options, not the current"), "history restore must preserve the current viewing environment");
assert(!app.includes("applyTheme(state.theme)"), "history restore must not replace the current theme");
assert(app.includes("sourceLineIds: [...sourceLineIds]"), "stable source IDs must be included in saved work state");
assert(app.includes("outputOverrides: CBFOutputOverrides.sanitize(outputOverrides)"), "manual output overrides must be included in saved work state");
assert(restoreBody.includes("const savedText = savedHistoryText(entry);"), "saved output must be restored when available");
const previewStart = app.indexOf("function historyPreviewText(entry)");
const previewEnd = app.indexOf("function restoreHistoryWorkState(entry)", previewStart);
assert(previewStart >= 0 && previewEnd > previewStart, "history preview function must exist");
assert(app.slice(previewStart, previewEnd).includes("savedHistoryText(entry)"), "history preview must use the shared saved output source");
assert(restoreBody.includes("elements.output.value = restoredText;"), "saved result text must be restored exactly");
assert(restoreBody.includes("elements.finalOutput.value = restoredText;"), "score text must follow the restored result");
assert(restoreBody.includes("updateEditorHighlight(elements.output);"), "restored output syntax overlay must match the saved result");
assert(restoreBody.includes("updateEditorHighlight(elements.finalOutput);"), "restored final-output syntax overlay must match the saved result");
assert(restoreBody.includes("manualOutputLines = new Set();"), "direct output edits must stay tracked after restoration");
assert(restoreBody.includes("CBFConverter.alignLineIndices(generatedLines, restoredLines)"));

assert(app.includes("restoreHistoryWorkState(selectedHistoryEntry);"));
assert(app.includes("現在の作業内容と設定を、履歴を保存した時の状態で上書きします。よろしいですか？"));
assert(app.includes("履歴を保存した時の作業状態を復元しました。"));
assert(app.includes("if (!elements.input.value.trim() || !elements.output.value.trim())"), "history must not save output without its source input");
assert(!app.includes("adoptHistoryAsInput"), "legacy output-to-input adoption must no longer be used");

const historyStore = fs.readFileSync(path.join(root, "js", "history.js"), "utf8");
assert(historyStore.includes("committedOutputText: snapshot.committedOutputText == null ? undefined : String(snapshot.committedOutputText)"));
assert(historyStore.includes("snapshot.committedOutputText != null ? { committedOutputText: String(snapshot.committedOutputText) }"));
assert(historyStore.includes("sourceLineIds: Array.isArray(snapshot.sourceLineIds) ? snapshot.sourceLineIds : []"));
assert(historyStore.includes("outputOverrides: snapshot.outputOverrides || {}"));

console.log("PASS: HISTORY-003 restores the complete saved work state");
