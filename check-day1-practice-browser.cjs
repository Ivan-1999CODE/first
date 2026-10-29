const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const data=require('./assets/day1-focus-data.cjs'),out=path.resolve('tmp/day1-practice-qa');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const report={rounds:[],views:[],errors:[]};let p;
 try{
  const c=await browser.newContext({viewport:{width:1366,height:900}});p=await c.newPage();
  p.on('pageerror',e=>report.errors.push(e.message));
  await p.addInitScript(({key})=>{
   if(localStorage.getItem('practice-qa-seed'))return;
   localStorage.setItem(key,JSON.stringify({answers:{'before-A':'原完整任務課前','after-A':'原完整任務課後','mission-route-a-v4-change':'原變化題回答'},checks:{'route-a-v4-live':[true,false,true]},taskHome:{A:{listen:true,spoken:false}}}));
   localStorage.setItem('practice-qa-seed','yes');
  },{key:data.course.id});
  await p.goto(pathToFileURL(path.resolve('travel-english.html')).href);
  const nav=async n=>{await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-page="${n}"]`).click();};
  const choose=async i=>{await p.locator(`.dg-task-switch [data-dg-task="${i}"]`).click();};
  const fits=async label=>{const overflow=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert(overflow<=1,label+' horizontal overflow: '+overflow);};
  for(const [i,r] of data.rounds.entries()){
   await nav(0);await choose(i);
   assert.equal(await p.locator('.before-panel .task').innerText(),r.entryCheckpoint.task);
   assert.equal(await p.locator('#main button:visible').count(),1,'Home offers one visible action');
   assert.equal(await p.locator('.dg-entry-record').evaluate(el=>el.open),false);
   await p.locator('.dg-entry-record > summary').click();
   const before=p.locator(`[data-field="before-entry-v1-${r.id}"]`);
   assert.equal(await before.inputValue(),'');await before.fill(`新 ${r.id} 課前`);
   await p.locator('#main > .footer-actions button').click();
   assert.equal(await p.locator('.dg-study-preview').evaluate(el=>el.open),false);
   assert.equal(await p.locator('.dg-study-preview [data-exchange]').count(),1);
   if(i===0)assert((await p.locator('.dg-study-changes').innerText()).includes('How do I get to the bus stop?'));
   await p.locator('.dg-study-preview > summary').focus();await p.keyboard.press('Enter');
   assert.equal(await p.locator('.dg-study-preview').evaluate(el=>el.open),true);
   assert(await p.locator('.dg-study-preview .micro-turns').first().isVisible());
   await p.locator('.study-navigation [data-study-view="reply"]').click();
   await p.locator('[data-level="2"]').first().click();
   await p.locator('[data-dg-reply-role="other"]').click();
   await p.locator('[data-study-view="library"]').click();
   assert.equal(await p.locator('.dg-study-preview').evaluate(el=>el.open),false,'Mode return closes preview');
   await nav(5);
   assert.equal(await p.locator('.dg-checkpoint-task .task').innerText(),r.entryCheckpoint.task);
   assert.equal(await p.locator('.dg-before-record .readonly').innerText(),`新 ${r.id} 課前`);
   await p.locator(`[data-field="after-entry-v1-${r.id}"]`).fill(`新 ${r.id} 課後`);
   if(i===0){await p.locator('details.old-records > summary').click();assert((await p.locator('details.old-records').innerText()).includes('原完整任務課前'));}
   report.rounds.push(r.id);
  }
  await p.reload();await choose(0);await nav(5);
  assert.equal(await p.locator('[data-field="after-entry-v1-A"]').inputValue(),'新 A 課後');
  const saved=await p.evaluate(key=>JSON.parse(localStorage.getItem(key)),data.course.id);
  assert.equal(saved.answers['before-A'],'原完整任務課前');assert.equal(saved.answers['after-A'],'原完整任務課後');
  assert.equal(saved.answers['mission-route-a-v4-change'],'原變化題回答');
  assert.deepEqual(saved.checks['route-a-v4-live'],[true,false,true]);
  assert.equal(saved.taskHome.A.listen,true);
  for(const theme of ['light','dark'])for(const width of [1366,390,320]){
   await p.setViewportSize({width,height:900});
   if(await p.evaluate(()=>document.documentElement.dataset.theme)!==theme)await p.locator('#theme').click();
   if(await p.locator('#large').getAttribute('aria-pressed')!=='true')await p.locator('#large').click();
   await nav(0);await fits(`${theme}/${width}/home`);
   await p.screenshot({path:path.join(out,`${theme}-${width}-home.png`),fullPage:true});
   await p.locator('.dg-entry-record > summary').click();await fits(`${theme}/${width}/entry-open`);
   await p.locator('.before-panel').screenshot({path:path.join(out,`${theme}-${width}-entry-open.png`)});
   await nav(1);await p.locator('.dg-study-preview > summary').click();
   await p.locator('.dg-study-preview > summary').hover();await p.locator('.dg-study-preview > summary').focus();
   await fits(`${theme}/${width}/preview-open`);
   await p.locator('.dg-study-preview').screenshot({path:path.join(out,`${theme}-${width}-preview-open.png`)});
   await choose(1);assert.equal(await p.locator('.dg-study-preview').evaluate(el=>el.open),false,'New task starts with preview closed');
   await choose(0);await nav(5);await fits(`${theme}/${width}/review`);
   await p.locator('.dg-checkpoint-task').screenshot({path:path.join(out,`${theme}-${width}-review.png`)});
   report.views.push({theme,width,large:true});
  }
  assert.deepEqual(report.errors,[]);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log('PASS: A/B/C short-task record isolation and persistence; one visible home action; keyboard disclosure and reset; six enlarged light/dark desktop/mobile viewports with screenshots.');
 }catch(error){
  if(p)await p.screenshot({path:path.join(out,'failure.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({...report,failure:String(error)},null,2));throw error;
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
