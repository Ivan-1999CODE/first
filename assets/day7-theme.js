(() => {
  const root = document.documentElement;
  const button = document.getElementById('themeToggle');
  function updateButton() {
    const dark = root.dataset.theme === 'dark';
    button.textContent = dark ? '☀ 淺色' : '☾ 深色';
    button.setAttribute('aria-label', dark ? '切換為淺色模式' : '切換為深色模式');
    button.setAttribute('aria-pressed', String(dark));
  }
  button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    updateButton();
    try { localStorage.setItem('travel-lab-theme', root.dataset.theme); }
    catch { toast('已切換外觀；此瀏覽器目前無法保存設定。'); }
  });
  updateButton();
})();
