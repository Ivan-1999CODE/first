// Days 2–14, part 2: preserve the authored language and speaker order.
// Rehearsal state is temporary; answers and lesson progress keep their existing keys.
let dgStudyReplyKey='',dgStudyReplyRole='self';
function dgResetStudyReply(){dgStudyReplyKey='';dgStudyReplyRole='self';}

studyNavigation=function(){
 return `<nav class="study-navigation" aria-label="第二部分學習入口">${[
  ['library','我會說／我要聽得懂'],['reply','同一段對話，再練一次']
 ].map(([key,label])=>btn(`<strong>${label}</strong>`,`data-study-view="${key}"`,`aria-pressed="${mode===key}"`)).join('')}</nav>`;
};

function dgStudyPhraseById(id){return typeof id==='number'?phrases[id]:phrases.find(p=>p.id===id);}
function dgStudyPhrase(p,i,review=false){
 return `<article class="panel task-phrase focus-phrase dg-study-card"${p.id?` data-study-phrase="${esc(p.id)}"`:''}><p class="eyebrow">${review?'帶著用':String(i+1).padStart(2,'0')} / ${esc(p.use||'本任務說法')}</p><p class="en" lang="en">${esc(p.en)}</p><p class="study-meaning">${esc(p.zh)}</p>${audio(p.en)}${studyUsage(p)}${p.note?`<details class="phrase-usage"><summary>用法補充</summary><p>${esc(p.note)}</p></details>`:''}${p.practice?`<details class="phrase-usage"><summary>現在就用一次</summary><p>${esc(p.practice)}</p>${p.remix?guidedHint(p.words||'先想現在要表達什麼，再替換條件。',p.remix,p.remixZh||'',`phrase-${p.id||i}`):''}</details>`:''}</article>`;
}
function dgStudyHearUsage(p,r){
 const usages=(r.hearUsage||[]).filter(item=>item.line===p.en&&item.alternatives?.length);
 return usages.length?`<details class="phrase-usage dg-hear-usage"><summary>用法補充</summary>${usages.flatMap(usage=>usage.alternatives.map(item=>`<div><p><span lang="en">${esc(usage.target)}</span>（${esc(usage.targetZh)}）可以換成 <span lang="en">${esc(item.word)}</span>（${esc(item.wordZh)}）。</p><p class="en" lang="en">${esc(item.en)}</p><p class="study-meaning">${esc(item.zh)}</p>${audio(item.en)}</div>`)).join('')}</details>`:'';
}
function dgStudyPreviewContent(r){
 const role=r.role||course.replyRole,f=flows[r.flowIds[0]];
 // One short example explains the turn-taking. The full sequence is practised
 // in Parts 3 and 5, so alternatives do not repeat entire conversations here.
 const steps=f.steps.slice(0,f.steps[1]&&(f.steps[1].sceneTitle||f.steps[1].sceneContext)?1:2).map(({sceneTitle,sceneContext,...step})=>step);
 const main=dialoguePreview({steps,role,task:steps[0].task,title:'先看這一小段怎麼接',className:'micro-example',prelude:f.prelude||r.prelude,kind:'primary'});
 return `<details class="panel dg-dialogue-preview"><summary>對話怎麼接？需要時看一小段</summary>${main}<p class="fine">其他句子到「同一段對話，再練一次」逐句練；③ 再把完整順序接起來。</p></details>`+(course.studySupplement?microStudySupplement(course.studySupplement):'');
}
function dgStudyChangedPhrases(r){
 const taught=new Set(r.phraseIds.map(id=>dgStudyPhraseById(id).en));
 const changes=[];
 for(const variation of [r.variation,...r.additionalVariations||[]]){
  for(const step of variation?.steps||[]){
   if(taught.has(step.answer))continue;
   taught.add(step.answer);changes.push(step);
  }
 }
 if(!changes.length)return '';
 return `<section class="study-block dg-study-changes" aria-label="後面會用到的替換說法"><h2>換這個條件，再說一次</h2><p class="fine">④ 會用到下面的說法；先練改變的這一句，其餘沿用上面學過的句子。</p><div class="grid">${changes.map((s,i)=>`<article class="panel dg-change-card" data-study-change="${i}"><p class="eyebrow">${esc(s.label||'換一個條件')}</p><p>${esc(s.task)}</p><p class="en" lang="en">${esc(s.answer)}</p><p class="study-meaning">${esc(s.answerZh)}</p>${audio(s.answer)}</article>`).join('')}</div></section>`;
}
function dgStudyHearLines(r){
 const lines=[...r.hearLines],known=new Set(lines.map(p=>p.en));
 for(const variation of [r.variation,...r.additionalVariations||[]]){
  for(const step of variation?.steps||[]){
   if(known.has(step.line))continue;
   known.add(step.line);lines.push({en:step.line,zh:step.zh,role:step.role||r.role,sources:['④ 換條件時會聽到']});
  }
 }
 return lines;
}

phrasePage=function(){
 const r=activeRound(),role=r.role||course.replyRole;
 const navigation=studyNavigation()+`<p class="dg-study-instruction">${mode==='reply'?'跟著角色輪流聽、說，一次只練當前這一句。':'先看意思、聽一次，再把這個任務的句子說出口。'}</p>`;
 if(mode==='reply')return navigation+listeningReply();
 const reuse=r.reuse?.length?`<details class="panel dg-study-support"><summary>前面學過、這個任務會用到的說法</summary><div class="grid">${r.reuse.map((id,i)=>dgStudyPhrase(dgStudyPhraseById(id),i,true)).join('')}</div></details>`:'';
 const extra=r.extraPhraseIds?.length?`<details class="panel dg-study-support"><summary>也可以這樣說（原有句子都保留）</summary><div class="grid">${r.extraPhraseIds.map((id,i)=>dgStudyPhrase(dgStudyPhraseById(id),i)).join('')}</div></details>`:'';
 return navigation+
  `<details class="dg-study-context"><summary>任務 ${esc(taskLabel(r))} 的情境與練習範圍</summary><p>${esc(r.bridge)}</p>${r.coreNote?`<p class="core-note">${esc(r.coreNote)}</p>`:''}</details>`+
  `<section class="study-block study-library" aria-label="我會說">${studyRoleHeading(true,'我會說','')}<div class="grid task-phrase-grid">${r.phraseIds.map((id,i)=>dgStudyPhrase(dgStudyPhraseById(id),i)).join('')}</div></section>`+
  dgStudyChangedPhrases(r)+
  `<section class="study-block study-listening" aria-label="我要聽得懂">${studyRoleHeading(false,'我要聽得懂','聽懂意思即可，不必背對方整句。')}<div class="grid study-hear-grid">${dgStudyHearLines(r).map((p,i)=>`<article class="panel study-hear-card"><p class="eyebrow">${String(i+1).padStart(2,'0')} / ${esc(p.role||role)}可能會說</p><p class="en" lang="en">${esc(p.en)}</p><p class="study-meaning">${esc(p.zh)}</p>${audio(p.en)}${studyUsage(p)}${dgStudyHearUsage(p,r)}${p.note?`<details class="phrase-usage"><summary>用法補充</summary><p>${esc(p.note)}</p></details>`:''}${p.sources?.length?`<p class="fine">會在這裡用到：${p.sources.map(esc).join('、')}</p>`:''}</article>`).join('')}</div></section>`+
  dgStudyPreviewContent(r)+
  `<div class="dg-study-step-actions">${btn('用這些句子，練同一段對話 →','data-study-view="reply"','class="primary"')}</div>`+
  studyVocabulary(r).replace('class="study-block study-vocabulary" open','class="study-block study-vocabulary"')+
  studyAdvanced(r)+(typeof supportCard==='function'?supportCard():'')+extra+reuse;
};

function dgStudyScene(steps,index){
 const scene=steps.slice(0,index+1).reverse().find(s=>s.sceneTitle||s.sceneContext);
 return scene?`<div class="dg-situation dg-study-scene">${scene.sceneTitle?`<h3>${esc(scene.sceneTitle)}</h3>`:''}${scene.sceneContext?`<p>${esc(scene.sceneContext)}</p>`:''}</div>`:'';
}
listeningReply=function(){
 const r=activeRound(),ids=[...r.replyIds,...(r.extraReplyIds||[])],index=ids.indexOf(reply),q=replies[reply];
 const key=`${taskRound}:${reply}`,role=q.role||r.role||course.replyRole;
 if(dgStudyReplyKey!==key){dgStudyReplyKey=key;dgStudyReplyRole=q.askFirst?'self':'other';}
 const self=dgStudyReplyRole==='self',first=q.askFirst?'self':'other',isFirst=dgStudyReplyRole===first;
 const selfAction=q.askFirst?btn(`我說好了，聽${esc(role)}回覆 →`,'data-dg-reply-role="other"','class="primary"'):btn(`← 再聽${esc(role)}`,'data-dg-reply-role="other"');
 const otherAction=q.askFirst?btn('← 再說一次','data-dg-reply-role="self"'):btn('聽懂了，換我回答 →','data-dg-reply-role="self"','class="primary"');
 const current=self?
  `<div class="workshop-answer dg-study-current" data-study-speaker="self"><p class="dg-role">你 · ${q.askFirst?'先開口':'換你回答'}</p><h3 id="dg-study-turn" class="dg-task" tabindex="-1">${esc(q.task)}</h3>${guidedHint(q.words,q.answer,q.answerZh,`study-${key}`)}<div class="dg-study-step-actions">${selfAction}</div></div>`:
  `<div class="workshop-question dg-study-current" data-study-speaker="other"><p class="dg-role">${esc(role)} · ${q.askFirst?'聽回覆':'先聽對方'}</p><h3 id="dg-study-turn" tabindex="-1">聽懂這句就好</h3>${audio(q.line)}${transcript(q.line,q.zh)}<p class="fine">聽懂意思即可，不必背對方整句。</p><div class="dg-study-step-actions">${otherAction}</div></div>`;
 const picker=items=>items.map(n=>btn(`${ids.indexOf(n)+1}. ${esc(replies[n].name)}`,`data-reply="${n}"`,`aria-pressed="${n===reply}"`)).join('');
 const lastAction=index<ids.length-1?btn('下一段 →',`data-reply="${ids[index+1]}"`,isFirst?'':'class="primary"'):btn('帶著同一段對話去操作 →',`data-start="${r.flowIds[0]}"`,isFirst?'':'class="primary"');
 return `<div class="workshop-picker" role="group" aria-label="本任務短對話">${picker(r.replyIds)}</div>`+
  (r.extraReplyIds?.length?`<details class="panel"${r.extraReplyIds.includes(reply)?' open':''}><summary>更多短對話，選一段再練</summary><div class="workshop-picker">${picker(r.extraReplyIds)}</div></details>`:'')+
  `<section class="panel workshop-card dg-study-dialogue"><div class="workshop-card-top"><h2>${esc(q.name)}</h2><span class="workshop-count">${index+1} / ${ids.length}</span></div>${dgStudyScene(ids.map(i=>replies[i]),index)}${current}<div class="lesson-footer dg-dialogue-nav">${btn('← 上一段',`data-reply="${ids[index-1]}"`,index===0?'disabled':'')}${lastAction}</div></section>`+
  `<details class="panel dg-study-repeat"><summary>同一段，再練一次：提示怎麼收回？</summary><p>看完整說法 → 只看關鍵字 → 收起提示。每次都練同一段，還不熟就再來一次。</p>${q.change?`<p>${esc(q.change)}</p>`:''}${q.changeAnswer&&q.changeAnswer!==q.answer?guidedHint(q.changeWords,q.changeAnswer,q.changeAnswerZh||'',`study-change-${key}`):''}${q.note?`<p>${esc(q.note)}</p>`:''}</details>`;
};

// Existing navigation listeners still own task selection, audio and saved work.
// Reset before they render so each new exchange follows its authored first speaker.
document.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button||button.disabled)return;
 const d=button.dataset;
 if(d.dgTask!==undefined&&Number(d.dgTask)===taskRound)return;
 if(['page','taskRound','dgTask','beforeRound','repeatRound','start','studyView','mode','reply'].some(key=>d[key]!==undefined))dgResetStudyReply();
},true);
document.addEventListener('click',event=>{
 const button=event.target.closest('button[data-dg-reply-role]');
 if(!button||button.disabled||page!==1||mode!=='reply')return;
 const role=button.dataset.dgReplyRole;if(!['self','other'].includes(role))return;
 stopAudio();dgStudyReplyRole=role;render();$('#dg-study-turn')?.focus({preventScroll:true});
});
