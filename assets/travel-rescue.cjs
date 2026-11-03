// One practical unit replaces the separate Day 12, 13 and 14 curricula.
const clone=value=>JSON.parse(JSON.stringify(value));
function exchange(label,answer,answerZh,line,zh,task,words,choices,result,askFirst=true){
 return {label,answer,answerZh,line,zh,task,words,askFirst,opening:askFirst?answerZh:zh,
  objects:choices.map(text=>['▣',text]),valid:[0],effect:'✓ '+result,result};
}
function make(previous,compile,labelTasks){
 const a=[
  exchange('先確認有沒有開','Is the museum open today?','博物館今天有開嗎？',"Sorry, it’s closed today.",'抱歉，今天休館。','到了博物館門口，先問工作人員今天有沒有開。','museum / open / today',['今天休館','今天有開'],'原定博物館休館，需要換個去處。'),
  exchange('請對方找替代去處','Is there another museum nearby?','附近有其他博物館嗎？','Yes. The City Museum is open.','有，市立博物館有開。','聽到休館，問附近有沒有其他博物館。','another museum / nearby',['改去市立博物館','留在休館的博物館'],'新目的地：市立博物館。'),
  exchange('問怎麼去','How do I get there?','我要怎麼去那裡？','Take bus number five.','搭 5 號公車。','你決定去市立博物館，接著問怎麼去。','how / get there',['搭 5 號公車','搭 9 號公車'],'交通：5 號公車。'),
  exchange('問需要多久','How long does it take?','大約需要多久？','About ten minutes.','大約 10 分鐘。','已知道要搭哪班車，再問車程多久。','how long / take',['車程約 10 分鐘','每 10 分鐘一班'],'車程：約 10 分鐘；這不是班距。'),
  exchange('把資訊說回去確認','Bus five, about ten minutes. Is that right?','5 號公車，大約 10 分鐘，對嗎？',"Yes, that’s right.",'對，沒錯。','把剛才的車號和車程說回去，確認沒有聽錯。','bus five / ten minutes / right',['確認：5 號車，約 10 分鐘','確認：10 號車，約 5 分鐘'],'路線已確認，可以前往新的目的地。')
 ];
 const b=[
  exchange('主動告知會遲到',"I’m going to be late.",'我會遲到。','The bus leaves at ten.','公車 10 點出發。','導遊在電話中說 10 點出發，你趕不上，先告訴他你會遲到。','going to / be late',['已告知導遊會遲到','沒有通知，讓大家等'],'導遊知道你會遲到。',false),
  exchange('說清楚現在的位置',"I’m at the station.",'我在車站。','Where are you now?','你現在在哪裡？','導遊問你在哪裡，你正在車站。','at / the station',['你在車站','你在飯店'],'目前位置：車站。',false),
  exchange('問新的會合地點','Where can I meet you?','我可以在哪裡跟你們會合？','At the museum entrance.','在博物館入口。','原本的車已經趕不上，問在哪裡跟大家會合。','where / meet you',['改到博物館入口會合','回飯店大廳等'],'新會合點：博物館入口。'),
  exchange('沒聽清楚就請重說','Sorry, could you say that again?','不好意思，可以再說一次嗎？','At the museum entrance.','在博物館入口。','電話雜音太大，你沒聽清楚會合地點，請導遊再說一次。','say that / again',['再次聽到：博物館入口','聽不清楚就先掛電話'],'已重聽會合地點。'),
  exchange('確認下一步','The museum entrance, right?','博物館入口，對嗎？','Yes. Please come straight here.','對，請直接過來這裡。','把重聽到的地點說回去確認，再結束通話。','museum entrance / right',['直接到博物館入口','回原來的集合點'],'下一步已談好：直接到博物館入口。')
 ];
 const c=[
  exchange('說明遺失物品',"I left my bag on the bus.",'我把包包忘在公車上。','Which bus were you on?','你剛才搭哪一班公車？','下車後發現包包忘在車上，先向站務人員說明。','left / my bag / on the bus',['包包忘在公車上','包包留在飯店'],'已說明：包包忘在公車上。'),
  exchange('回答是哪一班車','Bus number five.','5 號公車。','What does it look like?','它是什麼樣子的？','對方剛問你搭哪班車，回答 5 號公車；再聽下一個問題。','bus / number five',['5 號公車','9 號公車'],'查找線索：5 號公車。'),
  exchange('描述物品特徵',"It’s a small black bag.",'是一個黑色小包包。','Please check at the information desk.','請到服務台詢問。','對方剛問包包的樣子，說明是黑色的小包包。','small / black / bag',['黑色小包包','藍色大行李箱'],'已留下特徵：黑色小包包；接著到服務台詢問。'),
  exchange('問服務台在哪裡','Where is the information desk?','服務台在哪裡？','Next to the main entrance.','在大門旁邊。','你不知道服務台的位置，請對方指引。','information desk / where',['到大門旁的服務台','到餐廳旁的售票口'],'服務台：大門旁。'),
  exchange('請寫下重要資訊','Could you write that down, please?','可以請你寫下來嗎？','Of course. Here you are.','當然，給你。','怕忘記服務台位置，請對方寫下來，方便你拿著找。','write / that down',['收好寫著服務台位置的紙條','直接當作包包已經找回'],'已拿到位置紙條；下一步到服務台詢問，包包尚未尋回。')
 ];
 const av=clone(a);av[2]=exchange('問怎麼去',a[2].answer,a[2].answerZh,'Take bus number eight.','搭 8 號公車。',a[2].task,a[2].words,['搭 8 號公車','搭 5 號公車'],'交通：8 號公車。');
 av[4]=exchange('把資訊說回去確認','Bus eight, about ten minutes. Is that right?','8 號公車，大約 10 分鐘，對嗎？',a[4].line,a[4].zh,'這次搭 8 號車，車程仍是 10 分鐘，重新確認。','bus eight / ten minutes / right',['確認：8 號車，約 10 分鐘','沿用舊資訊：5 號車'],'已確認新的車號。');
 const bv=clone(b);bv[1]=exchange('說清楚現在的位置',"I’m at the café.",'我在咖啡廳。',b[1].line,b[1].zh,'這次你在咖啡廳，告訴導遊你的位置。','at / the café',['你在咖啡廳','你在車站'],'目前位置：咖啡廳。',false);
 const cv=clone(c);cv[2]=exchange('描述物品特徵',"It’s a small blue bag.",'是一個藍色小包包。',c[2].line,c[2].zh,'這次遺失的是藍色小包包，說出正確顏色。','small / blue / bag',['藍色小包包','黑色小包包'],'已留下特徵：藍色小包包。');
 const specs=[
  {key:'rescue-closed',name:'景點關閉，找得到替代行程',role:'行程人員',icon:'↗',context:'你到了博物館才知道今天休館。向工作人員問附近其他博物館，再問交通、車程並確認。',steps:a,variation:{task:'同樣改去市立博物館，只有公車換成 8 號，車程仍是 10 分鐘。請把新的車號與車程確認一次。',steps:av},goal:'聽到休館也能找到有開的地方，問清楚怎麼去。',outcome:'市立博物館 → 5 號公車 → 約 10 分鐘',boardTitle:'重新安排路線',boardIcon:'↗',boardStart:'原定：參觀博物館',words:[['closed / open','休館／開放'],['another / nearby','另一個／附近'],['bus number','公車號碼']]},
  {key:'rescue-late',name:'趕不上集合，談好在哪裡會合',role:'行程人員',icon:'◷',context:'你在車站，趕不上 10 點出發的車。打電話給導遊，告知遲到與位置，問新會合點；沒聽清楚就請重說，最後確認。',steps:b,variation:{task:'只有你目前的位置改成咖啡廳，仍趕不上 10 點出發，仍到博物館入口會合。告知位置，再談好下一步。',steps:bv},goal:'讓導遊知道你在哪裡，重新約好會合點。',outcome:'已通知遲到 → 說明位置 → 博物館入口會合',boardTitle:'與導遊的通話紀錄',boardIcon:'☎',boardStart:'原定：10:00 出發；你仍在車站',words:[['late','遲到'],['station / café','車站／咖啡廳'],['entrance','入口'],['again','再一次']]},
  {key:'rescue-lost',name:'東西不見，說清楚並找到求助處',role:'站務人員',icon:'▣',context:'你把黑色小包包忘在 5 號公車上。向站務人員說明，回答車號與包包特徵，問服務台在哪裡，請對方把位置寫下來。',steps:c,variation:{task:'只有包包顏色改成藍色；仍是小包包、忘在 5 號公車上。說清楚物品特徵，問服務台位置並請對方寫下來。',steps:cv},goal:'提供查找線索，知道下一步要到哪裡求助。',outcome:'5 號車 → 黑色小包包 → 到大門旁服務台詢問',boardTitle:'遺失物求助卡',boardIcon:'▣',boardStart:'包包不在身邊；先向站務人員求助',words:[['left … on the bus','把……忘在公車上'],['small / black / blue','小的／黑色／藍色'],['information desk','服務台'],['write down','寫下來']]}
 ].map(s=>({...s,isMerged:true,sourceIds:['12','13','14'],changeNote:'整合原三課的詢問、調整計畫及資訊確認，改成有具體結果的求助任務。',homeQuizSteps:s.steps.filter((_,i)=>[0,3].includes(i)).map(s=>({...s,distractor:'請先回到飯店。'}))}));
 // Vary the correct position; learners need to use the information they heard.
 specs.forEach(spec=>{for(const steps of [spec.steps,spec.variation.steps])steps.forEach((s,i)=>{if(i%2){s.objects.reverse();s.valid=[1];}});});
 const d=compile(previous[0],specs);
 d.rescueVersion=1;d.course.id='travel-lab-en-rescue-12-14-v1';d.course.dayLabel='第 12 天';
 d.course.title='旅行出狀況，我能開口求助';d.course.mergedTasks=true;d.course.revision='travel-rescue-v1';
 d.course.description='景點關閉、趕不上集合、包包遺失：三個完整任務，練習說問題、問下一步、確認重要資訊。';
 d.course.board='我的處理進度';d.course.replyRole='工作人員';
 d.course.art='<svg viewBox="0 0 400 220" role="img" aria-label="改行程、聯絡導遊、找回求助方向"><rect x="12" y="20" width="376" height="180" rx="28" fill="currentColor" opacity=".07"/><path d="M75 145L170 80L265 145L330 65" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="7 7"/><g fill="currentColor"><circle cx="75" cy="145" r="12"/><circle cx="170" cy="80" r="12"/><circle cx="265" cy="145" r="12"/><path d="M316 65h14v14h7V58h-21z"/></g><text x="48" y="112" fill="currentColor" font-size="20">說問題</text><text x="140" y="45" fill="currentColor" font-size="20">問辦法</text><text x="236" y="188" fill="currentColor" font-size="20">再確認</text></svg>';
 d.previousFocusKey=previous[0].course.id;
 d.previousLesson.legacyKeys=[...new Set(previous.flatMap(p=>[p.course.id,p.previousFocusKey,p.previousLesson.key,...p.previousLesson.legacyKeys]).filter(Boolean))];
 d.originalPhrases=[...new Map(previous.flatMap(p=>[...p.phrases,...p.originalPhrases]).map(p=>[p.en,p])).values()];
 delete d.legacyFile;
 specs.forEach((s,i)=>{
  const r=d.rounds[i],f=d.flows[r.flowIds[0]],p=d.pairs[r.pairIds[0]];
  r.rescue={title:s.boardTitle,icon:s.boardIcon,start:s.boardStart,outcome:s.outcome};
  f.summary=s.goal;f.sceneTitle=s.boardTitle;
  p.name=`${r.id}｜${s.name}`;p.next='老師沿用已學過的回話接話。學生可以少看提示、調整說法；只要問到資訊並談好下一步，就算完成溝通。';
  p.tags=`${s.context} ${s.outcome}。`;
  r.home.quizzes.forEach((q,j)=>{const n=[0,3][j];q.options=[s.steps[n].zh,i===0?(j===0?'今天有開。':'每 10 分鐘一班。'):i===1?(j===0?'公車 11 點出發。':'在飯店大廳。'):(j===0?'你住哪一間飯店？':'在餐廳旁邊。')];});
 });
 labelTasks(d);
 // Entry and progress deliberately share a short first utterance; full goals remain below.
 return d;
}
module.exports={make};
