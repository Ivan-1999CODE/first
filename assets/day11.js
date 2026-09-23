'use strict';
const course={id:'travel-lab-unit11-what-v1',labels:['先試著聊一聊','What 隨身句與短問答','認識旅伴，安排一天','換個情況怎麼說','和老師一起出遊','看看我的進步','課後 What 挑戰'],task:'你在飯店早餐區認識新旅伴。你想知道對方平常喜歡做什麼、今天想做什麼，以及想幾點出發。請用英文問這 3 件事。',words:'What / free time / would you like to do / time / leave',answer:'What do you do in your free time? What would you like to do today? What time would you like to leave?',skills:[{id:'ask',text:'我能用 What 問興趣、計畫與出發時間。'},{id:'reply',text:'我能聽懂問題要哪類資訊，並給簡短回答。'},{id:'connect',text:'我能和旅伴決定活動，也能關心狀況、分享感想。'}]};
const phrases=[
['job','認識旅伴 · 問工作','What do you do?','你做什麼工作？'],
['interest','認識旅伴 · 問平常興趣','What do you do in your free time?','你空閒時都做什麼？'],
['like','介紹自己 · 說興趣','I like taking photos.','我喜歡拍照。'],
['skill','認識旅伴 · 問專長','What are you good at?','你擅長什麼？'],
['good','介紹自己 · 說專長','I’m good at taking photos.','我擅長拍照。'],
['day','確認資訊 · 問星期','What day is it today?','今天星期幾？'],
['date','確認資訊 · 問日期','What’s the date today?','今天幾月幾號？'],
['clock','確認資訊 · 問現在時間','What time is it?','現在幾點？'],
['weather','安排今天 · 問天氣','What’s the weather like today?','今天天氣怎麼樣？'],
['plan','安排今天 · 問想做什麼','What would you like to do today?','你今天想做什麼？'],
['want','安排今天 · 說出選擇','I’d like to visit a museum.','我想參觀博物館。'],
['leave','安排今天 · 問出發時間','What time would you like to leave?','你想幾點出發？'],
['agree','確認安排 · 約好時間','Let’s leave at ten.','我們 10 點出發吧。'],
['wrong','關心旅伴 · 問狀況','What’s wrong?','怎麼了？'],
['happened','關心旅伴 · 問發生的事','What happened?','發生什麼事了？'],
['problem','說明狀況 · 遺失物品','I lost my phone.','我的手機不見了。'],
['opinion','分享感想 · 問看法','What do you think of the museum?','你覺得這間博物館怎麼樣？'],
['think','分享感想 · 說看法','I think it’s interesting.','我覺得它很有趣。']
].map(([id,use,en,zh])=>({id,use,en,zh}));
const replies=[
['job','問工作','What do you do?','你做什麼工作？','你是老師，告訴新旅伴。','a teacher','I’m a teacher.','改成你已退休。','retired','I’m retired.'],
['interest','問平常興趣','What do you do in your free time?','你空閒時都做什麼？','你喜歡拍照。','like / taking photos','I like taking photos.','改成喜歡閱讀。','like / reading','I like reading.'],
['skill','問專長','What are you good at?','你擅長什麼？','你擅長煮飯。','good at / cooking','I’m good at cooking.','改成擅長拍照。','taking photos','I’m good at taking photos.'],
['day','問星期','What day is it today?','今天星期幾？','情境設定：今天星期六。','Saturday','It’s Saturday.','改成星期日。','Sunday','It’s Sunday.'],
['date','問日期','What’s the date today?','今天幾月幾號？','情境設定：今天 6 月 12 日。','June / twelfth','It’s June twelfth.','改成 6 月 13 日。','June / thirteenth','It’s June thirteenth.'],
['clock','問現在時間','What time is it?','現在幾點？','畫面時鐘是上午 9:30。','nine thirty','It’s nine thirty.','改成上午 10:15。','ten fifteen','It’s ten fifteen.'],
['weather','問天氣','What’s the weather like today?','今天天氣怎麼樣？','今天下雨。','rainy','It’s rainy.','改成晴天。','sunny','It’s sunny.'],
['plan','問今天的計畫','What would you like to do today?','你今天想做什麼？','你今天想參觀博物館。','I’d like / visit a museum','I’d like to visit a museum.','改成想去公園。','go to the park','I’d like to go to the park.'],
['leave','問出發時間','What time would you like to leave?','你想幾點出發？','你想上午 10 點出發。','at ten','At ten, please.','改成上午 10:30。','at ten thirty','At ten thirty, please.'],
['wrong','問怎麼了','What’s wrong?','怎麼了？','你有點累。','a little tired','I’m a little tired.','改成你頭痛。','a headache','I have a headache.'],
['happened','問發生什麼事','What happened?','發生什麼事了？','你的手機不見了。','lost / phone','I lost my phone.','改成錢包不見了。','wallet','I lost my wallet.'],
['opinion','問看法','What do you think of the museum?','你覺得這間博物館怎麼樣？','你覺得這間博物館很有趣。','think / interesting','I think it’s interesting.','改成覺得它不錯，但有點小。','nice / a little small','I think it’s nice, but a little small.']
].map(([id,name,line,zh,task,words,answer,change,changeWords,changeAnswer])=>({id,name,line,zh,task,words,answer,change,changeWords,changeAnswer}));
const step=(id,line,zh,task,words,answer,objects,valid,effect)=>({id,line,zh,task,words,answer,objects,valid,effect});
const flows=[
{id:'meet',name:'早餐時，認識新旅伴',icon:'☕',desc:'交換工作與興趣，發現共同話題，再選一個想一起去的地方。',context:'你在飯店早餐區遇見 Alex。你是老師，喜歡閱讀或拍照；Alex 的資訊會在問答中逐步揭曉。',steps:[
step('job','Hi, I’m Alex. What do you do?','嗨，我是 Alex。你做什麼工作？','說你是老師，再問 Alex 做什麼工作。說完把自己的職業卡放上桌。','I’m a teacher / What do you do','I’m a teacher. What do you do?',[['📚','我：老師'],['⚙','我：工程師']],[0],'你的職業已加入人物卡；接著聽 Alex 的回答。'),
step('interest','I’m an engineer. What do you do in your free time?','我是工程師。你空閒時都做什麼？','你喜歡閱讀或拍照，選一個回答，再問 Alex 平常喜歡做什麼。','I like / reading / taking photos / What do you do in your free time','I like reading. What do you do in your free time?',[['📖','我：閱讀'],['📷','我：拍照']],[0,1],'你的興趣已放入人物卡，下一步聽 Alex 分享。'),
step('alex','I like taking photos. I’m good at taking photos, too.','我喜歡拍照，也很擅長拍照。','簡短回應，再把 Alex 的興趣卡放對位置。','That’s great','That’s great!',[['📷','Alex：拍照'],['🎹','Alex：彈鋼琴']],[0],'Alex 的興趣與專長已記下：拍照。'),
step('suggest','What would you like to do today?','你今天想做什麼？','告訴 Alex 你想去公園或博物館，再把你的提議放到桌上。','I’d like to / go to the park / visit a museum','I’d like to go to the park.',[['🌳','提議去公園'],['🏛','提議去博物館']],[0,1],'你的活動提議已放上桌，等 Alex 回應。'),
step('confirm','','','聽 Alex 確認後，表示同意，再收好你們的旅伴小卡。','Sounds good','Sounds good!',[['✓','收好旅伴小卡']],[0],'你們已認識彼此，也有了今天想一起做的事。')
]},
{id:'plan',name:'看天氣，安排半日遊',icon:'🗓',desc:'問星期、天氣、活動與時間，逐步完成今日行程卡。',context:'教學情境：星期六上午 9:30，今天下雨。博物館與水族館都是可選的室內活動；你和 Alex 上午都有空。',steps:[
step('day','Good morning! Let’s plan our day.','早安！我們來安排今天吧。','先問今天星期幾，再打開行程卡上的「星期」欄，等待回答。','What day / today','What day is it today?',[['🗓','打開星期欄']],[0],'星期欄已打開，接著聽 Alex 回答。'),
step('weather','It’s Saturday.','今天星期六。','問今天天氣如何，再打開天氣卡。','What / weather / like','What’s the weather like today?',[['☁','打開天氣卡']],[0],'行程卡已記下星期六；天氣卡已打開。'),
step('activity','It’s rainy. What would you like to do today?','今天下雨。你今天想做什麼？','你想安排室內活動。說想去博物館或水族館，再放入活動卡。','I’d like to / visit a museum / visit the aquarium','I’d like to visit a museum.',[['🏛','博物館'],['🐠','水族館'],['🧺','戶外野餐']],[0,1],'室內活動已加入行程，接著確認時間。'),
step('clock','','','先問現在幾點，再打開時鐘，等待 Alex 回答。','What time / it','What time is it?',[['◷','打開現在時間']],[0],'已詢問現在時間；下一步聽回答。'),
step('askLeave','It’s nine thirty.','現在 9 點半。','問 Alex 想幾點出發，再打開出發時間欄。','What time / would you like / leave','What time would you like to leave?',[['◷','打開出發時間欄']],[0],'時鐘顯示 9:30；出發時間等 Alex 回答。'),
step('leave','Ten or ten thirty works for me.','10 點或 10 點半我都可以。','選一個你也方便的時間，說「我們……出發吧」，再設定出發時間。','Let’s leave / at ten / at ten thirty','Let’s leave at ten.',[['10:00','上午 10:00'],['10:30','上午 10:30']],[0,1],'出發時間已設定，接著核對完整行程。'),
step('confirm','','','核對活動與時間，表示同意，再確認今日行程。','Sounds good / See you then','Sounds good. See you then!',[['✓','確認今日行程']],[0],'你們已約好室內活動與出發時間。')
]}
];
const missions=[
{id:'calendar',name:'問日期，不是星期',task:'旅伴已告訴你今天星期六，但你填寫旅遊日記時還需要知道幾月幾號。請問今天的日期。',words:'What / date / today',answer:'What’s the date today?',check:'問的是幾月幾號，而不是再問星期幾。'},
{id:'tired',name:'旅伴看起來不舒服',task:'你和旅伴走到景點入口，發現對方臉色不好。先問怎麼了；對方說很累後，提議休息一下。',words:'What’s wrong / Let’s / take a break',answer:'What’s wrong? Let’s take a break.',check:'先關心狀況，再提出休息的建議。'},
{id:'phone',name:'手機不見了',task:'在咖啡廳，旅伴問你發生什麼事。你的手機不見了。請說明情況，再請對方幫忙。',words:'lost / phone / Can you help',answer:'I lost my phone. Can you help me?',check:'說清楚發生什麼事、遺失什麼，以及需要幫忙。'},
{id:'opinion',name:'參觀後聊感想',task:'你和旅伴剛離開博物館。你覺得很有趣，想知道對方的看法。先說自己的感想，再問對方。',words:'I think / interesting / What do you think of',answer:'I think it’s interesting. What do you think of the museum?',check:'表達自己的看法，也把話題交給對方。'}
];
const pairs=[
{id:'meet',name:'早餐桌上的新朋友',role:'學生當自己，老師當新旅伴 Alex。',first:'老師',opening:'嗨，我是 Alex。你做什麼工作？',start:'Hi, I’m Alex. What do you do?',next:'學生介紹自己，再主動問老師的工作、興趣或專長，最後聊今天想做的事。',objects:'☕ 早餐桌　📷 Alex 的相機　🗺 城市地圖',goals:['回答自己的工作或退休狀況','主動問旅伴的興趣','回應或分享自己的興趣','詢問今天想做什麼'],tags:'Alex：工程師 · 喜歡拍照 · 今天想去公園',cards:[['說完自己的工作','Nice to meet you. What do you do in your free time?','接著問興趣；若學生先問你，先回答他的問題。'],['問你做什麼工作','I’m an engineer.','回答自己的工作。'],['問興趣或專長','I like taking photos. I’m good at taking photos, too.','分享拍照的興趣與專長。'],['問今天想做什麼','I’d like to go to the park. What about you?','把話題交回學生；接受其他合理提議。']],words:'I’m / I like / What do you do in your free time / What would you like to do',answer:'I’m retired. I like reading. What do you do in your free time? What would you like to do today?'},
{id:'plan',name:'一起決定今天的行程',role:'學生當旅客，老師當旅伴。',first:'學生',opening:'今天天氣怎麼樣？',next:'老師提供天氣，學生詢問對方想做什麼，說自己的偏好，最後一起決定出發時間。',objects:'☔ 下雨　🏛 博物館　🐠 水族館　◷ 上午有空',goals:['詢問天氣','詢問對方想做什麼','說自己的活動選擇','詢問並確認出發時間'],tags:'下雨 · 兩個室內地點皆可 · 10:00 或 10:30 皆可',cards:[['問天氣','It’s rainy today.','讓學生繼續問活動。'],['問想做什麼','I’d like to visit a museum. What about you?','學生可接受，也可改提水族館。'],['提出水族館','The aquarium sounds good, too.','接受替代選擇，之後依此接話。'],['問幾點出發','Ten or ten thirty works for me.','讓學生做最後選擇。'],['選好活動與時間','Sounds good. See you then!','核對學生實際選擇後結束，不強制固定活動。']],words:'What’s the weather like / What would you like to do / I’d like / What time / Let’s leave',answer:'What’s the weather like today? What would you like to do? I’d like to visit the aquarium. What time would you like to leave? Let’s leave at ten thirty.'},
{id:'care',name:'走累了，聊聊感想',role:'學生當旅客，老師當一起逛博物館的旅伴。',first:'老師',opening:'我需要坐一下。',start:'I need to sit down.',next:'學生問怎麼了，老師說有點累。學生提議休息，再聊剛才博物館的感想。',objects:'🏛 博物館出口　🪑 休息椅',goals:['關心旅伴怎麼了','提議休息','詢問對博物館的看法','分享自己的感想'],tags:'只是有點累 · 願意休息 · 覺得博物館有趣',cards:[['問怎麼了','I’m a little tired.','說明需要休息。'],['提議休息','Good idea. Let’s sit here.','接受休息的建議。'],['問對博物館的看法','I think it’s interesting. What do you think?','把話題交回學生。'],['分享感想','Thanks for sharing.','接受不同感想，不判斷喜好對錯。']],words:'What’s wrong / Let’s take a break / What do you think of / I think',answer:'What’s wrong? Let’s take a break. What do you think of the museum? I think it’s interesting.'}
];
const quizzes=[
{id:'job',task:'這句在問哪一類資訊？',line:'What do you do?',zh:'你做什麼工作？',options:['工作','現在時間','今天想做的活動'],correct:0,why:'What do you do? 單獨用在認識對方時，通常是在問工作。'},
{id:'interest',task:'哪一句回答對得上？',line:'What do you do in your free time?',zh:'你空閒時都做什麼？',options:['It’s ten.','I like reading.','It’s Saturday.'],correct:1,why:'free time 問休閒活動；I like reading. 表示喜歡閱讀。'},
{id:'plan',task:'旅伴在問什麼？',line:'What would you like to do today?',zh:'你今天想做什麼？',options:['你的職業','今天的日期','今天想做的活動'],correct:2,why:'would you like to do 問想做什麼，可以回答 I’d like to visit a museum.'},
{id:'date',task:'這一題應該回答什麼？',line:'What’s the date today?',zh:'今天幾月幾號？',options:['星期六','6 月 12 日','上午 10 點'],correct:1,why:'date 問日期；day 在 What day is it today? 中問星期。'},
{id:'leave',task:'旅伴想幾點出發？',line:'Let’s leave at ten thirty.',zh:'我們 10 點半出發吧。',options:['9:30','10:00','10:30'],correct:2,why:'ten thirty 是 10:30；at 表示在這個時間。'}
];
const homeTask='想像你在飯店遇見新旅伴：問對方平常喜歡做什麼、今天想做什麼，以及幾點出發。再用自己的偏好回答「今天想做什麼」。';
const homeWords='What / free time / would you like to do / time / leave / I’d like';
const homeAnswer='What do you do in your free time? What would you like to do today? What time would you like to leave? I’d like to visit a museum.';
