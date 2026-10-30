// Optional script-and-sound primer. No lesson records or completion gates.
const kanaRows = [
 ['a','あ行','あいうえお',['a','i','u','e','o']],
 ['ka','か行','かきくけこ',['ka','ki','ku','ke','ko']],
 ['sa','さ行','さしすせそ',['sa','shi','su','se','so']],
 ['ta','た行','たちつてと',['ta','chi','tsu','te','to']],
 ['na','な行','なにぬねの',['na','ni','nu','ne','no']],
 ['ha','は行','はひふへほ',['ha','hi','fu','he','ho']],
 ['ma','ま行','まみむめも',['ma','mi','mu','me','mo']],
 ['ya','や行','やゆよ',['ya','yu','yo']],
 ['ra','ら行','らりるれろ',['ra','ri','ru','re','ro']],
 ['wa','わ行','わを',['wa','o']],
 ['n','ん','ん',['n']]
];
const kata = text => Array.from(text, c => String.fromCharCode(c.charCodeAt(0) + 0x60)).join('');
const entry = (text, zh, romaji, extra = {}) => ({text, speakText:text, zh, romaji, ...extra});
function japanese(){
 const groups=[];
 for(const category of ['hiragana','katakana'])for(const [id,title,characters,readings] of kanaRows){
  const isKata=category==='katakana';
  groups.push({id:category+'-'+id,category,title:isKata?kata(title.replace('行',''))+(title.endsWith('行')?'行':''):title,
   description:id==='a'?'先聽這 5 個母音，再一個一個跟著說。每個字都是一拍。':id==='ya'?'這一行有 3 個基本假名，先看大字的 や、ゆ、よ。':id==='wa'?'わ 讀 wa；を 作助詞時讀 o，和 お 的聲音相同。':id==='n'?'ん 自己占一拍；聲音會受後面的音影響，先跟著音檔認識它。':'一次練這一行就好：點字聽，再用整行連播跟讀。',
   sequence:true,items:Array.from(characters,(h,i)=>entry(isKata?kata(h):h,'讀音 '+readings[i],readings[i],{kana:h,speakText:h==='を'?'お':['は','へ'].includes(h)?kata(h):h,note:h==='を'?'這裡示範助詞讀音 o。':h==='ん'?'鼻音；自己占一拍。':''}))});
 }
 groups.push({id:'ja-familiar',category:'use',title:'旅行裡看得見',description:'先聽熟悉的詞，再把聲音對回文字。平假名和片假名都會在旅行中出現。',sequence:true,items:[
  entry('トイレ','廁所','toire',{kana:'といれ',note:'ト・イ・レ：3 拍。'}),
  entry('ホテル','飯店','hoteru',{kana:'ほてる',note:'ホ・テ・ル：3 拍。'}),
  entry('コンビニ','便利商店','konbini',{kana:'こんびに',note:'ン 也占一拍；ビ 是帶濁點的假名。'})
 ]});
 groups.push({id:'ja-rhythm',category:'use',title:'長音與小字',description:'先認識 3 個常見現象，不必一次背完所有變化。聽完後，跟著節奏再說一次。',sequence:false,items:[
  entry('カード','卡片／付款卡','kādo',{kana:'かあど',note:'長音：ー 讓前面的 a 再長一拍，カ・ー・ド。'}),
  entry('まっすぐ','直走／直直地','massugu',{kana:'まっすぐ',note:'促音：小 っ 停一拍，不念成大 つ。'}),
  entry('きゅう','數字 9','kyū',{kana:'きゅう',note:'拗音：き＋小 ゅ 合成 kyu；再加 う 拉長，合計 2 拍。'})
 ]});
 return {language:'ja',title:'日文五十音與發音',description:'完整基本平假名 46 字與片假名 46 字，每次只看一行。先聽、再認字，隨時可以開始旅行對話。',categories:[{id:'hiragana',title:'平假名 46 字'},{id:'katakana',title:'片假名 46 字'},{id:'use',title:'旅行裡的字音'}],groups};
}
function korean(){
 const vowels=[['ㅏ','아','a'],['ㅑ','야','ya'],['ㅓ','어','eo'],['ㅕ','여','yeo'],['ㅗ','오','o'],['ㅛ','요','yo'],['ㅜ','우','u'],['ㅠ','유','yu'],['ㅡ','으','eu'],['ㅣ','이','i']];
 const consonants=[['ㄱ','가','ga'],['ㄴ','나','na'],['ㄷ','다','da'],['ㄹ','라','ra'],['ㅁ','마','ma'],['ㅂ','바','ba'],['ㅅ','사','sa'],['ㅇ','아','a'],['ㅈ','자','ja'],['ㅊ','차','cha'],['ㅋ','카','ka'],['ㅌ','타','ta'],['ㅍ','파','pa'],['ㅎ','하','ha']];
 const groups=[];
 for(let i=0;i<2;i++)groups.push({id:'ko-vowels-'+(i+1),category:'vowels',title:'基本母音 '+(i+1),description:'母音先和不發音的字首 ㅇ 組成一格。點聽的是完整音節示範；羅馬字只幫忙對照，以音檔為準。',sequence:true,items:vowels.slice(i*5,i*5+5).map(([letter,sound,romaji])=>entry(letter,'母音 '+letter+' 的拼讀示範：'+sound,romaji,{speakText:sound,sampleLabel:'拼讀示範',note:letter==='ㅓ'?'eo 是一個母音，不是 e、o 兩個音。':letter==='ㅡ'?'eu 是一個母音，不是 e、u 兩個音。':'先聽，再跟著發音。'}))});
 for(let i=0;i<2;i++)groups.push({id:'ko-consonants-'+(i+1),category:'consonants',title:'基本子音 '+(i+1),description:'每個子音搭配母音 ㅏ，聽它拼成音節後的聲音。這裡讀的是拼讀示範，不是字母名稱。',sequence:true,items:consonants.slice(i*7,i*7+7).map(([letter,sound,romaji])=>entry(letter,'子音 '+letter+' 搭配 ㅏ：'+sound,romaji,{speakText:sound,sampleLabel:'拼讀示範',note:letter==='ㅇ'?'在音節開頭，ㅇ 不發音；아 只聽到母音 a。':letter==='ㄹ'?'這裡聽字首的 라；收音位置的 ㄹ 會有不同表現。':letter==='ㅋ'||letter==='ㅌ'||letter==='ㅍ'||letter==='ㅊ'?'留意較明顯的送氣，跟著音檔模仿。':'先聽完整音節，不把羅馬字當成英文念。'}))});
 groups.push({id:'ko-blocks',category:'build',title:'拼成一格字',description:'字母排成一格音節。直立母音放右邊，橫向母音放下方；收音放在最下方。點「拼起來看」再聽。',sequence:false,items:[
  entry('가','ㄱ＋ㅏ 拼成 가','ga',{parts:['ㄱ','ㅏ'],note:'直立母音 ㅏ 放在子音右邊。'}),
  entry('나','ㄴ＋ㅏ 拼成 나','na',{parts:['ㄴ','ㅏ'],note:'只換開頭子音，聽 ga 和 na 的差別。'}),
  entry('아','ㅇ＋ㅏ 拼成 아','a',{parts:['ㅇ','ㅏ'],note:'開頭 ㅇ 不發音，但書寫時仍需要它。'}),
  entry('무','ㅁ＋ㅜ 拼成 무','mu',{parts:['ㅁ','ㅜ'],note:'橫向母音 ㅜ 放在子音下方。'}),
  entry('물','水；ㅁ＋ㅜ＋ㄹ 拼成 물','mul',{parts:['ㅁ','ㅜ','ㄹ'],note:'收音 ㄹ 放最下方；和沒有收音的 무 比較聽。'})
 ]});
 groups.push({id:'ko-familiar',category:'build',title:'把字音帶進旅行',description:'先聽整個詞，再看它由幾格音節組成。能認出一部分也可以直接開始旅行對話。',sequence:true,items:[
  entry('물','水','mul',{note:'一格音節，結尾有收音 ㄹ。'}),
  entry('이거','這個','igeo',{note:'이・거：2 格；問價和點餐都用得到。'}),
  entry('카드','卡片／付款卡','kadeu',{note:'카・드：2 格；結尾 드 有母音 ㅡ。'}),
  entry('화장실','廁所','hwajangsil',{note:'화・장・실：3 格；화 有複合母音 ㅘ，先當熟詞聽。'})
 ]});
 return {language:'ko',title:'韓文字母與拼讀入門',description:'認識 10 個基本母音、14 個基本子音，再試著拼成音節。一次練一小組，隨時可以開始旅行對話。',categories:[{id:'vowels',title:'基本母音 10 個'},{id:'consonants',title:'基本子音 14 個'},{id:'build',title:'拼讀與旅行詞'}],groups};
}
function exercisesFor(data){
 const exercises=[];
 for(const group of data.groups){
  const pool=data.groups.filter(g=>g.category===group.category).flatMap(g=>g.items);
  const indexes=[...new Set([0,Math.floor(group.items.length/2),group.items.length-1])];
  for(const index of indexes){
   const item=group.items[index],sound=item.speakText||item.text;
   const others=[...group.items,...pool].filter(x=>x.text!==item.text&&(x.speakText||x.text)!==sound);
   const unique=[];
   for(const other of others)if(!unique.some(x=>x.text===other.text||(x.speakText||x.text)===(other.speakText||other.text)))unique.push(other);
   if(unique.length<2)continue;
   const options=[item.text,...unique.slice(0,2).map(x=>x.text)];
   const rotation=(exercises.length+1)%3;
   const rotated=options.slice(rotation).concat(options.slice(0,rotation));
   const prompt=group.category==='consonants'?'聽拼讀示範，選出開頭的子音。':group.category==='vowels'?'聽拼讀示範，選出裡面的母音。':'聽聲音，選出對應的字或詞。';
   exercises.push({id:group.id+'-'+index,groupId:group.id,prompt,text:item.text,speakText:sound,zh:item.zh,romaji:item.romaji,options:rotated,correct:rotated.indexOf(item.text),why:group.category==='consonants'?'聽到 '+sound+'（'+item.romaji+'），開頭寫 '+item.text+'。這裡練拼讀，不是字母名稱。':group.category==='vowels'?'聽到 '+sound+'（'+item.romaji+'），裡面的母音是 '+item.text+'。':'這個聲音對應「'+item.text+'」。'+(item.note||'可以再聽一次，對照文字跟讀。')});
  }
 }
 return exercises;
}
function make(language){
 if(!['ja','ko'].includes(language))throw new Error('Unsupported primer language: '+language);
 const data=language==='ko'?korean():japanese();
 data.exercises=exercisesFor(data);
 return data;
}
module.exports={make};
