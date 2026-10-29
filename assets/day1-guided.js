// Day 1 presentation layer. The curriculum, storage keys and learning state stay in the existing runtime.
const dgLabels=['先試著說','句子與短對話','跟著做','只換一個條件','和老師練','看看進步','課後再練','整合挑戰'];
let dgHintIndex=0,dgScope='',dgHints=new Map(),dgTranscript=false;
function dgResetSupport(){dgHints.clear();dgTranscript=false;}
function guidedHint(words,answer,answerZh='',id='auto-'+dgHintIndex++){
 const key=String(id),level=dgHints.get(key)||0;
 const zh=answerZh||(typeof answerTranslations==='object'?answerTranslations[answer]||'':'');
 const panes=[`<p class="dg-hint-empty">用你記得的英文說就可以。</p>`,
  `<p class="eyebrow">把這些字組起來</p><p class="dg-en dg-keywords" lang="en">${esc(words)}</p>`,
  `<p class="dg-en en" lang="en">${esc(answer)}</p>${zh?`<p class="reference-translation" lang="zh-Hant">${esc(zh)}</p>`:''}<div class="dg-hint-audio">${audio(answer)}<span class="fine">參考說法，不必逐字相同。</span></div>`];
 return `<div class="dg-hint" data-hint-key="${esc(key)}"><div class="dg-hint-tabs" role="group" aria-label="提示程度">${['自己說','關鍵字','看整句'].map((label,i)=>btn(label,`data-guide-hint="${esc(key)}" data-level="${i}"`,`aria-pressed="${level===i}"`)).join('')}</div><div class="dg-hint-stage">${panes.map((pane,i)=>`<div class="dg-hint-pane" data-pane="${i}" aria-hidden="${level!==i}" ${level===i?'':'inert'}>${pane}</div>`).join('')}</div></div>`;
}
hint=function(words,answer,answerZh){return guidedHint(words,answer,answerZh)};

function dgMap(f=flows[flow],values=history,done=finished){
 let point=[210,315,'起點'];
 f.steps.forEach((t,i)=>{if(t.valid.includes(values[i])&&t.position)point=t.position;});
 const [x,y,label]=point,draw=y!==315,plotY=y===90?72:y===215?146:215;
 const destination=f.destination||'郵局',stationRight=f.mapMode==='station';
 return `<div class="scene-state dg-map-state"><div class="dg-map" data-map-mode="${stationRight?'station':'post'}" role="img" aria-label="教學示意地圖：面朝上，${stationRight?'火車站在右前方，郵局在左前方':'火車站在左前方，郵局在右前方'}，公車站在左側。${esc(label)}。"><svg class="dg-map-roads" viewBox="0 0 420 250" preserveAspectRatio="none" aria-hidden="true"><rect class="dg-map-block" x="22" y="106" width="140" height="64" rx="16"/><rect class="dg-map-block" x="258" y="106" width="140" height="64" rx="16"/><path class="dg-road" d="M 85 72 H 335 M 210 72 V 215"/><path class="dg-road-line" d="M 85 72 H 335 M 210 72 V 215"/>${draw?`<polyline class="dg-route" points="210,215 210,${plotY} ${x},${plotY}"/>`:''}<circle class="dg-route-pin" cx="${x}" cy="${plotY}" r="7"/></svg><div class="dg-map-place dg-map-station"><span aria-hidden="true">▥</span>火車站</div><div class="dg-map-place dg-map-post"><span aria-hidden="true">✉</span>郵局</div><div class="dg-map-place dg-map-bus"><span aria-hidden="true">▤</span>公車站</div><div class="dg-map-origin">起點 · 面朝上 ↑</div></div><p class="dg-map-status">${draw||values.some(Number.isInteger)?'✓ '+esc(label):'目的地：'+destination}${done?' · 流程完成':''}</p></div>`;
}
lessonScene=function(f,values,done){return dgMap(f,values,done)};

// A begins with listening and pointing before the three taught learner lines.
let dgPrelude={done:false,heard:false,choice:null};
function dgResetPrelude(){dgPrelude={done:false,heard:false,choice:null};}
function dgPreludePage(f){
 const p=f.prelude,s=dgPrelude,correct=s.choice===p.correct;
 return `<div class="dg-grid scene-grid task-scene"><section class="panel dg-panel dg-speaker dg-listener"><p class="dg-role">對方 · 路人先問</p><h1 class="dg-task">先聽懂，指出你想去的地方</h1>${dgListening(p)}${check('data-dg-prelude-heard','我已聽完，或已讀完文字',s.heard)}<p>${esc(p.task)}</p></section><section class="panel dg-panel scene-board"><h2>你想去火車站</h2>${dgMap(f,[],false)}<div class="objects">${p.objects.map(([,label],i)=>btn(esc(label),`data-dg-prelude-choice="${i}"`,`class="object" aria-pressed="${s.choice===i}" ${s.heard?'':'disabled'}`)).join('')}</div><p class="dg-feedback" role="status">${s.choice===null?'先聽讀，再指出目的地。':correct?'✓ 已指出火車站。接著用本任務教過的句子問路、確認方向，最後道謝。':'這次想去火車站；請再指出一次。'}</p>${btn('已指出目的地，開始問路 →','data-dg-prelude-next',`class="primary" ${s.heard&&correct?'':'disabled'}`)}</section></div>`;
}

function dgListening(t){
 return `<div class="dg-listening"><div class="dg-listen-actions">${btn('▶ 播放',`data-say="${esc(t.line)}"`,'aria-label="播放路人回應"')}${btn('慢速',`data-say="${esc(t.line)}" data-slow="true"`)}${btn(dgTranscript?'收起文字':'看文字','data-dg-transcript',`aria-pressed="${dgTranscript}"`)}</div><div class="dg-hint-stage dg-transcript"><div class="dg-hint-pane" aria-hidden="${dgTranscript}" ${dgTranscript?'inert':''}><p class="dg-hint-empty">先聽一句，聽懂意思就好。<br>需要時可以看文字。</p></div><div class="dg-hint-pane" aria-hidden="${!dgTranscript}" ${dgTranscript?'':'inert'}><p class="dg-en en" lang="en">${esc(t.line)}</p><p class="flow-translation">${esc(t.zh)}</p></div></div></div>`;
}
scenePage=function(){
 const f=flows[flow],t=currentStep();
 if(f.prelude&&turn===0&&!finished&&!dgPrelude.done)return dgPreludePage(f);
 if(finished)return `<div class="dg-grid dg-completion"><section class="panel dg-panel"><p class="dg-role">✓ 本輪流程完成</p><h1 class="dg-task">${esc(f.summary)}</h1><div class="dg-completed-lines">${f.steps.map(t=>`<p class="dg-en" lang="en">${esc(t.answer)}</p>`).join('')}</div><p>再練同一段，試著少看一層提示。</p><div class="actions">${btn('收起提示再練一次',`data-start="${focusRound}"`)}${btn('只換一個條件 →','data-page="3"','class="primary"')}</div><p class="fine">完成標記會保留；是否熟悉，仍由師生在第六部分確認。</p></section><section class="panel dg-panel"><h2>這次的路線</h2>${sceneState()}</section></div>`;
 const student=t.askFirst?!spoken:heard,role=student?'你 · 旅客':`對方 · ${course.replyRole}`;
 const confirmed=heard&&spoken;
 return `<div class="dg-grid scene-grid task-scene"><section class="panel dg-panel dg-speaker ${student?'':'dg-listener'}" aria-label="當前對話"><div class="dg-role-row"><p class="dg-role">${esc(role)}</p><span class="fine">對話 ${turn+1} / ${f.steps.length}</span></div><h1 class="dg-task">${student?esc(t.task):'聽聽路人怎麼說'}</h1>${student?guidedHint(t.words,t.answer,t.answerZh,'flow-'+f.id+'-'+turn):dgListening(t)}<div class="dg-turn-confirm">${student?check('id="spoken"','我說好了，聽路人回應 →',spoken):check('id="heard"',heard?'已聽／讀完，接著點選':'我已聽完，或已讀完文字 →',heard)}${!student&&t.askFirst?`<div class="dg-repeat-confirm">${check('id="spoken"','已開口（取消可重說）',spoken)}</div>`:''}</div><div class="dg-flow-back">${btn('← 上一段','data-act="back"',turn===0?'disabled':'')}${btn('重新開始本輪',`data-start="${focusRound}"`,'class="dg-quiet"')}</div></section><section class="panel dg-panel scene-board" aria-label="情境操作"><div class="dg-role-row"><h2>${confirmed?'點選符合回覆的物件':student?'看情境，先開口':'聽懂後，在這裡點選'}</h2><span class="fine">示意地圖</span></div>${sceneState()}${student?`<div class="dg-scene-context"><p>${esc(f.context)}</p><p class="fine">先把題目的意思說出口，再聽路人回應。</p></div>`:`<div class="objects">${t.objects.map(([,label],i)=>btn(`<span class="dg-object-label">${esc(label)}${choice===i?(accepted(t,i)?' ✓':' · 再試一次'):''}</span>`,`data-choice="${i}"`,`class="object ${choice===i&&!accepted(t,i)?'dg-choice-wrong':''}" aria-pressed="${choice===i}" ${confirmed?'':'disabled'}`)).join('')}</div><div id="flowFeedback" class="dg-feedback" role="status">${feedback?`<p class="feedback ${accepted(t,choice)?'':'retry'}">${esc(feedback)}</p>`:`<p class="fine">${confirmed?'選一個符合剛才回覆的選項。':'先確認聽讀，再選擇物件。'}</p>`}</div><div class="dg-flow-actions">${btn(turn===f.steps.length-1?'完成這段對話 →':'接著，說下一句 →','data-act="next"',`class="primary" ${canNext()?'':'disabled'}`)}</div>`}</section></div>`;
};

// Choose the task beside the lesson; the course menu only selects a section.
function dgCourseMenu(){
 const sections=dgLabels.slice(0,7).map((label,p)=>btn(`<span class="number">${String(p+1).padStart(2,'0')}</span>${esc(label)}`,`data-page="${p}"`,page===p?'aria-current="step"':'')).join('');
 return `<p class="dg-menu-position">任務 ${esc(currentRound().id)} · ${esc(currentRound().name)}</p><div class="dg-section-list">${sections}</div><div class="dg-capstone-menu"><p class="dg-kicker">全課整合 · 老師決定何時帶入</p>${btn('<span class="number">08</span>整合挑戰','data-page="7"',page===7?'aria-current="step"':'')}</div>`;
}
function dgTaskSwitch(){
 return `<div class="dg-task-switch" role="group" aria-label="切換任務"><span class="dg-task-label">任務</span>${rounds.map((r,n)=>btn(esc(r.id),`data-dg-task="${n}"`,`aria-label="任務 ${esc(r.id)}：${esc(r.name)}" aria-pressed="${page!==7&&focusRound===n}"`)).join('')}</div>`;
}
function dgInstallShell(){
 document.body.classList.add('day1-guided');document.documentElement.setAttribute('data-day1-guided','');
 const top=$('.top-inner'),brand=top.querySelector(':scope > div:first-child');
 brand.classList.add('dg-brand');brand.querySelector('.top-label').textContent='第 1 天 · 問路與求助';
 top.querySelector('.tools').insertAdjacentHTML('afterbegin',btn('☰ 課程選單','id="dg-menu-open"','aria-haspopup="dialog" aria-controls="dg-course-dialog"'));
 const dialog=document.createElement('dialog');dialog.id='dg-course-dialog';dialog.setAttribute('aria-labelledby','dg-menu-title');
 dialog.innerHTML=`<div class="dg-dialog-heading"><div><p class="eyebrow">第 1 天 · 問路與求助</p><h2 id="dg-menu-title">選擇章節</h2></div>${btn('關閉 ×','id="dg-menu-close"')}</div>`;
 document.body.append(dialog);dialog.append($('#courseMenu'));$('#courseMenu').open=true;
 const dayNav=$('.day-switcher'),dayLinks=dayNav.querySelector('.day-switcher-links');
 dayNav.id='dg-days';dayNav.setAttribute('aria-label','切換天數');
 dayNav.innerHTML='<details id="dg-day-picker"><summary><span class="dg-day-caption">切換天數</span><span class="dg-day-current">第 1 天 · 問路與求助</span></summary><div class="dg-days-grid"></div><div class="dg-days-footer"><button type="button" id="dg-days-close">收起天數 ↑</button></div></details>';
 dayNav.querySelector('.dg-days-grid').append(dayLinks);
 const dayPicker=$('#dg-day-picker');
 const closeDays=()=>{dayPicker.open=false;dayPicker.querySelector('summary').focus({preventScroll:true});dayPicker.scrollIntoView({block:'start',behavior:'instant'});};
 $('#dg-days-close').addEventListener('click',closeDays);
 dayPicker.addEventListener('keydown',e=>{if(e.key==='Escape'&&dayPicker.open){e.preventDefault();closeDays();}});
 dayPicker.addEventListener('toggle',()=>{if(dayPicker.open)stopAudio();});
 const context=document.createElement('div');context.className='dg-context';context.id='dg-context';$('.layout').before(context);
 const status=document.createElement('div');status.id='dg-announcement';status.className='dg-sr-only';status.role='status';status.setAttribute('aria-live','polite');document.body.append(status);
 $('#dg-menu-open').addEventListener('click',()=>{stopAudio();dayPicker.open=false;$('#courseMenu').open=true;dialog.showModal();dialog.scrollTop=0;});
 $('#dg-menu-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
 compact.addEventListener('change',()=>queueMicrotask(()=>{$('#courseMenu').open=true}));
}

// Preserve the original data-driven footer and its early-close action, with a single primary next step.
const dgOriginalFooter=focusFooter;
focusFooter=function(){
 if(page===7)return '';
 if(page===0)return `<div class="footer-actions">${btn('前進：學這個任務的句子 →','data-page="1"','class="primary"')}</div>`;
 const wrapper=document.createElement('div');wrapper.innerHTML=dgOriginalFooter();
 // A former mixed-review preference never changes the current round's footer.
 if(page===5)wrapper.querySelector('.footer-actions > button:last-child').textContent=`只練任務 ${currentRound().id} 的回家挑戰 →`;
 wrapper.querySelector('.footer-actions > button:last-child')?.classList.add('primary');
 // Part 3 already has its own visible next step. The next section appears on completion.
 if(page===2&&!finished)wrapper.querySelector('.footer-actions > button:last-child')?.remove();
 if(page===2&&finished)wrapper.querySelector('.footer-actions > button:last-child')?.classList.remove('primary');
 return wrapper.innerHTML;
};
render=function(){
 const scope=[focusRound,page,mode,reply,mission,pair,flow,turn,finished,spoken,page===7?capstoneContext():''].join(':');
 if(scope!==dgScope){dgResetSupport();dgScope=scope;}dgHintIndex=0;
 const views=[intro,phrasePage,scenePage,missionPage,pairPage,progressPage,homePage,capstonePage];
 $('#main').innerHTML=views[page]()+focusFooter();$('#main').classList.toggle('lesson-phrase-page',page===1);
 // Keep the first lesson action beside the first attempt, before optional overviews.
 if(page===0){const first=$('#main .before-panel'),footer=$('#main > .footer-actions');if(first&&footer)first.after(footer);}
 $('#nav').innerHTML=dgCourseMenu();
 $('#dg-context').innerHTML=`<div class="dg-context-copy"><span class="dg-current-section">${String(page+1).padStart(2,'0')} · ${dgLabels[page]}</span><span class="dg-current-round">${page===7?'自己完成一趟問路':`${esc(currentRound().id)} · ${esc(currentRound().name)}`}</span></div>${dgTaskSwitch()}`;
 showStorage();
};
navigate=function(p){
 if(!Number.isInteger(p)||p<0||p>=dgLabels.length)return;
 if(p===7&&page!==7)resetCapstone();
 stopAudio();dgResetSupport();page=p;$('#dg-day-picker').open=false;$('#dg-course-dialog').close();render();focusMain();
 const top=$('#dg-context').getBoundingClientRect().top+scrollY-($('.top').getBoundingClientRect().height||0);
 window.scrollTo({top:Math.max(0,top),behavior:'instant'});
};
focusSceneStep=function(){focusMain();const top=$('#dg-context').getBoundingClientRect().top+scrollY-($('.top').getBoundingClientRect().height||0);window.scrollTo({top:Math.max(0,top),behavior:'instant'});};
// The old portrait relocation is intentionally replaced: the scene stays beside the current speaker.
tabletScene.removeEventListener('change',placeSceneControls);

// On a phone, follow the learner's explicit confirmation to the next working area.
function dgFocusMobileRegion(selector){
 if(!matchMedia('(max-width:739px)').matches)return;
 const region=document.querySelector(selector);if(!region)return;
 region.tabIndex=-1;region.focus({preventScroll:true});
 const top=region.getBoundingClientRect().top+scrollY-$('.top').getBoundingClientRect().height-12;
 window.scrollTo({top:Math.max(0,top),behavior:'instant'});
}
document.addEventListener('change',e=>{
 if(e.target.hasAttribute('data-dg-prelude-heard')){
  dgPrelude.heard=e.target.checked;dgPrelude.choice=null;render();
  $('[data-dg-prelude-heard]')?.focus({preventScroll:true});
 }
 if(page===2&&['heard','spoken'].includes(e.target.id)){
  dgFocusMobileRegion(heard&&spoken?'.scene-board':'.dg-speaker');
 }
 if(page===7&&e.target.matches('[data-cap-heard]')){
  dgFocusMobileRegion(capstoneState.heard?'.cap-board':'.cap-dialogue');
 }
});

document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.dataset.dgPreludeChoice!==undefined){
  const p=flows[flow]?.prelude,i=Number(b.dataset.dgPreludeChoice);
  if(p&&dgPrelude.heard&&Number.isInteger(i)&&p.objects[i]){dgPrelude.choice=i;render();$(`[data-dg-prelude-choice="${i}"]`)?.focus({preventScroll:true});}
 }
 if(b.hasAttribute('data-dg-prelude-next')&&dgPrelude.heard&&dgPrelude.choice===flows[flow]?.prelude?.correct){dgPrelude.done=true;dgResetSupport();render();focusSceneStep();}
 if(b.dataset.guideHint!==undefined){
  const key=b.dataset.guideHint,level=Number(b.dataset.level),box=b.closest('.dg-hint');if(![0,1,2].includes(level)||!box)return;
  dgHints.set(key,level);box.querySelectorAll('[data-guide-hint]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.level)===level)));
  box.querySelectorAll('[data-pane]').forEach(el=>{const hidden=Number(el.dataset.pane)!==level;el.setAttribute('aria-hidden',String(hidden));el.inert=hidden;});
  $('#dg-announcement').textContent=['已收起提示','已顯示關鍵字','已顯示參考說法'][level];
 }
 if(b.hasAttribute('data-dg-transcript')){dgTranscript=!dgTranscript;render();$('[data-dg-transcript]')?.focus({preventScroll:true});}
 if(b.dataset.dgTask!==undefined){
  const n=Number(b.dataset.dgTask);
  if(!Number.isInteger(n)||!rounds[n]||(n===focusRound&&page!==7))return;
  if(n!==focusRound){setRound(n);dgResetPrelude();}
  navigate(page===7?0:page);
  $(`[data-dg-task="${n}"]`)?.focus({preventScroll:true});
  $('#dg-announcement').textContent=`已切換到任務 ${currentRound().id}，${String(page+1).padStart(2,'0')} ${dgLabels[page]}`;
 }
});
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;
 if(['start','focusRound','beforeRound','repeatRound'].some(k=>b.dataset[k]!==undefined))dgResetPrelude();
},true);
dgInstallShell();
