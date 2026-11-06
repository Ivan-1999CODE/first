'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=__dirname,out=path.join(root,'outputs/integrated-completion-columns'),before=path.join(out,'before');
const read=f=>fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n');
const fileFor=day=>day===1?'travel-english.html':require('./assets/micro-curriculum.cjs').make(day).file||'travel-english-unit2-shopping.html';
function checkScope(){
 if(!fs.existsSync(before))return 0;
 let count=0;
 const helper=read(path.join(root,'assets/integrated-completion.js')),css=read(path.join(root,'assets/integrated-completion.css'));
 const changed=/^travel-english(?:\.html|-unit(?:3|4|5|6|7|8|9|11)-)/;
 for(const file of fs.readdirSync(before).filter(f=>f.endsWith('.html'))){
  let expected=read(path.join(before,file));
  if(file==='travel-english-unit2-shopping.html')expected=read(path.join(out,'concurrent-day2.html'));
  else if(changed.test(file)){
   if(file.includes('unit8-')){
    for(const name of ['day8-complete.js','day8-integration.js']){const old=read(path.join(before,'assets',name));assert(expected.includes(old));expected=expected.replace(old,()=>(name==='day8-complete.js'?helper+'\n':'')+read(path.join(root,'assets',name)));}
    expected=expected.replace(/(<style id="day8-integration-styles">)([\s\S]*?)(<\/style>)/,(_,a,b,c)=>a+b+css+'\n'+c);
   }else{
    if(file==='travel-english.html'){
     const old=expected.match(/^  if\(f.done\)return top\+.*$/m)[0];
     expected=expected.replace(old,()=>read(path.join(root,'assets/chapter-integration.js')).split('\n').filter(x=>/^  if\(f.done/.test(x)).join('\n'));
     expected=expected.replace('// An isolated seven-part practice owner.',()=>helper+'\n// An isolated seven-part practice owner.');
    }else{
     let old=read(path.join(before,'assets/chapter-integration.js'));if(!expected.includes(old))old=old.replace(/^  if\(f.done&&data.day===2\).*\n/m,'');assert(expected.includes(old));
     expected=expected.replace(old,()=>helper+'\n'+read(path.join(root,'assets/chapter-integration.js')));
    }
    expected=expected.replace(/(<style id="chapter-integration-styles">)([\s\S]*?)(<\/style>)/,(_,a,b,c)=>a+b+'\n'+css+c);
   }
  }
  assert.equal(read(path.join(root,file))===expected,true,'Only integrated completion presentation may change: '+file);count++;
 }
 return count;
}
module.exports={checkScope};
if(require.main===module){
 const protectedFiles=checkScope();
 for(let day=1;day<=12;day++)for(const script of read(path.join(root,fileFor(day))).matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
 if(process.argv.includes('--static')){console.log('PASS preservation and syntax: '+protectedFiles+' HTML files');process.exit(0);}
 // Reuse the existing real-event finish drivers; do not inject completion flags.
 const source=read(path.join(root,'check-completion-review.cjs'));
 const drivers=new Function(source.slice(source.indexOf('function clickBrowser('),source.indexOf('async function review('))+'\nreturn {clickBrowser,finishOrdinary,finishChapter,finishHotel};')();
 const report={ordinary:0,integrated:0,hotel:0,layouts:0,protectedFiles,errors:[],screenshots:[]};
 function day1Finish(index){const click=window.testClick;start(index);const f=flows[flow];if(f.prelude){click('[data-dg-prelude-heard]');click(`[data-dg-prelude-choice="${f.prelude.correct}"]`);click('[data-dg-prelude-next]');}for(const s of f.steps){for(const id of s.askFirst?['spoken','heard']:['heard','spoken'])click('#'+id);click(`[data-choice="${s.valid[0]}"]`);click('[data-act="next"]');}if(!finished)throw Error('Day 1 not finished');return f.steps;}
 async function verify(p,steps,name,day1Ordinary=false){
  const state=await p.evaluate(()=>{
   const root=document.querySelector('.dg-completion');if(!root)throw Error('No two-panel completion');
   const panels=[...root.querySelectorAll(':scope > section.panel')],rects=panels.map(e=>e.getBoundingClientRect());
   const goals=[...root.querySelectorAll('.lesson-completion-goals > li,.dg-completion-goals > li,[data-d2-review-goal]')],english=[...root.querySelectorAll('.lesson-completion-english > li,.dg-completion-english > li,[data-d2-review-answer]')];
   return {columns:rects.length===2&&Math.abs(rects[0].top-rects[1].top)<2&&rects[1].left>=rects[0].right,goals:goals.map(e=>e.textContent),english:english.map(e=>e.textContent),weights:[...goals,...english].map(e=>getComputedStyle(e).fontWeight),figures:[...panels[1]?.querySelectorAll('.vf-final figure')||[]].map(e=>({caption:e.querySelector('figcaption').textContent,art:!!e.querySelector('svg,img,.vf-food-image[role="img"]'),artLabel:e.querySelector('svg')?.getAttribute('aria-label')})),results:!!panels[1]?.querySelector('.scene-ledger,.dg-map-state,.rescue-board,.hi-desk,.hx-journal')};
  });
  assert(state.columns,name+' desktop columns');assert.equal(state.goals.length,steps.length);if(!day1Ordinary)assert.deepEqual(state.goals,steps.map(s=>s.label||s.task),name+' Chinese tasks');
  assert.deepEqual(state.english,steps.map(s=>s.answer),name+' English');assert(state.weights.every(w=>w==='400'),name+' normal weight');assert(state.results,name+' result panel');
  const expected=steps.map(s=>s.decisions?s.result:s.objects?s.objects[s.valid[0]][1]:s.options[s.valid[0]]);
  assert.deepEqual(state.figures.map(f=>f.caption),expected,name+' actual choice results');assert(state.figures.every(f=>f.art),name+' all results illustrated');
  for(const [i,s] of steps.entries())if(s.decisions)assert.equal(state.figures[i].artLabel,s.label,name+' decision artwork');
 }
 async function layouts(p,name){
  for(const [width,theme,size] of [[1280,'light','standard'],[1280,'dark','standard'],[820,'dark','large'],[390,'light','large'],[390,'dark','large']]){
   await p.setViewportSize({width,height:1800});
   if(await p.locator('html').getAttribute('data-theme')!==theme)await p.locator('#theme').click();
   if(await p.locator('html').getAttribute('data-size')!==size)await p.locator('#large').click();
   await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
   const x=await p.locator('.dg-completion').evaluate(e=>{const panels=[...e.querySelectorAll(':scope > section.panel')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};});return {panels,width:innerWidth,scroll:document.documentElement.scrollWidth,bad:[...e.querySelectorAll('.lesson-completion-summary li,.vf-final figure')].filter(e=>{const r=e.getBoundingClientRect();return r.x<0||r.right>innerWidth+1;}).length};});
   assert(x.scroll<=x.width+1&&x.bad===0,name+' viewport bounds');const [left,right]=x.panels;
   if(width===390||(width===820&&size==='large'))assert(right.y>=left.bottom&&Math.abs(left.x-right.x)<2,name+' narrow / large-text stack');else assert(Math.abs(left.y-right.y)<2&&right.x>=left.right,name+' two columns');
   const file=`${name}-${width}-${theme}-${size}.png`;await p.screenshot({path:path.join(out,file),fullPage:true});report.screenshots.push(file);report.layouts++;
  }
  await p.setViewportSize({width:1280,height:1800});if(await p.locator('html').getAttribute('data-size')!=='standard')await p.locator('#large').click();
 }
 (async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
  const p=await browser.newPage({viewport:{width:1280,height:1800},reducedMotion:'reduce'});p.on('pageerror',e=>report.errors.push(e.message));await p.addInitScript('window.testClick='+drivers.clickBrowser.toString());
  for(let day=1;day<=12;day++){
   await p.goto(pathToFileURL(path.join(root,fileFor(day))).href);
   const data=await p.evaluate(()=>({routes:typeof day2Practice==='object'?day2Practice.scenes.map(s=>({flowIndex:flows.findIndex(f=>f.id===s.flowId),sceneId:s.id})):flows.map((_,flowIndex)=>({flowIndex})),groups:typeof chapterIntegration==='object'?chapterIntegration.groups:[],hotel:typeof hotelIntegration==='object'?hotelIntegration:null}));
   for(const r of data.routes){const steps=day===1?await p.evaluate(day1Finish,r.flowIndex):await p.evaluate(drivers.finishOrdinary,r);await verify(p,steps,`Day ${day} ordinary ${r.flowIndex}/${r.sceneId||''}`,day===1);report.ordinary++;}
   for(const g of data.groups)for(const [i,r] of g.paths.entries()){
    const steps=await p.evaluate(drivers.finishChapter,{groupId:g.id,pathId:r.id});await verify(p,steps,`Day ${day} ${g.id}/${r.id}`);report.integrated++;
    if((day===1||day===3)&&g===data.groups[0]&&i===0){await layouts(p,'day'+day+'-integrated');await p.locator('.ci-complete [data-ci-restart]').click();assert.equal(await p.locator('.dg-completion').count(),0);const again=await p.evaluate(drivers.finishChapter,{groupId:g.id,pathId:r.id});await verify(p,again,'restarted '+day);await p.locator('.ci-complete [data-ci-section="3"]').click();assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),'4');}
   }
   if(data.hotel){
    const hotel=data.hotel;
    for(const route of hotel.practice.flowRoutes)for(const c of hotel.scenarios){const steps=await p.evaluate(drivers.finishHotel,{groupId:'checkin',routeId:route.id,scenarioId:c.id});await verify(p,steps,'Hotel '+route.id+'/'+c.id);report.hotel++;}
    await layouts(p,'day8-checkin');
    for(const g of hotel.extended.groups){
     for(const f of g.flows)for(const decision of f.steps.find(s=>s.decisions)?.allowed||[0]){const steps=await p.evaluate(drivers.finishHotel,{groupId:g.id,flowId:f.id,decision});await verify(p,steps,'Hotel '+g.id+'/'+f.id+'/'+decision);report.hotel++;}
     await layouts(p,'day8-'+g.id);
    }
   }
   console.log('Day '+day+' completion columns passed');
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
}
