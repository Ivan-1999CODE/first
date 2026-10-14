// Days 11–14: authored conversations, grouped by what travellers need to accomplish.
// Original inventories stay in curriculum-original.json and original-lessons/.
const group=(target,...options)=>({target,options});
const p=(id,use,en,zh,substitutions=[])=>({id,use,en,zh,substitutions,note:''});
const extra=(use,base,en,zh)=>({use,base,en,zh,substitutions:[]});
const step=(askFirst,line,zh,task,answer,options,label,words,opening)=>({askFirst,line,zh,task,answer,objects:options.map(x=>['▣',x]),valid:[0],label,words,opening:opening||task,effect:'✓ 已記下這次的資訊，繼續接話。'});
const ask=(phrase,line,zh,options,label)=>step(true,line,zh,'先開口：'+phrase.zh,phrase.en,options,label,phrase.en.split(' ').slice(0,3).join(' ')+'…',phrase.zh);
const say=(line,zh,task,answer,options,label,words)=>step(false,line,zh,task,answer,options,label,words);
const round=(id,name,role,context,phraseIds,steps,change,changeWords,changeAnswer,words=[],advanced=[],advancedHear=[])=>({id,name,role,context,phraseIds,steps,change,changeWords,changeAnswer,words,advanced,advancedHear});

function day11(){
 const phrases=[
  p('from','介紹自己來自哪裡','I’m from Taiwan.','我來自臺灣。',[group('Taiwan',['Taiwan','臺灣'],['Taipei','臺北'],['Japan','日本'])]),
  p('with','介紹同行的人','I’m traveling with my family.','我和家人一起旅行。',[group('my family',['my family','我的家人'],['a friend','一位朋友'],['my partner','我的伴侶'])]),
  p('you','把話題交回對方','How about you?','那你呢？'),
  p('nice','認識新朋友','Nice to meet you.','很高興認識你。'),
  p('interest','分享興趣','I like taking photos.','我喜歡拍照。',[group('taking photos',['taking photos','拍照'],['hiking','健行'],['reading','閱讀'])]),
  p('fun','回應對方的興趣','That sounds fun.','聽起來很有趣。'),
  p('opinion','分享遊玩感想','It was great.','很棒。',[group('great',['great','很棒'],['nice','不錯'],['a little crowded','有點擁擠'])]),
  p('crowded','回應現場感受','Yeah, it was crowded.','對啊，人很多。'),
  p('phone','說明找不到物品','I can’t find my phone.','我找不到我的手機。',[group('my phone',['my phone','我的手機'],['my wallet','我的錢包'],['my ticket','我的票'])]),
  p('thanks','接受幫忙並道謝','Thanks.','謝謝。')
 ];
 const rounds=[
  round('A','認識新旅伴','旅伴','在早餐桌認識新旅伴。你來自臺灣，和家人旅行；介紹後，也問問對方。',['from','with','you','nice'],[
   say('Where are you from?','你來自哪裡？','介紹你來自臺灣。','I’m from Taiwan.',['臺灣','日本'],'介紹來自哪裡','from / Taiwan'),
   say('Who are you traveling with?','你和誰一起旅行？','你和家人一起來，回答後也問問對方。','I’m traveling with my family. How about you?',['自己和家人同行','自己獨自旅行'],'介紹同行的人','with / family / how about you'),
   say('I’m here with a friend.','我和一位朋友一起來。','知道對方和朋友同行，說很高興認識他。','Nice to meet you.',['對方和朋友同行','對方獨自旅行'],'聽懂對方並打招呼','nice / meet you')
  ],'改成你來自臺北，和一位朋友旅行；介紹後也問對方和誰同行。','Taipei / a friend / how about you','I’m from Taipei. I’m traveling with a friend. How about you?',[['family','家人'],['friend','朋友']],
  [extra('聊到工作時再問','How about you?','What do you do?','你做什麼工作？')],[{en:'I’m retired.',zh:'我退休了。'}]),
  round('B','聊一點興趣','旅伴','你喜歡拍照；新旅伴喜歡健行。各分享一件喜歡做的事，再接一句回應。',['interest','you','fun'],[
   say('What do you like to do?','你喜歡做什麼？','你喜歡拍照，回答後也問問旅伴。','I like taking photos. How about you?',['自己喜歡拍照','自己喜歡閱讀'],'分享興趣並回問','like / taking photos / how about you'),
   say('I like hiking.','我喜歡健行。','回應旅伴，說聽起來很有趣。','That sounds fun.',['旅伴喜歡健行','旅伴喜歡煮飯'],'接住對方的回答','sounds / fun')
  ],'改成你喜歡閱讀，分享後也問旅伴喜歡做什麼。','like / reading / how about you','I like reading. How about you?',[['taking photos','拍照'],['hiking','健行']],
  [extra('主動問興趣','How about you?','What do you like to do?','你喜歡做什麼？')]),
  round('C','聊剛才的行程','旅伴','你和旅伴都參觀過博物館。你覺得很棒，也同意那裡人很多。',['opinion','you','crowded'],[
   say('How was the museum?','博物館逛得怎麼樣？','說覺得很棒，接著問對方的感想。','It was great. How about you?',['覺得很棒','覺得無聊'],'分享自己的感想','great / how about you'),
   say('It was nice, but a little crowded.','不錯，但人有點多。','你也覺得人很多，回應旅伴。','Yeah, it was crowded.',['旅伴覺得人多','旅伴覺得沒有人'],'回應旅伴的感想','yeah / crowded')
  ],'改成你覺得不錯，但有點擁擠，說完再問旅伴感想。','nice / a little crowded / how about you','It was nice, but a little crowded. How about you?',[['great','很棒'],['crowded','擁擠的']],
  [extra('主動問感想','How about you?','How was the museum?','博物館逛得怎麼樣？'),extra('另一種問看法的說法','How was the museum?','What do you think of the museum?','你覺得這間博物館怎麼樣？')]),
  round('D','找不到東西時向旅伴求助','旅伴','你正在找手機。旅伴注意到你有些著急，問你是否還好。',['phone','thanks'],[
   say('Are you okay?','你還好嗎？','告訴旅伴你找不到手機。','I can’t find my phone.',['找不到手機','手機沒電'],'說明遇到的問題','can’t find / phone'),
   say('Let me call it.','我打你的手機看看。','旅伴要幫忙打你的手機，向他道謝。','Thanks.',['請旅伴打自己的手機','請旅伴買新手機'],'接受幫忙','thanks')
  ],'這次找不到的是錢包。告訴旅伴；如果他願意幫你找，向他道謝。','can’t find / wallet / thanks','I can’t find my wallet. Thanks.',[['phone','手機'],['wallet','錢包']],
  [extra('請對方一起找','I can’t find my phone.','Can you help me look?','可以幫我一起找嗎？'),extra('確定物品遺失時','I can’t find my phone.','I lost my phone.','我的手機遺失了。')])
 ];
 return {title:'和旅伴簡單聊天',phrases,rounds,before:['早餐時認識新旅伴：介紹你來自哪裡、和誰旅行，也問問對方。','from / with / how about you','I’m from Taiwan. I’m traveling with my family. How about you?']};
}

function day12(){
 const phrases=[
  p('greet','問候旅伴','How are you?','你好嗎？'),
  p('return','回答近況，也問對方','I’m doing well. How are you?','我很好。你好嗎？'),
  p('easy','體諒旅伴，放慢步調','Let’s take it easy today.','我們今天輕鬆一點吧。'),
  p('suggest','提議今天的活動','How about the museum?','去博物館怎麼樣？',[group('the museum',['the museum','博物館'],['the park','公園'],['the beach','海邊'])]),
  p('stay','商量待多久','How long should we stay?','我們待多久好呢？'),
  p('leave','提議出發時間','Let’s leave at ten.','我們 10 點出發吧。',[group('ten',['nine','9 點'],['ten','10 點'],['ten thirty','10:30'])]),
  p('route','詢問怎麼去','How do we get there?','我們怎麼去那裡？'),
  p('duration','詢問車程','How long does it take?','要花多久時間？'),
  p('arrival','詢問下一班車','When’s the next bus?','下一班公車什麼時候來？',[group('bus',['bus','公車'],['train','火車'])]),
  p('wait','決定等車','Let’s wait.','我們等一下吧。'),
  p('cost','詢問票價','How much is a ticket?','一張票多少錢？'),
  p('buy','購買成人票','Two adult tickets, please.','請給我兩張成人票。',[group('Two adult tickets',['One adult ticket','1 張成人票'],['Two adult tickets','2 張成人票'],['Three adult tickets','3 張成人票'])]),
  p('total','確認總價','How much is that altogether?','這樣總共多少錢？')
 ];
 const P=id=>phrases.find(p=>p.id===id);
 const rounds=[
  round('A','問候旅伴，放慢步調','旅伴','早上遇見旅伴。你精神不錯，但對方有點累，於是提議今天輕鬆一點。',['greet','return','easy'],[
   say('How are you?','你好嗎？','回答你很好，再問對方好不好。','I’m doing well. How are you?',['自己精神不錯','自己不舒服'],'回答並回問近況','doing well / how are you'),
   say('I’m a little tired.','我有點累。','聽到旅伴有點累，提議今天放慢步調。','Let’s take it easy today.',['今天輕鬆一點','今天排更緊的行程'],'體諒旅伴','take it easy / today')
  ],'改成你有點累；回答近況後，也問問旅伴。','a little tired / how are you','I’m a little tired. How are you?',[['tired','累的'],['take it easy','放輕鬆']]),
  round('B','決定活動和出發時間','旅伴','和旅伴安排今天：你提議博物館，一起待約 2 小時，10 點出發。',['suggest','stay','leave'],[
   ask(P('suggest'),'Sounds good.','聽起來不錯。',['同意去博物館','想去公園'],'決定活動'),
   ask(P('stay'),'About two hours.','大約 2 小時。',['待約 2 小時','待約 2 天'],'商量停留時間'),
   ask(P('leave'),'Okay. See you at ten.','好，10 點見。',['10 點出發','10:30 出發'],'約好出發時間')
  ],'這次提議去公園，問要待多久，再約 10:30 出發。','park / how long / ten thirty','How about the park? How long should we stay? Let’s leave at ten thirty.',[['museum','博物館'],['two hours','2 小時']],
  [extra('讓旅伴先提想法','How about the museum?','What would you like to do today?','你今天想做什麼？'),extra('出門前確認天氣','How about the museum?','What’s the weather like today?','今天天氣怎麼樣？'),extra('需要時確認星期','Let’s leave at ten.','What day is it today?','今天星期幾？'),extra('需要時確認日期','Let’s leave at ten.','What’s the date today?','今天幾月幾號？')],
  [{en:'It’s raining.',zh:'正在下雨。'},{en:'It’s Saturday.',zh:'今天星期六。'},{en:'It’s June twelfth.',zh:'今天 6 月 12 日。'}]),
  round('C','問清楚交通和車程','旅伴','活動決定了，你還不知道怎麼去；旅伴知道可以搭公車，車程約 20 分鐘。',['route','duration'],[
   ask(P('route'),'We can take the bus.','我們可以搭公車。',['搭公車','走路'],'確認交通方式'),
   ask(P('duration'),'About twenty minutes.','大約 20 分鐘。',['車程 20 分鐘','車程 2 小時'],'確認所需時間')
  ],'換一個目的地，旅伴說可以走路，約 10 分鐘；用兩個問題問清楚。','how / get there / how long','How do we get there? How long does it take?',[['bus','公車'],['twenty minutes','20 分鐘']],
  [extra('需要距離資訊時','How long does it take?','How far is it from here?','離這裡多遠？')],[{en:'About three kilometers.',zh:'大約 3 公里。'}]),
  round('D','問下一班車，決定是否等候','站務人員','你向站務人員詢問下一班公車。得知再等 5 分鐘就會到，決定留下等車。',['arrival','wait'],[
   ask(P('arrival'),'In five minutes.','再 5 分鐘就到。',['下一班等 5 分鐘','每 5 分鐘一班'],'確認等待時間'),
   step(true,'You can wait here.','你們可以在這裡等。','你們決定等車，告訴站務人員。','We’ll wait, thanks.',['決定等車','決定離開'],'作出等車決定','we’ll / wait / thanks','我們會在這裡等，謝謝。')
  ],'換一個站，下一班要等 10 分鐘。先問時間，決定等車後告訴站務人員。','next bus / we’ll wait','When’s the next bus? We’ll wait, thanks.',[['next bus','下一班公車'],['wait','等待']],
  [extra('問班距','When’s the next bus?','How often does the bus run?','公車多久一班？'),extra('不想等，提議換交通方式','Let’s wait.','Let’s take a taxi.','我們搭計程車吧。')],[{en:'Every fifteen minutes.',zh:'每 15 分鐘一班。'}]),
  round('E','複習：買票並確認總價','售票員','你們是 2 位成人。先問每張票多少錢，再買票並確認總價。',['cost','buy','total'],[
   ask(P('cost'),'Ten dollars each.','每張 10 美元。',['單張 10 美元','兩張共 10 美元'],'確認單價'),
   ask(P('buy'),'Sure.','好的。',['買 2 張成人票','買 2 張兒童票'],'買好票'),
   ask(P('total'),'Twenty dollars.','20 美元。',['總共 20 美元','總共 10 美元'],'確認總價')
  ],'改成 3 位成人，每張仍是 10 美元；購票並問總價。','three adult tickets / altogether','Three adult tickets, please. How much is that altogether?',[['adult ticket','成人票'],['altogether','總共']])
 ];
 // The public decision is useful with staff; the companion version stays beside it.
 phrases.push(p('wait-staff','告訴工作人員決定等車','We’ll wait, thanks.','我們會等，謝謝。'));
 rounds[3].phraseIds.push('wait-staff');
 return {title:'和旅伴安排今天的行程',phrases,rounds,before:['和旅伴商量去博物館，問怎麼去、要花多久時間。','museum / get there / how long','How about the museum? How do we get there? How long does it take?']};
}

function day13(){
 const phrases=[
  p('place','提議目的地','Let’s go to the museum.','我們去博物館吧。',[group('the museum',['the museum','博物館'],['the park','公園'],['the beach','海邊'])]),
  p('hot','說明太熱','It’s too hot outside.','外面太熱了。',[group('hot',['hot','熱'],['cold','冷'])]),
  p('bus','提出另一種交通方式','Can we take the bus?','我們可以搭公車嗎？',[group('the bus',['the bus','公車'],['a taxi','計程車'],['the train','火車'])]),
  p('agree','回應同意','Sounds good.','聽起來不錯。'),
  p('tired','說明自己的狀況','I’m tired.','我累了。',[group('tired',['tired','累'],['hungry','餓'],['thirsty','渴'])]),
  p('rest','提出休息需求','Can we take a break?','我們可以休息一下嗎？'),
  p('drink','選飲料','Water, please.','水，謝謝。',[group('Water',['Water','水'],['Tea','茶'],['Coffee','咖啡'])]),
  p('you','也問問旅伴','How about you?','那你呢？')
 ];
 const P=id=>phrases.find(p=>p.id===id);
 const rounds=[
  round('A','選地點，主動說理由','旅伴','外面很熱，旅伴問公園和博物館要選哪裡；你想待在室內。',['place','hot','agree'],[
   say('The park or the museum?','公園還是博物館？','提議去博物館，直接說外面太熱了。','Let’s go to the museum. It’s too hot outside.',['博物館：想待在室內','公園：想在戶外'],'選地點並說理由','museum / too hot'),
   say('Okay. Let’s go after lunch.','好，我們午餐後去吧。','你也同意午餐後出發，回應旅伴。','Sounds good.',['午餐後出發','早餐前出發'],'約好出發時機','sounds / good')
  ],'改成外面太冷，你想去博物館；提出地點並說明理由。','museum / too cold','Let’s go to the museum. It’s too cold outside.',[['outside','外面'],['after lunch','午餐後']],
  [extra('想去戶外的理由','It’s too hot outside.','I want to take a walk.','我想散步。'),extra('把原因接成一句','Let’s go to the museum. It’s too hot outside.','Let’s go to the museum because it’s too hot outside.','我們去博物館吧，因為外面太熱了。')]),
  round('B','不想走路，提出替代方式','旅伴','旅伴提議走路，但外面太熱。你想改搭公車，和他談好交通方式。',['hot','bus','agree'],[
   say('Let’s walk.','我們走路吧。','說外面太熱，詢問能不能改搭公車。','It’s too hot outside. Can we take the bus?',['提出改搭公車','同意繼續走路'],'表達需求與替代方案','too hot / take the bus'),
   say('Sure. There’s a bus stop over there.','好，那邊有公車站。','同意到對方指出的公車站搭車。','Sounds good.',['到那邊的公車站','繼續走到目的地'],'確認共同決定','sounds / good')
  ],'這次你累了，想改搭計程車；先說自己的狀況，再提出建議。','tired / take a taxi','I’m tired. Can we take a taxi?',[['bus stop','公車站'],['taxi','計程車']],
  [extra('另一種提議說法','Can we take the bus?','Why don’t we take the bus?','我們搭公車好嗎？')],[{en:'Sure. Why not?',zh:'好啊。'}]),
  round('C','走累了，提議休息','旅伴','你走累了，主動說明狀況並提議休息；旅伴願意一起找個地方坐下。',['tired','rest'],[
   step(true,'Sure. Let’s find somewhere to sit.','好啊，我們找個地方坐下吧。','說自己累了，問能不能休息一下。','I’m tired. Can we take a break?',['一起找地方坐下休息','繼續趕路'],'提出並確認休息','tired / take a break','我累了，我們可以休息一下嗎？')
  ],'改成你口渴了，想先休息一下；說明狀況並提出需求。','thirsty / take a break','I’m thirsty. Can we take a break?',[['tired','累的'],['take a break','休息一下']],
  [extra('餓了，改提吃東西','I’m tired. Can we take a break?','I’m hungry. Can we get something to eat?','我餓了，我們可以找東西吃嗎？'),extra('另一種休息提議','Can we take a break?','Why don’t we take a break?','我們休息一下好嗎？')]),
  round('D','休息時選飲料','旅伴','旅伴要一起買飲料，有水和茶；你選水，也問對方要喝什麼。',['drink','you'],[
   say('Water or tea?','水還是茶？','選水，然後也問旅伴要喝什麼。','Water, please. How about you?',['自己選水','自己選茶'],'說出自己的選擇','water / how about you'),
   say('Tea for me.','我要茶。','聽懂旅伴要茶，簡單回應知道了。','Okay.',['旅伴選茶','旅伴選水'],'聽懂旅伴的選擇','okay')
  ],'交換角色，這次你要茶，再問旅伴要喝什麼。','tea / how about you','Tea, please. How about you?',[['water','水'],['tea','茶']],
  [extra('完整問法','Water or tea?','Which one would you like?','你想要哪一個？')],[{en:'Which one would you like, water or tea?',zh:'你想喝哪一種，水還是茶？'}])
 ];
 return {title:'表達需求，一起調整計畫',phrases,rounds,before:['旅伴想走路，但你累了，想改搭公車。說明狀況，提出另一個選擇。','tired / take the bus','I’m tired. Can we take the bus?']};
}

function day14(){
 const phrases=[
  p('destination','問今天的目的地','Where are we going?','我們要去哪裡？'),
  p('confirm-place','確認目的地','The beach, right?','海邊，對嗎？',[group('The beach',['The beach','海邊'],['The museum','博物館'],['The park','公園'])]),
  p('meet','問集合地點','Where do we meet?','我們在哪裡集合？'),
  p('leave','問出發時間','What time do we leave?','我們幾點出發？'),
  p('return','問回來的時間','What time do we get back?','我們幾點回來？'),
  p('friend','問哪一位是對方的朋友','Which one is your friend?','哪一位是你的朋友？'),
  p('repeat','沒聽清楚，請重說','Sorry, could you say that again?','不好意思，可以再說一次嗎？'),
  p('confirm','把時間地點說回去確認','Nine, in the lobby. Right?','9 點，在大廳，對嗎？',[group('Nine',['Nine','9 點'],['Ten','10 點'],['Ten thirty','10:30']),group('in the lobby',['in the lobby','在大廳'],['at the entrance','在入口'])])
 ];
 const P=id=>phrases.find(p=>p.id===id);
 const rounds=[
  round('A','確認已安排好的目的地','行程人員','你已報名今天的團體行程，但還不確定目的地。向行程人員詢問，再確認一次。',['destination','confirm-place'],[
   ask(P('destination'),'We’re going to the beach.','我們要去海邊。',['海邊','博物館'],'問清楚目的地'),
   ask(P('confirm-place'),'That’s right.','對，沒錯。',['確認是海邊','改去公園'],'確認聽到的地點')
  ],'換一個行程，行程人員說今天去博物館；先詢問，再把地點說回去確認。','where / museum / right','Where are we going? The museum, right?',[['beach','海邊'],['museum','博物館']]),
  round('B','問集合地點與出發時間','行程人員','向行程人員確認今天的集合地點與出發時間：飯店大廳、9 點。',['meet','leave'],[
   ask(P('meet'),'In the hotel lobby.','在飯店大廳。',['飯店大廳','博物館入口'],'集合地點'),
   ask(P('leave'),'At nine.','9 點。',['9:00','10:00'],'出發時間')
  ],'下一天改在博物館入口集合、10 點出發；重新問清楚兩項資訊。','where / meet / what time / leave','Where do we meet? What time do we leave?',[['lobby','大廳'],['leave','出發']],
  [extra('已在談集合時，可以簡短追問','What time do we leave?','What time?','幾點？'),extra('需要轉告旅伴時','Where do we meet?','We’re meeting in the lobby at nine.','我們 9 點在大廳集合。')]),
  round('C','確認回程，認識旅伴的朋友','旅伴','集合時，向熟悉行程的旅伴確認幾點回到飯店，再請他指出同行的朋友；一位穿藍色衣服，另一位穿綠色衣服。',['return','friend'],[
   ask(P('return'),'Around three.','大約 3 點。',['下午約 3 點','晚上約 9 點'],'回到飯店的時間'),
   ask(P('friend'),'The one in blue.','穿藍色衣服的那位。',['穿藍色衣服的那位','穿綠色衣服的那位'],'認出旅伴的朋友')
  ],'換一個行程，下午約 4 點回來，旅伴的朋友穿綠色衣服；重新詢問回程時間，再問哪位是他的朋友。','what time / get back / which one / friend','What time do we get back? Which one is your friend?',[['around','大約'],['friend','朋友'],['in blue / in green','穿藍色衣服／穿綠色衣服']]),
  round('D','沒聽清楚，重問並確認','行程人員','行程人員剛交代集合資訊，但你沒聽清楚。請他重說，再確認時間和地點。',['repeat','confirm'],[
   ask(P('repeat'),'At nine, in the hotel lobby.','9 點，在飯店大廳。',['9 點・飯店大廳','10 點・博物館入口'],'請對方重說'),
   ask(P('confirm'),'That’s right.','對，沒錯。',['時間地點都確認了','仍未確認'],'說回去確認')
  ],'這次聽到的是 10 點、入口。請重說，再把新時間與地點確認一次。','say again / ten / entrance / right','Sorry, could you say that again? Ten, at the entrance. Right?',[['again','再一次'],['right','對的']],
  [extra('完整的確認問句','Nine, in the lobby. Right?','At nine, in the hotel lobby. Is that right?','9 點，在飯店大廳，這樣對嗎？')])
 ];
 return {title:'問清楚團體行程',phrases,rounds,before:['向行程人員問集合地點與出發時間；沒聽清楚時，請他再說一次。','where / meet / what time / say again','Where do we meet? What time do we leave? Sorry, could you say that again?']};
}

const listeningChecks={
 'Where are you from?':['來自哪裡','要去哪裡'],
 'What do you like to do?':['喜歡做什麼','做什麼工作'],
 'How was the museum?':['參觀博物館的感想','去博物館的交通'],
 'Are you okay?':['是否還好','是否已準備出發'],
 'How are you?':['目前的近況','旅遊的計畫'],
 'The park or the museum?':['選公園或博物館','選走路或搭車'],
 'Let’s walk.':['提議走路','提議休息'],
 'Water or tea?':['選水或茶','選內用或外帶']
};

function revise(d){
 const config=({11:day11,12:day12,13:day13,14:day14})[d.course.day]();
 const oldKey=d.course.id;
 d.previousLesson={key:oldKey,legacyKeys:[d.previousLesson.key,...d.previousLesson.legacyKeys],missions:d.missions,pairs:d.pairs};
 d.course={...d.course,id:oldKey.replace(/-v1$/,'-v2'),legacyKeys:[],revisedConversations:true,title:config.title,description:'從眼前的需要開口，聽懂回應，再接一句。每輪先練一種好用的說法。',task:config.before[0],words:config.before[1],answer:config.before[2],replyRole:config.rounds[0].role,skills:[]};
 d.phrases=config.phrases;
 d.support=[p('help-repeat','請對方再說一次','Sorry, could you say that again?','不好意思，可以再說一次嗎？'),p('help-ack','表示聽懂並道謝','Okay, thanks.','好，謝謝。')];
 d.rounds=[];d.flows=[];d.missions=[];d.pairs=[];d.replies=[];d.quizzes=[];d.reviewTasks=[];
 for(const [i,r] of config.rounds.entries()){
  const id='conversation-'+r.id.toLowerCase(),steps=r.steps.map((s,j)=>({...s,id:'step-'+j}));
  const replyStep=steps.find(s=>!s.askFirst)||steps[0];
  const probe=replyStep.askFirst?replyStep.objects.map(o=>o[1]):listeningChecks[replyStep.line];
  if(!probe)throw Error('Missing listening check: '+replyStep.line);
  const q={id:'listen-'+id,name:r.name,line:replyStep.line,zh:replyStep.zh,listen:replyStep.askFirst?'抓住對方回答的關鍵資訊。':'聽懂對方正在問或說哪一件事。',options:probe,correct:0,why:replyStep.zh,task:replyStep.askFirst?'聽懂後，簡單回應並道謝。':replyStep.task,words:replyStep.askFirst?'okay / thanks':replyStep.words,answer:replyStep.askFirst?'Okay, thanks.':replyStep.answer,change:r.change,changeWords:r.changeWords,changeAnswer:r.changeAnswer};
  d.replies.push(q);
  d.flows.push({id,name:r.id+'｜'+r.name,desc:r.context,context:r.context,summary:r.change,sceneTitle:r.name,sceneIcon:({11:'📷',12:'🚌',13:'🌳',14:'🧭'})[d.course.day],generic:true,steps});
  d.rounds.push({id:r.id,name:r.name,goal:r.context,role:r.role,phraseIds:r.phraseIds,replyIds:[i],flowIds:[i],missionIds:[i],pairIds:[i],words:r.words,reuse:[],bridge:'先用基本說法完成對話。有餘力時，再展開進階補充。',advanced:r.advanced,advancedHear:r.advancedHear});
  d.missions.push({id,name:r.id+'｜'+r.name+'・換情況',task:r.change,words:r.changeWords,answer:r.changeAnswer,check:'有依新情況表達自己的意思，並接住對方的話嗎？不需要逐字相同。'});
  const first=steps[0];
  d.pairs.push({id,name:r.id+'｜'+r.name,role:`學生當旅客，老師當${r.role}；一起看畫面。${r.role==='旅伴'?'完成後可交換角色。':''}`,first:first.askFirst?'學生':'老師',opening:first.askFirst?first.opening:first.zh,start:first.askFirst?'':first.line,next:'依學生實際說法接話，已知道的資訊不再重問；完成後再換一個情況。',objects:r.context,tags:r.context,goals:steps.map(s=>s.label),cards:steps.map((s,j)=>[s.askFirst?s.task:j===0?'開始這段對話':'接續上一句：'+steps[j-1].task,s.line,s.zh]),words:steps.map(s=>s.words).join(' / '),answer:steps.map(s=>s.answer).join(' ')});
  d.course.skills.push({id,text:'我能'+r.name+'。'});
  d.reviewTasks.push({id:r.id,name:r.name,task:r.change,words:r.changeWords,answer:r.changeAnswer});
  d.quizzes.push({id:'review-'+r.id,task:r.name+'：聽懂重點',line:q.line,zh:q.zh,options:q.options,correct:q.correct,why:q.why});
 }
 d.homeTask='換一位旅伴或換一個行程，試著完成：'+config.before[0];d.homeWords=config.before[1];d.homeAnswer=config.before[2];
 return d;
}
module.exports={revise};
