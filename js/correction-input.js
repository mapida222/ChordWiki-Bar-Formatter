(function () {
  "use strict";

  const GROUP_SOURCE = "@|[x\\^*]*[0-9a-i](?:[x*](?=@|s|[x\\^*]*[0-9a-i]|$))?";
  const GROUP_PATTERN = new RegExp(GROUP_SOURCE, "gi");
  const PART_PATTERN = new RegExp(`${GROUP_SOURCE}|s|\\|`, "gi");
  const BEAT_CHARACTER_PATTERN = /[0-9a-i@]/gi;

  function groups(line) {
    const value = String(line || "").trim().toLowerCase();
    if (value === "n" || value === "s") return [];
    GROUP_PATTERN.lastIndex = 0;
    return String(line || "").match(GROUP_PATTERN) || [];
  }

  function beatCharacters(line) {
    return [...String(line || "").matchAll(BEAT_CHARACTER_PATTERN)];
  }

  function normalizeLine(line, baseLimit, authoredWhiteNotes = 0) {
    const command = String(line || "").trim().toLowerCase();
    if (command === "n" || command === "s") return command;
    // Do not use the automatically detected chord count as an input limit.
    // A user may add a chord in the rendered text first and then add its row-edit
    // value, or may temporarily type an incomplete expression while editing.
    // Validation belongs to conversion, not to the textarea's input handler.
    return String(line || "").replace(/[^0-9a-isn@x\^*|]/gi, "").toLowerCase();
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
    if (!/^[0-9a-i]$/.test(character)) return null;
    const from = Math.max(0, Math.min(Number(start) || 0, text.length));
    const to = Math.max(from, Math.min(Number(end) || from, text.length));
    if (to > from) return { start: from, end: to, replacement: character, caret: from + 1 };
    const beats = beatCharacters(text);
    if (!beats.length || text.trim().toLowerCase() === "n" || text.trim().toLowerCase() === "s") {
      return { start: 0, end: text.length, replacement: character, caret: 1 };
    }
    const target = beats.find((match) => match.index >= from) || beats[beats.length - 1];
    return { start: target.index, end: target.index + target[0].length, replacement: character, caret: target.index + 1 };
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
    const replacementStart = modifierPrefix ? target.index - modifierPrefix[0].length : target.index;
    return { start: replacementStart, end: target.index + target[0].length, replacement: "@", caret: replacementStart + 1 };
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

  function overwritePastedRows(text, selectionStart, pastedText, maximumRows = 0) {
    const existing = String(text || "").split(/\r\n|\r|\n/);
    const safeStart = Math.max(0, Math.min(Number(selectionStart) || 0, String(text || "").length));
    const startLine = String(text || "").slice(0, safeStart).split(/\r\n|\r|\n/).length - 1;
    const normalizedPaste = String(pastedText || "").replace(/\r\n|\r/g, "\n").replace(/\n$/, "");
    const pasted = normalizedPaste.split("\n").map((line) => normalizeLine(line, 0));
    const rowLimit = Math.max(existing.length, Number(maximumRows) || 0);
    while (existing.length < rowLimit) existing.push("");
    const appliedCount = Math.max(0, Math.min(pasted.length, rowLimit - startLine));
    for (let index = 0; index < appliedCount; index += 1) existing[startLine + index] = pasted[index];
    const value = existing.join("\n");
    const nextLine = startLine + appliedCount;
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
    if (text.trim().toLowerCase() === "n" || text.trim().toLowerCase() === "s") return { text: "0", selectionStart: 0, selectionEnd: 1 };
    return { text: `${text}0`, selectionStart: text.length, selectionEnd: text.length + 1 };
  }

  function migrateLegacyText(text) {
    return String(text || "").split(/\r\n|\r|\n/).map((line) => {
      if (/[h-np-v]/i.test(line)) return line.trim() ? "n" : "";
      return line.replace(/o/gi, "h").replace(/w/gi, "i");
    }).join("\n");
  }

  window.CBFCorrectionInput = { groups, beatCharacters, normalizeLine, modifierInsertionAtLineEnd, needsInsertedWhiteNoteDuration, smartBeatEdit, whiteNoteEdit, nextLineStart, caretAfterLineEdit, overwritePastedRows, overwritePastedLine, appendBeatSlot, migrateLegacyText };
}());
