const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
process.env.PLAYWRIGHT_BROWSERS_PATH=path.resolve('tmp/playwright-browsers');
const {chromium,webkit}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const catalog=require('./assets/curriculum-original.json');
const files=Array.from({length:15},(_,day)=>day===1?'travel-english.html':catalog.find(x=>x.day===day).file);
for(const file of ['index.html',...files]){
 const html=fs.readFileSync(file,'utf8'),blocks=[...html.matchAll(/<script id="travel-app-navigation">\n([\s\S]*?)<\/script>/g)];
 assert.equal(blocks.length,1,file+' navigation installed once');
 assert.equal(blocks[0][1],fs.readFileSync('assets/app-navigation.js','utf8'),file+' matches navigation source');
}
const phone=process.argv.includes('--phone');
const viewport=phone?{width:390,height:844}:{width:768,height:1024};
const out='tmp/app-navigation-qa'+(phone?'-phone':'');fs.mkdirSync(out,{recursive:true});
const report=[];
const server=http.createServer((req,res)=>{
 let name=new URL(req.url,'http://localhost').pathname.replace(/^\/first\//,'');
 // Match Cloudflare's canonical URLs as well as GitHub's /first/ subdirectory.
 if(name.endsWith('.html')){res.writeHead(302,{Location:'/first/'+name.slice(0,-5)});res.end();return;}
 name+='.html';
 if(![...files,'index.html'].includes(name)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(name));
});
async function active(p){const el=await p.$('#travel-app-views iframe[data-active]');return el?el.contentFrame():p.mainFrame();}
async function day(p,n){await p.waitForFunction(n=>{const f=document.querySelector('#travel-app-views iframe[data-active]');return (f?.contentDocument||document).documentElement.dataset.courseDay===String(n)},n);}
async function selectDay(frame,n){if(!await frame.locator('.unit-menu').evaluate(e=>e.open))await frame.locator('.unit-menu>summary').tap();await frame.locator(`.day-switcher a[href="${files[n]}"]`).tap();}
async function change(p,n){const frame=await active(p);await selectDay(frame,n);await day(p,n);}
async function section(frame,n){if(!await frame.locator('.course-menu').evaluate(el=>el.open))await frame.locator('.course-menu>summary').tap();await frame.locator(`#nav [data-page="${n}"]`).tap();}
async function sameDocument(p){assert.equal(await p.evaluate(()=>window.testIdentity),'same document');assert.equal(await p.evaluate(()=>performance.getEntriesByType('navigation').length),1);}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/first/`;
 try{for(const engine of process.argv.includes('--webkit')?['webkit']:process.argv.includes('--edge')?['chromium']:['chromium','webkit']){
  const browser=await(engine==='webkit'?webkit.launch():chromium.launch({channel:'msedge'}));
  const result={engine,days:[],errors:[]};report.push(result);
  const context=await browser.newContext({viewport,hasTouch:true,isMobile:true});
  await context.addInitScript(()=>{
   window.cancelCount=0;
   const NativeAudio=window.Audio;window.Audio=function(...args){return window.testAudio=new NativeAudio(...args)};
   Object.defineProperty(window,'SpeechSynthesisUtterance',{value:function(text){this.text=text;}});
   Object.defineProperty(window,'speechSynthesis',{value:{paused:false,cancel(){window.cancelCount++},resume(){},getVoices(){return[]},speak(u){u.onstart?.()}}});
  });
  const p=await context.newPage();p.on('pageerror',e=>result.errors.push(e.message));
  try{
   await p.goto(base+files[1]);await p.evaluate(()=>window.testIdentity='same document');
   await p.locator('#field-before').fill('Please help me find the station.');
   await p.locator('#theme').tap();await p.locator('#large').tap();
   await section(p.mainFrame(),2);
   for(const id of await p.evaluate(()=>currentStep().askFirst?['spoken','heard']:['heard','spoken']))await p.locator(`label:has(#${id})`).tap();
   await p.locator(`[data-choice="${await p.evaluate(()=>currentStep().valid[0])}"]`).tap();
   const state=await p.evaluate(()=>({page,turn,heard,spoken,choice,ready:canNext()}));
   await p.locator('#main [data-say]').first().tap();const cancelBefore=await p.evaluate(()=>cancelCount);
   await change(p,2);assert(await p.evaluate(()=>cancelCount)>cancelBefore);
   let f=await active(p);assert.equal(await f.locator('html').getAttribute('data-theme'),'dark');assert.equal(await f.locator('html').getAttribute('data-size'),'large');
   await f.locator('#field-before').fill('I need a medium size.');
   await section(f,1);await f.locator('#main [data-say]').first().tap();
   const stopped=await f.evaluate(()=>cancelCount);await change(p,1);assert(await f.evaluate(()=>cancelCount)>stopped);
   assert.deepEqual(await p.evaluate(()=>({page,turn,heard,spoken,choice,ready:canNext()})),state);
   await p.goBack();await day(p,2);f=await active(p);assert.equal(await f.evaluate(()=>page),1);
   await p.goForward();await day(p,1);await sameDocument(p);
   result.cachedStateAndHistory=true;
   // Every lesson is reached through its visible touch navigation and remains interactive.
   for(const n of [0,2,3,4,5,6,7,8,9,10,11,12,13,14]){
    await change(p,n);f=await active(p);
    assert(p.url().endsWith(files[n]));assert.equal(await f.locator('.day-switcher [aria-current="page"]').count(),1);
    await section(f,1);assert(await f.locator('#main [data-say]').count()>0);
    await section(f,2);
    for(const id of await f.evaluate(()=>currentStep().askFirst?['spoken','heard']:['heard','spoken']))await f.locator(`label:has(#${id})`).tap();
    await f.locator(`[data-choice="${await f.evaluate(()=>currentStep().valid[0])}"]`).tap();
    assert(!await f.locator('[data-act="next"]').isDisabled());await f.locator('[data-act="next"]').tap();
    assert.equal(await f.evaluate(()=>turn),1);
    assert(await p.locator('#travel-app-views>iframe').count()<=2);
    assert(await f.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    result.days.push(n);await sameDocument(p);
   }
   await p.setViewportSize({width:viewport.height,height:viewport.width});assert.equal(await f.evaluate(()=>innerWidth),viewport.height);
   await p.setViewportSize(viewport);
   await f.locator('#theme').tap();await f.locator('#large').tap();
   await change(p,1);assert.equal(await p.locator('html').getAttribute('data-theme'),'light');assert.equal(await p.locator('html').getAttribute('data-size'),'standard');
   await section(p.mainFrame(),0);assert.equal(await p.locator('#field-before').inputValue(),'Please help me find the station.');
   await change(p,2);f=await active(p);assert.equal(await f.locator('#field-before').inputValue(),'I need a medium size.');
   result.evictedAnswersAndAppearance=true;
   await f.locator('.brand').tap();await p.waitForURL(base+'index.html');
   f=await active(p);assert.equal(await f.locator('main').count(),1);
   await f.locator(`main a[href="./${files[1]}"]`).tap();await day(p,1);await sameDocument(p);
   result.homeWithinApp=true;
   await change(p,6);await p.screenshot({path:path.join(out,`${engine}-ipad.png`)});
   await p.reload();await day(p,6);assert.equal(await p.locator('#travel-app-views>iframe').count(),0);result.directReload=true;
   // Slow, failed, cancelled, and superseded requests must retain a usable old lesson.
   await p.goto(base+files[1]);await p.evaluate(()=>window.testIdentity='same document');
   await p.route('**/'+files[11],async r=>{await new Promise(resolve=>setTimeout(resolve,1100));await r.continue();});
   await selectDay(p,11);
   await p.locator('#travel-app-status').waitFor({state:'visible'});
   assert(await p.locator('#field-before').isVisible());await p.locator('#field-before').fill('Keep this while switching.');
   await day(p,11);await sameDocument(p);result.slowKeepsOldContent=true;
   f=await active(p);if(await f.locator('html').getAttribute('data-theme')!=='dark')await f.locator('#theme').tap();
   await p.route('**/'+files[10],r=>r.abort());await changeFailure();
   const statusColors=await p.locator('#travel-app-status').evaluate(e=>{const s=getComputedStyle(e);const probe=document.createElement('span');probe.style.background='var(--panel)';probe.style.color='var(--ink)';e.append(probe);const expected=getComputedStyle(probe);const matches=s.backgroundColor===expected.backgroundColor&&s.color===expected.color;probe.remove();const r=e.getBoundingClientRect();return {matches,fits:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight};});
   assert(statusColors.matches&&statusColors.fits,'Network status follows the theme and fits the viewport');
   await p.screenshot({path:path.join(out,`${engine}-dark-network-status.png`)});result.themedNetworkStatus=true;
   async function changeFailure(){f=await active(p);await selectDay(f,10);await p.getByText('重試',{exact:true}).waitFor({state:'visible'});await day(p,11);assert(p.url().endsWith(files[11]));}
   await p.unroute('**/'+files[10]);await p.getByText('重試',{exact:true}).tap();await day(p,10);result.failureAndRetry=true;
   await p.route('**/'+files[13],async r=>{await new Promise(resolve=>setTimeout(resolve,1000));await r.continue();});
   f=await active(p);await selectDay(f,13);await selectDay(f,14);await day(p,14);
   await p.waitForTimeout(1200);await day(p,14);await sameDocument(p);result.latestIntentWins=true;
   await p.route('**/'+files[8],async r=>{await new Promise(resolve=>setTimeout(resolve,1100));await r.continue();});
   f=await active(p);await selectDay(f,8);await p.getByText('留在這一課',{exact:true}).tap();await p.waitForTimeout(1200);await day(p,14);result.cancel=true;
   await change(p,1);await section(p.mainFrame(),0);assert.equal(await p.locator('#field-before').inputValue(),'Keep this while switching.');
   // Cached navigation keeps working even after the connection is lost.
   await change(p,14);await context.setOffline(true);await change(p,1);await change(p,14);await sameDocument(p);await context.setOffline(false);result.cachedOffline=true;
   // Starting at the course index exercises Day 1's dialog inside a lesson frame.
   await p.goto(base+'index.html');await p.locator(`main a[href="./${files[1]}"]`).tap();await day(p,1);f=await active(p);
   await f.locator('[data-homework-open]').tap();assert(await f.locator('.homework-dialog').evaluate(el=>el.open));
   await f.locator('[data-homework-close]').tap();assert(!await f.locator('.homework-dialog').evaluate(el=>el.open));result.embeddedHandout=true;
   await change(p,0);f=await active(p);await section(f,1);
   if(engine==='chromium'){
    await f.locator('#main [data-say]').first().tap();await f.waitForFunction(()=>testAudio.currentTime>.05&&!testAudio.paused);
    await change(p,2);assert(await f.evaluate(()=>testAudio.paused));result.embeddedRecordedAudio=true;
   }
   await p.goto(base+files[1]);
   for(const n of [9,10,11,12,13,14])await change(p,n);
   await p.route('**/'+files[9],r=>r.abort());await p.evaluate(()=>window.history.go(-5));
   await p.getByText('重試',{exact:true}).waitFor({state:'visible'});await day(p,14);assert(p.url().endsWith(files[14]));
   await p.unroute('**/'+files[9]);await p.getByText('重試',{exact:true}).tap();await day(p,9);assert(p.url().endsWith(files[9]));result.failedBackRetry=true;
   // Preferences also propagate between views when browser storage is blocked.
   const blocked=await browser.newContext({viewport,hasTouch:true,isMobile:true});
   await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('blocked')}}));
   const q=await blocked.newPage();q.on('pageerror',e=>result.errors.push(e.message));await q.goto(base+'index.html');
   await q.locator('#theme').tap();await q.locator('#large').tap();await q.locator(`main a[href="./${files[1]}"]`).tap();await day(q,1);
   const bf=await active(q);assert.equal(await bf.locator('#theme').getAttribute('aria-pressed'),'true');assert.equal(await bf.locator('#large').getAttribute('aria-pressed'),'true');
   await bf.locator('#theme').tap();await change(q,2);assert.equal(await (await active(q)).locator('#theme').getAttribute('aria-pressed'),'false');
   await blocked.close();result.blockedStorage=true;
   // Standalone files still use their native links and do not depend on fetching.
   await p.goto(require('url').pathToFileURL(path.resolve(files[1])).href);assert.equal(await p.evaluate(()=>typeof window.travelApp),'undefined');
   await selectDay(p,2);await day(p,2);result.standalone=true;
   assert.deepEqual(result.errors,[]);console.log(`PASS ${engine}: ${JSON.stringify(result)}`);
  }finally{await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}
 }
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1});
