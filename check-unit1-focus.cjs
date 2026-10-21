if(require('./assets/day1-focus-data.cjs').course.id==='travel-lab-unit1-micro-v2'){
 require('./check-unit1-micro.cjs');
}else{
const fs=require('fs'),assert=require('assert/strict'),path=require('path');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const data=require('./assets/day1-focus-data.cjs'),original=require('./assets/day1-2-data.cjs')[0];
assert.deepEqual(data.phrases,original.phrases.filter(p=>![3,4,11,12].some(i=>p.id==='phrase-'+i)));
assert.equal(data.phrases.find(p=>p.id==='phrase-0').en,'How do I get to the train station?');
require('./assets/listening-preview.cjs').addListeningPreview(data);
for(const r of data.rounds) assert(r.hearLines.every(p=>!r.omitHearLines.includes(p.en)));
assert.deepEqual(data.rounds.map(r=>r.id),['A','B']);
assert.deepEqual(data.rounds.flatMap(r=>r.phraseIds).sort(),['phrase-0','phrase-5','phrase-6','phrase-7','phrase-8','phrase-9','phrase-10'].sort());
assert(data.rounds.every(r=>r.phraseIds.length>=3&&r.phraseIds.length<=5));
// Audit the teaching boundary: every required spoken sentence was taught,
// every reply appears in basic listening, and optional material is unnecessary.
require('./assets/phrase-substitutions.cjs').addSubstitutions(data);
const normalized=text=>text.replace(/[’‘]/g,"'").trim();
const sentences=text=>text.split(/(?<=[.!?])\s+/).filter(Boolean).map(normalized);
for(const [ri,r] of data.rounds.entries()){
 const allowed=new Set(['Excuse me.']);
 const taught=[...r.phraseIds.map(id=>data.phrases.find(p=>p.id===id)),...r.reuse.map(i=>data.phrases[i])];
 for(const p of taught){
  allowed.add(normalized(p.en));
  for(const g of p.substitutions)for(const [option] of g.options)allowed.add(normalized(p.en.replace(g.target,option)));
 }
 for(const item of [...data.flows[ri].steps,...r.missionIds.map(i=>data.missions[i])]){
  for(const sentence of sentences(item.answer))assert(allowed.has(sentence),`Untaught required speech in ${r.id}: ${sentence}`);
 }
 const heard=new Set(r.hearLines.map(p=>p.en));
 for(const t of data.flows[ri].steps)assert(heard.has(t.line),`Untaught required listening: ${t.line}`);
 assert.deepEqual(r.replyIds.map(i=>[data.replies[i].answer,data.replies[i].line]),data.flows[ri].steps.map(t=>[t.answer,t.line]));
 assert(!r.hearLines.some(p=>/intersection|end of the road/.test(p.en)),'Route detail belongs in optional study');
}
const old={answers:{before:'Original first try',after:'Original later try','mission-need-0':'Old postcard answer','note-station':'Original pair note',home:'Original homework'},checks:{station:[true,false,true]},ratings:{ask:3},complete:['station']};
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(({key,old})=>{if(!localStorage.getItem('qa-focus-seeded')){localStorage.setItem(key,JSON.stringify(old));localStorage.setItem('qa-focus-seeded','yes');}}, {key:original.course.id,old});
 await p.goto(require('url').pathToFileURL(path.resolve('travel-english.html')).href);
 const nav=async n=>{const menu=p.locator('#courseMenu'),summary=menu.locator('summary').first();if(await summary.isVisible()&&!await menu.evaluate(e=>e.open))await summary.click();await p.locator(`#nav [data-page="${n}"]`).click();};
 const footer=()=>p.locator('#main > .footer-actions > button').last();
 const gate=async()=>{const first=await p.locator('#spoken').isDisabled()?'heard':'spoken';await p.locator('#'+first).check();await p.locator(first==='heard'?'#spoken':'#heard').check();};
 const verifyFlowTranscript=async(done=false)=>{const t=await p.evaluate(()=>currentStep());const translated=p.locator('.flow-transcript > .flow-translation'),details=p.locator('.flow-transcript'),summary=details.locator(':scope > summary');assert.equal(await details.getAttribute('open'),null,'Transcript stays closed until explicitly opened');assert(!(await translated.isVisible()),'Translation starts hidden');await summary.click();assert(await translated.isVisible());assert.equal(await translated.innerText(),'中文意思：'+t.zh);assert.equal(await p.locator('.flow-transcript > .en').innerText(),t.line);assert(await translated.evaluate(el=>el.previousElementSibling.matches('.en')));await summary.click();assert(!(await translated.isVisible()));assert.deepEqual(await p.locator('.flow-turn .turn-number').allTextContents(),['1','2']);assert.equal(await p.locator('.flow-turn.turn-done').count(),done?2:0);assert.equal(await p.locator('.flow-turn.turn-current').count(),done?0:1);assert.equal(await p.locator('.flow-turn.turn-waiting').count(),done?0:1);if(!done)assert.equal(await p.locator('.flow-turn.turn-current .turn-number').innerText(),'1');};
 assert.equal(await p.locator('#nav button').count(),7);assert.equal(await p.locator('#field-before').inputValue(),'Original first try');
 await p.locator('#field-before').fill('My new first try');
 fs.mkdirSync('tmp/day1-alignment/integration',{recursive:true});await p.screenshot({path:'tmp/day1-alignment/integration/home.png',fullPage:true});
 await p.locator('[data-focus-round="0"]').first().click();
 for(let r=0;r<data.rounds.length;r++){
  assert.equal(await p.evaluate(()=>focusRound),r);assert.equal(await p.evaluate(()=>page),1);
  assert.equal(await p.locator('.study-library .focus-phrase:visible').count(),data.rounds[r].phraseIds.length);
  assert.equal(await p.locator('.study-practice').count(),0);
  assert.equal(await p.locator('[data-focus-round="2"]').count(),0);
  const hear=await p.locator('.study-hear-card .en').allTextContents();
  assert.deepEqual(hear,data.rounds[r].hearLines.map(p=>p.en));
  assert(hear.every(en=>!data.rounds[r].omitHearLines.includes(en)));
  assert.equal(await p.locator('.study-library .study-meaning:visible').count(),data.rounds[r].phraseIds.length);
  await p.locator('[data-study-view="reply"]').click();assert.equal(await p.locator('.workshop-picker button').count(),data.rounds[r].replyIds.length);
  for(const i of data.rounds[r].replyIds){await p.locator(`[data-reply="${i}"]`).first().click();assert.equal(await p.locator('.workshop-answer details[open]').count(),0);}
  await p.locator('[data-study-view="library"]').click();
  await p.screenshot({path:`tmp/day1-alignment/integration/phrases-${r}.png`,fullPage:true});
  await footer().click();assert.equal(await p.evaluate(()=>page),2);
  for(let i=0;i<data.flows[r].steps.length;i++){
   const t=data.flows[r].steps[i];assert(await p.locator('[data-choice]').first().isDisabled());await verifyFlowTranscript();await gate();await verifyFlowTranscript(true);
   const wrong=t.objects.findIndex((_,j)=>!t.valid.includes(j));if(wrong>=0){await p.locator(`[data-choice="${wrong}"]`).click();assert(await p.locator('[data-act="next"]').isDisabled());}
   await p.locator(`[data-choice="${t.valid[0]}"]`).click();
   if(t.position)assert((await p.locator('.scene-state').innerText()).includes(t.position[2]));
   if(i===0){await p.locator('#spoken').uncheck();assert(await p.locator('[data-act="next"]').isDisabled());await gate();await p.locator(`[data-choice="${t.valid[0]}"]`).click();}
   await p.locator('[data-act="next"]').click();
  }
  assert((await p.locator('#main').innerText()).includes('流程完成'));await footer().click();
  for(const idx of data.rounds[r].missionIds){assert.equal(await p.evaluate(()=>mission),idx);assert.equal(await p.locator('#main .grid details[open]').count(),0);await p.locator(`[data-field="mission-${data.missions[idx].id}"]`).fill(`round ${r} mission ${idx}`);await footer().click();}
  assert.equal(await p.evaluate(()=>page),4);
  for(const idx of data.rounds[r].pairIds){assert.equal(await p.evaluate(()=>pair),idx);const id=data.pairs[idx].id;await p.locator(`[data-pair-check="${id}:0"]`).check();await p.locator(`#field-note-${id}`).fill(`pair ${id}`);await p.locator('details.teacher>summary').click();await p.screenshot({path:`tmp/day1-alignment/integration/teacher-${id}.png`,fullPage:true});await footer().click();}
 }
 assert.equal(await p.evaluate(()=>page),5);assert.deepEqual(await p.evaluate(()=>roundsDone),['A','B']);
 await p.locator('details').filter({has:p.locator('summary', {hasText:'改版前的第一天紀錄'})}).locator('summary').first().click();assert((await p.locator('#main').innerText()).includes('Old postcard answer'));
 await p.locator('#field-after').fill('My new later try');await p.locator('[data-rating="ask:3"]').click();assert.equal(await p.locator('.meter .green').count(),3);await p.locator('[data-rating="ask:1"]').click();assert.equal(await p.locator('.meter .green').count(),0);
 await p.reload();assert.equal(await p.locator('#field-before').inputValue(),'My new first try');assert.deepEqual(await p.evaluate(()=>roundsDone),['A','B']);
 for(let r=0;r<data.rounds.length;r++){await p.locator(`[data-focus-round="${r}"]`).first().click();await nav(3);assert.equal(await p.locator('[data-field]').inputValue(),`round ${r} mission ${r*2}`);await nav(4);assert(await p.locator('[data-pair-check]').first().isChecked());await nav(0);}
 assert.deepEqual(await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),original.course.id),old);
 await p.locator('[data-focus-round="1"]').first().click();await footer().click();await gate();await p.locator('[data-choice="0"]').click();await p.locator('[data-act="next"]').click();await p.locator('[data-act="back"]').click();assert.equal(await p.evaluate(()=>history.length),0);assert(await p.locator('[data-choice]').first().isDisabled());
 for(const theme of ['light','dark'])for(const width of [1440,768,390,320]){await p.setViewportSize({width,height:1000});await p.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.size='large';appearance();return new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(res)));},theme);for(let r=0;r<data.rounds.length;r++){await nav(1);await p.locator(`[data-focus-round="${r}"]`).first().click();for(let n=1;n<=4;n++){await nav(n);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow ${theme} ${width} ${r} ${n}`);if(width===390&&r===1&&(n===1||n===2))await p.screenshot({path:`tmp/day1-alignment/integration/${theme}-mobile-${n}.png`,fullPage:true});}}}
 await nav(6);await p.locator('[data-quiz="route:0"]').click();assert((await p.locator('#main').innerText()).includes('再聽一次'));await p.locator('[data-quiz="route:1"]').click();await p.locator('[data-home="spoken"]').check();await p.reload();await nav(6);assert(await p.locator('[data-home="spoken"]').isChecked());
 const legacy=await browser.newPage();await legacy.addInitScript(()=>localStorage.setItem('travel-lab-unit1-v2',JSON.stringify({before:'Earlier version attempt',after:'Earlier answer'})));await legacy.goto(require('url').pathToFileURL(path.resolve('travel-english.html')).href);assert.equal(await legacy.locator('#field-before').inputValue(),'Earlier version attempt');await legacy.close();
 assert.deepEqual(errors,[]);console.log('PASS: 7 basic phrases + optional alternatives; taught speech/listening coverage; identical practice dialogues; 2 full round cycles; retry, cancel, back; 4 independent missions/pairs; v2/v3 records preserved; reload, ratings, homework; 64 responsive round/view states.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
}
