(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CBFOutputOverrides = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function lines(value) {
    return String(value ?? "").replace(/\r\n?/g, "\n").split("\n");
  }

  function normalizeIds(lineCount, savedIds, createId) {
    const used = new Set();
    return Array.from({ length: lineCount }, (_, index) => {
      const candidate = typeof savedIds?.[index] === "string" ? savedIds[index] : "";
      const id = candidate && !used.has(candidate) ? candidate : createId();
      used.add(id);
      return id;
    });
  }

  function remapIds(mapping, previousIds, createId) {
    const used = new Set();
    return mapping.map((previousIndex) => {
      const candidate = previousIndex >= 0 ? previousIds[previousIndex] : "";
      const id = candidate && !used.has(candidate) ? candidate : createId();
      used.add(id);
      return id;
    });
  }

  function sanitize(overrides) {
    if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) return {};
    return Object.fromEntries(Object.entries(overrides).flatMap(([id, value]) => {
      if (!id || !value || typeof value !== "object") return [];
      return [[id, {
        text: String(value.text ?? ""),
        baseText: String(value.baseText ?? ""),
        suppressed: Boolean(value.suppressed)
      }]];
    }));
  }

  function capture(baseText, editedText, ids, alignLineIndices) {
    const baseLines = lines(baseText);
    const editedLines = lines(editedText);
    const stableIds = normalizeIds(baseLines.length, ids, () => "");
    if (baseText === editedText) return {};
    const mapping = alignLineIndices(baseLines, editedLines);
    const owners = [...mapping];
    for (let index = 0; index < owners.length;) {
      if (owners[index] >= 0) { index += 1; continue; }
      const start = index;
      while (index < owners.length && owners[index] < 0) index += 1;
      const end = index;
      const previousOwner = start > 0 ? owners[start - 1] : -1;
      const nextOwner = end < owners.length ? owners[end] : baseLines.length;
      const missingOwners = [];
      for (let owner = previousOwner + 1; owner < nextOwner; owner += 1) missingOwners.push(owner);
      for (let offset = 0; offset < end - start; offset += 1) {
        if (missingOwners.length) {
          const candidateIndex = Math.min(missingOwners.length - 1, Math.floor(offset * missingOwners.length / (end - start)));
          owners[start + offset] = missingOwners[candidateIndex];
        } else {
          owners[start + offset] = previousOwner >= 0 ? previousOwner : Math.min(nextOwner, baseLines.length - 1);
        }
      }
    }
    const assigned = baseLines.map(() => []);
    editedLines.forEach((line, index) => {
      const owner = owners[index];
      if (owner >= 0 && owner < assigned.length) assigned[owner].push(line);
    });
    const overrides = {};
    baseLines.forEach((baseLine, index) => {
      const id = stableIds[index];
      if (!id) return;
      const suppressed = assigned[index].length === 0;
      const text = assigned[index].join("\n");
      if (suppressed || text !== baseLine) overrides[id] = { text, baseText: baseLine, suppressed };
    });
    return overrides;
  }

  function apply(baseText, ids, overrides) {
    const baseLines = lines(baseText);
    const safe = sanitize(overrides);
    const output = [];
    baseLines.forEach((line, index) => {
      const override = safe[ids[index]];
      if (!override) output.push(line);
      else if (!override.suppressed) output.push(...lines(override.text));
    });
    return output.join("\n");
  }

  function overriddenIndices(ids, overrides) {
    const safe = sanitize(overrides);
    return new Set(ids.flatMap((id, index) => safe[id] ? [index] : []));
  }

  function prune(ids, overrides) {
    const knownIds = new Set(ids.filter((id) => typeof id === "string" && id));
    return Object.fromEntries(Object.entries(sanitize(overrides))
      .filter(([id]) => knownIds.has(id)));
  }

  function validateState({
    lineCount,
    sourceLineIds: ids,
    rowAdoptionModes = [],
    outputOverrides = {},
    manualOutputLines = [],
    convertedOutput,
    outputText,
    finalOutputText
  }) {
    const errors = [];
    const safeIds = Array.isArray(ids) ? ids : [];
    const safeModes = Array.isArray(rowAdoptionModes) ? rowAdoptionModes : [];
    const safeOverrides = sanitize(outputOverrides);
    const expectedManualLines = overriddenIndices(safeIds, safeOverrides);
    const actualManualLines = new Set(manualOutputLines instanceof Set ? manualOutputLines : manualOutputLines || []);
    const allowedModes = new Set(["", "none", "auto", "edit", "source", "recovered", "fixed"]);

    if (safeIds.length !== Number(lineCount)) errors.push("sourceLineIds length does not match input line count");
    if (safeIds.some((id) => typeof id !== "string" || !id)) errors.push("sourceLineIds contains an empty or non-string ID");
    if (new Set(safeIds).size !== safeIds.length) errors.push("sourceLineIds contains duplicate IDs");
    if (safeModes.length > safeIds.length) errors.push("rowAdoptionModes has more entries than sourceLineIds");
    if (safeModes.some((mode) => !allowedModes.has(mode))) errors.push("rowAdoptionModes contains an unknown mode");
    if (Object.keys(safeOverrides).some((id) => !safeIds.includes(id))) errors.push("outputOverrides contains an orphan ID");
    if (actualManualLines.size !== expectedManualLines.size
      || [...actualManualLines].some((index) => !expectedManualLines.has(index))) {
      errors.push("manualOutputLines does not match outputOverrides");
    }
    if (convertedOutput != null && typeof convertedOutput !== "string") errors.push("convertedOutput is not text");
    if (outputText != null && finalOutputText != null && outputText !== finalOutputText) errors.push("output and finalOutput differ");
    return { valid: errors.length === 0, errors };
  }

  return { lines, normalizeIds, remapIds, sanitize, capture, apply, overriddenIndices, prune, validateState };
}));
