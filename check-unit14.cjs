const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync('travel-english-unit14-travel-questions.html','utf8');
const code=html.match(/<script id="day14-app">([\s\S]*?)<\/script>/)[1];
assert.equal(code,['day14.js','day14-runtime.js'].map(f=>fs.readFileSync('assets/'+f,'utf8')).join('\n'));
assert.equal(html.match(/<style id="day14-styles">([\s\S]*?)<\/style>/)[1],fs.readFileSync('assets/day14.css','utf8'));
function boot(saved=[],blocked=false){const storage=new Map(saved),elements=new Map(),events={};const el=s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',textContent:'',hidden:false,open:false,dataset:{},focus(){},setAttribute(){}});return elements.get(s);};const ctx=vm.createContext({console,setTimeout:()=>1,clearTimeout(){},document:{querySelector:el,documentElement:{dataset:{theme:'light',size:'standard'}},addEventListener:(n,f)=>events[n]=f},window:{matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},scrollTo(){}},localStorage:{getItem(k){if(blocked)throw Error('blocked');return storage.get(k)},setItem(k,v){if(blocked)throw Error('blocked');storage.set(k,v)}}});vm.runInContext(code,ctx);return {run:s=>vm.runInContext(s,ctx),el,storage,events,click:dataset=>events.click({target:{closest:()=>({dataset,disabled:false})}}),check:(id,checked)=>events.change({target:{id,checked,dataset:{}}})};}
const b=boot([['other-lesson','keep me']]),{run,el,check,click}=b;
assert.equal(run('course.labels.length'),7);
assert.equal(run('phrases.length'),14);assert.equal(run('replies.length'),7);
for(let i=0;i<7;i++){run(`navigate(${i})`);assert(el('#main').innerHTML.length>1000);assert(!/<details[^>]* open/.test(el('#main').innerHTML));assert.equal((el('#nav').innerHTML.match(/data-page=/g)||[]).length,7);assert(!/匯出|下載/.test(el('#main').innerHTML));}
run('navigate(0)');assert(el('#main').innerHTML.indexOf('field-before')<el('#main').innerHTML.indexOf('兩趟任務'));assert(el('#main').innerHTML.includes(run('course.task')));run('navigate(5)');assert(el('#main').innerHTML.includes(run('course.task')));
const unlock=()=>{if(run('currentStep().askFirst')){check('heard',true);assert.equal(run('heard'),false);check('spoken',true);check('heard',true);}else{check('spoken',true);assert.equal(run('spoken'),false);check('heard',true);check('spoken',true);}};
let turns=0;
for(const [f,path,expected] of [[0,[0,0,1,0,1,0],['飯店大廳','09:00','Amy','13:00']],[0,[1,1,2,1,2,0],['博物館入口','10:00','Ben','14:00']],[1,[2,2,1,0],['飯店旁的咖啡廳','10:00','Ben']]]){
 run(`start(${f})`);
 for(const [t,c] of path.entries()){
  assert.equal(run('canNext()'),false);run('choose(0);next()');assert.equal(run('choice'),-1);assert.equal(run('turn'),t);
  unlock();
  for(let i=0;i<run('currentStep().objects.length');i++)if(!run(`accepted(currentStep(),${i})`)){run(`choose(${i});next()`);assert.equal(run('turn'),t);assert(!run('canNext()'));assert(el('#main').innerHTML.includes('再試一次'));}
  assert(run(`accepted(currentStep(),${c})`));run(`choose(${c});next()`);turns++;
 }
 assert(run('finished'));for(const word of expected)assert(run('sceneView().text').includes(word),word);
 assert(run('currentStep().line').includes(expected[2]));
}
assert.equal(turns,16);assert.equal(run('state.complete.length'),2);
// Returning to the destination clears all dependent meeting information.
run('start(0)');for(const c of [0,0,1]){unlock();run(`choose(${c});next()`);}run('back();back();back()');assert.equal(run('history.length'),0);unlock();run('choose(1);next()');assert(run('currentStep().line').includes('museum entrance'));assert.equal(run('itinerary().time'),'待詢問');unlock();run('choose(1)');check('spoken',false);assert.equal(run('heard'),false);assert.equal(run('selected("place")'),undefined);assert(!run('canNext()'));
run('start(1)');unlock();run('choose(2);next()');run('back()');assert.equal(run('itinerary().place'),'飯店大廳');
run('navigate(1)');click({mode:'reply'});for(const n of [3,6]){click({reply:String(n)});assert(el('#main').innerHTML.includes(`${n+1} / 7`));assert(!/<details[^>]* open/.test(el('#main').innerHTML));}assert(!el('#main').innerHTML.includes('data-reply="7"'));
// Independent fields, goals and ratings, including escaping and malformed saves.
const fields=JSON.parse(run('JSON.stringify(fields)'));
for(const key of fields)b.events.input({target:{dataset:{field:key},value:key+' <img src=x onerror=bad()> &'}});
run('navigate(5)');assert(el('#main').innerHTML.includes('&lt;img'));assert(!el('#main').innerHTML.includes('<img'));
for(const id of ['plan','change','chat'])b.events.change({target:{dataset:{pairCheck:id+':1'},checked:true}});
for(const [id,n] of [['where',1],['when',2],['who',3]])click({rating:id+':'+n});assert.equal((el('#main').innerHTML.match(/class="yellow"/g)||[]).length,3);assert.equal((el('#main').innerHTML.match(/class="green"/g)||[]).length,3);click({rating:'who:1'});assert(!el('#main').innerHTML.includes('class="green"'));
for(const key of ['listen','written','spoken'])b.events.change({target:{dataset:{home:key},checked:true}});
run('navigate(6)');click({quiz:'meeting:2'});assert(el('#main').innerHTML.includes('再聽一次'));click({quiz:'meeting:1'});assert(el('#main').innerHTML.includes('✓ hotel lobby'));
const restored=boot([...b.storage]);for(const key of fields)assert.equal(restored.run(`state.answers[${JSON.stringify(key)}]`),key+' <img src=x onerror=bad()> &');assert.equal(restored.run('state.complete.length'),2);assert.equal(restored.run('Object.values(state.checks).flat().filter(Boolean).length'),3);assert(restored.run('homeProgress()').includes('3 / 3'));assert.equal(restored.run('page'),0);assert.equal(b.storage.get('other-lesson'),'keep me');
for(const invalid of ['{broken','null'])assert(boot([[run('course.id'),invalid]]).run('storageFailed'));
const blocked=boot([],true);blocked.run('save();speak("hello")');assert(blocked.run('storageFailed'));assert(blocked.el('#toast').textContent.includes('無法朗讀'));
const weird=boot([[run('course.id'),JSON.stringify({answers:{before:7},checks:{plan:[true,'true',1]},ratings:{where:99},complete:['tour','bad','tour']})]]);assert.equal(weird.run('state.answers.before'),'');assert.equal(weird.run('state.ratings.where'),0);assert.equal(weird.run('state.complete.length'),1);assert.equal(weird.run('state.checks.plan.filter(Boolean).length'),1);
for(const m of html.matchAll(/href="([^"#]+\.html)"/g))assert(fs.existsSync(m[1]),m[1]);
for(const file of fs.readdirSync('.').filter(f=>/^travel-english.*\.html$/.test(f))){const h=fs.readFileSync(file,'utf8'),nav=h.match(/<nav class="day-switcher"[\s\S]*?<\/nav>/)?.[0];assert(nav,file+' navigation');assert.equal((nav.match(/href="travel-english-unit14-travel-questions.html"/g)||[]).length,1,file);for(const m of nav.matchAll(/href="([^"#]+\.html)"/g))assert(fs.existsSync(m[1]));}
assert(fs.readFileSync('index.html','utf8').includes('travel-english-unit14-travel-questions.html'));
assert(!/<script[^>]+src=|<img[^>]+src=|<link[^>]+href="(?!data:)/.test(html));
assert(!/day10|餐巾紙|婉拒|道歉|咖啡續杯/.test(code));
for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
console.log('PASS: 7 sections, 14 phrases, 7 replies; 3 paths / 16 steps; question-first gates, retries, dynamic card/dialogue, backtracking, independent storage/escaping, ratings, homework, fallbacks, standalone build and navigation.');
