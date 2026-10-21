const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url'),{createHash}=require('node:crypto');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const curriculum=require('./assets/micro-curriculum.cjs'),output=path.resolve('tmp/task-labels');
const requested=(process.argv.find(x=>x.startsWith('--only='))||'').slice(7).split(',').filter(Boolean).map(Number);
const days=requested.length?requested:Array.from({length:13},(_,i)=>i+2);
assert(days.every(n=>n>=2&&n<=14),'Choose English Days 2–14');
const sentinel='任務 A＋B 原始回答：AF、B＋C、本輪，全部保留';
const digest=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');

async function checkLesson(browser,day){
 const d=curriculum.make(day),file=path.resolve(d.file||'travel-english-unit2-shopping.html'),sha=digest(file);
 const labels=d.rounds.map((_,i)=>String.fromCharCode(65+i)),ids=d.rounds.map(r=>r.id),answers={};
 for(const r of d.rounds)for(const kind of ['before','after','home','before-alt','after-alt','home-alt'])answers[kind+'-'+r.id]=`${sentinel} / ${kind}-${r.id}`;
 for(const m of d.missions)answers['mission-'+m.id]=`${sentinel} / ${m.id}`;
 for(const pair of d.pairs)answers['note-'+pair.id]=`${sentinel} / ${pair.id}`;
 const seed={answers,checks:Object.fromEntries(d.pairs.map(p=>[p.id,p.goals.map((_,i)=>i===0)])),ratings:Object.fromEntries(d.course.skills.map((s,i)=>[s.id,i%3+1])),complete:[d.flows[0].id],home:{listen:true,written:false,spoken:true},taskHome:Object.fromEntries(ids.map((id,i)=>[id,{listen:true,spoken:i%2===0}]))};
 const roundSeed={round:0,done:ids,reviewMode:'current',reviewIds:ids.slice(0,2)},errors=[];
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const p=await context.newPage();p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));
 const report={day,tasks:ids.length,pages:0,file,sha,screenshots:[]};
 try{
  await p.addInitScript(({key,saved,roundSaved})=>{if(!localStorage.getItem('qa-task-labels-seeded')){localStorage.setItem(key,JSON.stringify(saved));localStorage.setItem(key+'-rounds',JSON.stringify(roundSaved));localStorage.setItem('qa-task-labels-seeded','yes');}},{key:d.course.id,saved:seed,roundSaved:roundSeed});
  await p.goto(pathToFileURL(file).href);
  assert.deepEqual(await p.evaluate(()=>rounds.map(r=>[r.id,r.displayLabel])),d.rounds.map(r=>[r.id,r.displayLabel]),'HTML must match the rebuilt source');
  const nav=async n=>{await p.locator(`#nav [data-page="${n}"]`).click();assert.equal(await p.evaluate(()=>page),n);};
  const select=async i=>{await nav(0);await p.locator(`.before-panel [data-before-round="${i}"]`).click();assert.equal(await p.evaluate(()=>taskRound),i);};
  const snapshot=()=>p.evaluate(()=>{
   const main=document.querySelector('#main'),copy=main.cloneNode(true);
   copy.querySelectorAll('textarea,input,.readonly,.old-records,pre').forEach(e=>e.remove());
   const picker=main.querySelector(page===0?'.before-panel':'.focus-banner');
   const buttons=picker?[...picker.querySelectorAll(page===0?'[data-before-round]':'[data-task-round]')]:[];
   return {text:copy.textContent,menu:buttons.map(b=>b.textContent.match(/^任務\s+([A-Z0-9＋+]+)/)?.[1]),teacherOpen:!!main.querySelector('details.teacher[open]'),scope:[...main.querySelectorAll('[data-review-task]')].map(e=>e.dataset.reviewTask)};
  });
  const verify=(view,stage)=>{
   assert.deepEqual(view.menu,labels,`${stage}: task selector uses consecutive single letters`);
   assert(!/[A-Z][A-Z0-9]*\s*[＋+]\s*[A-Z][A-Z0-9]*/.test(view.text),`${stage}: combined source label leaked`);
   for(const m of view.text.matchAll(/任務\s+([A-Z][A-Z0-9]*)|\b([A-Z][A-Z0-9]*)｜/g))assert(labels.includes(m[1]||m[2]),`${stage}: invalid visible label ${m[0]}`);
   report.pages++;
  };
  const verifyState=async()=>{
   const current=await p.evaluate(()=>({state,done:roundsDone,saved:JSON.parse(localStorage.getItem(course.id))}));
   for(const [key,value]of Object.entries(answers)){
    assert.equal(current.state.answers[key],value,'Loaded answer changed: '+key);
    assert.equal(current.saved.answers[key],value,'Saved answer changed: '+key);
   }
   for(const key of ['checks','ratings','complete','home','taskHome'])assert.deepEqual(current.state[key],seed[key],'Saved '+key+' changed');
   assert.deepEqual(current.done,ids,'Familiar task IDs changed');
  };
  await verifyState();
  for(const [i,r]of d.rounds.entries()){
   await select(i);
   assert.equal(await p.locator(`#field-before-${r.id}`).inputValue(),answers['before-'+r.id]);
   for(let part=0;part<7;part++){
    await p.evaluate(n=>{page=n;render();document.querySelectorAll('#main details.teacher,#main details.teacher details').forEach(e=>e.open=true);},part);
    const view=await snapshot();verify(view,`Day ${day}/${labels[i]}/Part ${part+1}`);
    if(part===4)assert(view.teacherOpen,'Teacher content must be expanded for label verification');
    if(part===5){assert.deepEqual(view.scope,[r.id]);assert.equal(await p.locator('.checkpoint-card > .grid .readonly').textContent(),answers['before-'+r.id]);assert.equal(await p.locator(`#field-after-${r.id}`).inputValue(),answers['after-'+r.id]);}
    if(part===6){
     assert.equal(await p.locator(`#field-home-${r.id}`).inputValue(),answers['home-'+r.id]);
     assert.equal(await p.locator(`[data-task-home="${r.id}:listen"]`).isChecked(),true);
     if(i<ids.length-1){const next=p.locator(`[data-before-round="${i+1}"]`);assert.equal(await next.count(),1);assert((await next.textContent()).includes(`任務 ${labels[i]} 熟悉了，先試 ${labels[i+1]}`));assert.equal(await next.isDisabled(),false);}
    }
   }
  }
  await select(0);await nav(5);await p.locator('[data-review-mode="mixed"]').click();
  verify(await snapshot(),`Day ${day}/mixed progress`);
  assert.deepEqual(await p.locator('[data-review-task]').evaluateAll(es=>es.map(e=>e.dataset.reviewTask)),ids.slice(0,2));
  await nav(6);verify(await snapshot(),`Day ${day}/mixed homework`);
  await p.reload();assert.equal(await p.evaluate(()=>reviewMode),'mixed');assert.deepEqual(await p.evaluate(()=>reviewIds),ids.slice(0,2));await verifyState();
  await nav(5);verify(await snapshot(),`Day ${day}/reloaded mixed progress`);
  await select(0);answers['before-'+ids[0]]=`${sentinel} / 實際輸入後重新整理`;
  await p.locator(`#field-before-${ids[0]}`).fill(answers['before-'+ids[0]]);
  await p.reload();await verifyState();await nav(5);
  assert.equal(await p.locator('.checkpoint-card > .grid .readonly').textContent(),answers['before-'+ids[0]],'Rendered original answer must not undergo label replacements');
  if(day===8){
   await select(3);await nav(4);await p.locator('details.teacher > summary').click();
   await p.evaluate(()=>{document.documentElement.dataset.theme='light';});
   await p.locator('details.teacher > summary').scrollIntoViewIfNeeded();
   const light=path.join(output,'day8-teacher-light-desktop.png');await p.screenshot({path:light});report.screenshots.push(light);
   await p.setViewportSize({width:390,height:844});await p.locator('#theme').click();
   assert.equal(await p.evaluate(()=>document.documentElement.dataset.theme),'dark');
   assert.equal(await p.locator('details.teacher').getAttribute('open'),'');
   await p.locator('details.teacher > summary').scrollIntoViewIfNeeded();
   const dark=path.join(output,'day8-teacher-dark-mobile.png');await p.screenshot({path:dark});report.screenshots.push(dark);
   verify(await snapshot(),'Day 8/mobile expanded teacher');
  }
  assert.deepEqual(errors,[]);assert.equal(digest(file),sha,'HTML changed during verification');
  return {...report,status:'passed'};
 }finally{await context.close();}
}
(async()=>{
 fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});
 const reports=[];
 try{for(const day of days){try{const report=await checkLesson(browser,day);reports.push(report);console.log(`PASS Day ${day}: ${report.tasks} tasks, ${report.pages} rendered label checks; existing answers and progress preserved`);}catch(error){reports.push({day,status:'failed',error:String(error.stack||error)});console.error(`FAIL Day ${day}: ${error.stack||error}`);process.exitCode=1;}}}
 finally{fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(reports,null,2));await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
