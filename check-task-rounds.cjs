// Expanded curriculum validation replaces fixed 3/4-round expectations.
if(require('fs').readFileSync('travel-japanese-day0-directions.html','utf8').includes('travel-lab-day0-rounds-v3')){require('./check-all-task-rounds.cjs');return;}
const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),vm=require('vm'),crypto=require('crypto');
const lessons=[{file:'travel-english-unit2-shopping.html',data:require('./assets/day2-rounds-data.cjs')},{file:'travel-japanese-day0-directions.html',data:require('./assets/day0-rounds-data.cjs')}].filter(x=>process.argv.includes('--day0')?x.data.course.day===0:process.argv.includes('--day2')?x.data.course.day===2:true);
const original=require('./assets/day1-2-data.cjs')[1];
assert.deepEqual(require('./assets/day2-rounds-data.cjs').phrases,original.phrases,'Retain all 14 original shopping phrases');
for(const {file,data:d} of lessons){
 const html=fs.readFileSync(file,'utf8');for(const [,script] of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script);
 for(const r of d.rounds){for(const id of r.phraseIds)assert(d.phrases.some(p=>p.id===id));for(const [ids,items] of [[r.replyIds,d.replies],[r.flowIds,d.flows],[r.missionIds,d.missions],[r.pairIds,d.pairs]])for(const i of ids)assert(items[i]);}
}
const oldSentinel={answers:{before:'保留我的原本說法',after:'原本的課後版本',home:'舊課後練習','mission-old':'原來的情境作答'},checks:{old:[true]},ratings:{ask:3},complete:['station'],home:{spoken:true}};
const out='tmp/task-rounds-qa';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const {file,data:d} of lessons){
  const context=await browser.newContext({viewport:{width:1440,height:1080}});
  await context.addInitScript(({key,old})=>{if(!localStorage.getItem('test-seeded')){localStorage.setItem(key,JSON.stringify(old));localStorage.setItem('test-seeded','true');}const NativeAudio=window.Audio;window.Audio=function(...args){const a=new NativeAudio(...args);window.testAudio=a;return a;};},{key:d.previousLesson.key,old:oldSentinel});
  const p=await context.newPage(),errors=[],audioTexts=new Set();p.on('pageerror',e=>errors.push(e.message));
  await p.goto(require('url').pathToFileURL(path.resolve(file)).href);
  assert.deepEqual(errors,[]);assert.equal(await p.locator('#nav button').count(),7);assert.equal(await p.locator('#field-before').inputValue(),oldSentinel.answers.before);
  const collect=async()=>{for(const text of await p.locator('[data-say]').evaluateAll(es=>es.map(e=>e.dataset.say)))audioTexts.add(text);};
  const nav=async n=>{const menu=p.locator('#courseMenu'),summary=menu.locator('summary').first();if(await summary.isVisible()&&!await menu.evaluate(e=>e.open))await summary.click();await p.locator(`#nav [data-page="${n}"]`).click();await collect();};
  const round=async n=>{await nav(1);await p.locator(`[data-task-round="${n}"]`).click();await collect();};
  const gate=async()=>{const first=await p.locator('#spoken').isDisabled()?'heard':'spoken';await p.locator('#'+first).check();await p.locator('#'+(first==='heard'?'spoken':'heard')).check();await collect();};
  const flow=async(branch=false)=>{
   await nav(2);await p.locator('[data-start]').first().click();
   const f=await p.evaluate(()=>flows[flow]);
   for(let i=0;i<f.steps.length;i++){
    const t=await p.evaluate(()=>currentStep());
    assert(await p.locator('[data-act="next"]').isDisabled());assert(await p.locator('[data-choice]').first().isDisabled());
    if(t.askFirst){assert.equal(await p.locator('.role-other [data-say]').count(),0);assert(await p.locator('#heard').isDisabled());}
    await gate();
    const bounds=await p.locator('.task-scene .role-frame').evaluateAll(es=>es.map(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom})));
    assert(bounds[0].bottom<=bounds[1].top,'Speaker always above learner');
    const wrong=t.objects.findIndex((_,n)=>!t.valid.includes(n));if(wrong>=0){await p.locator(`[data-choice="${wrong}"]`).click();assert(await p.locator('[data-act="next"]').isDisabled());assert.match(await p.locator('#flowFeedback').innerText(),/再試一次/);}
    let correct=t.valid[0];if(branch&&f.id==='round-c'&&t.id==='alternative')correct=2;if(branch&&f.id==='round-b'&&t.id==='color')correct=1;
    await p.locator(`[data-choice="${correct}"]`).click();
    if(i===0){await p.locator('#spoken').uncheck();assert(await p.locator('[data-choice]').first().isDisabled());await gate();await p.locator(`[data-choice="${correct}"]`).click();}
    await p.locator('[data-act="next"]').click();await collect();
   }
   assert.match(await p.locator('#main').innerText(),/流程完成/);
  };
  for(let n=0;n<d.rounds.length;n++){
   const r=d.rounds[n];await round(n);assert.equal(await p.locator('.task-phrase-grid>article').count(),r.phraseIds.length);
   await p.locator('[data-mode="reply"]').first().click();
   for(const id of r.replyIds){await p.locator(`[data-reply="${id}"]`).first().click();await collect();
    assert.equal(await p.locator('.dialogue-workshop .model-line').count(),0,'New exchange starts with text hidden');
    assert.equal(await p.locator('.role-other details[open]').count(),0);
    assert.equal(await p.locator('[data-listen-mode="practice"]').getAttribute('aria-pressed'),'true');
    await p.locator('[data-listen-mode="model"]').click();
    assert.equal(await p.locator('.dialogue-workshop .model-line').count(),1,'Text is available on request');
    assert.equal(await p.locator('.role-self details[open]').count(),0,'Own answer stays hidden');
    await p.locator('[data-listen-mode="practice"]').click();assert.equal(await p.locator('.model-line').count(),0);assert.equal(await p.locator('.role-other details[open]').count(),0);
    await p.locator(`[data-listen-choice="${d.replies[id].correct===0?1:0}"]`).click();assert.match(await p.locator('.listen-feedback').innerText(),/再聽一次/);
    await p.locator(`[data-listen-choice="${d.replies[id].correct}"]`).click();assert.match(await p.locator('.listen-feedback').innerText(),/✓/);
    await p.locator('[data-listen-mode="model"]').click();
   }
   await flow();
   await nav(3);assert.equal(await p.locator('[data-mission]').count(),r.missionIds.length);await p.locator('textarea').fill(`任務 ${r.id} 的自由回答`);
   await nav(4);assert.equal(await p.locator('[data-pair]').count(),r.pairIds.length);assert.equal(await p.locator('details.teacher[open]').count(),0);
   await p.locator('[data-pair-check]').first().check();await p.locator('textarea').fill(`真人 ${r.id} 的說法`);await collect();
   await p.locator('[data-task-done]').click();assert.equal(await p.evaluate(()=>page),n<d.rounds.length-1?1:5);
  }
  if(d.language==='en'){
   await round(1);await flow(true);assert.match(await p.locator('.scene-state').innerText(),/綠色/);
   await round(2);await flow(true);assert.match(await p.locator('.scene-state').innerText(),/不需付款/);
  }else{
   for(let n=0;n<3;n++){await round(n);await nav(2);const first=await p.evaluate(()=>currentStep().line);await p.locator('[data-route-variant]').click();assert.notEqual(await p.evaluate(()=>currentStep().line),first);for(let i=0;i<d.flows[n].steps.length;i++){await gate();const valid=await p.evaluate(()=>currentStep().valid[0]);await p.locator(`[data-choice="${valid}"]`).click();await p.locator('[data-act="next"]').click();}assert.match(await p.locator('#main').innerText(),/流程完成/);if(n===2)assert.match(await p.locator('.scene-state').innerText(),/5 分鐘/);}
  }
  await round(0);await nav(2);await gate();await p.locator('[data-choice="0"]').click();await p.locator('[data-act="next"]').click();await p.locator('[data-act="back"]').click();assert.equal(await p.evaluate(()=>turn),0);assert.equal(await p.evaluate(()=>history.length),0);assert(await p.locator('[data-choice]').first().isDisabled());
  await nav(5);assert.equal(await p.locator('#field-after').inputValue(),oldSentinel.answers.after);await p.locator('#field-after').fill('現在我能自己完成');const skill=d.course.skills[0].id;await p.locator(`[data-rating="${skill}:3"]`).click();assert.equal(await p.locator('.meter .green').count(),3);await p.locator(`[data-rating="${skill}:1"]`).click();assert.equal(await p.locator('.meter .green').count(),0);
  await nav(6);await p.locator('#field-home').fill('下次再練的說法');await p.locator('[data-home="spoken"]').check();await p.locator('#large').click();await p.locator('#theme').click();await p.reload();assert.equal(await p.locator('html').getAttribute('data-theme'),'dark');assert.equal(await p.locator('html').getAttribute('data-size'),'large');
  await nav(5);assert.equal(await p.locator('#field-after').inputValue(),'現在我能自己完成');await nav(6);assert.equal(await p.locator('#field-home').inputValue(),'下次再練的說法');assert(await p.locator('[data-home="spoken"]').isChecked());
  for(let n=0;n<d.rounds.length;n++){await round(n);await nav(3);assert.equal(await p.locator('textarea').inputValue(),`任務 ${d.rounds[n].id} 的自由回答`);await nav(4);assert(await p.locator('[data-pair-check]').first().isChecked());assert.equal(await p.locator('textarea').inputValue(),`真人 ${d.rounds[n].id} 的說法`);}
  assert.deepEqual(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)),d.previousLesson.key),oldSentinel,'Old records untouched');
  if(d.language==='ja'){
   const keys=Object.keys(require('./assets/day0-audio/manifest.json')).sort((a,b)=>b.length-a.length);for(const text of audioTexts){let rest=text;while(rest){const k=keys.find(k=>rest.startsWith(k));if(!k)break;rest=rest.slice(k.length);}assert.equal(rest,'','Missing audio: '+text);}
   await round(0);await p.locator('.task-phrase [data-say]').first().click();await p.waitForFunction(()=>testAudio.currentTime>.1&&!testAudio.paused);await p.locator('.task-phrase [data-slow]').first().click();await p.waitForFunction(()=>testAudio.currentTime>.1&&!testAudio.paused);assert.equal(await p.evaluate(()=>testAudio.playbackRate),.8);await nav(3);assert(await p.evaluate(()=>testAudio.paused));
   const decoded=await p.evaluate(async()=>{const ctx=new AudioContext(),result=[];for(const src of Object.values(day0Audio)){const b=await ctx.decodeAudioData(await(await fetch(src)).arrayBuffer());let peak=0;for(const x of b.getChannelData(0))peak=Math.max(peak,Math.abs(x));result.push(b.duration>.15&&peak>.005);}await ctx.close();return result;});assert(decoded.every(Boolean));
  }
  await round(0);
  for(const theme of ['light','dark'])for(const width of [1440,768,390,320]){
   await p.setViewportSize({width,height:1080});await p.evaluate(t=>{document.documentElement.dataset.theme=t;appearance();},theme);
   for(let v=0;v<7;v++){await nav(v);if(v===1)await p.locator('[data-mode="reply"]').first().click();const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert(!overflow,`${file} ${theme} ${width} view ${v} overflow`);if([1440,390].includes(width)&&[1,2,4,5].includes(v))await p.screenshot({path:`${out}/day${d.course.day}-${theme}-${width}-part${v+1}.png`,fullPage:true});}
  }
  assert.deepEqual(errors,[]);console.log(`PASS Day ${d.course.day}: ${d.rounds.length} complete task cycles, hearing practice, roles, branches, migration, persistence, audio and 56 responsive states.`);await context.close();
 }
 if(fs.existsSync(out+'/unchanged-before.json')){const before=JSON.parse(fs.readFileSync(out+'/unchanged-before.json','utf8'));for(const [f,hash] of Object.entries(before))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),hash,`${f} was unexpectedly changed`);console.log('PASS: other lesson HTML files unchanged.');}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
