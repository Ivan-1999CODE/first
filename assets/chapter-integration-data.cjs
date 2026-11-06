'use strict';
// Authored paths reuse current display labels, never the historical task IDs.
const clone=x=>JSON.parse(JSON.stringify(x));
const unique=(xs,key)=>[...new Map(xs.map(x=>[key(x),x])).values()];
module.exports=function makeChapterIntegration(d){
 const day=d.course.day;
 if(![1,2,3,4,5,6,7,9,11].includes(day))return null;
 const rounds=Object.fromEntries(d.rounds.map((r,i)=>[r.displayLabel||r.id,{...r,index:i}]));
 const s=(label,index,variant=0,patch={})=>{
  const r=rounds[label],f=d.flows[(r.flowIds||[r.index])[variant]];
  if(!f?.steps[index])throw Error(`Missing ${day}/${label}/${variant}/${index}`);
  const step=clone(f.steps[index]);
  delete step.sceneTitle;delete step.sceneContext;
  return {...step,source:label,sourceStepId:step.id,role:r.role||d.course.replyRole,...patch};
 };
 const all=(label,variant=0)=>d.flows[(rounds[label].flowIds||[rounds[label].index])[variant]].steps.map((_,i)=>s(label,i,variant));
 const changed=(step,replacements,patch={})=>{
  let json=JSON.stringify(step);for(const [from,to]of replacements)json=json.replaceAll(from,to);
  return {...JSON.parse(json),adapted:true,...patch};
 };
 const phase=(title,context,steps)=>steps.map((s,i)=>({...s,...i===0?{phase:title,phaseContext:context}:{}}));
 const path=(id,title,context,steps)=>({id,title,context,steps});
 const groups=[];
 const add=(id,title,sources,description,paths,outcome)=>groups.push({id,title,sources,description,paths,outcome});
 if(day===1){
  const repeatFor=label=>{const route=s(label,0);return changed(s('C',0),[['郵局','火車站']],{line:route.line,zh:route.zh,objects:clone(route.objects),valid:clone(route.valid),position:clone(route.position),choiceKind:'route',task:'剛才沒聽清楚去火車站的走法，請路人再說一次。'});};
  const repeat=repeatFor('A'),busRepeat=repeatFor('B');
  const busMap=changed(s('C',1),[['The post office','The train station'],['the post office','the train station'],['郵局','火車站']]);
  const map={...clone(busMap),line:'Here. The train station is on the right.',zh:'這裡，火車站在右邊。',valid:[0],position:[335,90,'已在地圖找到右側火車站']};
  add('route-help','問路時，聽不清楚也能確認',['A','C'],'同一個目的地，依需要請重說、看地圖，最後道謝。',[
   path('map','重聽並看地圖','你要去火車站，第一次沒聽清楚路線，手上有地圖。',[s('A',0),repeat,s('A',1),map,s('A',2)]),
   path('repeat','只需要再聽一次','你要去火車站，沒有地圖；重聽後確認方向再道謝。',[s('A',0),repeat,s('A',1),s('A',2)])],'問清去火車站的路線，聽不清楚時知道怎麼求助。');
  add('bus-help','問清搭公車的方法',['B','C'],'路人已知道目的地，將求助放在真正需要的地方。',[
   path('bus','請指路，再問公車','沿用 B 的起點去火車站。路人已知道目的地；你沒聽清楚走法，想看地圖，也想知道能不能搭公車。',[s('B',0),busRepeat,busMap,s('B',1),s('B',2)])],'確認路線、公車與站牌，禮貌結束問路。');
  add('journey','完成一次問路',['A','B','C'],'先說目的地，再依需求接續求助與交通詢問。',[
   path('bus','問路後考慮公車','你要去火車站；沒聽清楚時請重說，再看地圖，最後詢問能不能搭公車。',[s('A',0),repeat,s('A',1),map,s('B',1),s('A',2)])],'用同一條路線完成問路與交通詢問。');
 }
 if(day===2){
  const payment=(item,amount,bag=0)=>all('B',bag).map(t=>changed(t,[['杯子',item],['6 美元',amount+' 美元']],t.choiceKind==='cash-set'&&amount===4?{practiceReply:{line:'Four dollars in total. Thank you.',zh:'一共 4 美元，謝謝。'},objects:[['▣','1 美元加 1 美元加 1 美元加 1 美元'],['▣','5 美元加 1 美元']],choiceVisuals:[{type:'cash',values:[1,1,1,1]},{type:'cash',values:[5,1]}]}:{}));
  add('single','買一件商品並結帳',['A','B'],'價格、商品、付款與袋子都屬於同一筆購物。',[
   path('own-bag','自備袋子','你有 10 美元，想買眼前的杯子。帶了自己的袋子；聽清價格與付款規則再結帳。',[s('A',0),s('A',1),...payment('杯子',6)]),
   path('need-bag','需要袋子','你有 10 美元，想買眼前的杯子，也需要一個袋子。',[s('A',0),s('A',1),...payment('杯子',6,1)])],'完成一筆杯子的購物與付款。');
  add('water','買幾瓶水並結帳',['A','B'],'只計算這次買水的金額，不加入前一筆杯子。',[
   path('three','買水，自備袋子','你想買 3 瓶水，有足夠現金，也自備袋子。先詢問總價，再結帳。',[s('A',2),s('A',3),...payment('這 3 瓶水',6)]),
   path('bag','買水，需要袋子','你想買 3 瓶水，有足夠現金，需要袋子。先詢問總價，再結帳。',[s('A',2),s('A',3),...payment('這 3 瓶水',6,1)])],'確認數量與總價，完成這一筆買水的交易。');
  const price=changed(s('A',0),[['It’s six dollars.','It’s twelve dollars.'],['這個 6 美元','這個 12 美元'],['6 美元','12 美元']]);
  const budget=s('C',0,0,{carryHeard:true,line:price.line,zh:price.zh});
  const buy=changed(s('A',1),[['6 美元','4 美元'],['杯子','磁鐵']],{task:'替代的磁鐵符合你的預算，告訴店員你決定買這個。'});
  add('budget','超出預算，換商品再結帳',['A','C','B'],'問價後先判斷預算，換成可負擔的商品再付款。',[
   path('magnet','換成便宜的小禮物','你想買一份小禮物，預算 10 美元。先問杯子價格；若超出預算就找便宜商品，決定購買後再結帳。',[price,budget,s('C',1),buy,...payment('磁鐵',4)])],'原杯子 12 美元；改買 4 美元磁鐵，付款沿用 4 美元。');
 }
 if(day===3){
  const depart=v=>[...all('A',v),...all('B')];
  const arrive=[...phase('入境查驗','飛機已抵達。現在和入境官員說話。',all('C')),...phase('海關詢問','完成入境查驗後，轉到海關，向另一位官員說明攜帶的餅乾。',all('D'))];
  add('departure','報到到確認登機門',['A','B'],'同一位旅客、同一班機，完成出發準備。',[
   path('aisle','選靠走道','你在航空公司櫃檯，要託運 1 件行李、坐靠走道；報到後問登機門，沒聽清楚再問。',depart(0)),
   path('window','選靠窗','你在航空公司櫃檯，要託運 1 件行李、坐靠窗；報到後問登機門，沒聽清楚再問。',depart(1))],'辦好報到，確認座位與登機門。');
  add('arrival','抵達後，完成入境與海關詢問',['C','D'],'分成兩個查驗環節，換對象時清楚提示。',[
   path('arrival','入境與海關兩幕','你來度假 7 天，住 Sunny Hotel，帶了一些餅乾。先回答入境問題，再向海關說明物品。',arrive)],'說清旅行資料與攜帶物品，依官員指示出示；不代表已核准入境或通關。');
  add('journey','一次飛行的出發與抵達',['A','B','C','D'],'同一次旅程分幕完成，不把不同官員當成同一人。',[
   path('journey','從出發到抵達','你要託運 1 件行李、坐靠走道；抵達後度假 7 天、住 Sunny Hotel，帶了一些餅乾。',[
    ...phase('出發機場','先和航空公司地勤完成報到與登機門詢問。',depart(0)),...arrive])],'分別完成出發準備、入境問答與海關物品詢問。');
 }
 if(day===4){
  add('rail','買好火車票，找到月台',['A','B','C'],'同一張車票的目的地與票種一路沿用。',[
   path('single','購買單程票','你要 1 張到 Central Station 的單程票。買票時問價格與刷卡，買好後向站務人員問發車時間和月台。',[...all('A'),...all('B'),...phase('買好車票後','車票已買好，出示同一張票，接著詢問搭車資訊。',all('C'))]),
   path('return','購買來回票','你要 1 張到 Central Station 的來回票，請聽售票員報價。問刷卡後買好票，再詢問去程時間與月台。',[...all('A',1),...all('B').map(t=>changed(t,[['單程','來回']])),...phase('買好車票後','來回票已買好，現在問去程列車的資訊。',all('C'))])],'買到需要的票，確認出發時間與月台。');
  add('bus','搭對公車，知道在哪裡下車',['E','F'],'從候車到車上，沿用同一個目的地。',[
   path('market','前往 River Market','你要去 River Market。先問車號、確認眼前公車有到；上車後和司機核對目的地並問下車站。',[...all('E'),...phase('上車後','你已搭上剛才確認的那班車，司機和你核對目的地。',all('F'))]),
   path('correct','上車後更正目的地','你已搭上確認會到 Central Station 的公車。司機誤以為你去 River Market，請更正，再問下車站。',all('F',1))],'確認公車與目的地；司機說錯時能更正。');
 }
 if(day===5){
  add('taxi','搭計程車到目的地',['B','D'],'上車時說需求，接近目的地時再說下車位置。',[
   path('museum','到博物館入口下車','你在計程車排班區，想去博物館。問清車程與車資；接近目的地時，指定入口並請司機停車。',[...all('B'),...phase('接近目的地','車已快到博物館，你想在入口下車。',all('D'))])],'說清目的地，理解車程車資，在入口下車。');
  add('uber','找到預約車，再指定下車處',['C','D'],'預約行程已有目的地，接車與下車分成兩幕。',[
   path('hotel','從飯店入口出發','你已預約 Uber 去博物館，在飯店入口外等車。先聯絡說明等車位置，車到、見面後確認司機再上車；抵達時請在博物館入口停車。',[...all('C').map(t=>({...t,integrationRecordIndex:t.recordIndex})),...phase('抵達博物館附近','你已搭上預約車，現在接近博物館入口。',all('D'))])],'先說清等車位置，見面後確認預約司機，再指定下車位置。');
 }
 if(day===6){
  add('simple','從看菜單到完成簡餐點餐',['B','A','F'],'同一張菜單，先爭取時間，再請推薦與點餐。',[
   path('time','還沒準備好','你和旅伴還在看菜單，需要一點時間。稍後請店員推薦主餐，點雞肉三明治，選內用並結束點餐。',[...all('B'),...phase('稍後店員回來','你準備好請店員推薦，接著點主餐。',all('A')),...all('F')]),
   path('ready','已準備好詢問','你準備好請店員推薦主餐，想點雞肉三明治帶去公園吃，不再加點。',[...all('A'),...all('F',1)])],'說出餐點與用餐方式，結束這次點餐。');
  // Keep old ice/sugar/finish goal and question IDs when inserting two exchanges.
  const mealWithDrink=variant=>[...all('A'),...all('C',variant).map(t=>({...t,integrationRecordIndex:t.recordIndex<2?t.recordIndex+2:t.recordIndex+4})),...all('F',variant).map((t,i)=>({...t,integrationRecordIndex:i+4}))];
  add('drink','主餐加飲料，說清楚偏好',['A','C','F'],'點好雞肉三明治後，答應升級成含飲料的套餐、選茶，再確認冰糖並結束點餐。',[
   path('none','不加冰、不加糖','你想點雞肉三明治。店員詢問套餐時，答應升級並選茶；茶不要冰、不要糖，最後選內用並表示不再加點。',mealWithDrink(0)),
   path('less','少冰、少糖','你想點雞肉三明治。店員詢問套餐時，答應升級並選茶；茶少冰、少糖，餐點與茶都要外帶，而且不再加點。',mealWithDrink(1))],'完成雞肉三明治套餐點餐，選好茶並說清楚冰糖需求。');
  add('steak','牛排配蛋，確認做法後結束點餐',['D','F'],'已選牛排配蛋，這一組不加入三明治。',[
   path('steak','選喜歡的做法','你已點好牛排配蛋，也已告知內用。回答熟度與蛋的做法，最後表示不再加點。',[...all('D'),s('F',1)])],'選擇自己喜歡的熟度與蛋料理，結束點餐。');
  const toast=changed(s('A',1),[['a chicken sandwich','the egg toast'],['雞肉三明治','蛋吐司']],{adaptationNote:'沿用 I’d like …, please.，這次把餐點換成蛋吐司。'});
  const confirm=changed(s('E',2),[['eight dollars fifty','seven dollars fifty'],['8 美元 50 分','7 美元 50 分'],['8.50','7.50'],['18.50','17.50']],{task:'蛋吐司已點好；你想再確認這筆訂單是不是 7 美元 50 分。'});
  const again=changed(s('E',3),[['Eight dollars fifty','Seven dollars fifty'],['8 美元 50 分','7 美元 50 分'],['8.50','7.50'],['18.50','17.50']]);
  add('budget','依預算選餐，確認同一筆金額',['E','A','F'],'替代餐點、訂單與帳單一致；另一筆帳單另開情境。',[
   path('toast','預算內選餐','你有 10 美元，先詢問眼前餐點的價格。超出預算就找便宜餐點，選蛋吐司外帶、不再加點；最後核對這筆金額。',[s('E',0),s('E',1),toast,...all('F',1),confirm,again]),
   path('bill','只練另一筆帳單','這是另一筆已完成的訂單，和蛋吐司無關。環境很吵，你剛聽到似乎是 8 美元 50 分，請確認並重聽。',[s('E',2),s('E',3)])],'蛋吐司訂單沿用 7.50 美元；8.50 美元帳單分次練。');
 }
 if(day===7){
  add('find','找到衣服，準備試穿',['A','B'],'主動問或由店員詢問，選一個起點接話。',[
   path('ask','主動問尺寸','你想找 T-shirt，手上這個款式想要 M 號；找到後問能不能試穿及試衣間位置。',[s('A',0),s('A',1),...all('B')]),
   path('reply','店員問尺寸和顏色','你想找 T-shirt，穿 M 號、喜歡藍色；由店員詢問，拿到後準備試穿。',[s('A',0),s('A',4),s('A',5),...all('B')]),
   path('other','拿著衣服問其他選擇','你拿著紅色 L 號上衣，想問其他尺寸和顏色；拿到藍色 M 號後準備試穿。',[s('A',2),s('A',3),...all('B')])],'取得需要的衣服，問清試穿許可與位置。');
  const fit=small=>[...phase('試穿後',small?'你試穿 S 號，覺得太小。':'你試穿 L 號，覺得太大。',[s('C',small?0:2),s('C',small?1:3)]),...phase('換穿 M 號後','換來的 M 號剛好合身。',[s('C',5)]),s('D',1)];
  add('fit','試穿、換尺寸，再決定購買',['B','C','D'],'太小與太大分次練，每次只走一條尺寸變化。',[
   path('small','這件太小','你已拿到一件 S 號上衣，先問試穿。穿後太小，換 M 號後合身，決定買下。',[...all('B'),...fit(true)]),
   path('big','這件太大','你已拿到一件 L 號上衣，先問試穿。穿後太大，換 M 號後合身，決定買下。',[...all('B'),...fit(false)]),
   path('suggestion','接受店員建議','你已告訴店員 S 號太小。店員主動建議換大，你接受；換穿後合身，決定購買。',[s('C',4),s('C',5),s('D',1)])],'把不合身的衣服換到適合尺寸，再做購買決定。');
  add('journey','從進店到買下衣服',['A','B','C','D'],'每次保持同一件衣服與一致的試穿進度。',[
   path('one','選好、試穿、買下','你想找藍色 M 號 T-shirt。取得後先試穿，這件合身，你決定買下。',[s('A',0),s('A',4),s('A',5),...all('B'),s('C',5),s('D',1)]),
   path('compare','試穿後比較兩個顏色','你想找 M 號 T-shirt，拿到藍色和綠色各一件，準備試穿。兩件都合身，你比較喜歡藍色。',[s('A',0),s('A',1),...all('B'),...phase('兩件都試穿後','你已分別試過藍色與綠色 M 號，兩件都合身。',[s('C',5),...all('D')])])],'完成找衣服、試穿與購買；比較前先交代兩件都已試過。');
 }
 if(day===9){
  add('reservation','訂一張桌，依狀況調整',['A','B'],'新訂、客滿、改訂與不訂，各有清楚的起點與結果。',[
   // Keep the saved name step at index 2; the inserted time step uses a new ID.
   path('normal','正常訂位','你想訂明晚 7 點的兩人桌，姓名 Alex Chen。餐廳有空位。',[s('A',0),s('A',1),s('A',2,0,{integrationRecordIndex:3}),s('A',3,0,{integrationRecordIndex:2})]),
   path('later','接受另一個時間','你想訂今晚兩人桌，先問 7 點有沒有位置。你可以接受 7 點半；確認時間後留下 Alex Chen 的姓名。',[s('A',0),s('B',0),s('B',1),s('A',3)]),
   path('change','更改已有訂位','餐廳已找到 Alex Chen 今晚 7 點的兩人訂位。你想改成 6 點半。',[s('B',2)]),
   path('decline','時間不合，暫時不訂','餐廳知道你今晚要兩人桌，現在告訴你剩餘時段。你最晚只能 8 點用餐，請依回覆決定是否預訂。',[s('B',3)])],'每次只處理一筆訂位；暫時不訂不等於取消原訂位。');
  add('tickets','買好門票，確認入場與付款',['C','D'],'同一組成人與兒童票，張數、總價與付款一致。',[
   path('family','2 位成人與 1 位兒童','你們是 2 位成人與 1 位兒童。先問成人票價，說明張數，再問總價、入場時間與刷卡，最後選擇刷卡。',[...all('C'),...all('D')])],'買票需求是 2 張成人票與 1 張兒童票，總價 25 美元。');
 }
 if(day===11){
  const meet=[...all('A'),...all('C')];
  const interests=[s('B',0),s('B',2,0,{carryHeard:true}),s('B',1)];
  add('meet','初次認識旅伴',['A','C'],'在同一張早餐桌，聊來處、同行者與是否來過。',[
   path('first','你是第一次來','早餐時認識新旅伴。你來自臺灣、和家人同行，第一次來這座城市；對方以前來過。',meet),
   path('again','你以前來過','早餐時認識新旅伴。你來自臺灣、和家人同行，以前來過；對方第一次來。',[...all('A'),...all('C',1)])],'分享自己的旅行資料，也把問題問回去。');
  add('journey','完整聊天：從早餐到參觀後',['A','C','B'],'早餐聊天與參觀後分享分成兩幕。',[
   path('day','早餐與參觀後','早餐認識旅伴：你來自臺灣、和家人同行、第一次來，喜歡拍照。稍後你們都參觀了博物館，覺得很棒，也覺得人很多。',[...phase('早餐時','你們剛認識，先聊旅行資料和興趣。',[...meet,...interests]),...phase('參觀博物館後','兩人都已參觀完，現在才分享這次感想。',[s('B',3),s('B',4)])])],'同一位旅伴，在不同時點聊適合當下的內容。');
 }
 for(const g of groups){
  g.storageKey=`travel-lab-en-day${day}-chapter-${g.id}-v1`;
  g.sections=['先試完整情境','整理聽說句子','連起來完成任務','看情境，自己選用','和老師完整接話','看看整體進步','課後再用一次'];
  g.checkpoint=g.paths[0].context;
  g.paths.forEach(p=>{
   p.steps=p.steps.map((t,i)=>({...t,id:`ci-d${day}-${g.id}-${p.id}-${t.integrationRecordIndex??i}`,label:t.label||t.task,phase:t.phase||'',choiceReview:{...t.choiceReview,reason:t.choiceReview?.reason||'依本次對話與條件操作。'}}));
   p.steps.forEach((t,i)=>{if(t.carryHeard&&(!i||p.steps[i-1].line!==t.line))throw Error('Invalid carry '+t.id);});
   p.role=unique(p.steps.map(s=>s.role),x=>x).join('／');
   p.goals=p.steps.map(t=>({id:t.id,text:t.label}));
  });
  if(day===2&&['single','water'].includes(g.id)){
   g.studyDifference='前面的購物與付款說法相同；這兩個情境換的是袋子回答。';
   for(const p of g.paths)p.studyFocusStepId=p.steps.at(-1).id;
  }
  g.questions=unique(g.paths.flatMap(p=>p.steps.map(t=>({id:t.id,pathId:p.id,context:p.context,prompt:t.task,step:t}))),q=>q.prompt+'|'+q.step.answer);
  g.skills=[{id:'needs',text:'我能說清楚這次的需求與資料。'},{id:'listen',text:'我能聽懂關鍵資訊，需要時再確認。'},{id:'connect',text:'我能依當下情境接話，完成這段溝通。'}];
  g.words=unique(g.sources.flatMap(l=>rounds[l].words||[]),x=>JSON.stringify(x));
  g.studyChanges=unique(g.sources.flatMap(l=>rounds[l].studyChanges||[]),x=>JSON.stringify(x));
  for(const p of g.paths)for(const t of p.steps){
   const phrase=d.phrases.find(p=>p.en===t.answer);
   t.phrase=phrase?clone(phrase):{id:t.id+'-phrase',use:t.label,en:t.answer,zh:t.answerZh};
   if(t.adaptationNote)t.phrase.note=t.adaptationNote;
  }
 }
 return {version:1,day,groups,sourceTasks:d.rounds.map(r=>({label:r.displayLabel||r.id,name:r.name})),excludedDays:[8,10,12]};
};
