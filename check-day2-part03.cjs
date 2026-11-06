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
async function task(p,n){await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-dg-task="${n}"],#nav [data-ci-task="${n}"]`).click();await singleTaskOnly(p);}
async function singleTaskOnly(p){
 assert.equal(await p.locator('#main .d2-integration,#main [data-ci-group]').count(),0,'Single-task content does not include integration entry cards');
 assert(!/到下方|連起來，完成一筆購物/.test(await p.locator('#main').innerText()),'No stale directions to the removed integration panel');
}
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
  const choice=p.locator(`[${attr}="${index}"]`);
  assert.equal(await choice.getAttribute('aria-label'),'選擇：'+option[1]);
  const type=s.choiceVisuals?.[index]?.type;
  if(type==='own-bag'||type==='store-bag'){
   assert.equal(await choice.locator('.vf-no-bag').count(),type==='own-bag'?1:0,'Only declining a store bag has a red slash');
   if(type==='own-bag')assert.equal(await choice.locator('.vf-no-bag').evaluate(el=>getComputedStyle(el).stroke),'rgb(223, 69, 69)','Slash stays red in either theme');
  }
 }
 if(s.choiceVisuals?.some(v=>v.type==='own-bag')){
  const shapes=await p.locator(`[${attr}] > .vf-art`).evaluateAll(svgs=>svgs.map(svg=>[...svg.children].filter(e=>!e.classList.contains('vf-no-bag')).map(e=>e.outerHTML).join('')));
  assert.equal(shapes.length,2);assert.equal(shapes[0],shapes[1],'Both choices use the same bag drawing');
 }
}
async function shot(p,name){if(!name.startsWith('menu'))await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:path.join(out,name+'.png'),fullPage:!name.startsWith('menu')});report.screenshots.push(name+'.png');}
async function completion(p,steps){
 const results=steps.map(s=>s.objects[s.valid[0]][1]);
 assert.deepEqual(await p.locator('.lesson-completion-goals > li,[data-d2-review-goal]').allTextContents(),steps.map(s=>s.label||s.task));
 assert.deepEqual(await p.locator('.lesson-completion-english > li,[data-d2-review-answer]').allTextContents(),steps.map(s=>s.answer));
 assert.deepEqual(await p.locator('.d2-completion-result .vf-final figcaption').allTextContents(),results,'Only the completed scene appears in the picture review');
 assert.deepEqual(await p.locator('.d2-completion-result .scene-ledger strong').allTextContents(),results,'Picture and recorded result agree');
 assert(await p.locator('.lesson-completion-summary li,.d2-completion-lines p').evaluateAll(es=>es.every(e=>getComputedStyle(e).fontWeight==='400')));
 if(await p.locator('.d2-practice-multi').count()){
  assert.equal(await p.locator('.d2-scene-frame .d2-completion > section').count(),2,'Both result columns share the current scene frame');
  assert.equal(await p.locator('.d2-scene-header .is-complete').count(),1,'One shared completion status');
  assert.equal(await p.locator('.d2-practice-picker .d2-practice-context').count(),0,'Overview does not repeat the current result');
  assert.equal(await p.locator('.d2-scene-footer .primary').count(),1,'One shared primary next action');
  assert.equal(await p.locator('#main > .footer-actions [data-page="3"]').count(),0,'No competing Part 04 button in the page footer');
  assert(!/已完成這次任務|這個小情境已練習/.test(await p.locator('.d2-completion-result').innerText()),'Result column does not repeat completion status');
  assert.equal(await p.locator('.d2-completion .actions').count(),0,'Next actions are outside both columns');
  assert(await p.locator('.d2-result-steps').evaluate(e=>!e.open),'Detailed step pictures start collapsed');
  assert(await p.locator('[data-d2-review-answer]').evaluateAll(es=>es.every(e=>e.getClientRects().length&&!e.closest('details'))),'English review stays visible');
 }
 const boxes=await p.locator('.d2-completion > section').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));
 assert.equal(boxes.length,2);assert(Math.abs(boxes[0].top-boxes[1].top)<2&&boxes[1].left>boxes[0].left,'Desktop completion has two columns');
}
async function completionLayouts(p,name){
 const directory=path.resolve('outputs/day2-scenario-layout');fs.mkdirSync(directory,{recursive:true});
 for(const width of [1280,390])for(const theme of ['light','dark']){
  await p.setViewportSize({width,height:1800});await p.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size='large';appearance();window.scrollTo({top:0,behavior:'instant'});},theme);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Completion has no horizontal overflow');
  const boxes=await p.locator('.d2-completion > section').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));
  if(width===390)assert(boxes[1].top>=boxes[0].bottom&&Math.abs(boxes[1].left-boxes[0].left)<2,'Mobile stacks the two panels');
  else assert(Math.abs(boxes[0].top-boxes[1].top)<2&&boxes[1].left>boxes[0].left,'Desktop keeps two columns');
  assert(boxes.every(r=>r.left>=0&&r.right<=width+1),'Completion panels fit the viewport');
  await p.screenshot({path:path.join(directory,`${name}-${theme}-${width}.png`),fullPage:true});
  if(await p.locator('.d2-result-steps').count()){
   await p.locator('.d2-result-steps > summary').click();
   assert(await p.locator('.d2-result-steps .vf-final').isVisible());
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Expanded step pictures fit');
   await p.screenshot({path:path.join(directory,`${name}-${theme}-${width}-expanded.png`),fullPage:true});
   await p.locator('.d2-result-steps > summary').click();
  }
 }
 await p.setViewportSize({width:1280,height:900});await p.evaluate(()=>{document.documentElement.dataset.size='standard';appearance();});
}
async function bounds(p){
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
 assert(await p.locator('.d2-scene-tabs button').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.left>=0&&r.right<=innerWidth+1;})),'Touch target sizes and bounds');
 report.layouts++;
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'}),p=await ctx.newPage();
  p.setDefaultTimeout(6000);p.on('pageerror',e=>report.errors.push(e.stack));await p.goto(url);
  const existing=await p.evaluate(()=>{state.answers['before-'+rounds[0].id]='保留課前筆記';state.complete=[flows[0].id];save();return localStorage.getItem(course.id);});
  await part(p,2);assert.equal(await p.locator('[data-d2-active]').getAttribute('data-d2-active'),'mug');
  assert.equal(await p.locator('.d2-practice-picker [data-d2-complete=true]').count(),0,'Old whole-flow completion does not pre-complete new scenes');
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
   await singleTaskOnly(p);
   await completion(p,steps);
   if(s.id==='water')await completionLayouts(p,'ordinary');
   if(s.id==='payment')await completionLayouts(p,'payment');
   assert((await p.locator(`.d2-scene-tabs [data-d2-scene="${s.id}"]`).innerText()).includes('已練習'));
   assert.equal(await p.evaluate(key=>localStorage.getItem(key),d.course.id),existing,'Small scene completion must preserve original records');report.scenes++;
  }
  // Backtracking invalidates the dependent answer; restarting retains the completion mark.
  await task(p,0);await p.locator('.d2-scene-tabs [data-d2-scene="mug"]').click();await p.locator('[data-d2-restart]').click();
  await step(p,d.flows[0].steps[0]);await gates(p,d.flows[0].steps[1]);
  await (await directChoice(p,'[data-choice="0"]')).click();await p.locator('[data-act="back"]').click();
  assert.equal(await p.evaluate(()=>turn),0);assert(await p.locator('[data-act="next"]').isDisabled());assert.equal(await p.locator('.vf-history').count(),0);
  // Integration stays available through the task menu, outside single-task content.
  for(const g of integration.groups){
   await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-ci-group="${g.id}"]`).click();assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),'3');
   for(const route of g.paths){await p.locator(`[data-ci-path="${route.id}"]`).click();for(const s of route.steps)await integratedStep(p,s);assert.equal(await p.locator('.ci-complete').count(),1);await completion(p,route.steps);if(!report.integratedPaths)await completionLayouts(p,'integrated');report.integratedPaths++;}
   await task(p,0);assert.equal(await p.locator('[data-d2-active]').getAttribute('data-d2-active'),'mug');
  }
  await p.reload();await part(p,2);
  for(let i=0;i<d.rounds.length;i++){await task(p,i);assert.equal(await p.locator('.d2-scene-tabs [data-d2-complete=true],.d2-practice:not(.d2-practice-multi) .d2-scene-tabs small').count(),config.scenes.filter(s=>s.taskId===d.rounds[i].id).length);}
  assert.equal(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).complete.length,config.storageKey),6);
  assert.equal(await p.evaluate(key=>localStorage.getItem(key),d.course.id),existing);
  for(let i=0;i<d.rounds.length;i++){
   await task(p,i);
   for(let n=0;n<7;n++){await part(p,n);await singleTaskOnly(p);}
  }
  for(const theme of ['light','dark'])for(const width of [390,820,1280]){
   await p.setViewportSize({width,height:900});await p.evaluate(theme=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size','large');},theme);await p.reload();await task(p,1);await part(p,2);await bounds(p);
   const target=p.locator('.d2-scene-tabs [data-d2-scene="need-bag"]');await target.focus();await p.keyboard.press('Enter');assert.equal(await p.locator('[data-d2-active]').getAttribute('data-d2-active'),'need-bag');
   await p.locator('[data-d2-restart]').click();await p.locator('[data-guide-hint][data-level="2"]').click().catch(()=>{});
   const transcript=p.locator('[data-dg-transcript]');if(await transcript.count())await transcript.click();await bounds(p);
   if(width!==820)await shot(p,`scenes-${theme}-${width}`);
   for(const id of ['need-bag','own-bag']){
    await p.locator(`.d2-scene-tabs [data-d2-scene="${id}"]`).click();await p.locator('[data-d2-restart]').click();
    const scene=config.scenes.find(s=>s.id===id),s=source(scene).steps[scene.start];
    await gates(p,s);await checkShoppingChoices(p,'data-choice',s);
    const wrong=s.objects.findIndex((_,i)=>!s.valid.includes(i));
    await p.locator(`[data-choice="${wrong}"]`).click();assert(await p.locator('[data-act="next"]').isDisabled());
    await p.locator(`[data-choice="${s.valid[0]}"]`).click();assert(!await p.locator('[data-act="next"]').isDisabled());
    assert.equal(await p.locator('.vf-result-art .vf-no-bag').count(),id==='own-bag'?1:0,'Confirmed result uses the same bag symbol');
    await singleTaskOnly(p);await bounds(p);
    if(width!==820){const file=`bags-${id}-${theme}-${width}.png`;await p.locator('.vf-interaction').screenshot({path:path.join(out,file)});report.screenshots.push(file);}
   }
   await p.locator('.d2-scene-tabs [data-d2-scene="need-bag"]').click();
   await p.locator('.d2-scene-tabs [data-d2-scene="payment"]').hover();await p.locator('.d2-scene-tabs [data-d2-scene="payment"]').focus();
   const contrast=await p.locator('.d2-scene-tabs [data-d2-scene="need-bag"]').evaluate(e=>{const s=getComputedStyle(e),lum=c=>c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);const a=lum(s.color),b=lum(s.backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);});assert(contrast>=4.5,'Selected scene contrast');
   await p.locator('#dg-menu-open').click();await p.locator('#nav [data-ci-group="single"]').hover();await p.keyboard.press('Tab');
   assert(await p.locator('#dg-course-dialog').evaluate(e=>e.open));if(width===390)await shot(p,`menu-${theme}-${width}`);await p.keyboard.press('Escape');assert(!await p.locator('#dg-course-dialog').evaluate(e=>e.open));
  }
  // A malformed/blocked persistence API must not prevent this practice.
  // Finish the last scene first: continue with an unpracticed scene instead of
  // promoting Part 04 until every scene in this task has been practiced.
  {
   const c=await browser.newContext({viewport:{width:1280,height:900}}),p2=await c.newPage();
   p2.on('pageerror',e=>report.errors.push(e.stack));await p2.goto(url);await task(p2,1);await part(p2,2);
   await p2.locator('.d2-scene-tabs [data-d2-scene="need-bag"]').click();
   for(const id of ['need-bag','payment','own-bag']){
    const scene=config.scenes.find(s=>s.id===id);
    assert.equal(await p2.locator('[data-d2-active]').getAttribute('data-d2-active'),id);
    for(const t of source(scene).steps.slice(scene.start,scene.end+1))await step(p2,t);
    if(id!=='own-bag'){
     const nextId=id==='need-bag'?'payment':'own-bag';
     assert.equal(await p2.locator('.d2-scene-footer .primary').getAttribute('data-d2-scene'),nextId);
     await p2.locator('.d2-scene-footer .primary').click();
     assert.equal(await p2.evaluate(()=>document.activeElement.id),'d2-active-title','Next scene focuses its shared title');
    }
   }
   assert.equal(await p2.locator('.d2-scene-footer .primary').getAttribute('data-page'),'3');
   assert.equal(await p2.locator('.d2-section-link').count(),0,'No duplicate Part 04 action after all scenes');
   await p2.locator('[data-d2-restart]').click();
   assert.equal(await p2.locator('.d2-scene-status.is-complete').count(),0,'Restart shows practice in progress');
   assert.equal(await p2.locator('.d2-scene-tabs [data-d2-complete=true]').count(),3,'Restart preserves completed-scene records');
   await c.close();
  }
  for(const broken of ['malformed','blocked']){
   const c=await browser.newContext(),bp=await c.newPage();bp.on('pageerror',e=>report.errors.push(e.stack));
   await bp.addInitScript(({broken,key})=>{if(broken==='blocked'){Storage.prototype.getItem=function(){throw Error('blocked');};Storage.prototype.setItem=function(){throw Error('blocked');};}else localStorage.setItem(key,'{broken');},{broken,key:config.storageKey});
   await bp.goto(url);await part(bp,2);assert(await bp.locator('.d2-practice-picker .notice').isVisible());for(const s of d.flows[0].steps.slice(0,2))await step(bp,s);assert(await bp.locator('.d2-completion').isVisible());await c.close();
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{fs.writeFileSync(path.join(out,'failure.txt'),e.stack);console.error(e);process.exitCode=1;});
