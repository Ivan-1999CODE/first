const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/single-situation');fs.mkdirSync(out,{recursive:true});
const read=(h,k)=>JSON.parse(h.match(new RegExp('(?:^|[>\\n])const '+k+'=(.*);(?:\\r?\\n|<)'))[1]);
const report={files:0,tasks:0,scenarios:0,errors:[],screenshots:[]};
const bounds=p=>p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);
async function shot(p,name){await p.evaluate(async()=>{scrollTo(0,0);await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));});await p.screenshot({path:path.join(out,name+'.png'),fullPage:true});report.screenshots.push(name+'.png');}
function single(p){
 assert.equal(p.mode,'scenario');assert.equal(p.singleUtterance,true);assert.equal(p.sentences.length,1);assert.equal(p.answer,p.sentences[0]);
 assert.equal(p.answer.replace(/p\.m\./g,'pm').split(/[.!?。！？]+/).filter(s=>s.trim()).length,1,'One utterance: '+p.answer);
 assert(!/再.*(?:詢問|確認|回應)|哪些資訊|分別|兩個需求|幾句|哪些事情/.test(p.prompt),'No multi-step request: '+p.prompt);
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const file of fs.readdirSync('.').filter(f=>/^travel-.*\.html$/.test(f))){
   const h=fs.readFileSync(file,'utf8'),rounds=read(h,'rounds'),flows=read(h,'flows');
   for(const m of h.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
   // Verify the generated lesson against its current authored source. Temporary
   // migration snapshots predate the reviewed 03 prompts and are not in Git.
   const language=file.includes('japanese')?'ja':file.includes('korean')?'ko':null;
   const expected=language?require('./assets/micro-day0.cjs').make(language):file==='travel-english.html'?require('./assets/day1-focus-data.cjs'):require('./assets/micro-curriculum.cjs').make(Number(file.match(/unit(\d+)/)[1]));
   if(file==='travel-english.html'){require('./assets/phrase-substitutions.cjs').addSubstitutions(expected);require('./assets/listening-preview.cjs').addListeningPreview(expected);require('./assets/english-answer-translations.cjs').addAnswerTranslations(expected);}
   for(const key of ['flows','replies','phrases','rounds'])assert.deepEqual(read(h,key),JSON.parse(JSON.stringify(expected[key])),file+' matches authored '+key);
   for(const [ri,r]of rounds.entries()){
    assert(r.retiredSayPrompts.length>0,'Old situations remain registered');
    r.sayPrompts.forEach(single);
   }
   const c=await browser.newContext({viewport:{width:390,height:844}}),p=await c.newPage();p.setDefaultTimeout(10000);p.on('pageerror',e=>report.errors.push(file+': '+e.message));
   await p.goto(pathToFileURL(path.resolve(file)).href);await p.evaluate(()=>navigate(3));
   for(const [ri,r]of rounds.entries()){
    const task=p.locator(`#dg-context [data-dg-task="${ri}"]`);assert(await task.isVisible());await task.click();
    assert.equal(await p.evaluate(()=>page),3,'Task switch preserves section');assert.equal(await p.locator(`#dg-context [data-dg-task="${ri}"]`).getAttribute('aria-pressed'),'true');
    assert.equal(await p.locator('.say-picker button').count(),r.sayPrompts.length);assert.equal(await p.locator('.say-card').count(),1);
    for(const [i,s]of r.sayPrompts.entries()){
     await p.locator(`.say-picker [data-say-index="${i}"]`).click();
     assert.equal(await p.locator('.say-prompt').textContent(),s.prompt);assert.equal(await p.locator('.say-reference').isVisible(),false);
     await p.locator('[data-say-support="2"]').click();assert.equal(await p.locator('.say-reference .en').textContent(),s.answer);
     assert(await bounds(p),file+' mobile width');report.scenarios++;
    }
    report.tasks++;
   }
   // Every current task button remains directly reachable in all seven parts.
   for(let section=0;section<7;section++){
    await p.evaluate(n=>navigate(n),section);
    for(const b of await p.locator('#dg-context [data-dg-task]').all())assert(await b.isVisible());
    assert.equal(await p.locator('#dg-context [data-dg-task]').count(),rounds.length);
    assert(await p.evaluate(()=>{const a=document.querySelector('.dg-task-switch').getBoundingClientRect(),b=document.querySelector('#dg-context').getBoundingClientRect();return Math.abs(b.right-a.right)<=40;}),'Task controls align to upper right');
   }
   // Previously entered multi-sentence work stays separate from the new fields.
   const old=rounds[0].retiredSayPrompts[0].id,newId=rounds[0].sayPrompts[0].id;assert.notEqual(old,newId,'Old and new answer fields stay separate');
   await p.evaluate(old=>{state.answers[old]='原本情境的回答';save();},old);await p.reload();await p.evaluate(()=>navigate(3));await p.locator('#dg-context [data-dg-task="0"]').click();await p.locator('.say-picker [data-say-index="0"]').click();
   assert.equal(await p.locator(`[data-field="${newId}"]`).inputValue(),'');assert((await p.locator('.say-old-records').textContent()).includes('原本情境的回答'));
   await p.locator('.say-note summary').click();await p.locator(`[data-field="${newId}"]`).fill('新情境只說一句');await p.reload();
   assert.equal(await p.evaluate(old=>state.answers[old],old),'原本情境的回答');assert.equal(await p.evaluate(id=>state.answers[id],newId),'新情境只說一句');
   await c.close();report.files++;
  }
  const hotel=pathToFileURL(path.resolve('travel-english-unit8-hotel.html')).href;
  const c=await browser.newContext(),p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto(hotel);
  const hi=read(fs.readFileSync('travel-english-unit8-hotel.html','utf8'),'hotelIntegration');hi.sayPrompts.forEach(single);
  await p.locator('[data-hi-mode="integrated"]').click();await p.evaluate(()=>navigate(3));
  await p.locator('[data-hi-challenge-mode="single"]').click();
  for(const [i,s]of hi.sayPrompts.entries()){
   await p.locator(`nav [data-hi-say="${i}"]`).click();assert.equal(await p.locator('.say-reference').isVisible(),false);await p.locator('[data-say-support="2"]').click();assert.equal(await p.locator('.say-reference .en').textContent(),s.answer);
  }
  for(let n=0;n<6;n++){
   if(!await p.locator('body').evaluate(e=>e.classList.contains('hi-active')))await p.locator('[data-hi-mode="integrated"]').click();
   await p.locator(`[data-hi-task="${n}"]`).click();assert.equal(await p.evaluate(()=>taskRound),n);assert.equal(await p.evaluate(()=>page),3);assert.equal(await p.locator('body').evaluate(e=>e.classList.contains('hi-active')),false);
  }
  await c.close();
  for(const [file,ri]of [['travel-japanese-day0-directions.html',0],['travel-korean-day0-directions.html',2],['travel-english-unit6-ordering.html',2],['travel-english-unit8-hotel.html',4]]){
   for(const [width,theme]of [[1280,'light'],[390,'dark'],[320,'light']]){
    const c=await browser.newContext({viewport:{width,height:900}}),p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));
    await p.addInitScript(theme=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size','large');},theme);await p.goto(pathToFileURL(path.resolve(file)).href);await p.evaluate(()=>navigate(3));await p.locator(`#dg-context [data-dg-task="${ri}"]`).click();
    await p.locator('.say-picker button').last().focus();await p.keyboard.press('Enter');await p.locator('[data-say-support="2"]').click();await p.locator(`#dg-context [data-dg-task="${ri}"]`).hover();assert(await bounds(p));
    const name=path.basename(file,'.html')+'-'+width+'-'+theme;await shot(p,name);
    await p.locator('#dg-menu-open').click();await p.locator('#nav [data-page="3"]').focus();await shot(p,name+'-menu');
    await c.close();
   }
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('PASS '+JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
