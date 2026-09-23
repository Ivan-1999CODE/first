const row=(name,role,en,zh,task,hint,answer,change,changeHint,changeAnswer)=>({id:en.toLowerCase().replace(/[^a-z]+/g,'-').replace(/-$/,''),name,role,en,zh,task,hint,answer,change,changeHint,changeAnswer});
module.exports={
 3:{label:'對方問，我來答',replies:[
  row('託運行李','地勤人員','How many bags are you checking in?','您要託運幾件行李？','你要託運 1 件行李。','one / bag','One bag, please.','如果要託運 2 件呢？','two / bags','Two bags, please.'),
  row('選擇座位','地勤人員','Would you like a window or an aisle seat?','您想要靠窗還是靠走道的座位？','你想坐靠走道的座位。','aisle / please','An aisle seat, please.','改成想坐靠窗的位置。','window / seat','A window seat, please.'),
  row('旅行目的','入境官員','What is the purpose of your visit?','您這次入境的目的是什麼？','在這個練習情境中，你是來觀光的。','here / vacation','I’m here on vacation.','如果這次是出差呢？','business','I’m here on business.'),
  row('停留時間','入境官員','How long will you stay?','您會停留多久？','這次旅行預計停留 7 天。','seven / days','Seven days.','把停留時間換成 2 週。','two / weeks','Two weeks.'),
  row('住宿地點','入境官員','Where will you be staying?','您會住在哪裡？','你已訂好 Sunny Hotel。','at / Sunny Hotel','At Sunny Hotel.','換成住在朋友家。','with / a friend','With a friend.'),
  row('攜帶食物','海關人員','Are you carrying any food?','您有攜帶食物嗎？','在這個情境中，你的包包裡有餅乾，請如實回答。','yes / cookies','Yes, I have some cookies.','如果完全沒有帶食物，你會怎麼回答？','no / food','No, I don’t have any food.')
 ]},
 4:{label:'對方問，我來答',replies:[
  row('買到哪一站','售票員','Where would you like to go?','您想去哪裡？','你要買到中央車站的車票。','Central Station / please','Central Station, please.','改成要去機場。','airport','The airport, please.'),
  row('選擇票種','售票員','Single or return?','單程還是來回？','你只需要單程票。','single / please','Single, please.','如果回程也要搭同一段火車呢？','return / please','Return, please.'),
  row('購買張數','售票員','How many tickets would you like?','您要幾張票？','你要買 1 張車票。','one / ticket','One ticket, please.','換成幫自己與旅伴買 2 張票。','two / tickets','Two tickets, please.'),
  row('付款方式','售票員','Cash or card?','付現還是刷卡？','你想用信用卡付款。','card / please','Card, please.','換成付現金。','cash','Cash, please.'),
  row('確認下車站','公車司機','Are you getting off at River Market?','您要在河畔市集下車嗎？','對，河畔市集就是你的目的地。','yes / right','Yes, that’s right.','如果你其實要在中央車站下車呢？','no / Central Station','No, Central Station, please.')
 ]},
 5:{label:'對方問，我來答',replies:[
  row('接受問路協助','路人','Do you need help?','你需要幫忙嗎？','你正在找 City Museum，請對方幫忙。','yes / looking for / museum','Yes, I’m looking for the City Museum.','換成正在找火車站。','looking for / train station','Yes, I’m looking for the train station.'),
  row('告訴司機目的地','計程車司機','Where would you like to go?','您想去哪裡？','你要去 City Museum。','City Museum / please','The City Museum, please.','回程要去 Sunny Hotel。','Sunny Hotel','Sunny Hotel, please.'),
  row('選擇交通方式','路人','Would you like to take a taxi?','你想搭計程車嗎？','路程有點遠，你決定搭計程車。','yes / taxi','Yes, I’ll take a taxi.','如果你想散步過去呢？','no / walk','No, thanks. I’ll walk.'),
  row('說明接車位置','Uber 司機','Where are you waiting?','您在哪裡等車？','你在飯店入口外面。','outside / hotel entrance','I’m outside the hotel entrance.','把位置換成博物館入口。','museum entrance','I’m at the museum entrance.'),
  row('確認下車位置','司機','Would you like to get out here?','您想在這裡下車嗎？','現在的位置可以，請司機停車。','yes / here','Yes, here is fine.','如果你想在前面的入口下車呢？','at / entrance / please','At the entrance, please.')
 ]},
 6:{label:'店員問，我來答',replies:[
  row('準備點餐','店員','Are you ready to order?','準備好點餐了嗎？','你還沒決定，想請店員再給一點時間。','not yet / a minute','Not yet. Could we have another minute, please?','如果已經決定好雞肉三明治呢？','yes / chicken sandwich','Yes. I’d like the chicken sandwich, please.'),
  row('選擇主餐','店員','May I take your order?','可以幫您點餐了嗎？','你想點番茄義大利麵。','I’ll have / tomato pasta','I’ll have the tomato pasta, please.','換成想點雞肉三明治。','chicken sandwich','I’ll have the chicken sandwich, please.'),
  row('是否要甜點','店員','Would you like something for dessert?','想吃點甜點嗎？','你想吃巧克力蛋糕。','chocolate cake / please','Chocolate cake, please.','如果你已經吃飽、不想要甜點呢？','no / thank you','No, thank you. I’m full.'),
  row('選擇牛排熟度','店員','How would you like your steak?','牛排想要幾分熟？','你想點五分熟的牛排。','medium / please','Medium, please.','改成想要全熟；也可以試說三分熟（medium-rare）。','well-done / medium-rare','Well-done, please.'),
  row('選擇蛋的做法','店員','How would you like your eggs?','蛋想要怎麼料理？','你想吃炒蛋。','scrambled / please','Scrambled, please.','改成單面煎蛋；也可以試說兩面煎、流心蛋黃（over easy）。','sunny-side up / over easy','Sunny-side up, please.'),
  row('咖啡偏好','店員','How would you like your coffee?','咖啡想要怎麼調配？','你想喝不加奶的黑咖啡。','black / please','Black, please.','換成加牛奶，但不要糖。','with milk / no sugar','With milk, no sugar, please.'),
  row('內用或外帶','店員','Is that for here or to go?','這份要內用還是外帶？','你想坐在店裡吃。','for here','For here, please.','如果要帶回飯店吃呢？','to go','To go, please.')
 ]}
};
