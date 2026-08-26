"use strict";
const assert = require("assert");
const preview = require("../js/chordwiki-preview.js");
const embed = require("../js/chordwiki-embed.js");

const payload = embed.createPayload("{t:タイトル}\n[C]歌詞----|");
assert.strictEqual(payload.type, "chordwiki:render");
assert.strictEqual(payload.version, 1);
assert.strictEqual(payload.source, "{t:タイトル}\n[C]歌詞----|");
assert(Array.isArray(payload.model.lines));
assert(payload.html.includes("cw-title"));
assert(payload.html.includes("歌詞"));

const sent = [];
const returned = embed.send({ postMessage: (value, origin) => sent.push({ value, origin }) }, "{key:C}", "https://example.com");
assert.strictEqual(sent.length, 1);
assert.strictEqual(sent[0].origin, "https://example.com");
assert.strictEqual(sent[0].value.html, returned.html);

const element = { innerHTML: "" };
const instance = embed.mount(element, "{c:最初}", { preview });
assert.strictEqual(instance.getSource(), "{c:最初}");
const next = instance.setSource("{c:更新}");
assert.strictEqual(instance.getPayload(), next);
assert(element.innerHTML.includes("更新"));
instance.destroy();

console.log("PASS: ChordWiki embed payload, postMessage and mount API");
