const original=require('./day1-2-data.cjs')[0];
const d=JSON.parse(JSON.stringify(original));

// A new task structure keeps the former whole-day and focus records separate.
d.course.id='travel-lab-unit1-micro-v2';
d.course.legacyKeys=[];
d.previousFocusKey='travel-lab-unit1-focus-v1';
d.previousLesson={key:original.course.id,legacyKeys:original.course.legacyKeys,missions:original.missions,pairs:original.pairs};
d.course.description='每輪只練 2 句、2 段短對話。從隨身句到真人練習反覆使用，這輪練熟、回顧後，再進下一輪。';
d.course.labels=['這一輪：先試著說','這一輪：2 句與短對話','這一輪：跟著做','這一輪：只換一個條件','這一輪：和老師練','這一輪：看看進步','這一輪：課後再練'];
d.course.tip='每輪先用同 2 句完成任務。對方的話聽懂即可，不需要背熟；需要時再看選用的禮貌說法。';

const S=(id,line,zh,task,words,answer,answerZh,objects,position)=>({
 id,line,zh,task,words,answer,answerZh,objects,valid:[0],askFirst:true,position,
 effect:'✓ 已更新路線卡，確認結果後繼續。'
});
const skill=(id,text)=>({id,text,label:text});

// Keep the complete original phrase bank and stable IDs. Only each round's
// phraseIds are required; optional language never expands the required answers.
d.rounds=[
 {
  id:'A',name:'問路與確認方向',goal:'問火車站怎麼走，再確認是不是左轉。',
  phraseIds:['phrase-0','phrase-9'],replyIds:[],missionIds:[0],pairIds:[0],reuse:[],
  words:[['train station','火車站'],['bus stop','公車站'],['left','左邊'],['go straight','直走']],
  listen:'只聽這 2 句回覆：直走再左轉，以及確認左轉。聽懂意思即可，不用背路人的話。',
  bridge:'這輪只練「問怎麼走」和「確認左轉」。需要時可加 Excuse me.（不好意思。），不列入必做目標。',
  optionalPhraseIds:['phrase-10'],listeningScope:'parts-2-5',omitHearLines:[],
  advanced:[
   {use:'另一種問路說法',base:'How do I get to the train station?',en:'Could you tell me how to get to the train station?',zh:'可以告訴我怎麼去火車站嗎？'},
   {use:'把要確認的路口說清楚',base:'Turn left?',en:'Do I turn left at the second intersection?',zh:'我是在第二個路口左轉嗎？'},
   {use:'另一種交代目的地與問路的說法',base:'How do I get to the post office?',en:'I’m going to the post office. Could you show me the way?',zh:'我要去郵局，可以告訴我怎麼走嗎？'}
  ],
  advancedHear:[
   {en:'Turn left. The train station is at the end of the road.',zh:'左轉。火車站在路的盡頭。'},
   {en:'Go straight to the second intersection. Turn left. The train station is at the end of the road.',zh:'直走到第二個路口，再左轉。火車站在路的盡頭。'}
  ],
  checkpoint:{
   task:'你想去火車站，先問路人怎麼走。路人說「直走，再左轉」，你想確認是不是左轉。你會分別怎麼說？',
   words:'get to / train station / turn / left',
   answer:'How do I get to the train station? Turn left?',
   answerZh:'我要怎麼去火車站？左轉嗎？',
   review:'有問出火車站怎麼走，並確認左轉嗎？',
   skills:[skill('micro-a-ask-v2','我能問火車站怎麼走。'),skill('micro-a-turn-v2','我能用短句確認左轉。')]
  },
  home:{
   quiz:{id:'micro-a-listen-v2',line:'Go straight. Turn left.',zh:'直走，再左轉。',question:'路人說要怎麼走？',options:['直走，再左轉','直走，再右轉'],correct:0,feedback:'Go straight 是直走，turn left 是左轉。'},
   task:'再練火車站這段對話：先問怎麼去火車站，聽到「直走，再左轉」後，確認是不是左轉。',
   words:'get to / train station / turn / left',
   answer:'How do I get to the train station? Turn left?',
   answerZh:'我要怎麼去火車站？左轉嗎？'
  }
 },
 {
  id:'B',name:'步行或公車',goal:'問能不能走到郵局，覺得太遠時再問能不能搭公車。',
  phraseIds:['phrase-7','phrase-8'],replyIds:[],missionIds:[1],pairIds:[1],reuse:[],
  words:[['walk','走路'],['bus','公車'],['twenty minutes','20 分鐘'],['over there','在那邊']],
  listen:'只聽這 2 句回覆：走路要 20 分鐘，以及可以搭公車、站牌在那邊。',
  bridge:'情境已告訴路人你要去郵局。這輪直接練「能不能走路」和「能不能搭公車」，不用再加問路句。',
  optionalPhraseIds:['phrase-10'],listeningScope:'parts-2-5',omitHearLines:[],
  advanced:[],
  advancedHear:[
   {en:'Yes. The bus stop is at the first intersection, on the left.',zh:'可以。公車站在第一個路口的左邊。'}
  ],
  checkpoint:{
   task:'路人已知道你要去郵局。你先問能不能走路，聽到「走路要 20 分鐘」後覺得太遠，想再問能不能搭公車。你會分別怎麼說？',
   words:'walk / there / take / bus',
   answer:'Can I walk there? Can I take a bus?',
   answerZh:'我可以走路到那裡嗎？我可以搭公車嗎？',
   review:'有先問能不能走路，再問能不能搭公車嗎？',
   skills:[skill('micro-b-walk-v2','我能問能不能走路到目的地。'),skill('micro-b-bus-v2','我能問能不能搭公車。')]
  },
  home:{
   quiz:{id:'micro-b-listen-v2',line:'It’s a twenty-minute walk.',zh:'走路要 20 分鐘。',question:'走路要多久？',options:['10 分鐘','20 分鐘'],correct:1,feedback:'twenty-minute walk 表示走路要 20 分鐘。'},
   task:'路人已知道你要去郵局。再練一次：先問能不能走路，得知要走 20 分鐘後，再問能不能搭公車。',
   words:'walk / there / take / bus',
   answer:'Can I walk there? Can I take a bus?',
   answerZh:'我可以走路到那裡嗎？我可以搭公車嗎？'
  }
 },
 {
  id:'C',name:'聽不清楚時求助',goal:'沒聽清楚先請重說，再請路人在地圖上指出來。',
  phraseIds:['phrase-6','phrase-5'],replyIds:[],missionIds:[2],pairIds:[2],reuse:[],
  words:[['again','再一次'],['map','地圖'],['right','右邊'],['post office','郵局']],
  listen:'只聽這 2 句回覆：直走再右轉，以及郵局在右邊。這輪只要會開口求助。',
  hearUsage:[{
   line:'Here. The post office is on the right.',target:'right',targetZh:'右邊',
   alternatives:[{word:'left',wordZh:'左邊',en:'Here. The post office is on the left.',zh:'這裡，郵局在左邊。'}]
  }],
  bridge:'情境已交代你問過郵局怎麼走，但沒有聽清楚。直接用這輪的 2 句求助，不必再重演問路或交通方式。',
  optionalPhraseIds:['phrase-10'],listeningScope:'parts-2-5',omitHearLines:[],
  advanced:[
   {use:'請重說，也請放慢',base:'Could you say that again?',en:'Could you say that again more slowly, please?',zh:'可以請你再慢慢說一次嗎？'},
   {use:'請對方在地圖上指出走法',base:'Could you show me on the map?',en:'Could you show me how to get there on the map?',zh:'可以在地圖上指給我看要怎麼到那裡嗎？'}
  ],
  advancedHear:[
   {en:'Go straight to the second intersection. Turn right.',zh:'直走到第二個路口，再右轉。'}
  ],
  checkpoint:{
   task:'你已經問過郵局怎麼走，但沒聽清楚。先請路人再說一次；你還想對照手上的地圖，再請他在地圖上指出來。你會分別怎麼說？',
   words:'say / again / show / map',
   answer:'Could you say that again? Could you show me on the map?',
   answerZh:'可以再說一次嗎？可以在地圖上指給我看嗎？',
   review:'有請路人再說一次，並請他在地圖上指出來嗎？',
   skills:[skill('micro-c-repeat-v2','我能請對方再說一次。'),skill('micro-c-map-v2','我能請對方在地圖上指給我看。')]
  },
  home:{
   quiz:{id:'micro-c-listen-v2',line:'Here. The post office is on the right.',zh:'這裡，郵局在右邊。',question:'郵局在地圖的哪一邊？',options:['左邊','右邊'],correct:1,feedback:'on the right 表示在右邊。'},
   task:'再練這段求助：你已問過郵局怎麼走，但沒聽清楚。先請重說，再請路人在手上的地圖指出來。',
   words:'say / again / show / map',
   answer:'Could you say that again? Could you show me on the map?',
   answerZh:'可以再說一次嗎？可以在地圖上指給我看嗎？'
  }
 }
];

d.flows=[
 {
  id:'micro-a-v2',name:'A｜問路與確認方向',desc:'用同 2 句問火車站怎麼走，再確認左轉。',
  context:'你想去火車站。先問路，再確認左轉。圖中路線為教學設定。',
  summary:'你問了火車站怎麼走，也確認了左轉。再練同一段，試著少看一層提示。',
  steps:[
   S('micro-a-ask-v2','Go straight. Turn left.','直走，再左轉。','你想去火車站，用這輪學過的句子問怎麼走。','get to / train station','How do I get to the train station?','我要怎麼去火車站？',[['🚉','目的地：火車站'],['✉','目的地：郵局']],[210,315,'已問出目的地：火車站']),
   S('micro-a-turn-v2','Yes, left.','對，左轉。','路人剛才說要左轉。用這輪的短句確認是不是左轉。','turn / left','Turn left?','左轉嗎？',[['←','確認左轉去火車站'],['→','改往右邊']],[85,90,'已確認左轉去火車站'])
  ]
 },
 {
  id:'micro-b-v2',name:'B｜步行或公車',desc:'用同 2 句問能不能走路，再問公車。',
  context:'路人已知道你要去郵局。你想先問能不能走路；若要走 20 分鐘，你想改搭公車。路線和時間為教學設定。',
  summary:'你問了能不能走路，也問了能不能搭公車。再練同一段，試著少看一層提示。',
  steps:[
   S('micro-b-walk-v2','It’s a twenty-minute walk.','走路要 20 分鐘。','路人已知道你要去郵局。先問能不能走路到那裡。','walk / there','Can I walk there?','我可以走路到那裡嗎？',[['20','步行 20 分鐘'],['10','步行 10 分鐘']],[335,90,'郵局 · 步行 20 分鐘']),
   S('micro-b-bus-v2','Yes. The bus stop is over there.','可以，公車站在那邊。','你不想走 20 分鐘，用這輪的句子問能不能搭公車。','take / bus','Can I take a bus?','我可以搭公車嗎？',[['🚌','改搭公車，先去站牌'],['🚶','繼續步行去郵局']],[210,215,'改搭公車 · 先去站牌'])
  ]
 },
 {
  id:'micro-c-v2',name:'C｜聽不清楚時求助',desc:'用同 2 句請路人重說，再請他指地圖。',
  context:'你已問過郵局怎麼走，但沒聽清楚。你手上有地圖，先請路人重說，再請他指給你看。圖中路線為教學設定。',
  summary:'你請路人再說一次，也請他在地圖指出郵局。再練同一段，試著少看一層提示。',
  steps:[
   S('micro-c-repeat-v2','Go straight. Turn right.','直走，再右轉。','剛才的郵局路線沒聽清楚。用這輪的句子請路人再說一次。','say / again','Could you say that again?','可以再說一次嗎？',[['→','聽到：直走，再右轉'],['←','聽到：直走，再左轉']],[210,90,'已重聽：直走，再右轉']),
   S('micro-c-map-v2','Here. The post office is on the right.','這裡，郵局在右邊。','你還想對照手上的地圖。用這輪的句子請路人在地圖上指出來。','show / map','Could you show me on the map?','可以在地圖上指給我看嗎？',[['✉','在右側標記郵局'],['🚉','在左側標記火車站']],[335,90,'已在地圖找到右側郵局'])
  ]
 }
];

d.missions=[
 {
  id:'micro-a-change-v2',name:'只換目的地：公車站',
  task:'這次目的地從火車站換成公車站，路線仍是「直走，再左轉」。先問公車站怎麼走，再確認左轉。',
  words:'get to / bus stop / turn / left',
  answer:'How do I get to the bus stop? Turn left?',answerZh:'我要怎麼去公車站？左轉嗎？',
  check:'有只換成公車站，並用原本的短句確認左轉嗎？'
 },
 {
  id:'micro-b-change-v2',name:'只換目的地：火車站',
  task:'這次目的地從郵局換成火車站，路人已知道你的目的地。走路仍要 20 分鐘，也可以搭公車。先問能不能走路，再問能不能搭公車。',
  words:'walk / there / take / bus',
  answer:'Can I walk there? Can I take a bus?',answerZh:'我可以走路到那裡嗎？我可以搭公車嗎？',
  check:'目的地換了，有繼續用同 2 句詢問步行和公車嗎？'
 },
 {
  id:'micro-c-change-v2',name:'只換目的地：警局',
  task:'這次已經問過的是警局，其他情況相同：剛才沒聽清楚，手上也有地圖。先請路人重說，再請他在地圖上指出來。',
  words:'say / again / show / map',
  answer:'Could you say that again? Could you show me on the map?',answerZh:'可以再說一次嗎？可以在地圖上指給我看嗎？',
  check:'目的地換了，有繼續用同 2 句請重說和指地圖嗎？'
 }
];

const P=(id,name,opening,next,objects,goals,tags,cards,words,answer,answerZh)=>({
 id,name,role:'學生當旅客，老師當路人。師生共看畫面。',first:'學生',
 opening,next,objects,goals,tags,cards,words,answer,answerZh
});
d.pairs=[
 P('micro-a-live-v2','A｜和老師再練火車站',
  '我要怎麼去火車站？','聽老師說「直走，再左轉」，再確認左轉。',
  '你想去火車站。',['問火車站怎麼走','確認是不是左轉'],'直走，再左轉。',
  [['問火車站怎麼走',d.flows[0].steps[0].line,'回覆原本路線。'],['確認左轉',d.flows[0].steps[1].line,'確認左轉。']],
  d.rounds[0].checkpoint.words,d.rounds[0].checkpoint.answer,d.rounds[0].checkpoint.answerZh),
 P('micro-b-live-v2','B｜和老師再練步行與公車',
  '我可以走路到那裡嗎？','聽老師說走路要 20 分鐘後，再問能不能搭公車。',
  '老師已知道你要去郵局。',['問能不能走路','問能不能搭公車'],'步行 20 分鐘；可以搭公車。',
  [['問能不能走路',d.flows[1].steps[0].line,'告知步行時間。'],['問能不能搭公車',d.flows[1].steps[1].line,'指向公車站。']],
  d.rounds[1].checkpoint.words,d.rounds[1].checkpoint.answer,d.rounds[1].checkpoint.answerZh),
 P('micro-c-live-v2','C｜和老師再練求助',
  '可以再說一次嗎？','聽老師重說後，再請他在地圖上指出來。',
  '你已問過郵局怎麼走，但沒聽清楚；手上有地圖。',['請老師再說一次','請老師在地圖指出來'],'直走，再右轉；郵局在右邊。',
  [['請再說一次',d.flows[2].steps[0].line,'放慢重說原路線。'],['請在地圖指出來',d.flows[2].steps[1].line,'在地圖指出右側郵局。']],
  d.rounds[2].checkpoint.words,d.rounds[2].checkpoint.answer,d.rounds[2].checkpoint.answerZh)
];

// Part 2 uses the exact learner lines and counterpart replies from Part 3.
d.replies=[];
const names=[['問火車站怎麼走','確認左轉'],['問能不能走路','問能不能搭公車'],['請再說一次','請在地圖指出']];
for(const [ri,r] of d.rounds.entries()){
 for(const [si,t] of d.flows[ri].steps.entries()){
  r.replyIds.push(d.replies.length);
  d.replies.push({...t,id:`micro-${r.id.toLowerCase()}-practice-${si+1}-v2`,name:names[ri][si],change:'收起提示，把同一段問答再說一次。'});
 }
 r.omitHearLines=r.advancedHear.map(p=>p.en);
 r.home.quiz.task=r.home.quiz.question;
 r.home.quiz.why=r.home.quiz.feedback;
}

// Merge the former sub-tasks into A, B and C. New task identities keep answers
// to the shorter former tasks separate; all earlier records remain readable.
d.course.id='travel-lab-unit1-merged-v4';
d.course.revision='merged-v4';
d.previousRevisionKeys=['travel-lab-unit1-route-v3','travel-lab-unit1-route-v3-rounds','travel-lab-unit1-micro-v2','travel-lab-unit1-micro-v2-rounds'];
d.course.description='A 練問路、確認右轉與道謝；B 練請指路、問公車與道謝；C 練請重說與指地圖。每個任務都有完整練習、回顧與課後挑戰。';
d.course.labels[1]='這一輪：句子與短對話';
d.course.tip='依序練習 A、B、C，每個任務的句子反覆用在同一段情境。對方的話聽懂即可，不需要背熟。';
d.phrases.push({id:'route-right-v3',use:'核心｜確認右轉',en:'Turn right?',zh:'右轉嗎？',note:''});
const routeLine='Go straight to the first intersection. Turn right.';
const routeZh='直走到第一個路口，再右轉。';
const welcomeLine='You’re welcome.';
const oldA=d.rounds[0],oldB=d.rounds[1],oldC=d.rounds[2],oldCFlow=d.flows[2],oldCMission=d.missions[2];
const reviseStep=(key,label,line,zh,task,words,answer,answerZh,objects,position)=>({...S('route-'+key+'-v4',line,zh,task,words,answer,answerZh,objects,position),label});
const thanks=(key,context,position)=>reviseStep(key,'謝謝對方的幫忙',welcomeLine,'不客氣。',context+'用學過的句子謝謝他的幫忙。','thank you / help','Thank you for your help.','謝謝你的幫忙。',[['✓','對方回應：不客氣'],['?','對方在問目的地']],position);
const prelude={line:'Where would you like to go?',zh:'你想去哪裡？',task:'路人先問你想去哪裡。你要去火車站，聽懂後指出火車站即可；這裡不要求增加一句英文回答。',objects:[['🚉','指出火車站'],['✉','指出郵局']],correct:0};
const revisedTasks=[
 {id:'A',group:'A',name:'問路、確認方向與道謝',phraseIds:['phrase-0','route-right-v3','phrase-10'],reuse:[],
  goal:'先指出火車站，再問路、確認右轉，最後謝謝對方的幫忙。',
  context:'你想去火車站。路人先問你想去哪裡；先在地圖指出火車站，不必另外背英文短答。再問路，聽到直走到第一個路口、右轉後，確認右轉，最後道謝。',
  task:'你想去火車站。路人問你想去哪裡，先指出火車站即可。接著問怎麼走；聽到「直走到第一個路口，再右轉」後，確認是不是右轉，最後謝謝他的幫忙。你會分別怎麼說？',
  words:[['train station','火車站'],['bus stop','公車站'],['right','右邊'],['go straight','直走'],['first intersection','第一個路口'],['thank you','謝謝你'],['help','幫忙']],
  prelude,advanced:oldA.advanced,advancedHear:oldA.advancedHear,
  steps:[
   reviseStep('a-ask','問火車站怎麼走',routeLine,routeZh,'你已指出火車站。用這輪學過的句子問怎麼走。','get to / train station','How do I get to the train station?','我要怎麼去火車站？',[['🚉','目的地：火車站'],['✉','目的地：郵局']],[210,315,'已問出目的地：火車站']),
   reviseStep('a-right','確認右轉','Yes, right.','對，右轉。','路人說在第一個路口右轉。用短句確認是不是右轉。','turn / right','Turn right?','右轉嗎？',[['→','確認右轉去火車站'],['←','改往左邊']],[335,90,'已確認第一個路口右轉去火車站']),
   thanks('a-thanks','路人已幫你指好去火車站的路，你也確認了右轉。',[335,90,'已問清楚方向，也向路人道謝'])
  ],
  variation:{name:'只換目的地：公車站',task:'這次目的地換成公車站。路人問你去哪裡時，先指出公車站即可；路線仍是直走到第一個路口，再右轉。問公車站怎麼走、確認右轉，最後謝謝他的幫忙。',words:'get to / bus stop / turn / right / thank you / help',answer:'How do I get to the bus stop? Turn right? Thank you for your help.',answerZh:'我要怎麼去公車站？右轉嗎？謝謝你的幫忙。',check:'有只換目的地，並完成問路、確認右轉與道謝嗎？'},
  quizzes:[{key:'route',line:routeLine,zh:routeZh,question:'要走到哪裡，再往哪邊轉？',options:['第一個路口，右轉','第二個路口，左轉'],correct:0,feedback:'first intersection 是第一個路口；turn right 是右轉。'},
   {key:'thanks',line:welcomeLine,zh:'不客氣。',question:'你道謝後，路人回應什麼意思？',options:['不客氣','請再問一次'],correct:0,feedback:'You’re welcome. 是回應道謝的「不客氣」。'}],
  pair:{first:'老師',start:prelude.line,opening:prelude.zh,openingNote:'先指出火車站即可；接著由學生問怎麼走，不必額外背目的地短答。',next:'學生問路後，老師回覆原路線；讓學生確認右轉，最後道謝。',goals:['指出火車站，問怎麼走','確認是不是右轉','在得到指路幫忙後道謝']}
 },
 {id:'B',group:'B',name:'請指路、問公車與道謝',phraseIds:['phrase-2','phrase-8','phrase-10'],reuse:['phrase-10'],
  goal:'請路人指路，再問能不能搭公車，最後重用 A 的道謝。',
  context:'你要去火車站，路人已知道目的地。先請他指路，路線沿用 A；接著問能不能搭公車，聽懂站牌在那邊，最後道謝。',
  task:'路人已知道你要去火車站。請他告訴你怎麼走；聽到「直走到第一個路口，再右轉」後，再問能不能搭公車。路人說「可以，公車站在那邊」，最後謝謝他的幫忙。你會分別怎麼說？',
  words:[['show me','指給我看'],['the way','走法／方向'],['first intersection','第一個路口'],['take a bus','搭公車'],['bus stop','公車站'],['over there','在那邊'],['thank you','謝謝你'],['help','幫忙']],
  advancedHear:oldB.advancedHear,
  steps:[reviseStep('b-way','請路人告訴你走法',routeLine,routeZh,'路人已知道你要去火車站。用這輪的新說法請他告訴你怎麼走。','show me / the way','Could you show me the way?','可以告訴我怎麼走嗎？',[['→','第一個路口右轉'],['←','第一個路口左轉']],[335,90,'沿用 A：第一個路口右轉去火車站']),
   reviseStep('b-bus','問能不能搭公車','Yes. The bus stop is over there.','可以，公車站在那邊。','你已聽懂去火車站的路線，但想搭公車。問能不能搭公車。','take / bus','Can I take a bus?','我可以搭公車嗎？',[['🚌','先去公車站牌'],['🚉','直接走到火車站']],[95,215,'可以搭公車 · 先去左側站牌']),
   thanks('b-thanks','路人已告訴你走法和公車資訊，也指出站牌。',[95,215,'已問清楚走法和公車，並向路人道謝'])],
  variation:{name:'只換目的地：郵局',task:'這次目的地換成郵局，路人已知道；路線仍是直走到第一個路口，再右轉。先請他指路，再問能不能搭公車，聽到站牌在那邊後，謝謝他的幫忙。',check:'目的地換了，有繼續完成請指路、問公車與道謝嗎？'},
  quizzes:[{key:'thanks',line:welcomeLine,zh:'不客氣。',question:'哪一句話之後，路人才會這樣回應？',options:['你向他道謝後','你剛問可不可以搭公車後'],correct:0,feedback:'You’re welcome. 接在 Thank you for your help. 之後。'},
   {key:'bus',line:'Yes. The bus stop is over there.',zh:'可以，公車站在那邊。',question:'可以搭公車，接著先去哪裡？',options:['路人指出的公車站','直接走到火車站'],correct:0,feedback:'The bus stop is over there. 表示公車站在那邊。'}],
  pair:{opening:'可以告訴我怎麼走嗎？',next:'聽老師沿用 A 的路線，再問能不能搭公車；聽懂站牌在哪裡後，最後道謝。',goals:['請路人告訴你怎麼走','問能不能搭公車','在得到指路與交通資訊後道謝']}
 },
 {id:'C',group:'C',name:oldC.name,phraseIds:oldC.phraseIds,reuse:[],goal:oldC.goal,context:oldCFlow.context,task:oldC.checkpoint.task,words:oldC.words,advanced:oldC.advanced,advancedHear:oldC.advancedHear,hearUsage:oldC.hearUsage,
  steps:oldCFlow.steps.map(t=>({...t,id:t.id.replace('micro-c-','route-c-').replace('-v2','-v4'),label:t.id.includes('repeat')?'請再說一次':'請在地圖指出'})),
  variation:oldCMission,quiz:oldC.home.quiz,
  pair:{opening:'可以再說一次嗎？',next:'聽老師重說後，再請他在地圖上指出來。',goals:['請老師再說一次','請老師在地圖指出來']}
 }
];
d.rounds=[];d.flows=[];d.missions=[];d.pairs=[];d.replies=[];
for(const [i,t] of revisedTasks.entries()){
 const id='route-'+t.id.toLowerCase()+'-v4',words=t.steps.map(s=>s.words).join(' / '),answer=t.steps.map(s=>s.answer).join(' '),answerZh=t.steps.map(s=>s.answerZh).join('');
 const homeQuizzes=(t.quizzes||[t.quiz]).map((q,j)=>({...q,id:id+'-listen-'+(q.key||j),task:q.question,why:q.feedback}));
 const checkpoint={task:t.task,words,answer,answerZh,review:t.pair.goals.join('；')+'。',skills:t.steps.map(s=>skill(s.id,'我能'+s.label+'。'))};
 const r={id:t.id,group:t.group,name:t.name,goal:t.goal,phraseIds:t.phraseIds,replyIds:[],missionIds:[i],pairIds:[i],reuse:t.reuse,words:t.words,
  listen:'只聽懂本輪對方的話，不必背熟。',bridge:t.context,optionalPhraseIds:[],listeningScope:'parts-2-5',
  advanced:t.advanced||[],advancedHear:t.advancedHear||[],hearUsage:t.hearUsage||[],
  hearLines:t.prelude?[{en:t.prelude.line,zh:t.prelude.zh,sources:['先聽懂並指出目的地']}]:[],prelude:t.prelude,
  checkpoint,home:{task:checkpoint.task,words,answer,answerZh,quiz:homeQuizzes[0],quizzes:homeQuizzes}};
 r.omitHearLines=r.advancedHear.map(p=>p.en);
 d.rounds.push(r);
 d.flows.push({id,name:t.id+'｜'+t.name,desc:t.goal,context:t.context,summary:t.pair.goals.join('，')+'。再練同一段，試著少看一層提示。',destination:t.id==='C'?'郵局':'火車站',mapMode:t.id==='C'?'post':'station',prelude:t.prelude,steps:t.steps});
 d.missions.push({...t.variation,id:id+'-change',words:t.variation.words||words,answer:t.variation.answer||answer,answerZh:t.variation.answerZh||answerZh});
 d.pairs.push({...P(id+'-live',t.id+'｜'+t.name,t.pair.opening,t.pair.next,t.context,t.pair.goals,t.id==='C'?'直走，再右轉；郵局在右邊。':t.steps.map(s=>s.zh).join(' '),t.steps.map(s=>[s.label,s.line,s.zh]),words,answer,answerZh),...t.pair});
 for(const s of t.steps){r.replyIds.push(d.replies.length);d.replies.push({...s,id:s.id+'-practice',name:s.label,change:'收起提示，把同一段問答再說一次。'});}
}
// The optional whole-lesson challenge changes the map-help destination to the
// already known train station. Teach that listening substitution before use.
d.rounds.at(-1).hearUsage.push({line:'Here. The post office is on the right.',target:'the post office',targetZh:'郵局',alternatives:[{word:'the train station',wordZh:'火車站',en:'Here. The train station is on the right.',zh:'這裡，火車站在右邊。'}]});

// These compatibility fields contain only A; the focus view renders each
// round's checkpoint and home data directly, without pulling later tasks in.
Object.assign(d.course,{
 task:d.rounds[0].checkpoint.task,words:d.rounds[0].checkpoint.words,
 answer:d.rounds[0].checkpoint.answer,answerZh:d.rounds[0].checkpoint.answerZh,
 review:d.rounds[0].checkpoint.review,skills:d.rounds.flatMap(r=>r.checkpoint.skills)
});
d.homeTask=d.rounds[0].home.task;
d.homeWords=d.rounds[0].home.words;
d.homeAnswer=d.rounds[0].home.answer;
d.homeAnswerZh=d.rounds[0].home.answerZh;
d.quizzes=[d.rounds[0].home.quiz];
module.exports=d;
