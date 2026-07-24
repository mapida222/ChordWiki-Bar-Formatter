"use strict";
const historyApi = require("../js/history.js");

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

let currentTime = Date.UTC(2026, 6, 14, 12, 0, 0);
const storage = new MemoryStorage();
const store = historyApi.createStore(storage, () => currentTime);
const snapshot = { inputText: "{title:履歴テスト}\n[C]歌詞", correctionText: "4", rowAdoptionModes: ["source"], settings: { converter: { hyphenUnit: "4" } } };

const first = store.saveHistory(snapshot);
if (!first.saved || first.entry.title !== "履歴テスト" || store.list().length !== 1) throw new Error("history save/title failed");
if (store.saveHistory(snapshot).saved || store.list().length !== 1) throw new Error("duplicate history was saved");

const convertedSnapshot = { ...snapshot, historyText: "{title:変換後履歴}\n[|][C][----]歌詞[|]" };
const converted = store.saveHistory(convertedSnapshot);
if (!converted.saved || converted.entry.historyText !== convertedSnapshot.historyText || converted.entry.title !== "変換後履歴") {
  throw new Error("converted history text was not preserved");
}
if (store.saveHistory({ ...convertedSnapshot, inputText: "別の変換前" }).saved) throw new Error("same converted history text was saved twice");

const legacyStorage = new MemoryStorage();
const legacyStore = historyApi.createStore(legacyStorage, () => currentTime);
const legacy = legacyStore.saveHistory({ historyText: "[|][C]旧履歴[|]" });
const enriched = legacyStore.saveHistory({
  historyText: "[|][C]旧履歴[|]",
  inputText: "[C]入力",
  initialOutputText: "[|][C][----]入力[|]",
  idealOutputText: "[|][C]旧履歴[|]",
  correctionText: "4",
  settings: { converter: { hyphenUnit: 4 } }
});
if (
  !legacy.saved
  || !enriched.saved
  || !enriched.enriched
  || legacyStore.list().length !== 1
  || enriched.entry.inputText !== "[C]入力"
  || enriched.entry.initialOutputText !== "[|][C][----]入力[|]"
) throw new Error("legacy history enrichment failed");

currentTime += 60 * 1000;
const testDataSnapshot = {
  ...snapshot,
  title: "song-001",
  historyText: "[|][C]理想[|]",
  testInputText: "[C]理想",
  initialOutputText: "[|][C][----]初期[|]",
  idealOutputText: "[|][C]理想[|]"
};
const testDataHistory = store.saveHistory(testDataSnapshot);
if (
  !testDataHistory.saved
  || testDataHistory.entry.title !== "song-001"
  || testDataHistory.entry.testInputText !== testDataSnapshot.testInputText
  || testDataHistory.entry.initialOutputText !== testDataSnapshot.initialOutputText
  || testDataHistory.entry.idealOutputText !== testDataSnapshot.idealOutputText
) throw new Error("test data fields were not preserved in history");

currentTime += 60 * 1000;
const changed = { ...snapshot, inputText: "タイトルなし" };
const second = store.saveHistory(changed);
if (!second.saved || store.list().length !== 4 || second.entry.title === "タイトルなし") throw new Error("changed history/fallback title failed");

store.saveCrash(changed);
const crash = store.getCrash();
if (crash?.inputText !== "タイトルなし") throw new Error("crash save failed");
if (crash?.rowAdoptionModes?.[0] !== "source") throw new Error("crash row adoption mode save failed");
if (!historyApi.shouldRestoreCrash(crash, changed, currentTime - 1)) throw new Error("current crash should restore");
if (historyApi.shouldRestoreCrash(crash, snapshot, currentTime + 1)) throw new Error("stale crash should not overwrite newer work");
store.clearCrash();
if (store.getCrash() !== null) throw new Error("crash clear failed");

store.clearHistory();
if (store.list().length !== 0 || storage.getItem(historyApi.HISTORY_KEY) !== null) throw new Error("history clear failed");
store.saveHistory(changed);

currentTime += historyApi.RETENTION_MS + 1;
if (store.list().length !== 0) throw new Error("retention pruning failed");
console.log("PASS: history deduplication, titles, crash recovery and 7-day pruning");
