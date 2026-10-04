const original = require('./day0-data.cjs');
const d = JSON.parse(JSON.stringify(original));
d.previousLesson = {key:original.course.id,legacyKeys:[],missions:original.missions,pairs:original.pairs};
d.course.id='travel-lab-day0-rounds-v2';
d.course.legacyKeys=[];
d.course.description='先完成一小趟問路，再學求助和步行。分清楚路人會說的話，以及自己需要說的話。';
d.course.labels=['先當一次日文初學者','這輪：我會說，也聽得懂','這輪：跟著問一次路','這輪：換個情況','這輪：和夥伴真的問路','看看我的進步','隔一段時間，再試一次'];
d.course.skills=[{id:'ask',text:'我能自己問位置，換地點也能開口。'},{id:'repair',text:'我沒聽清楚時，能主動請對方重說。'},{id:'walk',text:'我能問能否步行，聽出方向與步行時間。'}];
d.language='ja';
const jp={excuse:'すみません。',where:'駅はどこですか。',store:'コンビニはどこですか。',repeat:'もう一度お願いします。',walk:'歩いて行けますか。',thanks:'ありがとうございます。',left:'左に曲がってください。',right:'右に曲がってください。',straight:'まっすぐ行ってください。',five:'はい。歩いて五分です。',ten:'はい。歩いて十分です。',welcome:'どういたしまして。'};
d.support=d.courtesy.map(p=>({...p,use:p.en===jp.excuse?'開口前：叫住路人':'結束時：謝謝對方'}));
d.phrases[0].practice='換成廁所，先用同一個問法；地點讀音可查下方小卡。';
d.phrases[0].remix='すみません。トイレはどこですか。';
d.phrases[1].practice='先回想：剛才聽不清楚時，可以用哪一句讓路人再說一次？';
d.phrases[2].practice='換成便利商店，還是想知道能不能走路。用同一句問。';
const reply=(id,name,line,zh,listen,options,correct,why,task,words,answer,change,changeWords,changeAnswer)=>({id,name,line,zh,listen,options,correct,why,task,words,answer,change,changeWords,changeAnswer});
d.replies=[
 reply('a-confirm','對方確認目的地','駅ですか。','是車站嗎？','先聽出 eki 是車站。',['車站','廁所'],0,'駅（eki）是車站。','對，你要去車站，簡短確認即可。','はい（hai）：對','はい。','其實你要去便利商店，說出正確地點。','コンビニ（konbini）','コンビニです。'),
 reply('a-left','把聲音連到左邊',jp.left,'請左轉。','聽完整句，先抓住 hidari。',['← 左邊','右邊 →'],0,'左（hidari）是左邊。','指左邊，再重複方向詞確認。','左（hidari）','左','換成聽到右邊，指右邊並重複。','右（migi）','右'),
 reply('a-right','換個方向再聽',jp.right,'請右轉。','這次依聲音選方向。',['← 左邊','右邊 →'],1,'右（migi）是右邊。','指右邊，用方向詞確認即可。','右（migi）','右','這次改成左邊。','左（hidari）','左'),
 reply('b-repair','聽不清楚就求助',jp.straight+jp.right,'請直走，再右轉。','先抓出路人說了哪些方向；需要時慢速重聽。',['直走，再右轉','直走，再左轉'],0,'まっすぐ 是直走，右（migi）是右邊。','假設剛才沒聽清楚，主動請路人重說一次。','もう一度（mō ichido）：再一次',jp.repeat,'這次已經聽懂，可以道謝，不必再請重說。','ありがとう（arigatō）',jp.thanks),
 reply('c-five','聽出 5 分鐘',jp.five,'可以，走路 5 分鐘。','先認識 go-fun 的聲音，再放回完整句聽。',['5 分鐘','10 分鐘'],0,'五分（go-fun）是 5 分鐘。','你已取得步行資訊，謝謝路人。','ありがとう',jp.thanks,'如果時間沒聽清楚，請路人重說。','もう一度',jp.repeat),
 reply('c-ten','換成 10 分鐘',jp.ten,'可以，走路 10 分鐘。','留意 jup-pun，和 5 分鐘分清楚。',['5 分鐘','10 分鐘'],1,'十分（jup-pun）是 10 分鐘。','你已取得步行資訊，謝謝路人。','ありがとう',jp.thanks,'如果沒有聽清楚，主動請路人重說。','もう一度',jp.repeat)
];
const step=(id,line,zh,task,words,answer,objects,valid=[0],askFirst=false)=>({id,line,zh,task,words,answer,objects,valid,askFirst,effect:'✓ 已更新問路卡。依這次聽到的資訊繼續。'});
const finish=()=>step('finish',jp.welcome,'不客氣。','這次問路完成了，謝謝路人。','ありがとう（arigatō）',jp.thanks,[['✓','完成這次問路']],[0],true);
d.flows=[
 {id:'round-a',name:'A｜問到車站的位置',desc:'只問位置、聽出左右，再道謝。',context:'你在路口，面朝地圖上方。先問車站，再依這次聽到的方向走。',summary:'收起完整句，換成廁所再問一次。可以保留地點讀音。',destination:'車站',side:'left',steps:[
  step('ask',jp.left,'請左轉。','先叫住路人，問車站在哪裡。說完後再聽回覆。','すみません／駅（eki）／どこ（doko）',jp.excuse+jp.where,[['←','往左邊走'],['→','往右邊走']],[0],true),finish()
 ]},
 {id:'round-b',name:'B｜換地點，也會求助',desc:'改問便利商店，聽不清楚就請重說。',context:'你在路口前，面朝上方。這次找便利商店；加入一次「沒聽清楚」的求助練習。',summary:'再試一次，已聽清楚時可以直接走；需要時才請重說。',destination:'便利商店',side:'right',steps:[
  step('ask',jp.straight+jp.right,'請直走，再右轉。','先問便利商店在哪裡。聽回覆時先抓直走，下一步再確認轉向。','コンビニ（konbini）／どこ',jp.excuse+jp.store,[['↑','先直走到路口'],['↓','往回走']],[0],true),
  step('repair',jp.right,'請右轉。','這一輪練習沒聽清楚時求助。先請路人再說一次，再用慢速聽回覆。','もう一度（mō ichido）',jp.repeat,[['←','左轉'],['→','右轉']],[1],true),finish()
 ]},
 {id:'round-c',name:'C｜確認能不能走路',desc:'重用問位置，再問步行與分鐘數。',context:'你要去車站。方向確定後，再詢問能否步行。路線與時間都是教學設定。',summary:'換個方向與步行時間，再完成一次問路；先試著不看完整句。',destination:'車站',side:'right',walkMinutes:10,steps:[
  step('ask',jp.right,'請右轉。','重用 A 輪，先問車站在哪裡。','駅（eki）／どこ',jp.excuse+jp.where,[['←','左轉'],['→','右轉']],[1],true),
  step('walk',jp.ten,'可以，走路 10 分鐘。','你已知道方向，想確認能不能走路去。','歩いて（aruite）',jp.walk,[['5','步行 5 分鐘'],['10','步行 10 分鐘']],[1],true),finish()
 ]}
];
d.missions=[original.missions[0],original.missions[1],original.missions[2]];
d.pairs=[
 {id:'round-a',name:'A｜自己問一個地點',first:'學生',role:'你當旅客，老師或夥伴當路人；不懂日文也能用接話音檔。',opening:'不好意思，請問車站在哪裡？',next:'聽回覆、指方向，再道謝。下一輪改找廁所；夥伴換另一個方向。',objects:'車站 → 下一次換廁所',goals:['自己問對目的地','依聲音指出方向','道謝'],tags:'先只給一個方向。每次可換左或右，別讓地點固定對應方向。',cards:[['這次給左邊',jp.left,'只播放這次要給的方向。'],['另一次換右邊',jp.right,'讓學生根據聲音指出方向。'],['學生道謝',jp.welcome,'結束問路。']],words:'すみません／駅／どこ／ありがとう',answer:jp.excuse+jp.where+jp.thanks},
 {id:'round-b',name:'B｜需要時自己求助',first:'學生',role:'你當旅客，老師或夥伴播放路人的接話。',opening:'不好意思，請問便利商店在哪裡？',next:'先聽一遍；不清楚就自己求助。重說後指出方向，再道謝。',objects:'便利商店 · 直走後轉彎',goals:['問出目的地','需要時主動請重說','重聽後指出方向','道謝'],tags:'第一次正常速度；學生請重說後，放慢或分段。已聽懂可直接走，再另練一次求助。',cards:[['問位置',jp.straight+jp.right,'先給完整路線。'],['請求重說',jp.right,'用慢速播放，只留轉向。'],['換個方向練',jp.left,'下一次換左轉。'],['道謝',jp.welcome,'自然結束。']],words:'コンビニ／どこ／もう一度／ありがとう',answer:jp.excuse+jp.store+jp.repeat+jp.thanks},
 {id:'round-c',name:'C｜問清楚再出發',first:'學生',role:'你當旅客，老師或夥伴當路人；共看畫面。',opening:'不好意思，請問車站在哪裡？',next:'聽出方向，再主動問能不能走路。聽出分鐘數；必要時求助。',objects:'車站 · 方向、時間每輪可以改變',goals:['自己問位置','主動問能否步行','聽出這次的時間','需要時求助並道謝'],tags:'每次挑一個方向、一個時間。下一輪換另一組。',cards:[['給方向',jp.right,'可選右轉。'],['另一次換方向',jp.left,'也可選左轉。'],['問步行：這次 10 分鐘',jp.ten,'依這次設定播放。'],['另一次 5 分鐘',jp.five,'下一輪換時間。']],words:'駅／どこ／歩いて／ありがとう',answer:jp.excuse+jp.where+jp.walk+jp.thanks}
];
d.rounds=[
 {id:'A',name:'問到一個地點',goal:'自己問位置，聽出左右，依方向走。',phraseIds:['where'],replyIds:[0,1,2],reuse:[],words:[['駅','車站 · eki · 要說'],['トイレ','廁所 · toire · 要說'],['左','左 · hidari · 先聽懂'],['右','右 · migi · 先聽懂']],bridge:'這輪新增 1 個主要問法；開頭、道謝可隨時看共用小卡。左右先聽得懂即可。'},
 {id:'B',name:'聽不清楚，會求助',goal:'換成便利商店；聽不清楚時能讓對方再說一次。',phraseIds:['repeat'],replyIds:[3],reuse:[0],words:[['コンビニ','便利商店 · konbini · 要說'],['まっすぐ','直走 · massugu · 先聽懂'],['左','左 · hidari'],['右','右 · migi']],bridge:'只多學一句求助。重用 A 的問位置；夥伴重說時可放慢、分段或指圖。'},
 {id:'C',name:'確認能否步行',goal:'問能不能走路，聽出 5 或 10 分鐘。',phraseIds:['walk'],replyIds:[4,5],reuse:[0,1],words:[['五分','5 分鐘 · go-fun · 先聽懂'],['十分','10 分鐘 · jup-pun · 先聽懂']],bridge:'這輪再加步行問法。先聽分鐘數的小卡，再放進完整回答。'}
].map((r,i)=>({...r,flowIds:[i],missionIds:[i],pairIds:[i]}));
module.exports=d;
