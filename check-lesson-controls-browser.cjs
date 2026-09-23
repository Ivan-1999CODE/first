const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const file of fs.readdirSync('.').filter(f=>/^travel-english(?:-unit.*)?\.html$/.test(f))){
   const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   await p.addInitScript(()=>{
    window.speechCalls=[];window.cancelCount=0;window.speechFail=false;
    const fake={paused:true,cancel(){cancelCount++;},resume(){this.paused=false;},getVoices(){return [{lang:'en-US',localService:true,name:'A'},{lang:'en-GB',localService:true,name:'B'}];},speak(u){speechCalls.push({text:u.text,rate:u.rate,voice:u.voice.name});if(speechFail)u.onerror({error:'synthesis-failed'});else u.onstart();}};
    Object.defineProperty(window,'speechSynthesis',{value:fake});
    Object.defineProperty(window,'SpeechSynthesisUtterance',{value:function(text){this.text=text;}});
   });
   await p.goto(require('url').pathToFileURL(path.resolve(file)).href);
   await p.locator('#nav [data-page="1"]').click();
   const checkOrder=async()=>{
    const results=await p.locator('.lesson-phrase-english').evaluateAll(es=>es.map(e=>({
     order:e.nextElementSibling?.classList.contains('lesson-phrase-audio')&&e.nextElementSibling.nextElementSibling?.classList.contains('lesson-phrase-chinese'),
     size:parseFloat(getComputedStyle(e).fontSize),visible:e.getClientRects().length>0
    })));
    assert(results.length>0,file+' has formatted phrases');
    assert(results.every(r=>r.order&&r.visible),file+' English/audio/Chinese order');
    assert(results.every(r=>Math.abs(r.size-21.76)<.01),file+' Day 1 standard font size');
   };
   await checkOrder();
   const trans=p.locator('#main details').filter({has:p.locator('summary').filter({hasText:'中文'})});
   assert(await trans.count()>0,file);
   assert.equal(await trans.evaluateAll(es=>es.every(e=>!e.open)),true);
   await p.locator('#allChinese').click();assert(await trans.evaluateAll(es=>es.every(e=>e.open)));
   await p.locator('#allChinese').click();assert(await trans.evaluateAll(es=>es.every(e=>!e.open)));
   await p.locator('#allChinese').focus();await p.keyboard.press('Enter');assert(await trans.evaluateAll(es=>es.every(e=>e.open)));
   const slow=p.locator('#main button').filter({hasText:/^慢速/}).first();
   await slow.click();let calls=await p.evaluate(()=>speechCalls);assert.equal(calls.at(-1).rate,.9*.8);assert(calls.at(-1).text);
   const phrase=calls.at(-1).text;await slow.locator('..').locator('button').first().click();calls=await p.evaluate(()=>speechCalls);assert.equal(calls.at(-1).rate,.9);assert.equal(calls.at(-2).rate/calls.at(-1).rate,.8);assert.equal(calls.at(-1).text,phrase);
   assert.equal(await p.evaluate(()=>speechSynthesis.paused),false);
   await p.evaluate(()=>speechFail=true);await slow.click();calls=await p.evaluate(()=>speechCalls);assert.equal(calls.at(-1).voice,'B');assert(await p.locator('.lesson-audio-status').innerText().then(t=>t.includes('語音未能播放')));
   await p.evaluate(()=>speechFail=false);
   await p.locator('[data-mode="reply"], [data-phrase-mode="reply"], [data-workshop-mode="reply"]').first().click();
   await checkOrder();
   assert(await trans.evaluateAll(es=>es.every(e=>e.open)));assert(await p.locator('#main details:not([open])').count()>0);
   await p.locator('#allChinese').click();assert(await trans.evaluateAll(es=>es.every(e=>!e.open)));
   await p.locator('#main button').filter({hasText:/^慢速/}).first().click();assert.equal((await p.evaluate(()=>speechCalls)).at(-1).rate,.9*.8);
   await p.locator('[data-mode="library"], [data-phrase-mode="library"], [data-workshop-mode="library"]').first().click();
   for(const width of [1440,390,320]){
    await p.setViewportSize({width,height:1000});await p.evaluate(()=>{document.documentElement.dataset.theme='dark';document.documentElement.dataset.size='large';document.body.classList.add('large');});
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${file} overflow ${width}`);
    assert(await p.locator('#allChinese').isVisible());
    const size=await p.locator('.lesson-phrase-english').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize));
    assert(Math.abs(size-(width>700?25.6:24))<.01,file+' enlarged font size');
   }
   if(file==='travel-english.html'){await p.screenshot({path:'qa-day1/chinese-toggle-mobile.png'});await p.setViewportSize({width:1440,height:1000});await p.screenshot({path:'qa-day1/chinese-toggle-desktop.png'});}
   await p.evaluate(()=>navigate(2));assert.equal(await p.locator('#allChinese').count(),0);assert(await p.locator('.lesson-audio-status').isHidden());
   assert.equal(await p.locator('#main.lesson-phrase-page').count(),0);
   assert.deepEqual(errors,[],file);await p.close();console.log('PASS '+file);
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
