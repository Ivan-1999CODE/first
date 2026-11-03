const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {pathToFileURL}=require('url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/interactive-flow');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),report={days:[],errors:[]};
 try{
 for(const day of [1,2,3,4,5,6,7,8,9,10,11,12,13,14]){
  const d=day===1?require('./assets/day1-focus-data.cjs'):require('./assets/micro-curriculum.cjs').make(day);
  if(day===1)for(const f of d.flows.slice(0,2)){assert.equal(f.steps[0].objects.length,4);assert(f.steps[0].objects.some(o=>o[1]==='第二個路口右轉'));}
  if(day>1)for(const r of d.rounds){
   const taught=new Set(r.phraseIds.map(id=>d.phrases.find(p=>p.id===id).en)),heard=new Set(r.hearLines.map(p=>p.en));
   for(const fi of r.flowIds)for(const step of d.flows[fi].steps){assert(taught.has(step.answer),`Day ${day}: 03 answer taught in 02: ${step.answer}`);assert(heard.has(step.line),`Day ${day}: 03 listening taught in 02: ${step.line}`);}
  }
  const file=day===1?'travel-english.html':d.file||'travel-english-unit2-shopping.html';
  const p=await browser.newPage({viewport:{width:1100,height:850},reducedMotion:'reduce'});p.on('pageerror',e=>report.errors.push({day,error:e.message}));
  await p.goto(pathToFileURL(path.resolve(file)).href);
  const r=await p.evaluate(()=>{
   const assert=(v,m)=>{if(!v)throw Error(m)};
   const result={day:course.day,flows:0,steps:0,wrong:0,kinds:{},fallbacks:[],pictureQuestions:[],decisionQuestions:[]};
   for(let fi=0;fi<flows.length;fi++){
    start(fi);if(typeof dgPrelude!=='undefined'&&flows[fi].prelude){dgPrelude.done=true;render();}
    let guard=0;
    while(!finished){
     assert(++guard<60,'finite');const t=currentStep();const k=vfKind(t);result.kinds[k]=(result.kinds[k]||0)+1;
     if(k==='conversation')result.fallbacks.push({id:t.id,options:t.objects.map(o=>o[1])});
     assert(document.querySelector('.vf-interaction'),'visual board '+t.id);
     const emptyResult=()=>{assert(document.querySelector('.vf-result .vf-empty'),'unanswered result stays neutral '+t.id);assert(!document.querySelector('.vf-result-art,.vf-verdict'),'no result before choosing '+t.id);};
     emptyResult();
     assert([...document.querySelectorAll('[data-choice]')].every(b=>b.disabled),'gated');
     assert([...document.querySelectorAll('[data-choice]')].every(b=>b.dataset.pickState==='locked'&&b.querySelector('.vf-choice-action')),'every locked choice explains its availability');
     for(const id of t.askFirst?['spoken','heard']:['heard','spoken'])document.getElementById(id).click();
     assert(document.querySelectorAll('[data-choice]').length===t.objects.length,'every option available '+t.id);
     assert([...document.querySelectorAll('[data-choice]')].every(b=>b.dataset.pickState==='ready'&&b.querySelector('.vf-choice-action').textContent.includes('點選')),'every available choice has a visible action label');
     emptyResult();
     const ctx={ready:true,previous:vfHistory(flows[fi],history,turn)};
     assert(vfPanel(t,ctx)===vfPanel({...t,valid:[]},ctx),'answer key cannot affect an unanswered scene '+t.id);
     const stale=document.createElement('div');stale.innerHTML=vfPanel(t,{ready:false,selected:t.valid[0]});assert(stale.querySelector('.vf-empty')&&!stale.querySelector('.vf-result-art'),'locked step never renders a stale result');
     if(vfChoiceChallenge(t).pictures){
      const help=document.querySelector('.vf-picture-help');assert(help&&!help.open,'picture explanations are optional '+t.id);
      assert([...document.querySelectorAll('[data-choice] .dg-object-label')].every(e=>/^圖 [A-Z]$/.test(e.textContent)),'picture choices do not repeat the spoken answer '+t.id);
      result.pictureQuestions.push(t.id);
     }
     if(t.choicePrompt)result.decisionQuestions.push({id:t.id,prompt:t.choicePrompt});
     const wrong=t.objects.findIndex((_,i)=>!t.valid.includes(i));
     if(wrong>=0){document.querySelector(`[data-choice="${wrong}"]`).click();assert(!canNext(),'wrong blocked');assert(document.querySelector('.vf-result').textContent.includes(t.objects[wrong][1]),'wrong result shown');assert(document.querySelector('#flowFeedback').textContent.includes(vfDimension(t)),'specific feedback');result.wrong++;}
     for(const valid of t.valid){document.querySelector(`[data-choice="${valid}"]`).click();assert(canNext(),'every valid choice accepted');assert(document.querySelector('.vf-result').textContent.includes(t.objects[valid][1]),'correct visual');}
     if(turn===1){back();assert(turn===0&&history.length===0&&choice===-1,'back removes dependent results');for(const id of currentStep().askFirst?['spoken','heard']:['heard','spoken'])document.getElementById(id).click();choose(currentStep().valid[0]);next();for(const id of currentStep().askFirst?['spoken','heard']:['heard','spoken'])document.getElementById(id).click();choose(currentStep().valid[0]);}
     document.querySelector('[data-act="next"]').click();result.steps++;
    }
    assert(document.querySelector('.vf-final'),'visual summary');result.flows++;
   }
   return result;
  });report.days.push(r);
  if(day===2){await p.evaluate(()=>{start(0);heard=spoken=true;choose(currentStep().valid[0]);next();heard=spoken=true;choose(currentStep().valid[0]);next();heard=spoken=true;render();});await p.locator('[data-vf-delta="1"]').click();await p.locator('[data-vf-delta="1"]').click();assert.equal(await p.locator('.vf-counter-controls output').innerText(),'2');assert.equal(await p.evaluate(()=>canNext()),false);await p.locator('[data-vf-delta="1"]').click();assert.equal(await p.evaluate(()=>canNext()),true);await p.screenshot({path:path.join(out,'quantity-result.png'),fullPage:true});}
  if([1,3,5,6,7,8].includes(day)){
   await p.evaluate(()=>{start(course.day===6?flows.findIndex(f=>f.steps.some(s=>vfKind(s)==='drink')):0);if(typeof dgPrelude!=='undefined')dgPrelude.done=true;render();for(const id of currentStep().askFirst?['spoken','heard']:['heard','spoken'])document.getElementById(id).click();});
   await p.screenshot({path:path.join(out,`day${day}-light.png`),fullPage:true});
   await p.setViewportSize({width:390,height:844});
   await p.evaluate(()=>{document.documentElement.dataset.theme='dark';document.documentElement.dataset.size='large';});
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow day '+day);
   await p.screenshot({path:path.join(out,`day${day}-dark-mobile.png`),fullPage:true});
   const firstChoice=p.locator('[data-choice]').first();await firstChoice.press('Enter');assert(await p.locator('.vf-result-art').count(),'keyboard choice result');
   await p.locator('#dg-menu-open').click();await p.screenshot({path:path.join(out,`day${day}-dark-menu.png`),fullPage:true});await p.locator('#dg-menu-close').click();
  }
  await p.close();console.log('day '+day+': '+r.flows+' flows / '+r.steps+' steps');
 }
 assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
