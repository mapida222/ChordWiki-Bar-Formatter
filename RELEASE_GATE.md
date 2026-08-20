# 公開前 Release Gate

公開判断の最低基準は、リポジトリルートで次を実行することです。

```text
npm ci
npm run verify
```

`npm run verify` は次を順に実行します。

- **unit / regression / syntax**：既存の全 `tests/*.test.js` / `tests/*.test.mjs`、および主要JavaScriptの `node --check`。
- **主要変換ケース**：通常のコード・歌詞、複数コード、拍／小節、手動リズム、シンコペーション、アクセント、移調、公式Parser連携。既存の converter / preview / regression テストで確認する。
- **保存→復元**：設定、履歴、行修正、行ID、変換後の手動編集、確定譜面の復元。`settings` / `history-restore` / `source-edit-correction-preservation` テストで確認する。
- **設定変更**：4/4・6/8・カスタムプロファイル、設定値の保存・リセット・再読込。
- **編集データ保持**：入力行の追加・削除・変更時の行修正保持、手動出力の上書き保持。
- **セキュリティ静的検査**：公開HTMLのCSP必須ディレクティブ、インラインscript、`javascript:` URLを検査する。XSSのHTMLエスケープ、危険URLの除外は preview と公式Parser統合テストで確認する。
- **production build**：Viteで4つの公開入口を `dist/` に生成する。

GitHub Actionsではこれに加えて、PR全体またはmainへの直近コミットへ`git diff --check`相当のwhitespace検査を行う。ローカルの作業ツリー差分は公開前に`git diff --check`で確認する。

lint / formatter は現在プロジェクトへ導入されていません。したがって、Release Gateでは既存のJavaScript構文検査を静的チェックとして扱い、lint導入後はこのコマンドへ追加します。

## 手動チェック（5項目以内）

自動チェックがPASSした後、公開候補のURLまたは `npm run preview` で次だけ確認します。

1. 入力サンプルを読み込み、変換結果の行数・小節線・拍記号が保たれる。
2. 設定を1つ変更して再読込し、設定と入力・行修正・手動編集が失われない。
3. 通常プレビューと別画面プレビューの表示・編集・移調が同期する。
4. モバイル幅とデスクトップ幅で、主要操作が塞がれていない。
5. DevTools Consoleにエラーがなく、公開URLの入口（通常画面・プレビュー・プライバシー）が開く。

## PASSで保証できること

このゲートのPASSは、既知のテストケースについて変換・保存／復元・設定・編集保持が壊れておらず、JavaScript構文エラーがなく、CSP等の公開ポリシーを満たすproduction buildが生成できることを保証します。XSS対策対象の既知ケースも回帰テストで検査します。

## PASSでも保証できないこと

未知の入力パターン、すべてのブラウザー／OS／画面幅、細かな見た目の差異、広告・解析サービスなど外部サービスの可用性、GitHub Pagesの配信状態、依存パッケージやブラウザー自体の未知の脆弱性、実際の利用者データの意味的な正しさまでは保証しません。したがって、手動5項目と公開後の動作確認は省略できません。
