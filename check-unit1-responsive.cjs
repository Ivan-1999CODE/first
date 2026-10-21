const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/day1-responsive-tune/after');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),report=[];
 try{
  for(const [width,height] of [[320,568],[390,844],[768,1024],[1024,768],[1366,768],[844,390]]){
   for(const theme of ['light','dark'])for(const size of ['standard','large']){
    const context=await browser.newContext({viewport:{width,height}}),p=await context.newPage(),errors=[];
    p.on('pageerror',e=>errors.push(e.message));
    await p.addInitScript(({theme,size})=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size',size);},{theme,size});
    await p.goto(pathToFileURL(path.resolve('travel-english.html')).href);
    const prefix=`${width}-${height}-${theme}-${size}`;
    const shot=async name=>{if(size==='large')await p.screenshot({path:path.join(out,`${prefix}-${name}.png`)});};
    const go=async n=>{await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-page="${n}"]`).click();};
    const checkOverflow=async label=>{
     const bad=await p.evaluate(()=>[...document.querySelectorAll('#main *,dialog[open] *')].filter(e=>{
      if(!e.getClientRects().length||getComputedStyle(e).visibility==='hidden')return false;
      const r=e.getBoundingClientRect();return r.width>0&&(r.left < -1||r.right > innerWidth+1);
     }).slice(0,4).map(e=>({cls:e.className,text:e.textContent.slice(0,40)})));
     assert.deepEqual(bad,[],`${prefix}/${label} bounds`);
     assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${prefix}/${label} page width`);
    };
    const inView=async loc=>loc.evaluate(e=>{const r=e.getBoundingClientRect(),head=document.querySelector('.top').getBoundingClientRect();return r.top>=head.bottom-1&&r.bottom<=innerHeight+1;});
    const measurements={};
    for(let n=0;n<8;n++){
     await go(n);await checkOverflow(`part${n+1}`);
     if(n===0){
      assert(await p.locator('.dg-cover-art').isVisible());
      const task=await p.locator('.dg-intro-grid .task').boundingBox();measurements.firstTaskTop=Math.round(task.y);
      if(width<740)assert(task.y<height-40,'First attempt starts within the phone screen, with illustration retained');
     }
     if(n===1){
      const en=await p.locator('.dg-study-card > .en').first().boundingBox();measurements.firstEnglishTop=Math.round(en.y);
      if(width<740)assert(en.y<height-60,'Core English starts in the phone first screen');
      assert.equal(await p.locator('.dg-study-context').evaluate(e=>e.open),false);
      await p.locator('.dg-study-context > summary').click();await checkOverflow('study-context');
      await p.locator('.dg-study-context > summary').click();
     }
     if([0,1,2,7].includes(n)){await p.evaluate(()=>scrollTo(0,0));await shot(`part${n+1}`);}
    }
    // The menu remains usable without losing its close action while scrolling.
    await p.locator('#dg-menu-open').click();
    await p.locator('#dg-course-dialog').evaluate(e=>e.scrollTop=0);
    const close=p.locator('#dg-menu-close');assert(await close.isVisible());
    assert((await close.boundingBox()).height<65,'Close action stays on one line');
    const firstStep=await p.locator('#nav [data-page="0"]').boundingBox();
    if(width<740)assert(firstStep.y<height-40,'Menu shows teaching sections without scrolling past task cards');
    assert(await p.locator('#nav .number').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().height<=parseFloat(getComputedStyle(e).lineHeight)+1)),'Section numbers stay together on one line');
    await p.locator('#nav [data-page="3"]').hover();await shot('menu');
    await p.locator('#dg-course-dialog').evaluate(e=>e.scrollTop=e.scrollHeight);
    const closeBounds=await close.boundingBox();assert(closeBounds.y>=0&&closeBounds.y+closeBounds.height<=height,'Close remains visible after menu scrolling');
    await close.focus();await shot('menu-scrolled');await p.keyboard.press('Enter');
    assert.equal(await p.locator('#dg-course-dialog').evaluate(e=>e.open),false);
    // Following an explicit listening confirmation on a phone reveals the next action.
    await go(2);await p.locator('[data-start="0"]').first().click();
    await p.locator('#spoken').check();await p.locator('#heard').check();
    if(width<740){assert.equal(await p.evaluate(()=>document.activeElement.classList.contains('scene-board')),true);assert(await inView(p.locator('.scene-board .objects')),'Phone choices fit after listening confirmation');}
    await shot('flow-choices');await p.locator('[data-choice="0"]').click();await p.locator('[data-act="next"]').click();
    assert(await inView(p.locator('.dg-speaker .dg-task')),'Next sentence returns to the dialogue');
    // Part 08 follows the same mobile handoff, while tablets retain simultaneous columns.
    await go(7);await p.locator('[data-cap-action="spoken"]').click();await p.locator('[data-cap-heard]').check();
    if(width<740){assert.equal(await p.evaluate(()=>document.activeElement.classList.contains('cap-board')),true);assert(await inView(p.locator('.cap-objects')));}
    await shot('cap-choices');await p.locator('[data-cap-choice="0"]').click();await p.locator('[data-cap-action="next"]').click();
    assert(await inView(p.locator('.cap-task')),'Next integration sentence returns to the dialogue');
    // Resizing an active exercise must not lose its state or overlap the controls.
    const state=await p.evaluate(()=>JSON.stringify(capstoneState));
    await p.setViewportSize({width:height,height:width});await checkOverflow('rotated');
    assert.equal(await p.evaluate(()=>JSON.stringify(capstoneState)),state);
    assert.deepEqual(errors,[]);report.push({width,height,theme,size,...measurements,errors});
    await context.close();
   }
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log('PASS: 24 viewport/theme/text combinations, all 8 sections, first-screen tasks, menu closing, mobile flow handoff, rotation.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
