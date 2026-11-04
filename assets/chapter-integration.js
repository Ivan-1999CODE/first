// An isolated seven-part practice owner. Original tasks and their keys stay intact.
(() => {
 'use strict';
 if(typeof chapterIntegration!=='object'||!chapterIntegration?.groups.length)return;
 const data=chapterIntegration,groups=data.groups,q=s=>document.querySelector(s);
 const originalRender=render,originalNavigate=navigate;
 const label=r=>r.displayLabel||r.id;
 const fromHash=()=>groups.find(g=>location.hash==='#chapter-'+g.id);
 let active=!!fromHash(),groupId=(fromHash()||groups[0]).id,section=0;
 const records={},memory={},errors={};
 const emptyFlow=()=>({index:0,heard:false,spoken:false,choice:-1,history:[],done:false});
 const group=()=>groups.find(g=>g.id===groupId);
 function load(g){
  let raw={};try{raw=JSON.parse(localStorage.getItem(g.storageKey)||'{}')||{};}catch{errors[g.id]=true;}
  const fields=['before','after',...g.questions.map(x=>'question-'+x.id),...g.paths.flatMap(p=>['live-'+p.id,'home-'+p.id])];
  records[g.id]={answers:Object.fromEntries(fields.map(k=>[k,typeof raw.answers?.[k]==='string'?raw.answers[k]:''])),goals:{},ratings:{},home:{},quiz:{},complete:[]};
  const r=records[g.id];
  for(const p of g.paths){r.goals[p.id]=Object.fromEntries(p.goals.map(x=>[x.id,raw.goals?.[p.id]?.[x.id]===true]));r.home[p.id]={listen:raw.home?.[p.id]?.listen===true,spoken:raw.home?.[p.id]?.spoken===true};}
  for(const s of g.skills)r.ratings[s.id]=[1,2,3].includes(raw.ratings?.[s.id])?raw.ratings[s.id]:0;
  for(const p of g.paths)for(const s of p.steps){const n=raw.quiz?.[s.id];if(Number.isInteger(n)&&s.objects[n])r.quiz[s.id]=n;}
  r.complete=Array.isArray(raw.complete)?raw.complete.filter(id=>g.paths.some(p=>p.id===id)):[];
  memory[g.id]={study:'library',studyPath:g.paths[0].id,all:false,reply:0,speaker:null,path:g.paths[0].id,question:0,flow:emptyFlow()};
 }
 groups.forEach(load);
 const record=()=>records[groupId],ui=()=>memory[groupId],path=()=>group().paths.find(p=>p.id===ui().path);
 const button=(text,attrs,extra='')=>`<button type="button" ${attrs} ${extra}>${text}</button>`;
 const go=(text,n)=>button(text,`data-ci-section="${n}"`);
 const dedupe=(items,key)=>[...new Map(items.map(x=>[key(x),x])).values()];
 const hint=(s,key)=>guidedHint(s.words||s.answer,s.answer,s.answerZh,'ci-'+groupId+'-'+key);
 const transcript=s=>`<details class="ci-transcript"><summary>看對方英文與中文</summary><p class="en" lang="en">${esc(s.line)}</p><p>${esc(s.zh)}</p></details>`;
 const field=(key,title)=>`<label class="ci-field"><span>${esc(title)}</span><textarea data-ci-field="${esc(key)}" rows="3" placeholder="可以口頭練習，需要時才記下來。">${esc(record().answers[key])}</textarea></label>`;
 const heading=(title,note)=>`<header class="d5-section-heading"><span class="d5-section-number">${String(section+1).padStart(2,'0')}</span><div><h1 tabindex="-1">${esc(title)}</h1><p>${esc(note)}</p></div></header>`;
 function save(){try{localStorage.setItem(group().storageKey,JSON.stringify(record()));errors[groupId]=false;}catch{errors[groupId]=true;}const n=q('#ci-save-notice');if(n)n.hidden=!errors[groupId];}
 function focus(selector){const el=q(selector);if(el){if(!el.matches('button,input,textarea,summary,[tabindex]'))el.tabIndex=-1;el.focus({preventScroll:true});}}
 function redraw(selector){render();if(selector)focus(selector);}
 function reset(){stopAudio();dgResetSupport();ui().speaker=null;}
 function closeMenus(){q('#dg-day-picker').open=false;q('#dg-course-dialog').close();}
 function route(){try{window.history.replaceState(null,'',location.pathname+location.search+(active?'#chapter-'+groupId:''));}catch{}}
 function part(n){if(!Number.isInteger(n)||n<0||n>6)return;reset();section=n;closeMenus();render();focus('#main h1');dgScrollLesson();}
 function picker(){return `<nav class="ci-paths" aria-label="這組的情境">${group().paths.map(p=>button(esc(p.title),`data-ci-path="${p.id}"`,`aria-pressed="${ui().path===p.id}"`)).join('')}</nav>`;}
 function artHeading(me,title,source){
  const art=typeof lessonArtwork==='object'?lessonArtwork:studyArtwork,index=Math.max(0,rounds.findIndex(r=>label(r)===source));
  const key=art.byRound[index][me?'self':'other'];
  return `<div class="study-heading ${me?'study-self':'study-other'}"><img class="study-portrait" src="${art.images[key]}" width="120" height="120" alt=""><div><h2>${esc(title)}</h2><p>${me?'先看意思，聽一次，再自己開口。':'聽懂意思即可，不必背對方整句。'}</p></div></div>`;
 }
 function before(){const g=group();return heading(g.title,g.description)+`<section class="panel ci-say"><p class="eyebrow">先試一次完整情境</p><p class="task ci-checkpoint">${esc(g.checkpoint)}</p><p>你是旅客，老師扮演${esc(g.paths[0].role)}。${g.paths[0].steps[0].askFirst?'你先開口':'老師先開口'}，可以分段完成。</p><details><summary>記下第一次的說法（選填）</summary>${field('before','第一次的我')}</details><div class="ci-actions ci-entry-actions dg-entry-actions">${go('05 完整對話',4)}${button('02 整理聽說句子','data-ci-section="1"','class="primary"')}</div></section><section class="panel"><h2>這組怎麼練</h2><p>從任務 ${g.sources.join('＋')} 選用說法；每次沿用同一筆資料，切換情境時重新看清起點。</p><div class="ci-cards">${g.paths.map(p=>`<article><h3>${esc(p.title)}</h3><p>${esc(p.context)}</p>${button('開始這個情境 →',`data-ci-start="${p.id}"`)}</article>`).join('')}</div><div class="ci-actions">${go('03 連起來完成任務',2)}${go('04 看情境，自己選用',3)}</div></section>`;}
 const visiblePaths=()=>ui().all?group().paths:group().paths.filter(p=>p.id===ui().studyPath);
 const studySteps=()=>visiblePaths().flatMap(p=>p.steps);
 function studyDifference(){
  if(ui().all||!group().studyDifference)return '';
  const p=visiblePaths()[0],s=p?.steps.find(s=>s.id===p.studyFocusStepId);
  if(!s)return '';
  return `<aside class="ci-study-difference" aria-label="這個情境的袋子回答"><p class="eyebrow">${esc(p.title)} · 袋子怎麼回答</p><p>店員問：<span class="ci-difference-question" lang="en">${esc(s.line)}</span></p><p>${esc(s.zh)}</p><div class="ci-difference-reply"><span>你回答</span><strong class="ci-difference-answer" lang="en">${esc(s.answer)}</strong><span>${esc(s.answerZh)}</span></div><p class="fine">${esc(group().studyDifference)}</p></aside>`;
 }
 function library(p){
  const steps=p.steps,spoken=dedupe(steps,s=>s.answer),heard=dedupe(steps,s=>s.line),r={studyChanges:group().studyChanges};
  return `<section class="ci-study-section" data-ci-study-section="${p.id}"><h2>${esc(p.title)}</h2><p>${esc(p.context)}</p><section class="study-block study-library">${artHeading(true,'旅客：我會說',steps[0].source)}<div class="grid task-phrase-grid">${spoken.map((s,i)=>`<article class="panel task-phrase focus-phrase dg-study-card" data-study-phrase="${s.phrase.id}"><p class="eyebrow">${i+1} / ${esc(s.label)}</p><p class="en" lang="en">${esc(s.answer)}</p><p class="study-meaning">${esc(s.answerZh)}</p>${audio(s.answer)}${studyPhraseSubstitutions(s.phrase,r)}${s.adaptationNote?`<p class="fine">${esc(s.adaptationNote)}</p>`:''}</article>`).join('')}</div></section><section class="study-block study-listening">${artHeading(false,p.role+'：我要聽得懂',steps[0].source)}<div class="grid study-hear-grid">${heard.map(s=>`<article class="panel study-hear-card ci-hear"><p class="eyebrow">${esc(s.role)}</p><p class="en" lang="en">${esc(s.line)}</p><p class="study-meaning">${esc(s.zh)}</p>${audio(s.line)}</article>`).join('')}</div></section></section>`;
 }
 function vocabulary(){
  const ss=studySteps(),sources=[...new Set(ss.map(s=>s.source))],words=dedupe(sources.flatMap(l=>rounds.find(r=>label(r)===l).words||[]),x=>JSON.stringify(x));
  return `<details class="study-block study-vocabulary ci-vocabulary"><summary>這輪的單字，需要時再查</summary>${[['我會說的原句',dedupe(ss,s=>s.answer).map(s=>[s.answer,s.answerZh])],['對方會說的原句',dedupe(ss,s=>s.line).map(s=>[s.line,s.zh])],['本輪單字',words]].map(([title,items])=>`<section class="panel"><h3>${title}</h3>${items.map(([en,zh])=>`<div class="study-original-sentence"><p class="en" lang="en">${esc(en)}</p><p>${esc(zh)}</p>${audio(en)}</div>`).join('')}</section>`).join('')}</details>`;
 }
 function study(){
  const m=ui(),ss=studySteps(),s=ss[m.reply]||ss[0],speaker=m.speaker||(s.askFirst?'self':'other');
  let html=heading('把這個情境的句子帶著走','先整理聽說句子，再用同一段對話接話。')+`<nav class="study-navigation" aria-label="第二部分學習入口">${[['library','我會說／我要聽得懂'],['reply','同一段對話，再練一次']].map(([key,title])=>button(title,`data-ci-study="${key}"`,`aria-pressed="${m.study===key}"`)).join('')}</nav><section class="panel ci-study-picker"><div class="ci-row"><h2>依情境找句子</h2>${button('查看全部句子','data-ci-all',`aria-pressed="${m.all}"`)}</div><nav class="ci-paths" aria-label="句庫情境">${group().paths.map(p=>button(esc(p.title),`data-ci-study-path="${p.id}"`,`aria-pressed="${!m.all&&m.studyPath===p.id}"`)).join('')}</nav>${studyDifference()}</section>`;
  if(m.study==='library')return html+visiblePaths().map(library).join('')+button('用這些句子，練同一段對話 →','data-ci-study="reply"')+vocabulary();
  html+=`<nav class="workshop-picker" aria-label="短對話段落">${ss.map((s,i)=>button(`${i+1}. ${esc(s.label)}`,`data-ci-reply="${i}"`,`aria-pressed="${m.reply===i}"`)).join('')}</nav><section class="panel workshop-card"><p class="eyebrow">${m.reply+1} / ${ss.length}</p><div class="ci-turn ${speaker==='self'?'ci-say':'ci-hear'}" data-study-speaker="${speaker}"><p class="dg-role">${speaker==='self'?'你 · 旅客':esc(s.role)}</p>${speaker==='self'?`<h2 tabindex="-1" id="ci-study-turn">${esc(s.answerZh)}</h2>${hint(s,'reply-'+m.reply)}`:`<h2 tabindex="-1" id="ci-study-turn">聽懂這句就好</h2>${audio(s.line)}${transcript(s)}`}<div class="ci-actions">${button(speaker==='self'?'聽對方說 →':'換我說 →',`data-ci-speaker="${speaker==='self'?'other':'self'}"`)}</div></div><div class="ci-actions">${button('← 上一段',`data-ci-reply="${m.reply-1}"`,m.reply===0?'disabled':'')}${m.reply<ss.length-1?button('下一段 →',`data-ci-reply="${m.reply+1}"`):go('到 03 練完整流程 →',2)}</div></section>`;
  return html;
 }
 const current=()=>path().steps[ui().flow.index];
 const ready=()=>{const f=ui().flow;return !f.done&&f.heard&&f.spoken&&current().valid.includes(f.choice);};
 function flow(){
  const p=path(),f=ui().flow,s=current(),top=heading('連起來，完成這次任務','看清起點與角色，依本次對話操作。')+picker();
  if(f.done)return top+`<section class="panel ci-complete"><h2>✓ 這個情境已練習</h2><p>${esc(group().outcome)}</p><p>和老師回顧實際完成的需求；操作紀錄不等於口說評分。</p><details><summary>查看這次確認的資訊</summary><ol>${p.steps.map((s,i)=>`<li>${esc(s.label)}：${esc(s.objects[f.history[i]][1])}</li>`).join('')}</ol></details><div class="ci-actions">${button('再練一次','data-ci-restart')}${go('04 看情境，自己選用 →',3)}</div></section>`;
  const say=`<section class="ci-turn ci-say"><p class="dg-role">${s.askFirst?'① 你先說':'② 換你回答'} · 旅客</p><p class="task">${esc(s.task)}</p>${hint(s,'flow-'+s.id)}<label class="ci-check"><input type="checkbox" data-ci-gate="spoken" ${f.spoken?'checked':''} ${!s.askFirst&&!f.heard?'disabled':''}>我已用自己的聲音說</label></section>`;
  const hear=`<section class="ci-turn ci-hear"><p class="dg-role">${s.askFirst?'② 對方回應':s.carryHeard?'① 延續剛才的回覆':'① 對方先說'} · ${esc(s.role)}</p>${audio(s.line)}${transcript(s)}<label class="ci-check"><input type="checkbox" data-ci-gate="heard" ${f.heard?'checked':''} ${s.askFirst&&!f.spoken?'disabled':''}>我已聽完，或已讀完文字</label></section>`;
  return top+`<section class="panel"><details class="ci-context"><summary>這次的情境與條件</summary><p>${esc(p.context)}</p></details>${s.phase?`<section class="ci-phase"><h2>${esc(s.phase)}</h2><p>${esc(s.phaseContext)}</p></section>`:''}<div class="ci-row ci-stage"><h2 tabindex="-1">${esc(s.label)}</h2><span>${f.index+1} / ${p.steps.length}</span></div><div class="ci-flow-grid"><div>${s.askFirst?say+hear:hear+say}<div class="ci-actions">${button('← 上一步','data-ci-back',f.index===0?'disabled':'')}${button('重新開始','data-ci-restart')}</div></div><div>${vfPanel(s,{selected:f.choice,ready:f.heard&&f.spoken,attr:'data-ci-choice',previous:vfHistory(p,f.history,f.index)})}<div class="ci-actions ci-step-next">${button(f.index===p.steps.length-1?'確認並完成':'確認這項，繼續 →','data-ci-next',`class="primary" ${ready()?'':'disabled'}`)}</div></div></div></section>`;
 }
 function questions(){
  const g=group(),m=ui(),item=g.questions[m.question];
  return heading('看情境，自己選用','先想這一刻需要表達什麼，用一句已學說法回答。')+`<nav class="ci-paths" aria-label="情境題">${g.questions.map((x,i)=>button(`${i+1} · ${esc(x.step.label)}`,`data-ci-question="${i}"`,`aria-pressed="${m.question===i}"`)).join('')}</nav><section class="panel ci-say"><p class="eyebrow">${m.question+1} / ${g.questions.length} · 一個需求，說一句</p><details><summary>查看這次情境</summary><p>${esc(item.context)}</p></details><h2 class="task" tabindex="-1" id="ci-question">${esc(item.prompt)}</h2>${hint(item.step,'question-'+item.id)}<details><summary>記下自己的說法（選填）</summary>${field('question-'+item.id,'這題的說法')}</details></section><div class="ci-actions">${button('← 上一題',`data-ci-question="${m.question-1}"`,m.question===0?'disabled':'')}${m.question<g.questions.length-1?button('下一題 →',`data-ci-question="${m.question+1}"`):go('05 和老師完整接話 →',4)}</div>`;
 }
 function teacher(p){
  let last=null;
  const dialogue=p.steps.map(s=>{
   const bubbles=(s.askFirst?['student','teacher']:['teacher','student']).map(role=>{
    const text=role==='student'?s.answer:s.line;
    if(s.carryHeard&&role==='teacher'&&last?.role===role&&last.text===text)return '';
    last={role,text};return d5TeacherLine(s,role);
   }).join('');
   return `<div class="d5-script-exchange" data-teacher-step-id="${s.id}">${bubbles}</div>`;
  }).join('');
  return `<details class="teacher dg-teacher d5-teacher-guide"><summary>導師提示</summary><div class="d5-teacher-script" lang="en" dir="ltr">${dialogue}</div></details><section class="d5-student-hints"><h3>學生提示</h3>${p.steps.map((s,i)=>`<details class="d5-student-hint"><summary>${i+1}. ${esc(s.task)}</summary>${hint(s,'live-'+s.id)}</details>`).join('')}</section>`;
 }
 function live(){const p=path(),flags=record().goals[p.id];return heading('和老師完整接話','按實際對話勾選目標，意思清楚即可。')+picker()+`<section class="panel"><p class="task">${esc(p.context)}</p><section class="ci-turn ci-say"><p>${p.steps[0].askFirst?'你先開口':'老師先開口'}，${p.steps[0].askFirst?'你用英文表達':'老師用英文說'}：</p><h2>「${esc(p.steps[0].askFirst?p.steps[0].answerZh:p.steps[0].zh)}」</h2><p>學生是旅客；老師扮演${esc(p.role)}。</p></section><h3>這次要完成的事</h3>${p.goals.map((goal,i)=>`${p.steps[i].phase?`<p class="ci-phase">${esc(p.steps[i].phase)}：${esc(p.steps[i].phaseContext)}</p>`:''}<label class="ci-check ci-goal"><input type="checkbox" data-ci-goal="${goal.id}" ${flags[goal.id]?'checked':''}><span>${esc(goal.text)}</span></label>`).join('')}${teacher(p)}<details><summary>記下這次的說法（選填）</summary>${field('live-'+p.id,'口說筆記')}</details></section>`;}
 const ratingNames=['尚未自評','看完整範例','看關鍵字','能獨立完成'];
 function progress(){const g=group();return heading('回到第一次的情境','同一道題再試一次；課後回答另存，不覆蓋第一次。')+`<section class="panel ci-say"><p class="task ci-checkpoint">${esc(g.checkpoint)}</p></section><div class="ci-grid"><section class="panel"><h2>第一次的我</h2><div class="readonly">${esc(record().answers.before||'尚未留下文字紀錄，可以口頭回顧。')}</div></section><section class="panel">${field('after','現在的我')}</section></div><section class="panel"><h2>這次需要多少協助？</h2>${g.skills.map(s=>{const n=record().ratings[s.id];return `<section class="ci-rating" data-level="${n}"><h3>${esc(s.text)}</h3><div class="meter" aria-label="${ratingNames[n]}">${[1,2,3].map(i=>`<span class="${i<=n?(n===3?'green':'yellow'):''}"></span>`).join('')}</div><p>${ratingNames[n]}</p><div class="ci-actions">${[1,2,3].map(i=>button(ratingNames[i],`data-ci-rating="${s.id}:${i}"`,`aria-pressed="${n===i}"`)).join('')}</div></section>`;}).join('')}<h3>留下一句具體回饋。</h3><p>老師與學生一起找出：這次做到了什麼，下次要多練習哪一步。</p></section>`;}
 const quizzes=()=>path().steps.filter(s=>s.choiceReview.mode==='listen').slice(-2);
 function homework(){const p=path(),ss=quizzes(),r=record();return heading('課後再用一次','選一個情境重聽，再收起提示自己開口。')+picker()+`<section class="panel"><p class="task">${esc(p.context)}</p></section><div class="ci-grid"><section class="panel ci-hear"><h2>先聽懂對方</h2>${(ss.length?ss:p.steps.slice(0,1)).map(s=>{const listen=ss.length>0,items=listen?s.objects.map(o=>o[1]):[s.zh,'對方說已經沒有任何可用的選擇。'],valid=listen?s.valid:[0],n=r.quiz[s.id];return `<article class="ci-quiz"><h3>${esc(s.label)}</h3>${audio(s.line)}${transcript(s)}<p>對方這句話傳達哪個資訊？</p><div class="ci-actions">${items.map((x,i)=>button(esc(x),`data-ci-quiz="${s.id}:${i}"`,`aria-pressed="${n===i}"`)).join('')}</div><p role="status">${n===undefined?'':valid.includes(n)?'✓ '+esc(s.zh):'再聽或讀一次，核對關鍵資訊。'}</p></article>`;}).join('')}<label class="ci-check"><input type="checkbox" data-ci-home="listen" ${r.home[p.id].listen?'checked':''}>我已練習理解對方的話</label></section><section class="panel ci-say"><h2>收起提示，自己再說一次</h2><p>依上方情境，試著從開場說到完成。卡住時才展開需要的一句。</p>${p.steps.map(s=>`<details><summary>${esc(s.label)}</summary>${hint(s,'home-'+s.id)}</details>`).join('')}<details><summary>記下這次說法（選填）</summary>${field('home-'+p.id,'課後的說法')}</details><label class="ci-check"><input type="checkbox" data-ci-home="spoken" ${r.home[p.id].spoken?'checked':''}>我已用自己的聲音練習</label></section></div>`;}
 const pages=[before,study,flow,questions,live,progress,homework];
 function taskMenu(){
  const selected=active||page===7?-1:data.day===1?focusRound:taskRound;
  const choices=groups.map(g=>button(`<span>${esc(g.title)}<span class="dg-menu-sources">${esc(g.sources.join('＋'))}</span></span><span class="dg-menu-check" aria-hidden="true">${active&&g.id===groupId?'✓':''}</span>`,`data-ci-group="${g.id}"`,`aria-pressed="${active&&g.id===groupId}"`)).join('');
  return dgTaskMenu(selected,active?'data-ci-task':'data-dg-task',dgMenuGroup('綜合練習',choices+(data.day===1?dgCapstoneOption(!active&&page===7,'data-ci-capstone'):'')));
 }
 render=function(){
  document.body.classList.toggle('ci-active',active);
  if(!active){originalRender();q('#nav').innerHTML=taskMenu();return;}
  const g=group(),main=q('#main');main.dataset.lessonSection=String(section+1);main.classList.toggle('lesson-phrase-page',section===1);
  main.innerHTML=(section===0?dgLessonCover():'')+`<div class="ci-content" data-ci-group-id="${g.id}"><p id="ci-save-notice" class="notice" role="status" ${errors[g.id]?'':'hidden'}>此瀏覽器目前無法保存本組紀錄，仍可繼續練習。</p>${pages[section]()}${section?`<div class="footer-actions">${go('← 上一部分',section-1)}${go(section===6?'回到本組首頁':'下一部分 →',section===6?0:section+1)}</div>`:''}</div>`;
  q('#nav').innerHTML=taskMenu();
  q('#dg-context').innerHTML=`<div class="dg-context-copy"><span class="dg-current-section">${String(section+1).padStart(2,'0')} · ${esc(g.sections[section])}</span><span class="dg-current-round">綜合 · ${esc(g.title)}</span></div>${dgSectionSwitch(g.sections,section,'data-ci-section')}`;
  dgSetMenuLabel('綜合練習','綜合練習 · '+g.title);
 };
 navigate=function(n){if(active)part(n);else originalNavigate(n);};
 const redrawFlow=()=>{reset();redraw('.ci-stage h2,.ci-complete h2');q('.ci-stage,.ci-complete')?.scrollIntoView({block:'start',behavior:'instant'});};
 document.addEventListener('input',e=>{const key=e.target.dataset.ciField;if(active&&Object.hasOwn(record().answers,key)){record().answers[key]=e.target.value;save();}});
 document.addEventListener('change',e=>{
  if(!active||e.target.disabled)return;const x=e.target.dataset,f=ui().flow;
  if(x.ciGate){if(f.done)return;const s=current();if(x.ciGate==='heard')f.heard=e.target.checked&&(!s.askFirst||f.spoken);if(x.ciGate==='spoken')f.spoken=e.target.checked&&(s.askFirst||f.heard);if(s.askFirst&&!f.spoken)f.heard=false;if(!s.askFirst&&!f.heard)f.spoken=false;f.choice=-1;redraw(`[data-ci-gate="${x.ciGate}"]`);}
  if(x.ciGoal&&Object.hasOwn(record().goals[path().id],x.ciGoal)){record().goals[path().id][x.ciGoal]=e.target.checked;save();}
  if(['listen','spoken'].includes(x.ciHome)){record().home[path().id][x.ciHome]=e.target.checked;save();}
 });
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;const x=b.dataset;
  if(x.ciGroup&&groups.some(g=>g.id===x.ciGroup)){reset();if(!active)section=page<7?page:0;active=true;groupId=x.ciGroup;reset();route();closeMenus();render();focus('#dg-menu-open');dgScrollLesson();return;}
  if(x.ciCapstone!==undefined&&data.day===1){active=false;reset();route();originalNavigate(7);focus('#dg-menu-open');return;}
  if(!active)return;
  if(x.ciTask!==undefined){const i=Number(x.ciTask);if(!Number.isInteger(i)||!rounds[i])return;active=false;reset();route();if(data.day===1){setRound(i);dgResetPrelude();}else setTaskRound(i);originalNavigate(section);focus('#dg-menu-open');return;}
  if(x.ciSection!==undefined){part(Number(x.ciSection));return;}
  if(x.ciPath||x.ciStart){const id=x.ciPath||x.ciStart;if(!group().paths.some(p=>p.id===id))return;reset();ui().path=id;ui().flow=emptyFlow();if(x.ciStart)part(2);else redraw(`[data-ci-path="${id}"]`);return;}
  if(x.ciStudy&&['library','reply'].includes(x.ciStudy)){ui().study=x.ciStudy;reset();redraw(`[data-ci-study="${x.ciStudy}"]`);return;}
  if(x.ciStudyPath||x.ciAll!==undefined){if(x.ciStudyPath&&!group().paths.some(p=>p.id===x.ciStudyPath))return;ui().all=x.ciAll!==undefined;if(x.ciStudyPath)ui().studyPath=x.ciStudyPath;ui().reply=0;reset();redraw(x.ciStudyPath?`[data-ci-study-path="${x.ciStudyPath}"]`:'[data-ci-all]');return;}
  if(x.ciReply!==undefined){const n=Number(x.ciReply);if(!Number.isInteger(n)||!studySteps()[n])return;ui().reply=n;reset();redraw('#ci-study-turn');return;}
  if(['self','other'].includes(x.ciSpeaker)){stopAudio();dgResetSupport();ui().speaker=x.ciSpeaker;redraw('#ci-study-turn');return;}
  if(x.ciChoice!==undefined){const n=Number(x.ciChoice),f=ui().flow;if(f.done||!f.heard||!f.spoken||!Number.isInteger(n)||!current().objects[n])return;f.choice=n;redraw(`[data-ci-choice="${n}"]`);return;}
  if(x.ciNext!==undefined){if(!ready())return;const f=ui().flow;f.history[f.index]=f.choice;if(f.index===path().steps.length-1){f.done=true;if(!record().complete.includes(path().id))record().complete.push(path().id);save();}else{f.index++;f.heard=false;f.spoken=false;f.choice=-1;}redrawFlow();return;}
  if(x.ciBack!==undefined){const f=ui().flow;if(!f.index||f.done)return;f.index--;f.history=f.history.slice(0,f.index);f.heard=false;f.spoken=false;f.choice=-1;redrawFlow();return;}
  if(x.ciRestart!==undefined){ui().flow=emptyFlow();redrawFlow();return;}
  if(x.ciQuestion!==undefined){const n=Number(x.ciQuestion);if(!Number.isInteger(n)||!group().questions[n])return;ui().question=n;reset();redraw('#ci-question');return;}
  if(x.ciRating){const [id,value]=x.ciRating.split(':'),n=Number(value);if(!Object.hasOwn(record().ratings,id)||![1,2,3].includes(n))return;record().ratings[id]=n;save();redraw(`[data-ci-rating="${x.ciRating}"]`);return;}
  if(x.ciQuiz){const [id,num]=x.ciQuiz.split(':'),n=Number(num),s=path().steps.find(s=>s.id===id);if(!s||!Number.isInteger(n)||n<0||n>=s.objects.length)return;record().quiz[id]=n;save();redraw(`[data-ci-quiz="${x.ciQuiz}"]`);}
 });
 window.addEventListener('hashchange',()=>{const g=fromHash();if(g){groupId=g.id;active=true;section=0;reset();render();}else if(active){active=false;reset();render();}});
 render();
})();
