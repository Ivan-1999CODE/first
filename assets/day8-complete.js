// Integrated study cards reuse the ordinary lesson renderer and its collapsed swaps.
function hotelStudyPhrase(p,i,r){
 return dgStudyPhrase(p,i,false,r).replace('class="panel ','class="panel hi-language hi-say ').replace('<p class="en"','<p class="en hi-en"');
}
function hotelStudyHear(s,i){
 return `<article class="panel study-hear-card hi-language hi-hear"><p class="eyebrow">${String(i+1).padStart(2,'0')} / ${esc(s.label||'對方可能會說')}</p><p class="en hi-en" lang="en">${esc(s.line)}</p><p class="study-meaning">${esc(s.zh)}</p>${audio(s.line)}</article>`;
}
function hotelStudyGroups(labels){
 return [
  {id:'arrival',title:'辦理入住',sources:['A','B']},
  {id:'information',title:'詢問住宿資訊',sources:['C']},
  {id:'supplies',title:'索取用品',sources:['D']},
  {id:'dining',title:'客房點餐',sources:['E']},
  {id:'repair',title:'設備報修',sources:['F']}
 ].map(g=>({...g,sources:g.sources.filter(s=>labels.includes(s))})).filter(g=>g.sources.length);
}
function hotelStudyRound(labels){
 const sources=rounds.filter(r=>labels.includes(r.displayLabel||r.id));
 return {
  phraseIds:[...new Set(sources.flatMap(r=>r.phraseIds))],
  flowIds:sources.flatMap(r=>r.flowIds),
  hearLines:sources.flatMap(r=>r.hearLines),
  studyChanges:sources.flatMap(r=>r.studyChanges||[]),
  words:[...new Map(sources.flatMap(r=>r.words).map(w=>[JSON.stringify(w),w])).values()]
 };
}
function hotelStudyPicker(groups,current,showAll){
 return `<section class="hi-study-picker" aria-label="選擇學習情境"><div class="hi-study-picker-head"><h2>依情境找句子</h2><div class="hi-options"><button type="button" data-hotel-study-all aria-pressed="${showAll}">查看全部句子</button></div></div><div class="hi-options hi-study-groups" role="group" aria-label="學習情境">${groups.map(g=>`<button type="button" data-hotel-study-group="${g.id}" aria-pressed="${!showAll&&current===g.id}"><strong>${esc(g.title)}</strong><small>${g.sources.join('＋')} · ${hotelStudyRound(g.sources).phraseIds.length} 句</small></button>`).join('')}</div><p class="fine">${showAll?'目前顯示全部句子，依情境排列；點選上方情境可回到分組查看。':'選一個情境，先看這一組會用到的聽與說。需要整體複習時，再查看全部句子。'}</p></section>`;
}
function hotelStudyLibrary(groups,hearFor,extraFor=()=>'',role='飯店人員'){
 const content=groups.map(g=>{
  const r=hotelStudyRound(g.sources),spoken=r.phraseIds.map(dgStudyPhraseById);
  const heard=[...new Map(hearFor(g).map(s=>[s.line,s])).values()];
  return `<section class="hi-study-section" data-hotel-study-section="${g.id}" aria-labelledby="hi-study-title-${g.id}"><header class="hi-study-title"><p class="eyebrow">${g.sources.join('＋')} · ${spoken.length} 個主要說法</p><h2 id="hi-study-title-${g.id}">${esc(g.title)}</h2></header><section class="study-block study-library" aria-label="我會說">${studyRoleHeading(true,'旅客：我會說','')}<div class="grid task-phrase-grid hi-language-grid hi-speaking-library">${spoken.map((p,i)=>hotelStudyPhrase(p,i,r)).join('')}</div></section><section class="study-block study-listening" aria-label="我要聽得懂">${studyRoleHeading(false,role+'：我要聽得懂','聽懂意思即可，不必背對方整句。')}<div class="grid study-hear-grid hi-language-grid">${heard.map(hotelStudyHear).join('')}</div></section>${extraFor(g)}</section>`;
 }).join('');
 const r=hotelStudyRound(groups.flatMap(g=>g.sources));
 return `<div class="hi-study-sections" data-hotel-study-content>${content}</div>`+studyVocabulary(r).replace('class="study-block study-vocabulary" open','class="study-block study-vocabulary"');
}
function hotelStudyIntro(mode,prefix){
 const library=prefix==='hx'?'say':'library';
 return `<header class="d5-section-heading"><span class="d5-section-number" aria-hidden="true">02</span><div><h1 tabindex="-1">把句子帶著走</h1><p>先練暖黃色的「我會說」，再看藍色的「我要聽得懂」。</p></div></header>`+
  `<nav class="study-navigation" aria-label="第二部分學習入口">${[[library,'我會說／我要聽得懂'],['reply','同一段對話，再練一次']].map(([key,label])=>`<button type="button" data-${prefix}-study="${key}" aria-pressed="${mode===key}"><strong>${label}</strong></button>`).join('')}</nav>`+
  `<p class="dg-study-instruction">${mode==='reply'?'看中文翻譯，用英文說出這一句，再跟著角色接話。':'先看意思、聽一次，再把這個任務的句子說出口。'}</p>`;
}
function hotelStudyExchanges(round,bank){
 const main=round.flowIds.flatMap(id=>flows[id].steps);
 return {steps:[...main,...bank.filter(s=>!main.some(t=>t.answer===s.answer&&t.line===s.line))],mainCount:main.length};
}
function hotelStudyDialogue({steps,mainCount,index,speaker,prefix,key,role}){
 const s=steps[index],first=s.askFirst?'self':'other',currentRole=speaker||first,self=currentRole==='self';
 const action=(text,attrs,extra='')=>`<button type="button" ${attrs} ${extra}>${text}</button>`;
 const changeRole=target=>`data-${prefix}-study-role="${target}"`;
 const selfAction=s.askFirst?action(`我說好了，聽${esc(role)}回覆 →`,changeRole('other'),'class="primary"'):action(`← 再聽${esc(role)}`,changeRole('other'));
 const otherAction=s.askFirst?action('← 再說一次',changeRole('self')):action('聽懂了，換我回答 →',changeRole('self'),'class="primary"');
 const current=self?
  `<div class="workshop-answer dg-study-current" data-study-speaker="self"><p class="dg-role">你 · ${s.askFirst?'先開口':'換你回答'}</p><h3 id="hotel-study-turn" class="dg-task" data-study-prompt="translation" tabindex="-1">${esc(s.answerZh)}</h3>${guidedHint(s.words,s.answer,s.answerZh,'hotel-study-'+key+'-'+index)}<div class="dg-study-step-actions">${selfAction}</div></div>`:
  `<div class="workshop-question dg-study-current" data-study-speaker="other"><p class="dg-role">${esc(role)} · ${s.askFirst?'聽回覆':'先聽對方'}</p><h3 id="hotel-study-turn" tabindex="-1">聽懂這句就好</h3>${audio(s.line)}<details class="hi-transcript"><summary>看對方英文與中文</summary><p class="en" lang="en">${esc(s.line)}</p><p>${esc(s.zh)}</p></details><p class="fine">聽懂意思即可，不必背對方整句。</p><div class="dg-study-step-actions">${otherAction}</div></div>`;
 const picker=(start,end)=>steps.slice(start,end).map((s,i)=>action(`${start+i+1}. ${esc(s.label)}${start>=mainCount?' · '+esc(s.askFirst?s.zh:s.answerZh):''}`,`data-${prefix}-reply="${start+i}"`,`aria-pressed="${index===start+i}"`)).join('');
 const limit=index<mainCount?mainCount:steps.length;
 const next=index<limit-1?action('下一段 →',`data-${prefix}-reply="${index+1}"`,currentRole===first?'':'class="primary"'):action('前往 03 完整流程 →','data-hi-page="2"','class="primary"');
 return `<div class="workshop-picker" role="group" aria-label="本組短對話">${picker(0,mainCount)}</div>`+
  (steps.length>mainCount?`<details class="panel hotel-study-alternatives"${index>=mainCount?' open':''}><summary>換個條件，選一段再練</summary><div class="workshop-picker">${picker(mainCount,steps.length)}</div></details>`:'')+
  `<section class="panel workshop-card dg-study-dialogue"><div class="workshop-card-top"><h2>${esc(s.label)}</h2><span class="workshop-count">${index<mainCount?index+1:index-mainCount+1} / ${index<mainCount?mainCount:steps.length-mainCount}</span></div>${current}<div class="lesson-footer dg-dialogue-nav">${action('← 上一段',`data-${prefix}-reply="${index-1}"`,index===0||index===mainCount?'disabled':'')}${next}</div></section>`+
  `<details class="panel dg-study-repeat"><summary>同一段，再練一次：提示怎麼收回？</summary><p>中文翻譯會一直保留。需要時看完整英文 → 只看關鍵字 → 收起英文提示，再說一次。</p></details>`;
}
// Keep the three integration routes on the same presentation components.
function hotelIntegrationHeading(section,title,sub){
 return `<header class="hi-heading"><span class="hi-number">${String(section+1).padStart(2,'0')}</span><div><h1 tabindex="-1">${esc(title)}</h1><p>${esc(sub)}</p></div></header>`;
}
function hotelIntegrationHero(labels,title,intro,journey){
 return `<section class="hi-hero"><div><p class="eyebrow">第 8 天 · ${labels.join('＋')} 整合練習</p><h1>${esc(title)}</h1><p>${esc(intro)}</p><div class="hi-journey">${journey.map(text=>`<span>${esc(text)}</span>`).join('')}</div></div><div class="hi-keycard" aria-hidden="true"><span>TRAVEL LAB HOTEL</span><strong>305</strong><span>WELCOME · 歡迎入住</span><i></i></div></section>`;
}
function hotelIntegrationEntry(direct){
 return `<div class="hi-actions hi-entry-actions dg-entry-actions"><button type="button" ${direct}>05 完整對話</button><button type="button" data-hi-page="1" class="primary">02 整理聽說句子</button></div>`;
}
function hotelIntegrationPaths(paths){
 return `<div class="hi-route-cards hi-course-path">${paths.map(p=>`<article><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><button type="button" data-hi-page="${p.page}">${esc(p.action)}</button></article>`).join('')}</div>`;
}
// Part 03 shares one active turn across all three hotel integration routes.
function hotelFlowRole(s,f){return f.heard&&f.spoken?'complete':s.askFirst?(f.spoken?'heard':'spoken'):(f.heard?'spoken':'heard');}
function hotelFlowConfirm(s,f,role){
 if(!['heard','spoken'].includes(role)||hotelFlowRole(s,f)!==role)return false;
 if(role==='spoken'&&s.decisions&&!s.allowed.includes(f.decision))return false;
 f[role]=true;f.choice=-1;return true;
}
function hotelFlowResult(selected,valid){return selected<0?'pending':valid.includes(selected)?'correct':'wrong';}
function hotelFlowVerdict(result){return result==='correct'?'✓ 答對了':result==='wrong'?'✕ 再試一次':'';}
function hotelFlowFeedback(result,message=''){
 return `<p class="hi-choice-feedback" data-result="${result}" role="status">${result==='pending'?'':`<strong>${hotelFlowVerdict(result)}</strong><span>${esc(message||(result==='correct'?'確認後，按下一步繼續。':'再聽或讀一次，然後重新選擇。'))}</span>`}</p>`;
}
function hotelFlowDialogue(s,f,{prefix,role='飯店人員',hint,plan=''}){
 const current=hotelFlowRole(s,f),complete=current==='complete',first=s.askFirst?'spoken':'heard';
 const last=s.decisions?'確認決定':'點選答案';
 const labels=s.askFirst?['你先說',`聽${role}回應`,last]:[`先聽${role}`,'換你回答',last];
 const stage=complete?2:current===first?0:1;
 const progress=`<ol class="hi-turn-progress" aria-label="這段對話的練習順序">${labels.map((label,i)=>`<li ${i===stage?'aria-current="step"':''} class="${i<stage?'done':''}"><span aria-hidden="true">${i<stage?'✓':i+1}</span>${esc(label)}</li>`).join('')}</ol>`;
 const next=current==='spoken'?(s.askFirst?'我說好了，聽對方回應 →':s.decisions?'我說好了，確認決定 →':'我說好了，開始選擇 →'):(s.askFirst?'我聽懂了，開始選擇 →':'我聽懂了，換我回答 →');
 const confirm=`<div class="hi-actions"><button type="button" class="primary" data-${prefix}-gate="${current}" ${current==='spoken'&&s.decisions&&!s.allowed.includes(f.decision)?'disabled':''}>${next}</button></div>`;
 const active=complete?`<section class="hi-dialogue-complete"><h3 id="hotel-flow-turn" tabindex="-1">✓ 聽與說都完成了</h3><p>${s.decisions?'這次的訂餐決定已說好，確認結果後繼續。':'接著點選符合剛才對話的答案。'}</p></section>`:
  current==='spoken'?`<section class="hi-role hi-say" data-hotel-flow-role="spoken"><p class="dg-role">你 · ${s.askFirst?'先開口':'換你回答'}</p><h3 id="hotel-flow-turn" class="task" tabindex="-1">${esc(s.decisions?'依這次的價格與時間，選好決定，再用英文回應。':s.task)}</h3>${plan}${!s.decisions||f.decision>=0?hint:'<p>先選擇自己的決定，再用英文回答。</p>'}${confirm}</section>`:
  `<section class="hi-role hi-hear" data-hotel-flow-role="heard"><h3 id="hotel-flow-turn" tabindex="-1">${esc(role)} · ${s.askFirst?'聽對方回應':'先聽對方說'}</h3>${audio(s.line)}<details class="hi-transcript"><summary>看對方英文與中文</summary><p class="hi-en" lang="en">${esc(s.line)}</p><p>${esc(s.zh)}</p></details><p class="fine">可以聽英文，也可以閱讀文字後繼續。</p>${confirm}</section>`;
 const self=f.spoken?`<section><p class="eyebrow">你說的這句 · 參考說法</p><p class="hi-en" lang="en">${esc(s.answer)}</p><p>${esc(s.answerZh||'')}</p></section>`:'';
 const other=f.heard?`<section><p class="eyebrow">${esc(role)}說</p><p class="hi-en" lang="en">${esc(s.line)}</p><p>${esc(s.zh)}</p>${audio(s.line)}</section>`:'';
 const recap=f.heard||f.spoken?`<details class="hi-dialogue-recap"><summary>回看剛才的對話</summary>${s.askFirst?self+other:other+self}<div class="hi-actions"><button type="button" data-${prefix}-dialogue-restart>重新練這段對話</button></div></details>`:'';
 return `<div class="hi-dialogue" data-hotel-flow-stage="${current}">${progress}${active}${recap}</div>`;
}
function hotelFocusFlowTurn(){
 const el=document.querySelector('#hotel-flow-turn');if(!el)return;
 el.focus({preventScroll:true});
 const rect=el.getBoundingClientRect(),inset=dgStickyHeight()+18;
 if(rect.top<inset||rect.bottom>innerHeight-48)window.scrollTo({top:Math.max(0,scrollY+rect.top-inset),behavior:'instant'});
}
// Seven-part routes for the two additional integration groups.
// All records are separate from the original A-F and the existing check-in route.
function createCompleteHotel(data, ctx) {
 'use strict';
 const $=s=>document.querySelector(s), records={}, memory={}, failures={};
 const btn=(text,attrs,extra='')=>`<button type="button" ${attrs} ${extra}>${text}</button>`;
 const go=(text,n)=>btn(text,`data-hi-page="${n}"`,'class="primary"');
 const keys=g=>['before','after','home',...g.questions.map(q=>'question-'+q.id),...g.missions.flatMap(m=>['guided','independent'].map(mode=>'mission-'+m.id+'-'+mode))];
 const goalKeys=g=>g.missions.flatMap(m=>['guided','independent'].map(mode=>({key:m.id+'-'+mode,goals:m.goals})));
 const emptyFlow=()=>({index:0,heard:false,spoken:false,choice:-1,decision:-1,history:[],done:false});
 for(const g of data.groups){
  const r={answers:Object.fromEntries(keys(g).map(k=>[k,''])),goals:Object.fromEntries(goalKeys(g).map(x=>[x.key,Object.fromEntries(x.goals.map(goal=>[goal.id,false]))])),ratings:Object.fromEntries(g.skills.map(s=>[s.id,0])),complete:[],home:{listen:false,spoken:false}};
  try{
   const raw=localStorage.getItem(g.storageKey),old=raw?JSON.parse(raw):{};
   if(!old||typeof old!=='object'||Array.isArray(old))throw Error('invalid');
   for(const k of keys(g))if(typeof old.answers?.[k]==='string')r.answers[k]=old.answers[k];
   for(const x of goalKeys(g))for(const goal of x.goals)r.goals[x.key][goal.id]=old.goals?.[x.key]?.[goal.id]===true;
   for(const s of g.skills)if([1,2,3].includes(old.ratings?.[s.id]))r.ratings[s.id]=old.ratings[s.id];
   r.complete=g.flows.filter(f=>Array.isArray(old.complete)&&old.complete.includes(f.id)).map(f=>f.id);
   for(const k of ['listen','spoken'])r.home[k]=old.home?.[k]===true;
  }catch{failures[g.id]=true;}
  records[g.id]=r;
  memory[g.id]={study:'say',studyGroup:hotelStudyGroups(g.sourceLabels)[0].id,studyAll:false,reply:0,replyRole:null,flowId:g.flows[0].id,flow:emptyFlow(),questionId:g.questions[0].id,missionId:g.missions[0].id,mode:'guided',quiz:{}};
 }
 const group=()=>data.groups.find(g=>g.id===ctx.group());
 const state=()=>records[group().id],ui=()=>memory[group().id];
 function save(){const g=group();try{localStorage.setItem(g.storageKey,JSON.stringify(state()));failures[g.id]=false;}catch{failures[g.id]=true;}notice();}
 function notice(){const node=$('#hx-save-notice');if(node)node.hidden=!failures[group().id];}
 function redraw(selector){ctx.draw();if(selector)$(selector)?.focus({preventScroll:true});}
 function reset(){stopAudio();dgResetSupport();}
 function redrawFlow(){reset();redraw();const target=$('.hx-stage')||$('.hx-content .hi-complete');if(target){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'instant'});}}
 const head=(title,sub)=>hotelIntegrationHeading(ctx.section(),title,sub);
 const field=(key,label)=>`<label class="hi-field" for="hx-${key}">${esc(label)}</label><textarea id="hx-${key}" data-hx-field="${key}" rows="3" placeholder="先用自己的聲音說；需要時記下自己的版本。">${esc(state().answers[key])}</textarea>`;
 const hint=(s,key)=>guidedHint(s.words,s.answer,s.answerZh,'hx-'+group().id+'-'+key);
 const hints=(steps,key)=>steps.map((s,i)=>`<details class="hx-one-hint"><summary>${esc(s.label)}</summary>${hint(s,key+'-'+i)}</details>`).join('');
 const transcript=s=>`<details class="hi-transcript"><summary>看對方英文與中文</summary><p class="hi-en" lang="en">${esc(s.line)}</p><p>${esc(s.zh)}</p></details>`;
 const facts=items=>`<section class="hi-booking"><p class="hi-document-label">這次的資料與條件</p><ul class="hx-facts">${items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`;
 function picker(items,id,attr,label){return `<nav class="hi-options hi-challenge-nav" aria-label="${label}">${items.map((x,i)=>btn((i+1)+' · '+esc(x.title),`${attr}="${x.id}"`,`aria-pressed="${id===x.id}"`)).join('')}</nav>`;}
 function before(){
  const g=group(),journey=g.id==='stay'?['提出用品需求','問清餐點條件','處理設備問題']:['完成入住','處理住宿需求','整合住宿溝通'];
  return hotelIntegrationHero(g.sourceLabels,g.title,g.intro,journey)+
   `<section class="panel hi-before"><p class="dg-role">先試一次完整情境</p><h2>你是旅客，老師是飯店人員。</h2><p class="task hx-checkpoint">${esc(g.checkpoint)}</p><p>你先開口：「${g.id==='stay'?'你好，這裡是 305 號房。':'你好，我想辦理入住。'}」可以分段完成，不必一次說成很長的句子。</p><details class="hi-entry-note"><summary>記下第一次的說法（選填）</summary>${field('before','第一次的嘗試')}<p class="fine">第六部分會回到完全相同的情境。</p></details><details><summary>老師看：本題條件</summary><p>${esc(g.checkpointGuide)}</p></details>${hotelIntegrationEntry('data-hx-direct')}</section>`+
   `<section class="panel"><h2>把會的英文，拿來完成新的情境</h2><div class="hi-route-cards">${g.sourceLabels.map(s=>`<article><span class="hi-task-letter">${s}</span><h3>${esc(data.sources[s])}</h3></article>`).join('')}</div><p>可以只挑今天需要的情境，熟悉後再增加任務。各組的課前作答、情境筆記與目標分開保存。</p>${hotelIntegrationPaths([
    {title:g.id==='stay'?'連起來處理住宿需求':'連起來完成整次住宿',description:g.flows.length+' 個完整流程，聽完再接話。',action:'開始完整流程',page:2},
    {title:'判斷還缺什麼',description:g.questions.length+' 個綜合情境，依資料與需求自己表達。',action:'試綜合情境',page:3},
    {title:'和老師自由接話',description:g.missions.length+' 個真人任務，依實際對話完成目標。',action:'試真人任務',page:4}
   ])}</section>`;
 }
 function study(){
  const g=group(),m=ui(),groups=hotelStudyGroups(g.sourceLabels),visible=m.studyAll?groups:groups.filter(g=>g.id===m.studyGroup);
  const sources=visible.flatMap(g=>g.sources),r=hotelStudyRound(sources),bank=data.bank.filter(s=>sources.includes(s.source));
  const controls=hotelStudyIntro(m.study,'hx')+hotelStudyPicker(groups,m.studyGroup,m.studyAll);
  if(m.study==='reply')return controls+hotelStudyDialogue({...hotelStudyExchanges(r,bank),index:m.reply,speaker:m.replyRole,prefix:'hx',key:g.id+'-'+(m.studyAll?'all':m.studyGroup),role:'飯店人員'});
  return controls+hotelStudyLibrary(visible,g=>data.bank.filter(s=>g.sources.includes(s.source)))+
   `<div class="dg-study-step-actions">${btn('用這些句子，練同一段對話 →','data-hx-study="reply"','class="primary"')}</div>`;
 }
 const flowData=()=>group().flows.find(f=>f.id===ui().flowId);
 function current(){const s=flowData().steps[ui().flow.index],choice=s.decisions?.[ui().flow.decision];return choice?{...s,...choice}:s;}
 function ready(){const s=current(),f=ui().flow;return !f.done&&f.heard&&f.spoken&&(s.decisions?s.allowed.includes(f.decision):s.valid.includes(f.choice));}
 function journal(){const f=ui().flow;return `<section class="hi-desk"><p class="eyebrow">這段對話已確認</p>${f.history.length?`<ol class="hx-journal">${f.history.map(h=>`<li><span>${esc(h.label)}</span><strong>${esc(h.result)}</strong></li>`).join('')}</ol>`:'<p>依本次對話，一步步確認資料。</p>'}</section>`;}
 function flow(){
  const g=group(),c=flowData(),f=ui().flow,s=current();
  const top=head('連起來，完成這次任務','用同一筆資料接續對話。換時點時看清楚角色和需求。')+picker(g.flows,c.id,'data-hx-flow','完整流程');
  if(f.done)return top+`<section class="panel hi-complete"><h2>✓ 這次的流程已練習</h2>${journal()}<p>依最後的結果口頭回顧：提供了哪些資料？哪些需求已確認？若婉拒訂餐，沒有送出餐點訂單。</p><p class="fine">這是操作與自行確認的練習紀錄；口說是否清楚，由師生實際核對。</p><div class="hi-actions">${btn('同一情境再練一次','data-hx-restart')}${go('換情境，自己說 →',3)}</div></section>`;
  const result=hotelFlowResult(f.choice,s.valid||[]),decisionResult=s.decisions?hotelFlowResult(f.decision,s.allowed):'pending';
  const plan=s.decisions?`<div class="hi-options hx-decisions" role="group" aria-label="我的訂餐決定">${s.decisions.map((o,i)=>btn(esc(o.label)+(f.decision===i?`<span class="hi-choice-verdict">${hotelFlowVerdict(decisionResult)}</span>`:''),`data-hx-decision="${i}"`,`aria-pressed="${f.decision===i}" data-result="${f.decision===i?decisionResult:'pending'}" ${!f.heard?'disabled':''}`)).join('')}</div>${hotelFlowFeedback(decisionResult,decisionResult==='wrong'?s.reason:decisionResult==='correct'?'這個決定符合條件，接著用英文說出來。':'')}`:'';
  const dialogue=hotelFlowDialogue(s,f,{prefix:'hx',hint:hint(s,'flow-'+c.id+'-'+s.id+'-'+f.decision),plan});
  const choices=s.decisions?`<section class="hi-known"><h3>本次訂餐決定</h3><p>${f.spoken?esc(s.result):'先聽對方確認，再選擇自己的決定並用英文回答。'}</p><p class="fine">按下確認後，才記錄這次的結果。</p></section>`:`<section class="hi-known"><h3>依對話確認結果</h3><p class="fine">${f.heard&&f.spoken?'點選符合剛才對話的答案。':'先完成這段聽與說，再開始點選。'}</p><div class="hi-object-options">${s.options.map((o,i)=>btn(esc(o)+(f.choice===i?`<span class="hi-choice-verdict">${hotelFlowVerdict(result)}</span>`:''),`data-hx-choice="${i}"`,`aria-pressed="${f.choice===i}" data-result="${f.choice===i?result:'pending'}" ${!f.heard||!f.spoken?'disabled':''}`)).join('')}</div>${hotelFlowFeedback(result)}</section>`;
  return top+`<section class="panel"><p class="task">${esc(c.context)}</p>${facts(c.facts)}<div class="hi-row hx-stage"><div><p class="eyebrow">${esc(s.phase)}</p><h2>${esc(s.label)}</h2></div><span class="hi-count">${f.index+1} / ${c.steps.length}</span></div><div class="hi-track">${c.steps.map((_,i)=>`<span class="${i<=f.index?'on':''}"></span>`).join('')}</div><div class="hi-flow-grid"><div>${dialogue}<div class="hi-actions">${btn('← 上一步','data-hx-back',f.index===0?'disabled':'')}${btn('重新開始','data-hx-restart')}</div></div><div>${journal()}${choices}<div class="hi-actions hi-step-next">${btn(f.index===c.steps.length-1?'確認並完成這段流程':'確認這項，繼續 →','data-hx-next',`class="primary" ${ready()?'':'disabled'}`)}</div></div></div><p class="fine">已開口由自己確認；此處不錄音，也不自動評分。</p></section>`;
 }
 function questions(){
  const g=group(),q=g.questions.find(q=>q.id===ui().questionId);
  return head('情境變了，用自己的話處理','先判斷已知與未知，再直接開口；可以有不同說法與合理順序。')+picker(g.questions,q.id,'data-hx-question','綜合情境題')+`<section class="panel"><div class="hi-grid"><section><p class="eyebrow">${esc(q.title)}</p><p class="task">${esc(q.context)}</p>${facts(q.known)}</section><section class="hi-role hi-say"><p class="hi-focus-cue">↓ 看這裡，換你說</p><p>先直接用英文表達。需要時，再逐層看提示。</p><details><summary>需要一點方向</summary><p>${esc(q.hint)}</p>${hints(q.steps,'question-'+q.id)}</details>${q.cue?`<details><summary>先問完，再聽對方這次的回覆</summary>${audio(q.cue.line)}${transcript(q.cue)}</details>`:''}${field('question-'+q.id,'我的說法（選填）')}</section></div><details class="hx-rubric"><summary>說完後，和老師核對</summary><p>${esc(q.check)}</p><p class="fine">看是否完成需求，不以逐字相同或文字輸入自動評定口說。</p></details></section>`;
 }
 function missions(){
  const g=group(),m=ui(),task=g.missions.find(t=>t.id===m.missionId),key=task.id+'-'+m.mode,flags=state().goals[key];
  const decisionHelp=task.flexibleDecision?`<details><summary>接受與婉拒都可以，依自己的決定說</summary>${hints(data.bank.filter(s=>s.source==='E'&&['Yes, please.','No, thank you.'].includes(s.answer)).filter((s,i,a)=>a.findIndex(t=>t.answer===s.answer)===i),'decision-'+key)}</details>`:'';
  return head('和老師接話，完成這次的事','學生當旅客、老師當飯店人員。依實際對話勾目標，不必照順序念完。')+picker(g.missions,task.id,'data-hx-mission','真人綜合任務')+`<div class="hi-options hi-section-tabs">${['guided','independent'].map(mode=>btn(mode==='guided'?'有提示的練習':'自主接話',`data-hx-mode="${mode}"`,`aria-pressed="${m.mode===mode}"`)).join('')}</div><div class="hi-pair-grid"><section class="panel"><p class="task">${esc(task.context)}</p><section class="hi-role hi-say"><p class="dg-role">${task.first}先開口</p><h2>「${esc(task.opening)}」</h2><p>用自己的英文表達，不必逐字翻譯。</p></section>${facts(task.facts)}<div class="hi-row"><h3>這次要完成的事</h3><span id="hx-goal-count">${Object.values(flags).filter(Boolean).length} / ${task.goals.length} 項</span></div>${task.goals.map((goal,i)=>`${i===task.breakAt?'<p class="hx-phase-note">入住完成後，切換到房內電話情境。</p>':''}<label class="hi-check hi-goal"><input type="checkbox" data-hx-goal="${goal.id}" ${flags[goal.id]?'checked':''}><span>${esc(goal.text)}</span></label>${m.mode==='guided'?`<details class="hi-goal-hint"><summary>需要時找一個說法</summary>${hint(task.steps.find(s=>s.id===goal.stepId),'mission-'+key+'-'+goal.id)}</details>`:''}`).join('')}${decisionHelp}${m.mode==='independent'?`<details class="hi-student-help"><summary>卡住了，再找提示</summary>${hints(task.steps,'mission-help-'+key)}</details>`:''}<details><summary>記下一句真正用到的英文（選填）</summary>${field('mission-'+key,'這一回的口說筆記')}</details><p class="fine">由師生依實際溝通結果確認。對方已主動提供的資訊，學生理解後即可勾選。</p></section><details class="panel hi-teacher"><summary>老師接話卡 · 師生共看</summary><h3>這次怎麼帶</h3><p>${esc(task.guide)}</p><p>學生已報過姓名、房號或需求時，直接接尚未確認的資訊。接話卡只是參考，收起不代表私密教師畫面。</p><div class="hi-teacher-cards">${task.steps.map((s,i)=>`${i===task.breakAt?'<p class="hx-phase-note">換場景：入住完成，旅客已抵達房間。</p>':''}<article><p class="eyebrow">${esc(s.askFirst?'聽到學生'+s.label+'後':'需要確認：'+s.label)}</p><p class="hi-en" lang="en">${esc(s.line)}</p><p>${esc(s.zh)}</p>${audio(s.line)}</article>`).join('')}</div><details><summary>學生卡住時</summary><p>先指出還缺哪項資訊，再給關鍵字。完整範例最後才看；簡短但清楚的說法也可接受。</p></details></details></div>`;
 }
 function progress(){const g=group(),r=state();return head('回到第一次的情境','同一份條件再試一次，看看需要的協助是否減少。')+`<section class="panel hi-say"><p class="task hx-checkpoint">${esc(g.checkpoint)}</p><details><summary>需要時找說法</summary>${hints(g.checkpointSteps,'after')}</details><details><summary>老師看：和課前相同的條件</summary><p>${esc(g.checkpointGuide)}</p></details></section><div class="hi-grid"><section class="panel"><h2>第一次的我</h2><div class="readonly">${esc(r.answers.before||'尚未留下文字紀錄，可以口頭回顧。')}</div></section><section class="panel">${field('after','現在的我')}</section></div><section class="panel"><h2>這次需要多少協助？</h2>${g.skills.map(s=>{const n=r.ratings[s.id];return `<div class="hi-rating" data-level="${n}"><h3>${esc(s.text)}</h3><div class="meter" aria-label="${ratingNames[n]}">${[1,2,3].map(i=>`<span class="${i<=n?(n===3?'green':'yellow'):''}"></span>`).join('')}</div><p>${ratingNames[n]}</p><div class="hi-options">${[1,2,3].map(i=>btn(ratingNames[i],`data-hx-rating="${s.id}:${i}"`,`aria-pressed="${n===i}"`)).join('')}</div></div>`;}).join('')}<h3>一起說一句回饋</h3><p>哪一段能自己接下去？下一次想少看哪一層提示？</p></section>`;}
 function home(){const g=group(),h=g.homework,r=state();return head('換情境，自己再用一次','先聽這次的資訊，再口頭處理需求；不同說法只要意思清楚即可。')+`<section class="panel"><p class="task">${esc(h.context)}</p></section><div class="hi-grid"><section class="panel hi-hear"><h2>1. 聽懂這次的資訊</h2>${h.listen.map((s,j)=>`<article class="hi-quiz"><h3>${esc(s.label)}</h3>${audio(s.line)}${transcript(s)}<div class="hi-options">${s.options.map((o,i)=>btn(esc(o),`data-hx-quiz="${j}:${i}"`,`aria-pressed="${ui().quiz[j]===i}"`)).join('')}</div><p role="status">${ui().quiz[j]===undefined?'':s.valid.includes(ui().quiz[j])?'✓ '+esc(s.options[ui().quiz[j]]):'再聽一次；也可以看文字後重選。'}</p></article>`).join('')}<label class="hi-check"><input type="checkbox" data-hx-home="listen" ${r.home.listen?'checked':''}>我已練習理解這次的資訊</label><p class="fine">若使用文字協助，回顧時記得這次看過文字。</p></section><section class="panel hi-say"><h2>2. 收起提示，自己開口</h2><p>依上面的新情境，分段說出自己的需求與決定。</p><details><summary>需要時找說法</summary>${hints(h.speakSteps,'home')}</details><details><summary>說完再核對</summary><p>${esc(h.check)}</p></details>${field('home','這次的說法（選填）')}<label class="hi-check"><input type="checkbox" data-hx-home="spoken" ${r.home.spoken?'checked':''}>我已依新情境，用自己的聲音說</label><p class="fine">這是自行練習，不會辨識或評分聲音。下次和老師換一種接話順序再試。</p></section></div>`;}
 const pages=[before,study,flow,questions,missions,progress,home];
 function view(id,page){return `<div class="hx-content" data-hx-group="${id}"><p id="hx-save-notice" class="notice" role="status" ${failures[id]?'':'hidden'}>此瀏覽器目前無法讀取或保存本組紀錄；仍可練習，關閉後可能不保留本次作答。</p>${pages[page]()}</div>`;}
 document.addEventListener('input',e=>{if(!ctx.active())return;const key=e.target.dataset.hxField;if(keys(group()).includes(key)){state().answers[key]=e.target.value;save();}});
 document.addEventListener('change',e=>{
  if(!ctx.active())return;const x=e.target.dataset,m=ui();
  if(x.hxGoal){const task=group().missions.find(t=>t.id===m.missionId);if(!task.goals.some(g=>g.id===x.hxGoal))return;const flags=state().goals[task.id+'-'+m.mode];flags[x.hxGoal]=e.target.checked;save();$('#hx-goal-count').textContent=Object.values(flags).filter(Boolean).length+' / '+task.goals.length+' 項';return;}
  if(x.hxHome&&Object.hasOwn(state().home,x.hxHome)){state().home[x.hxHome]=e.target.checked;save();}
 });
 document.addEventListener('click',e=>{
  if(!ctx.active())return;const b=e.target.closest('button');if(!b||b.disabled)return;const x=b.dataset,m=ui(),g=group();
  if(x.hxGate&&ctx.section()===2){if(m.flow.done||!hotelFlowConfirm(current(),m.flow,x.hxGate))return;reset();redraw();hotelFocusFlowTurn();return;}
  if(x.hxDialogueRestart!==undefined&&ctx.section()===2){const f=m.flow;if(f.done)return;f.heard=false;f.spoken=false;f.choice=-1;f.decision=-1;reset();redraw();hotelFocusFlowTurn();return;}
  if(x.hxDirect!==undefined){m.mode='independent';ctx.navigate(4);return;}
  if(x.hxStudy&&['say','reply'].includes(x.hxStudy)){m.study=x.hxStudy;m.replyRole=null;reset();redraw(`.study-navigation [data-hx-study="${m.study}"]`);dgScrollToLesson();return;}
  if(x.hotelStudyGroup&&ctx.section()===1&&hotelStudyGroups(g.sourceLabels).some(g=>g.id===x.hotelStudyGroup)){m.studyGroup=x.hotelStudyGroup;m.studyAll=false;m.reply=0;m.replyRole=null;reset();redraw(`[data-hotel-study-group="${m.studyGroup}"]`);return;}
  if(x.hotelStudyAll!==undefined&&ctx.section()===1){m.studyAll=true;m.study='say';m.reply=0;m.replyRole=null;reset();redraw('[data-hotel-study-all]');return;}
  if(x.hxStudyRole&&['self','other'].includes(x.hxStudyRole)&&ctx.section()===1&&m.study==='reply'){m.replyRole=x.hxStudyRole;reset();redraw('#hotel-study-turn');return;}
  if(x.hxReply!==undefined){const n=Number(x.hxReply),sources=m.studyAll?g.sourceLabels:hotelStudyGroups(g.sourceLabels).find(g=>g.id===m.studyGroup).sources,count=hotelStudyExchanges(hotelStudyRound(sources),data.bank.filter(s=>sources.includes(s.source))).steps.length;if(!Number.isInteger(n)||n<0||n>=count)return;m.reply=n;m.replyRole=null;reset();redraw('#hotel-study-turn');return;}
  for(const [attr,collection,fieldName] of [['hxFlow','flows','flowId'],['hxQuestion','questions','questionId'],['hxMission','missions','missionId']])if(x[attr]){if(!g[collection].some(t=>t.id===x[attr]))return;m[fieldName]=x[attr];if(attr==='hxFlow')m.flow=emptyFlow();reset();redraw('.hx-content h1');return;}
  if(x.hxMode&&['guided','independent'].includes(x.hxMode)){m.mode=x.hxMode;reset();redraw(`[data-hx-mode="${m.mode}"]`);return;}
  if(x.hxChoice!==undefined){const n=Number(x.hxChoice),s=current(),f=m.flow;if(!f.heard||!f.spoken||!Number.isInteger(n)||!s.options[n])return;f.choice=n;redraw(`[data-hx-choice="${n}"]`);return;}
  if(x.hxDecision!==undefined){const f=m.flow,s=current(),n=Number(x.hxDecision);if(!f.heard||!Number.isInteger(n)||!s.decisions?.[n])return;f.decision=n;f.spoken=false;f.choice=-1;reset();redraw(`[data-hx-decision="${n}"]`);return;}
  if(x.hxNext!==undefined){if(!ready())return;const f=m.flow,s=current();f.history.push({label:s.label,result:s.decisions?s.result:s.options[f.choice]});if(f.index===flowData().steps.length-1){f.done=true;if(!state().complete.includes(m.flowId))state().complete.push(m.flowId);save();}else{f.index++;f.heard=false;f.spoken=false;f.choice=-1;f.decision=-1;}redrawFlow();return;}
  if(x.hxBack!==undefined){const f=m.flow;if(f.index===0||f.done)return;f.index--;f.history=f.history.slice(0,f.index);f.heard=false;f.spoken=false;f.choice=-1;f.decision=-1;redrawFlow();return;}
  if(x.hxRestart!==undefined){m.flow=emptyFlow();redrawFlow();return;}
  if(x.hxRating){const [key,value]=x.hxRating.split(':'),n=Number(value);if(!g.skills.some(s=>s.id===key)||![1,2,3].includes(n))return;state().ratings[key]=n;save();redraw(`[data-hx-rating="${x.hxRating}"]`);return;}
  if(x.hxQuiz){const [j,i]=x.hxQuiz.split(':').map(Number),s=g.homework.listen[j];if(!Number.isInteger(j)||!Number.isInteger(i)||!s?.options[i])return;m.quiz[j]=i;redraw(`[data-hx-quiz="${x.hxQuiz}"]`);}
 });
 return {view,resetStudy:()=>{ui().replyRole=null;}};
}
