const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const d=require('./assets/micro-curriculum.cjs').make(6),r=d.rounds.find(r=>r.id==='B');
const out=path.resolve('tmp/day6-ready-order');fs.mkdirSync(out,{recursive:true});
const ready="Yes, I'm ready to order.",meal='I’d like a chicken sandwich, please.';
const f=d.flows[r.flowIds[1]],pair=d.pairs[r.pairIds[1]],primary=d.flows[r.flowIds[0]];
const plain=x=>JSON.parse(JSON.stringify(x));
const resolve=(r,d)=>({...r,replyIds:r.replyIds.map(i=>d.replies[i]),primaryReplyIds:r.primaryReplyIds.map(i=>d.replies[i])});
assert.deepEqual(f.steps.map(s=>s.answer),[ready,meal]);
assert.deepEqual(f.steps.map(s=>s.line),['Are you ready to order?','What would you like?']);
assert.deepEqual(f.steps.map(s=>s.valid),[[1],[0]]);
assert(f.steps.every(s=>!s.askFirst&&s.choiceReview?.mode==='apply'));
assert.deepEqual(r.sayPrompts.map(p=>p.answer),['Could we have a few more minutes?',ready,meal]);
assert.equal(r.flowIds.length,2);assert.equal(r.pairIds.length,2);
for(const step of f.steps){
 assert(r.phraseIds.some(id=>d.phrases.find(p=>p.id===id).en===step.answer));
 assert(r.hearLines.some(p=>p.en===step.line));
 assert(r.replyIds.some(i=>d.replies[i].answer===step.answer&&d.replies[i].line===step.line));
}
const html=fs.readFileSync(d.file,'utf8');
for(const key of ['rounds','flows','phrases','replies','pairs'])assert.deepEqual(JSON.parse(html.match(new RegExp('const '+key+'=(.*);(?:\\r?\\n|<)'))[1]),plain(d[key]),'built '+key);
for(const script of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
const before=path.join(out,'before.json');
if(fs.existsSync(before)){
 const b=JSON.parse(fs.readFileSync(before,'utf8')),old=b.data.rounds.find(r=>r.id==='B');
 assert.equal(d.course.id,b.data.course.id);
 for(const br of b.data.rounds.filter(r=>r.id!=='B'))assert.deepEqual(plain(resolve(d.rounds.find(r=>r.id===br.id),d)),resolve(br,b.data),'other task '+br.id);
 assert.deepEqual(primary,b.data.flows[old.flowIds[0]],'original waiting flow');
 assert.deepEqual(r.entryCheckpoint,old.entryCheckpoint,'same before/after question');
 assert.deepEqual(r.sayPrompts[0],old.sayPrompts[0],'original Part 4 record');
 for(const p of b.data.phrases)assert.deepEqual(d.phrases.find(n=>n.id===p.id),p,'existing phrase '+p.id);
 const integration=plain(require('./assets/chapter-integration-data.cjs')(d));
 for(const bg of b.integration.groups){
  const ng=integration.groups.find(g=>g.id===bg.id);
  assert.deepEqual({...ng,words:bg.words},{...bg},'existing integrated routes');
  for(const word of bg.words)assert(ng.words.some(w=>w[0]===word[0]&&w[1]===word[1]),'retain integrated vocabulary');
 }
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],checks=[];
 try{
  const p=await browser.newPage({viewport:{width:1024,height:900},reducedMotion:'reduce'});p.setDefaultTimeout(7000);p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(({key,old,primary,otherPair,prompt})=>{
   if(localStorage.getItem('qa-ready-seeded'))return;
   localStorage.setItem(key,JSON.stringify({answers:{'entry-before-B':'original first attempt',[prompt]:'original waiting answer',['mission-'+old.retiredMissionId]:'old waiting mission',['note-'+old.retiredPairId]:'old waiting note','after-alt-B':'old waiting reflection'},checks:{[old.retiredPairId]:[true],[otherPair]:[true,false]},ratings:{},complete:[old.retiredFlowId,primary]}));
   localStorage.setItem('qa-ready-seeded','1');
  },{key:d.course.id,old:d.day6ReadyOrder,primary:primary.id,otherPair:d.pairs[0].id,prompt:r.sayPrompts[0].id});
  await p.goto(pathToFileURL(path.resolve(d.file)).href);
  await p.locator('#dg-menu-open').click();await p.locator('#dg-course-dialog [data-dg-task="1"]').click();
  const nav=n=>p.locator(`.dg-section-switch [data-page="${n}"]`).click();
  const shot=async name=>p.screenshot({path:path.join(out,name+'.png'),fullPage:true});
  const fits=async()=>assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
  await nav(1);
  const phrases=await p.locator('.study-library .dg-study-card > .en').allTextContents();
  assert(phrases.includes(ready)&&phrases.includes(meal));
  assert((await p.locator('.study-listening').innerText()).includes('What would you like?'));
  await shot('02-light');
  await p.locator('[data-study-view="reply"]').first().click();
  for(const answer of [ready,meal]){
   const id=r.replyIds.find(i=>d.replies[i].answer===answer);
   await p.locator(`.workshop-picker [data-reply="${id}"]`).click();
   assert.equal(await p.locator('.dg-study-current').getAttribute('data-study-speaker'),'other');
   await p.locator('[data-dg-reply-role="self"]').first().click();
   assert.equal(await p.locator('.dg-study-current').getAttribute('data-study-speaker'),'self');
  }
  checks.push('02 new sentence cards, listening prompt and role order');
  assert.equal(await p.evaluate(id=>state.complete.includes(id),f.id),false,'old completion cannot complete new flow');
  assert.deepEqual(await p.evaluate(id=>state.checks[id],pair.id),[false,false]);
  for(const fi of r.flowIds){
   await p.evaluate(fi=>start(fi),fi);
   for(const [index,s] of d.flows[fi].steps.entries()){
    assert(await p.locator('[data-choice="0"]').isDisabled());
    assert.equal(await p.locator('.vf-result-art').count(),0);
    await p.locator('#heard').check();assert(await p.locator('[data-choice="0"]').isDisabled());
    await p.locator('#spoken').check();
    const wrong=s.valid[0]===0?1:0;
    await p.locator(`[data-choice="${wrong}"]`).click();assert(await p.locator('[data-act="next"]').isDisabled());
    await p.locator(`[data-choice="${s.valid[0]}"]`).focus();await p.keyboard.press('Enter');
    assert(await p.locator('[data-act="next"]').isEnabled());
    if(fi===r.flowIds[1])await shot('03-ready-step-'+index);
    await p.locator('[data-act="next"]').click();
   }
   assert(await p.evaluate(()=>finished));
  }
  await shot('03-ready-complete');
  await p.evaluate(fi=>start(fi),r.flowIds[1]);assert.equal(await p.evaluate(()=>turn),0);assert(await p.locator('[data-choice="0"]').isDisabled());
  checks.push('03 waiting and ordering paths, gates, wrong retry, keyboard, completion and restart');
  await nav(3);assert.equal(await p.locator('.say-picker button').count(),3);
  for(let i=0;i<3;i++){
   await p.locator(`.say-picker [data-say-index="${i}"]`).click();
   assert.equal(await p.locator('[data-say-pane="2"]').getAttribute('aria-hidden'),'true');
   await p.locator('[data-say-support="2"]').click();assert.equal(await p.locator('.say-reference > .en').textContent(),r.sayPrompts[i].answer);
  }
  checks.push('04 three distinct situations, hidden answer and stable original question');
  await nav(4);await p.locator(`[data-pair="${r.pairIds[1]}"]`).first().click();
  await p.locator('.d5-teacher-guide summary').click();
  assert.deepEqual(await p.locator('.d5-script-en').allTextContents(),['Are you ready to order?',ready,'What would you like?',meal]);
  await p.locator(`[data-pair-check="${pair.id}:0"]`).check();
  assert(!await p.locator(`[data-pair-check="${pair.id}:1"]`).isChecked());
  await shot('05-conversation');
  await p.reload();
  const saved=await p.evaluate(key=>JSON.parse(localStorage.getItem(key)),d.course.id);
  assert.equal(saved.answers['entry-before-B'],'original first attempt');assert.equal(saved.answers[r.sayPrompts[0].id],'original waiting answer');
  assert(saved.checks[d.pairs[0].id][0]);assert(saved.checks[pair.id][0]);
  assert.equal(saved.legacy.day6ReadyOrder.answers['mission-'+d.day6ReadyOrder.retiredMissionId],'old waiting mission');
  assert.equal(saved.legacy.day6ReadyOrder.answers['note-'+d.day6ReadyOrder.retiredPairId],'old waiting note');
  assert.equal(saved.legacy.day6ReadyOrder.answers['after-alt-B'],'old waiting reflection');
  assert.equal(saved.legacy.day6ReadyOrder.complete,true);
  assert.equal(saved.answers['after-alt-B'],'');
  checks.push('05 four-line conversation, separate checks, reload, old records archived and other task records preserved');
  for(const theme of ['light','dark']){
   await p.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size='large';},theme);
   for(const width of [390,768,1024]){
    await p.setViewportSize({width,height:900});await nav(1);await fits();
    await p.locator('.dg-study-context summary').click();await shot('02-'+theme+'-'+width);
    await p.evaluate(fi=>start(fi),r.flowIds[1]);await p.locator('[data-dg-transcript]').click();await fits();await shot('03-'+theme+'-'+width);
   }
   await p.locator('#dg-menu-open').click();await p.locator('#dg-course-dialog [data-dg-task="1"]').hover();await p.locator('#dg-course-dialog [data-dg-task="1"]').focus();await shot('menu-'+theme);await p.keyboard.press('Escape');
  }
  checks.push('light/dark, large text, mobile/tablet, open transcripts/context and task menus');
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({checks,errors},null,2));
  console.log('PASS: '+checks.join('; '));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
