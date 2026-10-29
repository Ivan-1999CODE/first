// Day 1, part 2: the authored language stays intact; one speaker has the floor.
// This file only changes presentation and transient rehearsal state.
let dgStudyReplyKey='',dgStudyReplyRole='self';

function dgResetStudyReply(){
 dgStudyReplyKey='';
 dgStudyReplyRole='self';
}

studyNavigation=function(){
 return `<nav class="study-navigation" aria-label="第二部分學習入口">${[
  ['library','我會說／我要聽得懂'],
  ['reply','同一段對話，再練一次']
 ].map(([key,label])=>btn(`<strong>${label}</strong>`,`data-study-view="${key}"`,`aria-pressed="${mode===key}"`)).join('')}</nav>`;
};

function dgStudyPhrase(p,i,review=false){
 // Reuse the original card, audio, translation and substitution disclosure.
 return phraseCard(p,i,review)
  .replace('panel focus-phrase','panel focus-phrase dg-study-card')
  .replace(`<details><summary>看中文意思</summary><p>${esc(p.zh)}</p></details>`,`<p class="study-meaning">${esc(p.zh)}</p>`)
  .replace('</article>',`${studyUsage(p)}</article>`);
}

function dgStudyPhraseById(id){
 return typeof id==='number'?phrases[id]:phrases.find(p=>p.id===id);
}

function dgStudyHearUsage(p,r){
 const usages=(r.hearUsage||[]).filter(item=>item.line===p.en&&item.alternatives?.length).map(item=>({...item,alternatives:item.alternatives.filter(a=>a.en!==r.integrationListening?.en)})).filter(item=>item.alternatives.length);
 if(!usages.length)return '';
 return `<details class="phrase-usage dg-hear-usage"><summary>用法補充</summary>${usages.flatMap(usage=>usage.alternatives.map(item=>`<div><p><span lang="en">${esc(usage.target)}</span>（${esc(usage.targetZh)}）可以換成 <span lang="en">${esc(item.word)}</span>（${esc(item.wordZh)}）。</p><p class="en" lang="en">${esc(item.en)}</p><p class="study-meaning">${esc(item.zh)}</p>${audio(item.en)}</div>`)).join('')}</details>`;
}

function dgStudyPracticeChanges(r){
 const items=r.practiceChanges||[];
 return items.length?`<section class="panel dg-study-changes" aria-label="後面會用的替換"><h2>換一個條件，還是同一句型</h2>${items.map(item=>`<p>${esc(item.task)}</p>${item.en?`<p><span lang="en">${esc(item.word)}</span>（${esc(item.wordZh)}）</p><p class="en" lang="en">${esc(item.en)}</p><p>${esc(item.zh)}</p>${audio(item.en)}`:''}`).join('')}</section>`:'';
}

function dgStudyPreviewContent(r,f,role){
 return `<details class="panel dg-study-preview"><summary>對話怎麼接？看一段示範（選看）</summary>${dialoguePreview({steps:f.steps.slice(0,1),role,task:f.steps[0].task,title:'先看一段的接話順序',className:'micro-example',prelude:f.prelude||r.prelude,kind:'primary'})}<p class="fine">其餘句子在「同一段對話，再練一次」逐句練習，不必在這裡重讀整段。</p></details>`;
}

phrasePage=function(){
 const r=currentRound(),f=flows[focusRound],roles=studyArtwork.byRound[focusRound],role=r.role||course.replyRole;
 const navigation=studyNavigation()+`<p class="dg-study-instruction">${mode==='reply'?'先自己說，再聽路人的回覆。':'先看意思、聽一次，再把這輪的句子說出口。'}</p>`;
 if(mode==='reply')return navigation+focusReply();
 const list=r.phraseIds.map(dgStudyPhraseById);
 const reuseIds=(r.reuse||[]).filter(id=>!r.phraseIds.includes(id));
 const reuse=reuseIds.length?`<details class="panel dg-study-support"><summary>前面學過、這輪會用到的說法</summary><div class="grid">${reuseIds.map((id,i)=>dgStudyPhrase(dgStudyPhraseById(id),i,true)).join('')}</div></details>`:'';
 const extra=r.extraPhraseIds?.length?`<details class="panel dg-study-support"><summary>也可以這樣說（原有句子都保留）</summary><div class="grid">${r.extraPhraseIds.map((id,i)=>dgStudyPhrase(dgStudyPhraseById(id),i)).join('')}</div></details>`:'';
 return navigation+
  (r.prelude?`<section class="panel dg-study-prelude"><h2>先聽懂並指出目的地</h2><p>${esc(r.prelude.task)}</p><p class="en" lang="en">${esc(r.prelude.line)}</p><p>${esc(r.prelude.zh)}</p>${audio(r.prelude.line)}</section>`:'')+
  `<details class="dg-study-context"><summary>這輪的情境與練習範圍</summary><p>${esc(r.bridge)}</p></details>`+
  `<section class="study-block study-library" aria-label="我會說">${studyRoleHeading(true,roles.label+'：我會說','')}<div class="grid task-phrase-grid">${list.map((p,i)=>dgStudyPhrase(p,i)).join('')}</div></section>`+
  `<section class="study-block study-listening" aria-label="我要聽得懂">${studyRoleHeading(false,role+'：我要聽得懂','聽懂意思即可，不必背對方整句。')}<div class="grid study-hear-grid">${r.hearLines.map((p,i)=>`<article class="panel study-hear-card"><p class="eyebrow">${String(i+1).padStart(2,'0')} / ${esc(role)}可能會說</p><p class="en" lang="en">${esc(p.en)}</p><p class="study-meaning">${esc(p.zh)}</p>${audio(p.en)}${dgStudyHearUsage(p,r)}<p class="fine">會在這裡用到：${p.sources.map(esc).join('、')}</p></article>`).join('')}</div></section>`+
  dgStudyPracticeChanges(r)+
  dgStudyPreviewContent(r,f,role)+
  `<div class="dg-study-step-actions">${btn('用本輪句子，練同一段對話 →','data-study-view="reply"','class="primary"')}</div>`+
  studyVocabulary(r).replace('class="study-block study-vocabulary" open','class="study-block study-vocabulary"')+
  (r.integrationListening?`<details class="panel dg-study-integration"><summary>08 整合挑戰前，先聽這個替換</summary><p>${esc(r.integrationListening.task)}</p><p lang="en">${esc(r.integrationListening.word)}</p><p>${esc(r.integrationListening.wordZh)}</p><p class="en" lang="en">${esc(r.integrationListening.en)}</p><p>${esc(r.integrationListening.zh)}</p>${audio(r.integrationListening.en)}</details>`:'')+
  studyAdvanced(r)+(typeof supportCard==='function'?supportCard():'')+extra+reuse;
};

focusReply=function(){
 const round=currentRound(),ids=round.replyIds,index=ids.indexOf(reply),r=replies[reply];
 const key=`${focusRound}:${reply}`;
 if(dgStudyReplyKey!==key){dgStudyReplyKey=key;dgStudyReplyRole='self';}
 const self=dgStudyReplyRole==='self';
 const current=self?
  `<div class="workshop-answer dg-study-current"><p class="dg-role">旅客 · 換你說</p><h3 id="dg-study-turn" class="dg-task" tabindex="-1">${esc(r.task)}</h3>${guidedHint(r.words,r.answer,r.answerZh,`study-${key}`)}<div class="dg-study-step-actions">${btn('我說好了，聽路人回覆 →','data-dg-reply-role="other"','class="primary"')}</div></div>`:
  `<div class="workshop-question dg-study-current"><p class="dg-role">路人 · 聽回覆</p><h3 id="dg-study-turn" tabindex="-1">聽懂這句就好</h3>${audio(r.line)}${transcript(r.line,r.zh)}<p class="fine">③ 與 ⑤ 會沿用這句回話；聽懂意思即可。</p><div class="dg-study-step-actions">${btn('← 再說一次','data-dg-reply-role="self"')}</div></div>`;
 return (round.prelude&&index===0?`<details class="panel"><summary>先聽懂開場，再開始這段</summary><p>${esc(round.prelude.task)}</p>${audio(round.prelude.line)}${transcript(round.prelude.line,round.prelude.zh)}</details>`:'')+`<div class="workshop-picker" role="group" aria-label="本輪短對話">${ids.map((i,j)=>btn(`${j+1}. ${esc(replies[i].name)}`,`data-reply="${i}"`,`aria-pressed="${i===reply}"`)).join('')}</div>`+
  `<section class="panel workshop-card dg-study-dialogue"><div class="workshop-card-top"><h2>${esc(r.name)}</h2><span class="workshop-count">${index+1} / ${ids.length}</span></div>${current}<div class="lesson-footer dg-dialogue-nav">${btn('← 上一段',`data-reply="${ids[index-1]}"`,index===0?'disabled':'')}${index<ids.length-1?btn('下一段 →',`data-reply="${ids[index+1]}"`):btn('帶著本輪短對話去操作 →',`data-start="${focusRound}"`)}</div></section>`+
  `<details class="panel dg-study-repeat"><summary>同一段，再練一次：提示怎麼收回？</summary><p>看完整說法 → 只看關鍵字 → 收起提示。每次都練同一段，還不熟就再來一次。</p><p>${esc(r.change)}</p></details>`;
};

// A new part, task, entry or reply always begins with the learner's own line.
// Capture runs before the existing navigation handlers call render().
document.addEventListener('click',event=>{
 const button=event.target.closest('button');
 if(!button||button.disabled)return;
 const d=button.dataset;
 if(['page','focusRound','dgRound','beforeRound','start','studyView','reply'].some(key=>d[key]!==undefined))dgResetStudyReply();
},true);

document.addEventListener('click',event=>{
 const button=event.target.closest('button[data-dg-reply-role]');
 if(!button||button.disabled||page!==1||mode!=='reply')return;
 const role=button.dataset.dgReplyRole;
 if(!['self','other'].includes(role))return;
 stopAudio();
 dgStudyReplyRole=role;
 render();
 $('#dg-study-turn')?.focus({preventScroll:true});
});
