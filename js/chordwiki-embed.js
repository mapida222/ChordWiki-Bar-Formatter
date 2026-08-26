(function (root, factory) {
  const defaultPreview = typeof module === "object" && module.exports
    ? require("./chordwiki-preview.js")
    : root?.ChordWikiPreview || null;
  const api = factory(defaultPreview);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.ChordWikiEmbed = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function (preview) {
  "use strict";

  const MESSAGE_TYPE = "chordwiki:render";
  const VERSION = 1;

  function requirePreview(customPreview) {
    const value = customPreview || preview;
    if (!value || typeof value.parse !== "function" || typeof value.render !== "function") {
      throw new Error("ChordWikiEmbed requires ChordWikiPreview");
    }
    return value;
  }

  function createPayload(source, customPreview) {
    const renderer = requirePreview(customPreview);
    const text = String(source ?? "");
    return {
      type: MESSAGE_TYPE,
      version: VERSION,
      source: text,
      model: renderer.parse(text),
      html: renderer.render(text)
    };
  }

  function renderInto(element, source, customPreview) {
    if (!element || (typeof element.replaceChildren !== "function" && !("innerHTML" in element))) {
      throw new TypeError("A DOM element is required");
    }
    const renderer = requirePreview(customPreview);
    if (typeof element.replaceChildren !== "function") {
      element.innerHTML = renderer.render(String(source ?? ""));
      return element;
    }
    renderer.renderInto(element, String(source ?? ""));
    return element;
  }

  function mount(element, source = "", options = {}) {
    const renderer = requirePreview(options.preview);
    let currentSource = String(source ?? "");
    let currentPayload = createPayload(currentSource, renderer);

    function update(nextSource) {
      currentSource = String(nextSource ?? "");
      currentPayload = createPayload(currentSource, renderer);
      renderInto(element, currentSource, renderer);
      options.onChange?.(currentPayload);
      return currentPayload;
    }

    renderInto(element, currentSource, renderer);
    return {
      getSource: () => currentSource,
      getPayload: () => currentPayload,
      setSource: update,
      destroy: () => {
        if (typeof element.replaceChildren === "function") element.replaceChildren();
        else element.innerHTML = "";
      }
    };
  }

  function send(targetWindow, source, targetOrigin = "*") {
    if (!targetWindow || typeof targetWindow.postMessage !== "function") {
      throw new TypeError("A target window with postMessage is required");
    }
    const payload = createPayload(source);
    targetWindow.postMessage(payload, targetOrigin);
    return payload;
  }

  return { VERSION, MESSAGE_TYPE, createPayload, renderInto, mount, send };
}));
