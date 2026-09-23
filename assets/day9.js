'use strict';
const $=s=>document.querySelector(s), KEY='travel-lab-unit9-reservations-v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels=['先試著安排一天','訂位與買票隨身句','訂好位，也買好票','遇到變化怎麼說','和老師完成預訂','看看我的進步','課後出遊挑戰'];
const taskBefore='你想預訂明天晚上 7 點、2 人的餐廳座位。你會怎麼跟餐廳人員說？';
const beforeWords='book a table / for two / tomorrow / seven p.m.';
const beforeAnswer='I’d like to book a table for two for tomorrow at seven p.m., please.';
const phrases=[
 ['訂一張桌位','I’d like to book a table for two, please.','我想預訂 2 人的桌位。','餐廳通常說 book a table；不是 book a position。'],
 ['指定日期與時間','For tomorrow at seven p.m., please.','明天晚上 7 點。','for 後接日期；at 後接時間。'],
 ['留下訂位姓名','The name is Alex Chen.','姓名是 Alex Chen。','確認訂位也可說 The reservation is under Alex Chen.'],
 ['詢問空位','Do you have a table available at seven?','7 點還有空桌嗎？','available 表示還有空位或可預訂。'],
 ['接受替代時間','Seven thirty is fine, thank you.','7 點半可以，謝謝。','six thirty / seven thirty；確認上午或下午。'],
 ['要求改時間','Could we change it to six thirty?','可以改成 6 點半嗎？','it 指這筆訂位；改完仍要等對方確認。'],
 ['購買成人票','I’d like two adult tickets, please.','我想買 2 張成人票。','one adult ticket / two adult tickets'],
 ['加買兒童票','One child ticket as well, please.','另外再加 1 張兒童票。','兒童票資格依景點而異；本課使用題目列出的規則。'],
 ['詢問單張票價','How much is an adult ticket?','1 張成人票多少錢？','an adult ticket 指一張；in total 指全部。'],
 ['詢問總額','How much is it in total?','總共多少錢？','確認票數和票種後再問總額。'],
 ['詢問入場時間','What time can we enter?','我們幾點可以入場？','enter 是進入；entry time 是入場時間。'],
 ['選擇付款方式','Can I pay by card?','我可以刷卡嗎？','也可以說 I’ll pay in cash.'],
 ['禮貌取消','No, thank you. I won’t book it for now.','謝謝，我暫時不預訂。','尚未付款時表達決定；已購買的退票需另問規則。'],
 ['請對方再說一次','Could you say that again, please?','可以請你再說一次嗎？','沒聽清楚時間或金額時，可以直接請對方重說。']
].map((p,i)=>({id:'phrase-'+i,use:p[0],en:p[1],zh:p[2],note:p[3]}));
const clerkReplies=[
 {id:'people',name:'幾位用餐',line:'How many people?',zh:'請問幾位？',task:'你和旅伴共 2 位。',words:'two / please',answer:'Two, please.',change:'改成你和 3 位朋友，共 4 人。',changeWords:'four',changeAnswer:'Four, please.'},
 {id:'date',name:'哪一天',line:'What day would you like to come?',zh:'你想哪一天來？',task:'你想明天去。',words:'tomorrow',answer:'Tomorrow, please.',change:'改成今天去。',changeWords:'today',changeAnswer:'Today, please.'},
 {id:'time',name:'幾點訂位',line:'What time would you like?',zh:'你想訂幾點？',task:'你想訂晚上 7 點。',words:'seven / p.m.',answer:'Seven p.m., please.',change:'改成晚上 6 點半。',changeWords:'six thirty / p.m.',changeAnswer:'Six thirty p.m., please.'},
 {id:'name',name:'訂位姓名',line:'What name is the reservation under?',zh:'訂位用什麼名字？',task:'訂位姓名是 Alex Chen。',words:'under / Alex Chen',answer:'It’s under Alex Chen.',change:'改成 Jamie Lin。',changeWords:'Jamie Lin',changeAnswer:'It’s under Jamie Lin.'},
 {id:'tickets',name:'需要哪種票',line:'Adult tickets or child tickets?',zh:'成人票還是兒童票？',task:'你要 2 張成人票。',words:'two / adult tickets',answer:'Two adult tickets, please.',change:'改成 1 張成人票和 1 張兒童票。',changeWords:'one adult / one child',changeAnswer:'One adult ticket and one child ticket, please.'},
 {id:'payment',name:'怎麼付款',line:'Cash or card?',zh:'付現還是刷卡？',task:'你決定刷卡。',words:'card / please',answer:'Card, please.',change:'改成付現。',changeWords:'cash',changeAnswer:'Cash, please.'},
 {id:'alternative',name:'接受替代時間',line:'Seven is fully booked. Is seven thirty okay?',zh:'7 點已客滿。7 點半可以嗎？',task:'你可以接受晚上 7 點半。',words:'seven thirty / fine',answer:'Seven thirty is fine, thank you.',change:'你無法等到 7 點半，決定暫時不訂。',changeWords:'No / won’t book / for now',changeAnswer:'No, thank you. I won’t book it for now.'}
];
const step=(id,line,zh,task,hint,answer,kind,options,correct,result,extra={})=>({id,line,zh,task,hint,answer,kind,options,correct,result,...extra});
const slots=[{label:'18:30',en:'six thirty p.m.',zh:'晚上 6 點半'},{label:'19:30',en:'seven thirty p.m.',zh:'晚上 7 點半'}];
const entrySlots=[{label:'10:00',en:'ten a.m.',zh:'上午 10 點'},{label:'14:00',en:'two p.m.',zh:'下午 2 點'}];
const lessons=[
 {id:'table',name:'餐廳訂位',en:'A TABLE FOR TWO',desc:'說人數、日期與姓名；客滿時選另一個時間，確認訂位卡。',context:'Olive Bistro｜明天 2 人晚餐｜Alex Chen｜原本想訂 19:00，18:30 或 19:30 都可接受。',turns:[
  step('party','Olive Bistro. How can I help you?','這裡是 Olive Bistro。需要什麼協助？','說你想預訂 2 人桌位，再選桌子。','book a table / for two','I’d like to book a table for two, please.','table',['2 人桌','4 人桌'],0,'已記下 2 位用餐。',{set:'party'}),
  step('date','What day would you like to come?','你想哪一天來？','說明天，再在日曆上選日期。','tomorrow','Tomorrow, please.','calendar',['今天','明天'],1,'日期已記為明天。',{set:'date'}),
  step('time','What time would you like?','你想訂幾點？','先詢問晚上 7 點是否有空桌，再送出時段查詢。','table available / seven p.m.','Do you have a table available at seven p.m.?','clock',['詢問 19:00 的空位'],0,'已詢問 19:00，等待餐廳確認。'),
  step('slot','Seven is fully booked. We have six thirty or seven thirty.','7 點客滿。我們有 6 點半或 7 點半。','兩個替代時間你都可以。先說偏好，再選一個仍有空位的時段。','six thirty / seven thirty / fine','Six thirty is fine, thank you. / Seven thirty is fine, thank you.','clock',['18:30 · 有空位','19:30 · 有空位','19:00 · 客滿'],[0,1],'已保留你選的時段，接著留下姓名。',{set:'slot'}),
  step('name','What name is the reservation under?','訂位用什麼名字？','說姓名 Alex Chen，再把名牌放上訂位卡。','name / Alex Chen','The name is Alex Chen.','name',['Alex Lin','Alex Chen'],1,'訂位姓名已記為 Alex Chen。',{set:'name'}),
  step('confirm','','','先複述人數和最後時間，確認卡片後完成訂位。','table for two / tomorrow / thank you','','confirm',[],0,'',{dynamic:'tableConfirm',set:'confirmed'})
 ]},
 {id:'museum',name:'景點購票',en:'TICKETS TO EXPLORE',desc:'買 2 張成人票、選入場場次、聽總價，再決定付款或先不買。',context:'City Museum｜明天 2 位成人｜成人票每張 $18，含所有費用｜10:00、14:00 都能去｜金額為教學用美元。',turns:[
  step('tickets','Welcome to City Museum. Adult tickets or child tickets?','歡迎來到 City Museum。需要成人票還是兒童票？','說要 2 張成人票，再把正確票組放到櫃檯。','two / adult tickets','I’d like two adult tickets, please.','ticket',['2 張成人票','1 張成人票＋1 張兒童票','1 張成人票'],0,'已選 2 張成人票，尚未付款。',{set:'tickets'}),
  step('date','For today or tomorrow?','要今天還是明天的？','說明天，再選入場日期。','tomorrow / please','For tomorrow, please.','calendar',['明天','今天'],0,'票券日期已記為明天。',{set:'date'}),
  step('askEntry','Do you have any questions?','有什麼問題嗎？','詢問可以幾點入場，再打開場次表。','what time / enter','What time can we enter?','clock',['詢問入場時間'],0,'已詢問場次，接著聽可選時間。'),
  step('entry','You can enter at ten a.m. or two p.m. Which time would you like?','你可以上午 10 點或下午 2 點入場。你想選哪個時間？','兩個場次都可以。先說你選的時間，再點場次。','ten a.m. / two p.m. / please','Ten a.m., please. / Two p.m., please.','clock',['10:00 · 上午','14:00 · 下午'],null,'已保留場次，接著詢問總價。',{set:'entry'}),
  step('askTotal','','','確認票券資訊，再詢問 2 張票的總額。','That’s right / in total','That’s right. How much is it in total?','ticket',['詢問 2 張票的總價'],0,'已詢問總額。',{dynamic:'ticketConfirm'}),
  step('decision','Eighteen dollars each. That’s thirty-six dollars in total. Would you like to buy the tickets?','每張 18 美元，總共 36 美元。你要買票嗎？','可決定購買或先不買。先說決定，再操作待購票券。','Yes, please / No, thank you','Yes, please. / No, thank you. I won’t buy them for now.','decision',['購買 · 確認 $36','先不買 · 取消'],null,'',{set:'decision',dynamic:'decision'}),
  step('pay','','','依對方回覆，選刷卡或付現；若已取消，禮貌結束。','by card / in cash / thank you','','payment',[],null,'',{dynamic:'payment',set:'payment'}),
  step('finish','','','確認最終結果，拿取正確票券或確認沒有購買。','Thank you / goodbye','','ticket',[],0,'',{dynamic:'ticketFinish',set:'confirmed'})
 ]}
];
const missions=[
 {id:'change',name:'改訂位時間',field:'changeNote',task:'你已用 Alex Chen 訂了明天晚上 7 點的 2 人桌。打電話想改成晚上 6 點半，先說原訂位，再提出更改需求。',hint:'reservation under Alex Chen / tomorrow at seven / change / six thirty',answer:'I have a reservation under Alex Chen for tomorrow at seven p.m. Could we change it to six thirty?',check:'有說訂位姓名、原日期時間，以及想改成 18:30 嗎？'},
 {id:'child',name:'多一張兒童票',field:'childNote',task:'你在博物館售票口，需要 2 張成人票和 1 張兒童票；孩子 8 歲，本情境 6–12 歲可買兒童票。說清楚票種數量，再問總額。',hint:'two adult tickets / one child ticket / in total',answer:'I’d like two adult tickets and one child ticket, please. How much is it in total?',check:'有分別說出 2 張成人票、1 張兒童票，並詢問總額嗎？'},
 {id:'repeat',name:'時間沒聽清楚',field:'repeatNote',task:'售票員說了入場時間，但你沒聽清楚。先請對方重說；你猜是下午 2 點，再用問句確認。',hint:'say that again / two p.m.',answer:'Could you say that again, please? Is that two p.m.?',check:'有請對方重說，並把「下午 2 點」當成待確認的問題嗎？'}
];
const pairActivities=[
 {id:'dinner',name:'幫朋友訂晚餐',first:'學生',opening:'你好，我想訂明天晚上 7 點、4 人的桌位。',start:'老師回應有沒有位子，學生選擇能接受的替代時段。',task:'學生當訂位客人，老師當餐廳人員。以 Jamie Lin 訂明天 4 人晚餐；原本想訂 19:00，18:30 或 19:30 都可以。',goals:['說出明天、4 人、原本想訂 19:00。','聽懂客滿，選擇替代時間。','留下訂位姓名 Jamie Lin。','複述最後的人數與時間。'],stock:'明天｜4 人｜19:00 客滿｜18:30、19:30 有位｜Jamie Lin',guide:[['學生提出 19:00 訂位','Seven is fully booked. Is six thirty or seven thirty okay?','讓學生選擇，不指定唯一答案。'],['學生選好時間，尚未說姓名','What name is the reservation under?','已說姓名就略過這題。'],['學生已說姓名與時間','A table for four tomorrow, under Jamie Lin. Is that right?','確認時口頭加上學生剛選的時間：at six thirty 或 at seven thirty。'],['學生確認資訊','You’re all set. See you tomorrow.','完成訂位。']],cue:'先問「幾個人、哪一天、幾點？」再給 table for four / tomorrow / name。',sample:'I’d like to book a table for four for tomorrow at seven p.m. Seven thirty is fine. The name is Jamie Lin. A table for four at seven thirty. Thank you.'},
 {id:'family',name:'全家買景點票',first:'老師',opening:'你好，需要成人票還是兒童票？',start:'學生說出 2 張成人票和 1 張兒童票，主動問總價及入場時間。',task:'學生當旅客，老師當售票員。你們要明天的 2 張成人票和 1 張兒童票，孩子 8 歲；問總額與場次，再選時間和付款方式。',goals:['說明日期及兩種票的數量。','詢問總額並確認 $45。','詢問入場時間，選 10:00 或 14:00。','表達付款方式並確認票券。'],stock:'成人 $18｜6–12 歲兒童 $9｜總額 $45，含費用｜明天 10:00、14:00｜可刷卡或付現',guide:[['老師先開場','Hello. Adult tickets or child tickets?','先等學生說所需票種與數量。'],['學生問總價','Two adult tickets and one child ticket. That’s forty-five dollars in total.','18＋18＋9＝45。'],['學生問入場時間','Ten a.m. or two p.m. Which time would you like?','依學生選擇確認場次。'],['學生決定時間並問刷卡','Yes, you can pay by card. Here are your tickets.','若學生要付現也接受，使用 Thank you. Here are your tickets.']],cue:'先提醒「成人幾張、兒童幾張？」；給 adult / child / in total / enter。',sample:'Two adult tickets and one child ticket for tomorrow, please. How much is it in total? What time can we enter? Two p.m., please. Can I pay by card?'},
 {id:'budget',name:'超出預算，清楚做決定',first:'學生',opening:'我想買今天的 2 張成人票，請問總共多少錢？',start:'老師提供總價；學生依共 $30 的預算決定先不買，禮貌結束。',task:'學生當旅客，老師當售票員。你只有共 $30 的預算，要 2 張成人票。問清楚總額；若超過預算就先不買。',goals:['提出 2 張成人票並詢問總額。','確認 $36 超過 $30 預算。','清楚表示先不買並道謝。'],stock:'成人每張 $18｜2 張共 $36｜無其他票種折扣｜尚未付款，沒有購買',guide:[['學生問總額','That’s thirty-six dollars in total.','給總額，等學生做決定。'],['學生請你重說','Thirty-six dollars for two adult tickets.','放慢速度，不代替學生決定。'],['學生表示不買','No problem. Have a nice day.','接受取消，不強迫付款。']],cue:'問「總額有沒有超過預算？你想怎麼決定？」；給 No, thank you / won’t buy / for now。',sample:'I’d like two adult tickets for today. How much is it in total? No, thank you. I won’t buy them for now.'}
];
const skills=[{id:'reserve',text:'我能說出訂位人數、日期、時間和姓名'},{id:'alternative',text:'我能聽懂客滿，選擇或詢問另一個時間'},{id:'tickets',text:'我能說出票種與張數，確認總價和入場時間'},{id:'decision',text:'我能確認付款方式，或禮貌表示先不買'}];
const homeQuizzes=[
 {id:'time',line:'A table for three tomorrow at six thirty p.m., under Jamie Lin.',zh:'Jamie Lin 訂明天晚上 6 點半、3 人的桌位。',task:'選出正確的訂位卡。',options:['明天 · 3 人 · 18:30','明天 · 2 人 · 18:30','明天 · 3 人 · 19:30'],correct:0,why:'three 是 3 人；six thirty p.m. 是晚上 6 點半。'},
 {id:'ticket',line:'Two adult tickets and one child ticket. Forty-five dollars in total. You can enter at two p.m.',zh:'2 張成人票和 1 張兒童票，總額 45 美元，下午 2 點入場。',task:'確認票券的總價與入場時間。',options:['$45 · 10:00','$36 · 14:00','$45 · 14:00'],correct:2,why:'forty-five dollars 是 $45；two p.m. 是下午 2 點。'}
];
const homeTask='以 Jamie Lin 的名字，訂明天晚上 6 點半、3 人的桌位；接著向博物館詢問明天 1 張成人票的價格和入場時間。先練兩段開場，再留下你的說法。';
const homeHint='table for three / tomorrow / six thirty p.m. / Jamie Lin / one adult ticket / how much / enter';
const homeAnswer='I’d like to book a table for three for tomorrow at six thirty p.m. The name is Jamie Lin. I’d like one adult ticket for tomorrow, please. How much is it? What time can I enter?';
const fields=['before','after',...missions.map(m=>m.field),...pairActivities.map(a=>'pairNote-'+a.id),'homeNote'];
