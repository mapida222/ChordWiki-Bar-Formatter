"use strict";
global.window = global;
if (!Array.prototype.findLastIndex) {
  Array.prototype.findLastIndex = function (predicate) {
    for (let index = this.length - 1; index >= 0; index -= 1) {
      if (predicate(this[index], index, this)) return index;
    }
    return -1;
  };
}
require("../js/converter.js");

const assert = require("assert");

assert(CBFConverter.sameMusicStructure("[C]入力[G]できます", "[C]入力[G]できました"));
assert(!CBFConverter.sameMusicStructure("[C]入力[G]できます", "[C]入力[Am]できます"));
assert(!CBFConverter.sameMusicStructure("[C]入力[G]できます", "[C]入力[|][G]できます"));

const previous = ["{title:曲}", "[C]一行目", "[F]修正した歌詞[G]です", "[Am]最後"];
const inserted = ["{title:曲}", "[C]一行目", "", "[F]修正済みの歌詞[G]です", "[Am]最後"];
assert.deepStrictEqual(CBFConverter.alignMusicLineIndices(previous, inserted), [0, 1, -1, 2, 3]);

const deleted = ["{title:曲}", "[F]修正済みの歌詞[G]です", "[Am]最後"];
assert.deepStrictEqual(CBFConverter.alignMusicLineIndices(inserted, deleted), [0, 3, 4]);

const chordChanged = ["{title:曲}", "[C]一行目", "[F]修正済みの歌詞[Am]です", "[Am]最後"];
assert.deepStrictEqual(CBFConverter.alignMusicLineIndices(previous, chordChanged), [0, 1, -1, 3]);

console.log("PASS: source edits preserve matching row corrections and reset changed music structures only");
