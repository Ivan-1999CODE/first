const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const catalog=require('./assets/curriculum-original.json');
const out='tmp/flow-guidance-unify';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),report=[];
 try{
  for(let day=0;day<=14;day++){
   const file=day===1?'travel-english.html':catalog.find(r=>r.day===day).file;
   const p=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];
   p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve(file)).href);
   const candidates=await p.evaluate(()=>[true,false].map(askFirst=>{
    for(let fi=0;fi<flows.length;fi++){const si=flows[fi].steps.findIndex(t=>Boolean(t.askFirst)===askFirst);if(si>=0)return {fi,si,askFirst};}
   }).filter(Boolean));
   const closed=async()=>{assert.equal(await p.locator('.flow-transcript').getAttribute('open'),null);assert(!(await p.locator('.flow-translation').isVisible()));};
   for(const c of candidates){
    await p.evaluate(({fi,si})=>{start(fi);turn=si;resetTurn();render();},c);
    await closed();
    assert.equal(await p.locator('.turn-current .turn-number').innerText(),'1');
    assert.equal(await p.locator('.turn-waiting .turn-number').innerText(),'2');
    const first=c.askFirst?'spoken':'heard',second=c.askFirst?'heard':'spoken';
    assert(await p.locator('#'+second).isDisabled());
    await p.locator('#'+first).check();await closed();
    assert.equal(await p.locator('.turn-done .turn-number').innerText(),'1');
    assert.equal(await p.locator('.turn-current .turn-number').innerText(),'2');
    assert.equal(await p.locator('.turn-waiting').count(),0);
    assert(!(await p.locator('#'+second).isDisabled()));
    await p.locator('#theme').click();await closed();
    const t=await p.evaluate(()=>currentStep());
    await p.locator('.flow-transcript > summary').click();
    assert(await p.locator('.flow-translation').isVisible());
    assert.equal(await p.locator('.flow-translation').innerText(),'中文意思：'+t.zh);
    await p.locator('#'+second).check();await closed();
    assert.equal(await p.locator('.turn-done').count(),2);
    await p.locator(`[data-choice="${t.valid[0]}"]`).click();
    await p.locator('.flow-transcript > summary').click();
    await p.locator('[data-act="next"]').click();
    if(!await p.evaluate(()=>finished))await closed();
    if(await p.evaluate(()=>turn>0&&!finished)){await p.locator('[data-act="back"]').click();await closed();}
    await p.evaluate(fi=>start(fi),c.fi);await closed();
    await p.locator('#'+(await p.evaluate(()=>currentStep().askFirst)?'spoken':'heard')).check();
    await p.locator('#'+(await p.evaluate(()=>currentStep().askFirst)?'spoken':'heard')).uncheck();
    await closed();assert.equal(await p.locator('.turn-current .turn-number').innerText(),'1');
    assert.equal(await p.locator('.turn-waiting .turn-number').innerText(),'2');
   }
   if([0,1,3].includes(day))for(const theme of ['light','dark']){
    await p.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size='large';start(0);},theme);
    await p.setViewportSize({width:390,height:1000});
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
    await p.screenshot({path:path.join(out,`day${day}-${theme}-mobile.png`),fullPage:true});
   }
   assert.deepEqual(errors,[]);report.push({day,orders:candidates.map(c=>c.askFirst?'student-first':'counterpart-first'),passed:true});
   await p.close();console.log(`Guidance PASS Day ${day}: collapsed text, numbered turns, checkbox transitions, retry and restart.`);
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
