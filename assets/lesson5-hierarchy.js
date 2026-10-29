// Day 5 presentation pilot. Curriculum, events and persisted state stay owned
// by the guided lesson runtime. Rebuilt into the standalone HTML.
document.body.classList.add('lesson5-hierarchy');
const d5SectionIntros = [
 null,
 ['把句子帶著走', '先練暖黃色的「我會說」，再看藍色的「我要聽得懂」。'],
 ['一句一句，走完這段路', '跟著當前角色開口或聽回覆，再點選符合情境的物件。'],
 ['換個條件，自己說說看', '先看清楚任務，用剛才學過的句子表達。'],
 ['抬頭，和老師接話', '先看誰開口，再一起完成這次的溝通目標。'],
 ['看看這次的改變', '同一個情境再說一次，對照第一次的自己。'],
 ['再聽一次，再說一次', '用熟悉的句子練習；完成後，勾下自己的紀錄。']
];
const d5GuidedRender = render;
render = function () {
 d5GuidedRender();
 const main = $('#main');
 const menu = $('#dg-menu-open');
 menu.textContent = `${String(page + 1).padStart(2, '0')} · ${taskLabel(activeRound())} 選單`;
 menu.setAttribute('aria-label', `開啟課程選單，目前任務 ${taskLabel(activeRound())}，第 ${page + 1} 部分：${dgLabels[page]}`);
 menu.title = `任務 ${taskLabel(activeRound())} · ${dgLabels[page]} · 開啟課程選單`;
 if (page === 0) {
  $('.dg-cover-copy').insertAdjacentHTML('beforeend', '<p class="d5-cover-subtitle">問清方向，也能安心搭車。</p>');
  main.querySelectorAll(':scope > .dg-teacher-notes').forEach(panel => panel.remove());
  const firstAttempt = main.querySelector('.dg-entry-note');
  if (firstAttempt) firstAttempt.open = true;
 } else {
  const [title, description] = d5SectionIntros[page];
  // The chapter title is the page heading; the current spoken task is a subheading.
  main.querySelectorAll('h1').forEach(el => {
   const h2 = document.createElement('h2');
   for (const attr of el.attributes) h2.setAttribute(attr.name, attr.value);
   h2.innerHTML = el.innerHTML; el.replaceWith(h2);
  });
  const heading = document.createElement('header');
  heading.className = 'd5-section-heading';
  heading.innerHTML = `<span class="d5-section-number" aria-hidden="true">${String(page + 1).padStart(2, '0')}</span><div><h1>${esc(title)}</h1><p>${esc(description)}</p></div>`;
  main.prepend(heading);
 }
 main.querySelectorAll('.dg-speaker:not(.dg-listener)').forEach(panel => {
  panel.querySelector('.dg-role-row').insertAdjacentHTML('afterend', '<p class="d5-focus-cue">↓ 看這裡，換你說</p>');
 });
 main.querySelectorAll('.dg-answer-panel').forEach(panel => {
  panel.insertAdjacentHTML('afterbegin', '<p class="d5-support-label">留下自己的說法</p>');
 });
 const scene = main.querySelector('.scene-board');
 if (scene) {
  scene.dataset.ready = String(heard && spoken);
  scene.insertAdjacentHTML('afterbegin', `<p class="d5-support-label">${heard && spoken ? '接著做 · 點選情境' : '情境參考 · 說完再操作'}</p>`);
 }
};
