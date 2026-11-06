// Presentation only: callers supply the completed route and its actual results.
// No lesson answers, progress or storage are changed here.
function integratedCompletion({steps,records,title,heading,actions,note,result='',completionClass='ci-complete'}){
 const review=`<div class="lesson-completion-summary">
  <ol class="lesson-completion-goals" aria-label="完成的任務">${steps.map(s=>`<li>${esc(s.label||s.task)}</li>`).join('')}</ol>
  <div class="lesson-completion-answers"><ol class="lesson-completion-english" aria-label="對應的英文句子">${steps.map(s=>`<li lang="en">${esc(s.answer)}</li>`).join('')}</ol></div>
 </div>`;
 const ledger=result||`<div class="scene-state generic-scene"><p class="eyebrow">✓ 已完成這次任務</p><h3>${esc(title)}</h3><ol class="scene-ledger">${records.map((r,i)=>`<li class="recorded"><span>${esc(steps[i].label||steps[i].task)}</span><strong>${esc(r.label)}</strong></li>`).join('')}</ol></div>`;
 return `<div class="dg-grid dg-completion integrated-completion">
  <section class="panel dg-panel ${completionClass}"><h2>${esc(heading)}</h2>${review}<p class="fine">${esc(note)}</p><div class="actions">${actions}</div></section>
  <section class="panel dg-panel integrated-completion-results" aria-label="這次的練習圖示與結果">
   <div class="vf-records vf-final">${records.map(r=>`<figure>${vfArt(r.artLabel||r.label,r.step)}<figcaption>${esc(r.label)}</figcaption></figure>`).join('')}</div>
   <h2>這次完成的事</h2>${ledger}
  </section>
 </div>`;
}
