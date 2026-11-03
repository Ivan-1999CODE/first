// Layout regression in browser emulation, without opening a real learner profile.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.resolve('tmp/playwright-browsers');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_PATH || 'C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const before=process.argv.includes('--before'),engine=process.argv.includes('--webkit')?'webkit':'edge';
const out=path.resolve('tmp/map-choice-spacing',before?'before':engine);
fs.mkdirSync(out,{recursive:true});
const file=path.resolve(before?'tmp/map-choice-spacing/before/travel-english-unit5-getting-around.html':'travel-english-unit5-getting-around.html');
const profiles=before?[[1180,820]]:[[1180,820],[1024,768],[1194,834],[1366,1024],[768,1024],[820,1180],[390,844],[320,568]];
(async()=>{
 const browser=await(engine==='webkit'?webkit.launch():chromium.launch({channel:'msedge',headless:true}));
 const report=[];
 try{
  for(const [width,height] of profiles)for(const theme of ['dark','light'])for(const size of ['large','standard']){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.addInitScript(({theme,size})=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size',size);},{theme,size});
   await page.goto(pathToFileURL(file).href);
   await page.evaluate(()=>start(0));
   const label=`${width}x${height}-${theme}-${size}`;
   const capture=before||(width===1180&&size==='large')||(width===320&&theme==='light'&&size==='large');
   const check=async state=>{
    const issues=await page.locator('.vf-map').evaluate(map=>{
     const problems=[],bounds=map.getBoundingClientRect(),cards=[...map.querySelectorAll('[data-choice]')];
     const contains=(inner,outer)=>inner.left>=outer.left-1&&inner.right<=outer.right+1&&inner.top>=outer.top-1&&inner.bottom<=outer.bottom+1;
     const rects=cards.map(card=>card.getBoundingClientRect());
     for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
      const a=rects[i],b=rects[j];
      const gap=Math.max(b.left-a.right,a.left-b.right,b.top-a.bottom,a.top-b.bottom);
      if(gap<12)problems.push(`choice gap is only ${gap.toFixed(1)}px`);
     }
     for(const card of cards){
      const box=card.getBoundingClientRect();
      if(!contains(box,bounds))problems.push('choice exceeds map panel');
      if(box.width<44||box.height<44)problems.push('choice is too small to touch');
      for(const element of card.children){
       if(!contains(element.getBoundingClientRect(),box))problems.push('choice content exceeds card');
       if(element.scrollWidth>element.clientWidth+1)problems.push('choice text overflows');
      }
      const lock=card.querySelector('.vf-choice-action svg');
      if(lock&&lock.getBoundingClientRect().height>20)problems.push('lock icon is stretched');
     }
     if(document.documentElement.scrollWidth>innerWidth+1)problems.push('page overflows viewport');
     return problems;
    });
    if(capture)await page.locator('.vf-map').screenshot({path:path.join(out,`${label}-${state}.png`)});
    report.push({label,state,issues});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
    assert.deepEqual(issues,[],`${label}/${state}`);
   };
   assert.equal(await page.locator('.vf-map [data-choice]').count(),2);
   assert(await page.locator('.vf-map [data-choice]').evaluateAll(cards=>cards.every(card=>card.disabled)));
   await check('locked');
   await page.locator('#spoken').check();await page.locator('#heard').check();
   await check('ready');
   const indices=await page.evaluate(()=>({valid:currentStep().valid[0],wrong:currentStep().objects.findIndex((_,i)=>!currentStep().valid.includes(i))}));
   await page.locator(`[data-choice="${indices.wrong}"]`).click();
   assert(await page.locator('[data-act="next"]').isDisabled());await check('wrong');
   const valid=page.locator(`[data-choice="${indices.valid}"]`);
   await valid.hover();await valid.press('Tab');await page.keyboard.press('Shift+Tab');
   assert.notEqual(await valid.evaluate(element=>getComputedStyle(element).outlineStyle),'none');
   if(capture)await page.locator('.vf-map').screenshot({path:path.join(out,`${label}-hover-focus.png`)});
   await valid.press('Enter');assert(await page.locator('[data-act="next"]').isEnabled());await check('selected');
   assert.equal(await page.locator('.vf-map > svg .vf-accent').count(),1,'Selected route remains visible');
   await page.setViewportSize({width:height,height:width});await check('rotated');
   assert.equal(await page.locator('.vf-map [aria-pressed="true"]').getAttribute('data-choice'),String(indices.valid));
   await page.locator('[data-act="next"]').click();assert.equal(await page.evaluate(()=>turn),1);
   await page.locator('[data-act="back"]').click();assert.equal(await page.evaluate(()=>turn),0);
   assert(await page.locator('[data-act="next"]').isDisabled());await check('back');
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log(`PASS ${engine}: ${profiles.length*4} viewport/theme/text combinations, ${report.length} map layout checks; locked/ready/retry/keyboard/selected/rotation/back and route feedback.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
