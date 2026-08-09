"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const testWorkflow = fs.readFileSync(path.join(root, ".github", "workflows", "test.yml"), "utf8");
const pagesWorkflow = fs.readFileSync(path.join(root, ".github", "workflows", "pages.yml"), "utf8");
const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");

assert(testWorkflow.includes("node-version: 24"));
assert(testWorkflow.includes("run: npm ci"));
assert(testWorkflow.includes("run: npm test"));
assert(pagesWorkflow.includes("actions/upload-pages-artifact@v5"));
assert(pagesWorkflow.includes("actions/deploy-pages@v5"));
assert(pagesWorkflow.includes("run: npm ci"));
assert(pagesWorkflow.includes("run: npm run build"));
assert(pagesWorkflow.includes("path: dist"));
assert(!pagesWorkflow.includes("row-edit-test.html"));
assert(readme.includes("![現在のヘルプ画面](help-usage-screenshot.png)"));
assert(readme.includes("[Releases](https://github.com/mapida222/ChordWiki-Bar-Formatter/releases)"));

console.log("PASS: GitHub CI, curated Pages deployment, README help image and Releases link");
