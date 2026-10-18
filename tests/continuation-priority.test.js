"use strict";

const assert = require("assert");
global.window = global;
require("../js/converter.js");

const base = { hyphenUnit: 4, measureCapacity: 8, hyphenSpacing: 4, shortFractionPrepose: 1 };
const convert = (input, enabled, corrections = [], manual = []) => CBFConverter.convertChordText(
  input,
  { ...base, showContinuationChord: enabled ? 1 : 0 },
  corrections,
  manual
).output;

const manualRhythm = "|[C]---- ----|---- ----|---- ----|";
assert.strictEqual(
  convert(manualRhythm, false),
  "[|][C][----] [----][|][----] [----][|][----] [----][|]",
  "disabled continuation preserves every manual rhythm measure"
);
assert.strictEqual(
  convert(manualRhythm, true),
  "[|][C][----] [----][|][C][----] [----][|][C][----] [----][|]",
  "enabled continuation adds only the carried chord to chordless manual measures"
);
assert.strictEqual(
  convert("|[C]---- ----|[G]---- ----|---- ----|", true),
  "[|][C][----] [----][|][G][----] [----][|][G][----] [----][|]",
  "an authored chord replaces the chord being carried"
);
assert.strictEqual(
  convert("|[C]---- ----|[N.C.]---- ----|---- ----|", true),
  "[|][C][----] [----][|][N.C.][----] [----][|][----] [----][|]",
  "N.C. stops continuation into following chordless measures"
);
assert.strictEqual(
  convert("|[C]---- ----||---- ----|", true),
  "[|][C][----] [----][|][C][----] [----][|]",
  "a duplicate authored bar is normalized before chord continuation"
);

const directManual = "|[C]MANUAL---- ----|---- ----|";
assert.strictEqual(
  convert("|[C]---- ----|---- ----|", true, [], [directManual]),
  directManual,
  "direct result editing has priority over the continuation display setting"
);

const rowOff = convert("[C]lyric", false, ["h"]);
const rowOn = convert("[C]lyric", true, ["h"]);
assert.strictEqual(rowOff, "[|][C][----][----][|][----][----][|][----][----]lyric[|]", "row correction keeps blank continuation measures when disabled");
assert.strictEqual(rowOn, "[|][C][----][----][|][C][----][----][|][C][----][----]lyric[|]", "row correction remains stronger while the display setting adds carried chords");
assert.strictEqual(
  convert("[C][G]", true, ["4s8"]),
  "[|][C][---][G][-][----][|][----][|]",
  "syncopated row corrections never add a carried chord across a bar"
);
assert.strictEqual(
  convert("|[C]---=[G]= ----|---- ----|", true),
  "[|][C][---=][G][=] [----][|][----] [----][|]",
  "manual syncopation does not carry its prior chord into a chordless measure"
);
assert.strictEqual(
  convert("|[C]---- ----|[G][-]あ[|][---]いう|", true),
  "[|][C][----][----][|][G][-]あ[|][C][---]いう[|]",
  "a pickup chord must not become the carried chord for the following chordless measure"
);

const sixEight = { ...base, hyphenUnit: 3, measureCapacity: 6, hyphenSpacing: 3 };
assert.strictEqual(
  CBFConverter.convertChordText("[C]あいう|えお", { ...sixEight, showContinuationChord: 1 }, []).output,
  "[|][C][---][---]あいう[|][C][---][---]えお　[|]",
  "an authored bar in a 6/8 lyric line must show the carried chord"
);
assert.strictEqual(
  CBFConverter.renderWithBeatCode("[C]あいう|えお", "c", { ...sixEight, showContinuationChord: 1 }, "[C]あいう|えお").body,
  "[|][C][---][---]あいう[|][C][---][---]えお[|]",
  "a 12-beat omitted duration encoded as c must respect the authored 6/8 bar"
);
assert.strictEqual(
  CBFConverter.renderWithBeatCode("[C]あいう|えお", "12", { ...sixEight, showContinuationChord: 1 }, "[C]あいう|えお").body,
  "[|][C][---][---]あいう[|][C][---][---]えお[|]",
  "a 12-beat omitted duration written as 12 must respect the authored 6/8 bar"
);
assert.strictEqual(
  CBFConverter.convertChordText("[|][G#7]星が[|]　ない[|][C#m]夜は　[|]    [|]", { ...sixEight, showContinuationChord: 1 }, []).output,
  "[|][G#7][---][---]星が[|][G#7][---][---]　ない[|][C#m][---][---]夜は　[|][C#m][---][---]    [|]",
  "an authored whitespace-only 6/8 measure must also show the carried chord"
);
const splitTwelveSource = "[|][C#m]痛み[|]　止めじゃ[|][A]なくて[|]　[|]";
assert.strictEqual(
  CBFConverter.convertChordText(splitTwelveSource, { ...sixEight, showContinuationChord: 1 }, ["66"]).output,
  "[|][C#m][---][---]痛み[|][C#m][---][---]　止めじゃ[|][A][---][---]なくて[|][A][---][---]　[|]",
  "a 12-beat span corrected to 6+6 must keep authored bars and carry each chord"
);
assert.strictEqual(
  CBFConverter.renderCompletedOutput(
    CBFConverter.convertChordText(splitTwelveSource, { ...sixEight, showContinuationChord: 1 }, ["66"]).output,
    [3, 6, 12],
    3
  ).output,
  "[|][C#m]痛み[|][C#m]　止めじゃ[|][A]なくて[|][A][---][---]　[|]",
  "3,6,12 omission must retain the carried chord after splitting a 12-beat span"
);
const splitTwelveManualSource = "[|][C#m][---][---]痛み[|]止めじゃ[|][A][---][---]なくて[|]　[|]";
assert.strictEqual(
  CBFConverter.convertChordText(splitTwelveManualSource, { ...sixEight, showContinuationChord: 1 }, ["66"]).output,
  "[|][C#m][---][---]痛み[|][C#m][---][---]止めじゃ[|][A][---][---]なくて[|][A][---][---]　[|]",
  "a manually rhythmed 12-beat span split by authored bars must fill both 6/8 measures"
);
assert.strictEqual(
  CBFConverter.convertChordText("[|][F#m]大国道[|][F#m][---][---]　[|]", { ...sixEight, showContinuationChord: 1 }, []).output,
  "[|][F#m]大国道　[|][F#m][---][---][|]",
  "a lyric-free trailing 6/8 measure must not retain its padding space"
);
assert.strictEqual(
  CBFConverter.convertChordText("[|][G#7]儚(はか[|][G#7]な)い[|][C#m]けれど、[|][C#m][---][---]　[|]", { ...sixEight, showContinuationChord: 1 }, []).output,
  "[|][G#7]儚(はか[|][G#7]な)い[|][C#m]けれど、　[|][C#m][---][---][|]",
  "a trailing code-only 6/8 measure moves its padding space to the preceding lyric measure"
);

console.log("PASS: continuation setting respects direct edits, row corrections, manual rhythm, N.C. and double bars");
