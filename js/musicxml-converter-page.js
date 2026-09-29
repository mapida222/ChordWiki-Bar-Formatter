import {
  applyChordWikiAbbreviations,
  convertMusicXmlText,
  DEFAULT_CHORD_WIKI_ABBREVIATIONS,
} from './musicxml-converter.js';
import { normalizeStoredMusicXmlResult } from './musicxml-converter-storage.js';

const $ = (id) => document.getElementById(id);
const BROWSER_RESULT_STORAGE_KEY = 'musicxmlConverter.lastResult.v1';
const ABBREVIATION_STORAGE_KEY = 'musicxmlConverter.abbreviations.v2';
const MUSICXML_TRANSPOSE_STORAGE_KEY = 'musicxmlConverter.transpose.v1';
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
const fileSummary = $('file-summary');
const metrics = document.querySelector('.metrics');
const lyricMetric = $('lyric-metric');
const outputCard = document.querySelector('.output-card');
const abbreviationControls = $('abbreviation-controls');
const transposeSelect = $('musicxml-transpose');
const transposeDown = $('musicxml-transpose-down');
const transposeUp = $('musicxml-transpose-up');

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function setWarnings(messages) {
  const warningPanel = $('warnings');
  warningPanel.hidden = messages.length === 0;
  warningPanel.innerHTML = messages.map((message) => `<p>⚠ ${escapeHtml(message)}</p>`).join('');
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

function resetCopyButton() {
  if (copyFeedbackTimer !== null) {
    window.clearTimeout(copyFeedbackTimer);
    copyFeedbackTimer = null;
  }
  $('copy-button').textContent = 'コピー';
  $('copy-button').setAttribute('aria-label', 'ChordWiki出力をコピー');
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
colorToggle.addEventListener('change', renderOutput);
renderOutput();
refreshAbbreviationControls();

function renderLatestOutput() {
  if (!latest) return;
  let text = applyChordWikiAbbreviations(latest.chordWiki, abbreviations);
  if (transposeAmount && window.ChordWikiTranspose?.transposeText) {
    text = window.ChordWikiTranspose.transposeText(text, transposeAmount, 'preserve');
  }
  outputPreview.value = text;
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

function clearBrowserResult() {
  try { localStorage.removeItem(BROWSER_RESULT_STORAGE_KEY); } catch (_error) {}
}

function setResult(result, { fileName = '', fileSize = 0, persist = true, preserveTranspose = false } = {}) {
  latest = result;
  if (!preserveTranspose) {
    transposeAmount = 0;
    saveTransposeAmount();
  }
  outputCard?.classList.remove('is-placeholder');
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
  loadRequestId += 1;
  outputCard?.classList.add('is-placeholder');
  latest = null;
  transposeAmount = 0;
  saveTransposeAmount();
  refreshTransposeControls();
  refreshAbbreviationControls();
  $('output-source-name').textContent = 'ファイル未選択';
  clearBrowserResult();
  $('file-input').value = '';
  $('file-summary').classList.add('hidden');
  $('drop-zone').classList.remove('hidden');
  $('output-preview').value = 'MusicXMLを選択すると、ここに変換結果が表示されます。';
  renderOutput();
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
  const requestId = ++loadRequestId;
  clearBrowserResult();
  latest = null;
  transposeAmount = 0;
  saveTransposeAmount();
  refreshTransposeControls();
  refreshAbbreviationControls();
  outputCard?.classList.add('is-placeholder');
  resetCopyButton();
  $('result-status').textContent = '読み取り中';
  $('result-status').className = 'status neutral';
  $('copy-button').disabled = true;
  $('output-preview').value = 'MusicXMLを読み取っています…';
  renderOutput();
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
    saveTransposeAmount();
    refreshTransposeControls();
    refreshAbbreviationControls();
    outputCard?.classList.add('is-placeholder');
    $('result-status').textContent = '読み取り失敗';
    $('result-status').className = 'status warn';
    $('output-preview').value = error.message;
    renderOutput();
    resetCopyButton();
    $('copy-button').disabled = true;
    setWarnings(['MusicXMLを読み取れませんでした。']);
  }
}

$('file-input').addEventListener('change', (event) => loadFile(event.target.files[0]));
$('drop-zone').addEventListener('dragover', (event) => { event.preventDefault(); $('drop-zone').classList.add('dragging'); });
$('drop-zone').addEventListener('dragleave', () => $('drop-zone').classList.remove('dragging'));
$('drop-zone').addEventListener('drop', (event) => { event.preventDefault(); $('drop-zone').classList.remove('dragging'); loadFile(event.dataTransfer.files[0]); });
inputCard?.addEventListener('dragover', (event) => {
  if (fileSummary.classList.contains('hidden')) return;
  event.preventDefault();
  event.stopPropagation();
  inputCard.classList.add('is-replacing');
});
inputCard?.addEventListener('dragleave', (event) => {
  if (fileSummary.classList.contains('hidden')) return;
  if (!inputCard.contains(event.relatedTarget)) inputCard.classList.remove('is-replacing');
});
inputCard?.addEventListener('drop', (event) => {
  if (fileSummary.classList.contains('hidden')) return;
  event.preventDefault();
  event.stopPropagation();
  inputCard.classList.remove('is-replacing');
  loadFile(event.dataTransfer.files[0]);
});
$('clear-button').addEventListener('click', reset);
$('remove-file').addEventListener('click', reset);
bindCardDisclosure('source-toggle', '.converter-input-card');
bindCardDisclosure('report-toggle', '.report-card');
window.ChordWikiTranspose?.fillTransposeSelect(transposeSelect);
refreshTransposeControls();
transposeSelect?.addEventListener('change', () => {
  transposeAmount = Number.parseInt(transposeSelect.value, 10) || 0;
  saveTransposeAmount();
  renderLatestOutput();
});
function stepTranspose(direction) {
  if (!latest || !window.ChordWikiTranspose) return;
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
  if (!latest || !choices) return;
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
