'use strict';
// Real browser engines with isolated profiles; WebKit touch emulation is not a physical iPad test.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
process.env.PLAYWRIGHT_BROWSERS_PATH=path.resolve('tmp/playwright-browsers');
const {chromium,webkit}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const before=process.argv.includes('--before'),touch=process.argv.includes('--webkit');
const engine=touch?'webkit':'edge',out=path.resolve('tmp/selected-button-style');
fs.mkdirSync(out,{recursive:true});
const files=fs.readdirSync('.').filter(f=>/^travel-english.*\.html$/.test(f));
const report={engine,physicalDevice:false,views:0,checks:0,failures:[],errors:[],screenshots:[]};
const style=locator=>locator.evaluate(e=>{
 const s=getComputedStyle(e),rgb=v=>v.match(/[\d.]+/g).slice(0,3).map(Number);
 const lum=v=>rgb(v).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
 const a=lum(s.color),b=lum(s.backgroundColor);
 return {background:s.backgroundColor,color:s.color,contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),focus:e===document.activeElement,outline:s.outlineStyle,outlineWidth:parseFloat(s.outlineWidth)};
});
async function activate(locator){if(touch)await locator.tap();else await locator.click();}
async function openMenu(p){if(!await p.locator('#dg-course-dialog').evaluate(e=>e.open))await activate(p.locator('#dg-menu-open'));}
async function screenshot(p,label){const name=`${before?'before':'after'}-${engine}-${label}.png`;await p.screenshot({path:path.join(out,name)});report.screenshots.push(name);}
async function probe(p,selector,label,shot){
 const locator=p.locator(selector);
 await openMenu(p);await activate(locator);await openMenu(p);
 assert.equal(await locator.getAttribute('aria-pressed'),'true',label+' selected');
 if(touch)await p.touchscreen.tap(2,p.viewportSize().height-2);else await p.mouse.move(0,0);
 const rest=await style(locator);
 await openMenu(p);await activate(locator);await openMenu(p);
 if(!touch)await locator.hover();
 const clicked=await style(locator);
 if(shot)await screenshot(p,shot);
 // Selecting a task closes the menu; reopen it before checking its selected state.
 await locator.focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');
 const focused=await style(locator);
 report.checks++;
 if(!focused.focus||focused.outline==='none'||focused.outlineWidth<2||focused.background!==rest.background||focused.color!==rest.color)report.failures.push({label,state:'keyboard-focus',rest,actual:focused});
 await p.keyboard.press('Enter');
 await openMenu(p);
 const keyboard=await style(locator);
 for(const [state,actual]of [['clicked',clicked],['keyboard',keyboard]]){
  report.checks++;
  if(actual.background!==rest.background||actual.color!==rest.color||actual.contrast<4.5)report.failures.push({label,state,rest,actual});
 }
}
(async()=>{
 const browser=await(touch?webkit.launch({headless:true}):chromium.launch({channel:'msedge',headless:true}));
 try{
  for(const file of before?['travel-english.html']:files){
   for(const theme of before?['dark']:['dark','light']){
    const widths=before?[820]:touch&&/^(travel-english|travel-english-unit8-hotel)\.html$/.test(file)?[820,390]:[touch?820:1280];
    for(const width of widths){
     const c=await browser.newContext({viewport:{width,height:1180},hasTouch:touch,isMobile:touch,reducedMotion:'reduce'}),p=await c.newPage();
     p.setDefaultTimeout(10000);p.on('pageerror',e=>report.errors.push(file+': '+e.message));
     await p.addInitScript(theme=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size','large');},theme);
     await p.goto(pathToFileURL(path.resolve(file)).href);
     const label=`${file}/${theme}/${width}`;
     // Each individual task uses the shared selected-button rule.
     for(const task of await p.locator('[data-dg-task]').evaluateAll(es=>es.map(e=>e.dataset.dgTask)))await probe(p,`[data-dg-task="${task}"]`,label+'/task-'+task);
     for(const attribute of ['data-ci-group','data-hi-group'])for(const group of await p.locator(`[${attribute}]`).evaluateAll((es,attr)=>es.map(e=>e.getAttribute(attr)),attribute))await probe(p,`[${attribute}="${group}"]`,label+'/group-'+group,/^(travel-english|travel-english-unit8-hotel)\.html$/.test(file)?`${theme}-${width}-group-${group}`:null);
     await openMenu(p);
     const selected=p.locator('#nav [aria-pressed=true]');await selected.hover();await selected.focus();
     const menuStyle=await style(selected);assert(menuStyle.contrast>=4.5,label+' selected menu contrast');
     if(file==='travel-english.html')await screenshot(p,`${theme}-${width}-menu`);
     await p.keyboard.press('Escape');
     assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' no overflow');
     report.views++;await c.close();
    }
   }
   console.log('Checked '+engine+': '+file);
  }
 }finally{await browser.close();fs.writeFileSync(path.join(out,`${before?'before':'after'}-${engine}.json`),JSON.stringify(report,null,2));}
 console.log(JSON.stringify({engine,views:report.views,checks:report.checks,failures:report.failures.length,errors:report.errors}));
 if(!before){assert.deepEqual(report.failures,[]);assert.deepEqual(report.errors,[]);}
})().catch(e=>{console.error(e);process.exitCode=1;});
