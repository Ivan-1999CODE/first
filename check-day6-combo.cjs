const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const d=require('./assets/micro-curriculum.cjs').make(6),ci=require('./assets/chapter-integration-data.cjs')(d);
const r=d.rounds.find(r=>r.id==='DRINKS'),g=ci.groups.find(g=>g.id==='drink');
const out=path.resolve('tmp/day6-combo');fs.mkdirSync(out,{recursive:true});
const offer='Would you like to make it a combo with a drink?',drink='What would you like to drink?';
const html=fs.readFileSync(d.file,'utf8');
const read=key=>JSON.parse(html.match(new RegExp('(?:^|[>\\n])const '+key+'=(.*);(?:\\r?\\n|<)'))[1]);
for(const key of ['rounds','flows','phrases','replies','pairs'])assert.deepEqual(read(key),JSON.parse(JSON.stringify(d[key])));
assert.deepEqual(read('chapterIntegration'),ci);
for(const s of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(s[1]);
for(const fi of r.flowIds){
 const steps=d.flows[fi].steps;
 assert.deepEqual(steps.map(s=>s.line),[offer,drink,'Would you like ice?','Would you like sugar?']);
 assert.deepEqual(steps.map(s=>s.recordIndex),[2,3,0,1]);
 assert(steps.every(s=>s.choiceReview?.mode==='apply'&&!s.askFirst));
}
assert.deepEqual(r.studyChanges.map(s=>[s.baseAnswer,s.answer]),[['No ice, please.','Less ice, please.'],['No sugar, please.','Less sugar, please.']]);
assert.equal(r.sayPrompts.length,6);
assert.equal(r.entryCheckpoint.answer,'No ice, please.');
for(const pi of r.pairIds)assert.deepEqual(d.pairs[pi].goalRecordIndices,[2,3,0,1]);
for(const p of g.paths){
 assert.equal(p.steps.length,8);
 assert.deepEqual(p.steps.slice(1,6).map(s=>s.answer),['I’d like a chicken sandwich, please.','Yes, please.','I’d like tea, please.',p.id==='none'?'No ice, please.':'Less ice, please.',p.id==='none'?'No sugar, please.':'Less sugar, please.']);
 assert.deepEqual(p.steps.map(s=>Number(s.id.split('-').at(-1))),[0,1,6,7,2,3,4,5]);
 assert.equal(p.steps[6].answer,p.id==='none'?'For here, please.':'To go, please.');
}
const beforePath=path.join(out,'before.json');
if(fs.existsSync(beforePath)){
 const b=JSON.parse(fs.readFileSync(beforePath,'utf8')),br=b.data.rounds.find(r=>r.id==='DRINKS');
 assert.equal(d.course.id,b.data.course.id);assert.equal(r.key,br.key);assert.deepEqual(r.entryCheckpoint,br.entryCheckpoint);
 for(const p of b.data.phrases)assert.deepEqual(d.phrases.find(n=>n.id===p.id),p,'preserve phrase '+p.id);
 for(const q of br.sayPrompts)assert.deepEqual(r.sayPrompts.find(n=>n.id===q.id),q,'preserve situation '+q.id);
 for(const bg of b.integration.groups){const ng=ci.groups.find(n=>n.id===bg.id);assert.equal(ng.storageKey,bg.storageKey);for(const bp of bg.paths)for(const s of bp.steps){const next=ng.paths.find(n=>n.id===bp.id).steps.find(n=>n.id===s.id);assert.equal(next.answer,s.answer,'preserve goal/question '+s.id);}}
}
async function go(p,n,integrated=false){await p.locator(integrated?`[data-ci-section="${n}"]`:`[data-page="${n}"]`).first().click();}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 try{
  const p=await browser.newPage({viewport:{width:1280,height:900}});p.setDefaultTimeout(6000);p.on('pageerror',e=>errors.push(e.message));
  await p.goto(pathToFileURL(path.resolve(d.file)).href);
  const pair=d.pairs[r.pairIds[0]],oldQuestion=r.sayPrompts.find(q=>q.answer==='Less sugar, please.');
  await p.evaluate(({key,pair,id})=>localStorage.setItem(key,JSON.stringify({answers:{'entry-before-DRINKS':'No ice, please.',[id]:'my saved sugar answer'},checks:{[pair]:[true,false]},complete:[]})),{key:d.course.id,pair:pair.id,id:oldQuestion.id});
  await p.reload();await p.locator('#dg-menu-open').click();await p.locator('#dg-course-dialog [data-dg-task="2"]').click();
  await go(p,1);assert((await p.locator('.study-library').innerText()).includes('I’d like tea, please.'));
  assert((await p.locator('#main').innerText()).includes(offer));
  await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:path.join(out,'single-study.png'),fullPage:true});
  await go(p,2);
  await p.locator(`[data-start="${r.flowIds[0]}"]`).first().click();await p.locator('#heard').click();await p.locator('#spoken').click();
  await p.locator('[data-choice="0"]').hover();await p.locator('[data-choice="0"]').focus();
  await p.locator('.scene-board').screenshot({path:path.join(out,'combo-choices.png')});
  const count=await p.evaluate(()=>{
   let count=0;const must=(v,m)=>{if(!v)throw Error(m);},click=s=>{const e=document.querySelector(s);must(e&&!e.disabled,'available '+s);e.click();};
   for(const fi of activeRound().flowIds){
    click(`#main [data-start="${fi}"]`);
    while(!finished){const t=currentStep();must(count++<9,'finite');must([...document.querySelectorAll('[data-choice]')].every(e=>e.disabled),'locked');click('#heard');click('#spoken');
     const wrong=t.objects.findIndex((_,i)=>!t.valid.includes(i));click(`[data-choice="${wrong}"]`);must(!canNext(),'reject wrong');click(`[data-choice="${t.valid[0]}"]`);must(canNext(),'accept right');click('[data-act="next"]');}
   }return count;
  });assert.equal(count,8);
  await go(p,4);await p.locator(`[data-pair="${r.pairIds[0]}"]`).click();
  assert(await p.locator(`[data-pair-check="${pair.id}:0"]`).isChecked());assert(!await p.locator(`[data-pair-check="${pair.id}:2"]`).isChecked());
  await p.locator('.d5-teacher-guide summary').click();
  const singleText=await p.locator('.d5-teacher-script').innerText();assert(singleText.indexOf(offer)<singleText.indexOf(drink));
  await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:path.join(out,'single-teacher.png'),fullPage:true});
  await p.goto(pathToFileURL(path.resolve(d.file)).href+'#chapter-drink');await go(p,1,true);
  assert((await p.locator('#main').innerText()).includes(offer));
  await go(p,2,true);
  for(const route of g.paths){
   await p.locator(`[data-ci-path="${route.id}"]`).click();
   for(const s of route.steps){
    assert(await p.locator('[data-ci-next]').isDisabled());
    await p.locator(`[data-ci-gate="${s.askFirst?'spoken':'heard'}"]`).click();await p.locator(`[data-ci-gate="${s.askFirst?'heard':'spoken'}"]`).click();
    const wrong=s.objects.findIndex((_,i)=>!s.valid.includes(i));await p.locator(`[data-ci-choice="${wrong}"]`).click();assert(await p.locator('[data-ci-next]').isDisabled());
    await p.locator(`[data-ci-choice="${s.valid[0]}"]`).click();assert(await p.locator('[data-ci-next]').isEnabled());await p.locator('[data-ci-next]').click();
   }assert.equal(await p.locator('.ci-complete').count(),1);
  }
  for(const [theme,width]of [['light',1280],['dark',390]]){
   await p.setViewportSize({width,height:900});await p.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.textSize='large';document.documentElement.dataset.size='large';},theme);
   await go(p,4,true);await p.locator('[data-ci-path="none"]').click();await p.locator('.d5-teacher-guide summary').click();
   const text=await p.locator('.d5-teacher-script').innerText();assert(text.indexOf('I’d like a chicken sandwich, please.')<text.indexOf(offer));assert(text.indexOf(offer)<text.indexOf(drink));assert(text.indexOf(drink)<text.indexOf('Would you like ice?'));
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:path.join(out,`integrated-${theme}-${width}.png`),fullPage:true});
   await p.locator('#dg-menu-open').click();await p.locator('#dg-course-dialog [data-ci-task="2"]').hover();await p.locator('#dg-course-dialog [data-ci-task="2"]').focus();await p.screenshot({path:path.join(out,`menu-${theme}-${width}.png`)});await p.keyboard.press('Escape');
  }
  assert.equal(await p.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key)).answers[id],{key:d.course.id,id:oldQuestion.id}),'my saved sugar answer');
  assert.deepEqual(errors,[]);console.log('PASS: Day 6 combo teaching, 24 flow steps with retry, both drink preferences, source/output alignment, old IDs and answers, teacher sequence, desktop/mobile themes.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
