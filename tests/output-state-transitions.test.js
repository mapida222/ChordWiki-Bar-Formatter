"use strict";

const assert = require("assert");
const overridesApi = require("../js/output-overrides.js");
global.window = global;
require("../js/converter.js");
const historyApi = require("../js/history.js");

const settings = {
  hyphenUnit: 4,
  measureCapacity: 8,
  hyphenSpacing: 4,
  shortFractionPrepose: 1,
  showContinuationChord: 0
};

let nextId = 0;
const createId = () => `state-line-${++nextId}`;

function makeState(inputText, overrides = {}) {
  const lineCount = inputText.split(/\r\n|\r|\n/).length;
  return {
    inputText,
    sourceLineIds: overridesApi.normalizeIds(lineCount, overrides.sourceLineIds, createId),
    rowAdoptionModes: [...(overrides.rowAdoptionModes || [])],
    outputOverrides: overridesApi.sanitize(overrides.outputOverrides),
    manualOutputLines: new Set(),
    convertedOutput: "",
    outputText: "",
    finalOutputText: ""
  };
}

function regenerate(state, nextSettings = settings, rowCorrections = []) {
  const result = CBFConverter.convertChordText(
    state.inputText,
    nextSettings,
    rowCorrections,
    [],
    [],
    state.rowAdoptionModes
  );
  state.convertedOutput = result.output;
  state.outputText = overridesApi.apply(state.convertedOutput, state.sourceLineIds, state.outputOverrides);
  state.finalOutputText = state.outputText;
  state.manualOutputLines = overridesApi.overriddenIndices(state.sourceLineIds, state.outputOverrides);
  return state;
}

function assertStable(state, message) {
  const result = overridesApi.validateState({
    lineCount: state.inputText.split(/\r\n|\r|\n/).length,
    sourceLineIds: state.sourceLineIds,
    rowAdoptionModes: state.rowAdoptionModes,
    outputOverrides: state.outputOverrides,
    manualOutputLines: state.manualOutputLines,
    convertedOutput: state.convertedOutput,
    outputText: state.outputText,
    finalOutputText: state.finalOutputText
  });
  assert.deepStrictEqual(result, { valid: true, errors: [] }, message);
}

function remapRows(state, previousInput, nextInput) {
  const previousLines = previousInput.split(/\r\n|\r|\n/);
  const nextLines = nextInput.split(/\r\n|\r|\n/);
  const mapping = CBFConverter.alignMusicLineIndices(previousLines, nextLines);
  state.inputText = nextInput;
  state.sourceLineIds = overridesApi.remapIds(mapping, state.sourceLineIds, createId);
  state.outputOverrides = overridesApi.prune(state.sourceLineIds, state.outputOverrides);
  state.rowAdoptionModes = mapping.map((previousIndex) => previousIndex >= 0 ? state.rowAdoptionModes[previousIndex] || "" : "");
  return mapping;
}

// 変換 → 直接編集 → 再変換: overrideは入力の行番号ではなく安定IDに残る。
{
  const state = regenerate(makeState("[C]one\n[G]two"));
  const edited = `${state.convertedOutput.split("\n")[0]}\n[G]manual\ncontinued`;
  state.outputOverrides = overridesApi.capture(
    state.convertedOutput,
    edited,
    state.sourceLineIds,
    CBFConverter.alignLineIndices
  );
  regenerate(state, { ...settings, hyphenSpacing: 0 });
  assert(state.finalOutputText.includes("[G]manual\ncontinued"));
  assertStable(state, "direct edit must survive reconversion");
}

// 変換 → 行削除 → 再変換: 削除行のoverrideは保存状態からも消える。
{
  const state = regenerate(makeState("[C]one\n[G]two\n[Am]three"));
  const edited = `${state.convertedOutput.split("\n")[0]}\n[G]manual\ncontinued\n${state.convertedOutput.split("\n")[2]}`;
  state.outputOverrides = overridesApi.capture(state.convertedOutput, edited, state.sourceLineIds, CBFConverter.alignLineIndices);
  const deletedId = state.sourceLineIds[1];
  const previousInput = state.inputText;
  remapRows(state, previousInput, "[C]one\n[Am]three");
  regenerate(state);
  assert(!Object.prototype.hasOwnProperty.call(state.outputOverrides, deletedId));
  assert(!state.finalOutputText.includes("manual"), "deleted row's manual output must not survive as an orphan");
  assertStable(state, "deleting a row must not leave orphan output state");
}

// 変換 → 行追加 → override適用: 既存IDを保ち、新規行だけ新IDになる。
{
  const state = regenerate(makeState("[C]one\n[G]two"));
  const previousInput = state.inputText;
  const mapping = remapRows(state, previousInput, "[C]one\n[G]two\n[Am]three");
  assert.deepStrictEqual(mapping, [0, 1, -1]);
  regenerate(state);
  const lines = state.convertedOutput.split("\n");
  const edited = [...lines.slice(0, 2), "[Am]added manually"].join("\n");
  state.outputOverrides = overridesApi.capture(state.convertedOutput, edited, state.sourceLineIds, CBFConverter.alignLineIndices);
  regenerate(state, { ...settings, hyphenUnit: 8 });
  assert(state.finalOutputText.includes("[Am]added manually"));
  assertStable(state, "added row override must follow its new stable ID");
}

// 行修正 → 設定変更: row mode、ID、修正結果は設定変更で別行へ移らない。
{
  const state = makeState("[C]one\n[G]two", { rowAdoptionModes: ["auto", "edit"] });
  regenerate(state, settings, ["4", "4"]);
  const idsBefore = [...state.sourceLineIds];
  regenerate(state, { ...settings, measureCapacity: 4 }, ["4", "4"]);
  assert.deepStrictEqual(state.sourceLineIds, idsBefore);
  assert.deepStrictEqual(state.rowAdoptionModes, ["auto", "edit"]);
  assertStable(state, "setting changes must preserve row correction ownership");
}

// 入力行そのものが変わった場合: 旧入力の手動出力を新入力へ流用しない。
{
  const state = regenerate(makeState("[C]old"));
  state.outputOverrides = { [state.sourceLineIds[0]]: { text: "[C]old manual", baseText: state.convertedOutput, suppressed: false } };
  regenerate(state);
  const previousInput = state.inputText;
  remapRows(state, previousInput, "[C]new");
  state.outputOverrides = overridesApi.prune(state.sourceLineIds, state.outputOverrides);
  state.outputOverrides = {};
  regenerate(state);
  assert(!state.finalOutputText.includes("old manual"));
  assertStable(state, "changed source text must not reuse a stale output override");
}

// 手動編集あり → 履歴保存 → 復元: 一覧のhistoryTextと復元後の表示を一致させる。
{
  const state = regenerate(makeState("[C]one\n[G]two"));
  state.outputOverrides = overridesApi.capture(
    state.convertedOutput,
    `${state.convertedOutput.split("\n")[0]}\n[G]restored manual`,
    state.sourceLineIds,
    CBFConverter.alignLineIndices
  );
  regenerate(state);
  const storage = new Map();
  const store = historyApi.createStore({
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key)
  }, () => 1700000000000);
  store.saveHistory({
    inputText: state.inputText,
    historyText: state.finalOutputText,
    sourceLineIds: state.sourceLineIds,
    rowAdoptionModes: state.rowAdoptionModes,
    outputOverrides: state.outputOverrides,
    settings
  });
  const entry = store.list()[0];
  const restored = regenerate(makeState(entry.inputText, entry), entry.settings);
  assert.strictEqual(restored.finalOutputText, entry.historyText);
  assertStable(restored, "history restore must reproduce the listed output");
}

console.log("PASS: output state transition invariants cover reconversion, row changes, settings, and history restore");
