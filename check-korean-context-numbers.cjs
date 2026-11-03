const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
// Default remains Korean; pass ja to verify the matching Japanese references.
const language=process.argv.includes('ja')?'ja':'ko',name=language==='ja'?'japanese':'korean';
const data=require(`./assets/${name}-number-lessons.cjs`);
const items=lesson=>lesson.groups.flatMap(g=>g.items);
if(language==='ko'){
assert.deepEqual(items(data.quantity).map(i=>i.text),['한 개','두 개','세 개','네 개','다섯 개','여섯 개','일곱 개','여덟 개','아홉 개','열 개']);
assert.deepEqual(items(data.price).map(i=>i.text),['백 원','이백 원','삼백 원','오백 원','천 원','이천 원','삼천 원','오천 원','천오백 원','삼천오백 원','만 원']);
}else{
 assert.deepEqual(items(data.quantity).map(i=>i.text),['ひとつ','ふたつ','みっつ','よっつ','いつつ','むっつ','ななつ','やっつ','ここのつ','とお']);
 assert.deepEqual(items(data.price).map(i=>i.zh),[100,200,300,400,500,600,700,800,900,1000,2000,3000,4000,5000,6000,7000,8000,9000,1500,3800,10000].map(n=>n.toLocaleString('en-US')+' 日圓'));
 for(const [text,kana]of Object.entries({'三百円':'さんびゃくえん','六百円':'ろっぴゃくえん','八百円':'はっぴゃくえん','三千円':'さんぜんえん','八千円':'はっせんえん','三千八百円':'さんぜんはっぴゃくえん'})){
  const item=items(data.price).find(i=>i.text===text);assert.equal(item.kana,kana);assert(item.special);
 }
}
const out=path.resolve(`tmp/${name}-context-numbers`);fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1360,height:1000},reducedMotion:'reduce'});
  const p=await context.newPage(),errors=[];p.setDefaultTimeout(10000);p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{const Native=window.Audio;window.numberPlayed=[];window.Audio=function(...args){const a=new Native(...args);window.numberAudio=a;a.addEventListener('playing',()=>numberPlayed.push(Object.entries(day0Audio).find(([,src])=>src===a.src)?.[0]));return a;};});
  await p.goto(pathToFileURL(path.resolve(`travel-${name}-day0-directions.html`)).href);await context.setOffline(true);
  const nav=async n=>{await p.locator('#dg-menu-open').click();await p.locator(`#nav [data-page="${n}"]`).click();};
  const task=async n=>{await p.locator('#day0-task-open').click();await p.locator(`[data-day0-task="${n}"]`).click();};
  const texts=Object.values(data).flatMap(items).map(i=>i.text);
  const decoded=await p.evaluate(async texts=>{
   const ac=new AudioContext();try{for(const text of texts){
    if(!day0Audio[text])throw Error('Missing whole-phrase recording: '+text);
    const bytes=Uint8Array.from(atob(day0Audio[text].split(',')[1]),c=>c.charCodeAt(0));
    const audio=await ac.decodeAudioData(bytes.buffer),cues=day0Timings[text];let peak=0;
    for(const n of audio.getChannelData(0))peak=Math.max(peak,Math.abs(n));
    if(audio.duration<.1||peak<.005)throw Error('Silent recording: '+text);
    if(!cues.length||cues.some(c=>c.end>audio.duration+.02||c.end<=c.start||!c.romaji||text.slice(c.from,c.to)!==c.text))throw Error('Invalid cues: '+text);
   }return texts.length;}finally{await ac.close();}
  },texts);
  assert.equal(decoded,language==='ja'?31:21);
  await p.locator('.dg-entry-note > summary').click();await p.locator('[data-field="entry-before-A"]').fill('問價紀錄保留');
  await nav(1);
  assert.equal(await p.locator('[data-number-context]').getAttribute('data-number-context'),'price');
  assert.deepEqual(await p.locator('[data-number-context] .task-words > div > span').allTextContents(),items(data.price).map(i=>i.text));
  if(language==='ja'){assert.equal(await p.locator('.number-special').count(),6);assert.deepEqual(await p.locator('.japanese-number-group .preview-kana').allTextContents(),items(data.price).map(i=>i.kana));}
  // Play a whole composed amount, then change task while it is playing.
  const composed=language==='ja'?'三千八百円':'삼천오백 원';
  await p.locator(`[data-number-context] [data-say="${composed}"]:not([data-slow])`).click();
  await p.waitForFunction(text=>numberPlayed.includes(text)&&numberAudio.currentTime>.05,composed);
  await task(1);assert(await p.evaluate(()=>numberAudio.paused&&!numberAudio.getAttribute('src')));
  await nav(1);
  assert.equal(await p.locator('[data-number-context]').getAttribute('data-number-context'),'quantity');
  assert.deepEqual(await p.locator('[data-number-context] .task-words > div > span').allTextContents(),items(data.quantity).map(i=>i.text));
  await p.evaluate(()=>numberPlayed=[]);await p.locator('[data-number-sequence]:not([data-slow])').click();
  await p.waitForFunction(()=>numberPlayed.length===10&&numberAudio.ended,null,{timeout:60000});
  assert.deepEqual(await p.evaluate(()=>numberPlayed),items(data.quantity).map(i=>i.text));
  assert.equal(await p.locator('.follow-translation').innerText(),await p.evaluate(texts=>texts.map(t=>day0AudioTranslations[t]).join(' '),items(data.quantity).map(i=>i.text)));
  await p.locator('[data-number-sequence][data-slow]').click();await p.waitForFunction(()=>!numberAudio.paused&&numberAudio.currentTime>.05);
  assert.equal(await p.evaluate(()=>numberAudio.playbackRate),.8);
  await nav(2);assert(await p.evaluate(()=>numberAudio.paused&&!numberAudio.getAttribute('src')));
  assert.match(await p.locator('.practical-number-drawer > summary').innerText(),/數物品/);
  await p.locator('.practical-number-drawer > summary').click();assert(await p.locator('[data-number-context="quantity"]').isVisible());
  await task(2);await nav(1);assert.equal(await p.locator('[data-number-context]').getAttribute('data-number-context'),'price');
  for(const n of [3,4,5,6,7,8,9]){await task(n);await nav(1);assert.equal(await p.locator('[data-number-context]').count(),0);await nav(2);assert.equal(await p.locator('.practical-number-drawer').count(),0);}

  for(const [n,lesson]of [[0,data.price],[1,data.quantity]])for(const width of [1360,390,320])for(const theme of ['light','dark']){
   await p.setViewportSize({width,height:1000});await task(n);await nav(1);
   await p.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.size='large';appearance();},theme);
   const section=p.locator('[data-number-context]');await section.scrollIntoViewIfNeeded();
   await section.locator('.reading > summary').first().click();
   const button=section.locator('.task-words [data-say]:not([data-slow])').first();await button.hover();await button.focus();await p.keyboard.press('Tab');await p.keyboard.press('Shift+Tab');
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No overflow with expanded reading, '+width+'/'+theme);
   assert(await button.evaluate(e=>getComputedStyle(e).outlineStyle!=='none'),'Visible keyboard focus');
   await section.screenshot({path:path.join(out,`${lesson.id}-${width}-${theme}.png`)});
   await nav(2);await p.locator('.practical-number-drawer > summary').click();
   if(width===390)await p.locator('.practical-number-drawer').screenshot({path:path.join(out,`${lesson.id}-${theme}-drawer.png`)});
  }
  await p.reload();await task(0);assert.equal(await p.locator('[data-field="entry-before-A"]').inputValue(),'問價紀錄保留');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({status:'passed',contexts:2,quantity:10,prices:items(data.price).length,decodedWholePhrases:decoded,offline:true,widths:[1360,390,320],themes:['light','dark'],errors},null,2));
  console.log('PASS: correct context, all context recordings decoded offline, quantity sequence/slow playback, stops, saved answers, mobile/dark/large text.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
