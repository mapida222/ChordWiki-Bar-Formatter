"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "../js/mobile-correction-focus.js"), "utf8");

function harness({ narrow = true, viewport = true } = {}) {
  function target() {
    const listeners = {};
    return { addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
      fire(type, event = {}) { for (const fn of listeners[type] || []) fn(event); } };
  }
  function element() {
    const classes = new Set();
    const attrs = {};
    return Object.assign(target(), {
      hidden: true, textContent: "", value: "", scrollTop: 0, clientHeight: 50,
      style: { setProperty(name, value) { this[name] = value; }, removeProperty(name) { delete this[name]; } },
      classList: { add(c) { classes.add(c); }, remove(c) { classes.delete(c); }, contains(c) { return classes.has(c); } },
      setAttribute(k, v) { attrs[k] = String(v); }, getAttribute(k) { return attrs[k] ?? null; }, removeAttribute(k) { delete attrs[k]; },
      contains(node) { return node === this; },
      getBoundingClientRect() { return { height: 60 }; },
      focus() { doc.activeElement = this; this.fire("focus"); },
      blur() { doc.activeElement = null; this.fire("blur"); }
    });
  }
  const selectors = [".correction-card", ".correction-symbol-toolbar", "#correction-text", "#output-text", "#mobile-correction-focus", "#mobile-correction-row", "#mobile-correction-result", "#mobile-correction-done", "#mobile-correction-placeholder", "#mobile-correction-more", "#mobile-correction-symbols", ".correction-card .editor-heading"];
  const nodes = Object.fromEntries(selectors.map(s => [s, element()]));
  const doc = Object.assign(target(), { querySelector(s) { return nodes[s]; }, activeElement: null, documentElement: element() });
  const media = Object.assign(target(), { matches: narrow });
  const vv = viewport ? Object.assign(target(), { height: 420, width: 393, offsetTop: 23, offsetLeft: 0 }) : null;
  const frames = [];
  const win = Object.assign(target(), { matchMedia: () => media, visualViewport: vv, innerHeight: 852, innerWidth: 393,
    scrollX: 0, scrollY: 900, scrollTo() {}, requestAnimationFrame(fn) { frames.push(fn); },
    getComputedStyle() { return { lineHeight: "26", paddingTop: "14" }; } });
  vm.runInNewContext(source, { window: win, document: doc });
  const flush = () => { while (frames.length) frames.splice(0).forEach(fn => fn()); };
  return { win, doc, nodes, media, vv, flush };
}

const h = harness();
const n = h.nodes;
const textarea = n["#correction-text"];
textarea.value = "44\n88";
n["#output-text"].value = "[C]----\n[G]--------";
h.doc.fire("cbf:linked-position", { detail: { lineIndex: 1 } });
textarea.focus();
h.flush();
assert(n[".correction-card"].classList.contains("mobile-correction-active"));
assert.equal(n["#mobile-correction-row"].textContent, "2行目を編集中");
assert.equal(n["#mobile-correction-result"].textContent, "[G]--------");
assert.equal(textarea.getAttribute("inputmode"), "numeric");
assert(textarea.scrollTop > 0, "selected row stays visible without replacing the textarea");
assert.equal(textarea.value, "44\n88", "layout must not rewrite authored values");
assert.equal(n[".correction-card"].style["--mobile-edit-top"], "31px");
h.vv.height = 330;
h.vv.fire("resize");
h.flush();
assert.equal(n[".correction-card"].style["--mobile-edit-height"], "254px");
assert(n[".correction-card"].classList.contains("mobile-correction-tight"), "short visible areas reserve room for the converted result");
n["#output-text"].value = "[C]----\n[G]--";
h.doc.fire("cbf:linked-position", { detail: { lineIndex: 1 } });
h.flush();
assert.equal(n["#mobile-correction-result"].textContent, "[G]--", "same-row conversion changes must refresh");
n["#mobile-correction-more"].fire("click");
assert.equal(n["#mobile-correction-more"].getAttribute("aria-expanded"), "true");
n["#mobile-correction-done"].fire("click");
h.flush();
assert(!n[".correction-card"].classList.contains("mobile-correction-active"));
assert.equal(n["#mobile-correction-focus"].hidden, true);
assert.equal(textarea.getAttribute("inputmode"), "numeric", "next mobile tap must open the numeric keyboard immediately");
assert.equal(textarea.value, "44\n88");
textarea.focus(); h.flush();
h.media.matches = false; h.media.fire("change"); h.flush();
assert(!n[".correction-card"].classList.contains("mobile-correction-active"), "rotation to desktop restores ordinary layout");
assert.equal(textarea.getAttribute("inputmode"), null, "wide screens retain their ordinary keyboard");
const desktop = harness({ narrow: false });
desktop.nodes["#correction-text"].focus(); desktop.flush();
assert(!desktop.nodes[".correction-card"].classList.contains("mobile-correction-active"));
const fallback = harness({ viewport: false });
fallback.nodes["#correction-text"].focus(); fallback.flush();
assert(fallback.nodes[".correction-card"].classList.contains("mobile-correction-active"));
const tap = harness();
tap.nodes["#correction-text"].fire("pointerdown");
tap.nodes["#correction-text"].focus(); tap.flush();
assert(!tap.nodes[".correction-card"].classList.contains("mobile-correction-active"), "do not move the target under a held first tap");
tap.doc.fire("pointerup"); tap.flush();
assert(tap.nodes[".correction-card"].classList.contains("mobile-correction-active"));
console.log("PASS: mobile correction display follows the viewport and converted row without owning edits");
