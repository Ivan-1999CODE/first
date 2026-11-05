const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {pathToFileURL}=require('url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/task-scenes');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const report={days:[],errors:[]};
 try{
 for(const day of [2,3,4,5,7,8,9,10,11,12,13,14]){
  const d=require('./assets/micro-curriculum.cjs').make(day),file=d.file||'travel-english-unit2-shopping.html';
  const page=await browser.newPage({viewport:{width:1100,height:850},reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push({day,message:e.message}));
  await page.goto(pathToFileURL(path.resolve(file)).href);
  const results=await page.evaluate(()=>{
   const verify=(v,m)=>{if(!v)throw Error(m);};let result={tasks:rounds.length,flows:0,steps:0,themes:[],resetScenes:0};
   for(let fi=0;fi<flows.length;fi++){
    start(fi);result.flows++;let n=0;
    while(!finished){
     verify(++n<100,'finite');const t=currentStep();const theme=vfTaskTheme(t);verify(theme,'authored scene '+t.id);verify(document.querySelector('[data-task-theme]')?.dataset.taskTheme===theme,'scene installed');
     result.themes.push(theme);
     verify(!document.querySelector('.vf-picture-help,.vf-scene-context'),'no supplementary panels '+t.id);
     const before=document.querySelector('[data-task-theme]').textContent;
     verify(!document.querySelector('[data-scene-state=confirmed]'),'future result not confirmed');
     for(const id of t.askFirst?['spoken','heard']:['heard','spoken'])document.querySelector('#'+id).click();
     const wrong=t.objects.findIndex((o,i)=>!t.valid.includes(i));
     if(wrong>=0){document.querySelector(`[data-choice="${wrong}"]`).click();verify(!canNext(),'wrong blocked');verify(document.querySelector('[data-scene-state=preview]'),'wrong preview labelled');}
     for(const valid of t.valid){document.querySelector(`[data-choice="${valid}"]`).click();verify(canNext(),'valid choice');verify(document.querySelector('[data-scene-state=confirmed]'),'confirmed stage');}
     if(vfNewSituation(t)){
      const state=vfSceneRecords(t,vfHistory(flows[flow],history,turn),choice);verify(state.earlier.length===0,'new scenario does not inherit facts');result.resetScenes++;
     }
     verify(document.querySelector('[data-task-theme]').textContent!==before,'operation has scene feedback');
     next();result.steps++;
    }
   }
   result.themes=[...new Set(result.themes)];return result;
  });
  const stateChecks=await page.evaluate(day=>{
   const verify=(v,m)=>{if(!v)throw Error(m);};let checked=0;
   const go=(fi,n)=>{start(fi);while(turn<n){heard=spoken=true;choose(currentStep().valid[0]);next();}heard=spoken=true;render();};
   if(day===2){
    go(1,1);choose(0);const cash=document.querySelector('.vf-result-art');
    verify(cash.textContent.includes('$5')&&cash.textContent.includes('$1'),'selected payment shows both banknotes');
    go(2,1);choose(0);verify(document.querySelector('.vf-result-art circle[fill="#dab45d"]'),'selected souvenir has its own illustration');checked+=2;
   }
   if(day===5){
    go(3,1);verify([...document.querySelectorAll('[data-choice]')].every(x=>x.textContent.includes('TAXI')&&!x.textContent.includes('BUS')),'taxi options use taxi images');checked++;
   }
   if(day===7){
    go(3,1);verify(document.querySelector('[data-choice="0"] .vf-art').innerHTML.includes('#5d91bb')&&document.querySelector('[data-choice="1"] .vf-art').innerHTML.includes('#659879'),'buying choices compare the remembered blue and distractor green shirt');checked++;
   }
   return checked;
  },day);report.days.push({day,...results,stateChecks});
  // Each task's final step exposes accumulated state, including scenario resets.
  for(let ri=0;ri<d.rounds.length;ri++){
   await page.evaluate(ri=>{setTaskRound(ri);start(activeRound().flowIds[0]);const end=typeof day2Practice==='object'?day2Practice.scenes.find(s=>s.id===document.querySelector('[data-d2-active]').dataset.d2Active).end:flows[flow].steps.length-1;while(turn<end){heard=spoken=true;choose(currentStep().valid[0]);next();}heard=spoken=true;render();choose(currentStep().valid[0]);},ri);
   if(day<13){await page.screenshot({path:path.join(out,`day${day}-task${ri+1}-light.png`),fullPage:true});await page.locator('.vf-task-scene').screenshot({path:path.join(out,`day${day}-task${ri+1}-scene.png`)});}
   await page.setViewportSize({width:390,height:844});
   await page.evaluate(()=>{document.documentElement.dataset.theme='dark';document.documentElement.dataset.size='large';});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`day ${day} task ${ri}: no mobile overflow`);
   if(day<13)await page.screenshot({path:path.join(out,`day${day}-task${ri+1}-dark.png`),fullPage:true});
   await page.setViewportSize({width:1100,height:850});await page.evaluate(()=>{document.documentElement.dataset.theme='light';document.documentElement.dataset.size='standard';});
  }
  await page.close();console.log(JSON.stringify({day,...results}));
 }
 assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
