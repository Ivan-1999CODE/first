// Authored Korean for the Day 0 tasks. Romanization follows Revised Romanization;
// it is a reading aid, while the recorded Korean remains the pronunciation model.
const lines = [
 ['駅はどこですか。','지하철역은 어디예요?','Jihacheoryeogeun eodiyeyo?','地鐵站在哪裡？'],
 ['コンビニはどこですか。','편의점은 어디예요?','Pyeonuijeomeun eodiyeyo?','便利商店在哪裡？'],
 ['トイレはどこですか。','화장실은 어디예요?','Hwajangsireun eodiyeyo?','廁所在哪裡？'],
 ['もう一度お願いします。','다시 한 번 말해 주세요.','Dasi han beon malhae juseyo.','請再說一次。'],
 ['歩いて行けますか。','걸어서 갈 수 있어요?','Georeoseo gal su isseoyo?','可以走路去嗎？'],
 ['すみません。','저기요.','Jeogiyo.','不好意思（叫住對方）。'],
 ['ありがとうございます。','감사합니다.','Gamsahamnida.','謝謝您。'],
 ['ゆっくりお願いします。','천천히 말해 주세요.','Cheoncheonhi malhae juseyo.','請說慢一點。'],
 ['これはいくらですか。','이거 얼마예요?','Igeo eolmayeyo?','這個多少錢？'],
 ['これをください。','이거 주세요.','Igeo juseyo.','我要這個。'],
 ['これを一つください。','이거 한 개 주세요.','Igeo han gae juseyo.','這個我要一個。'],
 ['これを二つください。','이거 두 개 주세요.','Igeo du gae juseyo.','這個我要兩個。'],
 ['全部でいくらですか。','다 해서 얼마예요?','Da haeseo eolmayeyo?','總共多少錢？'],
 ['カードで払えますか。','카드로 계산할 수 있어요?','Kadeuro gyesanhal su isseoyo?','可以刷卡嗎？'],
 ['現金で払います。','현금으로 할게요.','Hyeongeumeuro halgeyo.','我付現金。'],
 ['袋は要りません。','봉투는 괜찮아요.','Bongtuneun gwaenchanayo.','袋子不用了。'],
 ['はい、お願いします。','네, 주세요.','Ne, juseyo.','好，請給我。'],
 ['左に曲がってください。','왼쪽으로 가세요.','Oenjjogeuro gaseyo.','請往左走。'],
 ['右に曲がってください。','오른쪽으로 가세요.','Oreunjjogeuro gaseyo.','請往右走。'],
 ['まっすぐ行ってください。','쭉 가세요.','Jjuk gaseyo.','請直走。'],
 ['はい。歩いて五分です。','네. 걸어서 오 분 걸려요.','Ne. Georeoseo o bun geollyeoyo.','可以，走路要 5 分鐘。'],
 ['はい。歩いて十分です。','네. 걸어서 십 분 걸려요.','Ne. Georeoseo sip bun geollyeoyo.','可以，走路要 10 分鐘。'],
 ['どういたしまして。','아니에요.','Anieyo.','不客氣。'],
 ['駅ですか。','지하철역이요?','Jihacheoryeogiyo?','您說地鐵站嗎？'],
 ['はい。','네.','Ne.','是的；好的；可以。'],
 ['駅です。','지하철역이요.','Jihacheoryeogiyo.','是地鐵站。'],
 ['コンビニです。','편의점이요.','Pyeonuijeomiyo.','是便利商店。'],
 ['左ですね。','왼쪽이요?','Oenjjogiyo?','是左邊嗎？'],
 ['右ですね。','오른쪽이요?','Oreunjjogiyo?','是右邊嗎？'],
 ['五百円です。','오천 원이에요.','Ocheon wonieyo.','5,000 韓元。'],
 ['三百円です。','삼천 원이에요.','Samcheon wonieyo.','3,000 韓元。'],
 ['千円です。','만 원이에요.','Man wonieyo.','10,000 韓元。'],
 ['いくつですか。','몇 개 드릴까요?','Myeot gae deurilkkayo?','要給您幾個呢？'],
 ['全部で千円です。','다 해서 만 원이에요.','Da haeseo man wonieyo.','總共 10,000 韓元。'],
 ['カードは使えます。','카드 돼요.','Kadeu dwaeyo.','可以刷卡。'],
 ['現金のみです。','현금만 돼요.','Hyeongeumman dwaeyo.','只收現金。'],
 ['袋は要りますか。','봉투 필요하세요?','Bongtu piryohaseyo?','需要袋子嗎？'],
 ['二つですね。','두 개 맞으세요?','Du gae majeuseyo?','是兩個，對嗎？'],
 ['はい、どうぞ。','네, 여기요.','Ne, yeogiyo.','好的，給您。']
];
const words = [
 ['駅','지하철역','jihacheoryeok','地鐵站'],['コンビニ','편의점','pyeonuijeom','便利商店'],['トイレ','화장실','hwajangsil','廁所'],
 ['左','왼쪽','oenjjok','左邊'],['右','오른쪽','oreunjjok','右邊'],['まっすぐ','쭉','jjuk','直直地；直走'],
 ['五分','오 분','o bun','5 分鐘'],['十分','십 분','sip bun','10 分鐘'],['ゆっくり','천천히','cheoncheonhi','慢慢地；慢一點'],
 ['左に曲がる','왼쪽으로 가다','oenjjogeuro gada','往左走'],['右に曲がる','오른쪽으로 가다','oreunjjogeuro gada','往右走'],
 ['これ','이거','igeo','這個（靠近自己）'],['それ','그거','geugeo','那個（靠近對方）'],['これら','이것들','igeotdeul','這些'],['それら','그것들','geugeotdeul','那些'],
 ['三百円','삼천 원','samcheon won','3,000 韓元'],['五百円','오천 원','ocheon won','5,000 韓元'],['千円','만 원','man won','10,000 韓元'],
 ['一つ','한 개','han gae','一個'],['二つ','두 개','du gae','兩個'],['カード','카드','kadeu','付款卡片'],['現金','현금','hyeongeum','現金'],['袋','봉투','bongtu','袋子'],
 ['全部で','다 해서','da haeseo','總共'],['すみません','저기요','jeogiyo','不好意思（叫住對方）'],['ありがとう','감사합니다','gamsahamnida','謝謝您'],
 ['どこ','어디','eodi','哪裡'],['もう一度','다시 한 번','dasi han beon','再一次'],['歩いて','걸어서','georeoseo','走路；步行']
];
const numbers=[['일','1 · 一','il'],['이','2 · 二','i'],['삼','3 · 三','sam'],['사','4 · 四','sa'],['오','5 · 五','o'],['육','6 · 六','yuk'],['칠','7 · 七','chil'],['팔','8 · 八','pal'],['구','9 · 九','gu'],['십','10 · 十','sip']];
// Glossary entries are meaningful Korean units, independent of TTS word boundaries.
const units=[
 ['저기요','jeogiyo','不好意思；借問一下','用來叫住路人或店員，不是道歉用語。'],
 ['감사합니다','gamsahamnida','謝謝您','適合向陌生人或店員道謝的禮貌說法。'],
 ['아니에요','anieyo','不客氣','本課用來回應道謝；在其他情境也可表示「不是」。'],
 ['지하철역은','jihacheoryeogeun','地鐵站呢／地鐵站……','지하철역 是地鐵站；은 標示正在談的主題。'],
 ['편의점은','pyeonuijeomeun','便利商店……','편의점 是便利商店；은 標示主題。'],
 ['화장실은','hwajangsireun','廁所……','화장실 是廁所；은 標示主題。'],
 ['어디예요','eodiyeyo','在哪裡？','用來禮貌地詢問位置。'],
 ['다시 한 번','dasi han beon','再一次','請對方重說時，與 말해 주세요 一起使用。'],
 ['말해 주세요','malhae juseyo','請說','천천히 말해 주세요 是「請說慢一點」。'],
 ['갈 수 있어요','gal su isseoyo','可以去／能到達','句尾上揚時用來詢問能不能去。'],
 ['주세요','juseyo','請給我','點選商品時可說 이거 주세요（請給我這個）。'],
 ['얼마예요','eolmayeyo','多少錢？'],
 ['카드로','kadeuro','用卡片','로 表示使用的方法。'],
 ['계산할 수 있어요','gyesanhal su isseoyo','可以結帳／付款','接在 카드로 後詢問能否刷卡。'],
 ['현금으로','hyeongeumeuro','用現金'],['할게요','halgeyo','我會……；我決定……','현금으로 할게요 是「我付現金」。'],
 ['봉투는','bongtuneun','袋子……'],['괜찮아요','gwaenchanayo','不用了；沒關係','本課用於婉拒袋子。其他情境也可表示「還好／可以」。'],
 ['네','ne','是的；好的；可以'],['왼쪽으로','oenjjogeuro','往左邊'],['오른쪽으로','oreunjjogeuro','往右邊'],['가세요','gaseyo','請走；請去'],
 ['가다','gada','去；走'],['걸려요','geollyeoyo','需要花……時間'],
 ['지하철역이요','jihacheoryeogiyo','地鐵站','可簡短說明目的地；疑問語調用來確認。'],['편의점이요','pyeonuijeomiyo','便利商店','這裡用來更正目的地。'],
 ['왼쪽이요','oenjjogiyo','左邊嗎？','本課用於確認方向。'],['오른쪽이요','oreunjjogiyo','右邊嗎？','本課用於確認方向。'],
 ['오천','ocheon','五千'],['삼천','samcheon','三千'],['만','man','一萬'],['원이에요','wonieyo','是……韓元','接在金額後面報價。'],['원','won','韓元'],
 ['몇 개','myeot gae','幾個','詢問數量；몇 的尾音接 개 時，請以音檔跟讀。'],['드릴까요','deurilkkayo','要給您……嗎？','店員用來禮貌詢問顧客。'],
 ['돼요','dwaeyo','可以'],['현금만','hyeongeumman','只有現金','만 是「只有」；현금만 돼요 表示只收現金。'],
 ['필요하세요','piryohaseyo','您需要嗎？'],['맞으세요','majeuseyo','對嗎？','這裡由店員確認數量。'],['여기요','yeogiyo','這裡；給您','本課用於店員遞交商品。']
];
const glossary=[...units,...words.map(([,ko,rom,zh])=>[ko,rom,zh]),...numbers.map(([ko,zh,rom])=>[ko,rom,'數字 '+zh])];
const readings=Object.fromEntries([...lines,...words].map(([,ko,rom])=>[ko,rom]).concat(numbers.map(([ko,,rom])=>[ko,rom]),units.map(([ko,rom])=>[ko,rom])));
const meanings=Object.fromEntries([...lines,...words].map(([,ko,,zh])=>[ko,zh]).concat(numbers.map(([ko,zh])=>[ko,zh]),units.map(([ko,,zh])=>[ko,zh])));
// A cue may be just one space-delimited word from a multiword glossary entry.
const cueReadings={...readings};
for(const [ko,rom] of Object.entries(readings)){
 const ks=ko.replace(/[.,!?]/g,'').split(/\s+/),rs=rom.replace(/[.,!?]/g,'').toLowerCase().split(/\s+/);
 if(ks.length===rs.length)ks.forEach((word,i)=>{if(!cueReadings[word])cueReadings[word]=rs[i];});
}
module.exports={lines,words,numbers,glossary,readings,meanings,cueReadings};
