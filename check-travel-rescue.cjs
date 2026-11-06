const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const curriculum=require('./assets/micro-curriculum.cjs');
const data=curriculum.make(12),out=path.resolve('tmp/travel-rescue-qa');fs.mkdirSync(out,{recursive:true});
assert.equal(data.rounds.length,3);assert.equal(data.phrases.length,15);
assert.equal(data.course.id,'travel-lab-en-rescue-12-14-v1');
assert.equal(data.rounds.flatMap(r=>r.home.quizzes).length,6);
for(const day of [12,13,14]){
 const d=curriculum.make(day);assert.equal(d.course.id,data.course.id);assert.deepEqual(d.rounds,data.rounds);
 assert.notEqual(d.course.id,curriculum.make(day,{rescue:false}).course.id);
 const html=fs.readFileSync(d.file,'utf8');assert(html.includes('const rescueVersion=1;'));
 const nav=html.match(/<nav class="day-switcher"[\s\S]*?<\/nav>/)[0];
 assert.equal((nav.match(/第 12 天<\/strong>/g)||[]).length,1);
 assert(!/href="travel-english-unit(?:13|14)-/.test(nav));
}
for(const r of data.rounds){
 const steps=data.flows[r.flowIds[0]].steps;
 const stepCount=r.id==='B'?4:5;
 assert.equal(steps.length,stepCount);
 assert.deepEqual(steps.map(s=>s.answer),r.phraseIds.slice(0,stepCount).map(id=>data.phrases.find(p=>p.id===id).en));
 // Part 3 can add context to the prompt; the first utterance remains the same.
 assert.equal(r.entryCheckpoint.answer,steps[0].answer);
 assert.equal(data.pairs[r.pairIds[0]].goals.length,5);
 assert(steps.every(s=>s.result&&s.answerZh&&s.objects[s.valid[0]]));
 assert(steps.some(s=>s.valid[0]===1));
}
assert(data.rounds[0].variation.steps[4].answer.includes('Bus eight'));
assert(data.rounds[2].variation.steps[2].answer.includes('blue'));
assert(data.flows[2].steps[4].result.includes('尚未尋回'));
assert.equal(data.rounds[1].sayPrompts.length,5);
assert.equal(data.pairs[1].dialogueSteps.length,5);
assert.equal(data.pairs[1].dialogueSteps[4].answer,'The museum entrance, right?');
const legacyKeys=[...new Set([data.previousFocusKey,data.previousLesson.key,...data.previousLesson.legacyKeys])];
const report={flows:0,turns:0,retries:0,records:0,screens:[],errors:[]};
const url=name=>pathToFileURL(path.resolve(name)).href;
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1366,height:900}}),p=await context.newPage();
  p.on('pageerror',e=>report.errors.push(e.message));
  await p.addInitScript(keys=>{
   if(!sessionStorage.getItem('rescue-test-init')){
    for(const key of keys)localStorage.setItem(key,JSON.stringify({answers:{before:'KEEP '+key},complete:['old']}));
    localStorage.setItem('travel-lab-theme','light');localStorage.setItem('travel-lab-text-size','standard');sessionStorage.setItem('rescue-test-init','yes');
   }
  },legacyKeys);
  await p.goto(url(data.file));
  const initial=await p.evaluate(keys=>Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)])),legacyKeys);
  const interaction=await p.evaluate(()=>{
   const ensure=(value,msg)=>{if(!value)throw Error(msg);};
   const click=sel=>{const el=document.querySelector(sel);ensure(el&&!el.disabled,'available '+sel);el.click();};
   const fill=(key,value)=>{const el=document.querySelector(`[data-field="${key}"]`);ensure(el,'field '+key);el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));};
   const result={flows:0,turns:0,retries:0,records:0};
   for(let ri=0;ri<rounds.length;ri++){
    setTaskRound(ri);navigate(0);const r=activeRound();
    ensure(state.answers['entry-before-'+r.id]==='','new task does not inherit old answers');
    fill('entry-before-'+r.id,'before '+r.id+' <keep>');
    navigate(1);ensure(document.querySelectorAll('[data-study-phrase]').length>=5,'all phrases taught');
    click('[data-study-view="reply"]');ensure(document.querySelector('.dg-study-current'),'short dialogue available');
    start(r.flowIds[0]);
    while(!finished){
     const s=currentStep(),first=s.askFirst?'spoken':'heard',second=s.askFirst?'heard':'spoken';
     ensure([...document.querySelectorAll('[data-choice]')].every(b=>b.disabled),'locked before speaking');
     click('#'+first);click('#'+second);
     const bad=s.objects.findIndex((_,i)=>!accepted(s,i));click(`[data-choice="${bad}"]`);
     ensure(!canNext()&&document.querySelector('#flowFeedback[data-result="wrong"]'),'wrong answer retry');result.retries++;
     click(`[data-choice="${s.valid[0]}"]`);ensure(canNext(),'right answer advances');
     ensure(document.querySelector('.vf-result').textContent.includes(s.objects[s.valid[0]][1]),'result card reflects current choice');
     if(turn===0){
      ensure(document.querySelector('.d5-dialogue-complete'),'shared listening/speaking handoff');
      ensure(document.getElementById(first).disabled&&document.getElementById(second).disabled,'completed gates cannot be cancelled');
      const snapshot=()=>JSON.stringify({turn,history,heard,spoken,choice,finished,state}),before=snapshot();
      click('[data-vf-review="back"]');ensure(document.querySelector('.vf-dialogue-review'),'earlier speech is available');
      ensure(snapshot()===before,'review keeps accepted choice and records');
      click('[data-vf-review="current"]');ensure(snapshot()===before&&canNext(),'return keeps current progress');
     }
     result.turns++;click('[data-act="next"]');
    }
    ensure(document.querySelector('.rescue-result').textContent.includes(r.rescue.outcome),'final next step shown');
    ensure(state.complete.includes(flows[flow].id),'completed flow saved');result.flows++;
    navigate(3);fill(r.sayPrompts[0].id,'variation '+r.id);
    navigate(4);ensure(!document.querySelector('.dg-teacher').open,'teacher guide starts closed');
    click(`[data-pair-check="${pairs[pair].id}:0"]`);click(`[data-pair-check="${pairs[pair].id}:0"]`);click(`[data-pair-check="${pairs[pair].id}:0"]`);
    navigate(5);ensure(document.querySelector('.dg-checkpoint-task .task').textContent===r.entryCheckpoint.task,'same before/after question');
    ensure(document.querySelector('.dg-before-record').textContent.includes('before '+r.id+' <keep>'),'original answer escaped and retained');
    fill('entry-after-'+r.id,'after '+r.id);
    const skill=r.checkpoint.skills[0];
    for(const level of [1,2,3,1]){click(`[data-rating="${skill.id}:${level}"]`);ensure(state.ratings[skill.id]===level,'rating updates');}
    navigate(6);
    for(const [i,q]of r.home.quizzes.entries()){
     click(`[data-merged-quiz="${r.id}:${i}:1"]`);ensure(document.querySelector(`[data-home-question="${q.id}"] .retry`),'home retry');
     click(`[data-merged-quiz="${r.id}:${i}:0"]`);ensure(!document.querySelector(`[data-home-question="${q.id}"] .retry`),'home correct');
    }
    fill('home-'+r.id,'home '+r.id);click(`[data-task-home="${r.id}:listen"]`);click(`[data-task-home="${r.id}:spoken"]`);result.records++;
   }
   return result;
  });Object.assign(report,interaction);
  await p.reload();
  assert.deepEqual(await p.evaluate(keys=>Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)])),legacyKeys),initial);
  assert.equal(await p.evaluate(()=>rounds.every(r=>state.answers['entry-before-'+r.id]==='before '+r.id+' <keep>'&&state.answers['entry-after-'+r.id]==='after '+r.id&&state.taskHome[r.id].spoken&&state.taskHome[r.id].listen)),true);
  // Old bookmarks show the merged unit, with the same origin-scoped storage.
  for(const day of [13,14]){await p.goto(url(curriculum.make(day).file));assert.equal(await p.evaluate(()=>course.id),data.course.id);assert.equal(await p.locator('#nav [data-dg-task]').count(),3);}
  await p.goto(url(data.file));
  const shot=async name=>{await p.screenshot({path:path.join(out,name+'.png'),fullPage:true});report.screens.push(name+'.png');};
  for(const config of [{width:1366,height:900,theme:'light',size:'standard'},{width:390,height:844,theme:'dark',size:'large'}]){
   await p.setViewportSize({width:config.width,height:config.height});
   await p.evaluate(c=>{localStorage.setItem('travel-lab-theme',c.theme);localStorage.setItem('travel-lab-text-size',c.size);},config);await p.reload();
   assert.equal(await p.locator('html').getAttribute('data-theme'),config.theme);
   for(let part=0;part<7;part++){
    await p.evaluate(n=>{setTaskRound(1);navigate(n);if(n===2)start(activeRound().flowIds[0]);if(n===4)document.querySelector('.dg-teacher').open=true;},part);
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`no overflow ${config.width}/${part}`);
    if([0,1,2,4,5].includes(part))await shot(`${config.theme}-${config.width}-part${part+1}`);
   }
   await p.locator('#dg-menu-open').click();assert(await p.locator('#dg-course-dialog').isVisible());
   await shot(`${config.theme}-${config.width}-menu`);await p.keyboard.press('Escape');
   assert.equal(await p.locator('#dg-course-dialog').isVisible(),false);
   await p.locator('#dg-day-picker > summary').click();assert.equal(await p.locator('#dg-day-picker').getAttribute('open'),'');await shot(`${config.theme}-${config.width}-days`);
   await p.locator('#dg-days-close').click();
   await p.evaluate(()=>navigate(0));await p.locator('.rescue-toolkit > summary').click();await shot(`${config.theme}-${config.width}-toolkit`);
  }
  // Corrupt and blocked storage must not stop the lesson from rendering.
  await p.evaluate(()=>localStorage.setItem(course.id,'broken-json'));await p.reload();assert.equal(await p.locator('#dg-lesson-title').count(),1);
  const blocked=await browser.newPage();await blocked.addInitScript(()=>{Storage.prototype.setItem=()=>{throw Error('blocked');};Storage.prototype.getItem=()=>{throw Error('blocked');};});
  blocked.on('pageerror',e=>report.errors.push(e.message));await blocked.goto(url(data.file));assert.equal(await blocked.locator('#dg-lesson-title').count(),1);await blocked.close();
  assert.deepEqual(report.errors,[]);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
