(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CBFInputBrackets = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const NOTE = "[A-G](?:##|bb|#|b|x)?";
  const QUALITY = "(?:(?:maj|min|m|M|dim|aug|sus|add|omit|no)[A-Za-z0-9+#b()°oΔ-]*|[0-9+()°Δ-][A-Za-z0-9+#b()°oΔ-]*|o[0-9()]*)?";
  const CHORD = `${NOTE}${QUALITY}(?:/${NOTE})?`;
  const ON_CHORD = `${NOTE}${QUALITY}\\s+[oO][nN]\\s+${NOTE}`;
  const CANDIDATE_RE = new RegExp(`(^|[^A-Za-z0-9_])(${ON_CHORD}|/${NOTE}|\\(${CHORD}\\)|\\(N\\.?C\\.?\\)|N\\.?C\\.?|${CHORD})(?=$|[^A-Za-z0-9_])`, "g");
  const PROTECTED_RE = /(\[[^\]\r\n]*\]|\{[^{}\r\n]*\}|<[^<>\r\n]+>|＜[^＜＞\r\n]+＞)/g;
  const INSTRUMENT_EN = "(?:Guitars?|Gt|Gtr|Bass|Basses|Ba|Drums?|Drs|Percussion|Perc|Per|Pianos?|Pf|Organ|Org|Keyboards?|Keys?|Kb|Synth(?:esizer)?|Syn|Vocals?|Vo|Vox|Chorus|Choir|Cho|Strings?|Str|Violins?|Vn|Vln|Violas?|Vla|Cellos?|Vc|Contrabass|Cb|Brass|Brs|Trumpets?|Tp|Trp|Trombones?|Tb|Tbn|Horns?|Hr|Tuba|Woodwinds?|Flutes?|Fl|Piccolo|Pic|Clarinets?|Cl|Oboes?|Ob|Bassoons?|Bsn|Sax(?:ophone)?s?|Harmonica|Harm|Accordion|Acc|Recorder|Rec|Harp|Hp|Ukulele|Uk|Mandolin|Mand|Banjo|Timpani|Timp|Marimba|Mar|Vibraphone|Vib|Xylophone|Xyl|Glockenspiel|Glock|Programming|Prog|Manipulator|SE|FX)";
  const INSTRUMENT_JA = "(?:ギター|エレキギター|アコギ|クラシックギター|ベース|ウッドベース|ドラム|ドラムス|パーカッション|打楽器|ピアノ|エレピ|オルガン|キーボード|シンセ|ボーカル|ヴォーカル|コーラス|合唱|ストリングス|弦楽器|バイオリン|ヴァイオリン|ビオラ|ヴィオラ|チェロ|コントラバス|ブラス|金管|トランペット|トロンボーン|ホルン|チューバ|木管|フルート|ピッコロ|クラリネット|オーボエ|ファゴット|サックス|サクソフォン|ハーモニカ|アコーディオン|リコーダー|ハープ|ウクレレ|マンドリン|バンジョー|ティンパニ|マリンバ|ビブラフォン|木琴|鉄琴|琴|三味線|尺八|篠笛|太鼓|効果音)";

  function isChord(value) {
    return Boolean(root?.CBFConverter?.isChordSymbol?.(value));
  }

  function protectedTextRanges(segment) {
    const ranges = [];
    const addMatches = (pattern, predicate = () => true) => {
      for (const match of segment.matchAll(pattern)) {
        if (predicate(match)) ranges.push([match.index, match.index + match[0].length]);
      }
    };
    addMatches(/\(([^()\r\n]*)\)|（([^（）\r\n]*)）/gu, (match) => !isChord((match[1] ?? match[2] ?? "").trim()));
    addMatches(/\b[A-G](?:[.．・][A-Za-z][A-Za-z.]*)+\b/gu);
    addMatches(/(?:^|[\s　,(（])[A-G]\s*[.．・]\s*[^\s　,:：，、()（）|]+/giu);
    addMatches(new RegExp(`(?:^|[\\s　,(（])[A-G]\\s*(?:${INSTRUMENT_EN}|${INSTRUMENT_JA})(?=$|[\\s　,:：，、)）&/])`, "giu"));
    addMatches(/(?:^|[\s　:：,，、])[A-G](?:['′″"]+)?(?:メロ|サビ|パート|セクション|ブロック)/gu);
    addMatches(/(?:^|[\s　,(（])D\s*[.．]\s*(?:C|S)\s*[.．](?:\s+al\s+(?:Coda|Fine))?/giu);
    addMatches(/\b(?:Da\s+Capo|Dal\s+Segno|To\s+Coda|A\s+tempo|Repeat\s*(?:&|and)\s*Fade\s*out|Fade\s*out)\b/giu);
    addMatches(/(?:^|[\s　])(?:Key|Capo|BPM|Tempo|Tuning)\s*[:=：]\s*[^\s　|]+/giu);
    addMatches(/\bRepeat\s*(?:&|and)\s*Fade\s*out\b/giu);
    return ranges;
  }

  function bracketSegment(segment) {
    let addedCount = 0;
    const protectedRanges = protectedTextRanges(segment);
    let text = segment.replace(CANDIDATE_RE, (match, prefix, candidate, offset, source) => {
      const candidateStart = offset + prefix.length;
      const candidateEnd = candidateStart + candidate.length;
      if (protectedRanges.some(([start, end]) => candidateStart < end && candidateEnd > start)) return match;
      const after = source.slice(offset + match.length);
      if (/^(?:メロ|パート)/.test(after)) return match;
      if (!isChord(candidate)) return match;
      addedCount += 1;
      return `${prefix}[${candidate}]`;
    });
    text = text.replace(/>[-=>≧]*/g, (marker) => {
      addedCount += 1;
      return `[${marker}]`;
    });
    text = text.replace(/○/g, () => {
      addedCount += 1;
      return "[○]";
    });
    return { text, addedCount };
  }

  function addMissingBrackets(value) {
    const source = String(value || "");
    let addedCount = 0;
    const text = source.split(PROTECTED_RE).map((part) => {
      if (!part || /^(?:\[|\{|<|＜)/.test(part)) return part;
      const result = bracketSegment(part);
      addedCount += result.addedCount;
      return result.text;
    }).join("");
    return { text, addedCount };
  }

  return { addMissingBrackets };
}));
