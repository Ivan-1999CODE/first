const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/inline-substitutions');fs.mkdirSync(out,{recursive:true});
const read=(h,k)=>JSON.parse(h.match(new RegExp('(?:^|[>\\n])const '+k+'=(.*);(?:\\r?\\n|<)'))[1]);
const normalize=value=>JSON.parse(JSON.stringify(value,(_,v)=>typeof v==='string'?v.replace(/\r\n/g,'\n'):v));
const baselineFile=path.join(out,process.argv.includes('--compare-fold-baseline')?'fold-baseline.json':'baseline.json');
const compareBaseline=process.argv.includes('--compare-baseline')||process.argv.includes('--compare-fold-baseline');
if(compareBaseline)assert(fs.existsSync(baselineFile),'Capture the before snapshot before comparing curriculum data');
const baseline=compareBaseline?JSON.parse(fs.readFileSync(baselineFile,'utf8')):[];
const report={days:0,tasks:0,changes:0,cardsWithSwaps:0,cardsWithoutSwaps:0,originalSentences:0,originalWords:0,foodOptions:0,independentHeights:0,errors:[],screenshots:[]};
const fileFor=day=>day===1?'travel-english.html':fs.readdirSync('.').find(f=>f.startsWith('travel-english-unit'+day+'-'));
const choose=(p,i)=>p.locator(`#dg-context [data-dg-task="${i}"]`).click();
const fits=async p=>assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
async function screenshot(p,name){await p.screenshot({path:path.join(out,name+'.png'),fullPage:true});report.screenshots.push(name+'.png');}
async function expandIndependently(disclosure){
 const card=disclosure.locator('..'),grid=card.locator('..');
 const measure=()=>grid.locator(':scope > article').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));
 const before=await measure(),index=await card.evaluate(e=>[...e.parentElement.children].filter(n=>n.tagName==='ARTICLE').indexOf(e));
 assert(index>=0);await disclosure.locator(':scope > summary').click();const after=await measure();
 assert(after[index]>before[index]+1,'The expanded card grows to fit its contents');
 for(let i=0;i<before.length;i++)if(i!==index)assert(Math.abs(after[i]-before[i])<1,'Sibling cards keep their own height');
 await disclosure.locator(':scope > summary').click();const closed=await measure();
 closed.forEach((height,i)=>assert(Math.abs(height-before[i])<1,'Closing restores the original card heights'));
 await disclosure.locator(':scope > summary').click();report.independentHeights++;
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});let active;
 try{
  for(let day=1;day<=14;day++){
   const file=fileFor(day),h=fs.readFileSync(file,'utf8'),d=Object.fromEntries(['course','rounds','phrases','flows','replies','missions'].map(k=>[k,read(h,k)]));
   const old=baseline.find(b=>b.day===day);
   if(old)for(const key of Object.keys(d))assert.deepEqual(normalize(d[key]),normalize(old[key]),`${day}: preserve ${key}`);
   const c=await browser.newContext({viewport:{width:390,height:844}}),p=await c.newPage();active=p;
   p.on('pageerror',e=>report.errors.push(day+': '+e.message));
   await p.addInitScript(()=>{localStorage.setItem('travel-lab-theme','dark');localStorage.setItem('travel-lab-text-size','large');});
   await p.goto(pathToFileURL(path.resolve(file)).href);await p.evaluate(()=>navigate(1));
   for(const [ri,r]of d.rounds.entries()){
    await choose(p,ri);
    const ids=r.phraseIds,ps=ids.map(id=>typeof id==='number'?d.phrases[id]:d.phrases.find(p=>p.id===id));
    const cards=p.locator('.study-library .dg-study-card');assert.equal(await cards.count(),ps.length);
    for(const [i,phrase]of ps.entries()){
     const card=cards.nth(i),changes=(r.studyChanges||[]).filter(s=>s.baseAnswer===phrase.en);
     const has=!!(changes.length||phrase.substitutions?.some(g=>g.options.some(([word])=>word.toLowerCase()!==g.target.toLowerCase())));
     assert.equal(await card.locator(':scope > .en').textContent(),phrase.en);
     assert.equal(await card.locator(':scope > .study-inline-changes').count(),has?1:0,`${day}/${r.id}: only relevant cards get a swap heading`);
     const disclosure=card.locator(':scope > .study-inline-changes');
     if(has){
      report.cardsWithSwaps++;
      assert.equal(await disclosure.evaluate(e=>e.tagName),'DETAILS');assert.equal(await disclosure.evaluate(e=>e.open),false);
      assert.equal(await disclosure.locator(':scope > summary').textContent(),'同一句，換一個詞');
      assert.equal(await disclosure.locator('.study-change-content').isVisible(),false,'Replacements start collapsed');
      await disclosure.locator(':scope > summary').focus();await p.keyboard.press('Enter');assert(await disclosure.evaluate(e=>e.open));
      assert(await disclosure.locator('.study-change-content').isVisible());
     }else report.cardsWithoutSwaps++;
     for(const change of changes){
      const row=card.locator('[data-study-change]').filter({has:card.page().locator('.en',{hasText:change.answer})});
      assert.equal(await row.count(),1,`${day}/${r.id}: replacement under its exact base sentence`);
      assert(await row.isVisible());assert((await row.textContent()).includes(change.from[0]));assert((await row.textContent()).includes(change.to[0]));
      assert.equal(await row.locator('[data-say]').first().getAttribute('data-say'),change.answer);report.changes++;
     }
     if(phrase.illustratedOptions){
      assert.equal(await card.locator('.food-option').count(),phrase.illustratedOptions.length);
      assert(await card.locator('.food-option').first().isVisible(),'One disclosure reveals the food pictures');
      assert.equal(await disclosure.locator('details').count(),0,'No second disclosure inside the swap card');
      for(const [j,option]of phrase.illustratedOptions.entries())assert.equal(await card.locator('.food-option h4').nth(j).textContent(),option.en);
      report.foodOptions+=phrase.illustratedOptions.length;await fits(p);
     }else for(const group of phrase.substitutions||[])for(const [word]of group.options)assert((await card.textContent()).toLowerCase().includes(word.toLowerCase()));
     if(has){await disclosure.locator(':scope > summary').click({position:{x:8,y:20}});assert.equal(await disclosure.evaluate(e=>e.open),false,'Clicking the arrow closes it');assert.equal(await disclosure.locator('.study-change-content').isVisible(),false);}
    }
    assert.equal(await p.locator('#main > .dg-study-changes').count(),0,'No detached swap section');
    const lookup=p.locator('.study-vocabulary');assert.equal(await lookup.count(),1);assert.equal(await lookup.evaluate(e=>e.open),false);
    await lookup.locator(':scope > summary').focus();await p.keyboard.press('Enter');assert(await lookup.evaluate(e=>e.open));
    assert.equal(await lookup.locator('.study-inline-changes,.study-variation-vocabulary').count(),0,'Lookup contains no substitution lesson');
    assert.deepEqual(await lookup.locator('.study-originals').first().locator('.study-original-sentence > .en').allTextContents(),[...new Set(ps.map(p=>p.en))]);
    const words=await lookup.locator('.task-words > div').evaluateAll(es=>es.map(e=>[e.querySelector('b').textContent,e.querySelector('span').textContent]));
    assert.deepEqual(words,r.words,'All original vocabulary and meanings retained');
    report.originalSentences+=ps.length;report.originalWords+=words.length;await fits(p);
    await lookup.locator(':scope > summary').click();await fits(p);
    // The fourth-part question set still uses the exact same prompts.
    const firstSwap=p.locator('.study-library .study-inline-changes').first();
    if(await firstSwap.count())await firstSwap.locator(':scope > summary').click();
    await p.evaluate(()=>navigate(3));assert.equal(await p.locator('.say-picker button').count(),r.sayPrompts.length);await p.evaluate(()=>navigate(1));
    assert.equal(await p.locator('.study-library .study-inline-changes[open]').count(),0,'Returning to the library resets disclosure state');
    report.tasks++;
   }
   await c.close();report.days++;console.log('D'+day+' inline substitutions passed');
  }
  // The hotel integration uses the same anchor rule and lookup as A/B/C.
  const c=await browser.newContext({viewport:{width:390,height:844}}),p=await c.newPage();active=p;p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(pathToFileURL(path.resolve(fileFor(8))).href);await p.locator('[data-hi-mode="integrated"]').click();await p.evaluate(()=>navigate(1));
  assert.equal(await p.locator('.hi-speaking-library > .hi-language').count(),7);assert.equal(await p.locator('.hi-speaking-library .study-inline-changes').count(),2);
  for(const el of await p.locator('.hi-speaking-library .study-inline-changes').all()){
   assert.equal(await el.getAttribute('data-substitution-base'),await el.locator('..').locator(':scope > .hi-en').textContent());
   assert.equal(await el.evaluate(e=>e.open),false);await el.locator(':scope > summary').focus();await p.keyboard.press('Space');
   assert(await el.locator('.study-change-content').isVisible());await el.locator(':scope > summary').click();
  }
  await p.locator('.study-vocabulary > summary').click();assert.equal(await p.locator('.study-originals').first().locator('.study-original-sentence').count(),7);await fits(p);
  await p.locator('[data-hi-study="reply"]').click();await p.locator('[data-hi-reply="1"]').click();assert.equal(await p.locator('.hi-remix').count(),0,'No empty passport replacement');
  await c.close();
  // Visual coverage: both themes, mobile large type and desktop. Exercise the
  // food disclosure and lookup drawer, plus the open navigation popover.
  for(const [width,theme,size]of [[1366,'light','standard'],[1024,'dark','large'],[390,'dark','large']]){
   const c=await browser.newContext({viewport:{width,height:900}}),p=await c.newPage();active=p;p.on('pageerror',e=>report.errors.push(e.message));
   await p.addInitScript(({theme,size})=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size',size);},{theme,size});
   for(const [day,task]of [[1,0],[2,1],[6,3],[7,0],[8,0],[12,0]]){
    await p.goto(pathToFileURL(path.resolve(fileFor(day))).href);await p.evaluate(()=>navigate(1));await choose(p,task);await fits(p);
    await screenshot(p,`folded-d${day}-${width}-${theme}`);
    const swap=p.locator('.study-library .study-inline-changes').first();
    if(await swap.count()){
     await expandIndependently(swap);await swap.locator(':scope > summary').hover();await swap.locator(':scope > summary').focus();await fits(p);
     await screenshot(p,`opened-d${day}-${width}-${theme}`);
     if(day===7)await swap.locator('..').screenshot({path:path.join(out,`fold-card-${width}-${theme}.png`)});
     if(day===1)await p.locator('.task-phrase-grid').screenshot({path:path.join(out,`independent-height-${width}-${theme}.png`)});
    }
    if(day===1){await p.locator('.study-vocabulary > summary').click();await p.locator('.study-vocabulary').scrollIntoViewIfNeeded();await fits(p);await screenshot(p,`lookup-${width}-${theme}`);}
    if(day===8){await p.locator('[data-hi-mode="integrated"]').click();await p.evaluate(()=>navigate(1));await expandIndependently(p.locator('.hi-speaking-library .study-inline-changes').first());await fits(p);await screenshot(p,`hotel-${width}-${theme}`);}
   }
   await p.locator('#dg-menu-open').click();await p.locator('#nav [data-page="1"]').hover();await p.locator('#nav [data-page="1"]').focus();await fits(p);await screenshot(p,`menu-${width}-${theme}`);
   await c.close();
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('PASS '+JSON.stringify(report));
 }catch(e){if(active&&!active.isClosed())await screenshot(active,'failure');throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
