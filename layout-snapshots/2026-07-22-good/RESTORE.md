# レイアウト復元用スナップショット

保存日：2026年7月22日

このフォルダーは、現在の譜面プレビューレイアウトを「ベスト条件」として保存した復元元である。
通常の修正では、先に`LAYOUT_REFERENCE.md`を参照する。
表示が崩れて原因を特定できない場合だけ、このスナップショットと現行ファイルを比較する。

## Codexへの依頼文

次のように依頼する。

> `layout-snapshots/2026-07-22-good`と現在のファイルを比較し、レイアウトに関係する差分だけを正常時点へ戻してください。変換処理と保存データには触れないでください。

または、単に「譜面プレビューをベスト条件と比較して」と依頼する。

## 保存対象

- `style.css`：画面全体と譜面プレビューの配置
- `index.html`：トップページの構造と読み込み版番号
- `chordwiki-preview.html`：別画面プレビューの構造と読み込み版番号
- `js/app.js`：03から05の位置計算
- `js/settings.js`：初期設定の順序と入力範囲
- `js/chordwiki-preview.js`：小節線とコードや歌詞の描画構造
- `tests/preview.test.js`：プレビュー構造の回帰テスト
- `tests/preview-layout.test.js`：レイアウト値の回帰テスト
- `LAYOUT_REFERENCE.md`：数値と表示規則

## 復元時の注意

スナップショットを無条件で全上書きしない。
保存日以降に追加した変換機能まで消える可能性があるため、現行ファイルとの差分を確認してレイアウト部分だけを戻す。
復元後は、プレビューと初期設定のテストを実行する。

```powershell
node tests/preview.test.js
node tests/preview-layout.test.js
node tests/settings.test.js
```
