"use strict";
const assert = require("assert");
const preview = require("../js/chordwiki-preview.js");

const source = [
  "#非表示コメント",
  "{t:タイトル}",
  "{st:サブタイトル}",
  "{ci:斜体コメント}",
  "{c:♠：ドラえもん 🔴：のび太　♥：しずか ♣：スネ夫 ♦：ジャイアン}",
  "{key:Db}",
  "{A ver.>https://example.com/song}",
  "♠誰[C]でも[F7]編集できる",
  "(All)[C]----|[G]>---|"
].join("\n");

const html = preview.render(source);
assert(!html.includes("非表示コメント"));
assert(html.includes('<div class="cw-title">タイトル</div>'));
assert(html.includes('<div class="cw-subtitle">サブタイトル</div>'));
assert(html.includes("cw-comment-italic"));
assert(html.includes('<div class="cw-key">Key: Db</div>'));
assert(html.includes('href="https://example.com/song"'));
assert(html.includes('<span class="cw-suit-spade">♠</span>'));
assert(html.includes('<span class="cw-symbol-red-circle">🔴</span>'));
assert(html.includes('<span class="cw-suit-heart">♥</span>'));
assert(html.includes('<span class="cw-suit-club">♣</span>'));
assert(html.includes('<span class="cw-suit-diamond">♦</span>'));
assert(html.includes('<span class="cw-chord"><span class="cw-code-token" data-token-type="chord">C</span></span>'));
assert(html.includes('cw-segment-has-trailing-bar cw-segment-has-upper'));
assert(html.includes('<span class="cw-body">----<span class="cw-body-bar-token" data-token-type="bar">|</span></span>'));
assert.strictEqual(preview.isRhythmToken("----*"), true);
assert.strictEqual(preview.isRhythmToken("F#m7-5"), false);
assert.strictEqual(preview.isSpacingBody("--"), true);

const formatted = preview.render("[|][C][----][----]歌詞[|][G][≧==]続き");
assert(formatted.includes('class="cw-segment cw-segment-has-leading-bar cw-segment-has-trailing-upper-bar cw-segment-has-upper"'));
assert(formatted.includes('<span class="cw-boundary cw-boundary-leading cw-boundary-upper cw-boundary-line-start cw-boundary-before-chord" data-token-type="bar"><span>|</span></span><span class="cw-segment'));
assert(formatted.includes('<span class="cw-chord"><span class="cw-code-token" data-token-type="chord">C</span> <span class="cw-rhythm-token" data-token-type="rhythm">----</span> <span class="cw-rhythm-token" data-token-type="rhythm">----</span></span>'));
assert(formatted.includes('<span class="cw-body">歌詞</span></span><span class="cw-boundary cw-boundary-trailing cw-boundary-upper" data-token-type="bar"><span>|</span></span>'));
assert(formatted.includes('<span class="cw-segment cw-segment-has-upper"><span class="cw-chord"><span class="cw-code-token" data-token-type="chord">G</span> <span class="cw-rhythm-token" data-token-type="rhythm">≧==</span></span>'));
assert.strictEqual((formatted.match(/data-token-type="rhythm"/g) || []).length, 3);
assert(!formatted.includes("cw-body-bar-token"));
assert(!formatted.includes('<span class="cw-body">----</span>'));

const rhythmSpacingRegression = preview.render("|[Bm7][≧≧≧=]--[--]--[F#m7][≧≧≧=]--[--]--|");
assert.strictEqual((rhythmSpacingRegression.match(/cw-rhythm-token/g) || []).length, 4);
assert.strictEqual((rhythmSpacingRegression.match(/cw-segment-rhythm-spacing/g) || []).length, 0);
assert(rhythmSpacingRegression.includes('<span class="cw-rhythm-token" data-token-type="rhythm">≧≧≧=</span>'));

const plainBars = preview.render("|[C]歌詞|");
assert(plainBars.startsWith('<div class="cw-score-line cw-score-line-has-lyrics">'));
assert.strictEqual((plainBars.match(/cw-boundary-leading/g) || []).length, 0);
assert.strictEqual((plainBars.match(/cw-boundary-trailing/g) || []).length, 0);
assert.strictEqual((plainBars.match(/cw-body-bar-token/g) || []).length, 2);
assert(plainBars.includes("cw-body-bar-token cw-bar-token-line-start"));

const partialMeasureAfterBar = preview.render("[C]----|(2/4)");
assert(partialMeasureAfterBar.includes("cw-body-bar-token cw-body-bar-token-before-text"));

const rhythmBeforeBracketedBar = preview.render("[|][Ab][----] [----][|][Ab7][--][(↓)][--] [----][|]");
assert.strictEqual((rhythmBeforeBracketedBar.match(/cw-segment-has-trailing-upper-bar/g) || []).length, 2);
assert.strictEqual((rhythmBeforeBracketedBar.match(/cw-boundary-trailing/g) || []).length, 2);

const throughBarPair = preview.render("[|] |");
assert(throughBarPair.includes("cw-boundary-leading cw-boundary-upper cw-boundary-line-start"));
assert(throughBarPair.includes("cw-body-bar-token cw-bar-token-line-start"));
assert(!throughBarPair.includes('<span class="cw-body"> <span'));
assert(!throughBarPair.includes("cw-boundary-before-chord"));

const leadingBarBeforeChord = preview.render("[|][DbM7]く");
assert(leadingBarBeforeChord.includes("cw-boundary-line-start cw-boundary-before-chord"));

const bracketedBars = preview.render("[|][C][----]歌詞[|]");
assert.strictEqual((bracketedBars.match(/cw-boundary-upper/g) || []).length, 2);
assert.strictEqual((bracketedBars.match(/cw-body-bar-token/g) || []).length, 0);

const requestedLyricLayout = preview.render("[|][CM7]あそ[CmM7]この[|][Bm7]森[Em7]の　[|][Am7]満[G/B]開[|][CM7]の下(し[D7]た)[|][D7sus4][----][----]は[|]");
assert(requestedLyricLayout.startsWith('<div class="cw-score-line cw-score-line-has-lyrics">'));
assert.strictEqual((requestedLyricLayout.match(/cw-boundary-upper/g) || []).length, 6);
assert.strictEqual((requestedLyricLayout.match(/cw-body-bar-token/g) || []).length, 0);

const wideChordBars = preview.render("|[E7/G#]要|[Am7]です|");
assert.strictEqual((wideChordBars.match(/cw-segment-has-trailing-bar/g) || []).length, 3);
assert(wideChordBars.includes('<span class="cw-body">要<span class="cw-body-bar-token" data-token-type="bar">|</span></span>'));

const chordOnlySpacing = preview.render("|[GM7]----|[GM7]----|[Am7]----|[D7]----|");
assert(chordOnlySpacing.startsWith('<div class="cw-score-line">'));
assert.strictEqual((chordOnlySpacing.match(/class="cw-segment /g) || []).length, 5);
assert.strictEqual((chordOnlySpacing.match(/cw-segment-has-upper/g) || []).length, 4);
assert.strictEqual((chordOnlySpacing.match(/cw-boundary-leading/g) || []).length, 0);
assert(chordOnlySpacing.startsWith('<div class="cw-score-line"><span class="cw-segment cw-segment-has-trailing-bar"'));

const scaleLayoutSource = [
  "{c:＜メジャースケール＞　三和音}",
  "|[F#]----|[G#m]----|[A#m]----|[B]----|[C#]----|[D#m]----|[E#m-5][(Fm-5)]----|",
  "|[B]----|[C#m]----|[D#m]----|[E]----|[F#]----|[G#m]----|[A#m-5]----|",
  "|[E]----|[F#m]----|[G#m]----|[A]----|[B]----|[C#m]----|[D#m-5]----|",
  "|[A]----|[Bm]----|[C#m]----|[D]----|[E]----|[F#m]----|[G#m-5]----|",
  "|[D]----|[Em]----|[F#m]----|[G]----|[A]----|[Bm]----|[C#m-5]----|",
  "|[G]----|[Am]----|[Bm]----|[C]----|[D]----|[Em]----|[F#m-5]----|",
  "|[C]----|[Dm]----|[Em]----|[F]----|[G]----|[Am]----|[Bm-5]----|",
  "|[F]----|[Gm]----|[Am]----|[Bb]----|[C]----|[Dm]----|[Em-5]----|",
  "|[Bb]----|[Cm]----|[Dm]----|[Eb]----|[F]----|[Gm]----|[Am-5]----|",
  "|[Eb]----|[Fm]----|[Gm]----|[Ab]----|[Bb]----|[Cm]----|[Dm-5]----|",
  "|[Ab]----|[Bbm]----|[Cm]----|[Db]----|[Eb]----|[Fm]----|[Gm-5]----|",
  "|[Db]----|[Ebm]----|[Fm]----|[Gb]----|[Ab]----|[Bbm]----|[Cm-5]----|",
  "|[Gb]----|[Abm]----|[Bbm]----|[Cb][(B)]----|[Db]----|[Ebm]----|[Fm-5]----|",
  "{c:＜メジャースケール＞　四和音}",
  "|[F#M7]----|[G#m7]----|[A#m7]----|[BM7]----|[C#7]----|[D#m7]----|[E#m7-5][(Fm7-5)]----|",
  "|[BM7]----|[C#m7]----|[D#m7]----|[EM7]----|[F#7]----|[G#m7]----|[A#m7-5]----|",
  "|[EM7]----|[F#m7]----|[G#m7]----|[AM7]----|[B7]----|[C#m7]----|[D#m7-5]----|",
  "|[AM7]----|[Bm7]----|[C#m7]----|[DM7]----|[E7]----|[F#m7]----|[G#m7-5]----|",
  "|[DM7]----|[Em7]----|[F#m7]----|[GM7]----|[A7]----|[Bm7]----|[C#m7-5]----|",
  "|[GM7]----|[Am7]----|[Bm7]----|[CM7]----|[D7]----|[Em7]----|[F#m7-5]----|",
  "|[CM7]----|[Dm7]----|[Em7]----|[FM7]----|[G7]----|[Am7]----|[Bm7-5]----|",
  "|[FM7]----|[Gm7]----|[Am7]----|[BbM7]----|[C7]----|[Dm7]----|[Em7-5]----|",
  "|[BbM7]----|[Cm7]----|[Dm7]----|[EbM7]----|[F7]----|[Gm7]----|[Am7-5]----|",
  "|[EbM7]----|[Fm7]----|[Gm7]----|[AbM7]----|[Bb7]----|[Cm7]----|[Dm7-5]----|",
  "|[AbM7]----|[Bbm7]----|[Cm7]----|[DbM7]----|[Eb7]----|[Fm7]----|[Gm7-5]----|",
  "|[DbM7]----|[Ebm7]----|[Fm7]----|[GbM7]----|[Ab7]----|[Bbm7]----|[Cm7-5]----|",
  "|[GbM7]----|[Abm7]----|[Bbm7]----|[CbM7][(BM7)]----|[Db7]----|[Ebm7]----|[Fm7-5]----|"
].join("\n");
const scaleLayout = preview.render(scaleLayoutSource);
assert.strictEqual((scaleLayout.match(/class="cw-score-line"/g) || []).length, 26);
assert.strictEqual((scaleLayout.match(/class="cw-segment /g) || []).length, 208);
assert.strictEqual((scaleLayout.match(/cw-segment-has-upper/g) || []).length, 182);
assert.strictEqual((scaleLayout.match(/cw-boundary-leading/g) || []).length, 0);
assert.strictEqual((scaleLayout.match(/cw-body-bar-token/g) || []).length, 208);
assert.strictEqual((scaleLayout.match(/cw-code-token/g) || []).length, 186);
assert(scaleLayout.includes('(Fm-5)'));
assert(scaleLayout.includes('(BM7)'));

const escaped = preview.render("{c:<script>alert(1)</script>}");
assert(!escaped.includes("<script>"));
assert(escaped.includes("&lt;script&gt;"));

console.log("PASS: ChordWiki preview directives, links, chords, rhythm, suits and escaping");
