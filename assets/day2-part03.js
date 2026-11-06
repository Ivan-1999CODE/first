// Day 2 pilot: bounded scenes share the existing listening/speaking gates,
// image actions and retry engine. Canonical lesson data is never sliced/mutated.
function d2CompletionResult(steps,values,title,compact=false){
 const completed={generic:true,steps,sceneTitle:title,sceneIcon:'🛍'};
 const records=vfHistory(completed,values),last=records.at(-1);
 if(compact)return `<section class="panel dg-panel d2-completion-result" aria-labelledby="d2-result-title">
  <h3 id="d2-result-title">這次完成的事</h3><div class="d2-result-summary">${last?`<div class="d2-outcome-art" aria-hidden="true">${vfArt(last.label,last.step)}</div>`:''}<ol class="scene-ledger">${steps.map((s,i)=>`<li class="recorded"><span>${esc(s.label||'第 '+(i+1)+' 步')}</span><strong>${esc(s.objects[values[i]]?.[1]||'待確認')}</strong></li>`).join('')}</ol></div>
  <details class="d2-result-steps"><summary>查看這輪的 ${steps.length} 個步驟</summary><div class="vf-records vf-final">${vfHistory(completed,values).map(x=>`<figure>${vfArt(x.label,x.step)}<figcaption>${esc(x.label)}</figcaption></figure>`).join('')}</div></details>
 </section>`;
 return `<section class="panel dg-panel d2-completion-result" aria-label="這次的練習圖示與結果">
  <div class="vf-records vf-final">${vfHistory(completed,values).map(x=>`<figure>${vfArt(x.label,x.step)}<figcaption>${esc(x.label)}</figcaption></figure>`).join('')}</div>
  <h2>這次完成的事</h2>${lessonScene(completed,values,true)}
 </section>`;
}

(() => {
 'use strict';
 const data=day2Practice, scenes=data.scenes;
 const baseCurrentStep=currentStep;
 currentStep=function(){
  const step=baseCurrentStep();
  return page===2?vfPracticeDialogue(step):step;
 };
 d5SectionIntros[2]=['練好這個購物任務', '一次練一個小情境，聽懂、開口，再動手完成。'];
 const byId=id=>scenes.find(s=>s.id===id);
 const forTask=()=>scenes.filter(s=>s.taskId===activeRound().id);
 const selected=new Map(), memory=new Map();
 let active=null, complete=[], failed=false;
 vfReviewStart=()=>active?.start??0;
 try {
  const raw=JSON.parse(localStorage.getItem(data.storageKey)||'{}');
  if(Array.isArray(raw?.complete))complete=raw.complete.filter(id=>byId(id));
 } catch { failed=true; }
 function saveCompletion(){
  try{localStorage.setItem(data.storageKey,JSON.stringify({complete}));failed=false;}
  catch{failed=true;}
 }
 function remember(){
  if(!active||flows[flow]?.id!==active.flowId)return;
  memory.set(active.id,{turn,history:[...history],heard,spoken,choice,feedback,finished,
   quantity:vfQuantityDraft?{...vfQuantityDraft}:null});
 }
 function activate(s,restart=false){
  stopAudio();dgResetSupport();
  active=s;selected.set(s.taskId,s.id);flow=flows.findIndex(f=>f.id===s.flowId);
  const saved=restart?null:memory.get(s.id);
  turn=saved?.turn??s.start;history=saved?[...saved.history]:[];
  resetTurn();heard=saved?.heard??false;spoken=saved?.spoken??false;
  choice=saved?.choice??-1;feedback=saved?.feedback??'';finished=saved?.finished??false;
  vfQuantityDraft=saved?.quantity?{...saved.quantity}:null;
  remember();
 }
 function switchScene(s,restart=false){remember();activate(s,restart);navigate(2);}
 const baseSetTaskRound=setTaskRound;
 setTaskRound=function(n){
  if(!Number.isInteger(n)||!rounds[n])return;
  remember();baseSetTaskRound(n);
  activate(byId(selected.get(activeRound().id))||forTask()[0]);
 };
 const baseStart=start;
 start=function(i){
  const s=scenes.find(s=>s.flowId===flows[i]?.id);
  if(!s)return baseStart(i);
  const n=rounds.findIndex(r=>r.id===s.taskId);
  if(n!==taskRound){setTaskRound(n);persistRound();}
  switchScene(s,true);
 };
 const baseNext=next,baseBack=back,baseScenePage=scenePage;
 next=function(){
  if(!active||page!==2)return baseNext();
  if(!canNext())return;
  if(turn<active.end)return baseNext();
  stopAudio();finished=true;history[turn]=choice;
  if(!complete.includes(active.id))complete.push(active.id);
  saveCompletion();render();focusSceneStep();
 };
 back=function(){
  if(active&&page===2&&turn<=active.start)return;
  baseBack();
 };
 function picker(){
  const list=forTask();
  if(list.length>1)return `<section class="panel d2-practice-picker" aria-labelledby="d2-practice-title">
   <div class="d2-practice-heading"><h2 id="d2-practice-title">分開練<span aria-hidden="true">｜</span>小情境總覽</h2><p class="d2-total-progress">已練習 <strong>${list.filter(s=>complete.includes(s.id)).length} / ${list.length}</strong></p></div>
   <nav class="d2-scene-tabs" aria-label="這個任務的小情境">${list.map((s,i)=>btn(`<span class="d2-scene-number" aria-hidden="true">${i+1}</span><span class="d2-scene-copy">${esc(s.title)}<small data-d2-complete="${complete.includes(s.id)}">${complete.includes(s.id)?'✓ 已練習':'待練習'}${s.id===active.id?' · 目前查看':''}</small></span>`,`data-d2-scene="${s.id}"`,`aria-pressed="${s.id===active.id}" aria-controls="d2-scene-content"`)).join('')}</nav>
   <p class="notice" role="status" ${failed?'':'hidden'}>目前無法保存小情境的完成紀錄，仍可繼續練習。</p>
  </section>`;
  return `<section class="panel d2-practice-picker" aria-labelledby="d2-practice-title">
   <div class="d2-practice-heading"><div><p class="eyebrow">先分開練</p><h2 id="d2-practice-title">${list.length>1?'一次練一個小情境':'先把這件事練熟'}</h2></div><span class="fine">${list.filter(s=>complete.includes(s.id)).length} / ${list.length} 個已練習</span></div>
   <nav class="d2-scene-tabs" aria-label="這個任務的小情境">${list.map((s,i)=>btn(`<span class="d2-scene-number">${i+1}</span><span>${esc(s.title)}${complete.includes(s.id)?'<small>✓ 已練習</small>':''}</span>`,`data-d2-scene="${s.id}"`,`aria-pressed="${s.id===active.id}"`)).join('')}</nav>
   <div class="d2-practice-context"><h3>${esc(active.title)}</h3><p>${esc(active.context)}</p><p class="fine">${finished?'這個小情境已完成':`對話 ${turn-active.start+1} / ${active.end-active.start+1}`} · ${list.length>1?'切換情境可保留這次練習進度。':'說明預算和詢問替代品，連著練。'}</p></div>
   <p class="notice" role="status" ${failed?'':'hidden'}>目前無法保存小情境的完成紀錄，仍可繼續練習。</p>
  </section>`;
 }
 function completion(){
  const list=forTask(),nextScene=list[list.indexOf(active)+1],f=flows[flow];
  const resolved=f.steps.slice(active.start,active.end+1).map((_,i)=>lessonStep(f,active.start+i,id=>history[f.steps.findIndex(s=>s.id===id)]));
  if(list.length>1)return `<div class="dg-grid dg-completion d2-completion"><section class="panel dg-panel d2-completion-review" aria-labelledby="d2-review-title"><h3 id="d2-review-title">這次練過的說法</h3><ol class="d2-completion-lines" aria-label="完成的任務與對應英文">${resolved.map(s=>`<li><p data-d2-review-goal>${esc(s.label||s.task)}</p><p data-d2-review-answer lang="en">${esc(s.answer)}</p></li>`).join('')}</ol></section>${d2CompletionResult(resolved,history.slice(active.start,active.end+1),active.title,true)}</div>`;
  return `<div class="dg-grid dg-completion d2-completion"><section class="panel dg-panel"><h1 class="dg-role">✓ 這個小情境已練習</h1>${dgCompletionReview(resolved)}<div class="actions">${btn('重練這個小情境','data-d2-restart')}${nextScene?btn('下一個小情境：'+esc(nextScene.title)+' →',`data-d2-scene="${nextScene.id}"`,'class="primary"'):''}</div><p class="fine">完成標記表示做過練習；口說熟悉程度由師生一起確認。</p></section>${d2CompletionResult(resolved,history.slice(active.start,active.end+1),active.title)}</div>`;
 }
 function nextUnpracticed(){
  const list=forTask(),index=list.indexOf(active);
  return [...list.slice(index+1),...list.slice(0,index)].find(s=>!complete.includes(s.id));
 }
 function sceneFrame(content){
  const list=forTask(),remaining=list.filter(s=>!complete.includes(s.id)).length,nextScene=nextUnpracticed();
  return `<section id="d2-scene-content" class="d2-scene-frame" aria-labelledby="d2-active-title">
   <header class="d2-scene-header"><div><p class="eyebrow">目前的小情境 · ${list.indexOf(active)+1} / ${list.length}</p><h2 id="d2-active-title" tabindex="-1">${esc(active.title)}</h2></div><p class="d2-scene-status ${finished?'is-complete':''}">${finished?'✓ 這個小情境已練習':`練習中 · 對話 ${turn-active.start+1} / ${active.end-active.start+1}`}</p></header>
   ${finished?'':`<p class="d2-active-context">${esc(active.context)}</p>`}${content}
   ${finished?`<footer class="d2-scene-footer"><p>${remaining?`還有 ${remaining} 個小情境待練習`:`這個任務的 ${list.length} 個小情境都已練習`}</p><div class="actions">${btn('再練這個情境','data-d2-restart')}${nextScene?btn('下一個：'+esc(nextScene.title)+' →',`data-d2-scene="${nextScene.id}"`,'class="primary"'):btn('前往 04｜看情境，自己選用 →','data-page="3"','class="primary"')}</div><p class="fine">完成標記表示做過練習；口說熟悉程度由師生一起確認。</p></footer>`:''}
  </section>${!finished||remaining?`<div class="d2-section-link">${btn('前往 04｜看情境，自己選用 →','data-page="3"','class="dg-quiet"')}</div>`:''}`;
 }
 scenePage=function(){
  if(!active||active.taskId!==activeRound().id)activate(byId(selected.get(activeRound().id))||forTask()[0]);
  remember();
  let content;
  if(finished)content=completion();
  else{
   const box=document.createElement('div');box.innerHTML=baseScenePage();
   box.querySelectorAll(':scope > .tabs').forEach(el=>el.remove());
   box.querySelectorAll('[data-start]').forEach(el=>{el.removeAttribute('data-start');el.setAttribute('data-d2-restart','');el.textContent='重練這個小情境';});
   box.querySelectorAll('[data-act="next"]').forEach(el=>{el.textContent=turn===active.end?'完成這個小情境 →':'接著，說下一句 →';});
   box.querySelectorAll('[data-act="back"]').forEach(el=>{el.disabled=turn===active.start;});
   const count=box.querySelector('.dg-speaker .dg-role-row .fine');
   if(count)count.textContent=`對話 ${turn-active.start+1} / ${active.end-active.start+1}`;
   content=box.innerHTML;
  }
  const multi=forTask().length>1;
  return `<div class="d2-practice${multi?' d2-practice-multi':''}" data-d2-active="${active.id}">${picker()}${multi?sceneFrame(content):content}</div>`;
 };
 const baseFocusSceneStep=focusSceneStep;
 function focusActiveScene(){
  const title=document.querySelector('#d2-active-title');
  if(title){title.focus({preventScroll:true});const rect=title.getBoundingClientRect(),inset=dgStickyHeight()+18;if(rect.top<inset||rect.bottom>innerHeight-48)window.scrollTo({top:Math.max(0,scrollY+rect.top-inset),behavior:'instant'});}
 }
 focusSceneStep=function(){
  if(page!==2||!finished||forTask().length<2)return baseFocusSceneStep();
  focusActiveScene();
 };
 const baseTaskFooter=taskFooter;
 taskFooter=function(){
  if(page===2&&forTask().length>1)return `<div class="footer-actions dg-section-footer">${btn('← 上一部分','data-page="1"')}</div>`;
  return baseTaskFooter();
 };
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.d2Scene){const s=byId(b.dataset.d2Scene);if(s?.taskId===activeRound().id){const fromPicker=!!b.closest('.d2-scene-tabs');switchScene(s);if(fromPicker)document.querySelector(`.d2-scene-tabs [data-d2-scene="${s.id}"]`)?.focus({preventScroll:true});else focusActiveScene();}}
  if(b.hasAttribute('data-d2-restart')){switchScene(active,true);focusSceneStep();}
 });
 activate(forTask()[0]);
})();
