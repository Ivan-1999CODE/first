// Part 3 only. Saved learning records retain the original unit key and schema.
let heard=false, airportHistory=[];
const airportSteps=[
 [
  {title:'把護照遞到報到櫃檯',kind:'passport',options:['遞出護照','遞出飯店訂房單'],correct:0,result:'護照已交給地勤，開始辦理報到。',stamp:'護照已核對'},
  {title:'在航班看板找到目的地',kind:'flight',options:['LAX · Los Angeles','NRT · Tokyo','CDG · Paris'],correct:0,result:'已找到 TL 208：台北 TPE → 洛杉磯 LAX。',stamp:'目的地 LAX'},
  {title:'把一件行李放上輸送帶',kind:'bag',options:['放上 1 件行李','放上 2 件行李'],correct:0,result:'一件行李已放上輸送帶，掛上 LAX 行李牌。',stamp:'託運 1 件'},
  {title:'在座位圖選靠走道的位置',kind:'seat',options:['18A · 靠窗','18B · 中間','18C · 靠走道'],correct:2,result:'已選擇 18C 靠走道座位，登機證同步更新。',stamp:'座位 18C · 走道'},
  {title:'領取符合廣播資訊的登機證',kind:'boarding',options:['B12 · 09:20','B20 · 09:12','B12 · 09:50'],correct:0,result:'登機證已領取：B12 登機門，09:20 開始登機。',stamp:'B12 · 09:20'}
 ],
 [
  {title:'將護照放到查驗窗口',kind:'passport',options:['出示護照','出示行李收據'],correct:0,result:'護照已放到查驗窗口，準備說明這次旅行。',stamp:'已出示護照'},
  {title:'把旅行目的放進資料夾',kind:'purpose',options:['Tourism · 旅遊','Business · 商務'],correct:0,result:'旅行資料已記下：這次來洛杉磯旅遊。',stamp:'目的：旅遊'},
  {title:'在行程卡標出停留時間',kind:'days',options:['7 days · 7 天','17 days · 17 天','70 days · 70 天'],correct:0,result:'行程卡已標出 7 天，接著確認住宿。',stamp:'停留 7 天'},
  {title:'出示這次的住宿訂房單',kind:'hotel',options:['Sunny Hotel','Airport Hotel'],correct:0,result:'Sunny Hotel 訂房單已放入旅行資料夾。',stamp:'住宿 Sunny Hotel'},
  {title:'從文件夾拿出回程機票',kind:'return',options:['出示回程機票','出示託運行李收據','詢問登機門'],correct:0,result:'回程機票已出示，旅行目的、天數與住宿資料都說明完成。',stamp:'已出示回程機票'}
 ],
 [
  {title:'把攜帶物品交給海關確認',kind:'declare',options:['餅乾 · 主動詢問是否申報','沒有任何食物'],correct:0,result:'已告知攜帶餅乾，並提出申報疑問；等待海關指示。',stamp:'已告知攜帶餅乾'},
  {title:'核對包裡還有什麼',kind:'contents',options:['只有餅乾','餅乾和水果'],correct:0,result:'物品清單已確認：只有餅乾，沒有其他食物。',stamp:'沒有其他食物'},
  {title:'請對方把剛才的指示再說一次',kind:'repeat',options:['請再說一次','直接離開'],correct:0,result:'海關再次說：Please open your bag and show me the cookies. 下一步照指示操作。',stamp:'已請對方重複'},
  {title:'打開行李，出示餅乾',kind:'open',options:['打開包包，出示餅乾','直接離開海關','拿出登機證'],correct:0,result:'包包已打開，餅乾已放到檢查檯。接著等候海關指示。',stamp:'已開包出示餅乾'}
 ]
];
function airportStep(){return airportSteps[scene][turn];}
function airportReset(){heard=false;spoken=false;choice=-1;feedback='';}
function airportConfirm(id,checked){
 if(id==='heard'){heard=checked;if(!heard)spoken=false;}else spoken=checked&&heard;
 choice=-1;feedback='';airportHistory=airportHistory.slice(0,turn);render();$('#'+id).focus({preventScroll:true});
}
function canNext(){return !finished&&heard&&spoken&&choice===airportStep().correct;}
function startScene(i){stopAudio();scene=i;turn=0;finished=false;airportHistory=[];airportReset();navigate(2);}
function airportBack(){if(turn===0)return;stopAudio();turn--;airportHistory=airportHistory.slice(0,turn);airportReset();render();$('#main').focus({preventScroll:true});}
function nextTurn(){
 if(!canNext())return;stopAudio();
 if(turn===lessons[scene].turns.length-1){finished=true;if(!state.complete.includes(scene))state.complete.push(scene);save();}
 else{turn++;airportReset();}
 render();$('#main').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
}
function choose(i){
 const a=airportStep();if(finished||!heard||!spoken||!Number.isInteger(i)||i<0||i>=a.options.length)return;
 choice=i;airportHistory=airportHistory.slice(0,turn);
 if(i===a.correct){airportHistory[turn]=i;feedback=a.result;}else feedback='再試一次：'+lessons[scene].turns[turn].task+' 可以重聽或展開逐字稿。';
 // Update only the scene so open hints and speaking focus remain stable.
 $('#airportScene').innerHTML=airportScene();$('#nextTurn').disabled=!canNext();$(`[data-choice="${i}"]`).focus({preventScroll:true});
}
function airportHas(i){return airportHistory[i]===airportSteps[scene][i].correct;}
function airportArt(type){
 const shapes={passport:'<rect x="38" y="12" width="74" height="96" rx="9" fill="#345b83"/><circle cx="75" cy="55" r="19"/><path d="M56 55h38M75 36c-14 13-14 25 0 38 14-13 14-25 0-38M59 83h32"/>',bag:'<path d="M58 25V14h34v11"/><rect x="32" y="25" width="86" height="73" rx="12" fill="#769aae"/><path d="M51 39v44m24-44v44m24-44v44M47 99v9m56-9v9"/>',open:'<path d="M28 52V21q47-20 94 0v31" fill="#aec5d2"/><rect x="24" y="52" width="102" height="50" rx="10" fill="#769aae"/><circle cx="64" cy="64" r="20" fill="#e1b56d"/><circle cx="92" cy="76" r="20" fill="#e1b56d"/><path d="m59 57 3 3m8 9 3 3m14-2 3 3m7 10 3 3" stroke="#755333"/>',seat:'<rect x="49" y="17" width="52" height="57" rx="12" fill="#769aae"/><path d="M44 61v28h62V61M52 90v16m46-16v16"/>',card:'<rect x="17" y="25" width="116" height="72" rx="9" fill="#769aae"/><path d="M34 44h50M34 61h83M34 78h33m29-47v60"/>',repeat:'<path d="M33 48a44 44 0 1 1 4 50M33 22v30h30" stroke="#769aae" stroke-width="9"/>'};
 return `<svg viewBox="0 0 150 120" aria-hidden="true" fill="none" stroke="#eaf3f9" stroke-width="3" stroke-linecap="round">${shapes[type]||shapes.card}</svg>`;
}
function airportSummary(){return `<div class="airport-summary"><strong>這一站的辦理紀錄</strong><ul>${airportSteps[scene].map((a,i)=>`<li>${airportHas(i)?'✓ '+a.stamp:'○ '+['尚未辦理','尚未確認'][scene===0?0:1]}</li>`).join('')}</ul></div>`;}
function airportScene(){
 const a=airportStep(),ready=heard&&spoken,done=choice===a.correct;
 let stage='';
 if(scene===0)stage=`<div class="airport-counter"><span>TL AIR · CHECK-IN</span><div class="airport-props"><div>${airportArt('passport')}<small>${airportHas(0)?'✓ 護照已核對':'護照待出示'}</small></div><div>${airportArt('bag')}<small>${airportHas(2)?'✓ 1 件 · LAX 行李牌':'行李待託運'}</small></div></div><div class="airport-belt">${airportHas(2)?'行李已送上輸送帶 →':'行李輸送帶'}</div></div><div class="airport-pass"><span>教學登機證 ${airportHas(4)?'· ✓ 已領取':'· 辦理中'}</span><strong>TPE → ${airportHas(1)?'LAX':'待確認目的地'}</strong><div>座位 ${airportHas(3)?'18C · 靠走道':'待選擇'}<br>登機門 ${airportHas(4)?'B12 · 登機 09:20':'待領取登機證'}</div></div>`;
 if(scene===1)stage=`<div class="airport-counter"><span>IMMIGRATION · 旅行資料夾</span><div class="airport-props"><div>${airportArt('passport')}<small>${airportHas(0)?'✓ 已出示':'待出示護照'}</small></div><div>${airportArt('card')}<small>${airportHas(4)?'✓ 回程機票已出示':'回程機票待出示'}</small></div></div></div><div class="airport-pass"><strong>我的入境行程卡</strong><div>旅行目的：${airportHas(1)?'Tourism · 旅遊':'待說明'}<br>停留時間：${airportHas(2)?'7 days · 7 天':'待說明'}<br>住宿：${airportHas(3)?'Sunny Hotel':'待說明'}</div></div>`;
 if(scene===2)stage=`<div class="airport-counter"><span>CUSTOMS · 檢查檯</span><div class="airport-props"><div>${airportArt(airportHas(3)?'open':'bag')}<small>${airportHas(3)?'✓ 包包已打開 · 餅乾已出示':'包包尚未打開'}</small></div></div><div class="airport-belt">${airportHas(0)?'已告知：餅乾'+(airportHas(1)?' · 無其他食物':''):'先說明攜帶的物品'}</div></div>${airportHas(2)?'<div class="airport-pass"><strong>海關重複的指示</strong><span lang="en">Please open your bag and show me the cookies.</span></div>':''}`;
 const art=['passport','bag','seat','open','repeat'].includes(a.kind)?a.kind:'card';
 return `<div class="stage-top"><p class="task-label">03 / 操作機場場景</p><button data-scene="${scene}">重新開始這一站</button></div><h2>${a.title}</h2>${stage}<p class="fine">${ready?'點選物件或位置，完成剛才說的動作。':'先完成左側的聽讀與開口確認，再操作物件。'}</p><div class="airport-objects ${a.kind==='seat'?'airport-seats':''}">${a.options.map((v,i)=>`<button class="airport-object" data-choice="${i}" aria-pressed="${choice===i}" ${ready?'':'disabled'}>${airportArt(art)}<strong>${v}</strong>${choice===i?`<small>${done?'✓ 已完成':'請重新確認'}</small>`:''}</button>`).join('')}${a.kind==='seat'?'<span class="airport-aisle">走道</span>':''}</div><p id="feedback" class="feedback ${done?'':'retry'}" role="status" ${feedback?'':'hidden'}>${feedback}</p>${airportSummary()}`;
}
function practice(){
 const s=lessons[scene],t=s.turns[turn];
 const body=finished?`<section class="panel airport-finish"><div class="success-mark">✓</div><h2>${s.name}，練習完成。</h2>${airportSummary()}<p class="task">${['試著用英文總結：託運幾件行李、什麼座位、哪個登機門與幾點登機？','試著用英文總結：來做什麼、住幾天、住在哪裡？','試著用英文總結：帶了什麼，以及如何請對方再說一次？'][scene]}</p><p class="fine">完成記號代表走完練習，不是口說評分，也不代表實際通關結果。</p><div class="actions"><button data-scene="${scene}">重新練習這一站</button>${scene<lessons.length-1?`<button class="primary" data-scene="${scene+1}">下一站：${lessons[scene+1].name} →</button>`:'<button class="primary" data-page="3">換個情境，說出自己的需求 →</button>'}</div></section>`:
 `<div class="airport-flow"><section class="panel"><div class="speaker"><span class="avatar">${icon(s.icon)}</span><div><strong>${s.role}</strong><small>${s.en} · 第 ${turn+1} / ${s.turns.length} 步</small></div></div><p class="task-label">01 / 先聽對方說</p><div class="listen"><button class="primary" data-act="listen">▶ 播放提問</button><button data-act="slow">慢速</button></div><details class="reveal"><summary>查看英文逐字稿與中文</summary><p class="quote en" lang="en">${t.line}</p><p>${t.zh}</p></details><label class="checkline"><input id="heard" type="checkbox" ${heard?'checked':''}>我已聽完，或已讀完逐字稿</label><div class="context"><strong>你的情境</strong><br>${s.context}</div><div class="speaking-heading"><p class="task-label">02 / 換你開口</p><span class="speaking-cue"><span aria-hidden="true">↓</span> 看這裡，換你說</span></div><div class="speaking-task"><p class="task">${t.task}</p><details class="reveal"><summary>給我一點關鍵詞</summary><p class="hint en" lang="en">${t.hint}</p><details class="reveal"><summary>我試過了，看看參考回答</summary><p class="quote en" lang="en">${t.answer}</p><p class="fine">能清楚傳達意思的其他回答也可以。</p></details></details></div><label class="checkline"><input id="spoken" type="checkbox" ${spoken?'checked':''} ${heard?'':'disabled'}>我已經試著說出自己的回答</label><p class="fine">自己確認已開口即可，不會錄音或自動評分。</p><div class="lesson-footer"><button data-act="back" ${turn===0?'disabled':''}>← 上一步</button><button id="nextTurn" class="primary" data-act="next" ${canNext()?'':'disabled'}>${turn===s.turns.length-1?'完成這一站 ✓':'下一步 →'}</button></div></section><section class="panel airport-scene" id="airportScene" aria-label="機場情境操作">${airportScene()}</section></div>`;
 return head('AT THE AIRPORT','從報到到入境，自己走一遍。','先聽或讀、開口回答，再操作機場物件。每完成一步，看看這一站的辦理紀錄。')+sceneTabs('scene',scene)+`<div class="step-track" aria-label="練習進度 ${finished?s.turns.length:turn} / ${s.turns.length}">${s.turns.map((_,i)=>`<span class="${i<turn||finished?'done':''}"></span>`).join('')}</div>`+body+'<p class="main-note">這是語言練習情境；攜帶物品請如實說明，並依目的地規定與現場指示辦理。</p>';
}
