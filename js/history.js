(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CBFHistoryStore = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const HISTORY_KEY = "chordWikiBarFormatter.history.v1";
  const CRASH_KEY = "chordWikiBarFormatter.crashRecovery.v1";
  const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

  function stableValue(value) {
    if (Array.isArray(value)) return value.map(stableValue);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
    }
    return value;
  }

  function signature(snapshot) {
    if (snapshot.historyText != null) {
      return JSON.stringify({ historyText: String(snapshot.historyText) });
    }
    return JSON.stringify(stableValue({
      inputText: String(snapshot.inputText || ""),
      correctionText: String(snapshot.correctionText || ""),
      rowAdoptionModes: Array.isArray(snapshot.rowAdoptionModes) ? snapshot.rowAdoptionModes : [],
      settings: snapshot.settings || {}
    }));
  }

  function titleFromText(text, savedAt) {
    const match = String(text || "").match(/^\s*\{title\s*:\s*(.*?)\s*\}\s*$/im);
    if (match?.[1]) return match[1].trim();
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
    }).format(new Date(savedAt));
  }

  function shouldRestoreCrash(crash, currentSnapshot, currentUpdatedAt = 0) {
    if (!crash) return false;
    if (crash.signature === signature(currentSnapshot)) return true;
    return !Number(currentUpdatedAt) || Number(crash.savedAt) >= Number(currentUpdatedAt);
  }

  function createStore(storage, now = () => Date.now()) {
    function readHistory() {
      try {
        const value = JSON.parse(storage.getItem(HISTORY_KEY) || "[]");
        return Array.isArray(value) ? value : [];
      } catch (_error) {
        return [];
      }
    }

    function writeHistory(entries) {
      let remaining = [...entries];
      while (true) {
        try {
          storage.setItem(HISTORY_KEY, JSON.stringify(remaining));
          return remaining;
        } catch (error) {
          if (remaining.length <= 1) throw error;
          remaining = remaining.slice(0, -1);
        }
      }
    }

    function prune() {
      const cutoff = now() - RETENTION_MS;
      const current = readHistory();
      const kept = current.filter((entry) => Number(entry.savedAt) >= cutoff).sort((a, b) => b.savedAt - a.savedAt);
      if (kept.length !== current.length) writeHistory(kept);
      return kept;
    }

    function list() {
      return prune();
    }

    function saveHistory(snapshot) {
      const entries = prune();
      const entrySignature = signature(snapshot);
      const duplicateIndex = entries.findIndex((entry) => entry.signature === entrySignature);
      if (duplicateIndex >= 0) {
        const current = entries[duplicateIndex];
        const savedAt = now();
        const canEnrich = !current.inputText
          && Boolean(snapshot.inputText)
          && current.initialOutputText == null
          && snapshot.initialOutputText != null;
        const refreshed = {
          ...current,
          savedAt,
          ...(canEnrich ? {
            title: String(snapshot.title || "").trim() || current.title,
            inputText: String(snapshot.inputText),
            testInputText: snapshot.testInputText == null ? current.testInputText : String(snapshot.testInputText),
            initialOutputText: String(snapshot.initialOutputText),
            idealOutputText: snapshot.idealOutputText == null ? current.historyText : String(snapshot.idealOutputText),
            correctionText: String(snapshot.correctionText || ""),
            rowAdoptionModes: Array.isArray(snapshot.rowAdoptionModes) ? snapshot.rowAdoptionModes : [],
            settings: snapshot.settings || {}
          } : {})
        };
        const nextEntries = [refreshed, ...entries.filter((_entry, index) => index !== duplicateIndex)];
        return {
          saved: true,
          refreshed: true,
          enriched: canEnrich,
          entry: refreshed,
          entries: writeHistory(nextEntries)
        };
      }
      const savedAt = now();
      const entry = {
        id: `${savedAt}-${Math.random().toString(36).slice(2, 9)}`,
        savedAt,
        title: String(snapshot.title || "").trim() || titleFromText(snapshot.historyText ?? snapshot.inputText, savedAt),
        inputText: String(snapshot.inputText || ""),
        historyText: snapshot.historyText == null ? undefined : String(snapshot.historyText),
        testInputText: snapshot.testInputText == null ? undefined : String(snapshot.testInputText),
        initialOutputText: snapshot.initialOutputText == null ? undefined : String(snapshot.initialOutputText),
        idealOutputText: snapshot.idealOutputText == null ? undefined : String(snapshot.idealOutputText),
        correctionText: String(snapshot.correctionText || ""),
        rowAdoptionModes: Array.isArray(snapshot.rowAdoptionModes) ? snapshot.rowAdoptionModes : [],
        settings: snapshot.settings || {},
        signature: entrySignature
      };
      return { saved: true, entry, entries: writeHistory([entry, ...entries]) };
    }

    function saveCrash(snapshot) {
      const savedAt = now();
      const entry = {
        savedAt,
        title: titleFromText(snapshot.inputText, savedAt),
        inputText: String(snapshot.inputText || ""),
        correctionText: String(snapshot.correctionText || ""),
        rowAdoptionModes: Array.isArray(snapshot.rowAdoptionModes) ? snapshot.rowAdoptionModes : [],
        settings: snapshot.settings || {},
        signature: signature(snapshot)
      };
      storage.setItem(CRASH_KEY, JSON.stringify(entry));
      return entry;
    }

    function getCrash() {
      try {
        const value = JSON.parse(storage.getItem(CRASH_KEY) || "null");
        return value && typeof value === "object" ? value : null;
      } catch (_error) {
        return null;
      }
    }

    function clearCrash() {
      storage.removeItem(CRASH_KEY);
    }

    function clearHistory() {
      storage.removeItem(HISTORY_KEY);
      return [];
    }

    return { list, prune, saveHistory, saveCrash, getCrash, clearCrash, clearHistory, signature };
  }

  return { createStore, signature, titleFromText, shouldRestoreCrash, HISTORY_KEY, CRASH_KEY, RETENTION_MS };
}));
