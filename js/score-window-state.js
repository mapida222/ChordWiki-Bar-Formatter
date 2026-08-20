(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CBFScoreWindowState = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const STATE_KEY = "chordWikiBarFormatter.scoreWindow.v1";
  const CHANNEL_NAME = "chordWikiBarFormatter.scoreWindow.channel.v1";

  function createBridge(storage, windowObject = typeof window !== "undefined" ? window : null, now = () => Date.now()) {
    let revision = now();
    let channel = null;
    try {
      if (windowObject && "BroadcastChannel" in windowObject) channel = new windowObject.BroadcastChannel(CHANNEL_NAME);
    } catch (_error) {
      channel = null;
    }

    function stamp(payload) {
      revision = Math.max(now(), revision + 1);
      return { ...payload, updatedAt: revision };
    }

    function publish(payload) {
      const next = stamp(payload);
      try { storage.setItem(STATE_KEY, JSON.stringify(next)); } catch (_error) { /* preview still works locally */ }
      if (channel) channel.postMessage({ type: "score-state", payload: next });
      return next;
    }

    function current(payload) {
      return { ...payload, updatedAt: revision };
    }

    return { publish, current, channel, stateKey: STATE_KEY, channelName: CHANNEL_NAME };
  }

  return { createBridge, STATE_KEY, CHANNEL_NAME };
}));
