const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
process.env.PLAYWRIGHT_BROWSERS_PATH=path.resolve('tmp/playwright-browsers');
const {chromium,webkit}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='tmp/responsive-controls';fs.mkdirSync(out,{recursive:true});
(async()=>{const reports=[];for(const engine of ['edge','webkit']){
 const browser=await(engine==='edge'?chromium.launch({channel:'msedge'}):webkit.launch());
 try{const p=await browser.newPage({viewport:{width:320,height:568},reducedMotion:'reduce'}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const result={engine,states:0,errors};reports.push(result);
 for(const file of ['index.html','travel-english.html','travel-english-unit7-fitting.html']){
  await p.goto(pathToFileURL(path.resolve(file)).href);
  for(const width of [320,360,390,768,1440])for(const theme of ['light','dark'])for(const size of ['standard','large']){
   await p.setViewportSize({width,height:width===768?1024:width===1440?900:568});
   if(await p.locator('html').getAttribute('data-theme')!==theme)await p.locator('#theme').click();
   if(await p.locator('html').getAttribute('data-size')!==size)await p.locator('#large').click();
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert((await p.locator('.top').boundingBox()).height<=90,'Reading controls fit in one row');
   if(file==='index.html'){
    for(const el of await p.locator('main a').all()){const r=await el.boundingBox();assert(r.x>=0&&r.x+r.width<=width&&r.height>=44);}
   }else if(width<=1100){
    const summary=p.locator('.unit-menu>summary');await summary.focus();await summary.press('Enter');assert(await p.locator('.unit-menu').evaluate(e=>e.open));
    const label=p.locator('.unit-menu-current');await label.hover();
    await p.screenshot({path:path.join(out,`${engine}-${file}-${width}-${theme}-${size}-hover.png`)});
    await summary.focus();await p.keyboard.press('Tab');assert(await p.locator('.unit-menu a').first().evaluate(e=>e===document.activeElement&&e.matches(':focus-visible')));
    for(let i=0;i<14;i++)await p.keyboard.press('Tab');assert(await p.locator('.unit-menu a').last().evaluate(e=>e===document.activeElement));
    await p.screenshot({path:path.join(out,`${engine}-${file}-${width}-${theme}-${size}-focus.png`)});
    await p.keyboard.press('Escape');assert(!await p.locator('.unit-menu').evaluate(e=>e.open));assert(await summary.evaluate(e=>e===document.activeElement));
   }
   result.states++;
  }
  // Short visible area approximates a keyboard shrinking the viewport; it is not an OS keyboard test.
  if(file!=='index.html'){
   await p.setViewportSize({width:390,height:360});await p.evaluate(()=>navigate(3));await p.locator('textarea').click();await p.locator('textarea').fill('手機短視窗測試。Please help me.');
   assert(await p.locator('textarea').evaluate(e=>e===document.activeElement));const r=await p.locator('textarea').boundingBox();assert(r.y>=0&&r.y<360);
   await p.setViewportSize({width:390,height:844});assert.equal(await p.locator('textarea').inputValue(),'手機短視窗測試。Please help me.');
  }
 }
 await p.goto(pathToFileURL(path.resolve('index.html')).href);await p.setViewportSize({width:320,height:568});await p.locator('#large').click();await p.locator('#theme').click();await p.screenshot({path:path.join(out,`${engine}-index-320-final.png`)});
 assert.deepEqual(errors,[]);console.log('PASS responsive controls: '+JSON.stringify(result));
 }catch(e){reports.at(-1).failure=e.stack;throw e;}finally{await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2));}
}})().catch(e=>{console.error(e);process.exitCode=1;});
