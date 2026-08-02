(() => {
  "use strict";

  // ROW-017: Keep the experiment as a plain textarea.  The regular editor's
  // slot shortcuts make symbols appear to move and change normal caret motion.
  if (new URLSearchParams(location.search).get("rowEditTest") !== "1") return;

  const correction = document.querySelector("#correction-text");
  if (!correction) return;

  document.documentElement.classList.add("row-edit-text-mode");
  correction.dataset.rowEditTextMode = "true";

  let noticeTimer;
  function notifyInvalid() {
    const toast = document.querySelector("#toast");
    if (!toast) return;
    clearTimeout(noticeTimer);
    toast.textContent = "行修正で使えない文字です";
    toast.className = "toast visible error";
    noticeTimer = setTimeout(() => { toast.className = "toast"; }, 1800);
  }

  function normalizeCharacter(character) {
    const code = character.charCodeAt(0);
    return code >= 0xFF01 && code <= 0xFF5E
      ? String.fromCharCode(code - 0xFEE0).toLowerCase()
      : character.toLowerCase();
  }

  function normalizeText(value, allowLineBreaks) {
    const normalized = [...String(value || "")].map(normalizeCharacter).join("");
    const allowed = allowLineBreaks ? /^[0-9a-isx^*@|\r\n]*$/i : /^[0-9a-isx^*@|]*$/i;
    return allowed.test(normalized) ? normalized : "";
  }

  function replaceText(start, end, replacement, caret) {
    correction.setRangeText(replacement, start, end, "end");
    correction.setSelectionRange(caret, caret);
    correction.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function overwriteNextValue(value) {
    const start = correction.selectionStart;
    const end = correction.selectionEnd;
    if (start !== end) {
      replaceText(start, end, value, start + 1);
      return;
    }
    const lineEndMatch = correction.value.slice(start).search(/[\r\n]/);
    const lineEnd = lineEndMatch < 0 ? correction.value.length : start + lineEndMatch;
    const followingValue = correction.value.slice(start, lineEnd).match(/[0-9a-i]/i);
    if (!followingValue || followingValue.index === undefined) {
      replaceText(start, start, value, start + 1);
      return;
    }
    const target = start + followingValue.index;
    replaceText(target, target + 1, value, target + 1);
  }

  function insertSymbol(value) {
    const start = correction.selectionStart;
    const end = correction.selectionEnd;
    replaceText(start, end, value, start + value.length);
  }

  function lineBounds(offset) {
    const text = correction.value;
    const start = Math.max(text.lastIndexOf("\n", offset - 1), text.lastIndexOf("\r", offset - 1)) + 1;
    const after = text.slice(offset).search(/[\r\n]/);
    return { start, end: after < 0 ? text.length : offset + after };
  }

  function durationPositions() {
    const bounds = lineBounds(correction.selectionStart);
    const positions = [];
    const expression = /[0-9a-i]/gi;
    let match;
    while ((match = expression.exec(correction.value.slice(bounds.start, bounds.end)))) positions.push(bounds.start + match.index);
    return positions;
  }

  function selectedDuration() {
    const start = correction.selectionStart;
    const end = correction.selectionEnd;
    return end === start + 1 && /[0-9a-i]/i.test(correction.value[start]) ? start : -1;
  }

  function selectDuration(position) {
    correction.setSelectionRange(position, position + 1);
  }

  function moveDuration(direction) {
    const positions = durationPositions();
    if (!positions.length) return;
    const selected = selectedDuration();
    const caret = correction.selectionStart;
    const current = selected >= 0 ? selected : caret;
    const candidates = direction < 0
      ? positions.filter((position) => position < current)
      : positions.filter((position) => position > current || (selected < 0 && position >= current));
    if (!candidates.length) return;
    selectDuration(direction < 0 ? candidates[candidates.length - 1] : candidates[0]);
  }

  function removeAttachedSymbol() {
    const duration = selectedDuration();
    if (duration < 0) return false;
    const text = correction.value;
    let start = duration;
    while (start > 0 && /[x^*@s|]/i.test(text[start - 1])) start -= 1;
    if (start < duration) {
      const removed = duration - start;
      replaceText(start, duration, "", start);
      selectDuration(duration - removed);
      return true;
    }
    // A marker at either side belongs to the selected duration for deletion.
    // This lets `8s8`, `8|8` and `8@8` be corrected from either neighbour.
    let end = duration + 1;
    while (end < text.length && /[x^*@s|]/i.test(text[end])) end += 1;
    if (end > duration + 1) {
      replaceText(duration + 1, end, "", duration + 1);
      selectDuration(duration);
      return true;
    }
    return false;
  }

  function clearSelectedDuration() {
    const duration = selectedDuration();
    if (duration < 0) return false;
    replaceText(duration, duration + 1, "0", duration + 1);
    return true;
  }

  function moveToAdjacentRow(direction) {
    const text = correction.value;
    const bounds = lineBounds(correction.selectionStart);
    const nextCaret = direction > 0
      ? (bounds.end < text.length ? bounds.end + 1 : -1)
      : (bounds.start > 0 ? Math.max(0, text.lastIndexOf("\n", bounds.start - 2) + 1) : -1);
    if (nextCaret < 0) return;
    correction.setSelectionRange(nextCaret, nextCaret);
    if (direction > 0) moveDuration(1);
    else {
      const nextBounds = lineBounds(nextCaret);
      correction.setSelectionRange(nextBounds.end, nextBounds.end);
      moveDuration(-1);
    }
  }

  function applyTextInput(value, allowLineBreaks) {
    const normalized = normalizeText(value, allowLineBreaks);
    if (!normalized || (!allowLineBreaks && /[\r\n]/.test(normalized))) {
      notifyInvalid();
      return;
    }
    for (const character of normalized) {
      if (/[0-9a-i]/i.test(character)) overwriteNextValue(character);
      else if (character === "\r" || character === "\n") insertSymbol(character);
      else insertSymbol(character);
    }
  }

  // Stop the application's slot-editor listeners. Text remains visually plain,
  // while rhythm values can still be selected as a compact keyboard sequence.
  correction.addEventListener("beforeinput", (event) => {
    if (!["insertText", "insertCompositionText", "insertFromDrop"].includes(event.inputType)) return;
    event.stopImmediatePropagation();
    event.preventDefault();
    applyTextInput(event.data, event.inputType === "insertFromPaste" || event.inputType === "insertFromDrop");
  }, true);

  correction.addEventListener("keydown", (event) => {
    event.stopImmediatePropagation();
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      moveDuration(event.key === "ArrowLeft" ? -1 : 1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      moveToAdjacentRow(1);
      return;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      if (selectedDuration() < 0) return;
      event.preventDefault();
      if (!removeAttachedSymbol()) clearSelectedDuration();
    }
  }, true);

  // The main editor normally re-selects a whole slot on keyup/click/focus.
  // In this test those events must leave the browser's text caret untouched.
  ["keyup", "click", "focus"].forEach((eventName) => {
    correction.addEventListener(eventName, (event) => {
      event.stopImmediatePropagation();
    }, true);
  });

})();
