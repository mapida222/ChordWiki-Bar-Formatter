(function (root, factory) {
  const notation = typeof module === "object" && module.exports
    ? require("./formatter-notation.js")
    : root.CBFFormatterNotation;
  const api = factory(notation);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CBFChordWikiAdapter = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function (notation) {
  "use strict";

  const TAG_ALIASES = new Map([
    ["t", "title"], ["title", "title"],
    ["st", "subtitle"], ["subtitle", "subtitle"],
    ["c", "comment"], ["comment", "comment"],
    ["ci", "commentItalic"], ["comment_italic", "commentItalic"],
    ["key", "key"]
  ]);
  const MARKER_TAGS = new Map([
    ["soc", "※コーラス（ここから）"], ["start_of_chorus", "※コーラス（ここから）"],
    ["eoc", "※コーラス（ここまで）"], ["end_of_chorus", "※コーラス（ここまで）"],
    ["sot", "（タブ譜）"], ["start_of_tab", "（タブ譜）"],
    ["eot", ""], ["end_of_tab", ""]
  ]);
  const HIDDEN_TAGS = new Set(["define", "chord", "asin", "redirect", "youtube", "nicovideo", "mp3"]);

  function typeOf(value) {
    return value?.constructor?.name || "";
  }

  function safeUrl(value) {
    try {
      const url = new URL(String(value || ""));
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch (_error) {
      return "";
    }
  }

  function serializeScoreItems(items, identify = typeOf) {
    return items.map((item) => {
      const type = identify(item);
      if (type === "Bars") return item.annotation ? `[${item.text}]` : String(item.text || "");
      if (type === "LyricsWithChord") {
        const chord = item.chord ? `[${String(item.chord)}]` : "";
        return chord + String(item.lyrics || "");
      }
      if (type === "LyricsWithAnnotation") {
        const annotation = item.annotation == null ? "" : String(item.annotation);
        const token = annotation ? `[${annotation}]` : "";
        return token + String(item.lyrics || "");
      }
      return "";
    }).join("");
  }

  function scoreTokens(items, identify = typeOf) {
    const tokens = [];
    items.forEach((item) => {
      const type = identify(item);
      if (type === "Bars") {
        tokens.push({ kind: item.annotation ? "annotationBar" : "bar", value: String(item.text || "|") });
      } else if (type === "LyricsWithChord") {
        if (item.chord) tokens.push({ kind: "chord", value: String(item.chord) });
        if (item.lyrics) tokens.push({ kind: "lyrics", value: String(item.lyrics) });
      } else if (type === "LyricsWithAnnotation") {
        if (item.annotation != null) {
          const value = String(item.annotation);
          tokens.push({ kind: notation.classifyAnnotation(value), value });
        }
        if (item.lyrics) tokens.push({ kind: "lyrics", value: String(item.lyrics) });
      }
    });
    return tokens;
  }

  function tagLine(tag) {
    const name = String(tag.name || "").toLowerCase();
    const value = String(tag.value || "");
    const kind = TAG_ALIASES.get(name);
    if (kind) return { kind, value, source: "official" };
    if (MARKER_TAGS.has(name)) return { kind: "comment", value: MARKER_TAGS.get(name), source: "official" };
    if (HIDDEN_TAGS.has(name)) return { kind: "hidden", reason: `server-tag:${name}`, source: "official" };
    return { kind: "text", value: value ? `{${name}:${value}}` : `{${name}}`, source: "official" };
  }

  function adaptLine(line, identify = typeOf) {
    const type = identify(line);
    if (type === "BlankLine") return { kind: "blank", source: "official" };
    if (type === "CommentLine") return { kind: "hidden", reason: "comment", source: "official" };
    if (type === "SimpleLine" || type === "UnknownLine") {
      return { kind: "text", value: String(line.text || ""), source: "official" };
    }
    if (type !== "MarkUpLine") return { kind: "hidden", reason: "unknown-line", source: "official" };

    const items = Array.isArray(line.items) ? line.items : [];
    if (items.length === 1 && identify(items[0]) === "Tag") return tagLine(items[0]);
    if (items.length === 1 && identify(items[0]) === "URLTag") {
      const url = safeUrl(items[0].url);
      return url
        ? { kind: "link", url, label: String(items[0].label || items[0].url), source: "official" }
        : { kind: "text", value: String(items[0].label || items[0].url || ""), source: "official" };
    }
    const renderable = items.filter((item) => ["Bars", "LyricsWithChord", "LyricsWithAnnotation"].includes(identify(item)));
    if (renderable.length) {
      return {
        kind: "score",
        tokens: scoreTokens(renderable, identify),
        displaySource: serializeScoreItems(renderable, identify),
        source: "official"
      };
    }
    return { kind: "hidden", reason: "unsupported-markup", source: "official" };
  }

  function toPreviewModel(song, identify = typeOf) {
    return {
      parser: "@chordwiki/chordpro-parser",
      lines: (song?.lines || []).map((line) => adaptLine(line, identify))
    };
  }

  function create(parser) {
    const parseSong = typeof parser === "function" ? parser : parser?.parseSong;
    if (typeof parseSong !== "function") throw new TypeError("parseSong function is required");
    const exportedTypes = typeof parser === "object" && parser ? parser : {};
    const knownTypeNames = [
      "BlankLine", "CommentLine", "SimpleLine", "UnknownLine", "MarkUpLine",
      "URLTag", "Tag", "Bars", "LyricsWithChord", "LyricsWithAnnotation"
    ];
    const identify = (value) => {
      for (const name of knownTypeNames) {
        if (typeof exportedTypes[name] === "function" && value instanceof exportedTypes[name]) return name;
      }
      return typeOf(value);
    };
    return {
      parse(text) {
        return toPreviewModel(parseSong(String(text || "")), identify);
      },
      toPreviewModel(song) {
        return toPreviewModel(song, identify);
      }
    };
  }

  return { create, toPreviewModel, safeUrl, serializeScoreItems };
}));
