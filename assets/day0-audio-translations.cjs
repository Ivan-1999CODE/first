// Reuse the lesson's authored meanings for the complete line above its audio cards.
module.exports=function audioTranslations(lesson,audioTexts){
 const translations={};
 const add=(text,meaning)=>{if(text&&meaning&&!Object.hasOwn(translations,text))translations[text]=meaning;};
 // Main phrase cards take precedence so their repeated meaning stays identical.
 for(const p of lesson.phrases)add(p.en,p.zh);
 for(const [text,meaning] of Object.entries(lesson.answerTranslations))add(text,meaning);
 for(const p of lesson.rounds.flatMap(r=>r.hearLines))add(p.en,p.zh);
 for(const p of [...lesson.replies,...lesson.quizzes,...lesson.flows.flatMap(f=>f.steps)])add(p.line,p.zh);
 for(const [text,meaning] of lesson.rounds.flatMap(r=>r.words))add(text,meaning);
 for(const [text,,meaning] of lesson.vocabulary)add(text,meaning);
 for(const [text,meaning] of lesson.numberWords)add(text,meaning);
 for(const p of [...lesson.courtesy,...lesson.support])add(p.en,p.zh);
 // Audio-only variants not stored as an independent card in the current tasks.
 for(const [text,meaning] of Object.entries({
  'コンビニはどこですか。':'便利商店在哪裡？',
  'トイレはどこですか。':'廁所在哪裡？',
  '駅です。':'是車站。',
  '右ですね。':'是右邊，對吧？',
  '左ですね。':'是左邊，對吧？',
  'まっすぐ行ってください。':'請直走。',
  '千円です。':'1,000 日圓。',
  '二つですね。':'兩個，對吧？',
  '全部で':'全部合計；總共'
 }))add(text,meaning);
 for(const text of audioTexts){
  if(translations[text])continue;
  const sentences=text.match(/[^。！？]+[。！？]?/g)||[];
  if(!sentences.length||sentences.some(sentence=>!translations[sentence]))throw Error('Missing Japanese audio translation: '+text);
  translations[text]=sentences.map(sentence=>{
   const meaning=translations[sentence];return /[。！？!?]$/.test(meaning)?meaning:meaning+'。';
  }).join('');
 }
 return translations;
};
