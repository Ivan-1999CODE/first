'use strict';
// Focused regression for Day 5 home disclosures and shared task-button shape.
// Isolated browser profiles protect the user's existing learning records.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/lesson5-home');fs.mkdirSync(out,{recursive:true});
const configs=[{width:390,height:844,theme:'light',size:'standard'},{width:390,height:844,theme:'dark',size:'large'},{width:768,height:1024,theme:'dark',size:'standard'},{width:1440,height:1000,theme:'light',size:'standard'}];
const fileFor=day=>fs.readdirSync('.').find(f=>f.startsWith(`travel-english-unit${day}-`)&&f.endsWith('.html'));
const report={homeCases:[],sharedTaskCases:[],screenshots:[],sourceHashes:{},pageErrors:[],failures:[]};
for(let day=2;day<=14;day++){const file=fileFor(day);report.sourceHashes[file]=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}
const shot=async(p,name,selector)=>{const opts={path:path.join(out,name+'.png')};if(selector)await p.locator(selector).screenshot(opts);else await p.screenshot({...opts,fullPage:true});report.screenshots.push(name+'.png')};
const contextFor=async(browser,config)=>{const context=await browser.newContext({viewport:{width:config.width,height:config.height},hasTouch:config.width<=768,isMobile:config.width<=390});const p=await context.newPage();p.setDefaultTimeout(8000);p.on('pageerror',e=>report.pageErrors.push(e.message));await p.addInitScript(c=>{if(!sessionStorage.getItem('home-qa-init')){localStorage.setItem('travel-lab-theme',c.theme);localStorage.setItem('travel-lab-text-size',c.size);localStorage.setItem('lesson5-home-unrelated','keep');sessionStorage.setItem('home-qa-init','yes')}},config);return {context,p}};
const chapter=async(p,n)=>{await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-page="${n}"]`).click();assert.equal(await p.evaluate(()=>page),n)};
const selectTask=async(p,n)=>{await p.locator(`#dg-context [data-dg-task="${n}"]`).click();assert.equal(await p.evaluate(()=>taskRound),n);assert.equal(await p.locator(`#dg-context [data-dg-task="${n}"]`).getAttribute('aria-pressed'),'true')};
const checkHome=async(p)=>{
 assert.equal(await p.locator('#main > .dg-teacher-notes').count(),0,'Removed teacher notes and inventory from home');
 assert.equal(await p.locator('#main summary').filter({hasText:'老師看：怎麼分堂與收尾'}).count(),0);
 assert.equal(await p.locator('#main summary').filter({hasText:'原有句表：老師需要時再查'}).count(),0);
 assert.equal(await p.locator('.dg-entry-note').count(),1);
 assert(await p.locator('.dg-entry-note').evaluate(e=>e.open),'First attempt expanded by default');
 assert(await p.locator('.dg-entry-note textarea').isVisible(),'First attempt is immediately editable');
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No page-level horizontal overflow');
};
const selectedStyle=async(p)=>p.locator('#dg-context button[aria-pressed="true"]').evaluate(e=>{const s=getComputedStyle(e);return {shadow:s.boxShadow,outlineStyle:s.outlineStyle,outlineWidth:parseFloat(s.outlineWidth),outlineColor:s.outlineColor,background:s.backgroundColor,color:s.color,focusVisible:e.matches(':focus-visible'),pressed:e.getAttribute('aria-pressed')}});
const checkFocusUnclipped=async(p,label)=>{
 const clips=await p.locator('#dg-context button[aria-pressed="true"]').evaluate(e=>{
  const s=getComputedStyle(e),r=e.getBoundingClientRect(),extent=parseFloat(s.outlineWidth)+parseFloat(s.outlineOffset),issues=[];
  for(let a=e.parentElement;a&&a!==document.body;a=a.parentElement){const c=getComputedStyle(a),b=a.getBoundingClientRect(),left=b.left+a.clientLeft,top=b.top+a.clientTop,right=left+a.clientWidth,bottom=top+a.clientHeight;
   if(['auto','scroll','hidden','clip'].includes(c.overflowX)&&(r.left-extent<left-.5||r.right+extent>right+.5))issues.push(a.className+' clips horizontal outline');
   if(['auto','scroll','hidden','clip'].includes(c.overflowY)&&(r.top-extent<top-.5||r.bottom+extent>bottom+.5))issues.push(a.className+' clips vertical outline');
  }return issues;
 });assert.deepEqual(clips,[],label+' keyboard outline stays inside clipping ancestors');
};
const checkSelected=async(p,label)=>{const value=await selectedStyle(p);assert.equal(value.shadow,'none',label+' no inset shadow');assert.equal(value.pressed,'true');assert.notEqual(value.background,value.color,label+' selected label visible');return value};
const captureSwitchStates=async(p,tag)=>{
 await selectTask(p,0);await p.locator('.dg-current-round').click();await p.mouse.move(0,0);await checkSelected(p,tag+' normal');await shot(p,`${tag}-tasks-normal`,'#dg-context');
 await p.locator('[data-dg-task="0"]').hover();await checkSelected(p,tag+' hover');await shot(p,`${tag}-tasks-hover`,'#dg-context');
 await p.locator('[data-dg-task="0"]').focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');const focus=await checkSelected(p,tag+' focus');assert(focus.focusVisible&&focus.outlineStyle!=='none'&&focus.outlineWidth>=2,tag+' visible keyboard focus');await p.mouse.move(0,0);await shot(p,`${tag}-tasks-focus`,'#dg-context');await checkFocusUnclipped(p,tag);
};
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});let active;
try{
 for(const config of configs){const tag=`${config.width}-${config.theme}-${config.size}`,{context,p}=await contextFor(browser,config);active=p;await p.goto(pathToFileURL(path.resolve(fileFor(5))).href);const expected={};
  for(let n=0;n<4;n++){
   await selectTask(p,n);await checkHome(p);const field=p.locator('.dg-entry-note textarea'),key=await field.getAttribute('data-field'),value=`Task ${n}: first attempt <keep> & original`;
   await field.fill(value);expected[key]=value;assert.equal(await p.evaluate(k=>state.answers[k],key),value);
   await p.locator('.dg-entry-note > summary').click();assert(!await p.locator('.dg-entry-note').evaluate(e=>e.open));assert(!await field.isVisible(),'Can manually collapse first attempt');
   await chapter(p,1);await chapter(p,0);await checkHome(p);assert.equal(await p.locator('.dg-entry-note textarea').inputValue(),value,'Section return keeps answer and expands');
   await selectTask(p,(n+1)%4);await selectTask(p,n);await checkHome(p);assert.equal(await p.locator('.dg-entry-note textarea').inputValue(),value,'Task return keeps answer');
   await p.locator('.dg-entry-note > summary').click();await p.reload();await selectTask(p,n);await checkHome(p);assert.equal(await p.locator('.dg-entry-note textarea').inputValue(),value,'Reload keeps answer and expands');
   report.homeCases.push({config:tag,task:n,removedPanels:true,defaultOpen:true,manualCollapse:true,returnOpen:true,reloadSaved:true});
  }
  const stored=await p.evaluate(()=>({saved:JSON.parse(localStorage.getItem(course.id)),unrelated:localStorage.getItem('lesson5-home-unrelated')}));for(const[k,v]of Object.entries(expected))assert.equal(stored.saved.answers[k],v);assert.equal(stored.unrelated,'keep');
  await selectTask(p,0);await shot(p,`home-${tag}`);if(config.width===390)await captureSwitchStates(p,tag);
  await chapter(p,4);assert.equal(await p.locator('.dg-teacher > summary').count(),1,'Part 5 teacher guide remains');assert(!await p.locator('.dg-teacher').evaluate(e=>e.open));await p.locator('.dg-teacher > summary').click();assert(await p.locator('.dg-teacher').evaluate(e=>e.open));
  if(config.width===390){await p.locator('.dg-teacher').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,`teacher-${tag}.png`)});report.screenshots.push(`teacher-${tag}.png`);await p.locator('#dg-menu-open').click();await p.locator('#nav [data-page="0"]').hover();await p.locator('#dg-menu-close').focus();await p.keyboard.press('Tab');await p.screenshot({path:path.join(out,`menu-${tag}.png`)});report.screenshots.push(`menu-${tag}.png`);await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.activeElement.id),'dg-menu-open');}
  console.log(`PASS Day5 ${tag}: four task homes, open/collapse/return/reload, saved answers, teacher guide retained`);await context.close();
 }
 for(const theme of ['light','dark']){const{context,p}=await contextFor(browser,{width:1440,height:1000,theme,size:'standard'});active=p;
  for(let day=2;day<=14;day++){
   await p.goto(pathToFileURL(path.resolve(fileFor(day))).href);const count=await p.locator('#dg-context [data-dg-task]').count();
   for(let n=0;n<count;n++){await selectTask(p,n);await checkSelected(p,`day${day} ${theme} task${n}`);assert.equal(await p.locator('#dg-context button[aria-pressed="true"]').count(),1);}
   await selectTask(p,0);await p.locator('[data-dg-task="0"]').focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');const focus=await checkSelected(p,`day${day} ${theme} focus`);assert(focus.focusVisible&&focus.outlineStyle!=='none'&&focus.outlineWidth>=2,'Keyboard focus remains visible');
   if(day===5)await captureSwitchStates(p,`1440-${theme}`);
   report.sharedTaskCases.push({day,theme,tasks:count,boxShadow:'none',oneSelected:true,keyboardFocus:true});
  }
  await context.close();
 }
 assert.deepEqual(report.pageErrors,[]);
 for(const[file,hash]of Object.entries(report.sourceHashes))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,'Sources stayed unchanged while testing');
}catch(e){report.failures.push(e.stack);if(active)await active.screenshot({path:path.join(out,'failure.png'),fullPage:true});throw e}
finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log(`PASS ${report.homeCases.length} Day5 home cases; ${report.sharedTaskCases.length} lesson/theme cases; ${report.sharedTaskCases.reduce((n,c)=>n+c.tasks,0)} selected task buttons; ${report.screenshots.length} screenshots.`);
})().catch(e=>{console.error(e);process.exit(1)});
