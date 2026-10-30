// Run after both Day 0 builds. Uses embedded recordings and the real runtime.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {pathToFileURL}=require('url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {make}=require('./assets/day0-primer-data.cjs');
const basic='あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
const ja=make('ja'),ko=make('ko');
assert.equal(ja.groups.filter(g=>g.category==='hiragana').flatMap(g=>g.items.map(i=>i.text)).join(''),basic);
assert.equal(ja.groups.filter(g=>g.category==='katakana').flatMap(g=>g.items.map(i=>i.text)).join(''),Array.from(basic,c=>String.fromCharCode(c.charCodeAt(0)+0x60)).join(''));
assert.equal(ko.groups.filter(g=>g.category==='vowels').flatMap(g=>g.items.map(i=>i.text)).join(''),'ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ');
assert.equal(ko.groups.filter(g=>g.category==='consonants').flatMap(g=>g.items.map(i=>i.text)).join(''),'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ');
for(const data of [ja,ko]){
 assert.equal(new Set(data.groups.map(g=>g.id)).size,data.groups.length);
 for(const item of data.groups.flatMap(g=>g.items))assert(item.text&&item.speakText&&item.zh&&item.romaji);
 for(const q of data.exercises){assert.equal(q.options[q.correct],q.text);assert.equal(new Set(q.options).size,q.options.length);assert(data.groups.some(g=>g.id===q.groupId));}
}
const output='tmp/day0-primer-qa';fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const [language,file] of [['ja','travel-japanese-day0-directions.html'],['ko','travel-korean-day0-directions.html']]){
   const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   await p.addInitScript(()=>{
    const Native=window.Audio;window.primerPlayed=[];
    window.Audio=function(...args){const a=new Native(...args);window.primerAudio=a;a.addEventListener('playing',()=>{const text=Object.entries(day0Audio).find(([,src])=>src===a.src)?.[0];window.primerPlayed.push(text);});return a;};
   });
   await p.goto(pathToFileURL(path.resolve(file)).href);
   assert(await p.evaluate(()=>typeof day0Primer!=='undefined'),'Build must contain primer data');
   // Decode every pronunciation used by the primer and validate recorded cues.
   const decoded=await p.evaluate(async()=>{
    const ac=new AudioContext(),texts=[...new Set(day0Primer.groups.flatMap(g=>g.items.map(i=>i.speakText||i.text)))];
    try{for(const text of texts){
     if(!day0Audio[text])throw Error('Missing embedded primer clip: '+text);
     const raw=Uint8Array.from(atob(day0Audio[text].split(',')[1]),c=>c.charCodeAt(0));
     const recording=await ac.decodeAudioData(raw.buffer),cues=day0Timings[text];
     let peak=0;for(const n of recording.getChannelData(0))peak=Math.max(peak,Math.abs(n));
     if(recording.duration<.1||peak<.005)throw Error('Empty primer audio: '+text);
     if(!cues?.length||cues.some(c=>!c.romaji||c.end<=c.start||c.end>recording.duration+.02||text.slice(c.from,c.to)!==c.text))throw Error('Invalid primer cue: '+text);
    }return texts.length;}finally{await ac.close();}
   });
   if(language==='ja'){
    assert.deepEqual(await p.evaluate(()=>['ハ','ヘ'].map(t=>day0Timings[t][0].romaji)),['ha','he'],'Letter sounds use unambiguous katakana sources');
    for(const [glyph,source]of [['は','ハ'],['へ','ヘ'],['ハ','ハ'],['ヘ','ヘ']])assert.equal(ja.groups.flatMap(g=>g.items).find(i=>i.text===glyph).speakText,source);
   }
   await p.locator('#main textarea').first().fill('保留原本的旅行作答');
   const before=await p.evaluate(()=>({state:JSON.stringify(state),storage:{...localStorage}}));
   await p.locator('[data-primer-open]').press('Enter');
   assert.equal(await p.locator('#nav button').count(),7);
   assert.equal(await p.locator('.primer-letter-card').count(),5);
   const data=make(language),firstGroup=data.groups[0];
   await p.evaluate(()=>primerPlayed=[]);
   await p.locator('[data-primer-sequence]').first().click();
   await p.waitForFunction(n=>primerPlayed.length===n&&primerAudio.ended,firstGroup.items.length,{timeout:20000});
   assert.deepEqual(await p.evaluate(()=>primerPlayed),firstGroup.items.map(i=>i.speakText),'Every first-row sound plays in order');
   assert((await p.locator('.follow-translation').innerText()).startsWith('依序認讀：'));
   assert.equal(await p.locator('.primer-follow .follow-token:not(:disabled)').count(),0,'The letter guide must not open unrelated vocabulary meanings');
   await p.locator('[data-primer-sequence][data-slow]').click();
   await p.waitForFunction(()=>!primerAudio.paused&&primerAudio.currentTime>.05);
   assert.equal(await p.evaluate(()=>primerAudio.playbackRate),.8);
   await p.locator(`.primer-groups [data-primer-group="${data.groups[1].id}"]`).click();
   assert(await p.evaluate(()=>primerAudio.paused&&!primerAudio.getAttribute('src')),'Changing group stops playback');
   // A single letter plays its complete authored sound, with local context.
   if(language==='ko'){
    await p.locator('.primer-letter-button').last().click(); // ㅣ -> 이 (same recording as the number 2)
    await p.waitForFunction(()=>!primerAudio.paused&&primerAudio.currentTime>.05);
    assert((await p.locator('.follow-translation').innerText()).includes('母音 ㅣ'));
    assert(!(await p.locator('.follow-translation').innerText()).includes('數字'));
   }else{
    await p.locator('.primer-letter-button').first().click();
    await p.waitForFunction(()=>!primerAudio.paused&&primerAudio.currentTime>.05);
   }
   await p.locator('[data-primer-view="quiz"]').click();
   assert(await p.evaluate(()=>primerAudio.paused),'Changing exercise stops playback');
   await p.locator('.primer-quiz [data-say]').first().click();
   await p.waitForFunction(()=>!primerAudio.paused&&primerAudio.currentTime>.05);
   assert(await p.locator('.primer-quiz .follow-along').isHidden(),'Listening must not reveal its answer automatically');
   await p.locator('.primer-quiz .follow-token').first().evaluate(token=>token.focus());
   assert(await p.evaluate(()=>!document.activeElement.closest('.follow-along')),'Hidden answer tokens cannot receive keyboard focus');
   await p.locator('[data-primer-view="cards"]').click();
   for(const category of data.categories){
    await p.locator(`[data-primer-category="${category.id}"]`).click();
    for(const g of data.groups.filter(x=>x.category===category.id)){
     await p.locator(`.primer-groups [data-primer-group="${g.id}"]`).click();
     assert.equal(await p.locator('.primer-letter-card').count(),g.items.length);
     if(g.items.some(i=>i.parts)){
      assert.equal(await p.locator('.primer-letter-button').count(),0);
      await p.locator('[data-primer-assemble="0"]').press('Enter');
      assert.equal(await p.locator('.primer-letter-button').count(),1);
     }
     await p.locator('[data-primer-view="quiz"]').click();
     const questions=data.exercises.filter(q=>q.groupId===g.id),q=questions[0];
     await p.locator('[data-primer-answer="'+((q.correct+1)%q.options.length)+'"]').click();
     assert(await p.locator('.primer-feedback .retry').count());
     await p.locator('[data-primer-answer="'+q.correct+'"]').click();
     assert((await p.locator('.primer-feedback').innerText()).includes('選對了'));
     await p.locator('[data-primer-question="'+(questions.length>1?1:0)+'"]').last().click();
     assert.equal(await p.locator('.primer-feedback').innerText(),'');
     await p.locator('[data-primer-view="cards"]').click();
    }
   }
   for(const width of [1440,390,320])for(const theme of ['light','dark']){
    await p.setViewportSize({width,height:1000});
    await p.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size='large';appearance();},theme);
    await p.locator(`[data-primer-category="${data.categories[0].id}"]`).click();
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),language+' overflow '+width+'/'+theme);
    await p.evaluate(()=>window.scrollTo(0,0));
    if(width===1440||width===390)await p.screenshot({path:`${output}/${language}-${width}-${theme}-cards.png`,fullPage:true});
    await p.locator('[data-primer-view="quiz"]').click();
    await p.locator('.primer-quiz-transcript summary').click();
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'quiz overflow');
    if(width===390){await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:`${output}/${language}-${width}-${theme}-transcript.png`,fullPage:true});}
   }
   // Seven-part navigation and the direct return both exit the optional primer.
   await p.evaluate(()=>document.querySelector('#courseMenu').open=true);
   await p.locator('#nav [data-page="1"]').click();
   assert.equal(await p.locator('.day0-primer').count(),0);
   await p.evaluate(()=>navigate(0));
   await p.locator('[data-primer-open]').click();
   await p.locator('[data-primer-view="cards"]').click();
   await p.locator('[data-primer-sequence]').first().click();
   await p.waitForFunction(()=>!primerAudio.paused&&primerAudio.currentTime>.05);
   await p.locator('[data-primer-close]').first().click();
   assert.equal(await p.locator('.day0-primer').count(),0);
   assert(await p.evaluate(()=>primerAudio.paused&&!primerAudio.getAttribute('src')),'Returning to travel stops playback');
   assert.equal(await p.evaluate(()=>JSON.stringify(state)),before.state,'Primer preserves course answers');
   assert.deepEqual(await p.evaluate(()=>({...localStorage})),before.storage,'Primer does not write course records');
   await p.reload();assert.equal(await p.locator('#main textarea').first().inputValue(),'保留原本的旅行作答');
   assert.deepEqual(errors,[]);
   console.log(`PASS ${language}: ${decoded} decoded sounds; real normal/slow sequence and single-letter audio; stops; ${data.groups.length} groups; quiz retry/hidden answers; keyboard; retained answers; six responsive theme states.`);
   await p.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
