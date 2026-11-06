// Optional entry before the travel tasks. This state is deliberately independent
// of course answers, task completion and the shared appearance preferences.
(() => {
 if(typeof day0Primer==='undefined'||!day0Primer.groups?.length)return;
 const data=day0Primer,lang=data.language;
 let opened=false,category=data.categories[0].id,groupId=data.groups[0].id;
 let screen='overview',kanaMode='hiragana',showRomaji=true,overviewScroll=0,overviewOrigin='';
 let assembled=new Set();
 const practiceEngine=globalThis.Day0Practice;
 const practiceKey=`travel-lab-${lang}-primer-practice-v1`,practiceConfigs=new Map(),previousPracticeKeys=new Map();
 let practiceSession=null,practiceScope='',practiceReturnY=0,practiceSaveWarning=false,practiceHistory={};
 try{const saved=JSON.parse(localStorage.getItem(practiceKey)||'null');if(saved?.version===1&&saved.results&&typeof saved.results==='object'&&!Array.isArray(saved.results))practiceHistory=saved.results;}catch{}
 const currentGroup=()=>data.groups.find(g=>g.id===groupId)||data.groups[0];
 const sound=item=>item.speakText||item.text;
 const main=()=>document.querySelector('#main');
 const focus=selector=>(document.querySelector(selector)||main())?.focus({preventScroll:true});
 const attr=value=>esc(value);
 const action=(label,name,value='',extra='')=>btn(label,`data-primer-${name}="${attr(value)}"`,extra);
 function resetExercise(){assembled=new Set();practiceSession=null;practiceScope='';}
 function redraw(selector){stopAudio();render();focus(selector||'#primerTitle');}
 function scrollToPrimer(){
  const inset=(document.querySelector('.top')?.getBoundingClientRect().height||0)+16;
  window.scrollTo({top:Math.max(0,window.scrollY+main().getBoundingClientRect().top-inset),behavior:'instant'});
 }
 const practiceAction=(label,name,value='',extra='')=>btn(label,`data-practice-${name}="${attr(value)}"`,extra);
 const currentPracticeScope=()=>screen==='overview'?'mixed':'group:'+groupId;
 function practiceConfig(scope=currentPracticeScope()){
  if(!practiceConfigs.has(scope)){
   const category=scope==='mixed'?(lang==='ja'&&kanaMode==='katakana'?'katakana':data.categories[0].id):currentGroup().category;
   practiceConfigs.set(scope,{category,groupIds:scope==='mixed'?[data.groups.find(g=>g.category===category).id]:[groupId],mode:'listen',limit:5});
  }
  return practiceConfigs.get(scope);
 }
 const supportsMatch=config=>lang==='ja'?['hiragana','katakana'].includes(config.category):['vowels','consonants'].includes(config.category);
 const practiceModeName=mode=>mode==='read'?'看字自己念':mode==='match'?(lang==='ja'?'平片對照':'看音節找字母'):'聽音選字';
 function practiceCount(config){
  return new Set(data.groups.filter(g=>config.groupIds.includes(g.id)).flatMap(g=>g.items.map(i=>i.text+'|'+sound(i)))).size;
 }
 function practiceLaunch(scope){
  const config=practiceConfig(scope),mixed=scope==='mixed',count=practiceCount(config),last=practiceHistory[scope];
  const modes=['listen','read',...(supportsMatch(config)?['match']:[])];
  const modesHtml=`<div class="pp-setting-title">練習方式</div><div class="pp-mode-grid">${modes.map(mode=>practiceAction(`<strong>${practiceModeName(mode)}</strong><small>${mode==='listen'?'聽聲音，選出對應的字':mode==='read'?'先自己念，再播放核對':lang==='ja'?'看另一種假名，找出對應字':'看完整音節，找出指定字母'}</small>`,'mode',mode,`aria-pressed="${config.mode===mode}"`)).join('')}</div>`;
  const selection=mixed?`<div class="pp-config"><div class="pp-setting-title">選擇複習範圍</div><div class="pp-category-tabs" aria-label="複習類別">${data.categories.map(c=>practiceAction(esc(c.title),'category',c.id,`aria-pressed="${config.category===c.id}"`)).join('')}</div><div class="pp-toolbar">${practiceAction('全選這一類','select','all')}${practiceAction('清除選取','select','none')}<span class="fine">已選 ${config.groupIds.length} 組</span></div><div class="pp-group-picker" aria-label="選擇要練習的組別，可複選">${data.groups.filter(g=>g.category===config.category).map(g=>practiceAction(`<span>${esc(g.title)}</span><small lang="${lang}">${esc(g.items.map(i=>i.text).join(' '))}</small>`,'group',g.id,`aria-pressed="${config.groupIds.includes(g.id)}"`)).join('')}</div></div>`:'';
  const lastLine=last&&Number.isInteger(last.total)&&last.total>0?`<p class="pp-last-result fine">上次這裡練了 ${last.total} 題${last.mode==='read'?`，自行確認會讀 ${Number(last.known)||0} 題`:`，第一次無提示答對 ${Number(last.firstCorrect)||0} 題`}。</p>`:'';
  return `<section class="panel primer-practice pp-launch" aria-labelledby="practiceTitle"><div class="pp-heading"><p class="eyebrow">練習一下 · 一次一小輪</p><h2 id="practiceTitle" tabindex="-1">${mixed?'混合練習一下':'剛剛的字，你認得嗎？'}</h2><p>${mixed?'選幾組熟悉的字，混在一起試試看。':'聽完這組，收起字卡，試著自己認出來。'}</p></div>${selection}${modesHtml}<div class="pp-toolbar"><span class="pp-setting-title">每輪題數</span>${[5,10].map(n=>practiceAction(n+' 題','limit',String(n),`aria-pressed="${config.limit===n}"`)).join('')}</div><div class="pp-start-row"><p class="fine">${count?`範圍內共 ${count} 個字，這輪練 ${Math.min(count,config.limit)} 題。`:'先選至少一組，就能開始。'}<br>可以隨時回去聽，不限重練次數。</p>${practiceAction(mixed?'開始混合練習 →':'開始本組小測驗 →','start',scope,`class="primary" ${count?'':'disabled'}`)}</div>${lastLine}</section>`;
 }
 function practiceAudio(q){return `<div class="actions pp-listen">${btn('▶ 播放聲音',`data-practice-audio="true" data-say="${attr(q.speakText)}"`,'aria-label="播放本題聲音"')}${btn('慢速播放',`data-practice-audio="true" data-say="${attr(q.speakText)}" data-slow="true"`,'aria-label="慢速播放本題聲音"')}</div>`;}
 function practiceReference(q){return `<div class="pp-reference" tabindex="-1"><p class="pp-reference-glyph" lang="${lang}">${esc(q.text)}${q.speakText!==q.text?` <span>→ ${esc(q.speakText)}</span>`:''}</p><p lang="${lang}-Latn">${esc(q.romaji)}</p><p>${esc(q.zh)}</p>${q.note?`<p class="fine">${esc(q.note)}</p>`:''}${practiceAudio(q)}</div>`;}
 function practiceQuestion(){
  const s=practiceSession,q=s.questions[s.index],r=s.records[s.index],reading=q.mode==='read';
  const choose=q.mode==='listen'?practiceAudio(q):`<p class="pp-question-glyph" lang="${lang}">${esc(reading?q.text:q.display)}</p>`;
  const options=!reading?`<div class="pp-options" aria-label="選擇答案">${q.options.map((option,i)=>practiceAction(`<span lang="${lang}">${esc(option.text)}</span><small>${String.fromCharCode(65+i)}${r.answer===i?(r.done?' · 答對了':' · 再試一次'):''}</small>`,'answer',String(i),`aria-pressed="${r.answer===i}" class="${r.answer===i?(r.done?'is-correct':'is-wrong'):''}" ${r.done?'disabled':''}`)).join('')}</div>`:'';
  const feedback=reading?(r.done?(r.rating==='known'?'已記下：這個我會讀。':'已記下：這個想再練。'):''):(r.done?(r.hint?'✓ 答對了，這題有使用提示，會放進再練清單。':r.first?'✓ 第一次就答對了。':'✓ 重試後答對了，這個字再複習一次。'):r.answer!==null?(q.mode==='match'?'再看看上方的字，換一個答案試試看。':'再聽一次，換一個答案試試看。'):'');
  const reference=(r.revealed||r.done)?practiceReference(q):'';
  const rate=reading&&r.revealed?`<div class="pp-self-rate">${practiceAction('✓ 這個我會讀','rate','known',`aria-pressed="${r.rating==='known'}" ${r.done?'disabled':''}`)}${practiceAction('↻ 這個再練','rate','again',`aria-pressed="${r.rating==='again'}" ${r.done?'disabled':''}`)}</div><p class="fine">自己和示範比較，不會自動判斷發音。</p>`:'';
  return `<section class="panel primer-practice pp-session" aria-labelledby="practiceTitle"><div class="pp-progress"><span>第 ${s.index+1} / ${s.questions.length} 題 · ${practiceModeName(q.mode)}</span>${practiceAction('結束這輪，回去聽','exit')}</div><div class="pp-progress-track" aria-hidden="true"><span style="width:${Math.round(s.index/s.questions.length*100)}%"></span></div><div class="pp-heading"><p class="eyebrow">${practiceScope==='mixed'?'混合練習':'本組小測驗'}</p><h2 id="practiceTitle" tabindex="-1">${esc(q.prompt)}</h2><p>${reading?'先自己念一次，再看讀音、播放示範。':q.mode==='listen'?'可以重播、慢速聽；準備好再選答案。':'看上面的字，選出下方對應的字形。'}</p></div>${choose}${options}<div class="pp-feedback" role="status">${feedback?`<p>${feedback}</p>`:''}</div>${reference}${rate}${q.outsideScope?'<p class="fine pp-scope-note">題目來自你選的範圍；選項搭配同類別其他字一起辨認。</p>':''}<div class="pp-question-actions">${!r.revealed&&!r.done?practiceAction(reading?'我念好了，看讀音':'需要提示：看答案','reveal'):''}${practiceAction(s.index+1===s.questions.length?'看這輪結果 →':'下一題 →','next','',`class="primary" ${r.done?'':'disabled'}`)}</div><p class="fine">${reading?'先核對示範，再選「會讀」或「再練」。':'第一次答對、重試與使用提示會分開記錄。'}</p></section>`;
 }
 function practiceResult(){
  const s=practiceSession,result=practiceEngine.summary(s),reading=s.questions.every(q=>q.mode==='read'),review=s.questions.filter(q=>result.reviewKeys.includes(q.id));
  const stats=reading?`<div class="pp-score"><strong>${result.known}</strong><span>自行確認會讀</span></div><div class="pp-score"><strong>${result.again}</strong><span>想再練</span></div>`:`<div class="pp-score"><strong>${result.firstCorrect} <small>/ ${result.total}</small></strong><span>第一次無提示答對</span></div><div class="pp-score"><strong>${result.corrected}</strong><span>重試或提示後完成</span></div>`;
  return `<section class="panel primer-practice pp-result" aria-labelledby="practiceTitle"><div class="pp-heading"><p class="eyebrow">這一輪完成了</p><h2 id="practiceTitle" tabindex="-1">${review.length?'把這幾個字再帶走一次':'這輪的字都走過了'}</h2><p>${reading?'這是你和示範比較後的自評。':'第一次作答和後續練習分開計算，答錯後仍可以學會。'}</p></div><div class="pp-score-grid">${stats}</div>${review.length?`<h3>值得再練的字</h3><div class="pp-review-list">${review.map(q=>`<span lang="${lang}">${esc(q.text)}</span>`).join('')}</div>`:'<p>這輪沒有待重練的字，可以換一輪，或回去聽其他組。</p>'}<div class="pp-result-actions">${review.length?practiceAction('只練這 '+review.length+' 個字','retry','mistakes','class="primary"'):''}${practiceAction('換一輪練習','retry','new',review.length?'':'class="primary"')}${practiceAction(practiceScope==='mixed'?'返回總覽與範圍設定':'回去聽這一組','exit')}</div><p class="fine">${practiceSaveWarning?'這次結果暫時無法儲存；仍可繼續練習。':'已保存這裡最近一輪的練習結果。'}</p></section>`;
 }
 function practiceBlock(scope){return !practiceEngine?'':practiceSession&&practiceScope===scope?(practiceSession.finished?practiceResult():practiceQuestion()):practiceLaunch(scope);}
 function redrawPractice(selector='#practiceTitle',scroll=false){
  redraw(selector);
  if(scroll){const box=main().querySelector('.primer-practice');if(box)window.scrollTo({top:Math.max(0,window.scrollY+box.getBoundingClientRect().top-(document.querySelector('.top')?.getBoundingClientRect().height||0)-16),behavior:'instant'});}
 }
 function startPractice(scope,onlyKeys){
  if(!practiceEngine||scope!==currentPracticeScope())return;
  const config=practiceConfig(scope),questions=practiceEngine.buildRound(data,{...config,onlyKeys,limit:config.limit,previousKeys:onlyKeys?[]:previousPracticeKeys.get(scope)||[]});
  if(!questions.length)return;
  if(!practiceSession)practiceReturnY=window.scrollY;
  previousPracticeKeys.set(scope,questions.map(q=>q.id));practiceScope=scope;practiceSession=practiceEngine.createSession(questions);practiceSaveWarning=false;redrawPractice('#practiceTitle',true);
 }
 function savePracticeResult(){
  const config=practiceConfig(practiceScope),result=practiceEngine.summary(practiceSession);
  practiceHistory[practiceScope]={...result,mode:config.mode,groupIds:[...config.groupIds]};
  try{localStorage.setItem(practiceKey,JSON.stringify({version:1,results:practiceHistory}));}catch{practiceSaveWarning=true;}
 }
 function practiceClick(d){
  if(!Object.keys(d).some(key=>key.startsWith('practice')))return false;
  if(d.practiceAudio!==undefined)return true;
  const scope=currentPracticeScope(),config=practiceConfig(scope);
  if(d.practiceExit!==undefined){practiceSession=null;practiceScope='';redrawPractice();window.scrollTo({top:practiceReturnY,behavior:'instant'});return true;}
  if(d.practiceStart!==undefined){startPractice(d.practiceStart);return true;}
  if(d.practiceRetry!==undefined){if(practiceSession?.finished){const keys=d.practiceRetry==='mistakes'?practiceEngine.summary(practiceSession).reviewKeys:undefined;if(!keys||keys.length)startPractice(practiceScope,keys);}return true;}
  if(practiceSession&&practiceScope===scope){
   if(practiceSession.finished)return true;
   if(d.practiceAnswer!==undefined){practiceEngine.answer(practiceSession,Number(d.practiceAnswer));redrawPractice(practiceSession.records[practiceSession.index].done?'[data-practice-next]':`[data-practice-answer="${d.practiceAnswer}"]`);}
   else if(d.practiceReveal!==undefined){practiceEngine.reveal(practiceSession);redrawPractice('.pp-reference');}
   else if(d.practiceRate!==undefined){practiceEngine.rate(practiceSession,d.practiceRate);redrawPractice('[data-practice-next]');}
   else if(d.practiceNext!==undefined&&practiceEngine.next(practiceSession)){if(practiceSession.finished)savePracticeResult();redrawPractice('#practiceTitle',true);}
   return true;
  }
  if(d.practiceMode!==undefined){if(['listen','read',...(supportsMatch(config)?['match']:[])].includes(d.practiceMode))config.mode=d.practiceMode;}
  else if(d.practiceLimit!==undefined){const n=Number(d.practiceLimit);if([5,10].includes(n))config.limit=n;}
  else if(scope==='mixed'&&d.practiceCategory!==undefined){if(data.categories.some(c=>c.id===d.practiceCategory)){config.category=d.practiceCategory;config.groupIds=[data.groups.find(g=>g.category===config.category).id];if(!supportsMatch(config)&&config.mode==='match')config.mode='listen';}}
  else if(scope==='mixed'&&d.practiceGroup!==undefined){if(data.groups.some(g=>g.category===config.category&&g.id===d.practiceGroup))config.groupIds=config.groupIds.includes(d.practiceGroup)?config.groupIds.filter(id=>id!==d.practiceGroup):[...config.groupIds,d.practiceGroup];}
  else if(scope==='mixed'&&d.practiceSelect!==undefined){config.groupIds=d.practiceSelect==='all'?data.groups.filter(g=>g.category===config.category).map(g=>g.id):[];}
  const key=Object.keys(d).find(key=>key.startsWith('practice')),name=key?.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
  const y=window.scrollY;redrawPractice(name?`[data-${name}="${d[key]}"]`:'#practiceTitle');window.scrollTo({top:y,behavior:'instant'});return true;
 }
 function entryCard(){
  return `<section class="panel primer-entry" aria-labelledby="primerEntryTitle"><div><p class="eyebrow">文字與發音</p><h2 id="primerEntryTitle">${lang==='ko'?'韓文字母與拼讀地圖':'日文五十音總覽'}</h2><p>${lang==='ko'?'先看完整母音與子音，選一組聽音，再試著拼成一格字。':'先看完整平假名、片假名，點字聽音，再選一行練習。'}</p><p class="fine">不必先學完字音，也可以直接開始旅行對話。</p></div><div class="actions">${action('認識文字與發音 →','open','true','class="primary"')}</div></section>`;
 }
 function mapSound(item,paired){
  const glyph=paired?`<span class="primer-map-pair"><span>${esc(item.text)}</span><span>${esc(paired.text)}</span></span>`:`<span>${esc(item.text)}</span>`;
  return `<button type="button" class="primer-map-sound" data-primer-sound="${attr(item.text)}" data-say="${attr(sound(item))}" data-primer-meaning="${attr(item.text+(paired?'／'+paired.text:'')+'：'+item.zh)}" aria-label="${attr('聽 '+item.text+(paired?'／'+paired.text:'')+(item.sampleLabel?'，拼讀示範 '+sound(item):''))}"><span class="primer-map-glyph" lang="${lang}">${glyph}</span><span class="primer-romaji" lang="${lang}-Latn">${esc(item.romaji)}</span>${item.sampleLabel?`<span class="primer-map-sample" lang="ko">${esc(sound(item))}</span>`:''}</button>`;
 }
 function groupLink(g,label=g.title){
  return action(`<span>${esc(label)}</span><span class="primer-map-go">練習 →</span>`,'group',g.id,`class="primer-map-group" aria-label="${attr('練習 '+label)}"`);
 }
 function kanaOverview(){
  const script=kanaMode==='katakana'?'katakana':'hiragana';
  const groups=data.groups.filter(g=>g.category===script);
  const paired=g=>kanaMode==='compare'?data.groups.find(x=>x.id===g.id.replace('hiragana-','katakana-')):null;
  const rowName=g=>kanaMode==='compare'?g.title.replace('行','')+'／'+paired(g).title:g.title;
  const rows=groups.filter(g=>!g.overviewStandalone).map(g=>{
   const columns=g.overviewColumns||g.items.map((_,i)=>i),pair=paired(g);
   return `<tr data-primer-row="${attr(g.id)}"><th scope="row">${groupLink(g,rowName(g))}</th>${[0,1,2,3,4].map(column=>{const i=columns.indexOf(column);return i<0?'<td class="primer-map-empty"><span aria-label="此欄沒有基本假名">—</span></td>':`<td>${mapSound(g.items[i],pair?.items[i])}</td>`;}).join('')}</tr>`;
  }).join('');
  const standalone=groups.filter(g=>g.overviewStandalone).map(g=>`<div class="primer-kana-n">${groupLink(g,rowName(g))}${mapSound(g.items[0],paired(g)?.items[0])}<p>自己占一拍的鼻音。</p></div>`).join('');
  return `<div class="primer-script-tabs" aria-label="選擇字表">${[['hiragana','平假名'],['katakana','片假名'],['compare','平片對照']].map(([id,label])=>action(label,'script',id,`aria-pressed="${kanaMode===id}"`)).join('')}</div><div class="primer-map-caption"><p>${kanaMode==='compare'?'46 組對照 · 上方平假名，下方片假名':'基本 '+(script==='hiragana'?'平假名':'片假名')+' 46 字'}</p><span class="fine">點字聽音 · 點行名練習</span></div><div class="primer-table-scroll" tabindex="0" role="region" aria-label="五十音字表，可橫向捲動"><table class="primer-kana-table"><caption class="primer-sr-only">${kanaMode==='compare'?'平假名與片假名對照表':script==='hiragana'?'平假名表':'片假名表'}</caption><thead><tr><th scope="col">選一行</th>${['a','i','u','e','o'].map(v=>`<th scope="col" lang="ja-Latn">${v}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>${standalone}<p class="fine primer-map-note">這是基本五十音表；長音、小字與旅行詞可從下方繼續認識。</p>`;
 }
 function koreanOverview(){
  const sections=[['vowels','basic','基本母音','先從這 10 個開始'],['vowels','extended','延伸母音','再認識另外 11 個母音字母'],['consonants','basic','基本子音','搭配母音，聽完整音節'],['consonants','extended','雙子音','再認識 5 個雙子音']];
  return `<div class="primer-map-caption"><p>母音 21 個 · 子音 19 個</p><span class="fine">點字聽拼讀示範 · 選組進入練習</span></div><p class="fine primer-map-note">字母會組成一格音節。下方小字是拼讀示範，不是字母名稱；從基本字母開始，再往延伸字母前進。</p><div class="primer-alphabet-grid">${sections.map(([cat,level,title,note])=>{
   const groups=data.groups.filter(g=>g.category===cat&&(g.overviewSection||'basic')===level);
   return `<section class="primer-alphabet-section" data-primer-section="${cat}-${level}" aria-labelledby="primer-${cat}-${level}"><header><h2 id="primer-${cat}-${level}">${title}<span>${groups.reduce((n,g)=>n+g.items.length,0)} 個</span></h2><p class="fine">${note}</p></header>${groups.map(g=>`<div class="primer-alphabet-group"><div class="primer-alphabet-letters">${g.items.map(i=>mapSound(i)).join('')}</div>${groupLink(g)}</div>`).join('')}</section>`;
  }).join('')}</div>`;
 }
 function overviewPage(){
  const more=data.groups.filter(g=>g.category===(lang==='ja'?'use':'build'));
  return `<section class="primer-overview" aria-label="完整字音總覽"><div class="primer-overview-toolbar"><p>先看全貌，再選一組。每次練一小組就好。</p>${action(showRomaji?'隱藏羅馬字':'顯示羅馬字','romaji','',`aria-pressed="${showRomaji}"`)}</div><p class="primer-map-selection fine" role="status">點字聽音，這裡會顯示剛才點選的字。</p><div class="primer-map-audio"></div><section class="panel primer-map-panel">${lang==='ja'?kanaOverview():koreanOverview()}</section><section class="primer-more" aria-labelledby="primerMoreTitle"><h2 id="primerMoreTitle">${lang==='ja'?'把字音帶進旅行':'接著，拼成字與旅行詞'}</h2><div class="primer-more-grid">${more.map(g=>`<article class="panel primer-more-card"><p class="primer-more-preview" lang="${lang}">${esc(g.items.map(i=>i.text).join(' · '))}</p><h3>${esc(g.title)}</h3><p class="fine">${esc(g.description)}</p>${action('進入這組 →','group',g.id)}</article>`).join('')}</div></section></section>`;
 }
 function letterCard(item,index){
  const key=groupId+':'+index,isBuilt=!item.parts||assembled.has(key);
  const pieces=item.parts?`<div class="primer-parts" aria-label="組字材料">${item.parts.map((p,i)=>`<span lang="ko">${esc(p)}</span>${i<item.parts.length-1?'<b aria-hidden="true">＋</b>':''}`).join('')}</div>`:'';
  const context=attr(item.text+'：'+item.zh);
  const listen=`<div class="actions primer-card-play"><button type="button" class="primer-letter-button" data-say="${attr(sound(item))}" data-primer-meaning="${context}" aria-label="${attr('聽'+(item.sampleLabel?'拼讀示範 '+sound(item):' '+item.text))}"><span class="primer-glyph" lang="${lang}">${esc(item.text)}</span>${item.sampleLabel?`<span class="primer-demo">${esc(item.sampleLabel)}：<b lang="${lang}">${esc(sound(item))}</b></span>`:''}<span class="primer-romaji" lang="${lang}-Latn">${esc(item.romaji)}</span><span class="primer-play-label">▶ 點字聽</span></button>${btn('慢速',`data-say="${attr(sound(item))}" data-slow="true" data-primer-meaning="${context}"`,'class="primer-slow"')}</div>`;
  return `<article class="primer-letter-card" data-primer-card="${attr(key)}">${pieces}${isBuilt?listen:`<div class="primer-build-placeholder">${action('拼起來看','assemble',String(index))}</div>`}${item.parts?(isBuilt?'<p class="fine">'+esc(item.zh)+'</p>':''):item.sampleLabel?'':`<p class="fine">${esc(item.zh)}</p>`}${item.note?`<p class="primer-note">${esc(item.note)}</p>`:''}</article>`;
 }
 function cards(){
  const g=currentGroup(),sequence=g.items.map(sound).join(' ');
  const context=attr('依序認讀：'+g.items.map(i=>i.text+'（'+i.romaji+'）').join('、'));
  return `${g.sequence?`<div class="actions primer-sequence">${btn(lang==='ja'&&g.category!=='use'?'▶ 整行連播':'▶ 本組依序聽',`data-primer-sequence="true" data-say="${attr(sequence)}" data-primer-meaning="${context}"`)}${btn('慢速連播',`data-primer-sequence="true" data-say="${attr(sequence)}" data-slow="true" data-primer-meaning="${context}"`)}</div>`:''}<div class="primer-letter-grid ${g.items.some(i=>i.parts)?'primer-builder-grid':''}">${g.items.map(letterCard).join('')}</div><p class="fine primer-footnote">${lang==='ko'?'羅馬字協助起步；先聽完整音節，再對照韓文字母。':'羅馬字協助起步；先聽再跟讀，不必先背完整張表。'}</p>`;
 }
 function primerPage(){
  const g=currentGroup(),groups=data.groups.filter(x=>x.category===category),at=groups.findIndex(x=>x.id===groupId);
  const active=practiceSession&&practiceScope===currentPracticeScope();
  const title=active?'字音小練習':screen==='overview'?(lang==='ja'?'日文五十音總覽':'韓文字母與拼讀地圖'):g.title;
  const header=`<header class="primer-header"><div class="primer-header-actions">${screen==='detail'||active?action('← 返回完整總覽','overview'):'<span class="eyebrow">文字與發音 · 完整總覽</span>'}${action('返回旅行會話 →','close','true')}</div><h1 id="primerTitle" tabindex="-1">${esc(title)}</h1>${screen==='detail'&&!active?`<p class="fine">${esc(data.categories.find(c=>c.id===category)?.title||'')} · 小組 ${at+1} / ${groups.length}</p>`:''}</header>`;
  const detail=`<div class="primer-study-content"><section class="panel primer-workspace primer-detail"><p class="primer-group-description">${esc(g.description)}</p><details class="primer-other-groups"><summary>換一組練習</summary><div class="primer-groups" aria-label="選擇一小組">${groups.map(x=>action(esc(x.title),'group',x.id,`aria-pressed="${groupId===x.id}"`)).join('')}</div></details>${cards()}</section></div>${practiceBlock('group:'+groupId)}<div class="primer-footer">${action('← 上一組','group',groups[at-1]?.id||'',at===0?'disabled':'')}${at+1<groups.length?action('下一小組 →','group',groups[at+1].id):action('返回完整總覽 →','overview')}</div>`;
  const content=active?practiceBlock(currentPracticeScope()):screen==='overview'?`<div class="primer-study-content">${overviewPage()}</div>${practiceBlock('mixed')}`:detail;
  return `<div class="day0-primer${showRomaji?'':' hide-primer-romaji'}">${header}${content}</div>`;
 }
 const baseRender=render;
 render=function(){
  baseRender();
  document.body.classList.toggle('primer-active',opened);
  if(opened){
   main().innerHTML=primerPage();
   document.querySelectorAll('#nav [aria-current]').forEach(b=>b.removeAttribute('aria-current'));
   const menu=document.querySelector('#dg-menu-open');if(menu){menu.textContent='旅行會話選單';menu.title='開啟旅行會話的七步選單';menu.setAttribute('aria-label','開啟旅行會話的七步選單');}
   return;
  }
  if(page===0){const hero=main().querySelector('.hero');if(hero)hero.insertAdjacentHTML('afterend',entryCard());else main().insertAdjacentHTML('afterbegin',entryCard());}
 };
 const baseNavigate=navigate;
 navigate=function(p){
  if(!Number.isInteger(p)||p<0||p>=course.labels.length)return;
  opened=false;resetExercise();
  baseNavigate(p);
 };
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  const d=b.dataset;
  if(d.primerOpen!==undefined){opened=true;screen='overview';overviewOrigin='';resetExercise();redraw();if(window.matchMedia('(max-width:1100px)').matches){const menu=document.querySelector('#courseMenu');if(menu)menu.open=false;}scrollToPrimer();return;}
  if(d.primerClose!==undefined){navigate(0);return;}
  if(!opened)return;
  if(practiceClick(d))return;
  if(d.primerOverview!==undefined){screen='overview';resetExercise();redraw(overviewOrigin?`[data-primer-group="${overviewOrigin}"]`:'#primerTitle');window.scrollTo({top:overviewScroll,behavior:'instant'});return;}
  if(d.primerScript!==undefined){if(!['hiragana','katakana','compare'].includes(d.primerScript))return;kanaMode=d.primerScript;redraw(`[data-primer-script="${kanaMode}"]`);return;}
  if(d.primerRomaji!==undefined){showRomaji=!showRomaji;const y=window.scrollY;redraw('[data-primer-romaji]');window.scrollTo({top:y,behavior:'instant'});return;}
  if(d.primerMeaning){
   // A shared recording such as 이 can also mean a number elsewhere. Keep its
   // meaning local to this letter exercise without changing the lesson lexicon.
   const translation=main().querySelector('.follow-translation');
   if(translation)translation.textContent=d.primerMeaning;
   const follow=main().querySelector('.follow-along');
   if(follow){
    follow.classList.add('primer-follow');
    // The original cards below already provide individual playback. Treat the
    // moving follow tokens as a reading guide, avoiding unrelated word popups.
    follow.querySelectorAll('.follow-token').forEach(token=>{token.disabled=true;token.removeAttribute('aria-haspopup');token.removeAttribute('aria-expanded');});
    // Keep the real audio player's panel connected without inserting a large
    // transcript above the map or altering table geometry on every click.
    if(d.primerSound!==undefined)main().querySelector('.primer-map-audio')?.append(follow);
   }
   if(d.primerSound!==undefined){const selected=main().querySelector('.primer-map-selection');if(selected)selected.textContent='剛才點選：'+(showRomaji?d.primerMeaning:d.primerSound+(lang==='ko'?' · 拼讀示範 '+d.say:''));}
   return;
  }
  if(d.primerGroup!==undefined){
   const g=data.groups.find(x=>x.id===d.primerGroup);if(!g)return;
   if(screen==='overview'){overviewScroll=window.scrollY;overviewOrigin=g.id;}
   screen='detail';groupId=g.id;category=g.category;resetExercise();redraw();scrollToPrimer();return;
  }
  if(d.primerAssemble!==undefined){
   const n=Number(d.primerAssemble),item=currentGroup().items[n];if(!Number.isInteger(n)||!item?.parts)return;
   assembled.add(groupId+':'+n);redraw(`[data-primer-card="${groupId}:${n}"] .primer-letter-button`);
  }
 });
})();
