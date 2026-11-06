'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('outputs/all-days-completion'),before=path.join(out,'before');
// Historical preservation checks require the local pre-edit snapshots.
// The default run verifies the current build and remains usable after checkout.
const compareBaseline=process.argv.includes('--baseline');
fs.mkdirSync(out,{recursive:true});
const read=f=>fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n');
const fileFor=day=>require('./assets/micro-curriculum.cjs').make(day).file||'travel-english-unit2-shopping.html';
const strip=html=>html.replace(/<style id="task-completion-styles">[\s\S]*?<\/style>\n?/g,'').replace(/<script id="task-completion-runtime">[\s\S]*?<\/script>\n?/g,'').replace(/^  if\(f.done&&data.day===2\)return top\+.*\n/gm,'');
const report={ordinary:0,integrated:0,hotel:0,alternativeChoices:0,layouts:0,expanded:0,navigation:0,protectedFiles:0,concurrentSourceChanges:[],errors:[],screenshots:[]};
const changed=new Set(['build-task-rounds.cjs','assets/chapter-integration.js',...Array.from({length:13},(_,i)=>fileFor(i+2))]);
if(compareBaseline)for(const item of JSON.parse(read(path.join(before,'hashes.json')).replace(/^\uFEFF/,''))){
 if(changed.has(item.File.replaceAll('\\','/')))continue;
 const hash=crypto.createHash('sha256').update(fs.readFileSync(item.File)).digest('hex').toUpperCase();
 if(hash!==item.Hash&&item.File.startsWith('assets')){report.concurrentSourceChanges.push(item.File);continue;}
 assert.equal(hash,item.Hash,'Protected file '+item.File);report.protectedFiles++;
}
for(let day=2;day<=14;day++){
 const file=fileFor(day),html=read(file);
 // Day 6 was independently rebuilt with the ready-to-order revision while
 // this presentation task was running. Keep that observed revision intact.
 const reference=day===6?'concurrent-day6.html':file;
 if(compareBaseline)assert.equal(strip(html)===strip(read(path.join(before,reference))),true,'Only completion presentation changes: '+file);
 assert(html.includes(read('assets/task-completion.js'))&&html.includes(read('assets/task-completion.css')),'Current assets embedded');
 for(const script of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
}
const source=read('check-completion-review.cjs');
const driverCode=source.slice(source.indexOf('function clickBrowser('),source.indexOf('async function review('));
const drivers=new Function(driverCode+'\nreturn {clickBrowser,finishOrdinary,finishChapter,finishHotel};')();
const finishAlternative=new Function(driverCode.replaceAll('s.valid[0]','s.valid.at(-1)')+'\nreturn finishOrdinary;')();
async function verify(p,steps,name){
 const multi=await p.locator('.d2-practice-multi').count()>0;
 const frame=p.locator(multi?'.d2-scene-frame':'.tc-frame');
 assert.equal(await frame.count(),1,name+' single completion frame');
 assert.deepEqual(await frame.locator(multi?'[data-d2-review-goal]':'.tc-goal').allTextContents(),steps.map(s=>s.label||s.task),name+' Chinese tasks');
 assert.deepEqual(await frame.locator(multi?'[data-d2-review-answer]':'.tc-answer').allTextContents(),steps.map(s=>s.answer),name+' resolved English');
 const details=frame.locator(multi?'.d2-result-steps':'.tc-steps');
 assert(await details.evaluate(e=>!e.open),name+' records start collapsed');
 assert.equal(await details.locator('figure').count(),steps.length,name+' all selected records retained');
 assert(await details.locator('figure').evaluateAll(es=>es.every(e=>e.querySelector('svg,img,[role="img"]'))),name+' record artwork');
 assert.equal(await frame.locator('.tc-status,.d2-scene-status').count(),1);
 if(!multi){
  const summary=frame.locator('.tc-result');
  assert(await summary.locator('.scene-ledger,.rescue-board,.hi-desk,.hx-journal,.scene-state').count()>0,name+' actual result board');
  assert.equal(await p.locator('#main .footer-actions [data-page="3"],#main .footer-actions [data-ci-section="3"],#main .footer-actions [data-hi-page="3"]').count(),1,name+' one next-section action in bottom navigation');
 }
 const columns=await frame.locator(multi?'.d2-completion > section':'.tc-grid > section').evaluateAll(es=>es.map(e=>({x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,right:e.getBoundingClientRect().right})));
 assert.equal(columns.length,2);assert(Math.abs(columns[0].y-columns[1].y)<2&&columns[1].x>=columns[0].right,name+' two desktop columns');
}
async function shot(p,name){const file=path.join(out,name+'.png');await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:file,fullPage:true});report.screenshots.push(file);}
async function layouts(p,name){
 for(const [width,theme,size] of [[1280,'light','standard'],[1280,'dark','standard'],[820,'dark','large'],[390,'light','large'],[390,'dark','large']]){
  await p.setViewportSize({width,height:1300});
  if(await p.locator('html').getAttribute('data-theme')!==theme)await p.locator('#theme').click();
  if(await p.locator('html').getAttribute('data-size')!==size)await p.locator('#large').click();
  const frame=p.locator('.tc-frame,.d2-scene-frame'),details=frame.locator('.tc-steps,.d2-result-steps');
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' fits '+width);
  const color=await frame.locator('.tc-status,.d2-scene-status').evaluate(el=>{const st=getComputedStyle(el),lum=v=>v.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((a,n,i)=>a+n*[.2126,.7152,.0722][i],0);const a=lum(st.color),b=lum(st.backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);});
  assert(color>=4.5,'Status contrast');
  await shot(p,`${name}-${width}-${theme}-${size}`);
  await details.locator('summary').hover();await details.locator('summary').focus();await p.keyboard.press('Enter');
  assert(await details.evaluate(e=>e.open));assert(await details.locator('.vf-final').isVisible());
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Expanded records fit');
  await shot(p,`${name}-${width}-${theme}-${size}-expanded`);
  await details.locator('summary').focus();await p.keyboard.press('Enter');assert(await details.evaluate(e=>!e.open));
  report.layouts++;report.expanded++;
 }
 await p.setViewportSize({width:1280,height:1300});
 if(await p.locator('html').getAttribute('data-size')==='large')await p.locator('#large').click();
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:1300},reducedMotion:'reduce'}),p=await context.newPage();
  p.on('pageerror',e=>report.errors.push(e.message));await p.addInitScript('window.testClick='+drivers.clickBrowser.toString());
  for(let day=2;day<=12;day++){
   await p.goto(pathToFileURL(path.resolve(fileFor(day))).href);
   await p.evaluate(()=>{state.answers['before']='既有紀錄保留';save();});
   const routes=await p.evaluate(()=>course.day===2?day2Practice.scenes.map(s=>({flowIndex:flows.findIndex(f=>f.id===s.flowId),sceneId:s.id})):flows.map((_,flowIndex)=>({flowIndex})));
   for(const route of routes){
    const steps=await p.evaluate(drivers.finishOrdinary,route);await verify(p,steps,`Day ${day} ${JSON.stringify(route)}`);report.ordinary++;
    const expected=await p.evaluate(()=>{const f=flows[flow],s=typeof day2Practice==='object'?day2Practice.scenes.find(s=>s.id===document.querySelector('[data-d2-active]')?.dataset.d2Active):null;return vfHistory(f,history).filter((r,i)=>!s||(i>=s.start&&i<=s.end)).map(r=>r.label);});
    // Bounded Day 2 histories are sparse; verify selected values against each
    // resolved step directly instead of compacted global history indices.
    const actual=await p.locator('.tc-steps figcaption,.d2-result-steps figcaption').allTextContents();
    if(day!==2)assert.deepEqual(actual,expected,'Actual recorded choices');
    if(route===routes[0]||day===2&&route.sceneId==='budget')await layouts(p,`day${day}-${route.sceneId||'task-A'}`);
    if(route===routes.at(-1)){
     const next=p.locator('.completion-section-nav [data-page="3"]');
     if(await next.count()){await next.click();assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),'4');report.navigation++;await p.evaluate(()=>navigate(2));}
     const restart=p.locator('.tc-footer [data-start],.tc-footer [data-d2-restart],.d2-scene-footer [data-d2-restart]');
     await restart.click();assert.equal(await p.locator('.tc-frame').count(),0);assert(await p.locator('[data-act="next"]').isDisabled());report.navigation++;
    }
   }
   if(day!==2){
    const alternatives=await p.evaluate(()=>flows.map((f,flowIndex)=>({flowIndex,alternative:f.steps.some(s=>s.valid.length>1)})).filter(x=>x.alternative));
    for(const route of alternatives){const steps=await p.evaluate(finishAlternative,route);await verify(p,steps,`Day ${day} alternative`);const actual=await p.locator('.tc-steps figcaption').allTextContents(),expected=await p.evaluate(()=>vfHistory(flows[flow],history).map(r=>r.label));assert.deepEqual(actual,expected);report.alternativeChoices++;}
   }
   const groups=await p.evaluate(()=>typeof chapterIntegration==='object'?chapterIntegration.groups:[]);
   for(const g of groups)for(const route of g.paths){
    const steps=await p.evaluate(drivers.finishChapter,{groupId:g.id,pathId:route.id});await verify(p,steps,`Day ${day} integrated ${route.id}`);report.integrated++;
    if(day===2&&g===groups[0]&&route===g.paths[0])await layouts(p,'day2-integrated');
    await p.locator('.completion-section-nav [data-ci-section="3"]').click();assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),'4');await p.evaluate(()=>window.testClick('[data-ci-section="2"]'));await p.locator('[data-ci-restart]').click();assert.equal(await p.locator('.tc-frame').count(),0);report.navigation++;
   }
   if(day===8){
    const hotel=await p.evaluate(()=>hotelIntegration);
    for(const route of hotel.practice.flowRoutes)for(const c of hotel.scenarios){const steps=await p.evaluate(drivers.finishHotel,{groupId:'checkin',routeId:route.id,scenarioId:c.id});await verify(p,steps,'Hotel '+route.id+' '+c.id);report.hotel++;}
    await layouts(p,'day8-checkin-integrated');
    for(const g of hotel.extended.groups)for(const f of g.flows){const branching=f.steps.find(s=>s.decisions);for(const decision of branching?branching.allowed:[0]){const steps=await p.evaluate(drivers.finishHotel,{groupId:g.id,flowId:f.id,decision});await verify(p,steps,'Hotel '+g.id+' '+f.id+' '+decision);report.hotel++;}}
    await layouts(p,'day8-extended-integrated');
    await p.locator('.completion-section-nav [data-hi-page="3"]').click();assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),'4');report.navigation++;
   }
   assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem(course.id)).answers['before']),'既有紀錄保留');
   await p.reload();assert.equal(await p.evaluate(()=>state.answers['before']),'既有紀錄保留');
   console.log('PASS Day '+day+' finish, navigation, records and layout');
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,screenshots:report.screenshots.length},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
