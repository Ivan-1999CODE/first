'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/lesson-navigation');fs.mkdirSync(out,{recursive:true});
const files=fs.readdirSync('.').filter(f=>/^travel-english.*\.html$/.test(f));
const read=(html,key)=>{const m=html.match(new RegExp('(?:^|[>\\n])const '+key+'=(.*);(?:\\r?\\n|<)'));return m?JSON.parse(m[1]):null;};
const baseline=fs.existsSync(path.join(out,'baseline.json'))?JSON.parse(fs.readFileSync(path.join(out,'baseline.json'),'utf8')):null;
const report={lessons:[],tasks:0,groups:0,sections:0,layouts:[],screenshots:[],errors:[]};
for(const file of files){const html=fs.readFileSync(file,'utf8');for(const script of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);if(baseline)for(const [key,value]of Object.entries(baseline[file]))assert.deepEqual(read(html,key),value,file+': preserved '+key);}
const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
async function part(p,n){await p.locator('.dg-section-switch button').nth(n).click();await settle(p);assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),String(n+1));assert.equal(await p.locator('.dg-section-switch [aria-current=step]').innerText(),String(n+1).padStart(2,'0'));assert(!await p.locator('#dg-course-dialog').evaluate(e=>e.open));report.sections++;}
async function choose(p,selector){await p.locator('#dg-menu-open').click();assert.equal(await p.locator('#dg-menu-open').getAttribute('aria-expanded'),'true');await p.locator('#nav '+selector).first().click();await settle(p);assert(!await p.locator('#dg-course-dialog').evaluate(e=>e.open));assert.equal(await p.locator('#dg-menu-open').getAttribute('aria-expanded'),'false');}
async function bounds(p,label){assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' horizontal overflow');const bs=await p.locator('.dg-section-switch button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return [r.width,r.height];}));assert(bs.every(([w,h])=>w>=44&&h>=44),label+' touch targets');}
async function shot(p,name){await p.screenshot({path:path.join(out,name+'.png')});report.screenshots.push(name+'.png');}
async function contrast(locator){return locator.evaluate(e=>{const s=getComputedStyle(e);const lum=v=>v.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);const a=lum(s.color),b=lum(s.backgroundColor);return {ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),bg:s.backgroundColor,ink:s.color,outline:s.outlineStyle};});}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});let current;
try{
 for(const [index,file]of (process.argv.includes('--layout-only')?[]:files).entries()){
  const html=fs.readFileSync(file,'utf8'),rounds=read(html,'rounds'),ci=read(html,'chapterIntegration'),hotel=read(html,'hotelIntegration');
  const ctx=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'}),p=await ctx.newPage();current=p;p.setDefaultTimeout(7000);p.on('pageerror',e=>report.errors.push(file+': '+e.message));
  await p.addInitScript(theme=>localStorage.setItem('travel-lab-theme',theme),index%2?'light':'dark');await p.goto(pathToFileURL(path.resolve(file)).href);await settle(p);
  assert.equal(await p.locator('.dg-section-switch button').count(),7);assert.equal(await p.locator('#dg-context [data-dg-task],#ci-mode-bar,#hi-mode-bar,.hi-group-switch').count(),0);
  const saved=await p.evaluate(()=>{state.answers['before-'+rounds[0].id]='Navigation QA: keep my answer';save();return JSON.stringify(state.answers);});
  for(let n=0;n<7;n++)await part(p,n);
  await part(p,1);
  for(let i=0;i<rounds.length;i++){
   await choose(p,`[data-dg-task="${i}"]`);assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),'2');assert((await p.locator('.dg-current-round').innerText()).includes(rounds[i].name));assert((await p.locator('#dg-menu-open').innerText()).includes(rounds[i].displayLabel||rounds[i].id));report.tasks++;
  }
  const groups=ci?ci.groups.map(g=>({id:g.id,attribute:'data-ci-group',task:'data-ci-task',field:'[data-ci-field="before"]'})):hotel?[{id:'checkin'},{id:'stay'},{id:'chapter'}].map(g=>({...g,attribute:'data-hi-group',task:'data-hi-task',field:null})):[];
  for(const g of groups){
   await choose(p,`[${g.attribute}="${g.id}"]`);assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),'2','Switching practice retains section');
   for(let n=0;n<7;n++){await part(p,n);if(n===0&&g.field){const field=p.locator(g.field);for(const d of await field.locator('xpath=ancestor::details').all())if(!await d.evaluate(e=>e.open))await d.locator(':scope > summary').click();await field.fill('Saved integration '+g.id);}}
   await part(p,1);await choose(p,`[${g.task}="0"]`);assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),'2');report.groups++;
  }
  if(file==='travel-english.html'){
   await choose(p,'[data-ci-capstone]');assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),'8');assert.equal(await p.locator('.dg-section-switch [aria-current]').count(),0);await part(p,2);
   await choose(p,'[data-ci-group]');await choose(p,'[data-ci-capstone]');assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),'8');await choose(p,'[data-dg-task="0"]');assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),'1');
  }
  assert.equal(await p.evaluate(()=>JSON.stringify(state.answers)),saved);await p.reload();assert.equal(await p.evaluate(()=>JSON.stringify(state.answers)),saved);
  for(const g of groups.filter(x=>x.field)){await choose(p,`[${g.attribute}="${g.id}"]`);await part(p,0);assert.equal(await p.locator(g.field).inputValue(),'Saved integration '+g.id);}
  await bounds(p,file);report.lessons.push(file);await ctx.close();console.log('PASS '+file);
 }
 const configs=[{file:'travel-english-unit5-getting-around.html',width:1280,height:900,theme:'light',size:'standard'},{file:'travel-english-unit5-getting-around.html',width:1280,height:900,theme:'dark',size:'large'},{file:'travel-english.html',width:320,height:700,theme:'light',size:'large'},{file:'travel-english-unit8-hotel.html',width:390,height:844,theme:'dark',size:'large'},{file:'travel-english-unit5-getting-around.html',width:768,height:1024,theme:'dark',size:'large'}];
 for(const c of configs){
  const ctx=await browser.newContext({viewport:{width:c.width,height:c.height},hasTouch:c.width<1000,reducedMotion:'reduce'}),p=await ctx.newPage();current=p;p.on('pageerror',e=>report.errors.push(e.message));await p.addInitScript(c=>{localStorage.setItem('travel-lab-theme',c.theme);localStorage.setItem('travel-lab-text-size',c.size);},c);await p.goto(pathToFileURL(path.resolve(c.file)).href);const tag=c.width+'-'+c.theme;
  await part(p,1);await p.evaluate(()=>scrollTo({top:1000,behavior:'instant'}));await settle(p);
  const fixed=await p.evaluate(()=>{const top=document.querySelector('.top').getBoundingClientRect(),nav=document.querySelector('#dg-context').getBoundingClientRect();return {scroll:scrollY,top:top.bottom,nav:nav.top,bottom:nav.bottom,height:innerHeight};});assert(fixed.scroll>100);assert(Math.abs(fixed.nav-fixed.top)<2,'Sticky chapter bar');assert(fixed.bottom<fixed.height/2,'Navigation leaves room for lesson');
  await bounds(p,tag);await shot(p,'scrolled-'+tag);await part(p,4);
  assert(await p.locator('#main h1').evaluate(e=>e.getBoundingClientRect().top>=document.querySelector('#dg-context').getBoundingClientRect().bottom-1),'Heading not hidden behind sticky bar');
  await p.locator('.dg-section-switch button').nth(1).focus();await p.keyboard.press('Enter');await settle(p);assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),'2');
  await p.locator('#dg-menu-open').click();await p.keyboard.press('Escape');await settle(p);assert(await p.locator('#dg-menu-open').evaluate(e=>e===document.activeElement));
  const chapter=p.locator('.dg-section-switch [aria-current=step]');await p.mouse.move(0,0);await p.waitForTimeout(160);const chapterRest=await contrast(chapter);await chapter.hover();await chapter.focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');await p.waitForTimeout(160);const chapterFocus=await contrast(chapter);assert.equal(chapterFocus.bg,chapterRest.bg);assert.equal(chapterFocus.ink,chapterRest.ink);assert(chapterFocus.ratio>=4.5);assert.notEqual(chapterFocus.outline,'none');await shot(p,'section-focus-'+tag);
  await p.locator('#dg-menu-open').click();await p.locator('#nav [aria-pressed=false]').first().hover();await shot(p,'menu-hover-'+tag);const selected=p.locator('#nav [aria-pressed=true]');assert.equal(await selected.count(),1);await selected.hover();await selected.focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');await p.waitForTimeout(160);const style=await contrast(selected);assert(style.ratio>=4.5,'Selected menu contrast '+JSON.stringify(style));assert.notEqual(style.outline,'none');await shot(p,'menu-'+tag);await bounds(p,tag+' menu');
  const fit=await p.locator('#dg-course-dialog').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;});assert(fit,'Dialog fits viewport');await p.keyboard.press('Enter');await settle(p);assert(!await p.locator('#dg-course-dialog').evaluate(e=>e.open),'Re-selecting current task closes menu');
  await choose(p,c.file.includes('unit8')?'[data-hi-group="stay"]':'[data-ci-group]');await part(p,6);await p.locator('#dg-menu-open').click();await shot(p,'integrated-menu-'+tag);await p.keyboard.press('Escape');await p.locator('#dg-menu-open').click();await p.locator('#dg-menu-close').click();assert(await p.locator('#dg-menu-open').evaluate(e=>e===document.activeElement));
  await bounds(p,tag+' integrated');report.layouts.push(c);await ctx.close();console.log('PASS layout '+tag);
 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.failure=e.stack;if(current&&!current.isClosed())await shot(current,'failure');throw e;}
finally{fs.writeFileSync(path.join(out,process.argv.includes('--layout-only')?'layout-report.json':'report.json'),JSON.stringify(report,null,2));await browser.close();}
console.log(`PASS ${report.lessons.length} lessons, ${report.tasks} tasks, ${report.groups} integrated groups, ${report.sections} section changes, ${report.layouts.length} layouts; data and saved answers preserved.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
