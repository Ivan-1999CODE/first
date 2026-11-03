const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/say-practice');fs.mkdirSync(out,{recursive:true});
const files=fs.readdirSync('.').filter(f=>/^travel-.*\.html$/.test(f));
const read=(html,key)=>JSON.parse(html.match(new RegExp('(?:^|[>\\n])const '+key+'=(.*);(?:\\r?\\n|<)'))[1]);
const report={files:0,rounds:0,prompts:0,swaps:0,repeat:0,errors:[],screenshots:[]};
async function choose(p,round,section=3){await p.evaluate(({round,section})=>{
 if(typeof setTaskRound==='function')setTaskRound(round);else setRound(round);
 navigate(section);
},{round,section});}
async function bounds(p){assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');}
async function shot(p,name){await p.screenshot({path:path.join(out,name+'.png'),fullPage:true});report.screenshots.push(name+'.png');}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const file of files){
   const html=fs.readFileSync(file,'utf8'),rounds=read(html,'rounds'),course=read(html,'course'),flows=read(html,'flows');
   for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
   assert.equal(course.labels[3],'看情境，自己選用');
   const c=await browser.newContext({viewport:{width:1024,height:900}}),p=await c.newPage();p.on('pageerror',e=>report.errors.push(file+': '+e.message));
   await p.goto(pathToFileURL(path.resolve(file)).href);
   for(const [ri,r]of rounds.entries()){
    assert(r.sayPrompts.length>0);const keys=new Set();
    await choose(p,ri);
    assert.equal(await p.locator('.say-card').count(),1,file+'/'+r.id);
    for(const [i,s]of r.sayPrompts.entries()){
     assert(!keys.has(s.id));keys.add(s.id);
     assert(s.prompt&&s.answer&&s.answerZh);
     const core=(r.flowIds||[ri]).flatMap(fi=>flows[fi].steps);
     const authored=core.find(t=>t.answer===s.answer);
     if(s.mode==='scenario'){
      assert(s.sentences.length>0&&s.sentences.every(line=>core.some(t=>t.answer===line)),'Scenario reference uses taught sentences');
      assert.notEqual(s.prompt,s.answerZh,'Scenario requires selecting language, not translating a reply');
     }else{
      assert.equal(s.prompt,authored?.practicePrompt||s.answerZh);
      assert(core.some(t=>t.answer===s.baseAnswer),'Prompt starts from a mainline sentence');
     }
     if(s.mode==='scenario'){}else if(s.mode==='swap'){
      const at=s.baseAnswer.toLowerCase().indexOf(s.from[0].toLowerCase());assert(at>=0);
      assert.equal((s.baseAnswer.slice(0,at)+s.to[0]+s.baseAnswer.slice(at+s.from[0].length)).toLowerCase(),s.answer.toLowerCase());
      assert(!/[.!?。！？]/.test(s.from[0]),'Do not replace a complete response');report.swaps++;
     }else{assert.equal(s.answer,s.baseAnswer);report.repeat++;}
     await p.locator(`.say-picker [data-say-index="${i}"]`).click();
     assert.equal(await p.locator('.say-prompt').textContent(),s.prompt);
     assert.equal(await p.locator('.say-reference').evaluate(e=>e.hidden),true);
     assert.equal(await p.locator('.say-keywords').evaluate(e=>e.hidden),true);
     assert.equal(await p.locator('.say-note').evaluate(e=>e.open),false);
     assert.equal(await p.locator('.say-practice [data-guide-transcript],.say-practice [data-example-kind],.say-practice [data-choice]').count(),0,'No dialogue or listening task');
     await p.locator('[data-say-support="2"]').click();
     assert.equal(await p.locator('.say-reference .en').textContent(),s.answer);
     assert(await p.locator('.say-reference').isVisible());
     assert.equal(await p.locator('[data-say-support="2"]').getAttribute('aria-pressed'),'true');
     await p.locator('[data-say-support="1"]').click();
     assert(await p.locator('.say-keywords').isVisible());
     assert.equal(await p.locator('.say-reference').isVisible(),false);
     await p.locator('[data-say-support="0"]').click();
     assert(await p.locator('.say-self').isVisible());
     assert.equal(await p.locator('.say-keywords').isVisible(),false);
     report.prompts++;
    }
    report.rounds++;
   }
   // Same key survives reload; new questions never reuse old mission answers.
   await choose(p,0);const s=rounds[0].sayPrompts[0];
   await p.locator('.say-picker [data-say-index="0"]').click();
   await p.evaluate(()=>{state.answers['mission-'+missions[0].id]='舊題原始作答';save();});
   await p.locator('.say-note > summary').click();
   assert.equal(await p.locator(`[data-field="${s.id}"]`).inputValue(),'');
   await p.locator(`[data-field="${s.id}"]`).fill('這一句的測試作答');
   await p.reload();await choose(p,0);
   assert.equal(await p.locator(`[data-field="${s.id}"]`).inputValue(),'這一句的測試作答');
   assert((await p.locator('.say-old-records').textContent()).includes('舊題原始作答'));
   await bounds(p);await c.close();report.files++;
  }
  // Both bag responses are taught and reachable as full mainline branches.
  const shopping='travel-english-unit2-shopping.html',html=fs.readFileSync(shopping,'utf8'),rounds=read(html,'rounds'),flows=read(html,'flows'),pairs=read(html,'pairs'),r=rounds[1];
  assert(r.bagMainline);assert.equal(r.flowIds.length,2);assert.equal(r.pairIds.length,2);
  assert.deepEqual(r.flowIds.map(i=>flows[i].steps.at(-1).answer),['No, thank you.','Yes, please.']);
  assert(r.sayPrompts.every(s=>s.mode==='scenario'));
  const c=await browser.newContext(),p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(pathToFileURL(path.resolve(shopping)).href);await choose(p,1,1);
  for(const text of ['No, thank you.','Yes, please.'])assert((await p.locator('.study-library').innerText()).includes(text));
  for(const fi of r.flowIds){
   await p.evaluate(fi=>start(fi),fi);
   for(let i=0;i<flows[fi].steps.length;i++){
    // Use the actual confirmation and choice handlers, allowing both turn orders.
    const first=flows[fi].steps[i].askFirst?'spoken':'heard',second=first==='spoken'?'heard':'spoken';
    await p.locator('#'+first).click();await p.locator('#'+second).click();
    await p.locator(`[data-choice="${flows[fi].steps[i].valid[0]}"]`).click();
    await p.locator('[data-act="next"]').click();
   }
   assert(await p.evaluate(()=>finished));
  }
  await choose(p,1,4);
  for(const pi of r.pairIds){
   await p.locator(`[data-pair="${pi}"]`).click();
   await p.locator('.dg-teacher > summary').click();
   assert((await p.locator('.dg-teacher').innerText()).includes(pairs[pi].answer.split(' ').slice(-2).join(' ')));
  }
  await c.close();
  // Integrated hotel follows the same rule and keeps its own saved answers.
  const hotel='travel-english-unit8-hotel.html',hi=read(fs.readFileSync(hotel,'utf8'),'hotelIntegration');
  const hc=await browser.newContext(),hp=await hc.newPage();hp.on('pageerror',e=>report.errors.push(e.message));
  await hp.goto(pathToFileURL(path.resolve(hotel)).href);await hp.locator('[data-hi-mode="integrated"]').click();await hp.evaluate(()=>navigate(3));
  for(const [i,s]of hi.sayPrompts.entries()){
   await hp.locator(`nav [data-hi-say="${i}"]`).click();assert.equal(await hp.locator('.say-prompt').textContent(),s.prompt);
   assert.equal(await hp.locator('.say-reference').evaluate(e=>e.hidden),true);
  }
  const hs=hi.sayPrompts.at(-1);await hp.locator('.say-note > summary').click();await hp.locator(`[data-hi-field="${hs.id}"]`).fill('整合練習的原句');
  await hp.reload();await hp.locator('[data-hi-mode="integrated"]').click();await hp.evaluate(()=>navigate(3));await hp.locator(`nav [data-hi-say="${hi.sayPrompts.length-1}"]`).click();assert.equal(await hp.locator(`[data-hi-field="${hs.id}"]`).inputValue(),'整合練習的原句');await hc.close();
  for(const [file,width,theme]of [[shopping,1024,'light'],[shopping,390,'dark'],['travel-japanese-day0-directions.html',390,'light'],[hotel,390,'dark']]){
   const vc=await browser.newContext({viewport:{width,height:844}}),vp=await vc.newPage();
   await vp.addInitScript(theme=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size','large');},theme);
   vp.on('pageerror',e=>report.errors.push(e.message));await vp.goto(pathToFileURL(path.resolve(file)).href);await choose(vp,0);
   for(const level of [0,1,2]){
    await vp.locator(`[data-say-support="${level}"]`).focus();await vp.keyboard.press('Enter');
    await vp.locator(`[data-say-support="${level}"]`).hover();await bounds(vp);
    const name=`hint-${path.basename(file,'.html')}-${width}-${theme}-${level}.png`;
    await vp.locator('.say-card').screenshot({path:path.join(out,name)});report.screenshots.push(name);
   }
   await bounds(vp);await shot(vp,`${path.basename(file,'.html')}-${width}-${theme}`);
   if(await vp.locator('#dg-menu-open').count()){
    await vp.locator('#dg-menu-open').click();await vp.locator('#nav [data-page="3"]').hover();await vp.locator('#nav [data-page="3"]').focus();
    await bounds(vp);await shot(vp,`menu-${width}-${theme}-${path.basename(file,'.html')}`);
   }
   await vc.close();
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('PASS '+JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
