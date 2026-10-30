const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/day0-practical-ui');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const reports=[];
 try{for(const language of ['ja','ko']){
  const d=require('./assets/micro-day0.cjs').make(language);
  const context=await browser.newContext({viewport:{width:1440,height:1080},reducedMotion:'reduce'});
  const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(pathToFileURL(path.resolve(d.file||'travel-japanese-day0-directions.html')).href);
  const nav=async n=>{
   const menu=p.locator('#courseMenu');
   if(await menu.locator(':scope > summary').isVisible()&&!await menu.evaluate(e=>e.open))await menu.locator(':scope > summary').click();
   await p.locator(`#nav [data-page="${n}"]`).click();
  };
  for(const [i,g]of d.course.taskGroups.entries()){
   await nav(0);await p.locator(`.before-panel [data-practical-chapter="${i}"]`).click();
   assert.equal(await p.evaluate(()=>activeRound().id),g.roundIds[0]);
   assert.deepEqual(await p.locator('.practical-tasks [data-before-round]').evaluateAll(es=>es.map(e=>Number(e.dataset.beforeRound))),g.roundIds.map(id=>d.rounds.findIndex(r=>r.id===id)));
  }
  // The phone scene keeps the chosen route consistent with the spoken task.
  await nav(2);assert.equal(await p.locator('.practical-phone-map').count(),1);
  assert((await p.locator('.practical-phone-map').innerText()).includes('先聽路線'));
  await p.locator('#spoken').check();await p.locator('#heard').check();await p.locator('[data-choice="0"]').click();
  assert((await p.locator('.practical-phone-map').innerText()).includes('左'));
  await p.locator('.practical-phone-map').screenshot({path:path.join(out,language+'-phone-route.png')});
  for(let n=0;n<7;n++){
   await nav(n);assert.equal(await p.locator('.practical-tools').count(),1);
   await p.locator('.practical-tools > summary').click();
   assert.equal(await p.locator('.practical-tools [data-say]:not([data-slow])').count(),4);
   assert.equal(await p.locator('.japanese-numbers').count(),1);
  }
  for(const theme of ['light','dark'])for(const width of [1440,768,390,320]){
   await p.setViewportSize({width,height:1000});
   await p.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.size='large';},theme);
   await nav(0);await p.locator('.before-panel [data-practical-chapter="0"]').click();
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${language}/${theme}/${width}: no horizontal page overflow`);
   if(width===1440||width===390)await p.screenshot({path:path.join(out,`${language}-${theme}-${width}-home.png`)});
   await nav(1);const word=p.locator('.jp-word').first();await word.click();
   const popup=p.locator('#japanese-word-meaning');
   await popup.waitFor({state:'visible'});
   const box=await popup.boundingBox();assert(box.x>=-1&&box.y>=-1&&box.x+box.width<=width+1&&box.y+box.height<=1001,'Glossary stays inside viewport');
   if(width===1440||width===390)await p.screenshot({path:path.join(out,`${language}-${theme}-${width}-glossary.png`)});
   await p.keyboard.press('Escape');assert(await popup.isHidden());
   await word.focus();await word.press('Enter');assert(await popup.isVisible());
   await p.keyboard.press('Escape');
  }
  assert.deepEqual(errors,[]);reports.push({language,status:'passed',chapters:6,parts:7,themes:['light','dark'],widths:[1440,768,390,320]});
  await context.close();console.log(`PASS ${language}: chapters, route scene, support tools, themes, glossary, mobile and large text`);
 }}finally{await browser.close();}
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
