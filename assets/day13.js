'use strict';
const course={id:'travel-lab-unit13-why-which-v1',labels:['先安排一個下午','選擇與建議隨身句','和旅伴一起做決定','計畫有變怎麼說','和老師商量行程','看看我的進步','課後旅伴挑戰'],task:'今天很熱，你和旅伴要從公園或博物館選一個地方。你想去哪裡？說出一個理由，再建議怎麼去。',words:'the museum / because / hot / Why don’t we / bus',answer:'The museum, please. Because it’s too hot outside. Why don’t we take the bus?',skills:[{id:'choose',text:'我能用 Which 詢問選擇，也能說出自己的選擇。'},{id:'reason',text:'我能用 Why 問原因，並用簡短英文說理由。'},{id:'suggest',text:'我能提出建議，並接受建議或提出替代方案。'}]};
const phrases=[
 ['place','詢問想去哪裡','Which place would you like to visit, the park or the museum?','你想去哪個地方，公園還是博物館？'],
 ['choose','說出自己的選擇','The museum, please.','博物館，謝謝。'],
 ['why','詢問原因','Why do you want to go there?','你為什麼想去那裡？'],
 ['hot','說明天氣原因','Because it’s too hot outside.','因為外面太熱了。'],
 ['trees','說明個人喜好','Because I like trees.','因為我喜歡樹木。'],
 ['transport','建議一起搭車','Why don’t we take the bus?','我們搭公車好嗎？'],
 ['taxi','提出另一個建議','Why don’t we take a taxi?','我們搭計程車好嗎？'],
 ['agree','接受對方的建議','Sure. Why not?','好啊！'],
 ['sounds','表示贊成','Sounds good!','聽起來不錯！'],
 ['tired','說明想休息的原因','Because I’m tired.','因為我累了。'],
 ['rest','建議一起休息','Why don’t we take a break?','我們休息一下好嗎？'],
 ['one','詢問兩個選項','Which one would you like?','你想要哪一個？']
].map(([id,use,en,zh])=>({id,use,en,zh}));
const supplements=[
 {en:'Why don’t you take a break?',zh:'你何不休息一下？',note:'建議「你」做一件事。Why don’t we…? 則是提議「我們一起」。'},
 {en:'Why not take the bus?',zh:'何不搭公車呢？',note:'Why not + 原形動詞是在提建議。單獨回應 Sure. Why not? 則可表示「好啊」。'},
 {en:'Either will do.',zh:'兩個都可以。',note:'對方給出兩個選項，而且你沒有特別偏好時使用。'},
 {en:'Which way is it?',zh:'要走哪一條路呢？',note:'延伸到問路；本課主線先練行程選擇，不另外增加問路流程。'}
];
const replies=[
 ['place','選景點','Which place would you like to visit, the park or the museum?','你想去公園還是博物館？','你想去博物館。','the museum','The museum, please.','換成想去公園。','the park','The park, please.'],
 ['why','說理由','Why do you want to visit the museum?','你為什麼想去博物館？','外面太熱，你想待在室內。','because / hot outside','Because it’s too hot outside.','換成你喜歡藝術。','because / like art','Because I like art.'],
 ['bus','接受建議','Why don’t we take the bus?','我們搭公車好嗎？','你覺得搭公車是好主意，表示贊成。','Sure / Why not','Sure. Why not?','換另一種簡短的同意說法。','Sounds / good','Sounds good!'],
 ['alternative','提出替代方案','Why don’t we walk there?','我們走路去好嗎？','你累了，想改搭計程車。','tired / Why don’t we / taxi','I’m tired. Why don’t we take a taxi?','換成你覺得太熱，想搭公車。','hot / take the bus','It’s too hot. Why don’t we take the bus?'],
 ['rest','解釋想休息','Why do you want to take a break?','你為什麼想休息？','你走累了。','because / tired','Because I’m tired.','換成你餓了。','because / hungry','Because I’m hungry.'],
 ['drink','選一杯飲料','Which one would you like, water or tea?','你想要哪一個，水還是茶？','你想喝水。','water / please','Water, please.','換成想喝茶。','tea / please','Tea, please.']
].map(([id,name,line,zh,task,words,answer,change,changeWords,changeAnswer])=>({id,name,line,zh,task,words,answer,change,changeWords,changeAnswer}));
const step=(id,line,zh,task,words,answer,objects,valid,effect)=>({id,line,zh,task,words,answer,objects,valid,effect});
const flows=[{id:'afternoon',name:'一起安排一個下午',icon:'↗',desc:'從飯店出發，選景點、說理由、商量交通，再一起找地方休息。',context:'你和旅伴在飯店大廳。今天很熱，公園有樹蔭，博物館有冷氣，兩處都開放。依自己的偏好做決定。',steps:[
 step('place','Which place would you like to visit, the park or the museum?','你想去公園還是博物館？','先說你想去哪裡，再把地點放上行程板。','the park / the museum','The museum, please. / The park, please.',[['♧','公園'],['▥','博物館']],[0,1],'景點已加入下午行程。'),
 step('reason','','','說出符合自己選擇的一個理由，再放上理由便條。','','',[],[0,1],'你的理由已記在景點旁。'),
 step('transport','How shall we get there?','我們要怎麼去？','建議一起搭公車或計程車，說完再把交通卡接到路線上。','Why don’t we / take the bus / take a taxi','Why don’t we take the bus? / Why don’t we take a taxi?',[['▰','公車'],['🚕','計程車']],[0,1],'已提出交通建議，等旅伴回應。'),
 step('accept','','','聽懂旅伴的回應，說聲好，再確認交通安排。','Sounds good','Sounds good!',[['✓','雙方確認交通']],[0],'雙方已同意，路線已確認。'),
 step('arrive','','','你們已抵達景點。向旅伴提出一起休息的建議，再把休息卡放入行程。','Why don’t we / take a break','Why don’t we take a break?',[['☕','提議休息一下']],[0],'已提出休息建議，準備商量休息地點。'),
 step('restreason','Why do you want to take a break?','你為什麼想休息？','說出你累了或餓了，再貼上自己的理由。','Because / tired / hungry','Because I’m tired. / Because I’m hungry.',[['◷','累了'],['♨','餓了']],[0,1],'已告訴旅伴想休息的原因。'),
 step('cafe','Sure. Why not? Which café would you like, the Garden Café or the River Café?','好啊！你想去花園咖啡廳還是河畔咖啡廳？','花園咖啡廳今天休息；河畔咖啡廳營業，也供應點心。說出能去的地點，再把咖啡廳接到行程。','the River Café / please','The River Café, please.',[['🌿','花園咖啡廳・今日休息'],['≈','河畔咖啡廳・營業中']],[1],'河畔咖啡廳已加入行程，可以休息或吃點東西。'),
 step('drink','Which one would you like, water or tea?','你想要水還是茶？','你們坐下了。說出自己想喝什麼，再把飲料放到桌上。','water / tea / please','Water, please. / Tea, please.',[['💧','水'],['🍵','茶']],[0,1],'你選的飲料已放上桌。'),
 step('finish','','','核對你們一起決定的行程，用一句同意的話作結，再收好行程卡。','Sounds good','Sounds good!',[['✓','收好今天的行程卡']],[0],'這個下午的行程已完成：你能選擇、說理由，也能和旅伴商量。')
]}];
const missions=[
 {id:'rain',name:'突然下雨了',task:'你和旅伴原本想逛公園，現在下雨了。說明原因，建議改去博物館。',words:'raining / Why don’t we / museum',answer:'It’s raining. Why don’t we go to the museum?',check:'有說明下雨，並提出改去博物館的建議。'},
 {id:'tired',name:'不想繼續走路',task:'旅伴提議走路回飯店。你累了，想改搭公車。說出原因，再提出替代方案。',words:'tired / Why don’t we / bus',answer:'I’m tired. Why don’t we take the bus?',check:'有說明累了，並提出搭公車；不需要只說 Yes 或 No。'},
 {id:'choice',name:'這次由你來問',task:'你和旅伴想休息，眼前兩家咖啡廳都營業。你想知道對方喜歡哪一家，請先問對方的選擇，再問原因。',words:'Which café / Why',answer:'Which café would you like? Why do you want to go there?',check:'先問選哪家，再詢問理由；Which 與 Why 的用途不同。'},
 {id:'either',name:'補充：兩家都可以',task:'旅伴問你想去花園咖啡廳還是河畔咖啡廳。今天兩家都開，你也都願意去，簡短表達沒有特別偏好。',words:'either / will do',answer:'Either will do.',check:'表達兩個選項都可以。本題可選練，主線不要求背熟。'}
];
const pairs=[
 {id:'plan',name:'一起決定下午去哪裡',role:'學生與老師都是旅伴，一起規劃下午。',first:'學生',opening:'你想去公園還是博物館？',next:'老師選一處，學生問原因；接著學生建議交通方式，雙方確認安排。',objects:'♧ 公園：有樹蔭　▥ 博物館：有冷氣　▰ 公車　🚕 計程車',goals:['用 Which 詢問景點選擇','用 Why 詢問原因','提出一起搭車的建議','回應旅伴並確認安排'],tags:'今天很熱 · 兩個景點都開放 · 公車與計程車都可到達',cards:[['問想去哪裡','The museum, please.','也可改答 The park, please.，後續理由跟著改。'],['問為什麼','Because it’s too hot outside.','選博物館用這句；選公園可答 Because I like trees.'],['提議搭車','Sure. Why not?','公車或計程車都可接受，不糾結唯一選項。'],['未詢問原因就直接安排','Would you like to know why?','提醒學生有機會問原因。']],words:'Which place / Why / Why don’t we',answer:'Which place would you like to visit, the park or the museum? Why do you want to go there? Why don’t we take the bus? Sounds good!'},
 {id:'change',name:'旅途中，換個計畫',role:'老師當提議散步的旅伴；學生提出更合適的安排。',first:'老師',opening:'我們走路去公園好嗎？',start:'Why don’t we walk to the park?',next:'學生覺得太熱，想改去博物館並搭車。談到一半，老師告知公車要等很久，讓學生再提出辦法。',objects:'☀ 天氣炎熱　♧ 公園　▥ 博物館　▰ 公車　🚕 計程車',goals:['說明天氣或感受','建議改去博物館','遇到新條件時提出交通替代方案','確認雙方同意的計畫'],tags:'天氣熱 · 博物館開放 · 公車需等 30 分鐘 · 計程車可搭',cards:[['說想換地方但沒說理由','Why do you want to go there?','已說理由就略過這張。'],['建議博物館','Sounds good. How shall we get there?','請學生提出交通方式。'],['建議公車','The next bus is in thirty minutes.','讓學生提出搭計程車，或決定願意等候。'],['建議計程車或願意等候','Sure. Why not?','接受合理選擇，再請學生口頭確認。']],words:'too hot / museum / Why don’t we / taxi',answer:'It’s too hot. Why don’t we go to the museum? Why don’t we take a taxi? Sounds good!'}
];
const quizzes=[
 {id:'reason',task:'旅伴選哪個地方？原因是什麼？',line:'The museum, please. Because it’s too hot outside.',zh:'我選博物館，因為外面太熱了。',options:['公園，因為喜歡樹木','博物館，因為外面很熱','博物館，因為正在下雨'],correct:1,why:'museum 是博物館；too hot outside 是外面太熱。'},
 {id:'suggestion',task:'這段對話最後同意怎麼去？',line:'Why don’t we take the bus? Sure. Why not?',zh:'我們搭公車好嗎？好啊！',options:['一起搭公車','詢問公車為什麼沒來','不同意搭公車'],correct:0,why:'Why don’t we take the bus 是提議搭公車；Sure. Why not? 表示接受。'},
 {id:'drink',task:'旅伴選了哪一杯？',line:'Which one would you like, water or tea? Tea, please.',zh:'你想要水還是茶？茶，謝謝。',options:['水','兩杯都要','茶'],correct:2,why:'Tea, please. 清楚選了茶。'}
];
const homeTask='明天下雨。你想和旅伴去博物館，並搭計程車。先問旅伴想去公園還是博物館，再說出自己的選擇與原因，提出交通建議。';
const homeAnswer='Which place would you like to visit, the park or the museum? I’d like to visit the museum because it’s raining. Why don’t we take a taxi?';
