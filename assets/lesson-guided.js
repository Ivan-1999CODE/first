// Shared presentation for Days 2–14. The authored curriculum and saved keys
// remain in the existing task runtime.
const dgLabels=['先試著說','句子與短對話','跟著做','只換一個條件','和老師練','看看進步','課後再練'];
let dgHintIndex=0,dgScope='',dgHints=new Map(),dgTranscript=false;
function dgResetSupport(){dgHints.clear();dgTranscript=false;}
function guidedHint(words,answer,answerZh='',id='auto-'+dgHintIndex++){
 const key=String(id),level=dgHints.get(key)||0;
 const panes=[`<p class="dg-hint-empty">用你記得的英文說就可以。</p>`,`<p class="eyebrow">把這些字組起來</p><p class="dg-en dg-keywords" lang="en">${esc(words)}</p>`,`<p class="dg-en en" lang="en">${esc(answer)}</p>${answerZh?`<p class="reference-translation" lang="zh-Hant">${esc(answerZh)}</p>`:''}<div class="dg-hint-audio">${audio(answer)}<span class="fine">參考說法，不必逐字相同。</span></div>`];
 return `<div class="dg-hint" data-hint-key="${esc(key)}"><div class="dg-hint-tabs" role="group" aria-label="提示程度">${['自己說','關鍵字','看整句'].map((label,i)=>btn(label,`data-guide-hint="${esc(key)}" data-level="${i}"`,`aria-pressed="${level===i}"`)).join('')}</div><div class="dg-hint-stage">${panes.map((pane,i)=>`<div class="dg-hint-pane" data-pane="${i}" aria-hidden="${level!==i}" ${level===i?'':'inert'}>${pane}</div>`).join('')}</div></div>`;
}
hint=function(words,answer,answerZh){return guidedHint(words,answer,answerZh)};
function dgTaskTabs(items,key,current,ids){return ids.length>1?tabs(items,key,current):'';}
function dgListening(t,role=t.role||activeRound().role||course.replyRole){
 return `<div class="dg-listening"><div class="dg-listen-actions">${btn('▶ 播放',`data-say="${esc(t.line)}"`,`aria-label="播放${esc(role)}的回應"`)}${btn('慢速',`data-say="${esc(t.line)}" data-slow="true"`)}${btn(dgTranscript?'收起文字':'看文字','data-dg-transcript',`aria-pressed="${dgTranscript}"`)}</div><div class="dg-hint-stage dg-transcript"><div class="dg-hint-pane" aria-hidden="${dgTranscript}" ${dgTranscript?'inert':''}><p class="dg-hint-empty">先聽一句，聽懂意思就好。<br>需要時可以看文字。</p></div><div class="dg-hint-pane" aria-hidden="${!dgTranscript}" ${dgTranscript?'':'inert'}><p class="dg-en en" lang="en">${esc(t.line)}</p><p class="flow-translation">${esc(t.zh)}</p></div></div></div>`;
}
function dgCourseMenu(){
 return `<p class="dg-menu-position">任務 ${esc(taskLabel(activeRound()))} · ${esc(activeRound().name)}</p><div class="dg-section-list">${dgLabels.map((label,p)=>btn(`<span class="number">${String(p+1).padStart(2,'0')}</span>${esc(label)}`,`data-page="${p}"`,page===p?'aria-current="step"':'')).join('')}</div>`;
}
function dgTaskSwitch(){return `<div class="dg-task-switch" role="group" aria-label="切換任務"><span class="dg-task-label">任務</span>${rounds.map((r,n)=>btn(esc(taskLabel(r)),`data-dg-task="${n}"`,`aria-label="任務 ${esc(taskLabel(r))}：${esc(r.name)}" aria-pressed="${taskRound===n}"`)).join('')}</div>`;}
function dgInstallShell(){
 document.body.classList.add('lesson-guided');document.documentElement.setAttribute('data-lesson-guided','');
 const currentDay=$('.day-switcher-links a[aria-current=page]'),dayName=`第 ${course.day} 天 · ${currentDay?.querySelector('small')?.textContent||course.title}`;
 const top=$('.top-inner'),brand=top.querySelector(':scope > div:first-child');brand.classList.add('dg-brand');brand.querySelector('.top-label').textContent=dayName;
 top.querySelector('.tools').insertAdjacentHTML('afterbegin',btn('☰ 課程選單','id="dg-menu-open"','aria-haspopup="dialog" aria-controls="dg-course-dialog"'));
 const dialog=document.createElement('dialog');dialog.id='dg-course-dialog';dialog.setAttribute('aria-labelledby','dg-menu-title');
 dialog.innerHTML=`<div class="dg-dialog-heading"><div><p class="eyebrow">${esc(dayName)}</p><h2 id="dg-menu-title">選擇章節</h2></div>${btn('關閉 ×','id="dg-menu-close"')}</div>`;
 document.body.append(dialog);dialog.append($('#courseMenu'));$('#courseMenu').open=true;
 const dayNav=$('.day-switcher'),dayLinks=dayNav.querySelector('.day-switcher-links');dayNav.id='dg-days';dayNav.setAttribute('aria-label','切換天數');
 dayNav.innerHTML=`<details id="dg-day-picker"><summary><span class="dg-day-caption">切換天數</span><span class="dg-day-current">${esc(dayName)}</span></summary><div class="dg-days-grid"></div><div class="dg-days-footer"><button type="button" id="dg-days-close">收起天數 ↑</button></div></details>`;
 dayNav.querySelector('.dg-days-grid').append(dayLinks);
 const dayPicker=$('#dg-day-picker');
 const closeDays=()=>{dayPicker.open=false;dayPicker.querySelector('summary').focus({preventScroll:true});dayPicker.scrollIntoView({block:'start',behavior:'instant'});};
 $('#dg-days-close').addEventListener('click',closeDays);
 dayPicker.addEventListener('keydown',e=>{if(e.key==='Escape'&&dayPicker.open){e.preventDefault();closeDays();}});
 dayPicker.addEventListener('toggle',()=>{if(dayPicker.open)stopAudio();});
 const context=document.createElement('div');context.className='dg-context';context.id='dg-context';context.dataset.manyTasks=String(rounds.length>4);$('.layout').before(context);
 const status=document.createElement('div');status.id='dg-announcement';status.className='dg-sr-only';status.setAttribute('role','status');status.setAttribute('aria-live','polite');document.body.append(status);
 $('#dg-menu-open').addEventListener('click',()=>{stopAudio();dayPicker.open=false;$('#courseMenu').open=true;dialog.showModal();dialog.scrollTop=0;});
 $('#dg-menu-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});
 compact.addEventListener('change',()=>queueMicrotask(()=>{$('#courseMenu').open=true}));
}
const dgOriginalReviewScope=reviewScope;
reviewScope=function(){return `<details class="dg-review-options" ${reviewMode==='mixed'?'open':''}><summary>${reviewMode==='mixed'?'正在複習多個已學任務':'需要時：一起複習已學任務'}</summary>${dgOriginalReviewScope()}</details>`;};
const dgOriginalFooter=taskFooter;
taskFooter=function(){
 if(page===0)return `<div class="footer-actions dg-entry-next">${btn('前進：學這個任務的句子 →','data-page="1"','class="primary"')}</div>`;
 const wrapper=document.createElement('div');wrapper.innerHTML=dgOriginalFooter();
 const nextButton=wrapper.querySelector('.footer-actions > button:last-child');
 if(page===2&&!finished)nextButton?.remove();else nextButton?.classList.add('primary');
 return wrapper.innerHTML;
};
render=function(){
 const scope=[taskRound,page,mode,reply,mission,pair,flow,turn,finished,heard,spoken].join(':');
 if(scope!==dgScope){dgResetSupport();dgScope=scope;}dgHintIndex=0;
 dgLabels[3]=activeRound().variationMode==='repeat'?'再練同一段':activeRound().variationMode==='core'?'練另一段對話':'只換一個條件';
 const views=[intro,phrasePage,scenePage,missionPage,pairPage,progressPage,homePage];
 $('#main').innerHTML=views[page]()+taskFooter();$('#main').classList.toggle('lesson-phrase-page',page===1);$('#main').dataset.lessonSection=String(page+1);
 if(page===0){const first=$('#main .before-panel'),footer=$('#main > .footer-actions');if(first&&footer)first.after(footer);}
 $('#nav').innerHTML=dgCourseMenu();
 $('#dg-context').innerHTML=`<div class="dg-context-copy"><span class="dg-current-section">${String(page+1).padStart(2,'0')} · ${dgLabels[page]}</span><span class="dg-current-round">${esc(taskLabel(activeRound()))} · ${esc(activeRound().name)}</span></div>${dgTaskSwitch()}`;
 const switcher=$('.dg-task-switch'),active=switcher.querySelector('[aria-pressed=true]');if(active)switcher.scrollLeft=Math.max(0,active.offsetLeft-switcher.offsetLeft-switcher.clientWidth+active.offsetWidth+8);
 showStorage();
};
function dgScrollToLesson(){const top=$('#dg-context').getBoundingClientRect().top+scrollY-$('.top').getBoundingClientRect().height;window.scrollTo({top:Math.max(0,top),behavior:'instant'});}
navigate=function(p){if(!Number.isInteger(p)||p<0||p>=dgLabels.length)return;stopAudio();dgResetSupport();page=p;$('#dg-day-picker').open=false;$('#dg-course-dialog').close();render();focusMain();dgScrollToLesson();};
focusSceneStep=function(){focusMain();dgScrollToLesson();};
// The current role and its interaction panel stay together on a tablet.
if(typeof tabletScene!=='undefined'&&typeof placeSceneControls==='function')tabletScene.removeEventListener('change',placeSceneControls);
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.dataset.guideHint!==undefined){
  const key=b.dataset.guideHint,level=Number(b.dataset.level),box=b.closest('.dg-hint');if(![0,1,2].includes(level)||!box)return;
  dgHints.set(key,level);box.querySelectorAll('[data-guide-hint]').forEach(el=>el.setAttribute('aria-pressed',String(Number(el.dataset.level)===level)));
  box.querySelectorAll('[data-pane]').forEach(el=>{const hidden=Number(el.dataset.pane)!==level;el.setAttribute('aria-hidden',String(hidden));el.inert=hidden;});
  $('#dg-announcement').textContent=['已收起提示','已顯示關鍵字','已顯示參考說法'][level];
 }
 if(b.hasAttribute('data-dg-transcript')){dgTranscript=!dgTranscript;render();$('[data-dg-transcript]')?.focus({preventScroll:true});}
 if(b.dataset.dgTask!==undefined){const n=Number(b.dataset.dgTask);if(!Number.isInteger(n)||!rounds[n]||n===taskRound)return;setTaskRound(n);navigate(page);$(`[data-dg-task="${n}"]`)?.focus({preventScroll:true});$('#dg-announcement').textContent=`已切換到任務 ${taskLabel(activeRound())}，${dgLabels[page]}`;}
});
document.addEventListener('change',e=>{
 if(page!==2||!['heard','spoken'].includes(e.target.id)||!matchMedia('(max-width:739px)').matches)return;
 const region=$(heard&&spoken?'.scene-board':'.dg-speaker');if(!region)return;region.tabIndex=-1;region.focus({preventScroll:true});window.scrollTo({top:Math.max(0,region.getBoundingClientRect().top+scrollY-$('.top').getBoundingClientRect().height-12),behavior:'instant'});
});
dgInstallShell();
