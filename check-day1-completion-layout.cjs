'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('outputs/day1-completion-layout'),capture=process.argv.includes('--capture');
fs.mkdirSync(out,{recursive:true});
const file='travel-english.html',read=p=>fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n'),html=read(file);
const data=key=>JSON.parse(html.match(new RegExp('(?:^|[>\\n])const '+key+'=(.*);(?:\\r?\\n|<)'))[1]);
const rounds=data('rounds'),flows=data('flows'),pairs=data('pairs');
const report={tasks:[],layouts:0,expandedDetails:0,errors:[],screenshots:[]};
if(!capture){
 for(const s of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(s[1]);
 assert(html.includes(read('assets/day1-completion.js')));
 assert(html.includes(read('assets/day1-completion.css')));
 const beforeFile=path.join(out,'before/travel-english.html');
 if(!process.argv.includes('--runtime-only') && fs.existsSync(beforeFile)){
  const stripped=html.replace(/<style id="day1-completion-styles">[\s\S]*?<\/style>/,'').replace(/<script id="day1-completion-runtime">[\s\S]*?<\/script>/,'');
  const hashes=JSON.parse(read(path.join(out,'before/hashes.json')).replace(/^\uFEFF/,''));
  for(const item of hashes.filter(x=>x.Path!==path.resolve(file)))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(item.Path)).digest('hex').toUpperCase(),item.Hash,'Protected file changed: '+item.Path);
  // The pre-existing Day 1 HTML still contained an older bag illustration.
  // A normal build embeds the already-updated shared asset. Its source hash is
  // protected above; the Day 1 curriculum contains no bag choices.
  const oldIllustrations=/\/\/ Data-authored comparison drawings[\s\S]*?(?=\nload\(\);render\(\);appearance\(\);)/;
  const expected=read(beforeFile).replace(oldIllustrations,()=>read('assets/interactive-choice-art.js'));
  assert.equal(stripped===expected,true,'Only scoped completion assets and the pre-existing shared illustration version may differ');
  report.protectedFiles=hashes.length-1;
 }
}
async function finish(p,index){
 await p.evaluate(i=>{setRound(i);dgResetPrelude();start(i);navigate(2);},index);
 assert.equal(await p.locator('.d1-completion-frame').count(),0,'No completion content while practicing');
 const f=flows[index];
 if(f.prelude){
  assert(await p.locator('[data-dg-prelude-next]').isDisabled());
  await p.locator('[data-dg-prelude-heard]').click();
  await p.locator(`[data-dg-prelude-choice="${f.prelude.correct}"]`).click();
  await p.locator('[data-dg-prelude-next]').click();
 }
 for(const s of f.steps){
  assert(await p.locator('[data-choice]').evaluateAll(es=>es.every(e=>e.disabled)));
  for(const id of s.askFirst?['spoken','heard']:['heard','spoken'])await p.locator('#'+id).click();
  const wrong=s.objects.findIndex((_,i)=>!s.valid.includes(i));
  if(wrong>=0){await p.locator(`[data-choice="${wrong}"]`).click();assert(await p.locator('[data-act="next"]').isDisabled());}
  await p.locator(`[data-choice="${s.valid[0]}"]`).click();await p.locator('[data-act="next"]').click();
 }
}
async function screenshot(p,name,frame=false){
 await p.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});});
 if(frame){const rect=await p.locator('.d1-completion-frame').boundingBox();await p.screenshot({path:path.join(out,name+'.png'),clip:rect});}
 else await p.screenshot({path:path.join(out,name+'.png'),fullPage:true});
 report.screenshots.push(name+'.png');
}
async function layout(p,name,width,theme,size){
 await p.setViewportSize({width,height:2200});
 await p.evaluate(({theme,size})=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size=size;appearance();},{theme,size});
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
 const boxes=await p.locator('.d1-completion-grid > section').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
 assert.equal(boxes.length,2);
 assert(boxes.every(r=>r.x>=0&&r.right<=width+1),'Both columns fit the viewport');
 if(width>900)assert(Math.abs(boxes[0].y-boxes[1].y)<2&&boxes[1].x>boxes[0].x,'Desktop retains two columns');
 else assert(boxes[1].y>=boxes[0].bottom,'Narrow screens stack the columns');
 const contrasts=await p.locator('.d1-completion-header').evaluate(header=>{
  const lum=c=>c.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>(v/=255)<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
  return ['#d1-completion-title','.d1-completion-eyebrow','.d1-completion-status'].map(selector=>{const el=header.querySelector(selector),style=getComputedStyle(el),fg=lum(style.color),bg=lum(selector==='.d1-completion-status'?style.backgroundColor:getComputedStyle(header).backgroundColor);return(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);});
 });assert(contrasts.every(x=>x>=4.5),'Task heading and status meet text contrast');
 await screenshot(p,`${name}-${theme}-${width}-${size}`,width>900&&size==='standard');
 const summary=p.locator('.d1-completion-steps > summary');
 await summary.hover();await summary.focus();await p.keyboard.press('Enter');
 assert(await p.locator('.d1-completion-steps').evaluate(e=>e.open));
 assert(await p.locator('.d1-completion-steps .vf-final').isVisible());
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Expanded pictures stay within the viewport');
 await screenshot(p,`${name}-${theme}-${width}-${size}-expanded`);
 await summary.focus();await p.keyboard.press('Enter');
 assert(await p.locator('.d1-completion-steps').evaluate(e=>!e.open));
 report.layouts++;report.expandedDetails++;
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1280,height:2200},reducedMotion:'reduce'});
  p.on('pageerror',e=>report.errors.push(e.message));p.setDefaultTimeout(6000);
  await p.goto(pathToFileURL(path.resolve(file)).href);
  if(capture){await finish(p,0);await p.evaluate(()=>{document.documentElement.dataset.theme='dark';appearance();});await screenshot(p,'before/finish-A-dark');console.log('Captured original completion');return;}
  const original=await p.evaluate(()=>{state.answers['before-A']='保留課前紀錄';state.answers['home-C']='保留課後紀錄';save();return {...state,complete:[]};});
  for(let i=0;i<rounds.length;i++){
   await p.setViewportSize({width:1280,height:2200});await finish(p,i);
   assert.equal(await p.locator('#d1-completion-title').innerText(),rounds[i].name);
   assert.equal(await p.locator('.d1-completion-status').count(),1);
   assert.equal(await p.locator('#main').getByText('前往 04｜看情境，自己選用 →',{exact:true}).count(),1);
   assert.equal(await p.locator('#main > .footer-actions [data-page="3"]').count(),1,'One next-section control in bottom navigation');
   assert.equal(await p.evaluate(()=>document.activeElement.id),'d1-completion-title','Completion focuses the shared heading');
   assert(!/分開練|小情境|1 \/ 3/.test(await p.locator('.d1-completion-frame').innerText()),'Single-task finish has no sub-scenario selector');
   const goals=pairs[rounds[i].pairIds[0]].goals.map(g=>g.replace(/^在得到/,'得到').replace('請老師再說一次','請他人再說一次').replace('請老師在地圖指出來','請他人在地圖中指出來'));
   assert.deepEqual(await p.locator('.d1-completion-goal').allTextContents(),goals);
   assert.deepEqual(await p.locator('.d1-completion-answer').allTextContents(),flows[i].steps.map(s=>s.answer));
   assert(await p.locator('.d1-completion-answer').evaluateAll(es=>es.every(e=>e.getClientRects().length&&!e.closest('details'))));
   assert.deepEqual(await p.locator('.d1-completion-steps figcaption').allTextContents(),flows[i].steps.map(s=>s.objects[s.valid[0]][1]));
   assert(await p.locator('.d1-completion-steps').evaluate(e=>!e.open),'Step review starts collapsed');
   assert.equal(await p.locator('.d1-completion-frame .dg-map-status').count(),0,'Completion status is not duplicated on the map');
   const position=flows[i].steps.filter(s=>s.position).at(-1)?.position;
   if(position)assert((await p.locator('.d1-completion-frame .dg-route').getAttribute('points')).endsWith(`${position[0]},${position[1]===90?72:position[1]===215?146:215}`),'The actual task route is preserved');
   for(const [width,theme,size] of i===0?[[1280,'dark','standard'],[1280,'light','standard'],[1280,'dark','large'],[820,'light','large'],[390,'dark','large'],[390,'light','large']]:[[1280,'dark','standard'],[390,'light','large']])await layout(p,'task-'+rounds[i].id,width,theme,size);
   await p.locator('.completion-section-nav [data-page="3"]').click();assert.equal(await p.evaluate(()=>page),3);
   await p.evaluate(()=>navigate(2));await p.locator('.d1-completion-footer [data-start]').click();
   assert.equal(await p.locator('.d1-completion-frame').count(),0,'Restart returns to practice');
   assert(await p.evaluate(id=>state.complete.includes(id),flows[i].id),'Restart preserves the completion record');
   report.tasks.push(rounds[i].id);
  }
  const after=await p.evaluate(()=>({...state,complete:[]}));assert.deepEqual(after,original,'Other learning records stay intact');
  await p.reload();assert.deepEqual(await p.evaluate(()=>state.complete),flows.map(f=>f.id),'Completion records survive reload');
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{fs.writeFileSync(path.join(out,'failure.txt'),e.stack);console.error(e);process.exitCode=1;});
