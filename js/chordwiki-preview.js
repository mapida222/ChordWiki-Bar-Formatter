(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ChordWikiPreview = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
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
    return value === "|" || /^[\s\-=>≧○*]+$/.test(value);
  }

  function isSpacingBody(value) {
    return Boolean(value) && /^[\s\-=>竕ｧ笳・]+$/.test(value);
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

  function decoratedBody(value) {
    return Array.from(String(value), (character) => character === "|"
      ? '<span class="cw-body-bar-token" data-token-type="bar">|</span>'
      : decoratedText(character)).join("");
  }

  function renderBoundary(position, row = "body", atLineStart = false, modifier = "") {
    const classes = ["cw-boundary", `cw-boundary-${position}`, `cw-boundary-${row}`];
    if (atLineStart) classes.push("cw-boundary-line-start");
    if (modifier) classes.push(modifier);
    return `<span class="${classes.join(" ")}" data-token-type="bar"><span>|</span></span>`;
  }

  function renderSegment(part, index) {
    const hasTrailingBar = part.body.endsWith("|");
    const body = hasTrailingBar ? part.body.slice(0, -1) : part.body;
    const hasTrailingUpperBar = Boolean(part.trailingUpperBar);
    const hasLeadingBar = part.upper[0] === "|";
    const upper = hasLeadingBar ? part.upper.slice(1) : part.upper;
    const spacingBody = isSpacingBody(body);
    const shortRhythm = upper.length && spacingBody && body.trim().length <= 1;
    const plainRhythm = !upper.length && spacingBody;
    const classes = ["cw-segment"];
    if (hasLeadingBar) classes.push("cw-segment-has-leading-bar");
    if (hasTrailingBar) classes.push("cw-segment-has-trailing-bar");
    if (hasTrailingUpperBar) classes.push("cw-segment-has-trailing-upper-bar");
    if (upper.length) classes.push("cw-segment-has-upper");
    if (upper.length && spacingBody) classes.push("cw-segment-rhythm-spacing");
    if (shortRhythm) classes.push("cw-segment-short-rhythm");
    if (plainRhythm) classes.push("cw-segment-plain-rhythm");
    const leadingBar = hasLeadingBar ? renderBoundary("leading", "body", index === 0) : "";
    const boundaryModifier = shortRhythm ? "cw-boundary-after-short-rhythm"
      : plainRhythm ? "cw-boundary-after-plain-rhythm" : "";
    const trailingBar = hasTrailingBar ? renderBoundary("trailing", "body", false, boundaryModifier) : "";
    const trailingUpperBar = hasTrailingUpperBar ? renderBoundary("trailing", "upper") : "";
    const chord = upper.length ? `<span class="cw-chord">${decoratedUpper(upper)}</span>` : "";
    return `${leadingBar}<span class="${classes.join(" ")}">${chord}<span class="cw-body">${decoratedBody(body) || "&nbsp;"}</span></span>${trailingBar}${trailingUpperBar}`;
  }

  function renderScoreLine(line) {
    const tokenPattern = /\[([^\[\]\r\n]*)\]/g;
    const parts = [];
    let cursor = 0;
    let upperTokens = [];
    let match;

    function append(body, upper = [], options = {}) {
      if (!body && !upper.length) return;
      const barIndexes = Array.from(body.matchAll(/\|/g), (bar) => bar.index);
      if (!barIndexes.length) {
        parts.push({ body, upper: [...upper], ...options });
        return;
      }
      let start = 0;
      let segmentUpper = [...upper];
      barIndexes.forEach((barIndex, index) => {
        parts.push({
          body: body.slice(start, barIndex + 1),
          upper: segmentUpper,
          ...(index === barIndexes.length - 1 ? options : {})
        });
        segmentUpper = [];
        start = barIndex + 1;
      });
      if (start < body.length || segmentUpper.length) {
        parts.push({ body: body.slice(start), upper: segmentUpper, ...options });
      }
    }

    while ((match = tokenPattern.exec(line))) {
      let before = line.slice(cursor, match.index);
      if (!parts.length && !upperTokens.length && before === "|") {
        upperTokens.push("|");
        before = "";
      }
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

    return `<div class="cw-score-line">${parts.map(renderSegment).join("")}</div>`;
  }

  function directive(line, names) {
    const match = line.match(/^\{([^:}]+):(.*)\}$/);
    return match && names.includes(match[1].trim().toLowerCase()) ? match[2] : null;
  }

  function renderLine(line) {
    if (/^\s*#/.test(line)) return "";
    if (line === "") return '<div class="cw-blank" aria-hidden="true">&nbsp;</div>';

    const title = directive(line, ["title", "t"]);
    if (title !== null) return `<div class="cw-title">${decoratedText(title)}</div>`;
    const subtitle = directive(line, ["subtitle", "st"]);
    if (subtitle !== null) return `<div class="cw-subtitle">${decoratedText(subtitle)}</div>`;
    const commentItalic = directive(line, ["comment_italic", "ci"]);
    if (commentItalic !== null) return `<div class="cw-comment cw-comment-italic">${decoratedText(commentItalic)}</div>`;
    const comment = directive(line, ["comment", "c"]);
    if (comment !== null) return `<div class="cw-comment">${decoratedText(comment)}</div>`;
    const key = directive(line, ["key"]);
    if (key !== null) return `<div class="cw-key">Key: ${decoratedText(key)}</div>`;

    const rawLink = line.match(/^\{(https?:\/\/[^}]+)\}$/i);
    if (rawLink) {
      const url = escapeHtml(rawLink[1]);
      return `<div class="cw-link"><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></div>`;
    }
    const labeledLink = line.match(/^\{([^>{}]+)>(https?:\/\/[^}]+)\}$/i);
    if (labeledLink) {
      return `<div class="cw-link"><a href="${escapeHtml(labeledLink[2])}" target="_blank" rel="noopener noreferrer">${decoratedText(labeledLink[1])}</a></div>`;
    }
    if (/\[[^\[\]\r\n]*\]/.test(line)) return renderScoreLine(line);
    return `<div class="cw-text-line">${decoratedText(line)}</div>`;
  }

  function render(text) {
    const lines = String(text || "").replace(/\r\n?/g, "\n").split("\n");
    return lines.map(renderLine).join("");
  }

  function renderInto(element, text) {
    if (!element) return;
    element.innerHTML = render(text);
  }

  return { render, renderInto, renderLine, isRhythmToken, isSpacingBody };
}));
