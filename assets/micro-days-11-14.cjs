// Each task is a self-contained practice cycle with at most two learner utterances.
// Teacher turns and the one-condition variation are taught before they are used.
const clone = value => JSON.parse(JSON.stringify(value));
const phrase = (base, id) => {
  const found = base.phrases.find(item => item.id === id);
  if (!found) throw new Error(`Missing conversation phrase ${base.course.day}:${id}`);
  return found;
};
function step(id, label, answer, answerZh, line, zh, task, words, options, askFirst = false) {
  return {
    id, label, answer, answerZh, line, zh, task, words,
    opening: askFirst ? answerZh : zh,
    objects: options.map(text => ['▣', text]), valid: [0], askFirst,
    effect: '✓ 已記下這一項，繼續用本輪的句子接話。'
  };
}
function fromPhrase(base, id, label, line, zh, task, words, options, askFirst = false) {
  const p = phrase(base, id);
  return step(id, label, p.en, p.zh, line, zh, task, words, options, askFirst);
}
function changed(source, values) {
  const result = {...clone(source), ...values};
  if (values.options) {
    result.objects = values.options.map(text => ['▣', text]);
    delete result.options;
  }
  result.opening = result.askFirst ? result.answerZh : result.zh;
  return result;
}
function task(key, name, role, context, steps, variationTask, variationSteps, words, changeNote) {
  return {
    key, name, role, context, steps,
    variation: {task: variationTask, steps: variationSteps},
    words, changeNote
  };
}

function day11(base) {
  const origin = fromPhrase(base, 'from', '介紹自己來自哪裡',
    'Where are you from?', '你來自哪裡？',
    '你來自臺灣，告訴新旅伴。', 'from / Taiwan', ['你來自臺灣', '你來自日本']);
  const nice = fromPhrase(base, 'nice', '認識新朋友',
    'Nice to meet you.', '很高興認識你。',
    '對方說很高興認識你，你也用本輪同一句打招呼。', 'nice / meet you', ['互相打招呼', '詢問工作']);
  const withFamily = fromPhrase(base, 'with', '介紹同行的人',
    'Who are you traveling with?', '你和誰一起旅行？',
    '你和家人一起旅行，告訴旅伴。', 'traveling / with / my family', ['你和家人同行', '你獨自旅行']);
  const askBack = fromPhrase(base, 'you', '把同一個問題問回去',
    'I’m traveling with a friend.', '我和一位朋友一起旅行。',
    '你已說明自己和誰旅行，接著問對方和誰旅行。', 'how / about / you', ['對方和朋友同行', '對方獨自旅行'], true);
  const askHobby = step('ask-interest', '主動問旅伴的興趣',
    'What do you like to do?', '你喜歡做什麼？',
    'I like hiking.', '我喜歡健行。',
    '你想認識旅伴，先問他喜歡做什麼。', 'what / like / do', ['旅伴喜歡健行', '旅伴喜歡拍照'], true);
  const ownHobby = fromPhrase(base, 'interest', '分享自己的興趣',
    'How about you?', '那你呢？',
    '旅伴問回來，你喜歡拍照，告訴他。', 'like / taking photos', ['你喜歡拍照', '你喜歡閱讀']);
  const reactHobby = fromPhrase(base, 'fun', '回應對方的興趣',
    'I like hiking.', '我喜歡健行。',
    '你覺得健行聽起來很有趣，用本輪學過的回應接話。', 'sounds / fun', ['覺得聽起來有趣', '表示自己不喜歡']);
  const opinion = fromPhrase(base, 'opinion', '分享遊玩感想',
    'How was the museum?', '博物館逛得怎麼樣？',
    '你剛逛完博物館，覺得很棒，告訴旅伴。', 'was / great', ['你覺得很棒', '你覺得無聊']);
  const crowded = fromPhrase(base, 'crowded', '回應相同的現場感受',
    'It was crowded.', '那裡人很多。',
    '你也覺得人很多，表示同意旅伴的感受。', 'yeah / crowded', ['你也覺得人很多', '你覺得沒有人']);
  const missing = fromPhrase(base, 'phone', '說明找不到物品',
    'Are you okay?', '你還好嗎？',
    '你找不到手機，告訴關心你的旅伴。', 'can’t find / my phone', ['找不到手機', '手機沒電']);
  const thanks = fromPhrase(base, 'thanks', '接受幫忙並道謝',
    'Let me help you look.', '我幫你一起找。',
    '旅伴願意幫你找物品，向他道謝。', 'thanks', ['接受一起找的幫忙', '請對方買新的']);
  return [
    task('introduce-origin', '介紹來處，認識新朋友', '旅伴',
      '早餐時，你在餐桌認識一位新旅伴。你來自臺灣；回答他來自哪裡的問題，再互相打招呼。',
      [origin, nice],
      '同樣在早餐桌認識新旅伴，只把自己的來處換成臺北。回答來自哪裡，再說很高興認識對方。',
      [changed(origin, {answer:'I’m from Taipei.', answerZh:'我來自臺北。', task:'這次你來自臺北，告訴新旅伴。', words:'from / Taipei', options:['你來自臺北','你來自日本']}), clone(nice)],
      [['from','來自'], ['Taiwan / Taipei','臺灣／臺北'], ['meet','認識、見面']],
      '把原本一次練來處、同行者、回問和招呼的長任務拆開；這輪只留下來處與招呼兩句。'),
    task('travel-companion', '介紹同行者，也問問對方', '旅伴',
      '你和家人一起旅行，正在和另一位旅伴聊天。先回答自己和誰同行，再把同一個問題問回去；對方和朋友同行。',
      [withFamily, askBack],
      '只把你的同行者換成一位朋友；對方仍和朋友同行。先回答，再問對方和誰旅行。',
      [changed(withFamily, {answer:'I’m traveling with a friend.', answerZh:'我和一位朋友一起旅行。', task:'這次你和一位朋友旅行，告訴旅伴。', words:'traveling / with / a friend', options:['你和朋友同行','你獨自旅行']}), clone(askBack)],
      [['family','家人'], ['friend','朋友'], ['How about you?','那你呢？']],
      '把同行者介紹與 How about you? 分成兩個真正的練習位置，不再把兩句包成一個短答，也不額外要求交換成未教的教師問句。'),
    task('ask-share-interest', '問興趣，再分享自己的興趣', '旅伴',
      '你和旅伴正在認識彼此。你喜歡拍照；先問旅伴喜歡做什麼，聽到他喜歡健行後，再回答他問回來的問題。',
      [askHobby, ownHobby],
      '只把你的興趣換成閱讀。旅伴仍喜歡健行；先問他的興趣，再回答你自己的興趣。',
      [clone(askHobby), changed(ownHobby, {answer:'I like reading.', answerZh:'我喜歡閱讀。', task:'你喜歡閱讀，回答旅伴問回來的問題。', words:'like / reading', options:['你喜歡閱讀','你喜歡拍照']})],
      [['taking photos','拍照'], ['hiking','健行'], ['reading','閱讀']],
      '把主動問興趣從額外補充移到正式練習；本輪只練問興趣與分享興趣，聽完後的感想另開一輪。'),
    task('respond-interest', '接住旅伴的興趣', '旅伴',
      '你和旅伴正在聊天，他主動分享自己喜歡健行。你覺得聽起來很有趣，練習用一句話回應；這輪不需要再介紹自己的興趣。',
      [reactHobby],
      '只把旅伴分享的興趣換成閱讀。你仍覺得聽起來很有趣，用同一句話回應。',
      [changed(reactHobby, {line:'I like reading.', zh:'我喜歡閱讀。', task:'你覺得閱讀聽起來很有趣，用同一句話回應。'})],
      [['hiking / reading','健行／閱讀'], ['sounds fun','聽起來很有趣']],
      '將 That sounds fun. 獨立成一個短任務，避免問興趣、分享、回問和回應擠在同一輪。'),
    task('share-visit', '分享感想，回應相同感受', '旅伴',
      '你和旅伴都剛參觀完博物館。你覺得很棒，也覺得現場人很多；先回答參觀感想，再回應旅伴對人潮的描述。',
      [opinion, crowded],
      '只把剛逛完的地點換成公園；你仍覺得很棒，也同意人很多。沿用同樣兩句回答。',
      [changed(opinion, {line:'How was the park?', zh:'公園逛得怎麼樣？', task:'你剛逛完公園，覺得很棒，告訴旅伴。'}), clone(crowded)],
      [['museum / park','博物館／公園'], ['great','很棒'], ['crowded','人多、擁擠的']],
      '拿掉本輪額外的回問與長串感想替換；只反覆練 It was great. 和 Yeah, it was crowded.，變化只換參觀地點。'),
    task('missing-item', '說明找不到東西，接受幫忙', '旅伴',
      '你正著急地找手機，旅伴注意到了並關心你。說明找不到手機；他願意一起找時，向他道謝。',
      [missing, thanks],
      '只把找不到的物品換成錢包。說明問題，旅伴願意一起找時，再用同一句話道謝。',
      [changed(missing, {answer:'I can’t find my wallet.', answerZh:'我找不到我的錢包。', task:'這次找不到的是錢包，告訴旅伴。', words:'can’t find / my wallet', options:['找不到錢包','錢包破了']}), clone(thanks)],
      [['phone / wallet','手機／錢包'], ['look','找'], ['thanks','謝謝']],
      '保留原本兩個核心說法；教師統一用「幫你一起找」，避免物品換成錢包後仍說要打電話，或突然加入另一種求助句。')
  ];
}

function day12(base) {
  const well = step('answer-greeting', '回答自己的近況',
    'I’m doing well.', '我很好。',
    'How are you?', '你好嗎？', '你今天精神不錯，回答旅伴。', 'doing / well', ['你精神不錯','你不舒服']);
  const greet = fromPhrase(base, 'greet', '也關心旅伴的近況',
    'I’m a little tired.', '我有點累。',
    '你已回答自己的近況，再問旅伴好不好。', 'how / are / you', ['旅伴有點累','旅伴肚子餓'], true);
  const easy = fromPhrase(base, 'easy', '提議今天輕鬆一點',
    'I’m a little tired.', '我有點累。',
    '旅伴說有點累，你提議今天放慢步調。', 'take it easy / today', ['今天放慢步調','今天增加行程']);
  const activity = fromPhrase(base, 'suggest', '提議今天的活動',
    'Sounds good.', '聽起來不錯。',
    '你想去博物館，先向旅伴提出建議。', 'how about / the museum', ['同意去博物館','拒絕去博物館'], true);
  const stay = fromPhrase(base, 'stay', '商量停留多久',
    'About two hours.', '大約 2 小時。',
    '活動已決定，問旅伴我們待多久好。', 'how long / should / stay', ['停留約 2 小時','停留約 2 天'], true);
  const leave = fromPhrase(base, 'leave', '提議出發時間',
    'Okay.', '好。',
    '你想 10 點出發，先向旅伴提出建議。', 'leave / at / ten', ['同意 10 點出發','改成 9 點出發'], true);
  const waitTogether = fromPhrase(base, 'wait', '和旅伴決定等一下',
    'It’s only nine fifty-five.', '現在才 9 點 55 分。',
    '還沒到約好的出發時間，提議一起等一下。', 'let’s / wait', ['一起等到約定時間','立刻分開走']);
  const route = fromPhrase(base, 'route', '詢問怎麼到目的地',
    'We can take the bus.', '我們可以搭公車。',
    '你和旅伴已決定去博物館，問他怎麼去。', 'how / get there', ['搭公車','走路'], true);
  const duration = fromPhrase(base, 'duration', '詢問車程',
    'About twenty minutes.', '大約 20 分鐘。',
    '知道可以搭公車後，再問車程多久。', 'how long / take', ['車程約 20 分鐘','車程約 2 小時'], true);
  const nextBus = fromPhrase(base, 'arrival', '問下一班公車',
    'In five minutes.', '再 5 分鐘就到。',
    '你已在公車站，向站務人員問下一班公車什麼時候來。', 'when / next bus', ['下一班再等 5 分鐘','每 5 分鐘一班'], true);
  const waitStaff = fromPhrase(base, 'wait-staff', '告訴站務人員決定等車',
    'You can wait here.', '你們可以在這裡等。',
    '你和旅伴決定等這班車，告訴站務人員。', 'we’ll / wait / thanks', ['在這裡等車','離開車站'], true);
  const cost = fromPhrase(base, 'cost', '先問單張票價',
    'Ten dollars each.', '每張 10 美元。',
    '你還不知道成人票價，先問一張票多少錢。', 'how much / a ticket', ['單張 10 美元','兩張共 10 美元'], true);
  const buy = fromPhrase(base, 'buy', '買成人票',
    'Sure.', '好的。',
    '你們是 2 位成人，向售票員買 2 張成人票。', 'two / adult tickets / please', ['買 2 張成人票','買 2 張兒童票'], true);
  const total = fromPhrase(base, 'total', '確認這次的總價',
    'Twenty dollars.', '20 美元。',
    '票種和張數已說清楚，再問總共多少錢。', 'how much / altogether', ['總共 20 美元','總共 10 美元'], true);
  return [
    task('greeting', '回答近況，也問候旅伴', '旅伴',
      '早上遇見旅伴，你今天精神不錯。先回答他對你的問候，再問他好不好；他有點累。',
      [well, greet],
      '只把你的近況改成有點累；旅伴仍有點累。先回答自己，再用同一句問候他。',
      [changed(well, {answer:'I’m a little tired.', answerZh:'我有點累。', task:'你今天有點累，回答旅伴。', words:'a little / tired', options:['你有點累','你精神不錯']}), clone(greet)],
      [['doing well','近況很好'], ['a little tired','有點累']],
      '將「我很好＋你好嗎」拆成兩個開口位置，這輪不再接第三句放慢行程的建議。'),
    task('take-it-easy', '體諒旅伴，放慢步調', '旅伴',
      '你和旅伴還在安排今天的活動。旅伴說自己有點累，你提議今天輕鬆一點；這輪只練這個回應。',
      [easy],
      '只把旅伴的疲累程度改成很累。他仍在談今天的活動，你沿用同一句話提議放慢步調。',
      [changed(easy, {line:'I’m very tired.', zh:'我很累。', task:'旅伴說很累，你仍用同一句話提議今天輕鬆一點。'})],
      [['a little / very','有點／很'], ['take it easy','放輕鬆']],
      '把體諒旅伴的說法獨立出來，不讓問候任務一次學三句；變化只改對方疲累的程度。'),
    task('activity-and-stay', '提議活動，商量停留時間', '旅伴',
      '你和旅伴正在安排今天的活動。你想去博物館，先提出建議，再一起商量要待多久；旅伴建議約 2 小時。',
      [activity, stay],
      '只把提議的活動地點換成公園。先提出建議，再問停留多久；旅伴仍建議約 2 小時。',
      [changed(activity, {answer:'How about the park?', answerZh:'去公園怎麼樣？', task:'你想去公園，先向旅伴提出建議。', words:'how about / the park', options:['同意去公園','拒絕去公園']}), clone(stay)],
      [['museum / park','博物館／公園'], ['two hours','2 小時']],
      '原本活動、停留時間、出發時間三件事拆開；這輪只保留兩個問題，且變化不再同時改地點與時間。'),
    task('departure-and-wait', '約好出發時間，等一下再走', '旅伴',
      '你和旅伴已決定今天的活動，正在飯店商量出發時間。你提議 10 點出發；現在才 9 點 55 分，所以提議等一下。',
      [leave, waitTogether],
      '只把你提議的出發時間改成 10 點半。現在仍是 9 點 55 分；先約好時間，再提議等一下。',
      [changed(leave, {answer:'Let’s leave at ten thirty.', answerZh:'我們 10 點半出發吧。', task:'你想 10 點半出發，向旅伴提出建議。', words:'leave / ten thirty', options:['同意 10 點半出發','改成 9 點出發']}), clone(waitTogether)],
      [['ten / ten thirty','10 點／10 點半'], ['nine fifty-five','9 點 55 分'], ['wait','等待']],
      '將出發時間獨立於活動選擇，並給 Let’s wait. 一個真正對旅伴說的練習位置，不與向站務人員表達決定混用。'),
    task('route-and-duration', '問交通方式和車程', '旅伴',
      '你和旅伴已決定去博物館，但你還不知道怎麼去。旅伴知道可以搭公車，車程約 20 分鐘；用兩個問題問清楚。',
      [route, duration],
      '只把公車車程改成約 10 分鐘，目的地和交通方式都相同。再用同樣兩個問題問清楚。',
      [clone(route), changed(duration, {line:'About ten minutes.', zh:'大約 10 分鐘。', options:['車程約 10 分鐘','車程約 2 小時']})],
      [['bus','公車'], ['twenty / ten minutes','20／10 分鐘']],
      '保留原本兩個主動問句；變化只改車程，不再同時換目的地、交通方式與時間，也不突然考距離問法。'),
    task('next-bus-and-wait', '問下一班車，告知等車決定', '站務人員',
      '你和旅伴已在公車站，決定只要下一班在 10 分鐘內抵達就等車。向站務人員問下一班時間；得知再 5 分鐘會到後，告訴他你們會等。',
      [nextBus, waitStaff],
      '只把下一班的等候時間改成 10 分鐘，你們仍決定等車。沿用同樣兩句問時間、告知決定。',
      [changed(nextBus, {line:'In ten minutes.', zh:'再 10 分鐘就到。', options:['下一班再等 10 分鐘','每 10 分鐘一班']}), clone(waitStaff)],
      [['next bus','下一班公車'], ['in five / ten minutes','再 5／10 分鐘'], ['we’ll wait','我們會等']],
      '保留問下一班車與告知決定兩句；將「再多久到」和「多久一班」分清楚，不在練習中突然切成班距問題或改搭計程車。'),
    task('ticket-price', '先問單張票價', '售票員',
      '你在景點售票處，準備買成人票，但還不知道單張票價。先向售票員問清楚一張多少錢；這輪尚未決定張數。',
      [cost],
      '只把單張票價改成 12 美元。你仍先問一張成人票多少錢，聽出單張價格。',
      [changed(cost, {line:'Twelve dollars each.', zh:'每張 12 美元。', options:['單張 12 美元','兩張共 12 美元']})],
      [['ticket','票'], ['each','每張'], ['ten / twelve dollars','10／12 美元']],
      '將單價詢問從原本三句購票任務拆出，先分清單價，再進入買票與總價。'),
    task('buy-and-total', '買好票，再問總價', '售票員',
      '你們是 2 位成人，已知道成人票每張 10 美元。向售票員買 2 張成人票，再問這次總共多少錢。',
      [buy, total],
      '只把成人數換成 3 位，每張仍是 10 美元。買 3 張成人票，再問總價；總價會跟著張數變成 30 美元。',
      [changed(buy, {answer:'Three adult tickets, please.', answerZh:'請給我 3 張成人票。', task:'這次是 3 位成人，向售票員買 3 張成人票。', words:'three / adult tickets / please', options:['買 3 張成人票','買 3 張兒童票']}), changed(total, {line:'Thirty dollars.', zh:'30 美元。', options:['總共 30 美元','總共 10 美元']})],
      [['adult ticket','成人票'], ['two / three','2／3'], ['altogether','總共'], ['twenty / thirty dollars','20／30 美元']],
      '購票與總價固定練兩句；單價在情境中先交代，張數變化所造成的總價一併教清楚，不再要求額外的單價問句。')
  ];
}

function day13(base) {
  const place = fromPhrase(base, 'place', '提出想去的地點',
    'The park or the museum?', '公園還是博物館？',
    '你想待在室內，提議去博物館。', 'let’s / the museum', ['選博物館','選公園']);
  const hot = fromPhrase(base, 'hot', '說出選擇的理由',
    'Why?', '為什麼？',
    '外面很熱，這是你選博物館的理由，告訴旅伴。', 'too hot / outside', ['因為外面太熱','因為想在戶外']);
  const bus = fromPhrase(base, 'bus', '提出另一種交通方式',
    'Let’s walk.', '我們走路吧。',
    '你想搭公車，問旅伴能不能改搭公車。', 'can we / take the bus', ['提出改搭公車','同意走路']);
  const agree = fromPhrase(base, 'agree', '回應對方同意',
    'Sure.', '好啊。',
    '旅伴同意你的交通建議，你也用本輪的同意句接話。', 'sounds / good', ['雙方同意這個決定','取消這個決定']);
  const tired = fromPhrase(base, 'tired', '說明自己的狀況',
    'Are you okay?', '你還好嗎？',
    '你已走了一段路，覺得累了，告訴旅伴。', 'I’m / tired', ['覺得累','覺得餓']);
  const rest = fromPhrase(base, 'rest', '提出休息需求',
    'Sure.', '好啊。',
    '你已說明自己的狀況，再問能不能休息一下。', 'can we / take a break', ['同意休息一下','不同意休息'], true);
  const drink = fromPhrase(base, 'drink', '說出自己的飲料選擇',
    'Water or tea?', '水還是茶？',
    '旅伴要一起買飲料，你想喝水，告訴他。', 'water / please', ['你選水','你選茶']);
  const askBack = fromPhrase(base, 'you', '也問旅伴的選擇',
    'Tea for me.', '我要茶。',
    '你已選好自己的飲料，再問旅伴要喝什麼。', 'how / about / you', ['旅伴選茶','旅伴選水'], true);
  return [
    task('place-and-reason', '選一個地點，說一個理由', '旅伴',
      '你和旅伴在公園與博物館之間做選擇。外面很熱，你想待在室內；先提議去博物館，對方問原因時，再說外面太熱。',
      [place, hot],
      '只把天氣改成外面太冷。你仍想去博物館；先提議地點，對方問原因時，再說外面太冷。',
      [clone(place), changed(hot, {answer:'It’s too cold outside.', answerZh:'外面太冷了。', task:'外面很冷，這是你選博物館的理由，告訴旅伴。', words:'too cold / outside', options:['因為外面太冷','因為想在戶外']})],
      [['museum','博物館'], ['hot / cold','熱／冷'], ['outside','外面']],
      '把地點與理由分成兩步，不再以一個長答案裝兩句；拿掉本輪額外的出發安排與同意句，只換冷／熱。'),
    task('transport-alternative', '提出交通替代方式，談好決定', '旅伴',
      '你和旅伴已決定去博物館，正在商量怎麼去。旅伴提議走路，但你想搭公車；先提出公車這個替代方式，對方同意後再回應。',
      [bus, agree],
      '只把你想搭的交通工具換成計程車。旅伴仍先提議走路，你提出替代方式，再回應他的同意。',
      [changed(bus, {answer:'Can we take a taxi?', answerZh:'我們可以搭計程車嗎？', task:'你想搭計程車，問旅伴能不能改搭計程車。', words:'can we / take a taxi', options:['提出改搭計程車','同意走路']}), clone(agree)],
      [['bus / taxi','公車／計程車'], ['sure','好啊'], ['sounds good','聽起來不錯']],
      '原本一次要說天氣理由、提出交通建議、回應三句，縮成交通問句與同意句；不再變化成先說累了的新題。'),
    task('state-and-break', '說明狀況，提出休息需求', '旅伴',
      '你和旅伴已走了一段路，你覺得累了，想先休息一下。回答旅伴的關心，再主動問能不能休息。',
      [tired, rest],
      '只把你的狀況改成口渴；你仍想先休息一下。先說口渴，再用同一句話詢問能不能休息。',
      [changed(tired, {answer:'I’m thirsty.', answerZh:'我渴了。', task:'你覺得口渴，告訴關心你的旅伴。', words:'I’m / thirsty', options:['覺得渴','覺得餓']}), clone(rest)],
      [['tired / thirsty','累／渴'], ['take a break','休息一下']],
      '把「我累了」與「可以休息嗎」拆成兩個清楚的開口位置；教師不再用未教的 Okay, thanks. 取代學生該練的主動需求句。'),
    task('drink-and-return-question', '選飲料，也問問旅伴', '旅伴',
      '休息時，旅伴準備一起買飲料，可以選水或茶。你想喝水；先說自己的選擇，再問旅伴要喝什麼，他選茶。',
      [drink, askBack],
      '只把你的選擇換成茶，旅伴也仍選茶。先說自己的選擇，再用同一句話問回去。',
      [changed(drink, {answer:'Tea, please.', answerZh:'茶，謝謝。', task:'這次你想喝茶，告訴旅伴。', words:'tea / please', options:['你選茶','你選水']}), clone(askBack)],
      [['water / tea','水／茶'], ['How about you?','那你呢？']],
      '將選飲料與 How about you? 分別練習，移除額外的第三句 Okay.；變化只換自己的飲料，不突然交換成尚未練習的提問角色。')
  ];
}

function day14(base) {
  const destination = fromPhrase(base, 'destination', '問今天的目的地',
    'We’re going to the beach.', '我們要去海邊。',
    '你已報名今天的團體行程，先問今天要去哪裡。', 'where / going', ['今天去海邊','今天去博物館'], true);
  const confirmPlace = fromPhrase(base, 'confirm-place', '把目的地說回去確認',
    'That’s right.', '對，沒錯。',
    '你聽到今天去海邊，把地點說回去確認一次。', 'beach / right', ['確認今天去海邊','改成去公園'], true);
  const meet = fromPhrase(base, 'meet', '問集合地點',
    'In the hotel lobby.', '在飯店大廳。',
    '你已報名行程，問行程人員要在哪裡集合。', 'where / meet', ['在飯店大廳集合','在博物館入口集合'], true);
  const leave = fromPhrase(base, 'leave', '問出發時間',
    'At nine.', '9 點。',
    '集合地點已問清楚，再問今天幾點出發。', 'what time / leave', ['9 點出發','10 點出發'], true);
  const back = fromPhrase(base, 'return', '問回到飯店的時間',
    'Around three.', '大約 3 點。',
    '你和旅伴都知道行程結束會回飯店，問大約幾點回來。', 'what time / get back', ['下午約 3 點回來','晚上約 9 點回來'], true);
  const friend = fromPhrase(base, 'friend', '請旅伴指出他的朋友',
    'The one in blue.', '穿藍色衣服的那位。',
    '現場有一位穿藍色、一位穿綠色衣服的人；問旅伴哪一位是他的朋友。', 'which one / your friend', ['穿藍色衣服的那位','穿綠色衣服的那位'], true);
  const repeat = fromPhrase(base, 'repeat', '請對方重說集合資訊',
    'At nine, in the hotel lobby.', '9 點，在飯店大廳。',
    '你剛才沒聽清楚集合資訊，請行程人員再說一次。', 'sorry / say / again', ['9 點在飯店大廳','10 點在飯店大廳'], true);
  const confirm = step('confirm-time-place', '把時間地點說回去確認',
    'Nine, in the lobby, right?', '9 點，在大廳，對嗎？',
    'That’s right.', '對，沒錯。',
    '重聽後，你知道是 9 點在大廳，把時間地點說回去確認。', 'nine / lobby / right', ['時間地點都確認了','改成另一個時間'], true);
  return [
    task('confirm-destination', '詢問並確認目的地', '行程人員',
      '你已報名今天的團體行程，但還不確定目的地。向行程人員詢問，得知今天去海邊後，把地點說回去確認一次。',
      [destination, confirmPlace],
      '只把行程目的地換成博物館。先問今天去哪裡，聽到後再把新地點說回去確認。',
      [changed(destination, {line:'We’re going to the museum.', zh:'我們要去博物館。', options:['今天去博物館','今天去海邊']}), changed(confirmPlace, {answer:'The museum, right?', answerZh:'博物館，對嗎？', task:'這次聽到去博物館，把地點說回去確認一次。', words:'museum / right', options:['確認今天去博物館','改成去公園']})],
      [['beach / museum','海邊／博物館'], ['right','對、正確']],
      '保留原本的詢問＋確認兩句；目的地變化所需的替換詞與對方回覆先在第二部分教過，再進入任務。'),
    task('meeting-and-departure', '問集合地點與出發時間', '行程人員',
      '你已報名今天的團體行程，還需要確認集合和出發資訊。向行程人員問集合地點，再問出發時間；本次在飯店大廳集合，9 點出發。',
      [meet, leave],
      '只把出發時間改成 10 點，集合地點仍是飯店大廳。沿用同樣兩個問題問清楚。',
      [clone(meet), changed(leave, {line:'At ten.', zh:'10 點。', options:['10 點出發','9 點出發']})],
      [['hotel lobby','飯店大廳'], ['nine / ten','9 點／10 點'], ['leave','出發']],
      '保留兩個主動問句；原本同時換集合地點與時間，改成一次只換出發時間。'),
    task('return-time', '確認回到飯店的時間', '旅伴',
      '你和旅伴已報名團體行程，也都知道結束後會回到飯店。旅伴看過行程表，你想向他問清楚大約幾點回來。',
      [back],
      '只把回到飯店的時間改成下午約 4 點。你們仍參加同一種來回行程，沿用同一個問題詢問。',
      [changed(back, {line:'Around four.', zh:'大約 4 點。', options:['下午約 4 點回來','晚上約 9 點回來']})],
      [['get back','回來'], ['around','大約'], ['three / four','3 點／4 點']],
      '將回程時間從「回程＋認朋友」拆出，這一輪只集中練 What time do we get back?，能單獨完成與收尾。'),
    task('identify-friend', '請旅伴指出同行的朋友', '旅伴',
      '集合時，旅伴說他的朋友也在現場。你看見一位穿藍色衣服、一位穿綠色衣服的人，想請他指出哪一位是他的朋友。',
      [friend],
      '只把旅伴朋友的衣服顏色換成綠色，現場仍有藍衣和綠衣兩人。沿用同一個問題找出正確的人。',
      [changed(friend, {line:'The one in green.', zh:'穿綠色衣服的那位。', options:['穿綠色衣服的那位','穿藍色衣服的那位']})],
      [['friend','朋友'], ['in blue / in green','穿藍色衣服／穿綠色衣服']],
      '將認人獨立成情境完整的小任務，不需要先做回程題；只換衣服顏色，不同時變動時間與人物條件。'),
    task('repeat-and-confirm', '沒聽清楚，重問並確認', '行程人員',
      '行程人員剛交代今天的集合時間和地點，但你沒聽清楚。請他再說一次，再把聽到的「9 點、飯店大廳」說回去確認。',
      [repeat, confirm],
      '只把集合時間換成 10 點，地點仍是飯店大廳。先請重說，再把新時間和原來的地點確認一次。',
      [changed(repeat, {line:'At ten, in the hotel lobby.', zh:'10 點，在飯店大廳。', options:['10 點在飯店大廳','9 點在飯店大廳']}), changed(confirm, {answer:'Ten, in the lobby, right?', answerZh:'10 點，在大廳，對嗎？', task:'重聽後，你知道是 10 點在大廳，把時間地點說回去確認。', words:'ten / lobby / right'})],
      [['again','再一次'], ['lobby','大廳'], ['nine / ten','9 點／10 點']],
      '確認資訊改為單句 Nine, in the lobby, right?；只換時間，不再同時換時間與地點，也不把另一種完整確認問句突然放進測驗。')
  ];
}

module.exports = {11: day11, 12: day12, 13: day13, 14: day14};
