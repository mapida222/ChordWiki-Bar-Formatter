import './transposer.js';
import {
  applyChordWikiAbbreviations,
  applyMusicXmlTimeChangeMarkers,
  convertMusicXmlText,
  DEFAULT_CHORD_WIKI_ABBREVIATIONS,
  scaleMusicXmlTempoMarkers,
} from './musicxml-converter.js';
import { normalizeStoredMusicXmlResult } from './musicxml-converter-storage.js';
import { confirmManualOutput } from './musicxml-output-state.js';

const $ = (id) => document.getElementById(id);
const BROWSER_RESULT_STORAGE_KEY = 'musicxmlConverter.lastResult.v1';
const ABBREVIATION_STORAGE_KEY = 'musicxmlConverter.abbreviations.v2';
const MUSICXML_TRANSPOSE_STORAGE_KEY = 'musicxmlConverter.transpose.v1';
const MUSICXML_HANDOFF_STORAGE_KEY = 'chordWikiBarFormatter.musicxmlHandoff.v1';
const ABBREVIATION_CYCLES = Object.freeze({
  major: ['maj', 'M'],
  augmented: ['aug', '+'],
  diminished: ['dim', 'o', '°'],
  halfDiminished: ['m7-5', 'ø'],
});
const ABBREVIATION_LABELS = Object.freeze({
  major: 'メジャー表記',
  augmented: 'オーギュメント表記',
  diminished: 'ディミニッシュ表記',
  halfDiminished: 'ハーフ・ディミニッシュ表記',
});
const ABBREVIATION_DISPLAY = Object.freeze({
  major: { maj: 'maj7', M: 'M7' },
});
const outputPreview = $('output-preview');
const outputHighlight = $('output-highlight');
const outputTextLayer = document.querySelector('.output-text-layer');
const colorToggle = $('text-coloring');
const inputCard = document.querySelector('.converter-input-card');
const dropZone = $('drop-zone');
const fileInput = $('file-input');
const fileSummary = $('file-summary');
const metrics = document.querySelector('.metrics');
const lyricMetric = $('lyric-metric');
const outputCard = document.querySelector('.output-card');
const outputEmptyState = $('output-empty-state');
const abbreviationControls = $('abbreviation-controls');
const reportToolsToggle = $('report-tools-toggle');
const reportTools = document.querySelector('.report-tools');
const reportToolsPanel = $('report-tools-panel');
const reportTempoCurrent = $('report-tempo-current');
const reportTempoButtons = [...document.querySelectorAll('[data-tempo-factor]')];
const transposeSelect = $('musicxml-transpose');
const transposeDown = $('musicxml-transpose-down');
const transposeUp = $('musicxml-transpose-up');
const formatterLink = $('musicxml-open-formatter');
const realtimeEditorLink = $('musicxml-open-realtime');

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function setWarnings(messages, { error = false } = {}) {
  const warningPanel = $('warnings');
  warningPanel.hidden = messages.length === 0;
  warningPanel.classList.toggle('is-error', error && messages.length > 0);
  warningPanel.setAttribute('role', error ? 'alert' : 'status');
  warningPanel.setAttribute('aria-live', error ? 'assertive' : 'polite');
  warningPanel.innerHTML = messages.length === 0 ? '' : `
    <div class="warnings-list">${messages.map((message) => `<p>⚠ ${escapeHtml(message)}</p>`).join('')}</div>
    <div class="warnings-actions">
      <span>元のXMLを修正したら、もう一度読み込めます。</span>
      <button id="warning-reload-button" class="warning-reload-button" type="button">修正したXMLを読み込む</button>
    </div>`;
}

function bindCardDisclosure(toggleId, cardSelector) {
  const toggle = $(toggleId);
  const card = document.querySelector(cardSelector);
  if (!toggle || !card) return;
  toggle.addEventListener('click', () => {
    const collapsed = card.classList.toggle('is-collapsed');
    toggle.setAttribute('aria-expanded', String(!collapsed));
  });
}

function colorizeOutput(text) {
  const tokenPattern = /(\{[^{}\r\n]*\}|\[[^\[\]\r\n]*\]|\|)/g;
  let html = '';
  let lastIndex = 0;
  for (const match of text.matchAll(tokenPattern)) {
    html += escapeHtml(text.slice(lastIndex, match.index));
    const token = match[0];
    let className = '';
    if (token === '|') className = 'syntax-bracket';
    else if (/^\{\s*key\s*:/i.test(token)) className = 'syntax-key';
    else if (token.startsWith('{')) className = 'syntax-directive';
    else {
      const inner = token.slice(1, -1);
      className = inner !== '|' && !/^[\s\-=>≧○]+$/.test(inner) ? 'syntax-chord' : 'syntax-bracket';
    }
    const safeToken = escapeHtml(token);
    html += className ? `<span class="${className}">${safeToken}</span>` : safeToken;
    lastIndex = match.index + token.length;
  }
  return html + escapeHtml(text.slice(lastIndex));
}

function syncOutputHighlight() {
  if (!outputPreview || !outputHighlight) return;
  outputHighlight.style.transform = `translate(${-outputPreview.scrollLeft}px, ${-outputPreview.scrollTop}px)`;
}

function renderOutput() {
  if (!outputPreview || !outputHighlight || !outputTextLayer) return;
  outputHighlight.innerHTML = colorizeOutput(outputPreview.value);
  outputTextLayer.classList.toggle('colorized-output', colorToggle?.checked === true);
  syncOutputHighlight();
}
let latest = null;
let transposeAmount = 0;
let tempoFactor = 1;
let generatedOutput = '';
const OUTPUT_OVERWRITE_MESSAGE = '手動で編集した内容があります。\nこの操作を行うと生成結果で上書きされます。\n\nこのまま反映しますか？';
const RESET_OUTPUT_MESSAGE = '手動で編集した内容も削除されます。\nリセットしますか？';
function loadAbbreviations() {
  try {
    const saved = JSON.parse(localStorage.getItem(ABBREVIATION_STORAGE_KEY) || 'null');
    return Object.fromEntries(Object.entries(ABBREVIATION_CYCLES).map(([key, choices]) => [
      key,
      choices.includes(saved?.[key]) ? saved[key] : DEFAULT_CHORD_WIKI_ABBREVIATIONS[key],
    ]));
  } catch (_error) {
    return { ...DEFAULT_CHORD_WIKI_ABBREVIATIONS };
  }
}

function saveAbbreviations() {
  try { localStorage.setItem(ABBREVIATION_STORAGE_KEY, JSON.stringify(abbreviations)); } catch (_error) {}
}

function loadTransposeAmount() {
  try {
    const saved = Number.parseInt(localStorage.getItem(MUSICXML_TRANSPOSE_STORAGE_KEY) || '0', 10);
    const min = window.ChordWikiTranspose?.transposeMin ?? -5;
    const max = window.ChordWikiTranspose?.transposeMax ?? 6;
    return Number.isFinite(saved) ? Math.max(min, Math.min(max, saved)) : 0;
  } catch (_error) {
    return 0;
  }
}

function saveTransposeAmount() {
  try { localStorage.setItem(MUSICXML_TRANSPOSE_STORAGE_KEY, String(transposeAmount)); } catch (_error) {}
}

function numericBpm(value) {
  const parsed = Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatBpm(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(1)));
}

function applyTempoFactor(text) {
  const bpm = numericBpm(latest?.bpm);
  if (!bpm || tempoFactor === 1) return text;
  return text.replace(/(\{c:BPM=)([^　}\r\n]+)/u, `$1${formatBpm(bpm * tempoFactor)}`);
}

function refreshReportTools() {
  const bpm = numericBpm(latest?.bpm);
  if (reportTempoCurrent) reportTempoCurrent.textContent = bpm ? `XML: ${formatBpm(bpm)} → 出力: ${formatBpm(bpm * tempoFactor)}` : 'XML BPMを読み込むと調整できます';
  reportTempoButtons.forEach((button) => {
    const enabled = Boolean(latest && bpm);
    button.disabled = !enabled;
    button.setAttribute('aria-pressed', String(Number(button.dataset.tempoFactor) === tempoFactor));
  });
}

function refreshAbbreviationControls() {
  abbreviationControls?.querySelectorAll('button[data-abbreviation]').forEach((button) => {
    const key = button.dataset.abbreviation;
    const choices = ABBREVIATION_CYCLES[key];
    const current = abbreviations[key];
    const next = choices?.[(choices.indexOf(current) + 1) % choices.length] ?? current;
    const display = ABBREVIATION_DISPLAY[key] || {};
    const currentLabel = display[current] || current;
    const nextLabel = display[next] || next;
    button.textContent = currentLabel;
    button.disabled = !latest;
    button.setAttribute('aria-label', `${ABBREVIATION_LABELS[key]}: ${currentLabel}。クリックで${nextLabel}に切り替え`);
  });
}

function refreshTransposeControls() {
  if (transposeSelect) {
    transposeSelect.value = String(transposeAmount);
    transposeSelect.disabled = !latest;
  }
  if (transposeDown) transposeDown.disabled = !latest;
  if (transposeUp) transposeUp.disabled = !latest;
}

let abbreviations = loadAbbreviations();
transposeAmount = loadTransposeAmount();
let loadRequestId = 0;
let copyFeedbackTimer = null;

function confirmOutputOverwrite(message = OUTPUT_OVERWRITE_MESSAGE) {
  return confirmManualOutput({
    latest,
    currentText: outputPreview.value,
    generatedText: generatedOutput,
    message,
    confirm: (text) => window.confirm(text),
  });
}

function setEmptyOutputState(message) {
  outputCard?.classList.add('is-placeholder');
  outputCard?.classList.remove('has-error');
  if (outputEmptyState) outputEmptyState.textContent = message;
  outputPreview.value = '';
  outputPreview.readOnly = true;
  generatedOutput = '';
  renderOutput();
}

function resetCopyButton() {
  if (copyFeedbackTimer !== null) {
    window.clearTimeout(copyFeedbackTimer);
    copyFeedbackTimer = null;
  }
  $('copy-button').textContent = 'コピー';
  $('copy-button').setAttribute('aria-label', 'ChordPro形式出力をコピー');
}

function showCopyFeedback(label) {
  if (copyFeedbackTimer !== null) window.clearTimeout(copyFeedbackTimer);
  $('copy-button').textContent = label;
  $('copy-button').setAttribute('aria-label', label);
  copyFeedbackTimer = window.setTimeout(() => {
    copyFeedbackTimer = null;
    resetCopyButton();
  }, 1800);
}
outputPreview.addEventListener('scroll', syncOutputHighlight);
outputPreview.addEventListener('input', renderOutput);
outputPreview.addEventListener('input', refreshReportTools);
colorToggle.addEventListener('change', renderOutput);
renderOutput();
refreshAbbreviationControls();

function renderLatestOutput() {
  if (!latest) return;
  let text = applyChordWikiAbbreviations(applyMusicXmlTimeChangeMarkers(latest.chordWiki, latest.measures), abbreviations);
  text = scaleMusicXmlTempoMarkers(text, tempoFactor);
  text = applyTempoFactor(text);
  if (transposeAmount && window.ChordWikiTranspose?.transposeText) {
    text = window.ChordWikiTranspose.transposeText(text, transposeAmount, 'preserve');
  }
  outputPreview.value = text;
  outputPreview.readOnly = false;
  generatedOutput = text;
  renderOutput();
}

function saveBrowserResult(result, fileName, fileSize) {
  try {
    const storedResult = {
      title: result.title,
      partName: result.partName,
      bpm: result.bpm,
      timeSignature: result.timeSignature,
      measures: result.measures,
      harmonyCount: result.harmonyCount,
      lyricCount: result.lyricCount,
      warnings: result.warnings,
      chordWiki: result.chordWiki,
    };
    localStorage.setItem(BROWSER_RESULT_STORAGE_KEY, JSON.stringify({ result: storedResult, fileName, fileSize }));
  } catch (_error) {
    // ブラウザー保存が使えない環境でも変換自体は継続する。
  }
}

function saveMusicXmlHandoff(target) {
  if (!latest || !outputPreview?.value.trim()) return false;
  try {
    localStorage.setItem(MUSICXML_HANDOFF_STORAGE_KEY, JSON.stringify({
      target,
      text: outputPreview.value,
      transpose: 0,
      resetTranspose: true,
      createdAt: Date.now(),
    }));
    return true;
  } catch (_error) {
    return false;
  }
}

formatterLink?.addEventListener('click', () => saveMusicXmlHandoff('formatter'));
realtimeEditorLink?.addEventListener('click', () => saveMusicXmlHandoff('realtime'));

function clearBrowserResult() {
  try { localStorage.removeItem(BROWSER_RESULT_STORAGE_KEY); } catch (_error) {}
}

function setReplacingState(replacing) {
  if (!inputCard || !dropZone || !fileSummary || fileSummary.classList.contains('hidden')) return;
  inputCard.classList.toggle('is-replacing', replacing);
  dropZone.classList.toggle('hidden', !replacing);
  dropZone.classList.toggle('dragging', replacing);
}

function setResult(result, { fileName = '', fileSize = 0, persist = true, preserveTranspose = false } = {}) {
  latest = result;
  tempoFactor = 1;
  if (!preserveTranspose) {
    transposeAmount = 0;
    saveTransposeAmount();
  }
  outputCard?.classList.remove('is-placeholder');
  outputCard?.classList.remove('has-error');
  inputCard?.classList.remove('is-replacing');
  $('output-source-name').textContent = fileName || result.title || 'ブラウザー保存結果';
  $('drop-zone').classList.add('hidden');
  $('file-summary').classList.remove('hidden');
  $('file-name').textContent = fileName || result.title || 'ブラウザー保存結果';
  $('file-meta').textContent = fileSize ? `${Math.ceil(fileSize / 1024)} KB` : 'ブラウザー保存';
  renderLatestOutput();
  $('measure-count').textContent = result.measures.length;
  $('harmony-count').textContent = result.harmonyCount;
  $('lyric-count').textContent = result.lyricCount;
  $('time-signature').textContent = result.timeSignature || '—';
  $('bpm').textContent = result.bpm || '—';
  lyricMetric?.classList.toggle('hidden', result.lyricCount === 0);
  metrics?.classList.toggle('has-lyrics', result.lyricCount > 0);
  const warningCount = result.warnings.length;
  $('result-status').textContent = warningCount ? `確認あり（${warningCount}件）` : '変換\n完了';
  $('result-status').className = `status ${warningCount ? 'warn' : 'ok'}`;
  setWarnings(result.warnings);
  resetCopyButton();
  $('copy-button').disabled = false;
  refreshAbbreviationControls();
  refreshTransposeControls();
  refreshReportTools();
  if (persist) saveBrowserResult(result, fileName, fileSize);
}

function restoreBrowserResult() {
  try {
    const saved = JSON.parse(localStorage.getItem(BROWSER_RESULT_STORAGE_KEY) || 'null');
    const normalized = normalizeStoredMusicXmlResult(saved);
    if (!normalized) {
      if (saved !== null) clearBrowserResult();
      return;
    }
    setResult(normalized.result, {
      fileName: normalized.fileName,
      fileSize: normalized.fileSize,
      persist: false,
      preserveTranspose: true,
    });
  } catch (_error) {
    clearBrowserResult();
  }
}
function reset() {
  if (!confirmOutputOverwrite(RESET_OUTPUT_MESSAGE)) return;
  loadRequestId += 1;
  latest = null;
  transposeAmount = 0;
  tempoFactor = 1;
  saveTransposeAmount();
  refreshTransposeControls();
  refreshAbbreviationControls();
  refreshReportTools();
  inputCard?.classList.remove('is-replacing');
  $('output-source-name').textContent = 'ファイル未選択';
  clearBrowserResult();
  $('file-input').value = '';
  $('file-summary').classList.add('hidden');
  $('drop-zone').classList.remove('hidden');
  setEmptyOutputState('MusicXMLファイルを選択すると、ここに変換結果が表示されます。');
  for (const id of ['measure-count', 'harmony-count', 'lyric-count', 'time-signature', 'bpm']) $(id).textContent = '—';
  lyricMetric?.classList.add('hidden');
  metrics?.classList.remove('has-lyrics');
  setWarnings([]);
  $('result-status').textContent = '待機中';
  $('result-status').className = 'status neutral';
  resetCopyButton();
  $('copy-button').disabled = true;
}

async function loadFile(file) {
  if (!file) return;
  if (!confirmOutputOverwrite()) {
    if (fileInput) fileInput.value = '';
    return;
  }
  const requestId = ++loadRequestId;
  clearBrowserResult();
  latest = null;
  transposeAmount = 0;
  tempoFactor = 1;
  saveTransposeAmount();
  refreshTransposeControls();
  refreshAbbreviationControls();
  refreshReportTools();
  setEmptyOutputState('MusicXMLを読み取っています…');
  resetCopyButton();
  $('result-status').textContent = '読み取り中';
  $('result-status').className = 'status neutral';
  $('copy-button').disabled = true;
  for (const id of ['measure-count', 'harmony-count', 'lyric-count', 'time-signature', 'bpm']) $(id).textContent = '—';
  lyricMetric?.classList.add('hidden');
  metrics?.classList.remove('has-lyrics');
  setWarnings([]);
  $('drop-zone').classList.add('hidden');
  $('file-summary').classList.remove('hidden');
  $('file-name').textContent = file.name;
  $('file-meta').textContent = `${Math.ceil(file.size / 1024)} KB`;
  $('output-source-name').textContent = file.name;
  try {
    const sourceText = await file.text();
    if (requestId !== loadRequestId) return;
    const result = convertMusicXmlText(sourceText);
    setResult(result, { fileName: file.name, fileSize: file.size });
  } catch (error) {
    if (requestId !== loadRequestId) return;
    latest = null;
    transposeAmount = 0;
    tempoFactor = 1;
    saveTransposeAmount();
    refreshTransposeControls();
    refreshAbbreviationControls();
    refreshReportTools();
    outputCard?.classList.remove('is-placeholder');
    outputCard?.classList.add('has-error');
    outputPreview.readOnly = true;
    generatedOutput = '';
    $('result-status').textContent = '読み取り失敗';
    $('result-status').className = 'status warn';
    $('output-preview').value = error.message;
    renderOutput();
    resetCopyButton();
    $('copy-button').disabled = true;
    const errorMessage = error instanceof Error && error.message
      ? error.message
      : 'MusicXMLを読み取れませんでした。';
    setWarnings([
      errorMessage,
      '元のXMLを手動で修正してから、もう一度読み込んでください。',
    ], { error: true });
  }
}

$('file-input').addEventListener('change', (event) => loadFile(event.target.files[0]));
document.querySelector('#warnings')?.addEventListener('click', (event) => {
  if (!event.target.closest('#warning-reload-button') || !fileInput) return;
  fileInput.value = '';
  fileInput.click();
});
$('drop-zone').addEventListener('dragover', (event) => { event.preventDefault(); $('drop-zone').classList.add('dragging'); });
$('drop-zone').addEventListener('dragleave', () => $('drop-zone').classList.remove('dragging'));
$('drop-zone').addEventListener('drop', (event) => { event.preventDefault(); $('drop-zone').classList.remove('dragging'); loadFile(event.dataTransfer.files[0]); });
inputCard?.addEventListener('dragover', (event) => {
  if (fileSummary.classList.contains('hidden')) return;
  event.preventDefault();
  event.stopPropagation();
  setReplacingState(true);
});
inputCard?.addEventListener('dragleave', (event) => {
  if (fileSummary.classList.contains('hidden')) return;
  if (!inputCard.contains(event.relatedTarget)) setReplacingState(false);
});
inputCard?.addEventListener('drop', (event) => {
  if (fileSummary.classList.contains('hidden')) return;
  event.preventDefault();
  event.stopPropagation();
  setReplacingState(false);
  loadFile(event.dataTransfer.files[0]);
});
$('clear-button').addEventListener('click', reset);
$('remove-file').addEventListener('click', reset);
bindCardDisclosure('source-toggle', '.converter-input-card');
bindCardDisclosure('report-toggle', '.report-card');
function setReportToolsOpen(open) {
  if (!reportToolsPanel || !reportToolsToggle) return;
  reportToolsPanel.hidden = !open;
  reportTools?.classList.toggle('is-open', open);
  if (open && reportTools) {
    const anchor = reportTools.getBoundingClientRect();
    const toggle = reportToolsToggle.getBoundingClientRect();
    const viewportPadding = 12;
    const gap = 6;
    const maxWidth = Math.min(260, Math.max(144, window.innerWidth - viewportPadding * 2));
    const availableLeft = Math.max(144, toggle.left - viewportPadding - gap);
    const panelWidth = Math.min(maxWidth, availableLeft);
    const panelLeft = Math.max(viewportPadding, toggle.left - panelWidth - gap);
    reportToolsPanel.style.width = `${panelWidth}px`;
    reportToolsPanel.style.left = `${panelLeft - anchor.left}px`;
    reportToolsPanel.style.right = 'auto';
  }
  reportToolsToggle.setAttribute('aria-expanded', String(open));
  reportToolsToggle.setAttribute('aria-label', `BPM設定を${open ? '閉じる' : '開く'}`);
  reportToolsToggle.textContent = `${open ? '◀' : '▶'}BPM設定`;
}
reportToolsToggle?.addEventListener('click', () => setReportToolsOpen(reportToolsPanel?.hidden === true));
reportTempoButtons.forEach((button) => button.addEventListener('click', () => {
  if (!latest || !numericBpm(latest.bpm)) return;
  if (!confirmOutputOverwrite()) return;
  tempoFactor = Number(button.dataset.tempoFactor) || 1;
  renderLatestOutput();
  refreshReportTools();
}));
window.ChordWikiTranspose?.fillTransposeSelect(transposeSelect);
refreshTransposeControls();
transposeSelect?.addEventListener('change', () => {
  const nextAmount = Number.parseInt(transposeSelect.value, 10) || 0;
  if (!latest || !confirmOutputOverwrite()) {
    refreshTransposeControls();
    return;
  }
  transposeAmount = nextAmount;
  saveTransposeAmount();
  renderLatestOutput();
});
function stepTranspose(direction) {
  if (!latest || !window.ChordWikiTranspose) return;
  if (!confirmOutputOverwrite()) return;
  const min = window.ChordWikiTranspose.transposeMin;
  const max = window.ChordWikiTranspose.transposeMax;
  transposeAmount = transposeAmount + direction;
  if (transposeAmount < min) transposeAmount = max;
  if (transposeAmount > max) transposeAmount = min;
  saveTransposeAmount();
  refreshTransposeControls();
  renderLatestOutput();
}
transposeDown?.addEventListener('click', () => stepTranspose(-1));
transposeUp?.addEventListener('click', () => stepTranspose(1));
abbreviationControls?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-abbreviation]');
  const key = button?.dataset.abbreviation;
  const choices = ABBREVIATION_CYCLES[key];
  if (!latest || !choices || !confirmOutputOverwrite()) return;
  const currentIndex = choices.indexOf(abbreviations[key]);
  abbreviations = { ...abbreviations, [key]: choices[(currentIndex + 1) % choices.length] };
  saveAbbreviations();
  renderLatestOutput();
  refreshAbbreviationControls();
});
$('copy-button').addEventListener('click', async () => {
  if (!latest) return;
  try {
    await navigator.clipboard.writeText(outputPreview.value);
    showCopyFeedback('コピーしました');
  } catch (_error) {
    showCopyFeedback('コピー失敗');
  }
});

restoreBrowserResult();
refreshReportTools();
