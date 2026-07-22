(function () {
  "use strict";
  const NOTE = "[A-G](?:##|bb|#|b|x)?";
  const CHORD_RE = new RegExp(`^(?:N\\.?C\\.?|${NOTE}(?:(?:maj|min|m|M|dim|aug|sus|add|omit|no)[A-Za-z0-9+#b()°oΔ-]*|[0-9+()°Δ-][A-Za-z0-9+#b()°oΔ-]*|o[0-9()]*)?(?:/${NOTE})?)$`);
  const LABEL_DEF_RE = /^\s*([A-Za-z]{2})\s*:\s*([0-9A-Za-z@^*%]*)\s+(.*)$/;
  const LABEL_REF_RE = /^\s*\{([A-Za-z]{2})\}\s*$/;
  const COPY_RE = /^\s*copy\s+([A-Za-z]{2})\s*->\s*([A-Za-z]{2})\s*$/i;
  const DIRECTIVE_RE = /^\s*\{[^{}:]+:.*\}\s*$/;

  function normalizeChordSymbol(content) {
    let value = content.trim().replaceAll("♯", "#").replaceAll("♭", "b").replaceAll("＃", "#").replaceAll("ｂ", "b");
    const parenthesized = value.startsWith("(") && value.endsWith(")");
    let inner = parenthesized ? value.slice(1, -1).trim() : value;
    const onMatch = inner.match(/^(.+?)\s+on\s+([A-G](?:##|bb|#|b|x)?)$/i);
    if (onMatch && isChordSymbol(onMatch[1], false) && !onMatch[1].includes("/")) inner = `${onMatch[1].trim()}/${onMatch[2]}`;
    return parenthesized ? `(${inner})` : inner;
  }

  function isChordSymbol(content, normalize = true) {
    let value = normalize ? normalizeChordSymbol(content) : content.trim();
    if (value.startsWith("(") && value.endsWith(")")) value = value.slice(1, -1).trim();
    value = value.replace(/↓+$/, "").trim();
    if (!value) return false;
    if (new RegExp(`^/${NOTE}$`).test(value)) return true;
    return CHORD_RE.test(value) || /^(?:Ger|Fr|It)\+6$|^N6$|^Cad(?:64|6\/4)$|^[#b♯♭]?[IViv]+[+°o]*[0-9]*(?:\/[0-9]+)?(?:\/[#b♯♭]?[IViv]+[+°o]*[0-9]*)?$/.test(value);
  }

  function parseTokens(line) {
    const tokens = [];
    let text = "";
    let index = 0;
    const hasAuthoredBar = line.includes("|");
    const flush = () => { if (text) { tokens.push({ kind: "text", value: text }); text = ""; } };
    const isValidRhythmRun = (value) => /^(?:[>≧]+|[>≧]*[-=]+)$/u.test(value);
    const followsChordOrRhythm = () => !text && ["chord", "hyphen"].includes(tokens[tokens.length - 1]?.kind);
    const precedesMusicBoundary = (end) => {
      let next = end;
      while (next < line.length && /[ \t　]/u.test(line[next])) next += 1;
      return line[next] === "|" || line[next] === "[";
    };
    while (index < line.length) {
      if (line.startsWith("[|]", index)) { flush(); tokens.push({ kind: "bar", value: "|" }); index += 3; continue; }
      const char = line[index];
      if (char === "[") {
        const end = line.indexOf("]", index + 1);
        if (end < 0) { text += char; index += 1; continue; }
        const content = line.slice(index + 1, end);
        flush();
        if (content === "|") tokens.push({ kind: "bar", value: "|" });
        else if (content && [...content].every((part) => "-=>≧ ".includes(part))) tokens.push({ kind: "hyphen", value: content });
        else if (isChordSymbol(content)) tokens.push({ kind: "chord", value: normalizeChordSymbol(content) });
        else tokens.push({ kind: "text", value: `[${content}]` });
        index = end + 1; continue;
      }
      if (char === "|") { flush(); tokens.push({ kind: "bar", value: "|" }); index += 1; continue; }
      if ("-=>≧".includes(char)) {
        let end = index;
        while (end < line.length && "-=>≧".includes(line[end])) end += 1;
        const run = line.slice(index, end);
        const manualBarRhythm = hasAuthoredBar && /^-+$/u.test(run);
        if (isValidRhythmRun(run) && (followsChordOrRhythm() || precedesMusicBoundary(end) || manualBarRhythm)) {
          flush(); tokens.push({ kind: "hyphen", value: run }); index = end; continue;
        }
        text += run; index = end; continue;
      }
      text += char; index += 1;
    }
    flush();
    return tokens;
  }

  function serializeTokens(tokens, settings) {
    return tokens.map((token) => {
      if (token.kind === "text") return token.value;
      if (token.kind === "chord") return `[${token.value}]`;
      if (token.kind === "bar") return "[|]";
      const spacing = settings.hyphenSpacing;
      if (/^-+$/.test(token.value) && spacing > 0 && token.value.length > spacing) {
        const chunks = [];
        for (let index = 0; index < token.value.length; index += spacing) chunks.push(`[${token.value.slice(index, index + spacing)}]`);
        return chunks.join("");
      }
      return `[${token.value}]`;
    }).join("");
  }

  const chordsOf = (tokens) => tokens.filter((token) => token.kind === "chord").map((token) => token.value);
  const hasChords = (tokens) => tokens.some((token) => token.kind === "chord");
  const hasHyphens = (tokens) => tokens.some((token) => token.kind === "hyphen");
  function splitTrailingCodeAnnotation(tokens) {
    const finalToken = tokens[tokens.length - 1];
    const previousToken = tokens[tokens.length - 2];
    if (finalToken?.kind !== "text" || previousToken?.kind !== "bar") return null;
    if (!/^[ \t　]{2,}[（(].+[）)]\s*$/u.test(finalToken.value)) return null;
    return { musicTokens: tokens.slice(0, -1), suffix: finalToken.value };
  }
  function isCodeOnly(tokens) {
    const annotation = splitTrailingCodeAnnotation(tokens);
    const musicTokens = annotation?.musicTokens || tokens;
    return hasChords(musicTokens) && musicTokens.every((token) => token.kind !== "text" || !token.value.replace(/\(\d+\s*\/\s*\d+\)/g, "").replace(/[\s.:：]/g, ""));
  }
  function encodeBeatValue(width) {
    if (width >= 0 && width <= 9) return String(width);
    if (width >= 10 && width <= 16) return String.fromCharCode("a".charCodeAt(0) + width - 10);
    if (width === 24) return "h";
    if (width === 32) return "i";
    return null;
  }
  function decodeBeatValue(character) {
    if (character === "@") return 0;
    if (/^[0-9]$/.test(character)) return Number(character);
    if (/^[a-g]$/i.test(character)) return character.toLowerCase().charCodeAt(0) - "a".charCodeAt(0) + 10;
    if (character.toLowerCase() === "h") return 24;
    if (character.toLowerCase() === "i") return 32;
    return null;
  }
  function beatCodeUnits(code) {
    const units = [];
    let modifiers = "";
    let pendingSync = false;
    const characters = [...code.trim()];
    for (let index = 0; index < characters.length; index += 1) {
      const character = characters[index];
      const previousUnit = units[units.length - 1];
      const previousPreviousUnit = units[units.length - 2];
      const suffixStar = character === "*" && !modifiers && previousUnit && previousPreviousUnit?.whiteNoteMarker && (index === characters.length - 1 || characters[index + 1] === "@");
      if (suffixStar) { previousUnit.suffixStar = true; continue; }
      const suffixNoBar = character.toLowerCase() === "x" && !modifiers && previousUnit;
      if (suffixNoBar) { previousUnit.noTrailingBar = true; continue; }
      if (character === "^" || character === "*" || character.toLowerCase() === "x") { modifiers += character.toLowerCase(); continue; }
      if (character.toLowerCase() === "s") {
        if (modifiers || !previousUnit || previousUnit.width <= 0 || previousUnit.syncAfter || previousUnit.whiteNoteMarker || previousUnit.halfNote || previousUnit.accents) return null;
        previousUnit.syncAfter = true;
        pendingSync = true;
        continue;
      }
      const width = decodeBeatValue(character);
      if (width === null) return null;
      const unit = { width, accents: (modifiers.match(/\^/g) || []).length, halfNote: modifiers.includes("*"), noLeadingBar: modifiers.includes("x"), noTrailingBar: false, whiteNoteMarker: character === "@", suffixStar: false, syncBefore: pendingSync, syncAfter: false };
      if (pendingSync && (unit.width <= 0 || unit.whiteNoteMarker || unit.halfNote || unit.accents)) return null;
      units.push(unit);
      pendingSync = false;
      modifiers = "";
    }
    return modifiers || pendingSync ? null : units;
  }
  function serializeBeatUnit(unit) {
    const value = encodeBeatValue(unit.width);
    if (value === null) return null;
    return `${unit.noLeadingBar ? "x" : ""}${"^".repeat(unit.accents || 0)}${unit.halfNote ? "*" : ""}${unit.whiteNoteMarker ? "@" : value}${unit.noTrailingBar ? "x" : ""}`;
  }
  function allSyncopatedCode(code) {
    const units = beatCodeUnits(code);
    if (!units || units.length < 2 || units.some((unit) => unit.whiteNoteMarker || unit.halfNote || unit.accents || unit.syncBefore || unit.syncAfter)) return null;
    const groups = units.map(serializeBeatUnit);
    if (groups.some((group) => group === null)) return null;
    return groups.map((group, index) => `${group}${index % 2 === 0 && index + 1 < groups.length ? "s" : ""}`).join("");
  }
  function expandedComparableUnits(code, slotCount) {
    const units = beatCodeUnits(String(code || ""));
    if (!units?.length) return null;
    if (units.length === 1 && slotCount > 1) return Array.from({ length: slotCount }, () => ({ ...units[0] }));
    return units.length === slotCount ? units : null;
  }
  function correctionUnitSignature(unit) {
    return [
      unit.width, unit.accents || 0, Boolean(unit.halfNote), Boolean(unit.noLeadingBar),
      Boolean(unit.noTrailingBar), Boolean(unit.whiteNoteMarker), Boolean(unit.suffixStar),
      Boolean(unit.syncBefore), Boolean(unit.syncAfter)
    ].join(":");
  }
  function correctionRhythmSignature(unit) {
    return [
      unit.width, unit.accents || 0, Boolean(unit.halfNote), Boolean(unit.whiteNoteMarker),
      Boolean(unit.suffixStar), Boolean(unit.syncBefore), Boolean(unit.syncAfter)
    ].join(":");
  }
  function leadingBarAndBody(interval) {
    if (interval.startsWith("[|]")) return { bar: "[|]", body: interval.slice(3) };
    if (interval.startsWith("|")) return { bar: "|", body: interval.slice(1) };
    return { bar: "", body: interval };
  }
  function renderedSlotIntervals(body) {
    const value = String(body || "");
    const starts = [];
    for (const match of value.matchAll(/\[([^\[\]\r\n]+)\]/g)) {
      if (match[1] !== "○" && !isChordSymbol(match[1])) continue;
      let start = match.index;
      if (start >= 3 && value.slice(start - 3, start) === "[|]") start -= 3;
      else if (start >= 1 && value[start - 1] === "|") start -= 1;
      starts.push(start);
    }
    if (!starts.length) return null;
    return {
      prefix: value.slice(0, starts[0]),
      intervals: starts.map((start, index) => value.slice(start, starts[index + 1] ?? value.length))
    };
  }
  function mergeCorrectionScope(currentBody, renderedBody, previousCode, nextCode, settings) {
    const current = renderedSlotIntervals(currentBody);
    const rendered = renderedSlotIntervals(renderedBody);
    if (!current || !rendered) return renderedBody;
    const previousUnits = expandedComparableUnits(previousCode, current.intervals.length);
    const nextUnits = expandedComparableUnits(nextCode, rendered.intervals.length);
    if (!previousUnits || !nextUnits) return renderedBody;

    const capacity = Math.max(1, Number(settings.measureCapacity) || 1) * 2;
    const fineWidth = (unit) => (unit.width * 2) + (unit.syncBefore ? 1 : 0) - (unit.syncAfter ? 1 : 0);
    if (current.intervals.length !== rendered.intervals.length) {
      const commonCount = Math.min(previousUnits.length, nextUnits.length);
      let commonPrefix = 0;
      while (commonPrefix < commonCount && correctionUnitSignature(previousUnits[commonPrefix]) === correctionUnitSignature(nextUnits[commonPrefix])) commonPrefix += 1;
      let preserveCount = 0;
      let cumulative = 0;
      for (let index = 0; index < commonPrefix; index += 1) {
        cumulative += fineWidth(previousUnits[index]);
        if (cumulative % capacity === 0) preserveCount = index + 1;
      }
      return current.prefix
        + current.intervals.slice(0, preserveCount).join("")
        + rendered.intervals.slice(preserveCount).join("");
    }
    const slotCount = rendered.intervals.length;

    const changed = [];
    for (let index = 0; index < slotCount; index += 1) {
      if (correctionUnitSignature(previousUnits[index]) !== correctionUnitSignature(nextUnits[index])) changed.push(index);
    }
    if (!changed.length) return currentBody;

    // Compare both ordinary and syncopated values on the finer (=) grid.
    // This lets the affected range stop at the first measure boundary where
    // the old and new cumulative positions meet again.
    const previousCumulative = [];
    const nextCumulative = [];
    previousUnits.forEach((unit, index) => {
      previousCumulative[index] = (previousCumulative[index - 1] || 0) + fineWidth(unit);
      nextCumulative[index] = (nextCumulative[index - 1] || 0) + fineWidth(nextUnits[index]);
    });

    const firstChanged = changed[0];
    const lastChanged = changed[changed.length - 1];
    let scopeStart = 0;
    for (let index = 0; index < firstChanged; index += 1) {
      if (previousCumulative[index] === nextCumulative[index] && previousCumulative[index] % capacity === 0) scopeStart = index + 1;
    }
    let scopeEnd = slotCount - 1;
    for (let index = lastChanged; index < slotCount; index += 1) {
      if (previousCumulative[index] === nextCumulative[index] && previousCumulative[index] % capacity === 0) {
        scopeEnd = index;
        break;
      }
    }

    // A trailing-bar modifier is rendered immediately before the next slot.
    // Include that slot so changing 4x can remove the following boundary.
    changed.forEach((index) => {
      if (previousUnits[index].noTrailingBar !== nextUnits[index].noTrailingBar) scopeEnd = Math.max(scopeEnd, Math.min(slotCount - 1, index + 1));
    });

    const intervals = current.intervals.map((interval, index) => {
      if (index < scopeStart || index > scopeEnd) return interval;
      const previousPosition = (previousCumulative[index - 1] || 0) % capacity;
      const nextPosition = (nextCumulative[index - 1] || 0) % capacity;
      if (previousPosition !== nextPosition || correctionRhythmSignature(previousUnits[index]) !== correctionRhythmSignature(nextUnits[index])) return rendered.intervals[index];
      const currentParts = leadingBarAndBody(interval);
      const renderedParts = leadingBarAndBody(rendered.intervals[index]);
      return renderedParts.bar + currentParts.body;
    });
    return (scopeStart === 0 ? rendered.prefix : current.prefix) + intervals.join("");
  }
  function expandedBeatCode(code, body) {
    const tokens = parseTokens(body);
    const chordCount = chordsOf(tokens).length;
    const whiteNoteCount = tokens.filter((token) => token.kind === "text" && token.value === "[○]").length;
    const units = beatCodeUnits(code);
    if (!units || units.length !== 1) return code;
    if (!whiteNoteCount) return chordCount > 1 ? code.repeat(chordCount) : code;
    let expanded = "";
    tokens.forEach((token, index) => {
      if (token.kind !== "chord") return;
      if (tokens[index + 1]?.kind === "text" && tokens[index + 1].value === "[○]") expanded += `@${code}`;
      else expanded += code;
    });
    return expanded;
  }
  function compactUniform(code) { return code && [...code].every((char) => char === code[0]) ? code[0] : code; }
  function beatMarker(width) { return `[${"-".repeat(width)}]`; }
  function beatMarkers(width, unit) { let result = ""; for (let offset = 0; offset < width; offset += unit) result += beatMarker(Math.min(unit, width - offset)); return result; }
  function visibleBeatMarker(unit, settings, preposeShort = false) {
    const symbol = unit.halfNote ? "=" : "-";
    let marker = symbol.repeat(unit.width);
    if (unit.accents) {
      const accent = unit.halfNote ? "≧" : ">";
      marker = accent.repeat(Math.min(unit.accents, unit.width)) + marker.slice(Math.min(unit.accents, unit.width));
    }
    const appendSuffix = (rendered) => unit.suffixStar ? rendered.replace(/\]$/, "*]") : rendered;
    const spacing = settings.hyphenSpacing;
    if (preposeShort && (symbol === "-" || !unit.accents) && spacing > 0 && unit.width > spacing && unit.width % spacing) {
      const shortWidth = unit.width % spacing;
      const chunks = [marker.slice(0, shortWidth)];
      for (let offset = shortWidth; offset < marker.length; offset += spacing) chunks.push(marker.slice(offset, offset + spacing));
      return appendSuffix(chunks.map((chunk) => `[${chunk}]`).join(""));
    }
    return appendSuffix(serializeTokens([{ kind: "hyphen", value: marker }], settings));
  }
  function visibleSyncopatedMarker(fineWidth, finePosition, settings) {
    let remaining = fineWidth;
    const chunks = [];
    if (finePosition % 2 && remaining > 0) {
      chunks.push("=");
      remaining -= 1;
    }
    const hyphenCount = Math.floor(remaining / 2);
    const trailingHalf = remaining % 2;
    const spacing = Math.max(0, Number(settings.hyphenSpacing) || 0);
    if (hyphenCount > 0) {
      if (spacing > 0) {
        for (let offset = 0; offset < hyphenCount; offset += spacing) chunks.push("-".repeat(Math.min(spacing, hyphenCount - offset)));
      } else chunks.push("-".repeat(hyphenCount));
    }
    if (trailingHalf) {
      if (chunks.length && chunks[0] !== "=") chunks[chunks.length - 1] += "=";
      else chunks.push("=");
    }
    return chunks.map((chunk) => `[${chunk}]`).join("");
  }

  function firstLyricSpan(value) {
    const english = value.match(/^[A-Za-z]+/);
    if (english) return english[0].length;
    const characters = [...value];
    const first = characters[0] || "";
    if (!/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(first)) return 0;
    let span = first.length;
    for (const character of [...value.slice(span)]) {
      if (!/\p{Mark}/u.test(character)) break;
      span += character.length;
    }
    return span;
  }

  function beatCountError(targetCount, specifiedCount) {
    const difference = specifiedCount - targetCount;
    if (difference < 0) return `行修正の指定が${Math.abs(difference)}個足りないため反映できません（修正対象${targetCount}か所／指定${specifiedCount}個）。`;
    if (difference > 0) return `行修正の指定が${difference}個多いため反映できません（修正対象${targetCount}か所／指定${specifiedCount}個）。`;
    return `行修正の指定を修正対象へ対応づけられないため反映できません（修正対象${targetCount}か所／指定${specifiedCount}個）。`;
  }

  function correctionBarAnchor(code) {
    const value = String(code || "").trim();
    const first = value.indexOf("|");
    if (first < 0) return null;
    if (first !== value.lastIndexOf("|")) return { ok: false, message: "行修正の小節頭記号|は1行に1個だけ指定してください。" };
    const before = value.slice(0, first);
    const after = value.slice(first + 1);
    const precedingUnits = before ? beatCodeUnits(before) : [];
    const followingUnits = after ? beatCodeUnits(after) : null;
    if (!precedingUnits?.length || !followingUnits?.length) return { ok: false, message: "|の前後に、コードへ適用する長さを指定してください。" };
    return { ok: true, forcedBarBeforeSlot: precedingUnits.length, fullCode: before + after };
  }

  function renderWithBeatCode(body, code, settings) {
    const anchor = correctionBarAnchor(code);
    if (anchor && !anchor.ok) return anchor;
    const forcedBarBeforeSlot = anchor?.forcedBarBeforeSlot ?? -1;
    const effectiveCode = anchor?.fullCode || code;
    const parsedSourceTokens = parseTokens(body);
    // Row corrections are the source of truth for both beat widths and bar positions.
    // Keeping bars from the automatically formatted body would force the old layout
    // (for example 8888) to survive after the user changes it to 8448.
    const sourceTokens = parsedSourceTokens.filter((token) => token.kind !== "hyphen" && token.kind !== "bar");
    const chordCount = chordsOf(sourceTokens).length;
    const whiteNoteCount = sourceTokens.filter((token) => token.kind === "text" && token.value === "[○]").length;
    const slotCount = chordCount + whiteNoteCount;
    let units = beatCodeUnits(effectiveCode);
    if (!units || !units.length) return { ok: false, message: "行修正値は数字（0～9）、長さ文字（a～i）、記号（^、*、@、x、s、|）で入力してください。nは行修正しない指定です。" };
    if (units.length === 1 && slotCount > 1) units = Array.from({ length: slotCount }, () => ({ ...units[0] }));
    if (units.length < slotCount) return { ok: false, message: beatCountError(slotCount, units.length) };

    const syncopated = units.some((unit) => unit.syncBefore || unit.syncAfter);
    const capacity = settings.measureCapacity * (syncopated ? 2 : 1);
    const parts = [];
    let chordIndex = 0;
    let position = 0;
    let musicStarted = false;
    let pendingBar = false;
    let suppressPendingBar = false;
    let suppressNextSourceBar = false;
    let trailingBarSuppressed = false;
    function appendDuration(unit, continuationChord = "", followingLyric = null) {
      let remaining = syncopated ? (unit.width * 2) + (unit.syncBefore ? 1 : 0) - (unit.syncAfter ? 1 : 0) : unit.width;
      if (remaining < 0) return;
      while (remaining > 0) {
        const available = capacity - position || capacity;
        const segmentWidth = Math.min(remaining, available);
        const boundaryFraction = position > 0 && position + segmentWidth === capacity;
        const rendered = syncopated
          ? visibleSyncopatedMarker(segmentWidth, position, settings)
          : visibleBeatMarker({ ...unit, width: segmentWidth, suffixStar: unit.suffixStar && remaining === segmentWidth }, settings, boundaryFraction);
        const spacingGrid = settings.hyphenSpacing > 0 ? settings.hyphenSpacing * (syncopated ? 2 : 1) : 0;
        const shortWidth = spacingGrid > 0 ? segmentWidth % spacingGrid : 0;
        const preposeWidths = syncopated ? [1, 2, 3, 4] : [1, 2];
        const lyricSpan = Boolean(settings.shortFractionPrepose) && !unit.halfNote && boundaryFraction && preposeWidths.includes(shortWidth) && followingLyric?.kind === "text"
          ? firstLyricSpan(followingLyric.value)
          : 0;
        if (lyricSpan) {
          const firstMarkerEnd = rendered.indexOf("]") + 1;
          parts.push(rendered.slice(0, firstMarkerEnd));
          parts.push(followingLyric.value.slice(0, lyricSpan));
          parts.push(rendered.slice(firstMarkerEnd));
          followingLyric.value = followingLyric.value.slice(lyricSpan);
        } else {
          parts.push(rendered);
        }
        position += segmentWidth;
        remaining -= segmentWidth;
        if (position === capacity) {
          if (remaining > 0) {
            parts.push("[|]");
            if (settings.showContinuationChord && continuationChord) parts.push(`[${continuationChord}]`);
            position = 0;
          } else {
            pendingBar = true;
            suppressPendingBar = unit.noTrailingBar;
          }
        }
      }
    }
    for (let tokenIndex = 0; tokenIndex < sourceTokens.length; tokenIndex += 1) {
      const token = sourceTokens[tokenIndex];
      if (token.kind === "bar") {
        const hasFollowingChord = sourceTokens.slice(tokenIndex + 1).some((remaining) => remaining.kind === "chord");
        const suppressBeforeNextChord = hasFollowingChord && units[chordIndex]?.noLeadingBar;
        const suppressThisBar = suppressBeforeNextChord || suppressNextSourceBar || suppressPendingBar;
        if (!suppressThisBar) parts.push("[|]");
        else if (!hasFollowingChord) trailingBarSuppressed = true;
        musicStarted = true;
        pendingBar = false;
        suppressPendingBar = false;
        suppressNextSourceBar = false;
        position = 0;
        continue;
      }
      if (token.kind !== "chord") {
        parts.push(token.value);
        if (token.kind === "text" && token.value === "[○]") {
          const unit = units[chordIndex++];
          if (!unit) return { ok: false, message: beatCountError(slotCount, units.length) };
          appendDuration(unit);
        }
        continue;
      }
      const unit = units[chordIndex++];
      if (!unit) return { ok: false, message: beatCountError(slotCount, units.length) };
      const forceAnchorBar = forcedBarBeforeSlot === chordIndex - 1;
      if (forceAnchorBar) {
        if (parts.length && parts[parts.length - 1] !== "[|]") parts.push("[|]");
        position = 0;
        musicStarted = true;
        pendingBar = false;
        suppressPendingBar = false;
        suppressNextSourceBar = false;
      }
      if (!musicStarted || pendingBar) {
        const suppressAnchoredInitialBar = Boolean(anchor) && !musicStarted;
        if (!suppressAnchoredInitialBar && !unit.noLeadingBar && !suppressPendingBar) parts.push("[|]");
        musicStarted = true;
        pendingBar = false;
        suppressPendingBar = false;
        position = 0;
      } else suppressNextSourceBar = false;
      parts.push(`[${token.value}]`);
      suppressNextSourceBar = unit.noTrailingBar;
      const followedByWhiteNote = sourceTokens[tokenIndex + 1]?.kind === "text" && sourceTokens[tokenIndex + 1].value === "[○]";
      if (unit.whiteNoteMarker) {
        if (!followedByWhiteNote) {
          parts.push("[○]");
          const remainingSourceSlots = sourceTokens.slice(tokenIndex + 1)
            .filter((remaining) => remaining.kind === "chord" || (remaining.kind === "text" && remaining.value === "[○]")).length;
          if (units.length - chordIndex > remainingSourceSlots) appendDuration(units[chordIndex++]);
        }
      } else if (!followedByWhiteNote) appendDuration(unit, token.value, sourceTokens[tokenIndex + 1]);
    }
    if (chordIndex !== units.length) return { ok: false, message: beatCountError(slotCount, units.length) };
    if (musicStarted && !trailingBarSuppressed && !suppressNextSourceBar && !suppressPendingBar && parts[parts.length - 1] !== "[|]") parts.push("[|]");
    return { ok: true, body: parts.join("") };
  }
  function compactBeatCode(counts, unit, capacity) {
    if (!counts.length) return "";
    const total = counts.reduce((sum, value) => sum + value, 0);
    const unitCode = encodeBeatValue(unit);
    const capacityCode = encodeBeatValue(capacity);
    if (total === 1) return capacityCode || "n";
    if (counts[counts.length - 1] === 1) return unitCode && capacityCode ? compactUniform(unitCode.repeat(total - 1) + capacityCode) : "n";
    return unitCode || "n";
  }

  function formatChordOnly(tokens, settings) {
    const unit = settings.hyphenUnit;
    const capacity = settings.measureCapacity;
    const chords = chordsOf(tokens);
    const parts = [];
    if (unit > capacity) {
      parts.push("[|]");
      chords.forEach((chord) => {
        parts.push(`[${chord}]`);
        for (let remaining = unit; remaining > 0; remaining -= capacity) {
          parts.push(beatMarker(Math.min(capacity, remaining)), "[|]");
        }
      });
      if (!chords.length) parts.push("[|]");
      return { body: parts.join(""), beatCode: encodeBeatValue(unit) || "n", target: true };
    }
    chords.forEach((chord, index) => {
      if (index === 0 || index % 2 === 0) parts.push("[|]");
      parts.push(`[${chord}]${beatMarkers(capacity, unit)}[|]`);
    });
    if (!chords.length) {
      parts.push("[|]");
    }
    const capacityCode = encodeBeatValue(capacity);
    const beatCode = capacityCode ? compactUniform(capacityCode.repeat(chords.length)) : "n";
    return { body: parts.join(""), beatCode, target: true };
  }

  function formatTimeline(tokens, settings, lyric) {
    const unit = settings.hyphenUnit;
    const capacity = settings.measureCapacity;
    const output = [{ kind: "bar", value: "|" }];
    let position = 0;
    let chordCount = 0;
    for (const token of tokens) {
      if (token.kind === "bar" || (!lyric && token.kind === "text")) continue;
      output.push(token);
      if (token.kind !== "chord") continue;
      chordCount += 1;
      let remaining = unit;
      while (remaining) {
        const width = Math.min(remaining, capacity - position);
        output.push({ kind: "hyphen", value: "-".repeat(width) });
        position += width; remaining -= width;
        if (position === capacity) { output.push({ kind: "bar", value: "|" }); position = 0; }
      }
    }
    if (position) output.push({ kind: "hyphen", value: "-".repeat(capacity - position) }, { kind: "bar", value: "|" });
    else if (output[output.length - 1].kind !== "bar") output.push({ kind: "bar", value: "|" });
    return { body: serializeTokens(output, settings), beatCode: (chordCount === 1 ? encodeBeatValue(capacity) : encodeBeatValue(unit)) || "n", target: true };
  }

  function closeLyricMeasure(measure, used, settings, forceVisible) {
    const unit = Math.min(settings.hyphenUnit, settings.measureCapacity);
    const chordCount = chordsOf(measure).length;
    const result = [];
    measure.forEach((token, index) => {
      result.push(token);
      if (token.kind !== "chord") return;
      const whiteNote = measure[index + 1]?.kind === "text" && measure[index + 1].value === "[○]";
      if (!whiteNote) result.push({ kind: "hyphen", value: "-".repeat(unit) });
      if (chordCount === 1 && !whiteNote) for (let width = Math.max(settings.measureCapacity - used, 0); width > 0; width -= unit) result.push({ kind: "hyphen", value: "-".repeat(Math.min(unit, width)) });
    });
    if (forceVisible && chordCount > 1) for (let width = Math.max(settings.measureCapacity - used, 0); width > 0; width -= unit) result.push({ kind: "hyphen", value: "-".repeat(Math.min(unit, width)) });
    result.push({ kind: "bar", value: "|" });
    return result;
  }

  function formatLyric(tokens, settings) {
    const unit = settings.hyphenUnit;
    if (settings.measureCapacity % unit) return formatTimeline(tokens, settings, true);
    const output = [];
    let measure = [];
    let used = 0;
    let open = false;
    const counts = [];
    let currentChords = 0;
    for (const token of tokens) {
      if (token.kind === "bar") {
        if (open) { output.push(...closeLyricMeasure(measure, used, settings, false)); counts.push(currentChords); measure = []; used = 0; currentChords = 0; open = false; }
        else output.push({ kind: "bar", value: "|" });
        continue;
      }
      if (token.kind !== "chord") { (open ? measure : output).push(token); continue; }
      if (open && used >= settings.measureCapacity) { output.push(...closeLyricMeasure(measure, used, settings, false)); counts.push(currentChords); measure = []; used = 0; currentChords = 0; open = false; }
      if (!open) {
        const lastBarIndex = output.findLastIndex((part) => part.kind === "bar");
        const lastChordIndex = output.findLastIndex((part) => part.kind === "chord");
        if (lastBarIndex < 0 || lastBarIndex < lastChordIndex) output.push({ kind: "bar", value: "|" });
        open = true;
      }
      measure.push(token); used += unit; currentChords += 1;
    }
    if (open) {
      const trailing = measure.filter((token) => token.kind === "text").map((token) => token.value).join("").trimEnd();
      output.push(...closeLyricMeasure(measure, used, settings, currentChords > 1 && used < settings.measureCapacity && !/[。！？!?\.」』）)\"]$/.test(trailing)));
      counts.push(currentChords);
    }
    let body = serializeTokens(output, settings);
    if (!body.includes("[----]")) body = body.replace(/([^\]\s　])(\[\|\])$/, "$1　$2");
    return { body, beatCode: compactBeatCode(counts, unit, settings.measureCapacity), target: true };
  }

  function rhythmWidth(token) {
    return token.kind === "hyphen" ? [...token.value].filter((character) => "-=>≧".includes(character)).length : 0;
  }

  function explicitRhythmAfterChord(tokens, chordIndex) {
    let width = 0;
    for (let index = chordIndex + 1; index < tokens.length; index += 1) {
      if (tokens[index].kind === "chord" || tokens[index].kind === "bar") break;
      width += rhythmWidth(tokens[index]);
    }
    return width;
  }

  function authoredSyncBoundary(tokens, previousChordIndex, chordIndex) {
    if (previousChordIndex < 0 || chordIndex <= previousChordIndex) return false;
    const between = tokens.slice(previousChordIndex + 1, chordIndex);
    if (between.some((token) => token.kind === "bar")) return false;
    const leftRhythm = between.filter((token) => token.kind === "hyphen").map((token) => token.value.replace(/ /g, "")).join("");
    const rightParts = [];
    for (let index = chordIndex + 1; index < tokens.length; index += 1) {
      if (tokens[index].kind === "chord" || tokens[index].kind === "bar") break;
      if (tokens[index].kind === "hyphen") rightParts.push(tokens[index].value.replace(/ /g, ""));
    }
    const rightRhythm = rightParts.join("");
    if (/[>≧]/.test(leftRhythm + rightRhythm) || !leftRhythm.endsWith("=") || !rightRhythm.startsWith("=")) return false;
    const fineWidth = (rhythm) => [...rhythm].reduce((sum, character) => sum + (character === "-" ? 2 : character === "=" ? 1 : 0), 0);
    return fineWidth(leftRhythm) % 2 === 1 && fineWidth(rightRhythm) % 2 === 1;
  }

  function moveDelayedRhythmAfterChord(tokens, measureCapacity = DEFAULT_SETTINGS.measureCapacity) {
    const output = [];
    let index = 0;
    while (index < tokens.length) {
      const token = tokens[index];
      if (token.kind !== "chord") {
        output.push(token);
        index += 1;
        continue;
      }
      let segmentEnd = index + 1;
      while (segmentEnd < tokens.length && !["chord", "bar"].includes(tokens[segmentEnd].kind)) segmentEnd += 1;
      const segment = tokens.slice(index + 1, segmentEnd);
      const delayedRhythmWidth = segment.reduce((sum, part) => sum + rhythmWidth(part), 0);
      output.push(token);
      if (segment[0]?.kind !== "hyphen" && delayedRhythmWidth > 0 && delayedRhythmWidth < measureCapacity) {
        output.push(...segment.filter((part) => part.kind === "hyphen"));
        output.push(...segment.filter((part) => part.kind !== "hyphen"));
      } else output.push(...segment);
      index = segmentEnd;
    }
    return output;
  }

  function formatManualRhythm(tokens, settings) {
    const unit = Math.min(settings.hyphenUnit, settings.measureCapacity);
    const capacity = settings.measureCapacity;
    const output = [];
    const durations = [];
    const durationByTokenIndex = new Map();
    const inferredRhythmByTokenIndex = new Map();
    const chordInfos = tokens.map((token, index) => token.kind === "chord"
      ? { index, explicitWidth: explicitRhythmAfterChord(tokens, index) }
      : null).filter(Boolean);
    chordInfos.forEach((info) => durationByTokenIndex.set(info.index, info.explicitWidth || unit));
    const initialTotal = chordInfos.reduce((sum, info) => sum + durationByTokenIndex.get(info.index), 0);
    const fourMeasureCapacity = capacity * 4;
    for (let infoIndex = chordInfos.length - 1; infoIndex >= 0; infoIndex -= 1) {
      const candidate = chordInfos[infoIndex];
      if (candidate.explicitWidth) continue;
      let followingTotal = 0;
      let followingExplicitCount = 0;
      for (let nextIndex = infoIndex + 1; nextIndex < chordInfos.length; nextIndex += 1) {
        const next = chordInfos[nextIndex];
        if (tokens.slice(candidate.index + 1, next.index).some((part) => part.kind === "bar")) break;
        followingTotal += durationByTokenIndex.get(next.index);
        if (next.explicitWidth) followingExplicitCount += 1;
      }
      const inferredWidth = capacity - followingTotal;
      const adjustedTotal = initialTotal - unit + inferredWidth;
      if (followingExplicitCount > 0 && inferredWidth > 0 && inferredWidth < unit
          && adjustedTotal >= fourMeasureCapacity && adjustedTotal % fourMeasureCapacity === 0) {
        durationByTokenIndex.set(candidate.index, inferredWidth);
        inferredRhythmByTokenIndex.set(candidate.index, "-".repeat(inferredWidth));
        break;
      }
    }
    let position = 0;
    let measureOpen = false;
    let previousChordTokenIndex = -1;
    tokens.forEach((token, index) => {
      if (token.kind === "bar") {
        output.push(token);
        position = 0;
        measureOpen = false;
        return;
      }
      if (token.kind !== "chord") {
        output.push(token);
        return;
      }
      const duration = durationByTokenIndex.get(index) || unit;
      const continuesAuthoredSync = authoredSyncBoundary(tokens, previousChordTokenIndex, index);
      if (!measureOpen || (!continuesAuthoredSync && (position >= capacity || (position > 0 && position + duration > capacity)))) {
        const lastBarIndex = output.findLastIndex((part) => part.kind === "bar");
        const lastChordIndex = output.findLastIndex((part) => part.kind === "chord");
        if (lastBarIndex < 0 || lastBarIndex < lastChordIndex) output.push({ kind: "bar", value: "|" });
        position = 0;
        measureOpen = true;
      }
      output.push(token);
      if (inferredRhythmByTokenIndex.has(index)) output.push({ kind: "hyphen", value: inferredRhythmByTokenIndex.get(index) });
      durations.push(duration);
      position += duration;
      previousChordTokenIndex = index;
    });
    if (output[output.length - 1]?.kind !== "bar") output.push({ kind: "bar", value: "|" });
    const encodedDurations = durations.map((duration) => encodeBeatValue(Math.min(duration, 32)));
    let beatCode = encodedDurations.every(Boolean) ? compactUniform(encodedDurations.join("")) : "n";
    const body = serializeTokens(output, settings);
    const inferredSyncCode = inferBeatCodeFromRenderedLine(body, beatCode, settings);
    if (inferredSyncCode?.includes("s")) beatCode = inferredSyncCode;
    return { body, beatCode, target: true, partial: true };
  }

  function isNoChordSymbol(value) {
    return /^N\.?C\.?$/i.test(String(value || "").replace(/[()]/g, ""));
  }

  function addContinuationChordsToManualRhythm(line, settings) {
    if (!settings.showContinuationChord) return String(line || "");
    const tokens = parseTokens(String(line || ""));
    const output = [];
    let measure = [];
    let continuationChord = "";
    function flushMeasure(bar = null) {
      const authoredChords = measure.filter((token) => token.kind === "chord");
      const hasRhythm = measure.some((token) => token.kind === "hyphen" && rhythmWidth(token) > 0);
      if (!authoredChords.length && hasRhythm && continuationChord) {
        const rhythmIndex = measure.findIndex((token) => token.kind === "hyphen");
        measure.splice(rhythmIndex < 0 ? 0 : rhythmIndex, 0, { kind: "chord", value: continuationChord });
      }
      output.push(...measure);
      if (authoredChords.length) {
        const lastChord = authoredChords[authoredChords.length - 1].value;
        continuationChord = isNoChordSymbol(lastChord) ? "" : lastChord;
      }
      if (bar) output.push(bar);
      measure = [];
    }
    tokens.forEach((token) => {
      if (token.kind === "bar") flushMeasure(token);
      else measure.push(token);
    });
    flushMeasure();
    return serializeTokens(output, settings);
  }

  function formatLine(line, settings) {
    const tokens = parseTokens(line);
    if (!hasChords(tokens)) return { body: line, beatCode: "", target: false };
    const annotation = splitTrailingCodeAnnotation(tokens);
    const musicTokens = annotation?.musicTokens || tokens;
    const result = hasHyphens(musicTokens)
      ? formatManualRhythm(moveDelayedRhythmAfterChord(musicTokens, settings.measureCapacity), settings)
      : isCodeOnly(musicTokens) ? formatChordOnly(musicTokens, settings) : formatLyric(musicTokens, settings);
    const body = suppressTrailingBarAfterParenthesizedFinalChord(result.body) + (annotation?.suffix || "");
    return { ...result, body };
  }
  function suppressTrailingBarAfterParenthesizedFinalChord(line) {
    const tokens = parseTokens(String(line || ""));
    const chords = tokens.filter((token) => token.kind === "chord");
    const finalChord = chords[chords.length - 1]?.value || "";
    if (!(finalChord.startsWith("(") && finalChord.endsWith(")"))) return line;
    return String(line).replace(/[ \t　]*(?:\[\|\]|\|)[ \t　]*$/, "");
  }
  function labelName(block, line) { return String.fromCharCode(97 + block % 26) + String.fromCharCode(97 + line % 26); }
  function alignLabels(lines) {
    const parsed = lines.map((line) => line.match(LABEL_DEF_RE));
    const width = Math.max(0, ...parsed.filter(Boolean).map((match) => `${match[1]}:${match[2]}`.length));
    return lines.map((line, index) => parsed[index] ? `${parsed[index][1]}:${parsed[index][2]}${" ".repeat(width - `${parsed[index][1]}:${parsed[index][2]}`.length + 1)}${parsed[index][3]}`.trimEnd() : line);
  }

  function summarizeLineNumbers(values) {
    const numbers = [...new Set((values || []).map(Number).filter((value) => Number.isInteger(value) && value > 0))].sort((left, right) => left - right);
    return numbers.join(",");
  }

  function authoredRhythmFineWidth(token) {
    if (token.kind !== "hyphen") return 0;
    return [...token.value].reduce((sum, character) => {
      if (character === "-" || character === ">") return sum + 2;
      if (character === "=" || character === "≧") return sum + 1;
      return sum;
    }, 0);
  }

  function analyzeAuthoredMeasureCapacity(inputText, configuredCapacity, targetMeter = "") {
    const configured = Number(configuredCapacity);
    if (!Number.isFinite(configured) || configured <= 0) return null;
    const candidates = [];
    let meterContext = "";
    String(inputText || "").split(/\r\n|\r|\n/).forEach((line, lineIndex) => {
      const meter = line.match(/(\d+(?:\s*\+\s*\d+)*)\s*\/\s*(\d+)\s*拍子/);
      if (DIRECTIVE_RE.test(line) && meter) {
        meterContext = meter[1].includes("+") ? "mixed" : `${Number(meter[1])}/${Number(meter[2])}`;
        return;
      }
      if (meterContext === "mixed") return;
      if (targetMeter && meterContext && meterContext !== targetMeter) return;
      const tokens = parseTokens(line);
      let measure = [];
      const inspectMeasure = () => {
        if (!measure.length) return;
        const text = measure.filter((token) => token.kind === "text").map((token) => token.value).join("");
        if (/\(\s*\d+\s*\/\s*\d+\s*\)/.test(text)) return;
        const chordIndices = measure.map((token, index) => token.kind === "chord" ? index : -1).filter((index) => index >= 0);
        if (!chordIndices.length) return;
        let fineWidth = 0;
        for (let chord = 0; chord < chordIndices.length; chord += 1) {
          const start = chordIndices[chord] + 1;
          const end = chordIndices[chord + 1] ?? measure.length;
          const chordWidth = measure.slice(start, end).reduce((sum, token) => sum + authoredRhythmFineWidth(token), 0);
          if (!chordWidth) return;
          fineWidth += chordWidth;
        }
        const lyricText = text.replace(/\(\s*\d+\s*\/\s*\d+\s*\)/g, "").replace(/[\s.:：]/g, "");
        candidates.push({ width: fineWidth / 2, line: lineIndex + 1, codeOnly: !lyricText });
      };
      tokens.forEach((token) => {
        if (token.kind === "bar") {
          inspectMeasure();
          measure = [];
        } else measure.push(token);
      });
    });
    if (!candidates.length) return null;
    const grouped = new Map();
    candidates.forEach((candidate) => {
      const key = String(candidate.width);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(candidate);
    });
    const ranked = [...grouped.values()].sort((left, right) => right.length - left.length || right[0].width - left[0].width);
    const dominant = ranked[0];
    if (ranked[1]?.length === dominant.length) return null;
    if (dominant.length / candidates.length <= 0.5) return null;
    if (dominant.length < 2 && !dominant.some((candidate) => candidate.codeOnly)) return null;
    const detected = dominant[0].width;
    if (detected === configured) return null;
    return {
      configured,
      detected,
      measureCount: dominant.length,
      candidateCount: candidates.length,
      percentage: Math.round((dominant.length / candidates.length) * 100),
      lineNumbers: [...new Set(dominant.map((candidate) => candidate.line))]
    };
  }

  function convertChordText(inputText, settings, rowCorrections = [], manualOutputLines = [], previousRowCorrections = [], rowModes = []) {
    const normalized = inputText.replace(/^\n+|\n+$/g, "");
    const lines = normalized ? normalized.split(/\r\n|\r|\n/) : [];
    const output = [];
    const warnings = [];
    const partialLines = [];
    const partialOutputIndices = new Set();
    const labels = new Map();
    let block = 0;
    let lineNumber = 0;
    let inBlankRun = false;
    lines.forEach((line, sourceIndex) => {
      if (!line) { output.push(""); if (!inBlankRun) { block += 1; lineNumber = 0; inBlankRun = true; } return; }
      inBlankRun = false;
      const copy = line.match(COPY_RE);
      if (copy) {
        const source = copy[1].toLowerCase(); const destination = copy[2].toLowerCase(); const found = labels.get(source);
        if (!found) { warnings.push(`UnknownLabelError: ${source}`); output.push(`UnknownLabelError: ${source}`); }
        else { labels.set(destination, { ...found, name: destination }); output.push(`${destination}:${found.beatCode} ${found.body}`); }
        return;
      }
      const reference = line.match(LABEL_REF_RE);
      if (reference) { const name = reference[1].toLowerCase(); const found = labels.get(name); if (!found) warnings.push(`UnknownLabelError: ${name}`); output.push(found ? found.body : `UnknownLabelError: ${name}`); return; }
      const definition = line.match(LABEL_DEF_RE);
      if (definition) { const name = definition[1].toLowerCase(); const result = formatLine(definition[3], settings); const beatCode = definition[2] || result.beatCode; labels.set(name, { name, beatCode, body: result.body }); output.push(`${name}:${beatCode} ${result.body}`.trimEnd()); return; }
      if (DIRECTIVE_RE.test(line)) { output.push(line); return; }
      const result = formatLine(line, settings);
      if (result.partial) {
        partialLines.push(sourceIndex + 1);
        partialOutputIndices.add(output.length);
      }
      if (result.target) output.push(`${labelName(block, lineNumber++)}:${result.beatCode} ${result.body}`.trimEnd());
      else output.push(result.body);
    });
    if (partialLines.length) {
      warnings.push(`部分対応：手動ハイフン表記を保持（${summarizeLineNumbers(partialLines)}行目／全${partialLines.length}行）`);
    }
    if (!warnings.length) warnings.push("Python版の基本整形処理を適用しました。");
    const correctionLines = [];
    const automaticCorrectionLines = [];
    const appliedCorrectionLines = [];
    const correctionSlotCounts = [];
    const authoredWhiteNoteCounts = [];
    const bodyLines = [];
    const correctionErrors = [];
    const correctionStates = [];
    alignLabels(output).forEach((line, outputIndex) => {
      const match = line.match(LABEL_DEF_RE);
      if (!match) {
        correctionLines.push("");
        automaticCorrectionLines.push("");
        appliedCorrectionLines.push("");
        correctionSlotCounts.push(0);
        authoredWhiteNoteCounts.push(0);
        correctionStates.push("none");
        bodyLines.push(line);
        return;
      }
      const automaticCode = expandedBeatCode(match[2], match[3]);
      automaticCorrectionLines.push(automaticCode);
      const automaticTokens = parseTokens(match[3]);
      const automaticSlotCount = chordsOf(automaticTokens).length + automaticTokens.filter((token) => token.kind === "text" && token.value === "[○]").length;
      correctionSlotCounts.push(beatCodeUnits(automaticCode)?.length || automaticSlotCount);
      authoredWhiteNoteCounts.push(automaticTokens.filter((token) => token.kind === "text" && token.value === "[○]").length);
      const displayedEnteredCode = (rowCorrections[outputIndex] || "").trim();
      const requestedMode = ["auto", "edit", "source"].includes(rowModes[outputIndex]) ? rowModes[outputIndex] : "";
      const useAutomatic = requestedMode === "auto";
      const useSource = requestedMode === "source";
      const enteredCode = useAutomatic || useSource ? "" : partialOutputIndices.has(outputIndex) && displayedEnteredCode === automaticCode
        ? ""
        : displayedEnteredCode;
      const displayedCode = displayedEnteredCode || automaticCode;
      const previousCode = (previousRowCorrections[outputIndex] || "").trim();
      let appliedCode = enteredCode ? (previousCode || automaticCode) : automaticCode;
      const manualBody = !useAutomatic && !useSource && typeof manualOutputLines[outputIndex] === "string" ? manualOutputLines[outputIndex] : null;
      let renderedBody = manualBody ?? match[3];
      if (enteredCode.toLowerCase() === "n") appliedCode = "n";
      else if (enteredCode) {
        const effectiveCode = enteredCode.toLowerCase() === "s" ? allSyncopatedCode(automaticCode) : enteredCode;
        if (!effectiveCode) correctionErrors.push({ line: outputIndex + 1, message: "この行は全シンコペーションへ自動展開できません。4s4のように個別指定してください。" });
        else {
          // When this line was edited in the output, retain its lyrics/chords and
          // rebuild only rhythm and bar placement from the row correction.
          // The row code owns white-note markers when it is explicitly edited.
          // Rebuild them from @ so a later row edit can add or remove [○].
          const anchoredCorrection = enteredCode.includes("|");
          const rowEditSource = anchoredCorrection ? renderedBody : renderedBody.replaceAll("[○]", "");
          const rendered = renderWithBeatCode(rowEditSource, effectiveCode, settings);
          if (rendered.ok) {
            renderedBody = manualBody && previousCode && previousCode !== enteredCode && !anchoredCorrection && !previousCode.includes("|")
              ? mergeCorrectionScope(manualBody, rendered.body, previousCode, enteredCode, settings)
              : rendered.body;
            appliedCode = enteredCode;
          }
          else correctionErrors.push({ line: outputIndex + 1, message: rendered.message });
        }
      }
      renderedBody = suppressTrailingBarAfterParenthesizedFinalChord(renderedBody);
      if (partialOutputIndices.has(outputIndex) && manualBody === null) {
        renderedBody = addContinuationChordsToManualRhythm(renderedBody, settings);
      }
      if (useSource) renderedBody = lines[outputIndex] ?? renderedBody;
      correctionLines.push(displayedCode);
      appliedCorrectionLines.push(appliedCode);
      correctionStates.push(useSource ? "source" : useAutomatic ? "auto" : (requestedMode === "edit" || enteredCode || manualBody !== null) ? "edit" : "auto");
      bodyLines.push(renderedBody);
    });
    const groupedCorrectionErrors = new Map();
    correctionErrors.forEach(({ line, message }) => {
      if (!groupedCorrectionErrors.has(message)) groupedCorrectionErrors.set(message, []);
      groupedCorrectionErrors.get(message).push(line);
    });
    groupedCorrectionErrors.forEach((errorLines, message) => {
      warnings.push(`行修正エラー（${summarizeLineNumbers(errorLines)}行目）：${message}`);
    });
    return { output: bodyLines.join("\n"), corrections: correctionLines.join("\n"), automaticCorrections: automaticCorrectionLines.join("\n"), appliedCorrections: appliedCorrectionLines.join("\n"), correctionSlotCounts, authoredWhiteNoteCounts, correctionStates, correctionErrors, warnings: [...new Set(warnings)], settings, rowCorrections };
  }

  function removeSelectedLyricHyphens(tokens, selectedCounts) {
    if (!selectedCounts.length || selectedCounts.includes(0) || isCodeOnly(tokens)) return { tokens: [...tokens], removedHyphens: 0, changedMeasures: 0 };
    const selected = new Set(selectedCounts);
    const measures = [];
    let current = [];
    tokens.forEach((token) => {
      current.push(token);
      if (token.kind === "bar") { measures.push(current); current = []; }
    });
    if (current.length) measures.push(current);

    const output = [];
    let removedHyphens = 0;
    let changedMeasures = 0;
    measures.forEach((measure) => {
      const chordCount = chordsOf(measure).length;
      const lyricCharacterCount = measure.reduce((count, token) => {
        if (token.kind !== "text") return count;
        const lyric = token.value.replaceAll("[○]", "").replace(/[\s　]/gu, "");
        return count + [...lyric].length;
      }, 0);
      const isClosedMeasure = measure[measure.length - 1]?.kind === "bar";
      const hasSingleLyricCharacter = isClosedMeasure && lyricCharacterCount === 1;
      const hasWhiteNote = measure.some((token) => token.kind === "text" && token.value === "[○]");
      const hasExpressiveRhythm = measure.some((token) => {
        if (token.kind === "hyphen") return /[=>≧＝＞]/u.test(token.value);
        return token.kind === "text" && /^\[[\-=>≧＝＞ ]*[=>≧＝＞][\-=>≧＝＞ ]*\]$/u.test(token.value);
      });
      const hyphenIndices = new Set(measure.map((token, index) => token.kind === "hyphen" ? index : -1).filter((index) => index >= 0));
      const removable = new Set();
      const signatures = [];
      let validGroups = 0;
      let lyricsFollowEveryGroup = true;
      const hasOrphanRhythm = measure.some((token, tokenIndex) => {
        if (token.kind !== "hyphen" || measure[tokenIndex - 1]?.kind === "hyphen") return false;
        return measure[tokenIndex - 1]?.kind !== "chord";
      });
      let index = 0;
      while (index < measure.length) {
        if (measure[index].kind !== "chord") { index += 1; continue; }
        const groupStart = index + 1;
        let groupEnd = groupStart;
        while (groupEnd < measure.length && measure[groupEnd].kind === "hyphen") groupEnd += 1;
        if (groupEnd === groupStart) { index += 1; continue; }
        const group = measure.slice(groupStart, groupEnd);
        const widths = group.map((token) => token.value.replace(/ /g, "").length);
        const pureHyphens = group.every((token) => /^-+$/.test(token.value.replace(/ /g, "")));
        const selectedAsChunks = widths.every((width) => selected.has(width));
        const totalWidth = widths.reduce((sum, width) => sum + width, 0);
        const selectedAsTotal = selected.has(totalWidth);
        const uniform = new Set(widths).size === 1;
        if (pureHyphens && (selectedAsChunks || selectedAsTotal)) {
          if (selectedAsTotal && group.length > 1) signatures.push(totalWidth);
          else if (selectedAsChunks && uniform) signatures.push(widths[0]);
          else if (selectedAsTotal) signatures.push(totalWidth);
          else { index = groupEnd; continue; }
          validGroups += 1;
          for (let removalIndex = groupStart; removalIndex < groupEnd; removalIndex += 1) removable.add(removalIndex);
          let nextMusic = groupEnd;
          while (nextMusic < measure.length && !["chord", "bar"].includes(measure[nextMusic].kind)) nextMusic += 1;
          const hasFollowingLyrics = measure.slice(groupEnd, nextMusic).some((token) => token.kind === "text" && token.value.trim());
          lyricsFollowEveryGroup &&= hasFollowingLyrics;
        }
        index = groupEnd;
      }
      const allHyphensSelected = removable.size === hyphenIndices.size && [...removable].every((indexValue) => hyphenIndices.has(indexValue));
      const measureRhythmWidth = measure.reduce((sum, token) => sum + rhythmWidth(token), 0);
      const uniformAttachedFourFour = measureRhythmWidth === 8 && !hasOrphanRhythm && validGroups === chordCount
        && allHyphensSelected && new Set(signatures).size === 1 && signatures[0] === 4;
      const mixedCompleteEightBeat = selected.size === 1 && selected.has(4) && measureRhythmWidth === 8 && !uniformAttachedFourFour;
      // With three or more chord changes in one measure, the rhythm markers are
      // needed to show where each change occurs, even when their widths match a
      // selected removal target.
      const shouldRemove = chordCount < 3 && !hasSingleLyricCharacter && !hasWhiteNote && !hasExpressiveRhythm && !mixedCompleteEightBeat && chordCount >= 1 && validGroups === chordCount && removable.size > 0 && allHyphensSelected && new Set(signatures).size === 1 && lyricsFollowEveryGroup;
      if (shouldRemove) changedMeasures += 1;
      measure.forEach((token, tokenIndex) => {
        if (shouldRemove && removable.has(tokenIndex)) removedHyphens += token.value.replace(/ /g, "").length;
        else output.push(token);
      });
    });
    return { tokens: output, removedHyphens, changedMeasures };
  }

  function padShortTrailingLyric(tokens) {
    const padded = [...tokens];
    const finalBarIndex = padded.length - 1;
    if (finalBarIndex < 0 || padded[finalBarIndex].kind !== "bar") return padded;
    let lastChordIndex = -1;
    for (let index = finalBarIndex - 1; index >= 0; index -= 1) {
      if (padded[index].kind === "chord") { lastChordIndex = index; break; }
      if (padded[index].kind === "bar") break;
    }
    if (lastChordIndex < 0) return padded;
    const trailingTokens = padded.slice(lastChordIndex + 1, finalBarIndex);
    if (trailingTokens.some((token) => token.kind === "hyphen")) return padded;
    const trailingText = trailingTokens.filter((token) => token.kind === "text").map((token) => token.value).join("");
    if (!trailingText || /\s$/u.test(trailingText)) return padded;
    if ([...trailingText].length <= 2) padded.splice(finalBarIndex, 0, { kind: "text", value: "　" });
    return padded;
  }

  function restoreShortFractionMeasureTail(tokens, selectedCounts) {
    if (!selectedCounts.includes(4) || selectedCounts.includes(0) || isCodeOnly(tokens)) return [...tokens];
    const output = [];
    let measure = [];
    const flush = () => {
      const chordIndices = measure.map((token, index) => token.kind === "chord" ? index : -1).filter((index) => index >= 0);
      if (chordIndices.length === 2) {
        const attachedWidths = chordIndices.map((chordIndex) => {
          let width = 0;
          for (let index = chordIndex + 1; index < measure.length && measure[index].kind === "hyphen"; index += 1) width += rhythmWidth(measure[index]);
          return width;
        });
        const isThreePlusOne = attachedWidths[0] === 3 && attachedWidths[1] === 1;
        const hasOtherRhythm = measure.some((token, index) => token.kind === "hyphen" && !chordIndices.some((chordIndex) => {
          let attachedIndex = chordIndex + 1;
          while (attachedIndex < measure.length && measure[attachedIndex].kind === "hyphen") {
            if (attachedIndex === index) return true;
            attachedIndex += 1;
          }
          return false;
        }));
        if (isThreePlusOne && !hasOtherRhythm) {
          const finalChordIndex = chordIndices[1];
          let textIndex = finalChordIndex + 1;
          while (textIndex < measure.length && measure[textIndex].kind === "hyphen") textIndex += 1;
          const lyricToken = measure[textIndex];
          if (lyricToken?.kind === "text" && [...lyricToken.value].length >= 2) {
            const characters = [...lyricToken.value];
            measure.splice(textIndex, 1,
              { kind: "text", value: characters[0] },
              { kind: "hyphen", value: "----" },
              { kind: "text", value: characters.slice(1).join("") });
          }
        }
      }
      output.push(...measure);
      measure = [];
    };
    tokens.forEach((token) => {
      measure.push(token);
      if (token.kind === "bar") flush();
    });
    if (measure.length) flush();
    return output;
  }

  function serializeCodeOnlyTokens(tokens, hyphenSpacing) {
    const spacing = Number(hyphenSpacing) || 0;
    const output = [];
    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index];
      if (token.kind === "chord") { output.push(`[${token.value}]`); continue; }
      if (token.kind === "bar") { output.push("|"); continue; }
      if (token.kind !== "hyphen") { output.push(token.value); continue; }
      const rhythmParts = [];
      while (index < tokens.length && tokens[index].kind === "hyphen") {
        rhythmParts.push(tokens[index].value.replace(/ /g, ""));
        index += 1;
      }
      index -= 1;
      const rhythm = rhythmParts.join("");
      const mixedSyncopation = rhythm.includes("-") && rhythm.includes("=");
      const authoredEqualGroups = rhythm.includes("=") && rhythmParts.length > 1;
      if (mixedSyncopation || authoredEqualGroups) { output.push(rhythmParts.join(" ")); continue; }
      if (spacing <= 0 || rhythm.length <= spacing) { output.push(rhythm); continue; }
      const chunks = [];
      for (let offset = 0; offset < rhythm.length; offset += spacing) chunks.push(rhythm.slice(offset, offset + spacing));
      output.push(chunks.join(" "));
    }
    // Spacing is only a separator inside one continuous rhythm run. Never leave
    // that separator between the final beat and a following bar line ("-|"),
    // including text that was already rendered by an earlier conversion.
    return output.join("").replace(/[ \t　]+(?=\|)/g, "");
  }

  function hideLyricHyphens(tokens) {
    if (isCodeOnly(tokens)) return { tokens: [...tokens], hiddenHyphens: 0 };
    const output = [];
    let measure = [];
    let hiddenHyphens = 0;
    const flush = () => {
      const chordCount = chordsOf(measure).length;
      measure.forEach((token) => {
        const pureHyphen = token.kind === "hyphen" && /^-+$/u.test(token.value.replace(/ /g, ""));
        if (chordCount >= 1 && chordCount < 3 && pureHyphen) hiddenHyphens += rhythmWidth(token);
        else output.push(token);
      });
      measure = [];
    };
    tokens.forEach((token) => {
      measure.push(token);
      if (token.kind === "bar") flush();
    });
    if (measure.length) flush();
    return { tokens: output, hiddenHyphens };
  }

  function renderCompletedOutput(text, selectedCounts = [4], hyphenSpacing = 0, hideLyricHyphenMarkers = false) {
    let removedHyphens = 0;
    let changedMeasures = 0;
    let hiddenLyricHyphens = 0;
    const output = text.split(/\r\n|\r|\n/).map((line) => {
      if (DIRECTIVE_RE.test(line)) return line;
      const parsed = restoreShortFractionMeasureTail(parseTokens(line), selectedCounts);
      const codeOnly = isCodeOnly(parsed);
      const result = removeSelectedLyricHyphens(parsed, selectedCounts);
      removedHyphens += result.removedHyphens;
      changedMeasures += result.changedMeasures;
      const visibility = hideLyricHyphenMarkers ? hideLyricHyphens(result.tokens) : { tokens: result.tokens, hiddenHyphens: 0 };
      hiddenLyricHyphens += visibility.hiddenHyphens;
      if (!codeOnly) return serializeTokens(padShortTrailingLyric(visibility.tokens), { hyphenSpacing: 0 });
      return serializeCodeOnlyTokens(result.tokens, hyphenSpacing);
    }).join("\n");
    return { output, removedHyphens, changedMeasures, hiddenLyricHyphens };
  }

  function inferBeatCodeFromRenderedLine(line, fallbackCode, settings) {
    const tokens = parseTokens(String(line || ""));
    const chordIndices = tokens.map((token, index) => token.kind === "chord" ? index : -1).filter((index) => index >= 0);
    if (!chordIndices.length) return null;
    const fallbackAnchor = correctionBarAnchor(fallbackCode);
    const anchorIndex = fallbackAnchor?.ok ? fallbackAnchor.forcedBarBeforeSlot : null;
    const fallbackValue = anchorIndex === null ? String(fallbackCode || "") : String(fallbackCode || "").replace("|", "");
    let fallbackUnits = beatCodeUnits(fallbackValue);
    if (!fallbackUnits?.length) {
      const defaultWidth = Math.max(1, Math.min(Number(settings.hyphenUnit) || 4, 32));
      fallbackUnits = Array.from({ length: chordIndices.length }, () => ({
        width: defaultWidth, accents: 0, halfNote: false, noLeadingBar: false, noTrailingBar: false, whiteNoteMarker: false, suffixStar: false
      }));
    }
    if (fallbackUnits.some((unit) => unit.whiteNoteMarker)) return null;
    if (fallbackUnits.length === 1 && chordIndices.length > 1) fallbackUnits = Array.from({ length: chordIndices.length }, () => ({ ...fallbackUnits[0] }));
    if (fallbackUnits.length !== chordIndices.length) return null;
    const units = fallbackUnits.map((unit) => ({ ...unit, noLeadingBar: false, noTrailingBar: false, syncBefore: false, syncAfter: false }));
    const renderedRhythms = [];
    const renderedFineWidths = [];
    chordIndices.forEach((tokenIndex, chordIndex) => {
      const nextChordIndex = chordIndices[chordIndex + 1] ?? tokens.length;
      const segment = tokens.slice(tokenIndex + 1, nextChordIndex);
      const rhythm = segment.filter((token) => token.kind === "hyphen").map((token) => token.value).join("");
      renderedRhythms[chordIndex] = rhythm.replace(/ /g, "");
      renderedFineWidths[chordIndex] = 0;
      const visibleWidth = [...rhythm].filter((character) => "-=>≧".includes(character)).length;
      if (visibleWidth) {
        units[chordIndex].width = visibleWidth;
        units[chordIndex].halfNote = /[=≧]/.test(rhythm);
        units[chordIndex].accents = (rhythm.match(/[>≧]/g) || []).length;
      }
    });
    renderedFineWidths.forEach((_width, index) => {
      renderedFineWidths[index] = [...(renderedRhythms[index] || "")].reduce((sum, character) => {
        if (character === "-" || character === ">") return sum + 2;
        if (character === "=" || character === "≧") return sum + 1;
        return sum;
      }, 0);
    });
    for (let index = 0; index + 1 < units.length; index += 1) {
      const leftRhythm = renderedRhythms[index] || "";
      const rightRhythm = renderedRhythms[index + 1] || "";
      const leftFine = renderedFineWidths[index] || 0;
      const rightFine = renderedFineWidths[index + 1] || 0;
      const syncBoundary = !/[>≧]/.test(leftRhythm + rightRhythm)
        && leftRhythm.endsWith("=") && rightRhythm.startsWith("=")
        && leftFine % 2 === 1 && rightFine % 2 === 1 && leftFine >= 1 && rightFine >= 3;
      if (!syncBoundary) continue;
      units[index].width = (leftFine + 1) / 2;
      units[index].halfNote = false;
      units[index].accents = 0;
      units[index].syncAfter = true;
      units[index + 1].width = (rightFine - 1) / 2;
      units[index + 1].halfNote = false;
      units[index + 1].accents = 0;
      units[index + 1].syncBefore = true;
      index += 1;
    }
    const firstChordIndex = chordIndices[0];
    units[0].noLeadingBar = !tokens.slice(0, firstChordIndex).some((token) => token.kind === "bar");
    const inferredSyncopated = units.some((unit) => unit.syncBefore || unit.syncAfter);
    const inferredCapacity = settings.measureCapacity * (inferredSyncopated ? 2 : 1);
    let position = 0;
    units.forEach((unit, index) => {
      position += inferredSyncopated ? (unit.width * 2) + (unit.syncBefore ? 1 : 0) - (unit.syncAfter ? 1 : 0) : unit.width;
      const nextChordIndex = chordIndices[index + 1];
      if (nextChordIndex !== undefined && position >= inferredCapacity) {
        const hasBoundary = tokens.slice(chordIndices[index] + 1, nextChordIndex).some((token) => token.kind === "bar");
        if (!hasBoundary) unit.noTrailingBar = true;
        position %= inferredCapacity;
      }
    });
    const finalChordIndex = chordIndices[chordIndices.length - 1];
    const finalChordValue = tokens[finalChordIndex]?.value || "";
    const parenthesizedFinalChord = finalChordValue.startsWith("(") && finalChordValue.endsWith(")");
    if (!parenthesizedFinalChord && !tokens.slice(finalChordIndex + 1).some((token) => token.kind === "bar")) units[units.length - 1].noTrailingBar = true;
    const inferredCodes = units.map((unit) => serializeBeatUnit({ ...unit, width: Math.min(unit.width, 32) }));
    if (!inferredCodes.every(Boolean)) return "n";
    const inferredGroups = inferredCodes.map((code, index) => `${code}${units[index].syncAfter ? "s" : ""}`);
    if (anchorIndex !== null && anchorIndex < inferredGroups.length) inferredGroups.splice(anchorIndex, 0, "|");
    return inferredGroups.join("");
  }

  function mergeChangedLines(currentText, nextText, changedIndices) {
    const currentLines = String(currentText || "").split("\n");
    const nextLines = String(nextText || "").split("\n");
    const changed = new Set(changedIndices || []);
    return nextLines.map((line, index) => changed.has(index) || currentLines[index] === undefined ? line : currentLines[index]).join("\n");
  }

  function alignLineIndices(previousLines, currentLines) {
    const previous = Array.from(previousLines || [], String);
    const current = Array.from(currentLines || [], String);
    const mapping = Array(current.length).fill(-1);
    let prefix = 0;
    while (prefix < previous.length && prefix < current.length && previous[prefix] === current[prefix]) {
      mapping[prefix] = prefix;
      prefix += 1;
    }
    let previousEnd = previous.length - 1;
    let currentEnd = current.length - 1;
    while (previousEnd >= prefix && currentEnd >= prefix && previous[previousEnd] === current[currentEnd]) {
      mapping[currentEnd] = previousEnd;
      previousEnd -= 1;
      currentEnd -= 1;
    }
    const previousMiddle = previous.slice(prefix, previousEnd + 1);
    const currentMiddle = current.slice(prefix, currentEnd + 1);
    if (!previousMiddle.length || !currentMiddle.length) return mapping;
    if (previousMiddle.length * currentMiddle.length > 40000) {
      let previousIndex = 0;
      currentMiddle.forEach((line, currentIndex) => {
        const found = previousMiddle.indexOf(line, previousIndex);
        if (found < 0) return;
        mapping[prefix + currentIndex] = prefix + found;
        previousIndex = found + 1;
      });
      return mapping;
    }
    const rows = previousMiddle.length + 1;
    const columns = currentMiddle.length + 1;
    const lengths = Array.from({ length: rows }, () => new Uint16Array(columns));
    for (let row = previousMiddle.length - 1; row >= 0; row -= 1) {
      for (let column = currentMiddle.length - 1; column >= 0; column -= 1) {
        lengths[row][column] = previousMiddle[row] === currentMiddle[column]
          ? lengths[row + 1][column + 1] + 1
          : Math.max(lengths[row + 1][column], lengths[row][column + 1]);
      }
    }
    let row = 0;
    let column = 0;
    while (row < previousMiddle.length && column < currentMiddle.length) {
      if (previousMiddle[row] === currentMiddle[column]) {
        mapping[prefix + column] = prefix + row;
        row += 1;
        column += 1;
      } else if (lengths[row + 1][column] >= lengths[row][column + 1]) row += 1;
      else column += 1;
    }
    return mapping;
  }

  function addedCharacterIndices(sourceText, outputText) {
    const added = [];
    const sourceLines = String(sourceText || "").replace(/\r\n?/g, "\n").split("\n");
    const outputLines = String(outputText || "").replace(/\r\n?/g, "\n").split("\n");
    let absoluteOffset = 0;
    function compareSegment(sourceSegment, outputSegment, outputOffset) {
      const rows = sourceSegment.length + 1;
      const columns = outputSegment.length + 1;
      if (sourceSegment.length * outputSegment.length > 1000000) {
        let prefix = 0;
        while (prefix < sourceSegment.length && prefix < outputSegment.length && sourceSegment[prefix] === outputSegment[prefix]) prefix += 1;
        let sourceSuffix = sourceSegment.length - 1;
        let outputSuffix = outputSegment.length - 1;
        while (sourceSuffix >= prefix && outputSuffix >= prefix && sourceSegment[sourceSuffix] === outputSegment[outputSuffix]) {
          sourceSuffix -= 1;
          outputSuffix -= 1;
        }
        for (let index = prefix; index <= outputSuffix; index += 1) added.push(outputOffset + index);
        return;
      }
      const lcs = Array.from({ length: rows }, () => new Uint32Array(columns));
      for (let sourceIndex = 1; sourceIndex < rows; sourceIndex += 1) {
        for (let outputIndex = 1; outputIndex < columns; outputIndex += 1) {
          lcs[sourceIndex][outputIndex] = sourceSegment[sourceIndex - 1] === outputSegment[outputIndex - 1]
            ? lcs[sourceIndex - 1][outputIndex - 1] + 1
            : Math.max(lcs[sourceIndex - 1][outputIndex], lcs[sourceIndex][outputIndex - 1]);
        }
      }
      let sourceIndex = sourceSegment.length;
      let outputIndex = outputSegment.length;
      while (outputIndex > 0) {
        if (sourceIndex > 0 && sourceSegment[sourceIndex - 1] === outputSegment[outputIndex - 1]) {
          sourceIndex -= 1;
          outputIndex -= 1;
        } else if (sourceIndex > 0 && lcs[sourceIndex - 1][outputIndex] >= lcs[sourceIndex][outputIndex - 1]) {
          sourceIndex -= 1;
        } else {
          added.push(outputOffset + outputIndex - 1);
          outputIndex -= 1;
        }
      }
    }
    outputLines.forEach((outputLine, lineIndex) => {
      const sourceLine = sourceLines[lineIndex] || "";
      const anchors = [...sourceLine.matchAll(/\[([^\[\]\r\n]+)\]/g)]
        .filter((match) => match[1] === "○" || isChordSymbol(match[1]));
      let sourceCursor = 0;
      let outputCursor = 0;
      anchors.forEach((anchor) => {
        const outputAnchor = outputLine.indexOf(anchor[0], outputCursor);
        if (outputAnchor < 0) return;
        compareSegment(sourceLine.slice(sourceCursor, anchor.index), outputLine.slice(outputCursor, outputAnchor), absoluteOffset + outputCursor);
        sourceCursor = anchor.index + anchor[0].length;
        outputCursor = outputAnchor + anchor[0].length;
      });
      compareSegment(sourceLine.slice(sourceCursor), outputLine.slice(outputCursor), absoluteOffset + outputCursor);
      absoluteOffset += outputLine.length + 1;
    });
    return added.sort((left, right) => left - right);
  }

  function remapTrackedCharacterIndices(previousText, nextText, trackedIndices) {
    const previous = String(previousText || "");
    const next = String(nextText || "");
    const tracked = new Set([...trackedIndices].filter((index) => index >= 0 && index < previous.length));
    let prefix = 0;
    while (prefix < previous.length && prefix < next.length && previous[prefix] === next[prefix]) prefix += 1;
    let previousSuffix = previous.length;
    let nextSuffix = next.length;
    while (previousSuffix > prefix && nextSuffix > prefix && previous[previousSuffix - 1] === next[nextSuffix - 1]) {
      previousSuffix -= 1;
      nextSuffix -= 1;
    }
    const remapped = [];
    tracked.forEach((index) => {
      if (index < prefix) remapped.push(index);
      else if (index >= previousSuffix) remapped.push(nextSuffix + index - previousSuffix);
    });
    const previousMiddle = previous.slice(prefix, previousSuffix);
    const nextMiddle = next.slice(prefix, nextSuffix);
    if (previousMiddle.length * nextMiddle.length <= 1000000) {
      const rows = previousMiddle.length + 1;
      const columns = nextMiddle.length + 1;
      const lcs = Array.from({ length: rows }, () => new Uint32Array(columns));
      for (let previousIndex = 1; previousIndex < rows; previousIndex += 1) {
        for (let nextIndex = 1; nextIndex < columns; nextIndex += 1) {
          lcs[previousIndex][nextIndex] = previousMiddle[previousIndex - 1] === nextMiddle[nextIndex - 1]
            ? lcs[previousIndex - 1][nextIndex - 1] + 1
            : Math.max(lcs[previousIndex - 1][nextIndex], lcs[previousIndex][nextIndex - 1]);
        }
      }
      let previousIndex = previousMiddle.length;
      let nextIndex = nextMiddle.length;
      while (previousIndex > 0 && nextIndex > 0) {
        if (previousMiddle[previousIndex - 1] === nextMiddle[nextIndex - 1]) {
          const absolutePrevious = prefix + previousIndex - 1;
          if (tracked.has(absolutePrevious)) remapped.push(prefix + nextIndex - 1);
          previousIndex -= 1;
          nextIndex -= 1;
        } else if (lcs[previousIndex - 1][nextIndex] >= lcs[previousIndex][nextIndex - 1]) previousIndex -= 1;
        else nextIndex -= 1;
      }
    }
    return [...new Set(remapped)].sort((left, right) => left - right);
  }

  window.CBFConverter = { convertChordText, parseTokens, isChordSymbol, normalizeChordSymbol, moveDelayedRhythmAfterChord, suppressTrailingBarAfterParenthesizedFinalChord, renderWithBeatCode, mergeCorrectionScope, renderCompletedOutput, inferBeatCodeFromRenderedLine, mergeChangedLines, alignLineIndices, addedCharacterIndices, remapTrackedCharacterIndices, addContinuationChordsToManualRhythm, analyzeAuthoredMeasureCapacity };
}());
