const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const curriculum=require('./assets/micro-curriculum.cjs');
const d=curriculum.make(11),r=d.rounds[2],out=path.resolve('tmp/day11-first-visit');
fs.mkdirSync(out,{recursive:true});
const expected=['Have you been here before?','No, it’s my first time.','Yes, I’ve been here before.','How about you?'];
assert.deepEqual(d.rounds.map(r=>r.displayLabel),['A','B','C']);
assert.equal(r.name,'你是第一次來嗎？');
assert.deepEqual(r.phraseIds.map(id=>d.phrases.find(p=>p.id===id).en),expected);
assert.deepEqual(r.sayPrompts.map(p=>p.answer),expected);
assert.equal(r.flowIds.length,2);assert.equal(r.pairIds.length,2);
assert.deepEqual(r.home.quizzes.map(q=>q.line),[expected[2],expected[1]]);
assert.equal(r.entryCheckpoint.answer,expected[0]);
require('./check-approved-task-edits.cjs').verifyApproved(curriculum.make(11,{merge:false}));
require('./check-merged-tasks.cjs').verifyMerged(d,curriculum.make(11,{merge:false}));
const snapshot=path.join(out,'before.json');
if(fs.existsSync(snapshot)){
 const old=JSON.parse(fs.readFileSync(snapshot,'utf8'));
 const resolve=(r,data)=>({...r,replyIds:r.replyIds.map(i=>data.replies[i])});
 assert.equal(d.course.id,old.course.id);
 for(let i=0;i<2;i++)assert.deepEqual(resolve(d.rounds[i],d),resolve(old.rounds[i],old),'A/B content unchanged');
 for(const key of ['phrases','replies','flows','missions','pairs','quizzes'])for(const x of old[key])assert.deepEqual(d[key].find(y=>y.id===x.id),x,'Existing '+key+' preserved');
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const report={checks:[],errors:[],screenshots:[]};
 try{
  const p=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});p.setDefaultTimeout(8000);
  p.on('pageerror',e=>report.errors.push(e.message));
  await p.addInitScript(({key,pairId,skillId})=>{
   if(localStorage.getItem('qa-first-visit'))return;
   localStorage.setItem(key,JSON.stringify({answers:{'entry-before-AB':'原 A 回答','entry-before-CDE':'原 B 回答'},checks:{[pairId]:[true,false,false,false]},ratings:{[skillId]:2},complete:[]}));
   localStorage.setItem('qa-first-visit','yes');
  },{key:d.course.id,pairId:d.pairs[0].id,skillId:d.rounds[0].checkpoint.skills[0].id});
  await p.goto(pathToFileURL(path.resolve(d.file)).href);
  assert.deepEqual(await p.evaluate(()=>rounds),d.rounds,'Built HTML matches sources');
  const nav=n=>p.evaluate(n=>navigate(n),n);
  const fits=async()=>assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
  const shot=async name=>{await p.screenshot({path:path.join(out,name+'.png'),fullPage:true});report.screenshots.push(name);};
  const select=()=>p.locator('#dg-context [data-dg-task="2"]').click();
  const fill=async(key,value)=>{
   const input=p.locator(`[data-field="${key}"]`);
   for(const box of await input.locator('xpath=ancestor::details').all())if(!await box.evaluate(e=>e.open))await box.locator(':scope > summary').click();
   await input.fill(value);await input.blur();
  };
  await select();await nav(0);
  const entry=await p.locator('.before-panel .task').textContent();assert.equal(entry,r.entryCheckpoint.task);
  await fill('entry-before-G','before first visit');report.checks.push('01 first attempt');
  await nav(1);
  assert.deepEqual(await p.locator('.study-library .dg-study-card > .en').allTextContents(),expected);
  assert.deepEqual(await p.locator('.study-library .dg-study-card').evaluateAll(es=>es.map(e=>e.querySelector('[data-say]').dataset.say)),expected);
  await shot('02-light');
  await p.locator('[data-study-view="reply"]').first().click();
  for(const i of r.replyIds){
   await p.locator(`.workshop-picker [data-reply="${i}"]`).click();
   const q=d.replies[i],role=q.askFirst?'self':'other';assert.equal(await p.locator('.dg-study-current').getAttribute('data-study-speaker'),role);
   await p.locator(`[data-dg-reply-role="${q.askFirst?'other':'self'}"]`).first().click();
   assert.equal(await p.locator('.dg-study-current').getAttribute('data-study-speaker'),q.askFirst?'other':'self');
  }
  report.checks.push('02 all four sentences, speech text and turn order');
  for(const fi of r.flowIds){
   await p.evaluate(fi=>start(fi),fi);
   for(let turnIndex=0;turnIndex<2;turnIndex++){
    const s=d.flows[fi].steps[turnIndex];
    assert(await p.locator('[data-choice="0"]').isDisabled());
    assert.equal(await p.locator('.vf-result-art').count(),0);
    for(const id of s.askFirst?['spoken','heard']:['heard','spoken'])await p.locator('#'+id).check();
    await p.locator('[data-choice="1"]').click();assert.equal(await p.evaluate(()=>canNext()),false);
    assert.equal(await p.locator('[data-scene-state="preview"]').count(),1);
    await p.locator('[data-choice="0"]').focus();await p.keyboard.press('Enter');assert(await p.evaluate(()=>canNext()));
    if(turnIndex===1){
     const cards=await p.locator('.vf-person-cards > section').allTextContents();
     assert(cards[0].includes(fi===r.flowIds[0]?'我第一次來':'我以前來過'));
     assert(cards[1].includes(fi===r.flowIds[0]?'旅伴以前來過':'旅伴第一次來'));
     await shot('03-path-'+fi);
    }
    await p.locator('[data-act="next"]').click();
   }
   assert(await p.evaluate(()=>finished));
  }
  // Backtracking removes the later person's facts and requires a fresh choice.
  await p.evaluate(fi=>{start(fi);heard=spoken=true;choose(0);next();heard=spoken=true;choose(0);back();},r.flowIds[0]);
  assert.equal(await p.evaluate(()=>turn),0);assert.equal(await p.locator('[data-scene-state="confirmed"]').count(),0);
  report.checks.push('03 both paths, gates, wrong retry, keyboard, people separated, backtracking');
  await nav(3);assert.equal(await p.locator('.say-picker button').count(),4);
  for(let i=0;i<4;i++){
   await p.locator(`.say-picker [data-say-index="${i}"]`).click();
   assert.equal(await p.locator('[data-say-pane="2"]').getAttribute('aria-hidden'),'true');
   await p.locator('[data-say-support="2"]').click();assert.equal(await p.locator('.say-reference > .en').textContent(),expected[i]);
   await fill(r.sayPrompts[i].id,'scenario '+i);
  }
  report.checks.push('04 four independently saved situations');
  await nav(4);
  for(let i=0;i<r.pairIds.length;i++){
   const pi=r.pairIds[i],pair=d.pairs[pi],steps=d.flows[r.flowIds[i]].steps;
   await p.locator(`[data-pair="${pi}"]`).first().click();
   const guide=p.locator('.d5-teacher-guide');assert.equal(await guide.evaluate(e=>e.open),false);
   await guide.locator('summary').click();
   const script=steps.flatMap(s=>s.askFirst?[s.answer,s.line]:[s.line,s.answer]);
   assert.deepEqual(await guide.locator('.d5-script-en').allTextContents(),script);
   await p.locator(`[data-pair-check="${pair.id}:0"]`).check();
   assert.equal(await p.locator(`[data-pair-check="${pair.id}:1"]`).isChecked(),false);
   await shot('05-path-'+i);
  }
  report.checks.push('05 teacher scripts, both first speakers, separate goal checks');
  await nav(5);assert.equal(await p.locator('.dg-checkpoint-task .task').textContent(),entry);
  assert((await p.locator('.dg-before-record').textContent()).includes('before first visit'));
  await fill('entry-after-G',expected[0]);
  const skill=r.checkpoint.skills[0].id;
  for(const value of [1,3,2]){await p.locator(`[data-rating="${skill}:${value}"]`).click();assert.equal(await p.evaluate(id=>state.ratings[id],skill),value);}
  report.checks.push('06 same question, separate after-answer and ratings');
  await nav(6);assert.equal(await p.locator('.merged-home-question').count(),2);
  for(let i=0;i<2;i++){
   await p.locator(`[data-merged-quiz="G:${i}:1"]`).click();assert(await p.locator('.merged-home-question').nth(i).locator('.retry').count());
   await p.locator(`[data-merged-quiz="G:${i}:0"]`).click();assert.equal(await p.locator('.merged-home-question').nth(i).locator('.retry').count(),0);
  }
  await p.locator('[data-task-home="G:spoken"]').check();report.checks.push('07 yes/no listening and retry');
  await p.reload();await select();
  const saved=await p.evaluate(()=>state);
  assert.equal(saved.answers['entry-before-AB'],'原 A 回答');assert.equal(saved.answers['entry-before-CDE'],'原 B 回答');
  assert.equal(saved.answers['entry-before-G'],'before first visit');assert.equal(saved.answers['entry-after-G'],expected[0]);
  for(let i=0;i<4;i++)assert.equal(saved.answers[r.sayPrompts[i].id],'scenario '+i);
  for(const pi of r.pairIds)assert.equal(saved.checks[d.pairs[pi].id][0],true);
  assert.equal(saved.checks[d.pairs[0].id][0],true);assert.equal(saved.ratings[d.rounds[0].checkpoint.skills[0].id],2);
  assert.equal(saved.ratings[skill],2);assert.equal(saved.taskHome.G.spoken,true);report.checks.push('reload preserves new work and existing A/B answers, checks, ratings');
  for(const theme of ['light','dark']){
   if(await p.evaluate(()=>document.documentElement.dataset.theme)!==theme)await p.locator('#theme,#themeToggle').click();
   for(const width of [390,1280]){
    await p.setViewportSize({width,height:900});
    if(await p.locator('#large').getAttribute('aria-pressed')!=='true')await p.locator('#large').click();
    for(let section=0;section<7;section++){await nav(section);await fits();}
    await nav(1);await shot(`02-${theme}-${width}`);
    await p.locator('#dg-menu-open').click();await p.locator('#nav [data-page="2"]').hover();await p.locator('#nav [data-page="2"]').focus();
    await shot(`menu-${theme}-${width}`);await p.locator('#dg-menu-close').click();
   }
  }
  report.checks.push('all seven sections at mobile/desktop, light/dark, large text, open menus');
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log('PASS Day 11 C: '+report.checks.join('; '));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
