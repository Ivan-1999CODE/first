const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
if(fs.existsSync('tmp/playwright-browsers'))process.env.PLAYWRIGHT_BROWSERS_PATH=path.resolve('tmp/playwright-browsers');
const {chromium,webkit}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const data=require('./assets/day0-expanded.cjs'),timings=require('./assets/day0-audio/timings.json');
const out='tmp/day0-glossary-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{
 for(const engine of process.argv.includes('--edge')?['edge']:process.argv.includes('--webkit')?['webkit']:['edge','webkit']){
  const browser=engine==='edge'?await chromium.launch({channel:'msedge',headless:true}):await webkit.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:1440,height:1080},hasTouch:true});
   await context.addInitScript(()=>{const Native=Audio;window.Audio=function(...args){return window.qaAudio=new Native(...args);};});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(path.resolve('travel-japanese-day0-directions.html')).href);
   const coverage=await page.evaluate(()=>{
    const lines=[...Object.keys(day0Audio),...phrases.map(p=>p.en),...rounds.flatMap(r=>[...r.words.map(w=>w[0]),...r.hearLines.map(p=>p.en)]),...Object.keys(answerTranslations)];
    for(const line of lines){const parts=day0Glossary.segments(line);if(!parts.length)throw Error('Missing meaning: '+line);
     const covered=new Set(parts.flatMap(p=>Array.from({length:p.to-p.from},(_,i)=>p.from+i)));
     for(let i=0;i<line.length;i++)if(!/[\s。、！？,.!?／/]/u.test(line[i])&&!covered.has(i))throw Error('Uncovered text: '+line);
    }
    for(const [line,cues] of Object.entries(day0Timings))for(const cue of cues){if(!day0Glossary.segments(line).some(p=>p.from<cue.to&&p.to>cue.from))throw Error('Unmapped audio cue: '+cue.text);}
    if(day0Glossary.segments('未知の言葉').length)throw Error('Unknown words must not be guessed');
    if(day0Glossary.segments('これはいくらですか。').map(p=>p.entry.text).join('|')!=='これ|は|いくら|です|か')throw Error('Incorrect particle boundary');
    return {lines:new Set(lines).size,cues:Object.values(day0Timings).flat().length};
   });
   await page.evaluate(()=>navigate(1));
   const panel=page.locator('#japanese-word-meaning'),word=page.locator('.task-phrase-grid .jp-word').filter({hasText:'駅'}).first();
   const originalState=await page.evaluate(()=>JSON.stringify(state));
   await word.click();assert(await panel.isVisible());assert.equal(await panel.locator('.jp-glossary-meaning').innerText(),'車站');assert.equal(await panel.locator('.jp-glossary-reading').innerText(),'えき');
   assert(await page.evaluate(()=>qaAudio.paused&&!qaAudio.getAttribute('src')),'Looking up a word does not start audio');
   assert.equal(await word.getAttribute('aria-expanded'),'true');
   await page.keyboard.press('Escape');assert(await panel.isHidden());assert(await word.evaluate(e=>document.activeElement===e));
   for(const key of ['Enter','Space']){await word.press(key);assert(await panel.isVisible());await panel.getByRole('button',{name:'關閉詞語意思'}).click();assert(await word.evaluate(e=>document.activeElement===e));}
   // Switching words, clicking outside, tabbing away and changing lessons dismiss it.
   await word.click();const particle=page.locator('.task-phrase-grid .jp-word').filter({hasText:/^は$/}).first();await particle.click();
   assert.equal(await panel.locator('.jp-glossary-reading').innerText(),'わ');
   await page.locator('h1').click();assert(await panel.isHidden());
   await word.click();await page.keyboard.press('Tab');await page.keyboard.press('Tab');assert(await panel.isHidden());
   await word.click();await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await page.waitForFunction(()=>document.querySelector('.jp-glossary').hidden);
   // Every task's visible sentences retain exactly the original content and controls.
   for(let ri=0;ri<data.rounds.length;ri++){
    await page.evaluate(ri=>{setTaskRound(ri);navigate(1);},ri);
    for(const card of await page.locator('.japanese-preview-card').all()){
     assert.equal(await card.locator(':scope > .en').textContent(),await card.locator('[data-say]').first().getAttribute('data-say'));
     assert(await card.locator(':scope > .en .jp-word').count());
    }
    const numericTwo=page.locator('.japanese-numbers .jp-word').filter({hasText:/^に$/});await numericTwo.click();
    assert.equal(await panel.locator('.jp-glossary-meaning').innerText(),'數字 2 · 二');await page.keyboard.press('Escape');
   }
   await page.evaluate(()=>{setTaskRound(0);navigate(1);});
   await page.locator('[data-study-view="reply"]').click();
   const transcript=page.locator('.listening-transcript');assert.equal(await transcript.getAttribute('open'),null);assert(await transcript.locator('.jp-word').first().isHidden());
   await transcript.locator(':scope > summary').click();await transcript.locator('.jp-word').first().click();assert(await panel.isVisible());
   await transcript.locator(':scope > summary').click();assert(await panel.isHidden());
   await page.evaluate(()=>navigate(2));const flowText=page.locator('.flow-transcript');assert.equal(await flowText.getAttribute('open'),null);
   await flowText.locator(':scope > summary').click();await flowText.locator('.jp-word').first().click();assert(await panel.isVisible());
   await page.evaluate(()=>navigate(1));assert(await panel.isHidden());
   // A split audio cue points to the whole expression, while preserving cue playback.
   if(engine==='edge'){
    await page.evaluate(()=>speak('すみません。'));await page.waitForFunction(()=>!qaAudio.paused);
    const cards=page.locator('.follow-token');assert.equal(await cards.count(),timings['すみません。'].cues.length);
    for(let i=0;i<await cards.count();i++){
     await cards.nth(i).click();assert(await panel.isVisible());assert.equal(await panel.locator('.jp-glossary-word').innerText(),'すみません');
     assert.match(await panel.locator('.jp-glossary-meaning').innerText(),/不好意思/);assert(await panel.locator('.jp-glossary-fragment').isVisible());
     await page.waitForFunction(()=>qaAudio.src.startsWith('blob:')&&!qaAudio.paused);
     const cue=timings['すみません。'].cues[i];assert(Math.abs(await page.evaluate(()=>qaAudio.duration)-(cue.end-cue.start))<.005);
    }
    await page.screenshot({path:out+'/audio-fragment.png'});await page.evaluate(()=>stopAudio());assert(await panel.isHidden());
   }
   assert.equal(await page.evaluate(()=>JSON.stringify(state)),originalState,'Looking up words leaves answers and progress intact');
   // Touch and large text: popover stays inside the viewport in both themes.
   for(const width of [320,390,768,1440])for(const theme of ['light','dark']){
    await page.setViewportSize({width,height:900});await page.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.size='large';setTaskRound(0);navigate(1);},theme);
    const thanks=page.locator('.task-phrase-grid .jp-word').filter({hasText:/^ありがとうございます$/});
    await thanks.tap();assert(await panel.isVisible());
    const bounds=await panel.boundingBox();assert(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width+1&&bounds.y+bounds.height<=901);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`Overflow ${engine}/${width}/${theme}`);
    if([390,1440].includes(width))await page.screenshot({path:`${out}/${engine}-${width}-${theme}.png`});
    await page.keyboard.press('Escape');
   }
   assert.deepEqual(errors,[]);console.log(`PASS ${engine}: ${coverage.lines} complete texts / ${coverage.cues} mapped cues; direct lookup, whole-expression meanings, keyboard/touch, dismiss, hidden answers, saved state and 8 layouts.`);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
