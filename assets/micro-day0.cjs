const {compile}=require('./micro-curriculum.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
function makeLegacy(language){
 const ko=language==='ko',base=clone(require(ko?'./korean-day0-data.cjs':'./day0-expanded.cjs'));
 const text=(ja,kr)=>ko?kr:ja,station=ko?'地鐵站':'車站';
 const S=(label,answer,answerZh,line,zh,task,options,askFirst=true)=>({id:label,label,answer,answerZh,line,zh,task,words:answer,objects:options.map(x=>['▣',x]),valid:[0],askFirst,effect:'✓ 已更新這一步的資訊，沿用同一句再練習。'});
 const greeting=S('禮貌叫住對方',text('すみません。','저기요.'),'不好意思。',text('はい。','네.'),'是的。','你需要引起對方注意，先禮貌叫住他。',['對方已注意到你','對方還沒聽到']);
 const thanks=S('向對方道謝',text('ありがとうございます。','감사합니다.'),'謝謝您。',text('どういたしまして。','아니에요.'),'不客氣。','對方已經幫忙，向他道謝。',['謝謝對方，結束交談','還在叫住對方']);
 const ask=S('問車站在哪裡',text('駅はどこですか。','지하철역은 어디예요?'),station+'在哪裡？',text('左に曲がってください。','왼쪽으로 가세요.'),ko?'請往左走。':'請左轉。',`你要去${station}，問位置。`,['往左走','往右走']);
 const walk=S('問能不能走路',text('歩いて行けますか。','걸어서 갈 수 있어요?'),'可以走路去嗎？',text('はい。歩いて十分です。','네. 걸어서 십 분 걸려요.'),'可以，走路要 10 分鐘。','你已知道方向，接著問能不能走路。',['走路 10 分鐘','走路 5 分鐘']);
 const repeat=S('請再說一次',text('もう一度お願いします。','다시 한 번 말해 주세요.'),'請再說一次。',text('右に曲がってください。','오른쪽으로 가세요.'),ko?'請往右走。':'請右轉。','剛才沒聽清楚，請對方重說。',['往右走','往左走']);
 const slow=S('請說慢一點',text('ゆっくりお願いします。','천천히 말해 주세요.'),'請說慢一點。',repeat.line,repeat.zh,'你仍覺得太快，再請對方說慢一點。',['已放慢重聽右邊','聽到左邊']);
 const price=S('問眼前商品價格',text('これはいくらですか。','이거 얼마예요?'),'這個多少錢？',text('五百円です。','오천 원이에요.'),ko?'5,000 韓元。':'500 日圓。','指著眼前一件商品，先問價格。',[ko?'5,000 韓元':'500 日圓',ko?'3,000 韓元':'300 日圓']);
 const buy=S('決定買眼前商品',text('これをください。','이거 주세요.'),'我要這個。',text('はい、どうぞ。','네, 여기요.'),'好的，給您。','價格可以接受，告訴店員要買眼前這件。',['買眼前這件','先不買']);
 const two=S('說要買兩個',text('これを二つください。','이거 두 개 주세요.'),'這個我要兩個。',text('いくつですか。','몇 개 드릴까요?'),'要幾個？','店員問數量，你要買兩個。',['兩個','一個'],false);
 const total=S('詢問總價',text('全部でいくらですか。','다 해서 얼마예요?'),'總共多少錢？',text('全部で千円です。','다 해서 만 원이에요.'),ko?'總共 10,000 韓元。':'總共 1,000 日圓。','問這兩個商品的總價。',[ko?'總共 10,000 韓元':'總共 1,000 日圓',ko?'總共 5,000 韓元':'總共 500 日圓']);
 const card=S('詢問能不能刷卡',text('カードで払えますか。','카드로 계산할 수 있어요?'),'可以刷卡嗎？',text('現金のみです。','현금만 돼요.'),'只收現金。','商品已選好，你先問能不能刷卡。',['只收現金','可以刷卡']);
 const cash=S('說明改付現金',text('現金で払います。','현금으로 할게요.'),'我付現金。',text('はい。','네.'),'好的。','你有足夠現金，告訴店員付現金。',['付現金','刷卡']);
 const bag=S('婉拒袋子',text('袋は要りません。','봉투는 괜찮아요.'),'不需要袋子。',text('袋は要りますか。','봉투 필요하세요?'),'需要袋子嗎？','店員問需不需要袋子，你有自己的袋子，禮貌婉拒。',['不要袋子','需要袋子'],false);
 const accept={...bag,answer:text('はい、お願いします。','네, 주세요.'),answerZh:'好，麻煩給我。',task:'這次沒有自備袋子，你需要袋子。',label:'接受袋子',objects:[['▣','需要袋子'],['▣','不要袋子']]};
 const tasks=[
  {key:'polite',name:'叫住對方與道謝',role:'路人',context:'請路人注意你；你已用手上的地圖指明需求，對方幫忙後再向他道謝。這輪只練開頭和結尾。',steps:[greeting,thanks],variation:{task:'把幫忙的人換成店員；你已指明眼前商品，同樣先叫住對方，協助後道謝。',steps:[greeting,thanks]},changeNote:'把原本附加在每題的開頭與道謝獨立教，不再增加其他任務的必說句。'},
  {key:'find-walk',name:'問位置與步行',role:'路人',context:`你想去${station}。先問位置，路人說往左走，再問能不能走路；路人說走路要 10 分鐘。`,steps:[ask,walk],variation:{task:'只把目的地換成便利商店，方向與步行時間不變。先問位置，再問能不能走路。',steps:[{...ask,answer:text('コンビニはどこですか。','편의점은 어디예요?'),answerZh:'便利商店在哪裡？',task:'問便利商店在哪裡。'},walk]},changeNote:'問位置和步行固定兩句；目的地替換先在第二部分教過。'},
  {key:'repair',name:'請重說與放慢',role:'路人',context:'你已問過路，卻沒聽清楚。先請對方再說一次；還是太快時，再請他說慢一點。本輪的路線是往右走。',steps:[repeat,slow],variation:{task:'只把路線改成往左走；你的兩句求助說法不變。',steps:[{...repeat,line:ask.line,zh:ask.zh,objects:ask.objects},{...slow,line:ask.line,zh:ask.zh,objects:ask.objects}]},changeNote:'不再同輪加問目的地、步行和道謝；反覆使用重說與放慢兩句。'},
  {key:'price-buy',name:'問價格與購買',role:'店員',context:`你想買眼前一個杯子，先問價格；每個${ko?' 5,000 韓元':' 500 日圓'}，你可以接受，決定買一個。金額為練習設定。`,steps:[price,buy],variation:{task:`只把商品換成明信片，價格仍為${ko?' 5,000 韓元':' 500 日圓'}。同樣先問價格，再決定買一個。`,steps:[price,buy]},changeNote:'問價和決定購買固定兩句，不加入數量、袋子或付款方式。'},
  {key:'quantity-total',name:'說數量與問總價',role:'店員',context:`每個商品${ko?' 5,000 韓元':' 500 日圓'}。店員問要幾個，你要兩個，再問總價；總共${ko?' 10,000 韓元':' 1,000 日圓'}。金額為練習設定。`,steps:[two,total],variation:{task:`只把數量換成一個，單價不變。說數量後問總價，這次總共${ko?' 5,000 韓元':' 500 日圓'}。`,steps:[{...two,answer:text('これを一つください。','이거 한 개 주세요.'),answerZh:'這個我要一個。',task:'你只要一個，告訴店員。',objects:[['▣','一個'],['▣','兩個']]},{...total,line:price.line,zh:price.zh,task:'問一個商品的總價。',objects:price.objects}]},changeNote:'每件價格、數量與總價保持一致；一個／兩個的替換在第二部分先明示。'},
  {key:'payment',name:'問刷卡與改付現金',role:'店員',context:'商品和金額已確認。你先問能不能刷卡，店員說只收現金；你有足夠現金，改付現金。',steps:[card,cash],variation:{task:'只把店家的付款規定換成可以刷卡；你仍選擇付現金，兩句說法不變。',steps:[{...card,line:text('カードは使えます。','카드 돼요.'),zh:'可以刷卡。',objects:[['▣','可以刷卡'],['▣','只收現金']]},cash]},changeNote:'付款不再夾帶問價、袋子和道謝；先教兩種付款規定的回覆。'},
  {key:'bag',name:'回應需不需要袋子',role:'店員',context:'你已買完東西。店員問需不需要袋子，你有自己的袋子，禮貌告訴他不需要。',steps:[bag],variation:{task:'只改成沒有自備袋子；這次接受店員提供的袋子。',steps:[accept]},changeNote:'先練婉拒，第二部分先學需要袋子時的替換回答；後面不再突然考新的接受用語。'}
 ];
 const d=compile(base,tasks);
 // Reuse existing recorded utterances and readings; no new voice is required.
 if(!ko){
  d.day0GlossaryData=require('./day0-glossary-data.cjs');
  d.day0AudioTranslations=require('./day0-audio-translations.cjs')(base,Object.keys(require('./day0-audio/manifest.json')),{allowUnknown:true});
 }
 return d;
}
function make(language,options={}){
 const base=makeLegacy(language);
 return options.legacy?base:require('./day0-practical.cjs').make(language,base);
}
module.exports={make};
