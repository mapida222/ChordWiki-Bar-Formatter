# ChordWiki Bar Formatter

ChordPro形式のコード譜へ、**小節線と音の長さを表す記号を自動で追加する**ブラウザーツールです。

① コード譜を貼る

② 自動で整える

③ 譜面として確認する

![ヘルプ・使い方：ツール概要](docs/images/readme-help01.png)

インストール不要、ブラウザー使用、ChordWiki非公式ツールです。

**今すぐ使う：** [ChordWiki Bar Formatter](https://mapida222.github.io/ChordWiki-Bar-Formatter/)

## できること

- コード譜への小節線と長さ記号の追加
- 行単位の長さ修正と小節位置の調整
- コード譜のプレビュー
- 移調とシャープ・フラット表記の切り替え
- 変換前の小節幅と初期設定が異なる場合の警告
- 歌詞行のハイフン省略方法の選択
- 編集履歴とクラッシュ復元
- ライトテーマとダークテーマ
- 画面幅に応じたレイアウト

## 目次

- [使い方](#使い方)
- [基本的な使い方](#基本的な使い方)
- [変換例](#変換例)
- [詳しい修正方法](#詳しい修正方法)
- [リアルタイムエディター](#リアルタイムエディター)
- [できること](#できること)
- [入力データについて](#入力データについて)
- [使える環境](#使える環境)
- [開発者向け](#開発者向け)
- [公開情報](#公開情報)

## 使い方

### 基本的な使い方

![基本的な使い方](docs/images/readme-help-basic-flow.png)

### 変換例

![変換前](docs/images/readme-conversion.png)

![行修正](docs/images/readme-row-edit.png)

![譜面プレビュー](docs/images/readme-score-preview.png)

### 詳しい修正方法

![詳しい修正方法](docs/images/readme-help-adjust.png)

- 初期設定で小節のハイフン数を変える
- 行修正で数字を入力してハイフン数を変える
- `s`、`*s`、`/`でシンコペーションや小節位置を調整する

## リアルタイムエディター

![リアルタイムエディター](docs/images/readme-realtime-editor.png)

- 編集テキストと譜面プレビューを並べて確認
- 編集内容をリアルタイムで譜面へ反映
- 譜面側の行をクリックして対応する編集行を確認

## 入力データについて

- 入力したコード譜は、外部のサーバーへ送信しません。
- 作業内容は、このブラウザーに保存されます。
- ブラウザーのサイトデータを消すと、保存した作業も消えます。
- コード譜や歌詞を公開するときは、利用してよいものか確認してください。

## 使える環境

PCのFirefox、Google Chrome、Microsoft Edgeで使えます。

スマートフォンでも開けますが、細かい修正にはPCがおすすめです。

## 開発者向け

<details>
<summary>開発とテスト</summary>

Node.js 20.19以上を用意し、リポジトリのルートで次を実行します。

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

`npm run dev`は開発サーバー、`npm run build`はGitHub Pages用の`dist/`、`npm run preview`はその成果物の確認用サーバーを起動します。

テストは`tests`内の全ファイル、公式ChordWiki Parserとの統合、主要JavaScriptの構文を検査します。

プレビューは公式[`@chordwiki/chordpro-parser`](https://github.com/ChordWiki/chordpro-parser)でChordWiki方言を解析し、Formatter固有記法のAdapterを経由して旧ChordWiki表示Rendererへ渡します。

</details>

<details>
<summary>管理IDとレイアウト基準</summary>

修正箇所と確認項目は[管理ID台帳](MANAGEMENT_IDS.md)で管理しています。

譜面プレビューの基準は[レイアウト設定書](LAYOUT_REFERENCE.md)に記録しています。

</details>

## 公開情報

公開先は[GitHub Pages](https://mapida222.github.io/ChordWiki-Bar-Formatter/)です。

更新履歴は[Releases](https://github.com/mapida222/ChordWiki-Bar-Formatter/releases)で公開します。

このソフトウェアは[MIT License](LICENSE)で公開しています。
