// The rescue board reflects only accepted choices in the current conversation.
// Use the same speaking/listening card palette as the other lessons.
document.body.classList.add('lesson-focus');
document.documentElement.setAttribute('data-lesson-focus','');
function rescueBoard(){
 const r=activeRound(),f=flows[flow];
 const completed=f.steps.flatMap((s,i)=>history[i]!==undefined&&accepted(s,history[i])?[s]:[]);
 return `<section class="rescue-board" aria-label="${esc(r.rescue.title)}"><header><span aria-hidden="true">${r.rescue.icon}</span><div><p class="eyebrow">${esc(r.rescue.title)}</p><h3>${esc(r.rescue.start)}</h3></div></header>
  <ol>${f.steps.map((s,i)=>`<li class="${completed.includes(s)?'resolved':''}"><span aria-hidden="true">${completed.includes(s)?'✓':i+1}</span><div><strong>${esc(s.label)}</strong><p>${esc(completed.includes(s)?s.result:'等待你開口、聽懂，再確認資訊。')}</p></div></li>`).join('')}</ol>
  ${finished?`<p class="rescue-result"><strong>下一步已清楚</strong><br>${esc(r.rescue.outcome)}</p>`:''}</section>`;
}
const rescueBaseScene=scenePage;
scenePage=function(){
 const box=document.createElement('div');box.innerHTML=rescueBaseScene();
 if(finished){const panel=box.querySelector('.dg-completion > section:last-child');panel.innerHTML=rescueBoard();}
 else {
  box.querySelector('.dg-scene-progress')?.remove();
  const resolved=flows[flow].steps.filter((s,i)=>history[i]!==undefined&&accepted(s,history[i]));
  box.querySelector('.objects').insertAdjacentHTML('beforebegin',`<div class="rescue-current"><strong>${resolved.length?'已確認的最新資訊':'這次要辦成的事'}</strong><p>${esc(resolved.at(-1)?.result||activeRound().goal)}</p></div><details class="rescue-progress"><summary>查看完整處理卡 · ${resolved.length} / ${flows[flow].steps.length}</summary>${rescueBoard()}</details>`);
 }
 return box.innerHTML;
};
intro=function(){
 const r=activeRound(),c=r.entryCheckpoint;
 return `<section class="dg-lesson-cover"><div class="dg-cover-copy"><p class="eyebrow">${esc(course.dayLabel)}</p><h1 id="dg-lesson-title">${esc(course.title)}</h1><p>先說問題，再問辦法，最後確認。<br>一次解決一件事，帶著提示也能開口。</p></div><div class="dg-cover-art dg-course-art">${course.art}</div></section>
  <section class="panel dg-panel dg-task-panel before-panel dg-quick-start"><p class="dg-role">你先試一句 · 任務 ${taskLabel(r)}</p><h2>${esc(r.name)}</h2><p class="task">${esc(c.task)}</p>${field('entry-before-'+r.id,'第一次的嘗試（選填）')}<p class="fine">先用自己的英文說，單字也可以。⑥ 會回到同一道題。</p></section>
  <section class="rescue-missions"><h2>今天，處理哪一個狀況？</h2><p>三個任務可以分堂練；每個都有自己的七部分與作答紀錄。</p><div class="rescue-cards">${rounds.map((item,i)=>`<section class="panel ${i===taskRound?'rescue-selected':''}"><p class="eyebrow">任務 ${taskLabel(item)}${roundsDone.includes(item.id)?' · ✓ 已確認熟悉':''}</p><h3>${esc(item.name)}</h3><p>${esc(item.goal)}</p>${btn(i===taskRound?'正在練這個任務':'換成這個任務',`data-before-round="${i}"`,`aria-pressed="${i===taskRound}"`)}</section>`).join('')}</div></section>
  <details class="panel"><summary>老師看：怎麼帶得更像旅行？</summary><p>② 先教這個任務的句子和回話，③ 用同一組對話更新求助卡，④ 看情境，自己選用，⑤ 收起句子和真人接話。每次只完成一個任務也可以。</p><p>⑤ 可先讓學生只看中文任務，老師按實際提問接話，不要求逐字背誦。若學生提早說出資訊，略過重複問題；最後請學生口頭說清楚下一步。</p>${btn('這個任務已學過，直接和老師練 →','data-page="4"')}</details>
  ${dgLessonInventory()}`;
};
const rescueBaseRender=render;
render=function(){
 rescueBaseRender();
 const main=$('#main');
 // Part 03 uses the shared speaking card and focus cue.
 if(page!==2)main.querySelectorAll('.dg-speaker:not(.dg-listener)').forEach(panel=>{
  panel.classList.add('rescue-speaking');
  panel.querySelector('.dg-role-row').insertAdjacentHTML('afterend','<p class="speaking-cue">↓ 看這裡，換你說</p>');
 });
 main.insertAdjacentHTML('beforeend',`<details class="panel rescue-toolkit"><summary>卡住時，帶著這 3 句</summary><div class="rescue-cards">${[
  ['Excuse me. Could you help me?','不好意思，可以幫我嗎？'],
  ['Could you say that again, please?','可以請你再說一次嗎？'],
  ['Could you write that down, please?','可以請你寫下來嗎？']
 ].map(([en,zh])=>`<section><p class="en" lang="en">${en}</p><p>${zh}</p>${audio(en)}</section>`).join('')}</div></details>`);
};
