"use strict";
const assert = require("assert");
const transposer = require("../js/transposer.js");

assert.strictEqual(transposer.transposeChordToken("C", 1, "sharp"), "C#");
assert.strictEqual(transposer.transposeChordToken("C", 1, "flat"), "Db");
assert.strictEqual(transposer.transposeChordToken("F#m7-5", 1, "sharp"), "Gm7-5");
assert.strictEqual(transposer.transposeChordToken("C/G", 1, "flat"), "Db/Ab");
assert.strictEqual(transposer.transposeChordToken("F7(b9)", -1, "flat"), "E7(b9)");
assert.strictEqual(transposer.transposeChordToken("(C#)", 1, "flat"), "(D)");
assert.strictEqual(transposer.transposeChordToken("N.C.", 7, "sharp"), "N.C.");
assert.strictEqual(transposer.transposeChordToken("----", 1, "sharp"), "----");
assert.strictEqual(transposer.transposeChordToken("All", 1, "sharp"), "All");
assert.strictEqual(transposer.transposeText("", 0, "preserve", false), "", "empty preview text must be safe before the first conversion");
assert.strictEqual(transposer.transposeChordToken("Db", 0, "preserve"), "Db");
assert.strictEqual(transposer.transposeChordToken("C#", 0, "flat"), "Db");
assert.strictEqual(transposer.transposeChordToken("B", 0, "flat", true), "Cb");
assert.strictEqual(transposer.transposeChordToken("E", 0, "flat", true), "Fb");
assert.strictEqual(transposer.transposeChordToken("F", 0, "sharp", true), "E#");
assert.strictEqual(transposer.transposeChordToken("C", 0, "sharp", true), "B#");
assert.strictEqual(transposer.transposeChordToken("Cb/Fb", 0, "preserve", true), "Cb/Fb");
assert.strictEqual(transposer.transposeChordToken("Cb", 1, "preserve", true), "C");
assert.strictEqual(transposer.transposeChordToken("Fb", 1, "preserve", true), "F");
assert.strictEqual(transposer.transposeChordToken("Cbb", 1, "preserve", true), "Cb");
assert.strictEqual(transposer.transposeChordToken("F##", -1, "preserve", true), "F#");
assert.strictEqual(transposer.transposeChordToken("C♭♭", 1, "preserve", true), "Cb");
assert.strictEqual(transposer.transposeChordToken("F𝄪", -1, "preserve", true), "F#");
assert.strictEqual(
  transposer.transposeText("{key:B}\n[E/B]歌詞", 0, "flat", true, [{ mode: "flat" }]),
  "{key:Cb}\n[Fb/Cb]歌詞"
);
assert.strictEqual(
  transposer.transposeText("{key:F}\n[C/F]歌詞", 0, "sharp", true, [{ mode: "sharp" }]),
  "{key:E#}\n[B#/E#]歌詞"
);
assert.strictEqual(
  transposer.transposeText("{key:Cb}\n[Fb][Cbb]\n{key:F#}\n[B#][F##]", 1, "preserve", true),
  "{key:C}\n[F][B]\n{key:G}\n[C#][G#]"
);
assert.strictEqual(
  transposer.transposeText("[B][E]歌詞", 0, "preserve", false, [{ mode: "key", key: "Cb" }]),
  "[Cb][Fb]歌詞"
);
assert.strictEqual(
  transposer.transposeText("[A#]歌詞", 0, "preserve", false, [{ mode: "key", key: "Cbb" }]),
  "[Cbb]歌詞"
);
assert.deepStrictEqual(
  transposer.analyzeKeySections("[C]冒頭\n{key:Eb}\n[Eb]中盤\n{key:F#}\n[F#]終盤").map(({ startLine, endLine, key }) => ({ startLine, endLine, key })),
  [{ startLine: 1, endLine: 1, key: "" }, { startLine: 2, endLine: 3, key: "Eb" }, { startLine: 4, endLine: 5, key: "F#" }]
);
assert.ok(transposer.estimateKeys("[C][F][G][C]", 2).some((candidate) => candidate.key === "C"));
assert.strictEqual(
  transposer.applyKeyTransition("{key:D,E}\n[D]歌詞\n[G]続き\n{key:A}\n[A]次", 1).text,
  "{key:E}\n[E]歌詞\n[A]続き\n{key:A}\n[A]次"
);
assert.strictEqual(
  transposer.applyKeyTransition("{key:F#,Gb}\n[F#]歌詞\n[C#]続き", 1).text,
  "{key:Gb}\n[Gb]歌詞\n[Db]続き"
);
assert.strictEqual(transposer.transposeText("[G]", 0, "preserve", false, [{ mode: "key", key: "G#" }]), "[Fx]");
assert.strictEqual(transposer.transposeText("[D]", 0, "preserve", false, [{ mode: "key", key: "D#" }]), "[Cx]");
assert.strictEqual(transposer.transposeText("[A]", 0, "preserve", false, [{ mode: "key", key: "A#" }]), "[Gx]");
assert.strictEqual(transposer.transposeText("[A]", 0, "preserve", false, [{ mode: "key", key: "Cbb" }]), "[Bbb]");
assert.strictEqual(transposer.transposeText("[D]", 0, "preserve", false, [{ mode: "key", key: "Fbb" }]), "[Ebb]");
assert.strictEqual(transposer.transposeText("[G]", 0, "preserve", false, [{ mode: "key", key: "Ebb" }]), "[Abb]");
assert.strictEqual(transposer.transposeText("[G]", 0, "preserve", false, [{ mode: "key", key: "G#" }], "##"), "[F##]");
assert.strictEqual(transposer.transposeText("{key:E}\n[E]", 6, "preserve", false), "{key:Bb}\n[Bb]");
assert.strictEqual(transposer.transposeText("{key:C}\n[C]", 1, "preserve", false), "{key:Db}\n[Db]");
assert.strictEqual(transposer.transposeText("{key:C#m}\n[C#m]", 2, "preserve", false), "{key:D#m}\n[D#m]");
assert.strictEqual(transposer.transposeText("{key:E}\n[E]", 6, "preserve", false, [{ mode: "sharp" }]), "{key:A#}\n[A#]");
assert.strictEqual(transposer.transposeText("{key:C}\n[C]", 6, "flat", false), "{key:Gb}\n[Gb]");
assert.strictEqual(transposer.transposeText("{key:C}\n[C]", 6, "sharp", false), "{key:F#}\n[F#]");
assert.strictEqual(transposer.transposeText("{key:Cm}\n[Cm]", 3, "flat", false), "{key:Ebm}\n[Ebm]");
assert.strictEqual(transposer.transposeText("{key:Cm}\n[Cm]", 3, "sharp", false), "{key:D#m}\n[D#m]");
assert.strictEqual(transposer.transposeText("{key:C}\n[C]", 1, "sharp", false), "{key:Db}\n[C#]");
assert.strictEqual(transposer.transposeText("{key:C}\n[C]", 10, "sharp", false), "{key:Bb}\n[A#]");
assert.strictEqual(transposer.transposeText("{key:Cm}\n[Cm]", 1, "flat", false), "{key:C#m}\n[Dbm]");
assert.strictEqual(
  transposer.transposeText("{ci:[C]}\n{ci: Drums}\n{title:Chorus}\n{subtitle:Chorus}\n[C]歌詞", 2, "sharp"),
  "{ci:[C]}\n{ci: Drums}\n{title:Chorus}\n{subtitle:Chorus}\n[D]歌詞",
  "コメント・タイトル系ディレクティブの中身は移調しない"
);

const source = "{key:C#}\n[|][C#][----]歌詞[F#m7-5][-][C#/G#][|][N.C.]";
assert.strictEqual(
  transposer.transposeText(source, 1, "flat"),
  "{key:D}\n[|][D][----]歌詞[Gm7-5][-][D/A][|][N.C.]"
);
assert.strictEqual(
  transposer.transposeText("{KEY: Db }\n[Bb]歌詞", 0, "sharp"),
  "{KEY: Db }\n[A#]歌詞"
);

console.log("PASS: preview transposition, key directives, slash chords and accidental spelling");
