const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const d=require('./assets/day1-focus-data.cjs'),original=require('./assets/day1-2-data.cjs')[0];
const expected=[
 ['How do I get to the train station?','Turn right?','Thank you for your help.'],
 ['Could you show me the way?','Can I take a bus?','Thank you for your help.'],
 ['Could you say that again?','Could you show me on the map?']
];
const route='Go straight to the first intersection. Turn right.';
const sourceFiles=['day1-focus.js','day1-micro.js','day1-homework.js','day1-guided-pages.js','day1-guided-study.js','day1-capstone.js','day1-guided.js'];
for(const name of sourceFiles)new vm.Script(fs.readFileSync('assets/'+name,'utf8'),{filename:name});
assert.equal(d.course.id,'travel-lab-unit1-merged-v4');
assert.deepEqual(d.course.legacyKeys,[]);
assert(d.previousRevisionKeys.includes('travel-lab-unit1-micro-v2'));
assert(d.previousRevisionKeys.includes('travel-lab-unit1-route-v3'));
assert.deepEqual(d.phrases.slice(0,original.phrases.length),original.phrases,'The original sentence bank remains intact');
assert.deepEqual(d.rounds.map(r=>r.id),['A','B','C']);
assert.deepEqual(d.rounds.map(r=>r.home.quizzes.length),[2,2,1],'Both former listening tasks remain within each merged homework task');
assert(!/(?:A1|A2|B1|B2)|[A-Z]\s*[+＋加]\s*[A-Z]/.test(JSON.stringify([d.course,d.rounds,d.flows,d.missions,d.pairs,d.replies])),'Current curriculum has no split or combined task labels');
require('./assets/phrase-substitutions.cjs').addSubstitutions(d);
require('./assets/listening-preview.cjs').addListeningPreview(d);
require('./assets/english-answer-translations.cjs').addAnswerTranslations(d);
for(const [i,r] of d.rounds.entries()){
 const f=d.flows[i],p=d.pairs[i],m=d.missions[i],answers=f.steps.map(t=>t.answer);
 assert.deepEqual(r.phraseIds.map(id=>d.phrases.find(p=>p.id===id).en),expected[i]);
 assert.deepEqual(answers,expected[i]);assert.equal(f.steps.length,i===2?2:3);
 assert.deepEqual(r.replyIds.map(j=>[d.replies[j].answer,d.replies[j].line]),f.steps.map(t=>[t.answer,t.line]));
 assert.deepEqual(p.cards.map(c=>c[1]),f.steps.map(t=>t.line));
 assert.equal(p.goals.length,f.steps.length);
 for(const x of [r.checkpoint,r.home,p]){assert.equal(x.answer,answers.join(' '));assert(x.answerZh);}
 assert.equal(r.home.task,r.checkpoint.task,'The same task is used before, after and at home');
 assert(m.answerZh);assert.equal(r.checkpoint.skills.length,f.steps.length);
 for(const t of f.steps){assert(r.hearLines.some(h=>h.en===t.line));assert(t.answerZh);}
 for(const q of r.home.quizzes)assert(r.hearLines.some(h=>h.en===q.line));
 assert(!JSON.stringify([r.checkpoint,r.home,m,p,f]).includes('twenty-minute'));
 assert(!JSON.stringify([r.checkpoint,r.home,m,p,f]).includes('Can I walk there?'));
 for(const t of f.steps.filter(t=>t.line==='You’re welcome.'))assert.equal(t.answer,'Thank you for your help.');
}
assert.equal(d.flows[0].prelude.line,'Where would you like to go?');
assert.equal(d.flows[0].prelude.answer,undefined,'The opening requires pointing, not an untaught English answer');
assert.equal(d.flows[0].steps[0].line,route);assert.equal(d.flows[1].steps[0].line,route);
assert.equal(d.flows[0].steps[1].line,'Yes, right.');
assert.deepEqual(d.flows[2].steps.map(t=>[t.answer,t.line]),[
 ['Could you say that again?','Go straight. Turn right.'],
 ['Could you show me on the map?','Here. The post office is on the right.']
]);
console.log('PASS source: 3 integrated tasks, 8 practiced utterances / 7 unique learner lines; 5 preserved listening questions; exact flow/reply/pair/checkpoint/home agreement.');
if(process.argv.includes('--source-only'))process.exit(0);

const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/day1-route-revision-qa'),url=pathToFileURL(path.resolve('travel-english.html')).href;
fs.mkdirSync(out,{recursive:true});
const legacy={
 'travel-lab-unit1-route-v3':{answers:{'before-A1':'舊問路回答','after-A2':'舊道謝回答','before-B1':'舊請指路回答','home-B2':'舊公車回答','before-C':'原 C 回答'},ratings:{'route-a1-ask-v3':3},checks:{'route-b1-v3-live':[true,true]},taskHome:{B2:{listen:true,spoken:true}},complete:['route-a1-v3']},
 'travel-lab-unit1-route-v3-rounds':{round:4,done:['A1','A2','B1','B2','C']},
 'travel-lab-unit1-micro-v2':{answers:{'before-A':'舊 A 回答','after-B':'舊 B 回答'},ratings:{'micro-a-turn-v2':3},complete:['micro-a-v2']},
 'travel-lab-unit1-micro-v2-rounds':{round:1,done:['A','B']},
 'travel-lab-unit1-focus-v1':{answers:{before:'更早的原句'}}
};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const report={functional:[],visual:[],pageErrors:[]};let p;
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});p=await context.newPage();
  p.on('pageerror',e=>report.pageErrors.push(e.message));
  await p.addInitScript(values=>{if(!localStorage.getItem('route-v3-qa-seed')){for(const [k,v] of Object.entries(values))localStorage.setItem(k,JSON.stringify(v));localStorage.setItem('route-v3-qa-seed','yes');}},legacy);
  await p.goto(url);assert.equal(await p.evaluate(()=>course.id),d.course.id,'Root must build the latest source before browser checks');
  const menu=async()=>{if(!await p.locator('#dg-course-dialog').evaluate(e=>e.open))await p.locator('#dg-menu-open').click();};
  const nav=async n=>{await menu();const r=await p.evaluate(()=>focusRound);await p.locator(n===7?'#nav [data-page="7"]':`#nav [data-dg-jump-round="${r}"][data-dg-jump-page="${n}"]`).click();assert.equal(await p.evaluate(()=>page),n);};
  const round=async i=>{await menu();await p.locator(`#nav [data-dg-jump-round="${i}"][data-dg-jump-page="0"]`).click();};
  const hintsClosed=async()=>assert.equal(await p.locator('.dg-hint [data-level="2"][aria-pressed="true"]').count(),0);
  const completePrelude=async()=>{
   assert(await p.locator('[data-dg-prelude-next]').isDisabled());
   assert(await p.locator('[data-dg-prelude-choice="0"]').isDisabled());
   await p.locator('[data-dg-transcript]').click();assert((await p.locator('.dg-transcript').innerText()).includes('Where would you like to go?'));
   await p.locator('[data-dg-prelude-heard]').check();await p.locator('[data-dg-prelude-choice="1"]').click();assert(await p.locator('[data-dg-prelude-next]').isDisabled());
   await p.locator('[data-dg-prelude-choice="0"]').click();await p.locator('[data-dg-prelude-heard]').uncheck();assert(await p.locator('[data-dg-prelude-next]').isDisabled());
   await p.locator('[data-dg-prelude-heard]').check();await p.locator('[data-dg-prelude-choice="0"]').click();await p.locator('[data-dg-prelude-next]').click();
  };
  const doStep=async(index,count)=>{
   await hintsClosed();await p.locator('#spoken').check();assert(await p.locator('[data-choice="0"]').isDisabled());
   await p.locator('[data-dg-transcript]').click();await p.locator('#heard').check();
   await p.locator('[data-choice="1"]').click();assert(await p.locator('[data-act="next"]').isDisabled());
   await p.locator('[data-choice="0"]').click();await p.locator('#heard').uncheck();assert(await p.locator('[data-act="next"]').isDisabled());
   await p.locator('#heard').check();await p.locator('[data-choice="0"]').click();
   await p.locator('[data-act="next"]').click();assert.equal(await p.evaluate(()=>finished),index===count-1);
  };
  for(const [i,r] of d.rounds.entries()){
   await round(i);await nav(0);assert.equal(await p.locator('#field-before-'+r.id).inputValue(),'');
   await p.locator('#field-before-'+r.id).fill(r.id+' 第一次');
   await nav(1);assert.equal(await p.locator('.task-phrase-grid > article').count(),expected[i].length);
   const sayings=await p.locator('.task-phrase-grid > article > p.en').allTextContents();assert.deepEqual(sayings,expected[i]);
   if(i===0)assert((await p.locator('.dg-study-prelude').innerText()).includes('Where would you like to go?'));
   const preview=p.locator('.micro-example');assert.equal(await preview.count(),1);
   assert(await preview.isVisible(),'The original conversation preview is available before practice');
   const previewText=await preview.textContent(),sequence=[...(d.flows[i].prelude?[d.flows[i].prelude.line]:[]),...d.flows[i].steps.flatMap(t=>t.askFirst?[t.answer,t.line]:[t.line,t.answer])];
   let cursor=0;for(const line of sequence){const position=previewText.indexOf(line,cursor);assert(position>=cursor,`${r.id}: dialogue order includes ${line}`);cursor=position+line.length;}
   if(i===0){assert(previewText.includes('指出目的地'));assert(!previewText.includes('The train station, please.'),'Pointing does not introduce an untaught spoken answer');}
   assert(await p.evaluate(()=>{const sample=document.querySelector('.micro-example'),hearing=document.querySelector('.study-listening'),practice=document.querySelector('.dg-study-step-actions');return !!(hearing.compareDocumentPosition(sample)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(sample.compareDocumentPosition(practice)&Node.DOCUMENT_POSITION_FOLLOWING);}), 'Preview follows hearing cards and precedes the practice entry');
   await p.locator('[data-study-view="reply"]').first().click();
   for(const [j,id] of r.replyIds.entries()){
    await p.locator(`[data-reply="${id}"]`).first().click();await hintsClosed();
    assert((await p.locator('.dg-study-current').innerText()).includes(d.replies[id].task));
    await p.locator('[data-dg-reply-role="other"]').click();assert((await p.locator('.dg-study-current').innerText()).includes('聽懂這句就好'));
   }
   await nav(2);if(i===0)await completePrelude();
   for(let j=0;j<d.flows[i].steps.length;j++)await doStep(j,d.flows[i].steps.length);
   assert.deepEqual(await p.evaluate(()=>roundsDone),d.rounds.slice(0,i).map(r=>r.id),'Completion is not mastery');
   await nav(3);await p.locator('#field-mission-'+d.missions[i].id).fill(r.id+' 變化');
   await nav(4);assert.equal(await p.locator('.dg-teacher[open]').count(),0);
   await p.locator('.dg-teacher > summary').click();
   assert.deepEqual(await p.locator('.teacher-card p.en').allTextContents(),d.flows[i].steps.map(t=>t.line));
   const goals=p.locator('[data-pair-check]');await goals.first().check();await goals.first().uncheck();await goals.first().check();
   await p.locator('#main > .footer-actions > button').last().click();assert.equal(await p.evaluate(()=>page),5);
   assert.equal(await p.locator('[data-review-task]').getAttribute('data-review-task'),r.id);
   assert((await p.locator('.dg-before-record').innerText()).includes(r.id+' 第一次'));
   await p.locator('#field-after-'+r.id).fill(r.id+' 現在');
   await p.locator(`[data-rating="${r.checkpoint.skills[0].id}:3"]`).click();
   await p.locator(`[data-round-ready="${r.id}"]`).check();
   await p.locator('#main > .footer-actions > button').last().click();assert.equal(await p.evaluate(()=>page),6);assert.equal(await p.evaluate(()=>currentRound().id),r.id);
   assert.equal(await p.locator('[data-home-quiz]').count(),r.home.quizzes.length);
   for(const q of r.home.quizzes){
    await p.locator(`[data-task-quiz="${r.id}:${q.id}:${1-q.correct}"]`).click();assert(await p.locator(`[data-home-quiz="${q.id}"] .feedback.retry`).count());
    await p.locator(`[data-task-quiz="${r.id}:${q.id}:${q.correct}"]`).click();assert.equal(await p.locator(`[data-home-quiz="${q.id}"] .feedback.retry`).count(),0);
   }
   await p.locator('.dg-home-note > summary').click();await p.locator('#field-home-'+r.id).fill(r.id+' 回家');await p.locator(`[data-task-home="${r.id}:spoken"]`).check();
   report.functional.push(r.id+' 7 parts');
  }
  await round(0);await nav(2);assert(await p.locator('[data-dg-prelude-next]').isDisabled());
  await p.locator('[data-close-round]').click();assert.equal(await p.evaluate(()=>page),5);assert.equal(await p.evaluate(()=>currentRound().id),'A');
  const before=await p.evaluate(()=>JSON.stringify(state));await nav(7);
  assert.deepEqual(await p.evaluate(()=>capstoneSteps.map(t=>t.answer)),[expected[0][0],expected[2][0],expected[0][1],expected[2][1],expected[1][0],expected[1][1],expected[0][2]]);
  for(let i=0;i<7;i++){
   await p.locator('[data-cap-action="spoken"]').click();assert(await p.locator('[data-cap-action="next"]').isDisabled());
   await p.locator('[data-cap-transcript]').click();await p.locator('[data-cap-heard]').check();
   await p.locator('[data-cap-choice="1"]').click();assert(await p.locator('[data-cap-action="next"]').isDisabled());
   await p.locator('[data-cap-choice="0"]').click();await p.locator('[data-cap-action="next"]').click();
  }
  assert.equal(await p.evaluate(()=>capstoneState.done),true);assert.equal(await p.evaluate(()=>JSON.stringify(state)),before,'Capstone leaves lesson records alone');
  assert(!(await p.locator('.cap-shell').innerText()).includes('20 分鐘'));
  await p.reload();
  const saved=await p.evaluate(()=>state);
  for(const [i,r] of d.rounds.entries()){
   assert.equal(saved.answers['before-'+r.id],r.id+' 第一次');assert.equal(saved.answers['after-'+r.id],r.id+' 現在');assert.equal(saved.answers['home-'+r.id],r.id+' 回家');
   assert.equal(saved.ratings[r.checkpoint.skills[0].id],3);assert(saved.checks[d.pairs[i].id][0]);assert(saved.taskHome[r.id].spoken);
  }
  assert.deepEqual(await p.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,JSON.parse(localStorage.getItem(k))])),Object.keys(legacy)),legacy);
  await nav(5);await p.locator('.old-records > summary').click();assert((await p.locator('.old-records').innerText()).includes('舊 A 回答'));assert((await p.locator('.old-records').innerText()).includes('舊問路回答'));assert((await p.locator('.old-records').innerText()).includes('原 C 回答'));
  await context.close();

  // Actual expanded views in both themes; no full-page horizontal clipping.
  for(const width of [320,390,768,1440])for(const theme of ['light','dark']){
   const c=await browser.newContext({viewport:{width,height:1000}});p=await c.newPage();p.on('pageerror',e=>report.pageErrors.push(e.message));
   await p.addInitScript(theme=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size','large');},theme);
   await p.goto(url);
   const view=async n=>{await p.locator('#dg-menu-open').click();await p.locator(n===7?'#nav [data-page="7"]':`#nav [data-dg-jump-round="0"][data-dg-jump-page="${n}"]`).click();};
   const shot=async name=>{assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}/${theme}/${name} overflow`);await p.screenshot({path:path.join(out,`${width}-${theme}-${name}.png`),fullPage:true});};
   for(let n=0;n<8;n++){
    await view(n);
    if(n===1){await p.locator('.dg-study-context > summary').click();}
    if(n===2){await p.locator('[data-dg-transcript]').click();await p.locator('[data-dg-prelude-heard]').check();await p.locator('[data-dg-prelude-choice="0"]').click();}
    if(n===4){await p.locator('.dg-teacher > summary').click();await p.locator('.dg-teacher-start > summary').click();}
    await shot('part'+(n+1));
   }
   await p.locator('#dg-menu-open').click();assert.equal(await p.locator('#nav [data-dg-jump-page="0"]').count(),3);await p.locator('#nav [data-dg-jump-round="2"][data-dg-jump-page="4"]').hover();await p.keyboard.press('Tab');await shot('menu');await p.keyboard.press('Escape');
   await p.locator('[data-homework-open]').click();assert(await p.locator('input[name="homework-round"]:disabled').count());
   await shot('handout-dialog');await p.locator('[data-homework-close]').click();
   report.visual.push({width,theme,large:true});await c.close();
  }
  assert.deepEqual(report.pageErrors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));
  console.log('PASS browser: all 3 integrated tasks, 5 listening questions, pointing prelude, retry/cancel, scoped storage, legacy isolation, 7-step capstone, expanded views at 4 widths in both themes.');
 }catch(e){if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png'),fullPage:true});throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
