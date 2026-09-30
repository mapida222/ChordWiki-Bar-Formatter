"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const formatterHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const converterHtml = fs.readFileSync(path.join(root, "musicxml-converter.html"), "utf8");
const formatterCss = fs.readFileSync(path.join(root, "style.css"), "utf8");

assert.match(formatterHtml, /<a id="header-musicxml-converter" class="help-open-button" href="musicxml-converter\.html">MusicXML変換<\/a>/, "Formatter must expose MusicXML conversion in the primary header actions");
assert.match(converterHtml, /<a class="converter-back-link" href="index\.html">ChordWiki Bar Formatterへ戻る<\/a>/, "MusicXML conversion must provide a single clear return link");
assert.match(formatterCss, /#header-musicxml-converter/, "the MusicXML header action must have dedicated responsive styling");
assert.match(formatterCss, /#header-musicxml-converter::after \{ content: "↗"; margin-inline-start: \.4em;/, "the MusicXML header action must show the same external-page cue as the realtime editor");
assert.match(converterHtml, /MusicXMLのコード進行を読み取り、ChordPro形式の下書きを作り、コピーまたは保存できるようにします。/, "MusicXML conversion must identify the ChordPro draft format");
assert(converterHtml.includes('href="https://musescore.org/"') && converterHtml.includes(">MuseScore</a>"), "MusicXML description must link to MuseScore");
assert(converterHtml.includes('href="https://piano-sheet-converter.beta.yamaha.com/"') && converterHtml.includes(">Piano Sheet Converter</a>"), "MusicXML description must link to Piano Sheet Converter");
assert.match(converterHtml, /<footer class="site-footer" aria-label="サイト情報">/, "MusicXML conversion must include the shared site footer");
assert(converterHtml.includes('class="community-logo-link community-site-logo"') && converterHtml.includes('href="https://mapida222.github.io/ChordWiki-Bar-Formatter/"'), "MusicXML footer must link back to the public Formatter site");
assert(converterHtml.includes('class="community-logo-link community-github-logo"') && converterHtml.includes('href="https://github.com/mapida222/ChordWiki-Bar-Formatter"'), "MusicXML footer must link to the GitHub repository");
assert.match(converterHtml, /href="privacy\.html">プライバシーポリシー<\/a>/, "MusicXML footer must expose the privacy policy");
assert(formatterHtml.indexOf('<footer class="site-footer"') > formatterHtml.indexOf('</main>'), "Formatter footer must remain outside the main content");
assert(converterHtml.indexOf('<footer class="site-footer"') > converterHtml.indexOf('</main>'), "MusicXML footer must remain outside the main content");

console.log("PASS: MusicXML header navigation is present in both directions");
