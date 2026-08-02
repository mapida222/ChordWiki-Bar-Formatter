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
| `ROW-003` | 行修正記号（0～9、a～i、`*`、`^`、`@`、`s`、小節頭`|`/`/`、`x`、`n`） | 有効 | `index.html`、`js/app.js`、`js/correction-input.js`、`js/converter.js`、`tests/correction-input.test.js` |
| `ROW-004` | 変換前編集時の行修正保持 | 有効 | `js/app.js`、`js/converter.js`、`tests/source-edit-correction-preservation.test.js` |
| `ROW-005` | 行修正の上書き入力と更新キャッシュ対策 | 有効 | `index.html`、`js/app.js`、`tests/correction-key-routing.test.js` |
| `ROW-006` | 歌詞末尾の1文字と絵文字の間へ補完拍を配置 | 廃止 | 文節を自動判定できないため撤回。長さ記号は小節先頭へまとめる |
| `ROW-007` | 行修正の長い拍へ歌詞を選択方式で配置 | 有効 | `js/settings.js`、`js/converter.js`、`tests/long-beat-lyric-distribution.test.js` |
| `ROW-008` | 「原文」採用行を最終表示でも未加工のまま保持 | 有効 | `js/app.js`、`js/converter.js`、`tests/conversion-bug-regressions.test.js` |
| `ROW-009` | 行修正を文字カーソルではなく拍スロット単位で直接上書き | 有効 | `js/app.js`、`js/correction-input.js`、`style.css`、`tests/correction-slot-mode.test.js` |
| `ROW-010` | IME・ソフトウェアキーボード経由でも拍スロットを追加せず上書き | 有効 | `js/app.js`、`js/correction-input.js`、`tests/correction-input.test.js`、`tests/correction-key-routing.test.js` |
| `ROW-011` | 行修正で選択中の拍に対応する変換後コードを背景表示 | 有効 | `js/app.js`、`style.css`、`tests/linked-code-highlight.test.js` |
| `ROW-012` | 別行の行修正中も変換後の直接編集状態を保持 | 有効 | `js/app.js`、`tests/row-adoption-modes.test.js` |
| `ROW-013` | 白玉の長さ入力と複合記号（`@8`・`8s`）の解除操作。数値を`@`へ置換した場合は初期設定の拍長を白玉へ適用 | 有効 | `js/app.js`、`js/converter.js`、`js/correction-input.js`、`tests/correction-input.test.js`、`tests/white-note-regression-matrix.test.js` |
| `ROW-014` | 変換前・行修正・変換後の手動改行位置をコード境界で同期 | 有効 | `js/app.js`、`js/correction-input.js`、`tests/source-linebreak-correction.test.js` |
| `ROW-015` | 凝縮型の特殊記号ボタン。`ROW-020`でボタン群を廃止し、選択中スロットへのキーボード入力は`ROW-034`へ移行 | 廃止 | `index.html`、`style.css`、`js/app.js`、`tests/header-controls.test.js` |
| `ROW-016` | 選択行だけ展開する境界カーソル式の行修正テスト版 | 試験中 | `row-edit-test.html`、`style-row-edit-test.css`、`js/row-edit-test.js` |
| `ROW-017` | 行修正を通常のテキストカーソルへ戻し、記号を入力位置どおりに保持するテスト版 | 試験中 | `row-edit-test.html`、`style-row-edit-test.css`、`js/row-edit-test.js` |
| `ROW-018` | 変換後にコード・白玉がない行は、行修正も空欄として同期 | 有効 | `js/app.js`、`js/converter.js`、`tests/correction-error-review.test.js` |
| `ROW-019` | 変換後の手動改行後も、行修正の行数を一致させ既存値を可能な限り保持 | 有効 | `js/app.js`、`tests/source-linebreak-correction.test.js` |
| `ROW-020` | 変換後から全行修正を復元する異常時用ボタンと、特殊記号ボタン群の廃止 | 有効 | `index.html`、`style.css`、`js/app.js`、`tests/header-controls.test.js` |
| `ROW-021` | 復元時に途中アクセントなど非可逆なリズムを推測変換せず、手動結果を保持して空欄化 | 有効 | `js/converter.js`、`js/app.js`、`tests/converter.test.js` |
| `ROW-022` | 変換後からの行修正復元は、再変換結果が元の行と完全一致する候補だけを採用 | 有効 | `js/converter.js`、`js/app.js`、`tests/converter.test.js` |
| `ROW-023` | 復元候補を表示しつつ、ユーザーが行修正を変更するまで変換後の行を固定する復元状態 | 有効 | `js/converter.js`、`js/app.js`、`tests/converter.test.js` |
| `ROW-024` | 行の状態表示を「自動・修正・固定」の3種類へ統一 | 有効 | `js/app.js`、`style.css`、`tests/row-adoption-modes.test.js` |
| `ROW-025` | 変換前・直接編集で非対応のリズム表記を検出した行を自動で固定し、内容を保持 | 有効 | `js/converter.js`、`js/app.js`、`tests/converter.test.js` |
| `ROW-026` | 非対応コード位置を行修正欄の`?`で保護し、前後の値だけを修正可能にする | 有効 | `js/converter.js`、`js/correction-input.js`、`js/app.js`、`tests/converter.test.js` |
| `ROW-027` | 白玉の後に長さが続く行を、`@`と長さの別スロットとして復元 | 有効 | `js/converter.js`、`tests/converter.test.js` |
| `ROW-028` | 複数コード行の末尾にある長さなし白玉を、行修正の末尾`@`として復元 | 有効 | `js/converter.js`、`tests/converter.test.js` |
| `ROW-029` | 行修正の選択行を、上1行・下2行が見える位置へ自動スクロール | 有効 | `js/app.js`、`js/correction-input.js`、`tests/correction-caret-navigation.test.js` |
| `ROW-030` | `s`・`*s`の右拍削除では境界記号だけ解除し、左拍削除では数字を詰めて先頭シンコペを保持 | 有効 | `index.html`、`js/app.js`、`js/correction-input.js`、`tests/correction-input.test.js` |
| `ROW-031` | 行修正値を左から部分適用し、不足した右端は自動値を使用（1文字の全コード展開は廃止） | 有効 | `index.html`、`js/converter.js`、`js/correction-input.js`、`tests/priority-scope.test.js` |
| `ROW-032` | `s`をハイフン1個分、`*s`を半ハイフン分のシンコペとして行頭・境界で指定 | 有効 | `index.html`、`js/converter.js`、`js/correction-input.js`、`tests/syncopation-regressions.test.js` |
| `ROW-033` | 「この行を更新」実行前後で全テキスト枠の縦横スクロール位置を維持 | 有効 | `js/app.js`、`tests/correction-refresh-scroll.test.js` |
| `ROW-034` | 数字入力を`beforeinput/input`へ一本化し、全角IME・テンキー・行またぎの遅延入力でも選択中スロットへ1回だけ入力 | 有効 | `js/app.js`、`js/correction-input.js`、`tests/correction-key-routing.test.js`、`tests/correction-input.test.js` |
| `ROW-035` | 行修正の最終拍を入力したら、空白行を飛ばして次の入力対象行の先頭スロットへ移動 | 有効 | `js/app.js`、`js/correction-input.js`、`tests/correction-key-routing.test.js`、`tests/correction-input.test.js` |
| `ROW-036` | 行修正値を貼り付けた際、選択中スロットの再計算をしても全入力欄のスクロール位置を維持 | 有効 | `js/app.js`、`tests/source-paste-scroll.test.js` |
| `ROW-037` | 空白行を含む行修正へ連続した複数行を貼り付けても、空白行を区切りとして保持 | 有効 | `index.html`、`js/correction-input.js`、`tests/correction-paste.test.js` |
| `CONVERT-001` | 歌詞行のハイフン省略モード | 有効 | `index.html`、`js/app.js`、`js/converter.js` |
| `CONVERT-002` | 1小節3コード以上でタイミング用ハイフンを保持 | 有効 | `js/converter.js` |
| `CONVERT-003` | コード・拍記号・小節線だけの行を歌詞と誤認しない | 有効 | `js/converter.js`、`tests/conversion-bug-regressions.test.js` |
| `CONVERT-004` | 隣接する小節線を1本へ正規化 | 有効 | `js/converter.js`、`tests/conversion-bug-regressions.test.js` |
| `CONVERT-005` | 既存小節線をまたぐ拍記号を同一コード長として自動認識 | 有効 | `js/converter.js`、`tests/mixed-meter-manual-bars.test.js` |
| `CONVERT-006` | 歌詞のない手動ハイフン列を空の角括弧で囲まず、そのまま出力 | 有効 | `js/converter.js`、`tests/converter.test.js` |
| `CONVERT-007` | 1文字歌詞でも通常の1コード8拍が完結した小節はハイフンを省略 | 有効 | `js/converter.js`、`tests/single-character-hyphen-removal.test.js` |
| `CONVERT-008` | `(Synth)`等の先頭ラベルや末尾の`･･･ (Repeat...)`等の演奏注記を歌詞と判定せず、端の空白を含む演奏行を原文どおり保持 | 有効 | `js/converter.js`、`tests/conversion-bug-regressions.test.js` |
| `CONVERT-009` | 歌詞小節とコードのみ小節が同じ行にあり、コードのみ小節が2つ以上なら、小節単位で括弧付き・簡潔拍表記を切り替える | 有効 | `js/converter.js`、`tests/mixed-measure-notation.test.js` |
| `CONVERT-010` | 括弧内を含むコードのテンション列で、カンマ区切り（例：`E7(9,11)`）をコードとして認識 | 有効 | `js/converter.js`、`tests/converter.test.js` |
| `SETTINGS-001` | 数値設定のフォーカス直後入力で既存値を置換 | 有効 | `js/numeric-entry.js`、`js/app.js`、`tests/numeric-entry.test.js` |
| `SETTINGS-002` | 端数歌詞前置きと長い拍の歌詞配置の優先関係 | 調査済み | `js/converter.js`、`tests/long-beat-lyric-distribution.test.js` |
| `SETTINGS-003` | 変換前で検出した3・6・9・12ハイフンの小節候補を、6/8拍子タブへ切替えて合計ハイフン数へ適用 | 有効 | `js/app.js`、`tests/measure-capacity-warning.test.js` |
| `SETTINGS-004` | 初期設定を「小節・拍・区切り→コード引継ぎ→歌詞配置」の順で並べ、全項目に具体的な変換例を表示。1文字だけで完結する歌詞小節のハイフンは省略／残すを選択し、歌詞の前後へ分割したハイフンも同じ設定で処理 | 有効 | `js/settings.js`、`js/app.js`、`js/converter.js`、`style.css`、`tests/settings.test.js`、`tests/single-character-hyphen-removal.test.js` |
| `CONVERT-011` | 演奏記号行の`(Key)`などの英字ラベルと単独の`～`を歌詞と誤認せず、手入力のリズム表記を保持。単独の`～`は白玉相当、語中の`～`は歌詞として扱う | 有効 | `js/converter.js`、`tests/arrangement-notation-preservation.test.js` |
| `CONVERT-012` | 行頭の小節線で区切られた歌詞小節と手入力リズム小節の混在行では、歌詞側のみ`[|]`へ変換し、後半のリズム表記はコンパクト表記のまま保持 | 有効 | `js/converter.js`、`tests/arrangement-notation-preservation.test.js` |
| `CONVERT-013` | 変換後の`[|]`直後が歌詞文字なら、重なり防止の全角空白を自動挿入。コード`[`・小節線`|`・注記の括弧の前には挿入しない | 有効 | `js/converter.js`、`tests/arrangement-notation-preservation.test.js` |
| `WARNING-001` | 変換前と初期設定の1小節ハイフン数不一致警告 | 有効 | `js/app.js`、`js/converter.js` |
| `LAYOUT-001` | 行修正枠と変換後枠の入力欄上端を揃える | 有効 | `style.css`、`js/app.js` |
| `LAYOUT-002` | 確定譜面テキスト枠の右下リサイズとサイズ保存 | 有効 | `index.html`、`style.css`、`js/app.js`、`tests/committed-resize.test.js` |
| `LAYOUT-003` | 01・03を畳んだ初期配置、変換前の省スペース化、行修正上部枠の強調 | 有効 | `index.html`、`style.css`、`js/app.js`、`tests/default-layout.test.js` |
| `LAYOUT-004` | 変換前・変換後の下枠ドラッグによる高さ調整 | 有効 | `index.html`、`style.css`、`js/app.js`、`tests/frame-edge-resize.test.js` |
| `LAYOUT-005` | 初期設定を開いた際に内部へ重なる幅調整線を非表示 | 有効 | `style.css`、`tests/default-layout.test.js` |
| `LAYOUT-006` | 全テキスト枠で貼り付け前の縦横スクロール位置を維持 | 有効 | `js/app.js`、`tests/source-paste-scroll.test.js` |
| `PREVIEW-001` | 譜面プレビューのベスト条件 | 基準 | `LAYOUT_REFERENCE.md`、`layout-snapshots/2026-07-22-good/`、Gitタグ `preview-layout-best-2026-07-22` |
| `PREVIEW-002` | 拍記号に挟まれた縦小節線が直後の拍記号と重ならないよう補正 | 有効 | `js/chordwiki-preview.js`、`style.css`、`tests/preview-layout.test.js` |
| `PREVIEW-003` | 譜面プレビューの移調では`{key:...}`だけを移調し、`{ci:...}`・`{title:...}`・`{subtitle:...}`などコメント系ディレクティブ内部のコード風文字列は保持 | 有効 | `js/transposer.js`、`tests/transposer.test.js` |
| `HISTORY-001` | 編集中・コピー成功時の使用履歴保存 | 有効 | `js/app.js`、`index.html`、`tests/history-triggers.test.js` |
| `HISTORY-002` | 使用履歴のローカルテストデータ入出力 | 有効 | `js/app.js`、`js/test-data.js`、`index.html`、`tests/test-data.test.js` |
| `HISTORY-003` | 使用履歴から保存時の作業状態を一括復元 | 有効 | `js/app.js`、`index.html`、`tests/history-restore.test.js` |
| `TEST-001` | プロジェクト全体の回帰テスト | 有効 | `tests/*.test.js` |
| `PROJECT-001` | チャット間で共有する管理ID台帳 | 有効 | `AGENTS.md`、`MANAGEMENT_IDS.md` |
| `PUBLIC-001` | Web版の公開準備と公開前確認 | 進行中 | `README.md`、`PUBLICATION_CHECKLIST.md`、`.gitignore`、`package.json` |
| `PUBLIC-002` | GitHubトップページの文章・画像改善 | 有効 | `README.md`、`docs/images/readme-*.png`、`docs/README_CAPTURE_SAMPLE.md` |
| `PUBLIC-003` | クレジット・意見要望・応援リンク | 有効 | `index.html`、`style.css`、`tests/public-links.test.js` |
| `SAMPLE-001` | 入力サンプルの変換前・行修正・設定を固定 | 有効 | `js/app.js`、`docs/README_CAPTURE_SAMPLE.md`、`tests/readme-capture-sample.test.js` |
| `HELP-001` | 丸い「？」による補足説明 | 有効 | `index.html`、`style.css`、`js/app.js`、`docs/TOOLTIP_HELP_DRAFT.md` |
| `HELP-002` | ヘルプ画面の見出し、対象枠表記、確定までの基本フロー、行の採用状態、行修正の更新・復元案内 | 有効 | `index.html`、`style.css`、`tests/help-layout.test.js` |
| `HELP-003` | TOPの行修正ヘルプへ`?`の非対応位置保持を追記 | 有効 | `index.html`、`tests/header-controls.test.js` |

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
