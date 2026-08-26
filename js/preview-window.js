(function () {
  "use strict";

  const STATE_KEY = "chordWikiBarFormatter.scoreWindow.v1";
  const CHANNEL_NAME = "chordWikiBarFormatter.scoreWindow.channel.v1";
  const preview = document.querySelector("#standalone-score-preview");
  const transpose = document.querySelector("#window-transpose");
  const transposeDown = document.querySelector("#window-transpose-down");
  const transposeUp = document.querySelector("#window-transpose-up");
  const spelling = document.querySelector("#window-spelling");
  const doubleSharp = document.querySelector("#window-double-sharp");
  const theoretical = document.querySelector("#window-theoretical");
  const barsThrough = document.querySelector("#window-bars-through");
  const status = document.querySelector("#score-window-status");
  const copy = document.querySelector("#window-copy");
  let channel = null;
  let lastMainUpdatedAt = 0;
  let state = {
    text: "",
    transpose: 0,
    spelling: "preserve",
    theoretical: false,
    doubleSharp: "##",
    keySections: [],
    barsThrough: false,
    theme: "light",
    editorFontStack: 'Meiryo, "Yu Gothic UI", "MS Gothic", sans-serif',
    editorFontSize: 14
  };

  ChordWikiTranspose.fillTransposeSelect(transpose);
  try {
    if ("BroadcastChannel" in window) channel = new BroadcastChannel(CHANNEL_NAME);
  } catch (_error) {
    channel = null;
  }

  function normalizedState(payload) {
    const candidate = payload || {};
    return {
      ...state,
      ...candidate,
      transpose: Math.max(-12, Math.min(12, Number(candidate.transpose) || 0)),
      spelling: ["preserve", "sharp", "flat"].includes(candidate.spelling) ? candidate.spelling : "preserve",
      theoretical: Boolean(candidate.theoretical),
      doubleSharp: candidate.doubleSharp === "x" ? "x" : "##",
      keySections: Array.isArray(candidate.keySections) ? candidate.keySections : [],
      barsThrough: Boolean(candidate.barsThrough),
      theme: candidate.theme === "dark-gray" ? "dark" : ["dark", "light"].includes(candidate.theme) ? candidate.theme : "light"
    };
  }

  function displayedText() {
    return ChordWikiTranspose.transposeText(state.text, state.transpose, state.spelling, state.theoretical, state.keySections, state.doubleSharp);
  }

  function updateTransposeButtons() {
    const amount = Number(transpose.value) || 0;
    transposeDown.disabled = amount <= -12;
    transposeUp.disabled = amount >= 12;
  }

  function stepTranspose(direction) {
    transpose.value = String(Math.max(-12, Math.min(12, (Number(transpose.value) || 0) + direction)));
    transpose.dispatchEvent(new Event("change", { bubbles: true }));
    (direction < 0 ? transposeDown : transposeUp).focus();
  }

  function render() {
    document.documentElement.dataset.theme = state.theme;
    if (state.editorFontStack) document.documentElement.style.setProperty("--editor-font", state.editorFontStack);
    document.documentElement.style.setProperty("--editor-font-size", `${Math.max(10, Math.min(24, Number(state.editorFontSize) || 14))}px`);
    transpose.value = String(state.transpose);
    updateTransposeButtons();
    spelling.value = state.spelling;
    theoretical.checked = state.theoretical;
    doubleSharp.value = state.doubleSharp;
    barsThrough.checked = state.barsThrough;
    preview.classList.toggle("bars-through", state.barsThrough);
    ChordWikiPreview.renderInto(preview, displayedText());
    if (!state.text) preview.innerHTML = '<p class="score-window-empty">元画面で譜面を作成すると、ここへ表示されます。</p>';
  }

  function applyMainState(payload) {
    if (!payload || payload.source !== "main") return;
    const updatedAt = Number(payload.updatedAt) || 0;
    if (updatedAt && updatedAt <= lastMainUpdatedAt) return;
    lastMainUpdatedAt = updatedAt;
    state = normalizedState(payload);
    render();
    status.textContent = "元画面と同期しています";
  }

  function publishControls() {
    state = normalizedState({
      ...state,
      source: "score-window",
      transpose: Number(transpose.value),
      spelling: spelling.value,
      theoretical: theoretical.checked,
      doubleSharp: doubleSharp.value,
      barsThrough: barsThrough.checked,
      updatedAt: Date.now()
    });
    const payload = { ...state, source: "score-window" };
    try { localStorage.setItem(STATE_KEY, JSON.stringify(payload)); } catch (_error) { /* live channel may still be available */ }
    if (channel) channel.postMessage({ type: "score-controls", payload });
    try {
      if (window.opener && !window.opener.closed) {
        const targetOrigin = window.location.origin === "null" ? "*" : window.location.origin;
        window.opener.postMessage({ type: "score-controls", payload }, targetOrigin);
      }
    } catch (_error) { /* storage and broadcast remain available */ }
    render();
    status.textContent = "表示設定を元画面へ反映しました";
  }

  [transpose, spelling, doubleSharp, theoretical, barsThrough].forEach((control) => control.addEventListener("change", publishControls));
  transposeDown.addEventListener("click", () => stepTranspose(-1));
  transposeUp.addEventListener("click", () => stepTranspose(1));
  copy.addEventListener("click", async () => {
    const text = displayedText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = "表示中の譜面をコピーしました";
    } catch (_error) {
      status.textContent = "コピーできませんでした";
    }
  });

  if (channel) {
    channel.addEventListener("message", (event) => {
      if (event.data?.type === "score-state") applyMainState(event.data.payload);
    });
  }
  window.addEventListener("storage", (event) => {
    if (event.key !== STATE_KEY || !event.newValue) return;
    try { applyMainState(JSON.parse(event.newValue)); } catch (_error) { /* ignore invalid state */ }
  });

  function refreshSavedState() {
    try { applyMainState(JSON.parse(localStorage.getItem(STATE_KEY) || "null")); }
    catch (_error) { /* direct opener synchronization may still work */ }
  }

  function requestMainState() {
    try {
      if (!window.opener || window.opener.closed) return;
      const targetOrigin = window.location.origin === "null" ? "*" : window.location.origin;
      window.opener.postMessage({ type: "score-request" }, targetOrigin);
    } catch (_error) { /* storage and broadcast remain available */ }
  }

  window.addEventListener("message", (event) => {
    const sameOrigin = event.origin === window.location.origin
      || (event.origin === "null" && window.location.origin === "null");
    if (!sameOrigin || event.data?.type !== "score-state") return;
    applyMainState(event.data.payload);
  });
  window.addEventListener("focus", () => { refreshSavedState(); requestMainState(); });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) { refreshSavedState(); requestMainState(); }
  });

  refreshSavedState();
  requestMainState();
  window.setInterval(() => { refreshSavedState(); requestMainState(); }, 750);
  if (!state.text) render();
}());
