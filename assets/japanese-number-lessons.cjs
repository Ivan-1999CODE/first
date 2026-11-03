// Readings checked against Japan Foundation Irodori L16 and BTS00010 counters.
// https://www.jpf.or.kr/irodori/sData/pdf/resources/wordlist_X.pdf
// https://www.kyozai.jpf.go.jp/kyozai/material/BTS00010/ja/render.do
const item=(text,zh,kana,romaji,special='')=>({text,zh,kana,romaji,special});
const quantity={
 id:'quantity',title:'數物品：一個、兩個，一直到 10 個',
 description:'買幾個，先練這一課使用的「つ」數法。先熟悉ひとつ、ふたつ，再往下聽。',
 sequenceLabel:'連續聽 1～10 個',slowLabel:'慢速聽 1～10 個',
 note:'這裡練一般物品的「つ」數法；人數、長條物品等另有量詞。3、4、6、8 個的小「っ」要停一拍；10 個說「とお」，不再加「つ」。',
 groups:[{title:'把數量當成完整說法來記',items:[
  item('ひとつ','1 個','ひとつ','hitotsu'),item('ふたつ','2 個','ふたつ','futatsu'),
  item('みっつ','3 個','みっつ','mittsu','小「っ」：停一拍'),item('よっつ','4 個','よっつ','yottsu','小「っ」：停一拍'),
  item('いつつ','5 個','いつつ','itsutsu'),item('むっつ','6 個','むっつ','muttsu','小「っ」：停一拍'),
  item('ななつ','7 個','ななつ','nanatsu'),item('やっつ','8 個','やっつ','yattsu','小「っ」：停一拍'),
  item('ここのつ','9 個','ここのつ','kokonotsu'),item('とお','10 個','とお','too','特殊讀法：とお，不加「つ」；お 音拉長')
 ]}]
};
const price={
 id:'price',title:'聽懂價錢：幾百、幾千日圓',
 description:'把數字和「円（えん）」一起聽。先練幾百，再練幾千；有特殊讀法的金額會另外提醒。',
 sequenceLabel:'依序聽這些金額',slowLabel:'慢速聽這些金額',
 note:'金額中的 4、7、9 分別用 よん、なな、きゅう。100、1,000 先練 ひゃく、せん；10,000 是 いちまん。300／600／800 與 3,000／8,000 的音會變，請連同「えん」整組聽。',
 groups:[
  {title:'先聽幾百日圓',items:[
   item('百円','100 日圓','ひゃくえん','hyaku-en'),item('二百円','200 日圓','にひゃくえん','nihyaku-en'),
   item('三百円','300 日圓','さんびゃくえん','sanbyaku-en','特殊讀法：百變成「びゃく」'),
   item('四百円','400 日圓','よんひゃくえん','yonhyaku-en'),item('五百円','500 日圓','ごひゃくえん','gohyaku-en'),
   item('六百円','600 日圓','ろっぴゃくえん','roppyaku-en','特殊讀法：ろっぴゃく；小「っ」停一拍'),
   item('七百円','700 日圓','ななひゃくえん','nanahyaku-en'),
   item('八百円','800 日圓','はっぴゃくえん','happyaku-en','特殊讀法：はっぴゃく；小「っ」停一拍'),
   item('九百円','900 日圓','きゅうひゃくえん','kyuuhyaku-en')
  ]},
  {title:'再聽幾千日圓',items:[
   item('千円','1,000 日圓','せんえん','sen-en'),item('二千円','2,000 日圓','にせんえん','nisen-en'),
   item('三千円','3,000 日圓','さんぜんえん','sanzen-en','特殊讀法：千變成「ぜん」'),
   item('四千円','4,000 日圓','よんせんえん','yonsen-en'),item('五千円','5,000 日圓','ごせんえん','gosen-en'),
   item('六千円','6,000 日圓','ろくせんえん','rokusen-en'),item('七千円','7,000 日圓','ななせんえん','nanasen-en'),
   item('八千円','8,000 日圓','はっせんえん','hassen-en','特殊讀法：はっせん；小「っ」停一拍'),
   item('九千円','9,000 日圓','きゅうせんえん','kyuusen-en')
  ]},
  {title:'把千和百合起來；再認識一萬',items:[
   item('千五百円','1,500 日圓','せんごひゃくえん','sengohyaku-en'),
   item('三千八百円','3,800 日圓','さんぜんはっぴゃくえん','sanzenhappyaku-en','兩處變音：さんぜん＋はっぴゃく'),
   item('一万円','10,000 日圓','いちまんえん','ichiman-en')
  ]}
 ]
};
module.exports={quantity,price};
