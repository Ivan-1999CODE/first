// English Days 7–10: keep the original communication goals, in independent
// one- or two-line tasks. The compiler reuses these exchanges in Parts 2–7.
const clone=value=>JSON.parse(JSON.stringify(value));
function step(id,label,answer,answerZh,line,zh,task,words,options,askFirst=true){
 return {id,label,answer,answerZh,line,zh,task,words,
  objects:options.map(text=>['▣',text]),valid:[0],askFirst,
  effect:'✓ 已記下這次的資訊或決定，再接下一句。'};
}
function task(key,name,role,context,steps,variationTask,changes,words,changeNote){
 return {key,name,role,context,steps,words,changeNote,
  variation:{task:variationTask,steps:steps.map((s,i)=>({...clone(s),...clone(changes[i]||{})}))}};
}
const options=(...labels)=>labels.map(label=>['▣',label]);
function requireDay(base,day){
 if(base?.course?.day!==day)throw Error(`Expected original Day ${day} data.`);
}

function day7(base){
 requireDay(base,7);
 return [
  task('find-item-size','說出商品，問指定尺寸','店員',
   '你在服飾店，看著架上的 T-shirt。店員打招呼後，你先說想找 T-shirt，再指著這款詢問有沒有 M 號。',
   [
    step('find','說想找什麼','I’m looking for a T-shirt.','我想找一件 T-shirt。','Can I help you?','需要幫忙嗎？','告訴店員你想找 T-shirt。','looking for / T-shirt',['找 T-shirt','找鞋子'],false),
    step('medium','問指定尺寸','Do you have this in medium?','這件有 M 號嗎？','Yes, we have medium.','有，我們有 M 號。','指著這款 T-shirt，問有沒有 M 號。','this / medium',['有 M 號','只有 L 號'])
   ],
   '只把需要的尺寸從 M 號改成 L 號。仍先說想找 T-shirt，再問這款有沒有 L 號。',
   {1:{answer:'Do you have this in large?',answerZh:'這件有 L 號嗎？',line:'Yes, we have large.',zh:'有，我們有 L 號。',task:'指著同款 T-shirt，改問有沒有 L 號。',words:'this / large',objects:options('有 L 號','只有 M 號')}},
   [['T-shirt','T 恤'],['medium / large','M 號／L 號'],['looking for','正在找']],
   '原本進店、尺寸、顏色集中在一輪；先保留找商品和主動問指定尺寸，顏色移到另一輪。'),
  task('other-size-color','詢問其他尺寸與顏色','店員',
   '你拿著一件紅色 L 號上衣，想看看其他尺寸和顏色。先問其他尺寸，再問其他顏色；店員有 M 號，也有藍色。',
   [
    step('size','問其他尺寸','Do you have this in another size?','這件有其他尺寸嗎？','We have medium.','我們有 M 號。','問這款有沒有其他尺寸。','another / size',['另有 M 號','沒有其他尺寸']),
    step('color','問其他顏色','Do you have this in another color?','這件有其他顏色嗎？','We have blue.','我們有藍色。','再問同款有沒有其他顏色。','another / color',['另有藍色','只有紅色'])
   ],
   '只把店員提供的顏色從藍色改成綠色，尺寸仍有 M 號。用原本兩句詢問其他尺寸與顏色。',
   {1:{line:'We have green.',zh:'我們有綠色。',objects:options('另有綠色','只有紅色')}},
   [['another size','其他尺寸'],['another color','其他顏色'],['medium','M 號'],['blue / green','藍色／綠色']],
   '把原句庫中主動詢問其他尺寸、其他顏色保留為獨立短任務，不因縮短流程而刪掉。'),
  task('answer-size-color','回答尺寸與顏色','店員',
   '店員已知道你想找 T-shirt，現在問尺寸和顏色。你穿 M 號，想看藍色。',
   [
    step('size','回答尺寸','Medium, please.','M 號，謝謝。','What size do you wear?','你穿什麼尺寸？','告訴店員你穿 M 號。','medium / please',['M 號','L 號'],false),
    step('color','回答顏色','Blue, please.','藍色，謝謝。','What color would you like?','你想要什麼顏色？','告訴店員你想看藍色。','blue / please',['藍色','綠色'],false)
   ],
   '只把想看的顏色從藍色改成綠色，尺寸仍是 M 號。回答店員同樣的兩個問題。',
   {1:{answer:'Green, please.',answerZh:'綠色，謝謝。',task:'告訴店員你想看綠色。',words:'green / please',objects:options('綠色','藍色')}},
   [['size','尺寸'],['medium','M 號'],['blue / green','藍色／綠色']],
   '原本三個進店短答拆開；這輪只重複尺寸與顏色的兩個短答。'),
  task('try-fitting-room','問試穿與試衣間','店員',
   '你已拿到喜歡的衣服，尺寸和顏色都選好了。你想先問可不可以試穿，再問試衣間在哪裡。',
   [
    step('try','取得試穿同意','Can I try this on?','我可以試穿這件嗎？','Of course.','當然可以。','拿著衣服，問可不可以試穿。','try / this / on',['可以試穿','不能試穿']),
    step('room','找到試衣間','Where are the fitting rooms?','試衣間在哪裡？','The fitting rooms are on the right.','試衣間在右邊。','得到同意後，問試衣間的位置。','where / fitting rooms',['右邊的試衣間','左邊的試衣間'])
   ],
   '只把試衣間的位置從右邊改成左邊。仍用同兩句問試穿和位置，再聽懂新的方向。',
   {1:{line:'The fitting rooms are on the left.',zh:'試衣間在左邊。',objects:options('左邊的試衣間','右邊的試衣間')}},
   [['try on','試穿'],['fitting rooms','試衣間'],['left / right','左邊／右邊']],
   '原試穿輪已是兩個自然需求，保留原句與順序，只讓位置變化。'),
  task('too-small-bigger','太小了，換大一點','店員',
   '你試穿 S 號上衣，覺得太小。店員問合不合身，你先說明問題，再主動問有沒有大一點的。',
   [
    step('small','說明太小','It’s too small.','這件太小了。','How does it fit?','穿起來合身嗎？','告訴店員這件太小。','too / small',['這件太小','這件太大'],false),
    step('bigger','要求換大','Do you have a bigger one?','有大一點的嗎？','Yes, here is the medium.','有，這是 M 號。','問有沒有大一點的。','bigger / one',['換成 M 號','繼續穿 S 號'])
   ],
   '只把試穿感受從「太小」改成「太緊」。先說太緊，再用原句問有沒有大一點的。',
   {0:{answer:'It’s too tight.',answerZh:'這件太緊了。',task:'告訴店員這件太緊。',words:'too / tight',objects:options('這件太緊','這件太鬆')}},
   [['small / tight','小／緊'],['bigger','大一點'],['medium','M 號']],
   '保留太小／太緊與換大的能力；感受只換一個形容詞，不在同一步要求兩種說法。'),
  task('too-big-smaller','太大了，換小一點','店員',
   '你試穿 L 號上衣，覺得太大。店員問合不合身，你先說明問題，再主動問有沒有小一點的。',
   [
    step('big','說明太大','It’s too big.','這件太大了。','How does it fit?','穿起來合身嗎？','告訴店員這件太大。','too / big',['這件太大','這件太小'],false),
    step('smaller','要求換小','Do you have a smaller one?','有小一點的嗎？','Yes, here is the medium.','有，這是 M 號。','問有沒有小一點的。','smaller / one',['換成 M 號','繼續穿 L 號'])
   ],
   '只把試穿感受從「太大」改成「太鬆」。先說太鬆，再用原句問有沒有小一點的。',
   {0:{answer:'It’s too loose.',answerZh:'這件太鬆了。',task:'告訴店員這件太鬆。',words:'too / loose',objects:options('這件太鬆','這件太緊')}},
   [['big / loose','大／鬆'],['smaller','小一點'],['medium','M 號']],
   '原本換小只藏在替換題，現在獨立練習；保留太大與太鬆的區別。'),
  task('accept-size-fit','接受換尺寸，說合身','店員',
   '你已告訴店員這件太小。店員建議試大一點，你願意；換穿之後剛好合身，再回答店員的問題。',
   [
    step('accept','接受換尺寸','Yes, please.','好，麻煩你。','Would you like to try a larger size?','你想試試大一點的尺寸嗎？','你願意試大一點，接受店員的建議。','yes / please',['接受換大','不要換大'],false),
    step('fit','說明合身','It fits well.','這件很合身。','How does it fit?','穿起來合身嗎？','換穿後剛好合身，告訴店員。','fits / well',['新尺寸合身','新尺寸太小'],false)
   ],
   '只把店員建議的方向從換大改成換小：原本那件太大，你願意試小一點，換穿後仍很合身。用同兩句回答。',
   {0:{line:'Would you like to try a smaller size?',zh:'你想試試小一點的尺寸嗎？',task:'你願意試小一點，接受店員的建議。',objects:options('接受換小','不要換小')}},
   [['larger / smaller','大一點／小一點'],['fits well','很合身']],
   '保留原本接受店員建議的短答，與換穿後的合身回應接成兩段。'),
  task('compare-buy','比較喜好，決定購買','店員',
   '你已試過藍色與綠色上衣，兩件都合身。你比較喜歡藍色，店員問你選哪件；你表達偏好後決定購買。',
   [
    step('prefer','表達偏好','I like this one better.','我比較喜歡這件。','Which one do you like better?','你比較喜歡哪一件？','指著藍色上衣，說你比較喜歡這件。','this one / better',['選藍色上衣','選綠色上衣'],false),
    step('buy','決定購買','I’ll take it.','我要買這件。','Would you like to take it?','你要買這件嗎？','你決定買剛才選的那件。','take / it',['買剛才選的上衣','先不買'],false)
   ],
   '只把偏好的顏色從藍色改成綠色，兩件仍都合身。指著綠色，用同兩句表達比較喜歡它並決定購買。',
   {0:{task:'指著綠色上衣，說你比較喜歡這件。',objects:options('選綠色上衣','選藍色上衣')}},
   [['this one','這件'],['better','比較喜歡'],['take it','買下這件'],['blue / green','藍色／綠色']],
   '原本合身、比較、購買三句拆開；這輪只保留比較與購買，合身已在前一輪練習。')
 ];
}

function day8(base){
 requireDay(base,8);
 return [
  task('check-in-name','提出入住，報訂房姓名','飯店人員',
   '你抵達飯店，有一筆 Alex Chen 名下的訂房。先提出入住需求，接著回答櫃檯詢問的訂房姓名。',
   [
    step('check-in','提出入住需求','I’d like to check in, please.','我想辦理入住。','Welcome.','歡迎。','告訴櫃檯你想辦理入住。','check / in',['辦理入住','辦理退房']),
    step('name','說訂房姓名','I have a reservation under Alex Chen.','我有訂房，名字是 Alex Chen。','What name is the reservation under?','訂房用什麼名字？','告訴櫃檯訂房在 Alex Chen 名下。','reservation / under / Alex Chen',['Alex Chen 的訂房','Jamie Lin 的訂房'],false)
   ],
   '只把訂房姓名從 Alex Chen 改成 Jamie Lin。仍先提出入住，再回答訂房姓名。',
   {1:{answer:'I have a reservation under Jamie Lin.',answerZh:'我有訂房，名字是 Jamie Lin。',task:'告訴櫃檯訂房在 Jamie Lin 名下。',words:'reservation / under / Jamie Lin',objects:options('Jamie Lin 的訂房','Alex Chen 的訂房')}},
   [['check in','入住'],['reservation','訂房'],['under','以某人的名字']],
   '原本四步入住拆開，並移除連續重複詢問有無訂房的台詞。這輪只練入住與姓名。'),
  task('passport-nights','出示護照，確認晚數','飯店人員',
   '櫃檯已找到你的訂房，知道你要辦理入住。現在請你出示護照，再確認住宿晚數；你已準備好護照，這次住兩晚。',
   [
    step('passport','遞出護照','Here is my passport.','這是我的護照。','May I see your passport, please?','可以看一下你的護照嗎？','遞出護照並回應櫃檯。','here / passport',['出示護照','出示房卡'],false),
    step('nights','確認晚數','I’m staying for two nights.','我要住兩晚。','How many nights are you staying?','你要住幾晚？','告訴櫃檯你住兩晚。','staying / two / nights',['住 2 晚','住 3 晚'],false)
   ],
   '只把住宿晚數從兩晚改成三晚。仍先遞出護照，再回答晚數。',
   {1:{answer:'I’m staying for three nights.',answerZh:'我要住三晚。',task:'告訴櫃檯你住三晚。',words:'staying / three / nights',objects:options('住 3 晚','住 2 晚')}},
   [['passport','護照'],['nights','晚'],['two / three','2／3']],
   '把原入住流程的證件與晚數分成獨立小循環，晚數固定使用同一句，不在前後切換長短答案。'),
  task('breakfast-checkout','問早餐與退房時間','飯店人員',
   '你已完成入住，房卡也拿到了。想確認房價是否含早餐，以及明天幾點前要退房。',
   [
    step('breakfast','確認早餐','Is breakfast included?','有包含早餐嗎？','Yes, it is.','有包含早餐。','問房價是否包含早餐。','breakfast / included',['包含早餐','不含早餐']),
    step('checkout','問退房時間','What time is check-out?','幾點退房？','Check-out is at eleven.','11 點退房。','再問退房時間。','what time / check-out',['11 點退房','12 點退房'])
   ],
   '只把退房時間從 11 點改成 12 點，早餐仍包含在房價中。用原本兩句詢問。',
   {1:{line:'Check-out is at twelve.',zh:'12 點退房。',objects:options('12 點退房','11 點退房')}},
   [['breakfast','早餐'],['included','包含'],['check-out','退房'],['eleven / twelve','11／12']],
   '原住宿資訊三句拆為早餐與退房時間兩句，電梯另開一輪。'),
  task('find-elevator','找到電梯','飯店人員',
   '你已拿到房卡，知道自己的房號，現在想帶著行李上樓，但還不知道電梯在哪裡。只問電梯的位置。',
   [step('elevator','詢問電梯位置','Where is the elevator?','電梯在哪裡？','On your left.','在你的左邊。','問電梯在哪裡，再聽懂方向。','where / elevator',['往左邊電梯','往右邊電梯'])],
   '只把電梯位置從左邊改成右邊。問同一句，再依新的方向找電梯。',
   {0:{line:'On your right.',zh:'在你的右邊。',objects:options('往右邊電梯','往左邊電梯')}},
   [['elevator','電梯'],['left / right','左邊／右邊']],
   '保留找電梯這個實用目標，獨立一輪練一句，不為湊兩句加進其他需求。'),
  task('room-extra-towels','報房號，再要毛巾','飯店人員',
   '你住 305 號房，打電話向飯店要額外毛巾。接線人員先確認房號；你回答後，提出要再拿兩條毛巾的需求。',
   [
    step('room','報房號','This is room three oh five.','這裡是 305 號房。','What’s your room number?','你的房號是幾號？','告訴接線人員你住 305 號房。','room / three oh five',['305 號房','512 號房'],false),
    step('towels','要額外毛巾','Could I have two extra towels, please?','可以再給我兩條毛巾嗎？','Two towels for room three oh five.','305 號房送兩條毛巾。','問能不能再送兩條毛巾。','two / extra / towels',['305 號房：2 條毛巾','305 號房：1 條毛巾'])
   ],
   '只把毛巾數量從兩條改成一條，房號仍是 305。先報房號，再要一條額外毛巾。',
   {1:{answer:'Could I have one extra towel, please?',answerZh:'可以再給我一條毛巾嗎？',line:'One towel for room three oh five.',zh:'305 號房送一條毛巾。',task:'問能不能再送一條毛巾。',words:'one / extra / towel',objects:options('305 號房：1 條毛巾','305 號房：2 條毛巾')}},
   [['room','房間'],['three oh five','305'],['extra towel','額外毛巾'],['one / two','1／2']],
   '房號和用品需求仍連在一起，每步一句；數量的替換同時更新單複數與對方確認。'),
  task('order-room-food','點房內餐點，確認總價','飯店人員',
   '你打電話訂客房餐點，飯店已知道房號。你想要一份總匯三明治，先說要點什麼，再問總共多少錢；此處金額都是教學設定。',
   [
    step('order','說出餐點','I’d like a club sandwich, please.','我想要一份總匯三明治。','Certainly.','好的。','告訴接線人員你要一份總匯三明治。','club / sandwich',['一份總匯三明治','一份沙拉']),
    step('total','確認總價','How much is it in total?','總共多少錢？','Twenty dollars in total.','總共 20 美元。','問這份餐點的總價。','how much / total',['總共 20 美元','總共 30 美元'])
   ],
   '只把總價從 20 美元改成 25 美元，餐點仍是總匯三明治。用同兩句點餐並確認總價。',
   {1:{line:'Twenty-five dollars in total.',zh:'總共 25 美元。',objects:options('總共 25 美元','總共 20 美元')}},
   [['club sandwich','總匯三明治'],['in total','總共'],['twenty / twenty-five','20／25']],
   '原本點餐、總價、等待三個目標拆開；這輪只練點餐與總價。'),
  task('confirm-room-order','確認要不要訂餐','飯店人員',
   '你已詢問總匯三明治的價格，也知道總共 20 美元。接線人員現在確認要不要送出訂單；這次你決定要訂。',
   [step('confirm','確認訂餐決定','Yes, please.','好，麻煩你。','Would you like to place the order?','你要訂餐嗎？','你決定訂這份餐點，回答對方。','yes / please',['確認訂餐','暫時不訂'],false)],
   '只改變訂餐決定：你現在決定暫時不訂。聽到同一問題，禮貌婉拒。',
   {0:{answer:'No, thank you.',answerZh:'不用了，謝謝。',task:'你決定暫時不訂，禮貌回應。',words:'no / thank you',objects:options('暫時不訂','確認訂餐')}},
   [['place the order','送出訂單'],['yes / no','要／不要']],
   '把原短答中的「確認訂餐＋問等多久」拆開；保留接受與婉拒，但每次只要求一句。'),
  task('room-food-wait','詢問送餐等候時間','飯店人員',
   '你的客房餐點已訂好，房號與價錢也確認了。你只想知道還需要等多久。',
   [step('wait','問等候時間','How long will it take?','需要等多久？','About twenty minutes.','約 20 分鐘。','問餐點大約多久會送到。','how long / take',['約 20 分鐘','約 10 分鐘'])],
   '只把送餐等候時間從 20 分鐘改成 10 分鐘。問同一句，聽出新的時間。',
   {0:{line:'About ten minutes.',zh:'約 10 分鐘。',objects:options('約 10 分鐘','約 20 分鐘')}},
   [['how long','多久'],['minutes','分鐘'],['ten / twenty','10／20']],
   '保留原送餐等待資訊，獨立練一句，避免點餐之後還要連背第三句。'),
  task('report-room-problem','說設備故障，請人查看','飯店人員',
   '飯店人員已確認你是 305 號房。冷氣不能運作，你要先說明故障，再請人來查看。',
   [
    step('problem','說明設備故障','The air conditioner isn’t working.','冷氣不能運作。','How can I help you?','需要什麼幫忙？','告訴飯店人員冷氣不能運作。','air conditioner / isn’t working',['冷氣故障','電視故障'],false),
    step('help','請人來查看','Could someone come and check it, please?','可以請人來查看嗎？','We’ll send someone to your room.','我們會派人到你的房間。','請人到房間查看剛才提到的設備。','someone / come / check',['有人會來房間查看','需要自己去大廳'])
   ],
   '只把故障設備從冷氣改成電視。房號仍已確認，先說明電視故障，再用原句請人來查看。',
   {0:{answer:'The TV isn’t working.',answerZh:'電視不能運作。',task:'告訴飯店人員電視不能運作。',words:'TV / isn’t working',objects:options('電視故障','冷氣故障')}},
   [['air conditioner','冷氣'],['TV','電視'],['isn’t working','不能運作'],['check','查看']],
   '原第一步暗藏報房號與設備故障兩句；現在房號寫入已知情境，只必練故障與請人查看。')
 ];
}

function day9(base){
 requireDay(base,9);
 return [
  task('book-table-date','提出訂位，說日期時間','餐廳人員',
   '你打電話到餐廳，想預訂明天晚上 7 點的兩人桌。先提出訂位需求，再回答對方問的日期與時間。',
   [
    step('table','提出訂位需求','I’d like to book a table for two, please.','我想預訂兩人的桌位。','Of course.','當然可以。','告訴餐廳你想訂兩人的桌位。','book / table / two',['兩人桌','四人桌']),
    step('date-time','說日期時間','For tomorrow at seven p.m., please.','明天晚上 7 點，謝謝。','What day and time would you like?','你想訂哪一天、幾點？','告訴對方你想訂明天晚上 7 點。','tomorrow / seven p.m.',['明晚 7 點','今晚 7 點'],false)
   ],
   '只把用餐人數從兩位改成四位，日期和時間仍是明天晚上 7 點。用同樣兩段完成訂位需求。',
   {0:{answer:'I’d like to book a table for four, please.',answerZh:'我想預訂四人的桌位。',task:'告訴餐廳你想訂四人的桌位。',words:'book / table / four',objects:options('四人桌','兩人桌')}},
   [['book a table','訂位'],['two / four','2／4'],['tomorrow','明天'],['seven p.m.','晚上 7 點']],
   '保留原句庫的主動訂位與完整日期時間說法，兩句即能形成自然的需求表達。'),
  task('answer-party-day','短答人數與日期','餐廳人員',
   '餐廳已知道你想訂位，現在分別問人數和日期。你和旅伴共兩位，想明天去。',
   [
    step('people','回答用餐人數','Two, please.','兩位，謝謝。','How many people?','請問幾位？','告訴對方共兩位。','two / please',['2 位','4 位'],false),
    step('day','回答日期','Tomorrow, please.','明天，謝謝。','What day would you like to come?','你想哪一天來？','告訴對方你想明天去。','tomorrow / please',['明天','今天'],false)
   ],
   '只把日期從明天改成今天，人數仍是兩位。用兩個短答回應。',
   {1:{answer:'Today, please.',answerZh:'今天，謝謝。',task:'告訴對方你想今天去。',words:'today / please',objects:options('今天','明天')}},
   [['how many people','幾位'],['two','2'],['today / tomorrow','今天／明天']],
   '原本四個訂位短答拆成兩組；這組只練人數與日期，不要求重說完整訂位句。'),
  task('answer-time-name','短答時間與訂位姓名','餐廳人員',
   '餐廳已知道你明天有兩位用餐，現在問時間與姓名。你要晚上 7 點，訂位姓名是 Alex Chen。',
   [
    step('time','回答訂位時間','Seven p.m., please.','晚上 7 點，謝謝。','What time would you like?','你想訂幾點？','告訴對方你想訂晚上 7 點。','seven / p.m.',['晚上 7 點','晚上 8 點'],false),
    step('name','留下訂位姓名','The name is Alex Chen.','姓名是 Alex Chen。','What name is the reservation under?','訂位用什麼名字？','告訴對方訂位姓名是 Alex Chen。','name / Alex Chen',['Alex Chen','Jamie Lin'],false)
   ],
   '只把訂位姓名從 Alex Chen 改成 Jamie Lin，仍是晚上 7 點。回答同樣的兩個問題。',
   {1:{answer:'The name is Jamie Lin.',answerZh:'姓名是 Jamie Lin。',task:'告訴對方訂位姓名是 Jamie Lin。',words:'name / Jamie Lin',objects:options('Jamie Lin','Alex Chen')}},
   [['what time','幾點'],['seven p.m.','晚上 7 點'],['name','姓名']],
   '原本四個訂位短答的後半段獨立上課；姓名統一使用句卡中的同一說法。'),
  task('availability-later','詢問空位，接受較晚時間','餐廳人員',
   '餐廳已知道你想訂今晚兩人桌。你先問 7 點有沒有空位；7 點客滿後，對方提供 7 點半，而你能接受。',
   [
    step('available','詢問空位','Do you have a table available at seven?','7 點還有空桌嗎？','Seven is fully booked.','7 點已經客滿。','問今晚 7 點有沒有空桌。','table / available / seven',['7 點已客滿','7 點有空位']),
    step('later','接受替代時間','Seven thirty is fine, thank you.','7 點半可以，謝謝。','Is seven thirty okay?','7 點半可以嗎？','你能接受 7 點半，告訴對方。','seven thirty / fine',['接受 7 點半','拒絕 7 點半'],false)
   ],
   '只把對方提供的替代時間從 7 點半改成 8 點，原本的 7 點仍客滿，而你可以接受 8 點。先問空位，再接受新時間。',
   {1:{answer:'Eight is fine, thank you.',answerZh:'8 點可以，謝謝。',line:'Is eight okay?',zh:'8 點可以嗎？',task:'你能接受 8 點，告訴對方。',words:'eight / fine',objects:options('接受 8 點','拒絕 8 點')}},
   [['available','有空位'],['fully booked','客滿'],['seven thirty / eight','7 點半／8 點'],['fine','可以']],
   '修正原本先接受 7 點半卻立即要求 6 點半的跳轉；這輪只完成問空位與接受替代時間。'),
  task('change-booking-time','更改已有訂位時間','餐廳人員',
   '你原本訂了今晚 7 點的兩人桌，餐廳已找到你的訂位。現在想把時間改成 6 點半，只需要提出改時間的需求。',
   [step('change','要求更改時間','Could we change it to six thirty?','可以改成 6 點半嗎？','Six thirty is available.','6 點半有位置。','請餐廳把已有訂位改成 6 點半。','change / six thirty',['改成 6 點半','維持 7 點'])],
   '只把想更改的時間從 6 點半改成 8 點半，其他訂位資訊都不變。用同一句提出需求。',
   {0:{answer:'Could we change it to eight thirty?',answerZh:'可以改成 8 點半嗎？',line:'Eight thirty is available.',zh:'8 點半有位置。',task:'請餐廳把已有訂位改成 8 點半。',words:'change / eight thirty',objects:options('改成 8 點半','維持 7 點')}},
   [['change','更改'],['six thirty / eight thirty','6 點半／8 點半']],
   '把改時間獨立成已有訂位的情境，不要求學生在同一對話中反覆改變決定。'),
  task('decline-booking','時間不合，先不訂位','餐廳人員',
   '你想今晚和旅伴吃飯，但餐廳只剩晚上 9 點。這對你太晚，尚未成立訂位；你決定禮貌表示暫時不訂。',
   [step('decline','禮貌表示先不訂','I won’t book it for now, thank you.','我暫時不預訂，謝謝。','Only nine p.m. is available.','只剩晚上 9 點有位置。','時間太晚，告訴對方你暫時不訂。','won’t / book / for now',['暫時不訂位','預訂晚上 9 點'],false)],
   '只把餐廳剩下的時間從晚上 9 點改成晚上 8 點，但你今晚 8 點也無法用餐。用同一句表示暫時不訂。',
   {0:{line:'Only eight p.m. is available.',zh:'只剩晚上 8 點有位置。',task:'你今晚 8 點也無法用餐，告訴對方你暫時不訂。',objects:options('暫時不訂位','預訂晚上 8 點')}},
   [['available','有空位'],['for now','目前／暫時'],['eight / nine','8／9']],
   '保留原本禮貌取消／不訂的選擇，改成一句完整說法，不在同一步塞兩句拒絕。'),
  task('adult-price-quantity','問成人票價，說票數','售票員',
   '你在景點售票處，先想知道成人票每張多少錢，再買兩張成人票。金額是教學設定。',
   [
    step('price','問成人單價','How much is an adult ticket?','一張成人票多少錢？','An adult ticket is ten dollars.','成人票每張 10 美元。','先問一張成人票多少錢。','how much / adult ticket',['每張 10 美元','每張 20 美元']),
    step('quantity','說成人票數','I’d like two adult tickets, please.','我想買兩張成人票。','How many adult tickets would you like?','你要幾張成人票？','你要兩張成人票，回答售票員。','two / adult tickets',['2 張成人票','1 張成人票'],false)
   ],
   '只把成人票數從兩張改成一張，單張票價仍是 10 美元。先問票價，再說需要一張。',
   {1:{answer:'I’d like one adult ticket, please.',answerZh:'我想買一張成人票。',task:'你要一張成人票，回答售票員。',words:'one / adult ticket',objects:options('1 張成人票','2 張成人票')}},
   [['adult ticket','成人票'],['one / two','1／2'],['ten dollars','10 美元']],
   '原三步買票流程拆開，這輪只處理成人票單價與數量，兒童票移到下一輪。'),
  task('child-ticket-total','加兒童票，問總價','售票員',
   '售票員已幫你選好兩張成人票，每張 10 美元。你還要加一張 5 美元的兒童票，接著問全部票的總價。',
   [
    step('child','加買兒童票','One child ticket as well, please.','另外再加一張兒童票，謝謝。','One child ticket.','一張兒童票。','在兩張成人票之外，再加一張兒童票。','one / child ticket / as well',['再加 1 張兒童票','不加兒童票']),
    step('total','詢問總價','How much is it in total?','總共多少錢？','Twenty-five dollars in total.','總共 25 美元。','問兩張成人票加一張兒童票的總價。','how much / total',['總共 25 美元','總共 20 美元'])
   ],
   '只把兒童票數從一張改成兩張；成人票仍兩張，每張 10 美元，兒童票仍每張 5 美元。加票後再問總價。',
   {0:{answer:'Two child tickets as well, please.',answerZh:'另外再加兩張兒童票，謝謝。',line:'Two child tickets.',zh:'兩張兒童票。',task:'在兩張成人票之外，再加兩張兒童票。',words:'two / child tickets / as well',objects:options('再加 2 張兒童票','再加 1 張兒童票')},
    1:{line:'Thirty dollars in total.',zh:'總共 30 美元。',task:'問兩張成人票加兩張兒童票的總價。',objects:options('總共 30 美元','總共 25 美元')}},
   [['child ticket','兒童票'],['as well','另外也要'],['in total','總共'],['twenty-five / thirty','25／30']],
   '把加兒童票和總價連成一個兩句任務。替換只改兒童票數，總價隨同一條件正確更新。'),
  task('entry-card','問入場時間與刷卡','售票員',
   '你已選好票種和數量，也知道總價。付款前想確認幾點可以入場，以及是否能刷卡。',
   [
    step('entry','詢問入場時間','What time can we enter?','我們幾點可以入場？','You can enter at ten.','你們可以 10 點入場。','問幾點可以入場。','what time / enter',['10 點入場','11 點入場']),
    step('card','詢問刷卡','Can I pay by card?','我可以刷卡嗎？','Yes, you can.','可以。','再問是否可以刷卡。','pay / card',['可以刷卡','只收現金'])
   ],
   '只把入場時間從 10 點改成 11 點，仍然可以刷卡。用原兩句詢問。',
   {0:{line:'You can enter at eleven.',zh:'你們可以 11 點入場。',objects:options('11 點入場','10 點入場')}},
   [['enter','入場'],['ten / eleven','10／11'],['pay by card','刷卡']],
   '原總價、入場與付款三步拆開；保留原句卡的主動詢問刷卡，與入場時間組成兩句。'),
  task('payment-choice','回答付款方式','售票員',
   '你的門票和總價都已確認，售票處接受現金與刷卡。現在售票員問要用哪一種，你選刷卡。',
   [step('payment','選擇付款方式','Card, please.','刷卡，謝謝。','Cash or card?','現金還是刷卡？','你決定刷卡，回答售票員。','card / please',['刷卡','現金'],false)],
   '只把付款選擇從刷卡改成現金。聽同一問題，用短答回應。',
   {0:{answer:'Cash, please.',answerZh:'現金，謝謝。',task:'你決定付現金，回答售票員。',words:'cash / please',objects:options('現金','刷卡')}},
   [['cash / card','現金／刷卡']],
   '保留原短問答的付款選擇能力，獨立一句練習，不和主動詢問能否刷卡混成額外第三句。')
 ];
}

function day10(base){
 requireDay(base,10);
 return [
  task('attention-napkins','先引起注意，再要餐巾紙','店員',
   '你在咖啡廳需要兩張餐巾紙，店員還沒注意到你。先禮貌引起注意，等他回應後再提出需求。',
   [
    step('attention','引起注意','Excuse me.','不好意思，打擾一下。','Yes?','有什麼需要嗎？','先禮貌叫住店員。','excuse / me',['店員已注意到你','店員還沒注意到你']),
    step('napkins','請求餐巾紙','Could I have two napkins, please?','可以給我兩張餐巾紙嗎？','Of course.','當然可以。','店員已注意到你，請他給你兩張餐巾紙。','two / napkins',['拿 2 張餐巾紙','拿 3 張餐巾紙'])
   ],
   '只把餐巾紙數量從兩張改成三張。仍先引起注意，再提出數量需求。',
   {1:{answer:'Could I have three napkins, please?',answerZh:'可以給我三張餐巾紙嗎？',task:'店員已注意到你，請他給你三張餐巾紙。',words:'three / napkins',objects:options('拿 3 張餐巾紙','拿 2 張餐巾紙')}},
   [['excuse me','不好意思'],['napkin','餐巾紙'],['two / three','2／3']],
   '原本第一步藏了引起注意與請求用品兩句；現在明確拆成兩段，不再額外要求第三句要水。'),
  task('request-water','請求飲水','店員',
   '店員已站在桌邊聽你說話。你想要一些水，只需要清楚、禮貌地提出需求。',
   [step('water','請求飲水','Could I have some water, please?','可以給我一些水嗎？','Here you are.','給您。','請店員給你一些水。','some / water',['拿水','拿茶'])],
   '只把想要的飲料從水改成茶。店員仍在桌邊，用同一句型提出需求。',
   {0:{answer:'Could I have some tea, please?',answerZh:'可以給我一些茶嗎？',task:'請店員給你一些茶。',words:'some / tea',objects:options('拿茶','拿水')}},
   [['water / tea','水／茶'],['some','一些']],
   '保留原本飲水請求，獨立練一句；不要求每次先重演前一輪的引起注意。'),
  task('ask-bag-help','請人幫忙搬行李','旅伴',
   '你的袋子有點重，旅伴就在旁邊，已看到你需要搬它。你想禮貌地請旅伴幫忙。',
   [step('bag','請求搬行李協助','Could you help me with this bag, please?','可以請你幫我搬這個袋子嗎？','Of course.','當然可以。','指著重袋子，請旅伴幫你搬。','help / this bag',['一起搬袋子','自己繼續搬'])],
   '只把需要搬的物品從袋子改成行李箱。仍用同一句型請旅伴幫忙。',
   {0:{answer:'Could you help me with this suitcase, please?',answerZh:'可以請你幫我搬這個行李箱嗎？',task:'指著重行李箱，請旅伴幫你搬。',words:'help / this suitcase',objects:options('一起搬行李箱','自己繼續搬')}},
   [['help','幫忙'],['bag / suitcase','袋子／行李箱']],
   '原句庫的請人幫忙沒有進入主要流程，現在保留為一個能獨立練習的實用任務。'),
  task('accept-decline-drinks','接受或婉拒飲料','店員',
   '店員先問要不要再加咖啡，你不需要；接著問要不要水，而你想要。依自己的需要各回答一句。',
   [
    step('coffee','婉拒咖啡','No, thank you.','不用了，謝謝。','Would you like some more coffee?','你想再來一些咖啡嗎？','你不需要更多咖啡，禮貌婉拒。','no / thank you',['不加咖啡','再加咖啡'],false),
    step('water','接受飲水','Yes, please.','好，麻煩你。','Would you like some water?','你需要一些水嗎？','你想要水，接受店員的提供。','yes / please',['要水','不要水'],false)
   ],
   '只把第一個決定改成「想再加咖啡」，第二個決定仍是要水。用學過的接受說法回答兩次。',
   {0:{answer:'Yes, please.',answerZh:'好，麻煩你。',task:'你想再加咖啡，接受店員的提供。',words:'yes / please',objects:options('再加咖啡','不加咖啡')}},
   [['more coffee','更多咖啡'],['water','水'],['yes / no','要／不要']],
   '原本每步的接受與婉拒都塞了兩句；現在固定一句，並保留真正依需要改變選擇。'),
  task('decline-invitation-reason','婉拒邀請，說明原因','旅伴',
   '旅伴邀你今晚一起吃飯，但你已有安排。你先婉拒邀請；對方接著確認你是不是有事，你簡短說明已有安排。',
   [
    step('decline','婉拒今晚邀請','Thanks for asking, but I can’t tonight.','謝謝邀請，但我今晚沒辦法。','Would you like to join us for dinner tonight?','今晚要一起吃晚餐嗎？','你今晚已有安排，禮貌婉拒。','thanks / can’t / tonight',['今晚不能參加','今晚一起吃飯'],false),
    step('reason','說明已有安排','I already have plans.','我已經有安排了。','Are you busy tonight?','你今晚有事嗎？','告訴旅伴你已經有安排。','already / plans',['已有安排','還沒有安排'],false)
   ],
   '只把受邀日期從今晚改成明天晚上，而你明天晚上也已有安排。先婉拒明晚，再用原句說明已有安排。',
   {0:{answer:'Thanks for asking, but I can’t tomorrow night.',answerZh:'謝謝邀請，但我明天晚上沒辦法。',line:'Would you like to join us for dinner tomorrow night?',zh:'明天晚上要一起吃晚餐嗎？',task:'你明天晚上已有安排，禮貌婉拒。',words:'thanks / can’t / tomorrow night',objects:options('明晚不能參加','明晚一起吃飯')},
    1:{line:'Are you busy tomorrow night?',zh:'你明天晚上有事嗎？'}},
   [['tonight / tomorrow night','今晚／明晚'],['already have plans','已經有安排']],
   '原婉拒、原因、替代時間三句拆開；這輪只練婉拒與原因，不要求一次背三句。'),
  task('suggest-other-time','提出另一個時間','旅伴',
   '你已禮貌婉拒今晚吃飯，旅伴知道你今晚有事。你仍想一起吃飯，現在想主動提議改明天。',
   [step('tomorrow','提出替代時間','Maybe tomorrow?','明天或許可以？','Tomorrow is fine.','明天可以。','提議把聚餐改到明天。','maybe / tomorrow',['改明天聚餐','維持今晚聚餐'])],
   '只把提議的時間從明天改成星期日。你仍想與旅伴聚餐，用同一句型提議。',
   {0:{answer:'Maybe Sunday?',answerZh:'星期日或許可以？',line:'Sunday is fine.',zh:'星期日可以。',task:'提議把聚餐改到星期日。',words:'maybe / Sunday',objects:options('改星期日聚餐','維持今晚聚餐')}},
   [['maybe','或許'],['tomorrow / Sunday','明天／星期日']],
   '保留替代時間的目標，讓已婉拒的前情成為中文已知條件，只練新的這一句。'),
  task('apologize-check','為碰撞道歉並關心','旅伴',
   '你在車站不小心碰到旅伴。先向他道歉，接著問他是否還好；旅伴沒有受傷。',
   [
    step('sorry','為碰撞道歉','I’m sorry.','對不起。','That’s okay.','沒關係。','你不小心碰到旅伴，先道歉。','I’m / sorry',['先道歉','直接離開']),
    step('okay','關心對方','Are you okay?','你還好嗎？','Yes, I’m okay.','我沒事。','再確認旅伴有沒有不舒服。','are you / okay',['對方沒有受傷','對方需要幫忙'])
   ],
   '只把發生地點從車站改成飯店走廊。仍是不小心碰到旅伴，先道歉，再用原句關心對方。',
   {0:{task:'你在飯店走廊不小心碰到旅伴，先道歉。'}},
   [['sorry','抱歉'],['okay','還好／沒事']],
   '原一個 step 的道歉與關心其實是兩句；現在明確分成兩段，補救協助移到另一輪。'),
  task('apologize-wait','為讓人等候道歉','旅伴',
   '你因為公車延誤而晚到，旅伴已在約定地點等你一會兒。你已經抵達，現在只要為讓對方等待道歉，不必解釋整段經過。',
   [step('waiting','為等候道歉','I’m sorry to keep you waiting.','抱歉讓你久等了。','No problem.','沒問題。','為讓旅伴等待而道歉。','sorry / keep / waiting',['已為等候道歉','還沒向旅伴說話'])],
   '只把晚到原因從公車延誤改成迷路。你仍已經抵達，用同一句為讓旅伴等待道歉，不用另外解釋原因。',
   {0:{task:'你因迷路晚到，現在為讓旅伴等待而道歉。'}},
   [['keep you waiting','讓你等待'],['no problem','沒問題']],
   '保留原句庫的等候道歉，不和碰撞道歉混在同一段情境。'),
  task('offer-help','主動提出補救協助','旅伴',
   '旅伴的書掉到地上。你已經注意到，也站在他旁邊，想主動幫忙撿起來。',
   [step('help','主動提出幫忙','Let me help you.','讓我幫你吧。','Yes, thank you.','好，謝謝。','主動提出幫旅伴撿書。','let me / help',['一起撿書','站著不幫忙'])],
   '只把掉落物品從書改成車票。仍用同一句主動提出幫忙撿起來。',
   {0:{task:'主動提出幫旅伴撿車票。',objects:options('一起撿車票','站著不幫忙')}},
   [['let me','讓我'],['help','幫忙'],['book / ticket','書／車票']],
   '把補救協助從道歉流程中抽出，單獨反覆練這一句，不漏掉主動幫忙的能力。'),
  task('respond-apology','回應道歉，說自己的狀況','旅伴',
   '旅伴不小心碰到你，先向你道歉，再問你是否還好。你沒有受傷，先接受道歉，再告訴他自己沒事。',
   [
    step('accept','回應道歉','That’s okay.','沒關係。','I’m sorry.','對不起。','接受旅伴的道歉，告訴他沒關係。','that’s / okay',['接受道歉','沒有回應'],false),
    step('status','說自己的狀況','Yes, I’m okay.','我沒事。','Are you okay?','你還好嗎？','你沒有受傷，告訴旅伴自己沒事。','yes / okay',['自己沒有受傷','手臂有點痛'],false)
   ],
   '只把你的身體狀況改成手臂有點痛。仍先回應對方的道歉，再誠實說出手臂有點痛。',
   {1:{answer:'My arm hurts a little.',answerZh:'我的手臂有點痛。',task:'誠實告訴旅伴你的手臂有點痛。',words:'arm / hurts / a little',objects:options('手臂有點痛','自己沒有受傷')}},
   [['that’s okay','沒關係'],['arm','手臂'],['hurts a little','有點痛']],
   '保留原短答的受碰撞角色與誠實說明狀況；移除同一步附加的第二句道謝。'),
  task('accept-help','接受或婉拒幫忙','旅伴',
   '你的東西掉到地上，旅伴已看見，主動問能不能幫你撿起來。這次你願意接受協助。',
   [step('accept','回應對方的協助','Yes, thank you.','好，謝謝。','Can I help you pick these up?','我可以幫你把這些撿起來嗎？','你願意接受幫忙，回應旅伴。','yes / thank you',['接受幫忙','自己處理'],false)],
   '只把你的決定改成想自己處理。聽同一個協助提議，禮貌婉拒。',
   {0:{answer:'No, thank you.',answerZh:'不用了，謝謝。',task:'你想自己處理，禮貌婉拒旅伴的幫忙。',words:'no / thank you',objects:options('自己處理','接受幫忙')}},
   [['pick these up','把這些撿起來'],['yes / no','接受／婉拒']],
   '保留原本接受補救協助的短問答；接受與婉拒各只有一句，避免每次多背結尾。')
 ];
}

module.exports={7:day7,8:day8,9:day9,10:day10};
