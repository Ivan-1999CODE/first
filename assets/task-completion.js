// Shared Part 03 finish presentation. All answers, choices and saved progress
// still belong to the original ordinary / chapter / hotel practice engines.
(() => {
 'use strict';
 function completionFrame({steps,records,title,eyebrow,status,actions,note,result='',completionClass=''}){
  const ledger=document.createElement('div');
  ledger.innerHTML=result||`<div class="tc-result-summary"><ol class="scene-ledger">${records.map((r,i)=>`<li class="recorded"><span>${esc(steps[i]?.label||steps[i]?.task||'')}</span><strong>${esc(r.label)}</strong></li>`).join('')}</ol></div>`;
  const generic=ledger.querySelector('.generic-scene,.tc-result-summary'),last=records.at(-1);
  if(generic){
   generic.querySelectorAll(':scope > .scene-emblem,:scope > .eyebrow,:scope > h3').forEach(e=>e.remove());
   if(last)generic.insertAdjacentHTML('afterbegin',`<div class="tc-outcome-art" aria-hidden="true">${vfArt(last.artLabel||last.label,last.step)}</div>`);
  }
  const controls=document.createElement('div');controls.innerHTML=actions;
  controls.querySelectorAll('[data-page="3"],[data-ci-section="3"],[data-hi-page="3"]').forEach(b=>{b.classList.add('primary');b.textContent='前往 04｜看情境，自己選用 →';});
  return `<section class="tc-frame dg-completion ${completionClass}" aria-labelledby="tc-title">
   <header class="tc-header"><div><p class="tc-eyebrow">${esc(eyebrow)}</p><h2 id="tc-title" tabindex="-1">${esc(title)}</h2></div><p class="tc-status">${esc(status)}</p></header>
   <div class="tc-grid">
    <section class="tc-review" aria-labelledby="tc-review-title"><h2 id="tc-review-title">這次練過的說法</h2><ol class="tc-lines" aria-label="完成的任務與對應英文">${steps.map(s=>`<li><p class="tc-goal">${esc(s.label||s.task)}</p><p class="tc-answer" lang="en">${esc(s.answer)}</p></li>`).join('')}</ol></section>
    <section class="tc-result" aria-labelledby="tc-result-title"><h2 id="tc-result-title">這次完成的事</h2>${ledger.innerHTML}<details class="tc-steps"><summary>查看這輪的 ${records.length} 個步驟</summary><div class="vf-records vf-final">${records.map(r=>`<figure>${vfArt(r.artLabel||r.label,r.step)}<figcaption>${esc(r.label)}</figcaption></figure>`).join('')}</div></details></section>
   </div>
   <footer class="tc-footer"><div class="tc-next"><p>接下來，試著自己選用學過的句子。</p><p class="fine">${esc(note)}</p></div><div class="actions">${controls.innerHTML}</div></footer>
  </section>`;
 }
 const previousScenePage=scenePage;
 scenePage=function(){
  const markup=previousScenePage();
  if(page!==2||!finished)return markup;
  const box=document.createElement('div');box.innerHTML=markup;
  // Day 2's multi-scene tasks already use the approved shared frame and keep
  // their own next-unpracticed-scene actions, focus and completion counter.
  if(box.querySelector('.d2-practice-multi'))return markup;
  const completed=box.querySelector('.dg-completion');
  if(!completed)return markup;
  const f=flows[flow],round=activeRound();
  const scene=typeof day2Practice==='object'?day2Practice.scenes.find(s=>s.id===box.querySelector('[data-d2-active]')?.dataset.d2Active):null;
  const begin=scene?.start||0,end=scene?scene.end+1:f.steps.length;
  const steps=f.steps.map((_,i)=>lessonStep(f,i,id=>history[f.steps.findIndex(s=>s.id===id)])).slice(begin,end);
  const records=vfHistory({...f,steps},history.slice(begin,end));
  const result=completed.querySelector(':scope > section:last-child');
  result?.querySelectorAll(':scope > .vf-final,:scope > h2').forEach(e=>e.remove());
  const multiple=round.flowIds.length>1;
  const scope=multiple?'情境':'任務';
  const eyebrow='目前任務 · '+taskLabel(round)+(multiple?`｜情境 ${round.flowIds.indexOf(flow)+1} / ${round.flowIds.length}`:'');
  const actions=btn('再練這個'+scope,scene?'data-d2-restart':`data-start="${flow}"`)+btn('前往 04｜看情境，自己選用 →','data-page="3"','class="primary"');
  completed.outerHTML=completionFrame({steps,records,title:round.name,eyebrow,status:'✓ 這個'+scope+'已練習',actions,result:result?.innerHTML||'',note:'完成標記會保留；是否熟悉，仍由師生一起確認。'});
  // A single-scene task needs no second overview above its completion header.
  if(scene)box.querySelector('.d2-practice-picker')?.remove();
  return box.innerHTML;
 };
 if(typeof integratedCompletion==='function'){
  integratedCompletion=function({steps,records,title,heading,actions,note,result='',completionClass='ci-complete'}){
   return completionFrame({steps,records,title,eyebrow:'目前情境 · 綜合練習',status:heading,actions,note,result,completionClass});
  };
 }
 const previousRender=render;
 render=function(){
  previousRender();
  if(!document.querySelector('#main .tc-frame'))return;
  // Keep one clear next-section action in the shared footer, including the
  // independent chapter and hotel engines. Their previous-section links stay.
  document.querySelectorAll('#main .footer-actions [data-page="3"],#main .footer-actions [data-ci-section="3"],#main .footer-actions [data-hi-page="3"]').forEach(b=>b.remove());
 };
})();
