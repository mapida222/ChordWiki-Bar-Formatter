(function () {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const card = $(".correction-card");
  const toolbar = $(".correction-symbol-toolbar");
  const editor = $("#correction-text");
  const output = $("#output-text");
  const panel = $("#mobile-correction-focus");
  const rowLabel = $("#mobile-correction-row");
  const result = $("#mobile-correction-result");
  const preview = $("#mobile-correction-preview");
  const done = $("#mobile-correction-done");
  const placeholder = $("#mobile-correction-placeholder");
  const more = $("#mobile-correction-more");
  const symbols = $("#mobile-correction-symbols");
  const heading = $(".correction-card .editor-heading");
  if (!card || !toolbar || !editor || !panel) return;
  const narrow = window.matchMedia("(max-width: 699px)");
  heading.setAttribute("tabindex", "-1");
  let active = false;
  let lineIndex = 0;
  let lastVisibleLine = -1;
  let framePending = false;
  const originalInputMode = editor.getAttribute("inputmode");
  let pagePosition;
  let lastResult = null;
  let pointerSelecting = false;
  function configureKeyboard() {
    if (narrow.matches) editor.setAttribute("inputmode", "numeric");
    else if (originalInputMode === null) editor.removeAttribute("inputmode");
    else editor.setAttribute("inputmode", originalInputMode);
  }
  configureKeyboard();

  function refresh() {
    framePending = false;
    if (!active) return;
    const viewport = window.visualViewport;
    const top = viewport?.offsetTop || 0;
    const left = viewport?.offsetLeft || 0;
    const height = viewport?.height || window.innerHeight;
    const width = viewport?.width || window.innerWidth;
    for (const surface of [card, toolbar]) {
      if (height < 420) surface.classList.add("mobile-correction-tight");
      else surface.classList.remove("mobile-correction-tight");
    }
    const toolbarHeight = toolbar.getBoundingClientRect().height;
    const properties = {
      "--mobile-edit-top": `${top + 8}px`,
      "--mobile-edit-left": `${left + 8}px`,
      "--mobile-edit-width": `${Math.max(0, width - 16)}px`,
      "--mobile-edit-height": `${Math.max(0, height - toolbarHeight - 16)}px`,
      "--mobile-toolbar-top": `${top + height - toolbarHeight - 8}px`
    };
    for (const [name, value] of Object.entries(properties)) {
      card.style.setProperty(name, value);
      toolbar.style.setProperty(name, value);
    }
    rowLabel.textContent = `${lineIndex + 1}行目を編集中`;
    const text = output.value.split(/\r\n|\r|\n/)[lineIndex] || "";
    result.textContent = text || "（空行）";
    if (preview && window.ChordWikiPreview && text !== lastResult) {
      window.ChordWikiPreview.renderInto(preview, text);
      lastResult = text;
    }
    // Layout owns scrolling only; the original app still owns values, selection,
    // slots, composition and Undo. Never reparent or replace the focused editor.
    if (lastVisibleLine !== lineIndex) {
      const computed = window.getComputedStyle(editor);
      const lineHeight = Number.parseFloat(computed.lineHeight) || 26;
      const padding = Number.parseFloat(computed.paddingTop) || 0;
      editor.scrollTop = Math.max(0, padding + lineIndex * lineHeight - (editor.clientHeight - lineHeight) / 2);
      lastVisibleLine = lineIndex;
    }
  }
  function schedule() {
    if (!active || framePending) return;
    framePending = true;
    window.requestAnimationFrame(refresh);
  }
  function start() {
    if (active || !narrow.matches) return;
    active = true;
    pagePosition = { top: window.scrollY, left: window.scrollX };
    placeholder.style.height = `${card.getBoundingClientRect().height}px`;
    placeholder.hidden = false;
    panel.hidden = false;
    card.classList.add("mobile-correction-active");
    toolbar.classList.add("mobile-correction-active");
    lastVisibleLine = -1;
    schedule();
  }
  function stop() {
    if (!active) return;
    active = false;
    card.classList.remove("mobile-correction-active");
    toolbar.classList.remove("mobile-correction-active");
    placeholder.hidden = true;
    panel.hidden = true;
    symbols.classList.remove("mobile-symbols-expanded");
    more.setAttribute("aria-expanded", "false");
    configureKeyboard();
    window.scrollTo(pagePosition);
  }
  document.addEventListener("cbf:linked-position", (event) => {
    lineIndex = Math.max(0, event.detail.lineIndex);
    schedule();
  });
  const requestStart = () => window.requestAnimationFrame(() => {
    if (!pointerSelecting && document.activeElement === editor) start();
  });
  // A first tap must select its original row before the card changes position.
  editor.addEventListener("pointerdown", () => { pointerSelecting = true; });
  document.addEventListener("pointerup", () => { pointerSelecting = false; requestStart(); });
  document.addEventListener("pointercancel", () => { pointerSelecting = false; });
  editor.addEventListener("focus", requestStart);
  editor.addEventListener("click", requestStart);
  // Keyboard navigation to the toolbar keeps the panel open. Leaving the editing
  // surface restores ordinary layout; pointer symbol handlers preserve focus.
  const checkFocus = () => window.requestAnimationFrame(() => {
    const target = document.activeElement;
    if (!card.contains(target) && !toolbar.contains(target)) stop();
  });
  card.addEventListener("focusout", checkFocus);
  toolbar.addEventListener("focusout", checkFocus);
  done.addEventListener("click", () => {
    editor.blur();
    stop();
    heading.focus({ preventScroll: true });
  });
  more.addEventListener("pointerdown", (event) => event.preventDefault());
  more.addEventListener("click", () => {
    const expanded = more.getAttribute("aria-expanded") !== "true";
    more.setAttribute("aria-expanded", String(expanded));
    if (expanded) symbols.classList.add("mobile-symbols-expanded");
    else symbols.classList.remove("mobile-symbols-expanded");
    schedule();
  });
  narrow.addEventListener("change", () => { if (!narrow.matches) stop(); configureKeyboard(); });
  window.addEventListener("resize", schedule);
  window.visualViewport?.addEventListener("resize", schedule);
  window.visualViewport?.addEventListener("scroll", schedule);
}());
