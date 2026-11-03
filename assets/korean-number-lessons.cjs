// Context-specific references, separate from the original numeral/audio keys.
// Counts: NIKL 한국어 교원용 지침서 (한국어진흥-02-17), counting-unit lesson.
// Money: https://www.korean.go.kr/front/mcfaq/mcfaqView.do?mcfaq_seq=8574&mn_id=
const item=(text,zh,romaji)=>({text,zh,romaji});
const quantity={
 id:'quantity',title:'數物品：一個、兩個，一直到 10 個',
 description:'買幾個，就把數量和 개（個）一起說。先練本任務的一個、兩個，其餘可以慢慢聽。',
 sequenceLabel:'連續聽 1～10 個',slowLabel:'慢速聽 1～10 個',
 note:'數物品用固有數詞。하나、둘、셋、넷 接在 개 前面時，變成 한、두、세、네；這裡直接練「幾個」，不要套用金額的 일、이、삼、사。',
 groups:[{title:'把「個」一起念',items:[
  item('한 개','1 個','han gae'),item('두 개','2 個','du gae'),
  item('세 개','3 個','se gae'),item('네 개','4 個','ne gae'),
  item('다섯 개','5 個','daseot gae'),item('여섯 개','6 個','yeoseot gae'),
  item('일곱 개','7 個','ilgop gae'),item('여덟 개','8 個','yeodeol gae'),
  item('아홉 개','9 個','ahop gae'),item('열 개','10 個','yeol gae')
 ]}]
};
const price={
 id:'price',title:'聽懂價錢：幾百、幾千韓元',
 description:'問完價錢，要聽懂的是完整金額。把數字和 원（韓元）連在一起聽，再指出相同的金額。',
 sequenceLabel:'依序聽這些金額',slowLabel:'慢速聽這些金額',
 note:'金額用漢字數詞：백 是百、천 是千、만 是萬。100、1,000、10,000 韓元通常說 백 원、천 원、만 원，前面不另加 일。數物品的 한 개、두 개 請到「說幾個，再問總價」練習。',
 groups:[
  {title:'先聽幾百韓元',items:[item('백 원','100 韓元','baek won'),item('이백 원','200 韓元','ibaek won'),item('삼백 원','300 韓元','sambaek won'),item('오백 원','500 韓元','obaek won')]},
  {title:'再聽幾千韓元',items:[item('천 원','1,000 韓元','cheon won'),item('이천 원','2,000 韓元','icheon won'),item('삼천 원','3,000 韓元','samcheon won'),item('오천 원','5,000 韓元','ocheon won')]},
  {title:'把千和百合起來；再認識一萬',items:[item('천오백 원','1,500 韓元','cheonobaek won'),item('삼천오백 원','3,500 韓元','samcheonobaek won'),item('만 원','10,000 韓元','man won')]}
 ]
};
module.exports={quantity,price};
