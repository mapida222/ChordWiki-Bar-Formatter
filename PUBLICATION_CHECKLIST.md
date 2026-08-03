# 公開チェックリスト

管理ID：`PUBLIC-001`

## 公開前に完了する項目

- [x] ブラウザー内で完結し、入力内容を外部送信しないことを確認する。
- [x] ブラウザー内へ保存するデータをREADMEへ記載する。
- [x] 公開用のテストコマンドを用意する。
- [x] 全回帰テストとJavaScript構文検査を成功させる。
- [x] 譜面プレビューを`PREVIEW-001`と比較する。
- [x] OS固有ファイルとローカル作業ファイルをGit対象外にする。
- [x] 管理IDをGitのコミットメッセージへ含める規則を定める。
- [x] 公開ライセンスをMIT Licenseに決定し、`LICENSE`を追加する。
- [x] 公開先をGitHub Pagesに決定する。
- [x] 公開用Gitリモート`origin`を登録する。
- [x] 公開URLで主要操作と別画面プレビューを確認する。

## 公開設定

- GitHubリポジトリ：<https://github.com/mapida222/ChordWiki-Bar-Formatter>
- 公開元：`main`ブランチからGitHub Actionsが抽出した公開用ファイル
- 公開URL：<https://mapida222.github.io/ChordWiki-Bar-Formatter/>
- 公開用Gitリモート：`origin`（`https://github.com/mapida222/ChordWiki-Bar-Formatter.git`）
- 公開ライセンス：[MIT License](LICENSE)

## 公開URLの確認記録

2026年8月2日に次の操作を確認しました。

- 入力サンプルを読み込み、13行の変換結果が生成される。
- 変換後へ小節線と拍記号が追加される。
- 通常画面の譜面プレビューへタイトル、コード、歌詞が表示される。
- 別画面プレビューが通常画面と同期する。
- 別画面プレビューで移調を`+2`へ変更できる。
- 通常画面と別画面プレビューにコンソールエラーがない。

## 公開候補

このアプリはビルド不要の静的サイトです。
GitHub Actionsで`index.html`、別画面プレビュー、CSS、JavaScript、画像など実行に必要なファイルだけを抽出し、GitHub Pagesへ配置します。
入口は`index.html`です。
