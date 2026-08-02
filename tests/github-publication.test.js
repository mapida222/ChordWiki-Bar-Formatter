"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const testWorkflow = fs.readFileSync(path.join(root, ".github", "workflows", "test.yml"), "utf8");
const pagesWorkflow = fs.readFileSync(path.join(root, ".github", "workflows", "pages.yml"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

assert(testWorkflow.includes("node-version: 24"));
assert(testWorkflow.includes("run: npm test"));
assert(pagesWorkflow.includes("actions/upload-pages-artifact@v3"));
assert(pagesWorkflow.includes("actions/deploy-pages@v4"));
assert(pagesWorkflow.includes("cp index.html chordwiki-preview.html style.css style-row-edit-test.css site/"));
assert(pagesWorkflow.includes("cp -R js site/js"));
assert(!pagesWorkflow.includes("cp row-edit-test.html"));
assert(readme.includes("![現在のヘルプ画面](help-usage-screenshot.png)"));
assert(readme.includes("[Releases](https://github.com/mapida222/ChordWiki-Bar-Formatter-Web/releases)"));

console.log("PASS: GitHub CI, curated Pages deployment, README help image and Releases link");
