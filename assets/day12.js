'use strict';
const course = {
 id:'travel-lab-unit12-how-v1',
 labels:['今天，一起去哪裡','How 旅遊隨身句','安排一天小旅行','行程有變怎麼說','和老師安排出遊','看看我的進步','課後出遊挑戰'],
 task:'你和旅伴想安排今天的行程。你想提議去博物館，詢問怎麼去，以及路程要花多久。你會怎麼說？',
 words:'How about / visiting the museum / get there / How long / take',
 answer:'How about visiting the museum? How do we get there? How long does it take?',
 check:'有提出去博物館的建議、詢問交通方式，並問路程要花多久嗎？',
 skills:[{id:'connect',text:'我能問候旅伴、接話並提出活動建議。'},{id:'route',text:'我能詢問交通方式、距離與路程時間。'},{id:'time',text:'我能分清楚路程多久、多久一班與還要等多久。'},{id:'tickets',text:'我能問票價，並說清楚需要幾張票。'}]
};
const phraseGroups=['跟人聊起來','把行程問清楚','確認數量與費用'];
const phrases=[
 ['greet','問候旅伴','How are you doing?','你今天好嗎？',0],
 ['return','回答並接話','I’m doing well. How about you?','我很好，那你呢？',0],
 ['suggest','提議活動','How about visiting the museum?','去參觀博物館怎麼樣？',0],
 ['agree','接受提議','That sounds good. Let’s go!','聽起來不錯，我們走吧！',0],
 ['route','詢問交通方式','How do we get there?','我們怎麼去那裡？',1],
 ['bus','說交通方式','We can take the bus.','我們可以搭公車。',1],
 ['distance','詢問距離','How far is it from here?','從這裡到那裡有多遠？',1],
 ['duration','詢問路程時間','How long does it take?','要花多久時間？',1],
 ['frequency','詢問班次頻率','How often does the bus run?','公車多久一班？',1],
 ['arrival','詢問還要等多久','How soon will the next bus arrive?','下一班公車還要多久才到？',1],
 ['stay','詢問停留時間','How long do you plan to stay?','你打算待多久？',1],
 ['alternative','改提另一個活動','How about taking a walk instead?','改成散步怎麼樣？',0],
 ['cost','詢問票價','How much does one ticket cost?','一張票多少錢？',2],
 ['quantity','詢問張數','How many tickets do we need?','我們需要幾張票？',2],
 ['buy','說出數量','Two adult tickets, please.','請給我 2 張成人票。',2],
 ['total','確認總價','How much is it in total?','總共多少錢？',2]
].map(([id,use,en,zh,group])=>({id,use,en,zh,group})).sort((a,b)=>a.group-b.group);
const supplements=[
 {id:'come',use:'問原因 · 口語補充',en:'How come the museum is closed?',zh:'博物館怎麼關門了？',note:'How come 後面接主詞與動詞：the museum is closed。這裡不倒裝成 is the museum。'},
 {id:'tall',use:'問身高 · 延伸認識',en:'How tall are you?',zh:'你多高？',note:'例如：I’m 170 centimeters tall. 旅遊主要任務不必使用；與初次見面的人聊天時，依場合決定是否適合問。'},
 {id:'high',use:'問高度 · 景點延伸',en:'How high is the observation deck?',zh:'觀景台有多高？',note:'例如：It’s 100 meters above the ground. 這裡問觀景台離地面的高度。'},
 {id:'formal',use:'正式初次見面 · 認識即可',en:'How do you do?',zh:'您好，初次見面。',note:'較正式的招呼，可回 How do you do?。本課一般旅伴聊天練 How are you doing?。'}
];
const replies=[
 ['greeting','早晨碰面','How are you doing?','你今天好嗎？','你今天精神不錯，回答後也問問對方。','well / How about you','I’m doing well. How about you?','改成你有一點累。','a little tired','I’m a little tired. How about you?'],
 ['suggestion','旅伴的提議','How about visiting the museum?','去博物館怎麼樣？','你覺得這個提議不錯，答應一起去。','sounds good','That sounds good. Let’s go!','改成你比較想散步，提出另一個建議。','How about / taking a walk','How about taking a walk instead?'],
 ['travel','你打算怎麼去','How will you get there?','你打算怎麼去那裡？','你打算搭公車。','by bus','By bus.','改成你打算走路。','on foot','On foot.'],
 ['stay','打算待多久','How long do you plan to stay?','你打算待多久？','你打算在博物館待 2 小時。','two hours','For about two hours.','改成待 1 小時。','one hour','For about one hour.'],
 ['tickets','需要幾張票','How many tickets would you like?','你想要幾張票？','你和旅伴共 2 位成人，需要 2 張成人票。','two adult tickets','Two adult tickets, please.','改成 3 位成人。','three adult tickets','Three adult tickets, please.'],
 ['duration','路程有多久','How long does it take by bus?','搭公車要花多久？','你剛查到路程是 20 分鐘，告訴旅伴。','twenty minutes','About twenty minutes.','改成只要 10 分鐘。','ten minutes','About ten minutes.'],
 ['frequency','班次間隔','How often does the bus run?','公車多久一班？','站牌寫著每 15 分鐘一班，告訴旅伴。','every fifteen minutes','Every fifteen minutes.','改成每 30 分鐘一班。','every thirty minutes','Every thirty minutes.'],
 ['soon','下一班何時到','How soon will the next bus arrive?','下一班公車還要多久才到？','電子看板顯示再過 5 分鐘到，告訴旅伴。','in five minutes','In five minutes.','改成再過 10 分鐘到。','in ten minutes','In ten minutes.']
].map(([id,name,line,zh,task,words,answer,change,changeWords,changeAnswer])=>({id,name,line,zh,task,words,answer,change,changeWords,changeAnswer}));
const destinations=[
 {id:'museum',zh:'博物館',en:'the museum',icon:'▥',distance:3,minutes:20,frequency:15,soon:5,fare:12,bus:'12',color:'#bb865b'},
 {id:'garden',zh:'植物園',en:'the botanical garden',icon:'♧',distance:2,minutes:10,frequency:20,soon:8,fare:8,bus:'8',color:'#50866f'}
];
const step=(id,line,zh,task,words,answer,objects,valid,effect)=>({id,line,zh,task,words,answer,objects,valid,effect});
const flows=[
 {id:'outing',name:'選個景點，一起出發',icon:'↗',desc:'選景點、查路線和班次，再確認 2 張成人票的總價。',context:'你和旅伴共 2 位成人，想搭公車去景點。兩個景點都可以，先選喜歡的，再把行程問清楚。',steps:[
 step('destination','Good morning! How are you doing? What would you like to do today?','早安！你今天好嗎？今天想做什麼？','回應問候，提議去博物館或植物園，再把景點加到行程。','I’m doing well / How about visiting','I’m doing well. How about visiting the museum? / How about visiting the botanical garden?',[['▥','博物館'],['♧','植物園']],[0,1],'景點已加入行程；接著詢問怎麼去。'),
 step('route','','','先問怎麼去，聽懂服務人員的建議後，在路線圖上選交通方式。','How / get there','How do we get there?',[['▰','搭公車'],['◈','搭渡輪']],[0],'公車路線已連接旅館與景點。'),
 step('distance','','','先問從這裡有多遠，再把聽到的距離貼到地圖。','How far / from here','How far is it from here?',[['↔',''],['↔','']],[0],'地圖已標出景點距離。'),
 step('duration','','','先問搭車要花多久，再把正確的路程時間放進行程表。','How long / take','How long does it take?',[['◷',''],['◷','']],[0],'行程表已加入搭車時間。'),
 step('frequency','','','先問公車多久一班，再選擇符合回答的班次卡。','How often / bus run','How often does the bus run?',[['↻',''],['◷','']],[0],'班次看板已記下固定發車間隔。'),
 step('soon','','','先問下一班還要多久到，再設定這一次的等車倒數。','How soon / next bus / arrive','How soon will the next bus arrive?',[['◷',''],['↻','']],[0],'已記下下一班到站的等待時間。'),
 step('price','','','到景點售票口，先問一張票多少錢，再選擇正確的單張票價。','How much / one ticket / cost','How much does one ticket cost?',[['＄',''],['＄','']],[0],'單張成人票價已顯示在票夾。'),
 step('quantity','How many tickets would you like?','你想要幾張票？','你和旅伴共 2 位成人。說出張數，再把票放進票夾。','two / adult tickets / please','Two adult tickets, please.',[['▯','1 張成人票'],['▯ ▯','2 張成人票'],['▯ ▯ ▯','3 張成人票']],[1],'票夾已放入 2 張成人票。'),
 step('total','','','先問總共多少錢，核對 2 張票的總價，再確認行程。','How much / in total / thank you','How much is it in total? Thank you.',[['✓',''],['＄','']],[0],'已核對 2 張票的總價，今天的小旅行安排好了。')
 ]},
 {id:'change',name:'等車太久，換個安排',icon:'↻',desc:'發現等待太久，提議散步或喝咖啡，再問走路要多久。',context:'下一班公車還要等 30 分鐘。你們不想久等，改去附近公園或咖啡廳都可以。',steps:[
 step('wait','The next bus will arrive in thirty minutes.','下一班公車再過 30 分鐘到。','先問下一班多久到，再把這次的等候時間放到看板。','How soon / next bus','How soon will the next bus arrive?',[['◷','再等 30 分鐘'],['↻','每 30 分鐘一班']],[0],'看板顯示本次還要等 30 分鐘，並未提供固定班次。'),
 step('plan','That’s a long wait. What else could we do?','要等好久。我們還可以做什麼？','用 How about 提議去公園散步或喝咖啡，再換掉原本的搭車計畫。','How about / taking a walk / getting some coffee','How about taking a walk in the park? / How about getting some coffee?',[['♧','公園散步'],['☕','喝咖啡']],[0,1],'新的目的地已取代搭車計畫。'),
 step('walk','','','問走路要花多久，再把正確的步行時間放進新行程。','How long / take / on foot','How long does it take on foot?',[['◷',''],['◷','']],[0],'步行路線與時間已更新。'),
 step('confirm','','','接受旅伴的提議，確認新的目的地，再出發。','sounds good / Let’s go','That sounds good. Let’s go!',[['✓','依新行程出發']],[0],'已和旅伴確認新行程，不再等公車。')
 ]}
];
const missions=[
 {id:'limited',name:'剩下時間不多',task:'你和旅伴只剩 1 小時，還沒決定能不能去博物館。先問搭公車要花多久，再提議改成散步。',words:'How long / take by bus / How about / taking a walk instead',answer:'How long does it take by bus? How about taking a walk instead?',check:'有問「路程花多久」，並提出散步的替代建議嗎？'},
 {id:'budget',name:'票價超出預算',task:'售票員告訴你一張票要 25 元，但你原先希望每人不超過 15 元。向旅伴確認 2 張票的總價，並提議改去免費公園。',words:'How much / in total / How about / going to the park',answer:'How much is it in total? How about going to the park instead?',check:'有問總價，並清楚提出另一個目的地嗎？'},
 {id:'wait',name:'看板只有班次',task:'你在站牌看到「每 20 分鐘一班」，但不知道下一班還要等多久。向服務人員詢問下一班的等待時間。',words:'How soon / next bus / arrive',answer:'How soon will the next bus arrive?',check:'有詢問下一班還要等多久，而不是重問固定班次嗎？'},
 {id:'group',name:'多一位旅伴',task:'原先只有你和一位旅伴，現在又有一位成人加入。在售票口詢問單張票價，並說你們要 3 張成人票。',words:'How much / one ticket / three adult tickets',answer:'How much does one ticket cost? Three adult tickets, please.',check:'有問單張票價，並把張數改成 3 張成人票嗎？'}
];
const pairs=[
 {id:'plan',name:'和旅伴決定去哪裡',role:'學生當自己，老師當旅伴。',first:'老師',opening:'你今天好嗎？今天想做什麼？',start:'How are you doing? What would you like to do today?',next:'學生提議博物館或植物園，向旅伴問清楚怎麼去、有多遠和花多久，再決定出發。',objects:'▥ 博物館　或　♧ 植物園',goals:['回應問候並接話','提出一個景點建議','問交通方式與距離','問路程時間並確認出發'],tags:'博物館：公車 12 號／3 公里／20 分鐘 · 植物園：公車 8 號／2 公里／10 分鐘',cards:[['提出景點建議','That sounds good!','接受學生所選景點。'],['問怎麼去','We can take bus number twelve. / We can take bus number eight.','依所選景點讀其中一句；前者博物館，後者植物園。'],['問距離','It’s about three kilometers from here. / It’s about two kilometers from here.','依所選景點回答，不要求學生背老師台詞。'],['問路程時間','About twenty minutes. / About ten minutes.','依所選景點回答，等學生確認出發。']],words:'I’m doing well / How about / How do we / How far / How long',answer:'I’m doing well. How about you? How about visiting the museum? How do we get there? How far is it from here? How long does it take? Let’s go!'},
 {id:'bus',name:'問清楚三種時間',role:'學生當旅客，老師當站務人員。',first:'學生',opening:'不好意思，公車多久一班？',next:'老師依學生的問題提供資訊；學生繼續問下一班等待時間與搭車時間，最後用自己的話確認。',objects:'▰ 公車站　◷ 等待時間　↻ 班次　→ 車程',goals:['問固定班次','問下一班還要等多久','問搭車花多久','說出至少兩項正確時間'],tags:'每 15 分鐘一班 · 再等 5 分鐘 · 車程 20 分鐘',cards:[['問多久一班','Every fifteen minutes.','提供頻率。'],['問下一班何時到','In five minutes.','提供本次等待時間。'],['問車程多久','About twenty minutes.','提供路程長度。'],['確認時間且資訊正確','That’s right.','若混淆，先用中文提醒問的是班次、等待或車程，再重說對應台詞。']],words:'How often / How soon / How long / every / in',answer:'How often does the bus run? How soon will the next bus arrive? How long does it take? Every fifteen minutes. The next bus will arrive in five minutes.'},
 {id:'change',name:'問票價，再決定行程',role:'學生當旅客，老師先當售票員，再當旅伴。',first:'學生',opening:'一張票多少錢？',next:'學生問價並說要幾張票，得知總價後，可買票或提議改去免費公園。',objects:'▯ ▯ 2 位成人　每人預算 15 元　♧ 免費公園',goals:['問單張票價','說清楚 2 張成人票','問總價','決定買票或提出替代活動'],tags:'每張 18 元 · 2 張 36 元 · 可調整預算購買，也可不買',cards:[['問單張票價','Eighteen dollars. How many tickets would you like?','回答票價；若學生已說張數，不再問數量。'],['問總價','Thirty-six dollars in total.','給學生考慮是否調整預算。'],['決定購買','Here are your two tickets. Enjoy your visit!','依學生決定給票。'],['提議去免費公園','That sounds good. Let’s go to the park.','切換成旅伴，接受替代方案。']],words:'How much / two adult tickets / in total / How about / park instead',answer:'How much does one ticket cost? Two adult tickets, please. How much is it in total? How about going to the park instead?'}
];
const quizzes=[
 {id:'frequency',task:'這句話告訴你哪一種時間？',line:'The bus runs every ten minutes.',zh:'公車每 10 分鐘一班。',options:['路程花 10 分鐘','每 10 分鐘一班','下一班再等 10 分鐘'],correct:1,why:'every ten minutes 是固定班次間隔；沒有告訴你下一班何時到。'},
 {id:'soon',task:'下一班公車還要等多久？',line:'The next bus will arrive in five minutes. The trip takes twenty minutes.',zh:'下一班再過 5 分鐘到，車程 20 分鐘。',options:['5 分鐘','20 分鐘','每 5 分鐘一班'],correct:0,why:'in five minutes 是從現在起的等待時間；twenty minutes 是車程。'},
 {id:'total',task:'你買 3 張成人票，總共多少錢？',line:'One adult ticket costs eight dollars. Three tickets cost twenty-four dollars in total.',zh:'一張成人票 8 元，3 張總共 24 元。',options:['8 元','16 元','24 元'],correct:2,why:'twenty-four dollars in total 是總價 24 元；eight dollars 是單張票價。'}
];
const homeTask='你和旅伴共 3 位成人，想去植物園。提議這個活動、詢問下一班公車還要等多久，到售票口再問單張票價，並說你們要 3 張成人票。';
const homeWords='How about / botanical garden / How soon / next bus / How much / three adult tickets';
const homeAnswer='How about visiting the botanical garden? How soon will the next bus arrive? How much does one ticket cost? Three adult tickets, please.';
