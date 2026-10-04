const original = require('./day1-2-data.cjs')[1];
const d = JSON.parse(JSON.stringify(original));
d.previousLesson = { key: original.course.id, legacyKeys: original.course.legacyKeys, missions: original.missions, pairs: original.pairs };
d.course.id = 'travel-lab-unit2-rounds-v1';
d.course.legacyKeys = [];
d.course.description = '一次完成一個購物任務：先聽懂店員，再用自己的英文接話。';
d.course.labels = ['先試著完成購物','這輪：我會說，也聽得懂','這輪：跟著完成購物','這輪：換個情況','這輪：和老師完成任務','看看我的進步','隔一段時間，再試一次'];
d.language = 'en';
d.support = [{en: d.phrases[8].en, zh: d.phrases[8].zh, use:'沒聽清楚時，隨時可以求助'}];
const reply = (id,name,line,zh,listen,options,correct,why,task,words,answer,change,changeWords,changeAnswer) => ({id,name,line,zh,listen,options,correct,why,task,words,answer,change,changeWords,changeAnswer});
d.replies = [
 reply('a-price','聽出價格','It’s six dollars.','這個 6 美元。','只抓出商品多少錢。',['$6','$10'],0,'six dollars 是 6 美元。','價格在預算內，你決定買。','take it','I’ll take it.','改成買眼前的明信片，用同一句表達決定。','take it','I’ll take it.'),
 reply('a-pay','聽懂付款問題','Cash or card?','現金還是刷卡？','聽懂是在問付款方式。',['付款方式','商品尺寸'],0,'cash 是現金，card 是卡片。','你想刷卡，簡短回答。','card / please','Card, please.','改成想付現金。','cash / please','Cash, please.'),
 reply('b-help','說出想找的商品','Can I help you?','需要幫忙嗎？','這是店員邀請你說出需求。',['可以說出想找的東西','正在報價'],0,'Can I help you? 是詢問是否需要幫忙。','你在找一件 T-shirt。','looking for / T-shirt','I’m looking for a T-shirt.','改成你在找帽子。','a hat','I’m looking for a hat.'),
 reply('b-size','回答尺寸','What size would you like?','你想要什麼尺寸？','抓住 size，知道是在問尺寸。',['尺寸','價格'],0,'size 是尺寸。','你需要 M 號。','medium / please','Medium, please.','改成 L 號。','large / please','Large, please.'),
 reply('b-color','回應替代顏色','Would you like the black one?','你想要黑色的嗎？','聽出店員提供的顏色。',['黑色','藍色'],0,'black 是黑色。','你願意看看黑色的。','yes / please','Yes, please.','改成想要藍色；不用背店員問句。','blue one','I’d like the blue one.'),
 reply('c-budget','聽出超過預算','The mug is twelve dollars.','杯子 12 美元。','你的預算是 10 美元，判斷夠不夠。',['超過預算','在預算內'],0,'twelve 是 12，大於預算 10。','問有沒有便宜一點的。','something cheaper','Do you have something cheaper?','改成你決定這次不買。','no / thank you','No, thank you.'),
 reply('d-number','回答商品數量','How many bottles would you like?','你想要幾瓶？','抓住 how many，知道要回答數量。',['數量','付款方式'],0,'how many 是問幾個，bottles 是瓶。','你要 3 瓶水。','three bottles / please','Three bottles, please.','改成 2 瓶。','two bottles','Two bottles, please.'),
 reply('d-cash','聽懂只收現金','Six dollars in total. Cash only, please.','總共 6 美元，只收現金。','留意 total 與 cash only。',['總共 $6，只收現金','每瓶 $6，可以刷卡'],0,'in total 是總共，cash only 是只收現金。','你有足夠現金，告訴店員你會付現。','pay / in cash','I’ll pay in cash.','如果沒有現金，這次先不買。','no / thank you','No, thank you.')
];
const step=(id,line,zh,task,words,answer,objects,valid=[0],askFirst=false)=>({id,line,zh,task,words,answer,objects,valid,askFirst,effect:'✓ 已更新購物卡。看看結果，再繼續。'});
d.flows = [
 {id:'round-a',name:'A｜買眼前的一個杯子',desc:'問價錢、決定購買，再選付款方式。',context:'你喜歡眼前的杯子，預算 10 美元。價格都是教學設定。',summary:'換成眼前另一件商品，自己問價格並決定付款方式。',steps:[
  step('price','It’s six dollars.','這個 6 美元。','你想知道眼前杯子的價格，先問店員。','how much / this','How much is this?',[['$6','記下 6 美元'],['$10','記下 10 美元']],[0],true),
  step('decision','Cash or card?','現金還是刷卡？','價格在預算內，先告訴店員你要買。','take it','I’ll take it.',[['💳','店員在問付款方式'],['M','店員在問尺寸']],[0],true),
  step('payment','Cash or card?','現金還是刷卡？','接著回答店員。你可以選刷卡，也可以選現金。','card / cash / please','Card, please.',[['💳','刷卡'],['💵','現金']],[0,1])
 ]},
 {id:'round-b',name:'B｜找到適合的衣服',desc:'找商品、回答尺寸、選顏色與試穿。',context:'你想買 M 號 T-shirt。店裡 M 號有黑色和綠色；藍色缺貨。',summary:'換成 L 號或另一個商品，重用本輪說法；購買與付款可接著用 A 輪。',steps:[
  step('item','Can I help you?','需要幫忙嗎？','告訴店員你在找 T-shirt。','looking for / T-shirt','I’m looking for a T-shirt.',[['👕','T-shirt'],['🧢','帽子']]),
  step('size','What size would you like?','你想要什麼尺寸？','你需要 M 號，簡短回答。','medium / please','Medium, please.',[['M','M 號'],['L','L 號']]),
  step('color','We have black or green, but not blue.','有黑色或綠色，沒有藍色。','從有貨的顏色中，說出你想要哪一件。','black / green / I’d like','I’d like the black T-shirt.',[['●','黑色'],['●','綠色'],['●','藍色（缺貨）']],[0,1]),
  step('try','Of course.','當然可以。','買之前想先試穿，主動詢問店員。','try it on','Can I try it on?',[['✓','得到同意，可以試穿']],[0],true)
 ]},
 {id:'round-c',name:'C｜超過預算，換個選擇',desc:'說預算、問便宜一點的，決定買或不買。',context:'你想買杯子，預算 10 美元。杯子 12 美元，磁鐵 4 美元，明信片 2 美元。',summary:'換成 8 美元預算，再試一次；是否購買由你決定。',steps:[
  step('budget','The mug is twelve dollars.','杯子 12 美元。','杯子超出預算。說你有 10 美元，問有沒有便宜一點的。','ten dollars / cheaper','I have ten dollars. Do you have something cheaper?',[['$10','維持 10 美元預算'],['$12','直接買 12 美元杯子']]),
  step('alternative','This magnet is four dollars. This postcard is two dollars.','磁鐵 4 美元，明信片 2 美元。','選一件預算內的禮物；也可以禮貌表示不買。','take it / no thank you','I’ll take it.',[['🧲','磁鐵 $4'],['✉','明信片 $2'],['↩','這次不買']],[0,1,2]),
  step('payment','Yes, you can pay by card or in cash.','可以，你可以刷卡或付現。','主動問能不能刷卡。聽到回覆後，選擇付款方式。','pay by card','Can I pay by card?',[['💳','刷卡'],['💵','現金']],[0,1],true)
 ]},
 {id:'round-d',name:'D｜買幾瓶水，確認總價',desc:'說數量、問總價，聽懂只收現金。',context:'你要買 3 瓶水，有 8 美元現金。這間店只收現金。',summary:'下次換成 2 瓶水，自己改數量並問新的總價。',steps:[
  step('quantity','How many bottles would you like?','你想要幾瓶？','你要 3 瓶水，簡短回答或說完整句都可以。','three bottles / water','I’d like three bottles of water.',[['3','3 瓶水'],['2','2 瓶水']]),
  step('total','Six dollars in total.','總共 6 美元。','你已選好 3 瓶水，主動問總共多少錢。','how much / they','How much are they?',[['$6','總共 6 美元'],['$18','總共 18 美元']],[0],true),
  step('payment','Cash only, please.','只收現金。','你有 8 美元現金，回應店員並付現。','pay / in cash','I’ll pay in cash.',[['💵','付 6 美元現金'],['💳','改刷卡']])
 ]}
];
const mission=(id,name,task,words,answer,check)=>({id,name,task,words,answer,check});
d.missions=[
 mission('a-card','換成明信片','你看上明信片。問價格，決定購買，店員問付款時回答刷卡。','how much / take / card','How much is this? I’ll take it. Card, please.','有問價錢、表示購買並回答付款方式嗎？'),
 mission('b-large','換成 L 號，自己問尺寸','看到喜歡的 T-shirt，你需要 L 號。主動問這件有沒有 L 號，並詢問能否試穿。','have this / large / try','Do you have this in large? Can I try it on?','有主動問尺寸，把 M 換成 L，並詢問試穿嗎？'),
 mission('c-eight','換個預算','你只有 8 美元，商品要 12 美元。告訴店員你的預算，問便宜一點的；如果都不喜歡，也可以不買。','eight dollars / cheaper / no thank you','I have eight dollars. Do you have something cheaper?','有說新預算並尋找替代選擇，或清楚婉拒嗎？'),
 mission('d-two','換個數量','你要買 2 瓶水。說數量並問總價，店員說只收現金；你有足夠現金。','two bottles / how much / cash','I’d like two bottles of water. How much are they? I’ll pay in cash.','有把 3 瓶換成 2 瓶，並問總價嗎？')
];
const pair=(id,name,opening,next,objects,goals,tags,cards,words,answer)=>({id,name,first:'學生',role:'學生當顧客，老師當店員；一起看畫面。',opening,next,objects,goals,tags,cards,words,answer});
d.pairs=[
 pair('a-buy','A｜自己買一個小禮物','請問這個多少錢？','聽到價格後決定購買，回答付款方式。','杯子或明信片 · 預算 10 美元',['主動問價格','聽出價格','表達購買決定','回答付款方式'],'第一輪杯子 $6；第二輪明信片 $2。',[['問價錢','It’s six dollars.','第一輪杯子。'],['換商品再問','It’s two dollars.','第二輪明信片。'],['決定買','Cash or card?','等學生自己回答。']],'how much / take / card','How much is this? I’ll take it. Card, please.'),
 pair('b-fit','B｜說出尺寸，問試穿','我在找一件 T-shirt。','老師問尺寸，再提供顏色；選好後主動問試穿。','T-shirt · 第一輪 M 號，第二輪 L 號',['說出商品','回答尺寸','選擇有貨顏色','主動詢問試穿'],'M 與 L 都有黑色、綠色，藍色沒有貨。',[['說出商品','What size would you like?','這次先用 M，下次換 L。'],['說出尺寸','We have black or green, but not blue.','讓學生自己選。'],['問試穿','Of course.','同意試穿。']],'looking for / medium / black / try','I’m looking for a T-shirt. Medium, please. I’d like the black T-shirt. Can I try it on?'),
 pair('c-budget','C｜自己處理超出預算','請問這個多少錢？','聽完價錢，說出預算、找替代品，再決定買或不買。','杯子 · 預算 10 美元；下一次換成 8 美元',['聽出超過預算','說出預算','問替代選擇','自己決定買或不買'],'杯子 $12；磁鐵 $4；明信片 $2。',[['問價錢','The mug is twelve dollars.','等待學生處理預算。'],['問便宜一點的','This magnet is four dollars. This postcard is two dollars.','接受任一選擇，也接受不買。'],['決定購買','Cash or card?','重用 A 的短答。'],['決定不買','No problem. Thank you!','自然結束。']],'ten dollars / cheaper / take / no','I have ten dollars. Do you have something cheaper? No, thank you.'),
 pair('d-water','D｜自己買幾瓶水','我想買 3 瓶水。','主動問總價，聽懂付款限制並回應。','3 瓶水 · 有 8 美元現金',['說出數量','主動問總價','聽懂只收現金','回應並完成付款'],'每瓶 $2；3 瓶 $6，第二輪改 2 瓶 $4。',[['問 3 瓶總價','Six dollars in total. Cash only, please.','不要先替學生說付款答案。'],['改問 2 瓶總價','Four dollars in total. Cash only, please.','依新數量接話。']],'three bottles / they / cash','I’d like three bottles of water. How much are they? I’ll pay in cash.')
];
d.rounds=[
 {id:'A',name:'買一件眼前商品',goal:'問到價格，決定買，回答付款方式。',phraseIds:[2,6,7],replyIds:[0,1],reuse:[],words:[['six / ten','6／10'],['cash / card','現金／刷卡']],bridge:'短答 Card, please. 也算自己會說。先聽懂價格與付款問題。'},
 {id:'B',name:'找尺寸與試穿',goal:'找到想要的商品，回答尺寸，選色並問試穿。',phraseIds:[0,1,3,4],replyIds:[2,3,4],reuse:[6,7],words:[['medium / large','M 號／L 號'],['black / green / blue','黑／綠／藍'],['hat','帽子']],bridge:'這輪專心練需求；買與付款可沿用 A 輪。'},
 {id:'C',name:'預算與替代選擇',goal:'太貴時能說預算、找替代品，也能禮貌不買。',phraseIds:[10,5,13],replyIds:[5],reuse:[2,6,7],words:[['eight / ten / twelve','8／10／12'],['magnet / postcard','磁鐵／明信片']],bridge:'聽懂新價格後再決定；不買也是完成溝通。'},
 {id:'D',name:'數量、總價與付現',goal:'說數量、問總價，聽懂只收現金並回應。',phraseIds:[11,9,12],replyIds:[6,7],reuse:[13],words:[['two / three bottles','2 瓶／3 瓶'],['in total / cash only','總共／只收現金']],bridge:'先分清每瓶與總共，再使用複數的 How much are they?。'}
].map((r,i)=>({...r,phraseIds:r.phraseIds.map(n=>'phrase-'+n),flowIds:[i],missionIds:[i],pairIds:[i]}));
module.exports=d;
