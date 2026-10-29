const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const curriculum=require('./assets/micro-curriculum.cjs');
const out=path.resolve('tmp/guided-study-qa');fs.mkdirSync(out,{recursive:true});
const days=Array.from({length:13},(_,i)=>i+2);
const urlFor=day=>pathToFileURL(path.resolve(curriculum.make(day).file||'travel-english-unit2-shopping.html')).href;

(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const report={days:0,tasks:0,replies:0,foodOptions:0,pageErrors:[],screenshots:[],responsive:[]};let activePage;
 const setup=async(day,viewport={width:1366,height:900},theme='light',size='standard')=>{
  const context=await browser.newContext({viewport}),p=await context.newPage();activePage=p;p.setDefaultTimeout(10000);
  p.on('pageerror',e=>report.pageErrors.push({day,error:e.message}));
  await p.addInitScript(({theme,size})=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size',size);},{theme,size});
  await p.goto(urlFor(day));await p.locator('#dg-menu-open').click();await p.locator('#nav [data-page="1"]').click();
  return {p,context};
 };
 const task=async(p,n)=>{await p.locator(`#dg-context [data-dg-task="${n}"]`).click();assert.equal(await p.evaluate(()=>taskRound),n);assert.equal(await p.evaluate(()=>page),1);};
 const view=async(p,mode)=>{await p.locator(`.study-navigation [data-study-view="${mode}"]`).click();assert.equal(await p.evaluate(()=>window.eval('mode')),mode);};
 const shot=async(p,name)=>{await p.screenshot({path:path.join(out,name+'.png')});report.screenshots.push(name+'.png');};
 const overflow=async(p,label)=>{
  const issues=await p.evaluate(()=>[...document.querySelectorAll('#main *,#dg-context *')].filter(e=>{
   if(!e.getClientRects().length||getComputedStyle(e).visibility==='hidden'||e.closest('[inert]'))return false;
   // Task letters have their own deliberate horizontal scroller on a small screen.
   if(e.closest('.dg-task-switch'))return false;
   const r=e.getBoundingClientRect();return r.width>0&&(r.left < -1||r.right>innerWidth+1);
  }).slice(0,8).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,70)})));
  assert.deepEqual(issues,[],label+' visible bounds');assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' page width');
 };
 try{
  for(const day of days){
   const data=curriculum.make(day),{p,context}=await setup(day);report.days++;
   assert.equal(await p.evaluate(()=>course.id),data.course.id);
   for(let n=0;n<data.rounds.length;n++){
    const r=data.rounds[n];await task(p,n);report.tasks++;
    assert.equal(await p.locator('.study-navigation').count(),1,'One study entry bar');
    assert.equal(await p.locator('.study-library [data-study-phrase]').count(),r.phraseIds.length,`D${day} ${r.displayLabel} phrase count`);
    const requiredChanges=[r.variation,...r.additionalVariations||[]].flatMap(v=>v?.steps||[]);
    const taught=data.phrases.filter(x=>r.phraseIds.includes(x.id)).map(x=>x.en);
    const expectedSay=[...new Set([...taught,...requiredChanges.map(s=>s.answer)])].sort();
    const expectedHear=[...new Set([...r.hearLines.map(x=>x.en),...requiredChanges.map(s=>s.line)])].sort();
    assert.deepEqual([...new Set(await p.locator('.study-library [data-study-phrase] > .en,.dg-study-changes .dg-change-card > .en').allTextContents())].sort(),expectedSay,'Every required speaking variation is taught without opening a full dialogue');
    assert.deepEqual((await p.locator('.study-hear-grid .study-hear-card > .en').allTextContents()).sort(),expectedHear,'Every required listening variation is taught');
    for(const card of await p.locator('.study-library [data-study-phrase],.dg-study-changes .dg-change-card,.study-hear-grid .study-hear-card').all())assert(await card.isVisible(),'Required cards are visible');
    const preview=p.locator('.dg-dialogue-preview');
    assert.equal(await preview.evaluate(e=>e.open),false,'Dialogue continuation starts collapsed after task/view switches');
    const steps=data.flows[r.flowIds[0]].steps;
    const sampleCount=Math.min(steps.length,steps[1]&&(steps[1].sceneTitle||steps[1].sceneContext)?1:2);
    assert.equal(await p.locator('[data-example-kind="primary"] .micro-dialogue:not(.micro-prelude)').count(),sampleCount,'Only one brief example, without crossing into a different scene');
    assert.equal(await p.locator('[data-example-kind="variation"],[data-example-kind="core"],[data-example-kind="additional-variation"]').count(),0,'Do not repeat full variant conversations');
    await preview.locator(':scope > summary').click();
    assert.equal(await preview.evaluate(e=>e.open),true,'Example can be opened');
    await preview.locator(':scope > summary').click();
    if(r.words.length)assert.equal(await p.locator('.study-vocabulary').evaluate(e=>e.open),false,'Vocabulary starts collapsed');
    for(const id of r.phraseIds){const phrase=data.phrases.find(x=>x.id===id);if(!phrase.illustratedOptions)continue;
     const card=p.locator(`[data-study-phrase="${id}"]`);await card.locator('.food-usage > summary').click();
     assert.equal(await card.locator('.food-option').count(),phrase.illustratedOptions.length);
     for(const [j,option] of phrase.illustratedOptions.entries()){
      const box=card.locator('.food-option').nth(j);assert.equal((await box.locator('h4').innerText()).trim(),option.en);assert(await box.locator('.food-picture').evaluate(e=>getComputedStyle(e).backgroundImage.startsWith('url("data:image/png;base64,')));
     }
     report.foodOptions+=phrase.illustratedOptions.length;await card.locator('.food-usage > summary').click();
    }
    await view(p,'reply');
    for(const id of r.replyIds){
     const q=data.replies[id],first=q.askFirst?'self':'other',other=q.askFirst?'other':'self';
     await p.locator(`.workshop-picker [data-reply="${id}"]`).click();
     assert.equal(await p.locator('.dg-study-current').count(),1,'Only the current speaker occupies the reply area');
     assert.equal(await p.locator('.dg-study-current').getAttribute('data-study-speaker'),first);
     if(first==='other')assert((await p.locator('.dg-study-current .dg-role').innerText()).includes(q.role||r.role||data.course.replyRole));
     const selfChecks=async()=>{
      const box=p.locator('.dg-study-current .dg-hint');
      assert.equal(await box.locator('[data-level="0"]').getAttribute('aria-pressed'),'true','New exchange begins without the answer');
      assert.equal(await box.locator('[data-pane="2"]').evaluate(e=>e.inert&&getComputedStyle(e).visibility==='hidden'),true);
      await box.locator('[data-level="2"]').click();
      assert.equal((await box.locator('[data-pane="2"] .dg-en').innerText()).trim(),q.answer);
      await box.locator('[data-level="0"]').click();
     };
     if(first==='self')await selfChecks();else assert.equal(await p.locator('.dg-study-current details').evaluate(e=>e.open),false,'Listening transcript starts collapsed');
     if(id===r.replyIds[0]){
      await p.locator(`#dg-context [data-dg-task="${n}"]`).click();
      assert.equal(await p.locator('.dg-study-current').getAttribute('data-study-speaker'),first,'Clicking the selected task leaves the active rehearsal intact');
     }
     await p.locator(`.dg-study-current [data-dg-reply-role="${other}"]`).click();
     assert.equal(await p.locator('.dg-study-current').count(),1);
     assert.equal(await p.locator('.dg-study-current').getAttribute('data-study-speaker'),other);
     if(other==='self')await selfChecks();else{
      assert((await p.locator('.dg-study-current .dg-role').innerText()).includes(q.role||r.role||data.course.replyRole));
      const details=p.locator('.dg-study-current details');assert.equal(await details.evaluate(e=>e.open),false);await details.locator('summary').click();assert((await details.innerText()).includes(q.line));
     }
     const scene=r.replyIds.slice(0,r.replyIds.indexOf(id)+1).map(i=>data.replies[i]).reverse().find(x=>x.sceneTitle||x.sceneContext);
     if(scene){const text=await p.locator('.dg-study-scene').innerText();if(scene.sceneTitle)assert(text.includes(scene.sceneTitle));if(scene.sceneContext)assert(text.includes(scene.sceneContext));}
     report.replies++;
    }
    await view(p,'library');
   }
   await context.close();console.log(`D${day} study passed`);
  }
  for(const [width,height,theme,size] of [[390,844,'light','standard'],[390,844,'dark','large'],[1024,768,'dark','large'],[1024,768,'light','standard']]){
   const prefix=`${width}-${theme}-${size}`,{p,context}=await setup(6,{width,height},theme,size);
   await task(p,3);await overflow(p,prefix+' phrase library');await shot(p,prefix+'-library');
   const otherCard=p.locator('.study-library [data-study-phrase]').nth(1),otherHeight=(await otherCard.boundingBox()).height;
   const usage=p.locator('.food-usage').first();await usage.locator('summary').click();
   assert(Math.abs((await otherCard.boundingBox()).height-otherHeight)<1,'Opening one usage card must not stretch its sibling');
   await usage.locator('.food-option').first().scrollIntoViewIfNeeded();await overflow(p,prefix+' food options');await shot(p,prefix+'-food-usage');
   await view(p,'reply');const first=await p.locator('.dg-study-current').getAttribute('data-study-speaker');
   if(first!=='self')await p.locator('[data-dg-reply-role="self"]').click();
   await p.locator('.dg-study-current [data-level="2"]').click();await p.locator('.dg-study-current').scrollIntoViewIfNeeded();await overflow(p,prefix+' full hint');await shot(p,prefix+'-hint');
   await p.locator('[data-dg-reply-role="other"]').click();await p.locator('.dg-study-current details > summary').click();await p.locator('.dg-study-current').scrollIntoViewIfNeeded();await overflow(p,prefix+' transcript');await shot(p,prefix+'-transcript');
   await p.goto(urlFor(11));await p.locator('#dg-menu-open').click();await p.locator('#nav [data-page="1"]').click();await view(p,'reply');
   assert.equal(await p.locator('.dg-study-current').getAttribute('data-study-speaker'),'other');await p.locator('.dg-study-current details > summary').click();await overflow(p,prefix+' listen first');await shot(p,prefix+'-listen-first');
   await p.goto(urlFor(10));await p.locator('#dg-menu-open').click();await p.locator('#nav [data-page="1"]').click();await view(p,'reply');
   const multi=await p.evaluate(()=>activeRound().replyIds.map(i=>({id:i,role:replies[i].role})));for(const q of multi){await p.locator(`.workshop-picker [data-reply="${q.id}"]`).click();if(await p.locator('.dg-study-current').getAttribute('data-study-speaker')==='self')await p.locator('[data-dg-reply-role="other"]').click();assert((await p.locator('.dg-study-current .dg-role').innerText()).includes(q.role));}
   await p.locator('.dg-study-current details > summary').click();await overflow(p,prefix+' mixed roles');await shot(p,prefix+'-mixed-role');
   report.responsive.push({width,height,theme,size});await context.close();
  }
  assert.deepEqual(report.pageErrors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(`PASS: ${report.days} days / ${report.tasks} tasks / ${report.replies} exchanges / ${report.foodOptions} food options; 4 viewport/theme/text combinations.`);
 }catch(error){if(activePage&&!activePage.isClosed())await activePage.screenshot({path:path.join(out,'failure.png'),fullPage:true});throw error;}
 finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
