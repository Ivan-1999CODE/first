// Authored synthesis tasks. Source phrases remain owned by the original A/B/C.
module.exports = function buildHotelPractice({steps, scenarios}) {
 const clone = value => JSON.parse(JSON.stringify(value));
 const byId = id => clone(scenarios.find(s => s.id === id));
 const combined = {
  ...byId('original'), id:'new-booking', label:'另一筆訂房', name:'Jamie Lin', nights:3, checkout:12, elevator:'右'
 };
 combined.steps = steps.map(s => clone(({
  name:byId('name'), nights:byId('nights'), checkout:byId('checkout'), elevator:byId('elevator')
 }[s.key] || byId('original')).steps.find(t => t.key === s.key)));
 const turn = (c, key, changes = {}) => ({...clone(c.steps.find(s => s.key === key)), ...changes});
 const original = byId('original'), right = byId('elevator'), noon = byId('checkout'), three = byId('nights');
 const repair = {line:'Two nights?',zh:'住兩晚，對嗎？',task:'看訂房資料，向櫃檯說清楚正確的住宿晚數。',askFirst:false};
 const challenges = [
  {id:'find-lift', label:'準備上樓', skill:'找出還缺的資訊', context:'你已完成入住，也拿到房卡。準備帶行李上樓，先把需要的資訊問清楚，再依回答決定往哪裡走。', known:['早餐包含在房價裡','退房時間是上午 11 點'], scenario:right, choices:['breakfast','checkout','elevator'], turns:[turn(right,'elevator')], nudge:'早餐和退房時間已經確認；想想你準備上樓，還缺什麼位置資訊。'},
  {id:'plan-departure', label:'安排離店', skill:'依目的選問題', context:'你已拿到房卡，正在安排離店當天的接送。請補齊還不知道的飯店資訊。', known:['早餐包含在房價裡','電梯在左邊'], scenario:noon, choices:['elevator','checkout','breakfast'], turns:[turn(noon,'checkout')], nudge:'接送需要配合離開房間的時間。電梯和早餐已確認。'},
  {id:'two-questions', label:'補齊兩項資訊', skill:'自行安排提問順序', context:'入住已完成，櫃檯只告訴你退房時間。你想在飯店吃早餐，接著帶行李上樓。請把需要的資訊確認完整。', known:['退房時間是上午 11 點'], scenario:original, choices:['breakfast','checkout','elevator'], turns:[turn(original,'breakfast'),turn(original,'elevator')], nudge:'退房時間已確認；早餐和上樓的位置還需要確認。兩件事先問哪個都可以。'},
  {id:'correct-nights', label:'晚數說錯了', skill:'比對資料並澄清', context:'櫃檯已找到你的訂房，正在核對晚數。先聽櫃檯的確認，再看訂房資料，用學過的說法澄清。', known:['姓名和護照已確認','請以自己的訂房資料為準'], scenario:three, choices:['name','nights','passport'], cue:{line:repair.line,zh:repair.zh}, turns:[turn(three,'nights',repair)], nudge:'比較訂房卡和櫃檯說的晚數；不用從入住需求重新說起。'},
  {id:'passport-now', label:'先接這一句', skill:'依當下問題回應', context:'你已報過訂房姓名和住宿晚數。櫃檯接著提出一個要求，請聽懂並直接回應。', known:['訂房姓名已確認','住宿晚數已確認'], scenario:original, choices:['name','passport','nights'], cue:{line:'May I see your passport, please?',zh:'可以看一下你的護照嗎？'}, turns:[turn(original,'passport')], nudge:'姓名和晚數已經說過。聽聽櫃檯現在想看哪一份證件。'},
  {id:'name-after-passport', label:'順序不一樣', skill:'離開固定順序接話', context:'櫃檯先看過護照、確認了晚數，現在需要你提供訂房使用的姓名。請聽對方的問題，再依訂房卡回應。', known:['護照已出示','住宿晚數已確認'], scenario:byId('name'), choices:['passport','name','checkin'], cue:{line:'What name is the reservation under?',zh:'訂房使用哪個名字？'}, turns:[turn(byId('name'),'name')], nudge:'護照姓名不一定等於訂房姓名；這次要提供訂房卡上的名字。'},
  {id:'breakfast-gap', label:'早餐要付費嗎', skill:'比較已知與未知', context:'你已完成入住，準備明天在飯店吃早餐。訂房資料沒有寫早餐是否要另外付費，請確認。', known:['退房時間是中午 12 點','電梯在左邊'], scenario:noon, choices:['checkout','breakfast','elevator'], turns:[turn(noon,'breakfast')], nudge:'時間與位置都已知道；這次要確認房價是否包含早餐。'},
  {id:'new-hotel', label:'換一間飯店', skill:'使用這次的新資訊', context:'這是一間新的飯店，不能沿用上一間的退房時間和電梯位置。入住已完成，早餐也已確認；請取得這次需要的時間與方向。', known:['早餐包含在房價裡','退房時間和電梯位置尚未確認'], scenario:combined, choices:['elevator','breakfast','checkout'], turns:[turn(combined,'checkout'),turn(combined,'elevator')], nudge:'先問時間或先問方向都可以。兩項都依這次的回答確認。'}
 ];
 const conversations = [
  {id:'whole-stay',label:'自己完成入住',level:'完整應用',scenario:combined,opening:'你好，我想辦理入住。',task:'依訂房卡完成入住，並確認早餐、退房時間與電梯位置。你可以自己安排提問順序。',guide:'先等待學生開口。已主動提供的資料直接記下，再問還缺的資料。',order:['checkin','name','passport','nights','breakfast','checkout','elevator']},
  {id:'staff-informs',label:'對方先說了一部分',level:'選擇接話',scenario:noon,opening:'你好，我想辦理入住。',task:'完成入住，並取得早餐、退房時間與電梯位置。留意對方已經說了哪些資訊，再補問還不知道的。',guide:'入住資料確認後，先主動說出退房時間。學生若聽懂，該目標即可確認；再等他補問早餐和電梯。需要再次確認時間也合理。',event:{trigger:'入住資料確認完成後，主動提供資訊',line:'Check-out is at twelve.',zh:'退房時間是中午 12 點。'},order:['checkin','name','passport','nights','checkout','breakfast','elevator']},
  {id:'different-order',label:'換個順序也能接',level:'自然接話',scenario:byId('name'),opening:'你好，我想辦理入住。',task:'依訂房卡辦理入住，最後取得住宿資訊。櫃檯的詢問順序可能不同，先聽，再回答。',guide:'學生提出入住後，先確認晚數，再請他出示護照，最後詢問尚未提供的訂房姓名。學生已先說的資料不必重問。',order:['checkin','nights','passport','name','breakfast','checkout','elevator']},
  {id:'clear-up',label:'澄清後繼續入住',level:'處理誤解',scenario:three,opening:'你好，我想辦理入住。',task:'依訂房卡完成入住和住宿資訊確認。過程中若對方說的資料和訂房卡不同，請澄清後繼續。',guide:'核對晚數時，先說 Two nights?，讓學生依訂房卡澄清為 3 晚。接著確認 Three nights.，再完成其他事項。本回只加入這一個誤解。',event:{trigger:'核對晚數時，先給一個需要修正的確認',line:'Two nights?',zh:'住兩晚，對嗎？',reply:'Three nights.',replyZh:'確認：住三晚。'},order:['checkin','name','passport','nights','breakfast','checkout','elevator']}
 ];
 return {
  version:2, challenges, conversations, transfer:combined,
  flowRoutes:[
   {id:'standard',label:'熟悉順序',note:'先把學過的內容連成同一段入住。',order:steps.map(s=>s.key)},
   {id:'passport-first',label:'先出示護照',note:'櫃檯先看護照，再問訂房姓名。先聽當下的問題，再回答。',order:['checkin','passport','name','nights','breakfast','checkout','elevator']},
   {id:'nights-first',label:'先確認晚數',note:'先確認晚數，再出示護照和報訂房姓名；入住資料齊全後才領取房卡。',order:['checkin','nights','passport','name','elevator','breakfast','checkout']}
  ],
  hearSupport:[{label:'櫃檯確認晚數',line:'Two nights?',zh:'住兩晚，對嗎？'},{label:'澄清後的確認',line:'Three nights.',zh:'確認：住三晚。'}]
 };
};
