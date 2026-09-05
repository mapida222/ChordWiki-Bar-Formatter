# AdSense Readiness

## Current state

ChordWiki Bar Formatter uses publisher ID `ca-pub-4561699699325989` for Google AdSense.
The public site loads the AdSense auto ads snippet from `index.html` and `privacy.html`.
The old `cgi/wiki.cgi` file was only a reference for the legacy renderer and is not part of the public site.

## What is already in place

- `index.html` and `privacy.html` include Google Analytics `G-5584BE36ZV` and the AdSense snippet
- CSP allows only the Google endpoints required by Analytics and AdSense
- The privacy policy explains Analytics, cookies, and ad usage

## Ongoing guidance

- Do not keep secrets in the public repository
- Keep the public site focused on the web app, not on the old CGI reference files
- If more public pages are added later, make sure they carry the required tags too

## 広告を一時停止する手順

初期段階では、広告コードを削除せず、Google AdSenseの自動広告だけを停止する。
コードとプライバシー告知を残しておけば、アクセスが増えたときに同じ設定を戻すだけで再開できる。

1. [Google AdSense](https://www.google.com/adsense/)へログインする。
2. 左メニューの「広告」または「サイト」を開く。
3. `chordwikibarformatter.com` を選ぶ。
4. 「自動広告」をオフにする。
5. 保存または適用後、[公開サイト](https://chordwikibarformatter.com/)を確認する。

広告を再開するときは、同じサイトの「自動広告」をオンに戻す。
反映には時間がかかる場合があるため、変更直後ではなく少し時間を置いて確認する。

### 停止中も残すもの

- `index.html` と `privacy.html` のAdSenseコード
- AdSenseのpublisher ID
- [プライバシーポリシー](https://chordwikibarformatter.com/privacy.html)の広告に関する説明

### 関連リンク

- [AdSense管理画面](https://www.google.com/adsense/)
- [AdSenseヘルプ](https://support.google.com/adsense/?hl=ja)
- [Googleの広告に関するポリシー](https://policies.google.com/technologies/ads?hl=ja)
- [Google広告設定](https://adssettings.google.com/)
