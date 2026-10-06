// Collect authored counterpart speech; teacher guidance is not a translation.
const teacherTranslations={
 'Go straight to the second intersection. Turn left.':'直走到第二個路口，再左轉。',
 'Yes, left.':'對，左邊。',
 'Yes. It’s a ten-minute walk.':'可以，走路要 10 分鐘。',
 'Go straight to the first intersection. Turn right.':'直走到第一個路口，再右轉。',
 'Yes, right.':'對，右邊。',
 'Yes. It’s a five-minute walk.':'可以，走路要 5 分鐘。',
 'Go straight to the second intersection. Turn right.':'直走到第二個路口，再右轉。',
 'Turn right at the second intersection.':'在第二個路口右轉。',
 'Here is the post office.':'郵局在這裡。',
 'It’s a twenty-minute walk.':'走路要 20 分鐘。',
 'Yes. The bus stop is over there.':'可以，公車站在那邊。',
 'Turn right at the first intersection.':'在第一個路口右轉。',
 'The first intersection. Turn right.':'第一個路口，右轉。',
 'Here is the police station.':'警局在這裡。',
 'It’s a twenty-five-minute walk.':'走路要 25 分鐘。',
 'Yes, you can take a bus.':'可以，你可以搭公車。',
 'Turn left at the first corner.':'在第一個街角左轉。',
 'Which way is the bank?':'銀行要往哪個方向走？',
 'Go straight for two blocks. Then turn right.':'直走兩個街區，再右轉。',
 'How far do we go straight?':'我們要直走多遠？',
 'It’s six dollars.':'6 美元。',
 'It’s two dollars.':'2 美元。',
 'Cash or card?':'付現金還是刷卡？',
 'What size would you like?':'你想要什麼尺寸？',
 'We have black or green, but not blue.':'我們有黑色或綠色，沒有藍色。',
 'Of course.':'當然可以。',
 'The mug is twelve dollars.':'這個杯子 12 美元。',
 'This magnet is four dollars. This postcard is two dollars.':'這個磁鐵 4 美元，這張明信片 2 美元。',
 'No problem. Thank you!':'沒問題，謝謝你！',
 'Six dollars in total. Cash only, please.':'總共 6 美元，只收現金。',
 'Four dollars in total. Cash only, please.':'總共 4 美元，只收現金。'
};
const key=text=>text.replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const translations=new Map(Object.entries(teacherTranslations).map(([en,zh])=>[key(en),zh]));
function addListeningPreview(d){
 const day=d.course.day;
 for(const [ri,r] of d.rounds.entries()){
  const lines=new Map();
  const add=(en,zh,source)=>{if(!en)return;if(!zh)throw Error(`Missing translation: Day ${day} ${en}`);const k=key(en);if(!lines.has(k))lines.set(k,{en,zh,sources:[]});if(!lines.get(k).sources.includes(source))lines.get(k).sources.push(source);};
  for(const p of r.hearLines||[])add(p.en,p.zh,'跟著做');
  for(const fi of r.flowIds||[ri])for(const t of d.flows[fi].steps){add(t.line,t.zh,'跟著做');for(const branch of Object.values(t.when?.cases||{}))add(branch.line||t.line,branch.zh||t.zh,'跟著做');}
  for(const id of [...r.replyIds,...r.extraReplyIds||[]]){const q=d.replies[id];add(q.line||q.en,q.zh,'聽與接話');}
  for(const id of r.hearPhraseIds||[]){const p=d.phrases.find(p=>p.id===id);add(p.en,p.zh,'方向練習');}
  for(const id of r.pairIds){const p=d.pairs[id];
   for(const [,en,zh] of p.cards){const translated=[1,2].includes(day)?translations.get(key(en)):zh;if(!translated)throw Error('Teacher cue needs a translation: '+en);add(en,translated,'真人練習');}
   if(p.start&&!lines.has(key(p.start)))add(p.start,p.opening,'真人練習');
  }
  for(const q of d.quizzes||[]){const assigned=day===1?'A':day===2?({stock:'B',pay:'D'}[q.id]||q.id.replace('review-','')):q.id.replace('review-','');if(assigned===r.id)add(q.line||q.en,q.zh,'課後聽力');}
  r.hearLines=[...lines.values()];
 }
 return d;
}
module.exports={addListeningPreview,key};
