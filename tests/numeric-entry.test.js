"use strict";

const assert = require("assert");
global.window = global;
require("../js/numeric-entry.js");

const handlers = {};
const container = {
  addEventListener(type, handler) { handlers[type] = handler; }
};
const ownerDocument = { activeElement: null };
let inputEvents = 0;
const input = {
  value: "8",
  ownerDocument,
  matches(selector) { return selector === 'input[inputmode="numeric"]'; },
  setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; },
  dispatchEvent(event) { if (event.type === "input") inputEvents += 1; }
};
const event = (extra = {}) => ({
  target: input,
  defaultPrevented: false,
  preventDefault() { this.defaultPrevented = true; },
  ...extra
});

CBFNumericEntry.attach(container);

handlers.focusin(event());
const firstDigit = event({ key: "1" });
handlers.keydown(firstDigit);
assert.strictEqual(input.value, "1");
assert(firstDigit.defaultPrevented);

const secondDigit = event({ key: "2" });
handlers.keydown(secondDigit);
assert(!secondDigit.defaultPrevented, "the second digit must use normal browser editing so multi-digit values remain possible");
input.value += secondDigit.key;
assert.strictEqual(input.value, "12");

input.value = "8";
handlers.focusin(event());
const backspace = event({ key: "Backspace" });
handlers.keydown(backspace);
assert(!backspace.defaultPrevented, "editing keys must retain their browser behavior");

handlers.focusin(event());
ownerDocument.activeElement = input;
handlers.pointerdown(event());
const explicitlyPositionedDigit = event({ key: "4" });
handlers.keydown(explicitlyPositionedDigit);
assert(!explicitlyPositionedDigit.defaultPrevented, "an explicit pointer caret move must cancel replacement mode");

input.value = "8";
ownerDocument.activeElement = null;
handlers.focusin(event());
const paste = event({ clipboardData: { getData: () => "16" } });
handlers.paste(paste);
assert.strictEqual(input.value, "16");
assert(paste.defaultPrevented);
assert.strictEqual(inputEvents, 2, "replacement typing and replacement paste must notify existing validation listeners");

console.log("PASS: SETTINGS-001 first-entry numeric replacement");
