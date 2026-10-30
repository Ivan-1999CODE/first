'use strict';
// Day 5 city scene: exercise the authored data, gates, feedback and focus in
// isolated browser contexts. Existing user profiles/records are never opened.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const file=path.resolve('travel-english-unit5-getting-around.html'),out=path.resolve('tmp/lesson5-city');fs.mkdirSync(out,{recursive:true});
const configs=[
 {width:320,height:568,theme:'light',size:'large',motion:'reduce'},
 {width:390,height:844,theme:'light',size:'standard',motion:'no-preference'},
 {width:390,height:844,theme:'dark',size:'large',motion:'no-preference'},
 {width:768,height:1024,theme:'light',size:'standard',motion:'no-preference'},
 {width:768,height:1024,theme:'dark',size:'large',motion:'reduce'},
 {width:1024,height:768,theme:'dark',size:'standard',motion:'no-preference',keyboard:true},
 {width:1440,height:1000,theme:'light',size:'standard',motion:'no-preference',keyboard:true},
 {width:1440,height:1000,theme:'dark',size:'large',motion:'reduce',keyboard:true}
];
const hash=()=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report={sourceHash:hash(),configs:[],steps:[],savedRecords:[],screenshots:[],pageErrors:[],failures:[]};
const normalize=s=>String(s).replace(/\s+/g,'');
const shot=async(p,name,selector)=>{const opts={path:path.join(out,name+'.png')};if(selector)await p.locator(selector).screenshot(opts);else await p.screenshot(opts);report.screenshots.push(name+'.png')};
const chapter=async(p,n)=>{await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-page="${n}"]`).click();assert.equal(await p.evaluate(()=>page),n)};
const chooseTask=async(p,n)=>{await p.locator(`#dg-context [data-dg-task="${n}"]`).click();assert.equal(await p.evaluate(()=>taskRound),n)};
const activate=async(loc,keyboard,checkbox=false)=>{if(keyboard){await loc.focus();await loc.press(checkbox?'Space':'Enter')}else if(checkbox)await loc.check();else await loc.click()};
const noOverflow=async(p,label)=>{
 const result=await p.evaluate(()=>{
  const visible=e=>{if(!e.getClientRects().length||getComputedStyle(e).visibility==='hidden'||e.closest('[hidden],[inert],[aria-hidden="true"]'))return false;let n=e;while(n.parentElement){const a=n.parentElement;if(a.tagName==='DETAILS'&&!a.open&&n.tagName!=='SUMMARY')return false;n=a;}return true};
  return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,items:[...document.querySelectorAll('#main *,#dg-context *')].filter(e=>{
   if(!visible(e)||e instanceof SVGElement)return false;if(e.closest('.dg-task-switch')&&!e.matches('.dg-task-switch'))return false;
   const r=e.getBoundingClientRect();return r.width>0&&(r.left < -1||r.right>innerWidth+1);
  }).slice(0,8).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,60)}))};
 });assert(result.scrollWidth<=result.width+1,label+' page overflow '+JSON.stringify(result));assert.deepEqual(result.items,[],label+' visible element bounds');
};
const focused=async(p,kind,label)=>{
 await p.waitForFunction(kind=>{const e=document.activeElement;return kind==='map'?e?.id==='d5-scene-action':!!e?.matches('.dg-speaker .dg-task')},kind);
 const box=await p.evaluate(()=>{const e=document.activeElement,r=e.getBoundingClientRect(),h=document.querySelector('.top').getBoundingClientRect();return{id:e.id,cls:e.className,top:r.top,bottom:r.bottom,inset:h.bottom,height:innerHeight}});
 assert(box.top>=box.inset-1&&box.bottom<=box.height+1,label+' focus visible below header '+JSON.stringify(box));
};
const gateState=async(p,first,stage,label)=>{
 const second=first==='heard'?'spoken':'heard';
 for(const id of ['heard','spoken'])assert.equal(await p.locator('#'+id).count(),1,label+' retained ID '+id);
 assert.equal(await p.locator('[data-act="back"]').count(),0,label+' no back-a-sentence control');
 for(const id of stage===0?[second]:stage===1?[first]:[first,second]){assert(!await p.locator('#'+id).isVisible(),label+' completed/inactive gate hidden '+id);assert(await p.locator('#'+id).isDisabled(),label+' hidden gate disabled '+id)}
 if(stage<2){const active=p.locator('#'+(stage===0?first:second));assert(await active.isVisible());assert(!await active.isDisabled());assert(!await active.isChecked())}
 else {assert(await p.locator('#heard').isChecked());assert(await p.locator('#spoken').isChecked());assert.equal(await p.locator('.d5-dialogue-complete').count(),1)}
 const current=await p.locator('.d5-flow-steps li').evaluateAll(items=>items.findIndex(e=>e.getAttribute('aria-current')==='step'));assert.equal(current,stage,label+' progress stage');
};
const mapState=async(p)=>p.locator('.d5-map-container').evaluate(e=>({step:e.dataset.mapStep,choice:e.dataset.mapChoice,result:e.dataset.mapResult,path:e.querySelector('.d5-map-route')?.getAttribute('d')||'',movers:[...e.querySelectorAll('.d5-map-mover')].map(m=>({x:m.dataset.mapX,y:m.dataset.mapY})),status:e.querySelector('.d5-map-status')?.textContent||''}));
const inspectChoices=async(p,t,enabled,label)=>{
 const choices=p.locator('.scene-board [data-choice]');assert.equal(await choices.count(),t.objects.length,label+' one button per authored option');assert.equal(await p.locator('[data-choice]').count(),t.objects.length,label+' no duplicate choice UI');
 for(let i=0;i<t.objects.length;i++){const loc=p.locator(`.scene-board [data-choice="${i}"]`);assert.equal(await loc.count(),1);assert.equal(await loc.isDisabled(),!enabled);const info=await loc.evaluate(e=>{const r=e.getBoundingClientRect();return{name:e.getAttribute('aria-label')||e.textContent,width:r.width,height:r.height}});assert(normalize(info.name).includes(normalize(t.objects[i][1])),label+' accessible choice matches authored label');assert(info.width>=43.5&&info.height>=43.5,label+' choice touch target >=44');}
 const m=await mapState(p);assert.equal(m.step,t.id,label+' map uses current data');for(const point of m.movers){assert(Number(point.x)>=0&&Number(point.x)<=400);assert(Number(point.y)>=0&&Number(point.y)<=300)}
};
const resultStyle=async(p,index,result,label)=>{
 const selector=`.scene-board [data-choice="${index}"]`;
 assert.equal(await p.locator(selector).getAttribute('aria-pressed'),'true');assert.equal(await p.locator(selector).getAttribute('data-result'),result);
 assert.equal(await p.locator('#flowFeedback').getAttribute('data-result'),result);assert.equal(await p.locator('.scene-board').getAttribute('data-result'),result);
 const styles=await p.evaluate(({selector,result})=>{
  const button=document.querySelector(selector),feedback=document.querySelector('#flowFeedback .feedback'),board=document.querySelector('.scene-board');
  const expected=document.createElement('span');expected.style.color=`var(--d5-${result==='correct'?'success':'error'})`;document.body.append(expected);const color=getComputedStyle(expected).color;expected.remove();
  const b=getComputedStyle(button),f=getComputedStyle(feedback),s=getComputedStyle(board);
  return{expected:color,buttonBorder:b.borderTopColor,buttonWidth:parseFloat(b.borderTopWidth),feedbackText:f.color,feedbackBorder:f.borderLeftColor,boardBorder:s.borderTopColor,text:feedback.textContent};
 },{selector,result});
 assert.equal(styles.buttonBorder,styles.expected,label+' selected border color');assert(styles.buttonWidth>=2,label+' selected border visible');assert.equal(styles.feedbackText,styles.expected,label+' feedback text color');assert.equal(styles.feedbackBorder,styles.expected,label+' feedback border color');assert.equal(styles.boardBorder,styles.expected,label+' board border color');assert(styles.text.includes(result==='correct'?'選對了':'再試一次'),label+' result is explained in text');return styles;
};
const preservedState=async p=>p.evaluate(()=>Object.fromEntries(Object.entries(state).filter(([key])=>key!=='complete')));
const seedRecords=async(p)=>{
 await chapter(p,0);const field=p.locator('.dg-entry-note textarea');await field.fill('Original <keep> & unchanged');
 await chapter(p,4);await p.locator('[data-pair-check]').first().check();
 await chapter(p,5);await p.locator('[data-rating$=":2"]').first().click();
 await chapter(p,6);await p.locator('[data-task-home$=":spoken"]').first().check();
 return preservedState(p);
};
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});let active;
try{
 for(const config of configs){const tag=`${config.width}-${config.theme}-${config.size}${config.motion==='reduce'?'-reduced':''}`,context=await browser.newContext({viewport:{width:config.width,height:config.height},isMobile:config.width<=390,hasTouch:config.width<=1024,reducedMotion:config.motion}),p=await context.newPage();active=p;p.setDefaultTimeout(10000);p.on('pageerror',e=>report.pageErrors.push({tag,error:e.message}));
  await p.addInitScript(c=>{if(!sessionStorage.getItem('city-qa-init')){localStorage.setItem('travel-lab-theme',c.theme);localStorage.setItem('travel-lab-text-size',c.size);localStorage.setItem('city-qa-unrelated','unchanged');sessionStorage.setItem('city-qa-init','yes')}},config);
  await p.goto(pathToFileURL(file).href);assert.equal(await p.locator('#dg-context [data-dg-task]').count(),4);const baseline=await seedRecords(p);let totalSteps=0;
  for(let n=0;n<4;n++){
   await chooseTask(p,n);await chapter(p,2);if(await p.evaluate(()=>finished))await p.locator('.dg-completion [data-start]').first().click();const expectedSteps=await p.evaluate(()=>flows[flow].steps.length);let completed=0;
   while(!await p.evaluate(()=>finished)){
    assert(completed++<expectedSteps+1,'No indefinite loop');totalSteps++;const t=await p.evaluate(()=>currentStep()),at=await p.evaluate(()=>turn),label=`${tag} task${n} step${at}`,first=t.askFirst?'spoken':'heard',second=first==='heard'?'spoken':'heard';
    assert.equal(await p.evaluate(()=>choice),-1);assert.equal(await p.evaluate(()=>heard||spoken),false);await gateState(p,first,0,label);await inspectChoices(p,t,false,label);await noOverflow(p,label+' start');
    if(at===0&&[390,1440].includes(config.width)&&config.theme==='light'){await p.evaluate(()=>scrollTo(0,0));await shot(p,`${tag}-task${n}-start`)}
    await activate(p.locator('#'+first),config.keyboard,true);await focused(p,'role',label+' role handoff');await gateState(p,first,1,label);await inspectChoices(p,t,false,label);
    assert.equal(await p.evaluate(()=>turn),at);assert(await p.locator('[data-act="next"]').isDisabled());
    await activate(p.locator('#'+second),config.keyboard,true);await focused(p,'map',label+' map handoff');await gateState(p,first,2,label);await inspectChoices(p,t,true,label);assert.equal(await p.evaluate(()=>turn),at);assert.equal(await p.evaluate(()=>choice),-1);assert(await p.locator('[data-act="next"]').isDisabled(),'Confirmations do not skip selection');
    await noOverflow(p,label+' ready');const pending=await mapState(p);assert.equal(pending.result,'pending');
    if(config.motion==='reduce'){const activeMotion=await p.locator('.d5-map-container').evaluate(e=>[...e.querySelectorAll('*')].filter(n=>{const s=getComputedStyle(n);return s.animationName!=='none'&&s.animationDuration.split(',').some(v=>parseFloat(v)>0)}).map(n=>n.className));assert.deepEqual(activeMotion,[],label+' reduced motion has no animation')}
    const wrong=t.objects.findIndex((_,i)=>!t.valid.includes(i)),right=t.valid[0];assert(wrong>=0,'Scenario includes retry option');
    await activate(p.locator(`[data-choice="${wrong}"]`),config.keyboard);const red=await resultStyle(p,wrong,'wrong',label);assert(await p.locator('[data-act="next"]').isDisabled());assert.equal(await p.evaluate(()=>turn),at);assert.equal(await p.evaluate(()=>history.length),at,'Wrong choice does not become route history');const wrongMap=await mapState(p);assert.equal(wrongMap.choice,String(wrong));assert.equal(wrongMap.result,'wrong');assert(normalize(wrongMap.status).includes(normalize(t.objects[wrong][1])),label+' wrong map text agrees with option');
    const captureChoice=[390,1440].includes(config.width)&&((at===0&&(n===0||(config.width===1440&&config.theme==='light')))||(n===1&&at===1&&config.width===1440&&config.theme==='light'));
    if(captureChoice){await shot(p,`${tag}-task${n}-step${at}-wrong`,'.scene-board')}
    await activate(p.locator(`[data-choice="${right}"]`),config.keyboard);const green=await resultStyle(p,right,'correct',label);assert.notEqual(red.expected,green.expected);assert(!await p.locator('[data-act="next"]').isDisabled());assert.equal(await p.evaluate(()=>turn),at,'Correct choice waits for Next');assert.equal(await p.evaluate(()=>finished),false,'Correct choice does not auto-complete');const rightMap=await mapState(p);assert.equal(rightMap.choice,String(right));assert.equal(rightMap.result,'correct');assert(normalize(rightMap.status).includes(normalize(t.objects[right][1])),label+' correct map text agrees with option');assert.notEqual(normalize(wrongMap.status),normalize(rightMap.status),label+' option updates map information');
    const spatial=(n===0&&at===0)||(n===1&&at===1)||(n===2&&at===1)||n===3;if(spatial)assert(wrongMap.path!==rightMap.path||JSON.stringify(wrongMap.movers)!==JSON.stringify(rightMap.movers),label+' route or position follows selected place');
    if(captureChoice){await shot(p,`${tag}-task${n}-step${at}-correct`,'.scene-board')}
    await noOverflow(p,label+' selected');assert.equal(await p.evaluate(()=>history[turn]),right);await activate(p.locator('[data-act="next"]'),config.keyboard);
    if(!await p.evaluate(()=>finished)){assert.equal(await p.evaluate(()=>turn),at+1);await focused(p,'role',label+' next role');}
    report.steps.push({config:tag,task:n,step:at,id:t.id,order:first+' → '+second+' → map',retry:true,correct:true,spatial,feedbackColors:{wrong:red.expected,correct:green.expected}});
   }
   assert.equal(completed,expectedSteps);const flowId=await p.evaluate(()=>flows[flow].id);assert(await p.evaluate(id=>state.complete.includes(id),flowId));
   await p.locator('.dg-completion [data-start]').first().click();assert.deepEqual(await p.evaluate(()=>({turn,heard,spoken,choice,history,finished})),{turn:0,heard:false,spoken:false,choice:-1,history:[],finished:false},'Restart clears only current flow state');assert(await p.evaluate(id=>state.complete.includes(id),flowId),'Restart keeps saved completion mark');await inspectChoices(p,await p.evaluate(()=>currentStep()),false,tag+' restart');
  }
  assert.equal(totalSteps,10);assert.deepEqual(await preservedState(p),baseline,'Flow leaves answers, ratings and goals unchanged');assert.equal(await p.evaluate(()=>localStorage.getItem('city-qa-unrelated')),'unchanged');const complete=await p.evaluate(()=>state.complete);await p.reload();assert.deepEqual(await preservedState(p),baseline);assert.deepEqual(await p.evaluate(()=>state.complete),complete);assert.equal(complete.length,4);
  report.savedRecords.push({config:tag,answersGoalsRatingsHomeUnchanged:true,completeMarks:complete.length,reload:true});report.configs.push(config);console.log(`PASS ${tag}: 10 authored steps, role/map focus, red→green retry, route/state, restart and records`);await context.close();
 }
 assert.deepEqual(report.pageErrors,[],'No browser runtime errors');assert.equal(hash(),report.sourceHash,'HTML did not change during test');
}catch(e){report.failures.push(e.stack);if(active)await shot(active,'failure');throw e}
finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log(`PASS ${report.steps.length} flow steps in ${report.configs.length} configurations, ${report.savedRecords.length} record checks, ${report.screenshots.length} screenshots.`);
})().catch(e=>{console.error(e);process.exit(1)});
