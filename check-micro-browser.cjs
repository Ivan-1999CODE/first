const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {createHash}=require('node:crypto');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const curriculum=require('./assets/micro-curriculum.cjs'),day0=require('./assets/micro-day0.cjs');
const {checkStructure,verifyApproved,flattenGroups}=require('./check-approved-task-edits.cjs');
const output=path.resolve('tmp/micro-browser');
const selected=(process.argv.find(x=>x.startsWith('--only='))||'').slice(7).split(',').filter(Boolean);
const lessons=[day0.make('ja'),day0.make('ko'),...Array.from({length:13},(_,i)=>curriculum.make(i+2))]
 .filter(d=>!selected.length||selected.includes(d.course.day===0?d.language:String(d.course.day)));
assert(lessons.length,'No requested lessons matched --only=ja,ko,2,...,14');
const legacyKeys=d=>[...new Set([d.previousFocusKey,d.previousLesson.key,...d.previousLesson.legacyKeys])].filter(Boolean);
const filename=d=>d.file||(d.language==='ja'?'travel-japanese-day0-directions.html':'travel-english-unit2-shopping.html');
const digest=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function checkData(d){
 assert.equal(d.microVersion,1);
 assert(d.rounds.length>=2);
 assert.equal(new Set(d.rounds.map(r=>r.key)).size,d.rounds.length);
 checkStructure(d);
 verifyApproved(d);
 const skillIds=[];
 for(const r of d.rounds){
  const f=d.flows[r.flowIds[0]],m=d.missions[r.missionIds[0]],pair=d.pairs[r.pairIds[0]];
  const own=(r.primaryPhraseIds||r.phraseIds).map(id=>d.phrases.find(p=>p.id===id));
  assert(own.length>=1&&(d.course.mergedTasks||own.length<=2),`${d.course.id}/${r.id}: taught utterances belong to this complete task`);
  assert.equal(f.steps.length,own.length);
  assert.equal((r.primaryReplyIds||r.replyIds).length,own.length);
  assert.equal(pair.goals.length,own.length);
  assert.deepEqual(f.steps.map(s=>s.answer),own.map(p=>p.en));
  assert.deepEqual((r.primaryReplyIds||r.replyIds).map(i=>[d.replies[i].answer,d.replies[i].line,d.replies[i].askFirst]),f.steps.map(s=>[s.answer,s.line,s.askFirst]));
  assert.deepEqual(pair.cards.map(c=>c[1]),f.steps.map(s=>s.line));
  assert.deepEqual(r.hearLines.map(p=>p.en),[...new Set((r.variationMode==='core'?[...f.steps,...r.variation.steps]:f.steps).map(s=>s.line))]);
  if(!d.course.mergedTasks)assert.equal(r.variation.steps.length,f.steps.length);
  assert.equal(m.task,r.variation.task);
  assert.equal(m.answer,r.variation.steps.map(s=>s.answer).join(' '));
  for(const s of [...f.steps,...r.variation.steps]){
   for(const key of ['id','label','line','zh','task','words','answer','answerZh'])assert(s[key],`${d.course.id}/${r.id}/${key}`);
   assert.equal(typeof s.askFirst,'boolean');
   assert(s.objects.length&&s.valid.length&&s.valid.every(i=>s.objects[i]));
  }
  for(const c of [pair,r.checkpoint,r.home]){
   assert.equal(c.answer,own.map(p=>p.en).join(' '));
   assert(c.answerZh);
  }
  assert.equal(r.checkpoint.task,f.context);
  assert.equal(r.home.task,f.context);
  for(const q of r.home.quizzes||[r.home.quiz]){
   assert(f.steps.some(s=>s.line===q.line));
   assert(q.options[q.correct]);
  }
  assert.equal(r.checkpoint.skills.length,own.length);
  for(const s of r.checkpoint.skills){assert(s.id&&s.text);skillIds.push(s.id);}
 }
 assert.equal(new Set(skillIds).size,skillIds.length,'Ratings use independent skill keys');
}

async function checkLesson(browser,d){
 const report={id:d.course.id,file:filename(d),fileSha256:digest(filename(d)),rounds:d.rounds.length,cycles:0,checks:[],pageErrors:[]};
 let stage='data';
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const p=await context.newPage();p.setDefaultTimeout(8000);
 p.on('pageerror',error=>report.pageErrors.push(error.message));
 try{
  checkData(d);
  const seeds={};
  for(const [i,key] of legacyKeys(d).entries()){
   seeds[key]=JSON.stringify({answers:{before:`舊紀錄 ${i} 第一次`,after:`舊紀錄 ${i} 課後`,home:`舊紀錄 ${i} 作業`},checks:{old:[true]},ratings:{old:3},complete:['old'],legacy:{before:'原始保留'}});
   seeds[key+'-rounds']=JSON.stringify({round:2,done:d.rounds.map(r=>r.id),reviewMode:'mixed',reviewIds:d.rounds.map(r=>r.id)});
  }
  await p.addInitScript(values=>{
   if(localStorage.getItem('qa-micro-browser-seeded'))return;
   for(const [key,value] of Object.entries(values))localStorage.setItem(key,value);
   localStorage.setItem('qa-micro-browser-seeded','yes');
  },seeds);
  stage='load';
  await p.goto(pathToFileURL(path.resolve(filename(d))).href);
  assert.equal(await p.evaluate(()=>course.id),d.course.id,'Rebuild this lesson before running the browser test');
  assert.deepEqual(await p.evaluate(()=>rounds),d.rounds,'Built round content matches source');
  const nav=async n=>{
   await p.locator(`#nav [data-page="${n}"]`).click();
   assert.equal(await p.evaluate(()=>page),n);
  };
  const footer=()=>p.locator('#main > .footer-actions > button').last();
  const scopeIds=()=>p.locator('[data-review-task]').evaluateAll(es=>es.map(e=>e.dataset.reviewTask));
  const orderedIds=d.course.mergedTasks?d.rounds.map(r=>r.id):flattenGroups(d);
  const nextIndex=r=>d.rounds.findIndex(x=>x.id===orderedIds[orderedIds.indexOf(r.id)+1]);
  const closed=async selector=>assert.equal(await p.locator(`${selector} details[open]`).count(),0,`${stage}: examples start collapsed`);
  const select=async i=>{
   await nav(0);await p.locator(`[data-before-round="${i}"]`).first().click();
   assert.equal(await p.evaluate(()=>page),0);
   assert.equal(await p.evaluate(()=>taskRound),i);
  };
  const gate=async s=>{
   const first=p.locator(s.askFirst?'#spoken':'#heard'),second=p.locator(s.askFirst?'#heard':'#spoken');
   assert(!(await first.isDisabled()));
   assert(await second.isDisabled());
   await first.check();await second.check();
  };
  const step=async s=>{
   assert.equal(await p.evaluate(()=>currentStep().id),s.id);
   assert(await p.locator('[data-choice]').first().isDisabled());
   assert(await p.locator('[data-act="next"]').isDisabled());
   await closed('.speaking-task');
   assert.deepEqual(await p.locator('.flow-turn .turn-number').allTextContents(),['1','2'],'Flow roles follow the actual speaking order');
   assert.equal(await p.locator('.speaking-task .en').textContent(),s.answer);
   if(d.course.mergedTasks&&s.role)assert.equal(await p.locator('.role-other .role-label').innerText(),s.role,'Each step displays its actual counterpart');
   const transcript=p.locator('.flow-transcript');
   assert.equal(await transcript.getAttribute('open'),null);
   await transcript.locator('summary').first().click();
   assert.equal(await transcript.locator(':scope > .en').innerText(),s.line);
   assert((await transcript.locator('.flow-translation').innerText()).includes(s.zh));
   await transcript.locator('summary').first().click();
   await gate(s);
   const wrong=s.objects.findIndex((_,j)=>!s.valid.includes(j));
   if(wrong>=0){
    await p.locator(`[data-choice="${wrong}"]`).click();
    assert(await p.locator('#flowFeedback .retry').isVisible());
    assert(await p.locator('[data-act="next"]').isDisabled());
   }
   await p.locator(`[data-choice="${s.valid[0]}"]`).click();
   assert(!(await p.locator('[data-act="next"]').isDisabled()));
   assert((await p.locator('.generic-scene').innerText()).includes(s.objects[s.valid[0]][1]));
  };
  const example=async(section,steps)=>{
   assert.equal(await section.locator('.micro-dialogue').count(),steps.length,'Show all exchanges, including unchanged turns');
   for(const [index,s] of steps.entries()){
    const dialogue=section.locator('.micro-dialogue').nth(index);
    const actual=await dialogue.locator('.micro-turn').evaluateAll(es=>es.map(e=>({speaker:e.dataset.speaker,en:e.querySelector(':scope > .en')?.textContent})));
    const self={speaker:'self',en:s.answer},other={speaker:'other',en:s.line};
    assert.deepEqual(actual,s.askFirst?[self,other]:[other,self],'Example follows the real askFirst order without duplicated opening');
    if(d.course.mergedTasks&&s.role)assert.equal(await dialogue.locator('[data-speaker="other"] .micro-turn-label strong').innerText(),s.role,'Merged preview uses each source role');
   }
   if(d.course.mergedTasks)assert.deepEqual(await section.locator('.dialogue-scene h3').allTextContents(),steps.filter(s=>s.sceneTitle||s.sceneContext).map(s=>s.sceneTitle||'接著練習'),'Scenario boundaries are displayed within one complete example');
  };
  assert.equal(await p.locator('#nav button').count(),7);
  assert.deepEqual(await p.evaluate(()=>roundsDone),[],'Old familiar rounds do not mark new tasks');
  await closed('#main');
  if(d.course.mergedTasks){
   assert.equal(await p.locator('.task-chapter,.chapter-rounds').count(),0,'Merged tasks have no old chapter/sub-round entrances');
   assert.deepEqual(await p.locator('.before-panel .merged-task-choices [data-before-round]').evaluateAll(es=>es.map(e=>Number(e.dataset.beforeRound))),d.rounds.map((_,i)=>i));
   const labels=await p.locator('.before-panel .merged-task-choices strong').allTextContents();
   assert.deepEqual(labels,d.rounds.map((r,i)=>'任務 '+String.fromCharCode(65+i)));
   assert(!(await p.locator('#main').innerText()).includes('1～2'));
   report.checks.push('Merged source tasks have one complete task entry each, with no sub-round navigation or utterance cap');
  }else if(d.course.taskGroups){
   assert.deepEqual(await p.locator('.task-chapter').evaluateAll(es=>es.map(e=>e.dataset.chapter)),d.course.taskGroups.map(g=>g.id));
   assert.deepEqual(await p.locator('.before-panel .chapter-rounds').evaluateAll(es=>es.map(e=>[...e.querySelectorAll('[data-before-round]')].map(b=>Number(b.dataset.beforeRound)))),d.course.taskGroups.map(g=>g.roundIds.map(id=>d.rounds.findIndex(r=>r.id===id))));
   report.checks.push('Approved chapters and small-round display order match their complete mappings');
  }

  stage='early-close';
  const initialId=d.rounds[0].id;
  for(const n of [1,2,3,4]){
   await nav(n);await p.locator('[data-close-round]').click();
   assert.equal(await p.evaluate(()=>page),5);
   assert.deepEqual(await scopeIds(),[initialId]);
   assert.equal(await p.locator(`#field-after-${initialId}`).inputValue(),'');
   assert(!(await p.locator(`[data-round-ready="${initialId}"]`).isChecked()));
   assert(await p.locator('[data-review-mode="mixed"]').isDisabled());
   await footer().click();
   assert.equal(await p.evaluate(()=>page),6);
   assert.deepEqual(await scopeIds(),[initialId]);
   assert(await p.locator(`[data-before-round="${nextIndex(d.rounds[0])}"]`).isDisabled());
   assert.deepEqual(await p.evaluate(()=>roundsDone),[]);
  }
  report.checks.push('Early close from Parts 2–5 preserves incomplete status and restricts homework');

  for(const [i,r] of d.rounds.entries()){
   stage=`round-${r.id}`;
   const f=d.flows[r.flowIds[0]],m=d.missions[r.missionIds[0]],pair=d.pairs[r.pairIds[0]];
   await select(i);await closed('#main');
   assert.equal(await p.locator(`#field-before-${r.id}`).inputValue(),'');
   assert.equal(await p.locator('.before-panel > .task').innerText(),r.checkpoint.task);
   await p.locator(`#field-before-${r.id}`).fill(`第一次 ${r.id}`);
   if(r.alternativeCheckpoint){
    await p.locator('.before-panel .micro-alternative > summary').click();
    assert.equal(await p.locator('.before-panel .micro-alternative > .task').innerText(),r.alternativeCheckpoint.task);
    await p.locator(`#field-before-alt-${r.id}`).fill(`另一情境第一次 ${r.id}`);
   }
   await footer().click();assert.equal(await p.evaluate(()=>page),1);
   assert.deepEqual(await p.locator('.study-library .task-phrase > .en').allTextContents(),r.phraseIds.map(id=>d.phrases.find(x=>x.id===id).en));
   assert.deepEqual(await p.locator('.study-listening .task-phrase > .en').allTextContents(),r.hearLines.map(x=>x.en));
   assert.equal(await p.locator('.micro-example').count(),1,'Every small round has its original complete conversation example');
   await example(p.locator('.micro-example'),f.steps);
   const previews=d.course.studySupplement?[]:[...((r.variationMode||'change')==='change'?[r.variation]:[]),...(r.additionalVariations||[])];
   assert.equal(await p.locator('.micro-variation').count(),previews.length);
   if(d.course.studySupplement){
    const supplement=p.locator('.study-supplement'),groups=d.course.studySupplement.groups;
    assert.equal(await supplement.count(),1,'Show the requested phrase collection once per round');
    assert(!(await p.locator('#main').innerText()).includes('要換的條件，先在這裡看過'));
    assert.equal(await supplement.locator('.supplement-group').count(),groups.length);
    for(const group of groups){
     const section=supplement.locator(`[data-supplement-group="${group.id}"]`);
     assert.equal(await section.locator('h3').innerText(),group.title);
     assert.deepEqual(await section.locator('.task-phrase > .en').allTextContents(),group.phrases.map(x=>x.en));
     assert.deepEqual(await section.locator('.study-meaning').allTextContents(),group.phrases.map(x=>x.zh));
     assert.equal(await section.locator('.reading[open]').count(),0);
     for(const card of await section.locator('.task-phrase').all()){
      const text=await card.locator('.en').innerText();
      assert.equal(await card.locator('[data-say]').count(),2,'Normal and slow playback');
      assert(await p.evaluate(t=>Boolean(day0Audio[t]&&day0Timings[t]?.length&&readings[t]),text),'Every new phrase has embedded audio, timings and reading');
     }
    }
   }
   for(const [j,preview] of previews.entries()){
    const section=p.locator('.micro-variation').nth(j);
    assert((await section.innerText()).includes(preview.task));
    assert((await section.locator('h2').innerText()).includes('要換的條件，先在這裡看過'));
    await example(section,preview.steps);
   }
   assert.equal(await p.locator('.micro-core-example').count(),r.variationMode==='core'?1:0);
   if(r.variationMode==='core')await example(p.locator('.micro-core-example'),r.variation.steps);
   await p.locator('[data-study-view="reply"]').click();
   assert.equal(await p.locator('.workshop-picker button').count(),r.replyIds.length);
   for(const index of r.replyIds){
    await p.locator(`[data-reply="${index}"]`).first().click();
    const q=d.replies[index];
    await closed('.dialogue-workshop');
    assert.equal(await p.locator('.role-other [data-say]').first().getAttribute('data-say'),q.line);
    assert.equal(await p.locator('.role-self .task').innerText(),q.task);
    const roles=await p.locator('.dialogue-workshop > .role-frame').evaluateAll(es=>es.map(e=>e.classList.contains('role-self')?'self':'other'));
    assert.deepEqual(roles,q.askFirst?['self','other']:['other','self']);
   }
   await p.locator('[data-study-view="library"]').click();
   await footer().click();assert.equal(await p.evaluate(()=>page),2);
   assert.equal(await p.evaluate(()=>flows[flow].id),f.id);
   assert(await footer().isDisabled());
   for(const [j,s] of f.steps.entries()){
    await step(s);
    if(j===0){
     await p.locator(s.askFirst?'#spoken':'#heard').uncheck();
     assert(!(await p.locator('#spoken').isChecked()));
     assert(!(await p.locator('#heard').isChecked()));
     assert(await p.locator('[data-choice]').first().isDisabled());
     assert(await p.locator('[data-act="next"]').isDisabled());
     assert.equal(await p.evaluate(()=>history.length),0);
     await gate(s);await p.locator(`[data-choice="${s.valid[0]}"]`).click();
    }
    await p.locator('[data-act="next"]').click();
    if(j===0&&f.steps.length>1){
     await p.locator('[data-act="back"]').click();
     assert.equal(await p.evaluate(()=>turn),0);
     assert.equal(await p.evaluate(()=>history.length),0);
     await step(s);await p.locator('[data-act="next"]').click();
    }
   }
   assert(await p.evaluate(()=>finished));
   assert(!(await p.evaluate(id=>roundsDone.includes(id),r.id)));
   for(const flowIndex of r.flowIds.slice(1)){
    const alternate=d.flows[flowIndex];
    await p.locator(`[data-start="${flowIndex}"]`).first().click();
    assert.equal(await p.evaluate(()=>flows[flow].id),alternate.id);
    assert(await footer().isDisabled());
    for(const s of alternate.steps){await step(s);await p.locator('[data-act="next"]').click();}
    assert(await p.evaluate(()=>finished));
    assert(!(await p.evaluate(id=>roundsDone.includes(id),r.id)));
   }
   await footer().click();assert.equal(await p.evaluate(()=>page),3);
   assert.equal(await p.evaluate(()=>missions[mission].id),m.id);
   await closed('#main > .grid');
   assert((await p.locator('#main').innerText()).includes(m.task));
   await p.locator(`[data-field="mission-${m.id}"]`).fill(`情境 ${r.id}`);
   for(const [j,missionIndex] of r.missionIds.slice(1).entries()){
    const extra=d.missions[missionIndex],authored=r.additionalVariations[j];
    await p.locator(`[data-mission="${missionIndex}"]`).first().click();
    assert.equal(await p.evaluate(()=>missions[mission].id),extra.id);
    assert((await p.locator('#main').innerText()).includes(authored.task));
    assert.equal(extra.answer,authored.steps.map(s=>s.answer).join(' '));
    await p.locator(`[data-field="mission-${extra.id}"]`).fill(`額外變化 ${r.id}/${j}`);
   }
   await footer().click();assert.equal(await p.evaluate(()=>page),4);
   assert.equal(await p.evaluate(()=>pairs[pair].id),pair.id);
   assert.equal(await p.locator('details.teacher').getAttribute('open'),null);
   assert.equal(await p.locator('[data-pair-check]').count(),f.steps.length);
   for(let j=0;j<pair.goals.length;j++)await p.locator(`[data-pair-check="${pair.id}:${j}"]`).check();
   await p.locator(`[data-pair-check="${pair.id}:0"]`).uncheck();
   assert.equal(await p.locator('#pairProgress').innerText(),`${pair.goals.length-1} / ${pair.goals.length} 項已做到`);
   await p.locator(`[data-pair-check="${pair.id}:0"]`).check();
   await p.locator(`#field-note-${pair.id}`).fill(`真人 ${r.id}`);
   await p.locator('details.teacher > summary').click();
   assert.deepEqual(await p.locator('.teacher-card .en').allTextContents(),f.steps.map(s=>s.line));
   if(d.course.mergedTasks){
    assert.deepEqual(await p.locator('.teacher-card .eyebrow').allTextContents(),f.steps.map((s,index)=>`${index+1} · ${s.role||r.role||d.course.replyRole}`));
    assert.equal(await p.locator('.merged-student-cue').count(),f.steps.length,'Teacher help covers every merged exchange');
   }
   await closed('details.teacher');
   for(const pairIndex of r.pairIds.slice(1)){
    const alternate=d.pairs[pairIndex];
    await p.locator(`[data-pair="${pairIndex}"]`).first().click();
    assert.equal(await p.evaluate(()=>pairs[pair].id),alternate.id);
    assert.equal(await p.locator('details.teacher').getAttribute('open'),null);
    assert.equal(await p.locator('[data-pair-check]').count(),alternate.goals.length);
    for(let j=0;j<alternate.goals.length;j++)await p.locator(`[data-pair-check="${alternate.id}:${j}"]`).check();
    await p.locator(`#field-note-${alternate.id}`).fill(`另一情境真人 ${r.id}`);
    await p.locator('details.teacher > summary').click();
    assert.deepEqual(await p.locator('.teacher-card .en').allTextContents(),r.variation.steps.map(s=>s.line));
   }
   await footer().click();assert.equal(await p.evaluate(()=>page),5);
   assert.equal(await p.evaluate(()=>taskRound),i,'Part 5 closes this round without advancing');
   assert.deepEqual(await scopeIds(),[r.id]);
   await closed('.checkpoint-card');
   assert.equal(await p.locator('.checkpoint-card > .task').innerText(),r.checkpoint.task);
   assert((await p.locator('.checkpoint-card > .grid .readonly').innerText()).includes(`第一次 ${r.id}`));
   assert.equal(await p.locator(`#field-after-${r.id}`).inputValue(),'');
   assert(!(await p.locator(`[data-round-ready="${r.id}"]`).isChecked()));
   await p.locator(`#field-after-${r.id}`).fill(`現在 ${r.id}`);
   if(r.alternativeCheckpoint){
    await p.locator('.checkpoint-card .micro-alternative > summary').click();
    assert.equal(await p.locator('.checkpoint-card .micro-alternative > .task').innerText(),r.alternativeCheckpoint.task);
    assert((await p.locator('.micro-alternative .readonly').innerText()).includes(`另一情境第一次 ${r.id}`));
    await p.locator(`#field-after-alt-${r.id}`).fill(`另一情境現在 ${r.id}`);
   }
   for(const [j,s] of r.checkpoint.skills.entries())await p.locator(`[data-rating="${s.id}:${j%3+1}"]`).click();
   if(i<2)await p.locator(`[data-round-ready="${r.id}"]`).check();
   await footer().click();assert.equal(await p.evaluate(()=>page),6);
   assert.equal(await p.evaluate(()=>taskRound),i,'Part 6 keeps this round for homework');
   assert.deepEqual(await scopeIds(),[r.id]);
   await closed('.scoped-home');
   if(nextIndex(r)>=0)assert.equal(await p.locator(`[data-before-round="${nextIndex(r)}"]`).isDisabled(),i>=2,'Next round follows chapter order and manual familiarity');
   const homeQuestions=r.home.quizzes||[r.home.quiz];
   if(d.course.mergedTasks)assert.equal(await p.locator('.merged-home-question').count(),homeQuestions.length,'All source listening questions stay reachable');
   for(const [questionIndex,q] of homeQuestions.entries()){
    const wrong=q.options.findIndex((_,j)=>j!==q.correct);
    const selector=n=>d.course.mergedTasks?`[data-merged-quiz="${r.id}:${questionIndex}:${n}"]`:`[data-task-quiz="${r.id}:${n}"]`;
    const section=d.course.mergedTasks?p.locator(`[data-home-question="${q.id}"]`):p.locator('.scoped-home');
    await p.locator(selector(wrong)).click();
    assert(await section.locator('.retry').isVisible());
    await p.locator(selector(q.correct)).click();
    assert.equal(await section.locator('.retry').count(),0);
   }
   assert.equal(await p.locator(`#field-home-${r.id}`).inputValue(),'');
   await p.locator(`#field-home-${r.id}`).fill(`回家 ${r.id}`);
   await p.locator(`[data-task-home="${r.id}:listen"]`).check();
   await p.locator(`[data-task-home="${r.id}:spoken"]`).check();
   assert((await p.locator(`#home-progress-${r.id}`).innerText()).includes('2 / 2'));
   if(r.alternativeCheckpoint){
    await p.locator('.micro-alternative > summary').click();
    assert.equal(await p.locator('.micro-alternative > .task').innerText(),r.alternativeCheckpoint.task);
    assert.deepEqual(await p.locator('.micro-alternative-listen [data-say]:not([data-slow])').evaluateAll(es=>es.map(e=>e.dataset.say)),r.variation.steps.map(s=>s.line));
    await p.locator(`#field-home-alt-${r.id}`).fill(`另一情境回家 ${r.id}`);
   }
   if(i<2&&nextIndex(r)>=0){
    await p.locator(`[data-before-round="${nextIndex(r)}"]`).click();
    assert.equal(await p.evaluate(()=>page),0,'Next-round entry opens its own before task');
    assert.equal(await p.evaluate(()=>taskRound),nextIndex(r),'Next-round entry follows chapter order');
    await select(i);await nav(6);
   }
   await footer().click();assert.equal(await p.evaluate(()=>page),0);
   report.cycles++;
  }
  report.checks.push('Every round: seven parts, taught replacements, correct roles, retries, cancelled gates, backtracking and same teacher replies');

  stage='mixed-and-reload';
  const [firstId,secondId,thirdId,fourthId]=d.rounds.map(r=>r.id);
  assert.deepEqual(await p.evaluate(()=>roundsDone),[firstId,secondId]);
  await select(0);await nav(5);await p.locator('[data-review-mode="mixed"]').click();
  assert.deepEqual(await scopeIds(),[firstId,secondId]);
  assert.equal(await p.locator(`[data-review-round="${thirdId}"]`).count(),0);
  await p.locator(`[data-review-round="${firstId}"]`).click();
  assert(await p.locator(`[data-review-round="${firstId}"]`).isChecked(),'Mixed review requires at least two rounds');
  await footer().click();assert.deepEqual(await scopeIds(),[firstId,secondId]);
  assert.equal(await p.locator(`#field-home-${thirdId}`).count(),0);
  await p.reload();await nav(5);
  assert.equal(await p.locator('[data-review-mode="mixed"]').getAttribute('aria-pressed'),'true');
  assert.deepEqual(await scopeIds(),[firstId,secondId]);
  if(thirdId){
   await select(2);await nav(5);await p.locator(`[data-round-ready="${thirdId}"]`).check();
   await select(0);await nav(5);await p.locator('[data-review-mode="mixed"]').click();
   await p.locator(`[data-review-round="${thirdId}"]`).check();
   assert.deepEqual(await scopeIds(),[firstId,secondId,thirdId]);
   await p.locator(`[data-review-round="${secondId}"]`).click();
   assert.deepEqual(await scopeIds(),[firstId,thirdId]);
   await p.reload();await nav(6);
   assert.deepEqual(await scopeIds(),[firstId,thirdId],'Chosen familiar subset survives reload');
   if(fourthId)assert.equal(await p.locator(`[data-review-round="${fourthId}"]`).count(),0);
   await nav(5);await p.locator(`[data-round-ready="${thirdId}"]`).click();
   assert.deepEqual(await p.evaluate(()=>roundsDone),[firstId,secondId]);
   assert.deepEqual(await scopeIds(),[firstId],'Removing familiarity falls back to current when only one selected remains');
  }
  await p.locator('[data-review-mode="mixed"]').click();
  await p.locator(`[data-round-ready="${secondId}"]`).click();
  assert.deepEqual(await p.evaluate(()=>roundsDone),[firstId]);
  assert(await p.locator('[data-review-mode="mixed"]').isDisabled());
  await select(1);await nav(5);await p.locator(`[data-round-ready="${secondId}"]`).check();
  report.checks.push('Manual familiarity, mixed scope, minimum selection, subset persistence and cancelling familiarity');

  stage='saved-round-fields';
  await p.reload();
  assert.equal(await p.evaluate(()=>taskRound),1,'Reload restores the selected round');
  for(const [i,r] of d.rounds.entries()){
   const m=d.missions[r.missionIds[0]],pair=d.pairs[r.pairIds[0]];
   await select(i);assert.equal(await p.locator(`#field-before-${r.id}`).inputValue(),`第一次 ${r.id}`);
   if(r.alternativeCheckpoint)assert.equal(await p.locator(`#field-before-alt-${r.id}`).inputValue(),`另一情境第一次 ${r.id}`);
   await nav(3);assert.equal(await p.locator(`[data-field="mission-${m.id}"]`).inputValue(),`情境 ${r.id}`);
   for(const [j,missionIndex] of r.missionIds.slice(1).entries()){
    const extra=d.missions[missionIndex];await p.locator(`[data-mission="${missionIndex}"]`).first().click();
    assert.equal(await p.locator(`[data-field="mission-${extra.id}"]`).inputValue(),`額外變化 ${r.id}/${j}`);
   }
   await nav(4);
   assert.equal(await p.locator('details.teacher').getAttribute('open'),null);
   assert.equal(await p.locator('[data-pair-check]:checked').count(),pair.goals.length);
   assert.equal(await p.locator(`#field-note-${pair.id}`).inputValue(),`真人 ${r.id}`);
   for(const index of r.pairIds.slice(1)){
    const alternate=d.pairs[index];await p.locator(`[data-pair="${index}"]`).first().click();
    assert.equal(await p.locator('[data-pair-check]:checked').count(),alternate.goals.length);
    assert.equal(await p.locator(`#field-note-${alternate.id}`).inputValue(),`另一情境真人 ${r.id}`);
   }
   await nav(5);assert.equal(await p.locator(`#field-after-${r.id}`).inputValue(),`現在 ${r.id}`);
   if(r.alternativeCheckpoint)assert.equal(await p.locator(`#field-after-alt-${r.id}`).inputValue(),`另一情境現在 ${r.id}`);
   for(const [j,s] of r.checkpoint.skills.entries())assert.equal(await p.locator(`[data-rating="${s.id}:${j%3+1}"]`).getAttribute('aria-pressed'),'true');
   await nav(6);assert.equal(await p.locator(`#field-home-${r.id}`).inputValue(),`回家 ${r.id}`);
   assert(await p.locator(`[data-task-home="${r.id}:listen"]`).isChecked());
   assert(await p.locator(`[data-task-home="${r.id}:spoken"]`).isChecked());
   if(r.alternativeCheckpoint)assert.equal(await p.locator(`#field-home-alt-${r.id}`).inputValue(),`另一情境回家 ${r.id}`);
  }
  report.checks.push('Each round independently saves before/after/home, variation answer, teacher notes, goals, ratings and home flags');
  stage='legacy';
  await nav(5);await p.locator('.old-records > summary').click();
  for(const [i] of legacyKeys(d).entries())assert((await p.locator('.old-records').innerText()).includes(`舊紀錄 ${i} 第一次`));
  for(const [key,value] of Object.entries(seeds))assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),value,`${key}: historical storage remains byte-for-byte unchanged`);
  assert.deepEqual(report.pageErrors,[]);
  assert.equal(digest(filename(d)),report.fileSha256,'Built HTML changed during testing; rerun against a stable build');
  report.checks.push('Every old course and round storage key stays unchanged; old answers remain readable');
  report.status='passed';
 }catch(error){
  report.status='failed';report.stage=stage;report.error=String(error.stack||error);
 }finally{await context.close();}
 return report;
}

(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const reports=[],queue=[...lessons];
 try{
  await Promise.all(Array.from({length:Math.min(3,queue.length)},async()=>{
   while(queue.length){
    const d=queue.shift(),r=await checkLesson(browser,d);reports.push(r);
    console.log(`${r.status==='passed'?'PASS':'FAIL'} ${r.id}: ${r.cycles}/${r.rounds} full cycles${r.stage?' at '+r.stage:''}${r.error?'\n'+r.error:''}`);
    fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(reports,null,2));
   }
  }));
 }finally{await browser.close();}
 const failed=reports.filter(r=>r.status!=='passed');
 console.log(`${reports.length-failed.length}/${reports.length} lessons passed; ${reports.reduce((n,r)=>n+r.cycles,0)} complete seven-part cycles. Report: ${path.join(output,'report.json')}`);
 if(failed.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
