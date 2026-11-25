# 更新履歴のコンパクト表示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 日付をまとめ、最大360pxのパネル内で履歴を自動追加する。

**Architecture:** 既存の各履歴のDOM・内容・順番を保ち、同日の2件目以降の日付だけを非表示にする。既存の5件単位の表示処理をスクロール・開閉・リサイズに接続し、表示領域が不足する間はフレームごとに補充する。

**Tech Stack:** 既存のHTML、CSS Grid、素のJavaScript、Node標準テスト、Vite。

**Spec:** このチャットの「更新履歴の表示レイアウト改善」依頼（追記後）。

## Global Constraints

- 本文・日付・カテゴリ・並び順を変更しない。
- カテゴリの配色と角丸背景、ライト／ダークテーマを維持する。
- 日付13px、カテゴリ11px、本文13〜14px。カテゴリと本文は固定幅の2列。
- ボタンを廃止し、全件表示時のみ「すべての更新履歴を表示しました」を表示する。
- 新規依存関係や保存形式の変更、公開は含まない。

## Review Focus

- 初期5件だけでスクロールできない場合も、開いたときに補充できる。
- 追加境界が同日の途中でも日付が重複しない。
- 最終バッチが5件未満でも重複・欠落がなく、完了状態が伝わる。
- スクロール位置と背面のページ位置を保持する。
- 390px幅・両テーマで折り返し、本文開始位置、コントラストを確認する。

## Task 1: 日付グループ化と自動追加

- [x] `tests/header-controls.test.js` の既存ページ送りテストを、日付・スクロール・完了状態の動作テストへ更新してREDを確認する。
- [x] `index.html` のボタンを完了ステータスへ置き換える。
- [x] `js/update-history.js` で日付を整理し、下端64px以内・開閉・リサイズで5件ずつ補充する。非表示中は補充しない。
- [x] CSSを2列・日付グループ間の境界線・最大360px・本文色`--text`へ更新する。
- [x] `MANAGEMENT_IDS.md` の既存 `LAYOUT-031` / `LAYOUT-035` を更新する。
- [x] 関連テスト、`npm run verify`、`npm run build`、`git diff --check` を実施する。
- [x] 実ブラウザーでPC／390px、両テーマ、全件表示、位置保持を確認し、差分をレビューする。

## Validation results

- 関連テスト、全74件と構文検査、Release Gate、本番ビルド、whitespace検査が成功。
- 1280x900と390x844のライト・ダーク表示、および320px幅ではみ出しなしを確認。
- 全22件の自動追加、11日付の重複なし、完了表示、末尾での背面スクロール抑止を確認。
- End・PageDownでの追加と、背面のページ位置保持を確認。
- 独立レビューで重大・中程度の指摘なし。
- スマートフォン実機・スクリーンリーダーは未検証。Web公開は今回の作業に含めない。
