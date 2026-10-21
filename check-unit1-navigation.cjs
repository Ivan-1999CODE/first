const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL,fileURLToPath}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const data=require('./assets/day1-focus-data.cjs');
const firstB=data.rounds.findIndex(r=>r.group==='B'||r.id==='B');
const firstC=data.rounds.findIndex(r=>r.group==='C'||r.id==='C');
const url=pathToFileURL(path.resolve('travel-english.html')).href;
const out=path.resolve('tmp/day1-task-tabs/after');
fs.mkdirSync(out,{recursive:true});

(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const report={functional:[],responsive:[],screenshots:[],pageErrors:[]};let activePage;
 const setup=async(viewport,theme='light',size='standard')=>{
  const context=await browser.newContext({viewport}),p=await context.newPage();activePage=p;
  p.setDefaultTimeout(10000);p.on('pageerror',e=>report.pageErrors.push(e.message));
  await p.addInitScript(({theme,size})=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size',size);},{theme,size});
  await p.goto(url);
  assert.equal(await p.evaluate(()=>course.id),data.course.id);
  return {context,p};
 };
 const navigation=p=>{
  const menu=async()=>{if(!await p.locator('#dg-course-dialog').evaluate(e=>e.open))await p.locator('#dg-menu-open').click();};
  const task=async(round,keyboard=false)=>{
   assert.equal(await p.locator('#dg-course-dialog').evaluate(e=>e.open),false,'Tasks are directly accessible outside the menu');
   const previousPage=await p.evaluate(()=>page),button=p.locator(`#dg-context [data-dg-task="${round}"]`);
   if(keyboard){await button.focus();await p.keyboard.press('Enter');}else await button.click();
   assert.deepEqual(await p.evaluate(()=>[focusRound,page]),[round,previousPage===7?0:previousPage],'Changing the task keeps the chapter, except when leaving integration');
   assert.equal(await p.locator('#dg-course-dialog').evaluate(e=>e.open),false);
   assert.equal(await p.locator(`#dg-context [data-dg-task="${round}"]`).getAttribute('aria-pressed'),'true');
   assert.equal(await p.evaluate(()=>document.activeElement.dataset.dgTask),String(round),'Task switching restores focus to the task button');
  };
  const chapter=async(part,keyboard=false)=>{
   const previousRound=await p.evaluate(()=>focusRound);
   await menu();const button=p.locator(`#nav [data-page="${part}"]`);
   if(keyboard){await button.focus();await p.keyboard.press('Enter');}else await button.click();
   assert.deepEqual(await p.evaluate(()=>[focusRound,page]),[previousRound,part],'Changing the chapter keeps the task');
   assert.equal(await p.locator('#dg-course-dialog').evaluate(e=>e.open),false);
   assert.equal(await p.locator('#dg-day-picker').evaluate(e=>e.open),false);
   assert.equal(await p.evaluate(()=>document.activeElement.id),'main');
  };
  const jump=async(round,part,keyboard=false)=>{await task(round,keyboard);await chapter(part,keyboard);};
  return {menu,task,chapter,jump};
 };
 const shot=async(p,name,fullPage=false)=>{await p.screenshot({path:path.join(out,name+'.png'),fullPage});report.screenshots.push(name+'.png');};
 const overflow=async(p,label)=>{
  const issue=await p.evaluate(()=>{
   const targets=[...document.querySelectorAll('#dg-context *,#dg-day-picker *,dialog[open] *,#main *')];
   return targets.filter(e=>{
    if(!e.getClientRects().length||getComputedStyle(e).visibility==='hidden')return false;
    const r=e.getBoundingClientRect();return r.width>0&&(r.left < -1||r.right>innerWidth+1);
   }).slice(0,5).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,60)}));
  });
  assert.deepEqual(issue,[],label+' element bounds');
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' page width');
  if(await p.locator('#dg-course-dialog').evaluate(e=>e.open))assert(await p.locator('#dg-course-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1),label+' menu width');
 };
 try{
  const {context,p}=await setup({width:1366,height:900});
  const {menu,task,chapter,jump}=navigation(p);
  assert.deepEqual(data.rounds.map(r=>r.id),['A','B','C'],'The current curriculum contains only the three existing tasks');
  assert.equal(await p.locator('#dg-context [data-dg-task]').count(),data.rounds.length);
  assert.equal(await p.locator('#dg-day-picker').evaluate(e=>e.open),false,'Day picker starts collapsed');
  assert.equal(await p.locator('#dg-course-dialog #dg-day-picker').count(),0,'Day cards live outside the course dialog');
  const dayLinks=await p.locator('#dg-day-picker .day-switcher-links a').evaluateAll(es=>es.map(e=>({href:e.href,current:e.getAttribute('aria-current'),text:e.textContent.trim()})));
  assert.equal(dayLinks.length,16);assert.equal(new Set(dayLinks.map(x=>x.href)).size,16);
  assert.equal(dayLinks.filter(x=>x.current).length,1);assert.equal(dayLinks.find(x=>x.current).href,url);
  for(const link of dayLinks)assert(fs.existsSync(fileURLToPath(link.href)),`Day link exists: ${link.text}`);
  await menu();
  assert.equal(await p.locator('#nav button[data-page]').count(),8);
  assert.equal(await p.locator('#nav [data-dg-jump-round],#nav [data-dg-jump-page]').count(),0,'Combined matrix controls have been removed');
  assert.equal(await p.locator('#nav [data-page="7"]').count(),1);
  assert.equal(await p.locator('#nav .dg-capstone-menu [data-page="7"]').count(),1,'Part 8 remains an independent entry');
  assert.equal(await p.locator('#dg-course-dialog [data-dg-round],#dg-course-dialog [data-dg-task]').count(),0,'Task buttons are outside the course menu');
  assert.equal(await p.locator('#nav [data-page="7"]').isDisabled(),false,'Integration is available without familiarity records');
  await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.activeElement.id),'dg-menu-open');
  for(let round=0;round<data.rounds.length;round++)for(let part=0;part<7;part++){
   await jump(round,part);
   assert.equal(await p.evaluate(()=>flow),round);
   assert.equal(await p.locator('#nav [data-page][aria-current="step"]').count(),1);
   assert.equal(await p.locator(`#nav [data-page="${part}"]`).getAttribute('aria-current'),'step');
   assert.equal(await p.locator('#dg-context [data-dg-task][aria-pressed="true"]').count(),1);
   assert((await p.locator('#dg-context').innerText()).includes(data.rounds[round].id));
  }
  await jump(0,2);await task(firstB);assert.deepEqual(await p.evaluate(()=>[focusRound,page]),[firstB,2]);
  await chapter(4);await task(firstC,true);assert.deepEqual(await p.evaluate(()=>[focusRound,page]),[firstC,4]);
  report.functional.push('A/B/C switch directly in the context bar while retaining the current chapter; eight menu entries change only the chapter');

  // Native day disclosure and dialog keyboard behavior stay accessible.
  await p.locator('#dg-day-picker > summary').focus();await p.keyboard.press('Enter');
  assert.equal(await p.locator('#dg-day-picker').evaluate(e=>e.open),true);
  await menu();assert.equal(await p.locator('#dg-day-picker').evaluate(e=>e.open),false);
  await p.locator('#dg-menu-close').focus();await p.keyboard.press('Enter');
  assert.equal(await p.locator('#dg-course-dialog').evaluate(e=>e.open),false);
  assert.equal(await p.evaluate(()=>document.activeElement.id),'dg-menu-open');
  await p.locator('#dg-menu-open').focus();await p.keyboard.press('Enter');
  assert.equal(await p.locator('#dg-course-dialog').evaluate(e=>e.open),true);
  await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.activeElement.id),'dg-menu-open');
  report.functional.push('16 original day links, current-day marker, native disclosure, Enter/Escape and close-focus behavior');

  // Actual inputs and checkboxes demonstrate that cross-task shortcuts keep records separate.
  for(const [i,r] of data.rounds.entries()){
   await jump(i,0);assert.equal(await p.locator('#field-before-'+r.id).inputValue(),'');
   await p.locator('#field-before-'+r.id).fill(r.id+' navigation record');
   await jump(i,4);const first=p.locator('[data-pair-check]').first();
   assert.equal(await first.isChecked(),false,'Other tasks do not inherit checkmarks');await first.check();
   await p.locator('.dg-pair-note > summary').click();await p.locator('#field-note-'+data.pairs[i].id).fill(r.id+' dialogue note');
  }
  await p.reload();
  for(const [i,r] of data.rounds.entries()){
   await jump(i,0);assert.equal(await p.locator('#field-before-'+r.id).inputValue(),r.id+' navigation record');
   await jump(i,4);assert.equal(await p.locator('[data-pair-check]').first().isChecked(),true);
   const checks=await p.locator('[data-pair-check]').evaluateAll(es=>es.map(e=>e.checked));
   assert.deepEqual(checks,data.pairs[i].goals.map((_,j)=>j===0));
   await p.locator('.dg-pair-note > summary').click();assert.equal(await p.locator('#field-note-'+data.pairs[i].id).inputValue(),r.id+' dialogue note');
  }
  report.functional.push(`All ${data.rounds.length} tasks retain distinct answer fields and goal checkboxes across shortcuts and reload`);

  // Chapter-only jumps preserve the in-progress flow; changing tasks resets its temporary scene.
  await jump(0,2);assert.equal(await p.locator('[data-dg-prelude-next]').count(),1);
  await p.locator('[data-dg-prelude-heard]').check();await p.locator('[data-dg-prelude-choice="0"]').click();await p.locator('[data-dg-prelude-next]').click();
  await p.locator('.dg-speaker [data-guide-hint][data-level="2"]').click();await p.evaluate(()=>scrollTo(0,0));
  const sameTaskBefore=await p.evaluate(()=>({scrollY,hint:[...dgHints],prelude:{...dgPrelude}}));await task(0);
  assert.deepEqual(await p.evaluate(()=>({scrollY,hint:[...dgHints],prelude:{...dgPrelude}})),sameTaskBefore,'Clicking the selected task preserves hints and scroll position');
  await p.locator('#spoken').check();await p.locator('#heard').check();await p.locator('[data-choice="0"]').click();
  const scene=()=>p.evaluate(()=>({flow,turn,spoken,heard,choice,history:[...history],finished,prelude:{...dgPrelude}}));
  const running=await scene();await task(0);assert.deepEqual(await scene(),running,'Clicking the same task does not reset the active attempt');
  await jump(0,4);await jump(0,2);assert.deepEqual(await scene(),running,'Same-task chapter jump keeps the active attempt');
  await jump(firstB,4);await jump(0,2);assert.equal(await p.locator('[data-dg-prelude-next]').isDisabled(),true);
  assert.deepEqual(await p.evaluate(()=>dgPrelude),{done:false,heard:false,choice:null});
  assert.deepEqual(await p.evaluate(()=>[turn,spoken,heard,choice,history.length,finished]),[0,false,false,-1,0,false]);
  report.functional.push('Same-task jumps preserve the scene and prelude; cross-task jumps start the new scene cleanly');

  // Part 8 is always explicit and never changes ordinary learning records.
  assert.deepEqual(await p.evaluate(()=>roundsDone),[]);
  for(let i=0;i<data.rounds.length;i++){
   await jump(i,6);await p.locator('#main > .footer-actions > button').last().click();assert.equal(await p.evaluate(()=>page),0);
  }
  const saved=await p.evaluate(()=>JSON.stringify(state));await menu();await p.locator('#nav [data-page="7"]').click();
  assert.equal(await p.evaluate(()=>page),7);assert.equal(await p.evaluate(()=>JSON.stringify(state)),saved);
  await task(firstB);assert.deepEqual(await p.evaluate(()=>[focusRound,page]),[firstB,0]);
  await chapter(7);await task(firstB);assert.deepEqual(await p.evaluate(()=>[focusRound,page]),[firstB,0],'Even the remembered task leaves integration for Part 1');
  await p.reload();assert.equal(await p.evaluate(()=>page),0);
  report.functional.push('Part 8 remains unlocked and manual; selecting any task from integration opens its Part 1');
  await context.close();

  for(const [width,height] of [[320,568],[390,844],[768,1024],[1024,768],[1366,768]])for(const theme of ['light','dark'])for(const size of ['standard','large']){
   const {context,p}=await setup({width,height},theme,size),{menu,task,chapter,jump}=navigation(p),prefix=`${width}-${height}-${theme}-${size}`;
   await p.locator('#dg-day-picker > summary').click();await overflow(p,prefix+'/days');
   const rects=await p.locator('#dg-day-picker .day-switcher-links a').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
   const columns=rects.filter(r=>Math.abs(r.y-rects[0].y)<1).length;
   assert.equal(columns,width>=740?3:2,prefix+' day card columns');
   assert(rects.every(r=>r.height>=44&&r.width>=44),prefix+' day card touch targets');
   await p.locator('#dg-day-picker .day-switcher-links a').first().hover();await p.locator('#dg-day-picker .day-switcher-links a[aria-current]').focus();
   await shot(p,prefix+'-days');
   await p.locator('#dg-day-picker .day-switcher-links a').last().scrollIntoViewIfNeeded();await overflow(p,prefix+'/days-bottom');
   if(size==='large')await shot(p,prefix+'-days-bottom');
   await jump(firstB,4);await overflow(p,prefix+'/task-bar');
   const taskRects=await p.locator('#dg-context [data-dg-task]').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom};}));
   assert(taskRects.every(r=>r.w>=44&&r.h>=44&&r.y>=0&&r.bottom<=height),prefix+' visible task touch targets');
   assert(taskRects.every(r=>Math.abs(r.y-taskRects[0].y)<1),prefix+' tasks share one row');
   await p.locator('#dg-context [data-dg-task="0"]').hover();await p.locator('#dg-context [data-dg-task="0"]').evaluate(e=>e.focus({preventScroll:true}));await p.keyboard.press('Tab');
   await shot(p,prefix+'-task-bar');
   await menu();await p.locator('#dg-course-dialog').evaluate(e=>e.scrollTop=0);await overflow(p,prefix+'/chapter-menu');
   const current=p.locator('#nav [data-page="4"]');
   assert.equal(await current.getAttribute('aria-current'),'step');
   const sizes=await p.locator('#nav [data-page]').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height};}));
   assert(sizes.every(r=>r.w>=44&&r.h>=44),prefix+' chapter touch targets');
   await p.locator('#nav [data-page="2"]').hover();await p.locator('#nav [data-page="0"]').evaluate(e=>e.focus({preventScroll:true}));await p.keyboard.press('Tab');await shot(p,prefix+'-chapter-menu');
   await p.locator('#nav [data-page="7"]').scrollIntoViewIfNeeded();await overflow(p,prefix+'/chapter-menu-bottom');
   const close=await p.locator('#dg-menu-close').boundingBox();assert(close.y>=0&&close.y+close.height<=height+1,prefix+' visible close control after scrolling');
   await p.locator('#dg-menu-close').focus();if(size==='large')await shot(p,prefix+'-chapter-menu-bottom');
   await p.keyboard.press('Enter');assert.equal(await p.locator('#dg-course-dialog').evaluate(e=>e.open),false);
   await jump(firstC,1,true);await overflow(p,prefix+'/destination');
   const before=await p.evaluate(()=>[focusRound,page]);await p.setViewportSize({width:height,height:width});await menu();await overflow(p,prefix+'/rotated');
   assert.deepEqual(await p.evaluate(()=>[focusRound,page]),before,'Rotation keeps the selected destination');
   report.responsive.push({width,height,theme,size,dayColumns:columns});await context.close();
  }
  assert.deepEqual(report.pageErrors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log('PASS: direct A/B/C task tabs; eight independent chapter entries; 16 day cards; keyboard/focus; scoped saved records; same-task scene preservation; manual Part 8; 20 viewport/theme/text combinations with expanded menus and rotation.');
 }catch(error){if(activePage&&!activePage.isClosed())await shot(activePage,'failure',true);throw error;}
 finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
