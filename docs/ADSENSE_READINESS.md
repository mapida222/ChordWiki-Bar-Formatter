# AdSense導入前監査

## 結論

このリポジトリには、ChordWiki Bar Formatter所有者のAdSense publisher ID、広告ユニットID、導入コードはない。
`cgi/wiki.cgi` にある `ca-pub-6362118305215071` は参照用に同梱された旧ChordWiki側のコードであり、本サイトへ流用してはならない。

実IDがない状態で広告スクリプトや空の広告枠を追加すると、所有者の取り違え、CSP違反、レイアウトの空白化を招くため、今回はコードを追加しない。

## 現在の計測

- `index.html` と `privacy.html` は Google Analytics `G-5584BE36ZV` を読み込む。
- CSPはGoogle Tag ManagerのscriptとGoogle Analyticsのconnectだけを許可している。
- プライバシーポリシーはAnalyticsを説明しているが、広告配信・Cookie・第三者配信事業者の説明はまだない。

## 導入時に必要な情報

- ChordWiki Bar Formatter所有者の `ca-pub-...`
- 自動広告か手動広告ユニットか
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
