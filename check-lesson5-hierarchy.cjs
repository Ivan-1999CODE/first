'use strict';
// Focused browser regression for the Day 5 visual demonstration.
// Uses isolated browser contexts; never edits the user's browser records.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const data=require('./assets/micro-curriculum.cjs').make(5);
const out=path.resolve('tmp/lesson5-review');fs.mkdirSync(out,{recursive:true});
const configs=[
 {width:320,height:568,theme:'light',size:'large'},
 {width:320,height:568,theme:'dark',size:'large'},
 {width:390,height:844,theme:'light',size:'standard'},
 {width:390,height:844,theme:'dark',size:'large'},
 {width:768,height:1024,theme:'light',size:'standard'},
 {width:768,height:1024,theme:'dark',size:'large'},
 {width:844,height:390,theme:'light',size:'standard'},
 {width:844,height:390,theme:'dark',size:'large'},
 {width:1024,height:768,theme:'light',size:'large'},
 {width:1024,height:768,theme:'dark',size:'standard'},
 {width:1440,height:1000,theme:'light',size:'standard'},
 {width:1440,height:1000,theme:'dark',size:'large'}
];
const report={views:0,configs:[],interactions:[],screenshots:[],overflow:[],smallTargets:[],pageErrors:[],failures:[]};
const labelOf=c=>`${c.width}-${c.theme}-${c.size}`;
const shot=async(p,name)=>{await p.screenshot({path:path.join(out,name+'.png')});report.screenshots.push(name+'.png')};
const bounds=async(p,label)=>{
 const issue=await p.evaluate(()=>{
  const visible=e=>{
   if(!e.getClientRects().length||getComputedStyle(e).visibility==='hidden'||e.closest('[aria-hidden="true"],[inert],[hidden]'))return false;
   let n=e;while(n.parentElement){const parent=n.parentElement;if(parent.tagName==='DETAILS'&&!parent.open&&n.tagName!=='SUMMARY')return false;n=parent;}return true;
  };
  const items=[...document.querySelectorAll('#main *,#dg-context *,#dg-course-dialog[open] *,#dg-day-picker[open] *,.top button')].filter(e=>{
   if(!visible(e)||e instanceof SVGElement)return false;
   // These two named areas intentionally scroll horizontally. Hidden/clip
   // parents elsewhere do NOT bypass the check (they can conceal real loss).
   if(e.closest('.dg-task-switch,.inventory-scroll')&& !e.matches('.dg-task-switch,.inventory-scroll'))return false;
   const r=e.getBoundingClientRect();return r.width>0&&(r.left < -1||r.right>innerWidth+1);
  }).slice(0,12).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.trim().slice(0,70),rect:{x:e.getBoundingClientRect().x,width:e.getBoundingClientRect().width}}));
  const small=[...document.querySelectorAll('#main button,#main summary,.top button,#dg-context button,#dg-course-dialog[open] button')].filter(e=>visible(e)&&!e.disabled).map(e=>({text:e.textContent.trim().slice(0,50),height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width})).filter(x=>x.height<43.5||x.width<43.5);
  return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,items,small};
 });
 if(issue.small.length)report.smallTargets.push({label,items:issue.small});
 if(issue.items.length||issue.scrollWidth>issue.viewport+1){report.overflow.push({label,...issue});throw Error(`${label}: overflow ${JSON.stringify(issue)}`)}
};
const chapter=async(p,index)=>{await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-page="${index}"]`).click();assert.equal(await p.evaluate(()=>page),index)};
const keyboardMenu=async(p,label)=>{
 await p.locator('#dg-menu-open').focus();await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'large',label+' Tab reaches text-size control');
 await p.keyboard.press('Shift+Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'dg-menu-open');await p.keyboard.press('Enter');
 assert(await p.locator('#dg-course-dialog').evaluate(e=>e.open),label+' Enter opens menu');
 assert.equal(await p.evaluate(()=>document.activeElement.id),'dg-menu-close',label+' dialog initial focus');
 assert(await p.locator('#dg-course-dialog').evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=-1&&r.bottom<=innerHeight+1}),label+' dialog fits viewport height');
 await p.keyboard.press('Enter');assert(!await p.locator('#dg-course-dialog').evaluate(e=>e.open));assert.equal(await p.evaluate(()=>document.activeElement.id),'dg-menu-open',label+' Enter closes and restores focus');
 await p.keyboard.press('Enter');await p.keyboard.press('Escape');assert(!await p.locator('#dg-course-dialog').evaluate(e=>e.open));assert.equal(await p.evaluate(()=>document.activeElement.id),'dg-menu-open',label+' Escape restores focus');
};
const task=async(p,index)=>{const before=await p.evaluate(()=>page);await p.locator(`#dg-context [data-dg-task="${index}"]`).click();assert.deepEqual(await p.evaluate(()=>[taskRound,page]),[index,before])};
const expandFor=async loc=>{for(const d of await loc.locator('xpath=ancestor::details').all()){if(!await d.evaluate(e=>e.open))await d.locator(':scope > summary').click()}};
const fill=async(p,key,value)=>{const loc=p.locator(`[data-field="${key}"]`);await expandFor(loc);await loc.fill(value);assert.equal(await p.evaluate(k=>state.answers[k],key),value)};
const exerciseFlow=async(p,label)=>{
 await chapter(p,2);let steps=0;
 while(!await p.evaluate(()=>finished)){
  assert(steps++<15,'Flow cannot loop indefinitely');
  assert(await p.locator('[data-choice]').first().isDisabled(),'Choices locked until speech/listening confirmations');
  const first=await p.evaluate(()=>currentStep().askFirst?'spoken':'heard');
  await p.locator('#'+first).check();await p.locator('#'+(first==='spoken'?'heard':'spoken')).check();
  assert(!await p.locator('[data-choice]').first().isDisabled(),'Choices unlock after confirmations');
  const choices=await p.evaluate(()=>({good:currentStep().objects.findIndex((_,i)=>accepted(currentStep(),i)),bad:currentStep().objects.findIndex((_,i)=>!accepted(currentStep(),i))}));
  if(choices.bad>=0){await p.locator(`[data-choice="${choices.bad}"]`).click();assert(await p.locator('[data-act="next"]').isDisabled());assert(await p.locator('.feedback.retry').count())}
  await p.locator(`[data-choice="${choices.good}"]`).click();assert(!await p.locator('[data-act="next"]').isDisabled());await p.locator('[data-act="next"]').click();
 }
 report.interactions.push({label,flowSteps:steps,completed:true});
};
const records=async(p,label)=>{
 const expected={answers:{},checks:{},ratings:{},home:{}};
 for(let n=0;n<data.rounds.length;n++){
  await task(p,n);const r=data.rounds[n],beforeKey=(r.entryCheckpoint?'entry-before-':'before-')+r.id,afterKey=(r.entryCheckpoint?'entry-after-':'after-')+r.id;
  await chapter(p,0);const before=`Task ${n} first <keep> & original`;await fill(p,beforeKey,before);expected.answers[beforeKey]=before;
  await chapter(p,3);
  for(const mid of r.missionIds){if(r.missionIds.length>1)await p.locator(`[data-mission="${mid}"]`).click();const key='mission-'+data.missions[mid].id;const text=`Task ${n} own variation ${mid}`;await fill(p,key,text);expected.answers[key]=text;}
  await chapter(p,4);
  for(const pid of r.pairIds){if(r.pairIds.length>1)await p.locator(`[data-pair="${pid}"]`).click();const pair=data.pairs[pid],loc=p.locator(`[data-pair-check="${pair.id}:0"]`);await loc.check();await loc.uncheck();await loc.check();expected.checks[pair.id]=pair.goals.map((_,i)=>i===0);const key='note-'+pair.id;await fill(p,key,`Task ${n} real spoken note`);expected.answers[key]=`Task ${n} real spoken note`;}
  await chapter(p,5);assert.equal((await p.locator('.dg-before-record .readonly').innerText()).trim(),before);await fill(p,afterKey,`Task ${n} now <better>`);expected.answers[afterKey]=`Task ${n} now <better>`;
  const skill=r.checkpoint.skills[0];for(const level of [1,2,3,1]){await p.locator(`[data-rating="${skill.id}:${level}"]`).click();assert.equal(await p.evaluate(id=>state.ratings[id],skill.id),level);const meter=p.locator('.rating').filter({has:p.locator(`[data-rating="${skill.id}:1"]`)});assert.equal(await meter.locator('.meter .'+(level===3?'green':'yellow')).count(),level)}expected.ratings[skill.id]=1;
  await chapter(p,6);
  for(const [qi,q] of (r.home.quizzes||[r.home.quiz]).entries()){
   const sel=i=>`[data-merged-quiz="${r.id}:${qi}:${i}"]`;
   await p.locator(sel((q.correct+1)%q.options.length)).click();assert.equal(await p.locator(`[data-home-question="${q.id}"] .feedback.retry`).count(),1);
   await p.locator(sel(q.correct)).click();assert.equal(await p.locator(`[data-home-question="${q.id}"] .feedback.retry`).count(),0);
  }
  await fill(p,'home-'+r.id,`Task ${n} homework`);expected.answers['home-'+r.id]=`Task ${n} homework`;
  for(const kind of ['listen','spoken'])await p.locator(`[data-task-home="${r.id}:${kind}"]`).check();expected.home[r.id]={listen:true,spoken:true};
 }
 const verify=async()=>{const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem(course.id)));for(const [k,v]of Object.entries(expected.answers))assert.equal(saved.answers[k],v);for(const[k,v]of Object.entries(expected.checks))assert.deepEqual(saved.checks[k],v);for(const[k,v]of Object.entries(expected.ratings))assert.equal(saved.ratings[k],v);assert.deepEqual(saved.taskHome,expected.home);assert.equal(await p.evaluate(()=>localStorage.getItem('lesson5-qa-unrelated')),'preserve unrelated data')};
 await verify();await p.reload();await verify();await task(p,0);await chapter(p,0);const firstKey=(data.rounds[0].entryCheckpoint?'entry-before-':'before-')+data.rounds[0].id;assert.equal(await p.locator(`[data-field="${firstKey}"]`).inputValue(),expected.answers[firstKey]);
 report.interactions.push({label,savedFields:Object.keys(expected.answers).length,reload:true,taskIsolation:true,ratings:'1→2→3→1',quizRetry:true});
};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});let active;
 try{
  for(const config of configs){
   const tag=labelOf(config),context=await browser.newContext({viewport:{width:config.width,height:config.height},hasTouch:config.width<=1024,isMobile:config.width<=390||(config.width===844&&config.height===390)});
   const p=await context.newPage();active=p;p.setDefaultTimeout(10000);p.on('pageerror',e=>report.pageErrors.push({tag,message:e.message}));
   await p.addInitScript(c=>{if(!sessionStorage.getItem('lesson5-qa-initialized')){localStorage.setItem('travel-lab-theme',c.theme);localStorage.setItem('travel-lab-text-size',c.size);localStorage.setItem('lesson5-qa-unrelated','preserve unrelated data');sessionStorage.setItem('lesson5-qa-initialized','true')}},config);
   await p.goto(pathToFileURL(path.resolve('travel-english-unit5-getting-around.html')).href);
   assert.equal(await p.locator('#dg-context [data-dg-task]').count(),4);assert.equal(await p.locator('#nav [data-page]').count(),7);
   for(let n=0;n<4;n++){
    await task(p,n);
    for(let part=0;part<7;part++){
     await p.evaluate(i=>navigate(i),part);await bounds(p,`${tag} task${n} part${part+1}`);report.views++;
     if(n===0&&((config.width===1440&&config.theme==='light'&&[0,1,2].includes(part))||(config.width===390&&[0,2].includes(part))||(config.width===768&&part===3))){await p.evaluate(()=>scrollTo(0,0));await shot(p,`after-${tag}-part${part+1}`)}
    }
   }
   await task(p,0);await chapter(p,3);
   for(const level of [1,2,0]){const b=p.locator(`[data-guide-hint][data-level="${level}"]`).first();await b.click();assert.equal(await b.getAttribute('aria-pressed'),'true');await bounds(p,`${tag} hint${level}`)}
   await chapter(p,4);await p.locator('.dg-teacher > summary').click();await p.locator('.dg-teacher-start > summary').click();await p.locator('[data-pair-check]').first().check();await bounds(p,`${tag} teacher open`);
   if([390,1024,1440].includes(config.width)){await p.locator('.dg-teacher').scrollIntoViewIfNeeded();await shot(p,`after-${tag}-teacher`)}
   await p.locator('#dg-menu-open').click();await bounds(p,`${tag} menu`);await p.locator('#nav [data-page="1"]').hover();await p.locator('#dg-menu-close').focus();await p.keyboard.press('Tab');
   if([390,844,1024].includes(config.width))await shot(p,`after-${tag}-menu`);
   await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.activeElement.id),'dg-menu-open');
   await p.locator('#dg-day-picker > summary').click();await bounds(p,`${tag} days`);assert.equal(await p.locator('#dg-day-picker a').count(),16);
   if([390,844,1024].includes(config.width))await shot(p,`after-${tag}-days`);await p.locator('#dg-day-picker > summary').focus();await p.keyboard.press('Escape');
   await keyboardMenu(p,tag);
   await p.locator('#theme,#themeToggle').click();assert.equal(await p.evaluate(()=>document.documentElement.dataset.theme),config.theme==='dark'?'light':'dark');await bounds(p,`${tag} theme toggled`);await p.locator('#theme,#themeToggle').click();
   await p.locator('#large').click();assert.equal(await p.evaluate(()=>document.documentElement.dataset.size),config.size==='large'?'standard':'large');await bounds(p,`${tag} size toggled`);await p.reload();assert.equal(await p.evaluate(()=>document.documentElement.dataset.size),config.size==='large'?'standard':'large');await p.locator('#large').click();
   await chapter(p,1);await p.locator('[data-study-view="reply"]').first().click();const role=await p.locator('[data-study-speaker]').getAttribute('data-study-speaker');await p.locator('[data-dg-reply-role]').first().click();assert.notEqual(await p.locator('[data-study-speaker]').getAttribute('data-study-speaker'),role);await bounds(p,`${tag} dialogue role`);
   if((config.width===390&&config.theme==='light')||(config.width===1024&&config.theme==='dark')){
    for(let n=0;n<4;n++){await task(p,n);await exerciseFlow(p,`${tag} task${n}`)}
    await records(p,tag);
   }
   report.configs.push({...config,keyboardMenu:'Tab / Shift+Tab / Enter / Escape PASS'});console.log(`PASS ${tag}: 28 lesson views, navigation, hints, teacher, day chooser, appearance, dialogue, keyboard menu`);await context.close();
  }
  assert.deepEqual(report.pageErrors,[],'No runtime errors');
 }catch(e){report.failures.push(e.stack);if(active)await shot(active,'failure');throw e;}
 finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close()}
 console.log(`PASS ${report.views} views in ${report.configs.length} device/theme/text configurations; ${report.interactions.length} flow/save cases; ${report.screenshots.length} screenshots. Small-target observations: ${report.smallTargets.length}.`);
})().catch(e=>{console.error(e);process.exit(1)});
