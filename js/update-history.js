(() => {
  const history = document.querySelector('.header-notice-history');
  const status = document.querySelector('#header-notice-status');
  if (!history || !status) return;

  const entries = [...history.querySelectorAll(':scope > p')];
  const pageSize = 5;
  let visibleCount = pageSize;

  let previousDate;
  entries.forEach(entry => {
    const time = entry.querySelector('time');
    const date = time.dateTime;
    const startsDate = date !== previousDate;
    time.hidden = !startsDate;
    entry.classList.toggle('header-notice-date-start', startsDate);
    previousDate = date;
  });

  const render = () => {
    entries.forEach((entry, index) => { entry.hidden = index >= visibleCount; });
    status.textContent = visibleCount >= entries.length ? 'すべての更新履歴を表示しました' : '';
  };

  const loadNearBottom = () => {
    if (!history.clientHeight || visibleCount >= entries.length) return;
    if (history.scrollHeight - history.scrollTop - history.clientHeight > 64) return;
    const top = history.scrollTop;
    visibleCount = Math.min(entries.length, visibleCount + pageSize);
    render();
    history.scrollTop = top;
    requestAnimationFrame(loadNearBottom);
  };
  history.addEventListener('scroll', loadNearBottom, { passive: true });
  history.closest('details')?.addEventListener('toggle', () => {
    requestAnimationFrame(loadNearBottom);
  });
  window.addEventListener('resize', () => requestAnimationFrame(loadNearBottom));
  render();
  requestAnimationFrame(loadNearBottom);
})();
