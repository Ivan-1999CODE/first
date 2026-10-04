// Approved task map. The source inventory is immutable: no original phrase or reply is dropped.
const originals=require('./curriculum-original.json');
const clone=x=>JSON.parse(JSON.stringify(x));
const unitNames={3:'機場報到與入境',4:'買好票，搭對車',5:'城市移動',6:'點餐與詢價',7:'尺寸與試穿',8:'飯店入住與客房服務',9:'訂位與景點買票',10:'請求、婉拒與道歉',11:'認識旅伴，安排一天',12:'把行程問清楚',13:'一起做決定',14:'問清楚出遊資訊'};
const icons={3:'✈',4:'🚆',5:'🗺',6:'☕',7:'👕',8:'🏨',9:'🎟',10:'🤝',11:'📷',12:'🚌',13:'🌳',14:'🧭'};
// id, purpose, original card numbers, original reply numbers. All numbers are one-based.
const maps={
3:[['A','完成報到與座位選擇',[1,2,3],[1,2]],['B','確認登機門',[4],[]],['C','回答入境問題',[5,6,7],[3,4,5]],['D','詢問是否需要申報',[8],[6]]],
4:[['A','買到正確的車票',[1,2,3,4],[1,2,3,4]],['B','找到出發時間與月台',[5,6],[]],['C','確認路線與車班',[7,8,11],[]],['D','確認轉乘與下車站',[9,10],[5]]],
5:[['A','問路，依指示走',[1,2],[1]],['B','搭計程車，問時間與費用',[6,7,8],[2,3]],['C','找到預約的司機',[9,10],[4]],['D','在合適的位置下車',[11],[5]]],
6:[['A','決定吃什麼並點餐',[1,2,3],[1,2,3,4,5,6]],['B','找到預算內的餐點',[4,5,6,7],[]],['C','說清楚內用或外帶',[8,9],[7]],['D','確認金額，完成點餐',[10,12],[]]],
7:[['A','找到尺寸與顏色',[1,2,3],[1,2,3]],['B','開始試穿',[4,5],[]],['C','說出不合身，換一件',[6,7,8,9],[4,5]],['D','比較並決定購買',[10,11,12],[]]],
8:[['A','完成入住',[1,2,3,4],[1,2,3]],['B','問清楚住宿資訊',[5,6,7],[]],['C','打電話要毛巾',[8,9],[4,5]],['D','訂客房餐點',[10,11,12],[6]],['E','回報設備問題',[13,14],[]]],
9:[['A','完成餐廳訂位',[1,2,3,4],[1,2,3,4]],['B','換時間或先不訂',[5,6,13],[7]],['C','選對票種與數量',[7,8,9],[5]],['D','確認總價與入場時間',[10,11,12],[6]]],
10:[['A','有禮貌地提出需求',[1,2,3,4],[1,2]],['B','接受或婉拒提供',[5,6],[3]],['C','回應邀請，提出另一時間',[7,8,9],[4]],['D','道歉、關心與協助',[10,11,12,13],[5,6]]],
11:[['A','認識旅伴的工作與興趣',[1,2,3],[1,2]],['B','聊聊擅長的事情',[4,5],[3]],['C','確認日期、時間與天氣',[6,7,8,9],[4,5,6,7]],['D','決定去哪裡、幾點走',[10,11,12,13],[8,9]],['E','說明發生的問題',[14,15,16],[10,11]],['F','分享遊玩感想',[17,18],[12]]],
12:[['A','打招呼，關心近況',[1,2],[1]],['B','商量活動與停留時間',[3,4,5,12],[2,4]],['C','決定怎麼去',[6,7,8,9],[3,6]],['D','決定要不要等這班車',[10,11],[7,8]],['E','買票並確認總價',[13,14,15,16],[5]]],
13:[['A','選地點，說一個理由',[1,2,3,4,5],[1,2]],['B','提出交通建議並回應',[6,7,8,9],[3,4]],['C','累了，提出休息',[10,11],[5]],['D','選一杯飲料',[12],[6]]],
14:[['A','確認想去哪裡',[1,2,3],[1]],['B','確認集合地點與出發時間',[4,5,6,7],[2,3]],['C','確認回程與導遊',[8,9,10],[5]],['D','介紹同行的人',[11,12],[6,7]],['E','重問並確認重要資訊',[13,14],[4]]]
};
const supportNumbers={3:[9,10],4:[12],5:[12],6:[11],9:[14],10:[14]};
// Distinguish what is asked; distractors are genuine neighbouring meanings, not English spelling tests.
const probes={
3:[['行李件數','停留天數'],['座位偏好','登機門'],['來訪目的','職業'],['停留時間','目前時間'],['住宿地點','出發地'],['是否攜帶食物','想吃什麼']],
4:[['目的地','出發時間'],['單程或來回','現金或刷卡'],['票數','票價'],['付款方式','票種'],['是否在河畔市集下車','是否在機場下車']],
5:[['是否需要幫忙','要去哪個月台'],['目的地','目前位置'],['要不要搭計程車','要不要下車'],['等車的位置','目的地'],['要不要在這裡下車','要不要現在上車']],
6:[['準備好點餐了嗎','要付多少錢'],['想點什麼','幾點關店'],['要不要甜點','要不要咖啡'],['牛排熟度','雞蛋做法'],['雞蛋做法','咖啡口味'],['咖啡口味','牛排熟度'],['內用或外帶','現金或刷卡']],
7:[['是否需要幫忙','是否決定付款'],['尺寸','顏色'],['顏色','尺寸'],['合身程度','價格'],['要不要換大一點','要不要換小一點']],
8:[['是否有訂房','是否要叫車'],['出示護照','出示房卡'],['住宿晚數','毛巾數量'],['房號','電話號碼'],['毛巾數量','住宿晚數'],['總共 20 美元，是否訂餐','還要等 20 分鐘']],
9:[['用餐人數','票價'],['日期','時間'],['時間','日期'],['訂位姓名','房號'],['成人票或兒童票','單程票或來回票'],['付款方式','票數'],['7 點客滿，可改 7 點半','7 點半客滿，可改 7 點']],
10:[['需要的物品','付款方式'],['餐巾紙數量','水的溫度'],['要不要再加咖啡','要不要吃晚餐'],['今晚一起吃晚餐','明天一起吃早餐'],['身體是否還好','是否有空'],['要不要幫忙撿東西','要不要幫忙訂位']],
11:[['工作','興趣'],['空閒時的興趣','工作'],['擅長的事','想買的東西'],['星期幾','幾月幾號'],['幾月幾號','星期幾'],['現在時間','出發時間'],['天氣','日期'],['今天想做什麼','平常做什麼工作'],['想幾點出發','現在幾點'],['目前怎麼了','喜歡什麼'],['發生什麼事','接著想做什麼'],['對博物館的看法','博物館的位置']],
12:[['近況如何','如何到達'],['提議去博物館','問博物館距離'],['交通方式','等待時間'],['打算待多久','下一班多久到'],['票數','票價'],['公車車程','公車班距'],['多久一班','下一班還要等多久'],['下一班還要等多久','多久一班']],
13:[['選公園或博物館','選公車或計程車'],['想去博物館的理由','博物館位置'],['提議搭公車','詢問搭車原因'],['提議走路','詢問車資'],['想休息的原因','想去哪個地方'],['選水或茶','選內用或外帶']],
14:[['想去哪裡','現在在哪裡'],['集合地點','出發時間'],['出發時間','集合地點'],['哪一天離開','哪裡集合'],['導遊是誰','旅伴是誰'],['和誰旅行','從哪裡來'],['從哪裡來','和誰旅行']]
};
function make(day){
 const original=originals.find(x=>x.day===day),raw=original.raw;
 const phrases=original.phrases.map((p,i)=>Array.isArray(p)?{id:'phrase-'+i,use:p[0],en:p[1],zh:p[2],note:p[3]||''}:clone(p));
 const replies=original.replies.map((r,i)=>({...clone(r),id:r.id||'reply-'+i,line:r.line||r.en,words:r.words||r.hint,changeWords:r.changeWords||r.changeHint,listen:'聽出這句想取得哪一類資訊。',options:probes[day][i],correct:0,why:r.zh}));
 const roles={3:'機場人員',4:'站務人員',5:'路人／司機',6:'店員',7:'店員',8:'飯店人員',9:'服務人員',10:'對方',11:'旅伴',12:'旅伴／售票員',13:'旅伴',14:'旅伴'};
 const d={course:{...(raw.course||{}),day,id:`travel-lab-unit${day}-rounds-v1`,legacyKeys:[],title:unitNames[day],description:'一次辦成一件事：先聽懂對方，再用自己的話接下去。',replyRole:roles[day],board:'把聽到的資訊與自己的決定放上任務卡',labels:['先試著開口','這輪：我會說，也聽得懂','這輪：跟著完成任務','這輪：換個情況','這輪：和老師完成任務','看看我的進步','隔一段時間，再試一次'],art:`<div class="round-hero-symbol" aria-hidden="true">${icons[day]}</div>`,review:'有說清楚需要、聽懂關鍵資訊，並在需要時求助嗎？',tip:'先選一種自己用得上的說法，其他說法可以之後再練。'},language:'en',phrases,replies,support:(supportNumbers[day]||[]).map(n=>phrases[n-1]),rounds:[],flows:[],missions:[],pairs:[],quizzes:clone(raw.quizzes||raw.homeQuizzes||[]),homeTask:raw.homeTask||'從今天的任務挑一件，換一個地點或數量，不看完整句自己完成。',homeWords:raw.homeWords||raw.homeHint||'先想清楚這次要表達的需求。',homeAnswer:raw.homeAnswer||phrases[0].en,previousLesson:{key:raw.course?.id||raw.KEY,legacyKeys:[],missions:clone(raw.missions||[]),pairs:clone(raw.pairs||[])},legacyFile:'original-lessons/'+original.file,file:original.file};
 const P=n=>phrases[n-1];
 const ask=(n,line,zh,options,label,extra={})=>({id:'s',line,zh,task:'你想'+P(n).use+'。'+(extra.task||'請先自己開口，再聽回覆。'),opening:P(n).zh,words:extra.words||P(n).en.split(' ').slice(0,3).join(' ')+'…',answer:extra.answer||P(n).en,objects:options.map(x=>['▣',x]),valid:[0],askFirst:true,label:label||P(n).use,effect:'✓ 已記到任務卡，接著完成下一件事。',...extra});
 const say=(n,line,zh,options,label,extra={})=>({...ask(n,line,zh,options,label,extra),askFirst:false});
 const response=(n,options,label,extra={})=>{const r=replies[n-1];return {id:'s',line:r.line,zh:r.zh,task:r.task,words:r.words,answer:r.answer,objects:options.map(x=>['▣',x]),valid:[0],askFirst:false,label:label||r.name,effect:'✓ 已記到任務卡，接著完成下一件事。',...extra};};
 const scripts=makeScripts(day,{ask,say,response,P});
 for(const [i,[id,name,nums,replyNums]] of maps[day].entries()){
  const spec=scripts[i],r={id,name,goal:spec.context,phraseIds:nums.map(n=>P(n).id),replyIds:replyNums.map(n=>n-1),flowIds:[i],missionIds:[i],pairIds:[i],reuse:[],words:spec.words||[],bridge:day>=11?'先問、再回答，接著交換角色；同一句也可能由旅伴說。':'先練這一件事，用單字或短句表達也可以。',role:roles[day]};
  const taskRoles={3:['地勤人員','地勤人員','入境官員','海關人員'],5:['路人','司機','司機','司機'],9:['餐廳人員','餐廳人員','售票員','售票員'],10:['店員','店員','旅伴','旅伴'],12:['旅伴','旅伴','旅伴','站務人員','售票員']};
  r.role=taskRoles[day]?.[i]||roles[day];
  if(day===5&&i===0)r.hearPhraseIds=[3,4,5].map(n=>P(n).id);
  if(day===6&&i===0){r.extraReplyIds=r.replyIds.slice(2);r.replyIds=r.replyIds.slice(0,2);}
  if(day===6&&i===1){r.extraPhraseIds=[P(5).id,P(7).id];r.phraseIds=[P(4).id,P(6).id];}
  if(day===7&&i===2){r.extraPhraseIds=[P(7).id];r.phraseIds=r.phraseIds.filter(x=>x!==P(7).id);}
  if(day===13&&i===0){r.extraPhraseIds=[P(5).id];r.phraseIds=r.phraseIds.filter(x=>x!==P(5).id);}
  const f={id:'task-'+id.toLowerCase(),name:id+'｜'+name,desc:spec.context,context:spec.context,summary:spec.change,sceneTitle:name,sceneIcon:icons[day],generic:true,steps:spec.steps.map((s,j)=>({...s,id:'step-'+j}))};
  if(!r.replyIds.length){const t=f.steps.find(s=>s.askFirst)||f.steps[0];const index=replies.length;replies.push({id:'listen-'+id,name:'聽懂：'+t.label,line:t.line,zh:t.zh,listen:'先聽這次回覆，找出需要的資訊。',options:t.objects.map(x=>x[1]),correct:t.valid[0],why:t.zh,task:'你已取得資訊，向對方道謝。',words:'thank / you',answer:'Thank you.',change:'如果剛才沒有聽清楚，請對方重說。',changeWords:'say / again',changeAnswer:'Could you say that again, please?'});r.replyIds.push(index);}
  d.flows.push(f);
  const m={id:'task-'+id.toLowerCase(),name:id+'｜'+name+'・換情況',task:spec.change,words:spec.changeWords||f.steps.map(s=>s.words).join(' / '),answer:spec.changeAnswer,check:spec.check||'能依新條件說清楚需求；可以用多個短句，不需要逐字相同。'};
  d.missions.push(m);
  const first=f.steps[0];
  d.pairs.push({id:'task-'+id.toLowerCase(),name:id+'｜'+name,role:`學生當旅客，老師當${roles[day]}；一起看畫面。${day>=11?'完成後交換提問與回答的角色。':''}`,first:first.askFirst?'學生':'老師',opening:first.askFirst?(first.opening||first.task.replace(/^你想/,'')):first.zh,start:first.askFirst?'':first.line,next:'依當下的回答接話，完成下方目標；下一輪改用「'+spec.change+'」的條件。',objects:spec.context,goals:f.steps.map(s=>s.label),tags:spec.context,cards:f.steps.map(s=>[s.askFirst?s.task:'讓學生回應這一項',s.line,s.zh]),words:m.words,answer:f.steps.map(s=>s.answer).join(' ')});
  d.pairs.at(-1).role=`學生當旅客，老師當${r.role}；一起看畫面。${day>=11?'完成後交換提問與回答的角色。':''}`;
  d.rounds.push(r);
 }
 if(!d.course.task){d.course.task=raw.taskBefore||raw.firstTryTask||d.flows[0].context;d.course.words=raw.beforeWords||d.missions[0].words;d.course.answer=raw.beforeAnswer||d.flows[0].steps.map(s=>s.answer).join(' ');}
 d.course.skills=d.rounds.map(r=>({id:'task-'+r.id,text:'我能'+r.name+'。'}));
 d.reviewTasks=d.rounds.map(r=>({id:r.id,name:r.name,task:d.missions[r.missionIds[0]].task,words:d.missions[r.missionIds[0]].words,answer:d.missions[r.missionIds[0]].answer}));
 d.quizzes=d.rounds.map(r=>{const q=replies[r.replyIds[0]];return {id:'review-'+r.id,task:r.name+'：聽出關鍵資訊',line:q.line,zh:q.zh,options:q.options,correct:q.correct,why:q.why};});
 return d;
}

function makeScripts(day,{ask:a,say:s,response:r,P}){
 const task=(context,steps,change,changeAnswer,words=[])=>({context,steps,change,changeAnswer,words});
 const scripts={
3:()=>[
 task('你在機場報到，要託運 1 件行李，想坐靠走道。',[a(1,'How many bags are you checking in?','您要託運幾件行李？',['正在辦理報到','正在辦理入住'],'提出報到需求'),r(1,['1 件','2 件'],'託運件數'),r(2,['靠走道','靠窗'],'座位偏好')],'換成託運 2 件行李，想坐靠窗。','I’d like to check in. I have two bags to check in. A window seat, please.'),
 task('你已完成報到，還不知道登機門。',[a(4,'Gate twelve.','12 號登機門。',['12 號登機門','20 號登機門'],'找到登機門'),a(9,'Gate twelve.','12 號登機門。',['12','20'],'重聽並確認',{task:'假設剛才沒聽清楚號碼，請對方再說一次。'})],'登機門改成 20 號；先問，再請對方說慢一點。','Which gate should I go to? Could you speak more slowly, please?', [['twelve / twenty','12／20'],['gate','登機門']]),
 task('這次來觀光，停留 7 天，住 Sunny Hotel。',[r(3,['觀光','出差'],'旅行目的'),r(4,['7 天','2 週'],'停留時間'),r(5,['Sunny Hotel','朋友家'],'住宿地點')],'換成出差 2 週，住朋友家，回答同樣的三個問題。','I’m here on business. Two weeks. With a friend.'),
 task('你的包包裡有餅乾。練習如實說明，並詢問是否需要申報。',[r(6,['有帶餅乾','沒有食物'],'如實說明物品'),a(8,'Please show it to the officer.','請把物品拿給官員看。',['向官員出示物品','直接離開'],'詢問並依指示處理')],'換成沒有攜帶食物；若另一件物品不確定，主動詢問。','No, I don’t have any food. Do I need to declare this?')],
4:()=>[
 task('你要買 1 張到 Central Station 的單程票，打算刷卡。',[r(1,['Central Station','機場'],'目的地'),r(2,['單程','來回'],'票種'),a(3,'Twelve dollars.','12 美元。',['$12','$20'],'票價'),r(4,['刷卡','現金'],'付款方式')],'換成到機場的 2 張來回票，付現金。','Two tickets to the airport, please. Return, please. Cash, please.'),
 task('你已拿到車票，確認發車時間和月台。時間都是情境設定。',[a(5,'It leaves at two forty.','2 點 40 分出發。',['2:40','4:20'],'發車時間'),a(6,'Platform six.','第 6 月台。',['第 6 月台','第 3 月台'],'月台')],'改成 3 點 20 分、第 4 月台；自己問到兩項資訊。','What time does it leave? Which platform?', [['two forty / three twenty','2:40／3:20'],['platform','月台']]),
 task('你想去 River Market，先確認要搭的路線，再核對這班車。',[a(7,'Take the green line.','搭綠線。',['綠線','紅線'],'路線'),a(8,'Take bus twelve.','搭 12 號公車。',['12 號','20 號'],'公車號碼'),a(11,'Yes, it does.','有，這班有到。',['搭這班去 River Market','這班沒有到'],'核對目的地')],'目的地換成機場，再問這班公車有沒有到。','Which bus should I take? Does this bus go to the airport?'),
 task('你要到 River Market，需要轉乘並確認下車站。',[a(9,'Change at Central Station.','在 Central Station 轉乘。',['Central Station','River Market'],'轉乘站'),a(10,'Get off at River Market.','在 River Market 下車。',['River Market','Central Station'],'下車站'),r(5,['對，在 River Market 下車','不是，在 Central Station 下車'],'再次確認')],'改成目的地是 Central Station；聽到別的站名時清楚更正。','Where should I get off? No, Central Station, please.')],
5:()=>[
 task('你要去博物館。面朝地圖上方，先聽路人指示再走。',[a(1,'Go straight. Turn left at the first intersection.','直走，在第一個路口左轉。',['↑ 直走，第一路口 ← 左轉','↑ 直走，第二路口 → 右轉'],'依指示走'),a(2,'No. It’s a five-minute walk.','不遠，走路約 5 分鐘。',['走路約 5 分鐘','走路約 50 分鐘'],'判斷遠近')],'換成車站；路人說在第二個路口右轉。先問，再指出方向。','Excuse me. How do I get to the train station? Is it far?', [['straight / left / right','直走／左／右'],['first / second','第一／第二']]),
 task('你想搭計程車到博物館，先問車程和大約費用。',[a(6,'Certainly.','當然可以。',['目的地：博物館','目的地：機場'],'目的地'),a(7,'About fifteen minutes.','約 15 分鐘。',['15 分鐘','50 分鐘'],'車程'),a(8,'About twelve dollars.','約 12 美元。',['$12','$20'],'車資')],'換成去 Sunny Hotel；詢問時間與大約費用。','Can you take me to Sunny Hotel, please? How long does it take? How much will it be?'),
 task('你在飯店入口外等待已預約的車，先確認是否為接你的司機。',[a(9,'Yes. Where are you waiting?','是的，你在哪裡等？',['確認接車位置','確認車票'],'確認司機'),r(4,['飯店入口外','博物館入口'],'說出等車位置')],'改在博物館入口等候。','Are you my Uber driver? I’m at the museum entrance.'),
 task('車已到目的地附近，你想在入口下車。',[r(5,['在入口下車','現在就下車'],'說明下車位置',{task:'你想在入口下車，告訴司機。',answer:'At the entrance, please.'}),a(11,'Sure. Here is fine.','好的，這裡可以。',['在入口停車','繼續前進'],'提出停車需求')],'改成目前的位置就可以；回應司機並請他停車。','Yes, here is fine. Could you stop here, please?')],
6:()=>[
 task('你在咖啡廳還沒決定，先請推薦，再點雞肉三明治。',[a(3,'I recommend the chicken sandwich.','我推薦雞肉三明治。',['雞肉三明治','番茄義大利麵'],'聽懂推薦'),s(1,'May I take your order?','可以幫您點餐嗎？',['雞肉三明治','番茄義大利麵'],'說出餐點',{task:'你決定點雞肉三明治。'})],'換成點番茄義大利麵；如果還沒決定，請對方再給你一點時間。','Not yet. Could we have another minute, please? I’ll have the tomato pasta, please.'),
 task('你有 10 美元預算。眼前餐點 12 美元，想找便宜一點的。',[a(4,'It’s twelve dollars.','12 美元。',['超過 $10 預算','在 $10 預算內'],'判斷價格'),a(6,'The egg toast is seven dollars fifty.','蛋吐司 7 美元 50 分。',['蛋吐司 $7.50','蛋吐司 $12'],'找到替代餐點')],'預算改成 8 美元，用另一種說法詢問便宜選項。','How much is it? Do you have a cheaper option?', [['seven dollars fifty','7 美元 50 分'],['cheaper','比較便宜']]),
 task('餐點已選好，先練內用，再試外帶。',[r(7,['內用','外帶'],'用餐方式'),a(12,'Thank you. Please take a seat.','謝謝，請入座。',['入座等餐','到外帶區等餐'],'確認內用安排')],'這次要帶走，回應店員後結束點餐。','To go, please. That’s all, thank you.'),
 task('你聽到金額像是 8 美元 50 分，想確認後完成點餐。',[a(10,'Yes, eight dollars fifty.','對，8 美元 50 分。',['$8.50','$18.50'],'確認金額'),s(12,'Anything else?','還需要別的嗎？',['就這些','還要加餐'],'結束點餐',{task:'你不再加點，告訴店員就這些。'})],'金額改成 7 美元 50 分，先確認，再說就這些。','Is it seven dollars fifty? That’s all, thank you.')],
7:()=>[
 task('你找 T-shirt，需要 M 號，想看藍色。',[r(1,['T-shirt','鞋子'],'找商品'),r(2,['M 號','L 號'],'尺寸'),r(3,['藍色','綠色'],'顏色')],'改成 L 號、綠色，並問有沒有其他顏色。','Large, please. Green, please. Do you have this in another color?'),
 task('你找到喜歡的衣服，想先試穿，再找試衣間。',[a(4,'Of course.','當然可以。',['可以試穿','不能試穿'],'取得試穿同意'),a(5,'The fitting rooms are on the right.','試衣間在右邊。',['→ 右邊','← 左邊'],'找到試衣間')],'換一件衣服再問；這次試衣間在左邊。','Can I try this on? Where are the fitting rooms?'),
 task('你穿的衣服太小，想換大一點。',[s(6,'How does it fit?','穿起來合身嗎？',['太小','太大'],'描述問題',{task:'說明這件太小。',answer:'It’s too small.'}),a(8,'Yes. Here is the medium.','有，這是 M 號。',['換到 M 號','仍是原尺寸'],'要求換大')],'換成太大，想換小一點；再試著描述太緊或太鬆。','It’s too big. Do you have a smaller one?'),
 task('兩件衣服都試過了，藍色這件合身，你比較喜歡它。',[s(10,'How does it fit?','穿起來合身嗎？',['合身','太小'],'說明合身',{task:'這件剛好合身。'}),s(11,'Which one do you like better?','你比較喜歡哪一件？',['眼前藍色這件','另一件綠色'],'表達偏好',{task:'指著藍色這件，說你比較喜歡它。'}),s(12,'Would you like to take it?','要買這件嗎？',['買這件','暫時不買'],'決定購買',{task:'你決定購買。'})],'換成偏好綠色那件，指著它比較，決定要買。','It fits well. I like this one better. I’ll take it.')],
8:()=>[
 task('你以 Alex Chen 訂房，住 2 晚，準備好護照。',[a(1,'Do you have a reservation?','你有訂房嗎？',['辦理入住','辦理退房'],'提出入住需求'),r(1,['Alex Chen','Jamie Lin'],'訂房姓名'),r(2,['出示護照','出示車票'],'證件'),r(3,['2 晚','3 晚'],'住宿晚數')],'改以 Jamie Lin 訂房，住 3 晚。','I’d like to check in, please. I have a reservation under Jamie Lin. Here is my passport. Three nights.'),
 task('完成入住後，確認早餐、退房時間和電梯位置。',[a(5,'Yes, it is.','有包含早餐。',['含早餐','不含早餐'],'早餐'),a(6,'Check-out is at eleven.','11 點退房。',['11:00','12:00'],'退房時間'),a(7,'On your left.','在你的左邊。',['← 左邊','→ 右邊'],'電梯位置')],'換一家飯店，早餐不包含、12 點退房；重新問清楚。','Is breakfast included? What time is check-out? Where is the elevator?'),
 task('你住 305 號房，要再拿 2 條毛巾。',[r(4,['305 號房','512 號房'],'報房號'),a(9,'Of course. Two towels for room three oh five.','好的，305 號房送 2 條毛巾。',['305 號房・2 條','512 號房・1 條'],'提出數量需求')],'改成 512 號房，只需要 1 條毛巾。','Hi, this is room five one two. Could I have one extra towel, please?'),
 task('你想訂總匯三明治，先確認總價和等待時間。',[a(10,'Certainly.','好的。',['總匯三明治','番茄義大利麵'],'點餐'),a(11,'Twenty dollars in total.','總共 20 美元。',['總共 $20','每份 $20，總價未知'],'總價'),a(12,'About twenty minutes.','約 20 分鐘。',['20 分鐘','2 小時'],'等待時間')],'你改變心意，這次不訂餐，禮貌告訴服務人員。','No, thank you. I won’t order anything for now.'),
 task('305 號房冷氣不能運作，請人來查看。',[s(13,'How can I help you?','需要什麼幫忙？',['冷氣故障','缺毛巾'],'說明故障',{task:'先報房號，再說冷氣不能運作。',answer:'Hi, this is room three oh five. The air conditioner isn’t working.'}),a(14,'We’ll send someone to your room.','我們會派人到您的房間。',['有人會到房間查看','要自行更換冷氣'],'要求協助')],'換成 512 號房，同樣回報冷氣問題。','Hi, this is room five one two. The air conditioner isn’t working. Could someone come and check it, please?')],
9:()=>[
 task('以 Alex Chen 訂明天晚上 7 點、2 人的桌位。',[r(1,['2 人','4 人'],'人數'),r(2,['明天','今天'],'日期'),r(3,['晚上 7 點','晚上 6:30'],'時間'),r(4,['Alex Chen','Jamie Lin'],'姓名')],'改以 Jamie Lin 訂今天晚上 6:30、4 人桌。','I’d like to book a table for four, please. For today at six thirty p.m., please. The name is Jamie Lin.'),
 task('7 點已客滿，店員提供 7 點半，你可以接受。',[r(7,['接受 7:30','這次不訂'],'處理客滿'),a(6,'Six thirty is available too.','6 點半也有位置。',['改成 6:30','仍是 7:00'],'詢問另一時間')],'這次提供的時間都不方便，清楚表示先不訂。','No, thank you. I won’t book it for now.'),
 task('你要 2 張成人票，再加 1 張兒童票。',[a(9,'An adult ticket is ten dollars.','成人票每張 10 美元。',['成人票 $10','成人票 $20'],'成人單價'),r(5,['2 張成人票','2 張兒童票'],'選成人票'),a(8,'One child ticket. Anything else?','1 張兒童票，還需要其他的嗎？',['再加 1 張兒童票','不加兒童票'],'補上兒童票')],'改成 1 張成人票和 1 張兒童票。','One adult ticket and one child ticket, please.'),
 task('票已選好，確認總價與入場時間，再刷卡。',[a(10,'Twenty-five dollars in total.','總共 25 美元。',['$25','$15'],'總價'),a(11,'You can enter at ten.','可以 10 點入場。',['10:00','12:00'],'入場時間'),r(6,['刷卡','現金'],'付款')],'換成下午 2 點入場，付款改成現金。','What time can we enter? How much is it in total? Cash, please.')],
10:()=>[
 task('你在咖啡廳，需要 2 張餐巾紙和一些水。',[a(2,'Of course. Two napkins.','當然，2 張餐巾紙。',['2 張餐巾紙','2 個袋子'],'請求用品',{answer:'Excuse me. Could I have two napkins, please?'}),a(3,'Here you are.','給您。',['拿到水','拿到咖啡'],'再提出飲水需求')],'換到飯店大廳，袋子太重，請工作人員幫忙。','Excuse me. Could you help me with this bag, please?'),
 task('店員問你要不要再加咖啡，這次不需要。',[s(6,'Would you like some more coffee?','想再加些咖啡嗎？',['婉拒','接受'],'回應提供',{task:'你不需要更多咖啡，禮貌拒絕。'}),s(5,'Would you like some water?','需要一些水嗎？',['接受水','婉拒水'],'依自己的需要改回答',{task:'你想要水，接受對方的提供。'})],'咖啡這次想續杯，水不需要；用相反的回答。','Yes, please. Thank you. No, thank you. I’m okay.'),
 task('旅伴邀你今晚吃飯，你已有安排，想改明天。',[r(4,['今晚不能去','今晚可以去'],'回應今晚邀請'),s(8,'Are you busy tonight?','你今晚有事嗎？',['已有安排','還沒安排'],'說明理由',{task:'告訴對方你已經有安排。'}),a(9,'Tomorrow is fine.','明天可以。',['改成明天','仍是今晚'],'提出另一時間')],'換成今晚有空，你願意一起吃飯。','Yes, I’d love to.'),
 task('你不小心碰到旅伴，先道歉，確認對方是否還好，再提供幫忙。',[a(10,'Yes, I’m okay. Thank you.','我沒事，謝謝。',['對方沒事','對方說手臂痛'],'道歉與關心'),a(12,'Yes, thank you.','好，謝謝。',['接受幫忙','不需要幫忙'],'提出補救')],'換成你讓旅伴久等；道歉後，旅伴說沒關係，再交換角色回應。','I’m sorry to keep you waiting. That’s okay. No problem.')],
11:()=>[
 task('你在早餐桌遇到新旅伴，先介紹工作，再互相聊興趣。',[r(1,['老師','退休'],'自己的工作'),a(2,'I like reading.','我喜歡閱讀。',['閱讀','拍照'],'問旅伴興趣'),s(3,'How about you?','那你呢？',['自己喜歡拍照','自己喜歡閱讀'],'分享自己的興趣',{task:'你喜歡拍照，分享給旅伴。'})],'你已退休、喜歡閱讀；先回答，再問旅伴的工作。','I’m retired. I like reading. What do you do?'),
 task('你擅長拍照，旅伴擅長煮飯，互相分享。',[r(3,['自己擅長拍照','自己擅長煮飯'],'說自己的專長',{task:'你擅長拍照。',answer:P(5).en}),a(4,'I’m good at cooking.','我擅長煮飯。',['旅伴擅長煮飯','旅伴擅長拍照'],'問旅伴專長')],'交換角色，這次由你說擅長煮飯，再問對方。','I’m good at cooking. What are you good at?'),
 task('情境設定：星期六、6 月 12 日、9:30，下雨。確認出門資訊。',[r(4,['星期六','星期日'],'星期'),r(5,['6 月 12 日','6 月 13 日'],'日期'),r(6,['9:30','10:15'],'時間'),r(7,['下雨','晴天'],'天氣')],'換成星期日、6 月 13 日、10:15，晴天；互相問答。','What day is it today? It’s Sunday. What’s the date today? It’s June thirteenth. What time is it? It’s ten fifteen. What’s the weather like today? It’s sunny.'),
 task('你想去博物館，打算 10 點出發，和旅伴一起決定。',[r(8,['博物館','公園'],'想做的活動'),a(12,'At ten, please.','10 點，麻煩了。',['10:00','10:30'],'問出發時間'),a(13,'That sounds good.','聽起來不錯。',['約定 10 點出發','還沒決定'],'確認安排')],'換成去公園、10:30 出發。','I’d like to go to the park. What time would you like to leave? Let’s leave at ten thirty.'),
 task('你的手機不見了，旅伴關心發生什麼事。',[r(10,['說明手機不見','說明有點累'],'目前問題',{task:'你的手機不見了，說明狀況。',answer:P(16).en}),r(11,['手機不見','錢包不見'],'說清楚發生的事')],'換成錢包不見；再交換角色，問對方怎麼了。','I lost my wallet. What’s wrong? What happened?'),
 task('參觀完博物館，和旅伴分享感想。',[r(12,['覺得有趣','覺得無聊'],'自己的感想'),a(17,'I think it’s nice, but a little small.','我覺得不錯，但有點小。',['旅伴覺得不錯但有點小','旅伴覺得太大'],'問旅伴看法')],'改成你覺得不錯但有點小，再問對方。','I think it’s nice, but a little small. What do you think of the museum?')],
12:()=>[
 task('早上見到旅伴，先互相關心今天的精神。',[r(1,['自己很好','自己有點累'],'回應近況'),a(1,'I’m a little tired.','我有點累。',['旅伴有點累','旅伴很好'],'關心旅伴')],'改成你有點累，回答後也問對方。','I’m a little tired. How about you?'),
 task('你提議去博物館，旅伴同意，你打算待約 2 小時。',[a(3,'That sounds good. Let’s go!','聽起來不錯，走吧！',['同意去博物館','想改散步'],'提出活動'),r(4,['約 2 小時','約 1 小時'],'停留時間')],'改成提議散步，預計待約 1 小時。','How about taking a walk instead? For about one hour.'),
 task('你要去博物館，問交通方式、距離與車程。',[a(6,'We can take the bus.','我們可以搭公車。',['搭公車','走路'],'交通方式'),a(8,'About three kilometers.','約 3 公里。',['3 公里','3 分鐘'],'距離'),a(9,'About twenty minutes.','約 20 分鐘。',['20 分鐘','20 公里'],'車程')],'改成走路約 10 分鐘，自己問到交通方式與所需時間。','How do we get there? How long does it take?'),
 task('你在公車站，想知道班距和下一班還要等多久。',[a(10,'Every fifteen minutes.','每 15 分鐘一班。',['每 15 分鐘一班','下一班等 15 分鐘'],'班距'),a(11,'In five minutes.','再 5 分鐘就到。',['下一班等 5 分鐘','每 5 分鐘一班'],'等候時間')],'換成每 30 分鐘一班，下一班還有 10 分鐘；問對兩個問題。','How often does the bus run? How soon will the next bus arrive?'),
 task('2 位成人買票，每張 10 美元，確認張數與總價。',[a(13,'Ten dollars each.','每張 10 美元。',['單張 $10','總共 $10'],'單價'),s(15,'How many tickets would you like?','想買幾張票？',['2 張成人票','3 張成人票'],'票數',{task:'你們有 2 位成人。'}),a(16,'Twenty dollars in total.','總共 20 美元。',['總共 $20','總共 $10'],'總價')],'改成 3 位成人；先問旅伴需要幾張，再買票問總價。','How many tickets do we need? Three adult tickets, please. How much is it in total?')],
13:()=>[
 task('外面很熱，你想去博物館，向旅伴說明選擇與理由。',[r(1,['博物館','公園'],'選擇地點'),r(2,['因為外面太熱','因為喜歡樹木'],'說理由'),a(3,'Because I like art.','因為我喜歡藝術。',['旅伴喜歡藝術','旅伴喜歡樹木'],'也問旅伴原因')],'改成你選公園，因為喜歡樹木。','The park, please. Because I like trees.'),
 task('你提議搭公車，旅伴接受；接著練習回應別人的建議。',[a(6,'Sure. Why not?','好啊！',['同意搭公車','拒絕搭公車'],'提出交通建議'),s(9,'Why don’t we take a taxi?','我們搭計程車好嗎？',['同意計程車','想走路'],'回應另一個提議',{task:'這一輪你同意旅伴的提議。'})],'換成你累了，不想走路，提議改搭計程車。','I’m tired. Why don’t we take a taxi?'),
 task('走累了，你想提議休息，也能說明理由。',[a(11,'Why do you want to take a break?','你為什麼想休息？',['對方在問休息原因','對方在問交通方式'],'提議休息'),r(5,['因為累了','因為餓了'],'說出理由')],'改成你餓了，提議休息並說明原因。','Why don’t we take a break? Because I’m hungry.'),
 task('休息時有水和茶，先選自己的飲料，再問旅伴。',[r(6,['水','茶'],'選自己的飲料'),a(12,'Tea, please.','茶，謝謝。',['旅伴要茶','旅伴要水'],'問旅伴選擇')],'交換角色，這次你要茶。','Tea, please. Which one would you like?')],
14:()=>[
 task('和旅伴商量目的地，你想去海邊。',[r(1,['海邊','博物館'],'說出意願'),a(3,'We’re going to the beach.','我們要去海邊。',['已決定海邊','已決定博物館'],'確認安排')],'改成想去博物館，再確認最後去哪裡。','I’d like to go to the museum. Where are we going?'),
 task('今天的團體行程，9 點在飯店大廳集合出發。',[a(4,'In the hotel lobby.','在飯店大廳。',['飯店大廳','博物館入口'],'集合地點'),a(6,'At nine.','9 點。',['9:00','10:00'],'出發時間'),s(5,'Could you tell our friend?','可以告訴我們的朋友嗎？',['把正確地點與時間轉告旅伴','還沒有資訊'],'轉告旅伴',{task:'告訴旅伴集合地點和出發時間。',answer:'We meet in the hotel lobby. We leave at nine.'})],'改成 10 點在博物館入口集合，問清楚再轉告。','Where do we meet? When do we leave? We meet at the museum entrance. We leave at ten.'),
 task('你還想知道幾點回來，誰是今天的導遊。',[a(8,'At three in the afternoon.','下午 3 點。',['下午 3 點','上午 9 點'],'回程時間'),a(9,'Amy is our guide.','Amy 是我們的導遊。',['Amy','Ben'],'導遊姓名'),s(10,'Who is our guide?','誰是我們的導遊？',['Amy','Ben'],'轉告導遊姓名',{task:'旅伴沒聽清楚，告訴他是 Amy。'})],'改成導遊 Ben、下午 4 點回來；重新詢問。','When do we get back? Who is our guide? Ben is our guide.'),
 task('你和家人旅行，向新旅伴介紹自己從哪裡來、和誰同行。',[r(7,['台灣','東京'],'來自哪裡'),r(6,['和家人','和朋友'],'同行的人'),a(11,'I’m traveling with a friend.','我和朋友一起旅行。',['旅伴和朋友同行','旅伴和家人同行'],'也問對方')],'改成你和朋友旅行，來自台北。','I’m from Taipei. I’m traveling with a friend. Who are you traveling with?'),
 task('你沒聽清楚集合資訊，請旅伴重說，再把時間地點確認一次。',[a(13,'At nine, in the hotel lobby.','9 點，在飯店大廳。',['9 點・飯店大廳','10 點・博物館入口'],'請對方重說'),a(14,'Yes, that’s right.','對，沒錯。',['已確認時間地點','仍不確定'],'說回去確認')],'換成 10 點、博物館入口；別把上一輪的資訊照背。','Sorry, could you say that again? At ten, at the museum entrance. Is that right?')]
 };
 return scripts[day]();
}
module.exports={make,maps};
