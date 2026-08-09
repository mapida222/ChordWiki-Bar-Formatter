(function (root, factory) {
  const notation = typeof module === "object" && module.exports
    ? require("../parser/formatter-notation.js")
    : root.CBFFormatterNotation;
  const api = factory(notation);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CBFOldChordWikiRenderer = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function (notation) {
  "use strict";

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function decoratedText(value) {
    return Array.from(String(value), (character) => {
      const escaped = escapeHtml(character);
      const className = character === "♠" ? "cw-suit-spade"
        : character === "🔴" ? "cw-symbol-red-circle"
          : character === "♣" ? "cw-suit-club"
            : character === "♥" ? "cw-suit-heart"
              : character === "♦" ? "cw-suit-diamond" : "";
      return className ? `<span class="${className}">${escaped}</span>` : escaped;
    }).join("");
  }

  function isRhythmToken(value) {
    return notation.isRhythmToken(value);
  }

  function isSpacingBody(value) {
    return Boolean(value) && /^[\s\-=>≧○*]+$/u.test(value);
  }

  function decoratedUpper(tokens) {
    return tokens.map((token) => {
      if (token === "|") return `<span class="cw-bar-token" data-token-type="bar">${decoratedText(token)}</span>`;
      const rhythm = isRhythmToken(token);
      const className = rhythm ? "cw-rhythm-token" : "cw-code-token";
      const tokenType = rhythm ? "rhythm" : "chord";
      return `<span class="${className}" data-token-type="${tokenType}">${decoratedText(token)}</span>`;
    }).join(" ");
  }

  function decoratedBody(value, atLineStart = false, alignWithLeadingBoundary = false) {
    const alignedValue = alignWithLeadingBoundary ? String(value).replace(/^\s+(?=\|)/, "") : String(value);
    const characters = Array.from(alignedValue);
    return characters.map((character, index) => character === "|"
      ? `<span class="cw-body-bar-token${atLineStart && index === 0 ? " cw-bar-token-line-start" : ""}${characters[index - 1] === "-" && characters[index + 1] === "-" ? " cw-bar-between-hyphens" : ""}${characters[index + 1] && /[\-=>≧○*]/.test(characters[index + 1]) ? " cw-bar-before-rhythm" : ""}${characters[index + 1] && !/[\s\-=>≧○|*]/.test(characters[index + 1]) ? " cw-body-bar-token-before-text" : ""}" data-token-type="bar">|</span>`
      : decoratedText(character)).join("");
  }

  function renderBoundary(position, row = "body", atLineStart = false, beforeChord = false, beforeRhythm = false) {
    const classes = ["cw-boundary", `cw-boundary-${position}`, `cw-boundary-${row}`];
    if (atLineStart) classes.push("cw-boundary-line-start");
    if (beforeChord) classes.push("cw-boundary-before-chord");
    if (beforeRhythm) classes.push("cw-boundary-before-rhythm");
    return `<span class="${classes.join(" ")}" data-token-type="bar"><span>|</span></span>`;
  }

  function renderSegment(part, index, parts) {
    const hasTrailingBar = part.body.endsWith("|");
    const body = part.body;
    const hasTrailingUpperBar = Boolean(part.trailingUpperBar);
    const hasLeadingBar = part.upper[0] === "|";
    const upper = hasLeadingBar ? part.upper.slice(1) : part.upper;
    const classes = ["cw-segment"];
    if (hasLeadingBar) classes.push("cw-segment-has-leading-bar");
    if (hasTrailingBar) classes.push("cw-segment-has-trailing-bar");
    if (hasTrailingUpperBar) classes.push("cw-segment-has-trailing-upper-bar");
    if (upper.length) classes.push("cw-segment-has-upper");
    const beginsWithRhythm = Boolean(upper.length && isRhythmToken(upper[0]));
    const nextPart = parts[index + 1];
    const nextUpper = nextPart?.upper?.[0] === "|" ? nextPart.upper.slice(1) : nextPart?.upper || [];
    const nextBeginsWithRhythm = Boolean(nextUpper.length && isRhythmToken(nextUpper[0]));
    const leadingBar = hasLeadingBar ? renderBoundary("leading", "upper", index === 0, upper.some((token) => !isRhythmToken(token)), beginsWithRhythm) : "";
    const trailingUpperBar = hasTrailingUpperBar ? renderBoundary("trailing", "upper", false, false, nextBeginsWithRhythm) : "";
    const chord = upper.length ? `<span class="cw-chord">${decoratedUpper(upper)}</span>` : "";
    const bodySpan = body ? `<span class="cw-body">${decoratedBody(body, index === 0, hasLeadingBar)}</span>` : "";
    return `${leadingBar}<span class="${classes.join(" ")}">${chord}${bodySpan}</span>${trailingUpperBar}`;
  }

  function renderScoreSource(line) {
    const tokenPattern = /\[([^\[\]\r\n]*)\]/g;
    const parts = [];
    let cursor = 0;
    let upperTokens = [];
    let match;
    function append(body, upper = [], options = {}) {
      if (!body && !upper.length) return;
      parts.push({ body, upper: [...upper], ...options });
    }
    while ((match = tokenPattern.exec(line))) {
      const before = line.slice(cursor, match.index);
      const token = match[1];
      if (token === "|") {
        if (before || upperTokens.length) {
          append(before, upperTokens, { trailingUpperBar: true });
          upperTokens = [];
        } else {
          upperTokens.push(token);
        }
        cursor = match.index + match[0].length;
        continue;
      }
      if (before) {
        append(before, upperTokens);
        upperTokens = [];
      }
      upperTokens.push(token);
      cursor = match.index + match[0].length;
    }
    const remainder = line.slice(cursor);
    if (remainder || upperTokens.length) append(remainder, upperTokens);
    const hasLyrics = parts.some((part) => part.body && !/^[\s\-=>≧○|*]+$/.test(part.body));
    const lineClass = hasLyrics ? "cw-score-line cw-score-line-has-lyrics" : "cw-score-line";
    return `<p class="line ${lineClass}">${parts.map(renderSegment).join("")}</p>`;
  }

  function renderLine(line) {
    if (!line || line.kind === "hidden") return "";
    if (line.kind === "blank") return '<div class="cw-blank" aria-hidden="true">&nbsp;</div>';
    if (line.kind === "title") return `<div class="cw-title">${decoratedText(line.value)}</div>`;
    if (line.kind === "subtitle") return `<div class="cw-subtitle">${decoratedText(line.value)}</div>`;
    if (line.kind === "commentItalic") return `<p class="line cw-comment cw-comment-italic"><strong><i>${decoratedText(line.value)}</i></strong></p>`;
    if (line.kind === "comment") return `<p class="line cw-comment"><strong>${decoratedText(line.value)}</strong></p>`;
    if (line.kind === "key") return `<div class="cw-key">Key: ${decoratedText(line.value)}</div>`;
    if (line.kind === "link") return `<div class="cw-link"><a href="${escapeHtml(line.url)}" target="_blank" rel="noopener noreferrer nofollow">${decoratedText(line.label)}</a></div>`;
    if (line.kind === "score") return renderScoreSource(String(line.displaySource || ""));
    return `<div class="cw-text-line">${decoratedText(line.value || "")}</div>`;
  }

  function renderModel(model) {
    return (model?.lines || []).map(renderLine).join("");
  }

  function renderInto(element, model) {
    if (!element) return;
    const template = element.ownerDocument.createElement("template");
    template.innerHTML = renderModel(model);
    element.replaceChildren(template.content.cloneNode(true));
  }

  return { renderModel, renderInto, renderLine, renderScoreSource, escapeHtml, isRhythmToken, isSpacingBody };
}));
