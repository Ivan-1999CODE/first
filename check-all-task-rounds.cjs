const {chromium}=require('C:/Users/1090602/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),vm=require('vm'),{pathToFileURL}=require('url');
const baseline=require('./assets/curriculum-original.json');
const load=day=>day===0?require('./assets/day0-expanded.cjs'):day===2?require('./assets/day2-expanded.cjs'):require('./assets/curriculum-rounds.cjs').make(day);
const selected=process.argv.includes('--day0')?[0]:process.argv.includes('--day2')?[2]:baseline.map(x=>x.day);
const rows=baseline.filter(x=>selected.includes(x.day));
const out='tmp/all-rounds-qa';fs.mkdirSync(out,{recursive:true});
const report={lessons:[],originalEnglishCards:0,originalEnglishReplies:0,flows:0,steps:0,layoutStates:0,audio:0};
for(const row of rows){const d=load(row.day),mapped=d.rounds.flatMap(r=>[...r.phraseIds,...r.extraPhraseIds||[],...r.hearPhraseIds||[]]);
 for(const p of row.phrases){const en=Array.isArray(p)?p[1]:p.en;assert(d.phrases.some(p=>p.en===en),`Missing original phrase ${row.day}: ${en}`);}
 for(const q of row.replies){const line=q.line||q.en,found=d.replies.find(r=>r.line===line&&r.answer===q.answer&&r.changeAnswer===q.changeAnswer);assert(found,`Missing exchange ${row.day}: ${line}`);}
 for(const p of d.phrases)assert(mapped.includes(p.id)||d.support.some(s=>s.en===p.en),`Unreachable phrase ${row.day}: ${p.en}`);
 const replyIds=d.rounds.flatMap(r=>[...r.replyIds,...r.extraReplyIds||[]]);for(let i=0;i<d.replies.length;i++)assert(replyIds.includes(i),`Unreachable reply ${row.day} ${i}`);
 for(const group of ['flow','mission','pair']){const plural=group==='flow'?'flows':group==='mission'?'missions':'pairs';const mapped=d.rounds.flatMap(r=>r[group+'Ids']);for(let i=0;i<d[plural].length;i++)assert(mapped.includes(i),`Unmapped ${group} ${row.day}/${i}`);}
 for(const [,script]of fs.readFileSync(row.file,'utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script);
 if(row.day>0){report.originalEnglishCards+=row.phrases.length;report.originalEnglishReplies+=row.replies.length;}
 if([0,2].includes(row.day)){assert.equal(d.replies.length,12);assert.equal(d.flows.length,8);assert.equal(d.missions.length,8);}
}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
for(const row of rows){const d=load(row.day),old={answers:{before:'原有課前說法',after:'原有課後說法',home:'原有課後練習'},before:'原有課前說法',after:'原有課後說法',pairNote:'原有真人筆記',checks:{old:[true]},complete:['old-flow']};
 const context=await browser.newContext({viewport:{width:1440,height:1080}});await context.addInitScript(({key,old})=>{if(!localStorage.getItem('test-seeded')){localStorage.setItem(key,JSON.stringify(old));localStorage.setItem('test-seeded','true');}const NativeAudio=window.Audio;window.Audio=function(...args){const a=new NativeAudio(...args);window.qaAudio=a;return a;};},{key:d.previousLesson.key,old});
 const page=await context.newPage(),errors=[],audioTexts=new Set();page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve(row.file)).href);assert.equal(await page.locator('#nav button').count(),7);assert.deepEqual(errors,[]);
 const collect=async()=>{for(const t of await page.locator('[data-say]').evaluateAll(es=>es.map(e=>e.dataset.say)))audioTexts.add(t);};
 const nav=async n=>{await page.evaluate(n=>navigate(n),n);await collect();};
 const gates=async()=>{const first=await page.locator('#spoken').isDisabled()?'heard':'spoken';await page.locator('#'+first).check();await page.locator('#'+(first==='heard'?'spoken':'heard')).check();await collect();};
 for(let ri=0;ri<d.rounds.length;ri++){const r=d.rounds[ri];await nav(1);await page.locator(`[data-task-round="${ri}"]`).first().click();await collect();
  assert.equal(await page.locator('.task-phrase-grid>article').count(),r.phraseIds.length);
  if(r.hearPhraseIds)assert.equal(await page.locator('.hear-only details[open]').count(),0);
  await page.locator('[data-mode="reply"]').first().click();
  for(const id of [...r.replyIds,...r.extraReplyIds||[]]){if(r.extraReplyIds?.includes(id))await page.locator('details.panel').evaluate(e=>e.open=true);await page.locator(`[data-reply="${id}"]`).first().click();await collect();assert.equal(await page.locator('.model-line').count(),0);assert.equal(await page.locator('.role-other details[open]').count(),0);assert.equal(await page.locator('.role-self details[open]').count(),0);
   await page.locator('[data-listen-mode="model"]').click();assert.equal(await page.locator('.model-line').count(),1);await page.locator('[data-listen-mode="practice"]').click();assert.equal(await page.locator('.model-line').count(),0);
   const correct=d.replies[id].correct;await page.locator(`[data-listen-choice="${correct===0?1:0}"]`).click();assert.match(await page.locator('.listen-feedback').innerText(),/再聽/);await page.locator(`[data-listen-choice="${correct}"]`).click();assert.match(await page.locator('.listen-feedback').innerText(),/✓/);
  }
  for(const fi of r.flowIds){await nav(2);await page.locator(`[data-start="${fi}"]`).first().click();const f=d.flows[fi];for(let si=0;si<f.steps.length;si++){const t=await page.evaluate(()=>currentStep());assert(await page.locator('[data-act="next"]').isDisabled());assert(await page.locator('[data-choice]').first().isDisabled());if(t.askFirst){assert(await page.locator('#heard').isDisabled());assert.equal(await page.locator('.role-other [data-say]').count(),0);}await gates();
    const rects=await page.locator('.task-scene .role-frame').evaluateAll(es=>es.map(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom})));assert(rects[0].bottom<=rects[1].top,'Speaker stays above learner');
    const wrong=t.objects.findIndex((_,i)=>!t.valid.includes(i));if(wrong>=0){await page.locator(`[data-choice="${wrong}"]`).click();assert(await page.locator('[data-act="next"]').isDisabled());}
    await page.locator(`[data-choice="${t.valid[0]}"]`).click();if(si===0){await page.locator('#spoken').uncheck();assert(await page.locator('[data-act="next"]').isDisabled());await gates();await page.locator(`[data-choice="${t.valid[0]}"]`).click();}
    await page.locator('[data-act="next"]').click();report.steps++;
   }assert.match(await page.locator('#main').innerText(),/流程完成/);report.flows++;
  }
  for(const mi of r.missionIds){await nav(3);await page.locator(`[data-mission="${mi}"]`).click();await page.locator('textarea').fill(`情境 ${mi} 的說法`);await collect();}
  for(const pi of r.pairIds){await nav(4);await page.locator(`[data-pair="${pi}"]`).click();assert.equal(await page.locator('.teacher[open]').count(),0);await page.locator('[data-pair-check]').first().check();await page.locator('textarea').fill(`真人 ${pi} 筆記`);await collect();}
  await page.locator('[data-task-done]').click();assert.equal(await page.evaluate(()=>page),ri<d.rounds.length-1?1:5);
 }
 await nav(1);await page.locator('[data-task-round="0"]').click();await nav(2);await gates();await page.locator('[data-choice="0"]').click();await page.locator('[data-act="next"]').click();await page.locator('[data-act="back"]').click();assert.equal(await page.evaluate(()=>turn),0);assert.equal(await page.evaluate(()=>history.length),0);
 await nav(5);assert.match(await page.locator('#main').textContent(),/原有課前說法/);await page.locator('#field-after').fill('改版後能自己說');const skill=d.course.skills[0].id;await page.locator(`[data-rating="${skill}:3"]`).click();assert.equal(await page.locator('.meter .green').count(),3);await page.locator(`[data-rating="${skill}:1"]`).click();assert.equal(await page.locator('.meter .green').count(),0);
 await nav(6);for(const q of d.quizzes){await page.locator(`[data-quiz="${q.id}:${q.correct}"]`).click();}await page.locator('#field-home').fill('課後保留');await page.locator('.review-task').first().locator('summary').first().click();await page.locator('[data-field="review-A"]').fill('隔天重試保留');await page.locator('[data-home="spoken"]').check();await collect();
 await page.locator('#large').click();await page.locator('#theme').click();await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');assert.equal(await page.locator('html').getAttribute('data-size'),'large');await nav(5);assert.equal(await page.locator('#field-after').inputValue(),'改版後能自己說');await nav(6);assert.equal(await page.locator('#field-home').inputValue(),'課後保留');assert.equal(await page.locator('[data-field="review-A"]').inputValue(),'隔天重試保留');
 assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),d.previousLesson.key),old,'Old key untouched');
 for(let ri=0;ri<d.rounds.length;ri++){await nav(1);await page.locator(`[data-task-round="${ri}"]`).click();for(const mi of d.rounds[ri].missionIds){await nav(3);await page.locator(`[data-mission="${mi}"]`).click();assert.equal(await page.locator('textarea').inputValue(),`情境 ${mi} 的說法`);}for(const pi of d.rounds[ri].pairIds){await nav(4);await page.locator(`[data-pair="${pi}"]`).click();assert(await page.locator('[data-pair-check]').first().isChecked());assert.equal(await page.locator('textarea').inputValue(),`真人 ${pi} 筆記`);}}
 for(const width of [390,768,1440])for(const theme of ['light','dark']){await page.setViewportSize({width,height:1080});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);for(const n of [0,1,2,4,5,6]){await nav(n);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert(!overflow,`Overflow Day ${row.day}, ${width}, ${theme}, part ${n+1}`);report.layoutStates++;}if([0,2,7,11].includes(row.day)&&width!==768){await nav(1);await page.locator('[data-mode="reply"]').first().click();await page.screenshot({path:path.join(out,`day${row.day}-${theme}-${width}.png`),fullPage:true});}}
 if(row.day===0){await page.evaluate(()=>navigate(1));const clips=await page.evaluate(async()=>{const context=new AudioContext(),result=[];for(const [text,url]of Object.entries(day0Audio)){const bytes=Uint8Array.from(atob(url.split(',')[1]),c=>c.charCodeAt(0));const buffer=await context.decodeAudioData(bytes.buffer);const a=buffer.getChannelData(0);let peak=0;for(let i=0;i<a.length;i++)peak=Math.max(peak,Math.abs(a[i]));if(buffer.duration<.15||peak<.001)throw Error('Silent clip '+text);result.push(text);}await context.close();return result;});report.audio=clips.length;
  for(const text of audioTexts){const covered=await page.evaluate(text=>{let rest=text;const keys=Object.keys(day0Audio).sort((a,b)=>b.length-a.length);while(rest){const key=keys.find(k=>rest.startsWith(k));if(!key)return false;rest=rest.slice(key.length);}return true;},text);assert(covered,'Missing audio: '+text);}
  await page.evaluate(()=>speak('これはいくらですか。'));await page.waitForFunction(()=>window.qaAudio?.currentTime>.1);await page.evaluate(()=>speak('これはいくらですか。',true));await page.waitForFunction(()=>window.qaAudio?.currentTime>.1);assert.equal(await page.evaluate(()=>window.qaAudio.playbackRate),.8);await nav(0);assert(await page.evaluate(()=>window.qaAudio.paused));
 }
 assert.deepEqual(errors,[]);report.lessons.push({day:row.day,rounds:d.rounds.length,cards:d.phrases.length,replies:d.replies.length,flows:d.flows.length});console.log(`PASS Day ${row.day}: ${d.rounds.length} tasks, ${d.flows.length} flows, content retained, saved, responsive`);await context.close();
}
// Broken storage must leave the lesson usable.
const context=await browser.newContext();await context.addInitScript(()=>{Storage.prototype.setItem=function(){throw new Error('blocked');};});const page=await context.newPage();await page.goto(pathToFileURL(path.resolve(rows[0].file)).href);await page.locator('#field-before').fill('仍可練习');assert(await page.locator('#storageNotice').isVisible());await context.close();
fs.writeFileSync(path.join(out,selected.length===1?'report-day'+selected[0]+'.json':'report-all.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
