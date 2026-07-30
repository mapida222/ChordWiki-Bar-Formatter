(function () {
  "use strict";

  function attach(container) {
    const replaceOnNextEntry = new WeakSet();
    const isNumericInput = (target) => Boolean(target?.matches?.('input[inputmode="numeric"]'));
    const dispatchInput = (target) => target.dispatchEvent(new Event("input", { bubbles: true }));

    container.addEventListener("focusin", (event) => {
      if (isNumericInput(event.target)) replaceOnNextEntry.add(event.target);
    });
    container.addEventListener("pointerdown", (event) => {
      if (isNumericInput(event.target) && event.target.ownerDocument?.activeElement === event.target) {
        replaceOnNextEntry.delete(event.target);
      }
    });
    container.addEventListener("keydown", (event) => {
      const input = event.target;
      if (!isNumericInput(input)) return;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Backspace", "Delete"].includes(event.key)) {
        replaceOnNextEntry.delete(input);
        return;
      }
      if (!replaceOnNextEntry.has(input) || !/^\d$/u.test(event.key) || event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();
      input.value = event.key;
      input.setSelectionRange?.(input.value.length, input.value.length);
      replaceOnNextEntry.delete(input);
      dispatchInput(input);
    });
    container.addEventListener("paste", (event) => {
      const input = event.target;
      if (!isNumericInput(input) || !replaceOnNextEntry.has(input)) return;
      const pasted = event.clipboardData?.getData("text").trim() || "";
      if (!/^\d+$/u.test(pasted)) return;
      event.preventDefault();
      input.value = pasted;
      input.setSelectionRange?.(input.value.length, input.value.length);
      replaceOnNextEntry.delete(input);
      dispatchInput(input);
    });
  }

  window.CBFNumericEntry = { attach };
}());
