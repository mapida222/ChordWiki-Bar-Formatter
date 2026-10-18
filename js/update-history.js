(() => {
  const history = document.querySelector('.header-notice-history');
  const more = document.querySelector('#header-notice-more');
  if (!history || !more) return;

  const entries = [...history.querySelectorAll(':scope > p')];
  const pageSize = 5;
  let visibleCount = pageSize;

  const render = () => {
    entries.forEach((entry, index) => { entry.hidden = index >= visibleCount; });
    const remaining = Math.max(0, entries.length - visibleCount);
    more.hidden = remaining === 0;
    more.textContent = `過去の更新履歴をさらに表示（残り${remaining}件）`;
  };

  more.addEventListener('click', () => {
    visibleCount = Math.min(entries.length, visibleCount + pageSize);
    render();
  });
  render();
})();
