// Day 5: hand each confirmation to the next role, then to the city activity.
// Keep the existing heard/spoken gates, choice validation and saved identifiers.
const d5OriginalScenePage = scenePage;
function d5FlowStage(t) {
 return heard && spoken ? 2 : (t.askFirst ? spoken : heard) ? 1 : 0;
}
function d5FlowSteps(t, counterpart) {
 const stage = d5FlowStage(t);
 const roles = t.askFirst ? ['你先說', `聽${counterpart}回覆`] : [`先聽${counterpart}`, '換你回答'];
 return `<ol class="d5-flow-steps" aria-label="這一句的練習順序">${[...roles, '地圖操作'].map((label, i) =>
  `<li class="${i < stage ? 'done' : ''}" ${i === stage ? 'aria-current="step"' : ''}><span aria-hidden="true">${i < stage ? '✓' : i + 1}</span>${esc(label)}</li>`
 ).join('')}</ol>`;
}
scenePage = function () {
 const markup = d5OriginalScenePage();
 if (finished) return markup;
 const f = flows[flow], t = currentStep(), confirmed = heard && spoken;
 const counterpart = t.role || dgActiveScene(f, turn)?.role || activeRound().role || course.replyRole;
 const correct = choice >= 0 && accepted(t, choice);
 const result = choice < 0 ? 'pending' : correct ? 'correct' : 'wrong';
 const wrapper = document.createElement('div');
 wrapper.innerHTML = markup;
 // These IDs remain for the shared change handler's focus call, but completed
 // confirmations no longer offer a backwards route through the conversation.
 wrapper.querySelectorAll('.dg-repeat-confirm').forEach(region => {
  region.hidden = true;
  region.querySelectorAll('input').forEach(input => { input.disabled = true; input.tabIndex = -1; });
 });
 wrapper.querySelector('[data-act="back"]')?.remove();
 const speaker = wrapper.querySelector('.dg-speaker');
 if (confirmed && speaker) {
  speaker.className = 'panel dg-panel d5-dialogue-complete';
  speaker.innerHTML = `<p class="d5-complete-label">✓ 聽與說都完成了</p>
   <h2>接著，在地圖上做選擇</h2><p>依剛才的對話點選，看看路線或位置怎麼變。</p>
   <details class="d5-dialogue-recap"><summary>需要時，回看剛才的對話</summary>
    <p class="eyebrow">你說的這句</p><p class="en" lang="en">${esc(t.answer)}</p>
    <p class="eyebrow">${esc(counterpart)}說</p><p class="en" lang="en">${esc(t.line)}</p><p>${esc(t.zh)}</p>${audio(t.line)}
   </details>
   <div class="dg-flow-back">${btn('重新開始本任務', `data-start="${flow}"`, 'class="dg-quiet"')}</div>
   <input id="heard" type="checkbox" checked hidden disabled tabindex="-1">
   <input id="spoken" type="checkbox" checked hidden disabled tabindex="-1">`;
 }
 const board = wrapper.querySelector('.scene-board');
 if (board) {
  board.dataset.result = result;
  const heading = board.querySelector('.dg-role-row h2');
  heading.id = 'd5-scene-action'; heading.tabIndex = -1;
  heading.textContent = confirmed ? '換你操作，讓旅程往前走' : '城市小地圖 · 聽說完成後開放';
  const map = typeof d5MapMarkup === 'function' ? d5MapMarkup(f, t, {choice, confirmed, correct}) : '';
  if (map) {
   const holder = document.createElement('div'); holder.innerHTML = map;
   board.querySelector('.objects').replaceWith(...holder.childNodes);
  }
  board.querySelectorAll('[data-choice]').forEach((button, i) => {
   const index = Number(button.dataset.choice);
   button.classList.add('object');
   button.dataset.result = choice === index ? result : 'pending';
   button.setAttribute('aria-pressed', String(choice === index));
   button.disabled = !confirmed;
   // Plain text alternatives keep the same visible success/error vocabulary.
   if (!map && choice === index) button.querySelector('.dg-object-label').textContent = `${t.objects[index][1]} ${correct ? '✓ 選對了' : '✕ 再試一次'}`;
  });
  const feedbackBox = board.querySelector('#flowFeedback');
  feedbackBox.dataset.result = result;
  if (choice >= 0) feedbackBox.innerHTML = `<p class="feedback ${correct ? 'd5-correct' : 'retry'}"><strong>${correct ? '✓ 選對了' : '✕ 再試一次'}</strong><span>${esc(correct ? t.effect || '這個選擇符合剛才的對話，可以繼續。' : '這個選擇和剛才的對話不一樣。看看紅色標記，或展開剛才的對話重聽，再選一次。')}</span></p>`;
  board.querySelector('.dg-flow-actions [data-act="next"]').textContent = turn === f.steps.length - 1 ? '完成這段旅程 →' : '選好了，接著下一句 →';
 }
 const progress = document.createElement('div'); progress.innerHTML = d5FlowSteps(t, counterpart);
 wrapper.querySelector('.dg-flow-grid').before(progress.firstElementChild);
 return wrapper.innerHTML;
};
function d5FocusCurrentStage() {
 const target = finished ? $('#main .dg-completion h1, #main .dg-completion h2') : heard && spoken ? $('#d5-scene-action') : $('.dg-speaker .dg-task');
 if (!target) return;
 target.tabIndex = -1;
 target.focus({preventScroll: true});
 const rect = target.getBoundingClientRect(), inset = ($('.top')?.getBoundingClientRect().height || 0) + 18;
 if (rect.top < inset || rect.bottom > innerHeight - 48) window.scrollTo({top: Math.max(0, scrollY + rect.top - inset), behavior: 'instant'});
}
focusSceneStep = d5FocusCurrentStage;
// Registered after the shared handlers: their state update finishes first.
document.addEventListener('change', event => {
 if (page !== 2 || finished || !['heard', 'spoken'].includes(event.target.id)) return;
 stopAudio();
 d5FocusCurrentStage();
 const text = heard && spoken ? '聽與說已完成，現在可以操作地圖。' : $('.dg-speaker .dg-role')?.textContent;
 $('#dg-announcement').textContent = text || '輪到下一個角色。';
});
