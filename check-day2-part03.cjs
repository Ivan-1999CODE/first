'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/day2-part03');fs.mkdirSync(out,{recursive:true});
const file='travel-english-unit2-shopping.html',html=fs.readFileSync(file,'utf8'),url=pathToFileURL(path.resolve(file)).href;
const read=key=>JSON.parse(html.match(new RegExp('(?:^|[>\\n])const '+key+'=(.*);(?:\\r?\\n|<)'))[1]);
const d=require('./assets/micro-curriculum.cjs').make(2),config=read('day2Practice'),integration=read('chapterIntegration');
for(const script of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
for(const key of ['course','rounds','flows','phrases','replies','missions','pairs','quizzes'])assert.deepEqual(read(key),JSON.parse(JSON.stringify(d[key])),key+' preserved');
const baselineFile=path.join(out,'baseline.json');
if(fs.existsSync(baselineFile)){
 const baseline=JSON.parse(fs.readFileSync(baselineFile,'utf8'));
 const original=baseline.data;
 assert.deepEqual({...d,flows:original.flows},original,'Saved data and other parts stay aligned');
 for(const [i,flow] of d.flows.entries()){
  const before=original.flows[i];
  assert.deepEqual({...flow,steps:before.steps},before,'Flow identity stays stable');
  for(const [j,step] of flow.steps.entries()){
   const prior=before.steps[j];
   const fields=['choicePrompt','choiceReview','practiceReply'];
   if(step.id==='micro-en-d2-merged-payment-bag-v1-0')fields.push('task');
   const omit=s=>Object.fromEntries(Object.entries(s).filter(([k])=>!fields.includes(k)));
   assert.deepEqual(omit(step),omit(prior),'Only reviewed practice cues change '+step.id);
  }
 }
}
for(const f of fs.readdirSync('.').filter(f=>/^travel-.*\.html$/.test(f)&&f!==file))assert(!fs.readFileSync(f,'utf8').includes('<style id="day2-part03-styles">'),f+' has no Day 2 pilot');
const source=s=>d.flows.find(f=>f.id===s.flowId);
assert.deepEqual(config.scenes.map(s=>[s.id,s.end-s.start+1]),[['mug',2],['water',2],['payment',2],['own-bag',1],['need-bag',1],['budget',2]]);
assert.deepEqual(config.scenes.map(s=>source(s).steps.slice(s.start,s.end+1).map(t=>t.answer)),[
 ['How much is this?','I’ll take it.'],['I’d like three bottles of water.','How much are they?'],
 ['Can I pay by card?','I’ll pay in cash.'],['No, thank you.'],['Yes, please.'],['I have ten dollars.','Do you have something cheaper?']
]);
assert.deepEqual(config.integrated.map(g=>g.id),integration.groups.map(g=>g.id));
const report={scenes:0,steps:0,integratedPaths:0,layouts:0,screenshots:[],errors:[]};
const part=async(p,n)=>{await p.locator('.dg-section-switch button').nth(n).click();assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),String(n+1));};
async function task(p,n){await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-dg-task="${n}"],#nav [data-ci-task="${n}"]`).click();}
async function directChoice(p,selector){const e=p.locator(selector);for(const details of await e.locator('xpath=ancestor::details').all())if(!await details.evaluate(x=>x.open))await details.locator(':scope > summary').click();return e;}
async function gates(p,s){
 assert(await p.locator('[data-act="next"]').isDisabled());
 assert(await p.locator('[data-choice]').evaluateAll(es=>es.every(e=>e.disabled)));
 const first=s.askFirst?'spoken':'heard',second=s.askFirst?'heard':'spoken';
 assert(!await p.locator('#'+second).isVisible());
 await p.locator('#'+first).check();
 assert(await p.locator('[data-choice]').evaluateAll(es=>es.every(e=>e.disabled)));
 await p.locator('#'+second).check();
 assert(await p.locator('[data-choice]').evaluateAll(es=>es.every(e=>!e.disabled)));
}
async function step(p,s){
 await gates(p,s);
 await checkShoppingChoices(p,'data-choice',s);
 const wrong=s.objects.findIndex((_,i)=>!s.valid.includes(i));
 if(wrong>=0){await (await directChoice(p,`[data-choice="${wrong}"]`)).click();assert(await p.locator('[data-act="next"]').isDisabled());}
 await (await directChoice(p,`[data-choice="${s.valid[0]}"]`)).click();
 assert(!await p.locator('[data-act="next"]').isDisabled());
 await p.locator('[data-act="next"]').click();report.steps++;
}
async function integratedStep(p,s){
 assert(await p.locator('[data-ci-next]').isDisabled());
 const first=s.askFirst?'spoken':'heard',second=s.askFirst?'heard':'spoken';
 assert.equal(await p.locator(`[data-ci-gate="${second}"]`).count(),0,'the next role is not shown before confirmation');
 await p.locator(`[data-ci-gate="${first}"]`).click();await p.locator(`[data-ci-gate="${second}"]`).click();
 await checkShoppingChoices(p,'data-ci-choice',s);
 await (await directChoice(p,`[data-ci-choice="${s.valid[0]}"]`)).click();await p.locator('[data-ci-next]').click();
}
async function checkShoppingChoices(p,attr,s){
 assert.equal(await p.locator('.vf-picture-help,.vf-scene-context').count(),0);
 for(const [index,option] of s.objects.entries()){
  assert.equal(await p.locator(`[${attr}="${index}"]`).getAttribute('aria-label'),'選擇：'+option[1]);
 }
}
async function shot(p,name){if(!name.startsWith('menu'))await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:path.join(out,name+'.png'),fullPage:!name.startsWith('menu')});report.screenshots.push(name+'.png');}
async function bounds(p){
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
 assert(await p.locator('.d2-scene-tabs button,.d2-integration-cards button').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.left>=0&&r.right<=innerWidth+1;})),'Touch target sizes and bounds');
 report.layouts++;
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'}),p=await ctx.newPage();
  p.setDefaultTimeout(6000);p.on('pageerror',e=>report.errors.push(e.stack));await p.goto(url);
  const existing=await p.evaluate(()=>{state.answers['before-'+rounds[0].id]='保留課前筆記';state.complete=[flows[0].id];save();return localStorage.getItem(course.id);});
  await part(p,2);assert.equal(await p.locator('[data-d2-active]').getAttribute('data-d2-active'),'mug');
  assert.equal(await p.locator('.d2-practice-picker small').count(),0,'Old whole-flow completion does not pre-complete new scenes');
  // Switching scenes preserves independent temporary progress, including a partial quantity.
  await step(p,d.flows[0].steps[0]);
  await p.locator('.d2-scene-tabs [data-d2-scene="water"]').click();assert(await p.locator('[data-act="back"]').isDisabled());
  await gates(p,d.flows[0].steps[2]);await p.locator('[data-vf-delta="1"]').click();
  await p.locator('.d2-scene-tabs [data-d2-scene="mug"]').click();assert.equal(await p.evaluate(()=>turn),1);assert(!await p.evaluate(()=>heard||spoken));
  await p.locator('.d2-scene-tabs [data-d2-scene="water"]').click();assert.equal(await p.locator('.vf-counter output').innerText(),'1');
  await task(p,1);await task(p,0);assert.equal(await p.locator('[data-d2-active]').getAttribute('data-d2-active'),'water');assert.equal(await p.locator('.vf-counter output').innerText(),'1');
  for(const s of config.scenes){
   await task(p,d.rounds.findIndex(r=>r.id===s.taskId));await p.locator(`.d2-scene-tabs [data-d2-scene="${s.id}"]`).click();
   await p.locator('[data-d2-restart]').click();
   assert.equal(await p.evaluate(()=>turn),s.start);assert(await p.locator('[data-act="back"]').isDisabled());
   const steps=source(s).steps.slice(s.start,s.end+1);
   for(const t of steps)await step(p,t);
   assert.equal(await p.locator('.d2-completion').count(),1);assert.equal(await p.evaluate(()=>turn),s.end);
   assert.equal(await p.locator('.d2-completion details .en').count(),steps.length);
   assert((await p.locator(`.d2-scene-tabs [data-d2-scene="${s.id}"]`).innerText()).includes('已練習'));
   assert.equal(await p.evaluate(key=>localStorage.getItem(key),d.course.id),existing,'Small scene completion must preserve original records');report.scenes++;
  }
  // Backtracking invalidates the dependent answer; restarting retains the completion mark.
  await task(p,0);await p.locator('.d2-scene-tabs [data-d2-scene="mug"]').click();await p.locator('[data-d2-restart]').click();
  await step(p,d.flows[0].steps[0]);await gates(p,d.flows[0].steps[1]);
  await (await directChoice(p,'[data-choice="0"]')).click();await p.locator('[data-act="back"]').click();
  assert.equal(await p.evaluate(()=>turn),0);assert(await p.locator('[data-act="next"]').isDisabled());assert.equal(await p.locator('.vf-history').count(),0);
  // Existing integrated groups open directly in 03 and each logical path completes.
  for(const g of integration.groups){
   await p.locator(`.d2-integration [data-ci-group="${g.id}"]`).click();assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),'3');
   for(const route of g.paths){await p.locator(`[data-ci-path="${route.id}"]`).click();for(const s of route.steps)await integratedStep(p,s);assert.equal(await p.locator('.ci-complete').count(),1);report.integratedPaths++;}
   await task(p,0);assert.equal(await p.locator('[data-d2-active]').getAttribute('data-d2-active'),'mug');
  }
  await p.reload();await part(p,2);
  for(let i=0;i<d.rounds.length;i++){await task(p,i);assert.equal(await p.locator('.d2-scene-tabs small').count(),config.scenes.filter(s=>s.taskId===d.rounds[i].id).length);}
  assert.equal(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).complete.length,config.storageKey),6);
  assert.equal(await p.evaluate(key=>localStorage.getItem(key),d.course.id),existing);
  for(const theme of ['light','dark'])for(const width of [390,820,1280]){
   await p.setViewportSize({width,height:900});await p.evaluate(theme=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size','large');},theme);await p.reload();await task(p,1);await part(p,2);await bounds(p);
   const target=p.locator('.d2-scene-tabs [data-d2-scene="need-bag"]');await target.focus();await p.keyboard.press('Enter');assert.equal(await p.locator('[data-d2-active]').getAttribute('data-d2-active'),'need-bag');
   await p.locator('[data-d2-restart]').click();await p.locator('[data-guide-hint][data-level="2"]').click().catch(()=>{});
   const transcript=p.locator('[data-dg-transcript]');if(await transcript.count())await transcript.click();await bounds(p);
   if(width!==820)await shot(p,`scenes-${theme}-${width}`);
   await p.locator('.d2-scene-tabs [data-d2-scene="payment"]').hover();await p.locator('.d2-scene-tabs [data-d2-scene="payment"]').focus();
   const contrast=await p.locator('.d2-scene-tabs [data-d2-scene="need-bag"]').evaluate(e=>{const s=getComputedStyle(e),lum=c=>c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);const a=lum(s.color),b=lum(s.backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);});assert(contrast>=4.5,'Selected scene contrast');
   await p.locator('#dg-menu-open').click();await p.locator('#nav [data-ci-group="single"]').hover();await p.keyboard.press('Tab');
   assert(await p.locator('#dg-course-dialog').evaluate(e=>e.open));if(width===390)await shot(p,`menu-${theme}-${width}`);await p.keyboard.press('Escape');assert(!await p.locator('#dg-course-dialog').evaluate(e=>e.open));
  }
  // A malformed/blocked persistence API must not prevent this practice.
  for(const broken of ['malformed','blocked']){
   const c=await browser.newContext(),bp=await c.newPage();bp.on('pageerror',e=>report.errors.push(e.stack));
   await bp.addInitScript(({broken,key})=>{if(broken==='blocked'){Storage.prototype.getItem=function(){throw Error('blocked');};Storage.prototype.setItem=function(){throw Error('blocked');};}else localStorage.setItem(key,'{broken');},{broken,key:config.storageKey});
   await bp.goto(url);await part(bp,2);assert(await bp.locator('.d2-practice-picker .notice').isVisible());for(const s of d.flows[0].steps.slice(0,2))await step(bp,s);assert(await bp.locator('.d2-completion').isVisible());await c.close();
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{fs.writeFileSync(path.join(out,'failure.txt'),e.stack);console.error(e);process.exitCode=1;});
