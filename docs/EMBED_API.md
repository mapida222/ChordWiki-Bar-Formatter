# 別のUIへChordWiki表示を組み込む

`js/chordwiki-embed.js` は、フォーマッターで整えたChordWiki本文を別UIへ渡すための小さな橋渡しAPIです。

## 同じページへ埋め込む

`chordwiki-preview.js` とその依存ファイルを読み込んだ後に、次のように使います。

```html
<link rel="stylesheet" href="style.css">
<div id="chordwiki-view"></div>
<script src="js/parser/formatter-notation.js"></script>
<script src="js/parser/chordwiki-adapter.js"></script>
<script src="js/renderer/old-chordwiki-renderer.js"></script>
<script src="js/chordwiki-preview.js"></script>
<script src="js/chordwiki-embed.js"></script>
<script>
  const view = ChordWikiEmbed.mount(document.querySelector('#chordwiki-view'));

  // フォーマッターの変換後テキストを渡す
  view.setSource('{t:タイトル}\n[C]歌詞----|[G]続き');
</script>
```

`setSource()` は表示を更新し、`getPayload()` は次のデータを返します。

```js
{
  type: 'chordwiki:render',
  version: 1,
  source: 'フォーマッター後のChordWiki本文',
  model: { parser: 'legacy-compatibility', lines: [] },
  html: '安全化済みの表示HTML'
}
```

`html` を別UIのDOMへ直接入れる場合は、信頼できるこのフォーマッターの出力だけを使ってください。通常は `mount()` に表示先要素を渡す方法が安全です。

## 別ウィンドウ・別UIへ渡す

```js
// 受け側
window.addEventListener('message', (event) => {
  if (event.data?.type !== 'chordwiki:render' || event.data.version !== 1) return;
  document.querySelector('#chordwiki-view').innerHTML = event.data.html;
});

// 送り側。実運用では '*' ではなく受け側のOriginを指定する
ChordWikiEmbed.send(otherWindow, formattedChordWikiText, 'https://example.com');
```

CSSは既存の `style.css` から `.cw-` で始まるルールを受け側UIにも読み込んでください。既存のフォーマッター本体を変更せず、変換後テキストを `setSource()` または `send()` に渡せます。
