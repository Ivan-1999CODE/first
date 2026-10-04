// Day 1 only: preserve seven views and turn their middle four views into task rounds.
let focusRound=0,roundsDone=[];
const focusKey=course.id+'-rounds';
try{const saved=JSON.parse(localStorage.getItem(focusKey)||'{}');if(Number.isInteger(saved.round)&&rounds[saved.round])focusRound=saved.round;if(Array.isArray(saved.done))roundsDone=rounds.map(r=>r.id).filter(id=>saved.done.includes(id));}catch{}
const currentRound=()=>rounds[focusRound];
const persistRound=()=>{try{localStorage.setItem(focusKey,JSON.stringify({round:focusRound,done:roundsDone}));}catch{storageFailed=true;showStorage();}};
function setRound(n){if(!Number.isInteger(n)||!rounds[n])return;stopAudio();focusRound=n;flow=n;turn=0;history=[];finished=false;resetTurn();mode='library';reply=rounds[n].replyIds[0];mission=rounds[n].missionIds[0];pair=rounds[n].pairIds[0];persistRound();}
setRound(focusRound);
const rawTabs=tabs;
tabs=function(items,key,current){let ids=null;const r=currentRound();if(key==='start')ids=[focusRound];if(key==='mission')ids=r.missionIds;if(key==='pair')ids=r.pairIds;if(!ids)return rawTabs(items,key,current);return `<div class="tabs" aria-label="本輪情境">${ids.map(i=>btn(esc(items[i].name),`data-${key}="${i}"`,`aria-pressed="${i===current}"`)).join('')}</div>`;};
const rawStart=start;
start=function(i){if(!rounds[i])return;if(i!==focusRound)setRound(i);rawStart(i);};
const rawIntro=intro;
intro=function(){const top=rawIntro().split('<div class="section-title"><h2>今天的任務')[0];return top+`<section class="panel"><p class="eyebrow">FOCUS / 一次只帶走這一輪</p><h2>今天的任務：分三輪學，不必一次背完。</h2><p>每輪走一次「② 學句子 → ③ 跟著做 → ④ 換情況 → ⑤ 真人用」，再回來學下一輪。全課保留 ${phrases.length} 句，可分幾堂完成。</p><p class="fine">熟悉＝知道何時用，看關鍵字也能完成溝通；不需要等到完全背熟。這裡不錄音、不自動評分。</p></section><div class="cards">${rounds.map((r,i)=>`<section class="panel"><p class="eyebrow">任務 ${r.id} · ${r.phraseIds.length} 句</p><h2>${esc(r.name)}</h2><p>${esc(r.goal)}</p><p class="fine">${roundsDone.includes(r.id)?'✓ 你已標記這輪練習過':'尚未標記整輪完成'} · ${state.complete.includes(flows[i].id)?'地圖流程已練習':'地圖流程未完成'}</p>${btn(`從 ${r.id} 輪句子開始 →`,`data-focus-round="${i}"`)}</section>`).join('')}</div><details class="panel"><summary>老師看：這次如何分組</summary><p>A：問路、步行、確認左右與道謝。B：交代目的地與求助，重用 A 的步行和道謝。C：問銀行、最近超市，再把方向告訴旅伴。</p><p>先教本輪句子就去使用。第三部分有完整任務引導；第四部分換條件；第五部分靠真人接話。遇到不會的句子可以回工具箱查，不必全部背熟才能往下。</p></details>`;};
const phraseCard=(p,i,review=false)=>`<article class="panel focus-phrase"><div class="eyebrow">${review?'複習':String(i+1).padStart(2,'0')} / ${esc(p.use.replace(/^(核心|延伸|求助)｜/,''))}</div><p class="en" lang="en">${esc(p.en)}</p>${audio(p.en)}<details><summary>看中文意思</summary><p>${esc(p.zh)}</p></details></article>`;
function focusReply(){const ids=currentRound().replyIds,index=ids.indexOf(reply),r=replies[reply];return `<div class="workshop-picker">${ids.map((i,j)=>btn(`${j+1}. ${esc(replies[i].name)}`,`data-reply="${i}"`,`aria-pressed="${i===reply}"`)).join('')}</div><section class="panel workshop-card"><div class="workshop-card-top"><h2>${esc(r.name)}</h2><span class="workshop-count">${index+1} / ${ids.length}</span></div><div class="workshop-body"><div class="workshop-question"><h3>路人問你</h3>${audio(r.line)}${transcript(r.line,r.zh)}<p class="fine">聽懂就好，不必背對方台詞。</p></div><div class="workshop-answer"><h3>先試著回答</h3><p class="task">${esc(r.task)}</p>${hint(r.words,r.answer)}<div class="workshop-remix"><h3>換個答案</h3><p>${esc(r.change)}</p>${hint(r.changeWords,r.changeAnswer)}</div></div></div><div class="lesson-footer">${btn('← 上一組',`data-reply="${ids[index-1]}"`,index===0?'disabled':'')}${index<ids.length-1?btn('下一組 →',`data-reply="${ids[index+1]}"`):btn('帶著本輪句子去練習 →',`data-start="${focusRound}"`)}</div></section>`;}
phrasePage=function(){const r=currentRound(),list=r.phraseIds.map(id=>phrases.find(p=>p.id===id));return head('',`這次先用 ${list.length} 句完成「${r.name}」。先試著說，再用到情境裡。`)+`<div class="modes">${btn(`我想怎麼說<small>本輪 ${list.length} 句</small>`,'data-mode="library"',`aria-pressed="${mode==='library'}"`)}${btn(`路人問，我來答<small>本輪 ${r.replyIds.length} 組短答</small>`,'data-mode="reply"',`aria-pressed="${mode==='reply'}"`)}</div>`+(mode==='reply'?focusReply():`<p class="hint">${esc(r.bridge)}</p><div class="grid">${list.map((p,i)=>phraseCard(p,i)).join('')}</div><section class="panel"><h2>這輪只搭配這些字</h2><p class="fine">${esc(r.listen)}</p><div class="focus-words">${r.words.map(([en,zh])=>`<div><b lang="en">${esc(en)}</b><span>${esc(zh)}</span>${audio(en.replaceAll(' / ','. '))}</div>`).join('')}</div></section>${r.reuse.length?`<details class="panel"><summary>需要時再看：這輪會重用的舊句</summary><div class="grid">${r.reuse.map((i,j)=>phraseCard(phrases[i],j,true)).join('')}</div></details>`:''}<p>選一句，先說給老師聽；不用把本輪背完，就可以帶著提示去練習。</p>`);};
const rawScene=scenePage;
scenePage=function(){return rawScene().replace(/<button[^>]*data-start="\d+"[^>]*>換另一趟任務<\/button>/,'');};
lessonStep=function(f,index){return {...f.steps[index]};};
lessonScene=function(f,values,done){let point=[210,315,'起點'];f.steps.forEach((t,i)=>{if(t.valid.includes(values[i])&&t.position)point=t.position;});const [x,y,label]=point;const names=focusRound===2?['車站','超市','銀行','公車站']:['車站','郵局','公車站','警局'];return `<div class="scene-state"><h3>${esc(label)}</h3><svg class="lesson-map" viewBox="0 0 420 370" role="img" aria-label="教學地圖：${esc(label)}"><rect width="420" height="370" rx="16" fill="#e4eee7"/><path d="M45 90H375M45 215H375M210 45V330" stroke="white" stroke-width="26"/>${y!==315?`<polyline points="210,315 210,${y} ${x},${y}" fill="none" stroke="#b77922" stroke-width="7"/>`:''}${[[85,90],[335,90],[85,215],[335,215]].map(([a,b],i)=>`<rect x="${a-53}" y="${b-48}" width="106" height="36" rx="8" fill="#315e55"/><text x="${a}" y="${b-24}" text-anchor="middle" fill="white" font-size="17">${names[i]}</text>`).join('')}<circle cx="${x}" cy="${y}" r="11" fill="#b77922" stroke="white" stroke-width="3"/><text x="228" y="160" fill="#294c43" font-size="15">第二個路口</text><text x="228" y="278" fill="#294c43" font-size="15">第一個路口</text><text x="210" y="354" text-anchor="middle" fill="#294c43" font-size="16">起點 · 面朝上 ↑</text></svg><p>${done?'✓ 這趟流程已完成':'依剛才聽到的資訊，逐步更新位置。'}</p></div>`;};
function roundBanner(){const r=currentRound();return `<section class="focus-banner" aria-label="目前練習輪次"><div class="tabs">${rounds.map((x,i)=>btn(`任務 ${x.id} · ${x.phraseIds.length} 句`,`data-focus-round="${i}"`,`aria-pressed="${i===focusRound}"`)).join('')}</div><strong>${r.id}｜${esc(r.name)}</strong><div class="focus-stages">${[1,2,3,4].map((n,i)=>btn(['② 學句子','③ 跟著做','④ 換情況','⑤ 真人用'][i],`data-page="${n}"`,page===n?'aria-current="step"':'')).join('<span aria-hidden="true">→</span>')}</div><p class="fine">先完成這輪，再學下一輪；也可自由切換複習。切換輪次會重開當輪地圖，文字紀錄仍保留。</p></section>`;}
function focusFooter(){const r=currentRound();let nextButton='';
 if(page===0)nextButton=btn('從 A 輪開始 →','data-focus-round="0"');
 if(page===1)nextButton=btn(`用 ${r.id} 輪句子去練習 →`,`data-start="${focusRound}"`);
 if(page===2)nextButton=btn('進入本輪情境變化 →','data-page="3"',finished?'':'disabled');
 if(page===3){const pos=r.missionIds.indexOf(mission);nextButton=pos<r.missionIds.length-1?btn('再練本輪另一個情況 →',`data-mission="${r.missionIds[pos+1]}"`):btn('進入本輪真人問路 →','data-page="4"');}
 if(page===4){const pos=r.pairIds.indexOf(pair);nextButton=pos<r.pairIds.length-1?btn('換本輪另一個真人任務 →',`data-pair="${r.pairIds[pos+1]}"`):btn(focusRound<rounds.length-1?`這輪已練習，學 ${rounds[focusRound+1].id} 輪 →`:'這輪已練習，看看我的進步 →','data-round-done="true"');}
 if(page===5)nextButton=btn('進入課後挑戰 →','data-page="6"');
 if(page===6)nextButton=btn('回課前首頁','data-page="0"');
 return `<div class="footer-actions">${btn('← 上一部分',`data-page="${page-1}"`,page===0?'disabled':'')}${nextButton}</div>${page===4?'<p class="fine">「這輪已練習」由你自己確認，不代表系統評分或已背熟。</p>':''}`;
}
const rawProgress=progressPage;
function oldRecordView(){let saved;try{saved=JSON.parse(localStorage.getItem(previousLesson.key)||'null');}catch{return '';}if(!saved||typeof saved!=='object')return '';const answers=saved.answers||{};const rows=[['before','課前嘗試'],['after','課後回答'],...previousLesson.missions.map(m=>['mission-'+m.id,m.name]),...previousLesson.pairs.map(p=>['note-'+p.id,p.name]),['home','課後口說']];return `<details class="panel"><summary>改版前的第一天紀錄（保留原樣）</summary>${rows.filter(([key])=>typeof answers[key]==='string'&&answers[key]).map(([key,label])=>`<h3>${esc(label)}</h3><div class="readonly">${esc(answers[key])}</div>`).join('')}${previousLesson.pairs.map(p=>`<p>${esc(p.name)}：${p.goals.map((g,i)=>`${saved.checks?.[p.id]?.[i]===true?'✓':'□'} ${esc(g)}`).join('；')}</p>`).join('')}<p class="fine">舊版完成與自評紀錄仍保存在原儲存位置，不當成本輪進度。</p></details>`;}
progressPage=function(){return rawProgress()+oldRecordView();};
render=function(){const views=[intro,phrasePage,scenePage,missionPage,pairPage,progressPage,homePage];$('#main').innerHTML=(page>=1&&page<=4?roundBanner():'')+views[page]()+focusFooter();$('#nav').innerHTML=course.labels.map((t,i)=>btn(`<span class="number">${String(i+1).padStart(2,'0')}</span>${esc(t)}`,`data-page="${i}"`,i===page?'aria-current="step"':'')).join('');showStorage();};
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;if(b.dataset.focusRound!==undefined){setRound(+b.dataset.focusRound);navigate(1);}if(b.dataset.roundDone){if(!roundsDone.includes(currentRound().id))roundsDone.push(currentRound().id);persistRound();if(focusRound<rounds.length-1){setRound(focusRound+1);navigate(1);}else navigate(5);}});
const rawLoad=load;
load=function(){rawLoad();try{if(!localStorage.getItem(course.id)){const old=JSON.parse(localStorage.getItem(previousLesson.key)||'null');if(old?.answers){for(const key of ['before','after','home'])if(typeof old.answers[key]==='string')state.answers[key]=old.answers[key];}}}catch{storageFailed=true;}};

// Portrait tablets put controls beside the route; landscape keeps the speaking side.
const tabletScene=window.matchMedia('(max-width:1100px) and (orientation:portrait), (pointer:coarse) and (orientation:portrait)');
function placeSceneControls(){
 const grid=document.querySelector('#main .scene-grid');
 if(!grid)return;
 const controls=grid.querySelector('[data-act="next"]')?.parentElement;
 if(!controls)return;
 controls.classList.add('scene-step-controls');
 const destination=tabletScene.matches?grid.querySelector('.scene-board'):grid.firstElementChild;
 if(controls.parentElement!==destination)destination.append(controls);
}
const renderBeforeTablet=render;
render=function(){renderBeforeTablet();placeSceneControls();};
tabletScene.addEventListener('change',placeSceneControls);
