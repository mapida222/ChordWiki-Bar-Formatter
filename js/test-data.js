(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CBFTestData = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const FORMAT = "chordwiki-bar-formatter-test";
  const VERSION = 1;

  function text(value) {
    return value == null ? "" : String(value);
  }

  function stripFormatting(source) {
    const removed = "\uE000";
    return text(source).replace(/\r\n?/g, "\n").split("\n").map((line) => {
      if (/^\s*\{[^{}]*\}\s*$/.test(line)) return line;
      return line
        .replace(/\[([^\[\]\r\n]*)\]/g, (token, inner) => (
          /^[\s|=\-=>≧○*]+$/u.test(inner) ? removed : token
        ))
        .replace(/\][ \t　]*-+[ \t　]*\[/g, (between) => between.replace(/[ \t　]*-+[ \t　]*/g, removed))
        .replace(/\|/g, removed)
        .replace(/[-]{2,}/g, removed)
        .replace(/[=>≧○*]+/gu, removed)
        .replace(new RegExp(`[ \\t　]*${removed}(?:[ \\t　]*${removed})*[ \\t　]*`, "g"), "");
    }).join("\n");
  }

  function titleForFileName(value) {
    const name = text(value).trim();
    const tieUp = /[（(【［\[][^）)】］\]]*(?:アニメ|映画|ドラマ|ゲーム|テレビ|TV|CM|OP|ED|主題歌|テーマ|挿入歌)[^）)】］\]]*[）)】］\]]/i;
    const match = tieUp.exec(name);
    return (match ? name.slice(0, match.index) : name).trim().replace(/[　\s\-‐–—・／\/]+$/u, "") || "test-data";
  }

  function create(entry) {
    if (!entry || typeof entry !== "object") throw new Error("履歴を選択してください。");
    const idealOutput = text(entry.idealOutputText ?? entry.historyText);
    return {
      format: FORMAT,
      version: VERSION,
      name: text(entry.title).trim() || "名称未設定",
      exportedAt: new Date().toISOString(),
      settings: entry.settings?.converter || entry.settings || {},
      input: text(entry.inputText),
      testInput: text(entry.testInputText) || stripFormatting(idealOutput),
      corrections: text(entry.correctionText),
      initialOutput: text(entry.initialOutputText),
      idealOutput
    };
  }

  function validate(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("JSONの内容がテストデータではありません。");
    }
    if (value.format !== FORMAT || value.version !== VERSION) {
      throw new Error("対応していないテストデータ形式です。");
    }
    if (typeof value.input !== "string" || typeof value.initialOutput !== "string") {
      throw new Error("入力または初期出力がありません。");
    }
    if (!value.settings || typeof value.settings !== "object" || Array.isArray(value.settings)) {
      throw new Error("変換設定がありません。");
    }
    return {
      format: FORMAT,
      version: VERSION,
      name: text(value.name).trim() || "名称未設定",
      exportedAt: text(value.exportedAt),
      settings: value.settings,
      input: value.input,
      testInput: typeof value.testInput === "string" ? value.testInput : stripFormatting(text(value.idealOutput)),
      corrections: text(value.corrections),
      initialOutput: value.initialOutput,
      idealOutput: text(value.idealOutput)
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

  function toHistorySnapshot(testData) {
    const value = validate(testData);
    return {
      title: value.name,
      inputText: value.input,
      testInputText: value.testInput,
      historyText: value.idealOutput || value.initialOutput,
      initialOutputText: value.initialOutput,
      idealOutputText: value.idealOutput,
      correctionText: value.corrections,
      settings: { converter: value.settings }
    };
  }

  return { FORMAT, VERSION, stripFormatting, titleForFileName, create, validate, parse, toHistorySnapshot };
}));
