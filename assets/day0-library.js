// Japanese beginners first see both sides of the conversation on the same page.
function japanesePreviewCard(p,i,me){
 const text=p.en,parts=String(text).match(/[^。！？]+[。！？]?/g)||[];
 const romaji=readings[text]||parts.map(s=>readings[s]||'').join(' ');
 return `<article class="panel japanese-preview-card"><p class="eyebrow">${String(i+1).padStart(2,'0')} / ${esc(me?p.use:course.replyRole+'可能會說')}</p><p class="en" lang="ja">${esc(text)}</p><p class="preview-meaning">${esc(p.zh)}</p>${kana[text]?`<p class="preview-kana" lang="ja">${esc(kana[text])}</p>`:''}<p class="preview-reading" lang="ja-Latn">${esc(romaji)}</p>${audio(text)}${me&&p.practice?`<div class="phrase-use"><b>現在就用一次</b><p>${esc(p.practice)}</p>${hint('先想現在要表達什麼，再換地點。',p.remix)}</div>`:''}</article>`;
}
function japaneseNumberReference(){
 const lesson=japaneseNumberLesson();if(!lesson)return '';
 const sequence=lesson.groups.flatMap(g=>g.items.map(i=>i.text)).join(' ');
 return `<details class="study-block study-vocabulary japanese-numbers japanese-context-numbers" data-number-context="${lesson.id}" open><summary class="study-heading study-words"><div><h2>${esc(lesson.title)}</h2><p>${esc(lesson.description)}</p><span class="number-toggle" aria-hidden="true"></span></div></summary><div class="panel"><p>可以逐個點聽，或依序播放整組；先聽完整說法，再跟著說一次。</p><div class="actions number-sequence">${btn('▶ '+esc(lesson.sequenceLabel),`data-number-sequence="true" data-say="${esc(sequence)}"`)}${btn(esc(lesson.slowLabel),`data-number-sequence="true" data-say="${esc(sequence)}" data-slow="true"`)}</div>${lesson.groups.map(g=>`<section class="japanese-number-group"><h3>${esc(g.title)}</h3><div class="task-words">${g.items.map(i=>`<div><b>${esc(i.zh)}</b><span lang="ja">${esc(i.text)}</span>${i.kana!==i.text?`<p class="preview-kana" lang="ja">${esc(i.kana)}</p>`:''}${i.special?`<p class="fine number-special"><strong>${esc(i.special)}</strong></p>`:''}${reading(i.text)}${audio(i.text)}</div>`).join('')}</div></section>`).join('')}<p class="fine number-note">${esc(lesson.note)}</p></div></details>`;
}
function japaneseNumberLesson(){
 const key=activeRound().key;
 if(key.includes('practical-quantity-total'))return japaneseNumberLessons.quantity;
 if(key.includes('practical-price-buy')||key.includes('practical-payment'))return japaneseNumberLessons.price;
 return null;
}
phrasePage=function(){
 const r=activeRound();
 if(mode==='reply')return head('','看過雙方的句子後，試著只聽聲音，再接一句自己的話。')+`<div class="modes">${btn('← 回到「我會說／我要聽得懂」','data-mode="library"')}${btn('遮住文字，練習聽與接話','data-mode="reply"','aria-pressed="true"')}</div>`+listeningReply();
 return head('','先看上面的旅客說法，再看下面對方可能的回話；日文、中文和讀音都可以先對照。')+
 `<section class="japanese-study-block study-library" aria-label="旅客：我會說">${studyRoleHeading(true,'旅客：我會說','這些是我要練習說出口的句子。先看懂意思，再按播放跟著讀。')}<div class="grid task-phrase-grid">${r.phraseIds.map((id,i)=>japanesePreviewCard(phrases.find(p=>p.id===id),i,true)).join('')}</div></section>`+
 `<section class="japanese-study-block japanese-hear-block" aria-label="我要聽得懂">${studyRoleHeading(false,course.replyRole+'：我要聽得懂','這些是等一下對方可能會說的話。先看日文、中文和羅馬字，聽懂意思即可。')}<div class="grid japanese-hear-grid">${r.hearLines.map((p,i)=>japanesePreviewCard(p,i,false)).join('')}</div></section>`+
 `<section class="panel"><h2>兩邊看過了，再試著聽</h2><p>可以先遮住文字練習聽懂，也可以直接進入第三部分，把雙方的話接起來。</p><div class="actions">${btn('遮住文字，練習聽與接話','data-mode="reply"')}${btn('進入第三部分：跟著做 →',`data-start="${r.flowIds[0]}"`,'class="primary"')}</div></section>`+
 studyVocabulary(r)+
 japaneseNumberReference()+supportCard()+
 (r.reuse.length?`<details class="panel"><summary>前面學過、這輪會用到的說法</summary><div class="grid">${r.reuse.map((id,i)=>japanesePreviewCard(phrases[id],i,true)).join('')}</div></details>`:'');
};
const japaneseTaskFooter=taskFooter;
taskFooter=function(){return japaneseTaskFooter().replace('接著練：'+esc(course.replyRole)+'說，我來接 →','兩邊看過了，試著聽與接話 →');};
