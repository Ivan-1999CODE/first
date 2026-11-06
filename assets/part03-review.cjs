// Authored review of every current Part 03 step. Each row specifies the
// evidence a learner must use; new IDs require their own review before release.
const reviews={};
const R=(mode,prompt,reason,patch={})=>({mode,prompt,reason,patch});
const add=(id,row)=>reviews[id]=row;
const group=(id,rows)=>rows.forEach((row,i)=>add('micro-en-'+id+'-'+i,row));
const copy=(from,to,patch={})=>add(to,{...reviews[from],patch:{...reviews[from].patch,...patch}});
const opts=(...labels)=>labels.map(label=>['▣',label]);
const L=(p,r,x)=>R('listen',p,r,x),V=(p,r,x)=>R('apply',p,r,x),D=(p,r,x)=>R('decide',p,r,x);
add('route-a-ask-v4',L('依路人的回覆，點出要轉彎的路口與方向。','四個路口方向組合都合理，必須辨認 first 與 right。'));
add('route-a-right-v4',L('聽完確認，再選要繼續走的方向。','Right? 是確認問題；不能把學生的疑問當成路人的答案。'));
add('route-a-thanks-v4',L('路人最後這句話，是什麼意思？','兩個選項都是可能的接話，辨認道謝回應與請求重說。',{objects:opts('對方回應你的道謝','對方請你再說一次'),choiceKind:'social',choiceVisuals:[{type:'thanks'},{type:'repeat'}]}));
add('route-b-way-v4',L('依回覆，選出完整的轉彎路線。','必須同時核對路口順序與方向，不能只認左或右。'));
add('route-b-bus-v4',L('聽路人的回覆，你接下來該去哪裡？','聽懂 bus stop，才知道前往車站或站牌。'));
copy('route-a-thanks-v4','route-b-thanks-v4');
add('route-c-repeat-v4',L('這次重聽到的方向是哪一條？','重聽後仍需辨認左右；不在任務文字公布方向。'));
add('route-c-map-v4',L('在地圖上指出路人說的郵局位置。','兩邊都放郵局，依對方說的左右位置判斷，不用地點名稱排除。',{objects:opts('在右側標記郵局','在左側標記郵局')}));

group('d2-merged-price-quantity-v1',[
 L('把店員剛報的價格放到杯子旁。','6 與 10 都是合理價格，必須聽懂數字。'),
 L('你提出購買後，店員的回覆表示什麼？','不再重選「買杯子」；辨認店員受理或請稍候。',{objects:opts('店員開始受理這個杯子','店員請你稍候再買'),choiceKind:'service',choiceVisuals:[{type:'service'},{type:'wait'}]}),
 V('把你要的水一瓶一瓶放到準備區。','以實物加減完成數量，不只配對「3 瓶」文字。'),
 L('店員報的是單價，還是這筆購物的總價？','單價與總價同為 6，必須辨認 in total。')
]);
group('d2-merged-payment-bag-v1',[
 L('依店員的付款規則，拿出可以使用的付款物件。','Cash only 是店方新資訊，不能由想刷卡推測結果。',{task:'你手上有卡片和現金。先問店員能不能刷卡。'}),
 D('聽店員報價，哪一組現金剛好付清？','依店員報出的金額核對鈔票面額。',{practiceReply:{line:'Six dollars in total. Thank you.',zh:'一共 6 美元，謝謝。'},objects:opts('5 美元加 1 美元現金','5 美元加 5 美元現金'),choiceKind:'cash-set',pictureChoices:true,choiceVisuals:[{type:'cash',values:[5,1]},{type:'cash',values:[5,5]}]}),
 V('哪張圖符合你剛才的袋子需求？','袋子代表需要店家提供袋子；同一袋子加紅色斜線代表不需要，依剛才的回答選圖。',{choiceVisuals:[{type:'own-bag'},{type:'store-bag'}],pictureChoices:true})
]);
group('d2-budget-and-cheaper-v1',[
 D('聽完杯子的價格，依你的預算決定下一步。','把自己的預算和店員報價比較，不能只重選預算 10。'),
 L('哪件商品是店員提供的便宜替代品？','同時辨認商品與價格，兩件都有售價。')
]);
copy('micro-en-d2-merged-payment-bag-v1-2','micro-en-d2-merged-payment-bag-v1-accept-bag-mainline-v1-bag');

group('d3-merged-day3-check-in-v1',[
 L('提出報到需求後，地勤的回覆表示哪個進度？','以受理或稍候作合理分支，不用機場／飯店的場景常識猜題。',{objects:opts('開始辦理機場報到','先在櫃檯旁等候'),choiceKind:'service',choiceVisuals:[{type:'service'},{type:'wait'}]}),
 V('把要託運的行李放上輸送帶。','保留數量操作；每次按一下增加一件實物。'),
 V('依你的座位需求，直接點座位的位置。','窗戶與走道提供空間參照，不在座位上寫出靠窗／靠走道。')
]);
for(let i=0;i<3;i++)copy('micro-en-d3-merged-day3-check-in-v1-'+i,'micro-en-d3-merged-day3-check-in-v1-change-'+i);
group('d3-gate-and-repeat-v1',[
 L('選出地勤剛才說的登機門。','12 與 20 的標牌都保留，正確門號只能從回覆取得。'),
 L('重聽後，走到確認過的登機門。','保留重聽的溝通功能；前一步結果收起，不把重複確認假裝成新資訊。')
]);
group('d3-merged-day3-entry-v1',[
 V('選出能代表這趟旅行目的的圖片。','用度假與工作的具體場景辨認旅行目的。'),
 V('哪張月曆標示了你的停留天數？','改為數月曆上的停留格數，不在圖上再印 7 天／14 天。',{choiceVisuals:[{type:'calendar',days:7},{type:'calendar',days:14}],pictureChoices:true}),
 D('把飯店與停留天數都符合的旅行資料交給官員。','兩張都有同一間飯店，還需核對前一步已回答的 7 天。',{objects:opts('Sunny Hotel，停留 7 天','Sunny Hotel，停留 14 天'),choiceKind:'record',choiceVisuals:[{type:'record',title:'HOTEL',lines:['Sunny Hotel','7 days']},{type:'record',title:'HOTEL',lines:['Sunny Hotel','14 days']}],pictureChoices:true})
]);
group('d3-food-and-declaration-v1',[
 V('選出與你如實說明的行李內容相符的畫面。','以打開的行李辨認有帶食物或空袋，保留如實申報的練習。'),
 L('官員現在請你出示哪一樣東西？','食物與護照都是可能要求的物件，移除明顯不合理的直接離開。',{objects:opts('出示帶來的食物','出示護照'),choiceKind:'requested-item',choiceVisuals:[{type:'food'},{type:'passport'}],pictureChoices:true})
]);

group('d4-ticket-and-type-v1',[
 V('選出目的地符合需求的車票。','目的地是票上的必要資訊；比較兩個合理的交通終點。'),
 V('看行程箭頭，選出能完成這趟行程的車票。','用單向與雙向路線判斷，不依中文單程／來回配對。')
]);
for(let i=0;i<2;i++)copy('micro-en-d4-ticket-and-type-v1-'+i,'micro-en-d4-ticket-and-type-v1-change-'+i);
group('d4-ticket-price-and-payment-v1',[
 L('售票員剛報的票價是哪個金額？','十二與二十是可聽混的合理價格。'),
 L('依售票員回覆，選出可使用的付款方式。','能否刷卡尚未由任務決定，必須聽 Yes, you can。')
]);
group('d4-departure-and-platform-v1',[
 L('把車票上的出發時間核對清楚。','2:40 與 4:20 對調數字，必須辨認時與分。'),
 L('找到站務人員指示的月台。','6 與 3 都是合理月台，只有對話提供正解。')
]);
group('d4-metro-line-and-transfer-v1',[
 L('先選你應該搭的路線。','辨認 green line，兩條路線均在示意圖中。'),
 L('在路線圖選出要轉乘的車站。','轉乘站與目的地分開，不能把到達站當轉乘點。')
]);
group('d4-bus-number-and-destination-v1',[
 L('依回覆，找到要搭的那班公車。','12 與 20 都是可搭車號，需要聽辨數字。'),
 L('司機有沒有確認這班車到你要去的地方？','目的地已知不代表這班車有到，必須聽肯定或否定。')
]);
group('d4-get-off-and-confirm-v1',[
 V('依你剛才的回應，在站點圖選出目的地。','把肯定回應落實到路線位置，不再選「沒錯」文字。',{choiceFormat:'station-map'}),
 L('依司機指示，在站點圖選出下車處。','司機的站名是操作依據；與上一句的確認連貫。',{choiceFormat:'station-map'})
]);
for(let i=0;i<2;i++)copy('micro-en-d4-get-off-and-confirm-v1-'+i,'micro-en-d4-get-off-and-confirm-v1-change-'+i);

group('d5-directions-and-distance-v1',[
 L('在地圖點出應該轉彎的路口。','兩個選項都左轉，必須辨認 first intersection。'),
 L('依路人回覆，選出預估步行時間。','5 與 50 需要聽辨，不能從路線圖猜時間。')
]);
group('d5-merged-day5-taxi-trip-v1',[
 V('依你的交通決定，走到對應的候車處。','用計程車與公車候車圖辨認交通工具，不只對「搭車」文字。',{objects:opts('到計程車上車處','到公車站等車'),choiceKind:'vehicle',choiceVisuals:[{type:'taxi'},{type:'bus'}],pictureChoices:true}),
 V('把目的地標在這趟乘車資料上。','選擇不同建築的目的地圖，保留可讀地點名稱作真實標示。'),
 L('司機預估這趟需要多久？','15 與 20 都合理，資訊只能由司機回覆得知。'),
 L('依司機的估價，確認這趟車費。','費用與前一步時間分開，不能把分鐘數當金額。')
]);
group('d5-driver-and-pickup-v1',[
 L('司機有沒有確認他是來接你的？','保留身分確認，但圖片不先加成功勾號。',{choiceVisuals:[{type:'driver-match'},{type:'driver-query'}]}),
 V('在兩個入口中選出你等車的位置。','辨認飯店與博物館入口，位置名稱是場景資料。')
]);
group('d5-dropoff-and-stop-v1',[
 V('依剛才和司機的對話，選出下車位置。','改在同一張街道圖選現在的位置或前方入口，需判斷相對位置。',{choiceFormat:'taxi-stop'}),
 L('聽完司機回應，這裡可以停車嗎？','到達入口仍需確認司機同意停車，不單憑目的地作答。')
]);

group('d6-recommend-and-order-v1',[
 L('從餐點圖片找出店員推薦的主餐。','兩份主餐都合理，必須聽清 chicken sandwich。'),
 V('把你決定要的主餐放進訂單。','延續推薦，辨認實際餐點，不重複印出品名作答案。')
]);
group('d6-more-time-to-choose-v1',[
 V('依你剛才的回應，點餐流程應該停在哪一步？','比較繼續閱讀菜單與交出訂單，操作呈現還沒決定的需求。')
]);
copy('micro-en-d6-more-time-to-choose-v1-0','micro-en-d6-more-time-to-choose-v1-change-0');
group('d6-drink-ice-and-sugar-v1',[
 V('觀察三杯飲料的冰塊量，選出符合需求的一杯。','新增一般冰量作合理比較，不只在有冰與沒冰之間猜。',{objects:opts('不加冰','少冰','一般冰量'),pictureChoices:true}),
 V('看糖匙裡的糖量，完成這杯飲料。','新增一般糖量，少糖與一般糖用不同實物量呈現。',{objects:opts('不加糖','少糖','一般糖量'),pictureChoices:true})
]);
for(let i=0;i<2;i++)copy('micro-en-d6-drink-ice-and-sugar-v1-'+i,'micro-en-d6-drink-ice-and-sugar-v1-change-'+i);
group('d6-steak-and-eggs-v1',[
 R('preference','選你剛才用英文說的牛排熟度。','這是偏好操作，多個選項皆合理；不用對錯分數假裝測驗。'),
 R('preference','把你想吃的蛋料理加入餐點。','所有已教過的做法都可選，結果回饋記錄偏好。')
]);
group('d6-merged-day6-price-and-confirmation-v1',[
 D('聽完價格，依 10 美元預算決定下一步。','兩種行動取決於報價與預算比較，不直接寫超出預算。'),
 L('店員提供的較便宜餐點是哪一份？','商品與售價一起核對，不能只選較小的數字。'),
 L('店員確認的帳單金額是哪一張？','學生的猜測不等於帳單；依肯定回覆核對小數金額。'),
 L('重聽後，選出應該支付的金額。','保留修補溝通的重聽步驟，前一步紀錄預設收起。')
]);
group('d6-eat-in-and-finish-v1',[
 V('把餐點放到符合用餐方式的容器。','比較餐盤與外帶袋，將 for here 應用到圖片操作。'),
 V('依你最後的回應，哪張訂單才是完整餐點？','用原餐點與多加飲料的訂單比較，取代直接點不再加點。',{choiceVisuals:[{type:'meal-order',extra:false},{type:'meal-order',extra:true}],pictureChoices:true})
]);

group('d7-merged-day7-item-size-color-v1',[
 V('在商品圖中拿出你要找的款式。','用衣服與鞋子的外形辨認商品，不靠中文名稱。'),
 L('店員說有哪個尺寸？把那件拿出來。','S、M、L 都是合理庫存，不能用有／沒有的常識猜。',{objects:opts('有 M 號','有 L 號','有 S 號'),pictureChoices:true}),
 L('這次店員提供的是哪個其他尺寸？','把「沒有其他尺寸」改為另一個合理尺寸，必須聽 medium。',{objects:opts('另有 M 號','另有 L 號','另有 S 號'),pictureChoices:true}),
 L('選出店員說有貨的顏色。','三個顏色都可能有貨，資訊必須來自回覆。',{objects:opts('另有藍色','另有紅色','另有綠色'),pictureChoices:true}),
 V('看衣服標籤，選出適合你的尺寸。','尺寸字母是衣服實際標籤，保留標籤以練辨認 medium 對應 M。',{objects:opts('M 號','L 號','S 號'),pictureChoices:true}),
 D('保留剛才的尺寸，再拿出你要的顏色。','同時核對 M 號與藍色；藍色 L 號也是干擾，不能只看顏色。',{objects:opts('藍色 M 號','綠色 M 號','藍色 L 號'),pictureChoices:true})
]);
group('d7-try-fitting-room-v1',[
 L('店員的回覆表示你現在可以做什麼？','試穿與先等候都是合理接話結果，移除過於直接的不能試穿。',{objects:opts('進入試穿流程','先等店員安排'),choiceKind:'service',choiceVisuals:[{type:'fitting'},{type:'wait'}]}),
 L('面朝走廊，選出店員指示的試衣間。','在同一個空間辨認左右，兩個門都可進入。')
]);
group('d7-merged-day7-size-and-fit-v1',[
 V('哪面鏡子呈現你剛才描述的試穿情況？','用身體與衣服比例比較過緊、過鬆和合身。',{objects:opts('這件太小','這件太大','這件合身'),pictureChoices:true}),
 L('聽店員的回覆，他拿來的是哪個尺寸？','M 與 L 都滿足換大的方向，必須聽店員說 medium。',{objects:opts('換成 M 號','換成 L 號','繼續穿 S 號'),pictureChoices:true}),
 V('選出與你剛才感受相符的試穿畫面。','增加合身干擾，需看衣身寬度，不能只靠兩個相反詞。',{objects:opts('這件太大','這件太小','這件合身'),pictureChoices:true}),
 L('店員這次提供哪個尺寸？','M 與 S 都是合理換小方向，正解需聽 medium。',{objects:opts('換成 M 號','換成 S 號','繼續穿 L 號'),pictureChoices:true}),
 D('聽店員的建議，下一件要試哪個尺寸？','從原衣服的緊繃狀態判斷要換大的方向，不重選接受二字。',{objects:opts('試比原本大一點的衣服','試比原本小一點的衣服'),choiceKind:'resize',choiceVisuals:[{type:'resize',scale:1.15},{type:'resize',scale:.75}],pictureChoices:true}),
 V('哪面鏡子符合你剛才描述的試穿感受？','合身、過小、過大都有實際身衣比例，不預先印成功勾號。',{objects:opts('新尺寸合身','新尺寸太小','新尺寸太大'),pictureChoices:true})
]);
group('d7-compare-buy-v1',[
 V('把你比較喜歡的那件放到準備區。','讓兩件衣服保持同款不同色，靠圖像做偏好操作。'),
 D('挑出裝著剛才那件衣服的購物袋。','兩袋都已購買，須記住剛才選的藍色，而非重選買／不買。',{objects:opts('購買藍色上衣','購買綠色上衣'),choiceKind:'outfit-bag',choiceVisuals:[{type:'outfit-bag',color:'blue'},{type:'outfit-bag',color:'green'}],pictureChoices:true})
]);

group('d8-check-in-name-v1',[
 L('櫃檯的回應是在迎接你，還是在送別你？','辨認 Welcome 的溝通功能，不重選自己提出的入住。',{objects:opts('櫃檯迎接你辦理入住','櫃檯送別準備離開的客人'),choiceKind:'service',choiceVisuals:[{type:'arrival'},{type:'departure'}]}),
 V('在訂房資料中找出你的名字。','姓名保留作真實訂房卡內容，兩筆都是合理訂房。')
]);
group('d8-passport-nights-v1',[
 L('櫃檯請你出示哪份證件？','把口說任務改為先判斷要求，再遞出文件；不能由中文先看見護照。',{task:'護照與房卡都在手邊。先聽櫃檯要看哪一樣，再遞出並用英文回應。'}),
 V('哪張入住行程包含你要的住宿晚數？','用夜晚格數區分 2 晚與 3 晚，避免直接匹配中文數字。',{choiceVisuals:[{type:'nights',count:2},{type:'nights',count:3}],pictureChoices:true})
]);
group('d8-merged-day8-hotel-information-v1',[
 L('房價裡有沒有這份早餐？','只有櫃檯知道是否包含，圖片提供兩種合理方案。'),
 L('在時鐘上選出最晚退房時間。','辨認 eleven 與 twelve，不由訂房資料提前提供。'),
 L('拿好行李，往櫃檯指示的電梯走。','兩側都有電梯，依 left／right 決定。')
]);
group('d8-merged-day8-room-supplies-v1',[
 V('依房卡找到這通電話的房間。','房卡號碼對應真實門牌，保留數字作空間辨認。'),
 D('聽清房號、物品和數量，選出相符的推車。','三組分別錯房號或數量，必須同時核對兩項。',{objects:opts('305 號房：2 條毛巾','305 號房：1 條毛巾','512 號房：2 條毛巾'),choiceKind:'parcel',choiceVisuals:[{type:'parcel',room:305,item:'towel',count:2},{type:'parcel',room:305,item:'towel',count:1},{type:'parcel',room:512,item:'towel',count:2}],pictureChoices:true}),
 D('依電話中的確認，選出房號和物品都相符的一組。','房號要從前文保留，並核對這次要水而非毛巾。',{objects:opts('305 號房：一些水','512 號房：一些水','305 號房：2 條毛巾'),choiceKind:'parcel',choiceVisuals:[{type:'parcel',room:305,item:'water',count:2},{type:'parcel',room:512,item:'water',count:2},{type:'parcel',room:305,item:'towel',count:2}],pictureChoices:true}),
 D('核對房號，再選這次追加的物品。','房號與品項都有合理干擾，不能只看到 305 就點。',{objects:opts('305 號房：一條額外的棉被','512 號房：一條額外的棉被','305 號房：一些水'),choiceKind:'parcel',choiceVisuals:[{type:'parcel',room:305,item:'blanket',count:1},{type:'parcel',room:512,item:'blanket',count:1},{type:'parcel',room:305,item:'water',count:2}],pictureChoices:true})
]);
group('d8-merged-day8-room-service-order-v1',[
 V('把你要詢問的餐點放到訂單草稿。','是詢價草稿，尚未當成已購買；需要辨認三明治與沙拉。'),
 L('這份餐點的總價是多少？','20 與 30 是合理總價，須聽懂 in total。'),
 L('依剛才聽到的時間，多久後可以收到餐點？','10 與 20 分鐘都合理，任務不先給等待時間。'),
 D('訂單可以送出嗎？把餐點、總價和等候時間一起核對。','改成比較完整訂單：同餐點但金額或分鐘數不同，不能只選確認。',{objects:opts('三明治，20 美元，20 分鐘','三明治，30 美元，20 分鐘','三明治，20 美元，10 分鐘'),choiceKind:'record',choiceVisuals:[{type:'order',price:20,minutes:20},{type:'order',price:30,minutes:20},{type:'order',price:20,minutes:10}],pictureChoices:true})
]);
group('d8-report-room-problem-v1',[
 V('點出需要報修的設備。','由悶熱與遙控器無反應判斷設備，不只照著冷氣二字選。',{task:'房間很悶熱；你按了冷氣遙控器，設備仍沒有運轉。請向飯店說明問題。'}),
 L('聽完安排，你應該在哪裡等人來查看？','櫃檯派人來房間與要求去大廳都是可能安排，必須聽 your room。')
]);
for(let i=0;i<3;i++)copy('micro-en-d8-merged-day8-room-service-order-v1-'+i,'micro-en-d8-merged-day8-room-service-order-v1-decline-step-'+i);
add('micro-en-d8-merged-day8-room-service-order-v1-decline-step-3',D('你 10 分鐘後要出門。這份餐點來得及嗎？','任務只給出門限制；送餐 20 分鐘要保留前文，再比較決定。',{task:'你 10 分鐘後就要出門。把剛才聽到的送餐時間和行程比較後，用學過的婉拒說法回應。',objects:opts('這次先不訂，準備出門','送出訂單，留下來等餐'),choiceKind:'decision',choiceVisuals:[{type:'departure'},{type:'meal-wait'}]}));

group('d9-merged-day9-booking-basics-v1',[
 V('把需要的座位安排到餐桌旁。','用餐桌與實際座位數判斷兩人或四人。'),
 D('核對日期與時鐘，選出這次的訂位卡。','今晚與明晚同為 7 點，必須同時看日期和時間。',{choiceVisuals:[{type:'booking',day:'明天',hour:7},{type:'booking',day:'今天',hour:7}],pictureChoices:true}),
 V('在時鐘上選出你要訂的時間。','選項用時鐘刻度呈現，避免直接對「晚上 7 點」中文字。',{choiceVisuals:[{type:'clock',hour:7},{type:'clock',hour:8}],pictureChoices:true}),
 D('找出姓名與剛才時間都正確的訂位卡。','兩張都寫 Alex Chen，必須連同先前 7 點一起核對。',{objects:opts('Alex Chen，晚上 7 點','Alex Chen，晚上 8 點'),choiceKind:'record',choiceVisuals:[{type:'record',title:'RESERVATION',lines:['Alex Chen','7:00 p.m.']},{type:'record',title:'RESERVATION',lines:['Alex Chen','8:00 p.m.']}],pictureChoices:true})
]);
group('d9-merged-day9-booking-changes-v1',[
 L('餐廳的回覆對應哪個空桌畫面？','用已坐滿與仍有空桌的餐廳畫面辨認 fully booked。',{choiceVisuals:[{type:'tables',full:true},{type:'tables',full:false}],pictureChoices:true}),
 V('把訂位時間放到你接受的那個時鐘。','改比較 7:30、7:00、8:30，不用接受／拒絕再說一次。',{objects:opts('接受 7 點半','訂晚上 7 點','訂晚上 8 點半'),choiceKind:'time',choiceVisuals:[{type:'clock',hour:7,minute:30},{type:'clock',hour:7},{type:'clock',hour:8,minute:30}],pictureChoices:true}),
 L('餐廳確認能改到哪個時間？','兩個可調整時間都合理，必須聽 six thirty，而非只選改時間。',{objects:opts('改成 6 點半','改成 7 點半','維持 7 點'),choiceVisuals:[{type:'clock',hour:6,minute:30},{type:'clock',hour:7,minute:30},{type:'clock',hour:7}],pictureChoices:true}),
 D('這個時間符合你的行程嗎？決定是否留下訂位。','用最晚 8 點的限制與餐廳只剩 9 點比較，不先告訴學生哪個時間太晚。',{task:'你最晚只能晚上 8 點用餐。先聽餐廳剩下的時間，再用已學過的說法禮貌決定是否訂位。'})
]);
group('d9-merged-day9-ticket-quantity-total-v1',[
 L('把成人票單價核對清楚。','辨認每張票價格，不與之後總價混淆。'),
 V('把需要的成人票放進票夾。','用實際票張數操作，保留人物圖示區別票種。'),
 D('聽清楚追加的票種和張數，選出最後的整組票。','比較 2 成人＋1 兒童、1 成人＋2 兒童；總張數相同，必須看票種。',{objects:opts('2 張成人票加 1 張兒童票','1 張成人票加 2 張兒童票'),choiceKind:'ticket-set',choiceVisuals:[{type:'tickets',adults:2,children:1},{type:'tickets',adults:1,children:2}],pictureChoices:true}),
 L('確認這一整組票的總價。','20 是成人票小計，25 才包含兒童票；需要聽懂總價範圍。')
]);
group('d9-merged-day9-entry-payment-v1',[
 L('選出可以開始入場的時間。','只有售票員的回覆提供 10 點，任務說明不預先公布。'),
 L('這裡接受哪一種付款物件？','刷卡是詢問，不是已知店規；聽肯定或限制後才選。'),
 V('把你決定使用的付款物件交給售票員。','實際辨認卡片與鈔票，避免重複兩個中文付款詞。')
]);

group('d10-merged-day10-polite-requests-v1',[
 L('店員這句回應表示你現在可以做什麼？','Yes? 在此是接住招呼，不是同意尚未提出的請求。',{objects:opts('開始向店員說明需求','把這句當成需求已完成'),choiceKind:'social',choiceVisuals:[{type:'request'},{type:'completed'}]}),
 V('從桌面拿出正確數量的餐巾紙。','比較實物數量，不再次直接選兩張字樣。'),
 V('拿起與你剛才請求相符的飲料。','水與茶以液體顏色辨認，兩杯都可取用。'),
 L('聽旅伴的回應，接下來誰會搬袋子？','以一人／兩人搬運呈現答應幫忙的結果，不把勾號當正解線索。')
]);
group('d10-merged-day10-decline-and-reschedule-v1',[
 D('看你今晚的行程，這個邀請能不能加入？','用既有安排與邀請時間衝突作判斷，不直接提示不能參加。',{task:'你今晚已有另一個約。聽清楚旅伴邀約的時間，再用學過的婉拒句回應。'}),
 V('你的回應應該把今晚行事曆標成哪個狀態？','用占用時段與空白時段辨認已有安排，非同句中文重選。',{choiceVisuals:[{type:'diary',busy:true},{type:'diary',busy:false}],pictureChoices:true}),
 L('聽完旅伴回覆，把聚餐放到確定可以的那一天。','你的提議尚未等於對方同意，必須聽 Tomorrow is fine。')
]);

group('d11-merged-day11-meet-companions-v1',[
 V('把你的來處放進旅行卡的正確欄位。','同一地名分別是來處或目的地，需分辨 from 的用途，而非猜國旗。',{objects:opts('我來自臺灣','我的旅行目的地是臺灣'),choiceKind:'record',choiceVisuals:[{type:'record',title:'FROM',lines:['Taiwan']},{type:'record',title:'TO',lines:['Taiwan']}],pictureChoices:true}),
 L('這段互動是第一次見面，還是結束道別？','把無關的詢問工作改為同樣合理的社交時機，辨認 Nice to meet you。',{objects:opts('第一次見面，互相打招呼','結束聊天，互相道別'),choiceKind:'social',choiceVisuals:[{type:'arrival'},{type:'departure'}]}),
 V('從同行者圖片選出你的旅行組合。','以家人群像與單人區分，保留自己的真實資料作口說條件。',{pictureChoices:true}),
 L('替旅伴選出他剛才說的同行組合。','不能把自己的家人同行資料套到旅伴；依 friend 判斷。',{pictureChoices:true})
]);
group('d11-merged-day11-interests-and-visits-v1',[
 L('替旅伴放入他剛才說的興趣圖片。','健行與拍照都是合理活動，只能聽 like hiking 得知。'),
 D('把你和旅伴的興趣都放對人。','同時核對前一句旅伴健行與自己的拍照，不只是再點相機。',{objects:opts('我喜歡拍照；旅伴喜歡健行','我喜歡健行；旅伴喜歡拍照'),choiceKind:'people-pair',choiceVisuals:[{type:'people-pair',mine:'camera',other:'hiking'},{type:'people-pair',mine:'hiking',other:'camera'}],pictureChoices:true}),
 D('你剛才的回應表示有興趣，還是已經參加過？','兩個都是正面回應，sounds fun 不能推論已參加過；移除明顯負面的不喜歡。',{objects:opts('覺得活動聽起來有趣','表示自己已經參加過'),choiceKind:'social',choiceVisuals:[{type:'interest'},{type:'photo-memory'}]}),
 V('把這次參觀的感受放進回顧卡。','比較表情與感受，不把很棒直接印在預設圖片上。',{pictureChoices:true}),
 L('哪個博物館畫面符合你們剛才的描述？','用人群密度辨認 crowded，不能以空白示意圖代替沒有人的場景。',{pictureChoices:true})
]);

group('d11-first-visit-chat-v1',[
 L('把旅伴的到訪經驗放進他的旅行卡。','須聽懂 Yes 與 been here before；不以自己的第一次到訪推測旅伴。',{choiceKind:'record',choiceVisuals:[{type:'record',title:'旅伴',lines:['以前來過']},{type:'record',title:'旅伴',lines:['第一次來']}],pictureChoices:true}),
 D('把兩人的到訪經驗放對旅行卡。','結合前一句旅伴以前來過，以及自己的第一次到訪，確認資訊屬於誰。',{choiceKind:'record',choiceVisuals:[{type:'record',title:'這次旅行',lines:['我：第一次來','旅伴：以前來過']},{type:'record',title:'這次旅行',lines:['我：以前來過','旅伴：第一次來']}],pictureChoices:true,sceneFacts:['我第一次來','旅伴以前來過']})
]);
group('d11-first-visit-chat-v1-change',[
 V('依這次情境，記下你自己的到訪經驗。','學生這次以前來過；與第一次到訪分開練，不把兩種回答接在一起。',{choiceKind:'record',choiceVisuals:[{type:'record',title:'我',lines:['以前來過']},{type:'record',title:'我',lines:['第一次來']}],pictureChoices:true}),
 L('問回去之後，把旅伴的到訪經驗記清楚。','聽懂 No 與 first time，不能把自己的到訪紀錄套到旅伴。',{choiceKind:'record',choiceVisuals:[{type:'record',title:'旅伴',lines:['第一次來']},{type:'record',title:'旅伴',lines:['以前來過']}],pictureChoices:true})
]);

group('d12-rescue-closed-v1',[
 L('哪個門口狀態符合工作人員的回覆？','開門與休館均可能，先聽 closed today。'),
 L('選出工作人員說今天有開的替代景點。','兩個不同博物館都可選，不再讓休館字樣直接排除錯項。',{objects:opts('改去歷史博物館','改去市立博物館'),choiceKind:'place'}),
 L('到車站後，依指示選出正確公車。','5 與 9 是合理車號，需聽 number five。'),
 L('對方說的時間指的是哪一件事？','同樣數字的班距與車程，必須依 How long does it take 理解意義。'),
 D('核對交通卡：車號和車程有沒有放反？','交叉檢查兩項前文資訊，不能只辨認一個數字。')
]);
group('d12-rescue-late-v1',[
 L('你趕不上了。先把導遊說的發車時間記清楚。','移除「沒有通知讓大家等」這種不用聽就能排除的錯項，改聽辨時間。',{objects:opts('公車 10 點出發','公車 12 點出發'),choiceKind:'time'}),
 V('在聯絡畫面標出你現在的位置。','以車站與飯店兩個合理位置圖辨認目前所在地。'),
 L('導遊要你到哪個地方會合？','博物館入口與飯店大廳都可能是會合點，必須聽回覆。'),
 L('重聽後，選出這次確認的會合點。','把不合理的掛電話改成另一個地點，必須聽清 entrance。',{objects:opts('再次聽到：飯店大廳','再次聽到：博物館入口'),choiceKind:'place'}),
 L('導遊確認後，要你直接去哪裡？','前文記憶與 Please come straight here 共同決定下一步。')
]);
group('d12-rescue-lost-v1',[
 L('站務人員接著需要你提供哪項資料？','問的是 Which bus，不再重選學生已說過的物品遺失地點。',{objects:opts('提供搭乘的公車車號','描述包包外觀'),choiceKind:'requested-item',choiceVisuals:[{type:'bus'},{type:'bag-description'}]}),
 L('車號說完後，對方下一個問題是在問什麼？','辨認 What does it look like，取代重選剛說完的 5 號車。',{objects:opts('再次提供公車車號','描述包包外觀'),choiceKind:'requested-item',choiceVisuals:[{type:'bus'},{type:'bag-description'}]}),
 L('你描述完包包後，對方要你向哪裡查詢？','轉向新回覆 information desk，學生自己的外觀描述不能直接給出答案。',{objects:opts('到服務台查詢','到售票櫃檯查詢'),choiceKind:'place'}),
 L('兩邊都有服務台。依指引，選出正確位置。','把物件固定為服務台，只改相對於大門／餐廳的位置。',{objects:opts('到餐廳旁的服務台','到大門旁的服務台'),choiceKind:'location-note',choiceVisuals:[{type:'location-note',near:'餐廳'},{type:'location-note',near:'大門'}]}),
 D('拿到紙條後，下一步要照哪個位置去查詢？','兩張都是位置紙條，需記住前文大門旁；不把拿到紙條誤當找回包包。',{objects:opts('服務台：大門旁','服務台：餐廳旁'),choiceKind:'location-note',choiceVisuals:[{type:'location-note',near:'大門'},{type:'location-note',near:'餐廳'}]})
]);

// Scene facts are separate from the action picked. Asking for a bus number is
// not itself a bus number; compound tickets and two people need separate facts.
reviews['micro-en-d12-rescue-lost-v1-1'].patch.sceneFacts=['5 號公車'];
reviews['micro-en-d12-rescue-lost-v1-2'].patch.sceneFacts=['黑色小包包','到服務台查詢'];
reviews['micro-en-d12-rescue-lost-v1-4'].patch.sceneFacts=['服務台：大門旁','已收好位置紙條'];
reviews['micro-en-d9-merged-day9-ticket-quantity-total-v1-2'].patch.sceneFacts=['2 張成人票','1 張兒童票'];
reviews['micro-en-d11-merged-day11-interests-and-visits-v1-1'].patch.sceneFacts=['我喜歡拍照','旅伴喜歡健行'];
reviews['micro-en-d10-merged-day10-polite-requests-v1-0'].patch.sceneFacts=['店員已注意到你'];
reviews['micro-en-d12-rescue-late-v1-0'].patch.task='你確定趕不上集合，先通知導遊你會遲到，再聽清楚導遊提供的發車時間。';
reviews['micro-en-d5-dropoff-and-stop-v1-1'].patch.task='車子已到入口。請司機在這裡停，再聽他是否同意。';
reviews['route-a-right-v4'].mode='apply';
reviews['route-a-right-v4'].prompt='面向前方，把剛才確認的方向標到地圖。';
reviews['route-a-right-v4'].patch.task='你想確認剛才聽到的方向，先用學過的短句問一次，再依回覆標示。';
reviews['micro-en-d11-merged-day11-meet-companions-v1-1'].patch.task='新旅伴先向你打招呼。聽懂後，用本輪學過的見面招呼回應。';
reviews['micro-en-d11-merged-day11-interests-and-visits-v1-4'].mode='apply';
reviews['micro-en-d11-merged-day11-interests-and-visits-v1-4'].patch.task='旅伴提到博物館的人潮。聽懂後，如果和你的觀察相同，就用學過的句子表示同意。';
function apply(data){
 for(const flow of data.flows||[])for(const step of flow.steps){
  const r=reviews[step.id];if(!r)continue; // Historical, non-current curricula remain readable.
  const before={task:step.task,objects:step.objects.map(o=>o[1])};
  Object.assign(step,JSON.parse(JSON.stringify(r.patch)));
  step.choicePrompt=r.prompt;
  step.choiceReview={version:2,mode:r.mode,reason:r.reason,action:Object.keys(r.patch).length?'rewrite':'retain',before};
 }
 return data;
}
module.exports={apply,reviews};
