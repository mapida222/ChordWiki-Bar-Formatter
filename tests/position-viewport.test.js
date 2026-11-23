const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(process.argv[2] || path.join(__dirname, '..', 'js', 'committed-preview-window.js'), 'utf8').replace(/\r\n/g, '\n');
const selection = source.slice(source.indexOf('  const setActiveChord ='), source.indexOf('  const selectRelativeChord ='));
const mode = source.slice(source.indexOf('  const setPositionMode ='), source.indexOf('  document.addEventListener("keydown", handlePositionShortcut'));
const start = source.indexOf('  const preservePositionViewport =');
const preserve = start < 0 ? '' : source.slice(start, source.indexOf('  const setActiveChord =', start));
for (const operation of ['setActiveChord(range, { focus: false })', 'setActiveChord(range)', 'setPositionMode(true)', 'setPositionMode(false)']) {
  const noop = () => {};
  const element = (top, left) => ({ scrollTop: top, scrollLeft: left, classList: { add: noop, remove: noop }, setAttribute: noop, style: {} });
  const text = element(480, 35), preview = element(720, 60), page = element(90, 8);
  text.setSelectionRange = () => { text.scrollTop = text.scrollLeft = 0; };
  text.focus = () => { page.scrollTop = 0; };
  text.blur = noop;
  const context = {
    text, preview, document: { scrollingElement: page },
    lines: element(480, 0), highlight: { style: {} }, suppressedScrollPositions: new WeakMap(),
    range: { start: 0, end: 3, lineIndex: 0 },
    chordAtPosition: () => context.range, chordRanges: () => [context.range],
    setActiveLine: noop, positionStatus: noop,
    syncPreviewHeaderHeight: () => { preview.scrollTop += 5; },
    render: () => { preview.scrollTop = text.scrollTop; preview.scrollLeft = 0; },
    positionToggle: element(0, 0), editorPane: element(0, 0), previewPane: element(0, 0),
    positionHelp: {}, previewModeStatus: {}, positionUndoStack: [], positionRedoStack: [],
    positionAdjustMode: false, positionSpaceKeyDown: false, includePositionSymbols: false, activeChordStart: -1,
  };
  vm.runInNewContext(preserve + selection + mode + operation, context);
  assert.deepEqual([text.scrollTop, text.scrollLeft, preview.scrollTop, preview.scrollLeft, page.scrollTop, page.scrollLeft], [480, 35, 720, 60, 90, 8], operation + ' must preserve the viewports through selection, layout and rendering');
}
console.log('PASS: selection and mode changes preserve all viewports');
