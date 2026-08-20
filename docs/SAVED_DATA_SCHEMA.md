# 保存データschema契約

この文書は、ChordWiki Bar Formatterの保存形式ごとの所有範囲と互換性を固定する。保存形式は用途別に分かれており、ひとつのschemaへ統合しない。

## 共通原則

- 保存データの読み込みでは、欠落・不正値を既定値または空値へ正規化する。既存データを読めない変更は、明示的な移行なしに行わない。
- `sourceLineIds`が行の同一性、`outputOverrides`が変換後の手動上書き、`rowAdoptionModes`が行の採用状態を所有する。行番号は保存上の永続キーにしない。
- `manualOutputLines`は`outputOverrides`から導出される実行時状態であり、独立した保存schemaの所有者ではない。
- `convertedOutput`と`finalOutput`は変換・表示の実行時結果であり、履歴・JSONへ直接保存する正本ではない。復元時に入力・行修正・設定から再生成する。
- `committedOutputText`は「確定譜面」の保存値で、変換後結果とは別のユーザー編集可能な成果物である。

## 保存形式一覧

| 形式 | 保存先 | 所有する状態 | 保存しない状態 | version | 読み込み・互換性 |
|---|---|---|---|---|---|
| 設定プロファイル | `localStorage` の `chordWikiBarFormatter.settingsProfiles.v1`、`settingsProfile.v1` | 変換設定、プロファイル名、選択中プロファイル | 入力・行修正・出力・履歴 | キー名のみ`v1`。payloadにschemaVersionなし | `CBFSettings.load()`が既定値と保存値を合成。不正JSONは既定値。旧`settings.v1`を4/4設定へ移行的にfallback |
| 作業中の個別状態 | `localStorage` の`inputText.v1`、`correctionText.v1`、`sourceLineIds.v1`、`rowAdoptionModes.v1`、`outputOverrides.v1`、`committedOutput.v1` | 現在の入力、行修正、行ID、採用状態、手動上書き、確定譜面 | 履歴一覧、変換器内部の`convertedOutput`／`finalOutput` | キー名のversion。集合schemaVersionなし | JSON配列・オブジェクトを読み込み、ID・overrideをsanitize。行IDは不足時に生成。旧行修正syntaxはversionなしの`correctionSyntaxVersion=2`で移行 |
| 表示・環境設定 | `localStorage` のtheme、font、fontSize、layout、displayPanel、preview各キー等 | テーマ、フォント、枠サイズ、表示開閉、移調・表記・表示オプション | 入力・履歴・手動上書き | 各キー名の`v1`～`v4` | 欠落時はUI既定値。不正な移調・表記・layoutは範囲／許可値へfallback。変換結果の正本ではない |
| 履歴snapshot | `localStorage` の`chordWikiBarFormatter.history.v1`（配列） | 履歴表示用の入力・変換後本文、行修正、行ID、採用状態、override、設定、確定譜面、signature | 画面レイアウト等の一時表示状態 | キー名のみ`v1`。entry payloadにschemaVersionなし | `js/history.js`が7日で整理。不足する`historyText`を持つ旧／テストentryは作業状態signatureへfallback。復元は`restoreSnapshot()`で正規化・再変換 |
| クラッシュ復元 | `localStorage` の`chordWikiBarFormatter.crashRecovery.v1`（単一entry） | 入力、確定譜面、行修正、行ID、採用状態、override、設定、保存時刻、signature | 履歴専用の`historyText`／初回出力、表示レイアウト | キー名のみ`v1` | `shouldRestoreCrash()`で現在状態の更新時刻とsignatureを比較。読み込み後に復元し、処理済みデータを削除 |
| JSONバックアップ | ダウンロードファイル。`format: chordwiki-bar-formatter-backup` | 入力、行修正、行ID、採用状態、override、確定譜面、履歴／初期／理想出力、設定、名称、export日時 | localStorageの履歴一覧、クラッシュentry、表示レイアウト、別窓表示状態 | payloadの`version: 1`（`js/backup-data.js`） | `format`と`version`を厳格検証。欠落する任意テキストは空値、配列／objectは空値へfallback。version変更時は明示的な移行を追加する |
| 確定プレビュー別窓 | `scoreWindow.v1`、`committedWindowDraft.v1`、`committedOutput.v1`、`committedWindowDisplay.v1`、BroadcastChannel | 別窓へ渡す確定本文、別窓で直接編集したdraft、表示設定、移調、比較レイアウト | 入力・行修正・sourceLineIds・override・履歴 | キー名と表示payload内の`layoutPreferenceVersion`／`checkboxDefaultsVersion` | draftは本文と`updatedAt`。表示設定は欠落時に既定値、移調とサイズは範囲内へclamp。別窓本文は確定譜面としてのみ親画面へ同期 |

## 重要状態の所有関係

| 状態 | 現在状態 | 履歴／クラッシュ | JSON | 確定プレビュー | 復元時の扱い |
|---|---|---|---|---|---|
| `sourceLineIds` | 保存 | 保存 | 保存 | 保存しない | 入力行数に合わせてnormalizeし、行対応の基準にする |
| `rowAdoptionModes` | 保存 | 保存 | 保存 | 保存しない | 許可値以外を空へ正規化し、行IDと同じ順序で復元 |
| `outputOverrides` | 保存 | 保存 | 保存 | 保存しない | `sourceLineIds`にないIDを捨て、再変換後に手動上書きを再適用 |
| `manualOutputLines` | `outputOverrides`から導出 | snapshotから導出 | snapshotから導出 | 別窓draftとは別物 | 独立保存せず、overrideの対象行から再構築 |
| `convertedOutput` | 実行時 | 原則保存しない | 保存しない | 渡さない | 入力・設定・行修正から再生成 |
| `finalOutput` | 実行時 | `historyText`／出力本文として保存 | `historyText`等として保存 | プレビュー表示の入力 | 復元後に再生成し、履歴表示と比較 |
| `committedOutputText` | 保存 | 保存 | 保存 | 同じ正本を同期 | 復元時に確定譜面欄へ設定 |
| 設定値 | profile＋表示個別キー | snapshot.settings | `state.settings` | 表示設定は別windowキー | converter設定と表示設定をそれぞれ許可値へ正規化 |

## 状態を追加・変更するときの更新箇所

1. 正本となる実行時状態と、上表のどの保存形式が所有するかを決める。
2. `collectSnapshot()`／`restoreSnapshot()`、該当する`js/history.js`または`js/backup-data.js`を確認する。
3. 個別localStorageキーを追加する場合は、初期読み込み・変更時保存・fallback／migrationを同時に確認する。
4. `sourceLineIds`、`rowAdoptionModes`、`outputOverrides`に関係する場合は、`js/output-overrides.js`の整合条件と履歴・JSON復元テストを確認する。
5. JSONの項目を変更する場合は`js/backup-data.js`の`VERSION`、validate、旧version移行方針を確認する。既存versionを黙って意味変更しない。
6. `committedOutputText`または別窓表示を変更する場合は、親画面、`js/committed-preview-window.js`、履歴／JSONの同期範囲を確認する。

## 関連テスト

- 設定・profile：`tests/settings.test.js`
- 履歴signature・保存・復元：`tests/history.test.js`、`tests/history-restore.test.js`、`tests/history-files.test.js`
- 行ID・override・状態遷移：`tests/output-overrides.test.js`、`tests/output-state-transitions.test.js`、`tests/row-adoption-modes.test.js`
- 確定プレビュー別窓：`tests/committed-preview-window.test.js`、`tests/committed-resize.test.js`
- 全体契約：`npm run verify`
