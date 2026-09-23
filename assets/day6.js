'use strict';
const $=s=>document.querySelector(s), KEY='travel-lab-unit6-ordering-v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels=['先試著點一餐','點餐與詢價隨身句','走進店裡，互動點餐','說出自己的需要','雙人點餐任務','看見我的進步','課後再點一次'];
const firstTryTask='你在咖啡廳，還沒決定吃什麼。你會怎麼用英文請店員推薦？';
const phrases=[
 ['禮貌點餐','I’d like a chicken sandwich, please.','我想要一份雞肉三明治，謝謝。'],
 ['決定餐點','I’ll have the tomato pasta, please.','我要番茄義大利麵，謝謝。'],
 ['詢問推薦','What do you recommend?','你推薦什麼？'],
 ['指著餐點問價','How much is this?','這個多少錢？'],
 ['接著問它的價格','How much is it?','它多少錢？'],
 ['找較便宜的選項','Is there a cheaper one?','有比較便宜的嗎？'],
 ['更通用的替代問法','Do you have a cheaper option?','有比較便宜的選項嗎？'],
 ['選擇內用','For here, please.','內用，謝謝。'],
 ['選擇外帶','To go, please.','外帶，謝謝。'],
 ['確認聽到的價格','Is it eight dollars fifty?','是 8 美元 50 分嗎？'],
 ['請對方重說','Could you say that again, please?','可以請你再說一次嗎？'],
 ['完成點餐','That’s all, thank you.','就這些，謝謝。']
];
const clerkQuestions=[
 {en:'Are you ready to order?',zh:'準備好點餐了嗎？',hint:'Yes / I’d like… · Not yet / a minute',answers:[['Yes. I’d like the chicken sandwich, please.','好了，我想要雞肉三明治。'],['Not yet. Could we have another minute, please?','還沒，可以再給我們一點時間嗎？']]},
 {en:'May I take your order?',zh:'可以幫您點餐了嗎？',hint:'I’ll have… · a few more minutes',answers:[['Yes. I’ll have the tomato pasta, please.','可以，我要番茄義大利麵。'],['Could we have a few more minutes, please?','可以再給我們幾分鐘嗎？']]},
 {en:'Would you like something for dessert?',zh:'想吃點甜點嗎？',hint:'Yes / … please · No / thank you',answers:[['Yes. I’ll have the chocolate cake, please.','好，我要巧克力蛋糕。'],['No, thank you. I’m full.','不用了，謝謝。我吃飽了。']]},
 {en:'How would you like your steak?',zh:'牛排想要幾分熟？',hint:'medium-rare / medium / well-done',answers:[['Medium-rare, please.','三分熟，謝謝。'],['Medium, please.','五分熟，謝謝。'],['Well-done, please.','全熟，謝謝。']]},
 {en:'How would you like your eggs?',zh:'蛋想要怎麼料理？',hint:'scrambled / sunny-side up / over easy',answers:[['Scrambled, please.','炒蛋，謝謝。'],['Sunny-side up, please.','單面煎蛋，謝謝。'],['Over easy, please.','兩面煎、蛋黃保持流心，謝謝。']]},
 {en:'How would you like your coffee?',zh:'咖啡想要怎麼調配？',hint:'black / with milk / no sugar',answers:[['Black, please.','黑咖啡，不加奶，謝謝。'],['With milk, no sugar, please.','加牛奶、不加糖，謝謝。']],note:'依情境可能是在問加奶或加糖等偏好；black 指不加奶，若也不要糖，可再說 no sugar。'},
 {en:'Is that for here or to go?',zh:'這份要內用還是外帶？',hint:'For here / To go',answers:[['For here, please.','內用，謝謝。'],['To go, please.','外帶，謝謝。']]}
];
const restaurantExchanges=[
 {title:'確認今日特餐｜客人先問',lines:[['客人','Is that today’s special?','那是今日特餐嗎？'],['店員','Yes. Today’s special is the tomato pasta.','是的，今日特餐是番茄義大利麵。']],note:'指著菜單、看板或剛提到的餐點時，可以用 that。'},
 {title:'還沒決定｜店員接話',lines:[['客人','Could we have a few more minutes, please?','可以再給我們幾分鐘嗎？'],['店員','Take your time. I’ll be right back.','慢慢來，我等一下就回來。']],note:'這裡的 Take your time 和 I’ll be right back 都是店員說的，先聽懂即可。'},
 {title:'送錯餐點｜客人反映',lines:[['客人','There must be a mistake. I didn’t ask for the steak.','應該是弄錯了，我沒有點牛排。'],['店員','I’m sorry. I’ll check your order.','抱歉，我會確認您的訂單。']],note:'可在前面加 Excuse me 更客氣；在點餐情境也常說 I didn’t order the steak.'},
 {title:'店家招待｜店員說明',lines:[['店員','This one is on the house.','這份由店家招待。'],['客人','Thank you. That’s very kind of you.','謝謝，你們真好。']],note:'on the house 表示這一份免費招待，不代表整餐免費；這是另一個獨立情境，並非送錯餐就一定會招待。'}
];
function restaurantExtras(){return `<section class="panel before-panel"><h2>延伸閱讀：客人提問與店員接話</h2><p>留意角色；每個小情境都可以單獨練習。</p>${restaurantExchanges.map(x=>`<details class="reveal"><summary>${x.title}</summary>${x.lines.map(([role,en,zh])=>`<p><strong>${role}</strong>：${zh}</p><p class="quote" lang="en">${en}</p><button data-workshop-say="${esc(en)}">▶ 聽發音</button>`).join('')}<p class="fine">${x.note}</p></details>`).join('')}</section>`;}
function restaurantPractice(){
 const audio=en=>`<div class="actions"><button data-say="${esc(en)}">▶ 聽發音</button><button data-say="${esc(en)}" data-slow="true">慢速</button></div>`;
 return `<section class="panel before-panel"><h2>店員問、我來答</h2><p>先聽店員問什麼，用自己的英文回答，再展開參考說法。店員的問句以聽懂為主，不必背誦；回答可以換成你的選擇。</p></section><div class="phrases">${clerkQuestions.map((q,i)=>`<section class="phrase"><span class="phrase-index">${String(i+1).padStart(2,'0')} / 店員問</span><p class="quote en" lang="en">${q.en}</p>${audio(q.en)}<details class="reveal"><summary>看中文意思</summary><p>${q.zh}</p></details><details class="reveal"><summary>需要一點關鍵詞</summary><p class="hint en">${q.hint}</p><details class="reveal"><summary>我試過了，看看參考回答</summary>${q.answers.map(([en,zh])=>`<p class="quote en" lang="en">${en}</p><p>${zh}</p>${audio(en)}`).join('')}${q.note?`<p class="fine">${q.note}</p>`:''}</details></details></section>`).join('')}</div><section class="panel before-panel"><h2>客人提問與店員接話</h2><p>看中文情境，先試著說，再展開小對話。留意每句話是誰說的。</p>${restaurantExchanges.map(x=>`<details class="reveal"><summary>${x.title}</summary>${x.lines.map(([role,en,zh])=>`<p><strong>${role}</strong>：${zh}</p><p class="quote en" lang="en">${en}</p>${audio(en)}`).join('')}<p class="fine">${x.note}</p></details>`).join('')}</section>`;
}
const menus=[
 [{id:'chicken',en:'Chicken sandwich',zh:'雞肉三明治',price:8.5,art:'sandwich'},{id:'cheese',en:'Cheese sandwich',zh:'起司三明治',price:6,art:'sandwich'},{id:'salad',en:'Garden salad',zh:'田園沙拉',price:7,art:'salad'}],
 [{id:'seafood',en:'Seafood pasta',zh:'海鮮義大利麵',price:18,art:'pasta'},{id:'tomato',en:'Tomato pasta',zh:'番茄義大利麵',price:12,art:'pasta'},{id:'mushroom',en:'Mushroom pasta',zh:'蘑菇義大利麵',price:15,art:'pasta'}]
];
// Actions become available after listening (or reading) and spoken self-confirmation.
const lessons=[{name:'午餐，從一句推薦開始',en:'CORNER CAFÉ',desc:'聽推薦、找餐點、問價，完成一份外帶午餐。',budget:10,turns:[
 {line:'Hello! What would you like?',zh:'你好！你想點什麼？',task:'還沒決定吃什麼。先請店員推薦，再按服務鈴送出你的提問。',hint:'What / recommend',answer:'What do you recommend?',kind:'bell',options:['請店員推薦'],correct:0,result:'店員收到你的提問了，接著聽聽推薦。'},
 {line:'I recommend the chicken sandwich. It’s our most popular sandwich.',zh:'我推薦雞肉三明治。它是我們最受歡迎的三明治。',task:'聽出店員推薦的餐點。先說「我想要這個」，再點選菜單上的餐點。',hint:'I’d like / this',answer:'I’d like this, please.',kind:'menu',correct:0,result:'雞肉三明治已放到候選餐點區；還沒結帳。'},
 {line:'Would you like to know the price?',zh:'你想知道價格嗎？',task:'指著剛選的餐點，開口問「這個多少錢？」再點價格吊牌。',hint:'How much / this',answer:'How much is this?',kind:'tag',options:['詢問這份餐點的價格'],correct:0,result:'已向店員詢價。接著聽金額。'},
 {line:'It’s eight dollars fifty.',zh:'是 8 美元 50 分。',task:'先用英文確認聽到的價格，再把正確金額放進訂單。',hint:'Eight / fifty / right',answer:'Eight dollars fifty, right?',kind:'price',options:['$8.15','$8.50','$18.50'],correct:1,result:'訂單已更新：Chicken sandwich · $8.50。',why:'eight dollars fifty 是 $8.50；fifteen 才是 15。'},
 {line:'Yes. For here or to go?',zh:'對。內用還是外帶？',task:'你想帶去公園吃。先說外帶，再把餐點放進外帶袋。',hint:'To go / please',answer:'To go, please.',kind:'service',options:['放上內用餐盤','放進外帶袋'],correct:1,result:'外帶袋已裝好，準備確認最後訂單。'},
 {line:'One chicken sandwich to go. That’s eight dollars fifty. Anything else?',zh:'一份雞肉三明治外帶，共 8 美元 50 分。還要其他的嗎？',task:'確認訂單，不加點。先說「就這些，謝謝」，再點取餐區完成練習。',hint:'That’s all / thank you',answer:'That’s all, thank you.',kind:'pickup',options:['確認訂單，取餐'],correct:0,result:'外帶午餐完成！你在 $10 的預算內點好了餐。'}
]},{name:'預算有限，也能好好點餐',en:'LITTLE TABLE',desc:'問價格、找較便宜的選項，點一份預算內的晚餐。',budget:14,turns:[
 {line:'Welcome! What can I get for you?',zh:'歡迎！你想點什麼？',task:'你想吃海鮮義大利麵，先表達想點這道餐，再點選菜單。',hint:'I’d like / seafood pasta',answer:'I’d like the seafood pasta, please.',kind:'menu',correct:0,result:'海鮮義大利麵已暫選。接著先確認價格。'},
 {line:'The seafood pasta? Certainly.',zh:'海鮮義大利麵嗎？沒問題。',task:'剛剛已經提到餐點。用 it 詢問它的價格，再點價格吊牌。',hint:'How much / it',answer:'How much is it?',kind:'tag',options:['詢問剛選餐點的價格'],correct:0,result:'詢價已送出，接著聽店員報價。'},
 {line:'It’s eighteen dollars.',zh:'是 18 美元。',task:'先確認價格，再選出金額。你的預算是 $14，想想夠不夠。',hint:'Eighteen dollars / right',answer:'Eighteen dollars, right?',kind:'price',options:['$80.00','$8.00','$18.00'],correct:2,result:'海鮮義大利麵 $18，超過 $14 預算。你可以問其他選項。',why:'eighteen 是 18；eighty 是 80。'},
 {line:'Would you like to try a different pasta?',zh:'你想試試另一種義大利麵嗎？',task:'你還想吃義大利麵，但希望便宜一點。先問有沒有較便宜的，再按服務鈴。',hint:'Is there / cheaper one',answer:'Is there a cheaper one?',kind:'bell',options:['詢問較便宜的義大利麵'],correct:0,result:'你問了較便宜的同類餐點。聽店員提供選項。'},
 {line:'The tomato pasta is twelve dollars. The mushroom pasta is fifteen dollars.',zh:'番茄義大利麵 12 美元，蘑菇義大利麵 15 美元。',task:'選一道符合 $14 預算的餐點。先用 I’ll have… 點餐，再點菜單換餐。',hint:'I’ll have / tomato pasta',answer:'I’ll have the tomato pasta, please.',kind:'menu',correct:1,result:'訂單已換成番茄義大利麵 · $12，符合預算！',why:'tomato pasta 是 $12；mushroom pasta 是 $15，超過預算。'},
 {line:'One tomato pasta. Would you like to eat here or take it away?',zh:'一份番茄義大利麵。你想內用還是外帶？',task:'你想坐下來吃。先回答內用，再把餐點放上餐盤。',hint:'For here / please',answer:'For here, please.',kind:'service',options:['放進外帶袋','放上內用餐盤'],correct:1,result:'已選擇內用，餐點放上餐盤。'},
 {line:'One tomato pasta for here. That’s twelve dollars. Anything else?',zh:'一份番茄義大利麵內用，共 12 美元。還需要其他的嗎？',task:'先說不加點並道謝，再確認訂單。',hint:'That’s all / thank you',answer:'That’s all, thank you.',kind:'pickup',options:['確認訂單，開始用餐'],correct:0,result:'晚餐完成！總計 $12，還剩 $2 預算。'}
]}];
const missions=[
 {name:'不知道選哪個',field:'recommendNote',task:'你在咖啡廳，想先聽推薦，再詢問推薦餐點的價格。最後點一份外帶。',hint:'recommend / How much / I’d like / to go',answer:'What do you recommend? How much is it? I’d like the chicken sandwich to go, please.'},
 {name:'想找便宜一點的',field:'budgetNote',task:'你想吃義大利麵，預算 $14。海鮮麵要 $18，番茄麵要 $12。先問有沒有較便宜的，再點你負擔得起的餐。',hint:'cheaper one / I’ll have / tomato pasta',answer:'Is there a cheaper one? I’ll have the tomato pasta, please.'},
 {name:'指著菜單點餐',field:'orderNote',task:'你看到一份起司三明治。指著它詢價，再用 I’d like… 點餐，告訴店員要內用。',hint:'How much / this / I’d like / for here',answer:'How much is this? I’d like a cheese sandwich, please. For here, please.'}
];
const pairCards=[
 {name:'咖啡廳推薦',a:'你有 $10，想吃一份三明治帶走。請店員推薦、問價格，再決定餐點。',b:'推薦雞肉三明治 $8.50；起司三明治 $6。等顧客問價再回答，最後問內用或外帶。',hint:'I recommend the chicken sandwich. / It’s eight dollars fifty. / For here or to go?'},
 {name:'預算內的晚餐',a:'你想吃義大利麵，有 $14。先問海鮮麵的價格，若太貴，詢問較便宜的選項；你要內用。',b:'海鮮麵 $18、蘑菇麵 $15、番茄麵 $12。被問到較便宜的選項時，提供番茄麵，最後核對訂單。',hint:'It’s eighteen dollars. / The tomato pasta is twelve dollars. / One tomato pasta for here?'},
 {name:'換一份早餐',a:'你想點一份早餐，有 $9。請店員推薦、問價；若超出預算，再問其他選擇。你要外帶。',b:'推薦煎餅早餐 $11；較便宜的是雞蛋吐司 $7。等顧客詢問再提供資訊，不要一口氣報完所有價格。',hint:'I recommend the pancakes. / They’re eleven dollars. / The egg toast is seven dollars.'}
];
const fields=['before','after','recommendNote','budgetNote','orderNote','pairNote','homeNote'];
const skills=['我能請店員推薦，並用 I’d like… 或 I’ll have… 點餐','我能問價格、聽出金額，找到預算內的選項','我能說明內用或外帶，確認訂單並道謝'];
let state={complete:[],ratings:[-1,-1,-1],home:[false,false,false]},storageOK=true;
fields.forEach(k=>state[k]='');
try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x&&typeof x==='object'){fields.forEach(k=>{if(typeof x[k]==='string')state[k]=x[k];});if(Array.isArray(x.complete))state.complete=[...new Set(x.complete.filter(i=>i===0||i===1))];if(Array.isArray(x.ratings)&&x.ratings.length===3)state.ratings=x.ratings.map(v=>[0,1,2].includes(v)?v:-1);if(Array.isArray(x.home)&&x.home.length===3)state.home=x.home.map(v=>v===true);}}catch{storageOK=false;}
let page=0,scene=0,turn=0,heard=false,spoken=false,choice=-1,finished=false,feedback='',mission=0,pair=0,role='A',homeChoice=-1,history=[],toastTimer;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storageOK=false;$('#storageNotice').hidden=false;}}
function toast(s){$('#toast').textContent=s;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,5000);}
function stopAudio(){if('speechSynthesis' in window)window.speechSynthesis.cancel();}
function speak(text,slow=false){if(!('speechSynthesis' in window)){toast('朗讀目前不可用。請展開逐字稿，改用閱讀練習。');return;}stopAudio();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=slow?.7:.9;const v=window.speechSynthesis.getVoices().find(v=>/^en[-_]/.test(v.lang));if(v)u.voice=v;u.onerror=e=>{if(!['interrupted','canceled'].includes(e.error))toast('語音無法播放，請展開逐字稿。');};window.speechSynthesis.speak(u);}
function field(k,label){return `<label class="field-label" for="${k}">${label}</label><textarea id="${k}" data-field="${k}" placeholder="先開口，再留下你的版本。">${esc(state[k])}</textarea>`;}
function head(en,title,sub){return `<div class="page-head"><p class="eyebrow">DAY 06 / ${en}</p><h1>${title}</h1><p class="muted">${sub}</p></div>`;}
function hints(words,answer){return `<details class="reveal"><summary>需要一點關鍵詞</summary><p class="hint en">${words}</p><details class="reveal"><summary>我試過了，看看參考說法</summary><p class="quote en" lang="en">${answer}</p><button data-say="${esc(answer)}">▶ 聽參考說法</button></details></details>`;}
function tabs(attr,active,items){return `<div class="tabs">${items.map((v,i)=>`<button data-${attr}="${i}" aria-pressed="${active===i}">${i+1}. ${v.name}</button>`).join('')}</div>`;}
function footer(p,n){return `<div class="lesson-footer">${p>=0?`<button data-page="${p}">← ${labels[p]}</button>`:'<span></span>'}${n<7?`<button class="primary" data-page="${n}">${labels[n]} →</button>`:''}</div>`;}
function food(art){return `<svg viewBox="0 0 160 105" aria-hidden="true"><ellipse cx="80" cy="86" rx="58" ry="11" fill="#c0b4a8" opacity=".3"/><ellipse cx="80" cy="70" rx="65" ry="26" fill="#fffaf3"/>${art==='sandwich'?'<path d="M29 67 78 19 133 67Z" fill="#da9a48" stroke="#b57732" stroke-width="3"/><path d="m32 67 99 0-5 10H37Z" fill="#74905d"/><path d="m35 76 90 0-8 10H44Z" fill="#e6b164"/><path d="m45 59 34-32 36 32Z" fill="#f6dbac"/><path d="m60 44 12 3m17-4 9 5" stroke="#d3b284" stroke-width="3"/>':art==='salad'?'<path d="M31 58h98q-8 31-49 31T31 58" fill="#d4ddce"/><g fill="#78925d"><circle cx="47" cy="54" r="17"/><circle cx="74" cy="44" r="21"/><circle cx="108" cy="53" r="19"/></g><g fill="#c85a3c"><circle cx="58" cy="54" r="8"/><circle cx="97" cy="43" r="8"/></g>':'<ellipse cx="80" cy="65" rx="45" ry="23" fill="#d99657"/><g stroke="#efc577" stroke-width="5" fill="none" stroke-linecap="round"><path d="M50 56q55-20 51 2T53 68t52 4M54 46q54-6 64 18M65 42q-18 34 43 37"/></g><g fill="#759054"><path d="m74 43 8-13 11 14z"/><path d="m96 63 15-4-3 12z"/></g>'}</svg>`;}
function menuView(interactive=false){const t=lessons[scene].turns[turn],order=currentOrder();return `<div class="cafe-menu"><div class="menu-mast"><span>${lessons[scene].en}</span><small>MADE FOR YOUR DAY</small></div><div class="menu-items">${menus[scene].map((m,i)=>{const selected=order.item===m.id;return `<${interactive?'button':'div'} class="food-card ${selected?'selected':''}" ${interactive?`data-choice="${i}" aria-pressed="${choice===i}" ${!heard||!spoken?'disabled':''}`:''}>${food(m.art)}<strong lang="en">${m.en}</strong><span>${m.zh}</span>${interactive?'':`<b>$${m.price.toFixed(2)}</b>`}${selected?'<small>已選餐點</small>':''}</${interactive?'button':'div'}>`;}).join('')}</div>${interactive?'<p class="fine">先聽店員介紹。價格會在詢問後出現在訂單。</p>':''}</div>`;}
function currentOrder(){let item=null,price=null,service=null;history.forEach((c,i)=>{const t=lessons[scene].turns[i];if(c!==t.correct)return;if(t.kind==='menu'){item=menus[scene][c].id;price=scene===1&&i===4?12:null;}if(t.kind==='price')price=scene===0?8.5:18;if(t.kind==='service')service=scene===0?'外帶':'內用';});return {item,price,service};}
function ticket(){const o=currentOrder(),m=menus[scene].find(m=>m.id===o.item);return `<div class="order-ticket"><p class="eyebrow">YOUR ORDER / 你的訂單</p><strong>${m?m.en:'等你選一道餐點'}</strong><div><span>${o.service||'內用／外帶待確認'}</span><b>${o.price===null?'價格待詢問':'$'+o.price.toFixed(2)}</b></div><small>${o.price!==null?(o.price>lessons[scene].budget?'超過預算，可以改選餐點。':'符合你的預算。'):'先問清楚，再決定。'}</small></div>`;}
function overview(){return `<section class="hero"><div class="hero-copy"><p class="eyebrow">DAY 06 / ORDER WITH CONFIDENCE</p><h1>想吃的這一口，<br><span>自己開口點。</span></h1><p class="lead">從「你推薦什麼？」開始。<br>問清楚價格，選一份喜歡的餐，<br>用英文完成自己的點餐。</p><div class="actions"><button class="primary" data-page="1">帶上幾句英文 ↗</button><button data-scene="0" class="plain">走進咖啡廳 →</button></div><p class="fine">成人旅遊英文 · 7 個部分 · 先開口，再操作</p></div><div class="hero-food"><div class="hero-menu-label">THE LUNCH YOU CHOOSE</div>${food('sandwich')}<div class="hero-receipt"><small>CORNER CAFÉ</small><strong>One good lunch.<br>One small conversation.</strong><span>Chicken sandwich <b>$8.50</b></span></div></div></section><section class="panel before-panel"><h2>先留下一個自己的版本。</h2><p>${firstTryTask}</p>${field('before','第一次的嘗試')}<p class="fine">單字或短句也可以。練習紀錄保存在這個瀏覽器。</p></section><div class="section-head"><h2>兩家店，兩次開口的機會。</h2><span class="progress-pill">${state.complete.length} / 2 已練習</span></div><div class="journey-grid two-journeys">${lessons.map((s,i)=>`<section class="journey-card"><p class="eyebrow">0${i+1} / ${s.en} ${state.complete.includes(i)?'✓':''}</p><h3>${s.name}</h3><p>${s.desc}</p><button data-scene="${i}" class="plain">進店試試 →</button></section>`).join('')}</div>${footer(-1,1)}`;}
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
  "label": "店員問，我來答",
  "replies": [
    {
      "id": "are-you-ready-to-order",
      "name": "準備點餐",
      "role": "店員",
      "en": "Are you ready to order?",
      "zh": "準備好點餐了嗎？",
      "task": "你還沒決定，想請店員再給一點時間。",
      "hint": "not yet / a minute",
      "answer": "Not yet. Could we have another minute, please?",
      "change": "如果已經決定好雞肉三明治呢？",
      "changeHint": "yes / chicken sandwich",
      "changeAnswer": "Yes. I’d like the chicken sandwich, please."
    },
    {
      "id": "may-i-take-your-order",
      "name": "選擇主餐",
      "role": "店員",
      "en": "May I take your order?",
      "zh": "可以幫您點餐了嗎？",
      "task": "你想點番茄義大利麵。",
      "hint": "I’ll have / tomato pasta",
      "answer": "I’ll have the tomato pasta, please.",
      "change": "換成想點雞肉三明治。",
      "changeHint": "chicken sandwich",
      "changeAnswer": "I’ll have the chicken sandwich, please."
    },
    {
      "id": "would-you-like-something-for-dessert",
      "name": "是否要甜點",
      "role": "店員",
      "en": "Would you like something for dessert?",
      "zh": "想吃點甜點嗎？",
      "task": "你想吃巧克力蛋糕。",
      "hint": "chocolate cake / please",
      "answer": "Chocolate cake, please.",
      "change": "如果你已經吃飽、不想要甜點呢？",
      "changeHint": "no / thank you",
      "changeAnswer": "No, thank you. I’m full."
    },
    {
      "id": "how-would-you-like-your-steak",
      "name": "選擇牛排熟度",
      "role": "店員",
      "en": "How would you like your steak?",
      "zh": "牛排想要幾分熟？",
      "task": "你想點五分熟的牛排。",
      "hint": "medium / please",
      "answer": "Medium, please.",
      "change": "改成想要全熟；也可以試說三分熟（medium-rare）。",
      "changeHint": "well-done / medium-rare",
      "changeAnswer": "Well-done, please."
    },
    {
      "id": "how-would-you-like-your-eggs",
      "name": "選擇蛋的做法",
      "role": "店員",
      "en": "How would you like your eggs?",
      "zh": "蛋想要怎麼料理？",
      "task": "你想吃炒蛋。",
      "hint": "scrambled / please",
      "answer": "Scrambled, please.",
      "change": "改成單面煎蛋；也可以試說兩面煎、流心蛋黃（over easy）。",
      "changeHint": "sunny-side up / over easy",
      "changeAnswer": "Sunny-side up, please."
    },
    {
      "id": "how-would-you-like-your-coffee",
      "name": "咖啡偏好",
      "role": "店員",
      "en": "How would you like your coffee?",
      "zh": "咖啡想要怎麼調配？",
      "task": "你想喝不加奶的黑咖啡。",
      "hint": "black / please",
      "answer": "Black, please.",
      "change": "換成加牛奶，但不要糖。",
      "changeHint": "with milk / no sugar",
      "changeAnswer": "With milk, no sugar, please."
    },
    {
      "id": "is-that-for-here-or-to-go",
      "name": "內用或外帶",
      "role": "店員",
      "en": "Is that for here or to go?",
      "zh": "這份要內用還是外帶？",
      "task": "你想坐在店裡吃。",
      "hint": "for here",
      "answer": "For here, please.",
      "change": "如果要帶回飯店吃呢？",
      "changeHint": "to go",
      "changeAnswer": "To go, please."
    }
  ]
};
const phraseWorkshop=createPhraseWorkshop(phraseWorkshopConfig);
function phrasePage(){return phraseWorkshop.render();}
// END PHRASE WORKSHOP
function phraseLibrary(){return head('POCKET PHRASES','點一餐，用得到的幾句話。','先練前 6 句，再加入內用、外帶和結尾。點開中文或參考說法之前，先猜猜看。')+`<div class="phrases">${phrases.map((p,i)=>`<section class="phrase"><span class="phrase-index">${String(i+1).padStart(2,'0')} / ${p[0]}</span><p class="quote en" lang="en">${p[1]}</p><details class="reveal"><summary>看中文意思</summary><p>${p[2]}</p></details><div class="actions"><button data-say="${esc(p[1])}">▶ 聽發音</button><button data-say="${esc(p[1])}" data-slow="true">慢速</button></div></section>`).join('')}</div><section class="panel before-panel"><h2>把句子換成你的餐點。</h2><p lang="en">a chicken sandwich · a cheese sandwich · the tomato pasta</p><p><strong>I’d like…</strong> 是禮貌地說想要什麼；<strong>I’ll have…</strong> 常用在決定好餐點時，兩種都適合點餐。</p><p>指著菜單可用 <strong>this</strong>；前面已提過的餐點可用 <strong>it</strong>。<strong>a cheaper one</strong> 可接同類單數餐點，例如另一份 sandwich。跨種類選擇也可說 <strong>Do you have a cheaper option?</strong></p><p class="fine">本單元的金額都是教學設定，以美元表示，暫不加入稅金、小費或加點費用。</p></section>${restaurantExtras()}${footer(0,2)}`;}
function practice(){const l=lessons[scene],t=l.turns[turn];if(finished)return head('ORDER COMPLETE','你完成了一次點餐。',l.name)+`<section class="panel"><div class="success-mark">✓</div>${ticket()}<p class="task">${t.result}</p><p>收起提示，再把「推薦或需求 → 問價 → 決定餐點 → 內用外帶」說一次。</p><div class="actions"><button data-scene="${scene}">再點一次</button><button class="primary" data-scene="${1-scene}">換一家店 →</button><button data-page="3">練自己的版本 →</button></div></section>${footer(1,3)}`;
const ready=heard&&spoken,ok=choice===t.correct;
return head('LISTEN · SAY · DO','聽一句，開口，再點一步。','先聽或閱讀店員的話，再用自己的英文回應。勾選表示你已練習，不是自動口說評分。')+tabs('scene',scene,lessons)+`<div class="budget-strip"><strong>${l.en}</strong><span>你的預算 $${l.budget} · ${scene===0?'帶去公園吃午餐':'坐下來吃晚餐'}</span><button data-scene="${scene}" class="plain">重新開始 ↻</button></div><div class="grid scene-grid"><section class="panel clerk-panel"><div class="speaker"><span class="avatar" aria-hidden="true">♧</span><div><strong>店員正在和你說話</strong><small>第 ${turn+1} / ${l.turns.length} 步</small></div></div><div class="step-track" aria-hidden="true">${l.turns.map((_,i)=>`<span class="${i<=turn?'done':''}"></span>`).join('')}</div><div class="listen"><button class="primary" data-act="listen">▶ 聽店員說</button><button data-act="slow">慢速重播</button></div><details class="reveal"><summary>查看英文逐字稿與中文</summary><p lang="en" class="quote">${t.line}</p><p>${t.zh}</p></details><label class="checkline"><input type="checkbox" id="heard" ${heard?'checked':''}>我已聽完，或已讀完逐字稿</label><div class="speaking-heading"><div class="task-label">YOUR TURN / 換你說</div><span class="speaking-cue"><span aria-hidden="true">↓</span> 看這裡，換你說</span></div><div class="speaking-task"><p class="task">${t.task}</p>${hints(t.hint,t.answer)}</div><label class="checkline"><input type="checkbox" id="spoken" ${spoken?'checked':''} ${!heard?'disabled':''}>我已用自己的聲音回應</label><div class="lesson-footer"><button data-act="back" ${turn===0?'disabled':''}>← 上一步</button><button class="primary" data-act="next" ${!ready||!ok?'disabled':''}>${turn===l.turns.length-1?'完成點餐 ✓':'下一步 →'}</button></div></section><section class="counter-scene"><p class="eyebrow">${t.kind==='menu'?'CHOOSE FROM THE MENU':'AT THE COUNTER'}</p><h2>${{menu:'在菜單上，找到你的餐。',bell:'把你的問題，交給店員。',tag:'先問問，要多少錢？',price:'把聽到的價格放進訂單。',service:'餐盤，還是外帶袋？',pickup:'最後，看一眼你的訂單。'}[t.kind]}</h2>${t.kind==='menu'?menuView(true):`<div class="scene-objects ${t.kind}">${t.options.map((o,i)=>`<button class="scene-object ${choice===i?'selected':''}" data-choice="${i}" aria-pressed="${choice===i}" ${!ready?'disabled':''}>${t.kind==='bell'?'<span class="bell-art" aria-hidden="true">◠<i></i></span>':t.kind==='tag'?'<span class="tag-art" aria-hidden="true">$ ?</span>':t.kind==='service'?`<span class="${o.includes('袋')?'bag-art':'tray-art'}" aria-hidden="true"></span>`:t.kind==='pickup'?food(scene===0?'sandwich':'pasta'):''}<strong>${o}</strong></button>`).join('')}</div>`}<p class="fine">${!ready?'完成左側的聽讀與開口練習，就能操作這裡。':'點選物件後，確認結果，再繼續下一步。'}</p><p id="sceneFeedback" class="feedback ${ok?'':'retry'}" role="status" ${!feedback?'hidden':''}>${feedback}</p>${ticket()}</section></div>${footer(1,3)}`;}
function ownNeeds(){const m=missions[mission];return head('YOUR OWN WORDS','這一次，說你想吃的。','換一種情境，先說，再寫。每份回答分開保存。')+tabs('mission',mission,missions)+`<div class="grid"><section class="panel tinted"><h2>${m.name}</h2><p class="task">${m.task}</p>${hints(m.hint,m.answer)}</section><section class="panel">${field(m.field,'我的點餐說法')}<p class="fine">同學幫忙確認：有問到價格嗎？餐點和內用外帶清楚嗎？</p></section></div>${footer(2,4)}`;}
function pairPage(){const c=pairCards[pair];return head('BETTER TOGETHER','你當顧客，我來接單。','輪流查看自己的角色卡，把畫面收起來對話。完成後交換角色，再換一家店。')+tabs('pair',pair,pairCards)+`<div class="tabs"><button data-role="A" aria-pressed="${role==='A'}">A · 顧客</button><button data-role="B" aria-pressed="${role==='B'}">B · 店員</button></div><div class="grid"><section class="panel tinted"><p class="eyebrow">ROLE ${role}</p><h2>${role==='A'?'問到資訊，做自己的決定。':'等對方問，再提供資訊。'}</h2><p class="task">${role==='A'?c.a:c.b}</p>${role==='B'?hints('recommend / dollars / for here / to go',c.hint):'<p>不確定價格時，請店員再說一次；超出預算時，問問別的選擇。</p>'}</section><section class="panel"><h2>一起完成這份訂單。</h2><p>① 說需求或詢問推薦。<br>② 問價、報價，必要時換餐。<br>③ 決定餐點與內用外帶。<br>④ 店員核對訂單，顧客道謝。</p>${field('pairNote','記下一句真正用到的英文')}<p class="fine">同一台裝置請輪流查看角色卡，保留資訊差。</p></section></div>${footer(3,5)}`;}
function review(){return head('SEE YOUR PROGRESS','同一份午餐，多一點自信。',firstTryTask)+`<div class="grid"><section class="panel"><p class="eyebrow">BEFORE</p><h2>第一次的嘗試</h2><p class="saved-answer">${esc(state.before)||'還沒有課前紀錄，可以回第一部分補上。'}</p></section><section class="panel"><p class="eyebrow">AFTER</p>${field('after','不看提示，再說一次')}</section></div><section class="panel before-panel"><h2>我能做到哪一步？</h2>${skills.map((s,i)=>`<div class="rating"><strong>${s}</strong><div class="actions">${['看完整範例','看關鍵詞','能獨立完成'].map((r,j)=>`<button data-rating="${i},${j}" aria-pressed="${state.ratings[i]===j}">${r}</button>`).join('')}</div></div>`).join('')}<p class="fine">情境已練習 ${state.complete.length} / 2。自評可修改，請同學或老師補充一項具體回饋。</p></section>${footer(4,6)}`;}
const homeLine='I recommend the egg toast. It’s seven dollars fifty. The pancakes are eleven dollars.';
function homework(){return head('ONE MORE ORDER','課後，換一份早餐。','用 8–10 分鐘，聽懂新菜單、自己選餐，再把對話說完整。')+`<div class="grid"><section class="panel"><h2>1. 聽推薦，選早餐。</h2><p>你有 $9。聽店員說明，選出預算內的推薦餐點和價格。</p><div class="actions"><button class="primary" data-act="home-listen">▶ 聽店員說</button><button data-act="home-slow">慢速</button></div><details class="reveal"><summary>查看英文逐字稿與中文</summary><p lang="en">${homeLine}</p><p>我推薦雞蛋吐司，7 美元 50 分。煎餅要 11 美元。</p></details><div class="question-options">${['煎餅 · $11.00','雞蛋吐司 · $7.15','雞蛋吐司 · $7.50'].map((s,i)=>`<button data-home-choice="${i}" aria-pressed="${homeChoice===i}">${s}</button>`).join('')}</div><p class="feedback ${homeChoice===2?'':'retry'}" role="status" ${homeChoice<0?'hidden':''}>${homeChoice===2?'答對了！egg toast 是 $7.50，符合 $9 預算。':'再聽一次：餐點名稱，以及 seven dollars 後面的數字。'}</p><label class="checkline"><input type="checkbox" data-home="0" ${state.home[0]?'checked':''}>我已練習聽懂推薦和價格</label></section><section class="panel"><h2>2. 點一份自己的早餐。</h2><p>選雞蛋吐司或煎餅。你有 $9，想外帶。先問價；若太貴，問較便宜的選項，再完成點餐。</p>${field('homeNote','我的早餐對話')}${hints('How much / cheaper option / I’ll have / to go','How much are the pancakes? Do you have a cheaper option? I’ll have the egg toast to go, please. That’s all, thank you.')}<p class="fine">延伸：pancakes 是複數，問價用 How much are…?，回答用 They’re…。本課核心先練單份餐點的 is / it。</p><label class="checkline"><input type="checkbox" data-home="1" ${state.home[1]?'checked':''}>我已寫下自己的點餐版本</label><label class="checkline"><input type="checkbox" data-home="2" ${state.home[2]?'checked':''}>我已收起提示，錄音或大聲說一次</label><p class="fine">可用手機錄音，對照餐點、金額和內用外帶。已練習 ${state.home.filter(Boolean).length} / 3 項。</p></section></div>${footer(5,7)}`;}
function render(){ $('#nav').innerHTML=labels.map((s,i)=>`<button data-page="${i}" ${i===page?'aria-current="page"':''}><span class="nav-number">0${i+1}</span>${s}</button>`).join('');$('#main').innerHTML=[overview,phrasePage,practice,ownNeeds,pairPage,review,homework][page]();$('#storageNotice').hidden=storageOK;}
function focusMain(){ $('#main').focus({preventScroll:true}); }
function navigate(p){stopAudio();page=Math.max(0,Math.min(6,Number.isInteger(p)?p:0));render();focusMain();window.scrollTo({top:0,behavior:'instant'});}
function resetTurn(){heard=false;spoken=false;choice=-1;feedback='';}
function startScene(i){if(!lessons[i])return;scene=i;turn=0;history=[];finished=false;resetTurn();navigate(2);}
function canNext(){return !finished&&heard&&spoken&&choice===lessons[scene].turns[turn].correct;}
function choose(i){const t=lessons[scene].turns[turn],count=t.kind==='menu'?menus[scene].length:t.options.length;if(finished||!heard||!spoken||!Number.isInteger(i)||i<0||i>=count)return;choice=i;history=history.slice(0,turn);if(i===t.correct){history[turn]=i;feedback=t.result;}else feedback='再試一次。'+(t.why||'留意店員說的內容和這一步的任務，必要時重播或看提示。');render();$(`[data-choice="${i}"]`).focus({preventScroll:true});}
function nextTurn(){if(!canNext())return;stopAudio();if(turn===lessons[scene].turns.length-1){finished=true;if(!state.complete.includes(scene))state.complete.push(scene);save();}else{turn++;resetTurn();}render();focusMain();window.scrollTo({top:0,behavior:'instant'});}
function back(){if(turn===0||finished)return;stopAudio();turn--;history=history.slice(0,turn);resetTurn();render();focusMain();}
function exportText(){return ['TRAVEL LAB｜第六天：點餐與詢價',...fields.flatMap((k,i)=>['','【'+['課前嘗試','課後比較','詢問推薦','預算選擇','指著菜單點餐','雙人練習','課後早餐'][i]+'】',state[k]||'尚未填寫']),'','【已完成情境】',state.complete.map(i=>lessons[i].name).join('、')||'尚未完成','','【自評】',...skills.map((s,i)=>s+'：'+(['看完整範例','看關鍵詞','能獨立完成'][state.ratings[i]]||'尚未自評')),'','課後練習：'+state.home.filter(Boolean).length+'/3'].join('\r\n');}
function exportWork(){const url=URL.createObjectURL(new Blob(['\ufeff'+exportText()],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='第六天_我的點餐英文.txt';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已匯出第六天練習。');}
document.addEventListener('input',e=>{const k=e.target.dataset.field;if(fields.includes(k)){state[k]=e.target.value;save();}});
document.addEventListener('change',e=>{const id=e.target.id;if(id==='heard'||id==='spoken'){if(id==='heard')heard=e.target.checked;else spoken=e.target.checked&&heard;if(!heard)spoken=false;choice=-1;feedback='';history=history.slice(0,turn);render();$('#'+id).focus({preventScroll:true});}const h=e.target.dataset.home;if(h!==undefined&&[0,1,2].includes(Number(h))){state.home[Number(h)]=e.target.checked;save();render();$(`[data-home="${h}"]`).focus({preventScroll:true});}});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;if(phraseWorkshop.handle(d))return;if(d.page!==undefined)return navigate(Number(d.page));if(d.scene!==undefined)return startScene(Number(d.scene));if(d.choice!==undefined)return choose(Number(d.choice));if(d.say)return speak(d.say,d.slow==='true');if(d.mission!==undefined){mission=Number(d.mission);render();focusMain();return;}if(d.pair!==undefined){pair=Number(d.pair);role='A';stopAudio();render();focusMain();return;}if(d.role){role=d.role;stopAudio();render();focusMain();return;}if(d.rating){const [i,j]=d.rating.split(',').map(Number);if(![0,1,2].includes(i)||![0,1,2].includes(j))return;state.ratings[i]=j;save();render();$(`[data-rating="${d.rating}"]`).focus({preventScroll:true});return;}if(d.homeChoice!==undefined){homeChoice=Number(d.homeChoice);render();$(`[data-home-choice="${homeChoice}"]`).focus({preventScroll:true});return;}if(d.act==='listen'||d.act==='slow')return speak(lessons[scene].turns[turn].line,d.act==='slow');if(d.act==='next')return nextTurn();if(d.act==='back')return back();if(d.act==='home-listen'||d.act==='home-slow')return speak(homeLine,d.act==='home-slow');if(b.id==='export'||d.act==='export')return exportWork();if(b.id==='large'){const on=document.body.classList.toggle('large');b.setAttribute('aria-pressed',on);b.textContent=on?'標準文字':'放大文字';}});
window.addEventListener('pagehide',stopAudio);render();
