'use strict';
// Run with --webkit for touch emulation; this is not a physical iPad test.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
process.env.PLAYWRIGHT_BROWSERS_PATH=path.resolve('tmp/playwright-browsers');
const {chromium,webkit}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const touch=process.argv.includes('--webkit'),engine=touch?'webkit':'edge';
const out=path.resolve('tmp/study-selection-style');fs.mkdirSync(out,{recursive:true});
const files=fs.readdirSync('.').filter(f=>/^travel-english.*\.html$/.test(f)&&fs.readFileSync(f,'utf8').includes('const chapterIntegration='));
const report={engine,physicalDevice:false,views:0,buttons:0,errors:[],screenshots:[]};
const activate=button=>touch?button.tap():button.click();
const appearance=button=>button.evaluate(e=>{const s=getComputedStyle(e);return {bg:s.backgroundColor,color:s.color,border:s.borderColor};});
async function probe(p,selector,expected){
 const button=p.locator(selector);await activate(button);assert.equal(await button.getAttribute('aria-pressed'),'true');
 // Allow the existing 120 ms color transition to settle before comparing pixels.
 await p.waitForTimeout(160);assert.deepEqual(await appearance(button),expected,selector+' after activation');
 if(!touch){await button.hover();await p.mouse.down();assert.deepEqual(await appearance(button),expected,selector+' while pressed');await p.mouse.up();}
 await button.focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');
 assert(await button.evaluate(e=>e===document.activeElement&&getComputedStyle(e).outlineStyle!=='none'),selector+' visible keyboard focus');
 await p.waitForTimeout(160);assert.deepEqual(await appearance(button),expected,selector+' while focused');
 // Activating a scenario with the keyboard also keeps its selected appearance.
 if(selector.includes('data-ci-study-path')){await p.keyboard.press('Enter');await p.waitForTimeout(160);assert.deepEqual(await appearance(button),expected,selector+' keyboard activation');}
 report.buttons++;
}
async function screenshot(p,name){await p.screenshot({path:path.join(out,name+'.png')});report.screenshots.push(name+'.png');}
(async()=>{
 const browser=await(touch?webkit.launch({headless:true}):chromium.launch({channel:'msedge',headless:true}));let current;
 try{
  for(const file of files)for(const theme of ['dark','light']){
   const widths=file==='travel-english.html'?[820,390]:[touch?820:1280];
   for(const width of widths){
    const c=await browser.newContext({viewport:{width,height:1180},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'}),p=await c.newPage();current=p;p.setDefaultTimeout(7000);p.on('pageerror',e=>report.errors.push(file+': '+e.message));
    await p.addInitScript(t=>{localStorage.setItem('travel-lab-theme',t);localStorage.setItem('travel-lab-text-size','large');},theme);
    await p.goto(pathToFileURL(path.resolve(file)).href);await activate(p.locator('#dg-menu-open'));
    const group=await p.locator('[data-ci-group]').first().getAttribute('data-ci-group');await activate(p.locator(`[data-ci-group="${group}"]`));await activate(p.locator('.dg-section-switch button').nth(1));
    const expected=await appearance(p.locator('.dg-section-switch [aria-current=step]'));
    const saved=await p.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>!k.startsWith('travel-lab-theme')&&!k.startsWith('travel-lab-text-size'))));
    for(const mode of ['library','reply']){
     await activate(p.locator(`.study-navigation [data-ci-study="${mode}"]`));
     const ids=await p.locator('[data-ci-study-path]').evaluateAll(es=>es.map(e=>e.dataset.ciStudyPath));
     for(const id of ids)await probe(p,`[data-ci-study-path="${id}"]`,expected);
     await probe(p,'[data-ci-all]',expected);assert.equal(await p.locator('[data-ci-study-path][aria-pressed=true]').count(),0);
     await probe(p,`[data-ci-study-path="${ids[0]}"]`,expected);assert.equal(await p.locator('[data-ci-all]').getAttribute('aria-pressed'),'false');
     if(file==='travel-english.html'&&mode==='reply'){await p.locator('.ci-study-picker').scrollIntoViewIfNeeded();await screenshot(p,`after-${engine}-${width}-${theme}`);}
    }
    // The same scenario selector is also used outside the sentence library.
    await activate(p.locator('.dg-section-switch button').nth(4));
    const pathButtons=p.locator('.ci-paths [data-ci-path]');
    if(await pathButtons.count()){await activate(pathButtons.first());await p.waitForTimeout(160);assert.deepEqual(await appearance(pathButtons.first()),expected);}
    assert.deepEqual(await p.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>!k.startsWith('travel-lab-theme')&&!k.startsWith('travel-lab-text-size')))),saved,'Selecting scenarios preserves learning records');
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');report.views++;await c.close();
   }
   console.log('PASS '+engine+' '+file+' '+theme);
  }
  assert.deepEqual(report.errors,[]);
 }catch(e){report.failure=e.stack;if(current&&!current.isClosed())await screenshot(current,'failure-'+engine);throw e;}
 finally{fs.writeFileSync(path.join(out,engine+'-report.json'),JSON.stringify(report,null,2));await browser.close();}
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
