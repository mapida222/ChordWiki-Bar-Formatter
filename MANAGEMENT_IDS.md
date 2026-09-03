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
| `ROW-038` | 小節頭記号として入力したバックスラッシュを`|`へ正規化し、`@8\@8`等の明示値を無効化しない | 有効 | `js/app.js`、`js/correction-input.js`、`tests/local-prebranch-regressions.test.js` |
| `ROW-039` | 長い白玉が小節をまたぐ場合、コード継続設定とは独立して各小節へ白玉を継続表示 | 有効 | `js/converter.js`、`tests/white-note-regression-matrix.test.js`、`tests/local-prebranch-regressions.test.js` |
| `ROW-040` | 端数拍・シンコペーションで前置きする歌詞に連続する閉じ括弧を追従 | 有効 | `js/converter.js`、`tests/local-prebranch-regressions.test.js` |
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
| `SETTINGS-005` | 表示フォント切替時に日本語・記号のフォールバックを統一し、ブラウザ標準・MS Gothic等で文字欠けを防止 | 有効 | `js/app.js`、`js/preview-window.js`、`style.css`、`tests/setting-processing.test.js` |
| `CONVERT-011` | 演奏記号行の`(Key)`などの英字ラベルと単独の`～`を歌詞と誤認せず、手入力のリズム表記を保持。単独の`～`は白玉相当、語中の`～`は歌詞として扱う | 有効 | `js/converter.js`、`tests/arrangement-notation-preservation.test.js` |
| `CONVERT-012` | 行頭の小節線で区切られた歌詞小節と手入力リズム小節の混在行では、歌詞側のみ`[|]`へ変換し、後半のリズム表記はコンパクト表記のまま保持 | 有効 | `js/converter.js`、`tests/arrangement-notation-preservation.test.js` |
| `CONVERT-013` | 変換後の`[|]`直後が歌詞文字なら、重なり防止の全角空白を自動挿入。コード`[`・小節線`|`・注記の括弧の前には挿入しない | 有効 | `js/converter.js`、`tests/arrangement-notation-preservation.test.js` |
| `CONVERT-014` | コードのみ行も1コードの標準ハイフン数を使い、手入力済みの間奏リズムは原文どおり保持 | 有効 | `js/converter.js`、`tests/converter.test.js`、`tests/local-prebranch-regressions.test.js` |
| `CONVERT-015` | 行修正後の末尾が1小節未満の場合、終端の自動小節線を付けない | 有効 | `js/converter.js`、`tests/converter.test.js` |
| `CONVERT-016` | 変換前行の文頭・文末空白を変換後も保持 | 有効 | `js/converter.js`、`tests/converter.test.js` |
| `CONVERT-017` | 1文字歌詞を含む手動リズム小節は、ハイフンを歌詞の前後へ分けて連続表示 | 有効 | `js/converter.js`、`tests/converter.test.js` |
| `WARNING-001` | 変換前と初期設定の1小節ハイフン数不一致警告 | 有効 | `js/app.js`、`js/converter.js` |
| `LAYOUT-001` | 行修正枠と変換後枠の入力欄上端を揃える | 有効 | `style.css`、`js/app.js` |
| `LAYOUT-002` | 確定譜面テキスト枠の右下リサイズとサイズ保存 | 有効 | `index.html`、`style.css`、`js/app.js`、`tests/committed-resize.test.js` |
| `LAYOUT-003` | 01・03を畳んだ初期配置、変換前の省スペース化、行修正上部枠の強調 | 有効 | `index.html`、`style.css`、`js/app.js`、`tests/default-layout.test.js` |
| `LAYOUT-004` | 変換前・変換後の下枠ドラッグによる高さ調整 | 有効 | `index.html`、`style.css`、`js/app.js`、`tests/frame-edge-resize.test.js` |
| `LAYOUT-005` | 初期設定を開いた際に内部へ重なる幅調整線を非表示 | 有効 | `style.css`、`tests/default-layout.test.js` |
| `LAYOUT-006` | 全テキスト枠で貼り付け前の縦横スクロール位置を維持 | 有効 | `js/app.js`、`tests/source-paste-scroll.test.js` |
| `LAYOUT-007` | 初期設定は行修正と重なっても配置を維持し、変換前・変換後枠は左端からも横幅を調整できる。使用例は初期表示で折り畳み可能 | 有効 | `style.css`、`js/app.js`、`index.html`、`tests/default-layout.test.js`、`tests/frame-edge-resize.test.js` |
| `LAYOUT-008` | 初期設定・行修正・変換前・変換後・譜面プレビューを上下左右の端からサイズ変更し、初期設定の高さを保存・復元 | 有効 | `index.html`、`style.css`、`js/app.js`、`tests/frame-edge-resize.test.js` |
| `LAYOUT-009` | スマホでは行修正と変換後を縦2段にし、編集行が見えなくなった時だけ連動追従。各セクションの補助・表示設定は見出し右の開閉操作へ集約し、本文枠の標準横スクロールバーは常時表示する。タブレットはPCレイアウトを維持 | 有効 | `index.html`、`style.css`、`js/app.js` |
| `LAYOUT-010` | 変換後・譜面プレビューの表示設定を全画面幅で見出し右から開閉し、初期状態は開く | 有効 | `index.html`、`style.css`、`js/app.js`、`tests/header-controls.test.js`、`tests/mobile-linked-editors.test.js` |
| `LAYOUT-011` | 右上の表示設定を操作群の右端で強調し、外側クリックとEscで閉じる | 有効 | `index.html`、`style.css`、`js/app.js`、`tests/header-controls.test.js` |
| `LAYOUT-012` | 変換後の表示設定を閉じた際に内容を確実に非表示にし、右上の表示設定文字を隣接ボタンと同じサイズへ統一 | 有効 | `style.css`、`js/app.js`、`tests/header-controls.test.js` |
| `LAYOUT-013` | 変換前・変換後の右端リサイズ方向を反転し、左端の挙動を維持。変換前の下端直下へ変換後見出しを配置 | 有効 | `index.html`、`style.css`、`js/app.js`、`tests/frame-edge-resize.test.js`、`tests/default-layout.test.js` |
| `LAYOUT-014` | 変換後枠の幅に応じて表示設定を折り返し、閉じた際は内容だけでなく外枠も完全に非表示 | 有効 | `style.css`、`tests/header-controls.test.js` |
| `LAYOUT-015` | 行修正の位置説明を画面から外し、操作を縦線区切りの一行へ凝縮。03・04入力枠の上端位置合わせを最優先で維持 | 有効 | `index.html`、`style.css`、`js/app.js`、`tests/header-controls.test.js`、`tests/default-layout.test.js` |
| `LAYOUT-016` | 行修正操作を見出し内の縁付きボタンへ統合し、不要な編集サポート開閉を廃止。右列の01・04は常に詰め、03だけを移動して03・04入力枠上端を一致 | 有効 | `index.html`、`style.css`、`js/app.js`、`tests/header-controls.test.js`、`tests/default-layout.test.js`、`tests/mobile-linked-editors.test.js` |
| `LAYOUT-017` | 編集サポートの開閉は復活させず、03見出し下へ青い2段の操作枠を復元。上段に戻す・進む・この行を更新、下段に変換後から行修正を復元・丸型ヘルプを配置 | 有効 | `index.html`、`style.css`、`js/app.js`、`tests/header-controls.test.js` |
| `LAYOUT-018` | 03編集サポート枠のヘルプを前面表示し、丸型ヘルプを中央配置。「この行を更新」と「変換後から行修正を復元」の両方を説明 | 有効 | `index.html`、`style.css`、`tests/header-controls.test.js` |
| `LAYOUT-019` | スマホの縦並びではPC用03・04入力枠位置合わせを無効化し、03が04へ重ならないよう通常のグリッド順を維持 | 有効 | `js/app.js`、`style.css`、`tests/mobile-linked-editors.test.js` |
| `LAYOUT-020` | 02初期設定と05譜面プレビューにも03・04同様の右下サイズ変更ハンドルを用意し、スマホでも表示 | 有効 | `index.html`、`style.css`、`tests/frame-edge-resize.test.js`、`tests/mobile-linked-editors.test.js` |
| `LAYOUT-021` | スマホのリアルタイムエディター見出しを横一行に保ち、操作群は次行へ配置 | 有効 | `style.css`、`tests/mobile-linked-editors.test.js` |
| `LAYOUT-022` | スマホの右下サイズ変更ハンドルを02初期設定から01変換前へ移動 | 有効 | `style.css`、`tests/mobile-linked-editors.test.js` |
| `LAYOUT-023` | 通常画面から重複する確定譜面テキスト枠と別画面比較編集リンクを外し、リアルタイム編集ページへ集約 | 有効 | `index.html`、`js/app.js`、`tests/local-editor-layout.test.js` |
| `LAYOUT-024` | スクロール同期ON/OFFを切り替えても、変換後と行修正の横並びを維持し、OFF時だけ変換前を独立スクロールさせる | 有効 | `js/app.js`、`tests/scroll-sync-progress.test.js` |
| `LAYOUT-025` | 行番号欄の末尾に表示用の空2行を確保し、変換後テキストへ改行を追加せず下端の行番号ずれを抑える | 有効 | `js/app.js`、`tests/local-editor-layout.test.js` |
| `LAYOUT-026` | リアルタイムエディターの名称を統一し、起動時・設定変更時・上下左右比較時のスクロールを進捗率で相互同期する | 有効 | `committed-preview.html`、`js/committed-preview-window.js`、`README.md`、`tests/committed-preview-window.test.js` |
| `LAYOUT-027` | リアルタイムエディターの表示設定を外側クリックまたは表示設定ボタンの再クリックで閉じる | 有効 | `js/committed-preview-window.js`、`tests/committed-preview-window.test.js` |
| `LAYOUT-028` | 青いコード文字の太字ストロークを無効化し、二重表示に見える描画を防止 | 有効 | `style.css`、`tests/setting-processing.test.js` |
| `LAYOUT-029` | 色付け用レイヤーとtextareaの同時描画を防ぎ、青いコードの二重表示を防止 | 有効 | `style.css`、`tests/setting-processing.test.js` |
| `LAYOUT-030` | ヘッダーのサブタイトルを1行表示にし、ロゴを左揃えで縮小し、右側ボタンの高さと折り返しを整える | 有効 | `index.html`、`style.css`、`tests/default-layout.test.js`、`tests/linked-code-highlight.test.js` |
| `PREVIEW-001` | 譜面プレビューのベスト条件 | 基準 | `LAYOUT_REFERENCE.md`、`layout-snapshots/2026-07-22-good/`、Gitタグ `preview-layout-best-2026-07-22` |
| `PREVIEW-002` | 拍記号に挟まれた縦小節線が直後の拍記号と重ならないよう補正 | 有効 | `js/chordwiki-preview.js`、`style.css`、`tests/preview-layout.test.js` |
| `PREVIEW-003` | 譜面プレビューの移調では`{key:...}`だけを移調し、`{ci:...}`・`{title:...}`・`{subtitle:...}`などコメント系ディレクティブ内部のコード風文字列は保持 | 有効 | `js/transposer.js`、`tests/transposer.test.js` |
| `HISTORY-001` | 編集中・コピー成功時の使用履歴保存 | 有効 | `js/app.js`、`index.html`、`tests/history-triggers.test.js` |
| `HISTORY-002` | 使用履歴のローカルテストデータ入出力 | 廃止 | `js/app.js`、`js/test-data.js`、`index.html`、`tests/test-data.test.js` |
| `HISTORY-003` | 使用履歴から保存時の作業状態を一括復元 | 有効 | `js/app.js`、`index.html`、`tests/history-restore.test.js` |
| `HISTORY-004` | 不具合報告用テキストのコピーとバックアップJSONのインポート・エクスポート | 有効 | `js/app.js`、`js/backup-data.js`、`js/issue-report.js`、`index.html`、`style.css`、`tests/history-files.test.js` |
| `TEST-001` | プロジェクト全体の回帰テスト | 有効 | `tests/*.test.js` |
| `PROJECT-001` | チャット間で共有する管理ID台帳 | 有効 | `AGENTS.md`、`MANAGEMENT_IDS.md` |
| `PROJECT-002` | 大規模コード整理と責務分離 | 有効 | `docs/REFACTORING.md`、`js/entries/`、`vite.config.js`、`package.json` |
| `PROJECT-003` | 変換後の改行・直接編集と行修正のデータフロー調査 | 調査済み | `docs/OUTPUT_EDIT_DATA_FLOW.md`、`js/app.js`、`js/converter.js`、`js/correction-input.js` |
| `PROJECT-004` | Viteの応答を待ってからブラウザを開くローカル起動バッチ | 有効 | `start-local.bat`、`tests/local-launcher.test.js` |
| `PROJECT-005` | 安定した変換前行IDを基準に自動生成結果と変換後の手動上書きを別レイヤーで保存・再適用 | 有効 | `js/output-overrides.js`、`js/app.js`、`js/history.js`、`tests/output-overrides.test.js` |
| `PROJECT-006` | 保存形式の所有範囲・互換性・状態追加時の確認箇所を文書化 | 有効 | `docs/SAVED_DATA_SCHEMA.md`、`README.md`、`AGENTS.md`、`js/history.js`、`js/backup-data.js` |
| `PROJECT-007` | 確定プレビュー別窓への状態保存・BroadcastChannel通知を専用ブリッジへ分離 | 有効 | `js/score-window-state.js`、`js/app.js`、`tests/score-window-state.test.js` |
| `PROJECT-008` | 変換回帰fixtureの共有範囲と追加先を整理 | 有効 | `tests/fixtures/converter-common.json`、`tests/fixtures/README.md`、`tests/converter.test.js`、`tests/white-note-regression-matrix.test.js` |
| `PROJECT-009` | 開発改善の候補評価・実施・検証・停止判断を再利用Skillへ集約 | 有効 | `C:\Users\mapida\.codex\skills\chordwiki-development-orchestrator\SKILL.md`、`AGENTS.md` |
| `PROJECT-010` | CIとPages公開前にPR／コミット差分のwhitespaceを検査 | 有効 | `.github/workflows/test.yml`、`.github/workflows/pages.yml`、`RELEASE_GATE.md` |
| `PROJECT-011` | 変更対象から関連テストを先に選ぶ開発ルーティングを定型化 | 完了 | `C:\Users\mapida\.codex\skills\chordwiki-development-orchestrator\SKILL.md` |
| `PROJECT-012` | フォーマッターのChordWiki表示を別UIへ埋め込むためのPayload・DOM・postMessage API | 有効 | `js/chordwiki-embed.js`、`docs/EMBED_API.md`、`tests/embed-api.test.js` |
| `PREVIEW-004` | 公式Parser Adapterと旧ChordWiki表示Rendererの再構築 | 有効 | `js/parser/`、`js/renderer/`、`js/chordwiki-preview.js`、`tests/official-parser-integration.test.mjs` |
| `PREVIEW-005` | リアルタイム編集の保存済み下書きが異なる場合に、上書き・前回内容を保持・キャンセルを選択 | 有効 | `js/app.js`、`js/committed-preview-window.js`、`tests/committed-preview-window.test.js` |
| `PREVIEW-006` | リアルタイム編集のプレビュー背景ドラッグで縦横スクロール | 有効 | `js/committed-preview-window.js`、`style.css`、`tests/committed-preview-window.test.js` |
| `PREVIEW-007` | リアルタイム編集へ既存Transposerを使った表示専用±12移調を追加 | 有効 | `committed-preview.html`、`js/entries/committed-preview.js`、`js/committed-preview-window.js`、`tests/committed-preview-window.test.js` |
| `PREVIEW-008` | 旧ChordWikiの二重角括弧を通常・別画面・リアルタイムプレビューで二段上付き表示し、リアルタイム移調を「移調なし／−／＋」順へ統一 | 有効 | `js/chordwiki-preview.js`、`js/renderer/old-chordwiki-renderer.js`、`committed-preview.html`、`style.css`、`tests/preview.test.js`、`tests/official-parser-integration.test.mjs`、`tests/committed-preview-window.test.js` |
| `PREVIEW-009` | リアルタイム編集でコード位置調整モードを使い、譜面上のコードクリックと矢印キー（Enter／Shift+Enterのコード巡回を含む）で上下左右へ位置調整できる | 有効 | `committed-preview.html`、`js/committed-preview-window.js`、`style.css`、`tests/committed-preview-window.test.js` |
| `PUBLIC-001` | 公開準備と公開前確認 | 有効 | `README.md`、`PUBLICATION_CHECKLIST.md`、`help-usage-screenshot.png`、`.gitignore`、`package.json` |
| `PUBLIC-002` | GitHubトップページの文章・画像改善 | 有効 | `README.md`、`docs/images/readme-*.png`、`docs/README_CAPTURE_SAMPLE.md` |
| `PUBLIC-003` | クレジット・意見要望・応援リンク | 有効 | `index.html`、`style.css`、`tests/public-links.test.js` |
| `PUBLIC-004` | GitHub Actionsによる自動テストと公開ファイル限定のPages配信 | 有効 | `.github/workflows/test.yml`、`.github/workflows/pages.yml`、`tests/github-publication.test.js` |
| `PUBLIC-005` | GitHubコミュニティ文書、セキュリティ設定、タグとReleaseの公開運用 | 有効 | `CONTRIBUTING.md`、`.github/ISSUE_TEMPLATE/`、`.github/pull_request_template.md` |
| `PUBLIC-006` | Google Analyticsによる利用状況計測とプライバシー告知 | 有効 | `index.html`、`privacy.html`、`tests/public-links.test.js` |
| `PUBLIC-007` | 製品名・リポジトリ名・公開URLから「Web」を削除 | 有効 | `index.html`、`privacy.html`、`README.md`、`PUBLICATION_CHECKLIST.md`、`package.json` |
| `PUBLIC-008` | 全HTMLエントリのfaviconを透過版`logo_touka_favicon.png`へ統一し、画面ロゴは透過版製品ロゴを使用 | 有効 | `index.html`、`privacy.html`、`chordwiki-preview.html`、`committed-preview.html`、`tests/public-links.test.js` |
| `PUBLIC-009` | 再デザインした透過ロゴをヘッダー・フッター・リアルタイムエディターへ適用し、全HTMLエントリのfaviconも新デザインへ統一 | 有効 | `logo/260810_chordwiki_logo.png`、`logo/260810_favicon_touka.png`、`index.html`、`privacy.html`、`chordwiki-preview.html`、`committed-preview.html`、`tests/public-links.test.js` |
| `PUBLIC-009` | Analytics・CSP・AdSense導入余地を監査し、導入条件と配置を記録 | 調査済み | `docs/ADSENSE_READINESS.md`、`index.html`、`privacy.html` |
| `PUBLIC-011` | Secret Scanning警告に対応して旧CGI参考ファイルを公開対象から除外 | 実施中 | `cgi/wiki.cgi`、`.gitignore`、`docs/ADSENSE_READINESS.md` |
| `PUBLIC-012` | サイトのヘルプ構成とキャプチャをGitHub READMEの冒頭へ反映し、初見向けの利用手順を整理 | 有効 | `README.md`、`docs/images/readme-help01.png`、`docs/images/readme-help02.png`、`docs/images/readme-help03.png`、`tests/github-publication.test.js` |
| `PUBLIC-013` | 基本操作・変換例・詳しい修正方法のヘルプキャプチャをREADMEの各節へ配置し、リアルタイムエディターの要点を追加 | 有効 | `README.md`、`docs/images/readme-help-basic-flow.png`、`docs/images/readme-help-example.png`、`docs/images/readme-help-adjust.png`、`tests/github-publication.test.js` |
| `PUBLIC-010` | 実publisher IDによるGoogle AdSense自動広告コード、CSP許可先、広告プライバシー告知 | 有効 | `index.html`、`privacy.html`、`docs/ADSENSE_READINESS.md`、`tests/public-links.test.js` |
| `SAMPLE-001` | 入力サンプルの変換前・行修正・設定を固定 | 有効 | `js/app.js`、`docs/README_CAPTURE_SAMPLE.md`、`tests/readme-capture-sample.test.js` |
| `HELP-001` | 丸い「？」による補足説明 | 有効 | `index.html`、`style.css`、`js/app.js`、`docs/TOOLTIP_HELP_DRAFT.md` |
| `HELP-002` | ヘルプ画面の見出し、対象枠表記、確定までの基本フロー、行の採用状態、行修正の更新・復元案内 | 有効 | `index.html`、`style.css`、`tests/help-layout.test.js` |
| `HELP-003` | TOPの行修正ヘルプへ`?`の非対応位置保持を追記 | 有効 | `index.html`、`tests/header-controls.test.js` |
| `HELP-004` | 変換後の直接編集を自動生成と分けて保存し、再変換後も保持する案内を表示 | 有効 | `index.html`、`style.css`、`tests/header-controls.test.js` |
| `HELP-005` | 変換後の直接編集案内を、改行やふりがな、コードは変換前で編集する推奨文へ簡潔化 | 有効 | `index.html`、`tests/header-controls.test.js` |
| `HELP-006` | 基本フローの最終段を「確定」操作ではなく、完成した譜面をコピーして投稿する案内へ変更 | 有効 | `index.html`、`tests/help-layout.test.js` |
| `HELP-007` | 4段階の基本フローをヘルプ枠の横幅いっぱいへ均等配置 | 有効 | `style.css`、`tests/help-layout.test.js` |

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
