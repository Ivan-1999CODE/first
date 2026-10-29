// Browser coverage for the visible Japanese/Korean 1–10 playback controls.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('tmp/number-sequence-qa');
fs.mkdirSync(out,{recursive:true});

(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const reports=[];
 try{
  for(const language of ['ja','ko']){
   const d=require('./assets/micro-day0.cjs').make(language),expected=d.numberWords.map(row=>row[0]);
   const context=await browser.newContext({viewport:{width:1440,height:1080},reducedMotion:'reduce'});
   const p=await context.newPage(),errors=[];
   p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));
   await p.addInitScript(()=>{
    const Native=window.Audio;window.qaPlayers=[];window.qaStarts=[];
    window.Audio=function(...args){
     const a=new Native(...args);window.qaPlayers.push(a);window.qaAudio=a;
     a.addEventListener('playing',()=>window.qaStarts.push({text:Object.entries(day0Audio).find(([,url])=>url===a.src)?.[0]||'word recording',rate:a.playbackRate}));
     return a;
    };
   });
   await p.goto(pathToFileURL(path.resolve(d.file||'travel-japanese-day0-directions.html')).href);
   await context.setOffline(true);
   const nav=async n=>{
    const menu=p.locator('#courseMenu'),summary=menu.locator(':scope > summary');
    if(await summary.isVisible()&&!await menu.evaluate(e=>e.open))await summary.click();
    await p.locator(`#nav [data-page="${n}"]`).click();
   };
   await nav(1);
   const section=p.locator('.japanese-numbers');
   assert.equal(await section.count(),1,'Numbers appear in the current lesson');
   assert.equal(await section.locator('.task-words > div').count(),10);
   const normal=section.locator('[data-number-sequence]:not([data-slow])');
   const slow=section.locator('[data-number-sequence][data-slow]');
   assert.equal(await normal.count(),1);assert.equal(await slow.count(),1);
   assert.equal(await normal.getAttribute('data-say'),expected.join(' '));
   assert.equal(await slow.getAttribute('data-say'),expected.join(' '));
   assert.deepEqual(await p.evaluate(()=>numberWords.map(row=>Boolean(day0Audio[row[0]]))),Array(10).fill(true));
   // Natural media completion drives each next number; no synthetic ended events or seeking.
   await p.evaluate(()=>qaStarts=[]);await normal.click();
   await p.waitForFunction(()=>qaStarts.length===10&&qaAudio.ended,null,{timeout:60000});
   assert.deepEqual(await p.evaluate(()=>qaStarts),expected.map(text=>({text,rate:1})));
   assert.match(await section.locator('.follow-heading strong').innerText(),/播放完畢/);
   assert.equal(await p.locator('.follow-token.is-current').count(),0);
   assert.equal(await p.locator('.day0-audio-status').isVisible(),false);
   console.log(`${language}: all 10 embedded clips finished naturally, in order, while offline`);
   // Keyboard playback and slow rate also advance naturally into the second clip.
   await p.evaluate(()=>qaStarts=[]);await slow.focus();await slow.press('Enter');
   await p.waitForFunction(()=>qaStarts.length>=2&&qaAudio.currentTime>.05);
   assert.deepEqual(await p.evaluate(()=>qaStarts.slice(0,2)),expected.slice(0,2).map(text=>({text,rate:.8})));
   assert(await p.evaluate(()=>qaAudio.preservesPitch));
   await p.locator('.day0-audio-status button').click();
   const stopped=await p.evaluate(()=>qaStarts.length);
   await p.waitForTimeout(1200);
   assert.equal(await p.evaluate(()=>qaStarts.length),stopped);
   assert(await p.evaluate(()=>qaAudio.paused&&!qaAudio.getAttribute('src')));
   assert.equal(await p.locator('.follow-along').count(),0);
   // Clicking a single number cancels the sequence rather than resuming at the next item.
   await normal.click();await p.waitForFunction(()=>!qaAudio.paused&&qaAudio.currentTime>.05);
   await p.evaluate(()=>qaStarts=[]);
   await section.locator('.task-words > div').nth(4).locator('[data-say]:not([data-slow])').click();
   await p.waitForFunction(()=>qaAudio.ended);
   await p.waitForTimeout(400);
   assert.deepEqual(await p.evaluate(()=>qaStarts),[{text:expected[4],rate:1}]);
   // Rapid normal/slow switches still use the same player, and the latest request wins.
   await p.evaluate(()=>{
    qaStarts=[];
    document.querySelector('[data-number-sequence]:not([data-slow])').click();
    document.querySelector('[data-number-sequence][data-slow]').click();
    document.querySelector('[data-number-sequence]:not([data-slow])').click();
   });
   await p.waitForFunction(()=>qaStarts.length>=2);
   assert.deepEqual(await p.evaluate(()=>qaStarts.slice(0,2)),expected.slice(0,2).map(text=>({text,rate:1})));
   assert.equal(await p.evaluate(()=>qaPlayers.length),1);
   await nav(0);const beforeWait=await p.evaluate(()=>qaStarts.length);
   await p.waitForTimeout(1200);
   assert.equal(await p.evaluate(()=>qaStarts.length),beforeWait);
   assert(await p.evaluate(()=>qaAudio.paused&&!qaAudio.getAttribute('src')));
   assert.equal(await p.locator('.follow-along').count(),0);
   await nav(1);
   // A rejected media play leaves a visible explanation and usable text.
   await p.evaluate(()=>{window.qaOriginalPlay=qaAudio.play;qaAudio.play=()=>Promise.reject(Error('QA playback unavailable'));});
   await normal.click();await p.waitForFunction(()=>document.querySelector('.day0-audio-status')?.textContent.includes('未能播放'));
   assert.equal(await p.locator('.follow-token.is-current').count(),0);
   assert.match(await section.locator('.follow-heading strong').innerText(),/未能播放/);
   await p.evaluate(()=>{qaAudio.play=qaOriginalPlay;stopAudio();});
   const screenshots=[];
   for(const width of [1440,390])for(const theme of ['light','dark']){
    await p.setViewportSize({width,height:1080});
    await p.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size='large';},theme);
    await normal.click();await p.waitForFunction(()=>!qaAudio.paused&&qaAudio.currentTime>.05);
    await p.evaluate(()=>qaAudio.pause());
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`${language}/${width}/${theme} overflow`);
    await normal.focus();await normal.hover();
    const file=`${language}-${width}-${theme}.png`;
    await p.screenshot({path:path.join(out,file)});screenshots.push(file);
    // The number glossary is an existing popover: verify it stays on screen in each theme.
    await section.locator('.follow-token').first().click();
    const glossary=p.locator('.jp-glossary');
    assert(await glossary.isVisible());assert((await glossary.innerText()).includes('數字 1'));
    assert(await glossary.evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;}));
    const popover=`${language}-${width}-${theme}-glossary.png`;
    await p.screenshot({path:path.join(out,popover)});screenshots.push(popover);
    await p.keyboard.press('Escape');assert(await glossary.isHidden());
    await p.evaluate(()=>stopAudio());
   }
   assert.deepEqual(errors,[]);
   reports.push({language,sequence:expected,offlineNaturalSequence:true,slowRate:.8,checks:['stop','single number interruption','rapid restart','navigation cancellation','error fallback','keyboard','large text','light/dark','mobile/desktop','glossary bounds'],screenshots,pageErrors:errors});
   await context.close();
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(reports,null,2)+'\n');
  console.log('PASS: Japanese and Korean sequential number audio, interruption, offline playback and 8 responsive/theme states.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
