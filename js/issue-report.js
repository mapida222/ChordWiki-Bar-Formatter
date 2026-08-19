(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CBFIssueReport = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const FORMAT = "chordwiki-bar-formatter-issue-report";
  const VERSION = 1;
  const HEADER = "ChordWiki Bar Formatter 不具合報告";
  const SECTIONS = ["設定", "変換前", "行修正", "初期出力", "変換後"];

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

  function readSections(source) {
    const normalized = text(source).replace(/\r\n?/g, "\n");
    const positions = SECTIONS.map((name) => ({ name, marker: `[${name}]`, index: normalized.indexOf(`[${name}]`) }))
      .filter((item) => item.index >= 0)
      .sort((left, right) => left.index - right.index);
    const result = {};
    positions.forEach((item, index) => {
      const contentStart = normalized.indexOf("\n", item.index) + 1;
      const contentEnd = index + 1 < positions.length ? positions[index + 1].index : normalized.length;
      result[item.name] = normalized.slice(contentStart, contentEnd).replace(/^\n+|\n+$/g, "");
    });
    return result;
  }

  function parse(source) {
    const normalized = text(source).replace(/\r\n?/g, "\n");
    if (!normalized.trim().startsWith(HEADER)) throw new Error("不具合報告用テキストではありません。");
    const format = normalized.match(/^format:\s*(\S+)\s*$/m)?.[1];
    const version = Number(normalized.match(/^version:\s*(\d+)\s*$/m)?.[1]);
    if (format !== FORMAT || version !== VERSION) throw new Error("対応していない不具合報告用テキスト形式です。");
    const sections = readSections(normalized);
    let settings = {};
    try {
      settings = sections["設定"] ? JSON.parse(sections["設定"]) : {};
    } catch (_error) {
      throw new Error("不具合報告の変換設定を読み取れませんでした。");
    }
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      throw new Error("不具合報告の変換設定が不正です。");
    }
    if (typeof sections["変換前"] !== "string" || typeof sections["初期出力"] !== "string") {
      throw new Error("不具合報告に変換前または初期出力がありません。");
    }
    return {
      format: FORMAT,
      version: VERSION,
      name: text(normalized.match(/^name:\s*(.*?)\s*$/m)?.[1]).trim() || "名称未設定",
      settings,
      input: sections["変換前"],
      corrections: sections["行修正"] || "",
      initialOutput: sections["初期出力"],
      idealOutput: sections["変換後"] || sections["初期出力"]
    };
  }

  function toHistorySnapshot(report) {
    const value = typeof report === "string" ? parse(report) : report;
    if (!value || value.format !== FORMAT || value.version !== VERSION) {
      throw new Error("不具合報告用テキストを解釈できませんでした。");
    }
    return {
      title: value.name,
      inputText: value.input,
      historyText: value.idealOutput,
      initialOutputText: value.initialOutput,
      idealOutputText: value.idealOutput,
      correctionText: value.corrections,
      settings: { converter: value.settings }
    };
  }

  return { FORMAT, VERSION, HEADER, titleForFileName, create, parse, toHistorySnapshot };
}));
