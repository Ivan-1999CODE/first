// Japanese/Korean navigation follows the English lesson shell. Data and all
// pre-existing save keys stay with their original tasks, regardless of labels.
// The shared shell now delegates navigation helpers to lesson-navigation.js.
// Day 0 deliberately retains its seven-step dialog and A–J task buttons.
// Function declarations are hoisted in the combined script so the shell can
// install them before this language-specific presentation is initialized.
function dgInstallNavigation(){
 const menu=$('#dg-menu-open'),dialog=$('#dg-course-dialog');
 menu.setAttribute('aria-expanded','false');
 menu.addEventListener('click',()=>menu.setAttribute('aria-expanded','true'));
 dialog.addEventListener('close',()=>{
  menu.setAttribute('aria-expanded','false');
  if(!document.activeElement||document.activeElement===document.body||dialog.contains(document.activeElement))menu.focus({preventScroll:true});
 });
}
function dgStickyHeight(){return $('.top').getBoundingClientRect().height;}
function dgScrollLesson(){
 const top=$('#dg-context').getBoundingClientRect().top+scrollY-dgStickyHeight();
 window.scrollTo({top:Math.max(0,top),behavior:'instant'});
}
function dgSetMenuLabel(){
 const label=taskLabel(activeRound()),menu=$('#dg-menu-open');
 menu.textContent=`${String(page+1).padStart(2,'0')} · ${label} 選單`;
 menu.setAttribute('aria-label',`開啟課程選單，目前任務 ${label}，第 ${page+1} 部分：${dgLabels[page]}`);
 menu.title=`任務 ${label} · ${dgLabels[page]} · 開啟課程選單`;
 const switcher=$('.dg-task-switch'),active=switcher?.querySelector('[aria-pressed=true]');
 if(active)switcher.scrollLeft=Math.max(0,active.offsetLeft-switcher.offsetLeft-switcher.clientWidth+active.offsetWidth+8);
}
document.body.classList.add('day0-guided');
course.labels.splice(0,course.labels.length,...dgLabels);
const day0LanguageName=language==='ko'?'韓文':'日文';
$('.dg-brand .top-label').textContent=course.title;
$('.dg-day-caption').textContent='切換教材';
$('.dg-day-current').textContent=course.title;
$('#dg-days').setAttribute('aria-label','切換教材');
$('#dg-days-close').textContent='收起教材 ↑';
$('#dg-menu-title').textContent='這個任務的七步練習';
$('#dg-course-dialog .dg-dialog-heading .eyebrow').textContent=course.title;
dgCourseMenu=function(){
 return `<p class="dg-menu-position">任務 ${esc(taskLabel(activeRound()))} · ${esc(activeRound().name)}</p><div class="dg-section-list">${dgLabels.map((label,p)=>btn(`<span class="number">${String(p+1).padStart(2,'0')}</span>${esc(label)}`,`data-page="${p}"`,page===p?'aria-current="step"':'')).join('')}</div>`;
};
const day0BaseTaskFooter=taskFooter;
taskFooter=function(){
 return page===0?`<div class="footer-actions dg-entry-next">${btn('前進：學這個任務的句子 →','data-page="1"','class="primary"')}</div>`:day0BaseTaskFooter();
};

// The visible task buttons follow topic order; their data values still point
// at the original array indices so a saved numeric task position stays valid.
dgTaskSwitch=function(){
 return `<div class="dg-task-switch" role="group" aria-label="切換任務"><span class="dg-task-label">任務</span>${microOrderedRounds.map(r=>btn(esc(taskLabel(r)),`data-dg-task="${rounds.indexOf(r)}"`,`aria-label="任務 ${taskLabel(r)}：${esc(r.name)}" aria-pressed="${r===activeRound()}"`)).join('')}</div>`;
};
dgLessonOverview=function(){
 return course.taskGroups.map(g=>`<section class="task-chapter"><header><h2>${esc(g.name)}</h2><p>${esc(g.description)}</p></header><div class="cards">${g.roundIds.map(id=>dgLessonRoundCard(rounds.find(r=>r.id===id))).join('')}</div></section>`).join('');
};
intro=function(){
 const r=activeRound(),c=r.entryCheckpoint,group=practicalChapter();
 const art=studyArtwork.images[studyArtwork.byRound[taskRound].other];
 return `<section class="hero dg-lesson-cover" aria-labelledby="dg-lesson-title"><div class="dg-cover-copy"><p class="eyebrow">${day0LanguageName}旅行會話 · ${esc(group.name)}</p><h1 id="dg-lesson-title">${esc(r.name)}</h1><p class="d5-cover-subtitle">一次練一個任務，跟著七步慢慢說。</p></div><div class="dg-cover-art dg-course-art"><img src="${art}" width="150" height="150" alt=""></div></section>
 <section class="panel dg-panel dg-task-panel before-panel dg-quick-start"><p class="dg-role">你先說</p><h2>任務 ${esc(taskLabel(r))}：先試一句</h2><p class="task">${esc(c.task)}</p><p class="fine">可以先口頭試說；還不會也沒關係，接著一起學。</p><details class="dg-entry-note"><summary>記下第一次的說法（選填）</summary>${field('entry-before-'+r.id,'第一次的嘗試')}<p class="fine">第六步會回到同一道題，比較現在的說法。</p></details></section>
 <details class="panel dg-overview"><summary>任務概覽與入口 · 買東西／吃東西／找地方</summary><p>先試一句 → 學句子 → 跟著做 → 看情境自己選用 → 和老師練 → 看看進步 → 課後再練。</p>${dgLessonOverview()}</details>
 <details class="panel day0-reference"><summary>原有句表與延伸說法 · 老師需要時再查</summary><p>熟悉目前任務後，再挑需要的句子延伸。</p><div class="inventory inventory-scroll"><table><thead><tr><th>用途</th><th>說法</th><th>中文</th></tr></thead><tbody>${originalPhrases.map(p=>`<tr><td>${esc(p.use||'延伸')}</td><td lang="${language}">${esc(p.en)}</td><td>${esc(p.zh)}</td></tr>`).join('')}</tbody></table></div>${optionalTravelPhrases?microStudySupplement(optionalTravelPhrases):''}</details>`;
};

// A named task picker keeps the subject and task separate from the seven steps.
const day0TaskDialog=document.createElement('dialog');
day0TaskDialog.id='day0-task-dialog';day0TaskDialog.setAttribute('aria-labelledby','day0-task-title');
day0TaskDialog.innerHTML='<div class="dg-dialog-heading"><h2 id="day0-task-title">選擇今天的任務</h2><button type="button" id="day0-task-close">關閉 ×</button></div><div id="day0-task-options"></div>';
document.body.append(day0TaskDialog);
function day0TaskOptions(){
 return course.taskGroups.map(g=>`<section class="day0-task-group"><h3>${esc(g.name)}</h3><p class="fine">${esc(g.description)}</p><div class="day0-task-options">${g.roundIds.map(id=>{const r=rounds.find(r=>r.id===id);return btn(`<strong>${taskLabel(r)}</strong><span>${esc(r.name)}${roundsDone.includes(r.id)?'<small>✓ 師生已確認熟悉</small>':''}</span>`,`data-day0-task="${rounds.indexOf(r)}"`,`aria-pressed="${r===activeRound()}"`);}).join('')}</div></section>`).join('');
}
const day0BaseNavigate=navigate;
navigate=function(n){day0TaskDialog.close();day0BaseNavigate(n);};
$('#day0-task-close').addEventListener('click',()=>day0TaskDialog.close());
day0TaskDialog.addEventListener('click',event=>{
 if(event.target!==day0TaskDialog)return;
 const r=day0TaskDialog.getBoundingClientRect();
 if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)day0TaskDialog.close();
});
document.addEventListener('click',event=>{
 const b=event.target.closest('button');if(!b||b.disabled)return;
 if(b.id==='day0-task-open'){
  stopAudio();$('#dg-day-picker').open=false;
  $('#day0-task-options').innerHTML=day0TaskOptions();day0TaskDialog.showModal();day0TaskDialog.scrollTop=0;
 }
 if(b.dataset.day0Task!==undefined){
  const n=Number(b.dataset.day0Task);if(!Number.isInteger(n)||!rounds[n])return;
  setTaskRound(n);persistRound();dgResetStudyReply();navigate(0);
 }
 // Shared English task buttons do not persist their index themselves.
 if(b.dataset.dgTask!==undefined)persistRound();
 if(b.dataset.guideHint!==undefined)stopAudio();
});

// Keep reading support and the local glossary available in the English layout.
const day0BaseGuidedHint=guidedHint;
guidedHint=function(words,answer,answerZh='',id){
 return day0BaseGuidedHint(words,answer,answerZh||answerTranslations[answer]||'',id)
  .replace('<div class="dg-hint-audio">',reading(answer)+'<div class="dg-hint-audio">');
};
supportCard=()=>''; // The shared day0 tools below provide these same phrases once.
const day0BaseHomePage=homePage;
homePage=function(){
 const content=day0BaseHomePage(),r=activeRound(),next=microOrderedRounds[microOrderedRounds.indexOf(r)+1];
 return content+`<section class="panel day0-next-task"><h2>${next?'熟悉後，再練下一個任務':'這一組任務都走過了'}</h2>${next?btn(`先試任務 ${taskLabel(next)}：${esc(next.name)} →`,`data-before-round="${rounds.indexOf(next)}"`,roundsDone.includes(r.id)?'class="primary"':'disabled'):'<p>可以從任務選單挑一段，再收起提示練習。</p>'}<p class="fine">由師生在第六步確認熟悉後，再往下練；老師也可以從「選擇任務」調整順序。</p></section>`;
};
const day0BaseGuidedRender=render;
render=function(){
 day0BaseGuidedRender();
 const main=$('#main');
 if(page===0)main.querySelector('.dg-entry-note').open=false;
 const context=$('#dg-context');
 context.querySelector('.dg-current-round').textContent=`${practicalChapter().name} · ${taskLabel(activeRound())} · ${activeRound().name}`;
 context.querySelector('.dg-context-copy').insertAdjacentHTML('beforeend',btn('任務總覽','id="day0-task-open"','aria-haspopup="dialog" aria-controls="day0-task-dialog"'));
 main.insertAdjacentHTML('beforeend',practicalTools());
 if(page!==1){
  const numberReference=language==='ko'?koreanNumberReference():japaneseNumberReference();
  const title=language==='ko'?koreanNumberLesson()?.title:japaneseNumberLesson()?.title;
  if(numberReference)main.insertAdjacentHTML('beforeend',`<details class="panel practical-number-drawer"><summary>${esc(title)}</summary>${numberReference}</details>`);
 }
 for(const line of main.querySelectorAll('.dg-study-card > .en,.study-hear-card > .en,.dg-change-card > .en,.d5-chat-en,.say-reference > .en,.dg-transcript .en,.d5-dialogue-recap .en')){
  line.lang=language;
  line.insertAdjacentHTML('afterend',reading(line.textContent));
 }
 // The phone map is meaningful in the active task, not only in a closed ledger.
 const phoneMap=main.querySelector('.dg-scene-progress .practical-phone-map');
 if(phoneMap)main.querySelector('.dg-scene-context').after(phoneMap);
};
