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
   const stage=()=>document.querySelector('.vf-task-stage');
   if(day===2){
    go(1,1);choose(0);verify(stage().textContent.includes('$5')&&stage().textContent.includes('$1')&&!stage().textContent.includes('價格'),'cash payment has an amount on physical cash');
    go(2,1);choose(0);verify(stage().querySelector('circle[fill="#dab45d"]'),'cheaper magnet is drawn as a souvenir rather than only a receipt');checked+=2;
   }
   if(day===5){
    go(2,1);choose(0);verify(stage().textContent.includes('飯店入口')&&stage().textContent.includes('飯店入口外'),'waiting location updates the taxi scene');
    go(3,1);verify([...document.querySelectorAll('[data-choice]')].every(x=>x.textContent.includes('TAXI')&&!x.textContent.includes('BUS')),'taxi options use taxi images');checked+=2;
   }
   if(day===7){
    go(3,1);verify(document.querySelector('[data-choice="0"] .vf-art').innerHTML.includes('#5d91bb')&&document.querySelector('[data-choice="1"] .vf-art').innerHTML.includes('#659879'),'buying choices compare the remembered blue and distractor green shirt');choose(0);
    verify(document.querySelector('.vf-bought svg').innerHTML.includes('#4d8ec9'),'blue shirt goes into actual bag');back();verify(!document.querySelector('.vf-bought'),'back removes later purchase');
    go(0,5);verify(stage().textContent.includes('M 號')&&stage().textContent.includes('顏色：待確認'),'new scene keeps its own size but not previous blue');choose(0);verify(stage().textContent.includes('顏色：藍色'),'color updates same outfit');
    go(2,1);choose(0);verify(!stage().textContent.includes('這件太小'),'new size does not retain old fit result');checked+=5;
   }
   if(day===8){
    go(3,2);choose(1);verify(document.querySelector('[data-scene-state=preview]')&&stage().innerHTML.includes('512 房'),'wrong room is explicitly a preview');choose(0);next();
    verify(stage().innerHTML.includes('305 房')&&stage().innerHTML.includes('2 條毛巾')&&stage().innerHTML.includes('一些水'),'room and requested supplies carry forward');heard=spoken=true;choose(0);
    verify(stage().innerHTML.includes('棉被')&&stage().querySelectorAll('.vf-parcel>.vf-art').length===3,'three distinct supplies accumulated');back();
    verify(!stage().innerHTML.includes('棉被')&&!stage().innerHTML.includes('一些水')&&stage().innerHTML.includes('毛巾'),'back removes dependent supply requests');checked+=4;
   }
   if(day===9){
    go(2,2);choose(1);verify(stage().querySelectorAll('rect[width="65"]').length===3&&stage().querySelector('svg').getAttribute('aria-label').includes('1 張成人票加 2 張兒童票'),'wrong whole ticket group shows three tickets with the selected composition');choose(0);
    verify(stage().querySelectorAll('rect[width="65"]').length===3,'one child ticket adds to two adult tickets');next();heard=spoken=true;choose(0);verify(stage().textContent.includes('25 美元'),'total belongs to this ticket wallet');
    go(1,2);verify(!stage().textContent.includes('7 點'),'new booking does not retain previous time');choose(0);next();verify(!stage().textContent.includes('6 點半'),'declining separate booking clears old time');checked+=5;
   }
   if(day===11){
    go(0,3);choose(0);const cards=document.querySelectorAll('.vf-person-cards>section');
    verify(cards[0].textContent.includes('你和家人同行')&&!cards[0].textContent.includes('對方和朋友同行')&&cards[1].textContent.includes('對方和朋友同行'),'own and companion facts remain separate');
    go(1,1);choose(0);verify(stage().textContent.includes('我喜歡拍照')&&stage().textContent.includes('旅伴喜歡健行'),'both interests belong to correct conversation');next();
    verify(!stage().textContent.includes('我喜歡拍照')&&!stage().textContent.includes('旅伴喜歡健行'),'new conversation starts without prior facts');checked+=3;
   }
   if(day===12){
    go(2,4);choose(0);verify(stage().textContent.includes('黑色小包包')&&stage().textContent.includes('5 號公車')&&stage().textContent.includes('已收好位置紙條'),'lost-item report carries description and note');
    verify(stage().textContent.includes('尚未確認找回物品'),'requesting a written location does not claim item recovered');
    verify(stage().textContent.includes('服務台：大門旁')&&document.querySelector('.vf-written-note svg'),'written note preserves actual service-desk location');
    go(0,4);choose(1);verify(stage().textContent.includes('5 分鐘')&&stage().textContent.includes('10')&&!canNext(),'incorrect bus and travel time are visible in preview');checked+=4;
   }
   return checked;
  },day);report.days.push({day,...results,stateChecks});
  // Each task's final step exposes accumulated state, including scenario resets.
  for(let ri=0;ri<d.rounds.length;ri++){
   await page.evaluate(ri=>{setTaskRound(ri);start(activeRound().flowIds[0]);while(turn<flows[flow].steps.length-1){heard=spoken=true;choose(currentStep().valid[0]);next();}heard=spoken=true;render();choose(currentStep().valid[0]);},ri);
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
