'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/translation-navigation');fs.mkdirSync(out,{recursive:true});
const files=fs.readdirSync('.').filter(f=>/^travel-english.*\.html$/.test(f));
const baseline=fs.existsSync(path.join(out,'baseline.json'))?JSON.parse(fs.readFileSync(path.join(out,'baseline.json'))):null;
const read=(html,key)=>{const m=html.match(new RegExp('(?:^|[>\\n])const '+key+'=(.*);(?:\\r?\\n|<)'));return m?JSON.parse(m[1]):null;};
const report={pages:0,individualSteps:0,chapterSteps:0,hotelSteps:0,layouts:0,errors:[],screenshots:[]};
for(const file of files){
 const html=fs.readFileSync(file,'utf8');for(const s of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(s[1]);
 if(baseline&&file!=='travel-english.html')for(const [key,value]of Object.entries(baseline[file]))assert.deepEqual(read(html,key),value,file+' preserves '+key);
 if(file==='travel-english.html'){
  const flows=read(html,'flows');assert.equal(flows[0].steps.length,2);assert(!JSON.stringify([read(html,'rounds'),flows,read(html,'pairs')]).includes('Turn right?'));
  if(baseline){assert.deepEqual(flows.slice(1),baseline[file].flows.slice(1));assert.equal(read(html,'course').id,baseline[file].course.id);}
  assert(!html.includes("{id:'right',title:"));
 }
}
const url=(file,hash='')=>pathToFileURL(path.resolve(file)).href+hash;
async function shot(p,name){await p.screenshot({path:path.join(out,name+'.png')});report.screenshots.push(name+'.png');}
async function choose(p,selector){const b=p.locator(selector).first();for(const a of await b.locator('xpath=ancestor::details').all())if(!await a.evaluate(e=>e.open))await a.locator(':scope > summary').click();await b.click();}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const p=await browser.newPage({viewport:{width:1280,height:1000},reducedMotion:'reduce'});p.setDefaultTimeout(6000);
 p.on('pageerror',e=>report.errors.push(e.message));
 // Instrument the real audio API: returning must cancel without starting speech.
 await p.addInitScript(()=>{window.audioLog=[];speechSynthesis.cancel=()=>audioLog.push(['cancel']);speechSynthesis.speak=u=>audioLog.push(['speak',u.text]);});
 await p.addInitScript(()=>{
  window.checkPart03Hints=step=>{
   const box=document.querySelector('.dg-speaker .dg-hint,[data-ci-flow-role="spoken"] .dg-hint,[data-hotel-flow-role="spoken"] .dg-hint');
   const ensure=(ok,message)=>{if(!ok)throw Error('Part 03 hints: '+message);};
   ensure(box,'three-level hint present');
   ensure([...box.querySelectorAll('[data-guide-hint]')].map(e=>e.textContent).join('|')==='自己說|關鍵字|看整句','original tab labels');
   ensure(box.querySelector('[data-level="0"]').getAttribute('aria-pressed')==='true','default self');
   for(const level of [1,2,0]){
    box.querySelector(`[data-level="${level}"]`).click();
    ensure(box.querySelector(`[data-level="${level}"]`).getAttribute('aria-pressed')==='true','selection follows click');
    for(const pane of box.querySelectorAll('[data-pane]'))ensure(pane.inert===(Number(pane.dataset.pane)!==level),'hidden panes cannot receive focus');
    if(step&&level===1)ensure(box.querySelector('.dg-keywords').textContent===step.words,'matching keywords');
    if(step&&level===2){ensure(box.querySelector('[data-pane="2"] .en').textContent===step.answer,'matching answer');ensure(box.querySelector('[data-pane="2"] [data-say]').dataset.say===step.answer,'matching audio');}
   }
  };
 });
 for(const file of files){
  await p.goto(url(file));
  const result=await p.evaluate(()=>{
   const ensure=(ok,m)=>{if(!ok)throw Error(course.day+': '+m);};
   const click=selector=>{const e=document.querySelector(selector);ensure(e&&!e.disabled,'missing/enabled '+selector);e.click();};
   const order=s=>s.askFirst?['spoken','heard']:['heard','spoken'];
   const role=()=>order(currentStep()).find(k=>!({heard,spoken})[k]);
   const check=(expected,s)=>{
    ensure(role()===expected,'role '+s.id+' '+expected);
    const speaker=document.querySelector('.dg-speaker');ensure(speaker,'speaker');
    ensure(document.querySelectorAll('.vf-dialogue-review').length===0,'no stale review');
    if(expected==='spoken'){
     ensure(speaker.querySelector('.dg-task').textContent===s.answerZh,'translation '+s.id);
     checkPart03Hints(s);
    }else ensure(speaker.querySelector('[data-say]').dataset.say===s.line,'audio matches '+s.id);
    ensure([...document.querySelectorAll('[data-choice]')].every(e=>e.disabled),'choices locked');
   };
   const back=()=>{const before=audioLog.length;click('[data-vf-back]');ensure(audioLog.length>before&&audioLog.slice(before).every(x=>x[0]==='cancel'),'back cancels only');};
   let count=0;
   const cases=course.day===2?day2Practice.scenes.map(s=>({flow:flows.findIndex(f=>f.id===s.flowId),scene:s.id})):flows.map((_,flow)=>({flow}));
   for(const c of cases){
    start(c.flow);if(c.scene)click(`[data-d2-scene="${c.scene}"]`);
    if(typeof dgPrelude!=='undefined'){dgPrelude.done=true;render();}
    let guard=0;
    while(!finished){
     ensure(++guard<50,'loop');const index=turn,s=JSON.parse(JSON.stringify(currentStep())),o=order(s);
     check(o[0],s);click('#'+o[0]);check(o[1],s);
     back();ensure(turn===index,'same exchange back');check(o[0],s);
     click('#'+o[0]);click('#'+o[1]);back();check(o[1],s);click('#'+o[1]);
     const valid=s.valid[0];choose(valid);next();count++;
     if(!finished){
      const nextIndex=turn,nextStep=JSON.parse(JSON.stringify(currentStep()));
      back();ensure(turn===index,'cross exchange returns to previous');check(o[1],s);
      click('#'+o[1]);choose(valid);next();ensure(turn===nextIndex,'can advance again');check(order(nextStep)[0],nextStep);
     }
    }
   }
   return count;
  });
  report.individualSteps+=result;report.pages++;console.log(file+': '+result+' steps');
 }
 // Full chapter routes use their own closure state; drive their actual controls.
 for(const file of files){
  const data=read(fs.readFileSync(file,'utf8'),'chapterIntegration');if(!data)continue;
  for(const group of data.groups){
   await p.goto(url(file,'#chapter-'+group.id));await p.reload();await p.locator('.dg-section-switch button').nth(2).click();
   for(const route of group.paths){
    await p.locator(`[data-ci-path="${route.id}"]`).click();
    report.chapterSteps+=await p.evaluate(route=>{
     const ensure=(ok,m)=>{if(!ok)throw Error(route.id+': '+m);};
     const click=selector=>{const el=document.querySelector(selector);ensure(el&&!el.disabled,selector);el.click();};
     const check=(s,role)=>{ensure(document.querySelector('[data-ci-flow-role]')?.dataset.ciFlowRole===role,'role '+s.id);if(role==='spoken'){ensure(document.querySelector('#ci-flow-turn').textContent===s.answerZh,'translation');checkPart03Hints(s);}else ensure(document.querySelector('[data-ci-flow-role] [data-say]').dataset.say===s.line,'audio');ensure([...document.querySelectorAll('[data-ci-choice]')].every(b=>b.disabled),'locked');};
     const back=()=>{const n=audioLog.length;click('[data-vf-back]');ensure(audioLog.slice(n).every(x=>x[0]==='cancel'),'no autoplay');};
     for(const [i,raw]of route.steps.entries()){
      const s=vfPracticeDialogue(raw),o=s.askFirst?['spoken','heard']:['heard','spoken'];
      check(s,o[0]);click('[data-ci-gate]');check(s,o[1]);back();check(s,o[0]);click('[data-ci-gate]');click('[data-ci-gate]');back();check(s,o[1]);click('[data-ci-gate]');click(`[data-ci-choice="${s.valid[0]}"]`);click('[data-ci-next]');
      if(i<route.steps.length-1){back();check(s,o[1]);click('[data-ci-gate]');click(`[data-ci-choice="${s.valid[0]}"]`);click('[data-ci-next]');}
     }
     ensure(document.querySelector('.ci-complete'),'completion');return route.steps.length;
    },route);
   }
  }
 }
 // Hotel integrated routes: all three groups, including ordering decisions.
 const hotelFile='travel-english-unit8-hotel.html',hotel=read(fs.readFileSync(hotelFile,'utf8'),'hotelIntegration');
 for(const group of ['checkin',...hotel.extended.groups.map(g=>g.id)]){
  await p.goto(url(hotelFile,group==='checkin'?'#integrated':'#integrated-'+group));await p.reload();await p.locator('.dg-section-switch button').nth(2).click();
  if(group==='checkin'){
   for(const route of hotel.practice.flowRoutes){
    await choose(p,`[data-hi-route="${route.id}"]`);
    for(const scenario of hotel.scenarios){
     await choose(p,`[data-hi-flow-scenario="${scenario.id}"]`);
     report.hotelSteps+=await p.evaluate(()=>{
      const ensure=(ok,m)=>{if(!ok)throw Error('checkin '+m);};const click=s=>{const el=document.querySelector(s);ensure(el&&!el.disabled,s);el.click();};
      let count=0;
      while(document.querySelector('[data-hi-gate]')){
       ensure(count++<30,'loop');const role=()=>document.querySelector('[data-hotel-flow-role]').dataset.hotelFlowRole;
       const first=role(),title=document.querySelector('#hotel-flow-turn').textContent;
       if(first==='spoken')checkPart03Hints();
       click('[data-hi-gate]');const second=role();click('[data-vf-back]');ensure(role()===first&&document.querySelector('#hotel-flow-turn').textContent===title,'back first');click('[data-hi-gate]');click('[data-hi-gate]');click('[data-vf-back]');ensure(role()===second,'back second');click('[data-hi-gate]');
       const valid=[...document.querySelectorAll('[data-hi-choice]')];let chosen;
       for(const el of valid){const n=el.dataset.hiChoice;click(`[data-hi-choice="${n}"]`);if(!document.querySelector('[data-hi-flow-next]').disabled){chosen=n;break;}}
       ensure(chosen!==undefined,'accepted choice');click('[data-hi-flow-next]');
       if(document.querySelector('[data-hi-gate]')){click('[data-vf-back]');ensure(role()===second,'cross back');click('[data-hi-gate]');click(`[data-hi-choice="${chosen}"]`);click('[data-hi-flow-next]');}
      }
      ensure(document.querySelector('.hi-complete'),'complete');return count;
     });
    }
   }
  }else{
   for(const route of hotel.extended.groups.find(g=>g.id===group).flows){
    await choose(p,`[data-hx-flow="${route.id}"]`);
    report.hotelSteps+=await p.evaluate(route=>{
     const ensure=(ok,m)=>{if(!ok)throw Error(route.id+': '+m);};const click=s=>{const el=document.querySelector(s);ensure(el&&!el.disabled,s);el.click();};
     const check=(raw,expected)=>{const current=document.querySelector('[data-hotel-flow-role]');ensure(current?.dataset.hotelFlowRole===expected,'role '+raw.id);if(expected==='spoken'){if(raw.decisions)click(`[data-hx-decision="${raw.allowed[0]}"]`);const s=raw.decisions?{...raw,...raw.decisions[raw.allowed[0]]}:raw;ensure(document.querySelector('#hotel-flow-turn').textContent===s.answerZh,'translation '+raw.id);checkPart03Hints(s);}else ensure(current.querySelector('[data-say]').dataset.say===raw.line,'audio');};
     const select=s=>{if(!s.decisions)click(`[data-hx-choice="${s.valid[0]}"]`);};
     for(const [i,s]of route.steps.entries()){
      const o=s.askFirst?['spoken','heard']:['heard','spoken'];check(s,o[0]);click('[data-hx-gate]');check(s,o[1]);click('[data-vf-back]');check(s,o[0]);click('[data-hx-gate]');check(s,o[1]);click('[data-hx-gate]');click('[data-vf-back]');check(s,o[1]);click('[data-hx-gate]');select(s);click('[data-hx-next]');
      if(i<route.steps.length-1){click('[data-vf-back]');check(s,o[1]);click('[data-hx-gate]');select(s);click('[data-hx-next]');}
     }
     ensure(document.querySelector('.hi-complete'),'complete');return route.steps.length;
    },route);
   }
  }
 }
 // Original Day 1 records must map the old thanks goal without shifting it.
 await p.goto(url('travel-english.html'));
 await p.evaluate(()=>{localStorage.setItem(course.id,JSON.stringify({answers:{'before-entry-v1-A':'保留課前紀錄','retired-direction-answer':'原來的回答'},checks:{[pairs[0].id]:[true,false,true]},ratings:{'route-a-right-v4':2}}));});
 await p.reload();assert.deepEqual(await p.evaluate(()=>state.checks[pairs[0].id]),[true,true]);
 await p.evaluate(()=>save());await p.reload();assert.deepEqual(await p.evaluate(()=>state.checks[pairs[0].id]),[true,true]);
 assert.equal(await p.evaluate(()=>state.answers['before-entry-v1-A']),'保留課前紀錄');
 assert.deepEqual(await p.evaluate(()=>({answer:state.legacy.day1BeforeDirectionRemoval.answers['retired-direction-answer'],rating:state.legacy.day1BeforeDirectionRemoval.ratings['route-a-right-v4']})),{answer:'原來的回答',rating:2});
 // Return repeatedly across several exchanges, then press playback itself.
 await p.goto(url('travel-english-unit3-airport.html'));
 await p.evaluate(()=>{start(0);for(let i=0;i<2;i++){for(const role of currentStep().askFirst?['spoken','heard']:['heard','spoken'])document.getElementById(role).click();choose(currentStep().valid[0]);next();}});
 for(let i=0;i<4;i++){
  const target=await p.evaluate(()=>vfPreviousUtterance({steps:flows[flow].steps,index:turn,heard,spoken}));
  await p.locator('[data-vf-back]').click();
  assert.deepEqual(await p.evaluate(()=>({index:turn,heard,spoken})),target);
  const expected=await p.evaluate(()=>{const s=currentStep(),self=s.askFirst?!spoken:heard;return {self,text:self?s.answer:s.line};});
  if(expected.self)await p.locator('.dg-speaker [data-guide-hint][data-level="2"]').click();
  await p.locator('.dg-speaker [data-say]').first().click();
  assert.deepEqual(await p.evaluate(()=>audioLog.at(-1)),['speak',expected.text]);
 }
 assert.equal(await p.locator('[data-vf-back]').isDisabled(),true);
 await p.goto(url('travel-english.html'));
 report.capstoneSteps=await p.evaluate(()=>{
  navigate(7);resetCapstone();render();
  const ids=[];
  while(!capstoneState.done){
   const s=capstoneSteps[capstoneState.step];ids.push(s.id);
   document.querySelector('[data-cap-action="spoken"]').click();
   document.querySelector('[data-cap-heard]').click();
   document.querySelector(`[data-cap-choice="${s.correct}"]`).click();
   document.querySelector('[data-cap-action="next"]').click();
   if(ids.length>10)throw Error('capstone does not complete');
  }
  if(ids.join(',')!=='ask,repeat,map,way,bus,thanks')throw Error('unexpected capstone sequence');
  return ids.length;
 });
 // The opening listening sentence is also reachable by stepping back once.
 await p.evaluate(()=>{start(0);dgPrelude.done=true;render();});await p.locator('[data-vf-back]').click();assert.equal(await p.locator('[data-dg-prelude-heard]').count(),1);
 for(const theme of ['light','dark'])for(const width of [390,820,1280]){
  await p.setViewportSize({width,height:1000});await p.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size='large';setRound(0);navigate(1);},theme);
  const note=p.locator('.dg-hear-usage').filter({hasText:'認識另一個方向'});assert.equal(await note.count(),1);assert.equal(await note.evaluate(e=>e.open),false);
  await note.locator('summary').press('Enter');assert.match(await note.innerText(),/left＝左邊/);await note.locator('summary').hover();await note.locator('summary').focus();await note.scrollIntoViewIfNeeded();await shot(p,`left-${theme}-${width}`);
  await p.evaluate(()=>{start(0);dgPrelude.done=true;render();});const answer=p.locator('.dg-speaker .dg-hint');assert.equal(await answer.locator('[data-level="0"]').getAttribute('aria-pressed'),'true');
  for(const level of [0,1,2]){await answer.locator(`[data-level="${level}"]`).press('Enter');await answer.scrollIntoViewIfNeeded();await shot(p,`translation-${theme}-${width}-${level}`);}
  await p.locator('#spoken').check();await p.locator('[data-vf-back]').click();assert.equal(await p.locator('.dg-speaker [data-guide-hint][data-level="0"]').getAttribute('aria-pressed'),'true');
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');report.layouts++;
 }
 assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
