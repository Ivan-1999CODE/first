// Day 1 only: close each task independently; mix only explicitly familiar tasks.
let reviewMode='current',reviewIds=[];
try{
 const saved=JSON.parse(localStorage.getItem(focusKey)||'{}');
 if(Array.isArray(saved.reviewIds))reviewIds=roundsDone.filter(id=>saved.reviewIds.includes(id));
 if(saved.reviewMode==='mixed'&&reviewIds.length>=2)reviewMode='mixed';
}catch{}
function persistMicro(){
 try{localStorage.setItem(focusKey,JSON.stringify({round:focusRound,done:roundsDone,reviewMode,reviewIds}));}
 catch{storageFailed=true;showStorage();}
}
for(const r of rounds)for(const kind of ['before','after','home'])fields.push(`${kind}-${r.id}`);
const microBaseLoad=load;
load=function(){
 microBaseLoad();
 for(const r of rounds)for(const kind of ['before','after','home'])state.answers[`${kind}-${r.id}`]??='';
 state.taskHome=Object.fromEntries(rounds.map(r=>[r.id,{listen:false,spoken:false}]));
 try{
  const saved=JSON.parse(localStorage.getItem(course.id)||'{}');
  for(const r of rounds)for(const kind of ['listen','spoken'])state.taskHome[r.id][kind]=saved?.taskHome?.[r.id]?.[kind]===true;
 }catch{storageFailed=true;}
};
const microSetRound=setRound;
setRound=function(n){if(!Number.isInteger(n)||!rounds[n])return;microSetRound(n);reviewMode='current';persistMicro();};
const roundChoices=(attribute='focus-round')=>`<div class="tabs" aria-label="選擇小任務">${rounds.map((r,i)=>btn(`任務 ${r.id} · ${esc(r.name)}`,`data-${attribute}="${i}"`,`aria-pressed="${i===focusRound}"`)).join('')}</div>`;
intro=function(){
 const r=currentRound();
 return `<section class="hero home-hero"><div class="hero-copy"><p class="eyebrow">DAY 1 / TRAVEL LAB</p><h1>問路與求助，<br>依序練習 A、B、C。</h1><p class="lead">每個小任務都有自己的開始與收尾。一堂課只完成一輪也可以，下次接著練。</p></div><div class="hero-art">${course.art}</div></section>
 <section class="panel before-panel"><h2>任務 ${r.id}：先試著說</h2>${roundChoices('before-round')}<p class="task">${esc(r.checkpoint.task)}</p>${field('before-'+r.id,'這一輪，第一次的嘗試')}<p class="fine">先口頭試說，再記下原本的說法；⑥ 會回到完全相同的題目。沒有填寫也可以練習。</p></section>
 <section class="panel"><p class="eyebrow">每個任務，反覆用到會</p><h2>一輪一個小循環</h2><p>② 學本輪句子 → ③ 原句操作 → ④ 只換一個條件 → ⑤ 真人接話 → ⑥ 看進步 → ⑦ 回家再練。</p><p>同一段可以重來。師生確認能用本輪句子完成溝通，再進下一輪；課程中途也能直接做本輪收尾。</p></section>
 <div class="cards">${rounds.map((x,i)=>`<section class="panel"><p class="eyebrow">任務 ${x.id} · ${x.phraseIds.length} 個核心說法</p><h2>${esc(x.name)}</h2><p>${esc(x.goal)}</p><p class="fine">${roundsDone.includes(x.id)?'✓ 師生已確認熟悉，可加入混合複習':'尚未確認熟悉，可反覆練習'}</p>${btn(`先試任務 ${x.id} →`,`data-before-round="${i}"`)}</section>`).join('')}</div>
 <details class="panel"><summary>老師看：怎麼分堂與收尾</summary><p>只教 A，就做 A 的 ⑥、⑦；下堂仍可重練 A。A 熟悉後才接 B，C 也一樣。兩輪以上熟悉時，再手動開啟「已學任務混合複習」，挑選要回顧的任務。</p><p>看過句卡、點完流程、勾完目標，都不會自動判定學會。以學生是否知道何時用、能接住回話並表達意思為準；不要求逐字背誦。</p></details>`;
};
function supportCard(){
 if(currentRound().group!=='C')return '';
 const p=phrases.find(p=>p.id==='phrase-10');
 return p?`<details class="panel"><summary>選用：最後可以道謝</summary><p>需要時再加，不列入本輪句子的練習目標。</p>${phraseCard(p,0,true)}</details>`:'';
}
const microStudyAdvanced=studyAdvanced;
studyAdvanced=function(r){return microStudyAdvanced(r).replace('第 2、3、4 部分用基本句就能完成。','第 2～7 部分用本輪句子就能完成。');};
const microPhrasePage=phrasePage;
phrasePage=function(){return microPhrasePage().replace('<section class="study-block study-library"',`<p class="hint">${esc(currentRound().bridge)}</p><section class="study-block study-library"`);};
focusReply=function(){
 const ids=currentRound().replyIds,index=ids.indexOf(reply),r=replies[reply];
 return `<div class="workshop-picker">${ids.map((i,j)=>btn(`${j+1}. ${esc(replies[i].name)}`,`data-reply="${i}"`,`aria-pressed="${i===reply}"`)).join('')}</div><section class="panel workshop-card"><div class="workshop-card-top"><h2>${esc(r.name)}</h2><span class="workshop-count">${index+1} / ${ids.length}</span></div><div class="workshop-body"><div class="workshop-answer"><h3>① 我先說</h3><p class="task">${esc(r.task)}</p>${hint(r.words,r.answer,r.answerZh)}<p class="fine">先自己說，再聽路人的回覆。</p></div><div class="workshop-question"><h3>② 路人回覆</h3>${audio(r.line)}${transcript(r.line,r.zh)}<p class="fine">③ 與 ⑤ 會沿用這句回話；聽懂意思即可。</p></div></div><div class="workshop-remix"><h3>同一段，再練一次</h3><p>看完整說法 → 只看關鍵字 → 收起提示。每次都練同一段，還不熟就再來一次。</p></div><div class="lesson-footer">${btn('← 上一段',`data-reply="${ids[index-1]}"`,index===0?'disabled':'')}${index<ids.length-1?btn('下一段 →',`data-reply="${ids[index+1]}"`):btn('帶著本輪短對話去操作 →',`data-start="${focusRound}"`)}</div></section>`;
};
roundBanner=function(){
 const r=currentRound();
 return `<section class="focus-banner" aria-label="目前練習輪次">${roundChoices()}<strong>${r.id}｜${esc(r.name)} · 本輪只練 ${r.phraseIds.length} 個說法</strong><div class="focus-stages">${[1,2,3,4,5,6].map((n,i)=>btn(['② 學本輪句子','③ 跟著做','④ 換情況','⑤ 真人用','⑥ 看進步','⑦ 回家練'][i],`data-page="${n}"`,page===n?'aria-current="step"':'')).join('<span aria-hidden="true">→</span>')}</div></section>`;
};
focusFooter=function(){
 const r=currentRound();let nextButton='';
 if(page===0)nextButton=btn(`開始任務 ${r.id}：學本輪句子 →`,'data-page="1"');
 if(page===1)nextButton=btn('用本輪短對話去練習 →',`data-start="${focusRound}"`);
 if(page===2)nextButton=btn('只換一個條件 →','data-page="3"',finished?'':'disabled');
 if(page===3)nextButton=btn('用同樣句子，和老師接話 →','data-page="4"');
 if(page===4)nextButton=btn('本輪收尾：看看進步 →','data-page="5"');
 if(page===5)nextButton=btn(reviewMode==='mixed'?'這些任務帶回家練 →':`只練任務 ${r.id} 的回家挑戰 →`,'data-page="6"');
 if(page===6)nextButton=btn('今天先到這裡，回首頁','data-page="0"');
 return `<div class="footer-actions">${btn('← 上一部分',`data-page="${page-1}"`,page===0?'disabled':'')}${nextButton}</div>${page>=1&&page<=4?`<div class="session-stop">${btn('今天先到這裡 → 本輪收尾','data-close-round="true"')}<span class="fine">還沒練熟也可以收尾，下次再練本輪句子。</span></div>`:''}`;
};
function reviewScope(){
 const mixed=reviewMode==='mixed';
 return `<section class="panel review-scope"><h2>這次回顧哪些內容？</h2><div class="actions">${btn(`只看本輪 ${currentRound().id}`,'data-review-mode="current"',`aria-pressed="${!mixed}"`)}${btn('已學任務混合複習','data-review-mode="mixed"',`aria-pressed="${mixed}" ${roundsDone.length<2?'disabled':''}`)}</div><p class="fine">${roundsDone.length<2?'先把本輪練熟就好。師生確認兩輪以上熟悉後，才開放混合複習。':'混合複習由你手動選擇，不會自動加入下一輪。'}</p>${mixed?`<div class="review-options">${rounds.filter(r=>roundsDone.includes(r.id)).map(r=>check(`data-review-round="${r.id}"`,`任務 ${r.id} · ${r.name}`,reviewIds.includes(r.id))).join('')}</div><p class="fine">至少選兩輪；每輪仍各自比較同一題，不另加長對話。</p>`:''}</section>`;
}
function selectedReviewRounds(){return reviewMode==='mixed'?rounds.filter(r=>roundsDone.includes(r.id)&&reviewIds.includes(r.id)):[currentRound()];}
function microLegacyRecords(){
 const keys=[...new Set([...(typeof previousRevisionKeys==='object'?previousRevisionKeys:[]),previousFocusKey,previousLesson.key,...(previousLesson.legacyKeys||[])])];
 const records=keys.flatMap(key=>{try{const saved=JSON.parse(localStorage.getItem(key)||'null');return saved&&typeof saved==='object'?[{key,saved}]:[];}catch{return [];}});
 if(!records.length)return '';
 return `<details class="panel old-records"><summary>改版前的第一天紀錄（保留原樣）</summary><p>舊題和本輪不同，保留供回看，不當成新題的第一次回答或熟悉紀錄。</p>${records.map(({key,saved})=>`<h3>${key===previousFocusKey?'原分輪版本':'較早版本'}</h3>${Object.entries(saved.answers||{}).filter(([,v])=>typeof v==='string'&&v).map(([k,v])=>`<p>${esc(({before:'課前嘗試',after:'課後回答',home:'課後口說'})[k]||k)}</p><div class="readonly">${esc(v)}</div>`).join('')}<details><summary>查看這版完整舊紀錄</summary><pre class="readonly">${esc(JSON.stringify(saved,null,2))}</pre></details>`).join('')}</details>`;
}
function progressCard(r){
 const c=r.checkpoint;
 return `<section class="panel checkpoint-card" data-review-task="${r.id}"><h2>任務 ${r.id}：回到同一題</h2><p class="task">${esc(c.task)}</p>${hint(c.words,c.answer,c.answerZh)}<div class="grid"><div><h3>這一輪，第一次的我</h3><div class="readonly">${state.answers['before-'+r.id]?esc(state.answers['before-'+r.id]):'這一輪還沒有課前紀錄；照樣可以說說看，不補造第一次的答案。'}</div></div><div>${field('after-'+r.id,'現在的我')}</div></div>
 <h3>這次需要多少協助？</h3>${c.skills.map(s=>{const level=state.ratings[s.id]||0;return `<div class="rating" data-level="${level}"><h3>${esc(s.text||s.label)}</h3><div class="meter" aria-label="${ratingNames[level]}">${[1,2,3].map(n=>`<span class="${level>=n?(level===3?'green':'yellow'):''}"></span>`).join('')}</div><p>${ratingNames[level]}</p><div class="actions">${[1,2,3].map(n=>btn(ratingNames[n],`data-rating="${s.id}:${n}"`,`aria-pressed="${level===n}"`)).join('')}</div></div>`;}).join('')}
 ${check(`data-round-ready="${r.id}"`,'師生確認：不用完整範例，也能用本輪句子接話並完成任務',roundsDone.includes(r.id))}
 <p class="fine">可先看少量關鍵字，不要求逐字一樣。這個勾選由師生判斷，可取消；點完流程不會自動勾選。</p><div class="actions">${btn(`再練任務 ${r.id} 的同一段`,`data-repeat-round="${rounds.indexOf(r)}"`)}</div></section>`;
}
progressPage=function(){return head('','今天教到哪裡，就回顧到哪裡。先說同一題，再一起決定是否需要重練。')+reviewScope()+selectedReviewRounds().map(progressCard).join('')+`<section class="panel"><h2>師生一起說一句回饋</h2><p>這次哪一句比較能自己說？下次還要再練哪一段？</p></section>`+microLegacyRecords();};
function homeCard(r){
 const h=r.home,q=h.quiz,selected=quizChoices[q.id],flags=state.taskHome[r.id];
 return `<section class="panel scoped-home" data-review-task="${r.id}"><p class="eyebrow">任務 ${r.id} · 只用本輪句子</p><h2>${esc(r.name)}：回家再練同一段</h2><div class="grid"><div><h3>1. 聽熟悉的回覆</h3><p>${esc(q.question||q.task)}</p>${audio(q.line)}${transcript(q.line,q.zh)}<div class="actions">${q.options.map((o,i)=>btn(esc(o),`data-task-quiz="${r.id}:${i}"`,`aria-pressed="${selected===i}"`)).join('')}</div><div role="status">${selected!==undefined?`<p class="feedback ${selected===q.correct?'':'retry'}">${selected===q.correct?'✓ '+esc(q.feedback||q.why):'再聽一次，也可以展開文字與中文後重選。'}</p>`:''}</div>${check(`data-task-home="${r.id}:listen"`,'我已練習聽懂這句回覆',flags.listen)}</div><div><h3>2. 同樣句子，大聲說</h3><p class="task">${esc(h.task)}</p>${hint(h.words,h.answer,h.answerZh)}${field('home-'+r.id,'記下自己的說法（選填）')}${check(`data-task-home="${r.id}:spoken"`,'我已收起提示，再大聲說一次',flags.spoken)}<p class="fine" id="home-progress-${r.id}">已練習 ${Object.values(flags).filter(Boolean).length} / 2 項；這是練習紀錄，不是評分。</p></div></div></section>`;
}
function homeListening(r){
 const quizzes=r.home.quizzes||[r.home.quiz];
 return quizzes.map((q,index)=>{
  const selected=quizChoices[q.id];
  return `<div class="dg-home-quiz" data-home-quiz="${esc(q.id)}"><h3 class="task">${quizzes.length>1?`${index+1}. `:''}${esc(q.question||q.task)}</h3>${audio(q.line)}${transcript(q.line,q.zh)}<div class="actions dg-quiz-options">${q.options.map((o,i)=>btn(esc(o),`data-task-quiz="${r.id}:${q.id}:${i}"`,`aria-pressed="${selected===i}"`)).join('')}</div><div role="status">${selected!==undefined?`<p class="feedback ${selected===q.correct?'':'retry'}">${selected===q.correct?'✓ '+esc(q.feedback||q.why):'再聽一次，也可以展開文字與中文後重選。'}</p>`:''}</div></div>`;
 }).join('');
}
homePage=function(){
 const r=currentRound(),nextRound=rounds[focusRound+1];
 return head('','每輪只聽一次熟悉的回覆，再把同樣句子說出口；想多練就重來。')+reviewScope()+selectedReviewRounds().map(homeCard).join('')+`<section class="panel"><h2>下次從哪裡接著練？</h2><div class="actions">${btn(`再練任務 ${r.id}`,`data-repeat-round="${focusRound}"`)}${nextRound?btn(`任務 ${r.id} 熟悉了，先試 ${nextRound.id} →`,`data-before-round="${focusRound+1}"`,roundsDone.includes(r.id)?'':'disabled'):btn('回到這一輪的進步紀錄','data-page="5"')}</div><p class="fine">${nextRound?'先在 ⑥ 由師生確認本輪熟悉，再使用下一輪入口。老師仍可從上方任務選單調整進度。':'各輪可分開上，也可從已熟悉的任務挑選混合複習。'}</p></section>`;
};
// Keep the existing study-navigation and tablet render wrappers intact.
const microRender=render;
render=function(){
 microRender();
 if(page>=5)$('#main').insertAdjacentHTML('afterbegin',roundBanner());
};
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
 if(d.beforeRound!==undefined){setRound(+d.beforeRound);navigate(0);}
 if(d.repeatRound!==undefined){setRound(+d.repeatRound);navigate(1);}
 if(d.closeRound){reviewMode='current';persistMicro();navigate(5);}
 if(d.reviewMode){
  stopAudio();
  if(d.reviewMode==='mixed'&&roundsDone.length>=2){reviewMode='mixed';if(reviewIds.length<2)reviewIds=[...roundsDone];}
  else reviewMode='current';
  persistMicro();render();$(`[data-review-mode="${reviewMode}"]`).focus({preventScroll:true});
 }
 if(d.taskQuiz){
  const parts=d.taskQuiz.split(':'),[id]=parts,r=rounds.find(r=>r.id===id);
  if(!r)return;
  const q=parts.length===3?(r.home.quizzes||[r.home.quiz]).find(q=>q.id===parts[1]):r.home.quiz,n=Number(parts.at(-1));
  if(!q||!Number.isInteger(n)||n<0||n>=q.options.length)return;
  stopAudio();quizChoices[q.id]=n;render();$(`[data-task-quiz="${d.taskQuiz}"]`).focus({preventScroll:true});
 }
});
document.addEventListener('change',e=>{
 const d=e.target.dataset;
 if(d.roundReady){
  if(!rounds.some(r=>r.id===d.roundReady))return;
  roundsDone=rounds.map(r=>r.id).filter(id=>id===d.roundReady?e.target.checked:roundsDone.includes(id));
  reviewIds=reviewIds.filter(id=>roundsDone.includes(id));
  if(reviewMode==='mixed'&&reviewIds.length<2)reviewMode='current';
  persistMicro();render();($(`[data-round-ready="${d.roundReady}"]`)||$('#main')).focus({preventScroll:true});
 }
 if(d.reviewRound){
  if(!roundsDone.includes(d.reviewRound))return;
  if(!e.target.checked&&reviewIds.length<=2){e.target.checked=true;toast('混合複習至少保留兩輪；只練一輪請選「只看本輪」。');return;}
  reviewIds=roundsDone.filter(id=>id===d.reviewRound?e.target.checked:reviewIds.includes(id));
  stopAudio();persistMicro();render();$(`[data-review-round="${d.reviewRound}"]`).focus({preventScroll:true});
 }
 if(d.taskHome){
  const [id,kind]=d.taskHome.split(':');if(!state.taskHome[id]||!['listen','spoken'].includes(kind))return;
  state.taskHome[id][kind]=e.target.checked;save();
  $(`#home-progress-${id}`).textContent=`已練習 ${Object.values(state.taskHome[id]).filter(Boolean).length} / 2 項；這是練習紀錄，不是評分。`;
 }
});
