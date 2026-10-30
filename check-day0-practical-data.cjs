// Curriculum and audio regression checks; browser layout is checked separately.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {make}=require('./assets/micro-day0.cjs');
const prepare=require('./assets/day0-learning-build.cjs');
const glossarySource=fs.readFileSync('assets/day0-glossary.js','utf8');
// Exercise the actual glossary parser, without a DOM or a duplicated algorithm.
const parserSource=glossarySource.slice(glossarySource.indexOf(' const entries='),glossarySource.indexOf(' const panel='));
const result=[];
for(const language of ['ja','ko']){
 const d=make(language),oldKey=`travel-lab-${language}-day0-micro-v1`;
 const originalGlossary=JSON.parse(JSON.stringify(d.day0GlossaryData));
 const originalGlossaryKeys=new Set(originalGlossary.map(row=>row[0]));
 assert.equal(d.course.id,`travel-lab-${language}-day0-practical-v1`);
 assert.equal(d.previousFocusKey,oldKey);assert.equal(d.previousLesson.key,oldKey);
 assert.equal(d.course.labels.length,7);assert.equal(d.course.taskGroups.length,6);
 assert.deepEqual(d.rounds.map(r=>r.id),['A','B','C','D','E','F','G','H','I','J']);
 assert.deepEqual(d.course.taskGroups.flatMap(g=>g.roundIds),d.rounds.map(r=>r.id));
 assert.deepEqual(d.course.taskGroups.find(g=>g.id==='phone-route').roundIds,['J']);
 assert.ok(!d.course.studySupplement);assert.equal(d.practicalSupport.length,4);
 assert.equal(d.optionalTravelPhrases?.groups.reduce((n,g)=>n+g.phrases.length,0)||0,language==='ko'?16:0);
 for(const r of d.rounds){
  assert.ok(r.words.length>=2&&r.words.length<=4,r.id+': vocabulary size');
  assert.equal(r.checkpoint.task,r.home.task,r.id+': before/after prompt differs');
  assert.equal(r.checkpoint.answer,r.home.answer,r.id+': before/after answer differs');
  const shown=new Set([...r.phraseIds.map(id=>d.phrases.find(p=>p.id===id).en),...r.hearLines.map(p=>p.en),...r.variation.steps.flatMap(s=>[s.answer,s.line])]);
  for(const id of r.flowIds){
   const flow=d.flows[id];assert.ok(flow.steps.length>=1&&flow.steps.length<=2);
   for(const step of flow.steps){
    assert.ok(shown.has(step.answer)&&shown.has(step.line),r.id+': flow uses an untaught line');
    assert.notEqual(step.words,step.answer,r.id+': complete answer in first hint');
    assert.notEqual(step.words,d.readings[step.answer],r.id+': complete romanization in first hint');
    assert.equal(step.answerZh,d.practicalLexicon[step.answer].zh);
    assert.ok(step.valid.every(i=>step.objects[i]));
   }
  }
  assert.ok(shown.has(r.home.quiz.line),r.id+': homework uses an untaught response');
  for(const step of r.variation.steps){
   assert.ok(d.practicalLexicon[step.answer]?.romaji&&d.practicalLexicon[step.line]?.zh);
   assert.notEqual(step.words,d.readings[step.answer]);
  }
 }
 // Student-known needs stay visible; partner-only directions/prices do not.
 for(const id of ['A','C','H','I','J']){
  const r=d.rounds.find(r=>r.id===id),context=d.flows[r.flowIds[0]].context;
  if(id==='A')assert.doesNotMatch(context,/500|5,000|300|3,000/);
  if(id==='C')assert.doesNotMatch(context,/店員說可以刷卡|只收現金/);
  if(['H','I','J'].includes(id))assert.doesNotMatch(context,/右邊|左邊|往右|往左|直走/);
 }
 const payment=d.rounds.find(r=>r.id==='C');
 assert.equal(payment.variationMode,'core');assert.equal(payment.flowIds.length,2);
 assert.match(d.flows[payment.flowIds[0]].steps[1].answerZh,/刷卡/);
 assert.match(d.flows[payment.flowIds[1]].steps[1].answerZh,/現金/);
 assert.doesNotMatch(d.flows[payment.flowIds[1]].context,/只收現金/);
 const route=d.rounds.find(r=>r.id==='J');
 assert.match(d.practicalLexicon[d.flows[route.flowIds[0]].steps[0].line].zh,/直走.*左/);
 assert.match(d.practicalLexicon[route.variation.steps[0].line].zh,/直走.*右/);

 prepare(d); // Includes manifest translation coverage and file SHA checks.
 let cueCount=0;
 for(const text of Object.keys(d.day0Audio)){
  assert.ok(d.day0AudioTranslations[text],language+': missing audio meaning '+text);
  const cues=d.day0Timings[text];assert.ok(cues.length);
  let end=-Infinity,to=0;
  for(const cue of cues){
   assert.equal(text.slice(cue.from,cue.to),cue.text,language+': cue text offsets '+text);
   assert.ok(cue.start>=end&&cue.end>cue.start,language+': overlapping/empty cue '+text);
   assert.ok(cue.from>=to&&cue.to<=text.length,language+': invalid cue range '+text);
   assert.ok(cue.romaji,language+': missing cue reading '+text);
   end=cue.end;to=cue.to;cueCount++;
  }
 }
 for(const [text,label]of d.numberWords)assert.equal(d.day0AudioTranslations[text],label,language+': primer overwrote number meaning '+text);
 if(language==='ja'){
  assert.equal(d.day0Timings['は'][0].romaji,'ha');
  assert.equal(d.day0Timings['これはいくらですか。'].find(c=>c.text==='は').romaji,'wa');
 }
 const parserFor=rows=>vm.runInNewContext(parserSource+'\nsegments;',{
  day0GlossaryData:rows,numberWords:d.numberWords,readings:d.readings,korean:language==='ko'
 });
 const priorSegments=parserFor(originalGlossary),newSegments=parserFor(d.day0GlossaryData);
 const samples=language==='ja'?['これはいくらですか。','カードで払えますか。','すみません。']:['이거 얼마예요?','카드로 계산할 수 있어요?','저기요.'];
 for(const text of samples)assert.equal(JSON.stringify(newSegments(text).map(x=>x.entry.text)),JSON.stringify(priorSegments(text).map(x=>x.entry.text)),language+': sentence/primer entry stole word segmentation '+text);
 const taskWords=new Set(d.rounds.flatMap(r=>r.words.map(([text])=>text)));
 for(const [text]of d.day0GlossaryData)if(!originalGlossaryKeys.has(text))assert.ok(taskWords.has(text),language+': glossary contains a new non-task-word '+text);
 result.push({language,tasks:d.rounds.length,chapters:d.course.taskGroups.length,audio:Object.keys(d.day0Audio).length,cues:cueCount});
}
console.log('PASS: practical curriculum, taught variations, short hints, listening context, audio cues, number meanings and word glossary.');
console.log(JSON.stringify(result));
