(() => {
  const THEME_STORAGE_KEY = 'chordWikiBarFormatter.theme.v1';
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      document.documentElement.dataset.theme = savedTheme;
    }
  } catch (_error) {
    // テーマ設定が使えない環境では、既定のライトテーマを使う。
  }
})();
