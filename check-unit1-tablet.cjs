const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 fs.mkdirSync('tmp/tablet-qa',{recursive:true});
 for(const [width,height,touch] of [[768,1024,true],[1024,768,true],[1366,1024,true],[1440,1000,false]]){
  const p=await b.newPage({viewport:{width,height},hasTouch:touch}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(require('url').pathToFileURL(path.resolve('travel-english.html')).href);
  const entry=p.locator('[data-homework-open]');
  const bounds=await entry.boundingBox();assert(bounds.y>=height&&bounds.x+bounds.width<=width);
  assert.equal(await entry.evaluate(el=>getComputedStyle(el).position),'static');
  await entry.scrollIntoViewIfNeeded();
  const atBottom=await entry.boundingBox();assert(atBottom.y+atBottom.height<=height);
  await entry.click();await p.locator('.homework-dialog').waitFor({state:'visible'});await p.keyboard.press('Escape');await p.locator('.homework-dialog').waitFor({state:'hidden'});
  await p.locator('[data-focus-round="0"]').first().click();await p.locator('#main > .footer-actions button').last().click();
  assert.equal(await p.locator('[data-act="next"]').count(),1);
  assert.equal(await p.locator('.scene-board [data-act="next"]').count(),touch&&height>=width?1:0);
  await p.locator('#spoken').check();await p.locator('#heard').check();
  await p.locator('[data-choice="0"]').click();assert(!(await p.locator('[data-act="next"]').isDisabled()));
  if(touch&&height>=width){
   const object=await p.locator('.objects').boundingBox(),next=await p.locator('[data-act="next"]').boundingBox();assert(next.y>object.y);
   await p.locator('.scene-step-controls').scrollIntoViewIfNeeded();
   const after=await p.locator('[data-act="next"]').boundingBox(),floating=await entry.boundingBox();
   assert(after.y+after.height<=floating.y||after.x+after.width<=floating.x||after.y>=floating.y+floating.height,'floating export covers next');
   await p.screenshot({path:`tmp/tablet-qa/scene-${width}.png`});
  }
  await p.locator('[data-act="next"]').click();assert.equal(await p.evaluate(()=>turn),1);
  await p.locator('[data-act="back"]').click();assert.equal(await p.evaluate(()=>turn),0);
  // Rotation moves existing controls, preserving current progress and gating.
  await p.setViewportSize({width:touch?height:900,height:touch?width:1000});
  await p.waitForFunction(expected=>Boolean(document.querySelector('.scene-board [data-act="next"]'))===expected,touch?width>=height:true);
  assert.equal(await p.locator('.scene-board [data-act="next"]').count(),(touch?width>=height:true)?1:0);
  assert.equal(await p.locator('[data-act="next"]').count(),1);
  assert.equal(await p.evaluate(()=>turn),0);
  assert.deepEqual(errors,[]);await p.close();
 }
 console.log('PASS: page-bottom export in normal flow; tablet portrait/landscape step placement; no duplicate controls; next/back gating and rotation; desktop unchanged.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
