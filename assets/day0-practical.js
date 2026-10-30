// Six travel chapters, with one small task and one set of records at a time.
const practicalChapter=()=>course.taskGroups.find(g=>g.roundIds.includes(activeRound().id));
const practicalSetRound=setTaskRound;
setTaskRound=function(n){practicalSetRound(n);course.replyRole=activeRound().role;};
course.replyRole=activeRound().role;
const practicalNavigate=navigate;
navigate=function(n){
 practicalNavigate(n);
 if(n===0){const inset=($('.top')?.getBoundingClientRect().height||0)+16;window.scrollTo({top:Math.max(0,window.scrollY+$('#main').getBoundingClientRect().top-inset),behavior:'instant'});}
};
const practicalLessonScene=lessonScene;
lessonScene=function(f,values,done){
 const scene=practicalLessonScene(f,values,done);
 if(practicalChapter().id!=='phone-route')return scene;
 const label=values[0]===undefined?'':f.steps[0].objects[values[0]]?.[1]||'';
 const left=label.includes('左'),right=label.includes('右'),chosen=left||right;
 return `<figure class="practical-phone-map"><svg viewBox="0 0 300 230" role="img" aria-label="${esc(chosen?'你選擇的路線：'+label:'路線練習示意，從下方出發到前方路口')}"><rect x="68" y="8" width="164" height="212" rx="24" class="map-phone"/><path d="M150 180V88M90 88H210" class="map-road"/><path d="M150 180V88${chosen?left?'H100':'H200':''}" class="map-route"/><path d="${chosen?left?'M110 78L100 88L110 98':'M190 78L200 88L190 98':'M140 100L150 88L160 100'}" class="map-arrow"/><circle cx="150" cy="180" r="7" class="map-start"/><text x="150" y="202" text-anchor="middle">你在這裡</text><text x="150" y="43" text-anchor="middle">手機上的目的地</text></svg><figcaption>${chosen?esc(label):'先聽路線，再選方向。'}<small>路線練習示意</small></figcaption></figure>${scene}`;
};
roundChoices=function(attribute='task-round'){
 const group=practicalChapter(),index=course.taskGroups.indexOf(group);
 return `<div class="practical-picker"><details class="practical-chapters" ${page===0?'open':''}><summary>第 ${index+1} 章 · ${esc(group.name)}<span>切換章節</span></summary><div class="practical-chapter-grid">${course.taskGroups.map((g,i)=>btn(`<small>第 ${i+1} 章</small><strong>${esc(g.name)}</strong>`,`data-practical-chapter="${i}" data-practical-target="${attribute}"`,`aria-pressed="${g===group}"`)).join('')}</div></details><div class="tabs practical-tasks" aria-label="本章的小任務">${group.roundIds.map(id=>microRoundButton(rounds.find(r=>r.id===id),attribute)).join('')}</div></div>`;
};
roundBanner=function(){
 const r=activeRound(),group=practicalChapter();
 return `<section class="focus-banner practical-banner" aria-label="目前練習輪次">${roundChoices()}<p class="eyebrow">${esc(group.name)}</p><strong>任務 ${taskLabel(r)} · ${esc(r.name)}</strong><p class="fine">${esc(r.bridge)}</p></section>`;
};
intro=function(){
 const r=activeRound(),art=studyArtwork.images[studyArtwork.byRound[0].other];
 return `<section class="hero home-hero practical-hero"><div class="hero-copy"><p class="eyebrow">TRAVEL LAB · ${language==='ko'?'KOREAN':'JAPANESE'}</p><h1>${esc(course.title)}</h1><p class="lead">從問價錢開始，練會買東西、點餐和找路。每次只完成一個小任務，熟悉後再往下。</p></div><div class="hero-art"><img src="${art}" width="260" height="260" alt=""></div></section>
 <section class="panel before-panel"><h2>先試任務 ${taskLabel(r)}：${esc(r.name)}</h2>${roundChoices('before-round')}<p class="task">${esc(r.checkpoint.task)}</p>${field('before-'+r.id,'這一輪，第一次的嘗試')}<p class="fine">可以先口頭說，或記下幾個字。第 ⑥ 部分會回到同一道題，比較現在需要多少提示。</p>${microAlternative(r,'before')}<div class="actions">${btn('開始這個任務：學本輪說法 →','data-page="1"','class="primary"')}</div></section>
 <section class="panel"><h2>先學這一小段，再用到會</h2><p>看情境試說 → 學自己的句子與對方回話 → 跟著做 → 換一個條件 → 和老師接話 → 看進步 → 隔天再練。</p><p class="fine">每個任務可以分開完成。禮貌用語、請人重說和數字都能隨手查看；文字入門可依需要穿插練習。</p></section>
 ${microChapterCards()}
 <details class="panel inventory"><summary>原有句表與延伸說法</summary><p>熟悉本輪後，再挑需要的句子延伸。這些說法不會自動算進本輪的作業或進度。</p><div class="inventory-scroll"><table><thead><tr><th>用途</th><th>說法</th><th>中文</th></tr></thead><tbody>${originalPhrases.map(p=>`<tr><td>${esc(p.use||'延伸')}</td><td lang="${language}">${esc(p.en)}</td><td>${esc(p.zh)}</td></tr>`).join('')}</tbody></table></div>${optionalTravelPhrases?microStudySupplement(optionalTravelPhrases):''}</details>`;
};
function practicalTools(){
 return `<details class="panel practical-tools"><summary>隨手用：開口、道謝、聽不懂時求助</summary><p>先跟著聽一次；需要時直接帶著用。可以在問價、點餐與問路時使用。</p><div class="grid">${practicalSupport.map(p=>`<article><h3>${esc(p.use)}</h3><p class="en" lang="${language}">${esc(p.en)}</p><p>${esc(p.zh)}</p>${reading(p.en)}${audio(p.en)}</article>`).join('')}</div></details>`;
}
const practicalRender=render;
render=function(){
 practicalRender();
 const main=$('#main');
 main.insertAdjacentHTML('beforeend',practicalTools());
 if(page!==1)main.insertAdjacentHTML('beforeend',`<details class="panel practical-number-drawer"><summary>數字 1～10 · 點聽與連續播放</summary>${language==='ko'?koreanNumberReference():japaneseNumberReference()}</details>`);
};
document.addEventListener('click',event=>{
 const b=event.target.closest('[data-practical-chapter]');if(!b)return;
 const group=course.taskGroups[Number(b.dataset.practicalChapter)];if(!group)return;
 const index=rounds.findIndex(r=>r.id===group.roundIds[0]);
 setTaskRound(index);persistRound();navigate(b.dataset.practicalTarget==='before-round'?0:1);
});
