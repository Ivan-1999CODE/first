const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const d=require('./assets/micro-curriculum.cjs').make(8),r=d.rounds[4],out=path.resolve('tmp/day8-order-choice');
fs.mkdirSync(out,{recursive:true});
const beforePath=path.join(out,'before.json');
if(fs.existsSync(beforePath)){
 const before=JSON.parse(fs.readFileSync(beforePath,'utf8').replace(/^\uFEFF/,''));
 for(const i of [0,1,2,3,5])assert.deepEqual(d.rounds[i],before.rounds[i],'Other task unchanged');
 for(const k of ['flows','pairs','phrases','replies'])assert.deepEqual(d[k].slice(0,before[k].length),before[k],'Existing '+k+' and IDs preserved');
}
const lines=r.phraseIds.map(id=>d.phrases.find(p=>p.id===id).en);
assert(lines.includes('No, thank you.'));assert(lines.includes('Yes, please.'));
assert.equal(r.sayPrompts.length,3);assert(r.sayPrompts.every(s=>s.mode==='scenario'&&s.sentences.every(line=>lines.includes(line))));
assert.equal(r.flowIds.length,2);assert.equal(r.pairIds.length,2);
const file=path.resolve(d.file),html=fs.readFileSync(file,'utf8');
for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
const read=k=>JSON.parse(html.match(new RegExp('const '+k+'=([^\\r\\n]+);'))[1]);assert.deepEqual(read('rounds'),d.rounds);
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const p=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto(pathToFileURL(file).href);
  const old=r.retiredSayPrompts[0].id;
  await p.evaluate(({key,old})=>localStorage.setItem(key,JSON.stringify({answers:{[old]:'舊逐句作答','entry-before-A':'原任務紀錄'}})),{key:d.course.id,old});await p.reload();
  await p.locator('#dg-context [data-dg-task="4"]').click();
  const go=async n=>{await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-page="${n}"]`).click();};
  await go(1);assert.deepEqual(await p.locator('.study-library .dg-study-card > .en').allTextContents(),lines);
  assert.equal(await p.locator('.dg-study-changes').count(),0);
  await p.locator('.study-navigation [data-study-view="reply"]').click();
  for(const answer of ['Yes, please.','No, thank you.']){
   const id=r.replyIds.find(i=>d.replies[i].answer===answer);await p.locator(`.workshop-picker [data-reply="${id}"]`).click();
   assert.equal(await p.locator('.dg-study-current').getAttribute('data-study-speaker'),'other');
   await p.locator('.dg-study-current details > summary').click();assert((await p.locator('.dg-study-current').innerText()).includes('Would you like to place the order?'));
   await p.locator('[data-dg-reply-role="self"]').click();assert.equal(await p.locator('.dg-study-current [data-pane="2"]').getAttribute('aria-hidden'),'true');
   await p.locator('.dg-study-current [data-level="2"]').click();assert.equal(await p.locator('.dg-study-current [data-pane="2"] .en').textContent(),answer);
  }
  await go(3);
  assert((await p.locator('#main h1').innerText()).includes('看情境，自己選用'));
  assert.equal(await p.locator('.say-picker button').count(),3);
  assert((await p.locator('.say-old-records').textContent()).includes('舊逐句作答'));
  for(const [i,s]of r.sayPrompts.entries()){
   await p.locator(`.say-picker [data-say-index="${i}"]`).click();
   assert.equal(await p.locator('.say-prompt').innerText(),s.prompt);
   assert.equal(await p.locator('.say-reference').isVisible(),false);assert.equal(await p.locator('.say-keywords').isVisible(),false);
   assert(!(await p.locator('.say-card').innerText()).includes(s.answer),'Reference is not exposed');
   assert.equal(await p.locator('.say-practice [data-choice],.say-practice [data-reply]').count(),0,'Independent expression, not a dialogue or answer-choice quiz');
   await p.locator('[data-say-support="1"]').click();assert.equal(await p.locator('.say-keywords').innerText(),s.words);
   await p.locator('[data-say-support="2"]').click();assert.equal(await p.locator('.say-reference .en').innerText(),s.answer);
   assert((await p.locator('.say-reference').innerText()).includes(s.explanation));
   await p.locator('.say-note > summary').click();await p.locator('.say-note textarea').fill('情境 '+i+' 的自訂回答');
  }
  await go(2);
  const steps=await p.evaluate(()=>{
   const check=(v,m)=>{if(!v)throw Error(m);},click=s=>{const e=document.querySelector(s);check(e&&!e.disabled,s);e.click();};let n=0;
   for(const fi of activeRound().flowIds){
    click(`#main [data-start="${fi}"]`);
    while(!finished){check(n++<12,'finite flow');const t=currentStep();
     check([...document.querySelectorAll('[data-choice]')].every(b=>b.disabled),'gated choices');
     click(t.askFirst?'#spoken':'#heard');click(t.askFirst?'#heard':'#spoken');
     const bad=t.objects.findIndex((_,i)=>!t.valid.includes(i));if(bad>=0){click(`[data-choice="${bad}"]`);check(!canNext(),'incorrect choice cannot proceed');}
     click(`[data-choice="${t.valid[0]}"]`);check(canNext(),'correct choice');click('[data-act="next"]');
    }
    check(state.complete.includes(flows[fi].id),'saved completion');
   }return n;
  });assert.equal(steps,8);
  await go(4);await p.locator(`#main [data-pair="${r.pairIds[1]}"]`).click();await p.locator('.dg-teacher > summary').click();assert((await p.locator('.dg-teacher').innerText()).includes('No, thank you.'));
  await p.locator('[data-pair-check]').last().check();
  await p.reload();await p.locator('#dg-context [data-dg-task="4"]').click();await go(3);
  for(const [i,s]of r.sayPrompts.entries())assert.equal(await p.evaluate(id=>state.answers[id],s.id),'情境 '+i+' 的自訂回答');
  assert.equal(await p.evaluate(id=>state.answers[id],old),'舊逐句作答');assert.equal(await p.evaluate(()=>state.answers['entry-before-A']),'原任務紀錄');
  for(const [theme,width,size]of [['light',1280,'standard'],['dark',390,'large']]){
   await p.setViewportSize({width,height:900});await p.evaluate(({theme,size})=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size=size;document.documentElement.dataset.textSize=size;},{theme,size});
   await go(3);await p.locator('.say-picker [data-say-index="1"]').click();
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await p.screenshot({path:path.join(out,`04-${theme}-self.png`),fullPage:true});
   await p.locator('[data-say-support="2"]').click();
   await p.evaluate(async()=>{window.scrollTo({top:0,behavior:'instant'});await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));});
   await p.screenshot({path:path.join(out,`04-${theme}-reference.png`),fullPage:true});
   await go(1);await p.locator('.study-navigation [data-study-view="library"]').click();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await p.screenshot({path:path.join(out,`02-${theme}.png`),fullPage:true});
  }
  assert.deepEqual(errors,[]);console.log('PASS: Day 8 E taught acceptance/refusal, 3 contextual tasks, hidden hints, independent saved answers, old records, 2 complete flows, teacher dialogue, desktop/mobile themes; other tasks unchanged.');
 }catch(e){await p.screenshot({path:path.join(out,'failure.png'),fullPage:true});throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
