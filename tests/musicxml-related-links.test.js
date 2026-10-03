"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(
  path.join(__dirname, "..", "musicxml-converter.html"),
  "utf8"
);
const css = fs.readFileSync(
  path.join(__dirname, "..", "musicxml-converter.css"),
  "utf8"
);

const roles = [
  "歌詞にコードをつける",
  "ハイフン数を修正する",
  "プレビューを見ながら編集する",
];
const buttons = [
  "りりか",
  "ChordWiki Bar Formatter",
  "リアルタイムエディター",
];

const roleMatches = [...html.matchAll(/class="converter-related-role"[^>]*>([^<]+)</g)].map(
  (match) => match[1].trim()
);
const buttonMatches = [...html.matchAll(/class="realtime-editor-open"[^>]*>([^<]+)</g)].map(
  (match) => match[1].trim()
);

assert.deepStrictEqual(roleMatches, roles, "three tool role descriptions must be ordered above the buttons");
assert.deepStrictEqual(buttonMatches, buttons, "three tool buttons must use the requested labels");
assert.match(html, /03\. ChordPro形式出力 <span>\/ RESULT<\/span>/, "the output heading must identify the ChordPro format");
assert.match(html, /<h2>MusicXMLをChordPro形式へ変換<\/h2>/, "the page heading must identify the ChordPro format");
assert.match(html, /aria-label="ChordPro形式出力をコピー"/, "the copy control must identify the ChordPro output");
assert.match(html, /class="converter-related-link"[\s\S]*?class="converter-related-role"/, "each tool must be wrapped as a role card");
assert.match(html, /<small class="converter-related-note">変換結果をコピー → りりかの上枠に貼り付け<\/small>/, "Ririka must explain the copy-and-paste step");
assert.match(html, /<p class="output-guidance">MusicXMLからの出力はリズム確認用の下書きです。ChordWikiへ投稿する場合、歌詞を含めて整形してからご利用ください。（インスト曲を除く）<\/p>/, "the guidance must use the requested ChordWiki wording and instrumental exception");
assert.match(css, /\.converter-related-links \.realtime-editor-open\{[^}]*height:48px/, "related tool buttons must share one fixed height");
assert.doesNotMatch(css, /\.converter-input-card::after,\.report-card::after\{[^}]*content:"▼"/, "source and report cards must not show arrows toward the output card");
assert.match(css, /\.converter-input-card::after\{[^}]*content:"▶"/, "the source card must point horizontally to the report card");
assert.match(css, /\.report-card::after\{[^}]*content:"▼"/, "the report card must point down to the output card");
assert.match(css, /\.converter-related-link::before\{[^}]*content:"▼"/, "each related tool must receive a down arrow from the output card");
assert.doesNotMatch(html, /class="converter-flow-arrow"/, "the output card must use one arrow per related tool");
const outputStart = html.indexOf('class="converter-card output-card');
const outputEnd = html.indexOf('</article>', outputStart);
const guidanceIndex = html.indexOf('class="output-guidance"');
assert.ok(outputEnd >= 0 && guidanceIndex > outputEnd, "the MusicXML guidance must sit immediately below the output card");
assert.match(html, /<div class="converter-output-followup">[\s\S]*class="output-guidance"[\s\S]*class="converter-related-links"/, "the guidance and related tools must follow the output card");

console.log("PASS: MusicXML related tools show role descriptions above labeled buttons");
