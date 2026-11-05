const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {pathToFileURL}=require('url');
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {reviews}=require('./assets/part03-review.cjs');
const out=path.resolve('outputs/part03-review');fs.mkdirSync(out,{recursive:true});
const courses=Array.from({length:14},(_,i)=>i?require('./assets/micro-curriculum.cjs').make(i+1):require('./assets/day1-focus-data.cjs'));
const rows=[],ids=new Set();
for(const [i,d] of courses.entries())for(const f of d.flows)for(const s of f.steps){
 assert(s.choiceReview?.version===2,`Unreviewed Day ${i+1} ${s.id}`);ids.add(s.id);
 assert(s.valid.length&&s.valid.every(v=>s.objects[v]),'valid choice remains available');
 if(s.choiceVisuals)assert.equal(s.choiceVisuals.length,s.objects.length,'one authored drawing per choice');
 rows.push({day:i+1,flow:f.name||f.title||f.id,id:s.id,mode:s.choiceReview.mode,change:s.choiceReview.action,reason:s.choiceReview.reason,prompt:s.choicePrompt,task:s.task,line:s.line,answer:s.answer,before:s.choiceReview.before,options:s.objects.map(o=>o[1]),valid:s.valid});
}
assert.equal(rows.length,192);assert.equal(ids.size,160);assert.deepEqual([...ids].sort(),Object.keys(reviews).sort());
const hotel=require('./assets/day8-integration-data.cjs')(courses[7]);
const integrated=hotel.scenarios.flatMap(c=>c.steps.map(s=>({scenario:c.id,id:s.id,key:s.key,mode:s.choiceReview.mode,prompt:s.choicePrompt,reason:s.choiceReview.reason,options:s.objects.map(o=>o[1]),valid:s.valid})));
assert.equal(integrated.length,35);
for(const c of hotel.scenarios){const s=c.steps.find(s=>s.key==='nights');assert.equal(s.choiceVisuals[s.valid[0]].count,c.nights,'varied nights use matching image, not stale base image');}
const prelude=courses[0].flows.filter(f=>f.prelude).map(f=>({flow:f.id,mode:'apply',reason:'學生先選目的地圖，再問路；兩個地點均有圖片，這是口說目標，不當成未知路線的聽力答案。',...f.prelude}));
assert.equal(prelude.length,1);
fs.writeFileSync(path.join(out,'逐題檢查.json'),JSON.stringify({operations:rows.length+prelude.length+integrated.length,uniqueStandardQuestions:ids.size,standard:rows,prelude,integrated},null,2));
const modes={listen:'聽懂後選擇',apply:'看圖操作',decide:'綜合判斷',preference:'偏好操作'};
fs.writeFileSync(path.join(out,'逐題檢查.txt'),`第三部分逐題檢查\n\n${rows.length} 個一般流程步驟（${ids.size} 個不同題目 ID）＋${prelude.length} 個問路暖身＋${integrated.length} 個飯店整合步驟。\n多種接話順序重用同一組題目，不重複計入。\n\n`+rows.map((r,i)=>`${i+1}. 第 ${r.day} 天｜${r.id}\n類型：${modes[r.mode]}｜${r.change==='rewrite'?'修改題目或選項':'保留並釐清操作目標'}\n判斷依據：${r.reason}\n問題：${r.prompt}\n原選項：${r.before.objects.join('／')}\n現選項：${r.options.join('／')}\n`).join('\n')+'\n問路暖身：'+prelude[0].reason+'\n\n飯店整合：\n'+integrated.map(r=>`${r.scenario}／${r.key}：${r.prompt}（${r.reason}）`).join('\n'));
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 try{
  // Exercise every new drawing and compare distinct visual evidence, without
  // letting SVG accessibility labels alone make identical pictures pass.
  for(const day of [1,2,3,5,6,7,8,9,10,11,12]){
   const d=courses[day-1],p=await browser.newPage();p.on('pageerror',e=>errors.push(e.message));
   await p.goto(pathToFileURL(path.resolve(d.file||(day===1?'travel-english.html':'travel-english-unit2-shopping.html'))).href);
   await p.evaluate(()=>{
    for(const f of flows)for(const t of f.steps){
     if(!t.choiceVisuals)continue;
     const drawings=t.objects.map(o=>{const el=document.createElement('div');el.innerHTML=vfArt(o[1],t);el.querySelectorAll('[aria-label]').forEach(x=>x.removeAttribute('aria-label'));return el.innerHTML;});
     if(new Set(drawings).size!==drawings.length)throw Error('Indistinguishable drawings '+t.id);
    }
    if(course.day===6){const t=flows.flatMap(f=>f.steps).find(t=>t.objects.some(o=>o[1]==='一般糖量'));if(vfArt('少糖',t)===vfArt('一般糖量',t).replace('一般糖量','少糖'))throw Error('Sugar quantities must look different');}
   });await p.close();
  }
  const p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));
  await p.goto(pathToFileURL(path.resolve(courses[2].file)).href);
  for(const theme of ['light','dark']){
   await p.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.size='large';start(flows.findIndex(f=>/gate-and-repeat/.test(f.id)));},theme);
   await p.locator('.scene-board').screenshot({path:path.join(out,`gate-${theme}-locked.png`)});
   await p.locator('#spoken').check();await p.locator('#heard').check();
   const gate=p.locator('[data-choice="0"]');await gate.hover();await gate.focus();
   await p.locator('.scene-board').screenshot({path:path.join(out,`gate-${theme}-ready.png`)});
   await p.locator('[data-choice="1"]').click();assert(await p.locator('[data-act="next"]').isDisabled());assert(!/12/.test(await p.locator('.vf-result').innerText()+await p.locator('#flowFeedback').innerText()));
   await p.locator('.scene-board').screenshot({path:path.join(out,`gate-${theme}-retry.png`)});
   await gate.press('Enter');assert(await p.locator('[data-act="next"]').isEnabled());
   await p.locator('.scene-board').screenshot({path:path.join(out,`gate-${theme}-correct.png`)});
   for(const w of [320,390,1280]){await p.setViewportSize({width:w,height:850});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no overflow '+theme+' '+w);}
   await p.setViewportSize({width:390,height:844});await p.locator('#dg-menu-open').click();await p.locator('#nav [data-dg-task="0"]').hover();await p.locator('#nav [data-dg-task="0"]').focus();await p.screenshot({path:path.join(out,`menu-${theme}.png`)});await p.locator('#dg-menu-close').click();
  }
  await p.close();assert.deepEqual(errors,[]);
  console.log(`PASS: ${ids.size} authored question reviews / ${rows.length} flow steps + ${prelude.length} prelude + ${integrated.length} hotel steps; all custom drawings distinct; gate retry/keyboard/themes/mobile/menus.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
