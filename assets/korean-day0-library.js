// Same study layout as Japanese, with Hangul, Chinese and optional romanization.
function koreanPreviewCard(p,i,me){
 return `<article class="panel japanese-preview-card"><p class="eyebrow">${String(i+1).padStart(2,'0')} / ${esc(me?p.use:course.replyRole+'可能會說')}</p><p class="en" lang="ko">${esc(p.en)}</p><p class="preview-meaning">${esc(p.zh)}</p>${reading(p.en)}${audio(p.en)}${me&&p.practice?`<div class="phrase-use"><b>現在就用一次</b><p>${esc(p.practice)}</p>${hint('先想現在要表達什麼，再換地點。',p.remix)}</div>`:''}</article>`;
}
function koreanNumberReference(){
 return `<details class="study-block study-vocabulary japanese-numbers" open><summary class="study-heading study-words"><div><h2>韓文數字 1～10：先用在金額與分鐘</h2><p>價格與分鐘用這組數字；物品數量另外先學一個、兩個。</p><span class="number-toggle" aria-hidden="true"></span></div></summary><div class="panel">${numberSequenceControls()}<div class="task-words">${numberWords.map(([ko,label])=>`<div><b>${esc(label)}</b><span lang="ko">${esc(ko)}</span>${reading(ko)}${audio(ko)}</div>`).join('')}</div><p class="fine number-note">數物品：한 개（一個）、두 개（兩個）。金額：삼천 원（3,000 韓元）、오천 원（5,000 韓元）、만 원（10,000 韓元）。先聽聲音，熟悉後再收起拼音。</p></div></details>`;
}
studyVocabulary=function(r){
 if(!r.words.length)return '';
 return `<details class="study-block study-vocabulary" open><summary class="study-heading study-words"><img class="vocabulary-portrait" src="${studyArtwork.images['vocabulary-reader']}" width="110" height="110" alt=""><div><h2>這輪的單字，需要時再查</h2><p>先看意思、聽發音，再放進這輪的句子裡試著說。</p><span class="vocabulary-toggle" aria-hidden="true"></span></div></summary><div class="panel"><div class="task-words focus-words">${r.words.map(([word,meaning])=>`<div><b lang="ko">${esc(word)}</b><span>${esc(meaning)}</span>${reading(word)}${audio(word)}</div>`).join('')}</div>${r.wordNote?`<p class="fine vocabulary-note">${esc(r.wordNote)}</p>`:''}</div></details>`;
};
phrasePage=function(){
 const r=activeRound();
 if(mode==='reply')return head('','看過雙方的句子後，試著只聽聲音，再接一句自己的話。')+listeningReply();
 return head('','先看旅客說法，再看對方可能的回話；對照韓文與中文，需要時展開羅馬拼音。')+
 `<section class="japanese-study-block study-library" aria-label="旅客：我會說">${studyRoleHeading(true,'旅客：我會說','這些是我要練習說出口的句子。先看懂意思，再按播放跟著讀。')}<div class="grid task-phrase-grid">${r.phraseIds.map((id,i)=>koreanPreviewCard(phrases.find(p=>p.id===id),i,true)).join('')}</div></section>`+
 `<section class="japanese-study-block japanese-hear-block" aria-label="我要聽得懂">${studyRoleHeading(false,course.replyRole+'：我要聽得懂','先看韓文和中文，再聽回話。聽懂意思即可，不必背對方整句。')}<div class="grid japanese-hear-grid">${r.hearLines.map((p,i)=>koreanPreviewCard(p,i,false)).join('')}</div></section>`+
 `<section class="panel"><h2>兩邊看過了，再試著聽</h2><p>可以遮住文字練聽懂，也可以進入第三部分，把雙方的話接起來。</p><div class="actions">${btn('遮住文字，練習聽與接話','data-mode="reply"')}${btn('進入第三部分：跟著做 →',`data-start="${r.flowIds[0]}"`,'class="primary"')}</div></section>`+
 studyVocabulary(r)+koreanNumberReference()+supportCard()+
 (r.reuse.length?`<details class="panel"><summary>前面學過、這輪會用到的說法</summary><div class="grid">${r.reuse.map((id,i)=>koreanPreviewCard(phrases[id],i,true)).join('')}</div></details>`:'');
};
// This is a new lesson: no Japanese migration or prior-edition links are shown.
const koreanIntro=intro;
intro=function(){return koreanIntro().replace('完整句表與改版前教材','本課完整句表').replace('原有句子保留在本課任務、共用求助或延伸練習中。','本課句子依用途分在各任務與共用求助中。');};
oldRecords=function(){return '';};
