# AdSense導入前監査

## 結論

ChordWiki Bar Formatter所有者のpublisher ID `ca-pub-4561699699325989` を確認し、Google公式の自動広告用共通コードを `index.html` と `privacy.html` へ導入した。
`cgi/wiki.cgi` にある `ca-pub-6362118305215071` は参照用に同梱された旧ChordWiki側のコードであり、本サイトでは使用しない。

## 現在の計測・広告

- `index.html` と `privacy.html` はGoogle Analytics `G-5584BE36ZV` とAdSense自動広告コードを読み込む。
- CSPはAnalyticsとAdSenseに必要なGoogle配信元をscript、frame、image、connectへ限定して許可する。
- プライバシーポリシーはAnalytics、広告配信、Cookie、第三者配信事業者、広告設定を説明する。

## 今後、手動広告ユニットを追加する場合に必要な情報

- 手動の場合は広告ユニットIDと希望位置
- 同意管理が必要な配信地域と運用方針

## 推奨差し込み位置

編集作業を分断しないよう、第一候補はメインの変換ワークスペース終了後、サイトフッターの前とする。
モバイルでは固定・追従広告を独自実装せず、入力欄や操作ボタンを覆わない通常フローの枠だけを使用する。

## 実装時の確認項目

1. 公式AdSenseコードを実publisher IDで追加する。
2. CSPへAdSenseが実際に要求するscript、frame、image、connectの配信元だけを追加する。
3. `privacy.html` を広告、Cookie、パーソナライズ、オプトアウトの運用に合わせて更新する。
4. 広告ブロック時にも余白だけが残らず、PC／モバイルの編集領域が狭くならないことを確認する。
5. AnalyticsとAdSenseの二重読み込み、コンソールのCSP違反、開発環境での意図しない広告リクエストがないことを確認する。
