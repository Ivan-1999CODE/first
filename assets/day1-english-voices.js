(() => {
  'use strict';
  const player = window.TravelEnglishAudio;
  const data = document.getElementById('english-ai-voices');
  const dayNav = document.getElementById('dg-days');
  if (!data || !dayNav || !player?.setRecordings) return;

  const banks = JSON.parse(data.textContent);
  const names = new Map([
    ['uk-female', '英式女聲'], ['uk-male', '英式男聲'],
    ['us-female', '美式女聲'], ['us-male', '美式男聲']
  ]);
  const preference = 'travel-lab-english-voice';
  function savedVoice() {
    try {
      const saved = localStorage.getItem(preference);
      if (names.has(saved)) return saved;
      const legacy = localStorage.getItem('travel-lab-day1-english-voice');
      if (names.has(legacy)) {
        try { localStorage.setItem(preference, legacy); } catch { /* Read-only storage. */ }
        return legacy;
      }
    } catch { /* The selection still works for this visit. */ }
  }
  let selected = savedVoice() || 'us-female';

  const toolbar = document.createElement('div');
  toolbar.className = 'lesson-voice-settings';
  dayNav.before(toolbar);
  const picker = document.createElement('details');
  picker.id = 'day1-voice-picker';
  picker.innerHTML = `<summary><span class="day1-voice-caption">章節發音</span>
    <strong class="day1-current-voice"></strong></summary>
    <fieldset id="day1-voice-options"><legend class="dg-sr-only">章節發音</legend>
    ${[...names].map(([id, label]) =>
      `<label><input type="radio" name="day1-english-voice" autocomplete="off" value="${id}"><span>${label}</span></label>`
    ).join('')}</fieldset>`;
  toolbar.append(dayNav, picker);

  const summary = picker.querySelector('summary');
  const valueLabel = summary.querySelector('strong');
  function choose(id) {
    player.setRecordings(id === 'us-female' ? null : banks[id]);
    selected = id;
    valueLabel.textContent = names.get(id);
    picker.querySelector(`input[value="${id}"]`).checked = true;
  }
  function closePicker() {
    picker.open = false;
    summary.focus({ preventScroll: true });
  }
  choose(selected);

  // A page restored from the back/forward cache may predate a choice on another lesson.
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      const saved = savedVoice();
      if (saved && saved !== selected) choose(saved);
    }
  });

  picker.addEventListener('change', event => {
    choose(event.target.value);
    try {
      localStorage.setItem(preference, selected);
    } catch {
      document.getElementById('dg-announcement').textContent = '發音已切換，本次使用有效。';
    }
  });
  picker.addEventListener('click', event => {
    // Arrow keys also trigger radio clicks. Keep the list open for keyboard browsing.
    if (event.detail > 0 && event.target.matches('input')) closePicker();
  });
  picker.addEventListener('keydown', event => {
    if (!picker.open) return;
    if (event.key === 'Escape' || (event.key === 'Enter' && event.target.matches('input'))) {
      event.preventDefault();
      closePicker();
    }
  });
  picker.addEventListener('focusout', event => {
    // Pressing a label can temporarily move focus to the document before its radio receives the click.
    if (event.relatedTarget && !picker.contains(event.relatedTarget)) picker.open = false;
  });
  document.addEventListener('pointerdown', event => {
    if (picker.open && !picker.contains(event.target)) picker.open = false;
  });
})();
