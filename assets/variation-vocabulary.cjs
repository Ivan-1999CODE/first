// Part 4's authored changes, taught explicitly in Part 2 of the same task.
// One entry per mission, in missionIds order. This does not alter any exercise
// or persisted answer key. Context-only changes still need bilingual vocabulary.
const pair=(label,from,fromZh,to,toZh,note='')=>({label,from:[from,fromZh],to:[to,toZh],note});
const P=pair;
const lessons={
 1:{
  A:[P('問路目的地','train station','火車站','bus stop','公車站')],
  B:[P('請指路與問公車的目的地','train station','火車站','post office','郵局','路人已知道目的地，自己的問法與道謝沿用原句。')],
  C:[P('請重說與指地圖的目的地','post office','郵局','police station','警局','目的地換了，請重說與請指地圖仍用原句。')]
 },
 2:{
  A:[P('問價格與決定購買的商品','mug','杯子','postcard','明信片','指著商品，仍用 this 和 it，不必另外說商品名稱。'),P('買水的數量','three bottles','3 瓶','two bottles','2 瓶','每瓶 2 美元：six dollars（6 美元）變成 four dollars（4 美元）。')],
  B:[P('付款的商品','mug','杯子','postcard','明信片','商品變了，問刷卡與表示付現金仍用原句。'),P('要不要袋子','No, thank you.','不用了，謝謝。','Yes, please.','好的，麻煩你。')],
  C:[P('說出預算','ten dollars','10 美元','eight dollars','8 美元')]
 },
 3:{
  A:[P('座位偏好','an aisle seat','一個靠走道座位','a window seat','一個靠窗座位','注意冠詞也跟著換：an aisle seat／a window seat。'),P('託運行李件數','one bag','1 件行李','two bags','2 件行李','1 件用 bag，2 件用 bags。')],
  B:[P('聽懂登機門號碼','twelve','12','twenty','20','問登機門與請重說仍用原句；留意 twelve 和 twenty 的發音。')],
  C:[P('停留天數','seven days','7 天','fourteen days','14 天'),P('住宿飯店','Sunny Hotel','Sunny 飯店','Green Park Hotel','Green Park 飯店')],
  D:[P('攜帶的食物','cookies','餅乾','apples','蘋果')]
 },
 4:{
  A:[P('車票種類','single','單程','return','來回')],
  B:[P('聽懂票價','twelve dollars','12 美元','ten dollars','10 美元','問價格與能否刷卡仍用原句。')],
  C:[P('聽懂月台號碼','platform six','第 6 月台','platform three','第 3 月台','platform 是月台；six 是 6，three 是 3。')],
  D:[P('聽懂捷運路線','green line','綠線','red line','紅線')],
  E:[P('聽懂公車號碼','bus twelve','12 號公車','bus twenty','20 號公車')],
  F:[P('確認或更正目的地','River Market','河畔市集','Central Station','中央車站','司機說的地點不對：把 Yes, that’s right.（對，沒錯。）換成 No, I want to go to Central Station.（不是，我想去中央車站。）。')]
 },
 5:{
  A:[P('聽懂在哪個路口轉彎','first','第一個','second','第二個','intersection 是路口：first intersection 是第一個路口；second intersection 是第二個路口。兩次都左轉，問路與遠近仍用原句。')],
  B:[P('告訴司機目的地','the museum','博物館','the hotel','飯店'),P('聽懂預估車程','fifteen minutes','15 分鐘','twenty minutes','20 分鐘','fifteen 是 15，twenty 是 20；問車程與車資仍用原句。')],
  C:[P('說明等車位置','hotel entrance','飯店入口','museum entrance','博物館入口','outside 是在外面；說位置時仍保留 outside the。')],
  D:[P('指定下車位置','entrance','入口','corner','街角','At the entrance（在入口）換成 at the corner（在街角）。')]
 },
 6:{
  A:[P('主餐','a chicken sandwich','一份雞肉三明治','the tomato pasta','這裡說的番茄義大利麵','sandwich 是三明治，pasta 是義大利麵；番茄義大利麵在本題用 the tomato pasta。')],
  B:[P('聽懂店員的另一種問法','Are you ready to order?','準備好點餐了嗎？','May I take your order?','可以幫你們點餐了嗎？','兩句都在問能不能開始點餐；仍可回答請再給一點時間。'),P('請多給時間的人數','we','我們','I','我','Could we have…（可以給我們……嗎？）換成 Could I have…（可以給我……嗎？）。')],
  C:[P('是否要甜點','Chocolate cake, please.','請給我巧克力蛋糕。','No, thank you.','不用了，謝謝。'),P('咖啡調配','black','黑咖啡／不加奶','with milk','加牛奶')],
  D:[P('牛排熟度','medium','五分熟','well-done','全熟')],
  E:[P('選餐時的預算','ten dollars','10 美元','eight dollars','8 美元','這題不必說出預算，仍用原句問價格、找便宜一點的餐點。'),P('確認帳單金額','eight dollars fifty','8 美元 50 分','seven dollars fifty','7 美元 50 分')],
  F:[P('用餐方式','for here','內用','to go','外帶')]
 },
 7:{
  A:[P('詢問尺寸','medium','M 號','large','L 號'),P('聽懂店員提供的顏色','blue','藍色','green','綠色','問其他尺寸、顏色仍用原句。'),P('回答想要的顏色','blue','藍色','green','綠色')],
  B:[P('聽懂試衣間方向','right','右邊','left','左邊')],
  C:[P('說明太小或太緊','small','小','tight','緊','too small 是太小，too tight 是太緊。'),P('說明太大或太鬆','big','大','loose','鬆','too big 是太大，too loose 是太鬆。'),P('聽懂店員建議的尺寸','larger','大一點','smaller','小一點','a larger size 是大一點的尺寸；a smaller size 是小一點的尺寸。')],
  D:[P('比較後選擇的顏色','blue','藍色','green','綠色','指著喜歡的那件，仍可用 this one（這件）和 it（它）。')]
 },
 8:{
  A:[P('訂房姓名','Alex Chen','範例姓名：Alex Chen','Jamie Lin','範例姓名：Jamie Lin','under 後面放訂房使用的姓名；也可以換成自己的姓名。')],
  B:[P('住宿晚數','two nights','2 晚','three nights','3 晚')],
  C:[P('聽懂退房時間','eleven','11 點','twelve','12 點'),P('聽懂電梯方向','left','左邊','right','右邊')],
  D:[P('額外毛巾數量','two extra towels','2 條額外毛巾','one extra towel','1 條額外毛巾','1 條用 towel，2 條用 towels。'),P('要水時的房號','three oh five','305','five one two','512','房號逐位念；305 中間的 0 可以念 oh。'),P('要棉被時的房號','three oh five','305','five one two','512')],
  E:[P('聽懂客房餐點總價','twenty dollars','20 美元','twenty-five dollars','25 美元'),P('聽懂送餐時間','twenty minutes','20 分鐘','ten minutes','10 分鐘'),P('最後的訂餐決定','Yes, please.','好的，麻煩你。','No, thank you.','不用了，謝謝。')],
  F:[P('故障的設備','air conditioner','冷氣','TV','電視')]
 },
 9:{
  A:[P('訂位人數','two','2 位','four','4 位','a table for two 是 2 人桌；a table for four 是 4 人桌。'),P('訂位姓名','Alex Chen','範例姓名：Alex Chen','Jamie Lin','範例姓名：Jamie Lin','The name is 後面放訂位使用的姓名。')],
  B:[P('接受替代時段','seven thirty','7 點半','eight','8 點'),P('提出更改時間','six thirty','6 點半','eight thirty','8 點半'),P('聽懂餐廳剩下的時段','nine p.m.','晚上 9 點','eight p.m.','晚上 8 點','兩個時段都不方便，仍用原句表示暫時不訂。')],
  C:[P('成人票數量','two adult tickets','2 張成人票','one adult ticket','1 張成人票','1 張用 ticket，2 張用 tickets。'),P('兒童票數量','one child ticket','1 張兒童票','two child tickets','2 張兒童票','成人票仍 2 張；總價由 twenty-five dollars（25 美元）變成 thirty dollars（30 美元）。')],
  D:[P('聽懂入場時間','ten','10 點','eleven','11 點'),P('選擇付款方式','card','刷卡','cash','現金')]
 },
 10:{
  A:[P('餐巾紙數量','two napkins','2 張餐巾紙','three napkins','3 張餐巾紙'),P('想要的飲料','water','水','tea','茶'),P('請對方幫忙搬的物品','bag','袋子','suitcase','行李箱')],
  B:[P('婉拒邀請的日期','tonight','今晚','tomorrow night','明天晚上'),P('提議相約的日期','tomorrow','明天','Sunday','星期日')]
 },
 11:{
  A:[P('介紹自己的來處','Taiwan','臺灣','Taipei','臺北'),P('介紹同行者','my family','我的家人','a friend','一位朋友')],
  B:[P('分享自己的興趣','taking photos','拍照','reading','閱讀'),P('聽懂旅伴的興趣','hiking','健行','reading','閱讀','仍可用 That sounds fun.（聽起來很有趣。）回應。'),P('分享遊玩感想的地點','museum','博物館','park','公園','地點換了，仍用原句回答感想，不必另說地點名稱。')]
 }
};

function addVariationVocabulary(data){
 const authored=lessons[Number(data.course.day)];
 if(!authored)return data;
 if(data.rounds.length!==Object.keys(authored).length)throw Error('Part 4 vocabulary task count changed: '+data.course.day);
 for(const r of data.rounds){
  const label=r.displayLabel||r.id,entries=authored[label];
  if(!entries||entries.length!==r.missionIds.length)throw Error(`Part 4 vocabulary mapping changed: ${data.course.day}/${label}`);
  r.variationVocabulary=entries.map((entry,i)=>({...entry,missionId:data.missions[r.missionIds[i]].id}));
 }
 return data;
}
module.exports={addVariationVocabulary};
