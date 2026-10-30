// Practical Japanese/Korean travel tasks. The original course is retained as
// history; each new task is compiled into the existing seven-part lesson flow.
const {compile}=require('./micro-curriculum.cjs');
const clone=value=>JSON.parse(JSON.stringify(value));

function make(language,base){
 if(!['ja','ko'].includes(language))throw Error('Unsupported practical lesson language: '+language);
 const old=clone(base),ko=language==='ko',lexicon={};
 const pick=(ja,kr)=>ko?kr:ja;
 // Each row has its own complete reading. It is also used by audio generation;
 // pronunciation aids never stand in for an unavailable recording.
 const add=(zh,ja,jrom,jkana,kr,krom,koZh=zh)=>{
  const text=pick(ja,kr);
  lexicon[text]={zh:ko?koZh:zh,romaji:pick(jrom,krom),...ko?{}:{kana:jkana}};
  return text;
 };
 const v={
  price:add('這個多少錢？','これはいくらですか。','Kore wa ikura desu ka.','これは いくらですか。','이거 얼마예요?','Igeo eolmayeyo?'),
  buy:add('我要這個。','これをください。','Kore o kudasai.','これを ください。','이거 주세요.','Igeo juseyo.'),
  price500:add('500 日圓。','五百円です。','Gohyaku-en desu.','ごひゃくえんです。','오천 원이에요.','Ocheon wonieyo.','5,000 韓元。'),
  price300:add('300 日圓。','三百円です。','Sanbyaku-en desu.','さんびゃくえんです。','삼천 원이에요.','Samcheon wonieyo.','3,000 韓元。'),
  give:add('好的，給您。','はい、どうぞ。','Hai, dōzo.','はい、どうぞ。','네, 여기요.','Ne, yeogiyo.'),
  yes:add('好的。','はい。','Hai.','はい。','네.','Ne.'),
  quantity:add('要幾個？','いくつですか。','Ikutsu desu ka.','いくつですか。','몇 개 드릴까요?','Myeot gae deurilkkayo?'),
  two:add('這個我要兩個。','これを二つください。','Kore o futatsu kudasai.','これを ふたつ ください。','이거 두 개 주세요.','Igeo du gae juseyo.'),
  one:add('這個我要一個。','これを一つください。','Kore o hitotsu kudasai.','これを ひとつ ください。','이거 한 개 주세요.','Igeo han gae juseyo.'),
  total:add('總共多少錢？','全部でいくらですか。','Zenbu de ikura desu ka.','ぜんぶで いくらですか。','다 해서 얼마예요?','Da haeseo eolmayeyo?'),
  total1000:add('總共 1,000 日圓。','全部で千円です。','Zenbu de sen-en desu.','ぜんぶで せんえんです。','다 해서 만 원이에요.','Da haeseo man wonieyo.','總共 10,000 韓元。'),
  cardQuestion:add('可以刷卡嗎？','カードで払えますか。','Kādo de haraemasu ka.','カードで はらえますか。','카드로 계산할 수 있어요?','Kadeuro gyesanhal su isseoyo?'),
  cardYes:add('可以刷卡。','カードは使えます。','Kādo wa tsukaemasu.','カードは つかえます。','카드 돼요.','Kadeu dwaeyo.'),
  cashOnly:add('只收現金。','現金のみです。','Genkin nomi desu.','げんきんのみです。','현금만 돼요.','Hyeongeumman dwaeyo.'),
  payCard:add('我刷卡。','カードで払います。','Kādo de haraimasu.','カードで はらいます。','카드로 할게요.','Kadeuro halgeyo.'),
  payCash:add('我付現金。','現金で払います。','Genkin de haraimasu.','げんきんで はらいます。','현금으로 할게요.','Hyeongeumeuro halgeyo.'),
  bagQuestion:add('需要袋子嗎？','袋は要りますか。','Fukuro wa irimasu ka.','ふくろは いりますか。','봉투 필요하세요?','Bongtu piryohaseyo?'),
  bagNo:add('不需要袋子。','袋は要りません。','Fukuro wa irimasen.','ふくろは いりません。','봉투는 괜찮아요.','Bongtuneun gwaenchanayo.'),
  bagYes:add('好，麻煩給我。','はい、お願いします。','Hai, onegai shimasu.','はい、おねがいします。','네, 주세요.','Ne, juseyo.'),
  menu:add('請給我菜單。','メニューをください。','Menyū o kudasai.','メニューを ください。','메뉴 주세요.','Menyu juseyo.'),
  partyQuestion:add('請問幾位？','何名様ですか。','Nanmei-sama desu ka.','なんめいさまですか。','몇 분이세요?','Myeot buniseyo?'),
  partyTwo:add('兩位。','二人です。','Futari desu.','ふたりです。','두 명이요.','Du myeong-iyo.'),
  partyOne:add('一位。','一人です。','Hitori desu.','ひとりです。','한 명이요.','Han myeong-iyo.'),
  dineQuestion:add('內用嗎？','店内でお召し上がりですか。','Tennai de omeshiagari desu ka.','てんないで おめしあがりですか。','드시고 가세요?','Deusigo gaseyo?'),
  dineIn:add('我要內用。','店内でお願いします。','Tennai de onegai shimasu.','てんないで おねがいします。','먹고 갈게요.','Meokgo galgeyo.'),
  takeOut:add('我要外帶。','持ち帰りでお願いします。','Mochikaeri de onegai shimasu.','もちかえりで おねがいします。','포장해 주세요.','Pojanghae juseyo.'),
  toilet:add('廁所在哪裡？','トイレはどこですか。','Toire wa doko desu ka.','トイレは どこですか。','화장실은 어디예요?','Hwajangsireun eodiyeyo?'),
  exit:add('出口在哪裡？','出口はどこですか。','Deguchi wa doko desu ka.','でぐちは どこですか。','출구는 어디예요?','Chulguneun eodiyeyo?'),
  rightPlace:add('在右邊。','右です。','Migi desu.','みぎです。','오른쪽이에요.','Oreunjjogieyo.'),
  leftPlace:add('在左邊。','左です。','Hidari desu.','ひだりです。','왼쪽이에요.','Oenjjogieyo.'),
  straight:add('請直走。','まっすぐ行ってください。','Massugu itte kudasai.','まっすぐ いってください。','쭉 가세요.','Jjuk gaseyo.'),
  phoneRoute:add('要怎麼去這裡？','ここへはどう行けばいいですか。','Koko e wa dō ikeba ii desu ka.','ここへは どう いけば いいですか。','여기 어떻게 가요?','Yeogi eotteoke gayo?'),
  turnLeft:add('請左轉。','左に曲がってください。','Hidari ni magatte kudasai.','ひだりに まがってください。','왼쪽으로 가세요.','Oenjjogeuro gaseyo.','請往左走。'),
  turnRight:add('請右轉。','右に曲がってください。','Migi ni magatte kudasai.','みぎに まがってください。','오른쪽으로 가세요.','Oreunjjogeuro gaseyo.','請往右走。'),
  confirmLeft:add('是左邊，對嗎？','左ですね。','Hidari desu ne.','ひだりですね。','왼쪽이요?','Oenjjogiyo?'),
  confirmRight:add('是右邊，對嗎？','右ですね。','Migi desu ne.','みぎですね。','오른쪽이요?','Oreunjjogiyo?'),
  excuse:add('不好意思，借問一下。','すみません。','Sumimasen.','すみません。','저기요.','Jeogiyo.'),
  thanks:add('謝謝您。','ありがとうございます。','Arigatō gozaimasu.','ありがとうございます。','감사합니다.','Gamsahamnida.'),
  repeat:add('請再說一次。','もう一度お願いします。','Mō ichido onegai shimasu.','もういちど おねがいします。','다시 한 번 말해 주세요.','Dasi han beon malhae juseyo.'),
  slow:add('請說慢一點。','ゆっくりお願いします。','Yukkuri onegai shimasu.','ゆっくり おねがいします。','천천히 말해 주세요.','Cheoncheonhi malhae juseyo.')
 };
 // Reuse the exact text of the already-recorded two-instruction routes.
 v.routeLeft=add('請直走，再左轉。',v.straight+v.turnLeft,'Massugu itte kudasai. Hidari ni magatte kudasai.','まっすぐ いってください。ひだりに まがってください。',v.straight+' '+v.turnLeft,'Jjuk gaseyo. Oenjjogeuro gaseyo.','請直走，再往左走。');
 v.routeRight=add('請直走，再右轉。',v.straight+v.turnRight,'Massugu itte kudasai. Migi ni magatte kudasai.','まっすぐ いってください。みぎに まがってください。',v.straight+' '+v.turnRight,'Jjuk gaseyo. Oreunjjogeuro gaseyo.','請直走，再往右走。');
 const w={
  this:add('這個','これ','kore','これ','이거','igeo'),
  price:add('多少錢','いくら','ikura','いくら','얼마','eolma'),
  give:add('請給我','ください','kudasai','ください','주세요','juseyo'),
  one:add('一個','一つ','hitotsu','ひとつ','한 개','han gae'),
  two:add('兩個','二つ','futatsu','ふたつ','두 개','du gae'),
  total:add('總共','全部で','zenbu de','ぜんぶで','다 해서','da haeseo'),
  price500:add('500 日圓','五百円','gohyaku-en','ごひゃくえん','오천 원','ocheon won','5,000 韓元'),
  card:add('卡片','カード','kādo','カード','카드','kadeu'),
  cash:add('現金','現金','genkin','げんきん','현금','hyeongeum'),
  bag:add('袋子','袋','fukuro','ふくろ','봉투','bongtu'),
  yes:add('好的／是的','はい','hai','はい','네','ne'),
  menu:add('菜單','メニュー','menyū','メニュー','메뉴','menyu'),
  personOne:add('一位','一人','hitori','ひとり','한 명','han myeong'),
  personTwo:add('兩位','二人','futari','ふたり','두 명','du myeong'),
  dineIn:add('店內／內用','店内','tennai','てんない','매장','maejang'),
  takeOut:add('外帶','持ち帰り','mochikaeri','もちかえり','포장','pojang'),
  toilet:add('廁所','トイレ','toire','トイレ','화장실','hwajangsil'),
  exit:add('出口','出口','deguchi','でぐち','출구','chulgu'),
  where:add('哪裡','どこ','doko','どこ','어디','eodi'),
  right:add('右邊','右','migi','みぎ','오른쪽','oreunjjok'),
  left:add('左邊','左','hidari','ひだり','왼쪽','oenjjok'),
  straight:add('直走','まっすぐ','massugu','まっすぐ','쭉','jjuk'),
  here:add('這裡','ここ','koko','ここ','여기','yeogi'),
  map:add('地圖','地図','chizu','ちず','지도','jido')
 };
 const meaning=text=>lexicon[text]?.zh||old.day0AudioTranslations?.[text]||old.answerTranslations?.[text];
 const wordList=(...ids)=>ids.map(id=>[w[id],meaning(w[id])]);
 const step=(label,answer,line,task,options,askFirst=true,extra={})=>({
  label,answer,answerZh:meaning(answer),line,zh:meaning(line),task,
  words:lexicon[answer].romaji,objects:options.map(label=>['▣',label]),valid:[0],askFirst,
  effect:'✓ 已確認這一步；用同樣的說法繼續完成任務。',...extra
 });
 const chapter=(id,name,order,position,description)=>({id,name,order,position,description});
 const priceUnit=ko?'5,000 韓元':'500 日圓',priceLow=ko?'3,000 韓元':'300 日圓',priceTotal=ko?'10,000 韓元':'1,000 日圓';
 const priceStep=step('問眼前商品多少錢',v.price,v.price500,'指著想買的杯子，先問價格。',[priceUnit,priceLow]);
 const buyStep=step('決定買眼前商品',v.buy,v.give,'你可以接受這個價格，告訴店員要買眼前這個。',['買眼前這件','先不買']);
 const quantityStep=step('說要買兩個',v.two,v.quantity,'店員問數量；這個商品你要兩個。',['兩個','一個'],false);
 const totalStep=step('確認全部的價格',v.total,v.total1000,'每個 '+priceUnit+'，兩個一起買，問總價。',[priceTotal,priceUnit]);
 const cardStep=step('詢問能不能刷卡',v.cardQuestion,v.cardYes,'你想刷卡，先問店員可不可以。',['可以刷卡','只收現金']);
 const payCardStep=step('表示要刷卡',v.payCard,v.yes,'店員說可以刷卡，告訴他你要刷卡。',['刷卡','付現金']);
 const bagStep=step('婉拒袋子',v.bagNo,v.bagQuestion,'店員問需不需要袋子；你有自己的袋子，婉拒。',['不需要袋子','需要袋子'],false);
 const menuStep=step('請店員提供菜單',v.menu,v.give,'你已入座，桌上沒有菜單；先請店員提供。',['接過菜單','拿取外帶袋']);
 const orderStep=step('指著菜單點餐',v.buy,v.yes,'你在菜單上選好一份餐點，指給店員看並點這一道。',['點指著的這道餐點','再看一下']);
 const partyStep=step('回答兩位用餐',v.partyTwo,v.partyQuestion,'你和一位旅伴共兩人；店員問幾位，回答兩位。',['兩位','一位'],false);
 const dineStep=step('回答要內用',v.dineIn,v.dineQuestion,'店員問內用嗎；你要留在店裡吃，回答內用。',['內用','外帶'],false);
 const toiletStep=step('問廁所在哪裡',v.toilet,v.rightPlace,'你在商場想找廁所；先問位置，再聽出方向。',['右邊 →','← 左邊']);
 const exitStep=step('問出口在哪裡',v.exit,v.straight,'你要離開商場，問出口的位置，再聽懂對方指示。',['直走 ↑','右轉 →']);
 const routeStep=step('指著手機問怎麼去',v.phoneRoute,v.routeLeft,'手機地圖已標出你要去的餐廳；把畫面給路人看，問怎麼去。',['直走，再往左走 ↑←','直走，再往右走 ↑→']);
 const confirmStep=step('重複方向確認',v.confirmLeft,v.yes,'依剛才聽到的轉向，用短句確認自己沒聽錯。',['已確認左邊','改走右邊']);
 const tasks=[
  {key:'practical-price-buy',name:'問價錢，再買這個',role:'店員',icon:'🛍',chapter:chapter('price','問價與購買',1,1,'先從眼前商品開始，聽懂價格，再決定購買。'),
   context:'你想買一個杯子。先問清楚價格，再告訴店員你要這個。聽完回覆後，選出店員說的金額。金額為練習設定。',steps:[priceStep,buyStep],words:wordList('this','price','price500'),
   variation:{task:`同一個杯子這次降價成 ${priceLow}，你仍決定買一個；先問價，再說要這個。`,steps:[{...priceStep,line:v.price300,zh:meaning(v.price300),objects:[['▣',priceLow],['▣',priceUnit]]},buyStep]},
   changeNote:'把問價格與購買放在第一個任務；先聽兩種已教過的金額，再用同一句決定購買。'},
  {key:'practical-quantity-total',name:'說幾個，再問總價',role:'店員',icon:'🛍',chapter:chapter('quantity','數量與總價',2,1,'把基本數字和購物的「一個、兩個」分清楚。'),
   context:`每個杯子 ${priceUnit}。店員問要幾個，你要兩個，再問總價，確認這次要付多少。金額為練習設定。`,steps:[quantityStep,totalStep],words:wordList('one','two','total'),
   variation:{task:`只把數量換成一個，每個仍是 ${priceUnit}；回答一個，再問總價。`,steps:[{...quantityStep,label:'改說要買一個',answer:v.one,answerZh:meaning(v.one),words:lexicon[v.one].romaji,task:'這次你只要一個，告訴店員。',objects:[['▣','一個'],['▣','兩個']]},{...totalStep,line:v.price500,zh:meaning(v.price500),task:'這次只買一個，問這次要付多少錢。',objects:[['▣',priceUnit],['▣',priceTotal]]}]},
   changeNote:'數量由兩個換成一個，總價隨數量改變；單價保持一致。'},
  {key:'practical-payment',name:'問刷卡，依回覆付款',role:'店員',icon:'💳',chapter:chapter('payment','付款',3,1,'先確認付款方式，再回應需不需要袋子。'),
   context:'商品與金額已確認。你想先刷卡，也帶了足夠現金。先問能否刷卡，聽店員回覆後決定付款方式，再告訴他。',steps:[cardStep,payCardStep],words:wordList('card','cash'),variationMode:'core',
   variation:{task:'另一家店只收現金，你有足夠現金。先問能否刷卡，聽到限制後改付現金。',listeningContext:'這次換到另一家店，商品與金額已確認。你想先刷卡，也帶了足夠現金；先問能否刷卡，聽店員回覆後決定付款方式，再告訴他。',steps:[{...cardStep,line:v.cashOnly,zh:meaning(v.cashOnly),objects:[['▣','只收現金'],['▣','可以刷卡']]},{...payCardStep,label:'改用現金付款',answer:v.payCash,answerZh:meaning(v.payCash),words:lexicon[v.payCash].romaji,task:'依剛才聽到的付款規定，告訴店員你決定使用的方式。',objects:[['▣','付現金'],['▣','刷卡']]}]},
   changeNote:'可以刷卡時選刷卡，只收現金時改付現金；兩種完整接話先在第二部分教過。'},
  {key:'practical-bag',name:'回答要不要袋子',role:'店員',icon:'🛍',chapter:chapter('payment','付款',3,2,'先確認付款方式，再回應需不需要袋子。'),
   context:'結帳時店員問需不需要袋子。你已帶自己的袋子，告訴他不需要。',steps:[bagStep],words:wordList('bag','yes'),variationMode:'core',
   variation:{task:'這次沒有自備袋子，你需要店員提供；聽到同一個問題後接受袋子。',steps:[{...bagStep,label:'接受袋子',answer:v.bagYes,answerZh:meaning(v.bagYes),words:lexicon[v.bagYes].romaji,task:'你沒有自備袋子，請店員給你袋子。',objects:[['▣','需要袋子'],['▣','不需要袋子']]}]},
   changeNote:'把袋子問題留作付款章的獨立一句任務，接受與婉拒都先教再練。'},
  {key:'practical-order',name:'拿菜單，指著點餐',role:'店員',icon:'🍽',chapter:chapter('dining','餐飲',4,1,'分別練點餐、人數和內用外帶，不一次塞進長對話。'),
   context:'你已入座，桌上沒有菜單。先請店員給菜單，再指著選好的一份主餐，告訴店員要這個。',steps:[menuStep,orderStep],words:wordList('menu','this','give'),
   variation:{task:'只把選的餐點換成菜單上的甜點，仍先拿菜單，再指著甜點說要這個。',steps:[menuStep,{...orderStep,task:'你已選好一份甜點，指著菜單上的甜點點餐。',objects:[['▣','點指著的甜點'],['▣','再看一下']]}]},
   changeNote:'重用購物的「我要這個」，加上要菜單；餐點替換不另增加新句型。'},
  {key:'practical-party',name:'聽到幾位，回答人數',role:'店員',icon:'🍽',chapter:chapter('dining','餐飲',4,2,'分別練點餐、人數和內用外帶，不一次塞進長對話。'),
   context:'你和一位旅伴走進餐廳，共兩位。店員先問幾位，回答兩位就好。',steps:[partyStep],words:wordList('personOne','personTwo'),
   variation:{task:'這次你一個人進餐廳，店員問同一個問題；回答一位。',steps:[{...partyStep,label:'回答一位用餐',answer:v.partyOne,answerZh:meaning(v.partyOne),words:lexicon[v.partyOne].romaji,task:'這次只有你自己，回答一位。',objects:[['▣','一位'],['▣','兩位']]}]},
   changeNote:'人數單獨練一位與兩位，明確區分人數、物品數量和基本數字。'},
  {key:'practical-dine-mode',name:'回答內用或外帶',role:'店員',icon:'🥡',chapter:chapter('dining','餐飲',4,3,'分別練點餐、人數和內用外帶，不一次塞進長對話。'),
   context:'餐點已選好，店員問是不是內用。你打算在店裡吃，告訴他要內用。',steps:[dineStep],words:wordList('dineIn','takeOut'),variationMode:'core',
   variation:{task:'餐點不變，但這次要帶回飯店吃。店員仍問內用嗎，請回答要外帶。',steps:[{...dineStep,label:'回答要外帶',answer:v.takeOut,answerZh:meaning(v.takeOut),words:lexicon[v.takeOut].romaji,task:'你要把餐點帶走，回答外帶。',objects:[['▣','外帶'],['▣','內用']]}]},
   changeNote:'先聽懂店員的內用問題，再選自己的需求；內用與外帶兩種回答都可操作。'},
  {key:'practical-toilet',name:'找廁所，聽懂左右',role:'工作人員',icon:'🚻',chapter:chapter('places','找位置',5,1,'先練廁所和出口，用短指示找到眼前的位置。'),
   context:'你在商場想找廁所，問工作人員在哪裡；聽完回覆後，指出他說的方向。',steps:[toiletStep],words:wordList('toilet','where','right','left'),
   variation:{task:'另一個商場的廁所在左邊；你問同一句，這次聽懂左邊。',steps:[{...toiletStep,line:v.leftPlace,zh:meaning(v.leftPlace),objects:[['▣','← 左邊'],['▣','右邊 →']]}]},
   changeNote:'以廁所取代固定問車站，先聽懂左右；不要求背長串路線。'},
  {key:'practical-exit',name:'找出口，聽懂指示',role:'工作人員',icon:'🚪',chapter:chapter('places','找位置',5,2,'先練廁所和出口，用短指示找到眼前的位置。'),
   context:'你要離開商場，問工作人員出口在哪裡；聽完回覆後，依指示選方向。',steps:[exitStep],words:wordList('exit','where','straight','right'),
   variation:{task:'只換出口方向：這次工作人員說在右邊。仍問出口在哪裡，聽懂後選右邊。',steps:[{...exitStep,line:v.rightPlace,zh:meaning(v.rightPlace),objects:[['▣','右邊 →'],['▣','直走 ↑']]}]},
   changeNote:'沿用問位置句型換成出口；本輪只聽一個方向，避免和完整問路混在一起。'},
  {key:'practical-phone-route',name:'指著手機問路，再確認',role:'路人',icon:'🗺',chapter:chapter('phone-route','指手機問路',6,1,'用手機地圖指出目的地，串起已學過的直走和左右，再用短句確認。'),
   context:'手機地圖標出你要去的餐廳。把畫面給路人看，問怎麼去；聽完路線後，用短句確認該往哪邊轉。',steps:[routeStep,confirmStep],words:wordList('here','map','left','right'),
   variation:{task:'目的地與問法不變，只把直走後的方向換成往右；聽到直走、再往右後，重複右邊確認。',steps:[{...routeStep,line:v.routeRight,zh:meaning(v.routeRight),objects:[['▣','直走，再往右走 ↑→'],['▣','直走，再往左走 ↑←']]},{...confirmStep,answer:v.confirmRight,answerZh:meaning(v.confirmRight),words:lexicon[v.confirmRight].romaji,task:'依剛才聽到的轉向，用短句再次確認。',objects:[['▣','已確認右邊'],['▣','改走左邊']]}]},
   changeNote:'用指著手機的通用問路句取代特定車站名稱；串起前一章學過的直走和左右，確認句與兩種路線先示範。'}
 ];
 // The first hint is a small cue, never a complete romanized answer.
 // The second hint keeps the full answer and its separately authored reading.
 const hints=new Map([
  [v.price,pick('これ／いくら','이거／얼마')],
  [v.buy,'指著選好的這個／表達購買或點餐決定'],
  [v.two,'這個／兩個'],[v.one,'這個／一個'],[v.total,'總共／多少錢'],
  [v.cardQuestion,'卡片／可不可以'],[v.payCard,'表示決定用卡片付款'],[v.payCash,'表示決定付現金'],
  [v.bagNo,'已自備袋子／婉拒'],[v.bagYes,'沒有自備袋子／接受'],
  [v.menu,pick('メニュー／請給我','메뉴／請給我')],
  [v.partyTwo,'兩位（你和一位旅伴）'],[v.partyOne,'一位（只有自己）'],
  [v.dineIn,'在店裡吃'],[v.takeOut,'把餐點帶走'],
  [v.toilet,pick('トイレ／どこ','화장실／어디')],
  [v.exit,pick('出口／どこ','출구／어디')],
  [v.phoneRoute,pick('ここ／怎麼去','여기／怎麼去')],
  [v.confirmLeft,'重複「左邊」／確認轉向'],[v.confirmRight,'重複「右邊」／確認轉向']
 ]);
 for(const task of tasks)for(const s of [...task.steps,...task.variation.steps]){
  if(!hints.has(s.answer))throw Error('Missing practical short hint: '+s.answer);
  s.words=hints.get(s.answer);
 }
 const d=compile(old,tasks);
 // A written Part 4 condition may name the rule to practise. The interactive
 // and live-listening versions keep the clerk's answer out of the public setup.
 tasks.forEach((task,index)=>{
  if(!task.variation.listeningContext)return;
  const r=d.rounds[index],context=task.variation.listeningContext;
  for(const id of r.flowIds.slice(1))Object.assign(d.flows[id],{context,desc:context});
  for(const id of r.pairIds.slice(1))d.pairs[id].objects=context;
 });
 d.course.id=`travel-lab-${language}-day0-practical-v1`;
 d.course.title=pick('日文旅行實用會話','韓文旅行實用會話');
 d.course.description='從問價格開始，依序練數量、付款、餐飲、找位置與指手機問路；6 章、10 個小任務，每次練 1～2 個說法。';
 d.course.replyRole='店員／工作人員／路人';
 d.course.revision='day0-practical-v1';
 d.course.legacyKeys=[]; // Prior answers stay available as history, not new-task answers.
 d.previousFocusKey=old.course.id;
 d.previousLesson.legacyKeys=[...new Set([old.previousFocusKey,old.previousLesson?.key,...(old.previousLesson?.legacyKeys||[]),...(old.course.legacyKeys||[])].filter(Boolean))];
 d.originalPhrases=clone(old.originalPhrases||old.phrases);
 d.practicalSupport=[
  {en:v.excuse,zh:meaning(v.excuse),use:'先叫住對方'},
  {en:v.thanks,zh:meaning(v.thanks),use:'對方幫忙後道謝'},
  {en:v.repeat,zh:meaning(v.repeat),use:'沒聽清楚，請再說一次'},
  {en:v.slow,zh:meaning(v.slow),use:'說得太快，請慢一點'}
 ];
 d.optionalTravelPhrases=ko?clone(old.course.studySupplement||require('./korean-travel-phrases.cjs')):null;
 delete d.course.studySupplement;
 // IDs and visible task letters remain globally unique A–J across the six chapters.
 d.rounds.forEach(r=>{r.displayLabel=r.id;});
 // Add every generated multi-sentence reference answer to the audio lexicon.
 // All parts must already have authored meanings and readings; no guessed fallback.
 const authoredTexts=new Set([...Object.keys(lexicon),...Object.keys(old.day0AudioTranslations||{})]);
 const getEntry=text=>lexicon[text]||old.readings?.[text]&&{
  zh:old.day0AudioTranslations?.[text]||old.answerTranslations?.[text],
  romaji:old.readings[text],...old.kana?.[text]?{kana:old.kana[text]}:{}
 };
 for(const [text,zh]of Object.entries(d.answerTranslations)){
  if(lexicon[text])continue;
  const direct=getEntry(text);
  if(direct?.romaji){lexicon[text]={...direct,zh};continue;}
  const parts=(text.match(ko?/[^.!?]+[.!?]?/g:/[^。！？]+[。！？]?/g)||[]).map(s=>s.trim()).filter(Boolean);
  const entries=parts.map(getEntry);
  if(!parts.length||parts.some(t=>!authoredTexts.has(t))||entries.some(e=>!e?.romaji))throw Error('Missing practical reference reading: '+text);
  lexicon[text]={zh,romaji:entries.map(e=>e.romaji).join(' '),...ko?{}:{kana:entries.map(e=>e.kana||'').join(' ')}};
 }
 const playable=new Set([
  ...d.phrases.map(p=>p.en),...Object.keys(d.answerTranslations),
  ...d.flows.flatMap(f=>f.steps.flatMap(s=>[s.answer,s.line])),
  ...d.rounds.flatMap(r=>[...r.words.map(w=>w[0]),...r.variation.steps.flatMap(s=>[s.answer,s.line])]),
  ...d.practicalSupport.map(p=>p.en)
 ]);
 for(const text of playable)if(!lexicon[text]?.zh||!lexicon[text]?.romaji)throw Error('Missing practical playback entry: '+text);
 d.practicalLexicon=lexicon;
 d.readings={...old.readings,...Object.fromEntries(Object.entries(lexicon).map(([text,e])=>[text,e.romaji]))};
 d.kana={...old.kana,...Object.fromEntries(Object.entries(lexicon).filter(([,e])=>e.kana).map(([text,e])=>[text,e.kana]))};
 d.day0AudioTranslations={...old.day0AudioTranslations,...Object.fromEntries(Object.entries(lexicon).map(([text,e])=>[text,e.zh]))};
 return d;
}

module.exports={make};
