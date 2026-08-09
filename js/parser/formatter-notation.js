(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CBFFormatterNotation = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const RHYTHM_PATTERN = /^[\s\-=>≧○*]+$/u;
  const NO_CHORD_PATTERN = /^N\.?C\.?$/iu;

  function isRhythmToken(value) {
    return value === "|" || RHYTHM_PATTERN.test(String(value || ""));
  }

  function isFormatterAnnotation(value) {
    const text = String(value || "");
    return text === "|" || isRhythmToken(text) || NO_CHORD_PATTERN.test(text);
  }

  function classifyAnnotation(value) {
    const text = String(value || "");
    if (text === "|") return "bar";
    if (isRhythmToken(text)) return "rhythm";
    if (NO_CHORD_PATTERN.test(text)) return "chord";
    return "annotation";
  }

  return { isRhythmToken, isFormatterAnnotation, classifyAnnotation };
}));
