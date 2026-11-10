(function () {
  "use strict";
  const STATE_KEY = "chordWikiBarFormatter.scoreWindow.v1";
  const CHANNEL_NAME = "chordWikiBarFormatter.scoreWindow.channel.v1";
  const TEXT_KEY = "chordWikiBarFormatter.committedOutput.v1";
  const DRAFT_KEY = "chordWikiBarFormatter.committedWindowDraft.v1";
  const MUSICXML_HANDOFF_STORAGE_KEY = "chordWikiBarFormatter.musicxmlHandoff.v1";
  const keepExistingDraft = new URLSearchParams(window.location.search).get("draft") === "keep";
  const pendingReplace = new URLSearchParams(window.location.search).get("pending") === "replace";
  function consumeMusicXmlHandoff(target = "realtime") {
    if (new URLSearchParams(window.location.search).get("import") !== "musicxml") return null;
    try {
      const payload = JSON.parse(localStorage.getItem(MUSICXML_HANDOFF_STORAGE_KEY) || "null");
      if (!payload || payload.target !== target || typeof payload.text !== "string" || !payload.text.trim()) return null;
      if (!Number.isFinite(Number(payload.createdAt)) || Math.abs(Date.now() - Number(payload.createdAt)) > 10 * 60 * 1000) return null;
      localStorage.removeItem(MUSICXML_HANDOFF_STORAGE_KEY);
      return payload.text;
    } catch (_error) {
      localStorage.removeItem(MUSICXML_HANDOFF_STORAGE_KEY);
      return null;
    }
  }
  const musicXmlHandoffText = consumeMusicXmlHandoff('realtime');
  const layout = document.querySelector("#committed-window-layout");
  const text = document.querySelector("#committed-window-text");
  const lines = document.querySelector("#committed-window-lines");
  const highlight = document.querySelector("#committed-window-highlight");
  const preview = document.querySelector("#committed-window-preview");
  const previewPane = document.querySelector(".committed-window-preview-pane");
  const previewTitle = previewPane.querySelector(".committed-window-pane-title");
  const previewModeStatus = document.querySelector("#committed-preview-mode-status");
  const status = document.querySelector("#committed-window-status");
  const layoutToggle = document.querySelector("#committed-layout-toggle");
  const positionToggle = document.querySelector("#committed-position-toggle");
  const editorPane = document.querySelector(".committed-window-editor-pane");
  const positionHelp = document.querySelector("#committed-position-help");
  const positionSymbols = document.querySelector("#committed-position-symbols");
  const helpPanel = document.querySelector(".score-window-help");
  const settingsPanel = document.querySelector(".score-window-settings");
  const width = document.querySelector("#committed-pane-width");
  const fontSize = document.querySelector("#committed-font-size");
  const fontSizeValue = document.querySelector("#committed-font-size-value");
  const lineHeight = document.querySelector("#committed-line-height");
  const lineHeightValue = document.querySelector("#committed-line-height-value");
  const font = document.querySelector("#committed-font");
  const theme = document.querySelector("#committed-theme");
  const spelling = document.querySelector("#committed-spelling");
  const textColoring = document.querySelector("#committed-text-coloring");
  const boldCode = document.querySelector("#committed-bold-code");
  const scrollSync = document.querySelector("#committed-scroll-sync");
  const transpose = document.querySelector("#committed-transpose");
  const transposeDown = document.querySelector("#committed-transpose-down");
  const transposeUp = document.querySelector("#committed-transpose-up");
  const replaceDialog = document.querySelector("#committed-replace-dialog");
  let channel = null;
  let activeLine = 0;
  let draftUpdatedAt = 0;
  let loadedDraftText = "";
  const layoutModes = ["stacked", "side", "side-reverse", "stacked-reverse"];
  const layoutLabels = { stacked: "上下（編集→プレビュー）", side: "左右（編集→プレビュー）", "side-reverse": "左右反転（プレビュー→編集）", "stacked-reverse": "上下反転（プレビュー→編集）" };
  let layoutMode = "stacked";
  let positionAdjustMode = false;
  let appliedTranspose = 0;
  let transposeCommitted = false;
  let includePositionSymbols = false;
  let activeChordStart = -1;
  let positionSpaceKeyDown = false;
  const positionUndoStack = [];
  const positionRedoStack = [];
  let stackedLineHeight = 1.65;
  let sideLineHeight = 2.75;
  let stackedPaneSize = 48;
  let sidePaneSize = 48;
  const LINE_NUMBER_TRAILING_ROWS = 2;
  const suppressedScrollPositions = new WeakMap();
  const chordTokenPattern = /\[\[([^\[\]\r\n]*)\]\]|\[([^\[\]\r\n]*)\]/g;
  const directiveTokenPattern = /\{[^{}\r\n]*\}/g;
  const chordRanges = (source, includeSymbols = false, groupBars = !includeSymbols) => {
    const value = String(source || "");
    const ranges = [];
    let match;
    while ((match = chordTokenPattern.exec(value))) {
      const token = match[1] !== undefined ? match[1] : match[2];
      const isSymbol = token === "|" || window.ChordWikiPreview?.isRhythmToken?.(token);
      if (!includeSymbols && isSymbol) continue;
      const start = groupBars && !isSymbol && value.slice(Math.max(0, match.index - 3), match.index) === "[|]"
        ? match.index - 3 : match.index;
      if (ranges.at(-1)?.start === start) ranges.pop();
      const end = match.index + match[0].length;
      const lineStart = Math.max(value.lastIndexOf("\n", start - 1), value.lastIndexOf("\r", start - 1)) + 1;
      ranges.push({ start, end, lineIndex: value.slice(0, start).split(/\r\n|\r|\n/).length - 1, column: start - lineStart, token: value.slice(start, end) });
    }
    chordTokenPattern.lastIndex = 0;
    return ranges;
  };
  const activeChordRange = () => chordRanges(text.value, includePositionSymbols).find((range) => range.start === activeChordStart) || null;
  const movementRanges = (source) => {
    const value = String(source || "");
    const ranges = chordRanges(value, true, !includePositionSymbols);
    let match;
    while ((match = directiveTokenPattern.exec(value))) {
      const lineStart = Math.max(value.lastIndexOf("\n", match.index - 1), value.lastIndexOf("\r", match.index - 1)) + 1;
      ranges.push({ start: match.index, end: match.index + match[0].length, lineIndex: value.slice(0, match.index).split(/\r\n|\r|\n/).length - 1, column: match.index - lineStart, token: match[0] });
    }
    directiveTokenPattern.lastIndex = 0;
    return ranges.sort((left, right) => left.start - right.start);
  };
  const chordAtPosition = (position, allowNearby = true) => {
    const ranges = chordRanges(text.value, includePositionSymbols);
    const atStart = ranges.find((range) => position === range.start);
    if (atStart) return atStart;
    const inside = ranges.find((range) => position >= range.start && position < range.end);
    if (inside || !allowNearby) return inside || null;
    return ranges.find((range) => Math.min(Math.abs(position - range.start), Math.abs(position - range.end)) <= 1) || null;
  };
  const setActiveChord = (range, { focus = true } = {}) => {
    if (!range) return false;
    activeChordStart = range.start;
    text.setSelectionRange(range.start, range.end);
    setActiveLine(range.lineIndex);
    if (focus) text.focus();
    else text.blur();
    render();
    return true;
  };
  const selectRelativeChord = (direction) => {
    const ranges = chordRanges(text.value, includePositionSymbols);
    if (!ranges.length) return false;
    const currentIndex = ranges.findIndex((range) => range.start === activeChordStart);
    const nextIndex = currentIndex < 0
      ? (direction > 0 ? 0 : ranges.length - 1)
      : (currentIndex + direction + ranges.length) % ranges.length;
    return setActiveChord(ranges[nextIndex], { focus: false });
  };
  const scrollProgress = (element, axis) => {
    if (!element) return 0;
    const current = axis === "left" ? element.scrollLeft : element.scrollTop;
    const max = axis === "left"
      ? Math.max(0, element.scrollWidth - element.clientWidth)
      : Math.max(0, element.scrollHeight - element.clientHeight);
    return max ? Math.max(0, Math.min(1, current / max)) : 0;
  };
  const scrollPositionForProgress = (element, axis, progress) => {
    if (!element) return 0;
    const max = axis === "left"
      ? Math.max(0, element.scrollWidth - element.clientWidth)
      : Math.max(0, element.scrollHeight - element.clientHeight);
    return max * Math.max(0, Math.min(1, progress));
  };
  const setScrollProgress = (element, topProgress, leftProgress) => {
    if (!element) return;
    const top = scrollPositionForProgress(element, "top", topProgress);
    const left = scrollPositionForProgress(element, "left", leftProgress);
    if (element.scrollTop === top && element.scrollLeft === left) return;
    suppressedScrollPositions.set(element, { top, left });
    element.scrollTop = top;
    element.scrollLeft = left;
  };
  const scrollPositionWasSuppressed = (element) => {
    const position = suppressedScrollPositions.get(element);
    const suppressed = position
      && position.top === element.scrollTop
      && position.left === element.scrollLeft;
    if (suppressed) suppressedScrollPositions.delete(element);
    return suppressed;
  };
  try { if ("BroadcastChannel" in window) channel = new BroadcastChannel(CHANNEL_NAME); } catch (_error) { channel = null; }
  function render() {
    const textTopProgress = scrollProgress(text, "top");
    const textLeftProgress = scrollProgress(text, "left");
    const previewTopProgress = scrollProgress(preview, "top");
    const previewLeftProgress = scrollProgress(preview, "left");
    const escape = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // The editor must remain readable even when a preview-only token cannot
    // be drawn. Render the editable text and its line numbers first.
    const tokenPattern = /(\{[^{}\r\n]*\}|\[\[[^\[\]\r\n]*\]\]|\[[^\[\]\r\n]*\]|\|)/g;
    const selectedChord = positionAdjustMode ? activeChordRange() : null;
    let lastIndex = 0;
    highlight.innerHTML = [...text.value.matchAll(tokenPattern)].map((match) => {
      const token = match[0]; const inner = token.slice(1, -1);
      const isSelectedChord = selectedChord && match.index >= selectedChord.start && match.index + token.length <= selectedChord.end;
      const syntaxClass = token === "|" || (token.startsWith("[") && (inner === "|" || /^[\s\-=>≧○]+$/.test(inner))) ? "syntax-bracket" : /^\{\s*key\s*:/i.test(token) ? "syntax-key" : token.startsWith("{") ? "syntax-directive" : "syntax-chord";
      const className = `${syntaxClass}${isSelectedChord ? " position-adjust-active" : ""}`;
      const before = escape(text.value.slice(lastIndex, match.index)); lastIndex = match.index + token.length;
      return `${before}<span class="${className}">${escape(token)}</span>`;
    }).join("") + escape(text.value.slice(lastIndex));
    const count = Math.max(1, text.value.split(/\r\n|\r|\n/).length);
    const numbers = Array.from({ length: count }, (_, index) => `<span>${index + 1}</span>`).join("");
    const trailingRows = Array.from({ length: LINE_NUMBER_TRAILING_ROWS }, () => '<span class="line-number-spacer" aria-hidden="true"></span>').join("");
    lines.innerHTML = numbers + trailingRows;
    lines.scrollTop = text.scrollTop;
    try {
      const previewTranspose = transposeCommitted ? 0 : Number(transpose.value) || 0;
      const previewText = window.ChordWikiTranspose
        ? window.ChordWikiTranspose.transposeText(text.value, previewTranspose, spelling.value)
        : text.value;
      window.ChordWikiPreview.renderInto(preview, previewText);
      const previewRows = [...preview.children];
      let previewRowIndex = 0;
      text.value.split(/\r\n|\r|\n/).forEach((sourceLine, sourceLineIndex) => {
        if (/^\s*#/.test(sourceLine)) return;
        const previewRow = previewRows[previewRowIndex++];
        if (previewRow) previewRow.dataset.sourceLine = String(sourceLineIndex);
      });
    } catch (_error) {
      preview.textContent = text.value;
    }
    preview.classList.toggle("position-adjust-active", positionAdjustMode);
    setScrollProgress(preview, scrollSync.checked ? textTopProgress : previewTopProgress, scrollSync.checked ? textLeftProgress : previewLeftProgress);
    setActiveLine(activeLine);
  }
  function alignCurrentLineRule() {
    const row = lines.querySelector(".active-line");
    const layer = text.parentElement;
    const y = row ? row.getBoundingClientRect().bottom - layer.getBoundingClientRect().top - 1 : -1;
    layer.style.setProperty("--current-line-rule", `${y}px`);
  }
  new ResizeObserver(alignCurrentLineRule).observe(text);
  function setActiveLine(index) {
    activeLine = Math.max(0, Math.min(Math.max(0, text.value.split(/\r\n|\r|\n/).length - 1), index));
    [...lines.querySelectorAll("span:not(.line-number-spacer)")].forEach((line, lineIndex) => line.classList.toggle("active-line", lineIndex === activeLine));
    alignCurrentLineRule();
    [...preview.querySelectorAll("[data-source-line]")].forEach((line) => line.classList.toggle("compare-active", Number(line.dataset.sourceLine) === activeLine));
  }
  function applyState(payload) {
    if (!payload) return;
    const next = String(payload.committedText ?? "");
    if (document.activeElement !== text && Number(payload.updatedAt) >= draftUpdatedAt && next !== text.value) {
      text.value = next;
      appliedTranspose = 0;
      transposeCommitted = false;
    }
    render();
  }
  const saveWarning = document.querySelector("#committed-autosave-status");
  let idleTimer, deadlineTimer, historyTimer;
  let pendingDraft = null;
  let pendingHistory = null;
  let unnamedSong = crypto.randomUUID();
  let draftFailed = false;
  let historyFailed = false;

  function showSaveWarning() {
    saveWarning.hidden = !draftFailed && !historyFailed;
    saveWarning.textContent = draftFailed ? "下書きを保存できません。画面を閉じる前に本文をコピーしてください。"
      : historyFailed ? "使用履歴に保存できません。必要な譜面は別途コピーしてください。" : "";
  }

  function flushDraft() {
    clearTimeout(idleTimer);
    clearTimeout(deadlineTimer);
    deadlineTimer = undefined;
    if (!pendingDraft) return;
    const { value, updatedAt } = pendingDraft;
    try {
      const saved = {text: value, updatedAt, unnamedSong, historyDueAt: pendingHistory?.dueAt};
      localStorage.setItem(DRAFT_KEY, JSON.stringify(saved));
      pendingDraft = null;
      draftFailed = false;
      // These keys also support the handoff from the main page.
      try {
        localStorage.setItem(TEXT_KEY, value);
      } catch (_error) { /* The canonical draft is already saved. */ }
    } catch (_error) { draftFailed = true; }
    showSaveWarning();
  }

  function checkpoint() {
    historyTimer = undefined;
    if (!pendingHistory) return;
    try {
      window.CBFHistoryStore.createStore(localStorage).saveEditorHistory(pendingHistory.value, pendingHistory.song);
      // Clear the reminder only on the draft this checkpoint belongs to.
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      if (saved?.historyDueAt === pendingHistory.dueAt && saved.text === pendingHistory.value) {
        delete saved.historyDueAt;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(saved));
      }
      pendingHistory = null;
      historyFailed = false;
    } catch (_error) {
      historyFailed = true;
      historyTimer = setTimeout(checkpoint, 180_000);
    }
    showSaveWarning();
  }

  function queueHistory(value, dueAt) {
    const title = window.CBFHistoryStore.titleValueFromText(value);
    pendingHistory = { value, dueAt, song: title ? `title:${title}` : `draft:${unnamedSong}` };
    historyTimer ??= setTimeout(checkpoint, Math.max(0, dueAt - Date.now()));
  }

  window.addEventListener("pagehide", flushDraft);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flushDraft();
  });

  function publishText() {
    const value = text.value;
    const payload = { type: "committed-text", text: value };
    draftUpdatedAt = Date.now();
    pendingDraft = { value, updatedAt: draftUpdatedAt };
    clearTimeout(idleTimer);
    idleTimer = setTimeout(flushDraft, 180);
    deadlineTimer ??= setTimeout(flushDraft, 5_000);
    queueHistory(value, pendingHistory?.dueAt ?? Date.now() + 180_000);
    if (channel) channel.postMessage(payload);
    try { if (window.opener && !window.opener.closed) window.opener.postMessage(payload, window.location.origin === "null" ? "*" : window.location.origin); } catch (_error) { /* ignore */ }
    render(); status.textContent = "譜面プレビューへリアルタイムで反映しました。";
  }
  const positionStatus = () => {
    status.textContent = positionAdjustMode
      ? "コード位置調整モード中：矢印で移動、Spaceで次、Shift+Spaceで前のコードを選択。"
      : "テキストと譜面プレビューを比較しながら編集できます。";
  };
  const lineRanges = (source) => {
    const value = String(source || "");
    const result = [];
    let start = 0;
    for (const match of value.matchAll(/\r\n|\r|\n/g)) {
      result.push({ start, end: match.index });
      start = match.index + match[0].length;
    }
    result.push({ start, end: value.length });
    return result;
  };
  const previousCodePointStart = (source, index) => {
    if (index <= 0) return 0;
    const codePoint = source.codePointAt(index - 1);
    return index - (codePoint > 0xffff ? 2 : 1);
  };
  const nextCodePointEnd = (source, index) => {
    if (index >= source.length) return source.length;
    const codePoint = source.codePointAt(index);
    return index + (codePoint > 0xffff ? 2 : 1);
  };
  const finishPositionEdit = (range) => {
    if (!range) return false;
    activeChordStart = range.start;
    text.setSelectionRange(range.start, range.end);
    setActiveLine(range.lineIndex);
    publishText();
    positionStatus();
    return true;
  };
  const rememberPositionEdit = () => {
    positionRedoStack.length = 0;
    positionUndoStack.push({ value: text.value, selectionStart: text.selectionStart, selectionEnd: text.selectionEnd, activeChordStart });
    if (positionUndoStack.length > 100) positionUndoStack.shift();
  };
  const undoPositionEdit = (redo = false) => {
    const from = redo ? positionRedoStack : positionUndoStack;
    const to = redo ? positionUndoStack : positionRedoStack;
    const previous = from.pop();
    if (!previous) return false;
    to.push({ value: text.value, selectionStart: text.selectionStart, selectionEnd: text.selectionEnd, activeChordStart });
    text.value = previous.value;
    activeChordStart = previous.activeChordStart;
    text.setSelectionRange(previous.selectionStart, previous.selectionEnd);
    render();
    publishText();
    text.blur();
    positionStatus();
    return true;
  };
  const moveActiveChord = (direction) => {
    const range = activeChordRange() || chordAtPosition(text.selectionStart);
    if (!range) return false;
    const positionTokens = movementRanges(text.value);
    if (direction === "left") {
      const previousToken = positionTokens.find((token) => token.end === range.start);
      if (previousToken) {
        rememberPositionEdit();
        text.setRangeText(`${range.token}${previousToken.token}`, previousToken.start, range.end, "select");
        return finishPositionEdit({ ...range, start: previousToken.start, end: previousToken.start + range.token.length });
      }
      if (range.start <= 0) return false;
      const previousStart = previousCodePointStart(text.value, range.start);
      const previousText = text.value.slice(previousStart, range.start);
      if (!previousText || /\r|\n/u.test(previousText)) return false;
      rememberPositionEdit();
      text.setRangeText(`${range.token}${previousText}`, previousStart, range.end, "select");
      return finishPositionEdit({ ...range, start: previousStart, end: previousStart + range.token.length });
    }
    if (direction === "right") {
      const nextToken = positionTokens.find((token) => token.start === range.end);
      if (nextToken) {
        rememberPositionEdit();
        text.setRangeText(`${nextToken.token}${range.token}`, range.start, nextToken.end, "select");
        return finishPositionEdit({ ...range, start: range.start + nextToken.token.length, end: range.start + nextToken.token.length + range.token.length });
      }
      if (range.end >= text.value.length) return false;
      const nextEnd = nextCodePointEnd(text.value, range.end);
      const nextText = text.value.slice(range.end, nextEnd);
      if (!nextText || /\r|\n/u.test(nextText)) return false;
      rememberPositionEdit();
      text.setRangeText(`${nextText}${range.token}`, range.start, nextEnd, "select");
      return finishPositionEdit({ ...range, start: range.start + nextText.length, end: range.start + nextText.length + range.token.length });
    }
    const sourceLines = lineRanges(text.value);
    const targetLineIndex = range.lineIndex + (direction === "up" ? -1 : 1);
    const targetLine = sourceLines[targetLineIndex];
    if (!targetLine) return false;
    const token = range.token;
    rememberPositionEdit();
    text.setRangeText("", range.start, range.end, "preserve");
    const targetStart = targetLine.start - (targetLineIndex > range.lineIndex ? token.length : 0);
    const targetLength = targetLine.end - targetLine.start;
    let insertAt = targetStart + Math.min(range.column, targetLength);
    const targetToken = movementRanges(text.value).find((item) => item.start < insertAt && insertAt < item.end);
    if (targetToken) insertAt = targetToken.start;
    text.setRangeText(token, insertAt, insertAt, "preserve");
    const nextLine = targetLineIndex;
    return finishPositionEdit({ start: insertAt, end: insertAt + token.length, lineIndex: nextLine, column: insertAt - targetStart, token });
  };
  const isPositionSpace = (event) => event.code === "Space" || event.key === " " || event.key === "　" || event.key === "Spacebar";
  const handlePositionSpace = (event) => {
    if (!positionAdjustMode || !isPositionSpace(event) || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type === "keyup") {
      positionSpaceKeyDown = false;
      return;
    }
    if (event.type === "keypress" && positionSpaceKeyDown) return;
    positionSpaceKeyDown = true;
    selectRelativeChord(event.shiftKey ? -1 : 1);
    positionStatus();
  };
  const handlePositionBeforeInput = (event) => {
    if (!positionAdjustMode || ["historyUndo", "historyRedo"].includes(event.inputType)) return;
    if (event.data === " " || event.data === "　") {
      event.preventDefault();
      event.stopImmediatePropagation();
      selectRelativeChord(event.shiftKey ? -1 : 1);
      positionStatus();
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  const handlePositionUndo = (event) => {
    if (!positionAdjustMode || !(event.ctrlKey || event.metaKey) || event.altKey || !["z", "y"].includes(event.key.toLowerCase())) return;
    event.preventDefault();
    event.stopPropagation();
    undoPositionEdit(event.shiftKey || event.key.toLowerCase() === "y");
  };
  const handlePositionClipboard = (event) => {
    if (!positionAdjustMode || !(event.ctrlKey || event.metaKey) || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === "a") {
      event.preventDefault();
      event.stopImmediatePropagation();
      text.setSelectionRange(0, text.value.length);
      return;
    }
    if (key !== "c") return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const start = Math.min(text.selectionStart, text.selectionEnd);
    const end = Math.max(text.selectionStart, text.selectionEnd);
    const copied = text.value.slice(start, end);
    try { navigator.clipboard?.writeText(copied); } catch (_error) { /* clipboard permission is optional */ }
  };
  const handlePositionNavigation = (event) => {
    if (!positionAdjustMode) return;
    const direction = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" }[event.key];
    if (direction && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      event.stopImmediatePropagation();
      moveActiveChord(direction);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      setPositionMode(false);
      return;
    }
    if ((event.ctrlKey || event.metaKey) && ["a", "c", "z", "y"].includes(event.key.toLowerCase())) return;
    if (["Tab", "Shift", "Control", "Alt", "Meta"].includes(event.key)) return;
    if (isPositionSpace(event)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  const handlePositionShortcut = (event) => {
    if (event.key !== "F2" || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.shiftKey && !positionAdjustMode) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.shiftKey) {
      positionSymbols.checked = !positionSymbols.checked;
      positionSymbols.dispatchEvent(new Event("change"));
      return;
    }
    setPositionMode(!positionAdjustMode);
  };
  const syncPreviewHeaderHeight = () => {
    if (!positionAdjustMode) {
      previewTitle.style.removeProperty("height");
      return;
    }
    const editorTitle = editorPane.querySelector(".committed-window-pane-title");
    previewTitle.style.height = `${editorTitle.getBoundingClientRect().height}px`;
  };
  document.addEventListener("keydown", handlePositionSpace, true);
  document.addEventListener("keypress", handlePositionSpace, true);
  document.addEventListener("keyup", handlePositionSpace, true);
  document.addEventListener("beforeinput", handlePositionBeforeInput, true);
  document.addEventListener("keydown", handlePositionClipboard, true);
  document.addEventListener("keydown", handlePositionUndo, true);
  window.addEventListener("resize", syncPreviewHeaderHeight);
  const setPositionMode = (enabled) => {
    if (enabled) {
      const range = chordAtPosition(text.selectionStart) || chordRanges(text.value, includePositionSymbols)[0];
      if (!range) {
        status.textContent = "コードを含むテキストでコード位置調整を使用できます。";
        return;
      }
      positionAdjustMode = true;
      positionSpaceKeyDown = false;
      positionUndoStack.length = 0;
      positionRedoStack.length = 0;
      text.readOnly = true;
      positionToggle.textContent = "● コード位置調整モード中";
      positionToggle.setAttribute("aria-pressed", "true");
      positionToggle.title = "コード位置調整モードを終了（F2）";
      editorPane.classList.add("position-adjust-active");
      previewPane.classList.add("position-adjust-active");
      positionHelp.hidden = false;
      previewModeStatus.hidden = false;
      syncPreviewHeaderHeight();
      preview.classList.add("position-adjust-active");
      setActiveChord(range, { focus: false });
      positionStatus();
      return;
    }
    positionAdjustMode = false;
    positionSpaceKeyDown = false;
    positionUndoStack.length = 0;
    positionRedoStack.length = 0;
    activeChordStart = -1;
    text.readOnly = false;
    positionToggle.textContent = "コード位置調整モード(F2)";
    positionToggle.setAttribute("aria-pressed", "false");
    positionToggle.title = "コードを選択して矢印キーで位置を調整（F2で切替）";
    editorPane.classList.remove("position-adjust-active");
    previewPane.classList.remove("position-adjust-active");
    positionHelp.hidden = true;
    previewModeStatus.hidden = true;
    syncPreviewHeaderHeight();
    preview.classList.remove("position-adjust-active");
    render();
    positionStatus();
  };
  document.addEventListener("keydown", handlePositionShortcut, true);
  document.addEventListener("keydown", handlePositionNavigation, true);
  text.addEventListener("beforeinput", (event) => {
    if (positionAdjustMode && !["historyUndo", "historyRedo"].includes(event.inputType)) event.preventDefault();
  });
  text.addEventListener("input", () => {
    if (positionAdjustMode) activeChordStart = chordAtPosition(text.selectionStart)?.start ?? -1;
    publishText();
    if (positionAdjustMode) positionStatus();
  });
  ["click", "keyup", "select", "focus"].forEach((eventName) => text.addEventListener(eventName, () => setActiveLine(text.value.slice(0, text.selectionStart).split(/\r\n|\r|\n/).length - 1)));
  text.addEventListener("focus", () => {
    if (positionAdjustMode) text.blur();
  });
  text.addEventListener("click", () => {
    if (!positionAdjustMode) return;
    const range = chordAtPosition(text.selectionStart);
    if (range) setActiveChord(range, { focus: false });
    else text.blur();
  });
  text.addEventListener("keydown", (event) => {
    if (positionAdjustMode) return;
    if (event.key === "Escape") text.blur();
  });
  positionToggle.addEventListener("click", () => setPositionMode(!positionAdjustMode));
  positionSymbols.addEventListener("change", () => {
    includePositionSymbols = positionSymbols.checked;
    if (positionAdjustMode) {
      const range = chordAtPosition(text.selectionStart, false);
      if (range) setActiveChord(range, { focus: false });
      else if (!activeChordRange()) selectRelativeChord(1);
    }
    render();
    if (positionAdjustMode) positionStatus();
  });
  text.addEventListener("scroll", () => {
    const suppressed = scrollPositionWasSuppressed(text);
    lines.scrollTop = text.scrollTop;
    setActiveLine(activeLine);
    if (suppressed || !scrollSync.checked) return;
    setScrollProgress(preview, scrollProgress(text, "top"), scrollProgress(text, "left"));
  });
  text.addEventListener("scroll", () => {
    highlight.style.transform = `translate(${-text.scrollLeft}px, ${-text.scrollTop}px)`;
  });
  preview.addEventListener("scroll", () => {
    const suppressed = scrollPositionWasSuppressed(preview);
    if (suppressed || !scrollSync.checked) return;
    setScrollProgress(text, scrollProgress(preview, "top"), scrollProgress(preview, "left"));
    lines.scrollTop = text.scrollTop;
    highlight.style.transform = `translate(${-text.scrollLeft}px, ${-text.scrollTop}px)`;
  });
  preview.addEventListener("click", (event) => {
    if (preview.dataset.panned === "true") { preview.dataset.panned = "false"; event.preventDefault(); return; }
    const tokenSelector = includePositionSymbols
      ? ".cw-code-token, .cw-rhythm-token, .cw-bar-token, .cw-boundary"
      : ".cw-code-token";
    const clickedToken = event.target.closest?.(tokenSelector);
    if (positionAdjustMode && clickedToken) {
      const row = clickedToken.closest("[data-source-line]");
      if (row) {
        const sourceLineIndex = Number(row.dataset.sourceLine);
        const tokenIndex = [...row.querySelectorAll(tokenSelector)].indexOf(clickedToken);
        const sourceRange = chordRanges(text.value, includePositionSymbols).filter((range) => range.lineIndex === sourceLineIndex)[tokenIndex];
        if (sourceRange) {
          event.preventDefault();
          setActiveChord(sourceRange, { focus: false });
          positionStatus();
          return;
        }
      }
    }
    const line = event.target.closest("[data-source-line]");
    if (!line) return;
    setActiveLine(Number(line.dataset.sourceLine));
  });
  const historyDialog = document.querySelector("#editor-history");
  const recentList = document.querySelector("#editor-history-list");
  const olderList = document.querySelector("#editor-history-older");
  const archive = document.querySelector("#editor-history-archive");
  const historyPreview = document.querySelector("#editor-history-preview");
  const restoreButton = document.querySelector("#editor-history-restore");
  const historyError = document.querySelector("#editor-history-error");
  const scoreView = document.querySelector("#history-view-score");
  const sourceView = document.querySelector("#history-view-source");
  let selectedEntry;
  let selectedButton;
  let showSource = false;
  const entryText = entry => entry.historyText ?? entry.committedOutputText ?? entry.inputText ?? "";

  function drawHistoryPreview() {
    scoreView.setAttribute("aria-pressed", String(!showSource));
    sourceView.setAttribute("aria-pressed", String(showSource));
    historyPreview.classList.toggle("chordwiki-preview", !showSource && Boolean(selectedEntry));
    historyPreview.classList.toggle("history-source", showSource);
    const value = selectedEntry ? entryText(selectedEntry) : "";
    if (selectedEntry && !showSource) {
      try { window.ChordWikiPreview.renderInto(historyPreview, value); }
      catch { historyPreview.textContent = value; }
    } else historyPreview.textContent = selectedEntry ? value : "保存された使用履歴はありません。";
    historyPreview.scrollTop = historyPreview.scrollLeft = 0;
  }
  scoreView.addEventListener("click", () => { showSource = false; drawHistoryPreview(); });
  sourceView.addEventListener("click", () => { showSource = true; drawHistoryPreview(); });

  function selectHistory(entry, button) {
    selectedButton?.setAttribute("aria-pressed", "false");
    selectedButton = button;
    selectedButton?.setAttribute("aria-pressed", "true");
    selectedEntry = entry;
    drawHistoryPreview();
    restoreButton.disabled = !entry;
    historyError.hidden = true;
  }

  document.querySelector("#editor-history-open").addEventListener("click", () => {
    if (positionAdjustMode) setPositionMode(false);
    recentList.replaceChildren();
    olderList.replaceChildren();
    archive.open = false;
    const counts = new Map();
    showSource = false;
    selectHistory(null);
    try {
      for (const entry of window.CBFHistoryStore.createStore(localStorage).list()) {
        const song = entry.editorSong || (entry.editorOnly ? "title:" + (window.CBFHistoryStore.titleValueFromText(entryText(entry)) || "無題") : null);
        const count = (counts.get(song) || 0) + 1;
        if (song) counts.set(song, count);
        const target = song && count > 100 ? olderList : recentList;
        const row = document.createElement("button");
        row.type = "button";
        row.className = "history-version";
        row.setAttribute("aria-pressed", "false");
        const title = document.createElement("strong");
        title.textContent = window.CBFHistoryStore.titleValueFromText(entryText(entry)) || entry.title;
        const date = document.createElement("time");
        date.textContent = new Date(entry.savedAt).toLocaleString("ja-JP");
        row.append(title, date);
        row.addEventListener("click", () => selectHistory(entry, row));
        target.append(row);
        if (!selectedEntry) selectHistory(entry, row);
      }
    } catch (_error) {
      historyError.textContent = "使用履歴を読み込めませんでした。";
      historyError.hidden = false;
    }
    archive.hidden = !olderList.childElementCount;
    historyDialog.showModal();
    recentList.parentElement.scrollTop = 0;
  });
  document.querySelector("#editor-history-close").addEventListener("click", () => historyDialog.close());
  restoreButton.addEventListener("click", () => {
    if (!selectedEntry) return;
    const value = entryText(selectedEntry);
    if (value !== text.value && text.value.trim()) {
      try {
        const title = window.CBFHistoryStore.titleValueFromText(text.value);
        window.CBFHistoryStore.createStore(localStorage).saveEditorHistory(text.value, title ? `title:${title}` : `draft:${unnamedSong}`);
      } catch (_error) {
        historyError.textContent = "編集中の本文を履歴に保存できませんでした。復元する前に本文をコピーしてください。";
        historyError.hidden = false;
        return;
      }
    }
    if (selectedEntry.editorSong?.startsWith("draft:")) unnamedSong = selectedEntry.editorSong.slice(6);
    text.value = value;
    transpose.value = "0";
    appliedTranspose = 0;
    transposeCommitted = false;
    activeChordStart = -1;
    activeLine = 0;
    text.setSelectionRange(0, 0);
    text.scrollTop = text.scrollLeft = 0;
    applyDisplaySettings();
    text.dispatchEvent(new Event("input", { bubbles: true }));
    flushDraft();
    historyDialog.close();
    text.focus();
  });
  const displayKey = "chordWikiBarFormatter.committedWindowDisplay.v1";
  window.ChordWikiTranspose?.fillTransposeSelect(transpose);
  function updateTransposeButtons() {
    transposeDown.disabled = false;
    transposeUp.disabled = false;
  }
  const applyLayoutMode = () => {
    const stacked = layoutMode.startsWith("stacked");
    const stackedReverse = layoutMode === "stacked-reverse";
    const sideReverse = layoutMode === "side-reverse";
    const currentLineHeight = stacked ? stackedLineHeight : sideLineHeight;
    layout.classList.toggle("committed-window-stacked", stacked);
    layout.classList.toggle("committed-window-stacked-reverse", stackedReverse);
    layout.classList.toggle("committed-window-side-reverse", sideReverse);
    layout.style.setProperty(stacked ? "--committed-window-top" : "--committed-window-left", `${stacked ? stackedPaneSize : sidePaneSize}%`);
    layout.style.setProperty("--committed-line-height", String(currentLineHeight));
    lineHeight.value = String(currentLineHeight);
    lineHeightValue.textContent = `${Number(currentLineHeight).toFixed(2)}倍`;
    layoutToggle.textContent = "↕表示入替↔";
    layoutToggle.title = `編集とプレビューの配置を切り替え（現在：${layoutLabels[layoutMode] || layoutLabels.stacked}）`;
    layoutToggle.setAttribute("aria-label", `編集とプレビューの配置を切り替え（現在：${layoutLabels[layoutMode] || layoutLabels.stacked}）`);
    const divider = document.querySelector("#committed-window-divider");
    divider.setAttribute("aria-orientation", stacked ? "horizontal" : "vertical");
    divider.setAttribute("aria-label", stacked ? "テキストとプレビューの高さを調整" : "テキストとプレビューの幅を調整");
  };
  const applyDisplaySettings = () => {
    const textTopProgress = scrollProgress(text, "top");
    const textLeftProgress = scrollProgress(text, "left");
    const previewTopProgress = scrollProgress(preview, "top");
    const previewLeftProgress = scrollProgress(preview, "left");
    layout.style.setProperty("--editor-font-size", `${fontSize.value}px`);
    fontSizeValue.textContent = `${fontSize.value}px`;
    document.documentElement.style.setProperty("--editor-font", font.value);
    document.documentElement.dataset.theme = theme.value === "dark-gray" ? "dark" : theme.value;
    document.documentElement.classList.toggle("colorized-editors", textColoring.checked);
    document.documentElement.classList.toggle("bold-chords", boldCode.checked);
    applyLayoutMode();
    requestAnimationFrame(() => {
      setScrollProgress(text, textTopProgress, textLeftProgress);
      setScrollProgress(preview, scrollSync.checked ? textTopProgress : previewTopProgress, scrollSync.checked ? textLeftProgress : previewLeftProgress);
      setActiveLine(activeLine);
    });
    updateTransposeButtons();
    try { localStorage.setItem(displayKey, JSON.stringify({ fontSize: fontSize.value, font: font.value, theme: theme.value, spelling: spelling.value, textColoring: textColoring.checked, boldCode: boldCode.checked, scrollSync: scrollSync.checked, transpose: transpose.value, transposeApplied: transposeCommitted, appliedTranspose, layoutMode, layoutPreferenceVersion: 1, checkboxDefaultsVersion: 1, stackedLineHeight, sideLineHeight, stackedPaneSize, sidePaneSize })); } catch (_error) {}
  };
  document.addEventListener("click", (event) => {
    if (helpPanel?.open && !helpPanel.contains(event.target)) helpPanel.open = false;
    if (settingsPanel?.open && !settingsPanel.contains(event.target)) settingsPanel.open = false;
  });
  [fontSize, font, theme, spelling, textColoring, boldCode, scrollSync].forEach((control) => control.addEventListener("input", applyDisplaySettings));
  const commitSpellingSelection = () => {
    const selectionStart = text.selectionStart;
    const selectionEnd = text.selectionEnd;
    const converted = window.ChordWikiTranspose?.transposeText(text.value, 0, spelling.value);
    if (typeof converted !== "string") return;
    text.value = converted;
    activeChordStart = -1;
    if (document.activeElement === text) {
      text.setSelectionRange(Math.min(selectionStart, text.value.length), Math.min(selectionEnd, text.value.length));
    }
    applyDisplaySettings();
    publishText();
  };
  spelling.addEventListener("change", commitSpellingSelection);
  lineHeight.addEventListener("input", () => {
    const next = Math.max(1.4, Math.min(3.2, Number.parseFloat(lineHeight.value) || 1.65));
    if (layoutMode.startsWith("stacked")) stackedLineHeight = next; else sideLineHeight = next;
    applyDisplaySettings();
  });
  layoutToggle.addEventListener("click", () => {
    const currentIndex = layoutModes.indexOf(layoutMode);
    layoutMode = layoutModes[(currentIndex + 1 + layoutModes.length) % layoutModes.length];
    applyDisplaySettings();
  });
  const commitTransposeSelection = () => {
    const target = Number(transpose.value) || 0;
    const delta = transposeCommitted ? target - appliedTranspose : target;
    if (delta === 0) {
      appliedTranspose = target;
      transposeCommitted = true;
      applyDisplaySettings();
      render();
      return;
    }
    const selectionStart = text.selectionStart;
    const selectionEnd = text.selectionEnd;
    const transposed = window.ChordWikiTranspose?.transposeText(text.value, delta, spelling.value);
    if (typeof transposed !== "string") return;
    text.value = transposed;
    appliedTranspose = target;
    transposeCommitted = true;
    activeChordStart = -1;
    if (document.activeElement === text) {
      text.setSelectionRange(Math.min(selectionStart, text.value.length), Math.min(selectionEnd, text.value.length));
    }
    applyDisplaySettings();
    publishText();
  };
  transpose.addEventListener("change", commitTransposeSelection);
  const stepTranspose = (delta) => {
    const current = Number(transpose.value) || 0;
    const min = window.ChordWikiTranspose.transposeMin;
    const max = window.ChordWikiTranspose.transposeMax;
    transpose.value = String(delta < 0 && current <= min ? max : delta > 0 && current >= max ? min : current + delta);
    commitTransposeSelection();
  };
  transposeDown.addEventListener("click", () => stepTranspose(-1));
  transposeUp.addEventListener("click", () => stepTranspose(1));
  preview.addEventListener("pointerdown", (event) => {
    const sourceLine = event.target.closest?.("[data-source-line]");
    const startedOnBackground = event.target === preview || Boolean(sourceLine);
    if (!startedOnBackground || (event.pointerType === "mouse" && event.button !== 0)) return;
    const startX = event.clientX; const startY = event.clientY;
    const startLeft = preview.scrollLeft; const startTop = preview.scrollTop;
    let moved = false;
    preview.setPointerCapture(event.pointerId);
    preview.classList.add("is-panning");
    const move = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX; const deltaY = moveEvent.clientY - startY;
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) moved = true;
      preview.scrollLeft = startLeft - deltaX;
      preview.scrollTop = startTop - deltaY;
    };
    const finish = () => {
      preview.removeEventListener("pointermove", move);
      preview.removeEventListener("pointerup", finish);
      preview.removeEventListener("pointercancel", finish);
      preview.classList.remove("is-panning");
      if (moved) preview.dataset.panned = "true";
    };
    preview.addEventListener("pointermove", move);
    preview.addEventListener("pointerup", finish, { once: true });
    preview.addEventListener("pointercancel", finish, { once: true });
  });
  document.querySelector("#committed-window-divider").addEventListener("pointerdown", (event) => {
    const stacked = layoutMode.startsWith("stacked");
    const start = stacked ? event.clientY : event.clientX;
    const property = stacked ? "--committed-window-top" : "--committed-window-left";
    const initial = Number.parseFloat(getComputedStyle(layout).getPropertyValue(property)) || 48;
    const available = stacked ? layout.clientHeight : layout.clientWidth;
    const divider = event.currentTarget; divider.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      const current = stacked ? moveEvent.clientY : moveEvent.clientX;
      const next = Math.max(6, Math.min(94, initial + (current - start) / available * 100));
      if (stacked) stackedPaneSize = next; else sidePaneSize = next;
      layout.style.setProperty(property, `${next}%`);
    };
    divider.addEventListener("pointermove", move); divider.addEventListener("pointerup", () => { divider.removeEventListener("pointermove", move); applyDisplaySettings(); }, { once: true });
  });
  if (channel) channel.addEventListener("message", (event) => { if (event.data?.type === "score-state") applyState(event.data.payload); });
  window.addEventListener("storage", (event) => { if (event.key === STATE_KEY && event.newValue) { try { applyState(JSON.parse(event.newValue)); } catch (_error) {} } if (event.key === TEXT_KEY && event.newValue !== text.value) { text.value = event.newValue; appliedTranspose = 0; transposeCommitted = false; render(); } });
  try { const saved = JSON.parse(localStorage.getItem(displayKey) || "null"); if (saved) { fontSize.value = saved.fontSize || fontSize.value; font.value = saved.font || font.value; theme.value = saved.theme === "dark-gray" ? "dark" : saved.theme || theme.value; spelling.value = ["preserve", "sharp", "flat"].includes(saved.spelling) ? saved.spelling : spelling.value; transpose.value = String(Math.max(window.ChordWikiTranspose.transposeMin, Math.min(window.ChordWikiTranspose.transposeMax, Number(saved.transpose) || 0))); transposeCommitted = saved.transposeApplied === true; appliedTranspose = transposeCommitted ? Number(saved.appliedTranspose ?? saved.transpose) || 0 : 0; const savedCheckboxDefaults = saved.checkboxDefaultsVersion === 1; textColoring.checked = savedCheckboxDefaults ? saved.textColoring !== false : true; boldCode.checked = savedCheckboxDefaults ? saved.boldCode !== false : true; scrollSync.checked = savedCheckboxDefaults ? saved.scrollSync !== false : true; layoutMode = saved.layoutPreferenceVersion === 1 && layoutModes.includes(saved.layoutMode) ? saved.layoutMode : "stacked"; stackedLineHeight = Math.max(1.4, Math.min(3.2, Number.parseFloat(saved.stackedLineHeight) || 1.65)); sideLineHeight = Math.max(1.4, Math.min(3.2, Number.parseFloat(saved.sideLineHeight) || 2.75)); stackedPaneSize = Math.max(6, Math.min(94, Number.parseFloat(saved.stackedPaneSize) || 48)); sidePaneSize = Math.max(6, Math.min(94, Number.parseFloat(saved.sidePaneSize) || 48)); } } catch (_error) {}
  applyDisplaySettings();
  let savedDraft;
  try { savedDraft = JSON.parse(localStorage.getItem(DRAFT_KEY)); } catch (_error) { /* no readable draft */ }
  if (typeof savedDraft?.text === "string") {
    loadedDraftText = text.value = savedDraft.text;
    draftUpdatedAt = Number(savedDraft.updatedAt) || 0;
    if (savedDraft.unnamedSong) unnamedSong = savedDraft.unnamedSong;
  }
  if (!keepExistingDraft && !pendingReplace) { try { applyState(JSON.parse(localStorage.getItem(STATE_KEY) || "null")); } catch (_error) {} }
  if (!savedDraft && !text.value) { try { text.value = localStorage.getItem(TEXT_KEY) || ""; } catch (_error) {} }
  if (Number.isFinite(savedDraft?.historyDueAt) && text.value === savedDraft.text) queueHistory(text.value, savedDraft.historyDueAt);
  // A saved draft can already fill the textarea without producing the line
  // numbers, syntax layer, or score preview. Always perform an initial render.
  render();
  let pendingMusicXmlText = null;
  if (musicXmlHandoffText) {
    if (!text.value.trim()) {
      text.value = musicXmlHandoffText;
      appliedTranspose = 0;
      transposeCommitted = false;
      publishText();
    } else pendingMusicXmlText = musicXmlHandoffText;
  }
  if (pendingMusicXmlText) {
    replaceDialog.showModal();
    replaceDialog.addEventListener("close", () => {
      if (replaceDialog.returnValue === "yes") {
        text.value = pendingMusicXmlText;
        appliedTranspose = 0;
        transposeCommitted = false;
        publishText();
      }
      history.replaceState(null, "", window.location.pathname);
    }, { once: true });
  } else if (pendingReplace && loadedDraftText && loadedDraftText !== (localStorage.getItem(TEXT_KEY) || "")) {
    replaceDialog.showModal();
    replaceDialog.addEventListener("close", () => {
      if (replaceDialog.returnValue === "yes") {
        text.value = localStorage.getItem(TEXT_KEY) || "";
        publishText();
      }
      history.replaceState(null, "", window.location.pathname);
    }, { once: true });
  }
}());
