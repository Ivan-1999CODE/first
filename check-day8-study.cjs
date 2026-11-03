// Day 8 part 02: match ordinary lessons, retain every exchange and its speaker order.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const curriculum=require('./assets/micro-curriculum.cjs').make(8),hotel=require('./assets/day8-integration-data.cjs')(curriculum);
const out=path.resolve('tmp/day8-study');fs.mkdirSync(out,{recursive:true});
const url=file=>pathToFileURL(path.resolve(file)).href;
const report={exchanges:0,layouts:0,screenshots:[],errors:[]};
const style=el=>{const s=getComputedStyle(el);return Object.fromEntries(['backgroundColor','color','fontSize','fontWeight','lineHeight','padding','margin','borderRadius','display','gap','textAlign','boxShadow'].map(k=>[k,s[k]]));};
const topSelectors=['.d5-section-heading','.d5-section-number','.d5-section-heading h1','.study-navigation','.study-navigation button[aria-pressed=true]','.study-navigation button[aria-pressed=false]','.study-navigation strong','.dg-study-instruction'];
async function bounds(p,label){
 const result=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,bad:[...document.querySelectorAll('.hi-study-page *')].filter(e=>e.checkVisibility()&&!e.closest('[inert],[aria-hidden="true"]')).filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left< -1||r.right>innerWidth+1)}).map(e=>e.className).slice(0,5)}));
 assert(result.scroll<=result.width+1,label+JSON.stringify(result));assert.deepEqual(result.bad,[],label);report.layouts++;
}
async function shot(p,name){await p.screenshot({path:path.join(out,name+'.png')});report.screenshots.push(name+'.png');}
async function chooseExchange(p,prefix,index){
 const target=p.locator(`.workshop-picker [data-${prefix}-reply="${index}"]`);
 for(const parent of await target.locator('xpath=ancestor::details').all())if(!await parent.evaluate(e=>e.open))await parent.locator(':scope > summary').click();
 await target.click();
}
async function checkExchange(p,prefix,index,s){
 await chooseExchange(p,prefix,index);
 assert.equal(await p.locator('.dg-study-current').count(),1,'only the current speaker is shown');
 assert.equal(await p.locator('.dg-study-current').getAttribute('data-study-speaker'),s.askFirst?'self':'other');
 async function self(){
  assert.equal(await p.locator('[data-study-prompt=translation]').innerText(),s.answerZh);
  assert.equal(await p.locator('[data-guide-hint][data-level="0"]').getAttribute('aria-pressed'),'true');
  await p.locator('[data-guide-hint][data-level="2"]').click();
  assert.equal(await p.locator('.dg-hint-pane[aria-hidden=false] .dg-en').innerText(),s.answer);
 }
 async function other(){
  const text=p.locator('.hi-transcript');assert.equal(await text.evaluate(e=>e.open),false);
  assert(await p.locator('.dg-study-current [data-say]').count());
  assert.equal(await p.locator('.dg-study-current [data-say]').first().getAttribute('data-say'),s.line);
  await text.locator('summary').click();assert.equal(await text.locator('.en').innerText(),s.line);
 }
 if(s.askFirst){await self();await p.locator(`[data-${prefix}-study-role="other"]`).click();await other();}
 else{await other();await p.locator(`[data-${prefix}-study-role="self"]`).click();await self();}
 await p.locator(`[data-${prefix}-study-role="${s.askFirst?'self':'other'}"]`).click();
 if(s.askFirst)assert.equal(await p.locator('[data-guide-hint][data-level="0"]').getAttribute('aria-pressed'),'true');
 else assert.equal(await p.locator('.hi-transcript').evaluate(e=>e.open),false);
 report.exchanges++;
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const cfg of [{width:1280,theme:'light',size:'standard'},{width:1024,theme:'dark',size:'large'},{width:390,theme:'light',size:'large'},{width:320,theme:'dark',size:'large'}]){
   const ctx=await browser.newContext({viewport:{width:cfg.width,height:900}}),p=await ctx.newPage();p.setDefaultTimeout(7000);p.on('pageerror',e=>report.errors.push(e.message));
   await p.addInitScript(c=>{localStorage.setItem('travel-lab-theme',c.theme);localStorage.setItem('travel-lab-text-size',c.size)},cfg);
   await p.goto(url(require('./assets/micro-curriculum.cjs').make(6).file));await p.evaluate(()=>{setTaskRound(1);navigate(1)});
   const reference=await Promise.all(topSelectors.map(s=>p.locator(s).first().evaluate(style)));
   await p.goto(url(curriculum.file)+'#integrated');
   const keys=[curriculum.course.id,hotel.storageKey,...hotel.extended.groups.map(g=>g.storageKey)];
   const before=await p.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys);
   for(const group of [{id:'checkin',labels:['A','B','C']},...hotel.extended.groups.map(g=>({id:g.id,labels:g.sourceLabels}))]){
    const prefix=group.id==='checkin'?'hi':'hx',library=prefix==='hi'?'library':'say';
    await p.locator(`[data-hi-group="${group.id}"]`).click();await p.evaluate(()=>navigate(1));
    await p.locator(`.study-navigation [data-${prefix}-study="${library}"]`).click();
    assert.deepEqual(await p.locator('.study-navigation strong').allTextContents(),['我會說／我要聽得懂','同一段對話，再練一次']);
    for(const [i,s]of topSelectors.entries())assert.deepEqual(await p.locator(s).first().evaluate(style),reference[i],`${cfg.width}/${group.id}: same ordinary-lesson style ${s}`);
    const scopes=[['arrival',['A','B']],['information',['C']],['supplies',['D']],['dining',['E']],['repair',['F']]].filter(([,labels])=>labels.every(label=>group.labels.includes(label)));
    assert.equal(await p.locator('[data-hotel-study-group]').count(),scopes.length,'Group by speaking purpose');
    await bounds(p,group.id+' library');await shot(p,`${group.id}-${cfg.width}-${cfg.theme}-library`);
    for(const [label,sources] of [...scopes,['all',group.labels]]){
     await p.locator(label==='all'?'[data-hotel-study-all]':`[data-hotel-study-group="${label}"]`).click();
     const main=prefix==='hi'?hotel.steps.filter(s=>sources.includes(s.sourceLabel)):curriculum.rounds.filter(r=>sources.includes(r.displayLabel)).flatMap(r=>r.flowIds.flatMap(id=>curriculum.flows[id].steps));
     const extra=prefix==='hi'?hotel.scenarios.slice(1).map(c=>c.steps.find(s=>s.key===c.key)).filter(s=>sources.includes(s.sourceLabel)):hotel.extended.bank.filter(s=>sources.includes(s.source)&&!main.some(t=>t.answer===s.answer&&t.line===s.line));
     const steps=[...main,...extra];
     await p.locator(`.study-navigation [data-${prefix}-study="reply"]`).focus();await p.keyboard.press('Enter');
     assert.equal(await p.locator(`.study-navigation [data-${prefix}-study="reply"]`).getAttribute('aria-pressed'),'true');
     for(let i=0;i<(cfg.width===1280?steps.length:1);i++)await checkExchange(p,prefix,i,steps[i]);
     await chooseExchange(p,prefix,main.length-1);
     assert.equal(await p.locator('.dg-dialogue-nav [data-hi-page="2"]').count(),1,'last main exchange reaches Part 03');
     await chooseExchange(p,prefix,0);await bounds(p,group.id+'/'+label+' dialogue');
     if(label===scopes[0][0]){
      const secondRole=steps[0].askFirst?'other':'self';await p.locator(`[data-${prefix}-study-role="${secondRole}"]`).click();
      if(secondRole==='self'){await p.locator('[data-guide-hint][data-level="2"]').click();await p.locator('[data-guide-hint][data-level="1"]').hover();await p.locator('[data-guide-hint][data-level="2"]').focus();}
      else {await p.locator('.hi-transcript > summary').click();await p.locator('.hi-transcript > summary').focus();}
      await bounds(p,'expanded '+group.id);await p.locator('.dg-study-dialogue').scrollIntoViewIfNeeded();await shot(p,`${group.id}-${cfg.width}-${cfg.theme}-dialogue`);
     }
     await p.locator(`.study-navigation [data-${prefix}-study="${library}"]`).click();
     assert.equal(await p.locator('.study-vocabulary').evaluate(e=>e.open),false);
     assert.equal(await p.locator('.study-library .study-inline-changes[open]').count(),0);
    }
   }
   assert.deepEqual(await p.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys),before,'part 02 never modifies saved answers or progress');
   await ctx.close();
  }
  assert.deepEqual(report.errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('PASS '+JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
