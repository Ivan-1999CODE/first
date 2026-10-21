// A merged task owns one set of seven parts. Display letters follow the lesson
// order; source IDs remain internal for saved answers and content checks.
if(course.mergedTasks){
 document.documentElement.dataset.mergedTasks='true';
 // Relabel UI copy only. Authored scenarios and saved student text must stay
 // byte-for-byte intact when rendered again in the progress comparison.
 const taskWords=html=>html.split(/(<textarea\b[^>]*>[\s\S]*?<\/textarea>|<div class="readonly">[\s\S]*?<\/div>|<p class="(?:task|en|micro-example-context)"[^>]*>[\s\S]*?<\/p>|<pre\b[^>]*>[\s\S]*?<\/pre>)/g).map((part,index)=>index%2?part:part.replaceAll('本輪','本任務').replaceAll('這一輪','這個任務').replaceAll('這輪','這個任務').replaceAll('每輪','每個任務').replaceAll('下一輪','下一個任務').replaceAll('兩輪','兩個任務').replaceAll('各輪','各任務')).join('');
 const sceneHeading=(s,className='merged-scene-heading')=>s&&(s.sceneTitle||s.sceneContext)?`<header class="${className}"><h3>${esc(s.sceneTitle||'接著練習')}</h3>${s.sceneContext?`<p>${esc(s.sceneContext)}</p>`:''}<p class="fine">${esc(s.role||activeRound().role||course.replyRole)}與我接話；接著沿用已學句子。</p></header>`:'';
 const stepRole=(t,callback)=>{const savedRole=course.replyRole;course.replyRole=t.role||activeRound().role||savedRole;try{return callback();}finally{course.replyRole=savedRole;}};
 const activeScene=(steps,index)=>steps.slice(0,index+1).reverse().find(s=>s.sceneTitle||s.sceneContext);
 const multipleRoles=()=>new Set(String(activeRound().role||course.replyRole).split('／')).size>1;
 const baseMergedRoleHeader=roleHeader;
 roleHeader=function(me,title,subtitle,step=0){
  if(!multipleRoles())return baseMergedRoleHeader(me,title,subtitle,step);
  return `<div class="role-heading">${step?`<span class="turn-number" aria-label="第 ${step} 步">${step}</span>`:''}<div><p class="role-label">${me?'我 · 旅客':esc(course.replyRole)}</p><h3>${esc(title)}</h3><p class="fine">${esc(subtitle)}</p></div></div>`;
 };
 const baseMergedStudyRoleHeading=studyRoleHeading;
 studyRoleHeading=function(me,title,subtitle){
  if(!multipleRoles())return baseMergedStudyRoleHeading(me,title,subtitle);
  return `<div class="study-heading ${me?'study-self':'study-other'}"><div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div></div>`;
 };

 roundChoices=function(attribute='task-round'){
  return `<div class="merged-task-choices" aria-label="選擇完整任務">${rounds.map((r,i)=>btn(`<strong>任務 ${esc(taskLabel(r))}</strong><span>${esc(r.name)}</span>`,`data-${attribute}="${i}"`,`aria-pressed="${r===activeRound()}"`)).join('')}</div>`;
 };
 microRoundCard=function(r){return `<section class="panel merged-task-card"><p class="eyebrow">任務 ${esc(taskLabel(r))}</p><h2>${esc(r.name)}</h2><p>${esc(r.goal)}</p><p class="fine">${r.phraseIds.length} 個主要說法 · ${flows[r.flowIds[0]].steps.length} 次接話 · 一個完整任務</p><p class="fine">${roundsDone.includes(r.id)?'✓ 師生已確認熟悉，可加入混合複習':'可以帶著提示反覆練習'}</p>${btn('先試這個任務 →',`data-before-round="${rounds.indexOf(r)}"`)}</section>`;};
 microChapterCards=function(){return `<div class="cards merged-task-cards">${rounds.map(microRoundCard).join('')}</div>`;};
 intro=function(){
  const r=activeRound();
  return `<section class="hero home-hero"><div class="hero-copy"><p class="eyebrow">DAY ${course.day} / TRAVEL LAB</p><h1>${esc(course.title)}</h1><p class="lead">把相關句子一起學，再用同一組句子完成整個任務。</p></div><div class="hero-art">${course.art}</div></section>
   <section class="panel before-panel"><h2>任務 ${esc(taskLabel(r))}：先試著說</h2>${roundChoices('before-round')}<p class="task">${esc(r.checkpoint.task)}</p>${field('before-'+r.id,'這個任務，第一次的嘗試')}<p class="fine">先口頭試說，再記下原本的說法；⑥ 會回到完全相同的題目。沒有填寫也可以練習。</p>${taskWords(microAlternative(r,'before'))}</section>
   <section class="panel"><h2>同一個任務，一路練到會用</h2><p>② 先看全部聽說句子 → ③ 按順序接話 → ④ 練已看過的變化 → ⑤ 和老師完成整段任務 → ⑥ 比較進步 → ⑦ 回家再練。</p><p>可以先練熟其中幾句，再接著往下。老師與學生確認整個任務熟悉後，再進入下一個任務。</p></section>
   ${microChapterCards()}
   <details class="panel"><summary>老師看：怎麼分堂與收尾</summary><p>同一任務的內容放在一起教，也可以分段練習；換到下一段時仍留在這個任務。課程中途可以做本任務的收尾，下次回來接著練。</p><p>第 ⑥、⑦ 部分只回顧選定的任務。師生確認兩個以上任務熟悉後，才手動開啟混合複習；不會自動加入未學任務。</p></details>
   <details class="panel inventory"><summary>原有句表：老師需要時再查</summary><p>這裡供老師查找延伸說法；使用前先教，再加入練習。</p><div class="inventory-scroll"><table><thead><tr><th>用途</th><th>說法</th><th>意思</th></tr></thead><tbody>${originalPhrases.map(p=>`<tr><td>${esc(p.use||'延伸說法')}</td><td lang="${language}">${esc(p.en)}</td><td>${esc(p.zh)}</td></tr>`).join('')}</tbody></table></div>${typeof legacyFile==='string'?`<p><a href="${esc(legacyFile)}">查看改版前的完整教材 →</a></p>`:''}</details>`;
 };
 roundBanner=function(){const r=activeRound();return `<section class="focus-banner merged-task-banner" aria-label="目前練習任務">${roundChoices()}<strong>任務 ${esc(taskLabel(r))}｜${esc(r.name)}</strong><p>${esc(r.goal)}</p><div class="focus-stages">${[1,2,3,4,5,6].map((n,i)=>btn(['② 聽與說','③ 完整接話',microPart4(r),'⑤ 真人用','⑥ 看進步','⑦ 回家練'][i],`data-page="${n}"`,page===n?'aria-current="step"':'')).join('<span aria-hidden="true">→</span>')}</div></section>`;};

 phrasePage=function(){
  const r=activeRound(),f=flows[r.flowIds[0]];
  if(mode==='reply')return head('','同一個任務裡的短問答，挑一句反覆接，再把整段連起來。')+listeningReply();
  const main=dialoguePreview({steps:f.steps,role:r.role||course.replyRole,task:f.context});
  const change=r.variationMode==='core'?dialoguePreview({steps:r.variation.steps,role:r.role||course.replyRole,task:r.variation.task,title:'另一個已學情境：照順序再看一次',className:'micro-core-example',kind:'core'}):r.variationMode==='repeat'?'':dialoguePreview({steps:r.variation.steps,role:r.role||course.replyRole,task:r.variation.task,title:'④ 要換的條件，先在這裡看過',className:'micro-variation',kind:'variation'});
  const extra=(r.additionalVariations||[]).map(v=>dialoguePreview({steps:v.steps,role:r.role||course.replyRole,task:v.task,title:'④ 要換的條件，先在這裡看過',className:'micro-variation',kind:'additional-variation'})).join('');
  return head('',r.bridge)+(r.coreNote?`<p class="panel core-note">${esc(r.coreNote)}</p>`:'')+`<section class="study-block study-library">${studyRoleHeading(true,'我會說',`這個任務的 ${r.phraseIds.length} 個主要說法，後面會反覆使用。`)}<div class="grid">${r.phraseIds.map((id,i)=>microPhrase(phrases.find(p=>p.id===id),i)).join('')}</div></section>
   <section class="study-block study-listening">${studyRoleHeading(false,'我要聽得懂','先認識整個任務會聽到的回話，再用於後面的練習。')}<div class="grid">${r.hearLines.map((p,i)=>microPhrase({...p,use:(p.role||r.role||course.replyRole)+'會說'},i)).join('')}</div></section>
   ${taskWords(main+change+extra+studyVocabulary(r))}<p class="fine">可以挑一句反覆練，再接下一句；全部句子都留在同一個任務。</p>`;
 };
 listeningReply=function(){
  const ids=activeRound().replyIds,index=ids.indexOf(reply),q=replies[reply],role=q.role||activeRound().role||course.replyRole;
  const section=stepRole(q,()=>{
   const me=`<section class="role-frame role-self">${roleHeader(true,q.askFirst?'① 我先說':'② 換我回答','用這個任務已學過的說法。')}<div class="speaking-task"><p class="task">${esc(q.task)}</p>${hint(q.words,q.answer,q.answerZh)}</div></section>`;
   const other=`<section class="role-frame role-other">${roleHeader(false,q.askFirst?'② '+role+'回覆':'① 先聽'+role,'需要時再展開台詞與中文。')}${audio(q.line)}${transcript(q.line,q.zh)}</section>`;
   return q.askFirst?me+other:other+me;
  });
  const metadata=activeScene(ids.map(i=>replies[i]),index);
  return `<div class="workshop-picker" aria-label="選擇要練習的短問答">${ids.map((n,j)=>btn(`${j+1}. ${esc(replies[n].name)}`,`data-reply="${n}"`,`aria-pressed="${n===reply}"`)).join('')}</div><section class="panel dialogue-workshop"><div class="dialogue-title"><h2>${esc(q.name)}</h2><span>${index+1} / ${ids.length}</span></div>${sceneHeading(metadata)}${section}<p>同一句再練：看完整說法 → 只看關鍵字 → 收起提示。</p><div class="lesson-footer">${btn('← 上一句',`data-reply="${ids[index-1]}"`,index===0?'disabled':'')}${index<ids.length-1?btn('下一句 →',`data-reply="${ids[index+1]}"`):btn('把這些句子連起來練 →',`data-start="${activeRound().flowIds[0]}"`)}</div></section>`;
 };

 const previousMergedScenePage=scenePage;
 scenePage=function(){
  const f=flows[flow];
  if(finished)return taskWords(previousMergedScenePage());
  const t=currentStep(),scene=activeScene(f.steps,turn);
  const turns=stepRole(t,()=>guidedFlowTurns(t,readingHelp(t.line),roleHeader));
  return head('','沿同一個任務的順序，開口、聽回覆，再操作物件。')+tabs(flows,'start',flow)+`<section class="panel scene-task-panel"><div class="dialogue-title"><h2>${esc(f.name)}</h2>${btn('重新開始',`data-start="${flow}"`)}</div><p>${esc(f.context)}</p>${sceneHeading(scene)}<p class="fine">勾選只確認已練習；不錄音、不辨識，也不自動評分。</p><div class="eyebrow">第 ${turn+1} / ${f.steps.length} 步</div><div class="track">${f.steps.map((_,i)=>`<span class="${i<=turn?'done':''}"></span>`).join('')}</div><div class="scene-grid task-scene"><div class="dialogue-stack">${turns}</div><div class="scene-board"><h3>③ ${esc(course.board)}</h3>${sceneState()}<p class="fine">${heard&&spoken?'依剛才的資訊，選擇下方物件。':'完成聽讀與開口確認，再選物件。'}</p><div class="objects">${t.objects.map(([,label],i)=>btn(`${objectArt(t,i)}<small>${esc(label)}${choice===i?' · 已選':''}</small>`,`data-choice="${i}"`,`class="object" aria-pressed="${choice===i}" ${heard&&spoken?'':'disabled'}`)).join('')}</div><div id="flowFeedback" role="status">${feedback?`<p class="feedback ${accepted(t,choice)?'':'retry'}">${esc(feedback)}</p>`:''}</div><div class="footer-actions scene-step-controls">${btn('上一步','data-act="back"',turn===0?'disabled':'')}${btn(turn===f.steps.length-1?'完成流程 ✓':'下一步 →','data-act="next"',canNext()?'class="primary"':'disabled')}</div></div></div></section>`;
 };

 pairPage=function(){
  const p=pairs[pair],r=activeRound(),steps=flows[r.flowIds[r.pairIds.indexOf(pair)]??r.flowIds[0]].steps;
  const scenes=steps.filter(s=>s.sceneTitle||s.sceneContext);
  return head('','把這個任務的句子連起來，和老師完成整段對話。')+tabs(pairs,'pair',pair)+`<p>${esc(p.role)}</p><div class="role-grid"><section class="panel merged-pair-task"><h2>${esc(p.name)}</h2><div class="scene-state">${esc(p.objects)}</div><h3>① ${esc(p.first)}先說</h3><p class="task">「${esc(p.opening)}」</p><p class="fine">先試著用自己的英文表達，需要時再看提示。</p><h3>② 接著怎麼做</h3><p>${esc(p.next)}</p>${scenes.length?`<div class="merged-scene-plan">${scenes.map(s=>sceneHeading(s)).join('')}</div>`:''}<div class="section-title"><h3>這次要完成的事</h3><span id="pairProgress">${state.checks[p.id].filter(Boolean).length} / ${p.goals.length} 項已做到</span></div>${p.goals.map((g,i)=>check(`data-pair-check="${p.id}:${i}"`,g,state.checks[p.id][i])).join('')}<p class="fine">每一項都屬於這個任務。老師依實際表達勾選，也能取消。</p>${field('note-'+p.id,'記下一句真正用到的英文')}</section><details class="teacher"><summary>老師引導（共看，非私密）</summary><h3>先確認起點</h3><p>${esc(p.first)}先說：「${esc(p.opening)}」</p>${p.start?`<p class="en" lang="en">${esc(p.start)}</p>${audio(p.start)}`:'<p>先等待學生開口。</p>'}<p class="hint">${esc(p.tags)}</p><h3>依順序接話</h3><p class="fine">已學的句子都放在這裡；遇到情境轉換，先讀中文條件，再繼續接話。</p>${steps.map((s,i)=>`${sceneHeading(s)}<div class="teacher-card" data-teacher-step="${i}"><p class="eyebrow">${i+1} · ${esc(s.role||r.role||course.replyRole)}</p><b>${esc(s.askFirst?s.task:'老師先說，讓學生回答')} →</b><p class="en" lang="en">${esc(s.line)}</p><p>${esc(s.zh)}</p>${audio(s.line)}</div>`).join('')}<details><summary>學生卡住了</summary><p>先用中文指出當下要表達的意思，再看關鍵字。</p>${steps.map((s,i)=>`<section class="merged-student-cue"><h4>${i+1}. ${esc(s.task)}</h4>${hint(s.words,s.answer,s.answerZh)}</section>`).join('')}</details><details><summary>帶領小提醒與完整條件</summary><p>${esc(p.tags)}</p><p>同一情境沿著已學順序接話；不同條件分次練，肯定與拒絕不當作同時發生。</p></details></details></div>`;
 };

 const baseMergedReviewScope=reviewScope;
 reviewScope=function(){return taskWords(baseMergedReviewScope()).replaceAll('每個任務仍各自比較同一題，不另加長對話。','每個任務各自回到同一道課前題。');};
 const baseMergedProgressCard=progressCard;
 progressCard=function(r){return taskWords(baseMergedProgressCard(r));};
 const baseMergedProgressPage=progressPage;
 progressPage=function(){return taskWords(baseMergedProgressPage());};
 homeCard=function(r){
  const h=r.home,questions=h.quizzes||[h.quiz],flags=state.taskHome[r.id];
  return `<section class="panel scoped-home" data-review-task="${r.id}"><p class="eyebrow">任務 ${esc(taskLabel(r))} · 只用已學說法</p><h2>${esc(r.name)}：回家再練</h2><div class="grid"><div><h3>1. 聽熟悉的回覆</h3>${questions.map((q,index)=>{const selected=quizChoices[q.id];return `<section class="merged-home-question" data-home-question="${esc(q.id)}"><h4>${index+1}. ${esc(q.question||q.task)}</h4>${audio(q.line)}${transcript(q.line,q.zh)}<div class="actions">${q.options.map((o,i)=>btn(esc(o),`data-merged-quiz="${r.id}:${index}:${i}"`,`aria-pressed="${selected===i}"`)).join('')}</div><div role="status">${selected!==undefined?`<p class="feedback ${selected===q.correct?'':'retry'}">${selected===q.correct?'✓ '+esc(q.feedback||q.why):'再聽一次，也可以展開文字與中文後重選。'}</p>`:''}</div></section>`;}).join('')}${check(`data-task-home="${r.id}:listen"`,'我已練習聽懂這些回覆',flags.listen)}</div><div><h3>2. 同一個任務，大聲說</h3><p class="task">${esc(h.task)}</p>${hint(h.words,h.answer,h.answerZh)}${field('home-'+r.id,'記下自己的說法（選填）')}${check(`data-task-home="${r.id}:spoken"`,'我已收起提示，再大聲說一次',flags.spoken)}<p class="fine" id="home-progress-${r.id}">已練習 ${Object.values(flags).filter(Boolean).length} / 2 項；這是練習紀錄，不是評分。</p></div></div></section>`;
 };
 const baseMergedHomePage=homePage;
 homePage=function(){return taskWords(baseMergedHomePage());};
 const baseMergedTaskFooter=taskFooter;
 taskFooter=function(){return taskWords(baseMergedTaskFooter());};
 // Mixed-role tasks identify each counterpart in text. A single static cast
 // portrait would incorrectly represent the later scene as the earlier role.
 const baseMergedRender=render;
 render=function(){baseMergedRender();if(page===4&&multipleRoles())$('#main .lesson-cast')?.remove();};
 document.addEventListener('click',event=>{
  const button=event.target.closest('button[data-merged-quiz]');if(!button||button.disabled)return;
  const [id,question,choice]=button.dataset.mergedQuiz.split(':'),r=rounds.find(r=>r.id===id),q=r&&(r.home.quizzes||[r.home.quiz])[+question];
  if(!q||!Number.isInteger(+choice)||q.options[+choice]===undefined)return;
  quizChoices[q.id]=+choice;render();$(`[data-merged-quiz="${button.dataset.mergedQuiz}"]`).focus({preventScroll:true});
 });
}
