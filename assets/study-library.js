function studyRoleHeading(me,title,subtitle){
 const art=typeof lessonArtwork==='object'?lessonArtwork:studyArtwork;
 const index=course.day===1?focusRound:taskRound,role=art.byRound[index],key=role[me?'self':'other'];
 return `<div class="study-heading ${me?'study-self':'study-other'}"><img class="study-portrait" src="${art.images[key]}" data-illustration="${esc(key)}" width="120" height="120" alt=""><div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div></div>`;
}
// Two entry points sit immediately above the section's DAY label and title.
function studyNavigation(){
 return '<nav class="study-navigation" aria-label="第二部分學習入口">'+[
  ['library','我會說／我要聽得懂'],['reply','練習聽和接話']
 ].map(([key,title])=>btn('<strong>'+title+'</strong>','data-study-view="'+key+'"','aria-pressed="'+(mode===key)+'"')).join('')+'</nav>';
}
const renderBeforeStudyNavigation=render;
render=function(){
 renderBeforeStudyNavigation();
 if(page!==1)return;
 const main=$('#main');
 main.querySelector(':scope > .modes')?.remove();
 const heading=main.querySelector(':scope > .lesson-section-heading')||main.querySelector(':scope > .eyebrow');
 if(heading)heading.insertAdjacentHTML('beforebegin',studyNavigation());
};
document.addEventListener('click',event=>{
 const button=event.target.closest('button[data-study-view]');
 if(!button||button.disabled||page!==1)return;
 const target=button.dataset.studyView;
 if(!['library','reply'].includes(target))return;
 stopAudio();mode=target;
 if(target==='reply'&&course.day!==1){listenPractice=true;probeChoice=-1;}
 render();
 $('[data-study-view="'+target+'"]').focus({preventScroll:true});
 const destination=$('.study-navigation');
 const top=document.querySelector('.top')?.getBoundingClientRect().height||0;
 window.scrollTo({top:Math.max(0,destination.getBoundingClientRect().top+window.scrollY-top-16),behavior:'instant'});
});
if(course.day!==0){
 const previousStudyPhrasePage=phrasePage;
 function studyOwnCard(p,i,review=false){
  const original=course.day===1?phraseCard(p,i,review):ownPhrase(p,i,review);
  return original.replace(`<details><summary>看中文意思</summary><p>${esc(p.zh)}</p></details>`,`<p class="study-meaning">${esc(p.zh)}</p>`);
 }
 phrasePage=function(){
  if(mode==='reply')return previousStudyPhrasePage();
  const r=course.day===1?currentRound():activeRound(),index=course.day===1?focusRound:taskRound;
  const art=typeof lessonArtwork==='object'?lessonArtwork:studyArtwork,roles=art.byRound[index],role=r.role||course.replyRole;
  const list=r.phraseIds.map(id=>phrases.find(p=>p.id===id));
  return head('','先練自己要說的，再認識對方可能的回話；看懂兩邊的意思後，再進入練習。')+
   `<section class="study-block study-library" aria-label="我會說">${studyRoleHeading(true,roles.label+'：我會說','這些是我要練習說出口的句子。先看意思，再聽、再自己說。')}<div class="grid task-phrase-grid">${list.map((p,i)=>studyOwnCard(p,i)).join('')}</div></section>`+
   `<section class="study-block study-listening" aria-label="我要聽得懂">${studyRoleHeading(false,role+'：我要聽得懂','這些回話會出現在後面的練習。先看句子和中文，再聽聲音，不必背對方整句。')}<div class="grid study-hear-grid">${r.hearLines.map((p,i)=>`<article class="panel study-hear-card"><p class="eyebrow">${String(i+1).padStart(2,'0')} / ${esc(role)}可能會說</p><p class="en" lang="en">${esc(p.en)}</p><p class="study-meaning">${esc(p.zh)}</p>${audio(p.en)}<p class="fine">會在這裡用到：${p.sources.map(esc).join('、')}</p></article>`).join('')}</div></section>`+
   `<section class="panel study-practice"><h2>兩邊看過了，再試著用</h2><div class="actions">${btn('練習聽與接話','data-mode="reply"')}${btn('進入第三部分：跟著做 →',`data-start="${course.day===1?focusRound:r.flowIds[0]}"`,'class="primary"')}</div></section>`+
   (r.words.length?`<details class="panel"><summary>這輪的單字，需要時再查</summary><div class="task-words focus-words">${r.words.map(([en,zh])=>`<div><b lang="en">${esc(en)}</b><span>${esc(zh)}</span>${audio(en.replaceAll(' / ','. '))}</div>`).join('')}</div></details>`:'')+
   (typeof supportCard==='function'?supportCard():'')+
   (r.extraPhraseIds?.length?`<details class="panel"><summary>也可以這樣說（原有句子都保留）</summary><div class="grid">${r.extraPhraseIds.map((id,i)=>studyOwnCard(phrases.find(p=>p.id===id),i)).join('')}</div></details>`:'')+
   (r.reuse?.length?`<details class="panel"><summary>前面學過、這輪會用到的說法</summary><div class="grid">${r.reuse.map((id,i)=>studyOwnCard(phrases[id],i,true)).join('')}</div></details>`:'');
 };
}
