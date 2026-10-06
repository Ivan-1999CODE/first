const d=JSON.parse(JSON.stringify(require('./day0-rounds-data.cjs')));
const prior={key:d.course.id,legacyKeys:[d.previousLesson.key,...d.previousLesson.legacyKeys],missions:d.missions,pairs:d.pairs};
d.previousLesson=prior;d.course.id='travel-lab-day0-rounds-v3';d.course.title='從零開口：日文問路與購物';d.course.description='分 4 個任務練習：問到位置、聽不懂時求助、問價格與數量，再完成付款。可以分幾次練。';d.course.replyRole='路人／店員';d.course.board='依聽到的資訊更新這次的任務卡';
d.legacyFile='original-lessons/travel-japanese-day0-directions.html';
d.course.labels[2]='這輪：跟著完成任務';d.course.labels[4]='這輪：和夥伴真的用';
const add=(id,en,zh,rom,kana)=>{d.phrases.push({id,en,zh,use:zh});d.readings[en]=rom;d.kana[en]=kana;};
d.kana={'駅はどこですか。':'えきは どこですか。','もう一度お願いします。':'もういちど おねがいします。','歩いて行けますか。':'あるいて いけますか。'};
add('excuse','すみません。','開口前，先說不好意思','Sumimasen.','すみません。');
add('thanks','ありがとうございます。','謝謝對方','Arigatō gozaimasu.','ありがとうございます。');
add('slow','ゆっくりお願いします。','請說慢一點','Yukkuri onegai shimasu.','ゆっくり おねがいします。');
add('price','これはいくらですか。','這個多少錢？','Kore wa ikura desu ka.','これは いくらですか。');
add('buy','これをください。','我要這個','Kore o kudasai.','これを ください。');
add('two','これを二つください。','這個我要兩個','Kore o futatsu kudasai.','これを ふたつ ください。');
add('total','全部でいくらですか。','全部多少錢？','Zenbu de ikura desu ka.','ぜんぶで いくらですか。');
add('card','カードで払えますか。','可以刷卡嗎？','Kādo de haraemasu ka.','カードで はらえますか。');
add('cash','現金で払います。','我付現金','Genkin de haraimasu.','げんきんで はらいます。');
add('no-bag','袋は要りません。','不需要袋子','Fukuro wa irimasen.','ふくろは いりません。');
add('yes','はい、お願いします。','好，麻煩你了','Hai, onegai shimasu.','はい、おねがいします。');
const readings={
 '五百円です。':['Gohyaku-en desu.','ごひゃくえんです。'], '三百円です。':['Sanbyaku-en desu.','さんびゃくえんです。'], '千円です。':['Sen-en desu.','せんえんです。'],
 'いくつですか。':['Ikutsu desu ka.','いくつですか。'], '全部で千円です。':['Zenbu de sen-en desu.','ぜんぶで せんえんです。'],
 'カードは使えます。':['Kādo wa tsukaemasu.','カードは つかえます。'], '現金のみです。':['Genkin nomi desu.','げんきんのみです。'], '袋は要りますか。':['Fukuro wa irimasu ka.','ふくろは いりますか。'],
 '二つですね。':['Futatsu desu ne.','ふたつですね。'], 'はい、どうぞ。':['Hai, dōzo.','はい、どうぞ。'], 'これを一つください。':['Kore o hitotsu kudasai.','これを ひとつ ください。'],
 '一つ':['Hitotsu','ひとつ'], '二つ':['Futatsu','ふたつ'], '三百円':['Sanbyaku-en','さんびゃくえん'], '五百円':['Gohyaku-en','ごひゃくえん'], '千円':['Sen-en','せんえん'],
 '現金':['Genkin','げんきん'], 'カード':['Kādo','カード'], '袋':['Fukuro','ふくろ'], 'ゆっくり':['Yukkuri','ゆっくり'], '全部で':['Zenbu de','ぜんぶで'], '駅ですか。':['Eki desu ka.','えきですか。']
};
for(const [jp,[rom,kana]] of Object.entries(readings)){d.readings[jp]=rom;d.kana[jp]=kana;}
const p=id=>d.phrases.find(p=>p.id===id).en;
const q=(id,name,line,zh,options,task,answer,change,changeAnswer)=>({id,name,line,zh,listen:'先抓這次需要的資訊；需要時可慢速或打開文字。',options,correct:0,why:zh,task,words:d.readings[answer]||'先想要買什麼、幾個，或怎麼付款。',answer,change,changeWords:d.readings[changeAnswer]||'想清楚這次不同的條件。',changeAnswer});
d.replies.push(
 q('c-price','聽懂價格','五百円です。','500 日圓。',['500 日圓','300 日圓'],'你願意買眼前這個商品。',p('buy'),'如果沒有聽清楚價格，請對方再說一次。',p('repeat')),
 q('c-quantity','聽懂是在問數量','いくつですか。','要幾個？',['數量','價格'],'你要兩個，說出數量。',p('two'),'改成只要一個。','これを一つください。'),
 q('c-total','聽懂全部的價格','全部で千円です。','全部 1,000 日圓。',['全部 1,000 日圓','每個 1,000 日圓'],'你已聽懂總價，先向店員道謝。',p('thanks'),'如果價格沒有聽清楚，請店員說慢一點。',p('slow')),
 q('d-card','聽懂可以刷卡','カードは使えます。','可以使用卡片。',['可以刷卡','只收現金'],'你聽懂可以刷卡，向店員道謝。',p('thanks'),'沒聽清楚時，請店員重說。',p('repeat')),
 q('d-cash','聽懂只收現金','現金のみです。','只收現金。',['只收現金','只收卡片'],'你有足夠現金，說你付現金。',p('cash'),'如果沒聽清楚，請店員說慢一點。',p('slow')),
 q('d-bag','回應要不要袋子','袋は要りますか。','需要袋子嗎？',['要不要袋子','要不要兩個商品'],'你有自己的袋子，說不用袋子。',p('no-bag'),'這次你需要袋子，請店員提供。',p('yes'))
);
const step=(id,label,line,zh,task,answer,options,askFirst=false)=>({id,label,line,zh,task,answer,words:d.readings[answer]||'先想這次要表達的意思，再用本輪說法。',objects:options.map(x=>['▣',x]),valid:[0],askFirst,effect:'✓ 已更新這次的任務卡。'});
// Keep the three existing routes and add a second location plus four shopping routes.
d.flows.push({id:'a-toilet',name:'A｜換成找廁所',context:'你在商場，想問廁所在哪裡。這次聽到右轉。',generic:true,sceneIcon:'🚻',sceneTitle:'這次的路線',steps:[step('ask-place','廁所方向','右に曲がってください。','請右轉。','先叫住路人，問廁所在哪裡。','すみません。トイレはどこですか。',['→ 右轉','← 左轉'],true),step('thank','道謝','どういたしまして。','不客氣。','你已知道方向，謝謝路人。',p('thanks'),['完成問路'],true)],summary:'改成找便利商店，用同樣的句型再問一次。'});
const shopping=[
 {id:'c-one',name:'C｜問價錢，買一個',context:'你看上一個 500 日圓的小商品，先問價格，再決定買。',steps:[step('price','單價','五百円です。','500 日圓。','指著商品，先問多少錢。',p('price'),['500 日圓','300 日圓'],true),step('buy','購買決定','はい、どうぞ。','好的，給您。','你決定買眼前這個商品。',p('buy'),['買一個','買兩個'],true)]},
 {id:'c-two',name:'C｜買兩個，問總價',context:'同一種小商品每個 500 日圓，你要兩個。',steps:[step('quantity','數量','いくつですか。','要幾個？','你想買兩個。',p('two'),['兩個','一個']),step('total','總價','全部で千円です。','全部 1,000 日圓。','主動問這兩個總共多少錢。',p('total'),['總共 1,000 日圓','總共 500 日圓'],true)]},
 {id:'d-card',name:'D｜可以刷卡，不需要袋子',context:'商品總共 1,000 日圓。你想刷卡，自己已帶袋子。',steps:[step('card','付款方式','カードは使えます。','可以用卡片。','先問能不能刷卡。',p('card'),['可以刷卡','只能付現'],true),step('bag','袋子','袋は要りますか。','需要袋子嗎？','你有自己的袋子，告訴店員不用。',p('no-bag'),['不用袋子','需要袋子']),step('thanks','道謝','ありがとうございます。','謝謝。','完成購物，向店員道謝。',p('thanks'),['完成購物'],true)]},
 {id:'d-cash',name:'D｜只收現金，這次需要袋子',context:'你買的商品 300 日圓，有 1,000 日圓現金。店裡只收現金，你需要袋子。',steps:[step('price','價格','三百円です。','300 日圓。','先問眼前商品多少錢。',p('price'),['300 日圓','500 日圓'],true),step('cash','付款方式','現金のみです。','只收現金。','你有足夠現金，回應店員。',p('cash'),['付現金','刷卡']),step('bag','袋子','袋は要りますか。','需要袋子嗎？','你需要袋子，接受店員提供。',p('yes'),['需要袋子','不用袋子'])]}
];
for(const f of shopping){f.generic=true;f.sceneIcon='🛍';f.sceneTitle='這次的購物卡';f.summary='收起提示，換數量、價錢或付款方式，再試著說一次。';f.desc=f.context;d.flows.push(f);}
const missions=[
 ['a-store','改找便利商店','你不知道便利商店在哪。叫住路人，問位置，聽懂後道謝。','すみません。コンビニはどこですか。ありがとうございます。'],
 ['a-toilet','改找廁所','在商場找廁所，先自己問路，聽到左轉後指出方向並道謝。','すみません。トイレはどこですか。ありがとうございます。'],
 ['b-slow','不是重播按鈕，是主動求助','對方說得太快，你想請他說慢一點，再確認能不能走路去。','ゆっくりお願いします。歩いて行けますか。'],
 ['b-ten','聽不清楚分鐘數','你想走路去車站，聽不清楚要走多久。問能否步行，再主動請對方重說。','歩いて行けますか。もう一度お願いします。'],
 ['c-one','買眼前一個小商品','你在另一家店，指著想買的小商品，問價格，然後說要買這個。','これはいくらですか。これをください。'],
 ['c-two','換成兩個，再問總價','你想買兩個相同的小商品，說數量，再問全部多少錢。','これを二つください。全部でいくらですか。'],
 ['d-card','自己刷卡結帳','你想刷卡，而且不需要袋子。主動問付款方式，回應袋子需求，再道謝。','カードで払えますか。袋は要りません。ありがとうございます。'],
 ['d-cash','換成現金，需要袋子','店員說只收現金，你有足夠現金。告訴店員你付現；他問要不要袋子時，你需要。','現金で払います。はい、お願いします。ありがとうございます。']
];
d.missions=missions.map(([id,name,task,answer])=>({id,name,task,answer,words:'先想目前要問位置、求助、買東西，還是回應付款。',check:'有依這次情境選對用途，並說清楚需要嗎？單字、短句或羅馬字都可以。'}));
d.rounds=[
 {id:'A',name:'開口問位置',goal:'問到位置，聽出左右，再道謝。',phraseIds:['excuse','where','thanks'],replyIds:[0,1,2],flowIds:[0,3],missionIds:[0,1],pairIds:[0],reuse:[],role:'路人',words:[['駅','車站'],['左','← 左邊'],['右','右邊 →'],['トイレ','廁所']]},
 {id:'B',name:'聽不清楚，也能繼續問',goal:'請重說或說慢一點，再確認能否步行。',phraseIds:['repeat','slow','walk'],replyIds:[3,4,5],flowIds:[1,2],missionIds:[2,3],pairIds:[1],reuse:[3,4],role:'路人',words:[['まっすぐ','↑ 直走'],['五分','5 分鐘'],['十分','10 分鐘'],['ゆっくり','慢一點']]},
 {id:'C',name:'問價格，說出數量',goal:'問單價、說要買幾個，再確認總價。',phraseIds:['price','buy','two','total'],replyIds:[6,7,8],flowIds:[4,5],missionIds:[4,5],pairIds:[2],reuse:[1,3,4],role:'店員',words:[['三百円','300 日圓'],['五百円','500 日圓'],['千円','1,000 日圓'],['一つ','一個'],['二つ','兩個']]},
 {id:'D',name:'付款並回應店員',goal:'問能否刷卡，聽懂只收現金，回答要不要袋子。',phraseIds:['card','cash','no-bag','yes'],replyIds:[9,10,11],flowIds:[6,7],missionIds:[6,7],pairIds:[3],reuse:[1,4],role:'店員',words:[['カード','卡片'],['現金','現金'],['袋','袋子']]}
].map(r=>({...r,bridge:'先把聲音和意思連起來；需要時看假名與羅馬字，再試著自己說。'}));
d.pairs=d.rounds.map(r=>{const f=d.flows[r.flowIds[0]],m=d.missions[r.missionIds[0]],second=d.missions[r.missionIds[1]],first=f.steps[0];return {id:'task-'+r.id,name:r.id+'｜'+r.name,first:'學生',role:`學生當旅客，老師或夥伴當${r.role}；共看畫面。`,opening:{A:'不好意思，車站在哪裡？',B:'不好意思，便利商店在哪裡？',C:'這個多少錢？',D:'可以刷卡嗎？'}[r.id],next:r.goal+' 完成後再試：'+second.task,objects:f.context,goals:[r.goal,'換一個條件仍能開口','需要時主動求助'],tags:f.context+' 第二趟：'+d.flows[r.flowIds[1]].context,cards:r.flowIds.flatMap(id=>d.flows[id].steps.map(t=>[t.task,t.line,t.zh])),words:m.words,answer:m.answer};});
d.support=[d.phrases.find(p=>p.id==='repeat'),d.phrases.find(p=>p.id==='slow')];
d.course.skills=d.rounds.map(r=>({id:'task-'+r.id,text:'我能'+r.name+'。'}));
d.reviewTasks=d.rounds.map(r=>({...d.missions[r.missionIds[1]],id:r.id,name:r.name}));
d.quizzes=d.rounds.map(r=>{const q=d.replies[r.replyIds.at(-1)];return {...q,id:'review-'+r.id,task:r.name+'：再聽一次'};});
// Preview every response used by this round, including the alternate route/time.
for(const r of d.rounds){
 const lines=new Map(),addLine=t=>{if(!lines.has(t.line))lines.set(t.line,{en:t.line,zh:t.zh});};
 for(const id of r.flowIds){const f=d.flows[id];for(const t of f.steps){
  addLine(t);
  if(!f.generic&&/[左右]/.test(t.line))addLine({line:t.line.replace(/[左右]/g,x=>x==='左'?'右':'左'),zh:t.zh.replace(/[左右]/g,x=>x==='左'?'右':'左')});
  if(!f.generic&&t.id==='walk')addLine({line:'はい。歩いて五分です。',zh:'可以，走路 5 分鐘。'});
 }}
 for(const id of r.replyIds)addLine(d.replies[id]);
 r.hearLines=[...lines.values()];
}
module.exports=d;
