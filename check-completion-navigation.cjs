'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/completion-navigation');fs.mkdirSync(out,{recursive:true});
const files=fs.readdirSync('.').filter(f=>/^travel-english.*\.html$/.test(f));
const norm=s=>s.replace(/\r\n/g,'\n');
const strip=s=>s.replace(/<style id="completion-navigation-styles">[\s\S]*?<\/style>\n?/g,'').replace(/<script id="completion-navigation-runtime">[\s\S]*?<\/script>\n?/g,'');
for(const file of files){
 const html=norm(fs.readFileSync(file,'utf8')),before=path.join(out,'before',file);
 if(fs.existsSync(before))assert(strip(html)===strip(norm(fs.readFileSync(before,'utf8'))),'Only completion navigation changed: '+file);
 assert(html.includes(norm(fs.readFileSync('assets/completion-navigation.js','utf8'))));
 assert(html.includes(norm(fs.readFileSync('assets/completion-navigation.css','utf8'))));
 for(const s of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(s[1]);
}
for(const entry of JSON.parse(fs.readFileSync('sw.js','utf8').match(/const FILES = (\[[\s\S]*?\]);/)[1])){
 let bytes=fs.readFileSync(entry.path);if(entry.normalizedText)bytes=Buffer.from(bytes.toString('utf8').replace(/\r\n?/g,'\n'));
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256,entry.path+' cache hash');
}
const source=fs.readFileSync('check-completion-review.cjs','utf8');
const drivers=new Function(source.slice(source.indexOf('function clickBrowser('),source.indexOf('async function review('))+';return {clickBrowser,finishOrdinary,finishChapter,finishHotel};')();
const report={files:files.length,ordinary:0,chapter:0,hotel:0,layouts:0,navigation:0,errors:[],screenshots:[]};
async function verify(p,label){
 assert.equal(await p.locator('.completion-section-nav').count(),1,label+' shared bottom navigation');
 assert.deepEqual(await p.locator('.completion-section-nav > button').allTextContents(),['← 返回 02｜把句子帶著走','前往 04｜看情境，自己選用 →']);
 assert.equal(await p.locator('.completion-retry').count(),1,label+' single retry');
 assert.equal(await p.locator('.completion-retry-actions [data-page="3"],.completion-retry-actions [data-ci-section="3"],.completion-retry-actions [data-hi-page="3"]').count(),0,label+' forward action moved out of card');
 assert.equal(await p.locator('#main .footer-actions button').count(),2,label+' no duplicate footer actions');
 await p.evaluate(()=>{const before=JSON.stringify({...localStorage});render();if(JSON.stringify({...localStorage})!==before)throw Error('Presentation changes saved records');});
}
async function geometry(p,label){
 const g=await p.evaluate(()=>{
  const rect=e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height};};
  const row=document.querySelector('.completion-section-nav'),actions=document.querySelector('.completion-retry-actions');
  return{row:rect(row),buttons:[...row.children].map(rect),actions:rect(actions),retry:rect(document.querySelector('.completion-retry')),width:innerWidth,scroll:document.documentElement.scrollWidth};
 });
 const [back,next]=g.buttons;
 assert(Math.abs(back.left-g.row.left)<2,label+' back at far left');
 assert(Math.abs(next.right-g.row.right)<2,label+' next at far right');
 assert(Math.abs(back.top-next.top)<2&&back.right<=next.left,label+' same row without overlap');
 assert(Math.abs(g.retry.right-g.actions.right)<2,label+' retry at far right');
 assert(back.height>=48&&next.height>=48,label+' touch targets');
 assert(g.scroll<=g.width+1,label+' no horizontal overflow');
}
async function layouts(p,label){
 for(const [width,theme,size]of [[1280,'light','standard'],[820,'dark','large'],[390,'light','large'],[390,'dark','large'],[320,'dark','large']]){
  await p.setViewportSize({width,height:1100});await p.evaluate(({theme,size})=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size=size;},{theme,size});
  await geometry(p,label+width+theme);
  await p.locator('.completion-retry').hover();await p.locator('.completion-section-nav > button').last().focus();
  await p.locator('.completion-section-nav').scrollIntoViewIfNeeded();
  const shot=label+'-'+width+'-'+theme+'.png';await p.screenshot({path:path.join(out,shot)});report.screenshots.push(shot);
  const summary=p.locator('.tc-steps > summary,.d1-completion-steps > summary,.d2-result-steps > summary').first();
  if(await summary.count()){
   await summary.press('Enter');assert(await summary.evaluate(e=>e.parentElement.open));await geometry(p,label+' expanded');
   await summary.scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,label+'-expanded-'+width+'-'+theme+'.png')});
   await summary.press('Enter');
  }
  report.layouts++;
 }
 await p.setViewportSize({width:1280,height:1100});await p.evaluate(()=>{document.documentElement.dataset.size='standard';});
}
async function navigation(p,label){
 const attr=await p.locator('.completion-section-nav > button').last().evaluate(e=>['data-page','data-ci-section','data-hi-page'].find(a=>e.hasAttribute(a)));
 const complete=()=>p.evaluate(a=>window.testClick('['+a+'="2"]'),attr);
 await p.locator('.completion-section-nav > button').first().click();assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),'2',label+' back goes to Part 02');
 await complete();await verify(p,label+' after returning');
 await p.locator('.completion-section-nav > button').last().press('Enter');assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),'4',label+' forward goes to Part 04');
 await complete();const saved=await p.evaluate(()=>JSON.stringify({...localStorage}));await p.locator('.completion-retry').click();
 assert.equal(await p.locator('.completion-section-nav').count(),0,label+' retry returns to practice');
 assert.equal(await p.evaluate(()=>JSON.stringify({...localStorage})),saved,label+' retry preserves saved records');report.navigation++;
}
function finishDay1(index){
 setRound(index);dgResetPrelude();start(index);navigate(2);
 const f=flows[index],click=window.testClick;
 if(f.prelude){click('[data-dg-prelude-heard]');click(`[data-dg-prelude-choice="${f.prelude.correct}"]`);click('[data-dg-prelude-next]');}
 for(const s of f.steps){for(const id of s.askFirst?['spoken','heard']:['heard','spoken'])click('#'+id);click(`[data-choice="${s.valid[0]}"]`);click('[data-act="next"]');}
}
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await b.newPage({viewport:{width:1280,height:1100},reducedMotion:'reduce'});p.setDefaultTimeout(6000);p.on('pageerror',e=>report.errors.push(e.message));await p.addInitScript('window.testClick='+drivers.clickBrowser.toString());
  for(const file of files){
   await p.goto(pathToFileURL(path.resolve(file)).href);
   const day=await p.evaluate(()=>course.day);
   const routes=await p.evaluate(()=>course.day===2?day2Practice.scenes.map(s=>({flowIndex:flows.findIndex(f=>f.id===s.flowId),sceneId:s.id})):flows.map((_,flowIndex)=>({flowIndex})));
   for(const route of routes){
    if(day===1)await p.evaluate(finishDay1,route.flowIndex);else await p.evaluate(drivers.finishOrdinary,route);
    const label='day'+day+'-'+(route.sceneId||route.flowIndex);await verify(p,label);await geometry(p,label);report.ordinary++;
    if(day===8&&route.flowIndex===5||[1,2,12].includes(day)&&route===routes[0])await layouts(p,label);
    if(route===routes.at(-1))await navigation(p,label);
   }
   const groups=await p.evaluate(()=>typeof chapterIntegration==='object'?chapterIntegration.groups:[]);
   for(const g of groups)for(const r of g.paths){
    await p.evaluate(drivers.finishChapter,{groupId:g.id,pathId:r.id});const label='day'+day+'-chapter-'+r.id;await verify(p,label);await geometry(p,label);report.chapter++;
    if(day===1&&g===groups[0]&&r===g.paths[0])await layouts(p,label);
    await navigation(p,label);
   }
   if(day===8){
    const h=await p.evaluate(()=>hotelIntegration);
    for(const route of h.practice.flowRoutes)for(const c of h.scenarios){await p.evaluate(drivers.finishHotel,{groupId:'checkin',routeId:route.id,scenarioId:c.id});await verify(p,'hotel checkin');await geometry(p,'hotel checkin');report.hotel++;}
    await layouts(p,'day8-checkin');await navigation(p,'hotel checkin');
    for(const g of h.extended.groups)for(const f of g.flows){const branch=f.steps.find(s=>s.decisions);for(const decision of branch?branch.allowed:[0]){await p.evaluate(drivers.finishHotel,{groupId:g.id,flowId:f.id,decision});await verify(p,'hotel '+g.id);await geometry(p,'hotel '+g.id);report.hotel++;}}
    await layouts(p,'day8-extended');await navigation(p,'hotel extended');
   }
   console.log('PASS '+file);
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,screenshots:report.screenshots.length}));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
