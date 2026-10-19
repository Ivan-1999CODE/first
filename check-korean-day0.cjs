const fs=require('fs'),path=require('path'),assert=require('assert/strict'),vm=require('vm'),crypto=require('crypto'),http=require('http');
const {pathToFileURL}=require('url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const d=require('./assets/korean-day0-data.cjs'),jp=require('./assets/day0-expanded.cjs'),lex=require('./assets/korean-day0-language.cjs');
const manifest=require('./assets/korean-day0-audio/manifest.json'),timings=require('./assets/korean-day0-audio/timings.json');
const out='tmp/korean-day0-qa';fs.mkdirSync(out,{recursive:true});
const report={tasks:0,flows:0,steps:0,listening:0,layouts:0,clips:0,errors:[],screenshots:[]};
for(const key of ['phrases','replies','flows','missions','pairs','rounds'])assert.equal(d[key].length,jp[key].length,key+' matches Japanese scope');
assert.equal(d.course.day,0);assert.notEqual(d.course.id,jp.course.id);
assert(!/[ぁ-ヿ]/.test(JSON.stringify(d)),'No leftover Japanese kana in Korean data');
assert(!/arigat|gozaimasu|kudasai|onegai|desu ka|futatsu|haraemasu|haraimasu|irimasen|sumimasen|ikura|[ōāūēī]/iu.test(JSON.stringify(d)),'No leftover Japanese romanization');
for(const f of d.flows)for(const t of f.steps)assert(/[가-힣]/.test(t.words),'Every flow has usable Korean keyword hints');
assert(!JSON.stringify(d).includes('日圓'));
for(const r of d.rounds){for(const id of r.phraseIds)assert(d.phrases.some(p=>p.id===id));for(const id of r.flowIds)assert(d.flows[id]);}
for(const [text,name]of Object.entries(manifest)){
 const t=timings[text];assert.equal(t.sha256,crypto.createHash('sha256').update(fs.readFileSync('assets/korean-day0-audio/'+name)).digest('hex'));
 assert(d.day0AudioTranslations[text]);assert(d.readings[text]);let cursor=0,end=0;
 for(const c of t.cues){assert.equal(text.slice(c.from,c.to),c.text);assert(!/[^\s.,!?]/.test(text.slice(cursor,c.from)));assert(c.start>=end&&c.end>c.start);assert(lex.cueReadings[c.text]);cursor=c.to;end=c.end;}
 assert(!/[^\s.,!?]/.test(text.slice(cursor)));
}
const files=['index.html',...fs.readdirSync('.').filter(f=>/^travel-.*\.html$/.test(f))];
for(const file of files){const html=fs.readFileSync(file,'utf8');assert(html.includes(d.file),file+' links to Korean');assert(html.includes('travel-japanese-day0-directions.html'),file+' links to Japanese');for(const [,source]of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(source);}
const overflow=async page=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'No horizontal overflow');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const originalJapanese={answers:{before:'原有日文回答'},complete:['round-a']};
 await context.addInitScript(({key,value})=>{if(!localStorage.getItem('korean-test-seeded')){localStorage.setItem(key,JSON.stringify(value));localStorage.setItem('korean-test-seeded','yes');}const Native=window.Audio;window.Audio=function(...args){return window.qaAudio=new Native(...args);};},{key:jp.course.id,value:originalJapanese});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(d.file)).href);
 assert.equal(await page.locator('#nav button').count(),7);assert.equal(await page.locator('.day-switcher [aria-current="page"]').count(),1);assert.equal(await page.locator('.day-switcher [aria-current="page"]').getAttribute('href'),d.file);
 assert.equal(await page.locator('#field-before').inputValue(),'','Japanese answers not imported');await page.locator('#field-before').fill('韓文課前嘗試');
 const audioTexts=new Set();
 const collect=async()=>{for(const text of await page.locator('#main [data-say]').evaluateAll(es=>es.map(e=>e.dataset.say)))audioTexts.add(text);assert.equal(await page.locator('#main [lang="ja"]').count(),0);};
 const nav=async n=>{await page.evaluate(n=>navigate(n),n);await collect();};
 const gates=async()=>{for(const id of await page.evaluate(()=>currentStep().askFirst?['spoken','heard']:['heard','spoken']))await page.locator('#'+id).check();};
 for(let ri=0;ri<d.rounds.length;ri++){
  const r=d.rounds[ri];await page.evaluate(i=>{setTaskRound(i);navigate(1)},ri);await collect();
  assert.equal(await page.locator('.task-phrase-grid > article').count(),r.phraseIds.length);
  assert.equal(await page.locator('.reading[open]').count(),0,'Romanization starts collapsed');
  for(const card of await page.locator('.task-phrase-grid > article').all()){
   assert(await card.locator('.preview-meaning').isVisible());const read=card.locator(':scope > .reading');await read.locator('summary').click();assert(await read.locator('[lang="ko-Latn"]').isVisible());await read.locator('summary').click();assert(!(await read.locator('[lang="ko-Latn"]').isVisible()));
  }
  await page.locator('[data-study-view="reply"]').click();
  for(const qi of r.replyIds){await page.locator(`[data-reply="${qi}"]`).first().click();await collect();assert.equal(await page.locator('.listening-transcript[open]').count(),0);assert.equal(await page.locator('.role-self details[open]').count(),0);await page.locator('.listening-transcript > summary').click();assert.equal(await page.locator('.listening-translation').innerText(),'中文意思：'+d.replies[qi].zh);assert(await page.locator('.listening-transcript .reading').count());await page.locator('.listening-transcript > summary').click();const correct=d.replies[qi].correct;await page.locator(`[data-listen-choice="${1-correct}"]`).click();assert.match(await page.locator('.listen-feedback').innerText(),/再聽/);await page.locator(`[data-listen-choice="${correct}"]`).click();assert.match(await page.locator('.listen-feedback').innerText(),/✓/);report.listening++;}
  for(const fi of r.flowIds){await page.evaluate(i=>start(i),fi);for(let si=0;si<d.flows[fi].steps.length;si++){
   const t=await page.evaluate(()=>currentStep());await collect();assert.equal(await page.locator('.flow-transcript[open]').count(),0);assert(await page.locator('[data-choice]').first().isDisabled());assert(await page.locator('[data-act="next"]').isDisabled());
   await page.locator('.flow-transcript > summary').click();assert.equal(await page.locator('.flow-transcript .en').innerText(),t.line);assert.equal(await page.locator('.flow-translation').innerText(),'中文意思：'+t.zh);await page.locator('.flow-transcript > summary').click();await gates();await collect();
   const wrong=t.objects.findIndex((_,i)=>!t.valid.includes(i));if(wrong>=0){await page.locator(`[data-choice="${wrong}"]`).click();assert(await page.locator('[data-act="next"]').isDisabled());}
   await page.locator(`[data-choice="${t.valid[0]}"]`).click();if(si===0){await page.locator('#spoken').uncheck();assert(await page.locator('[data-act="next"]').isDisabled());await gates();await page.locator(`[data-choice="${t.valid[0]}"]`).click();}
   await page.locator('[data-act="next"]').click();report.steps++;
  }assert.match(await page.locator('#main').innerText(),/流程完成/);report.flows++;}
  for(const mi of r.missionIds){await nav(3);await page.locator(`[data-mission="${mi}"]`).click();await page.locator('textarea').fill('情境 '+mi);await collect();}
  for(const pi of r.pairIds){await nav(4);await page.locator(`[data-pair="${pi}"]`).click();assert.equal(await page.locator('.teacher[open]').count(),0);await page.locator('[data-pair-check]').first().check();await page.locator('textarea').fill('真人 '+pi);await page.locator('.teacher > summary').click();await collect();}
  report.tasks++;
 }
 // Alternate directions and minutes use Korean audio and update correct objects.
 await page.evaluate(()=>{setTaskRound(1);start(2)});const initial=await page.evaluate(()=>currentStep().line);await page.locator('[data-route-variant]').click();assert.notEqual(await page.evaluate(()=>currentStep().line),initial);await gates();await page.locator(`[data-choice="${await page.evaluate(()=>currentStep().valid[0])}"]`).click();await page.locator('[data-act="next"]').click();assert.match(await page.evaluate(()=>currentStep().line),/오 분/);await page.locator('[data-act="back"]').click();assert.equal(await page.evaluate(()=>turn),0);assert.equal(await page.evaluate(()=>history.length),0);
 await nav(5);await page.locator('#field-after').fill('韓文課後回答');await page.locator('[data-rating="task-A:3"]').click();assert.equal(await page.locator('.meter .green').count(),3);await page.locator('[data-rating="task-A:1"]').click();assert.equal(await page.locator('.meter .green').count(),0);
 await nav(6);for(const q of d.quizzes){await page.locator(`[data-quiz="${q.id}:${1-q.correct}"]`).click();await page.locator(`[data-quiz="${q.id}:${q.correct}"]`).click();}await page.locator('#field-home').fill('課後練習');await page.locator('[data-home="spoken"]').check();await page.locator('.review-task > summary').first().click();await page.locator('[data-field="review-A"]').fill('延後重試');await collect();
 await page.locator('#large').click();await page.locator('#theme').click();await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');assert.equal(await page.locator('html').getAttribute('data-size'),'large');assert.equal(await page.locator('#field-before').inputValue(),'韓文課前嘗試');await nav(5);assert.equal(await page.locator('#field-after').inputValue(),'韓文課後回答');await nav(6);assert.equal(await page.locator('#field-home').inputValue(),'課後練習');assert.equal(await page.locator('[data-field="review-A"]').inputValue(),'延後重試');assert(await page.locator('[data-home="spoken"]').isChecked());
 for(let ri=0;ri<4;ri++){await page.evaluate(i=>setTaskRound(i),ri);for(const mi of d.rounds[ri].missionIds){await nav(3);await page.locator(`[data-mission="${mi}"]`).click();assert.equal(await page.locator('textarea').inputValue(),'情境 '+mi);}await nav(4);assert(await page.locator('[data-pair-check]').first().isChecked());assert.equal(await page.locator('textarea').inputValue(),'真人 '+ri);}
 assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),jp.course.id),originalJapanese,'Japanese record remains untouched');
 // Decode every embedded recording, then exercise real playback and cue cropping.
 report.clips=await page.evaluate(async()=>{const ac=new AudioContext();let count=0;for(const [text,url]of Object.entries(day0Audio)){const b=Uint8Array.from(atob(url.split(',')[1]),c=>c.charCodeAt(0));const a=await ac.decodeAudioData(b.buffer);if(a.duration<.15||day0Timings[text].at(-1).end>a.duration)throw Error('Invalid audio '+text);const samples=a.getChannelData(0);let peak=0;for(const x of samples)peak=Math.max(peak,Math.abs(x));if(peak<.001)throw Error('Silent '+text);count++;}await ac.close();return count;});
 for(const text of audioTexts)assert(manifest[text],'Rendered button has a Korean clip: '+text);
 const glossaryMissing=await page.evaluate(()=>Object.keys(day0Audio).filter(t=>!window.day0Glossary.segments(t).length));assert.deepEqual(glossaryMissing,[],'All spoken text has contextual glossary coverage');
 await page.evaluate(()=>{setTaskRound(0);navigate(1)});
 for(const slow of [false,true]){await page.evaluate(s=>speak('지하철역은 어디예요?',s),slow);await page.waitForFunction(()=>qaAudio.currentTime>.1&&!qaAudio.paused);assert.equal(await page.evaluate(()=>qaAudio.playbackRate),slow?.8:1);assert.equal(await page.locator('.follow-translation').innerText(),'地鐵站在哪裡？');assert(!(await page.locator('.follow-romaji').first().isVisible()));await page.locator('.follow-roman-toggle').click();assert(await page.locator('.follow-romaji').first().isVisible());await page.locator('.follow-roman-toggle').click();await page.locator('.follow-token').first().click();await page.waitForFunction(()=>qaAudio.src.startsWith('blob:')&&!qaAudio.paused&&qaAudio.currentTime>.015);assert(await page.locator('.jp-glossary').isVisible());assert(Math.abs(await page.evaluate(()=>qaAudio.duration)-(timings['지하철역은 어디예요?'].cues[0].end-timings['지하철역은 어디예요?'].cues[0].start))<.01);await page.keyboard.press('Escape');}
 await nav(0);assert(await page.evaluate(()=>qaAudio.paused));assert.equal(await page.locator('.follow-along').count(),0);
 // Keyboard glossary and screenshots include the opened popup, in both themes.
 for(const width of [320,390,768,1440])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:1000});await page.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.size='large'},theme);
  for(let ri=0;ri<4;ri++){await page.evaluate(i=>setTaskRound(i),ri);for(const n of [0,1,2,3,4,5,6]){await nav(n);await overflow(page);report.layouts++;}}
  await page.evaluate(()=>{setTaskRound(0);navigate(1)});const word=page.locator('.task-phrase-grid .jp-word').first();await word.focus();await word.press('Enter');assert(await page.locator('.jp-glossary').isVisible());await page.locator('.jp-glossary .reading > summary').click();assert(await page.locator('.jp-glossary [lang="ko-Latn"]').isVisible());await overflow(page);
  const bounds=await page.locator('.jp-glossary').boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=width+1);assert(bounds.y>=0&&bounds.y+bounds.height<=1001);
  const shot=`${out}/glossary-${width}-${theme}.png`;await page.screenshot({path:shot});report.screenshots.push(shot);await page.keyboard.press('Escape');assert(await word.evaluate(e=>e===document.activeElement));
  if(await page.locator('.unit-menu > summary').isVisible()){if(!await page.locator('.unit-menu').evaluate(e=>e.open))await page.locator('.unit-menu > summary').click();await overflow(page);await page.screenshot({path:`${out}/menu-${width}-${theme}.png`});}
 }
 // No audio capability and blocked storage still leave a working text path.
 const limited=await browser.newContext();await limited.addInitScript(()=>{Storage.prototype.getItem=function(){throw Error('blocked')};Storage.prototype.setItem=function(){throw Error('blocked')};HTMLMediaElement.prototype.play=function(){return Promise.reject(Error('unavailable'))};});const p2=await limited.newPage();await p2.goto(pathToFileURL(path.resolve(d.file)).href);await p2.evaluate(()=>{navigate(1);speak('저기요.')});await p2.waitForFunction(()=>document.querySelector('.day0-audio-status')?.innerText.includes('未能播放'));assert(await p2.locator('#storageNotice').isVisible());await p2.evaluate(()=>start(0));assert(await p2.locator('.flow-transcript').count());await limited.close();
 assert.deepEqual(report.errors,[]);await context.close();
 // Exercise Korean/Japanese/English in the same-document course navigation.
 const server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname.slice(1))||'index.html';if(!files.includes(name)){res.writeHead(404);res.end();return;}res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(name));});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const p=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});await p.goto(`http://127.0.0.1:${server.address().port}/index.html`);await p.evaluate(()=>window.qaIdentity='original');await p.locator(`a[href="./${d.file}"]`).click();
  const active=async()=>{const el=await p.waitForSelector('#travel-app-views iframe[data-active]');return el.contentFrame();};let frame=await active();await frame.waitForSelector('#field-before');assert.equal(await frame.evaluate(()=>language),'ko');await frame.locator('#field-before').fill('HTTP 韓文保存');
  for(const file of ['travel-japanese-day0-directions.html','travel-english.html',d.file]){if(!await frame.locator('.unit-menu').evaluate(e=>e.open))await frame.locator('.unit-menu > summary').click();await frame.locator(`a[href="${file}"]`).click();await p.waitForURL('**/'+file);frame=await active();await frame.waitForSelector('#field-before');assert.equal(await frame.locator('.day-switcher [aria-current="page"]').getAttribute('href'),file);}
  assert.equal(await frame.locator('#field-before').inputValue(),'HTTP 韓文保存');assert.equal(await p.evaluate(()=>window.qaIdentity),'original');await p.goBack();await p.waitForURL('**/travel-english.html');await p.goForward();await p.waitForURL('**/'+d.file);await p.reload();assert.equal(await p.locator('#field-before').inputValue(),'HTTP 韓文保存');await p.close();report.navigation=true;
 }finally{await new Promise(resolve=>server.close(resolve));}
 fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log('PASS',JSON.stringify({...report,screenshots:report.screenshots.length}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
