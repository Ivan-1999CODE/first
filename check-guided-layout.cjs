const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/later-guided/layout');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const report={views:0,days:[],screenshots:[],errors:[]};
 const checkWidth=async(p,label)=>{
  const problems=await p.evaluate(()=>{
   const clipped=e=>{for(let x=e.parentElement;x&&x!==document.body;x=x.parentElement){if(['auto','scroll','hidden','clip'].includes(getComputedStyle(x).overflowX))return true;}return false;};
   return [...document.querySelectorAll('#main *,#dg-context *,#dg-course-dialog[open] *,#dg-day-picker[open] *')].filter(e=>{
    if(!e.getClientRects().length||getComputedStyle(e).visibility==='hidden'||clipped(e))return false;
    const r=e.getBoundingClientRect();return r.width>0&&(r.left < -1||r.right>innerWidth+1);
   }).slice(0,5).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,80)}));
  });
  assert.deepEqual(problems,[],label+' visible content bounds');
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' document width');
 };
 const shot=async(p,name)=>{await p.screenshot({path:path.join(out,name+'.png')});report.screenshots.push(name+'.png');};
 try{
  for(const config of [{width:320,height:568,theme:'light',size:'large'},{width:1024,height:768,theme:'dark',size:'large'}]){
   const context=await browser.newContext({viewport:{width:config.width,height:config.height}}),p=await context.newPage();
   p.on('pageerror',e=>report.errors.push(e.message));p.setDefaultTimeout(8000);
   await p.addInitScript(c=>{localStorage.setItem('travel-lab-theme',c.theme);localStorage.setItem('travel-lab-text-size',c.size)},config);
   for(let day=2;day<=14;day++){
    const file=fs.readdirSync('.').find(f=>f.startsWith(`travel-english-unit${day}-`)&&f.endsWith('.html'));
    await p.goto(pathToFileURL(path.resolve(file)).href);
    const count=await p.evaluate(()=>rounds.length);
    assert.equal(await p.locator('#dg-context [data-dg-task]').count(),count);
    assert.equal(await p.locator('#nav [data-page]').count(),7);
    assert.equal(await p.locator('#dg-course-dialog [data-dg-task]').count(),0);
    for(let r=0;r<count;r++){
     await p.locator(`[data-dg-task="${r}"]`).click();
     assert.equal(await p.evaluate(()=>taskRound),r);
     for(let part=0;part<7;part++){
      await p.evaluate(n=>navigate(n),part);
      const label=`Day ${day} task ${r} part ${part+1} ${config.width}`;
      assert.equal(await p.locator('#main .focus-banner,#main .focus-stages,#main .merged-task-choices').count(),0,label+' no old stacked navigation');
      await checkWidth(p,label);report.views++;
      if(r===0&&((day===2&&[0,2].includes(part))||(day===6&&part===1)||(day===8&&[4,6].includes(part))||(day===12&&part===0)||(day===14&&part===5)))await shot(p,`day${day}-part${part+1}-${config.width}-${config.theme}`);
     }
    }
    await p.evaluate(()=>navigate(4));await p.locator('#dg-menu-open').click();
    await checkWidth(p,`Day ${day} menu ${config.width}`);
    await p.locator('#nav [data-page="2"]').click();assert.equal(await p.evaluate(()=>page),2);
    assert.equal(await p.evaluate(()=>document.activeElement.id),'main');
    if(count>1){await p.locator('[data-dg-task="0"]').click();assert.equal(await p.evaluate(()=>page),2);}
    await p.locator('#dg-menu-open').click();await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.activeElement.id),'dg-menu-open');
    await p.locator('#dg-day-picker > summary').click();
    assert.equal(await p.locator('#dg-day-picker a').count(),16);await checkWidth(p,`Day ${day} days ${config.width}`);
    if(day===2||day===12)await shot(p,`day${day}-days-${config.width}-${config.theme}`);
    await p.locator('#dg-day-picker > summary').focus();await p.keyboard.press('Escape');
    if(day===2||day===12){await p.locator('#dg-menu-open').click();await p.locator('#nav [data-page="1"]').hover();await p.locator('#dg-menu-close').focus();await p.keyboard.press('Tab');await shot(p,`day${day}-menu-${config.width}-${config.theme}`);await p.keyboard.press('Escape');}
    report.days.push({day,width:config.width,tasks:count});
   }
   await context.close();
  }
  assert.deepEqual(report.errors,[],'No page errors');
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log(`PASS: ${report.views} task/section views, ${report.days.length} lesson/viewport combinations, navigation, day cards, light/dark and large text.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
