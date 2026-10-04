// Task-specific roles, optional extension material, generic scene cards and delayed practice.
const defaultReplyRole=course.replyRole;
const originalSetTaskRound=setTaskRound;
setTaskRound=function(n){originalSetTaskRound(n);course.replyRole=activeRound().role||defaultReplyRole;};
course.replyRole=activeRound().role||defaultReplyRole;
const basicOwnPhrase=ownPhrase;
ownPhrase=function(p,i,review=false){return basicOwnPhrase(p,i,review).replace('</article>',`${p.note?`<details><summary>用法補充</summary><p>${esc(p.note)}</p></details>`:''}</article>`);};
if(language==='ja'){
 const oldReading=reading;
 reading=function(text){const value=typeof kana==='object'&&kana[text];const old=oldReading(text);return value?`<details class="reading"><summary>看假名與羅馬字</summary><p lang="ja">${esc(value)}</p>${readings[text]?`<p lang="ja-Latn">${esc(readings[text])}</p>`:''}<p class="fine">需要時帶著讀，再收起來聽一次；不必先背完整五十音。</p></details>`:old;};
}
supportCard=function(){if(!support.length)return '';return `<details class="panel shared-help"><summary>聽不清楚時：隨時可以求助</summary><p class="fine">求助也是完成對話的一部分。需要時帶著用。</p>${support.map(p=>`<div class="support-phrase"><b>${esc(p.use)}</b><p class="en" lang="${language}">${esc(p.en)}</p><p>${esc(p.zh)}</p>${readingHelp(p.en)}${audio(p.en)}</div>`).join('')}</details>`;};
const allRoundReplies=r=>[...r.replyIds,...(r.extraReplyIds||[])];
// Optional old exchanges remain reachable; core tabs stay small.
listeningReply=function(){
 const r=activeRound(),ids=allRoundReplies(r),q=replies[reply],index=ids.indexOf(reply),answer=probeChoice;
 const picker=list=>list.map((n,i)=>btn(`${i+1}. ${esc(replies[n].name)}`,`data-reply="${n}"`,`aria-pressed="${n===reply}"`)).join('');
 return `<div class="workshop-picker" aria-label="本輪聽與接話">${picker(r.replyIds)}</div>${r.extraReplyIds?.length?`<details class="panel" ${r.extraReplyIds.includes(reply)?'open':''}><summary>更多餐點，選一種再練（原有 ${r.extraReplyIds.length} 組）</summary><div class="workshop-picker">${picker(r.extraReplyIds)}</div></details>`:''}<section class="panel dialogue-workshop"><div class="dialogue-title"><h2>${esc(q.name)}</h2><span class="workshop-count">${index+1} / ${ids.length}</span></div><div class="dialogue-stack"><section class="role-frame role-other" aria-label="${esc(course.replyRole)}會說的話">${roleHeader(false,`${course.replyRole}會說的話`,'先聽懂意思，不必背對方整句。')}<p class="listen-target">聽的重點：${esc(q.listen)}</p><div class="listen-modes">${btn('先聽聲音','data-listen-mode="practice"',`aria-pressed="${listenPractice}"`)}${btn('看文字與意思','data-listen-mode="model"',`aria-pressed="${!listenPractice}"`)}</div>${audio(q.line)}${listenPractice?transcript(q.line,q.zh):`<div class="model-line"><p class="en" lang="${language}">${esc(q.line)}</p><p>${esc(q.zh)}</p>${readingHelp(q.line)}</div>`}<div class="listen-check"><h4>先確認聽懂，再往下接話</h4><div class="actions">${q.options.map((x,i)=>btn(esc(x),`data-listen-choice="${i}"`,`aria-pressed="${answer===i}"`)).join('')}</div><p class="listen-feedback" role="status">${answer<0?'先聽聲音；需要時看文字，看過再收起來重聽。':answer===q.correct?'✓ '+esc(q.why):'再聽一次，或打開文字找線索。'}</p></div></section><div class="dialogue-link" aria-hidden="true">↓ 接住這句，換我說</div><section class="role-frame role-self" aria-label="我需要說的話">${roleHeader(true,'我需要說的話','先試著開口；卡住再看關鍵字。')}<div class="speaking-task"><p class="task">${esc(q.task)}</p>${hint(q.words,q.answer)}</div><details class="remix-task"><summary>再換一個條件，自己說</summary><p>${esc(q.change)}</p>${hint(q.changeWords,q.changeAnswer)}</details>${q.note?`<details><summary>原有用法補充</summary><p>${esc(q.note)}</p></details>`:''}</section></div><p class="fine">可以用單字或短句回答；不要求逐字相同。朗讀與勾選不會自動判斷發音。</p><div class="lesson-footer">${btn('← 上一組',`data-reply="${ids[index-1]}"`,index===0?'disabled':'')}${index<ids.length-1?btn('下一組 →',`data-reply="${ids[index+1]}"`):''}${btn('用這輪說法完成任務 →',`data-start="${r.flowIds[0]}"`)}</div></section>`;
};
const corePhrasePage=phrasePage;
phrasePage=function(){const r=activeRound();let html=corePhrasePage();if(mode!=='library')return html;
 if(!r.words.length)html=html.replace(/<section class="panel"><h2>把必要的聲音和意思連起來[\s\S]*?<\/section>/,'');
 if(r.hearPhraseIds?.length)html+=`<section class="role-frame role-other hear-only"><h2>這些先聽懂就好</h2><p>聽到方向，指圖或走出路線；不必先背整句。要轉告旅伴時，再練習自己說。</p>${r.hearPhraseIds.map(id=>{const p=phrases.find(x=>x.id===id);return `<article>${audio(p.en)}${transcript(p.en,p.zh)}</article>`;}).join('')}</section>`;
 if(r.extraPhraseIds?.length)html+=`<details class="panel"><summary>也可以這樣說（原有句子都保留）</summary><div class="grid">${r.extraPhraseIds.map((id,i)=>ownPhrase(phrases.find(x=>x.id===id),i)).join('')}</div></details>`;
 return html;
};
const oldLessonStep=lessonStep;
lessonStep=function(f,index,get){if(f.generic){const t={...f.steps[index]};if(t.when){const selected=get(t.when.step);if(Object.hasOwn(t.when.cases,selected))Object.assign(t,t.when.cases[selected]);}return t;}return oldLessonStep(f,index,get);};
const oldLessonScene=lessonScene;
lessonScene=function(f,values,done){if(!f.generic)return oldLessonScene(f,values,done);return `<div class="scene-state generic-scene"><div class="scene-emblem" aria-hidden="true">${esc(f.sceneIcon||'🧭')}</div><p class="eyebrow">${done?'✓ 已完成這次任務':'逐步完成這次任務'}</p><h3>${esc(f.sceneTitle||f.name)}</h3><ol class="scene-ledger">${f.steps.map((s,i)=>{const t=lessonStep(f,i,id=>values[f.steps.findIndex(x=>x.id===id)]),value=values[i];return `<li class="${value===undefined?'pending':'recorded'}"><span>${esc(t.label||'第 '+(i+1)+' 步')}</span><strong>${value===undefined?'等你聽、說，再選擇':esc(t.objects[value]?.[1]||'待確認')}</strong></li>`;}).join('')}</ol></div>`;};
const expandedScenePage=scenePage;
scenePage=function(){let html=expandedScenePage();if(finished)html=tabs(flows,'start',flow)+html;if(flows[flow].generic)html=html.replace(/<button\b[^>]*data-route-variant[^>]*>[\s\S]*?<\/button>/g,'');return html;};
// Keep every original course accessible, including longer old dialogues, without mixing their tasks into this round.
const expandedIntro=intro;
intro=function(){return expandedIntro()+`<details class="panel inventory"><summary>完整句表與改版前教材</summary><p>原有句子保留在本課任務、共用求助或延伸練習中。這裡可查整份工具箱，不需要一次背完。</p><div class="inventory-scroll"><table><thead><tr><th>用途</th><th>句子</th><th>意思</th></tr></thead><tbody>${phrases.map(p=>`<tr><td>${esc(p.use)}</td><td lang="${language}">${esc(p.en)}</td><td>${esc(p.zh)}</td></tr>`).join('')}</tbody></table></div>${typeof legacyFile==='string'?`<p><a href="${esc(legacyFile)}">查看改版前完整教材與原有綜合練習 →</a></p>`:''}</details>`;};
// Read old shapes without ever writing to an old storage key or mistaking old checkmarks for new tasks.
oldRecords=function(){const keys=[...new Set([previousLesson.key,...(previousLesson.legacyKeys||[])])];return keys.map(key=>{let old;try{old=JSON.parse(localStorage.getItem(key)||'null');}catch{return '';}if(!old||typeof old!=='object')return '';const source=old.answers||old;const values=Object.entries(source).filter(([,v])=>typeof v==='string'&&v);return `<details class="panel"><summary>改版前的紀錄（保留原樣）</summary>${values.map(([k,v])=>`<h3>${esc(({before:'課前嘗試',after:'原課後回答',home:'課後口說',homeNote:'課後口說',pairNote:'真人練習筆記'})[k]||k)}</h3><div class="readonly">${esc(v)}</div>`).join('')}<details><summary>完整舊紀錄與勾選</summary><pre class="old-record">${esc(JSON.stringify(old,null,2))}</pre></details><p class="fine">原有作答與勾選沒有清除；新任務的完成程度分開記錄。</p></details>`;}).join('');};
const expandedHome=homePage;
homePage=function(){return expandedHome()+`<section class="panel"><h2>隔一段時間，每個任務各試一次</h2><p>先讀情境，自己說；卡住再打開提示。下一次換條件再做，觀察需要多少協助。</p>${reviewTasks.map(t=>`<details class="review-task"><summary>${esc(t.id)}｜${esc(t.name)}</summary><p class="task">${esc(t.task)}</p>${hint(t.words,t.answer)}${field('review-'+t.id,'這次自己的說法')}</details>`).join('')}</section>`;};
for(const t of reviewTasks){fields.push('review-'+t.id);state.answers['review-'+t.id]='';}
