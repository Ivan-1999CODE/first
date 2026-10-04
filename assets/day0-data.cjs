const base=require('./day1-2-data.cjs')[0];
const readings={};
const jp=(s,r)=>(readings[s]=r,s);
const where=jp('駅はどこですか。','Eki wa doko desu ka.');
const repeat=jp('もう一度お願いします。','Mō ichido onegai shimasu.');
const walk=jp('歩いて行けますか。','Aruite ikemasu ka.');
const excuse=jp('すみません。','Sumimasen.');
const thanks=jp('ありがとうございます。','Arigatō gozaimasu.');
const store=jp('コンビニはどこですか。','Konbini wa doko desu ka.');
const toilet=jp('トイレはどこですか。','Toire wa doko desu ka.');
const straight=jp('まっすぐ行ってください。','Massugu itte kudasai.');
const left=jp('左に曲がってください。','Hidari ni magatte kudasai.');
const right=jp('右に曲がってください。','Migi ni magatte kudasai.');
const yes=jp('はい。','Hai.');
const stationAnswer=jp('駅です。','Eki desu.');
const storeAnswer=jp('コンビニです。','Konbini desu.');
const leftCheck=jp('左ですね。','Hidari desu ne.');
const rightCheck=jp('右ですね。','Migi desu ne.');
const five=jp('はい。歩いて五分です。','Hai. Aruite go-fun desu.');
const ten=jp('はい。歩いて十分です。','Hai. Aruite jup-pun desu.');
const welcome=jp('どういたしまして。','Dō itashimashite.');
const phrases=[
 {id:'where',use:'不知道地點在哪 → 問位置',en:where,zh:'車站在哪裡？',practice:'你現在要找便利商店。只換地點，再說一次。',remix:store,link:'第三部分兩趟問路；第四部分換成廁所。'},
 {id:'repeat',use:'剛才沒聽清楚 → 請重說',en:repeat,zh:'請再說一次。',practice:'你問完路，但第一遍沒聽清楚。先請對方重說。',remix:repeat,link:'第三部分第二趟；第四部分的聽不清楚。'},
 {id:'walk',use:'想判斷要不要搭車 → 問能否步行',en:walk,zh:'可以走路去嗎？',practice:'剛剛問的是便利商店。現在想確認能否走到那裡。',remix:walk,link:'第三部分兩趟；第五部分自主問路。'}
];
const course={...base.course,day:0,id:'travel-lab-day0-japanese-v1',legacyKeys:[],title:'第零天：換我從零開始，日文問路。',description:'用第一天的問路主題，體驗「認得一句話，卻還不知道何時用」。今天先練 3 個主要說法，能問到路就好。',task:'你想去車站，也想知道能不能走路到那裡。你遇到一位路人，你會怎麼開口？',words:'すみません（sumimasen）／駅（eki）／どこ（doko）／歩いて（aruite）',answer:excuse+where+walk,review:'有禮貌開口、說出車站，並詢問能不能走路嗎？日文、假名或羅馬字都可以記錄。',labels:['先當一次日文初學者','先用得上這 3 句','跟著地圖問一次路','換個狀況，自己選句','和老師真的問一次路','看看我的進步','離開提示再試一次'],skills:[{id:'ask',text:'我能禮貌開口，把目的地換進問句。'},{id:'repair',text:'我沒聽清楚時，能主動請對方重說。'},{id:'walk',text:'我能詢問能否步行，並聽出方向。'}],art:base.course.art.replace('DAY 01 / FIND YOUR WAY','DAY 00 / FIRST STEPS').replace('STATION','駅'),board:'在地圖上走出剛聽到的路線'};
const replies=[
 {id:'destination',name:'對方確認目的地',line:jp('駅ですか。','Eki desu ka.'),zh:'是車站嗎？',task:'對，你要去車站。簡短確認即可。',words:'はい（hai）：對',answer:yes,change:'對方以為你去車站，其實你要去便利商店。說出地點即可。',changeWords:'コンビニ（konbini）',changeAnswer:storeAnswer},
 {id:'repeat',name:'對方確認方向',line:jp('右ですね。','Migi desu ne.'),zh:'是右邊，對吧？',task:'你沒聽清楚，不要猜對不對。請對方再說一次。',words:'もう一度（mō ichido）：再一次',answer:repeat,change:'重聽後確認正是右邊。這次簡短表示「對」。',changeWords:'はい（hai）',changeAnswer:yes}
];
function step(id,line,zh,task,words,answer,objects,valid,askFirst=false){return {id,line,zh,task,words,answer,objects,valid,askFirst,effect:'✓ 路線卡已更新。看看地圖，再繼續。'};}
const flows=[['station','第一趟：找到車站','車站','left',where,left,leftCheck,ten,10],['store','第二趟：去便利商店','便利商店','right',store,right,rightCheck,five,5]].map(([id,name,destination,side,question,direction,confirm,time,minutes],i)=>({id,name,destination,side,walkMinutes:minutes,desc:i?'換地點，遇到聽不清楚時主動求助。':'先問位置、聽方向，再問能不能走路。',context:'起點面朝地圖上方。路線與步行時間都是教學設定。先說、再聽或讀，最後點地圖物件。',summary:'收起提示，再把「問目的地、問能否步行、道謝」連起來說一次。',steps:[
 step('ask',straight,'請直走。','先禮貌叫住路人，再問'+destination+'在哪裡。',i?'想想：需要先讓路人知道哪個地點？':'すみません／駅／どこ',excuse+question,[['↑','直走到路口'],['↓','往回走']],[0],true),
 ...(i?[step('repair',right,'請右轉。','你剛才沒聽清楚。先請對方重說，再聽這次回覆。','もう一度（mō ichido）',repeat,[['↻','聽清楚重說的是右邊'],['←','把方向記成左邊']],[0],true)]:[]),
 step('turn',direction,'請'+(side==='left'?'左':'右')+'轉。','確認剛聽到的方向，再走出路線。可只重複方向詞。',side==='left'?'左（hidari）':'右（migi）',confirm,[['←','左轉'],['→','右轉']],[side==='left'?0:1]),
 step('walk',time,'可以，走路 '+minutes+' 分鐘。','你知道方向了，但不知道是否能走路到那裡。開口問清楚。','歩いて（aruite）',walk,[['5','步行 5 分鐘'],['10','步行 10 分鐘']],[minutes===5?0:1],true),
 step('finish',welcome,'不客氣。','你已確認路線與步行資訊。謝謝路人。','ありがとう（arigatō）',thanks,[['✓','帶著路線出發']],[0],true)
]}));
const missions=[
 {id:'toilet',name:'換一個地點',task:'在商場裡，你想找廁所。眼前有服務人員，你會怎麼問？先說，再開提示。',words:'トイレ（toire）：廁所',answer:excuse+toilet,check:'有把「廁所」換進位置問句嗎？'},
 {id:'unclear',name:'一句都沒聽清楚',task:'你問完路，對方回答得很快。你不知道剛才是左還是右，想請他再說一次。',words:'もう一度（mō ichido）：再一次',answer:repeat,check:'有請對方重說，而不是勉強回答「對」嗎？'},
 {id:'transport',name:'要不要搭車',task:'你已經知道便利商店的方向，但還沒決定走路或搭車。你會向路人問什麼？',words:'歩いて（aruite）：走路',answer:walk,check:'有問能不能步行，而不是又問位置嗎？'}
];
const pairs=[['station','去車站','車站',where,left,'左',10],['store','臨時改去便利商店','便利商店',store,right,'右',5]].map(([id,name,dest,question,direction,side,minutes])=>({id,name,role:'你當旅客；老師或練習夥伴當路人。共看畫面，老師不懂日文也可播放接話卡。',objects:'📍 你在路口前，面朝上方。目的地：'+dest+'。',first:'學生',opening:'不好意思，請問'+dest+'在哪裡？',next:'路人回覆後，依你是否聽清楚決定要不要請他重說，再確認能不能走路，最後道謝。',goals:['禮貌開口並問對目的地','聽不清楚時請對方重說','確認能否步行','指出正確方向並道謝'],tags:'教學設定：直走後'+side+'轉；步行 '+minutes+' 分鐘。第一遍用一般速度，只播一次；需要時再慢速。學生已聽懂則直接繼續，另做一輪「沒聽清楚」的補救練習。',cards:[['問目的地',straight+direction,'給出路線，先不翻譯；讓學生試著抓方向。'],['請求重說',direction,'慢速再說一次；允許指方向確認。'],['問能否走路',minutes===10?ten:five,'回覆可以，補上步行時間。'],['道謝',welcome,'自然結束。']],words:'地點 → 是否聽清楚 → 能否步行 → 道謝',answer:excuse+question+repeat+walk+thanks}));
const quizzes=[{id:'direction',task:'路人說要轉哪邊？',line:right,zh:'請右轉。',options:['左邊','右邊'],correct:1,why:'右（migi）是右邊。'},{id:'minutes',task:'走到車站要幾分鐘？',line:ten,zh:'可以，走路 10 分鐘。',options:['5 分鐘','10 分鐘'],correct:1,why:'十分（jup-pun）是 10 分鐘。'}];
const vocabulary=[['駅','えき · eki','車站','說得出來'],['コンビニ','konbini','便利商店','說得出來'],['トイレ','toire','廁所','說得出來'],['まっすぐ','massugu','直走','先聽得懂'],['左','ひだり · hidari','左','先聽得懂'],['右','みぎ · migi','右','先聽得懂'],['五分','ごふん · go-fun','5 分鐘','先聽得懂'],['十分','じゅっぷん · jup-pun','10 分鐘','先聽得懂']];
for(const [s,r] of vocabulary)readings[s]=r;
module.exports={course,phrases,replies,flows,missions,pairs,quizzes,vocabulary,readings,courtesy:[{en:excuse,zh:'不好意思；用來叫住對方。'},{en:thanks,zh:'謝謝；用來結束這次問路。'}],homeTask:'在商場找廁所，對方說得太快。請他再說一次，聽懂後道謝。先自行選句，不看第二部分。',homeWords:'トイレ／もう一度／ありがとう',homeAnswer:excuse+toilet+repeat+thanks};
