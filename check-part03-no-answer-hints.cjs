'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/part03-no-answer-hints');
fs.mkdirSync(out,{recursive:true});
const lessons=Array.from({length:14},(_,i)=>i?require('./assets/micro-curriculum.cjs').make(i+1):require('./assets/day1-focus-data.cjs'));
const file=d=>d.file||(d.course.day===1?'travel-english.html':'travel-english-unit2-shopping.html');
const url=d=>pathToFileURL(path.resolve(file(d))).href;
const report={questions:0,paymentPaths:0,layouts:0,errors:[]};
async function listenAndSpeak(p){
 for(const id of await p.evaluate(()=>currentStep().askFirst?['spoken','heard']:['heard','spoken']))await p.locator('#'+id).check();
}
async function noPaymentCue(p){
 const text=await p.locator('.vf-pick-heading,.d2-practice-context,.ci-stage,.ci-phase').allTextContents();
 assert(!/\d+\s*美元/.test(text.join(' ')),'visible payment context and heading omit the answer amount');
 assert.equal(await p.locator('.vf-picture-help,.vf-scene-context').count(),0);
 assert.equal(await p.locator('.vf-result-art').count(),0,'no result until a choice');
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  p.on('pageerror',e=>report.errors.push(e.message));
  for(const d of lessons){
   await p.goto(url(d));
   const checked=await p.evaluate(()=>{
    let count=0;
    for(const f of flows)for(const t of f.steps){
     const box=document.createElement('div');
     box.innerHTML=vfPanel(vfPracticeDialogue(t),{ready:true});
     const prompt=box.querySelector('.vf-pick-heading').textContent;
     if(t.choiceReview.mode==='listen'&&/\d/.test(prompt))throw Error('Listening answer amount in heading '+t.id);
     if(/6 美元。哪一組|合身狀態|保留兩張成人票|旅伴答應幫忙後/.test(prompt))throw Error('Answer in heading '+t.id);
     if(box.querySelector('.vf-result-art,.vf-picture-help,.vf-scene-context'))throw Error('Premature result or removed disclosure '+t.id);
     count++;
    }
    return count;
   });
   report.questions+=checked;
  }
  const shopping=lessons[1];
  await p.goto(url(shopping));
  await p.locator('#dg-menu-open').click();await p.locator('#nav [data-dg-task="1"]').click();
  await p.locator('.dg-section-switch button').nth(2).click();
  await listenAndSpeak(p);await p.locator('[data-choice="0"]').click();await p.locator('[data-act="next"]').click();
  await p.locator('#spoken').check();
  assert.equal(await p.locator('.dg-listening [data-say]').first().getAttribute('data-say'),'Six dollars in total. Thank you.');
  assert.equal(await p.locator('.dg-transcript [aria-hidden="true"]').count(),1,'translation starts hidden');
  await p.locator('[data-dg-transcript]').click();assert((await p.locator('.dg-transcript').innerText()).includes('6 美元'));
  await p.locator('[data-dg-transcript]').click();await p.locator('#heard').check();
  await noPaymentCue(p);
  assert.equal(await p.locator('.vf-replay').getAttribute('data-say'),'Six dollars in total. Thank you.');
  await p.locator('[data-choice="1"]').click();assert(await p.locator('[data-act="next"]').isDisabled());
  assert(!/6 美元/.test(await p.locator('#flowFeedback').innerText()),'wrong attempt does not reveal the answer');
  await p.locator('[data-choice="0"]').press('Enter');assert(await p.locator('[data-act="next"]').isEnabled());
  assert((await p.locator('.vf-result').innerText()).includes('5 美元加 1 美元'));
  for(const theme of ['light','dark'])for(const width of [390,820,1280]){
   await p.setViewportSize({width,height:900});
   await p.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size='large';},theme);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
   await p.locator('.scene-board').screenshot({path:path.join(out,`payment-${theme}-${width}.png`)});report.layouts++;
  }
  const chapter=require('./assets/chapter-integration-data.cjs')(shopping);
  for(const group of chapter.groups)for(const route of group.paths){
   await p.goto(url(shopping)+'#chapter-'+group.id);await p.reload();
   await p.locator('.dg-section-switch button').nth(2).click();await p.locator(`[data-ci-path="${route.id}"]`).click();
   for(const step of route.steps){
    const payment=step.choiceKind==='cash-set';
    const amount=group.id==='budget'?'Four':'Six';
    const order=step.askFirst?['spoken','heard']:['heard','spoken'];
    for(const role of order){
     if(payment&&role==='heard')assert.equal(await p.locator('[data-ci-flow-role="heard"] [data-say]').first().getAttribute('data-say'),amount+' dollars in total. Thank you.');
     await p.locator(`[data-ci-gate="${role}"]`).click();
    }
    if(payment){
     await noPaymentCue(p);assert.equal(await p.locator('.vf-replay').getAttribute('data-say'),amount+' dollars in total. Thank you.');
     const wrong=step.valid[0]===0?1:0;
     await p.locator(`[data-ci-choice="${wrong}"]`).click();assert(await p.locator('[data-ci-next]').isDisabled());report.paymentPaths++;
    }
    await p.locator(`[data-ci-choice="${step.valid[0]}"]`).click();await p.locator('[data-ci-next]').click();
   }
   assert(await p.locator('.ci-complete').isVisible());
  }
  assert.deepEqual(report.errors,[]);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
