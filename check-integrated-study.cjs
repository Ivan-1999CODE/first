const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const make=require('./assets/micro-curriculum.cjs').make;
const hotel=make(8),rescue=make(12),out=path.resolve('tmp/integrated-study-qa');
fs.mkdirSync(out,{recursive:true});
const url=file=>pathToFileURL(path.resolve(file)).href;
const report={libraries:0,disclosures:0,screens:[],errors:[]};
const cardStyle=el=>{const s=getComputedStyle(el),t=getComputedStyle(el.querySelector(':scope > .en'));return [s.backgroundColor,s.color,s.borderColor,s.borderRadius,s.padding,t.fontSize,t.fontWeight,t.lineHeight];};
async function checkLibrary(p,data,rs){
 const ps=rs.flatMap(r=>r.phraseIds.map(id=>data.phrases.find(p=>p.id===id)));
 const changes=rs.flatMap(r=>r.studyChanges||[]),cards=p.locator('.study-library .dg-study-card');
 assert.deepEqual(await cards.locator(':scope > .en').allTextContents(),ps.map(p=>p.en),'Only original sentences appear as main cards');
 const sections=await p.locator('[data-hotel-study-section]').count();
 assert.equal(await p.locator('.study-heading .study-portrait').count(),2*Math.max(1,sections),'Each situation retains both role portraits');
 assert.equal(await p.locator('.study-variation-vocabulary,#main > .dg-study-changes').count(),0,'No detached vocabulary replacement lesson');
 for(const [i,phrase]of ps.entries()){
  const card=cards.nth(i),swap=card.locator(':scope > .study-inline-changes'),expected=changes.filter(c=>c.baseAnswer===phrase.en);
  assert.equal(await card.locator(':scope > .study-meaning').textContent(),phrase.zh);
  assert.equal(await swap.count(),expected.length?1:0,'A card without substitutions has no disclosure');
  if(!expected.length)continue;
  assert.equal(await swap.evaluate(e=>e.open),false);
  const measure=()=>cards.evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));
  const before=await measure();
  await swap.locator(':scope > summary').focus();await p.keyboard.press('Enter');
  assert.equal(await swap.evaluate(e=>e.open),true);
  assert.deepEqual(await swap.locator('[data-study-change] > .en').allTextContents(),expected.map(c=>c.answer));
  const after=await measure();assert(after[i]>before[i]);
  before.forEach((h,j)=>{if(j!==i)assert(Math.abs(h-after[j])<1,'Only the expanded card grows');});
  for(const c of expected){
   assert.equal(await p.locator('[data-study-change]').filter({has:p.locator('.en',{hasText:c.answer})}).count(),1);
   const row=swap.locator('[data-study-change]').filter({has:p.locator('.en',{hasText:c.answer})});
   assert.equal(await row.locator('[data-say]').first().getAttribute('data-say'),c.answer);
  }
  await swap.locator(':scope > summary').click();
  assert.equal(await swap.evaluate(e=>e.open),false);report.disclosures++;
 }
 const lookup=p.locator('.study-vocabulary');assert.equal(await lookup.count(),1);assert.equal(await lookup.evaluate(e=>e.open),false);
 await lookup.locator(':scope > summary').click();
 assert.deepEqual(await lookup.locator('.study-originals').first().locator('.study-original-sentence > .en').allTextContents(),[...new Set(ps.map(p=>p.en))]);
 const words=[...new Map(rs.flatMap(r=>r.words).map(w=>[JSON.stringify(w),w])).values()];
 assert.deepEqual(await lookup.locator('.task-words > div').evaluateAll(es=>es.map(e=>[e.querySelector('b').textContent,e.querySelector('span').textContent])),words);
 assert.equal(await lookup.locator('.study-inline-changes,.study-variation-vocabulary').count(),0);
 await lookup.locator(':scope > summary').click();
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));report.libraries++;
}
async function shot(p,name){
 const swap=p.locator('.study-library .study-inline-changes').first();
 if(await swap.count()){await swap.locator(':scope > summary').click();await swap.locator(':scope > summary').hover();await swap.locator(':scope > summary').focus();}
 await p.locator('.study-library').first().screenshot({path:path.join(out,name+'.png')});report.screens.push(name);
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const theme of ['light','dark'])for(const width of [1366,390]){
   const c=await browser.newContext({viewport:{width,height:900}}),p=await c.newPage();
   p.on('pageerror',e=>report.errors.push(e.message));
   await p.addInitScript(({theme,width})=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size',width===390?'large':'standard');},{theme,width});
   await p.goto(url('travel-english-unit7-fitting.html'));await p.evaluate(()=>navigate(1));
   const expectedSay=await p.locator('.study-library .dg-study-card').first().evaluate(cardStyle);
   const expectedHear=await p.locator('.study-hear-card').first().evaluate(cardStyle);
   for(const [group,labels]of [['checkin',['A','B','C']],['stay',['D','E','F']],['chapter',['A','B','C','D','E','F']]]){
    await p.goto(url(hotel.file));await p.locator('[data-hi-mode="integrated"]').click();await p.locator(`[data-hi-group="${group}"]`).click();await p.evaluate(()=>navigate(1));
    const scopes=[['arrival',['A','B']],['information',['C']],['supplies',['D']],['dining',['E']],['repair',['F']]].filter(([,ls])=>ls.every(l=>labels.includes(l)));
    assert.deepEqual(await p.locator('[data-hotel-study-group]').evaluateAll(es=>es.map(e=>e.dataset.hotelStudyGroup)),scopes.map(([id])=>id));
    assert.deepEqual(await p.locator('[data-hotel-study-section]').evaluateAll(es=>es.map(e=>e.dataset.hotelStudySection)),[scopes[0][0]],'First situation is the default');
    const storedBefore=await p.evaluate(()=>Object.entries(localStorage).filter(([k])=>k.startsWith('travel-lab-en-day8')||k.startsWith('travel-lab-en-day8-integrated')));
    for(const [id,ls]of scopes){
     const tab=p.locator(`[data-hotel-study-group="${id}"]`);await tab.focus();await p.keyboard.press('Enter');
     assert.equal(await tab.getAttribute('aria-pressed'),'true');
     assert.deepEqual(await p.locator('[data-hotel-study-section]').evaluateAll(es=>es.map(e=>e.dataset.hotelStudySection)),[id]);
     await checkLibrary(p,hotel,hotel.rounds.filter(r=>ls.includes(r.displayLabel)));
    }
    await p.locator('[data-hotel-study-all]').focus();await p.keyboard.press('Space');
    assert.equal(await p.locator('[data-hotel-study-all]').getAttribute('aria-pressed'),'true');
    assert.equal(await p.locator('[data-hotel-study-group][aria-pressed=true]').count(),0);
    assert.deepEqual(await p.locator('[data-hotel-study-section]').evaluateAll(es=>es.map(e=>e.dataset.hotelStudySection)),scopes.map(([id])=>id),'Overview keeps situation headings and order');
    await checkLibrary(p,hotel,hotel.rounds.filter(r=>labels.includes(r.displayLabel)));
    await p.locator('.hi-study-picker').scrollIntoViewIfNeeded();await p.locator('[data-hotel-study-all]').hover();await p.locator('[data-hotel-study-all]').focus();
    await p.screenshot({path:path.join(out,`day8-${group}-${width}-${theme}-overview.png`)});
    await p.locator(`[data-hotel-study-group="${scopes[0][0]}"]`).click();
    assert.equal(await p.locator('[data-hotel-study-all]').getAttribute('aria-pressed'),'false');
    assert.equal(await p.locator('.study-inline-changes[open],.study-vocabulary[open]').count(),0,'Switching back closes optional content');
    assert.deepEqual(await p.evaluate(()=>Object.entries(localStorage).filter(([k])=>k.startsWith('travel-lab-en-day8')||k.startsWith('travel-lab-en-day8-integrated'))),storedBefore,'Grouping does not write learning records');
    await p.locator('.hi-study-picker').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,`day8-${group}-${width}-${theme}-grouped.png`)});
    assert.deepEqual(await p.locator('.study-library .dg-study-card').first().evaluate(cardStyle),expectedSay);
    assert.deepEqual(await p.locator('.study-hear-card').first().evaluate(cardStyle),expectedHear);
    await shot(p,`day8-${group}-${width}-${theme}`);
   }
   await p.goto(url(rescue.file));
   assert((await p.title()).includes('第 12 天'));
   assert.equal(await p.locator('.dg-cover-copy .eyebrow').textContent(),'第 12 天');
   await p.evaluate(()=>navigate(1));
   for(const [i,r]of rescue.rounds.entries()){
    await p.locator(`#dg-context [data-dg-task="${i}"]`).click();await checkLibrary(p,rescue,[r]);
    assert.deepEqual(await p.locator('.study-library .dg-study-card').first().evaluate(cardStyle),expectedSay);
    assert.deepEqual(await p.locator('.study-hear-card').first().evaluate(cardStyle),expectedHear);
   }
   await p.locator('#dg-context [data-dg-task="0"]').click();await shot(p,`day12-${width}-${theme}`);
   await c.close();
  }
  for(const day of [12,13,14]){
   const d=make(day),h=fs.readFileSync(d.file,'utf8');
   assert.equal(d.course.dayLabel,'第 12 天');assert.equal(d.course.id,'travel-lab-en-rescue-12-14-v1');
   assert.deepEqual(d.rounds,rescue.rounds);assert(h.includes('>DAY 12<'));
   assert(!h.includes('第 12～14 課整合'));
  }
  for(const file of fs.readdirSync('.').filter(f=>/^travel-(?:english.*|(?:japanese|korean)-day0-directions)\.html$/.test(f))){
   const h=fs.readFileSync(file,'utf8'),nav=h.match(/<nav class="day-switcher"[\s\S]*?<\/nav>/)?.[0];
   assert(nav.includes('<strong>第 12 天</strong>'),file+' navigation');assert(!nav.includes('第 12～14'));
  }
  assert(fs.readFileSync('index.html','utf8').includes('第 12 天：旅行出狀況，我能開口求助'));
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log('PASS: '+JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
