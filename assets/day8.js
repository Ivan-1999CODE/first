'use strict';
const $=s=>document.querySelector(s), KEY='travel-lab-unit8-hotel-v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels=['先試著辦理入住','飯店隨身句與問答','從櫃檯到房間','處理房間的小問題','和老師完成住宿任務','看看我的進步','課後住宿挑戰'];
const taskBefore='你入住 Sun Hotel 之後，在晚上需要請人額外送兩條毛巾，並詢問要多久，你會怎麼說？';
const beforeWords='Good evening / two extra towels / bring them to my room / how long';
const beforeAnswer='Good evening. Could you bring two extra towels to my room, please? How long will it take?';
const phrases=[
 ['辦理入住','I’d like to check in, please.','我想辦理入住。','check in 是動作；飯店櫃檯是 front desk。'],
 ['說出訂房姓名','I have a reservation under Alex Chen.','我有訂房，名字是 Alex Chen。','under 後面接訂房時使用的姓名。'],
 ['遞出證件','Here is my passport.','這是我的護照。','依飯店要求出示證件；練習使用虛構資料。'],
 ['確認住宿天數','I’m staying for two nights.','我要住兩晚。','one night / two nights / three nights'],
 ['確認早餐','Is breakfast included?','有包含早餐嗎？','included 指包含在房價中。'],
 ['詢問退房時間','What time is check-out?','幾點退房？','也可以問 What time do I need to check out?'],
 ['找電梯','Where is the elevator?','電梯在哪裡？','英式英文也常用 lift。'],
 ['電話中報房號','Hi, this is room three oh five.','你好，這裡是 305 號房。','房號通常逐個數字念；0 可以念 oh 或 zero。'],
 ['請求用品','Could I have two extra towels, please?','可以再給我兩條毛巾嗎？','換成 an extra pillow（一個額外枕頭）。'],
 ['餐點送到房間','I’d like a club sandwich, please.','我想要一份總匯三明治。','餐飲送餐可聯絡 room service；毛巾可請 front desk 或 housekeeping 協助。'],
 ['確認費用','How much is it in total?','總共多少錢？','先問總額，再決定是否訂餐。'],
 ['詢問等候時間','How long will it take?','需要等多久？','聽 minutes（分鐘）；不清楚可請對方再說一次。'],
 ['說明故障','The air conditioner isn’t working.','冷氣不能運作。','也可以說 The key card isn’t working.'],
 ['請求處理','Could someone come and check it, please?','可以請人來查看嗎？','it 指前一句提到的問題。']
];
const clerkReplies=[
 {name:'找訂房',line:'Do you have a reservation?',zh:'你有訂房嗎？',task:'你有訂房，名字是 Alex Chen。',words:'Yes / under Alex Chen',answer:'Yes. I have a reservation under Alex Chen.',change:'換成另一個訂房姓名：Jamie Lin。',changeWords:'under Jamie Lin',changeAnswer:'Yes. I have a reservation under Jamie Lin.'},
 {name:'出示證件',line:'May I see your passport, please?',zh:'可以看一下你的護照嗎？',task:'你準備遞出護照，禮貌回應。',words:'Here / passport',answer:'Here is my passport.',change:'沒聽清楚，請對方再說一次。',changeWords:'say that again / please',changeAnswer:'Could you say that again, please?'},
 {name:'入住幾晚',line:'How many nights are you staying?',zh:'你要住幾晚？',task:'你要住兩晚。',words:'two nights',answer:'Two nights.',change:'如果改成三晚，怎麼說？',changeWords:'three nights',changeAnswer:'I’m staying for three nights.'},
 {name:'確認房號',line:'What’s your room number?',zh:'你的房號是幾號？',task:'你住在 305 號房。',words:'room / three oh five',answer:'Room three oh five.',change:'換成 512 號房。',changeWords:'five one two',changeAnswer:'Room five one two.'},
 {name:'確認數量',line:'How many towels would you like?',zh:'你需要幾條毛巾？',task:'你需要兩條。',words:'two / please',answer:'Two, please.',change:'如果只需要一條呢？',changeWords:'one / please',changeAnswer:'Just one, please.'},
 {name:'確認送餐',line:'It will be twenty dollars in total. Would you like to place the order?',zh:'總共 20 美元。你要訂餐嗎？',task:'你決定訂餐，再問要等多久。',words:'Yes / how long',answer:'Yes, please. How long will it take?',change:'如果你改變心意，決定不訂呢？',changeWords:'No / thank you',changeAnswer:'No, thank you. I won’t order anything for now.'}
];
const step=(line,zh,task,hint,answer,kind,options,correct,result,extra={})=>({line,zh,task,hint,answer,kind,options,correct,result,...extra});
const meals=[{name:'Club sandwich',zh:'總匯三明治',price:18,total:20},{name:'Tomato soup',zh:'番茄湯',price:10,total:12}];
const lessons=[
 {name:'在櫃檯辦理入住',en:'CHECK IN',desc:'找到訂房、選床型、確認早餐與退房時間，拿到房卡。',context:'Sunny Hotel｜Alex Chen｜2 晚｜今天可免費選一張雙人床或兩張單人床。',turns:[
  step('Welcome to Sunny Hotel. Do you have a reservation?','歡迎來到 Sunny Hotel。你有訂房嗎？','說你要入住，並報訂房姓名 Alex Chen，再找出你的訂房卡。','check in / reservation / under Alex Chen','I’d like to check in. I have a reservation under Alex Chen.','booking',['Alex Chen · 2 晚','Alex Lin · 2 晚'],0,'已找到 Alex Chen 的兩晚訂房。',{set:'booking'}),
  step('May I see your passport, please?','可以看一下你的護照嗎？','先用英文回應，再把教學護照交到櫃檯。','Here / passport','Here is my passport.','passport',['餐廳菜單','教學護照 · Alex Chen'],1,'櫃檯已核對姓名，護照已交還。',{set:'passport'}),
  step('You’re staying for two nights. Would you prefer one double bed or two single beds?','你住兩晚。你比較想要一張雙人床，還是兩張單人床？','兩種都可以。說出偏好，再選床型。','one double bed / two single beds / please','One double bed, please. / Two single beds, please.','bed',['一張雙人床','兩張單人床'],null,'已記下你的床型，下一步和櫃檯確認。',{set:'bed'}),
  step('','','先確認房型與兩晚住宿，再詢問是否包含早餐，點早餐卡。','That’s right / breakfast / included','That’s right. Is breakfast included?','breakfast',['詢問早餐是否包含'],0,'已提出早餐問題，接著聽櫃檯回答。',{dynamic:'bed'}),
  step('Yes. Breakfast is included. It’s from seven to ten in the morning.','有，包含早餐。時間是早上 7 點到 10 點。','先用英文確認早餐時段，再把正確時段加入住宿卡。','seven to ten / thank you','From seven to ten. Thank you.','clock',['06:00–09:00','07:00–10:00','07:00–11:00'],1,'早餐已記在住宿卡：07:00–10:00，房價內含。',{set:'breakfast'}),
  step('Do you have any other questions?','還有其他問題嗎？','詢問退房時間，再點開退房資訊卡。','What time / check-out','What time is check-out?','checkout',['詢問退房時間'],0,'已提出問題，接著領取房卡並確認時間。'),
  step('Check-out is at eleven in the morning. Here is your key. Room three oh five, on the third floor. The elevator is on your right.','早上 11 點退房。這是房卡。305 號房在 3 樓。電梯在你的右邊。','先確認房號和退房時間，再拿正確房卡，最後點右邊電梯。','room three oh five / eleven / thank you','Room three oh five. Check-out at eleven. Thank you.','key',['350 · 3 樓 · 11:00','305 · 3 樓 · 11:00','305 · 3 樓 · 12:00'],1,'房卡正確。現在點右邊電梯，到 3 樓的 305 號房。',{set:'key',travel:true})
 ]},
 {name:'打電話加毛巾',en:'EXTRA TOWELS',desc:'向櫃檯說房號、請求用品與數量，確認等候時間。',context:'你已入住 305 號房。你和旅伴還需要 2 條乾淨毛巾。',turns:[
  step('Front desk. How can I help you?','這裡是櫃檯。需要什麼協助？','報上房號，說你需要額外毛巾，再選電話上的房號。','room three oh five / extra towels','Hi, this is room three oh five. Could I have some extra towels, please?','phone',['Room 350','Room 305'],1,'已接通櫃檯，服務單上記下 305 號房。',{set:'call'}),
  step('Of course. How many towels would you like?','當然。你需要幾條毛巾？','說需要兩條，再把 2 條毛巾放到服務單上。','two / please','Two, please.','towels',['1 條','3 條','2 條'],2,'服務單更新：305 號房，需要 2 條毛巾。',{set:'towels'}),
  step('Two extra towels for room three oh five. Is that right?','305 號房需要 2 條額外毛巾，對嗎？','先確認，再詢問要等多久。','Yes / how long','Yes, that’s right. How long will it take?','wait',['詢問等候時間'],0,'已確認房號和數量，接著聽送達時間。'),
  step('Housekeeping will bring them up in about ten minutes. There is no charge.','房務人員大約 10 分鐘後送上去，不需額外付費。','用英文確認時間並道謝，再選正確的送達時間。','about ten minutes / thank you','About ten minutes. Thank you.','delivery',['約 20 分鐘','約 10 分鐘','約 30 分鐘'],1,'請求已完成：2 條毛巾，約 10 分鐘後送到 305 號房，無額外費用。',{set:'delivery'})
 ]},
 {name:'餐點送到房間',en:'ROOM SERVICE',desc:'選餐、問總額與送餐時間，決定訂餐或禮貌取消。',context:'你住在 305 號房。菜單價格另加每筆 2 美元送餐費；本情境沒有其他費用。',turns:[
  step('Room service. What’s your room number, please?','這裡是餐飲客房服務。請問你的房號？','先報上房號，再點房內的送餐菜單。','room three oh five','Hi, this is room three oh five.','menu',['打開 305 號房的送餐菜單'],0,'送餐單已連結 305 號房。',{set:'call'}),
  step('What would you like to order?','你想點什麼？','選一份你想吃的餐點，先說英文，再點菜單。兩種都可以。','I’d like / a club sandwich / some tomato soup','I’d like a club sandwich, please. / I’d like some tomato soup, please.','food',['Club sandwich · $18','Tomato soup · $10'],null,'餐點已加入待確認訂單，接著詢問含送餐費的總額。',{set:'meal'}),
  step('','','先確認餐點，再詢問總共多少錢。','That’s right / how much / in total','That’s right. How much is it in total?','total',['詢問含送餐費的總額'],0,'已詢問總額，下一步聽報價再決定。',{dynamic:'meal'}),
  step('','','聽總額後，自由決定要訂餐或先不訂。先用英文表達，再選擇。','Yes, please / No, thank you','Yes, please. How long will it take? / No, thank you. I won’t order anything for now.','decision',['確認訂餐，詢問時間','先不訂，禮貌取消'],null,'',{dynamic:'price',set:'decision'}),
  step('','','依對方回覆確認目前狀態，再完成這通電話。','twenty minutes / thank you / goodbye','About twenty minutes. Thank you. / Thank you. Goodbye.','finish',[],null,'',{dynamic:'finish',set:'mealDone'})
 ]}
];
const missions=[
 {name:'冷氣沒有運作',field:'airNote',task:'你在 305 號房，冷氣沒有運作。打電話報房號、說明問題，請人來查看。這裡只練清楚提出這一項需求。',hint:'room three oh five / air conditioner / isn’t working / check it',answer:'Hi, this is room three oh five. The air conditioner isn’t working. Could someone come and check it, please?'},
 {name:'房卡打不開門',field:'keyNote',task:'你到櫃檯，告訴對方 305 號房的房卡不能用，請他們幫忙。',hint:'key card / isn’t working / room three oh five / help',answer:'My key card isn’t working. I’m in room three oh five. Could you help me, please?'},
 {name:'再加一個枕頭',field:'pillowNote',task:'你在 305 號房，想多要一個枕頭。用禮貌英文請人送來，不必重走入住流程。',hint:'room three oh five / an extra pillow / please',answer:'Hi, this is room three oh five. Could I have an extra pillow, please?'}
];
const pairActivities=[
 {name:'把入住資訊問清楚',first:'學生',opening:'你好，我想辦理入住，訂房名字是 Jamie Lin。',start:'老師依學生已說的資訊接話，協助完成入住。',task:'你用 Jamie Lin 訂了 3 晚。確認早餐是否包含、退房時間，並聽懂房號。學生當旅客，老師當櫃檯。',goals:['說明入住與訂房姓名。','說出或確認住 3 晚。','詢問早餐是否包含與退房時間。','複述最後的房號，禮貌結束。'],stock:'Jamie Lin｜3 晚｜512 號房｜早餐包含，07:00–10:00｜11:00 退房。只回答學生當下問的資訊。',guide:[['學生說要入住，但還沒報姓名','What name is the reservation under?','詢問訂房姓名；若已說了，直接核對住宿天數。'],['姓名已確認','You’re staying for three nights, right?','確認 3 晚。'],['學生問早餐','Yes, breakfast is included. It’s from seven to ten.','提供早餐時段。'],['學生問退房時間','Check-out is at eleven. Your room is five one two.','讓學生確認退房時間與房號。']],cue:'先提醒「姓名、幾晚、早餐、退房、房號」；需要時給 reservation / three nights / included / check-out。',sample:'I’d like to check in. I have a reservation under Jamie Lin. Yes, three nights. Is breakfast included? What time is check-out? Room five one two. Thank you.'},
 {name:'需要用品，也需要協助',first:'老師',opening:'你好，這裡是櫃檯，請問需要什麼協助？',start:'學生報上 512 號房，說明需要一個枕頭；再告知冷氣沒有運作。',task:'你住在 512 號房，需要一個額外枕頭，而且冷氣沒有運作。提出兩項需求並問等候時間。學生當旅客，老師當櫃檯。',goals:['先報上 512 號房。','請求一個額外枕頭。','說明冷氣故障，請人查看。','詢問並確認兩項服務的等候時間。'],stock:'枕頭約 10 分鐘送達；維修人員約 20 分鐘到房間。兩項服務時間不同。',guide:[['老師先接電話','Front desk. How can I help you?','老師用這句開場。'],['學生提出需求但沒報房號','What’s your room number?','若已說房號，就不用重問。'],['學生要一個枕頭','We can bring a pillow in about ten minutes.','先回應枕頭需求。'],['學生說冷氣壞了並請人查看','Someone can come and check it in about twenty minutes.','回應維修與等候時間。']],cue:'先提醒「先說哪一間，再說需要什麼」；關鍵詞 room five one two / pillow / air conditioner / check it。',sample:'Hi, this is room five one two. Could I have an extra pillow, please? The air conditioner isn’t working. Could someone come and check it? How long will it take?'},
 {name:'晚餐要不要送到房間',first:'學生',opening:'你好，這裡是 512 號房，我想點一份總匯三明治。',start:'老師確認餐點，等學生詢問後提供總額與送餐時間。',task:'你有 20 美元預算，住在 512 號房。先問總匯三明治含送餐費的總額；如果超過預算，可以換番茄湯，也可以不訂。學生當旅客，老師當送餐人員。',goals:['報上房號並說出餐點。','詢問包含送餐費的總額。','依預算換餐或禮貌取消。','確認最後訂單與送達時間，或清楚結束取消。'],stock:'此任務菜單：三明治 $21＋送餐 $2＝$23；番茄湯 $10＋送餐 $2＝$12。都約 20 分鐘送達，無其他費用。依學生實際選擇接話。',guide:[['學生要三明治，詢問總額','It’s twenty-three dollars in total, including delivery.','超過學生的 $20 預算。'],['學生詢問較便宜的餐點','Tomato soup is twelve dollars in total, including delivery.','提供預算內的替代選擇。'],['學生決定訂番茄湯','Tomato soup for room five one two. It will take about twenty minutes.','確認最後餐點、房號與時間。'],['學生決定不訂','No problem. Have a good evening.','接受取消，不再要求訂餐。']],cue:'先提醒「先問總額，再決定」；關鍵詞 in total / cheaper / soup / no, thank you。',sample:'Hi, this is room five one two. I’d like a club sandwich. How much is it in total? Is there anything cheaper? I’ll have the tomato soup, please. How long will it take?'}
];
const fields=['before','after','airNote','keyNote','pillowNote','pairNote0','pairNote1','pairNote2','homeNote'];
const fieldNames=['課前嘗試','現在的回答','冷氣問題','房卡問題','額外枕頭','師生入住任務','師生用品與維修','師生送餐任務','課後口說'];
const skills=['我能說明訂房姓名，詢問入住資訊','我能報房號，提出用品或維修需求','我能確認數量、總額或等候時間，完成對話'];
const homeQuizzes=[
 {line:'Your room is four oh two. Check-out is at eleven in the morning.',zh:'你的房號是 402，退房時間是早上 11 點。',task:'找出正確房卡與退房時間。',options:['420 · 11:00','402 · 12:00','402 · 11:00'],correct:2,why:'four oh two 是 402；eleven 是 11 點。'},
 {line:'Your tomato soup is twelve dollars in total, including delivery. It will take about twenty minutes.',zh:'番茄湯含送餐費共 12 美元，大約 20 分鐘送達。',task:'確認總額和送達時間。',options:['$12 · 約 20 分鐘','$10 · 約 20 分鐘','$12 · 約 10 分鐘'],correct:0,why:'twelve dollars in total 是總額 $12；twenty minutes 是 20 分鐘。'}
];
