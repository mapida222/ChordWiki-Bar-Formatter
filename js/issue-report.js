(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CBFIssueReport = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const FORMAT = "chordwiki-bar-formatter-issue-report";
  const VERSION = 1;
  const HEADER = "ChordWiki Bar Formatter 不具合報告";

  function text(value) {
    return value == null ? "" : String(value);
  }

  function titleForFileName(value) {
    const name = text(value).trim();
    const tieUp = /[（(【［\[][^）)】］\]]*(?:アニメ|映画|ドラマ|ゲーム|テレビ|TV|CM|OP|ED|主題歌|テーマ|挿入歌)[^）)】］\]]*[）)】］\]]/i;
    const match = tieUp.exec(name);
    return (match ? name.slice(0, match.index) : name).trim().replace(/[　\s\-‐–—・／\/]+$/u, "") || "issue-report";
  }

  function section(name, value) {
    return [`[${name}]`, text(value)].join("\n");
  }

  function create(entry) {
    if (!entry || typeof entry !== "object") throw new Error("報告する作業内容がありません。");
    const settings = entry.settings?.converter || entry.settings || {};
    const lines = [
      HEADER,
      `format: ${FORMAT}`,
      `version: ${VERSION}`,
      `createdAt: ${new Date().toISOString()}`,
      `name: ${text(entry.title).trim() || "名称未設定"}`,
      "",
      section("設定", JSON.stringify(settings, null, 2)),
      section("変換前", entry.inputText),
      section("行修正", entry.correctionText),
      section("初期出力", entry.initialOutputText),
      section("変換後", entry.idealOutputText ?? entry.historyText)
    ];
    return `${lines.join("\n\n").replace(/\n*$/, "")}\n`;
  }

  return { FORMAT, VERSION, HEADER, titleForFileName, create };
}));
