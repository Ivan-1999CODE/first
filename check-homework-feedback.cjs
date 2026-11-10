'use strict';
// Isolated browser records: exercise answers, retry, practice toggles and reload.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/homework-colors');fs.mkdirSync(out,{recursive:true});
const report={pages:0,tasks:0,questions:0,integrated:0,errors:[]};
const colors={light:{correct:'rgb(36, 128, 77)',wrong:'rgb(179, 62, 58)'},dark:{correct:'rgb(121, 206, 152)',wrong:'rgb(241, 154, 144)'}};
const practice='input:is([data-task-home],[data-ci-home],[data-hi-home],[data-hi-home-transfer],[data-hx-home])';
async function result(card,kind,theme){
 assert.equal(await card.getAttribute('data-home-result'),kind);
 const choice=card.locator('button[aria-pressed=true]');
 assert.equal(await choice.count(),1);
 await choice.hover();await choice.focus();
 assert.equal(await choice.evaluate(e=>getComputedStyle(e).borderTopColor),colors[theme][kind]);
 const feedback=card.locator('.feedback,p[role=status]');
 assert.equal(await feedback.evaluate(e=>getComputedStyle(e).borderTopColor),colors[theme][kind]);
 assert((await feedback.innerText()).trim(),'A result is also expressed as text.');
}
async function quiz(card,correct,theme){
 const options=card.locator('button[data-task-quiz],button[data-merged-quiz],button[data-ci-quiz],button[data-hi-quiz],button[data-hx-quiz]');
 const wrong=Array.from({length:await options.count()},(_,i)=>i).find(i=>!correct.includes(i));
 assert.notEqual(wrong,undefined);
 await options.nth(wrong).focus();await options.nth(wrong).press('Enter');await result(card,'wrong',theme);
 await options.nth(correct[0]).click();await result(card,'correct',theme);
 report.questions++;
}
async function practiceToggles(p,theme){
 const boxes=p.locator('#main '+practice);assert.equal(await boxes.count(),2);
 for(let i=0;i<2;i++){
  const box=boxes.nth(i),label=box.locator('..'),panel=box.locator('xpath=ancestor::section[contains(concat(" ",normalize-space(@class)," ")," panel ")][1]');
  await box.uncheck();const neutral=await label.evaluate(e=>getComputedStyle(e).borderTopColor);
  await box.check();assert.equal(await label.evaluate(e=>getComputedStyle(e).borderTopColor),colors[theme].correct);
  assert.equal(await panel.evaluate(e=>getComputedStyle(e).borderBottomColor),colors[theme].correct);
  await box.uncheck();assert.equal(await label.evaluate(e=>getComputedStyle(e).borderTopColor),neutral);
  await box.check();
 }
 assert(await boxes.nth(0).isChecked());assert(await boxes.nth(1).isChecked());
}
async function theme(p,name){
 await p.evaluate(name=>{document.documentElement.dataset.theme=name;appearance();},name);
 await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const files=fs.readdirSync('.').filter(f=>/^travel-english(?:-unit\d+-[^.]+)?\.html$/.test(f));
  for(const file of files){
   const ctx=await browser.newContext({viewport:{width:1366,height:1000},reducedMotion:'reduce'}),p=await ctx.newPage();
   p.setDefaultTimeout(6000);p.on('pageerror',e=>report.errors.push(file+': '+e.message));
   const url=pathToFileURL(path.resolve(file)).href;await p.goto(url);await theme(p,'light');
   if(file==='travel-english.html'){
    const legacy=await p.evaluate(()=>({key:previousRevisionKeys[0],value:JSON.stringify({answers:{before:'保留舊紀錄 QA'}})}));
    await p.evaluate(({key,value})=>localStorage.setItem(key,value),legacy);await p.evaluate(()=>navigate(5));
    assert.equal(await p.locator('#main .old-records').count(),0);
    assert(!(await p.locator('#main').innerText()).includes('改版前的第一天紀錄'));
    assert.equal(await p.evaluate(key=>localStorage.getItem(key),legacy.key),legacy.value);
   }
   const count=await p.evaluate(()=>rounds.length);
   for(let i=0;i<count;i++){
    await p.evaluate(i=>{if(typeof focusRound==='number')setRound(i);else setTaskRound(i);navigate(6);},i);
    const questions=await p.evaluate(()=>{const r=typeof focusRound==='number'?currentRound():activeRound();return (r.home.quizzes||[r.home.quiz]).map(q=>({id:q.id,correct:q.correct}));});
    for(const q of questions){
     const card=p.locator(`[data-home-quiz="${q.id}"],[data-home-question="${q.id}"]`);
     assert.equal(await card.getAttribute('data-home-result'),'unanswered');
     await quiz(card,[q.correct],'light');
    }
    await practiceToggles(p,'light');report.tasks++;
   }
   const stored=await p.evaluate(()=>localStorage.getItem(course.id));await p.reload();await p.evaluate(()=>navigate(6));
   assert.equal(await p.evaluate(()=>localStorage.getItem(course.id)),stored);
   assert(await p.locator('#main '+practice).nth(0).isChecked());assert(await p.locator('#main '+practice).nth(1).isChecked());
   const groups=await p.locator('[data-ci-group],[data-hi-group]').evaluateAll(els=>els.map(e=>({type:e.hasAttribute('data-ci-group')?'ci':'hi',id:e.dataset.ciGroup||e.dataset.hiGroup})));
   for(const g of groups){
    await p.locator('#dg-menu-open').click();await p.locator(`[data-${g.type}-group="${g.id}"]`).click();
    await p.locator(`#dg-context [data-${g.type}-${g.type==='ci'?'section':'page'}="6"]`).click();
    const quizzes=p.locator('#main [data-home-result]');
    for(let i=0;i<await quizzes.count();i++){
     const card=quizzes.nth(i),button=card.locator('button[data-ci-quiz],button[data-hi-quiz],button[data-hx-quiz]').first();
     const correct=await button.evaluate(e=>{
      if(e.dataset.ciQuiz){const id=e.dataset.ciQuiz.split(':')[0],s=chapterIntegration.groups.flatMap(g=>g.paths.flatMap(p=>p.steps)).find(s=>s.id===id);return s.choiceReview.mode==='listen'?s.valid:[0];}
      if(e.dataset.hiQuiz)return [hotelIntegration.quizzes.find(q=>q.id===e.dataset.hiQuiz.split(':')[0]).correct];
      const group=e.closest('[data-hx-group]').dataset.hxGroup;
      return hotelIntegration.extended.groups.find(g=>g.id===group).homework.listen[Number(e.dataset.hxQuiz.split(':')[0])].valid;
     });
     await quiz(card,correct,'light');
    }
    await practiceToggles(p,'light');report.integrated++;
   }
   if(file==='travel-english.html'||file==='travel-english-unit8-hotel.html'){
    await p.goto(url);await p.evaluate(()=>{if(typeof focusRound==='number')setRound(0);else setTaskRound(0);navigate(6);});
    const q=await p.evaluate(()=>(typeof focusRound==='number'?currentRound():activeRound()).home.quiz);
    for(const name of ['light','dark']){
     await theme(p,name);const card=p.locator(`[data-home-quiz="${q.id}"],[data-home-question="${q.id}"]`);
     await quiz(card,[q.correct],name);await practiceToggles(p,name);
     // Show one correct and one incorrect answer together when there are two questions.
     const second=p.locator('#main [data-home-result]').nth(1);
     if(await second.count()){
      const correct=await p.evaluate(()=>(typeof focusRound==='number'?currentRound():activeRound()).home.quizzes[1].correct);
      await second.locator('button[data-task-quiz],button[data-merged-quiz]').nth(correct===0?1:0).click();await result(second,'wrong',name);
     }
     for(const width of [1366,390]){
      await p.setViewportSize({width,height:1000});await p.evaluate(width=>{document.documentElement.dataset.size=width===390?'large':'standard';appearance();},width);
      assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await p.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'});});
      await p.screenshot({path:path.join(out,(file==='travel-english.html'?'day1':'day8')+'-'+name+'-'+width+'.png'),fullPage:true});
     }
    }
   }
   report.pages++;await ctx.close();
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));
  console.log('PASS homework feedback: '+JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
