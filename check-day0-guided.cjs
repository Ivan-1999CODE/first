// Actual browser interactions: seven-step navigation, all authored flows,
// stable saved task identity, and expanded dialogs in both themes and sizes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/day0-guided-qa');fs.mkdirSync(out,{recursive:true});
async function contrast(p,selector){
 const bad=await p.locator(selector).evaluateAll(elements=>{
  const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
  const lum=c=>c.slice(0,3).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
  return elements.filter(e=>e.getClientRects().length&&!e.disabled).map(e=>{
   let bg=[255,255,255];for(let n=e;n;n=n.parentElement){const c=rgb(getComputedStyle(n).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}}
   const a=lum(rgb(getComputedStyle(e).color)),b=lum(bg);return{text:e.textContent.trim().slice(0,40),ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
  }).filter(x=>x.ratio<4.5);
 });assert.deepEqual(bad,[],selector+': readable contrast');
}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const report=[];
 try{for(const language of ['ja','ko']){
  const d=require('./assets/micro-day0.cjs').make(language),file=d.file||'travel-japanese-day0-directions.html';
  const p=await browser.newPage({viewport:{width:1360,height:1000},reducedMotion:'reduce'}),errors=[];
  p.setDefaultTimeout(7000);p.on('pageerror',e=>errors.push(e.message));
  await p.goto(pathToFileURL(path.resolve(file)).href);
  const nav=async n=>{await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-page="${n}"]`).click();};
  const task=async n=>{await p.locator('#day0-task-open').click();await p.locator(`[data-day0-task="${n}"]`).click();};
  assert.equal(await p.locator('#dg-day-picker').evaluate(e=>e.open),false);
  assert.equal(await p.locator('.dg-overview').evaluate(e=>e.open),false);
  assert.equal(await p.locator('.dg-entry-note').evaluate(e=>e.open),false);
  assert.equal(await p.locator('#main > .footer-actions [data-page="1"]').count(),1);
  assert(await p.evaluate(()=>{
   const main=document.querySelector('#main'),items=[...main.children];
   return items.indexOf(main.querySelector('.hero'))<items.indexOf(main.querySelector('.primer-entry'))&&items.indexOf(main.querySelector('.primer-entry'))<items.indexOf(main.querySelector('.before-panel'));
  }),'Primer keeps its position between introduction and first attempt');
  await p.screenshot({path:path.join(out,language+'-home.png'),fullPage:true});
  await p.locator('#day0-task-open').click();
  assert.deepEqual(await p.locator('.day0-task-group h3').allTextContents(),['買東西','吃東西','找地方']);
  assert.deepEqual(await p.locator('[data-day0-task]').evaluateAll(es=>es.map(e=>Number(e.dataset.day0Task))),[0,1,2,3,5,4,6,7,8,9]);
  assert.match(await p.locator('.day0-task-group').nth(1).locator('button').first().innerText(),/E.*聽到幾位/s);
  await p.keyboard.press('Escape');assert.equal(await p.locator('#day0-task-dialog').evaluate(e=>e.open),false);
  assert.equal(await p.evaluate(()=>document.activeElement.id),'day0-task-open');

  // Seed existing records by their original IDs; opening and reordering must
  // not convert ordering records into party-size records or claim proficiency.
  await p.evaluate(id=>{
   localStorage.setItem(id,JSON.stringify({answers:{'before-E':'以前點餐','before-F':'以前回答兩位','after-E':'點餐課後'},ratings:{},complete:[],checks:{},taskHome:{E:{listen:true,spoken:false}}}));
   localStorage.setItem(id+'-rounds',JSON.stringify({round:4,done:['E']}));
  },d.course.id);
  await p.reload();assert.equal(await p.evaluate(()=>activeRound().id),'E');
  assert.match(await p.locator('.dg-current-round').innerText(),/F · 拿菜單/);
  await nav(5);await p.locator('.dg-previous-checkpoint > summary').click();assert.match(await p.locator('.dg-previous-checkpoint').innerText(),/以前點餐/);
  assert.equal(await p.locator('[data-round-ready="E"]').isChecked(),true);
  await task(5);await nav(5);await p.locator('.dg-previous-checkpoint > summary').click();assert.match(await p.locator('.dg-previous-checkpoint').innerText(),/以前回答兩位/);
  assert.equal(await p.locator('[data-round-ready="F"]').isChecked(),false);
  await task(0);await p.locator('.dg-entry-note > summary').click();
  await p.locator('[data-field="entry-before-A"]').fill('第一次短句');
  const prompt=await p.locator('.before-panel .task').innerText();
  await p.locator('#main > .footer-actions [data-page="1"]').click();
  await p.locator('.study-navigation [data-study-view="reply"]').click();
  await p.locator('[data-guide-hint][data-level="2"]').first().click();
  assert(await p.locator('.dg-hint-pane[data-pane="2"]').first().isVisible());
  await p.locator('[data-dg-reply-role="other"]').click();
  assert(await p.locator('[data-study-speaker="other"]').isVisible());
  await p.locator('#main > .footer-actions [data-start]').click();
  assert.equal(await p.evaluate(()=>page),2);
  assert.equal(await p.locator('[data-guide-hint][data-level="0"]').first().getAttribute('aria-pressed'),'true');

  // Walk every task's original and alternate flows, including retries. The
  // active speaker changes one at a time, followed by the choice operation.
  for(let n=0;n<d.rounds.length;n++){
   await task(n);
   for(let part=0;part<7;part++){
    await nav(part);assert.equal(await p.locator('#main').getAttribute('data-lesson-section'),String(part+1));
    assert.equal(await p.locator('#nav [aria-current="step"]').getAttribute('data-page'),String(part));
    assert(!(await p.locator('#main').innerText()).includes('undefined'));
   }
   for(const fi of d.rounds[n].flowIds){
    await nav(2);
    if(d.rounds[n].flowIds.length>1)await p.locator(`#main .tabs [data-start="${fi}"]`).click();
    const f=d.flows[fi];
    for(let turn=0;turn<f.steps.length;turn++){
     const t=f.steps[turn];
     assert.equal(await p.locator('.objects button').first().isDisabled(),true);
     assert.equal(await p.locator('.dg-speaker').getAttribute('aria-label'),'當前對話');
     await p.locator(t.askFirst?'#spoken':'#heard').check();
     await p.locator(t.askFirst?'#heard':'#spoken').check();
     assert(await p.locator('.d5-dialogue-complete').isVisible());
     const wrong=t.objects.findIndex((_,i)=>!t.valid.includes(i));
     if(wrong>=0){await p.locator(`[data-choice="${wrong}"]`).click();assert(await p.locator('#flowFeedback .retry').isVisible());assert(await p.locator('[data-act="next"]').isDisabled());}
     await p.locator(`[data-choice="${t.valid[0]}"]`).click();
     assert.equal(await p.locator('[data-act="next"]').isDisabled(),false);
     await p.locator('[data-act="next"]').click();
    }
    assert.equal(await p.evaluate(()=>finished),true);
    await p.locator('.dg-completion [data-page="3"]').click();
    await p.locator('[data-say-support="2"]').click();assert(await p.locator('.say-reference').isVisible());
    await p.locator('[data-say-index="0"]').first().click();assert.equal(await p.locator('.say-reference').isVisible(),false);
    await p.locator('#main > .footer-actions [data-page="4"]').click();
    await p.locator('.dg-teacher > summary').click();
    assert.equal(await p.locator('[data-teacher-step]').count(),d.flows[d.rounds[n].flowIds[0]].steps.length);
    await p.locator('#main > .footer-actions [data-page="5"]').click();
    await p.locator('#main > .footer-actions [data-page="6"]').click();assert.equal(await p.evaluate(()=>page),6);
   }
  }
  await task(0);await nav(5);
  assert.equal(await p.locator('.dg-checkpoint-task .task').innerText(),prompt);
  assert.match(await p.locator('.dg-before-record').innerText(),/第一次短句/);
  await p.locator('[data-field="entry-after-A"]').fill('現在短句');
  await p.locator('[data-round-ready="A"]').check();await nav(6);
  await p.locator('[data-task-home="A:spoken"]').check();
  await p.reload();await nav(5);assert.equal(await p.locator('[data-field="entry-after-A"]').inputValue(),'現在短句');
  await nav(6);assert(await p.locator('[data-task-home="A:spoken"]').isChecked());
  assert.equal(await p.evaluate(()=>state.answers['before-E']),'以前點餐');
  await task(3);await nav(5);await p.locator('[data-round-ready="D"]').check();await nav(6);
  await p.locator('.day0-next-task [data-before-round]').click();
  assert.equal(await p.evaluate(()=>activeRound().id),'F','After bags, first dining task is party size');
  await nav(5);await p.locator('[data-round-ready="F"]').check();await nav(6);
  await p.locator('.day0-next-task [data-before-round]').click();assert.equal(await p.evaluate(()=>activeRound().id),'E');

  for(const width of [1360,768,390,320])for(const theme of ['light','dark']){
   await p.setViewportSize({width,height:1000});
   await p.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.size='large';appearance();},theme);
   await task(0);
   for(let part=0;part<7;part++){
    await nav(part);
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${language}/${width}/${theme}/part${part}: overflow`);
   }
   await nav(0);await p.locator('#day0-task-open').click();
   const selected=p.locator('#day0-task-dialog [aria-pressed="true"]');await selected.hover();await selected.focus();
   await contrast(p,'#day0-task-dialog button,#day0-task-dialog h3,#day0-task-dialog .fine');
   assert(await p.evaluate(()=>{const e=document.querySelector('#day0-task-dialog'),r=e.getBoundingClientRect();return r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&getComputedStyle(e).backgroundColor!=='rgba(0, 0, 0, 0)';}));
   await p.screenshot({path:path.join(out,`${language}-${width}-${theme}-tasks.png`)});
   await p.keyboard.press('Escape');await p.locator('#dg-menu-open').click();
   await p.locator('#nav [aria-current]').hover();await p.locator('#nav [aria-current]').focus();
   await p.screenshot({path:path.join(out,`${language}-${width}-${theme}-steps.png`)});
   await p.keyboard.press('Escape');
   await p.locator('#dg-day-picker > summary').click();
   assert(await p.locator('#dg-days .day-switcher-links').isVisible());
   await p.screenshot({path:path.join(out,`${language}-${width}-${theme}-lessons.png`)});
   await p.keyboard.press('Escape');
   await nav(2);await p.locator('[data-guide-hint][data-level="2"]').first().click();
   await p.locator('.dg-hint-pane[data-pane="2"] > .reading > summary').click();
   assert(await p.evaluate(()=>getComputedStyle(document.querySelector('.dg-speaker')).backgroundColor!=='rgba(0, 0, 0, 0)'));
   if(width===390||width===1360)await p.screenshot({path:path.join(out,`${language}-${width}-${theme}-practice.png`)});
   await nav(4);await p.locator('.dg-teacher > summary').click();
   for(const summary of await p.locator('.d5-chat-bubble .reading > summary').all())await summary.click();
   await contrast(p,'.d5-chat-bubble .reading summary,.d5-chat-bubble .reading p');
   if(width===390)await p.screenshot({path:path.join(out,`${language}-${width}-${theme}-teacher.png`),fullPage:true});
   await nav(6);assert(await p.locator('.day0-next-task button').isEnabled());
  }
  assert.deepEqual(errors,[]);report.push({language,tasks:10,flows:d.flows.length,parts:7,widths:[1360,768,390,320],themes:['light','dark'],records:'preserved'});
  console.log('PASS '+language+': seven steps, all flows/retries, dining order, stable records, named menus and responsive themes');
  await p.close();
 }}finally{await browser.close();}
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
