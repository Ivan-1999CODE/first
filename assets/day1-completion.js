// Day 1, Part 03: present a completed ordinary task as one shared frame.
// Keep practice, integration paths, curriculum, state and delegated controls intact.
(() => {
 'use strict';
 const previousScenePage=scenePage,previousFooter=focusFooter;
 scenePage=function(){
  if(page!==2||!finished)return previousScenePage();
  const round=currentRound(),f=flows[flow];
  const goals=pairs[round.pairIds[0]].goals.map(goal=>goal.replace(/^在得到/,'得到').replace('請老師再說一次','請他人再說一次').replace('請老師在地圖指出來','請他人在地圖中指出來'));
  const steps=f.steps.map((_,i)=>lessonStep(f,i,id=>history[f.steps.findIndex(s=>s.id===id)]));
  const records=vfHistory({...f,steps},history);
  const map=document.createElement('div');map.innerHTML=dgMap(f,history,true);
  // The shared header owns the completion status; the map shows the route only.
  map.querySelector('.dg-map-status')?.remove();
  return `<section class="d1-completion-frame dg-completion" aria-labelledby="d1-completion-title">
   <header class="d1-completion-header"><div><p class="d1-completion-eyebrow">目前任務 · ${esc(round.id)}</p><h1 id="d1-completion-title" tabindex="-1">${esc(round.name)}</h1></div><p class="d1-completion-status">✓ 這個任務已練習</p></header>
   <div class="d1-completion-grid">
    <section class="d1-completion-review" aria-labelledby="d1-review-title"><h2 id="d1-review-title">這次練過的說法</h2><ol class="d1-completion-lines" aria-label="完成的任務與對應英文">${steps.map((s,i)=>`<li><p class="d1-completion-goal">${esc(goals[i]||s.task)}</p><p class="d1-completion-answer" lang="en">${esc(s.answer)}</p></li>`).join('')}</ol></section>
    <section class="d1-completion-result" aria-labelledby="d1-result-title"><h2 id="d1-result-title">這次走出的路線</h2>${map.innerHTML}<details class="d1-completion-steps"><summary>查看這輪的 ${records.length} 個步驟</summary><div class="vf-records vf-final">${records.map(x=>`<figure>${vfArt(x.label,x.step)}<figcaption>${esc(x.label)}</figcaption></figure>`).join('')}</div></details></section>
   </div>
   <footer class="d1-completion-footer"><div class="d1-completion-next"><p>接下來，試著自己選用學過的句子。</p><p class="fine">完成標記會保留；是否熟悉，仍由師生一起確認。</p></div><div class="actions">${btn('再練這個任務',`data-start="${focusRound}"`)}${btn('前往 04｜看情境，自己選用 →','data-page="3"','class="primary"')}</div></footer>
  </section>`;
 };
 focusFooter=function(){
  const markup=previousFooter();
  if(page!==2||!finished)return markup;
  const box=document.createElement('div');box.innerHTML=markup;
  box.querySelectorAll('[data-page="3"]').forEach(button=>button.remove());
  return box.innerHTML;
 };
})();
