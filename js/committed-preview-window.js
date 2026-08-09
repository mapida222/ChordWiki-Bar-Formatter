(function () {
  "use strict";
  const STATE_KEY = "chordWikiBarFormatter.scoreWindow.v1";
  const CHANNEL_NAME = "chordWikiBarFormatter.scoreWindow.channel.v1";
  const TEXT_KEY = "chordWikiBarFormatter.committedOutput.v1";
  const DRAFT_KEY = "chordWikiBarFormatter.committedWindowDraft.v1";
  const keepExistingDraft = new URLSearchParams(window.location.search).get("draft") === "keep";
  const layout = document.querySelector("#committed-window-layout");
  const text = document.querySelector("#committed-window-text");
  const lines = document.querySelector("#committed-window-lines");
  const highlight = document.querySelector("#committed-window-highlight");
  const preview = document.querySelector("#committed-window-preview");
  const status = document.querySelector("#committed-window-status");
  const layoutToggle = document.querySelector("#committed-layout-toggle");
  const width = document.querySelector("#committed-pane-width");
  const fontSize = document.querySelector("#committed-font-size");
  const fontSizeValue = document.querySelector("#committed-font-size-value");
  const lineHeight = document.querySelector("#committed-line-height");
  const lineHeightValue = document.querySelector("#committed-line-height-value");
  const font = document.querySelector("#committed-font");
  const theme = document.querySelector("#committed-theme");
  const textColoring = document.querySelector("#committed-text-coloring");
  const boldCode = document.querySelector("#committed-bold-code");
  const scrollSync = document.querySelector("#committed-scroll-sync");
  const transpose = document.querySelector("#committed-transpose");
  const transposeDown = document.querySelector("#committed-transpose-down");
  const transposeUp = document.querySelector("#committed-transpose-up");
  let channel = null;
  let syncingScroll = false;
  let activeLine = 0;
  let draftUpdatedAt = 0;
  let layoutMode = "stacked";
  let stackedLineHeight = 1.65;
  let sideLineHeight = 2.75;
  let stackedPaneSize = 48;
  let sidePaneSize = 48;
  try { if ("BroadcastChannel" in window) channel = new BroadcastChannel(CHANNEL_NAME); } catch (_error) { channel = null; }
  function render() {
    const escape = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // The editor must remain readable even when a preview-only token cannot
    // be drawn. Render the editable text and its line numbers first.
    const tokenPattern = /(\{[^{}\r\n]*\}|\[[^\[\]\r\n]*\]|\|)/g;
    let lastIndex = 0;
    highlight.innerHTML = [...text.value.matchAll(tokenPattern)].map((match) => {
      const token = match[0]; const inner = token.slice(1, -1);
      const className = token === "|" || (token.startsWith("[") && (inner === "|" || /^[\s\-=>≧○]+$/.test(inner))) ? "syntax-bracket" : /^\{\s*key\s*:/i.test(token) ? "syntax-key" : token.startsWith("{") ? "syntax-directive" : "syntax-chord";
      const before = escape(text.value.slice(lastIndex, match.index)); lastIndex = match.index + token.length;
      return `${before}<span class="${className}">${escape(token)}</span>`;
    }).join("") + escape(text.value.slice(lastIndex));
    const count = Math.max(1, text.value.split(/\r\n|\r|\n/).length);
    lines.innerHTML = Array.from({ length: count }, (_, index) => `<span>${index + 1}</span>`).join("");
    lines.scrollTop = text.scrollTop;
    try {
      const previewText = window.ChordWikiTranspose
        ? window.ChordWikiTranspose.transposeText(text.value, transpose.value, "preserve")
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
    setActiveLine(activeLine);
  }
  function setActiveLine(index) {
    activeLine = Math.max(0, Math.min(Math.max(0, text.value.split(/\r\n|\r|\n/).length - 1), index));
    const textStyle = getComputedStyle(text);
    const lineHeight = Number.parseFloat(textStyle.lineHeight) || 23;
    const paddingTop = Number.parseFloat(textStyle.paddingTop) || 0;
    const contentLineTop = paddingTop + activeLine * lineHeight;
    highlight.classList.add("active-line-visible");
    highlight.style.setProperty("--active-line-top", `${contentLineTop}px`);
    highlight.style.setProperty("--active-line-height", `${lineHeight}px`);
    text.classList.add("active-line-visible");
    text.style.setProperty("--active-line-top", `${contentLineTop - text.scrollTop}px`);
    text.style.setProperty("--active-line-height", `${lineHeight}px`);
    [...lines.children].forEach((line, lineIndex) => line.classList.toggle("active-line", lineIndex === activeLine));
    [...preview.querySelectorAll("[data-source-line]")].forEach((line) => line.classList.toggle("compare-active", Number(line.dataset.sourceLine) === activeLine));
  }
  function applyState(payload) {
    if (!payload) return;
    const next = String(payload.committedText ?? "");
    if (document.activeElement !== text && Number(payload.updatedAt) >= draftUpdatedAt && next !== text.value) text.value = next;
    render();
  }
  function publishText() {
    const payload = { type: "committed-text", text: text.value };
    draftUpdatedAt = Date.now();
    try { localStorage.setItem(TEXT_KEY, text.value); localStorage.setItem(DRAFT_KEY, JSON.stringify({ text: text.value, updatedAt: draftUpdatedAt })); } catch (_error) { /* opener/channel can still sync */ }
    if (channel) channel.postMessage(payload);
    try { if (window.opener && !window.opener.closed) window.opener.postMessage(payload, window.location.origin === "null" ? "*" : window.location.origin); } catch (_error) { /* ignore */ }
    render(); status.textContent = "譜面プレビューへリアルタイムで反映しました。";
  }
  text.addEventListener("input", publishText);
  ["click", "keyup", "select", "focus"].forEach((eventName) => text.addEventListener(eventName, () => setActiveLine(text.value.slice(0, text.selectionStart).split(/\r\n|\r|\n/).length - 1)));
  text.addEventListener("scroll", () => { lines.scrollTop = text.scrollTop; setActiveLine(activeLine); });
  text.addEventListener("scroll", () => {
    highlight.style.transform = `translate(${-text.scrollLeft}px, ${-text.scrollTop}px)`;
    if (syncingScroll || !scrollSync.checked) return;
    syncingScroll = true; preview.scrollTop = text.scrollTop; preview.scrollLeft = text.scrollLeft; requestAnimationFrame(() => { syncingScroll = false; });
  });
  preview.addEventListener("scroll", () => {
    if (syncingScroll || !scrollSync.checked) return;
    syncingScroll = true; text.scrollTop = preview.scrollTop; text.scrollLeft = preview.scrollLeft; lines.scrollTop = text.scrollTop; highlight.style.transform = `translate(${-text.scrollLeft}px, ${-text.scrollTop}px)`; requestAnimationFrame(() => { syncingScroll = false; });
  });
  preview.addEventListener("click", (event) => {
    if (preview.dataset.panned === "true") { preview.dataset.panned = "false"; event.preventDefault(); return; }
    const line = event.target.closest("[data-source-line]");
    if (!line) return;
    setActiveLine(Number(line.dataset.sourceLine));
  });
  const displayKey = "chordWikiBarFormatter.committedWindowDisplay.v1";
  window.ChordWikiTranspose?.fillTransposeSelect(transpose);
  function updateTransposeButtons() {
    const amount = Number(transpose.value) || 0;
    transposeDown.disabled = amount <= -12;
    transposeUp.disabled = amount >= 12;
  }
  const applyLayoutMode = () => {
    const stacked = layoutMode === "stacked";
    const currentLineHeight = stacked ? stackedLineHeight : sideLineHeight;
    layout.classList.toggle("committed-window-stacked", stacked);
    layout.style.setProperty(stacked ? "--committed-window-top" : "--committed-window-left", `${stacked ? stackedPaneSize : sidePaneSize}%`);
    layout.style.setProperty("--committed-line-height", String(currentLineHeight));
    lineHeight.value = String(currentLineHeight);
    lineHeightValue.textContent = `${Number(currentLineHeight).toFixed(2)}倍`;
    layoutToggle.textContent = stacked ? "左右比較へ" : "上下比較へ";
    layoutToggle.setAttribute("aria-pressed", String(stacked));
    const divider = document.querySelector("#committed-window-divider");
    divider.setAttribute("aria-orientation", stacked ? "horizontal" : "vertical");
    divider.setAttribute("aria-label", stacked ? "テキストとプレビューの高さを調整" : "テキストとプレビューの幅を調整");
  };
  const applyDisplaySettings = () => {
    layout.style.setProperty("--editor-font-size", `${fontSize.value}px`);
    fontSizeValue.textContent = `${fontSize.value}px`;
    document.documentElement.style.setProperty("--editor-font", font.value);
    document.documentElement.dataset.theme = theme.value;
    document.documentElement.classList.toggle("colorized-editors", textColoring.checked);
    document.documentElement.classList.toggle("bold-chords", boldCode.checked);
    applyLayoutMode();
    requestAnimationFrame(() => setActiveLine(activeLine));
    updateTransposeButtons();
    try { localStorage.setItem(displayKey, JSON.stringify({ fontSize: fontSize.value, font: font.value, theme: theme.value, textColoring: textColoring.checked, boldCode: boldCode.checked, scrollSync: scrollSync.checked, transpose: transpose.value, layoutMode, layoutPreferenceVersion: 1, checkboxDefaultsVersion: 1, stackedLineHeight, sideLineHeight, stackedPaneSize, sidePaneSize })); } catch (_error) {}
  };
  [fontSize, font, theme, textColoring, boldCode, scrollSync].forEach((control) => control.addEventListener("input", applyDisplaySettings));
  lineHeight.addEventListener("input", () => {
    const next = Math.max(1.4, Math.min(3.2, Number.parseFloat(lineHeight.value) || 1.65));
    if (layoutMode === "stacked") stackedLineHeight = next; else sideLineHeight = next;
    applyDisplaySettings();
  });
  layoutToggle.addEventListener("click", () => { layoutMode = layoutMode === "side" ? "stacked" : "side"; applyDisplaySettings(); });
  transpose.addEventListener("change", () => { applyDisplaySettings(); render(); });
  const stepTranspose = (delta) => {
    transpose.value = String(Math.max(-12, Math.min(12, (Number(transpose.value) || 0) + delta)));
    applyDisplaySettings();
    render();
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
    const stacked = layoutMode === "stacked";
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
  window.addEventListener("storage", (event) => { if (event.key === STATE_KEY && event.newValue) { try { applyState(JSON.parse(event.newValue)); } catch (_error) {} } if (event.key === TEXT_KEY && event.newValue !== text.value) { text.value = event.newValue; render(); } });
  try { const saved = JSON.parse(localStorage.getItem(displayKey) || "null"); if (saved) { fontSize.value = saved.fontSize || fontSize.value; font.value = saved.font || font.value; theme.value = saved.theme || theme.value; transpose.value = String(Math.max(-12, Math.min(12, Number(saved.transpose) || 0))); const savedCheckboxDefaults = saved.checkboxDefaultsVersion === 1; textColoring.checked = savedCheckboxDefaults ? saved.textColoring !== false : true; boldCode.checked = savedCheckboxDefaults ? saved.boldCode !== false : true; scrollSync.checked = savedCheckboxDefaults ? saved.scrollSync !== false : true; layoutMode = saved.layoutPreferenceVersion === 1 && saved.layoutMode === "side" ? "side" : "stacked"; stackedLineHeight = Math.max(1.4, Math.min(3.2, Number.parseFloat(saved.stackedLineHeight) || 1.65)); sideLineHeight = Math.max(1.4, Math.min(3.2, Number.parseFloat(saved.sideLineHeight) || 2.75)); stackedPaneSize = Math.max(6, Math.min(94, Number.parseFloat(saved.stackedPaneSize) || 48)); sidePaneSize = Math.max(6, Math.min(94, Number.parseFloat(saved.sidePaneSize) || 48)); } } catch (_error) {}
  applyDisplaySettings();
  try { const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); if (draft?.text) { text.value = draft.text; draftUpdatedAt = Number(draft.updatedAt) || 0; } } catch (_error) {}
  if (!keepExistingDraft) { try { applyState(JSON.parse(localStorage.getItem(STATE_KEY) || "null")); } catch (_error) {} }
  if (!text.value) { try { text.value = localStorage.getItem(TEXT_KEY) || ""; } catch (_error) {} }
  // A saved draft can already fill the textarea without producing the line
  // numbers, syntax layer, or score preview. Always perform an initial render.
  render();
}());
