// Day 2 pilot: bounded scenes share the existing listening/speaking gates,
// image actions and retry engine. Canonical lesson data is never sliced/mutated.
(() => {
 'use strict';
 const data=day2Practice, scenes=data.scenes;
 const baseCurrentStep=currentStep;
 currentStep=function(){
  const step=baseCurrentStep();
  return page===2?vfPracticeDialogue(step):step;
 };
 d5SectionIntros[2]=['先分開練，再連起來', '先練一個小情境，再到下方把任務串成完整購物。'];
 const byId=id=>scenes.find(s=>s.id===id);
 const forTask=()=>scenes.filter(s=>s.taskId===activeRound().id);
 const selected=new Map(), memory=new Map();
 let active=null, complete=[], failed=false;
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
  return `<section class="panel d2-practice-picker" aria-labelledby="d2-practice-title">
   <div class="d2-practice-heading"><div><p class="eyebrow">先分開練</p><h2 id="d2-practice-title">${list.length>1?'一次練一個小情境':'先把這件事練熟'}</h2></div><span class="fine">${list.filter(s=>complete.includes(s.id)).length} / ${list.length} 個已練習</span></div>
   <nav class="d2-scene-tabs" aria-label="這個任務的小情境">${list.map((s,i)=>btn(`<span class="d2-scene-number">${i+1}</span><span>${esc(s.title)}${complete.includes(s.id)?'<small>✓ 已練習</small>':''}</span>`,`data-d2-scene="${s.id}"`,`aria-pressed="${s.id===active.id}"`)).join('')}</nav>
   <div class="d2-practice-context"><h3>${esc(active.title)}</h3><p>${esc(active.context)}</p><p class="fine">${finished?'這個小情境已完成':`對話 ${turn-active.start+1} / ${active.end-active.start+1}`} · ${list.length>1?'切換情境可保留這次練習進度。':'說明預算和詢問替代品，連著練。'}</p></div>
   <p class="notice" role="status" ${failed?'':'hidden'}>目前無法保存小情境的完成紀錄，仍可繼續練習。</p>
  </section>`;
 }
 function integration(){
  return `<section class="panel d2-integration" aria-labelledby="d2-integration-title"><p class="eyebrow">再整合</p><h2 id="d2-integration-title">連起來，完成一筆購物</h2><p>小情境熟悉後，選一筆購物從頭練到結帳。每次只走一條路線，商品與金額一路沿用。</p><div class="d2-integration-cards">${data.integrated.map(g=>btn(`<span class="d2-integration-source">任務 ${esc(g.sources)}</span><strong>${esc(g.title)}</strong><span>${esc(g.description)}</span><span class="d2-integration-link">開始整合練習 →</span>`,`data-ci-group="${g.id}"`)).join('')}</div></section>`;
 }
 function completion(){
  const list=forTask(),nextScene=list[list.indexOf(active)+1],f=flows[flow];
  return `<section class="panel dg-completion d2-completion"><p class="dg-role">✓ 這個小情境已練習</p><h1>${esc(active.outcome)}</h1><p>可以重練、換另一個小情境，或到下方試完整購物。</p><details><summary>回看這次用過的句子</summary>${f.steps.slice(active.start,active.end+1).map(s=>`<p class="en" lang="en">${esc(s.answer)}</p><p>${esc(s.answerZh)}</p>`).join('')}</details><div class="actions">${btn('重練這個小情境','data-d2-restart')}${nextScene?btn('下一個小情境：'+esc(nextScene.title)+' →',`data-d2-scene="${nextScene.id}"`,'class="primary"'):''}</div><p class="fine">完成標記表示做過練習；口說熟悉程度由師生一起確認。</p></section>`;
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
  return `<div class="d2-practice" data-d2-active="${active.id}">${picker()}${content}${integration()}</div>`;
 };
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.d2Scene){const s=byId(b.dataset.d2Scene);if(s?.taskId===activeRound().id){switchScene(s);document.querySelector(`[data-d2-scene="${s.id}"]`)?.focus({preventScroll:true});}}
  if(b.hasAttribute('data-d2-restart')){switchScene(active,true);focusSceneStep();}
 });
 activate(forTask()[0]);
})();
