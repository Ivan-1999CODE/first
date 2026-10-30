// The Day 5 presentation is shared by Days 1–11. Topic-specific activities
// remain in their own lessons; curriculum and saved records are not rewritten.
const d5LessonDay = typeof focusRound === 'number' ? 1 : course.day;
const d5ActiveRound = () => d5LessonDay === 1 ? currentRound() : activeRound();
const d5TaskLabel = r => d5LessonDay === 1 ? r.id : taskLabel(r);
document.body.classList.add('lesson-focus');
if (d5LessonDay === 5) document.body.classList.add('lesson5-hierarchy');
document.documentElement.setAttribute('data-lesson-focus', '');
// Repetition stays within the task chosen by the teacher. Historical mixed
// review preferences remain saved but never change the current practice scope.
reviewScope = () => '';
selectedReviewRounds = () => [d5ActiveRound()];
const d5SectionIntros = [
 null,
 ['把句子帶著走', '先練暖黃色的「我會說」，再看藍色的「我要聽得懂」。'],
 [d5LessonDay === 5 ? '一句一句，走完這段路' : '一句一句，完成這個任務', '跟著當前角色開口或聽回覆，再點選符合情境的物件。'],
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
 const label = d5TaskLabel(d5ActiveRound());
 menu.textContent = page === 7 ? '08 · 整合選單' : `${String(page + 1).padStart(2, '0')} · ${label} 選單`;
 menu.setAttribute('aria-label', `開啟課程選單，目前任務 ${label}，第 ${page + 1} 部分：${dgLabels[page]}`);
 menu.title = `任務 ${label} · ${dgLabels[page]} · 開啟課程選單`;
 main.dataset.lessonSection = String(page + 1);
 if (page === 0) {
  if (d5LessonDay === 5) $('.dg-cover-copy').insertAdjacentHTML('beforeend', '<p class="d5-cover-subtitle">問清方向，也能安心搭車。</p>');
  main.querySelectorAll(':scope > .dg-teacher-notes').forEach(panel => panel.remove());
  const firstAttempt = main.querySelector('.dg-entry-note, .dg-entry-record');
  if (firstAttempt) firstAttempt.open = true;
  main.querySelector(':scope > .footer-actions')?.classList.add('dg-entry-next');
 } else if (page < 7) {
  let [title, description] = d5SectionIntros[page];
  if (page === 3 && d5ActiveRound().variationMode === 'repeat') {
   title = '同一段，試著自己說'; description = '沿用剛才的情境，少看一點提示，再說一次。';
  } else if (page === 3 && d5ActiveRound().variationMode === 'core') {
   title = '用學過的句子，再練一段'; description = '看清楚這次的情境，再用自己的英文表達。';
  }
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
  panel.querySelector('.dg-role-row')?.insertAdjacentHTML('afterend', '<p class="d5-focus-cue">↓ 看這裡，換你說</p>');
 });
 main.querySelectorAll('.dg-answer-panel').forEach(panel => {
  panel.insertAdjacentHTML('afterbegin', '<p class="d5-support-label">留下自己的說法</p>');
 });
 if (page === 3 && missions[mission].id === 'micro-en-d5-dropoff-and-stop-v1-change') {
  const condition = missions[mission].task.match(/^(.+?)「(.+?)」。(.+)$/u);
  const task = main.querySelector('.dg-task-panel > .task');
  if (condition && task) {
   task.innerHTML = `<span class="d5-condition-label">${esc(condition[1])}</span><strong class="d5-condition-focus">${esc(condition[2])}</strong>`;
   const note = document.createElement('p');
   note.className = 'fine d5-condition-note'; note.textContent = condition[3];
   task.after(note);
  }
 }
 const scene = main.querySelector('.scene-board');
 if (scene) {
  const listeningPrelude = d5LessonDay === 1 && page === 2 && flows[flow].prelude && !dgPrelude.done;
  const ready = listeningPrelude ? dgPrelude.heard : heard && spoken;
  scene.dataset.ready = String(ready);
  scene.insertAdjacentHTML('afterbegin', `<p class="d5-support-label">${ready ? '接著做 · 點選情境' : listeningPrelude ? '情境參考 · 聽完再操作' : '情境參考 · 說完再操作'}</p>`);
 }
 if (page === 4) main.querySelector('.dg-pair-note')?.remove();
 if (page === 5) {
  const next = main.querySelector(':scope > .footer-actions > button:last-child');
  if (next) next.textContent = `只練任務 ${label} 的回家挑戰 →`;
 }
};

// Day 1 has its own runtime. Match the same chapter navigation while leaving
// its separate eighth-part capstone and all flow gates available.
if (d5LessonDay === 1) {
 const originalFooter = focusFooter;
 focusFooter = function() {
  if (page === 1) return `<div class="footer-actions dg-section-footer">${btn('← 回上一部分', 'data-page="0"')}${btn('前往 03 跟著做 →', `data-start="${focusRound}"`, 'class="primary"')}</div>`;
  if (page === 2) return `<div class="footer-actions dg-section-footer">${btn('← 上一部分', 'data-page="1"')}${btn('前往 04 換條件 →', 'data-page="3"', 'class="primary"')}</div>`;
  const wrapper = document.createElement('div'); wrapper.innerHTML = originalFooter();
  if (page === 6) {
   const back = wrapper.querySelector('.footer-actions > button:last-child');
   if (back) back.textContent = '← 回到課前首頁';
  }
  return wrapper.innerHTML;
 };
}
