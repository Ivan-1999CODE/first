// Additional authored routes; keep the original tasks and check-in records intact.
module.exports = function buildCompleteHotel(data) {
 const copy=x=>JSON.parse(JSON.stringify(x));
 const sources={};
 for(const r of data.rounds){const label=r.displayLabel||r.id;sources[label]=[data.flows[r.flowIds[0]].steps,r.variation.steps,...(r.additionalVariations||[]).map(v=>v.steps)].flat().map(s=>({...s,source:label}));}
 const take=(source,answer,line)=>{
  const s=sources[source].find(s=>s.answer===answer&&(!line||s.line===line));
  if(!s)throw Error('Missing taught Day 8 expression: '+answer+' / '+line);
  // Keep the night pictures when copying Task B into chapter routes and reviews.
  // Variations may reverse the option order, so derive each count from its option.
  const nightChoices=source==='B'&&s.label==='確認晚數'?{
   pictureChoices:true,
   choicePrompt:sources.B.find(step=>step.choiceVisuals?.some(v=>v.type==='nights')).choicePrompt,
   choiceVisuals:s.objects.map(o=>({type:'nights',count:Number(o[1].match(/\d+/)[0])}))
  }:{};
  return {source,label:s.label,answer:s.answer,answerZh:s.answerZh,line:s.line,zh:s.zh,words:s.words,askFirst:s.askFirst,task:s.task,options:s.objects.map(o=>o[1]),valid:copy(s.valid),...nightChoices};
 };
 const bank=[];
 for(const [source,ss] of Object.entries(sources))for(const s of ss){if(!bank.some(t=>t.source===source&&t.answer===s.answer&&t.line===s.line))bank.push({...take(source,s.answer,s.line),id:'bank-'+source+'-'+bank.filter(t=>t.source===source).length});}
 const say={
  checkin:take('A','I’d like to check in, please.'),name:take('A','I have a reservation under Alex Chen.'),jamie:take('A','I have a reservation under Jamie Lin.'),
  passport:take('B','Here is my passport.'),nights:take('B','I’m staying for two nights.'),three:take('B','I’m staying for three nights.'),
  breakfast:take('C','Is breakfast included?'),checkout:take('C','What time is check-out?','Check-out is at eleven.'),noon:take('C','What time is check-out?','Check-out is at twelve.'),
  elevator:take('C','Where is the elevator?','On your left.'),right:take('C','Where is the elevator?','On your right.'),
  room:take('D','This is room three oh five.'),room512:take('D','This is room five one two.'),towels:take('D','Could I have two extra towels, please?'),towel:take('D','Could I have one extra towel, please?'),
  water:take('D','Could I have some water, please?','Some water for room three oh five.'),water512:take('D','Could I have some water, please?','Some water for room five one two.'),
  blanket:take('D','Could I have an extra blanket, please?','An extra blanket for room three oh five.'),blanket512:take('D','Could I have an extra blanket, please?','An extra blanket for room five one two.'),
  food:take('E','I’d like a club sandwich, please.'),price:take('E','How much is it in total?','Twenty dollars in total.'),price25:take('E','How much is it in total?','Twenty-five dollars in total.'),
  wait:take('E','How long will it take?','About twenty minutes.'),fast:take('E','How long will it take?','About ten minutes.'),yes:take('E','Yes, please.'),no:take('E','No, thank you.'),
  ac:take('F','The air conditioner isn’t working.'),tv:take('F','The TV isn’t working.'),check:take('F','Could someone come and check it, please?')
 };
 const step=(key,phase,extra={})=>({...copy(say[key]),id:key,phase,...extra});
 const decide=(phase,price,minutes,allowed=[0,1],reason='依自己的需要決定；接受或婉拒都可以。')=>({
  ...step('yes',phase),id:'decision',label:'表達最後的訂餐決定',task:'聽懂最後的確認，依這次條件決定，再用英文回答。',allowed,reason,
  decisions:[
   {label:'確認訂餐',answer:say.yes.answer,answerZh:say.yes.answerZh,words:say.yes.words,result:`已訂三明治：${price} 美元，約 ${minutes} 分鐘`,ordered:true},
   {label:'暫時不訂',answer:say.no.answer,answerZh:say.no.answerZh,words:say.no.words,result:'已婉拒，沒有送出餐點訂單',ordered:false}
  ],options:[],valid:[]
 });
 const flow=(id,title,context,facts,steps)=>({id,title,context,facts,steps:steps.map((s,i)=>({...s,id:s.id+'-'+i}))});
 const stayFlows=[
  flow('supplies-call','一通電話，補齊用品','你住 305 號房，兩人都需要乾淨毛巾，也想喝水。報房號後，提出這次的兩項需求，核對送到哪間房與數量。',['房號：305','需要：2 條毛巾、一些水'],[step('room','客房用品電話'),step('towels','客房用品電話'),step('water','客房用品電話')]),
  flow('meal-before-leaving','出門前，先問再決定','你住 305 號房，想問一份三明治。餐費上限 25 美元，而且必須在 15 分鐘內收到。先取得價格和時間，再決定是否訂餐。',['房號：305','餐費上限：25 美元','必須在 15 分鐘內收到'],[step('room','客房餐點電話'),step('food','客房餐點電話'),step('price','客房餐點電話'),step('wait','客房餐點電話'),decide('客房餐點電話',20,20,[1],'20 分鐘超過這次可等的 15 分鐘；本情境要婉拒，訂單不送出。')]),
  flow('room-comfort','電視沒反應，房間也需要棉被','你住 512 號房，電視不能運作，也需要一條額外棉被。先說清楚房號，再請飯店處理兩件事。',['房號：512','電視不能運作','需要：1 條額外棉被'],[step('room512','客房協助電話'),step('tv','客房協助電話'),step('check','客房協助電話'),step('blanket512','客房協助電話')])
 ];
 const chapterFlows=[
  flow('whole-visit','從入住到房內生活','你用 Alex Chen 訂房，住 2 晚。完成入住、確認住宿資訊後，入住 305 號房。先要毛巾和水，再詢問餐點；稍後發現冷氣不能運作，向櫃檯求助。可分段練習，每段都沿用同一筆資料。',['訂房：Alex Chen，2 晚','入住後房號：305','用品：2 條毛巾、一些水','訂餐：預算 25 美元，可等 30 分鐘'],[
   ...['checkin','name','passport','nights','breakfast','checkout','elevator'].map(k=>step(k,'第一段 · 入住櫃檯')),
   ...['room','towels','water'].map(k=>step(k,'第二段 · 入住 305，致電要用品')),
   ...['room','food','price','wait'].map(k=>step(k,'第三段 · 另一通電話，詢問餐點')),decide('第三段 · 客房餐點',20,20),
   ...['room','ac','check'].map(k=>step(k,'第四段 · 稍後發現設備問題，再致電櫃檯'))
  ]),
  flow('changed-booking','換訂房資料，也能接下去','訂房姓名是 Jamie Lin，住 3 晚。完成入住、問清退房時間及電梯後，入住 512 號房。進房後需要水和棉被，並發現電視不能運作。',['訂房：Jamie Lin，3 晚','入住後房號：512','需要：水、1 條額外棉被','電視不能運作'],[
   ...['checkin','three','passport','jamie','noon','right'].map(k=>step(k,'第一段 · 櫃檯先問晚數')),
   ...['room512','water512','blanket512','tv','check'].map(k=>step(k,'第二段 · 入住 512，致電請求協助'))
  ])
 ];
 const q=(id,title,context,known,keys,check,hint)=>({id,title,context,known,steps:keys.map(k=>step(k,'這次的說法')),check,hint});
 const stayQuestions=[
  q('two-needs','兩個人都需要用品','你住 305 號房。兩人洗完澡後，各需要一條乾淨毛巾，也想喝水。向接線人員提出這次需求。',['對方尚不知道房號','毛巾和水可以分句說，也可以先說其中一項'],['room','towels','water'],'房號是 305；要的是 2 條毛巾和一些水。兩項需求的順序都合理。','先讓飯店知道送到哪裡，再說清楚品項和數量。'),
  q('room-already-known','對方已知道房號','你剛向飯店報過 512 號房，對方已確認。現在發現房裡沒有飲用水，也需要一條額外棉被。接下來怎麼說？',['512 號房已確認','目前還沒提出用品需求'],['water512','blanket512'],'能提出水和棉被的需求；不必為了照劇本再報一次房號。','找出已完成和還沒完成的事項；先提出哪項用品都可以。'),
  q('price-known','已知道價格，還缺什麼？','你已詢問三明治，知道總價是 20 美元。你必須在 15 分鐘內拿到餐點，還不知道要等多久。請先問缺少的資訊。',['餐點和價格已確認','尚未送出訂單'],['wait'],'能詢問等候時間；聽到 20 分鐘後，再用已學的 No, thank you. 婉拒。','已知價格不用重問。先取得時間，才能做最後決定。'),
  q('within-budget','時間可以，價格也可以','你住 305 號房，想訂的三明治總共 25 美元，約 10 分鐘送到；符合你的預算與時間。接線人員問要不要訂，你會怎麼回答？',['這一回你想訂餐','仍要最後確認才送出訂單'],['yes'],'清楚表示接受。若改變心意，可以婉拒；老師確認這是你的實際決定，不要求唯一逐字答案。','這次已取得必要資訊，回應對方最後的確認。'),
  q('tv-and-blanket','兩件不同的事','你住 512 號房。電視不能運作，而且你需要一條額外棉被。飯店已知道房號，請說明並請求協助。',['房號已確認','設備問題與用品需求要分清楚'],['tv','check','blanket512'],'有說明電視問題、請人查看、提出棉被需求；請人查看前先讓對方知道是哪個設備。','一件事是要物品，另一件事是請人處理問題。'),
  q('one-towel','依新的需要調整','你住 305 號房，房內已有一條乾淨毛巾，另一位旅伴還缺一條。對方問房號，接著等你提出需求。',['這次只需要再拿 1 條','不要沿用前一題的 2 條'],['room','towel'],'報對房號，只要求再拿 1 條毛巾。','看這次還缺多少，不要把上一題的數量照搬。')
 ];
 const chapterQuestions=[
  q('at-counter','在櫃檯，先處理眼前的事','你用 Jamie Lin 訂房，住 3 晚。你已提出入住，櫃檯先請你出示護照，再問晚數和訂房姓名。請依實際問題接話。',['已提出入住需求','尚未拿到房卡'],['passport','three','jamie'],'回應當下問題，使用 Jamie Lin 和 3 晚；不因順序不同而從頭重背。','聽對方現在問什麼，再看訂房資料。'),
  q('upstairs-next','從櫃檯到房間','你已完成入住，知道退房時間是 12 點，但不知道電梯在哪。抵達 512 號房後，你需要飲用水。請分別說出在櫃檯與房內電話會用的說法。',['入住和退房時間已確認','到了房間才打電話要水'],['right','room512','water512'],'先詢問電梯；換成房內電話時，讓接線人員知道 512 號房，再要水。','換了情境與對話對象，需要重新提供哪項資訊？'),
  q('breakfast-and-room','兩個時點，不同需求','入住櫃檯還沒說明早餐是否包含。你確認後入住 305 號房，稍後發現冷氣不能運作。請把這兩段需要的說法分開練。',['第一段在櫃檯問住宿資訊','第二段是房內致電求助'],['breakfast','room','ac','check'],'先確認早餐；後來的電話有房號、設備問題與查看需求。','先辨認目前在哪個時點，別把訂房姓名當作房號。'),
  q('meal-vs-stay','住宿晚數和等候時間不同','你住 3 晚，已入住 305 號房。現在詢問餐點，對方說約 20 分鐘。你必須在 15 分鐘內拿到餐點；對方最後詢問是否訂餐。',['住宿晚數已確認','餐費符合預算，但等候時間超過限制'],['no'],'依等候時間婉拒，沒有送出餐點訂單；不把住宿的 3 晚當成這題要回的資料。','現在是在做訂餐決定，留意分鐘數和時間限制。'),
  q('missing-room','飯店需要知道你在哪裡','你用 Alex Chen 訂房，現在已入住 305 號房。你向飯店說電視壞了，但對方還不知道是哪一間房。請補上缺少的資料，再請人查看。',['設備是電視，已說明','對方尚未確認房號'],['room','check'],'補充 305 號房並請人查看；提供訂房姓名不能取代送服務所需的房號。','這通電話要讓服務人員找到哪一間房？'),
  q('two-calls','不同電話，資料要接得上','你已入住 512 號房。第一通電話要水和棉被；第二通電話問三明治的總價與等候時間，尚未決定要不要訂。請分兩段完成。',['兩通電話都使用 512 號房','先詢價和問時間，之後才做最後決定'],['room512','water512','blanket512','food','price','wait'],'兩段使用同一房號，用品與餐點需求清楚；價格和時間都取得後才做決定。','換到另一位接線人員時，可先報房號。不要在問完條件前假設訂單已送出。')
 ];
 stayQuestions.find(q=>q.id==='price-known').cue=copy(say.wait);
 stayQuestions.find(q=>q.id==='price-known').steps.push(step('no','聽完再做決定'));
 function mission(id,title,context,facts,keys,guide,extra={}){
  const steps=keys.map((k,i)=>({...step(k,'老師接話'),id:k+'-'+i}));
  return {id,title,context,facts,opening:'你好，我想請你幫忙。',first:'學生',steps,guide,goals:steps.map(s=>({id:s.id,text:s.label,stepId:s.id})),...extra};
 }
 const stayMissions=[
  mission('supply-order','用品需求，自己安排順序','你住 305 號房，需要 2 條毛巾和一些水。讓飯店知道要送什麼、送到哪裡。',['305 號房','2 條毛巾、一些水'],['room','towels','water'],'學生先報房號就不要再問。毛巾和水先提哪一項都可以；回應與房號、數量保持一致。',{opening:'你好，這裡是 305 號房。'}),
  mission('problem-and-need','電視問題和棉被需求','你住 512 號房，電視不能運作，需要請人查看；同時想要一條額外棉被。',['512 號房','電視不能運作','1 條額外棉被'],['room512','tv','check','blanket512'],'確認房號後，依學生先提出的需求接話。請人查看前須說明設備；棉被可以先提出或後提出。',{opening:'你好，這裡是 512 號房。'}),
  mission('dinner-decision','問清條件，再做決定','你住 305 號房，想問一份三明治。預算 25 美元，必須在 15 分鐘內收到。取得資訊後表達你的決定。',['305 號房','預算 25 美元','必須在 15 分鐘內收到'],['room','food','price','wait','no'],'這回餐點是 20 美元、20 分鐘。時間超過限制，學生應婉拒；接著表示收到，沒有送出訂單。價格和時間的提問順序可以交換。',{opening:'你好，這裡是 305 號房。'}),
  mission('fast-dinner','條件改變，重新決定','你住 305 號房，想訂一份三明治，預算 25 美元、可等 15 分鐘。老師提供新的價格和時間後，請做決定。',['305 號房','預算 25 美元、可等 15 分鐘'],['room','food','price25','fast','yes'],'這回是 25 美元、10 分鐘，符合條件。接受或改變心意婉拒都可；依學生最後決定確認有沒有送出訂單。',{opening:'你好，這裡是 305 號房。',flexibleDecision:true})
 ];
 const chapterMissions=[
  mission('arrive-and-help','完成入住，再處理房內問題','用 Jamie Lin 訂房、住 3 晚。入住時確認早餐、退房和電梯；進入 512 號房後，電視不能運作，也需要水和棉被。分成櫃檯與房內電話兩段。',['Jamie Lin，3 晚','入住後 512 號房','水、棉被；電視不能運作'],['checkin','jamie','passport','three','breakfast','noon','right','room512','water512','blanket512','tv','check'],'櫃檯可先問晚數；已提供的資料不重問。資訊為早餐包含、12 點退房、電梯右邊。入住完成後宣布進入 512 號房，再切換房內電話。',{opening:'你好，我想辦理入住。',breakAt:7}),
  mission('stay-and-dine','入住後，安排客房用餐','用 Alex Chen 訂房、住 2 晚。確認住宿資訊後入住 305 號房，需要 2 條毛巾，也想詢問三明治。餐費上限 25 美元，可等 30 分鐘。',['Alex Chen，2 晚','入住後 305 號房','2 條毛巾；想詢問三明治'],['checkin','name','passport','nights','breakfast','checkout','elevator','room','towels','food','price','wait','yes'],'先完成入住，再切到房內電話。餐點 20 美元、20 分鐘；接受或婉拒都可，但要先取得價格和時間。只在學生明確接受後確認訂單。',{opening:'你好，我想辦理入住。',breakAt:7,flexibleDecision:true}),
  mission('whole-chapter','完整住宿，依事件接話','你用 Alex Chen 訂房、住 2 晚。完成入住與住宿資訊確認後，入住 305 號房。需要毛巾和水、想詢問餐點，稍後也發現冷氣故障。依每段事件和老師接話。',['Alex Chen，2 晚','入住後 305 號房','餐費上限 25 美元，可等 30 分鐘'],['checkin','name','passport','nights','breakfast','checkout','elevator','room','towels','water','food','price','wait','yes','ac','check'],'分三段：櫃檯入住 → 房內用品與餐點 → 稍後的冷氣問題。早餐包含、11 點退房、電梯左邊；餐點 20 美元、20 分鐘。已確認資料可直接沿用；訂餐接受或婉拒都合理。設備故障出現後，再讓學生說明並請人查看。',{opening:'你好，我想辦理入住。',breakAt:7,flexibleDecision:true})
 ];
 for(const m of [...stayMissions,...chapterMissions]){
  for(const g of m.goals){const s=m.steps.find(s=>s.id===g.stepId);if(s.source==='C')g.text=({breakfast:'確認是否包含早餐',checkout:'取得退房時間',noon:'取得退房時間',elevator:'確認電梯位置',right:'確認電梯位置'})[s.id.replace(/-\d+$/,'')]||g.text;if(['yes','no'].includes(s.id.replace(/-\d+$/,'')))g.text='依條件清楚表達最後的訂餐決定';}
 }
 const skill=(id,text)=>({id,text});
 const sections=['先試完整情境','需要時查說法','連起來完成任務','情境變了，自己說','和老師自由接話','看看整體進步','課後換情境再用'];
 return {bank,sources:Object.fromEntries(data.rounds.map(r=>[r.displayLabel||r.id,r.name])),groups:[
  {id:'stay',title:'處理住宿需求',sourceLabels:['D','E','F'],storageKey:'travel-lab-en-day8-integrated-stay-v1',sections,
   intro:'用品、餐點和設備問題放在同一段住宿生活裡，依需要選用學過的說法。',
   checkpoint:'你住 305 號房，需要 2 條毛巾和一些水。你也想詢問一份三明治，預算 25 美元，必須在 15 分鐘內收到；最後發現冷氣不能運作，需要請人查看。請分段向飯店提出需求，取得資訊後再做訂餐決定。',
   checkpointGuide:'餐點總價 20 美元、約 20 分鐘，因此這次應婉拒。師生可分段完成；房號、需求與時間限制保持相同。',
   checkpointKeys:['room','towels','water','food','price','wait','no','ac','check'],flows:stayFlows,questions:stayQuestions,missions:stayMissions,
   skills:[skill('supply','我能說清楚房號、用品與數量。'),skill('meal','我能問清價格和時間，再表達訂餐決定。'),skill('problem','我能說明設備問題並請人查看。'),skill('connect','我能依已知資訊接話，不必從頭背起。')],
   homework:{context:'你住 305 號房，想訂三明治，預算 25 美元、可等 15 分鐘。先聽這次的價格與時間，再表達決定；之後再向飯店要 1 條毛巾。',listen:[step('price25','新的餐點資訊'),step('fast','新的餐點資訊')],speak:['room','yes','no','towel'],check:'25 美元、10 分鐘符合限制。可以接受，或因自己改變心意而婉拒；要毛巾時是 305 號房、1 條。'}},
  {id:'chapter',title:'全章住宿挑戰',sourceLabels:['A','B','C','D','E','F'],storageKey:'travel-lab-en-day8-integrated-chapter-v1',sections,
   intro:'從抵達櫃檯到入住後的生活，沿用同一筆資料，分段完成一整次住宿。',
   checkpoint:'你用 Alex Chen 訂房、住 2 晚。完成入住，確認早餐、退房時間和電梯後，入住 305 號房。你需要 2 條毛巾，想詢問一份三明治（預算 25 美元，可等 30 分鐘），也發現冷氣不能運作。請分段完成這次住宿需要的溝通。',
   checkpointGuide:'早餐包含、11 點退房、電梯左邊。餐點 20 美元、20 分鐘；可接受或婉拒。分成櫃檯、房內用品與餐點、設備求助三段；前後測沿用同一份條件。',
   checkpointKeys:['checkin','name','passport','nights','breakfast','checkout','elevator','room','towels','food','price','wait','yes','no','ac','check'],flows:chapterFlows,questions:chapterQuestions,missions:chapterMissions,
   skills:[skill('arrival','我能完成入住並依櫃檯問題接話。'),skill('information','我能取得並理解住宿資訊。'),skill('needs','我能處理用品需求與設備問題。'),skill('decision','我能問清餐點條件，再表達決定。'),skill('connect','我能在不同時點沿用正確資料，自己選擇說法。')],
   homework:{context:'你用 Jamie Lin 訂房、住 3 晚。請先口頭提出入住並報姓名、晚數。入住後是 512 號房；聽完這間飯店的退房與電梯資訊，再練一通電話，請飯店送水和棉被到房間。',listen:[step('noon','新的住宿資訊'),step('right','新的住宿資訊')],speak:['checkin','jamie','three','room512','water512','blanket512'],check:'使用 Jamie Lin、3 晚；退房是 12 點、電梯右邊。電話使用 512 號房，提出水和一條額外棉被的需求。'}}
 ].map(g=>({...g,checkpointSteps:g.checkpointKeys.map(k=>step(k,'課前與課後同題')),homework:{...g.homework,speakSteps:g.homework.speak.map(k=>step(k,'課後練習'))}}))};
};
