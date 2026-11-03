const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const curriculum=require('./assets/micro-curriculum.cjs').make(8),d=require('./assets/day8-integration-data.cjs')(curriculum);
const html=fs.readFileSync('travel-english-unit8-hotel.html','utf8'),out=path.resolve('tmp/day8-complete');fs.mkdirSync(out,{recursive:true});
const read=(h,key)=>JSON.parse(h.match(new RegExp('(?:^|[>\\n])const '+key+'=(.*);(?:\\r?\\n|<)'))[1]);
assert.deepEqual(read(html,'hotelIntegration'),JSON.parse(JSON.stringify(d)));assert.deepEqual(read(html,'rounds'),curriculum.rounds);
for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
const baseline='tmp/day8-complete-before/travel-english-unit8-hotel.html';
if(fs.existsSync(baseline))for(const m of fs.readFileSync(baseline,'utf8').matchAll(/(?:^|[>\n])const (\w+)=(.*);(?:\r?\n|<)/g)){if(m[1]==='hotelIntegration')continue;let value;try{value=JSON.parse(m[2]);}catch{continue;}assert.deepEqual(read(html,m[1]),value,'original data '+m[1]);}
assert.deepEqual(d.extended.groups.map(g=>g.title),['處理住宿需求','全章住宿挑戰']);
assert.equal(new Set([d.storageKey,...d.extended.groups.map(g=>g.storageKey)]).size,3);
const taught=new Set(d.extended.bank.map(s=>s.answer));
for(const g of d.extended.groups){
 assert.equal(g.sections.length,7);assert.equal(g.questions.length,6);assert(g.missions.length>=3);
 const steps=[...g.flows.flatMap(f=>f.steps),...g.questions.flatMap(q=>q.steps),...g.missions.flatMap(m=>m.steps),...g.homework.speakSteps,...g.homework.listen,...g.checkpointSteps];
 for(const s of steps){assert(taught.has(s.answer),s.answer+' was taught');if(s.decisions)for(const decision of s.decisions)assert(taught.has(decision.answer));}
 assert.deepEqual([...new Set(g.flows.flatMap(f=>f.steps.map(s=>s.source)))].sort(),[...g.sourceLabels].sort(),'flow coverage '+g.id);
 const core=curriculum.rounds.filter(r=>g.sourceLabels.includes(r.displayLabel||r.id)).flatMap(r=>curriculum.flows[r.flowIds[0]].steps.map(s=>s.answer));
 for(const answer of core)assert(steps.some(s=>s.answer===answer),'core speaking coverage: '+g.id+' '+answer);
 for(const f of g.flows){assert.equal(new Set(f.steps.map(s=>s.id)).size,f.steps.length);for(const s of f.steps)if(!s.decisions){assert(s.options.length>1);assert(s.valid.every(i=>s.options[i]));}}
 for(const m of g.missions){assert.equal(new Set(m.goals.map(x=>x.id)).size,m.goals.length);assert(m.goals.every(x=>m.steps.some(s=>s.id===x.stepId)));}
}
const report={groups:3,newQuestions:12,flowPaths:0,missionModes:0,layouts:0,errors:[],screenshots:[]};
const url=pathToFileURL(path.resolve('travel-english-unit8-hotel.html')).href;
async function part(p,n){await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-hi-page="${n}"]`).click();assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),String(n+1));}
const selectGroup=(p,id)=>p.locator(`[data-hi-group="${id}"]`).click();
async function fill(p,key,value){const field=p.locator(`[data-hx-field="${key}"]`);for(const parent of await field.locator('xpath=ancestor::details').all())if(!await parent.evaluate(e=>e.open))await parent.locator(':scope > summary').click();await field.fill(value);}
const stored=(p,g)=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),g.storageKey);
async function bounds(p,label){const x=await p.evaluate(()=>{
 const visible=e=>{if(!e.getClientRects().length||getComputedStyle(e).visibility==='hidden')return false;let n=e;while(n.parentElement){if(n.parentElement.tagName==='DETAILS'&&!n.parentElement.open&&n.tagName!=='SUMMARY')return false;n=n.parentElement;}return true;};
 return {width:innerWidth,scroll:document.documentElement.scrollWidth,bad:[...document.querySelectorAll('.hi-group-switch *,#main *,#dg-course-dialog[open] *')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left< -1||r.right>innerWidth+1);}).slice(0,5).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,50)}))};
});assert(x.scroll<=x.width+1,label+JSON.stringify(x));assert.deepEqual(x.bad,[],label);
 const broken=await p.locator('.hx-content .dg-hint-pane[aria-hidden="false"] .dg-en').evaluateAll(nodes=>nodes.flatMap(el=>{if(!el.getClientRects().length)return [];const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),bad=[];for(let t;t=walker.nextNode();){for(const m of t.textContent.matchAll(/[A-Za-z]+(?:[’'][A-Za-z]+)?/g)){const range=document.createRange();range.setStart(t,m.index);range.setEnd(t,m.index+m[0].length);if(new Set([...range.getClientRects()].map(r=>Math.round(r.top))).size>1)bad.push(m[0]);}}return bad;}));assert.deepEqual(broken,[],label+' readable English words');report.layouts++;}
async function shot(p,name){await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:path.join(out,name+'.png'),fullPage:!name.startsWith('menu')});report.screenshots.push(name+'.png');}
async function stepThrough(p,s,decision,resetGate=false){
 assert.equal(await p.locator('[data-hx-next]').isDisabled(),true);
 const first=s.askFirst?'spoken':'heard',second=s.askFirst?'heard':'spoken';
 assert.equal(await p.locator(`[data-hx-gate="${second}"]`).isDisabled(),true);
 await p.locator(`[data-hx-gate="${first}"]`).check();
 if(s.decisions){
  if(s.allowed.length===1){await p.locator('[data-hx-decision="0"]').click();await p.locator('[data-hx-gate="spoken"]').check();assert.equal(await p.locator('[data-hx-next]').isDisabled(),true);}
  await p.locator(`[data-hx-decision="${decision}"]`).click();assert.equal(await p.locator('[data-hx-gate="spoken"]').isChecked(),false);
  await p.locator('[data-hx-gate="spoken"]').check();assert.equal(await p.locator('[data-hx-next]').isDisabled(),false);
  const text=await p.locator('.hi-say').innerText();assert(!text.includes(decision===1?'已訂三明治':'已婉拒'));
 }else{
  await p.locator(`[data-hx-gate="${second}"]`).check();const wrong=s.options.findIndex((_,i)=>!s.valid.includes(i));await p.locator(`[data-hx-choice="${wrong}"]`).click();assert.equal(await p.locator('[data-hx-next]').isDisabled(),true);
  await p.locator(`[data-hx-choice="${s.valid[0]}"]`).click();assert.equal(await p.locator('[data-hx-next]').isDisabled(),false);
  if(resetGate){await p.locator(`[data-hx-gate="${first}"]`).uncheck();assert.equal(await p.locator(`[data-hx-gate="${second}"]`).isChecked(),false);assert.equal(await p.locator('[data-hx-next]').isDisabled(),true);await p.locator(`[data-hx-gate="${first}"]`).check();await p.locator(`[data-hx-gate="${second}"]`).check();await p.locator(`[data-hx-choice="${s.valid[0]}"]`).click();}
 }
 await p.locator('[data-hx-next]').click();
 const top=await p.locator('.hx-stage,.hx-content .hi-complete').evaluate(e=>e.getBoundingClientRect().top);assert(top>=0&&top<400,'next turn is brought into view');
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:1280,height:900}}),p=await ctx.newPage();p.setDefaultTimeout(7000);p.on('pageerror',e=>report.errors.push(e.message));await p.goto(url+'#integrated');
  assert.equal(await p.locator('[data-hi-group]').count(),3);assert((await p.locator('[data-hi-mode="integrated"]').innerText()).includes('A～F'));
  const sentinels={[d.storageKey]:JSON.stringify({answers:{before:'原本入住筆記'},home:{spoken:true}}),[curriculum.course.id]:JSON.stringify({answers:{before:'原本個別任務'}})};
  await p.evaluate(values=>{for(const [k,v] of Object.entries(values))localStorage.setItem(k,v)},sentinels);await p.reload();
  for(const g of d.extended.groups){
   await selectGroup(p,g.id);assert.equal(await p.locator('.hx-content').getAttribute('data-hx-group'),g.id);assert.equal(await p.locator('#nav [data-hi-page]').count(),7);
   const beforeText=await p.locator('.hx-checkpoint').innerText();await fill(p,'before',g.id+' 原句 <img src=x onerror=alert(1)>');
   await part(p,1);
   for(const source of g.sourceLabels){await p.locator(`[data-hx-source="${source}"]`).click();assert((await p.locator('.hi-language').count())>0);await p.locator('[data-hx-study="reply"]').click();const count=d.extended.bank.filter(s=>s.source===source&&!s.askFirst).length;if(count){for(let i=0;i<count;i++){if(i)await p.locator(`[data-hx-reply="${i}"]`).click();assert.equal(await p.locator('.hi-transcript').getAttribute('open'),null);}}await p.locator('[data-hx-study="say"]').click();}
   await part(p,2);
   for(const f of g.flows){
    const flexible=f.steps.find(s=>s.decisions&&s.allowed.length===2),decisions=flexible?[0,1]:[1];
    for(const choice of decisions){await p.locator(`[data-hx-flow="${f.id}"]`).click();for(let i=0;i<f.steps.length;i++)await stepThrough(p,f.steps[i],choice,i===0);assert.equal(await p.locator('.hi-complete').count(),1);assert((await stored(p,g)).complete.includes(f.id));if(flexible)assert((await p.locator('.hx-journal').innerText()).includes(choice===0?'已訂三明治':'沒有送出餐點訂單'));report.flowPaths++;}
   }
   await p.locator(`[data-hx-flow="${g.flows[0].id}"]`).click();await stepThrough(p,g.flows[0].steps[0],0);await p.locator('[data-hx-back]').click();assert.equal(await p.locator('.hx-journal li').count(),0);assert.equal(await p.locator('[data-hx-next]').isDisabled(),true);
   await part(p,3);
   for(const q of g.questions){await p.locator(`[data-hx-question="${q.id}"]`).click();assert.equal(await p.locator('.hx-rubric').getAttribute('open'),null);await fill(p,'question-'+q.id,g.id+' / '+q.id);}
   await p.locator(`[data-hx-question="${g.questions[0].id}"]`).click();assert.equal(await p.locator(`[data-hx-field="question-${g.questions[0].id}"]`).inputValue(),g.id+' / '+g.questions[0].id);
   await part(p,4);
   for(const m of g.missions){await p.locator(`[data-hx-mission="${m.id}"]`).click();for(const mode of ['guided','independent']){await p.locator(`[data-hx-mode="${mode}"]`).click();assert.equal(await p.locator('[data-hx-goal]').count(),m.goals.length);assert.equal(await p.locator(`[data-hx-goal="${m.goals[0].id}"]`).isChecked(),false);await p.locator(`[data-hx-goal="${m.goals[0].id}"]`).check();await fill(p,'mission-'+m.id+'-'+mode,g.id+' '+m.id+' '+mode);assert.equal(await p.locator('.hi-goal-hint').count(),mode==='guided'?m.goals.length:0);report.missionModes++;}}
   await part(p,5);assert.equal(await p.locator('.hx-checkpoint').innerText(),beforeText);assert.equal(await p.locator('#main img[src=x]').count(),0);await fill(p,'after',g.id+' 課後版本');for(const level of [1,2,3,1]){await p.locator(`[data-hx-rating="${g.skills[0].id}:${level}"]`).click();assert.equal(await p.locator('.hi-rating').first().getAttribute('data-level'),String(level));}
   await part(p,6);for(let j=0;j<g.homework.listen.length;j++){const s=g.homework.listen[j],wrong=s.options.findIndex((_,i)=>!s.valid.includes(i));await p.locator(`[data-hx-quiz="${j}:${wrong}"]`).click();assert((await p.locator('.hi-quiz').nth(j).innerText()).includes('再聽'));await p.locator(`[data-hx-quiz="${j}:${s.valid[0]}"]`).click();}
   await fill(p,'home',g.id+' 課後筆記');await p.locator('[data-hx-home="spoken"]').check();await p.locator('[data-hx-home="listen"]').check();
   const saved=await stored(p,g);await p.reload();assert.equal(await p.locator('.hx-content').getAttribute('data-hx-group'),g.id);assert.deepEqual(await stored(p,g),saved);
  }
  for(const [k,v] of Object.entries(sentinels))assert.equal(await p.evaluate(key=>localStorage.getItem(key),k),v,'original storage unchanged');
  const stay=d.extended.groups[0],chapter=d.extended.groups[1];assert.equal((await stored(p,stay)).answers.home,'stay 課後筆記');assert.equal((await stored(p,chapter)).answers.home,'chapter 課後筆記');
  await p.locator('[data-hi-task="3"]').click();assert.equal(await p.locator('.hx-content').count(),0);assert.equal(await p.locator('.hi-group-switch').isVisible(),false);await p.locator('[data-hi-mode="integrated"]').click();assert.equal(await p.locator('.hx-content').count(),1);
  await ctx.close();
  for(const cfg of [{width:1280,theme:'light',size:'standard'},{width:1280,theme:'dark',size:'large'},{width:390,theme:'light',size:'large'},{width:320,theme:'dark',size:'large'}]){
   const c=await browser.newContext({viewport:{width:cfg.width,height:900}}),p=await c.newPage();p.setDefaultTimeout(7000);p.on('pageerror',e=>report.errors.push(e.message));await p.addInitScript(v=>{localStorage.setItem('travel-lab-theme',v.theme);localStorage.setItem('travel-lab-text-size',v.size)},cfg);await p.goto(url+'#integrated-stay');
   for(const g of d.extended.groups){await selectGroup(p,g.id);for(let n=0;n<7;n++){if(n)await part(p,n);await bounds(p,g.id+'/'+n+'/'+cfg.width);if(n===0)await shot(p,`home-${g.id}-${cfg.width}-${cfg.theme}`);if(n===2){await p.locator('.hi-transcript > summary').click();await p.locator('[data-guide-hint][data-level="2"]').first().click();await bounds(p,'flow-expanded');if(g.id==='stay')await shot(p,`flow-${cfg.width}-${cfg.theme}`);}if(n===3){await p.locator('.hx-rubric > summary').click();await p.locator('.hi-say > details > summary').first().click();await p.locator('.hx-one-hint > summary').first().click();await p.locator('[data-guide-hint][data-level="2"]').first().click();await bounds(p,'question-expanded');await shot(p,`question-${g.id}-${cfg.width}-${cfg.theme}`);}if(n===4){await p.locator('.hi-teacher > summary').click();await p.locator('[data-hx-goal]').first().check();await bounds(p,'teacher-expanded');if(g.id==='stay')await shot(p,`teacher-${cfg.width}-${cfg.theme}`);}if(n===5){await p.locator(`[data-hx-rating="${g.skills[0].id}:3"]`).click();await bounds(p,'ratings');}}
    await p.locator('#dg-menu-open').click();await p.locator('#nav [data-hi-page="4"]').hover();await p.locator('#nav [data-hi-page="3"]').focus();await bounds(p,'menu');await shot(p,`menu-${g.id}-${cfg.width}-${cfg.theme}`);await p.keyboard.press('Escape');}
   await c.close();
  }
  for(const value of ['{bad',JSON.stringify({answers:{before:'保留'},goals:[],ratings:{supply:99},complete:'bad',home:{spoken:1}}),'blocked']){
   const c=await browser.newContext(),p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.addInitScript(({key,value})=>{if(value==='blocked'){const get=Storage.prototype.getItem,set=Storage.prototype.setItem;Storage.prototype.getItem=function(k){if(k===key)throw Error('blocked');return get.call(this,k)};Storage.prototype.setItem=function(k,v){if(k===key)throw Error('blocked');return set.call(this,k,v)}}else localStorage.setItem(key,value)},{key:stay.storageKey,value});await p.goto(url+'#integrated-stay');await fill(p,'before','仍可練習');if(value==='blocked')assert.equal(await p.locator('#hx-save-notice').isVisible(),true);await part(p,5);assert((await p.locator('.readonly').innerText()).includes('仍可練習'));await c.close();
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('PASS '+JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
