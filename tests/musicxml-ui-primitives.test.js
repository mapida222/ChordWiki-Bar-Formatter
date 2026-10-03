"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "musicxml-converter.html"), "utf8");
const primitives = fs.readFileSync(path.join(root, "ui-primitives.css"), "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

assert.match(html, /<link rel="stylesheet" href="ui-primitives\.css">/, "MusicXML must load the shared primitive stylesheet");

for (const token of [
  "--ui-space-1",
  "--ui-space-2",
  "--ui-radius-sm",
  "--ui-focus-ring",
  "--ui-elevation-1",
  "--ui-font-body",
  "--ui-font-mono",
]) {
  assert.match(primitives, new RegExp(`${token.replaceAll("-", "\\-")}\\s*:`), `${token} must be defined by the shared primitive stylesheet`);
}

for (const selector of [
  ".ui-button",
  ".ui-button--default",
  ".ui-button--primary",
  ".ui-button--secondary",
  ".ui-button--icon",
  ".ui-button:focus-visible",
  ".ui-button:disabled",
  ".ui-card",
  ".ui-card__header",
  ".ui-card__body",
  ".ui-card__footer",
  ".ui-card__section-title",
]) {
  assert.match(primitives, new RegExp(selector.replace(/[.:]/g, "\\$&")), `${selector} must be available as a shared primitive`);
}

assert.match(html, /id="clear-button" class="(?=[^"]*\bui-button\b)(?=[^"]*\bhelp-open-button\b)[^"]*"/, "reset must retain its existing class while using the default button primitive");
assert.match(html, /id="copy-button" class="(?=[^"]*\bui-button\b)(?=[^"]*\bhelp-open-button\b)[^"]*"[^>]*disabled/, "copy must retain its disabled behavior while using the button primitive");
assert.match(html, /id="remove-file" class="icon-button"/, "file removal must retain its specialized icon-button implementation during the PoC");
assert.doesNotMatch(html, /id="remove-file" class="[^"]*\bui-button\b/, "the specialized file removal icon must not be restyled during the PoC");
assert.equal((html.match(/<article class="(?=[^"]*\bconverter-card\b)[^"]*" data-ui-card>/g) || []).length, 3, "the three MusicXML cards must use the card primitive without losing converter-card classes");
assert.equal((html.match(/class="(?=[^"]*\bui-card__header\b)(?=[^"]*\beditor-heading\b)[^"]*"/g) || []).length, 3, "each MusicXML card must expose a shared header structure");
assert.equal((html.match(/class="(?=[^"]*\bui-card__body\b)[^"]*"/g) || []).length, 3, "each MusicXML card must expose shared body structure");
assert.equal((html.match(/class="(?=[^"]*\bui-card__section-title\b)(?=[^"]*\bcompact-editor-title\b)[^"]*"/g) || []).length, 3, "each MusicXML card must expose a shared section title");

const forbiddenDependency = (name) => /^(react|react-dom|tailwindcss|shadcn|@radix-ui\/)/.test(name);
assert.equal(Object.keys(packageJson.dependencies || {}).some(forbiddenDependency), false, "the PoC must not add React, Tailwind, shadcn, or Radix dependencies");
assert.equal(Object.keys(packageJson.devDependencies || {}).some(forbiddenDependency), false, "the PoC must not add React, Tailwind, shadcn, or Radix devDependencies");
const reducedMotionBlock = primitives.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/);
assert.ok(reducedMotionBlock, "shared buttons must provide a reduced-motion path");
assert.match(reducedMotionBlock[1], /\.ui-button\s*\{[\s\S]*transition-duration:\s*\.01ms/, "reduced-motion buttons must avoid animated transitions");

console.log("PASS: MusicXML shared Button/Card primitive contract is present without framework dependencies");
