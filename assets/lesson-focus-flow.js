// Day 1 and Days 2–11 share the Day 5 handoff and choice feedback, while
// retaining each lesson's actual scene, branches, prelude and accepted choices.
const focusBaseScenePage = scenePage;
function focusChoiceState(board, buttons, selected, correct) {
 const result = selected < 0 ? 'pending' : correct ? 'correct' : 'wrong';
 board.dataset.result = result;
 buttons.forEach(button => { button.dataset.result = Number(button.dataset.choice ?? button.dataset.dgPreludeChoice) === selected ? result : 'pending'; });
 return result;
}
scenePage = function() {
 const markup = focusBaseScenePage();
 if (finished) return markup;
 const wrapper = document.createElement('div'); wrapper.innerHTML = markup;
 const board = wrapper.querySelector('.scene-board');
 if (!board) return markup;
 // The first lesson begins with a listening-and-pointing task, not a spoken reply.
 if (wrapper.querySelector('[data-dg-prelude-heard]')) {
  const result = focusChoiceState(board, Array.from(board.querySelectorAll('[data-dg-prelude-choice]')), dgPrelude.choice ?? -1, dgPrelude.choice === flows[flow].prelude.correct);
  const feedback = board.querySelector('.dg-feedback');
  feedback.id = 'flowFeedback'; feedback.dataset.result = result;
  if (result !== 'pending') feedback.innerHTML = `<p class="feedback ${result === 'wrong' ? 'retry' : ''}">${esc(feedback.textContent)}</p>`;
  return wrapper.innerHTML;
 }
 const t = currentStep(), f = flows[flow], confirmed = heard && spoken;
 const r = typeof activeRound === 'function' ? activeRound() : currentRound();
 const counterpart = t.role || (typeof dgActiveScene === 'function' ? dgActiveScene(f, turn)?.role : '') || r.role || course.replyRole;
 wrapper.querySelectorAll('.dg-repeat-confirm').forEach(region => {
  region.hidden = true;
  region.querySelectorAll('input').forEach(input => { input.disabled = true; input.tabIndex = -1; });
 });
 wrapper.querySelector('[data-act="back"]')?.remove();
 const speaker = wrapper.querySelector('.dg-speaker');
 if (confirmed && speaker) {
  speaker.className = 'panel dg-panel d5-dialogue-complete';
  speaker.innerHTML = `<p class="d5-complete-label">✓ 聽與說都完成了</p>
   <h2>接著，點選符合情境的選項</h2><p>依剛才的對話做選擇，確認你聽懂的意思。</p>
   <details class="d5-dialogue-recap"><summary>需要時，回看剛才的對話</summary>
    <p class="eyebrow">你說的這句</p><p class="en" lang="en">${esc(t.answer)}</p><p>${esc(t.answerZh || '')}</p>
    <p class="eyebrow">${esc(counterpart)}說</p><p class="en" lang="en">${esc(t.line)}</p><p>${esc(t.zh)}</p>${audio(t.line)}
   </details><div class="dg-flow-back">${btn('重新開始本任務', `data-start="${flow}"`, 'class="dg-quiet"')}</div>
   <input id="heard" type="checkbox" checked hidden disabled tabindex="-1"><input id="spoken" type="checkbox" checked hidden disabled tabindex="-1">`;
 }
 const correct = choice >= 0 && accepted(t, choice);
 const result = focusChoiceState(board, Array.from(board.querySelectorAll('[data-choice]')), choice, correct);
 const feedbackBox = board.querySelector('#flowFeedback');
 if (feedbackBox) {
  feedbackBox.dataset.result = result;
  if (choice >= 0) feedbackBox.innerHTML = `<p class="feedback ${correct ? '' : 'retry'}"><strong>${correct ? '✓ 選對了' : '✕ 再試一次'}</strong><span>${esc(feedback || (correct ? t.effect : '和剛才的對話不一樣，再聽一次或看文字後重選。'))}</span></p>`;
 }
 const heading = board.querySelector('.dg-role-row h2');
 if (heading) { heading.id = 'focus-scene-action'; heading.tabIndex = -1; }
 const stage = confirmed ? 2 : (t.askFirst ? spoken : heard) ? 1 : 0;
 const roles = t.askFirst ? ['你先說', `聽${counterpart}回覆`] : [`先聽${counterpart}`, '換你回答'];
 wrapper.querySelector('.scene-grid').insertAdjacentHTML('beforebegin', `<ol class="d5-flow-steps" aria-label="這一句的練習順序">${[...roles, '情境操作'].map((label,i)=>`<li class="${i<stage?'done':''}" ${i===stage?'aria-current="step"':''}><span aria-hidden="true">${i<stage?'✓':i+1}</span>${esc(label)}</li>`).join('')}</ol>`);
 return wrapper.innerHTML;
};
const focusBaseSceneStep = focusSceneStep;
function focusCurrentPracticeStage() {
 if (page === 7) { focusBaseSceneStep(); return; }
 const target = finished ? $('#main .dg-completion h1, #main .dg-completion h2') : heard && spoken ? $('#focus-scene-action') : $('.dg-speaker .dg-task');
 if (!target) return;
 target.tabIndex = -1; target.focus({preventScroll: true});
 const rect = target.getBoundingClientRect(), inset = ($('.top')?.getBoundingClientRect().height || 0) + 18;
 if (rect.top < inset || rect.bottom > innerHeight - 48) window.scrollTo({top: Math.max(0, scrollY + rect.top - inset), behavior: 'instant'});
}
focusSceneStep = focusCurrentPracticeStage;
document.addEventListener('change', event => {
 if (page !== 2 || finished || !['heard', 'spoken'].includes(event.target.id)) return;
 stopAudio(); focusCurrentPracticeStage();
 $('#dg-announcement').textContent = heard && spoken ? '聽與說已完成，現在可以做情境操作。' : $('.dg-speaker .dg-role')?.textContent || '輪到下一個角色。';
});
