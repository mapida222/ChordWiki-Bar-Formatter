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
assert(testWorkflow.includes("run: npm run verify"));
assert(pagesWorkflow.includes("actions/upload-pages-artifact@v5"));
assert(pagesWorkflow.includes("actions/deploy-pages@v5"));
assert(pagesWorkflow.includes("run: npm ci"));
assert(pagesWorkflow.includes("run: npm run verify"));
assert(pagesWorkflow.includes("path: dist"));
assert(!pagesWorkflow.includes("row-edit-test.html"));
assert(readme.includes("## ヘルプ・使い方"));
assert(readme.includes("![ヘルプ・使い方：ツール概要](docs/images/readme-help01.png)"));
assert(readme.includes("![ヘルプ・使い方：基本フロー](docs/images/readme-help02.png)"));
assert(readme.includes("![ヘルプ・使い方：変換例と確認](docs/images/readme-help03.png)"));
assert(readme.includes("## リアルタイムエディター"));
assert(readme.includes("![リアルタイムエディター](docs/images/readme-realtime-editor.png)"));
assert(readme.includes("入力内容はリアルタイムで反映され、譜面側の行をクリックすると対応する編集行を確認できます。"));
assert(readme.includes("[Releases](https://github.com/mapida222/ChordWiki-Bar-Formatter/releases)"));
assert(!readme.includes("127.0.0.1:5173"));
assert(!readme.includes("画面の番号に沿って、次の5段階で使います。"));

console.log("PASS: GitHub CI, curated Pages deployment, README help image and Releases link");
