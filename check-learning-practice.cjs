const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/learning-rollout');
const read=(html,key)=>JSON.parse(html.match(new RegExp('(?:^|[>\\n])const '+key+'=(.*);(?:\\r?\\n|<)'))[1]);
const report={courses:0,tasks:0,scenarios:0,withSwaps:0,withoutSwaps:0,errors:[],screenshots:[]};
const choose=(p,round,section)=>p.evaluate(({round,section})=>{if(typeof setTaskRound==='function')setTaskRound(round);else setRound(round);navigate(section);},{round,section});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const file of fs.readdirSync('.').filter(f=>/^travel-.*\.html$/.test(f))){
   const html=fs.readFileSync(file,'utf8'),rounds=read(html,'rounds'),replies=read(html,'replies'),flows=read(html,'flows');
   const before=JSON.parse(fs.readFileSync(path.join(out,path.basename(file,'.html')+'.before.json'),'utf8').replace(/^\uFEFF/,''));
   assert.deepEqual(flows,before.flows,file+' original dialogue paths');
   assert.deepEqual(replies.slice(0,before.replies.length),before.replies,file+' original replies');
   const c=await browser.newContext({viewport:{width:390,height:844}}),p=await c.newPage();
   p.on('pageerror',e=>report.errors.push(file+': '+e.message));
   await p.addInitScript(()=>{localStorage.setItem('travel-lab-theme','dark');localStorage.setItem('travel-lab-text-size','large');});
   await p.goto(pathToFileURL(path.resolve(file)).href);
   for(const [ri,r]of rounds.entries()){
    await choose(p,ri,1);
    assert.equal(await p.locator('.dg-study-changes').count(),r.studyChanges.length?1:0,file+'/'+r.id+' optional swaps');
    if(r.studyChanges.length){
     report.withSwaps++;
     assert(await p.evaluate(()=>!!(document.querySelector('.dg-study-changes').compareDocumentPosition(document.querySelector('.study-listening'))&Node.DOCUMENT_POSITION_FOLLOWING)),'Swaps before listening');
     const visible=await p.locator('.dg-study-changes').innerText();
     for(const s of r.studyChanges){
      assert(visible.includes(s.answer));
      assert(r.replyIds.some(i=>replies[i].answer===s.answer),'Replacement available for later turn-taking: '+s.answer);
     }
    }else report.withoutSwaps++;
    assert(r.sayPrompts.every(s=>s.mode==='scenario'));
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'02 mobile width');
    report.tasks++;report.scenarios+=r.sayPrompts.length;
   }
   // Legacy answers are still readable after entering and saving a new situation.
   const r=rounds.find(r=>r.retiredSayPrompts?.length),ri=rounds.indexOf(r),old=r.retiredSayPrompts[0].id,newId=r.sayPrompts[0].id;
   await p.evaluate(old=>{state.answers[old]='改版前保留的回答';save();},old);
   await p.reload();await choose(p,ri,3);
   assert((await p.locator('.say-old-records').textContent()).includes('改版前保留的回答'));
   assert.equal(await p.locator(`[data-field="${newId}"]`).inputValue(),'');
   await p.locator('.say-note > summary').click();await p.locator(`[data-field="${newId}"]`).fill('情境練習的新回答');
   await p.reload();await choose(p,ri,3);
   assert.equal(await p.locator(`[data-field="${newId}"]`).inputValue(),'情境練習的新回答');
   assert.equal(await p.evaluate(old=>state.answers[old],old),'改版前保留的回答');
   if(/unit2-|unit4-|unit6-|japanese|korean|^travel-english.html/.test(file)){
    const shotRound=/unit6-/.test(file)?2:/unit4-/.test(file)?1:0;
    for(const section of [1,3]){
     await choose(p,shotRound,section);
     if(section===3)await p.locator('[data-say-support="2"]').click();
     await p.evaluate(async()=>{window.scrollTo(0,0);await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));});
     const name=path.basename(file,'.html')+'-'+(section+1)+'.png';await p.screenshot({path:path.join(out,name),fullPage:true});report.screenshots.push(name);
    }
   }
   await c.close();report.courses++;
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('PASS '+JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
