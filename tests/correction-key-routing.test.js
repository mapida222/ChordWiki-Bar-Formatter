"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

const correctionKeydownRoutes = app.match(/elements\.correction\.addEventListener\("keydown"/g) || [];
assert.strictEqual(correctionKeydownRoutes.length, 1, "row-edit keyboard input must have exactly one keydown route");
const correctionBeforeInputRoutes = app.match(/elements\.correction\.addEventListener\("beforeinput"/g) || [];
assert.strictEqual(correctionBeforeInputRoutes.length, 1, "row-edit must have one native/IME input fallback route");
assert.ok(app.includes('replaceActiveCorrectionBeat(event.key);'), "keydown beat input must use the shared replacement route");
assert.ok(app.includes("pendingNativeBeatReplacement"), "non-cancelable IME input must be restored and replaced after its native input event");
assert.ok(app.includes("const nativeCharacters = CBFCorrectionInput.normalizeBeatInputSequence(event.data);"), "an input event without a usable beforeinput must still restore and replay an IME sequence");
assert.ok(app.includes("[...characters].forEach((character) => replaceActiveCorrectionBeat(character));"), "multi-character IME input must use the same ordered beat replacement route");
assert.ok(app.includes("const insertedBeat = CBFCorrectionInput.singleInsertedBeat(correctionHistoryValue, elements.correction.value);"), "an extra native beat must be detected even when event metadata is unavailable");
assert.ok(app.includes("CBFCorrectionInput.clearBeatEdit"), "Backspace/Delete must clear compound row-edit units without orphan modifiers");
assert.ok(app.includes("CBFCorrectionInput.syncopationRemovalEdit"), "pressing s again must remove an existing sync marker");
assert.ok(app.includes("elements.correction.setSelectionRange(nextCaret, nextCaret);"), "white-note entry must leave a duration insertion point after @");
assert.ok(app.includes("const awaitingWhiteNoteDuration = textarea.selectionStart === textarea.selectionEnd"), "selection tracking must not reselect @ while waiting for its duration");
assert.ok(html.includes('js/app.js?v=20260731-10'), "the row-edit hotfix must use the current app.js cache version");

console.log("PASS: row-edit keys use one input route and the browser loads the hotfix version");
