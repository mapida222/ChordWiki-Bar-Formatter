"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const correctionInput = fs.readFileSync(path.join(root, "js", "correction-input.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

const correctionKeydownRoutes = app.match(/elements\.correction\.addEventListener\("keydown"/g) || [];
assert.strictEqual(correctionKeydownRoutes.length, 1, "row-edit keyboard input must have exactly one keydown route");
const correctionBeforeInputRoutes = app.match(/elements\.correction\.addEventListener\("beforeinput"/g) || [];
assert.strictEqual(correctionBeforeInputRoutes.length, 1, "row-edit must have one native/IME input fallback route");
assert.ok(app.includes('if (/^[0-9a-i@]$/i.test(event.key)) return;'), "keydown must leave beat input to the single beforeinput/input route");
assert.ok(app.includes('if (event.isComposing || event.keyCode === 229) return;'), "IME keydown must defer to beforeinput instead of advancing a second slot");
assert.ok(app.includes('CBFCorrectionInput.incrementalCompositionBeatInput(correctionCompositionValue, normalizedCharacters)'), "cumulative IME composition must apply only its newly added beat");
assert.ok(app.includes('CBFCorrectionInput.isRecentInputCommit(pendingCompositionCommit, pendingCompositionCommitAt, characters)'), "the final IME commit must not replay a beat after a row transition");
assert.ok(app.includes('characters: ""'), "a non-cancelable duplicate native input must restore the post-keydown selection without replaying the beat");
assert.ok(app.includes('const selectedSlot = !awaitingWhiteNoteDuration && correctionCaretMode === "slot"'), "beat input must target the visibly selected slot instead of a transient hidden caret");
assert.ok(app.includes("selectCorrectionSlot(lineIndex, selectedSlot.index + 1);"), "one accepted beat must advance exactly one visible slot inside a row");
assert.ok(app.includes("CBFCorrectionInput.nextLineWithBeatSlot(correctionLines, lineIndex)"), "typing the final beat must skip blank correction rows and find the next editable row");
assert.ok(app.includes("pendingNativeBeatReplacement"), "non-cancelable IME input must be restored and replaced after its native input event");
assert.ok(app.includes("const nativeCharacters = CBFCorrectionInput.normalizeBeatInputSequence(event.data);"), "an input event without a usable beforeinput must still restore and replay an IME sequence");
assert.ok(app.includes("const nativeSymbols = CBFCorrectionInput.normalizeBoundarySymbolSequence(event.data);"), "IME symbol input must use the boundary insertion route");
assert.ok(app.includes('&& !nativeCharacters'), "unsupported native or IME text must restore the previous row instead of deleting its selected beat");
assert.ok(app.includes('if (event.key.length === 1 && !event.isComposing)'), "unsupported printable keys must be blocked before replacing a selected beat");
assert.ok(app.includes("[...characters].forEach((character) => replaceActiveCorrectionBeat(character));"), "multi-character IME input must use the same ordered beat replacement route");
assert.ok(app.includes("const insertedBeat = CBFCorrectionInput.singleInsertedBeat(correctionHistoryValue, elements.correction.value);"), "an extra native beat must be detected even when event metadata is unavailable");
assert.ok(correctionInput.includes("syncopationRemovalEdit(line, start, end) || clearBeatEdit(line, start, end)"), "Backspace/Delete must remove s first, then clear compound row-edit units without orphan modifiers");
assert.ok(app.includes("CBFCorrectionInput.deletionEdit"), "Backspace/Delete must remove an attached sync marker before clearing its beat");
assert.ok(app.includes('if (event.key === "Enter")'), "Enter must not create an unpaired correction row");
assert.ok(app.includes('moveCorrectionSlot("ArrowDown")'), "Enter must move to the next existing correction row");
assert.ok(app.includes("CBFCorrectionInput.syncopationRemovalEdit"), "pressing s again must remove an existing sync marker");
assert.ok(app.includes('if (/^[x\\^*s|\\/]$/i.test(event.key))'), "slash must route through the same boundary-symbol handler as | ");
assert.ok(app.includes("restoreEditorScrollPositions(captureEditorScrollPositions());"), "boundary symbols must preserve the editor viewport while their active slot is refreshed");
assert.ok(app.includes("elements.correction.setSelectionRange(nextCaret, nextCaret);"), "white-note entry must leave a duration insertion point after @");
assert.ok(app.includes("const awaitingWhiteNoteDuration = textarea.selectionStart === textarea.selectionEnd"), "selection tracking must not reselect @ while waiting for its duration");
assert.ok(app.includes('let correctionCaretMode = "slot";'), "slot selection and boundary-symbol caret must use explicit interaction modes");
assert.ok(app.includes('correctionCaretMode = "boundary";'), "symbol insertion must preserve its resulting boundary caret");
assert.ok(app.includes('correctionCaretMode === "boundary"'), "position refresh must not force a boundary caret back onto the last beat");
assert.ok(app.includes('document.querySelectorAll("[data-correction-symbol]")'), "keyboard routing stays available after compact symbol buttons are removed");
assert.ok(html.includes('js/correction-input.js?v=20260802-11'), "the row-edit navigation helper must use the current correction-input cache version");
assert.ok(html.includes('js/app.js?v=20260802-35'), "the row-edit hotfix must use the current app.js cache version");

console.log("PASS: row-edit keys use one input route and the browser loads the hotfix version");
