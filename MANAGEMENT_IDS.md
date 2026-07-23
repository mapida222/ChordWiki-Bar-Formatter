# ChordWiki Bar Formatter 管理ID台帳

チャットをまたいで修正箇所や確認項目を指定するための共通台帳です。

## 運用ルール

- ID形式は `カテゴリ-3桁番号` とする。
- 同じ機能には同じIDを使い、新しい機能だけ連番を追加する。
- IDは改番・別用途への再利用・削除をしない。
- 完了後も記録を残し、必要なら状態を「廃止」に変更する。
- 報告時は `ROW-001：上書き入力 OK` のように記載する。

## 管理項目

| 管理ID | 対象 | 状態 | 主な場所・基準 |
|---|---|---|---|
| `ROW-001` | 行修正の上書き入力 | 有効 | `js/correction-input.js` |
| `ROW-002` | 行修正内容の変換後への反映 | 有効 | `js/app.js`、`js/converter.js` |
| `ROW-003` | 行修正記号（0～9、a～i、`*`、`^`、`@`、`s`、縦線、`x`、`n`） | 有効 | `js/correction-input.js`、`js/converter.js` |
| `ROW-004` | 変換前編集時の行修正保持 | 有効 | `js/app.js`、`js/converter.js`、`tests/source-edit-correction-preservation.test.js` |
| `ROW-005` | 行修正の上書き入力と更新キャッシュ対策 | 有効 | `index.html`、`js/app.js`、`tests/correction-key-routing.test.js` |
| `ROW-006` | 歌詞末尾の1文字と絵文字の間へ補完拍を配置 | 廃止 | 文節を自動判定できないため撤回。長さ記号は小節先頭へまとめる |
| `ROW-007` | 行修正の長い拍へ全角空白前の歌詞を均等配置 | 有効 | `js/converter.js`、`tests/long-beat-lyric-distribution.test.js` |
| `CONVERT-001` | 歌詞行のハイフン省略モード | 有効 | `index.html`、`js/app.js`、`js/converter.js` |
| `CONVERT-002` | 1小節3コード以上でタイミング用ハイフンを保持 | 有効 | `js/converter.js` |
| `WARNING-001` | 変換前と初期設定の1小節ハイフン数不一致警告 | 有効 | `js/app.js`、`js/converter.js` |
| `LAYOUT-001` | 行修正枠と変換後枠の入力欄上端を揃える | 有効 | `style.css`、`js/app.js` |
| `PREVIEW-001` | 譜面プレビューのベスト条件 | 基準 | `LAYOUT_REFERENCE.md`、`layout-snapshots/2026-07-22-good/`、Gitタグ `preview-layout-best-2026-07-22` |
| `HISTORY-001` | 編集中・コピー成功時の使用履歴保存 | 有効 | `js/app.js`、`index.html`、`tests/history-triggers.test.js` |
| `TEST-001` | プロジェクト全体の回帰テスト | 有効 | `tests/*.test.js` |
| `PROJECT-001` | チャット間で共有する管理ID台帳 | 有効 | `AGENTS.md`、`MANAGEMENT_IDS.md` |
| `PUBLIC-001` | Web版の公開準備と公開前確認 | 進行中 | `README.md`、`PUBLICATION_CHECKLIST.md`、`.gitignore`、`package.json` |
| `PUBLIC-002` | GitHubトップページの文章・画像改善 | 有効 | `README.md`、`docs/images/readme-*.png`、`docs/README_CAPTURE_SAMPLE.md` |
| `PUBLIC-003` | クレジット・意見要望・応援リンク | 有効 | `index.html`、`style.css`、`tests/public-links.test.js` |
| `SAMPLE-001` | 入力サンプルの変換前・行修正・設定を固定 | 有効 | `js/app.js`、`docs/README_CAPTURE_SAMPLE.md`、`tests/readme-capture-sample.test.js` |
| `HELP-001` | 丸い「？」による補足説明 | 有効 | `index.html`、`style.css`、`js/app.js`、`docs/TOOLTIP_HELP_DRAFT.md` |
| `HELP-002` | ヘルプ画面の見出し・対象枠表記 | 有効 | `index.html`、`tests/help-layout.test.js` |

## カテゴリ

| カテゴリ | 用途 |
|---|---|
| `ROW` | 行修正入力・採用・反映 |
| `CONVERT` | 変換規則・出力処理 |
| `SETTINGS` | 初期設定・保存設定 |
| `WARNING` | 判定・警告表示 |
| `LAYOUT` | 通常画面の配置・サイズ |
| `PREVIEW` | 譜面プレビュー |
| `HISTORY` | 履歴・復元 |
| `TEST` | 動作確認・回帰テスト |
| `PROJECT` | プロジェクト全体の運用・管理 |
| `PUBLIC` | 公開準備・配信・公開後確認 |
| `SAMPLE` | 入力サンプル・画面キャプチャ用データ |
| `HELP` | 画面内ヘルプ・補足説明 |
