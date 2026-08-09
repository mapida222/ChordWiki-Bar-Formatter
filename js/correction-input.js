(function () {
  "use strict";

  const GROUP_SOURCE = "\\?|@|[x\\^*]*[0-9a-i](?:[x*](?=@|\\?|s|[x\\^*]*[0-9a-i]|$))?";
  const GROUP_PATTERN = new RegExp(GROUP_SOURCE, "gi");
  const PART_PATTERN = new RegExp(`${GROUP_SOURCE}|\\*s|s|\\|`, "gi");
  const BEAT_CHARACTER_PATTERN = /[0-9a-i@?]/gi;

  function groups(line) {
    const value = String(line || "").trim().toLowerCase();
    if (value === "n" || value === "s") return [];
    GROUP_PATTERN.lastIndex = 0;
    return String(line || "").match(GROUP_PATTERN) || [];
  }

  function redistributeForLineBreaks(previousLines, previousSlotCounts, currentSlotCounts) {
    const flattened = [];
    (previousLines || []).forEach((line, lineIndex) => {
      const slotCount = Math.max(0, Number(previousSlotCounts?.[lineIndex]) || 0);
      const command = String(line || "").trim().toLowerCase();
      if (command === "n") {
        for (let index = 0; index < slotCount; index += 1) flattened.push({ command });
        return;
      }
      const text = String(line || "");
      const matches = [...text.matchAll(new RegExp(GROUP_SOURCE, "gi"))];
      if (matches.length > slotCount) {
        for (let index = 0; index < slotCount; index += 1) flattened.push(null);
        return;
      }
      const boundarySymbols = (value) => (String(value || "").match(/\*s|s|\|/gi) || []).join("");
      matches.forEach((match, index) => {
        const previous = matches[index - 1];
        let separatorBefore = previous
          ? boundarySymbols(text.slice(previous.index + previous[0].length, match.index))
          : boundarySymbols(text.slice(0, match.index));
        // GROUP_SOURCE normally treats a trailing * as a duration suffix. When
        // it sits immediately before s, however, the pair is the half-sync
        // boundary *s and must move together if the source row is split.
        if (previous?.[0].endsWith("*") && separatorBefore.startsWith("s")) {
          const previousItem = flattened[flattened.length - 1];
          if (previousItem?.value?.endsWith("*")) previousItem.value = previousItem.value.slice(0, -1);
          separatorBefore = `*${separatorBefore}`;
        }
        flattened.push({ value: match[0], separatorBefore });
      });
      for (let index = matches.length; index < slotCount; index += 1) flattened.push(null);
    });

    const expectedSlots = (currentSlotCounts || []).reduce((sum, count) => sum + Math.max(0, Number(count) || 0), 0);
    if (flattened.length !== expectedSlots) return null;
    let offset = 0;
    const preserved = [];
    const lines = (currentSlotCounts || []).map((count, lineIndex) => {
      const slotCount = Math.max(0, Number(count) || 0);
      const items = flattened.slice(offset, offset + slotCount);
      offset += slotCount;
      if (!slotCount) {
        preserved[lineIndex] = true;
        return "";
      }
      if (items.every((item) => item?.command === "n")) {
        preserved[lineIndex] = true;
        return "n";
      }
      const firstMissing = items.findIndex((item) => !item?.value);
      const supplied = firstMissing < 0 ? items : items.slice(0, firstMissing);
      if (firstMissing >= 0 && items.slice(firstMissing).some((item) => item?.value)) {
        preserved[lineIndex] = false;
        return "";
      }
      preserved[lineIndex] = true;
      return supplied.map((item, index) => `${index ? item.separatorBefore || "" : (item.separatorBefore || "").replace(/\|/g, "")}${item.value}`).join("");
    });
    return { lines, preserved };
  }

  function synchronizeLineBreakLayout(previousText, currentText, correctionLines, previousSlotCounts, currentSlotCounts) {
    const normalize = (value) => String(value || "").replace(/\r\n|\r/g, "\n");
    const previous = normalize(previousText);
    const current = normalize(currentText);
    if (previous === current || previous.replace(/\n/g, "") !== current.replace(/\n/g, "")) return null;
    const corrections = redistributeForLineBreaks(correctionLines, previousSlotCounts, currentSlotCounts);
    return { corrections, lineCount: current.split("\n").length };
  }

  function beatCharacters(line) {
    return [...String(line || "").matchAll(BEAT_CHARACTER_PATTERN)];
  }

  function normalizeBeatInputCharacter(value) {
    const text = String(value || "");
    if ([...text].length !== 1) return "";
    const character = text.charCodeAt(0) >= 0xFF01 && text.charCodeAt(0) <= 0xFF5E
      ? String.fromCharCode(text.charCodeAt(0) - 0xFEE0)
      : text;
    const normalized = character.toLowerCase();
    return /^[0-9a-i@?]$/.test(normalized) ? normalized : "";
  }

  function normalizeBeatInputSequence(value) {
    const characters = [...String(value || "")];
    if (!characters.length) return "";
    const normalized = characters.map((character) => normalizeBeatInputCharacter(character));
    return normalized.every(Boolean) ? normalized.join("") : "";
  }

  function isRecentInputCommit(pendingCharacter, pendingAt, character, now = Date.now()) {
    const age = Number(now) - Number(pendingAt);
    return Boolean(character) && character === pendingCharacter && age >= 0 && age <= 500;
  }

  function incrementalCompositionBeatInput(previousValue, currentValue) {
    const previous = String(previousValue || "");
    const current = String(currentValue || "");
    if (!current || current === previous || previous.startsWith(current)) return "";
    if (current.startsWith(previous)) return current.slice(previous.length);
    let sharedLength = 0;
    while (sharedLength < previous.length && sharedLength < current.length && previous[sharedLength] === current[sharedLength]) sharedLength += 1;
    return current.slice(sharedLength);
  }

  function normalizeBoundarySymbolSequence(value) {
    const characters = [...String(value || "")];
    if (!characters.length) return "";
    const normalized = characters.map((character) => {
      const ascii = character.charCodeAt(0) >= 0xFF01 && character.charCodeAt(0) <= 0xFF5E
        ? String.fromCharCode(character.charCodeAt(0) - 0xFEE0)
        : character;
      const symbol = ascii.toLowerCase();
      if (symbol === "/" || symbol === "\\") return "|";
      return /^[x\^*s|]$/.test(symbol) ? symbol : "";
    });
    return normalized.every(Boolean) ? normalized.join("") : "";
  }

  function singleInsertedBeat(previousValue, currentValue) {
    const previous = String(previousValue || "");
    const current = String(currentValue || "");
    if (current.length !== previous.length + 1) return null;
    let index = 0;
    while (index < previous.length && previous[index] === current[index]) index += 1;
    if (`${current.slice(0, index)}${current.slice(index + 1)}` !== previous) return null;
    const character = normalizeBeatInputCharacter(current[index]);
    return character ? { index, character } : null;
  }

  function normalizeLine(line, baseLimit, authoredWhiteNotes = 0) {
    const normalizedWidth = [...String(line || "")]
      .map((character) => normalizeBeatInputCharacter(character) || character)
      .join("");
    const command = normalizedWidth.trim().toLowerCase();
    if (command === "n" || command === "s") return command;
    // Do not use the automatically detected chord count as an input limit.
    // A user may add a chord in the rendered text first and then add its row-edit
    // value, or may temporarily type an incomplete expression while editing.
    // Validation belongs to conversion, not to the textarea's input handler.
    return normalizedWidth.replace(/[\\/]/g, "|").replace(/[^0-9a-isn@?x\^*|]/gi, "").toLowerCase();
  }

  function modifierInsertionAtLineEnd(line, key) {
    const modifier = String(key || "").toLowerCase();
    if (!["x", "^", "*"].includes(modifier)) return null;
    const parsed = groups(line);
    if (!parsed.length) return null;
    const lastGroup = parsed[parsed.length - 1];
    if (modifier === "x") {
      if (lastGroup === "@" || lastGroup.endsWith("x")) return null;
      const end = String(line || "").length;
      return { start: end, end, replacement: modifier, caret: end + 1 };
    }
    const previousGroup = parsed[parsed.length - 2];
    if (modifier === "*" && previousGroup === "@" && !lastGroup.endsWith("*")) return null;
    const characters = beatCharacters(line);
    if (!characters.length) return null;
    const lastPosition = characters[characters.length - 1].index;
    return { start: lastPosition, end: lastPosition, replacement: modifier, caret: lastPosition + 1 };
  }

  function needsInsertedWhiteNoteDuration(line, caret, baseLimit, authoredWhiteNotes = 0) {
    const text = String(line || "");
    if (caret <= 0 || text[caret - 1] !== "@") return false;
    const parsed = groups(text);
    const insertedWhiteNotes = Math.max(0, parsed.filter((group) => group === "@").length - authoredWhiteNotes);
    return parsed.length < Math.max(0, baseLimit) + insertedWhiteNotes;
  }

  function smartBeatEdit(line, start, end, key) {
    const text = String(line || "");
    const character = String(key || "").toLowerCase();
    if (!/^[0-9a-i?]$/.test(character)) return null;
    const from = Math.max(0, Math.min(Number(start) || 0, text.length));
    const to = Math.max(from, Math.min(Number(end) || from, text.length));
    if (to > from) return { start: from, end: to, replacement: character, caret: from + 1 };
    const beats = beatCharacters(text);
    if (text.trim().toLowerCase() === "n") {
      return { start: 0, end: text.length, replacement: character, caret: 1 };
    }
    if (!beats.length && /^\*?s$/i.test(text.trim())) {
      return { start: text.length, end: text.length, replacement: character, caret: text.length + 1 };
    }
    if (!beats.length) return { start: 0, end: text.length, replacement: character, caret: 1 };
    const target = beats.find((match) => match.index >= from) || beats[beats.length - 1];
    return { start: target.index, end: target.index + target[0].length, replacement: character, caret: target.index + 1 };
  }

  function boundarySymbolEdit(line, column, key) {
    const text = String(line || "");
    const symbol = String(key || "").toLowerCase() === "/" ? "|" : String(key || "").toLowerCase();
    if (!["x", "^", "*", "s", "|"].includes(symbol)) return null;
    const caret = Math.max(0, Math.min(text.length, Number(column) || 0));
    if (symbol === "|") {
      if (text.includes("|")) return { error: "duplicate-bar-anchor" };
      return { start: caret, end: caret, replacement: symbol, caret: caret + 1 };
    }
    if (symbol === "s") {
      if (text[caret]?.toLowerCase() === "s") {
        const start = text[caret - 1] === "*" ? caret - 1 : caret;
        return { start, end: caret + 1, replacement: "", caret: start };
      }
      if (text[caret - 1]?.toLowerCase() === "s") {
        const start = text[caret - 2] === "*" ? caret - 2 : caret - 1;
        return { start, end: caret, replacement: "", caret: start };
      }
      const syncPrefixLength = text[caret - 1] === "*" ? 1 : 0;
      const hasPreviousValue = /[0-9a-i@]/i.test(text.slice(0, caret - syncPrefixLength));
      const hasFollowingValue = /[0-9a-i@]/i.test(text.slice(caret));
      const leadingBoundary = !hasPreviousValue && caret - syncPrefixLength === 0;
      if ((!hasPreviousValue && !leadingBoundary) || !hasFollowingValue) return { error: "invalid-sync-boundary" };
    }
    return { start: caret, end: caret, replacement: symbol, caret: caret + 1 };
  }

  function slotSelection(line, slotIndex) {
    const beats = beatCharacters(line);
    if (!beats.length) return null;
    const index = Math.max(0, Math.min(beats.length - 1, Number(slotIndex) || 0));
    const target = beats[index];
    return { index, start: target.index, end: target.index + target[0].length };
  }

  function nextLineWithBeatSlot(lines, currentLineIndex) {
    const start = Math.max(-1, Number(currentLineIndex) || 0);
    const values = Array.isArray(lines) ? lines : [];
    for (let index = start + 1; index < values.length; index += 1) {
      if (groups(values[index]).length) return index;
    }
    return -1;
  }

  function selectedBeat(line, start, end) {
    const text = String(line || "");
    const from = Math.max(0, Math.min(Number(start) || 0, text.length));
    const to = Math.max(from, Math.min(Number(end) || from, text.length));
    const beats = beatCharacters(text);
    if (!beats.length) return null;
    let index = to > from
      ? beats.findIndex((match) => match.index >= from && match.index < to)
      : beats.findIndex((match) => match.index >= from);
    if (index < 0) index = beats.length - 1;
    return { text, beats, index, target: beats[index] };
  }

  function clearBeatEdit(line, start, end) {
    const selected = selectedBeat(line, start, end);
    if (!selected) return null;
    const { text, beats, index, target } = selected;
    let editStart = target.index;
    let editEnd = target.index + target[0].length;
    while (editStart > 0 && /[x\^*]/i.test(text[editStart - 1])) editStart -= 1;
    while (editEnd < text.length && /[x*]/i.test(text[editEnd]) && text[editEnd + 1]?.toLowerCase() !== "s") editEnd += 1;
    return { start: editStart, end: editEnd, replacement: "", caret: editStart };
  }

  function syncopationRemovalEdit(line, start, end) {
    const selected = selectedBeat(line, start, end);
    if (!selected) return null;
    const { text, target } = selected;
    const after = target.index + target[0].length;
    if (target.index > 0 && text[target.index - 1]?.toLowerCase() === "s") {
      const removalStart = text[target.index - 2] === "*" ? target.index - 2 : target.index - 1;
      return { start: removalStart, end: target.index, replacement: "", caret: removalStart };
    }
    return null;
  }

  function deletionEdit(line, start, end) {
    return syncopationRemovalEdit(line, start, end) || clearBeatEdit(line, start, end);
  }

  function whiteNoteEdit(line, start, end) {
    const text = String(line || "");
    const from = Math.max(0, Math.min(Number(start) || 0, text.length));
    const to = Math.max(from, Math.min(Number(end) || from, text.length));
    const beats = beatCharacters(text);
    const selected = beats.find((match) => match.index >= from && match.index < to);
    const target = selected || beats.find((match) => match.index >= from) || beats[beats.length - 1];
    if (!target || text.trim().toLowerCase() === "n" || text.trim().toLowerCase() === "s") {
      return { start: 0, end: text.length, replacement: "@", caret: 1 };
    }
    if (target[0] === "@") return { start: target.index, end: target.index + 1, replacement: "@", caret: target.index + 1 };
    const modifierPrefix = text.slice(0, target.index).match(/[\^*]+$/);
    let replacementStart = modifierPrefix ? target.index - modifierPrefix[0].length : target.index;
    while (replacementStart > 0 && /[x\^*]/i.test(text[replacementStart - 1])) replacementStart -= 1;
    if (text[replacementStart - 1]?.toLowerCase() === "s") replacementStart -= 1;
    let replacementEnd = target.index + target[0].length;
    while (replacementEnd < text.length && /[x*]/i.test(text[replacementEnd])) replacementEnd += 1;
    if (text[replacementEnd]?.toLowerCase() === "s") replacementEnd += 1;
    return { start: replacementStart, end: replacementEnd, replacement: "@", caret: replacementStart + 1 };
  }

  function nextLineStart(text, lineEnd) {
    const value = String(text || "");
    const resolvedEnd = Math.max(0, Math.min(Number(lineEnd) || 0, value.length));
    if (value.slice(resolvedEnd, resolvedEnd + 2) === "\r\n") return resolvedEnd + 2;
    if (value[resolvedEnd] === "\r" || value[resolvedEnd] === "\n") return resolvedEnd + 1;
    return resolvedEnd;
  }

  function caretAfterLineEdit(text, lineEnd, editCaret, keepOnCurrentLine = false) {
    const caret = Math.max(0, Number(editCaret) || 0);
    if (keepOnCurrentLine || caret < lineEnd) return caret;
    return nextLineStart(text, lineEnd);
  }

  function scrollTopForLineMargin(currentScrollTop, clientHeight, lineHeight, lineIndex, lineCount, marginLines = 1, paddingTop = 0, bottomMarginLines = marginLines) {
    const height = Math.max(1, Number(lineHeight) || 1);
    const count = Math.max(1, Number(lineCount) || 1);
    const index = Math.max(0, Math.min(count - 1, Number(lineIndex) || 0));
    const margin = Math.max(0, Number(marginLines) || 0);
    const bottomMargin = Math.max(0, Number(bottomMarginLines) || 0);
    const current = Math.max(0, Number(currentScrollTop) || 0);
    const viewport = Math.max(height, Number(clientHeight) || height);
    const visibleTop = Math.max(0, Number(paddingTop) || 0) + Math.max(0, index - margin) * height;
    const visibleBottom = Math.max(0, Number(paddingTop) || 0) + Math.min(count, index + bottomMargin + 1) * height;
    if (visibleTop < current) return Math.max(0, visibleTop);
    if (visibleBottom > current + viewport) return Math.max(0, visibleBottom - viewport);
    return current;
  }

  function overwritePastedRows(text, selectionStart, pastedText, maximumRows = 0) {
    const existing = String(text || "").split(/\r\n|\r|\n/);
    const safeStart = Math.max(0, Math.min(Number(selectionStart) || 0, String(text || "").length));
    const startLine = String(text || "").slice(0, safeStart).split(/\r\n|\r|\n/).length - 1;
    const normalizedPaste = String(pastedText || "").replace(/\r\n|\r/g, "\n").replace(/\n$/, "");
    const pasted = normalizedPaste.split("\n").map((line) => normalizeLine(line, 0));
    const rowLimit = Math.max(existing.length, Number(maximumRows) || 0);
    while (existing.length < rowLimit) existing.push("");
    let appliedCount = 0;
    let targetLine = startLine;
    for (const pastedLine of pasted) {
      // Empty correction rows mirror source rows that have no editable beat
      // slots. Keep those structural separators when compact correction values
      // are pasted without matching blank lines.
      while (pastedLine && targetLine < rowLimit && existing[targetLine] === "") targetLine += 1;
      if (targetLine >= rowLimit) break;
      existing[targetLine] = pastedLine;
      targetLine += 1;
      appliedCount += 1;
    }
    const value = existing.join("\n");
    const nextLine = targetLine;
    const caret = nextLine < existing.length
      ? existing.slice(0, nextLine).reduce((total, line) => total + line.length + 1, 0)
      : value.length;
    return { value, caret, truncatedRows: pasted.length - appliedCount };
  }

  function overwritePastedLine(line, selectionStart, selectionEnd, pastedText) {
    const text = String(line || "");
    const from = Math.max(0, Math.min(Number(selectionStart) || 0, text.length));
    const to = Math.max(from, Math.min(Number(selectionEnd) || from, text.length));
    const pasted = normalizeLine(String(pastedText || ""), 0);
    if (!pasted || pasted === "n" || pasted === "s" || (from === 0 && to === text.length)) {
      return { text: pasted, caret: pasted.length };
    }
    const targetParts = [...text.matchAll(new RegExp(PART_PATTERN.source, "gi"))];
    const pastedParts = [...pasted.matchAll(new RegExp(PART_PATTERN.source, "gi"))];
    if (!targetParts.length || !pastedParts.length) return { text: pasted || text, caret: pasted.length };
    if (pastedParts.length >= targetParts.length) return { text: pasted, caret: pasted.length };
    let targetIndex = targetParts.findIndex((part) => part.index + part[0].length > from);
    if (targetIndex < 0) targetIndex = targetParts.length - 1;
    const replaceStart = targetParts[targetIndex].index;
    const finalTarget = targetParts[Math.min(targetParts.length - 1, targetIndex + pastedParts.length - 1)];
    const replaceEnd = finalTarget.index + finalTarget[0].length;
    return {
      text: `${text.slice(0, replaceStart)}${pasted}${text.slice(replaceEnd)}`,
      caret: replaceStart + pasted.length
    };
  }

  function appendBeatSlot(line) {
    const text = String(line || "");
    if (text.trim().toLowerCase() === "n") return { text: "0", selectionStart: 0, selectionEnd: 1 };
    if (/^\*?s$/i.test(text.trim())) return { text: `${text}0`, selectionStart: text.length, selectionEnd: text.length + 1 };
    return { text: `${text}0`, selectionStart: text.length, selectionEnd: text.length + 1 };
  }

  function migrateLegacyText(text) {
    return String(text || "").split(/\r\n|\r|\n/).map((line) => {
      if (/[h-np-v]/i.test(line)) return line.trim() ? "n" : "";
      return line.replace(/o/gi, "h").replace(/w/gi, "i");
    }).join("\n");
  }

  window.CBFCorrectionInput = { groups, redistributeForLineBreaks, synchronizeLineBreakLayout, beatCharacters, normalizeBeatInputCharacter, normalizeBeatInputSequence, isRecentInputCommit, incrementalCompositionBeatInput, normalizeBoundarySymbolSequence, singleInsertedBeat, normalizeLine, modifierInsertionAtLineEnd, boundarySymbolEdit, needsInsertedWhiteNoteDuration, smartBeatEdit, slotSelection, nextLineWithBeatSlot, clearBeatEdit, syncopationRemovalEdit, deletionEdit, whiteNoteEdit, nextLineStart, caretAfterLineEdit, scrollTopForLineMargin, overwritePastedRows, overwritePastedLine, appendBeatSlot, migrateLegacyText };
}());
