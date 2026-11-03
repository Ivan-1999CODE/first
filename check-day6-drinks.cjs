const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const data=require('./assets/micro-curriculum.cjs').make(6),r=data.rounds[2];
const answers=['No ice, please.','No sugar, please.','Less ice, please.','Less sugar, please.'];
assert.equal(r.displayLabel,'C');assert.equal(r.id,'DRINKS');
assert.deepEqual(r.phraseIds.map(id=>data.phrases.find(p=>p.id===id).en),answers);
assert.deepEqual(r.replyIds.map(i=>data.replies[i].answer),answers);
assert.deepEqual(r.sayPrompts.map(p=>p.answer),answers);
assert(r.sayPrompts.every(p=>p.mode==='repeat'&&p.prompt!==p.answerZh));
assert.equal(r.flowIds.length,2);assert.equal(r.pairIds.length,2);
assert(!/cake|dessert|coffee|巧克力|甜點|咖啡/i.test(JSON.stringify([r,...r.flowIds.map(i=>data.flows[i]),...r.pairIds.map(i=>data.pairs[i])])));
const file=path.resolve(data.file),html=fs.readFileSync(file,'utf8');
for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
const out=path.resolve('tmp/day6-drinks');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:900}}),p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(pathToFileURL(file).href);
  const old={answers:{'entry-before-CD':'Chocolate cake, please.','entry-before-A':'keep my earlier answer'},checks:{'micro-en-d6-merged-day6-dessert-and-coffee-v1-live':[true,true]}};
  await p.evaluate(({key,old})=>localStorage.setItem(key,JSON.stringify(old)),{key:data.course.id,old});
  await p.reload();
  assert.deepEqual(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)),data.course.id+'-before-drinks-v1'),old);
  assert.equal(await p.evaluate(()=>state.answers['entry-before-A']),'keep my earlier answer');
  assert.equal(await p.evaluate(()=>state.answers['entry-before-DRINKS']),'');
  await p.locator('#dg-context [data-dg-task="2"]').click();
  const go=async section=>{await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-page="${section}"]`).click();};
  await go(1);
  assert.deepEqual(await p.locator('.study-library .dg-study-card > .en').allTextContents(),answers);
  assert.equal(await p.locator('.dg-study-changes').count(),0);
  await p.screenshot({path:path.join(out,'02-light.png'),fullPage:true});
  await p.locator('.study-navigation [data-study-view="reply"]').click();
  for(const id of r.replyIds){
   await p.locator(`.workshop-picker [data-reply="${id}"]`).click();
   assert.equal(await p.locator('.dg-study-current').getAttribute('data-study-speaker'),'other');
   await p.locator('.dg-study-current details > summary').click();
   assert((await p.locator('.dg-study-current').innerText()).includes(data.replies[id].line));
   await p.locator('[data-dg-reply-role="self"]').click();
   assert.equal(await p.locator('.dg-study-current [data-pane="2"]').getAttribute('aria-hidden'),'true');
   await p.locator('.dg-study-current [data-level="2"]').click();
   assert.equal(await p.locator('.dg-study-current [data-pane="2"] .en').textContent(),data.replies[id].answer);
  }
  await go(2);
  const flowResult=await p.evaluate(()=>{
   const must=(v,msg)=>{if(!v)throw Error(msg);},click=s=>{const e=document.querySelector(s);must(e&&!e.disabled,'available '+s);e.click();};let count=0;
   for(const fi of activeRound().flowIds){
    click(`#main [data-start="${fi}"]`);
    while(!finished){
     const t=currentStep();must(count++<10,'finite flow');
     must([...document.querySelectorAll('[data-choice]')].every(b=>b.disabled),'choices initially locked');
     click('#heard');click('.dg-speaker [data-guide-hint][data-level="2"]');
     must(document.querySelector('.dg-speaker [data-pane="2"] .en').textContent===t.answer,'correct spoken answer');
     click('#spoken');click(`[data-choice="${1-t.valid[0]}"]`);must(!canNext(),'wrong choice blocked');
     click(`[data-choice="${t.valid[0]}"]`);must(canNext(),'correct choice accepted');click('[data-act="next"]');
    }
    must(state.complete.includes(flows[fi].id),'completion saved');
   }
   return count;
  });assert.equal(flowResult,4);
  await go(3);
  for(let i=0;i<4;i++){
   await p.locator(`[data-say-index="${i}"]`).first().click();
   assert.equal(await p.locator('.say-prompt').textContent(),r.sayPrompts[i].prompt);
   assert.equal(await p.locator('.say-reference').isVisible(),false);
   await p.locator('[data-say-support="2"]').click();
   assert.equal(await p.locator('.say-reference .en').textContent(),answers[i]);
  }
  await p.locator('.say-note > summary').click();await p.locator('.say-note textarea').fill('Less sugar, please.');
  await go(4);
  for(const pi of r.pairIds){
   await p.locator(`#main [data-pair="${pi}"]`).click();
   await p.locator('.dg-teacher > summary').click();
   const text=await p.locator('.dg-teacher').innerText();
   for(const line of data.pairs[pi].answer.split(/(?<=\.) /))assert(text.includes(line));
   await p.locator('[data-pair-check]').first().check();
  }
  await go(5);assert((await p.locator('.checkpoint-card .task').first().innerText()).includes(r.entryCheckpoint.task));
  await go(6);assert(!/巧克力|甜點|咖啡/.test(await p.locator('#main').innerText()));
  await p.reload();await p.locator('#dg-context [data-dg-task="2"]').click();await go(3);
  assert.equal(await p.evaluate(id=>state.answers[id],r.sayPrompts[3].id),'Less sugar, please.');
  assert.deepEqual(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)),data.course.id+'-before-drinks-v1'),old);
  assert.equal(await p.evaluate(()=>state.answers['entry-before-A']),'keep my earlier answer');
  for(const [theme,width,size] of [['light',1280,'standard'],['dark',390,'large']]){
   await p.setViewportSize({width,height:900});
   await p.evaluate(({theme,size})=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size=size;document.documentElement.dataset.textSize=size;},{theme,size});
   await go(1);await p.locator('[data-study-view="library"]').click();
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await p.screenshot({path:path.join(out,`02-${theme}-${width}.png`),fullPage:true});
   await go(3);await p.locator('[data-say-support="2"]').click();
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await p.screenshot({path:path.join(out,`04-${theme}-${width}.png`),fullPage:true});
   await go(4);await p.locator('.dg-teacher > summary').click();
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await p.screenshot({path:path.join(out,`05-${theme}-${width}.png`),fullPage:true});
  }
  assert.deepEqual(errors,[]);console.log('PASS: Day 6 C, 4 replies, 2 complete flows with retries, contextual practice, teacher dialogue, saved work, old-record archive, desktop/mobile themes.');
 }catch(e){await p.screenshot({path:path.join(out,'failure.png'),fullPage:true});throw e;}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
