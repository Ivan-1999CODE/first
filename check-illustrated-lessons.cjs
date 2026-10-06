const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {pathToFileURL}=require('url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const curriculum=require('./assets/curriculum-original.json');
const source=day=>day===2?require('./assets/day2-expanded.cjs'):require('./assets/curriculum-rounds.cjs').make(day);
const expected=require('./assets/course-illustrations.cjs');
const output=path.join(__dirname,'tmp','illustrated-lessons-qa');
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),report=[];
 try{
  for(const row of curriculum.filter(x=>x.day>=2)){
   const page=await browser.newPage({viewport:{width:1440,height:1500}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(path.join(__dirname,row.file)).href);
   assert.equal(await page.locator('html').getAttribute('data-illustrated'),'true');
   const d=source(row.day);
   for(let ri=0;ri<d.rounds.length;ri++){
    await page.evaluate(ri=>{setTaskRound(ri);navigate(2);},ri);
    const role=expected.rolesFor(row.day,d.rounds[ri].role||d.course.replyRole,d.rounds[ri].id);
    assert.deepEqual(await page.locator('.role-other img,.role-self img').evaluateAll(es=>es.map(e=>e.dataset.illustration)),[role.other,role.self]);
    assert.notEqual(role.self,role.other);
    await page.locator('.role-frame img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));
    assert(await page.locator('.role-frame img').evaluateAll(es=>es.every(e=>e.naturalWidth>0)));
   }
   await page.evaluate(()=>setTaskRound(0));
   for(const width of [1440,1024,390,320])for(const theme of ['light','dark']){
    await page.setViewportSize({width,height:1500});
    await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size='large';},theme);
    for(let section=0;section<7;section++){
     await page.evaluate(section=>navigate(section),section);
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`Overflow Day ${row.day}, section ${section+1}, ${width}, ${theme}`);
     if(section===4)assert.equal(await page.locator('.teacher[open]').count(),0);
     if(section!==0)assert.equal(await page.locator('.lesson-section-heading h1').count(),1);
    }
   }
   if([2,3,5,6,8,9,11,13].includes(row.day)){
    await page.setViewportSize({width:1440,height:1500});
    await page.evaluate(()=>{document.documentElement.dataset.theme='light';document.documentElement.dataset.size='standard';});
    for(const section of [0,2,4,5]){
     await page.evaluate(section=>navigate(section),section);
     await page.locator('#main img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));
     await page.evaluate(()=>document.activeElement.blur());
     await page.screenshot({path:path.join(output,`day${row.day}-part${section+1}-desktop.png`),fullPage:true,animations:'disabled'});
    }
   }
   if([2,5,8].includes(row.day)){
    await page.setViewportSize({width:390,height:1500});
    await page.evaluate(()=>{document.documentElement.dataset.theme='dark';document.documentElement.dataset.size='large';appearance();navigate(2);document.activeElement.blur();});
    await page.screenshot({path:path.join(output,`day${row.day}-part3-mobile-dark.png`),fullPage:true,animations:'disabled'});
   }
   assert.deepEqual(errors,[]);
   report.push({day:row.day,rounds:d.rounds.length,layouts:56,imagesDecoded:true,errors});
   console.log(`Illustrations PASS Day ${row.day}`);
   await page.close();
  }
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
