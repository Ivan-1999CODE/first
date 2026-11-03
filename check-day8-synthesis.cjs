const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const curriculum=require('./assets/micro-curriculum.cjs').make(8);
const d=require('./assets/day8-integration-data.cjs')(curriculum);
const html=fs.readFileSync('travel-english-unit8-hotel.html','utf8');
const baselinePath=fs.existsSync('tmp/day8-complete-before/travel-english-unit8-hotel.html')?'tmp/day8-complete-before/travel-english-unit8-hotel.html':'tmp/day8-synthesis-before/travel-english-unit8-hotel.html';
const out=path.resolve('tmp/day8-synthesis');fs.mkdirSync(out,{recursive:true});
for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
const dataFrom=(source,key)=>JSON.parse(source.match(new RegExp('(?:^|[>\\n])const '+key+'=(.*);(?:\\r?\\n|<)'))[1]);
assert.deepEqual(dataFrom(html,'hotelIntegration'),JSON.parse(JSON.stringify(d)));
assert.deepEqual(dataFrom(html,'rounds'),curriculum.rounds);
if(fs.existsSync(baselinePath)){
 const baseline=fs.readFileSync(baselinePath,'utf8');let checked=0;
 for(const m of baseline.matchAll(/(?:^|[>\n])const (\w+)=(.*);(?:\r?\n|<)/g)){
  if(m[1]==='hotelIntegration')continue;
  let value;try{value=JSON.parse(m[2]);}catch{continue;}
  assert.deepEqual(dataFrom(html,m[1]),value,'existing lesson data: '+m[1]);checked++;
 }
 assert(checked>=8,'baseline checks cover original data');
}
assert.equal(d.practice.challenges.length,8);assert.equal(d.practice.conversations.length,4);assert.equal(d.practice.flowRoutes.length,3);
const taught=new Set(d.scenarios.flatMap(c=>c.steps.map(s=>s.answer)));
for(const c of [...d.practice.challenges,...d.practice.conversations]){
 const ss=c.scenario.steps;
 assert(ss.find(s=>s.key==='name').answer.includes(c.scenario.name));
 assert.equal(ss.find(s=>s.key==='nights').answer.includes('three'),c.scenario.nights===3);
 assert.equal(ss.find(s=>s.key==='checkout').line.includes('twelve'),c.scenario.checkout===12);
 assert.equal(ss.find(s=>s.key==='elevator').line.includes('right'),c.scenario.elevator==='右');
 assert(ss.every(s=>taught.has(s.answer)),'student language is already taught');
}
for(const c of d.practice.challenges){assert(c.turns.every(s=>c.choices.includes(s.key)));assert.equal(new Set(c.turns.map(s=>s.key)).size,c.turns.length);}
for(const r of d.practice.flowRoutes)assert.deepEqual([...r.order].sort(),d.steps.map(s=>s.key).sort());
const url=pathToFileURL(path.resolve('travel-english-unit8-hotel.html')).href+'#integrated';
const report={challengePaths:0,liveTasks:0,flowRoutes:0,layouts:0,screenshots:[],errors:[]};
const part=async(p,n)=>{await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-hi-page="${n}"]`).click();};
async function field(p,key,value){const t=p.locator(`[data-hi-field="${key}"]`);for(const el of await t.locator('xpath=ancestor::details').all()){if(!await el.evaluate(e=>e.open))await el.locator(':scope > summary').click();}await t.fill(value);}
const records=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),d.storageKey);
async function completeTurn(p,s,checkReset=false){
 await p.locator(`[data-hi-intent="${s.key}"]`).click();
 assert.equal(await p.locator('[data-hi-challenge-next]').isDisabled(),true);
 assert.equal(await p.locator('[data-hi-challenge-choice="0"]').isDisabled(),true);
 const first=s.askFirst?'spoken':'heard',second=s.askFirst?'heard':'spoken';
 assert.equal(await p.locator(`[data-hi-challenge-gate="${second}"]`).isDisabled(),true);
 await p.locator(`[data-hi-challenge-gate="${first}"]`).check();await p.locator(`[data-hi-challenge-gate="${second}"]`).check();
 const wrong=s.objects.findIndex((_,i)=>!s.valid.includes(i));
 await p.locator(`[data-hi-challenge-choice="${wrong}"]`).click();assert.equal(await p.locator('[data-hi-challenge-next]').isDisabled(),true);
 await p.locator(`[data-hi-challenge-choice="${s.valid[0]}"]`).click();assert.equal(await p.locator('[data-hi-challenge-next]').isDisabled(),false);
 if(checkReset){
  await p.locator(`[data-hi-challenge-gate="${first}"]`).uncheck();assert.equal(await p.locator('[data-hi-challenge-next]').isDisabled(),true);assert.equal(await p.locator(`[data-hi-challenge-gate="${second}"]`).isChecked(),false);
  await p.locator(`[data-hi-challenge-gate="${first}"]`).check();await p.locator(`[data-hi-challenge-gate="${second}"]`).check();await p.locator(`[data-hi-challenge-choice="${s.valid[0]}"]`).click();
 }
 await p.locator('[data-hi-challenge-next]').click();
}
async function bounds(p,label){
 const b=await p.evaluate(()=>{
  const bad=[...document.querySelectorAll('#main *,#hi-mode-bar *,#dg-course-dialog[open] *')].filter(e=>{
   if(!e.getClientRects().length||getComputedStyle(e).visibility==='hidden')return false;
   let n=e;while(n.parentElement){if(n.parentElement.tagName==='DETAILS'&&!n.parentElement.open&&n.tagName!=='SUMMARY')return false;n=n.parentElement;}
   const r=e.getBoundingClientRect();return r.width>0&&(r.left< -1||r.right>innerWidth+1);
  }).slice(0,5).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,50)}));
  return {width:innerWidth,scroll:document.documentElement.scrollWidth,bad};
 });
 assert(b.scroll<=b.width+1,label+JSON.stringify(b));assert.deepEqual(b.bad,[],label);report.layouts++;
}
async function shot(p,name){await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:path.join(out,name+'.png'),fullPage:true});report.screenshots.push(name+'.png');}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:1280,height:900}}),p=await ctx.newPage();p.setDefaultTimeout(7000);p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(url);
  const old={answers:{before:'最早的入住回答',home:'舊的課後筆記',[d.sayPrompts[0].id]:'原單句紀錄'},checks:{'original-guided':[true,false,false,false,false,false,false]},ratings:{start:2},complete:['original'],home:{spoken:true}};
  const original='原任務紀錄保持原樣';
  await p.evaluate(({key,old,originalKey,original})=>{localStorage.setItem(key,JSON.stringify(old));localStorage.setItem(originalKey,original);},{key:d.storageKey,old,originalKey:curriculum.course.id,original});await p.reload();
  await part(p,3);
  for(const c of d.practice.challenges){
   const orders=c.turns.length>1?[c.turns,[...c.turns].reverse()]:[c.turns];
   for(const order of orders){
    await p.locator(`[data-hi-challenge="${c.id}"]`).click();
    const wrong=c.choices.find(key=>!c.turns.some(t=>t.key===key));await p.locator(`[data-hi-intent="${wrong}"]`).click();assert((await p.locator('.hi-intent-feedback').innerText()).includes('資訊缺口'));assert.equal(await p.locator('[data-hi-challenge-next]').count(),0);
    for(const s of order)await completeTurn(p,s,c.id==='find-lift');
    assert.equal(await p.locator('.hi-complete').count(),1);assert((await records(p)).suite.done.includes(c.id));
    await field(p,'challenge-'+c.id,'筆記 '+c.id+' <img src=x onerror=alert(1)>');report.challengePaths++;
   }
  }
  await p.locator('[data-hi-challenge="find-lift"]').click();assert.equal(await p.locator('[data-hi-field="challenge-find-lift"]').inputValue(),'筆記 find-lift <img src=x onerror=alert(1)>');assert.equal(await p.locator('#main img[src=x]').count(),0);
  await part(p,4);
  for(const m of d.practice.conversations){
   await p.locator(`[data-hi-live="${m.id}"]`).click();await p.locator('[data-hi-practice="guided"]').click();
   await p.locator('[data-hi-live-goal="name"]').check();await field(p,'live-'+m.id+'-guided','真人筆記 '+m.id);
   await p.locator('.hi-teacher > summary').click();assert((await p.locator('[data-hi-teacher-key="name"]').innerText()).includes('已確認'));
   await p.locator('[data-hi-live-goal="name"]').uncheck();assert.equal(await p.locator('.hi-teacher').getAttribute('open'),'');
   await p.locator('[data-hi-live-goal="checkout"]').check();assert((await p.locator('[data-hi-teacher-key="checkout"]').innerText()).includes('已確認'));
   await p.locator('[data-hi-practice="independent"]').click();assert.equal(await p.locator('[data-hi-live-goal="checkout"]').isChecked(),false);assert.equal(await p.locator('.hi-goal-hint').count(),0);
   await p.locator('[data-hi-live-goal="nights"]').check();report.liveTasks++;
  }
  await part(p,2);
  for(const r of d.practice.flowRoutes.filter(r=>r.id!=='standard')){
   await p.locator('.hi-route-picker > summary').click();await p.locator(`[data-hi-route="${r.id}"]`).click();
   const seen=new Set();
   for(const key of r.order){
    const s=d.steps.find(s=>s.key===key);const first=s.askFirst?'spoken':'heard',second=s.askFirst?'heard':'spoken';
    await p.locator(`[data-hi-gate="${first}"]`).check();await p.locator(`[data-hi-gate="${second}"]`).check();await p.locator(`[data-hi-choice="${s.valid[0]}"]`).click();seen.add(key);
    assert.equal((await p.locator('.hi-room-key').innerText()).includes('305'),['name','passport','nights'].every(k=>seen.has(k)),'room key waits for all booking information');
    await p.locator('[data-hi-flow-next]').click();
   }
   assert((await records(p)).suite.routes.includes(r.id+':original'));report.flowRoutes++;
  }
  await part(p,6);assert((await p.locator('#main').innerText()).includes('舊的課後筆記')===false,'legacy note initially collapsed');
  await field(p,'home-transfer-v2','新的訂房資料練習');await p.locator('[data-hi-home-transfer]').check();
  const stored=await records(p);assert.equal(stored.answers.before,old.answers.before);assert.equal(stored.answers.home,old.answers.home);assert.equal(stored.answers[d.sayPrompts[0].id],'原單句紀錄');assert.equal(stored.checks['original-guided'][0],true);assert.equal(stored.home.spoken,true);assert.equal(stored.suite.homeSpoken,true);
  assert.equal(await p.evaluate(key=>localStorage.getItem(key),curriculum.course.id),original);
  await p.reload();assert.deepEqual(await records(p),stored);await part(p,4);await p.locator('[data-hi-live="clear-up"]').click();await p.locator('[data-hi-practice="independent"]').click();assert.equal(await p.locator('[data-hi-live-goal="nights"]').isChecked(),true);
  await ctx.close();
  for(const config of [{width:1280,theme:'light',size:'standard'},{width:1280,theme:'dark',size:'standard'},{width:390,theme:'light',size:'large'},{width:390,theme:'dark',size:'large'}]){
   const ctx=await browser.newContext({viewport:{width:config.width,height:900}}),p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));
   await p.addInitScript(c=>{localStorage.setItem('travel-lab-theme',c.theme);localStorage.setItem('travel-lab-text-size',c.size);},config);await p.goto(url);await bounds(p,'home');
   await part(p,3);await p.locator('[data-hi-challenge="two-questions"]').click();await p.locator('[data-hi-intent="elevator"]').click();await p.locator('[data-guide-hint][data-level="2"]').first().click();await p.locator('.hi-transcript > summary').click();
   await p.locator('[data-hi-intent="checkout"]').hover();await p.locator('[data-hi-intent="breakfast"]').focus();await bounds(p,'challenge '+config.width+config.theme);await shot(p,`challenge-${config.width}-${config.theme}`);
   await part(p,4);await p.locator('[data-hi-live="clear-up"]').click();await p.locator('.hi-teacher > summary').click();await p.locator('[data-hi-live-goal="name"]').check();await p.locator('[data-hi-alternate]').check();await bounds(p,'teacher '+config.width+config.theme);await shot(p,`teacher-${config.width}-${config.theme}`);
   await part(p,2);await p.locator('.hi-route-picker > summary').click();await p.locator('[data-hi-route="passport-first"]').hover();await p.locator('[data-hi-route="nights-first"]').focus();await bounds(p,'route '+config.width+config.theme);await shot(p,`route-${config.width}-${config.theme}`);
   await part(p,6);await bounds(p,'homework '+config.width+config.theme);
   await p.locator('#dg-menu-open').click();await p.locator('#nav [data-hi-page="3"]').focus();await shot(p,`menu-${config.width}-${config.theme}`);await ctx.close();
  }
  // Old or malformed nested records must not enable tasks or erase original notes.
  const ctx2=await browser.newContext(),p2=await ctx2.newPage();p2.on('pageerror',e=>report.errors.push(e.message));await p2.addInitScript(key=>localStorage.setItem(key,JSON.stringify({answers:{before:'保留'},suite:{done:'bad',routes:42,goals:{'whole-stay-guided':{name:'yes'}},homeSpoken:1}})),d.storageKey);await p2.goto(url);await part(p2,4);assert.equal(await p2.locator('[data-hi-live-goal="name"]').isChecked(),false);await p2.locator('[data-hi-live-goal="passport"]').check();assert.equal((await records(p2)).answers.before,'保留');await ctx2.close();
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('PASS '+JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
