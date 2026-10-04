// Route the current Japanese lesson to task, role and audio integration checks.
if(require('fs').readFileSync('travel-japanese-day0-directions.html','utf8').includes('travel-lab-day0-rounds-v3')){
 require('child_process').execFileSync(process.execPath,['--preserve-symlinks','--preserve-symlinks-main','check-all-task-rounds.cjs','--day0'],{stdio:'inherit'});
 return;
}
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const data=require('./assets/day0-data.cjs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 const url=require('url').pathToFileURL(path.resolve('travel-japanese-day0-directions.html')).href;
 await p.addInitScript(()=>{const NativeAudio=window.Audio;window.Audio=function(...args){const a=new NativeAudio(...args);window.testAudio=a;return a;};});
 await p.goto(url);
 const nav=async n=>{const menu=p.locator('#courseMenu');const summary=menu.locator('summary').first();if(await summary.isVisible()&&!await menu.evaluate(e=>e.open))await summary.click();await p.locator(`#nav [data-page="${n}"]`).click();};
 const gate=async()=>{const first=await p.locator('#spoken').isDisabled()?'heard':'spoken';await p.locator('#'+first).check();await p.locator(first==='heard'?'#spoken':'#heard').check();};
 assert.equal(await p.locator('#nav button').count(),7);
 await p.locator('#field-before').fill('還不會說');
 await nav(1);assert.equal(await p.locator('.grid>article').count(),3);
 assert.equal(await p.locator('details[open]').count(),1); // desktop navigation only
 await p.evaluate(()=>{window.speechSynthesis.speak=()=>{throw Error('Should not use device TTS');};});
 await p.locator('[data-say]').first().click();await p.waitForFunction(()=>testAudio.currentTime>.1&&!testAudio.paused);
 assert.equal(await p.evaluate(()=>testAudio.playbackRate),1);
 await p.locator('[data-slow]').first().click();await p.waitForFunction(()=>testAudio.currentTime>.1&&!testAudio.paused);assert.equal(await p.evaluate(()=>testAudio.playbackRate),.8);
 await p.locator('.day0-audio-status button').click();assert(await p.evaluate(()=>testAudio.paused));
 const decoded=await p.evaluate(async()=>{const ctx=new AudioContext(),result=[];for(const [text,src] of Object.entries(day0Audio)){const b=await ctx.decodeAudioData(await(await fetch(src)).arrayBuffer());let peak=0;for(const n of b.getChannelData(0))peak=Math.max(peak,Math.abs(n));result.push({text,duration:b.duration,peak});}await ctx.close();return result;});assert.equal(decoded.length,34);assert(decoded.every(x=>x.duration>.15&&x.peak>.005));
 await p.locator('[data-mode="reply"]').click();await p.locator('[data-reply="1"]').first().click();assert.equal(await p.locator('.workshop-count').innerText(),'2 / 2');assert.equal(await p.locator('.workshop-card details[open]').count(),0);
 for(let f=0;f<data.flows.length;f++){
  await nav(2);await p.locator(`[data-start="${f}"]`).first().click();
  for(let i=0;i<data.flows[f].steps.length;i++){
   const t=data.flows[f].steps[i];assert(await p.locator('[data-choice]').first().isDisabled());
   await gate();
   if(t.objects.length>1){await p.locator(`[data-choice="${t.valid[0]===0?1:0}"]`).click();assert(await p.locator('[data-act="next"]').isDisabled());}
   await p.locator(`[data-choice="${t.valid[0]}"]`).click();
   if(i===0){await p.locator('#spoken').uncheck();assert(await p.locator('[data-act="next"]').isDisabled());await gate();await p.locator(`[data-choice="${t.valid[0]}"]`).click();}
   await p.locator('[data-act="next"]').click();
  }
  assert((await p.locator('#main').innerText()).includes('流程完成'));
  assert((await p.locator('.scene-state').innerText()).includes(data.flows[f].walkMinutes+' 分鐘'));
 }
 await nav(2);await p.locator('[data-start="0"]').first().click();await gate();await p.locator('[data-choice="0"]').click();await p.locator('[data-act="next"]').click();await p.locator('[data-act="back"]').click();assert((await p.locator('.scene-state').innerText()).includes('在起點'));
 await nav(3);await p.locator('#field-mission-toilet').fill('Toire wa doko desu ka');await p.locator('[data-mission="1"]').click();await p.locator('#field-mission-unclear').fill('Mō ichido');await p.locator('[data-mission="0"]').click();assert.equal(await p.locator('#field-mission-toilet').inputValue(),'Toire wa doko desu ka');
 await nav(4);await p.locator('[data-pair-check="station:0"]').check();await p.locator('#field-note-station').fill('Eki');await p.locator('[data-pair="1"]').click();assert.equal(await p.locator('[data-pair-check="store:0"]').isChecked(),false);
 await nav(5);assert((await p.locator('.readonly').innerText()).includes('還不會說'));await p.locator('#field-after').fill('すみません。駅はどこですか。');await p.locator('[data-rating="ask:3"]').click();assert.equal(await p.locator('.meter .green').count(),3);await p.locator('[data-rating="ask:1"]').click();assert.equal(await p.locator('.meter .green').count(),0);assert.equal(await p.locator('.meter .yellow').count(),1);
 await nav(6);await p.locator('[data-quiz="direction:0"]').click();assert((await p.locator('#main').innerText()).includes('再聽一次'));await p.locator('[data-quiz="direction:1"]').click();await p.locator('#field-home').fill('ありがとうございます。');await p.locator('[data-home="spoken"]').check();
 await p.locator('#large').click();await p.locator('#theme').click();await p.reload();assert.equal(await p.locator('#field-before').inputValue(),'還不會說');assert.equal(await p.locator('html').getAttribute('data-theme'),'dark');assert.equal(await p.locator('html').getAttribute('data-size'),'large');
 await nav(4);assert(await p.locator('[data-pair-check="station:0"]').isChecked());await nav(5);assert.equal(await p.locator('#field-after').inputValue(),'すみません。駅はどこですか。');await nav(6);assert(await p.locator('[data-home="spoken"]').isChecked());
 fs.mkdirSync('qa-day0',{recursive:true});
 for(const theme of ['light','dark']){
  await p.evaluate(t=>{document.documentElement.dataset.theme=t;appearance();},theme);
  for(const width of [1440,768,390,320]){
   await p.setViewportSize({width,height:1000});await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   for(let n=0;n<7;n++){await nav(n);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow ${theme}/${width}/${n}`);if((width===1440||width===390)&&[1,2,4,5].includes(n))await p.screenshot({path:`qa-day0/${theme}-${width}-${n}.png`,fullPage:true});}
  }
 }
 // Corrupt storage and absent speech still permit a usable page.
 await p.evaluate(k=>localStorage.setItem(k,'bad json'),data.course.id);await p.reload();assert.equal(await p.locator('#nav button').count(),7);assert(await p.locator('#storageNotice').isVisible());
 await nav(1);await p.evaluate(()=>Object.defineProperty(window,'speechSynthesis',{value:null,configurable:true}));await p.locator('[data-say]').first().click();await p.waitForFunction(()=>testAudio.currentTime>.1&&!testAudio.paused);await nav(0);assert(await p.evaluate(()=>testAudio.paused));
 await p.evaluate(()=>{testAudio.play=()=>Promise.reject(Error('test playback failure'));speak(phrases[0].en);});assert((await p.locator('.day0-audio-status').innerText()).includes('音檔未能播放'));
 assert.deepEqual(errors,[]);
 for(const file of fs.readdirSync('.').filter(f=>/^(travel-english.*|travel-japanese-day0-directions)\.html$/.test(f))){const h=fs.readFileSync(file,'utf8');assert(h.includes('href="travel-japanese-day0-directions.html"'));for(const [,href] of h.matchAll(/href="([^"#:]+\.html)"/g))assert(fs.existsSync(href),file+' '+href);}
 console.log('PASS: 34 audible decoded clips, real normal/slow playback, stop/navigation/failure, no device TTS required; routes, persistence, ratings, 56 responsive states and links.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
