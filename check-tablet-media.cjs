// HTTP tablet checks: orientation retains live gates; speech wiring and real recorded audio.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
process.env.PLAYWRIGHT_BROWSERS_PATH=path.resolve('tmp/playwright-browsers');
const {chromium,webkit}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const catalog=require('./assets/curriculum-original.json');
const files=Array.from({length:15},(_,day)=>day===1?'travel-english.html':catalog.find(x=>x.day===day).file);
const out='tmp/tablet-media-qa';fs.mkdirSync(out,{recursive:true});
const report=[];
const server=http.createServer((req,res)=>{const name=decodeURIComponent(req.url.slice(1));if(!files.includes(name)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(name));});
async function nav(p,n){if(!await p.locator('.course-menu').evaluate(e=>e.open))await p.locator('.course-menu>summary').tap();await p.locator(`#nav [data-page="${n}"]`).tap();}
(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/`;
try{for(const engine of ['chromium','webkit']){const b=await (engine==='webkit'?webkit.launch():chromium.launch({channel:'msedge'}));const result={engine,rotation:[],englishControls:[],audio:{},errors:[]};report.push(result);
try{
 for(let day=0;day<15;day++){const p=await b.newPage({viewport:{width:768,height:1024},hasTouch:true,isMobile:true});p.on('pageerror',e=>result.errors.push(e.message));
 await p.addInitScript(()=>{window.realSpeechAvailable=Boolean(window.speechSynthesis&&window.SpeechSynthesisUtterance);window.speechCalls=[];window.cancels=0;window.failSpeech=false;Object.defineProperty(window,'SpeechSynthesisUtterance',{value:function(text){this.text=text;}});Object.defineProperty(window,'speechSynthesis',{value:{paused:false,cancel(){cancels++},resume(){},getVoices(){return [{name:'Test A',lang:'en-US'},{name:'Test B',lang:'en-GB'}]},speak(u){speechCalls.push({text:u.text,rate:u.rate,voice:u.voice?.name});if(failSpeech)u.onerror({error:'synthesis-failed'});else u.onstart?.();}}});const Native=window.Audio;window.Audio=function(...args){return window.testAudio=new Native(...args)};});
 await p.goto(base+files[day]);
 if(day===1){await p.locator('[data-homework-open]').tap();await p.locator('.homework-dialog iframe').waitFor({state:'visible'});assert(await p.locator('.homework-dialog').evaluate(e=>e.open));await p.locator('[data-homework-close]').tap();assert(!await p.locator('.homework-dialog').evaluate(e=>e.open));result.homeworkTouchClose=true;}
 await nav(p,2);
 for(const id of await p.evaluate(()=>currentStep().askFirst?['spoken','heard']:['heard','spoken']))await p.locator(`label:has(#${id})`).tap();
 const valid=await p.evaluate(()=>currentStep().valid[0]);await p.locator(`[data-choice="${valid}"]`).tap();
 const state=await p.evaluate(()=>({heard,spoken,choice,flow,turn,ready:canNext()}));assert(state.ready);
 for(const size of [{width:1024,height:768},{width:1366,height:1024},{width:1024,height:1366},{width:768,height:1024}]){await p.setViewportSize(size);assert.deepEqual(await p.evaluate(()=>({heard,spoken,choice,flow,turn,ready:canNext()})),state);assert.equal(await p.locator('[data-act="next"]').count(),1);assert(!await p.locator('[data-act="next"]').isDisabled());}
 result.rotation.push(day);
 await nav(p,1);
 if(day>0){const play=p.locator('#main [data-say]').first(),text=await play.getAttribute('data-say');await play.tap();assert.equal((await p.evaluate(()=>speechCalls)).at(-1).text,text);assert.equal((await p.evaluate(()=>speechCalls)).at(-1).rate,.9);await p.locator('#main [data-slow="true"]').first().tap();assert(Math.abs((await p.evaluate(()=>speechCalls)).at(-1).rate-.72)<.001);const old=await p.evaluate(()=>cancels);await nav(p,3);assert(await p.evaluate(()=>cancels)>old);await nav(p,1);await p.evaluate(()=>failSpeech=true);await p.locator('#main [data-say]').first().tap();assert.match(await p.locator('.lesson-audio-status').innerText(),/語音未能播放/);assert.equal((await p.evaluate(()=>speechCalls)).at(-1).voice,'Test B');result.englishControls.push({day,nativeSpeechAvailable:await p.evaluate(()=>realSpeechAvailable),normalSlow:true,stopOnNavigation:true,errorFallback:true});
 }else{
 try{
  const decoded=await p.evaluate(async()=>{const ac=new AudioContext();let count=0;try{for(const url of Object.values(day0Audio)){const bytes=Uint8Array.from(atob(url.split(',')[1]),c=>c.charCodeAt(0));const a=await ac.decodeAudioData(bytes.buffer);if(a.duration<.1)throw Error('Empty audio');count++;}return count;}finally{await ac.close();}});result.audio.decoded=decoded;
  const play=p.locator('#main [data-say]').first();await play.tap();await p.waitForFunction(()=>testAudio.currentTime>.1&&!testAudio.paused,{},{timeout:10000});result.audio.normal=true;
  await p.locator('#main [data-slow="true"]').first().tap();await p.waitForFunction(()=>testAudio.currentTime>.1&&!testAudio.paused,{},{timeout:10000});assert.equal(await p.evaluate(()=>testAudio.playbackRate),.8);result.audio.slow=true;
  await p.locator('.follow-token').first().tap();await p.waitForFunction(()=>testAudio.src.startsWith('blob:')&&testAudio.currentTime>.015,{},{timeout:10000});result.audio.word=true;
  await p.locator('.follow-heading button').tap();assert(await p.locator('.follow-words').isHidden());await p.locator('.follow-heading button').tap();assert(await p.locator('.follow-words').isVisible());
  await play.tap();await p.waitForFunction(()=>testAudio.currentTime>.1);await p.locator('.day0-audio-status button').tap();assert(await p.evaluate(()=>testAudio.paused));result.audio.stop=true;
  await play.tap();await p.waitForFunction(()=>testAudio.currentTime>.1);await nav(p,3);assert(await p.evaluate(()=>testAudio.paused));assert.equal(await p.locator('.follow-along').count(),0);result.audio.stopOnNavigation=true;
 }catch(e){result.audio.limitation=e.message;console.log(`${engine} recorded-audio limitation: ${e.message}`);}
 }
 await p.close();}
 assert.deepEqual(result.errors,[]);console.log(`PASS ${engine}: ${result.rotation.length} rotated lessons, ${result.englishControls.length} speech-control checks; audio ${JSON.stringify(result.audio)}`);
}finally{await b.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}}
}finally{await new Promise(resolve=>server.close(resolve));}})().catch(e=>{console.error(e);process.exitCode=1;});
