# 大規模コード整理と旧ChordWikiプレビュー再構築

管理ID：`PROJECT-002`、`PREVIEW-004`

## 作業前の復元地点

- 作業前の公開中`main`：`93369fe`（`origin/main`）
- 未コミット変更を含む正常動作スナップショット：`1eb2991`
- バックアップブランチ：`backup/pre-refactor-20260809`
- 注釈付きタグ：`backup-pre-refactor-20260809`
- 作業ブランチ：`refactor/old-chordwiki-preview`
- 作業前テスト：Node.js 24.14.0で52件合格

作業前状態へ戻すには、別作業ツリーまたはクリーンな作業ツリーで次を実行する。

```sh
git switch backup/pre-refactor-20260809
# または
git switch --detach backup-pre-refactor-20260809
```

今回の作業だけを取り消す場合は、`refactor/old-chordwiki-preview`を使用せず、バックアップブランチから新しいブランチを作る。タグとバックアップブランチはローカルに存在するため、PC外にも残す場合は明示的にpushする。

## 採用技術

- UIフレームワーク：追加しない
- モジュール：ブラウザーES Modules
- build：Vite 7
- Parser：`@chordwiki/chordpro-parser` 0.1.0（JSR公式tarball）
- 言語：既存JavaScriptを維持

React等への全面移行は、現在の変換・行修正・保存機能を同時に書き換える危険が大きい。今回は既存の責務別モジュールを維持し、最も混在していたプレビュー経路をES Moduleの起動点から段階的に差し替えた。Viteは公式ParserのESMをGitHub Pages向けに束ねる目的に限定している。

## 新しい構成

```text
index.html / preview HTML
  └─ js/entries/                 画面別の依存順序と起動
      ├─ main.js
      ├─ preview-window.js
      └─ committed-preview.js
          ├─ 既存 formatter / settings / storage / UI
          └─ Preview pipeline
              ├─ @chordwiki/chordpro-parser
              ├─ js/parser/chordwiki-adapter.js
              ├─ js/parser/formatter-notation.js
              ├─ js/renderer/old-chordwiki-renderer.js
              └─ js/chordwiki-preview.js（互換Facade）
```

- `js/parser/chordwiki-adapter.js`：公式`Song / Line / Item`をブラウザー非依存のPreview Modelへ変換する。
- `js/parser/formatter-notation.js`：`[|]`、`[----]`、`[>]`、`[○]`、`[N.C.]`等を分類する。
- `js/renderer/old-chordwiki-renderer.js`：Preview Modelから旧表示の行・コード・歌詞構造を生成する。
- `js/chordwiki-preview.js`：既存の`render` / `renderInto` APIを保ち、未buildのNodeテスト用互換Parserも提供する。
- `js/entries/*.js`：公式ParserをAdapterへ注入してから既存画面コードを起動する。依存順をHTMLのscript列から分離した。

既存の`converter.js`、`correction-input.js`、`settings.js`、`history.js`、`transposer.js`はそれぞれ変換、行修正、設定、履歴、移調の責務をすでに持つため、今回の対象外としてAPIと保存形式を維持した。`app.js`にはUI調停が多く残るため、今後は画面単位のcontrollerへ段階分割する。

## `wiki.cgi`の分析

`cgi/wiki.cgi`の`render()`を中心に分類した。

| 分類 | 該当処理 | 今回の扱い |
|---|---|---|
| Parser相当 | 空行、`#`、タイトル、副題、`{key:}`、コメント、URL、コード括弧の判定 | 公式ParserとAdapterへ置換 |
| 移調 | キー配列、異名同音置換、コード根音の移動 | 既存`transposer.js`を維持。公式Parserの`Song.transpose()`は表示経路では未使用 |
| Renderer相当 | `<p class="line">`、`span.chord`、`span.word`、`span.wordtop`、コードと歌詞のインライン配置 | 現代CSS用の`p.line.cw-score-line`、`.cw-chord`、`.cw-body`として再構築 |
| Metadata | title、subtitle、key、comment、chorus/tab開始終了 | Adapterで表示モデルへ変換 |
| サーバー固有 | CGI入出力、ファイル、広告、ランキング、画像ポップアップ、YouTube/MP3/NicoVideo、redirect | 移植しない |

旧実装の本質は、行頭の歌詞を`wordtop`、コード後の歌詞を`word`として開始し、コードspanと歌詞spanを同じ行内で交互に置く点にある。現Rendererも同じ視覚関係を保つが、コード画像onclick、古い外部サムネイル、ページ全体HTMLは再現しない。

## 公式Parserとの境界

利用する機能：

- ChordWiki方言の行分類
- `Tag`、`URLTag`、`Bars`
- `LyricsWithChord`、`LyricsWithAnnotation`
- コード、オンコード、括弧コード、`# / b`の構造化

Parser本体は改造していない。Formatter固有の注釈はAdapterで`bar / rhythm / chord / annotation`へ分類する。表示前の移調は既存`transposer.js`が担当するため、変換結果と現在の高度な異名同音設定を変更しない。

本番buildではクラス名が圧縮されるため、Adapterは`constructor.name`ではなく公式exportクラスへの`instanceof`を優先する。これを実ブラウザー確認で検出し修正した。

## 旧表示Rendererと安全性

- 各譜面行は`<p class="line cw-score-line">`を基点にする。
- コードとFormatter記号は`.cw-chord`内、歌詞は`.cw-body`内へ置く。
- 行頭・行末の`[|]`は上段境界として扱う。
- 通常の`|`は歌詞段の小節線として扱う。
- コメント行は表示しない。
- title、subtitle、comment、key、安全なHTTP(S)リンクを個別表示する。
- 文字はすべてHTML escapeする。
- URLは`URL`で解析し、`http:`と`https:`だけを許可する。
- DOM反映は`template`へ安全にescape済みHTMLを構築し、`replaceChildren()`で入れ替える。

差異：古い`span.word` / `span.wordtop`という名称、コード画像onclick、外部サービス埋め込みは採用しない。現在のレスポンシブ表示・移調・強調表示に必要な`cw-*`クラスを維持する。

## 互換性

- 変換エンジンの入出力は変更していない。
- 既存localStorageキーとJSON形式は変更していない。
- 設定、履歴、クラッシュ復元、確定譜面、別画面同期のキーはそのまま利用する。
- `ChordWikiPreview.render()`と`renderInto()`を残し、既存呼び出し元を変更していない。
- コード譜本文はブラウザー内で処理され、外部サーバーへ送信しない。公式Parserもbuild成果物内で実行する。

## テスト結果

- 作業前：52件合格
- 作業後：53件合格（公式Parser統合テストを追加）
- Vite production build：成功、35 modules
- GitHub Pages成果物：`index.html`、2種のプレビュー画面、`privacy.html`、CSS、JS、画像を`dist/`へ生成
- 実ブラウザーPC幅：公式Parser、旧表示DOM、移調、独自記法、非表示コメント、URL制限、コンソールエラーなしを確認
- 実ブラウザー390px幅：縦積みレイアウトと譜面横スクロールを確認

代表入力には通常コード＋歌詞、コードのみ、タグ、小節線、ハイフン、アクセント、白玉、オンコード、`# / b`、`N.C.`、空行、コメント、複数行を含めた。既存テストがシンコペーション、履歴、保存設定、レスポンシブ、コピー前後の処理を継続してカバーする。

## 今後の整理

1. `app.js`のUI調停を`ui/preview-controller`、`ui/history-controller`、`ui/layout-controller`へ分割する。
2. Preview ModelからHTML文字列を経由せず、Virtual Nodeまたは直接DOM生成へ移行する。
3. 旧`wiki.cgi`との代表fixtureを増やし、コード・歌詞位置の画像回帰テストを追加する。
4. 公式Parserの更新時は0.1.0との差分を確認し、lockfile更新と実ブラウザーbuild検証をセットで行う。
