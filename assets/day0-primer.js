// Optional entry before the travel tasks. This state is deliberately independent
// of course answers, task completion and the shared appearance preferences.
(() => {
 if(typeof day0Primer==='undefined'||!day0Primer.groups?.length)return;
 const data=day0Primer,lang=data.language;
 let opened=false,category=data.categories[0].id,groupId=data.groups[0].id;
 let view='cards',question=0,answer=null,assembled=new Set();
 const currentGroup=()=>data.groups.find(g=>g.id===groupId)||data.groups[0];
 const groupQuestions=()=>data.exercises.filter(q=>q.groupId===groupId);
 const sound=item=>item.speakText||item.text;
 const main=()=>document.querySelector('#main');
 const focus=selector=>(document.querySelector(selector)||main())?.focus({preventScroll:true});
 const attr=value=>esc(value);
 const action=(label,name,value='',extra='')=>btn(label,`data-primer-${name}="${attr(value)}"`,extra);
 function resetExercise(){question=0;answer=null;assembled=new Set();}
 function redraw(selector){stopAudio();render();focus(selector||'#primerTitle');}
 function entryCard(){
  return `<section class="panel primer-entry" aria-labelledby="primerEntryTitle"><div><p class="eyebrow">字音入門 · 一次 3–5 分鐘</p><h2 id="primerEntryTitle">先認識文字，也可以直接開口。</h2><p>${lang==='ko'?'從基本母音、子音開始，試著把字母拼成一格音節。':'平假名和片假名分行練習，點字聽、整行跟著讀。'}</p><p class="fine">字音練習是另一個入口；旅行對話隨時可以開始。</p></div><div class="actions">${action('認識文字與發音 →','open','true','class="primary"')}</div></section>`;
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
 function quiz(){
  const questions=groupQuestions(),q=questions[question];
  if(!q)return '<p>這一組先用字卡對照聲音。</p>';
  const isAnswered=answer!==null,correct=answer===q.correct;
  return `<section class="primer-quiz" aria-labelledby="primerQuizTitle"><p class="eyebrow">本組小練習 ${question+1} / ${questions.length}</p><h3 id="primerQuizTitle">${esc(q.prompt)}</h3><p>先聽，再選一個。可以重播、改選，也可以打開文字對照。</p><div class="actions">${btn('▶ 聽題目',`data-say="${attr(sound(q))}"`)}${btn('慢速聽',`data-say="${attr(sound(q))}" data-slow="true"`)}</div><div class="primer-quiz-options">${q.options.map((option,i)=>action(`<span lang="${lang}">${esc(option)}</span>`,'answer',String(i),`aria-pressed="${answer===i}"`)).join('')}</div><div role="status" class="primer-feedback">${isAnswered?`<p class="feedback ${correct?'':'retry'}">${correct?'✓ 選對了。'+esc(q.why):'再試一次。可以重聽，或先看下面的文字提示再選。'}</p>`:''}</div><details class="primer-quiz-transcript"><summary>看文字與讀音</summary><p><span class="primer-transcript-text" lang="${lang}">${esc(sound(q))}</span> <span lang="${lang}-Latn">${esc(q.romaji)}</span></p><p>${esc(q.zh)}</p></details><div class="actions primer-question-actions">${action('← 上一題','question',String(question-1),question===0?'disabled':'')}${question+1<questions.length?action('下一題 →','question',String(question+1)):action('這組再練一次','question','0')}</div><p class="fine">這裡只練聽音辨認，不錄音，也不判斷你的口說發音。</p></section>`;
 }
 function primerPage(){
  const g=currentGroup(),groups=data.groups.filter(x=>x.category===category),at=groups.findIndex(x=>x.id===groupId);
  return `<div class="day0-primer"><header class="primer-header"><p class="eyebrow">字音入門 · 每小組約 3–5 分鐘</p><h1 id="primerTitle" tabindex="-1">${esc(data.title)}</h1><p class="lead">${esc(data.description)}</p><div class="actions">${action('開始旅行對話 →','close','true','class="primary"')}</div></header><section class="panel primer-workspace"><div class="primer-categories" aria-label="選擇字音類別">${data.categories.map(c=>action(esc(c.title),'category',c.id,`aria-pressed="${category===c.id}"`)).join('')}</div><div class="primer-groups" aria-label="選擇一小組">${groups.map(x=>action(esc(x.title),'group',x.id,`aria-pressed="${groupId===x.id}"`)).join('')}</div><div class="primer-group-heading"><p class="eyebrow">小組 ${at+1} / ${groups.length}</p><h2>${esc(g.title)}</h2><p>${esc(g.description)}</p></div><div class="primer-view-tabs" aria-label="練習方式">${action('看字、聽音','view','cards',`aria-pressed="${view==='cards'}"`)}${action('聽音選字','view','quiz',`aria-pressed="${view==='quiz'}"`)}</div>${view==='cards'?cards():quiz()}<div class="primer-footer">${action('← 上一組','group',groups[at-1]?.id||'',at===0?'disabled':'')}${at+1<groups.length?action('下一小組 →','group',groups[at+1].id):action('開始旅行對話 →','close','true')}</div></section><p class="fine">每次只選一小組。練過後可以回到旅行情境使用；不需要全部完成才能繼續。</p></div>`;
 }
 const baseRender=render;
 render=function(){
  baseRender();
  if(opened){
   main().innerHTML=primerPage();
   document.querySelectorAll('#nav [aria-current]').forEach(b=>b.removeAttribute('aria-current'));
   return;
  }
  if(page===0){const hero=main().querySelector('.hero');if(hero)hero.insertAdjacentHTML('afterend',entryCard());else main().insertAdjacentHTML('afterbegin',entryCard());}
 };
 const baseNavigate=navigate;
 navigate=function(p){
  if(!Number.isInteger(p)||p<0||p>=course.labels.length)return;
  opened=false;
  baseNavigate(p);
 };
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  const d=b.dataset;
  if(d.primerOpen!==undefined){opened=true;redraw();if(window.matchMedia('(max-width:1100px)').matches)document.querySelector('#courseMenu').open=false;const inset=(document.querySelector('.top')?.getBoundingClientRect().height||0)+16;window.scrollTo({top:Math.max(0,window.scrollY+main().getBoundingClientRect().top-inset),behavior:'instant'});return;}
  if(d.primerClose!==undefined){navigate(0);return;}
  if(!opened)return;
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
   }
   return;
  }
  if(d.primerCategory!==undefined){
   if(!data.categories.some(c=>c.id===d.primerCategory))return;
   category=d.primerCategory;groupId=data.groups.find(g=>g.category===category).id;view='cards';resetExercise();redraw(`[data-primer-category="${category}"]`);return;
  }
  if(d.primerGroup!==undefined){
   const g=data.groups.find(x=>x.id===d.primerGroup);if(!g)return;
   groupId=g.id;category=g.category;resetExercise();redraw(`[data-primer-group="${groupId}"]`);return;
  }
  if(d.primerView!==undefined){
   if(!['cards','quiz'].includes(d.primerView))return;
   view=d.primerView;resetExercise();redraw(`[data-primer-view="${view}"]`);return;
  }
  if(d.primerQuestion!==undefined){
   const n=Number(d.primerQuestion);if(!Number.isInteger(n)||!groupQuestions()[n])return;
   question=n;answer=null;redraw('[data-primer-view="quiz"]');return;
  }
  if(d.primerAnswer!==undefined){
   const n=Number(d.primerAnswer),q=groupQuestions()[question];if(!Number.isInteger(n)||!q?.options[n])return;
   answer=n;redraw(`[data-primer-answer="${n}"]`);return;
  }
  if(d.primerAssemble!==undefined){
   const n=Number(d.primerAssemble),item=currentGroup().items[n];if(!Number.isInteger(n)||!item?.parts)return;
   assembled.add(groupId+':'+n);redraw(`[data-primer-card="${groupId}:${n}"] .primer-letter-button`);
  }
 });
})();
