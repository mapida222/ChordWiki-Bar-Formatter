(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? {
        adapter: require("./parser/chordwiki-adapter.js"),
        renderer: require("./renderer/old-chordwiki-renderer.js")
      }
    : { adapter: root.CBFChordWikiAdapter, renderer: root.CBFOldChordWikiRenderer };
  const api = factory(dependencies.adapter, dependencies.renderer);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ChordWikiPreview = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function (adapterFactory, renderer) {
  "use strict";

  let officialAdapter = null;

  function directive(line, names) {
    const match = line.match(/^\{([^:}]+):(.*)\}$/);
    return match && names.includes(match[1].trim().toLowerCase()) ? match[2] : null;
  }

  function legacyLine(line) {
    if (/^\s*#/.test(line)) return { kind: "hidden", reason: "comment", source: "legacy" };
    if (line === "") return { kind: "blank", source: "legacy" };
    const mappings = [
      ["title", ["title", "t"]], ["subtitle", ["subtitle", "st"]],
      ["commentItalic", ["comment_italic", "ci"]], ["comment", ["comment", "c"]], ["key", ["key"]]
    ];
    for (const [kind, names] of mappings) {
      const value = directive(line, names);
      if (value !== null) return { kind, value, source: "legacy" };
    }
    const link = line.match(/^\{(?:(?<label>[^>{}]+)>)?(?<url>https?:\/\/[^}]+)\}$/i);
    if (link) {
      const url = adapterFactory.safeUrl(link.groups.url);
      if (url) return { kind: "link", url, label: link.groups.label || link.groups.url, source: "legacy" };
    }
    if (/\[[^\[\]\r\n]*\]/.test(line)) return { kind: "score", displaySource: line, source: "legacy" };
    return { kind: "text", value: line, source: "legacy" };
  }

  function legacyModel(text) {
    return {
      parser: "legacy-compatibility",
      lines: String(text || "").replace(/\r\n?/g, "\n").split("\n").map(legacyLine)
    };
  }

  function configureParser(parseSong) {
    officialAdapter = adapterFactory.create(parseSong);
  }

  function parse(text) {
    if (!officialAdapter) return legacyModel(text);
    try {
      const sourceLines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
      const model = officialAdapter.parse(text);
      model.lines = model.lines.map((line, index) => {
        const legacy = legacyLine(sourceLines[index] || "");
        return line.kind === "text" && legacy.kind === "score" ? legacy : line;
      });
      return model;
    } catch (_error) {
      return legacyModel(text);
    }
  }

  function render(text) {
    return renderer.renderModel(parse(text));
  }

  function renderInto(element, text) {
    renderer.renderInto(element, parse(text));
  }

  return {
    configureParser,
    parse,
    render,
    renderInto,
    renderLine: renderer.renderLine,
    isRhythmToken: renderer.isRhythmToken,
    isSpacingBody: renderer.isSpacingBody
  };
}));
