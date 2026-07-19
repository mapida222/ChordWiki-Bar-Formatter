"use strict";
const assert = require("assert");
global.window = global;
require("../js/converter.js");
const { addMissingBrackets } = require("../js/input-brackets.js");

const source = [
  "C D/F# Em7 C on G /F# N.C.",
  "[C] [D/F#] [>] [○]",
  "G>--- ○",
  "Guitar Bass Piano Drums Vocal Strings Synth Percussion",
  "♠C歌詞 ♥D歌詞 ♣Em歌詞 ♦F歌詞",
  "Aメロ Bメロ Cパート",
  "{c:Key:C　>：アクセント　○：白玉　Guitar}"
].join("\n");
const expected = [
  "[C] [D/F#] [Em7] [C on G] [/F#] [N.C.]",
  "[C] [D/F#] [>] [○]",
  "[G][>---] [○]",
  "Guitar Bass Piano Drums Vocal Strings Synth Percussion",
  "♠[C]歌詞 ♥[D]歌詞 ♣[Em]歌詞 ♦[F]歌詞",
  "Aメロ Bメロ Cパート",
  "{c:Key:C　>：アクセント　○：白玉　Guitar}"
].join("\n");
const result = addMissingBrackets(source);
assert.strictEqual(result.text, expected);
assert.strictEqual(result.addedCount, 13);
assert.deepStrictEqual(addMissingBrackets(expected), { text: expected, addedCount: 0 });
const freeEndingAndInstrumentSource = [
  "C :||",
  "D || ･･･ (Repeat & Fadeout)",
  "E.Guitar E.Gt E.Gtr A.Guitar",
  "(Dr) (E.Guitar) （Dr）",
  "E.Guitar only F"
].join("\n");
const freeEndingAndInstrumentExpected = [
  "[C] :||",
  "[D] || ･･･ (Repeat & Fadeout)",
  "E.Guitar E.Gt E.Gtr A.Guitar",
  "(Dr) (E.Guitar) （Dr）",
  "E.Guitar only [F]"
].join("\n");
assert.deepStrictEqual(addMissingBrackets(freeEndingAndInstrumentSource), {
  text: freeEndingAndInstrumentExpected,
  addedCount: 3
});
const notationVocabularySource = [
  "E. Guitar A・ギター B．Bass E.Guitar,(Dr)",
  "Aメロ Bメロ Cサビ Dパート",
  "D.C. al Fine / D.S. al Coda / A tempo",
  "Key:C Capo:5 Tempo=105 Tuning:DADGAD",
  "C D E :|| ･･･ (Repeat & Fadeout)",
  "Coda C (N.C.)"
].join("\n");
const notationVocabularyExpected = [
  "E. Guitar A・ギター B．Bass E.Guitar,(Dr)",
  "Aメロ Bメロ Cサビ Dパート",
  "D.C. al Fine / D.S. al Coda / A tempo",
  "Key:C Capo:5 Tempo=105 Tuning:DADGAD",
  "[C] [D] [E] :|| ･･･ (Repeat & Fadeout)",
  "Coda [C] [(N.C.)]"
].join("\n");
assert.deepStrictEqual(addMissingBrackets(notationVocabularySource), {
  text: notationVocabularyExpected,
  addedCount: 5
});
assert.deepStrictEqual(addMissingBrackets("C |:\nD :|\nE ||:\nF :||:\nG |×2"), {
  text: "[C] |:\n[D] :|\n[E] ||:\n[F] :||:\n[G] |×2",
  addedCount: 5
});
const broadInstrumentSource = [
  "E.12st.Guitar A.Sax B.Clarinet C.Piano D.Percussion F.Horn G.SE",
  "Aギター Bベース Cドラム Dピアノ Eボーカル Fフルート Gサックス",
  "A琴 B三味線 C尺八 D篠笛 E太鼓 F木琴 G鉄琴",
  "E Guitar F Bass G Drums A Violin B Cello C Synth D Vocal",
  "C Hello D world"
].join("\n");
const broadInstrumentExpected = [
  "E.12st.Guitar A.Sax B.Clarinet C.Piano D.Percussion F.Horn G.SE",
  "Aギター Bベース Cドラム Dピアノ Eボーカル Fフルート Gサックス",
  "A琴 B三味線 C尺八 D篠笛 E太鼓 F木琴 G鉄琴",
  "E Guitar F Bass G Drums A Violin B Cello C Synth D Vocal",
  "[C] Hello [D] world"
].join("\n");
assert.deepStrictEqual(addMissingBrackets(broadInstrumentSource), {
  text: broadInstrumentExpected,
  addedCount: 2
});
const searchLabels = [
  "<検索用>　ラヴ・ファントム",
  "<検索用>　～ワード～",
  "＜検索＞",
  "<関連ワード>",
  "G>--- <検索用>"
].join("\n");
const searchLabelsExpected = [
  "<検索用>　ラヴ・ファントム",
  "<検索用>　～ワード～",
  "＜検索＞",
  "<関連ワード>",
  "[G][>---] <検索用>"
].join("\n");
assert.deepStrictEqual(addMissingBrackets(searchLabels), {
  text: searchLabelsExpected,
  addedCount: 2
});
assert.strictEqual(CBFConverter.convertChordText("E.Guitar\nE.Gt\n(Dr)\n･･･ (Repeat & Fadeout)\n:||", {
  hyphenUnit: 4,
  measureCapacity: 8,
  hyphenSpacing: 4,
  shortFractionPrepose: 1,
  showContinuationChord: 0
}, []).output, "E.Guitar\nE.Gt\n(Dr)\n･･･ (Repeat & Fadeout)\n:||");
console.log("PASS: missing chord, on-chord, accent and white-note brackets with exclusions");
