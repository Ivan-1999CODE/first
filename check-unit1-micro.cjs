const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const data=require('./assets/day1-focus-data.cjs'),original=require('./assets/day1-2-data.cjs')[0];
const output=path.resolve('tmp/day1-micro/verification');
const url=pathToFileURL(path.resolve('travel-english.html')).href;
const normalize=s=>s.replace(/[’‘]/g,"'").trim();
const sentences=s=>s.split(/(?<=[.!?])\s+/).filter(Boolean).map(normalize);

// Check the authored teaching boundary before exercising the generated lesson.
assert.equal(data.course.id,'travel-lab-unit1-micro-v2');
assert.deepEqual(data.course.legacyKeys,[]);
assert.deepEqual(data.phrases,original.phrases,'Keep the original phrase bank intact');
assert.deepEqual(data.rounds.map(r=>r.id),['A','B','C']);
assert.deepEqual(data.rounds.map(r=>r.phraseIds),[['phrase-0','phrase-9'],['phrase-7','phrase-8'],['phrase-6','phrase-5']]);
for(const key of ['flows','missions','pairs'])assert.equal(data[key].length,3);
assert.equal(data.replies.length,6);
assert.equal(data.course.skills.length,6);
require('./assets/phrase-substitutions.cjs').addSubstitutions(data);
require('./assets/listening-preview.cjs').addListeningPreview(data);
for(const [i,r] of data.rounds.entries()){
 const own=r.phraseIds.map(id=>data.phrases.find(p=>p.id===id));
 const required=own.map(p=>p.en),allowed=new Set(required.map(normalize));
 for(const p of own)for(const g of p.substitutions||[])for(const [option] of g.options)allowed.add(normalize(p.en.replace(g.target,option)));
 assert.equal(own.length,2);
 assert.equal(data.flows[i].steps.length,2);
 assert.equal(r.replyIds.length,2);
 assert.equal(r.missionIds.length,1);
 assert.equal(r.pairIds.length,1);
 assert.equal(data.pairs[i].goals.length,2);
 assert.deepEqual(data.flows[i].steps.map(t=>t.answer),required);
 assert.deepEqual(r.replyIds.map(j=>[data.replies[j].answer,data.replies[j].line]),data.flows[i].steps.map(t=>[t.answer,t.line]));
 assert.deepEqual(data.pairs[i].cards.map(c=>c[1]),data.flows[i].steps.map(t=>t.line));
 assert.deepEqual(r.hearLines.map(p=>p.en),data.flows[i].steps.map(t=>t.line));
 assert.equal(r.checkpoint.answer,required.join(' '));
 assert.equal(r.home.answer,required.join(' '));
 assert.equal(data.pairs[i].answer,required.join(' '));
 for(const item of [data.missions[i],data.pairs[i],r.checkpoint,r.home]){
  const lines=sentences(item.answer);
  assert.equal(lines.length,2,`${r.id} must keep a two-line speaking target`);
  assert(lines.every(s=>allowed.has(s)),`${r.id}: only taught wording or a single noun substitution is required`);
  assert(item.answerZh);
 }
 assert.equal(r.checkpoint.skills.length,2);
 assert(r.checkpoint.skills.every(s=>s.id&&s.text));
 assert(data.flows[i].steps.some(t=>t.line===r.home.quiz.line));
 assert(r.home.quiz.options[r.home.quiz.correct]);
 assert(!r.phraseIds.includes('phrase-10'));
}
assert.equal(data.course.task,data.rounds[0].checkpoint.task);
assert.equal(data.course.answer,data.rounds[0].checkpoint.answer);
const oldFocus={answers:{before:'舊分輪課前原句',after:'舊分輪課後原句','mission-a-bus':'舊分輪情境保留',home:'舊分輪回家練習'},checks:{'a-station':[true,false,true]},ratings:{ask:2},complete:['focus-a'],legacy:{before:'更早匯入的原句'}};
const oldV3={answers:{before:'舊整天課前原句',after:'舊整天課後原句','mission-need-0':'舊整天情境保留'},checks:{station:[true]},ratings:{ask:3},complete:['station']};
const oldV2={before:'最早版課前原句',after:'最早版課後原句',ratings:[1,2,3]};
const seeds={
 [data.previousFocusKey]:oldFocus,[original.course.id]:oldV3,
 [original.course.legacyKeys[0]]:oldV2,
 [data.previousFocusKey+'-rounds']:{round:1,done:['A','B']}
};

(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 let pageForFailure=null;
 const report={content:'passed',functional:[],responsive:[],screenshots:[],pageErrors:[]};
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const p=await context.newPage();pageForFailure=p;p.setDefaultTimeout(10000);
  p.on('pageerror',e=>report.pageErrors.push(e.message));
  await p.addInitScript(values=>{
   if(!localStorage.getItem('qa-day1-micro-seeded')){
    for(const [key,value] of Object.entries(values))localStorage.setItem(key,JSON.stringify(value));
    localStorage.setItem('qa-day1-micro-seeded','yes');
   }
  },seeds);
  await p.goto(url);
  assert.equal(await p.evaluate(()=>course.id),data.course.id,'Build Day 1 before running this test');
  const openMenu=async()=>{
   if(!await p.locator('#dg-course-dialog').evaluate(e=>e.open))await p.locator('#dg-menu-open').click();
  };
  const nav=async n=>{
   await openMenu();
   await p.locator(`#nav [data-page="${n}"]`).click();
   assert.equal(await p.evaluate(()=>page),n);
   assert.equal(await p.locator('#dg-course-dialog').evaluate(e=>e.open),false);
  };
  const footer=()=>p.locator('#main > .footer-actions > button').last();
  const scopeIds=()=>p.locator('[data-review-task]').evaluateAll(es=>es.map(e=>e.dataset.reviewTask));
  const currentOnly=async id=>{
   assert.deepEqual(await scopeIds(),[id],'Parts 6 and 7 always use the selected task');
   assert.equal(await p.locator('[data-review-mode], [data-review-round]').count(),0,'Mixed-review controls have been removed');
   assert(!(await p.locator('#main').innerText()).includes('已學任務混合複習'));
  };
  const freshHints=async selector=>{
   assert.equal(await p.locator(`${selector} details[open]`).count(),0,`${selector}: disclosures start closed`);
   for(const hint of await p.locator(`${selector} .dg-hint`).all()){
    assert.equal(await hint.locator('[data-guide-hint][aria-pressed="true"]').getAttribute('data-level'),'0');
    assert.equal(await hint.locator('[data-pane="2"]').getAttribute('aria-hidden'),'true');
    assert(!(await hint.locator('[data-pane="2"]').isVisible()),'The complete answer must be hidden initially');
   }
  };
  const expandField=async locator=>{
   const closed=locator.locator('xpath=ancestor::details[not(@open)]');
   for(const details of (await closed.all()).reverse())await details.locator(':scope > summary').click();
  };
  const gate=async()=>{
   if(await p.locator('#heard').count()&&await p.locator('#spoken').isDisabled()){await p.locator('#heard').check();await p.locator('#spoken').check();}
   else {await p.locator('#spoken').check();await p.locator('#heard').check();}
  };
  const completeStep=async t=>{
   assert.equal(await p.locator('[data-choice]').count(),0,'Scene choices wait until the learner has spoken');
   assert.equal(await p.locator('[data-act="next"]').count(),0);
   assert.equal(await p.locator('#heard').count(),0,'The waiting role does not occupy the learner card');
   await freshHints('.dg-speaker');
   await p.locator('#spoken').check();
   assert(await p.locator('[data-choice]').first().isDisabled());
   assert(await p.locator('[data-act="next"]').isDisabled());
   assert.equal(await p.locator('[data-dg-transcript]').getAttribute('aria-pressed'),'false');
   await p.locator('[data-dg-transcript]').click();
   const transcript=p.locator('.dg-transcript [aria-hidden="false"]');
   assert.equal(await transcript.locator('.en').innerText(),t.line);
   assert.equal(await transcript.locator('.flow-translation').innerText(),t.zh);
   await p.locator('[data-dg-transcript]').click();
   await p.locator('#heard').check();
   const wrong=t.objects.findIndex((_,i)=>!t.valid.includes(i));
   await p.locator(`[data-choice="${wrong}"]`).click();
   assert(await p.locator('[data-act="next"]').isDisabled());
   assert(await p.locator('#flowFeedback .retry').isVisible());
   await p.locator(`[data-choice="${t.valid[0]}"]`).click();
   assert((await p.locator('.scene-state').innerText()).includes(t.position[2]));
   assert(!(await p.locator('[data-act="next"]').isDisabled()));
  };
  const selectRound=async i=>{
   await nav(0);
   await openMenu();
   await p.locator(`[data-dg-round="${i}"]`).click();
   assert.equal(await p.evaluate(()=>page),0);
   assert.equal(await p.evaluate(()=>focusRound),i);
  };
  const screenshot=async name=>{
   await p.screenshot({path:path.join(output,name),fullPage:true});
   report.screenshots.push(name);
  };
  assert.equal(await p.locator('#nav button').count(),8);
  assert.equal(await p.locator('#field-before-A').inputValue(),'');
  assert.deepEqual(await p.evaluate(()=>roundsDone),[],'Old completion never marks the new tasks familiar');
  await openMenu();
  assert(!(await p.locator('#nav [data-page="7"]').isDisabled()),'Part 8 is available before any task is marked familiar');
  await p.locator('#nav [data-page="7"]').click();
  assert.equal(await p.evaluate(()=>page),7);
  assert.deepEqual(await p.evaluate(()=>roundsDone),[],'Opening Part 8 never marks the teaching tasks familiar');
  await nav(0);
  report.functional.push('Part 8 is a manual, unlocked course-menu entry even with no completed tasks');
  for(let i=0;i<3;i++){
   const r=data.rounds[i];
   await selectRound(i);
   assert.equal(await p.locator(`#field-before-${r.id}`).inputValue(),'');
   await p.locator(`#field-before-${r.id}`).fill(`第一次 ${r.id}`);
  }

  // Ending early from every teaching view preserves an unfinished task.
  for(const n of [1,2,3,4]){
   await selectRound(0);
   await nav(n);await p.locator('[data-close-round]').click();
   assert.equal(await p.evaluate(()=>page),5);
   await currentOnly('A');
   assert(!(await p.locator('[data-round-ready="A"]').isChecked()));
   await footer().click();
   assert.equal(await p.evaluate(()=>page),6);
   await currentOnly('A');
   assert(!(await p.locator('[data-before-round="1"]').isDisabled()));
   await p.locator('[data-before-round="1"]').click();
   assert.equal(await p.evaluate(()=>page),0,'The next teaching task begins at Part 1');
   assert.equal(await p.evaluate(()=>focusRound),1);
   assert.deepEqual(await p.evaluate(()=>roundsDone),[]);
  }
  await nav(6);
  assert(!(await p.locator('[data-before-round="2"]').isDisabled()));
  await p.locator('[data-before-round="2"]').click();
  assert.equal(await p.evaluate(()=>focusRound),2);
  assert.equal(await p.evaluate(()=>page),0);
  report.functional.push('Early closing never implies mastery; teachers can manually choose the next A/B/C task without familiarity gating');

  for(const [i,r] of data.rounds.entries()){
   await selectRound(i);await footer().click();
   assert.equal(await p.evaluate(()=>page),1);
   assert.equal(await p.locator('.study-library .focus-phrase').count(),2);
   const libraryMarkup=await p.locator('#main').textContent();
   for(const id of r.phraseIds){
    const phrase=data.phrases.find(x=>x.id===id);
    assert(libraryMarkup.includes(phrase.en)&&libraryMarkup.includes(phrase.zh));
    for(const group of phrase.substitutions||[])for(const [en,zh] of group.options)assert(libraryMarkup.includes(en)&&libraryMarkup.includes(zh));
   }
   for(const [en,zh] of r.words)assert(libraryMarkup.includes(en)&&libraryMarkup.includes(zh));
   for(const phrase of [...r.advanced,...r.advancedHear])assert(libraryMarkup.includes(phrase.en)&&libraryMarkup.includes(phrase.zh));
   assert(libraryMarkup.includes(data.phrases.find(x=>x.id==='phrase-10').en),'Optional thanks remains available');
   assert.deepEqual(await p.locator('.study-hear-card > .en').allTextContents(),r.hearLines.map(x=>x.en));
   assert.equal(await p.locator('.study-advanced[open]').count(),0);
   assert.equal(await p.locator('.study-vocabulary[open]').count(),0);
   await p.locator('.study-navigation [data-study-view="reply"]').click();
   assert.equal(await p.locator('.workshop-picker button').count(),2);
   for(const index of r.replyIds){
    await p.locator(`[data-reply="${index}"]`).first().click();
    await freshHints('.workshop-answer');
    assert.equal(await p.locator('.workshop-question').count(),0);
    const hint=p.locator('.workshop-answer .dg-hint');
    const initialHeight=await hint.locator('.dg-hint-stage').evaluate(el=>el.getBoundingClientRect().height);
    for(const level of [1,2,0]){
     await hint.locator(`[data-level="${level}"]`).click();
     assert.equal(await hint.locator(`[data-level="${level}"]`).getAttribute('aria-pressed'),'true');
     assert.equal(await hint.locator(`[data-pane="${level}"]`).getAttribute('aria-hidden'),'false');
     assert(await hint.locator(`[data-pane="${level}"]`).isVisible());
     assert(Math.abs(await hint.locator('.dg-hint-stage').evaluate(el=>el.getBoundingClientRect().height)-initialHeight)<1,'Hint levels keep the same reading position');
     if(level===2){
      assert.equal(await hint.locator('[data-pane="2"] .en').innerText(),data.replies[index].answer);
      assert.equal(await hint.locator('[data-pane="2"] .reference-translation').innerText(),data.replies[index].answerZh);
     }
    }
    await p.locator('[data-dg-reply-role="other"]').click();
    await freshHints('.workshop-question');
    assert.equal(await p.locator('.workshop-question [data-say]').first().getAttribute('data-say'),data.replies[index].line);
    await p.locator('.workshop-question > details > summary').click();
    assert.equal(await p.locator('.workshop-question > details .en').innerText(),data.replies[index].line);
    assert((await p.locator('.workshop-question > details').innerText()).includes(data.replies[index].zh));
   }
   await p.locator('[data-study-view="library"]').click();
   await footer().click();
   assert.equal(await p.evaluate(()=>page),2);
   await completeStep(data.flows[i].steps[0]);
   await p.locator('#spoken').uncheck();
   assert.equal(await p.evaluate(()=>heard),false);
   assert.equal(await p.locator('#heard').count(),0);
   assert.equal(await p.locator('[data-choice]').count(),0);
   assert.equal(await p.locator('[data-act="next"]').count(),0);
   assert.equal(await p.evaluate(()=>history.length),0);
   await gate();await p.locator('[data-choice="0"]').click();await p.locator('[data-act="next"]').click();
   assert.equal(await p.evaluate(()=>turn),1);
   await p.locator('[data-act="back"]').click();
   assert.equal(await p.evaluate(()=>turn),0);
   assert.equal(await p.evaluate(()=>history.length),0);
   await completeStep(data.flows[i].steps[0]);await p.locator('[data-act="next"]').click();
   await completeStep(data.flows[i].steps[1]);await p.locator('[data-act="next"]').click();
   assert(await p.evaluate(()=>finished));
   assert(!(await p.evaluate(id=>roundsDone.includes(id),r.id)));
   await footer().click();assert.equal(await p.evaluate(()=>page),3);
   await freshHints('#main > .dg-grid');
   await p.locator(`[data-field="mission-${data.missions[i].id}"]`).fill(`情境 ${r.id}`);
   await footer().click();assert.equal(await p.evaluate(()=>page),4);
   const pair=data.pairs[i];
   assert.equal(await p.locator('details.teacher').getAttribute('open'),null);
   assert.equal(await p.locator('[data-pair-check]').count(),2);
   for(let j=0;j<2;j++)await p.locator(`[data-pair-check="${pair.id}:${j}"]`).check();
   await p.locator(`[data-pair-check="${pair.id}:1"]`).uncheck();
   assert.equal(await p.locator('#pairProgress').innerText(),'1 / 2 項已做到');
   await p.locator(`[data-pair-check="${pair.id}:1"]`).check();
   await expandField(p.locator(`#field-note-${pair.id}`));
   await p.locator(`#field-note-${pair.id}`).fill(`真人 ${r.id}`);
   await p.locator('details.teacher > summary').click();
   assert.deepEqual(await p.locator('.teacher-card .en').allTextContents(),data.flows[i].steps.map(t=>t.line));
   assert.equal(await p.locator('details.teacher details[open]').count(),0);
   await screenshot(`teacher-${r.id}.png`);
   await footer().click();assert.equal(await p.evaluate(()=>page),5);
   await currentOnly(r.id);
   await freshHints('.checkpoint-card');
   assert.equal(await p.locator('.checkpoint-card .task').innerText(),r.checkpoint.task);
   assert((await p.locator('.checkpoint-card .readonly').innerText()).includes(`第一次 ${r.id}`));
   assert(!(await p.locator(`[data-round-ready="${r.id}"]`).isChecked()));
   await p.locator(`#field-after-${r.id}`).fill(`現在 ${r.id}`);
   const skill=r.checkpoint.skills[0].id;
   await p.locator(`[data-rating="${skill}:3"]`).click();
   assert.equal(await p.locator('.checkpoint-card .meter .green').count(),3);
   await p.locator(`[data-rating="${skill}:1"]`).click();
   assert.equal(await p.locator('.checkpoint-card .meter .green').count(),0);
   assert.equal(await p.locator('.checkpoint-card .meter .yellow').count(),1);
   await p.locator(`[data-rating="${r.checkpoint.skills[1].id}:2"]`).click();
   if(i<2)await p.locator(`[data-round-ready="${r.id}"]`).check();
   await footer().click();assert.equal(await p.evaluate(()=>page),6);
   await currentOnly(r.id);
   await freshHints('.scoped-home');
   const wrong=r.home.quiz.correct===0?1:0;
   await p.locator(`[data-task-quiz="${r.id}:${wrong}"]`).click();
   assert(await p.locator('.scoped-home .retry').isVisible());
   await p.locator(`[data-task-quiz="${r.id}:${r.home.quiz.correct}"]`).click();
   assert.equal(await p.locator('.scoped-home .retry').count(),0);
   await expandField(p.locator(`#field-home-${r.id}`));
   await p.locator(`#field-home-${r.id}`).fill(`回家 ${r.id}`);
   await p.locator(`[data-task-home="${r.id}:listen"]`).check();
   await p.locator(`[data-task-home="${r.id}:spoken"]`).check();
   assert((await p.locator(`#home-progress-${r.id}`).innerText()).includes('2 / 2'));
   await footer().click();assert.equal(await p.evaluate(()=>page),0,'The Part 7 footer returns home and never enters Part 8');
  }
  report.functional.push('A/B/C full 2→3→4→5→6→7 cycles; hidden hints; retries, cancelled gates, backtracking; separate answers/goals/ratings/home');

  // Only A and B were explicitly marked familiar, although C was practiced.
  assert.deepEqual(await p.evaluate(()=>roundsDone),['A','B']);
  // Old mixed-review settings cannot reintroduce cards from other tasks.
  for(const [i,r] of data.rounds.entries()){
   await p.evaluate(({key,round})=>{
    const saved=JSON.parse(localStorage.getItem(key)||'{}');
    localStorage.setItem(key,JSON.stringify({...saved,round,reviewMode:'mixed',reviewIds:['A','B','C']}));
   },{key:data.course.id+'-rounds',round:i});
   await p.reload();
   assert.equal(await p.evaluate(()=>focusRound),i);
   assert.deepEqual(await p.evaluate(()=>roundsDone),['A','B']);
   await nav(5);await currentOnly(r.id);
   await footer().click();assert.equal(await p.evaluate(()=>page),6);await currentOnly(r.id);
   for(const other of data.rounds.filter(x=>x.id!==r.id))assert.equal(await p.locator(`#field-home-${other.id}`).count(),0);
   await footer().click();assert.equal(await p.evaluate(()=>page),0);
  }
  // Familiarity is still an editable record, independent of navigation access.
  await selectRound(1);await nav(5);
  await p.locator('[data-round-ready="B"]').click();
  assert.deepEqual(await p.evaluate(()=>roundsDone),['A']);
  await currentOnly('B');
  await nav(7);assert.equal(await p.evaluate(()=>page),7);
  await nav(5);await p.locator('[data-round-ready="B"]').check();
  await selectRound(0);await nav(5);
  await p.locator('.old-records > summary').click();
  assert((await p.locator('.old-records').innerText()).includes('舊分輪課前原句'));
  assert((await p.locator('.old-records').innerText()).includes('舊整天課前原句'));
  for(const details of await p.locator('.old-records details').all())await details.locator('summary').first().click();
  assert((await p.locator('.old-records').innerText()).includes('最早版課前原句'));
  assert((await p.locator('.old-records').innerText()).includes('更早匯入的原句'));
  for(const [key,value] of Object.entries(seeds))assert.deepEqual(await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key),value,`${key} must stay untouched`);
  report.functional.push('Stale mixed-review storage cannot change current-task scope; familiarity remains editable without locking Part 8; historical records stay untouched');

  await p.reload();
  for(const [i,r] of data.rounds.entries()){
   await selectRound(i);
   assert.equal(await p.locator(`#field-before-${r.id}`).inputValue(),`第一次 ${r.id}`);
   await nav(3);assert.equal(await p.locator('[data-field]').inputValue(),`情境 ${r.id}`);
   await nav(4);
   assert.equal(await p.locator('details.teacher').getAttribute('open'),null);
   assert.equal(await p.locator('[data-pair-check]:checked').count(),2);
   assert.equal(await p.locator(`#field-note-${data.pairs[i].id}`).inputValue(),`真人 ${r.id}`);
   await nav(5);assert.equal(await p.locator(`#field-after-${r.id}`).inputValue(),`現在 ${r.id}`);
   assert.equal(await p.locator(`[data-rating="${r.checkpoint.skills[0].id}:1"]`).getAttribute('aria-pressed'),'true');
   assert.equal(await p.locator(`[data-rating="${r.checkpoint.skills[1].id}:2"]`).getAttribute('aria-pressed'),'true');
   await nav(6);assert.equal(await p.locator(`#field-home-${r.id}`).inputValue(),`回家 ${r.id}`);
   assert(await p.locator(`[data-task-home="${r.id}:listen"]`).isChecked());
   assert(await p.locator(`[data-task-home="${r.id}:spoken"]`).isChecked());
  }
  report.functional.push('All task answers, notes, goals, ratings and homework flags survive reload without cross-task substitution');

  // Even a carried legacy payload stays intact when a new scoped answer saves.
  const legacyContext=await browser.newContext(),legacyPage=await legacyContext.newPage();
  await legacyPage.addInitScript(key=>localStorage.setItem(key,JSON.stringify({legacy:{before:'legacyView 保留原句',after:'legacyView 舊回答'}})),data.course.id);
  await legacyPage.goto(url);
  await legacyPage.locator('#field-before-A').fill('新題目原句');
  assert.deepEqual(await legacyPage.evaluate(key=>JSON.parse(localStorage.getItem(key)).legacy,data.course.id),{before:'legacyView 保留原句',after:'legacyView 舊回答'});
  await legacyContext.close();
  report.functional.push('Carried legacyView payload is preserved when new scoped answers save');

  const checkOverflow=async label=>{
   const result=await p.evaluate(()=>{
    const root=document.documentElement;
    const bad=[...document.querySelectorAll('#main *, dialog[open] *')].filter(el=>{
     if(!el.getClientRects().length||['SCRIPT','STYLE','OPTION'].includes(el.tagName))return false;
     const r=el.getBoundingClientRect();
     return r.width>0&&(r.left< -1||r.right>innerWidth+1);
    }).slice(0,5).map(el=>({tag:el.tagName,cls:el.className,text:el.textContent.trim().slice(0,60)}));
    return {width:innerWidth,scroll:root.scrollWidth,bad};
   });
   assert(result.scroll<=result.width+1&&!result.bad.length,`${label}: ${JSON.stringify(result)}`);
  };
  // Snapshot every view with enlarged text at desktop/tablet/mobile sizes.
  await selectRound(0);
  for(const theme of ['light','dark'])for(const width of [1440,768,390,320]){
   await p.setViewportSize({width,height:1000});
   const dark=await p.evaluate(()=>document.documentElement.dataset.theme==='dark');
   if(dark!==(theme==='dark'))await p.locator('#theme').click();
   if(await p.locator('#large').getAttribute('aria-pressed')!=='true')await p.locator('#large').click();
   for(let n=0;n<7;n++){
    await nav(n);
    if(n===2){await p.locator('[data-start="0"]').first().click();}
    if(n===4)await p.locator('details.teacher > summary').click();
    if(n>=5)await currentOnly('A');
    await checkOverflow(`${theme}/${width}/part-${n+1}`);
    await screenshot(`${theme}-${width}-part-${n+1}.png`);
    report.responsive.push({theme,width,view:n+1});
   }
   await p.locator('[data-homework-open]').click();
   const dialog=p.locator('dialog[open]');
   await p.waitForFunction(()=>!document.querySelector('#homework-print').disabled);
   assert(await dialog.locator('[name="homework-round"][value="A"]').isChecked());
   assert(!(await dialog.locator('[name="homework-round"][value="B"]').isDisabled()));
   assert(await dialog.locator('[name="homework-round"][value="C"]').isDisabled());
   await checkOverflow(`${theme}/${width}/handout`);
   assert(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Dialog content fits its inner width');
   const preview=p.frameLocator('#homework-preview');
   assert((await preview.locator('body').innerText()).includes(data.rounds[0].home.answer));
   assert(!(await preview.locator('body').innerText()).includes(data.rounds[2].home.answer));
   await screenshot(`${theme}-${width}-handout.png`);
   await dialog.locator('[data-homework-close]').click();
   await openMenu();
   assert.equal(await p.locator('#dg-course-dialog #nav button').count(),8);
   assert(!(await p.locator('#dg-course-dialog #nav [data-page="7"]').isDisabled()));
   assert.equal(await p.locator('#dg-course-dialog [data-dg-round]').count(),3);
   await checkOverflow(`${theme}/${width}/course-menu`);
   await screenshot(`${theme}-${width}-course-menu.png`);
   const capstoneEntry=p.locator('#dg-course-dialog #nav [data-page="7"]');
   await capstoneEntry.scrollIntoViewIfNeeded();
   await capstoneEntry.hover();
   await capstoneEntry.focus();
   const entryBounds=await capstoneEntry.boundingBox(),dialogBounds=await p.locator('#dg-course-dialog').boundingBox();
   assert(entryBounds.y>=dialogBounds.y&&entryBounds.y+entryBounds.height<=dialogBounds.y+dialogBounds.height,'The manual Part 8 entry is reachable inside the course-menu scroll area');
   await screenshot(`${theme}-${width}-course-menu-capstone.png`);
   await p.locator('#dg-menu-close').click();
  }
  assert.equal(report.responsive.length,56);
  assert.deepEqual(report.pageErrors,[]);
  for(const [key,value] of Object.entries(seeds))assert.deepEqual(await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key),value);
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log('PASS: 3 independent two-line tasks; 3 full cycles; fixed hints, role switching, early close, retry/cancel/back, current-task scope despite stale mixed storage, manual next task and unlocked Part 8, persistence and legacy records; 56 enlarged responsive views + 8 open handout dialogs + 8 open course menus. Screenshots: '+output);
 }catch(error){
  if(pageForFailure)await pageForFailure.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({...report,failure:String(error)},null,2));
  throw error;
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
