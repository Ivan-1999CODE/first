// Add an independent seven-part route to Day 8. Original runtime state is never
// used for integrated answers, goals, ratings or completion.
(() => {
 'use strict';
 const d = hotelIntegration, q = s => document.querySelector(s);
 const studySources=rounds.filter(r=>d.sourceIds.includes(r.id));
 const studyRound={
  phraseIds:studySources.flatMap(r=>r.phraseIds),
  hearLines:studySources.flatMap(r=>r.hearLines),
  studyChanges:studySources.flatMap(r=>r.studyChanges||[]),
  words:[...new Map(studySources.flatMap(r=>r.words).map(word=>[JSON.stringify(word),word])).values()]
 };
 const labels = d.sections, originalRender = render, originalNavigate = navigate;
 labels[3] = '看情境，自己選用';
 let sayIndex = 0;
 const scenario = id => d.scenarios.find(s => s.id === id) || d.scenarios[0];
 const answerKeys = ['before','after','home', ...[...d.sayPrompts,...d.retiredSayPrompts||[]].map(p=>p.id), ...d.scenarios.flatMap(s => ['change-'+s.id,'note-'+s.id+'-guided','note-'+s.id+'-independent'])];
 const practiceKeys = d.scenarios.flatMap(s => [s.id+'-guided',s.id+'-independent']);
 const liveKeys = d.practice.conversations.flatMap(c => ['guided','independent'].map(mode => c.id+'-'+mode));
 answerKeys.push(...d.practice.challenges.map(c=>'challenge-'+c.id),...liveKeys.map(k=>'live-'+k),'home-transfer-v2');
 const routeKeys = d.practice.flowRoutes.flatMap(r=>d.scenarios.map(c=>r.id+':'+c.id));
 const fresh = () => ({answers:Object.fromEntries(answerKeys.map(k => [k,''])), checks:Object.fromEntries(practiceKeys.map(k => [k,d.goals.map(() => false)])), ratings:Object.fromEntries(d.skills.map(s => [s.id,0])), complete:[], home:{listen:false,spoken:false}, suite:{done:[],routes:[],goals:Object.fromEntries(liveKeys.map(k=>[k,Object.fromEntries(d.goals.map(g=>[g.id,false]))])),homeSpoken:false}});
 let saved = fresh(), saveFailed = false;
 try {
  const raw = localStorage.getItem(d.storageKey);
  if (raw) {
   const s = JSON.parse(raw);
   if (!s || typeof s !== 'object' || Array.isArray(s)) throw Error('invalid');
   for (const k of answerKeys) if (typeof s.answers?.[k] === 'string') saved.answers[k] = s.answers[k];
   for (const k of practiceKeys) if (Array.isArray(s.checks?.[k])) saved.checks[k] = d.goals.map((_,i) => s.checks[k][i] === true);
   for (const x of d.skills) if ([0,1,2,3].includes(s.ratings?.[x.id])) saved.ratings[x.id] = s.ratings[x.id];
   saved.complete = d.scenarios.filter(c => Array.isArray(s.complete) && s.complete.includes(c.id)).map(c => c.id);
   for (const k of ['listen','spoken']) saved.home[k] = s.home?.[k] === true;
   saved.suite.done = d.practice.challenges.filter(c=>Array.isArray(s.suite?.done)&&s.suite.done.includes(c.id)).map(c=>c.id);
   saved.suite.routes = routeKeys.filter(k=>Array.isArray(s.suite?.routes)&&s.suite.routes.includes(k));
   for(const k of liveKeys)for(const g of d.goals)saved.suite.goals[k][g.id]=s.suite?.goals?.[k]?.[g.id]===true;
   saved.suite.homeSpoken=s.suite?.homeSpoken===true;
  }
 } catch { saveFailed = true; }
 let active = ['#integrated','#integrated-stay','#integrated-chapter'].includes(window.location.hash), section = 0, studyMode = 'library', replyIndex = 0;
 let groupId=window.location.hash==='#integrated-stay'?'stay':window.location.hash==='#integrated-chapter'?'chapter':'checkin';
 const groupDefs=[{id:'checkin',title:'完成入住',sourceLabels:['A','B','C'],sections:labels},...d.extended.groups];
 function syncRoute(){try{window.history.replaceState(window.history.state,'',window.location.href.split('#')[0]+(active?(groupId==='checkin'?'#integrated':'#integrated-'+groupId):''));}catch{}}
 const extended=createCompleteHotel(d.extended,{active:()=>active&&groupId!=='checkin',group:()=>groupId,section:()=>section,navigate:n=>goSection(n),draw:()=>render()});
 let flowId = 'original', changeId = 'nights', pairId = 'original', practice = 'guided', alternate = false;
 let flowState = newFlow(), quizChoices = {};
 let flowRoute='standard', challengeMode='integrated', challengeId=d.practice.challenges[0].id, challengeState=newChallenge();
 let pairMode='missions', liveId=d.practice.conversations[0].id;
 function newChallenge(){return {selected:null,heard:false,spoken:false,choice:-1,history:[],feedback:''};}
 const challenge=()=>d.practice.challenges.find(c=>c.id===challengeId);
 const liveTask=()=>d.practice.conversations.find(c=>c.id===liveId);
 const flowScenario=()=>{const c=scenario(flowId);return {...c,steps:d.practice.flowRoutes.find(r=>r.id===flowRoute).order.map(k=>c.steps.find(s=>s.key===k))};};
 function newFlow() { return {index:0,heard:false,spoken:false,choice:-1,history:[],done:false,feedback:''}; }
 function persist() {
  try { localStorage.setItem(d.storageKey,JSON.stringify(saved)); saveFailed = false; }
  catch { saveFailed = true; }
  storageMessage();
 }
 function storageMessage() {
  const el = q('#hi-save-notice');
  if (el) { el.hidden = !saveFailed; el.textContent = '此瀏覽器目前無法讀取或保存整合紀錄；仍可練習，關閉後可能不保留本次作答。'; }
 }
 const button = (text, attrs, extra = '') => `<button type="button" ${attrs} ${extra}>${text}</button>`;
 const go = (text, n, extra = '') => button(text,`data-hi-page="${n}"`,extra);
 const field = (key, title) => `<label class="hi-field" for="hi-${key}">${esc(title)}</label><textarea id="hi-${key}" data-hi-field="${key}" rows="3" placeholder="先口頭說；需要時記下自己的版本。">${esc(saved.answers[key])}</textarea>`;
 const hintFor = (s, key) => guidedHint(s.words,s.answer,s.answerZh,'hi-'+key);
 const hints = (steps, key) => steps.map((s,i) => `<div class="hi-cue"><h3>${esc(s.label)}</h3>${hintFor(s,key+'-'+i)}</div>`).join('');
 const transcriptFor = s => `<details class="hi-transcript"><summary>看櫃檯英文與中文</summary><p class="hi-en" lang="en">${esc(s.line)}</p><p>${esc(s.zh)}</p></details>`;
 const facts = s => `<div class="hi-booking"><span class="hi-document-label">你的訂房資料</span><dl><div><dt>訂房姓名</dt><dd lang="en">${esc(s.name)}</dd></div><div><dt>住宿</dt><dd>${s.nights} 晚</dd></div><div><dt>準備的證件</dt><dd>護照</dd></div></dl><p class="fine">姓名與晚數以這張訂房資料為準。</p></div>`;
 function heading(title, sub) { return hotelIntegrationHeading(section,title,sub); }
 function scenarioPicker(id, attr, originals = true) {
  const display=s=>attr==='flow-scenario'?'入住練習 '+String.fromCharCode(65+d.scenarios.indexOf(s)):s.label;
  return `<details class="hi-picker panel"><summary>這一回：${esc(display(scenario(id)))} · 更換條件</summary><div class="hi-options" role="group" aria-label="選擇入住條件">${d.scenarios.filter(s => originals || s.id !== 'original').map(s => button(esc(display(s)),`data-hi-${attr}="${s.id}"`,`aria-pressed="${s.id===id}"`)).join('')}</div><p class="fine">每次只換一個條件。各情境的作答與真人練習勾選分開保存。</p></details>`;
 }
 function beforePage() {
  return hotelIntegrationHero(d.sourceLabels,d.title,'從說出訂房姓名，到拿著房卡準備上樓。把三個任務連成同一段對話。',['提出入住','確認訂房','問清住宿資訊'])+`
  <section class="panel hi-before"><p class="dg-role">先試一次完整情境</p><h2>你是旅客，老師是飯店櫃檯。</h2><p class="task">${esc(d.task)}</p><p>你先開口：「你好，我想辦理入住。」接著由老師回應，試著把事情辦完。</p><details class="hi-entry-note"><summary>記下第一次的說法（選填）</summary>${field('before','第一次的嘗試')}<p class="fine">第六部分會回到完全相同的情境。</p></details>${hotelIntegrationEntry('data-hi-direct')}</section>
  <section class="panel"><h2>把會的英文，拿來完成新的情境</h2><div class="hi-route-cards">${d.sourceLabels.map((label,i) => `<article><span class="hi-task-letter">${label}</span><h3>${['提出入住，報訂房姓名','出示護照，確認晚數','問早餐、退房與電梯'][i]}</h3></article>`).join('')}</div><p>個別任務練熟一件事；這套綜合練習，讓你依對方的回答，自己決定下一句。可以用短句，也可以合併說，不必照固定順序背完。</p>${hotelIntegrationPaths([
   {title:'連起來辦入住',description:d.practice.flowRoutes.length+' 種對話順序，聽完再接話。',action:'開始完整流程',page:2},
   {title:'判斷還缺什麼',description:d.practice.challenges.length+' 個綜合情境，補問資訊或澄清資料。',action:'試綜合情境',page:3},
   {title:'和老師自由接話',description:d.practice.conversations.length+' 個真人任務，依實際對話完成目標。',action:'試真人任務',page:4}
  ])}</section>
  <details class="panel hi-teacher"><summary>老師看：50～60 分鐘怎麼帶</summary><p>先試 5 分鐘 → 補需要的句子約 8 分鐘 → 連續流程約 10 分鐘 → 看情境選用句子約 10 分鐘 → 真人接話約 13 分鐘 → 回顧與作業約 9 分鐘。依學生表現調整。</p><p>學生已能完成時，可直接進第五部分。整合紀錄和原 A～F 任務分開；不必先勾選原任務熟悉。</p></details>`;
 }
 function phraseCard(s, kind, i) {
  const self = kind === 'say';
  return self?hotelStudyPhrase(phrases.find(p=>p.en===s.answer)||{en:s.answer,zh:s.answerZh,use:s.label},i,studyRound):hotelStudyHear(s,i);
 }
 function studyPage() {
  const modes = `<div class="hi-options" role="group" aria-label="句子與短問答">${button('我想怎麼說','data-hi-study="library"',`aria-pressed="${studyMode==='library'}"`)}${button('櫃檯問，我來答','data-hi-study="reply"',`aria-pressed="${studyMode==='reply'}"`)}</div>`;
  if (studyMode === 'reply') {
   const replies = [d.steps[1],d.steps[2],d.steps[3]], s = replies[replyIndex];
   const remix=replyIndex===0?scenario('name').steps[1]:replyIndex===2?scenario('nights').steps[3]:s;
   return heading('先聽懂，再接一句','看中文翻譯，用英文回答；一次練一句。') + modes + `<section class="panel"><div class="hi-row"><h2>${esc(s.label)}</h2><span>${replyIndex+1} / ${replies.length}</span></div><div class="hi-grid"><div class="hi-hear hi-role"><p class="dg-role">① 櫃檯先說</p>${audio(s.line)}${transcriptFor(s)}</div><div class="hi-say hi-role"><p class="dg-role">② 換你回答</p><p class="task" data-study-prompt="translation">${esc(s.answerZh)}</p>${hintFor(s,'reply-'+replyIndex)}</div></div>${remix.answer!==s.answer?`<details class="hi-remix"><summary>同一句，換詞再答一次</summary><p data-study-prompt="translation">${esc(remix.answerZh)}</p>${hintFor(remix,'reply-remix-'+replyIndex)}</details>`:''}<div class="hi-actions">${button('← 上一組',`data-hi-reply="${replyIndex-1}"`,replyIndex===0?'disabled':'')}${replyIndex<replies.length-1?button('下一組 →',`data-hi-reply="${replyIndex+1}"`):go('把整段連起來 →',2,'class="primary"')}</div></section>`;
  }
  const changed = d.scenarios.slice(1).map(s => s.steps.find(t => t.key === s.key));
  return heading('會的快速看，需要的再練',`${d.steps.length} 個主要說法來自 A＋B＋C；用自己的自然說法也可以。`) + modes + `<section class="study-block study-library" aria-label="我會說">${studyRoleHeading(true,'旅客：我會說','')}<div class="grid task-phrase-grid hi-language-grid hi-speaking-library">${d.steps.map((s,i) => phraseCard(s,'say',i)).join('')}</div></section><section class="study-block study-listening" aria-label="我要聽得懂">${studyRoleHeading(false,'櫃檯：我要聽得懂','聽懂意思即可，不必背對方整句。')}<div class="grid study-hear-grid hi-language-grid">${d.steps.map((s,i) => phraseCard(s,'hear',i)).join('')}</div></section><h2 class="hi-block-title">住宿資訊不同時，這樣聽懂</h2><div class="hi-language-grid">${changed.slice(2).map((s,i) => phraseCard(s,'hear',i)).join('')}</div><section class="panel hi-support-lesson"><h2>綜合練習前：聽懂對方的確認</h2><p>先聽過這兩句，再試「晚數說錯了」。對方說錯時，可以沿用已學的 I’m staying for three nights.，或清楚說出 Three nights.</p><div class="hi-language-grid">${d.practice.hearSupport.map(s=>phraseCard(s,"hear",0)).join("")}</div></section><details class="panel hi-teacher"><summary>自主接話前：認識另外 ${d.alternateQuestions.length} 種櫃檯問法</summary><p>和原本的問題意思相近。老師要換問法時，先一起聽過，再到第五部分勾選使用。</p>${d.alternateQuestions.map(s => phraseCard(s,'hear',0)).join('')}</details>${studyVocabulary(studyRound).replace('class="study-block study-vocabulary" open','class="study-block study-vocabulary"')}`;
 }
 function flowReady() {
  const f = flowState, s = flowScenario().steps[f.index];
  return !f.done && f.heard && f.spoken && s.valid.includes(f.choice);
 }
 function board() {
  const f = flowState, c = flowScenario(), values = {};
  c.steps.forEach((s,i) => { if (Number.isInteger(f.history[i]) && s.valid.includes(f.history[i])) values[s.key] = s.objects[f.history[i]][1]; });
  const ready=values.name&&values.passport&&values.nights;
  return `<div class="hi-desk"><p class="eyebrow">飯店櫃檯 · 目前已確認</p><div class="hi-desk-facts"><div><span>訂房</span><strong>${esc(values.name || '待報姓名')}</strong></div><div><span>證件</span><strong>${values.passport?'護照已出示':'待出示護照'}</strong></div><div><span>住宿</span><strong>${esc(values.nights || '待確認晚數')}</strong></div><div><span>早餐</span><strong>${esc(values.breakfast || '待詢問')}</strong></div><div><span>退房</span><strong>${esc(values.checkout || '待詢問')}</strong></div><div><span>電梯</span><strong>${esc(values.elevator || '待詢問')}</strong></div></div><div class="hi-room-key ${ready?'is-ready':''}"><span>房卡</span><strong>${ready?'305':'—'}</strong><span>${ready?'入住資料已確認，櫃檯交給你房卡。':'確認入住資料後領取。'}</span></div></div>`;
 }
 function flowPage() {
  const c = flowScenario(), f = flowState, s = c.steps[f.index], route=d.practice.flowRoutes.find(r=>r.id===flowRoute);
  const top = heading('連起來，完成這次入住','同一位旅客、同一筆訂房；說過的資訊一路延續。') + `<details class="panel hi-route-picker"><summary>接話順序：${esc(route.label)}</summary><div class="hi-options">${d.practice.flowRoutes.map(r=>button(esc(r.label),`data-hi-route="${r.id}"`,`aria-pressed="${flowRoute===r.id}"`)).join('')}</div><p>${esc(route.note)}</p></details>` + scenarioPicker(flowId,'flow-scenario') + ((flowRoute==='standard'&&saved.complete.includes(flowId))||saved.suite.routes.includes(flowRoute+':'+flowId)?'<p class="fine hi-flow-record">✓ 這組條件與順序已有一次完整流程的練習紀錄；可以重新練習。</p>':'');
  if (f.done) return top + `<section class="panel"><p class="dg-role">✓ 這段流程已練習</p><h2>已準備好拿著房卡上樓。</h2>${board()}<p class="task">請口頭整理：你用什麼名字訂房、住幾晚？早餐、退房時間和電梯位置確認了嗎？</p><p class="fine">完成操作是練習紀錄；接下來和老師實際接話，觀察需要多少提示。</p><div class="hi-actions">${button('同一段再練一次','data-hi-flow-restart')}${go('看情境，自己選用 →',3,'class="primary"')}${go('直接和老師接話 →',4)}</div></section>`;
  const speaking = `<section class="hi-role hi-say"><p class="dg-role">${s.askFirst?'① 你先說':'② 換你回答'}</p><p class="hi-focus-cue">↓ 看這裡，換你說</p><p class="task">${esc(s.task)}</p>${hintFor(s,'flow-'+c.id+'-'+s.key)}<label class="hi-check"><input type="checkbox" data-hi-gate="spoken" ${f.spoken?'checked':''} ${!s.askFirst&&!f.heard?'disabled':''}>我已用自己的聲音說</label></section>`;
  const listening = `<section class="hi-role hi-hear"><p class="dg-role">${s.askFirst?'② 櫃檯回應':'① 櫃檯先說'}</p>${audio(s.line)}${transcriptFor(s)}<label class="hi-check"><input type="checkbox" data-hi-gate="heard" ${f.heard?'checked':''} ${s.askFirst&&!f.spoken?'disabled':''}>我已聽完，或已讀完文字</label></section>`;
  return top + `<section class="panel"><div class="hi-row"><div><p class="eyebrow">${esc(s.stage)} · 來自任務 ${esc(s.sourceLabel)}</p><h2>${esc(s.label)}</h2></div><span class="hi-count">${f.index+1} / ${c.steps.length}</span></div><div class="hi-track" aria-label="第 ${f.index+1} 步，共 ${c.steps.length} 步">${c.steps.map((_,i) => `<span class="${i<=f.index?'on':''}"></span>`).join('')}</div><div class="hi-flow-grid"><div>${facts(c)}${s.askFirst?speaking+listening:listening+speaking}</div><div class="hi-scene">${board()}${vfPanel(s,{selected:f.choice,ready:f.heard&&f.spoken,attr:'data-hi-choice',previous:vfHistory({steps:c.steps},f.history,f.index)})}<p class="hi-feedback" hidden>${esc(f.feedback)}</p></div></div><div class="hi-actions">${button('← 上一步','data-hi-flow-back',f.index===0?'disabled':'')}${button(f.index===c.steps.length-1?'完成入住流程 ✓':'下一步 →','data-hi-flow-next',`class="primary" ${flowReady()?'':'disabled'}`)}${button('重新開始','data-hi-flow-restart')}</div><p class="fine">勾選由自己確認；這裡不錄音，也不自動評分。</p></section>`;
 }
 function singlePracticePage() {
  const p = d.sayPrompts[sayIndex];
  const old = d.scenarios.filter(s=>saved.answers['change-'+s.id]);
  return heading('看情境，自己選用','選一個小情境，想想需要表達什麼，用一句話說出來。') +
   `<nav class="hi-options" aria-label="選擇小情境">${d.sayPrompts.map((item,i)=>button((i+1)+' · '+esc(item.label),`data-hi-say="${i}"`,`aria-pressed="${sayIndex===i}"`)).join('')}</nav>
   <section class="panel hi-say say-card" data-say-mode="${p.mode}"><p class="eyebrow">${sayIndex+1} / ${d.sayPrompts.length} · 一個需求，說一句</p>
   ${p.mode==='swap'?`<p class="fine">原來的意思：${esc(p.baseZh)}</p>`:''}<h2 class="task say-prompt" tabindex="-1">${esc(p.prompt)}</h2>${sayHint(p)}
   <details class="say-note"><summary>記下自己的說法（選填）</summary>${field(p.id,'這個情境，我的說法')}</details><p class="fine">意思表達清楚即可，不必逐字相同。第五部分再和老師接話。</p></section>
   <div class="hi-actions">${button('← 上一個情境',`data-hi-say="${sayIndex-1}"`,sayIndex===0?'disabled':'')}${sayIndex<d.sayPrompts.length-1?button('下一個情境 →',`data-hi-say="${sayIndex+1}"`):go('到第五部分，和老師練 →',4)}</div>
   ${(d.retiredSayPrompts||[]).some(s=>saved.answers[s.id])?`<details class="panel"><summary>改版前逐句練習的作答</summary>${d.retiredSayPrompts.filter(s=>saved.answers[s.id]).map(s=>`<h3>${esc(s.prompt)}</h3><div class="readonly">${esc(saved.answers[s.id])}</div>`).join('')}</details>`:''}
   ${old.length?`<details class="panel"><summary>改版前第四部分的作答</summary>${old.map(s=>`<h3>${esc(s.label)}</h3><div class="readonly">${esc(saved.answers['change-'+s.id])}</div>`).join('')}</details>`:''}`;
 }
 function challengeReady(){const f=challengeState,s=challenge().turns.find(t=>t.key===f.selected);return !!s&&f.heard&&f.spoken&&s.valid.includes(f.choice);}
 function changePage(){
  const tabs=`<div class="hi-options hi-section-tabs" role="group" aria-label="情境練習方式">${button('綜合情境','data-hi-challenge-mode="integrated"',`aria-pressed="${challengeMode==='integrated'}"`)}${button('需要時，補練單句','data-hi-challenge-mode="single"',`aria-pressed="${challengeMode==='single'}"`)}</div>`;
  if(challengeMode==='single')return tabs+singlePracticePage();
  const c=challenge(),f=challengeState,s=c.turns.find(t=>t.key===f.selected),done=f.history.length===c.turns.length;
  const names=Object.fromEntries(d.steps.map(t=>[t.key,t.label]));
  const note=`<details class="panel"><summary>記下自己的說法（選填）</summary>${field('challenge-'+c.id,'這個情境，我實際說了什麼')}</details>`;
  const progress=`<section class="hi-known"><h3>目前已知道</h3><ul>${c.known.map(x=>`<li>${esc(x)}</li>`).join('')}${f.history.map(x=>`<li class="hi-new-fact">✓ ${esc(x.fact)}</li>`).join('')}</ul><p class="fine">本次已處理 ${f.history.length} / ${c.turns.length} 項需求${saved.suite.done.includes(c.id)?' · 曾完成情境操作':''}</p></section>`;
  let interaction='';
  if(done){
   interaction=`<section class="panel hi-complete"><p class="eyebrow">✓ 本次情境操作已完成</p><h2>需要的資訊已確認。</h2><p>和老師核對：剛才有自己開口嗎？資訊和訂房資料是否一致？不同說法只要意思清楚，也可以。</p>${progress}<div class="hi-actions">${button('同一情境再試一次','data-hi-challenge-restart')}${go('和老師自由接話 →',4,'class="primary"')}</div></section>`;
  }else{
   const cue=c.cue&&!s?`<section class="hi-role hi-hear"><p class="dg-role">先聽櫃檯現在說什麼</p>${audio(c.cue.line)}${transcriptFor(c.cue)}</section>`:'';
   let exchange='';
   if(s){
    const say=`<section class="hi-role hi-say"><p class="hi-focus-cue">↓ 看這裡，換你說</p><p class="task">${esc(s.task)}</p>${hintFor(s,'challenge-'+c.id+'-'+s.key)}<label class="hi-check"><input type="checkbox" data-hi-challenge-gate="spoken" ${f.spoken?'checked':''} ${!s.askFirst&&!f.heard?'disabled':''}>我已用自己的聲音說</label></section>`;
    const hear=`<section class="hi-role hi-hear"><p class="dg-role">${s.askFirst?'接著聽櫃檯的回答':'先聽櫃檯這一句'}</p>${audio(s.line)}${transcriptFor(s)}<label class="hi-check"><input type="checkbox" data-hi-challenge-gate="heard" ${f.heard?'checked':''} ${s.askFirst&&!f.spoken?'disabled':''}>我已聽完，或已讀完文字</label></section>`;
    exchange=`<div class="hi-grid"><div>${s.askFirst?say+hear:hear+say}</div><section class="hi-role hi-known"><h3>依對話確認資料</h3><p>先開口並聽懂，再選這次符合的結果。</p><div class="hi-object-options">${s.objects.map((o,i)=>button(esc(o[1]),`data-hi-challenge-choice="${i}"`,`aria-pressed="${f.choice===i}" ${!f.heard||!f.spoken?'disabled':''}`)).join('')}</div>${f.choice>=0&&!s.valid.includes(f.choice)?'<p role="status">這項結果和本次資料不一致。再聽一次，也可以看文字後重選。</p>':''}<div class="hi-actions">${button('確認這項，繼續 →','data-hi-challenge-next',`class="primary" ${challengeReady()?'':'disabled'}`)}</div></section></div>`;
   }
   interaction=`<section class="panel"><div class="hi-grid"><div><p class="eyebrow">${esc(c.skill)}</p><h2 class="hi-challenge-title" tabindex="-1">${esc(c.context)}</h2>${cue}</div><div>${facts(c.scenario)}${progress}</div></div><h3>下一句，你想處理什麼？</h3><div class="hi-options hi-intents">${c.choices.map(key=>button(esc(names[key])+(f.history.some(x=>x.key===key)?' · 已確認':''),`data-hi-intent="${key}"`,`aria-pressed="${f.selected===key}" ${f.history.some(x=>x.key===key)?'disabled':''}`)).join('')}</div><p class="hi-intent-feedback" role="status">${esc(f.feedback)}</p><details class="hi-need-hint"><summary>需要一點方向</summary><p>${esc(c.nudge)}</p></details>${exchange}<p class="fine">先自己想要說什麼，再選需求繼續。選項和勾選不評定口說；以實際表達核對。已知資訊若沒聽清楚，也可以向老師再次確認。</p></section>`;
  }
  return heading('看資訊，自己決定下一句','把已學的英文用在新情境；先判斷需要，再開口、聽懂並確認。')+tabs+`<nav class="hi-options hi-challenge-nav" aria-label="綜合情境">${d.practice.challenges.map((p,i)=>button((i+1)+' · '+esc(p.label),`data-hi-challenge="${p.id}"`,`aria-pressed="${c.id===p.id}"`)).join('')}</nav>`+interaction+note;
 }
 function missionGuide(m){
  const c=m.scenario,flags=saved.suite.goals[m.id+'-'+practice];
  return `<details class="panel hi-teacher"><summary>老師接話卡 · 師生共看</summary><h3>先讓學生開口</h3><p>${esc(m.guide)}</p><div class="hi-fact-tags"><span>早餐包含</span><span>${c.checkout} 點退房</span><span>電梯在${c.elevator}邊</span><span>房卡 305</span></div><p>姓名、護照和晚數都確認後，再交房卡。學生已說的資訊可以直接勾選；順序可以調整。</p><label class="hi-check"><input type="checkbox" data-hi-alternate ${alternate?'checked':''}>已在第二部分聽過另外 ${d.alternateQuestions.length} 種問法，這回可以使用</label><div class="hi-teacher-cards">${m.order.map(key=>{
   const s=c.steps.find(t=>t.key===key),alt=alternate&&d.alternateQuestions.find(t=>t.key===key);
   const event=m.event&&((m.id==='staff-informs'&&key==='checkout')||(m.id==='clear-up'&&key==='nights'))?m.event:null;
   const line=event||alt||s;
   return `<article data-hi-teacher-key="${key}" class="${flags[key]?'hi-goal-confirmed':''}"><p class="eyebrow">${flags[key]?'✓ 已確認；需要時可再次確認':esc(event?event.trigger:s.askFirst?'聽到學生'+s.label+'後':'需要確認：'+s.label)}</p><p class="hi-en" lang="en">${esc(line.line)}</p><p>${esc(line.zh)}</p>${audio(line.line)}${event?.reply?`<p>學生澄清後，回應：</p><p class="hi-en" lang="en">${esc(event.reply)}</p><p>${esc(event.replyZh)}</p>${audio(event.reply)}`:''}</article>`;
  }).join('')}</div><details><summary>學生卡住了</summary><p>先指出還缺哪項資訊，再給關鍵字；需要時才看完整說法。清楚說出正確資訊即可，不必逐字相同。</p>${hints(c.steps,'teacher-'+m.id+'-'+practice)}</details><details><summary>怎麼確認任務完成？</summary><p>按實際溝通結果勾選。對方主動提供的資訊，請學生指出正確時間、方向或早餐資訊，確定理解即可；不必再說一次同樣的問句。畫面由師生共看，接話卡收起並不代表私密。</p></details></details>`;
 }
 function pairPageIntegrated(){
  const tabs=`<div class="hi-options hi-section-tabs" role="group" aria-label="真人任務種類">${button('綜合真人任務','data-hi-live-mode="missions"',`aria-pressed="${pairMode==='missions'}"`)}${button('原訂房條件練習','data-hi-live-mode="original"',`aria-pressed="${pairMode==='original'}"`)}</div>`;
  if(pairMode==='original')return tabs+legacyPairPage();
  const m=liveTask(),c=m.scenario,key=m.id+'-'+practice,flags=saved.suite.goals[key];
  return heading('和老師自由接話，把事情辦成','學生當旅客、老師當櫃檯。看資料與目標，用學過的英文自己接話。')+tabs+`<nav class="hi-options hi-challenge-nav" aria-label="綜合真人任務">${d.practice.conversations.map((t,i)=>button((i+1)+' · '+esc(t.label),`data-hi-live="${t.id}"`,`aria-pressed="${t.id===m.id}"`)).join('')}</nav><div class="hi-options hi-section-tabs" role="group" aria-label="真人接話方式">${button('有提示的整合','data-hi-practice="guided"',`aria-pressed="${practice==='guided'}"`)}${button('自主接話','data-hi-practice="independent"',`aria-pressed="${practice==='independent'}"`)}</div><div class="hi-pair-grid"><section class="panel"><p class="eyebrow">${esc(m.level)}</p><p class="task">${esc(m.task)}</p><section class="hi-role hi-say"><p class="dg-role">你先開口</p><h2>「${esc(m.opening)}」</h2><p>用自己的英文表達，不必逐字翻譯。</p></section>${facts(c)}<div class="hi-row"><h3>這次要完成的事</h3><span id="hi-live-count">${Object.values(flags).filter(Boolean).length} / ${d.goals.length} 項</span></div>${d.goals.map(g=>`<label class="hi-check hi-goal"><input type="checkbox" data-hi-live-goal="${g.id}" ${flags[g.id]?'checked':''}><span>${esc(g.text)}</span></label>${practice==='guided'?`<details class="hi-goal-hint"><summary>需要時看「${esc(g.text)}」的提示</summary>${hintFor(c.steps.find(s=>s.key===g.id),'live-'+key+'-'+g.id)}</details>`:''}`).join('')}<p class="fine">師生依實際溝通結果勾選，可以取消。取得並理解資訊就能確認，不要求逐句背完。</p><details><summary>記下一句真正用到的英文（選填）</summary>${field('live-'+key,'這一回的口說筆記')}</details>${practice==='independent'?`<details class="hi-student-help"><summary>卡住了：找需要的提示</summary>${hints(c.steps,'live-help-'+key)}</details>`:''}</section>${missionGuide(m)}</div>`;
 }
 function teacherGuide(c) {
  return `<details class="panel hi-teacher"><summary>老師接話卡 · 師生共看</summary><h3>先讓學生開口</h3><p>學生先說：「你好，我想辦理入住。」你可以回 <span lang="en">Welcome.</span>，再依尚未確認的資訊接話。</p><div class="hi-fact-tags"><span>早餐包含</span><span>${c.checkout} 點退房</span><span>電梯在${c.elevator}邊</span><span>房卡 305</span></div><p>姓名或晚數若已說清楚，直接接下一個尚未完成的目標。問早餐、退房與電梯的順序可以調整。</p><label class="hi-check"><input type="checkbox" data-hi-alternate ${alternate?'checked':''}>已先在第二部分聽過另外 3 種問法，這回可以使用</label><div class="hi-teacher-cards">${c.steps.map(s => {
   const alt = alternate && d.alternateQuestions.find(a => a.key===s.key), line = alt || s;
   return `<article><p class="eyebrow">${esc(s.askFirst?'學生'+s.label+'後':'需要確認：'+s.label)}</p><p class="hi-en" lang="en">${esc(line.line)}</p><p>${esc(line.zh)}</p>${audio(line.line)}</article>`;
  }).join('')}</div><details><summary>這回怎麼增加自主接話？</summary><p>學生已主動提供姓名與晚數時，就接護照。櫃檯也可先問晚數，再問姓名；資料確認完整後交給房卡。資訊都說清楚就完成，不要求把參考句逐字說完。</p><p>學生卡住時，先指出「還缺哪項資訊」，再讓他打開關鍵字。第一次先用熟悉問法，需要時才換問法。</p></details></details>`;
 }
 function legacyPairPage() {
  const c = scenario(pairId), key = pairId+'-'+practice, flags = saved.checks[key];
  return heading('抬頭，和老師完成整段對話','學生當旅客、老師當櫃檯。依實際對話勾選，不必照清單順序。') + `<div class="hi-options" role="group" aria-label="真人接話方式">${button('有提示的整合','data-hi-practice="guided"',`aria-pressed="${practice==='guided'}"`)}${button('自主接話','data-hi-practice="independent"',`aria-pressed="${practice==='independent'}"`)}</div>` + scenarioPicker(pairId,'pair') + `<div class="hi-pair-grid"><section class="panel"><p class="dg-role">你先開口</p><h2>「你好，我想辦理入住。」</h2><p>${practice==='guided'?'需要時逐項打開提示，再把整段連起來。':'看訂房資料和目標，自己決定下一句；已確認過的資訊不用重問。'}</p>${facts(c)}<div class="hi-row"><h3>這次要完成的事</h3><span id="hi-pair-count">${flags.filter(Boolean).length} / ${d.goals.length} 項</span></div>${d.goals.map((g,i) => `<label class="hi-check hi-goal"><input type="checkbox" data-hi-goal="${i}" ${flags[i]?'checked':''}><span>${esc(g.text)}</span></label>${practice==='guided'?`<details class="hi-goal-hint"><summary>需要時看「${esc(g.text)}」的提示</summary>${hintFor(c.steps[i],'pair-'+key+'-'+g.id)}</details>`:''}`).join('')}<p class="fine">目標由師生依實際表達確認，可以取消。這是本情境、本練法的紀錄。</p><details><summary>記下一句真正用到的英文（選填）</summary>${field('note-'+key,'這一回的口說筆記')}</details>${practice==='independent'?`<details class="hi-student-help"><summary>卡住了：找需要的提示</summary>${hints(c.steps,'independent-'+key)}</details>`:''}</section>${teacherGuide(c)}</div>`;
 }
 function progressPageIntegrated() {
  return heading('回到第一次的情境','先用自己的話完成，再一起看這次需要多少協助。') + `<section class="panel hi-say"><p class="dg-role">同一道整合任務</p><p class="task">${esc(d.task)}</p><details><summary>需要時查一個說法</summary>${hints(d.steps,'progress')}</details></section><div class="hi-grid"><section class="panel"><h2>第一次的我</h2><div class="readonly">${esc(saved.answers.before || '這次還沒有課前文字紀錄；可以直接口頭回顧。')}</div></section><section class="panel">${field('after','現在的我')}</section></div><section class="panel"><h2>這次需要多少協助？</h2><p>以剛才整段對話的表現判斷，不以按完流程或看過提示代替。</p>${d.skills.map(s => {
   const n = saved.ratings[s.id];
   return `<div class="rating hi-rating" data-level="${n}"><h3>${esc(s.text)}</h3><div class="meter" aria-label="${ratingNames[n]}">${[1,2,3].map(i => `<span class="${n>=i?(n===3?'green':'yellow'):''}"></span>`).join('')}</div><p>${ratingNames[n]}${n?' · '+n+' / 3 格':''}</p><div class="hi-options">${[1,2,3].map(i => button(ratingNames[i],`data-hi-rating="${s.id}:${i}"`,`aria-pressed="${n===i}"`)).join('')}</div></div>`;
  }).join('')}</section><section class="panel"><h2>一起說一句回饋</h2><p>這次哪一段能自己接下去？下次想把哪一個地方說得更順？</p><p class="fine">整合紀錄保存在目前瀏覽器，和原本 A～F 的逐步練習分開。</p></section>`;
 }
 function homePageIntegrated() {
  const c = scenario('nights');
  return heading('自己再完成一次入住','先聽關鍵資訊，再收起提示，把整段用自己的話說出來。') + `<div class="hi-grid"><section class="panel hi-hear"><h2>1. 聽懂這次的住宿資訊</h2>${d.quizzes.map(x => `<article class="hi-quiz"><h3>${esc(x.question)}</h3>${audio(x.line)}${transcriptFor(x)}<div class="hi-options">${x.options.map((o,i) => button(esc(o),`data-hi-quiz="${x.id}:${i}"`,`aria-pressed="${quizChoices[x.id]===i}"`)).join('')}</div><p role="status">${quizChoices[x.id]===undefined?'':quizChoices[x.id]===x.correct?'✓ '+esc(x.why):'再聽一次，留意時間或方向；也可以看文字後重選。'}</p></article>`).join('')}<label class="hi-check"><input type="checkbox" data-hi-home="listen" ${saved.home.listen?'checked':''}>我已練習聽懂時間與方向</label></section><section class="panel hi-say"><h2>2. 改住 3 晚，再說一整段</h2><p class="task">訂房姓名是 Alex Chen，這次住 3 晚。請從提出入住開始，接著報姓名、出示護照、說晚數，再詢問早餐、退房時間與電梯位置。</p><details><summary>需要時查一個說法</summary>${hints(c.steps,'home')}</details><details><summary>記下自己的版本（選填）</summary>${field('home','課後口說筆記')}</details><label class="hi-check"><input type="checkbox" data-hi-home="spoken" ${saved.home.spoken?'checked':''}>我已收起提示，大聲練完整段</label><p id="hi-home-count">已練習 ${Object.values(saved.home).filter(Boolean).length} / 2 項</p><p class="fine">沒有老師時，可停下來想像櫃檯會問什麼，再回答。需要聽櫃檯問題可回第二部分。</p></section></div>`;
 }
 function transferPage(){
  const c=d.practice.transfer;
  return heading('換一筆資料，再用一次','先聽懂這間飯店的資訊，再依新的訂房資料回答；口說以自己實際練習為準。')+`<div class="hi-grid"><section class="panel hi-hear"><h2>1. 聽懂這次的住宿資訊</h2><p>這間飯店的時間和方向，以這次聽到的內容為準。</p>${d.quizzes.map(x=>`<article class="hi-quiz"><h3>${esc(x.question)}</h3>${audio(x.line)}${transcriptFor(x)}<div class="hi-options">${x.options.map((o,i)=>button(esc(o),`data-hi-quiz="${x.id}:${i}"`,`aria-pressed="${quizChoices[x.id]===i}"`)).join('')}</div><p role="status">${quizChoices[x.id]===undefined?'':quizChoices[x.id]===x.correct?'✓ '+esc(x.why):'再聽一次，留意時間或方向；也可以看文字後重選。'}</p></article>`).join('')}<label class="hi-check"><input type="checkbox" data-hi-home="listen" ${saved.home.listen?'checked':''}>我已練習聽懂時間與方向</label><p class="fine">若使用文字協助，仍可完成練習；回顧時記得這次看過文字。</p></section><section class="panel"><h2>2. 對方換順序，我也能回答</h2>${facts(c)}<p>先聽一個問題，再依這張訂房卡直接回答。先別打開答案。</p>${['nights','passport','name'].map(key=>{const s=c.steps.find(t=>t.key===key);return `<article class="hi-quiz"><p class="dg-role">櫃檯問你</p>${audio(s.line)}${transcriptFor(s)}${hintFor(s,'home-v2-'+key)}</article>`;}).join('')}<section class="hi-role hi-say"><p class="hi-focus-cue">↓ 看這裡，換你說</p><p class="task">入住已完成。剛才已確認退房時間與電梯位置，現在想在飯店吃早餐，但不知道是否包含在房價裡。接下來你會問什麼？</p><details><summary>需要一點方向</summary><p>找出還不知道的住宿資訊。</p>${hintFor(c.steps.find(s=>s.key==='breakfast'),'home-gap')}</details></section><details><summary>記下自己的說法（選填）</summary>${field('home-transfer-v2','這次的新情境，我的說法')}</details><label class="hi-check"><input type="checkbox" data-hi-home-transfer ${saved.suite.homeSpoken?'checked':''}>我已依新資料開口回答，並補問缺少的資訊</label><p class="fine">這裡是預設問題的口說練習，不會辨識或評分你的聲音。下次上課再和老師試不同的接話。</p></section></div>${saved.answers.home||saved.home.spoken?`<details class="panel"><summary>先前「改住 3 晚」的課後紀錄</summary><p>這份紀錄來自先前 Alex Chen 的訂房練習。</p><div class="readonly">${esc(saved.answers.home||'已勾選完成口說練習。')}</div></details>`:''}`;
 }
 const views = [beforePage,studyPage,flowPage,changePage,pairPageIntegrated,progressPageIntegrated,transferPage];
 const descriptions = ['先試完整情境，再挑需要的句子','集中整理 A＋B＋C 的聽說內容','同一筆訂房，完成連續流程','一個情境、一個需求，用一句話表達','有提示或自主接話，和真人完成目標','同題比較，回顧整段溝通','自己再聽、說、用一次'];
 const bar = document.createElement('section'); bar.id = 'hi-mode-bar'; bar.className = 'hi-mode-bar'; bar.setAttribute('aria-label','第八課練習方式'); q('#dg-context').before(bar);
 const notice = document.createElement('div'); notice.id='hi-save-notice'; notice.className='notice'; notice.setAttribute('role','status'); notice.hidden=true; bar.after(notice);
 const groupBar=document.createElement('nav');groupBar.className='hi-group-switch';groupBar.setAttribute('aria-label','第八章綜合練習分組');notice.after(groupBar);
 function closeMenus() { q('#dg-day-picker').open=false; q('#dg-course-dialog').close(); }
 function moveFocus(selector) { const el=q(selector); if(el)el.focus({preventScroll:true}); }
 function redraw(selector) { render(); if(selector)moveFocus(selector); }
 function resetSupport() { dgResetSupport(); }
 function goSection(n) {
  if (!Number.isInteger(n) || n<0 || n>=views.length) return;
  stopAudio(); resetSupport(); section=n; closeMenus(); render(); focusMain(); dgScrollToLesson();
 }
 render = function() {
  document.body.classList.toggle('hi-active',active);
  bar.innerHTML=`<span class="hi-mode-caption">第 8 天 · 練習方式</span><div class="hi-options">${button('逐步練習','data-hi-mode="single"',`aria-pressed="${!active}"`)}${button('綜合練習 · A～F','data-hi-mode="integrated"',`aria-pressed="${active}"`)}</div>`;
  groupBar.hidden=!active;
  groupBar.innerHTML=active?groupDefs.map(g=>button(`<strong>${esc(g.title)}</strong><span>${g.sourceLabels.join('＋')}</span>`,`data-hi-group="${g.id}"`,`aria-pressed="${groupId===g.id}"`)).join(''):'';
  if (!active) { originalRender(); notice.hidden=true; return; }
  const currentGroup=groupDefs.find(g=>g.id===groupId),viewLabels=currentGroup.sections,caption=currentGroup.sourceLabels.join('＋')+' · '+currentGroup.title;
  const main=q('#main'); main.classList.toggle('lesson-phrase-page',section===1); main.dataset.lessonSection=String(section+1);
  main.innerHTML=`<div class="hi-content">${groupId==='checkin'?views[section]():extended.view(groupId,section)}${section===0?'':`<div class="footer-actions hi-section-footer">${go('← 上一部分',section-1)}${go(section===6?'回到本組首頁':'下一部分：'+viewLabels[section+1]+' →',section===6?0:section+1,'class="primary"')}</div>`}</div>`;
  q('#nav').innerHTML=`<p class="dg-menu-position">${esc(caption)}</p><div class="dg-section-list">${viewLabels.map((name,i) => button(`<span class="number">${String(i+1).padStart(2,'0')}</span>${esc(name)}`,`data-hi-page="${i}"`,section===i?'aria-current="step"':'')).join('')}</div>`;
  q('#dg-context').innerHTML=`<div class="dg-context-copy"><span class="dg-current-section">${String(section+1).padStart(2,'0')} · ${esc(viewLabels[section])}</span><span class="dg-current-round">${esc(caption)}</span></div><div class="dg-task-switch" role="group" aria-label="切換任務"><span class="dg-task-label">任務</span>${rounds.map((r,n)=>button(esc(taskLabel(r)),`data-hi-task="${n}"`,`aria-label="切換到任務 ${esc(taskLabel(r))}：${esc(r.name)}" aria-pressed="false"`)).join('')}</div>`;
  const menu=q('#dg-menu-open'); menu.textContent=`${String(section+1).padStart(2,'0')} · 綜合選單`; menu.setAttribute('aria-label','開啟綜合課程選單，目前第 '+(section+1)+' 部分'); menu.title=viewLabels[section];
  if(groupId==='checkin')storageMessage();else notice.hidden=true;
 };
 navigate = function(n) { if(active)goSection(n);else originalNavigate(n); };
 document.addEventListener('input',e => {
  const key=e.target.dataset.hiField;
  if(active && groupId==='checkin' && answerKeys.includes(key)) { saved.answers[key]=e.target.value; persist(); }
 });
 document.addEventListener('change',e => {
  if(!active||groupId!=='checkin')return;
  const el=e.target, x=el.dataset;
  if(x.hiChallengeGate){
   const f=challengeState,s=challenge().turns.find(t=>t.key===f.selected);if(!s||el.disabled)return;
   if(x.hiChallengeGate==='spoken')f.spoken=el.checked&&(s.askFirst||f.heard);
   if(x.hiChallengeGate==='heard')f.heard=el.checked&&(!s.askFirst||f.spoken);
   if(s.askFirst&&!f.spoken)f.heard=false;if(!s.askFirst&&!f.heard)f.spoken=false;f.choice=-1;
   redraw(`[data-hi-challenge-gate="${x.hiChallengeGate}"]`);return;
  }
  if(x.hiLiveGoal!==undefined){
   if(!d.goals.some(g=>g.id===x.hiLiveGoal))return;
   const flags=saved.suite.goals[liveId+'-'+practice];flags[x.hiLiveGoal]=el.checked;persist();
   q('#hi-live-count').textContent=Object.values(flags).filter(Boolean).length+' / '+d.goals.length+' 項';
   const guide=q('.hi-teacher'),open=guide.open;guide.outerHTML=missionGuide(liveTask());q('.hi-teacher').open=open;return;
  }
  if(x.hiHomeTransfer!==undefined){saved.suite.homeSpoken=el.checked;persist();return;}
  if(x.hiGate){
   const f=flowState,s=flowScenario().steps[f.index];
   if(f.done||el.disabled)return;
   if(x.hiGate==='spoken')f.spoken=el.checked&&(s.askFirst||f.heard);
   if(x.hiGate==='heard')f.heard=el.checked&&(!s.askFirst||f.spoken);
   if(s.askFirst&&!f.spoken)f.heard=false;
   if(!s.askFirst&&!f.heard)f.spoken=false;
   f.choice=-1;f.feedback='';f.history=f.history.slice(0,f.index);
   redraw(`[data-hi-gate="${x.hiGate}"]`);return;
  }
  if(x.hiGoal!==undefined){
   const i=Number(x.hiGoal);if(!Number.isInteger(i)||!d.goals[i])return;
   const flags=saved.checks[pairId+'-'+practice];flags[i]=el.checked;persist();q('#hi-pair-count').textContent=flags.filter(Boolean).length+' / '+d.goals.length+' 項';return;
  }
  if(x.hiHome&&Object.hasOwn(saved.home,x.hiHome)){saved.home[x.hiHome]=el.checked;persist();const count=q('#hi-home-count');if(count)count.textContent='已練習 '+Object.values(saved.home).filter(Boolean).length+' / 2 項';return;}
  if(x.hiAlternate!==undefined){alternate=el.checked;const guide=el.closest('.hi-teacher');guide.outerHTML=pairMode==='missions'?missionGuide(liveTask()):teacherGuide(scenario(pairId));q('#main .hi-teacher').open=true;moveFocus('[data-hi-alternate]');}
 });
 document.addEventListener('click',e => {
  const b=e.target.closest('button');if(!b||b.disabled)return;const x=b.dataset;
  if(x.hiMode){active=x.hiMode==='integrated';syncRoute();stopAudio();resetSupport();closeMenus();render();moveFocus(`[data-hi-mode="${x.hiMode}"]`);return;}
  if(!active)return;
  if(x.hiGroup){if(!groupDefs.some(g=>g.id===x.hiGroup))return;groupId=x.hiGroup;section=0;syncRoute();stopAudio();resetSupport();closeMenus();render();focusMain();dgScrollToLesson();return;}
  if(x.hiPage!==undefined){goSection(Number(x.hiPage));return;}
  if(x.hiTask!==undefined){const n=Number(x.hiTask);if(!Number.isInteger(n)||!rounds[n])return;active=false;syncRoute();stopAudio();resetSupport();closeMenus();setTaskRound(n);originalNavigate(section);moveFocus(`[data-dg-task="${n}"]`);return;}
  if(groupId!=='checkin')return;
  if(x.hiChallengeMode){if(!['integrated','single'].includes(x.hiChallengeMode))return;challengeMode=x.hiChallengeMode;stopAudio();resetSupport();redraw(`[data-hi-challenge-mode="${challengeMode}"]`);return;}
  if(x.hiChallenge){if(!d.practice.challenges.some(c=>c.id===x.hiChallenge))return;challengeId=x.hiChallenge;challengeState=newChallenge();stopAudio();resetSupport();render();moveFocus('.hi-challenge-title');return;}
  if(x.hiChallengeRestart!==undefined){challengeState=newChallenge();stopAudio();resetSupport();render();moveFocus('.hi-challenge-title');return;}
  if(x.hiIntent){
   const c=challenge(),f=challengeState;if(!c.choices.includes(x.hiIntent)||f.history.some(h=>h.key===x.hiIntent))return;
   if(!c.turns.some(t=>t.key===x.hiIntent)){f.selected=null;f.heard=false;f.spoken=false;f.choice=-1;f.feedback='這次的資訊缺口不在這裡。'+c.nudge;}
   else{f.selected=x.hiIntent;f.heard=false;f.spoken=false;f.choice=-1;f.feedback='先用自己的英文說，卡住時再打開提示。';}
   stopAudio();resetSupport();redraw(`[data-hi-intent="${x.hiIntent}"]`);return;
  }
  if(x.hiChallengeChoice!==undefined){const f=challengeState,s=challenge().turns.find(t=>t.key===f.selected),n=Number(x.hiChallengeChoice);if(!s||!f.heard||!f.spoken||!Number.isInteger(n)||!s.objects[n])return;f.choice=n;redraw(`[data-hi-challenge-choice="${n}"]`);return;}
  if(x.hiChallengeNext!==undefined){
   if(!challengeReady())return;const c=challenge(),f=challengeState,s=c.turns.find(t=>t.key===f.selected);
   f.history.push({key:s.key,fact:s.objects[f.choice][1]});f.selected=null;f.heard=false;f.spoken=false;f.choice=-1;f.feedback='剛才的資訊已記下。還需要確認什麼？';
   if(f.history.length===c.turns.length&&!saved.suite.done.includes(c.id)){saved.suite.done.push(c.id);persist();}
   stopAudio();resetSupport();render();focusMain();return;
  }
  if(x.hiLiveMode){if(!['missions','original'].includes(x.hiLiveMode))return;pairMode=x.hiLiveMode;stopAudio();resetSupport();redraw(`[data-hi-live-mode="${pairMode}"]`);return;}
  if(x.hiLive){if(!d.practice.conversations.some(c=>c.id===x.hiLive))return;liveId=x.hiLive;stopAudio();resetSupport();redraw(`[data-hi-live="${liveId}"]`);return;}
  if(x.hiRoute){if(!d.practice.flowRoutes.some(r=>r.id===x.hiRoute))return;flowRoute=x.hiRoute;flowState=newFlow();stopAudio();resetSupport();render();moveFocus('.hi-route-picker > summary');return;}

  if(x.hiSay!==undefined){const n=Number(x.hiSay);if(!Number.isInteger(n)||!d.sayPrompts[n])return;sayIndex=n;stopAudio();render();moveFocus('.say-prompt');return;}

  if(x.hiDirect!==undefined){practice='independent';goSection(4);return;}
  if(x.hiStudy){studyMode=x.hiStudy;stopAudio();resetSupport();redraw(`[data-hi-study="${studyMode}"]`);return;}
  if(x.hiReply!==undefined){const n=Number(x.hiReply);if(!Number.isInteger(n)||n<0||n>=d.steps.filter(s=>!s.askFirst).length)return;replyIndex=n;stopAudio();resetSupport();redraw('#main h2');focusMain();return;}
  for(const attr of ['hiFlowScenario','hiChange','hiPair'])if(x[attr]){
   const id=x[attr];if(!d.scenarios.some(s=>s.id===id)||attr==='hiChange'&&id==='original')return;
   if(attr==='hiFlowScenario'){flowId=id;flowState=newFlow();}
   if(attr==='hiChange')changeId=id;
   if(attr==='hiPair')pairId=id;
   stopAudio();resetSupport();render();moveFocus('#main .hi-picker > summary');return;
  }
  if(x.hiCarry){pairId=x.hiCarry;goSection(4);return;}
  if(x.hiPractice){practice=x.hiPractice;stopAudio();resetSupport();redraw(`[data-hi-practice="${practice}"]`);return;}
  if(x.hiChoice!==undefined){
   const f=flowState,s=flowScenario().steps[f.index],n=Number(x.hiChoice);
   if(f.done||!f.heard||!f.spoken||!Number.isInteger(n)||!s.objects[n])return;
   f.choice=n;f.history=f.history.slice(0,f.index);
   if(s.valid.includes(n)){f.history[f.index]=n;f.feedback='✓ 已記下：'+s.objects[n][1];}else f.feedback='再聽或讀一次，這個選擇不符合這次的資訊。';
   redraw(`[data-hi-choice="${n}"]`);return;
  }
  if(x.hiFlowNext!==undefined){
   if(!flowReady())return;stopAudio();resetSupport();const f=flowState;
   if(f.index===flowScenario().steps.length-1){f.done=true;if(flowRoute==='standard'&&!saved.complete.includes(flowId))saved.complete.push(flowId);const key=flowRoute+':'+flowId;if(!saved.suite.routes.includes(key))saved.suite.routes.push(key);persist();}
   else {f.index++;f.heard=false;f.spoken=false;f.choice=-1;f.feedback='';}
   render();focusMain();dgScrollToLesson();return;
  }
  if(x.hiFlowBack!==undefined){
   const f=flowState;if(f.done||f.index===0)return;stopAudio();resetSupport();f.index--;f.history=f.history.slice(0,f.index);f.heard=false;f.spoken=false;f.choice=-1;f.feedback='';render();focusMain();dgScrollToLesson();return;
  }
  if(x.hiFlowRestart!==undefined){stopAudio();resetSupport();flowState=newFlow();render();focusMain();dgScrollToLesson();return;}
  if(x.hiRating){const [id,value]=x.hiRating.split(':'),n=Number(value);if(!d.skills.some(s=>s.id===id)||![1,2,3].includes(n))return;saved.ratings[id]=n;persist();redraw(`[data-hi-rating="${x.hiRating}"]`);return;}
  if(x.hiQuiz){const [id,value]=x.hiQuiz.split(':'),n=Number(value),item=d.quizzes.find(s=>s.id===id);if(!item||!Number.isInteger(n)||!item.options[n])return;quizChoices[id]=n;redraw(`[data-hi-quiz="${x.hiQuiz}"]`);}
 });
})();
