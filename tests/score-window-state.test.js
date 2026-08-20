"use strict";

const assert = require("assert");
const api = require("../js/score-window-state.js");

class MemoryStorage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
}

const messages = [];
const channel = { postMessage(value) { messages.push(value); } };
const fakeWindow = { BroadcastChannel: function () { return channel; } };
let time = 100;
const storage = new MemoryStorage();
const bridge = api.createBridge(storage, fakeWindow, () => time);
const first = bridge.publish({ source: "main", text: "first" });
const saved = JSON.parse(storage.getItem(api.STATE_KEY));

assert.strictEqual(saved.text, "first");
assert.strictEqual(saved.updatedAt, first.updatedAt);
assert.strictEqual(messages[0].type, "score-state");
assert.strictEqual(messages[0].payload.updatedAt, first.updatedAt);

time = 200;
const current = bridge.current({ source: "main", text: "request" });
assert.strictEqual(current.updatedAt, first.updatedAt, "request responses must not advance the revision");
const second = bridge.publish({ source: "main", text: "second" });
assert(second.updatedAt > first.updatedAt, "published state must advance monotonically");
assert.strictEqual(messages.length, 2);

console.log("PASS: score-window state bridge persists and broadcasts monotonic revisions");
