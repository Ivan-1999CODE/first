// Small, independently teachable tasks. Original phrase/reply banks stay in base.
const clone=value=>JSON.parse(JSON.stringify(value));
const step=(id,label,answer,answerZh,line,zh,task,words,choices,askFirst=true,valid=[0],extra={})=>({
 id,label,answer,answerZh,line,zh,task,words,
 objects:choices.map(x=>Array.isArray(x)?x:['▣',x]),valid,askFirst,
 effect:'✓ 已更新本輪任務卡；用同樣的說法繼續練習。',...extra
});
function task(key,name,role,context,steps,words,changeNote,variationTask,condition,patches={}){
 return {key,name,role,context,steps,words,changeNote,
  variation:{task:variationTask,condition,steps:steps.map((s,i)=>({...clone(s),...clone(patches[i]||{})}))}};
}
const choices=(...labels)=>labels.map(label=>['▣',label]);

function shopping(base){
 const price=[
  step('price','問單價','How much is this?','這個多少錢？','It’s six dollars.','這個 6 美元。','指著眼前的杯子，問多少錢。','how much / this',['6 美元','10 美元']),
  step('buy','決定購買','I’ll take it.','我要買這個。','Certainly.','好的。','6 美元在你的預算內，告訴店員你要買。','take / it',['買這個杯子','這次不買'])
 ];
 const find=[
  step('item','說要找的商品','I’m looking for a T-shirt.','我在找一件 T-shirt。','Can I help you?','需要幫忙嗎？','你在找一件 T-shirt，告訴店員。','looking for / T-shirt',['T-shirt','帽子'],false),
  step('size','回答需要的尺寸','Medium, please.','M 號，謝謝。','What size would you like?','你想要什麼尺寸？','店員已知道你要 T-shirt，回答需要 M 號。','medium / please',['M 號','L 號'],false)
 ];
 const unavailable=[
  step('stock','詢問需要的尺寸','Do you have this in medium?','這件有 M 號嗎？','We only have large.','我們只有 L 號。','你已選好款式和顏色；指著這件 T-shirt，問有沒有 M 號。','have / medium',['只有 L 號，M 號缺貨','M 號有貨']),
  step('try','先試有貨的尺寸','Can I try it on?','我可以試穿嗎？','Of course.','當然可以。','店裡只剩 L 號；你願意先試，再決定要不要買。','try / it on',['先試穿 L 號','已決定買 M 號'])
 ];
 const color=[
  step('color','從有貨顏色中選擇','I’d like the black T-shirt.','我想要那件黑色 T-shirt。','We have black or green, but not blue.','有黑色或綠色，沒有藍色。','店員已知道你要 M 號；藍色沒有貨，你決定選黑色。','like / black / T-shirt',['黑色 M 號','綠色 M 號','藍色：缺貨'],false),
  step('try','提出試穿','Can I try it on?','我可以試穿嗎？','Of course.','當然可以。','選好黑色 T-shirt，買之前想先試穿。','try / it on',['先試穿選好的 T-shirt','直接買未試穿的 T-shirt'])
 ];
 const budget=[
  step('budget','說明預算','I have ten dollars.','我有 10 美元。','The mug is twelve dollars.','杯子 12 美元。','你只有 10 美元，先讓店員知道你的預算。','have / ten dollars',['預算 10 美元','預算 12 美元'],false),
  step('cheaper','詢問便宜替代品','Do you have something cheaper?','有便宜一點的嗎？','This magnet is four dollars.','這個磁鐵 4 美元。','店員已知道你的預算，接著問有沒有便宜一點的。','something / cheaper',['磁鐵 4 美元','杯子 12 美元'])
 ];
 const quantity=[
  step('quantity','說出數量','I’d like three bottles of water.','我想要 3 瓶水。','How many bottles would you like?','你想要幾瓶？','水每瓶 2 美元；你要買 3 瓶。','three / bottles of water',['3 瓶水','2 瓶水'],false),
  step('total','詢問總價','How much are they?','這些總共多少錢？','Six dollars in total.','總共 6 美元。','已選好 3 瓶水，再問這些總共多少錢。','how much / they',['總共 6 美元','每瓶 6 美元'])
 ];
 const payment=[
  step('card','詢問能否刷卡','Can I pay by card?','我可以刷卡嗎？','Cash only, please.','只收現金。','你已選好杯子，也知道價格是 6 美元。先問能不能刷卡。','pay / card',['只收現金','可以刷卡']),
  step('cash','改用現金','I’ll pay in cash.','我會付現金。','Thank you.','謝謝。','店裡只收現金，而你有足夠現金。告訴店員你會付現。','pay / cash',['付 6 美元現金','刷卡'])
 ];
 const bag=[
  step('bag','婉拒袋子','No, thank you.','不用了，謝謝。','Would you like a bag?','需要袋子嗎？','商品已買好。你帶了自己的袋子，不需要店員另外提供。','no / thank you',['用自己的袋子','要店員提供袋子'],false)
 ];
 return [
  task('price-and-buy','問價格，再決定買','店員','你喜歡眼前的杯子，預算 10 美元。先問價格，聽到 6 美元後決定購買；這輪先不處理付款。',price,
   [['mug','杯子'],['six dollars','6 美元'],['take it','買這個']],
   '把原本問價、購買、付款拆開；本輪只保留問價和決定購買。',
   '只把眼前商品換成明信片；價格仍是 6 美元，預算仍是 10 美元。先問價格，再決定買。','商品：杯子 → 明信片',
   {0:{task:'指著眼前的明信片，問多少錢。'},1:{task:'6 美元在預算內，告訴店員你要買明信片。',objects:choices('買這張明信片','這次不買')}}),
  task('find-item-and-size','說商品，回答尺寸','店員','你剛進店，想找 M 號 T-shirt。店員還不知道你在找什麼；先說商品，再回答店員想要什麼尺寸。',find,
   [['T-shirt','T-shirt'],['medium','M 號'],['large','L 號']],
   '把找商品與尺寸短答保留在同一輪；主動問尺寸、缺貨、顏色和試穿分開練。',
   '只把需要的尺寸改成 L 號，商品仍是 T-shirt。先說商品，再回答 L 號。','尺寸：M → L',
   {1:{answer:'Large, please.',answerZh:'L 號，謝謝。',task:'店員已知道你要 T-shirt，這次回答需要 L 號。',words:'large / please',valid:[1]}}),
  task('size-unavailable-and-try','尺寸缺貨，先試有貨的','店員','你已看中一件 T-shirt，款式與顏色都確定。想問有沒有 M 號；店裡只剩 L 號，你願意先試穿，再決定是否購買。',unavailable,
   [['medium','M 號'],['large','L 號'],['small','S 號'],['try it on','試穿']],
   '保留原來 M 號缺貨時的替代選擇，不因拆小任務而省掉缺貨情境；只問尺寸與試穿兩句。',
   '只把店內剩下的尺寸從 L 號改成 S 號，M 號仍缺貨。先問 M 號，聽到庫存後願意先試 S 號。','剩餘庫存：L 號 → S 號',
   {0:{line:'We only have small.',zh:'我們只有 S 號。',objects:choices('只有 S 號，M 號缺貨','M 號有貨')},1:{task:'店裡只剩 S 號；你這次願意先試，再決定要不要買。',objects:choices('先試穿 S 號','已決定買 M 號')}}),
  task('color-and-try','選顏色，再試穿','店員','店員已知道你要 M 號 T-shirt。M 號有黑色和綠色，藍色缺貨；你先選黑色，再詢問能否試穿。',color,
   [['black','黑色'],['green','綠色'],['blue','藍色'],['try it on','試穿']],
   '讓缺貨資訊只用來選可買顏色；本輪不用重新找商品、回答尺寸或付款。',
   '只把想要的顏色改成綠色；仍是 M 號 T-shirt，庫存相同。選綠色後，詢問能否試穿。','顏色：黑色 → 綠色',
   {0:{answer:'I’d like the green T-shirt.',answerZh:'我想要那件綠色 T-shirt。',task:'藍色沒有貨，你這次決定選綠色。',words:'like / green / T-shirt',valid:[1]},1:{task:'選好綠色 T-shirt，買之前想先試穿。'}}),
  task('budget-and-cheaper','說預算，找便宜一點的','店員','你想買小禮物。杯子要 12 美元，你只有 10 美元；先說預算，再問便宜一點的選項。這輪先找到可負擔的選項，不增加購買或付款句。',budget,
   [['ten dollars','10 美元'],['eight dollars','8 美元'],['cheaper','便宜一點'],['magnet','磁鐵']],
   '把原本一個步驟裡的兩句拆成兩段短對話；預算和便宜替代各練一句。',
   '只把預算從 10 美元改成 8 美元。杯子仍要 12 美元，店員仍提供 4 美元的磁鐵；先說預算，再問便宜一點的。','預算：10 → 8 美元',
   {0:{answer:'I have eight dollars.',answerZh:'我有 8 美元。',task:'你只有 8 美元，先讓店員知道你的預算。',words:'have / eight dollars',objects:choices('預算 8 美元','預算 12 美元')}}),
  task('quantity-and-total','說數量，問總價','店員','你在買水，每瓶 2 美元。店員知道你要水，但還不知道數量；你要 3 瓶，接著問總價。',quantity,
   [['three bottles','3 瓶'],['two bottles','2 瓶'],['each','每個／每瓶'],['in total','總共']],
   '把多件商品的數量和總價留在同一輪，付款另練；分清單價與總價。',
   '只把數量從 3 瓶改成 2 瓶，每瓶仍是 2 美元。先說數量，再問總價；總價因此變成 4 美元。','數量：3 → 2 瓶（總價跟著數量變動）',
   {0:{answer:'I’d like two bottles of water.',answerZh:'我想要 2 瓶水。',task:'水每瓶仍是 2 美元；這次你要買 2 瓶。',words:'two / bottles of water',valid:[1]},1:{line:'Four dollars in total.',zh:'總共 4 美元。',task:'已選好 2 瓶水，再問這些總共多少錢。',objects:choices('總共 4 美元','每瓶 4 美元')}}),
  task('card-or-cash','問刷卡，改付現金','店員','杯子已選好，價格是 6 美元。你想先問能不能刷卡；這間店只收現金，而你有足夠現金，可以改付現。',payment,
   [['card','卡片／刷卡'],['cash','現金'],['cash only','只收現金']],
   '保留刷卡詢問與只收現金的應對；不用把問價、買東西、袋子一次全部重演。',
   '只把已選好的商品換成明信片，價格仍是 6 美元，仍只收現金。先問能不能刷卡，再表示會付現金。','商品：杯子 → 明信片',
   {0:{task:'你已選好明信片，也知道價格是 6 美元。先問能不能刷卡。'}}),
  task('accept-or-decline-bag','回應要不要袋子','店員','商品已買好，店員問要不要袋子。你有自己的袋子，這輪只練禮貌婉拒；不再加購物流程。',bag,
   [['bag','袋子'],['no, thank you','不用了，謝謝'],['yes, please','好的，麻煩你']],
   '保留原加購袋子的接受與婉拒功能，獨立成一個一句就能完成的小任務。',
   '只改成你沒有帶袋子，現在需要店員提供。店員仍問同一個問題，請接受袋子。','需求：不需要袋子 → 需要袋子',
   {0:{answer:'Yes, please.',answerZh:'好的，麻煩你。',task:'你沒有帶袋子，現在需要店員提供。',words:'yes / please',valid:[1]}})
 ];
}

function airport(base){
 const checkin=[
  step('checkin','提出報到需求','I’d like to check in.','我想辦理報到。','Of course.','當然可以。','你已到航空公司櫃檯，先說想辦理報到。','like to / check in',['辦理機場報到','辦理飯店入住']),
  step('bags','回答行李件數','One bag, please.','一件行李，謝謝。','How many bags are you checking in?','您要託運幾件行李？','你要託運 1 件行李，回答件數。','one / bag',['1 件行李','2 件行李'],false)
 ];
 const seat=[step('seat','選擇座位','An aisle seat, please.','請給我靠走道的座位。','Would you like a window or an aisle seat?','您想要靠窗還是靠走道的座位？','報到資料與行李已確認，你想坐靠走道。','aisle / seat',['靠走道','靠窗'],false)];
 const gate=[
  step('gate','詢問登機門','Which gate should I go to?','我應該去哪個登機門？','Gate twelve.','12 號登機門。','報到已完成，但你不知道登機門，請地勤告訴你。','which / gate',['12 號登機門','20 號登機門']),
  step('again','請再說一次','Could you say that again, please?','可以請你再說一次嗎？','Gate twelve.','12 號登機門。','剛才沒有聽清楚號碼，請地勤再說一次。','say / again',['確認 12 號','確認 20 號'])
 ];
 const visit=[
  step('purpose','回答來訪目的','I’m here on vacation.','我是來度假的。','What is the purpose of your visit?','您這次來訪的目的是什麼？','這個情境中你是來度假的，如實回答。','here / vacation',['度假','出差'],false),
  step('duration','回答停留時間','Seven days.','7 天。','How long will you stay?','您會停留多久？','你這次預計停留 7 天。','seven / days',['7 天','14 天'],false)
 ];
 const stay=[step('hotel','回答住宿地點','At Sunny Hotel.','住 Sunny Hotel。','Where will you be staying?','您會住在哪裡？','官員已問過旅行目的和天數；你的訂房是 Sunny Hotel。','at / Sunny Hotel',['Sunny Hotel','Green Park Hotel'],false)];
 const food=[
  step('food','如實說明食物','Yes, I have some cookies.','有，我帶了一些餅乾。','Are you carrying any food?','您有攜帶食物嗎？','這個練習情境中，你的包包裡有餅乾，請如實說明。','have / some cookies',['有帶餅乾','沒有帶食物'],false),
  step('declare','詢問是否要申報','Do I need to declare this?','這個需要申報嗎？','Please show me the food.','請把食物拿給我看。','指著帶來的餅乾，詢問是否需要申報；再依這位官員的指示出示物品。','need / declare',['出示帶來的食物','未確認就直接離開'])
 ];
 return [
  task('check-in-and-bags','辦理報到，說行李件數','地勤人員','你在航空公司櫃檯，要辦理報到並託運 1 件行李。這輪先完成這兩件事，座位另外練。',checkin,
   [['check in','報到／託運'],['one bag','1 件行李'],['two bags','2 件行李']],
   '把原本報到、行李和座位三個功能拆開；行李固定用同一句短答。',
   '只把託運行李改成 2 件，報到需求不變。先提出報到，再回答行李件數。','行李：1 → 2 件',
   {1:{answer:'Two bags, please.',answerZh:'兩件行李，謝謝。',task:'你這次要託運 2 件行李。',words:'two / bags',valid:[1]}}),
  task('seat-choice','選靠窗或靠走道','地勤人員','你正在報到，資料與行李件數都已確認。現在只剩座位偏好要回答；你想坐靠走道。',seat,
   [['aisle seat','靠走道座位'],['window seat','靠窗座位']],
   '讓座位偏好單獨反覆練，不再附帶報到和行李兩句。',
   '只把座位偏好改成靠窗，地勤仍問同一個問題。','座位：靠走道 → 靠窗',
   {0:{answer:'A window seat, please.',answerZh:'請給我靠窗的座位。',task:'你這次想坐靠窗。',words:'window / seat',valid:[1]}}),
  task('gate-and-repeat','問登機門，沒聽清楚再問','地勤人員','你已完成報到，拿著登機證，但不確定登機門。先問登機門；第一次沒聽清楚，再請地勤重說。',gate,
   [['gate','登機門'],['twelve','12'],['twenty','20'],['again','再一次']],
   '保留原本問登機門和重問的自然連續對話，兩個步驟都使用相同號碼。',
   '只把地勤告知的登機門從 12 號改成 20 號。你的兩句問法相同；第二次仍重說 20 號。','登機門：12 → 20 號',
   {0:{line:'Gate twenty.',zh:'20 號登機門。',valid:[1]},1:{line:'Gate twenty.',zh:'20 號登機門。',valid:[1]}}),
  task('visit-purpose-and-days','回答旅行目的與天數','入境官員','你來度假，預計停留 7 天。官員依序問來訪目的和停留多久，按情境如實回答；住宿留下一輪。',visit,
   [['vacation','度假'],['seven days','7 天'],['fourteen days','14 天']],
   '把原本三個入境問題拆成目的／天數與住宿兩個任務。',
   '只把停留時間改成 14 天，目的仍是度假。回答同樣兩個問題。','停留時間：7 → 14 天',
   {1:{answer:'Fourteen days.',answerZh:'14 天。',task:'你這次預計停留 14 天。',words:'fourteen / days',valid:[1]}}),
  task('hotel-information','回答住宿地點','入境官員','官員已知道你這次來度假和停留的天數，現在問住在哪裡。你已訂好 Sunny Hotel，只需說出住宿地點。',stay,
   [['at','在'],['Sunny Hotel','Sunny 飯店'],['Green Park Hotel','Green Park 飯店']],
   '住宿獨立成一句任務，避免每次重答全部入境問題。',
   '只把訂好的飯店改成 Green Park Hotel，回答同樣的住宿問題。','住宿：Sunny Hotel → Green Park Hotel',
   {0:{answer:'At Green Park Hotel.',answerZh:'住 Green Park Hotel。',task:'你的訂房改成 Green Park Hotel。',words:'at / Green Park Hotel',valid:[1]}}),
  task('food-and-declaration','說明食物，詢問申報','海關人員','這個教學情境中，你帶了一些餅乾。先如實回答有帶什麼，再問這項物品是否需要申報；官員要求你出示食物。',food,
   [['food','食物'],['cookies','餅乾'],['apples','蘋果'],['declare','申報']],
   '保留如實回答與主動詢問兩個功能；只練依官員指示處理，不暗示所有地點有相同申報規則。',
   '只把帶來的食物從餅乾改成蘋果。先如實說明，再問這項物品是否需要申報；官員仍請你出示。','食物：餅乾 → 蘋果',
   {0:{answer:'Yes, I have some apples.',answerZh:'有，我帶了一些蘋果。',task:'這次包包裡帶的是蘋果，請如實說明。',words:'have / some apples',objects:choices('有帶蘋果','沒有帶食物')},1:{task:'指著帶來的蘋果，詢問是否需要申報；再依官員指示出示物品。'}})
 ];
}

function transit(base){
 const ticket=[
  step('ticket','說張數與目的地','One ticket to Central Station, please.','一張到中央車站的票，謝謝。','Certainly.','好的。','你要買 1 張到 Central Station 的車票，先提出需求。','one ticket / Central Station',['1 張到 Central Station','1 張到機場']),
  step('type','選單程票','Single, please.','單程，謝謝。','Single or return?','單程還是來回？','你只需要單程票。','single / please',['單程票','來回票'],false)
 ];
 const pay=[
  step('price','問票價','How much is it?','多少錢？','Twelve dollars.','12 美元。','站務人員已知道你要 1 張到中央車站的單程票；問這張票多少錢。','how much / it',['12 美元','20 美元']),
  step('card','問能否刷卡','Can I pay by card?','我可以刷卡嗎？','Yes, you can.','可以。','你已知道票價，接著問能不能刷卡。','pay / card',['可以刷卡','只收現金'])
 ];
 const departure=[
  step('time','問發車時間','What time does it leave?','它幾點出發？','It leaves at two forty.','2 點 40 分出發。','你已買好票，出示車票問這班車幾點出發。','what time / leave',['2:40','4:20']),
  step('platform','問月台','Which platform?','哪個月台？','Platform six.','第 6 月台。','站務人員已知道是哪一班車；再問要去哪個月台。','which / platform',['第 6 月台','第 3 月台'])
 ];
 const metro=[
  step('line','問捷運路線','Which line should I take?','我該搭哪條線？','Take the green line.','搭綠線。','站務人員已知道你要去 River Market；問先搭哪條線。','which / line',['先搭綠線','先搭紅線']),
  step('change','問轉乘站','Where do I change?','我在哪裡轉乘？','Change at Central Station.','在中央車站轉乘。','這段路程需要轉乘，再問在哪一站換車。','where / change',['在 Central Station 轉乘','在 River Market 轉乘'])
 ];
 const bus=[
  step('bus','問公車號碼','Which bus should I take?','我該搭哪班公車？','Take bus twelve.','搭 12 號公車。','站務人員已知道你要去 River Market；問應搭哪一班公車。','which / bus',['12 號公車','20 號公車']),
  step('destination','確認這班車的目的地','Does this bus go to River Market?','這班公車有到河畔市集嗎？','Yes, it does.','有，這班有到。','12 號公車停在眼前；再確認這班有沒有到 River Market。','this bus / River Market',['這班有到 River Market','這班沒有到 River Market'])
 ];
 const off=[
  step('stop','問下車站','Where should I get off?','我該在哪裡下車？','Get off at River Market.','在河畔市集下車。','司機已知道你要去 River Market；問應在哪裡下車。','where / get off',['在 River Market 下車','在 Central Station 下車']),
  step('confirm','確認下車站','Yes, that’s right.','對，沒錯。','Are you getting off at River Market?','您要在河畔市集下車嗎？','司機再確認你的下車站，回答沒錯。','yes / right',['確認在 River Market 下車','改成 Central Station 下車'],false)
 ];
 return [
  task('ticket-and-type','說車票需求，選單程或來回','售票員','你要買 1 張到 Central Station 的單程票。先用一句話說張數和目的地，再回答票種；價錢和付款另練。',ticket,
   [['ticket','車票'],['Central Station','中央車站'],['single','單程'],['return','來回']],
   '保留原本買票目的與張數，將票價付款分到下一輪；單程和來回放在同一句替換。',
   '只把票種改成來回票，仍是 1 張到 Central Station。先提出買票需求，再回答來回。','票種：單程 → 來回',
   {1:{answer:'Return, please.',answerZh:'來回，謝謝。',task:'這次需要來回票。',words:'return / please',valid:[1]}}),
  task('ticket-price-and-payment','問票價，問能否刷卡','售票員','售票員已知道你要 1 張到中央車站的單程票。你只需要問票價和能否刷卡，店裡可刷卡。',pay,
   [['twelve dollars','12 美元'],['ten dollars','10 美元'],['card','卡片／刷卡']],
   '把票價和付款獨立成兩句；不再重問張數、目的地與票種。',
   '只把票價從 12 美元改成 10 美元，其他車票條件和刷卡規則不變。仍問價格，再問能否刷卡。','票價：12 → 10 美元',
   {0:{line:'Ten dollars.',zh:'10 美元。',objects:choices('10 美元','20 美元')}}),
  task('departure-and-platform','問發車時間與月台','站務人員','你已買好票，出示車票讓站務人員知道你搭哪班。現在問出發時間和月台；時間、月台皆為教學設定。',departure,
   [['two forty','2 點 40 分'],['platform','月台'],['six','6'],['three','3']],
   '保留原本兩句，不再把其他車班問題混入本輪。',
   '只把月台從第 6 月台改成第 3 月台，出發時間仍是 2 點 40 分。問同樣兩個問題。','月台：6 → 3',
   {1:{line:'Platform three.',zh:'第 3 月台。',valid:[1]}}),
  task('metro-line-and-transfer','問捷運路線與轉乘站','站務人員','你想搭捷運去 River Market，站務人員已知道目的地。這條教學路線需要轉乘；先問搭哪條線，再問哪裡換車。',metro,
   [['green line','綠線'],['red line','紅線'],['change','轉乘'],['Central Station','中央車站']],
   '把原本混在一起的捷運和公車分開，將捷運路線與轉乘組成兩句。',
   '只把先搭的路線從綠線改成紅線，仍在 Central Station 轉乘去 River Market。問同樣兩個問題。','捷運線：綠線 → 紅線',
   {0:{line:'Take the red line.',zh:'搭紅線。',valid:[1]}}),
  task('bus-number-and-destination','問公車號碼，確認有到','站務人員','你想搭公車去 River Market，站務人員已知道目的地。先問公車號碼，再指著停在眼前的那班車確認是否有到。',bus,
   [['bus twelve','12 號公車'],['bus twenty','20 號公車'],['River Market','河畔市集']],
   '公車號碼和核對目的地相鄰練習，不再先插入捷運線。',
   '只把應搭的公車從 12 號改成 20 號，目的地仍是 River Market。問車號，再指著眼前的 20 號公車確認目的地。','公車號碼：12 → 20',
   {0:{line:'Take bus twenty.',zh:'搭 20 號公車。',valid:[1]},1:{task:'20 號公車停在眼前；確認這班有沒有到 River Market。'}}),
  task('get-off-and-confirm','問下車站，再確認','司機','你已搭上車，司機知道你要去 River Market。先問在哪裡下車，再接住司機的確認問題。',off,
   [['get off','下車'],['River Market','河畔市集'],['Central Station','中央車站'],['that’s right','沒錯']],
   '將下車與簡短確認留在同一輪；轉乘已在捷運任務練習。',
   '只把目的地改成 Central Station，司機已知道這個變更。先問下車站，再確認司機說的站名。','目的地：River Market → Central Station',
   {0:{line:'Get off at Central Station.',zh:'在中央車站下車。',task:'司機已知道你要去 Central Station；問應在哪裡下車。',valid:[1]},1:{line:'Are you getting off at Central Station?',zh:'您要在中央車站下車嗎？',task:'司機確認你要在 Central Station 下車，回答沒錯。',objects:choices('確認在 Central Station 下車','改成 River Market 下車')}})
 ];
}

function city(base){
 const route=[
  step('directions','問博物館怎麼走','How do I get to the museum?','我要怎麼去博物館？','Go straight. Turn left at the first intersection.','直走，在第一個路口左轉。','你想去博物館，先問路人怎麼走。','get to / museum',['直走，第一個路口左轉','直走，第二個路口左轉']),
  step('distance','確認遠近','Is it far?','遠嗎？','It’s a five-minute walk.','走路約 5 分鐘。','已問到路線，再問遠不遠。','it / far',['走路約 5 分鐘','走路約 50 分鐘'])
 ];
 const taxi=[
  step('accept','選擇搭計程車','Yes, I’ll take a taxi.','好，我要搭計程車。','Would you like to take a taxi?','你想搭計程車嗎？','你在排班計程車區，決定搭車，回答司機。','take / taxi',['搭計程車','走路'],false),
  step('destination','告訴司機目的地','The museum, please.','請到博物館。','Where would you like to go?','您想去哪裡？','接著告訴司機你要去博物館。','museum / please',['目的地：博物館','目的地：飯店'],false)
 ];
 const fare=[
  step('time','詢問車程','How long does it take?','需要多久？','About fifteen minutes.','約 15 分鐘。','司機已知道你要去博物館；先問車程多久。','how long / take',['15 分鐘','20 分鐘']),
  step('fare','詢問車資','How much will it be?','大約要多少錢？','About twelve dollars.','約 12 美元。','接著問這趟車大約要多少錢。','how much / be',['12 美元','20 美元'])
 ];
 const pickup=[
  step('driver','確認預約司機','Are you my Uber driver?','你是我的 Uber 司機嗎？','Yes, I am.','對，我是。','你透過預約行程聯絡到司機，先確認是不是來接你的人。','my / Uber driver',['對，是預約的司機','不是預約的司機']),
  step('location','說明等車位置','I’m outside the hotel entrance.','我在飯店入口外面。','Where are you waiting?','您在哪裡等車？','你在飯店入口外面，告訴司機。','outside / hotel entrance',['飯店入口外','博物館入口外'],false)
 ];
 const off=[
  step('place','指定下車位置','At the entrance, please.','請在入口下車。','Would you like to get out here?','您想在這裡下車嗎？','車還沒到入口；你想在前方入口下車，先告訴司機。','at / entrance',['到入口再下車','現在就下車'],false),
  step('stop','請司機停車','Could you stop here, please?','可以請你在這裡停車嗎？','Sure. Here is fine.','好的，這裡可以。','現在已到入口，也可以停車，請司機在這裡停。','stop / here',['在指定位置停車','繼續前進'])
 ];
 return [
  task('directions-and-distance','問路線，再問遠不遠','路人','你想走路去博物館，面朝地圖上方。先問怎麼走，再問遠不遠；路線和距離為教學設定。',route,
   [['museum','博物館'],['first intersection','第一個路口'],['second intersection','第二個路口'],['far','遠']],
   '問路核心簡化成一句，Excuse me 留作選用；保留路口聽辨及距離確認，不要求學生背路人指示。',
   '只把左轉的位置改成第二個路口，方向仍是左轉，走路仍約 5 分鐘。你的兩句問題相同。','路口：第一個 → 第二個',
   {0:{line:'Go straight. Turn left at the second intersection.',zh:'直走，在第二個路口左轉。',valid:[1]}}),
  task('taxi-and-destination','決定搭車，說目的地','司機','你在排班計程車區，司機還不知道你要去哪裡。先接受搭車，再告訴司機你要去博物館。',taxi,
   [['taxi','計程車'],['museum','博物館'],['hotel','飯店']],
   '把原本分散在短問答的交通決定和目的地串成兩句；時間與費用另練。',
   '只把目的地改成飯店，仍決定搭計程車。回答司機同樣的兩個問題。','目的地：博物館 → 飯店',
   {1:{answer:'The hotel, please.',answerZh:'請到飯店。',task:'這次你要去飯店，告訴司機。',words:'hotel / please',valid:[1]}}),
  task('travel-time-and-fare','問車程與車資','司機','你已告訴司機目的地是博物館，現在只需問車程和大約車資；時間與金額為教學設定。',fare,
   [['fifteen minutes','15 分鐘'],['twenty minutes','20 分鐘'],['twelve dollars','12 美元']],
   '把三句搭車流程拆開，這輪只問時間和費用，不再要求先說目的地。',
   '只把預估車程改成 20 分鐘，目的地和約 12 美元的車資都不變。問同樣兩個問題。','車程：15 → 20 分鐘',
   {0:{line:'About twenty minutes.',zh:'約 20 分鐘。',valid:[1]}}),
  task('driver-and-pickup','確認司機，說等車位置','司機','你已預約 Uber，正在飯店入口外等車。透過預約行程聯絡司機，先確認身份，再告知等車位置。',pickup,
   [['driver','司機'],['outside','外面'],['hotel entrance','飯店入口'],['museum entrance','博物館入口']],
   '保留身份與位置兩句，移除同一個位置問題在相鄰步驟重複出現的多餘台詞。',
   '只把等車地點改成博物館入口外，仍是同一筆預約。先確認司機，再說明位置。','等車地點：飯店入口外 → 博物館入口外',
   {1:{answer:'I’m outside the museum entrance.',answerZh:'我在博物館入口外面。',task:'你這次在博物館入口外面等車。',words:'outside / museum entrance',valid:[1]}}),
  task('dropoff-and-stop','指定位置，請司機停車','司機','車已接近目的地，但還沒到入口。你想在入口下車；先告知位置，等到入口可以停車時，再請司機停下。',off,
   [['entrance','入口'],['corner','街角'],['stop here','在這裡停車']],
   '保留下車地點與停車請求兩句，中文明確交代車輛何時到達，不重做整趟叫車。',
   '只把下車位置改成前方街角。先告知要在街角下車，車到街角且可以停車時，再請司機停。','下車位置：入口 → 街角',
   {0:{answer:'At the corner, please.',answerZh:'請在街角下車。',task:'車還沒到街角；你想在前方街角下車。',words:'at / corner',objects:choices('到街角再下車','現在就下車')},1:{task:'現在已到街角，也可以停車，請司機在這裡停。'}})
 ];
}

function dining(base){
 const order=[
  step('recommend','詢問推薦','What do you recommend?','你推薦什麼？','I recommend the chicken sandwich.','我推薦雞肉三明治。','你還沒決定主餐，先請店員推薦。','what / recommend',['推薦雞肉三明治','推薦番茄義大利麵']),
  step('order','點主餐','I’d like a chicken sandwich, please.','我想要一份雞肉三明治，謝謝。','May I take your order?','可以幫您點餐嗎？','你決定點店員推薦的雞肉三明治。','like / chicken sandwich',['雞肉三明治','番茄義大利麵'],false)
 ];
 const minute=[step('minute','請多給一點時間','Could we have another minute, please?','可以再給我們一點時間嗎？','Are you ready to order?','準備好點餐了嗎？','你和旅伴還沒選好，請店員再給一點時間。','we / another minute',['再看一下菜單','現在開始點餐'],false)];
 const dessert=[step('dessert','回應甜點需求','Chocolate cake, please.','巧克力蛋糕，謝謝。','Would you like something for dessert?','想吃點甜點嗎？','主餐已吃完，你想點巧克力蛋糕。','chocolate cake / please',['巧克力蛋糕','不點甜點'],false)];
 const coffee=[step('coffee','說咖啡偏好','Black, please.','黑咖啡，謝謝。','How would you like your coffee?','咖啡想要怎麼調配？','店員已知道你點了咖啡；你想喝不加奶的黑咖啡。','black / please',['黑咖啡，不加奶','加牛奶'],false)];
 // Preserve the original freely selectable food objects, including every
 // illustrated steak/egg option. The example answer is one usable preference.
 const foodSteps=clone(base.flows.find(f=>f.steps.some(s=>s.label==='牛排熟度')).steps).slice(0,2);
 foodSteps[0]={...foodSteps[0],id:'steak',label:'牛排熟度',answerZh:'五分熟，謝謝。',foodKind:'steak',
  task:'選自己喜歡的牛排熟度，用「熟度＋please」回答；先跟著五分熟的參考句練也可以。'};
 foodSteps[1]={...foodSteps[1],id:'eggs',label:'蛋的做法',answerZh:'炒蛋，謝謝。',foodKind:'eggs',
  task:'接著選自己喜歡的蛋料理，用「做法＋please」回答；先跟著炒蛋的參考句練也可以。'};
 const budget=[
  step('price','問餐點價格','How much is this?','這個多少錢？','It’s twelve dollars.','12 美元。','你有 10 美元預算，先指著餐點問價格。','how much / this',['12 美元，超出預算','12 美元，在預算內']),
  step('cheaper','找便宜的餐點','Is there a cheaper one?','有比較便宜的嗎？','The egg toast is seven dollars fifty.','蛋吐司 7 美元 50 分。','原餐點超出預算，問有沒有比較便宜的。','cheaper / one',['蛋吐司 7.50 美元','原餐點 12 美元'])
 ];
 const finish=[
  step('eat','選內用','For here, please.','內用，謝謝。','Is that for here or to go?','這份要內用還是外帶？','餐點已選好，你想坐在店裡吃。','for here',['內用','外帶'],false),
  step('finish','不再加點','That’s all, thank you.','就這些，謝謝。','Anything else?','還需要別的嗎？','你不需要再加其他餐點，告訴店員就這些。','that’s all',['不再加點','還要加點'],false)
 ];
 const amount=[
  step('confirm','確認聽到的金額','Is it eight dollars fifty?','是 8 美元 50 分嗎？','Yes, eight dollars fifty.','對，8 美元 50 分。','點餐已完成，你剛聽到似乎是 8 美元 50 分，先問是不是這個金額。','eight dollars fifty',['8.50 美元','18.50 美元']),
  step('repeat','請再說一次','Could you say that again, please?','可以請你再說一次嗎？','Eight dollars fifty.','8 美元 50 分。','店裡有點吵，你還沒聽清楚，請店員再說一次同一個金額。','say / again',['8.50 美元','18.50 美元'])
 ];
 return [
  task('recommend-and-order','請推薦，再點主餐','店員','你在咖啡廳還沒決定主餐。先請店員推薦，再點推薦的雞肉三明治；這輪先不加熟度、甜點或付款。',order,
   [['recommend','推薦'],['chicken sandwich','雞肉三明治'],['tomato pasta','番茄義大利麵']],
   '只用一種點餐句型，把另一種 I’ll have… 保留為原有替代說法；推薦和選餐前後一致。',
   '只把推薦及決定點的主餐換成番茄義大利麵。仍先請推薦，再用同一種句型點餐。','主餐：雞肉三明治 → 番茄義大利麵',
   {0:{line:'I recommend the tomato pasta.',zh:'我推薦番茄義大利麵。',valid:[1]},1:{answer:'I’d like the tomato pasta, please.',answerZh:'我想要番茄義大利麵，謝謝。',task:'你決定點店員推薦的番茄義大利麵。',words:'like / tomato pasta',valid:[1]}}),
  task('more-time-to-choose','還沒選好，請多一點時間','店員','你和旅伴正在看菜單，還沒決定。店員來問準備好了嗎；這輪只練請對方多給一點時間，不必立即決定餐點。',minute,
   [['another minute','再一點時間'],['we','我們'],['I','我']],
   '把原來 Not yet 加請求的兩句縮成一個自然請求；保留還沒決定時能應對的功能。',
   '只改成你一個人看菜單，仍還沒決定。把「我們」換成「我」，請店員再給一點時間。','用餐人數：同行 → 一個人',
   {0:{answer:'Could I have another minute, please?',answerZh:'可以再給我一點時間嗎？',task:'你一個人還沒選好，請店員再給一點時間。',words:'I / another minute'}}),
  task('dessert-choice','回答要不要甜點','店員','你已吃完主餐，店員詢問是否要甜點。你想點巧克力蛋糕，只要用一句短答說需求。',dessert,
   [['dessert','甜點'],['chocolate cake','巧克力蛋糕'],['no, thank you','不用了，謝謝']],
   '把原先藏在額外短問答的甜點需求獨立出來，接受和婉拒只改一項選擇。',
   '只改成你不想吃甜點；店員仍問同一個問題，禮貌婉拒即可。','甜點需求：要 → 不要',
   {0:{answer:'No, thank you.',answerZh:'不用了，謝謝。',task:'你這次不想吃甜點，禮貌婉拒。',words:'no / thank you',valid:[1]}}),
  task('coffee-preference','說出咖啡偏好','店員','你已點好咖啡，店員只想知道怎麼調配。你想喝黑咖啡，直接回答，不必重點整份餐。',coffee,
   [['coffee','咖啡'],['black','黑咖啡／不加奶'],['with milk','加牛奶']],
   '咖啡偏好不再和推薦、主餐、甜點堆在同一輪；先固定一句短答。',
   '只把咖啡偏好改成加牛奶，店員仍問同一個問題。','咖啡調配：黑咖啡 → 加牛奶',
   {0:{answer:'With milk, please.',answerZh:'加牛奶，謝謝。',task:'你這次想喝加牛奶的咖啡。',words:'with / milk',valid:[1]}}),
  task('steak-and-eggs','選牛排熟度與蛋的做法','店員','你已點一份牛排配蛋。店員依序問牛排熟度和蛋的做法；各選自己喜歡的一種，參考示範是五分熟與炒蛋。',foodSteps,
   [['steak','牛排'],['eggs','蛋'],['medium','五分熟'],['scrambled','炒蛋'],['well-done','全熟']],
   '保留原本所有牛排與蛋料理圖片、自由選擇及兩個問答；只限制一輪各練一種選擇，不要求背全部菜單。',
   '這次只把示範的牛排熟度從五分熟換成全熟，蛋仍是炒蛋。聽到哪一項問題，就回答對應的偏好。','牛排熟度：五分熟 → 全熟（蛋不變）',
   {0:{answer:'Well-done, please.',answerZh:'全熟，謝謝。',task:'這次只把牛排改成全熟，聽到熟度問題後回答。',words:'well-done / please',valid:[4]},1:{task:'蛋的做法不變，仍回答炒蛋。',valid:[0]}}),
  task('price-and-cheaper-food','問價格，找預算內餐點','店員','你有 10 美元預算，先指著餐點問價。這份要 12 美元，超出預算；再問比較便宜的餐點，店員提供 7.50 美元的蛋吐司。',budget,
   [['twelve dollars','12 美元'],['cheaper','比較便宜'],['egg toast','蛋吐司'],['seven dollars fifty','7 美元 50 分']],
   '保留原本問價和找替代餐點兩句；相近替代問法不增加必學數量。',
   '只把你的預算改成 8 美元，餐點價格都不變。先問原餐點價格，再找便宜的；7.50 美元的蛋吐司仍在預算內。','預算：10 → 8 美元',
   {0:{task:'你這次有 8 美元預算，先指著餐點問價格。'}}),
  task('eat-in-and-finish','說內用或外帶，結束點餐','店員','餐點已經選好，店員知道你點了什麼。你想內用，而且不再加點；回答用餐方式後，告訴店員就這些。',finish,
   [['for here','內用'],['to go','外帶'],['that’s all','就這些']],
   '把原來三個功能拆開；這輪只處理用餐方式和結束點餐，確認金額另外練。',
   '只把用餐方式改成外帶，餐點不變，也不再加點。先說外帶，再說就這些。','用餐方式：內用 → 外帶',
   {0:{answer:'To go, please.',answerZh:'外帶，謝謝。',task:'你這次要帶回去吃。',words:'to go',valid:[1]}}),
  task('confirm-price-and-repeat','確認金額，沒聽清楚再問','店員','點餐已完成，你剛才聽到的總價似乎是 8 美元 50 分。先確認這個金額；店裡有點吵，再請店員重說一次。',amount,
   [['eight dollars fifty','8 美元 50 分'],['seven dollars fifty','7 美元 50 分'],['again','再一次']],
   '把金額確認從長點餐流程抽出，搭配同一個金額的重問，保留原求助能力。',
   '只把總價改成 7 美元 50 分。先確認這個金額，沒聽清楚時再請重說；不變更餐點或用餐方式。','總價：8.50 → 7.50 美元',
   {0:{answer:'Is it seven dollars fifty?',answerZh:'是 7 美元 50 分嗎？',line:'Yes, seven dollars fifty.',zh:'對，7 美元 50 分。',task:'你剛聽到似乎是 7 美元 50 分，先確認是不是這個金額。',words:'seven dollars fifty',objects:choices('7.50 美元','17.50 美元')},1:{line:'Seven dollars fifty.',zh:'7 美元 50 分。',objects:choices('7.50 美元','17.50 美元')}})
 ];
}

module.exports={2:shopping,3:airport,4:transit,5:city,6:dining};
