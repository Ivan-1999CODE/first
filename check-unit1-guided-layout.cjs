const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/day1-guided-qa/layout');fs.mkdirSync(out,{recursive:true});
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});const result=[];
try{
 for(const [width,height,theme,large] of [[1366,768,'light',false],[1024,768,'dark',true],[768,1024,'dark',true],[390,844,'light',true]]){
  const c=await b.newContext({viewport:{width,height}}),p=await c.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(({theme,large})=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size',large?'large':'standard')},{theme,large});
  await p.goto(pathToFileURL(path.resolve('travel-english.html')).href);
  assert.deepEqual(errors,[],'Initial page renders');
  const go=async n=>{await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-page="${n}"]`).click();};
  for(let n=0;n<7;n++){
   await go(n);await p.screenshot({path:path.join(out,`${width}-${theme}-part${n+1}.png`),fullPage:true});
   const overflow=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert(overflow<=1,`part ${n+1} at ${width} has ${overflow}px overflow`);
  }
  await go(2);
  const start=p.locator('.dg-flow-back [data-start]');await start.click();
  const hint=p.locator('.dg-speaker .dg-hint');
  const y=[];
  for(const level of [0,1,2,0]){
   await hint.locator(`[data-level="${level}"]`).click();y.push((await p.locator('.dg-turn-confirm').boundingBox()).y);
  }
  assert(Math.max(...y)-Math.min(...y)<1,'Hint changes keep the speaking confirmation in place');
  const grid=await p.locator('.task-scene').evaluate(e=>({columns:getComputedStyle(e).gridTemplateColumns,top:e.getBoundingClientRect().top}));
  const speaker=await p.locator('.dg-speaker').boundingBox(),scene=await p.locator('.scene-board').boundingBox();
  assert(width<740?scene.y>speaker.y+speaker.height-1:Math.abs(speaker.y-scene.y)<2,'Tablet uses two columns, phone stacks');
  if(width>=1024)assert((await p.locator('.dg-turn-confirm').boundingBox()).y+(await p.locator('.dg-turn-confirm').boundingBox()).height<=height,`Speaking action fits first screen at ${width}`);
  await p.locator('#spoken').check();await p.locator('[data-dg-transcript]').click();await p.locator('#heard').check();
  await p.locator('[data-choice="1"]').click();assert(await p.locator('[data-act="next"]').isDisabled());
  await p.locator('[data-choice="0"]').click();assert(!(await p.locator('[data-act="next"]').isDisabled()));
  await p.screenshot({path:path.join(out,`${width}-${theme}-interact.png`),fullPage:true});
  if(width>=1024){const next=await p.locator('[data-act="next"]').boundingBox();assert(next.y+next.height<=height,`Next action fits first screen at ${width}: ${next.y+next.height}`);}
  await p.locator('#dg-menu-open').click();assert(await p.locator('#dg-course-dialog').isVisible());
  await p.locator('#nav button').nth(3).hover();await p.keyboard.press('Tab');await p.screenshot({path:path.join(out,`${width}-${theme}-menu.png`)});
  await p.keyboard.press('Escape');assert(!(await p.locator('#dg-course-dialog').isVisible()));assert.equal(await p.evaluate(()=>document.activeElement.id),'dg-menu-open');
  assert.deepEqual(errors,[]);
  result.push({width,height,theme,large,grid,hintShift:Math.max(...y)-Math.min(...y),errors});await c.close();
 }
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(result,null,2));console.log('PASS: all seven views, tablet split, fixed hints, first-screen flow controls, menu focus and themes.');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
