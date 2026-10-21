// Regression contract for the requested Day 2 deletions and Day 7 task merges.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const curriculum=require('./assets/micro-curriculum.cjs'),output=path.resolve('tmp/day2-day7-revision');
const normalize=s=>String(s).replace(/[’‘]/g,"'").toLowerCase(),unique=xs=>[...new Set(xs)],sorted=xs=>unique(xs).sort();
const main=(d,r)=>d.flows[r.flowIds[0]].steps;
const variations=r=>[r.variation,...(r.additionalVariations||[])].filter(Boolean);
const steps=(d,r)=>[...r.flowIds.flatMap(i=>d.flows[i].steps),...variations(r).flatMap(v=>v.steps)];
const exchange=s=>JSON.stringify([s.answer,s.answerZh,s.line,s.zh,s.askFirst]);
const oldKey=day=>`travel-lab-en-day${day}-${day===2?'merged':'micro'}-v1`;
const frozen=(day,kind)=>{const file=path.resolve(`tmp/day2-day7-before/day${day}-${kind}.json`);return !process.argv.includes('--without-snapshots')&&fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;};
const before=day=>{const snapshot=frozen(day,'separate');if(snapshot)return snapshot;const base=day===2?require('./assets/day2-expanded.cjs'):require('./assets/curriculum-rounds.cjs').make(day);return curriculum.compile(base,require(`./assets/micro-days-${day===2?'2-6':'7-10'}.cjs`)[day](base));};
const mappings={2:[['A','F'],['G','H'],['E']],7:[['A','B','C'],['D'],['E','F','G'],['H']]};
function contract(day){
 const d=curriculum.make(day),old=before(day),groups=mappings[day],kept=groups.flat();
 assert.equal(d.course.id,`travel-lab-en-day${day}-merged-v${day===2?2:1}`);
 assert.deepEqual(d.rounds.map(r=>r.sourceIds),groups,'Exact requested source membership and order');
 assert.deepEqual(d.rounds.map(r=>r.displayLabel),groups.map((_,i)=>String.fromCharCode(65+i)));
 assert.equal(d.course.taskGroups,undefined,'No extra chapter/subtask layer');
 assert.equal(d.course.mergedTasks,true);assert.deepEqual(d.course.legacyKeys,[]);
 assert(unique([d.previousFocusKey,d.previousLesson.key,...d.previousLesson.legacyKeys]).includes(oldKey(day)),'Previous active version remains readable');
 for(const [i,ids]of groups.entries()){
  const r=d.rounds[i],sources=ids.map(id=>old.rounds.find(x=>x.id===id));assert(sources.every(Boolean));
  assert.deepEqual(main(d,r).map(exchange),unique(sources.flatMap(x=>main(old,x)).map(exchange)),'Keep original primary exchanges in source order');
  const wanted=sources.flatMap(x=>steps(old,x)),actual=steps(d,r);
  assert.deepEqual(sorted(actual.map(exchange)),sorted(wanted.map(exchange)),'All original main/variation language survives exactly');
  assert.deepEqual(sorted(r.phraseIds.map(id=>d.phrases.find(p=>p.id===id).en)),sorted(sources.flatMap(x=>x.phraseIds.map(id=>old.phrases.find(p=>p.id===id).en))));
  const boundaries=main(d,r).filter((s,j,all)=>!j||s.sourceTaskId!==all[j-1].sourceTaskId);
  if(ids.length>1){
   assert.deepEqual(boundaries.map(s=>s.sourceTaskId),ids);
   assert(boundaries.every(s=>s.sceneTitle&&s.sceneContext&&s.role),'Every change of situation has a title, context and partner');
   assert.equal(new Set(boundaries.map(s=>s.sceneContext)).size,ids.length,'Conflicting size/color situations must have separate context');
  }
  for(const field of ['checkpoint','home'])assert.equal(r[field].answer,main(d,r).map(s=>s.answer).join(' '));
  assert.deepEqual(sorted((r.home.quizzes||[r.home.quiz]).map(q=>JSON.stringify([q.line,q.zh]))),sorted(sources.flatMap(x=>x.home.quizzes||[x.home.quiz]).map(q=>JSON.stringify([q.line,q.zh]))));
 }
 const retained=old.rounds.filter(r=>kept.includes(r.id)).flatMap(r=>steps(old,r));
 const removed=old.rounds.filter(r=>!kept.includes(r.id)).flatMap(r=>steps(old,r));
 const forbidden=sorted(removed.map(s=>s.answer)).filter(s=>!retained.some(x=>normalize(x.answer)===normalize(s)));
 if(day===2){
  assert(forbidden.includes('Do you have this in medium?')&&forbidden.includes('Can I try it on?'));
  const active={...d};delete active.previousLesson;
  const text=normalize(JSON.stringify(active));
  for(const sentence of forbidden)assert(!text.includes(normalize(sentence)),'Removed sentence leaked into active data/original phrase bank: '+sentence);
  assert(!d.rounds.some(r=>r.name==='找到想要的衣服'));
 }else assert(d.phrases.some(p=>p.en==='Do you have this in medium?'),'Day 7 retains the size request');
 return {d,forbidden};
}
async function browserCheck(browser,day){
 const {d,forbidden}=contract(day),prior=oldKey(day),old=frozen(day,'current')||{rounds:(day===2?['AF','BD','GH','CE']:Array.from('ABCDEFGH')).map(id=>({id}))};
 const answers={before:'原版課前紀錄',after:'原版課後紀錄',home:'原版課後作業'};
 for(const r of old.rounds)for(const kind of ['before','after','home'])answers[kind+'-'+r.id]=`舊題 ${kind}/${r.id} Do you have this in medium?`;
 const saved=JSON.stringify({answers,checks:{old:[true]},ratings:{old:3},complete:['old'],home:{listen:true},taskHome:Object.fromEntries(old.rounds.map(r=>[r.id,{listen:true,spoken:true}]))});
 const roundSaved=JSON.stringify({round:old.rounds.length-1,done:old.rounds.map(r=>r.id),reviewMode:'mixed',reviewIds:old.rounds.map(r=>r.id)});
 const seed={[prior]:saved,[prior+'-rounds']:roundSaved},context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.addInitScript(values=>{if(!localStorage.getItem('qa-day2-day7')){for(const [k,v]of Object.entries(values))localStorage.setItem(k,v);localStorage.setItem('qa-day2-day7','seeded');}},seed);
  await p.goto(pathToFileURL(path.resolve(d.file||'travel-english-unit2-shopping.html')).href);
  assert.equal(await p.evaluate(()=>course.id),d.course.id,'Test rebuilt HTML');
  assert.deepEqual(await p.evaluate(()=>rounds.map(r=>[r.id,r.sourceIds])),d.rounds.map(r=>[r.id,r.sourceIds]));
  const clean=async()=>{
   const s=await p.evaluate(()=>({answers:state.answers,checks:state.checks,ratings:state.ratings,complete:state.complete,taskHome:state.taskHome,done:roundsDone,reviewMode,round:taskRound}));
   assert(Object.values(s.answers).every(v=>!v),'Old answers must not fill any new answer field');
   assert(Object.values(s.checks).flat().every(v=>v===false));assert(Object.values(s.ratings).every(v=>v===0));assert.deepEqual(s.complete,[]);assert(Object.values(s.taskHome||{}).every(v=>!v.listen&&!v.spoken));assert.deepEqual(s.done,[]);
   assert.equal(s.reviewMode,'current');
  };
  await clean();assert.equal(await p.evaluate(()=>taskRound),0,'Old selected task does not select a new task');
  let rendered=0;
  for(let i=0;i<d.rounds.length;i++)for(let part=0;part<7;part++){
   await p.evaluate(({i,part})=>{setTaskRound(i);page=part;render();document.querySelectorAll('#main details:not(.old-records),#main details.teacher details').forEach(e=>e.open=true);},{i,part});
   const copy=await p.evaluate(()=>{const e=document.querySelector('#main').cloneNode(true);e.querySelectorAll('.old-records,textarea,input').forEach(n=>n.remove());return e.textContent;});
   for(const sentence of forbidden)assert(!normalize(copy).includes(normalize(sentence)),`Day ${day}/${i}/${part}: deleted statement resurfaced: ${sentence}`);
   assert(!/任務\s+[A-Z]\s*[＋+]\s*[A-Z]/.test(copy),'No combined display labels');
   if(part===4){
    assert.equal(await p.locator('details.teacher[open]').count(),1,'Teacher guidance is inspected expanded');
    if(d.rounds[i].sourceIds.length>1){
     const expected=main(d,d.rounds[i]).filter(s=>s.sceneTitle||s.sceneContext).map(s=>s.sceneTitle);
     assert.deepEqual(await p.locator('details.teacher .merged-scene-heading h3').allTextContents(),expected,'Teacher dialogue displays scene boundaries');
    }
   }
   if(i===0&&part===4)for(const theme of ['light','dark']){
    await p.evaluate(value=>{document.documentElement.dataset.theme=value;appearance();},theme);
    await p.locator('details.teacher > summary').scrollIntoViewIfNeeded();
    await p.screenshot({path:path.join(output,`day${day}-teacher-${theme}-mobile.png`)});
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile page overflows');
   }
   rendered++;
  }
  await p.evaluate(()=>{page=5;render();document.querySelector('.old-records').open=true;});
  assert((await p.locator('.old-records').innerText()).includes('原版課前紀錄'),'Old version answers remain accessible in history');
  await p.reload();await clean();
  for(const [key,value]of Object.entries(seed))assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),value,'Old storage preserved byte-for-byte');
  assert.deepEqual(errors,[]);
  return {day,status:'passed',tasks:d.rounds.length,removedSentences:forbidden,renderedViews:rendered,legacyKey:prior};
 }finally{await context.close();}
}
(async()=>{
 fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),reports=[];
 try{for(const day of [2,7]){try{reports.push(await browserCheck(browser,day));console.log(`PASS Day ${day}: deletions/retained language, task order, scene context, old records and mobile teacher views`);}catch(e){reports.push({day,status:'failed',error:String(e.stack||e)});console.error(e.stack||e);process.exitCode=1;}}}
 finally{fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(reports,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
