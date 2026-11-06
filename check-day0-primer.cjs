// Run after both Day 0 builds. Uses embedded recordings and the real runtime.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {pathToFileURL}=require('url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {make}=require('./assets/day0-primer-data.cjs');
const basic='あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
const ja=make('ja'),ko=make('ko');
assert.equal(ja.groups.filter(g=>g.category==='hiragana').flatMap(g=>g.items.map(i=>i.text)).join(''),basic);
assert.equal(ja.groups.filter(g=>g.category==='katakana').flatMap(g=>g.items.map(i=>i.text)).join(''),Array.from(basic,c=>String.fromCharCode(c.charCodeAt(0)+0x60)).join(''));
assert.equal(ko.groups.filter(g=>g.category==='vowels'&&g.overviewSection==='basic').flatMap(g=>g.items.map(i=>i.text)).join(''),'ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ');
assert.equal(ko.groups.filter(g=>g.category==='consonants'&&g.overviewSection==='basic').flatMap(g=>g.items.map(i=>i.text)).join(''),'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ');
assert.equal(ko.groups.filter(g=>g.category==='vowels'&&g.overviewSection==='extended').flatMap(g=>g.items.map(i=>i.text)).join(''),'ㅐㅒㅔㅖㅘㅙㅚㅝㅞㅟㅢ');
assert.equal(ko.groups.filter(g=>g.category==='consonants'&&g.overviewSection==='extended').flatMap(g=>g.items.map(i=>i.text)).join(''),'ㄲㄸㅃㅆㅉ');
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
   await p.evaluate(()=>{
    const create=Day0Practice.createSession;
    Day0Practice.createSession=function(questions){const session=create(questions);window.primerSession=session;return session;};
   });
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
   await p.locator('.dg-entry-note > summary').click();
   await p.locator('#main textarea').first().fill('保留原本的旅行作答');
   const before=await p.evaluate(()=>({state:JSON.stringify(state),storage:{...localStorage}}));
   await p.locator('[data-primer-open]').press('Enter');
   assert.equal(await p.locator('#nav button').count(),7);
   const data=make(language),firstGroup=data.groups[0];
   const overview=async()=>{
    if(await p.locator('[data-primer-overview]').count())await p.locator('[data-primer-overview]').first().click();
    assert(await p.locator('.primer-overview').isVisible(),'Opening or returning shows the complete overview');
   };
   const selectGroup=async g=>{
    await overview();
    if(language==='ja'&&['hiragana','katakana'].includes(g.category))await p.locator(`[data-primer-script="${g.category}"]`).click();
    await p.locator(`.primer-overview [data-primer-group="${g.id}"]`).click();
    assert(await p.locator('.primer-detail').isVisible(),'Select a group from the overview before practising');
   };
   await overview();
   assert.equal(await p.locator('.primer-letter-card').count(),0,'Initial entry must not skip the overview');
   assert.equal(await p.locator('.primer-map-sound').count(),language==='ja'?46:40);
   assert.match(await p.locator('[data-primer-close]').first().innerText(),/返回旅行會話/);
   await selectGroup(firstGroup);
   assert.equal(await p.locator('.primer-letter-card').count(),firstGroup.items.length);
   await p.evaluate(()=>primerPlayed=[]);
   await p.locator('[data-primer-sequence]').first().click();
   await p.waitForFunction(n=>primerPlayed.length===n&&primerAudio.ended,firstGroup.items.length,{timeout:20000});
   assert.deepEqual(await p.evaluate(()=>primerPlayed),firstGroup.items.map(i=>i.speakText),'Every first-row sound plays in order');
   assert((await p.locator('.follow-translation').innerText()).startsWith('依序認讀：'));
   assert.equal(await p.locator('.primer-follow .follow-token:not(:disabled)').count(),0,'The letter guide must not open unrelated vocabulary meanings');
   await p.locator('[data-primer-sequence][data-slow]').click();
   await p.waitForFunction(()=>!primerAudio.paused&&primerAudio.currentTime>.05);
   assert.equal(await p.evaluate(()=>primerAudio.playbackRate),.8);
   await selectGroup(data.groups[1]);
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
   await p.locator(`[data-practice-start="group:${data.groups[1].id}"]`).click();
   assert(await p.evaluate(()=>primerAudio.paused),'Starting a practice round stops playback');
   assert.equal(await p.locator('.primer-study-content').count(),0,'Study answers are not rendered during practice');
   await p.locator('.primer-practice [data-practice-audio]').first().click();
   await p.waitForFunction(()=>!primerAudio.paused&&primerAudio.currentTime>.05);
   assert(await p.locator('.primer-practice .follow-along').isHidden(),'Listening must not reveal its answer automatically');
   await p.locator('.primer-practice .follow-token').first().evaluate(token=>token.focus());
   assert(await p.evaluate(()=>!document.activeElement.closest('.follow-along')),'Hidden answer tokens cannot receive keyboard focus');
   await p.locator('[data-practice-exit]').click();
   assert(await p.evaluate(()=>primerAudio.paused&&!primerAudio.getAttribute('src')),'Exiting a practice round stops playback');
   for(const category of data.categories){
    for(const g of data.groups.filter(x=>x.category===category.id)){
     await selectGroup(g);
     assert.equal(await p.locator('.primer-letter-card').count(),g.items.length);
     if(g.items.some(i=>i.parts)){
      assert.equal(await p.locator('.primer-letter-button').count(),0);
      await p.locator('[data-primer-assemble="0"]').press('Enter');
      assert.equal(await p.locator('.primer-letter-button').count(),1);
     }
     const placement=await p.evaluate(()=>({cards:document.querySelector('.primer-letter-grid').getBoundingClientRect().bottom,practice:document.querySelector('.primer-practice').getBoundingClientRect().top}));
     assert(placement.practice>=placement.cards,'Each group practice appears below the study cards');
     await p.locator('[data-practice-mode="listen"]').click();
     await p.locator('[data-practice-limit="5"]').click();
     await p.locator(`[data-practice-start="group:${g.id}"]`).click();
     const q=await p.evaluate(()=>primerSession.questions[primerSession.index]);
     assert.equal(q.mode,'listen','Every current group supports recorded listening choices');
     assert.equal(await p.locator('[data-practice-next]').isDisabled(),true);
     await p.locator('[data-practice-answer="'+((q.correct+1)%q.options.length)+'"]').click();
     assert(await p.locator('.pp-options .is-wrong').isVisible());
     assert.equal(await p.locator('[data-practice-next]').isDisabled(),true);
     await p.locator('[data-practice-answer="'+q.correct+'"]').click();
     assert(await p.locator('.pp-options .is-correct').isVisible());
     assert((await p.locator('.pp-feedback').innerText()).includes('重試後答對'));
     assert.equal(await p.evaluate(()=>primerSession.records[0].first),false,'Correction preserves the first response');
     const count=await p.evaluate(()=>primerSession.questions.length);
     assert.equal(count,Math.min(5,g.items.length),'Small groups advertise their actual question count');
     if(count>1){
      await p.locator('[data-practice-next]').click();
      assert.equal(await p.locator('.pp-feedback').innerText(),'');
      assert.equal(await p.locator('.pp-reference').count(),0,'The next question hides its reference');
     }
     // Leave before the explicit last-next action: this check must preserve
     // every pre-existing record, including the independent practice history.
     await p.locator('[data-practice-exit]').click();
     assert.equal(await p.evaluate(()=>primerSession.finished),false,'Exit does not count as finishing');
    }
   }
   for(const width of [1440,768,390,320])for(const theme of ['light','dark']){
    await p.setViewportSize({width,height:1000});
    await p.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size='large';appearance();},theme);
    await overview();
    if(language==='ja')await p.locator('[data-primer-script="hiragana"]').click();
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),language+' overview overflow '+width+'/'+theme);
    if(width===1440||width===390){await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:`${output}/${language}-${width}-${theme}-overview.png`,fullPage:true});}
    await selectGroup(firstGroup);
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),language+' overflow '+width+'/'+theme);
    await p.evaluate(()=>window.scrollTo(0,0));
    if(width===1440||width===390)await p.screenshot({path:`${output}/${language}-${width}-${theme}-cards.png`,fullPage:true});
    await p.locator(`[data-practice-start="group:${firstGroup.id}"]`).click();
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'practice question overflow');
    await p.screenshot({path:`${output}/${language}-${width}-${theme}-practice.png`,fullPage:true});
    await p.locator('[data-practice-reveal]').click();
    assert(await p.locator('.pp-reference').isVisible());
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'practice reference overflow');
    await p.screenshot({path:`${output}/${language}-${width}-${theme}-reference.png`,fullPage:true});
    await p.locator('[data-practice-exit]').click();
    await p.locator('#dg-menu-open').click();
    await p.screenshot({path:`${output}/${language}-${width}-${theme}-menu.png`});
    await p.keyboard.press('Escape');
   }
   // Seven-part navigation and the direct return both exit the optional primer.
   await p.locator('#dg-menu-open').click();
   await p.locator('#nav [data-page="1"]').click();
   assert.equal(await p.locator('.day0-primer').count(),0);
   await p.evaluate(()=>navigate(0));
   await p.locator('[data-primer-open]').click();
   await overview();
   await selectGroup(firstGroup);
   await p.locator('[data-primer-sequence]').first().click();
   await p.waitForFunction(()=>!primerAudio.paused&&primerAudio.currentTime>.05);
   await p.locator('[data-primer-close]').first().click();
   assert.equal(await p.locator('.day0-primer').count(),0);
   assert(await p.evaluate(()=>primerAudio.paused&&!primerAudio.getAttribute('src')),'Returning to travel stops playback');
   assert.equal(await p.evaluate(()=>JSON.stringify(state)),before.state,'Primer preserves course answers');
   assert.deepEqual(await p.evaluate(()=>({...localStorage})),before.storage,'Primer does not write course records');
   await p.reload();assert.equal(await p.locator('#main textarea').first().inputValue(),'保留原本的旅行作答');
   assert.deepEqual(errors,[]);
   console.log(`PASS ${language}: complete overview and group entry; ${decoded} decoded sounds; real normal/slow sequence and single-letter audio; stops; ${data.groups.length} lower practice entries; first-response retry/hidden answers; keyboard; retained answers; eight responsive theme states with expanded menus.`);
   await p.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
