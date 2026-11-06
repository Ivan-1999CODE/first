'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=__dirname,out=path.join(root,'outputs/completion-review'),before=path.join(out,'before');
const norm=s=>s.replace(/\r\n/g,'\n'),read=f=>norm(fs.readFileSync(f,'utf8'));
const fileFor=day=>require('./assets/micro-curriculum.cjs').make(day).file||'travel-english-unit2-shopping.html';
const report={ordinary:0,integrated:0,hotel:0,layoutChecks:0,protectedFiles:0,errors:[],screenshots:[]};
// The latest completion-only snapshot also covers Day 1 and protects Part 08.
report.protectedFiles=process.argv.includes('--runtime-only') ? 0 : require('./check-integrated-completion.cjs').checkScope();
for(let day=2;day<=14;day++)for(const s of read(path.join(root,fileFor(day))).matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(s[1]);
if(process.argv.includes('--static')){console.log('Completion source preservation and syntax passed for '+report.protectedFiles+' documents.');process.exit(0);}

// Run existing event handlers through every finish route. No completion flag
// or saved answer is injected, so missing next/finish wiring fails this check.
function clickBrowser(selector){const el=document.querySelector(selector);if(!el)throw Error('Missing '+selector);if(el.disabled)throw Error('Disabled '+selector);el.click();}
function finishOrdinary({flowIndex,sceneId}){
 const click=window.testClick;
 const target=flows[flowIndex],r=rounds.findIndex(r=>r.flowIds.includes(flowIndex));setTaskRound(r);start(flowIndex);
 if(sceneId)click(`[data-d2-scene="${sceneId}"]`);
 if(document.querySelector('.lesson-completion-summary'))throw Error('Completion shown before finishing');
 let guard=0;
 while(!finished&&guard++<30){
  const prelude=document.querySelector('[data-dg-prelude-heard]');
  if(prelude){click('[data-dg-prelude-heard]');click(`[data-dg-prelude-choice="${target.prelude.valid[0]}"]`);click('[data-dg-prelude-next]');continue;}
  const s=currentStep();for(const id of s.askFirst?['spoken','heard']:['heard','spoken'])click('#'+id);
  click(`[data-choice="${s.valid[0]}"]`);click('[data-act="next"]');
 }
 if(!finished)throw Error('Did not finish '+target.id);
 const scene=sceneId?day2Practice.scenes.find(s=>s.id===sceneId):null;
 return target.steps.map((_,i)=>lessonStep(target,i,id=>history[target.steps.findIndex(s=>s.id===id)])).slice(scene?.start||0,scene?scene.end+1:undefined);
}
function finishChapter({groupId,pathId}){
 const click=window.testClick;click(`[data-ci-group="${groupId}"]`);click('[data-ci-section="2"]');click(`[data-ci-path="${pathId}"]`);
 if(document.querySelector('.lesson-completion-summary'))throw Error('Early integrated completion');
 const p=chapterIntegration.groups.find(g=>g.id===groupId).paths.find(p=>p.id===pathId);
 for(const s of p.steps){for(const role of s.askFirst?['spoken','heard']:['heard','spoken'])click(`[data-ci-gate="${role}"]`);click(`[data-ci-choice="${s.valid[0]}"]`);click('[data-ci-next]');}
 return p.steps;
}
function finishHotel({groupId,flowId,routeId,scenarioId,decision}){
 const click=window.testClick;click(`[data-hi-group="${groupId}"]`);click('[data-hi-page="2"]');
 let steps,prefix,next;
 if(groupId==='checkin'){
  click(`[data-hi-route="${routeId}"]`);click(`[data-hi-flow-scenario="${scenarioId}"]`);
  const c=hotelIntegration.scenarios.find(c=>c.id===scenarioId);
  steps=hotelIntegration.practice.flowRoutes.find(r=>r.id===routeId).order.map(k=>c.steps.find(s=>s.key===k));prefix='hi';next='hi-flow-next';
 }else{
  click(`[data-hx-flow="${flowId}"]`);steps=hotelIntegration.extended.groups.find(g=>g.id===groupId).flows.find(f=>f.id===flowId).steps;prefix='hx';next='hx-next';
 }
 const completed=[];
 for(const s of steps){
  const roles=s.askFirst?['spoken','heard']:['heard','spoken'];
  for(const role of roles){if(role==='spoken'&&s.decisions)click(`[data-hx-decision="${decision}"]`);click(`[data-${prefix}-gate="${role}"]`);}
  if(!s.decisions)click(`[data-${prefix}-choice="${s.valid[0]}"]`);
  click(`[data-${next}]`);completed.push(s.decisions?{...s,...s.decisions[decision]}:s);
 }
 return completed;
}
async function review(p,steps,label){
 const actual=await p.evaluate(()=>{
  const root=document.querySelector('.lesson-completion-summary,.d2-completion-lines');if(!root)throw Error('Missing completion summary');
  const goals=[...root.querySelectorAll('.lesson-completion-goals > li,[data-d2-review-goal]')],english=[...root.querySelectorAll('.lesson-completion-english > li,[data-d2-review-answer]')];
  return {goals:goals.map(e=>e.textContent),english:english.map(e=>e.textContent),weights:[...goals,...english].map(e=>getComputedStyle(e).fontWeight),visible:[...goals,...english].every(e=>e.getClientRects().length>0),details:!!root.closest('details')};
 });
 assert.deepEqual(actual.goals,steps.map(s=>s.label||s.task),label+' Chinese order');assert.deepEqual(actual.english,steps.map(s=>s.answer),label+' English order');
 assert(actual.visible&&!actual.details,label+' immediately visible');assert(actual.weights.every(w=>w==='400'),label+' normal font weight');
}
async function layouts(p,name){
 for(const [width,theme,size] of [[1280,'light','standard'],[1280,'dark','standard'],[390,'light','standard'],[390,'dark','large']]){
  await p.setViewportSize({width,height:900});
  await p.evaluate(({theme,size})=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size=size;appearance();},{theme,size});
  const state=await p.locator('.lesson-completion-summary,.d2-completion-lines').evaluate(el=>({width:innerWidth,scroll:document.documentElement.scrollWidth,weights:[...el.querySelectorAll('li')].map(e=>getComputedStyle(e).fontWeight),bad:[...el.querySelectorAll('li')].filter(e=>{const r=e.getBoundingClientRect();return r.left<0||r.right>innerWidth+1;}).length}));
  assert(state.scroll<=state.width+1,name+' page fits');assert.equal(state.bad,0,name+' lists fit');assert(state.weights.every(w=>w==='400'));
  await p.locator('.lesson-completion-summary,.d2-completion-lines').scrollIntoViewIfNeeded();
  const shot=`${name}-${width}-${theme}-${size}.png`;await p.screenshot({path:path.join(out,shot),fullPage:true});report.screenshots.push(shot);report.layoutChecks++;
 }
 await p.setViewportSize({width:1280,height:900});
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:900}}),p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));
  await p.addInitScript('window.testClick='+clickBrowser.toString());
  for(let day=2;day<=12;day++){
   await p.goto(pathToFileURL(path.join(root,fileFor(day))).href);
   const routes=await p.evaluate(()=>course.day===2?day2Practice.scenes.map(s=>({flowIndex:flows.findIndex(f=>f.id===s.flowId),sceneId:s.id})):flows.map((_,flowIndex)=>({flowIndex})));
   for(const route of routes){const steps=await p.evaluate(finishOrdinary,route);await review(p,steps,`Day ${day} ${JSON.stringify(route)}`);report.ordinary++;if((day===2&&route.sceneId==='mug')||(day===3&&route.flowIndex===0))await layouts(p,`day${day}-ordinary`);}
   const groups=await p.evaluate(()=>typeof chapterIntegration==='object'?chapterIntegration.groups:[]);
   for(const g of groups)for(const route of g.paths){const steps=await p.evaluate(finishChapter,{groupId:g.id,pathId:route.id});await review(p,steps,`Day ${day} ${g.id} ${route.id}`);report.integrated++;}
   if(day===2)await layouts(p,'day2-integrated');
   if(day===8){
    const hotel=await p.evaluate(()=>hotelIntegration);
    for(const route of hotel.practice.flowRoutes)for(const c of hotel.scenarios){const steps=await p.evaluate(finishHotel,{groupId:'checkin',routeId:route.id,scenarioId:c.id});await review(p,steps,'Hotel '+route.id+' '+c.id);report.hotel++;}
    for(const g of hotel.extended.groups)for(const f of g.flows){
     const branching=f.steps.find(s=>s.decisions);const choices=branching?branching.allowed:[0];
     for(const decision of choices){const steps=await p.evaluate(finishHotel,{groupId:g.id,flowId:f.id,decision});await review(p,steps,'Hotel '+g.id+' '+f.id+' '+decision);report.hotel++;}
    }
    await layouts(p,'day8-integrated');
   }
   console.log('Day '+day+' completion routes passed');
  }
  assert.deepEqual(report.errors,[],'Browser errors');fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
