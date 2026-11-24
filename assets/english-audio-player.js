// The recordings are local to this lesson, including when opened directly from disk.
(() => {
  'use strict';
  const data = document.getElementById('english-ai-data');
  if (!data) return;
  const defaultRecordings = JSON.parse(data.textContent);
  let recordings = defaultRecordings;
  const normalize = text => String(text || '').normalize('NFKC')
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[‐‑–]/g, '-')
    .replace(/\s+/g, ' ').trim().toLowerCase();
  const keys = new Map(Object.keys(recordings).map(text => [normalize(text), text]));
  const sentences = [...keys.keys()].filter(text => /[.!?]$/.test(text)).sort((a, b) => b.length - a.length);
  function clips(text) {
    const key = normalize(text);
    if (keys.has(key)) return [recordings[keys.get(key)]];
    if (!key || /[\u3400-\u9fff]/u.test(key)) return [];
    const result = [];
    for (const alternative of key.split(/\s+\/\s+|\s*→\s*/)) {
      let rest = alternative;
      while (rest) {
        const found = keys.has(rest) ? rest : sentences.find(sentence =>
          rest.startsWith(sentence) && /\s/.test(rest.charAt(sentence.length)));
        if (!found) return [];
        result.push(recordings[keys.get(found)]);
        rest = rest.slice(found.length).trimStart();
      }
    }
    return result;
  }

  const status = document.querySelector('.lesson-audio-status') || document.createElement('div');
  status.classList.add('lesson-audio-status', 'english-ai-status');
  status.lang = 'zh-Hant';
  const message = document.createElement('span');
  message.setAttribute('role', 'status');
  const stopButton = document.createElement('button');
  stopButton.type = 'button';
  stopButton.textContent = '停止播放';
  stopButton.addEventListener('click', stop);
  status.removeAttribute('role');
  status.hidden = true;
  status.replaceChildren(message, stopButton);
  if (!status.isConnected) document.body.append(status);
  let player = null;
  let pending = null;
  let hideTimer;
  function show(text, canStop = false) {
    clearTimeout(hideTimer);
    message.textContent = text;
    status.hidden = !text;
    stopButton.hidden = !canStop;
    if (text && !canStop) hideTimer = setTimeout(() => { status.hidden = true; }, 6000);
  }
  function finish(success) {
    if (player) {
      player.onplaying = player.onended = player.onerror = null;
      player.pause();
      player.removeAttribute('src');
      player.load();
      player = null;
    }
    if (pending) pending(success);
    pending = null;
  }
  function stop() {
    finish(false);
    show('');
  }
  function play(text, slow = false) {
    stop();
    const queue = clips(text);
    if (!queue.length) {
      show('這句的錄音無法播放。');
      return Promise.resolve(false);
    }
    const outcome = new Promise(resolve => { pending = resolve; });
    const audio = new Audio();
    player = audio;
    audio.preservesPitch = true;
    let index = 0;
    function failed() {
      if (player !== audio) return;
      finish(false);
      show('音檔未能播放，請再試一次。');
    }
    function next() {
      if (player !== audio) return;
      audio.src = queue[index++];
      audio.playbackRate = slow ? .8 : 1;
      try { audio.play().catch(failed); } catch { failed(); }
    }
    audio.onerror = failed;
    audio.onplaying = () => {
      if (player === audio) show(slow ? '正在慢速播放 AI 語音…' : '正在播放 AI 語音…', true);
    };
    audio.onended = () => {
      if (player !== audio) return;
      if (index < queue.length) next();
      else { finish(true); show(''); }
    };
    show('正在準備錄音…', true);
    next();
    return outcome;
  }
  window.TravelEnglishAudio = { play, stop, has: text => clips(text).length > 0 };
  if (document.getElementById('english-ai-voices')) {
    window.TravelEnglishAudio.setRecordings = bank => {
      stop();
      recordings = bank || defaultRecordings;
    };
  }
  if (typeof window.speak === 'function') window.speak = play;
  if (typeof window.stopAudio === 'function') window.stopAudio = stop;
  window.addEventListener('pagehide', stop);

  const main = document.getElementById('main');
  if (!main) return;
  const excluded = 'a,button,label,input,textarea,select,summary,script,style,svg,nav,iframe,' +
    '[contenteditable],.readonly,.dg-before-record,.dg-entry-record,.english-ai-actions';
  const existing = '[data-say],[data-cap-say],[data-workshop-say]';
  const authored = 'p,li,td,th,dd,dt,span,strong,b,blockquote,div[lang="en"]';
  const attached = new WeakSet();
  function hasControls(element, text) {
    // Archived phrase cards use the row index, and their reference-answer
    // button sits directly after the corresponding English paragraph.
    if (element.matches('.quote.en') && (
      element.closest('section.phrase')?.querySelector('[data-phrase]') ||
      element.nextElementSibling?.matches('button[data-mission-audio]'))) return true;
    // An existing listen button may sit just outside its transcript disclosure.
    const container = element.closest('tr,.d5-script-line,article,li,.role-self,.role-other,section') || element.parentElement;
    if (!container) return false;
    return Array.from(container.querySelectorAll(existing)).some(button => {
      const hiddenBy = button.closest('details,[hidden],[inert],[aria-hidden="true"]');
      if (hiddenBy && !hiddenBy.contains(element)) return false;
      const value = button.dataset.say || button.dataset.capSay || button.dataset.workshopSay;
      return normalize(value) === normalize(text);
    });
  }
  function actions(text) {
    const group = document.createElement('span');
    group.className = 'english-ai-actions';
    group.lang = 'zh-Hant';
    for (const slow of [false, true]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = slow ? '慢速' : '▶ 聽英文';
      button.setAttribute('aria-label', (slow ? '慢速播放 ' : '播放 ') + text);
      button.dataset.englishAiSay = text;
      if (slow) button.dataset.englishAiSlow = 'true';
      group.append(button);
    }
    return group;
  }
  function decorate(element) {
    if (attached.has(element) || element.closest(excluded)) return;
    // Work with the authored text node itself. Attaching buttons to a parent
    // disclosure or interaction control could expose the answer prematurely.
    for (const part of Array.from(element.childNodes)) {
      if (part.nodeType !== Node.TEXT_NODE) continue;
      const value = part.textContent;
      if (clips(value).length) {
        const text = keys.get(normalize(value)) || value.trim();
        if (hasControls(element, text)) continue;
        const group = actions(text);
        if (element.childNodes.length === 1 && !element.matches('td,th,li,dd,dt,[hidden],[inert],[aria-hidden="true"]')) {
          element.after(group);
        } else {
          part.after(group);
        }
      } else if (/[\u3400-\u9fff]/u.test(value) && /[A-Za-z]/.test(value)) {
        // A Chinese teaching note can contain additional English examples.
        // Insert each control at the end of its phrase, inside the original note.
        const phrases = [...value.matchAll(/[\p{Script=Latin}][\p{Script=Latin}\p{M}\d ’',.!?…/-]*/gu)];
        for (const match of phrases.reverse()) {
          const text = match[0].trimEnd();
          if (!/[ .!?…]/u.test(text) || !clips(text).length || hasControls(element, text)) continue;
          part.splitText(match.index + text.length).before(actions(text));
        }
      }
    }
    attached.add(element);
  }
  function scan(container) {
    if (container.nodeType !== Node.ELEMENT_NODE || container.closest(excluded)) return;
    if (container.matches(authored)) decorate(container);
    container.querySelectorAll(authored).forEach(decorate);
  }
  scan(main);
  new MutationObserver(changes => {
    for (const change of changes) for (const node of change.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) scan(node);
    }
  }).observe(main, { childList: true, subtree: true });
  main.addEventListener('click', event => {
    const button = event.target.closest('[data-english-ai-say]');
    if (!button) return;
    event.stopPropagation();
    play(button.dataset.englishAiSay, button.dataset.englishAiSlow === 'true');
  });
})();
