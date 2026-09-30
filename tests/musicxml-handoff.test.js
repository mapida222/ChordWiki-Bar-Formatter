"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "musicxml-converter.html"), "utf8");
const formatterHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const previewHtml = fs.readFileSync(path.join(root, "committed-preview.html"), "utf8");
const page = fs.readFileSync(path.join(root, "js", "musicxml-converter-page.js"), "utf8");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const preview = fs.readFileSync(path.join(root, "js", "committed-preview-window.js"), "utf8");

assert.match(html, /href="index\.html\?import=musicxml"/, "Formatter link must request a MusicXML import");
assert.match(html, /href="committed-preview\.html\?import=musicxml"/, "realtime editor link must request a MusicXML import");
assert.match(page, /MUSICXML_HANDOFF_STORAGE_KEY/, "converter page must persist a MusicXML handoff");
assert.match(page, /saveMusicXmlHandoff\('formatter'/, "Formatter navigation must save the converted text");
assert.match(page, /saveMusicXmlHandoff\('realtime'/, "realtime editor navigation must save the converted text");
assert.match(app, /consumeMusicXmlHandoff\('formatter'/, "Formatter must consume the MusicXML handoff");
assert.match(app, /localStorage\.removeItem\(MUSICXML_HANDOFF_STORAGE_KEY\)/, "Formatter must consume the handoff only once");
assert.match(formatterHtml, /id="musicxml-handoff-dialog"/, "Formatter must show a dedicated overwrite dialog");
assert.match(formatterHtml, /class="committed-replace-dialog musicxml-handoff-dialog"/, "Formatter overwrite dialog must use the compact layout");
assert.match(formatterHtml, /<h2 id="musicxml-handoff-title">変換結果を上書きしますか？<\/h2>/, "Formatter overwrite dialog must use the shared title");
assert.match(formatterHtml, /<p>MusicXMLの変換結果で、現在の内容を置き換えます。<\/p>/, "Formatter overwrite dialog must use the shared explanation");
assert.match(app, /elements\.musicXmlHandoffDialog\.showModal\(\)/, "Formatter must open the overwrite dialog over the existing content");
assert.doesNotMatch(app, /window\.confirm\("現在の入力内容をMusicXML変換結果で上書きします。よろしいですか？"\)/, "Formatter must not use the browser-native confirmation");
assert.match(preview, /MUSICXML_HANDOFF_STORAGE_KEY/, "realtime editor must read the MusicXML handoff");
assert.match(preview, /consumeMusicXmlHandoff\('realtime'/, "realtime editor must consume the MusicXML handoff");
assert.match(preview, /replaceDialog\.showModal\(\)/, "realtime editor must open the overwrite dialog over the existing content");
assert.doesNotMatch(preview, /window\.confirm\("現在の編集内容をMusicXML変換結果で上書きしますか？"\)/, "realtime editor must not use the browser-native confirmation");
assert.match(previewHtml, /class="committed-replace-dialog musicxml-handoff-dialog"/, "realtime editor overwrite dialog must use the compact layout");
assert.match(previewHtml, /<h2 id="committed-replace-title">変換結果を上書きしますか？<\/h2>/, "realtime editor overwrite dialog must use the shared title");
assert.match(previewHtml, /<p>MusicXMLの変換結果で、現在の内容を置き換えます。<\/p>/, "realtime editor overwrite dialog must use the shared explanation");
assert.match(preview, /publishText\(\)/, "realtime editor must publish the imported text into its preview");

console.log("PASS: MusicXML output handoff reaches the two same-origin destinations");
