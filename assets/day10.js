'use strict';
const course = {
 id:'travel-lab-unit10-kind-words-v1',
 labels:['先試著開口','請求、婉拒與道歉隨身句','走進旅途小情境','換個情況怎麼說','和老師自然接話','看看我的進步','課後開口挑戰'],
 task:'你在咖啡廳，需要 2 張餐巾紙。你會怎麼向店員提出請求？',
 words:'Could I have / two napkins / please',
 answer:'Could I have two napkins, please?',
 skills:[{id:'request',text:'我能禮貌請求物品或請人幫忙。'},{id:'decline',text:'我能清楚而有禮貌地拒絕提供或邀請。'},{id:'apology',text:'我能道歉、關心對方，並回應別人的道歉。'}]
};
const phrases = [
 ['attention','先引起注意','Excuse me.','不好意思，打擾一下。'],
 ['napkins','請求物品','Could I have two napkins, please?','可以給我 2 張餐巾紙嗎？'],
 ['water','請求飲水','Could I have some water, please?','可以給我一些水嗎？'],
 ['help','請人幫忙','Could you help me with this bag, please?','可以請你幫我搬這個袋子嗎？'],
 ['accept','接受提供','Yes, please. Thank you.','好，麻煩你了，謝謝。'],
 ['decline','婉拒提供','No, thank you. I’m okay.','不用了，謝謝。我這樣就可以了。'],
 ['invite','婉拒邀約','Thanks for asking, but I can’t tonight.','謝謝你的邀請，但我今晚沒辦法。'],
 ['plans','簡短說明原因','I already have plans.','我已經有安排了。'],
 ['alternative','提出替代時間','Maybe tomorrow?','明天或許可以？'],
 ['sorry','為碰撞道歉','I’m sorry. Are you okay?','對不起。你還好嗎？'],
 ['waiting','為遲到道歉','I’m sorry to keep you waiting.','抱歉讓你久等了。'],
 ['repair','提出補救','Let me help you.','讓我幫你吧。'],
 ['respond','回應小意外的道歉','That’s okay. No problem.','沒關係，沒問題。'],
 ['repeat','請對方重說','Sorry, could you say that again?','不好意思，可以再說一次嗎？']
].map(([id,use,en,zh])=>({id,use,en,zh}));
const replies = [
 ['need','需要什麼','What do you need?','你需要什麼？','你需要 2 張餐巾紙。','two / napkins','Two napkins, please.','改成需要一杯水。','some water','Some water, please.'],
 ['amount','需要多少','How many napkins would you like?','你想要幾張餐巾紙？','你需要 2 張。','two / please','Two, please.','改成需要 3 張。','three','Three, please.'],
 ['offer','要再來一些嗎','Would you like some more coffee?','你想再來一些咖啡嗎？','你不需要更多咖啡，禮貌拒絕。','No / thank you','No, thank you.','改成想要再加一些。','Yes / please','Yes, please.'],
 ['invitation','今晚有空嗎','Would you like to join us for dinner tonight?','今晚要一起吃晚餐嗎？','你今晚已有安排，婉拒邀請。','Thanks / can’t tonight','Thanks for asking, but I can’t tonight.','改成你很想一起去。','Yes / love to','Yes, I’d love to.'],
 ['okay','你還好嗎','Are you okay?','你還好嗎？','對方不小心碰到你並關心你；你沒有受傷。','Yes / I’m okay','Yes, I’m okay. Thank you.','改成手臂有點痛，誠實說明。','arm / hurts a little','My arm hurts a little.'],
 ['help','接受補救嗎','Can I help you pick these up?','我可以幫你把這些撿起來嗎？','你的東西掉了，你願意接受幫忙。','Yes / thank you','Yes, thank you.','改成你自己處理就可以。','No / I’m okay','No, thank you. I’m okay.']
].map(([id,name,line,zh,task,words,answer,change,changeWords,changeAnswer])=>({id,name,line,zh,task,words,answer,change,changeWords,changeAnswer}));
const step=(id,line,zh,task,words,answer,objects,valid,effect)=>({id,line,zh,task,words,answer,objects,valid,effect});
const flows = [
 {id:'cafe',name:'咖啡廳的小請求',icon:'☕',desc:'請求餐巾紙、說數量、婉拒續杯，再確認拿到的用品。',context:'你需要 2 張餐巾紙，已經喝夠咖啡。水或茶都可以接受。',steps:[
  step('item','Hi! How can I help you?','你好！需要什麼幫忙？','先引起注意，再請求餐巾紙；點選需要的物品。','Excuse me / napkins / please','Excuse me. Could I have some napkins, please?',[['▱','餐巾紙'],['🥄','湯匙']], [0],'用品單已加入餐巾紙。'),
  step('quantity','Of course. How many would you like?','當然。你需要幾張？','說你需要 2 張，再把正確數量放進托盤。','two / please','Two, please.',[['▱','1 張'],['▱ ▱','2 張'],['▱ ▱ ▱','3 張']],[1],'托盤已有 2 張餐巾紙。'),
  step('coffee','Would you like some more coffee?','你想再來一些咖啡嗎？','你不想續杯。先禮貌拒絕，再把咖啡壺留在櫃檯。','No / thank you / I’m okay','No, thank you. I’m okay.',[['☕','加入續杯'],['✋','咖啡壺留在櫃檯']],[1],'已婉拒續杯；托盤保留 2 張餐巾紙。'),
  step('drink','Would you like some water or tea instead? Both are free.','那你想要水或茶嗎？兩種都免費。','水或茶你都可以。說出自己的選擇，再放到托盤。','water / tea / please','Some water, please. / Some tea, please.',[['💧','水'],['🍵','茶']],[0,1],'飲品已放到托盤。'),
  step('confirm','','','核對托盤，向店員道謝，再領取物品。','Yes / thank you','Yes, thank you.',[['✓','領取托盤']],[0],'你已拿到餐巾紙與飲品，也清楚婉拒了咖啡續杯。')
 ]},
 {id:'invite',name:'謝謝邀請，今晚不行',icon:'◷',desc:'婉拒晚餐邀約、簡單說原因，選擇提出替代時間或就此結束。',context:'旅伴邀你今晚聚餐。你今晚已有安排；明天晚上有空，但也可以不另約。',steps:[
  step('decline','Would you like to join us for dinner tonight?','今晚要一起吃晚餐嗎？','謝謝對方邀請，清楚表示今晚不能去；把今晚聚餐卡留在對方那邊。','Thanks for asking / can’t tonight','Thanks for asking, but I can’t tonight.',[['✋','婉拒今晚聚餐'],['✓','加入今晚聚餐']],[0],'今晚的邀請已婉拒，沒有新增聚餐安排。'),
  step('reason','No problem. Maybe another time.','沒關係。改天也可以。','簡短說明你已經有安排，再保留行事曆中的原行程。','already / plans','I already have plans.',[['▣','保留原本安排'],['×','取消原本安排']],[0],'保留今晚的原安排；不需要詳細解釋私人行程。'),
  step('plan','I’m free tomorrow evening, too.','我明天晚上也有空。','你可以提議明天，或表示這次先不約。選擇符合自己說法的安排。','Maybe tomorrow / No, thank you','Maybe tomorrow? / No, thank you. Not this time.',[['◷','提議明晚'],['✋','這次先不約']],[0,1],'已記下你的決定，等對方回應。'),
  step('close','','','聽對方回應後，自然結束對話，再確認行事曆。','Sounds good / Thank you','Sounds good. Thank you. / Thank you.',[['✓','確認最後安排']],[0],'你清楚表達了界線，也有禮貌地完成對話。')
 ]},
 {id:'apology',name:'小碰撞，好好道歉',icon:'♡',desc:'碰到客人、關心對方、幫忙撿東西，最後回應對方的道歉。',context:'你轉身時碰到客人，讓對方的地圖掉到地上。先道歉，再問對方還好嗎。',steps:[
  step('sorry','Oh! My map!','啊！我的地圖！','你讓對方的地圖掉了。先道歉並問對方還好嗎，再停下腳步面向對方。','I’m sorry / Are you okay','I’m sorry. Are you okay?', [['↩','停下來關心對方'],['→','直接離開']],[0],'你停下來道歉，正等對方回答；地圖仍在地上。'),
  step('repair','I’m okay, thanks. I just dropped my map.','我沒事，謝謝。只是地圖掉了。','提出幫忙，說完再撿起地圖交還對方。','Let me / help you','Let me help you.',[['🗺','撿起並交還地圖'],['→','跨過地圖離開']],[0],'地圖已交還客人，小意外已獲得補救。'),
  step('thanks','Thank you for your help.','謝謝你的幫忙。','自然回應謝意，再收好自己的袋子，避免擋路。','You’re welcome','You’re welcome.',[['👜','收好自己的袋子']],[0],'地圖已歸還，袋子已收好，走道恢復暢通。'),
  step('respond','And I’m sorry I stepped on your foot.','還有，抱歉我踩到你的腳。','你沒有受傷。回應對方的道歉，再結束對話。','That’s okay / No problem','That’s okay. No problem.',[['✓','雙方確認沒事']],[0],'你完成道歉、關心與補救，也接住了對方的道歉。')
 ]}
];
const missions = [
 {id:'bag',name:'請人幫忙搬袋子',task:'你在飯店大廳，袋子太重，想請工作人員幫忙搬這一袋。先引起注意，再說明你需要的幫忙。',words:'Excuse me / Could you / help / this bag',answer:'Excuse me. Could you help me with this bag, please?',check:'有禮貌地開口，並指出要幫忙搬哪個袋子。'},
 {id:'sales',name:'婉拒推銷',task:'路邊店員向你推銷紀念品。你完全不想買，想簡短而有禮貌地拒絕。',words:'No / thank you / I’m okay',answer:'No, thank you. I’m okay.',check:'清楚表達不需要；不必捏造理由，也不必勉強承諾下次買。'},
 {id:'late',name:'讓旅伴久等',task:'你和旅伴約在飯店大廳，你遲到讓對方等了一陣子。向對方道歉。',words:'I’m sorry / keep you / waiting',answer:'I’m sorry to keep you waiting.',check:'說出歉意，也讓對方知道你是在為久等道歉。'},
 {id:'spill',name:'不小心打翻水',task:'你把水打翻在桌面上。向同桌旅伴道歉，再請店員給你一些餐巾紙來擦。',words:'I’m sorry / Could I have / some napkins',answer:'I’m sorry. Could I have some napkins, please?',check:'先道歉，再提出能處理問題的具體請求。'}
];
const pairs = [
 {id:'cafe',name:'咖啡廳：說出需要',role:'學生當客人，老師當店員。',first:'學生',opening:'不好意思，可以給我一些水嗎？',next:'老師回應請求，再提供咖啡續杯；學生依自己的需要接話。',objects:'💧 水　▱ 餐巾紙　☕ 咖啡',goals:['請求水','再請求 2 張餐巾紙','婉拒咖啡續杯','結束時道謝'],tags:'水免費 · 餐巾紙足夠 · 提供續杯',cards:[['請求水','Of course. Here you are.','把水交給學生。'],['要求餐巾紙但沒說數量','How many would you like?','若已說數量，直接給指定數量。'],['已拿到需要的物品','Would you like some more coffee?','給學生婉拒機會。'],['婉拒續杯','No problem. Have a nice day!','尊重決定，結束服務。']],words:'Could I have / two napkins / No, thank you',answer:'Could I have some water, please? Could I have two napkins, please? No, thank you. Thank you for your help.'},
 {id:'dinner',name:'旅伴：婉拒邀約',role:'學生當自己，老師當旅伴。',first:'老師',opening:'今晚要一起吃晚餐嗎？',start:'Would you like to join us for dinner tonight?',next:'學生今晚已有安排；老師接話，讓學生決定是否改約明晚。',objects:'◷ 今晚：已有安排　◷ 明晚：有空',goals:['感謝邀請','清楚說今晚不行','簡短說明已有安排','決定另約或禮貌結束'],tags:'今晚不能去 · 明晚可另約 · 可以不另約',cards:[['說今晚無法去','No problem. Maybe another time.','接受拒絕，不逼問私人理由。'],['提出明晚','Tomorrow evening works for me.','接受明晚；本任務只約時段，不指定時間餐廳。'],['表示這次先不約','Sure. Enjoy your evening!','接受界線，不再勸說。']],words:'Thanks for asking / can’t tonight / plans / Maybe tomorrow',answer:'Thanks for asking, but I can’t tonight. I already have plans. Maybe tomorrow?'},
 {id:'map',name:'路人：道歉與補救',role:'學生當不小心碰到人的旅客，老師當另一位旅客。',first:'學生',opening:'對不起！你還好嗎？',next:'老師的地圖掉在地上；學生提出補救。結尾老師也為踩到學生的腳道歉。',objects:'🗺 地圖在地上　👜 學生提著袋子',goals:['道歉並關心對方','提出幫忙並交還地圖','回應對方的謝意','回應對方的道歉'],tags:'對方沒受傷 · 地圖掉了 · 學生也沒受傷',cards:[['道歉並問還好嗎','I’m okay, thanks. I just dropped my map.','提供情況，等學生提出幫忙。'],['提出撿地圖','Yes, please. Thank you.','接受幫忙並道謝。'],['交還地圖並回應謝意','And I’m sorry I stepped on your foot.','讓學生練習回應道歉。'],['說沒關係','Thank you. Take care!','自然結束。']],words:'I’m sorry / Are you okay / Let me help / You’re welcome / That’s okay',answer:'I’m sorry. Are you okay? Let me help you. You’re welcome. That’s okay. No problem.'}
];
const quizzes = [
 {id:'supplies',task:'你請求用品後，店員說了什麼？',line:'Here are two napkins and some water.','zh':'這裡有 2 張餐巾紙和一些水。',options:['2 張餐巾紙和水','3 張餐巾紙和水','2 張餐巾紙和咖啡'],correct:0,why:'two napkins 是 2 張餐巾紙；water 是水。'},
 {id:'time',task:'旅伴能參加哪一晚的晚餐？',line:'Sorry, I can’t tonight. Maybe tomorrow?','zh':'抱歉，我今晚不行。明天或許可以？',options:['今晚已答應','提議明晚','完全不想另約'],correct:1,why:'can’t tonight 表示今晚不行；Maybe tomorrow 是提議明天，還要等雙方確認。'},
 {id:'apology',task:'對方在為什麼事道歉？',line:'I’m sorry to keep you waiting.','zh':'抱歉讓你久等了。',options:['碰到你','打翻水','讓你等候'],correct:2,why:'keep you waiting 表示讓你等候。'}
];
const homeTask='在飯店大廳，你想請工作人員幫忙搬袋子；旅伴邀你今晚吃飯，但你已有安排。稍後你遲到，讓旅伴等候，請向對方道歉。';
const homeAnswer='Excuse me. Could you help me with this bag, please? Thanks for asking, but I can’t tonight. I already have plans. I’m sorry to keep you waiting.';
