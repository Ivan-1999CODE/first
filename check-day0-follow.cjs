const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{pathToFileURL}=require('url');
const timings=require('./assets/day0-audio/timings.json'),manifest=require('./assets/day0-audio/manifest.json'),readings=require('./assets/day0-follow-readings.cjs');
for(const [text,name] of Object.entries(manifest)){
 const entry=timings[text];assert(entry);assert.equal(entry.sha256,crypto.createHash('sha256').update(fs.readFileSync('assets/day0-audio/'+name)).digest('hex'));
 let cursor=0,lastEnd=0;
 for(const c of entry.cues){assert.equal(text.slice(c.from,c.to),c.text);assert(!/[^\s。、！？,.!?]/u.test(text.slice(cursor,c.from)));assert(c.start>=lastEnd&&c.end>c.start);assert(readings[c.text]);cursor=c.to;lastEnd=c.end;}
 assert(!/[^\s。、！？,.!?]/u.test(text.slice(cursor)));assert(entry.cues.length);
}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const Native=window.Audio;window.Audio=function(...args){return window.qaAudio=new Native(...args);};});
 await page.goto(pathToFileURL(path.resolve('travel-japanese-day0-directions.html')).href);
 const durations=await page.evaluate(async()=>{const ac=new AudioContext();let count=0;for(const [text,src] of Object.entries(day0Audio)){const bytes=Uint8Array.from(atob(src.split(',')[1]),c=>c.charCodeAt(0));const audio=await ac.decodeAudioData(bytes.buffer);const cues=day0Timings[text];if(cues.at(-1).end>audio.duration)throw Error('Boundary after audio: '+text);count++;}await ac.close();return count;});assert.equal(durations,Object.keys(manifest).length);
 assert.deepEqual(await page.evaluate(()=>Object.keys(day0Audio).filter(text=>!day0AudioTranslations[text]?.trim())),[],'Every recording has a Chinese meaning');
 fs.mkdirSync('tmp/day0-follow-qa',{recursive:true});
 await page.evaluate(()=>{setTaskRound(0);navigate(1);});
 const stationCard=page.locator('.task-phrase-grid > article').filter({hasText:'車站在哪裡？'});
 for(const slow of [false,true]){
  await stationCard.locator(slow?'[data-slow]':'[data-say]:not([data-slow])').first().click();
  assert.equal(await page.locator('.follow-translation').innerText(),'車站在哪裡？');
  assert.equal(await page.locator('.follow-help').count(),0);
  assert.equal(await page.locator('.follow-translation').getAttribute('lang'),'zh-Hant');
  await page.evaluate(t=>document.documentElement.dataset.theme=t,slow?'dark':'light');
  await stationCard.screenshot({path:`tmp/day0-follow-qa/station-translation-${slow?'dark':'light'}.png`});
 }
 await page.locator('.follow-heading button').click();assert(await page.locator('.follow-translation').isHidden());
 await page.locator('.follow-heading button').click();assert(await page.locator('.follow-translation').isVisible());
 await page.evaluate(()=>speak('これを二つください。'));assert.equal(await page.locator('.follow-translation').innerText(),'這個我要兩個');
 await page.evaluate(()=>{setTaskRound(0);navigate(2);});await page.locator('#spoken').check();
 const play=page.locator('.role-other [data-say]').first();await play.click();
 await page.waitForFunction(()=>document.querySelector('.follow-token.is-current'));
 assert.equal(await page.locator('.follow-along').count(),1);assert.equal(await page.locator('.role-other .follow-along').count(),1);
 assert(await page.locator('.follow-token.is-current .follow-romaji').innerText());
 // Seek into every recorded boundary and verify the visible Japanese and romanized text.
 const line=await play.getAttribute('data-say');
 for(const cue of timings[line].cues){await page.evaluate(time=>{qaAudio.pause();qaAudio.currentTime=time;},(cue.start+cue.end)/2);await page.waitForFunction(expected=>document.querySelector('.follow-token.is-current .follow-japanese')?.textContent===expected,cue.text);assert.equal(await page.locator('.follow-token.is-current .follow-romaji').innerText(),readings[cue.text]);}
 fs.mkdirSync('tmp/day0-follow-qa',{recursive:true});
 for(const theme of ['light','dark']){await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.locator('.role-other').screenshot({path:`tmp/day0-follow-qa/${theme}.png`});}
 await page.locator('.follow-heading button').click();assert(await page.locator('.follow-words').isHidden());await page.locator('.follow-heading button').click();assert(await page.locator('.follow-words').isVisible());
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:1080});await page.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.size='large';},theme);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`${width}/${theme}`);if(width===390&&theme==='dark')await page.locator('.role-other').screenshot({path:'tmp/day0-follow-qa/mobile-dark.png'});}
 await page.locator('.role-other [data-slow]').click();assert.equal(await page.evaluate(()=>qaAudio.playbackRate),.8);await page.waitForFunction(()=>document.querySelector('.follow-token.is-current'));assert.equal(await page.locator('.follow-along').count(),1);
 const first=await page.locator('.follow-token.is-current').getAttribute('data-word');await page.waitForFunction(first=>{const e=document.querySelector('.follow-token.is-current');return e&&e.dataset.word!==first;},first);
 await page.waitForFunction(()=>qaAudio.ended);assert.equal(await page.locator('.is-current').count(),0);assert.match(await page.locator('.follow-heading strong').innerText(),/播放完畢/);
 // A composed utterance must use both clips and keep the second clip's boundaries local.
 await page.evaluate(()=>speak('駅です。はい。'));
 assert.equal(await page.locator('.follow-translation').innerText(),'是車站。 是的。');
 await page.waitForFunction(()=>document.querySelector('.follow-token.is-current')?.dataset.clip==='1');assert.equal(await page.locator('.follow-token.is-current .follow-japanese').innerText(),'はい');
 await page.locator('.day0-audio-status button').click();assert(await page.evaluate(()=>qaAudio.paused));assert.equal(await page.locator('.follow-along').count(),0);
 // Word cards play only their recorded cue, without replaying or continuing the sentence.
 const wordLine='ゆっくりお願いします。',wordCues=timings[wordLine].cues;
 for(const slow of [false,true]){
  await page.evaluate(({text,slow})=>speak(text,slow),{text:wordLine,slow});
  await page.waitForFunction(()=>qaAudio.currentTime>.05&&!qaAudio.paused);
  assert.equal(await page.locator('button.follow-token').count(),wordCues.length);
  for(let i=0;i<wordCues.length;i++){
   const cue=wordCues[i],card=page.locator(`.follow-token[data-clip="0"][data-word="${i}"]`);
   await card.click();await page.waitForFunction(()=>qaAudio.src.startsWith('blob:')&&qaAudio.currentTime>.015&&!qaAudio.paused);
   assert.equal(await page.evaluate(()=>qaAudio.playbackRate),slow?.8:1);assert(await page.evaluate(()=>qaAudio.preservesPitch));
   assert(Math.abs(await page.evaluate(()=>qaAudio.duration)-(cue.end-cue.start))<.005,'Only the selected cue is in the recording');
   assert.equal(await page.locator('.follow-token.is-current .follow-japanese').innerText(),cue.text);
   assert.match(await page.locator('.follow-heading strong').innerText(),/單獨聽/);
   await page.waitForFunction(()=>qaAudio.ended);assert.equal(await page.locator('.follow-along').count(),1);assert.equal(await page.locator('.follow-token.is-current').count(),0);
  }
 }
 // Keyboard activation and switching words reuse the same player and keep the cards available.
 const firstWord=page.locator('.follow-token[data-word="0"]');
 for(const key of ['Enter','Space']){await firstWord.focus();await firstWord.press(key);await page.waitForFunction(()=>!qaAudio.paused&&qaAudio.currentTime>.015);await page.waitForFunction(()=>qaAudio.ended);}
 await page.evaluate(()=>{const cards=document.querySelectorAll('.follow-token');cards[0].click();cards[1].click();});
 await page.waitForFunction(()=>document.querySelector('.follow-token.is-current')?.dataset.word==='1');
 await page.waitForFunction(()=>qaAudio.ended);assert.equal(await page.locator('.follow-along').count(),1);
 // A word in the second source clip uses that clip's local timing.
 await page.evaluate(()=>speak('駅です。はい。'));await page.locator('.follow-token[data-clip="1"]').first().click();
 await page.waitForFunction(()=>qaAudio.src.startsWith('blob:')&&qaAudio.currentTime>.015);
 assert(Math.abs(await page.evaluate(()=>qaAudio.duration)-(timings['はい。'].cues[0].end-timings['はい。'].cues[0].start))<.005);
 await page.waitForFunction(()=>qaAudio.ended);
 // Stop or navigate while decoding: stale work must not restart playback.
 await page.evaluate(()=>{const original=AudioContext.prototype.decodeAudioData;window.releaseWordDecode=null;AudioContext.prototype.decodeAudioData=function(...args){const result=original.apply(this,args);return new Promise(resolve=>{window.releaseWordDecode=()=>resolve(result);});};window.restoreWordDecoder=()=>AudioContext.prototype.decodeAudioData=original;speak('ゆっくりお願いします。');});
 await page.locator('.follow-token').first().click();await page.waitForFunction(()=>typeof releaseWordDecode==='function');
 await page.locator('.day0-audio-status button').click();await page.evaluate(()=>{restoreWordDecoder();releaseWordDecode();});
 await page.waitForTimeout(150);assert(await page.evaluate(()=>qaAudio.paused&&!qaAudio.getAttribute('src')));assert.equal(await page.locator('.follow-along').count(),0);
 await page.evaluate(()=>speak('ゆっくりお願いします。'));await page.locator('.follow-token').first().click();await page.waitForFunction(()=>qaAudio.src.startsWith('blob:')&&!qaAudio.paused);
 await page.evaluate(()=>navigate(1));assert(await page.evaluate(()=>qaAudio.paused&&!qaAudio.getAttribute('src')));assert.equal(await page.locator('.follow-along').count(),0);
 await page.evaluate(()=>speak('駅はどこですか。'));await page.waitForFunction(()=>qaAudio.currentTime>.15);await page.evaluate(()=>navigate(1));assert(await page.evaluate(()=>qaAudio.paused));assert.equal(await page.locator('.follow-along').count(),0);
 await page.evaluate(()=>{const original=qaAudio.play;qaAudio.play=()=>Promise.reject(Error('test unavailable'));speak('駅はどこですか。');qaAudio.play=original;});await page.waitForFunction(()=>document.querySelector('.day0-audio-status')?.textContent.includes('未能播放'));assert.equal(await page.locator('.is-current').count(),0);assert.match(await page.locator('.follow-heading strong').innerText(),/未能播放/);
 assert.deepEqual(errors,[]);console.log('PASS: '+durations+' matching audio/timing files; sentence highlighting and word-only normal/slow playback; cue durations, keyboard, rapid switching, second-clip words, cancellation, stop/navigation/failure, and 8 responsive states.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
