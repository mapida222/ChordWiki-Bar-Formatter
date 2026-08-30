(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ChordWikiTranspose = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const NATURAL_PITCH = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const SHARP_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const FLAT_NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
  const THEORETICAL_SHARP_NOTES = ["B#", "C#", "D", "D#", "E", "E#", "F#", "G", "G#", "A", "A#", "B"];
  const THEORETICAL_FLAT_NOTES = ["C", "Db", "D", "Eb", "Fb", "F", "Gb", "G", "Ab", "A", "Bb", "Cb"];
  const COMMON_MAJOR_KEYS = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
  const COMMON_MINOR_KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "Bb", "B"];
  const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
  const ACCIDENTAL_PATTERN = "(?:#{1,2}|b{1,2}|♯{1,2}|♭{1,2}|x|𝄪|𝄫)?";
  const CHORD_PATTERN = new RegExp(`^(\\(?)([A-G])(${ACCIDENTAL_PATTERN})(.*?)(?:\\/([A-G])(${ACCIDENTAL_PATTERN}))?(\\)?)$`);
  const SUFFIX_PATTERN = /^(?:(?:m(?:aj)?|maj|min|dim|aug|sus|add|omit|no|M)?[0-9#b+\-()°ø]*)$/i;

  function normalizeSemitones(value) {
    const number = Number.parseInt(value, 10);
    return Number.isFinite(number) ? number : 0;
  }

  function normalizeAccidental(accidental) {
    return String(accidental || "")
      .replaceAll("♯", "#")
      .replaceAll("♭", "b")
      .replaceAll("𝄪", "##")
      .replaceAll("𝄫", "bb")
      .replace(/^x$/, "##");
  }

  function pitchOf(letter, accidental) {
    const normalized = normalizeAccidental(accidental);
    const offset = [...normalized].reduce((sum, character) => sum + (character === "#" ? 1 : character === "b" ? -1 : 0), 0);
    return (NATURAL_PITCH[letter] + offset + 12) % 12;
  }

  function spellingFor(preference, originalAccidental) {
    if (preference === "flat") return "flat";
    if (preference === "sharp") return "sharp";
    return normalizeAccidental(originalAccidental).includes("b") ? "flat" : "sharp";
  }

  function noteNames(preference, letter, accidental, theoretical) {
    const family = spellingFor(preference, accidental);
    if (!theoretical) return family === "flat" ? FLAT_NOTES : SHARP_NOTES;
    if (preference === "flat") return THEORETICAL_FLAT_NOTES;
    if (preference === "sharp") return THEORETICAL_SHARP_NOTES;
    if (normalizeAccidental(accidental).includes("b")) return THEORETICAL_FLAT_NOTES;
    if (normalizeAccidental(accidental).includes("#")) return THEORETICAL_SHARP_NOTES;
    return SHARP_NOTES;
  }

  function transposeNote(letter, accidental, semitones, preference, theoretical = false) {
    const pitch = (pitchOf(letter, accidental) + normalizeSemitones(semitones) + 1200) % 12;
    return noteNames(preference, letter, accidental, theoretical)[pitch];
  }

  function transposeNoteDiatonic(letter, accidental, semitones, letterShift, preference, theoretical, doubleSharpStyle) {
    const amount = normalizeSemitones(semitones);
    const pitch = (pitchOf(letter, accidental) + amount + 1200) % 12;
    const targetLetter = LETTERS[(LETTERS.indexOf(letter) + letterShift + 70) % 7];
    const delta = (pitch - NATURAL_PITCH[targetLetter] + 18) % 12 - 6;
    if (Math.abs(delta) <= 2) {
      return `${targetLetter}${accidentalForDelta(delta, doubleSharpStyle)}`;
    }
    return transposeNote(letter, accidental, amount, preference, theoretical);
  }

  function accidentalForDelta(delta, doubleSharpStyle = "x") {
    if (delta === 2) return doubleSharpStyle === "##" ? "##" : "x";
    if (delta === 1) return "#";
    if (delta === -1) return "b";
    if (delta === -2) return "bb";
    return "";
  }

  function scaleSpellingsForKey(keyToken, doubleSharpStyle) {
    const match = String(keyToken || "").match(CHORD_PATTERN);
    if (!match) return null;
    const tonicLetter = match[2];
    const tonicPitch = pitchOf(tonicLetter, match[3]);
    const minor = /^(?:m(?!aj)|min)/i.test(match[4]);
    const intervals = minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    const names = {};
    intervals.forEach((interval, degree) => {
      const letter = LETTERS[(LETTERS.indexOf(tonicLetter) + degree) % 7];
      const pitch = (tonicPitch + interval) % 12;
      const delta = (pitch - NATURAL_PITCH[letter] + 18) % 12 - 6;
      if (Math.abs(delta) <= 2) names[pitch] = `${letter}${accidentalForDelta(delta, doubleSharpStyle)}`;
    });
    return names;
  }

  function transposeChordToken(token, semitones, preference = "preserve", theoretical = false, letterShift = null, scaleSpellings = null, doubleSharpStyle = "x") {
    const text = String(token);
    const spacing = text.match(/^(\s*)(.*?)(\s*)$/s);
    const leading = spacing ? spacing[1] : "";
    const chord = spacing ? spacing[2] : text;
    const trailing = spacing ? spacing[3] : "";
    if (!chord || /^(?:N\.?C\.?|NC)$/i.test(chord)) return text;

    const match = chord.match(CHORD_PATTERN);
    if (!match || !SUFFIX_PATTERN.test(match[4])) return text;
    const [, opening, root, rootAccidental, suffix, bass, bassAccidental, closing] = match;
    const amount = normalizeSemitones(semitones);
    if (amount === 0 && preference === "preserve" && !scaleSpellings) return text;

    const transposeOne = (letter, accidental) => {
      const pitch = (pitchOf(letter, accidental) + amount + 1200) % 12;
      if (scaleSpellings?.[pitch]) return scaleSpellings[pitch];
      return Number.isInteger(letterShift)
        ? transposeNoteDiatonic(letter, accidental, amount, letterShift, preference, theoretical, doubleSharpStyle)
        : transposeNote(letter, accidental, amount, preference, theoretical);
    };
    const nextRoot = transposeOne(root, rootAccidental);
    const nextBass = bass ? `/${transposeOne(bass, bassAccidental)}` : "";
    return `${leading}${opening}${nextRoot}${suffix}${nextBass}${closing}${trailing}`;
  }

  function keyLineParts(line) {
    const match = String(line).match(/^(\s*)\{(key)\s*:(.*)\}(\s*)$/i);
    if (!match) return null;
    const spacing = match[3].match(/^(\s*)(.*?)(\s*)$/s);
    return spacing ? { match, spacing, key: spacing[2] } : null;
  }

  function keyTransitionParts(line) {
    const match = String(line).match(/^\s*\{key\s*:\s*([^,}\s]+)\s*,\s*([^}\s]+)\s*\}\s*$/i);
    if (!match || !CHORD_PATTERN.test(match[1]) || !CHORD_PATTERN.test(match[2])) return null;
    return { from: match[1], to: match[2] };
  }

  function keyPreference(key) {
    if (String(key).includes("b")) return "flat";
    if (String(key).includes("#")) return "sharp";
    return "preserve";
  }

  function signedKeyDistance(from, to) {
    const source = from.match(CHORD_PATTERN);
    const target = to.match(CHORD_PATTERN);
    if (!source || !target) return null;
    const distance = (pitchOf(target[2], target[3]) - pitchOf(source[2], source[3]) + 12) % 12;
    return distance > 6 ? distance - 12 : distance;
  }

  function applyKeyTransition(text, lineNumber) {
    const lines = String(text || "").replace(/\r\n?|\r/g, "\n").split("\n");
    const index = Math.max(0, Number(lineNumber) - 1);
    const transition = keyTransitionParts(lines[index] || "");
    if (!transition) return { changed: false, text: String(text || "") };
    const amount = signedKeyDistance(transition.from, transition.to);
    if (amount === null) return { changed: false, text: String(text || "") };
    const nextKeyLine = lines.findIndex((line, candidate) => candidate > index && keyLineParts(line));
    const end = nextKeyLine < 0 ? lines.length : nextKeyLine;
    const section = [`{key:${transition.from}}`, ...lines.slice(index + 1, end)].join("\n");
    const converted = transposeText(section, amount, keyPreference(transition.to), false).split(/\r\n?|\r|\n/);
    converted[0] = `{key:${transition.to}}`;
    lines.splice(index, end - index, ...converted);
    return { changed: true, text: lines.join("\n"), lineNumber: index + 1, key: transition.to };
  }

  function isScoreLine(line) {
    const matches = String(line).matchAll(/\[([^\[\]\r\n]*)\]/g);
    for (const match of matches) {
      const token = match[1].trim();
      if (!token || /^[|\-=>≧○*\s]+$/u.test(token)) continue;
      const chord = token.match(CHORD_PATTERN);
      if (chord && SUFFIX_PATTERN.test(chord[4])) return true;
    }
    return false;
  }

  function analyzeKeySections(text) {
    const lines = String(text || "").split(/\r\n|\r|\n/);
    const firstScoreLine = lines.findIndex(isScoreLine);
    if (firstScoreLine < 0) return [];
    const keyLines = lines.map((line, index) => keyLineParts(line) ? index : -1).filter((index) => index >= firstScoreLine);
    const precedingKeyLine = lines.slice(0, firstScoreLine).map((line, index) => keyLineParts(line) ? index : -1).filter((index) => index >= 0).pop();
    const starts = [firstScoreLine, ...keyLines.filter((index) => index > firstScoreLine)];
    return starts.map((start, index) => {
      const end = (starts[index + 1] ?? lines.length) - 1;
      const parts = keyLineParts(lines[start]) || (index === 0 && precedingKeyLine !== undefined ? keyLineParts(lines[precedingKeyLine]) : null);
      return {
        index,
        startLine: start + 1,
        endLine: Math.max(start + 1, end + 1),
        key: parts?.key || "",
        explicit: Boolean(parts)
      };
    });
  }

  function transposeKeyToken(token, semitones, preference, theoretical, mode) {
    const text = String(token || "");
    const match = text.match(CHORD_PATTERN);
    if (!match || match[5] || !SUFFIX_PATTERN.test(match[4])) return transposeChordToken(text, semitones, preference, theoretical);
    const amount = normalizeSemitones(semitones);
    if (amount === 0 && preference === "preserve" && !["sharp", "flat"].includes(mode)) return text;
    const pitch = (pitchOf(match[2], match[3]) + amount + 1200) % 12;
    const minor = /^(?:m(?!aj)|min)/i.test(match[4]);
    let note;
    if (mode === "sharp") note = (theoretical ? THEORETICAL_SHARP_NOTES : SHARP_NOTES)[pitch];
    else if (mode === "flat") note = (theoretical ? THEORETICAL_FLAT_NOTES : FLAT_NOTES)[pitch];
    else {
      note = (minor ? COMMON_MINOR_KEYS : COMMON_MAJOR_KEYS)[pitch];
      const sourceAccidental = normalizeAccidental(match[3]);
      const family = preference === "flat" ? "flat" : preference === "sharp" ? "sharp" : sourceAccidental.includes("b") ? "flat" : "sharp";
      if (!minor && pitch === 6) note = family === "flat" ? "Gb" : "F#";
      if (minor && pitch === 3) note = family === "flat" ? "Eb" : "D#";
    }
    return `${match[1]}${note}${match[4]}${match[7]}`;
  }

  function sectionContext(section, sectionSettings, amount, preference, theoretical, doubleSharpStyle) {
    const config = sectionSettings?.[section.index] || {};
    const mode = ["default", "simple", "key", "sharp", "flat"].includes(config.mode) ? config.mode : "default";
    let effectivePreference = mode === "sharp" ? "sharp" : mode === "flat" ? "flat" : preference;
    let effectiveTheoretical = mode === "simple" ? false : mode === "default" ? theoretical : true;
    const sourceKey = section.key || String(config.key || "").trim();
    if (!sourceKey) effectiveTheoretical = false;
    const targetKey = sourceKey ? transposeKeyToken(sourceKey, amount, effectivePreference, effectiveTheoretical, mode) : "";
    const targetKeyMatch = targetKey.match(CHORD_PATTERN);
    if (!effectiveTheoretical && preference === "preserve" && !["sharp", "flat"].includes(mode) && targetKeyMatch) {
      const accidental = normalizeAccidental(targetKeyMatch[3]);
      if (accidental.includes("b")) effectivePreference = "flat";
      else if (accidental.includes("#")) effectivePreference = "sharp";
    }
    const sourceMatch = sourceKey.match(CHORD_PATTERN);
    const targetMatch = targetKeyMatch;
    const letterShift = effectiveTheoretical && sourceMatch && targetMatch
      ? (LETTERS.indexOf(targetMatch[2]) - LETTERS.indexOf(sourceMatch[2]) + 7) % 7
      : null;
    const scaleSpellings = effectiveTheoretical && targetKey ? scaleSpellingsForKey(targetKey, doubleSharpStyle) : null;
    return { preference: effectivePreference, theoretical: effectiveTheoretical, targetKey, letterShift, scaleSpellings };
  }

  function transposeText(text, semitones, preference = "preserve", theoretical = false, sectionSettings = [], doubleSharpStyle = "x") {
    const amount = normalizeSemitones(semitones);
    const source = String(text || "");
    // The preview is initialized before the first conversion. In that state
    // the result is intentionally empty, so there is no key section to use.
    // Return early instead of trying to read sections[0].index.
    if (!source) return "";
    const sections = analyzeKeySections(source);
    let lineIndex = 0;
    let sectionIndex = -1;
    let context = { preference, theoretical: false, targetKey: "", letterShift: null, scaleSpellings: null };
    return source.split(/(\r\n|\r|\n)/).map((line) => {
      if (/^(?:\r\n|\r|\n)$/.test(line)) return line;
      const section = sections.find((candidate) => lineIndex + 1 >= candidate.startLine && lineIndex + 1 <= candidate.endLine) || sections[0];
      if (section.index !== sectionIndex) {
        sectionIndex = section.index;
        context = sectionContext(section, sectionSettings, amount, preference, theoretical, doubleSharpStyle);
      }
      const parts = keyLineParts(line);
      let result;
      if (parts) {
        const { match, spacing } = parts;
        result = `${match[1]}{${match[2]}:${spacing[1]}${context.targetKey || spacing[2]}${spacing[3]}}${match[4]}`;
      } else if (/^\s*\{[^{}\r\n]*\}\s*$/u.test(line)) {
        // Comments, titles and other ChordWiki directives are prose/metadata.
        // Their brackets may look like chord tokens, but must not be transposed.
        result = line;
      } else result = line.replace(/\[([^\[\]\r\n]*)\]/g, (whole, token) => {
        const transposed = transposeChordToken(token, amount, context.preference, context.theoretical, context.letterShift, context.scaleSpellings, doubleSharpStyle);
        return transposed === token ? whole : `[${transposed}]`;
      });
      lineIndex += 1;
      return result;
    }).join("");
  }

  function estimateKeys(text, limit = 3) {
    const counts = Array(12).fill(0);
    for (const match of String(text || "").matchAll(/\[([^\[\]\r\n]*)\]/g)) {
      const chord = match[1].trim().match(CHORD_PATTERN);
      if (chord && SUFFIX_PATTERN.test(chord[4])) counts[pitchOf(chord[2], chord[3])] += 1;
    }
    const total = counts.reduce((sum, count) => sum + count, 0);
    if (!total) return [];
    const scales = [
      { mode: "major", intervals: [0, 2, 4, 5, 7, 9, 11] },
      { mode: "minor", intervals: [0, 2, 3, 5, 7, 8, 10] }
    ];
    const candidates = [];
    for (const scale of scales) for (let tonic = 0; tonic < 12; tonic += 1) {
      const members = new Set(scale.intervals.map((interval) => (tonic + interval) % 12));
      let score = counts.reduce((sum, count, pitch) => sum + count * (members.has(pitch) ? 2 : -2), 0);
      score += counts[tonic] * 2 + counts[(tonic + 7) % 12];
      const key = `${SHARP_NOTES[tonic]}${scale.mode === "minor" ? "m" : ""}`;
      candidates.push({ key, label: `${SHARP_NOTES[tonic]} ${scale.mode}`, score });
    }
    candidates.sort((a, b) => b.score - a.score);
    const gap = candidates[0].score - candidates[1].score;
    const confidence = gap >= Math.max(4, total) ? "やや高い" : gap > 0 ? "低い" : "判定困難";
    return candidates.slice(0, Math.max(1, limit)).map((candidate) => ({ ...candidate, confidence }));
  }

  function fillTransposeSelect(select) {
    if (!select || select.options.length) return;
    for (let amount = -5; amount <= 6; amount += 1) {
      const option = document.createElement("option");
      option.value = String(amount);
      option.textContent = amount === 0 ? "移調なし" : amount > 0 ? `+${amount}` : String(amount);
      select.append(option);
    }
  }

  return { transposeText, transposeChordToken, transposeNote, transposeKeyToken, analyzeKeySections, estimateKeys, fillTransposeSelect, applyKeyTransition, transposeMin: -5, transposeMax: 6 };
}));
