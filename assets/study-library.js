function studyVocabulary(r){
 if(!r.words.length)return '';
 const art=typeof lessonArtwork==='object'?lessonArtwork:studyArtwork,japanese=course.day===0;
 return `<details class="study-block study-vocabulary" open><summary class="study-heading study-words"><img class="vocabulary-portrait" src="${art.images['vocabulary-reader']}" width="110" height="110" alt=""><div><h2>這輪的單字，需要時再查</h2><p>先看意思、聽發音，再放進這輪的句子裡試著說。</p><span class="vocabulary-toggle" aria-hidden="true"></span></div></summary><div class="panel"><div class="task-words focus-words">${r.words.map(([word,meaning])=>`<div><b lang="${japanese?'ja':'en'}">${esc(word)}</b><span>${esc(meaning)}</span>${japanese&&kana[word]&&kana[word]!==word?`<p class="fine" lang="ja">${esc(kana[word])}</p>`:''}${japanese&&readings[word]?`<p class="fine" lang="ja-Latn">${esc(readings[word])}</p>`:''}${audio(word.replaceAll(' / ','. '))}</div>`).join('')}</div>${japanese&&r.wordNote?`<p class="fine vocabulary-note">${esc(r.wordNote)}</p>`:''}</div></details>`;
}
function studyRoleHeading(me,title,subtitle){
 const art=typeof lessonArtwork==='object'?lessonArtwork:studyArtwork;
 const index=course.day===1?focusRound:taskRound,role=art.byRound[index],key=role[me?'self':'other'];
 return `<div class="study-heading ${me?'study-self':'study-other'}"><img class="study-portrait" src="${art.images[key]}" data-illustration="${esc(key)}" width="120" height="120" alt=""><div><h2>${esc(title)}</h2><p>${esc(subtitle)}</p></div></div>`;
}
function studyUsage(p){
 if(!p.substitutions?.length)return '';
 if(p.illustratedOptions?.length&&typeof foodArtwork==='string')return `<details class="phrase-usage food-usage"><summary>用法補充</summary><p>先挑自己喜歡的一種，不用全部背。把 <span lang="en">${esc(p.substitutions[0].target)}</span> 換成下方的字，再加上 <span lang="en">please</span> 就能回答。</p><div class="food-options">${p.illustratedOptions.map(o=>`<div class="food-option"><div class="food-picture" aria-hidden="true" style="background-image:url('${foodArtwork}');background-position:${o.cell%3*50}% ${Math.floor(o.cell/3)*100/3}%"></div><h4 lang="en">${esc(o.en)}</h4><p class="food-meaning">${esc(o.zh)}</p><p class="fine">${esc(o.description)}</p><p lang="en">${esc(o.en)}, please.</p>${audio(o.en+', please.')}</div>`).join('')}</div></details>`;
 return `<details class="phrase-usage"><summary>用法補充</summary>${p.substitutions.map(g=>`<div><p class="fine">可替換：<span lang="en">${esc(g.target)}</span></p><p>${g.options.map(([en,zh])=>`<span lang="en">${esc(en)}</span>（${esc(zh)}）`).join(' / ')}</p></div>`).join('')}</details>`;
}
function studyAdvanced(r){
 if(!r.advanced?.length&&!r.advancedHear?.length)return '';
 return `<details class="panel study-advanced"><summary>進階：我會說／我要聽得懂</summary><p>基本句就能完成這輪任務。有餘力時，再挑一句練習。</p>
 <section class="study-block study-advanced-speaking" aria-label="進階：我會說">${studyRoleHeading(true,'我會說',course.day===1?'用來問路、確認方向或求助，挑一句試著說出口。':'需要時，再挑一句延伸說法或問題練習。')}<div class="grid">${(r.advanced||[]).map(p=>`<article class="panel study-advanced-card"><h3>${esc(p.use)}</h3><p class="fine">已學過的說法：<span lang="en">${esc(p.base)}</span></p><p class="en" lang="en">${esc(p.en)}</p><p class="study-meaning">${esc(p.zh)}</p>${audio(p.en)}${studyUsage(p)}</article>`).join('')}</div></section>
 <section class="study-block study-advanced-listening" aria-label="進階：我要聽得懂">${studyRoleHeading(false,'我要聽得懂',`${r.role||course.replyRole}可能這樣回覆；聽懂重點就好，不必背整句。`)}${r.advancedHear?.length?`<div class="grid">${r.advancedHear.map(p=>`<article class="panel study-advanced-hear-card"><p class="en" lang="en">${esc(p.en)}</p><p class="study-meaning">${esc(p.zh)}</p>${audio(p.en)}</article>`).join('')}</div>`:'<p>這輪沿用上方「我要聽得懂」的句子即可。</p>'}</section></details>`;
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
  return original.replace(`<details><summary>看中文意思</summary><p>${esc(p.zh)}</p></details>`,`<p class="study-meaning">${esc(p.zh)}</p>`).replace('</article>',`${studyUsage(p)}</article>`);
 }
 phrasePage=function(){
  if(mode==='reply')return previousStudyPhrasePage();
  const r=course.day===1?currentRound():activeRound(),index=course.day===1?focusRound:taskRound;
  const art=typeof lessonArtwork==='object'?lessonArtwork:studyArtwork,roles=art.byRound[index],role=r.role||course.replyRole;
  const list=r.phraseIds.map(id=>phrases.find(p=>p.id===id));
  return head('','先練自己要說的，再認識對方可能的回話；看懂兩邊的意思後，再進入練習。')+
   `<section class="study-block study-library" aria-label="我會說">${studyRoleHeading(true,roles.label+'：我會說','這些是我要練習說出口的句子。先看意思，再聽、再自己說。')}<div class="grid task-phrase-grid">${list.map((p,i)=>studyOwnCard(p,i)).join('')}</div></section>`+
   `<section class="study-block study-listening" aria-label="我要聽得懂">${studyRoleHeading(false,role+'：我要聽得懂','這些回話會出現在後面的練習。先看句子和中文，再聽聲音，不必背對方整句。')}<div class="grid study-hear-grid">${r.hearLines.map((p,i)=>`<article class="panel study-hear-card"><p class="eyebrow">${String(i+1).padStart(2,'0')} / ${esc(role)}可能會說</p><p class="en" lang="en">${esc(p.en)}</p><p class="study-meaning">${esc(p.zh)}</p>${audio(p.en)}<p class="fine">會在這裡用到：${p.sources.map(esc).join('、')}</p></article>`).join('')}</div></section>`+
   studyVocabulary(r)+studyAdvanced(r)+
   (typeof supportCard==='function'?supportCard():'')+
   (r.extraPhraseIds?.length?`<details class="panel"><summary>也可以這樣說（原有句子都保留）</summary><div class="grid">${r.extraPhraseIds.map((id,i)=>studyOwnCard(phrases.find(p=>p.id===id),i)).join('')}</div></details>`:'')+
   (r.reuse?.length?`<details class="panel"><summary>前面學過、這輪會用到的說法</summary><div class="grid">${r.reuse.map((id,i)=>studyOwnCard(phrases[id],i,true)).join('')}</div></details>`:'');
 };
}
