'use strict';
const course={
 id:'travel-lab-unit14-travel-questions-v1',
 labels:['先試著問清楚','旅途中問與答','完成半日遊集合卡','換個情況怎麼問','和老師確認行程','看看我的進步','課後問答挑戰'],
 task:'你明天要參加半日遊，但不知道在哪裡集合、什麼時候出發，以及誰是導遊。你會怎麼向旅遊服務人員問清楚這三件事？',
 words:'Where / meet · When / leave · Who / guide',
 answer:'Where do we meet? When do we leave? Who is our guide?',
 skills:[{id:'where',text:'我能詢問地點，並聽懂或回答地點資訊。'},{id:'when',text:'我能詢問時間，並聽懂或回答時間資訊。'},{id:'who',text:'我能詢問人物，並聽懂或回答人物資訊。'}]
};
const phrases=[
 ['destination','詢問想去的地方','Where would you like to go?','你想去哪裡？'],
 ['choose','說出想去的地方','I’d like to go to the beach.','我想去海邊。'],
 ['going','詢問目的地','Where are we going?','我們要去哪裡？'],
 ['meet','詢問集合地點','Where do we meet?','我們在哪裡集合？'],
 ['lobby','說出集合地點','We meet in the hotel lobby.','我們在飯店大廳集合。'],
 ['leave','詢問出發時間','When do we leave?','我們什麼時候出發？'],
 ['time','說出出發時間','We leave at nine.','我們 9 點出發。'],
 ['return','詢問回程時間','When do we get back?','我們什麼時候回來？'],
 ['guide','詢問導遊身分','Who is our guide?','誰是我們的導遊？'],
 ['name','說出導遊身分','Amy is our guide.','Amy 是我們的導遊。'],
 ['with','詢問同行的人','Who are you traveling with?','你和誰一起旅行？'],
 ['family','說出同行的人','I’m traveling with my family.','我和家人一起旅行。'],
 ['repeat','沒聽清楚，再問一次','Sorry, could you say that again?','不好意思，可以再說一次嗎？'],
 ['confirm','確認聽到的資訊','At nine, in the hotel lobby. Is that right?','9 點，在飯店大廳。這樣對嗎？']
].map(([id,use,en,zh])=>({id,use,en,zh}));
const replies=[
 ['destination','想去哪裡','Where would you like to go?','你想去哪裡？','你想去海邊，告訴服務人員。','beach / like to go','I’d like to go to the beach.','改成你想去博物館。','museum','I’d like to go to the museum.'],
 ['meeting','在哪集合','Where do we meet?','我們在哪裡集合？','旅伴詢問集合處；你知道是在飯店大廳。','hotel lobby','In the hotel lobby.','改成在博物館入口。','museum entrance','At the museum entrance.'],
 ['departure','何時出發','When do we leave?','我們什麼時候出發？','旅伴問出發時間；行程是早上 9 點。','at / nine','At nine.','改成早上 10 點。','ten','At ten.'],
 ['date','哪一天離開','When are you leaving?','你什麼時候離開？','旅伴問你何時離開這座城市；你下星期一離開。','next Monday','Next Monday.','改成明天離開。','tomorrow','Tomorrow.'],
 ['guide','誰帶我們走','Who is our guide?','誰是我們的導遊？','你知道這一團的導遊叫 Amy。','Amy / guide','Amy is our guide.','改成導遊叫 Ben。','Ben','Ben is our guide.'],
 ['companion','和誰一起旅行','Who are you traveling with?','你和誰一起旅行？','導遊問你和誰一起旅行；你和家人一起來。','with / family','I’m traveling with my family.','改成和一位朋友一起來。','a friend','I’m traveling with a friend.'],
 ['origin','補充：來自哪裡','Where are you from?','你來自哪裡？','新認識的旅伴問你來自哪裡；你來自臺灣。','from / Taiwan','I’m from Taiwan.','改成介紹自己來自臺北。','Taipei','I’m from Taipei.']
].map(([id,name,line,zh,task,words,answer,change,changeWords,changeAnswer])=>({id,name,line,zh,task,words,answer,change,changeWords,changeAnswer}));
const step=(id,line,zh,task,words,answer,objects,valid,effect)=>({id,line,zh,task,words,answer,objects,valid,effect});
const tours=[
 {name:'海邊半日遊',en:'the beach',place:'飯店大廳',placeEn:'in the hotel lobby',time:'09:00',timeEn:'nine',guide:'Amy',back:'13:00',backEn:'one'},
 {name:'博物館半日遊',en:'the museum',place:'博物館入口',placeEn:'at the museum entrance',time:'10:00',timeEn:'ten',guide:'Ben',back:'14:00',backEn:'two'}
];
const flows=[
 {id:'tour',name:'問清楚，再出發',icon:'↗',desc:'選一趟半日遊，問地點、時間與導遊，完成自己的集合卡。',context:'明天上午你想參加半日遊。海邊和博物館都可以，先決定想去哪裡，再問清楚集合資訊。',steps:[
  step('destination','Where would you like to go? We have a beach tour and a museum tour.','你想去哪裡？我們有海邊團和博物館團。','說出想去的地方，再拿起對應的行程卡。','I’d like to go / beach / museum','I’d like to go to the beach. / I’d like to go to the museum.',[['☀','海邊半日遊'],['▥','博物館半日遊']],[0,1],'已選行程；接著詢問集合地點。'),
  step('place','','','先問我們在哪裡集合，再聽回覆；在地圖標記集合處。','Where / meet','Where do we meet?',[['⌂','飯店大廳'],['▥','博物館入口'],['☕','咖啡廳']],[0],'集合地點已標在地圖和卡片上。'),
  step('time','','','先問什麼時候出發，再聽回覆；把正確時間放上集合卡。','When / leave','When do we leave?',[['08:00','早上 8 點'],['09:00','早上 9 點'],['10:00','早上 10 點']],[1],'出發時間已記下。'),
  step('guide','','','先問誰是我們的導遊，再聽回覆；找到對應的導遊名牌。','Who / our guide','Who is our guide?',[['A','Amy'],['B','Ben'],['M','Mia']],[0],'已找到這趟行程的導遊。'),
  step('back','','','先問什麼時候回來，再聽回覆；在行程卡加上回程時間。','When / get back','When do we get back?',[['12:00','中午 12 點'],['13:00','下午 1 點'],['14:00','下午 2 點']],[1],'回程時間已加到集合卡。'),
  step('confirm','','','讀出出發時間、集合地點和導遊姓名，向對方確認，再收好集合卡。','at / meet / guide / Is that right','At nine, in the hotel lobby. Amy is our guide. Is that right?',[['✓','確認並收好集合卡']],[0],'集合資訊已確認，可以安心準備明天的行程。')
 ]},
 {id:'change',name:'集合地點改了',icon:'↻',desc:'聽到集合資訊變更，重新問清楚地點、時間和帶隊的人。',context:'你已報名海邊團。原集合卡寫著飯店大廳、早上 9 點、導遊 Amy。工作人員現在通知集合資訊有變更。',steps:[
  step('place','We now meet at the café next to the hotel.','我們現在改在飯店旁邊的咖啡廳集合。','先問現在在哪集合，再聽回覆；移動集合地點標記。','Where / meet now','Where do we meet now?',[['⌂','飯店大廳'],['▥','博物館入口'],['☕','飯店旁的咖啡廳']],[2],'已把集合地點從飯店大廳改為飯店旁的咖啡廳。'),
  step('time','We leave at ten, not nine.','我們 10 點出發，不是 9 點。','先問出發時間，再聽回覆；更新集合卡上的時間。','When / leave','When do we leave?',[['08:00','早上 8 點'],['09:00','早上 9 點'],['10:00','早上 10 點']],[2],'已把出發時間改為早上 10 點。'),
  step('guide','Ben is your guide today. Amy is with another group.','今天 Ben 是你的導遊。Amy 帶另一團。','先問今天誰是導遊，再聽回覆；找到今天帶隊的人。','Who / guide today','Who is our guide today?',[['A','Amy'],['B','Ben'],['M','Mia']],[1],'已改為由 Ben 帶隊。'),
  step('confirm','Yes. At ten, at the café next to the hotel. Ben is your guide.','對。10 點，在飯店旁的咖啡廳。Ben 是你的導遊。','先說出更新後的三項資訊並詢問是否正確，再聽回覆；收好更新的卡片。','ten / café / Ben / Is that right','At ten, at the café next to the hotel. Ben is our guide. Is that right?',[['✓','收好更新的集合卡']],[0],'已完成三項資訊的更新與確認。')
 ]}
];
const missions=[
 {id:'close',name:'店家何時打烊',task:'你想晚一點回紀念品店買東西，先問店員今天什麼時候打烊。',words:'When / close / today',answer:'When do you close today?',check:'有問到今天的打烊時間。'},
 {id:'origin',name:'和新旅伴聊天',task:'你在旅行團認識新朋友，想知道對方來自哪裡，再介紹自己來自臺灣。',words:'Where / from / Taiwan',answer:'Where are you from? I’m from Taiwan.',check:'能詢問來處，也能說出自己的來處。'},
 {id:'package',name:'包裹給誰',task:'你在飯店櫃檯幫旅伴領東西。工作人員拿出一個包裹，你想先確認這個包裹是給誰的。',words:'Who / package / for',answer:'Who is the package for?',check:'有問收件人，而不是包裹的位置。'},
 {id:'phone',name:'電話裡確認對方',task:'飯店房間的電話響了，對方還沒報姓名。你想有禮貌地確認是誰打來的。',words:'Who / calling / please',answer:'Who is calling, please?',check:'有詢問來電者身分；這句用在電話中。'}
];
const pairs=[
 {id:'plan',name:'替明天問清楚',role:'學生當旅客，老師當旅遊服務人員。',first:'學生',opening:'我們在哪裡集合？',next:'你已選海邊團，向老師問出集合地點、出發時間與導遊姓名，最後口頭確認。',objects:'明天 · 海邊半日遊 · 集合資訊尚待確認',goals:['問出集合地點','問出出發時間','問出導遊身分','用自己的話確認三項資訊'],tags:'集合：飯店大廳 · 出發：09:00 · 導遊：Amy',cards:[['詢問地點','We meet in the hotel lobby.','只回答地點，留時間與人物讓學生追問。'],['詢問時間','We leave at nine.','說明早上 9 點。'],['詢問人物','Amy is your guide.','回答導遊姓名。'],['正確確認三項資訊','Yes, that’s right. See you tomorrow!','若有誤，先重說有誤的那項資訊。']],words:course.words,answer:course.answer+' At nine, in the hotel lobby. Amy is our guide. Is that right?'},
 {id:'change',name:'再確認一次變更',role:'學生當已報名的旅客，老師當服務人員。',first:'老師',opening:'我們的集合地點改了。',start:'Our meeting place has changed.',next:'原本是飯店大廳、9 點、Amy。學生追問新的地點、時間與導遊；沒聽清楚時請對方再說一次。',objects:'原集合卡：飯店大廳 · 09:00 · Amy',goals:['追問新的集合地點','確認新的出發時間','確認今天的導遊','完整複述更新後的資訊'],tags:'新集合處：飯店旁咖啡廳 · 出發：10:00 · 導遊：Ben',cards:[['追問現在在哪集合','At the café next to the hotel.','等學生問再提供新地點。'],['詢問何時出發','We leave at ten, not nine.','讓學生注意變更時間。'],['詢問誰是導遊','Ben is your guide today.','今天改由 Ben 帶隊。'],['要求重說','At ten. At the café next to the hotel. Ben is your guide.','可放慢並分成短句。'],['正確確認資訊','Yes, that’s right.','若學生仍說舊資訊，重說對應的新資訊。']],words:'Where / meet now · When / leave · Who / guide today',answer:'Where do we meet now? When do we leave? Who is our guide today? At ten, at the café next to the hotel. Ben is our guide. Is that right?'},
 {id:'chat',name:'認識新旅伴',role:'學生當自己，老師當新認識的旅伴。',first:'老師',opening:'你來自哪裡？',start:'Where are you from?',next:'練習輪流提問。學生回答來處、同行者和離開日期，再挑一項反問老師。可用自己的真實資訊，也可用下方角色設定。',objects:'可用角色：來自臺灣 · 和家人旅行 · 下星期一離開',goals:['回答來自哪裡','回答和誰一起旅行','回答何時離開','主動反問一項資訊'],tags:'老師角色：來自加拿大 · 和一位朋友旅行 · 星期五離開',cards:[['回答來處','Who are you traveling with?','詢問同行者。'],['回答同行者','When are you leaving?','詢問離開日期。'],['反問來處','I’m from Canada.','回答老師的角色資訊。'],['反問同行者','I’m traveling with a friend.','接受不同的自然問法。'],['反問離開時間','On Friday.','時間短答也很自然。']],words:'from / Taiwan · with / family · next Monday',answer:'I’m from Taiwan. I’m traveling with my family. Next Monday. Where are you from?'}
];
const quizzes=[
 {id:'meeting',task:'明天在哪集合、幾點出發、由誰帶隊？',line:'We meet in the hotel lobby. We leave at nine. Amy is your guide.',zh:'我們在飯店大廳集合，9 點出發。Amy 是你的導遊。',options:['飯店大廳 · 10 點 · Amy','飯店大廳 · 9 點 · Amy','咖啡廳 · 9 點 · Ben'],correct:1,why:'hotel lobby 是飯店大廳；nine 是 9 點；Amy 是導遊。'},
 {id:'update',task:'新的集合資訊是哪一組？',line:'We now meet at the café next to the hotel. We leave at ten. Ben is your guide today.',zh:'現在改在飯店旁的咖啡廳集合，10 點出發。今天由 Ben 帶隊。',options:['飯店旁咖啡廳 · 10 點 · Ben','飯店大廳 · 9 點 · Amy','飯店旁咖啡廳 · 9 點 · Ben'],correct:0,why:'café next to the hotel 是飯店旁咖啡廳；ten 是 10 點；今天的導遊是 Ben。'},
 {id:'person',task:'旅伴和誰一起旅行？',line:'I’m traveling with my family. We’re leaving next Monday.',zh:'我和家人一起旅行。我們下星期一離開。',options:['下星期一','飯店大廳','家人'],correct:2,why:'with my family 回答「和誰」；next Monday 是時間，不能用來回答 Who。'}
];
const homeTask='想像你明天要參加博物館半日遊。先說出詢問集合地點、出發時間與導遊的三個問題，再扮演知道資訊的旅伴：在博物館入口集合，早上 10 點出發，導遊是 Ben。';
const homeWords='Where / meet · When / leave · Who / guide · museum entrance / ten / Ben';
const homeAnswer='Where do we meet? When do we leave? Who is our guide? At the museum entrance. At ten. Ben is our guide.';
