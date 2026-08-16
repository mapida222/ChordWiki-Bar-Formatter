"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "js", "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");

assert(!html.includes('id="settings-profile-picker"'), "拍子プロファイルの選択UIは設定欄から削除する");
assert(html.includes('id="settings-advanced-grid"'), "詳細設定用の表示領域が必要");
assert(html.includes("説明・使用例"), "説明・使用例の折りたたみボタンを表示する");
assert(!html.includes('data-panel="settings" data-column="direct"'), "設定欄の右下リサイズ枠を表示しない");
assert(app.includes('const basicKeys = new Set(["measureCapacity", "hyphenUnit", "hyphenSpacing"])'));
assert(app.includes('const settingOrder = ["measureCapacity", "hyphenUnit", "hyphenSpacing", "shortFractionPrepose", "longBeatLyricPlacement", "showContinuationChord", "singleCharacterHyphens"]'), "visible settings order must follow conversion priority");
assert(app.includes('renderSettings(loadedSettings);') && app.indexOf('renderSettings(loadedSettings);') < app.lastIndexOf('showScorePreview();'), "settings must render before the preview can initialize");
assert(app.includes('elements.settingsBody.addEventListener("input"'));
assert(app.includes('class="setting-help context-help"'));
assert(app.includes('positionSettingHelpPopover') && app.includes('popover.style.position = "fixed"'), "初期設定のヘルプは画面前面に固定表示する");
assert(app.includes('document.addEventListener("pointerdown", (event) => {') && app.includes('if (!event.target.closest(".context-help")) closeContextHelp();') && app.includes('}, true);'), "ヘルプは設定枠内でイベントが止められても別の場所をクリックすると閉じる");
assert(app.includes('const keepPinned = pinned || (openContextHelpButton === button && button.dataset.pinned === "true");'), "ホバータイマーはクリック固定状態を解除しない");
assert(app.includes('if (button.dataset.pinned !== "true") showContextHelp(button);'), "固定中のヘルプをホバー処理で開き直さない");
assert(app.includes('function toggleContextHelp(button)') && app.includes('if (button.dataset.pinned === "true") closeContextHelp(button);'), "同じヘルプボタンの再クリックで閉じる");
assert.strictEqual((app.match(/toggleContextHelp\(button\);/g) || []).length, 2, "固定HTMLと動的な初期設定のヘルプで同じ切替処理を使う");
assert(app.includes('Array.from({ length: definition.max - definition.min + 1 }'));
assert(app.includes('const standardValues = new Set([...RECOMMENDED_VALUES.fourFour, ...RECOMMENDED_VALUES.sixEight])'));
assert(app.includes('setting-option-common') && app.includes('setting-option-rare'), "numeric settings must distinguish recommended and less-used options visually");
assert(css.includes(".settings-panel.settings-compact { height: auto; }"));
assert(css.includes(".settings-panel.settings-compact .settings-shell { overflow: visible; max-height: none; }"), "初期設定のヘルプポップオーバーは設定枠の外へ表示できる");
assert(css.includes(".settings-panel.settings-closed { height: auto; min-height: 0; overflow: visible; }"), "closed settings must keep its heading and open button visible");
assert(css.includes(".settings-panel.settings-compact .settings-advanced > summary"));
assert(css.includes("@media (min-width: 700px)") && css.includes(".settings-panel { position: absolute; top: 0; left: 0; width: var(--left-column-width); }"), "desktop settings must overlay the row-edit card when open");

console.log("PASS: compact settings layout keeps existing setting keys and removes profile/corner UI");
