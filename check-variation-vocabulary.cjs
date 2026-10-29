// Run with node --preserve-symlinks --preserve-symlinks-main.
// Read the generated lessons, then inspect the real Part 2 and Part 4 views.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=__dirname,out=path.join(root,'tmp/variation-vocabulary-qa');
fs.mkdirSync(out,{recursive:true});
const counts=[3,5,6,6,5,9,8,11,9,5,5];
function readLesson(day){
 const file=day===1?'travel-english.html':fs.readdirSync(root).find(f=>f.startsWith('travel-english-unit'+day+'-'));
 const html=fs.readFileSync(path.join(root,file),'utf8');
 const get=key=>JSON.parse(html.match(new RegExp('(?:\\n|<script[^>]*>)const '+key+'=([^\\n]+);(?:\\r?\\n|$)'))[1]);
 return {day,file,course:get('course'),rounds:get('rounds'),missions:get('missions'),phrases:get('phrases'),flows:get('flows')};
}
const lessons=Array.from({length:11},(_,i)=>readLesson(i+1));
const baselineFile=path.join(out,'before.json');
if(fs.existsSync(baselineFile)){
 const before=JSON.parse(fs.readFileSync(baselineFile,'utf8'));
 for(const [i,data]of lessons.entries()){
  for(const field of ['course','missions','phrases','flows'])assert.deepEqual(data[field],before[i][field],`Day ${data.day}: preserve ${field}`);
  assert.deepEqual(data.rounds.map(({variationVocabulary,...r})=>r),before[i].rounds,`Day ${data.day}: preserve tasks and saved-work keys`);
 }
}
const report={days:0,tasks:0,missions:0,saySentences:0,hearSentences:0,audioChecks:0,errors:[],views:[]};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});let p;
 const init=async(page)=>{
  page.on('pageerror',e=>report.errors.push(e.message));page.setDefaultTimeout(10000);
  await page.addInitScript(()=>{
   window.__vocabularySpeech=[];
   Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{cancel(){},getVoices(){return [];},speak(u){window.__vocabularySpeech.push({text:u.text,rate:u.rate});}}});
  });
 };
 const go=async(page,data)=>{
  await page.goto(pathToFileURL(path.join(root,data.file)).href);
  await page.locator('#dg-menu-open').click();await page.locator('#nav [data-page="1"]').click();
 };
 const choose=async(page,i)=>{await page.locator(`.dg-task-switch [data-dg-task="${i}"]`).click();};
 const fits=async(page,label)=>{
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' page width');
  const issues=await page.locator('.study-variation-vocabulary').evaluate(e=>[e,...e.querySelectorAll('*')].filter(el=>{
   if(!el.getClientRects().length)return false;const r=el.getBoundingClientRect();return r.width>0&&(r.left < -1||r.right>innerWidth+1);
  }).map(el=>el.className));
  assert.deepEqual(issues,[],label+' vocabulary bounds');
 };
 try{
  const context=await browser.newContext({viewport:{width:1366,height:900}});p=await context.newPage();await init(p);
  for(const data of lessons){
   await go(p,data);let missionCount=0;
   for(const [i,r]of data.rounds.entries()){
    await choose(p,i);report.tasks++;
    assert.deepEqual(r.variationVocabulary.map(v=>v.missionId),r.missionIds.map(id=>data.missions[id].id),'Each Part 4 prompt has its own prerequisite teaching');
    const block=p.locator('.study-variation-vocabulary');assert.equal(await block.count(),1);assert(await block.isVisible());
    assert.equal(await block.evaluate(e=>!!e.closest('details')),false,'Required words are not hidden in optional disclosures');
    for(const entry of r.variationVocabulary){
     const card=block.locator(`[data-variation-mission="${entry.missionId}"]`);assert.equal(await card.count(),1);
     for(const [en,zh]of [entry.from,entry.to]){
      assert(en&&zh);assert((await card.innerText()).includes(en));assert((await card.innerText()).includes(zh));
      const buttons=card.locator('button[data-say]').filter({hasText:'聽英文'});
      const button=buttons.filter({visible:true});assert.equal(await button.count(),2);
      const regular=card.locator('button[data-say]').filter({hasText:'聽英文'});
      const index=en===entry.from[0]?0:1;await regular.nth(index).click();
      assert.equal(await p.evaluate(()=>window.__vocabularySpeech.at(-1)?.text),en);report.audioChecks++;
     }
     const slow=card.locator('button[data-slow="true"]').last();await slow.click();
     const spoken=await p.evaluate(()=>window.__vocabularySpeech.at(-1));assert.equal(spoken.text,entry.to[0]);assert(spoken.rate<0.9);report.audioChecks++;
     const mission=data.missions.find(m=>m.id===entry.missionId);
     const text=await p.locator('#main').innerText();
     for(const sentence of mission.answer.split(/(?<=[.!?])\s+/)){assert(text.includes(sentence),`D${data.day}/${r.id}: Part 2 teaches speaking: ${sentence}`);report.saySentences++;}
     missionCount++;report.missions++;
    }
    // Independently check all actual variation replies against the visible
    // Part 2 listening cards, including numeric and direction-only changes.
    if(data.day!==1){
     const lines=[r.variation,...r.additionalVariations||[]].flatMap(v=>v.steps.map(s=>s.line));
     const taught=await p.locator('.study-hear-card > .en').allTextContents();
     for(const line of lines){assert(taught.includes(line),`D${data.day}/${r.id}: Part 2 teaches hearing: ${line}`);report.hearSentences++;}
    }
    await fits(p,`D${data.day}/${r.id}`);
   }
   assert.equal(missionCount,counts[data.day-1]);report.days++;console.log(`D${data.day}: ${missionCount} Part 4 prompts taught in Part 2`);
  }
  await context.close();
  // Check representative short/long cards, opened disclosures, all supported
  // themes, enlarged mobile/tablet layouts, and navigation back from Part 4.
  for(const [width,height,theme,size]of [[1366,900,'light','standard'],[1366,900,'dark','large'],[390,844,'light','large'],[390,844,'dark','large'],[1024,768,'dark','large']]){
   const c=await browser.newContext({viewport:{width,height}});p=await c.newPage();await init(p);
   await p.addInitScript(({theme,size})=>{localStorage.setItem('travel-lab-theme',theme);localStorage.setItem('travel-lab-text-size',size);},{theme,size});
   for(const [day,task]of [[1,2],[5,0],[6,1],[8,3]]){
    const data=lessons[day-1];await go(p,data);await choose(p,task);
    await p.locator('.study-variation-vocabulary').scrollIntoViewIfNeeded();await fits(p,`${day}/${width}/${theme}`);
    if(day===5){const text=await p.locator('.study-variation-vocabulary').innerText();for(const word of ['first','第一個','second','第二個','intersection','路口'])assert(text.includes(word));}
    const name=`day${day}-${width}-${theme}-${size}`;await p.screenshot({path:path.join(out,name+'.png')});
    // The ordinary word list must still expand using keyboard and inherit theme.
    const disclosure=p.locator('.study-vocabulary');await disclosure.locator('summary').focus();await p.keyboard.press('Enter');assert(await disclosure.evaluate(e=>e.open));
    await disclosure.scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,name+'-words-open.png')});
    await p.locator('#dg-menu-open').click();await p.locator('#nav [data-page="3"]').click();
    const field=p.locator('textarea[data-field]').first();await field.fill('替換練習保留測試');const key=await field.getAttribute('data-field');
    await p.locator('#dg-menu-open').click();await p.locator('#nav [data-page="1"]').click();
    assert(await p.locator('.study-variation-vocabulary').isVisible());
    await p.locator('#dg-menu-open').click();await p.locator('#nav [data-page="3"]').click();assert.equal(await p.locator(`[data-field="${key}"]`).inputValue(),'替換練習保留測試');
   }
   report.views.push({width,height,theme,size});await c.close();
  }
  assert.equal(report.days,11);assert.equal(report.tasks,44);assert.equal(report.missions,72);assert.deepEqual(report.errors,[]);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log('PASS '+JSON.stringify(report));
 }catch(error){if(p&&!p.isClosed())await p.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});throw error;}
 finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
