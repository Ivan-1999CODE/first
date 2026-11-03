const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/focus-rollout'),baseline=JSON.parse(fs.readFileSync(path.join(out,'before.json'),'utf8'));
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const configs=[{width:1440,height:1000,theme:'light',size:'standard'},{width:320,height:568,theme:'dark',size:'large'},{width:768,height:1024,theme:'light',size:'large'},{width:1024,height:768,theme:'dark',size:'standard'}];
const report={pages:0,pairs:0,messages:0,flowSteps:0,records:0,screenshots:[],errors:[],failures:[]};
async function shot(p,name,selector){
 const size=p.viewportSize(),loc=selector?p.locator(selector):null;
 if(loc){const b=await loc.boundingBox();if(b.height>size.height-160)await p.setViewportSize({...size,height:Math.ceil(b.height+180)})}
 await (loc||p).screenshot({path:path.join(out,name+'.png')});await p.setViewportSize(size);report.screenshots.push(name);
}
async function fits(p,label){
 const issue=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('.d5-script-en,.d5-script-role,.d5-student-hint > summary')].filter(e=>e.getClientRects().length&&e.scrollWidth>e.clientWidth+1).map(e=>e.textContent)}));
 assert(issue.scroll<=issue.width+1,label+': '+JSON.stringify(issue));assert.deepEqual(issue.overflow,[],label);
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});let active;
 try{
  for(const lesson of baseline.lessons){
   for(const [configIndex,c] of configs.entries()){
    const ctx=await browser.newContext({viewport:{width:c.width,height:c.height},hasTouch:c.width<1100,isMobile:c.width<500}),p=await ctx.newPage();active=p;p.setDefaultTimeout(10000);
    p.on('pageerror',e=>report.errors.push(`Day ${lesson.day}: ${e.message}`));
    await p.addInitScript(c=>{localStorage.setItem('travel-lab-theme',c.theme);localStorage.setItem('travel-lab-text-size',c.size)},c);
    await p.goto(pathToFileURL(path.resolve(lesson.file)).href);
    const curriculum=await p.evaluate(()=>JSON.stringify({course,rounds,flows,pairs,phrases,missions,replies}));assert.equal(hash(curriculum),lesson.hash,'Day '+lesson.day+' curriculum unchanged');
    assert(await p.locator('body').evaluate(e=>e.classList.contains('lesson-focus')));
    await p.evaluate(()=>{window.qaSpeech=[];speechSynthesis.speak=u=>window.qaSpeech.push({text:u.text,rate:u.rate})});
    for(let section=0;section<7;section++){
     await p.evaluate(n=>navigate(n),section);await fits(p,`Day ${lesson.day}/${c.width}/part ${section+1}`);report.pages++;
     if(section===0){assert(await p.locator('.dg-entry-note,.dg-entry-record').evaluate(e=>e.open));assert.equal(await p.locator('#main > .dg-teacher-notes').count(),0)}
     if(section===1||section===2){const buttons=p.locator('#main > .footer-actions button');assert.equal(await buttons.count(),2);assert((await buttons.nth(0).innerText()).startsWith('←'));assert((await buttons.nth(1).innerText()).endsWith('→'))}
    }
    const roundCount=await p.evaluate(()=>rounds.length);
    for(let ri=0;ri<roundCount;ri++){
     await p.locator(`[data-dg-task="${ri}"]`).click();await p.evaluate(()=>navigate(4));
     const pairIds=await p.evaluate(()=> (typeof activeRound==='function'?activeRound():currentRound()).pairIds);
     for(const pi of pairIds){
      await p.evaluate(n=>{pair=n;render()},pi);
      const guide=p.locator('.dg-teacher');assert(!await guide.evaluate(e=>e.open));
      await guide.locator(':scope > summary').focus();await p.keyboard.press('Enter');
      const expected=await p.evaluate(()=>{const r=typeof activeRound==='function'?activeRound():currentRound(),f=flows[r.flowIds?.[r.pairIds.indexOf(pair)]??rounds.indexOf(r)];return{steps:f.steps,prelude:f.prelude,role:r.role||course.replyRole}});
      const actual=await guide.locator('[data-teacher-step]').evaluateAll(es=>es.map(e=>({id:e.dataset.teacherStepId,messages:[...e.querySelectorAll('.d5-script-line')].map(m=>({speaker:m.dataset.speaker,line:m.querySelector('.d5-script-en').textContent,role:m.querySelector('.d5-script-role').textContent}))})));
      assert.equal(actual.length,expected.steps.length);
      actual.forEach((x,i)=>{const s=expected.steps[i];assert.equal(x.id,s.id);assert.deepEqual(x.messages.map(m=>m.speaker),s.askFirst?['student','teacher']:['teacher','student']);
       x.messages.forEach(m=>{const student=m.speaker==='student';assert.equal(m.line,student?s.answer:s.line);assert.equal(m.role,student?'Student':'Teacher');report.messages++})});
      assert.equal(await guide.locator('[data-teacher-prelude]').count(),expected.prelude?1:0);
      if(expected.prelude)assert.equal(await guide.locator('[data-teacher-prelude] .d5-script-en').textContent(),expected.prelude.line);
      assert.equal(await guide.locator('button,audio,.d5-chat-bubble').count(),0);
      assert(!/[\u3400-\u9fff]/u.test(await guide.locator('.d5-teacher-script').textContent()));
      await fits(p,`Day ${lesson.day} pair ${pi}/${c.width}`);
      assert.equal(await p.locator('.dg-pair-note').count(),0);assert(await p.locator('.dg-student-help').evaluate(e=>!e.closest('.dg-teacher')&&e.previousElementSibling.classList.contains('dg-teacher')));
      const hints=p.locator('.dg-student-help > details');assert.equal(await hints.count(),expected.steps.length);
      assert(await hints.evaluateAll(es=>es.every(e=>!e.open)));
      await hints.first().locator(':scope > summary').focus();await p.keyboard.press('Enter');
      assert.equal(await p.locator('.dg-student-help > details[open]').count(),1);
      if(ri===0&&pi===pairIds[0]&&configIndex<2){
       await shot(p,`day${lesson.day}-${c.width}-${c.theme}-script`,'.dg-teacher');
       await shot(p,`day${lesson.day}-${c.width}-${c.theme}-hints`,'.dg-student-help');
      }
      report.pairs++;
     }
     for(const section of [5,6]){await p.evaluate(n=>navigate(n),section);assert.equal(await p.locator('[data-review-task]').count(),1);assert.equal(await p.locator('.dg-review-options').count(),0);await fits(p,`Day ${lesson.day} review ${ri}/${section}/${c.width}`)}
    }
    // End-to-end flow gates, wrong/right choices, role handoff and repeat.
    if(configIndex===0){
     const flowCount=await p.evaluate(()=>flows.length);
     for(let fi=0;fi<flowCount;fi++){
      await p.evaluate(n=>start(n),fi);
      if(await p.locator('[data-dg-prelude-heard]').count()){
       await p.locator('[data-dg-prelude-heard]').check();await p.locator('[data-dg-prelude-choice="0"]').click();await p.locator('[data-dg-prelude-next]').click();
      }
      const steps=await p.evaluate(()=>flows[flow].steps.length);
      for(let si=0;si<steps;si++){
       const stateBefore=await p.evaluate(()=>({first:currentStep().askFirst?'spoken':'heard',enabled:canNext()}));assert(!stateBefore.enabled);
       await p.locator('#'+stateBefore.first).check();await p.locator('#'+(stateBefore.first==='spoken'?'heard':'spoken')).check();
       assert(await p.locator('.d5-dialogue-complete').count());assert.equal(await p.locator('.dg-repeat-confirm:visible').count(),0);
       const choices=await p.evaluate(()=>{const t=currentStep();return{correct:t.objects.findIndex((_,i)=>accepted(t,i)),wrong:t.objects.findIndex((_,i)=>!accepted(t,i))}});
       if(choices.wrong>=0){await p.locator(`[data-choice="${choices.wrong}"]`).click();assert.equal(await p.locator('.scene-board').getAttribute('data-result'),'wrong');assert(await p.locator('[data-act="next"]').isDisabled())}
       await p.locator(`[data-choice="${choices.correct}"]`).click();assert.equal(await p.locator('.scene-board').getAttribute('data-result'),'correct');assert(await p.locator('[data-act="next"]').isEnabled());
       await p.locator('[data-act="next"]').click();report.flowSteps++;
      }
      assert(await p.evaluate(()=>finished));await p.locator('.dg-completion [data-start]').click();assert(await p.evaluate(()=>!finished&&turn===0));
     }
     // A saved answer survives repeat, task switch and reload; exercises the real input handler.
     await p.evaluate(()=>navigate(0));const field=p.locator('.before-panel [data-field]');const key=await field.getAttribute('data-field');await field.fill('測試保留：my own words');
     await p.evaluate(()=>navigate(6));await p.locator('[data-repeat-round]').click();assert.equal(await p.evaluate(key=>state.answers[key],key),'測試保留：my own words');
     await p.reload();assert.equal(await p.evaluate(key=>state.answers[key],key),'測試保留：my own words');report.records++;
    }
    await p.locator('#dg-menu-open').click();assert(await p.locator('#dg-course-dialog').evaluate(e=>e.open));await fits(p,'menu '+lesson.day+'/'+c.width);
    if([1,7,11].includes(lesson.day)&&configIndex<2)await shot(p,`day${lesson.day}-${c.width}-menu`);
    await ctx.close();console.log(`PASS Day ${lesson.day}, ${c.width} ${c.theme}`);
   }
  }
  for(const [file,beforeHash] of Object.entries(baseline.outside))assert.equal(hash(fs.readFileSync(file)),beforeHash,'Excluded lesson untouched: '+file);
  assert.deepEqual(report.errors,[]);
 }catch(e){report.failures.push(e.stack);await active?.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw e}
 finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close()}
 console.log(JSON.stringify({...report,screenshots:report.screenshots.length}));
})().catch(e=>{console.error(e);process.exitCode=1});
