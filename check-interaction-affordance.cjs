const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {pathToFileURL}=require('url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/interaction-affordance');fs.mkdirSync(out,{recursive:true});
const cases=[{day:11,flow:1,step:0,name:'companion'},{day:1,flow:0,step:0,name:'route'},{day:3,flow:0,step:2,name:'seat'},{day:3,flow:2,step:0,name:'gate'},{day:4,flow:4,step:0,name:'rail'},{day:2,flow:0,step:2,name:'quantity'},{day:6,kind:'drink',name:'drink'}];
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[],report=[];
 try{
  for(const c of cases)for(const theme of ['light','dark']){
   const d=c.day===1?require('./assets/day1-focus-data.cjs'):require('./assets/micro-curriculum.cjs').make(c.day);
   const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));
   await p.goto(pathToFileURL(path.resolve(d.file||(c.day===1?'travel-english.html':'travel-english-unit2-shopping.html'))).href);
   if(c.day===1){
    await p.evaluate(()=>start(0));
    assert((await p.locator('.vf-pick-heading').innerText()).includes('先聽完對方說話'),'Listening-only opening explains its own gate');
    await p.locator('[data-dg-prelude-heard]').check();
    const target=await p.evaluate(()=>flows[0].prelude.correct);await p.locator(`[data-dg-prelude-choice="${target}"]`).click();
    assert(await p.locator('[data-dg-prelude-next]').isEnabled(),'Opening picture remains operable');
   }
   await p.evaluate(({c,theme})=>{
    document.documentElement.dataset.theme=theme;document.documentElement.dataset.size='large';
    const fi=c.kind?flows.findIndex(f=>f.steps.some(s=>vfKind(s)===c.kind)):c.flow;
    start(fi);if(typeof dgPrelude!=='undefined'){dgPrelude.done=true;render();}
    const n=c.kind?flows[fi].steps.findIndex(s=>vfKind(s)===c.kind):c.step;
    while(turn<n){heard=spoken=true;choose(currentStep().valid[0]);next();}
   },{c,theme});
   const panel=p.locator(c.name==='companion'?'.vf-task-scene':'.vf-interaction'),prefix=c.name+'-'+theme;
   const shot=async state=>{await p.mouse.move(0,0);await panel.screenshot({path:path.join(out,`${prefix}-${state}.png`)});};
   assert.equal(await p.locator('.vf-pick-area').getAttribute('data-ready'),'false');
   assert(await p.locator('.vf-pick-area').innerText().then(s=>s.includes('先完成聽與說')));
   assert(await p.locator('.vf-pick').evaluateAll(bs=>bs.every(b=>b.disabled&&b.dataset.pickState==='locked')));
   if(c.name==='companion')await shot('locked');
   for(const id of await p.evaluate(()=>currentStep().askFirst?['spoken','heard']:['heard','spoken']))await p.locator('#'+id).check();
   assert.equal(await p.locator('.vf-pick-area').getAttribute('data-ready'),'true');
   assert(await p.locator('.vf-pick').evaluateAll(bs=>bs.every(b=>!b.disabled&&b.querySelector('.vf-choice-action').textContent.includes('點選'))));
   assert.equal(await p.locator('.vf-task-stage button').count(),0,'Information area never contains choice buttons');
   await shot('ready');
   if(c.name==='quantity'){
    for(let i=0;i<3;i++)await p.locator('[data-vf-delta="1"]').click();
   }else{
    const indices=await p.evaluate(()=>({valid:currentStep().valid[0],wrong:currentStep().objects.findIndex((_,i)=>!currentStep().valid.includes(i))}));
    const choice=p.locator(`[data-choice="${indices.valid}"]`),base=await choice.evaluate(e=>getComputedStyle(e).backgroundColor);
    await choice.hover();assert.notEqual(await choice.evaluate(e=>getComputedStyle(e).backgroundColor),base,'Hover distinguishes an enabled choice');
    await choice.press('Tab');await p.keyboard.press('Shift+Tab');assert.notEqual(await choice.evaluate(e=>getComputedStyle(e).outlineStyle),'none','Keyboard focus is visible');
    if(c.name==='companion')await panel.screenshot({path:path.join(out,`${prefix}-hover-focus.png`)});
    if(indices.wrong>=0){await p.locator(`[data-choice="${indices.wrong}"]`).click();assert.equal(await p.evaluate(()=>canNext()),false);}
    await p.locator(`[data-choice="${indices.valid}"]`).press('Enter');
    assert((await p.locator(`[data-choice="${indices.valid}"] .vf-choice-action`).innerText()).includes('已選取'));
   }
   assert(await p.evaluate(()=>canNext()));await shot('selected');
   for(const width of [320,1100]){await p.setViewportSize({width,height:850});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),prefix+' no overflow '+width);}
   if(c.name==='companion'){
    await p.setViewportSize({width:390,height:844});await p.locator('#dg-menu-open').click();await p.locator('#nav [data-page="2"]').hover();await p.locator('#nav [data-page="2"]').focus();
    await p.screenshot({path:path.join(out,`${prefix}-menu.png`)});await p.locator('#dg-menu-close').click();
    const nav=await p.evaluate(()=>{const cs=getComputedStyle(document.body),normalize=v=>{const s=document.createElement('span');s.style.color=v;document.body.append(s);const result=getComputedStyle(s).color;s.remove();return result;};return {expected:normalize(cs.getPropertyValue('--accent')),actual:getComputedStyle(document.querySelector('#dg-menu-open')).backgroundColor};});
    assert.equal(nav.actual,nav.expected,'Choice styling leaves header styling intact');
   }
   report.push({kind:c.name,theme});await p.close();
  }
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({report,errors},null,2));console.log('PASS: 7 interaction types, 2 themes, locked/ready/hover/focus/selected states, 3 widths, keyboard, menus and header styles.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
