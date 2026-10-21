// Read-only rehearsal: derive the actual speaker order from the authored steps.
// It shares the existing audio controls and does not change learning records.
function dialoguePreview({steps,role,task,title='對話怎麼接？先照順序看一遍',className='micro-example',prelude,kind='primary'}){
 const lang=typeof language==='string'?language:'en';
 let number=0;
 const turn=(speaker,text,zh,speakerRole=role)=>{
  const n=++number,who=speaker==='self'?'我 · 旅客':speakerRole;
  return `<li class="micro-turn" data-speaker="${speaker}"><div class="micro-turn-label"><span class="micro-turn-number">${n}</span><strong>${esc(who)}</strong></div><p class="en" lang="${lang}">${esc(text)}</p><p class="micro-turn-meaning">${esc(zh)}</p>${lang!=='en'&&typeof reading==='function'?reading(text):''}${audio(text)}</li>`;
 };
 let opening='';
 if(prelude){
  opening=`<div class="micro-dialogue micro-prelude"><ol class="micro-turns">${turn('other',prelude.line,prelude.zh)}<li class="micro-turn micro-turn-action" data-speaker="action"><div class="micro-turn-label"><span class="micro-turn-number">${++number}</span><strong>我 · 指出目的地</strong></div><p>${esc(prelude.task)}</p></li></ol></div>`;
 }
 const dialogue=steps.map((s,i)=>{
  const start=number+1;
  const self=()=>turn('self',s.answer,s.answerZh),other=()=>turn('other',s.line,s.zh,s.role||role);
  const scene=s.sceneTitle||s.sceneContext?`<header class="dialogue-scene"><h3>${esc(s.sceneTitle||'接著練習')}</h3>${s.sceneContext?`<p>${esc(s.sceneContext)}</p>`:''}${s.role?`<p class="fine">我與${esc(s.role)}接話</p>`:''}</header>`:'';
  return `${scene}<div class="micro-dialogue" data-exchange="${i}"${s.sourceTaskId?` data-source-task="${esc(s.sourceTaskId)}"`:''}><ol class="micro-turns" start="${start}">${s.askFirst?self()+other():other()+self()}</ol></div>`;
 }).join('');
 return `<section class="panel dialogue-preview ${className}" data-example-kind="${kind}"><p class="eyebrow">本輪對話示範 · 按順序接話</p><h2>${esc(title)}</h2><p class="micro-example-context">${esc(task)}</p>${opening}${dialogue}<p class="fine">先照順序讀一遍，再和老師分角色練。每次只練這個情境；熟悉後收起範例，用自己的聲音說。</p></section>`;
}
