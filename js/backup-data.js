(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CBFBackupData = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const FORMAT = "chordwiki-bar-formatter-backup";
  const VERSION = 1;

  function text(value) {
    return value == null ? "" : String(value);
  }

  function titleForFileName(value) {
    const name = text(value).trim();
    const tieUp = /[（(【［\[][^）)】］\]]*(?:アニメ|映画|ドラマ|ゲーム|テレビ|TV|CM|OP|ED|主題歌|テーマ|挿入歌)[^）)】］\]]*[）)】］\]]/i;
    const match = tieUp.exec(name);
    return (match ? name.slice(0, match.index) : name).trim().replace(/[　\s\-‐–—・／\/]+$/u, "") || "backup";
  }

  function create(snapshot) {
    if (!snapshot || typeof snapshot !== "object") throw new Error("保存する作業内容がありません。");
    return {
      format: FORMAT,
      version: VERSION,
      name: text(snapshot.title).trim() || "名称未設定",
      exportedAt: new Date().toISOString(),
      state: {
        inputText: text(snapshot.inputText),
        correctionText: text(snapshot.correctionText),
        rowAdoptionModes: Array.isArray(snapshot.rowAdoptionModes) ? snapshot.rowAdoptionModes : [],
        sourceLineIds: Array.isArray(snapshot.sourceLineIds) ? snapshot.sourceLineIds : [],
        outputOverrides: snapshot.outputOverrides && typeof snapshot.outputOverrides === "object" ? snapshot.outputOverrides : {},
        committedOutputText: text(snapshot.committedOutputText),
        historyText: text(snapshot.historyText ?? snapshot.idealOutputText),
        initialOutputText: text(snapshot.initialOutputText),
        idealOutputText: text(snapshot.idealOutputText ?? snapshot.historyText),
        settings: snapshot.settings && typeof snapshot.settings === "object" ? snapshot.settings : {}
      }
    };
  }

  function validate(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("JSONの内容がバックアップではありません。");
    }
    if (value.format !== FORMAT || value.version !== VERSION) {
      throw new Error("対応していないバックアップ形式です。");
    }
    const state = value.state;
    if (!state || typeof state !== "object" || Array.isArray(state)) {
      throw new Error("バックアップに作業状態がありません。");
    }
    if (typeof state.inputText !== "string" || typeof state.correctionText !== "string") {
      throw new Error("バックアップの入力または行修正が不正です。");
    }
    if (!state.settings || typeof state.settings !== "object" || Array.isArray(state.settings)) {
      throw new Error("バックアップに変換設定がありません。");
    }
    return {
      format: FORMAT,
      version: VERSION,
      name: text(value.name).trim() || "名称未設定",
      exportedAt: text(value.exportedAt),
      state: {
        inputText: state.inputText,
        correctionText: state.correctionText,
        rowAdoptionModes: Array.isArray(state.rowAdoptionModes) ? state.rowAdoptionModes : [],
        sourceLineIds: Array.isArray(state.sourceLineIds) ? state.sourceLineIds : [],
        outputOverrides: state.outputOverrides && typeof state.outputOverrides === "object" ? state.outputOverrides : {},
        committedOutputText: text(state.committedOutputText),
        historyText: text(state.historyText),
        initialOutputText: text(state.initialOutputText),
        idealOutputText: text(state.idealOutputText),
        settings: state.settings
      }
    };
  }

  function parse(source) {
    let value;
    try {
      value = JSON.parse(String(source));
    } catch (_error) {
      throw new Error("JSONファイルを読み取れませんでした。");
    }
    return validate(value);
  }

  function toSnapshot(backup) {
    const value = validate(backup);
    return { title: value.name, ...value.state };
  }

  return { FORMAT, VERSION, titleForFileName, create, validate, parse, toSnapshot };
}));
