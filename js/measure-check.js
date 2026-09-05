(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CBFMeasureCheck = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const RHYTHM_CHARACTERS = "-=>≧＞＝";
  const RHYTHM_TOKEN_CHARACTERS = /^[\s\-=>≧＞＝○*]+$/u;

  function rhythmWidth(value) {
    const characters = [...String(value || "")];
    let total = 0;
    for (let index = 0; index < characters.length; index += 1) {
      const character = characters[index];
      const next = characters[index + 1];
      if (character === "＞" && next === "＝" && characters[index + 2] === "＝") {
        // 全角の「＞＝＝」は、3連符3音を2拍に収める既存表記。
        total += 4;
        index += 2;
        continue;
      }
      if (character === "-") total += 2;
      else if (character === ">" || character === "＞") total += (next === "=" || next === "＝") ? 1 : 2;
      else if (character === "=" || character === "＝" || character === "≧") total += 1;
    }
    return total;
  }

  function replaceSixteenthAccentRuns(value, onChange) {
    return String(value || "").replace(/[>＞\-＝=≧]+/gu, (run) => {
      const characters = [...run];
      const result = [];
      for (let index = 0; index < characters.length; index += 1) {
        const character = characters[index];
        const next = characters[index + 1];
        if (character === "＞" && next === "＝" && characters[index + 2] === "＝") {
          result.push("＞＝＝");
          index += 2;
          continue;
        }
      if ((character === ">" || character === "＞") && (next === "=" || next === "＝")) {
        onChange();
          result.push("≧");
          continue;
        }
        result.push(character);
      }
      return result.join("");
    });
  }

  function proposeSixteenthAccentNotation(source) {
    const before = String(source || "");
    if (!before) return null;
    let changes = 0;
    const after = replaceSixteenthAccentRuns(before, () => { changes += 1; });
    if (!changes) return null;
    const beforeLines = before.replace(/\r\n?/gu, "\n").split("\n");
    const afterLines = after.replace(/\r\n?/gu, "\n").split("\n");
    const changedLines = [];
    const lineCount = Math.max(beforeLines.length, afterLines.length);
    for (let index = 0; index < lineCount && changedLines.length < 6; index += 1) {
      if (beforeLines[index] === afterLines[index]) continue;
      changedLines.push(`入力欄の${index + 1}行目\n変更前：${shortProposalLine(beforeLines[index])}\n変更後：${shortProposalLine(afterLines[index])}`);
    }
    const summary = changedLines.join("\n\n") + (lineCount > changedLines.length && changedLines.length >= 6 ? "\n\nほかにも変更箇所があります。" : "");
    return { before, after, changes, summary };
  }

  function shortProposalLine(value) {
    const line = String(value || "").trim();
    return line.length > 260 ? `${line.slice(0, 260)}…` : line;
  }

  function applyFixes(source, fixes) {
    let result = String(source || "");
    const ordered = [...(fixes || [])]
      .filter((fix) => fix && Number.isInteger(fix.start) && Number.isInteger(fix.end) && fix.start >= 0 && fix.end >= fix.start && fix.end <= result.length)
      .sort((left, right) => right.start - left.start);
    ordered.forEach((fix) => {
      result = `${result.slice(0, fix.start)}${fix.replacement || ""}${result.slice(fix.end)}`;
    });
    return result;
  }

  function issueFix(issue) {
    if (!issue || !Number.isInteger(issue.start) || !Number.isInteger(issue.end)) return null;
    if (issue.code === "empty-bracket" || issue.code === "stray-closing-bracket") {
      return { start: issue.start, end: issue.end, replacement: "" };
    }
    return null;
  }

  function beatLabel(value) {
    if (value === null || value === undefined) return "拍数なし";
    return `${Number.isInteger(value) ? value : value.toFixed(1)}拍相当`;
  }

  function beatText(value) {
    if (value === null || value === undefined) return "拍数なし";
    return `${Number.isInteger(value) ? value : value.toFixed(1)}拍分`;
  }

  function formatMeasureSource(measure) {
    const source = String(measure?.measureSource ?? measure?.source ?? "").trim();
    if (!source) return "|（小節の中身を取得できません）|";
    return `|${source}${measure?.closed === false ? "" : "|"}`;
  }

  function analyzeMeasureRhythm(measure) {
    const source = String(measure?.measureSource ?? measure?.source ?? "");
    const parts = [];
    let index = 0;
    while (index < source.length) {
      if (source[index] === "[") {
        const end = source.indexOf("]", index + 1);
        if (end >= 0) {
          const content = source.slice(index + 1, end);
          const width = rhythmWidth(content);
          if (RHYTHM_TOKEN_CHARACTERS.test(content) && width > 0) parts.push({ token: source.slice(index, end + 1), beats: width / 2 });
          index = end + 1;
          continue;
        }
      }
      if (RHYTHM_CHARACTERS.includes(source[index])) {
        let end = index;
        while (end < source.length && RHYTHM_CHARACTERS.includes(source[end])) end += 1;
        const token = source.slice(index, end);
        parts.push({ token, beats: rhythmWidth(token) / 2 });
        index = end;
        continue;
      }
      index += 1;
    }
    return { parts, totalBeats: parts.reduce((total, part) => total + part.beats, 0) };
  }

  function proposeBeatAdjustment(issue) {
    if (!issue || issue.type !== "beat") return null;
    const actual = Number(issue.actualBeats);
    const expected = Number(issue.expectedBeats);
    if (!Number.isFinite(actual) || !Number.isFinite(expected) || actual >= expected) return null;
    const missingUnits = Math.round((expected - actual) * 2);
    if (missingUnits <= 0) return null;
    const addedHyphens = Math.floor(missingUnits / 2);
    const token = missingUnits % 2
      ? `${"-".repeat(addedHyphens)}=`
      : "-".repeat(addedHyphens);
    const source = String(issue.measureSource ?? issue.source ?? "").trim();
    const before = formatMeasureSource(issue);
    const insertionPoint = before.endsWith("|") ? before.length - 1 : before.length;
    const after = `${before.slice(0, insertionPoint)}[${token}]${before.slice(insertionPoint)}`;
    return { before, after, token, addedBeats: expected - actual, replacement: `${source}[${token}]` };
  }

  function validate(source) {
    const measures = [];
    const issues = [];
    const lines = String(source || "").replace(/\r\n?/g, "\n").split("\n");

    let lineStartOffset = 0;
    let segment = [];
    let segmentOpen = false;
    let segmentWidth = 0;
    let segmentHasMusic = false;
    let segmentHasRhythm = false;
    let segmentStart = 0;
    let segmentStartOffset = 0;
    let segmentLineIndex = 0;
    let segmentLineStartOffset = 0;
    let segmentLineText = "";
    let segmentMeasure = 0;
    lines.forEach((line, lineIndex) => {
      let lineMeasureNumber = 0;

      const resetSegment = () => {
        segment = [];
        segmentWidth = 0;
        segmentHasMusic = false;
        segmentHasRhythm = false;
        segmentMeasure = 0;
      };

      const inspectSegment = (closed, boundary = line.length) => {
        if (!segmentOpen || !segmentHasMusic) {
          resetSegment();
          return;
        }
        const measureNumber = segmentMeasure || lineMeasureNumber + 1;
        measures.push({
          line: segmentLineIndex + 1,
          measure: measureNumber,
          beats: segmentHasRhythm ? segmentWidth / 2 : null,
          closed,
          source: segment.join(""),
          start: segmentStart,
          end: boundary,
          lineStart: segmentLineStartOffset,
          lineText: segmentLineText,
          startOffset: segmentStartOffset,
          endOffset: lineStartOffset + boundary
        });
        if (segmentLineIndex === lineIndex) lineMeasureNumber = Math.max(lineMeasureNumber, measureNumber);
        resetSegment();
      };

      const pushBar = (nextStart, boundary) => {
        inspectSegment(true, boundary);
        segmentOpen = true;
        segmentStart = nextStart;
        segmentStartOffset = lineStartOffset + nextStart;
        segmentLineIndex = lineIndex;
        segmentLineStartOffset = lineStartOffset;
        segmentLineText = line;
        segmentMeasure = lineMeasureNumber + 1;
      };

      if (/^\s*(?:#|\{)/u.test(line)) {
        if (segmentOpen && lineIndex < lines.length - 1) segment.push("\n");
        if (lineIndex === lines.length - 1) inspectSegment(false);
        lineStartOffset += line.length + 1;
        return;
      }

      let index = 0;
      while (index < line.length) {
        const character = line[index];
        if (character === "|") {
          pushBar(index + 1, index);
          index += 1;
          continue;
        }
        if (character === "[") {
          const end = line.indexOf("]", index + 1);
          if (end < 0) {
            issues.push({ line: lineIndex + 1, measure: lineMeasureNumber + 1, type: "syntax", code: "missing-closing-bracket", token: line.slice(index), lineStart: lineStartOffset, lineText: line, start: lineStartOffset + index, end: lineStartOffset + line.length, message: "閉じ括弧 ] がありません。" });
            segmentHasMusic = true;
            segment.push(line.slice(index));
            break;
          }
          const content = line.slice(index + 1, end);
          const token = line.slice(index, end + 1);
          if (content.includes("[")) {
            issues.push({ line: lineIndex + 1, measure: lineMeasureNumber + 1, type: "syntax", code: "nested-bracket", token, lineStart: lineStartOffset, lineText: line, start: lineStartOffset + index, end: lineStartOffset + end + 1, message: `括弧内に [ が含まれています：${token}` });
          }
          if (content === "|") {
            pushBar(end + 1, index);
          } else {
            segment.push(token);
            if (!content.trim()) {
              issues.push({ line: lineIndex + 1, measure: lineMeasureNumber + 1, type: "syntax", code: "empty-bracket", token, lineStart: lineStartOffset, lineText: line, start: lineStartOffset + index, end: lineStartOffset + end + 1, message: "空の角括弧 [] があります。" });
            }
            segmentHasMusic ||= Boolean(content.trim());
            const rhythmToken = RHYTHM_TOKEN_CHARACTERS.test(content);
            const width = rhythmWidth(content);
            if (rhythmToken && width > 0) {
              segmentHasRhythm = true;
              segmentWidth += width;
            } else if (/^[\-=>≧]/u.test(content) && !rhythmToken) {
              issues.push({ line: lineIndex + 1, measure: lineMeasureNumber + 1, type: "syntax", code: "invalid-rhythm-token", token, lineStart: lineStartOffset, lineText: line, start: lineStartOffset + index, end: lineStartOffset + end + 1, message: `リズム記号として解釈できない文字があります：${token}` });
            }
          }
          index = end + 1;
          continue;
        }
        if (character === "]") {
          issues.push({ line: lineIndex + 1, measure: lineMeasureNumber + 1, type: "syntax", code: "stray-closing-bracket", token: character, lineStart: lineStartOffset, lineText: line, start: lineStartOffset + index, end: lineStartOffset + index + 1, message: "開き括弧 [ がありません。" });
          segment.push(character);
          index += 1;
          continue;
        }
        if (RHYTHM_CHARACTERS.includes(character)) {
          let end = index;
          while (end < line.length && RHYTHM_CHARACTERS.includes(line[end])) end += 1;
          const run = line.slice(index, end);
          segment.push(run);
          segmentHasMusic = true;
          segmentHasRhythm = true;
          segmentWidth += rhythmWidth(run);
          index = end;
          continue;
        }
        if (segmentOpen && character.trim()) segmentHasMusic = true;
        segment.push(character);
        index += 1;
      }
      if (lineIndex === lines.length - 1) inspectSegment(false);
      else if (segmentOpen) segment.push("\n");
      lineStartOffset += line.length + 1;
    });

    const rhythmMeasures = measures.filter((measure) => measure.beats !== null);
    const noBeatMeasures = measures.filter((measure) => measure.beats === null);
    let expectedBeats = null;
    if (rhythmMeasures.length) {
      expectedBeats = rhythmMeasures[0].beats;
      rhythmMeasures.forEach((measure) => {
        if (measure.beats === expectedBeats) return;
        issues.push({
          line: measure.line,
          measure: measure.measure,
          type: "beat",
          code: "beat-mismatch",
          actualBeats: measure.beats,
          expectedBeats,
          closed: measure.closed,
          measureSource: measure.source,
          lineStart: measure.lineStart,
          lineText: measure.lineText,
          measureStart: measure.startOffset ?? measure.lineStart + measure.start,
          measureEnd: measure.endOffset ?? measure.lineStart + measure.end,
          message: `拍の長さが違います（この小節は${beatText(measure.beats)}、基準は${beatText(expectedBeats)}）。`
        });
      });
    }

    return {
      ok: issues.length === 0,
      measures,
      rhythmMeasures,
      noBeatMeasures,
      issues,
      syntaxIssues: issues.filter((issue) => issue.type === "syntax"),
      beatIssues: issues.filter((issue) => issue.type === "beat"),
      expectedBeats,
      checkedMeasureCount: measures.length,
      rhythmMeasureCount: rhythmMeasures.length,
      noBeatMeasureCount: noBeatMeasures.length,
      beatLabel
    };
  }

  return { validate, rhythmWidth, beatLabel, beatText, formatMeasureSource, analyzeMeasureRhythm, proposeBeatAdjustment, proposeSixteenthAccentNotation, issueFix, applyFixes };
}));
