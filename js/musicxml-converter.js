const EMPTY = '';

function childElements(element, name) {
  return Array.from(element?.children ?? []).filter((child) => child.localName === name);
}

function firstChild(element, name) {
  return childElements(element, name)[0] ?? null;
}

function textOf(element, name) {
  return firstChild(element, name)?.textContent?.trim() ?? EMPTY;
}

function integerOf(element, name, fallback = 0) {
  const value = Number.parseInt(textOf(element, name), 10);
  return Number.isFinite(value) ? value : fallback;
}

function numberOf(element, name, fallback = 0) {
  const value = Number(textOf(element, name));
  return Number.isFinite(value) ? value : fallback;
}

function localName(element) {
  return element?.localName ?? element?.nodeName?.split(':').pop() ?? EMPTY;
}

function keySignatureOf(attributes) {
  const key = firstChild(attributes, 'key');
  if (!key) return EMPTY;
  const fifths = textOf(key, 'fifths');
  const mode = textOf(key, 'mode') || 'major';
  return `${fifths}:${mode}`;
}

function descendants(element, name) {
  const result = [];
  const visit = (node) => {
    for (const child of Array.from(node?.children ?? [])) {
      if (localName(child) === name) result.push(child);
      visit(child);
    }
  };
  visit(element);
  return result;
}

function normalizeKind(kind) {
  const value = String(kind || '').toLowerCase();
  const names = {
    major: '', minor: 'm', diminished: 'dim', augmented: 'aug', dominant: '7',
    'major-seventh': 'maj7', 'minor-seventh': 'm7', 'diminished-seventh': 'dim7',
    'half-diminished': 'm7-5', 'minor-sixth': 'm6',
    'suspended-fourth': 'sus4', 'suspended-second': 'sus2',
    power: '5',
  };
  return names[value] ?? (value && value !== 'none' ? value : EMPTY);
}

export const DEFAULT_CHORD_WIKI_ABBREVIATIONS = Object.freeze({
  major: 'M',
  augmented: 'aug',
  diminished: 'dim',
  halfDiminished: 'm7-5',
});

function abbreviationChoice(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function abbreviateChordToken(token, abbreviations) {
  const match = /^([A-G](?:#|b)?)(.*)$/u.exec(token);
  if (!match) return token;
  const root = match[1];
  let qualityAndBass = match[2];
  const bassMatch = /\/[A-G](?:#|b)?$/u.exec(qualityAndBass);
  const bass = bassMatch?.[0] ?? EMPTY;
  if (bass) qualityAndBass = qualityAndBass.slice(0, -bass.length);

  const major = abbreviationChoice(abbreviations.major, ['M', 'maj'], 'maj');
  const augmented = abbreviationChoice(abbreviations.augmented, ['+', 'aug'], 'aug');
  const diminished = abbreviationChoice(abbreviations.diminished, ['o', '°', 'dim'], 'dim');
  const halfDiminished = abbreviationChoice(abbreviations.halfDiminished, ['ø', 'm7-5'], 'm7-5');

  if (qualityAndBass.startsWith('maj') && qualityAndBass.length > 3) qualityAndBass = `${major}${qualityAndBass.slice(3)}`;
  else if (qualityAndBass.startsWith('M') && qualityAndBass.length > 1) qualityAndBass = `${major}${qualityAndBass.slice(1)}`;
  else if (qualityAndBass.startsWith('aug')) qualityAndBass = `${augmented}${qualityAndBass.slice(3)}`;
  else if (qualityAndBass.startsWith('+')) qualityAndBass = `${augmented}${qualityAndBass.slice(1)}`;
  else if (qualityAndBass.startsWith('dim')) qualityAndBass = `${diminished}${qualityAndBass.slice(3)}`;
  else if (qualityAndBass.startsWith('o') || qualityAndBass.startsWith('°')) qualityAndBass = `${diminished}${qualityAndBass.slice(1)}`;
  else if (qualityAndBass.startsWith('m7-5')) qualityAndBass = `${halfDiminished}${qualityAndBass.slice(4)}`;
  else if (qualityAndBass.startsWith('ø')) qualityAndBass = `${halfDiminished}${qualityAndBass.slice(1)}`;
  return `${root}${qualityAndBass}${bass}`;
}

export function applyChordWikiAbbreviations(text, abbreviations = DEFAULT_CHORD_WIKI_ABBREVIATIONS) {
  return String(text).replace(/\[([^\]\r\n]*)\]/gu, (_match, token) => `[${abbreviateChordToken(token, abbreviations)}]`);
}

function harmonyLabel(harmony) {
  if (harmony.kind === 'none') return 'N.C.';
  const root = harmony.rootStep + (harmony.rootAlter === 1 ? '#' : harmony.rootAlter === -1 ? 'b' : '');
  const kind = normalizeKind(harmony.kind);
  const bass = harmony.bassStep
    ? `/${harmony.bassStep}${harmony.bassAlter === 1 ? '#' : harmony.bassAlter === -1 ? 'b' : ''}`
    : EMPTY;
  return `${root}${kind}${bass}`;
}

function parseHarmony(element) {
  const root = firstChild(element, 'root');
  const kind = textOf(element, 'kind');
  const bass = firstChild(element, 'bass');
  return {
    kind,
    rootStep: textOf(root, 'root-step'),
    rootAlter: numberOf(root, 'root-alter', 0),
    bassStep: textOf(bass, 'bass-step'),
    bassAlter: numberOf(bass, 'bass-alter', 0),
    offset: numberOf(element, 'offset', 0),
    label: harmonyLabel({
      kind,
      rootStep: textOf(root, 'root-step'),
      rootAlter: numberOf(root, 'root-alter', 0),
      bassStep: textOf(bass, 'bass-step'),
      bassAlter: numberOf(bass, 'bass-alter', 0),
    }),
  };
}

function gridIndexForPosition(position, divisions, cellsPerQuarter) {
  return Math.round((position / divisions) * cellsPerQuarter);
}

function addHarmony(grid, harmony, position, divisions, cellsPerQuarter, warnings, measureNumber) {
  const rawIndex = (position / divisions) * cellsPerQuarter;
  const index = Math.round(rawIndex);
  if (Math.abs(rawIndex - index) > 1e-9) {
    warnings.push(`小節${measureNumber}の${harmony.label}は8分音符グリッドに乗らないため出力できません。`);
    return false;
  }
  if (index < 0 || index >= grid.length) {
    warnings.push(`小節${measureNumber}の${harmony.label}は小節範囲外のため出力できません。`);
    return false;
  }
  if (grid[index] && grid[index] !== harmony.label) {
    warnings.push(`小節${measureNumber}の拍位置にコードが重複しています。`);
    return false;
  }
  grid[index] = harmony.label;
  return true;
}

function hasParallelTimelines(measure) {
  const timelineKeys = new Set();
  let hasNotes = false;
  let hasBackup = false;
  for (const child of Array.from(measure.children ?? [])) {
    const name = localName(child);
    if (name === 'note') {
      hasNotes = true;
      const voice = textOf(child, 'voice');
      const staff = textOf(child, 'staff');
      timelineKeys.add(`${staff}\u0000${voice}`);
    } else if (name === 'backup') {
      hasBackup = true;
    }
  }
  return timelineKeys.size > 1 || (hasBackup && hasNotes);
}

function measureDuration(measure, divisions, beats, beatType) {
  const nominal = divisions * beats * (4 / beatType);
  let cursor = 0;
  let maximum = 0;
  for (const child of Array.from(measure.children ?? [])) {
    if (localName(child) === 'note') {
      const duration = integerOf(child, 'duration', 0);
      if (!childElements(child, 'chord').length) cursor += duration;
      maximum = Math.max(maximum, cursor);
    } else if (localName(child) === 'forward') {
      cursor += integerOf(child, 'duration', 0);
      maximum = Math.max(maximum, cursor);
    } else if (localName(child) === 'backup') {
      cursor = Math.max(0, cursor - integerOf(child, 'duration', 0));
    }
  }
  return hasParallelTimelines(measure) ? nominal : Math.max(nominal, maximum);
}

function defaultHyphenSpacing(beatType) {
  return beatType === 8 ? 3 : 4;
}

function formatHyphens(count, spacing) {
  if (count <= 0) return EMPTY;
  if (spacing <= 0) return '-'.repeat(count);
  const groups = [];
  let remaining = count;
  while (remaining > 0) {
    const width = Math.min(spacing, remaining);
    groups.push('-'.repeat(width));
    remaining -= width;
  }
  return groups.join(' ');
}

function formatMeasure(measure) {
  const output = [];
  const halfMeasure = measure.cells % 2 === 0 ? measure.cells / 2 : null;
  let position = 0;
  while (position < measure.cells) {
    let next = position + 1;
    while (next < measure.cells && !measure.grid[next]) next += 1;
    if (measure.grid[position]) output.push(`[${measure.grid[position]}]`);
    while (position < next) {
      const chunkEnd = halfMeasure !== null && position < halfMeasure && halfMeasure < next
        ? halfMeasure
        : next;
      output.push('-'.repeat(chunkEnd - position));
      position = chunkEnd;
      if (position === halfMeasure && position < measure.cells && !measure.grid[position]) output.push(' ');
    }
  }
  const meterChange = measure.timeChange ? `(${measure.time})` : EMPTY;
  return `|${meterChange}${output.join('')}|`;
}


function findRehearsal(measure) {
  return descendants(measure, 'rehearsal')[0]?.textContent?.trim() ?? EMPTY;
}

function fullWidthLatin(value) {
  return String(value).replace(/[A-Za-z]/g, (character) => String.fromCharCode(character.charCodeAt(0) + 0xfee0));
}

function joinMeasureLines(measureLines) {
  return measureLines.map((line, index) => index ? line.slice(1) : line).join('');
}

function formatMeasureGroups(measures) {
  const lines = [];
  const measureLines = measures.map(formatMeasure);
  for (let index = 0; index < measureLines.length; index += 4) {
    lines.push(joinMeasureLines(measureLines.slice(index, index + 4)));
  }
  return lines;
}

export function applyMusicXmlTimeChangeMarkers(text, measures = []) {
  let measureIndex = 0;
  return String(text).replace(/\|([^|\r\n]*)/gu, (match, body) => {
    if (!body) return match;
    const measure = measures[measureIndex];
    const previous = measureIndex > 0 ? measures[measureIndex - 1] : null;
    measureIndex += 1;
    if (!measure) return match;
    const time = String(measure.time || '');
    const changed = Boolean(time && previous?.time && time !== previous.time);
    const withoutExistingMarker = body.replace(/^\(\d+\/\d+\)/u, '');
    return `|${changed ? `(${time})` : ''}${withoutExistingMarker}`;
  });
}

function tempoBarMatches(text) {
  return [...String(text).matchAll(/(?=(\|(?:\([^|\r\n]*\))?[^|\r\n]*\|))/gu)]
    .map((match) => ({ index: match.index, 0: match[1] }));
}

function tempoRehearsalMarkers(text, matches) {
  const markers = new Map();
  for (const match of String(text).matchAll(/\{c:【[^}\r\n]+】\}/gu)) {
    const sourceBarIndex = matches.findIndex((bar) => bar.index > match.index);
    if (sourceBarIndex < 0) continue;
    const current = markers.get(sourceBarIndex) || [];
    current.push(match[0]);
    markers.set(sourceBarIndex, current);
  }
  return markers;
}

function parseTempoBar(segment) {
  const body = segment.slice(1, -1);
  const markerMatch = /^\(([^)]+)\)/u.exec(body);
  const marker = markerMatch ? markerMatch[1] : '';
  const content = markerMatch ? body.slice(markerMatch[0].length) : body;
  const events = [];
  let position = 0;
  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (character === '[') {
      const end = content.indexOf(']', index + 1);
      if (end >= 0) {
        const label = content.slice(index + 1, end);
        if (label && label !== '|') events.push({ label, position });
        index = end;
      }
    } else if (character === '-') {
      position += 1;
    } else if (character === '=') {
      position += 0.5;
    }
  }
  return { marker, events, units: position || 8 };
}

function formatTempoHyphens(units) {
  const count = Math.max(0, Math.round(units));
  if (!count) return '';
  const groups = [];
  let remaining = count;
  while (remaining >= 4) {
    groups.push('----');
    remaining -= 4;
  }
  if (remaining) groups.push('-'.repeat(remaining));
  return groups.join(' ');
}

function formatTempoDuration(units, useSixteenths = false) {
  if (units <= 0) return '';
  const doubled = Math.max(1, Math.round(units * 2));
  if (useSixteenths || Math.abs(units - Math.round(units)) > 0.001) return '='.repeat(doubled);
  return formatTempoHyphens(units);
}

function renderTempoBar(events, units, marker = '') {
  const sortedEvents = events
    .filter((event) => event.position >= 0 && event.position < units)
    .sort((left, right) => left.position - right.position);
  const fractionalPosition = sortedEvents.find((event) => Math.abs(event.position - Math.round(event.position)) > 0.001)?.position;
  let output = marker ? `(${marker})` : '';
  let position = 0;
  for (const event of sortedEvents) {
    if (event.position > position) {
      output += formatTempoDuration(event.position - position, fractionalPosition !== undefined && position >= fractionalPosition);
    }
    output += `[${event.label}]`;
    position = event.position;
  }
  output += formatTempoDuration(units - position, fractionalPosition !== undefined && position >= fractionalPosition);
  return `|${output}|`;
}

export function scaleMusicXmlTempoMarkers(text, factor = 1) {
  const source = String(text);
  const numericFactor = Number(factor);
  if (!Number.isFinite(numericFactor) || numericFactor <= 0 || numericFactor === 1) return source;
  const matches = tempoBarMatches(source);
  if (!matches.length) return source;

  const bars = matches.map((match) => parseTempoBar(match[0]));
  const targetUnits = bars[0].units || 8;
  const starts = [];
  let sourcePosition = 0;
  bars.forEach((bar) => {
    starts.push(sourcePosition);
    sourcePosition += bar.units || targetUnits;
  });
  const mappedEvents = [];
  bars.forEach((bar, barIndex) => {
    bar.events.forEach((event) => {
      mappedEvents.push({
        label: event.label,
        position: (starts[barIndex] + event.position) * numericFactor,
      });
    });
  });
  mappedEvents.sort((left, right) => left.position - right.position);
  const outputBarCount = Math.max(1, Math.ceil((sourcePosition * numericFactor) / targetUnits - 0.000001));
  const sourceRehearsalMarkers = tempoRehearsalMarkers(source, matches);
  const outputRehearsalMarkers = new Map();
  sourceRehearsalMarkers.forEach((markers, sourceBarIndex) => {
    const targetBarIndex = Math.min(outputBarCount - 1, Math.floor((starts[sourceBarIndex] * numericFactor) / targetUnits));
    outputRehearsalMarkers.set(targetBarIndex, [
      ...(outputRehearsalMarkers.get(targetBarIndex) || []),
      ...markers,
    ]);
  });
  const outputBars = [];
  for (let barIndex = 0; barIndex < outputBarCount; barIndex += 1) {
    const start = barIndex * targetUnits;
    const end = start + targetUnits;
    const previous = [...mappedEvents].reverse().find((event) => event.position < start);
    const events = [];
    const hasEventAtStart = mappedEvents.some((event) => event.position === start);
    if (previous && !hasEventAtStart) events.push({ label: previous.label, position: 0 });
    mappedEvents
      .filter((event) => event.position >= start && event.position < end)
      .forEach((event) => {
        const position = Math.round((event.position - start) * 2) / 2;
        const last = events[events.length - 1];
        if (last?.label === event.label && last.position === position) return;
        if (last?.label === event.label) return;
        events.push({ label: event.label, position });
      });
    const sourceBarIndex = Math.min(bars.length - 1, Math.floor(start / Math.max(1, targetUnits * numericFactor)));
    outputBars.push(renderTempoBar(events, targetUnits, bars[sourceBarIndex]?.marker));
  }

  const firstMatch = matches[0];
  const lastMatch = matches[matches.length - 1];
  const leading = source.slice(0, firstMatch.index).replace(/\{c:【[^}\r\n]+】\}\s*$/u, '');
  const trailing = source.slice(lastMatch.index + lastMatch[0].length);
  const lines = [];
  let group = [];
  const flushGroup = () => {
    if (!group.length) return;
    lines.push(group.map((bar, barIndex) => (barIndex ? bar.slice(1) : bar)).join(''));
    group = [];
  };
  for (let index = 0; index < outputBars.length; index += 1) {
    const rehearsalMarkers = outputRehearsalMarkers.get(index) || [];
    if (rehearsalMarkers.length) {
      flushGroup();
      lines.push(...rehearsalMarkers);
    }
    group.push(outputBars[index]);
    if (group.length === 4) flushGroup();
  }
  flushGroup();
  let result = `${leading}${lines.join('\n')}`;
  if (trailing) result += `${/^[\r\n]/u.test(trailing) ? '' : '\n'}${trailing}`;
  return result;
}

const ROOT_PITCH_CLASSES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function parsePatternChord(label) {
  if (label === 'N.C.') return { none: true, label };
  const match = /^([A-G])([#b]?)([^/]*)(?:\/([A-G])([#b]?))?$/.exec(label);
  if (!match) return { raw: true, label };
  const accidental = (match[2] === '#' ? 1 : match[2] === 'b' ? -1 : 0);
  return {
    root: (ROOT_PITCH_CLASSES[match[1]] + accidental + 12) % 12,
    quality: match[3],
    label,
  };
}

function measurePattern(measure) {
  return measure.grid.filter(Boolean).map(parsePatternChord);
}

function inferMeasureTransposition(source, target) {
  const sourcePattern = measurePattern(source);
  const targetPattern = measurePattern(target);
  if (sourcePattern.length !== targetPattern.length) return null;
  let shift = null;
  for (let index = 0; index < sourcePattern.length; index += 1) {
    const left = sourcePattern[index];
    const right = targetPattern[index];
    if (left.none || right.none) {
      if (!(left.none && right.none)) return null;
      continue;
    }
    if (left.raw || right.raw || left.quality !== right.quality) return null;
    const candidate = (right.root - left.root + 12) % 12;
    if (shift === null) shift = candidate;
    else if (shift !== candidate) return null;
  }
  return shift ?? 0;
}

function matchesTransposedMeasure(source, target, shift) {
  const sourcePattern = measurePattern(source);
  const targetPattern = measurePattern(target);
  if (sourcePattern.length !== targetPattern.length) return false;
  return sourcePattern.every((left, index) => {
    const right = targetPattern[index];
    if (left.none || right.none) return left.none && right.none;
    if (left.raw || right.raw) return left.label === right.label;
    return left.quality === right.quality && (right.root - left.root + 12) % 12 === shift;
  });
}

function markSustainedChordTranspositions(measures, minimumLength = 16) {
  for (let start = 4; start < measures.length; start += 1) {
    for (const width of [8, 4]) {
      if (start < width || start + width > measures.length) continue;
      const source = measures.slice(start - width, start);
      const target = measures.slice(start, start + width);
      const shift = source.reduce((found, sourceMeasure, index) => {
        if (found === null) return inferMeasureTransposition(sourceMeasure, target[index]);
        const next = inferMeasureTransposition(sourceMeasure, target[index]);
        return next === null || next !== found ? Number.NaN : found;
      }, null);
      if (shift === null || Number.isNaN(shift) || shift === 0) continue;
      let runLength = 0;
      while (start + runLength < measures.length) {
        const sourceMeasure = source[runLength % width];
        if (!matchesTransposedMeasure(sourceMeasure, measures[start + runLength], shift)) break;
        runLength += 1;
      }
      if (runLength >= minimumLength) {
        measures[start].breakBefore = true;
        break;
      }
    }
  }
}

function markSustainedKeyChanges(measures, minimumLength = 16) {
  let previousKey = measures[0]?.key ?? EMPTY;
  for (let index = 1; index < measures.length; index += 1) {
    const currentKey = measures[index].key;
    if (currentKey && previousKey && currentKey !== previousKey) {
      let runLength = 0;
      while (index + runLength < measures.length && measures[index + runLength].key === currentKey) {
        runLength += 1;
      }
      if (runLength >= minimumLength) measures[index].breakBefore = true;
    }
    if (currentKey) previousKey = currentKey;
  }
}

function tempoOf(root) {
  const sound = descendants(root, 'sound').find((entry) => Number(entry.getAttribute?.('tempo')) > 0);
  if (sound) return String(Math.round(Number(sound.getAttribute('tempo'))));
  const perMinute = descendants(root, 'per-minute').find((entry) => Number(entry.textContent) > 0);
  return perMinute ? String(Math.round(Number(perMinute.textContent))) : EMPTY;
}

function headerMetadata(title, root, measures) {
  const youtubeName = String(title || '').trim() || 'Youtube名をここに';
  const coreTitle = youtubeName.replace(/\s*【[^】]*】\s*$/, '').trim();
  const titleParts = /^(.+?)\s*[-–—]\s*(.+)$/.exec(coreTitle);
  return {
    youtubeName,
    songTitle: titleParts?.[2]?.trim() || coreTitle || '曲タイトルっぽいやつ',
    artistName: titleParts?.[1]?.trim() || 'ここにアーティストっぽいやつ',
    bpm: tempoOf(root) || 'ここにBPMわかってれば',
    timeSignature: measures.find((measure) => measure.time)?.time || '4/4',
  };
}

function formatHeader(metadata) {
  return [
    `#${metadata.youtubeName}`,
    `{title:${metadata.songTitle}}`,
    `{subtitle:${metadata.artistName}}`,
    `{c:BPM=${metadata.bpm}　　${metadata.timeSignature}拍子　-：8分音符　＝：16分音符　>：8分音符アクセント　≧：16分音符アクセント　○：白玉}`,
  ];
}

function formatOutput(metadata, measures) {
  const lines = formatHeader(metadata);
  let pendingMeasures = [];
  const flush = () => {
    if (!pendingMeasures.length) return;
    lines.push(...formatMeasureGroups(pendingMeasures));
    pendingMeasures = [];
  };
  for (const measure of measures) {
    if (measure.rehearsal) {
      if (pendingMeasures.length) {
        flush();
      }
      lines.push(`{c:【${fullWidthLatin(measure.rehearsal)}】}`);
    } else if (measure.breakBefore) {
      flush();
    }
    pendingMeasures.push(measure);
  }
  flush();
  return lines.join('\n');
}
function parsePart(part, partName = '') {
  const measures = [];
  const timingWarnings = [];
  let divisions = 1;
  let beats = 4;
  let beatType = 4;
  let keySignature = EMPTY;
  let previousChord = EMPTY;
  let previousTime = EMPTY;
  let cursorTime = 0;
  const pendingBoundaryHarmonies = [];

  for (const measure of childElements(part, 'measure')) {
    const measureNumber = String(measures.length + 1);
    for (const attributes of childElements(measure, 'attributes')) {
      divisions = Math.max(1, integerOf(attributes, 'divisions', divisions));
      const time = firstChild(attributes, 'time');
      beats = Math.max(1, integerOf(time, 'beats', beats));
      beatType = Math.max(1, integerOf(time, 'beat-type', beatType));
      const nextKeySignature = keySignatureOf(attributes);
      if (nextKeySignature) keySignature = nextKeySignature;
    }

    const duration = measureDuration(measure, divisions, beats, beatType);
    const time = `${beats}/${beatType}`;
    const timeChange = Boolean(previousTime && time !== previousTime);
    const cellsPerQuarter = 2;
    const cells = Math.max(1, Math.ceil((duration / divisions) * cellsPerQuarter));
    const grid = Array.from({ length: cells }, () => EMPTY);
    const measureWarnings = [];
    let harmonyCount = 0;
    let hasRest = false;
    let restDuration = 0;
    const soundPositions = [];
    let cursor = 0;
    let lyrics = 0;

    for (const pending of pendingBoundaryHarmonies.splice(0)) {
      if (addHarmony(
        grid,
        pending.harmony,
        0,
        divisions,
        cellsPerQuarter,
        measureWarnings,
        measureNumber,
      )) harmonyCount += 1;
    }

    for (const child of Array.from(measure.children ?? [])) {
      const name = localName(child);
      if (name === 'harmony') {
        const parsedHarmony = parseHarmony(child);
        const position = cursor + parsedHarmony.offset;
        const rawIndex = (position / divisions) * cellsPerQuarter;
        if (Math.abs(rawIndex - grid.length) <= 1e-9) {
          pendingBoundaryHarmonies.push({
            harmony: parsedHarmony,
            sourceMeasureNumber: measureNumber,
          });
          continue;
        }
        if (addHarmony(
          grid,
          parsedHarmony,
          position,
          divisions,
          cellsPerQuarter,
          measureWarnings,
          measureNumber,
        )) harmonyCount += 1;
      } else if (name === 'note') {
        const lyricNodes = descendants(child, 'lyric');
        lyrics += lyricNodes.length;
        const duration = integerOf(child, 'duration', 0);
        const position = cursor;
        const isRest = childElements(child, 'rest').length > 0;
        if (isRest) {
          hasRest = true;
          if (!childElements(child, 'chord').length) restDuration += duration;
        } else soundPositions.push(position);
        if (!childElements(child, 'chord').length) cursor += duration;
      } else if (name === 'forward') {
        cursor += integerOf(child, 'duration', 0);
      } else if (name === 'backup') {
        cursor = Math.max(0, cursor - integerOf(child, 'duration', 0));
      }
    }

    if (hasRest && !harmonyCount && !soundPositions.length && restDuration >= duration && !grid[0]) {
      addHarmony(grid, { label: 'N.C.' }, 0, divisions, cellsPerQuarter, measureWarnings, measureNumber);
    }
    if (!grid[0] && soundPositions.length && previousChord) grid[0] = previousChord;
    const endingLabel = [...grid].reverse().find(Boolean) ?? EMPTY;
    previousChord = endingLabel === 'N.C.' ? EMPTY : endingLabel;

    measures.push({
      number: measureNumber,
      rehearsal: findRehearsal(measure),
      key: keySignature,
      breakBefore: false,
      harmonyCount,
      time,
      timeChange,
      divisions,
      duration,
      cells,
      grid,
      hyphenSpacing: defaultHyphenSpacing(beatType),
      lyrics,
      offset: cursorTime,
    });
    previousTime = time;
    timingWarnings.push(...measureWarnings);
    cursorTime += duration / divisions;
  }

  for (const pending of pendingBoundaryHarmonies) {
    timingWarnings.push(`小節${pending.sourceMeasureNumber}の${pending.harmony.label}は小節範囲外のため出力できません。`);
  }

  markSustainedKeyChanges(measures);
  markSustainedChordTranspositions(measures);
  return { partName, measures, timingWarnings };
}

export function convertMusicXmlDocument(document) {
  const root = document?.documentElement;
  if (!root || !['score-partwise', 'score-timewise'].includes(localName(root))) {
    throw new Error('MusicXMLのscore-partwise文書を指定してください。');
  }
  if (localName(root) === 'score-timewise') {
    throw new Error('score-timewise形式は未対応です。score-partwise形式で保存してください。');
  }
  const partList = firstChild(root, 'part-list');
  const names = new Map(descendants(partList, 'score-part').map((entry) => [entry.getAttribute?.('id'), firstChild(entry, 'part-name')?.textContent?.trim() ?? EMPTY]));
  const part = firstChild(root, 'part');
  if (!part) throw new Error('MusicXMLに演奏パートがありません。');
  const parsed = parsePart(part, names.get(part.getAttribute?.('id')) || part.getAttribute?.('id') || 'Part 1');
  const harmonyCount = parsed.measures.reduce((sum, measure) => sum + measure.harmonyCount, 0);
  const lyricCount = parsed.measures.reduce((sum, measure) => sum + measure.lyrics, 0);
  const emptyMeasures = parsed.measures.filter((measure) => measure.grid.every((cell) => !cell)).length;
  const work = firstChild(root, 'work');
  const title = textOf(work, 'work-title') || parsed.partName || 'MusicXML';
  const metadata = headerMetadata(title, root, parsed.measures);
  const outputText = formatOutput(metadata, parsed.measures);

  return {
    title,
    partName: parsed.partName,
    bpm: metadata.bpm,
    timeSignature: metadata.timeSignature,
    measures: parsed.measures,
    harmonyCount,
    lyricCount,
    emptyMeasures,
    warnings: [
      ...parsed.timingWarnings,
      ...(lyricCount ? [`歌詞は${lyricCount}件検出しましたが、ChordPro形式出力には含めていません。`] : []),
      ...(emptyMeasures ? [`コードがない小節が${emptyMeasures}件あります。`] : []),
    ],
    chordWiki: outputText,
  };
}

export function convertMusicXmlText(xmlText, Parser = globalThis.DOMParser) {
  if (typeof Parser !== 'function') throw new Error('この変換はブラウザーのDOMParserが必要です。');
  const document = new Parser().parseFromString(xmlText, 'application/xml');
  if (document.querySelector?.('parsererror')) throw new Error('MusicXMLを読み取れませんでした。XMLの形式を確認してください。');
  return convertMusicXmlDocument(document);
}
