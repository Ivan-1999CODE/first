'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const file=path.resolve('travel-english-unit5-getting-around.html'),out=path.resolve('tmp/guided-nav-arrows');fs.mkdirSync(out,{recursive:true});
const before=process.argv.includes('--before'),report={before,hash:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),views:[],shared:[],errors:[],failures:[]};
const configs=[{width:320,height:568,size:'large',theme:'light'},{width:390,height:844,size:'standard',theme:'dark'},{width:768,height:1024,size:'standard',theme:'light'},{width:1440,height:1000,size:'standard',theme:'dark'}];
async function inspect(p,part,verify){
 const result=await p.locator('#main > .footer-actions').evaluate(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,buttons:[...e.querySelectorAll(':scope > button')].map(b=>{const q=b.getBoundingClientRect(),s=getComputedStyle(b);return {text:b.textContent.trim(),left:q.left,right:q.right,width:q.width,height:q.height,page:b.dataset.page,start:b.dataset.start,flexGrow:s.flexGrow}})}});
 if(verify){
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No page overflow');
  assert(result.buttons.every(b=>b.width>=44&&b.height>=44),'Touch targets >=44px');
  if(part===0){assert.equal(result.buttons.length,1);const b=result.buttons[0];assert(Math.abs(result.right-b.right)<2,'Home button touches right edge');assert.equal(b.flexGrow,'0','Home button does not stretch');assert(b.text.endsWith('→'));}
  else {assert.equal(result.buttons.length,2);assert(result.buttons[0].text.startsWith('←'),'Previous part arrow points left');assert(result.buttons[1].text[part===6?'startsWith':'endsWith'](part===6?'←':'→'),'Next/home arrow matches direction');}
 }
 return result;
}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});let active;
try{
 for(const c of configs){const ctx=await browser.newContext({viewport:{width:c.width,height:c.height},isMobile:c.width<400,hasTouch:c.width<1000}),p=await ctx.newPage();active=p;p.on('pageerror',e=>report.errors.push(e.message));await p.addInitScript(c=>{localStorage.setItem('travel-lab-theme',c.theme);localStorage.setItem('travel-lab-text-size',c.size)},c);await p.goto(pathToFileURL(file).href);
  for(const part of before?[0,1,2]:[0,1,2,3,4,5,6]){
   await p.evaluate(n=>navigate(n),part);report.views.push({config:c,part:part+1,...await inspect(p,part,!before)});
   if(part<=2){const b=p.locator('#main > .footer-actions button').last();await b.scrollIntoViewIfNeeded();if(!before&&part===1)await b.focus();await p.screenshot({path:path.join(out,`${before?'before':'after'}-${c.width}-${c.theme}-part${part+1}.png`)});}
   if(!before){const next=p.locator('#main > .footer-actions button').last();await next.focus();await next.press('Enter');assert.equal(await p.evaluate(()=>page),part===6?0:part+1,'Forward/return destination unchanged');if(part>0){await p.evaluate(n=>navigate(n),part);await p.locator('#main > .footer-actions button').first().click();assert.equal(await p.evaluate(()=>page),part-1,'Previous destination unchanged')}}
  }
  if(!before&&c.width===1440){await p.evaluate(()=>{page=2;finished=true;history=flows[flow].steps.map(t=>t.valid[0]);render()});const next=p.locator('.dg-completion [data-page="3"]');assert.equal(await next.innerText(),'前往 04 換條件 →');await next.click();assert.equal(await p.evaluate(()=>page),3);await p.evaluate(()=>navigate(6));assert((await p.locator('.dg-home-next [data-page="5"]').innerText()).startsWith('←'));report.completionAndReviewArrows=true;}
  await ctx.close();
 }
 if(!before)for(const day of [2,3,4,6,7,8,9,10,11,12,13,14]){const lesson=fs.readdirSync('.').find(f=>f.startsWith(`travel-english-unit${day}-`)&&f.endsWith('.html')),ctx=await browser.newContext({viewport:{width:1024,height:768}}),p=await ctx.newPage();active=p;p.on('pageerror',e=>report.errors.push(e.message));await p.goto(pathToFileURL(path.resolve(lesson)).href);for(const part of [0,1,2,6]){await p.evaluate(n=>navigate(n),part);await inspect(p,part,true)}report.shared.push(day);await ctx.close()}
 assert.deepEqual(report.errors,[]);assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),report.hash,'Source did not change during verification');
}catch(e){report.failures.push(e.stack);if(active)await active.screenshot({path:path.join(out,'failure.png')});throw e}
finally{fs.writeFileSync(path.join(out,before?'before.json':'report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log(before?`Saved ${report.views.length} before views.`:`PASS ${report.views.length} views; ${report.shared.length} shared lessons; correct arrows, alignment and keyboard destinations.`);
})().catch(e=>{console.error(e);process.exit(1)});
