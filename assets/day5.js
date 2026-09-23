'use strict';
const $=s=>document.querySelector(s),KEY='travel-lab-unit5-getting-around-v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels=['今天，怎麼到目的地？','城市移動隨身句','問路到搭車情境互動','說出自己的交通需求','雙人城市移動任務','看看我的進步','課後交通挑戰'];
const phrases=[
 ['禮貌問路','Excuse me. How do I get to the museum?','不好意思，請問博物館怎麼走？'],
 ['確認遠近','Is it far?','遠嗎？'],
 ['聽方向','Go straight.','直走。'],['聽方向','Turn left at the first intersection.','在第一個路口左轉。'],['聽方向','Turn right at the second intersection.','在第二個路口右轉。'],
 ['告知目的地','Can you take me to the museum, please?','可以請你載我去博物館嗎？'],
 ['詢問時間','How long does it take?','需要多久？'],['詢問車資','How much will it be?','大約要多少錢？'],
 ['確認 Uber','Are you my Uber driver?','你是我的 Uber 司機嗎？'],['說明接車位置','I’m outside the hotel entrance.','我在飯店入口外面。'],
 ['指定下車地點','Could you stop here, please?','可以請你在這裡停車嗎？'],['聽不清楚','Could you say that again, please?','可以請你再說一次嗎？']
];
const originalLessons=[
 {name:'先問路，再決定',en:'Ask & decide',role:'路人',desc:'問出方向與遠近，決定走路還是搭車。',context:'從 Sunny Hotel 出發，你想去 City Museum。先問路，再確認走路要多久。',turns:[
  {line:'Hello! Do you need help?',zh:'你好！需要幫忙嗎？',task:'禮貌地問路人：City Museum 怎麼走？',hint:'Excuse me / How do I get to…?',answer:'Excuse me. How do I get to the City Museum?',action:'我問好了，聽路人指路'},
  {line:'Go straight. Turn left at the second intersection. The museum is on your right.',zh:'直走，在第二個路口左轉。博物館在你的右手邊。',task:'先用英文確認「第二個路口左轉」，再點地圖上聽到的地點。地點以 A、B、C 標示。',hint:'Left / second intersection / right',answer:'Turn left at the second intersection, right?',map:true,quiz:{options:['A 地點','B 地點','C 地點'],correct:0,why:'面朝上方直走，在第二個路口左轉；轉彎後右手邊是 A，也就是 City Museum。'}},
  {line:'Yes, that’s right.',zh:'對，沒錯。',task:'你知道方向了，接著問遠不遠。',hint:'Is it…?',answer:'Is it far?',action:'我問好了，確認遠近'},
  {line:'It’s about a thirty-minute walk. You can take a taxi from the hotel.',zh:'走路大約 30 分鐘。你可以從飯店搭計程車。',task:'你想省下走路的時間。先道謝並說要搭計程車，再選出聽到的步行時間。',hint:'Thank you / I’ll take…',answer:'Thank you. I’ll take a taxi.',quiz:{options:['13 分鐘','30 分鐘','3 分鐘'],correct:1,why:'thirty 是 30；這是步行時間，還不是車程。'}}
 ]},
 {name:'搭計程車去博物館',en:'Take a taxi',role:'計程車司機',desc:'說出目的地，問清楚車程與預估車資。',context:'你回到 Sunny Hotel 門口的計程車乘車處，要前往 City Museum，並想先確認時間與車資。',turns:[
  {line:'Hi. Where would you like to go?',zh:'你好，你想去哪裡？',task:'請司機載你去 City Museum。',hint:'Can you take me to… / please',answer:'Can you take me to the City Museum, please?',action:'我說好了，告知目的地'},
  {line:'The City Museum? Of course.',zh:'City Museum 嗎？當然可以。',task:'問司機搭車需要多久。',hint:'How long… / take',answer:'How long does it take?',action:'我問好了，確認車程'},
  {line:'About fifteen minutes, depending on traffic.',zh:'大約 15 分鐘，要看交通狀況。',task:'先確認你聽到的時間，再詢問車資。選出正確的預估車程。',hint:'Fifteen minutes / How much…?',answer:'About fifteen minutes. How much will it be?',quiz:{options:['50 分鐘','5 分鐘','15 分鐘'],correct:2,why:'fifteen 是 15；fifty 才是 50。depending on traffic 表示視交通狀況而定。'}},
  {line:'About twenty dollars. The final fare is on the meter.',zh:'大約 20 美元，最後車資以跳表金額為準。',task:'接受預估車資並表示可以出發，再選出司機說的金額。',hint:'That’s fine / Let’s go',answer:'That’s fine. Let’s go, please.',quiz:{options:['固定收費 20 美元','預估 20 美元，最後看跳表','預估 12 美元'],correct:1,why:'About 是大約，這個教學情境的 20 美元是估價，不是保證金額。'}},
  {line:'We’re at the museum now. Where would you like to get out?',zh:'我們到博物館了，你想在哪裡下車？',task:'你看見可以停車的位置。請司機在這裡停車並道謝。',hint:'Could you stop… / Thank you',answer:'Could you stop here, please? Thank you.',action:'我說好了，在這裡下車'}
 ]},
 {name:'用 Uber 回飯店',en:'Meet & ride',role:'Uber 司機',desc:'確認接車位置、司機與目的地，順利回飯店。',context:'逛完博物館，你已在 App 叫車回 Sunny Hotel。畫面上的教學訂單：司機 Alex、白色車、車牌 TL-205，預估費用 18 美元。你在博物館正門外。',turns:[
  {line:'Hi, this is Alex, your driver. Where are you waiting?',zh:'你好，我是你的司機 Alex。你在哪裡等？',task:'告訴司機，你在博物館正門外。',hint:'I’m outside… / main entrance',answer:'I’m outside the museum’s main entrance.',action:'我說好了，確認接車點'},
  {line:'I’m in a white car. The license plate is T L two zero five.',zh:'我開白色的車，車牌是 TL-205。',task:'先確認車牌，再當面問是不是你的 Uber 司機。選出符合教學訂單的車輛。',hint:'Are you my…?',answer:'Are you my Uber driver?',quiz:{options:['白色車 · TL-250','白色車 · TL-205','黑色車 · TL-205'],correct:1,why:'two zero five 是 205。接車時對照 App 上的車牌與司機資料。'}},
  {line:'Yes. We’re going to Sunny Hotel, right?',zh:'是的，我們是要去 Sunny Hotel，對嗎？',task:'確認飯店，再問車程多久。',hint:'Yes / Sunny Hotel / How long…?',answer:'Yes, Sunny Hotel. How long does it take?',action:'我說好了，確認回程'},
  {line:'About ten minutes. I’ll drop you off at the main entrance.',zh:'大約 10 分鐘。我會讓你在正門下車。',task:'先確認在飯店正門下車並道謝，再選出時間與位置。',hint:'The main entrance / Thank you',answer:'The main entrance, please. Thank you.',quiz:{options:['10 分鐘 · 正門','20 分鐘 · 側門','10 分鐘 · 停車場'],correct:0,why:'ten minutes 是 10 分鐘，main entrance 是正門。'}}
 ]}
];
// Every turn has one action in the scene. Spoken confirmation unlocks it.
const outwardActions=[
 {kind:'places',title:'你想去哪裡？',options:['City Museum','Sunny Hotel','Central Station'],correct:0,result:'目的地已標記：City Museum。接著聽路人指路。'},
 {kind:'map',title:'沿著指示，在地圖上找景點。',options:['A 地點','B 地點','C 地點'],correct:0,result:'路線已顯示：第二個路口左轉，博物館在右手邊。'},
 {kind:'distance',title:'你接著想確認什麼？',options:['遠近與步行時間','博物館門票'],correct:0,result:'你向路人詢問遠近，接著聽他的回答。'},
 {kind:'transport',title:'走路 30 分鐘。你想省時，選擇交通方式。',options:['走路前往','到飯店門口搭計程車'],correct:1,result:'你來到 Sunny Hotel 的計程車乘車處。'},
 {kind:'places',title:'把目的地告訴司機。',options:['Central Station','Sunny Hotel','City Museum'],correct:2,result:'車上的目的地已設定為 City Museum。'},
 {kind:'time',title:'你要先問清楚哪件事？',options:['車程要多久','幾點閉館'],correct:0,result:'你向司機詢問車程，接著聽時間。'},
 {kind:'time',title:'在行程卡上選出聽到的車程。',options:['約 50 分鐘','約 5 分鐘','約 15 分鐘'],correct:2,result:'行程卡更新：預估車程 15 分鐘。接著確認車資。'},
 {kind:'fare',title:'確認估價，再點選上車出發。',options:['固定 20 美元 · 出發','預估 20 美元 · 出發','預估 12 美元 · 出發'],correct:1,result:'你上車出發了！車程約 15 分鐘，車資依跳表結算。'},
 {kind:'dropoff',title:'抵達 City Museum。點選正門下車處。',options:['側門','正門下車處','停車場'],correct:1,result:'你在 City Museum 正門下車，去程任務完成！'}
];
const returnActions=[
 {kind:'pickup',title:'在博物館場景上，標記你等車的位置。',options:['正門外','側門外','停車場'],correct:0,result:'接車點已標記在正門外，司機知道你在哪裡了。'},
 {kind:'cars',title:'核對教學訂單，點選你的車。',options:['白色車 · TL-250','白色車 · TL-205','黑色車 · TL-205'],correct:1,result:'車色與車牌相符。你已找到 Alex 的車，接著確認目的地。'},
 {kind:'places',title:'核對車上的目的地。',options:['City Museum','Sunny Hotel','Sunrise Hotel'],correct:1,result:'目的地已確認為 Sunny Hotel，車輛出發。'},
 {kind:'time',title:'聽完後，更新回程行程卡。',options:['約 10 分鐘 · 正門','約 20 分鐘 · 側門','約 10 分鐘 · 停車場'],correct:0,result:'行程卡更新：預估 10 分鐘，到 Sunny Hotel 正門。'},
 {kind:'dropoff',title:'抵達飯店。點選你要下車的位置。',options:['停車場','側門','正門下車處'],correct:2,result:'你在 Sunny Hotel 正門下車，回程任務完成！'}
];
const lessons=[
 {name:'去景點',en:'Outward · City Museum',role:'路人／計程車司機',desc:'先問路與遠近，再搭計程車到博物館正門。',context:'你從 Sunny Hotel 出發，要去 City Museum。先問路；得知步行太遠後，改搭計程車。',turns:[...originalLessons[0].turns,...originalLessons[1].turns].map((t,i)=>({...t,role:i<4?'路人':'計程車司機',context:i<4?originalLessons[0].context:originalLessons[1].context,interaction:outwardActions[i],quiz:undefined,map:i===1}))},
 {name:'回飯店',en:'Return · Sunny Hotel',role:'Uber 司機',desc:'確認接車點、找對車，搭 Uber 回飯店正門。',context:originalLessons[2].context,turns:[...originalLessons[2].turns,{line:'Here we are at Sunny Hotel. Where would you like to get out?',zh:'我們到 Sunny Hotel 了，你想在哪裡下車？',task:'指定在飯店正門下車，再向司機道謝。',hint:'main entrance / stop here / thank you',answer:'Could you stop here at the main entrance, please? Thank you.'}].map((t,i)=>({...t,interaction:returnActions[i],quiz:undefined}))}
];
lessons[0].turns[1].task='聽方向，先用自己的英文確認路線，再在地圖上點選目的地。';
lessons[0].turns[3].task='你不想走 30 分鐘。先道謝並說要搭計程車，再點選交通方式。';
lessons[0].turns[8].task='你想在博物館正門下車。先請司機在正門停車，再點選下車處。';
lessons[0].turns[8].answer='Could you stop here at the main entrance, please? Thank you.';
const missions=[
 {field:'rushNote',title:'有點趕時間',context:'你要從飯店搭車去 Central Station，30 分鐘後有火車。請說目的地、問車程，再告訴司機你的時間限制。',words:'Central Station · thirty minutes · train',starter:'Can you take me to…? / How long…? / My train leaves…',answer:'Can you take me to Central Station, please? How long does it take? My train leaves in thirty minutes.'},
 {field:'fareNote',title:'先確認車資',context:'你想搭計程車去 Riverside Market，先詢問預估車資。聽到金額但沒聽清楚，請司機再說一次。',words:'Riverside Market · fare · again',starter:'Can you take me to…? / How much…? / Could you…?',answer:'Can you take me to Riverside Market, please? How much will it be? Could you say that again, please?'},
 {field:'stopNote',title:'在指定入口下車',context:'你已在 Uber 上，目的地是 Green Park Hotel。你想在飯店正門下車；到達後看到合適的位置，請司機停車。',words:'Green Park Hotel · main entrance · here',starter:'Could you drop me off…? / Could you stop…?',answer:'Could you drop me off at the main entrance of Green Park Hotel, please? Could you stop here, please? Thank you.'}
];
const pairCards=[
 {name:'問路與遠近',a:'你要從飯店去 Riverside Market。問路後，確認遠近。如果太遠，追問哪裡可以搭計程車。',b:'你是路人。等旅客詢問後才提供方向與時間；如果對方問搭車地點，再說明。',secret:'直走，第一個路口右轉，市場在左邊。走路 25 分鐘。飯店門口可以搭計程車。',prompt:'Go straight. Turn right at the first intersection. It’s on your left. / It’s a twenty-five-minute walk. / You can get a taxi outside the hotel.'},
 {name:'搭車去車站',a:'你要去 Central Station，火車 30 分鐘後開。你有 30 美元預算。先問車程與車資，再決定是否搭車。',b:'你是司機。先問目的地，等旅客詢問後再提供預估時間與費用。',secret:'預估車程 20 分鐘，費用約 25 美元；交通狀況可能影響抵達時間。',prompt:'Where would you like to go? / About twenty minutes, depending on traffic. / About twenty-five dollars.'},
 {name:'Uber 接車',a:'你的教學訂單：司機 Sam、藍色車、車牌 TL-318。你在 City Museum 正門外，要回 Sunny Hotel。請說接車位置並核對車輛。',b:'你是司機 Sam。旅客的目的地是 Sunny Hotel，但你還不知道對方在哪個入口。',secret:'藍色車，車牌 TL-318。抵達接車點還要 3 分鐘；到飯店車程約 12 分鐘。',prompt:'Where are you waiting? / I’m in a blue car. The license plate is T L three one eight. / I’ll be there in three minutes. / It takes about twelve minutes to get to the hotel.'}
];
const skills=['我能問路、聽懂左右方向與遠近','我能說目的地，詢問車程與車資','我能確認接車位置並說明下車地點'];
const fields=['before','after','pairNote','homeNote','rushNote','fareNote','stopNote'];
let state={before:'',after:'',pairNote:'',homeNote:'',rushNote:'',fareNote:'',stopNote:'',journeyVersion:2,complete:[],ratings:[-1,-1,-1],home:[false,false,false]},storageOK=true;
try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x&&typeof x==='object'){for(const k of fields)if(typeof x[k]==='string')state[k]=x[k];if(x.journeyVersion===2&&Array.isArray(x.complete))state.complete=[...new Set(x.complete.filter(n=>Number.isInteger(n)&&n>=0&&n<2))];if(Array.isArray(x.ratings)&&x.ratings.length===3)state.ratings=x.ratings.map(n=>[0,1,2].includes(n)?n:-1);if(Array.isArray(x.home)&&x.home.length===3)state.home=x.home.map(n=>n===true);}}catch(e){storageOK=false;}
let page=0,scene=0,turn=0,spoken=false,choice=-1,feedback='',finished=false,role='A',pair=0,mission=0,homeMapChoice=-1,homeFareChoice=-1,toastTimer;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){storageOK=false;$('#storageNotice').hidden=false;}}
function toast(s){$('#toast').textContent=s;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,4200);}
function stopAudio(){if('speechSynthesis' in window)window.speechSynthesis.cancel();}
function speak(text,slow=false){if(!('speechSynthesis' in window)){toast('這個瀏覽器沒有朗讀功能，請展開英文逐字稿。');return;}stopAudio();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=slow?.7:.9;const voices=window.speechSynthesis.getVoices();const v=voices.find(v=>v.lang==='en-US')||voices.find(v=>v.lang.startsWith('en'));if(v)u.voice=v;u.onerror=e=>{if(e.error!=='interrupted'&&e.error!=='canceled')toast('語音暫時無法播放，請展開英文逐字稿。');};window.speechSynthesis.speak(u);}
function field(k,label,placeholder='先說出來，再記下你的版本。'){return `<label class="field-label" for="${k}">${label}</label><textarea id="${k}" data-field="${k}" placeholder="${placeholder}">${esc(state[k])}</textarea>`;}
function head(k,title,sub){return `<div class="page-head"><p class="eyebrow">DAY 05 / ${k}</p><h1>${title}</h1><p class="muted">${sub}</p></div>`;}
function hints(words,answer,starter=''){return `<details class="reveal"><summary>需要一點關鍵詞</summary><p class="hint en" lang="en">${words}</p>${starter?`<p class="en">句子開頭：${starter}</p>`:''}<details class="reveal"><summary>我試過了，看看一種參考說法</summary><p class="quote en" lang="en">${answer}</p><button data-say="${esc(answer)}">▶ 聽參考</button><p class="fine">這是一種說法。收起提示後，用自己的聲音再說一次。</p></details></details>`;}
function tabs(attr,active,items=lessons){return `<div class="tabs">${items.map((s,i)=>`<button data-${attr}="${i}" aria-pressed="${active===i}">${i+1}. ${s.name||s.title}</button>`).join('')}</div>`;}
function footer(prev,next){return `<div class="lesson-footer">${prev>=0?`<button data-page="${prev}">← ${labels[prev]}</button>`:'<span></span>'}${next<7?`<button class="primary" data-page="${next}">${labels[next]} →</button>`:''}</div>`;}
function cityMap(attr='',selected=-1,solved=false,home=false){const spots=[{x:20,y:17},{x:76,y:17},{x:76,y:51}];return `<div class="city-map" aria-label="城市地圖：起點朝上，A 在第二個路口西北側，B 在第二個路口東北側，C 在第一個路口東北側"><svg viewBox="0 0 500 420" aria-hidden="true"><rect width="500" height="420" rx="24" fill="#eaf0e9"/><g fill="#d8e4d6"><rect x="28" y="133" width="148" height="52" rx="12"/><rect x="327" y="300" width="137" height="83" rx="14"/><rect x="36" y="295" width="136" height="80" rx="12"/></g><g stroke="#fff" stroke-width="37"><path d="M250 0v420M0 120h500M0 263h500"/></g><g stroke="#cbd5ce" stroke-width="1.5" stroke-dasharray="6 7"><path d="M250 0v420M0 120h500M0 263h500"/></g><text x="270" y="148" fill="#52655c" font-size="14">第二個路口</text><text x="270" y="291" fill="#52655c" font-size="14">第一個路口</text>${solved?`<path d="${home?'M250 364V263H380V233':'M250 364V120H100V91'}" fill="none" stroke="#0071e3" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/>`:''}<circle cx="250" cy="360" r="19" fill="#0071e3"/><path d="m250 348-8 19 8-4 8 4z" fill="white"/><text x="250" y="402" text-anchor="middle" fill="#234738" font-size="15">你在這裡 · 面朝上方 ↑</text></svg>${spots.map((p,i)=>attr?`<button class="map-pin" style="left:${p.x}%;top:${p.y}%" data-${attr}="${i}" aria-label="${'ABC'[i]} 地點" aria-pressed="${selected===i}" ${attr==='choice'&&!spoken?'disabled':''}>${'ABC'[i]}<small>${solved&&i===(home?2:0)?home?'Market':'Museum':'地點'}</small></button>`:`<span class="map-pin static-pin" style="left:${p.x}%;top:${p.y}%">${'ABC'[i]}<small>${['Museum','Park','Market'][i]}</small></span>`).join('')}</div><p class="fine map-caption">教學示意圖，非實際比例。轉彎後，左右以你面向的方向判斷。</p>`;}
function overview(){return `<section class="hero"><div class="hero-copy"><p class="eyebrow">DAY 05 / GETTING AROUND TOWN</p><h1>想去的地方，<br><span>開口就近一點。</span></h1><p class="lead">從街角問路，到坐上計程車。<br>問清楚方向、時間與費用，<br>用幾句英文，走完自己的城市旅程。</p><div class="actions"><button class="primary" data-page="1">帶上隨身句 ↗</button><button class="plain" data-scene="0">直接試著問路 →</button></div></div><div class="city-hero">${cityMap()}<div class="ride-card"><span class="ride-icon" aria-hidden="true">↗</span><div><small>YOUR NEXT STOP</small><strong>City Museum</strong><span>先問路，再選擇怎麼到。</span></div><span class="ride-pill">LET’S GO</span></div></div></section><div class="section-head"><h2>出發前，先留下自己的版本。</h2></div><section class="panel">${field('before','你想去 City Museum：先問路與遠近，再向計程車司機詢問時間與車資。你會怎麼說？')}<p class="fine">單字或短句都可以。先自己說，再請同學幫忙記錄。紀錄保存在本機瀏覽器。</p></section><div class="section-head"><h2>去景點，再回飯店。</h2><span class="progress-pill">${state.complete.length} / 2 已練習</span></div><div class="journey-grid two-journeys">${lessons.map((s,i)=>`<section class="journey-card"><p class="eyebrow">0${i+1} / ${s.en.toUpperCase()} ${state.complete.includes(i)?'✓':''}</p><h3>${s.name}</h3><p>${s.desc}</p><button class="plain" data-scene="${i}">進入練習 →</button></section>`).join('')}</div>${footer(-1,1)}`;}
// BEGIN PHRASE WORKSHOP
// Shared second-section interaction, embedded in each standalone lesson.
function createPhraseWorkshop(config){
 let mode='library',index=0;
 const audio=(text,label='聽發音')=>`<div class="actions"><button data-workshop-say="${esc(text)}">▶ ${label}</button><button data-workshop-say="${esc(text)}" data-workshop-slow="true">慢速重播</button></div>`;
 const hints=(words,answer)=>`<details class="reveal"><summary>需要一點關鍵字</summary><p class="hint" lang="en">${esc(words)}</p><details class="reveal"><summary>我試過了，看看參考說法</summary><p class="quote" lang="en">${esc(answer)}</p>${audio(answer)}</details></details>`;
 function renderPage(){
  const q=config.replies[index];
  const tabs=`<div class="workshop-modes" role="group" aria-label="選擇練習方式"><button data-workshop-mode="library" aria-pressed="${mode==='library'}"><strong>我想怎麼說</strong><small>${phrases.length} 句隨身英文</small></button><button data-workshop-mode="reply" aria-pressed="${mode==='reply'}"><strong>${config.label}</strong><small>${config.replies.length} 組情境問答</small></button></div>`;
  const style=`<style>.workshop-modes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:24px 0}.workshop-modes button{text-align:left;padding:18px;min-width:0;border:1px solid var(--line,#dedee5)}.workshop-modes strong,.workshop-modes small{display:block}.workshop-modes small{margin-top:6px}.workshop-modes [aria-pressed=true],.workshop-picker [aria-pressed=true]{background:#0066cc;color:white}.workshop-picker{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}.workshop-picker button{min-height:44px}.workshop-card{padding:0;overflow:hidden}.workshop-card-top{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:22px 26px;border-bottom:1px solid var(--line,#dedee5)}.workshop-card-top h2{margin:0}.workshop-count{white-space:nowrap}.workshop-body{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.workshop-question,.workshop-answer{padding:26px;min-width:0}.workshop-question{background:#eef3f8}.workshop-role{display:flex;align-items:center;gap:12px;margin-bottom:22px;font-weight:600}.workshop-role svg{width:60px;height:60px;flex-shrink:0;color:#546b84}.workshop-remix{margin-top:24px;padding-top:20px;border-top:1px solid var(--line,#dedee5)}.workshop-card .lesson-footer{margin:0;padding:22px 26px;border-top:1px solid var(--line,#dedee5)}.workshop-card button,.workshop-card summary{min-height:44px}.workshop-card .quote{overflow-wrap:anywhere}[data-theme=dark] .workshop-question{background:#253344}[data-theme=dark] .workshop-role svg{color:#bfd5ef}@media(max-width:700px){.workshop-body{grid-template-columns:1fr}.workshop-question,.workshop-answer{padding:20px}.workshop-modes button{padding:14px}.workshop-card-top{padding:20px}.workshop-card .lesson-footer{padding:20px;flex-wrap:wrap}.workshop-modes strong{font-size:.9rem}}@media(prefers-contrast:more){.workshop-modes button,.workshop-card{border:2px solid currentColor}}</style>`;
  if(mode==='library')return style+phraseLibrary().replace('<div class="phrases">',tabs+'<div class="phrases">');
  return style+head('LISTEN & REPLY','聽懂一句，接上自己的回答。','先聽對方的問題，依情境開口回答；需要時再展開提示。')+tabs+`<div class="workshop-picker" role="group" aria-label="選擇問答情境">${config.replies.map((r,i)=>`<button data-workshop-reply="${i}" aria-pressed="${index===i}">${i+1}. ${esc(r.name)}</button>`).join('')}</div><section class="panel workshop-card" aria-labelledby="workshopHeading"><div class="workshop-card-top"><h2 id="workshopHeading" tabindex="-1">${esc(q.name)}</h2><span class="workshop-count">${index+1} / ${config.replies.length}</span></div><div class="workshop-body"><div class="workshop-question"><div class="workshop-role"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="25" cy="20" r="10"/><path d="M7 57v-9c0-18 36-18 36 0v9M41 8h18v16H47l-6 6V8"/><path d="M46 14h8m-8 5h5"/></svg><span>${esc(q.role)}問你</span></div>${audio(q.en,'聽對方說')}<details class="reveal"><summary>查看對方的英文與中文</summary><p class="quote" lang="en">${esc(q.en)}</p><p>${esc(q.zh)}</p></details><p class="fine">聽懂問題就好，不必背誦對方的台詞。</p></div><div class="workshop-answer"><p class="eyebrow">YOUR TURN / 換你回答</p><h3>先試著說，不急著看答案。</h3><p class="task">${esc(q.task)}</p>${hints(q.hint,q.answer)}<div class="workshop-remix"><h3>換成你的答案</h3><p>${esc(q.change)}</p>${hints(q.changeHint,q.changeAnswer)}</div>${q.note?`<p class="fine">${esc(q.note)}</p>`:''}<p class="fine">單字或短句都可以，說得通即可；這裡不錄音，也不自動評分。</p></div></div><div class="lesson-footer"><button data-workshop-reply="${index-1}" ${index===0?'disabled':''}>← 上一組</button>${index<config.replies.length-1?`<button class="primary" data-workshop-reply="${index+1}">下一組 →</button>`:'<button class="primary" data-page="2">進入互動流程 →</button>'}</div></section><div class="lesson-footer"><button data-page="0">← 課前嘗試</button><button data-workshop-mode="library">回到我想怎麼說</button></div>`;
 }
 function handle(d){
  if(page!==1)return false;
  if(d.workshopSay!==undefined){speak(d.workshopSay,d.workshopSlow==='true');return true;}
  let focus;
  if(d.workshopMode!==undefined){if(!['library','reply'].includes(d.workshopMode))return true;mode=d.workshopMode;focus=`[data-workshop-mode="${mode}"]`;}
  else if(d.workshopReply!==undefined){const next=Number(d.workshopReply);if(!Number.isInteger(next)||next<0||next>=config.replies.length)return true;index=next;focus='#workshopHeading';}
  else return false;
  stopAudio();render();$(focus)?.focus({preventScroll:true});return true;
 }
 return {render:renderPage,handle};
}

const phraseWorkshopConfig={
  "label": "對方問，我來答",
  "replies": [
    {
      "id": "do-you-need-help",
      "name": "接受問路協助",
      "role": "路人",
      "en": "Do you need help?",
      "zh": "你需要幫忙嗎？",
      "task": "你正在找 City Museum，請對方幫忙。",
      "hint": "yes / looking for / museum",
      "answer": "Yes, I’m looking for the City Museum.",
      "change": "換成正在找火車站。",
      "changeHint": "looking for / train station",
      "changeAnswer": "Yes, I’m looking for the train station."
    },
    {
      "id": "where-would-you-like-to-go",
      "name": "告訴司機目的地",
      "role": "計程車司機",
      "en": "Where would you like to go?",
      "zh": "您想去哪裡？",
      "task": "你要去 City Museum。",
      "hint": "City Museum / please",
      "answer": "The City Museum, please.",
      "change": "回程要去 Sunny Hotel。",
      "changeHint": "Sunny Hotel",
      "changeAnswer": "Sunny Hotel, please."
    },
    {
      "id": "would-you-like-to-take-a-taxi",
      "name": "選擇交通方式",
      "role": "路人",
      "en": "Would you like to take a taxi?",
      "zh": "你想搭計程車嗎？",
      "task": "路程有點遠，你決定搭計程車。",
      "hint": "yes / taxi",
      "answer": "Yes, I’ll take a taxi.",
      "change": "如果你想散步過去呢？",
      "changeHint": "no / walk",
      "changeAnswer": "No, thanks. I’ll walk."
    },
    {
      "id": "where-are-you-waiting",
      "name": "說明接車位置",
      "role": "Uber 司機",
      "en": "Where are you waiting?",
      "zh": "您在哪裡等車？",
      "task": "你在飯店入口外面。",
      "hint": "outside / hotel entrance",
      "answer": "I’m outside the hotel entrance.",
      "change": "把位置換成博物館入口。",
      "changeHint": "museum entrance",
      "changeAnswer": "I’m at the museum entrance."
    },
    {
      "id": "would-you-like-to-get-out-here",
      "name": "確認下車位置",
      "role": "司機",
      "en": "Would you like to get out here?",
      "zh": "您想在這裡下車嗎？",
      "task": "現在的位置可以，請司機停車。",
      "hint": "yes / here",
      "answer": "Yes, here is fine.",
      "change": "如果你想在前面的入口下車呢？",
      "changeHint": "at / entrance / please",
      "changeAnswer": "At the entrance, please."
    }
  ]
};
const phraseWorkshop=createPhraseWorkshop(phraseWorkshopConfig);
function phrasePage(){return phraseWorkshop.render();}
// END PHRASE WORKSHOP
function phraseLibrary(){return head('POCKET PHRASES','幾句英文，帶你走得更遠。','先選 3 句練熟，再換成自己的目的地。前 5 句複習問路，接著練搭車。')+`<div class="phrases">${phrases.map((p,i)=>`<section class="phrase"><span class="phrase-index">${String(i+1).padStart(2,'0')} / ${p[0]}</span><p class="quote en" lang="en">${p[1]}</p><details class="reveal"><summary>看中文意思</summary><p>${p[2]}</p></details><div class="actions"><button data-phrase="${i}">▶ 聽發音</button><button data-phrase="${i}" data-slow="true">慢速</button></div></section>`).join('')}</div><section class="panel" style="margin-top:24px"><h2>換個地點，馬上用。</h2><p class="en">the museum · 博物館　/　the train station · 火車站　/　Sunny Hotel · 飯店</p><p>問完整路程：<span class="en">How long does it take to get there?</span><br>強調搭車：<span class="en">How long does it take by taxi?</span></p><p class="fine">計程車可詢問預估車資；Uber 情境先在 App 確認行程與費用，再和司機確認接車點。本教材的價格與訂單都是練習設定。</p></section>${footer(0,2)}`;}
function ownNeeds(){const m=missions[mission];return head('YOUR OWN WORDS','這次，說出你的需要。','三種新情境，先想清楚要問什麼。每份回答會各自保存。')+tabs('mission',mission,missions)+`<div class="grid"><section class="panel tinted"><p class="eyebrow">TRY IT / 0${mission+1}</p><h2>${m.title}</h2><p class="task">${m.context}</p>${hints(m.words,m.answer,m.starter)}</section><section class="panel">${field(m.field,'先開口，再記下我的英文')}<p class="fine">可以分成幾句短句。請同學確認：目的地清楚嗎？你想知道的資訊問到了嗎？</p></section></div>${footer(2,4)}`;}
function pairPage(){const c=pairCards[pair];return head('BETTER TOGETHER','一人問，一人帶路。','輪流查看角色卡，把畫面收起來對話。完成後交換角色，再換一個任務。')+tabs('pair',pair,pairCards)+`<div class="tabs"><button data-role="A" aria-pressed="${role==='A'}">A · 旅客</button><button data-role="B" aria-pressed="${role==='B'}">B · ${pair===0?'路人':'司機'}</button></div><div class="grid"><section class="panel tinted"><p class="eyebrow">ROLE ${role}</p><h2>${role==='A'?'你要問到哪些資訊？':'等對方問，再給資訊。'}</h2><p class="task">${role==='A'?c.a:c.b}</p>${role==='B'?`<div class="context">${c.secret}</div><details class="reveal"><summary>需要英文提示</summary><p class="en">${c.prompt}</p><button data-say="${esc(c.prompt)}">▶ 聽說法</button></details>`:'<p class="fine">聽到答案後，用一句英文確認，再決定下一步。</p>'}</section><section class="panel"><h2>讓對話多走一步。</h2><p>① 禮貌開口，說出目的地。<br>② 問一件自己不知道的資訊。<br>③ 聽不清楚，請對方再說一次。<br>④ 確認資訊並道謝。</p>${field('pairNote','記下一句真的用到的英文')}<p class="fine">同一台裝置請輪流查看，避免先看到對方的資訊。</p></section></div>${footer(3,5)}`;}
function review(){return head('SMALL STEPS, REAL PROGRESS','你現在，能多說什麼？','換一個目的地：從飯店到 Central Station。問路、確認遠近，再向司機詢問車程與車資。')+`<div class="grid"><section class="panel"><p class="eyebrow">BEFORE / 去博物館</p><h2>第一次的嘗試</h2><p class="saved-answer">${esc(state.before)||'還沒有課前紀錄，可以回第一部分補上。'}</p></section><section class="panel"><p class="eyebrow">AFTER / 去車站</p>${field('after','現在，再說一次','先不看提示，完成新目的地的對話，再記下你的版本。')}</section></div><div class="section-head"><h2>我能做到哪一步？</h2><span class="progress-pill">${state.complete.length} / 2 情境已練習</span></div><section class="panel">${skills.map((s,i)=>`<div class="rating"><strong>${s}</strong><div class="actions">${['看完整範例','看關鍵詞','能獨立完成'].map((r,j)=>`<button data-rating="${i},${j}" aria-pressed="${state.ratings[i]===j}">${r}</button>`).join('')}</div></div>`).join('')}<p class="fine">這是自評，不是自動測驗。請老師或同學給你一項具體回饋。</p></section>${footer(4,6)}`;}
const homeRoute='Go straight. Turn right at the first intersection. The market is on your left.';
const homeFare='It takes about twelve minutes. The fare will be about eighteen dollars.';
function homework(){return head('ONE MORE JOURNEY','課後 8–10 分鐘，再走一趟。','兩個聽力小挑戰，再完成一段自己的搭車對話。')+`<div class="grid"><section class="panel"><p class="eyebrow">01 / LISTEN & FIND</p><h2>聽方向，找市場。</h2><div class="actions"><button class="primary" data-act="home-route">▶ 聽路線</button><button data-act="home-route-slow">慢速</button></div><details class="reveal"><summary>查看英文逐字稿與中文</summary><p class="en">${homeRoute}</p><p>直走，第一個路口右轉。市場在左手邊。</p></details>${cityMap('home-map',homeMapChoice,homeMapChoice===2,true)}<p class="feedback ${homeMapChoice===2?'':'retry'}" role="status" ${homeMapChoice<0?'hidden':''}>${homeMapChoice===2?'答對了！第一個路口右轉，左手邊的 C 是市場。':'再試一次：注意 first、right，以及轉彎後的左手邊。'}</p><label class="checkline"><input data-home="0" type="checkbox" ${state.home[0]?'checked':''}>我已練習聽方向、選地點</label></section><section class="panel"><p class="eyebrow">02 / TIME & FARE</p><h2>司機說多久、多少錢？</h2><div class="actions"><button class="primary" data-act="home-fare">▶ 聽司機說</button><button data-act="home-fare-slow">慢速</button></div><details class="reveal"><summary>查看英文逐字稿與中文</summary><p class="en">${homeFare}</p><p>大約需要 12 分鐘，車資預估 18 美元。</p></details><div class="question-options">${['20 分鐘 · 18 美元','12 分鐘 · 80 美元','12 分鐘 · 18 美元'].map((o,i)=>`<button data-home-fare="${i}" aria-pressed="${homeFareChoice===i}">${o}</button>`).join('')}</div><p class="feedback ${homeFareChoice===2?'':'retry'}" role="status" ${homeFareChoice<0?'hidden':''}>${homeFareChoice===2?'答對了！twelve 是 12，eighteen 是 18。兩個數字都是預估資訊。':'再聽一次：分別留意 minutes 前與 dollars 前的數字。'}</p><label class="checkline"><input data-home="1" type="checkbox" ${state.home[1]?'checked':''}>我已練習聽懂時間與費用</label><div class="context"><strong>開口追問</strong><p>聽完後，用英文確認一次時間與金額。試著不用看文字。</p></div></section></div><section class="panel" style="margin-top:24px"><p class="eyebrow">03 / MAKE IT YOURS</p><h2>換成你真的想去的地方。</h2><p>選一個目的地：請司機載你去，問時間與車資，最後說下車位置。</p>${field('homeNote','我的搭車對話')}${hints('destination · time · fare · stop','Can you take me to Sunny Hotel, please? How long does it take? How much will it be? Could you stop here, please?')}<label class="checkline"><input data-home="2" type="checkbox" ${state.home[2]?'checked':''}>我收起提示後，自己大聲說了一次</label><p class="fine">已勾選 ${state.home.filter(Boolean).length} / 3 項。勾選只表示練習過，不代表測驗通過。</p></section>${footer(5,7)}`;}
function render(){const main=$('#main');$('#nav').innerHTML=labels.map((s,i)=>`<button data-page="${i}" ${page===i?'aria-current="page"':''}><span class="nav-number">0${i+1}</span>${s}</button>`).join('');main.innerHTML=[overview,phrasePage,practice,ownNeeds,pairPage,review,homework][page]();$('#storageNotice').hidden=storageOK;}
function focusMain(){ $('#main').focus({preventScroll:true}); }
function navigate(p){stopAudio();page=Math.max(0,Math.min(6,Number.isInteger(p)?p:0));render();focusMain();window.scrollTo({top:0,behavior:'instant'});}
function startScene(i){if(!lessons[i])return;scene=i;turn=0;spoken=false;choice=-1;feedback='';finished=false;navigate(2);}
function nextTurn(){if(finished||!canNext())return;stopAudio();if(turn===lessons[scene].turns.length-1){finished=true;if(!state.complete.includes(scene))state.complete.push(scene);save();}else{turn++;spoken=false;choice=-1;feedback='';}render();focusMain();window.scrollTo({top:0,behavior:'instant'});}
function exportText(){return ['TRAVEL LAB｜第五天：城市移動',...fields.flatMap((k,i)=>['','【'+['第一次嘗試','現在的回答','雙人任務','課後對話','趕時間','確認車資','指定下車位置'][i]+'】',state[k]||'尚未填寫']),'','【已完成情境】',state.complete.map(i=>lessons[i].name).join('、')||'尚未完成','','【自評】',...skills.map((s,i)=>s+'：'+(['看完整範例','看關鍵詞','能獨立完成'][state.ratings[i]]||'尚未自評')),'','課後練習：'+state.home.filter(Boolean).length+'/3',...['方向聽力','時間與車資','自己的對話'].map((s,i)=>s+'：'+(state.home[i]?'已練習':'尚未勾選'))].join('\r\n');}
function exportWork(){const url=URL.createObjectURL(new Blob(['\ufeff'+exportText()],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='第五天_我的城市移動英文.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已匯出第五天練習。');}
document.addEventListener('input',e=>{const k=e.target.dataset.field;if(fields.includes(k)){state[k]=e.target.value;save();}});
document.addEventListener('change',e=>{if(e.target.id==='spoken'){spoken=e.target.checked;render();$('#spoken').focus({preventScroll:true});}if(e.target.dataset.home!==undefined){state.home[Number(e.target.dataset.home)]=e.target.checked;save();const i=e.target.dataset.home;render();$(`[data-home="${i}"]`).focus({preventScroll:true});}});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;if(phraseWorkshop.handle(d))return;
 if(d.page!==undefined)return navigate(Number(d.page));if(d.scene!==undefined)return startScene(Number(d.scene));
 if(d.mission!==undefined){mission=Number(d.mission);stopAudio();render();focusMain();return;}
 if(d.pair!==undefined){pair=Number(d.pair);role='A';stopAudio();render();focusMain();return;}if(d.role){role=d.role;stopAudio();render();focusMain();return;}
 if(d.say)return speak(d.say);if(d.phrase!==undefined)return speak(phrases[Number(d.phrase)][1],d.slow==='true');
 if(d.choice!==undefined)return choose(Number(d.choice));
 if(d.homeMap!==undefined||d.homeFare!==undefined){const attr=d.homeMap!==undefined?'home-map':'home-fare',value=d.homeMap??d.homeFare;if(d.homeMap!==undefined)homeMapChoice=Number(value);else homeFareChoice=Number(value);render();$(`[data-${attr}="${value}"]`).focus({preventScroll:true});return;}
 if(d.rating){const [i,j]=d.rating.split(',').map(Number);state.ratings[i]=j;save();b.parentElement.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));return;}
 if(d.act==='home-route'||d.act==='home-route-slow')return speak(homeRoute,d.act.endsWith('slow'));
 if(d.act==='home-fare'||d.act==='home-fare-slow')return speak(homeFare,d.act.endsWith('slow'));
 if(d.act==='listen'||d.act==='slow')return speak(lessons[scene].turns[turn].line,d.act==='slow');
 if(d.act==='next')return nextTurn();if(d.act==='back'&&turn>0){stopAudio();turn--;spoken=false;choice=-1;feedback='';render();focusMain();return;}
 if(b.id==='export'||d.act==='export')return exportWork();if(b.id==='large'){const on=document.body.classList.toggle('large');b.setAttribute('aria-pressed',on);b.textContent=on?'標準文字':'放大文字';}
});
window.addEventListener('pagehide',stopAudio);render();
