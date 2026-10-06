const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const catalog=require('./assets/curriculum-original.json');
const source=day=>day===0?require('./assets/day0-expanded.cjs'):day===1?require('./assets/day1-focus-data.cjs'):day===2?require('./assets/day2-expanded.cjs'):require('./assets/curriculum-rounds.cjs').make(day);
const normalize=s=>s.replace(/[’‘]/g,"'").replace(/\s+/g,' ').trim();
const out='tmp/study-library-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),report=[];try{
for(let day=0;day<=14;day++){
 const d=source(day),file=day===1?'travel-english.html':catalog.find(x=>x.day===day).file;
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(file)).href);
 let total=0;
 for(let ri=0;ri<d.rounds.length;ri++){
  await page.evaluate(({day,ri})=>{if(day===1)setRound(ri);else setTaskRound(ri);navigate(1);},{day,ri});
  assert.equal(await page.locator('.study-navigation button').count(),2);
  assert(await page.locator('.study-navigation').evaluate(e=>e.nextElementSibling.matches('.eyebrow,.lesson-section-heading')),'Entries immediately precede DAY/title');
  await page.locator('[data-study-view="reply"]').click();
  assert.equal(await page.locator('[data-study-view="reply"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.model-line,.workshop-question > details[open],.role-other > details[open]').count(),0);
  if(day!==1){await page.locator('[data-listen-mode="model"]').click();assert.equal(await page.locator('.model-line').count(),1);}
  else {await page.locator('.workshop-question > details > summary').click();assert.equal(await page.locator('.workshop-question > details[open]').count(),1);}
  await page.locator('[data-study-view="library"]').click();
  assert.equal(await page.locator('[data-study-view="library"]').getAttribute('aria-pressed'),'true');
  const say=page.locator('.study-library'),hear=page.locator('.study-listening,.japanese-hear-block');
  const bounds=await page.locator('.study-library,.study-listening,.japanese-hear-block').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));assert.equal(bounds.length,2);assert(bounds[0].bottom<=bounds[1].top);
  assert.equal(await say.locator('.task-phrase-grid>article').count(),d.rounds[ri].phraseIds.length);
  const cards=hear.locator('article'),lines=[];assert((await cards.count())>0);total+=await cards.count();
  for(const card of await cards.all()){
   const en=await card.locator(':scope>.en').innerText();lines.push(normalize(en));
   assert(await card.locator(':scope>.en').isVisible());assert(await card.locator('.study-meaning,.preview-meaning').isVisible());assert((await card.locator('.study-meaning,.preview-meaning').innerText()).trim());
   assert.equal(await card.locator('[data-say]').first().getAttribute('data-say'),en);
   assert.equal(await card.locator('[data-slow]').count(),1);
  }
  assert.equal(new Set(lines).size,lines.length,'Duplicate reply');
  // Query the actual runtime for both route variants and every possible prior choice.
  const expected=await page.evaluate(({day,ri})=>{const r=rounds[ri],result=[];
   for(const fi of r.flowIds||[ri]){const f=flows[fi];for(let i=0;i<f.steps.length;i++)for(let choice=0;choice<4;choice++)for(const variant of [0,1]){if(day!==1)routeVariant=variant;result.push(lessonStep(f,i,()=>choice).line);}}
   if(day!==1)routeVariant=0;
   for(const id of r.pairIds){const p=pairs[id];result.push(...p.cards.map(c=>c[1]));if(p.start)result.push(p.start);}
   for(const id of [...r.replyIds,...r.extraReplyIds||[]])result.push(replies[id].line||replies[id].en);
   return result;
  },{day,ri});
  for(const line of expected)assert(lines.includes(normalize(line)),`Day ${day}/${ri} missing ${line}`);
  await page.locator('.study-portrait').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));
  const roles=await page.locator('.study-portrait').evaluateAll(es=>es.map(e=>({key:e.dataset.illustration,width:e.naturalWidth})));assert.equal(roles.length,2);assert(roles.every(r=>r.width>0));assert.notEqual(roles[0].key,roles[1].key);
  for(const theme of ['light','dark'])for(const width of [320,768,1440]){await page.setViewportSize({width,height:1100});await page.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.size='large';},theme);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`Overflow ${day}/${ri}/${theme}/${width}`);}
  if(ri===0&&[0,1,3,8,12].includes(day)){
   await page.setViewportSize({width:1440,height:1100});await page.evaluate(()=>{document.documentElement.dataset.theme='light';document.documentElement.dataset.size='standard';});
   await say.screenshot({path:`${out}/day${day}-speaking.png`});await hear.screenshot({path:`${out}/day${day}-listening.png`});
   await page.locator('.study-navigation').screenshot({path:`${out}/day${day}-navigation.png`});
  }
 }
 // Every authored homework listening line is introduced somewhere in this lesson.
 const union=await page.evaluate(()=>rounds.flatMap(r=>r.hearLines.map(p=>p.en)));
 for(const q of d.quizzes||[])assert(union.map(normalize).includes(normalize(q.line||q.en)),`Homework ${day} ${q.id}`);
 assert.deepEqual(errors,[]);report.push({day,rounds:d.rounds.length,listeningCards:total});console.log(`PASS Day ${day}: ${d.rounds.length} rounds, ${total} reply cards; translations, coverage, illustrations and responsive layout.`);await page.close();
}
fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
