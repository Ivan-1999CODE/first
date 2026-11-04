'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/day2-bag-study');fs.mkdirSync(out,{recursive:true});
const file='travel-english-unit2-shopping.html',html=fs.readFileSync(file,'utf8'),url=pathToFileURL(path.resolve(file)).href;
const data=JSON.parse(html.match(/const chapterIntegration=(.*);/)[1]);
const report={paths:0,layouts:0,errors:[],screenshots:[]};
async function shot(p,name){await p.locator('.ci-study-picker').screenshot({path:path.join(out,name+'.png')});report.screenshots.push(name+'.png');}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});p.setDefaultTimeout(6000);p.on('pageerror',e=>report.errors.push(e.stack));
 await p.goto(url+'#chapter-single');await p.locator('.dg-section-switch button').nth(1).click();
 if(process.argv.includes('--before')){await shot(p,'before');console.log('Before screenshot saved');return;}
 const oldCurriculum=require('./assets/micro-curriculum.cjs').make(2);for(const key of ['course','rounds','flows','phrases','replies','missions','pairs'])assert.deepEqual(JSON.parse(html.match(new RegExp('const '+key+'=(.*);'))[1]),JSON.parse(JSON.stringify(oldCurriculum[key])));
 for(const group of data.groups.filter(g=>['single','water'].includes(g.id))){
  await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-ci-group="${group.id}"]`).click();
  const key=group.storageKey;await p.evaluate(key=>localStorage.setItem(key,JSON.stringify({answers:{before:'保留原本回答'},complete:['existing-record']})),key);const saved=await p.evaluate(key=>localStorage.getItem(key),key);
  const first=group.paths[0],second=group.paths[1];assert.deepEqual(first.steps.slice(0,-1).map(s=>s.answer),second.steps.slice(0,-1).map(s=>s.answer));
  for(const [i,route]of group.paths.entries()){
   await p.locator(`[data-ci-study-path="${route.id}"]`).click();const expected=i?'Yes, please.':'No, thank you.';
   assert.equal(await p.locator('.ci-study-difference .ci-difference-answer').innerText(),expected);
   assert.equal(await p.locator('.ci-study-difference .ci-difference-question').innerText(),'Would you like a bag?');
   assert.equal(await p.locator('.ci-study-section .task-phrase>.en').last().innerText(),expected);
   assert.equal(await p.locator('.ci-study-section .task-phrase>.en').count(),5,'Keep the complete shopping flow');
   await p.locator('[data-ci-study="reply"]').first().click();await p.locator('[data-ci-reply="4"]').first().click();await p.locator('[data-ci-speaker="self"]').click();await p.locator('.ci-turn [data-level="2"]').click();assert((await p.locator('.ci-turn').innerText()).includes(expected));
   await p.locator('[data-ci-study="library"]').first().click();assert.equal(await p.evaluate(key=>localStorage.getItem(key),key),saved,'Browsing must not change answers or completion');report.paths++;
  }
  await p.locator('[data-ci-all]').click();assert.equal(await p.locator('.ci-study-difference').count(),0);assert.equal(await p.locator('.ci-study-section').count(),2);const answers=await p.locator('.ci-study-section .task-phrase>.en').allTextContents();assert(answers.includes('No, thank you.')&&answers.includes('Yes, please.'));
 }
 for(const theme of ['light','dark'])for(const width of [390,820,1280]){
  await p.setViewportSize({width,height:900});await p.evaluate(theme=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size','large');},theme);await p.reload();await p.locator('.dg-section-switch button').nth(1).click();
  const button=p.locator('[data-ci-study-path="bag"]');await button.focus();await p.keyboard.press('Enter');assert.equal(await p.locator('.ci-difference-answer').innerText(),'Yes, please.');
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));const bounds=await p.locator('.ci-study-difference').boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=width+1);report.layouts++;
  if(width!==820)await shot(p,`water-${theme}-${width}`);
  await p.locator('[data-ci-study-path="three"]').click();assert.equal(await p.locator('.ci-difference-answer').innerText(),'No, thank you.');
 }
 await p.locator('#dg-menu-open').click();await p.locator('#nav [data-ci-group="budget"]').click();assert.equal(await p.locator('.ci-study-difference').count(),0,'No bag variant summary on the single-route group');
 assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
