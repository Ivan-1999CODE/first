// Optional substitutions for section 02. Keys are stable phrase IDs within each day.
// Keep complete noun phrases where articles, plurals or prepositions must change.
const group=(target,...options)=>({target,options});
const food=require('./day6-food-options.cjs');
const places=target=>group(target,['the train station','火車站'],['the bus stop','公車站'],['the post office','郵局']);
const sizes=()=>group('medium',['small','S 號'],['medium','M 號'],['large','L 號']);
const payment=()=>group('by card',['by card','刷卡'],['in cash','付現金']);
const notes={
 1:{
  'phrase-0':[places('the train station')],
  'phrase-1':[places('the post office')],
  'phrase-8':[group('a bus',['a bus','公車'],['a taxi','計程車'])],
  'phrase-9':[group('left',['left','左邊'],['right','右邊'])]
 },
 2:{
  'phrase-0':[group('a T-shirt',['a T-shirt','一件 T-shirt'],['a hat','一頂帽子'],['a gift','一份禮物'])],
  'phrase-1':[group('blue',['blue','藍色'],['black','黑色'],['green','綠色'])],
  'phrase-3':[sizes()],
  'phrase-7':[payment()],
  'phrase-10':[group('ten dollars',['eight dollars','8 美元'],['ten dollars','10 美元'],['twenty dollars','20 美元'])],
  'phrase-11':[group('three bottles of water',['one bottle of water','1 瓶水'],['two bottles of water','2 瓶水'],['three bottles of water','3 瓶水'])],
  'phrase-12':[group('in cash',['in cash','付現金'],['by card','刷卡'])]
 },
 3:{
  'phrase-1':[group('one bag',['one bag','1 件行李'],['two bags','2 件行李'],['three bags','3 件行李'])],
  'phrase-2':[group('An aisle seat',['An aisle seat','靠走道座位'],['A window seat','靠窗座位'])],
  'phrase-4':[group('on vacation',['on vacation','來度假'],['on business','來出差'])],
  'phrase-5':[group('seven days',['four days','4 天'],['seven days','7 天'],['two weeks','2 週'])],
  'phrase-6':[group('Sunny Hotel',['Sunny Hotel','Sunny 飯店'],['Green Park Hotel','Green Park 飯店'])]
 },
 4:{
  'phrase-0':[group('One ticket',['One ticket','1 張票'],['Two tickets','2 張票']),group('Central Station',['Central Station','中央車站'],['Lake Station','湖畔車站'],['the airport','機場'])],
  'phrase-3':[payment()],
  'phrase-10':[group('River Market',['River Market','河畔市集'],['Central Station','中央車站'],['the airport','機場'])]
 },
 5:{
  'phrase-0':[places('the museum')],
  'phrase-3':[group('left',['left','左邊'],['right','右邊']),group('first',['first','第一個'],['second','第二個'])],
  'phrase-4':[group('right',['right','右邊'],['left','左邊']),group('second',['first','第一個'],['second','第二個'])],
  'phrase-5':[group('the museum',['the museum','博物館'],['the airport','機場'],['Sunny Hotel','Sunny 飯店'])],
  'phrase-9':[group('the hotel entrance',['the hotel entrance','飯店入口'],['the museum entrance','博物館入口'])]
 },
 6:{
  'phrase-0':[group('a chicken sandwich',['a chicken sandwich','一份雞肉三明治'],['a club sandwich','一份總匯三明治'])],
  'phrase-1':[group('the tomato pasta',['the tomato pasta','番茄義大利麵'],['the chicken sandwich','雞肉三明治'])],
  'phrase-9':[group('eight dollars fifty',['seven dollars fifty','7 美元 50 分'],['eight dollars fifty','8 美元 50 分'],['ten dollars','10 美元'])],
  'steak-medium':[group('Medium',...food.steak.map(o=>[o.en,o.zh]))],
  'eggs-scrambled':[group('Scrambled',...food.eggs.map(o=>[o.en,o.zh]))]
 },
 7:{
  'phrase-2':[sizes()],
  'phrase-5':[group('big',['big','大'],['small','小'])],
  'phrase-6':[group('tight',['tight','緊'],['loose','鬆'])],
  'phrase-7':[group('bigger',['bigger','大一點'],['smaller','小一點'])],
  'phrase-8':[group('smaller',['smaller','小一點'],['bigger','大一點'])]
 },
 8:{
  'phrase-1':[group('Alex Chen',['Alex Chen','訂房姓名範例'],['Amy Lin','另一個姓名範例'])],
  'phrase-3':[group('two nights',['one night','1 晚'],['two nights','2 晚'],['three nights','3 晚'])],
  'phrase-4':[group('breakfast',['breakfast','早餐'],['Wi-Fi','無線網路'])],
  'phrase-6':[group('elevator',['elevator','電梯'],['restaurant','餐廳'],['gym','健身房'])],
  'phrase-7':[group('three oh five',['three oh five','305 號房'],['four oh two','402 號房'],['five one six','516 號房'])],
  'phrase-8':[group('two extra towels',['an extra towel','1 條額外毛巾'],['two extra towels','2 條額外毛巾'],['an extra pillow','1 個額外枕頭'])],
  'phrase-9':[group('a club sandwich',['a club sandwich','一份總匯三明治'],['a chicken sandwich','一份雞肉三明治'])],
  'phrase-12':[group('air conditioner',['air conditioner','冷氣'],['key card','房卡'],['TV','電視'])]
 },
 9:{
  'phrase-0':[group('two',['two','2 位'],['three','3 位'],['four','4 位'])],
  'phrase-1':[group('tomorrow',['tomorrow','明天'],['Friday','星期五']),group('seven p.m.',['six thirty p.m.','晚上 6:30'],['seven p.m.','晚上 7:00'])],
  'phrase-2':[group('Alex Chen',['Alex Chen','訂位姓名範例'],['Amy Lin','另一個姓名範例'])],
  'phrase-3':[group('seven',['six thirty','6:30'],['seven','7:00'],['seven thirty','7:30'])],
  'phrase-4':[group('Seven thirty',['Six thirty','6:30'],['Seven thirty','7:30'])],
  'phrase-5':[group('six thirty',['six thirty','6:30'],['seven','7:00'],['seven thirty','7:30'])],
  'phrase-6':[group('two adult tickets',['one adult ticket','1 張成人票'],['two adult tickets','2 張成人票'],['three adult tickets','3 張成人票'])],
  'phrase-7':[group('One child ticket',['One child ticket','1 張兒童票'],['Two child tickets','2 張兒童票'])],
  'phrase-8':[group('an adult ticket',['an adult ticket','1 張成人票'],['a child ticket','1 張兒童票'])],
  'phrase-11':[payment()]
 },
 10:{
  napkins:[group('two napkins',['one napkin','1 張餐巾紙'],['two napkins','2 張餐巾紙'],['three napkins','3 張餐巾紙'])],
  water:[group('water',['water','水'],['tea','茶'])],
  help:[group('bag',['bag','袋子'],['suitcase','行李箱'])],
  invite:[group('tonight',['tonight','今晚'],['tomorrow','明天'])],
  alternative:[group('tomorrow',['tomorrow','明天'],['Friday','星期五'])]
 },
 11:{
  like:[group('taking photos',['taking photos','拍照'],['reading','閱讀'],['hiking','健行'])],
  good:[group('taking photos',['taking photos','拍照'],['cooking','烹飪'],['drawing','畫畫'])],
  weather:[group('today',['today','今天'],['tomorrow','明天'])],
  plan:[group('today',['today','今天'],['tomorrow','明天'])],
  want:[group('visit a museum',['visit a museum','參觀博物館'],['take a walk','散步'],['go shopping','逛街購物'])],
  agree:[group('ten',['nine','9 點'],['ten','10 點'],['ten thirty','10:30'])],
  problem:[group('phone',['phone','手機'],['wallet','錢包'],['ticket','車票'])],
  opinion:[group('museum',['museum','博物館'],['park','公園'],['hotel','飯店'])],
  think:[group('interesting',['interesting','有趣'],['beautiful','漂亮'],['great','很棒'])]
 },
 12:{
  suggest:[group('visiting the museum',['visiting the museum','參觀博物館'],['visiting the park','去公園'],['going shopping','逛街購物'])],
  alternative:[group('taking a walk',['taking a walk','散步'],['taking a break','休息一下'])],
  bus:[group('the bus',['the bus','公車'],['the train','火車'],['a taxi','計程車'])],
  frequency:[group('bus',['bus','公車'],['train','火車'])],
  arrival:[group('bus',['bus','公車'],['train','火車'])],
  cost:[group('one ticket',['one ticket','1 張票'],['one adult ticket','1 張成人票'],['one child ticket','1 張兒童票'])],
  buy:[group('Two adult tickets',['One adult ticket','1 張成人票'],['Two adult tickets','2 張成人票'],['Two child tickets','2 張兒童票'])]
 },
 13:{
  place:[group('the park or the museum',['the park or the museum','公園或博物館'],['the beach or the zoo','海灘或動物園'])],
  choose:[group('museum',['museum','博物館'],['park','公園'],['beach','海灘'])],
  hot:[group('hot',['hot','熱'],['cold','冷'])],
  trees:[group('trees',['trees','樹木'],['flowers','花'],['animals','動物'])],
  transport:[group('the bus',['the bus','公車'],['the train','火車'],['a taxi','計程車'])],
  taxi:[group('a taxi',['a taxi','計程車'],['the bus','公車'])],
  tired:[group('tired',['tired','累'],['hungry','餓'],['thirsty','渴'])],
  rest:[group('take a break',['take a break','休息一下'],['get some water','買點水'])]
 },
 14:{
  choose:[group('the beach',['the beach','海灘'],['the museum','博物館'],['the park','公園'])],
  lobby:[group('the hotel lobby',['the hotel lobby','飯店大廳'],['the hotel entrance','飯店入口'])],
  time:[group('nine',['nine','9 點'],['nine thirty','9:30'],['ten','10 點'])],
  name:[group('Amy',['Amy','人名範例'],['Alex','另一個人名範例'])],
  family:[group('my family',['my family','我的家人'],['my friends','我的朋友'],['my partner','我的伴侶'])],
  confirm:[group('nine',['nine','9 點'],['ten','10 點']),group('the hotel lobby',['the hotel lobby','飯店大廳'],['the hotel entrance','飯店入口'])]
 }
};
function addSubstitutions(d){
 if(d.course.revisedConversations){
  for(const p of d.phrases)for(const g of p.substitutions||[])if(!p.en.includes(g.target)||g.options.length<2)throw Error(`Invalid conversation substitutions: ${d.course.day}/${p.id}`);
  return d;
 }
 const table=notes[d.course.day];
 if(!table)return d;
 for(const id of Object.keys(table))if(!d.phrases.some(p=>p.id===id))throw Error(`Missing phrase for substitutions: ${d.course.day}/${id}`);
 for(const p of d.phrases){
  p.substitutions=table[p.id]||[];
  if(d.course.day===6&&['steak-medium','eggs-scrambled'].includes(p.id))p.illustratedOptions=food[p.id==='steak-medium'?'steak':'eggs'];
  // The optional disclosure is reserved for substitutable words, not generic advice.
  p.note='';
  for(const g of p.substitutions)if(!p.en.includes(g.target)||g.options.length<2)throw Error(`Invalid substitutions: ${d.course.day}/${p.id}`);
 }
 for(const r of d.rounds)for(const p of r.advanced||[]){
  p.substitutions=p.en==='Could you tell me how to get to the train station?'?[places('the train station')]:
   p.en==='Do I turn left at the second intersection?'?[group('left',['left','左邊'],['right','右邊']),group('second',['first','第一個'],['second','第二個'])]:[];
 }
 return d;
}
module.exports={addSubstitutions};
