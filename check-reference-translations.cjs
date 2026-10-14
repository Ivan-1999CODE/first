const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const catalog=require('./assets/curriculum-original.json');
const out='tmp/english-reference-translations';fs.mkdirSync(out,{recursive:true});
const examples={
  1:['Excuse me. How do I get to the train station?','不好意思。請問火車站怎麼走？'],
  3:['One bag, please.','我要托運 1 件行李，謝謝。'],
  6:['Medium, please.','我要五分熟，謝謝。'],
  7:['Medium, please.','我要 M 號，謝謝。'],
  8:['Two, please.','我要 2 條，謝謝。'],
  9:['Two, please.','2 位，謝謝。'],
  10:['Two, please.','我要 2 張，謝謝。'],
  14:['Sorry, could you say that again? Nine, in the lobby. Right?','不好意思，可以請你再說一次嗎？9 點，在大廳。對嗎？']
};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),report=[];
 try{for(let day=1;day<=14;day++){
  const file=day===1?'travel-english.html':catalog.find(x=>x.day===day).file;
  const p=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[],seen=new Set();
  p.on('pageerror',e=>errors.push(e.message));await p.goto(pathToFileURL(path.resolve(file)).href);
  const data=await p.evaluate(()=>({course,rounds,phrases,replies,flows,missions,pairs,quizzes,homeAnswer,reviewTasks:typeof reviewTasks==='undefined'?[]:reviewTasks,answerTranslations}));
  if(examples[day])assert.equal(data.answerTranslations[examples[day][0]],examples[day][1]);
  if(day===3){assert.equal(data.answerTranslations['With a friend.'],'住在朋友家。');assert.equal(data.answerTranslations['I’m here on business. Two weeks. With a friend.'],'我是來出差的。2 週。住在朋友家。');}
  const sections=new Set();let rendered=0,transcripts=0;
  async function inspect(section){
   const result=await p.evaluate(()=>{
    const refs=[...document.querySelectorAll('#main details')].filter(d=>d.querySelector(':scope > summary')?.textContent==='完整參考說法');
    return refs.map(d=>{
     const en=d.querySelector(':scope > .en'),zh=en?.nextElementSibling;
     const parents=[];for(let el=d;el;el=el.parentElement)if(el.tagName==='DETAILS')parents.push([el,el.open]);
     const initial={closed:!d.open,hidden:!zh?.checkVisibility()};
     for(const [el]of parents)el.open=true;
     const er=en?.getBoundingClientRect(),zr=zh?.getBoundingClientRect();
     const value={en:en?.textContent,zh:zh?.textContent,lang:zh?.lang,className:zh?.className,...initial,visible:zh?.checkVisibility(),ordered:er&&zr&&er.bottom<=zr.top,audio:[...d.querySelectorAll(':scope > .actions [data-say]')].map(b=>b.dataset.say)};
     for(const [el,open]of parents)el.open=open;
     return value;
    });
   });
   assert(result.length,`Day ${day}, part ${section}: missing reference controls`);
   for(const ref of result){
    assert(ref.closed&&ref.hidden,'Reference translation must start hidden');
    assert.equal(ref.className,'reference-translation');assert.equal(ref.lang,'zh-Hant');
    assert.match(ref.zh,/^中文意思：[\u3400-\u9fff0-9]/);
    assert.equal(ref.zh,'中文意思：'+data.answerTranslations[ref.en]);
    assert(ref.visible&&ref.ordered,'Expanded Chinese is visible below English');
    assert.deepEqual(ref.audio,[ref.en,ref.en],'Both English audio controls are preserved');
    seen.add(ref.en);rendered++;
   }
   // Exercise actual clicks once per section, including the keyword-only stage.
   if(!sections.has(section)){
    const detail=p.locator('#main details').filter({has:p.locator(':scope > summary', {hasText:/^完整參考說法$/})}).first();
    await detail.evaluate(el=>{for(let parent=el.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;});
    const zh=detail.locator(':scope > .reference-translation');assert(!(await zh.isVisible()));
    await detail.locator(':scope > summary').click();assert(await zh.isVisible());
    await detail.locator(':scope > summary').click();assert(!(await zh.isVisible()));
    sections.add(section);
   }
  }
  async function counterpart(expected){
   const details=p.locator('#main details').filter({has:p.locator(':scope > summary', {hasText:/^對方英文與中文$/})});
   assert.equal(await details.count(),1);assert.equal(await details.getAttribute('open'),null);
   await details.locator(':scope > summary').click();
   assert.equal(await details.locator(':scope > .en').innerText(),expected.line);
   assert.match(expected.zh,/[\u3400-\u9fff]/);
   assert((await details.innerText()).includes(expected.zh),'Counterpart Chinese is visible');
   await details.locator(':scope > summary').click();transcripts++;
  }
  for(let ri=0;ri<data.rounds.length;ri++){
   const r=data.rounds[ri];await p.evaluate(({day,ri})=>{if(day===1)setRound(ri);else setTaskRound(ri);navigate(1);},{day,ri});
   // Sentence and counterpart study cards retain their existing meanings.
   const study=await p.locator('.study-meaning').allTextContents();assert(study.length);assert(study.every(s=>/[\u3400-\u9fff]/.test(s)));
   if(await p.locator('.reference-translation').count())await inspect(2);
   for(const qi of [...r.replyIds,...r.extraReplyIds||[]]){
    await p.evaluate(qi=>{mode='reply';reply=qi;render();},qi);await inspect(2);await counterpart(data.replies[qi]);
   }
   for(const fi of r.flowIds||[ri])for(let si=0;si<data.flows[fi].steps.length;si++){
    await p.evaluate(({fi,si})=>{start(fi);turn=si;resetTurn();render();},{fi,si});
    await inspect(3);await counterpart(await p.evaluate(()=>currentStep()));
    // Visit every authored branch as well as the base step.
    const step=data.flows[fi].steps[si];for(const selected of Object.keys(step.when?.cases||{})){
     await p.evaluate(({selected,step})=>{history=[];history[flows[flow].steps.findIndex(t=>t.id===step)]=Number(selected);render();},{selected,step:step.when.step});
     await inspect(3);await counterpart(await p.evaluate(()=>currentStep()));
    }
   }
   for(const mi of r.missionIds){await p.evaluate(mi=>{mission=mi;navigate(3);},mi);await inspect(4);}
   for(const pi of r.pairIds){await p.evaluate(pi=>{pair=pi;navigate(4);},pi);await inspect(5);}
  }
  await p.evaluate(()=>navigate(5));await inspect(6);
  await p.evaluate(()=>navigate(6));await inspect(7);
  const quizTexts=await p.locator('#main details').filter({has:p.locator(':scope > summary',{hasText:/^對方英文與中文$/})}).allTextContents();
  for(const q of data.quizzes)assert(quizTexts.some(s=>s.includes(q.zh)&&s.includes(q.line)),'Homework listening includes both languages');
  assert.deepEqual([...seen].sort(),Object.keys(data.answerTranslations).sort(),'All reference answers are reachable and translated');
  assert.deepEqual([...sections].sort(),[2,3,4,5,6,7]);
  // Long references remain readable on phones and tablets in both themes.
  let layouts=0;
  for(const width of [390,768,1440])for(const theme of ['light','dark']){
   await p.setViewportSize({width,height:1080});
   await p.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size='large';navigate(6);for(const d of document.querySelectorAll('#main details'))d.open=true;},theme);
   assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)),`Day ${day}: overflow ${width}/${theme}`);
   assert(await p.locator('.reference-translation').first().isVisible());layouts++;
  }
  if([3,9].includes(day)){
   await p.setViewportSize({width:day===3?1440:390,height:1000});
   if(day===3){await p.evaluate(()=>{start(0);for(const d of document.querySelectorAll('.role-self details'))d.open=true;});await p.locator('.role-self').screenshot({path:path.join(out,'day3-reference-dark.png')});}
   else await p.locator('.reference-translation').first().locator('..').screenshot({path:path.join(out,'day9-reference-mobile.png')});
  }
  assert.deepEqual(errors,[]);report.push({day,uniqueReferences:seen.size,renderedReferences:rendered,counterpartTranscripts:transcripts,parts:[...sections],layouts});
  console.log(`PASS Day ${day}: ${seen.size} reference translations; parts 2–7; ${transcripts} counterpart transcripts`);await p.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 console.log('PASS '+report.length+' English lessons; '+report.reduce((n,r)=>n+r.uniqueReferences,0)+' lesson-specific references; '+report.reduce((n,r)=>n+r.layouts,0)+' layouts');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
